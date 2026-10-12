/* Cruz Field: football stadium past the Forum Shops apse. Glass doors + tunnel from the Forum, full 100-yard field
   (yard lines, numbers, hash marks, purple/gold end zones with the original M monogram and CRUZ wordmark), goalposts,
   benches, coolers, training props (cones, ladder, sled, tires, nets), tiered stands with an instanced crowd, light towers
   and a jumbotron that shows Cruz live. Built lazily, drawn only when you are near (or in the overview). Original art only. */
import { drawM } from './characters/football-cruz/cruz.js';
export const STAD = { door: 60.4, tz1: 77, fx: 24.4, z0: 80.15, z1: 189.85, gx: 31, gz0: 76.5, gz1: 197, cz: 135 };
const YD = .9144;
export function inStadium(x, z) { return (z > 60.3 && z < STAD.tz1 + 1 && Math.abs(x) < 2.7) || (z >= STAD.gz0 && z < STAD.gz1 + 2 && Math.abs(x) < STAD.gx + 1); }
export function createStadium(ctx) { const { THREE, scene, P, mobile } = ctx; const root = new THREE.Group(); root.visible = false; scene.add(root); let built = false; const anim = [];
  const M = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .7, metalness: 0 }, o)); const PUR = 0x4a1478, GLD = 0xf2b51c;
  const add = (geo, mat, x, y, z, ry = 0, par = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; par.add(m); return m; };
  const tex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const api = { root, targets: [], spots: {}, get built() { return built; } };
  let jumboRT = null, jumboCam = null;
  function build() { built = true; const { door, tz1, fx, z0, z1, gx, gz0, gz1, cz } = STAD;
    /* glass doors at the Forum apse + tunnel */
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: .16, roughness: .05, metalness: .2, side: THREE.DoubleSide }), gold = M({ color: 0xc9a056, metalness: 1, roughness: .3 });
    for (const s of [-1, 1]) { add(new THREE.PlaneGeometry(1.3, 3.2), glass, s * 2.05, 1.6, door); add(new THREE.BoxGeometry(.08, 3.3, .1), gold, s * 2.7, 1.65, door); add(new THREE.BoxGeometry(.08, 3.3, .1), gold, s * 1.4, 1.65, door); }
    add(new THREE.BoxGeometry(5.5, .12, .14), gold, 0, 3.3, door); add(new THREE.PlaneGeometry(5.4, 1.2), glass, 0, 3.95, door);
    const ts = tex(1024, 160, (g, w, h) => { g.fillStyle = '#14061e'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#f2b51c'; g.shadowBlur = 26; g.fillStyle = '#ffd34a'; g.font = '900 92px Impact,Arial Black,sans-serif'; g.fillText('CRUZ FIELD  ›', w / 2 + 40, h / 2); g.shadowBlur = 0; drawM(g, 90, h / 2, 50); });
    add(new THREE.PlaneGeometry(5.2, .8), new THREE.MeshBasicMaterial({ map: ts, toneMapped: false }), 0, 4.95, door - .05, Math.PI);
    { const ow = M({ color: 0xb8a888, roughness: .7 }); for (const s of [-1, 1]) add(new THREE.BoxGeometry(30, 14, .6), ow, s * 18, 7, door + .9); add(new THREE.BoxGeometry(6.2, 9.4, .6), ow, 0, 9.3, door + .9); }
    const tw = M({ color: 0x2a1a3a, roughness: .5 }), tl = (tz1 - door);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(.3, 4.6, tl), tw, s * 2.95, 2.3, door + tl / 2); add(new THREE.BoxGeometry(6.2, .3, tl), tw, 0, 4.6, door + tl / 2);
    add(new THREE.PlaneGeometry(5.6, tl), M({ color: 0x3a2a4a, roughness: .9 }), 0, .01, door + tl / 2).rotation.x = -Math.PI / 2;
    for (let z = door + 2; z < tz1; z += 3) { const l = add(new THREE.BoxGeometry(4, .06, .3), new THREE.MeshBasicMaterial({ color: 0xffe9b0 }), 0, 4.43, z); }
    { const st = tex(512, 1024, (g, w, h) => { g.fillStyle = '#4a1478'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f2b51c' : '#ffffff'; g.fillRect(0, i * 170 + 40, w, 10); } g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 2); g.fillStyle = '#f2b51c'; g.font = '900 150px Impact,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CRUZ', 0, 0); g.restore(); });
      for (const s of [-1, 1]) add(new THREE.PlaneGeometry(tl, 4.2), new THREE.MeshBasicMaterial({ map: st }), s * 2.79, 2.2, door + tl / 2, -s * Math.PI / 2); }
    /* turf + field markings (one canvas) */
    const FW = 60, FL = gz1 - gz0; const PX = 14; /* px per metre */
    const turf = tex(Math.round(FW * PX / 2), Math.round(FL * PX / 2), (g, w, h) => { const k = PX / 2, X = (x) => (x + FW / 2) * k, Z = (z) => (z - gz0) * k;
      g.fillStyle = '#1e5a22'; g.fillRect(0, 0, w, h); for (let yd = 0; yd < 100; yd += 5) { g.fillStyle = (yd / 5) % 2 ? '#1f6424' : '#26702a'; g.fillRect(X(-fx), Z(z0 + 10 * YD + yd * YD), 2 * fx * k, 5 * YD * k); }
      for (const [za, zb, c1, c2, flip] of [[z0, z0 + 10 * YD, '#4a1478', '#f2b51c', 0], [z1 - 10 * YD, z1, '#f2b51c', '#4a1478', 1]]) { g.fillStyle = c1; g.fillRect(X(-fx), Z(za), 2 * fx * k, (zb - za) * k);
        g.save(); g.translate(X(0), Z((za + zb) / 2)); g.rotate(flip ? Math.PI : 0); g.fillStyle = c2; g.font = `900 ${Math.round(6.5 * k)}px Impact,Arial Black,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = k * .4; g.strokeStyle = '#fff'; g.strokeText('C R U Z', 0, 0); g.fillText('C R U Z', 0, 0); drawM(g, -fx * k * .72, 0, 2.6 * k, c2, '#fff', c1); drawM(g, fx * k * .72, 0, 2.6 * k, c2, '#fff', c1); g.restore(); }
      g.strokeStyle = '#fff'; g.lineWidth = Math.max(2, .12 * k); g.strokeRect(X(-fx), Z(z0), 2 * fx * k, (z1 - z0) * k);
      for (let yd = 0; yd <= 100; yd += 5) { const z = Z(z0 + (10 + yd) * YD); g.lineWidth = Math.max(2, .1 * k); g.beginPath(); g.moveTo(X(-fx), z); g.lineTo(X(fx), z); g.stroke(); }
      for (let yd = 1; yd < 100; yd++) { if (yd % 5 === 0) continue; const z = Z(z0 + (10 + yd) * YD); for (const xx of [-fx + .2, -3.08, 3.08 - .6, fx - .8]) { g.fillStyle = '#fff'; g.fillRect(X(xx), z - 1, .6 * k, 2); } }
      g.font = `700 ${Math.round(1.8 * k)}px Georgia,serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
      for (let yd = 10; yd < 100; yd += 10) { const n = yd <= 50 ? yd : 100 - yd, z = Z(z0 + (10 + yd) * YD); for (const s of [-1, 1]) { g.save(); g.translate(X(s * (fx - 8 * YD)), z); g.rotate(s * Math.PI / 2); g.fillText(String(n).split('').join(' '), 0, 0); g.restore(); } }
      g.save(); g.translate(X(0), Z(cz)); g.beginPath(); g.arc(0, 0, 5 * k, 0, 7); g.fillStyle = 'rgba(74,20,120,.9)'; g.fill(); drawM(g, 0, 0, 3 * k); g.restore();
      g.fillStyle = 'rgba(255,255,255,.9)'; for (const s of [-1, 1]) g.fillRect(X(s * (fx + 1.8)) - 1, Z(z0 + 10 * YD), 2, 100 * YD * k); });
    const fl = add(new THREE.PlaneGeometry(FW, FL), M({ map: turf, roughness: .95 }), 0, .005, (gz0 + gz1) / 2); fl.rotation.x = -Math.PI / 2;
    /* goalposts */
    const yel = M({ color: 0xffd21a, roughness: .4 });
    for (const [z, s] of [[z0, -1], [z1, 1]]) { add(new THREE.CylinderGeometry(.12, .12, 3.05, 10), yel, 0, 1.52, z + s * .9); add(new THREE.BoxGeometry(.2, .2, .9), yel, 0, 3.05, z + s * .45); add(new THREE.CylinderGeometry(.08, .08, 5.64, 10), yel, 0, 3.05, z).rotation.z = Math.PI / 2;
      for (const x of [-2.82, 2.82]) add(new THREE.CylinderGeometry(.06, .06, 9, 8), yel, x, 7.5, z); }
    /* sidelines: benches, coolers, training props */
    const bench = M({ color: 0x5a3a8a, roughness: .5 }), cooler = M({ color: 0xf28a1c, roughness: .4 }), wht = M({ color: 0xf0f0f0 });
    for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) { add(new THREE.BoxGeometry(.5, .45, 6), bench, s * 28.6, .23, cz - 12 + i * 7); add(new THREE.BoxGeometry(.1, .5, 6), bench, s * 28.9, .7, cz - 12 + i * 7); }
      for (let i = 0; i < 3; i++) { add(new THREE.CylinderGeometry(.28, .28, .55, 16), cooler, s * 27.6, .28, cz - 15 + i * 1.2); add(new THREE.CylinderGeometry(.3, .3, .06, 16), wht, s * 27.6, .58, cz - 15 + i * 1.2); } }
    const coneM = M({ color: 0xff6a10, roughness: .5 }); const cones = []; for (let i = 0; i < 6; i++) { const x = -12 + (i % 2 ? .9 : -.9), z = 96 + i * 3.2; add(new THREE.ConeGeometry(.16, .4, 12), coneM, x, .2, z); cones.push([x, z]); } api.spots.cones = cones;
    { const lad = M({ color: 0xffd21a }); const lx = 12, lz = 96; for (let i = 0; i <= 12; i++) add(new THREE.BoxGeometry(.7, .02, .04), lad, lx, .02, lz + i * .5); for (const s of [-1, 1]) add(new THREE.BoxGeometry(.03, .02, 6), lad, lx + s * .35, .02, lz + 3); api.spots.ladder = [lx, lz, lz + 6]; }
    { const tire = M({ color: 0x1a1a1a, roughness: .9 }); const tz = []; for (let i = 0; i < 8; i++) { const x = -5 + (i % 2) * 1, z = 140 + Math.floor(i / 2) * 1.1; const t = add(new THREE.TorusGeometry(.38, .13, 8, 18), tire, x, .13, z); t.rotation.x = Math.PI / 2; tz.push([x, z]); } api.spots.tires = tz; }
    { const sled = new THREE.Group(); sled.position.set(8, 0, 150); root.add(sled); add(new THREE.BoxGeometry(3, .1, 1.6), M({ color: 0x333 }), 0, .05, 0, 0, sled); for (const x of [-.8, .8]) add(new THREE.BoxGeometry(.9, 1.1, .5), M({ color: PUR }), x, 1.0, .5, 0, sled); add(new THREE.BoxGeometry(2.6, .08, .08), M({ color: 0x888, metalness: .8 }), 0, .6, -.3, 0, sled); api.spots.sled = [8, 148.6]; }
    { const netM = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .5 }), frm = M({ color: GLD }); for (const [x, z] of [[-9, 128], [0, 134], [9, 128]]) { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g); add(new THREE.PlaneGeometry(1.6, 1.6, 6, 6), netM, 0, 1.6, 0, 0, g);
      add(new THREE.TorusGeometry(.45, .04, 6, 20), frm, 0, 1.6, -.02, 0, g); for (const s of [-1, 1]) add(new THREE.CylinderGeometry(.03, .03, 2.4, 6), frm, s * .8, 1.2, 0, 0, g); api.targets.push([x, 1.6, z]); } }
    { const ballM = M({ color: 0x7a3a1a, roughness: .55 }); for (let i = 0; i < 5; i++) { const b = add(new THREE.SphereGeometry(.11, 12, 8), ballM, 2 + i * .3, .07, 104 + (i % 2) * .3); b.scale.set(1, .62, .62); b.rotation.y = i; } }
    api.spots.qb = [0, 108]; api.spots.sprint = [[-18, 92], [-18, 172]];
    /* stands: stepped tiers + instanced crowd */
    const seatM = M({ color: 0x2a1238, roughness: .6 }), concM = M({ color: 0x6a6070, roughness: .9 }); const crowd = []; const rows = mobile ? 12 : 18;
    const tier = (cx, czz, len, rot, nRows) => { const g = new THREE.Group(); g.position.set(cx, 0, czz); g.rotation.y = rot; root.add(g);
      add(new THREE.BoxGeometry(len, 1.2, .3), M({ color: PUR }), 0, .6, -.15, 0, g);
      for (let r = 0; r < nRows; r++) { add(new THREE.BoxGeometry(len, .55, 1.0), r % 2 ? seatM : concM, 0, 1.2 + r * .55 - .27, .5 + r * 1.0, 0, g);
        for (let x = -len / 2 + .4; x < len / 2 - .3; x += mobile ? 1.1 : .75) if (Math.random() < .82) crowd.push({ g, x: x + (Math.random() - .5) * .15, y: 1.2 + r * .55, z: .45 + r * 1.0 }); }
      add(new THREE.BoxGeometry(len, 3, .4), concM, 0, 1.2 + nRows * .55 + 1.2, nRows * 1.0 + .3, 0, g); return g; };
    tier(-(gx + .2), cz, gz1 - gz0 - 8, Math.PI / 2, rows); tier(gx + .2, cz, gz1 - gz0 - 8, -Math.PI / 2, rows); tier(0, gz1 + .2, 2 * gx - 4, Math.PI, rows);
    for (const s of [-1, 1]) tier(s * 17, gz0 - .2, 26, 0, Math.round(rows * .6));
    { const body = new THREE.CapsuleGeometry(.2, .35, 3, 6); body.translate(0, .45, 0); const head = new THREE.SphereGeometry(.13, 8, 6); head.translate(0, .95, 0);
      const mat = new THREE.MeshLambertMaterial(); const ib = new THREE.InstancedMesh(body, mat, crowd.length), ih = new THREE.InstancedMesh(head, mat, crowd.length); const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), c = new THREE.Color();
      const tops = [0x4a1478, 0xf2b51c, 0x5a1a8a, 0xffffff, 0xf2b51c, 0x4a1478, 0x222222, 0xc83a3a], skins = [0xf0c8a0, 0xc89a70, 0x8a5a3a, 0x5a3a24];
      crowd.forEach((p, i) => { p.g.updateMatrixWorld(true); v.set(p.x, p.y, p.z).applyMatrix4(p.g.matrixWorld); m4.makeTranslation(v.x, v.y, v.z); ib.setMatrixAt(i, m4); ih.setMatrixAt(i, m4); ib.setColorAt(i, c.setHex(tops[i % 8 === 0 ? 6 : Math.floor(Math.random() * tops.length)])); ih.setColorAt(i, c.setHex(skins[Math.floor(Math.random() * 4)])); });
      root.add(ib, ih); const base = crowd.map((p, i) => { ib.getMatrixAt(i, m4); return new THREE.Vector3().setFromMatrixPosition(m4); });
      anim.push((t) => { if ((Math.floor(t * 10) % 3)) return; for (let i = 0; i < crowd.length; i += 1) { const b = base[i], j = Math.max(0, Math.sin(t * 6 + b.x * .3 + b.z * .2)) * .12 * (Math.sin(t * .4 + b.z * .05) > .3 ? 1 : .2); m4.makeTranslation(b.x, b.y + j, b.z); ib.setMatrixAt(i, m4); ih.setMatrixAt(i, m4); } ib.instanceMatrix.needsUpdate = ih.instanceMatrix.needsUpdate = true; }); }
    /* light towers */
    const pole = M({ color: 0x8a8a90, metalness: .6, roughness: .4 }), lamp = new THREE.MeshBasicMaterial({ color: 0xfffbe8 });
    for (const [x, z] of [[-48, 82], [48, 82], [-48, 188], [48, 188]]) { add(new THREE.CylinderGeometry(.5, .8, 34, 10), pole, x, 17, z); const pan = add(new THREE.BoxGeometry(7, 4, .5), M({ color: 0x333 }), x * .98, 34, z, Math.atan2(-x, -(z - cz)));
      for (let i = 0; i < 12; i++) { const l = new THREE.Mesh(new THREE.CircleGeometry(.35, 10), lamp); l.position.set(-2.6 + (i % 6) * 1.05, -1 + Math.floor(i / 6) * 1.7, .26); pan.add(l); } }
    root.add(new THREE.HemisphereLight(0xe8f0ff, 0x2a4a2a, .45)); const sun = new THREE.DirectionalLight(0xfff6e0, 1.1); sun.position.set(30, 60, 100); sun.target.position.set(0, 0, cz); root.add(sun, sun.target);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(260, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, map: tex(32, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05030e'); gr.addColorStop(.7, '#1a1040'); gr.addColorStop(1, '#4a2a6a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) })); sky.position.set(0, 0, cz); root.add(sky);
    /* jumbotron: live camera on Cruz */
    jumboRT = new THREE.WebGLRenderTarget(mobile ? 256 : 384, mobile ? 144 : 216); jumboCam = new THREE.PerspectiveCamera(28, 16 / 9, .2, 200);
    const jg = new THREE.Group(); jg.position.set(0, 21, gz1 + 14); jg.rotation.y = Math.PI; root.add(jg); add(new THREE.BoxGeometry(26, 16.5, 1), M({ color: 0x111 }), 0, 0, -.6, 0, jg);
    add(new THREE.PlaneGeometry(24, 13.5), new THREE.MeshBasicMaterial({ map: jumboRT.texture, toneMapped: false }), 0, .5, 0, 0, jg);
    const jt = tex(1024, 96, (g, w, h) => { g.fillStyle = '#14061e'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd34a'; g.font = '900 64px Impact,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CRUZ CAM  ·  #12  QB', w / 2, h / 2); });
    add(new THREE.PlaneGeometry(24, 2.2), new THREE.MeshBasicMaterial({ map: jt, toneMapped: false }), 0, -7.6, .05, 0, jg);
    add(new THREE.CylinderGeometry(.6, .6, 14, 8), pole, -8, -14, -1, 0, jg); add(new THREE.CylinderGeometry(.6, .6, 14, 8), pole, 8, -14, -1, 0, jg); }
  let jf = 0;
  api.update = (dt, t, over, R, cruzPos) => { const near = P.z > 34 || over; if (near && !built) build(); root.visible = built && (near); if (!root.visible) return; anim.forEach((f) => f(t, dt));
    if (R && jumboRT && cruzPos && (jf++ % (mobile ? 6 : 3) === 0)) { jumboCam.position.set(cruzPos.x + 4, 2.6, cruzPos.z - 6); jumboCam.lookAt(cruzPos.x, 1.2, cruzPos.z); const prev = R.getRenderTarget(); R.setRenderTarget(jumboRT); R.render(scene, jumboCam); R.setRenderTarget(prev); } };
  api.buildNow = () => { if (!built) build(); };
  api.collide = (nx, nz, RAD) => { if (!inStadium(nx, nz)) return null; const { door, tz1, gx, gz0, gz1 } = STAD;
    if (nz < gz0 + RAD) { nx = Math.max(-2.65 + RAD, Math.min(2.65 - RAD, nx)); if (nz < door + .1 && Math.abs(nx) > 1.3) nx = Math.sign(nx) * 1.3; return [nx, nz]; }
    nx = Math.max(-gx + RAD, Math.min(gx - RAD, nx)); nz = Math.min(gz1 - RAD, nz); if (nz < gz0 + RAD && Math.abs(nx) > 2.65 - RAD) nz = gz0 + RAD; return [nx, nz]; };
  return api; }
