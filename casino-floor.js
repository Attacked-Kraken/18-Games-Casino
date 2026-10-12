/* fl1 2026-10-11 (owner: "make the casino floor more like a casino floor, walk to the games to play ... make it impressive"):
   walkable first-person 3D casino floor. Three.js r169 (local module, no CDN): ACES tone mapping, RoomEnvironment reflections,
   UnrealBloomPass with a threshold (only neon, bulbs and signs glow, so candy colors stay solid), baked-look light pools
   (painted into the carpet, no real-time shadows). Stations come from window.Lobby.games (games.json); each is a lit machine or
   table zoned by category with a floating neon sign and rating badge. Walk up -> "PLAY <name>" -> Lobby.open() (age gate).
   Phones: left-thumb joystick + drag to look. Desktop: WASD/arrows + mouse drag. Minimap, Games list with Go (teleport) / Play.
   Perf: pixel ratio <= 2, instanced decor, adaptive quality tiers, pauses when hidden. No WebGL / context lost / List button
   -> card list view (index.html). */
import * as THREE from './three.module.min.js';
import { createPeople } from './people.js';
import { createHall, HALL, HALL_TABLES, HALL_BARS } from './hall-wing.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { EffectComposer } from './vendor/EffectComposer.js';
import { RenderPass } from './vendor/RenderPass.js';
import { UnrealBloomPass } from './vendor/UnrealBloomPass.js';
import { createWing, WING } from './forum-wing.js';
import { createNav } from './nav.js';
import { createStadium, STAD } from './stadium.js';
import { createCruz } from './cruz-npc.js';
import { createTeam } from './football-team.js';
import { loadBoss } from './characters/coach-boss/boss.js';
import { openShop, getAvatar } from './shops.js';
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
if (canWalk) { walkBtn.hidden = false; walkBtn.onclick = () => { try { sessionStorage.setItem(VKEY, '3d'); } catch (e) {} location.reload(); }; }
$('bList').onclick = () => { try { sessionStorage.setItem(VKEY, 'list'); } catch (e) {} location.reload(); };
let pref = ''; try { pref = sessionStorage.getItem(VKEY) || ''; localStorage.removeItem(VKEY); } catch (e) {}
const forceList = /[?&]view=list/.test(location.search), force3d = /[?&]view=3d/.test(location.search);
const intro = { bar: document.getElementById('introBar'), set(p) { if (this.bar) this.bar.style.width = Math.round(p * 100) + '%'; },
  done() { const el = document.getElementById('intro'); this.set(1); setTimeout(() => { document.documentElement.classList.remove('boot'); if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 800); } }, 250); } };
window.__intro = intro;
if (canWalk && !forceList && (force3d || pref === '3d' || pref !== 'list')) start(); else intro.done();

function start() {
document.body.classList.add('walk');
const mobile = matchMedia('(pointer: coarse)').matches;
const R = new THREE.WebGLRenderer({ canvas: cv, context: gl, antialias: false, powerPreference: 'high-performance' });
const DPR = Math.min(2, devicePixelRatio || 1);
const TIERS = [{ pr: Math.min(DPR, 2), bloom: 1 }, { pr: Math.min(DPR, 1.5), bloom: 1 }, { pr: Math.min(DPR, 1.15), bloom: 1 }, { pr: 1, bloom: 0 }, { pr: .75, bloom: 0 }];
let tier = mobile ? 2 : 1;
R.setPixelRatio(TIERS[tier].pr);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0;
R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a2c22);
scene.fog = new THREE.Fog(0x4a3a2c, 30, 80);
const pmrem = new THREE.PMREMGenerator(R);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .8;
const cam = new THREE.PerspectiveCamera(68, 1, .1, 140);

/* ================= real Vegas floor: bright, busy, instanced ================= */
const W = 68, D = 36, H = 6.4;            // stadium: straight x -16..16, rounded ends radius 17 -> x -33..33, z -17..17
const RX = 16, RR = 17;
const inStadium = (x, z, m = 0) => Math.abs(x) <= RX ? Math.abs(z) <= RR - m : Math.hypot(Math.abs(x) - RX, z) <= RR - m;
const CANDY = [0x8c1a2b, 0xb8862e, 0x1d4f9a, 0x5a2a7a, 0x0f6b4e, 0xa8501e, 0x7a1424, 0x22407a];
function canvasTex(w, h, fn, rep, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const dummy = new THREE.Object3D(), tmpC = new THREE.Color(), m4 = new THREE.Matrix4();
const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

/* ---------- carpet: classic Vegas crimson / teal / gold swirl ---------- */
const carpet = canvasTex(512, 512, (g, w) => {
  g.fillStyle = '#a3175e'; g.fillRect(0, 0, w, w);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,220,200'},${rnd() * .05})`; g.fillRect(rnd() * w, rnd() * w, 2, 2); }
  const motif = (x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#6a0f44'; for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.ellipse(0, 34, 12, 30, 0, 0, 7); g.fill(); }
    g.strokeStyle = '#e0a83c'; g.lineWidth = 4; for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(22, 30, -14, 50, 8, 70); g.stroke(); }
    g.fillStyle = '#e8b448'; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill(); g.fillStyle = '#5a1a6a'; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.restore(); };
  [[0, 0], [512, 0], [0, 512], [512, 512], [256, 256]].forEach(([x, y]) => motif(x, y, 1.15));
  [[256, 0], [0, 256], [512, 256], [256, 512]].forEach(([x, y]) => { g.save(); g.translate(x, y); g.strokeStyle = '#d99a34'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.arc(30, 0, 22, -1.6, 1.6); g.stroke(); } g.fillStyle = '#0d5f62'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); g.restore(); });
  [[128, 128], [384, 128], [128, 384], [384, 384]].forEach(([x, y]) => { g.fillStyle = '#c8902c'; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; g.beginPath(); g.arc(x + Math.cos(a) * 14, y + Math.sin(a) * 14, 6, 0, 7); g.fill(); } g.fillStyle = '#163f8a'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); });
}, [W / 2.4, D / 2.4]);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: carpet, roughness: .95, envMapIntensity: .3 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
/* central wood parquet (plus shape) + teal pit floors */
const parqT = canvasTex(512, 512, (g, w) => { g.fillStyle = '#8a4a20'; g.fillRect(0, 0, w, w); const cols = ['#a65a26', '#b8692e', '#94501f', '#c47a3a', '#7a3e18'];
  for (let y = -64; y < w + 64; y += 32) for (let x = -64; x < w + 64; x += 64) { const o = ((y / 32) % 2) * 32; g.save(); g.translate(x + o, y); g.rotate(Math.PI / 4); g.fillStyle = cols[Math.floor(rnd() * 5)]; g.fillRect(0, 0, 64, 22); g.strokeStyle = 'rgba(40,18,6,.6)'; g.lineWidth = 1.5; g.strokeRect(0, 0, 64, 22); g.restore(); }
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(40,18,6,${rnd() * .08})`; g.fillRect(rnd() * w, rnd() * w, 3, 1); } }, [1, 1]);
const brassM = new THREE.MeshStandardMaterial({ color: 0xc9a056, metalness: 1, roughness: .28 });
const AISLES = [[0, 0, 24, 14], [0, 0, 11, D - .5]];
AISLES.forEach(([x, z, w, d], k) => { const t = parqT.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 3, d / 3); t.needsUpdate = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: .82, metalness: 0, envMapIntensity: .15 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .005 + k * .001, z); scene.add(m);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(w > d ? new THREE.PlaneGeometry(w, .1) : new THREE.PlaneGeometry(.1, d), brassM); e.rotation.x = -Math.PI / 2; if (w > d) e.position.set(x, .012, z + s * d / 2); else e.position.set(x + s * w / 2, .012, z); scene.add(e); } });
const tealT = canvasTex(256, 256, (g, w) => { g.fillStyle = '#0d6a6e'; g.fillRect(0, 0, w, w); g.strokeStyle = 'rgba(220,190,120,.35)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(128, 128, 30 + i * 30, 0, 7); g.stroke(); } for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * .08})`; g.fillRect(rnd() * w, rnd() * w, 2, 2); } }, [5, 5]);
const PITS = [[-19, 1], [19, -1]];
PITS.forEach(([px, dir]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(6.6, 48), new THREE.MeshStandardMaterial({ map: tealT, roughness: .9 })); m.rotation.x = -Math.PI / 2; m.position.set(px, .008, 0); scene.add(m);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(6.6, .09, 8, 64, Math.PI * 1.45), new THREE.MeshStandardMaterial({ color: 0x2a1408, roughness: .4 })); arc.rotation.x = Math.PI / 2; arc.rotation.z = dir > 0 ? Math.PI * .275 : Math.PI * 1.275; arc.position.set(px, .95, 0); scene.add(arc);
  const arc2 = arc.clone(); arc2.material = brassM; arc2.scale.set(1, 1, .3); arc2.position.y = .5; scene.add(arc2);
  for (let i = 0; i <= 14; i++) { const a = arc.rotation.z + i / 14 * Math.PI * 1.45; const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .95, 6), brassM); p.position.set(px + Math.cos(a) * 6.6, .47, Math.sin(a) * 6.6); scene.add(p); } });

/* ---------- walls: cream panels, wood wainscot, brass ---------- */
const wallTex = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#d8c6a4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#5a2e1a'; g.fillRect(0, h * .78, w, h * .22); g.fillStyle = '#c9a056'; g.fillRect(0, h * .775, w, 6);
  g.strokeStyle = '#b8955a'; g.lineWidth = 3; g.strokeRect(22, 30, w - 44, h * .7); g.strokeStyle = 'rgba(120,90,50,.35)'; g.lineWidth = 1; g.strokeRect(32, 40, w - 64, h * .7 - 20);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,90,60,${rnd() * .06})`; g.fillRect(rnd() * w, rnd() * h * .77, 3, 3); } }, [1, 1]);
{ const mk = (len) => { const t = wallTex.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(len / 2.6, 1); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, roughness: .6, side: THREE.DoubleSide }); };
  for (const sz of [-1, 1]) { if (sz > 0) { const DW = 2.2, sw = RX - DW; for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, H), mk(sw)); m.position.set(sx * (DW + sw / 2), H / 2, RR); m.rotation.y = Math.PI; scene.add(m); } const lt = new THREE.Mesh(new THREE.PlaneGeometry(DW * 2, H - 3.6), mk(DW * 2)); lt.position.set(0, 3.6 + (H - 3.6) / 2, RR); lt.rotation.y = Math.PI; scene.add(lt); } else { const DB = 4.2, sb = RX - DB; for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sb, H), mk(sb)); m.position.set(sx * (DB + sb / 2), H / 2, -RR); scene.add(m); const pl = new THREE.Mesh(new THREE.BoxGeometry(.4, 4.2, .5), brassM); pl.position.set(sx * (DB + .1), 2.1, -RR); scene.add(pl); } const lt = new THREE.Mesh(new THREE.PlaneGeometry(DB * 2, H - 4.2), mk(DB * 2)); lt.position.set(0, 4.2 + (H - 4.2) / 2, -RR); scene.add(lt); const ln = new THREE.Mesh(new THREE.BoxGeometry(DB * 2 + .6, .3, .5), brassM); ln.position.set(0, 4.25, -RR); scene.add(ln); }
    const n = new THREE.Mesh(new THREE.BoxGeometry(RX * 2, .16, .12), brassM); n.position.set(0, H - .2, sz * (RR - .06)); scene.add(n); }
  for (const sx of [-1, 1]) { const g = new THREE.CylinderGeometry(RR, RR, H, 64, 1, true, sx > 0 ? 0 : Math.PI, Math.PI); const m = new THREE.Mesh(g, mk(Math.PI * RR)); m.position.set(sx * RX, H / 2, 0); scene.add(m);
    const n = new THREE.Mesh(new THREE.TorusGeometry(RR - .06, .08, 6, 64, Math.PI), brassM); n.rotation.x = Math.PI / 2; n.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2; n.position.set(sx * RX, H - .2, 0); scene.add(n); }
  /* entrance portal at the bottom (+z) */
  for (const sx of [-1, 1]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(.3, 3.7, .5), brassM); pl.position.set(sx * 2.3, 1.85, RR); scene.add(pl); } const lin = new THREE.Mesh(new THREE.BoxGeometry(4.9, .3, .5), brassM); lin.position.set(0, 3.75, RR); scene.add(lin); }
/* ---------- coffered ceiling with recessed downlights ---------- */
const cofT = canvasTex(256, 256, (g, w) => { g.fillStyle = '#efe4cf'; g.fillRect(0, 0, w, w); g.fillStyle = '#e2d3b6'; g.fillRect(24, 24, w - 48, w - 48);
  g.strokeStyle = '#c9a056'; g.lineWidth = 6; g.strokeRect(24, 24, w - 48, w - 48); g.strokeStyle = '#b08d57'; g.lineWidth = 2; g.strokeRect(40, 40, w - 80, w - 80);
  g.fillStyle = '#d6c4a2'; g.fillRect(0, 0, w, 10); g.fillRect(0, 0, 10, w); }, [W / 4, D / 4]);
const cofE = canvasTex(256, 256, (g, w) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, w); for (const [x, y] of [[80, 80], [176, 80], [80, 176], [176, 176]]) { const r = g.createRadialGradient(x, y, 0, x, y, 12); r.addColorStop(0, '#fff6e0'); r.addColorStop(.6, '#ffe6b0'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
  const c = g.createRadialGradient(128, 128, 0, 128, 128, 60); c.addColorStop(0, 'rgba(255,220,160,.35)'); c.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = c; g.fillRect(0, 0, w, w); }, [W / 4, D / 4]);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: cofT, emissiveMap: cofE, color: 0x9a8e7c, emissive: 0xffffff, emissiveIntensity: .7, roughness: .8 }));
ceil.rotation.x = Math.PI / 2; ceil.position.y = H; scene.add(ceil);

/* ---------- lights: bright, even, warm; no shadows (phones) ---------- */
scene.add(new THREE.HemisphereLight(0xfff2de, 0x6a3a2a, 1.05));
scene.add(new THREE.AmbientLight(0xffe8d0, .2));
const sun = new THREE.DirectionalLight(0xfff0dc, .85); sun.position.set(6, 12, 8); scene.add(sun);
const sun2 = new THREE.DirectionalLight(0xffe0c0, .45); sun2.position.set(-8, 10, -12); scene.add(sun2);
const pts = [[0, 0], [-8, 8], [8, 8], [-8, -8], [8, -8], [-19, 0], [19, 0], [-28, 0], [28, 0]].map(([x, z]) => { const l = new THREE.PointLight(0xffd8a8, 9, 11, 1.8); l.position.set(x, H - .6, z); scene.add(l); return l; });

/* ---------- colliders ---------- */
const boxes = [];
function block(x, z, hw, hd) { boxes.push([x - hw, z - hd, x + hw, z + hd]); }
function blockR(x, z, r) { block(x, z, r * .85, r * .85); }
function blockRot(x, z, ry, hw, hd) { const s = Math.abs(Math.sin(ry)) > .5; block(x, z, s ? hd : hw, s ? hw : hd); }

/* ---------- signs ---------- */
function neonTex(text, col, sub, badge, lock) {
  return canvasTex(512, 192, (g, w, h) => {
    g.clearRect(0, 0, w, h); const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a0a12'); bg.addColorStop(1, '#14050a'); g.fillStyle = bg; g.fillRect(6, 6, w - 12, h - 12);
    g.strokeStyle = '#d9b065'; g.lineWidth = 5; g.strokeRect(10, 10, w - 20, h - 20);
    for (let i = 0; i < 26; i++) { const x = 20 + i * (w - 40) / 25; for (const y of [18, h - 18]) { g.fillStyle = '#fff1c8'; g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); } }
    const SER = "'Didot','Bodoni 72','Playfair Display',Georgia,serif"; let fs = 62; g.font = `600 ${fs}px ${SER}`; while (g.measureText(text).width > w - (badge ? 170 : 70) && fs > 24) { fs -= 3; g.font = `600 ${fs}px ${SER}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; const tg = g.createLinearGradient(0, 50, 0, 140); tg.addColorStop(0, '#fff3cf'); tg.addColorStop(1, '#e0b35c'); g.fillStyle = tg; g.fillText(text, w / 2, sub ? 84 : 98);
    if (sub) { g.font = '500 17px Helvetica, Arial, sans-serif'; g.fillStyle = '#e8d3a0'; g.fillText(sub.toUpperCase(), w / 2, 146); }
    if (lock) { g.font = '500 16px Helvetica, Arial, sans-serif'; g.fillStyle = '#ff9aa8'; g.fillText('MEMBERS ONLY', w / 2, 150); }
  });
}
function signMesh(tex, w) { const g = new THREE.PlaneGeometry(w, w * 192 / 512), mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, color: 0xe6e6e6 }); const m = new THREE.Mesh(g, mat); const back = new THREE.Mesh(g, mat); back.rotation.y = Math.PI; m.add(back); return m; }
const billboards = [];

