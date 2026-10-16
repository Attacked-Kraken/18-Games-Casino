/* Stadium kit - a real seating bowl around any sports floor, with a packed, moving crowd. Shared by every sports game.
   Original, built in code (no outside models, no outside internet). Phone budget: about 10 draw calls for 15,000+ fans.

     import { buildStadium } from './venues/kit/stadium.js';
     const st = buildStadium(THREE, { floor: { a: 30.5, b: 13, r: 8.5 }, setback: 2.4, preset: 'arena',
                                      home: 0x1f6fd6, away: 0x0e7c7b, unit: 3.26 });
     scene.add(st.group);
     every frame: st.update(dt);       a goal: st.crowd.excite(1);       tests: st.report()

   floor = the playing area as a rounded rectangle, in METRES: a = half length (x), b = half width (z), r = corner radius
   (r = b gives a running-track oval). Spec sheets with the real sizes: venues/*.md.
   preset: 'arena' (closed roof, centre-hung scoreboard, ring lights - hockey/basketball), 'stadium' (roof canopy over
   the stands, open middle, 2 end screens - soccer/football/track/monster trucks), 'ballpark' (stands wrap home plate,
   light towers, centre-field board), 'grandstand' (one long covered stand - racing). Every option can be overridden. */

const TAU = Math.PI * 2;
const PRESETS = {
  arena:      { tiers: [{ rows: 22, depth: .85, rise: .42 }, { rows: 16, depth: .8, rise: .55, gap: 3.2, lift: 3.4 }], roof: 'closed', lights: 'ring', board: 'center-hung', arc: null, fill: .9, height: 28 },
  stadium:    { tiers: [{ rows: 26, depth: .8, rise: .4 }, { rows: 22, depth: .8, rise: .52, gap: 3.5, lift: 4 }], roof: 'canopy', lights: 'canopy', board: 'ends', arc: null, fill: .92, height: 0 },
  ballpark:   { tiers: [{ rows: 24, depth: .85, rise: .4 }, { rows: 18, depth: .8, rise: .55, gap: 3.5, lift: 4 }], roof: 'none', lights: 'towers', board: 'outfield', arc: [.58, 1.12], fill: .88, height: 0 },
  grandstand: { tiers: [{ rows: 28, depth: .8, rise: .5 }], roof: 'canopy', lights: 'none', board: 'ends', arc: [.06, .44], fill: .9, height: 0 },
};

/* ---------- the floor outline: a rounded rectangle sampled with outward normals ---------- */
function outline(a, b, r, step = 2.2) {
  r = Math.min(r, a, b); const pts = [], ca = a - r, cb = b - r;
  const line = (x0, z0, x1, z1, nx, nz) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / step)); for (let i = 0; i < n; i++) { const t = i / n; pts.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, nx, nz }); } };
  const arc = (cx, cz, a0) => { const n = Math.max(2, Math.round(r * Math.PI / 2 / step * 1.4 + 3)); for (let i = 0; i < n; i++) { const t = a0 + (i / n) * Math.PI / 2; pts.push({ x: cx + Math.cos(t) * r, z: cz + Math.sin(t) * r, nx: Math.cos(t), nz: Math.sin(t) }); } };
  if (cb > 0) line(a, -cb, a, cb, 1, 0); arc(ca, cb, 0);
  if (ca > 0) line(ca, b, -ca, b, 0, 1); arc(-ca, cb, Math.PI / 2);
  if (cb > 0) line(-a, cb, -a, -cb, -1, 0); arc(-ca, -cb, Math.PI);
  if (ca > 0) line(-ca, -b, ca, -b, 0, -1); arc(ca, -cb, Math.PI * 1.5);
  // arc length of each sample (on the floor line) so stands can cover part of the outline
  let s = 0; for (let i = 0; i < pts.length; i++) { pts[i].s = s; const q = pts[(i + 1) % pts.length]; s += Math.hypot(q.x - pts[i].x, q.z - pts[i].z); }
  pts.forEach((p) => (p.f = p.s / s)); return { pts, len: s }; }

/* ---------- textures drawn in code ---------- */
function canvasTex(THREE, w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.redraw = (fn) => { fn(g, w, h); t.needsUpdate = true; }; return t; }
const hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');

