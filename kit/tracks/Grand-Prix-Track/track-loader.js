// Apex Grand Prix Track - three.js loader + race helpers (ES module, three r150+).
// Usage:
//   import { loadTrack } from './track-loader.js';
//   const track = await loadTrack({ scene, glbUrl:'grand-prix-track.glb', dataUrl:'track-data.json' });
//   track.placeOnGrid([car1, car2, ...]);              // cars face +Z in their own model space by default
//   const laps = track.createLapCounter({ laps:3, onLap:(n,t)=>{}, onFinish:(times)=>{} });
//   every frame: laps.update(car.position, now);  const s = track.surfaceAt(car.position, car.userData);
//                if (s.offTrack) slowDown(); car.position.y = s.height;
// Needs an import map (or bundler) that maps "three" and "three/addons/".
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadTrack({ scene, glbUrl = 'grand-prix-track.glb', dataUrl = 'track-data.json', data = null, glbArrayBuffer = null } = {}) {
  const loader = new GLTFLoader();
  const gltf = glbArrayBuffer ? await new Promise((ok, err) => loader.parse(glbArrayBuffer, '', ok, err)) : await loader.loadAsync(glbUrl);
  if (!data) data = await (await fetch(dataUrl)).json();
  const track = new Track(gltf, data);
  if (scene) scene.add(track.root);
  return track;
}

