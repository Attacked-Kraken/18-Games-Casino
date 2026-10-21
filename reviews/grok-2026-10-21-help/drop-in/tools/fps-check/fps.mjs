// FPS FLOOR robot (JOB-05). Measures frames per second of each sports game in a headless phone-sized browser.
// Run:  node tools/fps-check/fps.mjs [--root .] [--baseline tools/fps-check/fps-baseline.json] [--update] [--out fps-result.json] [game.html ...]
//   --update  write the numbers as the new baseline
//   otherwise FAIL (exit 1) if any game is more than DROP (default 15%) slower than its baseline.
// Each game: open landscape 844x390, press its start buttons (tools/game-check/games.json), wait 4 s,
// then count frames for 4 s, 3 times; the middle number counts (one hiccup can't fail a PR).
// The robot measures main and the PR on the SAME machine right after each other, so a slow runner can't fake a drop.
import fs from 'fs'; import path from 'path'; import http from 'http';
let chromium; try { ({ chromium } = await import('playwright')); } catch (e) { ({ chromium } = await import('playwright-core')); }
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf(k); if (i < 0) return d; const v = A[i + 1]; A.splice(i, 2); return v; };
const UPDATE = A.includes('--update'); if (UPDATE) A.splice(A.indexOf('--update'), 1);
const ROOT = path.resolve(opt('--root', '.')), BASEF = opt('--baseline', 'tools/fps-check/fps-baseline.json'), OUTF = opt('--out', null);
const DROP = +(process.env.FPS_DROP || 0.15);
const SIX = ['apexbaseball.html', 'apexhockey.html', 'apexflight.html', 'apextrackfield.html', 'apexf1.html', 'apexracer.html'];
const games = A.length ? A : SIX;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/game-check/games.json'), 'utf8'));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(d); }); }).listen(0);
const port = srv.address().port;
const COUNT = `(ms)=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++; if(performance.now()-t0<ms) requestAnimationFrame(f); else r(n*1000/(performance.now()-t0));};requestAnimationFrame(f);})`;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
const res = {};
for (const g of games) {
  const gc = cfg.games.find(x => x.file === g) || { start: [] };
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await ctx.addInitScript(`(()=>{ let s=987654; Math.random=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; })();`);
  const page = await ctx.newPage();
  try {
    await page.goto(`http://127.0.0.1:${port}/${g}`, { waitUntil: 'load', timeout: 30000 }); await page.waitForTimeout(4000);
    for (const sel of gc.start || []) { try { await page.locator(sel).first().click({ timeout: 4000 }); } catch (e) {} await page.waitForTimeout(1500); }
    await page.waitForTimeout(4000);
    const runs = []; for (let i = 0; i < 3; i++) runs.push(await page.evaluate(`(${COUNT})(4000)`));
    runs.sort((a, b) => a - b); res[g] = +runs[1].toFixed(1);
  } catch (e) { res[g] = null; }
  await ctx.close();
}
await browser.close(); srv.close();
if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(res, null, 1));
if (UPDATE) { let old = {}; try { old = JSON.parse(fs.readFileSync(BASEF, 'utf8')); } catch (e) {}
  const merged = Object.assign(old, res, { _note: 'headless swiftshader fps on the robot machine - compare only with numbers from the same machine', _when: new Date().toISOString() });
  fs.mkdirSync(path.dirname(BASEF), { recursive: true }); fs.writeFileSync(BASEF, JSON.stringify(merged, null, 1)); console.log('baseline written:', BASEF); }
let base = {}; try { base = JSON.parse(fs.readFileSync(BASEF, 'utf8')); } catch (e) {}
let fail = false, md = `| Game | Baseline fps | Now fps | Change | Result |\n|---|---|---|---|---|\n`;
for (const g of games) {
  const b = base[g], n = res[g]; let verdict = 'PASS', ch = '-';
  if (n == null) { verdict = 'FAIL (would not run)'; fail = true; }
  else if (b) { const c = (n - b) / b; ch = (c >= 0 ? '+' : '') + Math.round(c * 100) + '%'; if (!UPDATE && c < -DROP) { verdict = `FAIL (more than ${DROP * 100}% slower)`; fail = true; } }
  else verdict = 'PASS (no baseline yet)';
  md += `| ${g} | ${b ?? '-'} | ${n ?? '-'} | ${ch} | ${verdict} |\n`;
}
console.log(md); if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## FPS floor\n\n' + md);
process.exit(fail && !UPDATE ? 1 : 0);
