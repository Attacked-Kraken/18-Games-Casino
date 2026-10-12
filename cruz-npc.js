/* Cruz (#12 QB) roaming the casino as an autonomous athlete: A* routes across the floors, football moves to dodge
   guests (jump-cut, juke, 360 spin, stiff-arm, hurdle) with near misses only, sprint/jog mix, rare trips/dives with a
   get-up, celebrations, procedural lean/bank. Can be sent to Cruz Field for QB drills and workouts, and brought back. */
import { loadCruz } from './characters/football-cruz/cruz.js';
import { STAD } from './stadium.js';
export function createCruz(ctx) { const { THREE, scene, collide, people, stadium } = ctx; const api = { ready: false, x: 0, z: 50, on: true, mode: 'casino', update() {} };
  let S = {}; try { S = JSON.parse(localStorage.getItem('gc18_cruz') || '{}'); } catch (e) {} api.on = S.on !== false; const wantField = !!S.field;
  const save = () => { try { localStorage.setItem('gc18_cruz', JSON.stringify({ on: api.on, field: api.mode === 'field' || api.mode === 'toField' })); } catch (e) {} };
  const rnd = Math.random; const ext = { x: 0, z: 50, on: true }; 
  loadCruz(THREE, 'characters/football-cruz/').then((C) => { const h = C.make(); const rig = h.rig; rig.rotation.order = 'YXZ'; scene.add(rig); const nav = people.nav; (people.extra || (people.extra = [])).push(ext);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.17, 14, 10), new THREE.MeshStandardMaterial({ color: 0x8a3a14, roughness: .45, emissive: 0x2a0c02 })); ball.scale.set(1, .62, .62); ball.visible = false; scene.add(ball); let fly = null;
    let x = 0, z = 50, yaw = Math.PI, vx = 0, vz = 0, route = null, wi = 0, st = 'run', stT = 0, move = null, moveT = 0, boost = 0, nextFall = 30 + rnd() * 30, chk = 3, cx0 = x, cz0 = z, lastYaw = yaw, bank = 0, y = 0, spin = 0, cool = 0, sprintT = 0;
    const casinoOK = (px, pz) => pz < 58.5;
    const pickRoute = (tx, tz) => { if (!nav) return; for (let k = 0; k < 5; k++) { let d = tx != null ? [tx, tz] : nav.random(rnd, (a, b) => casinoOK(a, b) && Math.hypot(a - x, b - z) > 18); if (!d) continue; const r = nav.path(x, z, d[0], d[1]); if (r && r.length) { route = r; wi = 0; return true; } } route = null; return false; };
    if (nav) { const s = nav.random(rnd, (a, b) => b > 22 && b < 50); if (s) { x = s[0]; z = s[1]; } }
    api.mode = 'casino'; pickRoute();
    const play = (n, f = .2, once, ts = 1) => { if (h.clip !== n) { h.ts = ts; h.play(n, f, once); } if (h.act) h.act.timeScale = ts; };
    /* ---- field routines ---- */
    let tasks = [], task = null, tT = 0; const sp = () => stadium.spots;
    function routine(name) { const s = sp(), T = []; const go = (px, pz, speed = 3.6, anim = 'Jog_Fwd_Loop', ts = 1, back) => T.push({ k: 'go', x: px, z: pz, speed, anim, ts, back }); const an = (n, d, extra) => T.push(Object.assign({ k: 'anim', n, d }, extra || {}));
      if (name === 'qb') { const [qx, qz] = s.qb; go(qx, qz); for (let i = 0; i < 3; i++) { an('Idle_Loop', .4, { face: 0 }); go(qx, qz - 4.5, 2.6, 'Walk_Loop', -1.5, true); an('Idle_Loop', .35, { face: 0 }); T.push({ k: 'throw', tgt: stadium.targets[i % stadium.targets.length] }); an('Idle_Loop', .8, { face: 0 }); go(qx, qz, 3.2); } }
      if (name === 'cones') { const c = s.cones; go(c[0][0] - 1.5, c[0][1] - 2); c.forEach(([cx, cz], i) => go(cx + (i % 2 ? .9 : -.9), cz, 4.4)); go(c[c.length - 1][0], c[c.length - 1][1] + 3, 5.5, 'Sprint_Loop'); }
      if (name === 'ladder') { const [lx, l0, l1] = s.ladder; go(lx, l0 - 1.5); go(lx, l1 + .8, 2.0, 'Jog_Fwd_Loop', 1.9); }
      if (name === 'sprint') { const [[ax, az], [bx, bz]] = s.sprint; go(ax, az); an('Idle_Loop', .6, { face: 0 }); go(bx, bz, 7.6, 'Sprint_Loop', 1.15); go(bx, bz - 25, 3.4); }
      if (name === 'pushups') { go(4, 120); T.push({ k: 'pushups', d: 6 }); }
      if (name === 'tires') { const tz = s.tires; go(tz[0][0], tz[0][1] - 2); tz.forEach(([tx, tz2]) => go(tx, tz2, 2.4, 'Jog_Fwd_Loop', 1.8)); }
      if (name === 'sled') { const [sx, sz] = s.sled; go(sx, sz - 3); go(sx, sz, 1.5, 'Push_Loop'); an('Push_Loop', 2.5, { face: 0 }); }
      if (name === 'stretch') { an('Fixing_Kneeling', 3.2); an('Idle_Loop', 1.2); }
      if (name === 'celebrate') { an('Dance_Loop', 2.6); an('Spell_Simple_Shoot', 1.2, { once: 1 }); }
      return T; }
    const ORDER = ['qb', 'cones', 'ladder', 'sprint', 'pushups', 'tires', 'qb', 'sled', 'stretch', 'celebrate']; let oi = 0;
    function nextTask() { if (!tasks.length) tasks = routine(ORDER[oi++ % ORDER.length]); task = tasks.shift(); tT = 0; }
    function throwBall(tg) { ball.visible = true; fly = { t: 0, d: 1.25, a: new THREE.Vector3(x + Math.sin(yaw) * .3, 2.3, z + Math.cos(yaw) * .3), b: new THREE.Vector3(tg[0], tg[1], tg[2]) }; }
    api.sendToField = () => { if (api.mode === 'field' || api.mode === 'toField') return; api.mode = 'toField'; pickRoute(0, 58.8); st = 'run'; save(); };
    api.bringBack = () => { if (api.mode === 'casino') return; api.mode = 'toCasino'; tasks = []; task = null; st = 'run'; save(); };
    api.setOn = (v) => { api.on = v; save(); };
    /* player commands (menu): come / follow / stay / roam, speed, moves, pass */
    api.cmd = 'roam'; api.spd = 'auto'; let ppos = null, repT = 0, fo = null;
    const inStad = (pz) => pz > 60.2;
    api.command = (c) => { api.cmd = c; repT = 0; route = null; if (c === 'roam' && api.mode === 'casino') pickRoute(); if ((c === 'come' || c === 'follow') && (api.mode === 'field' || api.mode === 'toCasino') && ppos && !inStad(ppos.z)) api.bringBack(); if (c === 'field') { api.cmd = 'roam'; api.sendToField(); } };
    api.setSpeed = (s) => { api.spd = s; };
    api.doMove = (k) => { if (st !== 'run') return; if (k === 'celebrate' || k === 'wave') { st = 'celebrate'; stT = k === 'wave' ? 1.6 : 2.4; h.clip = ''; play(k === 'wave' ? 'Interact' : 'Dance_Loop', .15, k === 'wave'); return; }
      const s = rnd() < .5 ? -1 : 1; move = { kind: k, s, t: 0, d: { hurdle: .75, juke: .4, spin: .55 }[k] || .5 }; moveT = move.d; cool = move.d + .5; if (k === 'hurdle') play('Jump_Loop', .1); };
    api.throwPass = () => { if (st !== 'run') return; st = 'celebrate'; stT = .9; h.clip = ''; play('Spell_Simple_Shoot', .1, true); setTimeout(() => { let tx = x + Math.sin(yaw) * 14, tz = z + Math.cos(yaw) * 14; const c = collide(tx, tz); throwBall([c[0], 1.2, c[1]]); }, 350); };
    const fx0 = (pz) => pz; 
    if (wantField) { api.mode = 'field'; x = 0; z = 90; }
    const sepFrom = (r0, hard) => { for (const q of people.list) { const qx = q.o.position.x, qz = q.o.position.z, ex = x - qx, ez = z - qz, d = Math.hypot(ex, ez); if (d < r0 && d > 1e-4) { if (hard) { const c = collide(qx + ex / d * r0, qz + ez / d * r0); x = c[0]; z = c[1]; } else { vx += ex / d * (r0 - d) * 6; vz += ez / d * (r0 - d) * 6; } } } };
    function steerTo(tx, tz, speed, dt, face = true) { const ex = tx - x, ez = tz - z, d = Math.hypot(ex, ez); if (d < .35) return true; const k = Math.min(speed, d * 4) / d; vx += (ex * k - vx) * Math.min(1, dt * 6); vz += (ez * k - vz) * Math.min(1, dt * 6); if (face) turn(Math.atan2(ex, ez), dt, 8); return false; }
    const turn = (ty, dt, r) => { let dd = ty - yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); yaw += dd * Math.min(1, dt * r); };
    function casinoStep(dt, pos) {
      if (st === 'trip' || st === 'down' || st === 'getup') { stT -= dt; vx *= Math.pow(.05, dt); vz *= Math.pow(.05, dt); if (stT <= 0) { if (st === 'trip') { st = 'down'; stT = .9; } else if (st === 'down') { st = 'getup'; stT = 1.3; play('Fixing_Kneeling', .35); } else { st = 'run'; boost = 1.2; } } return; }
      if (st === 'celebrate') { stT -= dt; vx = vz = 0; if (stT <= 0) st = 'run'; return; }
      if (fo) { fo = null; }
      if (api.cmd !== 'roam' && ppos && api.mode === 'casino') { const dP = Math.hypot(ppos.x - x, ppos.z - z);
        if (api.cmd === 'stay' || dP < 2.3) { vx *= Math.pow(.02, dt); vz *= Math.pow(.02, dt); if (dP < 10) turn(Math.atan2(ppos.x - x, ppos.z - z), dt, 5); if (!move) play('Idle_Loop', .3); if (api.cmd === 'come' && dP < 2.3) api.cmd = 'stay'; return; }
        if (inStad(ppos.z)) { if (api.mode === 'casino' && (!route || repT <= 0)) { pickRoute(0, 58.8); api.mode = 'toField'; repT = 99; } }
        else if ((repT -= dt) <= 0 || !route || wi >= route.length) { repT = 1.2; const n = nav && nav.nearest(ppos.x - Math.sin(ppos.yaw || 0) * 0, ppos.z); if (n) { const r = nav.path(x, z, n[0], n[1]); if (r && r.length) { route = r; wi = 0; } } } }
      const w = route && route[wi]; let fx = Math.sin(yaw), fz = Math.cos(yaw);
      if (!w) { if (api.mode === 'toField') { api.mode = 'tunnel'; route = [[0, STAD.tz1 + 2], [0, 92]]; wi = 0; } else pickRoute(); }
      else { const ex = w[0] - x, ez = w[1] - z, d = Math.hypot(ex, ez); if (d < .6) { wi++; if (api.mode === 'tunnel' && wi >= route.length) { api.mode = 'field'; tasks = []; nextTask(); save(); } }
        else { fx = ex / d; fz = ez / d; } }
      if (sprintT <= 0 && rnd() < dt * .08) sprintT = 2 + rnd() * 3; sprintT -= dt; boost -= dt; moveT -= dt; cool -= dt;
      const speed = api.spd === 'walk' ? 1.5 : api.spd === 'jog' ? 3.6 : api.spd === 'sprint' ? 6.4 : (boost > 0 || sprintT > 0) ? 6.2 : 3.6; let lx = 0, lz = 0;
      /* look ahead for a guest in the lane */
      if (moveT <= 0 && cool <= 0) { let best = null, bd = 2.8; for (const q of people.list) { const qx = q.o.position.x - x, qz = q.o.position.z - z, f = qx * fx + qz * fz, l = qx * fz - qz * fx; if (f > .3 && f < bd && Math.abs(l) < 1.1) { bd = f; best = { q, l }; } }
        if (best) { const side = best.l > 0 ? -1 : 1; const ok = (s) => { const tx = x + fz * s * 1.6, tz = z - fx * s * 1.6, c = collide(tx, tz); return Math.hypot(c[0] - tx, c[1] - tz) < .05; }; const s = ok(side) ? side : -side;
          const r = rnd(), kind = best.q.kind === 'walk' && r < .16 ? 'hurdle' : r < .36 ? 'juke' : r < .56 ? 'spin' : r < .76 ? 'stiff' : 'cut'; move = { kind, s, t: 0, d: { hurdle: .75, juke: .4, spin: .55, stiff: .7, cut: .5 }[kind] }; moveT = move.d; cool = move.d + .5;
          if (kind === 'hurdle') play('Jump_Loop', .1); else if (kind === 'stiff') play('Push_Loop', .12); } }
      if (move) { move.t += dt; const u = move.t / move.d; const lat = { hurdle: 0, juke: 3.4, spin: 2.2, stiff: 1.6, cut: 2.6 }[move.kind] * move.s; lx = fz * lat; lz = -fx * lat;
        if (move.kind === 'spin') spin = -move.s * Math.PI * 2 * Math.min(1, u); if (move.kind === 'hurdle') y = Math.sin(Math.min(1, u) * Math.PI) * .95;
        if (u >= 1) { const k = move.kind; move = null; spin = 0; y = 0; boost = 1.6; if (rnd() < .2 && k !== 'hurdle') { st = 'celebrate'; stT = 1.4; play(rnd() < .5 ? 'Spell_Simple_Shoot' : 'Dance_Loop', .2, true); return; } } }
      const tvx = fx * speed + lx, tvz = fz * speed + lz; vx += (tvx - vx) * Math.min(1, dt * 7); vz += (tvz - vz) * Math.min(1, dt * 7);
      if (!move || move.kind !== 'hurdle') sepFrom(1.05, false);
      if (pos) { const ex = x - pos.x, ez = z - pos.z, d = Math.hypot(ex, ez); if (d < 1.3 && d > 1e-4) { vx += ex / d * (1.3 - d) * 8; vz += ez / d * (1.3 - d) * 8; } }
      if (!move) turn(Math.atan2(vx, vz), dt, 7);
      if (!move || (move.kind !== 'hurdle' && move.kind !== 'stiff')) play(speed > 5 ? 'Sprint_Loop' : speed < 2 ? 'Walk_Loop' : 'Jog_Fwd_Loop', .2, false, speed > 5 ? 1.1 : 1.05);
      if ((nextFall -= dt) <= 0 && !move) { nextFall = 30 + rnd() * 30; if (rnd() < .5) { st = 'trip'; stT = 1.5; play('Death01', .12, true); } else { st = 'trip'; stT = 1.2; play('Roll', .1, true); } }
      if ((chk -= dt) <= 0) { if (Math.hypot(x - cx0, z - cz0) < 1) { if (api.mode === 'tunnel') { x = 0; z = STAD.tz1; } else if (!pickRoute(api.mode === 'toField' ? 0 : null, 58.8) && nav) { const d = nav.random(rnd, casinoOK); if (d) { x = d[0]; z = d[1]; } } } chk = 3; cx0 = x; cz0 = z; } }
    function fieldStep(dt) { if (api.mode === 'toCasino') { const sp = api.spd === 'sprint' ? 6.2 : api.spd === 'walk' ? 1.6 : 4.2; if (z < 60.8) { api.mode = 'casino'; save(); route = null; if (api.cmd === 'roam') pickRoute(); } else if (z > STAD.tz1 - 3) steerTo(Math.abs(x) > 2 ? 0 : x * .5, STAD.tz1 - 4, sp, dt); else steerTo(0, 58, sp, dt); play(sp > 5 ? 'Sprint_Loop' : sp < 2 ? 'Walk_Loop' : 'Jog_Fwd_Loop'); return; }
      if (!stadium.built) stadium.buildNow();
      if (st === 'celebrate') { stT -= dt; vx = vz = 0; if (stT <= 0) st = 'run'; return; }
      if (api.cmd !== 'roam' && ppos) { if (!inStad(ppos.z)) { if (api.cmd !== 'stay') { api.bringBack(); } else { vx = vz = 0; play('Idle_Loop'); } return; }
        const dP = Math.hypot(ppos.x - x, ppos.z - z); if (api.cmd === 'stay' || dP < 2.3) { vx = vz = 0; turn(Math.atan2(ppos.x - x, ppos.z - z), dt, 5); play('Idle_Loop', .3); if (api.cmd === 'come' && dP < 2.3) api.cmd = 'stay'; return; }
        const sp2 = api.spd === 'walk' ? 1.5 : api.spd === 'sprint' ? 6.4 : 3.8; steerTo(ppos.x, ppos.z, sp2, dt); play(sp2 > 5 ? 'Sprint_Loop' : sp2 < 2 ? 'Walk_Loop' : 'Jog_Fwd_Loop'); return; }
      if (api.team && api.team.active) { const c = api.team.cruzCtl(dt, x, z); if (c) { if (c.throwAt) throwBall(c.throwAt); if (c.anim) play(c.anim, .15, c.once, c.ts || 1); if (c.x != null) { const done = steerTo(c.x, c.z, c.speed || 0, dt, !c.back); if (done) { vx *= .5; vz *= .5; } } else { vx = vz = 0; } if (c.face != null) turn(c.face, dt, 8); return; } }
      if (!task) nextTask(); tT += dt; const t = task;
      if (t.k === 'go') { const done = steerTo(t.x, t.z, t.speed, dt, !t.back); if (t.back) turn(0, dt, 6); play(t.anim, .2, false, t.ts); if (done || tT > 25) nextTask(); }
      else if (t.k === 'anim') { vx = vz = 0; if (t.face != null) turn(t.face, dt, 6); play(t.n, .25, t.once); if (tT > t.d) nextTask(); }
      else if (t.k === 'throw') { vx = vz = 0; play('Spell_Simple_Shoot', .1, true); if (tT > .35 && !t.done) { t.done = 1; throwBall(t.tgt); } if (tT > .9) nextTask(); }
      else if (t.k === 'pushups') { vx = vz = 0; play('Idle_Loop', .2); if (tT > t.d) { nextTask(); } } }
    api.update = (dt, t, pos, vis) => { if (!api.ready) return; const prevYaw = yaw; ppos = pos ? { x: pos.x, z: pos.z } : null;
      if (api.mode === 'field' || api.mode === 'toCasino') fieldStep(dt); else casinoStep(dt, pos);
      const inField = api.mode === 'field' || api.mode === 'toCasino' || api.mode === 'tunnel';
      const c = collide(x + vx * dt, z + vz * dt); x = c[0]; z = c[1]; if (!inField && (!move || move.kind !== 'hurdle')) sepFrom(.75, true);
      if (fly) { fly.t += dt; const u = Math.min(1, fly.t / fly.d); ball.position.lerpVectors(fly.a, fly.b, u); ball.position.y += Math.sin(u * Math.PI) * 4.5; ball.rotation.x += dt * 14; if (u >= 1) { fly = null; setTimeout(() => (ball.visible = false), 600); } }
      const yr = (yaw - prevYaw) / Math.max(dt, 1e-3); bank += (Math.max(-.28, Math.min(.28, -yr * .06)) - bank) * Math.min(1, dt * 6); const spd = Math.hypot(vx, vz);
      const push = task && task.k === 'pushups' && api.mode === 'field';
      rig.position.set(x, push ? .28 + Math.max(0, Math.sin(t * 4)) * .14 : y + (task && task.k === 'go' && task.anim === 'Jog_Fwd_Loop' && task.ts > 1.5 ? Math.abs(Math.sin(t * 9)) * .12 : 0), z);
      rig.rotation.set(push ? Math.PI / 2 - .12 + Math.sin(t * 4) * .06 : Math.min(.22, spd * .03), yaw + spin, push ? 0 : bank);
      api.x = ext.x = x; api.z = ext.z = z; const show = api.on && (inField ? (stadium.root.visible || z < 64) : (vis ? vis(x, z) : true)); rig.visible = show; ext.on = api.on && !inField; ball.visible = ball.visible && show;
      const d2 = pos ? (x - pos.x) ** 2 + (z - pos.z) ** 2 : 0; if (show && (d2 < 2500 || inField)) { h.mixer.update(dt); if (api.postPose) api.postPose(h, dt); } };
    api.pos = () => new THREE.Vector3(x, 1.2, z); api.C = C; api.h = h; api.ball = ball; api.ready = true; if (ctx.onReady) ctx.onReady(api); }).catch((e) => console.warn('cruz', e));
  return api; }