/* fan sprites: 4 looks x (sitting / cheering with arms up). Shirt pixels are painted (s, 0, s) so the shader can swap in
   each fan's own shirt colour (s = shading). */
function fanAtlas(THREE) {
  const SK = ['#f0c8a0', '#c89064', '#8d5a36', '#5a3a22'], HR = ['#2a1a10', '#5a3a1a', '#c8a050', '#141414'];
  return canvasTex(THREE, 512, 128, (g) => {
    for (let k = 0; k < 8; k++) { const v = k % 4, up = k >= 4, x0 = k * 64, cx = x0 + 32;
      const shirt = (s) => `rgb(${s},0,${s})`;
      // arms
      g.fillStyle = shirt(150);
      if (up) { g.save(); g.translate(cx - 15, 62); g.rotate(-2.6); g.fillRect(-4, 0, 8, 30); g.restore(); g.save(); g.translate(cx + 15, 62); g.rotate(2.6); g.fillRect(-4, 0, 8, 30); g.restore();
        g.fillStyle = SK[v]; g.beginPath(); g.arc(cx - 26, 36, 5, 0, TAU); g.arc(cx + 26, 36, 5, 0, TAU); g.fill(); }
      else { g.fillRect(cx - 21, 62, 7, 34); g.fillRect(cx + 14, 62, 7, 34); }
      // torso (lit from the top-left: lighter at the top)
      const gr = g.createLinearGradient(0, 58, 0, 112); gr.addColorStop(0, shirt(235)); gr.addColorStop(1, shirt(120)); g.fillStyle = gr;
      g.beginPath(); g.moveTo(cx - 16, 60); g.quadraticCurveTo(cx, 54, cx + 16, 60); g.lineTo(cx + 18, 112); g.lineTo(cx - 18, 112); g.closePath(); g.fill();
      g.fillStyle = '#1e2430'; g.fillRect(cx - 17, 112, 34, 16);                          // legs / seat edge
      // neck + head
      g.fillStyle = SK[v]; g.fillRect(cx - 4, 50, 8, 8); g.beginPath(); g.ellipse(cx, 40, 11, 13, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(cx + 3, 42, 8, 11, 0, 0, TAU); g.fill();
      g.fillStyle = HR[v]; g.beginPath(); g.ellipse(cx, 31, 11.5, 6.5, 0, Math.PI, TAU); g.fill(); if (v === 2) g.fillRect(cx - 12, 30, 5, 16);
      if (v === 1) { g.fillStyle = shirt(200); g.beginPath(); g.ellipse(cx, 29, 12, 5, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 2, 26, 17, 3); }   // cap
    } }); }

export function buildStadium(THREE, o = {}) {
  const P = PRESETS[o.preset || 'arena'] || PRESETS.arena, C = { ...P, ...o };
  const F = { a: 30.5, b: 13, r: 8.5, ...(o.floor || {}) }, setback = C.setback ?? 2.5, unit = C.unit ?? 1;
  const home = new THREE.Color(C.home ?? 0x1f6fd6), away = new THREE.Color(C.away ?? 0xd8343c), awayShare = C.awayShare ?? .2;
  const rnd = (() => { let x = C.seed ?? 20261016; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const group = new THREE.Group(); group.name = 'stadium'; group.scale.setScalar(unit);
  const { pts: base, len: baseLen } = outline(F.a, F.b, F.r);
  const inArc = (f) => !C.arc || (f >= C.arc[0] && f <= C.arc[1]) || (f + 1 >= C.arc[0] && f + 1 <= C.arc[1]);
  const path = C.arc ? base.filter((p) => inArc(p.f)) : base, closed = !C.arc;
  const R = { fans: 0, seats: 0, tiers: C.tiers.length, rows: 0, roof: C.roof !== 'none', scoreboard: C.board, screens: 0, lights: C.lights, tunnels: 0, capacity: 0, drawCalls: 0 };

  /* ---- the bowl: one swept concrete profile (rows, concourse, parapets, back wall, outside facade) ---- */
  const prof = [], rowsAt = []; let d = setback, h = C.frontWall ?? 1.1;
  prof.push({ d, h: 0, c: 'wall' }, { d, h, c: 'wall' });
  C.tiers.forEach((T, ti) => {
    if (ti > 0) { prof.push({ d, h, c: 'tread' }); d += T.gap ?? 3; prof.push({ d, h, c: 'tread' }); prof.push({ d, h: h + (T.lift ?? 3) + 1.1, c: 'fascia' + ti }); h += T.lift ?? 3; prof.push({ d: d + .25, h: h + 1.1, c: 'fascia' + ti }); d += .25; }
    for (let j = 0; j < T.rows; j++) { prof.push({ d, h, c: 'tread' }); rowsAt.push({ d: d + T.depth * .55, h, tier: ti, row: j }); d += T.depth; prof.push({ d, h, c: 'tread' }); h += T.rise; prof.push({ d, h, c: 'riser' }); }
    R.rows += T.rows; });
  const topD = d, topH = h; prof.push({ d: d + .3, h: h + 2.2, c: 'wall' }, { d: d + .8, h: h + 2.2, c: 'wall' }, { d: d + 1.2, h: 0, c: 'facade' });
  const concrete = new THREE.Color(0x6d7178), tread = new THREE.Color(0x585c63), riser = new THREE.Color(0x3f434a), facade = new THREE.Color(0x4a5262), fas = home.clone().multiplyScalar(.8);
  { const pos = [], col = [], n = path.length, segs = closed ? n : n - 1;
    const P3 = (p, q) => [p.x + p.nx * q.d, q.h, p.z + p.nz * q.d];
    const cOf = (q) => (q.c === 'tread' ? tread : q.c === 'riser' ? riser : q.c === 'facade' ? facade : q.c.startsWith('fascia') ? fas : concrete);
    for (let k = 0; k < segs; k++) { const p0 = path[k], p1 = path[(k + 1) % n];
      for (let j = 0; j < prof.length - 1; j++) { const q0 = prof[j], q1 = prof[j + 1], A = P3(p0, q0), B = P3(p1, q0), Cc = P3(p1, q1), D = P3(p0, q1), cc = cOf(q1);
        pos.push(...A, ...D, ...B, ...B, ...D, ...Cc); for (let t = 0; t < 6; t++) col.push(cc.r, cc.g, cc.b); } }
    if (!closed) for (const [p, sgn] of [[path[0], 1], [path[n - 1], -1]]) {   // end walls of a partial stand
      const tx = -p.nz * sgn, tz = p.nx * sgn; for (let j = 0; j < prof.length - 1; j++) { const q0 = prof[j], q1 = prof[j + 1];
        const A = [p.x + p.nx * q0.d, 0, p.z + p.nz * q0.d], B = [p.x + p.nx * q0.d, q0.h, p.z + p.nz * q0.d], Cc = [p.x + p.nx * q1.d, q1.h, p.z + p.nz * q1.d], D = [p.x + p.nx * q1.d, 0, p.z + p.nz * q1.d];
        pos.push(...A, ...B, ...Cc, ...A, ...Cc, ...D); for (let t = 0; t < 6; t++) col.push(facade.r, facade.g, facade.b); void tx; void tz; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const bowl = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); bowl.name = 'bowl'; bowl.receiveShadow = true; group.add(bowl); R.drawCalls++; }

  /* ---- LED ribbon boards on the upper-tier fascia + the front wall (our own sponsor: APEX ARCADE) ---- */
  const led = canvasTex(THREE, 1024, 64, (g, w, hh) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, hex(home.getHex())); gr.addColorStop(.5, '#0b0f18'); gr.addColorStop(1, hex(home.getHex())); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
    g.font = '900 40px system-ui, Arial, sans-serif'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; for (let x = 20; x < w; x += 340) g.fillText('APEX ARCADE', x, hh / 2 + 2); });
  led.wrapS = THREE.RepeatWrapping;
  { const pos = [], uv = [], n = path.length, segs = closed ? n : n - 1, bands = [];
    let dd = setback, hh = C.frontWall ?? 1.1; C.tiers.forEach((T, ti) => { if (ti > 0) { dd += T.gap ?? 3; bands.push({ d: dd - .02, h0: hh + .2, h1: hh + (T.lift ?? 3) + .9 }); hh += T.lift ?? 3; dd += .25; } dd += T.rows * T.depth; hh += T.rows * T.rise; });
    for (const bd of bands) { let s = 0; for (let k = 0; k < segs; k++) { const p0 = path[k], p1 = path[(k + 1) % n], L = Math.hypot((p1.x + p1.nx * bd.d) - (p0.x + p0.nx * bd.d), (p1.z + p1.nz * bd.d) - (p0.z + p0.nz * bd.d));
      const A = [p0.x + p0.nx * bd.d, bd.h0, p0.z + p0.nz * bd.d], B = [p1.x + p1.nx * bd.d, bd.h0, p1.z + p1.nz * bd.d], Cc = [p1.x + p1.nx * bd.d, bd.h1, p1.z + p1.nz * bd.d], D = [p0.x + p0.nx * bd.d, bd.h1, p0.z + p0.nz * bd.d];
      const u0 = s / 40, u1 = (s + L) / 40; pos.push(...A, ...B, ...Cc, ...A, ...Cc, ...D); uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1); s += L; } }
    if (pos.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: led, side: THREE.DoubleSide, toneMapped: false })); m.name = 'led-ribbons'; group.add(m); R.drawCalls++; } }

  /* ---- seats + fans along every row (aisles every 14 seats, tunnels into the lower bowl) ---- */
  const seatW = C.seatWidth ?? .52, aisleEvery = C.aisleEvery ?? 14, tunnelEvery = C.tunnelEvery ?? 55, fill = Math.min(1, C.fill ?? .9);
  const fans = [], empty = [], tunnels = [];
  { const n = path.length, segs = closed ? n : n - 1;
    for (const rw of rowsAt) { // walk this row's offset line, dropping a seat every seatW metres
      let acc = seatW * .5, idx = 0;
      for (let k = 0; k < segs; k++) { const p0 = path[k], p1 = path[(k + 1) % n];
        const x0 = p0.x + p0.nx * rw.d, z0 = p0.z + p0.nz * rw.d, x1 = p1.x + p1.nx * rw.d, z1 = p1.z + p1.nz * rw.d, L = Math.hypot(x1 - x0, z1 - z0);
        while (acc < L) { const t = acc / L, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, nx = p0.nx + (p1.nx - p0.nx) * t, nz = p0.nz + (p1.nz - p0.nz) * t, nl = Math.hypot(nx, nz) || 1;
          const col = idx % (aisleEvery + 2), block = Math.floor(idx / (aisleEvery + 2)); idx++; acc += seatW;
          if (col >= aisleEvery) continue;                                                                       // aisle steps
          if (rw.tier === 0 && rw.row >= C.tiers[0].rows - 7 && block % Math.max(2, Math.round(tunnelEvery / ((aisleEvery + 2) * seatW))) === 1 && col >= 4 && col < 10) { if (rw.row === C.tiers[0].rows - 7 && col === 7) tunnels.push({ x, z, nx: nx / nl, nz: nz / nl, h: rw.h }); continue; }   // tunnel mouth
          const s = { x, z, y: rw.h, ry: Math.atan2(-nx / nl, -nz / nl), fx: x / (F.a + 30), tier: rw.tier };
          R.seats++; (rnd() < fill ? fans : empty).push(s); } acc -= L; } } }
  R.tunnels = tunnels.length; R.capacity = R.seats; R.fans = fans.length;
  // empty seats (where you can see them): small instanced seat boxes in the home colour
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3();
  if (empty.length) { const sg = new THREE.BoxGeometry(.46, .42, .1); sg.translate(0, .45, -.18); const pan = new THREE.BoxGeometry(.46, .06, .4); pan.translate(0, .42, 0);
    const merged = mergeTwo(THREE, sg, pan); const im = new THREE.InstancedMesh(merged, new THREE.MeshLambertMaterial({ color: home.clone().multiplyScalar(.75) }), empty.length);
    empty.forEach((e, i) => { Q.setFromAxisAngle(Y, e.ry); M4.compose(V.set(e.x, e.y, e.z), Q, S); im.setMatrixAt(i, M4); }); im.name = 'seats'; group.add(im); R.drawCalls++; }
  // tunnel mouths: dark portals cut into the lower bowl
  if (tunnels.length) { const tg = new THREE.BoxGeometry(3.2, 2.6, 4); tg.translate(0, 1.3, 0); const im = new THREE.InstancedMesh(tg, new THREE.MeshBasicMaterial({ color: 0x07080b }), tunnels.length);
    tunnels.forEach((t, i) => { Q.setFromAxisAngle(Y, Math.atan2(-t.nx, -t.nz)); M4.compose(V.set(t.x + t.nx * 1.2, t.h - .1, t.z + t.nz * 1.2), Q, S); im.setMatrixAt(i, M4); }); im.name = 'tunnels'; group.add(im); R.drawCalls++; }

  /* ---- the crowd: ONE instanced mesh of sprites, animated on the GPU (bob, sway, stand + arms up on excite) ---- */
  const crowdU = { uTime: { value: 0 }, uExcite: { value: 0 } };
  let fansMesh = null;
  if (fans.length) {
    const fg = new THREE.PlaneGeometry(.58, 1.18); fg.translate(0, .62, .05);
    const N = fans.length, seed = new Float32Array(N), shirt = new Float32Array(N * 3), look = new Float32Array(N);
    const pal = [0xffffff, 0x1b1d22, 0x9aa3ad, 0xd8d2c4, 0x8a1a2a, 0x2a4a2a, 0xc8a050, 0x3a3a52];
    fans.forEach((f, i) => { seed[i] = rnd(); look[i] = Math.floor(rnd() * 4);
      const r = rnd(), hs = C.homeShare ?? .58, c = r < hs ? home : r < hs + awayShare * .8 ? away : new THREE.Color(pal[Math.floor(rnd() * pal.length)]);   // home colours, the away end, and fans in everyday clothes
      const k = .82 + rnd() * .3; shirt[i * 3] = c.r * k; shirt[i * 3 + 1] = c.g * k; shirt[i * 3 + 2] = c.b * k; });
    fg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1)); fg.setAttribute('aShirt', new THREE.InstancedBufferAttribute(shirt, 3)); fg.setAttribute('aLook', new THREE.InstancedBufferAttribute(look, 1));
    const mat = new THREE.MeshLambertMaterial({ map: fanAtlas(THREE), alphaTest: .5, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, crowdU);
      sh.vertexShader = 'attribute float aSeed; attribute vec3 aShirt; attribute float aLook; uniform float uTime, uExcite; varying vec3 vShirt; varying float vCheer;\nfloat apexCheer(){ return min(1.0, step(1.0 - uExcite * 1.15, fract(aSeed * 7.13)) + step(0.985, fract(aSeed * 13.7 + floor(uTime * .25) * .37))); }\n' + sh.vertexShader
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float ph = aSeed * 40.0; float cheer = apexCheer(); vCheer = cheer;
          transformed.y += sin(uTime * (1.6 + aSeed) + ph) * .03 + cheer * (.18 + abs(sin(uTime * 7.0 + ph)) * .22 * (.4 + uExcite));
          transformed.x += sin(uTime * .9 + ph) * .03; vShirt = aShirt;`)
        .replace('#include <uv_vertex>', `#include <uv_vertex>
          vMapUv = vec2((uv.x + aLook + step(.5, apexCheer()) * 4.0) / 8.0, uv.y);`);
      sh.fragmentShader = 'varying vec3 vShirt; varying float vCheer;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
          vec4 texel = texture2D(map, vMapUv);
          if (texel.g < .06 && abs(texel.r - texel.b) < .07 && texel.r > .08) texel.rgb = vShirt * (.45 + texel.r * .75);
          diffuseColor *= texel;`); };
    mat.customProgramCacheKey = () => 'apex-crowd-v1';
    fansMesh = new THREE.InstancedMesh(fg, mat, N); fansMesh.name = 'crowd';
    fans.forEach((f, i) => { Q.setFromAxisAngle(Y, f.ry); M4.compose(V.set(f.x, f.y, f.z), Q, S); fansMesh.setMatrixAt(i, M4); });
    fansMesh.frustumCulled = false; group.add(fansMesh); R.drawCalls++; }

  /* ---- roof / canopy, lights ---- */
  const hiLight = new THREE.MeshBasicMaterial({ color: 0xfff6e0, toneMapped: false });
  const steel = new THREE.MeshLambertMaterial({ color: 0x22262e });
  const roofH = Math.max(C.height || 0, topH + 6);
  if (C.roof === 'closed') {
    const shape = new THREE.Shape(), out = outline(F.a + topD + 1.2, F.b + topD + 1.2, F.r + topD + 1.2).pts; out.forEach((p, i) => (i ? shape.lineTo(p.x, -p.z) : shape.moveTo(p.x, -p.z)));
    const rg = new THREE.ShapeGeometry(shape); rg.rotateX(-Math.PI / 2); rg.translate(0, roofH, 0);
    const roof = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ color: 0x15181e, side: THREE.DoubleSide })); roof.name = 'roof'; group.add(roof); R.drawCalls++;
    // steel trusses across the roof + the ring of game lights over the floor
    const tr = []; for (let x = -F.a - topD; x <= F.a + topD; x += 9) { const b = new THREE.BoxGeometry(.6, 1.6, (F.b + topD) * 2); b.translate(x, roofH - 1, 0); tr.push(b); }
    const lights = []; for (let i = 0; i < 28; i++) { const t = i / 28 * TAU, b = new THREE.BoxGeometry(1.6, .3, 1.6); b.translate(Math.cos(t) * (F.a * .85), roofH - 2.2, Math.sin(t) * (F.b * .95)); lights.push(b); }
    group.add(named(new THREE.Mesh(mergeMany(THREE, tr), steel), 'trusses')); group.add(named(new THREE.Mesh(mergeMany(THREE, lights), hiLight), 'roof-lights')); R.drawCalls += 2; R.lightCount = 28;
  } else if (C.roof === 'canopy') {
    // a sloped canopy over the stands, open over the floor, its inner edge lined with floodlights
    const pos = [], n = path.length, segs = closed ? n : n - 1, din = setback + (topD - setback) * .32, dout = topD + 1.2, lpos = [];
    for (let k = 0; k < segs; k++) { const p0 = path[k], p1 = path[(k + 1) % n];
      const A = [p0.x + p0.nx * din, roofH, p0.z + p0.nz * din], B = [p1.x + p1.nx * din, roofH, p1.z + p1.nz * din], Cc = [p1.x + p1.nx * dout, roofH + 3, p1.z + p1.nz * dout], D = [p0.x + p0.nx * dout, roofH + 3, p0.z + p0.nz * dout];
      pos.push(...A, ...B, ...Cc, ...A, ...Cc, ...D); if (k % 3 === 0) lpos.push([A[0], roofH - .35, A[2]]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    group.add(named(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xd9dde3, side: THREE.DoubleSide })), 'canopy'));
    const lb = lpos.map(([x, y, z]) => { const b = new THREE.BoxGeometry(1.2, .45, 1.2); b.translate(x, y, z); return b; }); group.add(named(new THREE.Mesh(mergeMany(THREE, lb), hiLight), 'canopy-lights')); R.drawCalls += 2; R.lightCount = lb.length;
  }
  if (C.lights === 'towers') { const pcs = [], heads = [], corners = [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1]];
    for (const [sx, sz] of corners) { const x = sx * (F.a + topD * .7), z = sz * (F.b + topD * .7), H = topH + 18;
      const pole = new THREE.CylinderGeometry(.5, .8, H, 8); pole.translate(x, H / 2, z); pcs.push(pole);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const b = new THREE.BoxGeometry(1.1, .9, .4); b.lookAt(new THREE.Vector3(-x, -H, -z)); b.translate(x + (c - 1.5) * 1.2 * Math.abs(sz || 1) * .7, H + r * 1, z); heads.push(b); } }
    group.add(named(new THREE.Mesh(mergeMany(THREE, pcs), steel), 'light-towers')); group.add(named(new THREE.Mesh(mergeMany(THREE, heads), hiLight), 'tower-lights')); R.drawCalls += 2; R.lightCount = heads.length; }

  /* ---- scoreboard(s) ---- */
  const scoreTex = canvasTex(THREE, 512, 256, (g, w, hh) => drawScore(g, w, hh, { home: 'HOME', away: 'AWAY', hs: 0, as: 0, clock: '20:00', period: '1ST', hc: home, ac: away }));
  const boardMat = new THREE.MeshBasicMaterial({ map: scoreTex, toneMapped: false }), boxMat = new THREE.MeshLambertMaterial({ color: 0x0c0e13 });
  if (C.board === 'center-hung') { const bw = Math.min(14, F.b * .8), bh = bw * .55, by = roofH - 9, b = new THREE.Group();
    b.add(new THREE.Mesh(new THREE.BoxGeometry(bw + .6, bh + .6, bw + .6), boxMat));
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), boardMat); s.rotation.y = i * Math.PI / 2; s.position.set(Math.sin(i * Math.PI / 2) * (bw / 2 + .31), 0, Math.cos(i * Math.PI / 2) * (bw / 2 + .31)); b.add(s); }
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(bw * .75, bw * .75, 1.2, 24, 1, true), new THREE.MeshBasicMaterial({ map: led, toneMapped: false })); ring.position.y = -bh / 2 - 1.2; b.add(ring);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, roofH - by, 4), steel); cable.position.y = (roofH - by) / 2; b.add(cable);
    b.position.y = by; b.name = 'scoreboard'; group.add(b); R.screens = 4; R.drawCalls += 4; }
  else if (C.board === 'ends' || C.board === 'outfield') { const ends = C.board === 'outfield' ? [[-1, 0]] : [[1, 1], [-1, -1]];
    for (const [sx, sz] of ends) { const w = 22, hh = 11, x = sx * (F.a + topD * .55), z = sz * (F.b * .55), y = topH + 3, g2 = new THREE.Group();
      g2.add(new THREE.Mesh(new THREE.BoxGeometry(w + 1, hh + 1, 1.2), boxMat)); const sc = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), boardMat); sc.position.z = .62; g2.add(sc);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.4, y, 1.4), steel); leg.position.y = -y / 2; g2.add(leg);
      g2.position.set(x, y + hh / 2, z); g2.lookAt(0, y + hh / 2, 0); g2.name = 'screen'; group.add(g2); R.screens++; R.drawCalls += 3; } }

  /* ---- live state ---- */
  let excite = 0, t = 0;
  const api = {
    group, report: () => ({ ...R, units: unit }),
    crowd: { excite(v = 1) { excite = Math.min(1.5, Math.max(excite, v)); }, get level() { return excite; } },
    setScore(s) { scoreTex.userData.redraw((g, w, hh) => drawScore(g, w, hh, { home: 'HOME', away: 'AWAY', hs: 0, as: 0, clock: '', period: '', hc: home, ac: away, ...s })); },
    update(dt) { t += dt; excite = Math.max(0, excite - dt * .22); crowdU.uTime.value = t; crowdU.uExcite.value = Math.min(1, excite); },
    dispose() { group.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) { m.material.map && m.material.map.dispose(); m.material.dispose(); } }); },
  };
  return api;
}

