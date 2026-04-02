// Checks the status of an AssemblyAI transcript by ID.
// Returns { status: 'processing' } while queued/processing,
// { status: 'completed', text } when done, or { status: 'error', error } on failure.

const ASSEMBLYAI_BASE = 'https://api.assemblyai.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'No transcript id provided' });

  const key = process.env.ASSEMBLYAI_API_KEY;
  if (!key) return res.status(500).json({ error: 'ASSEMBLYAI_API_KEY is not set on the server' });

  const pollRes = await fetch(`${ASSEMBLYAI_BASE}/v2/transcript/${id}`, {
    headers: { Authorization: key },
  });

  if (!pollRes.ok) {
    const err = await pollRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.error || `AssemblyAI poll failed (${pollRes.status})` });
  }

  const data = await pollRes.json();

  if (data.status === 'completed') {
    return res.status(200).json({ status: 'completed', text: data.text });
  }

  if (data.status === 'error') {
    return res.status(200).json({ status: 'error', error: data.error || 'AssemblyAI transcription error' });
  }

  // queued or processing
  return res.status(200).json({ status: 'processing' });
}
