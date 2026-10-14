/* v5 jersey: ONE continuous smooth tube mesh generated around the torso (no cut triangles), skinned by copying the
   nearest body vertex's bone weights. Armholes and the rounded V-neck are cut analytically per pixel (anti-aliased via
   alpha-to-coverage), so edges are perfectly smooth; one thick trim band follows every edge. Decals are drawn at 4K. */
import { THREE } from './gfx.js';
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lin = (h) => new THREE.Color(h);
const NA = 128, Y0 = 1.05, Y1 = 1.585, NY = 120;
let MESHN = null;
function meshNormal() { if (MESHN) return MESHN; const n = 64, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), im = g.createImageData(n, n);
  /* fine athletic mesh: staggered small pores */
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = (y * n + x) * 4; const ox = ((x + (Math.floor(y / 8) % 2) * 4) % 8) - 4, oy = (y % 8) - 4, d = Math.hypot(ox, oy), h = d < 2.2 ? (2.2 - d) / 2.2 : 0;
    const nx = d > 0 ? (ox / d) * h * 0.8 : 0, ny = d > 0 ? (oy / d) * h * 0.8 : 0; im.data[i] = 128 + nx * 110; im.data[i + 1] = 128 + ny * 110; im.data[i + 2] = 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); MESHN = new THREE.CanvasTexture(c); MESHN.wrapS = MESHN.wrapT = THREE.RepeatWrapping; MESHN.repeat.set(70, 36); return MESHN; }
function decalTex(u, num, nm, drawLogo) { const c = document.createElement('canvas'); c.width = 4096; c.height = 2048; const g = c.getContext('2d'), W = 4096, H = 2048;
  g.fillStyle = u.jersey; g.fillRect(0, 0, W, H);
  /* u = j/NA: front centre u=.25, back centre u=.75; v: 0 hem .. 1 top (canvas top = top) */
  const vy = (y) => (1 - (y - Y0) / (Y1 - Y0)) * H, F = 1024, B = 3072;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  const outlined = (txt, x, y, font, fill, o1, w1, o2, w2) => { g.font = font; if (o2) { g.lineWidth = w2; g.strokeStyle = o2; g.strokeText(txt, x, y); } g.lineWidth = w1; g.strokeStyle = o1; g.strokeText(txt, x, y); g.fillStyle = fill; g.fillText(txt, x, y); };
  /* wordmark: gently arched APEX + small ARCADE */
  const word = (u.word || 'APEX').toUpperCase(); const wsp = Math.min(172, 660 / Math.max(1, word.length - 1)); [...word].forEach((ch, i) => { const k = i - (word.length - 1) / 2; g.save(); g.translate(F + k * wsp, vy(1.355) + k * k * 14); g.rotate(k * 0.06);
    outlined(ch, 0, 0, '900 200px "Arial Black", system-ui', u.num, u.trim2, 26, u.trim, 46); g.restore(); });
  outlined(u.sub || 'ARCADE', F, vy(1.30), '800 64px system-ui', u.num, u.trim, 10);
  /* numbers */
  outlined(String(num), F, vy(1.12), '900 330px "Arial Black", system-ui', u.num, u.trim2, 30, u.trim, 56);
  outlined(nm.toUpperCase(), B, vy(1.40), '900 120px "Arial Black", system-ui', u.num, u.trim, 16);
  outlined(String(num), B, vy(1.13), '900 480px "Arial Black", system-ui', u.num, u.trim2, 36, u.trim, 66);
  /* sponsor patch, wearer's left chest, and jock tag at the hem */
  const px = F + 250, py = vy(1.43); g.fillStyle = u.patch; g.beginPath(); g.roundRect(px - 92, py - 46, 184, 92, 16); g.fill(); drawLogo(g, px - 50, py + 2, 60, u.patchInk, u.patch, false);
  g.textAlign = 'left'; g.fillStyle = u.patchInk; g.font = '900 30px system-ui'; g.fillText('APEX', px - 10, py - 4); g.font = '800 22px system-ui'; g.fillText('ARCADE', px - 9, py + 24);
  g.fillStyle = '#ececec'; g.fillRect(F - 300, vy(1.035), 150, 80); g.fillStyle = '#111'; g.textAlign = 'center'; g.font = '900 22px system-ui'; g.fillText('APEX ARCADE', F - 225, vy(1.035) + 34); g.font = '700 18px system-ui'; g.fillText('AUTHENTIC', F - 225, vy(1.035) + 62);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; return t; }