/* ---------- materials ---------- */
const gold = brassM;
const chrome = new THREE.MeshStandardMaterial({ color: 0x9a9894, roughness: .3, metalness: 1 });
const blackGl = new THREE.MeshPhysicalMaterial({ color: 0x0c0c10, roughness: .2, metalness: .3, clearcoat: 1, clearcoatRoughness: .08 });
const tintLac = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .28, metalness: .35, clearcoat: 1, clearcoatRoughness: .1 });
const wood = new THREE.MeshPhysicalMaterial({ color: 0x5a2a14, roughness: .35, clearcoat: .8, clearcoatRoughness: .15 });
const leather = new THREE.MeshStandardMaterial({ color: 0x1a0e0a, roughness: .45, metalness: 0 });
const chairLeather = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .5 });
const glowW = (c, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });
const pickInst = [];
/* atlas screens: per-instance UV cell (3 x 2 atlas) */
function atlasMat(tex, k = 1) { const m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(k, k, k) });
  m.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aOff;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = vMapUv * vec2(1.0/3.0, 0.5) + aOff;'); }; return m; }
/* proto group -> one InstancedMesh per part; T = [{x,z,ry,y?,tint?,cell?,ent?}] */
function inst(proto, T, parent) {
  proto.updateMatrixWorld(true); const out = [];
  proto.traverse((o) => { if (!o.isMesh) return; const geo = o.userData.atlas ? o.geometry.clone() : o.geometry;
    const im = new THREE.InstancedMesh(geo, o.material, T.length); const off = o.userData.atlas ? new Float32Array(T.length * 2) : null;
    T.forEach((t, i) => { dummy.position.set(t.x, t.y || 0, t.z); dummy.rotation.set(0, t.ry || 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); m4.multiplyMatrices(dummy.matrix, o.matrixWorld); im.setMatrixAt(i, m4);
      if (o.userData.tint) im.setColorAt(i, tmpC.setHex(t[o.userData.tint] != null ? t[o.userData.tint] : 0xffffff));
      if (off) { const c = (t.cell || 0) % 6; off[i * 2] = (c % 3) / 3; off[i * 2 + 1] = c < 3 ? .5 : 0; } });
    if (off) geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 2));
    im.userData.ents = T.map((t) => t.ent || null); im.frustumCulled = true; im.computeBoundingSphere(); (parent || scene).add(im); pickInst.push(im); out.push(im); });
  return out;
}
const P3 = (geo, mat, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz; if (o.s) m.scale.set(...o.s); Object.assign(m.userData, o.ud || {}); return m; };

/* ---------- slot art atlases (3 x 2) ---------- */
const THEMES = [
  { n: 'TRIPLE 777', bg: ['#4a0612', '#9a1428'], sy: ['7', 'BAR', '7'], c: '#ffd76a' },
  { n: 'DIAMOND CLUB', bg: ['#0a1a3a', '#1d4f9a'], sy: ['◆', '♛', '◆'], c: '#cfe6ff' },
  { n: "PHARAOH'S GOLD", bg: ['#3a2406', '#b8862e'], sy: ['☥', '𓂀', '☥'], c: '#ffe7a0' },
  { n: "POSEIDON", bg: ['#032a3a', '#0a7a8a'], sy: ['♆', '◆', '♆'], c: '#bff6ff' },
  { n: 'DRAGON JACKPOT', bg: ['#3a0606', '#c2261a'], sy: ['龍', '7', '龍'], c: '#ffd34a' },
  { n: 'GEM BURST', bg: ['#22063a', '#6a1aa8'], sy: ['✦', '◆', '✦'], c: '#ffd6ff' }];
const screenAtlas = canvasTex(768, 512, (g) => { THEMES.forEach((t, i) => { const x = (i % 3) * 256, y = (i < 3 ? 0 : 1) * 256; const gr = g.createLinearGradient(x, y, x, y + 256); gr.addColorStop(0, t.bg[1]); gr.addColorStop(1, t.bg[0]); g.fillStyle = gr; g.fillRect(x, y, 256, 256);
  g.fillStyle = '#f6efe0'; for (let r = 0; r < 3; r++) { g.fillStyle = '#f8f2e6'; g.fillRect(x + 16 + r * 76, y + 64, 68, 140); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 16 + r * 76, y + 64, 68, 10); g.fillRect(x + 16 + r * 76, y + 194, 68, 10); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { const s = t.sy[(r + k) % 3]; g.font = (s.length > 1 ? '800 22px' : '700 38px') + ' Georgia,serif'; g.fillStyle = k === 1 ? t.bg[1] : '#3a2a1a'; g.fillText(s, x + 50 + r * 76, y + 90 + k * 45); }
  g.fillStyle = '#ffde7a'; g.fillRect(x + 10, y + 132, 236, 3);
  g.font = '700 22px Georgia,serif'; g.fillStyle = t.c; g.fillText(t.n, x + 128, y + 34); g.font = '700 18px Helvetica'; g.fillStyle = '#ffe9a8'; g.fillText('WIN 2,500', x + 128, y + 230); }); });
const topAtlas = canvasTex(768, 512, (g) => { THEMES.forEach((t, i) => { const x = (i % 3) * 256, y = (i < 3 ? 0 : 1) * 256; const gr = g.createRadialGradient(x + 128, y + 128, 10, x + 128, y + 128, 180); gr.addColorStop(0, t.bg[1]); gr.addColorStop(1, t.bg[0]); g.fillStyle = gr; g.fillRect(x, y, 256, 256);
  for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; g.strokeStyle = 'rgba(255,230,160,.18)'; g.lineWidth = 8; g.beginPath(); g.moveTo(x + 128, y + 128); g.lineTo(x + 128 + Math.cos(a) * 200, y + 128 + Math.sin(a) * 200); g.stroke(); }
  g.fillStyle = '#fff4d0'; for (let k = 0; k < 14; k++) { for (const yy of [10, 246]) { g.beginPath(); g.arc(x + 12 + k * 17.6, y + yy, 5, 0, 7); g.fill(); } }
  for (let k = 0; k < 14; k++) for (const xx of [10, 246]) { g.beginPath(); g.arc(x + xx, y + 12 + k * 17.6, 5, 0, 7); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; const words = t.n.split(' '); g.font = '800 ' + (words.length > 1 ? 40 : 54) + 'px Georgia,serif';
  words.forEach((wd, k) => { const yy = y + 128 + (k - (words.length - 1) / 2) * 50; g.lineWidth = 7; g.strokeStyle = '#2a1404'; g.strokeText(wd, x + 128, yy); const tg = g.createLinearGradient(0, yy - 22, 0, yy + 22); tg.addColorStop(0, '#fff6d0'); tg.addColorStop(1, '#e0a83c'); g.fillStyle = tg; g.fillText(wd, x + 128, yy); }); }); });
const scrMat = atlasMat(screenAtlas, .95), topMat = atlasMat(topAtlas, 1.0);
const btnGlow = glowW(0xffcf6a, 1.1), btnRed = glowW(0xe02a3a, 1.0);

/* ---------- slot cabinet prototypes (front = +z): modern portrait cabinets ---------- */
/* portrait game-screen atlas (3 x 2 cells of 256 x 512): title band, 5x4 reel window with bright symbols, win meter */
const SYMC = ['#ff3b5c', '#ffd34a', '#3bd1ff', '#7dff6a', '#ff8a2a', '#d06bff'];
const portAtlas = canvasTex(768, 1024, (g) => { THEMES.forEach((t, i) => { const x = (i % 3) * 256, y = (i < 3 ? 0 : 1) * 512;
  const gr = g.createLinearGradient(x, y, x, y + 512); gr.addColorStop(0, t.bg[1]); gr.addColorStop(.55, t.bg[0]); gr.addColorStop(1, t.bg[1]); g.fillStyle = gr; g.fillRect(x, y, 256, 512);
  for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; g.strokeStyle = 'rgba(255,240,190,.13)'; g.lineWidth = 10; g.beginPath(); g.moveTo(x + 128, y + 80); g.lineTo(x + 128 + Math.cos(a) * 300, y + 80 + Math.sin(a) * 300); g.stroke(); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; const words = t.n.split(' '); g.font = '900 ' + (words.length > 1 ? 36 : 44) + 'px Georgia,serif';
  words.forEach((wd, k) => { const yy = y + 62 + (k - (words.length - 1) / 2) * 40; g.lineWidth = 8; g.strokeStyle = '#1a0a02'; g.strokeText(wd, x + 128, yy); const tg = g.createLinearGradient(0, yy - 20, 0, yy + 20); tg.addColorStop(0, '#fffbe0'); tg.addColorStop(.5, '#ffd34a'); tg.addColorStop(1, '#c47a10'); g.fillStyle = tg; g.fillText(wd, x + 128, yy); });
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x + 10, y + 128, 236, 300); g.strokeStyle = '#ffd76a'; g.lineWidth = 4; g.strokeRect(x + 10, y + 128, 236, 300);
  for (let c = 0; c < 5; c++) for (let r = 0; r < 4; r++) { const cx = x + 34 + c * 47, cy = y + 165 + r * 72, col = SYMC[(c * 2 + r + i) % 6];
    const rg = g.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, 24); rg.addColorStop(0, '#fff'); rg.addColorStop(.35, col); rg.addColorStop(1, 'rgba(0,0,0,.8)'); g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, 21, 0, 7); g.fill();
    g.font = '800 20px Georgia,serif'; g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 3; const s = t.sy[(c + r) % 3]; g.strokeText(s.length > 1 ? s.slice(0, 3) : s, cx, cy + 1); g.fillText(s.length > 1 ? s.slice(0, 3) : s, cx, cy + 1); }
  g.strokeStyle = 'rgba(255,230,120,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 14, y + 237); g.lineTo(x + 242, y + 309); g.stroke();
  g.fillStyle = '#120808'; g.fillRect(x + 10, y + 440, 236, 62); g.font = '700 15px Helvetica'; g.fillStyle = '#9fe8ff'; g.fillText('CREDIT 2,500  ·  BET 1.00', x + 128, y + 458); g.font = '900 24px Helvetica'; g.fillStyle = '#ffd34a'; g.fillText('WIN 1,250', x + 128, y + 486); }); });
const portMat = atlasMat(portAtlas, 1.0);
/* ticking progressive meters (shared atlas, one cell per theme) */
const meterC = document.createElement('canvas'); meterC.width = 768; meterC.height = 128; const meterT = new THREE.CanvasTexture(meterC); meterT.colorSpace = THREE.SRGBColorSpace;
const meterV = THEMES.map((_, i) => 8000 + i * 1931.37);
function drawMeters() { const g = meterC.getContext('2d'); THEMES.forEach((t, i) => { const x = (i % 3) * 256, y = (i < 3 ? 0 : 1) * 64; g.fillStyle = '#0a0204'; g.fillRect(x, y, 256, 64); g.strokeStyle = t.c; g.lineWidth = 3; g.strokeRect(x + 3, y + 3, 250, 58);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 13px Helvetica'; g.fillStyle = '#ffb4c0'; g.fillText('GRAND JACKPOT', x + 128, y + 16); g.font = '900 30px Helvetica'; g.fillStyle = '#ff4a5a'; g.shadowColor = '#ff2030'; g.shadowBlur = 10; g.fillText('$' + meterV[i].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), x + 128, y + 42); g.shadowBlur = 0; }); meterT.needsUpdate = true; }
drawMeters();
const meterMat = atlasMat(meterT, 1.15);
const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const LED_COL = [0xff3070, 0x30c8ff, 0xffb020, 0x40ff90, 0xc060ff, 0xff6020];
function slotProto(type) {
  const p = new THREE.Group(); const T = { ud: { tint: 'tint' } }, L = { ud: { tint: 'led' } }, A = { ud: { atlas: 1 } };
  /* base + lit belly panel */
  p.add(P3(new THREE.BoxGeometry(.74, .92, .66), blackGl, 0, .46, 0), P3(new THREE.PlaneGeometry(.6, .5), tintLac, 0, .45, .331, T));
  p.add(P3(new THREE.BoxGeometry(.6, .03, .02), ledMat, 0, .73, .335, L), P3(new THREE.BoxGeometry(.6, .03, .02), ledMat, 0, .17, .335, L));
  /* button deck */
  p.add(P3(new THREE.BoxGeometry(.76, .07, .34), blackGl, 0, .96, .3, { rx: -.12 }), P3(new THREE.BoxGeometry(.66, .012, .2), new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: .3, metalness: .5 }), 0, 1.0, .3, { rx: -.12 }));
  for (let b = 0; b < 5; b++) p.add(P3(new THREE.BoxGeometry(.07, .025, .05), btnGlow, -.26 + b * .1, 1.01, .38, { rx: -.12 }));
  p.add(P3(new THREE.CylinderGeometry(.055, .055, .03, 18), btnRed, .25, 1.02, .27));
  /* screen body */
  const SH = type === 3 ? 1.0 : 1.14, sy = 1.0 + SH / 2 + .04;
  if (type === 2) { const cg = new THREE.CylinderGeometry(1.3, 1.3, SH + .12, 20, 1, true, -.25, .5); cg.translate(0, 0, -1.3); p.add(P3(cg, portMat, 0, sy, .2, A), P3(new THREE.BoxGeometry(.7, SH + .14, .3), blackGl, 0, sy, -.06)); }
  else { p.add(P3(new THREE.BoxGeometry(.74, SH + .1, .42), blackGl, 0, sy, -.02, type === 1 ? { rx: -.1 } : {})); p.add(P3(new THREE.PlaneGeometry(.64, SH), portMat, 0, sy, .2 + (type === 1 ? .055 : 0), { ...A, rx: type === 1 ? -.1 : 0 })); }
  /* LED edge trim (left/right of screen and base) */
  for (const sx of [-.375, .375]) p.add(P3(new THREE.BoxGeometry(.022, SH + .95, .022), ledMat, sx, (SH + .95) / 2 + .5, .2, L));
  /* topper with ticking meter */
  const ty = sy + SH / 2 + .06;
  p.add(P3(new THREE.PlaneGeometry(.66, .16), meterMat, 0, ty + .08, .2, A), P3(new THREE.BoxGeometry(.74, .2, .3), blackGl, 0, ty + .08, .04));
  if (type === 1) { p.add(P3(new THREE.CylinderGeometry(.36, .36, .14, 32), blackGl, 0, ty + .55, 0, { rx: Math.PI / 2 }), P3(new THREE.CircleGeometry(.31, 32), topMat, 0, ty + .55, .075, A), P3(new THREE.TorusGeometry(.34, .02, 6, 40), ledMat, 0, ty + .55, .075, L)); }
  else { const TH = type === 3 ? .8 : .44; p.add(P3(new THREE.BoxGeometry(.76, TH, .32), blackGl, 0, ty + .2 + TH / 2, 0), P3(new THREE.PlaneGeometry(.68, TH - .06), topMat, 0, ty + .2 + TH / 2, .165, A));
    p.add(P3(new THREE.BoxGeometry(.78, .022, .022), ledMat, 0, ty + .2 + TH, .17, L), P3(new THREE.BoxGeometry(.78, .022, .022), ledMat, 0, ty + .19, .17, L)); }
  /* casino slot chair: chrome pedestal, padded round seat, tall rounded back */
  p.add(P3(new THREE.CylinderGeometry(.24, .26, .03, 20), chrome, 0, .015, .95), P3(new THREE.CylinderGeometry(.035, .035, .5, 10), chrome, 0, .27, .95));
  p.add(P3(new THREE.CylinderGeometry(.25, .23, .13, 24), chairLeather, 0, .58, .95, { ud: { tint: 'stool' } }), P3(new THREE.TorusGeometry(.245, .03, 8, 24), chairLeather, 0, .64, .95, { rx: Math.PI / 2, ud: { tint: 'stool' } }));
  p.add(P3(new THREE.BoxGeometry(.44, .5, .09), chairLeather, 0, .92, 1.2, { rx: .12, ud: { tint: 'stool' } }), P3(new THREE.CylinderGeometry(.045, .045, .44, 12), chairLeather, 0, 1.17, 1.23, { rz: Math.PI / 2, ud: { tint: 'stool' } }), P3(new THREE.BoxGeometry(.04, .32, .04), chrome, 0, .72, 1.18));
  return p;
}
/* ---------- table prototypes ---------- */
function feltTex(base, kind) { return canvasTex(1024, 512, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * .6); r.addColorStop(0, base[0]); r.addColorStop(1, base[1]); g.fillStyle = r; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,255,255'},${rnd() * .04})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  g.strokeStyle = 'rgba(240,210,140,.75)'; g.fillStyle = 'rgba(240,210,140,.85)'; g.lineWidth = 4; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (kind === 'poker') { g.beginPath(); g.ellipse(w / 2, h / 2, w * .36, h * .3, 0, 0, 7); g.stroke(); g.font = 'italic 600 44px Georgia,serif'; g.fillText('18 Games Casino', w / 2, h * .66); for (let i = 0; i < 5; i++) g.strokeRect(w / 2 - 170 + i * 70, h / 2 - 60, 56, 80); }
  else if (kind === 'bj' || kind === 'bac') { g.beginPath(); g.arc(w / 2, 0, h * .78, .35, Math.PI - .35); g.stroke(); g.font = '600 38px Georgia,serif'; g.fillText(kind === 'bj' ? 'BLACKJACK PAYS 3 TO 2' : 'BANKER · PLAYER · TIE 9 TO 1', w / 2, h * .42); g.font = '500 24px Georgia,serif'; g.fillText(kind === 'bj' ? 'Dealer stands on all 17s' : 'BACCARAT', w / 2, h * .54);
    for (let i = 0; i < 7; i++) { const a = .5 + i / 6 * (Math.PI - 1); g.beginPath(); g.arc(w / 2 + Math.cos(a) * h * .9, Math.sin(a) * h * .9, 34, 0, 7); g.stroke(); } }
  }); }
