// RECORD 60 (owner Oct 25 2026 11:24 PM: "find a way to make these recordings ... something autonomous").
// The robot plays ONE game for 60 seconds, sideways like the owner's phone (844x390), and makes the recording itself:
//   video.mp4            - the whole 60 seconds (Playwright screen video -> ffmpeg)
//   frames/t00..t60.jpg  - one picture every 10 s (the director's contact sheet)
//   measures.json        - numbers read from the running game, sampled every 0.5 s:
//        camera distance / height / aim error to the player, player on screen (% of samples, size in px),
//        player speed (game's own), score / finish words seen, every on-screen text change (the "big moments"), fps.
// SPEC: looks/<game>/spec60.json = ranges from a recording the owner / director BLESSED (BLESS=1). Later runs are compared
// with it and print PASS / FAIL lines - so "does it feel like the one he liked" becomes numbers, no human needed.
// Usage: GAME=apexracer.html node tools/record60/record60.mjs http://127.0.0.1:8811/ rec-out      (BLESS=1 to save the spec)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const base = process.argv[2] || 'http://127.0.0.1:8811/';
const out = process.argv[3] || 'rec-out';
const GAME = process.env.GAME || 'apexracer.html';
const SECONDS = +(process.env.REC_SECONDS || process.env.SECONDS || 60);
const cfg = JSON.parse(fs.readFileSync('tools/game-check/games.json', 'utf8'));
const g = cfg.games.find(x => x.file === GAME);
if (!g) { console.error('game not in games.json: ' + GAME); process.exit(2); }
const slug = GAME.replace('.html', '');
const dir = path.join(out, slug); fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

// remembers every THREE camera (same trap the game check uses)
const PROBE = () => {
  window.__cams = [];
  Object.defineProperty(Object.prototype, 'isCamera', { configurable: true, set(v) {
    Object.defineProperty(this, 'isCamera', { value: v, writable: true, enumerable: true, configurable: true });
    try { if (v && window.__cams.length < 40) window.__cams.push(this); } catch (e) {}
  }, get() { return undefined; } });
  // the camera the game REALLY draws with: wrap render() on the game's renderer and remember its camera
  Object.defineProperty(Object.prototype, 'isWebGLRenderer', { configurable: true, set(v) {
    Object.defineProperty(this, 'isWebGLRenderer', { value: v, writable: true, enumerable: true, configurable: true });
    try { if (v) { const r0 = this.render; this.render = function (sc, cam) { window.__renderCam = cam; return r0.apply(this, arguments); }; } } catch (e) {}
  }, get() { return undefined; } });
};

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: IPHONE_UA,
  recordVideo: { dir: path.join(dir, 'raw'), size: { width: 844, height: 390 } } });
