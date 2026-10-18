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
  const r = { file: g.file, name: g.name, fail: [], check: [], ok: [], img: {} };
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
  const shaderErr = new Set();   // a broken shader hides every model that uses it (Oct 16: invisible hockey players)
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && /Shader Error|shader is not compiled|Program Info Log/i.test(t)) shaderErr.add(t.replace(/\s+/g, ' ').slice(0, 120)); });
  page.on('response', res => { if (res.status() >= 400) missing.add(res.url().replace(base, '').slice(0, 100)); });
  page.on('requestfailed', q => { const u = q.url(); if (u.startsWith(base)) missing.add(u.replace(base, '').slice(0, 100)); });
  try {
    await page.goto(base + g.file, { waitUntil: 'load', timeout: 45000 });
  } catch (e) { r.fail.push('Page did not load: ' + String(e.message).split('\n')[0].slice(0, 100)); }
  await page.waitForTimeout(7000);
  const menuJpg = await page.screenshot({ type: 'jpeg', quality: 62 });
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
  await page.waitForTimeout(8000);
  const playJpg = await page.screenshot({ type: 'jpeg', quality: 62 });
  await page.waitForTimeout(1500);
  const play2Jpg = await page.screenshot({ type: 'jpeg', quality: 62 });
  fs.writeFileSync(path.join(out, 'img', slug + '-2-play.jpg'), playJpg); r.img.play = 'img/' + slug + '-2-play.jpg';
  const play = await measure(playJpg), play2 = await measure(play2Jpg);
  const f2 = await pageFacts(page).catch(() => ({ casino: '', rotate: '' }));
  if (play.dark > 0.93 || play.std < 6) r.fail.push('Gameplay screen is black or blank');
  if (!(g.start || []).length) r.check.push('No start steps in games.json yet - only the menu was checked');
  else if (pressed === 0) r.check.push("Couldn't press any start button - add/fix this game's steps in games.json");
  else if (changed(menu, play) < 0.04) r.check.push('Screen barely changed after pressing start - did gameplay begin?');
  if (pressed && changed(play, play2) < 0.003) r.check.push('Gameplay picture frozen for 1.5 seconds');
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
  // ---------- the owner's FIX LIST for this game (tested while the game is running, sideways)
  r.fixes = [];
  const fixFile = path.join(here, 'fixes', slug + '.mjs');
  if (fs.existsSync(fixFile)) {
    let list = [];
    try { list = (await import('file://' + fixFile + '?t=' + Date.now())).default || []; }
    catch (e) { r.check.push('Fix list file has an error: ' + String(e.message).slice(0, 120)); }
    const h = {
      wait: ms => page.waitForTimeout(ms),
      tap: (x, y) => page.touchscreen.tap(x, y),
      press: sel => pressStep(page, sel),
      shot: async () => measure(await page.screenshot({ type: 'jpeg', quality: 62 })),
      changed,
      eval: (fn, arg) => page.evaluate(fn, arg),
      page,
    };
    for (const fx of list) {
      let ok = false, note = '';
      try {
        const res = await Promise.race([fx.test(page, h), new Promise((_, rej) => setTimeout(() => rej(new Error('took over 30 s')), 30000))]);
        ok = res === true; note = typeof res === 'string' ? res : '';
      } catch (e) { note = 'test error: ' + String(e.message).split('\n')[0].slice(0, 100); }
      r.fixes.push({ id: fx.id, ask: fx.ask, ok, note });
      if (!ok && /^play-/.test(fx.id || '')) r.check.push(`Play test failing: "${fx.ask}"${note ? ' (' + note + ')' : ''}`);
      else if (!ok) r.fail.push(`Owner's fix NOT done yet: "${fx.ask}"${note ? ' (' + note + ')' : ''}`);
    }
    if (r.fixes.length) {
      const fixJpg = await page.screenshot({ type: 'jpeg', quality: 62 });
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
  } catch (e) {}
  // FRIEND CODES (owner, 2026-10-17): every game needs "Play a friend" with friend codes (STORE-READY.md "Friend codes")
  try {
    const src2 = fs.readFileSync(path.join(process.cwd(), g.file), 'utf8');
    if (!/friend/i.test(src2)) r.check.push(`No friend codes yet - add a "👥 Play a friend" button (My code / Enter a friend's code) with ApexKit.friend and a 'play-friend-code' test (STORE-READY.md "Friend codes")`);
    else if (!(r.fixes || []).some(x => /^play-friend/.test(x.id || ''))) r.check.push(`Friend codes have no 'play-friend-code' test yet (STORE-READY.md "Friend codes")`);
  } catch (e) {}
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
  const upJpg = await p2.screenshot({ type: 'jpeg', quality: 62 });
  fs.writeFileSync(path.join(out, 'img', slug + '-3-upright.jpg'), upJpg); r.img.upright = 'img/' + slug + '-3-upright.jpg';
  const up = await measure(upJpg);
  const f3 = await pageFacts(p2).catch(() => ({ rotate: '' }));
  if (f3.rotate) r.fail.push(`Shows a rotate sign upright (landscape law says none): "${f3.rotate}"`);
  if (up.dark > 0.93 || up.std < 6) r.fail.push('Upright screen is black or blank');
  // SHARPNESS (owner: "get them to not make blurry players"): the 3D picture must be drawn at 1.5x or more on a 2x phone
  const sharp = await p2.evaluate(() => {
    const cs = [...document.querySelectorAll('canvas')].filter((c) => c.clientWidth > 200 && c.clientHeight > 100);
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
  await ctx2.close();

  for (const m of missing) r.fail.push('Missing file: ' + m);
  for (const e of [...shaderErr].slice(0, 2)) r.fail.push('Broken 3D shader (models using it are invisible): ' + e);
  for (const e of [...errors].slice(0, 4)) r.check.push('Script error: ' + e);
  } catch (e) {
    r.fail.push('The game froze the phone - the robot could not finish checking it (' + String(e.message || e).split('\n')[0].slice(0, 90) + ')');
    for (const c of browser.contexts()) if (c !== lab.context()) await c.close().catch(() => {});
  }
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
for (const m of models.filter(m => m.file && !/^(LOCKED|NO)/i.test(m.status || ''))) {
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
      const jpg = await page.screenshot({ type: 'jpeg', quality: 70 });
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
  md += `\n<img src="${r.img.menu}" width="300"> <img src="${r.img.play}" width="300"> <img src="${r.img.upright}" width="90">\n\n`;
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
  let base0 = {}; try { base0 = JSON.parse(fs.readFileSync(process.env.BASELINE || 'base-results.json', 'utf8')); } catch (e) {}
  const norm = (x) => x.replace(/\d+/g, '#');
  const old = new Map((base0.results || []).map(r => [r.file, new Set((r.fail || []).map(norm))]));
  const blockers = [];
  for (const r of results) for (const f of r.fail) { if (/owner'?s eyes/i.test(f)) continue; if (old.get(r.file) && old.get(r.file).has(norm(f))) continue; blockers.push(`${r.file}: ${f}`); }
  const oldM = new Set((base0.models || []).flatMap(m => (m.problems || []).map(x => m.name + '|' + norm(String(x)))));
  for (const m of models) for (const x of (m.problems || [])) if (!oldM.has(m.name + '|' + norm(String(x)))) blockers.push(`MODELS.md ${m.name}: ${x}`);
  fs.writeFileSync(path.join(out, 'blockers.txt'), blockers.join('\n'));
  if (blockers.length) { console.log('\nBLOCKED - this pull request adds problems main does not have:\n- ' + blockers.join('\n- ')); process.exit(1); }
  console.log('\nNo new problems - OK to merge.');
}
