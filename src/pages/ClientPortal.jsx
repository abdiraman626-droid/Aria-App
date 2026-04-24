import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, Send, AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, isAfter } from 'date-fns';

export default function ClientPortal() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('token');

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [request,      setRequest]      = useState('');
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);
  const [confirming,   setConfirming]   = useState(null);

  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return; }

    async function load() {
      try {
        // 1. Look up the portal token
        const tokenSnap = await getDocs(
          query(collection(db, 'client_portal_tokens'), where('token', '==', token))
        );
        if (tokenSnap.empty) { setError('This link is invalid or has expired.'); setLoading(false); return; }

        const tokenDoc  = tokenSnap.docs[0].data();
        const clientId  = tokenDoc.clientId;
        const ownerId   = tokenDoc.ownerId;

        // 2. Load client doc
        const clientSnap = await getDocs(
          query(collection(db, 'clients'), where('ownerId', '==', ownerId))
        );
        const clientDoc = clientSnap.docs.find(d => d.id === clientId);
        const client    = clientDoc ? { id: clientDoc.id, ...clientDoc.data() } : null;

        // 3. Load active reminders for this client
        const remSnap = await getDocs(
          query(collection(db, 'reminders'),
            where('clientId', '==', clientId),
            where('done',     '==', false)
          )
        );
        const reminders = remSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setData({ client, reminders, ownerId, clientId });
      } catch (e) {
        setError('Could not load portal. Please try again.');
      }
      setLoading(false);
    }
    load();
  }, [token]);

  const confirmReminder = async (reminderId) => {
    setConfirming(reminderId);
    await updateDoc(doc(db, 'reminders', reminderId), { done: true });
    setData(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== reminderId),
    }));
    setConfirming(null);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!request.trim()) return;
    setSending(true);
    await addDoc(collection(db, 'client_requests'), {
      token,
      ownerId:   data.ownerId,
      clientId:  data.clientId,
      message:   request.trim(),
      createdAt: serverTimestamp(),
    });
    setSent(true);
    setRequest('');
    setTimeout(() => setSent(false), 4000);
    setSending(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100svh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100svh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Link Invalid</h2>
          <p style={{ fontSize: 14, color: '#6b7280' }}>{error}</p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Please ask your advisor to send you a new link.</p>
        </div>
      </div>
    );
  }

  const client    = data?.client;
  const reminders = data?.reminders || [];
  const now       = new Date();
  const overdue   = reminders.filter(r => isAfter(now, new Date(r.dateTime)));
  const upcoming  = reminders.filter(r => !isAfter(now, new Date(r.dateTime)));

  return (
    <div style={{ minHeight: '100svh', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', padding: '28px 24px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.6 }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Powered by ARIA</p>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            Hi, {client?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
            Your reminders & updates from your advisor
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>
        {overdue.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 20, display: 'flex', gap: 10 }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 2 }}>
                {overdue.length} overdue item{overdue.length !== 1 ? 's' : ''}
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>Please confirm these or contact your advisor.</p>
            </div>
          </motion.div>
        )}

        {reminders.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
            <Bell size={32} style={{ color: '#4b5563', margin: '0 auto 12px' }} />
            <p style={{ color: '#6b7280', fontSize: 15 }}>No active reminders right now</p>
            <p style={{ color: '#4b5563', fontSize: 13, marginTop: 4 }}>Check back later or send a request below</p>
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Your Reminders ({reminders.length})
            </p>
            <AnimatePresence mode="popLayout">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...overdue, ...upcoming].map((r, i) => {
                  const isOv    = isAfter(now, new Date(r.dateTime));
                  const hoursOv = isOv ? Math.floor((now - new Date(r.dateTime)) / 3600000) : 0;
                  const warn24  = isOv && hoursOv >= 24;
                  const d       = new Date(r.dateTime);
                  return (
                    <motion.div key={r.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ delay: i * 0.04 }}
                      style={{
                        padding: '16px 16px 16px 20px', borderRadius: 16, position: 'relative', overflow: 'hidden',
                        background: isOv ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${warn24 ? 'rgba(239,68,68,0.4)' : isOv ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: isOv ? '#ef4444' : '#3b82f6' }} />
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: isOv ? '#ef4444' : '#fff' }}>{r.title}</p>
                          {r.description && <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6, lineHeight: 1.5 }}>{r.description}</p>}
                          <p style={{ fontSize: 12, color: isOv ? '#ef4444' : '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} />
                            {format(d, 'EEE, MMM d · h:mm a')}
                            {isOv && ` · ${hoursOv}h overdue`}
                          </p>
                          {warn24 && <p style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} /> More than 24 hours overdue — please contact your advisor</p>}
                        </div>
                        <button onClick={() => confirmReminder(r.id)} disabled={confirming === r.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, fontWeight: 700, fontSize: 13, background: confirming === r.id ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                          {confirming === r.id ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                          {confirming === r.id ? 'Confirming...' : 'Confirm'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </div>
        )}

        {/* Request form */}
        <div style={{ padding: '20px 20px 24px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={15} color="#3b82f6" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Send a Request</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>Ask your advisor to create a reminder or send information</p>
            </div>
          </div>
          <form onSubmit={submitRequest}>
            <textarea value={request} onChange={e => setRequest(e.target.value)}
              placeholder="e.g. Please remind me about the KRA deadline next week..." rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, resize: 'none', fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />
            <AnimatePresence>
              {sent && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Check size={13} /> Request sent! Your advisor will be notified.
                </motion.p>
              )}
            </AnimatePresence>
            <button type="submit" disabled={sending || !request.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: !request.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', background: '#3b82f6', color: '#fff', opacity: !request.trim() ? 0.4 : 1 }}>
              {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        </div>
        <p style={{ fontSize: 11, color: '#374151', textAlign: 'center', marginTop: 24 }}>
          Powered by ARIA — AI Reminder Assistant · ariaassistant.co.ke
        </p>
      </div>
    </div>
  );
}
