// Source of preview.html (bundled with esbuild by build_preview.py). Shows how the pieces fit together.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Track, loadTrack } from '../track-loader.js';
import { createEvent } from '../grand-prix-event.js';
import { RaceCameras } from '../race-cameras.js';

const $ = id => document.getElementById(id);
const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
const H = Object.fromEntries(location.hash.slice(1).split('&').filter(Boolean).map(kv => kv.split('=')));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!H.shot });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); document.body.prepend(renderer.domElement);
const scene = new THREE.Scene(); const DAY = new THREE.Color(0x9fc9ee), NIGHT = new THREE.Color(0x070b18);
scene.background = DAY.clone(); scene.fog = new THREE.Fog(DAY.clone(), 600, 3200);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 9000);
const hemi = new THREE.HemisphereLight(0xdfefff, 0x4d6b3a, 1.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.2); sun.position.set(800, 1200, 400); scene.add(sun);
const orbit = new OrbitControls(camera, renderer.domElement); orbit.enabled = false; orbit.maxPolarAngle = Math.PI * .48;

const data = JSON.parse($('trackdata').textContent);
const track = await loadTrack({ scene, data, glbArrayBuffer: b64($('glb').textContent.trim()) });
const L = data.lengthMetres;
// ---------- placeholder cars (replace with real models: see MUSE-GUIDE.txt) ----------
const COLORS = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0xfb8c00, 0x8e24aa, 0x00acc1, 0xffffff];
function placeholderCar(color, i) {
  const g = new THREE.Group(); g.name = 'placeholder_car_' + (i + 1);
  const m = new THREE.MeshLambertMaterial({ color }), k = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); g.add(o); return o; };
  add(new THREE.BoxGeometry(.9, .5, 4.6), m, 0, .45, 0); add(new THREE.BoxGeometry(1.6, .35, 1.8), m, 0, .4, -.4);
  add(new THREE.BoxGeometry(1.9, .08, .5), m, 0, .3, 2.35); add(new THREE.BoxGeometry(1.4, .08, .6), m, 0, 1.05, -2.2); add(new THREE.BoxGeometry(.1, .5, .3), k, 0, .8, -2.2);
  add(new THREE.BoxGeometry(.5, .35, .7), k, 0, .85, -.2);
  const wg = new THREE.CylinderGeometry(.36, .36, .38, 12); wg.rotateZ(Math.PI / 2);
  for (const [x, z] of [[-.9, 1.6], [.9, 1.6], [-.9, -1.5], [.9, -1.5]]) add(wg, k, x, .36, z);
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
function setCam(m) { cams.director(false); $('dir').classList.remove('on'); if (m === 'orbit') { mode = 'orbit'; orbit.enabled = true; camera.position.set(700, 1050, 1350); orbit.target.set(700, 0, 380); scene.fog.far = 9000; camera.fov = 50; camera.updateProjectionMatrix(); orbit.update(); updateButtons(); } else { orbit.enabled = false; scene.fog.far = 3200; cams.setMode(m); } }
function updateButtons() { document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === mode)); $('mode').textContent = mode + (cams.directorOn ? ' (director)' : ''); }
$('dir').onclick = () => { const on = !cams.directorOn; orbit.enabled = false; cams.director(on); $('dir').classList.toggle('on', on); if (!on && mode === 'orbit') cams.setMode('chase'); updateButtons(); };
$('night').onclick = () => setNight(!ev.night);
function setNight(on) { ev.setNight(on); $('night').classList.toggle('on', on); scene.background.copy(on ? NIGHT : DAY); scene.fog.color.copy(on ? NIGHT : DAY); hemi.intensity = on ? .35 : 1.6; sun.intensity = on ? .15 : 2.2; }
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
  if (fx) { fx.update(dt); fx.draw(); }
  const s = track.surfaceAt(cams.target.position, cams.target.userData);
  $('hud').textContent = `${cams.target.name}  ${(cams.speedOf(cams.target) * 3.6 | 0)} km/h  lap ${Math.max(1, lapCounter.lap)}/2  sector ${lapCounter.sector}  ${s.surface}${s.offTrack ? ' (OFF TRACK)' : ''}`;
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').style.opacity = 0; }
}
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; frame(dt); drawMinimap(); renderer.render(scene, camera); requestAnimationFrame(loop); }
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (fx && fx.resize) fx.resize(); });
// hash options for testing:  #cam=tv&t=40&night=1&dir=1&finish=1
if (H.night === '1') setNight(true);
if (H.t) { racing = true; const T = +H.t; for (let k = 0; k < T * 20; k++) frame(.05); }
if (H.cam) setCam(H.cam); else { cams.setMode('intro'); if (!H.t) setTimeout(startRace, 600); }
if (H.dir === '1') $('dir').click();
if (H.finish === '1') finish();
if (H.cam && H.cam !== 'orbit' && H.t) for (let k = 0; k < 40; k++) frame(.05);
window.__gp = { track, ev, cams, cars, scene, renderer, frame, setCam, info: () => renderer.info.render };
updateButtons(); requestAnimationFrame(loop); $('loading').remove();
