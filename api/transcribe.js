// Vercel serverless function — receives a Firebase Storage URL, submits it
// to AssemblyAI for transcription, polls until complete, and returns the text.

const ASSEMBLYAI_BASE = 'https://api.assemblyai.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { storageUrl } = req.body || {};
  if (!storageUrl) return res.status(400).json({ error: 'No storageUrl provided' });

  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) return res.status(500).json({ error: 'ASSEMBLYAI_API_KEY is not set on the server' });

  const headers = {
    Authorization: key,
    'Content-Type': 'application/json',
  };

  // 1. Submit the audio URL to AssemblyAI
  const submitRes = await fetch(`${ASSEMBLYAI_BASE}/v2/transcript`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ audio_url: storageUrl, speech_models: ['universal-2'] }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.error || `AssemblyAI submit failed (${submitRes.status})` });
  }

  const { id } = await submitRes.json();

  // 2. Poll until status is completed or error
  while (true) {
    await new Promise(r => setTimeout(r, 3000));

    const pollRes = await fetch(`${ASSEMBLYAI_BASE}/v2/transcript/${id}`, { headers });
    if (!pollRes.ok) {
      const err = await pollRes.json().catch(() => ({}));
      return res.status(502).json({ error: err.error || `AssemblyAI poll failed (${pollRes.status})` });
    }

    const data = await pollRes.json();

    if (data.status === 'completed') {
      return res.status(200).json({ text: data.text });
    }

    if (data.status === 'error') {
      return res.status(500).json({ error: data.error || 'AssemblyAI transcription error' });
    }

    // status is 'queued' or 'processing' — keep polling
  }
}