const cardsTex = canvasTex(512, 128, (g) => { const s = ['A♠', 'K♥', '10♦', 'Q♣', '7♥']; s.forEach((c, i) => { const x = 8 + i * 101; g.fillStyle = '#fbf8f1'; g.fillRect(x, 4, 92, 120); g.strokeStyle = '#999'; g.strokeRect(x, 4, 92, 120); g.fillStyle = /[♥♦]/.test(c) ? '#b0101e' : '#111'; g.font = '700 40px Georgia'; g.textAlign = 'center'; g.fillText(c, x + 46, 80); }); });
const cardsMat = new THREE.MeshStandardMaterial({ map: cardsTex, roughness: .5, transparent: true });
const chipCols = [0xb0101e, 0x0f6b3e, 0x111114, 0x1d4f9a, 0x5a2a7a, 0xd8d0c0];
const chipMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4 });
function chipStacks(p, spots) { spots.forEach(([x, z, n, ci], k) => p.add(P3(new THREE.CylinderGeometry(.045, .045, .012 * n, 16), new THREE.MeshStandardMaterial({ color: chipCols[ci % 6], roughness: .35 }), x, .82 + .006 * n, z))); }
const FELT_G = ['#1f8a4a', '#0b4a26'], FELT_B = ['#2058b0', '#0d2a66'], FELT_R = ['#8a1a2a', '#4a0a14'];
function pokerProto(blue, round) { const SX = round ? 1.05 : 1.75;
  const p = new THREE.Group(), fm = new THREE.MeshStandardMaterial({ map: feltTex(blue ? FELT_B : FELT_G, 'poker'), roughness: .95, envMapIntensity: .2 });
  p.add(P3(new THREE.CylinderGeometry(.3, .45, .72, 16), wood, 0, .36, 0));
  p.add(P3(new THREE.CylinderGeometry(.82, .78, .08, 48), wood, 0, .74, 0, { s: [SX, 1, 1] }));
  const fg = new THREE.CylinderGeometry(.66, .66, .04, 48); p.add(P3(fg, fm, 0, .79, 0, { s: [SX, 1, 1] }));
  p.add(P3(new THREE.TorusGeometry(.74, .085, 10, 64), leather, 0, .82, 0, { rx: Math.PI / 2, s: [SX, 1, 1] }));
  p.add(P3(new THREE.TorusGeometry(.835, .022, 6, 64), gold, 0, .78, 0, { rx: Math.PI / 2, s: [SX * .96, 1, 1] }));
  p.add(P3(new THREE.PlaneGeometry(.62, .16), cardsMat, 0, .815, -.02, { rx: -Math.PI / 2 }), P3(new THREE.BoxGeometry(.44, .04, .14), blackGl, 0, .82, -.5));
  chipStacks(p, [[-.7, .15, 8, 0], [.7, .15, 6, 1], [-.35, .4, 10, 2], [.35, .4, 5, 3], [0, .2, 12, 4]]);
  return p;
}
function halfProto(kind) { /* blackjack / baccarat half-moon: dealer at -z */
  const p = new THREE.Group(), fm = new THREE.MeshStandardMaterial({ map: feltTex(kind === 'bac' ? FELT_R : FELT_G, kind), roughness: .95, envMapIntensity: .2 });
  p.add(P3(new THREE.CylinderGeometry(.35, .5, .72, 16), wood, 0, .36, -.2));
  p.add(P3(new THREE.CylinderGeometry(1.25, 1.25, .08, 48, 1, false, -Math.PI / 2, Math.PI), wood, 0, .74, -.55));
  const fg = new THREE.CylinderGeometry(1.08, 1.08, .04, 48, 1, false, -Math.PI / 2, Math.PI); fg.translate(0, 0, 0);
  /* planar uv from top */ { const pa = fg.attributes.position, uv = fg.attributes.uv; for (let i = 0; i < pa.count; i++) uv.setXY(i, (pa.getX(i) + 1.08) / 2.16, 1 - pa.getZ(i) / 1.08); }
  p.add(P3(fg, fm, 0, .79, -.55));
  p.add(P3(new THREE.TorusGeometry(1.16, .085, 10, 48, Math.PI), leather, 0, .82, -.55, { rx: Math.PI / 2 }));
  p.add(P3(new THREE.BoxGeometry(2.5, .12, .2), wood, 0, .8, -.62), P3(new THREE.BoxGeometry(.6, .05, .16), blackGl, 0, .87, -.6), P3(new THREE.BoxGeometry(.18, .14, .3), blackGl, .7, .88, -.55));
  chipStacks(p, [[-.5, -.1, 6, 0], [.5, -.1, 8, 2], [0, .2, 5, 1]]);
  p.add(P3(new THREE.PlaneGeometry(.5, .13), cardsMat, 0, .815, -.25, { rx: -Math.PI / 2 }));
  return p;
}
const rotorTex = canvasTex(512, 512, (g, w) => { const n = 37; for (let i = 0; i < n; i++) { g.fillStyle = i === 0 ? '#0f7a3e' : i % 2 ? '#b0101e' : '#141414'; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 250, i / n * 6.283, (i + 1) / n * 6.283); g.fill(); }
  g.fillStyle = '#6a3a1a'; g.beginPath(); g.arc(256, 256, 170, 0, 7); g.fill(); g.strokeStyle = '#d9b065'; g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 172, 0, 7); g.stroke(); g.beginPath(); g.arc(256, 256, 250, 0, 7); g.stroke(); });
const roulLayout = canvasTex(1024, 384, (g, w, h) => { g.fillStyle = '#145a32'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f0e2b8'; g.lineWidth = 3; g.font = '700 30px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]; const cw = 70, x0 = 100, y0 = 20, ch = 80;
  g.fillStyle = '#0f7a3e'; g.fillRect(20, y0, 80, ch * 3); g.strokeRect(20, y0, 80, ch * 3); g.fillStyle = '#fff'; g.fillText('0', 60, y0 + ch * 1.5);
  for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) { const n = c * 3 + (3 - r); g.strokeRect(x0 + c * cw, y0 + r * ch, cw, ch); g.fillStyle = RED.includes(n) ? '#b0101e' : '#141414'; g.beginPath(); g.ellipse(x0 + c * cw + cw / 2, y0 + r * ch + ch / 2, 24, 30, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillText(n, x0 + c * cw + cw / 2, y0 + r * ch + ch / 2); }
  ['1st 12', '2nd 12', '3rd 12'].forEach((t, i) => { g.strokeRect(x0 + i * cw * 4, y0 + ch * 3, cw * 4, 50); g.fillStyle = '#f0e2b8'; g.fillText(t, x0 + i * cw * 4 + cw * 2, y0 + ch * 3 + 25); });
  ['1-18', 'EVEN', 'RED', 'BLACK', 'ODD', '19-36'].forEach((t, i) => { g.strokeRect(x0 + i * cw * 2, y0 + ch * 3 + 50, cw * 2, 50); g.fillStyle = t === 'RED' ? '#d0202e' : t === 'BLACK' ? '#000' : '#f0e2b8'; g.fillText(t, x0 + i * cw * 2 + cw, y0 + ch * 3 + 75); }); });
function roulProto() {
  const p = new THREE.Group();
  p.add(P3(new THREE.BoxGeometry(3.0, .74, 1.3), wood, 0, .37, 0), P3(new THREE.PlaneGeometry(2.0, .78), new THREE.MeshStandardMaterial({ map: roulLayout, roughness: .95 }), .45, .745, .05, { rx: -Math.PI / 2 }));
  p.add(P3(new THREE.BoxGeometry(3.05, .1, .12), leather, 0, .79, .62), P3(new THREE.BoxGeometry(3.05, .1, .12), leather, 0, .79, -.62), P3(new THREE.BoxGeometry(.12, .1, 1.3), leather, 1.49, .79, 0));
  p.add(P3(new THREE.CylinderGeometry(.58, .6, .2, 40), wood, -1.0, .84, 0), P3(new THREE.CylinderGeometry(.46, .46, .05, 40), new THREE.MeshStandardMaterial({ map: rotorTex, roughness: .3, metalness: .2 }), -1.0, .93, 0, { ud: { spin: 1 } }));
  p.add(P3(new THREE.CylinderGeometry(.03, .09, .16, 12), gold, -1.0, 1.02, 0), P3(new THREE.TorusGeometry(.53, .02, 6, 40), gold, -1.0, .95, 0, { rx: Math.PI / 2 }));
  chipStacks(p, [[.2, .25, 6, 0], [.7, -.1, 4, 2], [1.1, .3, 8, 1]].map(([x, z, n, c]) => [x, z, n, c]));
  return p;
}
const crapsLayout = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#145a32'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f0e2b8'; g.lineWidth = 4; g.fillStyle = '#f0e2b8'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeRect(40, 40, w - 80, h - 80); g.strokeRect(80, h - 140, w - 160, 70); g.font = '700 40px Georgia'; g.fillText('PASS LINE', w / 2, h - 105);
  g.strokeRect(80, h - 230, w - 160, 80); g.font = '600 30px Georgia'; g.fillText('FIELD  2 · 3 · 4 · 9 · 10 · 11 · 12', w / 2, h - 190);
  [4, 5, 'SIX', 8, 'NINE', 10].forEach((n, i) => { g.strokeRect(110 + i * 135, 60, 125, 110); g.font = '700 46px Georgia'; g.fillText(n, 172 + i * 135, 115); }); g.font = '600 30px Georgia'; g.fillText("DON'T PASS BAR", w / 2, 210); });
function crapsProto() {
  const p = new THREE.Group(); const sh = (w, d, r) => { const s = new THREE.Shape(), x = -w / 2, y = -d / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const wall = sh(3.6, 1.7, .55); wall.holes.push(sh(3.3, 1.4, .45));
  const wg = new THREE.ExtrudeGeometry(wall, { depth: .92, bevelEnabled: false, curveSegments: 10 }); wg.rotateX(-Math.PI / 2);
  p.add(P3(wg, wood, 0, 0, 0));
  const rg = new THREE.ExtrudeGeometry(wall, { depth: .1, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, curveSegments: 10 }); rg.rotateX(-Math.PI / 2); p.add(P3(rg, leather, 0, .92, 0));
  const bed = new THREE.PlaneGeometry(3.3, 1.4); p.add(P3(bed, new THREE.MeshStandardMaterial({ map: crapsLayout, roughness: .95 }), 0, .8, 0, { rx: -Math.PI / 2 }));
  p.add(P3(new THREE.BoxGeometry(3.0, .78, 1.1), wood, 0, .39, 0));
  p.add(P3(new THREE.BoxGeometry(.1, .1, .1), new THREE.MeshStandardMaterial({ color: 0xb0101e, roughness: .2 }), .3, .85, .1, { ry: .5 }), P3(new THREE.BoxGeometry(.1, .1, .1), new THREE.MeshStandardMaterial({ color: 0xb0101e, roughness: .2 }), .45, .85, -.05, { ry: 1.1 }));
  chipStacks(p, [[-1.2, .7, 6, 0], [1.2, .7, 6, 2], [0, .7, 8, 1]].map(([x, z, n, c]) => [x, z, n, c]));
  p.children.slice(-3).forEach((c) => (c.position.y = .97));
  return p;
}
function chairProto() { const p = new THREE.Group(), T = { ud: { tint: 'tint' } };
  p.add(P3(new THREE.BoxGeometry(.48, .1, .46), chairLeather, 0, .5, 0, T), P3(new THREE.BoxGeometry(.48, .5, .08), chairLeather, 0, .8, -.22, { rx: -.1, ud: { tint: 'tint' } }), P3(new THREE.CylinderGeometry(.04, .04, .45, 6), chrome, 0, .25, 0), P3(new THREE.CylinderGeometry(.24, .26, .03, 14), chrome, 0, .015, 0));
  return p; }

/* ---------- layout: heroes (one per game) + decorative clones that also open games ---------- */
const HERO = {
  gildedreels: { x: -3.8, z: 6.5, ry: Math.PI / 2, k: 'slot', type: 3, cell: 0 }, candyrush: { x: 3.8, z: 6.5, ry: -Math.PI / 2, k: 'slot', type: 2, cell: 5 },
  rubyroulette: { x: -21.5, z: -2.8, ry: Math.PI / 2, k: 'roul' }, velvet21: { x: -15.6, z: -3.2, ry: Math.PI / 2, k: 'bj' },
  dicepalace: { x: 21.5, z: -2.6, ry: -Math.PI / 2, k: 'craps' }, baccaratnoir: { x: 15.6, z: -3.2, ry: -Math.PI / 2, k: 'bac' },
  holdemroyale: { x: -29.8, z: 0, ry: Math.PI / 2, k: 'poker' }, diamondpoker: { x: 29.8, z: 0, ry: -Math.PI / 2, k: 'pokerB' },
  luckykeno: { x: -9.5, z: -14.2, ry: 0, k: 'keno' }, plinkodrop: { x: -12, z: 15.2, ry: Math.PI, k: 'plinko' }, rocketcrash: { x: -8.6, z: 15.2, ry: Math.PI, k: 'rocket' },
  bigwheel: { x: 14, z: 13.6, ry: Math.PI, k: 'wheel' }, steelfront: { x: 8.8, z: 14.8, ry: Math.PI, k: 'arcade' } };
const EXTRA_SLOT_SPOTS = [[-3.8, -6.5], [3.8, -6.5], [-9.5, 3.4], [9.5, 3.4], [-9.5, -3.4], [9.5, -3.4], [12.6, -9.8], [7.4, -9.8]];
const SLOT_IDS = ['gildedreels', 'candyrush'];
const CELL_GAME = ['classic777', 'diamondclub', 'pharaohsgold', 'poseidonsfortune', 'dragonjackpot', 'gemburst']; /* THEMES order */
const clones = [];
const fwdOf = (ry) => [Math.sin(ry), Math.cos(ry)];
function ent(id, x, z, ry, dist) { const [fx, fz] = fwdOf(ry); const e = { id, ry, g: null, center: new THREE.Vector3(x, 0, z), stand: new THREE.Vector3(x + fx * dist, 0, z + fz * dist) }; clones.push(e); return e; }
const heroAt = (x, z) => Object.values(HERO).some((h) => Math.hypot(h.x - x, h.z - z) < 3.2);
const SLOTS = [[], [], [], []], CHAIRS = [];
const BANK_COL = [0x8c1a2b, 0x1d4f9a, 0x5a2a7a, 0x0f6b4e, 0xb8862e, 0x111114, 0xa8501e, 0x22407a];
const JP_SIGNS = [];
function bank(cx, cz, n, alongX, type, colI, slotIdx) {
  const sp = .86, col = BANK_COL[colI % 8];
  for (let side = -1; side <= 1; side += 2) for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * sp; const x = alongX ? cx + o : cx + side * .45, z = alongX ? cz + side * .45 : cz + o;
    const ry = alongX ? (side > 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2);
    SLOTS[type].push({ x, z, ry, tint: col, stool: 0x9a1222, led: LED_COL[(colI + i) % 6], cell: (colI + i) % 6, ent: ent(CELL_GAME[(colI + i) % 6], x, z, ry, 1.5) });
  }
  if (alongX) block(cx, cz, n * sp / 2 + .1, .9); else block(cx, cz, .9, n * sp / 2 + .1);
  if (type === 3) JP_SIGNS.push([cx, cz, alongX]);
}
/* 4 slot islands around the centerpiece */
let bk = 0;
for (const [x, z] of [[-7, 6.5], [7, 6.5], [-7, -6.5], [7, -6.5]]) bank(x, z, 6, true, [3, 0, 2, 1][bk], bk * 2 + 1, bk++);
/* High Limit salon (top-right corner) */
bank(10, -14.4, 5, true, 3, 5, bk++); bank(14.6, -12.4, 3, false, 0, 4, bk++);
/* tables */
const TAB = { poker: [], pokerB: [], bj: [], bac: [], roul: [], craps: [] };
function table(k, x, z, ry, id) { const e = ent(id, x, z, ry, k === 'roul' || k === 'craps' ? 1.7 : 1.9);
  TAB[k].push({ x, z, ry, ent: e }); const c = Math.cos(ry), s = Math.sin(ry); const put = (lx, lz, rr, tint) => CHAIRS.push({ x: x + lx * c + lz * s, z: z - lx * s + lz * c, ry: ry + rr, tint });
  if (k === 'poker' || k === 'pokerB') { blockR(x, z, 1.3); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; if (Math.abs(a - Math.PI * 1.5) < .5) continue; put(Math.sin(a) * 1.45, Math.cos(a) * 1.45, Math.atan2(Math.sin(a), Math.cos(a)) + Math.PI, 0x3a1a12); } }
  else if (k === 'bj' || k === 'bac') { blockRot(x, z, ry, 1.3, .8); for (let i = 0; i < 6; i++) { const a = -1.2 + i / 5 * 2.4; put(Math.sin(a) * 1.55, -.55 + Math.cos(a) * 1.55, a + Math.PI, k === 'bac' ? 0x4a0a14 : 0x2a1a10); } }
  else if (k === 'roul') { blockRot(x, z, ry, 1.6, .75); for (let i = 0; i < 4; i++) put(-.3 + i * .55, 1.0, Math.PI, 0x4a0a14); }
  else blockRot(x, z, ry, 1.9, 1.0);
}
Object.entries(HERO).forEach(([id, h]) => { if (TAB[h.k]) table(h.k, h.x, h.z, h.ry, id); else if (h.k === 'slot') SLOTS[h.type].push({ x: h.x, z: h.z, ry: h.ry, tint: 0x8c1a2b, stool: 0x9a1222, led: LED_COL[h.cell % 6], cell: h.cell, ent: ent(id, h.x, h.z, h.ry, 1.5) }); });
/* left pit: roulette + blackjack; right pit: craps + baccarat (teal, curved rail) */
table('roul', -21.5, 2.8, Math.PI / 2, 'rubyroulette'); table('bj', -15.6, 3.2, Math.PI / 2, 'velvet21');
table('roul', 21.5, 2.8, -Math.PI / 2, 'rubyroulette'); table('bac', 15.6, 3.2, -Math.PI / 2, 'baccaratnoir');
/* arcs of round poker tables along both rounded ends */
for (const sx of [-1, 1]) for (let i = -3; i <= 3; i++) { const a = i * .42, cx = sx * RX, x = cx + sx * Math.cos(a) * 13.8, z = Math.sin(a) * 13.8; if (heroAt(x, z)) continue; table(sx < 0 ? 'poker' : 'pokerB', x, z, Math.atan2(cx - x, -z), sx < 0 ? 'holdemroyale' : 'diamondpoker'); }
for (let t = 0; t < 4; t++) if (SLOTS[t].length) inst(slotProto(t), SLOTS[t]);
const protoOf = { poker: () => pokerProto(false, true), pokerB: () => pokerProto(true, true), bj: () => halfProto('bj'), bac: () => halfProto('bac'), roul: roulProto, craps: crapsProto };
Object.keys(TAB).forEach((k) => { if (!TAB[k].length) return; inst(protoOf[k](), TAB[k]); });
inst(chairProto(), CHAIRS);
/* pendant table lamps */
{ const lamps = []; Object.keys(TAB).forEach((k) => TAB[k].forEach((t) => { lamps.push({ x: t.x, z: t.z, ry: t.ry }); if (k === 'roul' || k === 'craps') { const [fx, fz] = [Math.cos(t.ry), -Math.sin(t.ry)]; lamps.push({ x: t.x + fx * .9, z: t.z + fz * .9, ry: t.ry }); lamps[lamps.length - 2].x -= fx * .9; lamps[lamps.length - 2].z -= fz * .9; } }));
  const lp = new THREE.Group(); lp.add(P3(new THREE.CylinderGeometry(.18, .5, .32, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a1a10, metalness: .6, roughness: .35, side: THREE.DoubleSide }), 0, 3.0, 0), P3(new THREE.CircleGeometry(.48, 24), glowW(0xfff0d0, 1.0), 0, 2.85, 0, { rx: Math.PI / 2 }), P3(new THREE.CylinderGeometry(.008, .008, H - 3.15, 4), chrome, 0, (H + 3.15) / 2, 0), P3(new THREE.TorusGeometry(.5, .015, 6, 24), gold, 0, 2.85, 0, { rx: Math.PI / 2 }));
  inst(lp, lamps); }
