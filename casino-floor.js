/* fl1 2026-10-11 (owner: "make the casino floor more like a casino floor, walk to the games to play ... make it impressive"):
   walkable first-person 3D casino floor. Three.js r169 (local module, no CDN): ACES tone mapping, RoomEnvironment reflections,
   UnrealBloomPass with a threshold (only neon, bulbs and signs glow, so candy colors stay solid), baked-look light pools
   (painted into the carpet, no real-time shadows). Stations come from window.Lobby.games (games.json); each is a lit machine or
   table zoned by category with a floating neon sign and rating badge. Walk up -> "PLAY <name>" -> Lobby.open() (age gate).
   Phones: left-thumb joystick + drag to look. Desktop: WASD/arrows + mouse drag. Minimap, Games list with Go (teleport) / Play.
   Perf: pixel ratio <= 2, instanced decor, adaptive quality tiers, pauses when hidden. No WebGL / context lost / List button
   -> card list view (index.html). */
import * as THREE from './three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { EffectComposer } from './vendor/EffectComposer.js';
import { RenderPass } from './vendor/RenderPass.js';
import { UnrealBloomPass } from './vendor/UnrealBloomPass.js';
import { OutputPass } from './vendor/OutputPass.js';

const $ = (id) => document.getElementById(id);
const L = window.Lobby;
const VKEY = 'cf_view', SKEY = 'cf_mute';
const cv = $('floor3d');
const lowEnd = (navigator.hardwareConcurrency || 4) <= 2 || (navigator.deviceMemory || 4) <= 1;
let gl = null;
try { gl = cv.getContext('webgl2', { antialias: false, powerPreference: 'high-performance' }); } catch (e) {}
const canWalk = !!gl && !!L;
const walkBtn = $('bWalk');
if (canWalk) { walkBtn.hidden = false; walkBtn.onclick = () => { try { localStorage.setItem(VKEY, '3d'); } catch (e) {} location.reload(); }; }
$('bList').onclick = () => { try { localStorage.setItem(VKEY, 'list'); } catch (e) {} location.reload(); };
let pref = ''; try { pref = localStorage.getItem(VKEY) || ''; } catch (e) {}
const forceList = /[?&]view=list/.test(location.search), force3d = /[?&]view=3d/.test(location.search);
if (canWalk && !forceList && (force3d || pref === '3d' || (pref !== 'list' && !lowEnd))) start();

function start() {
document.body.classList.add('walk');
const mobile = matchMedia('(pointer: coarse)').matches;
const R = new THREE.WebGLRenderer({ canvas: cv, context: gl, antialias: false, powerPreference: 'high-performance' });
const DPR = Math.min(2, devicePixelRatio || 1);
const TIERS = [{ pr: Math.min(DPR, 2), bloom: 1 }, { pr: Math.min(DPR, 1.5), bloom: 1 }, { pr: Math.min(DPR, 1.15), bloom: 1 }, { pr: 1, bloom: 0 }, { pr: .75, bloom: 0 }];
let tier = mobile ? 2 : 1;
R.setPixelRatio(TIERS[tier].pr);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.1;
R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070505);
scene.fog = new THREE.Fog(0x070505, 22, 58);
const pmrem = new THREE.PMREMGenerator(R);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .55;
const cam = new THREE.PerspectiveCamera(68, 1, .1, 120);

/* ---------- room ---------- */
const W = 36, D = 56, H = 7.5;            // x: -18..18, z: -28..28
const CANDY = [0x7a1424, 0x9a6a18, 0x1d3f7a, 0x4a1f5e, 0x0f5a3e, 0x8a4a18, 0x5e101c, 0x1b2a52]; /* lux: jewel tones */
const J = (c) => { const col = new THREE.Color(c), h = {}; col.getHSL(h); return new THREE.Color().setHSL(h.h, Math.min(.75, h.s * .85), Math.min(.3, Math.max(.1, h.l * .55))).getHex(); };
function canvasTex(w, h, fn, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
/* patterned casino carpet: deep plum base, candy medallions, gold lattice */
const carpet = canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#2a0a0e'; g.fillRect(0, 0, w, w); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .08})`; g.fillRect(Math.random() * w, Math.random() * w, 2, 2); }
  g.strokeStyle = 'rgba(176,141,87,.28)'; g.lineWidth = 1.5; for (let i = -1; i < 3; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128 + 256, 256); g.moveTo(i * 128 + 256, 0); g.lineTo(i * 128, 256); g.stroke(); }
  [[0, 0], [256, 0], [0, 256], [256, 256], [128, 128]].forEach(([x, y]) => { g.save(); g.translate(x, y); for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.ellipse(0, 22, 7, 20, 0, 0, 7); g.stroke(); } g.restore(); });
}, [W / 3, D / 3]);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: carpet, roughness: .97 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
/* baked light pools: additive radial decals just above the carpet */
const poolTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
function pool(x, z, s, col, o = .5) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: poolTex, color: col, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, .012, z); scene.add(m); return m; }
/* glossy walkway strips (reflect the env map) */
const marbleT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#0e0c0c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 24; i++) { g.strokeStyle = `rgba(225,215,195,${.08 + Math.random() * .35})`; g.lineWidth = .4 + Math.random() * 2; g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (Math.random() - .5) * 36; y += 6 + Math.random() * 16; g.lineTo(x, y); } g.stroke(); } }, [2, 8]);
const stripMat = new THREE.MeshStandardMaterial({ map: marbleT, color: 0x6a6460, roughness: .2, metalness: 0 });
[[0, 0, 3.2, D - 2], [0, 14, W - 2, 2.4], [0, -12, W - 2, 2.4]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), stripMat); m.rotation.x = -Math.PI / 2; m.position.set(x, .006, z); scene.add(m);
  const e = new THREE.Mesh(new THREE.PlaneGeometry(w, .08), new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 1, roughness: .3 })); e.rotation.x = -Math.PI / 2;
  const e2 = e.clone(); if (w > d) { e.position.set(x, .01, z - d / 2); e2.position.set(x, .01, z + d / 2); } else { e.geometry = new THREE.PlaneGeometry(.08, d); e2.geometry = e.geometry; e.position.set(x - w / 2, .01, z); e2.position.set(x + w / 2, .01, z); } scene.add(e, e2); });