function drawScore(g, w, h, s) {
  g.fillStyle = '#05070b'; g.fillRect(0, 0, w, h);
  g.fillStyle = hex(s.hc.getHex()); g.fillRect(14, 20, w / 2 - 24, 64); g.fillStyle = hex(s.ac.getHex()); g.fillRect(w / 2 + 10, 20, w / 2 - 24, 64);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.font = '900 38px system-ui, Arial, sans-serif';
  g.fillText(String(s.home).slice(0, 8), w / 4, 53); g.fillText(String(s.away).slice(0, 8), w * 3 / 4, 53);
  g.font = '900 96px system-ui, Arial, sans-serif'; g.fillStyle = '#ffd34d'; g.fillText(String(s.hs), w / 4, 150); g.fillText(String(s.as), w * 3 / 4, 150);
  g.font = '800 40px system-ui, Arial, sans-serif'; g.fillStyle = '#ff5050'; g.fillText(s.clock || '', w / 2, 150); g.fillStyle = '#9fb3c8'; g.font = '700 26px system-ui'; g.fillText(s.period || '', w / 2, 196);
  g.fillStyle = '#ffffff'; g.font = '800 22px system-ui'; g.fillText('APEX ARCADE', w / 2, 236); }

function named(m, n) { m.name = n; return m; }
function mergeTwo(THREE, a, b) { return mergeMany(THREE, [a, b]); }
/* merge plain geometries (position + normal), so a whole set of parts is ONE draw call */
function mergeMany(THREE, list) { const parts = list.map((g) => (g.index ? g.toNonIndexed() : g)); const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal']) { const tot = parts.reduce((s, g) => s + g.attributes[k].array.length, 0), A = new Float32Array(tot); let o = 0; parts.forEach((g) => { A.set(g.attributes[k].array, o); o += g.attributes[k].array.length; }); out.setAttribute(k, new THREE.BufferAttribute(A, 3)); }
  return out; }

export const stadiumKit = { outline, PRESETS };
