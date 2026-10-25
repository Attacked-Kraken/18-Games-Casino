// Apex game checker - plays every Game Development title like a phone and writes a picture report.
// Run:  node tools/game-check/check.mjs http://127.0.0.1:8811/ game-check-out
// Needs: playwright (chromium). No other packages.
//
// For each game it: opens it sideways (landscape phone), photographs the opening screen, presses the
// game's start buttons (games.json), photographs gameplay twice a moment apart, then opens it upright.
// FAIL  = black/blank screen, page didn't load, missing files, casino words, a "rotate your device" sign
// CHECK = menu runs off the screen, never got into gameplay, gameplay frozen, script errors
// STUDIO  = STUDIO-STANDARD.md checks: sports games must draw real rigged 3D bodies (no blob/box people), no outside
//            internet, no real brands/leagues/players, "Player nickname" not "Your name"; heavy scenes get a CHECK.
// STRICT=1 (pull requests): exits 1 if the PR adds a FAIL that main doesn't already have (BASELINE=main's results.json).
// FIX LIST = the owner's own complaints, each turned into a test in fixes/<game>.mjs (see fixes/README.md).
//            A fix that isn't done yet is a FAIL. Fix tests are never deleted, so a fixed thing can't quietly break again.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { realityCheck, playerScreenBox, playerCloseUp } from './reality.mjs';
import { mobileCheck } from './mobile.mjs';

// a play test written without `ask:` (e.g. only `title:` or just an id) must still print a real name, never "undefined"
const askOf = (fx) => String((fx && (fx.ask || fx.title || fx.name || fx.id)) || 'unnamed test');
const base = process.argv[2] || 'http://127.0.0.1:8811/';
const out = process.argv[3] || 'game-check-out';
const here = path.dirname(new URL(import.meta.url).pathname);
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'games.json'), 'utf8'));
fs.mkdirSync(path.join(out, 'img'), { recursive: true });

// any apex*.html on the Game Development page that games.json doesn't list yet still gets checked
let games = cfg.games.slice();
try {
  const hub = fs.readFileSync('sports.html', 'utf8');
  for (const m of hub.matchAll(/href="(apex[a-z0-9]*\.html)"/g)) {
    if (!games.find(g => g.file === m[1])) games.push({ file: m[1], name: m[1], start: [] });
  }
} catch (e) {}
// owner's law (2026-10-16): EVERY game in development must be playable on the Game Development page (sports.html)
for (const f of fs.readdirSync('.').filter(f => /^apex[a-z0-9]*\.html$/.test(f))) {
  const hubText = (() => { try { return fs.readFileSync('sports.html', 'utf8'); } catch (e) { return ''; } })();
  if (!hubText.includes('href="' + f + '"')) {
    const g = games.find(g => g.file === f) || (games.push({ file: f, name: f, start: [] }), games[games.length - 1]);
    g.notOnHub = true;
  }
}
if (process.env.ONLY) games = games.filter(g => process.env.ONLY.split(',').includes(g.file));

const CASINO = /\b(casino|gambl\w*|jackpot|slot machine|slots|roulette|blackjack|poker|wager\w*|cash out|payouts?)\b/i;
// real brands, leagues, teams, players and licensed characters (owner's law: our own names only). Whole words only.
const BRANDS = /\b(NHL|NBA|NFL|MLB|MLS|WNBA|FIFA|UEFA|NASCAR|IndyCar|Monster Jam|Hot Wheels|Nike|Adidas|Puma|Reebok|Under Armour|Bauer|CCM|Wilson|Rawlings|Spalding|Ferrari|Lamborghini|Porsche|McLaren|Bugatti|Bentley|Maserati|Red Bull|Gatorade|Coca[- ]Cola|Pepsi|ESPN|Marvel|Disney|Pok[eé]mon|Nintendo|Super Mario|Fortnite|Minecraft|Roblox|Maple Leafs|Canadiens|Bruins|Blackhawks|Yankees|Dodgers|Lakers|Celtics|Real Madrid|Manchester United|Gretzky|Ovechkin|McDavid|LeBron|Messi|Ronaldo|Mbapp[eé]|Usain Bolt|Hamilton|Verstappen)\b/;
// injected into every game page: counts skinned (rigged) shaders and draw calls per frame - works with any three.js build
const STUDIO_PROBE = () => {
  const S = window.__studio = { skinned: 0, draws: 0, frames: 0, sum: 0, max: 0, t: -1 };
  // owner Oct 21 2026 (close-up of the player): every THREE camera a game makes is remembered here, so the robot can take
  // the close-up without the game exposing its camera (three.js sets this.isCamera = true in the Camera constructor)
  try {
    window.__cams = [];
    Object.defineProperty(Object.prototype, 'isCamera', { configurable: true, set(v) {
      Object.defineProperty(this, 'isCamera', { value: v, writable: true, enumerable: true, configurable: true });
      try { if (v && window.__cams.length < 40) window.__cams.push(this); } catch (e) {}
    } });
    window.__renderers = [];
    Object.defineProperty(Object.prototype, 'isWebGLRenderer', { configurable: true, set(v) {
      Object.defineProperty(this, 'isWebGLRenderer', { value: v, writable: true, enumerable: true, configurable: true });
      try { if (v && window.__renderers.length < 8) window.__renderers.push(this); } catch (e) {}
    } });
  } catch (e) {}
  const patch = (P) => { if (!P) return; const ss = P.shaderSource;
    P.shaderSource = function (sh, src) { if (/#define USE_SKINNING/.test(src)) S.skinned++; return ss.call(this, sh, src); };
    for (const k of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) { const f = P[k]; if (f) P[k] = function (...a) { S.draws++; return f.apply(this, a); }; } };
  patch(window.WebGLRenderingContext && WebGLRenderingContext.prototype); patch(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { if (t !== S.t) { if (S.draws) { S.frames++; S.sum += S.draws; S.max = Math.max(S.max, S.draws); } S.draws = 0; S.t = t; } cb(t); });
};
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
         '--autoplay-policy=no-user-gesture-required'],
});

// a plain page used only to measure screenshots (how dark, how much detail, what changed)
const lab = await browser.newPage();
async function measure(jpg) {
  return lab.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = 96; c.height = 54;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, 96, 54);
    const d = x.getImageData(0, 0, 96, 54).data; const lum = [];
    for (let i = 0; i < d.length; i += 4) lum.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    const mean = lum.reduce((a, v) => a + v, 0) / lum.length;
    const std = Math.sqrt(lum.reduce((a, v) => a + (v - mean) ** 2, 0) / lum.length);
    const dark = lum.filter(v => v < 18).length / lum.length;
    return { mean, std, dark, lum };
  }, jpg.toString('base64'));
}
const changed = (a, b) => a.lum.filter((v, i) => Math.abs(v - b.lum[i]) > 12).length / a.lum.length;


