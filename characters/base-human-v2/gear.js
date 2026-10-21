/* Athlete kit for Base Human v2 - real sport gear + sport stances, shared by every sports game.
   Original designs, built in code (CC0-safe, no outside models). Works on any H.make() result.

     import { loadHumans } from './characters/base-human-v2/humans.js';
     import { hockeyKit } from './characters/base-human-v2/gear.js';
     const H = await loadHumans(THREE, base);
     const a = H.make({ g:'m', skin:2, outfit:'hoodie' }, 1.85);          // the body (any outfit; the kit covers it)
     const kit = hockeyKit(THREE, a, { jersey:0x1f6fd6, yoke:0x123c73, trim:0xffffff, pants:0x0d1a2e,
                                       helmet:0x123c73, gloves:0x123c73, num:17, name:'VANCE', crest:'W' });
     // every frame, AFTER a.mixer.update(dt):
     kit.stance.apply({ crouch:1, stride:0..1 (speed), phase:seconds });
     kit.setPrints({ num, name })   // re-letter the jersey (trades, edits)
     kit.stick                      // the stick Group (in the player's hands; kit.stance keeps the blade on the ice)

   Reference (owner's model sheet, 2026-10-16): ~7.5 heads tall, forward lean 15-20 deg, knee flex 25-30 deg,
   hips back over the heels, wide stance; helmet + clear visor, shoulder pads, oversized gloves, padded breezers,
   shin guards under team socks, skates with steel blades. Everything below is sized from the rig's own
   bind-pose measurements (metres of the 1.81 m male / 1.767 m female, facing +z, the model's left = +x). */

const TAU = Math.PI * 2;

/* ---------- geometry helpers ---------- */
/* A tube around an axis made of elliptic rings. rings: [{ t (0..1 along the axis), a (radius along e1), b (radius
   along e2), o1, o2 (ring centre offsets) }]. u runs around (0 = -e1 side, .25 = +e2 side, .5 = +e1, .75 = -e2),
   v runs along the axis. Optional col(u, v) -> THREE.Color for vertex colours. Ends are left open unless cap. */
function tube(THREE, p0, p1, e1, e2, rings, seg = 28, col = null, cap = false) {
  // resample the rings finely so painted stripes stay crisp (vertex colours would smear across long gaps)
  if (rings.length < 30) { const out = [], K = 36, keys = ['t', 'a', 'b', 'a2', 'b2', 'o1', 'o2', 'v'];
    rings = rings.map((r, j) => ({ ...r, a2: r.a2 ?? r.a, b2: r.b2 ?? r.b, o1: r.o1 || 0, o2: r.o2 || 0, v: r.v ?? j / (rings.length - 1) }));
    for (let k = 0; k <= K; k++) { const v = k / K; let j = 0; while (j < rings.length - 2 && rings[j + 1].v < v) j++;
      const A = rings[j], Bq = rings[j + 1], f = Math.min(1, Math.max(0, (v - A.v) / ((Bq.v - A.v) || 1))), r = {}; keys.forEach((kk) => (r[kk] = A[kk] + (Bq[kk] - A[kk]) * f)); out.push(r); }
    rings = out; }
  // keep the triangles facing outward whichever way the axes were given (mirrored left/right limbs)
  const flipW = new THREE.Vector3().crossVectors(e1, e2).dot(new THREE.Vector3().subVectors(p1, p0)) < 0;
  const n = rings.length, pos = [], uv = [], cols = [], idx = [], d = new THREE.Vector3().subVectors(p1, p0), c = new THREE.Vector3(), q = new THREE.Vector3();
  for (let j = 0; j < n; j++) { const r = rings[j];
    c.copy(p0).addScaledVector(d, r.t).addScaledVector(e1, r.o1 || 0).addScaledVector(e2, r.o2 || 0);
    for (let i = 0; i <= seg; i++) { const th = i / seg * TAU, ca = -Math.cos(th), sb = Math.sin(th);
      q.copy(c).addScaledVector(e1, ca * r.a * (sb > 0 ? 1 : (r.a2 ?? r.a) / r.a)).addScaledVector(e2, sb * (sb > 0 ? r.b : (r.b2 ?? r.b)));
      pos.push(q.x, q.y, q.z); uv.push(i / seg, r.v ?? j / (n - 1)); if (col) { const k = col(i / seg, r.v ?? j / (n - 1)); cols.push(k.r, k.g, k.b); } } }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; flipW ? idx.push(a, a + 1, b, b, a + 1, b + 1) : idx.push(a, b, a + 1, b, b + 1, a + 1); }
  if (cap) for (const [j, flip] of [[0, 1], [n - 1, 0]]) { const r = rings[j]; c.copy(p0).addScaledVector(d, r.t).addScaledVector(e1, r.o1 || 0).addScaledVector(e2, r.o2 || 0);
    const ci = pos.length / 3; pos.push(c.x, c.y, c.z); uv.push(.5, r.v ?? j / (n - 1)); if (col) { const k = col(.5, r.v ?? j / (n - 1)); cols.push(k.r, k.g, k.b); }
    for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i; (flip ^ flipW) ? idx.push(ci, a + 1, a) : idx.push(ci, a, a + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (col) g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }

/* auto skin weights: each vertex follows the bone segments it is nearest to (inverse-distance^4, best 4) */
function autoSkin(THREE, geo, segs) {
  const P = geo.attributes.position, n = P.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), v = new THREE.Vector3(), cp = new THREE.Vector3(), line = new THREE.Line3();
  for (let k = 0; k < n; k++) { v.fromBufferAttribute(P, k); const w = segs.map((s, i) => { line.set(s.a, s.b); line.closestPointToPoint(v, true, cp); const dd = Math.max(.02, cp.distanceTo(v)); return [s.i, (s.k ?? 1) / dd ** 4]; });
    w.sort((x, y) => y[1] - x[1]); const top = w.slice(0, 4), sum = top.reduce((s, x) => s + x[1], 0) || 1;
    top.forEach((x, j) => { si[k * 4 + j] = x[0]; sw[k * 4 + j] = x[1] / sum; }); }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); return geo; }

