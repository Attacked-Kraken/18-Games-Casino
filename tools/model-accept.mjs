// MODEL ACCEPTANCE robot (owner Oct 26 2026 "make sure I'm looking at what I will get - all models for every game by every
// fetcher; if it ever comes out horrible or not what it's supposed to be it needs to automatically bring the correct one").
// Measures a .glb from the FILE ITSELF (no libraries) and, when the robot's pictures exist, from the PICTURES, then says
// PASS or FAIL with the exact reasons. A FAIL never reaches the owner: tools/model-retry.mjs rejects it and fetches the next
// candidate by itself. Facts are written next to the model as <name>.accept.json (the board shows them on the model card).
//   node tools/model-accept.mjs [--write] [--pics] [--size "height 0.68"] models/fetched/a.glb models/fetched/b.glb
//   --write  save <name>.accept.json     --pics  also judge <name>-front/side/back/top.jpg (needs playwright)
// Checks: EMPTY (no mesh / under 200 triangles) - STRAY (a far-off piece makes the model a speck: the main mass is a small
// part of the whole box) - SIZE (matches the request line's real size within 20%) - HUGE/TINY box - PICTURES (the model fills
// at least 2% of at least 2 of the 4 robot pictures; an empty stage or a speck = FAIL).
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); if (i < 0) return null; args.splice(i, 1); return true; };
const opt = (n) => { const i = args.indexOf(n); if (i < 0) return ''; const v = args[i + 1]; args.splice(i, 2); return v || ''; };
const WRITE = flag('--write'), PICS = flag('--pics'), SIZE_ASK = opt('--size');
const files = args.filter(a => /\.glb$/i.test(a));

// ---- glb reading (JSON chunk only) ----
function readGlb(file) {
  const b = fs.readFileSync(file);
  if (b.length < 20 || b.readUInt32LE(0) !== 0x46546c67) throw new Error('not a .glb file');
  const len = b.readUInt32LE(12);
  return JSON.parse(b.slice(20, 20 + len).toString('utf8'));
}
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
function local(n) {
  if (n.matrix) return n.matrix;
  const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1];
  const [x, y, z, w] = q;
  const m = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1];
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 4 + r] *= s[c];
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2];
  return m;
}
const NORM = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
function corners(acc, M) {
  let mn = acc.min, mx = acc.max;
  if (!mn || !mx) return [];
  const d = acc.normalized ? NORM[acc.componentType] || 1 : 1;
  if (d !== 1) { mn = mn.map(v => Math.max(-1, v / d)); mx = mx.map(v => Math.max(-1, v / d)); }
  const out = [];
  for (let i = 0; i < 8; i++) {
    const p = [i & 1 ? mx[0] : mn[0], i & 2 ? mx[1] : mn[1], i & 4 ? mx[2] : mn[2]];
    out.push([M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14]]);
  }
  return out;
}
const box = (pts) => { if (!pts.length) return null; const mn = [1e30, 1e30, 1e30], mx = [-1e30, -1e30, -1e30]; for (const p of pts) for (let i = 0; i < 3; i++) { if (p[i] < mn[i]) mn[i] = p[i]; if (p[i] > mx[i]) mx[i] = p[i]; } return { mn, mx }; };
const span = (b) => b ? Math.max(b.mx[0] - b.mn[0], b.mx[1] - b.mn[1], b.mx[2] - b.mn[2]) : 0;

export function measure(file) {
  const j = readGlb(file);
  const nodes = j.nodes || [], pieces = []; // {tris, pts}
  const scene = (j.scenes || [])[j.scene || 0] || { nodes: nodes.map((_, i) => i) };
  const walk = (i, P) => {
    const n = nodes[i]; if (!n) return;
    const M = mul(P, local(n));
    if (n.mesh != null) {
      const m = (j.meshes || [])[n.mesh] || { primitives: [] };
      let tris = 0; const pts = [];
      for (const p of m.primitives || []) {
        const mode = p.mode ?? 4; if (mode !== 4 && mode !== 5 && mode !== 6) continue;
        const posAcc = j.accessors[p.attributes && p.attributes.POSITION]; if (!posAcc) continue;
        const cnt = p.indices != null ? j.accessors[p.indices].count : posAcc.count;
        tris += mode === 4 ? Math.floor(cnt / 3) : Math.max(0, cnt - 2);
        pts.push(...corners(posAcc, M));
      }
      pieces.push({ name: n.name || m.name || '(mesh)', tris, box: box(pts) });
    }
    for (const c of n.children || []) walk(c, M);
  };
  for (const r of scene.nodes || []) walk(r, I);
  const withBox = pieces.filter(p => p.box && p.tris > 0);
  const tris = pieces.reduce((a, p) => a + p.tris, 0);
  const whole = box(withBox.flatMap(p => [p.box.mn, p.box.mx]));
  // the "main mass": the biggest pieces that together hold 90% of the triangles
  const sorted = withBox.slice().sort((a, b) => b.tris - a.tris); let acc = 0; const main = [];
  for (const p of sorted) { main.push(p); acc += p.tris; if (acc >= tris * 0.9) break; }
  const mainBox = box(main.flatMap(p => [p.box.mn, p.box.mx]));
  const size = whole ? [0, 1, 2].map(i => +(whole.mx[i] - whole.mn[i]).toFixed(3)) : [0, 0, 0];
  const mainSize = mainBox ? [0, 1, 2].map(i => +(mainBox.mx[i] - mainBox.mn[i]).toFixed(3)) : [0, 0, 0];
  return { meshes: pieces.length, tris, size, mainSize, stray: span(mainBox) > 0 ? +(span(whole) / span(mainBox)).toFixed(2) : 0, bytes: fs.statSync(file).size };
}

