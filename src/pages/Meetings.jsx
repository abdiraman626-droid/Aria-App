import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Video, ChevronRight, CheckCircle, Clock,
  X, Lock, Loader2, Calendar, FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import MeetingRecorder from '../components/MeetingRecorder';
import BottomNav from '../components/BottomNav';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ── Personal-plan lock overlay ────────────────────────────────────────────
function LockedPage() {
  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '72px 24px 120px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Video size={34} style={{ color: '#7c3aed' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
            Meeting Recorder
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 32 }}>
            Record, transcribe, and summarize meetings with AI. Auto-extract action items and create reminders instantly.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, textAlign: 'left' }}>
            {[
              'AI transcription via AssemblyAI',
              'Meeting summary via Claude',
              'Auto-extracted action items',
              'One-tap reminder creation',
              'Send summary via WhatsApp',
              'Meeting history in Firestore',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <CheckCircle size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Link
            to="/settings"
            className="btn btn-primary btn-lg w-full"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
            Upgrade to Business
          </Link>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}

// ── Meeting detail sheet ──────────────────────────────────────────────────
function MeetingDetail({ meeting, onClose }) {
  return (
    <AnimatePresence>
      {meeting && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '88svh', overflowY: 'auto' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="px-6 pt-2 pb-10">
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                    {meeting.title}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={11} />
                    {meeting.createdAt
                      ? format(new Date(meeting.createdAt), 'MMMM d, yyyy · h:mm a')
                      : 'No date'}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Summary */}
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Summary</p>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: '#fff' }}>{meeting.summary}</p>
              </div>

              {/* Action items */}
              {meeting.actionItems?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Action Items</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {meeting.actionItems.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                        <ChevronRight size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-ups */}
              {meeting.followUps?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Follow-ups</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {meeting.followUps.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <CheckCircle size={13} style={{ color: '#22c55e', marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 13 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript */}
              {meeting.transcript && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FileText size={13} /> View transcript
                  </summary>
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--bg-card2)', fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)', marginTop: 8 }}>
                    {meeting.transcript}
                  </div>
                </details>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Meetings page ────────────────────────────────────────────────────
export default function Meetings() {
  const { user }        = useAuth();
  const { hasTeam }     = usePlan();

  const [meetings,       setMeetings]      = useState([]);
  const [loadingList,    setLoadingList]   = useState(true);
  const [recorderOpen,   setRecorderOpen]  = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Fetch past meetings from Firestore
  useEffect(() => {
    if (!user?.id) return;
    setLoadingList(true);
    getDocs(
      query(
        collection(db, 'meetings'),
        where('userId', '==', user.id),
      )
    )
      .then(snap => {
        const docs = snap.docs.map(d => {
          const data = d.data();
          return {
            id:          d.id,
            title:       data.title       || 'Untitled Meeting',
            summary:     data.summary     || '',
            actionItems: data.actionItems || [],
            followUps:   data.followUps   || [],
            transcript:  data.transcript  || '',
            createdAt:   data.createdAt?.toDate?.()?.toISOString() || null,
          };
        });
        // Sort newest first client-side (avoids requiring a composite Firestore index)
        docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setMeetings(docs);
      })
      .catch(() => toast.error('Could not load meetings'))
      .finally(() => setLoadingList(false));
  }, [user?.id]);

  // When a new meeting is saved via the recorder, prepend it to the list
  const onMeetingSaved = (meeting) => {
    setMeetings(prev => [meeting, ...prev]);
  };

  // Feature gate removed for testing — all plans have access

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 72, paddingBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, marginBottom: 6 }}>
            Meetings
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Record, transcribe, and summarize your meetings
          </p>
        </motion.div>

        {/* Record New Meeting button */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 28 }}>
          <button
            onClick={() => setRecorderOpen(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 22px', borderRadius: 18, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(124,58,237,0.15))',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(59,130,246,0.3)',
              transition: 'all 0.2s', textAlign: 'left',
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={22} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 2 }}>Record New Meeting</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Transcribe · summarize · extract action items</p>
            </div>
          </button>
        </motion.div>

        {/* Past meetings */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>
              Past Meetings
            </h2>
            {meetings.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{meetings.length} total</span>
            )}
          </div>

          {loadingList ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: '18px 20px', height: 90, opacity: 0.4 - i * 0.05 }} />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Video size={24} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No meetings yet</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                Record your first meeting and ARIA will transcribe and summarize it automatically.
              </p>
              <button onClick={() => setRecorderOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={14} /> Record First Meeting
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meetings.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="card"
                  onClick={() => setSelectedMeeting(m)}
                  style={{ padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Date badge */}
                    <div style={{ textAlign: 'center', width: 40, flexShrink: 0 }}>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {m.createdAt ? format(new Date(m.createdAt), 'MMM') : '—'}
                      </p>
                      <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-head)' }}>
                        {m.createdAt ? format(new Date(m.createdAt), 'd') : '—'}
                      </p>
                    </div>

                    <div style={{ width: 1, height: 44, background: 'var(--border)', flexShrink: 0, marginTop: 2 }} />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {m.summary}
                      </p>
                    </div>

                    {/* Action item count + arrow */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {m.actionItems.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', whiteSpace: 'nowrap' }}>
                          {m.actionItems.length} action{m.actionItems.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      <BottomNav />

      {/* Recorder modal */}
      <MeetingRecorder
        open={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onSaved={onMeetingSaved}
      />

      {/* Meeting detail sheet */}
      <MeetingDetail
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
      />
    </div>
  );
}
