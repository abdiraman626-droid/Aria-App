import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Calendar, Bell, Mic, FileText, TrendingUp,
  Clock, Loader2, Send, MessageCircle, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/RemindersContext';
import { useCalendar } from '../context/CalendarContext';
import { useTeam } from '../context/TeamContext';
import { useLang } from '../context/LangContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-head)', color: '#fff' }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{value}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-card2)', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const { reminders } = useReminders();
  const { events } = useCalendar();
  const { members, clients } = useTeam();
  const { t, lang } = useLang();

  const [meetings, setMeetings]     = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getDocs(query(collection(db, 'meetings'), where('userId', '==', user.id))),
      getDocs(query(collection(db, 'strategies'), where('userId', '==', user.id))),
      getDocs(query(collection(db, 'departments'), where('ownerId', '==', user.id))),
    ]).then(([mSnap, sSnap, dSnap]) => {
      setMeetings(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStrategies(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDepartments(dSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  // Feature usage stats
  const completedReminders = reminders.filter(r => r.done).length;
  const activeReminders    = reminders.filter(r => !r.done).length;
  const highPriority       = reminders.filter(r => r.priority === 'high' && !r.done).length;
  const activeMembers      = members.filter(m => m.status === 'active').length;
  const pendingInvites     = members.filter(m => m.status === 'pending').length;

  const featureUsage = [
    { label: lang === 'ar' ? 'التذكيرات' : 'Reminders', value: reminders.length, color: '#3b82f6' },
    { label: lang === 'ar' ? 'الأحداث' : 'Calendar Events', value: events.length, color: '#22c55e' },
    { label: lang === 'ar' ? 'الاجتماعات' : 'Meetings Recorded', value: meetings.length, color: '#7c3aed' },
    { label: lang === 'ar' ? 'الاستراتيجيات' : 'Strategies', value: strategies.length, color: '#f59e0b' },
    { label: lang === 'ar' ? 'أعضاء الفريق' : 'Team Members', value: members.length, color: '#ec4899' },
    { label: lang === 'ar' ? 'العملاء' : 'Clients', value: clients.length, color: '#06b6d4' },
  ];
  const maxUsage = Math.max(...featureUsage.map(f => f.value), 1);

  // Weekly activity (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const weekReminders = reminders.filter(r => new Date(r.dateTime) > weekAgo).length;
  const weekEvents    = events.filter(e => new Date(e.dateTime) > weekAgo).length;
  const weekMeetings  = meetings.filter(m => m.createdAt?.toDate ? m.createdAt.toDate() > weekAgo : new Date(m.createdAt) > weekAgo).length;

  const generateWeeklyReport = async () => {
    if (!meetings.length) { toast.error('No meetings to report on'); return; }
    setReportLoading(true);
    try {
      const recentMeetings = meetings
        .filter(m => { const d = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt); return d > weekAgo; })
        .map(m => ({
          title: m.title, summary: m.summary,
          actionItems: m.actionItems,
          createdAt: m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : m.createdAt,
        }));

      if (!recentMeetings.length) { toast.error('No meetings this week'); setReportLoading(false); return; }

      const res = await fetch('/api/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetings: recentMeetings,
          userName: user?.name,
          phone: user?.whatsappNumber,
          lang,
        }),
      });
      if (!res.ok) throw new Error('Report failed');
      const data = await res.json();
      setWeeklyReport(data.report);
      toast.success(user?.whatsappNumber ? 'Report generated & sent to WhatsApp' : 'Report generated');
    } catch { toast.error('Failed to generate report'); }
    finally { setReportLoading(false); }
  };

  const labels = {
    en: { title: 'Analytics', overview: 'Overview', usage: 'Feature Usage', weekly: 'This Week', report: 'Weekly Meeting Report', generate: 'Generate Report', depts: 'Departments' },
    sw: { title: 'Uchambuzi', overview: 'Muhtasari', usage: 'Matumizi ya Vipengele', weekly: 'Wiki Hii', report: 'Ripoti ya Mikutano', generate: 'Tengeneza Ripoti', depts: 'Idara' },
    so: { title: 'Falanqayn', overview: 'Guud-mar', usage: 'Isticmaalka Sifooyinka', weekly: 'Toddobaadkan', report: 'Warbixin Kulamo', generate: 'Samee Warbixin', depts: 'Qaybaha' },
    ar: { title: 'التحليلات', overview: 'نظرة عامة', usage: 'استخدام الميزات', weekly: 'هذا الأسبوع', report: 'تقرير الاجتماعات', generate: 'إنشاء التقرير', depts: 'الأقسام' },
  };
  const l = labels[lang] || labels.en;

  if (loading) return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--blue)' }} />
      <BottomNav />
    </div>
  );

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 20px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={20} style={{ color: 'var(--blue)' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700 }}>{l.title}</h1>
          </div>

          {/* Overview Stats */}
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{l.overview}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <StatCard icon={Bell} label={lang === 'ar' ? 'نشطة' : 'Active'} value={activeReminders} color="#3b82f6" sub={`${completedReminders} completed`} />
            <StatCard icon={TrendingUp} label={lang === 'ar' ? 'عاجلة' : 'Urgent'} value={highPriority} color="#ef4444" />
            <StatCard icon={Users} label={lang === 'ar' ? 'الفريق' : 'Team'} value={activeMembers} color="#7c3aed" sub={`${pendingInvites} pending`} />
            <StatCard icon={Calendar} label={lang === 'ar' ? 'أحداث' : 'Events'} value={events.length} color="#22c55e" />
            <StatCard icon={Mic} label={lang === 'ar' ? 'اجتماعات' : 'Meetings'} value={meetings.length} color="#f59e0b" />
            <StatCard icon={Building2} label={l.depts} value={departments.length} color="#06b6d4" />
          </div>

          {/* Feature Usage Bars */}
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{l.usage}</p>
          <div className="card" style={{ padding: '20px', marginBottom: 24 }}>
            {featureUsage.map(f => (
              <BarRow key={f.label} label={f.label} value={f.value} max={maxUsage} color={f.color} />
            ))}
          </div>

          {/* Weekly Activity */}
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{l.weekly}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-head)', color: '#3b82f6' }}>{weekReminders}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'تذكيرات' : 'Reminders'}</p>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-head)', color: '#22c55e' }}>{weekEvents}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'أحداث' : 'Events'}</p>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-head)', color: '#f59e0b' }}>{weekMeetings}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'اجتماعات' : 'Meetings'}</p>
            </div>
          </div>

          {/* Weekly Meeting Report */}
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{l.report}</p>
          <div className="card" style={{ padding: '20px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
              {lang === 'ar' ? 'إنشاء ملخص أسبوعي لجميع الاجتماعات المسجلة وإرساله إلى واتساب.' : 'Generate a weekly summary of all recorded meetings and send to WhatsApp.'}
            </p>
            <button onClick={generateWeeklyReport} disabled={reportLoading} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
              {reportLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {l.generate}
              {user?.whatsappNumber && <MessageCircle size={12} style={{ marginLeft: 4, opacity: 0.7 }} />}
            </button>
            {weeklyReport && (
              <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{weeklyReport}</p>
              </div>
            )}
          </div>

        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
