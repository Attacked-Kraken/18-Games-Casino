/* PREVIEW: Quaternius body + real skinned uniform meshes (jersey, loose shorts) + per-player looks (skin, real hair meshes, brows, subtle face shape). */
import { THREE, WEAVE } from './gfx.js';
import { buildJersey } from './jersey_v7.js';
import { GLTFLoader } from './GLTFLoader.js';
import { loadQ, buildHooperQ } from './hooper_q.js';
const HAIRS = {};
export async function loadQ2(names) { await loadQ(); const L = new GLTFLoader();
  await Promise.all(names.filter((n) => !HAIRS[n]).map(async (n) => { const g = await L.loadAsync('./characters/base-human-v2/hair/hair_' + n + '.glb'); g.scene.traverse((o) => { if (o.isSkinnedMesh) HAIRS[n] = o; }); })); }
const lin = (h) => new THREE.Color(h), BASE = new THREE.Color('#e3b9a0');
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
/* ---- Apex Arcade logo (original): gold triangle "A" mark with an arcade-joystick dot, wordmark beside it */
export function drawLogo(g, x, y, sz, c1, c2, withText = true) {
  g.save(); g.translate(x, y); const s = sz;
  g.beginPath(); g.moveTo(0, -s * 0.5); g.lineTo(s * 0.46, s * 0.4); g.lineTo(-s * 0.46, s * 0.4); g.closePath(); g.fillStyle = c1; g.fill();
  g.beginPath(); g.moveTo(0, -s * 0.12); g.lineTo(s * 0.2, s * 0.28); g.lineTo(-s * 0.2, s * 0.28); g.closePath(); g.fillStyle = c2; g.fill();
  g.beginPath(); g.arc(0, s * 0.05, s * 0.07, 0, Math.PI * 2); g.fillStyle = c1; g.fill();
  if (withText) { g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = c1; g.font = `900 ${s * 0.42}px "Arial Black", system-ui`; g.fillText('APEX', s * 0.6, -s * 0.13);
    g.font = `800 ${s * 0.3}px system-ui`; g.fillText('ARCADE', s * 0.62, s * 0.24); }
  g.restore(); }
