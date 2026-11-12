// Fleetza Service Worker for Installable PWA and Zero-Cost Web Push (VAPID)
const CACHE_NAME = 'fleetza-web-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never cache API calls or cross-origin requests
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first fallback so VPS updates apply immediately while staying resilient
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Fleetza Duty Dispatch',
    body: 'New update waiting in your Fleetza Supplier portal.',
    url: '/',
    tag: 'fleetza-duty-alert',
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 400],
    data: {}
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const targetUrl = payload.url || payload.data?.url || '/';

  const options = {
    body: payload.body,
    icon: payload.icon || '/pwa-icon-192.png',
    badge: payload.badge || '/pwa-icon-192.png',
    vibrate: Array.isArray(payload.vibrate) ? payload.vibrate : [300, 150, 300, 150, 400],
    tag: payload.tag || 'fleetza-duty-alert',
    renotify: true,
    requireInteraction: payload.requireInteraction !== false,
    data: {
      ...(payload.data || {}),
      url: targetUrl
    },
    actions: [
      { action: 'open', title: 'Open Fleetza' }
    ]
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || 'Fleetza Alert', options),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          try {
            client.postMessage({ type: 'SW_PUSH_RECEIVED', payload });
          } catch {}
        });
      })
    ])
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DUTY_ALERT') {
    const options = {
      body: event.data.body || 'New duty assigned to your vehicle! Tap to Accept or Decline.',
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      vibrate: [500, 200, 500, 200, 500],
      data: { url: '/supplier/dashboard' },
      requireInteraction: true,
      tag: 'fleetza-duty-alert',
      renotify: true,
      actions: [{ action: 'open', title: 'View Duty' }]
    };
    event.waitUntil(
      self.registration.showNotification(event.data.title || 'Urgent: Fleetza Duty Dispatch', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = event.notification?.data?.url || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            if (client.url !== targetUrl && 'navigate' in client) {
              await client.navigate(targetUrl);
            }
          } catch {}
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
