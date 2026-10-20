// Source of preview.html (bundled with esbuild by build_preview.py). Shows how the pieces fit together.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Track, loadTrack } from '../track-loader.js';
import { createEvent } from '../grand-prix-event.js';
import { RaceCameras } from '../race-cameras.js';

const $ = id => document.getElementById(id);
const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
const H = Object.fromEntries(location.hash.slice(1).split('&').filter(Boolean).map(kv => kv.split('=')));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!H.shot });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); document.body.prepend(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); const DAY = new THREE.Color(0xa9c3dc), NIGHT = new THREE.Color(0x05070d);
scene.fog = new THREE.FogExp2(DAY.clone(), 0.00028);   // light haze for depth
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.4, 9000);
// HDR-style gradient sky with sun glow (values above 1.0), rendered into a PMREM environment for reflections
const data = JSON.parse($('trackdata').textContent);
const SUN = new THREE.Vector3(...data.render.sunDirection);
function makeSky(top, hor, gnd, sunI) {
  return new THREE.Mesh(new THREE.SphereGeometry(5000, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(hor) }, gnd: { value: new THREE.Color(gnd) }, sunDir: { value: SUN }, sunI: { value: sunI } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
    fragmentShader: 'uniform vec3 top,hor,gnd,sunDir; uniform float sunI; varying vec3 vD; void main(){ float h=vD.y; vec3 c = h>0.0 ? mix(hor, top, pow(clamp(h,0.0,1.0),0.55)) : mix(hor, gnd, clamp(-h*6.0,0.0,1.0)); float s=max(dot(normalize(vD),normalize(sunDir)),0.0); c += vec3(1.0,0.92,0.8)*(pow(s,800.0)*40.0+pow(s,12.0)*0.35)*sunI; gl_FragColor=vec4(c,1.0);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }' }));
}
const sky = makeSky(0x2a62b8, 0xbcd3e8, 0x6d7a5a, 1.0); sky.renderOrder = -1; sky.frustumCulled = false;
const skyNight = makeSky(0x02040b, 0x0c1426, 0x050605, 0.0); skyNight.visible = false; skyNight.frustumCulled = false;
const pmrem = new THREE.PMREMGenerator(renderer);
const es = new THREE.Scene(); const skyE = makeSky(0x2a62b8, 0xbcd3e8, 0x55603f, 1.0); es.add(skyE); const envDay = pmrem.fromScene(es, 0, 1, 9000).texture;
const ns = new THREE.Scene(); ns.add(makeSky(0x02040b, 0x101a30, 0x050605, 0.0)); const envNight = pmrem.fromScene(ns, 0, 1, 9000).texture;
scene.add(sky); scene.add(skyNight); scene.environment = envDay; scene.background = null;
const hemi = new THREE.HemisphereLight(0xdfefff, 0x4d6b3a, 0.35); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.6); scene.add(sun); scene.add(sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const SC = sun.shadow.camera; SC.left = SC.bottom = -45; SC.right = SC.top = 45; SC.near = 1; SC.far = 400;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
const orbit = new OrbitControls(camera, renderer.domElement); orbit.enabled = false; orbit.maxPolarAngle = Math.PI * .48;

const track = await loadTrack({ scene, data, glbArrayBuffer: b64($('glb').textContent.trim()) });
const L = data.lengthMetres;
// ---------- placeholder cars (replace with real models: see MUSE-GUIDE.txt) ----------
const COLORS = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0xfb8c00, 0x8e24aa, 0x00acc1, 0xffffff];
const CAR_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: .35, roughness: .32 });
function placeholderCar(color, i) {
  // one merged geometry per car (1 draw call), vertex coloured; casts the real-time sun shadow
  const parts = [], body = new THREE.Color(color), black = new THREE.Color(0x111111);
  const add = (geo, c, x, y, z) => { geo = geo.toNonIndexed(); geo.translate(x, y, z); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let k = 0; k < n; k++) a.set([c.r, c.g, c.b], k * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geo.deleteAttribute('uv'); parts.push(geo); };
  const cap = (r, l) => { const g = new THREE.CapsuleGeometry(r, l, 4, 10); g.rotateX(Math.PI / 2); return g; };
  add(cap(.42, 3.6), body, 0, .45, .1); add(new THREE.BoxGeometry(1.5, .32, 1.9), body, 0, .38, -.45);
  add(new THREE.BoxGeometry(1.9, .06, .5), body, 0, .22, 2.4); add(new THREE.BoxGeometry(1.3, .06, .55), body, 0, 1.0, -2.25); add(new THREE.BoxGeometry(.08, .55, .3), black, 0, .72, -2.2);
  add(new THREE.SphereGeometry(.27, 12, 8), new THREE.Color(0xf5f5f5), 0, .95, -.25);
  const wg = new THREE.CylinderGeometry(.36, .36, .38, 16); wg.rotateZ(Math.PI / 2);
  for (const [x, z] of [[-.9, 1.6], [.9, 1.6], [-.9, -1.5], [.9, -1.5]]) add(wg.clone(), black, x, .36, z);
  const geo = mergeGeometries(parts); const g = new THREE.Mesh(geo, CAR_MAT); g.castShadow = true; g.receiveShadow = true; g.name = 'placeholder_car_' + (i + 1);
  g.userData.cameraOffsets = { onboard: [0, 1.0, -.25], nose: [0, .75, 2.0], bumper: [0, .32, 2.6], rear: [0, 1.15, -.6] };
  g.name = 'CAR ' + (i + 1); return g;
}
const N = 8, cars = [];
for (let i = 0; i < N; i++) { const c = placeholderCar(COLORS[i], i); scene.add(c); cars.push(c); }
const drv = cars.map((c, i) => ({ s: 0, s0: 0, lat0: 0, k: .955 + Math.random() * .04 - i * .002, wob: Math.random() * 6, started: false, lane: ((i % 3) - 1) * 2.4 }));
function resetGrid() {
  track.placeOnGrid(cars, { forward: '+z' });
  cars.forEach((c, i) => { const g = data.grid[i]; drv[i].s = drv[i].s0 = g.distance - L; drv[i].lat0 = g.lateral; drv[i].started = false; });
}
resetGrid();
const lapCounter = track.createLapCounter({ laps: 2, onLap: (n, t) => toast('Lap ' + n + ': ' + t.toFixed(1) + ' s'), onFinish: () => finish() });
// ---------- event + cameras ----------
let fx = null; if (window.ApexFX) { fx = new window.ApexFX($('fx')); }
const ev = createEvent({ scene, track, camera, soundBase: '../Grand-Prix-Track-Sounds/', fx });
ev.order = cars.map(c => c.name.replace('CAR ', 'CAR'));
const cams = new RaceCameras(camera, { track, cars, forward: '+z' });
cams.attach(cars[0]);
let mode = 'intro', racing = false, finished = false, simT = 0;
cams.onModeChange = m => { mode = m; updateButtons(); };
// ---------- UI ----------
const MODES = [...RaceCameras.MODES, 'orbit'];
$('modes').innerHTML = MODES.map(m => `<button data-m="${m}">${m}</button>`).join('');
$('modes').onclick = e => { const m = e.target.dataset.m; if (!m) return; setCam(m); };
function setCam(m) { cams.director(false); $('dir').classList.remove('on'); if (m === 'orbit') { mode = 'orbit'; orbit.enabled = true; camera.position.set(700, 1050, 1350); orbit.target.set(700, 0, 380); scene.fog.density = 0.00012; camera.fov = 50; camera.updateProjectionMatrix(); orbit.update(); updateButtons(); } else { orbit.enabled = false; scene.fog.density = 0.00028; cams.setMode(m); } }
function updateButtons() { document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === mode)); $('mode').textContent = mode + (cams.directorOn ? ' (director)' : ''); }
$('dir').onclick = () => { const on = !cams.directorOn; orbit.enabled = false; cams.director(on); $('dir').classList.toggle('on', on); if (!on && mode === 'orbit') cams.setMode('chase'); updateButtons(); };
$('night').onclick = () => setNight(!ev.night);
function setNight(on) { ev.setNight(on); $('night').classList.toggle('on', on); sky.visible = !on; skyNight.visible = on; scene.environment = on ? envNight : envDay; scene.fog.color.copy(on ? NIGHT : DAY); hemi.intensity = on ? .25 : .35; sun.intensity = on ? .25 : 2.6; sun.color.setHex(on ? 0x8899cc : 0xfff2dd); renderer.toneMappingExposure = on ? 1.15 : 1.0; }
$('snd').onclick = async () => { if ($('snd').classList.contains('on')) { ev.disableAudio(); $('snd').classList.remove('on'); return; } const ok = await ev.enableAudio(); $('snd').classList.add('on'); toast(ok ? 'Sound on (positional crowd)' : 'Sound on (simple mode: put Grand-Prix-Track-Sounds next to this folder)'); };
$('start').onclick = () => startRace();
$('fin').onclick = () => finish();
$('tgt').onclick = () => { const i = (cars.indexOf(cams.target) + 1) % cars.length; cams.attach(cars[i]); toast('Following ' + cars[i].name); };
let toastT = 0; function toast(t) { $('toast').textContent = t; $('toast').style.opacity = 1; toastT = 2.5; }
function startRace() { finished = false; racing = false; resetGrid(); lapCounter.reset(); cams.setMode('intro'); ev.startSequence(() => { racing = true; if (!cams.directorOn && mode === 'intro') cams.setMode('chase'); }); }
function finish() { if (finished) return; finished = true; ev.finish(cams.leader()); cams.director(false); $('dir').classList.remove('on'); cams.attach(cams.leader()); cams.setMode('replay'); setTimeout(() => { cams.timeScale = 1; ev.podium(); }, 6000); }
// minimap
const mm = new Image(); mm.src = $('minimap').src; const mc = $('mm'), mx = mc.getContext('2d'), MM = data.minimap;
function drawMinimap() { const s = mc.width / MM.size; mx.clearRect(0, 0, mc.width, mc.height); mx.drawImage(mm, 0, 0, mc.width, mc.height);
  cars.forEach((c, i) => { const x = ((c.position.x - MM.worldMinXZ[0]) * MM.pixelsPerMetre + MM.offsetPx[0]) * s, y = ((c.position.z - MM.worldMinXZ[1]) * MM.pixelsPerMetre + MM.offsetPx[1]) * s; mx.fillStyle = '#' + COLORS[i].toString(16).padStart(6, '0'); mx.beginPath(); mx.arc(x, y, c === cams.target ? 6 : 4, 0, 7); mx.fill(); mx.strokeStyle = '#000'; mx.stroke(); });
  if (mode === 'orbit' || mode === 'tv' || mode === 'heli') { const x = ((camera.position.x - MM.worldMinXZ[0]) * MM.pixelsPerMetre + MM.offsetPx[0]) * s, y = ((camera.position.z - MM.worldMinXZ[1]) * MM.pixelsPerMetre + MM.offsetPx[1]) * s; mx.strokeStyle = '#fff'; mx.strokeRect(x - 4, y - 4, 8, 8); } }
