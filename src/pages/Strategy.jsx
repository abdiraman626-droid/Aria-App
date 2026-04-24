import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Send, Loader2, Save, Copy, Check, FileText,
  Trash2, ChevronRight, Plus, X, Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import {
  collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';

const STARTERS = {
  en: [
    'Write a business plan for a food delivery startup',
    'Create a marketing strategy for a SaaS product targeting SMEs',
    'Financial projection for a retail store — 12 month forecast',
    'Competitor analysis for the mobile payments space in East Africa',
    'Growth strategy to scale from 100 to 1000 customers',
  ],
  sw: [
    'Andika mpango wa biashara wa kuanzisha huduma ya chakula',
    'Tengeneza mkakati wa masoko kwa bidhaa ya SaaS',
    'Makadirio ya kifedha kwa duka la rejareja — miezi 12',
    'Uchambuzi wa washindani katika malipo ya simu Afrika Mashariki',
    'Mkakati wa kukua kutoka wateja 100 hadi 1000',
  ],
  so: [
    'Qor qorshe ganacsi oo ku saabsan adeeg cunto gaadhsiin ah',
    'Abuuri istaraatiijiyad suuq-geyn oo badeecada SaaS ah',
    'Saadaal maaliyadeed dukaan 12 bilood ah',
    'Falanqayn tartamayaal lacagaha mobilka Afrika Bari',
    'Istaraatiijiyad kordhinta 100 ilaa 1000 macmiil',
  ],
  ar: [
    'اكتب خطة عمل لشركة توصيل طعام في نيروبي',
    'إنشاء استراتيجية تسويق لمنتج SaaS',
    'توقعات مالية لمتجر بيع بالتجزئة — 12 شهر',
    'تحليل المنافسين في مجال المدفوعات عبر الهاتف في شرق أفريقيا',
    'استراتيجية نمو من 100 إلى 1000 عميل',
  ],
};

function MarkdownText({ text }) {
  // Simple markdown renderer for headings, bold, bullets
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '16px 0 8px', fontFamily: 'var(--font-head)' }}>{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '12px 0 6px' }}>{line.slice(4)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} style={{ paddingLeft: 16, position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--blue)' }}>•</span>{renderBold(line.slice(2))}</p>;
        if (/^\d+\.\s/.test(line)) return <p key={i} style={{ paddingLeft: 16 }}>{renderBold(line)}</p>;
        if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
        return <p key={i}>{renderBold(line)}</p>;
      })}
    </div>
  );
}

function renderBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: '#fff', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

