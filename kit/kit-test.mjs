// Kit self-test (42 checks): python3 -m http.server 8890 from the repo root, then  node kit/kit-test.mjs
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:8890/';
const SHOTS = '/tmp/claude-0/-home-claude/81898504-4f8f-5e44-8a98-b61bbc166df4/scratchpad/';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const results = []; const ok = (name, pass, info = '') => { results.push({ name, pass: !!pass, info }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });

async function open(ctx, url) {
  const page = await ctx.newPage(); const errors = [], outside = [], missing = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('request', (q) => { if (!q.url().startsWith(BASE) && !q.url().startsWith('data:') && !q.url().startsWith('blob:')) outside.push(q.url()); });
  page.on('response', (r) => { if (r.status() >= 400) missing.push(r.status() + ' ' + r.url()); });
  await page.goto(BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(800);
  return { page, errors, outside, missing };
}
const T = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__test)));
async function drag(page, cdp, x0, y0, x1, y1, holdMs) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / 6, y: y0 + (y1 - y0) * i / 6, id: 1 }] }); await page.waitForTimeout(16); }
  const mid = await T(page); await page.waitForTimeout(holdMs);
  const held = await T(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(100);
  return { mid, held };
}

/* ================= landscape phone ================= */
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA });
let { page, errors, outside, missing } = await open(ctx, 'kit/demo.html');
const cdp = await ctx.newCDPSession(page);
let t = await T(page);
ok('window.__test populated before start', t.kit && t.kit.id === 'kitdemo' && t.car && 'distance' in t, JSON.stringify(t.kit));
ok('start screen shown, not started', (await page.isVisible('#akPlay')) && t.kit.started === false);
const keysBefore = await page.evaluate(() => Object.keys(localStorage));
await page.tap('#akPlay'); await page.waitForTimeout(600);
t = await T(page);
ok('Play starts the game + unlocks audio', t.kit.started && t.kit.audio === 'running', 'audio=' + t.kit.audio);

// joystick: drag up (forward) in the left zone
const z0 = t.car.z, d0 = t.distance;
let j = await drag(page, cdp, 140, 300, 140, 240, 1500);
ok('joystick reports input while held', j.held.kit.input && j.held.kit.input.y < -0.9, JSON.stringify(j.held.kit.input));
t = await T(page);
ok('joystick moves the box forward', t.distance - d0 > 3 && Math.abs(t.car.z - z0) > 3, `dist ${d0}->${t.distance}, z ${z0}->${t.car.z}`);
ok('camera follows the box (chase)', Math.hypot(t.camera.x - t.car.x, t.camera.z - t.car.z) < 12 && t.camera.y > 2, JSON.stringify(t.camera));
ok('joystick returns to zero on release', t.kit.input.x === 0 && t.kit.input.y === 0);
// steer right
const h0 = t.car.heading; await drag(page, cdp, 140, 300, 200, 250, 700); t = await T(page);
ok('joystick x steers the box', Math.abs(t.car.heading - h0) > 0.2, `heading ${h0}->${t.car.heading}`);

// action button + sound
await page.tap('#akBtn-horn'); await page.waitForTimeout(150); t = await T(page);
ok('HORN button fires once per press (sound)', t.horns === 1 && t.kit.audio === 'running', 'horns=' + t.horns);
await page.screenshot({ path: SHOTS + 'kit-demo.png' });

// keyboard fallback
const dk = t.distance; await page.keyboard.down('KeyW'); await page.waitForTimeout(800); const kin = (await T(page)).kit.input; await page.keyboard.up('KeyW'); t = await T(page);
ok('keyboard fallback (W) drives', kin.y === -1 && t.distance - dk > 1, JSON.stringify(kin));
await page.keyboard.press('Space'); await page.waitForTimeout(100); t = await T(page);
ok('keyboard Space = first button', t.horns === 2);

