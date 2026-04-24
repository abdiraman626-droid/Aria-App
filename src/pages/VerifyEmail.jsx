import { motion } from 'framer-motion';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function VerifyEmail({ email }) {
  const [resending, setResending] = useState(false);

  const resend = async () => {
    setResending(true);
    try {
      const fbUser = auth.currentUser;
      if (fbUser) {
        await sendEmailVerification(fbUser);
        toast.success('Verification email sent!');
      } else {
        toast.error('Please sign in first, then request a new verification email.');
      }
    } catch {
      toast.error('Could not resend. Try again in a few minutes.');
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background:'var(--bg)' }}>
      <motion.div
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:420, textAlign:'center' }}
      >
        {/* Icon */}
        <div style={{ width:80, height:80, borderRadius:24, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px' }}>
          <Mail size={36} style={{ color:'var(--blue)' }}/>
        </div>

        <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, marginBottom:12 }}>
          Check your email
        </h1>

        <p style={{ fontSize:16, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:8 }}>
          We sent a verification link to
        </p>
        {email && (
          <p style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:24 }}>{email}</p>
        )}
        <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.7, marginBottom:36 }}>
          Click the link in the email to activate your ARIA account and start your 7-day free trial.
          Check your spam folder if you don't see it.
        </p>

        <button
          onClick={resend}
          disabled={resending}
          className="btn btn-primary btn-lg w-full"
          style={{ marginBottom:16 }}
        >
          {resending
            ? <><RefreshCw size={16} className="animate-spin"/> Resending...</>
            : <><Mail size={16}/> Resend verification email</>
          }
        </button>

        <Link to="/login" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:14, color:'var(--text-muted)', textDecoration:'none', fontWeight:600 }}>
          <ArrowLeft size={14}/> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
