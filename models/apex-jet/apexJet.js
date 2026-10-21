/* Apex Arcade Jet - realistic PBR model, 6 body styles x 8 paints + controls.
   three.js is passed in (tested r128 offline demo; written for r128..r169+).
   Axes: +Z nose, +Y up, +X LEFT wing (same as apexflight.html). Units: metres. */
import { createFlightModel, makeJetConfig } from './flightModel.js';

export const JET_PAINTS = [
  { name: 'Neon Strike',      body: '#16191e', accent: '#00e5ff', trim: '#ff2bd6', metal: 0.35, rough: 0.32, gloss: 1 },
  { name: 'Inferno',          body: '#b8170f', accent: '#ffb000', trim: '#1a0d08', metal: 0.25, rough: 0.3,  gloss: 1 },
  { name: 'Royal',            body: '#3b1670', accent: '#f5c542', trim: '#120624', metal: 0.4,  rough: 0.3,  gloss: 1 },
  { name: 'Midnight Stealth', body: '#33383f', accent: '#454b55', trim: '#c8102e', metal: 0.05, rough: 0.88, gloss: 0 },
  { name: 'Arctic',           body: '#e9eef4', accent: '#1f6fd6', trim: '#0c2340', metal: 0.1,  rough: 0.35, gloss: 1 },
  { name: 'Toxic',            body: '#121512', accent: '#7cff1f', trim: '#e9ff4a', metal: 0.3,  rough: 0.35, gloss: 1 },
  { name: 'Chrome',           body: '#e6e9ee', accent: '#7d848e', trim: '#111418', metal: 1.0,  rough: 0.07, gloss: 0.4 },
  { name: 'Sunset',           body: '#ff6a1f', accent: '#ff2d8a', trim: '#2b0f3a', metal: 0.25, rough: 0.3,  gloss: 1 }
];
/* prof: fuselage radius [r, z] tail->nose.  fus: [widthScale, heightScale, topBulge, squareness(2=ellipse)]
   waist: area-rule pinch {z, amt, len}.  wing: planform [x,z] (root..tip; trapezoid derived), y, tc (thickness/chord), dihedral (rad).
   surf: hinged surfaces at the trailing edge. cfgMul: multiplies the preset (arcade/normal/pro) values. */
export const JET_STYLES = {
  fighter: { name: 'Twin-Tail Fighter', G: 1.75, fus: [1.15, 0.84, 1.15, 2.3], waist: { z: -1.6, amt: .1, len: 2.2 },
    prof: [[.52,-6.85],[.64,-6.4],[.8,-5.2],[.88,-3.5],[.92,-1],[.92,1.5],[.84,3],[.64,4.4],[.4,5.6],[.17,6.4],[.02,6.85]],
    wing: { y: -.18, tc: .05, dih: -.03, pts: [[.7,2.1],[4.95,-2.15],[4.95,-2.75],[.7,-3.05]] },
    surf: [{ t: 'roll', x: 3.95, z: -2.75, w: 1.9, d: .5 }, { t: 'flap', x: 1.85, z: -3.0, w: 2.25, d: .55 }],
    stab: { x: .95, y: -.12, z: -5.6, pts: [[0,.9],[2.45,-.75],[2.45,-1.2],[0,-1.25]] },
    fins: { x: .82, y: .45, cant: .26, pts: [[-3.9,0],[-5.55,2.85],[-6.35,2.85],[-6.4,0]], rz: -6.15, rh: 1.5, ry: 1.25 },
    intake: { type: 'side', x: .98, y: -.3, z: .5, len: 3.6, r: .4 }, lerx: [[.6,4.2],[1.25,2.1],[1.25,.5],[.6,.5]],
    canopy: { y: .5, z: 3.15, s: [.5, .62, 1.75] }, missiles: true, probe: true,
    gear: { nz: 4.3, nr: .3, mx: 1.25, mz: -1.1, mr: .4 }, noz: [{ x: 0, y: 0, z: -7.2, r: .55 }],
    tip: [5.1, -.18, -.4], strobe: [0, .35, -6.95], cfgMul: {} },
  delta: { name: 'Delta Interceptor', G: 1.85, fus: [1.1, .86, 1.1, 2.2], waist: { z: -2.5, amt: .09, len: 2.6 },
    prof: [[.55,-7.2],[.7,-6.6],[.85,-4],[.88,0],[.8,2.5],[.55,4.5],[.3,6],[.1,6.9],[.02,7.2]],
    wing: { y: -.2, tc: .045, dih: -.02, pts: [[.8,1.6],[4.6,-5.55],[4.6,-6.0],[.8,-6.0]] },
    surf: [{ t: 'elevon', x: 1.95, z: -6.0, w: 2.1, d: .55 }, { t: 'elevon', x: 3.65, z: -6.0, w: 1.5, d: .5 }],
    fin1: { y: .55, pts: [[-2.6,0],[-5.5,3.2],[-6.6,3.2],[-6.9,0]], rz: -6.75, rh: 2.3, ry: 1.45 },
    intake: { type: 'side', x: 1.02, y: -.25, z: -.2, len: 4.2, r: .42 },
    canopy: { y: .52, z: 3.7, s: [.5, .6, 1.6] }, missiles: true, probe: true,
    gear: { nz: 4.6, nr: .3, mx: 1.55, mz: -2.6, mr: .42 }, noz: [{ x: 0, y: 0, z: -7.55, r: .58 }],
    tip: [4.65, -.2, -5.8], strobe: [0, 3.3, -6.3],
    cfgMul: { maxSpeed: 1.12, cruiseSpeed: 1.15, rollRate: .9, pitchRate: .85, stallSpeed: 1.1, takeoffSpeed: 1.08 } },
  fwdswept: { name: 'Forward-Swept X', G: 1.75, fus: [1.1, .86, 1.12, 2.25], waist: { z: -1.8, amt: .1, len: 2 },
    prof: [[.5,-6.6],[.7,-6],[.88,-3],[.92,0],[.85,2.5],[.6,4.2],[.3,5.6],[.02,6.6]],
    wing: { y: -.15, tc: .05, dih: .02, pts: [[.8,-.4],[5.2,1.5],[5.2,.6],[.8,-3.4]] },
    surf: [{ t: 'roll', x: 4.1, z: .1, w: 1.8, d: .45, sweep: -.712 }, { t: 'flap', x: 2.0, z: -2.33, w: 2.0, d: .5, sweep: -.712 }],
    canards: { y: .1, pts: [[.75,3.6],[2.5,2.75],[2.5,2.3],[.75,2.1]] },
    stab: { x: .9, y: -.05, z: -5.3, pts: [[0,.5],[1.9,-.6],[1.9,-1],[0,-1.1]] },
    fin1: { y: .55, pts: [[-3.2,0],[-5.2,2.7],[-6.1,2.7],[-6.3,0]], rz: -6.05, rh: 1.8, ry: 1.25 },
    intake: { type: 'side', x: 1.0, y: -.3, z: .6, len: 3.4, r: .4 },
    canopy: { y: .52, z: 3.35, s: [.5, .62, 1.6] }, missiles: true, probe: true,
    gear: { nz: 4.2, nr: .3, mx: 1.35, mz: -1.6, mr: .4 }, noz: [{ x: 0, y: 0, z: -6.95, r: .56 }],
    tip: [5.3, -.15, 1.0], strobe: [0, 3.2, -5.8],
    cfgMul: { pitchRate: 1.25, rollRate: 1.2, gLimit: 1.12, damping: 1.2, stallSpeed: .92 } },
  stealth: { name: 'Stealth Wing', G: 1.45, fus: [1.5, .5, 1.3, 2], faceted: true, segs: 6,
    prof: [[.5,-4.3],[1.0,-3.2],[1.3,-1],[1.25,1],[.95,2.6],[.45,3.7],[.02,4.3]],
    wing: { y: -.05, t: .22, flat: true, pts: [[.9,3.6],[6.6,-1.5],[6.6,-2.25],[5.0,-3.1],[3.7,-2.25],[2.3,-3.1],[.9,-2.6]] },
    surf: [{ t: 'elevon', x: 5.75, z: -2.55, w: 1.4, d: .45, sweep: .49 }, { t: 'elevon', x: 4.35, z: -2.6, w: 1.1, d: .45, sweep: -.57 }, { t: 'yawsplit', x: 6.2, z: -1.9, w: .7, d: .4 }],
    intake: { type: 'dorsal', x: .75, y: .45, z: .6, len: 2.2, r: .32 },
    canopy: { y: .42, z: 2.1, s: [.48, .38, 1.15] },
    gear: { nz: 2.6, nr: .28, mx: 2.0, mz: -1.0, mr: .36, my: -.5 }, noz: [{ x: .85, y: .25, z: -4.1, r: .34, flat: true }, { x: -.85, y: .25, z: -4.1, r: .34, flat: true }],
    tip: [6.65, -.05, -1.85], strobe: [0, .7, -3.2],
    cfgMul: { maxSpeed: .88, cruiseSpeed: .88, rollRate: .7, pitchRate: .8, yawRate: .7, stallSpeed: .9, liftCoefficient: 1.15 } },
  sport: { name: 'Sport Jet', G: 1.55, fus: [1, 1.05, 1.0, 2.1],
    prof: [[.22,-6.6],[.5,-5.5],[.8,-3.5],[.95,-1],[.95,2.5],[.8,4],[.5,5.3],[.2,6.1],[.02,6.45]],
    wing: { y: -.58, tc: .11, dih: .06, pts: [[.8,1.0],[5.7,-1.25],[5.7,-1.85],[.8,-2.3]] },
    surf: [{ t: 'roll', x: 4.55, z: -1.73, w: 1.8, d: .45, sweep: -.09 }, { t: 'flap', x: 2.2, z: -2.14, w: 2.3, d: .5, sweep: -.09 }],
    winglets: true,
    fin1: { y: .7, pts: [[-3.3,0],[-5.3,2.45],[-6.2,2.45],[-6.4,0]], rz: -6.1, rh: 1.7, ry: 1.0 },
    stab: { x: .05, y: 3.12, z: -5.5, pts: [[0,.35],[2.3,-.55],[2.3,-.95],[0,-1.0]] },
    intake: { type: 'pods', x: 1.25, y: .45, z: -3.4, len: 2.6, r: .4 },
    canopy: { y: .55, z: 4.1, s: [.62, .5, 1.25] }, windows: true,
    gear: { nz: 4.4, nr: .28, mx: 1.6, mz: -1.3, mr: .36, my: -.75 }, noz: [{ x: 1.25, y: .45, z: -4.8, r: .32 }, { x: -1.25, y: .45, z: -4.8, r: .32 }],
    tip: [5.75, .05, -1.6], strobe: [0, 3.2, -6.35],
    cfgMul: { maxSpeed: .8, cruiseSpeed: .82, rollRate: .65, pitchRate: .7, gLimit: .55, stallSpeed: .85, takeoffSpeed: .85, afterburnerBoost: .85, liftCoefficient: 1.15 } },
  canard: { name: 'Canard Racer', G: 1.6, fus: [1, .92, 1.15, 2.2], waist: { z: -1.8, amt: .08, len: 2 },
    prof: [[.5,-5.9],[.65,-5.3],[.8,-3],[.82,0],[.75,2],[.5,3.8],[.25,5],[.02,5.9]],
    wing: { y: -.15, tc: .045, dih: -.02, pts: [[.7,.5],[4.1,-4.3],[4.1,-4.7],[.7,-4.7]] },
    surf: [{ t: 'elevon', x: 1.75, z: -4.7, w: 1.9, d: .5 }, { t: 'elevon', x: 3.25, z: -4.7, w: 1.1, d: .45 }],
    canards: { y: .2, pts: [[.6,3.1],[2.05,2.1],[2.05,1.7],[.6,1.6]] },
    fin1: { y: .55, pts: [[-2.0,0],[-4.5,2.6],[-5.4,2.6],[-5.7,0]], rz: -5.55, rh: 1.9, ry: 1.15 },
    intake: { type: 'chin', x: 0, y: -.72, z: .4, len: 3.2, r: .45 },
    canopy: { y: .5, z: 2.6, s: [.48, .62, 1.5] }, missiles: true, probe: true,
    gear: { nz: 3.4, nr: .28, mx: 1.3, mz: -2.3, mr: .38 }, noz: [{ x: 0, y: 0, z: -6.25, r: .5 }],
    tip: [4.2, -.15, -4.5], strobe: [0, 2.75, -5.2],
    cfgMul: { maxSpeed: .96, rollRate: 1.35, pitchRate: 1.3, gLimit: 1.18, damping: 1.4 } }
};
export const JET_STYLE_KEYS = Object.keys(JET_STYLES);
export const JET_GEAR_HEIGHT = 1.75; // fighter; use jet.gearHeight for the current style
export function jetConfigFor(preset, styleKey, overrides = {}) {
  const st = JET_STYLES[styleKey] || JET_STYLES.fighter, c = makeJetConfig(preset);
  for (const k in st.cfgMul) c[k] *= st.cfgMul[k];
  c.gearHeight = st.G; return Object.assign(c, overrides);
}

