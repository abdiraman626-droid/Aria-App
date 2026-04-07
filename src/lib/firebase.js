import { initializeApp }                      from 'firebase/app';
import { getAuth }                             from 'firebase/auth';
import { getFirestore }                       from 'firebase/firestore';
import { getStorage }                         from 'firebase/storage';
import { getMessaging, isSupported }          from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            "AIzaSyCo1n3hmhXLhp4r2Ns8x5MWgr1e3QifDZE",
  authDomain:        "aria-assistant-4d118.firebaseapp.com",
  projectId:         "aria-assistant-4d118",
  storageBucket:     "aria-assistant-4d118.firebasestorage.app",
  messagingSenderId: "845531930861",
  appId:             "1:845531930861:web:8959079be030fd408f2ce4",
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// messaging is only available in secure contexts (HTTPS / localhost)
export const messagingPromise = isSupported().then(ok => ok ? getMessaging(app) : null);

// Google OAuth provider is now built per-request in services/google.js
// with forced consent to ensure Calendar + Gmail scopes are granted.
