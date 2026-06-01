/* FitKid Staff PWA · service worker (network-first para que las actualizaciones aparezcan) */
const CACHE = 'fitkid-staff-v2';
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
  // No tocar la API/acciones ni peticiones que no sean GET
  if (req.method !== 'GET' || req.url.indexOf('/webhook/') !== -1 || req.url.indexOf('api.notion.com') !== -1) {
    return;
  }
  // Network-first: siempre intenta la red (trae la versión más nueva); cae a caché solo sin conexión
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
