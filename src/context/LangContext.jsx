import { createContext, useContext, useState } from 'react';

const T = {
  en: {
    greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening',
    dashboard: 'Home', reminders: 'Reminders', voice: 'Voice', settings: 'Settings',
    add_reminder: 'Add Reminder', today: 'Today', upcoming: 'Upcoming', completed: 'Completed',
    no_reminders: "You're all clear!", connect_google: 'Connect Google',
    play_briefing: 'Play Briefing', stop: 'Stop', tap_to_speak: 'Tap to speak',
    listening: 'Listening...', thinking: 'Thinking...', speaking: 'Speaking...',
    free_trial: '7-Day Free Trial', no_card: 'No credit card required',
  },
  sw: {
    greeting_morning: 'Habari za asubuhi', greeting_afternoon: 'Habari za mchana', greeting_evening: 'Habari za jioni',
    dashboard: 'Nyumbani', reminders: 'Vikumbusho', voice: 'Sauti', settings: 'Mipangilio',
    add_reminder: 'Ongeza Ukumbusho', today: 'Leo', upcoming: 'Zijazo', completed: 'Zilizokamilika',
    no_reminders: 'Umekwisha!', connect_google: 'Unganisha Google',
    play_briefing: 'Cheza Taarifa', stop: 'Simama', tap_to_speak: 'Gusa kusema',
    listening: 'Sikiliza...', thinking: 'Nafikiri...', speaking: 'Nasema...',
    free_trial: 'Majaribio ya Siku 7', no_card: 'Bila kadi ya mkopo',
  },
};

const Ctx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('aria_lang') || 'en');
  const t = (k) => T[lang][k] || k;
  const toggle = () => { const n = lang === 'en' ? 'sw' : 'en'; setLang(n); localStorage.setItem('aria_lang', n); };
  return <Ctx.Provider value={{ lang, t, toggle, setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
