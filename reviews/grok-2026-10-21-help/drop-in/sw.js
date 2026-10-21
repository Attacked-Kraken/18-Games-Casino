/* Apex Sports service worker (JOB-03): the 6 sports games install to the home screen and play offline.
   - Pages (the games): network first, so the owner always gets the newest build when online; cached copy when offline.
   - Everything else (three.js, models, sounds, textures): served from the cache at once, refreshed in the background.
   - The first visit caches the launcher + 6 games + three.js; each game's models/sounds are cached the first time it is played.
   Bump VERSION to throw away the old cache. */
const VERSION = 'apex-sports-v1';
const CORE = ['apex-sports.html', 'sports.webmanifest', 'icons/apex-sports-180.png', 'icons/apex-sports-192.png', 'icons/apex-sports-512.png', 'three.module.min.js',
  'apexbaseball.html', 'apexhockey.html', 'apexflight.html', 'apextrackfield.html', 'apexf1.html', 'apexracer.html'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('apex-sports-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { // the launcher's "Save for offline" button sends a list of files to cache now
  if (e.data && e.data.cache) e.waitUntil(caches.open(VERSION).then((c) => Promise.all(e.data.cache.map((u) => c.add(u).catch(() => {})))));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;           // never touch other sites
  if (req.headers.get('range')) return;                                           // let audio/video seeking go straight through
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('apex-sports.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok && r.type === 'basic') { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
