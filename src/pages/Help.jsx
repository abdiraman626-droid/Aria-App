import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bell, Mic, MessageCircle, Mail, Users, CreditCard, Link2, AlertTriangle, RefreshCw, Calendar, Star, Zap, Crown, ArrowLeft } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import BottomNav from '../components/BottomNav';
import { Link } from 'react-router-dom';

const PLAN_COLORS = { individual: '#3b82f6', corporate_mini: '#3b82f6', corporate: '#3b82f6', major_corporate: '#3b82f6', enterprise: '#3b82f6' };

function Accordion({ question, answer, icon: Icon, accent }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${open ? accent + '40' : 'var(--border)'}`,
        marginBottom: 8, transition: 'border 0.2s',
        background: open ? `${accent}06` : 'var(--bg-card)',
      }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center',
          gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}>
        {Icon && (
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={14} style={{ color: accent }} />
          </div>
        )}
        <p style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#fff', fontFamily: 'var(--font-body)' }}>{question}</p>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}>
            <p style={{ padding: '0 16px 16px 58px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, plan, color, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700 }}>{title}</h2>
          {plan && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: `${color}14`, color, border: `1px solid ${color}25` }}>
              {plan} plan
            </span>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export default function Help() {
  const { plan, isIndividual, isCorporate, isEnterprise } = usePlan();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all',      label: 'All Features' },
    { id: 'personal', label: 'Personal',   color: '#3b82f6' },
    { id: 'business', label: 'Business',   color: '#7c3aed' },
    { id: 'premium',  label: 'Premium',    color: '#f59e0b' },
  ];

  const show = (tier) => activeTab === 'all' || activeTab === tier;

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '72px 20px 0' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Link to="/settings" style={{ color: 'var(--text-muted)', display: 'flex' }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>Help & Guide</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>Everything you need to get the most from ARIA</p>
            </div>
          </div>

          {/* Plan badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: `${PLAN_COLORS[plan]}14`, border: `1px solid ${PLAN_COLORS[plan]}25`, marginBottom: 24 }}>
            {isEnterprise ? <Crown size={12} style={{ color: '#f59e0b' }} /> : isCorporate ? <Zap size={12} style={{ color: '#7c3aed' }} /> : <Star size={12} style={{ color: '#3b82f6' }} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: PLAN_COLORS[plan] }}>
              You're on the {plan[0].toUpperCase() + plan.slice(1)} plan
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                  background: activeTab === t.id ? (t.color || 'var(--blue)') : 'var(--bg-card)',
                  color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── GETTING STARTED ───────────────────────────────────── */}
          {show('personal') && (
            <Section title="Getting Started" color="#3b82f6" icon={Bell}>
              <Accordion
                icon={Bell} accent="#3b82f6"
                question="How do I create my first reminder?"
                answer="Tap the blue + button (bottom right on any page) or the + Add button on the Reminders page. Fill in a title, pick a date & time, choose your notification channel (WhatsApp, Voice, Email, or Browser Notification), and tap Add Reminder. That's it!"
              />
              <Accordion
                icon={Mic} accent="#3b82f6"
                question="What is the Voice Briefing?"
                answer="The Voice Briefing reads your day's upcoming reminders aloud using AI voices from ElevenLabs. Tap the large circular button on the Dashboard. It auto-plays every morning between 7–11am on your first visit of the day. To use ElevenLabs voices, add your free API key in Settings → Voice."
              />
              <Accordion
                icon={Bell} accent="#3b82f6"
                question="What are the notification channels?"
                answer="WhatsApp: sends a formatted message to your WhatsApp number (set in Settings → Profile). Voice: reads the reminder aloud through ARIA's AI voice. Email: opens your mail app with a pre-filled email. Notification: fires a browser push notification when the reminder is due."
              />
              <Accordion
                icon={Calendar} accent="#3b82f6"
                question="How do I connect Google Calendar and Gmail?"
                answer="Go to Settings → Google Integration and tap Connect Google. You'll be asked to authorize ARIA to read your calendar events and emails. Once connected, your Dashboard shows real calendar events and smart email categories (Urgent, People, Companies)."
              />
              <Accordion
                icon={Bell} accent="#3b82f6"
                question="How does the reminder limit work on Personal plan?"
                answer="Individual plan includes unlimited reminders. You'll see your reminders on your Dashboard and Reminders page. When you reach the limit, creating new reminders is blocked until you delete old ones or upgrade to Business."
              />
            </Section>
          )}

          {/* ── BUSINESS PLAN ─────────────────────────────────────── */}
          {show('business') && (
            <Section title="Business Features" plan="Business" color="#7c3aed" icon={Users}>
              <Accordion
                icon={Users} accent="#7c3aed"
                question="How do I invite team members?"
                answer="Go to Team (nav bar) and enter a colleague's email in the Invite Team Member form. After inviting, copy the unique invite link and share it via WhatsApp or email. Your colleague clicks the link, creates their account, and is automatically linked to your team. Business plan supports up to 5 members."
              />
              <Accordion
                icon={Bell} accent="#7c3aed"
                question="How do I assign reminders to team members?"
                answer="When creating or editing a reminder, scroll to the Assign To dropdown at the bottom of the form. Select a team member and save. The reminder appears in their ARIA account and in your Team dashboard filtered by member."
              />
              <Accordion
                icon={Users} accent="#7c3aed"
                question="How does client management work?"
                answer="Go to Clients (reachable from Settings or the Clients link). Add clients with name, phone, email, and notes. You can then link reminders to specific clients using the For Client dropdown in the reminder form. WhatsApp and email buttons appear on each client card for quick contact."
              />
              <Accordion
                icon={RefreshCw} accent="#7c3aed"
                question="What are recurring reminders?"
                answer="When creating a reminder, you'll see a Repeat section with options: None, Daily, Weekly, Monthly. Choose a recurrence and optionally set an end date. When you mark a recurring reminder as done, ARIA automatically creates the next occurrence. This is a Business plan feature."
              />
              <Accordion
                icon={MessageCircle} accent="#7c3aed"
                question="Can I send WhatsApp messages to any number?"
                answer="Yes! Business and Premium users can tap the WhatsApp button on any reminder and enter any phone number — not just their own. A modal appears pre-filled with your own number for convenience. Personal plan users can only send to their own registered WhatsApp number."
              />
            </Section>
          )}

          {/* ── PREMIUM PLAN ──────────────────────────────────────── */}
          {show('premium') && (
            <Section title="Premium Features" plan="Premium" color="#f59e0b" icon={Crown}>
              <Accordion
                icon={Users} accent="#f59e0b"
                question="Does Premium support unlimited team members?"
                answer="Yes. Premium removes the 5-member cap entirely. You can invite as many team members as you need. The Team page will show your total count without a limit indicator."
              />
              <Accordion
                icon={AlertTriangle} accent="#f59e0b"
                question="What are URGENT reminders?"
                answer="When creating a reminder, Premium users see an URGENT toggle (red pulsing button). Mark any reminder as urgent to: (1) immediately fire a browser notification, (2) show a pulsing red border in your reminders list, (3) repeat the notification every 30 minutes until the reminder is marked done."
              />
              <Accordion
                icon={CreditCard} accent="#f59e0b"
                question="How do M-Pesa payment reminders work?"
                answer="When creating a reminder, enter an amount (KES) and a Till or Paybill number in the M-Pesa fields. The reminder card shows the payment details with a gold card icon. Tap the card icon on any unpaid M-Pesa reminder to mark it as Paid — a green 'Paid ✓' confirmation appears."
              />
              <Accordion
                icon={Link2} accent="#f59e0b"
                question="What is the Client Portal?"
                answer="Each client can get a unique link (no login required). Go to Clients, tap the 🔗 link icon on any client card to copy their portal URL. Share it via WhatsApp or email. The client opens it on any phone browser and can: view all their reminders, confirm appointments with one tap, and send you requests. Requests appear in Supabase for you to review."
              />
              <Accordion
                icon={Mic} accent="#f59e0b"
                question="How do I use custom AI voices?"
                answer="Go to Settings → Voice. Corporate plan and above can use Rachel AI voice plus Daniel. Premium voices Matilda and Liam are available on Major Corporate and Enterprise plans. Tap Preview to hear a sample, tap the card to select, then click Save."
              />
            </Section>
          )}

          {/* ── TIPS ───────────────────────────────────────────────── */}
          {show('personal') && (
            <Section title="Tips & Tricks" color="#22c55e" icon={Star}>
              <Accordion
                icon={Star} accent="#22c55e"
                question="Does the morning briefing play automatically?"
                answer="Yes — ARIA plays your voice briefing automatically between 7am and 11am on your first visit of the Dashboard each day. It will not auto-play outside that window. You can always tap the large mic button to play or stop the briefing manually."
              />
              <Accordion
                icon={Mail} accent="#22c55e"
                question="Can I create reminders from emails?"
                answer="Yes! Connect Google in Settings. On your Dashboard, urgent emails show a blue Create Reminder button. Tap it and ARIA pre-fills the reminder form with the email subject and sender. Adjust the date/time and save."
              />
              <Accordion
                icon={Bell} accent="#22c55e"
                question="What do the priority labels mean?"
                answer="Urgent (red): time-critical tasks, shown at the top of your list. Today (amber): things due today. Upcoming (green): future tasks. These are purely labels — all reminders notify you at your chosen date and time regardless of priority."
              />
            </Section>
          )}

        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