const SEATED = CHAIRS.filter((c, i) => (i * 7) % 10 < (mobile ? 3 : 5));
/* progressive jackpot signs over tall-topper banks */
const jpCanvas = []; function jpDraw(c, v) { const g = c.getContext('2d'), w = c.width, h = c.height; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4a0612'); gr.addColorStop(1, '#1a0206'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e0b35c'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#fff1c8'; for (let i = 0; i < 30; i++) for (const y of [14, h - 14]) { g.beginPath(); g.arc(16 + i * (w - 32) / 29, y, 3.5, 0, 7); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 30px Georgia,serif'; g.fillStyle = '#ffd76a'; g.fillText('GRAND PROGRESSIVE', w / 2, 46); g.font = '800 56px Helvetica,Arial'; g.fillStyle = '#ffe9a8'; g.fillText(Math.floor(v).toLocaleString() + ' chips', w / 2, 100); }
JP_SIGNS.forEach(([x, z, ax], i) => { const c = document.createElement('canvas'); c.width = 512; c.height = 140; const v = 250000 + i * 91234; jpDraw(c, v); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, .7, .08), [blackGl, blackGl, blackGl, blackGl, new THREE.MeshBasicMaterial({ map: t }), new THREE.MeshBasicMaterial({ map: t })]); m.position.set(x, 3.75, z); if (!ax) m.rotation.y = Math.PI / 2; scene.add(m); jpCanvas.push({ c, t, v }); });

/* ---------- chandeliers (crystal tiers, instanced) ---------- */
const chand = [[0, 0, 2.6], [-7, 6.5, 1.3], [7, 6.5, 1.3], [-7, -6.5, 1.3], [7, -6.5, 1.3], [-19, 0, 2.0], [19, 0, 2.0], [-27, 0, 1.6], [27, 0, 1.6]];
const per = 28, bulbs = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.06, 0), new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xfff0d0, emissiveIntensity: .9, roughness: 0, metalness: 0, transmission: 0 }), chand.length * per * 3);
let bi = 0;
chand.forEach(([x, z, r]) => { for (const [rr, y, n] of [[r, H - 1.5, per], [r * .7, H - 1.15, per], [r * .4, H - .8, per]]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rr, .03, 6, 40), gold); ring.rotation.x = Math.PI / 2; ring.position.set(x, y + .06, z); scene.add(ring);
  for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; dummy.position.set(x + Math.cos(a) * rr, y - (k % 2) * .1, z + Math.sin(a) * rr); dummy.rotation.set(0, a, 0); dummy.scale.set(1, 1.8, 1); dummy.updateMatrix(); bulbs.setMatrixAt(bi++, dummy.matrix); } }
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .8, 6), gold); rod.position.set(x, H - .4, z); scene.add(rod); });
bulbs.count = bi; dummy.scale.set(1, 1, 1); scene.add(bulbs);

/* ---------- center bar (realistic oval bar) at the back cross aisle ---------- */
{
  const bar = new THREE.Group(); bar.position.set(0, 0, -12.6); bar.scale.setScalar(.8);
  const top = new THREE.Mesh(new THREE.TorusGeometry(2.4, .42, 10, 48), new THREE.MeshPhysicalMaterial({ color: 0x1a1210, roughness: .1, metalness: .2, clearcoat: 1 })); top.rotation.x = Math.PI / 2; top.scale.z = .12; top.position.y = 1.1; top.scale.y = 1; bar.add(top);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 1.05, 48, 1, true), wood); body.position.y = .52; bar.add(body);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 1.05, 48, 1, true), wood); inner.position.y = .52; bar.add(inner);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(2.72, .03, 6, 64), gold); rail.rotation.x = Math.PI / 2; rail.position.y = .25; bar.add(rail);
  const shelf = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 2.4, 24), new THREE.MeshStandardMaterial({ color: 0x2a1a12, emissive: 0x7a4a1a, emissiveIntensity: .6, roughness: .4 })); shelf.position.y = 1.2; bar.add(shelf);
  const bot = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .08, .34, 8), new THREE.MeshPhysicalMaterial({ roughness: .05, transmission: 0, clearcoat: 1 }), 72);
  for (let i = 0; i < 72; i++) { const a = i / 24 * Math.PI * 2, row = Math.floor(i / 24); dummy.position.set(Math.cos(a) * 1.12, 1.0 + row * .55, Math.sin(a) * 1.12); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); bot.setMatrixAt(i, dummy.matrix); bot.setColorAt(i, tmpC.setHex([0x2a6a2a, 0x8a5a1a, 0xd8d0b0, 0x6a1a1a, 0x1a3a6a][i % 5])); }
  bar.add(bot);
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, .4, 48), new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: .5 })); canopy.position.y = H - .7; bar.add(canopy);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(3.0, .05, 6, 64), gold); crown.rotation.x = Math.PI / 2; crown.position.y = H - .5; bar.add(crown);
  const cs = signMesh(neonTex('Lounge & Bar', '#c9a45c'), 3.6); cs.position.y = 3.6; bar.add(cs); billboards.push(cs);
  const stools = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; if (Math.sin(a) < -.5) continue; stools.push({ x: Math.cos(a) * 2.5, z: -12.6 + Math.sin(a) * 2.5, ry: -a + Math.PI / 2, tint: 0x5a1420 }); }
  scene.add(bar); window.__crown = new THREE.Object3D();
  stools.forEach((s) => { const st = P3(new THREE.CylinderGeometry(.2, .2, .08, 16), new THREE.MeshStandardMaterial({ color: 0x5a1420, roughness: .5 }), s.x, .78, s.z); scene.add(st); const pl = P3(new THREE.CylinderGeometry(.03, .03, .76, 6), chrome, s.x, .38, s.z); scene.add(pl); });
  blockR(0, -12.6, 2.6);
}

/* ---------- octagonal centerpiece: cashier island + jackpot tower ---------- */
{ const c = new THREE.Group();
  const tellerM = new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(384, 270, (g, w, h) => { g.fillStyle = '#3a2410'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a1424'; g.fillRect(8, 8, w - 16, 56);
    g.fillStyle = '#f0c860'; g.font = 'bold 40px Georgia'; g.textAlign = 'center'; g.fillText('CASHIER', w / 2, 50); const gr = g.createLinearGradient(0, 70, 0, h); gr.addColorStop(0, '#2c4a58'); gr.addColorStop(1, '#6a8c96');
    g.fillStyle = gr; g.fillRect(16, 72, w - 32, h - 88); g.strokeStyle = '#d4a840'; g.lineWidth = 4; for (let x = 40; x < w - 20; x += 26) { g.beginPath(); g.moveTo(x, 72); g.lineTo(x, h - 50); g.stroke(); }
    g.lineWidth = 8; g.strokeRect(16, 72, w - 32, h - 88); g.fillStyle = '#d4a840'; g.fillRect(16, h - 50, w - 32, 8); g.fillStyle = '#1a0c06'; g.beginPath(); g.ellipse(w / 2, h - 16, 70, 28, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#ffe9b0'; g.font = '18px Georgia'; g.fillText('CHIPS · REDEEM · VIP', w / 2, h - 60); }) });
  c.add(P3(new THREE.CylinderGeometry(3.2, 3.3, 1.05, 8), wood, 0, .52, 0, { ry: Math.PI / 8 }), P3(new THREE.CylinderGeometry(3.35, 3.35, .08, 8), new THREE.MeshPhysicalMaterial({ color: 0xe8e0d0, roughness: .15, clearcoat: 1 }), 0, 1.09, 0, { ry: Math.PI / 8 }), P3(new THREE.CylinderGeometry(3.32, 3.32, .06, 8), brassM, 0, .2, 0, { ry: Math.PI / 8 }));
  c.add(P3(new THREE.CylinderGeometry(1.3, 1.5, 4.6, 8), new THREE.MeshPhysicalMaterial({ color: 0x1a1210, roughness: .2, clearcoat: 1, metalness: .3 }), 0, 2.3, 0, { ry: Math.PI / 8 }));
  const jc = document.createElement('canvas'); jc.width = 512; jc.height = 140; jpDraw(jc, 1250000); const jt = new THREE.CanvasTexture(jc); jt.colorSpace = THREE.SRGBColorSpace; jpCanvas.push({ c: jc, t: jt, v: 1250000 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const p = new THREE.Mesh(new THREE.PlaneGeometry(1.05, .3), new THREE.MeshBasicMaterial({ map: jt })); p.position.set(Math.sin(a) * 1.4, 3.5, Math.cos(a) * 1.4); p.rotation.y = a; c.add(p);
    if (i % 2 === 0) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), tellerM); w.position.set(Math.sin(a) * 3.05, 1.62, Math.cos(a) * 3.05); w.rotation.y = a; c.add(w);
      for (const s of [-1, 1]) c.add(P3(new THREE.CylinderGeometry(.04, .04, 1.1, 8), brassM, Math.sin(a) * 3.05 + Math.cos(a) * .78 * s, 1.64, Math.cos(a) * 3.05 - Math.sin(a) * .78 * s)); } }
  c.add(P3(new THREE.CylinderGeometry(1.7, 1.3, .3, 8), brassM, 0, 4.7, 0, { ry: Math.PI / 8 }), P3(new THREE.OctahedronGeometry(.6, 0), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, metalness: .1, clearcoat: 1, emissive: 0x6a5030 }), 0, 5.4, 0));
  const cs2 = signMesh(neonTex('Cashier', '#c9a45c'), 2.2); cs2.position.set(0, 2.55, 0); c.add(cs2); billboards.push(cs2);
  scene.add(c); blockR(0, 0, 3.6); }
/* potted palms */
{ const pp = new THREE.Group(); pp.add(P3(new THREE.CylinderGeometry(.4, .3, .7, 16), new THREE.MeshPhysicalMaterial({ color: 0x1a1210, roughness: .2, clearcoat: 1 }), 0, .35, 0), P3(new THREE.CylinderGeometry(.06, .08, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: .9 }), 0, 1.4, 0), P3(new THREE.TorusGeometry(.41, .03, 6, 24), brassM, 0, .7, 0, { rx: Math.PI / 2 }));
  const leafG = new THREE.ConeGeometry(.16, 1.3, 4); leafG.translate(0, .65, 0); const leafM = new THREE.MeshStandardMaterial({ color: 0x1f6a2a, roughness: .7, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(leafG, leafM); l.position.y = 2.15; l.rotation.set(1.1 + (i % 2) * .4, i / 9 * Math.PI * 2, 0, 'YXZ'); pp.add(l); }
  const spots = [[-15.4, -16.2], [15.4, -16.2], [-15.4, 16.2], [15.4, 16.2], [-3.2, 16.4], [3.2, 16.4], [-5.5, -15.8], [5.5, -15.8], [-12.5, 0], [12.5, 0]];
  inst(pp, spots.map(([x, z]) => ({ x, z, ry: 0 }))); spots.forEach(([x, z]) => blockR(x, z, .55)); }

/* ---------- zone signs (hanging marquee panels) ---------- */
const ZONES = {
  slots:   { label: 'SLOTS',          col: '#c9a45c', sign: [0, 9.8] },
  roul:    { label: 'ROULETTE · BLACKJACK', col: '#c9a45c', sign: [-19, 7.2] },
  craps:   { label: 'CRAPS · BACCARAT', col: '#c9a45c', sign: [19, 7.2] },
  pokerL:  { label: 'POKER ROOM',     col: '#c9a45c', sign: [-27, 8] },
  pokerR:  { label: 'VIDEO POKER · HIGH STAKES', col: '#c9a45c', sign: [27, 8] },
  keno:    { label: 'KENO LOUNGE',    col: '#c9a45c', sign: [-10, -11] },
  high:    { label: 'HIGH LIMIT SLOTS', col: '#c9a45c', sign: [11.5, -11] },
  instant: { label: 'INSTANT WINS',   col: '#c9a45c', sign: [-10, 11.6] },
  arcade:  { label: 'ARCADE · BIG WHEEL', col: '#c9a45c', sign: [11, 11.2] } };
Object.values(ZONES).forEach((zn) => { const s = signMesh(neonTex(zn.label, zn.col), 4.6); s.position.set(zn.sign[0], 4.75, zn.sign[1]); s.rotation.y = Math.abs(zn.sign[0]) > 20 ? (zn.sign[0] > 0 ? -1 : 1) * Math.PI / 2 * .6 : 0; scene.add(s);
  const ch = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, H - 5.7, 4), chrome); for (const dx of [-2.0, 2.0]) { const c2 = ch.clone(); c2.position.set(zn.sign[0] + dx, (H + 5.7) / 2, zn.sign[1]); scene.add(c2); } });

