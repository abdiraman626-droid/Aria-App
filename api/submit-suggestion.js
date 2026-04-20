// Vercel serverless function — sends suggestion email via Nodemailer (Gmail SMTP).
// Firestore save is handled client-side. This endpoint only sends the email notification.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userName, userEmail, type, message } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    // Email not configured — still return success since Firestore save happened client-side
    return res.status(200).json({ success: true, emailSent: false });
  }

  try {
    // Dynamic import nodemailer to keep cold starts fast
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const typeLabel = type === 'bug' ? '🐛 Bug Report' : type === 'feature' ? '💡 Feature Request' : '💬 Feedback';

    await transporter.sendMail({
      from: `"ARIA Suggestions" <${gmailUser}>`,
      to: 'abdiraman626@gmail.com',
      subject: `[ARIA] ${typeLabel} from ${userName || 'User'}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#4F6EF7;margin-bottom:4px">${typeLabel}</h2>
          <p style="color:#666;margin-top:0">ARIA Life — User Suggestion</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;width:100px"><strong>Name</strong></td><td>${userName || 'Anonymous'}</td></tr>
            <tr><td style="padding:8px 0;color:#888"><strong>Email</strong></td><td>${userEmail || 'Not provided'}</td></tr>
            <tr><td style="padding:8px 0;color:#888"><strong>Type</strong></td><td>${typeLabel}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
          <div style="background:#f8f9fa;padding:16px;border-radius:8px;font-size:14px;line-height:1.7;white-space:pre-wrap">${message.trim()}</div>
          <p style="color:#999;font-size:12px;margin-top:24px">Sent from ARIA Life app</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, emailSent: true });
  } catch (err) {
    console.error('Email failed:', err.message);
    // Still return success — Firestore save is the primary storage
    return res.status(200).json({ success: true, emailSent: false, error: err.message });
  }
}
