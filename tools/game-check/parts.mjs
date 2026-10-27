// PART GUARD (owner Oct 27 2026 3:11 PM, Exotic Racer garage video: "how do we keep one fix from touching another part" -
// "make it permanent for all games. We can't fix one thing and mess up another").
// The file guard only checks FILES; one big game file lets any job change any part. This robot looks at the PARTS:
//  1. PICTURES: every part listed in games.json "parts" (each with click steps, like "pictures") is photographed on main (base)
//     AND on the pull request (head), same robot, same frozen clock. A picture that changed but belongs to a part the PR did
//     not name ("PART: wraps" in the PR title) = FAIL "you changed RIMS, your job is WRAPS", with both pictures.
//  2. INNER PARTS (STUDIO-STANDARD 3b rule 10): every mesh of every loaded .glb model is fingerprinted when it loads; if the
//     same mesh in the game's scene has different vertices later, game code reshaped a model's inner part = FAIL.
//  3. COVER: game-made meshes inside a model's holder may not cover the model (the Oct 27 Goblin tear: a grid 'wrap shell'
//     built from body vertices covered ~the whole car). Measured base vs head: a PR that raises the covered share = FAIL;
//     the share itself is always reported.
// Usage: node tools/game-check/parts.mjs <baseDir|-> <headDir> <game.html> <outDir>
//   writes <outDir>/parts-guard.json {game, part, pictures:[{name,diff,base,head}], inner:[...], cover:{base,head}} + pictures.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from 'playwright';

const [, , BASE, HEAD, GAME, OUT] = process.argv;
fs.mkdirSync(path.join(OUT, 'img', 'parts'), { recursive: true });
const games = JSON.parse(fs.readFileSync(path.join(HEAD, 'tools/game-check/games.json'), 'utf8'));
const G = (Array.isArray(games) ? games : games.games || []).find(g => g.file === GAME) || { file: GAME };
const PARTS = (G.parts && G.parts.length ? G.parts : [{ name: 'menu', steps: [] }].concat((G.pictures || []).map(p => ({ name: p.name, steps: p.steps }))));
const T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
// the GLTFLoader file is served with a small add-on that fingerprints every mesh as it loads (nothing in the game changes)
const LOADER_ADDON = `
;(function(){ try{ const fp=(g)=>{ const a=g.attributes.position; let s=0,s2=0; for(let i=0;i<a.count;i++){ const x=a.getX(i),y=a.getY(i),z=a.getZ(i); s+=x+y+z; s2+=x*x+y*y+z*z; } return {n:a.count, s:+s.toFixed(4), s2:+s2.toFixed(4)}; };
 window.__pgFp=fp; window.__pgGlb=window.__pgGlb||[];
 const L=GLTFLoader.prototype.load; GLTFLoader.prototype.load=function(url,onLoad,onP,onE){ return L.call(this,url,(gltf)=>{ try{ const ms=[]; gltf.scene.traverse(o=>{ if(o.isMesh&&o.geometry&&o.geometry.attributes.position){ o.userData.__pgGlb=String(url); ms.push(Object.assign({name:o.name},fp(o.geometry))); } }); window.__pgGlb.push({url:String(url), meshes:ms}); }catch(e){} onLoad&&onLoad(gltf); },onP,onE); };
}catch(e){} })();`;
function serve(root, port) {
  return new Promise(ok => { const s = http.createServer((q, r) => {
    let p = decodeURIComponent((q.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, path.normalize(p)); if (!f.startsWith(path.resolve(root))) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); }
      if (/GLTFLoader\.js$/.test(p)) d = Buffer.from(d.toString() + LOADER_ADDON);
      r.writeHead(200, { 'Content-Type': T[path.extname(f).toLowerCase()] || 'application/octet-stream' }); r.end(d); }); }).listen(port, '127.0.0.1', () => ok(s)); });
}
const SCENE_TRAP = () => { window.__pgScenes = []; try { Object.defineProperty(Object.prototype, 'isScene', { configurable: true, set(v) {
  Object.defineProperty(this, 'isScene', { value: v, writable: true, enumerable: true, configurable: true }); try { if (v) window.__pgScenes.push(this); } catch (e) {} } }); } catch (e) {} };