function weave(g, w, h, a) { for (let y = 0; y < h; y += 3) for (let x = (y / 3) % 2 ? 1 : 0; x < w; x += 3) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(x, y, 1, 1); } }
/* jersey art: u=0.5 front (+z), u=0/1 back; canvas top = neck, bottom = hem */
function jerseyTex(u, num, nm) { return canvasTex(2048, 1024, (g, w, h) => {
  g.fillStyle = u.jersey; g.fillRect(0, 0, w, h); weave(g, w, h, 0.05);
  /* side piping panels (u=.25/.75) */
  for (const x of [0, 1024, 2048]) { g.fillStyle = u.trim; g.fillRect(x - 40, 120, 80, h); g.fillStyle = u.trim2; g.fillRect(x - 12, 120, 24, h); }
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  /* large arched chest wordmark */
  const word = 'APEX'; g.font = 'italic 900 150px "Arial Black", system-ui';
  [...word].forEach((ch, i) => { const k = i - 1.5; g.save(); g.translate(1536 + k * 118, 360 + k * k * 12); g.rotate(k * 0.075);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillText(ch, 6, 7); g.lineWidth = 22; g.strokeStyle = u.trim; g.strokeText(ch, 0, 0); g.lineWidth = 9; g.strokeStyle = u.trim2; g.strokeText(ch, 0, 0); g.fillStyle = u.num; g.fillText(ch, 0, 0); g.restore(); });
  g.font = '800 46px system-ui'; g.fillStyle = u.trim; g.fillText('ARCADE', 1536, 430);
  /* big outlined numbers with drop shadow */
  const numFn = (x, y, sz) => { g.font = `900 ${sz}px "Arial Black", system-ui`; g.fillStyle = 'rgba(0,0,0,.28)'; g.fillText(String(num), x + sz * 0.04, y + sz * 0.05);
    g.lineWidth = sz * 0.17; g.strokeStyle = u.trim; g.strokeText(String(num), x, y); g.lineWidth = sz * 0.07; g.strokeStyle = u.trim2; g.strokeText(String(num), x, y); g.fillStyle = u.num; g.fillText(String(num), x, y); };
  numFn(1536, 720, 280);
  for (const x of [512]) { g.font = '900 92px "Arial Black", system-ui'; g.lineWidth = 10; g.strokeStyle = u.trim; g.strokeText(nm.toUpperCase(), x, 300); g.fillStyle = u.num; g.fillText(nm.toUpperCase(), x, 300); numFn(x, 720, 400); }
  /* small sponsor patch, upper chest (wearer's left) */
  g.fillStyle = u.patch; g.beginPath(); g.roundRect(1612, 140, 150, 76, 12); g.fill(); drawLogo(g, 1642, 178, 50, u.patchInk, u.patch, false);
  g.font = '900 20px system-ui'; g.textAlign = 'left'; g.fillStyle = u.patchInk; g.fillText('APEX', 1672, 172); g.font = '800 15px system-ui'; g.fillText('ARCADE', 1673, 194);
  /* jock tag at the hem (front, wearer's left) */
  g.fillStyle = '#e9e9e9'; g.fillRect(1692, 900, 120, 74); g.fillStyle = '#111'; g.font = '900 16px system-ui'; g.textAlign = 'center'; g.fillText('APEX ARCADE', 1752, 930); g.font = '700 13px system-ui'; g.fillText('AUTHENTIC  ·  ' + num, 1752, 956);
  g.fillStyle = u.trim; g.fillRect(0, h - 40, w, 14);
}); }
function shortsTex(u) { return canvasTex(2048, 1024, (g, w, h) => {
  g.fillStyle = u.shorts; g.fillRect(0, 0, w, h); weave(g, w, h, 0.05);
  /* soft vertical fold shading */
  for (let x = 0; x < w; x += 2) { const s = Math.sin(x / w * Math.PI * 2 * 14) * 0.5 + Math.sin(x / w * Math.PI * 2 * 31) * 0.25; g.fillStyle = s > 0 ? `rgba(255,255,255,${s * 0.05})` : `rgba(0,0,0,${-s * 0.09})`; g.fillRect(x, 0, 2, h); }
  /* wide contrasting side panel with trim lines (u=0/.5/1 are the outer sides) */
  for (const x of [0, 1024, 2048]) { g.fillStyle = u.trim; g.fillRect(x - 150, 0, 300, h); g.fillStyle = u.trim2; g.fillRect(x - 150, 0, 14, h); g.fillRect(x + 136, 0, 14, h); g.fillRect(x - 110, 0, 6, h); g.fillRect(x + 104, 0, 6, h); }
  /* thick ribbed elastic waistband */
  g.fillStyle = u.trim; g.fillRect(0, 0, w, 130); for (let y = 6; y < 124; y += 9) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, y + 3, w, 2); }
  g.fillStyle = u.trim2; g.fillRect(0, 128, w, 10);
  /* small logo tag, front centre (u=.75) */
  g.fillStyle = u.shorts; g.fillRect(1536 - 70, 150, 140, 70); drawLogo(g, 1536 - 42, 186, 46, u.trim, u.shorts, false); g.fillStyle = u.trim; g.font = '800 22px system-ui'; g.textAlign = 'left'; g.fillText('APEX', 1536 - 12, 194);
  /* big vertical APEX on one leg (u~.88, wearer's left front), number on the other (u~.62) */
  const vert = (txt, cx, size) => { g.save(); g.translate(cx, 560); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${size}px "Arial Black",system-ui`; g.lineJoin = 'round';
    g.lineWidth = size * 0.16; g.strokeStyle = u.trim2; g.strokeText(txt, 0, 0); g.lineWidth = size * 0.08; g.strokeStyle = u.trim; g.strokeText(txt, 0, 0); g.fillStyle = u.num; g.fillText(txt, 0, 0); g.restore(); };
  vert('APEX', 1800, 120); vert(String(u._num ?? ''), 1270, 150);
  /* double-stripe hem */
  g.fillStyle = u.trim; g.fillRect(0, h - 70, w, 26); g.fillRect(0, h - 30, w, 30); g.fillStyle = u.trim2; g.fillRect(0, h - 44, w, 14);
}); }
/* a cloth shell cut from the body mesh: keeps the body's skin weights so it moves with the bones */
function shell(body, keep, move, uvf, mat) {
  const g = body.geometry, P = g.attributes.position, Nn = g.attributes.normal, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, idx = g.index;
  const map = new Map(), bp = [], pos = [], nor = [], uv = [], si = [], sw = [], I = [], v = new THREE.Vector3(), n = new THREE.Vector3();
  const add = (i) => { if (map.has(i)) return map.get(i); v.fromBufferAttribute(P, i); n.fromBufferAttribute(Nn, i).normalize(); const o = move(v.clone(), n.clone());
    bp.push(v.x, v.y, v.z); pos.push(o.x, o.y, o.z); nor.push(n.x, n.y, n.z); const t = uvf(v); uv.push(t[0], t[1]);
    si.push(SI.getX(i), SI.getY(i), SI.getZ(i), SI.getW(i)); sw.push(SW.getX(i), SW.getY(i), SW.getZ(i), SW.getW(i)); const k = pos.length / 3 - 1; map.set(i, k); return k; };
  const cnt = idx ? idx.count : P.count; const tri = (k) => (idx ? idx.getX(k) : k);
  for (let k = 0; k < cnt; k += 3) { const a = tri(k), b = tri(k + 1), c = tri(k + 2); const ok = [a, b, c].map((i) => keep(v.fromBufferAttribute(P, i)));
    if (ok[0] && ok[1] && ok[2]) I.push(add(a), add(b), add(c)); }
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); G.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  G.setAttribute('bp', new THREE.Float32BufferAttribute(bp, 3)); G.setIndex(I); G.computeVertexNormals();
  const m = new THREE.SkinnedMesh(G, mat); m.castShadow = true; m.frustumCulled = false; body.parent.add(m); m.bind(body.skeleton, body.bindMatrix); return m; }
function clipMat(m, glsl, trim, key, trim2) { const U = { uTrimC: { value: lin(trim) }, uTrim2: { value: lin(trim2 || trim) } };
  m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 bp; varying vec3 vBp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBp = bp;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBp; uniform vec3 uTrimC, uTrim2;\nfloat clipF(vec3 p){ ' + glsl + ' }')
      .replace('#include <map_fragment>', '#include <map_fragment>\nfloat cf = clipF(vBp); if(cf < 0.) discard; if(cf < .008) diffuseColor.rgb = uTrim2; else if(cf < .034) diffuseColor.rgb = uTrimC; else if(cf < .040) diffuseColor.rgb = uTrim2;'); };
  m.customProgramCacheKey = () => key; return m; }
const ARM = (p) => Math.abs(p.x) > 0.2 && p.y > 1.26;
function bodyMat(orig, u, L) {
  const sk = lin(L.skin), mul = new THREE.Vector3(sk.r / BASE.r, sk.g / BASE.g, sk.b / BASE.b);
  const m = new THREE.MeshPhysicalMaterial({ map: orig.map, roughness: 0.52, sheen: 0.25, sheenRoughness: 0.6, sheenColor: sk.clone().offsetHSL(0, -0.1, 0.12), clearcoat: 0 });
  const U = { uSkin: { value: mul }, uTrim: { value: lin(u.trim) }, uSide: { value: lin(u.side) }, uShoe: { value: lin(u.shoe) }, uSock: { value: lin(u.sock) }, uSleeve: { value: lin(u.sleeve) }, uUnder: { value: lin(u.jersey).multiplyScalar(0.8) },
    uFace: { value: new THREE.Vector4(L.jaw || 0, L.cheek || 0, L.nose || 0, L.brow || 0) }, uLeg: { value: lin(u.leg || '#f4f4f0') } };
  m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vB; uniform vec4 uFace;').replace('#include <begin_vertex>', `#include <begin_vertex>
vB = position; { vec3 p = position; float ax = abs(p.x), y = p.y, m = 0.;
  m += exp(-pow((ax-.24)/.06,2.)-pow((y-1.43)/.07,2.)) * 1.1; m += smoothstep(.27,.33,ax)*smoothstep(.56,.47,ax)*smoothstep(.13,.02,abs(y-1.42)) * .8;
  m += exp(-pow((y-.40)/.08,2.)) * step(p.z,.02) * .8; transformed += objectNormal * m * .012;
  /* subtle face shape (a few millimetres): jaw width, cheekbones, nose width, brow ridge */
  float jaw = exp(-pow((y-1.64)/.03,2.)) * smoothstep(.02,.06,ax) * smoothstep(.1,.06,ax) * step(-.02,p.z);
  float chk = exp(-pow((y-1.69)/.025,2.)-pow((ax-.045)/.02,2.)) * step(.04,p.z);
  float nos = exp(-pow((y-1.675)/.02,2.)-pow(ax/.018,2.)) * step(.07,p.z);
  float brw = exp(-pow((y-1.72)/.012,2.)-pow((ax-.03)/.025,2.)) * step(.06,p.z);
  transformed += objectNormal * (jaw*uFace.x*.007 + chk*uFace.y*.005 + brw*uFace.w*.004); transformed.x += sign(p.x) * nos * uFace.z * .004; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vB; uniform vec3 uSkin,uTrim,uSide,uShoe,uSock,uUnder,uSleeve,uLeg;
vec4 kit(vec3 p){ float ax=abs(p.x); bool arm = ax>.2 && p.y>1.26;
  if(arm && ax>.62 && ax<.68 && p.x>0.) return vec4(uTrim,1.);                  /* wristband, off hand */
  if(arm && p.x<0. && ax>.33 && ax<.68){ vec3 c=uSleeve; if(ax>.66 || ax<.345) c=uTrim;                     /* shooting sleeve, trim cuffs */
    vec2 q=vec2(ax-.5, p.y-1.43); if(p.y>1.40 && q.y < .03 - abs(q.x)*1.6 && q.y > -.005) c=uTrim; return vec4(c,1.); }   /* Apex mark on top of the sleeve */
  if(arm) return vec4(0.);
  if(p.y<.13) return vec4(vec3(.92),1.);                                         /* foot (inside the shoe) */
  if(p.y<.24){ vec3 c=vec3(.95); if(abs(p.y-.215)<.006) c=uSide; return vec4(c,1.); }   /* short white crew socks */
  if(p.y<.52){ vec3 c=uLeg; if(abs(p.y-.27)<.008) c=uTrim; return vec4(c,1.); }   /* white compression leggings, trim band above the sock */
  if(p.y>.55 && p.y<1.30 && ax<.19) return vec4(uUnder,1.);                                 /* hidden under the uniform */
  return vec4(0.); }`).replace('#include <map_fragment>', `#include <map_fragment>
vec4 oc = kit(vB); diffuseColor.rgb = mix(diffuseColor.rgb*uSkin, oc.rgb, oc.a);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nif(oc.a>.5) roughnessFactor = max(roughnessFactor, .55);'); };
  m.customProgramCacheKey = () => 'hoopv5'; return m; }
/* p: game player record, u: uniform colours, L: look {skin, hair:[names], hairCol, browCol, jaw, cheek, nose, brow} */
export function buildHooperQ2(p, u, ukey, L) {
  const J = buildHooperQ(p, u, ukey); let body = null;
  J.q.obj.traverse((o) => { if (o.isSkinnedMesh && o.name.startsWith('SuperHero')) body = o; });
  body.material = bodyMat(body.material, u, L);
  J.q.obj.traverse((o) => { if (o.isMesh && o.name === 'Eyebrows') o.material = new THREE.MeshStandardMaterial({ map: o.material.map, color: lin(L.browCol || L.hairCol), transparent: o.material.transparent, alphaTest: o.material.alphaTest || 0.3, roughness: 0.8 }); });
  /* jersey: sleeveless, scoop armholes, V-neck front, drapes straight down from the chest instead of hugging the stomach */
  buildJersey(body, u, p.num, p.last, drawLogo);
  /* shorts: waist to just below the knee, flaring away from each leg toward the hem */
  const sm = clipMat(new THREE.MeshPhysicalMaterial({ map: shortsTex(Object.assign({}, u, { _num: p.num })), roughness: 0.5, sheen: 0.7, sheenRoughness: 0.3, sheenColor: new THREE.Color('#ffffff'), normalMap: WEAVE, normalScale: new THREE.Vector2(0.3, 0.3), side: THREE.DoubleSide }), 'return min(p.y - .48, 1.115 - p.y);', u.trim, 'shorts', u.trim2);
  buildShorts(body, sm);
  /* headband: thin skinned band around the head, above the ears */
  const hb = clipMat(new THREE.MeshPhysicalMaterial({ color: lin(u.band), roughness: 0.7, sheen: 0.5, side: THREE.DoubleSide }), 'return 1.;', u.band, 'band');
  shell(body, (v) => v.y > 1.735 && v.y < 1.775 && Math.abs(v.x) < 0.13, (v, n) => v.addScaledVector(n, 0.022), (v) => [0, 0], hb);
  buildShoes(body, L.shoe || SHOES[0]);
  /* hair: real CC0 Quaternius hair meshes, skinned to the same rig */
  const bones = J.q.bones;
  for (const n of L.hair || []) { const s = HAIRS[n]; if (!s) continue; const skel = new THREE.Skeleton(s.skeleton.bones.map((b) => bones[b.name] || bones.Head), s.skeleton.boneInverses);
    const m = new THREE.SkinnedMesh(s.geometry, new THREE.MeshStandardMaterial({ map: s.material.map, color: lin(L.hairCol), roughness: 0.65, side: THREE.DoubleSide })); m.frustumCulled = false; m.castShadow = true;
    body.parent.add(m); m.bind(skel, body.bindMatrix); }
  return J;
}

import { mergeGeometries } from './BufferGeometryUtils.js';
export const SHOES = [
  { name: 'Volt Rush', up: '#d7ff2e', acc: '#141414', mark: '#141414', mid: '#ffffff', out: '#141414', lace: '#141414', toe: '#f2f2f2' },
  { name: 'Royal Ice', up: '#f5f7ff', acc: '#1f4fe0', mark: '#1f4fe0', mid: '#ffffff', out: '#1f4fe0', lace: '#1f4fe0', toe: '#dfe6ff' },
  { name: 'Lava Gloss', up: '#ff6a00', acc: '#ffb21a', mark: '#ffffff', mid: '#fff3e0', out: '#7a2a00', lace: '#ffb21a', toe: '#ff8a1a', gloss: 1 },
  { name: 'Galaxy', up: '#283090', acc: '#7c3aed', mark: '#22d3ee', mid: '#15151a', out: '#7c3aed', lace: '#0d0d12', toe: '#3a2ab0', gloss: 1 },
  { name: 'Flamingo', up: '#ff4fa3', acc: '#ffffff', mark: '#ffffff', mid: '#ffffff', out: '#ff4fa3', lace: '#ffffff', toe: '#ff7cbc' } ];
/* original Apex side mark: a rising streak that ends in a triangle tip */
function markShape(L) { const s = new THREE.Shape(); s.moveTo(-0.5 * L, -0.12 * L); s.quadraticCurveTo(0.05 * L, -0.06 * L, 0.32 * L, 0.12 * L); s.lineTo(0.28 * L, 0.02 * L); s.lineTo(0.5 * L, 0.2 * L);
  s.lineTo(0.22 * L, 0.24 * L); s.lineTo(0.27 * L, 0.17 * L); s.quadraticCurveTo(0.0, 0.0, -0.5 * L, -0.12 * L); return s; }
function buildShoes(body, C) {
  const P = body.geometry.attributes.position, bones = body.skeleton.bones, bi = (n) => bones.findIndex((b) => b.name === n);
  const M = (c, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: lin(c), roughness: C.gloss ? 0.22 : 0.45, clearcoat: C.gloss ? 0.9 : 0.25, clearcoatRoughness: 0.2 }, o));
  const mats = [M(C.out, { roughness: 0.8, clearcoat: 0 }), M(C.mid, { roughness: 0.6, clearcoat: 0 }), M(C.up), M(C.acc), M(C.mark), M(C.lace, { roughness: 0.7, clearcoat: 0 }), M(C.toe), M('#f4f4f4', { roughness: 0.85, clearcoat: 0 })];
  for (const side of [1, -1]) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; const v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); if (v.y < 0.09 && Math.sign(v.x) === side) { x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); } }
    const cx = (x0 + x1) / 2, W = (x1 - x0) + 0.03, Lz = (z1 - z0) + 0.035, cz = (z0 + z1) / 2 + 0.006, parts = [];
    const add = (g, mi) => { g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv'); parts.push([g, mi]); };
    /* footprint: wider forefoot, narrower heel */
    const fp = (sc, inset = 0) => { const s = new THREE.Shape(), n = 28; for (let k = 0; k <= n; k++) { const a = (k / n) * Math.PI * 2, zz = Math.cos(a), ww = (zz > 0 ? 1 : 0.86) * (W / 2 - inset) * sc;
      const px = Math.sin(a) * ww, pz = zz * (Lz / 2 - inset) * sc; k ? s.lineTo(px, -pz) : s.moveTo(px, -pz); } return s; };
    const ex = (sh, d, y, bev = 0.006) => { const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8 }); g.rotateX(-Math.PI / 2); g.translate(cx, y, cz); return g; };
    add(ex(fp(1.0), 0.006, 0.004, 0.004), 0);                       /* rubber outsole */
    add(ex(fp(1.03), 0.026, 0.014, 0.008), 1);                      /* chunky midsole */
    /* upper: half-ellipsoid shell over the foot + mid-top ankle collar */
    const up = new THREE.SphereGeometry(1, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2); up.scale(W / 2 * 0.98, 0.085, Lz / 2 * 0.98); up.translate(cx, 0.045, cz); add(up, 2);
    const col = new THREE.CylinderGeometry(0.054, 0.064, 0.085, 24, 1, false); col.translate(cx, 0.085, cz - Lz * 0.22); add(col, 2);
    const pad = new THREE.TorusGeometry(0.058, 0.012, 8, 24); pad.rotateX(Math.PI / 2 - 0.3); pad.translate(cx, 0.128, cz - Lz * 0.23); add(pad, 3);   /* padded collar */
    const toe = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); toe.scale(W / 2 * 0.99, 0.045, Lz * 0.2); toe.translate(cx, 0.042, cz + Lz * 0.3); add(toe, 6);
    const heel = new THREE.CylinderGeometry(0.066, 0.07, 0.085, 20, 1, true, Math.PI * 0.6, Math.PI * 0.8); heel.translate(cx, 0.085, cz - Lz * 0.25); add(heel, 3);   /* heel counter */
    const tng = new THREE.BoxGeometry(0.05, 0.075, 0.014); tng.rotateX(-0.55); tng.translate(cx, 0.128, cz - Lz * 0.06); add(tng, 2);   /* tongue */
    for (let k = 0; k < 6; k++) { const zz = cz + Lz * (0.14 - k * 0.055), t = (zz - cz) / (Lz / 2 * 0.98), yy = 0.045 + 0.085 * Math.sqrt(Math.max(0, 1 - t * t)) + 0.002;
      const l = new THREE.BoxGeometry(0.05, 0.006, 0.011); l.rotateX(-0.5); l.translate(cx, yy, zz); add(l, 5); }   /* laces */
    const eye = new THREE.BoxGeometry(0.066, 0.006, Lz * 0.34); eye.rotateX(-0.42); eye.translate(cx, 0.112, cz + Lz * 0.02); add(eye, 3);   /* eyestay */
    for (const s2 of [1, -1]) { const mk = new THREE.ExtrudeGeometry(markShape(Lz * 0.62), { depth: 0.003, bevelEnabled: false }); mk.rotateY(s2 * Math.PI / 2); mk.scale(1, 1, s2 * 1);
      mk.translate(cx + s2 * (W / 2 * 0.98 + 0.002), 0.07, cz - Lz * 0.02); add(mk, 4); }
    const g = mergeGeometries(parts.map((p) => p[0]), true); g.groups.forEach((gr, i) => (gr.materialIndex = parts[i][1]));
    const n = g.attributes.position.count, fb = bi(side > 0 ? 'foot_l' : 'foot_r'), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = fb; sw[i * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    const m = new THREE.SkinnedMesh(g, mats); m.castShadow = true; m.frustumCulled = false; body.parent.add(m); m.bind(body.skeleton, body.bindMatrix); }
}