await ctx.addInitScript(PROBE);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e.message).split('\n')[0].slice(0, 140)));
await page.goto(base + GAME, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
for (const step of g.start || []) {
  const loc = step.startsWith('text=') ? page.getByText(step.slice(5), { exact: false }).first() : /^[#.\[]/.test(step) ? page.locator(step).first() : page.getByText(step, { exact: false }).first();
  try { if ((await loc.count()) && (await loc.isVisible())) { await loc.click({ timeout: 2500, force: true }); await page.waitForTimeout(1500); } } catch (e) {}
}
if (!(g.start || []).length) { try { await page.touchscreen.tap(422, 195); } catch (e) {} }

// ---- the 60 seconds. Hold the gas (hook go(true) when the game has one, else the keys a player would use).
const sample = () => page.evaluate(() => {
  const R = window.__reality || {}; const o = {};
  try { o.t = typeof R.time === 'function' ? R.time() : null; } catch (e) {}
  try { o.speed = typeof R.speed === 'function' ? R.speed() : null; } catch (e) {}
  // First real run (Oct 25 11:45 PM): the render hook never fired and the last trapped camera sat at 0,0,0 (a cube/ortho helper).
  // The game's own camera = a PerspectiveCamera whose aspect matches the screen and that is not parked at the origin.
  const aspect = innerWidth / innerHeight;
  const isMain = c => { try { c.updateMatrixWorld(true); const e = c.matrixWorld.elements; return c.type === 'PerspectiveCamera' && Math.abs(c.aspect - aspect) < 0.06 && (Math.abs(e[12]) + Math.abs(e[13]) + Math.abs(e[14])) > 0.01; } catch (x) { return false; } };
  const cands = (window.__cams || []).filter(isMain);
  const cam = (window.__renderCam && isMain(window.__renderCam) ? window.__renderCam : null) || (R.camera && isMain(R.camera) ? R.camera : null) || cands.slice(-1)[0];
  const pl = R.player;
  if (cam && pl) try {
    cam.updateMatrixWorld && cam.updateMatrixWorld(true); pl.updateMatrixWorld && pl.updateMatrixWorld(true);
    const V = cam.position.constructor;
    const cp = new V().setFromMatrixPosition(cam.matrixWorld), pp = new V().setFromMatrixPosition(pl.matrixWorld);
    const fwd = new V(0, 0, -1).transformDirection(cam.matrixWorld);
    const to = pp.clone().sub(cp); const d = to.length();
    o.dist = d; o.height = cp.y - pp.y;
    o.aim = Math.acos(Math.max(-1, Math.min(1, fwd.dot(to.clone().normalize())))) * 180 / Math.PI;
    const s = pp.clone().project(cam); o.sx = (s.x + 1) / 2 * innerWidth; o.sy = (1 - s.y) / 2 * innerHeight; o.inFront = s.z < 1;
    o.on = o.inFront && o.sx > 0 && o.sx < innerWidth && o.sy > 0 && o.sy < innerHeight;
    o.cam = [cp.x, cp.y, cp.z]; o.pl = [pp.x, pp.y, pp.z];
  } catch (e) { o.err = String(e.message).slice(0, 60); }
  o.text = (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400);
  return o;
}).catch(() => ({}));
const FAITHFUL = process.env.FAITHFUL !== '0';   // Oct 26 2026 12:00 AM: run 2 showed the camera trailing the car by 100+ m - the hook's go() fast-forwards the sim 3 steps per tick but this software-GL browser draws ~2 frames/s, so the camera never caught up. FAITHFUL = keys only, the game's own loop, so camera + car stay in step (slower, true).
const go = async on => { if (!FAITHFUL) try { await page.evaluate(v => window.__reality && window.__reality.go && window.__reality.go(v), on); } catch (e) {}
  for (const k of ['ArrowUp', 'KeyW']) { try { on ? await page.keyboard.down(k) : await page.keyboard.up(k); } catch (e) {} } };
await go(true);
// ---- HUMAN PLAYER (owner Oct 25 2026 11:51 PM "a human aspect programmed in"): not gas-only. For a car it steers with A/D toward the
// track line the way a thumb does (reaction delay of one look, a wobble, an occasional lapse), brakes and drifts in tight corners, taps
// NITRO now and then, so the recording shows the whole game being USED (every control the owner can touch), not a car on rails.
const HUMAN = process.env.HUMAN !== '0'; const held = new Set(); let humanLog = { steer: 0, brake: 0, nitro: 0, drift: 0, lapses: 0 }; let nextNitro = 8000, nitroUntil = 0;
const setKey = async (k, on) => { try { if (on && !held.has(k)) { await page.keyboard.down(k); held.add(k); } else if (!on && held.has(k)) { await page.keyboard.up(k); held.delete(k); } } catch (e) {} };
const humanStep = async (wallMs) => {
  const r = await page.evaluate(() => { const R = window.__reality; if (!R || R.kind !== 'car' || !R.player || !R.track) return null;
    R.player.updateMatrixWorld(true); const e = R.player.matrixWorld.elements; const x = e[12], z = e[14];
    const t = R.track(x, z); if (!t) return null; const fl = Math.hypot(e[8], e[10]) || 1, tl = Math.hypot(t.x, t.z) || 1;
    const fx = e[8] / fl, fz = e[10] / fl, tx = t.x / tl, tz = t.z / tl;
    return { err: Math.atan2(fx * tz - fz * tx, fx * tx + fz * tz), sp: R.speed ? R.speed() : 0 }; }).catch(() => null);
  if (!r) { await setKey('KeyW', true); return; }
  if (Math.random() < 0.06) { humanLog.lapses++; return; }                       // a human looks away for a moment
  const e = r.err + (Math.random() - 0.5) * 0.06;                                  // and never steers perfectly
  const steerR = e < -0.07, steerL = e > 0.07;   // sign fixed by the first run: positive = track bends to the car's right
  await setKey('KeyD', e > 0.07); await setKey('KeyA', e < -0.07); if (e > 0.07 || e < -0.07) humanLog.steer++;
  const sharp = Math.abs(e) > 0.45 && r.sp > 30;
  await setKey('KeyS', sharp && Math.abs(e) > 0.7); if (sharp && Math.abs(e) > 0.7) humanLog.brake++;
  await setKey('KeyW', !(sharp && Math.abs(e) > 0.7));
  await setKey('ShiftLeft', sharp && Math.abs(e) <= 0.7); if (sharp && Math.abs(e) <= 0.7) humanLog.drift++;
  if (wallMs > nextNitro) { await setKey('Space', true); nitroUntil = wallMs + 1500; nextNitro = wallMs + 14000 + Math.random() * 6000; humanLog.nitro++; }
  if (wallMs > nitroUntil) await setKey('Space', false);
};
const samples = []; const t0 = Date.now(); let lastTxt = ''; const moments = []; let nextShot = 0;
const frames = [];
const WALLCAP = +(process.env.WALLCAP || SECONDS * 5); let gt0 = null;
while ((Date.now() - t0) / 1000 < WALLCAP) {
  const wall = (Date.now() - t0) / 1000;
  const pre = await sample(); if (typeof pre.t === 'number') { if (gt0 === null) gt0 = pre.t; }
  const el = typeof pre.t === 'number' && gt0 !== null ? pre.t - gt0 : wall;
  if (el >= SECONDS) break;
  const s = pre; s.at = +el.toFixed(1); s.wall = +wall.toFixed(1); samples.push(s);
  const words = (s.text || '').replace(/[0-9:.,]+/g, '#');          // numbers change every tick; only a WORD change is a moment
  if (words !== lastTxt) { const added = words.split(' ').filter(w => w.length > 2 && !lastTxt.includes(w)).slice(0, 6).join(' '); if (added && el > 1) moments.push({ at: +el.toFixed(1), words: added }); lastTxt = words; }
  if (el >= nextShot) { const f = 't' + String(Math.round(nextShot)).padStart(2, '0') + '.jpg'; try { fs.writeFileSync(path.join(dir, 'frames', f), await page.screenshot({ type: 'jpeg', quality: 70, timeout: 20000 })); frames.push(f); } catch (e) {} nextShot += 10; }
  if (HUMAN) await humanStep(Date.now() - t0);
  await page.waitForTimeout(150);
}
for (const k of [...held]) await setKey(k, false);
const gameSeconds = samples.length ? samples.at(-1).at : 0;
await go(false);
const fpsNow = await page.evaluate(() => new Promise(res => { let n = 0; const a = performance.now(); const f = () => { n++; performance.now() - a < 1000 ? requestAnimationFrame(f) : res(n); }; requestAnimationFrame(f); })).catch(() => 0);
const camDebug = await page.evaluate(() => (window.__cams || []).slice(-6).map(c => { try { c.updateMatrixWorld(true); const e = c.matrixWorld.elements; return { type: c.type, fov: c.fov, aspect: c.aspect, pos: [e[12], e[13], e[14]].map(v => +v.toFixed(1)), isRender: c === window.__renderCam, parent: c.parent && c.parent.type }; } catch (x) { return { err: String(x) }; } })).catch(() => []);
const endText = await page.evaluate(() => (document.body.innerText || '').slice(0, 1500)).catch(() => '');
const raw = await page.video().path().catch(() => null);
await ctx.close(); await browser.close();
let video = null;
if (raw && fs.existsSync(raw)) { const mp4 = path.join(dir, 'video.mp4');
  const wallTotal = (Date.now() - t0) / 1000, sp = FAITHFUL && wallTotal > SECONDS * 1.3 ? SECONDS / wallTotal : 1;
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-vf', 'setpts=' + sp.toFixed(4) + '*PTS', '-r', '25', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-pix_fmt', 'yuv420p', '-an', mp4]);
  if (r.status === 0) video = 'video.mp4';
  else { try { fs.copyFileSync(raw, path.join(dir, 'video.webm')); video = 'video.webm'; } catch (e) {} } }
