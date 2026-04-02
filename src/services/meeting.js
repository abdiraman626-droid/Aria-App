import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

const WASENDER_KEY = import.meta.env.VITE_WASENDER_API_KEY;

// ── Upload to Firebase Storage → AssemblyAI transcription via serverless ──
// onProgress(pct 0-100) fires during the Firebase Storage upload phase.
export async function transcribeAudio(blob, uid, onProgress) {
  const ext = blob.type.includes('webm') ? 'webm'
    : blob.type.includes('ogg')  ? 'ogg'
    : blob.type.includes('mp4')  ? 'mp4'
    : blob.type.includes('wav')  ? 'wav'
    : blob.type.includes('mpeg') ? 'mp3'
    : 'webm';

  // 1. Upload to uid-scoped temp path in Firebase Storage
  const storageRef = ref(storage, `meetings/temp/${uid}/${Date.now()}.${ext}`);

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, { contentType: blob.type });
    task.on('state_changed',
      snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      resolve,
    );
  });
  onProgress?.(100);

  // 2. Get the self-authenticating download URL
  const storageUrl = await getDownloadURL(storageRef);

  // 3. Submit to AssemblyAI via serverless — returns transcript ID immediately
  let transcriptId;
  try {
    const startRes = await fetch('/api/transcribe-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storageUrl }),
    });
    if (!startRes.ok) {
      const err = await startRes.json().catch(() => ({}));
      throw new Error(err.error || `Transcription start error ${startRes.status}`);
    }
    transcriptId = (await startRes.json()).id;
  } catch (err) {
    deleteObject(storageRef).catch(() => {});
    throw err;
  }

  // 4. Poll transcribe-poll every 3 seconds until completed
  try {
    while (true) {
      await new Promise(r => setTimeout(r, 3000));

      const pollRes = await fetch(`/api/transcribe-poll?id=${transcriptId}`);
      if (!pollRes.ok) {
        const err = await pollRes.json().catch(() => ({}));
        throw new Error(err.error || `Transcription poll error ${pollRes.status}`);
      }

      const data = await pollRes.json();
      if (data.status === 'completed') return data.text;
      if (data.status === 'error') throw new Error(data.error || 'Transcription failed');
      // status === 'processing' — keep polling
    }
  } finally {
    // 5. Always clean up the temp Storage file
    deleteObject(storageRef).catch(() => {});
  }
}

// ── Summarize transcript with Claude (via serverless proxy) ───────────────
export async function summarizeWithClaude(transcript) {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Summarization error ${res.status}`);
  }

  return res.json();
}

// ── Send summary via WhatsApp using WasenderAPI ───────────────────────────
export async function sendWhatsAppSummary(phone, summary, actionItems = []) {
  if (!WASENDER_KEY) throw new Error('WasenderAPI key not configured — add VITE_WASENDER_API_KEY to .env');

  const itemLines = actionItems.length
    ? `\n\n*Action Items:*\n${actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    : '';
  const message = `*Meeting Summary — ARIA*\n\n${summary}${itemLines}`;

  const res = await fetch('https://www.wasenderapi.com/api/send-message', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WASENDER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `WhatsApp send failed (${res.status})`);
  }
  return res.json();
}

// ── Save meeting to Firestore ─────────────────────────────────────────────
export async function saveMeeting(userId, { summary, actionItems = [], followUps = [], transcript = '' }) {
  const title = `Meeting — ${new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const ref = await addDoc(collection(db, 'meetings'), {
    userId,
    title,
    transcript,
    summary,
    actionItems,
    followUps,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
