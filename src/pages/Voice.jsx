import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Volume2, Clock, Sparkles } from 'lucide-react';
const VoiceOrb = lazy(() => import('../components/VoiceOrb'));
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/RemindersContext';
import { useCalendar } from '../context/CalendarContext';
import { useLang } from '../context/LangContext';
import { voice } from '../services/voice';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const QUICK = {
  en: [
    "What's on my schedule today?",
    "Read my urgent reminders",
    "When is my next meeting?",
    "Schedule a meeting tomorrow at 10am",
  ],
  sw: [
    "Niambie ratiba yangu ya leo",
    "Soma vikumbusho vya haraka",
    "Mkutano wangu unaofuata ni lini?",
    "Panga mkutano kesho saa 4 asubuhi",
  ],
  so: [
    "Maxaa jadwalkaygii maanta ku jira?",
    "Akhri xusuusinnada degdega ah",
    "Goorma ayuu kulankaygii xiga yahay?",
    "Kulan berri saacadda 10-aad",
  ],
  ar: [
    "ما هو جدولي اليوم؟",
    "اقرأ تذكيراتي العاجلة",
    "متى اجتماعي القادم؟",
    "جدول اجتماع غداً الساعة 10 صباحاً",
  ],
};

export default function Voice() {
  const { user } = useAuth();
  const { upcoming, add: addReminder } = useReminders();
  const { upcoming: upcomingEvents, addEvent } = useCalendar();
  const { lang, t } = useLang();
  const svc = voice();

  const [state,       setState]       = useState('idle');
  const [transcript,  setTranscript]  = useState('');
  const [response,    setResponse]    = useState('');
  const [displayText, setDisplayText] = useState('');
  const [history,     setHistory]     = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    svc.onStart = () => setState('speaking');
    svc.onEnd   = () => setState('idle');
    return () => { svc.stop(); };
  }, []);

  useEffect(() => {
    if (state === 'speaking' && response) {
      let i = 0;
      setDisplayText('');
      const interval = setInterval(() => {
        setDisplayText(response.slice(0, i));
        i += 3;
        if (i > response.length) { setDisplayText(response); clearInterval(interval); }
      }, 18);
      return () => clearInterval(interval);
    }
  }, [state, response]);

  // Call Claude API via serverless proxy
  const askAI = async (query) => {
    try {
      const res = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userName: user?.name || '',
          lang,
          reminders: upcoming.slice(0, 10).map(r => ({
            title: r.title, dateTime: r.dateTime, priority: r.priority,
          })),
          calendarEvents: upcomingEvents.slice(0, 10).map(e => ({
            title: e.title, dateTime: e.dateTime, notes: e.notes, type: e.type,
          })),
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      // Handle action responses (create event/reminder from voice)
      if (data.action === 'create_event' && data.data) {
        const d = data.data;
        await addEvent({
          title: d.title,
          dateTime: d.dateTime ? new Date(d.dateTime).toISOString() : new Date().toISOString(),
          type: d.type || 'meeting',
          notes: d.notes || '',
        });
        const confirmMsg = lang === 'ar' ? `تم إنشاء: ${d.title}`
          : lang === 'so' ? `Waa la sameeyay: ${d.title}`
          : lang === 'sw' ? `Imetengenezwa: ${d.title}`
          : `Created: ${d.title}`;
        toast.success(confirmMsg);
        return confirmMsg;
      }

      if (data.action === 'create_reminder' && data.data) {
        const d = data.data;
        await addReminder({
          title: d.title,
          dateTime: d.dateTime ? new Date(d.dateTime).toISOString() : new Date().toISOString(),
          priority: d.priority || 'medium',
          channel: 'notification',
          description: '',
        });
        const confirmMsg = lang === 'ar' ? `تم إضافة التذكير: ${d.title}`
          : lang === 'so' ? `Xusuusin la daray: ${d.title}`
          : lang === 'sw' ? `Ukumbusho umeongezwa: ${d.title}`
          : `Reminder added: ${d.title}`;
        toast.success(confirmMsg);
        return confirmMsg;
      }

      return data.text || t('error');
    } catch {
      // Fallback to local response if API fails
      return buildLocalResponse(query);
    }
  };

  // Fallback local response (no API needed)
  const buildLocalResponse = (query) => {
    const q = query.toLowerCase();
    const name = user?.name?.split(' ')[0] || '';
    const all = [...upcoming.slice(0, 4), ...upcomingEvents.slice(0, 4)]
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).slice(0, 5);

    if (q.includes('today') || q.includes('schedule') || q.includes('ratiba') || q.includes('leo') || q.includes('jadwal') || q.includes('maanta') || q.includes('جدول') || q.includes('اليوم')) {
      if (!all.length) return `${t('no_upcoming')}, ${name}.`;
      const list = all.map((r, i) => `${i + 1}. ${r.title} — ${format(new Date(r.dateTime), 'h:mm a')}`).join('. ');
      return `${name}, ${all.length} items: ${list}.`;
    }
    if (q.includes('urgent') || q.includes('haraka') || q.includes('degdeg') || q.includes('عاجل')) {
      const urgent = upcoming.filter(r => r.priority === 'high');
      if (!urgent.length) return lang === 'ar' ? 'لا توجد تذكيرات عاجلة.' : lang === 'so' ? 'Xusuusin degdeg ah ma jiraan.' : 'No urgent reminders.';
      return urgent.map(r => r.title).join(', ');
    }
    return t('ask_aria');
  };

  const handleQuery = async (query) => {
    if (state !== 'idle') return;
    setTranscript(query);
    setState('thinking');
    const resp = await askAI(query);
    setResponse(resp);
    setHistory(h => [{ query, response: resp, time: new Date() }, ...h.slice(0, 9)]);
    await svc.speak(resp, lang);
  };

  const startListening = () => {
    if (state !== 'idle') { svc.stop(); setState('idle'); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported. Use Chrome or Safari.');
      return;
    }
    const r = new SpeechRecognition();
    r.lang = lang === 'ar' ? 'ar-SA' : lang === 'so' ? 'so-SO' : lang === 'sw' ? 'sw-KE' : 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    recognitionRef.current = r;

    r.onstart = () => setState('listening');
    r.onresult = async (e) => {
      const q = e.results[0][0].transcript;
      await handleQuery(q);
    };
    r.onerror = () => { setState('idle'); toast.error(t('error')); };
    r.onend = () => { if (state === 'listening') setState('idle'); };
    r.start();
  };

  const stateConfig = {
    idle:      { label: t('tap_to_speak'),  color: '#3b82f6', pulse: false },
    listening: { label: t('listening'),     color: '#22c55e', pulse: true },
    thinking:  { label: t('thinking'),      color: '#f59e0b', pulse: false },
    speaking:  { label: t('speaking'),      color: '#7c3aed', pulse: true },
  }[state];

  const prompts = QUICK[lang] || QUICK.en;

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 680, margin: '0 auto', width: '100%', padding: '72px 24px 0', alignItems: 'center' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
            {t('voice_briefing')}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
            {t('ask_aria')}
          </p>
        </motion.div>

        {/* 3D Voice Orb */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2 }} style={{ position: 'relative', marginBottom: 32 }}>
          <Suspense fallback={
            <button onClick={startListening} style={{ width: 160, height: 160, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${stateConfig.color}, ${stateConfig.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={56} color="#fff" />
            </button>
          }>
            <VoiceOrb state={state} size={180} onClick={startListening} />
          </Suspense>
        </motion.div>

        <motion.p animate={{ opacity: 1 }} initial={{ opacity: 0 }}
          style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 8, fontWeight: 500 }}>
          {stateConfig.label}
        </motion.p>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="card" style={{ padding: '14px 20px', marginBottom: 16, textAlign: 'center', maxWidth: 380, width: '100%' }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                {lang === 'ar' ? 'قلت' : lang === 'so' ? 'Waxaad tidhi' : lang === 'sw' ? 'Ulisema' : 'You said'}
              </p>
              <p style={{ fontSize: 16, color: '#fff' }}>"{transcript}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ARIA response text */}
        <AnimatePresence>
          {displayText && state === 'speaking' && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '0 8px', marginBottom: 24 }}>
              <p style={{ fontSize: 18, color: '#fff', lineHeight: 1.7, fontFamily: 'var(--font-head)', fontWeight: 500 }}>
                {displayText}
                <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--blue)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 0.8s step-end infinite' }}>|</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick prompts */}
        {state === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ width: '100%', maxWidth: 440 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {lang === 'ar' ? 'أسئلة سريعة' : lang === 'so' ? 'Su\'aalaha Dhaqsaha' : lang === 'sw' ? 'Maswali ya Haraka' : 'Quick Questions'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prompts.map(prompt => (
                <button key={prompt} onClick={() => handleQuery(prompt)}
                  className="card"
                  style={{ padding: '14px 20px', textAlign: lang === 'ar' ? 'right' : 'left', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{prompt}</span>
                  <Mic size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && state === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', maxWidth: 440, marginTop: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} /> {lang === 'ar' ? 'الأخيرة' : lang === 'so' ? 'Dhowaan' : lang === 'sw' ? 'Hivi karibuni' : 'Recent'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.slice(0, 3).map((h, i) => (
                <div key={i} className="card" style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>"{h.query}"</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{h.response.slice(0, 120)}{h.response.length > 120 ? '...' : ''}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div style={{ height: 32 }} />
      </div>

      <BottomNav />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
