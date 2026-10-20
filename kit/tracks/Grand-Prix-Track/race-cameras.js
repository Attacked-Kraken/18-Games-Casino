// Apex Grand Prix Track - race camera system for three.js.
//   import { RaceCameras } from './race-cameras.js';
//   const cams = new RaceCameras(camera, { track, cars, forward:'+z' });   // forward = the car model's nose axis
//   cams.attach(playerCar);      // car the camera follows (any Object3D)
//   cams.setMode('chase');       // see RaceCameras.MODES
//   cams.next();                 // cycle modes
//   cams.director(true);         // broadcast auto-director (cycles shots, picks battles / leader)
//   every frame: cams.update(dt);   (multiply your game dt by cams.timeScale if you want the slow-mo replay)
// Optional per car: car.userData.cameraOffsets = { onboard:[x,y,z], nose:[x,y,z], bumper:[x,y,z], rear:[x,y,z] } in car space.
import * as THREE from 'three';

const MODES = ['chase', 'heli', 'tv', 'onboard', 'nose', 'bumper', 'rear', 'leader', 'battle', 'intro', 'replay'];
const DEFAULT_OFFSETS = { onboard: [0, 0.95, -0.2], nose: [0, 0.75, 1.9], bumper: [0, 0.35, 2.4], rear: [0, 1.0, -0.6] };
const UP = new THREE.Vector3(0, 1, 0);

