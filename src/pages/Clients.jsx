import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Edit2, Phone, Mail, X, Save, Users2, MessageCircle, Link2, Copy, Check } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { usePlan } from '../hooks/usePlan';
import UpgradePrompt from '../components/UpgradePrompt';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';

function ClientSheet({ open, onClose, editing }) {
  const { addClient, updateClient } = useTeam();
  const [name,  setName]  = useState(editing?.name  || '');
  const [phone, setPhone] = useState(editing?.phone || '');
  const [email, setEmail] = useState(editing?.email || '');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Client name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateClient(editing.id, { name: name.trim(), phone, email, notes });
        toast.success('Client updated');
      } else {
        await addClient({ name: name.trim(), phone, email, notes });
        toast.success('Client added');
      }
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '85svh', overflowY: 'auto' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <form onSubmit={submit} className="px-6 pt-2 pb-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700 }}>
                  {editing ? 'Edit Client' : 'Add Client'}
                </h2>
                <button type="button" onClick={onClose} className="p-2 rounded-xl"
                  style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="John Kamau" autoFocus />
              </div>
              <div>
                <label className="label">Phone / WhatsApp</label>
                <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.co.ke" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="KRA PIN, case number, contract details..." />
              </div>

              <button type="submit" disabled={saving} className="btn btn-primary w-full btn-lg">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Client'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Clients() {
  const { clients, removeClient, loading, generatePortalToken } = useTeam();
  const { hasTeam, hasClientPortal } = usePlan();
  const [search,       setSearch]       = useState('');
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [portalTokens, setPortalTokens] = useState({}); // clientId → token
  const [copiedId,     setCopiedId]     = useState(null);

  const getPortalLink = async (c) => {
    try {
      let token = portalTokens[c.id];
      if (!token) {
        token = await generatePortalToken(c.id);
        setPortalTokens(prev => ({ ...prev, [c.id]: token }));
      }
      const link = `${window.location.origin}/portal?token=${token}`;
      await navigator.clipboard.writeText(link);
      setCopiedId(c.id);
      toast.success('Portal link copied!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      toast.error('Failed to generate portal link');
    }
  };

  // Feature gate removed for testing — all plans can access Clients

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const sendWhatsApp = (c) => {
    if (!c.phone) { toast.error('No phone number for this client'); return; }
    const msg = encodeURIComponent(`Hi ${c.name}, this is a message from ARIA.`);
    window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${msg}`);
  };

  const sendEmail = (c) => {
    if (!c.email) { toast.error('No email for this client'); return; }
    window.open(`mailto:${c.email}?subject=Message from ARIA`);
  };

  return (
    <div className="pb-nav" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '72px 20px 0' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>Clients</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => { setEditing(null); setSheetOpen(true); }} className="btn btn-primary btn-sm">
              <Plus size={15} /> Add Client
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." style={{ paddingLeft: 44 }} />
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => <div key={i} className="card" style={{ height: 80, opacity: 0.4 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Users2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 16 }}>
                {search ? 'No clients match your search' : 'No clients yet'}
              </p>
              {!search && (
                <button onClick={() => setSheetOpen(true)} className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add your first client
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((c, i) => (
                  <motion.div key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ delay: i * 0.04 }}
                    className="card" style={{ padding: '16px 16px 16px 20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--blue)' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Avatar */}
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(79,110,247,0.12)', border: '1.5px solid rgba(79,110,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--blue)' }}>
                          {c.name[0].toUpperCase()}
                        </span>
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{c.name}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {c.phone && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={10} /> {c.phone}
                            </span>
                          )}
                          {c.email && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Mail size={10} /> {c.email}
                            </span>
                          )}
                        </div>
                        {c.notes && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes}</p>
                        )}
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {hasClientPortal && (
                          <button onClick={() => getPortalLink(c)} title="Copy portal link"
                            style={{ width: 32, height: 32, borderRadius: 10, background: copiedId === c.id ? 'rgba(245,158,11,0.15)' : 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedId === c.id ? '#f59e0b' : 'var(--text-muted)' }}>
                            {copiedId === c.id ? <Check size={13} /> : <Link2 size={13} />}
                          </button>
                        )}
                        {c.phone && (
                          <button onClick={() => sendWhatsApp(c)} title="WhatsApp"
                            style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                            <MessageCircle size={13} />
                          </button>
                        )}
                        {c.email && (
                          <button onClick={() => sendEmail(c)} title="Email"
                            style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                            <Mail size={13} />
                          </button>
                        )}
                        <button onClick={() => { setEditing(c); setSheetOpen(true); }} title="Edit"
                          style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => { removeClient(c.id); toast.success('Client removed'); }} title="Delete"
                          style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-card2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          <div style={{ height: 24 }} />
        </motion.div>
      </div>

      <BottomNav />
      <ClientSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setEditing(null); }} editing={editing} />
    </div>
  );
}
