// Service Worker for AquaBuddy PWA
const CACHE_NAME = 'aqua-buddy-cache-v20260807_FORCE_REFRESH_146';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css?v=20260807_FORCE_REFRESH_146',
  '/app.js?v=20260807_FORCE_REFRESH_146',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Only handle HTTP and HTTPS requests to prevent chrome-extension or other schemes from breaking cache.put
  if (!event.request.url.startsWith('http:') && !event.request.url.startsWith('https:')) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
