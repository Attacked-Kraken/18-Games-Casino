/* Cruz Field offense: 10 teammates (original "M" purple/gold branding) + Cruz at QB. Line up in shotgun, snap, run plays
   (routes, line blocking, QB drop-back, ball arc, catch, run after catch, celebrate) and reset; rotates plays.
   Shares the Cruz rig/clips; mixers tick only while the stadium is drawn (half-rate on phones). */
const ROSTER = [['C', 'BELL', 63, 0, -.7, 'line'], ['LG', 'ODOM', 66, -1.35, -.8, 'line'], ['RG', 'PIKE', 67, 1.35, -.8, 'line'], ['LT', 'VOSS', 71, -2.7, -.95, 'line'], ['RT', 'KANE', 74, 2.7, -.95, 'line'],
  ['TE', 'REED', 88, 4.1, -1.0, 'skill'], ['WR1', 'NASH', 1, -15, -.8, 'skill'], ['WR2', 'LOPE', 11, 15, -.8, 'skill'], ['SL', 'DIAZ', 17, -9, -1.4, 'skill'], ['RB', 'HALE', 22, 1.1, -5.2, 'skill'], ['FB', 'MOSS', 44, -1.2, -3.4, 'skill']];
const PLAYS = [
  { name: 'Slant', tgt: 'WR1', r: { WR1: [[0, 4], [5, 10]], WR2: [[0, 26]], SL: [[0, 7], [-6, 7]], TE: [[0, 14]], RB: [[4, 1], [9, 3]], FB: [[-1, 1.6]] } },
  { name: 'Post', tgt: 'WR2', r: { WR2: [[0, 11], [-7, 24]], WR1: [[0, 10], [0, 8]], SL: [[0, 3], [14, 5]], TE: [[0, 6], [6, 6]], RB: [[-5, 0], [-9, 3]], FB: [[1, 1.6]] } },
  { name: 'Seam', tgt: 'TE', r: { TE: [[0, 6], [-1, 18]], WR1: [[0, 18]], WR2: [[0, 7], [-4, 9]], SL: [[0, 9], [-6, 15]], RB: [[3, 0.5], [1, 3]], FB: [[-1, 1.6]] } },
  { name: 'Wheel', tgt: 'RB', r: { RB: [[6, 0], [9, 4], [9, 16]], WR2: [[0, 8], [-5, 8]], WR1: [[0, 12], [6, 18]], SL: [[0, 5], [8, 6]], TE: [[0, 2], [-1, 2]], FB: [[1, 1.6]] } }];
