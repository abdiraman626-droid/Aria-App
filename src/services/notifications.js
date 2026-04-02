// Browser notification service for due reminders + email reminders via mailto
// Also handles FCM token registration for background push notifications.

import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc }      from 'firebase/firestore';
import { messagingPromise, db } from '../lib/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Call once after login — requests permission, registers the FCM service worker,
// and saves the FCM token to Firestore so the server can send targeted pushes.
export async function initPushNotifications(userId) {
  if (!userId || !VAPID_KEY) return;

  const messaging = await messagingPromise;
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return;

    await updateDoc(doc(db, 'users', userId), { fcmToken: token });

    // Handle messages when the app is open (foreground)
    onMessage(messaging, (payload) => {
      const { title = 'ARIA', body = '' } = payload.notification || {};
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg' });
      }
    });
  } catch {
    // Push is an enhancement — fail silently
  }
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('not-supported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  return Notification.requestPermission();
}

function showBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(`🔔 ${title}`, {
      body,
      icon: '/favicon.ico',
      tag: `aria-${title.slice(0, 32)}`,
      requireInteraction: false,
    });
  } catch {}
}

// Check reminders and fire browser notifications for those due soon
export function checkDueReminders(reminders) {
  const now = Date.now();
  reminders.forEach(r => {
    if (r.done) return;
    const dt  = new Date(r.dateTime).getTime();
    const diff = dt - now; // ms until due
    // Fire within a ±5-minute window of due time
    if (diff > -5 * 60000 && diff < 5 * 60000) {
      const key = `notified_${r.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        const timeMsg = diff < 0
          ? 'Due just now'
          : `Due in ${Math.round(diff / 60000)} min`;
        showBrowserNotification(
          r.title,
          timeMsg + (r.description ? ' · ' + r.description : '')
        );
      }
    }
  });
}

// Fire notifications for URGENT reminders — repeats every 30 min until done
export function checkUrgentReminders(reminders) {
  const now = Date.now();
  reminders.forEach(r => {
    if (r.done || !r.isUrgent) return;
    const dt   = new Date(r.dateTime).getTime();
    if (dt > now + 60 * 60000) return; // only within 1 hr of due time or past
    const key  = `urgent_${r.id}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (now - last >= 30 * 60000) { // 30 minutes
      sessionStorage.setItem(key, String(now));
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      try {
        new Notification(`🚨 URGENT: ${r.title}`, {
          body: (r.description || 'Requires immediate attention') + ' · Tap to open ARIA',
          icon: '/favicon.ico',
          tag: `urgent-${r.id}`,
          requireInteraction: true,
        });
      } catch {}
    }
  });
}

// Send email reminder by opening the user's default mail client (mailto)
export function sendEmailReminder(reminder, toEmail) {
  if (!toEmail) return false;
  const d       = new Date(reminder.dateTime);
  const dateStr = d.toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' });
  const subject = encodeURIComponent(`ARIA Reminder: ${reminder.title}`);
  const body    = encodeURIComponent(
    `Hi,\n\nThis is your ARIA reminder:\n\n📌 ${reminder.title}\n` +
    (reminder.description ? `\n${reminder.description}\n` : '') +
    `\n📅 ${dateStr} at ${timeStr}\n\n` +
    `Sent by ARIA — Your AI Reminder Assistant\nhttps://aria-app-one.vercel.app`
  );
  window.open(`mailto:${toEmail}?subject=${subject}&body=${body}`);
  return true;
}