/* ---------------- geometry helpers ---------------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;
function mkGeo(THREE, pos, uv, idx, col) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (col) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
/* fuselage loft: superellipse cross-sections along z with an area-ruled waist + baked AO in vertex colours.
   UV: u around (0 = belly, .25 = +X side, .5 = top, .75 = -X side), v along length (0 tail -> 1 nose). */
function loftFuselage(THREE, S) {
  const P = S.prof, z0 = P[0][1], z1 = P[P.length - 1][1], N = S.faceted ? 24 : 84, NA = S.segs || 44;
  const [sx, sy, top, nexp] = S.fus;
  const rAt = z => { for (let i = 1; i < P.length; i++) if (z <= P[i][1]) { const t = (z - P[i - 1][1]) / (P[i][1] - P[i - 1][1]); return lerp(P[i - 1][0], P[i][0], t); } return P[P.length - 1][0]; };
  let zs = [], rs = [];
  for (let i = 0; i <= N; i++) { const t = i / N, tt = 1 - Math.pow(1 - t, 1.25); const z = lerp(z0, z1, tt); zs.push(z); rs.push(rAt(z)); }
  if (!S.faceted) for (let k = 0; k < 4; k++) rs = rs.map((r, i) => (i === 0 || i === N) ? r : (rs[i - 1] + 2 * r + rs[i + 1]) / 4);
  // round the nose: sqrt-ish taper for the last 12 %
  const pos = [], uv = [], col = [], idx = [];
  const wy = S.wing.y;
  for (let i = 0; i <= N; i++) {
    const z = zs[i]; let r = rs[i];
    const nz = (z - z0) / (z1 - z0);
    if (i === N) r = 0.0;
    let wx = 1; if (S.waist) wx -= S.waist.amt * Math.exp(-Math.pow((z - S.waist.z) / S.waist.len, 2));
    for (let j = 0; j <= NA; j++) {
      const a = j / NA * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a);
      const ex = 2 / nexp;
      const x = r * sx * wx * Math.sign(s) * Math.pow(Math.abs(s), ex);
      let y = r * sy * Math.sign(c) * Math.pow(Math.abs(c), ex); if (y > 0) y *= top;
      pos.push(x, y, z); uv.push(j / NA, nz);
      // baked AO: darker belly + crease where the wing meets the body + darker near the tail pipe
      let ao = 1 - 0.28 * Math.pow(Math.max(0, -c), 2.2);
      ao -= 0.18 * Math.exp(-Math.pow((y - wy) / 0.18, 2)) * (Math.abs(s) > 0.6 ? 1 : 0);
      ao -= 0.15 * Math.max(0, 1 - nz / 0.06);
      col.push(ao, ao, ao);
    }
  }
  const R = NA + 1;
  for (let i = 0; i < N; i++) for (let j = 0; j < NA; j++) { const a = i * R + j, b = a + R; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // tail cap
  const c0 = pos.length / 3; pos.push(0, 0, z0); uv.push(.5, 0); col.push(.3, .3, .3);
  for (let j = 0; j < NA; j++) idx.push(c0, j + 1, j);
  return mkGeo(THREE, pos, uv, idx, col);
}
/* tapered airfoil surface (NACA 00xx), rounded tip.  root/tip = {s, le, te} (span coord, leading/trailing z).
   map(s, t, c) -> [x,y,z]; uvf(s, c, upper) -> [u,v] */
function airfoil(THREE, root, tip, tc, map, uvf, opt = {}) {
  const NC = opt.nc || 12, NS = opt.ns || 6;
  const xs = []; for (let i = 0; i < NC; i++) xs.push((1 - Math.cos(Math.PI * i / (NC - 1))) / 2);
  const yt = x => 5 * tc * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  const st = [];
  for (let j = 0; j <= NS; j++) { const f = j / NS; st.push({ s: lerp(root.s, tip.s, f), le: lerp(root.le, tip.le, f), te: lerp(root.te, tip.te, f), tf: 1 }); }
  if (opt.roundTip !== false) { const T = st[NS], ch = Math.abs(T.le - T.te), d = Math.sign(tip.s - root.s) || 1;
    st.push({ s: T.s + d * ch * 0.025, le: T.le - ch * .02, te: T.te, tf: .62 }); st.push({ s: T.s + d * ch * 0.045, le: T.le - ch * .06, te: T.te + ch * .02, tf: .18 }); }
  const pos = [], uv = [], idx = [];
  const ring = [];
  for (let i = NC - 1; i >= 0; i--) ring.push([xs[i], 1]);
  for (let i = 1; i < NC; i++) ring.push([xs[i], -1]);
  const M = ring.length;
  for (const S of st) {
    const ch = S.le - S.te;
    for (const [x, sg] of ring) {
      const c = S.le - ch * x, t = sg * yt(x) * Math.abs(ch) * S.tf;
      pos.push(...map(S.s, t, c)); uv.push(...uvf(S.s, c, sg > 0));
    }
  }
  for (let j = 0; j < st.length - 1; j++) for (let k = 0; k < M - 1; k++) { const a = j * M + k, b = a + M; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // caps
  for (const [j, flip] of [[0, 1], [st.length - 1, 0]]) {
    const S = st[j], c0 = pos.length / 3; pos.push(...map(S.s, 0, (S.le + S.te) / 2)); uv.push(...uvf(S.s, (S.le + S.te) / 2, true));
    for (let k = 0; k < M - 1; k++) flip ? idx.push(c0, j * M + k + 1, j * M + k) : idx.push(c0, j * M + k, j * M + k + 1);
  }
  return mkGeo(THREE, pos, uv, idx);
}
function trapezoid(pts) {
  const xmin = Math.min(...pts.map(p => p[0])), xmax = Math.max(...pts.map(p => p[0]));
  const at = x => { const zz = pts.filter(p => Math.abs(p[0] - x) < 1e-6).map(p => p[1]); return { s: x, le: Math.max(...zz), te: Math.min(...zz) }; };
  return [at(xmin), at(xmax)];
}
/* canvas -> normal map (height in red channel) */
function heightToNormal(THREE, hc, strength) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), out = x.createImageData(w, h), d = out.data;
  const H = (i, j) => src[(((j + h) % h) * w + ((i + w) % w)) * 4] / 255;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let nx = (H(i - 1, j) - H(i + 1, j)) * strength, ny = (H(i, j + 1) - H(i, j - 1)) * strength, nz = 1;
    const l = Math.hypot(nx, ny, nz); const k = (j * w + i) * 4;
    d[k] = (nx / l * .5 + .5) * 255; d[k + 1] = (ny / l * .5 + .5) * 255; d[k + 2] = (nz / l * .5 + .5) * 255; d[k + 3] = 255;
  }
  x.putImageData(out, 0, 0); return c;
}

