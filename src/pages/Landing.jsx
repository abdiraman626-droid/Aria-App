import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Star, Mic, Calendar, Mail, Zap, Crown, X, Building2, Building, Play, Lightbulb, Video, Menu, ChevronDown, Brain, Users, Lock } from 'lucide-react';

const KSH_TO_USD = 130;

const PLANS = [
  { id: 'individual', name: 'Individual', price: 5000, icon: Star, color: '#3b82f6', desc: '1–3 people', highlight: 'AI calendar + voice assistant', features: ['Built-in calendar (manual scheduling)', 'AI assistant', 'Browser & email notifications', 'Multi-language: English, Somali, Arabic', '7-day free trial'] },
  { id: 'corporate_mini', name: 'Corporate Mini', price: 15000, priceNote: '/person', icon: Zap, popular: true, color: '#3b82f6', desc: '5–10 people', highlight: 'Gmail summaries + team management', features: ['Everything in Individual', 'WhatsApp reminders', 'Email summaries', 'Google Calendar sync', 'Team calendar view', 'Member invites by email', '7-day free trial'] },
  { id: 'corporate', name: 'Corporate', price: 30000, icon: Building, color: '#3b82f6', desc: '10–50 people', highlight: 'AI voice assistant + meeting transcription', features: ['Everything in Corporate Mini', 'AI voice assistant', 'Meeting recorder + transcription', 'Priority support', '7-day free trial'] },
  { id: 'major_corporate', name: 'Major Corporate', price: 100000, icon: Crown, color: '#3b82f6', desc: 'Up to 500 people', highlight: 'Analytics + department management', features: ['Everything in Corporate', 'Advanced analytics dashboard', 'Automated weekly meeting reports', 'Multi-department management', '7-day free trial'] },
  { id: 'enterprise', name: 'Enterprise', price: 250000, icon: Building2, color: '#3b82f6', desc: '500+ people', highlight: 'Full platform + executive tools', features: ['Everything in Major Corporate', 'Executive dashboard', 'Monthly AI-generated strategy reports', 'Unlimited AI strategy sessions', 'Direct WhatsApp support line', '7-day free trial'] },
];

const DEMOS = [
  { icon: Mic, color: '#3b82f6', title: 'Voice Planning', desc: 'Speak naturally to create meetings, tasks, and reminders. ARIA understands context and adds them to your calendar instantly.', mockup: [{ label: 'You', text: '"Schedule a board meeting tomorrow at 10am"', side: 'right' }, { label: 'ARIA', text: 'Created: Board Meeting — Tomorrow, 10:00 AM. Added to your calendar.', side: 'left' }] },
  { icon: Mail, color: '#7c3aed', title: 'Email Summaries', desc: 'ARIA reads your Gmail inbox and creates AI-powered summaries — who sent it, what they need, and what action to take.', mockup: [{ from: 'Stripe Billing', subject: 'Q4 Invoice Due', summary: 'Q4 invoice for $45,000. Payment due by Friday. Action: Approve and forward to accounts.' }, { from: 'David Chen — Deloitte', subject: 'Partnership Proposal', summary: 'Joint venture proposal for regional expansion. Action: Review terms and schedule a call.' }] },
  { icon: Calendar, color: '#22c55e', title: 'Smart Calendar', desc: 'Built-in calendar with manual scheduling plus Google Calendar sync. All your events in one unified view.', mockup: [{ time: '9:00 AM', title: 'Team Standup', tag: 'Manual', tagColor: '#22c55e' }, { time: '10:30 AM', title: 'Client Presentation', tag: 'Google', tagColor: '#4285F4' }, { time: '2:00 PM', title: 'Budget Review', tag: 'Manual', tagColor: '#22c55e' }, { time: '4:00 PM', title: 'Strategy Call', tag: 'Google', tagColor: '#4285F4' }] },
  { icon: Lightbulb, color: '#f59e0b', title: 'AI Strategy Advisor', desc: 'Get business plans, marketing strategies, financial projections, and competitor analysis — powered by Claude AI.', mockup: [{ label: 'You', text: '"Create a marketing strategy for a SaaS product targeting SMEs"', side: 'right' }, { label: 'ARIA', text: '## Marketing Strategy\n**Target:** SMEs in growth markets\n**Channels:** Google Ads, LinkedIn, industry events\n**Budget:** $2K/month for 6 months...', side: 'left' }] },
  { icon: Video, color: '#ef4444', title: 'Meeting Recorder', desc: 'Record any meeting, get automatic transcription via AssemblyAI, then a Claude-powered summary with action items.', mockup: [{ step: '1', label: 'Record', desc: 'Tap to record your meeting', active: false }, { step: '2', label: 'Transcribe', desc: 'AssemblyAI converts speech to text', active: false }, { step: '3', label: 'Summarize', desc: 'Claude extracts key decisions & action items', active: true }] },
];

