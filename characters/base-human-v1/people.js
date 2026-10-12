/* Real animated guests: CC0 Quaternius mannequin (people.glb, Universal Animation Library clips) cloned with SkeletonUtils.
   Behaviour state machine per guest: walk the aisles, stop to wave / tie a shoe / cheer, talk in pairs, sit at slots and
   tables, lean at the bar. Phones get fewer guests; animation mixers only tick near the camera (far ones are hidden). */
import { GLTFLoader } from './vendor/GLTFLoader.js';
import * as SkeletonUtils from './vendor/SkeletonUtils.js';
export function createPeople(ctx) { const { THREE, scene, mobile } = ctx; const api = { ready: false, list: [], update() {} };
  new GLTFLoader().load('people.glb', (gl) => { try { build(gl); } catch (e) { console.warn('people', e); } }, undefined, () => {});
  function build(gl) { const base = gl.scene, clips = {}; gl.animations.forEach((a) => (clips[a.name] = a));
    const bb = new THREE.Box3().setFromObject(base), H = bb.max.y - bb.min.y, k = 1.72 / (H || 1);
    const OUT = [0x1a2238, 0x5a0f1c, 0x0f3a2e, 0xb8b0a0, 0x141416, 0x2e1a46, 0x6a5232, 0x2a2a2e, 0x7a1a3a, 0x1d4a6a], SKIN = [0xe8c0a0, 0xc89070, 0x8a5a3a, 0x5a3a24, 0xf0d0b8];
    const rnd = ((s) => () => ((s = (s * 16807) % 2147483647) / 2147483647))(42);
    function make(i, h) { const o = SkeletonUtils.clone(base); o.scale.setScalar(k * h); let n = 0;
      o.traverse((m) => { if (m.isMesh) { m.frustumCulled = false; m.castShadow = false; const mat = new THREE.MeshStandardMaterial({ color: n === 0 ? OUT[i % OUT.length] : SKIN[i % SKIN.length], roughness: .6, metalness: .05 }); m.material = mat; n++; } });
      scene.add(o); const mixer = new THREE.AnimationMixer(o); return { o, mixer, act: null, clip: '' }; }
    function play(p, name, fade = .3, once) { if (p.clip === name || !clips[name]) return; const a = p.mixer.clipAction(clips[name]); a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = !!once; a.timeScale = p.ts || 1;
      if (p.act) p.act.crossFadeTo(a, fade, false); a.play(); p.act = a; p.clip = name; }
    const nWalk = mobile ? 9 : 16, P = ctx.PATHS, list = api.list;
    for (let i = 0; i < nWalk; i++) { const p = make(i, .94 + rnd() * .12); Object.assign(p, { kind: 'walk', path: P[i % P.length], u: rnd(), dir: rnd() < .5 ? 1 : -1, off: (rnd() - .5) * 1.2, sp: 1.05 + rnd() * .25, st: 'walk', tm: 3 + rnd() * 8 }); p.mixer.setTime(rnd() * 2); play(p, i % 3 ? 'Walk_Loop' : 'Walk_Formal_Loop', 0); list.push(p); }
    const seats = ctx.seats.slice(0, mobile ? 8 : 16); seats.forEach((s, j) => { const p = make(j + 3, .97); Object.assign(p, { kind: 'sit', x: s.x, z: s.z, ry: s.ry, y: s.y ?? 0, st: 'sit', tm: 4 + rnd() * 10 }); p.ts = .8 + rnd() * .4; play(p, j % 3 ? 'Sitting_Idle_Loop' : 'Sitting_Talking_Loop', 0); p.mixer.setTime(rnd() * 3); list.push(p); });
    ctx.pairs.slice(0, mobile ? 2 : 4).forEach(([x, z, a], j) => { for (let s = 0; s < 2; s++) { const p = make(j * 2 + s + 5, .95 + s * .06); const dx = Math.sin(a) * .55 * (s ? 1 : -1), dz = Math.cos(a) * .55 * (s ? 1 : -1);
      Object.assign(p, { kind: 'talk', x: x + dx, z: z + dz, ry: a + (s ? Math.PI : 0), st: 'talk', tm: 3 + rnd() * 6 }); play(p, 'Idle_Talking_Loop', 0); p.mixer.setTime(rnd() * 4); list.push(p); } });
    ctx.bar.slice(0, mobile ? 3 : 5).forEach(([x, z, ry], j) => { const p = make(j + 7, 1); Object.assign(p, { kind: 'bar', x, z, ry, st: 'bar', tm: 5 + rnd() * 8 }); play(p, j % 2 ? 'Idle_Talking_Loop' : 'Idle_Loop', 0); list.push(p); });
    list.forEach((p) => { if (p.kind !== 'walk') { p.o.position.set(p.x, p.y || 0, p.z); p.o.rotation.y = p.ry; } });
    const tmp = new THREE.Vector3(); let fr = 0;
    api.update = (dt, t, camPos, hidden) => { fr++; list.forEach((p, i) => { p.o.visible = !hidden;
      if (hidden) return;
      if (p.kind === 'walk') { p.tm -= dt; const [[ax, az], [bx, bz]] = p.path, L = Math.hypot(bx - ax, bz - az) || 1;
        if (p.st === 'walk') { p.u += p.dir * p.sp * dt / L; if (p.u > 1) { p.u = 1; p.dir = -1; } if (p.u < 0) { p.u = 0; p.dir = 1; }
          if (p.tm < 0) { const r = rnd(); p.st = r < .3 ? 'wave' : r < .5 ? 'tie' : r < .7 ? 'cheer' : 'idle'; p.tm = { wave: 2.2, tie: 3.6, cheer: 3, idle: 2.5 }[p.st]; play(p, { wave: 'Interact', tie: 'Fixing_Kneeling', cheer: 'Dance_Loop', idle: 'Idle_Loop' }[p.st], .35, p.st === 'wave'); } }
        else if (p.tm < 0) { p.st = 'walk'; p.tm = 5 + rnd() * 10; play(p, i % 3 ? 'Walk_Loop' : 'Walk_Formal_Loop'); }
        const hor = Math.abs(bx - ax) > Math.abs(bz - az), x = ax + (bx - ax) * p.u + (hor ? 0 : p.off), z = az + (bz - az) * p.u + (hor ? p.off : 0); p.o.position.set(x, 0, z);
        if (p.st === 'walk') { const ty = Math.atan2((bx - ax) * p.dir, (bz - az) * p.dir); let d = ty - p.o.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); p.o.rotation.y += d * Math.min(1, dt * 6); } }
      else if (p.kind === 'sit' || p.kind === 'bar') { p.tm -= dt; if (p.tm < 0) { p.tm = 5 + rnd() * 10; const r = rnd(); if (p.kind === 'sit') play(p, r < .25 ? 'Sitting_Talking_Loop' : 'Sitting_Idle_Loop'); else play(p, r < .5 ? 'Idle_Talking_Loop' : 'Idle_Loop'); } }
      const d2 = camPos ? tmp.copy(p.o.position).sub(camPos).lengthSq() : 0; p.o.visible = d2 < 1600;
      if (p.o.visible && (d2 < 225 || (fr + i) % 3 === 0)) p.mixer.update(d2 < 225 ? dt : dt * 3); }); };
    api.ready = true; if (ctx.onReady) ctx.onReady(); }
  return api; }