// pause menu
await page.tap('#akPauseBtn'); await page.waitForTimeout(300); t = await T(page);
ok('pause button opens menu + pauses', t.kit.paused && t.kit.menu === 'main' && await page.isVisible('#akResume'));
const frozen = t.distance; await page.waitForTimeout(500); ok('game frozen while paused', (await T(page)).distance === frozen);
const btnSizes = await page.$$eval('#akMenu [data-page=main] button', (bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
ok('menu buttons are big touch targets (>=48px)', btnSizes.every(([w, h]) => w >= 48 && h >= 48), JSON.stringify(btnSizes));
const menuFits = await page.$eval('#akMenu .ak-card', (c) => { const r = c.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; });
ok('pause menu fits the landscape screen', menuFits);
await page.screenshot({ path: SHOTS + 'kit-pause.png' });
// settings
await page.tap('#akSettings'); await page.waitForTimeout(200); t = await T(page);
ok('settings page opens', t.kit.menu === 'settings');
await page.tap('#akQuality [data-q=medium]'); await page.waitForTimeout(100); t = await T(page);
ok('graphics quality Medium applies + caps pixel ratio', t.kit.quality === 'medium' && t.kit.pixelRatio <= 1.25, 'pr=' + t.kit.pixelRatio);
await page.$eval('#akMusicVol', (e) => { e.value = '0.3'; e.dispatchEvent(new Event('input')); }); t = await T(page);
ok('music volume slider', Math.abs(t.kit.musicVolume - 0.3) < 1e-6);
await page.screenshot({ path: SHOTS + 'kit-settings.png' });
await page.tap('#akMenu [data-page=settings] [data-act=main]');
// credits
await page.tap('#akCreditsBtn'); await page.waitForTimeout(200);
const ctext = await page.innerText('#akCredits');
ok('credits screen lists the entry + Made by Apex Arcade', /Example Cone/.test(ctext) && /Sample Maker/.test(ctext) && /CC-BY 4\.0/.test(ctext) && /Made by Apex Arcade/i.test(ctext), ctext.replace(/\n/g, ' | ').slice(0, 160));
ok('credits source is text, not an outside link', (await page.$$('#akCredits a')).length === 0);
await page.screenshot({ path: SHOTS + 'kit-credits.png' });
await page.tap('#akCredits ~ .ak-grid [data-act=main]'); await page.tap('#akResume'); await page.waitForTimeout(300); t = await T(page);
ok('Resume closes menu + unpauses', !t.kit.paused && t.kit.menu === null && !(await page.isVisible('#akMenu')));
// restart
await page.tap('#akPauseBtn'); await page.tap('#akRestart'); await page.waitForTimeout(200); t = await T(page);
ok('Restart calls onRestart (distance reset)', t.distance < 0.5 && !t.kit.paused, 'dist=' + t.distance);

// save
const sv = await page.evaluate(() => { const K = window.ApexKit; const a = K.save.set('best', { score: 42 }); return { a, got: K.save.get('best'), miss: K.save.get('nope', 'fb'), raw: localStorage.getItem('apexkit:kitdemo:best') }; });
ok('save set/get + fallback + namespaced key with version', sv.a && sv.got.score === 42 && sv.miss === 'fb' && /"v":1/.test(sv.raw), JSON.stringify(sv));
// mute
await page.tap('#akMute'); await page.waitForTimeout(100); t = await T(page);
ok('mute button mutes', t.kit.muted === true);
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800); t = await T(page);
const after = await page.evaluate(() => ({ best: window.ApexKit.save.get('best'), gm: localStorage.getItem('apex_muted'), keys: Object.keys(localStorage) }));
ok('mute persists across reload (+ house apex_muted flag)', t.kit.muted === true && after.gm === '1' && (await page.getAttribute('#akMute', 'data-muted')) === '1');
ok('save persists across reload', after.best && after.best.score === 42);
ok('quality + music volume persist across reload', t.kit.quality === 'medium' && Math.abs(t.kit.musicVolume - 0.3) < 1e-6);
const newKeys = after.keys.filter((k) => !keysBefore.includes(k));
ok('only touches its own keys (apexkit:kitdemo:* + apex_muted)', newKeys.every((k) => k.startsWith('apexkit:kitdemo:') || k === 'apex_muted'), newKeys.join(', '));
ok('__test is read-only', await page.evaluate(() => { window.__test = 5; try { window.__test.kit = 1; } catch (e) {} return typeof window.__test === 'object' && typeof window.__test.kit === 'object'; }));
// global mute honoured by a fresh game with no own save
const gm = await page.evaluate(() => { localStorage.removeItem('apexkit:kitdemo:kit.audio'); localStorage.setItem('apex_muted', '1'); });
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(600); t = await T(page);
ok('honours house-wide apex_muted when the game has no own setting', t.kit.muted === true);
await page.evaluate(() => { localStorage.setItem('apex_muted', '0'); localStorage.removeItem('apexkit:kitdemo:kit.audio'); });

// auto quality (dpr 2 -> High cap 1.5 on touch)
await page.evaluate(() => { const K = window.ApexKit; K.perf.setQuality('high'); });
await page.tap('#akPlay'); await page.waitForTimeout(300);
const aq = await page.evaluate(() => { const P = window.ApexKit.perf, out = [P.pixelRatio]; P._cool = 0; P._sample(30); P._sample(30); out.push(P.pixelRatio); P._cool = 0; for (let i = 0; i < 3; i++) P._sample(60); out.push(P.pixelRatio); P._cool = 0; for (let i = 0; i < 12; i++) P._sample(20); out.push(P.pixelRatio); return out; });
ok('auto quality: drops under 45 fps, rises with headroom, never below 1', aq[1] < aq[0] && aq[2] > aq[1] && aq[3] === 1, JSON.stringify(aq));
const canvasPR = await page.evaluate(() => document.getElementById('c').width / document.getElementById('c').clientWidth);
ok('renderer buffer follows the pixel ratio', Math.abs(canvasPR - 1) < 0.05, 'ratio=' + canvasPR.toFixed(2));
// back
await page.tap('#akPauseBtn'); await page.tap('#akBack'); await page.waitForTimeout(800);
ok('Back goes to Game Development (sports.html)', /\/sports\.html$/.test(page.url()), page.url());
ok('no page errors (landscape)', errors.length === 0, errors.slice(0, 3).join(' | '));
ok('no outside network + no missing files', outside.length === 0 && missing.length === 0, [...outside, ...missing].slice(0, 3).join(' | '));
await ctx.close();

/* ================= ?fps=1 ================= */
const ctx3 = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: UA });
let r3 = await open(ctx3, 'kit/demo.html?fps=1'); await r3.page.tap('#akPlay'); await r3.page.waitForTimeout(2500);
const fpsTxt = (await r3.page.isVisible('#akFps')) ? await r3.page.innerText('#akFps') : '';
ok('fps meter shows with ?fps=1', /\d+ fps/.test(fpsTxt), fpsTxt);
const r3b = await open(ctx3, 'kit/demo.html'); ok('no fps meter without ?fps=1', !(await r3b.page.$('#akFps')));
ok('no page errors (fps)', r3.errors.length === 0 && r3b.errors.length === 0, r3.errors.concat(r3b.errors).join(' | '));
await ctx3.close();