export function createTeam(ctx) { const { THREE, scene, cruz, stadium, mobile } = ctx; const C = cruz.C; const LOS = 110; const T = { active: false, players: [], phase: 'form', play: 0 };
  const skins = [1, 2, 3, 4, 5, 2, 3, 4, 1, 5, 3];
  ROSTER.forEach(([pos, name, num, fx, fz, role], i) => { const h = C.make({ num, name, skin: skins[i], h: role === 'line' ? 1.98 : 1.9 }); h.rig.rotation.order = 'YXZ'; scene.add(h.rig); h.play('Idle_Loop', 0); h.mixer.setTime(i * .3);
    T.players.push({ pos, name, role, fx, fz, h, x: fx * .5 - 6, z: LOS - 8 + (i % 3), yaw: 0, vx: 0, vz: 0, route: null, ri: 0 }); });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshStandardMaterial({ color: 0x6a2e12, roughness: .5 })); ball.scale.set(1, .62, .62); scene.add(ball); ball.position.set(0, .12, LOS);
  let ph = 'form', pt = 0, plays = 0, fly = null, carrier = null, qbT = 0; const byPos = (p) => T.players.find((q) => q.pos === p);
  const play = (q, n, ts = 1, once) => { if (q.h.clip !== n) { q.h.ts = ts; q.h.play(n, .2, once); } if (q.h.act) q.h.act.timeScale = ts; };
  function steer(q, tx, tz, sp, dt, face = true) { const ex = tx - q.x, ez = tz - q.z, d = Math.hypot(ex, ez); if (d < .25) { q.vx *= .6; q.vz *= .6; return true; } const k = Math.min(sp, d * 3) / d; q.vx += (ex * k - q.vx) * Math.min(1, dt * 6); q.vz += (ez * k - q.vz) * Math.min(1, dt * 6);
    if (face) { let dd = Math.atan2(ex, ez) - q.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); q.yaw += dd * Math.min(1, dt * 8); } return false; }
  const faceTo = (q, a, dt) => { let dd = a - q.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); q.yaw += dd * Math.min(1, dt * 6); };
  const P = () => PLAYS[T.play % PLAYS.length];
  T.cruzCtl = (dt, cx, cz) => { const qx = 0, qz = LOS - 4.4; T.cx = cx; T.cz = cz;
    if (ph === 'form' || ph === 'set') { const d = Math.hypot(cx - qx, cz - qz); return { x: qx, z: qz, speed: 3.6, anim: d > .5 ? 'Jog_Fwd_Loop' : 'Idle_Loop', face: d > .5 ? null : 0 }; }
    if (ph === 'snap') return { anim: 'Idle_Loop', face: 0 };
    if (ph === 'live') { if (pt < 1.0) return { x: qx, z: qz - 2.8, speed: 3, anim: 'Walk_Loop', ts: -1.5, back: true, face: 0 };
      const tg = byPos(P().tgt), a = Math.atan2(tg.x - cx, tg.z - cz); if (pt < 2.0) return { anim: 'Idle_Loop', face: a }; if (pt < 2.9) return { anim: 'Spell_Simple_Shoot', once: true, face: a }; return { anim: 'Idle_Loop', face: a }; }
    return { anim: carrier ? 'Interact' : 'Idle_Loop', once: true, face: 0 }; };
  function setRoutes() { const pl = P(); T.players.forEach((q) => { const r = pl.r[q.pos]; q.route = r ? r.map(([dx, dz]) => [q.fx + dx, LOS + q.fz + dz]) : null; q.ri = 0; }); }
  T.update = (dt, t, visible) => { const step = mobile ? 2 : 1; T.fr = (T.fr || 0) + 1;
    if (plays >= 4) { T.drillT = (T.drillT || 0) + dt; if (T.drillT > 28) { plays = 0; T.drillT = 0; } } /* every 4 plays Cruz runs a drill block */
    T.active = cruz.mode === 'field' && cruz.cmd === 'roam' && plays < 4;
    if (!T.active) { T.players.forEach((q) => { steer(q, q.fx * .4 - 10, LOS - 9 + (q.fz * .3), 2.4, dt); play(q, Math.hypot(q.vx, q.vz) > .4 ? 'Jog_Fwd_Loop' : 'Idle_Loop'); }); }
    else { pt += dt;
      if (ph === 'form') { let ok = true; T.players.forEach((q) => { const d = !steer(q, q.fx, LOS + q.fz, 4.2, dt); if (d) ok = false; else faceTo(q, 0, dt); play(q, d ? 'Jog_Fwd_Loop' : (q.role === 'line' ? 'Crouch_Idle_Loop' : 'Idle_Loop')); });
        if (!fly && !carrier) ball.position.set(0, .12, LOS); if ((ok && Math.hypot((T.cx ?? 0) - 0, (T.cz ?? 0) - (LOS - 4.4)) < .8) || pt > 9) { ph = 'set'; pt = 0; } }
      else if (ph === 'set') { T.players.forEach((q) => { faceTo(q, 0, dt); play(q, q.role === 'line' || q.pos === 'WR1' || q.pos === 'WR2' ? 'Crouch_Idle_Loop' : 'Idle_Loop'); q.vx = q.vz = 0; }); if (pt > 1.3) { ph = 'snap'; pt = 0; setRoutes(); } }
      else if (ph === 'snap') { const u = Math.min(1, pt / .3); ball.position.set(0, .12 + Math.sin(u * Math.PI) * .6 + u * 1.0, LOS + u * -4.2); if (pt > .3) { ph = 'live'; pt = 0; } }
      else if (ph === 'live') { const pl = P();
        if (pt < 2.6) { ball.position.set((T.cx ?? 0) + .25, 1.35, (T.cz ?? LOS - 4) + .2); }
        else if (!fly && !carrier) { const tg = byPos(pl.tgt); const ex = tg.x + tg.vx * 1.1, ez = tg.z + tg.vz * 1.1; fly = { t: 0, d: 1.1, a: new THREE.Vector3((T.cx ?? 0), 2.2, (T.cz ?? LOS - 7)), b: new THREE.Vector3(ex, 1.3, ez), r: tg }; }
        if (fly) { fly.t += dt; const u = Math.min(1, fly.t / fly.d); ball.position.lerpVectors(fly.a, fly.b, u); ball.position.y += Math.sin(u * Math.PI) * (2 + fly.a.distanceTo(fly.b) * .12); ball.rotation.x += dt * 16; if (u >= 1) { carrier = fly.r; fly = null; carrier.catchT = 0; } }
        T.players.forEach((q) => { if (q.role === 'line') { steer(q, q.fx * 1.05, LOS + q.fz - .9, 1.2, dt, false); faceTo(q, 0, dt); play(q, 'Push_Loop'); return; }
          if (q === carrier) { q.catchT += dt; if (q.catchT < .4) { q.vx *= .5; q.vz *= .5; play(q, 'Interact', 1.4, true); } else { steer(q, q.x + (q.x > 0 ? -1 : 1) * .5, Math.min(186, q.z + 6), 7, dt); play(q, 'Sprint_Loop', 1.1); } return; }
          if (q.route && q.ri < q.route.length) { const w = q.route[q.ri]; if (steer(q, w[0], w[1], 6.4, dt)) q.ri++; play(q, 'Sprint_Loop', 1.1); }
          else if (q.pos === 'FB' || q.pos === 'RB') { q.vx *= .8; q.vz *= .8; faceTo(q, 0, dt); play(q, 'Push_Loop'); } else { q.vx *= .85; q.vz *= .85; faceTo(q, Math.atan2(ball.position.x - q.x, ball.position.z - q.z), dt); play(q, Math.hypot(q.vx, q.vz) > 1 ? 'Jog_Fwd_Loop' : 'Idle_Loop'); } });
        if (carrier) ball.position.set(carrier.x + Math.sin(carrier.yaw + .6) * .25, 1.15, carrier.z + Math.cos(carrier.yaw + .6) * .25);
        if ((carrier && carrier.catchT > 2.3) || pt > 9) { ph = 'dead'; pt = 0; } }
      else if (ph === 'dead') { T.players.forEach((q) => { q.vx *= .8; q.vz *= .8; play(q, q === carrier ? 'Dance_Loop' : q.role === 'line' ? 'Idle_Loop' : 'Interact', 1, q !== carrier); }); if (carrier) ball.position.set(carrier.x, 1.2 + Math.abs(Math.sin(t * 6)) * .2, carrier.z);
        if (pt > 2.2) { ph = 'form'; pt = 0; carrier = null; if (T.queue != null) { T.play = T.queue; T.queue = null; } else T.play++; plays++; T.players.forEach((q) => { q.h.clip = ''; }); } } }
    T.phase = ph; const vis = visible; ball.visible = vis;
    T.players.forEach((q, i) => { q.x += q.vx * dt; q.z += q.vz * dt; q.x = Math.max(-30, Math.min(30, q.x)); q.z = Math.max(78, Math.min(195, q.z)); q.h.rig.position.set(q.x, 0, q.z); q.h.rig.rotation.set(Math.min(.2, Math.hypot(q.vx, q.vz) * .025), q.yaw, 0); q.h.rig.visible = vis;
      if (vis && (T.fr + i) % step === 0) q.h.mixer.update(dt * step); }); };
  T.PLAYS = PLAYS.map((p) => p.name); T.queue = null; T.setPlay = (i) => { T.queue = i; };
  return T; }
