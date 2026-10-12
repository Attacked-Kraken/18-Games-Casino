/* Real animated guests + dealers on Base Human v2 (characters/base-human-v2: CC0 Quaternius male/female bodies with
   faces + original modular outfits, UAL animation clips). Behaviour state machine per guest: walk the aisles, stop to
   wave / tie a shoe / cheer, talk in pairs, sit at slots and tables, stand at the bar; dealers work every table.
   Phones get fewer people; mixers only tick near the player, far / hidden-zone people are not drawn. */
import { loadHumans } from './characters/base-human-v2/humans.js';
export function createPeople(ctx) { const { THREE, scene, mobile } = ctx; const api = { ready: false, list: [], update() {} };
  let tries = 0; const load = () => loadHumans(THREE, 'characters/base-human-v2/').then(build).catch((e) => { console.warn('people', e); if (++tries < 6) setTimeout(load, 2000 * tries); }); load();
  function build(H) { const rnd = ((s) => () => ((s = (s * 16807) % 2147483647) / 2147483647))(42), list = api.list;
    const make = (o = {}) => { const g = o.g || (rnd() < .5 ? 'f' : 'm'); const spec = o.spec || (o.dealer ? { g, skin: Math.floor(rnd() * 6), hair: H.HAIR[g][Math.floor(rnd() * 4)], hairCol: H.HAIR_COLS[Math.floor(rnd() * 6)], outfit: 'dealer' } : H.randomSpec(g, rnd));
      const p = H.make(spec, (g === 'f' ? 1.64 : 1.76) + (rnd() - .5) * .08); scene.add(p.object); p.o = p.object; return p; };
    const P = ctx.PATHS, cap = (n) => Math.round(n * (mobile ? .55 : 1));
    for (let i = 0; i < cap(16); i++) { const p = make(); Object.assign(p, { kind: 'walk', path: P[i % P.length], u: rnd(), dir: rnd() < .5 ? 1 : -1, off: (rnd() - .5) * 1.2, sp: 1.05 + rnd() * .25, st: 'walk', tm: 3 + rnd() * 8, formal: i % 3 === 0 }); p.mixer.setTime(rnd() * 2); p.play(p.formal ? 'Walk_Formal_Loop' : 'Walk_Loop', 0); list.push(p); }
    ctx.seats.slice(0, cap(18)).forEach((s, j) => { const p = make(); p.ts = .8 + rnd() * .4; Object.assign(p, { kind: 'sit', x: s.x, z: s.z, ry: s.ry, y: s.y ?? 0, sy: s.sy, st: 'sit', tm: 4 + rnd() * 10 }); p.play(j % 3 ? 'Sitting_Talking_Loop' : 'Sitting_Idle_Loop', 0); p.mixer.setTime(rnd() * 3); list.push(p); });
    ctx.pairs.slice(0, cap(6)).forEach(([x, z, a]) => { for (let s = 0; s < 2; s++) { const p = make(); const dx = Math.sin(a) * .5 * (s ? 1 : -1), dz = Math.cos(a) * .5 * (s ? 1 : -1);
      Object.assign(p, { kind: 'talk', x: x + dx, z: z + dz, ry: a + (s ? Math.PI : 0), st: 'talk', tm: 3 + rnd() * 6 }); p.play('Idle_Talking_Loop', 0); p.mixer.setTime(rnd() * 4); list.push(p); } });
    ctx.bar.slice(0, cap(8)).forEach(([x, z, ry], j) => { const p = make(); Object.assign(p, { kind: 'bar', x, z, ry, st: 'bar', tm: 5 + rnd() * 8 }); p.play(j % 2 ? 'Idle_Talking_Loop' : 'Idle_Loop', 0); list.push(p); });
    ctx.dealers.slice(0, cap(30)).forEach(([x, z, ry]) => { const p = make({ dealer: 1 }); Object.assign(p, { kind: 'dealer', x, z, ry, st: 'deal', tm: 2 + rnd() * 6 }); p.play('Idle_Talking_Loop', 0); p.mixer.setTime(rnd() * 3); list.push(p); });
    list.forEach((p) => { if (p.kind !== 'walk') { p.o.position.set(p.x, p.y || 0, p.z); p.o.rotation.y = p.ry; } });
    /* seat by pelvis: after posing the sit clip, shift the root so the pelvis bone sits on the seat cushion (no floating / sinking) */
    const pv = new THREE.Vector3(); list.forEach((p) => { if (p.kind !== 'sit') return; p.mixer.update(0); p.o.updateMatrixWorld(true); let pel = null; p.o.traverse((n) => { if (!pel && n.isBone && /^pelvis$/i.test(n.name)) pel = n; }); if (!pel) return;
      pel.getWorldPosition(pv); const bx = -Math.sin(p.ry) * .04, bz = -Math.cos(p.ry) * .04; p.o.position.x += p.x + bx - pv.x; p.o.position.z += p.z + bz - pv.z; p.o.position.y += (p.sy ?? .65) - pv.y; p.seatFix = 1; });
    /* crowd navigation: A* on a walkability grid + steering with separation; per-zone density caps; stuck > 3 s -> re-path, then relocate */
    let nav = null; try { nav = ctx.getNav ? ctx.getNav() : null; } catch (e) { console.warn('nav', e); }
    const walkers = list.filter((p) => p.kind === 'walk'), zoneOf = (x, z) => z < -17.5 ? 1 : z > 17 ? 2 : 0, CAPF = [.55, .3, .15];
    const extra = api.extra = []; api.nav = nav;
    function pickDest(p) { const cnt = [0, 0, 0]; walkers.forEach((q) => { if (q !== p && q.dz != null) cnt[q.dz]++; }); let best = 0, bs = 1e9;
      for (let z = 0; z < 3; z++) { const s = cnt[z] / (CAPF[z] * walkers.length) + rnd() * .25; if (s < bs) { bs = s; best = z; } }
      for (let k = 0; k < 4; k++) { const d = nav.random(rnd, (x, z) => zoneOf(x, z) === best && Math.hypot(x - p.x, z - p.z) > 6); if (!d) continue; const r = nav.path(p.x, p.z, d[0], d[1]); if (r && r.length) { p.route = r; p.wi = 0; p.dz = best; return; } }
      p.route = null; }
    function relocate(p, pos) { const d = nav.random(rnd, (x, z) => !pos || Math.hypot(x - pos.x, z - pos.z) > 12); if (d) { p.x = d[0]; p.z = d[1]; p.vx = p.vz = 0; } pickDest(p); }
    if (nav) walkers.forEach((p) => { p.x = 0; p.z = 0; relocate(p, null); p.vx = p.vz = 0; p.chk = 3; p.cx0 = p.x; p.cz0 = p.z; p.stuck = 0; });
    function walkNav(p, dt, pos) { p.tm -= dt;
      if (p.st !== 'walk') { if (p.tm < 0) { p.st = 'walk'; p.tm = 6 + rnd() * 10; p.play(p.formal ? 'Walk_Formal_Loop' : 'Walk_Loop'); } p.chk = 3; p.cx0 = p.x; p.cz0 = p.z; p.o.position.set(p.x, 0, p.z); return; }
      if (p.tm < 0) { const r = rnd(); p.st = r < .3 ? 'wave' : r < .5 ? 'tie' : r < .7 ? 'cheer' : 'idle'; p.tm = { wave: 2.2, tie: 3.6, cheer: 3, idle: 2.5 }[p.st]; p.play({ wave: 'Interact', tie: 'Fixing_Kneeling', cheer: 'Dance_Loop', idle: 'Idle_Loop' }[p.st], .35, p.st === 'wave'); return; }
      let dx = 0, dz = 0; const w = p.route && p.route[p.wi];
      if (!w) pickDest(p); else { const ex = w[0] - p.x, ez = w[1] - p.z, d = Math.hypot(ex, ez); if (d < .45) p.wi++; else { dx = ex / d * p.sp; dz = ez / d * p.sp; } }
      let sx = 0, sz = 0; const sep = (qx, qz, R, k) => { const ex = p.x - qx, ez = p.z - qz, d2 = ex * ex + ez * ez; if (d2 < R * R && d2 > 1e-6) { const d = Math.sqrt(d2), f = (R - d) / R; sx += ex / d * f * k; sz += ez / d * f * k; } };
      for (const q of list) if (q !== p) sep(q.kind === 'walk' ? q.x : q.o.position.x, q.kind === 'walk' ? q.z : q.o.position.z, q.kind === 'walk' ? .9 : .75, 2.4);
      for (const e of extra) if (e.on) sep(e.x, e.z, 1.2, 3); if (pos) sep(pos.x, pos.z, 1.0, 3);
      const tvx = dx + sx, tvz = dz + sz; p.vx += (tvx - p.vx) * Math.min(1, dt * 5); p.vz += (tvz - p.vz) * Math.min(1, dt * 5);
      const r = ctx.collide(p.x + p.vx * dt, p.z + p.vz * dt); p.x = r[0]; p.z = r[1];
      for (const q of list) if (q !== p) { const qx = q.kind === 'walk' ? q.x : q.o.position.x, qz = q.kind === 'walk' ? q.z : q.o.position.z, ex = p.x - qx, ez = p.z - qz, d = Math.hypot(ex, ez), m = .5; if (d < m && d > 1e-4) { const f = (m - d) * (q.kind === 'walk' ? .5 : 1); const c = ctx.collide(p.x + ex / d * f, p.z + ez / d * f); p.x = c[0]; p.z = c[1]; } }
      p.o.position.set(p.x, 0, p.z); const sp = Math.hypot(p.vx, p.vz); if (sp > .15) { const ty = Math.atan2(p.vx, p.vz); let d = ty - p.o.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); p.o.rotation.y += d * Math.min(1, dt * 6); }
      if ((p.chk -= dt) <= 0) { const mv = Math.hypot(p.x - p.cx0, p.z - p.cz0); if (mv < .6) { p.stuck++; if (p.stuck >= 2) { relocate(p, pos); p.stuck = 0; } else pickDest(p); } else p.stuck = 0; p.chk = 3; p.cx0 = p.x; p.cz0 = p.z; } }
    api.walkers = walkers;
    const tmp = new THREE.Vector3(); let fr = 0; const zv = ctx.zoneVisible || (() => true);
    api.update = (dt, t, pos) => { fr++; list.forEach((p, i) => {
      if (p.kind === 'walk' && nav) walkNav(p, dt, pos);
      else if (p.kind === 'walk') { p.tm -= dt; const [[ax, az], [bx, bz]] = p.path, L = Math.hypot(bx - ax, bz - az) || 1;
        if (p.st === 'walk') { p.u += p.dir * p.sp * dt / L; if (p.u > 1) { p.u = 1; p.dir = -1; } if (p.u < 0) { p.u = 0; p.dir = 1; }
          if (p.tm < 0) { const r = rnd(); p.st = r < .3 ? 'wave' : r < .5 ? 'tie' : r < .7 ? 'cheer' : 'idle'; p.tm = { wave: 2.2, tie: 3.6, cheer: 3, idle: 2.5 }[p.st]; p.play({ wave: 'Interact', tie: 'Fixing_Kneeling', cheer: 'Dance_Loop', idle: 'Idle_Loop' }[p.st], .35, p.st === 'wave'); } }
        else if (p.tm < 0) { p.st = 'walk'; p.tm = 5 + rnd() * 10; p.play(p.formal ? 'Walk_Formal_Loop' : 'Walk_Loop'); }
        const hor = Math.abs(bx - ax) > Math.abs(bz - az); p.o.position.set(ax + (bx - ax) * p.u + (hor ? 0 : p.off), 0, az + (bz - az) * p.u + (hor ? p.off : 0));
        if (p.st === 'walk') { const ty = Math.atan2((bx - ax) * p.dir, (bz - az) * p.dir); let d = ty - p.o.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); p.o.rotation.y += d * Math.min(1, dt * 6); } }
      else { p.tm -= dt; if (p.tm < 0) { p.tm = 4 + rnd() * 8; const r = rnd();
        if (p.kind === 'sit') p.play(r < .6 ? 'Sitting_Talking_Loop' : 'Sitting_Idle_Loop'); else if (p.kind === 'bar') p.play(r < .5 ? 'Idle_Talking_Loop' : 'Idle_Loop');
        else if (p.kind === 'dealer') { if (r < .75) { p.play('Interact', .2, true); p.clip = ''; p.tm = 1.4 + rnd() * .8; } else { p.play('Idle_Talking_Loop'); p.tm = 1.5 + rnd() * 1.5; } } } }
      const d2 = pos ? tmp.copy(p.o.position).sub(pos).lengthSq() : 0; p.o.visible = d2 < 1600 && zv(p.o.position.x, p.o.position.z);
      if (p.o.visible && (d2 < 225 || (fr + i) % 3 === 0)) p.mixer.update(d2 < 225 ? dt : dt * 3); }); };
    api.H = H; api.ready = true; if (ctx.onReady) ctx.onReady(); }
  return api; }
