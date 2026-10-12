/* Cruz Field offense: 10 teammates + QB (Cruz, or backup QB #7 when Cruz is away/drilling) practising nonstop from a
   500-play procedural playbook (playbook.json). Line up per formation, optional pre-snap motion, snap, routes, blocking,
   QB drop-back, visible ball arc with trail, catch, run after catch, reset. Coach picks run once with route overlay. */
const LINE = [['C', 'BELL', 63, 0, -.7], ['LG', 'ODOM', 66, -1.35, -.8], ['RG', 'PIKE', 67, 1.35, -.8], ['LT', 'VOSS', 71, -2.7, -.95], ['RT', 'KANE', 74, 2.7, -.95]];
const SKILL = [['TE', 'REED', 88], ['WR1', 'NASH', 1], ['WR2', 'LOPE', 11], ['SL', 'DIAZ', 17], ['RB', 'HALE', 22], ['FB', 'MOSS', 44]];
const RC = { WR1: 0xffd34a, WR2: 0x5ad0ff, SL: 0xff6ad5, TE: 0x7dff6a, RB: 0xff8a3a, FB: 0xffffff };
export function createTeam(ctx) { const { THREE, scene, cruz, mobile } = ctx; const C = cruz.C; const LOS = 110; const T = { active: true, players: [], phase: 'form', book: [], cur: null, overlay: false };
  fetch('playbook.json').then((r) => r.json()).then((j) => { T.book = j.plays; }).catch(() => {});
  const FALLBACK = { name: 'Gun Doubles Rt Slant-Flat', form: 'Gun Doubles', concept: 'Slant-Flat', tgt: 'WR1', drop: 2.2, f: { WR1: [-15, -.8], WR2: [15, -.8], SL: [-9, -1.3], TE: [4.1, -1], RB: [1.1, -5.2], FB: [-1.2, -3.4] }, r: { WR1: [[0, 3], [5, 9]], WR2: [[0, 3], [-5, 9]], SL: [[0, 1], [-6, 2.5]], TE: [[0, 18]], RB: [[0, 1], [6, 2.5]], FB: [[0, 1.4]] } };
  const skins = [1, 2, 3, 4, 5, 2, 3, 4, 1, 5, 3, 2]; let si = 0;
  const mk = (pos, name, num, fx, fz, role) => { const h = C.make({ num, name, skin: skins[si++ % skins.length], h: role === 'line' ? 1.98 : 1.9 }); h.rig.rotation.order = 'YXZ'; scene.add(h.rig); h.play('Idle_Loop', 0); h.mixer.setTime(si * .3);
    const q = { pos, name, role, fx, fz, h, x: fx * .5 - 6, z: LOS - 8 + (si % 3), yaw: 0, vx: 0, vz: 0, route: null, ri: 0 }; T.players.push(q); return q; };
  LINE.forEach(([p, n, num, fx, fz]) => mk(p, n, num, fx, fz, 'line')); SKILL.forEach(([p, n, num]) => mk(p, n, num, FALLBACK.f[p][0], FALLBACK.f[p][1], 'skill'));
  const qb2 = mk('QB2', 'ROSS', 7, 0, -4.4, 'qb');
  /* ball: slightly larger, with a trail */
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.17, 14, 10), new THREE.MeshStandardMaterial({ color: 0x8a3a14, roughness: .45, emissive: 0x2a0c02 })); ball.scale.set(1, .6, .6); scene.add(ball); ball.position.set(0, .12, LOS);
  { const lace = new THREE.Mesh(new THREE.BoxGeometry(.012, .02, .16), new THREE.MeshBasicMaterial({ color: 0xffffff })); lace.position.y = .16; ball.add(lace); }
  const TN = 26, tPos = new Float32Array(TN * 3), trailG = new THREE.BufferGeometry(); trailG.setAttribute('position', new THREE.BufferAttribute(tPos, 3)); const trail = new THREE.Line(trailG, new THREE.LineBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: .8 })); trail.frustumCulled = false; scene.add(trail); let tCount = 0;
  const pushTrail = (p) => { tPos.copyWithin(3, 0, (TN - 1) * 3); tPos[0] = p.x; tPos[1] = p.y; tPos[2] = p.z; tCount = Math.min(TN, tCount + 1); trailG.setDrawRange(0, tCount); trailG.attributes.position.needsUpdate = true; };
  /* route overlay */
  const ov = new THREE.Group(); scene.add(ov); ov.visible = false;
  function drawOverlay(pl) { ov.clear(); Object.entries(pl.r).forEach(([k, pts]) => { const f = pl.f[k]; const arr = [new THREE.Vector3(f[0], .06, LOS + f[1])]; let x = f[0], z = LOS + f[1]; pts.forEach(([dx, dz]) => arr.push(new THREE.Vector3(f[0] + dx, .06, LOS + f[1] + dz)));
      const g = new THREE.BufferGeometry().setFromPoints(arr); const isT = k === pl.tgt; ov.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: RC[k] || 0xffffff, linewidth: 2 })));
      const end = arr[arr.length - 1], prev = arr[arr.length - 2]; const a = new THREE.Mesh(new THREE.ConeGeometry(isT ? .55 : .35, isT ? 1.1 : .7, 8), new THREE.MeshBasicMaterial({ color: RC[k] || 0xffffff })); a.position.copy(end); a.rotation.set(Math.PI / 2, 0, -Math.atan2(end.x - prev.x, end.z - prev.z)); ov.add(a);
      for (const p of arr) { const d = new THREE.Mesh(new THREE.CircleGeometry(isT ? .35 : .22, 12), new THREE.MeshBasicMaterial({ color: RC[k] || 0xffffff })); d.rotation.x = -Math.PI / 2; d.position.copy(p); ov.add(d); } }); ov.visible = true; }
  let ph = 'form', pt = 0, fly = null, carrier = null, mot = null; let reps = 0; T.drillT = 0; T.queue = null;
  const byPos = (p) => T.players.find((q) => q.pos === p);
  const play = (q, n, ts = 1, once) => { if (q.h.clip !== n) { q.h.ts = ts; q.h.play(n, .2, once); } if (q.h.act) q.h.act.timeScale = ts; };
  function steer(q, tx, tz, sp, dt, face = true) { const ex = tx - q.x, ez = tz - q.z, d = Math.hypot(ex, ez); if (d < .25) { q.vx *= .6; q.vz *= .6; return true; } const k = Math.min(sp, d * 3) / d; q.vx += (ex * k - q.vx) * Math.min(1, dt * 6); q.vz += (ez * k - q.vz) * Math.min(1, dt * 6);
    if (face) { let dd = Math.atan2(ex, ez) - q.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); q.yaw += dd * Math.min(1, dt * 8); } return false; }
  const faceTo = (q, a, dt) => { let dd = a - q.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); q.yaw += dd * Math.min(1, dt * 6); };
  const cruzQB = () => cruz.ready && cruz.mode === 'field' && cruz.cmd === 'roam' && T.drillT <= 0;
  const PL = () => T.cur || FALLBACK; Object.defineProperty(T, 'active', { get: cruzQB });
  /* QB brain: returns a control for whoever is QB */
  function qbCtl(dt, cx, cz) { const pl = PL(), qx = 0, qz = LOS - 4.4, drop = pl.drop || 3;
    if (ph === 'form' || ph === 'set') { const d = Math.hypot(cx - qx, cz - qz); return { x: qx, z: qz, speed: 3.6, anim: d > .5 ? 'Jog_Fwd_Loop' : 'Idle_Loop', face: d > .5 ? null : 0 }; }
    if (ph === 'snap') return { anim: 'Idle_Loop', face: 0 };
    if (ph === 'live') { if (pl.pa && pt < 1.6) return { x: qx + 3.5 * (pt > .6 ? 1 : 0), z: qz - 1.2, speed: 4, anim: 'Jog_Fwd_Loop' };
      if (pt < 1.0) return { x: qx, z: qz - drop, speed: 3, anim: 'Walk_Loop', ts: -1.5, back: true, face: 0 };
      const tg = byPos(pl.tgt), a = Math.atan2(tg.x - cx, tg.z - cz); if (pt < 2.0) return { anim: 'Idle_Loop', face: a }; if (pt < 2.9) return { anim: 'Spell_Simple_Shoot', once: true, face: a }; return { anim: 'Idle_Loop', face: a }; }
    return { anim: carrier ? 'Interact' : 'Idle_Loop', once: true, face: 0 }; }
  T.cruzCtl = (dt, cx, cz) => { T.cx = cx; T.cz = cz; return qbCtl(dt, cx, cz); };
  function nextPlay() { if (T.queue != null && T.book[T.queue]) { T.cur = T.book[T.queue]; T.overlay = true; T.queue = null; } else { T.overlay = false; T.cur = T.book.length ? T.book[Math.floor(Math.random() * T.book.length)] : FALLBACK; }
    ov.visible = false; if (T.overlay) drawOverlay(T.cur); T.onPlay && T.onPlay(T.cur, T.overlay); }
  function setRoutes() { const pl = PL(); T.players.forEach((q) => { const r = pl.r[q.pos], f = pl.f[q.pos]; if (!f) { q.route = null; return; } const bx = mot && mot.q === q ? q.x : f[0], bz = mot && mot.q === q ? q.z - LOS : f[1]; q.route = r ? r.map(([dx, dz]) => [bx + dx, LOS + bz + dz]) : null; q.ri = 0; }); }
  T.runPlay = (id) => { T.queue = id; if (ph === 'live' || ph === 'dead') return; ph = 'form'; pt = 0; nextPlay(); };
  T.setPlay = T.runPlay;
  nextPlay();
  T.update = (dt, t, visible) => { const step = mobile ? 2 : 1; T.fr = (T.fr || 0) + 1; const pl = PL();
    if (reps >= 6 && T.queue == null) { T.drillT += dt; if (T.drillT > 28) { reps = 0; T.drillT = 0; } } /* Cruz drill break; backup QB keeps practice going */
    const useCruz = cruzQB(); const qbq = useCruz ? null : qb2;
    if (useCruz) { steer(qb2, -27, LOS - 2, 3, dt); play(qb2, Math.hypot(qb2.vx, qb2.vz) > .4 ? 'Jog_Fwd_Loop' : 'Idle_Loop'); if (Math.hypot(qb2.vx, qb2.vz) < .3) faceTo(qb2, Math.PI / 2, dt); }
    else { const c = qbCtl(dt, qb2.x, qb2.z); if (c.anim) play(qb2, c.anim, c.ts || 1, c.once); if (c.x != null) steer(qb2, c.x, c.z, c.speed || 0, dt, !c.back); else { qb2.vx *= .5; qb2.vz *= .5; } if (c.face != null) faceTo(qb2, c.face, dt); T.cx = qb2.x; T.cz = qb2.z; }
    const skill = T.players.filter((q) => q.role !== 'qb'); pt += dt;
    if (ph === 'form') { let ok = true; skill.forEach((q) => { const f = q.role === 'line' ? [q.fx, q.fz] : pl.f[q.pos]; const d = !steer(q, f[0], LOS + f[1], 4.6, dt); if (d) ok = false; else faceTo(q, 0, dt); play(q, d ? 'Jog_Fwd_Loop' : (q.role === 'line' ? 'Crouch_Idle_Loop' : 'Idle_Loop')); });
      if (!fly && !carrier) ball.position.set(0, .12, LOS); if ((ok && Math.hypot((T.cx ?? 0), (T.cz ?? 0) - (LOS - 4.4)) < .9) || pt > 10) { ph = 'set'; pt = 0; mot = pl.m ? { q: byPos(pl.m.p), to: pl.m.to } : null; } }
    else if (ph === 'set') { skill.forEach((q) => { if (mot && mot.q === q) { steer(q, mot.to[0], LOS + mot.to[1], 5, dt); play(q, 'Jog_Fwd_Loop'); return; } faceTo(q, 0, dt); play(q, q.role === 'line' || q.pos === 'WR1' || q.pos === 'WR2' ? 'Crouch_Idle_Loop' : 'Idle_Loop'); q.vx = q.vz = 0; }); if (pt > (mot ? 1.8 : 1.2)) { ph = 'snap'; pt = 0; setRoutes(); } }
    else if (ph === 'snap') { const u = Math.min(1, pt / .3); ball.position.set((T.cx ?? 0) * u, .12 + Math.sin(u * Math.PI) * .6 + u * 1.0, LOS + u * ((T.cz ?? LOS - 4.4) - LOS)); if (pt > .3) { ph = 'live'; pt = 0; } }
    else if (ph === 'live') {
      if (pt < 2.6 && !fly && !carrier) ball.position.set((T.cx ?? 0) + .25, 1.35, (T.cz ?? LOS - 4) + .2);
      else if (!fly && !carrier) { const tg = byPos(pl.tgt); const ex = tg.x + tg.vx * 1.1, ez = tg.z + tg.vz * 1.1; fly = { t: 0, d: 1.1, a: new THREE.Vector3((T.cx ?? 0), 2.2, (T.cz ?? LOS - 7)), b: new THREE.Vector3(ex, 1.3, ez), r: tg }; tCount = 0; }
      if (fly) { fly.t += dt; const u = Math.min(1, fly.t / fly.d); ball.position.lerpVectors(fly.a, fly.b, u); ball.position.y += Math.sin(u * Math.PI) * (2 + fly.a.distanceTo(fly.b) * .12); ball.rotation.z += dt * 18; pushTrail(ball.position); if (u >= 1) { carrier = fly.r; fly = null; carrier.catchT = 0; } }
      skill.forEach((q) => { if (q.role === 'line') { steer(q, q.fx * 1.05, LOS + q.fz - .9, 1.2, dt, false); faceTo(q, 0, dt); play(q, 'Push_Loop'); return; }
        if (q === carrier) { q.catchT += dt; if (q.catchT < .4) { q.vx *= .5; q.vz *= .5; play(q, 'Interact', 1.4, true); } else { steer(q, q.x + (q.x > 0 ? -1 : 1) * .5, Math.min(186, q.z + 6), 7, dt); play(q, 'Sprint_Loop', 1.1); } return; }
        if (q.route && q.ri < q.route.length) { const w = q.route[q.ri]; if (steer(q, w[0], w[1], q.route.length === 1 && q.route[0][1] - LOS < 3 ? 1.2 : 6.4, dt)) q.ri++; play(q, q.route.length === 1 && q.route[0][1] - LOS < 3 ? 'Push_Loop' : 'Sprint_Loop', 1.1); }
        else { q.vx *= .85; q.vz *= .85; faceTo(q, Math.atan2(ball.position.x - q.x, ball.position.z - q.z), dt); play(q, Math.hypot(q.vx, q.vz) > 1 ? 'Jog_Fwd_Loop' : 'Idle_Loop'); } });
      if (carrier) ball.position.set(carrier.x + Math.sin(carrier.yaw + .6) * .25, 1.15, carrier.z + Math.cos(carrier.yaw + .6) * .25);
      if ((carrier && carrier.catchT > 2.3) || pt > 9) { ph = 'dead'; pt = 0; } }
    else if (ph === 'dead') { skill.forEach((q) => { q.vx *= .8; q.vz *= .8; play(q, q === carrier ? 'Dance_Loop' : q.role === 'line' ? 'Idle_Loop' : 'Interact', 1, q !== carrier); }); if (carrier) ball.position.set(carrier.x, 1.2 + Math.abs(Math.sin(t * 6)) * .2, carrier.z);
      if (pt > 2.2) { ph = 'form'; pt = 0; carrier = null; mot = null; reps++; tCount = 0; trailG.setDrawRange(0, 0); T.players.forEach((q) => { q.h.clip = ''; }); nextPlay(); } }
    T.phase = ph; T.qbIsCruz = useCruz; ball.visible = visible; trail.visible = visible && tCount > 1; ov.visible = ov.visible && visible && T.overlay;
    T.players.forEach((q, i) => { q.x += q.vx * dt; q.z += q.vz * dt; q.x = Math.max(-30, Math.min(30, q.x)); q.z = Math.max(78, Math.min(195, q.z)); q.h.rig.position.set(q.x, 0, q.z); q.h.rig.rotation.set(Math.min(.2, Math.hypot(q.vx, q.vz) * .025), q.yaw, 0); q.h.rig.visible = visible;
      if (visible && (T.fr + i) % step === 0) q.h.mixer.update(dt * step); }); };
  T.ball = ball; return T; }
