// Online-first installability: cache only public, same-origin static assets.
// Never intercept page navigation, Supabase, authentication, or admin requests.
const CACHE_NAME = 'kalam-static-2026-10-30-v1';
const STATIC_PATHS = new Set([
  '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png',
  '/kalam-logo-transparent.png', '/kalam-logo.jpeg'
]);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('kalam-static-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode === 'navigate') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !(url.pathname.startsWith('/assets/') || STATIC_PATHS.has(url.pathname))) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  })());
});
