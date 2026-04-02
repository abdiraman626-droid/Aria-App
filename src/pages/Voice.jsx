import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Volume2, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/RemindersContext';
import { useLang } from '../context/LangContext';
import { voice, VOICES } from '../services/voice';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const QUICK_PROMPTS = [
  "What's on my schedule today?",
  "Read me my urgent reminders",
  "When is my next meeting?",
  "Summarize my day",
];

const QUICK_PROMPTS_SW = [
  "Niambie ratiba yangu ya leo",
  "Soma vikumbusho vya haraka",
  "Mkutano wangu unaofuata ni lini?",
  "Fupisha siku yangu",
];

export default function Voice() {
  const { user } = useAuth();
  const { upcoming } = useReminders();
  const { lang, t } = useLang();
  const svc = voice();

  const [state,    setState]    = useState('idle'); // idle | listening | thinking | speaking
  const [transcript, setTranscript] = useState('');
  const [response,   setResponse]   = useState('');
  const [displayText, setDisplayText] = useState('');
  const [history,    setHistory]    = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    svc.onStart = () => setState('speaking');
    svc.onEnd   = () => setState('idle');
    return () => { svc.stop(); };
  }, []);

  // Animate text as ARIA speaks
  useEffect(() => {
    if (state === 'speaking' && response) {
      let i = 0;
      setDisplayText('');
      const interval = setInterval(() => {
        setDisplayText(response.slice(0, i));
        i += 3;
        if (i > response.length) { setDisplayText(response); clearInterval(interval); }
      }, 18);
      return () => clearInterval(interval);
    }
  }, [state, response]);

  const buildResponse = (query) => {
    const q = query.toLowerCase();
    const firstName = user?.name?.split(' ')[0] || 'there';
    const topReminders = upcoming.slice(0,4);

    if (q.includes('today') || q.includes('schedule') || q.includes('ratiba') || q.includes('leo')) {
      if (topReminders.length === 0) return lang==='sw' ? `Huna vikumbusho leo, ${firstName}. Siku nzuri!` : `You have no reminders today, ${firstName}. All clear!`;
      const list = topReminders.map((r,i) => `${i+1}. ${r.title} at ${format(new Date(r.dateTime),'h:mm a')}`).join('. ');
      return lang==='sw'
        ? `Leo una vikumbusho ${topReminders.length}, ${firstName}. ${list}.`
        : `You have ${topReminders.length} item${topReminders.length>1?'s':''} today, ${firstName}. ${list}.`;
    }
    if (q.includes('urgent') || q.includes('haraka')) {
      const urgent = upcoming.filter(r=>r.priority==='high');
      if (!urgent.length) return lang==='sw' ? 'Huna vikumbusho vya haraka.' : 'You have no urgent reminders right now.';
      return lang==='sw'
        ? `Una vikumbusho ${urgent.length} vya haraka: ${urgent.map(r=>r.title).join(', ')}.`
        : `You have ${urgent.length} urgent reminder${urgent.length>1?'s':''}: ${urgent.map(r=>r.title).join(', ')}.`;
    }
    if (q.includes('next') || q.includes('meeting') || q.includes('mkutano') || q.includes('unaofuata')) {
      const next = upcoming[0];
      if (!next) return lang==='sw' ? 'Huna mikutano inayokuja.' : 'No upcoming meetings found.';
      return lang==='sw'
        ? `Mkutano wako unaofuata ni ${next.title} saa ${format(new Date(next.dateTime),'h:mm a')}.`
        : `Your next item is ${next.title} at ${format(new Date(next.dateTime),'h:mm a')}.`;
    }
    return lang==='sw'
      ? `Nimeelewa, ${firstName}. Naweza kukusaidia na vikumbusho, ratiba, au masharti mengine. Uliza swali lingine.`
      : `Got it, ${firstName}. I can help you with reminders, your schedule, urgent items, or your next meeting. Try asking something specific.`;
  };

  const handleQuickPrompt = async (prompt) => {
    if (state !== 'idle') return;
    setTranscript(prompt);
    setState('thinking');
    await new Promise(r => setTimeout(r, 700));
    const resp = buildResponse(prompt);
    setResponse(resp);
    setHistory(h => [{ query:prompt, response:resp, time:new Date() }, ...h.slice(0,9)]);
    await svc.speak(resp, lang);
  };

  const startListening = () => {
    if (state !== 'idle') { svc.stop(); setState('idle'); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported. Use Chrome or Safari.');
      return;
    }
    const r = new SpeechRecognition();
    r.lang = lang === 'sw' ? 'sw-KE' : 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    recognitionRef.current = r;

    r.onstart  = () => setState('listening');
    r.onresult = async (e) => {
      const q = e.results[0][0].transcript;
      setTranscript(q);
      setState('thinking');
      await new Promise(res => setTimeout(res, 800));
      const resp = buildResponse(q);
      setResponse(resp);
      setHistory(h => [{ query:q, response:resp, time:new Date() }, ...h.slice(0,9)]);
      await svc.speak(resp, lang);
    };
    r.onerror = () => { setState('idle'); toast.error('Could not hear you. Try again.'); };
    r.onend   = () => { if (state === 'listening') setState('idle'); };
    r.start();
  };

  const stateConfig = {
    idle:      { label: t('tap_to_speak'),  color: '#4F6EF7', pulse: false },
    listening: { label: t('listening'),     color: '#22c55e', pulse: true  },
    thinking:  { label: t('thinking'),      color: '#f59e0b', pulse: false },
    speaking:  { label: t('speaking'),      color: '#8B5CF6', pulse: true  },
  }[state];

  const prompts = lang === 'sw' ? QUICK_PROMPTS_SW : QUICK_PROMPTS;

  return (
    <div className="pb-nav" style={{ minHeight:'100svh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', maxWidth:680, margin:'0 auto', width:'100%', padding:'72px 24px 0', alignItems:'center' }}>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:40 }}>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:800, letterSpacing:'-0.02em', marginBottom:8 }}>
            Voice Assistant
          </h1>
          <p style={{ fontSize:16, color:'var(--text-secondary)' }}>
            Tap the mic and ask ARIA anything
          </p>
        </motion.div>

        {/* ── Giant Mic Button ─────────────────────────── */}
        <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', delay:0.2 }} style={{ position:'relative', marginBottom:32 }}>
          {/* Pulse rings */}
          {(state === 'listening' || state === 'speaking') && (
            <>
              <motion.div animate={{ scale:[1,1.4], opacity:[0.3,0] }} transition={{ duration:1.5, repeat:Infinity }}
                style={{ position:'absolute', inset:-20, borderRadius:'50%', background: `${stateConfig.color}33` }} />
              <motion.div animate={{ scale:[1,1.25], opacity:[0.2,0] }} transition={{ duration:1.5, delay:0.3, repeat:Infinity }}
                style={{ position:'absolute', inset:-8, borderRadius:'50%', background: `${stateConfig.color}22` }} />
            </>
          )}
          <button
            onClick={startListening}
            style={{
              width: 160, height: 160, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${stateConfig.color}, ${stateConfig.color}cc)`,
              boxShadow: `0 0 0 0 ${stateConfig.color}44, 0 24px 80px ${stateConfig.color}44`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
              transition: 'all 0.3s',
              position:'relative',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {state === 'listening' ? (
              <div style={{ display:'flex', gap:5, alignItems:'flex-end', height:40 }}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="eq-bar" style={{ animationDelay:`${i*0.1}s`, background:'#fff', height:8 }} />
                ))}
              </div>
            ) : state === 'speaking' ? (
              <Volume2 size={56} color="#fff" />
            ) : state === 'thinking' ? (
              <Sparkles size={48} color="#fff" style={{ animation:'spin 1s linear infinite' }} />
            ) : (
              <Mic size={56} color="#fff" />
            )}
          </button>
        </motion.div>

        <motion.p animate={{ opacity:1 }} initial={{ opacity:0 }}
          style={{ fontSize:16, color:'var(--text-secondary)', textAlign:'center', marginBottom:8, fontWeight:500 }}>
          {stateConfig.label}
        </motion.p>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="card" style={{ padding:'14px 20px', marginBottom:16, textAlign:'center', maxWidth:380, width:'100%' }}>
              <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:4, fontWeight:600 }}>You said</p>
              <p style={{ fontSize:16, color:'#fff' }}>"{transcript}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ARIA response text */}
        <AnimatePresence>
          {displayText && state === 'speaking' && (
            <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
              style={{ maxWidth:420, width:'100%', textAlign:'center', padding:'0 8px', marginBottom:24 }}>
              <p style={{ fontSize:18, color:'#fff', lineHeight:1.7, fontFamily:'var(--font-head)', fontWeight:500 }}>
                {displayText}
                <span style={{ display:'inline-block', width:2, height:'1em', background:'var(--blue)', marginLeft:2, verticalAlign:'text-bottom', animation:'blink 0.8s step-end infinite' }}>|</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick prompts */}
        {state === 'idle' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }} style={{ width:'100%', maxWidth:440 }}>
            <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', marginBottom:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Quick Questions
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {prompts.map(prompt => (
                <button key={prompt} onClick={() => handleQuickPrompt(prompt)}
                  className="card"
                  style={{ padding:'14px 20px', textAlign:'left', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
                  <span style={{ fontSize:15, color:'var(--text-secondary)' }}>{prompt}</span>
                  <Mic size={14} style={{ color:'var(--blue)', flexShrink:0 }} />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && state === 'idle' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ width:'100%', maxWidth:440, marginTop:28 }}>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:6 }}>
              <Clock size={12}/> Recent
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {history.slice(0,3).map((h,i) => (
                <div key={i} className="card" style={{ padding:'12px 16px' }}>
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>"{h.query}"</p>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>{h.response.slice(0,120)}{h.response.length>120?'...':''}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div style={{ height:32 }} />
      </div>

      <BottomNav />

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
