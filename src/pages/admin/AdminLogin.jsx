import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { checkRateLimit, recordFailedAttempt, clearRateLimit, formatRemaining } from '../../lib/rateLimit';

const NAMESPACE    = 'admin_login';
const ADMIN_EMAIL  = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_HASH   = import.meta.env.VITE_ADMIN_PASS_HASH;

async function sha256(text) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    const limit = checkRateLimit(NAMESPACE);
    if (limit.locked) {
      toast.error(`Too many attempts. Try again in ${formatRemaining(limit.remainingMs)}.`);
      return;
    }

    setLoading(true);
    try {
      const hash = await sha256(pass);
      if (email === ADMIN_EMAIL && hash === ADMIN_HASH) {
        clearRateLimit(NAMESPACE);
        sessionStorage.setItem('aria_admin', '1');
        toast.success('Welcome, Admin');
        navigate('/admin/dashboard');
      } else {
        const result = recordFailedAttempt(NAMESPACE);
        if (result.locked) {
          toast.error('Too many failed attempts. Locked out for 15 minutes.');
        } else {
          toast.error(`Invalid credentials. ${result.attemptsLeft} attempt${result.attemptsLeft !== 1 ? 's' : ''} remaining.`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background:'var(--bg)' }}>
      <motion.div initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} style={{ width:'100%',maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:56, height:56, borderRadius:18, background:'linear-gradient(135deg,#4F6EF7,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Shield size={26} color="#fff"/>
          </div>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:800 }}>ARIA Admin</h1>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:4 }}>Restricted access</p>
        </div>
        <div className="card" style={{ padding:'32px' }}>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="label">Admin Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@ariaassistant.co.ke" autoComplete="off"/>
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={show?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••••••" style={{ paddingRight:52 }} autoComplete="off"/>
                <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
                  {show?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ marginTop:4 }}>
              {loading?<><Loader2 size={16} className="animate-spin"/>Authenticating...</>:<><Shield size={15}/>Sign In</>}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--text-muted)' }}>
          <a href="/" style={{ color:'var(--blue)' }}>← Back to ARIA</a>
        </p>
      </motion.div>
    </div>
  );
}