/* ---------- rig access ---------- */
function rigOf(THREE, a) {
  const obj = a.object, B = {}; let body = null;
  obj.traverse((o) => { if (o.isBone) B[o.name] = o; if (o.isSkinnedMesh && o.material && o.material.userData && o.material.userData.U) body = o; });
  if (!body) obj.traverse((o) => { if (!body && o.isSkinnedMesh && /Super/i.test(o.name)) body = o; });
  body.skeleton.pose(); obj.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
  const P = (name) => (B[name] ? B[name].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv) : new THREE.Vector3());   // bind-pose, object space
  const g = a.spec && a.spec.g === 'f' ? 'f' : 'm', s = g === 'f' ? 1.767 / 1.81 : 1;
  // body proportion in head heights (standing): crown / (crown - chin), chin = lowest vertex owned by the Head bone
  let chin = 9, crown = 0; { const Pp = body.geometry.attributes.position, si = body.geometry.attributes.skinIndex, sw = body.geometry.attributes.skinWeight, hi = body.skeleton.bones.indexOf(B.Head), v = new THREE.Vector3(), m = new THREE.Matrix4().copy(obj.matrixWorld).invert();
    for (let i = 0; i < Pp.count; i++) { v.fromBufferAttribute(Pp, i); body.applyBoneTransform(i, v); v.applyMatrix4(body.matrixWorld).applyMatrix4(m); crown = Math.max(crown, v.y);
      let w = 0; for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === hi) w += sw.getComponent(i, k); if (w > .5) chin = Math.min(chin, v.y); } }
  const heads = crown / Math.max(.05, crown - chin);   // female bodies are a touch smaller - the kit scales with them
  return { obj, B, body, P, g, s, inv, heads }; }

/* a skinned shell that rides the body's own skeleton (bends with the animation like real cloth/pads) */
function shell(THREE, R, geo, segNames, mat) {
  const bones = R.body.skeleton.bones, segs = [];
  for (const [a, b, k] of segNames) { const i = bones.indexOf(R.B[a]); if (i < 0) continue; segs.push({ i, a: R.P(a), b: R.P(b), k }); }
  // geometry is authored in object space; the skinned mesh lives next to the body with the body's transform
  const toMesh = new THREE.Matrix4().copy(R.body.matrixWorld).invert().multiply(R.obj.matrixWorld);
  autoSkin(THREE, geo, segs); geo.applyMatrix4(toMesh); geo.computeVertexNormals();
  const m = new THREE.SkinnedMesh(geo, mat); m.frustumCulled = false; m.castShadow = true;
  R.body.parent.add(m); m.position.copy(R.body.position); m.quaternion.copy(R.body.quaternion); m.scale.copy(R.body.scale); m.updateMatrixWorld(true);
  m.bind(R.body.skeleton, R.body.bindMatrix); return m; }

/* A batch: many gear pieces -> ONE skinned mesh per material (phones: 12 players x a handful of draw calls, not hundreds).
   add(geo, colour, bind): geo authored in object space (bind pose); bind = a bone name (rigid: helmet, glove, skate) or
   [[boneA, boneB, weight], ...] segments (auto-skinned: pads, socks, pants). addGroup(group, bone, colourOf) bakes a Group. */
function batch(THREE, R, withUV = false) {
  const bones = R.body.skeleton.bones, parts = [];
  const api = {
    add(geo, color, bind) { let g = geo.index ? geo.toNonIndexed() : geo.clone(); if (!g.attributes.normal) g.computeVertexNormals();
      const n = g.attributes.position.count;
      if (color != null || !g.attributes.color) { const c = new THREE.Color(color ?? 0xffffff), a = new Float32Array(n * 3); for (let k = 0; k < n; k++) { a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
      if (typeof bind === 'string') { const bi = Math.max(0, bones.indexOf(R.B[bind])), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); for (let k = 0; k < n; k++) { si[k * 4] = bi; sw[k * 4] = 1; }
        g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); }
      else { const segs = []; for (const [a, b, k] of bind) { const bi = bones.indexOf(R.B[a]); if (bi >= 0) segs.push({ i: bi, a: R.P(a), b: R.P(b), k }); } autoSkin(THREE, g, segs); }
      parts.push(g); return api; },
    addGroup(grp, bind, colourOf) { grp.updateMatrixWorld(true); grp.traverse((m) => { if (!m.isMesh) return; const g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); api.add(g, colourOf ? colourOf(m) : m.userData.col, bind); }); return api; },
    build(mat, name) { if (!parts.length) return null;
      const keys = ['position', 'normal', 'color', 'skinIndex', 'skinWeight'].concat(withUV ? ['uv'] : []), out = new THREE.BufferGeometry();
      for (const k of keys) { const isz = parts[0].attributes[k].itemSize, tot = parts.reduce((s2, g) => s2 + g.attributes[k].count, 0), A = k === 'skinIndex' ? new Uint16Array(tot * isz) : new Float32Array(tot * isz); let o2 = 0;
        for (const g of parts) { A.set(g.attributes[k].array, o2); o2 += g.attributes[k].array.length; } out.setAttribute(k, new THREE.BufferAttribute(A, isz)); }
      const toMesh = new THREE.Matrix4().copy(R.body.matrixWorld).invert().multiply(R.obj.matrixWorld); out.applyMatrix4(toMesh);
      const m = new THREE.SkinnedMesh(out, mat); m.name = name || 'gear'; m.frustumCulled = false; m.castShadow = true;
      R.body.parent.add(m); m.position.copy(R.body.position); m.quaternion.copy(R.body.quaternion); m.scale.copy(R.body.scale); m.updateMatrixWorld(true);
      m.bind(R.body.skeleton, R.body.bindMatrix); parts.length = 0; return m; } };
  return api; }