export class RaceCameras {
  static MODES = MODES;
  constructor(camera, { track = null, cars = [], forward = '+z', baseFov = 60 } = {}) {
    this.camera = camera; this.track = track; this.cars = cars; this.forward = forward; this.baseFov = baseFov;
    this.target = cars[0] || null; this.mode = 'chase'; this.timeScale = 1; this.modeTime = 0;
    this._dir = false; this._dirTimer = 0; this._pos = new THREE.Vector3(); this._look = new THREE.Vector3(); this._vel = new THREE.Vector3();
    this._prev = new Map(); this._speed = new Map(); this._progress = new Map(); this._towerIdx = -1; this._heliA = 0; this._snap = true;
    this.onModeChange = null; this.shotLength = [5, 9];
    this.towers = track && track.data.event ? track.data.event.cameraTowers.map(t => ({ ...t, p: new THREE.Vector3(...t.cameraPosition) })) : [];
  }
  attach(car) { this.target = car; if (car && !this.cars.includes(car)) this.cars.push(car); this._snap = true; return this; }
  setCars(cars) { this.cars = cars; if (!this.target) this.target = cars[0]; }
  setMode(name) { if (!MODES.includes(name)) throw new Error('unknown camera mode ' + name); this.mode = name; this.modeTime = 0; this._snap = true; this._towerIdx = -1; this.timeScale = name === 'replay' ? 0.3 : 1; this.onModeChange && this.onModeChange(name); return this; }
  next() { return this.setMode(MODES[(MODES.indexOf(this.mode) + 1) % MODES.length]); }
  director(on = true) { this._dir = on; this._dirTimer = 0; return this; }
  get directorOn() { return this._dir; }
  // ---- helpers ----
  _fwd(car, out = new THREE.Vector3()) { const a = { '+z': [0, 0, 1], '-z': [0, 0, -1], '+x': [1, 0, 0], '-x': [-1, 0, 0] }[this.forward]; return out.set(...a).applyQuaternion(car.quaternion).normalize(); }
  _local(car, off, out = new THREE.Vector3()) {
    const f = this._fwd(car), r = new THREE.Vector3().crossVectors(f, UP).normalize(), u = new THREE.Vector3().crossVectors(r, f);
    return out.copy(car.position).addScaledVector(r, off[0]).addScaledVector(u, off[1]).addScaledVector(f, off[2]);
  }
  _off(car, k) { return (car.userData.cameraOffsets && car.userData.cameraOffsets[k]) || DEFAULT_OFFSETS[k]; }
  speedOf(car) { return this._speed.get(car) || 0; }
  progressOf(car) { return this._progress.get(car) || 0; }
  leader() { let b = null, bp = -1e9; for (const c of this.cars) { const p = this.progressOf(c); if (p > bp) { bp = p; b = c; } } return b || this.target; }
  battlePair() { // two cars closest together (by progress), within 25 m
    const s = [...this.cars].sort((a, b) => this.progressOf(b) - this.progressOf(a)); let best = null, bd = 25;
    for (let i = 0; i + 1 < s.length; i++) { const d = this.progressOf(s[i]) - this.progressOf(s[i + 1]); if (d < bd) { bd = d; best = [s[i], s[i + 1]]; } }
    return best;
  }
  _track(dt) {
    for (const c of this.cars) {
      const p = this._prev.get(c); if (p && dt > 0) { const sp = p.distanceTo(c.position) / dt; this._speed.set(c, (this._speed.get(c) || sp) * .9 + sp * .1); }
      this._prev.set(c, (p || new THREE.Vector3()).copy(c.position));
      if (this.track) { const st = c.userData; const q = this.track.nearest(c.position, st.camIdx ?? -1); const L = this.track.data.lengthMetres;
        const last = this._progress.get(c); let d = q.distance; st.camIdx = q.index;
        if (last !== undefined) { const lap = Math.floor(last / L); let cand = lap * L + d; if (cand - last < -L / 2) cand += L; if (cand - last > L / 2) cand -= L; d = cand; }
        this._progress.set(c, d); }
    }
  }
  _apply(pos, look, dt, stiff = 6, fov = this.baseFov) {
    const cam = this.camera;
    if (this._snap) { this._pos.copy(pos); this._look.copy(look); this._snap = false; }
    else { const k = 1 - Math.exp(-stiff * dt); this._pos.lerp(pos, k); this._look.lerp(look, Math.min(1, k * 1.6)); }
    cam.position.copy(this._pos); cam.lookAt(this._look);
    if (Math.abs(cam.fov - fov) > .05) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); }
  }
  // ---- main ----
  update(dt) {
    dt = Math.min(dt, 0.1); this._track(dt); this.modeTime += dt;
    if (this._dir) this._direct(dt);
    const car = this.target; if (!car) return;
    const f = this._fwd(car), sp = this.speedOf(car), v = new THREE.Vector3(), l = new THREE.Vector3();
    switch (this.mode) {
      case 'chase': { // spring follow; pulls back and widens FOV with speed
        const back = 7 + sp * .05, up = 2.6 + sp * .01;
        v.copy(car.position).addScaledVector(f, -back).addScaledVector(UP, up); l.copy(car.position).addScaledVector(f, 6).addScaledVector(UP, 1);
        this._apply(v, l, dt, 5, this.baseFov + Math.min(22, sp * .22)); break; }
      case 'heli': { // drone that flies alongside then swoops over
        this._heliA += dt * .35; const r = new THREE.Vector3().crossVectors(f, UP).normalize(); const sw = Math.sin(this.modeTime * .5);
        v.copy(car.position).addScaledVector(r, 22 * Math.cos(this._heliA)).addScaledVector(f, 18 * Math.sin(this._heliA) + 10).addScaledVector(UP, 14 + 10 * sw);
        l.copy(car.position).addScaledVector(f, 8); this._apply(v, l, dt, 2.2, 50); break; }
      case 'tv': { // trackside towers: pick the nearest tower in the car's sector, zoom to keep the car framed
        if (!this.towers.length) return this.setMode('chase');
        let bi = 0, bd = 1e18; this.towers.forEach((t, i) => { const d = t.p.distanceToSquared(car.position); if (d < bd) { bd = d; bi = i; } });
        if (bi !== this._towerIdx) { this._towerIdx = bi; this._snap = true; }
        const dist = Math.sqrt(bd), fov = THREE.MathUtils.clamp(2 * Math.atan(9 / dist) * 180 / Math.PI, 6, 55);
        this._snap = this._snap; this._apply(this.towers[bi].p, l.copy(car.position).addScaledVector(UP, .8), dt, 30, fov); this.camera.fov = fov; this.camera.updateProjectionMatrix(); break; }
      case 'onboard': case 'nose': case 'bumper': {
        this._local(car, this._off(car, this.mode), v); l.copy(v).addScaledVector(f, 30); this._snap = true;
        this._apply(v, l, dt, 50, this.mode === 'onboard' ? 72 : 80); break; }
      case 'rear': { this._local(car, this._off(car, 'rear'), v); l.copy(v).addScaledVector(f, -30); this._snap = true; this._apply(v, l, dt, 50, 65); break; }
      case 'leader': { const ld = this.leader(); if (ld !== this.target) { this.target = ld; this._snap = true; } const fl = this._fwd(ld);
        v.copy(ld.position).addScaledVector(fl, -10).addScaledVector(UP, 4); l.copy(ld.position).addScaledVector(fl, 5); this._apply(v, l, dt, 4, 58); break; }
      case 'battle': { const pr = this.battlePair(); if (!pr) return this._chaseFallback(dt);
        const mid = new THREE.Vector3().addVectors(pr[0].position, pr[1].position).multiplyScalar(.5), gap = pr[0].position.distanceTo(pr[1].position), fb = this._fwd(pr[1]);
        const r = new THREE.Vector3().crossVectors(fb, UP).normalize();
        v.copy(mid).addScaledVector(fb, -(10 + gap)).addScaledVector(r, 4).addScaledVector(UP, 3 + gap * .15); this._apply(v, l.copy(mid).addScaledVector(UP, .8), dt, 3.5, 50); break; }
      case 'intro': { // start-grid flyover: sweep down the grid from the back, ending behind pole
        const G = this.track ? this.track.data.grid : null; if (!G) return this._chaseFallback(dt);
        const T = Math.min(1, this.modeTime / 9), a = new THREE.Vector3(...G[G.length - 1].position), b = new THREE.Vector3(...G[0].position), h = new THREE.Vector3(...G[0].heading);
        const r = new THREE.Vector3().crossVectors(h, UP).normalize(), s = T * T * (3 - 2 * T);
        v.lerpVectors(a, b, s).addScaledVector(h, -12 + 30 * s).addScaledVector(r, 14 * Math.cos(s * Math.PI)).addScaledVector(UP, 24 - 18 * s);
        l.lerpVectors(a, b, Math.min(1, s + .15)).addScaledVector(h, 20 * s); this._apply(v, l, dt, 4, 55);
        if (this.modeTime > 10 && this._dir) this.setMode('chase'); break; }
      case 'replay': { // finish-line slow motion: low camera beside the line, tracks the car through it
        const D = this.track ? this.track.data : null; const sl = D ? new THREE.Vector3(...D.startLine.position) : car.position.clone();
        const sd = D ? new THREE.Vector3(...D.startLine.direction) : f, r = new THREE.Vector3().crossVectors(sd, UP).normalize();
        v.copy(sl).addScaledVector(r, -(D ? D.trackWidth / 2 + 5.5 : 12)).addScaledVector(sd, 14).addScaledVector(UP, .7);
        const d = car.position.distanceTo(v); this._apply(v, l.copy(car.position).addScaledVector(UP, .6), dt, 40, THREE.MathUtils.clamp(2 * Math.atan(6 / d) * 57.3, 8, 60)); break; }
    }
  }
  _chaseFallback(dt) { const m = this.mode; this.mode = 'chase'; this.update(0); this.mode = m; }
  _direct(dt) {
    this._dirTimer -= dt; if (this._dirTimer > 0) return;
    const pr = this.battlePair(), r = Math.random();
    const pool = pr ? ['battle', 'battle', 'tv', 'heli', 'chase', 'onboard'] : ['tv', 'tv', 'heli', 'chase', 'leader', 'onboard', 'nose', 'rear', 'bumper'];
    let m = pool[(r * pool.length) | 0]; if (m === this.mode) m = pool[(pool.indexOf(m) + 1) % pool.length];
    if (Math.random() < .35 && this.cars.length) this.target = this.cars[(Math.random() * Math.min(6, this.cars.length)) | 0];
    this.setMode(m); this._dirTimer = this.shotLength[0] + Math.random() * (this.shotLength[1] - this.shotLength[0]);
  }
}
