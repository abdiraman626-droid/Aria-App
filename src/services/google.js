import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const TOKEN_KEY   = 'aria_google_token';
const EXPIRY_KEY  = 'aria_google_expiry';
const PROFILE_KEY = 'aria_google_profile';

// ─── Token storage ─────────────────────────────────────────────────────────

export function getToken() {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
  if (!token || Date.now() > expiry - 60_000) return null;
  return token;
}

export function getExpiry() {
  return parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
}

export function restoreToken(token, expiry) {
  localStorage.setItem(TOKEN_KEY,  token);
  localStorage.setItem(EXPIRY_KEY, String(expiry));
}


export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function getProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); }
  catch { return null; }
}

// ─── OAuth token flow ───────────────────────────────────────────────────────

export async function connectGoogle() {
  const result     = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) throw new Error('no_credential');

  const token  = credential.accessToken;
  const expiry = Date.now() + 3600 * 1000;
  localStorage.setItem(TOKEN_KEY,  token);
  localStorage.setItem(EXPIRY_KEY, String(expiry));

  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profile = await r.json();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return { token, expiry, profile };
  } catch {
    return { token, expiry, profile: result.user };
  }
}

export function disconnectGoogle() {
  clearToken();
}

// ─── Google Calendar API ────────────────────────────────────────────────────

export async function fetchCalendarEvents() {
  const token = getToken();
  if (!token) throw new Error('no_token');

  const now = new Date().toISOString();
  const max = new Date(Date.now() + 7 * 864e5).toISOString();

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(max)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 401) { clearToken(); throw new Error('token_expired'); }
  if (!res.ok) throw new Error('calendar_api_error');

  const data = await res.json();
  return (data.items || []).map(ev => ({
    id:       ev.id,
    summary:  ev.summary || '(no title)',
    start:    ev.start,
    location: ev.location || null,
  }));
}

// ─── Gmail API ──────────────────────────────────────────────────────────────

// Decode base64url (Gmail uses URL-safe base64)
function decodeBase64url(str) {
  try {
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return '';
  }
}

// Recursively walk MIME payload tree and return the best plain-text body
function extractEmailBody(payload) {
  if (!payload) return '';

  // Inline body (simple messages)
  if (payload.body?.data) {
    const raw = decodeBase64url(payload.body.data);
    // If HTML, strip tags
    if (payload.mimeType === 'text/html') {
      return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return raw;
  }

  if (!payload.parts?.length) return '';

  // Prefer text/plain; fall back to text/html; recurse into multipart/*
  const plainPart = payload.parts.find(p => p.mimeType === 'text/plain');
  if (plainPart?.body?.data) return decodeBase64url(plainPart.body.data);

  const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
  if (htmlPart?.body?.data) {
    return decodeBase64url(htmlPart.body.data)
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Recurse into nested multipart parts
  for (const part of payload.parts) {
    const text = extractEmailBody(part);
    if (text) return text;
  }
  return '';
}

export async function fetchGmailMessages() {
  const token = getToken();
  if (!token) throw new Error('no_token');

  // Fetch 5 most recent inbox emails regardless of read/unread status
  const q = encodeURIComponent('label:inbox');
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=${q}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (listRes.status === 401) { clearToken(); throw new Error('token_expired'); }
  if (!listRes.ok) throw new Error('gmail_api_error');

  const listData = await listRes.json();
  if (!listData.messages?.length) return [];

  // Fetch full message (body + headers) for each message in parallel
  const details = await Promise.all(
    listData.messages.slice(0, 5).map(m =>
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json())
    )
  );

  return details.map(msg => {
    const headers = msg.payload?.headers || [];
    const rawFrom  = headers.find(h => h.name === 'From')?.value    || 'Unknown';
    const subject  = headers.find(h => h.name === 'Subject')?.value || '(no subject)';

    const addrMatch   = rawFrom.match(/<([^>]+)>/);
    const emailAddr   = addrMatch ? addrMatch[1] : rawFrom;
    const displayName = rawFrom.replace(/\s*<[^>]+>/, '').replace(/"/g, '').trim() || emailAddr;

    const snippet    = msg.snippet || '';
    const receivedAt = msg.internalDate
      ? new Date(parseInt(msg.internalDate, 10)).toISOString()
      : new Date().toISOString();

    // Extract full body text; cap at 4000 chars to keep AI prompts manageable
    const rawBody = extractEmailBody(msg.payload);
    const body    = rawBody.slice(0, 4000);

    return {
      id: msg.id,
      from: displayName,
      email: emailAddr,
      subject,
      snippet,
      body,
      receivedAt,
      labelIds: msg.labelIds || [],
    };
  }).slice(0, 5);
}

// ─── AI email summarisation (single Claude call for all emails) ───────────

export async function summarizeEmails(emails) {
  const key = import.meta.env.VITE_ANTHROPIC_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key || !emails.length) return {};

  const emailList = emails.map((em, i) =>
    `[${i + 1}] id:${em.id}\nFrom: ${em.from}\nSubject: ${em.subject}\n` +
    `Body:\n${em.body || em.snippet || '(no body)'}`
  ).join('\n\n---\n\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `For each email, write exactly one clear sentence summarizing what it is about. One sentence only — no bullet points, no extra detail.

Return ONLY valid JSON, no markdown:
{"summaries":[{"id":"<email id>","summary":"<one sentence>"}]}

Emails:
${emailList}`,
      }],
    }),
  });

  if (!res.ok) return {};
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] || text);
    const out = {};
    (parsed.summaries || []).forEach(s => { out[s.id] = s.summary; });
    return out;
  } catch {
    return {};
  }
}
