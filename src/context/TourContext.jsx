import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const TourContext = createContext(null);

export const TOUR_STEPS = [
  {
    id:     'welcome',
    target: 'tour-greeting',
    title:  'Welcome to ARIA 👋',
    desc:   "Your AI-powered reminder assistant for business professionals. Let me show you around in 5 quick steps.",
    position: 'bottom',
  },
  {
    id:     'voice',
    target: 'tour-voice-btn',
    title:  'Voice Briefing',
    desc:   "Tap this button to hear your day's reminders read aloud by ARIA. It auto-plays every morning between 7–11am.",
    position: 'bottom',
  },
  {
    id:     'create',
    target: 'tour-fab',
    title:  'Create a Reminder',
    desc:   "Tap + to add a reminder. Choose WhatsApp, Voice, Email, or Browser Notification. Set priority, recurrence, and more.",
    position: 'top',
  },
  {
    id:     'gmail',
    target: 'tour-gmail',
    title:  'Gmail Intelligence',
    desc:   "Connect Google in Settings to see urgent emails here and instantly turn them into reminders with one tap.",
    position: 'top',
  },
  {
    id:     'settings',
    target: 'tour-nav-settings',
    title:  'Customize ARIA',
    desc:   "Set your WhatsApp number, choose your AI voice, connect Google Calendar, and manage your subscription plan.",
    position: 'top',
  },
];

const WELCOME_MSGS = {
  personal: { title: "You're all set! 🎉", body: "Start by creating your first reminder — tap the + button anytime." },
  business: { title: "Welcome to Business! 🚀", body: "Invite your team in the Team tab and start delegating reminders." },
  premium:  { title: "Welcome to Premium! 👑", body: "Set up your Client Portal and start impressing your clients." },
};

export function TourProvider({ children }) {
  const { user, updateUser } = useAuth();
  const [active,       setActive]       = useState(false);
  const [step,         setStep]         = useState(0);
  const [showWelcome,  setShowWelcome]  = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    if (user.onboardingCompleted) return;
    // Small delay so Dashboard mounts first
    const t = setTimeout(() => setActive(true), 1400);
    return () => clearTimeout(t);
  }, [user?.id, user?.onboardingCompleted]);

  const markDone = useCallback(async () => {
    if (!user?.id) return;
    await updateUser({ onboardingCompleted: true });
  }, [user?.id]);

  const completeTour = useCallback(async () => {
    setActive(false);
    setStep(0);
    await markDone();
    // Show plan-specific welcome banner
    const key = `aria_welcomed_${user?.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 6000);
    }
  }, [markDone, user?.id]);

  const skipTour = useCallback(async () => {
    setActive(false);
    setStep(0);
    await markDone();
  }, [markDone]);

  const nextStep = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) { completeTour(); return; }
    setStep(s => s + 1);
  }, [step, completeTour]);

  const welcomeMsg = WELCOME_MSGS[user?.plan] || WELCOME_MSGS.personal;

  return (
    <TourContext.Provider value={{
      active, step, steps: TOUR_STEPS,
      nextStep, skipTour, completeTour,
      showWelcome, welcomeMsg,
      dismissWelcome: () => setShowWelcome(false),
    }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => {
  const c = useContext(TourContext);
  if (!c) throw new Error('useTour outside TourProvider');
  return c;
};