/* v7 shorts: loose fabric built from support functions (convex), so no groin/thigh contour can show.
   A single skirt-like tube hangs from the hips to mid-thigh (flat bridge between the legs), and two loose leg tubes continue to the hem. */
function buildShorts(body, mat) {
  const P = body.geometry.attributes.position, SI = body.geometry.attributes.skinIndex, SW = body.geometry.attributes.skinWeight, n0 = P.count;
  const pts = new Float32Array(n0 * 3); for (let k = 0; k < n0; k++) { pts[k * 3] = P.getX(k); pts[k * 3 + 1] = P.getY(k); pts[k * 3 + 2] = P.getZ(k); }
  const isArm = (x, y) => Math.abs(x) > 0.2 && y > 0.75;
  const NA = 96, pos = [], bp = [], uv = [], I = [], wsrc = [];
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  /* support radius of the body slice around centre (cx,cz) in direction th */
  function support(y0, y1, cx, cz, side) { const h = new Float32Array(NA).fill(0.05);
    for (let k = 0; k < n0; k++) { const x = pts[k * 3], y = pts[k * 3 + 1], z = pts[k * 3 + 2]; if (y < y0 || y > y1 || isArm(x, y)) continue; if (side && Math.sign(x) !== side) continue;
      for (let j = 0; j < NA; j++) { const th = -Math.PI / 2 + j / NA * Math.PI * 2, d = (x - cx) * Math.sin(th) + (z - cz) * Math.cos(th); if (d > h[j]) h[j] = d; } }
    for (let p = 0; p < 6; p++) { const c = h.slice(); for (let j = 0; j < NA; j++) h[j] = (c[(j + NA - 1) % NA] + 2 * c[j] + c[(j + 1) % NA]) / 4; } return h; }
  function tube(rings, uOff, uScale) { const base = pos.length / 3;
    for (const r of rings) for (let j = 0; j <= NA; j++) { const jj = j % NA, th = -Math.PI / 2 + j / NA * Math.PI * 2, R = r.h[jj] + r.off;
      const x = r.cx + Math.sin(th) * R, z = r.cz + Math.cos(th) * R; pos.push(x, r.y, z); bp.push(x, r.y, z);
      uv.push(r.cx ? 0.5 + (th - Math.sign(r.cx) * Math.PI / 2) / (Math.PI * 2) * 0.5 : th / (Math.PI * 2) + 0.75, (r.y - 0.48) / 0.635); }
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < NA; j++) { const a = base + i * (NA + 1) + j, b = a + NA + 1; I.push(a, a + 1, b, b, a + 1, b + 1); } }
  /* skirt: waist 1.16 -> 0.66; its girth never smaller than the hip girth, so it hangs straight */
  const hipH = support(0.86, 1.0, 0, 0, 0); const sk = [];
  for (let i = 0; i <= 40; i++) { const y = 1.16 - i / 40 * 0.53, loc = support(y - 0.03, y + 0.03, 0, 0, 0), w = sstep(1.12, 1.0, y), hh = new Float32Array(NA);
    for (let j = 0; j < NA; j++) hh[j] = Math.max(loc[j], hipH[j] * w + loc[j] * (1 - w));
    const th0 = (j) => -Math.PI / 2 + j / NA * Math.PI * 2; for (let j = 0; j < NA; j++) hh[j] += Math.sin(th0(j) * 12 + Math.sin(th0(j) * 3)) * 0.006 * sstep(1.0, 0.75, y);   /* slight crease */
    sk.push({ y, cx: 0, cz: 0.0, h: hh, off: 0.012 + 0.02 * sstep(1.12, 0.9, y) + 0.03 * sstep(0.8, 0.66, y) }); }
  tube(sk, 0, 1); const nSk = pos.length / 3;
  const skEnd = sk[sk.length - 1];
  /* legs: 0.86 -> 0.43, each around its own thigh centre, loosening toward the hem; kept inside the skirt above 0.66 */
  for (const s of [-1, 1]) { const rings = [];
    for (let i = 0; i <= 30; i++) { const y = 0.72 - i / 30 * 0.24; let cx = 0, cz = 0, c = 0;
      for (let k = 0; k < n0; k++) { const x = pts[k * 3], yy = pts[k * 3 + 1]; if (Math.abs(yy - y) < 0.03 && Math.sign(x) === s && !isArm(x, yy)) { cx += x; cz += pts[k * 3 + 2]; c++; } }
      cx /= c || 1; cz /= c || 1; const hh = support(y - 0.03, y + 0.03, cx, cz, s);
      rings.push({ y, cx, cz, h: hh, off: 0.032 + 0.018 * sstep(0.8, 0.45, y) }); }
    for (let p = 0; p < 12; p++) { const c = rings.map((r) => ({ cx: r.cx, cz: r.cz, h: r.h.slice() })); for (let i = 1; i < rings.length - 1; i++) { rings[i].cx = (c[i - 1].cx + 2 * c[i].cx + c[i + 1].cx) / 4; rings[i].cz = (c[i - 1].cz + 2 * c[i].cz + c[i + 1].cz) / 4; for (let j = 0; j < NA; j++) rings[i].h[j] = Math.max(c[i].h[j], (c[i - 1].h[j] + 2 * c[i].h[j] + c[i + 1].h[j]) / 4); } }
    for (const r of rings) for (let j = 0; j < NA; j++) r.h[j] = Math.max(r.h[j], r.h[(j + NA / 2) % NA] * 0.0);
    tube(rings, 0, 1); }
  /* skin weights: blend the 12 nearest body verts (y-bucketed) */
  const nv = pos.length / 3, si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), BK = {};
  for (let k = 0; k < n0; k++) { const y = pts[k * 3 + 1]; if (y < 0.3 || y > 1.25 || isArm(pts[k * 3], y)) continue; const b0 = Math.floor(y / 0.04); (BK[b0] || (BK[b0] = [])).push(k); }
  const K = 12, bd = new Float32Array(K), bix = new Int32Array(K);
  for (let v = 0; v < nv; v++) { const x = pos[v * 3], z = pos[v * 3 + 2], y = v < nSk ? Math.max(pos[v * 3 + 1], 0.86 + 0.1 * Math.max(0, 0.86 - pos[v * 3 + 1])) : pos[v * 3 + 1]; bd.fill(1e9); bix.fill(0); const by = Math.floor(y / 0.04);
    for (let bb = by - 2; bb <= by + 2; bb++) for (const c of (BK[bb] || [])) { const d = (pts[c * 3] - x) ** 2 + (pts[c * 3 + 1] - y) ** 2 + (pts[c * 3 + 2] - z) ** 2;
      if (d < bd[K - 1]) { let p = K - 1; while (p > 0 && bd[p - 1] > d) { bd[p] = bd[p - 1]; bix[p] = bix[p - 1]; p--; } bd[p] = d; bix[p] = c; } }
    const acc = new Map(); for (let t = 0; t < K; t++) { if (bd[t] >= 1e9) continue; const w0 = 1 / (Math.sqrt(bd[t]) + 0.01); for (let c = 0; c < 4; c++) { const bI = SI.getComponent(bix[t], c), wv = SW.getComponent(bix[t], c) * w0; if (wv > 0) acc.set(bI, (acc.get(bI) || 0) + wv); } }
    const t4 = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4), tot = t4.reduce((s, e) => s + e[1], 0) || 1;
    for (let c = 0; c < 4; c++) { si[v * 4 + c] = t4[c] ? t4[c][0] : 0; sw[v * 4 + c] = t4[c] ? t4[c][1] / tot : 0; } }
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('bp', new THREE.Float32BufferAttribute(bp, 3));
  G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); G.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); G.setIndex(I); G.computeVertexNormals();
  const m = new THREE.SkinnedMesh(G, mat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; body.parent.add(m); m.bind(body.skeleton, body.bindMatrix); return m; }
