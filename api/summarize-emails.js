// Vercel serverless function — summarizes Gmail emails via Claude API.
// Keeps the API key server-side instead of exposing it to the browser.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { emails } = req.body || {};
  if (!emails?.length) return res.status(400).json({ error: 'No emails provided' });

  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on the server' });

  const emailList = emails.map((em, i) =>
    `[${i + 1}] id:${em.id}\nFrom: ${em.from}\nSubject: ${em.subject}\n` +
    `Body:\n${em.body || em.snippet || '(no body)'}`
  ).join('\n\n---\n\n');

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Summarize each email in exactly 2-3 sentences. Each summary must cover:
1. WHO sent it (name and/or organization)
2. WHAT it's about (the main topic or request)
3. ACTION needed (what the recipient should do, or "No action needed" if informational)

Be concise but specific. The user should fully understand the email without opening it.

Return ONLY valid JSON, no markdown fences:
{"summaries":[{"id":"<email id>","summary":"<2-3 sentence summary>"}]}

Emails:
${emailList}`,
        }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.error?.message || `Claude error ${upstream.status}` });
    }

    const data = await upstream.json();
    const text = data.content?.[0]?.text || '';

    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] || text);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Summarization failed' });
  }
}
