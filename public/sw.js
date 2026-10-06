const CACHE_NAME = 'farm-offline-v10';

// Core assets required for app shell precaching
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

// Install: Cache core assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Precache partial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older versions and take control of all clients immediately
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

// Fetch: Bulletproof Offline Handling
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore WebSockets, dev socket protocols
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // 1. Navigation Requests (Opening app from home screen or refreshing while offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // Try network first; if online, update the cached /index.html
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', clone);
              cache.put('/', clone.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // OFFLINE: Return cached /index.html or /
          const cached = await caches.match('/index.html') || await caches.match('/');
          if (cached) return cached;

          // If somehow not found in cache, search all keys in current cache for an HTML file
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          for (const key of keys) {
            if (key.url.endsWith('.html') || key.url.endsWith('/')) {
              const res = await cache.match(key);
              if (res) return res;
            }
          }

          return new Response(
            `<!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>وضع عدم الاتصال - تطبيق المزرعة</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 40px 20px; background: #064e3b; color: white; }
                h1 { font-size: 20px; margin-bottom: 12px; }
                p { font-size: 14px; opacity: 0.9; line-height: 1.6; }
                button { background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; margin-top: 20px; cursor: pointer; }
              </style>
            </head>
            <body>
              <h1>تطبيق الإدارة المالية للمزرعة</h1>
              <p>أنت الآن في وضع عدم الاتصال بالإنترنت.</p>
              <button onclick="window.location.reload()">إعادة المحاولة</button>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. Static Resources (JS bundles, CSS files, images, icons, fonts)
  // Stale-While-Revalidate: Return from cache immediately if available, update in background if online!
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Background network fetch to keep cache fresh when online
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline, network failed - return cached response if we had one
          return cachedResponse || new Response('', { status: 408, statusText: 'Offline' });
        });

      // If we have a cached version, RETURN IT IMMEDIATELY (instant load, 0ms latency)!
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache yet, wait for the network fetch
      return fetchPromise;
    })
  );
});
