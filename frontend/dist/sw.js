/* TuneIt service worker — offline-first app shell caching.
 *
 * Installability note: this file MUST be served from the root scope ("/sw.js")
 * over HTTPS (or http://localhost) with a JavaScript content-type, otherwise
 * browsers refuse to register it and the app cannot be installed.
 */
const CACHE_NAME = 'tuneit-v4';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/tuneit-icon.svg',
  '/icons/tuneit-favicon-48.png',
  '/icons/tuneit-apple-180.png',
  '/icons/tuneit-192.png',
  '/icons/tuneit-512.png',
  '/icons/tuneit-maskable-512.png',
  '/icons/tuneit-maskable.svg',
];

// Backend API requests are never cached: music metadata / auth must stay live.
const API_PREFIXES = ['/auth', '/songs', '/albums', '/favorites', '/playlists', '/health'];

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|wasm|json)$/i.test(url.pathname)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // Adding entries individually keeps one bad URL from aborting the install.
      .then((cache) => Promise.all(APP_SHELL.map((path) => cache.add(path).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // audio blobs, fonts CDNs, etc.
  if (API_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) return;

  // SPA navigations: network first so deploys are picked up, cache as fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/')))
    );
    return;
  }

  if (!isStaticAsset(url)) return;

  // Hashed Expo bundles are immutable; everything else is stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
