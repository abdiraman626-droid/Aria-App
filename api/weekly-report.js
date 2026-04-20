// Vercel serverless function — generates weekly meeting report via Claude
// and optionally sends via WhatsApp (WasenderAPI).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { meetings, userName, phone, email, lang } = req.body || {};
  if (!meetings?.length) return res.status(400).json({ error: 'No meetings provided' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  const langInstruction = lang === 'ar' ? 'Respond in Arabic.' : lang === 'so' ? 'Respond in Somali.' : lang === 'sw' ? 'Respond in Swahili.' : 'Respond in English.';

  // Generate summary with Claude
  const meetingList = meetings.map((m, i) =>
    `${i + 1}. "${m.title}" — ${m.createdAt}\nSummary: ${m.summary || 'No summary'}\nAction Items: ${(m.actionItems || []).join(', ') || 'None'}`
  ).join('\n\n');

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: `Generate a concise weekly meeting report for ${userName || 'the team'}. ${langInstruction}

Include:
1. Overview (how many meetings, total action items)
2. Key decisions made
3. Outstanding action items (who needs to do what)
4. Priorities for next week

Meetings this week:
${meetingList}` }],
      }),
    });

    if (!claudeRes.ok) throw new Error('Claude API error');
    const claudeData = await claudeRes.json();
    const report = claudeData.content?.[0]?.text || 'Report generation failed';

    // Send via WhatsApp if phone provided
    if (phone) {
      const wasenderKey = process.env.WASENDER_API_KEY || process.env.VITE_WASENDER_API_KEY;
      if (wasenderKey) {
        await fetch('https://api.wasenderapi.com/api/send-message', {
          method: 'POST',
          headers: { Authorization: `Bearer ${wasenderKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: phone.replace(/\D/g, ''), text: `📊 *ARIA Weekly Meeting Report*\n\n${report}` }),
        }).catch(() => {});
      }
    }

    return res.status(200).json({ report });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Report generation failed' });
  }
}
