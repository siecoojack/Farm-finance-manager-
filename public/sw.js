// Service Worker - Cache-busting and selective asset caching
const CACHE_NAME = 'farm-finance-v6';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // CRITICAL: DO NOT cache dev server scripts, Vite HMR, or JS modules
  if (
    url.pathname.startsWith('/@') || 
    url.pathname.includes('node_modules') || 
    url.pathname.startsWith('/src/') ||
    url.search.includes('t=') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx')
  ) {
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          // Only cache static images, icons, and fonts
          if (
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.ico') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.woff2') ||
            url.pathname === '/manifest.json'
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
