import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mic, MessageCircle, Calendar, Globe, Save, Eye, EyeOff, Play, LogOut, Crown, Zap, Star, CheckCircle, RefreshCw, ExternalLink, Loader2, Users, CreditCard, Link2, Mail, Square, Lock, BookOpen, Building, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { usePlan } from '../hooks/usePlan';
import { voice, VOICES, RACHEL_ID, MATILDA_ID, LIAM_ID } from '../services/voice';
import { connectGoogle, disconnectGoogle, getProfile } from '../services/google';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import UpgradePrompt from '../components/UpgradePrompt';
import HintIcon from '../components/HintIcon';
import toast from 'react-hot-toast';

const PLAN_ICONS  = { individual: Star, corporate_mini: Zap, corporate: Building, major_corporate: Crown, enterprise: Building2 };
const PLAN_COLORS = { individual: '#4F6EF7', corporate_mini: '#8B5CF6', corporate: '#22c55e', major_corporate: '#f59e0b', enterprise: '#ef4444' };

function Section({ icon: Icon, title, children, accent, locked }) {
  return (
    <div className="card" style={{ padding: '24px', marginBottom: 16, opacity: locked ? 0.85 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent ? `${accent}18` : 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color: accent || 'var(--text-muted)' }} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border)' }}
      className="last:border-0 last:mb-0 last:pb-0">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{label}</p>
          {hint && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser, logout, PLAN_META } = useAuth();
  const { lang, setLang } = useLang();
  const { hasTeam, hasMpesa, hasCustomVoice, hasClientPortal, isPersonal, isBusiness, isPremium } = usePlan();
  const navigate = useNavigate();

  const [name,          setName]          = useState(user?.name || '');
  const [whatsapp,      setWhatsapp]      = useState(user?.whatsappNumber || '');
  const [elKey,         setElKey]         = useState(localStorage.getItem('aria_el_key') || import.meta.env.VITE_ELEVENLABS_API_KEY || '');
  const [voiceId,       setVoiceId]       = useState(localStorage.getItem('aria_voice_id') || RACHEL_ID);
  const [showKey,       setShowKey]       = useState(false);
  const [testing,       setTesting]       = useState(false);
  const [testingId,     setTestingId]     = useState(null); // which voice is being previewed
  const [googleConn,    setGoogleConn]    = useState(user?.googleConnected || false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleProfile = getProfile();

  // Sync with context — user may load after this component mounts
  useEffect(() => {
    setGoogleConn(user?.googleConnected || false);
  }, [user?.googleConnected]);

  const PlanIcon  = PLAN_ICONS[user?.plan]  || Star;
  const planColor = PLAN_COLORS[user?.plan] || '#4F6EF7';

  const saveProfile = () => {
    updateUser({ name, whatsappNumber: whatsapp });
    toast.success('Profile saved');
  };

  const saveVoice = () => {
    localStorage.setItem('aria_el_key',  elKey);
    localStorage.setItem('aria_voice_id', voiceId);
    toast.success('Voice settings saved');
  };

  const testVoice = async (id = voiceId) => {
    setTesting(true);
    setTestingId(id);
    localStorage.setItem('aria_el_key',  elKey);
    localStorage.setItem('aria_voice_id', id);
    const svc  = voice();
    const vName = VOICES.find(v => v.id === id)?.name || 'ARIA';
    const text = lang === 'sw'
      ? `Habari! Mimi ni ${vName}. Sauti yangu inafanya kazi vizuri.`
      : `Hello! I'm ${vName}. I'll keep you on track with your schedule.`;
    try { await svc.speak(text, lang); }
    catch { toast.error('Voice test failed — check your API key'); }
    finally { setTesting(false); setTestingId(null); }
  };

  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { token, expiry, profile } = await connectGoogle();
      setGoogleConn(true);
      // connectGoogle() already saved to Firestore — just sync local state
      updateUser({
        googleConnected:   true,
        googleEmail:       profile?.email || null,
      });
      toast.success(`Connected as ${profile?.email || 'Google account'}`);
    } catch (err) {
      const code = err.code || err.message || '';
      const silent = code.includes('popup-closed') || code.includes('access_denied');
      if (!silent) toast.error('Google sign-in failed. Try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogle();
    setGoogleConn(false);
    updateUser({ googleConnected: false, googleEmail: null });
    toast.success('Google disconnected');
  };

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '72px 20px 0' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 24 }}>Settings</h1>

          {/* Plan card */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 16, background: `${planColor}08`, border: `1px solid ${planColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${planColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlanIcon size={20} style={{ color: planColor }} />
              </div>
              <div>
                <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>
                    {user?.plan ? `${user.plan[0].toUpperCase() + user.plan.slice(1)} Plan` : 'Free'}
                  </p>
                  {(user?.plan === 'business' || user?.plan === 'premium') && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                      ⚡ Priority Support
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {user?.onTrial
                    ? `Free trial · ${Math.max(0, Math.ceil((new Date(user.trialEnds) - Date.now()) / 864e5))} days left`
                    : `KSH ${(user?.monthlyPrice || 0).toLocaleString()}/month`
                  }
                </p>
              </div>
              </div>
            </div>
            {user?.plan !== 'premium' && (
              <Link to="/signup?plan=premium" className="btn btn-sm" style={{ background: planColor, color: '#fff', border: 'none' }}>
                Upgrade
              </Link>
            )}
          </div>

          {/* Profile */}
          <Section icon={User} title="Profile" accent="#4F6EF7">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="label">WhatsApp Number</label>
                <input className="input" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+254 7XX XXX XXX" />
              </div>
              <button onClick={saveProfile} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                <Save size={14} /> Save Profile
              </button>
            </div>
          </Section>

          {/* Language */}
          <Section icon={Globe} title="Language" accent="#22c55e">
            <Row label="Interface & Voice Language" hint="Affects all text and voice briefings">
              <div style={{ display: 'flex', gap: 8 }}>
                {[['en', 'English'], ['sw', 'Kiswahili']].map(([code, label]) => (
                  <button key={code} onClick={() => { setLang(code); localStorage.setItem('aria_lang', code); }}
                    style={{ padding: '8px 18px', borderRadius: 12, border: `1px solid ${lang === code ? '#22c55e' : 'var(--border)'}`, background: lang === code ? 'rgba(34,197,94,0.1)' : 'var(--bg-card2)', color: lang === code ? '#22c55e' : 'var(--text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          {/* ElevenLabs Voice */}
          <Section icon={Mic} title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Voice — ElevenLabs <HintIcon hint="Choose from 5 AI voices. Preview each before selecting. Add your free ElevenLabs API key to unlock high-quality voices. Without a key, ARIA uses your browser's built-in speech." /></span>} accent="#8B5CF6">
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Get your free API key at <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ color: '#8B5CF6' }}>elevenlabs.io</a>. Without a key, ARIA uses your browser's built-in speech.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">API Key</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showKey ? 'text' : 'password'} value={elKey} onChange={e => setElKey(e.target.value)} placeholder="sk_..." style={{ paddingRight: 52 }} />
                  <button type="button" onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Choose Voice</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {VOICES.map(v => {
                    const isPremiumVoice = v.premium;
                    const locked = isPremiumVoice && !isPremium;
                    const selected = voiceId === v.id;
                    return (
                      <div key={v.id}
                        onClick={() => { if (!locked) { setVoiceId(v.id); localStorage.setItem('aria_voice_id', v.id); } }}
                        style={{
                          padding: '12px 14px', borderRadius: 14, cursor: locked ? 'not-allowed' : 'pointer',
                          background: selected ? 'rgba(139,92,246,0.12)' : 'var(--bg-card2)',
                          border: `1px solid ${selected ? '#8B5CF6' : 'var(--border)'}`,
                          opacity: locked ? 0.5 : 1, transition: 'all 0.2s', position: 'relative',
                        }}>
                        {isPremiumVoice && (
                          <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                            {locked ? '👑 Premium' : '👑'}
                          </span>
                        )}
                        <p style={{ fontWeight: 700, fontSize: 13, color: selected ? '#8B5CF6' : '#fff', marginBottom: 2 }}>{v.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.3 }}>{v.desc}</p>
                        <button
                          type="button"
                          disabled={testing || locked}
                          onClick={(e) => { e.stopPropagation(); if (!locked) testVoice(v.id); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                            borderRadius: 8, border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                            fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
                            background: testingId === v.id ? 'rgba(139,92,246,0.2)' : 'var(--bg-card)',
                            color: testingId === v.id ? '#8B5CF6' : 'var(--text-muted)',
                          }}>
                          {testingId === v.id
                            ? <><Square size={9} style={{ fill: 'currentColor' }} /> Stop</>
                            : <><Play size={9} /> Preview</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={saveVoice} className="btn btn-primary btn-sm">
                  <Save size={13} /> Save Voice Settings
                </button>
              </div>
            </div>
          </Section>

          {/* Google Integration */}
          <Section icon={Calendar} title="Google Integration" accent="#4F6EF7">
            <Row
              label="Gmail & Google Calendar"
              hint={googleConn ? 'Events and emails synced to your dashboard' : 'Connect to show real calendar events and emails'}
            >
              {googleConn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#22c55e', fontWeight: 600 }}>
                      <CheckCircle size={14} /> Connected
                    </div>
                    {(googleProfile?.email || user?.googleEmail) && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {googleProfile?.email || user?.googleEmail}
                      </span>
                    )}
                  </div>
                  <button onClick={handleDisconnectGoogle} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Disconnect
                  </button>
                </div>
              ) : (
                <button onClick={handleConnectGoogle} disabled={googleLoading} className="btn btn-sm" style={{ background: '#4285f4', color: '#fff', border: 'none' }}>
                  {googleLoading
                    ? <><Loader2 size={13} className="animate-spin" /> Connecting...</>
                    : <><ExternalLink size={13} /> Connect Google</>
                  }
                </button>
              )}
            </Row>
          </Section>

          {/* WhatsApp */}
          <Section icon={MessageCircle} title="WhatsApp" accent="#22c55e">
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Tap the WhatsApp button on any reminder to send it to your own number. Add your number in Profile above.
            </div>
            <Row label="Quick Send Test" hint="Sends a test reminder to your WhatsApp number">
              <button onClick={() => {
                if (!whatsapp) { toast.error('Add WhatsApp number in Profile'); return; }
                const msg = encodeURIComponent(`🔔 *ARIA Test*\n\nYour WhatsApp integration is working! ✅\n\n_Sent by ARIA_`);
                window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${msg}`);
              }} className="btn btn-sm" style={{ background: '#22c55e', color: '#fff', border: 'none' }}>
                <MessageCircle size={13} /> Send Test
              </button>
            </Row>
          </Section>

          {/* Team Management — Business feature */}
          <Section icon={Users} title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Team Management <HintIcon hint="Invite colleagues by email, share a join link, and assign reminders to team members. Business: up to 5 members. Premium: unlimited." /></span>} accent={hasTeam ? '#8B5CF6' : '#6b7280'}>
            {hasTeam ? (
              <>
                <Row label="Team Members" hint={isPremium ? 'Unlimited team members' : 'Up to 5 team members'}>
                  <Link to="/team" className="btn btn-sm" style={{ background: '#8B5CF6', color: '#fff', border: 'none', textDecoration: 'none' }}>
                    <Users size={13} /> Manage Team
                  </Link>
                </Row>
                <Row label="Clients" hint="Manage clients and create reminders on their behalf">
                  <Link to="/clients" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none' }}>
                    View Clients →
                  </Link>
                </Row>
                <Row label="Recurring Reminders" hint="Create daily, weekly, or monthly repeating reminders">
                  <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', fontSize: 11 }}>Active</span>
                </Row>
              </>
            ) : (
              <UpgradePrompt feature="Team collaboration & shared reminders" requiredPlan="business" />
            )}
          </Section>

          {/* M-Pesa Integration — Premium feature */}
          <Section icon={CreditCard} title="M-Pesa Payments" accent={hasMpesa ? '#f59e0b' : '#6b7280'}>
            {hasMpesa ? (
              <>
                <Row label="Payment Reminders" hint="Add amount + till/paybill when creating any reminder">
                  <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11 }}>Active</span>
                </Row>
                <Row label="Mark Paid" hint="Tap the M-Pesa icon on any payment reminder to confirm">
                  <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', fontSize: 11 }}>Active</span>
                </Row>
              </>
            ) : (
              <UpgradePrompt feature="M-Pesa payment tracking & reminders" requiredPlan="premium" />
            )}
          </Section>

          {/* Client Portal — Premium feature */}
          <Section icon={Link2} title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Client Portal <HintIcon hint="Send clients a unique link (no login needed). They can view their reminders, confirm appointments, and send you requests — all from their phone browser." /></span>} accent={hasClientPortal ? '#f59e0b' : '#6b7280'}>
            {hasClientPortal ? (
              <>
                <Row label="Shareable Client Links" hint="Generate unique portal links for each client">
                  <Link to="/clients" className="btn btn-sm" style={{ background: '#f59e0b', color: '#000', border: 'none', textDecoration: 'none', fontWeight: 700 }}>
                    <Link2 size={13} /> Open Clients
                  </Link>
                </Row>
                <Row label="Client Access" hint="Clients can view, confirm reminders and make requests — no app needed">
                  <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11 }}>Active</span>
                </Row>
              </>
            ) : (
              <UpgradePrompt feature="Client self-service portal" requiredPlan="premium" />
            )}
          </Section>

          {/* Support */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
            {(user?.plan === 'business' || user?.plan === 'premium') ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>Priority Support</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Dedicated support for {user.plan} plan users</p>
                </div>
                <a
                  href="mailto:support@ariaassistant.co.ke?subject=Support Request — ARIA Premium"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: user.plan === 'premium' ? '#f59e0b' : '#8B5CF6', color: user.plan === 'premium' ? '#000' : '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                  <Mail size={13} /> Contact Support
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Need help? Check our docs or upgrade for priority support.</p>
                <a href="mailto:support@ariaassistant.co.ke" style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>Contact</a>
              </div>
            )}
          </div>

          {/* Help link */}
          <Link to="/help" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen size={16} style={{ color: 'var(--blue)' }} />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Help & Feature Guide</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>View →</span>
            </div>
          </Link>

          {/* Legal links */}
          <div className="card" style={{ padding: '16px 24px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Legal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/terms',   label: 'Terms of Service' },
                { to: '/cookies', label: 'Cookie Policy' },
              ].map((item, i, arr) => (
                <Link key={item.to} to={item.to} target="_blank" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 32, border: '1px solid rgba(239,68,68,0.15)' }}>
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
