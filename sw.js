/* sw.js - the phone keeps every game file it has loaded, like an installed mobile game (owner Nov 18 2026
   "make all games less laggy, it should pull start page and model right away ... like a true mobile game").
   - Big files (3D models, pictures, sounds, three.js) come from the phone's own copy at once; the copy is checked
     against the site in the background and swapped when the file changed (stale-while-revalidate).
   - Game pages, scripts and data files always ask the site first (a merge shows up at once) and fall back to the
     saved copy only when the site does not answer (no signal = the game still opens).
   - The hub can ask it to fetch preload.json's files in the background ("warm"), one at a time, so the first open is
     fast too.
   Nothing here touches game code. Delete this file + its registration in sports.html to turn it off. */
const CACHE = 'apex-files-v1';
const BIG = /\.(glb|gltf|bin|png|jpe?g|webp|ktx2|hdr|exr|mp3|ogg|wav|m4a|aac|woff2?|ttf)$/i;
const SLOW_CODE = /(^|\/)(three\.module\.min\.js|vendor\/[^/]+\.js|three\/addons\/.+\.js)$/i;   /* big library files that rarely change */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('apex-files-')) await caches.delete(k);
  await self.clients.claim();
})()));

function plain(url) { const u = new URL(url); u.search = ''; u.hash = ''; return u.href; }

async function fromCacheThenRefresh(req, event) {
  const c = await caches.open(CACHE), key = plain(req.url);
  const hit = await c.match(key);
  const net = fetch(req).then(r => { if (r && r.status === 200 && r.type === 'basic') c.put(key, r.clone()); return r; }).catch(() => null);
  if (hit) { event.waitUntil(net); return hit; }
  return (await net) || Response.error();
}

async function siteFirst(req, store) {
  const c = await caches.open(CACHE), key = plain(req.url);
  try {
    const r = await fetch(req);
    if (store && r && r.status === 200 && r.type === 'basic') c.put(key, r.clone());
    return r;
  } catch (e) {
    const hit = await c.match(key);
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return;                              /* sound/video streams ask for pieces - leave those to the browser */
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/[?&](fresh|nocache)=/.test(url.search)) return;              /* the hub's own "is there a newer copy" asks go straight to the site */
  const path = url.pathname;
  if (BIG.test(path) || SLOW_CODE.test(path)) { event.respondWith(fromCacheThenRefresh(req, event)); return; }
  /* pages, game code, json: the site first (merges show at once), the saved copy when there is no signal */
  event.respondWith(siteFirst(req, /\.(html?|js|mjs|json|css)$/i.test(path) || req.mode === 'navigate'));
});

/* warm: the hub sends {warm: [paths]} - fetch the ones not saved yet, one at a time, so the game's first open is fast too */
let warming = false;
self.addEventListener('message', e => {
  const d = e.data || {};
  if (!Array.isArray(d.warm) || warming) return;
  warming = true;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE); let got = 0;
    for (const p of d.warm.slice(0, 400)) {
      try {
        const href = new URL(p, self.registration.scope).href;
        if (await c.match(href)) continue;
        const r = await fetch(href);
        if (r.status === 200) { await c.put(href, r); got++; }
      } catch (_) {}
    }
    warming = false;
    for (const cl of await self.clients.matchAll()) cl.postMessage({ warmed: got });
  })());
});
