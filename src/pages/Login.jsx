import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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

export default function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect as soon as Firebase confirms the session — avoids the PrivateRoute race
  // where navigate('/dashboard') fires before onAuthStateChanged sets user in state.
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user]);
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [show,          setShow]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe,    setRememberMe]    = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
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
      <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:600, height:400, background:'radial-gradient(ellipse,rgba(79,110,247,0.08),transparent 70%)', pointerEvents:'none' }} />

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginBottom:40 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#4F6EF7,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Mic size={20} color="#fff" />
          </div>
          <span style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800 }}>ARIA</span>
        </div>

        <div className="card" style={{ padding:'36px 32px' }}>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:28 }}>Sign in to your ARIA account</p>

          {/* Google OAuth */}
          <button onClick={handleGoogle} disabled={googleLoading} className="btn btn-ghost btn-lg w-full" style={{ marginBottom:20, gap:10 }}>
            {googleLoading ? <Loader2 size={18} className="animate-spin"/> : <GoogleIcon/>}
            {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>or sign in with email</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.co.ke" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={show?'text':'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight:52 }} autoComplete="current-password" />
                <button type="button" onClick={() => setShow(!show)} style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width:16, height:16, accentColor:'var(--blue)', cursor:'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize:14, color:'var(--text-secondary)', cursor:'pointer', userSelect:'none' }}>
                Remember me
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full" style={{ marginTop:4 }}>
              {loading ? <><Loader2 size={18} className="animate-spin"/>Signing in...</> : <>Sign In <ArrowRight size={18}/></>}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:14, color:'var(--text-muted)', marginTop:24 }}>
            No account?{' '}
            <Link to="/signup" style={{ color:'var(--blue)', fontWeight:600 }}>Start free trial</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
