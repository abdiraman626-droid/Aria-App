import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, MessageCircle, Mail, Mic, Lock, Zap, RefreshCw, AlertTriangle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReminders } from '../context/RemindersContext';
import { useTeam } from '../context/TeamContext';
import { usePlan } from '../hooks/usePlan';
import toast from 'react-hot-toast';

const CHANNELS = [
  { id: 'whatsapp',     label: 'WhatsApp',    icon: MessageCircle, color: '#22c55e' },
  { id: 'voice',        label: 'Voice',        icon: Mic,           color: '#8B5CF6' },
  { id: 'email',        label: 'Email',        icon: Mail,          color: '#4F6EF7' },
  { id: 'notification', label: 'Notification', icon: Bell,          color: '#f59e0b' },
];

const PRIORITIES = [
  { id: 'high',   label: 'Urgent',   color: '#ef4444' },
  { id: 'medium', label: 'Today',    color: '#f59e0b' },
  { id: 'low',    label: 'Upcoming', color: '#22c55e' },
];

const RECURRENCE = [
  { id: null,      label: 'None'    },
  { id: 'daily',   label: 'Daily'   },
  { id: 'weekly',  label: 'Weekly'  },
  { id: 'monthly', label: 'Monthly' },
];

function pad(n) { return String(n).padStart(2, '0'); }
function defaultDT() {
  const d = new Date(Date.now() + 36e5);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function maxDT() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function maxDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ReminderSheet({ open, onClose, editing, initial }) {
  const { add, update, reminders } = useReminders();
  const { members, clients }       = useTeam();
  const { canAddReminder, reminderLimit, plan, hasTeam, hasWhatsApp, hasMpesa, isCorporate, isMajorCorporate, isEnterprise } = usePlan();
  const isPremium = isCorporate || isMajorCorporate || isEnterprise;
  const availableChannels = hasWhatsApp ? CHANNELS : CHANNELS.filter(c => c.id !== 'whatsapp');

  const [title,         setTitle]         = useState('');
  const [desc,          setDesc]          = useState('');
  const [dt,            setDt]            = useState(defaultDT());
  const [channel,       setChannel]       = useState('notification');
  const [priority,      setPriority]      = useState('medium');
  const [recurrence,    setRecurrence]    = useState(null);
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [assignedTo,    setAssignedTo]    = useState('');
  const [clientId,      setClientId]      = useState('');
  const [isUrgent,      setIsUrgent]      = useState(false);
  const [mpesaAmount,   setMpesaAmount]   = useState('');
  const [mpesaTill,     setMpesaTill]     = useState('');

  useEffect(() => {
    if (open) {
      setTitle(editing?.title       || initial?.title       || '');
      setDesc(editing?.description  || initial?.description || '');
      setDt(editing ? new Date(editing.dateTime).toISOString().slice(0, 16) : defaultDT());
      setChannel(editing?.channel   || 'notification');
      setPriority(editing?.priority || 'medium');
      setRecurrence(editing?.recurrence    || null);
      setRecurrenceEnd(editing?.recurrenceEnd ? new Date(editing.recurrenceEnd).toISOString().slice(0, 10) : '');
      setAssignedTo(editing?.assignedTo || '');
      setClientId(editing?.clientId   || '');
      setIsUrgent(editing?.isUrgent   || false);
      setMpesaAmount(editing?.mpesaAmount ? String(editing.mpesaAmount) : '');
      setMpesaTill(editing?.mpesaTill || '');
    }
  }, [open, editing?.id, initial?.title]);

  const atLimit = !editing && !canAddReminder(reminders.length);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Add a title'); return; }
    if (atLimit) {
      toast.error(`Reminder limit reached: ${reminderLimit}. Upgrade your plan.`);
      return;
    }
    const data = {
      title:        title.trim(),
      description:  desc.trim(),
      dateTime:     new Date(dt).toISOString(),
      channel,
      priority,
      recurrence:    recurrence || null,
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd + 'T23:59:59').toISOString() : null,
      assignedTo:    assignedTo  || null,
      clientId:      clientId    || null,
      isUrgent,
      mpesaAmount:   mpesaAmount ? Number(mpesaAmount) : null,
      mpesaTill:     mpesaTill.trim() || null,
    };
    if (editing) { update(editing.id, data); toast.success('Reminder updated'); }
    else         { add(data);               toast.success('Reminder added'); }
    onClose();
  };

  const activeMembers = members.filter(m => m.status === 'active');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '92svh', overflowY: 'auto' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            <form onSubmit={submit} className="px-6 pt-2 pb-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>
                  {editing ? 'Edit Reminder' : initial ? 'Create Reminder' : 'New Reminder'}
                </h2>
                <button type="button" onClick={onClose} className="p-2 rounded-xl"
                  style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Upgrade banner when at limit */}
              {atLimit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <Lock size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 2 }}>
                      Personal plan limit reached ({reminderLimit} reminders)
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Upgrade to Business for unlimited reminders</p>
                  </div>
                  <Link to="/settings" onClick={onClose}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, background: '#8B5CF6', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    <Zap size={11} /> Upgrade
                  </Link>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="label">Title *</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Board meeting at Serena" autoFocus={!atLimit} />
              </div>

              {/* Description */}
              <div>
                <label className="label">Details</label>
                <textarea className="input resize-none" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional details..." />
              </div>

              {/* DateTime */}
              <div>
                <label className="label">Date & Time *</label>
                <input type="datetime-local" className="input" value={dt} onChange={e => setDt(e.target.value)} max={maxDT()} style={{ colorScheme: 'dark' }} />
              </div>

              {/* Priority */}
              <div>
                <label className="label">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button type="button" key={p.id} onClick={() => setPriority(p.id)}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
                      style={{
                        background: priority === p.id ? p.color + '22' : 'var(--bg-card2)',
                        border: `1px solid ${priority === p.id ? p.color : 'var(--border)'}`,
                        color: priority === p.id ? p.color : 'var(--text-muted)',
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel */}
              <div>
                <label className="label">Notify via</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableChannels.map(c => (
                    <button type="button" key={c.id} onClick={() => setChannel(c.id)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all"
                      style={{
                        background: channel === c.id ? c.color + '18' : 'var(--bg-card2)',
                        border: `1px solid ${channel === c.id ? c.color : 'var(--border)'}`,
                        color: channel === c.id ? c.color : 'var(--text-muted)',
                      }}>
                      <c.icon size={16} />
                      <span className="text-sm font-medium">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* URGENT — Premium feature */}
              {isPremium ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsUrgent(v => !v)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                      background: isUrgent ? 'rgba(239,68,68,0.1)' : 'var(--bg-card2)',
                      border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}>
                    <AlertTriangle size={16} color={isUrgent ? '#ef4444' : 'var(--text-muted)'} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: isUrgent ? '#ef4444' : '#fff' }}>Mark as URGENT</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Sends immediately + repeats every 30 min</p>
                    </div>
                    <div style={{
                      width: 44, height: 24, borderRadius: 12, transition: 'all 0.2s',
                      background: isUrgent ? '#ef4444' : 'var(--border)',
                      position: 'relative', flexShrink: 0,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3, transition: 'all 0.2s',
                        left: isUrgent ? 23 : 3,
                      }} />
                    </div>
                  </button>
                </div>
              ) : (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={12} color="#ef4444" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    URGENT reminders · <strong style={{ color: '#f59e0b' }}>Premium plan</strong>
                  </span>
                  <Link to="/settings" onClick={onClose} style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>Upgrade →</Link>
                </div>
              )}

              {/* M-Pesa — Premium feature */}
              {hasMpesa && (
                <div>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={12} /> M-Pesa Payment (optional)
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input className="input" type="number" value={mpesaAmount} onChange={e => setMpesaAmount(e.target.value)}
                      placeholder="Amount (KES)" style={{ flex: 1 }} />
                    <input className="input" value={mpesaTill} onChange={e => setMpesaTill(e.target.value)}
                      placeholder="Till / Paybill" style={{ flex: 1 }} />
                  </div>
                </div>
              )}

              {/* Recurrence — Business feature */}
              {hasTeam ? (
                <div>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={12} /> Repeat
                  </label>
                  <div className="flex gap-2">
                    {RECURRENCE.map(r => (
                      <button type="button" key={String(r.id)} onClick={() => setRecurrence(r.id)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: recurrence === r.id ? 'rgba(79,110,247,0.15)' : 'var(--bg-card2)',
                          border: `1px solid ${recurrence === r.id ? 'var(--blue)' : 'var(--border)'}`,
                          color: recurrence === r.id ? 'var(--blue)' : 'var(--text-muted)',
                          fontSize: 12,
                        }}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  {recurrence && (
                    <div style={{ marginTop: 10 }}>
                      <label className="label" style={{ fontSize: 11 }}>End Date (optional)</label>
                      <input type="date" className="input" value={recurrenceEnd} onChange={e => setRecurrenceEnd(e.target.value)} max={maxDate()} style={{ colorScheme: 'dark' }} />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={12} color="#8B5CF6" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Recurring reminders · <strong style={{ color: '#8B5CF6' }}>Business plan</strong>
                  </span>
                  <Link to="/settings" onClick={onClose} style={{ marginLeft: 'auto', fontSize: 11, color: '#8B5CF6', fontWeight: 700, textDecoration: 'none' }}>Upgrade →</Link>
                </div>
              )}

              {/* Assign to team member — Business feature */}
              {hasTeam && activeMembers.length > 0 && (
                <div>
                  <label className="label">Assign To (optional)</label>
                  <select className="input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={{ colorScheme: 'dark' }}>
                    <option value="">— Myself —</option>
                    {activeMembers.map(m => (
                      <option key={m.id} value={m.member_id} style={{ background: '#111' }}>
                        {m.name || m.invited_email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Link to client — Business feature */}
              {hasTeam && clients.length > 0 && (
                <div>
                  <label className="label">For Client (optional)</label>
                  <select className="input" value={clientId} onChange={e => setClientId(e.target.value)} style={{ colorScheme: 'dark' }}>
                    <option value="">— No client —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#111' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={atLimit}
                className="btn btn-primary w-full btn-lg mt-2"
                style={{ opacity: atLimit ? 0.4 : 1, cursor: atLimit ? 'not-allowed' : 'pointer' }}
              >
                {editing ? 'Save Changes' : 'Add Reminder'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
