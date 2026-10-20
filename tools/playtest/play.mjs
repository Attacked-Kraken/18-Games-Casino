// PLAY TESTERS (owner Oct 20 12:19 AM: "we need like 4 game testers ... games that improve overnight on their own").
// Unlike the game check (which only presses Start and takes pictures), a tester really PLAYS each game for a few
// minutes in 3 styles, like a kid with a phone, and writes down what went wrong:
//   gas    = holds forward/up + taps the biggest buttons  (racers, trucks, planes)
//   masher = taps every button it can see, fast, + random keys
//   swiper = drags across the screen (aim, steer, swing)
// It watches for: script errors, frozen screen, nothing happens when it plays, very low fps, game over too soon,
// no way to play again, buttons off the screen. Each problem gets a picture.
// Usage: GAMES=apexhockey.html,apexf1.html node tools/playtest/play.mjs http://127.0.0.1:8811/ playtest-out
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const base = process.argv[2] || 'http://127.0.0.1:8811/';
const out = process.argv[3] || 'playtest-out';
const ROUND_S = +(process.env.ROUND_S || 70);           // seconds per style
const cfg = JSON.parse(fs.readFileSync('tools/game-check/games.json', 'utf8'));
const want = (process.env.GAMES || '').split(',').filter(Boolean);
const games = cfg.games.filter(g => !want.length || want.includes(g.file)).filter(g => fs.existsSync(g.file));
fs.mkdirSync(path.join(out, 'img'), { recursive: true });

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const lab = await browser.newPage();
const measure = (jpg) => lab.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = 96; c.height = 54;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, 96, 54);
  const d = x.getImageData(0, 0, 96, 54).data; const lum = [];
  for (let i = 0; i < d.length; i += 4) lum.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
  return lum;
}, jpg.toString('base64'));
const changed = (a, b) => a.filter((v, i) => Math.abs(v - b[i]) > 12).length / a.length;

const OVER = /\b(game over|you lose|you win|you crashed|final score|time'?s up|race over|race finished)\b/i;
const AGAIN = /^(play again|try again|retry|restart|again|race again|rematch|continue|next|next level|↻|⟲)/i;

async function pressStep(page, step) {
  const loc = step.startsWith('text=') ? page.getByText(step.slice(5), { exact: false }).first()
    : /^[#.\[]/.test(step) ? page.locator(step).first() : page.getByText(step, { exact: false }).first();
  try { if (!(await loc.count()) || !(await loc.isVisible())) return false;
    await loc.click({ timeout: 2500, force: true }); await page.waitForTimeout(1500); return true; } catch (e) { return false; }
}
// every visible button-like thing on screen right now
const buttons = (page) => page.evaluate(() => {
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 8 && r.height > 8 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const W = innerWidth, H = innerHeight;
  return [...document.querySelectorAll('button,[role=button],a[href="#"],.btn,[onclick],[ontouchstart]')].filter(vis).map(el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, off: r.bottom > H + 2 || r.right > W + 2,
      t: (el.innerText || el.getAttribute('aria-label') || el.id || '').trim().replace(/\s+/g, ' ').slice(0, 30) };
  });
});
const text = (page) => page.evaluate(() => (document.body.innerText || '').slice(0, 3000)).catch(() => '');
const fps = (page) => page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now();
  const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }))
  .catch(() => 0);

