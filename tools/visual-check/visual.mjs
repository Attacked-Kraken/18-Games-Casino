// VISUAL PLAY-TESTER - watches the game, not the code (JOB-01).
// Run:  node tools/visual-check/visual.mjs --out visual-out [--baseline visual-baseline] [--update] [game.html ...]
// Needs: playwright (or playwright-core + CHROME=/path/to/chrome), pngjs, pixelmatch.  ffmpeg optional (makes clip.mp4).
//
// For every game it: opens it like a landscape phone, presses the start buttons from tools/game-check/games.json,
// films 12 frames over ~6 s (frames/NN.png + clip.mp4), and, when the game has window.__reality, takes a CLOSE-UP of
// the player's feet / skates / wheels against the ground, and records the camera height above the ground every frame.
// Then it compares with the saved baseline (the last good build) and FAILS when the picture got worse:
//   - blank / black screen, or the game froze (all frames the same)
//   - camera went under the ground/ice at any moment (camera y < ground + 0.3 m)
//   - feet/skates/wheels sink or float more than before (+3 cm worse than baseline) or more than 6 cm at all
//   - gameplay frames or the close-up changed a LOT from the baseline (pixel diff over the limit) -> FAIL with a diff picture
// --update writes the current run as the new baseline (the robot does this on main after a merge).
import fs from 'fs'; import path from 'path'; import http from 'http'; import { execFileSync } from 'child_process';
let chromium; try { ({ chromium } = await import('playwright')); } catch (e) { ({ chromium } = await import('playwright-core')); }
const { PNG } = await import('pngjs'); const pixelmatch = (await import('pixelmatch')).default;

const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf(k); if (i < 0) return d; const v = A[i + 1]; A.splice(i, 2); return v; };
const UPDATE = A.includes('--update'); if (UPDATE) A.splice(A.indexOf('--update'), 1);
const OUT = opt('--out', 'visual-out'), BASE = opt('--baseline', 'visual-baseline'), ROOT = path.resolve(opt('--root', '.'));
const LIMIT = +(process.env.VISUAL_DIFF_LIMIT || 0.45);         // 45% of pixels changed a lot = something big broke
const CLOSE_LIMIT = +(process.env.VISUAL_CLOSE_LIMIT || 0.60);  // close-ups move more (animation), so a looser limit
const SIX = ['apexbaseball.html', 'apexhockey.html', 'apexflight.html', 'apextrackfield.html', 'apexf1.html', 'apexracer.html'];
const games = A.length ? A : SIX;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/game-check/games.json'), 'utf8'));
const UPM = { 'apexhockey.html': 3.26, 'apexbaseball.html': 20.17 / 18.4 };   // game units per metre (default 1)

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); s.end(d); }); }).listen(0);
const port = srv.address().port;

// same random numbers every run (crowds, AI, sparks) so pictures can be compared fairly
const SEED = `(()=>{ let s=1234567; Math.random=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; })();`;
// grab the game's renderer/scene/camera without touching the game code: the first object drawn hands them over
const GRAB = `(()=>{ window.__vc={cams:[]}; const tryHook=()=>{ const R=window.__reality, P=R&&R.player; if(!P||P.__vcHooked) return; P.__vcHooked=1;
  P.traverse(o=>{ if(o.isMesh){ const prev=o.onBeforeRender; o.onBeforeRender=function(r,sc,c,...x){ window.__vc.r=r; window.__vc.sc=sc; window.__vc.cam=c; return prev&&prev.call(this,r,sc,c,...x); }; } }); };
  setInterval(tryHook,250); })();`;