/* ---------- hero stations: signs, rings, special machines ---------- */
const stations = [];
let stationRoot = new THREE.Group(); scene.add(stationRoot);
const texLoader = new THREE.TextureLoader();
function iconTex(g) { const t = texLoader.load(g.icon, undefined, undefined, () => {}); t.colorSpace = THREE.SRGBColorSpace; return t; }
const wheelTex = canvasTex(512, 512, (g, w) => { const segs = 54, cols = { 1: '#d8c08a', 3: '#2a6ab0', 5: '#7a2a9a', 11: '#1f8a4a', J: '#b0101e', S: '#111' }; const L = []; for (let i = 0; i < 54; i++) L.push(i === 0 ? 'J' : i === 27 ? 'S' : i % 2 ? 1 : i % 4 === 0 ? 3 : i % 6 === 2 ? 5 : i % 9 === 4 ? 11 : 1);
  L.forEach((v, i) => { g.fillStyle = cols[v]; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 250, i / segs * 6.283, (i + 1) / segs * 6.283); g.fill(); g.save(); g.translate(256, 256); g.rotate((i + .5) / segs * 6.283); g.fillStyle = '#fff'; g.font = '700 18px Georgia'; g.textAlign = 'center'; g.fillText(v === 'J' ? '★' : v === 'S' ? '♛' : v, 215, 6); g.restore(); });
  g.fillStyle = '#c9a056'; g.beginPath(); g.arc(256, 256, 60, 0, 7); g.fill(); g.strokeStyle = '#e0b35c'; g.lineWidth = 8; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.stroke(); });
const pegTex = canvasTex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2a6a'); gr.addColorStop(1, '#3a0a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#f0e2b8';
  for (let r = 0; r < 12; r++) for (let c = 0; c <= r + 2; c++) { g.beginPath(); g.arc(w / 2 + (c - (r + 2) / 2) * 17, 40 + r * 34, 3.5, 0, 7); g.fill(); }
  const pay = ['10', '3', '1.6', '1.1', '.5', '1.1', '1.6', '3', '10']; pay.forEach((p, i) => { g.fillStyle = ['#b0101e', '#d86a1a', '#d8a01a', '#1f8a4a', '#1d4f9a'][Math.abs(i - 4) > 3 ? 0 : 4 - Math.abs(i - 4)]; g.fillRect(8 + i * 27.5, h - 52, 25, 40); g.fillStyle = '#fff'; g.font = '700 11px Helvetica'; g.textAlign = 'center'; g.fillText(p, 20 + i * 27.5, h - 28); }); });
const kenoTex = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#0a0a1a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e0b35c'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 46px Georgia'; g.fillStyle = '#ffd76a'; g.fillText('KENO  ·  GAME 4217', w / 2, 50); const hit = new Set(); while (hit.size < 20) hit.add(1 + Math.floor(rnd() * 80));
  for (let i = 0; i < 80; i++) { const c = i % 10, r = Math.floor(i / 10), x = 80 + c * 96, y = 112 + r * 48; g.fillStyle = hit.has(i + 1) ? '#ffcf4a' : '#1a2a4a'; g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill(); g.fillStyle = hit.has(i + 1) ? '#2a1404' : '#9ab0d0'; g.font = '700 20px Helvetica'; g.fillText(i + 1, x, y + 1); } });
function buildStation(g, h, locked) {
  const grp = new THREE.Group(); grp.position.set(h.x, 0, h.z); grp.rotation.y = h.ry;
  const hit = new THREE.Mesh(new THREE.BoxGeometry(h.k === 'slot' ? .9 : 2.6, 2.2, h.k === 'slot' ? .9 : 1.6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.1; grp.add(hit);
  let signY = 2.6;
  if (h.k === 'slot') signY = h.type === 3 ? 3.5 : 3.0;
  else if (h.k === 'wheel') { const wh = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, .12, 64), [wood, new THREE.MeshStandardMaterial({ map: wheelTex, roughness: .4 }), wood]); wh.rotation.x = Math.PI / 2; wh.position.set(0, 2.0, -.3); grp.add(wh); grp.userData.wheel = wh;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, .07, 10, 64), gold); rim.position.set(0, 2.0, -.24); grp.add(rim); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; const b = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), btnGlow); b.position.set(Math.cos(a) * 1.3, 2 + Math.sin(a) * 1.3, -.17); grp.add(b); }
    const ptr = new THREE.Mesh(new THREE.ConeGeometry(.1, .3, 3), gold); ptr.rotation.z = Math.PI; ptr.position.set(0, 3.4, -.2); grp.add(ptr);
    grp.add(P3(new THREE.BoxGeometry(.4, 1.0, .3), wood, 0, .5, -.3), P3(new THREE.BoxGeometry(2.2, .8, .9), wood, 0, .4, .5), P3(new THREE.PlaneGeometry(2.0, .7), new THREE.MeshStandardMaterial({ color: 0x145a32, roughness: .95 }), 0, .805, .5, { rx: -Math.PI / 2 })); signY = 3.9; block(h.x, h.z, 1.2, 1.2); }
  else if (h.k === 'plinko') { grp.add(P3(new THREE.BoxGeometry(1.2, 2.8, .5), tintLac, 0, 1.4, -.05), P3(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshBasicMaterial({ map: pegTex, color: 0xf2f2f2 }), 0, 1.75, .205), P3(new THREE.BoxGeometry(1.26, .08, .56), gold, 0, 2.82, -.05), P3(new THREE.BoxGeometry(1.0, .1, .4), blackGl, 0, .7, .3));
    grp.children[1].material = tintLac.clone(); grp.children[1].material.color.setHex(0x1d2f6a); signY = 3.4; block(h.x, h.z, .8, .8); }
  else if (h.k === 'rocket') { const body = tintLac.clone(); body.color.setHex(0x1a1a22); grp.add(P3(new THREE.BoxGeometry(1.1, 1.0, .8), body, 0, .5, 0), P3(new THREE.BoxGeometry(1.1, 1.6, .4), body, 0, 1.8, -.2), P3(new THREE.PlaneGeometry(.95, .95), new THREE.MeshBasicMaterial({ map: iconTex(g), color: 0xe8e8e8 }), 0, 1.85, .005), P3(new THREE.BoxGeometry(1.14, .06, .44), gold, 0, 2.62, -.2), P3(new THREE.BoxGeometry(1.0, .08, .3), blackGl, 0, 1.02, .3, { rx: -.2 }));
    grp.add(P3(new THREE.CylinderGeometry(.22, .2, .1, 18), new THREE.MeshStandardMaterial({ color: 0x6a1420, roughness: .5 }), 0, .72, 1.0), P3(new THREE.CylinderGeometry(.03, .03, .68, 6), chrome, 0, .35, 1.0)); signY = 3.2; block(h.x, h.z, .7, .6); }
  else if (h.k === 'keno') { grp.add(P3(new THREE.BoxGeometry(5.2, 2.7, .2), blackGl, 0, 2.6, -1.2), P3(new THREE.PlaneGeometry(5.0, 2.5), new THREE.MeshBasicMaterial({ map: kenoTex }), 0, 2.6, -1.09), P3(new THREE.BoxGeometry(5.3, .08, .3), gold, 0, 3.98, -1.2));
    const lc = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) lc.push({ x: h.x - 2 + i, z: h.z + .6 + r * 1.3, ry: Math.PI, tint: 0x1d2f6a });
    lc.forEach((c) => { const ch = chairProto(); ch.position.set(c.x, 0, c.z); ch.rotation.y = 0; ch.traverse((o) => { if (o.isMesh && o.material === chairLeather) { o.material = new THREE.MeshStandardMaterial({ color: 0x1d2f6a, roughness: .5 }); } }); scene.add(ch); stationRoot.userData.keno = 1; });
    signY = 4.5; block(h.x, h.z - 1.2, 2.7, .3); }
  else if (h.k === 'arcade') { for (let i = -1; i <= 1; i++) { const pod = tintLac.clone(); pod.color.setHex(0x16161c); grp.add(P3(new THREE.BoxGeometry(.9, 1.0, .6), pod, i * 1.1, .5, 0), P3(new THREE.BoxGeometry(.95, .62, .06), blackGl, i * 1.1, 1.45, -.15), P3(new THREE.PlaneGeometry(.86, .52), new THREE.MeshBasicMaterial({ map: iconTex(g), color: 0xe0e0e0 }), i * 1.1, 1.45, -.115));
      grp.add(P3(new THREE.BoxGeometry(.5, .1, .5), new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: .4 }), i * 1.1, .55, .8), P3(new THREE.BoxGeometry(.5, .6, .08), new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: .4 }), i * 1.1, .9, 1.05)); } signY = 2.7; block(h.x, h.z, .6, 1.8); }
  else if (h.k === 'poker' || h.k === 'pokerB' || h.k === 'bj' || h.k === 'bac' || h.k === 'roul' || h.k === 'craps') signY = 2.7;
  const ring = new THREE.Mesh(new THREE.RingGeometry(h.k === 'slot' ? .7 : 2.0, h.k === 'slot' ? .78 : 2.1, 48), new THREE.MeshBasicMaterial({ color: locked ? 0x8e1b2c : 0xe0b35c, transparent: true, opacity: .6, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; grp.add(ring);
  const sign = signMesh(neonTex(g.title, '#e0b35c', null, null, locked), h.k === 'slot' ? 1.9 : 2.8); sign.position.set(h.x, signY, h.z); scene.add(sign); billboards.push(sign);
  stationRoot.add(grp);
  const [fx, fz] = fwdOf(h.ry), dist = h.k === 'slot' ? 1.5 : h.k === 'keno' ? 2.2 : h.k === 'plinko' || h.k === 'rocket' ? 1.7 : h.k === 'arcade' ? 2.2 : 2.0;
  return { g, grp, sign, ring, center: new THREE.Vector3(h.x, 0, h.z), stand: new THREE.Vector3(h.x + fx * dist, 0, h.z + fz * dist), locked };
}
const stationBlocksStart = boxes.length;
function layout(games) {
  scene.remove(stationRoot); stationRoot = new THREE.Group(); scene.add(stationRoot);
  for (const s of stations) { scene.remove(s.sign); const i = billboards.indexOf(s.sign); if (i >= 0) billboards.splice(i, 1); }
  stations.length = 0; boxes.length = stationBlocksStart;
  const byId = {}; games.forEach((g) => (byId[g.id] = g)); clones.forEach((c) => { if (!c.action) c.g = byId[c.id] || null; });
  let extra = 0;
  games.forEach((g) => { let h = HERO[g.id]; const cl = !h && clones.find((c) => c.id === g.id && c.ry != null); if (cl) h = { x: cl.center.x, z: cl.center.z, ry: cl.ry, k: 'slot', type: 0, noBlock: 1 }; if (!h) { const sp = EXTRA_SLOT_SPOTS[extra++ % EXTRA_SLOT_SPOTS.length]; h = { x: sp[0], z: sp[1], ry: sp[0] < 0 ? Math.PI / 2 : -Math.PI / 2, k: 'slot', type: 3 }; if (!g._slotPlaced) { const e = ent(g.id, h.x, h.z, h.ry, 1.5); e.g = g; } }
    stations.push(buildStation(g, h, L.locked(g.id))); });
  buildPanel(); drawMini(true);
}

/* ---------- people: dressed walking guests (instanced limbs) ---------- */
const nW = mobile ? 14 : 22, nP = nW + SEATED.length;
const PARTS = { torso: new THREE.CylinderGeometry(.17, .14, .62, 10), hips: new THREE.CylinderGeometry(.15, .16, .2, 10), leg: new THREE.CylinderGeometry(.065, .05, .82, 8), arm: new THREE.CylinderGeometry(.05, .04, .6, 8), head: new THREE.SphereGeometry(.11, 14, 10), hair: new THREE.SphereGeometry(.118, 14, 10, 0, 6.283, 0, 1.5) };
Object.values(PARTS).forEach((g) => g.translate(0, 0, 0)); PARTS.leg.translate(0, -.41, 0); PARTS.arm.translate(0, -.3, 0);
const pMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .65 });
const PI_ = {}; Object.keys(PARTS).forEach((k) => { const n = k === 'leg' || k === 'arm' ? nP * 2 : nP; PI_[k] = new THREE.InstancedMesh(PARTS[k], pMat(), n); PI_[k].frustumCulled = false; scene.add(PI_[k]); });
const OUTFIT = [[0x1a2238, 0x1a2238], [0x2a2a2e, 0x2a2a2e], [0x6a0f1c, 0x1a1a1a], [0x0f4a3a, 0x1a1a1a], [0xd8d0c0, 0x2a2238], [0x111114, 0x111114], [0x3a1a5a, 0x111114], [0x8a6a3a, 0x2a2a2e]];
const SKIN = [0xe8c0a0, 0xc89070, 0x8a5a3a, 0x5a3a24, 0xf0d0b8], HAIR = [0x1a1210, 0x3a2414, 0x8a6a3a, 0xc8a878, 0x2a2a2a];
const walkers = []; const PATHS = [[[2.2, 15], [2.2, 4.3]], [[-12, 3.3], [12, 3.3]], [[-12, -3.3], [12, -3.3]], [[-3.6, -10], [-3.6, 15]], [[3.6, 15], [3.6, -10]], [[-24, -9], [-14, 9]], [[24, 9], [14, -9]]];
for (let i = 0; i < nP; i++) { const o = OUTFIT[i % 8], st = i >= nW ? SEATED[i - nW] : null; walkers.push({ seat: st, path: i % PATHS.length, t: rnd(), sp: .012 + rnd() * .01, off: (rnd() - .5) * 1.4, top: o[0], bot: o[1], skin: SKIN[i % 5], hair: HAIR[(i * 3) % 5], h: .94 + rnd() * .12 });
  const w = walkers[i]; PI_.torso.setColorAt(i, tmpC.setHex(w.top)); PI_.hips.setColorAt(i, tmpC.setHex(w.bot)); PI_.head.setColorAt(i, tmpC.setHex(w.skin)); PI_.hair.setColorAt(i, tmpC.setHex(w.hair));
  for (let s = 0; s < 2; s++) { PI_.leg.setColorAt(i * 2 + s, tmpC.setHex(w.bot)); PI_.arm.setColorAt(i * 2 + s, tmpC.setHex(w.top)); } }
function walkerPos(w, t) { const [[ax, az], [bx, bz]] = PATHS[w.path]; let u = (w.t + t * w.sp) % 2; u = u < 1 ? u : 2 - u; const x = ax + (bx - ax) * u, z = az + (bz - az) * u; const hor = Math.abs(bx - ax) > Math.abs(bz - az); return [x + (hor ? 0 : w.off), 0, z + (hor ? w.off : 0)]; }
const rootD = new THREE.Object3D(), limbD = new THREE.Object3D(); rootD.add(limbD);
function poseWalkers(t, all) { walkers.forEach((w, i) => { if (w.seat && !all) return; const [x, , z] = w.seat ? [w.seat.x, 0, w.seat.z] : walkerPos(w, t), [x2, , z2] = w.seat ? [0, 0, 0] : walkerPos(w, t + .05); const ph = t * 7 + i;
  rootD.position.set(x, 0, z); rootD.rotation.set(0, w.seat ? w.seat.ry : Math.atan2(x2 - x, z2 - z), 0); rootD.scale.setScalar(w.h); rootD.updateMatrixWorld(true);
  const set = (im, idx, px, py, pz, rx) => { limbD.position.set(px, py, pz); limbD.rotation.set(rx || 0, 0, 0); limbD.updateMatrixWorld(true); im.setMatrixAt(idx, limbD.matrixWorld); };
  if (w.seat) { set(PI_.leg, i * 2, -.08, .58, .02, -1.45); set(PI_.leg, i * 2 + 1, .08, .58, .02, -1.35); set(PI_.hips, i, 0, .6, 0); set(PI_.torso, i, 0, 1.0, 0); set(PI_.arm, i * 2, -.22, 1.26, 0, -.9); set(PI_.arm, i * 2 + 1, .22, 1.26, 0, -.9); set(PI_.head, i, 0, 1.46, 0); set(PI_.hair, i, 0, 1.475, -.01); return; }
  const sw = Math.sin(ph) * .45; set(PI_.leg, i * 2, -.08, .86, 0, sw); set(PI_.leg, i * 2 + 1, .08, .86, 0, -sw); set(PI_.hips, i, 0, .9, 0); set(PI_.torso, i, 0, 1.3, 0);
  set(PI_.arm, i * 2, -.22, 1.56, 0, -sw * .8); set(PI_.arm, i * 2 + 1, .22, 1.56, 0, sw * .8); set(PI_.head, i, 0, 1.76, 0); set(PI_.hair, i, 0, 1.775, -.01); });
  Object.values(PI_).forEach((m) => (m.instanceMatrix.needsUpdate = true)); }
