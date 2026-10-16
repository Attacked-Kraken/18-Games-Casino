/* Ice rink floor at the real sizes from venues/rink.md: ice with every marking, boards with a kick plate, glass,
   goals with nets, team benches and penalty boxes. Original, built in code. About 6 draw calls.
     import { buildRink } from './venues/kit/rink.js';
     const rink = buildRink(THREE, { unit: 3.26, home: 0x1f6fd6, away: 0x0e7c7b });  scene.add(rink.group);  rink.report()
   Metres: 60.96 x 25.9, corner radius 8.53. Ice centre = (0,0,0); the length runs along x. */
import { stadiumKit } from './stadium.js';

export const RINK = { L: 60.96, W: 25.9, R: 8.53, goalLine: 3.35, blueFromEnd: 22.86, circleR: 4.57, dotX: 6.1, dotZ: 6.71, crease: 1.83, goalW: 1.83, goalH: 1.22, boards: 1.07 };

export function buildRink(THREE, o = {}) {
  const K = RINK, a = K.L / 2, b = K.W / 2, unit = o.unit ?? 1, group = new THREE.Group(); group.name = 'rink'; group.scale.setScalar(unit);
  const gx = a - K.goalLine, bx = a - K.blueFromEnd, fx = gx - K.dotX;   // goal line, blue line centre, end-zone dots (x)
  const R = { size: [K.L, K.W], goalLines: 2, blueLines: 2, redLines: 1, faceoffSpots: 9, creases: 2, goals: 2, benches: 2, penaltyBoxes: 2, glass: true };

  /* ---- ice + markings (one texture, drawn in metres) ---- */
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const g = c.getContext('2d');
  const sx = c.width / K.L, sz = c.height / K.W;
  g.fillStyle = '#f4f8fb'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 900; i++) { g.strokeStyle = `rgba(150,170,190,${.05 + Math.random() * .07})`; g.lineWidth = 1; g.beginPath(); const x = Math.random() * c.width, y = Math.random() * c.height, l = 20 + Math.random() * 90, an = Math.random() * Math.PI; g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); }   // skate scratches
  g.save(); g.translate(c.width / 2, c.height / 2); g.scale(sx, sz);
  const RED = '#c8102e', BLUE = '#0b3d91', CREASE = '#7fb7e6';
  const bar = (x, w, col) => { g.fillStyle = col; g.fillRect(x - w / 2, -b, w, K.W); };
  bar(0, .3, RED); for (const s of [-1, 1]) { bar(s * bx, .3, BLUE); bar(s * gx, .1, RED); }   // thin lines drawn at 10 cm so they read on a phone (real: 5 cm)
  // centre circle + dot, the 4 neutral-zone dots, the 4 end-zone circles with hash marks
  const circle = (x, z, r, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, z, r, 0, Math.PI * 2); g.stroke(); };
  const dot = (x, z, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, z, r, 0, Math.PI * 2); g.fill(); };
  circle(0, 0, K.circleR, BLUE, .1); dot(0, 0, .15, BLUE);
  for (const s of [-1, 1]) for (const t of [-1, 1]) {
    dot(s * (bx - 1.52), t * K.dotZ, .3, RED);
    const cx = s * fx, cz = t * K.dotZ; circle(cx, cz, K.circleR, RED, .1); dot(cx, cz, .3, RED);
    g.fillStyle = RED; for (const hx of [-.9, .9]) for (const hz of [-1, 1]) g.fillRect(cx + hx - .025, cz + hz * K.circleR - (hz > 0 ? 0 : .61), .05, .61);   // hash marks
    for (const hx of [-1, 1]) for (const hz of [-1, 1]) { g.fillRect(cx + hx * .45 - (hx > 0 ? 0 : 1.22), cz + hz * .45, 1.22, .05); g.fillRect(cx + hx * .45 - .025, cz + hz * .45 - (hz > 0 ? 0 : .91), .05, .91); }   // L marks
  }
  // goal creases (light blue half circles outlined red) + trapezoids behind the nets + referee's crease
  for (const s of [-1, 1]) { g.fillStyle = CREASE; g.beginPath(); g.moveTo(s * gx, -K.crease); g.arc(s * gx, 0, K.crease, -Math.PI / 2, Math.PI / 2, s > 0); g.closePath(); g.fill(); g.strokeStyle = RED; g.lineWidth = .1; g.stroke();
    g.beginPath(); g.moveTo(s * gx, -3.35); g.lineTo(s * a, -4.27); g.moveTo(s * gx, 3.35); g.lineTo(s * a, 4.27); g.stroke(); }
  g.strokeStyle = RED; g.lineWidth = .05; g.beginPath(); g.arc(0, b, 3.05, Math.PI, 0); g.stroke();
  // centre-ice logo: our own (APEX ARCADE)
  g.save(); g.scale(1 / sx * 40, 1 / sz * 40); g.globalAlpha = .55; g.fillStyle = BLUE; g.font = '900 3px system-ui, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('APEX', 0, -1.4); g.fillText('ARCADE', 0, 1.6); g.restore();
  g.restore();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const { pts } = stadiumKit.outline(a, b, K.R, .8);
  const shape = new THREE.Shape(); pts.forEach((p, i) => (i ? shape.lineTo(p.x, -p.z) : shape.moveTo(p.x, -p.z)));
  const ig = new THREE.ShapeGeometry(shape, 24); ig.rotateX(-Math.PI / 2);
  { const P = ig.attributes.position, uv = ig.attributes.uv; for (let i = 0; i < P.count; i++) uv.setXY(i, P.getX(i) / K.L + .5, 1 - (P.getZ(i) / K.W + .5)); }
  tex.flipY = true;
  const ice = new THREE.Mesh(ig, new THREE.MeshStandardMaterial({ map: tex, roughness: .14, metalness: .02 })); ice.receiveShadow = true; ice.name = 'ice'; group.add(ice);

  /* ---- boards (white, yellow kick plate, rounded top) + glass ---- */
  { const pos = [], col = [], W = new THREE.Color(0xf2f3f0), Yk = new THREE.Color(0xe8c22a), T = new THREE.Color(0xd8dbe0), n = pts.length, th = .18;
    const quad = (A, B, Cc, D, cc) => { pos.push(...A, ...B, ...Cc, ...A, ...Cc, ...D); for (let i = 0; i < 6; i++) col.push(cc.r, cc.g, cc.b); };
    for (let k = 0; k < n; k++) { const p = pts[k], q = pts[(k + 1) % n], P0 = (pp, d, y) => [pp.x + pp.nx * d, y, pp.z + pp.nz * d];
      quad(P0(p, 0, 0), P0(q, 0, 0), P0(q, 0, .25), P0(p, 0, .25), Yk); quad(P0(p, 0, .25), P0(q, 0, .25), P0(q, 0, K.boards), P0(p, 0, K.boards), W);
      quad(P0(p, 0, K.boards), P0(q, 0, K.boards), P0(q, th, K.boards), P0(p, th, K.boards), T); quad(P0(p, th, K.boards), P0(q, th, K.boards), P0(q, th, 0), P0(p, th, 0), W); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); bg.computeVertexNormals();
    group.add(Object.assign(new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, side: THREE.DoubleSide })), { name: 'boards' }));
    const gp = []; for (let k = 0; k < n; k++) { const p = pts[k], q = pts[(k + 1) % n], hp = Math.abs(p.x) > a - K.R ? 2.4 : 1.8, hq = Math.abs(q.x) > a - K.R ? 2.4 : 1.8, d = th * .5;
      gp.push(p.x + p.nx * d, K.boards, p.z + p.nz * d, q.x + q.nx * d, K.boards, q.z + q.nz * d, q.x + q.nx * d, K.boards + hq, q.z + q.nz * d, p.x + p.nx * d, K.boards, p.z + p.nz * d, q.x + q.nx * d, K.boards + hq, q.z + q.nz * d, p.x + p.nx * d, K.boards + hp, p.z + p.nz * d); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.computeVertexNormals();
    group.add(Object.assign(new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0xcfe8f5, transparent: true, opacity: .16, roughness: .05, metalness: .1, side: THREE.DoubleSide, depthWrite: false })), { name: 'glass' })); }

  /* ---- goals: red posts + crossbar, white net with depth ---- */
  { const red = [], net = []; const cyl = (r, h, x, y, z, rx = 0, rz = 0) => { const q = new THREE.CylinderGeometry(r, r, h, 8); q.rotateX(rx); q.rotateZ(rz); q.translate(x, y, z); return q; };
    for (const s of [-1, 1]) { const x = s * gx, w = K.goalW / 2;
      red.push(cyl(.03, K.goalH, x, K.goalH / 2, -w), cyl(.03, K.goalH, x, K.goalH / 2, w), cyl(.03, K.goalW, x, K.goalH, 0, Math.PI / 2));
      const ng = new THREE.BoxGeometry(1.0, K.goalH, K.goalW); ng.translate(x + s * .5, K.goalH / 2, 0); net.push(ng); }
    group.add(Object.assign(new THREE.Mesh(merge(THREE, red), new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: .35, metalness: .3 })), { name: 'goal-frames' }));
    group.add(Object.assign(new THREE.Mesh(merge(THREE, net), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .35, wireframe: true })), { name: 'goal-nets' })); }

  /* ---- benches (2 teams, one side) + penalty boxes and the scorer's box (the other side) ---- */
  { const pcs = [], cols = []; const bx2 = (w, h, d, x, y, z) => { const q = new THREE.BoxGeometry(w, h, d); q.translate(x, y, z); return q; };
    const home = new THREE.Color(o.home ?? 0x1f6fd6), away = new THREE.Color(o.away ?? 0xd8343c), dark = new THREE.Color(0x22262e);
    for (const [x, cc] of [[-7, home], [7, away]]) { pcs.push(bx2(10, .5, 1.6, x, .45, b + 1.4)); cols.push(cc); pcs.push(bx2(10, .9, .25, x, .45, b + 2.3)); cols.push(dark); }
    for (const [x, cc] of [[-3.5, home], [3.5, away], [0, dark]]) { pcs.push(bx2(x === 0 ? 3 : 3.5, .5, 1.6, x, .45, -b - 1.4)); cols.push(cc); }
    const colored = pcs.map((q, i) => { const n = q.index ? q.toNonIndexed() : q, A = new Float32Array(n.attributes.position.count * 3); for (let k = 0; k < A.length; k += 3) { A[k] = cols[i].r; A[k + 1] = cols[i].g; A[k + 2] = cols[i].b; } n.setAttribute('color', new THREE.BufferAttribute(A, 3)); return n; });
    group.add(Object.assign(new THREE.Mesh(merge(THREE, colored, true), new THREE.MeshLambertMaterial({ vertexColors: true })), { name: 'benches' })); }

  return { group, report: () => ({ ...R, units: unit }), dims: K };
}

function merge(THREE, list, withColor) { const parts = list.map((g) => (g.index ? g.toNonIndexed() : g)), out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal'].concat(withColor ? ['color'] : [])) { const tot = parts.reduce((s, g) => s + g.attributes[k].array.length, 0), A = new Float32Array(tot); let o = 0; parts.forEach((g) => { A.set(g.attributes[k].array, o); o += g.attributes[k].array.length; }); out.setAttribute(k, new THREE.BufferAttribute(A, 3)); }
  return out; }