const decode = (buf) => PNG.sync.read(buf);
function stats(png) { let s = 0, s2 = 0, n = 0; for (let i = 0; i < png.data.length; i += 16) { const l = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3; s += l; s2 += l * l; n++; } const m = s / n; return { mean: m, sd: Math.sqrt(Math.max(0, s2 / n - m * m)) }; }
function diff(aBuf, bBuf, outFile) { const a = decode(aBuf), b = decode(bBuf); if (a.width !== b.width || a.height !== b.height) return 1;
  const d = new PNG({ width: a.width, height: a.height }); const n = pixelmatch(a.data, b.data, d.data, a.width, a.height, { threshold: 0.2 });
  if (outFile) fs.writeFileSync(outFile, PNG.sync.write(d)); return n / (a.width * a.height); }

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const report = { when: new Date().toISOString(), games: {} }; let anyFail = false;
for (const g of games) {
  const gc = cfg.games.find(x => x.file === g) || { start: [] }, dir = path.join(OUT, g.replace('.html', '')), bdir = path.join(BASE, g.replace('.html', ''));
  fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
  const r = { fail: [], note: [], metrics: {} };
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(SEED); await ctx.addInitScript(GRAB);
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  try {
    await page.goto(`http://127.0.0.1:${port}/${g}`, { waitUntil: 'load', timeout: 30000 }); await page.waitForTimeout(4000);
    for (const sel of gc.start || []) { try { await page.locator(sel).first().click({ timeout: 4000 }); } catch (e) { r.note.push('start button not found: ' + sel); } await page.waitForTimeout(1800); }
    await page.waitForTimeout(4000);
    await page.evaluate(() => { try { window.__reality && window.__reality.go && window.__reality.go(true); } catch (e) {} });
    // ---- film 12 frames + read camera height and ground contact every frame
    const frames = [], camLow = [], gaps = [];
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(500);
      const buf = await page.screenshot(); frames.push(buf); fs.writeFileSync(path.join(dir, 'frames', String(i).padStart(2, '0') + '.png'), buf);
      const m = await page.evaluate(() => { const R = window.__reality, V = window.__vc; if (!R) return null; const out = { cam: null, gap: null };
        const gnd = (x, z) => { try { return R.ground ? +R.ground(x, z) : 0; } catch (e) { return 0; } };
        if (V && V.cam) { const c = V.cam.position; out.cam = c.y - gnd(c.x, c.z); }
        let low = null; for (const c of (R.contact || [])) { try { c.updateMatrixWorld(true); let mn = Infinity; c.traverse(o => { if (o.geometry && o.visible) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); mn = Math.min(mn, b.min.y); } });
            const p = c.getWorldPosition(c.position.clone()); if (mn === Infinity) mn = p.y - (+R.footOffset || 0); const gp = mn - gnd(p.x, p.z); low = low === null ? gp : Math.min(low, gp); } catch (e) {} }
        out.gap = low; return out; });
      if (m) { if (m.cam != null) camLow.push(m.cam); if (m.gap != null) gaps.push(m.gap); }
    }
    await page.evaluate(() => { try { window.__reality && window.__reality.go && window.__reality.go(false); } catch (e) {} });
    const upm = UPM[g] || 1;
    // ---- close-up of the feet / skates / wheels (rendered from the game's own scene with a second camera)
    const close = await page.evaluate(() => { const R = window.__reality, V = window.__vc; if (!R || !V || !V.r || !R.player) return null;
      const P = R.player; P.updateMatrixWorld(true); const p = P.getWorldPosition(P.position.clone()); const c = V.cam.clone();
      let s = 1; try { let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; P.traverse(o => { if (!o.geometry || !o.visible) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); for (const k of [0, 1, 2]) { const a = ['x', 'y', 'z'][k]; mn[k] = Math.min(mn[k], b.min[a]); mx[k] = Math.max(mx[k], b.max[a]); } }); s = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) || 1; } catch (e) {}
      const g0 = R.ground ? R.ground(p.x, p.z) : 0; c.position.set(p.x + s * 0.55, g0 + s * 0.12, p.z + s * 0.55); c.lookAt(p.x, g0 + s * 0.05, p.z); c.fov = 30; c.near = Math.min(c.near, 0.01 * s); c.updateProjectionMatrix();
      V.r.render(V.sc, c); return V.r.domElement.toDataURL('image/png'); });
    if (close) fs.writeFileSync(path.join(dir, 'closeup.png'), Buffer.from(close.split(',')[1], 'base64')); else r.note.push('no close-up: game has no window.__reality hook yet (JOB-04)');
    // ---- clip
    try { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '2', '-i', path.join(dir, 'frames', '%02d.png'), '-vf', 'scale=844:-2', '-pix_fmt', 'yuv420p', path.join(dir, 'clip.mp4')]); } catch (e) { r.note.push('ffmpeg not found - frames only'); }
    // ---- judge this run on its own
    const st = frames.map(b => stats(decode(b)));
    r.metrics = { luma: Math.round(st[st.length - 1].mean), detail: Math.round(st[st.length - 1].sd), camLowM: camLow.length ? +(Math.min(...camLow) / upm).toFixed(3) : null, worstGapM: gaps.length ? +((gaps.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a, 0)) / upm).toFixed(3) : null, errors: errs.slice(0, 5) };
    if (st[st.length - 1].sd < 6) r.fail.push('blank or black screen');
    const moving = frames.slice(1).some((b, i) => diff(frames[i], b) > 0.002); if (!moving) r.fail.push('game looks frozen - 12 frames over 6 s are the same');
    if (r.metrics.camLowM != null && r.metrics.camLowM < 0.3) r.fail.push(`camera went UNDER/INTO the ground: lowest ${r.metrics.camLowM} m above it`);
    if (r.metrics.worstGapM != null && Math.abs(r.metrics.worstGapM) > 0.06) r.fail.push(`feet/skates/wheels ${r.metrics.worstGapM < 0 ? 'SINK' : 'FLOAT'} ${Math.abs(r.metrics.worstGapM * 100).toFixed(1)} cm`);
    // ---- compare with the baseline (last good build)
    const bm = path.join(bdir, 'metrics.json');
    if (!UPDATE && fs.existsSync(bm)) {
      const B = JSON.parse(fs.readFileSync(bm, 'utf8'));
      const dPlay = diff(fs.readFileSync(path.join(bdir, 'frames', '11.png')), frames[11], path.join(dir, 'diff-play.png'));
      r.metrics.diffPlay = +dPlay.toFixed(3); if (dPlay > LIMIT) r.fail.push(`gameplay picture changed ${Math.round(dPlay * 100)}% vs the last good build (limit ${LIMIT * 100}%) - see diff-play.png`);
      if (close && fs.existsSync(path.join(bdir, 'closeup.png'))) { const dc = diff(fs.readFileSync(path.join(bdir, 'closeup.png')), fs.readFileSync(path.join(dir, 'closeup.png')), path.join(dir, 'diff-closeup.png'));
        r.metrics.diffClose = +dc.toFixed(3); if (dc > CLOSE_LIMIT) r.fail.push(`close-up of the feet/skates/wheels changed ${Math.round(dc * 100)}% - look at closeup.png vs baseline`); }
      if (B.worstGapM != null && r.metrics.worstGapM != null && Math.abs(r.metrics.worstGapM) > Math.abs(B.worstGapM) + 0.03) r.fail.push(`ground contact got WORSE: ${B.worstGapM} m -> ${r.metrics.worstGapM} m`);
      if (B.camLowM != null && r.metrics.camLowM != null && B.camLowM >= 0.3 && r.metrics.camLowM < 0.3) r.fail.push('camera now dips under the ground (it did not before)');
      if (B.detail && r.metrics.detail < B.detail * 0.5) r.fail.push(`picture lost half its detail (${B.detail} -> ${r.metrics.detail}) - models missing or invisible?`);
    } else if (!UPDATE) r.note.push('no baseline yet - this run only checks itself');
    if (UPDATE) { fs.mkdirSync(path.join(bdir, 'frames'), { recursive: true }); fs.writeFileSync(bm, JSON.stringify(r.metrics, null, 1));
      for (const f of fs.readdirSync(path.join(dir, 'frames'))) fs.copyFileSync(path.join(dir, 'frames', f), path.join(bdir, 'frames', f));
      if (close) fs.copyFileSync(path.join(dir, 'closeup.png'), path.join(bdir, 'closeup.png')); }
  } catch (e) { r.fail.push('could not play: ' + String(e).slice(0, 160)); }
  await ctx.close();
  if (r.fail.length) anyFail = true; report.games[g] = r;
  console.log(`${r.fail.length ? 'FAIL' : 'PASS'}  ${g}  ${JSON.stringify(r.metrics)}${r.fail.length ? '\n      - ' + r.fail.join('\n      - ') : ''}${r.note.length ? '\n      note: ' + r.note.join('; ') : ''}`);
}
await browser.close(); srv.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
let md = `# Visual play-test (${report.when})\n\n| Game | Result | Camera lowest (m) | Worst contact gap (m) | Diff vs good build |\n|---|---|---|---|---|\n`;
for (const [g, r] of Object.entries(report.games)) md += `| ${g} | ${r.fail.length ? '**FAIL** ' + r.fail.join('; ') : 'PASS'} | ${r.metrics.camLowM ?? '-'} | ${r.metrics.worstGapM ?? '-'} | ${r.metrics.diffPlay ?? '-'} |\n`;
fs.writeFileSync(path.join(OUT, 'README.md'), md);
process.exit(anyFail && !UPDATE ? 1 : 0);
