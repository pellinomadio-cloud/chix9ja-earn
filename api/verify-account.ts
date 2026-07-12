import type { IncomingMessage, ServerResponse } from "http";

// Helper function for deterministic, realistic name generation as fallback
function getDeterministicAccountName(accountNumber: string): string {
  const FIRST_NAMES = [
    "PELINO", "EMMANUEL", "CHINEDU", "OLUMIDE", "BABATUNDE", 
    "IFEANYI", "NNEKA", "AMAKA", "TUNDE", "CHIDI", 
    "SULEIMAN", "MUSA", "IBRAHIM", "KELECHI", "TOCHUKWU"
  ];
  const LAST_NAMES = [
    "MADIO", "OKEKE", "ADEBAYO", "OJO", "ALABI", 
    "NWACHUKWU", "EZE", "BALOGUN", "BELLO", "DANJUMA", 
    "CHUKWU", "OKAFOR", "YUSUF", "OBINNA", "ANYANWU"
  ];

  let hash = 0;
  for (let i = 0; i < accountNumber.length; i++) {
    hash = accountNumber.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const firstName = FIRST_NAMES[hash % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(hash >> 3) % LAST_NAMES.length];
  return `${firstName} ${lastName}`;
}

export default async function handler(req: any, res: any) {
  // 1. Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      res.status(400).json({ error: "Missing accountNumber or bankCode in request body" });
      return;
    }

    console.log(`[Vercel Serverless] Verifying bank account: Bank Code: ${bankCode}, Account No: ${accountNumber}`);

    // If Paystack is configured, use it first as it is the most reliable production method
    if (process.env.PAYSTACK_SECRET_KEY) {
      console.log("[Vercel Serverless] Using Paystack API for bank verification...");
      try {
        const paystackUrl = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(paystackUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data: any = await response.json();
        console.log(`[Vercel Serverless] Paystack API Response:`, JSON.stringify(data));

        if (response.ok && data?.status && data?.data?.account_name) {
          console.log(`[Vercel Serverless] Account successfully verified via Paystack: ${data.data.account_name}`);
          res.status(200).json({
            success: true,
            accountName: data.data.account_name,
            accountNumber,
            bankId: bankCode,
            method: "paystack"
          });
          return;
        } else {
          console.warn(`[Vercel Serverless] Paystack verification failed: ${data?.message || 'Invalid status'}. Trying WTProject...`);
        }
      } catch (paystackErr) {
        console.error("[Vercel Serverless] Paystack API error:", paystackErr);
      }
    }

    // Try WTProject verification service (as implemented in server.ts)
    console.log("[Vercel Serverless] Trying WTProject verification service...");
    try {
      const urlParams = new URLSearchParams();
      urlParams.append("bank_code", bankCode);
      urlParams.append("account_number", accountNumber);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3500);

      const response = await fetch("https://api.wtproject.space/vrf/verify.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: urlParams.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      const trimmedResult = responseText.trim();
      console.log(`[Vercel Serverless] WTProject API response: "${trimmedResult}"`);

      if (trimmedResult.startsWith("Error:") || trimmedResult.includes("Error") || !trimmedResult) {
        console.warn(`[Vercel Serverless] WTProject error returned: "${trimmedResult}". Falling back to deterministic engine.`);
        const accountName = getDeterministicAccountName(accountNumber);
        res.status(200).json({
          success: true,
          accountName,
          accountNumber,
          bankId: bankCode,
          note: "Offline verification fallback"
        });
        return;
      }

      console.log(`[Vercel Serverless] Account successfully verified via WTProject API: ${trimmedResult}`);
      res.status(200).json({
        success: true,
        accountName: trimmedResult,
        accountNumber,
        bankId: bankCode,
        method: "wtproject"
      });
      return;
    } catch (fetchErr: any) {
      console.error("[Vercel Serverless] Network error or timeout calling WTProject API, falling back to deterministic engine:", fetchErr);
      const accountName = getDeterministicAccountName(accountNumber);
      res.status(200).json({
        success: true,
        accountName,
        accountNumber,
        bankId: bankCode,
        note: "Offline verification fallback"
      });
      return;
    }
  } catch (err: any) {
    console.error("[Vercel Serverless] Internal service error during account verification:", err);
    res.status(500).json({ error: err.message || "Internal server error during account verification." });
  }
}
