// Service worker with network-first strategy for navigation and proper cache management
const CACHE_NAME = 'anime-token-v12-' + Date.now();
const STATIC_CACHE_URLS = [
  '/src/assets/hero-optimized.webp',
  '/images/og-anime.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting()) // Force activation of new service worker
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Clean up old caches
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first strategy for navigation requests (HTML pages)
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && 
       event.request.headers.get('accept').includes('text/html'))) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network succeeds, return fresh response
          return response;
        })
        .catch(() => {
          // If network fails, try cache as fallback
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  if (STATIC_CACHE_URLS.includes(url.pathname) || 
      url.pathname.includes('/assets/') || 
      url.pathname.includes('/images/')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
    return;
  }
  
  // Network-only for everything else (API calls, etc.)
  event.respondWith(fetch(event.request));
});