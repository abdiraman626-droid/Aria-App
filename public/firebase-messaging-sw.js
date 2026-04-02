// Firebase Cloud Messaging service worker
// Must be at the root so Firebase can register it as the push handler.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyCo1n3hmhXLhp4r2Ns8x5MWgr1e3QifDZE',
  authDomain:        'aria-assistant-4d118.firebaseapp.com',
  projectId:         'aria-assistant-4d118',
  storageBucket:     'aria-assistant-4d118.firebasestorage.app',
  messagingSenderId: '845531930861',
  appId:             '1:845531930861:web:8959079be030fd408f2ce4',
});

const messaging = firebase.messaging();

// Show push notifications when the app is in the background or closed
messaging.onBackgroundMessage((payload) => {
  const { title = 'ARIA Reminder', body = '' } = payload.notification || {};
  self.registration.showNotification(title, {
    body,
    icon:  '/favicon.svg',
    badge: '/favicon.svg',
    data:  payload.data || {},
    vibrate: [200, 100, 200],
  });
});

// Handle notification click — focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin) && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow('/dashboard');
    })
  );
});
