const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

let CACHE_NAME = 'price-calculator-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch('./manifest.json')
      .then((response) => response.json())
      .then((manifest) => {
        CACHE_NAME = `price-calculator-v${manifest.version || '1'}`;
        return caches.open(CACHE_NAME);
      })
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    fetch('./manifest.json')
      .then((response) => response.json())
      .then((manifest) => {
        const newCacheName = `price-calculator-v${manifest.version || '1'}`;
        return caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((name) => name.startsWith('price-calculator-') && name !== newCacheName)
              .map((name) => caches.delete(name))
          );
        });
      })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
