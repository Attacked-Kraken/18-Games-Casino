/* Real animated guests + dealers on Base Human v2 (characters/base-human-v2: CC0 Quaternius male/female bodies with
   faces + original modular outfits, UAL animation clips). Behaviour state machine per guest: walk the aisles, stop to
   wave / tie a shoe / cheer, talk in pairs, sit at slots and tables, stand at the bar; dealers work every table.
   Phones get fewer people; mixers only tick near the player, far / hidden-zone people are not drawn. */
import { loadHumans } from './characters/base-human-v2/humans.js';
export function createPeople(ctx) { const { THREE, scene, mobile } = ctx; const api = { ready: false, list: [], update() {} };
  loadHumans(THREE, 'characters/base-human-v2/').then(build).catch((e) => console.warn('people', e));
  function build(H) { const rnd = ((s) => () => ((s = (s * 16807) % 2147483647) / 2147483647))(42), list = api.list;
    const make = (o = {}) => { const g = o.g || (rnd() < .5 ? 'f' : 'm'); const spec = o.spec || (o.dealer ? { g, skin: Math.floor(rnd() * 6), hair: H.HAIR[g][Math.floor(rnd() * 4)], hairCol: H.HAIR_COLS[Math.floor(rnd() * 6)], outfit: 'dealer' } : H.randomSpec(g, rnd));
      const p = H.make(spec, (g === 'f' ? 1.64 : 1.76) + (rnd() - .5) * .08); scene.add(p.object); p.o = p.object; return p; };
    const P = ctx.PATHS, cap = (n) => Math.round(n * (mobile ? .55 : 1));
    for (let i = 0; i < cap(16); i++) { const p = make(); Object.assign(p, { kind: 'walk', path: P[i % P.length], u: rnd(), dir: rnd() < .5 ? 1 : -1, off: (rnd() - .5) * 1.2, sp: 1.05 + rnd() * .25, st: 'walk', tm: 3 + rnd() * 8, formal: i % 3 === 0 }); p.mixer.setTime(rnd() * 2); p.play(p.formal ? 'Walk_Formal_Loop' : 'Walk_Loop', 0); list.push(p); }
    ctx.seats.slice(0, cap(18)).forEach((s, j) => { const p = make(); p.ts = .8 + rnd() * .4; Object.assign(p, { kind: 'sit', x: s.x, z: s.z, ry: s.ry, y: s.y ?? 0, st: 'sit', tm: 4 + rnd() * 10 }); p.play(j % 3 ? 'Sitting_Idle_Loop' : 'Sitting_Talking_Loop', 0); p.mixer.setTime(rnd() * 3); list.push(p); });
    ctx.pairs.slice(0, cap(6)).forEach(([x, z, a]) => { for (let s = 0; s < 2; s++) { const p = make(); const dx = Math.sin(a) * .5 * (s ? 1 : -1), dz = Math.cos(a) * .5 * (s ? 1 : -1);
      Object.assign(p, { kind: 'talk', x: x + dx, z: z + dz, ry: a + (s ? Math.PI : 0), st: 'talk', tm: 3 + rnd() * 6 }); p.play('Idle_Talking_Loop', 0); p.mixer.setTime(rnd() * 4); list.push(p); } });
    ctx.bar.slice(0, cap(8)).forEach(([x, z, ry], j) => { const p = make(); Object.assign(p, { kind: 'bar', x, z, ry, st: 'bar', tm: 5 + rnd() * 8 }); p.play(j % 2 ? 'Idle_Talking_Loop' : 'Idle_Loop', 0); list.push(p); });
    ctx.dealers.slice(0, cap(30)).forEach(([x, z, ry]) => { const p = make({ dealer: 1 }); Object.assign(p, { kind: 'dealer', x, z, ry, st: 'deal', tm: 2 + rnd() * 6 }); p.play('Idle_Loop', 0); p.mixer.setTime(rnd() * 3); list.push(p); });
    list.forEach((p) => { if (p.kind !== 'walk') { p.o.position.set(p.x, p.y || 0, p.z); p.o.rotation.y = p.ry; } });
    const tmp = new THREE.Vector3(); let fr = 0; const zv = ctx.zoneVisible || (() => true);
    api.update = (dt, t, pos) => { fr++; list.forEach((p, i) => {
      if (p.kind === 'walk') { p.tm -= dt; const [[ax, az], [bx, bz]] = p.path, L = Math.hypot(bx - ax, bz - az) || 1;
        if (p.st === 'walk') { p.u += p.dir * p.sp * dt / L; if (p.u > 1) { p.u = 1; p.dir = -1; } if (p.u < 0) { p.u = 0; p.dir = 1; }
          if (p.tm < 0) { const r = rnd(); p.st = r < .3 ? 'wave' : r < .5 ? 'tie' : r < .7 ? 'cheer' : 'idle'; p.tm = { wave: 2.2, tie: 3.6, cheer: 3, idle: 2.5 }[p.st]; p.play({ wave: 'Interact', tie: 'Fixing_Kneeling', cheer: 'Dance_Loop', idle: 'Idle_Loop' }[p.st], .35, p.st === 'wave'); } }
        else if (p.tm < 0) { p.st = 'walk'; p.tm = 5 + rnd() * 10; p.play(p.formal ? 'Walk_Formal_Loop' : 'Walk_Loop'); }
        const hor = Math.abs(bx - ax) > Math.abs(bz - az); p.o.position.set(ax + (bx - ax) * p.u + (hor ? 0 : p.off), 0, az + (bz - az) * p.u + (hor ? p.off : 0));
        if (p.st === 'walk') { const ty = Math.atan2((bx - ax) * p.dir, (bz - az) * p.dir); let d = ty - p.o.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); p.o.rotation.y += d * Math.min(1, dt * 6); } }
      else { p.tm -= dt; if (p.tm < 0) { p.tm = 4 + rnd() * 8; const r = rnd();
        if (p.kind === 'sit') p.play(r < .25 ? 'Sitting_Talking_Loop' : 'Sitting_Idle_Loop'); else if (p.kind === 'bar') p.play(r < .5 ? 'Idle_Talking_Loop' : 'Idle_Loop');
        else if (p.kind === 'dealer') { if (r < .45) { p.play('Interact', .25, true); p.tm = 1.6; } else p.play('Idle_Loop'); } } }
      const d2 = pos ? tmp.copy(p.o.position).sub(pos).lengthSq() : 0; p.o.visible = d2 < 1600 && zv(p.o.position.x, p.o.position.z);
      if (p.o.visible && (d2 < 225 || (fr + i) % 3 === 0)) p.mixer.update(d2 < 225 ? dt : dt * 3); }); };
    api.H = H; api.ready = true; if (ctx.onReady) ctx.onReady(); }
  return api; }
