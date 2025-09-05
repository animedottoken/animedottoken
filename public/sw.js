// Simple service worker for caching static assets  
const CACHE_NAME = 'anime-token-v4-banner-fix-' + Date.now();
const urlsToCache = [
  '/',
  '/src/index.css',
  '/src/assets/hero-optimized.webp',
  '/images/og-anime.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});