// ---------- IDLE RUN (owner Oct 22, Hockey played itself with a 6-7x clock): after start, nobody touches the game for ~15 s.
// FAIL when a clock on the screen runs faster than real time, or a two-sided score (3 - 1) changes. Read the HUD text only,
// so it works for every game. games.json "idleOk": true switches the score half off for a game whose AI may score by design.
async function idleRead(page) {
  return page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const clocks = [], scores = [];
    for (const e of document.querySelectorAll('[id*="clock" i],[id*="timer" i],[class*="clock" i],[class*="timer" i],[id*="score" i],[class*="score" i]')) {
      if (!vis(e) || e.children.length > 6) continue;
      const t = (e.textContent || '').replace(/\s+/g, ' ').trim(); if (!t || t.length > 40) continue;
      const key = (e.id || e.className || e.tagName) + '';
      const m = t.match(/^(\d{1,2}):(\d{2})(?:[.:]\d+)?$/);
      if (m) { clocks.push({ key, sec: +m[1] * 60 + +m[2] }); continue; }
      if (/^\d{1,3}\s*[\u2013\u2014-]\s*\d{1,3}$/.test(t)) scores.push({ key, text: t });
    }
    return { clocks, scores, at: performance.now() };
  }).catch(() => null);
}
function idleJudge(a, b, g, wallSec) {
  const out = [];
  if (!a || !b) return out;
  for (const c of b.clocks) {
    const c0 = a.clocks.find(x => x.key === c.key); if (!c0) continue;
    const d = Math.abs(c.sec - c0.sec);
    if (d > wallSec * 1.5 + 3) out.push(`IDLE RUN: the clock "${c.key}" moved ${d} s in ${wallSec.toFixed(0)} s of real time with nobody touching the game - it runs faster than real time (a 1.0 s frame step, a time-speed setting left on, or a lost lastT=now)`);
  }
  if (!g.idleOk) for (const s of b.scores) {   // idleGoalWarn: yellow instead of red until that game's AI defends an untouched team (Hockey, Oct 22)
    const s0 = a.scores.find(x => x.key === s.key);
    if (s0 && s0.text !== s.text) out.push(`${g.idleGoalWarn ? 'WARN|' : ''}IDLE RUN: the score "${s.key}" went ${s0.text} -> ${s.text} with nobody touching the game - a goal/point was scored by itself`);
  }
  return out;
}

// VIRTUAL CLOCK (owner Oct 22): on a slow robot a game that steps a whole second per frame (lost `lastT=now`) looks normal, because
// real frames are slow too. So run the page on a FAKE clock: requestAnimationFrame hands out 16.7 ms per frame and performance.now
// follows it. A healthy game then moves its HUD clock about 1 s per 60 frames; a broken one moves it many seconds per frame.
async function virtualClockFail(ctx, base, g) {
  const vp = await ctx.newPage();
  try {
    await vp.addInitScript(() => {
      let v = 0; window.__vf = 0;
      window.requestAnimationFrame = cb => setTimeout(() => { v += 16.667; window.__vf++; cb(v); }, 0);
      performance.now = () => v;
    });
    await vp.goto(base + g.file, { waitUntil: 'load', timeout: 45000 }); await vp.waitForTimeout(4000);
    for (const step of g.start || []) await pressStep(vp, step);
    const hud = () => vp.evaluate(() => {
      for (const e of document.querySelectorAll('[id*="clock" i],[id*="timer" i],[class*="clock" i],[class*="timer" i]')) {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const m = (e.textContent || '').trim().match(/^(\d{1,2}):(\d{2})(?:[.:]\d+)?$/); if (m) return { key: (e.id || e.className) + '', sec: +m[1] * 60 + +m[2], vf: window.__vf };
      } return null; });
    const f0 = await vp.evaluate(() => window.__vf);
    await vp.waitForFunction(n => window.__vf >= n, f0 + 30, { timeout: 90000, polling: 100 });
    const a = await hud(); if (!a) return null;
    await vp.waitForFunction(n => window.__vf >= n, a.vf + 60, { timeout: 120000, polling: 100 });
    const b = await hud(); if (!b || b.key !== a.key) return null;
    const vsec = (b.vf - a.vf) * 0.016667, d = Math.abs(b.sec - a.sec);
    if (d > vsec * 1.5 + 3) return `IDLE RUN: the clock "${b.key}" moved ${d} s while the game was given only ${vsec.toFixed(1)} s of frames (${b.vf - a.vf} frames at 60/s) - the game steps far more than one frame of time per frame (a lost lastT=now, or a time-speed setting left on)`;
    return null;
  } catch (e) { return null; } finally { try { await vp.close(); } catch (e) {} }
}
// SLOW-RUNNER CLOCK (owner Oct 22, help line "Flight wall-clock tests timing out on slow runner days"): the tests' time budgets are
// real seconds, so a runner 3-4x slower than normal fails a test that passes at normal speed. The robot times a fixed amount of
// arithmetic in the page; SLOW = how many times slower than the baseline in tools/game-check/runner-speed.json (never below 1,
// never above 4, and under 1.5x counts as normal). Every test budget (the 30 s harness limit and the Flight tests' own
// `Date.now() - t0 > N` limits via window.__slow) is multiplied by it. The measured number is logged in the result (r.slow).
async function slowFactor(page) {
  let base = 60; try { base = JSON.parse(fs.readFileSync(new URL('./runner-speed.json', import.meta.url), 'utf8')).baseMs || 60; } catch (e) {}
  try {
    const ms = await page.evaluate(() => { const t = performance.now(); let x = 0; for (let i = 0; i < 20e6; i++) x += Math.sqrt(i) * 1.0001; return performance.now() - t + (x < 0 ? 1 : 0); });
    const f = ms / base; return { ms: Math.round(ms), base, factor: f < 1.5 ? 1 : Math.min(4, Math.round(f * 10) / 10) };
  } catch (e) { return { ms: 0, base, factor: 1 }; }
}
async function pressStep(page, step) {
  const loc = step.startsWith('text=') ? page.getByText(step.slice(5), { exact: false }).first() : page.locator(step).first();
  try {
    if (!(await loc.count())) return false;
    if (!(await loc.isVisible())) return false;
    await loc.click({ timeout: 2500, force: true });
    await page.waitForTimeout(1800);
    return true;
  } catch (e) { return false; }
}

// owner 2026-10-17: "I still see games where you have to scroll down to press play". A start button below the bottom
// of a sideways phone (844x390) is a FAIL - pressStep's click scrolls to it by itself, so measure BEFORE pressing.
async function offScreen(page, step) {
  const loc = step.startsWith('text=') ? page.getByText(step.slice(5), { exact: false }).first() : page.locator(step).first();
  try {
    if (!(await loc.count()) || !(await loc.isVisible())) return null;
    const b = await loc.boundingBox(), vh = (page.viewportSize() || { height: 390 }).height;
    if (b && b.y + b.height > vh + 2) return { label: ((await loc.innerText().catch(() => '')) || step).trim().replace(/\s+/g, ' ').slice(0, 30), px: Math.round(b.y + b.height - vh) };
  } catch (e) {}
  return null;
}

async function pageFacts(page) {
  return page.evaluate(([casinoSrc, brandSrc]) => {
    const re = new RegExp(casinoSrc, 'i');
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
    let rotate = '';
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length > 3) continue;
      const t = (el.innerText || '').trim();
      if (/rotate your|turn your (phone|device)/i.test(t) && vis(el)) { rotate = t.slice(0, 90); break; }
    }
    const text = document.body ? document.body.innerText : '';
    const cm = (document.title + ' \n ' + text).match(re);
    const se = document.scrollingElement || document.documentElement;
    const inputs = [...document.querySelectorAll('input,textarea,label')].map(e => (e.placeholder || '') + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (e.tagName === 'LABEL' ? e.innerText : '')).join(' ');
    const bm = (document.title + ' \n ' + text + ' ' + inputs).match(new RegExp(brandSrc));
    const yn = (text + ' ' + inputs).match(/\b(your|enter( your)?) (real |full |first |last )?name\b/i);
    return { title: document.title, casino: cm ? cm[0] : '', rotate, brand: bm ? bm[0] : '', yourName: yn ? yn[0] : '',
             overflow: Math.max(0, se.scrollHeight - window.innerHeight) };
  }, [CASINO.source, BRANDS.source]);
}

// VENUE GATE (owner, 2026-10-16): every game plays in a real place built from its venues/ sheet, approved by the owner
// in MODELS.md (LOCKED) like the hockey arena. Without one the game gets a CHECK, which pulls its daily score down.
const VENUE_OF = { apextrackfield: 'track', apexsoccer: 'soccer', apexhockey: 'rink', apexbaseball: 'ballpark', apexf1: 'circuit',
  apexracer: 'circuit', apexflight: 'airport', apexmonstertruck: 'truck-arena' };
