import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'bug', label: 'Bug Report', emoji: '🐛' },
  { id: 'feature', label: 'Feature Request', emoji: '💡' },
  { id: 'feedback', label: 'General Feedback', emoji: '💬' },
];

export default function Suggestions() {
  const { user } = useAuth();
  const { lang } = useLang();

  const [category, setCategory] = useState('feedback');
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const labels = {
    en: { title: 'Suggestion Box', subtitle: 'Help us improve ARIA Life', category_label: 'Category', message_label: 'Your Message', placeholder: 'Describe your feedback, idea, or the bug you found...', submit: 'Submit', success_title: 'Thank you for your feedback!', success_note: 'Note: The suggestion box will be removed after official launch.' },
    sw: { title: 'Sanduku la Mapendekezo', subtitle: 'Tusaidie kuboresha ARIA Life', category_label: 'Aina', message_label: 'Ujumbe Wako', placeholder: 'Eleza maoni yako, wazo, au hitilafu uliyoipata...', submit: 'Tuma', success_title: 'Asante kwa maoni yako!', success_note: 'Kumbuka: Sanduku la mapendekezo litaondolewa baada ya uzinduzi rasmi.' },
    so: { title: 'Sanduuqa Talooyinka', subtitle: 'Naga caawi si aan u wanaajino ARIA Life', category_label: 'Nooca', message_label: 'Fariintaada', placeholder: 'Sharrax ra\'yigaaga, fikradaada, ama cilladda aad heshay...', submit: 'Dir', success_title: 'Waad ku mahadsantahay ra\'yigaaga!', success_note: 'Ogsoonow: Sanduuqa talooyinka waa la qaadi doonaa dabarkii daah-furka rasmiga ah.' },
    ar: { title: 'صندوق الاقتراحات', subtitle: 'ساعدنا في تحسين ARIA Life', category_label: 'الفئة', message_label: 'رسالتك', placeholder: 'اوصف ملاحظاتك أو فكرتك أو الخطأ الذي وجدته...', submit: 'إرسال', success_title: 'شكراً لملاحظاتك!', success_note: 'ملاحظة: سيتم إزالة صندوق الاقتراحات بعد الإطلاق الرسمي.' },
  };
  const l = labels[lang] || labels.en;

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error('Please write your message'); return; }
    setSending(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        userId: user?.id || null,
        userName: user?.name || 'Anonymous',
        userEmail: user?.email || '',
        type: category,
        message: message.trim(),
        createdAt: serverTimestamp(),
        status: 'new',
      });

      // Send email notification
      fetch('/api/submit-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: user?.name,
          userEmail: user?.email,
          type: category,
          message: message.trim(),
        }),
      }).catch(() => {});

      setSuccess(true);
      setMessage('');
      setCategory('feedback');
    } catch {
      toast.error('Failed to submit. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800 }}>{l.title}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l.subtitle}</p>
            </div>
          </div>

          {/* Success state */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="card"
                style={{ padding: '40px 24px', textAlign: 'center', marginTop: 32 }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={30} style={{ color: '#22c55e' }} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
                  {l.success_title}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                  {l.success_note}
                </p>
                <button onClick={() => setSuccess(false)} className="btn btn-ghost btn-sm">
                  Submit Another
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ marginTop: 28 }}>

                {/* Category */}
                <div style={{ marginBottom: 20 }}>
                  <label className="label">{l.category_label}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setCategory(cat.id)}
                        style={{
                          flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                          border: `1px solid ${category === cat.id ? 'var(--blue)' : 'var(--border)'}`,
                          background: category === cat.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                          color: category === cat.id ? 'var(--blue)' : 'var(--text-muted)',
                          fontSize: 13, fontWeight: 600, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 6, transition: 'all 0.2s',
                        }}>
                        <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div style={{ marginBottom: 20 }}>
                  <label className="label">{l.message_label}</label>
                  <textarea
                    className="input"
                    rows={6}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={l.placeholder}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={sending || !message.trim()}
                  className="btn btn-primary btn-lg w-full"
                  style={{ gap: 8 }}
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {l.submit}
                </button>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                  {lang === 'ar' ? 'سيتم إرسال اقتراحك إلى فريق ARIA.' : lang === 'so' ? 'Talodaada waxaa loo diri doonaa kooxda ARIA.' : lang === 'sw' ? 'Pendekezo lako litatumwa kwa timu ya ARIA.' : 'Your suggestion will be sent to the ARIA team.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