/* ================= upright phone (landscape law) ================= */
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA });
const r2 = await open(ctx2, 'kit/demo.html'); const p2 = r2.page, cdp2 = await ctx2.newCDPSession(p2);
const sign = await p2.evaluate(() => /rotate your|turn your (phone|device)/i.test(document.body.innerText));
ok('upright: no rotate sign', !sign);
await p2.tap('#akPlay'); await p2.waitForTimeout(400);
const buf = await p2.evaluate(() => { const c = document.getElementById('c'); return [c.width, c.height]; });
ok('upright: renderer sized to the landscape box', buf[0] > buf[1], JSON.stringify(buf));
// in the rotated stage, the landscape "up" is visually to the RIGHT; the zone sits at the visual bottom-left of the turned picture
const zr = await p2.$eval('#akJoyZone', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
const t2a = await T(p2); const jj = await drag(p2, cdp2, zr.x, zr.y, zr.x + 60, zr.y, 1200); const t2b = await T(p2);
ok('upright: joystick remapped to the landscape frame (visual right = forward)', jj.held.kit.input.y < -0.9 && t2b.distance - t2a.distance > 2, JSON.stringify(jj.held.kit.input));
await p2.screenshot({ path: SHOTS + 'kit-upright.png' });
ok('no page errors (upright)', r2.errors.length === 0, r2.errors.join(' | '));
await ctx2.close();

await browser.close();
const f = results.filter((r) => !r.pass);
console.log(`\n${results.length - f.length}/${results.length} passed`);
process.exit(f.length ? 1 : 0);
