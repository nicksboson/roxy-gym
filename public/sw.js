// Self-destroying service worker to ensure stale caches are purged
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        for (const client of clients) {
          client.navigate(client.url);
        }
      })
  );
});

self.addEventListener('fetch', () => {
  // Let network handle all requests directly with zero interception
  return;
});
