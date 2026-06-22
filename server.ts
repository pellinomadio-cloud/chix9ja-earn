import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_175f7284778cfb3d3022a00e7be2ac5d351f040b";

async function startServer() {
  const app = express();
  app.use(express.json());

  // Paystack verification API
  app.post("/api/verify-account", async (req: express.Request, res: express.Response) => {
    try {
      const { accountNumber, bankCode } = req.body;

      if (!accountNumber || !bankCode) {
         res.status(400).json({ error: "Missing accountNumber or bankCode in request body" });
         return;
      }

      console.log(`Resolving bank account: Bank Code: ${bankCode}, Account Nu: ${accountNumber}`);

      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.status) {
        console.error("Paystack API error:", data);
        res.status(400).json({
          error: data.message || "Failed to verify account with Paystack. Please check the details.",
        });
        return;
      }

      console.log("Account verified successfully:", data.data);
      res.json({
        success: true,
        accountName: data.data.account_name,
        accountNumber: data.data.account_number,
        bankId: data.data.bank_id,
      });
    } catch (err: any) {
      console.error("Internal service error during paystack resolution:", err);
      res.status(500).json({ error: err.message || "Internal server error during account verification." });
    }
  });

  // Vite Integration for Full-Stack development / production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static asset routing active.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
