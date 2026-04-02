import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mic, Square, FileAudio, Loader2, CheckCircle,
  MessageCircle, Save, Plus, ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/RemindersContext';
import { transcribeAudio, summarizeWithClaude, sendWhatsAppSummary, saveMeeting } from '../services/meeting';
import toast from 'react-hot-toast';

const STEP = { IDLE: 'idle', RECORDING: 'recording', PROCESSING: 'processing', DONE: 'done' };

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function MeetingRecorder({ open, onClose, onSaved }) {
  const { user }  = useAuth();
  const { add }   = useReminders();

  const [tab,          setTab]          = useState('record');
  const [step,         setStep]         = useState(STEP.IDLE);
  const [processingMsg, setProcessingMsg] = useState('');
  const [uploadPct,    setUploadPct]    = useState(0);
  const [elapsed,      setElapsed]      = useState(0);
  const [audioBlob,    setAudioBlob]    = useState(null);
  const [fileName,     setFileName]     = useState('');
  const [result,       setResult]       = useState(null);
  const [saved,        setSaved]        = useState(false);
  const [sending,      setSending]      = useState(false);
  const [creatingIdx,  setCreatingIdx]  = useState(null);

  const mediaRef  = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTab('record'); setStep(STEP.IDLE); setElapsed(0); setUploadPct(0);
      setAudioBlob(null); setFileName(''); setResult(null);
      setSaved(false); setSending(false); setCreatingIdx(null);
    }
  }, [open]);

  // Recording timer
  useEffect(() => {
    if (step === STEP.RECORDING) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: mimeType }));
        stream.getTracks().forEach(t => t.stop());
        setStep(STEP.IDLE);
      };
      mr.start(250);
      mediaRef.current = mr;
      setElapsed(0);
      setStep(STEP.RECORDING);
    } catch {
      toast.error('Microphone access denied — please allow microphone permissions');
    }
  };

  const stopRecording = () => {
    try { mediaRef.current?.stop(); } catch {}
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setFileName(file.name);
  };

  const process = async () => {
    if (!audioBlob) return;
    setStep(STEP.PROCESSING);
    setUploadPct(0);
    try {
      setProcessingMsg('Uploading audio...');
      const transcript = await transcribeAudio(audioBlob, user.id, pct => {
        setUploadPct(pct);
        if (pct === 100) setProcessingMsg('Transcribing with AssemblyAI...');
      });

      setProcessingMsg('Summarizing with Claude...');
      const parsed = await summarizeWithClaude(transcript);

      setResult({ transcript, ...parsed });
      setStep(STEP.DONE);
    } catch (err) {
      toast.error(err.message);
      setStep(STEP.IDLE);
    }
  };

  const handleCreateReminder = async (actionItem, idx) => {
    setCreatingIdx(idx);
    const dt = new Date();
    dt.setDate(dt.getDate() + 1);
    dt.setHours(9, 0, 0, 0);
    await add({
      title:       actionItem,
      description: result.summary?.slice(0, 140) || '',
      dateTime:    dt.toISOString(),
      channel:     'notification',
      priority:    'medium',
    });
    toast.success('Reminder created!');
    setCreatingIdx(null);
  };

  const handleSend = async () => {
    if (!user?.whatsappNumber) {
      toast.error('Add your WhatsApp number in Settings first');
      return;
    }
    setSending(true);
    try {
      await sendWhatsAppSummary(user.whatsappNumber, result.summary, result.actionItems);
      toast.success('Summary sent via WhatsApp!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSave = async () => {
    try {
      const id = await saveMeeting(user.id, result);
      setSaved(true);
      toast.success('Meeting saved!');
      onSaved?.({
        id,
        title:       `Meeting — ${new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        summary:     result.summary     || '',
        actionItems: result.actionItems || [],
        followUps:   result.followUps   || [],
        transcript:  result.transcript  || '',
        createdAt:   new Date().toISOString(),
      });
    } catch {
      toast.error('Could not save meeting');
    }
  };

  return (
    <AnimatePresence>
      {open && (
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
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '92svh', overflowY: 'auto' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            <div className="px-6 pt-2 pb-8">
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>Record Meeting</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                    Transcribe · Summarize · Create reminders
                  </p>
                </div>
                <button type="button" onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* ── PROCESSING ── */}
              {step === STEP.PROCESSING && (
                <div style={{ textAlign: 'center', padding: '52px 0' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(79,110,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Loader2 size={32} style={{ color: 'var(--blue)' }} className="animate-spin" />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{processingMsg}</p>
                  {uploadPct < 100 && (
                    <div style={{ margin: '14px auto 0', width: '80%', maxWidth: 260 }}>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-card2)', overflow: 'hidden' }}>
                        <motion.div
                          animate={{ width: `${uploadPct}%` }}
                          transition={{ ease: 'linear', duration: 0.3 }}
                          style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#4F6EF7,#8B5CF6)' }}
                        />
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{uploadPct}% uploaded</p>
                    </div>
                  )}
                  {uploadPct >= 100 && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>This may take a minute for long recordings...</p>
                  )}
                </div>
              )}

              {/* ── RESULTS ── */}
              {step === STEP.DONE && result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Summary */}
                  <div style={{ padding: 16, borderRadius: 14, background: 'rgba(79,110,247,0.06)', border: '1px solid rgba(79,110,247,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Summary</p>
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: '#fff' }}>{result.summary}</p>
                  </div>

                  {/* Action items */}
                  {result.actionItems?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Action Items</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {result.actionItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                            <ChevronRight size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>{item}</span>
                            <button
                              onClick={() => handleCreateReminder(item, i)}
                              disabled={creatingIdx === i}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'rgba(79,110,247,0.1)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', flexShrink: 0 }}>
                              {creatingIdx === i ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                              Remind
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-ups */}
                  {result.followUps?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Follow-ups</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {result.followUps.map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                            <CheckCircle size={13} style={{ color: '#22c55e', marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={handleSend} disabled={sending} className="btn btn-ghost flex-1" style={{ gap: 6, fontSize: 13 }}>
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                      WhatsApp
                    </button>
                    <button onClick={handleSave} disabled={saved} className="btn btn-ghost flex-1" style={{ gap: 6, fontSize: 13, opacity: saved ? 0.6 : 1 }}>
                      {saved ? <CheckCircle size={14} color="#22c55e" /> : <Save size={14} />}
                      {saved ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  <button onClick={() => { setStep(STEP.IDLE); setAudioBlob(null); setResult(null); setSaved(false); setElapsed(0); }} className="btn btn-ghost w-full" style={{ fontSize: 13 }}>
                    Record Another
                  </button>
                </div>
              )}

              {/* ── RECORD / UPLOAD ── */}
              {(step === STEP.IDLE || step === STEP.RECORDING) && (
                <>
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, borderRadius: 12, background: 'var(--bg-card2)' }}>
                    {['record', 'upload'].map(t => (
                      <button key={t} type="button"
                        onClick={() => { if (step !== STEP.RECORDING) { setTab(t); setAudioBlob(null); setFileName(''); } }}
                        style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: step === STEP.RECORDING ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                          background: tab === t ? 'var(--bg-card)' : 'transparent',
                          color: tab === t ? '#fff' : 'var(--text-muted)',
                          boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none' }}>
                        {t === 'record' ? '🎙 Record' : '📁 Upload'}
                      </button>
                    ))}
                  </div>

                  {tab === 'record' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingBottom: 8 }}>
                      {/* Record button */}
                      <div style={{ position: 'relative' }}>
                        {step === STEP.RECORDING && (
                          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.35, 0, 0.35] }} transition={{ duration: 1.8, repeat: Infinity }}
                            style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', pointerEvents: 'none' }} />
                        )}
                        <button
                          onClick={step === STEP.RECORDING ? stopRecording : startRecording}
                          style={{ width: 100, height: 100, borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: step === STEP.RECORDING ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#4F6EF7,#8B5CF6)',
                            boxShadow: step === STEP.RECORDING ? '0 8px 32px rgba(239,68,68,0.45)' : '0 8px 32px rgba(79,110,247,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                          {step === STEP.RECORDING
                            ? <Square size={34} color="#fff" fill="#fff" />
                            : <Mic size={34} color="#fff" />}
                        </button>
                      </div>

                      {step === STEP.RECORDING ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 6 }}>
                            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                              style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                            <span style={{ fontWeight: 700, fontSize: 15 }}>Recording</span>
                          </div>
                          <p style={{ fontSize: 22, fontFamily: 'monospace', color: '#ef4444', fontWeight: 800 }}>{fmt(elapsed)}</p>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Tap to stop</p>
                        </div>
                      ) : (
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
                          {audioBlob ? `Recording ready · ${fmt(elapsed)}` : 'Tap to start recording your meeting'}
                        </p>
                      )}

                      {audioBlob && step !== STEP.RECORDING && (
                        <div style={{ width: '100%', padding: '11px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CheckCircle size={16} color="#22c55e" />
                          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Recording captured · {fmt(elapsed)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 24px', borderRadius: 16, border: '2px dashed var(--border)', cursor: 'pointer', background: 'var(--bg-card2)', transition: 'border-color 0.2s' }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(79,110,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileAudio size={22} style={{ color: 'var(--blue)' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontWeight: 700, marginBottom: 4 }}>{fileName || 'Choose audio file'}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>mp3, mp4, m4a, wav, webm · any size</p>
                        </div>
                        <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                      {audioBlob && (
                        <div style={{ padding: '11px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CheckCircle size={16} color="#22c55e" />
                          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>{fileName} ready</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Process button */}
                  <button
                    onClick={process}
                    disabled={!audioBlob || step === STEP.RECORDING}
                    className="btn btn-primary w-full btn-lg"
                    style={{ marginTop: 24, opacity: !audioBlob || step === STEP.RECORDING ? 0.4 : 1, cursor: !audioBlob || step === STEP.RECORDING ? 'not-allowed' : 'pointer' }}>
                    Transcribe & Summarize
                  </button>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
                    Powered by AssemblyAI + Claude
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Locked version shown to Personal plan users ───────────────────────────
export function MeetingRecorderLocked({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
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
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px 24px 48px' }}
          >
            <div className="flex justify-center pt-1 pb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Mic size={30} style={{ color: '#8B5CF6' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Meeting Recorder</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28, maxWidth: 300, margin: '0 auto 28px' }}>
                Record, transcribe, and summarize meetings with AI. Extract action items and create reminders instantly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
                {['AI transcription via AssemblyAI', 'Claude summary + action items', 'Auto-create reminders', 'Send summary via WhatsApp'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                    <CheckCircle size={15} color="#8B5CF6" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/settings" onClick={onClose} className="btn btn-primary btn-lg w-full" style={{ background: 'linear-gradient(135deg,#8B5CF6,#6d28d9)', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                Upgrade to Business
              </Link>
              <button onClick={onClose} className="btn btn-ghost w-full" style={{ marginTop: 10, fontSize: 13 }}>Maybe later</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
