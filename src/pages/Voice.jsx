import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Lock, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/RemindersContext';
import { useCalendar } from '../context/CalendarContext';
import { useLang } from '../context/LangContext';
import { voice } from '../services/voice';
import { fetchGmailMessages, summarizeEmails, getToken } from '../services/google';
import { decodeEntities } from '../lib/decodeEntities';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const MODES = {
  planning: {
    color: '#3b82f6',
    label: 'Planning',
    desc: 'Speak naturally to add reminders, events, or meetings to your calendar.',
  },
  reading: {
    color: '#7c3aed',
    label: 'Reading',
    desc: 'ARIA reads your Gmail summaries and schedule out loud.',
  },
  strategy: {
    color: '#06b6d4',
    label: 'Strategy',
    desc: 'Ask ARIA anything about your business and get instant AI advice.',
  },
};

const READING_PLANS = ['corporate_mini', 'corporate', 'major_corporate', 'enterprise'];

export default function Voice() {
  const { user } = useAuth();
  const { upcoming, add: addReminder } = useReminders();
  const { upcoming: upcomingEvents, addEvent } = useCalendar();
  const { lang, t } = useLang();
  const svc = voice();

  const [mode,        setMode]       = useState('planning');
  const [state,       setState]      = useState('idle'); // idle | listening | thinking | speaking
  const [transcript,  setTranscript] = useState('');
  const [response,    setResponse]   = useState('');
  const recognitionRef = useRef(null);

  const userPlan = user?.plan || 'individual';
  const canRead  = READING_PLANS.includes(userPlan);

  useEffect(() => {
    svc.onStart = () => setState('speaking');
    svc.onEnd   = () => setState('idle');
    return () => { svc.stop(); };
  }, []);

  const modeColor = MODES[mode].color;

  // ── Mode-specific AI handlers ─────────────────────────────────
  const handlePlanning = async (query) => {
    try {
      const res = await fetch('/api/voice-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query, userName: user?.name || '', lang,
          reminders: upcoming.slice(0, 10).map(r => ({ title: r.title, dateTime: r.dateTime, priority: r.priority })),
          calendarEvents: upcomingEvents.slice(0, 10).map(e => ({ title: e.title, dateTime: e.dateTime, notes: e.notes, type: e.type })),
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.action === 'create_event' && data.data) {
        await addEvent({
          title: data.data.title,
          dateTime: data.data.dateTime ? new Date(data.data.dateTime).toISOString() : new Date().toISOString(),
          type: data.data.type || 'meeting', notes: data.data.notes || '',
        });
        return `Created event: ${data.data.title}`;
      }
      if (data.action === 'create_reminder' && data.data) {
        await addReminder({
          title: data.data.title,
          dateTime: data.data.dateTime ? new Date(data.data.dateTime).toISOString() : new Date().toISOString(),
          priority: data.data.priority || 'medium', channel: 'notification', description: '',
        });
        return `Reminder added: ${data.data.title}`;
      }
      return decodeEntities(data.text || '') || 'Got it.';
    } catch {
      return 'Sorry, I had trouble with that. Try again.';
    }
  };

  const handleReading = async () => {
    try {
      const isGoogleConnected = user?.googleConnected && !!getToken();
      if (!isGoogleConnected) {
        return 'Connect Google in Settings first so I can read your inbox.';
      }
      const emails = await fetchGmailMessages();
      if (!emails.length) return 'Your inbox is empty — nothing to read.';
      const summaries = await summarizeEmails(emails);
      const top = emails.slice(0, 3).map((em, i) => {
        const summary = summaries[em.id] || em.snippet || '';
        return `${i + 1}. From ${em.from}: ${em.subject}. ${summary}`;
      }).join(' ');
      return `You have ${emails.length} new emails. Here are the top three. ${top}`;
    } catch {
      return 'Could not load your Gmail right now. Try again.';
    }
  };

  const handleStrategy = async (query) => {
    try {
      const res = await fetch('/api/strategy-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          userName: user?.name || '', lang,
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return decodeEntities(data.text || '') || 'No advice available right now.';
    } catch {
      return 'Strategy advisor is unavailable right now.';
    }
  };

  // ── Listen + respond ─────────────────────────────────────────
  const startListening = async () => {
    if (state !== 'idle') { svc.stop(); setState('idle'); return; }

    // Reading mode — no speech needed, just trigger the read
    if (mode === 'reading') {
      if (!canRead) { toast.error('Reading mode requires Corporate Mini or above'); return; }
      setTranscript('Reading inbox…');
      setState('thinking');
      const resp = await handleReading();
      setResponse(resp);
      await svc.speak(resp, lang);
      return;
    }

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

    r.onstart  = () => setState('listening');
    r.onresult = async (e) => {
      const q = e.results[0][0].transcript;
      setTranscript(q);
      setState('thinking');
      const resp = mode === 'strategy' ? await handleStrategy(q) : await handlePlanning(q);
      setResponse(resp);
      await svc.speak(resp, lang);
    };
    r.onerror = () => { setState('idle'); toast.error('Could not hear you. Try again.'); };
    r.onend   = () => { setState(prev => prev === 'listening' ? 'idle' : prev); };
    r.start();
  };

  const stateLabel = {
    idle:      mode === 'reading' ? 'Tap to read inbox' : 'Tap to speak',
    listening: 'Listening…',
    thinking:  'Thinking…',
    speaking:  'Speaking…',
  }[state];

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 540, margin: '0 auto', width: '100%', padding: '64px 24px 0', alignItems: 'center' }}>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Voice
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {MODES[mode].desc}
          </p>
        </motion.div>

        {/* ── 200px Pulsing Orb ─────────────────────────── */}
        <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer glow ring */}
          <motion.div
            animate={{ scale: state === 'idle' ? [1, 1.08, 1] : [1, 1.18, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{ duration: state === 'idle' ? 3 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', width: 200, height: 200, borderRadius: '50%',
              background: `radial-gradient(circle, ${modeColor}40 0%, ${modeColor}10 50%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
          {/* Mid ring */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.5, 0.25, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            style={{
              position: 'absolute', width: 160, height: 160, borderRadius: '50%',
              border: `1px solid ${modeColor}40`,
            }}
          />

          {/* Core orb */}
          <motion.button
            onClick={startListening}
            animate={{
              scale: state === 'listening' ? [1, 1.05, 1] : state === 'speaking' ? [1, 1.03, 1] : 1,
              boxShadow: [
                `0 0 40px ${modeColor}60, 0 0 80px ${modeColor}30, inset 0 0 30px ${modeColor}40`,
                `0 0 60px ${modeColor}80, 0 0 120px ${modeColor}40, inset 0 0 40px ${modeColor}50`,
                `0 0 40px ${modeColor}60, 0 0 80px ${modeColor}30, inset 0 0 30px ${modeColor}40`,
              ],
            }}
            transition={{
              scale:    { duration: state === 'idle' ? 0 : 1.4, repeat: state === 'idle' ? 0 : Infinity, ease: 'easeInOut' },
              boxShadow:{ duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileTap={{ scale: 0.96 }}
            style={{
              width: 130, height: 130, borderRadius: '50%', cursor: 'pointer', border: 'none',
              background: `radial-gradient(circle at 30% 30%, ${modeColor}, ${modeColor}99 50%, ${modeColor}55 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 2,
            }}>
            {state === 'thinking' ? (
              <Sparkles size={42} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            ) : state === 'listening' ? (
              <Square size={36} color="#fff" fill="#fff" />
            ) : (
              <Mic size={42} color="#fff" />
            )}
          </motion.button>
        </div>

        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>{stateLabel}</p>

        {/* ── Mode Toggle ──────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 8, padding: 4, marginBottom: 20,
          background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1f',
          borderRadius: 12, width: '100%', maxWidth: 380,
        }}>
          {Object.entries(MODES).map(([key, m]) => {
            const active = mode === key;
            const locked = key === 'reading' && !canRead;
            return (
              <button
                key={key}
                onClick={() => {
                  if (state !== 'idle') return;
                  setMode(key);
                  setTranscript(''); setResponse('');
                }}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 8, cursor: state === 'idle' ? 'pointer' : 'not-allowed',
                  border: 'none',
                  background: active ? `${m.color}1a` : 'transparent',
                  color: active ? m.color : '#888',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-head)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.2s',
                  position: 'relative',
                }}>
                {locked && <Lock size={11} />}
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Reading mode — locked state */}
        {mode === 'reading' && !canRead && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '16px 20px', borderRadius: 12, marginBottom: 20, maxWidth: 420, width: '100%',
              background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
            <Lock size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
              Reading mode is available on <strong style={{ color: '#fff' }}>Corporate Mini</strong> and above.
            </p>
            <Link to="/pricing" style={{
              padding: '6px 14px', borderRadius: 8, background: '#3b82f6', color: '#fff',
              fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
            }}>Upgrade</Link>
          </motion.div>
        )}

        {/* Transcript + response */}
        <AnimatePresence>
          {transcript && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="card" style={{ padding: '14px 18px', marginBottom: 12, maxWidth: 420, width: '100%' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>You</p>
              <p style={{ fontSize: 14, color: '#fff' }}>{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {response && (state === 'speaking' || state === 'idle') && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="card" style={{ padding: '14px 18px', marginBottom: 16, maxWidth: 420, width: '100%', borderColor: `${modeColor}30` }}>
              <p style={{ fontSize: 11, color: modeColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>ARIA</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{response}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: 32 }} />
      </div>

      <BottomNav />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
