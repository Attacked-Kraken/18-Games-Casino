// LOOK GUARD (VP Nov 5 2026, owner "build our own ... for any and all games"): fix one thing, break another - caught by LOOKING.
// For ANY game in tools/game-check/games.json the robot loads the game as it is on main (BASE) and as the pull request has it (HEAD),
// takes the SAME pictures of both (a few screens: the menu, the first seconds of play, plus the game's own `views` / `pictures`),
// and compares them on a 16 x 9 grid. BASE is loaded twice first: whatever differs between those two is animation / noise and is ignored.
// A screen that changed in 6+ cells that the base never changes by itself is a "look change".
//   - a view that DECLARES the parts that may change it (games.json: view.parts) and a PR whose title names none of them = RED
//   - a view with no declared parts = a yellow line with the before / after / diff pictures (nothing blocks)
//   - anything the robot could not judge (a side would not load, the base is too noisy) = yellow, NEVER red
// No outside packages: playwright (already in the check) + this file. Pictures are saved in <out>/look/<game>/.
// Usage: node tools/game-check/look-guard.mjs <game.html> <base-dir> <head-dir> <out-dir> ["PR title with PART: x"]
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export const LOOK = { cols: 16, rows: 9, cell: 14, minCells: 6, maxNoise: 0.35 };   // cell = mean colour difference (0-255) that counts as changed

// Pure judging (no browser): used by judge.mjs and by the drill. views = [{ name, parts, status, changedPct, ... }]
export function lookVerdict(game, views, title = '', branch = '') {
  const red = [], yellow = [];
  const exempt = /^(vp-|claude-|0[345]-|robot\/|test\/|auto-undo-)/.test(branch) || /^\s*TEST\b/i.test(title) || process.env.LOOK_GUARD_FORCE === '1';
  const m = String(title).match(/\bPART:\s*([A-Za-z0-9_-]+)/i), named = m ? m[1].toLowerCase() : '';
  for (const v of views || []) {
    if (v.status === 'inconclusive') { yellow.push(`LOOK GUARD ${game.file}: "${v.name}" screen not judged (${v.why || 'robot side'}) - not a game result`); continue; }
    if (v.status !== 'changed') continue;
    const allowed = (v.parts || []).map(x => String(x).toLowerCase());
    const pics = v.pics ? ` Before / after / difference pictures: ${v.pics}` : '';
    if (!allowed.length) { yellow.push(`LOOK CHANGED ${game.file}: the "${v.name}" screen looks different from main in ${v.changedPct}% of the picture.${pics}`); continue; }
    if (exempt || allowed.includes(named)) { yellow.push(`LOOK CHANGED ${game.file}: the "${v.name}" screen changed ${v.changedPct}% (allowed: this PR is ${named ? 'PART: ' + named : 'exempt'}).${pics}`); continue; }
    red.push(`LOOK GUARD: ${game.file} - the "${v.name}" screen looks different from main in ${v.changedPct}% of the picture, but this pull request is ${named ? `PART: ${named}` : 'not tagged with a part'}. That screen belongs to: ${allowed.join(', ')}. Undo what changed it (or put it in its own job named PART: <one of those>).${pics}`);
  }
  return { red, yellow };
}

function serve(port, root) {
  const p = spawn(process.execPath, [new URL('./serve.mjs', import.meta.url).pathname, String(port), path.resolve(root)], { stdio: 'ignore' });
  return p;
}
const SEED = `(()=>{let s=1234567;Math.random=function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();`;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

async function pressStep(page, step) {
  const loc = step.startsWith('text=') ? page.getByText(step.slice(5), { exact: false }).first() : page.locator(step).first();
  try { if (!(await loc.count()) || !(await loc.isVisible())) return false; await loc.click({ timeout: 2500, force: true }); await page.waitForTimeout(1500); return true; } catch (e) { return false; }
}
const deadline = (p, ms, dflt) => Promise.race([p, new Promise(r => setTimeout(() => r(dflt), ms))]);

// the screens to look at: the game's own `views` list, else the menu + the first seconds of play (+ its `pictures`)
export function viewsOf(game) {
  if (Array.isArray(game.views) && game.views.length) return game.views;
  const v = [{ name: 'menu', steps: [], wait: 5000 }, { name: 'play', steps: game.start || [], wait: 4000 }];
  for (const p of (game.pictures || []).slice(0, 3)) v.push({ name: p.name, steps: p.steps || [], wait: p.wait || 2500, parts: p.parts });
  return v;
}

