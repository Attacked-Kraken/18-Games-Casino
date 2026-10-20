// Apex Grand Prix Track - race-day event layer for three.js (crowds, flags, start lights, helicopter,
// fireworks/confetti, night mode, screens, pit crews, positional crowd audio). All geometry is generated
// here and stays off the racing surface. Total cost: about 12 extra draw calls.
//   import { createEvent } from './grand-prix-event.js';
//   const ev = createEvent({ scene, track, camera, soundBase:'../Grand-Prix-Track-Sounds/', fx: optionalApexFX });
//   each frame: ev.update(dt, cars)          // cars = array of Object3D (positions only are read)
//   ev.startSequence(() => go());  ev.finish(winnerCar);  ev.setNight(true);  await ev.enableAudio();
import * as THREE from 'three';

const R = (a, b) => a + Math.random() * (b - a);  // (tip: seed Math.random if you need identical crowds)
const pick = a => a[(Math.random() * a.length) | 0];
const SHIRTS = [0xb23a3a, 0x2f5f9e, 0xd9c35a, 0x3f7d4a, 0xc8803a, 0x6a4c8c, 0xe8e8e4, 0x3a8a96, 0xc77a8e, 0x2a2f36, 0x1c1f24, 0x8a7a66, 0xd8d0c0];
const FLAGS = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0xffffff, 0xfb8c00, 0x8e24aa, 0x00e5ff];

