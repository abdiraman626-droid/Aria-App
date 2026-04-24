import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Eye, EyeOff, ArrowRight, Loader2, Users } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function Join() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [invite,      setInvite]      = useState(null);
  const [inviteDocId, setInviteDocId] = useState(null);
  const [inviteErr,   setInviteErr]   = useState('');
  const [loading,     setLoading]     = useState(true);
  const [name,        setName]        = useState('');
  const [password,    setPassword]    = useState('');
  const [show,        setShow]        = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    if (!token) { setInviteErr('No invite token found. Ask your team owner for a new invite link.'); setLoading(false); return; }

    getDocs(query(collection(db, 'team_members'), where('inviteToken', '==', token)))
      .then(snap => {
        if (snap.empty) { setInviteErr('Invite link not found or already used.'); }
        else {
          const d = snap.docs[0];
          const row = d.data();
          if (row.status === 'active') {
            setInviteErr('This invite has already been accepted. Sign in instead.');
          } else {
            setInvite(row);
            setInviteDocId(d.id);
          }
        }
        setLoading(false);
      });
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter your name'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSubmitting(true);
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, invite.invitedEmail, password);

      // Create Firestore profile
      await setDoc(doc(db, 'users', fbUser.uid), {
        name:                name.trim(),
        email:               invite.invitedEmail,
        plan:                'business',
        whatsappNumber:      '',
        googleConnected:     false,
        googleEmail:         null,
        onTrial:             false,
        trialEnds:           null,
        monthlyPrice:        299,
        active:              true,
        onboardingCompleted: false,
        createdAt:           serverTimestamp(),
      });

      // Mark invite as accepted
      await updateDoc(doc(db, 'team_members', inviteDocId), {
        memberId: fbUser.uid,
        name:     name.trim(),
        status:   'active',
      });

      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 400, background: 'radial-gradient(ellipse,rgba(124,58,237,0.08),transparent 70%)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={20} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800 }}>ARIA</span>
        </div>

        <div className="card" style={{ padding: '36px 32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--blue)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Checking invite...</p>
            </div>
          ) : inviteErr ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={22} color="#ef4444" />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Invite not found</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>{inviteErr}</p>
              <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600, fontSize: 14 }}>Go to Sign In →</Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="#7c3aed" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#7c3aed' }}>Team Invite</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {invite.ownerName || 'Your team owner'} invited you to join ARIA
                  </p>
                </div>
              </div>

              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Create your account</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                Join {invite.ownerName || 'the team'} on ARIA
              </p>

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label">Your Name *</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Amina Wanjiku" autoFocus />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" value={invite.invitedEmail} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label className="label">Choose Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" style={{ paddingRight: 52 }} />
                    <button type="button" onClick={() => setShow(!show)}
                      style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-lg w-full" style={{ marginTop: 4 }}>
                  {submitting
                    ? <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                    : <>Join Team <ArrowRight size={18} /></>
                  }
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
