// iPhone Safari pass (owner, 2026-10-17). The main robot plays in Chrome, but the owner and his players use iPhone Safari,
// which behaves differently. This opens every game in WebKit (Safari's engine) as an iPhone held sideways, starts it,
// and adds what it finds to results.json as CHECK items ("iPhone Safari: ..."). Never blocks a merge.
// Run after check.mjs:  node tools/game-check/safari.mjs http://127.0.0.1:8811/ game-check-out
import { webkit, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

const base = process.argv[2] || 'http://127.0.0.1:8811/';
const out = process.argv[3] || 'game-check-out';
const here = path.dirname(new URL(import.meta.url).pathname);
const cfg = JSON.parse(fs.readFileSync(path.join(here, 'games.json'), 'utf8'));
const resFile = path.join(out, 'results.json');
const res = JSON.parse(fs.readFileSync(resFile, 'utf8'));
const iphone = devices['iPhone 13'] || {};

const browser = await webkit.launch();
// does this robot's Safari have 3D at all? (if not, only script errors are reported - no false alarms)
const probeCtx = await browser.newContext();
const probe = await probeCtx.newPage();
const gl = await probe.evaluate(() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } });
await probeCtx.close();
console.log('Safari robot has WebGL:', gl);

async function press(page, step) {
  const loc = step.startsWith('text=') ? page.getByText(step.slice(5), { exact: false }).first() : page.locator(step).first();
  try { if (!(await loc.count()) || !(await loc.isVisible())) return false; await loc.click({ timeout: 2500, force: true }); await page.waitForTimeout(1500); return true; }
  catch (e) { return false; }
}

const games = (process.env.ONLY ? cfg.games.filter(g => process.env.ONLY.split(',').includes(g.file)) : cfg.games);
let added = 0;
for (const g of games) {
  const r = res.results.find(x => x.file === g.file);
  if (!r) continue;
  const slug = g.file.replace('.html', '');
  const ctx = await browser.newContext({ ...iphone, viewport: { width: 844, height: 390 }, screen: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = new Set(), glErr = new Set();
  page.on('pageerror', e => errs.add(String(e.message || e).split('\n')[0].slice(0, 140)));
  page.on('console', m => { if (m.type() === 'error' && /webgl|shader|context/i.test(m.text())) glErr.add(m.text().slice(0, 120)); });
  const found = [];
  try {
    await page.goto(base + g.file, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(5000);
    for (const st of g.start || []) await press(page, st);
    await page.waitForTimeout(4000);
    const facts = await page.evaluate(() => {
      const cs = [...document.querySelectorAll('canvas')].filter(c => c.width * c.height > 40000);
      return { canvases: cs.length };
    });
    const jpg = await page.screenshot({ type: 'jpeg', quality: 60 });
    fs.writeFileSync(path.join(out, 'img', slug + '-5-safari.jpg'), jpg);
    r.img = r.img || {}; r.img.safari = 'img/' + slug + '-5-safari.jpg';
    for (const e of errs) found.push('iPhone Safari: script error: ' + e);
    if (gl && !facts.canvases) found.push('iPhone Safari: no 3D picture on screen (the game drew nothing)');
    if (gl) for (const e of [...glErr].slice(0, 2)) found.push('iPhone Safari: 3D problem: ' + e);
  } catch (e) {
    found.push('iPhone Safari: page did not load (' + String(e.message).split('\n')[0].slice(0, 90) + ')');
  }
  await ctx.close();
  // only what Safari gets wrong that Chrome didn't already report
  const known = new Set([...(r.fail || []), ...(r.check || [])].map(s => s.toLowerCase()));
  const fresh = found.filter(f => !known.has(f.replace(/^iPhone Safari: (script error: )?/, '').toLowerCase()));
  r.safari = fresh;
  if (fresh.length) { r.check = (r.check || []).concat(fresh); if (r.status === 'PASS') r.status = 'CHECK'; added += fresh.length; }
  console.log(g.file, fresh.length ? fresh : 'ok in Safari');
}
await browser.close();
res.safari = { gl, when: new Date().toISOString() };
fs.writeFileSync(resFile, JSON.stringify(res, null, 1));
// add the Safari pictures to the report page
const mdFile = path.join(out, 'README.md');
if (fs.existsSync(mdFile)) {
  let md = '\n\n## 📱 iPhone Safari pass\n\nEvery game opened in Safari\'s engine as an iPhone held sideways' + (gl ? '' : ' (this robot\'s Safari has no 3D, so only script errors were checked)') + '.\n\n';
  for (const r of res.results) if (r.img && r.img.safari) md += `**${r.name}** — ${(r.safari || []).length ? r.safari.join('; ') : 'ok'}\n\n<img src="${r.img.safari}" width="420">\n\n`;
  fs.appendFileSync(mdFile, md);
}
console.log('Safari pass done:', added, 'new item(s)');