let GEO_CACHE = null;
export function buildJersey(body, u, num, nm, drawLogo) {
  const G = GEO_CACHE || (GEO_CACHE = jerseyGeo(body));
  return finish(body, G, u, num, nm, drawLogo); }
function jerseyGeo(body) {
  const P = body.geometry.attributes.position, SI = body.geometry.attributes.skinIndex, SW = body.geometry.attributes.skinWeight, v = new THREE.Vector3();
  /* 1. sample the torso radius (arms excluded) per height ring and angle */
  const R = []; for (let i = 0; i <= NY; i++) R.push(new Float32Array(NA).fill(0));
  const pts = [];
  for (let k = 0; k < P.count; k++) { v.fromBufferAttribute(P, k); pts.push(v.x, v.y, v.z); const ax = Math.abs(v.x); if (v.y < Y0 - 0.02 || v.y > Y1 + 0.02) continue; if (ax > 0.205 && v.y > 1.22) continue;
    const i = Math.round((v.y - Y0) / (Y1 - Y0) * NY), th = Math.atan2(v.x, v.z), j = ((Math.round((th + Math.PI / 2) / (Math.PI * 2) * NA) % NA) + NA) % NA, r = Math.hypot(v.x, v.z);
    for (const ii of [i - 1, i, i + 1]) if (ii >= 0 && ii <= NY && r > R[ii][j]) R[ii][j] = r; }
  for (const row of R) { for (let pass = 0; pass < 3; pass++) for (let j = 0; j < NA; j++) if (!row[j]) { const a = row[(j + NA - 1) % NA], b = row[(j + 1) % NA]; if (a || b) row[j] = Math.max(a, b); } }
  for (let pass = 0; pass < 10; pass++) for (const row of R) { const c = row.slice(); for (let j = 0; j < NA; j++) row[j] = (c[(j + NA - 1) % NA] + 2 * c[j] + c[(j + 1) % NA]) / 4; }
  for (let pass = 0; pass < 24; pass++) { const c = R.map((r) => r.slice()); for (let i = 1; i < NY; i++) for (let j = 0; j < NA; j++) R[i][j] = (c[i - 1][j] + 2 * c[i][j] + c[i + 1][j]) / 4; }
  /* chest girth per angle (the line the fabric hangs from) */
  const chest = new Float32Array(NA); for (let i = 0; i <= NY; i++) { const y = Y0 + (i / NY) * (Y1 - Y0); if (y > 1.26 && y < 1.38) for (let j = 0; j < NA; j++) chest[j] = Math.max(chest[j], R[i][j]); }
  /* 2. build the tube */
  const pos = [], bp = [], uv = [], I = [];
  for (let i = 0; i <= NY; i++) { const y = Y0 + (i / NY) * (Y1 - Y0);
    for (let j = 0; j <= NA; j++) { const jj = j % NA, th = -Math.PI / 2 + (j / NA) * Math.PI * 2, rb = R[i][jj] || 0.12;
      const hang = sstep(1.38, 1.22, y), tuck = sstep(1.04, 1.17, y), top = sstep(1.46, 1.54, y);
      let r = rb + 0.014 + 0.008 * (1 - top);
      { const w = sstep(1.32, 1.08, y), tgt = (chest[jj] + 0.012) * (1 - w) + (rb + 0.012) * w; r = Math.max(r, r + (tgt - r) * hang); }                                 /* hangs straight down from the chest */
      r = rb + 0.008 + (r - rb - 0.008) * tuck;                                          /* tucked into the waistband */
      r += Math.sin(th * 15 + Math.sin(th * 3) * 1.5) * 0.0035 * hang * tuck;             /* soft vertical folds */
      const x = Math.sin(th) * r, z = Math.cos(th) * r; pos.push(x, y, z); bp.push(x, y, z); uv.push(j / NA, (y - Y0) / (Y1 - Y0)); } }
  for (let i = 0; i < NY; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; I.push(a, a + 1, b, b, a + 1, b + 1); }
  /* 3. skin weights: nearest body vertex (torso + shoulders) */
  const n = pos.length / 3, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  /* candidates: torso/shoulder vertices only (no arm verts), blended over the 16 nearest for smooth, crease-free weights */
  const cand = []; for (let q = 0; q < pts.length; q += 3) { const ax = Math.abs(pts[q]), y = pts[q + 1]; if (y < 0.9 || y > 1.66) continue; if (ax > 0.19 && y > 1.2) continue; cand.push(q / 3); }
  const BK = {}; for (const c of cand) { const b0 = Math.floor((pts[c * 3 + 1] - 0.9) / 0.04); (BK[b0] || (BK[b0] = [])).push(c); }
  const K = 16, bd = new Float32Array(K), bix = new Int32Array(K);
  for (let k = 0; k < n; k++) { const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2]; bd.fill(1e9); bix.fill(0);
    const by = Math.floor((y - 0.9) / 0.04); for (let bb = by - 2; bb <= by + 2; bb++) for (const c of (BK[bb] || [])) { const dy = pts[c * 3 + 1] - y; if (dy > 0.08 || dy < -0.08) continue; const d = (pts[c * 3] - x) ** 2 + dy * dy + (pts[c * 3 + 2] - z) ** 2;
      if (d < bd[K - 1]) { let p = K - 1; while (p > 0 && bd[p - 1] > d) { bd[p] = bd[p - 1]; bix[p] = bix[p - 1]; p--; } bd[p] = d; bix[p] = c; } }
    const acc = new Map(); for (let t = 0; t < K; t++) { if (bd[t] >= 1e9) continue; const w0 = 1 / (Math.sqrt(bd[t]) + 0.01); for (let c = 0; c < 4; c++) { const bI = SI.getComponent(bix[t], c), wv = SW.getComponent(bix[t], c) * w0; if (wv > 0) acc.set(bI, (acc.get(bI) || 0) + wv); } }
    const top4 = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4), tot = top4.reduce((s2, e) => s2 + e[1], 0) || 1;
    for (let c = 0; c < 4; c++) { si[k * 4 + c] = top4[c] ? top4[c][0] : 0; sw[k * 4 + c] = top4[c] ? top4[c][1] / tot : 0; } }
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('bp', new THREE.Float32BufferAttribute(bp, 3));
  G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); G.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); G.setIndex(I); G.computeVertexNormals();
  /* fix the duplicated seam column so lighting is continuous */
  const N = G.attributes.normal; for (let i = 0; i <= NY; i++) { const a = i * (NA + 1), b = a + NA; const nx = (N.getX(a) + N.getX(b)) / 2, ny = (N.getY(a) + N.getY(b)) / 2, nz = (N.getZ(a) + N.getZ(b)) / 2; N.setXYZ(a, nx, ny, nz); N.setXYZ(b, nx, ny, nz); }
  return G; }