fs.rmSync(path.join(dir, 'raw'), { recursive: true, force: true });

// ---- numbers
const num = k => samples.map(s => s[k]).filter(v => typeof v === 'number' && isFinite(v));
const st = a => a.length ? { min: +Math.min(...a).toFixed(2), mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), max: +Math.max(...a).toFixed(2) } : null;
const withCam = samples.filter(s => typeof s.dist === 'number');
// follow lag = how far the camera's gap to the player stretches while speed climbs (metres of gap per m/s)
let lag = null; { const p = samples.filter(s => typeof s.dist === 'number' && typeof s.speed === 'number');
  if (p.length > 8) { const mx = p.reduce((a, s) => a + s.speed, 0) / p.length, my = p.reduce((a, s) => a + s.dist, 0) / p.length;
    let sxy = 0, sxx = 0; for (const s of p) { sxy += (s.speed - mx) * (s.dist - my); sxx += (s.speed - mx) ** 2; } lag = sxx > 1e-6 ? +(sxy / sxx).toFixed(3) : 0; } }
const sp = num('speed'); const moved = samples.length > 2 && samples[0].pl && samples.at(-1).pl ? Math.hypot(samples.at(-1).pl[0] - samples[0].pl[0], samples.at(-1).pl[2] - samples[0].pl[2]) : null;
const finishWords = /\b(finish(ed)?|you win|winner|goal|score|lap|checkered|game over|results?)\b/i;
const m = {
  game: GAME, name: g.name, seconds: SECONDS, gameSecondsReached: gameSeconds, wallSeconds: +((Date.now() - t0) / 1000).toFixed(1), at: new Date().toISOString(), samples: samples.length, video, frames,
  hook: { camera: withCam.length > 0, speed: sp.length > 0 },
  camera: withCam.length ? { distance: st(num('dist')), height: st(num('height')), aimErrorDeg: st(num('aim')), followLagMetresPerMps: lag } : null,
  playerOnScreenPct: withCam.length ? Math.round(100 * withCam.filter(s => s.on).length / withCam.length) : null,
  speed: st(sp), metresMoved: moved === null ? null : +moved.toFixed(1),
  moments: moments.slice(0, 40), momentCount: moments.length,
  humanLog, camDebug, endedWithResultWords: finishWords.test(endText), fpsAtEnd: fpsNow, scriptErrors: errors.slice(0, 5),
};
fs.writeFileSync(path.join(dir, 'samples.json'), JSON.stringify(samples.map(({ text, ...r }) => r)));
fs.writeFileSync(path.join(dir, 'measures.json'), JSON.stringify(m, null, 1));