export class Track {
  constructor(gltf, data) {
    this.gltf = gltf; this.data = data; this.root = gltf.scene;
    this.meshes = {};
    this.root.traverse(o => { if (o.isMesh || o.isGroup) { if (o.name) this.meshes[o.name] = o; } if (o.isMesh) o.receiveShadow = true; });
    const c = data.centerline; this.n = c.length;
    this.P = c.map(p => new THREE.Vector3(p.x, p.y, p.z));
    this.halfWidth = data.trackWidth / 2;
    this.kerbWidth = 1.5;
    this.tmp = new THREE.Vector3();
    this.lightMat = this._findMaterial('light_off');
  }
  _findMaterial(name) { let m = null; this.root.traverse(o => { if (o.isMesh && o.material && o.material.name === name) m = o.material; }); return m; }
  /** Grid slot (1-based) -> { position, quaternion, yaw } for a model whose forward is +Z (set forward:'-z' or '+x' if different). */
  gridTransform(slot, forward = '+z') {
    const g = this.data.grid[(slot - 1) % this.data.grid.length];
    const off = { '+z': 0, '-z': Math.PI, '+x': -Math.PI / 2, '-x': Math.PI / 2 }[forward] || 0;
    const yaw = g.yawPlusZ + off;
    return { position: new THREE.Vector3(...g.position), yaw, quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw) };
  }
  placeOnGrid(cars, { forward = '+z', lift = 0 } = {}) {
    cars.forEach((car, i) => { const t = this.gridTransform(i + 1, forward); car.position.copy(t.position); car.position.y += lift; car.quaternion.copy(t.quaternion); car.userData.trackIndex = this.nearest(car.position).index; });
  }
  /** nearest centerline point. Pass the last index as hint for a fast local search. */
  nearest(pos, hint = -1) {
    const n = this.n; let best = 1e18, bi = 0;
    if (hint >= 0) { for (let k = -30; k <= 30; k++) { const i = (hint + k + n) % n; const d = this.P[i].distanceToSquared(pos); if (d < best) { best = d; bi = i; } } }
    if (hint < 0 || best > 900) { for (let i = 0; i < n; i += 2) { const d = this.P[i].distanceToSquared(pos); if (d < best) { best = d; bi = i; } } }
    // refine on segment
    const a = this.P[bi], b = this.P[(bi + 1) % n], ab = this.tmp.subVectors(b, a); const len2 = ab.lengthSq();
    const t = Math.max(0, Math.min(1, ((pos.x - a.x) * ab.x + (pos.z - a.z) * ab.z) / (ab.x * ab.x + ab.z * ab.z || 1)));
    const px = a.x + ab.x * t, pz = a.z + ab.z * t, py = a.y + ab.y * t;
    // driver's right = cross(tangent, up) = (-tz, 0, tx)
    const tl = Math.hypot(ab.x, ab.z) || 1, rx = -ab.z / tl, rz = ab.x / tl;
    const lateral = (pos.x - px) * rx + (pos.z - pz) * rz;
    const p0 = this.data.centerline[bi];
    return { index: bi, t, lateral, distance: p0.d + Math.sqrt(len2) * t, centerY: py, bankDeg: p0.bankDeg };
  }
  /** surface under a car: track | kerb | grass | gravel | runoff | pit. state (e.g. car.userData) keeps the search hint. */
  surfaceAt(pos, state = {}) {
    const q = this.nearest(pos, state.trackIndex ?? -1); state.trackIndex = q.index;
    const lat = q.lateral, a = Math.abs(lat), hw = this.halfWidth;
    const bank = Math.tan(q.bankDeg * Math.PI / 180);
    let surface = 'track', height = q.centerY - Math.max(-hw, Math.min(hw, lat)) * bank;
    if (a > hw + this.kerbWidth) surface = this.data.edgeSurface[q.index][lat > 0 ? 1 : 0];
    else if (a > hw) surface = 'kerb';
    if (this.inPitLane(pos)) surface = 'pit';
    return { surface, offTrack: !(surface === 'track' || surface === 'kerb' || surface === 'pit'), lateral: lat, distance: q.distance, index: q.index, height };
  }
  isOffTrack(pos, state = {}) { return this.surfaceAt(pos, state).offTrack; }
  inPitLane(pos) {
    const p = this.data.pitLane.path, w2 = (this.data.pitLane.width / 2) ** 2;
    for (let i = 0; i < p.length; i += 2) { const dx = pos.x - p[i][0], dz = pos.z - p[i][2]; if (dx * dx + dz * dz < w2) return true; }
    return false;
  }
  /** Lap counter: gates must be crossed in order; gate 0 is the start/finish line. */
  createLapCounter({ laps = 3, onLap = null, onFinish = null, onSector = null } = {}) {
    const G = this.data.checkpoints; const st = { lap: 0, next: 0, sector: 1, lapStart: null, times: [], finished: false, last: null, wrongWay: false };
    const side = (g, p) => (p.x - g.center[0]) * g.direction[0] + (p.z - g.center[2]) * g.direction[2];
    const across = (g, p) => Math.abs((p.x - g.center[0]) * g.right[0] + (p.z - g.center[2]) * g.right[2]);
    st.update = (pos, now = performance.now() / 1000) => {
      if (st.finished) return st;
      const g = G[st.next];
      if (st.last) {
        const a = side(g, st.last), b = side(g, pos);
        if (a < 0 && b >= 0 && across(g, pos) < g.halfWidth && Math.abs(b) < 30) {
          if (st.next === 0) {
            if (st.lap > 0) { const t = now - st.lapStart; st.times.push(t); onLap && onLap(st.lap, t); if (st.lap >= laps) { st.finished = true; onFinish && onFinish(st.times); } }
            st.lap++; st.lapStart = now;
          }
          if (g.sector !== st.sector) { st.sector = g.sector; onSector && onSector(g.sector); }
          st.next = (st.next + 1) % G.length;
        }
        // wrong way: moving against the gate direction for a while
        const prev = G[(st.next - 1 + G.length) % G.length];
        st.wrongWay = ((pos.x - st.last.x) * prev.direction[0] + (pos.z - st.last.z) * prev.direction[2]) < -0.05;
      }
      st.last = (st.last || new THREE.Vector3()).copy(pos);
      return st;
    };
    st.reset = () => { st.lap = 0; st.next = 0; st.times = []; st.finished = false; st.last = null; };
    return st;
  }
  /** Racing line sample at a distance (m) -> {position, direction, speedMs} for AI or cameras. */
  racingLineAt(dist) {
    const L = this.data.lengthMetres, n = this.n, f = ((dist % L + L) % L) / L * n, i = Math.floor(f) % n, j = (i + 1) % n, u = f - Math.floor(f);
    const R = this.data.racingLine.points, S = this.data.aiSpeed.speedMs;
    const a = new THREE.Vector3(...R[i]), b = new THREE.Vector3(...R[j]);
    return { position: a.clone().lerp(b, u), direction: b.clone().sub(a).normalize(), speedMs: S[i] * (1 - u) + S[j] * u, index: i };
  }
  /** start lights: 0..5 lamps lit (red). Clones the material so other scenes are not affected. */
  setStartLights(count) {
    const m = this.meshes['start_lights']; if (!m) return;
    m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.emissive.setRGB(count > 0 ? 1 : .15, 0, 0); o.material.emissiveIntensity = count > 0 ? 2 : 1; } });
  }
}
