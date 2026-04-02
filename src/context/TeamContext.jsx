import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const { user } = useAuth();
  const [members,  setMembers]  = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  const isTeamPlan = user?.plan === 'business' || user?.plan === 'premium';

  useEffect(() => {
    if (!user?.id || !isTeamPlan) { setMembers([]); setClients([]); return; }
    setLoading(true);
    Promise.all([
      getDocs(query(collection(db, 'team_members'), where('ownerId', '==', user.id))),
      getDocs(query(collection(db, 'clients'),      where('ownerId', '==', user.id))),
    ]).then(([mSnap, cSnap]) => {
      setMembers(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const cl = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      cl.sort((a, b) => a.name.localeCompare(b.name));
      setClients(cl);
      setLoading(false);
    });
  }, [user?.id, user?.plan]);

  const refresh = async () => {
    if (!user?.id || !isTeamPlan) return;
    const [mSnap, cSnap] = await Promise.all([
      getDocs(query(collection(db, 'team_members'), where('ownerId', '==', user.id))),
      getDocs(query(collection(db, 'clients'),      where('ownerId', '==', user.id))),
    ]);
    setMembers(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const cl = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    cl.sort((a, b) => a.name.localeCompare(b.name));
    setClients(cl);
  };

  // ── Team members ────────────────────────────────────────────────────────────

  const activeCount = members.filter(m => m.status === 'active').length;
  const teamLimit   = user?.plan === 'premium' ? Infinity : 5;

  const inviteMember = async (email) => {
    if (teamLimit !== Infinity && activeCount >= teamLimit)
      throw new Error(`Maximum ${teamLimit} team members reached`);
    if (members.find(m => m.invitedEmail?.toLowerCase() === email.toLowerCase()))
      throw new Error('This email has already been invited');

    const token = crypto.randomUUID();
    const ref = await addDoc(collection(db, 'team_members'), {
      ownerId:      user.id,
      ownerName:    user.name,
      invitedEmail: email.toLowerCase(),
      memberId:     null,
      name:         null,
      status:       'pending',
      inviteToken:  token,
      createdAt:    serverTimestamp(),
    });
    const newMember = { id: ref.id, ownerId: user.id, invitedEmail: email.toLowerCase(), status: 'pending', inviteToken: token };
    setMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const removeMember = async (id) => {
    await deleteDoc(doc(db, 'team_members', id));
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // ── Clients ──────────────────────────────────────────────────────────────────

  const addClient = async ({ name, phone = '', email = '', notes = '' }) => {
    const ref = await addDoc(collection(db, 'clients'), {
      ownerId: user.id, name, phone, email, notes,
      createdAt: serverTimestamp(),
    });
    const newClient = { id: ref.id, ownerId: user.id, name, phone, email, notes };
    setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
    return newClient;
  };

  const updateClient = async (id, updates) => {
    await updateDoc(doc(db, 'clients', id), updates);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeClient = async (id) => {
    await deleteDoc(doc(db, 'clients', id));
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // ── Client Portal Tokens ───────────────────────────────────────────────────

  const generatePortalToken = async (clientId) => {
    // Return existing token if one exists
    const existing = await getDocs(
      query(collection(db, 'client_portal_tokens'), where('clientId', '==', clientId))
    );
    if (!existing.empty) return existing.docs[0].data().token;

    const token = crypto.randomUUID();
    await addDoc(collection(db, 'client_portal_tokens'), {
      clientId, ownerId: user.id, token, createdAt: serverTimestamp(),
    });
    return token;
  };

  return (
    <TeamContext.Provider value={{
      members, clients, loading, activeCount, teamLimit, refresh,
      inviteMember, removeMember,
      addClient, updateClient, removeClient,
      generatePortalToken,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => {
  const c = useContext(TeamContext);
  if (!c) throw new Error('useTeam outside TeamProvider');
  return c;
};
