import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, Activity, BarChart3, LogOut, Search, RefreshCw, Loader2,
  Bell, Calendar, Mic, Lightbulb, Video, MessageSquare,
} from 'lucide-react';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import {
  collection, getDocs, query, where,
} from 'firebase/firestore';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from 'recharts';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const PLAN_LABELS = {
  individual:      'Individual',
  corporate_mini:  'Corporate Mini',
  corporate:       'Corporate',
  major_corporate: 'Major Corporate',
  enterprise:      'Enterprise',
};

function Card({ children, style }) {
  return (
    <div style={{
      background: 'rgba(15,15,18,0.6)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid #1a1a1f',
      borderRadius: 16,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={20} style={{ color: '#3b82f6' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
          <p style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: '#4a4a55', marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users,        setUsers]        = useState([]);
  const [reminders,    setReminders]    = useState(0);
  const [events,       setEvents]       = useState(0);
  const [meetings,     setMeetings]     = useState(0);
  const [strategies,   setStrategies]   = useState(0);
  const [suggestions,  setSuggestions]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, r, e, m, s, sg] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'reminders')),
        getDocs(collection(db, 'calendar_events')),
        getDocs(collection(db, 'meetings')),
        getDocs(collection(db, 'strategies')),
        getDocs(collection(db, 'suggestions')),
      ]);
      const userList = u.docs.map(d => {
        const data = d.data();
        const created = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : null);
        return {
          id: d.id,
          email: data.email || '—',
          name: data.name || '',
          plan: data.plan || 'individual',
          createdAt: created,
          lastActiveAt: data.lastActiveAt?.toDate?.() || null,
          onTrial: data.onTrial ?? true,
        };
      });
      userList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUsers(userList);
      setReminders(r.size);
      setEvents(e.size);
      setMeetings(m.size);
      setStrategies(s.size);
      setSuggestions(sg.size);
    } catch (err) {
      console.error('Admin fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const newToday = users.filter(u => u.createdAt && isAfter(u.createdAt, today)).length;
    const dayAgo = subDays(new Date(), 1);
    // Daily active users: users with lastActiveAt in last 24h, or signed up in last 24h
    const dau = users.filter(u =>
      (u.lastActiveAt && isAfter(u.lastActiveAt, dayAgo)) ||
      (u.createdAt && isAfter(u.createdAt, dayAgo))
    ).length;
    return { total: users.length, newToday, dau };
  }, [users]);

  // Signups over the last 30 days
  const signupChart = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      return { date, label: format(date, 'MMM d'), count: 0 };
    });
    users.forEach(u => {
      if (!u.createdAt) return;
      const day = startOfDay(u.createdAt);
      const slot = days.find(d => d.date.getTime() === day.getTime());
      if (slot) slot.count += 1;
    });
    return days;
  }, [users]);

  // Plan distribution
  const planDist = useMemo(() => {
    const counts = {};
    users.forEach(u => { counts[u.plan] = (counts[u.plan] || 0) + 1; });
    return Object.keys(PLAN_LABELS).map(plan => ({
      plan: PLAN_LABELS[plan],
      count: counts[plan] || 0,
    }));
  }, [users]);

  const featureUsage = [
    { feature: 'Reminders',  count: reminders,   icon: Bell },
    { feature: 'Calendar',   count: events,      icon: Calendar },
    { feature: 'Meetings',   count: meetings,    icon: Video },
    { feature: 'Strategies', count: strategies,  icon: Lightbulb },
    { feature: 'Suggestions',count: suggestions, icon: MessageSquare },
  ];
  const maxFeature = Math.max(...featureUsage.map(f => f.count), 1);

  const filteredUsers = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#fff' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,6,8,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #141418', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo.png" alt="ARIA" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover' }} />
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, color: '#fff' }}>ARIA Admin</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#888' }}>{user?.email}</span>
          <button onClick={fetchAll} disabled={loading}
            style={{ background: 'transparent', border: '1px solid #2a2a30', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', color: '#a0a0a8', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
          <button onClick={handleLogout}
            style={{ background: 'transparent', border: '1px solid #2a2a30', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', color: '#a0a0a8', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>Live overview of ARIA Life users and feature usage</p>
        </motion.div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
          <Stat icon={Users}     label="Total Users"        value={stats.total.toLocaleString()} />
          <Stat icon={UserPlus}  label="New Signups Today"  value={stats.newToday} sub={`+${stats.newToday} in last 24h`} />
          <Stat icon={Activity}  label="Daily Active Users" value={stats.dau} sub="Active in last 24h" />
          <Stat icon={BarChart3} label="Total Reminders"    value={reminders.toLocaleString()} />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginBottom: 24 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700 }}>Signups · Last 30 Days</h3>
              <span style={{ fontSize: 11, color: '#4a4a55' }}>Daily new accounts</span>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1a1a1f" vertical={false} />
                  <XAxis dataKey="label" stroke="#4a4a55" fontSize={10} tickLine={false} interval={4} />
                  <YAxis stroke="#4a4a55" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f0f12', border: '1px solid #1a1a1f', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#fillBlue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700 }}>Plan Distribution</h3>
              <span style={{ fontSize: 11, color: '#4a4a55' }}>Active accounts per tier</span>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planDist} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1a1a1f" vertical={false} />
                  <XAxis dataKey="plan" stroke="#4a4a55" fontSize={10} tickLine={false} angle={-15} textAnchor="end" height={50} />
                  <YAxis stroke="#4a4a55" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f0f12', border: '1px solid #1a1a1f', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Feature usage breakdown */}
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Feature Usage Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {featureUsage.map(f => {
              const pct = (f.count / maxFeature) * 100;
              return (
                <div key={f.feature}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a0a0a8' }}>
                      <f.icon size={13} style={{ color: '#3b82f6' }} /> {f.feature}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{f.count.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* User list */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700 }}>Users ({filteredUsers.length})</h3>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a4a55' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or name…"
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1f', color: '#fff', fontSize: 13, outline: 'none' }} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1f' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#888', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#888', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Plan</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#888', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Signed Up</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#888', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '32px 12px', textAlign: 'center', color: '#4a4a55' }}>{loading ? 'Loading…' : 'No users found'}</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #141418' }}>
                    <td style={{ padding: '12px', color: '#fff' }}>
                      {u.email}
                      {u.name && <div style={{ fontSize: 11, color: '#4a4a55', marginTop: 2 }}>{u.name}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                        {PLAN_LABELS[u.plan] || u.plan}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#a0a0a8' }}>
                      {u.createdAt ? format(u.createdAt, 'MMM d, yyyy') : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: u.onTrial ? '#f59e0b' : '#22c55e' }}>
                        {u.onTrial ? '● Trial' : '● Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </main>
    </div>
  );
}
