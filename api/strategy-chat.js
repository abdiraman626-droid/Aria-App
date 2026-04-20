// Vercel serverless function — AI strategy advisor powered by Claude.
// Handles business plans, marketing, financial projections, competitor analysis.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, userName, lang } = req.body || {};
  if (!messages?.length) return res.status(400).json({ error: 'No messages provided' });

  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });

  const langInstruction = lang === 'ar' ? 'Respond in Arabic.'
    : lang === 'so' ? 'Respond in Somali.'
    : lang === 'sw' ? 'Respond in Swahili.'
    : 'Respond in English.';

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: `You are ARIA Strategy Advisor, an AI business consultant for ${userName || 'the user'}. You help with:
- Business plans and proposals
- Marketing strategies and campaigns
- Financial projections and budgets
- Competitor analysis and market research
- Growth strategies and scaling plans
- Product roadmaps and go-to-market plans

${langInstruction}

Provide detailed, actionable advice. Use clear headings, bullet points, and numbers where appropriate. Be specific to the East African / Kenyan market when relevant. Format responses with markdown headings (##), bold (**text**), and bullet points for readability.`,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.error?.message || `Claude error ${upstream.status}` });
    }

    const data = await upstream.json();
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Strategy chat failed' });
  }
}
