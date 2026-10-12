/* Grand Hall: the casino's north expansion behind the main oval (through the back archway). ~3,700 m2 of extra floor:
   6 long slot banks, a table pit (blackjack, baccarat, roulette, craps, poker), the gold High-Limit Salon behind velvet
   ropes, two bars with stools, and the Cashier cage (opens the wallet). Built lazily the first time the player heads
   north, hidden whenever the player is back in the main oval (zone streaming), every repeated mesh instanced. */
export const HALL = { x0: -40, x1: 40, z0: -63, z1: -17, door: 4.2, H: 9 };
export const HALL_TABLES = [['bj', -6, -40, 0, 'velvet21'], ['bj', 6, -40, 0, 'velvet21'], ['bac', -6, -47, Math.PI, 'baccaratnoir'], ['bac', 6, -47, Math.PI, 'baccaratnoir'], ['roul', -16, -44, Math.PI / 2, 'rubyroulette'], ['craps', 16, -44, -Math.PI / 2, 'dicepalace'],
      ['poker', -30, -44, 0, 'holdemroyale'], ['poker', -30, -54, 0, 'holdemroyale'], ['pokerB', -20, -55, 0, 'holdemroyale'], ['bac', 26 - 2, -50 + 6, 0, 'baccaratnoir'], ['bj', 26 + 7, -50 + 6, 0, 'velvet21']];
