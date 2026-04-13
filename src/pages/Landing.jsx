import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Check, Star, Mic, MessageCircle, Calendar, Mail, Globe, Zap, Shield, Crown, X, Building2, Building } from 'lucide-react';

const KSH_TO_USD = 130;

const PLANS = [
  {
    id: 'individual', name: 'Individual', price: 5000, icon: Star,
    color: '#4F6EF7', desc: '1–3 people',
    features: ['Built-in calendar (manual scheduling)', 'AI assistant', 'Browser & email notifications', 'Multi-language: English, Somali, Arabic', '7-day free trial'],
    notIncluded: ['WhatsApp reminders', 'Email summaries', 'Meeting recorder'],
  },
  {
    id: 'corporate_mini', name: 'Corporate Mini', price: 15000, priceNote: '/person', icon: Zap, popular: true,
    color: '#8B5CF6', desc: '5–10 people',
    features: ['Everything in Individual', 'WhatsApp reminders (WasenderAPI)', 'Email summaries', 'Google Calendar sync', 'Team admin dashboard', 'Member invites by email', '7-day free trial'],
    notIncluded: ['Voice (Rachel AI)', 'Meeting recorder'],
  },
  {
    id: 'corporate', name: 'Corporate', price: 30000, icon: Building,
    color: '#22c55e', desc: '10–50 people',
    features: ['Everything in Corporate Mini', 'Voice (Rachel AI)', 'Meeting recorder + transcription', 'Priority support', '7-day free trial'],
    notIncluded: ['Advanced analytics', 'Automated workflows'],
  },
  {
    id: 'major_corporate', name: 'Major Corporate', price: 100000, icon: Crown,
    color: '#f59e0b', desc: 'Up to 500 people',
    features: ['Everything in Corporate', 'Advanced analytics dashboard', 'Automated weekly meeting reports', 'Multi-department management', 'Staff training videos', '7-day free trial'],
    notIncluded: ['Executive dashboard', 'Automated workflows'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 250000, icon: Building2,
    color: '#ef4444', desc: '500+ people',
    features: ['Everything in Major Corporate', 'Executive dashboard', 'Monthly AI-generated strategy reports', 'Automated workflows', 'Direct WhatsApp support line', '7-day free trial'],
    notIncluded: [],
  },
];

const FEATURES = [
  { icon: Mic,            title: 'Voice Briefings', desc: 'Every morning, ARIA greets you by name and reads your full schedule aloud.' },
  { icon: MessageCircle,  title: 'WhatsApp Reminders',    desc: 'Reminders delivered to your WhatsApp via WasenderAPI. Available on Corporate Mini and above.' },
  { icon: Calendar,       title: 'Google Calendar Sync',  desc: 'Connect once. All your meetings appear automatically, no manual entry needed.' },
  { icon: Mail,           title: 'Gmail Intelligence',    desc: 'ARIA scans your inbox and surfaces urgent emails in your morning briefing.' },
  { icon: Globe,          title: 'English, Somali & Arabic', desc: 'Switch languages instantly. ARIA speaks and responds in all three.' },
  { icon: Shield,         title: 'Secure & Private',      desc: 'Your data never leaves your account. Enterprise-grade encryption throughout.' },
];

const TESTIMONIALS = [
  { name: 'Amina Wanjiku', role: 'CEO, Nairobi Ventures', stars: 5, text: 'The morning voice briefing has completely changed how I start my day. I walk into every meeting prepared.' },
  { name: 'David Ochieng', role: 'MD, Mombasa Capital', stars: 5, text: "WhatsApp delivery is genius. I was never going to open another reminder app — ARIA came to me." },
  { name: 'Grace Kamau',   role: 'Founder, Kisumu Tech Hub', stars: 5, text: "Swahili support made this feel like it was built for us, not adapted for us. Genuinely world-class." },
];

const TABLE = [
  { feature: 'People',                   individual: '1–3',  corporate_mini: '5–10',  corporate: '10–50', major_corporate: 'Up to 500', enterprise: '500+' },
  { feature: 'AI assistant',             individual: true,    corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'WhatsApp reminders',        individual: false,   corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Multi-language',           individual: true,    corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Email summaries',          individual: false,   corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Google Calendar sync',     individual: false,   corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Team admin dashboard',     individual: false,   corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Voice (Rachel AI)',        individual: false,   corporate_mini: false,   corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Meeting recorder',         individual: false,   corporate_mini: false,   corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Priority support',         individual: false,   corporate_mini: false,   corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Advanced analytics',       individual: false,   corporate_mini: false,   corporate: false,   major_corporate: true,        enterprise: true },
  { feature: 'Weekly meeting reports',   individual: false,   corporate_mini: false,   corporate: false,   major_corporate: true,        enterprise: true },
  { feature: 'Multi-department mgmt',    individual: false,   corporate_mini: false,   corporate: false,   major_corporate: true,        enterprise: true },
  { feature: 'Executive dashboard',      individual: false,   corporate_mini: false,   corporate: false,   major_corporate: false,       enterprise: true },
  { feature: 'Strategy reports',         individual: false,   corporate_mini: false,   corporate: false,   major_corporate: false,       enterprise: true },
  { feature: 'Automated workflows',      individual: false,   corporate_mini: false,   corporate: false,   major_corporate: false,       enterprise: true },
  { feature: 'WhatsApp support line',    individual: false,   corporate_mini: false,   corporate: false,   major_corporate: false,       enterprise: true },
];

function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Cell({ v }) {
  if (v === true)  return <div className="mx-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}><Check size={11} style={{ color: '#22c55e' }} /></div>;
  if (v === false) return <X size={13} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />;
  return <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{v}</span>;
}

export default function Landing() {
  const [usd, setUsd] = useState(false);

  const fmtPrice = (p) => {
    if (usd) return `$${Math.round(p / KSH_TO_USD).toLocaleString()}`;
    return `KSH ${p.toLocaleString()}`;
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>

      {/* ── Trial Banner ─────────────────────────────────────── */}
      <div className="text-center py-3 px-4 text-sm font-medium" style={{ background: 'linear-gradient(90deg,#4F6EF7,#8B5CF6)', color: '#fff' }}>
        🎉 Start Free — 7 Day Trial · No Credit Card Required ·
        <Link to="/signup" className="underline font-bold ml-2 hover:no-underline">Get started →</Link>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="section relative overflow-hidden" style={{ paddingTop: 140, paddingBottom: 120 }}>
        {/* Background glow */}
        <div style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', width: 800, height: 500, background:'radial-gradient(ellipse at center, rgba(79,110,247,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div className="container text-center" style={{ position: 'relative' }}>
          <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="inline-flex items-center gap-2 mb-8 rounded-full px-4 py-2"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)', fontSize:14, color:'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#22c55e' }} />
            Used by 500+ Kenyan business professionals
          </motion.div>

          <motion.h1
            initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.1 }}
            style={{ fontFamily:'var(--font-head)', fontSize:'clamp(40px,6vw,80px)', fontWeight:800, lineHeight:1.05, letterSpacing:'-0.03em', marginBottom:28 }}
          >
            Never Miss<br /><span className="grad">What Matters</span>
          </motion.h1>

          <motion.p
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.2 }}
            style={{ fontSize:'clamp(18px,2vw,22px)', color:'var(--text-secondary)', maxWidth:560, margin:'0 auto 40px', lineHeight:1.6 }}
          >
            Your AI assistant that reads your schedule aloud, sends WhatsApp reminders, and keeps Kenyan professionals ahead of every deadline.
          </motion.p>

          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/login"  className="btn btn-ghost btn-lg">Sign In</Link>
            <Link to="/signup" className="btn btn-ghost btn-lg">Sign Up</Link>
            <Link to="/signup?plan=individual" className="btn btn-primary btn-lg">
              Start Free Trial <ArrowRight size={20} />
            </Link>
          </motion.div>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
            style={{ marginTop:16, fontSize:14, color:'var(--text-muted)' }}>
            No credit card required · Cancel anytime · Plans from KSH 5,000/month
          </motion.p>

          {/* App Mockup */}
          <motion.div
            initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.9, delay:0.4 }}
            style={{ marginTop:72, maxWidth:360, margin:'72px auto 0' }}
          >
            <div className="card" style={{ padding:0, overflow:'hidden', background:'var(--bg-card)' }}>
              {/* Status bar */}
              <div style={{ background:'var(--bg-card2)', padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#4F6EF7,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Mic size={14} color="#fff" />
                  </div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--font-head)', color:'#fff' }}>Good morning, Amina</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>Reading briefing with Rachel...</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:20 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="eq-bar" style={{ animationDelay:`${i*0.15}s`, background:'#4F6EF7' }} />
                  ))}
                </div>
              </div>
              {/* Reminder items */}
              {[
                { title:'Board Meeting', sub:'Serena Hotel · 10:00 AM', dot:'#ef4444', tag:'WhatsApp' },
                { title:'Submit Q4 Report', sub:'Finance · 2:00 PM', dot:'#ef4444', tag:'Voice' },
                { title:'Team Standup', sub:'Google Meet · 4:30 PM', dot:'#f59e0b', tag:'Notification' },
              ].map((item,i) => (
                <div key={i} style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:item.dot, flexShrink:0 }} />
                  <div style={{ flex:1, textAlign:'left' }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{item.title}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{item.sub}</div>
                  </div>
                  <span className="badge badge-blue" style={{ fontSize:10 }}>{item.tag}</span>
                </div>
              ))}
            </div>
            {/* glow */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(79,110,247,0.15) 0%, transparent 70%)', borderRadius:20, zIndex:-1, filter:'blur(20px)' }} />
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="section-sm">
        <div className="container">
          <FadeUp className="text-center mb-16">
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--blue)', marginBottom:12 }}>FEATURES</p>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(32px,4vw,52px)', fontWeight:800, letterSpacing:'-0.02em' }}>Everything you need</h2>
            <p style={{ fontSize:18, color:'var(--text-secondary)', marginTop:12 }}>Built for Kenyan professionals who mean business</p>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i*0.08}>
                <div className="card card-glow" style={{ padding:'28px 24px', height:'100%' }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:'var(--blue-dim)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <f.icon size={22} style={{ color:'var(--blue)' }} />
                  </div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, marginBottom:8 }}>{f.title}</h3>
                  <p style={{ fontSize:15, color:'var(--text-secondary)', lineHeight:1.65 }}>{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="section-sm">
        <div className="container">
          <FadeUp className="text-center mb-12">
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(28px,3vw,44px)', fontWeight:800, letterSpacing:'-0.02em' }}>What they say</h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={t.name} delay={i*0.1}>
                <div className="card" style={{ padding:'28px 24px' }}>
                  <div style={{ display:'flex', marginBottom:14 }}>
                    {Array(t.stars).fill(0).map((_,j) => <Star key={j} size={15} fill="#f59e0b" color="#f59e0b" />)}
                  </div>
                  <p style={{ fontSize:15, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:20 }}>"{t.text}"</p>
                  <div>
                    <p style={{ fontWeight:700, fontSize:15 }}>{t.name}</p>
                    <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{t.role}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="section">
        <div className="container">
          <FadeUp className="text-center mb-12">
            <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--blue)', marginBottom:12 }}>PRICING</p>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(32px,4vw,52px)', fontWeight:800, letterSpacing:'-0.02em', marginBottom:12 }}>Simple, honest pricing</h2>
            <p style={{ fontSize:18, color:'var(--text-secondary)', marginBottom:28 }}>7-day free trial on all plans · No credit card required</p>
            {/* KSH / USD toggle */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
              <span style={{ fontSize:14, fontWeight: !usd?700:400, color: !usd?'#fff':'var(--text-muted)' }}>KSH</span>
              <button onClick={() => setUsd(!usd)}
                style={{ width:44, height:24, borderRadius:12, background: usd?'var(--blue)':'var(--bg-card2)', position:'relative', border:'1px solid var(--border)', cursor:'pointer', transition:'background 0.2s' }}>
                <span style={{ position:'absolute', top:2, left: usd?22:2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
              </button>
              <span style={{ fontSize:14, fontWeight: usd?700:400, color: usd?'#fff':'var(--text-muted)' }}>USD</span>
            </div>
          </FadeUp>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:20, marginBottom:48 }}>
            {PLANS.map((plan, i) => (
              <FadeUp key={plan.id} delay={i*0.08}>
                <div
                  className="card"
                  style={{
                    padding:'28px 24px',
                    position:'relative',
                    border: plan.popular ? `1px solid ${plan.color}44` : '1px solid var(--border)',
                    background: plan.popular ? `${plan.color}08` : 'var(--bg-card)',
                    height:'100%',
                  }}
                >
                  {plan.popular && (
                    <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:plan.color, color:'#fff', fontSize:11, fontWeight:700, padding:'5px 16px', borderRadius:100, letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div style={{ width:40, height:40, borderRadius:12, background:`${plan.color}18`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <plan.icon size={18} style={{ color:plan.color }} />
                  </div>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase' }}>{plan.name}</p>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
                    <span style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:800, letterSpacing:'-0.03em' }}>{fmtPrice(plan.price)}</span>
                    <span style={{ fontSize:13, color:'var(--text-muted)' }}>/mo{plan.priceNote || ''}</span>
                  </div>
                  <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>{plan.desc}</p>

                  <ul style={{ listStyle:'none', marginBottom:28, display:'flex', flexDirection:'column', gap:10 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'var(--text-secondary)' }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(34,197,94,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Check size={10} color="#22c55e" />
                        </div>
                        {f}
                      </li>
                    ))}
                    {plan.notIncluded.map(f => (
                      <li key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'var(--text-muted)', opacity:0.5 }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <X size={9} color="var(--text-muted)" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/signup?plan=${plan.id}`}
                    className="btn w-full"
                    style={{
                      background: plan.popular ? plan.color : 'transparent',
                      border: `1px solid ${plan.popular ? plan.color : 'var(--border)'}`,
                      color: plan.popular ? '#fff' : 'var(--text-secondary)',
                      boxShadow: plan.popular ? `0 4px 24px ${plan.color}44` : 'none',
                    }}
                  >
                    Start Free Trial
                  </Link>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Comparison table */}
          <FadeUp>
            <h3 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, textAlign:'center', marginBottom:32 }}>Full comparison</h3>
            <div className="card" style={{ overflow:'auto', padding:0 }}>
              <div style={{ minWidth:700 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1.5fr repeat(5, 1fr)', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ padding:'16px 20px' }} />
                  {PLANS.map(p => (
                    <div key={p.id} style={{ padding:'14px 8px', textAlign:'center', borderLeft:'1px solid var(--border)' }}>
                      <p style={{ fontWeight:700, fontSize:12, color: p.color }}>{p.name}</p>
                      <p style={{ fontSize:11, color:'var(--text-muted)' }}>{fmtPrice(p.price)}/mo</p>
                    </div>
                  ))}
                </div>
                {TABLE.map((row, i) => (
                  <div key={row.feature} style={{ display:'grid', gridTemplateColumns:'1.5fr repeat(5, 1fr)', borderBottom: i<TABLE.length-1 ? '1px solid var(--border)' : 'none', background: i%2===1 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <div style={{ padding:'11px 20px', fontSize:13, color:'var(--text-secondary)' }}>{row.feature}</div>
                    {['individual','corporate_mini','corporate','major_corporate','enterprise'].map(k => (
                      <div key={k} style={{ padding:'11px 8px', textAlign:'center', borderLeft:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Cell v={row[k]} />
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ display:'grid', gridTemplateColumns:'1.5fr repeat(5, 1fr)', background:'var(--bg-card2)', padding:'14px 0' }}>
                  <div />
                  {PLANS.map(p => (
                    <div key={p.id} style={{ padding:'0 8px', borderLeft:'1px solid var(--border)' }}>
                      <Link to={`/signup?plan=${p.id}`} className="btn btn-sm w-full" style={{ background: p.popular?p.color:'transparent', border:`1px solid ${p.popular?p.color:'var(--border)'}`, color: p.popular?'#fff':'var(--text-muted)', fontSize:11 }}>
                        Get {p.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="section-sm">
        <FadeUp>
          <div className="container-sm text-center card" style={{ padding:'64px 40px', background:'linear-gradient(135deg, rgba(79,110,247,0.08) 0%, rgba(139,92,246,0.08) 100%)', border:'1px solid rgba(79,110,247,0.2)' }}>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-0.02em', marginBottom:16 }}>Ready to take control?</h2>
            <p style={{ fontSize:18, color:'var(--text-secondary)', marginBottom:8 }}>Join 500+ Kenyan business professionals using ARIA every day.</p>
            <p style={{ fontSize:14, color:'var(--blue)', marginBottom:36, fontWeight:600 }}>7-day free trial · No credit card · Cancel anytime</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start Your Free Trial <ArrowRight size={20} />
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop:'1px solid var(--border)', padding:'32px 24px' }}>
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#4F6EF7,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Mic size={13} color="#fff" />
            </div>
            <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:18 }}>ARIA</span>
          </div>
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>© 2024 ARIA. Built for Kenya.</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 20px' }}>
            <Link to="/privacy" style={{ fontSize:14, color:'var(--text-muted)' }} className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms"   style={{ fontSize:14, color:'var(--text-muted)' }} className="hover:text-white transition-colors">Terms</Link>
            <Link to="/cookies" style={{ fontSize:14, color:'var(--text-muted)' }} className="hover:text-white transition-colors">Cookies</Link>
            <a href="mailto:support@ariaassistant.co.ke" style={{ fontSize:14, color:'var(--text-muted)' }} className="hover:text-white transition-colors">Support</a>
            <a href="/admin" style={{ fontSize:14, color:'var(--text-muted)' }} className="hover:text-white transition-colors">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
