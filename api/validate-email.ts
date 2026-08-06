import { isValidEmailStrict } from "./_utils/mailer";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email } = body || {};

    const validation = isValidEmailStrict(email);
    if (!validation.valid) {
      res.status(400).json({ valid: false, reason: validation.reason });
      return;
    }

    res.status(200).json({ valid: true, email: email.trim().toLowerCase() });
  } catch (err: any) {
    res.status(500).json({ valid: false, reason: "Server error during email validation" });
  }
}
