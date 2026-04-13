import { GoogleAuthProvider, signInWithPopup, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

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

// ─── Connect Google (popup-based) ───────────────────────────────────────────

export async function connectGoogle() {
  // Ensure session persists across browser restarts
  await setPersistence(auth, browserLocalPersistence);

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  provider.setCustomParameters({ prompt: 'consent', access_type: 'offline' });

  // Attempt popup with one automatic retry if the user closes it
  let result;
  try {
    result = await signInWithPopup(auth, provider);
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') {
      // Retry once — user may have closed accidentally
      result = await signInWithPopup(auth, provider);
    } else {
      throw err;
    }
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);
  const googleAccessToken = credential.accessToken;
  if (!googleAccessToken) throw new Error('no_access_token');

  const expiry = Date.now() + 3600 * 1000;

  localStorage.setItem(TOKEN_KEY,  googleAccessToken);
  localStorage.setItem(EXPIRY_KEY, String(expiry));

  const uid = result.user.uid;
  await updateDoc(doc(db, 'users', uid), {
    googleConnected:   true,
    googleEmail:       result.user.email,
    googleAccessToken: googleAccessToken,
    googleTokenExpiry: expiry,
  });

  let profile = result.user;
  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });
    profile = await r.json();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch { /* use result.user as fallback */ }

  return { token: googleAccessToken, expiry, profile };
}

export function disconnectGoogle() {
  clearToken();
}

// ─── Google Calendar API ────────────────────────────────────────────────────

export async function fetchCalendarEvents() {
  const token = getToken();
  console.log('[ARIA Calendar] Token from getToken():', token ? `${token.slice(0, 15)}...${token.slice(-10)} (length: ${token.length})` : 'NULL');
  if (!token) throw new Error('no_token');

  const now = new Date().toISOString();
  const max = new Date(Date.now() + 7 * 864e5).toISOString();

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(max)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log('[ARIA Calendar] API response status:', res.status);
  if (res.status === 403) {
    const errorBody = await res.clone().json().catch(() => ({}));
    console.error('[ARIA Calendar] 403 error body:', JSON.stringify(errorBody, null, 2));
  }

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

// Decode HTML entities (Gmail snippets contain &#39; &amp; &quot; etc.)
function decodeHtmlEntities(str) {
  if (!str) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

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
  console.log('[ARIA Gmail] Token from getToken():', token ? `${token.slice(0, 15)}...${token.slice(-10)} (length: ${token.length})` : 'NULL');
  console.log('[ARIA Gmail] Token starts with "ya29."?', token?.startsWith('ya29.'));
  console.log('[ARIA Gmail] localStorage aria_google_token:', localStorage.getItem('aria_google_token')?.slice(0, 20) || 'EMPTY');
  console.log('[ARIA Gmail] localStorage aria_google_expiry:', localStorage.getItem('aria_google_expiry'), 'now:', Date.now());
  if (!token) throw new Error('no_token');

  // Fetch 5 most recent inbox emails regardless of read/unread status
  const q = encodeURIComponent('label:inbox');
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=${q}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log('[ARIA Gmail] API response status:', listRes.status);
  if (listRes.status === 403) {
    const errorBody = await listRes.clone().json().catch(() => ({}));
    console.error('[ARIA Gmail] 403 error body:', JSON.stringify(errorBody, null, 2));
  }

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
    const subject  = decodeHtmlEntities(headers.find(h => h.name === 'Subject')?.value || '(no subject)');

    const addrMatch   = rawFrom.match(/<([^>]+)>/);
    const emailAddr   = addrMatch ? addrMatch[1] : rawFrom;
    const displayName = rawFrom.replace(/\s*<[^>]+>/, '').replace(/"/g, '').trim() || emailAddr;

    const snippet    = decodeHtmlEntities(msg.snippet || '');
    const receivedAt = msg.internalDate
      ? new Date(parseInt(msg.internalDate, 10)).toISOString()
      : new Date().toISOString();

    // Extract full body text; decode entities, cap at 4000 chars
    const rawBody = decodeHtmlEntities(extractEmailBody(msg.payload));
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

// ─── AI email summarisation (via serverless proxy to Claude) ────────────

export async function summarizeEmails(emails) {
  if (!emails.length) return {};

  // Send emails to the serverless endpoint — API key is stored server-side
  const res = await fetch('/api/summarize-emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emails: emails.map(em => ({
        id: em.id,
        from: em.from,
        subject: em.subject,
        snippet: em.snippet,
        body: em.body,
      })),
    }),
  });

  if (!res.ok) {
    console.error('[ARIA Summarize] Server error:', res.status);
    return {};
  }

  const data = await res.json();
  const out = {};
  (data.summaries || []).forEach(s => { out[s.id] = s.summary; });
  return out;
}