/* walls with damask panels + neon trim, dark ceiling with coffers */
const wallTex = canvasTex(128, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a1209'); gr.addColorStop(.5, '#3a180b'); gr.addColorStop(1, '#2a1209'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${Math.random() < .5 ? '10,4,2' : '90,45,20'},.25)`; g.beginPath(); const x = Math.random() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 6, h / 3, x - 6, h * 2 / 3, x + 2, h); g.stroke(); }
  g.strokeStyle = '#a07c48'; g.lineWidth = 2; g.strokeRect(12, 14, w - 24, h - 28); g.strokeRect(18, 20, w - 36, h - 40); g.fillStyle = '#d9b77a'; g.fillRect(w / 2 - 6, 52, 12, 22);
}, [1, 1]);
const wallMat = (len) => { const t = wallTex.clone(); t.needsUpdate = true; t.repeat.set(len / 3, 1); return new THREE.MeshStandardMaterial({ map: t, roughness: .45 }); };
[[0, -D / 2, 0, W], [0, D / 2, Math.PI, W], [-W / 2, 0, Math.PI / 2, D], [W / 2, 0, -Math.PI / 2, D]].forEach(([x, z, ry, len]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, H), wallMat(len)); m.position.set(x, H / 2, z); m.rotation.y = ry; scene.add(m);
  const n = new THREE.Mesh(new THREE.BoxGeometry(len, .08, .08), new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 1, roughness: .3 })); n.position.set(x, H - .4, z); n.rotation.y = ry; n.translateZ(.05); scene.add(n);
  const n2 = new THREE.Mesh(new THREE.BoxGeometry(len, .06, .06), new THREE.MeshStandardMaterial({ color: 0x1a0c08, roughness: .4 })); n2.position.set(x, .35, z); n2.rotation.y = ry; n2.translateZ(.05); scene.add(n2); });
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ color: 0x0c0706 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; scene.add(ceil);
scene.add(new THREE.HemisphereLight(0xffe0c0, 0x140806, .75));
const sun = new THREE.DirectionalLight(0xffd8a0, .7); sun.position.set(4, 10, 6); scene.add(sun);
const pts = [[0, 0, 0xffc070], [-9, 10, 0xffb870], [9, 10, 0xffc890], [-9, -14, 0xffb870], [9, -14, 0xffc890], [0, -22, 0xffb870]].map(([x, z, c]) => { const l = new THREE.PointLight(c, 40, 16, 1.5); l.position.set(x, 5, z); scene.add(l); return l; });

/* ---------- colliders ---------- */
const boxes = []; // [minx, minz, maxx, maxz]
function block(x, z, hw, hd) { boxes.push([x - hw, z - hd, x + hw, z + hd]); }
function blockR(x, z, r) { block(x, z, r * .85, r * .85); }

