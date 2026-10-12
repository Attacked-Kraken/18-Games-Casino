/* Forum promenade wing (south of the casino entrance): painted-sky ceiling that drifts day -> dusk, marble floor, Roman colonnade,
   curved arcade of fictional luxury storefronts, fountain centerpiece with statues, sportsbook with big screens, VIP lounge, cafe and gift shop.
   Built lazily when the player nears the entrance (zone streaming) and hidden when far away. All brand names are invented. */
export const WING = { z0: 21, zc: 40, r: 21, hall: 21, door: 2.1, H: 11 };
export function inWing(x, z, m = 0) { const { z0, zc, r, door } = WING;
  if (z > 16 && z <= z0 + .5 && Math.abs(x) < door - m) return true;
  if (z > z0 + m && z <= zc) return Math.abs(x) < r - m;
  if (z > zc) return Math.hypot(x, z - zc) < r - m; return false; }
export function createWing(ctx) {
  const { THREE, scene, canvasTex, P, inst, addStation } = ctx; const { z0, zc, r, H } = WING;
  const root = new THREE.Group(); root.visible = false; scene.add(root); let built = false; const anim = []; let skyParts = null, COLS = [];
  const rnd = (() => { let s = 99; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const PM = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };
  const M = (o) => new THREE.MeshStandardMaterial(o);
  const add = (geo, mat, x, y, z, ry = 0, p = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; p.add(m); return m; };
  function build() { built = true;
    /* marble floor with inlaid compass medallions */
    const marble = canvasTex(1024, 1024, (g, w) => { g.fillStyle = '#efe8dc'; g.fillRect(0, 0, w, w); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#e6dccb' : '#f4eee4'; g.fillRect(i * 256, j * 256, 256, 256); }
      g.strokeStyle = 'rgba(120,100,80,.25)'; for (let k = 0; k < 70; k++) { g.lineWidth = .5 + rnd() * 1.5; g.beginPath(); let x = rnd() * w, y = rnd() * w; g.moveTo(x, y); for (let s = 0; s < 8; s++) { x += (rnd() - .5) * 80; y += (rnd() - .5) * 80; g.lineTo(x, y); } g.stroke(); }
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 6; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 256, 0); g.lineTo(i * 256, w); g.stroke(); g.beginPath(); g.moveTo(0, i * 256); g.lineTo(w, i * 256); g.stroke(); }
      g.fillStyle = '#7a1424'; for (const [cx, cy] of [[256, 256], [768, 768]]) { g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, rr = k % 2 ? 40 : 110; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill(); } }, [6, 6]);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(r + 1, 64), M({ map: marble, color: 0xb8ae9e, roughness: .6, metalness: 0 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, .004, zc); root.add(fl);
    const fl2 = new THREE.Mesh(new THREE.PlaneGeometry(r * 2 + 2, zc - z0 + 6), fl.material); fl2.rotation.x = -Math.PI / 2; fl2.position.set(0, .003, (z0 - 4 + zc) / 2); root.add(fl2);
    /* painted sky ceiling (shifts day -> dusk) */
    const sky = canvasTex(1024, 1024, (g, w) => { const gr = g.createLinearGradient(0, 0, 0, w); gr.addColorStop(0, '#5aa0e8'); gr.addColorStop(1, '#a8d4f8'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
      for (let i = 0; i < 70; i++) { const x = rnd() * w, y = rnd() * w, s = 30 + rnd() * 90; for (let k = 0; k < 9; k++) { const rg = g.createRadialGradient(x + (rnd() - .5) * s, y + (rnd() - .5) * s * .4, 2, x, y, s); rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x + (rnd() - .5) * s, y + (rnd() - .5) * s * .4, s * (.4 + rnd() * .5), 0, 7); g.fill(); } } }, [2, 2]);
    const skyM = new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r + 2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), skyM); dome.scale.set(1, .35, 1); dome.position.set(0, H - 2, zc); root.add(dome);
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(r + 1, r + 1, zc - z0 + 1, 32, 1, true, -Math.PI / 2, Math.PI), skyM); vault.rotation.x = Math.PI / 2; vault.rotation.y = Math.PI / 2; vault.scale.set(1, 1, .3); vault.position.set(0, H - 2, (z0 + zc) / 2); root.add(vault);
    skyParts = [dome, vault]; anim.push((t) => { const k = (Math.sin(t * .05) + 1) / 2; skyM.color.setRGB(1, 1 - k * .3, 1 - k * .55); sky.offset.x = t * .002; });
    /* entrance corridor walls */
    const wallM = M({ color: 0xb8a888, roughness: .7 });
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(.3, 5, z0 - 16.5), wallM, sx * 2.25, 2.5, (z0 + 16.5) / 2);
    add(new THREE.BoxGeometry(4.8, 1.4, z0 - 16.5), wallM, 0, 5.7, (z0 + 16.5) / 2);
    /* storefronts: positions along straight sides and the apse arc, facing inward */
    const SHOPS = [];
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) SHOPS.push({ x: sx * (r - .3), z: z0 + 3.3 + i * 6, ry: sx > 0 ? -Math.PI / 2 : Math.PI / 2 });
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i + .5) / 7 * Math.PI; SHOPS.push({ x: Math.sin(a) * (r - .3), z: zc + Math.cos(a) * (r - .3), ry: a + Math.PI }); }
    const BRANDS = [['Aurelia', '#d9b065', 'JEWELLERS'], ['Vestara', '#f0f0f0', 'COUTURE'], ['Lumière Nova', '#ffd6e8', 'PARFUMS'], ['Castellan', '#c9a45c', 'TIMEPIECES'], ['Olivetto', '#b8e0c0', 'LEATHER'], ['Seraphine', '#ffd0a0', 'MAISON'],
      ['Palatino', '#e0c890', 'GIFTS · CHIPS'], ['Bellacrest', '#a8d8ff', 'EYEWEAR'], ['Corvina', '#ffffff', 'SHOES'], ['Café Forum', '#ffcf8a', 'ESPRESSO BAR'], ['Marcellus', '#e8b8ff', 'ATELIER'], ['Valenzo', '#ffe08a', 'FINE WATCHES'], ['Ivory & Oak', '#f0e0c0', 'HOME']];
    const facadeM = M({ color: 0xc8b89c, roughness: .55 }), goldM = M({ color: 0xc9a056, metalness: 1, roughness: .3 }), glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .18, roughness: .05, metalness: .1 });
    SHOPS.forEach((s, i) => { const [nm, col, sub] = BRANDS[i % BRANDS.length]; const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; root.add(g);
      const disp = canvasTex(512, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff7e8'); gr.addColorStop(1, '#d8c4a0'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(90 + k * 165, 60, 60, 26, 0, 0, 7); c.fill(); }
        for (let k = 0; k < 3; k++) { const x = 90 + k * 165; c.fillStyle = '#6a5040'; c.fillRect(x - 40, 200, 80, 40); c.fillStyle = col === '#ffffff' ? '#222' : col; if (i % 3 === 0) { c.beginPath(); c.arc(x, 150, 34, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 10, 140, 8, 0, 7); c.fill(); }
          else if (i % 3 === 1) { c.fillStyle = '#222'; c.beginPath(); c.arc(x, 70, 14, 0, 7); c.fill(); c.fillStyle = ['#7a1424', '#1d3f7a', '#0f5a3e'][k]; c.beginPath(); c.moveTo(x - 22, 88); c.lineTo(x + 22, 88); c.lineTo(x + 38, 200); c.lineTo(x - 38, 200); c.fill(); }
          else { c.fillRect(x - 26, 120, 52, 80); c.fillStyle = '#fff'; c.fillRect(x - 10, 100, 20, 22); } } });
      add(new THREE.PlaneGeometry(4.4, 2.6), new THREE.MeshBasicMaterial({ map: disp }), 0, 1.6, -.25, 0, g);
      add(new THREE.PlaneGeometry(4.4, 2.6), glassM, 0, 1.6, .05, 0, g);
      add(new THREE.BoxGeometry(5.6, .5, .4), facadeM, 0, 3.15, 0, 0, g); add(new THREE.BoxGeometry(.5, 3.2, .4), facadeM, -2.45, 1.6, 0, 0, g); add(new THREE.BoxGeometry(.5, 3.2, .4), facadeM, 2.45, 1.6, 0, 0, g);
      add(new THREE.BoxGeometry(5.6, 4.5, .3), facadeM, 0, 5.6, -.15, 0, g);
      const sign = canvasTex(1024, 192, (c, w, h) => { c.fillStyle = '#1a1210'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a056'; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.shadowColor = col; c.shadowBlur = 24; c.fillStyle = col; c.font = 'italic 600 92px Georgia,serif'; c.fillText(nm, w / 2, 82); c.shadowBlur = 0; c.font = '600 30px Helvetica'; c.fillStyle = '#e8d3a0'; c.fillText(sub, w / 2, 150); });
      add(new THREE.PlaneGeometry(4.2, .8), new THREE.MeshBasicMaterial({ map: sign, toneMapped: false }), 0, 3.85, .22, 0, g);
      add(new THREE.BoxGeometry(5.6, .08, .5), goldM, 0, 3.42, .05, 0, g);
      s.name = nm; s.sub = sub; });
    /* Roman colonnade: fluted columns between storefronts and ringing the fountain (instanced) */
    const col = new THREE.Group(); const marbleM = M({ color: 0xcfc6b6, roughness: .45 });
    col.add(PM(new THREE.CylinderGeometry(.32, .36, 6.2, 20), marbleM, 0, 3.5, 0));
    col.add(PM(new THREE.BoxGeometry(.95, .4, .95), marbleM, 0, .2, 0));
    col.add(PM(new THREE.CylinderGeometry(.55, .36, .5, 20), marbleM, 0, 6.75, 0));
    col.add(PM(new THREE.BoxGeometry(1.1, .25, 1.1), goldM, 0, 7.1, 0));
    const CT = [];
    for (const sx of [-1, 1]) for (let i = 0; i <= 3; i++) CT.push({ x: sx * (r - 1.1), z: z0 + .3 + i * 6, ry: 0 });
    for (let i = 0; i <= 7; i++) { const a = -Math.PI / 2 + i / 7 * Math.PI; CT.push({ x: Math.sin(a) * (r - 1.1), z: zc + Math.cos(a) * (r - 1.1), ry: 0 }); }
    for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2; CT.push({ x: Math.cos(a) * 9, z: zc + Math.sin(a) * 9, ry: 0 }); } COLS = CT;
    inst(col, CT, root);
    /* fountain: tiered basins, animated water, central statue */
    const fx = 0, fz = zc; const stoneM = M({ color: 0xc4bcae, roughness: .45 }), waterM = new THREE.MeshPhysicalMaterial({ color: 0x3ab0d0, transparent: true, opacity: .75, roughness: .05, transmission: 0, clearcoat: 1 });
    add(new THREE.CylinderGeometry(4.2, 4.4, .7, 48), stoneM, fx, .35, fz); const w1 = add(new THREE.CylinderGeometry(3.9, 3.9, .05, 48), waterM, fx, .62, fz);
    add(new THREE.CylinderGeometry(.6, .9, 1.8, 24), stoneM, fx, 1.3, fz); add(new THREE.CylinderGeometry(2.1, 1.2, .4, 40), stoneM, fx, 2.2, fz); const w2 = add(new THREE.CylinderGeometry(1.9, 1.9, .04, 40), waterM, fx, 2.38, fz);
    add(new THREE.CylinderGeometry(.35, .5, 1.2, 20), stoneM, fx, 2.9, fz); add(new THREE.CylinderGeometry(1.0, .6, .3, 32), stoneM, fx, 3.6, fz);
    const jets = []; const jetM = new THREE.MeshBasicMaterial({ color: 0xcff4ff, transparent: true, opacity: .55, depthWrite: false });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const j = add(new THREE.CylinderGeometry(.03, .08, 1.6, 6), jetM, fx + Math.cos(a) * 1.7, 3.0, fz + Math.sin(a) * 1.7); j.rotation.z = Math.cos(a) * .35; j.rotation.x = -Math.sin(a) * .35; jets.push(j); }
    anim.push((t) => { jets.forEach((j, i) => j.scale.y = .85 + Math.sin(t * 4 + i) * .15); w1.material.opacity = .7 + Math.sin(t * 2) * .05; });
    /* classical statues (draped figure from lathe forms, marble) on plinths */
    function statue(x, z, ry) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); const sm = M({ color: 0xd8d2c6, roughness: .35 });
      add(new THREE.BoxGeometry(1.1, 1.3, 1.1), stoneM, 0, .65, 0, 0, g); add(new THREE.BoxGeometry(1.25, .12, 1.25), goldM, 0, 1.36, 0, 0, g);
      const robe = new THREE.LatheGeometry([[.42, 0], [.38, .3], [.3, .9], [.24, 1.35], [.27, 1.55], [.2, 1.72], [0, 1.74]].map(([a, b]) => new THREE.Vector2(a, b)), 24); add(robe, sm, 0, 1.42, 0, 0, g);
      add(new THREE.SphereGeometry(.13, 16, 12), sm, 0, 3.32, 0, 0, g); add(new THREE.CylinderGeometry(.05, .06, .12, 10), sm, 0, 3.17, 0, 0, g);
      const arm = add(new THREE.CylinderGeometry(.045, .05, .62, 8), sm, .27, 2.95, .08, 0, g); arm.rotation.z = -2.3; const arm2 = add(new THREE.CylinderGeometry(.045, .05, .55, 8), sm, -.22, 2.75, .05, 0, g); arm2.rotation.z = .25;
      add(new THREE.SphereGeometry(.09, 12, 8), goldM, .5, 3.2, .08, 0, g); }
    statue(fx, fz, 0); [[-6, zc - 6], [6, zc - 6], [-6, zc + 6], [6, zc + 6]].forEach(([x, z]) => statue(x, z, Math.atan2(-x, -(z - zc))));
    root.children[root.children.length - 1].position.y += 0; /* centre statue tops the fountain */ root.children.find((o) => o.isGroup && o.position.x === fx && o.position.z === fz).position.y = 3.75;
    /* sportsbook: big video wall + odds board + lounge seating (west side near entrance) */
    const sbC = document.createElement('canvas'); sbC.width = 1024; sbC.height = 384; const sbT = new THREE.CanvasTexture(sbC); sbT.colorSpace = THREE.SRGBColorSpace;
    const TEAMS = [['Harbor Hawks', 'Desert Comets'], ['Iron Valley', 'Bay City Kings'], ['North Star FC', 'Granite United'], ['Metro Lancers', 'Sunset Rays'], ['Capital Stags', 'River Otters']];
    function drawSB(t) { const g = sbC.getContext('2d'); g.fillStyle = '#060a14'; g.fillRect(0, 0, 1024, 384); const gr = g.createLinearGradient(0, 0, 640, 384); gr.addColorStop(0, '#0a5a2a'); gr.addColorStop(1, '#0a3a1a'); g.fillStyle = gr; g.fillRect(8, 8, 620, 368);
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.strokeRect(30, 30, 576, 324); g.beginPath(); g.moveTo(318, 30); g.lineTo(318, 354); g.stroke(); g.beginPath(); g.arc(318, 192, 50, 0, 7); g.stroke();
      const bx = 318 + Math.sin(t * .7) * 220, by = 192 + Math.sin(t * 1.3) * 110; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + t * .3; g.fillStyle = k < 5 ? '#e83a3a' : '#3a8ae8'; g.beginPath(); g.arc(318 + Math.cos(a) * (120 + k * 9) * (k < 5 ? 1 : -1) * .8 + Math.sin(t + k) * 20, 192 + Math.sin(a * 1.3) * 120, 8, 0, 7); g.fill(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(30, 30, 260, 34); g.fillStyle = '#fff'; g.font = '700 20px Helvetica'; g.fillText('HAWKS 2 – 1 COMETS  ' + (60 + Math.floor(t / 2) % 30) + "'", 40, 54);
      g.fillStyle = '#0a1020'; g.fillRect(640, 8, 376, 368); g.fillStyle = '#ffd34a'; g.font = '800 24px Helvetica'; g.fillText('LIVE ODDS · FUN PICKS', 656, 40);
      TEAMS.forEach(([a, b], i) => { const y = 80 + i * 60; g.fillStyle = i % 2 ? '#121a30' : '#0e1426'; g.fillRect(648, y - 24, 360, 54); g.fillStyle = '#e8eefc'; g.font = '600 17px Helvetica'; g.fillText(a, 656, y - 2); g.fillText(b, 656, y + 20);
        const o1 = (1.5 + ((i * 37 + Math.floor(t)) % 17) / 10).toFixed(2), o2 = (1.6 + ((i * 53 + Math.floor(t * .7)) % 19) / 10).toFixed(2); g.fillStyle = '#7dff6a'; g.font = '800 20px Helvetica'; g.fillText(o1, 930, y - 2); g.fillStyle = '#ff8a5c'; g.fillText(o2, 930, y + 20); }); sbT.needsUpdate = true; }
    drawSB(0); let sbAcc = 0; anim.push((t, dt) => { if ((sbAcc += dt) > .12) { sbAcc = 0; drawSB(t); } });
    const sbx = -13, sbz = z0 + 9;
    const scr = add(new THREE.PlaneGeometry(9, 3.4), new THREE.MeshBasicMaterial({ map: sbT, toneMapped: false }), sbx - 4.2, 4.2, sbz, Math.PI / 2); add(new THREE.BoxGeometry(.3, 3.8, 9.4), M({ color: 0x111, roughness: .3 }), sbx - 4.38, 4.2, sbz);
    const sign = canvasTex(1024, 160, (c, w, h) => { c.fillStyle = '#0a0a14'; c.fillRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#3ad0ff'; c.shadowBlur = 30; c.fillStyle = '#bff0ff'; c.font = '800 96px Helvetica'; c.fillText('SPORTSBOOK', w / 2, h / 2); });
    add(new THREE.PlaneGeometry(6, .95), new THREE.MeshBasicMaterial({ map: sign, toneMapped: false }), sbx - 4.2, 6.5, sbz, Math.PI / 2);
    const seat = new THREE.Group(); const lthr = M({ color: 0x1a1a24, roughness: .45 });
    seat.add(PM(new THREE.BoxGeometry(.7, .45, .7), lthr, 0, .23, 0)); seat.add(PM(new THREE.BoxGeometry(.7, .6, .15), lthr, 0, .7, .3));
    const desk = new THREE.Group(); desk.add(PM(new THREE.BoxGeometry(.66, .05, .4), M({ color: 0x3a2214, roughness: .3 }), 0, .72, -.5));
    const ST = []; for (let rr2 = 0; rr2 < 3; rr2++) for (let k = 0; k < 6; k++) ST.push({ x: sbx + 1.2 + rr2 * 1.6, z: sbz - 3.1 + k * 1.2, ry: -Math.PI / 2 }); inst(seat, ST, root); inst(desk, ST, root);
    /* VIP lounge (east side): velvet ropes, sofas, low tables, glowing sign */
    const vx = 13, vz = z0 + 9, velvet = M({ color: 0x7a0a1e, roughness: .6 }), sofa = new THREE.Group();
    sofa.add(PM(new THREE.BoxGeometry(2.2, .45, .9), velvet, 0, .25, 0)); sofa.add(PM(new THREE.BoxGeometry(2.2, .7, .25), velvet, 0, .6, -.35));
    sofa.add(PM(new THREE.BoxGeometry(.25, .6, .9), velvet, -1.1, .4, 0)); sofa.add(PM(new THREE.BoxGeometry(.25, .6, .9), velvet, 1.1, .4, 0));
    inst(sofa, [{ x: vx + 3, z: vz - 3, ry: -Math.PI / 2 }, { x: vx + 3, z: vz + 1, ry: -Math.PI / 2 }, { x: vx - .5, z: vz - 4.6, ry: 0 }, { x: vx - .5, z: vz + 2.6, ry: Math.PI }], root);
    add(new THREE.CylinderGeometry(.6, .6, .4, 24), goldM, vx + 1.4, .2, vz - 1); add(new THREE.CylinderGeometry(.6, .6, .4, 24), goldM, vx - .5, .2, vz - 1);
    for (let k = 0; k < 7; k++) { add(new THREE.CylinderGeometry(.05, .05, 1, 8), goldM, vx - 3, .5, vz - 4.5 + k * 1.3); if (k < 6) { const rope = add(new THREE.CylinderGeometry(.035, .035, 1.3, 6), velvet, vx - 3, .85, vz - 3.85 + k * 1.3); rope.rotation.x = Math.PI / 2; } }
    const vs = canvasTex(1024, 160, (c, w, h) => { c.fillStyle = '#14040a'; c.fillRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ff3a6a'; c.shadowBlur = 30; c.fillStyle = '#ffd0dc'; c.font = 'italic 700 90px Georgia'; c.fillText('VIP Lounge', w / 2, h / 2); });
    add(new THREE.PlaneGeometry(5, .8), new THREE.MeshBasicMaterial({ map: vs, toneMapped: false }), vx + 4.3, 4.5, vz, -Math.PI / 2);
    /* lighting: warm sconces + sky fill */
    root.add(new THREE.HemisphereLight(0xcfe6ff, 0x806850, .18)); for (const [x, z] of [[0, z0 + 4], [-12, z0 + 9], [12, z0 + 9], [0, zc + 12], [0, zc - 9]]) { const l = new THREE.PointLight(0xffe2b8, 2.6, 14, 1.8); l.position.set(x, 6.5, z); root.add(l); }
    /* interactive stations */
    const shopBy = (n) => SHOPS.find((s) => s.name === n);
    const st = (s, g, act) => { const fx2 = Math.sin(s.ry), fz2 = Math.cos(s.ry); addStation({ g, center: new THREE.Vector3(s.x, 0, s.z), stand: new THREE.Vector3(s.x + fx2 * 2.2, 0, s.z + fz2 * 2.2), action: act }); };
    st(shopBy('Palatino'), { id: 'shop-gift', title: 'Palatino Gift Shop', rating: 18, tagline: 'Spend fun chips on avatar flair and chip bundles' }, () => ctx.openShop('gift'));
    st(shopBy('Café Forum'), { id: 'shop-cafe', title: 'Café Forum', rating: 18, tagline: 'Espresso bar · free hourly coffee bonus' }, () => ctx.openShop('cafe'));
    st(shopBy('Lumière Nova'), { id: 'shop-cosm', title: 'Lumière Nova', rating: 18, tagline: 'Avatar cosmetics for fun chips' }, () => ctx.openShop('cosm'));
    addStation({ g: { id: 'sportsbook', title: 'Sportsbook', rating: 18, tagline: 'Live scores and fun odds on the big screens' }, center: new THREE.Vector3(sbx - 4, 0, sbz), stand: new THREE.Vector3(sbx + 1, 0, sbz), action: () => ctx.openShop('sports') });
    WING.shops = SHOPS; }
  return {
    update(dt, t, over) { const near = P.z > 9 || over; if (near && !built) build(); root.visible = near; if (skyParts) skyParts.forEach((o) => o.visible = !over); if (near) anim.forEach((f) => f(t, dt)); },
    collide(nx, nz, RAD) { if (!inWing(nx, nz, RAD)) return null; const dx = nx, dz = nz - zc, d = Math.hypot(dx, dz), m = 4.4 + RAD; if (d < m) { nx = dx / d * m; nz = zc + dz / d * m; } for (const c of COLS) { const ex = nx - c.x, ez = nz - c.z, e = Math.hypot(ex, ez), mm = .5 + RAD; if (e < mm && e > 0) { nx = c.x + ex / e * mm; nz = c.z + ez / e * mm; } } return [nx, nz]; },
    get built() { return built; } };
}
