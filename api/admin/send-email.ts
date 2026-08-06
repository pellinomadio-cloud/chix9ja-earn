import { isValidEmailStrict, createTransporter } from "../_utils/mailer";

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
    const { subject, message, recipients } = body || {};

    if (!subject || !message) {
      res.status(400).json({ error: "Missing email subject or message body." });
      return;
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ error: "Recipients list must be a non-empty array." });
      return;
    }

    const validRecipients: string[] = [];
    const invalidRecipients: string[] = [];

    for (const em of recipients) {
      const val = isValidEmailStrict(em);
      if (val.valid) {
        validRecipients.push(em.trim().toLowerCase());
      } else {
        invalidRecipients.push(em);
      }
    }

    if (validRecipients.length === 0) {
      res.status(400).json({
        error: "None of the provided recipient email addresses passed strict syntax & domain validation.",
        invalidRecipients
      });
      return;
    }

    const transporter = await createTransporter();
    const fromAddress = process.env.SMTP_FROM || '"chix9ja Admin Office" <admin@chix9ja.com>';
    const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    const sendPromises = validRecipients.map(async (targetEmail) => {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #05180f; color: #ffffff; padding: 25px; border-radius: 14px; max-width: 600px; margin: 0 auto; border: 2px solid #10b981;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background: #f59e0b; color: #000; font-weight: 900; font-size: 22px; padding: 8px 18px; border-radius: 8px; font-style: italic;">
              chix9ja
            </span>
          </div>
          <h2 style="color: #f59e0b; border-bottom: 1px solid #065f46; padding-bottom: 10px;">
            ${subject}
          </h2>
          <div style="font-size: 15px; line-height: 1.7; color: #ecfdf5; white-space: pre-wrap; margin: 20px 0;">
            ${message}
          </div>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #065f46; text-align: center; font-size: 11px; color: #6ee7b7;">
            This message was sent by the Official chix9ja Admin Desk to registered valid email: ${targetEmail}
          </div>
        </div>
      `;

      return transporter.sendMail({
        from: fromAddress,
        to: targetEmail,
        subject: `[chix9ja] ${subject}`,
        html: htmlContent,
        text: message
      });
    });

    const results = await Promise.allSettled(sendPromises);
    const sentCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    res.status(200).json({
      success: true,
      message: isSmtpConfigured
        ? `Broadcast completed via SMTP. Delivered to ${sentCount} user(s).`
        : `Broadcast processed and registered in system mail log for ${sentCount} user(s).`,
      sentCount,
      failedCount,
      smtpConfigured: isSmtpConfigured,
      invalidRecipients
    });
  } catch (err: any) {
    console.error("Error sending admin email broadcast in serverless function:", err);
    res.status(500).json({ error: "Failed to dispatch email broadcast: " + (err.message || String(err)) });
  }
}
