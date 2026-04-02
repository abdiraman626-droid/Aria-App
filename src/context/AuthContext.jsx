import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { getToken, restoreToken, clearToken } from '../services/google';
import { initPushNotifications } from '../services/notifications';

const AuthContext = createContext(null);

export const PLAN_META = {
  personal: { label: 'Personal', price: 99,  color: '#4F6EF7', reminderLimit: 20  },
  business: { label: 'Business', price: 299, color: '#8B5CF6', reminderLimit: null },
  premium:  { label: 'Premium',  price: 500, color: '#f59e0b', reminderLimit: null },
};

const PLAN_PRICES = { personal: 99, business: 299, premium: 500 };

// ─── helpers ────────────────────────────────────────────────────────────────

async function fetchProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

function mergeUser(fbUser, profile) {
  if (!fbUser) return null;
  return {
    id:                  fbUser.uid,
    email:               fbUser.email,
    emailConfirmedAt:    fbUser.email,
    name:                profile?.name             || fbUser.displayName || fbUser.email?.split('@')[0] || '',
    plan:                profile?.plan             || 'personal',
    whatsappNumber:      profile?.whatsappNumber   || '',
    googleConnected:     profile?.googleConnected  || false,
    googleEmail:         profile?.googleEmail      || null,
    onTrial:             profile?.onTrial          ?? true,
    trialEnds:           profile?.trialEnds        || null,
    monthlyPrice:        profile?.monthlyPrice     || 99,
    active:              profile?.active           ?? true,
    avatar:              (profile?.name || fbUser.displayName || fbUser.email || '?')[0].toUpperCase(),
    onboardingCompleted: profile?.onboardingCompleted ?? false,
  };
}

function storeGoogleToken(accessToken) {
  if (accessToken) {
    localStorage.setItem('aria_google_token',  accessToken);
    localStorage.setItem('aria_google_expiry', String(Date.now() + 3600 * 1000));
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let profile = await fetchProfile(fbUser.uid);

        // Auto-create Firestore profile on first Google sign-in
        if (!profile) {
          profile = {
            name:                fbUser.displayName || fbUser.email?.split('@')[0] || '',
            email:               fbUser.email,
            plan:                'personal',
            whatsappNumber:      '',
            googleConnected:     false,
            googleEmail:         null,
            onTrial:             true,
            trialEnds:           new Date(Date.now() + 7 * 864e5).toISOString(),
            monthlyPrice:        99,
            active:              true,
            onboardingCompleted: false,
            createdAt:           serverTimestamp(),
          };
          await setDoc(doc(db, 'users', fbUser.uid), profile);
        }

        // Restore Google token FIRST — before setUser — so components see it on first render.
        // If the saved token is expired, leave localStorage empty (getToken returns null).
        if (profile?.googleConnected && !getToken()) {
          const { googleAccessToken: savedToken, googleTokenExpiry: savedExpiry } = profile;
          if (savedToken && savedExpiry && Date.now() < savedExpiry - 60_000) {
            restoreToken(savedToken, savedExpiry);
          }
        }

        // setUser after restoreToken so getToken() reflects reality at render time.
        setUser(prev => {
          const fresh = mergeUser(fbUser, profile);
          // Trust a valid localStorage token over whatever Firestore returned.
          if (!fresh.googleConnected && getToken()) fresh.googleConnected = true;
          // If Firestore says connected but no token available, show disconnected locally.
          if (fresh.googleConnected && !getToken()) fresh.googleConnected = false;
          return fresh;
        });

        // Init push notifications (asks permission once, saves FCM token)
        initPushNotifications(fbUser.uid);
      } else {
        setUser(null);
        localStorage.removeItem('aria_google_token');
        localStorage.removeItem('aria_google_expiry');
        localStorage.removeItem('aria_google_profile');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Auth actions ────────────────────────────────────────────────────────────

  const login = async (email, password, rememberMe = true) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  const signup = async ({ name, email, password, plan = 'personal', phone = '' }) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

    // Create Firestore profile
    await setDoc(doc(db, 'users', fbUser.uid), {
      name,
      email,
      plan,
      whatsappNumber:      phone,
      googleConnected:     false,
      googleEmail:         null,
      onTrial:             true,
      trialEnds:           new Date(Date.now() + 7 * 864e5).toISOString(),
      monthlyPrice:        PLAN_PRICES[plan] || 99,
      active:              true,
      onboardingCompleted: false,
      createdAt:           serverTimestamp(),
    });

    return { user: fbUser, session: fbUser };
  };

  const loginWithGoogle = async () => {
    await setPersistence(auth, browserLocalPersistence);
    const result     = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      const expiry = Date.now() + 3600 * 1000;
      storeGoogleToken(credential.accessToken);
      await updateDoc(doc(db, 'users', result.user.uid), {
        googleConnected:   true,
        googleEmail:       result.user.email,
        googleAccessToken: credential.accessToken,
        googleTokenExpiry: expiry,
      });
      // onAuthStateChanged runs before updateDoc above completes (stale Firestore read),
      // so we explicitly sync local state here after the write is confirmed.
      setUser(prev => prev ? {
        ...prev,
        googleConnected: true,
        googleEmail:     result.user.email,
      } : prev);
    }
    return result;
  };

  const logout = async () => {
    clearToken();
    await signOut(auth);
  };

  const updateUser = async (updates) => {
    if (!user) return;
    const dbUpdates = {};
    if (updates.name                !== undefined) dbUpdates.name                = updates.name;
    if (updates.whatsappNumber      !== undefined) dbUpdates.whatsappNumber      = updates.whatsappNumber;
    if (updates.googleConnected     !== undefined) dbUpdates.googleConnected     = updates.googleConnected;
    if (updates.googleEmail         !== undefined) dbUpdates.googleEmail         = updates.googleEmail;
    if (updates.plan                !== undefined) dbUpdates.plan                = updates.plan;
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboardingCompleted = updates.onboardingCompleted;
    if (updates.active              !== undefined) dbUpdates.active              = updates.active;
    if (updates.onTrial             !== undefined) dbUpdates.onTrial             = updates.onTrial;
    if (updates.trialEnds           !== undefined) dbUpdates.trialEnds           = updates.trialEnds;
    if (updates.monthlyPrice        !== undefined) dbUpdates.monthlyPrice        = updates.monthlyPrice;
    if (updates.googleAccessToken  !== undefined) dbUpdates.googleAccessToken  = updates.googleAccessToken;
    if (updates.googleTokenExpiry  !== undefined) dbUpdates.googleTokenExpiry  = updates.googleTokenExpiry;

    await updateDoc(doc(db, 'users', user.id), dbUpdates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  const trialDaysLeft = user?.trialEnds
    ? Math.max(0, Math.ceil((new Date(user.trialEnds) - Date.now()) / 864e5))
    : 0;

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, signup, loginWithGoogle, logout, updateUser,
      trialDaysLeft, PLAN_META,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
};
