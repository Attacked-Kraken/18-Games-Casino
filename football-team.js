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
  /* ---- procedural pose layer (applied after the mixer): aim bones at world directions ---- */
  const V3 = THREE.Vector3, _a = new V3(), _b = new V3(), _q = new THREE.Quaternion(), _wq = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _I = new THREE.Quaternion();
  const bonesOf = (h) => { if (h._B) return h._B; const B = {}; h.object.traverse((n) => { if (n.isBone) B[n.name] = n; }); return (h._B = B); };
  function aim(bone, child, dir, w) { if (!bone || !child || w <= 0) return; bone.updateWorldMatrix(true, true); bone.getWorldPosition(_a); child.getWorldPosition(_b); _b.sub(_a).normalize();
    _q.setFromUnitVectors(_b, dir); if (w < 1) _q.slerpQuaternions(_I, _q, w); bone.getWorldQuaternion(_wq); _wq.premultiply(_q); bone.parent.getWorldQuaternion(_pq); bone.quaternion.copy(_pq.invert().multiply(_wq)); bone.updateWorldMatrix(false, true); }
  function twist(bone, ang) { if (!bone || !ang) return; bone.updateWorldMatrix(true, false); _q.setFromAxisAngle(new V3(0, 1, 0), ang); bone.getWorldQuaternion(_wq); _wq.premultiply(_q); bone.parent.getWorldQuaternion(_pq); bone.quaternion.copy(_pq.invert().multiply(_wq)); bone.updateWorldMatrix(false, true); }
  const loc = (yaw, x, y, z) => new V3(x, y, z).normalize().applyAxisAngle(new V3(0, 1, 0), yaw);             /* character-local (+z fwd, -x = right hand side) -> world */
  function armPose(h, yaw, P, w) { const B = bonesOf(h); for (const s of ['r', 'l']) { const k = P[s]; if (!k) continue; aim(B['upperarm_' + s], B['lowerarm_' + s], loc(yaw, ...k[0]), w); aim(B['lowerarm_' + s], B['hand_' + s], loc(yaw, ...k[1]), w); } }
  const lerpP = (A, Bp, u) => { const o = {}; for (const s of ['r', 'l']) o[s] = [0, 1].map((j) => A[s][j].map((v, i) => v + (Bp[s][j][i] - v) * u)); return o; };
  /* throw keys: [time, pose, spine twist] — ball at the ear in both hands, step + wind-up, overhand whip, release, follow-through */
  const TK = [[0, { r: [[-.8, .05, -.25], [0, 1, .1]], l: [[-.35, -.25, .9], [-.75, .55, .3]] }, 0],
    [.32, { r: [[-.8, .3, -.55], [.05, .75, -.65]], l: [[.15, -.05, 1], [.1, .1, 1]] }, -.55],
    [.5, { r: [[-.55, .65, .45], [-.1, .55, 1]], l: [[.55, -.55, .35], [.35, -.8, -.1]] }, .35],
    [.78, { r: [[.25, -.45, .85], [.55, -.7, .4]], l: [[.6, -.75, -.1], [.3, -.9, .1]] }, .6]];
  const REL = .47;
  function throwPose(h, yaw, tt) { const B = bonesOf(h); let i = 0; while (i < TK.length - 2 && tt > TK[i + 1][0]) i++; const [t0, p0, s0] = TK[i], [t1, p1, s1] = TK[i + 1]; let u = Math.min(1, Math.max(0, (tt - t0) / (t1 - t0))); u = u * u * (3 - 2 * u);
    const w = tt > 1.0 ? Math.max(0, 1 - (tt - 1.0) / .35) : 1; twist(B.spine_03, (s0 + (s1 - s0) * u) * w); armPose(h, yaw, lerpP(p0, p1, u), w); }
  const HOLD = { r: [[-.35, -.6, .55], [-.15, .45, .9]], l: [[.35, -.6, .55], [.15, .45, .9]] };                              /* ball held at the chest during the drop */
  const TUCK = { r: [[-.3, -.95, .1], [.35, .05, 1]], l: null };
  const handPos = (h, s, out) => { const B = bonesOf(h); (B['hand_' + s] || h.object).getWorldPosition(out); return out; };
  function catchPose(q, bp, w) { const yaw = q.yaw, d = _a.copy(bp).sub(new V3(q.x, 1.35, q.z)).normalize(); const lr = (s) => d.clone().add(loc(yaw, s * .25, 0, 0)).normalize();
    const B = bonesOf(q.h); aim(B.upperarm_r, B.lowerarm_r, lr(-1), w); aim(B.lowerarm_r, B.hand_r, d, w); aim(B.upperarm_l, B.lowerarm_l, lr(1), w); aim(B.lowerarm_l, B.hand_l, d, w); }
  /* route overlay */
  const ov = new THREE.Group(); scene.add(ov); ov.visible = false;
  function drawOverlay(pl) { ov.clear(); Object.entries(pl.r).forEach(([k, pts]) => { const f = pl.f[k]; const arr = [new THREE.Vector3(f[0], .06, LOS + f[1])]; let x = f[0], z = LOS + f[1]; pts.forEach(([dx, dz]) => arr.push(new THREE.Vector3(f[0] + dx, .06, LOS + f[1] + dz)));
      const g = new THREE.BufferGeometry().setFromPoints(arr); const isT = k === pl.tgt; ov.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: RC[k] || 0xffffff, linewidth: 2 })));
      const end = arr[arr.length - 1], prev = arr[arr.length - 2]; const a = new THREE.Mesh(new THREE.ConeGeometry(isT ? .55 : .35, isT ? 1.1 : .7, 8), new THREE.MeshBasicMaterial({ color: RC[k] || 0xffffff })); a.position.copy(end); a.rotation.set(Math.PI / 2, 0, -Math.atan2(end.x - prev.x, end.z - prev.z)); ov.add(a);
      for (const p of arr) { const d = new THREE.Mesh(new THREE.CircleGeometry(isT ? .35 : .22, 12), new THREE.MeshBasicMaterial({ color: RC[k] || 0xffffff })); d.rotation.x = -Math.PI / 2; d.position.copy(p); ov.add(d); } }); ov.visible = true; }
  let ph = 'form', pt = 0, fly = null, carrier = null, mot = null; let reps = 0; T.drillT = 0; T.queue = null;
  const byPos = (p) => T.players.find((q) => q.pos === p);
  const play = (q, n, ts = 1, once) => { if (q.waveUntil > T.t && n !== 'Interact') return; if (q.h.clip !== n) { q.h.ts = ts; q.h.play(n, .2, once); } if (q.h.act) q.h.act.timeScale = ts; };
  function steer(q, tx, tz, sp, dt, face = true) { const ex = tx - q.x, ez = tz - q.z, d = Math.hypot(ex, ez); if (d < .25) { q.vx *= .6; q.vz *= .6; return true; } const k = Math.min(sp, d * 3) / d; q.vx += (ex * k - q.vx) * Math.min(1, dt * 6); q.vz += (ez * k - q.vz) * Math.min(1, dt * 6);
    if (face) { let dd = Math.atan2(ex, ez) - q.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); q.yaw += dd * Math.min(1, dt * 8); } return false; }
  const faceTo = (q, a, dt) => { let dd = a - q.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); q.yaw += dd * Math.min(1, dt * 6); };
  const cruzQB = () => cruz.ready && cruz.mode === 'field' && cruz.cmd === 'roam' && T.drillT <= 0;
  const SPD = { WR1: 7, WR2: 7, SL: 6.6, TE: 5.9, RB: 6, FB: 5.6 };
  function runRoute(q, dt, sp) { if (q.plant > 0) { q.plant -= dt; q.vx *= .5; q.vz *= .5; return; } const w = q.route[q.ri], ex = w[0] - q.x, ez = w[1] - q.z, d = Math.hypot(ex, ez);
    if (d < .35) { q.ri++; if (q.ri < q.route.length) q.plant = .09; return; } const k = sp / d, a = Math.min(1, dt * 12); q.vx += (ex * k - q.vx) * a; q.vz += (ez * k - q.vz) * a; q.yaw = Math.atan2(q.vx, q.vz); }   /* plant + break */
  function predict(q, T0) { let x = q.x, z = q.z, i = q.ri || 0, rem = T0 * (SPD[q.pos] || 6.4) * .92; const R = q.route || [];
    while (rem > 0 && i < R.length) { const ex = R[i][0] - x, ez = R[i][1] - z, d = Math.hypot(ex, ez); if (d <= rem) { x = R[i][0]; z = R[i][1]; rem -= d + .5; i++; } else { x += ex / d * rem; z += ez / d * rem; rem = 0; } } return new V3(x, 1.35, z); }
  T.qbH = () => (cruzQB() && cruz.h ? cruz.h : qb2.h); T.qbYaw = () => (cruzQB() && cruz.h ? cruz.h.rig.rotation.y : qb2.yaw);
  /* post-mixer poses + ball in hands */
  function qbPost(h, yaw) { if (ph === 'live') { const tt = T.tt ?? -1; if (tt < 0 || (tt < REL && pt < 1)) { armPose(h, yaw, HOLD, 1); } else if (tt < 1.4) throwPose(h, yaw, tt);
      if (!T.thrown && !carrier && !fly && !T.loose) { if (tt < 0) { handPos(h, 'r', _b); handPos(h, 'l', ball.position); ball.position.add(_b).multiplyScalar(.5); ball.quaternion.set(0, 0, 0, 1); ball.rotation.y = yaw + Math.PI / 2; } else { handPos(h, 'r', ball.position); ball.position.y += .03; } } } }
  function rcvPost(q) { if (q.catchW > 0 && (fly || q === carrier)) catchPose(q, fly ? ball.position : new V3(q.x + Math.sin(q.yaw) * .5, 1.3, q.z + Math.cos(q.yaw) * .5), q.catchW);
    if (q === carrier && (ph === 'live' || ph === 'dead')) { if (q.catchT < .35 && ph === 'live') { handPos(q.h, 'r', _b); handPos(q.h, 'l', ball.position); ball.position.add(_b).multiplyScalar(.5); }
      else { armPose(q.h, q.yaw, TUCK, 1); handPos(q.h, 'r', ball.position); ball.position.y += .04; ball.quaternion.set(0, 0, 0, 1); ball.rotation.set(0, q.yaw + Math.PI / 2, -.5); } } }
  cruz.postPose = (h) => { if (cruzQB()) qbPost(h, h.rig.rotation.y); };
  const PL = () => T.cur || FALLBACK; Object.defineProperty(T, 'active', { get: cruzQB });
  /* QB brain: returns a control for whoever is QB */
  const dropT = (pl) => pl.pa ? 1.5 : (pl.drop >= 4 ? 1.25 : .9);
  function qbCtl(dt, cx, cz) { const pl = PL(), qx = 0, qz = LOS - 4.4, drop = pl.drop || 3;
    if (ph === 'form' || ph === 'set') { const d = Math.hypot(cx - qx, cz - qz); return { x: qx, z: qz, speed: 3.6, anim: d > .5 ? 'Jog_Fwd_Loop' : 'Idle_Loop', face: d > .5 ? null : 0 }; }
    if (ph === 'snap') return { anim: 'Idle_Loop', face: 0 };
    if (ph === 'live') { const dT = dropT(pl), tt = pt - dT - .25;
      if (pl.pa && pt < dT) return { x: qx + (pt > .6 ? 3.2 : 0), z: qz - 1.4, speed: 4.2, anim: pt > .6 ? 'Jog_Fwd_Loop' : 'Idle_Loop', face: pt > .6 ? null : 0 };
      if (pt < dT) return { x: qx, z: qz - drop, speed: drop / dT * 1.15, anim: 'Walk_Loop', ts: -1.7, back: true, face: 0 };                 /* 3/5-step drop */
      const a = T.aimA ?? 0; if (tt > .28 && tt < .55) return { x: cx + Math.sin(a) * .5, z: cz + Math.cos(a) * .5, speed: 1.6, anim: 'Idle_Loop', face: a, back: true };   /* step into the throw */
      return { anim: 'Idle_Loop', face: a }; }
    return { anim: carrier ? 'Interact' : 'Idle_Loop', once: true, face: 0 }; }
  T.cruzCtl = (dt, cx, cz) => { T.cx = cx; T.cz = cz; return qbCtl(dt, cx, cz); };
  function nextPlay() { if (T.queue != null && T.book[T.queue]) { T.cur = T.book[T.queue]; T.overlay = true; T.queue = null; } else { T.overlay = false; T.cur = T.book.length ? T.book[Math.floor(Math.random() * T.book.length)] : FALLBACK; }
    ov.visible = false; if (T.overlay) drawOverlay(T.cur); T.onPlay && T.onPlay(T.cur, T.overlay); }
  function setRoutes() { const pl = PL(); T.players.forEach((q) => { const r = pl.r[q.pos], f = pl.f[q.pos]; if (!f) { q.route = null; return; } const bx = mot && mot.q === q ? q.x : f[0], bz = mot && mot.q === q ? q.z - LOS : f[1]; q.route = r ? r.map(([dx, dz]) => [bx + dx, LOS + bz + dz]) : null; q.ri = 0; }); }
  T.runPlay = (id) => { T.queue = id; if (ph === 'live' || ph === 'dead') return; ph = 'form'; pt = 0; nextPlay(); };
  T.setPlay = T.runPlay;
  nextPlay();
  T.update = (dt, t, visible) => { T.t = t; const step = mobile ? 2 : 1; T.fr = (T.fr || 0) + 1; const pl = PL();
    if (reps >= 6 && T.queue == null) { T.drillT += dt; if (T.drillT > 28) { reps = 0; T.drillT = 0; } } /* Cruz drill break; backup QB keeps practice going */
    const useCruz = cruzQB(); const qbq = useCruz ? null : qb2;
    if (useCruz) { steer(qb2, -27, LOS - 2, 3, dt); play(qb2, Math.hypot(qb2.vx, qb2.vz) > .4 ? 'Jog_Fwd_Loop' : 'Idle_Loop'); if (Math.hypot(qb2.vx, qb2.vz) < .3) faceTo(qb2, Math.PI / 2, dt); }
    else { const c = qbCtl(dt, qb2.x, qb2.z); if (c.anim) play(qb2, c.anim, c.ts || 1, c.once); if (c.x != null) steer(qb2, c.x, c.z, c.speed || 0, dt, !c.back); else { qb2.vx *= .5; qb2.vz *= .5; } if (c.face != null) faceTo(qb2, c.face, dt); T.cx = qb2.x; T.cz = qb2.z; }
    const skill = T.players.filter((q) => q.role !== 'qb'); pt += dt;
    if (ph === 'form') { let ok = true; skill.forEach((q) => { const f = q.role === 'line' ? [q.fx, q.fz] : pl.f[q.pos]; const d = !steer(q, f[0], LOS + f[1], 4.6, dt); if (d) ok = false; else faceTo(q, 0, dt); play(q, d ? 'Jog_Fwd_Loop' : (q.role === 'line' ? 'Crouch_Idle_Loop' : 'Idle_Loop')); });
      if (!fly && !carrier) ball.position.set(0, .12, LOS); if ((ok && Math.hypot((T.cx ?? 0), (T.cz ?? 0) - (LOS - 4.4)) < .9) || pt > 10) { ph = 'set'; pt = 0; mot = pl.m ? { q: byPos(pl.m.p), to: pl.m.to } : null; } }
    else if (ph === 'set') { skill.forEach((q) => { if (mot && mot.q === q) { steer(q, mot.to[0], LOS + mot.to[1], 5, dt); play(q, 'Jog_Fwd_Loop'); return; } faceTo(q, 0, dt); play(q, q.role === 'line' || q.pos === 'WR1' || q.pos === 'WR2' ? 'Crouch_Idle_Loop' : 'Idle_Loop'); q.vx = q.vz = 0; }); if (pt > (mot ? 1.8 : 1.2)) { ph = 'snap'; pt = 0; setRoutes(); } }
    else if (ph === 'snap') { const u = Math.min(1, pt / .3); ball.position.set((T.cx ?? 0) * u, .12 + Math.sin(u * Math.PI) * .6 + u * 1.0, LOS + u * ((T.cz ?? LOS - 4.4) - LOS)); if (pt > .3) { ph = 'live'; pt = 0; } }
    else if (ph === 'live') { const dT = dropT(pl), tt = pt - dT - .25; T.tt = tt; const tg = byPos(pl.tgt);
      if (tt < .1) T.aimA = Math.atan2(tg.x - (T.cx ?? 0), tg.z - (T.cz ?? LOS - 6));
      if (!fly && !carrier && !T.loose && tt >= REL && !T.thrown) { T.thrown = true; const from = handPos(T.qbH(), 'r', new V3()); let p = new V3(tg.x, 1.35, tg.z), Tf = .8;
        for (let k = 0; k < 3; k++) { p = predict(tg, Tf); Tf = Math.min(1.5, Math.max(.45, from.distanceTo(p) / 18)); }
        const r = Math.random(), out = r < .09 ? 'over' : r < .21 ? 'drop' : 'catch'; if (out === 'over') p.add(p.clone().sub(from).setY(0).normalize().multiplyScalar(3.5)); p.y = out === 'over' ? 2.3 : 1.35;
        fly = { t: 0, d: Tf, a: from, b: p, r: tg, out, prev: from.clone() }; tCount = 0; T.result = out; }
      if (fly) { fly.t += dt; const u = Math.min(1, fly.t / fly.d); ball.position.lerpVectors(fly.a, fly.b, u); ball.position.y += Math.sin(u * Math.PI) * (.6 + fly.a.distanceTo(fly.b) * .08);
        const v = ball.position.clone().sub(fly.prev); fly.prev.copy(ball.position); if (v.lengthSq() > 1e-8) { ball.quaternion.setFromUnitVectors(new V3(1, 0, 0), v.normalize()); fly.spin = (fly.spin || 0) + dt * 38; ball.rotateX(fly.spin); }
        pushTrail(ball.position); const rc = fly.r; rc.catchW = Math.min(1, Math.max(0, (fly.t - (fly.d - .5)) / .35));
        if (u >= 1) { if (fly.out === 'catch') { carrier = rc; carrier.catchT = 0; } else { T.loose = { t: 0, v: fly.out === 'over' ? v.clone().multiplyScalar(13).setY(-1) : new V3((Math.random() - .5) * 2, 2.8, -1.5 * Math.cos(rc.yaw)) }; rc.drop = fly.out === 'drop'; rc.catchW = 0; if (rc.drop) { rc.h.clip = ''; play(rc, 'Hit_Chest', 1, true); rc.waveUntil = T.t + .9; } }
          fly = null; } }
      if (T.loose) { const L = T.loose; L.t += dt; L.v.y -= 9.8 * dt; ball.position.addScaledVector(L.v, dt); if (ball.position.y < .1) { ball.position.y = .1; L.v.y = Math.abs(L.v.y) * .4; L.v.x *= .6; L.v.z *= .6; } ball.rotation.x += dt * 9; pushTrail(ball.position); }
      skill.forEach((q) => { if (q.role === 'line') { steer(q, q.fx * 1.12, LOS + q.fz - 1.1 - Math.abs(q.fx) * .12, 1.6, dt, false); faceTo(q, 0, dt); play(q, 'Push_Loop'); return; }    /* pass-pro pocket */
        if (q === carrier) { q.catchT += dt; q.catchW = Math.max(0, 1 - q.catchT * 3); if (q.catchT < .35) { q.vx *= .7; q.vz *= .7; play(q, 'Idle_Loop'); } else { steer(q, q.x + (q.x > 0 ? -1 : 1) * .5, Math.min(186, q.z + 6), 7.2, dt); play(q, 'Sprint_Loop', 1.15); } return; }
        if (fly && q === fly.r && fly.t > fly.d - .55) { steer(q, fly.b.x, fly.b.z, 6.5, dt, false); faceTo(q, Math.atan2(fly.a.x - q.x, fly.a.z - q.z) * .5 + Math.atan2(q.vx, q.vz) * .5, dt); play(q, 'Jog_Fwd_Loop'); return; }   /* turn head + shoulders to the ball */
        const block = q.route && q.route.length === 1 && q.route[0][1] - LOS < 3; if (block) { steer(q, q.route[0][0], q.route[0][1], 1.4, dt); play(q, 'Push_Loop'); return; }
        if (q.route && q.ri < q.route.length) { runRoute(q, dt, SPD[q.pos] || 6.4); play(q, q.plant > 0 ? 'Jog_Fwd_Loop' : 'Sprint_Loop', 1.1); }
        else { q.vx *= .85; q.vz *= .85; if (!q.drop) faceTo(q, Math.atan2(ball.position.x - q.x, ball.position.z - q.z), dt); play(q, Math.hypot(q.vx, q.vz) > 1 ? 'Jog_Fwd_Loop' : 'Idle_Loop'); } });
      if ((carrier && carrier.catchT > 2.6) || (T.loose && T.loose.t > 1.8) || pt > 11) { ph = 'dead'; pt = 0; } }
    else if (ph === 'dead') { skill.forEach((q) => { q.vx *= .8; q.vz *= .8; play(q, q === carrier ? 'Idle_Loop' : q.role === 'line' ? 'Idle_Loop' : 'Interact', 1, q !== carrier); }); 
      if (pt > 2.2) { ph = 'form'; pt = 0; carrier = null; mot = null; reps++; T.thrown = false; T.loose = null; T.tt = -1; T.players.forEach((q) => { q.catchW = 0; q.drop = false; q.plant = 0; }); tCount = 0; trailG.setDrawRange(0, 0); T.players.forEach((q) => { q.h.clip = ''; }); nextPlay(); } }
    if (T.boss && (ph === 'dead' || ph === 'form')) { const [bx, bz] = T.boss; T.players.forEach((q) => { const d = Math.hypot(bx - q.x, bz - q.z); if (d < 9 && q !== carrier && Math.hypot(q.vx, q.vz) < .6) { faceTo(q, Math.atan2(bx - q.x, bz - q.z), dt); if (!q.waved || t - q.waved > 20) { q.waved = t; q.waveUntil = t + 1.8; q.h.clip = ''; play(q, 'Interact', 1, true); } } }); }
    T.phase = ph; T.qbIsCruz = useCruz; ball.visible = visible; trail.visible = visible && tCount > 1; ov.visible = ov.visible && visible && T.overlay;
    T.players.forEach((q, i) => { q.x += q.vx * dt; q.z += q.vz * dt; q.x = Math.max(-30, Math.min(30, q.x)); q.z = Math.max(78, Math.min(195, q.z)); q.h.rig.position.set(q.x, 0, q.z); q.h.rig.rotation.set(Math.min(.2, Math.hypot(q.vx, q.vz) * .025), q.yaw, 0); q.h.rig.visible = visible;
      if (visible && (T.fr + i) % step === 0) { q.h.mixer.update(dt * step); q.h.rig.updateMatrixWorld(true); if (q === qb2 && !useCruz) qbPost(q.h, q.yaw); else if (q.role !== 'line') rcvPost(q); } }); };
  T.ball = ball; return T; }