function finish(body, G, u, num, nm, drawLogo) {
  const m = new THREE.MeshPhysicalMaterial({ map: decalTex(u, num, nm, drawLogo), roughness: 0.58, metalness: 0, sheen: 0.45, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff'),
    normalMap: meshNormal(), normalScale: new THREE.Vector2(0.22, 0.22), side: THREE.DoubleSide, alphaToCoverage: true });
  const U = { uTrim: { value: lin(u.trim) } };
  m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 bp; varying vec3 vBp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBp = bp;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vBp; uniform vec3 uTrim;
float edgeD(vec3 p){ float ax = abs(p.x), y = p.y;
  vec2 q = vec2((ax - .24) / .095, (y - 1.405) / .16); float hole = (length(q) - 1.) * .095;          /* round armholes */
  float nk = p.z > 0. ? 1.475 + ax * ax * 9. : 1.505 + ax * ax * 6.;                                    /* rounded V front, low scoop back */
  float neck = nk - y; float top = 1.575 - y;
  return min(min(hole, neck), top); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
float ed = edgeD(vBp); float aw = fwidth(ed) * 1.2 + 1e-5;
float keep = smoothstep(-aw, aw, ed);
float trim = 1. - smoothstep(.026 - aw, .026 + aw, ed);
diffuseColor.rgb = mix(diffuseColor.rgb, uTrim, trim);
diffuseColor.a = keep; if (keep < .02 || vBp.y < 1.11) discard;`); };
  m.customProgramCacheKey = () => 'jersey7';
  const mesh = new THREE.SkinnedMesh(G, m); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; body.parent.add(mesh); mesh.bind(body.skeleton, body.bindMatrix); return mesh; }