async function playStyle(page, style, R, slug) {
  const keysGas = ['ArrowUp', 'KeyW'], keysAll = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Enter'];
  const t0 = Date.now(); let prev = null, still = 0, lowFps = 0, overs = 0, againOk = 0, againMiss = 0, moves = 0, samples = 0;
  const shot = async () => { try { return await page.screenshot({ type: 'jpeg', quality: 40, timeout: 30000 }); } catch (e) { return null; } };
  const pic = async (name, jpg) => { if (!jpg) return ''; const f = `img/${slug}-${style}-${name}.jpg`; fs.writeFileSync(path.join(out, f), jpg); return f; };
  const cdp = await page.context().newCDPSession(page).catch(() => null);
  const hold = async () => { // a finger held on the lowest-right control (DRIVE / gas / throttle)
    const bs = (await buttons(page).catch(() => [])).filter(b => !b.off && b.x > 422 && b.y > 195);
    const b = bs.sort((a, c) => (c.x + c.y) - (a.x + a.y))[0] || { x: 770, y: 315 };
    if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y, id: 7 }] }).catch(() => {});
  };
  const lift = async () => { if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => {}); };
  if (style === 'gas') { for (const k of keysGas) await page.keyboard.down(k).catch(() => {}); await hold(); }
  while (Date.now() - t0 < ROUND_S * 1000) {
    // never press pause / menu / leave / sound buttons - that stops the game and looks like 'controls don't respond'
    const bs = (await buttons(page).catch(() => [])).filter(b => !b.off && !/pause|menu|back|home|quit|exit|setting|sound|music|mute|game development|⏸|ii$|✕|×/i.test(b.t));
    const W = 844, H = 390;
    try {
      if (style === 'gas') {
        if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 770 + Math.random() * 4, y: 300, id: 7 }] }).catch(() => {});
      } else if (style === 'masher') {
        for (let i = 0; i < 4; i++) { const b = bs[Math.floor(Math.random() * bs.length)];
          if (b) await page.touchscreen.tap(b.x, b.y); else await page.touchscreen.tap(Math.random() * W, Math.random() * H);
          await page.keyboard.press(keysAll[Math.floor(Math.random() * keysAll.length)]).catch(() => {}); }
      } else {
        const x = 150 + Math.random() * 540, y = 80 + Math.random() * 230;
        await page.mouse.move(x, y); await page.mouse.down();
        await page.mouse.move(x + (Math.random() - 0.5) * 400, y + (Math.random() - 0.5) * 200, { steps: 8 }); await page.mouse.up();
      }
    } catch (e) {}
    await page.waitForTimeout(900);
    const jpg = await shot(); if (!jpg) { R.problems.push({ what: `${style}: the robot couldn't take a picture (the game may have frozen the phone)` }); break; }
    const lum = await measure(jpg); samples++;
    if (prev) { const c = changed(prev, lum); if (c > 0.02) { moves++; still = 0; } else still++; }
    prev = lum;
    if (still === 8) {   // a calm sky/sea barely changes the picture - only call it frozen when the game loop really stopped
      const f0 = await fps(page);
      if (f0 < 5) R.problems.push({ what: `${style}: the game FROZE (screen and game loop stopped ~15 s)`, img: await pic('still', jpg) });
    }
    const f = samples % 5 === 0 ? await fps(page) : 99; if (f && f < 15) lowFps++;
    const tx = await text(page);
    if (OVER.test(tx)) {
      overs++;
      if (overs === 1) R.firstOverS = Math.round((Date.now() - t0) / 1000);
      const ag = (await buttons(page).catch(() => [])).find(b => AGAIN.test(b.t));
      if (ag) { againOk++; if (ag.off) R.problems.push({ what: `"${ag.t}" button is below the screen`, img: await pic('off', jpg) });
        await lift(); await page.touchscreen.tap(ag.x, Math.min(ag.y, 385)).catch(() => {}); await page.waitForTimeout(1500);
        for (const s of R.start) await pressStep(page, s); }
      else if (++againMiss === 3) R.problems.push({ what: `${style}: round ended but no Play again / Retry button`, img: await pic('noagain', jpg) });
      if (style === 'gas') { for (const k of keysGas) await page.keyboard.down(k).catch(() => {}); await hold(); }
    }
  }
  if (style === 'gas') { for (const k of keysGas) await page.keyboard.up(k).catch(() => {}); await lift(); }
  const motion = samples > 1 ? Math.round(100 * moves / (samples - 1)) : 0;
  if (motion < 25) R.problems.push({ what: `${style}: playing it changed the screen only ${motion}% of the time (controls may not respond)`, img: await pic('dull', await shot()) });
  if (lowFps >= 3) R.problems.push({ what: `${style}: slow - under 15 fps several times` });
  R.styles[style] = { motion, overs, againOk, lowFps };
  R.end = R.end || await pic('end', await shot());
}

const results = [];
for (const g of games) {
  const slug = g.file.replace('.html', '');
  const R = { file: g.file, name: g.name, start: g.start || [], problems: [], styles: {}, errors: [] };
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  const page = await ctx.newPage();
  page.on('pageerror', e => { const m = String(e.message || e).split('\n')[0].slice(0, 140); if (!R.errors.includes(m) && R.errors.length < 5) R.errors.push(m); });
  try {
    await page.goto(base + g.file, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(4000);
    for (const style of ['gas', 'masher', 'swiper']) {
      await page.goto(base + g.file, { waitUntil: 'load', timeout: 60000 }).catch(() => {}); await page.waitForTimeout(3000);
      for (const s of R.start) await pressStep(page, s);
      await playStyle(page, style, R, slug);
    }
  } catch (e) { R.problems.push({ what: 'tester crashed: ' + String(e.message || e).split('\n')[0].slice(0, 120) }); }
  for (const e of R.errors) R.problems.push({ what: 'script error while playing: ' + e });
  R.status = R.problems.length ? 'ISSUES' : 'CLEAN';
  await ctx.close().catch(() => {});
  results.push(R);
  console.log(`${R.status} ${g.file}: ${R.problems.map(p => p.what).join(' | ') || 'played 3 styles, nothing wrong'}`);
}
await browser.close();
fs.writeFileSync(path.join(out, 'results-' + (process.env.TESTER || 'x') + '.json'), JSON.stringify(results, null, 1));
