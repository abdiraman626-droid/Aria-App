import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mic, MessageCircle, Calendar, Globe, Save, Eye, EyeOff, Play, LogOut, Crown, Zap, Star, CheckCircle, RefreshCw, ExternalLink, Loader2, Users, CreditCard, Link2, Mail, Square, Lock, BookOpen, Building, Building2, MessageSquare, X, Send } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLang, LANGUAGES } from '../context/LangContext';
import { usePlan } from '../hooks/usePlan';
import { voice, VOICES, RACHEL_ID, MATILDA_ID, LIAM_ID } from '../services/voice';
import { connectGoogle, disconnectGoogle, getProfile } from '../services/google';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import UpgradePrompt from '../components/UpgradePrompt';
import UpgradeModal from '../components/UpgradeModal';
import HintIcon from '../components/HintIcon';
import toast from 'react-hot-toast';

const PLAN_ICONS  = { individual: Star, corporate_mini: Zap, corporate: Building, major_corporate: Crown, enterprise: Building2 };
const PLAN_COLORS = { individual: '#3b82f6', corporate_mini: '#7c3aed', corporate: '#22c55e', major_corporate: '#f59e0b', enterprise: '#ef4444' };

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
  const { lang, setLang, t } = useLang();
  const { plan, hasTeam, hasMpesa, hasCustomVoice, hasClientPortal, isIndividual, isCorporate, isMajorCorporate, isEnterprise } = usePlan();
  const hasPriority = isCorporate || isMajorCorporate || isEnterprise;
  const isPremium = hasCustomVoice; // for voice premium gate
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
  const [upgradePlan, setUpgradePlan] = useState(null);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionType, setSuggestionType] = useState('feedback');
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionSending, setSuggestionSending] = useState(false);

  // Sync with context — user may load after this component mounts
  useEffect(() => {
    setGoogleConn(user?.googleConnected || false);
  }, [user?.googleConnected]);

  const PlanIcon  = PLAN_ICONS[user?.plan]  || Star;
  const planColor = PLAN_COLORS[user?.plan] || '#3b82f6';

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

  const submitSuggestion = async () => {
    if (!suggestionText.trim()) { toast.error('Please write your suggestion'); return; }
    setSuggestionSending(true);
    try {
      // Save to Firestore
      await addDoc(collection(db, 'suggestions'), {
        userId: user?.id || null,
        userName: user?.name || 'Anonymous',
        userEmail: user?.email || '',
        type: suggestionType,
        message: suggestionText.trim(),
        createdAt: serverTimestamp(),
        status: 'new',
      });
      // Send email notification (best-effort)
      fetch('/api/submit-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: user?.name, userEmail: user?.email,
          type: suggestionType, message: suggestionText.trim(),
        }),
      }).catch(() => {});
      toast.success('Thank you for your feedback!');
      setSuggestionText(''); setSuggestionType('feedback'); setSuggestionOpen(false);
    } catch { toast.error('Failed to submit. Try again.'); }
    finally { setSuggestionSending(false); }
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
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 24 }}>{t('settings')}</h1>

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
                    {PLAN_META[user?.plan]?.label || 'Individual'} Plan
                  </p>
                  {hasPriority && (
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
            {!isEnterprise && (
              <button onClick={() => setUpgradePlan('corporate_mini')} className="btn btn-sm" style={{ background: planColor, color: '#fff', border: 'none', cursor: 'pointer' }}>
                {t('upgrade')}
              </button>
            )}
          </div>

          {/* Profile */}
          <Section icon={User} title={t('profile')} accent="#3b82f6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">{t('full_name')}</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="label">{t('whatsapp_number')}</label>
                <input className="input" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+254 7XX XXX XXX" />
              </div>
              <button onClick={saveProfile} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                <Save size={14} /> {t('save_profile')}
              </button>
            </div>
          </Section>

          {/* Language */}
          <Section icon={Globe} title={t('language')} accent="#22c55e">
            <Row label={t('interface_language')} hint="Affects all text, buttons, and voice briefings">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${lang === l.code ? '#22c55e' : 'var(--border)'}`, background: lang === l.code ? 'rgba(34,197,94,0.1)' : 'var(--bg-card2)', color: lang === l.code ? '#22c55e' : 'var(--text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{ fontSize: 18 }}>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          {/* ElevenLabs Voice */}
          <Section icon={Mic} title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Voice — ElevenLabs <HintIcon hint="Choose from 5 AI voices. Preview each before selecting. Add your free ElevenLabs API key to unlock high-quality voices. Without a key, ARIA uses your browser's built-in speech." /></span>} accent="#7c3aed">
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', marginBottom: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Get your free API key at <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" style={{ color: '#7c3aed' }}>elevenlabs.io</a>. Without a key, ARIA uses your browser's built-in speech.
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
                          background: selected ? 'rgba(124,58,237,0.12)' : 'var(--bg-card2)',
                          border: `1px solid ${selected ? '#7c3aed' : 'var(--border)'}`,
                          opacity: locked ? 0.5 : 1, transition: 'all 0.2s', position: 'relative',
                        }}>
                        {isPremiumVoice && (
                          <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                            {locked ? '👑 Premium' : '👑'}
                          </span>
                        )}
                        <p style={{ fontWeight: 700, fontSize: 13, color: selected ? '#7c3aed' : '#fff', marginBottom: 2 }}>{v.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.3 }}>{v.desc}</p>
                        <button
                          type="button"
                          disabled={testing || locked}
                          onClick={(e) => { e.stopPropagation(); if (!locked) testVoice(v.id); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                            borderRadius: 8, border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                            fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
                            background: testingId === v.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
                            color: testingId === v.id ? '#7c3aed' : 'var(--text-muted)',
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
          <Section icon={Calendar} title="Google Integration" accent="#3b82f6">
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
          <Section icon={Users} title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Team Management <HintIcon hint="Invite colleagues by email, share a join link, and assign reminders to team members. Business: up to 5 members. Premium: unlimited." /></span>} accent={hasTeam ? '#7c3aed' : '#6b7280'}>
            {hasTeam ? (
              <>
                <Row label="Team Members" hint={isEnterprise ? 'Unlimited team members' : `Up to ${isIndividual ? 3 : isCorporate ? 50 : isMajorCorporate ? 500 : 10} members`}>
                  <Link to="/team" className="btn btn-sm" style={{ background: '#7c3aed', color: '#fff', border: 'none', textDecoration: 'none' }}>
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
              <UpgradePrompt feature="Team collaboration & shared reminders" requiredPlan="corporate_mini" />
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
              <UpgradePrompt feature="M-Pesa payment tracking & reminders" requiredPlan="corporate" />
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
              <UpgradePrompt feature="Client self-service portal" requiredPlan="corporate_mini" />
            )}
          </Section>

          {/* Support */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
            {hasPriority ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>Priority Support</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Dedicated support for {PLAN_META[plan]?.label || plan} plan</p>
                </div>
                <a
                  href="mailto:support@arialife.app?subject=Support Request — ARIA"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: planColor, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                  <Mail size={13} /> Contact Support
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Need help? Check our docs or upgrade for priority support.</p>
                <a href="mailto:support@arialife.app" style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>Contact</a>
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

          {/* Suggestion Box */}
          <button onClick={() => setSuggestionOpen(true)} style={{ width: '100%', textDecoration: 'none' }}>
            <div className="card" style={{ padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageSquare size={16} style={{ color: 'var(--blue)' }} />
                <span style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>
                  {lang === 'ar' ? 'صندوق الاقتراحات' : lang === 'so' ? 'Sanduuqa Talooyinka' : lang === 'sw' ? 'Sanduku la Mapendekezo' : 'Suggestion Box'}
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                {lang === 'ar' ? 'أرسل' : lang === 'so' ? 'Dir' : lang === 'sw' ? 'Tuma' : 'Submit'} →
              </span>
            </div>
          </button>

          {/* Suggestion Modal */}
          <AnimatePresence>
            {suggestionOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={() => setSuggestionOpen(false)} />
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                  className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '85svh', overflowY: 'auto' }}>
                  <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} /></div>
                  <div className="px-6 pt-2 pb-8">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MessageSquare size={20} style={{ color: 'var(--blue)' }} />
                        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>
                          {lang === 'ar' ? 'صندوق الاقتراحات' : lang === 'so' ? 'Sanduuqa Talooyinka' : lang === 'sw' ? 'Sanduku la Mapendekezo' : 'Suggestion Box'}
                        </h2>
                      </div>
                      <button onClick={() => setSuggestionOpen(false)} className="p-2 rounded-xl" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.6 }}>
                      {lang === 'ar' ? 'شاركنا ملاحظاتك أو طلبا�� الميزات أو تقارير الأخطاء.' : lang === 'so' ? 'Nala wadaag ra\'yigaaga, codsiyada sifooyinka, ama warbixinaha cilladaha.' : lang === 'sw' ? 'Shiriki maoni yako, maombi ya vipengele, au ripoti za hitilafu.' : 'Share your feedback, feature requests, or bug reports with us.'}
                    </p>

                    {/* Type selector */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      {[
                        { id: 'feedback', label: lang === 'ar' ? 'ملاحظات' : lang === 'so' ? 'Ra\'yi' : lang === 'sw' ? 'Maoni' : 'Feedback', emoji: '💬' },
                        { id: 'feature', label: lang === 'ar' ? 'طلب ميزة' : lang === 'so' ? 'Codsi' : lang === 'sw' ? 'Ombi' : 'Feature', emoji: '💡' },
                        { id: 'bug', label: lang === 'ar' ? 'خطأ' : lang === 'so' ? 'Cillad' : lang === 'sw' ? 'Hitilafu' : 'Bug', emoji: '🐛' },
                      ].map(opt => (
                        <button key={opt.id} onClick={() => setSuggestionType(opt.id)}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${suggestionType === opt.id ? 'var(--blue)' : 'var(--border)'}`, background: suggestionType === opt.id ? 'rgba(59,130,246,0.1)' : 'transparent', color: suggestionType === opt.id ? 'var(--blue)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {opt.emoji} {opt.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      className="input"
                      rows={5}
                      value={suggestionText}
                      onChange={e => setSuggestionText(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب اقتراحك هنا...' : lang === 'so' ? 'Halkan ku qor talodaada...' : lang === 'sw' ? 'Andika pendekezo lako hapa...' : 'Write your suggestion here...'}
                      style={{ resize: 'vertical', marginBottom: 16 }}
                    />

                    <button onClick={submitSuggestion} disabled={suggestionSending || !suggestionText.trim()}
                      className="btn btn-primary btn-lg w-full" style={{ gap: 8 }}>
                      {suggestionSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {lang === 'ar' ? 'إرسال' : lang === 'so' ? 'Dir' : lang === 'sw' ? 'Tuma' : 'Submit'}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

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
              <LogOut size={16} /> {t('sign_out')}
            </button>
          </div>
        </motion.div>
      </div>
      <BottomNav />
      <UpgradeModal open={!!upgradePlan} planId={upgradePlan} onClose={() => setUpgradePlan(null)} />
    </div>
  );
}
