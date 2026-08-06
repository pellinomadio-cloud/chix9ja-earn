import { isValidEmailStrict, createTransporter } from "./_utils/mailer";

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
    const { email, name } = body || {};

    const validation = isValidEmailStrict(email);
    if (!validation.valid) {
      res.status(400).json({ error: validation.reason || "Invalid email address" });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name ? String(name).trim() : 'Valued Member';
    const transporter = await createTransporter();
    const fromAddress = process.env.SMTP_FROM || '"chix9ja Welcome Team" <welcome@chix9ja.com>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #05180f; color: #ffffff; padding: 25px; border-radius: 14px; max-width: 600px; margin: 0 auto; border: 2px solid #10b981;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background: #f59e0b; color: #000; font-weight: 900; font-size: 22px; padding: 8px 18px; border-radius: 8px; font-style: italic;">
            chix9ja
          </span>
        </div>
        <h2 style="color: #f59e0b; border-bottom: 1px solid #065f46; padding-bottom: 10px; text-align: center;">
          🎉 Congratulations & Welcome to chix9ja!
        </h2>
        <p style="font-size: 15px; line-height: 1.6; color: #ecfdf5;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #ecfdf5;">
          Your official chix9ja account has been successfully created and registered under email: <strong style="color: #34d399;">${cleanEmail}</strong>.
        </p>
        <div style="background-color: #064e3b; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 14px; color: #d1fae5;">
            <strong>🚀 What's next?</strong> You can now log into your account, explore daily task rewards, buy airtime/data, link bank accounts, and participate in chix9ja community promotions.
          </p>
        </div>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #065f46; text-align: center; font-size: 11px; color: #6ee7b7;">
          Thank you for joining chix9ja! If you have any questions, our support hub is always open.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: "🎉 Welcome to chix9ja - Your Account is Ready!",
      html: htmlContent,
      text: `Hello ${displayName},\n\nWelcome to chix9ja! Your account (${cleanEmail}) is ready.`
    });

    res.status(200).json({ success: true, message: `Welcome email dispatched to ${cleanEmail}` });
  } catch (err: any) {
    console.error("Error sending welcome email in serverless function:", err);
    res.status(500).json({ error: "Failed to dispatch welcome email", details: err.message });
  }
}
