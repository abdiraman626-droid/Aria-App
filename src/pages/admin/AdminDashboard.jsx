import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Users, DollarSign, MessageSquare, Settings, LogOut, Shield,
  RefreshCw, XCircle, ArrowUpCircle, Clock, Send, CheckCircle, UserCheck,
  X, Save, Star, Zap, Crown, Bell, TrendingUp, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

const PLAN_META = {
  individual:      { price:5000,   color:'#3b82f6', icon:Star  },
  corporate_mini:  { price:15000,  color:'#7c3aed', icon:Zap   },
  corporate:       { price:30000,  color:'#22c55e', icon:Zap   },
  major_corporate: { price:100000, color:'#f59e0b', icon:Crown },
  enterprise:      { price:250000, color:'#ef4444', icon:Crown },
};

function msgs()      { try { return JSON.parse(localStorage.getItem('aria_msgs')||'[]'); } catch { return []; } }
function saveMsgs(m) { localStorage.setItem('aria_msgs',JSON.stringify(m)); }
function getPricing(){ try { return JSON.parse(localStorage.getItem('aria_admin_pricing')||'null') || PLAN_META; } catch { return PLAN_META; } }

const TABS = [
  { id:'overview',  label:'Overview',  icon:BarChart2    },
  { id:'users',     label:'Users',     icon:Users        },
  { id:'revenue',   label:'Revenue',   icon:DollarSign   },
  { id:'messages',  label:'Messages',  icon:MessageSquare},
  { id:'pricing',   label:'Pricing',   icon:Settings     },
];