/* ---------- sport stance (applied on top of any clip, every frame) ---------- */
function makeStance(THREE, R, cfg) {
  const X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1), qa = new THREE.Quaternion(), qp = new THREE.Quaternion(), qo = new THREE.Quaternion(), ax = new THREE.Vector3(), tmp = new THREE.Vector3();
  const D = Math.PI / 180, B = R.B;
  // rotate a bone about an OBJECT-space axis (so "forward lean" means forward whatever the clip did)
  function turn(name, axis, ang) { const b = B[name]; if (!b || !ang) return; b.parent.updateWorldMatrix(true, false); R.obj.getWorldQuaternion(qo); b.parent.getWorldQuaternion(qp);
    ax.copy(axis).applyQuaternion(qo).applyQuaternion(qp.invert()); qa.setFromAxisAngle(ax, ang); b.quaternion.premultiply(qa); }
  // 2-bone reach (exact): put the elbow on the circle that lets the hand land on the target, bent toward the pole
  // (object-space direction the elbow should point, e.g. out and down). One pass, no wobble.
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), Sx = new THREE.Vector3(), Ex = new THREE.Vector3(), Hx = new THREE.Vector3(), Tw = new THREE.Vector3(), Pw = new THREE.Vector3(), Ew = new THREE.Vector3(), dS = new THREE.Vector3(), qw = new THREE.Quaternion(), pw = new THREE.Quaternion();
  const aim = (b, from, to) => { v1.copy(from).normalize(); v2.copy(to).normalize(); qw.setFromUnitVectors(v1, v2); b.parent.getWorldQuaternion(pw); b.quaternion.premultiply(pw.clone().invert().multiply(qw).multiply(pw)); };
  function reach(upper, lower, hand, target, pole) { const U = B[upper], L = B[lower], Hd = B[hand]; if (!U || !L || !Hd) return;
    Hd.updateWorldMatrix(true, false); U.getWorldPosition(Sx); L.getWorldPosition(Ex); Hd.getWorldPosition(Hx);
    const l1 = Ex.distanceTo(Sx), l2 = Hx.distanceTo(Ex); Tw.copy(target).applyMatrix4(R.obj.matrixWorld);
    dS.subVectors(Tw, Sx); const d = Math.min(Math.max(dS.length(), Math.abs(l1 - l2) + 1e-3), (l1 + l2) * .999); dS.normalize();
    Pw.copy(pole || new THREE.Vector3(0, -1, 0)).applyQuaternion(R.obj.getWorldQuaternion(qo)); Pw.addScaledVector(dS, -Pw.dot(dS)).normalize();
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    Ew.copy(Sx).addScaledVector(dS, a).addScaledVector(Pw, h);
    aim(U, v1.subVectors(Ex, Sx).clone(), v2.subVectors(Ew, Sx).clone());
    Hd.updateWorldMatrix(true, false); L.getWorldPosition(Ex); Hd.getWorldPosition(Hx);
    aim(L, v1.subVectors(Hx, Ex).clone(), v2.subVectors(Tw, Ex).clone()); }
  function measure() { R.obj.updateMatrixWorld(true); invM.copy(R.obj.matrixWorld).invert(); const P = (n) => objPos(n).clone(), D2 = 180 / Math.PI;
    const pel = P('pelvis'), nk = P('neck_01'), t = nk.clone().sub(pel); const lean = Math.atan2(t.z, t.y) * D2;
    const knee = (sd) => { const h = P('thigh_' + sd), k = P('calf_' + sd), f = P('foot_' + sd); return new THREE.Vector3().subVectors(k, h).angleTo(new THREE.Vector3().subVectors(f, k)) * D2; };
    const hipBack = pel.z - (P('foot_l').z + P('foot_r').z) / 2;
    const heads = R.heads;
    const stance = Math.abs(P('foot_l').x - P('foot_r').x) / Math.abs(P('thigh_l').x - P('thigh_r').x);
    return { lean, kneeL: knee('l'), kneeR: knee('r'), hipBack, heads, stance }; }
  const ankle0 = R.P('foot_l').y, lift = cfg.lift;                     // foot bone height in bind pose, + skate height
  const invM = new THREE.Matrix4(), objPos = (name) => { B[name].updateWorldMatrix(true, false); return B[name].getWorldPosition(tmp).applyMatrix4(invM); };
  return { cfg, reach, measure, apply(o = {}) {
    R.obj.updateWorldMatrix(true, false); invM.copy(R.obj.matrixWorld).invert();
    const c = o.crouch ?? 1, sp = o.stride ?? 0, ph = (o.phase ?? 0) * (cfg.cadence || 5.2), lean = cfg.lean * D * c, knee = cfg.knee * D * c, wide = cfg.wide * D * c;
    // the stance is ABSOLUTE: whatever the clip did, measure it and turn it into the target numbers
    const tilt = (a, b) => { const A = objPos(a).clone(), Bv = objPos(b); return Math.atan2(Bv.z - A.z, A.y - Bv.y); };   // + = b ahead of a (down-pointing limb)
    const up2 = (a, b) => { const A = objPos(a).clone(), Bv = objPos(b); return Math.atan2(Bv.z - A.z, Bv.y - A.y); };   // + = b ahead of a (up-pointing spine)
    const dl = lean - up2('pelvis', 'neck_01');
    turn('pelvis', X, dl * .45); turn('spine_01', X, dl * .2); turn('spine_02', X, dl * .2); turn('spine_03', X, dl * .15);
    turn('neck_01', X, -lean * .5); turn('Head', X, -lean * .4);      // eyes up the ice
    const toe0 = Math.atan2(R.P('foot_l').y - R.P('ball_l').y, R.P('ball_l').z - R.P('foot_l').z);
    for (const [sd, sg] of [['l', 1], ['r', -1]]) {
      const ph2 = ph + (sg > 0 ? 0 : Math.PI), push = sp * Math.max(0, Math.sin(ph2));   // skating stride: each leg pushes out to the side in turn
      const kn = knee + push * .2;
      turn('thigh_' + sd, X, -(kn * .55 + sp * .1 * Math.sin(ph2) - tilt('thigh_' + sd, 'calf_' + sd)));      // knee ahead of the hip
      turn('calf_' + sd, X, -(-kn * .45 - tilt('calf_' + sd, 'foot_' + sd)));                                // ankle back under the hip
      const tn = Math.atan2(objPos('foot_' + sd).y - objPos('ball_' + sd).y, objPos('ball_' + sd).z - objPos('foot_' + sd).z);
      turn('foot_' + sd, X, toe0 - tn);                                                                       // blade flat on the ice
      turn('thigh_' + sd, Z, sg * (wide + push * .3));
      turn('calf_' + sd, Z, -sg * (wide * .55 + push * .2));
      // exact knee flex in 3D (the side-spread changes it a little): correct the calf, then flatten the blade again
      { const h = objPos('thigh_' + sd).clone(), k = objPos('calf_' + sd).clone(), f = objPos('foot_' + sd); const k3 = k.clone().sub(h).angleTo(f.clone().sub(k)); turn('calf_' + sd, X, kn - k3);
        const tn2 = Math.atan2(objPos('foot_' + sd).y - objPos('ball_' + sd).y, objPos('ball_' + sd).z - objPos('foot_' + sd).z); turn('foot_' + sd, X, toe0 - tn2); }
      turn('foot_' + sd, Z, -sg * (wide * .45 + push * .1));
    }
    if (cfg.arms) cfg.arms(turn, c, sp, ph, X, Z);
    // keep the skates ON the ice: put the lower foot exactly at blade height
    const yl = objPos('foot_l').y, yr = objPos('foot_r').y, low = Math.min(yl, yr), want = ankle0 + lift;
    const p = B.pelvis; p.updateWorldMatrix(true, false); const w = p.getWorldPosition(new THREE.Vector3()), up = new THREE.Vector3(0, 1, 0).applyQuaternion(R.obj.getWorldQuaternion(qo));
    w.addScaledVector(up, (want - low) * R.obj.getWorldScale(tmp).y); p.position.copy(p.parent.worldToLocal(w));
    if (cfg.after) { R.obj.updateMatrixWorld(true); cfg.after(objPos, c, sp, ph, reach, o); }
  } }; }

