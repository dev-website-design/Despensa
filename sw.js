// sw.js - Service Worker para FINDORA

const CACHE_NAME = 'findora-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/perfil.html',
  '/categorias.html',
  '/configuracion.html',
  '/assets/styles.css',
  '/app.js',
  '/Kiltier-Regular.otf',
  '/Kiltier-Regular.ttf',
  '/Kiltier-Regular.woff2'
];

// Instalación: cachear recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: eliminar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: stale-while-revalidate
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Actualizar cache con la respuesta de red
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Si falla la red y no hay cache, mostrar página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
        return cachedResponse || fetchPromise;
      })
  );
});