Object.values(PI_).forEach((m) => (m.visible = false)); /* blocky placeholders are never drawn */
const slotSeats = []; SLOTS.forEach((arr) => arr.forEach((s, i) => { if ((i * 5) % 7 < 2) { const [fx, fz] = fwdOf(s.ry); slotSeats.push({ x: s.x + fx * .93, z: s.z + fz * .93, ry: s.ry + Math.PI, y: 0, sy: .74 }); } }));
const pplV = new THREE.Vector3();
/* dealers: one per table (main floor + Grand Hall), standing on the dealer side facing the players */
const toW = (x, z, ry, lx, lz) => { const c = Math.cos(ry), s = Math.sin(ry); return [x + lx * c + lz * s, z - lx * s + lz * c]; };
const dealerOf = (k, x, z, ry) => k === 'poker' || k === 'pokerB' ? [...toW(x, z, ry, -1.5, 0), ry + Math.PI / 2] : k === 'roul' ? [...toW(x, z, ry, .9, -1.0), ry] : k === 'craps' ? [...toW(x, z, ry, 0, -1.35), ry] : [...toW(x, z, ry, 0, -1.0), ry];
const DEALERS = []; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; DEALERS.push([Math.sin(a) * 2.45, Math.cos(a) * 2.45, a]); } Object.keys(TAB).forEach((k) => TAB[k].forEach((tb) => DEALERS.push(dealerOf(k, tb.x, tb.z, tb.ry))));
const hallSeats = [], HDEAL = []; HALL_TABLES.forEach(([k, x, z, ry]) => { HDEAL.push(dealerOf(k, x, z, ry));
  if (k === 'bj' || k === 'bac') for (let i = 0; i < 6; i += 2) { const a = -1.2 + i / 5 * 2.4, [sx, sz] = toW(x, z, ry, Math.sin(a) * 1.55, -.55 + Math.cos(a) * 1.55); hallSeats.push({ x: sx, z: sz, ry: ry + a + Math.PI }); }
  if (k === 'poker' || k === 'pokerB') for (let i = 0; i < 8; i += 2) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; if (Math.abs(a - Math.PI * 1.5) < .5) continue; const [sx, sz] = toW(x, z, ry, Math.sin(a) * 1.45, Math.cos(a) * 1.45); hallSeats.push({ x: sx, z: sz, ry: ry + a + Math.PI }); } });
const HALL_PATHS = [[[-34, -21], [34, -21]], [[-34, -36], [34, -36]], [[0, -19], [0, -56]], [[-10, -27.5], [10, -27.5]], [[-21, -60], [21, -60]], [[-34, -48], [-12, -48]]];
const people = createPeople({ THREE, scene, mobile, collide: (x, z) => collide(x, z), getNav: () => { if (hall) hall.buildNow(); if (wing && wing.buildNow) wing.buildNow(); return createNav(collide); }, PATHS: PATHS.concat(HALL_PATHS), seats: slotSeats.concat(SEATED.map((c) => ({ x: c.x, z: c.z, ry: c.ry, y: 0 }))).sort(() => .5 - rnd()).slice(0, 12).concat(hallSeats.slice(0, 8)),
  dealers: DEALERS.concat(HDEAL), zoneVisible: (x, z) => z > HALL.z1 + .5 || !!(hall && hall.root.visible),
  pairs: [[-6.5, 10.5, .4], [7.5, 10.2, -.8], [-20, -40.5, .3], [10, -52, 1], [-14, 0, 1.2], [15, -1, 2], [0, 21.5, 0]], bar: [[-2.6, -12.6, Math.PI / 2], [2.6, -12.6, -Math.PI / 2], [-1.6, -10.9, Math.PI * .8], [1.6, -10.9, -Math.PI * .8], [0, -10.6, Math.PI]].concat(HALL_BARS.flatMap(([bx, bz]) => [[bx - 3.6, bz + 2.6, Math.PI], [bx - 1.2, bz + 2.6, Math.PI], [bx + 2.4, bz + 2.6, Math.PI]])),
  onReady: () => { Object.values(PI_).forEach((m) => (m.visible = false)); mkMe(); intro.done(); try { cruz = createCruz({ THREE, scene, collide, people, stadium }); window.__cruz = cruz; } catch (e) { console.warn('cruz', e); } } });
let cruz = null, team = null;
/* the player's own avatar (Gift shop > Choose look), visible in the Zoom Out view */
let me = null, meLast = [0, 0]; function mkMe() { if (!people.H) return; if (me) scene.remove(me.object); me = people.H.make(getAvatar() || { g: 'm', outfit: 'tee_jeans', hair: 'short', skin: 1, hairCol: 0x2e1c12 }, 1.76); me.object.visible = false; scene.add(me.object); me.play('Idle_Loop', 0); }
addEventListener('gc18-avatar', mkMe); window.__people = people;
Object.values(PI_).forEach((m) => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });

/* ---------- post ---------- */
let composer = null, bloom = null;
try { composer = new EffectComposer(R); composer.addPass(new RenderPass(scene, cam));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .2, .3, 1.25); composer.addPass(bloom); composer.addPass(new OutputPass()); } catch (e) { composer = null; }
function resize() { const w = innerWidth, h = innerHeight; R.setPixelRatio(TIERS[tier].pr); R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 74 : 62; cam.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(TIERS[tier].pr); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); } drawMini(true); }
addEventListener('resize', resize);

/* ---------- player & controls ---------- */
const P = { x: 0, z: 15.2, yaw: 0, pitch: -.06 }, RAD = .38, SPEED = 4.2;
const extraCeil = []; let hall = null; try { hall = createHall({ THREE, scene, P, inst, canvasTex, signMesh, neonTex, slotIds: CELL_GAME, cellOf: (id, c) => CELL_GAME.indexOf(id) >= 0 ? CELL_GAME.indexOf(id) : c, ent, LED: LED_COL, slotProto, TAB, CHAIRS, table, protoOf, chairProto,
  games: () => (L.games || []), clones, addStation: (s) => clones.push(s), markCeil: (m) => extraCeil.push(m) }); } catch (e) { console.warn('hall', e); }
let wing = null; try { wing = createWing({ THREE, scene, canvasTex, P, inst, addStation: (s) => clones.push(s), openShop }); } catch (e) { console.warn('wing', e); }
let stadium = null; try { stadium = createStadium({ THREE, scene, P, mobile }); } catch (e) { console.warn('stadium', e); }
/* ---------- bird's-eye "Zoom Out" view: drag to pan, pinch/wheel to zoom, tap a game/zone to fly there ---------- */
const TP = { on: false, cx: 0, cz: 0, lx: 0, lz: 0, rt: 0 }; let boss = null, bossLoading = false;
const BV = { on: false, k: 0, x: 0, z: 8, h: 52, ptr: new Map(), pinch: 0, moved: 0 };
const bvQ = new THREE.Quaternion(), fpQ = new THREE.Quaternion(), bvPos = new THREE.Vector3(), bvM = new THREE.Matrix4(), UPV = new THREE.Vector3(0, 1, 0);
function setBirds(on, coach) { BV.coach = !!(on && coach); { const ch = $('coachHud'); if (ch) ch.style.display = BV.coach ? 'block' : 'none'; } BV.on = on; if (on && BV.coach) { BV.x = 0; BV.z = 116; BV.h = 34; } else if (on) { BV.x = P.x; BV.z = P.z - 4; joy = null; jx = jy = 0; joyEl.style.display = 'none'; } $('bZoom').textContent = on ? 'Walk' : 'Zoom Out'; document.body.classList.toggle('birds', on); }
$('bZoom').onclick = () => { audioOn(); setBirds(!BV.on); };
function birdsTap(e) { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); const pt = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(UPV, 0), pt)) return; let best = null, bd = 2.6;
  for (const s of stations.concat(clones)) { if (!s.g) continue; const d = Math.hypot(s.center.x - pt.x, s.center.z - pt.z); if (d < bd) { bd = d; best = s; } }
  if (best) { teleport(best); setBirds(false); blip(880, .1); return; }
  if (inStadium(pt.x, pt.z, 1) || (wing && WING && pt.z > 16 && Math.abs(pt.x) < 22) || (hall && pt.z < HALL.z1 && pt.z > HALL.z0 + 1 && Math.abs(pt.x) < HALL.x1 - 1)) { P.x = pt.x; P.z = pt.z; auto = null; setBirds(false); } }
function birdsPtr(type, e) { if (type === 'down') { BV.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); BV.moved = 0; BV.pinch = 0; return; }
  if (type === 'move') { const o = BV.ptr.get(e.pointerId); if (!o) return; if (BV.ptr.size >= 2) { const [a, b] = [...BV.ptr.values()]; const d0 = Math.hypot(a.x - b.x, a.y - b.y); o.x = e.clientX; o.y = e.clientY; const d1 = Math.hypot(a.x - b.x, a.y - b.y); if (BV.pinch) BV.h = Math.max(14, Math.min(90, BV.h * d0 / Math.max(1, d1))); BV.pinch = 1; BV.moved += 20; return; }
    const dx = e.clientX - o.x, dy = e.clientY - o.y; o.x = e.clientX; o.y = e.clientY; BV.moved += Math.abs(dx) + Math.abs(dy); const s = BV.h / innerHeight * 1.1; BV.x = Math.max(-36, Math.min(36, BV.x - dx * s * (BV.coach ? -1 : 1))); BV.z = Math.max(BV.coach ? 70 : -62, Math.min(BV.coach ? 190 : 62, BV.z - dy * s * (BV.coach ? -1 : 1))); return; }
  if (type === 'up') { const had = BV.ptr.delete(e.pointerId); if (had && BV.ptr.size === 0 && BV.moved < 8) birdsTap(e); } }