// ---------- driving the placeholder cars on the racing line ----------
const tmpR = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0), look = new THREE.Vector3();
function drive(dt) {
  cars.forEach((c, i) => {
    const d = drv[i]; if (!racing) return;
    const rl = track.racingLineAt(d.s); const launch = Math.min(1, (d.s - d.s0) / 250 + .25);
    const v = rl.speedMs * d.k * launch * (1 + .02 * Math.sin(simT * .3 + d.wob)); d.s += Math.max(v, 8) * dt;
    const r2 = track.racingLineAt(d.s); tmpR.crossVectors(r2.direction, UPV).normalize();
    const f = Math.max(0, 1 - (d.s - d.s0) / 350); const lat = d.lat0 * f + d.lane * (1 - f) * (0.6 + 0.4 * Math.sin(simT * .07 + d.wob));
    c.position.copy(r2.position).addScaledVector(tmpR, lat); c.position.y += .02;
    look.copy(c.position).add(r2.direction); c.lookAt(look);   // lookAt points +Z at the target for Object3D (non-camera)
  });
  ev.order = [...cars].sort((a, b) => drv[cars.indexOf(b)].s - drv[cars.indexOf(a)].s).map(c => c.name.replace('CAR ', 'CAR'));
  lapCounter.update(cars[0].position, simT);
}
// ---------- loop ----------
let last = performance.now();
function frame(dt) {
  simT += dt * cams.timeScale; drive(dt * cams.timeScale); ev.update(dt, cars);
  if (mode !== 'orbit') cams.update(dt); else { orbit.update(); cams._track(dt); }
  const tgt = mode === 'orbit' ? orbit.target : cams.target.position; sun.target.position.copy(tgt); sun.position.copy(tgt).addScaledVector(SUN, 200); sun.target.updateMatrixWorld();
  if (fx) { fx.update(dt); fx.draw(); }
  const s = track.surfaceAt(cams.target.position, cams.target.userData);
  $('hud').textContent = `${cams.target.name}  ${(cams.speedOf(cams.target) * 3.6 | 0)} km/h  lap ${Math.max(1, lapCounter.lap)}/2  sector ${lapCounter.sector}  ${s.surface}${s.offTrack ? ' (OFF TRACK)' : ''}`;
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
}
let dcT = 0;
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; frame(dt); drawMinimap(); renderer.render(scene, camera);
  dcT -= dt; if (dcT < 0) { dcT = .5; const r = renderer.info.render; $('perf').textContent = r.calls + ' draw calls, ' + (r.triangles / 1000 | 0) + 'k tris'; }
  requestAnimationFrame(loop); }
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (fx && fx.resize) fx.resize(); });
// hash options for testing:  #cam=tv&t=40&night=1&dir=1&finish=1
if (H.night === '1') setNight(true);
if (H.t) { racing = true; const T = +H.t; for (let k = 0; k < T * 20; k++) frame(.05); }
if (H.cam) setCam(H.cam); else { cams.setMode('intro'); if (!H.t) setTimeout(startRace, 600); }
if (H.dir === '1') $('dir').click();
if (H.finish === '1') finish();
if (H.cam && H.cam !== 'orbit' && H.t) for (let k = 0; k < 40; k++) frame(.05);
window.__gp = { track, ev, cams, cars, scene, renderer, frame, setCam, orbit, info: () => renderer.info.render };
updateButtons(); requestAnimationFrame(loop); $('loading').remove();
