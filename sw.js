// Service worker: cache-first zodat de app volledig offline werkt.
// Verhoog VERSION bij elke release: dat is het versienummer in de app, en zonder nieuwe versie blijven toestellen de oude bestanden gebruiken.
const VERSION = 19;
const CACHE_VERSION = `darts-v${VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './css/themes.css',
  './js/app.js',
  './js/db.js',
  './js/router.js',
  './js/cricket.js',
  './js/games.js',
  './js/stats.js',
  './js/themes.js',
  './js/update.js',
  './js/util.js',
  './js/views/home.js',
  './js/views/players.js',
  './js/views/newgame.js',
  './js/views/game.js',
  './js/views/history.js',
  './js/views/stats.js',
  './js/views/settings.js',
  './fonts/oswald.woff2',
  './fonts/caveat.woff2',
  './fonts/bebas-neue.woff2',
  './fonts/nunito.woff2',
  './fonts/press-start-2p.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

// Een nieuwe versie wacht tot de gebruiker op "Vernieuwen" tikt (zie js/update.js),
// zodat een draaiende app nooit half oude, half nieuwe bestanden gebruikt.
self.addEventListener('install', (event) => {
  // cache: 'reload' = altijd vers van de server; anders kan de browser bestanden uit zijn
  // eigen webcache nemen (GitHub Pages: 10 minuten) en komen er oude bestanden in de nieuwe versie.
  const requests = ASSETS.map((url) => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(requests)));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') event.ports[0]?.postMessage(VERSION);
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
