/* kit/pieces.js - loads the owner's Workshop pieces into any three.js game (owner Nov 6 2026, Workshop).
   A piece is pieces/<name>.json, made on workshop.html:
     { kind:'piece', items:[{kind:'tree'|'box'|...|'model', x,y,z, ry, s, color, model}] }   3D scenery
     { kind:'track', width, closed, kerbs, roads:[{pts:[{x,z}], from:{r,i}, color}] }        a road / circuit, roads[1..] = splits
   Use:   import { loadPiece, buildPiece } from './kit/pieces.js';
          const p = await loadPiece('my-track', { THREE, scene, GLTFLoader });   // adds it to the scene
          p.group        the THREE.Group that holds it
          p.curves       (tracks) one THREE.CatmullRomCurve3 per road - drive along curves[0]; curves[1..] are the split roads
          p.groundY      0 (flat) */
const MAT = {};
function mat(T, c, d) { const k = String(c != null ? c : d); if (!MAT[k]) MAT[k] = new T.MeshStandardMaterial({ color: c != null ? c : d, roughness: 0.6, metalness: 0.1 }); return MAT[k]; }
export const KINDS = {
  box: (T, c) => mesh(T, new T.BoxGeometry(4, 4, 4), c, 0xc9a27e, 2),
  ball: (T, c) => mesh(T, new T.SphereGeometry(2, 20, 14), c, 0xd9534f, 2),
  cyl: (T, c) => mesh(T, new T.CylinderGeometry(1, 1, 6, 16), c, 0xb8c0c8, 3),
  cone: (T, c) => mesh(T, new T.ConeGeometry(0.5, 1.2, 14), c, 0xff6a00, 0.6),
  wall: (T, c) => mesh(T, new T.BoxGeometry(12, 3, 0.6), c, 0xdfe3e8, 1.5),
  ramp: (T, c) => { const m = mesh(T, new T.BoxGeometry(8, 0.5, 12), c, 0x8a8f96, 1.4); m.children[0].rotation.x = -0.25; return m; },
  floor: (T, c) => mesh(T, new T.BoxGeometry(20, 0.2, 20), c, 0x3a3d42, 0.1),
  tree: (T, c) => { const g = new T.Group(); const t = new T.Mesh(new T.CylinderGeometry(0.35, 0.5, 3, 7), mat(T, null, 0x5a3d26)); t.position.y = 1.5; g.add(t);
    for (const [y, r] of [[4, 2.2], [5.4, 1.6], [6.5, 1]]) { const b = new T.Mesh(new T.SphereGeometry(r, 10, 8), mat(T, c, 0x2f7a35)); b.position.y = y; g.add(b); } return g; },
  pine: (T, c) => { const g = new T.Group(); const t = new T.Mesh(new T.CylinderGeometry(0.3, 0.4, 2, 7), mat(T, null, 0x4a3322)); t.position.y = 1; g.add(t);
    const k = new T.Mesh(new T.ConeGeometry(2, 6, 10), mat(T, c, 0x1f5a2a)); k.position.y = 5; g.add(k); return g; },
  rock: (T, c) => mesh(T, new T.DodecahedronGeometry(1.4, 0), c, 0x80868c, 0.8),
  pole: (T, c) => { const g = new T.Group(); const p = new T.Mesh(new T.CylinderGeometry(0.12, 0.15, 9, 8), mat(T, null, 0x9aa3ad)); p.position.y = 4.5; g.add(p);
    const h = new T.Mesh(new T.BoxGeometry(1.4, 0.3, 0.6), new T.MeshBasicMaterial({ color: c || 0xfff6d0 })); h.position.y = 9; g.add(h); return g; },
  stand: (T, c) => { const g = new T.Group(); for (let i = 0; i < 6; i++) { const s = new T.Mesh(new T.BoxGeometry(24, 0.8, 1.6), mat(T, c, 0x6b7a90)); s.position.set(0, 0.4 + i * 0.8, -i * 1.6); g.add(s); } return g; },
  arch: (T, c) => { const g = new T.Group(); const m = mat(T, c, 0xe94560); for (const x of [-7, 7]) { const p = new T.Mesh(new T.BoxGeometry(0.8, 7, 0.8), m); p.position.set(x, 3.5, 0); g.add(p); }
    const top = new T.Mesh(new T.BoxGeometry(15, 1.4, 0.8), m); top.position.y = 7.4; g.add(top); return g; },
};
function mesh(T, geo, c, d, y) { const g = new T.Group(); const m = new T.Mesh(geo, mat(T, c, d)); m.position.y = y; g.add(m); return g; }
const hex = c => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) ? parseInt(c.slice(1), 16) : null;