const TABLE = [
  { feature: 'People', individual: '1–3', corporate_mini: '5–10', corporate: '10–50', major_corporate: 'Up to 500', enterprise: '500+' },
  { feature: 'AI assistant', individual: true, corporate_mini: true, corporate: true, major_corporate: true, enterprise: true },
  { feature: 'WhatsApp reminders', individual: false, corporate_mini: true, corporate: true, major_corporate: true, enterprise: true },
  { feature: 'Email summaries', individual: false, corporate_mini: true, corporate: true, major_corporate: true, enterprise: true },
  { feature: 'AI voice assistant', individual: false, corporate_mini: false, corporate: true, major_corporate: true, enterprise: true },
  { feature: 'Meeting recorder', individual: false, corporate_mini: false, corporate: true, major_corporate: true, enterprise: true },
  { feature: 'Advanced analytics', individual: false, corporate_mini: false, corporate: false, major_corporate: true, enterprise: true },
  { feature: 'Executive dashboard', individual: false, corporate_mini: false, corporate: false, major_corporate: false, enterprise: true },
  { feature: 'Unlimited AI strategy sessions', individual: false, corporate_mini: false, corporate: false, major_corporate: false, enterprise: true },
];

const FEATURES = [
  { icon: Mic, title: 'Voice Control', desc: 'Natural speech commands to manage your entire workflow hands-free', color: '#3b82f6' },
  { icon: Brain, title: 'AI Intelligence', desc: 'Claude-powered insights, strategy reports, and smart automation', color: '#7c3aed' },
  { icon: Calendar, title: 'Smart Calendar', desc: 'Unified calendar with Google sync and AI scheduling suggestions', color: '#22c55e' },
  { icon: Mail, title: 'Email Summaries', desc: 'AI reads your inbox and surfaces what matters with action items', color: '#f59e0b' },
  { icon: Users, title: 'Team Management', desc: 'Department tools, member invites, and collaborative workspaces', color: '#ef4444' },
  { icon: Lock, title: 'Enterprise Security', desc: 'Role-based access, audit logs, and encrypted data at rest', color: '#06b6d4' },
];

