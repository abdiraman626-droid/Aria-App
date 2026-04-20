import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Plus, Calendar, Mail, ArrowRight, Bell, Clock, RefreshCw, Link2Off, Volume2, Square, Lock, X, Video, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/RemindersContext';
import { useCalendar } from '../context/CalendarContext';
import { useLang } from '../context/LangContext';
import { usePlan } from '../hooks/usePlan';
import { voice, VOICES, RACHEL_ID } from '../services/voice';
import { fetchCalendarEvents, fetchGmailMessages, summarizeEmails, getToken } from '../services/google';
import { requestNotificationPermission, checkDueReminders, checkUrgentReminders } from '../services/notifications';
import BottomNav from '../components/BottomNav';
import ReminderSheet from '../components/ReminderSheet';
import HintIcon from '../components/HintIcon';
import { useTour } from '../context/TourContext';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITY_STYLE = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  label: 'Urgent'   },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Today'    },
  low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  label: 'Upcoming' },
};


function initials(name) {
  return (name || '?').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.round(ms / 60000);
  const h  = Math.round(ms / 3600000);
  const d  = Math.round(ms / 86400000);
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (d < 7)   return `${d}d ago`;
  return format(new Date(iso), 'MMM d');
}


export default function Dashboard() {
  const { user, trialDaysLeft, logout } = useAuth();
  const { reminders, upcoming, todayReminders } = useReminders();
  const { upcoming: upcomingCalEvents } = useCalendar();
  const { t, lang } = useLang();
  const { reminderLimit, isIndividual, isMajorCorporate, isEnterprise, hasTeam, hasMeetingRecorder } = usePlan();
  const showPremiumBadge = isMajorCorporate || isEnterprise;
  const { showWelcome, welcomeMsg, dismissWelcome } = useTour();
  const navigate = useNavigate();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  const [playing,          setPlaying]          = useState(false);
  const [sheetOpen,        setSheetOpen]         = useState(false);
  const [briefingRan,      setBriefingRan]       = useState(false);
  const [suggestedEmail,   setSuggestedEmail]    = useState(null);
  const [calEvents,        setCalEvents]         = useState([]);
  const [emails,           setEmails]            = useState([]);
  const [calLoading,       setCalLoading]        = useState(false);
  const [emailLoading,     setEmailLoading]      = useState(false);
  const [speakingEmailId,  setSpeakingEmailId]   = useState(null);
  const [emailSummaries,   setEmailSummaries]    = useState({});
  const [summarizing,      setSummarizing]       = useState(false);
  const [calError,         setCalError]          = useState(null);
  const [emailError,       setEmailError]        = useState(null);
  const isGoogleConnected = user?.googleConnected;
  const hasValidToken      = !!getToken();

  const h     = new Date().getHours();
  const greet = h < 12 ? t('greeting_morning') : h < 17 ? t('greeting_afternoon') : t('greeting_evening');
  const name  = user?.name?.split(' ')[0] || 'there';
  const usedCount = reminders.length;

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e) => { if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [avatarOpen]);

  // Request browser notification permission once
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Check for due reminders every minute + urgent every 30 min
  useEffect(() => {
    if (!reminders.length) return;
    checkDueReminders(reminders);
    checkUrgentReminders(reminders);
    const interval = setInterval(() => {
      checkDueReminders(reminders);
      checkUrgentReminders(reminders);
    }, 60_000);
    return () => clearInterval(interval);
  }, [reminders]);

  // Auto-play morning briefing — only between 7am and 11am on first open of the day
  useEffect(() => {
    if (!user || briefingRan) return;
    const hour = new Date().getHours();
    if (hour < 7 || hour >= 11) return;
    const key = `aria_briefed_${user.id}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    setBriefingRan(true);
    const svc = voice();
    svc.onStart = () => setPlaying(true);
    svc.onEnd   = () => setPlaying(false);
    setTimeout(() => {
      const text = svc.briefing(user, upcoming, upcomingCalEvents, lang);
      svc.speak(text, lang).catch(() => setPlaying(false));
    }, 900);
  }, [user?.id]);

  // Load real Google data when token is available
  useEffect(() => {
    if (!isGoogleConnected || !hasValidToken) return;

    setCalError(null);
    setCalLoading(true);
    fetchCalendarEvents()
      .then(setCalEvents)
      .catch(err => setCalError(err.message))
      .finally(() => setCalLoading(false));

    setEmailError(null);
    setEmailLoading(true);
    fetchGmailMessages()
      .then(fetched => {
        setEmails(fetched);
        setSummarizing(true);
        summarizeEmails(fetched)
          .then(setEmailSummaries)
          .catch(() => {})
          .finally(() => setSummarizing(false));
      })
      .catch(err => setEmailError(err.message))
      .finally(() => setEmailLoading(false));
  }, [isGoogleConnected, hasValidToken]);

  const readEmailAloud = async (em) => {
    const svc = voice();
    if (speakingEmailId === em.id) { svc.stop(); setSpeakingEmailId(null); return; }
    setSpeakingEmailId(em.id);
    svc.onEnd = () => setSpeakingEmailId(null);
    const content = (emailSummaries[em.id] || em.snippet || '').replace(/\s+/g, ' ').trim().slice(0, 400) || 'No preview available.';
    const text = `Email from ${em.from}. Subject: ${em.subject}. ${content}`;
    try { await svc.speak(text, lang); } catch { setSpeakingEmailId(null); }
  };

  const toggleBriefing = async () => {
    const svc = voice();
    if (playing) { svc.stop(); setPlaying(false); return; }
    svc.onStart = () => setPlaying(true);
    svc.onEnd   = () => setPlaying(false);
    const text = svc.briefing(user, upcoming, upcomingCalEvents, lang);
    toast.success('Playing briefing with Rachel...', { icon: '🎙️' });
    try { await svc.speak(text, lang); } catch { setPlaying(false); }
  };

  const suggestReminderFromEmail = (em) => {
    setSuggestedEmail(em);
    setSheetOpen(true);
  };

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>

      {/* ── Avatar menu (top-right) ─────────────────────────────── */}
      <div ref={avatarRef} style={{ position: 'fixed', top: 16, right: 16, zIndex: 60 }}>
        <button
          onClick={() => setAvatarOpen(o => !o)}
          style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(79,110,247,0.18)', border: '2px solid rgba(79,110,247,0.35)', color: '#4F6EF7', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)' }}
        >
          {user?.avatar || '?'}
        </button>
        <AnimatePresence>
          {avatarOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'absolute', top: 46, right: 0, minWidth: 180, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 2 }}>{user?.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              </div>
              <Link to="/settings" onClick={() => setAvatarOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, borderBottom: '1px solid var(--border)' }}>
                <Settings size={15} /> Settings
              </Link>
              <button
                onClick={() => { setAvatarOpen(false); logout(); navigate('/login'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, width: '100%' }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ paddingTop: 72, paddingBottom: 8 }}>
          {user?.onTrial && trialDaysLeft > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="badge badge-blue" style={{ marginBottom: 16, fontSize: 13 }}>
              {t('free_trial_banner')}: {trialDaysLeft} {t('days_remaining')}
            </motion.div>
          )}

          <motion.div id="tour-greeting" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {showPremiumBadge && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  👑 Premium
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {greet}, {name} 👋
            </h1>

            {/* Welcome banner after tour */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  style={{ marginTop: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.25)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🎉</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{welcomeMsg.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{welcomeMsg.body}</p>
                  </div>
                  <button onClick={dismissWelcome} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8 }}>
              {upcoming.length === 0 ? "You're all clear today!" : `${upcoming.length} reminder${upcoming.length !== 1 ? 's' : ''} on your schedule`}
            </p>
          </motion.div>

          {/* ── Reminder usage counter (Personal plan) ── */}
          {!hasMeetingRecorder && reminderLimit !== Infinity && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{
                marginTop: 14, padding: '10px 16px', borderRadius: 12,
                background: 'var(--bg-card)', border: `1px solid ${usedCount >= reminderLimit ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bell size={13} color={usedCount >= reminderLimit ? '#ef4444' : 'var(--text-muted)'} />
                <span style={{ fontSize: 13, color: usedCount >= reminderLimit ? '#ef4444' : 'var(--text-muted)', fontWeight: usedCount >= reminderLimit ? 700 : 400 }}>
                  {usedCount} of {reminderLimit} reminders used
                  {usedCount >= reminderLimit && ' — Limit reached'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, height: 5, borderRadius: 3, background: 'var(--bg-card2)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.min(100, (usedCount / reminderLimit) * 100)}%`,
                    background: usedCount >= reminderLimit ? '#ef4444' : usedCount >= reminderLimit * 0.8 ? '#f59e0b' : '#22c55e',
                    transition: 'width 0.5s',
                  }} />
                </div>
                {usedCount >= reminderLimit && (
                  <Link to="/settings" style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Upgrade →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Voice Briefing Button ────────────────────────────────── */}
        <motion.div
          id="tour-voice-btn"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0 32px' }}
        >
          <div style={{ position: 'relative' }}>
            {playing && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: 'rgba(79,110,247,0.2)' }}
              />
            )}
            <button
              onClick={toggleBriefing}
              style={{
                width: 120, height: 120, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: playing
                  ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                  : 'linear-gradient(135deg,#4F6EF7,#8B5CF6)',
                boxShadow: playing
                  ? '0 0 0 0 rgba(239,68,68,0.4), 0 20px 60px rgba(239,68,68,0.4)'
                  : '0 0 0 0 rgba(79,110,247,0.4), 0 20px 60px rgba(79,110,247,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s', position: 'relative',
              }}
            >
              {playing ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 32 }}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="eq-bar" style={{ animationDelay: `${i * 0.12}s`, background: '#fff' }} />
                  ))}
                </div>
              ) : (
                <Mic size={44} color="#fff" />
              )}
            </button>
          </div>
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {playing ? 'ARIA is speaking... tap to stop' : 'Tap for your morning briefing'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {(VOICES.find(v => v.id === (localStorage.getItem('aria_voice_id') || RACHEL_ID))?.name || 'Rachel')} voice · ElevenLabs · Auto-plays 7–11am
          </p>
        </motion.div>

        {/* ── Meeting Recorder shortcut ────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ marginBottom: 28 }}>
          <Link
            to="/meetings"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px', borderRadius: 18, textDecoration: 'none',
              background: !hasMeetingRecorder
                ? 'var(--bg-card)'
                : 'linear-gradient(135deg,rgba(79,110,247,0.12),rgba(139,92,246,0.12))',
              borderWidth: 1, borderStyle: 'solid',
              borderColor: !hasMeetingRecorder ? 'var(--border)' : 'rgba(79,110,247,0.25)',
              opacity: !hasMeetingRecorder ? 0.75 : 1,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: !hasMeetingRecorder ? 'var(--bg-card2)' : 'rgba(79,110,247,0.15)' }}>
              {!hasMeetingRecorder ? <Lock size={18} style={{ color: 'var(--text-muted)' }} /> : <Video size={18} style={{ color: 'var(--blue)' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: !hasMeetingRecorder ? 'var(--text-secondary)' : '#fff', marginBottom: 2 }}>
                Meetings
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {!hasMeetingRecorder
                  ? 'Upgrade to Business to record & summarize meetings'
                  : 'Record, transcribe & summarize meetings with AI'}
              </p>
            </div>
            {!hasMeetingRecorder ? (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)', flexShrink: 0 }}>
                Business+
              </span>
            ) : (
              <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            )}
          </Link>
        </motion.section>

        {/* ── Today's Reminders ─────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              Today's Schedule
              <HintIcon hint="Your upcoming reminders for today, sorted by time. Tap any reminder in Reminders to edit, mark done, or send via WhatsApp." />
            </h2>
            <Link to="/reminders" style={{ fontSize: 13, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              All <ArrowRight size={13} />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <Bell size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>{t('no_reminders')}</p>
              <button onClick={() => setSheetOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
                <Plus size={15} /> Add Reminder
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.slice(0, 4).map((r, i) => {
                const s = PRIORITY_STYLE[r.priority] || PRIORITY_STYLE.medium;
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                    className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 4, height: '100%', minHeight: 40, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        {format(new Date(r.dateTime), 'h:mm a')} · {formatDistanceToNow(new Date(r.dateTime), { addSuffix: true })}
                      </p>
                    </div>
                    <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11 }}>{s.label}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* ── Calendar Events (manual + Google merged) ────────────────── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>
              <Calendar size={17} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--blue)' }} />
              {t('upcoming_events')}
            </h2>
            <Link to="/calendar" style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>{t('view_all')} →</Link>
          </div>

          {(() => {
            // Merge manual calendar events + Google Calendar events
            const merged = [
              ...upcomingCalEvents.slice(0, 5).map(e => ({ id: e.id, title: e.title, dateTime: e.dateTime, notes: e.notes, source: 'manual', type: e.type })),
              ...calEvents.map(e => ({ id: e.id, title: e.summary, dateTime: e.start.dateTime || e.start.date, notes: e.location, source: 'google' })),
            ].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).slice(0, 5);

            if (calLoading) return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => <div key={i} className="card" style={{ padding: '14px 20px', height: 64, opacity: 0.4 }} />)}
              </div>
            );

            if (merged.length === 0) return (
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>{t('no_upcoming')}</p>
                <Link to="/calendar" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', gap: 6 }}>
                  <Calendar size={14} /> {t('add_event')}
                </Link>
              </div>
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {merged.map(ev => {
                  const d = new Date(ev.dateTime);
                  return (
                    <div key={ev.id} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'center', width: 40, flexShrink: 0 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{format(d, 'MMM').toUpperCase()}</p>
                        <p style={{ fontSize: 20, fontWeight: 800, lineHeight: 1, fontFamily: 'var(--font-head)' }}>{format(d, 'd')}</p>
                      </div>
                      <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ev.title}</p>
                          {ev.source === 'google' && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(66,133,244,0.12)', color: '#4285F4', flexShrink: 0 }}>Google</span>}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {format(d, 'h:mm a')}
                          {ev.notes ? ` · ${ev.notes}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </motion.section>

        {/* ── Quick Management Links ───────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ marginTop: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Link to="/analytics" className="card" style={{ padding: '14px 12px', textAlign: 'center', textDecoration: 'none' }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>📊</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'ar' ? 'التحليلات' : lang === 'so' ? 'Falanqayn' : lang === 'sw' ? 'Uchambuzi' : 'Analytics'}</span>
            </Link>
            <Link to="/departments" className="card" style={{ padding: '14px 12px', textAlign: 'center', textDecoration: 'none' }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>🏢</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{lang === 'ar' ? 'الأقسام' : lang === 'so' ? 'Qaybaha' : lang === 'sw' ? 'Idara' : 'Departments'}</span>
            </Link>
            <Link to="/team" className="card" style={{ padding: '14px 12px', textAlign: 'center', textDecoration: 'none' }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>👥</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('team')}</span>
            </Link>
          </div>
        </motion.section>

        {/* ── Gmail (Smart) ─────────────────────────────────────────── */}
        <motion.section id="tour-gmail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginTop: 28, paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={17} style={{ verticalAlign: 'middle', color: 'var(--purple)' }} />
              {t('gmail')}
              <HintIcon hint="ARIA reads your Gmail and categorizes emails as Urgent, People, or Companies. Tap 'Create Reminder' on urgent emails to auto-fill a reminder from the email subject." position="bottom" />
            </h2>
            {isGoogleConnected && emailLoading && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
          </div>

          {!isGoogleConnected ? (
            <div className="card" style={{ padding: '28px 24px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <Link2Off size={26} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>
                {t('connect_google_cal')}
              </p>
              <a href="/settings" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Go to Settings →
              </a>
            </div>

          ) : !hasValidToken || emailError === 'no_token' || emailError === 'token_expired' ? (
            <div className="card" style={{ padding: '28px 24px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <RefreshCw size={26} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>
                {t('google_session_expired')}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                Reconnect in Settings to refresh your inbox
              </p>
              <a href="/settings" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                {t('reconnect')} →
              </a>
            </div>

          ) : emailLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: '16px 20px', height: 88, opacity: 0.35 + i * 0.15 }} />
              ))}
            </div>

          ) : emailError ? (
            <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#ef4444' }}>{t('failed_load_emails')}</p>
            </div>

          ) : emails.length === 0 ? (
            <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>{t('no_emails')}</p>
            </div>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {emails.map((em, idx) => {
                const speaking = speakingEmailId === em.id;
                return (
                  <motion.div
                    key={em.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="card"
                    style={{ padding: '16px 20px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, background: 'rgba(79,110,247,0.12)',
                        border: '1.5px solid rgba(79,110,247,0.25)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, color: '#4F6EF7',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{initials(em.from)}</span>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {em.from}
                          </p>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(em.receivedAt)}</span>
                        </div>

                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {em.subject}
                        </p>

                        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          {summarizing && !emailSummaries[em.id]
                            ? <span style={{ opacity: 0.5 }}>{t('summarizing')}</span>
                            : (emailSummaries[em.id] || em.snippet)
                          }
                        </p>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => readEmailAloud(em)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
                              background: speaking ? 'rgba(139,92,246,0.2)' : 'var(--bg-card2)',
                              color:      speaking ? '#8B5CF6'              : 'var(--text-muted)',
                              transition: 'all 0.2s',
                            }}
                          >
                            {speaking
                              ? <><Square size={11} style={{ fill: 'currentColor' }} /> Stop</>
                              : <><Volume2 size={11} /> Read Aloud</>
                            }
                          </button>
                          <button
                            onClick={() => suggestReminderFromEmail(em)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
                              background: 'rgba(79,110,247,0.12)', color: '#4F6EF7',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Bell size={11} /> Remind
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>

      {/* Floating Add Button */}
      <motion.button
        id="tour-fab"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
        onClick={() => setSheetOpen(true)}
        style={{
          position: 'fixed', right: 24, bottom: 'calc(88px + env(safe-area-inset-bottom,0px))',
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--blue)', border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(79,110,247,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 30,
        }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
      >
        <Plus size={24} color="#fff" />
      </motion.button>

      <BottomNav />
      <ReminderSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSuggestedEmail(null); }}
        initial={suggestedEmail ? { title: suggestedEmail.subject, description: `From: ${suggestedEmail.from}` } : null}
      />
    </div>
  );
}