cv.addEventListener('wheel', (e) => { if (!BV.on) return; e.preventDefault(); BV.h = Math.max(14, Math.min(90, BV.h * (e.deltaY > 0 ? 1.1 : .9))); }, { passive: false });
const keys = {}; let joy = null, look = null, jx = 0, jy = 0;
addEventListener('keydown', (e) => { if (e.target.tagName === 'SELECT') return; keys[e.code] = true; if ((e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') && near && !panelOpen() && !gateOpen()) { e.preventDefault(); play(near); } });
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const joyEl = $('joy'), knob = joyEl.firstElementChild;
cv.addEventListener('pointerdown', (e) => {
  audioOn(); hint(0); if (BV.on) { birdsPtr('down', e); cv.setPointerCapture(e.pointerId); return; }
  if (e.pointerType === 'touch' && e.clientX < innerWidth * .45 && !joy) { joy = { id: e.pointerId, x: e.clientX, y: e.clientY }; joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.style.display = 'block'; }
  else if (!look) look = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', (e) => {
  if (BV.on) { birdsPtr('move', e); return; }
  if (joy && e.pointerId === joy.id) { let dx = e.clientX - joy.x, dy = e.clientY - joy.y; const m = Math.hypot(dx, dy), mx = 50; if (m > mx) { dx *= mx / m; dy *= mx / m; } jx = dx / mx; jy = dy / mx; knob.style.transform = `translate(${dx}px,${dy}px)`; }
  else if (look && e.pointerId === look.id) { const dx = e.clientX - look.x, dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY; look.moved += Math.abs(dx) + Math.abs(dy);
    const s = e.pointerType === 'touch' ? .0055 : .0035; P.yaw -= dx * s; P.pitch = Math.max(-.9, Math.min(.6, P.pitch - dy * s)); }
});
function endPtr(e) { if (BV.on) { birdsPtr('up', e); return; } if (joy && e.pointerId === joy.id) { joy = null; jx = jy = 0; joyEl.style.display = 'none'; knob.style.transform = ''; } if (look && e.pointerId === look.id) { const tap = look.moved < 8; look = null; if (tap) tapPick(e); } }
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
/* tap a station/sign directly to walk up to it */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const floorPl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
/* tap far away / on a storefront: glide to the nearest station (shops, cashier, sportsbook or a game) around that point */
function nearTap(fp) { let best = null, bd = 4; for (const s of clones) { if (!s.g) continue; const d = Math.hypot(s.center.x - fp.x, s.center.z - fp.z) - (s.action ? 1.5 : 0); if (d < bd) { bd = d; best = s; } } if (best) glide(best); }
function tapPick(e) { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam);
  const hits = ray.intersectObjects([stationRoot, ...stations.map((s) => s.sign), ...pickInst], true);
  if (!hits.length || hits[0].distance > 18) { const fp = new THREE.Vector3(); if (ray.ray.intersectPlane(floorPl, fp) && fp.distanceTo(cam.position) < 40) nearTap(fp); return; }
  let o = hits[0].object; if (o.isInstancedMesh && o.userData.ents) { const e = o.userData.ents[hits[0].instanceId]; if (e && e.g) glide(e); return; } const st = stations.find((s) => s.sign === o || (function up(x) { while (x) { if (x === s.grp) return true; x = x.parent; } return false; })(o)); if (st) glide(st); else nearTap(hits[0].point); }
let auto = null;
function glide(st) { auto = { st, x: st.stand.x, z: st.stand.z }; }
function teleport(st) { P.x = st.stand.x; P.z = st.stand.z; faceTo(st, true); auto = null; }
function faceTo(st, snap) { const y = Math.atan2(-(st.center.x - P.x), -(st.center.z - P.z)); if (snap) { P.yaw = y; P.pitch = -.12; } return y; }
function collide(nx, nz) {
  { const s = stadium && stadium.collide(nx, nz, RAD); if (s) return s; }
  { const w = wing && wing.collide(nx, nz, RAD); if (w) return w; }
  const hc = hall && hall.collide(nx, nz, RAD); if (hc) { nx = hc[0]; nz = hc[1]; } else { const m = RAD + .25; if (Math.abs(nx) <= RX) nz = Math.max(-RR + m, Math.min(RR - m, nz)); else { const cx = Math.sign(nx) * RX, dx = nx - cx, d = Math.hypot(dx, nz); if (d > RR - m) { nx = cx + dx / d * (RR - m); nz = nz / d * (RR - m); } } }
  for (const b of boxes) { if (nx + RAD > b[0] && nx - RAD < b[2] && nz + RAD > b[1] && nz - RAD < b[3]) {
    const pushL = nx + RAD - b[0], pushR = b[2] - (nx - RAD), pushU = nz + RAD - b[1], pushD = b[3] - (nz - RAD), m = Math.min(pushL, pushR, pushU, pushD);
    if (m === pushL) nx -= pushL; else if (m === pushR) nx += pushR; else if (m === pushU) nz -= pushU; else nz += pushD; } }
  return [nx, nz];
}

/* ---------- HUD: prompt, panel, minimap, hint, chips, sound ---------- */
const promptEl = $('prompt'); let near = null, shown = null;
promptEl.onclick = () => near && play(near);
function play(st) { if (st.action) { audioOn(); blip(660, .08); st.action(); return; } audioOn(); blip(880, .12); L.open(st.g.id); setTimeout(relock, 300); }
function relock() { if (!gateOpen()) return; const iv = setInterval(() => { if (!gateOpen()) { clearInterval(iv); refreshLocks(); } }, 400); }
function refreshLocks() { if (stations.some((s) => s.locked !== L.locked(s.g.id))) layout(L.games); }
const gateOpen = () => $('gate').classList.contains('on');
const panelOpen = () => $('panel').classList.contains('on');
let favEl = null; if (window.Fav) { favEl = document.createElement('button'); favEl.type = 'button'; favEl.id = 'pFav'; favEl.className = 'fv-star'; favEl.onclick = (e) => { e.stopPropagation(); if (near) { Fav.toggle(near.g.id); updFav(); } }; document.body.append(favEl); }
function updFav() { if (!favEl) return; const on = !!(shown && Fav.has(shown.g.id)); favEl.textContent = Fav.star(on); favEl.classList.toggle('on', on); favEl.style.display = shown ? 'block' : 'none'; }
const infoEl = $('pInfo'); infoEl.onclick = () => near && window.HowTo && HowTo.open(near.g.id);
function setPrompt(st) { if (st === shown) return; shown = st; updFav(); infoEl.classList.toggle('on', !!(st && window.HowTo && HowTo.RULES[st.g.id])); if (!st) { promptEl.classList.remove('on'); return; }
  const lk = L.locked(st.g.id); promptEl.classList.toggle('lock', lk);
  promptEl.innerHTML = ''; promptEl.append(lk ? st.g.title + ' · members only' : (st.action ? 'Enter ' : 'Play ') + st.g.title); const sm = document.createElement('small');
  sm.textContent = lk ? `For players ${L.need(st.g.id)}+ only` : st.action ? st.g.tagline : `${st.g.rating}+ · ${st.g.tagline}`.slice(0, 64); promptEl.append(sm); promptEl.classList.add('on'); }
function buildPanel() { const box = $('pList'); box.innerHTML = '';
  { const zs = document.createElement('div'); zs.className = 'fv-sec'; zs.innerHTML = '<h3>QUICK TRAVEL</h3>'; const row = document.createElement('div'); row.className = 'fv-row';
    [['Casino floor', 0, 14.5, 0], ['Grand Hall', 0, -20, Math.PI], ['High-limit salon', 26, -36, Math.PI], ['Cashier', -8, -55, Math.PI], ['Poker room', -20, 0, Math.PI / 2], ['High limit', 10, -11, 0], ['Forum Shops', 0, 24, Math.PI], ['Cruz Field', 0, 84, Math.PI], ['Fountain', 0, 31, Math.PI], ['Sportsbook', -10, 30, Math.PI / 2], ['VIP Lounge', 10, 30, -Math.PI / 2]].forEach(([n, x, z, yaw]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'go2'; b.style.flex = 'none'; b.textContent = n; b.onclick = () => { P.x = x; P.z = z; P.yaw = yaw; P.pitch = -.06; auto = null; closePanel(); }; row.append(b); });
    zs.append(row); box.append(zs); }
  const favs = window.Fav ? Fav.list().map((id) => stations.find((s) => s.g.id === id)).filter(Boolean) : [];
  const sec = document.createElement('div'); sec.className = 'fv-sec'; sec.innerHTML = '<h3>★ FAVORITES</h3>'; const row = document.createElement('div'); row.className = 'fv-row';
  if (favs.length) favs.forEach((s) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'fv-tile'; b.innerHTML = `<img src="${s.g.icon}" alt="">${s.g.title}`; b.onclick = () => { closePanel(); play(s); }; row.append(b); });
  else row.innerHTML = '<small style="color:#9a8a6a">Tap ☆ on any game to pin it here for quick launch.</small>';
  sec.append(row); box.append(sec);
  stations.forEach((s) => { const r = document.createElement('div'); r.className = 'pr' + (s.locked ? ' lk' : ''); r.style.setProperty('--ac', s.g.accent);
    const im = document.createElement('img'); im.src = s.g.icon; im.alt = ''; im.onerror = () => (im.style.visibility = 'hidden');
    const d = document.createElement('div'); d.textContent = s.g.title + '  ' + s.g.rating + '+' + (s.locked ? ' · locked' : ''); const sm = document.createElement('small'); sm.textContent = ({ slots: 'SLOTS', tables: 'TABLE GAMES', cards: 'CARD ROOM', instant: 'INSTANT WINS', action: 'ARCADE' }[s.g.category] || 'SLOTS') + ' · ' + s.g.tagline; d.append(sm);
    const go = document.createElement('button'); go.className = 'go2'; go.type = 'button'; go.textContent = 'Walk'; go.onclick = () => { teleport(s); closePanel(); };
    const pl = document.createElement('button'); pl.className = 'pl'; pl.type = 'button'; pl.textContent = 'Play'; pl.onclick = () => { closePanel(); play(s); };
    r.append(im, d); if (window.Fav) r.append(Fav.button(s.g.id)); r.append(go, pl); box.append(r); }); }
if (window.Fav) Fav.onChange(() => { if ($('panel').classList.contains('on')) buildPanel(); else buildPanel(); });
function closePanel() { $('panel').classList.remove('on'); }
$('bWallet').onclick = () => window.Wallet && Wallet.open(); $('hChips').onclick = () => window.Wallet && Wallet.open();
$('bGames').onclick = () => { audioOn(); $('panel').classList.add('on'); }; $('pX').onclick = closePanel;
$('panel').addEventListener('click', (e) => { if (e.target.id === 'panel') closePanel(); });
$('mini').onclick = () => { audioOn(); $('panel').classList.add('on'); };
const mini = $('mini'), mg = mini.getContext('2d'); let miniBase = null; const FULLMAP = true;
function m2(x, z) { return [(x + W / 2) / W * (mini.width - 16) + 8, (z + D / 2) / D * (mini.height - 16) + 8]; }
function drawWingMini() { const w = mini.width, h = mini.height, g = mg, s = Math.min((w - 12) / 44, (h - 10) / 46), ox = w / 2, oz = 4 - 17 * s; const q = (x, z) => [ox + x * s, oz + z * s];
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(232,220,196,.9)'; g.beginPath(); const [a0, b0] = q(-21, WING.z0); g.moveTo(a0, b0); g.lineTo(...q(-21, WING.zc)); g.arc(...q(0, WING.zc), 21 * s, Math.PI, 0, true); g.lineTo(...q(21, WING.z0)); g.closePath(); g.fill();
  g.fillRect(...q(-2, 16), 4 * s, 5 * s); g.fillStyle = '#3ab0d0'; g.beginPath(); g.arc(...q(0, WING.zc), 4.2 * s, 0, 7); g.fill();
  g.font = '600 12px Georgia'; g.textAlign = 'center'; g.fillStyle = '#4a2a10'; [['SPORTS', -13, WING.z0 + 9], ['VIP', 13, WING.z0 + 9], ['FOUNTAIN', 0, WING.zc + 7.5], ['CASINO ▲', 0, 17.5]].forEach(([tx, x, z]) => { const [a, b] = q(x, z); g.fillText(tx, a, b); });
  const [px, py] = q(P.x, P.z); g.save(); g.translate(px, py); g.rotate(-P.yaw); g.fillStyle = '#7a1424'; g.beginPath(); g.moveTo(0, -10); g.lineTo(7, 7); g.lineTo(0, 3); g.lineTo(-7, 7); g.closePath(); g.fill(); g.restore(); }
/* whole-complex overview: Grand Hall (north) + main oval + Forum Shops wing (south), player arrow, zone labels */
function drawFullMini(full) { const w = mini.width, h = mini.height, s = Math.min((w - 8) / 84, (h - 8) / 128), ox = w / 2, oz = h / 2 + 1 * s, q = (x, z) => [ox + x * s, oz + z * s];
  if (full || !miniBase || miniBase._v !== 2) { miniBase = document.createElement('canvas'); miniBase._v = 2; miniBase.width = w; miniBase.height = h; const g = miniBase.getContext('2d');
    g.fillStyle = 'rgba(150,40,56,.92)'; g.fillRect(...q(HALL.x0, HALL.z0), (HALL.x1 - HALL.x0) * s, (HALL.z1 - HALL.z0) * s); g.strokeStyle = '#d9b065'; g.lineWidth = 1; g.strokeRect(...q(HALL.x0, HALL.z0), (HALL.x1 - HALL.x0) * s, (HALL.z1 - HALL.z0) * s);
    g.fillStyle = 'rgba(217,166,64,.85)'; g.fillRect(...q(14, -56), 24 * s, 17 * s); g.fillStyle = 'rgba(40,160,90,.9)'; g.fillRect(...q(-14, -61), 12 * s, 2.5 * s); g.fillStyle = 'rgba(30,20,40,.9)'; [[-28, -58], [6, -58]].forEach(([x, z]) => g.fillRect(...q(x - 5, z - 2), 10 * s, 4 * s));
    g.beginPath(); { const [a, b] = q(-RX, -RR); g.moveTo(a, b); } g.lineTo(...q(RX, -RR)); g.arc(...q(RX, 0), RR * s, -Math.PI / 2, Math.PI / 2); g.lineTo(...q(-RX, RR)); g.arc(...q(-RX, 0), RR * s, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fillStyle = 'rgba(120,20,70,.92)'; g.fill(); g.stroke();
    g.fillStyle = 'rgba(13,106,110,.95)'; for (const [px] of PITS) { g.beginPath(); g.arc(...q(px, 0), 6.6 * s, 0, 7); g.fill(); }
    if (WING) { g.fillStyle = 'rgba(226,214,190,.92)'; g.beginPath(); { const [a, b] = q(-21, WING.z0); g.moveTo(a, b); } g.lineTo(...q(-21, WING.zc)); g.arc(...q(0, WING.zc), 21 * s, Math.PI, 0, true); g.lineTo(...q(21, WING.z0)); g.closePath(); g.fill(); g.stroke(); g.fillRect(...q(-2.1, RR), 4.2 * s, (WING.z0 - RR) * s); g.fillStyle = '#3ab0d0'; g.beginPath(); g.arc(...q(0, WING.zc), 4.2 * s, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(150,40,56,.92)'; g.fillRect(...q(-4.2, -RR - .5), 8.4 * s, 1.5 * s);
    g.font = `700 ${Math.max(9, 7 * s)}px system-ui`; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)';
    [['GRAND HALL', -14, -42], ['HI-LIMIT', 26, -47], ['CASHIER', -8, -56.5], ['CASINO', 0, 1.5], ['FORUM SHOPS', 0, 50], ['▼ CRUZ FIELD', 0, 62.5]].forEach(([tx, x, z]) => { const [a, b] = q(x, z); g.strokeText(tx, a, b); g.fillStyle = '#ffe9a8'; g.fillText(tx, a, b); }); }
  mg.clearRect(0, 0, w, h); mg.drawImage(miniBase, 0, 0); const [px, py] = q(P.x, P.z); mg.save(); mg.translate(px, py); mg.rotate(-P.yaw); mg.fillStyle = '#fff'; mg.shadowColor = '#000'; mg.shadowBlur = 6;
  mg.beginPath(); mg.moveTo(0, -9); mg.lineTo(6, 6); mg.lineTo(0, 3); mg.lineTo(-6, 6); mg.closePath(); mg.fill(); mg.restore(); }
function drawStadMini() { const w = mini.width, h = mini.height, s = Math.min((w - 8) / 66, (h - 8) / 140), ox = w / 2, oz = 4 - 58 * s, q = (x, z) => [ox + x * s, oz + z * s]; const g = mg; g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(40,20,60,.92)'; g.fillRect(...q(-33, 76), 66 * s, 122 * s); g.fillStyle = '#2f8034'; g.fillRect(...q(-STAD.gx, STAD.gz0), 2 * STAD.gx * s, (STAD.gz1 - STAD.gz0) * s); g.fillStyle = '#4a1478'; g.fillRect(...q(-STAD.fx, STAD.z0), 2 * STAD.fx * s, 9.1 * s); g.fillStyle = '#f2b51c'; g.fillRect(...q(-STAD.fx, STAD.z1 - 9.1), 2 * STAD.fx * s, 9.1 * s);
  g.fillStyle = '#c9b89c'; g.fillRect(...q(-2.7, 58), 5.4 * s, 19 * s); g.font = `700 ${Math.max(9, 6 * s)}px system-ui`; g.textAlign = 'center'; g.fillStyle = '#ffe9a8'; g.fillText('CRUZ FIELD', ...q(0, 135)); g.fillText('▲ FORUM', ...q(0, 66));
  if (cruz && cruz.ready && cruz.on) { const [a, b] = q(cruz.x, cruz.z); g.fillStyle = '#f2b51c'; g.beginPath(); g.arc(a, b, 3.5, 0, 7); g.fill(); }
  const [px, py] = q(P.x, P.z); g.save(); g.translate(px, py); g.rotate(-P.yaw); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath(); g.fill(); g.restore(); }
function drawMini(full) { if (P.z > 58) { drawStadMini(); return; } if (FULLMAP) { drawFullMini(full); if (cruz && cruz.ready && cruz.on && cruz.mode === 'casino') { const w = mini.width, h = mini.height, s = Math.min((w - 8) / 84, (h - 8) / 128); mg.fillStyle = '#f2b51c'; mg.beginPath(); mg.arc(w / 2 + cruz.x * s, h / 2 + s + cruz.z * s, 3, 0, 7); mg.fill(); } return; }
  if (P.z > 17.5) { drawWingMini(); return; }
  if (full || !miniBase) { miniBase = document.createElement('canvas'); miniBase.width = mini.width; miniBase.height = mini.height; const g = miniBase.getContext('2d');
    const sx = (mini.width - 16) / W, sz = (mini.height - 16) / D; g.save(); g.translate(mini.width / 2, mini.height / 2); g.scale(sx, sz);
    g.beginPath(); g.moveTo(-RX, -RR); g.lineTo(RX, -RR); g.arc(RX, 0, RR, -Math.PI / 2, Math.PI / 2); g.lineTo(-RX, RR); g.arc(-RX, 0, RR, Math.PI / 2, Math.PI * 1.5); g.closePath();
    g.fillStyle = 'rgba(120,20,70,.85)'; g.fill(); g.strokeStyle = '#d9b065'; g.lineWidth = .6; g.stroke();
    g.fillStyle = 'rgba(170,100,50,.9)'; g.fillRect(-12, -7, 24, 14); g.fillRect(-5.5, -RR, 11, RR * 2);
    g.fillStyle = 'rgba(13,106,110,.95)'; for (const [px] of PITS) { g.beginPath(); g.arc(px, 0, 6.6, 0, 7); g.fill(); }
    g.fillStyle = '#5a3a1a'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + Math.PI / 8; g.lineTo(Math.cos(a) * 3.3, Math.sin(a) * 3.3); } g.fill();
    g.fillStyle = '#2a1a3a'; for (const [x, z] of [[-7, 6.5], [7, 6.5], [-7, -6.5], [7, -6.5]]) g.fillRect(x - 2.7, z - .9, 5.4, 1.8);
    g.restore(); g.font = '600 13px Georgia'; g.textAlign = 'center'; g.fillStyle = '#f3dfae';
    [['POKER', -27, 0], ['POKER', 27, 0], ['KENO', -11, -13.5], ['HI-LIMIT', 12.5, -13.5], ['ENTRANCE', 0, 16]].forEach(([t, x, z]) => { const [a, b] = m2(x, z); g.fillText(t, a, b + 5); });
    stations.forEach((s) => { const [x, y] = m2(s.center.x, s.center.z); g.fillStyle = s.locked ? '#444' : '#7a1424'; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); g.strokeStyle = '#e8d3a0'; g.lineWidth = 1.2; g.stroke(); }); }
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
if (window.GAudio) GAudio.bindButton(sndBtn); else sndBtn.onclick = () => { muted = !muted; try { localStorage.setItem(SKEY, muted ? '1' : '0'); } catch (e) {} sndBtn.textContent = muted ? 'Muted' : 'Sound'; audioOn(); if (master) master.gain.setTargetAtTime(muted ? 0 : .5, AC.currentTime, .3); };
function audioOn() { if (window.GAudio) { GAudio.unlock(); if (!AC) { GAudio.music('lobby'); GAudio.ambience(); } AC = GAudio.ctx(); master = GAudio.sfxBus; muted = false; return; } if (AC || muted) { if (AC && AC.state === 'suspended') AC.resume(); return; }
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
let meterAcc = 0; let last = performance.now(), t = 0, acc = 0, frames = 0, slowT = 0, fastT = 0, miniT = 0;
const fwd = new THREE.Vector3();
cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); try { sessionStorage.setItem(VKEY, 'list'); } catch (er) {} document.body.classList.remove('walk'); });
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
  if (people.ready) { const pushOut = (qx, qz, R) => { const ex = P.x - qx, ez = P.z - qz, d = Math.hypot(ex, ez); if (d < R && d > 1e-4) [P.x, P.z] = collide(qx + ex / d * R, qz + ez / d * R); };
    for (const q of people.list) if (q.o.visible) pushOut(q.o.position.x, q.o.position.z, .62); for (const e of people.extra || []) if (e.on) pushOut(e.x, e.z, .7); }
  const bob = m > 0 ? Math.sin(t * 9) * .025 : 0;
  cam.position.set(P.x, 1.62 + bob, P.z); cam.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
  if (TP.on && boss) { const s = Math.sin(P.yaw), c = Math.cos(P.yaw); let [cx, cz] = collide(P.x + s * 3.1, P.z + c * 3.1); TP.cx += (cx - TP.cx) * Math.min(1, dt * 8); TP.cz += (cz - TP.cz) * Math.min(1, dt * 8);
    cam.position.set(TP.cx, 2.35, TP.cz); cam.rotation.set(P.pitch - .22, P.yaw, 0, 'YXZ');
    const sp = Math.hypot(P.x - TP.lx, P.z - TP.lz) / Math.max(dt, .001); TP.lx = P.x; TP.lz = P.z; boss.object.visible = true; boss.object.position.set(P.x, 0, P.z); boss.object.rotation.y = P.yaw + Math.PI;
    boss.play(sp > 4.2 ? 'Jog_Fwd_Loop' : sp > .4 ? 'Walk_Formal_Loop' : 'Idle_Loop'); boss.mixer.update(dt);
    { const bb = $('bBook'); if (bb) bb.style.display = P.z > 70 && !BV.coach ? 'block' : 'none'; }
    if (people.ready && (TP.rt -= dt) < 0) { TP.rt = .5; for (const q of people.list) if (q.kind === 'walk' && q.st === 'walk' && q.o.visible && !(q.bossT > t) && Math.hypot(q.o.position.x - P.x, q.o.position.z - P.z) < 4.5) { q.bossT = t + 25; q.st = 'wave'; q.tm = 2.2; q.play('Interact', .3, true); } }
    if (cruz && cruz.team) cruz.team.boss = [P.x, P.z]; }
  else if (boss) { boss.object.visible = BV.k > .05 && TP.on; if (cruz && cruz.team) cruz.team.boss = null; }
  BV.k += ((BV.on ? 1 : 0) - BV.k) * Math.min(1, dt * 3.2); if (BV.k < .002) BV.k = 0;
  if (BV.k > 0) { const e = BV.k * BV.k * (3 - 2 * BV.k); fpQ.copy(cam.quaternion); if (BV.coach) bvPos.set(BV.x, BV.h, BV.z - BV.h * .75); else bvPos.set(BV.x, BV.h, BV.z + BV.h * .5); bvM.lookAt(bvPos, new THREE.Vector3(BV.x, 0, BV.z), UPV); bvQ.setFromRotationMatrix(bvM);
    cam.position.lerp(bvPos, e); cam.quaternion.copy(fpQ).slerp(bvQ, e); }
  { const ov = BV.k > .15; ceil.visible = !ov; scene.fog.far = ov ? 400 : P.z > 58 ? 320 : 80; scene.fog.near = ov ? 200 : P.z > 58 ? 120 : 30; }
  /* nearest station in front */
  cam.getWorldDirection(fwd); let best = null, bd = 3.4;
  for (const s of stations.concat(clones)) { if (!s.g) continue; const dx = s.center.x - P.x, dz = s.center.z - P.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fwd.x + dz * fwd.z) / d > .2) { bd = d; best = s; } }
  near = best; setPrompt(best);
  /* animate */
  /* people always live (reduced-motion only stops decorative effects) */
  if (people.ready) people.update(dt, t, pplV.set(P.x, 0, P.z), false);
  if (!still) {
    for (const s of stations) { const w = s.grp.userData.wheel; if (w) w.rotation.y += dt * .4; s.ring.material.opacity = s === near ? .95 : .45 + Math.sin(t * 3 + s.center.x) * .2; }
    if (me) { const sp = Math.hypot(P.x - meLast[0], P.z - meLast[1]) / Math.max(dt, .001); meLast = [P.x, P.z]; me.object.visible = BV.k > .05 && !TP.on; me.object.position.set(P.x, 0, P.z); me.object.rotation.y = P.yaw + Math.PI; me.play(sp > .4 ? 'Walk_Loop' : 'Idle_Loop'); if (me.object.visible) me.mixer.update(dt); }
    if ((acc += dt) > 1) { acc = 0; jpCanvas.forEach((j) => { j.v += 3 + Math.random() * 40; jpDraw(j.c, j.v); j.t.needsUpdate = true; }); }
  }
  for (const b of billboards) b.quaternion.copy(cam.quaternion);
  if (cruz && cruz.ready && stadium && stadium.built && !team) { try { team = createTeam({ THREE, scene, cruz, stadium, mobile }); cruz.team = team; window.__team = team; } catch (e) { console.warn('team', e); team = 1; } }
  if (team && team.update) team.update(dt, t, stadium.root.visible);
  if (stadium) stadium.update(dt, t, BV.k > .15, R, cruz && cruz.ready && (cruz.mode !== 'casino') ? cruz.pos() : null); if (cruz) cruz.update(dt, t, pplV.set(P.x, 0, P.z), (x, z) => (z > HALL.z1 + .5 || !!(hall && hall.root.visible)) && Math.hypot(x - P.x, z - P.z) < 45);
  if (wing) wing.update(dt, t, BV.k > .15); if (hall) hall.update(dt, t, BV.k > .15); extraCeil.forEach((m) => (m.visible = BV.k <= .15));
  if ((miniT += dt) > .1) { miniT = 0; drawMini(); }
  if ((meterAcc += dt) > .25) { meterAcc = 0; for (let i = 0; i < meterV.length; i++) meterV[i] += .01 + Math.random() * .37; drawMeters(); }
  { const k = 1.15 + Math.sin(t * 3.1) * .35; ledMat.color.setRGB(k, k, k); }
  if (composer && TIERS[tier].bloom) composer.render(); else R.render(scene, cam);
  /* adaptive quality: step down when slow, back up when steady */
  if (t > 2) { frames++; if (dt > 1 / 40) slowT += dt; else fastT += dt;
    if (frames >= 90) { if (slowT > .6 && tier < TIERS.length - 1) { tier++; resize(); } else if (slowT < .05 && fastT > 1.4 && tier > (mobile ? 1 : 0)) { tier--; resize(); } frames = 0; slowT = fastT = 0; } }
}
{ const b = document.createElement('button'); b.type = 'button'; b.id = 'bCruz'; b.textContent = '🏈'; b.title = 'Cruz'; b.setAttribute('aria-label', 'Cruz avatar menu');
  b.style.cssText = 'position:fixed;left:10px;top:262px;z-index:30;width:44px;height:44px;border-radius:50%;border:2px solid #f2b51c;background:#4a1478;color:#fff;font-size:22px;box-shadow:0 2px 10px rgba(0,0,0,.5)';
  const m = document.createElement('div'); m.id = 'cruzMenu'; m.style.cssText = 'position:fixed;left:8px;right:8px;bottom:12px;z-index:31;display:none;flex-direction:column;gap:6px;max-width:420px;margin:0 auto;max-height:62vh;overflow:auto;background:rgba(30,10,46,.97);border:1px solid #f2b51c;border-radius:14px;padding:10px;font:600 13px system-ui;color:#ffe9a8;box-shadow:0 6px 24px rgba(0,0,0,.6)';
  const head = document.createElement('div'); head.style.cssText = 'display:flex;justify-content:space-between;align-items:center'; head.innerHTML = '<b style="color:#f2b51c;font-size:15px">🏈 CRUZ · #12 QB</b>'; const x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.style.cssText = 'background:none;border:0;color:#fff;font-size:20px;padding:4px 8px'; x.onclick = () => (m.style.display = 'none'); head.append(x); m.append(head);
  const btns = {}; const row = (label, items) => { const r = document.createElement('div'); if (label) { const l = document.createElement('small'); l.textContent = label; l.style.cssText = 'display:block;margin:2px 0 3px;color:#c9b0e8'; r.append(l); } const g = document.createElement('div'); g.style.cssText = `display:grid;grid-template-columns:repeat(${Math.min(items.length, 3)},1fr);gap:6px`;
    items.forEach(([id, txt, fn]) => { const bt = document.createElement('button'); bt.type = 'button'; bt.id = id; bt.textContent = txt; bt.style.cssText = 'min-height:42px;padding:6px 4px;border-radius:9px;border:1px solid #f2b51c;background:#4a1478;color:#fff;font:600 13px system-ui'; bt.onclick = () => { if (cruz && cruz.ready) fn(); upd(); }; btns[id] = bt; g.append(bt); }); r.append(g); m.append(r); };
  row('', [['cCome', '📣 Come to me', () => cruz.command('come')], ['cFollow', '👣 Follow me', () => cruz.command('follow')], ['cStay', '✋ Stay here', () => cruz.command('stay')], ['cRoam', '🏃 Free roam', () => cruz.command('roam')]]);
  row('Speed', [['sWalk', 'Walk', () => cruz.setSpeed('walk')], ['sJog', 'Jog', () => cruz.setSpeed('jog')], ['sSprint', 'Sprint', () => cruz.setSpeed('sprint')], ['sAuto', 'Auto', () => cruz.setSpeed('auto')]]);
  row('Do a move', [['mJuke', 'Juke', () => cruz.doMove('juke')], ['mSpin', 'Spin', () => cruz.doMove('spin')], ['mHurdle', 'Hurdle', () => cruz.doMove('hurdle')], ['mCel', 'Celebrate', () => cruz.doMove('celebrate')], ['mWave', 'Wave', () => cruz.doMove('wave')], ['mPass', '🏈 Throw a pass', () => cruz.throwPass()]]);
  row('', [['cField', 'Go to field', () => { if (cruz.mode === 'casino' || cruz.mode === 'toCasino') cruz.command('field'); else { cruz.command('roam'); cruz.bringBack(); } }], ['cShow', 'Hide', () => cruz.setOn(!cruz.on)], ['cWatch', '📍 Go watch', () => { if (cruz.mode === 'casino') { P.x = cruz.x; P.z = cruz.z + 3; } else { P.x = 0; P.z = 98; P.yaw = Math.PI; } auto = null; m.style.display = 'none'; }]]);
  row('Coach view & playbook (on Cruz Field)', [['pCoach', '🎥 Coach View', () => { P.x = 0; P.z = 101; P.yaw = Math.PI; P.pitch = -.22; auto = null; if (cruz.mode === 'casino' || cruz.mode === 'toCasino') cruz.command('field'); else cruz.command('roam'); m.style.display = 'none'; setBirds(true, true); }],
    ['pBook', '📋 Playbook (500)', () => { m.style.display = 'none'; openBook(); }]]);
  function upd() { if (!cruz || !cruz.ready) return; btns.cShow.textContent = cruz.on ? '🙈 Hide Cruz' : '👀 Show Cruz'; btns.cField.textContent = cruz.mode === 'casino' || cruz.mode === 'toCasino' ? '🏟️ Go to field' : '↩ Bring back';
    const hi = (id, on) => { btns[id].style.background = on ? '#f2b51c' : '#4a1478'; btns[id].style.color = on ? '#1a0a28' : '#fff'; };
    hi('cCome', cruz.cmd === 'come'); hi('cFollow', cruz.cmd === 'follow'); hi('cStay', cruz.cmd === 'stay'); hi('cRoam', cruz.cmd === 'roam'); hi('sWalk', cruz.spd === 'walk'); hi('sJog', cruz.spd === 'jog'); hi('sSprint', cruz.spd === 'sprint'); hi('sAuto', cruz.spd === 'auto'); }
  setInterval(() => { if (m.style.display !== 'none') upd(); }, 800);
  b.onclick = () => { upd(); m.style.display = m.style.display === 'none' ? 'flex' : 'none'; }; document.body.append(b, m); }