export const HALL_BARS = [[-28, -58], [6, -58]];
export const inHall = (x, z, m = 0) => x > HALL.x0 + m && x < HALL.x1 - m && z > HALL.z0 + m && z < HALL.z1 + .6 && (z < HALL.z1 - m || Math.abs(x) < HALL.door - m);
export function createHall(ctx) { const { THREE, scene, P, inst, canvasTex, signMesh, neonTex } = ctx; const root = new THREE.Group(); root.visible = false; scene.add(root);
  let built = false; const boxes = [], billboards = [];
  const box = (x, z, hw, hd) => boxes.push([x - hw, z - hd, x + hw, z + hd]);
  const PM = (geo, mat, x, y, z, ry) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; root.add(m); return m; };
  function build() { built = true; const { x0, x1, z0, z1, H, door } = HALL, W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    /* carpet: deep crimson with gold medallions + teal aisles */
    const cT = canvasTex(512, 512, (g, w) => { g.fillStyle = '#5a0a1e'; g.fillRect(0, 0, w, w); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 128 + 64, y = j * 128 + 64; g.strokeStyle = '#d9a640'; g.lineWidth = 6; g.beginPath(); g.arc(x, y, 40, 0, 7); g.stroke(); g.fillStyle = '#0f4a52'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, r = k % 2 ? 14 : 30; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); g.fillStyle = '#f0c060'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(217,166,64,.5)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, w); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); } });
    cT.wrapS = cT.wrapT = THREE.RepeatWrapping; cT.repeat.set(W / 8, D / 8); cT.anisotropy = 4;
    const fl = PM(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: cT, roughness: .95 }), cx, .005, cz); fl.rotation.x = -Math.PI / 2;
    /* gold ceiling with glowing coffers */
    const ceT = canvasTex(256, 256, (g, w) => { g.fillStyle = '#2a1608'; g.fillRect(0, 0, w, w); g.fillStyle = '#c9a056'; g.fillRect(0, 0, w, 14); g.fillRect(0, 0, 14, w); const r = g.createRadialGradient(w / 2, w / 2, 10, w / 2, w / 2, 110); r.addColorStop(0, '#fff2c8'); r.addColorStop(1, '#8a5a20'); g.fillStyle = r; g.fillRect(30, 30, w - 46, w - 46); });
    ceT.wrapS = ceT.wrapT = THREE.RepeatWrapping; ceT.repeat.set(W / 5, D / 5); const ce = PM(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: ceT, color: 0xf0e0c8 }), cx, H, cz); ce.rotation.x = Math.PI / 2; ce.userData.ceil = 1; ctx.markCeil && ctx.markCeil(ce);
    /* walls */
    const wT = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#7a2230'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1408'; g.fillRect(0, h - 120, w, 120); g.fillStyle = '#c9a056'; g.fillRect(0, h - 124, w, 6); g.fillRect(0, 40, w, 4); g.strokeStyle = 'rgba(201,160,86,.5)'; g.lineWidth = 3; g.strokeRect(30, 70, w - 60, h - 220); });
    const wm = (len) => { const t = wT.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(len / 3, 1); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: .7, side: THREE.DoubleSide }); };
    PM(new THREE.PlaneGeometry(W, H), wm(W), cx, H / 2, z0); for (const sx of [-1, 1]) { const w2 = PM(new THREE.PlaneGeometry(D, H), wm(D), sx < 0 ? x0 : x1, H / 2, cz); w2.rotation.y = Math.PI / 2; }
    for (const sx of [-1, 1]) { const sw = (W / 2 - door); PM(new THREE.PlaneGeometry(sw, H), wm(sw), sx * (door + sw / 2), H / 2, z1 - .02, Math.PI); }
    /* lighting (few lights; materials do the rest) */
    root.add(new THREE.HemisphereLight(0xfff0d8, 0x4a2a20, 1.15)); [[-20, -30], [20, -30], [0, -50], [-26, -52], [26, -52], [0, -24], [-30, -40], [30, -40]].forEach(([x, z]) => { const l = new THREE.PointLight(0xffe0b0, 16, 34, 1.4); l.position.set(x, H - 1, z); root.add(l); });
    /* chandeliers: instanced glowing crystal drums */
    { const ch = new THREE.Group(); ch.add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, .7, .9, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c8, side: THREE.DoubleSide, toneMapped: false }))); ch.children[0].position.y = H - 1.2;
      const L = []; for (let x = -30; x <= 30; x += 15) for (const z of [-24, -40, -56]) L.push({ x, z }); inst(ch, L, root); }
    /* ---- slot banks (6 double-sided rows) ---- */
    const ids = ctx.slotIds, rows = [], heroes = [];
    const bank = (bx, bz, n, type, hi) => { for (let i = 0; i < n; i++) for (const side of [-1, 1]) { const x = bx + (i - (n - 1) / 2) * 1.05, z = bz + side * .55, ry = side > 0 ? 0 : Math.PI, cell = (i * 2 + (side > 0 ? 1 : 0) + Math.round(bx)) % 6, id = hi ? ids[(i + (side > 0 ? 3 : 0)) % ids.length] : ids[cell % ids.length];
        const e = ctx.ent(id, x, z, ry, 1.5); rows.push({ x, z, ry, tint: hi ? 0x8a6a18 : 0x8c1a2b, stool: hi ? 0x1a1a1a : 0x9a1222, led: ctx.LED[(cell + i) % 6], cell: ctx.cellOf ? ctx.cellOf(id, cell) : cell, ent: e, type }); }
      box(bx, bz, n * 1.05 / 2 + .1, 1.0); };
    for (const z of [-24, -31]) for (const x of [-28, -14]) bank(x, z, 9, z === -24 ? 0 : 1);
    for (const x of [14, 28]) bank(x, -24, 9, 2);
    /* High-limit salon (north-east, gold, roped) */
    const hx = 26, hz = -50; bank(hx - 4, hz - 3, 5, 3, true); bank(hx + 5, hz - 3, 4, 3, true);
    for (let t = 0; t < 4; t++) { const s = rows.filter((r) => r.type === t); if (s.length) inst(ctx.slotProto(t), s, root); }
    /* table pit (center) + salon tables */
    const nT0 = Object.fromEntries(Object.entries(ctx.TAB).map(([k, v]) => [k, v.length])), nC0 = ctx.CHAIRS.length;
    HALL_TABLES.forEach((a) => ctx.table(...a));
    Object.keys(ctx.TAB).forEach((k) => { const s = ctx.TAB[k].slice(nT0[k]); if (s.length) inst(ctx.protoOf[k](), s, root); }); const ch = ctx.CHAIRS.slice(nC0); if (ch.length) inst(ctx.chairProto(), ch, root);
    const games = ctx.games(); ctx.clones.forEach((c) => { if (!c.g && !c.action) c.g = games.find((g) => g.id === c.id) || null; });
    /* velvet ropes around the salon */
    { const post = new THREE.Group(); post.add(new THREE.Mesh(new THREE.CylinderGeometry(.05, .12, 1, 10), new THREE.MeshStandardMaterial({ color: 0xd9a640, metalness: .9, roughness: .25 }))); post.children[0].position.y = .5; const posts = [];
      for (let x = hx - 12; x <= hx + 12; x += 2) if (Math.abs(x - hx) > 2) posts.push({ x, z: hz + 11 }); inst(post, posts, root);
      const rope = PM(new THREE.BoxGeometry(24, .07, .07), new THREE.MeshStandardMaterial({ color: 0x8a0a1e, roughness: .6 }), hx, .82, hz + 11); box(hx - 7, hz + 11, 5, .2); box(hx + 7, hz + 11, 5, .2); rope.scale.set(1, 1, 1); }
    const sgn = (txt, col, x, y, z, w, ry) => { const s = signMesh(neonTex(txt, col), w); s.position.set(x, y, z); if (ry) s.rotation.y = ry; root.add(s); return s; };
    sgn('HIGH LIMIT SALON', '#ffd34a', hx, 4.4, hz + 11.2, 5.4, Math.PI); sgn('GRAND HALL', '#ff5a7a', 0, 5.6, z1 - .3, 6, Math.PI); sgn('TABLE GAMES', '#40e0ff', 0, 4.4, -36, 4.6, Math.PI);
    /* bars */
    const barM = new THREE.MeshStandardMaterial({ color: 0x3a1a0c, roughness: .4, metalness: .1 }), topM = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: .15, metalness: .3 }), glowM = new THREE.MeshBasicMaterial({ color: 0xffb040, toneMapped: false });
    const stools = []; [[...HALL_BARS[0], 'GOLDEN BAR'], [...HALL_BARS[1], 'LUXE LOUNGE']].forEach(([bx, bz, nm]) => { PM(new THREE.BoxGeometry(10, 1.1, 1.2), barM, bx, .55, bz + 1.2); PM(new THREE.BoxGeometry(10.3, .08, 1.5), topM, bx, 1.14, bz + 1.2); PM(new THREE.BoxGeometry(10, .05, .05), glowM, bx, .2, bz + 1.85);
      PM(new THREE.BoxGeometry(11, 3.2, .6), barM, bx, 1.6, bz - 2.2); for (let k = 0; k < 3; k++) PM(new THREE.BoxGeometry(10.6, .06, .5), glowM, bx, 1 + k * .8, bz - 1.9); for (let i = 0; i < 24; i++) { const b = PM(new THREE.CylinderGeometry(.06, .06, .3, 8), new THREE.MeshBasicMaterial({ color: [0x2aa860, 0xc0402a, 0xd9a640, 0x3a6aff][i % 4] }), bx - 5 + i * .43, 1.2 + (i % 3) * .8, bz - 1.85); b.scale.y = .8 + (i % 2) * .4; }
      sgn(nm, '#ffd34a', bx, 3.8, bz - 1.85, 4.2); box(bx, bz + 1.2, 5.2, .75); box(bx, bz - 2.2, 5.6, .5); for (let i = 0; i < 8; i++) stools.push({ x: bx - 4.2 + i * 1.2, z: bz + 2.6, ry: Math.PI }); });
    { const st = new THREE.Group(); const seat = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .1, 16), new THREE.MeshStandardMaterial({ color: 0x7a0a1e, roughness: .5 })); seat.position.y = .78; const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .14, .78, 10), new THREE.MeshStandardMaterial({ color: 0xd9a640, metalness: .9, roughness: .3 })); leg.position.y = .39; st.add(seat, leg); inst(st, stools, root); }
    /* cashier cage (north wall, center-left) */
    { const ccx = -8, ccz = -60.5; PM(new THREE.BoxGeometry(12, 1.15, .9), new THREE.MeshStandardMaterial({ color: 0x2a1408, roughness: .5 }), ccx, .58, ccz + 1.2); PM(new THREE.BoxGeometry(12.2, .08, 1.1), new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: .2 }), ccx, 1.18, ccz + 1.2);
      const bar = new THREE.Group(); bar.add(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0xd9a640, metalness: .9, roughness: .25 }))); bar.children[0].position.y = 2.0; const bl = []; for (let x = ccx - 6; x <= ccx + 6; x += .25) if ((Math.round((x - ccx + 6) / .25) % 12) > 3) bl.push({ x, z: ccz + 1.2 }); inst(bar, bl, root);
      PM(new THREE.BoxGeometry(12.2, .2, 1.1), new THREE.MeshStandardMaterial({ color: 0xd9a640, metalness: .8, roughness: .3 }), ccx, 2.85, ccz + 1.2); PM(new THREE.BoxGeometry(12, 3, .2), new THREE.MeshStandardMaterial({ color: 0x1a2a1a, roughness: .7 }), ccx, 1.5, ccz - .6);
      sgn('CASHIER', '#7dff6a', ccx, 3.7, ccz + 1.3, 3.6); box(ccx, ccz + .4, 6.2, 1.4);
      ctx.addStation({ g: { id: 'cashier', title: 'Cashier Cage', rating: 18, tagline: 'Open your wallet · demo fun chips, no real money' }, center: new THREE.Vector3(ccx, 0, ccz + 1.2), stand: new THREE.Vector3(ccx, 0, ccz + 3.2), action: () => window.Wallet && Wallet.open() }); }
    /* plants + columns for depth */
    { const col = new THREE.Group(); col.add(new THREE.Mesh(new THREE.CylinderGeometry(.42, .48, H, 16), new THREE.MeshStandardMaterial({ color: 0x2a0a10, roughness: .4 }))); col.children[0].position.y = H / 2; const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .06, 6, 20), new THREE.MeshStandardMaterial({ color: 0xd9a640, metalness: .9, roughness: .3 })); ring.rotation.x = Math.PI / 2; ring.position.y = 3; col.add(ring);
      const C = []; for (const x of [-21, -7, 7, 21]) for (const z of [-28, -36, -52]) { if (z === -52 && x > 0) continue; C.push({ x, z }); box(x, z, .5, .5); } inst(col, C, root); }
  }
  return { root, collide(nx, nz, RAD) { if (!inHall(nx, nz) && !(nz < HALL.z1 + 1 && Math.abs(nx) < HALL.door)) return null; if (!built) build();
      const m = RAD + .2; nx = Math.max(HALL.x0 + m, Math.min(HALL.x1 - m, nx)); if (nz > HALL.z1 - m && Math.abs(nx) > HALL.door - m) nz = HALL.z1 - m; nz = Math.max(HALL.z0 + m, nz);
      for (const b of boxes) if (nx + RAD > b[0] && nx - RAD < b[2] && nz + RAD > b[1] && nz - RAD < b[3]) { const pl = nx + RAD - b[0], pr = b[2] - (nx - RAD), pu = nz + RAD - b[1], pd = b[3] - (nz - RAD), mm = Math.min(pl, pr, pu, pd); if (mm === pl) nx -= pl; else if (mm === pr) nx += pr; else if (mm === pu) nz -= pu; else nz += pd; }
      return [nx, nz]; },
    update(dt, t, over) { if (!built && (P.z < HALL.z1 + 10 || over)) build(); root.visible = built && (P.z < HALL.z1 + 14 || over); },
    get built() { return built; }, buildNow() { if (!built) build(); } };
}