// Map Firestore user doc → admin user object
function toUser(id, p) {
  return {
    id,
    email:          p.email          || '',
    name:           p.name           || p.email?.split('@')[0] || '?',
    plan:           p.plan           || 'personal',
    whatsappNumber: p.whatsappNumber || '',
    onTrial:        p.onTrial        ?? true,
    trialEnds:      p.trialEnds      || null,
    monthlyPrice:   p.monthlyPrice   || 5000,
    active:         p.active         ?? true,
    googleConnected:p.googleConnected || false,
    createdAt:      p.createdAt?.toDate?.()?.toISOString() || p.createdAt || null,
    avatar:         (p.name || p.email || '?')[0].toUpperCase(),
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  if (!sessionStorage.getItem('aria_admin')) { navigate('/admin'); return null; }

  const [tab,      setTab]      = useState('overview');
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [allMsgs,  setAllMsgs]  = useState([]);
  const [pricing,  setPricing]  = useState(getPricing());
  const [actionU,  setActionU]  = useState(null);  // user object for modal
  const [actionT,  setActionT]  = useState(null);  // 'upgrade' | 'extend'
  const [upgPlan,  setUpgPlan]  = useState('business');
  const [extDays,  setExtDays]  = useState(7);
  const [saving,   setSaving]   = useState(false);
  const [msgTo,    setMsgTo]    = useState('all');
  const [msgSub,   setMsgSub]   = useState('');
  const [msgBody,  setMsgBody]  = useState('');
  const [search,   setSearch]   = useState('');

  // ── Fetch all users from Firestore ──────────────────────────────────────
  const refresh = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const loaded = snap.docs.map(d => toUser(d.id, d.data()));
      loaded.sort((a, b) => (b.createdAt || '') > (a.createdAt || '') ? 1 : -1);
      setUsers(loaded);
    } catch (err) {
      toast.error('Could not load users: ' + err.message);
    }
    setAllMsgs(msgs());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [tab]);

  // ── Revenue stats ────────────────────────────────────────────────────────
  const revenue = {
    mrr:       users.filter(u=>u.active&&!u.onTrial).reduce((s,u)=>s+(u.monthlyPrice||0),0),
    total:     users.length,
    active:    users.filter(u=>u.active&&!u.onTrial).length,
    trial:     users.filter(u=>u.active&&u.onTrial).length,
    cancelled: users.filter(u=>!u.active).length,
    byPlan: {
      individual:      users.filter(u=>u.plan==='individual'&&u.active).length,
      corporate_mini:  users.filter(u=>u.plan==='corporate_mini'&&u.active).length,
      corporate:       users.filter(u=>u.plan==='corporate'&&u.active).length,
      major_corporate: users.filter(u=>u.plan==='major_corporate'&&u.active).length,
      enterprise:      users.filter(u=>u.plan==='enterprise'&&u.active).length,
    },
  };

  // ── Admin actions via Firestore direct writes ────────────────────────────
  async function updateUserDoc(userId, updates) {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  }

  const doSetPlan = async (userId, plan) => {
    setSaving(true);
    const ok = await updateUserDoc(userId, { plan, monthlyPrice: PLAN_META[plan]?.price || 5000 });
    if (ok) toast.success(`Plan → ${plan}`);
    setSaving(false);
    refresh();
  };

  const doUpgrade = async (userId) => {
    setSaving(true);
    const ok = await updateUserDoc(userId, { plan: upgPlan, monthlyPrice: PLAN_META[upgPlan]?.price || 99 });
    if (ok) { toast.success(`Plan set to ${upgPlan}`); setActionU(null); }
    setSaving(false);
    refresh();
  };

  const doExtend = async (userId) => {
    setSaving(true);
    const trialEnds = new Date(Date.now() + extDays * 864e5).toISOString();
    const ok = await updateUserDoc(userId, { onTrial: true, trialEnds });
    if (ok) { toast.success(`Trial extended ${extDays} days`); setActionU(null); }
    setSaving(false);
    refresh();
  };

  const doCancel = async (userId) => {
    if (!confirm('Cancel this account?')) return;
    const ok = await updateUserDoc(userId, { active: false });
    if (ok) toast.success('Account cancelled');
    refresh();
  };

  const doReactivate = async (userId) => {
    const ok = await updateUserDoc(userId, { active: true });
    if (ok) toast.success('Account reactivated');
    refresh();
  };

  const doSendMsg = () => {
    if (!msgSub||!msgBody){ toast.error('Fill subject & message'); return; }
    const targets = msgTo==='all' ? users.map(u=>u.email) : [msgTo];
    const m = msgs();
    targets.forEach(e => m.unshift({ id:Date.now()+Math.random(), to:e, subject:msgSub, body:msgBody, sentAt:new Date().toISOString() }));
    saveMsgs(m);
    toast.success(`Sent to ${targets.length} user${targets.length>1?'s':''}`);
    setMsgSub(''); setMsgBody(''); refresh();
  };

  const savePricing = () => { localStorage.setItem('aria_admin_pricing',JSON.stringify(pricing)); toast.success('Pricing saved!'); };

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{ width:220, background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:10, overflow:'hidden' }}>
            <img src="/logo.png" alt="ARIA" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <p style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, color:'#fff' }}>ARIA Admin</p>
        </div>
        <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:14, textAlign:'left', width:'100%', transition:'all 0.15s',
                background: tab===t.id?'rgba(59,130,246,0.12)':'transparent',
                color:      tab===t.id?'#3b82f6':'var(--text-muted)' }}>
              <t.icon size={15}/> {t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:4 }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, fontSize:13, color:'var(--text-muted)', textDecoration:'none' }}>
            <Bell size={13}/> View App
          </Link>
          <button onClick={() => { sessionStorage.removeItem('aria_admin'); navigate('/admin'); }}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, fontSize:13, color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-body)' }}>
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={{ flex:1, overflowY:'auto', padding:28 }}>

        {/* OVERVIEW */}
        {tab==='overview' && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700 }}>Overview</h1>
              <button onClick={refresh} disabled={loading} className="btn btn-ghost btn-sm">
                <RefreshCw size={14} className={loading?'animate-spin':''}/>
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              {[
                {label:'MRR',    value:`$${revenue.mrr.toLocaleString()}`,        icon:DollarSign,  color:'#22c55e'},
                {label:'ARR',    value:`$${(revenue.mrr*12).toLocaleString()}`,   icon:TrendingUp,  color:'#3b82f6'},
                {label:'Users',  value:revenue.total,                             icon:Users,       color:'#7c3aed'},
                {label:'Active', value:revenue.active,                            icon:CheckCircle, color:'#f59e0b'},
              ].map(s=>(
                <div key={s.label} className="card" style={{ padding:'20px' }}>
                  <s.icon size={20} style={{ color:s.color, marginBottom:12 }}/>
                  <p style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, color:'#fff' }}>{s.value}</p>
                  <p style={{ fontSize:13, color:'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="card" style={{ padding:'20px' }}>
                <h3 style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, marginBottom:16 }}>By Plan</h3>
                {['personal','business','premium'].map(p => {
                  const m=PLAN_META[p]; const count=revenue.byPlan[p];
                  return <div key={p} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:14, color:'var(--text-secondary)', textTransform:'capitalize' }}>{p}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:m.color }}>{count} · ${(count*m.price).toLocaleString()}/mo</span>
                  </div>;
                })}
              </div>
              <div className="card" style={{ padding:'20px' }}>
                <h3 style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, marginBottom:16 }}>Status</h3>
                {[{l:'Active (paid)',value:revenue.active,c:'#22c55e'},{l:'On trial',value:revenue.trial,c:'#f59e0b'},{l:'Cancelled',value:revenue.cancelled,c:'#ef4444'}].map(s=>(
                  <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:14, color:'var(--text-secondary)' }}>{s.l}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:s.c }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* USERS */}
        {tab==='users' && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700 }}>
                Users {loading ? <Loader2 size={18} className="animate-spin" style={{ display:'inline', marginLeft:8, color:'var(--text-muted)' }}/> : `(${users.length})`}
              </h1>
              <button onClick={refresh} disabled={loading} className="btn btn-ghost btn-sm">
                <RefreshCw size={14} className={loading?'animate-spin':''}/>
              </button>
            </div>

            {/* Search */}
            <input className="input" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name or email..." style={{ marginBottom:16 }}/>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {filteredUsers.map(u => {
                const pm = PLAN_META[u.plan] || PLAN_META.personal;
                const trial = u.trialEnds ? Math.max(0, Math.ceil((new Date(u.trialEnds)-Date.now())/864e5)) : 0;
                return (
                  <div key={u.id} className="card" style={{ padding:'18px 20px', opacity:u.active?1:0.55, border: u.active?'1px solid var(--border)':'1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
                      {/* Avatar */}
                      <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${pm.color},${pm.color}99)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16, flexShrink:0 }}>
                        {u.avatar}
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:2 }}>
                          <span style={{ fontWeight:700, fontSize:15 }}>{u.name}</span>
                          <span className="badge" style={{ background:`${pm.color}15`, color:pm.color, border:`1px solid ${pm.color}30`, fontSize:11 }}>{u.plan}</span>
                          {u.onTrial && trial>0 && <span className="badge badge-yellow" style={{ fontSize:11 }}>Trial {trial}d left</span>}
                          {!u.active && <span className="badge badge-red" style={{ fontSize:11 }}>Cancelled</span>}
                          {u.googleConnected && <span className="badge" style={{ background:'rgba(66,133,244,0.1)', color:'#4285f4', border:'1px solid rgba(66,133,244,0.2)', fontSize:11 }}>Google</span>}
                        </div>
                        <p style={{ fontSize:13, color:'var(--text-muted)' }}>{u.email} · ${u.monthlyPrice}/mo</p>
                        {u.createdAt && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Joined {format(new Date(u.createdAt),'MMM d, yyyy')}</p>}
                      </div>
                    </div>

                    {/* Quick plan buttons */}
                    <div style={{ marginTop:14, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, marginRight:4 }}>Set Plan:</span>
                      {['personal','business','premium'].map(p => (
                        <button key={p} onClick={() => doSetPlan(u.id, p)} disabled={saving || u.plan===p}
                          style={{ padding:'5px 12px', borderRadius:8, border:`1px solid ${u.plan===p?PLAN_META[p].color:'var(--border)'}`, background: u.plan===p?`${PLAN_META[p].color}18`:'var(--bg-card2)', color: u.plan===p?PLAN_META[p].color:'var(--text-muted)', fontSize:12, fontWeight:700, cursor: u.plan===p?'default':'pointer', fontFamily:'var(--font-body)', opacity: u.plan===p?1:0.8, transition:'all 0.15s' }}>
                          {p.charAt(0).toUpperCase()+p.slice(1)}
                        </button>
                      ))}

                      <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                        <button onClick={() => {setActionU(u);setActionT('extend');}} className="btn btn-sm" style={{ background:'rgba(59,130,246,0.1)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.2)', minHeight:32 }}>
                          <Clock size={11}/> Extend Trial
                        </button>
                        <button onClick={() => {setMsgTo(u.email);setTab('messages');}} className="btn btn-sm" style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.2)', minHeight:32 }}>
                          <Send size={11}/> Message
                        </button>
                        {u.active
                          ? <button onClick={() => doCancel(u.id)}     className="btn btn-sm" style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', minHeight:32 }}><XCircle size={11}/> Cancel</button>
                          : <button onClick={() => doReactivate(u.id)} className="btn btn-sm" style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.2)', minHeight:32 }}><UserCheck size={11}/> Reactivate</button>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && filteredUsers.length === 0 && (
                <div className="card" style={{ padding:'48px', textAlign:'center' }}>
                  <p style={{ fontSize:16, color:'var(--text-muted)' }}>{search ? 'No users match your search' : 'No users yet'}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* REVENUE */}
        {tab==='revenue' && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, marginBottom:24 }}>Revenue</h1>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
              {[
                {l:'MRR', v:`$${revenue.mrr.toLocaleString()}`,                                   s:'Monthly Recurring'},
                {l:'ARR', v:`$${(revenue.mrr*12).toLocaleString()}`,                              s:'Annual Projected'},
                {l:'ARPU',v:revenue.active?`$${Math.round(revenue.mrr/Math.max(revenue.active,1))}`:'$0', s:'Per Active User'},
              ].map(c=>(
                <div key={c.l} className="card" style={{ padding:'24px' }}>
                  <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>{c.l}</p>
                  <p style={{ fontFamily:'var(--font-head)', fontSize:36, fontWeight:700 }}>{c.v}</p>
                  <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{c.s}</p>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:'20px', overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['Plan','Price','Users','MRR','ARR'].map(h=>(
                      <th key={h} style={{ padding:'10px 12px', textAlign:h==='Plan'?'left':'right', color:'var(--text-muted)', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['personal','business','premium'].map(p=>{
                    const m=PLAN_META[p]; const c=revenue.byPlan[p]; const mrr=c*m.price;
                    return <tr key={p} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'12px', color:'#fff', textTransform:'capitalize', fontWeight:600 }}>{p}</td>
                      <td style={{ padding:'12px', textAlign:'right', color:'var(--text-muted)' }}>${m.price}/mo</td>
                      <td style={{ padding:'12px', textAlign:'right', color:'var(--text-muted)' }}>{c}</td>
                      <td style={{ padding:'12px', textAlign:'right', color:'#22c55e', fontWeight:700 }}>${mrr.toLocaleString()}</td>
                      <td style={{ padding:'12px', textAlign:'right', color:'#22c55e' }}>${(mrr*12).toLocaleString()}</td>
                    </tr>;
                  })}
                  <tr style={{ borderTop:'2px solid var(--border)', background:'var(--bg-card2)' }}>
                    <td colSpan={3} style={{ padding:'12px', fontWeight:700, color:'#fff' }}>Total</td>
                    <td style={{ padding:'12px', textAlign:'right', fontWeight:700, color:'#22c55e', fontSize:16 }}>${revenue.mrr.toLocaleString()}</td>
                    <td style={{ padding:'12px', textAlign:'right', fontWeight:700, color:'#22c55e' }}>${(revenue.mrr*12).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* MESSAGES */}
        {tab==='messages' && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, marginBottom:24 }}>Messages</h1>
            <div className="card" style={{ padding:'24px', marginBottom:20 }}>
              <h3 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, marginBottom:20 }}>Compose</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label className="label">Send To</label>
                  <select className="input" value={msgTo} onChange={e=>setMsgTo(e.target.value)} style={{ colorScheme:'dark' }}>
                    <option value="all">All Users ({users.length})</option>
                    {users.map(u=><option key={u.id} value={u.email}>{u.name} — {u.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <input className="input" value={msgSub} onChange={e=>setMsgSub(e.target.value)} placeholder="Your trial is ending soon..."/>
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea className="input resize-none" rows={5} value={msgBody} onChange={e=>setMsgBody(e.target.value)} placeholder="Write your message here..."/>
                </div>
                <button onClick={doSendMsg} className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start' }}>
                  <Send size={14}/> Send Message
                </button>
              </div>
            </div>
            {allMsgs.length > 0 && (
              <>
                <h3 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, marginBottom:14 }}>Sent ({allMsgs.length})</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {allMsgs.map(m=>(
                    <div key={m.id} className="card" style={{ padding:'16px 20px', display:'flex', justifyContent:'space-between', gap:12 }}>
                      <div>
                        <p style={{ fontWeight:700, fontSize:14 }}>{m.subject}</p>
                        <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>To: {m.to} · {format(new Date(m.sentAt),'MMM d, h:mm a')}</p>
                        <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:6, lineHeight:1.5 }}>{m.body.slice(0,100)}{m.body.length>100?'...':''}</p>
                      </div>
                      <CheckCircle size={16} style={{ color:'#22c55e', flexShrink:0, marginTop:2 }}/>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* PRICING */}
        {tab==='pricing' && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, marginBottom:8 }}>Pricing Settings</h1>
            <p style={{ fontSize:15, color:'var(--text-muted)', marginBottom:24 }}>Changes update live pricing shown to visitors.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {['personal','business','premium'].map(key => {
                const pm=PLAN_META[key]; const p=pricing[key]||pm;
                return (
                  <div key={key} className="card" style={{ padding:'24px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:`${pm.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <pm.icon size={16} style={{ color:pm.color }}/>
                      </div>
                      <h3 style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700, textTransform:'capitalize' }}>{key}</h3>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      <div>
                        <label className="label">Price (USD/month)</label>
                        <input type="number" className="input" value={p.price||pm.price}
                          onChange={e=>setPricing(prev=>({...prev,[key]:{...prev[key],price:parseInt(e.target.value)||0}}))}/>
                      </div>
                      <div>
                        <label className="label">Plan Name</label>
                        <input className="input" value={p.name||key}
                          onChange={e=>setPricing(prev=>({...prev,[key]:{...prev[key],name:e.target.value}}))}/>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={savePricing} className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start' }}>
                <Save size={14}/> Save Pricing
              </button>
            </div>
          </motion.div>
        )}

      </main>

      {/* ── Extend Trial Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {actionU && actionT === 'extend' && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', zIndex:40 }}
              onClick={() => setActionU(null)}/>
            <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.92}}
              style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'90%', maxWidth:380, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:24, padding:28, zIndex:50 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <h3 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Extend Trial</h3>
                <button onClick={() => setActionU(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18}/></button>
              </div>
              <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>{actionU.name} · {actionU.email}</p>
              <label className="label">Extend by (days)</label>
              <input type="number" className="input" value={extDays} onChange={e=>setExtDays(parseInt(e.target.value)||7)} min={1} max={90} style={{ marginBottom:16 }}/>
              <button onClick={() => doExtend(actionU.id)} disabled={saving} className="btn btn-primary w-full">
                {saving ? <><Loader2 size={15} className="animate-spin"/> Saving...</> : <><Clock size={15}/> Extend Trial</>}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
