// Vercel serverless function — handles AI assistant chat via Claude API.
// Receives user query + context (reminders, calendar events), returns AI response.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, userName, reminders, calendarEvents, lang } = req.body || {};
  if (!query) return res.status(400).json({ error: 'No query provided' });

  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });

  // Build context from user's reminders and calendar events
  const now = new Date().toISOString();
  let context = `Current time: ${now}\nUser name: ${userName || 'User'}\n`;

  if (reminders?.length) {
    context += `\nUpcoming reminders:\n`;
    reminders.slice(0, 10).forEach((r, i) => {
      context += `${i + 1}. "${r.title}" — ${r.dateTime}${r.priority === 'high' ? ' [URGENT]' : ''}\n`;
    });
  }

  if (calendarEvents?.length) {
    context += `\nUpcoming calendar events:\n`;
    calendarEvents.slice(0, 10).forEach((e, i) => {
      context += `${i + 1}. "${e.title}" — ${e.dateTime}${e.notes ? ` (${e.notes})` : ''}\n`;
    });
  }

  const langInstruction = lang === 'ar' ? 'Respond in Arabic.'
    : lang === 'so' ? 'Respond in Somali.'
    : lang === 'sw' ? 'Respond in Swahili.'
    : 'Respond in English.';

  // Check if the user wants to create an event or reminder
  const createInstruction = `If the user asks to CREATE, ADD, or SCHEDULE a meeting, event, task, appointment, or reminder, extract the details and respond with ONLY valid JSON (no markdown) in this format:
{"action":"create_event","title":"...","dateTime":"YYYY-MM-DDTHH:mm","type":"meeting|task|appointment","notes":"..."}
or for reminders:
{"action":"create_reminder","title":"...","dateTime":"YYYY-MM-DDTHH:mm","priority":"high|medium|low"}

If the user is NOT asking to create something, respond with a helpful natural language answer about their schedule. Keep responses concise (2-3 sentences max).`;

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
        max_tokens: 512,
        system: `You are ARIA, an AI assistant for busy professionals. You help manage schedules, reminders, and meetings. ${langInstruction}\n\n${createInstruction}\n\nUser context:\n${context}`,
        messages: [{ role: 'user', content: query }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.error?.message || `Claude error ${upstream.status}` });
    }

    const data = await upstream.json();
    const text = data.content?.[0]?.text || '';

    // Try to parse as action JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action) {
          return res.status(200).json({ action: parsed.action, data: parsed, text: null });
        }
      }
    } catch { /* not JSON, treat as text response */ }

    return res.status(200).json({ action: null, data: null, text });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'AI chat failed' });
  }
}
