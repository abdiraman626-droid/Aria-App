import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, X, Clock, MapPin, FileText, Trash2, Edit3, Loader2, Link2Off, RefreshCw, Calendar as CalIcon } from 'lucide-react';
import { useCalendar } from '../context/CalendarContext';
import { usePlan } from '../hooks/usePlan';
import { useLang } from '../context/LangContext';
import { fetchCalendarEvents, getToken } from '../services/google';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import toast from 'react-hot-toast';

const EVENT_COLORS = ['#3b82f6', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

function EventSheet({ open, onClose, onSave, editing, t }) {
  const [title, setTitle]   = useState('');
  const [date, setDate]     = useState('');
  const [time, setTime]     = useState('');
  const [notes, setNotes]   = useState('');
  const [type, setType]     = useState('meeting');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setTitle(editing.title || '');
        const dt = new Date(editing.dateTime);
        setDate(format(dt, 'yyyy-MM-dd'));
        setTime(format(dt, 'HH:mm'));
        setNotes(editing.notes || '');
        setType(editing.type || 'meeting');
      } else {
        setTitle(''); setDate(format(new Date(), 'yyyy-MM-dd')); setTime('09:00'); setNotes(''); setType('meeting');
      }
    }
  }, [open, editing]);

  const submit = async () => {
    if (!title.trim() || !date) { toast.error('Title and date are required'); return; }
    setSaving(true);
    try {
      const dateTime = new Date(`${date}T${time || '00:00'}`).toISOString();
      await onSave({ title: title.trim(), dateTime, notes: notes.trim(), type });
      onClose();
    } catch { toast.error('Failed to save event'); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '85svh', overflowY: 'auto' }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} /></div>
            <div className="px-6 pt-2 pb-8">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>{editing ? t('edit_event') : t('new_event')}</h2>
                <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              {/* Type selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {['meeting', 'task', 'appointment'].map(t => (
                  <button key={t} onClick={() => setType(t)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${type === t ? '#3b82f6' : 'var(--border)'}`, background: type === t ? 'rgba(59,130,246,0.1)' : 'transparent', color: type === t ? '#3b82f6' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="label">Title *</label>
                  <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Board meeting, Client call..." />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label className="label">Date *</label>
                    <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Time</label>
                    <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agenda, location, attendees..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              <button onClick={submit} disabled={saving} className="btn btn-primary btn-lg w-full" style={{ marginTop: 20 }}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : editing ? t('save') : t('add_event')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { events, addEvent, updateEvent, removeEvent } = useCalendar();
  const { hasEmailSummaries } = usePlan();
  const { t } = useLang();
  const hasGoogleSync = hasEmailSummaries; // same tier gate

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [gLoading, setGLoading]         = useState(false);

  const isGoogleConnected = user?.googleConnected && !!getToken();

  // Fetch Google Calendar events if connected and plan allows
  useEffect(() => {
    if (!hasGoogleSync || !isGoogleConnected) return;
    setGLoading(true);
    fetchCalendarEvents()
      .then(setGoogleEvents)
      .catch(() => {})
      .finally(() => setGLoading(false));
  }, [hasGoogleSync, isGoogleConnected]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad   = monthStart.getDay(); // 0=Sun

  // Merge manual + Google events
  const allEvents = [
    ...events.map(e => ({ ...e, source: 'manual' })),
    ...googleEvents.map(e => ({
      id: e.id,
      title: e.summary,
      dateTime: e.start.dateTime || e.start.date,
      notes: e.location || '',
      type: 'meeting',
      source: 'google',
    })),
  ].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  const eventsForDate = (d) => allEvents.filter(e => isSameDay(new Date(e.dateTime), d));
  const selectedEvents = eventsForDate(selectedDate);

  const hasEventsOnDay = (d) => allEvents.some(e => isSameDay(new Date(e.dateTime), d));

  const handleSave = async (data) => {
    if (editing) {
      await updateEvent(editing.id, data);
      toast.success('Event updated');
    } else {
      await addEvent(data);
      toast.success('Event added');
    }
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await removeEvent(id);
    toast.success('Event deleted');
  };

  const typeColor = (type) => {
    if (type === 'task') return '#f59e0b';
    if (type === 'appointment') return '#22c55e';
    return '#3b82f6';
  };

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ paddingTop: 60, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700 }}>{t('calendar')}</h1>
            <button onClick={() => { setEditing(null); setSheetOpen(true); }}
              className="btn btn-primary btn-sm" style={{ gap: 6 }}>
              <Plus size={16} /> {t('new_event')}
            </button>
          </div>

          {/* Month Navigation */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                style={{ background: 'var(--bg-card2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <ChevronLeft size={18} />
              </button>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                style={{ background: 'var(--bg-card2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(day => {
                const selected = isSameDay(day, selectedDate);
                const today    = isToday(day);
                const hasEvents = hasEventsOnDay(day);
                return (
                  <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                    style={{
                      aspectRatio: '1', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: selected ? '#3b82f6' : today ? 'rgba(59,130,246,0.12)' : 'transparent',
                      color: selected ? '#fff' : today ? '#3b82f6' : '#fff',
                      fontWeight: selected || today ? 700 : 400, fontSize: 14, position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}>
                    {format(day, 'd')}
                    {hasEvents && (
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: selected ? '#fff' : '#3b82f6', position: 'absolute', bottom: 4 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected date events */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>
                {format(selectedDate, 'EEEE, MMMM d')}
              </h3>
              {gLoading && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
            </div>

            {selectedEvents.length === 0 ? (
              <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                <CalIcon size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>{t('no_events_day')}</p>
                <button onClick={() => { setEditing(null); setSheetOpen(true); }}
                  className="btn btn-sm btn-ghost" style={{ gap: 6 }}>
                  <Plus size={14} /> {t('add_event')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedEvents.map((ev, idx) => {
                  const d = new Date(ev.dateTime);
                  const color = ev.source === 'google' ? '#4285F4' : typeColor(ev.type);
                  return (
                    <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="card" style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 4, borderRadius: 2, background: color, alignSelf: 'stretch', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                            {ev.source === 'google' && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'rgba(66,133,244,0.12)', color: '#4285F4' }}>Google</span>
                            )}
                            {ev.source === 'manual' && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: `${color}18`, color, textTransform: 'capitalize' }}>{ev.type}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={11} /> {format(d, 'h:mm a')}
                            </span>
                            {ev.notes && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <FileText size={11} /> {ev.notes}
                              </span>
                            )}
                          </div>
                        </div>
                        {ev.source === 'manual' && (
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button onClick={() => { setEditing(ev); setSheetOpen(true); }}
                              style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                              <Edit3 size={12} />
                            </button>
                            <button onClick={() => handleDelete(ev.id)}
                              style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Google Calendar sync status */}
          {!hasGoogleSync && (
            <div className="card" style={{ padding: '16px 20px', textAlign: 'center', border: '1px solid var(--border)', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {t('google_sync_upgrade')}
              </p>
            </div>
          )}
          {hasGoogleSync && !isGoogleConnected && (
            <div className="card" style={{ padding: '16px 20px', textAlign: 'center', border: '1px solid var(--border)', marginBottom: 16 }}>
              <Link2Off size={18} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{t('connect_google_cal')}</p>
              <a href="/settings" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', fontSize: 12 }}>{t('go_to_settings')}</a>
            </div>
          )}
        </div>
      </div>

      <EventSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setEditing(null); }} onSave={handleSave} editing={editing} t={t} />
      <BottomNav />
    </div>
  );
}