// ---- picture coverage: how much of the frame is the model (not the empty stage) ----
async function coverage(file) {
  const base = file.replace(/\.glb$/i, '');
  const pics = ['front', 'side', 'back', 'top'].map(s => base + '-' + s + '.jpg').filter(f => fs.existsSync(f));
  if (!pics.length) return null;
  const { createRequire } = await import('module'); const { chromium } = createRequire(import.meta.url)('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = [];
  for (const f of pics) {
    const b64 = fs.readFileSync(f).toString('base64');
    const pct = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode();
      const W = 160, H = Math.round(160 * img.height / img.width), c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data;
      // skip the caption strip at the top; compare every pixel with the colour of the same row's left + right edge (the stage)
      let diff = 0, n = 0;
      for (let y = Math.round(H * 0.12); y < H; y++) {
        const li = (y * W + 2) * 4, ri = (y * W + W - 3) * 4;
        for (let xx = 8; xx < W - 8; xx++) {
          const i = (y * W + xx) * 4;
          const bgr = (d[li] + d[ri]) / 2, bgg = (d[li + 1] + d[ri + 1]) / 2, bgb = (d[li + 2] + d[ri + 2]) / 2;
          const dd = Math.abs(d[i] - bgr) + Math.abs(d[i + 1] - bgg) + Math.abs(d[i + 2] - bgb);
          if (dd > 42) diff++; n++;
        }
      }
      return 100 * diff / Math.max(1, n);
    }, b64);
    out.push({ pic: path.basename(f), pct: +pct.toFixed(1) });
  }
  await browser.close();
  return out;
}

// the size the request line asked for: "length 4.6 m" / "height 0.68 m" / "width 2 m"
export function sizeAsk(text) { const m = /\b(length|height|width)\s*:?\s*([\d.]+)\s*m\b/i.exec(text || ''); return m ? { kind: m[1].toLowerCase(), m: +m[2] } : null; }
export function haveSize(facts, kind) { const [x, y, z] = facts.size; return kind === 'height' ? y : kind === 'width' ? Math.min(x, z) : Math.max(x, z); }

export function judge(facts, ask, pics, file = '') {
  const why = [];
  if (!facts.meshes || facts.tris < 200) why.push(`EMPTY: ${facts.tris} triangles in ${facts.meshes} meshes (${facts.bytes} bytes) - the download came back with nothing to show`);
  else {
    if (facts.stray > 1.8) why.push(`STRAY: a far-off piece makes the whole box ${facts.stray}x the size of the model itself - it shows as a speck; needs recentring`);
    const sp = Math.max(...facts.size);
    if (sp > 50 && !/^(kit|venues)\//.test(file)) why.push(`HUGE: ${sp.toFixed(1)} m across - not a real-world size`);
    if (sp < 0.005) why.push(`TINY: ${sp} m across`);
    if (ask) { const have = haveSize(facts, ask.kind); if (!have || Math.abs(have - ask.m) / ask.m > 0.2) why.push(`SIZE: asked ${ask.kind} ${ask.m} m, the file measures ${have ? have.toFixed(2) : 0} m`); }
  }
  if (pics && pics.length) {
    const seen = pics.filter(p => p.pct >= 2).length;
    if (seen < Math.min(2, pics.length)) why.push(`PICTURES: the model fills only ${pics.map(p => p.pct + '%').join(' / ')} of the robot's pictures - the owner could not judge it`);
  }
  return why;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  let bad = 0;
  for (const f of files) {
    let facts, pics = null, why;
    try { facts = measure(f); } catch (e) { facts = { meshes: 0, tris: 0, size: [0, 0, 0], mainSize: [0, 0, 0], stray: 0, bytes: fs.existsSync(f) ? fs.statSync(f).size : 0, error: e.message }; }
    if (PICS) { try { pics = await coverage(f); } catch (e) { console.log('::warning title=Model acceptance::pictures not judged for ' + f + ': ' + e.message.slice(0, 80)); } }
    const sidecar = f.replace(/\.glb$/i, '.ask');
    const ask = sizeAsk(SIZE_ASK) || (fs.existsSync(sidecar) ? sizeAsk(fs.readFileSync(sidecar, 'utf8')) : null);
    why = judge(facts, ask, pics, f);
    const rep = { file: f, ok: !why.length, why, facts, pictures: pics, asked: ask, at: new Date().toISOString() };
    if (WRITE) fs.writeFileSync(f.replace(/\.glb$/i, '.accept.json'), JSON.stringify(rep, null, 1) + '\n');
    if (why.length) { bad++; console.log(`::error title=Model acceptance::FAIL ${f}: ${why.join(' | ')}`); }
    else console.log(`::notice title=Model acceptance::PASS ${f}: ${facts.tris} triangles, ${facts.size.join(' x ')} m${pics ? ', fills ' + pics.map(p => p.pct + '%').join('/') : ''}`);
  }
  console.log(`ACCEPT ${files.length - bad} pass, ${bad} fail`);
}
