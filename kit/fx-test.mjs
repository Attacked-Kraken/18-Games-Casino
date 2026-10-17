// Effects pack self-test: python3 -m http.server 8891 from the repo root, then  node kit/fx-test.mjs
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:8891/';
const SHOTS = process.env.SHOTS || './';
const results = []; const ok = (n, p, i = '') => { results.push(p); console.log((p ? 'PASS ' : 'FAIL ') + n + (i ? '  ' + i : '')); };
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const errors = [], outside = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' || /THREE\.WebGLProgram|shader/i.test(m.text())) errors.push(m.text()); });
page.on('request', (q) => { if (!q.url().startsWith(BASE) && !q.url().startsWith('data:') && !q.url().startsWith('blob:')) outside.push(q.url()); });
await page.goto(BASE + 'kit/fx-demo.html', { waitUntil: 'load' }); await page.waitForFunction(() => window.__test && window.__test.fx.time > 2, null, { timeout: 30000 });
const T = () => page.evaluate(() => window.__test);
let t = await T();
ok('effects pack loads', t && t.fx && t.fx.version === '1.0.0', JSON.stringify(t && t.fx));
ok('waves + glows set up', t.fx.waves === 3 && t.fx.glows === 6, `waves ${t.fx.waves} glows ${t.fx.glows}`);
ok('automatic ice/dust bursts run', t.fx.bursts >= 1 && t.fx.particles > 0, `bursts ${t.fx.bursts} particles ${t.fx.particles}`);
ok('crowd flashes twinkle', t.fx.flashes > 3, 'flashes ' + t.fx.flashes);
for (const k of ['ice', 'dust', 'dirt', 'sparks', 'confetti', 'splash', 'smoke']) {
  const before = ((await T()).fx.alive || {})[k] || 0;
  await page.click(`button[data-k="${k}"]`); await page.waitForTimeout(300);
  const after = (await T()).fx.alive[k] || 0;
  ok(`button ${k} makes particles`, after > before, `${before} -> ${after}`);
}
await page.click('button[data-k="confetti"]'); await page.waitForTimeout(150);
await page.screenshot({ path: SHOTS + 'fx-demo.png' });
const f1 = (await T()).fx.flashes; await page.click('button[data-k="flash"]'); await page.waitForTimeout(100);
ok('goal event: flashes burst', (await T()).fx.flashes >= f1 + 50);
const p1 = (await T()).fx.particles; await page.waitForTimeout(3500);
ok('particles fade out (nothing piles up)', (await T()).fx.particles < p1 + 60, `${p1} -> ${(await T()).fx.particles}`);
const t1 = (await T()).fx.time; await page.waitForTimeout(500); ok('shared clock runs', (await T()).fx.time > t1);
const g = await page.evaluate(() => { const s = []; const st = performance.now(); return new Promise((r) => { let n = 0; (function f() { n++; if (performance.now() - st < 2000) requestAnimationFrame(f); else r(n / 2); })(); }); });
ok('frame rate measured', g > 0, Math.round(g) + ' fps (software graphics)');
ok('math helpers', await page.evaluate(() => { const m = window.ApexFX.math; const v = m.noise2(1.3, 2.7); return v >= 0 && v <= 1 && m.clamp(5, 0, 1) === 1 && m.lerp(0, 10, .5) === 5; }));
ok('no errors (incl. shader compile)', errors.length === 0, errors.slice(0, 3).join(' | '));
ok('no internet requests', outside.length === 0, outside.slice(0, 2).join(' '));
// sounds answer the same signal (a stand-in kit records which sounds were asked for)
const p2 = await ctx.newPage(); const err2 = []; p2.on('pageerror', (e) => err2.push(e.message));
await p2.addInitScript(() => { window.__played = []; window.ApexKit = { audio: { sfx: (n) => { window.__played.push(n); return true; } }, test: { expose() {} } }; });
await p2.goto(BASE + 'kit/fx-demo.html', { waitUntil: 'load' }); await p2.waitForTimeout(800);
const r = await p2.evaluate(() => { window.ApexKit.emit('goal', { pos: { x: 0, y: 0, z: 0 } }); window.__fx.emit('hit', {}); return { played: window.__played.slice(), sameBus: typeof window.ApexKit.emit === 'function' }; });
ok('goal signal plays the horn + hit plays hit', r.played.includes('horn') && r.played.includes('hit'), JSON.stringify(r.played));
ok('ApexKit.emit is the same signal as fx.emit', r.sameBus);
await p2.waitForTimeout(400);
ok('goal signal through the kit also fires confetti', ((await p2.evaluate(() => window.__test.fx.alive)).confetti || 0) > 0);
ok('no errors with the kit linked', err2.length === 0, err2.slice(0, 2).join(' | '));
await browser.close();
const pass = results.filter(Boolean).length; console.log(`\n${pass}/${results.length} passed`); process.exit(pass === results.length ? 0 : 1);
