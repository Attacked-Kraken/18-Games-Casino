// Apex game checker - plays every Game Development title like a phone and writes a picture report.
// Run:  node tools/game-check/check.mjs http://127.0.0.1:8811/ game-check-out
// Needs: playwright (chromium). No other packages.
//
// For each game it: opens it sideways (landscape phone), photographs the opening screen, presses the
// game's start buttons (games.json), photographs gameplay twice a moment apart, then opens it upright.
// FAIL  = black/blank screen, page didn't load, missing files, casino words, a "rotate your device" sign
// CHECK = menu runs off the screen, never got into gameplay, gameplay frozen, script errors
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
if (process.env.ONLY) games = games.filter(g => process.env.ONLY.split(',').includes(g.file));

const CASINO = /\b(casino|gambl\w*|jackpot|slot machine|slots|roulette|blackjack|poker|wager\w*|cash out|payouts?)\b/i;
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

async function pageFacts(page) {
  return page.evaluate((casinoSrc) => {
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
    return { title: document.title, casino: cm ? cm[0] : '', rotate,
             overflow: Math.max(0, se.scrollHeight - window.innerHeight) };
  }, CASINO.source);
}

const results = [];
for (const g of games) {
  const r = { file: g.file, name: g.name, fail: [], check: [], ok: [], img: {} };
  const slug = g.file.replace('.html', '');
  // ---------- sideways (how the games are meant to be played)
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  const page = await ctx.newPage();
  const errors = new Set(), missing = new Set();
  page.on('pageerror', e => errors.add(String(e.message).split('\n')[0].slice(0, 140)));
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

  // press the start buttons
  let pressed = 0;
  for (const step of g.start || []) if (await pressStep(page, step)) pressed++;
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
      if (!ok) r.fail.push(`Owner's fix NOT done yet: "${fx.ask}"${note ? ' (' + note + ')' : ''}`);
    }
    if (r.fixes.length) {
      const fixJpg = await page.screenshot({ type: 'jpeg', quality: 62 });
      fs.writeFileSync(path.join(out, 'img', slug + '-4-fixes.jpg'), fixJpg); r.img.fixes = 'img/' + slug + '-4-fixes.jpg';
    }
  }
  const casino = f1.casino || f2.casino;
  if (casino) r.fail.push(`Casino wording found: "${casino}" (title: ${f1.title})`);
  if (f1.rotate || f2.rotate) r.fail.push(`Shows a rotate sign sideways: "${f1.rotate || f2.rotate}"`);
  await ctx.close();

  // ---------- upright (landscape law: no rotate sign, game still presented sideways)
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  const p2 = await ctx2.newPage();
  try { await p2.goto(base + g.file, { waitUntil: 'load', timeout: 45000 }); } catch (e) {}
  await p2.waitForTimeout(6000);
  const upJpg = await p2.screenshot({ type: 'jpeg', quality: 62 });
  fs.writeFileSync(path.join(out, 'img', slug + '-3-upright.jpg'), upJpg); r.img.upright = 'img/' + slug + '-3-upright.jpg';
  const up = await measure(upJpg);
  const f3 = await pageFacts(p2).catch(() => ({ rotate: '' }));
  if (f3.rotate) r.fail.push(`Shows a rotate sign upright (landscape law says none): "${f3.rotate}"`);
  if (up.dark > 0.93 || up.std < 6) r.fail.push('Upright screen is black or blank');
  await ctx2.close();

  for (const m of missing) r.fail.push('Missing file: ' + m);
  for (const e of [...errors].slice(0, 4)) r.check.push('Script error: ' + e);
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
  let view = m.view && m.view.includes('model-viewer.html') ? m.view.replace(/^.*?tools\//, 'tools/') :
    `tools/model-viewer.html?m=${encodeURIComponent(m.file)}${m.anims ? '&anims=' + encodeURIComponent(m.anims) : ''}&look=${m.look || 'studio'}`;
  m.img = {}; m.problems = [];
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  for (const side of ['q', 'front', 'side']) {
    try {
      await page.goto(base + view + (view.includes('?') ? '&' : '?') + 'shot=' + side + '&name=' + encodeURIComponent(m.name), { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(() => document.title === 'ready' || document.title === 'error', null, { timeout: 30000 });
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
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ when, sha, results, models: models.filter(m => m.img).map(m => ({ id: m.id, name: m.name, status: m.status || '', img: m.img, problems: m.problems, info: m.info })) }, null, 1));
console.log(`\n${count('PASS')} pass, ${count('CHECK')} check, ${count('FAIL')} fail`);
