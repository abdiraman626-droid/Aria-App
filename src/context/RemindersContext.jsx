import { createContext, useContext, useState, useEffect } from 'react';
import { isToday } from 'date-fns';
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const RemindersContext = createContext(null);

// Firestore doc → app object
function toApp(snap) {
  const r = snap.data ? { id: snap.id, ...snap.data() } : snap;
  return {
    id:                  r.id,
    userId:              r.userId,
    title:               r.title,
    description:         r.description         || '',
    dateTime:            r.dateTime,
    channel:             r.channel             || 'notification',
    priority:            r.priority            || 'medium',
    done:                r.done                || false,
    assignedTo:          r.assignedTo          || null,
    clientId:            r.clientId            || null,
    recurrence:          r.recurrence          || null,
    recurrenceEnd:       r.recurrenceEnd        || null,
    isUrgent:            r.isUrgent            || false,
    mpesaAmount:         r.mpesaAmount         || null,
    mpesaTill:           r.mpesaTill           || null,
    paymentConfirmed:    r.paymentConfirmed     || false,
    paymentConfirmedAt:  r.paymentConfirmedAt   || null,
    createdAt:           r.createdAt?.toDate?.()?.toISOString() || r.createdAt || null,
  };
}

function addInterval(dateISO, recurrence) {
  const d = new Date(dateISO);
  switch (recurrence) {
    case 'daily':   d.setDate(d.getDate() + 1);    break;
    case 'weekly':  d.setDate(d.getDate() + 7);    break;
    case 'monthly': d.setMonth(d.getMonth() + 1);  break;
  }
  return d;
}

export function RemindersProvider({ children }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading,   setLoading]   = useState(false);

  // ── Fetch from Firestore on login ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setReminders([]); return; }

    setLoading(true);
    const col = collection(db, 'reminders');

    // Fetch own + assigned-to in parallel
    Promise.all([
      getDocs(query(col, where('userId',     '==', user.id))),
      getDocs(query(col, where('assignedTo', '==', user.id))),
    ]).then(([ownSnap, assignedSnap]) => {
      const seen = new Set();
      const all  = [];
      [...ownSnap.docs, ...assignedSnap.docs].forEach(d => {
        if (!seen.has(d.id)) { seen.add(d.id); all.push(toApp(d)); }
      });
      all.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
      setReminders(all);
      setLoading(false);
    });
  }, [user?.id]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const add = async (reminder) => {
    if (!user) return;
    const data = {
      userId:              user.id,
      title:               reminder.title,
      description:         reminder.description         || null,
      dateTime:            reminder.dateTime,
      channel:             reminder.channel             || 'notification',
      priority:            reminder.priority            || 'medium',
      done:                false,
      assignedTo:          reminder.assignedTo          || null,
      clientId:            reminder.clientId            || null,
      recurrence:          reminder.recurrence          || null,
      recurrenceEnd:       reminder.recurrenceEnd        || null,
      isUrgent:            reminder.isUrgent            || false,
      mpesaAmount:         reminder.mpesaAmount         || null,
      mpesaTill:           reminder.mpesaTill           || null,
      paymentConfirmed:    false,
      paymentConfirmedAt:  null,
      createdAt:           serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'reminders'), data);
    const newReminder = toApp({ id: ref.id, ...data, createdAt: new Date().toISOString() });
    setReminders(prev =>
      [...prev, newReminder].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
    );
  };

  const update = async (id, updates) => {
    const dbUpdates = {};
    if (updates.title             !== undefined) dbUpdates.title             = updates.title;
    if (updates.description       !== undefined) dbUpdates.description       = updates.description;
    if (updates.dateTime          !== undefined) dbUpdates.dateTime          = updates.dateTime;
    if (updates.channel           !== undefined) dbUpdates.channel           = updates.channel;
    if (updates.priority          !== undefined) dbUpdates.priority          = updates.priority;
    if (updates.done              !== undefined) dbUpdates.done              = updates.done;
    if (updates.assignedTo        !== undefined) dbUpdates.assignedTo        = updates.assignedTo;
    if (updates.clientId          !== undefined) dbUpdates.clientId          = updates.clientId;
    if (updates.recurrence        !== undefined) dbUpdates.recurrence        = updates.recurrence;
    if (updates.recurrenceEnd     !== undefined) dbUpdates.recurrenceEnd     = updates.recurrenceEnd;
    if (updates.isUrgent          !== undefined) dbUpdates.isUrgent          = updates.isUrgent;
    if (updates.mpesaAmount       !== undefined) dbUpdates.mpesaAmount       = updates.mpesaAmount;
    if (updates.mpesaTill         !== undefined) dbUpdates.mpesaTill         = updates.mpesaTill;
    if (updates.paymentConfirmed  !== undefined) dbUpdates.paymentConfirmed  = updates.paymentConfirmed;
    if (updates.paymentConfirmedAt !== undefined) dbUpdates.paymentConfirmedAt = updates.paymentConfirmedAt;

    await updateDoc(doc(db, 'reminders', id), dbUpdates);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, 'reminders', id));
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const toggle = async (id) => {
    const r = reminders.find(r => r.id === id);
    if (!r) return;
    await update(id, { done: !r.done });

    if (!r.done && r.recurrence) {
      const nextDt  = addInterval(r.dateTime, r.recurrence);
      const pastEnd = r.recurrenceEnd && nextDt > new Date(r.recurrenceEnd);
      if (!pastEnd) {
        await add({
          title:         r.title,
          description:   r.description,
          dateTime:      nextDt.toISOString(),
          channel:       r.channel,
          priority:      r.priority,
          recurrence:    r.recurrence,
          recurrenceEnd: r.recurrenceEnd,
          assignedTo:    r.assignedTo,
          clientId:      r.clientId,
        });
      }
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const now            = new Date();
  const upcoming       = reminders.filter(r => !r.done && new Date(r.dateTime) > now);
  const todayReminders = reminders.filter(r => !r.done && isToday(new Date(r.dateTime)));

  return (
    <RemindersContext.Provider value={{
      reminders, loading,
      add, update, remove, toggle,
      upcoming, todayReminders,
    }}>
      {children}
    </RemindersContext.Provider>
  );
}

export const useReminders = () => {
  const c = useContext(RemindersContext);
  if (!c) throw new Error('useReminders outside RemindersProvider');
  return c;
};