export async function lookGuard({ game, baseDir, headDir, out, title = '', branch = '' }) {
  const { chromium } = await import('playwright');
  const slug = game.file.replace(/\.html$/, ''), dir = path.join(out, 'look', slug); fs.mkdirSync(dir, { recursive: true });
  const result = { file: game.file, views: [], at: new Date().toISOString() };
  if (!fs.existsSync(path.join(baseDir, game.file))) { result.note = 'new game page - nothing to compare with'; fs.writeFileSync(path.join(out, `look-${slug}.json`), JSON.stringify(result)); return result; }
  const sb = serve(8821, baseDir), sh = serve(8822, headDir);
  await new Promise(r => setTimeout(r, 1500));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const lab = await browser.newPage();
  const shot = async (port, view) => {                    // one fresh load -> one picture (png buffer), or null
    let ctx = null;
    try {
      ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: UA });
      await ctx.addInitScript(SEED);
      const page = await ctx.newPage();
      return await deadline((async () => {
        await page.goto(`http://127.0.0.1:${port}/${game.file}`, { waitUntil: 'load', timeout: 40000 });
        await page.waitForTimeout(view.name === 'menu' ? view.wait || 5000 : 6000);
        for (const st of view.steps || []) await pressStep(page, st);
        await page.waitForTimeout(view.name === 'menu' ? 0 : view.wait || 3000);
        return await page.screenshot({ timeout: 30000, type: 'png' });
      })(), 90000, null);
    } catch (e) { return null; } finally { if (ctx) await deadline(ctx.close().catch(() => {}), 5000, null); }
  };
  const grid = (a, b) => lab.evaluate(async ([A, B, L]) => {          // per-cell colour difference + a red diff picture
    const load = async s => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); return i; };
    const ia = await load(A), ib = await load(B), W = 160, H = 90;
    const px = (img) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; };
    const da = px(ia), db = px(ib), cw = W / L.cols, ch = H / L.rows, cells = [];
    for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
      let s = 0, n = 0;
      for (let y = Math.floor(r * ch); y < Math.floor((r + 1) * ch); y++) for (let x = Math.floor(c * cw); x < Math.floor((c + 1) * cw); x++) { const i = (y * W + x) * 4; s += (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3; n++; }
      cells.push(s / n);
    }
    return cells;
  }, [a.toString('base64'), b.toString('base64'), LOOK]);
  const diffPic = (head, flags) => lab.evaluate(async ([H64, F, L]) => {
    const i = new Image(); i.src = 'data:image/png;base64,' + H64; await i.decode();
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0);
    const cw = c.width / L.cols, ch = c.height / L.rows; x.fillStyle = 'rgba(255,0,60,0.35)'; x.strokeStyle = 'rgba(255,0,60,0.9)'; x.lineWidth = 2;
    F.forEach((f, k) => { if (f) { const cx = (k % L.cols) * cw, cy = Math.floor(k / L.cols) * ch; x.fillRect(cx, cy, cw, ch); x.strokeRect(cx, cy, cw, ch); } });
    return c.toDataURL('image/jpeg', 0.7).split(',')[1];
  }, [head.toString('base64'), flags, LOOK]);
  const jpgOf = (png) => lab.evaluate(async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i, 0, 0); return c.toDataURL('image/jpeg', 0.7).split(',')[1]; }, png.toString('base64'));
  try {
    for (const view of viewsOf(game).slice(0, 6)) {
      const nm = String(view.name || 'view').replace(/[^a-z0-9-]/gi, ''), v = { name: view.name, parts: view.parts || [], status: 'same', changedPct: 0 };
      try {
        const a = await shot(8821, view), b = await shot(8821, view), h = await shot(8822, view);
        if (!a || !b || !h) { v.status = 'inconclusive'; v.why = `the ${!a || !b ? 'main' : 'pull request'} version did not give a picture`; }
        else {
          const noise = (await grid(a, b)).map(d => d > LOOK.cell), diff = (await grid(a, h)).map(d => d > LOOK.cell);
          const noisePct = noise.filter(Boolean).length / noise.length;
          if (noisePct > LOOK.maxNoise) { v.status = 'inconclusive'; v.why = `main changes by itself in ${Math.round(noisePct * 100)}% of this screen (animation)`; }
          else {
            const flags = diff.map((d, k) => d && !noise[k]), n = flags.filter(Boolean).length;
            v.changedCells = n; v.changedPct = Math.round(n / flags.length * 100);
            if (n >= LOOK.minCells) {
              v.status = 'changed';
              fs.writeFileSync(path.join(dir, `${nm}-before.jpg`), Buffer.from(await jpgOf(a), 'base64'));
              fs.writeFileSync(path.join(dir, `${nm}-after.jpg`), Buffer.from(await jpgOf(h), 'base64'));
              fs.writeFileSync(path.join(dir, `${nm}-diff.jpg`), Buffer.from(await diffPic(h, flags), 'base64'));
              v.pics = `look/${slug}/${nm}-before.jpg, look/${slug}/${nm}-after.jpg, look/${slug}/${nm}-diff.jpg`;
            }
          }
        }
      } catch (e) { v.status = 'inconclusive'; v.why = String(e.message).split('\n')[0].slice(0, 80); }
      result.views.push(v);
      console.log(`look ${game.file} / ${view.name}: ${v.status}${v.status === 'changed' ? ' ' + v.changedPct + '%' : v.why ? ' - ' + v.why : ''}`);
    }
  } finally { await browser.close().catch(() => {}); sb.kill(); sh.kill(); }
  const vd = lookVerdict(game, result.views, title, branch);
  result.red = vd.red; result.yellow = vd.yellow;
  fs.writeFileSync(path.join(out, `look-${slug}.json`), JSON.stringify(result));
  return result;
}

if (process.argv[1] && /look-guard\.mjs$/.test(process.argv[1])) {
  const [file, baseDir, headDir, out, title] = process.argv.slice(2);
  if (!file || !baseDir || !headDir || !out) { console.log('usage: node tools/game-check/look-guard.mjs <game.html> <base-dir> <head-dir> <out-dir> ["PR title with PART: x"]'); process.exit(2); }
  const gj = JSON.parse(fs.readFileSync(path.join(headDir, 'tools/game-check/games.json'), 'utf8')), game = (gj.games || gj).find(g => g.file === file);
  if (!game) { console.log('not a game in games.json: ' + file); process.exit(2); }
  const t0 = Date.now(), r = await lookGuard({ game, baseDir, headDir, out, title: title || process.env.PR_TITLE || '', branch: process.env.PR_BRANCH || '' });
  console.log(`LOOK GUARD ${r.red.length ? 'RED' : 'ok'} (${((Date.now() - t0) / 1000).toFixed(0)} s) - ${file}`);
  for (const x of r.red) console.log('  RED: ' + x);
  for (const x of r.yellow) console.log('  check: ' + x);
  process.exit(0);          // the verdict is judge.mjs's job - this step only measures and writes look-<game>.json
}