export function trackCurves(T, data) {
  return (data.roads || []).map((rd, ri) => {
    const pts = (rd.from && data.roads[rd.from.r] ? [data.roads[rd.from.r].pts[rd.from.i]] : []).concat(rd.pts || []).filter(Boolean);
    return pts.length >= 2 ? new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p.x, 0, p.z)), ri === 0 && data.closed && pts.length > 2, 'centripetal') : null;
  }).filter(Boolean);
}
export function roadMesh(T, curve, width, color) {
  const n = Math.max(20, Math.round(curve.getLength() / 2)), P = curve.getSpacedPoints(n), pos = [], idx = [], uv = [];
  for (let i = 0; i <= n; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)], d = new T.Vector3().subVectors(b, a).normalize(), s = new T.Vector3(-d.z, 0, d.x).multiplyScalar(width / 2), c = P[i];
    pos.push(c.x + s.x, 0.06, c.z + s.z, c.x - s.x, 0.06, c.z - s.z); uv.push(0, i / 4, 1, i / 4); if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.Mesh(g, new T.MeshLambertMaterial({ color: color != null ? color : 0x3a3d42, side: T.DoubleSide })); m.receiveShadow = true; m.userData.P = P; return m;
}
function kerbs(T, P, width) {
  const grp = new T.Group(), red = new T.MeshLambertMaterial({ color: 0xd32f2f }), wht = new T.MeshLambertMaterial({ color: 0xffffff });
  for (let i = 0; i < P.length - 1; i += 2) { const a = P[i], b = P[i + 1], d = new T.Vector3().subVectors(b, a), len = d.length(); d.normalize(); const s = new T.Vector3(-d.z, 0, d.x);
    for (const side of [1, -1]) { const k = new T.Mesh(new T.BoxGeometry(len, 0.12, 1), (i / 2) % 2 ? red : wht); k.position.set((a.x + b.x) / 2 + s.x * side * (width / 2 + 0.5), 0.08, (a.z + b.z) / 2 + s.z * side * (width / 2 + 0.5)); k.rotation.y = -Math.atan2(d.z, d.x); grp.add(k); } }
  return grp;
}
export function buildPiece(T, data, opts) {
  opts = opts || {};
  const group = new T.Group(); group.name = 'piece:' + (opts.name || '');
  const out = { group, curves: [], data, groundY: 0 };
  if (data.kind === 'track') {
    out.curves = trackCurves(T, data);
    out.curves.forEach((c, i) => { const rd = (data.roads || [])[i] || {}; const m = roadMesh(T, c, data.width || 12, hex(rd.color)); group.add(m); if (data.kerbs !== false) group.add(kerbs(T, m.userData.P, data.width || 12)); });
  } else {
    for (const it of data.items || []) {
      const w = new T.Group();
      if (it.kind === 'model' && it.model && opts.GLTFLoader) { const L = new opts.GLTFLoader(); if (opts.meshopt) L.setMeshoptDecoder(opts.meshopt); L.load(it.model, g => w.add(g.scene), undefined, () => {}); }
      else if (KINDS[it.kind]) w.add(KINDS[it.kind](T, hex(it.color)));
      w.position.set(it.x || 0, it.y || 0, it.z || 0); w.rotation.y = it.ry || 0; w.scale.setScalar(it.s || 1); group.add(w);
    }
  }
  if (opts.scene) opts.scene.add(group);
  return out;
}
export async function loadPiece(name, opts) {
  const r = await fetch((opts && opts.base || '') + 'pieces/' + name + '.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('piece ' + name + ' not found (' + r.status + ')');
  return buildPiece(opts.THREE, await r.json(), Object.assign({ name }, opts));
}
if (typeof window !== 'undefined') window.ApexPieces = { loadPiece, buildPiece, trackCurves, roadMesh, KINDS };