window.__floor = { P, stations, teleport, collide, get near() { return near; }, get tier() { return tier; } };
resize(); layout(L.games); L.onGames((g) => layout(g)); faceTo({ center: new THREE.Vector3(0, 0, 0) }, true); P.pitch = -.04;
requestAnimationFrame(frame); intro.set(.4); setTimeout(() => intro.set(.65), 1500); setTimeout(() => intro.set(.85), 4000); setTimeout(() => intro.done(), 15000);
/* ---- Coach playbook sheet + HUD ---- */
{ const st = document.createElement('style'); st.textContent = `#coachHud{position:fixed;top:calc(10px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:30;display:none;background:rgba(30,10,50,.82);border:1px solid #f5c542;color:#fff;padding:6px 14px;border-radius:12px;font:600 14px system-ui;text-align:center;max-width:92vw;pointer-events:auto}
#coachHud small{display:block;color:#f5c542;font-weight:500;font-size:12px}#coachHud button{margin-top:4px;background:#f5c542;border:0;border-radius:8px;padding:4px 10px;font:600 12px system-ui}
#book{position:fixed;left:0;right:0;bottom:0;max-height:78vh;z-index:40;display:none;flex-direction:column;background:rgba(18,8,32,.96);border-top:2px solid #f5c542;border-radius:16px 16px 0 0;color:#fff;font:14px system-ui;padding:10px 10px calc(10px + env(safe-area-inset-bottom))}
#book input{width:100%;box-sizing:border-box;font-size:16px;padding:10px;border-radius:10px;border:1px solid #6b3fa0;background:#2a1444;color:#fff}
#book .chips{display:flex;gap:6px;overflow-x:auto;padding:8px 0}#book .chips button{flex:none;padding:8px 12px;border-radius:16px;border:1px solid #6b3fa0;background:#2a1444;color:#fff;font-size:13px}#book .chips button.on{background:#f5c542;color:#1a0a2a;border-color:#f5c542}
#book .list{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch}#book .it{padding:10px 8px;border-bottom:1px solid #3a2258;cursor:pointer}#book .it b{color:#f5c542}#book .it span{color:#bba;font-size:12px;display:block}#book .hd{display:flex;justify-content:space-between;align-items:center}#book .hd button{background:none;border:0;color:#fff;font-size:22px}`; document.head.appendChild(st); }
const hudEl = document.createElement('div'); hudEl.id = 'coachHud'; document.body.appendChild(hudEl);
const bookEl = document.createElement('div'); bookEl.id = 'book'; bookEl.innerHTML = '<div class="hd"><b>📋 Playbook</b><span id="bkN"></span><button id="bkX">✕</button></div><input id="bkQ" placeholder="Search plays, formations, concepts…"><div class="chips" id="bkC"></div><div class="list" id="bkL"></div>'; document.body.appendChild(bookEl);
let bkCat = 'All';
function renderBook() { const tm = cruz && cruz.team; const bk = (tm && tm.book) || []; const q = $('bkQ').value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const r = bk.filter((p) => (bkCat === 'All' || p.cat === bkCat) && q.every((w) => (p.name + ' ' + p.cat + ' ' + p.concept + ' ' + p.form).toLowerCase().includes(w)));
  $('bkN').textContent = r.length + ' / ' + bk.length; $('bkL').innerHTML = r.slice(0, 120).map((p) => `<div class="it" data-i="${bk.indexOf(p)}"><b>${p.name}</b><span>${p.cat} · ${p.form} · ${p.concept} · target ${p.tgt}</span></div>`).join('') + (r.length > 120 ? '<div class="it"><span>…refine search to see more</span></div>' : ''); }
function openBook() { const cats = ['All', 'Quick', 'Dropback', 'Deep', 'Play Action', 'Motion']; $('bkC').innerHTML = cats.map((c) => `<button class="${c === bkCat ? 'on' : ''}">${c}</button>`).join(''); [...$('bkC').children].forEach((b) => (b.onclick = () => { bkCat = b.textContent; openBook(); })); bookEl.style.display = 'flex'; renderBook(); }
$('bkQ').oninput = renderBook; $('bkX').onclick = () => (bookEl.style.display = 'none');
$('bkL').onclick = (e) => { const it = e.target.closest('.it[data-i]'); if (!it) return; const tm = cruz && cruz.team; if (!tm) return; tm.runPlay(+it.dataset.i); bookEl.style.display = 'none';
  if (cruz.mode === 'casino' || cruz.mode === 'toCasino') cruz.command('field'); else if (cruz.cmd !== 'roam') cruz.command('roam'); P.x = 0; P.z = 101; P.yaw = Math.PI; setBirds(true, true); };
function coachHudUpd() { if (!BV.coach) return; const tm = cruz && cruz.team; if (!tm || !tm.cur) { hudEl.innerHTML = 'Loading playbook…'; return; } const k = tm.cur.id + (tm.overlay ? 'o' : '') + tm.phase;
  if (hudEl.dataset.k === k) return; hudEl.dataset.k = k; hudEl.innerHTML = `${tm.overlay ? '🎯 ' : '🔁 Free practice: '}${tm.cur.name}<small>${tm.cur.form} · ${tm.cur.concept} · ${tm.cur.cat} · QB ${tm.qbIsCruz ? '#12 Cruz' : '#7 Ross'} · ${tm.phase}</small><button id="hudBook">📋 Playbook</button> <button id="hudExit">Exit</button>`;
  $('hudBook').onclick = openBook; $('hudExit').onclick = () => setBirds(false); }
setInterval(coachHudUpd, 250);
window.__coach = { openBook, setBirds, BV };

/* ---- Third-person "Boss" (Coach/Owner) avatar toggle; first person stays default ---- */
{ const b = document.createElement('button'); b.className = 'hb'; b.id = 'bBoss'; b.type = 'button'; b.textContent = '🎩 Boss'; $('bZoom').after(b);
  const pb = document.createElement('button'); pb.id = 'bBook'; pb.type = 'button'; pb.textContent = '📋 Coach Playbook'; pb.style.cssText = 'position:fixed;right:12px;bottom:calc(120px + env(safe-area-inset-bottom));z-index:25;display:none;background:#f5c542;color:#1a0a2a;border:0;border-radius:14px;padding:12px 16px;font:700 15px system-ui;box-shadow:0 4px 14px #0008'; document.body.appendChild(pb);
  pb.onclick = () => openBook();
  b.onclick = async () => { audioOn(); TP.on = !TP.on; b.textContent = TP.on ? '👁 First person' : '🎩 Boss'; TP.cx = P.x + Math.sin(P.yaw) * 3; TP.cz = P.z + Math.cos(P.yaw) * 3; TP.lx = P.x; TP.lz = P.z;
    if (!TP.on) { pb.style.display = 'none'; if (boss) boss.object.visible = false; return; }
    if (!boss && !bossLoading) { bossLoading = true; try { const L = await loadBoss(THREE); boss = L.make({ hat: true, shades: false }); scene.add(boss.object); } catch (e) { console.warn('boss', e); TP.on = false; b.textContent = '🎩 Boss'; } bossLoading = false; } }; }
window.__tp = TP;

}
