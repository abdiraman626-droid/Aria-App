// Vercel serverless function — proxies transcript summarization through Claude
// server-side to avoid CORS restrictions on direct browser → Anthropic calls.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { transcript } = req.body || {};
  if (!transcript) return res.status(400).json({ error: 'No transcript provided' });

  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on the server' });

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a professional meeting assistant for Kenyan business professionals. Analyze this meeting transcript and respond with ONLY valid JSON in exactly this structure — no markdown, no explanation:
{
  "summary": "2-3 sentence summary of what was discussed and decided",
  "actionItems": ["action item 1", "action item 2"],
  "followUps": ["follow-up 1", "follow-up 2"]
}

Keep action items concrete and assignable. Keep follow-ups as things to check on later.

Transcript:
${transcript}`,
      }],
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json({ error: err.error?.message || `Claude error ${upstream.status}` });
  }

  const data = await upstream.json();
  const text = data.content?.[0]?.text || '';

  try {
    const match = text.match(/\{[\s\S]*\}/);
    return res.status(200).json(JSON.parse(match?.[0] || text));
  } catch {
    return res.status(200).json({ summary: text, actionItems: [], followUps: [] });
  }
}
