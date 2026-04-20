import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Star, Mic, MessageCircle, Calendar, Mail, Globe, Zap, Shield, Crown, X, Building2, Building, Play, Lightbulb, BarChart3, Video } from 'lucide-react';

const KSH_TO_USD = 130;

const PLANS = [
  {
    id: 'individual', name: 'Individual', price: 5000, icon: Star,
    color: '#4F6EF7', desc: '1–3 people',
    highlight: 'AI calendar + voice assistant',
    features: ['Built-in calendar (manual scheduling)', 'AI assistant', 'Browser & email notifications', 'Multi-language: English, Somali, Arabic', '7-day free trial'],
    notIncluded: ['WhatsApp reminders', 'Email summaries', 'Meeting recorder'],
  },
  {
    id: 'corporate_mini', name: 'Corporate Mini', price: 15000, priceNote: '/person', icon: Zap, popular: true,
    color: '#8B5CF6', desc: '5–10 people',
    highlight: 'Gmail summaries + team management',
    features: ['Everything in Individual', 'WhatsApp reminders (WasenderAPI)', 'Email summaries', 'Google Calendar sync', 'Team admin dashboard', 'Member invites by email', '7-day free trial'],
    notIncluded: ['Voice (Rachel AI)', 'Meeting recorder'],
  },
  {
    id: 'corporate', name: 'Corporate', price: 30000, icon: Building,
    color: '#22c55e', desc: '10–50 people',
    highlight: 'Rachel AI voice + meeting transcription',
    features: ['Everything in Corporate Mini', 'Voice (Rachel AI)', 'Meeting recorder + transcription', 'Priority support', '7-day free trial'],
    notIncluded: ['Advanced analytics', 'Automated workflows'],
  },
  {
    id: 'major_corporate', name: 'Major Corporate', price: 100000, icon: Crown,
    color: '#f59e0b', desc: 'Up to 500 people',
    highlight: 'Analytics + department management',
    features: ['Everything in Corporate', 'Advanced analytics dashboard', 'Automated weekly meeting reports', 'Multi-department management', 'Staff training videos', '7-day free trial'],
    notIncluded: ['Executive dashboard', 'Automated workflows'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 250000, icon: Building2,
    color: '#ef4444', desc: '500+ people',
    highlight: 'Full platform + executive tools',
    features: ['Everything in Major Corporate', 'Executive dashboard', 'Monthly AI-generated strategy reports', 'Automated workflows', 'Direct WhatsApp support line', '7-day free trial'],
    notIncluded: [],
  },
];

const DEMOS = [
  {
    icon: Mic, color: '#4F6EF7', title: 'Voice Planning',
    desc: 'Speak naturally to create meetings, tasks, and reminders. ARIA understands context and adds them to your calendar instantly.',
    mockup: [
      { label: 'You', text: '"Schedule a board meeting tomorrow at 10am"', side: 'right' },
      { label: 'ARIA', text: 'Created: Board Meeting — Tomorrow, 10:00 AM. Added to your calendar.', side: 'left' },
    ],
  },
  {
    icon: Mail, color: '#8B5CF6', title: 'Email Summaries',
    desc: 'ARIA reads your Gmail inbox and creates AI-powered summaries — who sent it, what they need, and what action to take.',
    mockup: [
      { from: 'Safaricom Finance', subject: 'Q4 Invoice Due', summary: 'Safaricom Finance sent the Q4 invoice for KSH 450,000. Payment due by Friday. Action: Approve and forward to accounts.' },
      { from: 'David Chen', subject: 'Partnership Proposal', summary: 'David from Pacific Capital proposes a joint venture for regional expansion. Action: Review terms and schedule a call.' },
    ],
  },
  {
    icon: Calendar, color: '#22c55e', title: 'Smart Calendar',
    desc: 'Built-in calendar with manual scheduling plus Google Calendar sync. All your events in one unified view.',
    mockup: [
      { time: '9:00 AM', title: 'Team Standup', tag: 'Manual', tagColor: '#22c55e' },
      { time: '10:30 AM', title: 'Client Presentation', tag: 'Google', tagColor: '#4285F4' },
      { time: '2:00 PM', title: 'Budget Review', tag: 'Manual', tagColor: '#22c55e' },
      { time: '4:00 PM', title: 'Strategy Call', tag: 'Google', tagColor: '#4285F4' },
    ],
  },
  {
    icon: Lightbulb, color: '#f59e0b', title: 'AI Strategy Advisor',
    desc: 'Get business plans, marketing strategies, financial projections, and competitor analysis — powered by Claude AI.',
    mockup: [
      { label: 'You', text: '"Create a marketing strategy for a SaaS product targeting SMEs"', side: 'right' },
      { label: 'ARIA', text: '## Marketing Strategy\n**Target:** SMEs in growth markets\n**Channels:** WhatsApp Business, LinkedIn, industry events\n**Budget:** KSH 200K/month for 6 months...', side: 'left' },
    ],
  },
  {
    icon: Video, color: '#ef4444', title: 'Meeting Recorder',
    desc: 'Record any meeting, get an automatic transcription via AssemblyAI, then a Claude-powered summary with action items.',
    mockup: [
      { step: '1', label: 'Record', desc: 'Tap to record your meeting', active: false },
      { step: '2', label: 'Transcribe', desc: 'AssemblyAI converts speech to text', active: false },
      { step: '3', label: 'Summarize', desc: 'Claude extracts key decisions & action items', active: true },
    ],
  },
];

const TABLE = [
  { feature: 'People',                   individual: '1–3',  corporate_mini: '5–10',  corporate: '10–50', major_corporate: 'Up to 500', enterprise: '500+' },
  { feature: 'AI assistant',             individual: true,    corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'WhatsApp reminders',        individual: false,   corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Email summaries',          individual: false,   corporate_mini: true,    corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Voice (Rachel AI)',        individual: false,   corporate_mini: false,   corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Meeting recorder',         individual: false,   corporate_mini: false,   corporate: true,    major_corporate: true,        enterprise: true },
  { feature: 'Advanced analytics',       individual: false,   corporate_mini: false,   corporate: false,   major_corporate: true,        enterprise: true },
  { feature: 'Executive dashboard',      individual: false,   corporate_mini: false,   corporate: false,   major_corporate: false,       enterprise: true },
  { feature: 'Automated workflows',      individual: false,   corporate_mini: false,   corporate: false,   major_corporate: false,       enterprise: true },
];

function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function Cell({ v }) {
  if (v === true)  return <div className="mx-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}><Check size={11} style={{ color: '#22c55e' }} /></div>;
  if (v === false) return <X size={13} style={{ color: 'var(--text-muted)', margin: '0 auto', opacity: 0.3 }} />;
  return <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{v}</span>;
}

export default function Landing() {
  const [usd, setUsd] = useState(false);
  const fmtPrice = (p) => usd ? `$${Math.round(p / KSH_TO_USD).toLocaleString()}` : `KSH ${p.toLocaleString()}`;

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>

      {/* ── Top Banner ──────────────────────────────────────── */}
      <div className="text-center py-3 px-4 text-sm font-medium" style={{ background: 'linear-gradient(90deg,#4F6EF7,#8B5CF6)', color: '#fff' }}>
        Start Free — 7 Day Trial · No Credit Card Required ·
        <Link to="/signup" className="underline font-bold ml-2 hover:no-underline">Get started →</Link>
      </div>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{ paddingTop: 120, paddingBottom: 100, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse, rgba(79,110,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-ring 2s infinite' }} />
              Trusted by professionals and enterprise teams worldwide
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
              Your AI-Powered<br /><span className="grad">Business Assistant</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.7, marginBottom: 40 }}>
              Voice scheduling, AI email summaries, meeting transcription, and strategy planning — all in one platform built for enterprise teams everywhere.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <Link to="/signup?plan=individual" className="btn btn-primary btn-lg" style={{ gap: 8, fontSize: 16, padding: '0 32px' }}>
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <a href="#demos" className="btn btn-ghost btn-lg" style={{ gap: 8, fontSize: 16 }}>
                <Play size={16} /> See Demo
              </a>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              No credit card · Cancel anytime · Plans from {fmtPrice(5000)}/month
            </motion.p>
          </div>

          {/* Hero App Preview */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
            style={{ marginTop: 64, maxWidth: 440, margin: '64px auto 0' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(79,110,247,0.2)', boxShadow: '0 24px 80px rgba(79,110,247,0.15), 0 0 0 1px rgba(255,255,255,0.03) inset' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(79,110,247,0.08), rgba(139,92,246,0.08))', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#4F6EF7,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={16} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Good morning, Amina</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You have 4 items today</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 22 }}>
                  {[1,2,3,4].map(i => <div key={i} className="eq-bar" style={{ animationDelay: `${i*0.15}s`, background: '#4F6EF7' }} />)}
                </div>
              </div>
              {[
                { title: 'Board Meeting', sub: 'Serena Hotel · 10:00 AM', dot: '#ef4444', tag: 'WhatsApp' },
                { title: 'Submit Q4 Report', sub: 'Finance · 2:00 PM', dot: '#f59e0b', tag: 'Voice' },
                { title: 'Strategy Review', sub: 'Zoom · 4:30 PM', dot: '#4F6EF7', tag: 'Calendar' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.sub}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(79,110,247,0.1)', color: 'var(--blue)', fontWeight: 600 }}>{item.tag}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Product Demos ───────────────────────────────────── */}
      <section id="demos" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <FadeUp className="text-center" style={{ marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 12 }}>PRODUCT DEMOS</p>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>See ARIA in action</h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto' }}>Every feature built to save you time and keep your team aligned</p>
          </FadeUp>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {DEMOS.map((demo, idx) => (
              <FadeUp key={demo.title} delay={idx * 0.05}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'center' }}>
                  {/* Text side */}
                  <div style={{ order: idx % 2 === 0 ? 0 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${demo.color}15`, border: `1px solid ${demo.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <demo.icon size={20} style={{ color: demo.color }} />
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700 }}>{demo.title}</h3>
                    </div>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>{demo.desc}</p>
                    <Link to="/signup" className="btn btn-sm" style={{ background: demo.color, color: '#fff', border: 'none', gap: 6 }}>
                      Try it free <ArrowRight size={14} />
                    </Link>
                  </div>

                  {/* Mock demo side */}
                  <div style={{ order: idx % 2 === 0 ? 1 : 0 }}>
                    <div className="card" style={{ padding: '20px', border: `1px solid ${demo.color}20`, background: `${demo.color}04` }}>
                      {/* Voice / Strategy chat mockup */}
                      {demo.mockup[0]?.side && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {demo.mockup.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: m.side === 'right' ? 20 : -20 }} whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }} transition={{ delay: i * 0.3 }}
                              style={{ display: 'flex', justifyContent: m.side === 'right' ? 'flex-end' : 'flex-start' }}>
                              <div style={{
                                maxWidth: '85%', padding: '12px 16px', borderRadius: m.side === 'right' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                background: m.side === 'right' ? demo.color : 'var(--bg-card2)', color: m.side === 'right' ? '#fff' : 'var(--text-secondary)',
                                fontSize: 13, lineHeight: 1.6,
                              }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: m.side === 'right' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{m.label}</span>
                                {m.text}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      {/* Email mockup */}
                      {demo.mockup[0]?.from && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {demo.mockup.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                              style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{m.from}</span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>2m ago</span>
                              </div>
                              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{m.subject}</p>
                              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', borderLeft: '3px solid #8B5CF6' }}>{m.summary}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      {/* Calendar mockup */}
                      {demo.mockup[0]?.time && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {demo.mockup.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>{m.time}</span>
                              <div style={{ width: 3, height: 24, borderRadius: 2, background: m.tagColor, flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: '#fff', fontWeight: 500, flex: 1 }}>{m.title}</span>
                              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${m.tagColor}15`, color: m.tagColor, fontWeight: 600 }}>{m.tag}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      {/* Meeting recorder mockup */}
                      {demo.mockup[0]?.step && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {demo.mockup.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: m.active ? 'rgba(239,68,68,0.06)' : 'var(--bg-card2)', border: `1px solid ${m.active ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` }}>
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: m.active ? '#ef4444' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.active ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 800 }}>{m.step}</div>
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: m.active ? '#fff' : 'var(--text-secondary)' }}>{m.label}</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '80px 0', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <FadeUp className="text-center" style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 12 }}>PRICING</p>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Invest in your productivity</h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 28 }}>7-day free trial on all plans · No credit card required</p>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, fontWeight: !usd ? 700 : 400, color: !usd ? '#fff' : 'var(--text-muted)' }}>KSH</span>
              <button onClick={() => setUsd(!usd)}
                style={{ width: 44, height: 24, borderRadius: 12, background: usd ? 'var(--blue)' : 'var(--bg-card2)', position: 'relative', border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 2, left: usd ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
              <span style={{ fontSize: 14, fontWeight: usd ? 700 : 400, color: usd ? '#fff' : 'var(--text-muted)' }}>USD</span>
            </div>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
            {PLANS.map((plan, i) => (
              <FadeUp key={plan.id} delay={i * 0.06}>
                <div className="card" style={{
                  padding: '24px 20px', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
                  border: plan.popular ? `1px solid ${plan.color}44` : '1px solid var(--border)',
                  background: plan.popular ? `${plan.color}06` : 'var(--bg-card)',
                }}>
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 14px', borderRadius: 100, letterSpacing: '0.08em' }}>MOST POPULAR</div>
                  )}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${plan.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <plan.icon size={16} style={{ color: plan.color }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 2 }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>{fmtPrice(plan.price)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/mo{plan.priceNote || ''}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{plan.desc}</p>

                  {/* Plan highlight */}
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: `${plan.color}08`, border: `1px solid ${plan.color}15`, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: plan.color }}>{plan.highlight}</p>
                  </div>

                  <ul style={{ listStyle: 'none', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {plan.features.slice(0, 5).map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Check size={12} color="#22c55e" style={{ marginTop: 3, flexShrink: 0 }} /> {f}
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 20 }}>+{plan.features.length - 5} more</li>
                    )}
                  </ul>

                  <Link to={`/signup?plan=${plan.id}`} className="btn w-full" style={{
                    background: plan.popular ? plan.color : 'transparent',
                    border: `1px solid ${plan.popular ? plan.color : 'var(--border)'}`,
                    color: plan.popular ? '#fff' : 'var(--text-secondary)',
                    boxShadow: plan.popular ? `0 4px 20px ${plan.color}33` : 'none', fontSize: 13,
                  }}>
                    Start Free Trial
                  </Link>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Comparison table */}
          <FadeUp>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 24 }}>Compare plans</h3>
            <div className="card" style={{ overflow: 'auto', padding: 0 }}>
              <div style={{ minWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ padding: '14px 16px' }} />
                  {PLANS.map(p => (
                    <div key={p.id} style={{ padding: '12px 6px', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                      <p style={{ fontWeight: 700, fontSize: 11, color: p.color }}>{p.name}</p>
                    </div>
                  ))}
                </div>
                {TABLE.map((row, i) => (
                  <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', borderBottom: i < TABLE.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{row.feature}</div>
                    {['individual','corporate_mini','corporate','major_corporate','enterprise'].map(k => (
                      <div key={k} style={{ padding: '10px 6px', textAlign: 'center', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Cell v={row[k]} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <FadeUp>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '56px 40px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(79,110,247,0.06), rgba(139,92,246,0.06))', border: '1px solid rgba(79,110,247,0.15)' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>Ready to transform your workflow?</h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 12 }}>Join enterprise teams using ARIA to stay ahead.</p>
            <p style={{ fontSize: 13, color: 'var(--blue)', marginBottom: 32, fontWeight: 600 }}>7-day free trial · No credit card · Cancel anytime</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <Link to="/signup" className="btn btn-primary btn-lg" style={{ gap: 8, padding: '0 32px' }}>
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <a href="#demos" className="btn btn-ghost btn-lg" style={{ gap: 8 }}>
                <Play size={16} /> See Demo
              </a>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#4F6EF7,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={13} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18 }}>ARIA</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>© {new Date().getFullYear()} ARIA Life. Built for teams worldwide.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
            <Link to="/privacy" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
            <Link to="/terms" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
            <Link to="/cookies" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Cookies</Link>
            <a href="mailto:support@ariaassistant.co.ke" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
