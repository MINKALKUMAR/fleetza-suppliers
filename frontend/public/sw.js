// Fleetza Service Worker for Background Duty Notifications and PWA installation
const CACHE_NAME = 'fleetza-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '🚨 Urgent Duty Dispatch!', body: 'New duty assigned to your vehicle.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: '🚨 Urgent Duty Dispatch!', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-icon.svg',
    badge: '/pwa-icon.svg',
    vibrate: [300, 150, 300, 150, 500],
    data: { url: '/' },
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open Fleetza Portal' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DUTY_ALERT') {
    const options = {
      body: event.data.body || 'New duty assigned to your vehicle! Click to Accept or Decline.',
      icon: '/pwa-icon.svg',
      badge: '/pwa-icon.svg',
      vibrate: [500, 200, 500, 200, 500],
      data: { url: '/supplier/dashboard' },
      requireInteraction: true,
      tag: 'fleetza-duty-alert',
      renotify: true
    };
    event.waitUntil(
      self.registration.showNotification(event.data.title || '🚨 URGENT: FLEETZA DUTY DISPATCH!', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