// ---- compare with the blessed spec (looks/<game>/spec60.json)
const specPath = path.join('looks', slug, 'spec60.json'); const lines = [];
const range = (v, mean, tol = 0.25) => ({ lo: +(mean * (1 - tol)).toFixed(2), hi: +(mean * (1 + tol)).toFixed(2) });
if (process.env.BLESS === '1' && m.camera) {
  const spec = { blessedAt: m.at, from: 'recording of ' + SECONDS + ' s', note: 'ranges = the blessed recording mean +/- 25%; edit by hand to tighten', 
    distance: range(0, m.camera.distance.mean), height: { lo: +(m.camera.height.mean - 1).toFixed(2), hi: +(m.camera.height.mean + 1).toFixed(2) },
    aimErrorDegMax: +(Math.max(8, m.camera.aimErrorDeg.max * 1.25)).toFixed(1), playerOnScreenPctMin: Math.max(80, m.playerOnScreenPct - 10),
    momentsMin: Math.max(1, Math.floor(m.momentCount * 0.6)), metresMovedMin: m.metresMoved ? Math.floor(m.metresMoved * 0.6) : null };
  fs.mkdirSync(path.dirname(specPath), { recursive: true }); fs.writeFileSync(specPath, JSON.stringify(spec, null, 1)); lines.push('BLESSED: spec saved to ' + specPath);
} else if (fs.existsSync(specPath)) {
  const sp2 = JSON.parse(fs.readFileSync(specPath, 'utf8')); const chk = (ok, why) => lines.push((ok ? 'PASS ' : 'FAIL ') + why);
  if (!m.camera) lines.push('YELLOW the game gives the robot no camera/player (window.__reality camera + player) - camera numbers cannot be compared');
  else {
    chk(m.camera.distance.mean >= sp2.distance.lo && m.camera.distance.mean <= sp2.distance.hi, 'camera distance ' + m.camera.distance.mean + ' m (spec ' + sp2.distance.lo + '-' + sp2.distance.hi + ')');
    chk(m.camera.height.mean >= sp2.height.lo && m.camera.height.mean <= sp2.height.hi, 'camera height ' + m.camera.height.mean + ' m (spec ' + sp2.height.lo + '-' + sp2.height.hi + ')');
    chk(m.camera.aimErrorDeg.max <= sp2.aimErrorDegMax, 'camera aim error max ' + m.camera.aimErrorDeg.max + ' deg (spec up to ' + sp2.aimErrorDegMax + ')');
    chk(m.playerOnScreenPct >= sp2.playerOnScreenPctMin, 'player on screen ' + m.playerOnScreenPct + '% (spec at least ' + sp2.playerOnScreenPctMin + '%)');
  }
  chk(m.momentCount >= sp2.momentsMin, 'big moments seen ' + m.momentCount + ' (spec at least ' + sp2.momentsMin + ')');
  if (sp2.metresMovedMin) chk(m.metresMoved !== null && m.metresMoved >= sp2.metresMovedMin, 'player moved ' + m.metresMoved + ' m in ' + SECONDS + ' s (spec at least ' + sp2.metresMovedMin + ')');
} else lines.push('NO SPEC YET for ' + slug + ' - this recording can be blessed (BLESS=1, or the owner / director says "bless this one").');
if (errors.length) lines.push('FAIL script errors: ' + errors.slice(0, 3).join(' | '));
fs.writeFileSync(path.join(dir, 'verdict.txt'), lines.join('\n') + '\n');
console.log(JSON.stringify(m, null, 1).slice(0, 1800)); console.log('\n' + lines.join('\n'));