/* ---------- neon sign textures ---------- */
function neonTex(text, col, sub, badge, lock) {
  return canvasTex(512, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,8,7,.92)'; g.fillRect(6, 6, w - 12, h - 12);
    g.strokeStyle = '#b08d57'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20); g.lineWidth = 1; g.strokeRect(18, 18, w - 36, h - 36);
    const SER = "'Didot','Bodoni 72','Playfair Display',Georgia,serif"; let fs = 58; g.font = `400 ${fs}px ${SER}`; while (g.measureText(text).width > w - (badge ? 170 : 70) && fs > 24) { fs -= 3; g.font = `400 ${fs}px ${SER}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; const tg = g.createLinearGradient(0, 40, 0, 120); tg.addColorStop(0, '#f3dfae'); tg.addColorStop(1, '#b8924f'); g.fillStyle = tg; g.fillText(text, badge ? w / 2 - 44 : w / 2, sub ? 80 : 96);
    if (sub) { g.font = '500 17px Helvetica, Arial, sans-serif'; g.fillStyle = '#a89c8a'; g.fillText(sub.toUpperCase(), w / 2, 146); }
    if (badge) { const bx = w - 74, by = 80; g.strokeStyle = '#b08d57'; g.lineWidth = 2; g.beginPath(); g.arc(bx, by, 36, 0, 7); g.stroke(); g.fillStyle = lock ? '#b0485a' : '#d9bf85';
      g.font = `400 30px ${SER}`; g.fillText(badge, bx, by + 2); }
  });
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function signMesh(tex, w) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 192 / 512), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false })); return m; }
const billboards = [];

/* ---------- shared materials ---------- */
const gold = new THREE.MeshStandardMaterial({ color: 0xc49a52, roughness: .32, metalness: 1 });
const chrome = new THREE.MeshStandardMaterial({ color: 0xb9b4ac, roughness: .2, metalness: 1 });
const lacq = (c) => new THREE.MeshPhysicalMaterial({ color: c === 0xffffff ? c : J(c), roughness: .3, metalness: .1, clearcoat: 1, clearcoatRoughness: .1 });
const glow = (c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).lerp(new THREE.Color(0xffc27a), .55).multiplyScalar(.85), toneMapped: false });
const dummy = new THREE.Object3D(), tmpC = new THREE.Color();

/* ---------- decor: instanced slot banks ---------- */
const decorPos = [];
for (const x of [-15.6, 15.6]) for (let z = -22; z <= 22; z += 1.35) { if (Math.abs(z - 14) < 2 || Math.abs(z + 12) < 2) continue; decorPos.push([x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2]); }
for (const z of [24.6]) for (let x = -12; x <= 12; x += 1.35) { if (Math.abs(x) < 3) continue; decorPos.push([x, z, Math.PI]); }
for (let x = -13; x <= 13; x += 1.35) { if (Math.abs(x) < 2.2) continue; decorPos.push([x, -26.6, 0]); }
const nD = decorPos.length;
const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 1.9, .85), lacq(0xffffff), nD);
const scr = new THREE.InstancedMesh(new THREE.PlaneGeometry(.8, .62), glow(0xffffff), nD);
const top = new THREE.InstancedMesh(new THREE.CylinderGeometry(.55, .55, 1.1, 16, 1, false, 0, Math.PI), glow(0xffffff), nD);
const sto = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .26, .5, 10), lacq(0x7a0a2a), nD);
const decHue = [];
decorPos.forEach(([x, z, ry], i) => {
  const c = CANDY[i % CANDY.length]; decHue.push(i % CANDY.length);
  dummy.position.set(x, .95, z); dummy.rotation.set(0, ry, 0); dummy.updateMatrix(); cab.setMatrixAt(i, dummy.matrix); cab.setColorAt(i, tmpC.setHex(J(c)));
  dummy.translateZ(.43); dummy.position.y = 1.25; dummy.updateMatrix(); scr.setMatrixAt(i, dummy.matrix); scr.setColorAt(i, tmpC.setHex(c));
  dummy.position.set(x, 1.9, z); dummy.rotation.set(0, ry, Math.PI / 2); dummy.rotateX(Math.PI / 2); dummy.updateMatrix();
  dummy.position.set(x, 1.9, z); dummy.rotation.set(0, ry, 0); dummy.rotateZ(Math.PI / 2); dummy.updateMatrix(); top.setMatrixAt(i, dummy.matrix); top.setColorAt(i, tmpC.setHex(0x8a6a3a));
  block(x, z, .6, .6);
});
scene.add(cab, scr, top);
/* screens get a painted reel face for detail */
const reelTex = canvasTex(128, 100, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 100); const sy = ['7', '♦', '★', '♥', '$', '♣']; g.font = '400 34px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) { g.fillStyle = '#1a0010'; g.fillRect(8 + i * 39, 14, 34, 72); g.fillStyle = '#fff'; g.fillText(sy[(i * 2 + 1) % 6], 25 + i * 39, 50); } });
scr.material.map = reelTex; scr.material.needsUpdate = true;

/* ---------- chandeliers (instanced crystal bulbs) ---------- */
const chand = [[0, 0, 2.6], [-8, 14, 1.8], [8, 14, 1.8], [-8, -12, 1.8], [8, -12, 1.8], [0, 20, 1.6], [0, -20, 1.6]];
const per = 36, bulbs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.07, 0), glow(0xffe6a0), chand.length * per * 2);
let bi = 0;
chand.forEach(([x, z, r]) => {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .05, 6, 40), gold); ring.rotation.x = Math.PI / 2; ring.position.set(x, H - 1.3, z); scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(r * .6, .04, 6, 30), gold); ring2.rotation.x = Math.PI / 2; ring2.position.set(x, H - .9, z); scene.add(ring2);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.3, 6), gold); rod.position.set(x, H - .65, z); scene.add(rod);
  for (let k = 0; k < per; k++) { const a = k / per * Math.PI * 2; for (const [rad, y] of [[r, H - 1.45 - (k % 2) * .18], [r * .6, H - 1.05]]) { dummy.position.set(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); bulbs.setMatrixAt(bi++, dummy.matrix); } }
  pool(x, z, r * 5.5, 0xffc070, .32);
});
bulbs.count = bi; scene.add(bulbs);
/* ceiling twinkle lights */
const nTw = 160, tw = new THREE.InstancedMesh(new THREE.SphereGeometry(.04, 5, 3), glow(0xffffff), nTw), twC = [];
for (let i = 0; i < nTw; i++) { dummy.position.set((Math.random() - .5) * (W - 1), H - .05, (Math.random() - .5) * (D - 1)); dummy.updateMatrix(); tw.setMatrixAt(i, dummy.matrix); twC.push(CANDY[i % 8]); tw.setColorAt(i, tmpC.setHex(0xffd9a0)); }
scene.add(tw);

/* ---------- center bar + neon centerpiece ---------- */
{
  const bar = new THREE.Group(); bar.position.set(0, 0, 4);
  const counter = new THREE.Mesh(new THREE.TorusGeometry(2.6, .45, 10, 48, Math.PI * 2), lacq(0x3a1408)); counter.rotation.x = Math.PI / 2; counter.position.y = 1.0; counter.scale.z = 2.2; bar.add(counter);
  const topr = new THREE.Mesh(new THREE.TorusGeometry(2.6, .5, 6, 48), new THREE.MeshStandardMaterial({ color: 0x18060f, roughness: .05, metalness: .3 })); topr.rotation.x = Math.PI / 2; topr.position.y = 1.15; topr.scale.z = .15; bar.add(topr);
  const ledA = new THREE.Mesh(new THREE.TorusGeometry(3.08, .04, 6, 64), gold); ledA.rotation.x = Math.PI / 2; ledA.position.y = .3; bar.add(ledA);
  const ledB = ledA.clone(); ledB.material = gold; ledB.position.y = 1.22; ledB.scale.setScalar(1.005); bar.add(ledB);
  /* back shelf of bottles */
  const shelf = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 2.2, 24), lacq(0x2a0618)); shelf.position.y = 1.1; bar.add(shelf);
  const bot = new THREE.InstancedMesh(new THREE.CylinderGeometry(.07, .09, .42, 8), new THREE.MeshStandardMaterial({ roughness: .05, metalness: .1, transparent: true, opacity: .9 }), 48);
  for (let i = 0; i < 48; i++) { const a = i / 24 * Math.PI * 2, row = i >= 24 ? 1 : 0; dummy.position.set(Math.cos(a) * 1.42, 1.0 + row * .6, Math.sin(a) * 1.42); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); bot.setMatrixAt(i, dummy.matrix); bot.setColorAt(i, tmpC.setHex(CANDY[i % 8])); }
  bar.add(bot);
  /* stools */
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const s = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .1, 14), lacq(CANDY[i % 8])); s.position.set(Math.cos(a) * 3.55, .75, Math.sin(a) * 3.55); bar.add(s);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .7, 6), chrome); p.position.set(Math.cos(a) * 3.55, .37, Math.sin(a) * 3.55); bar.add(p); }
  /* spinning neon crown + "18" emblem */
  const crown = new THREE.Group(); crown.position.y = 4.4; bar.add(crown);
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(1.6 - i * .35, .04, 8, 64), gold); t.rotation.x = Math.PI / 2 + i * .5; t.rotation.y = i * .9; crown.add(t); }
  const cs = signMesh(neonTex('18 Games Casino', '#c9a45c', 'High limit salon'), 4.2); cs.position.y = 2.95; bar.add(cs); billboards.push(cs);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 2.6, 8), gold); col.position.y = 3.5; bar.add(col);
  bar.userData.crown = crown; scene.add(bar); window.__crown = crown;
  pool(0, 4, 12, 0xffc070, .22);
  blockR(0, 4, 3.4); for (let z = 1; z <= 7; z += .8) block(0, z, 3.35, .5);
}

/* ---------- zones & stations ---------- */
const ZONES = {
  slots:   { label: 'SLOTS',          col: '#c9a45c', x: -9,  z: 16,  axis: 'x', face: Math.PI, sign: [-9, 21.5] },
  tables:  { label: 'TABLE PIT',      col: '#c9a45c', x: 9,   z: 16,  axis: 'x', face: Math.PI, sign: [9, 21.5] },
  cards:   { label: 'CARD ROOM',      col: '#c9a45c', x: 9,   z: -8,  axis: 'x', face: 0, sign: [9, -3.5] },
  instant: { label: 'INSTANT WINS',   col: '#c9a45c', x: -9,  z: -8,  axis: 'x', face: 0, sign: [-9, -3.5] },
  action:  { label: 'ACTION ARCADE',  col: '#c9a45c', x: 0,   z: -21, axis: 'x', face: 0, sign: [0, -16.5] }
};
Object.values(ZONES).forEach((zn) => { const s = signMesh(neonTex(zn.label, zn.col), 5); s.position.set(zn.sign[0], 5.2, zn.sign[1]); scene.add(s); billboards.push(s);
  pool(zn.x, zn.z, 13, 0xffc070, .2); });
const stations = []; // { g, pos: Vector3 (front stand point), look: Vector3, mesh group, sign, ring }
let stationRoot = new THREE.Group(); scene.add(stationRoot);
const texLoader = new THREE.TextureLoader();
function iconTex(g) { const t = texLoader.load(g.icon, undefined, undefined, () => {}); t.colorSpace = THREE.SRGBColorSpace; return t; }
function buildStation(g, x, z, face, locked) {
  const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = face;
  const ac = new THREE.Color(g.accent), acHex = ac.getHex();
  const cat = g.category;
  if (cat === 'slots' || cat === 'instant') {
    const big = cat === 'slots';
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 1.1), lacq(acHex)); body.position.y = 1.15; grp.add(body);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.58, .12, 1.18), gold); trim.position.y = 2.3; grp.add(trim);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshBasicMaterial({ map: iconTex(g), color: 0xd8d8d8 })); sc.position.set(0, 1.55, .56); grp.add(sc);
    const fr = new THREE.Mesh(new THREE.TorusGeometry(.82, .045, 6, 4), gold); fr.rotation.z = Math.PI / 4; fr.position.set(0, 1.55, .57); grp.add(fr);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, .14, .5), chrome); deck.position.set(0, .82, .7); deck.rotation.x = -.25; grp.add(deck);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .06, 14), lacq(0x7a1424)); btn.position.set(.4, .9, .78); grp.add(btn);
    if (big) { const lev = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .9, 8), chrome); lev.position.set(.86, 1.6, 0); grp.add(lev);
      const kn = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), lacq(0x7a1424)); kn.position.set(.86, 2.08, 0); grp.add(kn); }
    const topper = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 1.5, 24, 1, false, 0, Math.PI), lacq(0x1a0c08)); topper.rotation.z = Math.PI / 2; topper.rotation.y = Math.PI / 2; topper.position.y = 2.36; grp.add(topper);
    if (!big) { const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 1), gold); orb.position.set(0, 3.25, 0); grp.add(orb); grp.userData.spin = orb; }
    block(x, z, .95, .95);
  } else if (cat === 'tables' || cat === 'cards') {
    const felt = cat === 'cards' ? 0x0a3a2a : 0x0c3b22;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.5, .7, .78, 16), lacq(0x2a0618)); base.position.y = .39; grp.add(base);
    const tab = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .12, 40, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: felt, roughness: .97, envMapIntensity: .15 })); tab.position.y = .85; tab.rotation.y = Math.PI / 2; grp.add(tab);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(1.6, .1, 8, 40, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a0d0a, roughness: .55 })); rail.rotation.x = -Math.PI / 2; rail.rotation.z = Math.PI; rail.position.y = .92; rail.rotation.z = 0; rail.rotation.set(-Math.PI / 2, 0, Math.PI); grp.add(rail);
    rail.rotation.set(Math.PI / 2, 0, 0);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(3.3, .14, .16), gold); edge.position.set(0, .88, 0); grp.add(edge);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.72, .025, 4, 40, Math.PI), gold); lip.rotation.x = Math.PI / 2; lip.position.y = .8; grp.add(lip);
    const logo = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshStandardMaterial({ map: iconTex(g), roughness: .9 })); logo.rotation.x = -Math.PI / 2; logo.position.set(0, .915, .7); grp.add(logo);
    for (let i = 0; i < 6; i++) { const a = Math.PI * (i + .5) / 6; const c = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .05 + (i % 3) * .05, 14), lacq(CANDY[i])); c.position.set(-Math.cos(a) * 1.15, .94, Math.sin(a) * 1.15); grp.add(c);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .08, 14), lacq(acHex)); st.position.set(-Math.cos(a) * 2.05, .7, Math.sin(a) * 2.05); grp.add(st);
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .66, 6), chrome); pl.position.set(-Math.cos(a) * 2.05, .33, Math.sin(a) * 2.05); grp.add(pl); }
    if (cat === 'cards') for (let i = 0; i < 5; i++) { const cd = new THREE.Mesh(new THREE.PlaneGeometry(.18, .26), new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: .6 })); cd.rotation.x = -Math.PI / 2; cd.rotation.z = (i - 2) * .12; cd.position.set((i - 2) * .22, .92, .25); grp.add(cd); }
    else { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .1, 24), gold); wh.position.set(0, .95, .3); grp.add(wh); grp.userData.spin = wh; }
    const lamp = new THREE.Mesh(new THREE.ConeGeometry(.9, .5, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a0c08, metalness: .6, roughness: .35, emissive: 0xffb060, emissiveIntensity: .15, side: THREE.DoubleSide })); lamp.position.y = 3.6; grp.add(lamp);
    block(x, z + (face === 0 ? -.2 : .2), 1.75, 1.1);
  } else { // action arcade cabinet
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 1.2), lacq(0x12082a)); body.position.y = 1.25; grp.add(body);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ map: iconTex(g), toneMapped: false })); sc.position.set(0, 1.7, .61); sc.rotation.x = -.1; grp.add(sc);
    for (const sx of [-.93, .93]) { const s = new THREE.Mesh(new THREE.BoxGeometry(.06, 2.5, 1.24), gold); s.position.set(sx, 1.25, 0); grp.add(s); }
    const cp = new THREE.Mesh(new THREE.BoxGeometry(1.8, .16, .6), lacq(acHex)); cp.position.set(0, 1.0, .75); cp.rotation.x = -.3; grp.add(cp);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .25, 8), chrome); st.position.set(-.4, 1.15, .8); grp.add(st);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 8), glow(0xff2d55)); ball.position.set(-.4, 1.28, .8); grp.add(ball);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .05, 12), glow(CANDY[i])); b.position.set(.15 + i * .2, 1.08, .82); grp.add(b); }
    block(x, z, 1.05, .8);
  }
  /* pedestal glow ring + floating neon sign w/ rating badge */
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.05, 48), new THREE.MeshBasicMaterial({ color: locked ? 0x8e1b2c : 0xb08d57, transparent: true, opacity: .55 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; grp.add(ring);
  const sign = signMesh(neonTex(g.title, '#' + ac.getHexString(), (g.multiplayer ? 'Private tables · ' : '') + (locked ? 'Members 18+' : 'Approach to play'), g.rating + '+', locked), 2.9);
  sign.position.set(x, cat === 'tables' || cat === 'cards' ? 2.7 : 3.55 + (cat === 'instant' ? .6 : 0), z); scene.add(sign); billboards.push(sign);
  stationRoot.add(grp);
  pool(x, z, 5, 0xffc070, .3);
  const fwd = new THREE.Vector3(Math.sin(face), 0, Math.cos(face));
  const standDist = cat === 'tables' || cat === 'cards' ? 2.6 : 2.0;
  return { g, grp, sign, ring, center: new THREE.Vector3(x, 0, z), stand: new THREE.Vector3(x + fwd.x * standDist, 0, z + fwd.z * standDist), locked };
}
const stationBlocksStart = boxes.length;
let extraPool = [];
function layout(games) {
  scene.remove(stationRoot); stationRoot = new THREE.Group(); scene.add(stationRoot);
  stations.forEach((s) => scene.remove(s.sign)); for (const s of stations) { const i = billboards.indexOf(s.sign); if (i >= 0) billboards.splice(i, 1); }
  stations.length = 0; boxes.length = stationBlocksStart;
  const by = {}; games.forEach((g) => (by[g.category] = by[g.category] || []).push(g));
  Object.keys(by).forEach((cat) => {
    const zn = ZONES[cat] || ZONES.slots, list = by[cat], n = list.length;
    const wide = cat === 'tables' || cat === 'cards' ? 4.6 : cat === 'action' ? 3.4 : 2.9;
    const perRow = cat === 'action' ? 5 : 3;
    list.forEach((g, i) => { const row = Math.floor(i / perRow), inRow = Math.min(perRow, n - row * perRow), k = i % perRow;
      const x = zn.x + (k - (inRow - 1) / 2) * wide, z = zn.z + (zn.face === 0 ? -1 : 1) * row * 5.2;
      stations.push(buildStation(g, x, z, zn.face, L.locked(g.id))); });
  });
  buildPanel(); drawMini(true);
}

/* ---------- ambient people silhouettes ---------- */
const nP = 14, ppl = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.24, 1.0, 4, 8), new THREE.MeshLambertMaterial({ color: 0x1a0a20 }), nP);
const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.17, 10, 8), new THREE.MeshLambertMaterial({ color: 0x24102a }), nP);
const walkers = []; for (let i = 0; i < nP; i++) walkers.push({ path: i % 3, t: Math.random() * 100, sp: .03 + Math.random() * .03, off: (Math.random() - .5) * 1.6 });
function walkerPos(w, t) { const u = (w.t + t * w.sp) % 1; if (w.path === 0) return [w.off, 0, -24 + 48 * (u < .5 ? u * 2 : 2 - u * 2)]; if (w.path === 1) return [-15 + 30 * (u < .5 ? u * 2 : 2 - u * 2), 0, 14 + w.off]; return [-15 + 30 * (u < .5 ? u * 2 : 2 - u * 2), 0, -12 + w.off]; }
scene.add(ppl, heads);

/* ---------- sparkles ---------- */
const nS = mobile ? 260 : 500, sg = new THREE.BufferGeometry(), sp = new Float32Array(nS * 3), sc = new Float32Array(nS * 3);
for (let i = 0; i < nS; i++) { sp[i * 3] = (Math.random() - .5) * W; sp[i * 3 + 1] = Math.random() * H; sp[i * 3 + 2] = (Math.random() - .5) * D; tmpC.setHex(0xffd9a0).multiplyScalar(.5); sc[i * 3] = tmpC.r; sc[i * 3 + 1] = tmpC.g; sc[i * 3 + 2] = tmpC.b; }
sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
const spark = new THREE.Points(sg, new THREE.PointsMaterial({ size: .09, map: poolTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
scene.add(spark);

/* ---------- post ---------- */
let composer = null, bloom = null;
try { composer = new EffectComposer(R); composer.addPass(new RenderPass(scene, cam));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .3, .4, 1.0); composer.addPass(bloom); composer.addPass(new OutputPass()); } catch (e) { composer = null; }
function resize() { const w = innerWidth, h = innerHeight; R.setPixelRatio(TIERS[tier].pr); R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 74 : 62; cam.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(TIERS[tier].pr); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); } drawMini(true); }
addEventListener('resize', resize);

/* ---------- player & controls ---------- */
const P = { x: 0, z: 25, yaw: 0, pitch: -.06 }, RAD = .38, SPEED = 4.2;
const keys = {}; let joy = null, look = null, jx = 0, jy = 0;
addEventListener('keydown', (e) => { if (e.target.tagName === 'SELECT') return; keys[e.code] = true; if ((e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') && near && !panelOpen() && !gateOpen()) { e.preventDefault(); play(near); } });
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const joyEl = $('joy'), knob = joyEl.firstElementChild;
cv.addEventListener('pointerdown', (e) => {
  audioOn(); hint(0);
  if (e.pointerType === 'touch' && e.clientX < innerWidth * .45 && !joy) { joy = { id: e.pointerId, x: e.clientX, y: e.clientY }; joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.style.display = 'block'; }
  else if (!look) look = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', (e) => {
  if (joy && e.pointerId === joy.id) { let dx = e.clientX - joy.x, dy = e.clientY - joy.y; const m = Math.hypot(dx, dy), mx = 50; if (m > mx) { dx *= mx / m; dy *= mx / m; } jx = dx / mx; jy = dy / mx; knob.style.transform = `translate(${dx}px,${dy}px)`; }
  else if (look && e.pointerId === look.id) { const dx = e.clientX - look.x, dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY; look.moved += Math.abs(dx) + Math.abs(dy);
    const s = e.pointerType === 'touch' ? .0055 : .0035; P.yaw -= dx * s; P.pitch = Math.max(-.9, Math.min(.6, P.pitch - dy * s)); }
});
function endPtr(e) { if (joy && e.pointerId === joy.id) { joy = null; jx = jy = 0; joyEl.style.display = 'none'; knob.style.transform = ''; } if (look && e.pointerId === look.id) { const tap = look.moved < 8; look = null; if (tap) tapPick(e); } }
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
/* tap a station/sign directly to walk up to it */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function tapPick(e) { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam);
  const hits = ray.intersectObjects([stationRoot, ...stations.map((s) => s.sign)], true); if (!hits.length || hits[0].distance > 18) return;
  let o = hits[0].object; const st = stations.find((s) => s.sign === o || (function up(x) { while (x) { if (x === s.grp) return true; x = x.parent; } return false; })(o)); if (st) glide(st); }
let auto = null;
function glide(st) { auto = { st, x: st.stand.x, z: st.stand.z }; }
function teleport(st) { P.x = st.stand.x; P.z = st.stand.z; faceTo(st, true); auto = null; }
function faceTo(st, snap) { const y = Math.atan2(-(st.center.x - P.x), -(st.center.z - P.z)); if (snap) { P.yaw = y; P.pitch = -.12; } return y; }
function collide(nx, nz) {
  nx = Math.max(-W / 2 + RAD + .2, Math.min(W / 2 - RAD - .2, nx)); nz = Math.max(-D / 2 + RAD + .2, Math.min(D / 2 - RAD - .2, nz));
  for (const b of boxes) { if (nx + RAD > b[0] && nx - RAD < b[2] && nz + RAD > b[1] && nz - RAD < b[3]) {
    const pushL = nx + RAD - b[0], pushR = b[2] - (nx - RAD), pushU = nz + RAD - b[1], pushD = b[3] - (nz - RAD), m = Math.min(pushL, pushR, pushU, pushD);
    if (m === pushL) nx -= pushL; else if (m === pushR) nx += pushR; else if (m === pushU) nz -= pushU; else nz += pushD; } }
  return [nx, nz];
}

/* ---------- HUD: prompt, panel, minimap, hint, chips, sound ---------- */
const promptEl = $('prompt'); let near = null, shown = null;
promptEl.onclick = () => near && play(near);
function play(st) { audioOn(); blip(880, .12); L.open(st.g.id); setTimeout(relock, 300); }
function relock() { if (!gateOpen()) return; const iv = setInterval(() => { if (!gateOpen()) { clearInterval(iv); refreshLocks(); } }, 400); }
function refreshLocks() { if (stations.some((s) => s.locked !== L.locked(s.g.id))) layout(L.games); }
const gateOpen = () => $('gate').classList.contains('on');
const panelOpen = () => $('panel').classList.contains('on');
function setPrompt(st) { if (st === shown) return; shown = st; if (!st) { promptEl.classList.remove('on'); return; }
  const lk = L.locked(st.g.id); promptEl.classList.toggle('lock', lk);
  promptEl.innerHTML = ''; promptEl.append(lk ? st.g.title + ' · members only' : 'Play ' + st.g.title); const sm = document.createElement('small');
  sm.textContent = lk ? `For players ${L.need(st.g.id)}+ only` : `${st.g.rating}+ · ${st.g.tagline}`.slice(0, 64); promptEl.append(sm); promptEl.classList.add('on'); }
function buildPanel() { const box = $('pList'); box.innerHTML = '';
  stations.forEach((s) => { const r = document.createElement('div'); r.className = 'pr' + (s.locked ? ' lk' : ''); r.style.setProperty('--ac', s.g.accent);
    const im = document.createElement('img'); im.src = s.g.icon; im.alt = ''; im.onerror = () => (im.style.visibility = 'hidden');
    const d = document.createElement('div'); d.textContent = s.g.title + '  ' + s.g.rating + '+' + (s.locked ? ' · locked' : ''); const sm = document.createElement('small'); sm.textContent = (ZONES[s.g.category] || ZONES.slots).label + ' · ' + s.g.tagline; d.append(sm);
    const go = document.createElement('button'); go.className = 'go2'; go.type = 'button'; go.textContent = 'Walk'; go.onclick = () => { teleport(s); closePanel(); };
    const pl = document.createElement('button'); pl.className = 'pl'; pl.type = 'button'; pl.textContent = 'Play'; pl.onclick = () => { closePanel(); play(s); };
    r.append(im, d, go, pl); box.append(r); }); }
function closePanel() { $('panel').classList.remove('on'); }
$('bGames').onclick = () => { audioOn(); $('panel').classList.add('on'); }; $('pX').onclick = closePanel;
$('panel').addEventListener('click', (e) => { if (e.target.id === 'panel') closePanel(); });
$('mini').onclick = () => { audioOn(); $('panel').classList.add('on'); };
const mini = $('mini'), mg = mini.getContext('2d'); let miniBase = null;
function m2(x, z) { return [(x + W / 2) / W * mini.width, (z + D / 2) / D * mini.height]; }
function drawMini(full) {
  if (full || !miniBase) { miniBase = document.createElement('canvas'); miniBase.width = mini.width; miniBase.height = mini.height; const g = miniBase.getContext('2d');
    g.fillStyle = 'rgba(14,10,9,.9)'; g.fillRect(6, 6, mini.width - 12, mini.height - 12); g.strokeStyle = '#b08d57'; g.lineWidth = 1.5; g.strokeRect(6, 6, mini.width - 12, mini.height - 12);
    g.fillStyle = '#8a6a3a'; let [bx, bz] = m2(0, 4); g.beginPath(); g.arc(bx, bz, 3.4 / W * mini.width, 0, 7); g.fill();
    g.font = '400 14px Georgia'; g.textAlign = 'center';
    Object.values(ZONES).forEach((z) => { const [x, y] = m2(z.x, z.z + (z.face === 0 ? 3.3 : -3.3)); g.fillStyle = z.col; g.fillText(z.label.split(' ')[0], x, y + 5); });
    stations.forEach((s) => { const [x, y] = m2(s.center.x, s.center.z); g.fillStyle = s.locked ? '#444' : '#7a1424'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.strokeStyle = '#e8d3a0'; g.lineWidth = 1.5; g.stroke(); }); }
  mg.clearRect(0, 0, mini.width, mini.height); mg.drawImage(miniBase, 0, 0);
  const [px, py] = m2(P.x, P.z); mg.save(); mg.translate(px, py); mg.rotate(-P.yaw); mg.fillStyle = '#e8d3a0'; mg.shadowColor = '#000'; mg.shadowBlur = 8;
  mg.beginPath(); mg.moveTo(0, -12); mg.lineTo(8, 8); mg.lineTo(0, 4); mg.lineTo(-8, 8); mg.closePath(); mg.fill(); mg.restore();
}
const hintEl = $('hint'); function hint(on) { hintEl.style.opacity = on ? 1 : 0; }
hintEl.textContent = mobile ? 'Left thumb: walk · Right side: drag to look · Tap a machine to walk to it' : 'WASD / arrows to walk · drag to look · click a machine · Enter to play';
setTimeout(() => hint(0), 9000);
/* chips (shared fun-chip wallet, chips.js, if present) */
const chipEl = $('hChips');
function showChips() { if (!window.Chips || typeof Chips.bal !== 'function') return; const up = () => { chipEl.textContent = '' + Number(Chips.bal()).toLocaleString(); }; up(); chipEl.title = 'Fun chips only · no real money'; chipEl.classList.add('on'); if (Chips.on) Chips.on(up); addEventListener('focus', up); }
if (window.Chips) showChips(); else fetch('chips.js', { method: 'HEAD', cache: 'no-cache' }).then((r) => { if (!r.ok) return; const s = document.createElement('script'); s.src = 'chips.js'; s.onload = showChips; document.head.append(s); }).catch(() => {});

/* ---------- ambient casino synth ---------- */
let AC = null, master = null, muted = true; try { muted = localStorage.getItem(SKEY) !== '0'; } catch (e) {}
const sndBtn = $('bSnd'); sndBtn.textContent = muted ? 'Muted' : 'Sound';
sndBtn.onclick = () => { muted = !muted; try { localStorage.setItem(SKEY, muted ? '1' : '0'); } catch (e) {} sndBtn.textContent = muted ? 'Muted' : 'Sound'; audioOn(); if (master) master.gain.setTargetAtTime(muted ? 0 : .5, AC.currentTime, .3); };
function audioOn() { if (AC || muted) { if (AC && AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0; master.connect(AC.destination); master.gain.setTargetAtTime(.5, AC.currentTime, 1);
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(master);
  [110, 164.8, 220, 277.2].forEach((f, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = i % 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = (i - 1.5) * 6; g.gain.value = .022;
    const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = .07 + i * .03; lg.gain.value = .014; lfo.connect(lg); lg.connect(g.gain); lfo.start(); o.connect(g); g.connect(lp); o.start(); });
  const chime = () => { if (!AC) return; if (!document.hidden && !muted) { const n = [1046, 1318, 1568, 2093, 1760][Math.random() * 5 | 0]; for (let k = 0; k < (Math.random() < .3 ? 4 : 1); k++) blip(n * (1 + k * .25), .05, k * .09, .03); } setTimeout(chime, 900 + Math.random() * 2600); };
  setTimeout(chime, 1500);
}
function blip(f, len, delay = 0, vol = .06) { if (!AC || muted) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + len + .25); o.connect(g); g.connect(master); o.start(t); o.stop(t + len + .3); }
document.addEventListener('visibilitychange', () => { if (!AC) return; document.hidden ? AC.suspend() : AC.resume(); });

/* ---------- loop ---------- */
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let last = performance.now(), t = 0, acc = 0, frames = 0, slowT = 0, fastT = 0, miniT = 0;
const fwd = new THREE.Vector3();
cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); try { localStorage.setItem(VKEY, 'list'); } catch (er) {} document.body.classList.remove('walk'); });
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
  /* move */
  let mx = 0, mz = 0;
  if (keys.KeyW || keys.ArrowUp) mz -= 1; if (keys.KeyS || keys.ArrowDown) mz += 1; if (keys.KeyA) mx -= 1; if (keys.KeyD) mx += 1;
  if (keys.ArrowLeft) P.yaw += 2.2 * dt; if (keys.ArrowRight) P.yaw -= 2.2 * dt;
  if (joy) { mx += jx; mz += jy; }
  if (mx || mz) auto = null;
  if (auto) { const dx = auto.x - P.x, dz = auto.z - P.z, d = Math.hypot(dx, dz); if (d < .15) { auto = null; } else { const s = Math.min(d, SPEED * 1.3 * dt); [P.x, P.z] = collide(P.x + dx / d * s, P.z + dz / d * s);
      const ty = faceTo(auto.st); let dy = ty - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); P.yaw += dy * Math.min(1, dt * 4); P.pitch += (-.12 - P.pitch) * Math.min(1, dt * 3); } }
  const m = Math.hypot(mx, mz); if (m > 0) { const k = Math.min(1, m) / m * SPEED * dt * (keys.ShiftLeft ? 1.6 : 1); const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
    const vx = (mx * c + mz * s) * k, vz = (-mx * s + mz * c) * k; [P.x, P.z] = collide(P.x + vx, P.z + vz); }
  const bob = m > 0 ? Math.sin(t * 9) * .025 : 0;
  cam.position.set(P.x, 1.62 + bob, P.z); cam.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
  /* nearest station in front */
  cam.getWorldDirection(fwd); let best = null, bd = 3.4;
  for (const s of stations) { const dx = s.center.x - P.x, dz = s.center.z - P.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fwd.x + dz * fwd.z) / d > .2) { bd = d; best = s; } }
  near = best; setPrompt(best);
  /* animate */
  if (!still) {
    window.__crown.rotation.y += dt * .5; window.__crown.children.forEach((c, i) => (c.rotation.z += dt * (.3 + i * .2)));
    for (const s of stations) { if (s.grp.userData.spin) s.grp.userData.spin.rotation.y += dt * 1.6; s.ring.material.opacity = s === near ? .95 : .55 + Math.sin(t * 3 + s.center.x) * .25; s.sign.position.y += Math.sin(t * 1.6 + s.center.x) * .0015; }
    if ((acc += dt) > .5) { acc = 0; for (let i = 0; i < nD; i++) if (Math.random() < .25) { decHue[i] = (decHue[i] + 1) % 8; scr.setColorAt(i, tmpC.setHex(CANDY[decHue[i]])); } scr.instanceColor.needsUpdate = true;
      for (let i = 0; i < nTw; i++) tw.setColorAt(i, tmpC.setHex(twC[i]).multiplyScalar(Math.random() < .5 ? 1 : .25)); tw.instanceColor.needsUpdate = true; }
    walkers.forEach((w, i) => { const [x, , z] = walkerPos(w, t), [x2, , z2] = walkerPos(w, t + .3); dummy.position.set(x, .74 + Math.abs(Math.sin(t * 6 + i)) * .03, z); dummy.rotation.set(0, Math.atan2(x2 - x, z2 - z), 0); dummy.updateMatrix(); ppl.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 1.55; dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix); }); ppl.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;
    const a = sg.attributes.position.array; for (let i = 1; i < a.length; i += 3) { a[i] += dt * .25; if (a[i] > H) a[i] = 0; } sg.attributes.position.needsUpdate = true;
    pts.forEach((l, i) => (l.intensity = 36 + Math.sin(t * 1.1 + i * 2) * 8));
  }
  for (const b of billboards) b.quaternion.copy(cam.quaternion);
  if ((miniT += dt) > .1) { miniT = 0; drawMini(); }
  if (composer && TIERS[tier].bloom) composer.render(); else R.render(scene, cam);
  /* adaptive quality: step down when slow, back up when steady */
  if (t > 2) { frames++; if (dt > 1 / 40) slowT += dt; else fastT += dt;
    if (frames >= 90) { if (slowT > .6 && tier < TIERS.length - 1) { tier++; resize(); } else if (slowT < .05 && fastT > 1.4 && tier > (mobile ? 1 : 0)) { tier--; resize(); } frames = 0; slowT = fastT = 0; } }
}
window.__floor = { P, stations, teleport, get near() { return near; }, get tier() { return tier; } };
resize(); layout(L.games); L.onGames((g) => layout(g)); faceTo({ center: new THREE.Vector3(0, 0, 4) }, true); P.pitch = -.04;
requestAnimationFrame(frame);
}