async function press(pg, sel) {
  try { const el = pg.locator(sel).first(); await el.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {}); await el.click({ timeout: 5000, force: true }); }
  catch (e) { return 'step ' + sel + ' not found'; }
  await pg.clock.runFor(1500); return '';
}
async function shoot(browser, url, steps) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage(); await pg.addInitScript(SCENE_TRAP);
  await pg.clock.install({ time: new Date('2026-01-01T12:00:00Z') });     // same frozen time on base and head = same turntable angle
  const errs = [];
  await pg.goto(url, { waitUntil: 'load', timeout: 60000 });
  for (let i = 0; i < 16; i++) { await pg.clock.runFor(500); await pg.waitForTimeout(150); }   // let the models load (real network) while game time is ours
  for (const st of steps || []) { const e = await press(pg, st); if (e) errs.push(e); }
  await pg.clock.runFor(2500); await pg.waitForTimeout(400);
  const jpg = await pg.screenshot({ type: 'jpeg', quality: 70, timeout: 60000 });
  const facts = await pg.evaluate(() => {
    const out = { inner: [], cover: null };
    try {
      const rec = {}; for (const r of window.__pgGlb || []) for (const m of r.meshes) (rec[r.url + '|' + m.name] = rec[r.url + '|' + m.name] || []).push(m);
      const roots = new Set();
      for (const sc of window.__pgScenes || []) sc.traverse(o => { if (!o.isMesh || !o.userData || !o.userData.__pgGlb || !o.geometry || !o.geometry.attributes.position) return;
        const f = window.__pgFp(o.geometry), list = rec[o.userData.__pgGlb + '|' + o.name] || [];
        if (list.length && !list.some(m => m.n === f.n && Math.abs(m.s - f.s) <= 1e-3 * Math.max(1, Math.abs(m.s)) && Math.abs(m.s2 - f.s2) <= 1e-3 * Math.max(1, m.s2)))
          out.inner.push(o.userData.__pgGlb.split('/').pop() + ' mesh "' + o.name + '"');
        // the model's holder = the nearest parent that also holds game-made meshes
        let h = o.parent; for (let k = 0; k < 4 && h && h.parent && !h.isScene; k++) { let mixed = false; h.traverse(q => { if (q.isMesh && !(q.userData && q.userData.__pgGlb)) mixed = true; }); if (mixed) break; h = h.parent; }
        if (h && o.visible) roots.add(h); });
      out.inner = [...new Set(out.inner)].slice(0, 12);
      out.roots = roots.size; window.__pgRoots = [...roots];
    } catch (e) { out.err = String(e).slice(0, 120); }
    return out;
  });
  // COVER: picture with the game-made meshes inside the model holders hidden vs shown, compared only where the model is
  let cover = null;
  if (facts.roots) {
    const set = async (mode) => { await pg.evaluate((mode) => { for (const h of window.__pgRoots || []) h.traverse(q => { if (!q.isMesh) return;
      const glb = !!(q.userData && q.userData.__pgGlb); if (q.userData.__pgVis === undefined) q.userData.__pgVis = q.visible;
      q.visible = mode === 'all' ? q.userData.__pgVis : mode === 'glb' ? (glb && q.userData.__pgVis) : false; }); }, mode);
      await pg.clock.runFor(100); await pg.waitForTimeout(150); return pg.screenshot({ type: 'png', timeout: 60000 }); };
    const none = await set('none'), glb = await set('glb'), all = await set('all');
    cover = { none, glb, all };
  }
  await ctx.close();
  return { jpg, errs, inner: facts.inner || [], cover };
}
// tiny image tools (no extra packages): decode via the browser itself
async function diffs(browser, pairs) {
  const ctx = await browser.newContext(); const pg = await ctx.newPage();
  const res = await pg.evaluate(async (pairs) => {
    const load = (b64, type) => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.src = 'data:' + type + ';base64,' + b64; });
    const px = (im, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.filter = 'blur(1px)'; x.drawImage(im, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; };
    const out = [];
    for (const p of pairs) {
      if (p.kind === 'diff') { const a = await load(p.a, 'image/jpeg'), b = await load(p.b, 'image/jpeg'); const A = px(a, 211, 98), B = px(b, 211, 98);
        let n = 0, ch = 0; for (let i = 0; i < A.length; i += 4) { n++; const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); if (d > 60) ch++; }
        out.push(+(100 * ch / n).toFixed(2)); }
      else { const N = await load(p.none, 'image/png'), Gl = await load(p.glb, 'image/png'), Al = await load(p.all, 'image/png'); const w = 422, h = 195;
        const n = px(N, w, h), g = px(Gl, w, h), a = px(Al, w, h); let model = 0, covered = 0;
        for (let i = 0; i < n.length; i += 4) { const dm = Math.abs(n[i] - g[i]) + Math.abs(n[i + 1] - g[i + 1]) + Math.abs(n[i + 2] - g[i + 2]); if (dm < 40) continue; model++;
          const dc = Math.abs(a[i] - g[i]) + Math.abs(a[i + 1] - g[i + 1]) + Math.abs(a[i + 2] - g[i + 2]); if (dc > 60) covered++; }
        out.push(model > 200 ? +(100 * covered / model).toFixed(1) : null); }
    }
    return out; }, pairs);
  await ctx.close(); return res;
}
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sHead = await serve(HEAD, 8841), sBase = BASE && BASE !== '-' ? await serve(BASE, 8842) : null;
const slug = GAME.replace(/\.html$/, '');
const out = { game: GAME, pictures: [], inner: [], cover: {}, errs: [], at: new Date().toISOString() };
for (const pt of PARTS.slice(0, 24)) {
  const nm = String(pt.name).replace(/[^a-z0-9-]/gi, '');
  try {
    const h = await shoot(browser, 'http://127.0.0.1:8841/' + GAME + (pt.query || ''), pt.steps);
    fs.writeFileSync(path.join(OUT, 'img', 'parts', slug + '-' + nm + '-head.jpg'), h.jpg);
    const row = { name: pt.name, part: pt.part || pt.name, head: 'img/parts/' + slug + '-' + nm + '-head.jpg' };
    if (h.errs.length) out.errs.push(pt.name + ': ' + h.errs.join('; '));
    for (const x of h.inner) if (!out.inner.includes(x)) out.inner.push(x);
    if (sBase) {
      const b = await shoot(browser, 'http://127.0.0.1:8842/' + GAME + (pt.query || ''), pt.steps);
      fs.writeFileSync(path.join(OUT, 'img', 'parts', slug + '-' + nm + '-base.jpg'), b.jpg); row.base = 'img/parts/' + slug + '-' + nm + '-base.jpg';
      const [d] = await diffs(browser, [{ kind: 'diff', a: b.jpg.toString('base64'), b: h.jpg.toString('base64') }]); row.diff = d;
      if (pt.cover !== false && h.cover && b.cover && out.cover.head === undefined) {
        const [ch, cb] = await diffs(browser, [{ kind: 'cover', none: h.cover.none.toString('base64'), glb: h.cover.glb.toString('base64'), all: h.cover.all.toString('base64') },
                                               { kind: 'cover', none: b.cover.none.toString('base64'), glb: b.cover.glb.toString('base64'), all: b.cover.all.toString('base64') }]);
        out.cover = { head: ch, base: cb, picture: pt.name };
        fs.writeFileSync(path.join(OUT, 'img', 'parts', slug + '-model-only.png'), h.cover.glb);
      }
    } else if (pt.cover !== false && h.cover && out.cover.head === undefined) {
      const [ch] = await diffs(browser, [{ kind: 'cover', none: h.cover.none.toString('base64'), glb: h.cover.glb.toString('base64'), all: h.cover.all.toString('base64') }]);
      out.cover = { head: ch, picture: pt.name };
      fs.writeFileSync(path.join(OUT, 'img', 'parts', slug + '-model-only.png'), h.cover.glb);
    }
    out.pictures.push(row);
  } catch (e) { out.errs.push(pt.name + ': ' + String(e.message || e).split('\n')[0].slice(0, 120)); }
}
fs.writeFileSync(path.join(OUT, 'parts-guard.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await browser.close(); sHead.close(); if (sBase) sBase.close();