const FLAME_VS = `varying vec2 vUv; varying float vF;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix * normal);
 vF = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`;
const FLAME_FS = `uniform float uT, uAB, uThr, uInner; varying vec2 vUv; varying float vF;
void main(){ float t = vUv.y;
 float n = sin(t*38.0 - uT*55.0 + vUv.x*12.0)*0.5+0.5;
 float dia = pow(abs(sin(t*3.14159*5.5)), 12.0) * (1.0 - t) * uAB;
 vec3 hot = mix(vec3(1.0,0.62,0.22), vec3(0.45,0.55,1.0), uInner);
 vec3 col = mix(vec3(1.0,0.96,0.86), hot, clamp(t*1.6,0.0,1.0));
 col = mix(col, vec3(1.0,0.35,0.08), smoothstep(0.55,1.0,t)*(1.0-uInner));
 float a = pow(1.0 - t, 1.4) * (0.25 + 0.75*vF*vF) * (0.65 + 0.35*n) * (0.15 + 0.85*max(uAB, uThr*0.35));
 col += dia * vec3(1.0,0.85,0.6) * 2.5;
 gl_FragColor = vec4(col * a, a); }`;
const TRAIL_VS = `attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const TRAIL_FS = `varying float vA; void main(){ gl_FragColor = vec4(vec3(0.97,0.98,1.0), vA); }`;

export function createApexJet(THREE, opts = {}) {
  const group = new THREE.Group(); group.name = 'ApexJet';
  const fx = new THREE.Group(); fx.name = 'ApexJetFX';          // flames (follow the jet; outside group so the size box ignores them)
  const worldFx = new THREE.Group(); worldFx.name = 'ApexJetTrails'; // wingtip vapour trails (world space)
  const shared = [], keep = o => (shared.push(o), o);
  const sRGB = t => { if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace; else t.encoding = THREE.sRGBEncoding; return t; };
  const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const tex = (c, srgb) => { const t = keep(new THREE.CanvasTexture(c)); t.anisotropy = 8; if (srgb) sRGB(t); return t; };
  // canvases
  const skinC = mkC(1024, 2048), wingC = mkC(1024, 1024), finC = mkC(512, 512);
  const skinH = mkC(512, 1024), wingH = mkC(512, 512), grimeC = mkC(512, 512), tireC = mkC(256, 64);
  const skinT = tex(skinC, true), wingT = tex(wingC, true), finT = tex(finC, true);
  let skinN = null, wingN = null; const grimeT = tex(grimeC, false), tireT = tex(tireC, true);
  const P = (o) => keep(new THREE.MeshPhysicalMaterial(Object.assign({ metalness: .3, roughness: .4, side: THREE.DoubleSide }, o)));
  const M = {
    fus: P({ map: skinT, roughnessMap: grimeT, vertexColors: true }),
    wing: P({ map: wingT, roughnessMap: grimeT }),
    fin: P({ map: finT, roughnessMap: grimeT }),
    accent: P({ color: 0xffffff }), body: P({ color: 0xffffff }),
    trim: P({ color: 0x222222, roughness: .5 }),
    dark: keep(new THREE.MeshStandardMaterial({ color: 0x050506, roughness: .95, metalness: 0, side: THREE.DoubleSide })),
    metal: keep(new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 1, roughness: .28 })),
    chrome: keep(new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 1, roughness: .06 })),
    gunmetal: keep(new THREE.MeshStandardMaterial({ color: 0x3b3d40, metalness: .9, roughness: .4 })),
    burnt: keep(new THREE.MeshStandardMaterial({ color: 0x5a4a3a, metalness: .95, roughness: .38, side: THREE.DoubleSide })),
    tire: keep(new THREE.MeshStandardMaterial({ map: tireT, color: 0xffffff, roughness: .92, metalness: 0 })),
    gearPaint: keep(new THREE.MeshStandardMaterial({ color: 0xd8dadc, roughness: .45, metalness: .2 })),
    glass: P({ color: 0xf3d58a, metalness: .6, roughness: .02, transparent: true, opacity: .45, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2, depthWrite: false }),
    visor: keep(new THREE.MeshStandardMaterial({ color: 0x1a1206, metalness: .9, roughness: .05 })),
    suit: keep(new THREE.MeshStandardMaterial({ color: 0x4d5a3a, roughness: .9 })),
    helmet: P({ color: 0xf2f2f2, roughness: .25, clearcoat: 1 }),
    missile: P({ color: 0xe9e9e6, roughness: .45 }),
    window: keep(new THREE.MeshStandardMaterial({ color: 0x0b131c, metalness: .9, roughness: .05 })),
    core: keep(new THREE.MeshBasicMaterial({ color: 0xff7a1a })),
    red: keep(new THREE.MeshBasicMaterial({ color: 0xff2020 })), green: keep(new THREE.MeshBasicMaterial({ color: 0x20ff50 })),
    white: keep(new THREE.MeshBasicMaterial({ color: 0xffffff })), beacon: keep(new THREE.MeshBasicMaterial({ color: 0xff2020 }))
  };
  const paintMats = [M.fus, M.wing, M.fin, M.body];
  const flameU = { uT: { value: 0 }, uAB: { value: 0 }, uThr: { value: 0 } };
  const flameMat = inner => keep(new THREE.ShaderMaterial({ uniforms: Object.assign({ uInner: { value: inner } }, flameU), vertexShader: FLAME_VS, fragmentShader: FLAME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  const flameO = flameMat(0), flameI = flameMat(1);
  const glow = new THREE.PointLight(0xff8a30, 0, 22, 2); fx.add(glow);
  const strobeL = new THREE.PointLight(0xffffff, 0, 14, 2); group.add(strobeL);
  // tire tread texture (static)
  { const x = tireC.getContext('2d'); x.fillStyle = '#1b1b1c'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#0a0a0a';
    for (const v of [14, 26, 38, 50]) x.fillRect(0, v, 256, 3); x.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 400; i++) x.fillRect(Math.random() * 256, Math.random() * 64, 2, 1); tireT.needsUpdate = true; }
  // grime / roughness variation (static)
  { const x = grimeC.getContext('2d'), r = rng(7); x.fillStyle = 'rgb(220,220,220)'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) { const g = 170 + r() * 85 | 0; x.fillStyle = `rgba(${g},${g},${g},.25)`; x.fillRect(r() * 512, r() * 512, 2 + r() * 30, 1 + r() * 3); }
    for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(r() * 512, r() * 512, 2, 40 + r() * 120); }
    grimeT.wrapS = grimeT.wrapT = THREE.RepeatWrapping; grimeT.needsUpdate = true; }

  let canopyY = 0, body = null, geos = [], surf = [], gear = [], wheels = [], flames = [], strobe = null, beacon = null, styleKey = 'fighter', G = 1.75, S = null, tipsLocal = [];
  function build(key) {
    S = JET_STYLES[key] || JET_STYLES.fighter; styleKey = JET_STYLES[key] ? key : 'fighter'; G = S.G;
    if (body) { group.remove(body); geos.forEach(g => g.dispose()); }
    flames.forEach(f => fx.remove(f)); flames = []; geos = []; surf = []; gear = []; wheels.length = 0;
    body = new THREE.Group(); body.name = 'Body_' + styleKey; group.add(body);
    [M.fus, M.wing].forEach(m => { m.flatShading = !!S.faceted; m.needsUpdate = true; });
    const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { geos.push(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
    const W = S.wing, z0 = S.prof[0][1], z1 = S.prof[S.prof.length - 1][1];
    const fuse = add(body, loftFuselage(THREE, S), M.fus); fuse.name = 'Fuselage';
    const rAt = z => { const p = S.prof; for (let i = 1; i < p.length; i++) if (z <= p[i][1]) return lerp(p[i - 1][0], p[i][0], (z - p[i - 1][1]) / (p[i][1] - p[i - 1][1])); return 0; };
    const halfW = z => rAt(z) * S.fus[0], topY = z => rAt(z) * S.fus[1] * S.fus[2], botY = z => -rAt(z) * S.fus[1];
    // pitot + radome tip
    if (!S.faceted) { const pt = add(body, new THREE.CylinderGeometry(.012, .02, .75, 8), M.metal, 0, 0, z1 + .3); pt.rotation.x = Math.PI / 2; }
    const wingUV = (side) => (s, c, up) => { const x = side * s; return [(up ? -x : x) / 14 + .5, (c + 7) / 14]; };
    // ---- wings ----
    for (const side of [1, -1]) {
      let w;
      if (W.flat) { // faceted stealth planform: extruded, flat shaded
        const sh = new THREE.Shape(), Pp = side < 0 ? W.pts.map(p => [-p[0], p[1]]).reverse() : W.pts;
        Pp.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
        const g = new THREE.ExtrudeGeometry(sh, { depth: .04, bevelEnabled: true, bevelThickness: W.t * .55, bevelSize: .38, bevelSegments: 1 });
        g.rotateX(Math.PI / 2); g.translate(0, .02, 0);
        const pa = g.attributes.position, ua = g.attributes.uv; for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i) / 14 + .5, (pa.getZ(i) + 7) / 14);
        w = add(body, g, M.wing, 0, W.y, 0);
      } else {
        const [r0, r1] = trapezoid(W.pts);
        w = add(body, airfoil(THREE, r0, r1, W.tc, (s, t, c) => [side * s, W.y + t + W.dih * (s - r0.s), c], wingUV(side), { ns: 7, nc: 14 }), M.wing);
      }
      w.name = 'Wing';
      const tipX = Math.max(...W.pts.map(p => p[0])), tipZ = W.pts.filter(p => p[0] === tipX).map(p => p[1]);
      const tipY = W.y + (W.dih || 0) * (tipX - W.pts[0][0]);
      tipsLocal[side > 0 ? 0 : 1] = new THREE.Vector3(side * (tipX + (S.missiles ? .25 : .05)), tipY, (tipZ[0] + tipZ[1]) / 2);
      for (const c of S.surf) {
        const h = new THREE.Group(); h.position.set(side * c.x, W.y + (W.dih || 0) * (c.x - W.pts[0][0]), c.z); h.rotation.y = side * (c.sweep || 0); body.add(h);
        const d = new THREE.Group(); h.add(d);
        const g = W.flat ? new THREE.BoxGeometry(c.w, .14, c.d).translate(0, 0, -c.d / 2)
          : airfoil(THREE, { s: -c.w / 2, le: 0, te: -c.d }, { s: c.w / 2, le: 0, te: -c.d }, .09, (s, t, cc) => [s, t, cc], (s, cc) => [.5 + side * (c.x + s) / 14, (c.z + cc + 7) / 14], { ns: 1, nc: 6, roundTip: false });
        add(d, g, c.t === 'flap' ? M.wing : M.accent);
        surf.push({ o: d, t: c.t, side });
      }
      if (S.missiles) { // wingtip launch rail + missile
        const mx = side * (tipX + .12), my = tipY - .02, mz = (tipZ[0] + tipZ[1]) / 2 + .2;
        add(body, new THREE.BoxGeometry(.08, .1, 2.4), M.gunmetal, mx, my, mz);
        const mb = add(body, new THREE.CylinderGeometry(.064, .064, 2.6, 16), M.missile, mx, my - .12, mz + .1); mb.rotation.x = Math.PI / 2;
        const mn = add(body, new THREE.ConeGeometry(.064, .32, 16), M.missile, mx, my - .12, mz + 1.56); mn.rotation.x = Math.PI / 2;
        add(body, new THREE.CylinderGeometry(.066, .066, .06, 16), M.accent, mx, my - .12, mz + .9).rotation.x = Math.PI / 2;
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; for (const [fz, fs] of [[-1.05, .17], [1.15, .1]]) { const f = add(body, new THREE.BoxGeometry(.008, fs, fs * 1.4), M.missile, mx + Math.cos(a) * (.064 + fs / 2), my - .12 + Math.sin(a) * (.064 + fs / 2), mz + fz); f.rotation.z = a - Math.PI / 2; } }
      }
      if (S.winglets) { const wl = add(body, airfoil(THREE, { s: 0, le: -1.25, te: -1.85 }, { s: 1.05, le: -1.75, te: -2.05 }, .08, (s, t, c) => [side * (5.72 + s * .2) + t, W.y + .32 + s, c], (s, c) => [.5, .5], { ns: 3, nc: 8 }), M.accent); }
      if (S.stab) { const piv = new THREE.Group(); piv.position.set(side * S.stab.x, S.stab.y, S.stab.z); body.add(piv); const [a, b] = trapezoid(S.stab.pts);
        add(piv, airfoil(THREE, a, b, .055, (s, t, c) => [side * s, t, c], (s, c, up) => [(up ? -side * s : side * s) / 14 + .5, (c + S.stab.z + 7) / 14], { ns: 4, nc: 10 }), M.wing); surf.push({ o: piv, t: 'stab', side }); }
      if (S.canards) { const cz = (S.canards.pts[0][1] + S.canards.pts[3][1]) / 2, piv = new THREE.Group(); piv.position.set(0, S.canards.y, cz); body.add(piv);
        const [a, b] = trapezoid(S.canards.pts.map(p => [p[0], p[1] - cz]));
        add(piv, airfoil(THREE, a, b, .05, (s, t, c) => [side * s, t, c], () => [.5, .5], { ns: 3, nc: 10 }), M.accent); surf.push({ o: piv, t: 'canard', side }); }
      if (S.lerx) { const [a, b] = trapezoid(S.lerx); add(body, airfoil(THREE, a, b, .03, (s, t, c) => [side * s, -.06 + t, c], wingUV(side), { ns: 3, nc: 10, roundTip: false }), M.wing); }
    }
    // ---- vertical tails (airfoil, text reads correctly on both faces) ----
    const fins = S.fins ? [[1, S.fins], [-1, S.fins]] : S.fin1 ? [[0, S.fin1]] : [];
    for (const [side, F] of fins) {
      const fg = new THREE.Group(); fg.position.set(side * (F.x || 0), F.y, 0); fg.rotation.z = -side * (F.cant || 0); body.add(fg);
      const root = F.pts.filter(p => p[1] === 0).map(p => p[0]), tipP = F.pts.filter(p => p[1] > 0), Hh = tipP[0][1];
      const zmax = Math.max(...F.pts.map(p => p[0])), zmin = Math.min(...F.pts.map(p => p[0])), L = zmax - zmin;
      const fin = add(fg, airfoil(THREE, { s: -.25, le: Math.max(...root) + .3, te: Math.min(...root) }, { s: Hh, le: Math.max(...tipP.map(p => p[0])), te: Math.min(...tipP.map(p => p[0])) }, .06,
        (s, t, c) => [t, s, c], (s, c, up) => [up ? (zmax - c) / L : (c - zmin) / L, Math.max(0, s) / Hh], { ns: 6, nc: 12 }), M.fin); fin.name = 'Fin';
      const ry0 = F.ry - F.rh / 2, teAt = y => lerp(Math.min(...root), Math.min(...tipP.map(p => p[0])), y / Hh);
      const rd = new THREE.Group(); rd.position.set(0, 0, teAt(F.ry)); fg.add(rd);
      add(rd, airfoil(THREE, { s: ry0, le: teAt(ry0) - teAt(F.ry) + .02, te: teAt(ry0) - teAt(F.ry) - .42 }, { s: ry0 + F.rh, le: teAt(ry0 + F.rh) - teAt(F.ry) + .02, te: teAt(ry0 + F.rh) - teAt(F.ry) - .42 }, .1, (s, t, c) => [t, s, c], () => [.5, .5], { ns: 2, nc: 6, roundTip: false }), M.accent);
      surf.push({ o: rd, t: 'rudder', side });
      add(fg, new THREE.CylinderGeometry(.05, .05, .5, 10), M.gunmetal, 0, Hh - .05, Math.min(...tipP.map(p => p[0])) - .1).rotation.x = Math.PI / 2; // fin-tip antenna fairing
    }
    // ---- intakes: rounded ducts, lips, deep dark interior + compressor face ----
    const I = S.intake;
    const duct = (x, y, z, r, len, sx, sy) => {
      const prof = [[r * .9, -len / 2], [r, -len / 2 + .5], [r, len / 2 - .15], [r * .97, len / 2]].map(p => new THREE.Vector2(p[0], p[1]));
      const c = add(body, new THREE.LatheGeometry(prof, 28), M.fus === M.fus ? M.body : M.body, x, y, z); c.rotation.x = Math.PI / 2; c.scale.set(sx, 1, sy);
      const mz = z + len / 2;
      const lip = add(body, new THREE.TorusGeometry(r * .97, .05, 10, 32), M.gunmetal, x, y, mz); lip.scale.set(sx, sy, 1);
      const inner = add(body, new THREE.CylinderGeometry(r * .93, r * .8, 1.4, 28, 1, true), M.dark, x, y, mz - .7); inner.rotation.x = Math.PI / 2; inner.scale.set(sx, 1, sy);
      const face = add(body, new THREE.CircleGeometry(r * .8, 28), M.gunmetal, x, y, mz - 1.38); face.scale.set(sx, sy, 1);
      add(body, new THREE.SphereGeometry(r * .25, 16, 10), M.gunmetal, x, y, mz - 1.3).scale.z = .6;
      return c;
    };
    if (I.type === 'side') for (const side of [1, -1]) {
      duct(side * I.x, I.y, I.z, I.r, I.len, .82, 1.05);
      // splitter plate
      add(body, new THREE.BoxGeometry(.03, I.r * 2.1, .6), M.gunmetal, side * (I.x - I.r * .82 - .08), I.y, I.z + I.len / 2 - .25);
    } else if (I.type === 'chin') duct(0, I.y, I.z, I.r, I.len, 1.4, .75);
    else if (I.type === 'pods') for (const side of [1, -1]) {
      const prof = [[.02, -1.4], [.3, -1.3], [.4, -.9], [.42, .2], [.4, .9], [.34, 1.3]].map(p => new THREE.Vector2(p[0], p[1]));
      const n = add(body, new THREE.LatheGeometry(prof, 32), M.body, side * I.x, I.y, I.z); n.rotation.x = Math.PI / 2;
      const lip = add(body, new THREE.TorusGeometry(.34, .04, 10, 32), M.chrome, side * I.x, I.y, I.z + 1.3);
      add(body, new THREE.CircleGeometry(.32, 28), M.gunmetal, side * I.x, I.y, I.z + .9);
      const inner = add(body, new THREE.CylinderGeometry(.33, .32, .4, 28, 1, true), M.dark, side * I.x, I.y, I.z + 1.1); inner.rotation.x = Math.PI / 2;
      add(body, airfoil(THREE, { s: .45, le: I.z + .5, te: I.z - .6 }, { s: I.x - .3, le: I.z + .4, te: I.z - .6 }, .12, (s, t, c) => [side * s, I.y + t, c], () => [.5, .5], { ns: 2, nc: 8, roundTip: false }), M.body);
    } else if (I.type === 'dorsal') {
      const hump = add(body, new THREE.CylinderGeometry(I.r * 1.6, I.r * 2.2, I.len, 6), M.body, 0, I.y - .1, I.z); hump.rotation.x = Math.PI / 2; hump.scale.set(1.3, .55, 1);
      add(body, new THREE.PlaneGeometry(I.r * 3.2, I.r * .7), M.dark, 0, I.y + .02, I.z + I.len / 2 + .01);
    }
    // ---- canopy: gold-tinted bubble, frame, ejection seat + pilot ----
    canopyY = S.faceted ? S.canopy.y : Math.max(S.canopy.y, topY(S.canopy.z) - .14);
    const C0 = S.canopy, C = Object.assign({}, C0, { y: S.faceted ? C0.y : Math.max(C0.y, topY(C0.z) - .14) });
    const can = add(body, new THREE.SphereGeometry(1, S.faceted ? 6 : 48, S.faceted ? 4 : 20, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, 0, C.y, C.z); can.scale.set(...C.s); can.renderOrder = 3; can.name = 'Canopy'; can.castShadow = false;
    if (!S.faceted) {
      const bow = add(body, new THREE.TorusGeometry(1, .03, 8, 40, Math.PI), M.gunmetal, 0, C.y, C.z + C.s[2] * .35); bow.scale.set(C.s[0] * .94, C.s[1] * .94, 1);
      for (const sd of [1, -1]) { const sill = add(body, new THREE.CylinderGeometry(.03, .03, C.s[2] * 1.9, 8), M.gunmetal, sd * C.s[0] * .98, C.y + .01, C.z); sill.rotation.x = Math.PI / 2; }
      const sz = C.z - C.s[2] * .2, sy = C.y + C.s[1] - 1.18;
      add(body, new THREE.BoxGeometry(.5, .14, .5), M.gunmetal, 0, sy, sz);                        // seat pan
      add(body, new THREE.BoxGeometry(.5, .9, .14), M.gunmetal, 0, sy + .45, sz - .3).rotation.x = -.25; // seat back
      add(body, new THREE.BoxGeometry(.3, .25, .12), M.accent, 0, sy + .95, sz - .38).rotation.x = -.25; // headbox
      add(body, new THREE.CylinderGeometry(.17, .2, .55, 14), M.suit, 0, sy + .38, sz - .12).rotation.x = -.25; // torso
      add(body, new THREE.BoxGeometry(.36, .12, .18), M.suit, 0, sy + .62, sz - .16);              // shoulders
      const hm = add(body, new THREE.SphereGeometry(.14, 20, 14), M.helmet, 0, sy + .82, sz - .1);
      const vs = add(body, new THREE.SphereGeometry(.142, 20, 10, -Math.PI * .45, Math.PI * .9, Math.PI * .3, Math.PI * .32), M.visor, 0, sy + .82, sz - .1);
    }
    if (S.windows) for (const sd of [1, -1]) for (let i = 0; i < 5; i++) { const zz = 2.4 - i * .75; const wn = add(body, new THREE.CircleGeometry(.15, 20), M.window, sd * (halfW(zz) + .005), .3, zz); wn.rotation.y = sd * Math.PI / 2; wn.scale.y = 1.25; }
    // ---- details: refuel probe, antennas, panel bumps ----
    if (S.probe) { const pz = C.z + C.s[2] * .7; const pr = add(body, new THREE.CylinderGeometry(.03, .04, 1.4, 10), M.gunmetal, -(halfW(pz) * .8), topY(pz) * .6, pz + .4); pr.rotation.x = Math.PI / 2 - .05; add(body, new THREE.SphereGeometry(.05, 10, 8), M.metal, -(halfW(pz) * .8), topY(pz) * .6 + .03, pz + 1.1); }
    const blade = (x, y, z, flip) => { const b = add(body, airfoil(THREE, { s: 0, le: .1, te: -.12 }, { s: .28, le: -.05, te: -.14 }, .1, (s, t, c) => [t, y + flip * s, z + c], () => [.5, .5], { ns: 2, nc: 6 }), M.gunmetal); return b; };
    if (!S.faceted) { blade(0, topY(-1) - .02, -1, 1); blade(0, botY(1) + .02, 1, -1); blade(0, botY(-3) + .02, -3, -1); }
    // ---- nozzles: converging shroud, turkey-feather petals, deep interior, glowing flame holder ----
    for (const N of S.noz) {
      const sx = N.flat ? 1.6 : 1, sy = N.flat ? .45 : 1;
      const prof = [[N.r * 1.04, .5], [N.r * 1.06, .05], [N.r * .98, -.15]].map(p => new THREE.Vector2(p[0], p[1]));
      const sh = add(body, new THREE.LatheGeometry(prof, 32), M.burnt, N.x, N.y, N.z + .1); sh.rotation.x = -Math.PI / 2; sh.scale.set(sx, 1, sy);
      if (!N.flat) for (let k = 0; k < 18; k++) {
        const a = k / 18 * Math.PI * 2, p = new THREE.Group(); p.position.set(N.x + Math.cos(a) * N.r * .97, N.y + Math.sin(a) * N.r * .97, N.z - .05); p.rotation.z = a - Math.PI / 2; body.add(p);
        const pet = add(p, new THREE.BoxGeometry(N.r * .36, .025, .62), M.burnt, 0, 0, -.31); pet.rotation.x = -.13; // petals converge slightly
      }
      const inner = add(body, new THREE.CylinderGeometry(N.r * .9, N.r * .9, 1.6, 28, 1, true), M.dark, N.x, N.y, N.z + .35); inner.rotation.x = Math.PI / 2; inner.scale.set(sx, 1, sy);
      const ring = add(body, new THREE.TorusGeometry(N.r * .45, .04, 8, 28), M.core, N.x, N.y, N.z + .9); ring.scale.set(sx, sy, 1);
      const core = add(body, new THREE.CircleGeometry(N.r * .85, 28), M.core, N.x, N.y, N.z + 1.1); core.rotation.y = Math.PI; core.scale.set(sx, sy, 1); core.castShadow = false;
      const fl = new THREE.Group(); fl.position.set(N.x, N.y, N.z - .55); fx.add(fl); flames.push(fl);
      const k = N.r / .55;
      const fo = new THREE.Mesh(new THREE.ConeGeometry(.5 * k, 5.2 * k, 32, 24, true), flameO); fo.position.z = -2.6 * k; fo.rotation.x = -Math.PI / 2; fo.scale.set(sx, 1, sy); fl.add(fo); geos.push(fo.geometry);
      const fi = new THREE.Mesh(new THREE.ConeGeometry(.32 * k, 2.6 * k, 24, 16, true), flameI); fi.position.z = -1.3 * k; fi.rotation.x = -Math.PI / 2; fi.scale.set(sx, 1, sy); fl.add(fi); geos.push(fi.geometry);
    }
    glow.position.set(0, 0, S.noz[0].z - 1.4);
    // ---- landing gear: strut, chrome oleo, torque links, fork, treaded tyre, doors. wheel bottoms at y = -G ----
    const Gr = S.gear, my = Gr.my ?? -.62;
    function makeGear(x, z, r, wide, foldDir, nose) {
      const piv = new THREE.Group(); piv.position.set(x, my, z); body.add(piv);
      const len = G + my - r, oleo = len * .38;
      add(piv, new THREE.CylinderGeometry(.075, .085, len - oleo + .05, 14), M.gearPaint, 0, -(len - oleo) / 2, 0);
      add(piv, new THREE.CylinderGeometry(.05, .05, oleo, 14), M.chrome, 0, -len + oleo / 2 + .02, 0);
      add(piv, new THREE.CylinderGeometry(.095, .095, .12, 14), M.gunmetal, 0, -(len - oleo), 0);
      // torque links (V)
      const tl1 = add(piv, new THREE.BoxGeometry(.025, oleo * .62, .05), M.gunmetal, 0, -(len - oleo) - oleo * .25, .1); tl1.rotation.x = .55;
      const tl2 = add(piv, new THREE.BoxGeometry(.025, oleo * .62, .05), M.gunmetal, 0, -len + oleo * .25, .1); tl2.rotation.x = -.55;
      // drag brace
      const br = add(piv, new THREE.CylinderGeometry(.025, .025, len * .75, 8), M.gearPaint, 0, -len * .35, -.32 * foldDir); br.rotation.x = .45 * foldDir;
      // fork + axle
      const nW = nose ? 2 : 1;
      for (let wI = 0; wI < nW; wI++) {
        const off = nose ? (wI - .5) * (wide + .06) : 0;
        const tp = [[r * .55, -wide / 2], [r * .9, -wide / 2], [r * .99, -wide * .35], [r, 0], [r * .99, wide * .35], [r * .9, wide / 2], [r * .55, wide / 2]].map(p => new THREE.Vector2(p[0], p[1]));
        const tg = new THREE.LatheGeometry(tp, 40); tg.rotateZ(Math.PI / 2);
        const wh = add(piv, tg, M.tire, off, -len, 0); wh.name = 'Wheel';
        const hub = new THREE.CylinderGeometry(r * .56, r * .56, wide * .9, 24); hub.rotateZ(Math.PI / 2); add(wh, hub, M.gearPaint);
        const cap = new THREE.CylinderGeometry(r * .2, r * .2, wide * .95, 16); cap.rotateZ(Math.PI / 2); add(wh, cap, M.metal);
        wheels.push(wh);
      }
      add(piv, new THREE.BoxGeometry(nose ? wide * 2 + .2 : .05, .05, .05), M.gunmetal, nose ? 0 : (x > 0 ? -1 : 1) * (wide / 2 + .02), -len, 0);
      const door = add(body, new THREE.BoxGeometry(.025, .36, nose ? .8 : 1.0), M.body, x + (x === 0 ? .24 : Math.sign(x) * .32), my - .28, z);
      gear.push({ piv, foldDir, door, x });
    }
    makeGear(0, Gr.nz, Gr.nr, .18, -1, true); makeGear(Gr.mx, Gr.mz, Gr.mr, .3, 1); makeGear(-Gr.mx, Gr.mz, Gr.mr, .3, 1);
    // ---- lights ----
    add(body, new THREE.SphereGeometry(.07, 12, 8), M.red, S.tip[0], S.tip[1], S.tip[2]).castShadow = false;
    add(body, new THREE.SphereGeometry(.07, 12, 8), M.green, -S.tip[0], S.tip[1], S.tip[2]).castShadow = false;
    strobe = add(body, new THREE.SphereGeometry(.07, 12, 8), M.white, ...S.strobe); strobe.castShadow = false;
    beacon = add(body, new THREE.SphereGeometry(.08, 12, 8), M.beacon, 0, my - .1, -.3); beacon.castShadow = false;
    strobeL.position.set(S.strobe[0], S.strobe[1] + .3, S.strobe[2]);
    drawPaint();
    if (fm) fm.setConfig({ gearHeight: G });
    return S;
  }

  /* ---------------- paint / textures ---------------- */
  let paintIdx = 0;
  function panelLines(x, W, H, kind, color, lw, seed, sc) {
    const r = rng(seed); x.strokeStyle = color; x.lineWidth = lw; x.fillStyle = color;
    if (kind === 'fus') {
      const frames = 18; for (let i = 1; i < frames; i++) { const v = H * i / frames + (r() - .5) * 20 * sc; x.beginPath(); x.moveTo(0, v); x.lineTo(W, v); x.stroke(); for (let u = 4; u < W; u += 9 * sc) x.fillRect(u, v + 4 * sc, 1.6 * sc, 1.6 * sc); }
      for (const u of [.1, .19, .31, .4, .6, .69, .81, .9]) { let v = 0; while (v < H) { const l = H * (.08 + r() * .15); if (r() > .25) { x.beginPath(); x.moveTo(u * W, v); x.lineTo(u * W, v + l); x.stroke(); } v += l; } }
      for (let i = 0; i < 46; i++) { const u = r() * W, v = r() * H, w = (14 + r() * 40) * sc, h = (14 + r() * 50) * sc; x.strokeRect(u, v, w, h); x.fillRect(u + 2 * sc, v + 2 * sc, 2 * sc, 2 * sc); x.fillRect(u + w - 4 * sc, v + 2 * sc, 2 * sc, 2 * sc); }
    } else {
      for (let i = 1; i < 14; i++) { const p = W * i / 14; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, H); x.stroke(); }
      for (let i = 1; i < 10; i++) { const p = H * i / 10 + (r() - .5) * 10 * sc; x.beginPath(); x.moveTo(0, p); x.lineTo(W, p); x.stroke(); for (let u = 4; u < W; u += 10 * sc) x.fillRect(u, p + 3 * sc, 1.5 * sc, 1.5 * sc); }
      for (let i = 0; i < 24; i++) x.strokeRect(r() * W, r() * H, (20 + r() * 40) * sc, (14 + r() * 30) * sc);
    }
  }
  function text(x, s, px, py, size, rot, fill, stroke, font) {
    x.save(); x.translate(px, py); x.rotate(rot || 0); x.font = font || `italic 900 ${size}px Arial Black, Arial`; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (stroke) { x.lineWidth = size * .09; x.strokeStyle = stroke; x.strokeText(s, 0, 0); } x.fillStyle = fill; x.fillText(s, 0, 0); x.restore();
  }
  function drawPaint() {
    const p = JET_PAINTS[paintIdx], z0 = S.prof[0][1], z1 = S.prof[S.prof.length - 1][1], Lz = z1 - z0;
    const V = z => (1 - (z - z0) / Lz);   // canvas y fraction for fuselage z
    // ---- fuselage skin (u around, v along) ----
    let x = skinC.getContext('2d'); const W = 1024, H = 2048;
    x.fillStyle = p.body; x.fillRect(0, 0, W, H);
    let g = x.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, p.accent); g.addColorStop(.15, p.accent); g.addColorStop(.17, p.body); g.addColorStop(.83, p.body); g.addColorStop(.85, p.accent); g.addColorStop(1, p.accent);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // swept side flash stripes
    for (const sd of [1, -1]) { const u0 = sd > 0 ? .34 : .66; x.fillStyle = p.trim; x.beginPath();
      x.moveTo(u0 * W, H * V(z1 - .8)); x.lineTo((u0 + sd * .035) * W, H * V(z1 - .8)); x.lineTo((u0 + sd * -.06) * W, H); x.lineTo((u0 - sd * .095) * W, H); x.fill();
      x.fillStyle = p.accent; x.fillRect((u0 + (sd > 0 ? .04 : -.05)) * W, H * V(z1 - 1.2), .01 * W, H * .7); }
    // radome + anti-glare
    x.fillStyle = 'rgba(40,44,50,.9)'; x.fillRect(0, 0, W, H * V(z1 - .9));
    x.fillStyle = 'rgba(25,28,32,.85)'; x.fillRect(.45 * W, H * V(z1 - 1.0), .1 * W, H * (V(S.canopy.z + S.canopy.s[2] * .8) - V(z1 - 1.0)));
    // tail soot
    g = x.createLinearGradient(0, H, 0, H * .82); g.addColorStop(0, 'rgba(20,16,12,.65)'); g.addColorStop(1, 'rgba(20,16,12,0)'); x.fillStyle = g; x.fillRect(0, H * .82, W, H * .18);
    panelLines(x, W, H, 'fus', 'rgba(0,0,0,.28)', 2, 11, 2);
    // livery: APEX ARCADE along both sides (reads nose->tail correctly on each side), tail-side number
    const lv = H * V((z0 + z1) / 2 - (S.windows ? 1.4 : .6)), fs = Math.min(64, H * 3.4 / Lz * .22);
    text(x, 'APEX ARCADE', .29 * W, lv, fs, Math.PI / 2, p.accent, p.trim);
    text(x, 'APEX ARCADE', .71 * W, lv, fs, -Math.PI / 2, p.accent, p.trim);
    // stencils
    const sv = H * V(S.canopy.z - .2);
    for (const [u, rot] of [[.4, Math.PI / 2], [.6, -Math.PI / 2]]) {
      text(x, '▲ RESCUE', u * W, sv, 22, rot, '#ffd400', null, 'bold 22px Arial');
      text(x, 'NO STEP', u * W, H * V(S.canopy.z - 2.4), 16, rot, 'rgba(0,0,0,.6)', null, 'bold 16px Arial');
      text(x, 'DANGER  INTAKE', (u < .5 ? .22 : .78) * W, H * V(S.intake.z + S.intake.len / 2 - .3), 16, rot, '#e32', null, 'bold 16px Arial');
    }
    skinT.needsUpdate = true;
    // fuselage height -> normal (panel grooves + rivets)
    let h = skinH.getContext('2d'); h.fillStyle = '#fff'; h.fillRect(0, 0, 512, 1024); panelLines(h, 512, 1024, 'fus', '#000', 1.2, 11, 1);
    if (!skinN) { skinN = tex(heightToNormal(THREE, skinH, 2.2), false); M.fus.normalMap = skinN; M.fus.normalScale = new THREE.Vector2(.45, .45); M.fus.needsUpdate = true; }
    // ---- wings (planform UV; top surfaces mirrored so text reads from above) ----
    x = wingC.getContext('2d'); const WW = 1024;
    x.fillStyle = p.body; x.fillRect(0, 0, WW, WW);
    const tipX = Math.max(...S.wing.pts.map(q => q[0])), X = xx => (xx / 14 + .5) * WW, Z = zz => (1 - (zz + 7) / 14) * WW;
    for (const sd of [1, -1]) { const a = X(sd * (tipX - .9)), b = X(sd * 7); x.fillStyle = p.accent; x.fillRect(Math.min(a, b), 0, Math.abs(b - a), WW); x.fillStyle = p.trim; x.fillRect(X(sd * (tipX - .95)) - 5, 0, 10, WW); }
    panelLines(x, WW, WW, 'wing', 'rgba(0,0,0,.25)', 2, 23, 2);
    const wz = (Math.max(...S.wing.pts.map(q => q[1])) + Math.min(...S.wing.pts.map(q => q[1]))) / 2 - .4;
    for (const sd of [1, -1]) {
      text(x, 'APEX ARCADE', X(sd * tipX * .55), Z(wz), WW * .04, 0, p.accent, p.trim);
      text(x, 'NO STEP', X(sd * 1.6), Z(Math.min(...S.wing.pts.map(q => q[1])) + .6), 14, 0, 'rgba(0,0,0,.55)', null, 'bold 14px Arial');
      x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 2; x.strokeRect(X(sd * 1.6) - 60, Z(Math.min(...S.wing.pts.map(q => q[1])) + .6) - 14, 120, 28);
    }
    wingT.needsUpdate = true;
    h = wingH.getContext('2d'); h.fillStyle = '#fff'; h.fillRect(0, 0, 512, 512); panelLines(h, 512, 512, 'wing', '#000', 1.2, 23, 1);
    if (!wingN) { wingN = tex(heightToNormal(THREE, wingH, 2), false); M.wing.normalMap = wingN; M.wing.normalScale = new THREE.Vector2(.4, .4); M.wing.needsUpdate = true; }
    // ---- fins (u = chord, front->back as seen from each side; v = height) ----
    x = finC.getContext('2d'); x.fillStyle = p.body; x.fillRect(0, 0, 512, 512);
    x.fillStyle = p.accent; x.beginPath(); x.moveTo(0, 0); x.lineTo(512, 0); x.lineTo(512, 150); x.lineTo(0, 90); x.fill();
    x.fillStyle = p.trim; x.beginPath(); x.moveTo(0, 90); x.lineTo(512, 150); x.lineTo(512, 172); x.lineTo(0, 112); x.fill();
    panelLines(x, 512, 512, 'wing', 'rgba(0,0,0,.22)', 1.5, 31, 1);
    text(x, 'AA', 300, 250, 120, 0, p.accent, p.trim);
    text(x, '07', 330, 350, 54, 0, p.trim, null, 'bold 54px Arial');
    text(x, 'APEX ARCADE', 330, 410, 30, 0, p.accent, p.trim);
    finT.needsUpdate = true;
    // ---- material response per paint ----
    M.accent.color.set(p.accent); M.trim.color.set(p.trim); M.body.color.set(p.body);
    for (const m of paintMats.concat([M.accent])) { m.metalness = p.metal; m.roughness = p.rough; m.clearcoat = p.gloss; m.clearcoatRoughness = .06; m.envMapIntensity = p.metal > .9 ? 1.6 : 1.1; }
    M.fin.normalMap = wingN; M.fin.normalScale = new THREE.Vector2(.3, .3); M.fin.needsUpdate = true;
  }
  function setPaint(i) {
    if (typeof i === 'string') i = Math.max(0, JET_PAINTS.findIndex(q => q.name === i));
    paintIdx = ((i % JET_PAINTS.length) + JET_PAINTS.length) % JET_PAINTS.length; if (S) drawPaint(); return JET_PAINTS[paintIdx].name;
  }
  let fm = null;
  paintIdx = ((opts.paint || 0) % JET_PAINTS.length + JET_PAINTS.length) % JET_PAINTS.length;
  build(opts.style || 'fighter');
  let preset = opts.preset || 'normal';
  fm = createFlightModel(THREE, jetConfigFor(preset, styleKey, opts.config || {}));
  let gearT = 1, gearDown = true, t = 0, abVis = 0, vap = 0;
  function setGear(down, instant) { gearDown = !!down; fm.state.gearDown = gearDown; if (instant) gearT = gearDown ? 1 : 0; return gearDown; }
  function setPreset(p) { preset = p; fm.setConfig(jetConfigFor(p, styleKey, opts.config || {})); return p; }
  function setStyle(k) {
    if (typeof k === 'number') k = JET_STYLE_KEYS[((k % JET_STYLE_KEYS.length) + JET_STYLE_KEYS.length) % JET_STYLE_KEYS.length];
    const wasG = G, st = build(k); setPreset(preset);
    if (fm.state.onGround) fm.state.pos.y += G - wasG;
    gearT = gearDown ? 1 : 0; update(0, {}); return st.name;
  }
  // ---- wingtip vapour trails ----
  const TN = 70, trails = [];
  for (let i = 0; i < 2; i++) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(TN * 2 * 3), al = new Float32Array(TN * 2), idx = [];
    for (let k = 0; k < TN - 1; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(al, 1)); g.setIndex(idx);
    const m = new THREE.Mesh(g, keep(new THREE.ShaderMaterial({ vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide })));
    m.frustumCulled = false; worldFx.add(m); trails.push({ m, pos, al, pts: [], init: false });
  }
  const tv = new THREE.Vector3(), up = new THREE.Vector3();
  function updateTrails(dt, s) {
    vap += (((s && !s.onGround && s.speed > 70 && Math.abs(s.g) > 3.5) ? 1 : 0) - vap) * Math.min(1, dt * 5);
    up.set(0, 1, 0).applyQuaternion(group.quaternion);
    trails.forEach((tr, i) => {
      tv.copy(tipsLocal[i]).applyMatrix4(group.matrixWorld);
      tr.pts.unshift({ x: tv.x, y: tv.y, z: tv.z, a: vap, w: .05 }); if (tr.pts.length > TN) tr.pts.pop();
      for (let k = 0; k < TN; k++) { const q = tr.pts[Math.min(k, tr.pts.length - 1)], w = .06 + k * .012, f = 1 - k / TN;
        tr.pos.set([q.x + up.x * w, q.y + up.y * w, q.z + up.z * w, q.x - up.x * w, q.y - up.y * w, q.z - up.z * w], k * 6);
        tr.al[k * 2] = tr.al[k * 2 + 1] = q.a * f * .55 * (k < tr.pts.length ? 1 : 0); }
      tr.m.geometry.attributes.position.needsUpdate = true; tr.m.geometry.attributes.alpha.needsUpdate = true;
    });
  }
  const cur = { pitch: 0, roll: 0, yaw: 0, flap: 0 };
  function update(dt, input = {}) {
    t += dt;
    let s = null;
    if (!opts.external) {
      if (fm.state.onGround && !gearDown) gearDown = true;
      fm.state.gearDown = gearDown;
      s = fm.step(dt, input); group.position.copy(s.pos); group.quaternion.copy(s.q);
    }
    group.updateMatrixWorld();
    const thr = s ? s.thr : (input.throttle || 0), boost = s ? s.boost : !!input.boost;
    const k = Math.min(1, dt * 8);
    const pin = s && s.trick ? Math.sign(s.w.pitch) : (input.pitch || 0), rin = s && s.trick ? Math.sign(s.w.roll) : (input.roll || 0);
    cur.pitch += (pin - cur.pitch) * k; cur.roll += (rin - cur.roll) * k; cur.yaw += ((input.yaw || 0) - cur.yaw) * k;
    cur.flap += (((gearDown && (!s || s.speed < 110)) ? 1 : 0) - cur.flap) * Math.min(1, dt * 2);
    for (const c of surf) {
      const r = c.side;
      if (c.t === 'roll') c.o.rotation.x = r * cur.roll * .4;
      else if (c.t === 'flap') c.o.rotation.x = cur.flap * .45;
      else if (c.t === 'elevon') c.o.rotation.x = cur.pitch * .35 + r * cur.roll * .35;
      else if (c.t === 'stab') c.o.rotation.x = cur.pitch * .35 + r * cur.roll * .12;
      else if (c.t === 'canard') c.o.rotation.x = -cur.pitch * .35;
      else if (c.t === 'rudder') c.o.rotation.y = -cur.yaw * .45;
      else if (c.t === 'yawsplit') c.o.rotation.x = Math.max(0, r * cur.yaw) * .6;
    }
    gearT += ((gearDown ? 1 : 0) - gearT) * Math.min(1, dt * 2.2);
    for (const gr of gear) { gr.piv.rotation.x = gr.foldDir * (1 - gearT) * 1.55; gr.piv.visible = gearT > .04; gr.door.rotation.z = (gr.x >= 0 ? 1 : -1) * (1 - gearT) * 1.45; gr.door.visible = gearT > .3 || gr.x === 0; }
    abVis += ((boost ? 1 : 0) - abVis) * Math.min(1, dt * 6);
    flameU.uT.value = t; flameU.uAB.value = abVis; flameU.uThr.value = thr;
    for (const f of flames) { f.visible = abVis > .02 || thr > .25; f.scale.set(.85 + abVis * .25, .85 + abVis * .25, .25 + thr * .3 + abVis * .6); }
    M.core.color.setRGB(.6 + thr * .4, .22 + thr * .25 + abVis * .3, .05 + abVis * .35);
    glow.intensity = abVis * 8 * (.9 + Math.sin(t * 50) * .1);
    const ph = t % 1.2, on = ph < .05 || (ph > .15 && ph < .2);
    strobe.visible = on; strobeL.intensity = on ? 4 : 0; beacon.visible = (t % 1) < .5;
    fx.position.copy(group.position); fx.quaternion.copy(group.quaternion); fx.scale.copy(group.scale);
    if (dt > 0) updateTrails(dt, s);
    return s;
  }
  function dispose() { [group, fx, worldFx].forEach(o => o.parent && o.parent.remove(o)); geos.forEach(g => g.dispose()); trails.forEach(t => t.m.geometry.dispose()); shared.forEach(d => d.dispose && d.dispose()); }
  return { group, fx, worldFx, update, setPaint, setGear, setStyle, setPreset, dispose, get flight() { return fm; }, wheels, paints: JET_PAINTS, styles: JET_STYLES,
    get surfaces() { return surf; }, get gearDown() { return gearDown; }, get paint() { return paintIdx; }, get style() { return styleKey; }, get styleName() { return JET_STYLES[styleKey].name; }, get gearHeight() { return G; }, get canopyY() { return canopyY; }, get preset() { return preset; } };
}

/* ---------- on-screen controls (iPhone/Android) + keyboard ----------
   createJetControls(container) -> input {pitch, roll, yaw, throttle, boost, gear, brake, on(evt, fn), dispose()}
   events: 'gear','cam','paint','style','trick'(name).  Container should be the (possibly rotated) game root. */
export function createJetControls(container, opts = {}) {
  const input = { pitch: 0, roll: 0, yaw: 0, throttle: opts.throttle ?? 0, boost: false, gear: true, brake: false };
  const ev = {}; input.on = (n, f) => ((ev[n] = ev[n] || []).push(f), input);
  const emit = (n, a) => (ev[n] || []).forEach(f => f(a));
  const root = document.createElement('div'); root.className = 'ajc'; container.appendChild(root);
  const css = document.createElement('style'); css.textContent = `
