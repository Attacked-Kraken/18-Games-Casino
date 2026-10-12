/* cf1 2026-10-11: light 3D casino floor behind the lobby cards. Cheap on phones: no shadows, pixel ratio <= 1.5, ~30 fps,
   pauses when the tab is hidden, a single still frame for reduced motion, and drops to 1x pixels if frames run slow.
   No WebGL: the CSS floor in index.html stays as the look. Uses the local three.module.min.js (no CDN). */
import * as THREE from './three.module.min.js';
const cv = document.getElementById('floor3d');
let R = null;
try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, powerPreference: 'low-power' }); if (!R.getContext()) R = null; } catch (e) { R = null; }
if (R) {
  let pr = Math.min(devicePixelRatio || 1, 1.5); R.setPixelRatio(pr);
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x12030a); scene.fog = new THREE.Fog(0x12030a, 6, 26);
  const cam = new THREE.PerspectiveCamera(55, 1, .1, 60);
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#4a0b17'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const cx = x * 128 + 64, cy = y * 128 + 64;
    g.strokeStyle = '#c99a3c'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy - 46); g.lineTo(cx + 46, cy); g.lineTo(cx, cy + 46); g.lineTo(cx - 46, cy); g.closePath(); g.stroke();
    g.fillStyle = '#1f3a6b'; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill(); g.fillStyle = '#e8b64a'; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill();
    g.strokeStyle = '#7a1a2a'; g.lineWidth = 3; g.beginPath(); g.arc(x * 128, y * 128, 30, 0, 7); g.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(24, 24); tex.anisotropy = 4;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ map: tex })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  scene.add(new THREE.HemisphereLight(0xffd6a8, 0x2a0508, 1.2));
  const pools = [[-3, 0xffb060], [3, 0xff3a5a], [0, 0xffd080]].map(([x, col], i) => { const l = new THREE.PointLight(col, 30, 12, 1.6); l.position.set(x, 3, -4 - i * 5); scene.add(l); return l; });
  /* rows of machines: one shared geometry, instanced bodies, glowing screens */
  const body = new THREE.BoxGeometry(1, 2.2, .9), cnt = 28;
  const bodies = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ color: 0x5c0c1c, roughness: .35, metalness: .5 }), cnt);
  const screens = new THREE.InstancedMesh(new THREE.PlaneGeometry(.78, .62), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), cnt);
  const toppers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.02, .22, .95), new THREE.MeshStandardMaterial({ color: 0xe8b04a, roughness: .25, metalness: 1 }), cnt);
  const d = new THREE.Object3D(), col = new THREE.Color(), hues = [];
  for (let i = 0; i < cnt; i++) { const side = i % 2 ? 1 : -1, k = i >> 1, x = side * (2.4 + (k % 2) * 3.2), z = -2 - Math.floor(k / 2) * 2.2;
    const ry = side > 0 ? -Math.PI / 2 + .25 : Math.PI / 2 - .25;
    d.position.set(x, 1.1, z); d.rotation.set(0, ry, 0); d.updateMatrix(); bodies.setMatrixAt(i, d.matrix);
    d.position.set(x, 2.31, z); d.updateMatrix(); toppers.setMatrixAt(i, d.matrix);
    d.position.set(x - side * .46 * Math.cos(.25) , 1.5, z + .46 * Math.sin(.25)); d.rotation.set(0, ry, 0); d.translateZ(0); d.updateMatrix(); screens.setMatrixAt(i, d.matrix);
    hues.push(Math.random()); screens.setColorAt(i, col.setHSL(hues[i], .85, .55)); }
  scene.add(bodies, screens, toppers);
  /* ceiling bulbs */
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffc477, toneMapped: false }), 70);
  for (let i = 0; i < 70; i++) { d.position.set((Math.random() - .5) * 18, 4 + Math.random() * 2, -Math.random() * 22); d.rotation.set(0, 0, 0); d.updateMatrix(); bulbs.setMatrixAt(i, d.matrix); }
  scene.add(bulbs);
  function size() { R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
  addEventListener('resize', size); size();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0, last = 0, slow = 0, n = 0;
  function draw(now) {
    if (!still) requestAnimationFrame(draw);
    if (document.hidden || now - last < 32) return; const dt = Math.min(.1, (now - last) / 1000 || .03); last = now; t += dt;
    cam.position.set(Math.sin(t * .08) * .8, 1.7, 4 - (t * .35) % 4.4); cam.lookAt(Math.sin(t * .08) * .4, 1.2, -8);
    if (t % 1 < dt) for (let i = 0; i < 28; i++) { hues[i] = (hues[i] + .07) % 1; screens.setColorAt(i, col.setHSL(hues[i], .85, .55)); }
    screens.instanceColor.needsUpdate = true;
    pools.forEach((l, i) => l.intensity = 26 + Math.sin(t * 1.3 + i) * 6);
    R.render(scene, cam);
    if (t > 2 && pr > 1) { slow += dt > .05 ? 1 : 0; if (++n === 60) { if (slow > 20) { pr = 1; R.setPixelRatio(1); size(); } slow = n = 0; } }
  }
  requestAnimationFrame(draw); if (still) draw(1000);
  cv.classList.add('on');
}
