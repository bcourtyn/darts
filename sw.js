// Service worker: cache-first zodat de app volledig offline werkt.
// Verhoog CACHE_VERSION bij elke release, anders blijven toestellen de oude versie gebruiken.
const CACHE_VERSION = 'darts-v5';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
  './js/db.js',
  './js/router.js',
  './js/cricket.js',
  './js/games.js',
  './js/stats.js',
  './js/util.js',
  './js/views/home.js',
  './js/views/players.js',
  './js/views/newgame.js',
  './js/views/game.js',
  './js/views/history.js',
  './js/views/settings.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request))
  );
});