.ajc{position:absolute;inset:0;pointer-events:none;z-index:20;font-family:-apple-system,system-ui,Roboto,sans-serif}
.ajc .zone{position:absolute;left:0;bottom:0;width:42%;height:62%;pointer-events:auto;touch-action:none}
.ajc .base{position:absolute;width:128px;height:128px;margin:-64px 0 0 -64px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:radial-gradient(circle,rgba(255,255,255,.08),rgba(0,0,0,.25));left:calc(env(safe-area-inset-left) + 92px);top:calc(100% - env(safe-area-inset-bottom) - 84px)}
.ajc .knob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px;border-radius:50%;background:rgba(255,190,40,.85);box-shadow:0 0 12px rgba(255,170,0,.6)}
.ajc .pad{position:absolute;right:calc(env(safe-area-inset-right) + 8px);bottom:calc(env(safe-area-inset-bottom) + 8px);display:grid;grid-template-columns:repeat(3,52px);gap:6px;pointer-events:auto}
.ajc button{min-width:44px;min-height:44px;height:52px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(10,16,28,.72);color:#fff;font-weight:800;font-size:11px;letter-spacing:.3px;touch-action:none;user-select:none;-webkit-user-select:none;padding:0}
.ajc button.on{background:#f2a51a;color:#111;border-color:#ffd27a}
.ajc button.st{background:rgba(0,120,140,.78)}.ajc button.ab{background:rgba(200,60,10,.8)}.ajc button.tr{background:rgba(40,30,90,.78)}`;
  root.appendChild(css);
  const zone = document.createElement('div'); zone.className = 'zone'; zone.id = 'jetStickZone'; root.appendChild(zone);
  const base = document.createElement('div'); base.className = 'base'; zone.appendChild(base);
  const knob = document.createElement('div'); knob.className = 'knob'; base.appendChild(knob);
  const rotated = () => opts.rotated ? opts.rotated() : false;
  let sid = null, sx = 0, sy = 0;
  const R = 52;
  function setKnob(dx, dy) { knob.style.transform = `translate(${dx}px,${dy}px)`; input.roll = dx / R; input.pitch = dy / R; } // pull back (down) = nose up
  function release(e) { if (e && e.pointerId !== undefined && e.pointerId !== sid) return; sid = null; setKnob(0, 0); }
  zone.addEventListener('pointerdown', e => {
    if (sid !== null) return; sid = e.pointerId; sx = e.clientX; sy = e.clientY;
    try { zone.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault();
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== sid) return;
    let dx = e.clientX - sx, dy = e.clientY - sy;
    if (rotated()) { const t = dx; dx = dy; dy = -t; }   // CSS rotate(90deg): screen -> game axes
    const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
    setKnob(dx, dy);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => zone.addEventListener(n, release));
  const held = new Map();
  const pad = document.createElement('div'); pad.className = 'pad'; root.appendChild(pad);
  const resetAll = () => { sid = null; setKnob(0, 0); input.yaw = 0; input.boost = false; input.brake = false; thrDir = 0; held.clear(); pad.querySelectorAll('.hold').forEach(b => b.classList.remove('on')); };
  window.addEventListener('blur', resetAll);
  const vis = () => { if (document.hidden) resetAll(); }; document.addEventListener('visibilitychange', vis);
  function btn(id, label, cls, down, up) {
    const b = document.createElement('button'); b.id = id; b.textContent = label; b.type = 'button'; if (cls) b.className = cls; pad.appendChild(b);
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} held.set(id, up); if (up) b.classList.add('on'); down && down(b); });
    const off = () => { if (held.has(id)) { const u = held.get(id); held.delete(id); if (u) { b.classList.remove('on'); u(b); } } };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => b.addEventListener(n, off));
    if (up) b.classList.add('hold');
    return b;
  }
  let thrDir = 0;
  btn('jThrUp', 'THR +', '', () => thrDir = 1, () => thrDir = 0);
  btn('jThrDn', 'THR −', '', () => thrDir = -1, () => thrDir = 0);
  btn('jBoost', 'BOOST', 'ab', () => input.boost = true, () => input.boost = false);
  btn('jYawL', '◀ YAW', '', () => input.yaw = -1, () => input.yaw = 0);
  btn('jYawR', 'YAW ▶', '', () => input.yaw = 1, () => input.yaw = 0);
  const gb = btn('jGear', 'GEAR ⬇', 'on', () => { input.gear = !input.gear; emit('gear', input.gear); });
  input.setGearLabel = (d) => { gb.textContent = d ? 'GEAR ⬇' : 'GEAR ⬆'; gb.classList.toggle('on', d); };
  btn('jCam', 'CAM', '', () => emit('cam'));
  btn('jStyle', 'STYLE', 'st', () => emit('style'));
  btn('jPaint', 'PAINT', 'st', () => emit('paint'));
  btn('jBrake', 'BRAKE', '', () => input.brake = true, () => input.brake = false);
  btn('jRoll', 'BARREL', 'tr', () => emit('trick', 'barrelRoll'));
  btn('jLoop', 'LOOP', 'tr', () => emit('trick', 'loop'));
  btn('jImm', 'IMMEL', 'tr', () => emit('trick', 'immelmann'));
  btn('jSplit', 'SPLIT-S', 'tr', () => emit('trick', 'splitS'));
  // keyboard: W/S ↑/↓ pitch, A/D ←/→ roll, Q/E yaw, Shift/R thr up, Ctrl/F down, Space boost, G gear, C cam, P paint, T style, B brake, 1-4 tricks
  const keys = new Set(); let kbUsed = false;
  const kd = e => {
    kbUsed = true;
    if (keys.has(e.code)) return; keys.add(e.code);
    const m = { KeyG: () => { input.gear = !input.gear; emit('gear', input.gear); }, KeyC: () => emit('cam'), KeyP: () => emit('paint'), KeyT: () => emit('style'), Digit1: () => emit('trick', 'barrelRoll'), Digit2: () => emit('trick', 'loop'), Digit3: () => emit('trick', 'immelmann'), Digit4: () => emit('trick', 'splitS') }[e.code];
    m && m(); if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  };
  const ku = e => keys.delete(e.code);
  const kclr = () => keys.clear();
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', kclr);
  input.tick = (dt) => {
    let kt = 0;
    if (keys.size) {
      const k = c => keys.has(c) ? 1 : 0;
      const p = k('KeyS') + k('ArrowDown') - k('KeyW') - k('ArrowUp'), r = k('KeyD') + k('ArrowRight') - k('KeyA') - k('ArrowLeft');
      if (sid === null) { input.pitch = Math.max(-1, Math.min(1, p)); input.roll = Math.max(-1, Math.min(1, r)); }
      if (!held.size) { input.yaw = k('KeyE') - k('KeyQ'); input.boost = !!k('Space'); input.brake = !!k('KeyB'); }
      kt = k('ShiftLeft') + k('KeyR') - k('ControlLeft') - k('KeyF');
    } else if (sid === null && kbUsed) { input.pitch = 0; input.roll = 0; kbUsed = false; }
    const d = thrDir || kt; if (d) input.throttle = Math.max(0, Math.min(1, input.throttle + d * 0.6 * dt));
  };
  input.dispose = () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', kclr); window.removeEventListener('blur', resetAll); document.removeEventListener('visibilitychange', vis); root.remove(); };
  input.root = root;
  return input;
}
