import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setEvents([]); setLoading(false); return; }

    const q = query(
      collection(db, 'calendar_events'),
      where('userId', '==', user.id),
      orderBy('dateTime', 'asc'),
    );

    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [user?.id]);

  const addEvent = async (event) => {
    if (!user) return;
    await addDoc(collection(db, 'calendar_events'), {
      ...event,
      userId: user.id,
      createdAt: serverTimestamp(),
    });
  };

  const updateEvent = async (id, updates) => {
    await updateDoc(doc(db, 'calendar_events', id), updates);
  };

  const removeEvent = async (id) => {
    await deleteDoc(doc(db, 'calendar_events', id));
  };

  // Upcoming events (future only)
  const upcoming = events.filter(e => new Date(e.dateTime) > new Date());

  return (
    <CalendarContext.Provider value={{ events, upcoming, loading, addEvent, updateEvent, removeEvent }}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendar = () => {
  const c = useContext(CalendarContext);
  if (!c) throw new Error('useCalendar outside CalendarProvider');
  return c;
};
