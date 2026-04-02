import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fetch from 'node-fetch';

initializeApp();

const ASSEMBLYAI_BASE = 'https://api.assemblyai.com';

// Triggered when a file lands in meetings/temp/ in Firebase Storage.
// Gets a signed URL, submits it to AssemblyAI, polls until complete,
// and writes the transcript to Firestore at meetings_temp/{docId}.
export const transcribeMeeting = onObjectFinalized(
  { timeoutSeconds: 540, memory: '512MiB' },
  async (event) => {
    const filePath = event.data.name;
    if (!filePath?.startsWith('meetings/temp/')) return;

    const fileName = filePath.split('/').pop();
    const docId    = fileName.replace(/\.[^.]+$/, '');

    const db = getFirestore();
    const docRef = db.collection('meetings_temp').doc(docId);

    try {
      await docRef.set({ status: 'transcribing' }, { merge: true });

      const key = process.env.ASSEMBLYAI_API_KEY;
      if (!key) throw new Error('ASSEMBLYAI_API_KEY environment variable is not set');

      // Get a short-lived signed URL so AssemblyAI can fetch the audio
      const bucket = event.data.bucket;
      const [signedUrl] = await getStorage().bucket(bucket).file(filePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 30 * 60 * 1000, // 30 minutes
      });

      const headers = { Authorization: key, 'Content-Type': 'application/json' };

      // Submit to AssemblyAI
      const submitRes = await fetch(`${ASSEMBLYAI_BASE}/v2/transcript`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ audio_url: signedUrl }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(err.error || `AssemblyAI submit failed (${submitRes.status})`);
      }

      const { id } = await submitRes.json();

      // Poll until completed or error
      while (true) {
        await new Promise(r => setTimeout(r, 3000));

        const pollRes = await fetch(`${ASSEMBLYAI_BASE}/v2/transcript/${id}`, { headers });
        const data = await pollRes.json();

        if (data.status === 'completed') {
          await docRef.set({ status: 'done', transcript: data.text });
          return;
        }
        if (data.status === 'error') {
          throw new Error(data.error || 'AssemblyAI transcription error');
        }
        // status is 'queued' or 'processing' — keep polling
      }

    } catch (err) {
      console.error('transcribeMeeting error:', err);
      await docRef.set({ status: 'error', error: err.message }).catch(() => {});
    }
  },
);
