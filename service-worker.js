// v122: HTTP caching owns versioned assets; shared data has its own verified fallback.
// Retire only this application's obsolete CacheStorage. Never touch drafts/localStorage.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith('scm-sales-forecast-pwa-') || name.startsWith('sales-forecast-static-')).map(name => caches.delete(name)));
  await self.clients.claim();
})()));
// Deliberately no fetch handler: avoid duplicate asset/data copies and stale offline shells.
