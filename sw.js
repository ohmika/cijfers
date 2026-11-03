const CACHE = 'dubbele-cijfers-klok-v3';
const OLD_CACHES = ['double-numbers-v1', 'dubbele-cijfers-klok-v2'];
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => OLD_CACHES.includes(k) || (k.startsWith('dubbele-cijfers-klok-') && k !== CACHE))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Network first (so updates show up), fall back to our own cache when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.open(CACHE).then((c) =>
          c.match(event.request).then((hit) => hit || c.match('./index.html'))
        )
      )
  );
});
