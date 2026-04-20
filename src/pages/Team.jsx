import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Copy, Check, Trash2, Mail, Clock, Bell, UserCheck, UserX, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { usePlan } from '../hooks/usePlan';
import UpgradePrompt from '../components/UpgradePrompt';
import BottomNav from '../components/BottomNav';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  active:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  label: 'Active'  },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending' },
};

const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

export default function Team() {
  const { user } = useAuth();
  const { members, clients, loading, activeCount, teamLimit, inviteMember, removeMember, refresh } = useTeam();
  const { hasTeam, isEnterprise } = usePlan();

  const [inviteEmail,    setInviteEmail]    = useState('');
  const [inviting,       setInviting]       = useState(false);
  const [copiedToken,    setCopiedToken]    = useState(null);
  const [teamReminders,  setTeamReminders]  = useState([]);
  const [trLoading,      setTrLoading]      = useState(false);
  const [selectedMember, setSelectedMember] = useState('all');

  // Fetch reminders assigned to active team members
  useEffect(() => {
    if (!hasTeam || !members.length) return;
    const memberIds = members.filter(m => m.status === 'active' && m.memberId).map(m => m.memberId);
    if (!memberIds.length) return;

    setTrLoading(true);
    // Firestore 'in' supports up to 30 items; slice for safety
    getDocs(query(
      collection(db, 'reminders'),
      where('assignedTo', 'in', memberIds.slice(0, 30)),
      where('done', '==', false)
    )).then(snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
      setTeamReminders(data);
      setTrLoading(false);
    });
  }, [members, hasTeam]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember(inviteEmail.trim());
      toast.success(`Invite created for ${inviteEmail}`);
      setInviteEmail('');
      // Refresh to get the new token
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/join?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Invite link copied!');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const shareViaWhatsApp = (token, email) => {
    const link = `${window.location.origin}/join?token=${token}`;
    const msg  = encodeURIComponent(`Hi! I'd like you to join my team on ARIA — your AI assistant for reminders.\n\nClick this link to create your account:\n${link}`);
    window.open(`https://wa.me/?text=${msg}`);
  };

  const handleRemove = async (id, email) => {
    if (!confirm(`Remove ${email} from your team?`)) return;
    await removeMember(id);
    toast.success('Member removed');
  };

  const generateWeeklySummary = () => {
    const now     = new Date();
    const weekAgo = new Date(now - 7 * 86400000);
    const subject = encodeURIComponent(`ARIA Weekly Summary — ${format(now, 'MMM d, yyyy')}`);
    const activeMembers = members.filter(m => m.status === 'active');
    let body = `ARIA Weekly Team Summary\n${format(now, 'EEEE, MMMM d, yyyy')}\n\n`;
    body += `Team: ${user.name}'s Team\n`;
    body += `Active Members: ${activeMembers.length}\n`;
    body += `Clients: ${clients.length}\n\n`;
    body += `Upcoming Team Reminders:\n`;
    teamReminders.slice(0, 10).forEach((r, i) => {
      body += `${i + 1}. ${r.title} — ${format(new Date(r.date_time || r.dateTime), 'EEE MMM d, h:mm a')}\n`;
    });
    body += `\n\nSent by ARIA — Your AI Reminder Assistant`;
    window.open(`mailto:${user.email}?subject=${subject}&body=${encodeURIComponent(body)}`);
  };

  // Feature gate removed for testing — all plans can access Team

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '72px 20px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>Team</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
                {activeCount} member{activeCount !== 1 ? 's' : ''} · {clients.length} client{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={generateWeeklySummary} className="btn btn-ghost btn-sm">
              <Mail size={13} /> Weekly Summary
            </button>
          </div>

          {/* ── Invite Section ─────────────────────────────── */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={15} color="#8B5CF6" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>Invite Team Member</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {`${activeCount} member${activeCount !== 1 ? 's' : ''} · Unlimited invites`}
                </p>
              </div>
            </div>

            <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.co.ke"
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={inviting || !inviteEmail.trim()} className="btn btn-primary btn-sm">
                {inviting ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={14} />}
                Invite
              </button>
            </form>

            {/* How it works */}
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card2)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              After inviting, copy the invite link below and share it with your team member via WhatsApp or email. They click the link, create an account, and automatically join your team.
            </div>
          </div>

          {/* ── Members List ────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Members ({members.length})
            </p>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2].map(i => <div key={i} className="card" style={{ height: 68, opacity: 0.4 }} />)}
              </div>
            ) : members.length === 0 ? (
              <div className="card" style={{ padding: '28px 24px', textAlign: 'center' }}>
                <Users size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No members yet. Invite someone above.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(m => {
                  const ss = STATUS_STYLE[m.status] || STATUS_STYLE.pending;
                  const copied = copiedToken === m.token;
                  return (
                    <motion.div key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="card" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Avatar */}
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${ss.color}18`, border: `1.5px solid ${ss.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {m.status === 'active'
                            ? <UserCheck size={16} color={ss.color} />
                            : <Mail size={14} color={ss.color} />
                          }
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.name || m.invited_email}
                          </p>
                          {m.name && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.invited_email}</p>}
                          <span style={{ display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: ss.bg, color: ss.color }}>
                            {ss.label}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {m.status === 'pending' && (
                            <>
                              <button onClick={() => copyInviteLink(m.token)} title="Copy invite link"
                                style={{ width: 32, height: 32, borderRadius: 10, background: copied ? 'rgba(34,197,94,0.15)' : 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#22c55e' : 'var(--text-muted)' }}>
                                {copied ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                              <button onClick={() => shareViaWhatsApp(m.token, m.invited_email)} title="Share via WhatsApp"
                                style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              </button>
                            </>
                          )}
                          <button onClick={() => handleRemove(m.id, m.invited_email)} title="Remove"
                            style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Team Dashboard ──────────────────────────────── */}
          {activeCount > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Team Reminders
                </p>
                {trLoading && <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
              </div>

              {/* Filter by member */}
              <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14 }}>
                <button onClick={() => setSelectedMember('all')}
                  style={{ padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', background: selectedMember === 'all' ? 'var(--blue)' : 'var(--bg-card)', color: selectedMember === 'all' ? '#fff' : 'var(--text-muted)' }}>
                  All Members
                </button>
                {members.filter(m => m.status === 'active').map(m => (
                  <button key={m.id} onClick={() => setSelectedMember(m.member_id)}
                    style={{ padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', background: selectedMember === m.member_id ? 'var(--blue)' : 'var(--bg-card)', color: selectedMember === m.member_id ? '#fff' : 'var(--text-muted)' }}>
                    {m.name || m.invited_email.split('@')[0]}
                  </button>
                ))}
              </div>

              {teamReminders.length === 0 ? (
                <div className="card" style={{ padding: '28px 24px', textAlign: 'center' }}>
                  <Bell size={26} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No reminders assigned to team members yet</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Use "Assign To" when creating reminders</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {teamReminders
                    .filter(r => selectedMember === 'all' || r.assigned_to === selectedMember)
                    .map((r, i) => {
                      const member = members.find(m => m.member_id === r.assigned_to);
                      const d = new Date(r.date_time || r.dateTime);
                      const pc = PRIORITY_COLOR[r.priority] || PRIORITY_COLOR.medium;
                      return (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className="card" style={{ padding: '14px 16px 14px 20px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: pc }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                              <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                <Clock size={10} /> {format(d, 'EEE, MMM d · h:mm a')}
                              </p>
                            </div>
                            {member && (
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', flexShrink: 0 }}>
                                {member.name || member.invited_email.split('@')[0]}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