function personGeometry() {
  // low-poly spectator: legs, body, head, two raised arms (one merged geometry, ~60 triangles)
  const parts = [];
  const add = (w, h, d, x, y, z, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); g.translate(x, y, z); parts.push(g); };
  add(.34, .5, .22, 0, .25, 0); add(.42, .55, .26, 0, .78, 0); add(.24, .26, .24, 0, 1.2, 0);
  add(.1, .5, .1, -.3, 1.15, 0, .35); add(.1, .5, .1, .3, 1.15, 0, -.35);
  const g = mergeGeoms(parts);
  // vertex attribute "arm": 1 for arm vertices (they wave), height for sway
  const pos = g.attributes.position, arm = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) arm[i] = (Math.abs(pos.getX(i)) > .22 && pos.getY(i) > .95) ? 1 : 0;
  g.setAttribute('arm', new THREE.BufferAttribute(arm, 1));
  return g;
}
function mergeGeoms(list, uv = false) {
  let n = 0; list.forEach(g => n += g.attributes.position.count);
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), I = []; let o = 0;
  list.forEach(g => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); if (uv && g.attributes.uv) U.set(g.attributes.uv.array, o * 2); g.index.array.forEach(i => I.push(i + o)); o += g.attributes.position.count; });
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(P, 3)); m.setAttribute('normal', new THREE.BufferAttribute(N, 3)); if (uv) m.setAttribute('uv', new THREE.BufferAttribute(U, 2)); m.setIndex(I); return m;
}
// animated instanced material: per-instance phase/stand id; uniform excitement per stand
function crowdMaterial(U) {
  const m = new THREE.MeshStandardMaterial({ roughness: .8 });
  m.onBeforeCompile = s => {
    s.uniforms.uTime = U.uTime; s.uniforms.uEx = U.uEx;
    s.vertexShader = s.vertexShader.replace('#include <common>', `#include <common>
      attribute float arm; attribute vec2 iPhase; uniform float uTime; uniform float uEx[16];`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      float ex = uEx[int(iPhase.y)];
      float ph = iPhase.x;
      float jump = max(0.0, sin(uTime*(6.0+ph)+ph*7.0)) * (0.05 + 0.35*ex);
      transformed.y += jump;
      if (arm > 0.5) { float w = sin(uTime*(8.0+ph*2.0)+ph*5.0)*(0.15+0.5*ex); transformed.x += w*(transformed.y-0.95); transformed.y += 0.25*ex; }
      transformed.x += sin(uTime*1.3+ph*3.0)*0.04*transformed.y;`);
  };
  return m;
}
function flagMaterial(U, map) {
  const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, map: map || null, roughness: .7 });
  m.onBeforeCompile = s => {
    s.uniforms.uTime = U.uTime;
    s.vertexShader = s.vertexShader.replace('#include <common>', `#include <common>
      uniform float uTime; attribute vec2 iPhase;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      float u = clamp(position.x / 1.2, 0.0, 1.0);
      transformed.z += sin(uTime*7.0 + position.x*4.0 + iPhase.x*6.0) * 0.18 * u;
      transformed.y += sin(uTime*5.0 + position.x*3.0 + iPhase.x) * 0.05 * u;`);
  };
  return m;
}
function flagGeometry(w = 1.2, h = .8) { const g = new THREE.PlaneGeometry(w, h, 8, 2); g.translate(w / 2, 0, 0); return g; }
function checkerTexture() { const c = document.createElement('canvas'); c.width = 64; c.height = 48; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 8, j * 8, 8, 8); } const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t; }

export function createEvent({ scene, track, camera, soundBase = '../Grand-Prix-Track-Sounds/', fx = null, crowdDensity = 1 } = {}) {
  const D = track.data, EV = D.event, root = new THREE.Group(); root.name = 'grand_prix_event'; scene.add(root);
  const U = { uTime: { value: 0 }, uEx: { value: new Array(16).fill(0) } };
  const ev = { root, stands: EV.grandstands, excitement: U.uEx.value, night: false, onFinish: null };
  const UPV = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  const yawOf = f => Math.atan2(f[0], f[2]);
  // ---------- crowd (1 draw call) + crowd flags (1 draw call) ----------
  const seats = [], flagSeats = [];
  EV.grandstands.forEach((st, si) => {
    const t = new THREE.Vector3(...st.tangent), yaw = yawOf(st.facing);
    st.rows.forEach(row => {
      const c = new THREE.Vector3(...row), half = st.length / 2 - .6;
      for (let s = -half; s <= half; s += .9 / crowdDensity) {
        if (Math.random() < .12) continue;
        const p = c.clone().addScaledVector(t, s + R(-.12, .12));
        seats.push({ p, yaw: yaw + R(-.3, .3), si }); if (Math.random() < .06) flagSeats.push({ p, yaw, si });
      }
    });
  });
  const crowd = new THREE.InstancedMesh(personGeometry(), crowdMaterial(U), seats.length); crowd.name = 'crowd';
  const ph = new Float32Array(seats.length * 2), col = new THREE.Color();
  seats.forEach((s, i) => { q.setFromAxisAngle(UPV, s.yaw); sc.setScalar(R(.9, 1.08)); m4.compose(s.p, q, sc); crowd.setMatrixAt(i, m4); crowd.setColorAt(i, col.setHex(pick(SHIRTS))); ph[i * 2] = Math.random(); ph[i * 2 + 1] = s.si; });
  crowd.geometry.setAttribute('iPhase', new THREE.InstancedBufferAttribute(ph, 2)); crowd.frustumCulled = false; root.add(crowd);
  const fg = flagGeometry(); const flags = new THREE.InstancedMesh(fg, flagMaterial(U), flagSeats.length + EV.marshalPosts.length); flags.name = 'crowd_and_marshal_flags';
  const fph = new Float32Array(flags.count * 2);
  flagSeats.forEach((s, i) => { q.setFromAxisAngle(UPV, s.yaw + Math.PI / 2); m4.compose(v.copy(s.p).setY(s.p.y + 2.0), q, sc.setScalar(1)); flags.setMatrixAt(i, m4); flags.setColorAt(i, col.setHex(pick(FLAGS))); fph[i * 2] = Math.random(); });
  EV.marshalPosts.forEach((mp, j) => { const i = flagSeats.length + j; q.setFromAxisAngle(UPV, yawOf(mp.facing) + Math.PI / 2); m4.compose(v.set(...mp.flagPole), q, sc.setScalar(1)); flags.setMatrixAt(i, m4); flags.setColorAt(i, col.setHex(0x2ecc40)); fph[i * 2] = Math.random(); });
  fg.setAttribute('iPhase', new THREE.InstancedBufferAttribute(fph, 2)); flags.frustumCulled = false; root.add(flags);
  ev.setMarshalFlag = (hex, postIndex = -1) => { EV.marshalPosts.forEach((_, j) => { if (postIndex < 0 || postIndex === j) flags.setColorAt(flagSeats.length + j, col.setHex(hex)); }); flags.instanceColor.needsUpdate = true; };
  // chequered flag at the line (hidden until finish)
  const sl = new THREE.Vector3(...D.startLine.position), sd = new THREE.Vector3(...D.startLine.direction), sr = new THREE.Vector3().crossVectors(sd, UPV).normalize();
  const cf = new THREE.Mesh(flagGeometry(1.6, 1.1), flagMaterial(U, checkerTexture())); cf.name = 'chequered_flag';
  cf.geometry.setAttribute('iPhase', new THREE.BufferAttribute(new Float32Array(cf.geometry.attributes.position.count * 2), 2));
  cf.position.copy(sl).addScaledVector(sr, -(D.trackWidth / 2 + 4)).setY(sl.y + 5); cf.rotation.y = yawOf(D.startLine.direction) + Math.PI / 2; cf.visible = false; root.add(cf);
  // ---------- pit crews (1 draw call) ----------
  const crewSeats = []; D.pitLane.boxes.forEach((b, bi) => { const p = new THREE.Vector3(...b.position), h = new THREE.Vector3(...b.heading), r = new THREE.Vector3().crossVectors(h, UPV).normalize(); for (let k = 0; k < 6; k++) crewSeats.push({ p: p.clone().addScaledVector(h, (k % 3 - 1) * 2.6).addScaledVector(r, k < 3 ? 4.5 : 5.5), yaw: yawOf([-r.x, 0, -r.z]), c: SHIRTS[bi % SHIRTS.length] }); });
  const crew = new THREE.InstancedMesh(personGeometry(), crowdMaterial(U), crewSeats.length); crew.name = 'pit_crews'; const cph = new Float32Array(crewSeats.length * 2);
  crewSeats.forEach((s, i) => { q.setFromAxisAngle(UPV, s.yaw); m4.compose(s.p, q, sc.setScalar(1)); crew.setMatrixAt(i, m4); crew.setColorAt(i, col.setHex(s.c)); cph[i * 2] = Math.random(); cph[i * 2 + 1] = 15; });
  crew.geometry.setAttribute('iPhase', new THREE.InstancedBufferAttribute(cph, 2)); root.add(crew);
  // ---------- start lights (5 lamps) ----------
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(.3, 12, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), 5); lamps.name = 'start_lamps';
  for (let j = 0; j < 5; j++) { m4.makeTranslation(v.copy(sl).addScaledVector(UPV, 7.7).addScaledVector(sd, -.75).addScaledVector(sr, (j - 2) * 1.4)); lamps.setMatrixAt(j, m4); lamps.setColorAt(j, col.setHex(0x1a0000)); }
  root.add(lamps); ev.lamps = lamps;
  ev.setLights = n => { for (let j = 0; j < 5; j++) lamps.setColorAt(j, col.setHex(j < n ? 0xff1a1a : 0x1a0000)); lamps.instanceColor.needsUpdate = true; };
  ev.startSequence = (onGo, { interval = 1000 } = {}) => {
    ev.setLights(0); ev.setMarshalFlag(0x2ecc40); cf.visible = false;
    for (let k = 1; k <= 5; k++) setTimeout(() => { ev.setLights(k); play('start_light_beep', .8); }, k * interval);
    setTimeout(() => { ev.setLights(0); play('lights_out_go', 1); excite(-1, 1); onGo && onGo(); }, 5 * interval + R(400, 2200));
  };
  // ---------- helicopter ----------
  const heli = new THREE.Group(); heli.name = 'tv_helicopter';
  const hm = new THREE.MeshLambertMaterial({ color: 0x1d3557 }), hm2 = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const bg = new THREE.SphereGeometry(1.6, 16, 10); bg.scale(1, .8, 1.7);
  const tg = new THREE.CylinderGeometry(.12, .3, 6, 8); tg.rotateX(Math.PI / 2); tg.translate(0, .3, -4.5);
  const fin = new THREE.BoxGeometry(.06, 1.6, .5); fin.translate(0, .9, -7.3); const sk = new THREE.BoxGeometry(2.2, .08, 3.2); sk.translate(0, -1.4, 0);
  const body = new THREE.Mesh(mergeGeoms([bg, tg, fin, sk].map(x => x.index ? x : x)), new THREE.MeshStandardMaterial({ color: 0x1d3557, metalness: .5, roughness: .35 })); heli.add(body);
  const rg = new THREE.BoxGeometry(11, .05, .3), rg2 = new THREE.BoxGeometry(.3, .05, 11);
  const rotor = new THREE.Mesh(mergeGeoms([rg, rg2]), hm2); rotor.position.y = 1.5; heli.add(rotor);
  const tr = { rotation: { x: 0 } };
  root.add(heli); ev.helicopter = heli;
  let heliA = 0;
  // ---------- screens + timing tower (canvas textures) ----------
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 512; screenCanvas.height = 280; const sx = screenCanvas.getContext('2d');
  const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace;
  const towerCanvas = document.createElement('canvas'); towerCanvas.width = 128; towerCanvas.height = 896; const tx = towerCanvas.getContext('2d');
  const towerTex = new THREE.CanvasTexture(towerCanvas); towerTex.colorSpace = THREE.SRGBColorSpace;
  const panel = (c, w, h, f, t, tex) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); m.position.set(...c); m.lookAt(v.set(c[0] + f[0], c[1], c[2] + f[2])); root.add(m); return m; };
  { const gs = EV.bigScreens.map(s => { const g = new THREE.PlaneGeometry(s.width * .98, s.height * .96); const o = new THREE.Object3D(); o.position.set(...s.center); o.lookAt(s.center[0] + s.facing[0], s.center[1], s.center[2] + s.facing[2]); o.updateMatrix(); g.applyMatrix4(o.matrix); return g; });
    const scr = new THREE.Mesh(mergeGeoms(gs, true), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })); scr.name = 'big_screens_live'; root.add(scr); }
  panel(EV.timingTower.panelCenter, 2.9, 20.4, EV.timingTower.facing, null, towerTex).name = 'timing_tower_panel';
  ev.screenText = { title: 'APEX ARCADE', line: 'GRAND PRIX', sub: 'RACE DAY' };
  ev.order = [];
  function drawScreens() {
    sx.fillStyle = '#081028'; sx.fillRect(0, 0, 512, 280); sx.fillStyle = '#ffc828'; sx.fillRect(0, 0, 512, 14); sx.fillRect(0, 266, 512, 14);
    sx.fillStyle = '#fff'; sx.textAlign = 'center'; sx.font = 'bold 64px sans-serif'; sx.fillText(ev.screenText.title, 256, 100);
    sx.font = 'bold 50px sans-serif'; sx.fillStyle = '#7fd4ff'; sx.fillText(ev.screenText.line, 256, 170); sx.font = '36px sans-serif'; sx.fillStyle = '#fff'; sx.fillText(ev.screenText.sub, 256, 230); screenTex.needsUpdate = true;
    tx.fillStyle = '#05070f'; tx.fillRect(0, 0, 128, 896); tx.fillStyle = '#ffc828'; tx.font = 'bold 22px sans-serif'; tx.textAlign = 'center'; tx.fillText('TIMING', 64, 34);
    tx.textAlign = 'left'; tx.font = 'bold 20px monospace';
    ev.order.slice(0, 20).forEach((name, i) => { tx.fillStyle = i % 2 ? '#1a2238' : '#121a2e'; tx.fillRect(4, 48 + i * 42, 120, 38); tx.fillStyle = '#ffc828'; tx.fillText(String(i + 1).padStart(2, ' '), 8, 74 + i * 42); tx.fillStyle = '#fff'; tx.fillText(String(name).slice(0, 6), 42, 74 + i * 42); });
    towerTex.needsUpdate = true;
  }
  drawScreens(); let screenT = 0;
  // ---------- particles: fireworks + confetti (3D, 2 draw calls) ----------
  const MAXP = 3000, pp = new Float32Array(MAXP * 3), pc = new Float32Array(MAXP * 3), pv = new Float32Array(MAXP * 3), pl = new Float32Array(MAXP); let pn = 0;
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; pts.name = 'fireworks'; root.add(pts);
  const spawn = (p, vel, c, life) => { const i = pn % MAXP; pn++; pp.set([p.x, p.y, p.z], i * 3); pv.set([vel.x, vel.y, vel.z], i * 3); pc.set([c.r, c.g, c.b], i * 3); pl[i] = life; };
  ev.fireworks = (center = sl, count = 5) => {
    for (let k = 0; k < count; k++) setTimeout(() => {
      const c = new THREE.Vector3(center.x + R(-60, 60), center.y + R(45, 80), center.z + R(-60, 60)), color = new THREE.Color().setHSL(Math.random(), 1, .6);
      play('fireworks_bang_' + (1 + (k % 2)), .9, c); if (k % 2) play('fireworks_crackle', .5, c);
      for (let j = 0; j < 160; j++) { const d = new THREE.Vector3().randomDirection().multiplyScalar(R(12, 26)); spawn(c, d, color, R(1.2, 2)); }
    }, k * 450 + 300);
    play('fireworks_launch', .6);
  };
  ev.confetti = (center = sl) => { play('confetti_pop', 1); for (let j = 0; j < 900; j++) { const p = new THREE.Vector3(center.x + R(-12, 12), center.y + R(8, 14), center.z + R(-12, 12)); spawn(p, new THREE.Vector3(R(-4, 4), R(2, 9), R(-4, 4)), new THREE.Color().setHSL(Math.random(), .9, .6), R(3, 5)); } };
  ev.finish = (winner = null) => {
    cf.visible = true; ev.setMarshalFlag(0xffffff); play('finish_horn', 1); excite(-1, 1); play('crowd_big_cheer', 1);
    ev.fireworks(sl, 7); ev.confetti(sl); ev.screenText = { title: 'APEX ARCADE', line: 'CHEQUERED FLAG', sub: winner && winner.name ? 'WINNER ' + winner.name.toUpperCase() : 'WINNER!' }; drawScreens();
    if (fx && fx.play) { try { fx.play('finish_line'); fx.play('fireworks', fx.w / 2, fx.h * .4); } catch (e) { } }   // Effects-Library hook (2D overlay)
    ev.onFinish && ev.onFinish(winner);
  };
  ev.podium = () => { const p = EV.podium; play('podium_fanfare', 1); play('crowd_applause', .9); ev.confetti(new THREE.Vector3(...p.first)); return { first: new THREE.Vector3(...p.first), second: new THREE.Vector3(...p.second), third: new THREE.Vector3(...p.third), facing: p.facing }; };
  // ---------- night mode ----------
  const lampMats = []; track.root.traverse(o => { if (o.isMesh && o.material && o.material.name === 'lamp') lampMats.push(o.material); });
  const floodLights = []; for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xfff4dd, 0, 140, 1.2); root.add(l); floodLights.push(l); }
  ev.setNight = on => {
    ev.night = on; lampMats.forEach(m => { m.emissive.setRGB(on ? 1 : .05, on ? 1 : .05, on ? .9 : .04); m.emissiveIntensity = on ? 3 : 1; });
    floodLights.forEach(l => l.intensity = on ? 2500 : 0); ev.nightChanged && ev.nightChanged(on);
  };
  // ---------- audio (positional crowd per stand, helicopter, one-shots) ----------
  const A = { on: false, buffers: {}, loops: [], listener: null, html: false };
  function play(name, vol = 1, pos = null) {
    if (!A.on) return;
    if (A.html) { const a = new Audio(soundBase + name + '.mp3'); a.volume = Math.min(1, vol * (pos ? distGain(pos, 400) : 1)); a.play().catch(() => { }); return; }
    const b = A.buffers[name]; if (!b) return;
    const s = pos ? new THREE.PositionalAudio(A.listener) : new THREE.Audio(A.listener); s.setBuffer(b); s.setVolume(vol);
    if (pos) { s.setRefDistance(60); s.position.copy(pos); root.add(s); } s.play(); s.onEnded = () => { s.isPlaying = false; s.parent && s.parent.remove(s); };
  }
  ev.play = play;
  const distGain = (p, ref) => { const d = camera.position.distanceTo(p); return Math.max(0, Math.min(1, ref / (ref + d * 2))); };
  ev.enableAudio = async () => {
    if (A.on) return true;
    const names = ['crowd_ambience_loop', 'crowd_roar_loop', 'crowd_roar_pass', 'crowd_big_cheer', 'crowd_applause', 'crowd_cheer_1', 'helicopter_loop', 'start_light_beep', 'lights_out_go', 'finish_horn', 'fireworks_launch', 'fireworks_bang_1', 'fireworks_bang_2', 'fireworks_crackle', 'confetti_pop', 'podium_fanfare'];
    A.listener = new THREE.AudioListener(); camera.add(A.listener);
    const loader = new THREE.AudioLoader();
    try { await Promise.all(names.map(n => loader.loadAsync(soundBase + n + '.mp3').then(b => A.buffers[n] = b))); }
    catch (e) { A.html = true; }    // file:// in some browsers blocks fetch: fall back to simple <audio> one-shots
    A.on = true;
    if (!A.html) {
      EV.grandstands.forEach((st, si) => {
        const c = new THREE.Vector3(...st.rows[3]);
        const bed = new THREE.PositionalAudio(A.listener); bed.setBuffer(A.buffers.crowd_ambience_loop); bed.setLoop(true); bed.setRefDistance(50); bed.setVolume(.5); bed.position.copy(c); root.add(bed); bed.play();
        const roar = new THREE.PositionalAudio(A.listener); roar.setBuffer(A.buffers.crowd_roar_loop); roar.setLoop(true); roar.setRefDistance(60); roar.setVolume(0); roar.position.copy(c); root.add(roar); roar.play();
        A.loops.push({ si, roar, c });
      });
      const h = new THREE.PositionalAudio(A.listener); h.setBuffer(A.buffers.helicopter_loop); h.setLoop(true); h.setRefDistance(40); h.setVolume(.8); heli.add(h); h.play();
    } else { const a = new Audio(soundBase + 'crowd_ambience_loop.mp3'); a.loop = true; a.volume = .35; a.play().catch(() => { }); A.htmlBed = a; }
    return !A.html;
  };
  ev.disableAudio = () => { A.on = false; if (A.listener) A.listener.setMasterVolume(0); A.htmlBed && A.htmlBed.pause(); };
  // excitement: -1 = all stands
  const cool = new Array(16).fill(0);
  function excite(si, amt) { const ex = U.uEx.value; for (let i = 0; i < ex.length; i++) if (si < 0 || i === si) ex[i] = Math.max(ex[i], amt); }
  ev.excite = excite;
  // ---------- per frame ----------
  const standC = EV.grandstands.map(st => new THREE.Vector3(...st.rows[3]));
  ev.update = (dt, cars = []) => {
    U.uTime.value += dt; const ex = U.uEx.value;
    // crowd reacts to cars near each stand
    standC.forEach((c, si) => {
      let near = 0; for (const car of cars) { const d = car.position.distanceTo(c); if (d < 140) near = Math.max(near, 1 - d / 140); }
      if (near > ex[si]) ex[si] += (near - ex[si]) * Math.min(1, dt * 4); else ex[si] += (near - ex[si]) * Math.min(1, dt * .6);
      cool[si] -= dt; if (near > .6 && cool[si] <= 0) { cool[si] = 6; play('crowd_roar_pass', .9, c); }
      if (A.loops[si]) A.loops[si].roar.setVolume(ex[si] * 1.4);
    });
    // helicopter follows the first car around the circuit
    const lead = cars[0]; heliA += dt * .25; rotor.rotation.y += dt * 40; tr.rotation.x += dt * 50;
    if (lead) { const tgt = v.copy(lead.position).add(new THREE.Vector3(Math.cos(heliA) * 70, 55, Math.sin(heliA) * 70)); heli.position.lerp(tgt, Math.min(1, dt * .6)); heli.lookAt(lead.position.x, heli.position.y, lead.position.z); }
    // particles
    for (let i = 0; i < Math.min(pn, MAXP); i++) { if (pl[i] <= 0) { pp[i * 3 + 1] = -9999; continue; } pl[i] -= dt; pv[i * 3 + 1] -= 9.8 * dt * .5; const dr = Math.pow(.3, dt); pv[i * 3] *= dr; pv[i * 3 + 1] *= dr; pv[i * 3 + 2] *= dr; pp[i * 3] += pv[i * 3] * dt; pp[i * 3 + 1] += pv[i * 3 + 1] * dt; pp[i * 3 + 2] += pv[i * 3 + 2] * dt; }
    pg.attributes.position.needsUpdate = true;
    // night: move the 6 point lights to the floodlights nearest the camera
    if (ev.night) { const F = EV.floodlights.map(f => ({ f, d: camera.position.distanceToSquared(v.set(...f.position)) })).sort((a, b) => a.d - b.d); floodLights.forEach((l, i) => F[i] && l.position.set(...F[i].f.position)); }
    screenT -= dt; if (screenT < 0) { screenT = 1; drawScreens(); }
  };
  ev.stats = { spectators: seats.length, flags: flags.count, crew: crewSeats.length };
  return ev;
}