/* ── Animated reveal on scroll ─────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function Cell({ v }) {
  if (v === true) return <div className="mx-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}><Check size={11} style={{ color: '#22c55e' }} /></div>;
  if (v === false) return <X size={13} style={{ color: 'var(--text-muted)', margin: '0 auto', opacity: 0.3 }} />;
  return <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{v}</span>;
}

/* ── Massive Hero Orb with embedded logo ───────────────────── */
function HeroOrb() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, aspectRatio: '1', margin: '0 auto' }}>
      {/* Massive ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: '-30%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(124,58,237,0.15) 30%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Outer ring 1 - rotating */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(59,130,246,0.12)',
          boxShadow: '0 0 30px rgba(59,130,246,0.05)',
        }}>
        {/* Dot on ring 1 */}
        <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 20px #3b82f6, 0 0 40px #3b82f680' }} />
      </motion.div>

      {/* Outer ring 2 - counter-rotating */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: '6%', borderRadius: '50%',
          border: '1px solid rgba(124,58,237,0.15)',
        }}>
        <div style={{ position: 'absolute', bottom: -4, left: '30%', width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 16px #7c3aed, 0 0 30px #7c3aed80' }} />
        <div style={{ position: 'absolute', top: '20%', right: -4, width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 12px #a855f7' }} />
      </motion.div>

      {/* Ring 3 - dashed */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: '12%', borderRadius: '50%',
          border: '1px dashed rgba(59,130,246,0.1)',
        }}
      />

      {/* Pulsing glow ring */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: '18%', borderRadius: '50%',
          border: '2px solid rgba(59,130,246,0.2)',
          boxShadow: '0 0 40px rgba(59,130,246,0.15), inset 0 0 40px rgba(59,130,246,0.05)',
        }}
      />

      {/* Main orb body */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: '22%', borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #e0c3fc 0%, #a855f7 15%, #7c3aed 35%, #3b82f6 60%, #1e1b4b 85%, #0a0a12 100%)',
          boxShadow: `
            0 0 80px rgba(59,130,246,0.5),
            0 0 160px rgba(124,58,237,0.3),
            0 0 240px rgba(59,130,246,0.15),
            inset 0 0 80px rgba(0,0,0,0.3)
          `,
        }}
      />

      {/* Glass reflection on orb */}
      <div style={{
        position: 'absolute', top: '24%', left: '28%', width: '22%', height: '15%',
        borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(10px)',
        transform: 'rotate(-30deg)',
      }} />

      {/* Sound wave equalizer bars */}
      <div style={{
        position: 'absolute', inset: '22%', borderRadius: '50%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, zIndex: 2,
      }}>
        {[14, 22, 32, 44, 52, 44, 32, 22, 14].map((h, i) => (
          <motion.div key={i}
            animate={{ height: [h * 0.3, h, h * 0.3] }}
            transition={{ duration: 0.6 + i * 0.08, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
            style={{ width: 5, borderRadius: 3, background: 'rgba(255,255,255,0.25)', minHeight: 4 }}
          />
        ))}
      </div>

      {/* Logo embedded in center of orb */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: '33%', borderRadius: '50%', zIndex: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
        <img src="/logo.png" alt="ARIA Life" style={{
          width: '115%', height: '115%', objectFit: 'cover', borderRadius: '50%',
          filter: 'brightness(1.1) contrast(1.1)',
          mixBlendMode: 'screen',
        }} />
      </motion.div>
    </div>
  );
}

/* ── Animated background grid + particles ──────────────────── */
function HeroBackground() {
  return (
    <>
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0.04,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)',
      }} />

      {/* Gradient blobs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '0%', left: '20%', width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 55%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '30%', right: '0%', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 55%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: '5%', left: '10%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 55%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={i}
          animate={{
            y: [0, -(20 + Math.random() * 40), 0],
            opacity: [0.1 + Math.random() * 0.3, 0.5 + Math.random() * 0.3, 0.1 + Math.random() * 0.3],
          }}
          transition={{ duration: 4 + Math.random() * 6, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 5 }}
          style={{
            position: 'absolute',
            top: `${10 + Math.random() * 80}%`,
            left: `${5 + Math.random() * 90}%`,
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            borderRadius: '50%',
            background: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#7c3aed' : '#a855f7',
            boxShadow: `0 0 ${6 + Math.random() * 8}px ${i % 2 === 0 ? '#3b82f680' : '#7c3aed80'}`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

/* ── Scroll progress bar ───────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div style={{
      scaleX, transformOrigin: '0%', position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 100,
      background: 'linear-gradient(90deg, #3b82f6, #7c3aed, #a855f7)',
      boxShadow: '0 0 10px rgba(59,130,246,0.5)',
    }} />
  );
}


export default function Landing() {
  const [usd, setUsd] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const fmtPrice = (p) => usd ? `KSH ${p.toLocaleString()}` : `$${Math.round(p / KSH_TO_USD).toLocaleString()}`;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div style={{ background: '#060608', color: '#fff', overflowX: 'hidden' }}>

      {/* ═══════════════════ NAVBAR ═══════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: scrolled ? 'rgba(6,6,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${scrolled ? '#1a1a1f' : 'transparent'}`,
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="ARIA Life" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '0.04em' }}>ARIA</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#demos" style={{ fontSize: 13, color: '#737380', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#737380'}>Demos</a>
            <a href="#pricing" style={{ fontSize: 13, color: '#737380', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#737380'}>Pricing</a>
            <Link to="/login" style={{ fontSize: 13, color: '#737380', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#737380'}>Sign In</Link>
            <Link to="/signup" style={{
              padding: '6px 16px', borderRadius: 100, border: '1px solid #2a2a30',
              background: 'transparent', color: '#b0b0b8', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#2a2a30'; e.target.style.color = '#b0b0b8'; }}
            >Sign Up</Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737380', padding: 6 }}>
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden"
              style={{ background: 'rgba(6,6,8,0.97)', backdropFilter: 'blur(16px)', borderTop: '1px solid #1a1a1f', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a href="#demos" onClick={() => setMobileMenu(false)} style={{ fontSize: 14, color: '#a0a0a8', textDecoration: 'none', padding: '10px 0' }}>Demos</a>
                <a href="#pricing" onClick={() => setMobileMenu(false)} style={{ fontSize: 14, color: '#a0a0a8', textDecoration: 'none', padding: '10px 0' }}>Pricing</a>
                <div style={{ height: 1, background: '#1a1a1f', margin: '6px 0' }} />
                <Link to="/login" onClick={() => setMobileMenu(false)} style={{ fontSize: 14, color: '#a0a0a8', textDecoration: 'none', padding: '10px 0' }}>Sign In</Link>
                <Link to="/signup" onClick={() => setMobileMenu(false)} style={{ fontSize: 14, color: '#a0a0a8', textDecoration: 'none', padding: '10px 0' }}>Sign Up</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════════════════ HERO ═════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '60px 0 80px', minHeight: '100vh' }}>
        <HeroBackground />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          {/* Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: 420, margin: '0 auto 48px' }}>
            <HeroOrb />
          </motion.div>

          {/* Heading + CTA */}
          <div style={{ textAlign: 'center' }}>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              style={{
                fontFamily: 'var(--font-head)', fontSize: 'clamp(32px, 5vw, 60px)',
                fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: 16,
              }}>
              AI Assistant for{' '}
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Serious Professionals</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', color: '#737380', maxWidth: 460, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Voice scheduling, email summaries and meeting intelligence — built for enterprise.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', marginBottom: 14 }}>
              <Link to="/signup?plan=individual" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8,
                background: '#fff', color: '#060608', fontSize: 13, fontWeight: 600,
                textDecoration: 'none', transition: 'opacity 0.15s',
              }}>Get started <ArrowRight size={14} /></Link>
              <a href="#demos" style={{ fontSize: 13, color: '#555', textDecoration: 'none', fontWeight: 400 }}>See demo</a>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              style={{ fontSize: 12, color: '#4a4a55' }}>
              Free 7-day trial · No credit card required
            </motion.p>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            style={{ textAlign: 'center', marginTop: 48 }}>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ color: '#4a4a55' }}>
              <ChevronDown size={16} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═════════════════════ */}
      <section id="features" style={{ padding: '120px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#3b82f6', textTransform: 'uppercase' }}>FEATURES</span>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '12px 0 16px' }}>
                Everything your team needs
              </h2>
              <p style={{ fontSize: 18, color: '#737380', maxWidth: 550, margin: '0 auto' }}>Powerful AI tools designed to transform how enterprise teams work</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    padding: '36px 30px', borderRadius: 24, height: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid #1a1a1f',
                    boxShadow: `0 0 0 1px ${f.color}11, 0 8px 40px rgba(0,0,0,0.3)`,
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '44'; e.currentTarget.style.boxShadow = `0 0 0 1px ${f.color}33, 0 12px 48px ${f.color}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1f'; e.currentTarget.style.boxShadow = `0 0 0 1px ${f.color}11, 0 8px 40px rgba(0,0,0,0.3)`; }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 18,
                    background: `linear-gradient(135deg, ${f.color}15, ${f.color}08)`,
                    border: `1px solid ${f.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22,
                    boxShadow: `0 0 24px ${f.color}15`,
                  }}>
                    <f.icon size={24} style={{ color: f.color }} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: '#737380', lineHeight: 1.7 }}>{f.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ DEMOS ════════════════════════ */}
      <section id="demos" style={{ padding: '100px 0', background: 'rgba(59,130,246,0.015)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#7c3aed', textTransform: 'uppercase' }}>PRODUCT DEMOS</span>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '12px 0 12px' }}>See ARIA in action</h2>
              <p style={{ fontSize: 18, color: '#737380', maxWidth: 550, margin: '0 auto' }}>Every feature built to save you time and keep your team aligned</p>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 72 }}>
            {DEMOS.map((demo, idx) => (
              <Reveal key={demo.title} delay={0.1}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
                  <div style={{ order: idx % 2 === 0 ? 0 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <div style={{
                        width: 54, height: 54, borderRadius: 18,
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.04))',
                        border: '1px solid rgba(59,130,246,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(59,130,246,0.08)',
                      }}>
                        <demo.icon size={24} style={{ color: '#3b82f6' }} />
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700 }}>{demo.title}</h3>
                    </div>
                    <p style={{ fontSize: 16, color: '#737380', lineHeight: 1.8 }}>{demo.desc}</p>
                  </div>

                  <div style={{ order: idx % 2 === 0 ? 1 : 0 }}>
                    <div style={{
                      padding: 28, borderRadius: 24,
                      background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(59,130,246,0.12)',
                      boxShadow: '0 0 0 1px rgba(59,130,246,0.06), 0 16px 64px rgba(0,0,0,0.4)',
                    }}>
                      {demo.mockup[0]?.side && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {demo.mockup.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: m.side === 'right' ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }} transition={{ delay: i * 0.35, duration: 0.6 }}
                              style={{ display: 'flex', justifyContent: m.side === 'right' ? 'flex-end' : 'flex-start' }}>
                              <div style={{
                                maxWidth: '85%', padding: '16px 20px',
                                borderRadius: m.side === 'right' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                background: m.side === 'right' ? `linear-gradient(135deg, ${demo.color}, ${demo.color}bb)` : 'rgba(15,15,18,0.8)',
                                border: m.side === 'right' ? 'none' : '1px solid #1a1a1f',
                                color: m.side === 'right' ? '#fff' : '#a0a0a8', fontSize: 13, lineHeight: 1.7,
                                boxShadow: m.side === 'right' ? `0 4px 20px ${demo.color}30` : 'none',
                              }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: m.side === 'right' ? 'rgba(255,255,255,0.6)' : '#4a4a55', display: 'block', marginBottom: 4, letterSpacing: '0.05em' }}>{m.label}</span>
                                {m.text}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      {demo.mockup[0]?.from && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {demo.mockup.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }} transition={{ delay: i * 0.25, duration: 0.6 }}
                              style={{ padding: '18px 20px', borderRadius: 16, background: 'rgba(15,15,18,0.6)', border: '1px solid #1a1a1f' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.from}</span>
                                <span style={{ fontSize: 10, color: '#4a4a55' }}>2m ago</span>
                              </div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#a0a0a8', marginBottom: 10 }}>{m.subject}</p>
                              <p style={{ fontSize: 12, color: '#737380', lineHeight: 1.6, padding: '12px 14px', borderRadius: 12, background: 'rgba(124,58,237,0.06)', borderLeft: '3px solid #7c3aed' }}>{m.summary}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      {demo.mockup[0]?.time && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {demo.mockup.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }}
                              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'rgba(15,15,18,0.6)', border: '1px solid #1a1a1f' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#4a4a55', width: 64, flexShrink: 0 }}>{m.time}</span>
                              <div style={{ width: 3, height: 30, borderRadius: 2, background: m.tagColor }} />
                              <span style={{ fontSize: 14, color: '#fff', fontWeight: 500, flex: 1 }}>{m.title}</span>
                              <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 8, background: `${m.tagColor}15`, color: m.tagColor, fontWeight: 700 }}>{m.tag}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      {demo.mockup[0]?.step && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {demo.mockup.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }} transition={{ delay: i * 0.25, duration: 0.5 }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 16,
                                background: m.active ? 'rgba(239,68,68,0.06)' : 'rgba(15,15,18,0.6)',
                                border: `1px solid ${m.active ? 'rgba(239,68,68,0.25)' : '#1a1a1f'}`,
                              }}>
                              <div style={{
                                width: 40, height: 40, borderRadius: 14,
                                background: m.active ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(15,15,18,0.8)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: m.active ? '#fff' : '#4a4a55', fontSize: 15, fontWeight: 700,
                                boxShadow: m.active ? '0 4px 20px rgba(239,68,68,0.4)' : 'none',
                              }}>{m.step}</div>
                              <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: m.active ? '#fff' : '#a0a0a8' }}>{m.label}</p>
                                <p style={{ fontSize: 12, color: '#4a4a55' }}>{m.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ LOGO SHOWCASE ════════════════ */}
      <section style={{ padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.06), transparent 70%)',
        }} />
        <Reveal>
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 40px rgba(59,130,246,0.3), 0 0 80px rgba(124,58,237,0.15)',
                  '0 0 60px rgba(59,130,246,0.5), 0 0 120px rgba(124,58,237,0.25)',
                  '0 0 40px rgba(59,130,246,0.3), 0 0 80px rgba(124,58,237,0.15)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-block', borderRadius: 40, marginBottom: 36, overflow: 'hidden', border: '2px solid rgba(59,130,246,0.2)' }}>
              <motion.img
                src="/logo.png" alt="ARIA Life"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 220, height: 220, display: 'block' }}
              />
            </motion.div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 36, fontWeight: 700, marginBottom: 16 }}>
              Built for the{' '}
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Future</span>
            </h3>
            <p style={{ fontSize: 17, color: '#737380', lineHeight: 1.8, marginBottom: 32 }}>
              ARIA Life combines cutting-edge AI with beautiful design to create the ultimate business productivity platform.
            </p>
            <Link to="/signup" style={{ fontSize: 14, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Get started →</Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════ PRICING ══════════════════════ */}
      <section id="pricing" style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#3b82f6', textTransform: 'uppercase' }}>PRICING</span>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '12px 0 12px' }}>Invest in your productivity</h2>
              <p style={{ fontSize: 18, color: '#737380', marginBottom: 28 }}>7-day free trial on all plans · No credit card required</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderRadius: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1f',
                backdropFilter: 'blur(12px)',
              }}>
                <span style={{ fontSize: 14, fontWeight: !usd ? 700 : 400, color: !usd ? '#fff' : '#4a4a55' }}>USD</span>
                <button onClick={() => setUsd(!usd)} style={{
                  width: 48, height: 26, borderRadius: 13, background: usd ? '#3b82f6' : '#1a1a1f',
                  position: 'relative', border: '1px solid #1a1a1f', cursor: 'pointer', transition: 'background 0.3s',
                }}>
                  <motion.span layout style={{ position: 'absolute', top: 3, left: usd ? 24 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
                </button>
                <span style={{ fontSize: 14, fontWeight: usd ? 700 : 400, color: usd ? '#fff' : '#4a4a55' }}>KSH</span>
              </div>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 64 }}>
            {PLANS.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    padding: '30px 24px', borderRadius: 24, height: '100%', display: 'flex', flexDirection: 'column',
                    position: 'relative',
                    background: plan.popular ? `linear-gradient(180deg, ${plan.color}08, rgba(255,255,255,0.02))` : 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: plan.popular ? `1px solid ${plan.color}40` : '1px solid #1a1a1f',
                    boxShadow: plan.popular ? `0 0 0 1px ${plan.color}22, 0 12px 48px ${plan.color}15` : '0 8px 32px rgba(0,0,0,0.3)',
                  }}>
                  {plan.popular && (
                    <div style={{
                      position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: '#fff',
                      fontSize: 10, fontWeight: 700, padding: '6px 18px', borderRadius: 100, letterSpacing: '0.08em',
                      boxShadow: `0 4px 16px ${plan.color}40`,
                    }}>MOST POPULAR</div>
                  )}
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${plan.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: `0 0 16px ${plan.color}15` }}>
                    <plan.icon size={20} style={{ color: plan.color }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#4a4a55', textTransform: 'uppercase', marginBottom: 4 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 2 }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>{fmtPrice(plan.price)}</span>
                    <span style={{ fontSize: 12, color: '#4a4a55' }}>/mo{plan.priceNote || ''}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#4a4a55', marginBottom: 16 }}>{plan.desc}</p>
                  <div style={{ padding: '12px 14px', borderRadius: 14, background: `${plan.color}08`, border: `1px solid ${plan.color}18`, marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: plan.color }}>{plan.highlight}</p>
                  </div>
                  <ul style={{ listStyle: 'none', marginBottom: 26, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#a0a0a8' }}>
                        <Check size={13} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to={`/signup?plan=${plan.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '14px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${plan.popular ? plan.color : 'rgba(255,255,255,0.1)'}`,
                    color: plan.popular ? '#fff' : '#a0a0a8',
                    boxShadow: plan.popular ? `0 4px 24px ${plan.color}40` : 'none',
                    transition: 'all 0.2s',
                  }}>Start Free Trial</Link>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Comparison table */}
          <Reveal>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 28 }}>Compare plans</h3>
            <div style={{
              overflow: 'auto', borderRadius: 24, padding: 0,
              background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
              border: '1px solid #1a1a1f', boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}>
              <div style={{ minWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', borderBottom: '1px solid #1a1a1f' }}>
                  <div style={{ padding: '16px 20px' }} />
                  {PLANS.map(p => (
                    <div key={p.id} style={{ padding: '14px 8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.03)' }}>
                      <p style={{ fontWeight: 700, fontSize: 12, color: p.color }}>{p.name}</p>
                    </div>
                  ))}
                </div>
                {TABLE.map((row, i) => (
                  <div key={row.feature} style={{
                    display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)',
                    borderBottom: i < TABLE.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    background: i % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  }}>
                    <div style={{ padding: '12px 20px', fontSize: 13, color: '#a0a0a8' }}>{row.feature}</div>
                    {['individual', 'corporate_mini', 'corporate', 'major_corporate', 'enterprise'].map(k => (
                      <div key={k} style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Cell v={row[k]} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ════════════════════ */}
      <section style={{ padding: '100px 24px' }}>
        <Reveal>
          <div style={{
            maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '72px 48px', borderRadius: 32,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(124,58,237,0.08))',
            border: '1px solid rgba(59,130,246,0.15)',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 0 120px rgba(59,130,246,0.08)',
          }}>
            <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: -60, right: -60, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)', filter: 'blur(50px)' }} />
            <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)', filter: 'blur(50px)' }} />

            <div style={{ position: 'relative' }}>
              <motion.div
                animate={{ boxShadow: ['0 0 30px rgba(59,130,246,0.3)', '0 0 50px rgba(124,58,237,0.4)', '0 0 30px rgba(59,130,246,0.3)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block', borderRadius: 20, overflow: 'hidden', marginBottom: 28, border: '1px solid rgba(59,130,246,0.2)' }}>
                <img src="/logo.png" alt="ARIA Life" style={{ width: 72, height: 72, display: 'block' }} />
              </motion.div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 16 }}>
                Ready to transform your workflow?
              </h2>
              <p style={{ fontSize: 18, color: '#737380', marginBottom: 12 }}>Join enterprise teams using ARIA to stay ahead.</p>
              <p style={{ fontSize: 14, color: '#3b82f6', marginBottom: 40, fontWeight: 700 }}>7-day free trial · No credit card · Cancel anytime</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
                <Link to="/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 16,
                  background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', fontSize: 17, fontWeight: 700,
                  textDecoration: 'none', boxShadow: '0 6px 30px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}>Start Free Trial <ArrowRight size={20} /></Link>
                <a href="#demos" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1f',
                  color: '#a0a0a8', fontSize: 17, fontWeight: 600, textDecoration: 'none', backdropFilter: 'blur(12px)',
                }}><Play size={18} /> See Demo</a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════════ */}
      <footer style={{ borderTop: '1px solid #1a1a1f', padding: '44px 24px', background: 'rgba(6,6,8,0.5)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.png" alt="ARIA" style={{ width: 36, height: 36, borderRadius: 10 }} />
            <div>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18 }}>ARIA</span>
              <span style={{ fontSize: 10, color: '#7c3aed', marginLeft: 6, letterSpacing: '0.15em', fontWeight: 700 }}>LIFE</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#4a4a55' }}>© {new Date().getFullYear()} ARIA Life. Built for teams worldwide.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px' }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies']].map(([label, to]) => (
              <Link key={to} to={to} style={{ fontSize: 13, color: '#4a4a55', textDecoration: 'none' }}>{label}</Link>
            ))}
            <a href="mailto:support@arialife.app" style={{ fontSize: 13, color: '#4a4a55', textDecoration: 'none' }}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
