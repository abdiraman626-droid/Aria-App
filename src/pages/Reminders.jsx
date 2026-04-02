import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MessageCircle, Mic, Check, Trash2, Edit2, Clock, Mail, RefreshCw, AlertTriangle, CreditCard, HelpCircle } from 'lucide-react';
import HintIcon from '../components/HintIcon';
import { useReminders } from '../context/RemindersContext';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import BottomNav from '../components/BottomNav';
import ReminderSheet from '../components/ReminderSheet';
import UpgradePrompt from '../components/UpgradePrompt';
import { voice } from '../services/voice';
import { sendEmailReminder } from '../services/notifications';
import { format, isToday, isTomorrow } from 'date-fns';
import toast from 'react-hot-toast';

const TABS = ['All', 'Today', 'Upcoming', 'Completed'];
const P = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.15)',  dot: '#ef4444' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.15)', dot: '#f59e0b' },
  low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.15)',  dot: '#22c55e' },
};

function formatTime(dt) {
  const d = new Date(dt);
  if (isToday(d))    return `Today · ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, 'h:mm a')}`;
  return format(d, 'EEE, MMM d · h:mm a');
}

export default function Reminders() {
  const { reminders, toggle, remove, update } = useReminders();
  const { t } = useLang();
  const { user } = useAuth();
  const { reminderLimit, isPersonal, canAddReminder } = usePlan();

  const [tab,           setTab]          = useState('Upcoming');
  const [search,        setSearch]        = useState('');
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [speaking,      setSpeaking]      = useState(null);
  // For "WhatsApp to any number" — business plan pops a number input
  const [waTarget,      setWaTarget]      = useState(null); // { reminder, number }
  const [customNumber,  setCustomNumber]  = useState('');

  const usedCount  = reminders.length;
  const pct        = reminderLimit !== Infinity ? Math.min(100, (usedCount / reminderLimit) * 100) : 0;
  const atLimit    = isPersonal && !canAddReminder(usedCount);
  const nearLimit  = isPersonal && reminderLimit !== Infinity && pct >= 80 && !atLimit;

  const filtered = reminders.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    const now = new Date();
    switch (tab) {
      case 'Today':     return !r.done && isToday(new Date(r.dateTime));
      case 'Upcoming':  return !r.done && new Date(r.dateTime) > now;
      case 'Completed': return r.done;
      default:          return true;
    }
  }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  const speakReminder = async (r) => {
    const svc = voice();
    if (speaking === r.id) { svc.stop(); setSpeaking(null); return; }
    setSpeaking(r.id);
    const d    = new Date(r.dateTime);
    const text = `Reminder: ${r.title}. ${r.description ? r.description + '. ' : ''}Scheduled for ${format(d, 'EEEE, MMMM d')} at ${format(d, 'h:mm a')}.`;
    svc.onEnd  = () => setSpeaking(null);
    await svc.speak(text);
  };

  const { isBusiness, isPremium, hasMpesa } = usePlan();

  const markPaid = async (r) => {
    await update(r.id, { paymentConfirmed: true, paymentConfirmedAt: new Date().toISOString() });
    toast.success('Payment marked as confirmed');
  };
  const canWhatsAppAny = isBusiness || isPremium;

  const buildWhatsAppMsg = (r) => {
    const d = new Date(r.dateTime);
    return encodeURIComponent(`🔔 *ARIA Reminder*\n\n*${r.title}*\n${r.description || ''}\n\n📅 ${format(d, 'EEEE, MMM d')} at ${format(d, 'h:mm a')}\n\n_Sent by ARIA_`);
  };

  const sendWhatsApp = (r) => {
    if (canWhatsAppAny) {
      // Business/Premium: show number picker pre-filled with own number
      setCustomNumber(user?.whatsappNumber || '');
      setWaTarget(r);
    } else {
      // Personal: send only to own number
      if (!user?.whatsappNumber) { toast.error('Add WhatsApp number in Settings'); return; }
      window.open(`https://wa.me/${user.whatsappNumber.replace(/\D/g, '')}?text=${buildWhatsAppMsg(r)}`);
    }
  };

  const confirmWhatsApp = () => {
    if (!customNumber.trim()) { toast.error('Enter a phone number'); return; }
    window.open(`https://wa.me/${customNumber.replace(/\D/g, '')}?text=${buildWhatsAppMsg(waTarget)}`);
    setWaTarget(null);
    setCustomNumber('');
  };

  const sendEmail = (r) => {
    if (!user?.email) { toast.error('No email address found'); return; }
    const ok = sendEmailReminder(r, user.email);
    if (ok) toast.success('Email reminder opened in your mail app');
  };

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <style>{`@keyframes urgentPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.2)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}`}</style>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ paddingTop: 72, paddingBottom: 0 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                Reminders
                <HintIcon hint="Create, manage and send reminders via WhatsApp, Voice, Email or Browser Notification. Tap + to add a new one." />
              </h1>
              <button onClick={() => { setEditing(null); setSheetOpen(true); }} className="btn btn-primary btn-sm">
                <Plus size={15} /> Add
              </button>
            </div>

            {/* Reminder usage counter */}
            {isPersonal && reminderLimit !== Infinity && (
              <div style={{
                padding: '10px 16px', borderRadius: 12, marginBottom: 16,
                background: atLimit ? 'rgba(239,68,68,0.06)' : nearLimit ? 'rgba(245,158,11,0.06)' : 'var(--bg-card)',
                border: `1px solid ${atLimit ? 'rgba(239,68,68,0.3)' : nearLimit ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ fontSize: 13, color: atLimit ? '#ef4444' : nearLimit ? '#f59e0b' : 'var(--text-muted)', fontWeight: atLimit || nearLimit ? 700 : 400 }}>
                  {usedCount} of {reminderLimit} reminders used
                  {atLimit   ? ' — Upgrade to add more' : ''}
                  {nearLimit ? ' — Almost full'        : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 100, height: 5, borderRadius: 3, background: 'var(--bg-card2)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, width: `${pct}%`,
                      background: atLimit ? '#ef4444' : nearLimit ? '#f59e0b' : '#22c55e',
                      transition: 'width 0.4s',
                    }} />
                  </div>
                  {(atLimit || nearLimit) && (
                    <a href="/settings" style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      Upgrade →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Upgrade prompt when at limit */}
            {atLimit && (
              <div style={{ marginBottom: 16 }}>
                <UpgradePrompt feature="Unlimited reminders" requiredPlan="business" compact />
              </div>
            )}

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reminders..." style={{ paddingLeft: 44 }} />
            </div>

            {/* Tabs */}
            <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
              {TABS.map(tb => (
                <button key={tb} onClick={() => setTab(tb)}
                  style={{
                    padding: '8px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)',
                    background: tab === tb ? 'var(--blue)' : 'var(--bg-card)',
                    color: tab === tb ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}>
                  {tb}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Count */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          {filtered.length} {filtered.length === 1 ? 'reminder' : 'reminders'}
        </p>

        {/* List */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 16 }}>{search ? 'No matches' : "You're all clear!"}</p>
            {!search && tab !== 'Completed' && !atLimit && (
              <button onClick={() => setSheetOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={14} /> Add a reminder
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((r, i) => {
                const s        = P[r.priority] || P.medium;
                const isOverdue = !r.done && new Date(r.dateTime) < new Date();
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: r.done ? 0.55 : 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: i * 0.04 }}
                    className="card"
                    style={{
                      padding: '16px 16px 16px 20px', position: 'relative', overflow: 'hidden',
                      ...(r.isUrgent && !r.done ? {
                        border: '1px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.04)',
                        animation: 'urgentPulse 2s ease-in-out infinite',
                      } : {}),
                    }}
                  >
                    {/* Priority bar */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: r.isUrgent && !r.done ? '#ef4444' : isOverdue ? '#ef4444' : s.dot }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Done checkbox */}
                      <button onClick={() => toggle(r.id)}
                        style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${r.done ? '#22c55e' : s.dot}`, background: r.done ? 'rgba(34,197,94,0.1)' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        {r.done && <Check size={13} color="#22c55e" />}
                      </button>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <p style={{ fontWeight: 700, fontSize: 15, color: r.done ? 'var(--text-muted)' : r.isUrgent ? '#ef4444' : '#fff', textDecoration: r.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {r.isUrgent && !r.done && <AlertTriangle size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />}
                            {r.title}
                          </p>
                          {r.isUrgent && !r.done && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', flexShrink: 0 }}>
                              URGENT
                            </span>
                          )}
                          {r.recurrence && !r.done && (
                            <span title={`Repeats ${r.recurrence}`} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(79,110,247,0.1)', color: 'var(--blue)', flexShrink: 0 }}>
                              <RefreshCw size={9} /> {r.recurrence}
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>
                        )}
                        <p style={{ fontSize: 12, color: isOverdue ? '#ef4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />
                          {formatTime(r.dateTime)}
                          {isOverdue && ' · Overdue'}
                        </p>
                        {r.mpesaAmount && (
                          <p style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, color: r.paymentConfirmed ? '#22c55e' : '#f59e0b' }}>
                            <CreditCard size={11} />
                            KES {Number(r.mpesaAmount).toLocaleString()} {r.mpesaTill ? `→ ${r.mpesaTill}` : ''}
                            {r.paymentConfirmed && ' · Paid ✓'}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {/* Voice */}
                        <button onClick={() => speakReminder(r)} title="Read aloud"
                          style={{ width: 32, height: 32, borderRadius: 10, background: speaking === r.id ? 'rgba(139,92,246,0.2)' : 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: speaking === r.id ? '#8B5CF6' : 'var(--text-muted)' }}>
                          <Mic size={13} />
                        </button>
                        {/* WhatsApp */}
                        <button onClick={() => sendWhatsApp(r)} title="Send via WhatsApp"
                          style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                          <MessageCircle size={13} />
                        </button>
                        {/* Email */}
                        <button onClick={() => sendEmail(r)} title="Send email reminder"
                          style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F6EF7' }}>
                          <Mail size={13} />
                        </button>
                        {/* M-Pesa Mark Paid */}
                        {hasMpesa && r.mpesaAmount && !r.paymentConfirmed && !r.done && (
                          <button onClick={() => markPaid(r)} title="Mark as paid"
                            style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                            <CreditCard size={13} />
                          </button>
                        )}
                        {/* Edit */}
                        <button onClick={() => { setEditing(r); setSheetOpen(true); }} title="Edit"
                          style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <Edit2 size={13} />
                        </button>
                        {/* Delete */}
                        <button onClick={() => { remove(r.id); toast.success('Deleted'); }} title="Delete"
                          style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        <div style={{ height: 24 }} />
      </div>

      {/* WhatsApp to any number modal */}
      <AnimatePresence>
        {waTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
              onClick={() => setWaTarget(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: '90%', maxWidth: 360, background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '24px', zIndex: 50,
              }}
            >
              <p style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Send via WhatsApp</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Send "{waTarget.title}" to any phone number
              </p>
              <label className="label">Phone Number</label>
              <input
                className="input" type="tel"
                value={customNumber}
                onChange={e => setCustomNumber(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                autoFocus
                style={{ marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setWaTarget(null)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Cancel</button>
                <button onClick={confirmWhatsApp} className="btn btn-sm" style={{ flex: 2, background: '#22c55e', color: '#fff', border: 'none' }}>
                  <MessageCircle size={14} /> Send WhatsApp
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
        onClick={() => { setEditing(null); setSheetOpen(true); }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        style={{ position: 'fixed', right: 24, bottom: 'calc(88px + env(safe-area-inset-bottom,0px))', width: 56, height: 56, borderRadius: '50%', background: 'var(--blue)', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(79,110,247,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}
      >
        <Plus size={24} color="#fff" />
      </motion.button>

      <BottomNav />
      <ReminderSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null); }}
        editing={editing}
      />
    </div>
  );
}
