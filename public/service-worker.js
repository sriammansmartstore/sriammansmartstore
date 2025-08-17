/* Simple service worker for asset/page caching */
const CACHE_VERSION = 'v1.0.0';
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // Activate immediately after installing
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('runtime-') && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Helper: cache-first for static assets, network-first for documents
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Strategy selection by destination
  const dest = req.destination;

  // Cache-first for scripts, styles, fonts, images, audio, video
  if (['script', 'style', 'font', 'image', 'audio', 'video'].includes(dest)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // For navigation/page requests (HTML), use network-first with cache fallback
  if (dest === 'document' || req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }

  // Default: try cache-first as well
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreVary: true, ignoreSearch: false });
  if (cached) return cached;
  try {
    const resp = await fetch(request);
    // Only cache successful, basic (opaque false) responses
    if (resp && resp.status === 200 && resp.type === 'basic') {
      cache.put(request, resp.clone());
    }
    return resp;
  } catch (e) {
    // On failure return whatever we have (likely null) so the page can decide
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const resp = await fetch(request);
    if (resp && resp.status === 200) {
      cache.put(request, resp.clone());
    }
    return resp;
  } catch (e) {
    const cached = await cache.match(request, { ignoreVary: true, ignoreSearch: false });
    if (cached) return cached;
    // Offline fallback to cached root (SPA shell) if available
    const fallback = await cache.match('/');
    return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
