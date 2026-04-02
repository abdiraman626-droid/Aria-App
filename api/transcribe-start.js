// Submits an audio URL to AssemblyAI and returns the transcript ID immediately.
// The client polls api/transcribe-poll.js with that ID until completion.

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

  const submitRes = await fetch(`${ASSEMBLYAI_BASE}/v2/transcript`, {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_url: storageUrl, speech_models: ['universal-2'] }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.error || `AssemblyAI submit failed (${submitRes.status})` });
  }

  const { id } = await submitRes.json();
  return res.status(200).json({ id });
}