export default function Strategy() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [saved, setSaved]       = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied]     = useState(null);

  // Load saved strategies
  useEffect(() => {
    if (!user?.id) return;
    getDocs(query(
      collection(db, 'strategies'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
    )).then(snap => {
      setSaved(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(() => {});
  }, [user?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content) => {
    if (!content.trim() || loading) return;

    const userMsg = { role: 'user', content: content.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/strategy-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          userName: user?.name || '',
          lang,
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages([...updated, { role: 'assistant', content: data.text }]);
    } catch {
      toast.error('Failed to get strategy advice. Try again.');
      setMessages(updated); // keep user message
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async (msg) => {
    if (!user?.id) return;
    try {
      const title = msg.content.slice(0, 80).replace(/[#*\n]/g, '').trim();
      const ref = await addDoc(collection(db, 'strategies'), {
        userId: user.id,
        title,
        content: msg.content,
        createdAt: serverTimestamp(),
      });
      setSaved(prev => [{ id: ref.id, title, content: msg.content, createdAt: new Date() }, ...prev]);
      toast.success('Strategy saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const deleteStrategy = async (id) => {
    await deleteDoc(doc(db, 'strategies', id));
    setSaved(prev => prev.filter(s => s.id !== id));
    toast.success('Deleted');
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const exportAsPdf = (strategy) => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>${strategy.title || 'ARIA Strategy'}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.8;color:#222}h1{color:#3b82f6}h2,h3{margin-top:24px}pre{background:#f5f5f5;padding:16px;border-radius:8px;overflow-x:auto}</style>
      </head><body>
      <h1>ARIA Strategy Report</h1>
      <p style="color:#666">Generated by ARIA AI Strategy Advisor</p><hr>
      ${strategy.content.replace(/## (.*)/g, '<h2>$1</h2>').replace(/### (.*)/g, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^- (.*)/gm, '<li>$1</li>').replace(/\n/g, '<br>')}
      <hr><p style="color:#999;font-size:12px">Generated by ARIA · ${new Date().toLocaleDateString()}</p>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const starters = STARTERS[lang] || STARTERS.en;
  const labels = {
    en: { title: 'AI Strategy', subtitle: 'Business plans, marketing, financial projections', placeholder: 'Ask for a business plan, marketing strategy...', saved_title: 'Saved Strategies', new_chat: 'New Chat' },
    sw: { title: 'Mkakati wa AI', subtitle: 'Mipango ya biashara, masoko, makadirio ya kifedha', placeholder: 'Uliza mpango wa biashara, mkakati wa masoko...', saved_title: 'Mikakati Iliyohifadhiwa', new_chat: 'Mazungumzo Mapya' },
    so: { title: 'Istiraatiijiyad AI', subtitle: 'Qorshe ganacsi, suuq-geyn, saadaal maaliyadeed', placeholder: 'Weydii qorshe ganacsi, istaraatiijiyad...', saved_title: 'Istiraatiijiyado La Keydiyay', new_chat: 'Sheeko Cusub' },
    ar: { title: 'استراتيجية AI', subtitle: 'خطط أعمال، تسويق، توقعات مالية', placeholder: 'اطلب خطة عمل أو استراتيجية تسويق...', saved_title: 'الاستراتيجيات المحفوظة', new_chat: 'محادثة جديدة' },
  };
  const l = labels[lang] || labels.en;

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 720, margin: '0 auto', width: '100%', padding: '60px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lightbulb size={20} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>{l.title}</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.subtitle}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowSaved(!showSaved)}
              className="btn btn-ghost btn-sm" style={{ gap: 4, fontSize: 12 }}>
              <FileText size={14} /> {saved.length}
            </button>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])}
                className="btn btn-ghost btn-sm" style={{ gap: 4, fontSize: 12 }}>
                <Plus size={14} /> {l.new_chat}
              </button>
            )}
          </div>
        </div>

        {/* Saved strategies sidebar */}
        <AnimatePresence>
          {showSaved && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 16, overflow: 'hidden' }}>
              <div className="card" style={{ padding: '16px', maxHeight: 300, overflowY: 'auto' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l.saved_title}</p>
                {saved.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No saved strategies yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {saved.map(s => (
                      <div key={s.id} className="card" style={{ padding: '10px 14px', background: 'var(--bg-card2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button onClick={() => copyToClipboard(s.content, s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                              {copied === s.id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                            </button>
                            <button onClick={() => exportAsPdf(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                              <Download size={12} />
                            </button>
                            <button onClick={() => deleteStrategy(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
          {messages.length === 0 ? (
            <div style={{ padding: '32px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Lightbulb size={28} style={{ color: 'var(--blue)' }} />
                </div>
                <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6 }}>{l.subtitle}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {starters.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="card" style={{ padding: '14px 18px', textAlign: lang === 'ar' ? 'right' : 'left', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', flex: 1 }}>{s}</span>
                    <ChevronRight size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'user' ? (
                    <div style={{ maxWidth: '85%', padding: '12px 18px', borderRadius: '18px 18px 4px 18px', background: 'var(--blue)', color: '#fff', fontSize: 14, lineHeight: 1.6 }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div style={{ maxWidth: '95%', width: '100%' }}>
                      <div className="card" style={{ padding: '18px 20px' }}>
                        <MarkdownText text={msg.content} />
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button onClick={() => copyToClipboard(msg.content, `msg-${i}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                          {copied === `msg-${i}` ? <Check size={11} color="#22c55e" /> : <Copy size={11} />} Copy
                        </button>
                        <button onClick={() => saveStrategy(msg)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                          <Save size={11} /> Save
                        </button>
                        <button onClick={() => exportAsPdf({ title: messages[i - 1]?.content?.slice(0, 60) || 'Strategy', content: msg.content })}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                          <Download size={11} /> PDF
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px' }}>
                  <Loader2 size={18} className="animate-spin" style={{ color: 'var(--blue)' }} />
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('thinking')}</span>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={l.placeholder}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="btn btn-primary btn-sm" style={{ flexShrink: 0, width: 48, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
