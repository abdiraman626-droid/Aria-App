import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, X, Users, Trash2, Edit3, Save, Loader2, UserPlus, ChevronDown, Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useLang } from '../context/LangContext';
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';

const DEPT_COLORS = ['#3b82f6', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#10b981'];

export default function Departments() {
  const { user } = useAuth();
  const { members } = useTeam();
  const { lang } = useLang();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [name, setName]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [expandedDept, setExpandedDept] = useState(null);
  const [assigningDept, setAssigningDept] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    getDocs(query(collection(db, 'departments'), where('ownerId', '==', user.id)))
      .then(snap => {
        setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [user?.id]);

  const activeMembers = members.filter(m => m.status === 'active');

  const saveDept = async () => {
    if (!name.trim()) { toast.error('Department name is required'); return; }
    setSaving(true);
    try {
      if (editingDept) {
        await updateDoc(doc(db, 'departments', editingDept.id), { name: name.trim() });
        setDepartments(prev => prev.map(d => d.id === editingDept.id ? { ...d, name: name.trim() } : d));
        toast.success('Department updated');
      } else {
        const color = DEPT_COLORS[departments.length % DEPT_COLORS.length];
        const ref = await addDoc(collection(db, 'departments'), {
          ownerId: user.id, name: name.trim(), color, memberIds: [], createdAt: serverTimestamp(),
        });
        setDepartments(prev => [...prev, { id: ref.id, ownerId: user.id, name: name.trim(), color, memberIds: [] }]);
        toast.success('Department created');
      }
      setName(''); setShowForm(false); setEditingDept(null);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteDept = async (id) => {
    await deleteDoc(doc(db, 'departments', id));
    setDepartments(prev => prev.filter(d => d.id !== id));
    toast.success('Department deleted');
  };

  const assignMember = async (deptId, memberId) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return;
    const ids = dept.memberIds || [];
    const newIds = ids.includes(memberId) ? ids.filter(id => id !== memberId) : [...ids, memberId];
    await updateDoc(doc(db, 'departments', deptId), { memberIds: newIds });
    setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, memberIds: newIds } : d));
  };

  const getMemberName = (memberId) => {
    const m = members.find(m => m.memberId === memberId);
    return m?.name || m?.invitedEmail || 'Unknown';
  };

  const labels = {
    en: { title: 'Departments', create: 'Create Department', name_label: 'Department Name', members_label: 'Members', assign: 'Assign Members', no_depts: 'No departments yet. Create one to organize your team.', no_members: 'No active team members to assign' },
    sw: { title: 'Idara', create: 'Unda Idara', name_label: 'Jina la Idara', members_label: 'Wanachama', assign: 'Weka Wanachama', no_depts: 'Hakuna idara bado. Unda moja kupanga timu yako.', no_members: 'Hakuna wanachama wa timu' },
    so: { title: 'Qaybaha', create: 'Samee Qayb', name_label: 'Magaca Qaybta', members_label: 'Xubno', assign: 'Qoonee Xubno', no_depts: 'Qaybo wali ma jiraan. Samee mid si aad u habayso kooxdaada.', no_members: 'Xubno koox firfircoon ma jiraan' },
    ar: { title: 'الأقسام', create: 'إنشاء قسم', name_label: 'اسم القسم', members_label: 'الأعضاء', assign: 'تعيين أعضاء', no_depts: 'لا توجد أقسام بعد. أنشئ واحداً لتنظيم فريقك.', no_members: 'لا يوجد أعضاء نشطون' },
  };
  const l = labels[lang] || labels.en;

  // Plan gate — only Major Corporate and Enterprise can access
  const userPlan = user?.plan || 'individual';
  const allowedPlans = ['major_corporate', 'enterprise'];
  if (!allowedPlans.includes(userPlan)) {
    return (
      <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ maxWidth: 380, width: '100%', padding: '40px 28px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px',
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={26} style={{ color: '#3b82f6' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Department Management
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
            This feature is available on Major Corporate and Enterprise plans
          </p>
          <Link to="/pricing"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: '12px 24px', borderRadius: 10, background: '#3b82f6',
              color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
            Upgrade Plan
          </Link>
        </motion.div>
        <BottomNav />
      </div>
    );
  }

  if (loading) return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--blue)' }} /><BottomNav />
    </div>
  );

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 20px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 auto' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={20} style={{ color: '#3b82f6' }} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</h1>
            </div>
            <button onClick={() => { setEditingDept(null); setName(''); setShowForm(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: '#3b82f6', color: '#fff',
                fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-head)',
                maxWidth: '100%', whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: '0 2px 12px rgba(59,130,246,0.25)',
              }}>
              <Plus size={15} /> {l.create}
            </button>
          </div>

          {/* Create/Edit Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 16 }}>
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{editingDept ? 'Edit' : l.create}</p>
                    <button onClick={() => { setShowForm(false); setEditingDept(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input className="input" value={name} onChange={e => setName(e.target.value)}
                      placeholder={l.name_label} style={{ flex: 1 }} />
                    <button onClick={saveDept} disabled={saving} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Department List */}
          {departments.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Building2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{l.no_depts}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {departments.map(dept => {
                const deptMembers = (dept.memberIds || []).map(id => getMemberName(id));
                const isExpanded = expandedDept === dept.id;
                const isAssigning = assigningDept === dept.id;
                return (
                  <div key={dept.id} className="card" style={{ padding: '18px 20px', borderLeft: `4px solid ${dept.color || '#3b82f6'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedDept(isExpanded ? null : dept.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{dept.name}</p>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${dept.color || '#3b82f6'}18`, color: dept.color || '#3b82f6', fontWeight: 600 }}>
                            {deptMembers.length} {l.members_label.toLowerCase()}
                          </span>
                          <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setAssigningDept(isAssigning ? null : dept.id)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                          <UserPlus size={13} />
                        </button>
                        <button onClick={() => { setEditingDept(dept); setName(dept.name); setShowForm(true); }}
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => deleteDept(dept.id)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Member list */}
                    <AnimatePresence>
                      {isExpanded && deptMembers.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {deptMembers.map((name, i) => (
                              <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'var(--bg-card2)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Assign members panel */}
                    <AnimatePresence>
                      {isAssigning && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{l.assign}</p>
                          {activeMembers.length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l.no_members}</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {activeMembers.map(m => {
                                const assigned = (dept.memberIds || []).includes(m.memberId);
                                return (
                                  <button key={m.id} onClick={() => assignMember(dept.id, m.memberId)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: assigned ? 'rgba(34,197,94,0.08)' : 'var(--bg-card2)', border: `1px solid ${assigned ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, cursor: 'pointer', width: '100%' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: assigned ? 'rgba(34,197,94,0.15)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: assigned ? '#22c55e' : 'var(--text-muted)' }}>
                                      {(m.name || m.invitedEmail || '?')[0].toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: 13, color: assigned ? '#22c55e' : 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
                                      {m.name || m.invitedEmail}
                                    </span>
                                    {assigned && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>ASSIGNED</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
