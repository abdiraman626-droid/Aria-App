// Vercel serverless function — sends WhatsApp messages via WasenderAPI.
// Keeps the API key server-side.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, message } = req.body || {};
  if (!phone || !message) return res.status(400).json({ error: 'phone and message are required' });

  const key = process.env.WASENDER_API_KEY || process.env.VITE_WASENDER_API_KEY;
  if (!key) return res.status(500).json({ error: 'WASENDER_API_KEY is not set on the server' });

  try {
    const upstream = await fetch('https://api.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone.replace(/\D/g, ''),
        text: message,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({
        error: err.message || err.error || `WasenderAPI error ${upstream.status}`,
      });
    }

    const data = await upstream.json();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send WhatsApp message' });
  }
}