/* ---------- textures ---------- */
function canvasTex(THREE, w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.canvas = c; t.userData.draw = draw; return t; }
const hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');

/* ================= HOCKEY ================= */
export function hockeyKit(THREE, a, o = {}) {
  const R = rigOf(THREE, a), s = R.s, V = (x, y, z) => new THREE.Vector3(x * s, y * s, z * s), X1 = new THREE.Vector3(1, 0, 0), Z1 = new THREE.Vector3(0, 0, 1);
  const C = { jersey: 0x1f6fd6, yoke: 0x123c73, trim: 0xffffff, pants: 0x0d1a2e, helmet: 0x123c73, gloves: 0x123c73, socks: null, num: 9, name: '', crest: 'A',
    visor: true, cage: false, goalie: false, hold: true, blade: [-.34, .7], ...o };
  const parts = {}, mats = [];
  const M = (p) => { const m = new THREE.MeshStandardMaterial(p); mats.push(m); return m; };
  // the kit replaces the street outfit: hide its add-ons (hair under the helmet, hood, collars...) - body, eyes and brows stay
  R.obj.traverse((m) => { if (m.isMesh && m !== R.body && !/^(Eyes|Eyebrows)$/i.test(m.name)) m.visible = false; });
  const U = R.body.material.userData.U; if (U && U.uTop) { U.uTop.value.set(C.jersey); U.uBot.value.set(C.pants); U.uJak.value.set(C.jersey); U.uShoe.value.set(0x16181c); }
  const col = (h) => new THREE.Color(h), cJ = col(C.jersey), cY = col(C.yoke), cT = col(C.trim), cP = col(C.pants), cG = col(C.gloves), cS = col(C.socks ?? C.jersey);

  /* --- jersey + sleeves: ONE texture atlas (top 2/3 = body, bottom 1/3 = sleeves), letters painted in --- */
  let prints = { num: C.num, name: C.name };
  const jerTex = canvasTex(THREE, 1024, 768, (g, w, h0) => { const h = 512;
    g.fillStyle = hex(C.jersey); g.fillRect(0, 0, w, h0);
    g.fillStyle = hex(C.yoke); g.fillRect(0, 0, w, h * .2); g.fillStyle = hex(C.trim); g.fillRect(0, h * .2, w, h * .018);       // shoulder yoke
    for (const [y0, hh] of [[.8, .05], [.875, .03]]) { g.fillStyle = hex(C.trim); g.fillRect(0, h * y0, w, h * hh); }              // hem stripes
    g.fillStyle = hex(C.yoke); g.fillRect(0, h * .93, w, h * .07);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    const txt = (t, x, y, px, wt = 900) => { g.font = wt + ' ' + px + 'px system-ui, Arial, sans-serif'; g.lineWidth = px * .14; g.strokeStyle = hex(C.yoke); g.strokeText(t, x, y); g.fillStyle = hex(C.trim); g.fillText(t, x, y); };
    if (prints.name) txt(String(prints.name).toUpperCase().slice(0, 12), w * .75, h * .36, 44, 800);                               // back (u .75)
    txt(String(prints.num ?? ''), w * .75, h * .66, 190);
    const cx = w * .25, cy = h * .47; g.lineWidth = 12; g.strokeStyle = hex(C.trim); g.fillStyle = hex(C.yoke);                    // front crest (u .25)
    g.beginPath(); g.arc(cx, cy, 72, 0, TAU); g.fill(); g.stroke();
    g.font = '900 96px system-ui, Arial, sans-serif'; g.fillStyle = hex(C.trim); g.textBaseline = 'middle'; g.fillText(String(C.crest).slice(0, 2), cx, cy + 6);
    // sleeve strip (y 512..768): shoulder end at top, cuff at the bottom
    const sy = 512, sh = 256; g.fillStyle = hex(C.yoke); g.fillRect(0, sy, w, sh * .26);
    for (const [y0, hh] of [[.56, .06], [.66, .035]]) { g.fillStyle = hex(C.trim); g.fillRect(0, sy + sh * y0, w, sh * hh); }
    g.fillStyle = hex(C.yoke); g.fillRect(0, sy + sh * .9, w, sh * .1);
    g.textBaseline = 'middle'; g.font = '900 54px system-ui, Arial, sans-serif'; g.lineWidth = 8; g.strokeStyle = hex(C.yoke); g.fillStyle = hex(C.trim);
    for (const x of [w * .25, w * .75]) { g.save(); g.translate(x, sy + sh * .42); g.scale(.5, 1); g.strokeText(String(prints.num ?? ''), 0, 0); g.fillText(String(prints.num ?? ''), 0, 0); g.restore(); } });
  jerTex.flipY = false;
  const jb = batch(THREE, R, true), remapV = (geo, v0, v1) => { const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setY(k, v0 + uv.getY(k) * (v1 - v0)); return geo; };
  { const rings = [
      { t: 0, a: .085, b: .08, o2: -.035, v: 0 }, { t: .03, a: .13, b: .1, o2: -.03, v: .05 }, { t: .07, a: .2, b: .15, b2: .17, o2: -.025, v: .12 },
      { t: .13, a: .255, b: .19, b2: .205, o2: -.02, v: .2 }, { t: .22, a: .262, b: .19, b2: .205, o2: -.02, v: .3 }, { t: .34, a: .25, b: .175, b2: .19, o2: -.02, v: .42 },
      { t: .5, a: .23, b: .16, b2: .16, o2: -.005, v: .58 }, { t: .66, a: .222, b: .15, b2: .155, o2: 0, v: .72 }, { t: .82, a: .232, b: .162, b2: .18, o2: -.01, v: .86 },
      { t: 1, a: .245, b: .172, b2: .195, o2: -.015, v: 1 } ].map((r) => ({ ...r, a: r.a * s, b: r.b * s, b2: r.b2 && r.b2 * s, o2: (r.o2 || 0) * s }));
    jb.add(remapV(tube(THREE, V(0, 1.535, 0), V(0, .86, 0), X1, Z1, rings, 40), 0, 2 / 3), 0xffffff,
      [['pelvis', 'spine_01'], ['spine_01', 'spine_02'], ['spine_02', 'spine_03'], ['spine_03', 'neck_01'], ['clavicle_l', 'upperarm_l', .6], ['clavicle_r', 'upperarm_r', .6]]);
    for (const sd of ['l', 'r']) { const sg = sd === 'l' ? 1 : -1, sh = R.P('upperarm_' + sd), hd = R.P('hand_' + sd);
      const p0 = new THREE.Vector3(sh.x - sg * .085 * s, sh.y, sh.z), p1 = new THREE.Vector3(hd.x - sg * .05 * s, hd.y, hd.z);
      const sr = [{ t: 0, a: .12, b: .115 }, { t: .1, a: .135, b: .125 }, { t: .25, a: .125, b: .115 }, { t: .42, a: .1, b: .095 }, { t: .55, a: .098, b: .1 }, { t: .62, a: .1, b: .104 },
        { t: .7, a: .092, b: .092 }, { t: .86, a: .082, b: .08 }, { t: 1, a: .078, b: .076 }].map((r) => ({ ...r, a: r.a * s, b: r.b * s }));   // shoulder pad cap -> elbow pad -> cuff
      jb.add(remapV(tube(THREE, p0, p1, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, sg), sr, 24), 2 / 3, 1), 0xffffff,
        [['clavicle_' + sd, 'upperarm_' + sd, .5], ['upperarm_' + sd, 'lowerarm_' + sd], ['lowerarm_' + sd, 'hand_' + sd]]); }
    parts.jersey = jb.build(M({ map: jerTex, vertexColors: true, roughness: .72, side: THREE.DoubleSide }), 'jersey'); }

  /* --- matte gear (one mesh): breezers, socks over shin guards, gloves, skate trim, helmet straps --- */
  const mb = batch(THREE, R), gb = batch(THREE, R), sb = batch(THREE, R);   // matte, glossy (helmet + boots), steel
  { const dk = cP.clone().multiplyScalar(.7);
    mb.add(tube(THREE, V(0, 1.04, 0), V(0, .84, 0), X1, Z1, [{ t: 0, a: .2, b: .14, b2: .16, o2: -.02 }, { t: .3, a: .222, b: .16, b2: .19, o2: -.025 }, { t: 1, a: .228, b: .165, b2: .2, o2: -.02 }]
      .map((r) => ({ ...r, a: r.a * s, b: r.b * s, b2: r.b2 * s, o2: r.o2 * s })), 36, (u, v) => cP), null, [['pelvis', 'spine_01'], ['spine_01', 'spine_02', .3], ['thigh_l', 'calf_l', .5], ['thigh_r', 'calf_r', .5]]);
    for (const sd of ['l', 'r']) { const sg = sd === 'l' ? 1 : -1, hp = R.P('thigh_' + sd), kn = R.P('calf_' + sd), an = R.P('foot_' + sd);
      const lr = [{ t: 0, a: .16, b: .16 }, { t: .3, a: .165, b: .165, b2: .175 }, { t: .75, a: .148, b: .145, b2: .155 }, { t: .93, a: .14, b: .14 }, { t: 1, a: .128, b: .128 }].map((r) => ({ ...r, a: r.a * s, b: r.b * s, b2: (r.b2 ?? r.b) * s }));
      mb.add(tube(THREE, new THREE.Vector3(hp.x + sg * .01 * s, .99 * s, hp.z), new THREE.Vector3(kn.x + sg * .005 * s, kn.y + .045 * s, kn.z), new THREE.Vector3(sg, 0, 0), Z1, lr, 28,
        (u, v) => (v > .9 ? cT : Math.abs(u - .5) < .035 ? cT : cP)), null, [['pelvis', 'thigh_' + sd, .4], ['thigh_' + sd, 'calf_' + sd]]);     // breezer leg, stripe down the outside
      const rr = [{ t: 0, a: .1, b: .1 }, { t: .1, a: .102, b: .105, b2: .1 }, { t: .17, a: .1, b: .125, b2: .1, o2: .01 }, { t: .26, a: .1, b: .11, b2: .1 },
        { t: .45, a: .118, b: .108, b2: .135 }, { t: .7, a: .104, b: .1, b2: .118 }, { t: .9, a: .088, b: .09, b2: .095 }, { t: 1, a: .082, b: .085, b2: .088 }].map((r) => ({ ...r, a: r.a * s, b: r.b * s, b2: (r.b2 ?? r.b) * s, o2: (r.o2 || 0) * s }));
      mb.add(tube(THREE, new THREE.Vector3(kn.x, kn.y + .1 * s, kn.z), new THREE.Vector3(an.x, an.y + .06 * s, an.z + .01 * s), new THREE.Vector3(-sg, 0, 0), Z1, rr, 24,
        (u, v) => (v < .06 ? cY : (v > .44 && v < .52) || (v > .57 && v < .62) ? cT : v > .84 ? cY : cS)), null, [['thigh_' + sd, 'calf_' + sd, .35], ['calf_' + sd, 'foot_' + sd]]);   // sock over the shin guard
    } }

  /* --- skates: boot, cuff, tongue, holder, steel blade --- */
  for (const sd of ['l', 'r']) { const sg = sd === 'l' ? 1 : -1, ft = R.P('foot_' + sd), cx = ft.x + sg * .018 * s, bone = 'foot_' + sd, boot = 0x15171b, trim = C.trim === 0xffffff ? 0xd9dde2 : C.trim;
    const br = [{ t: 0, a: .05, b: .03 }, { t: .05, a: .1, b: .06 }, { t: .3, a: .115, b: .066 }, { t: .62, a: .085, b: .062 }, { t: .86, a: .055, b: .058 }, { t: 1, a: .02, b: .03 }].map((r) => ({ ...r, a: r.a * s, b: r.b * s, o1: -r.a * s * .95 }));
    gb.add(tube(THREE, new THREE.Vector3(cx, -.006 * s, ft.z - .062 * s), new THREE.Vector3(cx, -.006 * s, ft.z + .243 * s), new THREE.Vector3(0, -1, 0), X1, br, 22, null, true), boot, bone);
    gb.add(tube(THREE, new THREE.Vector3(cx, .07 * s, ft.z - .025 * s), new THREE.Vector3(cx, .2 * s, ft.z - .04 * s), X1, Z1,
      [{ t: 0, a: .062, b: .08 }, { t: .6, a: .058, b: .068 }, { t: 1, a: .062, b: .07, b2: .074 }].map((r) => ({ ...r, a: r.a * s, b: r.b * s, b2: (r.b2 ?? r.b) * s })), 22), boot, bone);
    const box = (w, h, d, x, y, z, rx = 0) => { const g = new THREE.BoxGeometry(w * s, h * s, d * s); g.rotateX(rx); g.translate(x, y * s, z * s); return g; };
    mb.add(box(.06, .1, .02, cx, .2, ft.z / s + .05, -.25), trim, bone); mb.add(box(.05, .06, .02, cx, .19, ft.z / s - .115, .2), trim, bone);
    gb.add(box(.03, .03, .29, cx, -.022, .005), 0xe9ecef, bone);
    for (const z of [-.105, .11]) { const tw = new THREE.CylinderGeometry(.02 * s, .028 * s, .035 * s, 10); tw.translate(cx, -.005 * s, z * s); gb.add(tw, 0xe9ecef, bone); }
    const bl = new THREE.Shape(), L = .3 * s, H = .028 * s; bl.moveTo(-L / 2, H); bl.lineTo(L / 2, H); bl.quadraticCurveTo(L / 2 + .02 * s, 0, L / 2 - .03 * s, -.004 * s); bl.quadraticCurveTo(0, -.012 * s, -L / 2 + .03 * s, -.004 * s); bl.quadraticCurveTo(-L / 2 - .015 * s, H * .4, -L / 2, H);
    const bg = new THREE.ExtrudeGeometry(bl, { depth: .006 * s, bevelEnabled: false }); bg.translate(0, 0, -.003 * s); bg.rotateY(-Math.PI / 2); bg.translate(cx, -.065 * s, .005 * s);
    sb.add(bg, 0xc8d2da, bone); }

  /* --- oversized gloves: padded cuff, finger rolls, thumb, dark palm --- */
  for (const sd of ['l', 'r']) { const sg = sd === 'l' ? 1 : -1, hd = R.P('hand_' + sd), bone = 'hand_' + sd;
    mb.add(tube(THREE, new THREE.Vector3(hd.x - sg * .085 * s, hd.y, hd.z), new THREE.Vector3(hd.x + sg * .02 * s, hd.y, hd.z), new THREE.Vector3(0, -1, 0), Z1,
      [{ t: 0, a: .098, b: .1 }, { t: .5, a: .092, b: .094 }, { t: 1, a: .078, b: .08 }].map((r) => ({ ...r, a: r.a * s, b: r.b * s })), 22, null, true), cG, bone);
    const ring = new THREE.TorusGeometry(.094 * s, .012 * s, 6, 22); ring.rotateY(Math.PI / 2); ring.translate(hd.x - sg * .075 * s, hd.y, hd.z); mb.add(ring, cT, bone);
    for (let i = 0; i < 3; i++) { const r2 = new THREE.CapsuleGeometry(.03 * s, .09 * s, 4, 10); r2.rotateZ(Math.PI / 2); r2.translate(hd.x + sg * .11 * s, hd.y + .012 * s, hd.z + (i - 1) * .04 * s); mb.add(r2, i === 1 ? cT : cG, bone); }
    const bk = new THREE.CapsuleGeometry(.05 * s, .05 * s, 4, 12); bk.rotateZ(Math.PI / 2); bk.scale(1, .75, 1.35); bk.translate(hd.x + sg * .045 * s, hd.y + .005 * s, hd.z); mb.add(bk, cG, bone);
    const pl = new THREE.BoxGeometry(.17 * s, .012 * s, .11 * s); pl.translate(hd.x + sg * .09 * s, hd.y - .03 * s, hd.z); mb.add(pl, 0x2a2620, bone);
    const th = new THREE.CapsuleGeometry(.024 * s, .05 * s, 4, 8); th.rotateZ(Math.PI / 2); th.translate(hd.x + sg * .06 * s, hd.y - .01 * s, hd.z + .07 * s); mb.add(th, cG, bone); }

  /* --- helmet: shell riding low at the back, ear covers, clear visor (or a cage for kids / goalies) --- */
  { const c0 = V(0, 1.712, -.012), RX = .123 * s, RY = .128 * s, RZ = .14 * s, N = 14, SEG = 36, pos = [], idx = [], dark = 0x17191d;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= SEG; i++) { const az = i / SEG * TAU, fr = (1 + Math.cos(az)) / 2, phMax = Math.PI * (.66 - .25 * fr ** 2.2), ph = phMax * j / N;   // edge: brow in front, low at the back
      pos.push(c0.x + Math.sin(ph) * Math.sin(az) * RX, c0.y + Math.cos(ph) * RY, c0.z + Math.sin(ph) * Math.cos(az) * RZ); }
    for (let j = 0; j < N; j++) for (let i = 0; i < SEG; i++) { const a0 = j * (SEG + 1) + i, b0 = a0 + SEG + 1; idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1); }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setIndex(idx); hg.computeVertexNormals(); gb.add(hg, C.helmet, 'Head');
    const rg = new THREE.CapsuleGeometry(.012 * s, .15 * s, 4, 8); rg.rotateX(Math.PI / 2); rg.translate(0, c0.y + RY * .97, c0.z - .01 * s); gb.add(rg, C.helmet, 'Head');
    for (const x of [-.045, .045]) { const vent = new THREE.BoxGeometry(.012 * s, .006 * s, .05 * s); vent.rotateZ(x > 0 ? -.35 : .35); vent.translate(x * s, c0.y + RY * .93, c0.z + .02 * s); mb.add(vent, dark, 'Head'); }
    for (const sx of [-1, 1]) { const ear = new THREE.CylinderGeometry(.038 * s, .042 * s, .022 * s, 16); ear.rotateZ(Math.PI / 2); ear.translate(sx * .118 * s, 1.678 * s, -.012 * s); gb.add(ear, C.helmet, 'Head');
      const hole = new THREE.CylinderGeometry(.014 * s, .014 * s, .024 * s, 10); hole.rotateZ(Math.PI / 2); hole.translate(sx * .121 * s, 1.678 * s, -.012 * s); mb.add(hole, dark, 'Head');
      const clip = new THREE.BoxGeometry(.012 * s, .03 * s, .03 * s); clip.translate(sx * .128 * s, 1.722 * s, .07 * s); mb.add(clip, dark, 'Head');
      const strap = new THREE.BoxGeometry(.008 * s, .09 * s, .016 * s); strap.rotateX(.35); strap.translate(sx * .104 * s, 1.625 * s, .02 * s); mb.add(strap, dark, 'Head'); }
    if (C.cage) { for (const y of [1.735, 1.69, 1.645, 1.6]) { const bar = new THREE.TorusGeometry(.13 * s, .0035 * s, 4, 24, Math.PI * .75); bar.rotateZ(Math.PI * .125); bar.rotateX(Math.PI / 2); bar.translate(0, y * s, -.005 * s); sb.add(bar, 0xd8dde2, 'Head'); }
      for (const a2 of [-.75, -.4, 0, .4, .75]) { const bar = new THREE.CylinderGeometry(.0035 * s, .0035 * s, .15 * s, 4); bar.translate(Math.sin(a2) * .13 * s, 1.665 * s, -.005 * s + Math.cos(a2) * .13 * s); sb.add(bar, 0xd8dde2, 'Head'); } }
    else if (C.visor) { const vb = batch(THREE, R), vg = new THREE.CylinderGeometry(.142 * s, .142 * s, .075 * s, 28, 1, true, -1.25, 2.5); vg.rotateX(-.08); vg.translate(0, 1.706 * s, -.012 * s); vb.add(vg, 0xcfe6ff, 'Head');
      parts.visor = vb.build(M({ vertexColors: true, roughness: .05, metalness: .2, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false }), 'visor');
      const ed = new THREE.TorusGeometry(.142 * s, .0028 * s, 4, 28, 2.5); ed.rotateZ(Math.PI / 2 - 1.25); ed.rotateX(Math.PI / 2); ed.translate(0, 1.669 * s, -.009 * s); mb.add(ed, dark, 'Head'); } }
  parts.gear = mb.build(M({ vertexColors: true, roughness: .7, metalness: .02 }), 'gear-matte');
  parts.shell = gb.build(M({ vertexColors: true, roughness: .26, metalness: .12, side: THREE.DoubleSide }), 'gear-gloss');
  parts.steel = sb.build(M({ vertexColors: true, roughness: .34, metalness: .25 }), 'gear-steel'); // G-72: silver that reads silver - metalness .9 with no env map rendered the blades near-black, so the boots looked sunk into the ice
  if (U && U.uScalp) U.uScalp.value = 0;

  /* --- stick: in both hands, blade flat on the ice (one mesh) --- */
  const stick = new THREE.Group();
  { const pcs = [], add = (g, c) => { const n = g.toNonIndexed(); const cc = col(c), A = new Float32Array(n.attributes.position.count * 3); for (let k = 0; k < A.length; k += 3) { A[k] = cc.r; A[k + 1] = cc.g; A[k + 2] = cc.b; } n.setAttribute('color', new THREE.BufferAttribute(A, 3)); n.deleteAttribute('uv'); pcs.push(n); };
    const bx = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
    add(bx(.03, 1.45, .02, 0, .725, 0), 0x1b1d22); add(bx(.034, .14, .024, 0, 1.39, 0), 0x111111); add(bx(.3, .075, .012, .14, .035, 0), 0x1b1d22); add(bx(.2, .062, .014, .17, .036, 0), 0xf2f2f0);
    const out = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'color']) { const arrs = pcs.map((g) => g.attributes[k].array), A = new Float32Array(arrs.reduce((n, x) => n + x.length, 0)); let o2 = 0; arrs.forEach((x) => { A.set(x, o2); o2 += x.length; }); out.setAttribute(k, new THREE.BufferAttribute(A, 3)); }
    const m = new THREE.Mesh(out, M({ vertexColors: true, roughness: .5, metalness: .15 })); m.castShadow = true; stick.add(m); }
  const hold = C.hold !== false;
  if (hold) R.obj.add(stick);
  const Y1 = new THREE.Vector3(0, 1, 0), TWIST = +(C.twist ?? .42), POLE_L = new THREE.Vector3(.7, -.55, -.35), POLE_R = new THREE.Vector3(-.75, -.5, -.2);
  const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), fw = new THREE.Vector3(), bm = new THREE.Matrix4(), tgt = new THREE.Vector3(), gTop = new THREE.Vector3(), gBot = new THREE.Vector3();

  /* --- the skating stance (owner's sheet: lean 15-20, knees 25-30, hips back, wide); hands on the stick --- */
  const stance = makeStance(THREE, R, { lean: C.goalie ? 22 : 19, knee: C.goalie ? 34 : 28, wide: C.goalie ? 9 : 6, lift: .165 * s, cadence: 5.2, // G-67 measured: blade bottom reaches the ice at lift .165 (was .085 - blades sat 8 cm under the ice, boots hovered)
    arms: hold ? (turn, c, sp, ph, X) => { turn('spine_02', Y1, TWIST * .4); turn('spine_03', Y1, TWIST * .6); turn('spine_03', X, .12);   // shoulders turn toward the stick, upper back rounds
      turn('neck_01', Y1, -TWIST * .7); } : null,
    after: hold ? (objPos, c, sp, ph, reach, op) => {
      const pel = objPos('pelvis'), b = op.blade || C.blade, sw = (op.handle || 0) * Math.sin(ph * 2) * .12 + sp * .06 * Math.sin(ph);
      gTop.set(pel.x + .0 * s, pel.y + .1 * s, pel.z + .3 * s);                                // top hand just in front of the left hip
      tgt.set(b[0] * s + sw, 0, b[1] * s);                                                     // blade on the ice (stickhandling sways it)
      reach('upperarm_l', 'lowerarm_l', 'hand_l', gTop, POLE_L);
      // bottom hand a glove-and-a-half below the top hand (the sheet's grip: both gloves at the hips)
      { const d = new THREE.Vector3().subVectors(tgt, gTop).normalize(); gBot.copy(gTop).addScaledVector(d, .19 * s); reach('upperarm_r', 'lowerarm_r', 'hand_r', gBot, POLE_R); }
      stick.position.copy(tgt); by.subVectors(gTop, tgt).normalize(); fw.set(0, 0, 1).addScaledVector(by, -by.z).normalize(); bx.copy(fw); bz.crossVectors(bx, by).normalize();
      bm.makeBasis(bx, by, bz); stick.quaternion.setFromRotationMatrix(bm); stick.scale.setScalar(s); } : null });

  return { parts, stick, stance, mats,
    setPrints(p = {}) { prints = { ...prints, ...p }; jerTex.userData.draw(jerTex.userData.canvas.getContext('2d'), 1024, 768); jerTex.needsUpdate = true; },
    dispose() { mats.forEach((m) => { m.map && m.map.dispose(); m.dispose(); }); } };
}

/* building blocks for the next sports (football pads, soccer shin guards, baseball helmets...) */
export const gearKit = { tube, autoSkin, rigOf, batch, makeStance, canvasTex };