const lockedVenues = new Set();
try {
  let cur = null;
  for (const line of fs.readFileSync('MODELS.md', 'utf8').split('\n')) {
    const h = line.match(/^##\s*MODEL:\s*(.+)$/); if (h) { cur = { name: h[1] }; continue; }
    const kv = line.match(/^\s*-\s*([a-z ]+):\s*(.*)$/i); if (cur && kv) cur[kv[1].trim().toLowerCase()] = kv[2].trim();
    if (cur && cur.status && cur.game && /^LOCKED/i.test(cur.status) && /arena|stadium|venue|rink|track|ballpark|circuit|airport|field/i.test((cur.id || '') + ' ' + cur.name)) lockedVenues.add(cur.game);
  }
} catch (e) {}
const results = [];
for (const g of games) {
  const r = { file: g.file, name: g.name, fail: [], check: [], ok: [], img: {}, startedAt: new Date().toISOString() };
  const tGame0 = Date.now();        // owner Oct 21 7:49 PM: the robot records how long it really played each game
  const phases = []; let tPh = Date.now(); const mark = n => { phases.push({ phase: n, ms: Date.now() - tPh }); tPh = Date.now(); };   // owner Oct 24 2026 item 6: robot prints the time of each step
  { const sl = g.file.replace('.html', ''); if (VENUE_OF[sl] && !lockedVenues.has(g.file))
      r.check.push(`No owner-approved venue - build it from venues/${VENUE_OF[sl]}.md (real sizes, stands all around, crowd) with venues/kit in tools/venue-viewer.html, add it to MODELS.md as WAITING OWNER`); }
  if (g.notOnHub) r.fail.push('Not on the Game Development page - add its ALL TITLES card to sports.html (every game in development must be playable there)');
  const slug = g.file.replace('.html', '');
  // one game that freezes the browser must never stop the whole report (Oct 17: Track & Field hung the robot)
  try {
  // ---------- sideways (how the games are meant to be played)
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  await ctx.addInitScript(STUDIO_PROBE);
  const page = await ctx.newPage();
  const errors = new Set(), missing = new Set(), outside = new Set(); let bytes = 0;
  page.on('request', q => { const u = q.url(); if (/^(https?|wss?):/i.test(u) && !u.startsWith(base)) { try { outside.add(new URL(u).host); } catch (e) { outside.add(u.slice(0, 60)); } } });
  page.on('response', res => { bytes += +(res.headers()['content-length'] || 0); });
  page.on('pageerror', e => errors.add(String(e.message).split('\n')[0].slice(0, 140)));
  // owner Oct 24 2026 9:12 PM (window 6 spent an hour re-creating #1614's script error by hand): on the FIRST script error the robot keeps
  // the evidence - full stack (file, line, function), the last 20 console lines, and 3 pictures (just before / at / just after).
  // Saved to <out>/evidence/<game>/ ; the check job pushes it to the pr-evidence branch and the Check status comment links it.
  const consoleTail = []; let lastFrame = null, frameBusy = false, evidenceDone = false;
  page.on('console', m => { consoleTail.push(m.type() + ': ' + m.text().replace(/\s+/g, ' ').slice(0, 220)); if (consoleTail.length > 20) consoleTail.shift(); });
  const frameTimer = setInterval(async () => {   // a small picture every 2 s, so "just before" exists when the error comes
    if (frameBusy || evidenceDone) return; frameBusy = true;
    try { lastFrame = await page.screenshot({ timeout: 4000, type: 'jpeg', quality: 45 }); } catch (e) {}
    frameBusy = false;
  }, 2000); frameTimer.unref();
  page.on('pageerror', async e => {
    if (evidenceDone) return; evidenceDone = true; clearInterval(frameTimer);
    try {
      const dir = path.join(out, 'evidence', slug); fs.mkdirSync(dir, { recursive: true });
      const stack = String(e.stack || e.message || e).split('\n').slice(0, 14).map(x => x.slice(0, 220));
      const top = (stack.find(x => /\.(html|js|mjs):\d+/.test(x)) || '').match(/([^\s()]+\.(?:html|js|mjs)):(\d+)(?::(\d+))?/);
      const info = { game: g.file, message: String(e.message).split('\n')[0].slice(0, 300), stack, file: top ? top[1].replace(base, '') : '', line: top ? +top[2] : 0, col: top && top[3] ? +top[3] : 0, console: consoleTail.slice(), pics: {}, at: new Date().toISOString() };
      if (lastFrame) { fs.writeFileSync(path.join(dir, 'before.jpg'), lastFrame); info.pics.before = 'before.jpg'; }
      try { fs.writeFileSync(path.join(dir, 'at.jpg'), await page.screenshot({ timeout: 5000, type: 'jpeg', quality: 62 })); info.pics.at = 'at.jpg'; } catch (x) {}
      await new Promise(rs => setTimeout(rs, 1500));
      try { fs.writeFileSync(path.join(dir, 'after.jpg'), await page.screenshot({ timeout: 5000, type: 'jpeg', quality: 62 })); info.pics.after = 'after.jpg'; } catch (x) {}
      fs.writeFileSync(path.join(dir, 'error.json'), JSON.stringify(info, null, 1));
      r.errorEvidence = { file: info.file, line: info.line };
    } catch (x) { console.log('::warning title=error-evidence::' + String(x).slice(0, 160)); }
  });
  const shaderErr = new Set();   // a broken shader hides every model that uses it (Oct 16: invisible hockey players)
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && /Shader Error|shader is not compiled|Program Info Log/i.test(t)) shaderErr.add(t.replace(/\s+/g, ' ').slice(0, 120)); });
  const aborted = new Set();
  page.on('response', res => { if (res.status() >= 400) missing.add(res.url().replace(base, '').slice(0, 100)); });
  page.on('requestfailed', q => { const u = q.url(); if (!u.startsWith(base)) return;
    // Oct 21 (VP): a sound the game starts loading and the page then drops (reload / leaving the page) is ABORTED, not missing -
    // G-80's 20 real mp3 files (present on main and on its branch) were reported 'Missing file'. Only a real 404 above counts.
    const why = (q.failure() && q.failure().errorText) || '';
    // owner Oct 21 5:26 PM (window 1, G-100): ANY aborted download (a page reload / leaving the page) is never 'missing
    // file' - it is retried once at the end and counts only if the file really isn't there.
    if (/ERR_ABORTED|aborted|cancel/i.test(why)) { aborted.add(u); return; }
    missing.add(u.replace(base, '').slice(0, 100)); });
  try {
    await page.goto(base + g.file, { waitUntil: 'load', timeout: 45000 });
  } catch (e) { r.fail.push('Page did not load: ' + String(e.message).split('\n')[0].slice(0, 100)); }
  await page.waitForTimeout(7000);
  const menuJpg = await page.screenshot({ timeout: 90000, type: 'jpeg', quality: 62 });
  fs.writeFileSync(path.join(out, 'img', slug + '-1-menu.jpg'), menuJpg); r.img.menu = 'img/' + slug + '-1-menu.jpg';
  const menu = await measure(menuJpg);
  const f1 = await pageFacts(page).catch(() => ({ title: '', casino: '', rotate: '', overflow: 0 }));
  r.title = f1.title;
  if (menu.dark > 0.93 || menu.std < 6) r.fail.push('Opening screen is black or blank');
  if (f1.overflow > 24) r.check.push(`Menu runs ${f1.overflow}px off the bottom of a sideways phone`);
  // APEX LOOK (owner, 2026-10-17: "games that have a green film and green lettering - fix"): menus use the house look of
  // F1 / Monster Truck - bold clean letters, white with Apex red/gold - never typewriter (monospace) or green terminal text
  try {
    const look = await page.evaluate(() => {
      let tot = 0, mono = 0, green = 0; const W = innerWidth, H = innerHeight;
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let t = tw.nextNode(); t; t = tw.nextNode()) {
        const x = t.textContent.trim(); if (!x) continue; const el = t.parentElement; if (!el || /SCRIPT|STYLE/.test(el.tagName)) continue;
        const rr = el.getBoundingClientRect(); if (rr.width < 2 || rr.bottom < 0 || rr.top > H || rr.right < 0 || rr.left > W) continue;
        let vis = true; for (let a = el; a && a !== document.body; a = a.parentElement) { const q = getComputedStyle(a); if (q.display === 'none' || q.visibility === 'hidden' || +q.opacity < 0.05) { vis = false; break; } }
        if (!vis) continue; const s = getComputedStyle(el), n = x.length; tot += n;
        if (/mono|courier|consolas|menlo/i.test(s.fontFamily)) mono += n;
        const m = (s.color.match(/\d+(\.\d+)?/g) || [0, 0, 0]).map(Number);
        if (m[1] > m[0] * 1.3 && m[1] > m[2] * 1.15 && m[1] > 110) green += n;
      }
      return { mono: Math.round(100 * mono / (tot || 1)), green: Math.round(100 * green / (tot || 1)) };
    });
    r.look = look;
    if (look.mono > 40 || look.green > 30) r.fail.push(`Menu has the old green "computer screen" look (${look.mono}% typewriter letters, ${look.green}% green letters) - use the Apex look like F1 / Monster Truck: bold clean letters, white text with Apex red/gold, the venue clear behind it (no green film) (STUDIO-STANDARD.md "Apex look")`);
  } catch (e) {}

  // press the start buttons
  let pressed = 0;
  const offSteps = [];
  for (const step of g.start || []) {
    const off = await offScreen(page, step); if (off) offSteps.push(off);
    if (await pressStep(page, step)) pressed++;
  }
  for (const o of offSteps.slice(0, 2)) r.fail.push(`Start button off the screen: "${o.label}" is ${o.px}px below the bottom of a sideways phone - the owner has to scroll to press it. Every menu must fit 844x390 with NO scrolling: shrink/scale the menu panel or put the PLAY button at the top (STUDIO-STANDARD.md "Fits the screen")`);
  if (!(g.start || []).length) { try { await page.touchscreen.tap(422, 195); } catch (e) {} }
  mark('load + menu + start'); const idleA = await idleRead(page); const idleT0 = Date.now();
  // GAMEPLAY CLIP (owner, Oct 18): the first ~8 s after start as a flip-book (one frame every ~0.4 s) - the workflow turns
  // it into img/<game>-clip.mp4 so the owner SEES motion (countdown camera, crowd, players) on his board, not a still.
  try {
    const cdir = path.join(out, 'clips', slug); fs.mkdirSync(cdir, { recursive: true });
    const t0 = Date.now(); let k = 0;
    while (Date.now() - t0 < 8000 && k < 40) {
      fs.writeFileSync(path.join(cdir, String(k).padStart(3, '0') + '.jpg'), await page.screenshot({ timeout: 90000, type: 'jpeg', quality: 55 }));
      k++; await page.waitForTimeout(250);
    }
    if (k >= 6) r.img.clip = 'img/' + slug + '-clip.mp4';
    const left = 8000 - (Date.now() - t0); if (left > 0) await page.waitForTimeout(left);
  } catch (e) { await page.waitForTimeout(8000); }
  const playJpg = await page.screenshot({ timeout: 90000, type: 'jpeg', quality: 62 });
  await page.waitForTimeout(1500);
  const play2Jpg = await page.screenshot({ timeout: 90000, type: 'jpeg', quality: 62 });
  fs.writeFileSync(path.join(out, 'img', slug + '-2-play.jpg'), playJpg); r.img.play = 'img/' + slug + '-2-play.jpg';
  const play = await measure(playJpg), play2 = await measure(play2Jpg);
  // EXTRA PICTURES (owner Oct 19, Gemini idea): games.json "pictures": [{"name":"garage","steps":["#mGarage"]}] - each one
  // opens the game fresh, presses its steps and saves img/<game>-pic-<name>.jpg, shown on the owner's job card
  // (e.g. the car in the garage next to the race picture: color, size and which way it points at a glance)
  for (const pc of (g.pictures || []).slice(0, 3)) {
    try {
      const pp = await ctx.newPage();
      await pp.goto(base + g.file, { waitUntil: 'load', timeout: 45000 }); await pp.waitForTimeout(7000);
      for (const st of pc.steps || []) await pressStep(pp, st);
      await pp.waitForTimeout(pc.wait || 2500);
      const nm = String(pc.name || 'pic').replace(/[^a-z0-9-]/gi, '');
      fs.writeFileSync(path.join(out, 'img', slug + '-pic-' + nm + '.jpg'), await pp.screenshot({ timeout: 90000, type: 'jpeg', quality: 66 }));
      (r.img.pics = r.img.pics || []).push({ name: pc.name, src: 'img/' + slug + '-pic-' + nm + '.jpg' });
      await pp.close();
    } catch (e) { r.check.push('Extra picture "' + pc.name + '" failed: ' + String(e.message).split('\n')[0].slice(0, 80)); }
  }
  const f2 = await pageFacts(page).catch(() => ({ casino: '', rotate: '' }));
  if (play.dark > 0.93 || play.std < 6) r.fail.push('Gameplay screen is black or blank');
  if (!(g.start || []).length) r.check.push('No start steps in games.json yet - only the menu was checked');
  else if (pressed === 0) r.check.push("Couldn't press any start button - add/fix this game's steps in games.json");
  else if (changed(menu, play) < 0.04) r.check.push('Screen barely changed after pressing start - did gameplay begin?');
  if (pressed && changed(play, play2) < 0.003) r.check.push('Gameplay picture frozen for 1.5 seconds');
  // ---------- STUTTER (owner, Oct 18): short freezes you feel in your hand, not just a low average. The robot's phone is slow
  // (no graphics card), so a hitch is a frame 3x longer than this game's normal frame AND over 150 ms.
  try {
    const st = await page.evaluate(() => new Promise(res => {
      const t = []; let last = performance.now(); const end = last + 6000;
      (function f(now) { t.push(now - last); last = now; if (now < end) requestAnimationFrame(f); else res(t); })(last);
    }));
    const sorted = st.slice(1).sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)] || 16;
    const hitches = st.slice(1).filter(x => x > Math.max(150, med * 3));
    r.stutter = { frames: st.length, median: Math.round(med), hitches: hitches.length, worst: Math.round(Math.max(0, ...hitches)) };
    if (hitches.length >= 3) r.check.push(`Stutter: ${hitches.length} short freezes in 6 s of play (worst ${r.stutter.worst} ms, normal frame ${r.stutter.median} ms) - usually new objects made every frame (garbage), big pictures loaded mid-game or a model built during play; build everything before play starts and reuse objects (STUDIO-STANDARD.md "Phone budget")`);
  } catch (e) {}
  try { const idleB = await idleRead(page); for (const m of idleJudge(idleA, idleB, g, (Date.now() - idleT0) / 1000)) { if (m.startsWith('WARN|')) r.check.push(m.slice(5) + ' (yellow for now: this game is on the warning list until its AI defends an untouched team)'); else r.fail.push(m); } } catch (e) {}
  mark('idle watch + first pictures');
  try { const vf = await virtualClockFail(ctx, base, g); if (vf) r.fail.push(vf); } catch (e) {}
  // ---------- CLEAN SCREEN (owner, 2026-10-17): during play only the buttons you need - long words only behind "How to play"
  const words = await page.evaluate(() => {
    let n = 0, keys = '', biggest = '', bigN = 0;
    const W = innerWidth, H = innerHeight;
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const txt = t.textContent.trim(); if (!txt) continue;
      const el = t.parentElement; if (!el || /SCRIPT|STYLE|NOSCRIPT/.test(el.tagName)) continue;
      const rr = el.getBoundingClientRect(); if (rr.width < 2 || rr.height < 2 || rr.right < 0 || rr.bottom < 0 || rr.left > W || rr.top > H) continue;
      let vis = true; for (let a = el; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.05) { vis = false; break; } }
      if (!vis) continue;
      const c = txt.split(/\s+/).filter(w => /[A-Za-z]{2,}/.test(w)).length; n += c;
      if (c > bigN) { bigN = c; biggest = txt.slice(0, 70); }
      const k = txt.match(/\(\s*space\s*\)|\b(press|hit|tap)\s+(space|enter|shift|esc)\b|\bWASD\b|arrow keys|spacebar/i); if (k && !keys) keys = k[0];
    }
    return { n, keys, biggest };
  }).catch(() => null);
  if (words) {
    r.words = words.n;
    if (words.n > 40) r.fail.push(`Wordy play screen: about ${words.n} words showing during play (biggest: "${words.biggest}") - during play show only the buttons you need; put instructions behind a "How to play" (?) button, closed by default (STUDIO-STANDARD.md "Clean screen")`);
    else if (words.n > 20) r.check.push(`Busy play screen: about ${words.n} words during play (biggest: "${words.biggest}") - aim for only button labels and the score; instructions go behind How to play (STUDIO-STANDARD.md "Clean screen")`);
    if (words.keys) r.fail.push(`Keyboard words on a phone game: "${words.keys}" - phones have no keyboard; name the on-screen button instead, and only inside How to play (STUDIO-STANDARD.md "Clean screen")`);
  }
  // ---------- STUDIO-STANDARD.md
  const st = await page.evaluate(() => window.__studio || null).catch(() => null);
  if (st) { r.studio = { skinned: st.skinned, drawsPerFrame: st.frames ? Math.round(st.sum / st.frames) : 0, maxDraws: st.max };
    if (g.people && !st.skinned) r.fail.push('Players are not real 3D bodies (no rigged/skinned model was drawn) - blob or box people break STUDIO-STANDARD.md; use characters/base-human-v2 + the athlete kit (gear.js)');
    const dpf = r.studio.drawsPerFrame;
    if (dpf > (g.maxDraws || 450)) r.check.push(`Heavy for phones: about ${dpf} draw calls per frame (aim under ${g.maxDraws || 450}; merge meshes - see STUDIO-STANDARD.md "Phone budget")`); }
  if (bytes > 60e6) r.check.push(`Big download: about ${Math.round(bytes / 1e6)} MB before play (aim under 60 MB)`);
  // WHERE THINGS ARE (owner Oct 21 2026 "faster builders"): every game's look board starts with a short map of the
  // game file (what lives where, with line numbers) so a builder finds the spot in seconds. Missing = a yellow line.
  try {
    const lb = fs.readFileSync(path.join(here, '..', '..', 'looks', slug + '.md'), 'utf8');
    if (!/WHERE THINGS ARE/i.test(lb.slice(0, 4000))) r.check.push('looks/' + slug + '.md has no "WHERE THINGS ARE" map at the top (STUDIO-STANDARD 9.7) - add one with line numbers and keep it current');
  } catch (e) {}
  // ---------- the owner's FIX LIST for this game (tested while the game is running, sideways)
  r.fixes = [];
  const fixFile = path.join(here, 'fixes', slug + '.mjs');
  if (fs.existsSync(fixFile)) {
    let list = [];
    mark('pictures + reality + checks');
    try { list = (await import('file://' + fixFile + '?t=' + Date.now())).default || []; }
    catch (e) { r.fail.push('Script error in the play-test file tools/game-check/fixes/' + slug + '.mjs - it does not load, so NONE of its tests ran: ' + String(e.message).split('\n')[0].slice(0, 140)); }
    // Tests written for Puppeteer: the same calls in Playwright (Grok review Oct 17 - Track & Field tests crashed on these)
    if (!page.setViewport) page.setViewport = v => page.setViewportSize({ width: v.width, height: v.height });
    if (!page.target) page.target = () => ({ createCDPSession: () => page.context().newCDPSession(page) });
    // a fresh copy of the game after a failed / timed-out test, so one test can't break the next (they share a page)
    const freshGame = async () => {
      try { await page.goto(base + g.file, { waitUntil: 'load', timeout: 45000 }); await page.waitForTimeout(2500);
        for (const step of g.start || []) await pressStep(page, step); await page.waitForTimeout(2500); } catch (e) {}
    };
    // VP-analyst Oct 23 2026 (window 6, PR #1282: "fx.test is not a function"): a play-test entry that is not shaped right is
    // rejected UP FRONT with the exact right shape, never a bare TypeError. Runs at PR time (the PR's game is played).
    {
      const RIGHT = "right shape: { id: 'play-...', ask: 'the owner words' (a line saying what is checked), async test(page, h) { ...; return true; } } - the check is a method named `test` (async test(page, h)) that returns true when fine, or a short string saying why not; NOT `run:`, `fn:` or `check:`";
      const good = [];
      for (const fx of Array.isArray(list) ? list : []) {
        const why = !fx || typeof fx !== 'object' ? 'entry is not an object' : typeof fx.id !== 'string' || !fx.id ? 'missing id'
          : typeof fx.test !== 'function' ? ('has no test function' + (['run', 'fn', 'check', 'exec', 'play'].filter(k => typeof fx[k] === 'function').map(k => ' - it uses `' + k + '` instead of `test`').join('')) ) : '';
        if (why) r.fail.push('PLAY-TEST FORMAT: tools/game-check/fixes/' + slug + '.mjs entry "' + (fx && fx.id || '?') + '" ' + why + ' - ' + RIGHT);
        else good.push(fx);
      }
      if (!Array.isArray(list)) r.fail.push('PLAY-TEST FORMAT: tools/game-check/fixes/' + slug + '.mjs must `export default [ ... ]` - an array of entries; ' + RIGHT);
      list = good;
    }
    // owner Oct 23 2026 7:47 PM: TEST_PART=k/n plays only every n-th play test starting at k (Hockey's 56 tests on 3 robots side by side);
    // merge-results puts the parts back together. Part 1 also does everything else (pictures, reality, Safari).
    const TP = /^(\d+)\/(\d+)$/.exec(process.env.TEST_PART || '');
    if (TP) { const k = +TP[1], n = +TP[2]; list = list.filter((_, i) => i % n === k - 1); r.part = k + '/' + n; }
    // owner Oct 23 2026 5:24 PM: Hockey's play run went 52 min and the runner died ("lost communication"). Caps so a hung game
    // fails fast with a readable line: one test never runs longer than 90 s (x2 on its retry) whatever the runner speed, and a
    // game's play tests stop after 20 min - the rest are listed as NOT RUN (yellow, robot side), never a dead runner.
    const GAME_CAP_MS = 20 * 60 * 1000, tGame = Date.now(); let notRun = [];
    for (const fx of list) {
      if (Date.now() - tGame > GAME_CAP_MS) { notRun.push(fx.id); r.fixes.push({ id: fx.id, ask: askOf(fx), ok: false, note: 'not run - robot time cap (20 min per game)', inconclusive: true, ms: 0, mode: fx.mode || '' }); continue; }
      let ok = false, note = '', dead = false;
      // the time limit really STOPS the test: after 30 s every call it makes on the page throws
      const live = new Proxy(page, { get(t, k) { if (dead) throw new Error('test stopped (time limit)'); const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
      const h = {
        wait: ms => { if (dead) throw new Error('test stopped (time limit)'); return page.waitForTimeout(ms); },
        tap: (x, y) => { if (dead) throw new Error('test stopped (time limit)'); return page.touchscreen.tap(x, y); },
        press: sel => { if (dead) throw new Error('test stopped (time limit)'); return pressStep(page, sel); },
        shot: async () => { if (dead) throw new Error('test stopped (time limit)'); return measure(await page.screenshot({ timeout: 90000, type: 'jpeg', quality: 62 })); },
        changed,
        eval: (fn, arg) => { if (dead) throw new Error('test stopped (time limit)'); return page.evaluate(fn, arg); },
        page: live,
      };
      let timer, inc = false; const tFx = Date.now();
      // owner Oct 21 6:38 PM (window 1, G-100): a test that WAITS for a random game event ("no strikeout or walk happened
      // in 29 s, so the reset could not be checked") did not find a bug - it found nothing. Such an answer is
      // INCONCLUSIVE: the test gets one more try on a fresh game; still nothing = a yellow line, never "NOT done yet".
      // A test says it by returning { inconclusive: 'why' }, or a sentence with "could not be checked" / "never happened".
      const INCON = /could not be checked|couldn'?t be checked|could not be tested|never happened|did not happen in|no .{0,40} happened in \d+ ?s/i;
      // Oct 22 9:20 PM (window 2 HELP, PR #1177): on a slow runner a tester test errored "took over 30 s" in 3 runs - the robot's
      // clock, not a game bug. A test that only TIMED OUT gets one more try on a fresh game with DOUBLE the time; a test that
      // times out twice still fails (a real hang must stay red).
      let timedOut = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        dead = false; inc = false; const budget = attempt === 2 ? 2 : 1;
        try {
          const sl = await slowFactor(page); r.slow = sl; try { await page.evaluate(f => { window.__slow = f; }, sl.factor); } catch (e) {}
          const capMs = Math.min(30000 * sl.factor, 90000) * budget;
          const res = await Promise.race([fx.test(live, h), new Promise((_, rej) => { timer = setTimeout(() => { dead = true; rej(new Error('took over ' + Math.round(capMs / 1000) + ' s' + (sl.factor > 1 ? ' (runner ' + sl.factor + 'x slower than normal)' : ''))); }, capMs); })]);
          ok = res === true;
          if (res && typeof res === 'object' && res.inconclusive) { inc = true; note = String(res.inconclusive).slice(0, 160); }
          else { note = typeof res === 'string' ? res : ''; inc = !ok && INCON.test(note); }
          timedOut = false;
        } catch (e) { note = 'test error: ' + String(e.message).split('\n')[0].slice(0, 100); timedOut = /^took over \d+ s/.test(String(e.message)); }
        clearTimeout(timer); dead = true;
        if (timedOut && attempt === 1) { await freshGame(); continue; }
        if (!inc || attempt === 2) break;
        await freshGame();
      }
      // owner Oct 21 7:49 PM (tester scoreboard "the Muse never reports its own time"): every test records the robot's
      // own play time (ms) and the mode/event it plays (fx.mode, or the first word of its id after the prefix)
      r.fixes.push({ id: fx.id, ask: askOf(fx), ok, note, inconclusive: inc || undefined, ms: Date.now() - tFx,
                     mode: fx.mode || String(fx.id || '').replace(/^(play|tester|never|keep|owner)-(g\d+-)?/, '').split('-')[0] || '' });
      if (inc) { r.check.push(`Play test could not decide (tried twice): "${askOf(fx)}" (${note}) - make the test CREATE the situation it checks instead of waiting for luck`); await freshGame(); continue; }
      if (!ok && /^play-/.test(fx.id || '')) r.check.push(`Play test failing: "${askOf(fx)}"${note ? ' (' + note + ')' : ''}`);
      else if (!ok) r.fail.push(`Owner's fix NOT done yet: "${askOf(fx)}"${note ? ' (' + note + ')' : ''}`);
      if (!ok) await freshGame();
      // a test that FROZE the game (AI thinkT = 999, skaters pinned to stand spots, positions set by hand) and passed left the
      // game frozen for every later test - they waited for events that never came. Always start the next test on a fresh game.
      else if (/thinkT|__standSpots|freeze|\.pos\.set\(/.test(String(fx.test))) await freshGame();
    }
    if (notRun.length) {
      r.check.push('ROBOT TIME CAP: ' + slug + ' play tests stopped after 20 min - ' + notRun.length + ' test(s) NOT RUN this time (' + notRun.slice(0, 6).join(', ') + (notRun.length > 6 ? ', ...' : '') + ') - robot side, not a game result');
      // owner Oct 23 7:47 PM "if any can count as passed, that is a false green": an owner / never / keep test that was NOT RUN is NOT proven -
      // it stays red (robot side, named), so no job can be called done on a test the robot never ran.
      for (const id of notRun) { const fx = list.find(x => x.id === id) || {}; if (!/^(play|tester)-/.test(id)) r.fail.push(`NOT RUN (robot time cap, robot side) - owner's fix not proven: "${askOf(fx) || id}"`); }
    }
    if (r.fixes.length) {
      const fixJpg = await page.screenshot({ timeout: 90000, type: 'jpeg', quality: 62 });
      fs.writeFileSync(path.join(out, 'img', slug + '-4-fixes.jpg'), fixJpg); r.img.fixes = 'img/' + slug + '-4-fixes.jpg';
    }
  }
  // PLAY TESTS (owner, 2026-10-16): every game needs at least 5 tests that actually PLAY it against its rules/ sheet
  const plays = (r.fixes || []).filter(x => /^play-/.test(x.id || '')).length;
  if (plays < 5) r.check.push(`Only ${plays} play test(s) - every game needs 5+ tests that play it by its rules (fixes/${slug}.mjs, ids 'play-...')`);
  // CAREER MODE (owner, 2026-10-17: "career modes need to be checked for playability"): a game with a career/season
  // mode needs play tests that start EVERY career level, finish it and unlock the next (ids 'play-career-...')
  try {
    const src = fs.readFileSync(path.join(process.cwd(), g.file), 'utf8');
    if (/career|season mode|tournament/i.test(src)) {
      const car = (r.fixes || []).filter(x => /^play-career/.test(x.id || ''));
      const bad = car.filter(x => !x.ok);
      if (!car.length) r.check.push(`Career mode has NO playability test - add 'play-career-...' tests that start every career level, play it to the end and unlock the next (STORE-READY.md "Career mode")`);
      for (const x of bad.slice(0, 3)) r.check.push(`Career mode broken: "${x.ask}"`);
      r.career = { tests: car.length, failing: bad.length };
    }
    // SHARED CONTROLS (owner Oct 21 2026 7:08 PM, STUDIO-STANDARD §9 rule 2): a game on kit/controls.js must not keep or
    // add its own stick code. games.json "controls": "shared" marks a game that moved; the robot then FAILS it when the
    // shared file is not loaded in the running game, or when the page still wires its own thumbstick.
    const usesShared = /kit\/controls\.js/.test(src);
    const ownStick = (() => {
      const re = /addEventListener\(\s*['"](pointerdown|touchstart)['"]/g; let m, hits = [];
      while ((m = re.exec(src))) { const near = src.slice(Math.max(0, m.index - 500), m.index + 300); if (/stick|joy|knob|thumb/i.test(near)) hits.push(src.slice(0, m.index).split('\n').length); }
      return hits;
    })();
    r.controls = { shared: usesShared, ownStick: ownStick.length };
    if (g.controls === 'shared' || usesShared) {
      let live = null; try { live = await page.evaluate(() => window.__controls && window.__controls.shared === true); } catch (e) {}
      if (!usesShared || live === false) r.fail.push('SHARED CONTROLS: this game must use kit/controls.js (createControls) for its stick and buttons - the shared file is not loaded (STUDIO-STANDARD 9.2)');
      if (ownStick.length) r.fail.push('OWN STICK CODE: the page still wires its own thumbstick (pointerdown/touchstart near "stick/joy/knob" at line ' + ownStick.slice(0, 3).join(', ') + ') - delete it and use kit/controls.js only (STUDIO-STANDARD 9.2)');
    } else r.check.push('Not on the shared controls yet (kit/controls.js) - its job moves this game over; until then its own stick code is allowed');
  } catch (e) {}
  // FRIEND CODES (owner, 2026-10-17): every game needs "Play a friend" with friend codes (STORE-READY.md "Friend codes")
  try {
    const src2 = fs.readFileSync(path.join(process.cwd(), g.file), 'utf8');
    if (!/friend/i.test(src2)) r.check.push(`No friend codes yet - add a "👥 Play a friend" button (My code / Enter a friend's code) with ApexKit.friend and a 'play-friend-code' test (STORE-READY.md "Friend codes")`);
    else if (!(r.fixes || []).some(x => /^play-friend/.test(x.id || ''))) r.check.push(`Friend codes have no 'play-friend-code' test yet (STORE-READY.md "Friend codes")`);
  } catch (e) {}
  // REALITY robot (owner Oct 20): direction, real sizes, ground contact - measured in the running game (reality.mjs)
  try {
    await page.goto(base + g.file, { waitUntil: 'load', timeout: 45000 }); await page.waitForTimeout(2500);
    for (const step of g.start || []) await pressStep(page, step);
    await page.waitForTimeout(2500);
    const rl = await realityCheck(page, ms => page.waitForTimeout(ms));
    r.reality = rl.data; r.fail.push(...rl.fail); r.check.push(...rl.check);
    // CLOSE-UP (owner Oct 21 5:54 PM): head and shoulders of the main player, shown on his card next to the play picture
    try {
      const fb = await playerCloseUp(page);
      if (fb && fb.jpg) {
        fs.writeFileSync(path.join(out, 'img', slug + '-face.jpg'), Buffer.from(fb.jpg.split(',')[1], 'base64'));
        r.img.face = 'img/' + slug + '-face.jpg';
      } else r.check.push('No close-up of the player: ' + ((fb && fb.why) || 'unknown') + ' (REALITY.md hook: player)');
    } catch (e) { r.check.push('Close-up picture failed: ' + String(e.message).split('\n')[0].slice(0, 80)); }
    // PHONE LAYOUT robot (owner Oct 20, Grok audit): buttons on top of each other / cut off, a stick that can get stuck
    try { const mb = await mobileCheck(page, g.file); r.layout = mb.data; r.fail.push(...mb.fail); r.check.push(...mb.check); }
    catch (e) { r.check.push('Phone layout check could not run: ' + String(e.message).split('\n')[0].slice(0, 80)); }
  } catch (e) { r.check.push('REALITY robot could not run: ' + String(e.message).split('\n')[0].slice(0, 100)); }
  const casino = f1.casino || f2.casino;
  if (casino) r.fail.push(`Casino wording found: "${casino}" (title: ${f1.title})`);
  const brand = f1.brand || f2.brand, yourName = f1.yourName || f2.yourName;
  if (brand) r.fail.push(`Real brand / league / player name on screen: "${brand}" - use our own made-up names (owner's law)`);
  if (yourName) r.fail.push(`"${yourName}" box - it must say "Player nickname" (store rule: no real names from kids)`);
  for (const h of outside) r.fail.push('Calls the outside internet (games must work fully offline): ' + h);
  if (f1.rotate || f2.rotate) r.fail.push(`Shows a rotate sign sideways: "${f1.rotate || f2.rotate}"`);
  await ctx.close();

  // ---------- upright (landscape law: no rotate sign, game still presented sideways)
  // deviceScaleFactor 2 like a real iPhone, so the robot also catches BLURRY games (drawn at low sharpness, owner 2026-10-17)
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  const p2 = await ctx2.newPage();
  try { await p2.goto(base + g.file, { waitUntil: 'load', timeout: 45000 }); } catch (e) {}
  await p2.waitForTimeout(6000);
  const upJpg = await p2.screenshot({ timeout: 90000, type: 'jpeg', quality: 62 });
  fs.writeFileSync(path.join(out, 'img', slug + '-3-upright.jpg'), upJpg); r.img.upright = 'img/' + slug + '-3-upright.jpg';
  const up = await measure(upJpg);
  const f3 = await pageFacts(p2).catch(() => ({ rotate: '' }));
  if (f3.rotate) r.fail.push(`Shows a rotate sign upright (landscape law says none): "${f3.rotate}"`);
  if (up.dark > 0.93 || up.std < 6) r.fail.push('Upright screen is black or blank');
  // SHARPNESS (owner: "get them to not make blurry players"): the 3D picture must be drawn at 1.5x or more on a 2x phone
  const sharp = await p2.evaluate(() => {
    // art director Oct 22 2026 (F1 "drawn at 0.18x"): a canvas still at the browser's default 300x150 has never been
    // drawn by the game (F1 starts its 3D only when a race starts) - that is a menu over an empty canvas, not a blurry
    // game, so it is skipped; the sharpness of the real 3D picture is measured on a canvas the game has sized.
    const cs = [...document.querySelectorAll('canvas')].filter((c) => c.clientWidth > 200 && c.clientHeight > 100 && !(c.width === 300 && c.height === 150));
    cs.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    const c = cs[0]; if (!c) return null;
    let gl = false; try { gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
    return gl ? { ratio: Math.min(c.width / c.clientWidth, c.height / c.clientHeight), w: c.width, cw: c.clientWidth } : null;
  }).catch(() => null);
  // FULL SCREEN UPRIGHT (owner, 2026-10-17: "landscape games go straight to landscape - I don't want to mention it again"):
  // held upright, the sideways game must fill the WHOLE phone screen, never half of it
  const fill = await p2.evaluate(() => {
    const cs = [...document.querySelectorAll('canvas')].filter((c) => c.clientWidth > 200 && c.clientHeight > 100);
    cs.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight); const c = cs[0]; if (!c) return null;
    const r = c.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)), iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return ix * iy / (vw * vh);
  }).catch(() => null);
  if (fill != null) { r.uprightFill = +fill.toFixed(2); if (fill < 0.9) r.fail.push(`Upright the game fills only ${Math.round(fill * 100)}% of the screen (the rest is black) - a sideways game must fill the WHOLE screen when the phone is held upright (STORE-READY.md PORTRAIT RULE: size the renderer to the turned box, or use kit/apex-kit.js fit())`); }
  if (sharp) {
    r.sharpness = +sharp.ratio.toFixed(2);
    if (sharp.ratio < 1.4) r.check.push(`Blurry picture: the 3D game is drawn at ${sharp.ratio.toFixed(2)}x on a 2x phone screen - players and lines look soft. Draw at 1.5x (renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)) or the kit/apex-gfx "sharp" setting) - STUDIO-STANDARD.md "Sharp picture"`);
  }
  for (const u of aborted) {          // retry each aborted download once - only a real 404 is 'missing'
    try { const res = await ctx2.request.get(u, { timeout: 20000 }); if (res.status() >= 400) missing.add(u.replace(base, '').slice(0, 100)); }
    catch (e) { /* network hiccup on the retry: not counted */ }
  }
  await ctx2.close();

  for (const m of missing) r.fail.push('Missing file: ' + m);
  for (const e of [...shaderErr].slice(0, 2)) r.fail.push('Broken 3D shader (models using it are invisible): ' + e);
  // owner Oct 19 9:53 PM: a script error (the red "Game error caught" bar on his phone) BLOCKS the merge - only NEW ones a PR
  // brings (errors main already has don't block; see STRICT below). The laptop tells that Muse the error line.
  clearInterval(frameTimer);
  for (const e of [...errors].slice(0, 4)) r.fail.push('Script error: ' + e + ' - fix it before merging (this is the red "Game error caught" bar on the phone)');
  } catch (e) {
    r.fail.push('The game froze the phone - the robot could not finish checking it (' + String(e.message || e).split('\n')[0].slice(0, 90) + ')');
    for (const c of browser.contexts()) if (c !== lab.context()) await c.close().catch(() => {});
  }
  // KNOWN ROBOT FAULTS (owner Oct 21 2026 7:08 PM): a red line the robot itself is wrong about never blocks a builder
  try {
    const kf = JSON.parse(fs.readFileSync(path.join(here, 'known-faults.json'), 'utf8')).faults || [];
    const today = new Date().toISOString().slice(0, 10);
    const live = kf.filter(f => f.match && (!f.game || f.game === g.file) && (!f.until || f.until >= today));
    if (live.length) {
      const keep = [];
      for (const f of r.fail) {
        // owner Oct 22 11 PM (HELP-VP robot, window 3): the printed line carries the test's NAME (ask), not its id, so also match the ids of the failing tests whose text is in the line
        const ids = (r.fixes || []).filter(x => x && !x.ok && x.ask && f.includes(String(x.ask).slice(0, 40))).map(x => x.id).join(' ');
        const hit = live.find(k => { try { return new RegExp(k.match, 'i').test(f + ' ' + ids); } catch (e) { return false; } });
        if (hit) r.check.push('KNOWN ROBOT FAULT (robot side owns it, not the builder): ' + f.slice(0, 160) + ' - ' + (hit.why || '').slice(0, 140));
        else keep.push(f);
      }
      r.knownFaults = r.fail.length - keep.length;
      r.fail = keep;
    }
  } catch (e) {}
  mark('play tests + the rest'); r.phases = phases;
  r.playMs = Date.now() - tGame0; r.endedAt = new Date().toISOString();
  r.status = r.fail.length ? 'FAIL' : r.check.length ? 'CHECK' : 'PASS';
  results.push(r);
  console.log(`${r.status.padEnd(5)} ${g.file}  ${[...r.fail, ...r.check].join(' | ')}`);
}
// ---------- 3D models waiting for the owner (MODELS.md): photograph each one in the model viewer, so the owner
// sees the REAL model with the game's lighting - Muses can't take WebGL pictures themselves.
const models = [];
try {
  const body = fs.readFileSync('MODELS.md', 'utf8');
  let cur = null, fence = false;
  for (const line of body.split(/\r?\n/)) {
    if (line.trim().startsWith('```')) { fence = !fence; cur = null; continue; }
    if (fence) continue;                                 // the example in the format box isn't a real model
    const h = line.trim().match(/^##\s*MODEL\s*:\s*(.+)$/i);
    if (h) { cur = { name: h[1].trim() }; models.push(cur); continue; }
    if (line.startsWith('## ')) { cur = null; continue; }
    const kv = line.match(/^\s*[-*]\s*([A-Za-z][A-Za-z ]{0,24}):\s*(.*)$/);
    if (cur && kv) cur[kv[1].trim().toLowerCase()] = kv[2].trim();
  }
} catch (e) {}
fs.mkdirSync(path.join(out, 'img', 'models'), { recursive: true });
// SKIP_MODELS=1 (main run where no model changed): carry.mjs keeps the last model pictures instead
for (const m of models.filter(m => !process.env.SKIP_MODELS && m.file && !/^(LOCKED|NO)/i.test(m.status || ''))) {
  m.id = (m.id || m.name).toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
  let view = m.view && /(model|venue)-viewer\.html/.test(m.view) ? m.view.replace(/^.*?tools\//, 'tools/') :
    `tools/model-viewer.html?m=${encodeURIComponent(m.file)}${m.anims ? '&anims=' + encodeURIComponent(m.anims) : ''}&look=${m.look || 'studio'}`;
  m.img = {}; m.problems = [];
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  for (const side of ['q', 'front', 'side']) {
    try {
      await page.goto(base + view + (view.includes('?') ? '&' : '?') + 'shot=' + side + '&name=' + encodeURIComponent(m.name), { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(() => document.title === 'ready' || document.title === 'error', null, { timeout: 90000 });
      if (await page.title() === 'error') { m.problems.push(await page.textContent('#msg')); break; }
      const jpg = await page.screenshot({ timeout: 90000, type: 'jpeg', quality: 70 });
      fs.writeFileSync(path.join(out, 'img', 'models', `${m.id}-${side}.jpg`), jpg); m.img[side] = `img/models/${m.id}-${side}.jpg`;
    } catch (e) { m.problems.push('viewer did not finish: ' + String(e.message || e).slice(0, 120)); break; }
  }
  if (errs.length) m.problems.push(...errs.slice(0, 2));
  m.info = await page.textContent('#info').catch(() => '');
  await ctx.close();
  console.log(`MODEL ${m.name}: ${Object.keys(m.img).length} pictures ${m.problems.join(' | ')}`);
}
await browser.close();

// ---------- the report (README.md shows on GitHub, phone-friendly)
const when = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' });
const sha = (process.env.GITHUB_SHA || '').slice(0, 7);
const count = s => results.filter(r => r.status === s).length;
let md = `# Game check\n\n**${when} (Central)**${sha ? ` · main @ \`${sha}\`` : ''}\n\n`;
md += `**${count('PASS')} pass · ${count('CHECK')} to check · ${count('FAIL')} fail** out of ${results.length} games.\n\n`;
md += `Each game was opened like a phone held sideways, started with its own buttons, then opened upright.\n` +
      `Pictures: opening screen · gameplay · upright.\n\n`;
const order = { FAIL: 0, CHECK: 1, PASS: 2 };
for (const r of results.slice().sort((a, b) => order[a.status] - order[b.status])) {
  const badge = { PASS: '✅ PASS', CHECK: '🟡 CHECK', FAIL: '🔴 FAIL' }[r.status];
  md += `## ${badge} — ${r.name}\n\n\`${r.file}\`\n\n`;
  for (const x of r.fail) md += `- 🔴 ${x}\n`;
  for (const x of r.check) md += `- 🟡 ${x}\n`;
  if (r.status === 'PASS') md += `- Loaded, started and moving. Nothing flagged.\n`;
  if (r.fixes && r.fixes.length) {
    md += `\n**Owner's fix list** (${r.fixes.filter(f => f.ok).length} of ${r.fixes.length} done):\n`;
    for (const f of r.fixes) md += `- ${f.ok ? '✅' : '❌'} ${f.ask}${!f.ok && f.note ? ' — ' + f.note : ''}\n`;
  }
  md += `\n<img src="${r.img.menu}" width="300"> <img src="${r.img.play}" width="300"> <img src="${r.img.upright}" width="90">${r.img.face ? ' <img src="' + r.img.face + '" width="120">' : ''}\n\n`;
}
const shown = models.filter(m => m.img);
if (shown.length) {
  md += `# 3D models (MODELS.md)\n\nEach one photographed in tools/model-viewer.html with its game's lighting.\n\n`;
  for (const m of shown) {
    md += `## ${m.name} — ${m.status || ''}\n\n${m.info || ''}\n\n`;
    for (const x of m.problems) md += `- 🔴 ${x}\n`;
    md += ['q', 'front', 'side'].filter(k => m.img[k]).map(k => `<img src="${m.img[k]}" width="300">`).join(' ') + '\n\n';
  }
}
md += `---\nMade by tools/game-check (runs after every merge to main). To check your game again, merge to main ` +
      `or run the "Game check" workflow by hand.\n`;
fs.writeFileSync(path.join(out, 'README.md'), md);
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ when, sha, results, models: models.filter(m => m.img).map(m => ({ id: m.id, name: m.name, status: m.status || '', version: m.version || '', img: m.img, problems: m.problems, info: m.info })) }, null, 1));
console.log(`\n${count('PASS')} pass, ${count('CHECK')} check, ${count('FAIL')} fail`);
// ---------- pull requests: block only NEW problems (main's own report is the baseline, so old issues don't trap a Muse)
if (process.env.STRICT) {
  // the verdict lives in judge.mjs (shared with the side-by-side PR check, game-check-pr.yml)
  const { judge } = await import('./judge.mjs');
  let base0 = {}; try { base0 = JSON.parse(fs.readFileSync(process.env.BASELINE || 'base-results.json', 'utf8')); } catch (e) {}
  let changed = [];
  try { changed = fs.readFileSync('changed.txt', 'utf8').split('\n').map(x => x.trim()).filter(Boolean); } catch (e) {}
  const blockers = judge({ results, models, base0, changed, branch: process.env.PR_BRANCH || '', title: process.env.PR_TITLE || '' });
  fs.writeFileSync(path.join(out, 'blockers.txt'), blockers.join('\n'));
  if (blockers.length) { console.log('\nBLOCKED - this pull request adds problems main does not have:\n- ' + blockers.join('\n- ')); process.exit(1); }
  console.log('\nNo new problems - OK to merge.');
}
