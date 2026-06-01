/* FitKid Staff PWA · service worker (app shell cache) */
const CACHE = 'fitkid-staff-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Nunca cachear llamadas a la API/acciones (POST o al webhook de n8n)
  if (req.method !== 'GET' || req.url.indexOf('/webhook/') !== -1 || req.url.indexOf('api.notion.com') !== -1) {
    return; // deja pasar a la red normal
  }
  // App shell: cache-first con respaldo de red
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
