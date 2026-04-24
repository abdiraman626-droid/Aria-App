import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Eye, EyeOff, ArrowRight, Loader2, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { sanitize } from '../lib/sanitize';

const PLANS = [
  { id:'individual',      label:'Individual',      price:'5,000',   desc:'1–3 people' },
  { id:'corporate_mini',  label:'Corporate Mini',  price:'15,000',  desc:'5–10 people', popular:true },
  { id:'corporate',       label:'Corporate',       price:'30,000',  desc:'10–50 people' },
  { id:'major_corporate', label:'Major Corporate', price:'100,000', desc:'Up to 500' },
  { id:'enterprise',      label:'Enterprise',      price:'250,000', desc:'500+' },
];

// Google G icon SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const [params] = useSearchParams();

  const [form,        setForm]        = useState({ name:'', email:'', phone:'', password:'', plan: params.get('plan') || 'individual' });
  const [show,        setShow]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreed,      setAgreed]      = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill in required fields'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!agreed) { toast.error('Please agree to the Terms of Service to continue'); return; }
    setLoading(true);
    try {
      await signup({ ...form, name: sanitize(form.name, 100) });
      // onAuthStateChanged in AuthContext will set user → PrivateRoute redirects to dashboard
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try { await loginWithGoogle(); }
    catch { toast.error('Google sign-in failed'); setGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ background:'var(--bg)' }}>
      <div style={{ position:'absolute', top:'10%', right:'10%', width:400, height:400, background:'radial-gradient(ellipse,rgba(124,58,237,0.08),transparent 70%)', pointerEvents:'none' }} />

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} style={{ width:'100%', maxWidth:440 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginBottom:40 }}>
          <img src="/logo.png" alt="ARIA Life" style={{ width:44, height:44, borderRadius:14, objectFit:'cover' }} />
          <span style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800 }}>ARIA</span>
        </div>

        <div className="card" style={{ padding:'36px 32px' }}>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:800, marginBottom:4 }}>Create your account</h1>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#22c55e', marginBottom:24 }}>
            <Shield size={13}/> 7-day free trial · No credit card required
          </div>

          {/* Google OAuth */}
          <button onClick={handleGoogle} disabled={googleLoading} className="btn btn-ghost btn-lg w-full" style={{ marginBottom:20, gap:10 }}>
            {googleLoading ? <Loader2 size={18} className="animate-spin"/> : <GoogleIcon/>}
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>or sign up with email</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          {/* Plan selector */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:8, marginBottom:20 }}>
            {PLANS.map(p => (
              <button key={p.id} type="button" onClick={() => setForm(f => ({ ...f, plan:p.id }))}
                style={{ padding:'10px 8px', borderRadius:14, border:`1px solid ${form.plan===p.id?'#3b82f6':'var(--border)'}`, background: form.plan===p.id?'rgba(59,130,246,0.1)':'var(--bg-card2)', cursor:'pointer', position:'relative' }}>
                {p.popular && <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', background:'#7c3aed', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:100, whiteSpace:'nowrap' }}>POPULAR</div>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                  <span style={{ fontSize:12, fontWeight:700, color: form.plan===p.id?'#3b82f6':'#fff' }}>{p.label}</span>
                  {form.plan===p.id && <Check size={11} color="#3b82f6"/>}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>KSH {p.price}/mo</div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Amina Wanjiku" autoComplete="name" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.co.ke" autoComplete="email" />
            </div>
            <div>
              <label className="label">WhatsApp Number</label>
              <input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+254 7XX XXX XXX" />
            </div>
            <div>
              <label className="label">Password *</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={show?'text':'password'} value={form.password} onChange={set('password')} placeholder="Min 8 characters" style={{ paddingRight:52 }} autoComplete="new-password" />
                <button type="button" onClick={() => setShow(!show)} style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            {/* Terms agreement */}
            <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', userSelect:'none' }}>
              <div
                onClick={() => setAgreed(a => !a)}
                style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${agreed ? '#3b82f6' : 'var(--border)'}`, background: agreed ? '#3b82f6' : 'transparent', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', cursor:'pointer' }}>
                {agreed && <Check size={11} color="#fff" />}
              </div>
              <span style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.55 }}>
                I agree to ARIA's{' '}
                <Link to="/terms" target="_blank" style={{ color:'var(--blue)' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" style={{ color:'var(--blue)' }}>Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" disabled={loading || !agreed} className="btn btn-primary btn-lg w-full" style={{ marginTop:4, opacity: !agreed ? 0.6 : 1 }}>
              {loading ? <><Loader2 size={18} className="animate-spin"/>Creating account...</> : <>Start Free Trial <ArrowRight size={18}/></>}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)', marginTop:20, lineHeight:1.6 }}>
            Questions? <a href="mailto:support@ariaassistant.co.ke" style={{ color:'var(--blue)' }}>support@ariaassistant.co.ke</a>
          </p>
          <p style={{ textAlign:'center', fontSize:14, color:'var(--text-muted)', marginTop:12 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--blue)', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
