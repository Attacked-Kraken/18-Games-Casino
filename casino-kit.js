/* ck1 2026-10-11 (owner: "10 new UE5-style casino games, candy colors, never faded"): shared 3D + HUD kit for the new games.
   Same look rules as Gilded Reels: ACES tone mapping, SRGB canvas textures with anisotropy, dark rich backdrop so colors pop,
   bloom threshold 1.0 so only neon (toneMapped:false, color > 1) glows and game pieces never wash out, pixel ratio <= 2,
   adaptive quality, WebGL fallback. FUN CHIPS ONLY (chips.js). Each game: import { boot } from './casino-kit.js'. */
import * as THREE from './three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { EffectComposer } from './vendor/EffectComposer.js';
import { RenderPass } from './vendor/RenderPass.js';
import { UnrealBloomPass } from './vendor/UnrealBloomPass.js';
import { OutputPass } from './vendor/OutputPass.js';
export { THREE };
const $ = (id) => document.getElementById(id);
export const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const CANDY = { red: '#7a1424', pink: '#6a1a3e', orange: '#8a4a18', yellow: '#9a6a18', lime: '#3e5a1e', green: '#0f5a3e', teal: '#0f4a4a', blue: '#1d3f7a', sky: '#1b4a6a', purple: '#4a1f5e', violet: '#5a1f6a' }; /* lux jewel tones */

const CSS = `
:root{--ac:#8e1b2c;--gold:#c9a45c;--gold2:#e8d3a0;--fg:#efe6d6;--mut:#a89c8a;--serif:'Didot','Bodoni 72','Playfair Display','Cormorant Garamond',Georgia,'Times New Roman',serif;--sans:'Helvetica Neue',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color-scheme:dark}
html,body{margin:0;height:100%;overflow:hidden;background:#070505;color:var(--fg);font-family:var(--sans);font-weight:400;-webkit-user-select:none;user-select:none;touch-action:none}
#c{position:fixed;inset:0;width:100%;height:100%;display:block}
#ckVig{position:fixed;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(0,0,0,.55) 100%)}
.ck-top{position:fixed;top:0;left:0;right:0;display:flex;gap:6px;align-items:center;padding:calc(8px + env(safe-area-inset-top)) calc(8px + env(safe-area-inset-right)) 8px calc(8px + env(safe-area-inset-left));z-index:10;pointer-events:none;background:linear-gradient(rgba(5,4,4,.75),transparent)}
.ck-top>*{pointer-events:auto}
.ck-b{font:500 11px var(--sans);letter-spacing:.14em;text-transform:uppercase;height:34px;padding:0 11px;border-radius:2px;border:1px solid rgba(201,164,92,.55);background:rgba(10,8,8,.7);color:var(--gold2);cursor:pointer;white-space:nowrap}
.ck-title{font:400 19px var(--serif);letter-spacing:.08em;color:var(--gold2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none}
.ck-chips{background:rgba(10,8,8,.7);border:1px solid rgba(201,164,92,.55);border-radius:2px;padding:3px 10px;text-align:right;line-height:1.1}
.ck-chips small{display:block;font:500 8.5px var(--sans);letter-spacing:.2em;color:var(--mut)}.ck-chips b{font:400 17px var(--serif);color:var(--gold2)}
.ck-hud{position:fixed;left:0;right:0;bottom:0;padding:10px calc(10px + env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) calc(10px + env(safe-area-inset-left));display:grid;gap:7px;z-index:9;background:linear-gradient(transparent,rgba(6,5,5,.92) 30%);pointer-events:none}
.ck-hud>*{pointer-events:auto}
.ck-row{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap}
.ck-go{font:500 15px var(--sans);letter-spacing:.32em;text-transform:uppercase;min-width:150px;height:48px;padding:0 22px;border:1px solid #e8d3a0;border-radius:2px;color:#1a1208;cursor:pointer;background:linear-gradient(#e2c587,#b08d57 55%,#8a6a3a);box-shadow:0 6px 18px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.4)}
.ck-go:disabled{filter:saturate(.3) brightness(.55)}
.ck-sm{font:500 11.5px var(--sans);letter-spacing:.14em;text-transform:uppercase;height:38px;min-width:40px;padding:0 11px;border:1px solid rgba(201,164,92,.45);border-radius:2px;cursor:pointer;color:var(--fg);background:linear-gradient(color-mix(in srgb,var(--ac) 70%,#1a1010),color-mix(in srgb,var(--ac) 45%,#050303));box-shadow:0 3px 10px rgba(0,0,0,.5)}
.ck-sm.on{border-color:var(--gold2);box-shadow:0 0 0 1px var(--gold2),0 3px 10px rgba(0,0,0,.5);color:#fff}.ck-sm:disabled{filter:saturate(.3) brightness(.55)}
.ck-pill{background:rgba(10,8,8,.72);border:1px solid rgba(201,164,92,.3);border-radius:2px;padding:3px 10px;text-align:center;min-width:64px;line-height:1.15}
.ck-pill small{display:block;font:500 8.5px var(--sans);letter-spacing:.2em;color:var(--mut)}.ck-pill b{font:400 16px var(--serif);color:var(--fg);white-space:nowrap}
.ck-pill select{font:400 15px var(--serif)!important}
.ck-chip{--cc:#7a1424;width:44px;height:44px;border-radius:50%;border:0;padding:0;cursor:pointer;font:600 11px var(--serif);color:#2a1f12;position:relative;
  background:radial-gradient(circle,#efe6d2 0 38%,var(--cc) 39% 41%,#d9cdb5 42% 46%,transparent 47%),repeating-conic-gradient(from 8deg,var(--cc) 0 30deg,#efe6d2 30deg 45deg),var(--cc);
  box-shadow:0 3px 6px rgba(0,0,0,.65),inset 0 0 0 1px rgba(0,0,0,.35),inset 0 -2px 3px rgba(0,0,0,.35)}
.ck-chip.on{transform:translateY(-5px);box-shadow:0 0 0 1px var(--gold2),0 8px 14px rgba(0,0,0,.7)}
.ck-note{font:400 10px var(--sans);letter-spacing:.06em;color:var(--mut);text-align:center;opacity:.8}
#ckMsg{position:fixed;top:calc(70px + env(safe-area-inset-top));left:0;right:0;text-align:center;font:400 28px var(--serif);letter-spacing:.08em;color:var(--gold2);text-shadow:0 2px 12px rgba(0,0,0,.9);opacity:0;transform:translateY(-6px);transition:opacity .35s,transform .35s;pointer-events:none;z-index:11;padding:0 10px}
#ckMsg.on{opacity:1;transform:none}#ckMsg.big{font-size:36px;color:#f0d79a}
.ck-sheet{position:fixed;inset:0;background:rgba(4,3,3,.86);display:none;align-items:center;justify-content:center;padding:14px;z-index:30}
.ck-sheet.on{display:flex}
.ck-box{background:#100c0b;border:1px solid rgba(201,164,92,.55);border-radius:2px;padding:20px;max-width:420px;width:100%;max-height:86vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.8)}
.ck-box h2{margin:0 0 10px;color:var(--gold2);font:400 23px var(--serif);letter-spacing:.04em}.ck-box h3{margin:12px 0 4px;color:var(--fg);font:400 16px var(--serif)}
.ck-box p,.ck-box li{color:var(--mut);font-size:13px;line-height:1.5}
.ck-box table{width:100%;border-collapse:collapse;font-size:13px}.ck-box td,.ck-box th{padding:5px;border-top:1px solid rgba(201,164,92,.18);text-align:center}.ck-box th{color:var(--gold);font-weight:500;letter-spacing:.1em;font-size:11px;text-transform:uppercase}
.ck-ok{width:100%;height:44px;margin-top:10px;border:1px solid #e8d3a0;border-radius:2px;font:500 13px var(--sans);letter-spacing:.24em;text-transform:uppercase;cursor:pointer;background:linear-gradient(#e2c587,#b08d57 55%,#8a6a3a);color:#1a1208}
.ck-in{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:10px;border-radius:2px;border:1px solid rgba(201,164,92,.55);background:#070505;color:var(--fg);text-align:center}
.ck-feed{position:fixed;left:8px;top:calc(56px + env(safe-area-inset-top));width:168px;background:rgba(10,8,8,.8);border:1px solid rgba(201,164,92,.4);border-radius:2px;padding:6px 8px;font:400 11px var(--sans);z-index:8}
.ck-feed .h{color:var(--gold2)}.ck-feed div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--mut)}.ck-feed div.w{color:#c9e2b0}
.hide{display:none!important}
#ckLoad{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#070505;color:var(--gold2);font:400 26px var(--serif);letter-spacing:.3em;transition:opacity .6s;z-index:40;pointer-events:none}
#ckFb{position:fixed;inset:0;display:none;align-items:center;justify-content:center;text-align:center;padding:24px;z-index:50;background:#070505}
@media (max-width:430px){.ck-title{visibility:hidden}}
@media (orientation:landscape) and (max-height:500px){.ck-go{height:42px;min-width:110px}.ck-chip{width:38px;height:38px}.ck-sm{height:34px}#ckMsg{font-size:22px;top:50px}#ckMsg.big{font-size:28px}.ck-hud{gap:4px;padding-top:4px}}
`;

/* ---------- sound (WebAudio synthesis, shared mute) ---------- */
let AC = null, master = null, muted = false;
try { muted = localStorage.getItem('gc18_mute') === '1'; } catch (e) {}
function ac() { if (!AC && window.GAudio) { const c = GAudio.ctx(); if (c) { AC = c; master = GAudio.sfxBus; return AC; } } if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = muted ? 0 : .5; master.connect(AC.destination); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
export function tone(f, d, type = 'sine', v = .2, t0 = 0, slide = 0) { const a = ac(); if (!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0008, t + d); o.connect(g).connect(master); o.start(t); o.stop(t + d + .05); }
export function noise(d, v = .2, f = 1200, t0 = 0) { const a = ac(); if (!a) return; const b = a.createBuffer(1, Math.max(1, a.sampleRate * d | 0), a.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length); const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  fl.type = 'bandpass'; fl.frequency.value = f; g.gain.value = v; s.buffer = b; s.connect(fl).connect(g).connect(master); s.start(a.currentTime + t0); }
export const SFX = {
  click() { tone(900, .05, 'square', .05); }, chip() { noise(.05, .3, 2500); tone(2200, .05, 'sine', .05); },
  tick() { noise(.025, .14, 3200); }, thud() { tone(90, .18, 'sine', .35); noise(.06, .25, 700); },
  card() { noise(.09, .25, 4200); }, roll() { for (let i = 0; i < 6; i++) noise(.04, .2, 1500 + i * 200, i * .07); },
  win(big) { const n = big ? [523, 659, 784, 1047, 1319, 1568, 2093] : [659, 784, 1047]; n.forEach((f, i) => { tone(f, .35, 'triangle', .14, i * .08); tone(f * 2, .2, 'sine', .05, i * .08); }); },
  lose() { tone(300, .3, 'triangle', .08, 0, .6); }, coin() { tone(1800 + Math.random() * 900, .12, 'square', .035); tone(2600 + Math.random() * 600, .1, 'sine', .035, .03); },
  whoosh() { noise(.5, .25, 600); }, boom() { noise(.6, .6, 300); tone(70, .5, 'sine', .4, 0, .5); },
  pop(i = 0) { tone(500 + i * 90, .09, 'sine', .14, 0, 2.2); }, tease() { tone(300, 1.2, 'sawtooth', .05, 0, 2.2); }
};

/* ---------- boot ---------- */
export async function boot(o) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  document.documentElement.style.setProperty('--ac', (() => { const c = new THREE.Color(o.accent || '#8e1b2c'), h = {}; c.getHSL(h, THREE.SRGBColorSpace); return new THREE.Color().setHSL(h.h, Math.min(.7, h.s * .85), .27, THREE.SRGBColorSpace).getStyle(); })());
  const body = document.body;
  body.insertAdjacentHTML('afterbegin', `<canvas id="c"></canvas><div id="ckVig"></div><div id="ckLoad">${esc(o.title.toUpperCase())}</div><div id="ckMsg"></div>
<div class="ck-top"><button class="ck-b" id="ckBack" type="button">‹ Lobby</button><div class="ck-title">${esc(o.title)}</div>
<button class="ck-b hide" id="ckTable" type="button">Table</button><button class="ck-b" id="ckRules" type="button">Rules</button><button class="ck-b" id="ckMute" type="button">🔊</button>
<div class="ck-chips"><small>FUN CHIPS</small><b id="ckBal">0</b></div></div>
<div class="ck-hud"><div id="ckCtrl" style="display:grid;gap:6px"></div><div class="ck-note">${esc(Chips.NOTE)} · chips can’t be bought or cashed out · 18+</div></div>
<div class="ck-sheet" id="ckRulesS"><div class="ck-box"><h2>${esc(o.title)} · rules &amp; paytable</h2><div id="ckRulesB"></div>
<p>All results come from a fair random draw on this phone (crypto RNG). Fun chips have no cash value; there is nothing to buy. If you run out, collect a free daily top-up of ${fmt(Chips.TOPUP)}.</p><button class="ck-ok" type="button" data-x>Close</button></div></div>
<div class="ck-sheet" id="ckBroke"><div class="ck-box"><h2>Out of chips</h2><p id="ckBrokeP"></p><button class="ck-ok" type="button" id="ckBrokeGo">Collect</button></div></div>
<div id="ckFb"><div><h2 style="color:var(--gold)">${esc(o.title)} needs 3D graphics</h2><p>This phone or browser has 3D (WebGL) turned off. Try a newer browser.</p><a href="./" style="color:var(--gold)">‹ Back to the casino</a></div></div>`);
  const K = { THREE, SFX, tone, noise, fmt, esc, $, o };
  $('ckBack').onclick = () => { if (o.onBack && o.onBack() === true) return; location.href = './'; };
  $('ckRulesB').innerHTML = o.rules || '';
  $('ckRules').onclick = () => $('ckRulesS').classList.add('on');
  document.querySelectorAll('[data-x]').forEach(b => b.onclick = () => b.closest('.ck-sheet').classList.remove('on'));
  const setMute = () => { $('ckMute').textContent = muted ? 'Muted' : 'Sound'; if (master) master.gain.value = muted ? 0 : .5; };
  if (window.GAudio) { GAudio.bindButton($('ckMute')); GAudio.music(o.id); } else { $('ckMute').onclick = () => { muted = !muted; try { localStorage.setItem('gc18_mute', muted ? '1' : '0'); } catch (e) {} setMute(); }; setMute(); }
  K.say = (t, f) => window.GAudio && GAudio.say(t, f); K.fx = (n) => window.GAudio && GAudio.sfx(n);
  addEventListener('pointerdown', () => ac(), { once: true });
  K.ctrl = $('ckCtrl');
  /* chips */
  let shown = Chips.bal();
  K.bal = () => Chips.bal();
  K.take = (n) => { if (Chips.take(n)) { SFX.chip(); return true; } K.msg('Not enough chips', 1200); K.checkBroke(); return false; };
  K.give = (n) => Chips.give(n);
  K.checkBroke = () => { if (!Chips.broke()) return false; const can = Chips.topupReady();
    $('ckBrokeP').textContent = can ? `Here’s your free daily top-up of ${fmt(Chips.TOPUP)} fun chips.` : `You’ve had today’s free top-up. Come back tomorrow for ${fmt(Chips.TOPUP)} more fun chips.`;
    $('ckBrokeGo').textContent = can ? 'Collect ' + fmt(Chips.TOPUP) : 'OK';
    $('ckBrokeGo').onclick = () => { if (can && Chips.topup()) SFX.win(false); $('ckBroke').classList.remove('on'); };
    $('ckBroke').classList.add('on'); return true; };
  K.record = (outcome, mode = 'cpu') => { try { ArcadeRecord.add(o.id, mode, outcome); } catch (e) {} };
  K.result = (staked, returned, mode) => K.record(returned > staked ? 'w' : returned === staked && staked > 0 ? 'd' : 'l', mode);
  K.msg = (t, ms = 1800, big = false) => { const m = $('ckMsg'); m.textContent = t; m.classList.toggle('big', !!big); m.classList.add('on'); clearTimeout(K.msg.t); K.msg.t = setTimeout(() => m.classList.remove('on'), ms); };
  /* chip denomination picker */
  K.chipPicker = (vals = [10, 25, 100, 500, 1000], el) => { const cols = ['#1d3f7a', '#0f5a3e', '#141414', '#4a1f5e', '#9a6a18', '#7a1424']; let cur = 0; const row = document.createElement('div'); row.className = 'ck-row';
    vals.forEach((v, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ck-chip' + (i === 0 ? ' on' : ''); b.style.setProperty('--cc', cols[i % cols.length]); b.style.color = '#2a1f12'; b.textContent = v >= 1000 ? v / 1000 + 'K' : v;
      b.onclick = () => { cur = i; row.querySelectorAll('.ck-chip').forEach((x, j) => x.classList.toggle('on', j === i)); SFX.chip(); }; row.appendChild(b); });
    (el || K.ctrl).appendChild(row); return { get: () => vals[cur], el: row, colorOf: (v) => cols[Math.max(0, vals.indexOf(v)) % cols.length] }; };
  K.el = (html, parent) => { const d = document.createElement('div'); d.innerHTML = html.trim(); const e = d.firstChild; (parent || K.ctrl).appendChild(e); return e; };

  /* ---------- renderer ---------- */
  const canvas = $('c'); let R;
  try { R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); if (!R.getContext()) throw 0; }
  catch (e) { $('ckFb').style.display = 'flex'; $('ckLoad').style.display = 'none'; document.querySelector('.ck-hud').style.display = 'none'; window.__ck = { nogl: true }; await new Promise(() => {}); }
  let pr = Math.min(devicePixelRatio || 1, 2); R.setPixelRatio(pr);
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = o.exposure || .95; R.outputColorSpace = THREE.SRGBColorSpace;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); const bg = new THREE.Color(o.bg ?? 0x07030c); scene.background = bg; scene.fog = new THREE.Fog(bg, o.fog?.[0] ?? 12, o.fog?.[1] ?? 34);
  const pmrem = new THREE.PMREMGenerator(R); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = o.envI ?? .5;
  const cam = new THREE.PerspectiveCamera(40, 1, .05, 120);
  Object.assign(K, { R, scene, cam, canvas });
  K.tex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy()); t.userData.canvas = c; return t; };
  /* materials: candy plastics are clearcoated and saturated, never near-white, so they stay below the bloom threshold */
  const mat = (c, p = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c }, p));
  K.candy = (c, p = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: c, roughness: .28, metalness: 0, clearcoat: 1, clearcoatRoughness: .12 }, p));
  K.neon = (c, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });
  K.M = { gold: mat(0xd9a43a, { metalness: 1, roughness: .26 }), chrome: mat(0xd8dde6, { metalness: 1, roughness: .14 }), black: mat(0x0d0a12, { roughness: .45, metalness: .3 }),
    wood: mat(0x3a120c, { roughness: .35, metalness: .1 }), glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transmission: 0, transparent: true, opacity: .08, depthWrite: false }), mat };
  K.felt = (hex, draw) => { const t = K.tex(1024, 1024, (g, w, h) => { const rg = g.createRadialGradient(w / 2, h / 2, w * .05, w / 2, h / 2, w * .75); rg.addColorStop(0, hex); rg.addColorStop(1, new THREE.Color(hex).multiplyScalar(.45).getStyle());
      g.fillStyle = rg; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},.035)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } if (draw) draw(g, w, h); });
    return mat(0xffffff, { map: t, roughness: .92, metalness: 0 }); };
  K.label = (text, o2 = {}) => { const h = o2.h || 128, f = o2.font || `900 ${h * .62}px system-ui,sans-serif`; const mc = document.createElement('canvas').getContext('2d'); mc.font = f; const w = Math.ceil(mc.measureText(text).width + h * .5);
    const t = K.tex(w, h, (g) => { g.font = f; g.textAlign = 'center'; g.textBaseline = 'middle'; if (o2.bg) { g.fillStyle = o2.bg; g.beginPath(); g.roundRect(0, 0, w, h, h * .25); g.fill(); }
      g.lineWidth = h * .1; g.strokeStyle = o2.stroke || '#12041a'; g.lineJoin = 'round'; g.strokeText(text, w / 2, h * .54); g.fillStyle = o2.color || '#fff'; g.fillText(text, w / 2, h * .54); });
    const s = o2.size || .3; const m = new THREE.Mesh(new THREE.PlaneGeometry(s * w / h, s), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: o2.glow ? false : true, color: o2.glow ? new THREE.Color(1, 1, 1).multiplyScalar(o2.glow) : 0xffffff }));
    m.renderOrder = 3; return m; };
  K.rbox = (w, h, d, r, m) => { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: Math.min(.03, r * .5), bevelThickness: Math.min(.03, r * .5), bevelSegments: 3, curveSegments: 8 }); g.translate(0, 0, -d / 2); { const P = g.attributes.position, U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setXY(i, (P.getX(i) + w / 2) / w, (P.getY(i) + h / 2) / h); }
    const me = new THREE.Mesh(g, m); me.castShadow = me.receiveShadow = true; return me; };

  /* ---------- casino backdrop: patterned carpet, distant glowing machines, bokeh ---------- */
  K.backdrop = (bo = {}) => { const g = new THREE.Group(); scene.add(g);
    const carpet = K.tex(512, 512, (c, w, h) => { c.fillStyle = bo.carpet || '#3a0718'; c.fillRect(0, 0, w, h); const cols = bo.pattern || ['#ffb400', '#ff2b6b', '#2b7bff'];
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.save(); c.translate(x * 64 + 32, y * 64 + 32); c.rotate(Math.PI / 4); c.strokeStyle = cols[(x + y) % cols.length]; c.globalAlpha = .55; c.lineWidth = 5; c.strokeRect(-16, -16, 32, 32); c.fillStyle = cols[(x * 3 + y) % cols.length]; c.fillRect(-5, -5, 10, 10); c.restore(); } });
    carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(14, 14);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat(0xffffff, { map: carpet, roughness: .95 })); fl.rotation.x = -Math.PI / 2; fl.position.y = bo.y ?? 0; fl.receiveShadow = true; g.add(fl);
    const far = mat(0x1a0716, { roughness: .5, metalness: .4 }); const hues = [0xff2b6b, 0x2bc8ff, 0xffd21f, 0x9b4dff, 0x7ad400, 0xff7a1a];
    for (let i = 0; i < (bo.machines ?? 22); i++) { const a = (i / (bo.machines ?? 22)) * Math.PI * 1.2 + Math.PI * .9, rr = 13 + (i % 3) * 3, x = Math.cos(a) * rr, z = Math.sin(a) * rr - 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 1), far); m.position.set(x, (bo.y ?? 0) + 1.4, z); m.lookAt(0, 1.4, 0); g.add(m);
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .8), K.neon(hues[i % hues.length], 1.3)); sc.position.set(0, .5, .51); m.add(sc);
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, .12, 1.02), K.neon(hues[(i + 2) % hues.length], 2.2)); top.position.y = 1.45; m.add(top); }
    const bG = new THREE.SphereGeometry(.08, 8, 6); for (let i = 0; i < 60; i++) { const b = new THREE.Mesh(bG, K.neon(i % 3 ? 0xffc477 : hues[i % hues.length], 2)); b.position.set((Math.random() - .5) * 40, 7 + Math.random() * 3, -4 - Math.random() * 22); g.add(b); }
    return g; };
  K.lights = (lo = {}) => { scene.add(new THREE.HemisphereLight(0xffe2c0, 0x200414, lo.hemi ?? .45));
    const key = new THREE.SpotLight(0xfff2de, lo.key ?? 40, 30, .6, .55, 1.5); key.position.set(...(lo.keyPos || [2.5, 9, 5])); key.target.position.set(...(lo.target || [0, 0, 0])); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0004; key.shadow.normalBias = .02; scene.add(key, key.target);
    const a = new THREE.PointLight(lo.c1 ?? 0xff2b6b, lo.rim ?? 10, 14, 1.6); a.position.set(-5, 4, -2); const b = new THREE.PointLight(lo.c2 ?? 0x2bc8ff, lo.rim ?? 10, 14, 1.6); b.position.set(5, 4, -2); scene.add(a, b);
    const win = new THREE.PointLight(0xffd070, 0, 10, 1.4); win.position.set(0, 4, 2); scene.add(win); K.winLight = win; return { key, a, b, win }; };

  /* ========== LUX restyle (owner: "real adult luxury-casino look, Vegas/Macau high-limit rooms"): overrides the earlier candy
     helpers so every game picks up realistic PBR materials, jewel tones, warm cinematic light and engraved serif type. ========== */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const repTex = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  /* procedural normal map from a height painter (woven felt, leather pores, wood grain, brushed metal) */
  K.normalTex = (w, h, paint, strength = 2) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); paint(g, w, h);
    const src = g.getImageData(0, 0, w, h).data, out = g.createImageData(w, h), H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x - 1, y) - H(x + 1, y)) * strength, dy = (H(x, y - 1) - H(x, y + 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      out.data[i] = (dx / l * .5 + .5) * 255; out.data[i + 1] = (dy / l * .5 + .5) * 255; out.data[i + 2] = (1 / l * .5 + .5) * 255; out.data[i + 3] = 255; }
    g.putImageData(out, 0, 0); const t = new THREE.CanvasTexture(c); t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy()); return t; };
  const weaveN = K.normalTex(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { const v = ((x + y) / 4) % 2 ? 150 : 105; g.fillStyle = `rgb(${v + rnd(-14, 14)},0,0)`; g.fillRect(x, y, 4, 4); } }, 1.6);
  const leatherN = K.normalTex(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},.25)`; g.beginPath(); g.arc(rnd(0, w), rnd(0, h), rnd(.6, 2.2), 0, 7); g.fill(); } }, 2.5);
  const brushedN = K.normalTex(256, 256, (g, w, h) => { for (let y = 0; y < h; y++) { const v = 128 + rnd(-30, 30); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, w, 1); } }, 1.2);
  const woodTex = K.tex(1024, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3b1409'); gr.addColorStop(.5, '#4e1d0e'); gr.addColorStop(1, '#2e0f07'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${Math.random() < .5 ? '20,6,2' : '120,55,25'},${rnd(.08, .3)})`; g.lineWidth = rnd(.5, 2.5); g.beginPath(); let y = rnd(0, h); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) { y += rnd(-1.5, 1.5) + Math.sin(x / 90 + i) * .6; g.lineTo(x, y); } g.stroke(); } });
  const woodN = K.normalTex(512, 128, (g, w, h) => { g.drawImage(woodTex.userData.canvas, 0, 0, w, h); }, 1.4);
  const marbleTex = K.tex(512, 512, (g, w, h) => { g.fillStyle = '#0d0b0c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(230,220,205,${rnd(.08, .45)})`; g.lineWidth = rnd(.4, 2.2); g.beginPath(); let x = rnd(0, w), y = 0; g.moveTo(x, y); while (y < h) { x += rnd(-18, 18); y += rnd(6, 22); g.lineTo(x, y); } g.stroke(); } });
  const mat2 = (c, p = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c }, p));
  K.M.gold = mat2(0xc49a52, { metalness: 1, roughness: .32, normalMap: brushedN, normalScale: new THREE.Vector2(.25, .25) });
  K.M.chrome = mat2(0xb9b4ac, { metalness: 1, roughness: .22 });
  K.M.black = new THREE.MeshPhysicalMaterial({ color: 0x0b0a0c, roughness: .35, metalness: .2, clearcoat: 1 });
  K.M.wood = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: repTex(woodTex.clone(), 1, 1), normalMap: woodN, normalScale: new THREE.Vector2(.35, .35), roughness: .38, clearcoat: .8, clearcoatRoughness: .18 });
  K.M.wood.map.needsUpdate = true;
  K.M.leather = mat2(0x1a0d0a, { roughness: .58, normalMap: repTex(leatherN, 6, 6), normalScale: new THREE.Vector2(.6, .6) });
  K.M.marble = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: marbleTex, roughness: .18, clearcoat: 1, clearcoatRoughness: .05 });
  K.M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, metalness: 0, transparent: true, opacity: .14, depthWrite: false, clearcoat: 1 });
  /* jewel-tone mapping: any requested colour keeps its hue but becomes a deep, rich, solid jewel tone */
  K.jewel = (c) => { const col = new THREE.Color(c), hsl = {}; col.getHSL(hsl, THREE.SRGBColorSpace); return new THREE.Color().setHSL(hsl.h, Math.min(.85, hsl.s * .9), Math.min(.36, Math.max(.12, hsl.l * .62)), THREE.SRGBColorSpace); };
  K.candy = (c, p = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: K.jewel(c), roughness: .3, metalness: .05, clearcoat: 1, clearcoatRoughness: .08 }, p));
  K.neon = (c, k = 2.2) => { const col = new THREE.Color(c).lerp(new THREE.Color(0xffc27a), .6).multiplyScalar(Math.min(1.25, k * .55)); return new THREE.MeshBasicMaterial({ color: col, toneMapped: false }); };
  /* real woven felt: flat jewel colour, fine weave normal map, soft lamp falloff, printed layout lines */
  K.felt = (hex, draw) => { const jb = K.jewel(hex), hb = {}; jb.getHSL(hb, THREE.SRGBColorSpace); const base = new THREE.Color().setHSL(hb.h, Math.min(.65, hb.s), Math.min(.15, hb.l), THREE.SRGBColorSpace).getStyle(); const t = K.tex(1024, 1024, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
      const rg = g.createRadialGradient(w / 2, h / 2, w * .1, w / 2, h / 2, w * .75); rg.addColorStop(0, 'rgba(255,240,210,.06)'); rg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = rg; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 14000; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},.03)`; g.fillRect(rnd(0, w), rnd(0, h), 1.5, 1.5); }
      if (draw) { const fs = g.fillText.bind(g); g.save(); draw(g, w, h); g.restore(); } });
    return mat2(0xffffff, { map: t, roughness: .95, metalness: 0, normalMap: repTex(weaveN.clone(), 10, 10), normalScale: new THREE.Vector2(.45, .45), envMapIntensity: .25 }); };
  /* realistic casino chip: clay body colour, edge spots, printed inlay ring and denomination */
  const chipCache = {};
  K.chip3d = (color, r = .16, h = .045, val = '') => { const key = color + '|' + val; const c = new THREE.Color(K.jewel(color)).getStyle();
    const mats = chipCache[key] || (chipCache[key] = (() => { const top = K.tex(256, 256, (g, w) => { g.fillStyle = c; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill(); g.fillStyle = '#ece3cf'; for (let i = 0; i < 8; i++) { g.save(); g.translate(128, 128); g.rotate(i * Math.PI / 4); g.fillRect(-12, -128, 24, 30); g.restore(); }
        g.strokeStyle = '#ece3cf'; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 84, 0, 7); g.stroke(); g.fillStyle = '#efe6d2'; g.beginPath(); g.arc(128, 128, 74, 0, 7); g.fill(); g.setLineDash([4, 5]); g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 66, 0, 7); g.stroke();
        g.fillStyle = '#2a1f12'; g.font = '600 44px ' + K.SERIF; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(val || '', 128, 132); g.font = '500 11px Helvetica,Arial'; g.fillText('APEX · 18 GAMES', 128, 96);
        for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(Math.random() * w, Math.random() * w, 2, 2); } });
      const side = K.tex(256, 16, (g, w, hh) => { g.fillStyle = c; g.fillRect(0, 0, w, hh); g.fillStyle = '#ece3cf'; for (let i = 0; i < 8; i++) g.fillRect(i * 32 + 4, 0, 14, hh); });
      const m = (t) => new THREE.MeshPhysicalMaterial({ map: t, roughness: .5, clearcoat: .3, clearcoatRoughness: .5 }); return [m(side), m(top), m(top)]; })());
    const me = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), mats); me.castShadow = true; me.receiveShadow = true; return me; };
  K.SERIF = "'Didot','Bodoni 72','Playfair Display','Cormorant Garamond',Georgia,'Times New Roman',serif";
  K.label = (text, o2 = {}) => { const h = o2.h || 128, f = o2.font || `600 ${h * .6}px ${K.SERIF}`; const mc = document.createElement('canvas').getContext('2d'); mc.font = f; const w = Math.ceil(mc.measureText(text).width + h * .7);
    const t = K.tex(w, h, (g) => { g.font = f; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (o2.bg) { g.fillStyle = 'rgba(8,6,6,.88)'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b08d57'; g.lineWidth = h * .035; g.strokeRect(h * .06, h * .06, w - h * .12, h - h * .12); }
      g.fillStyle = o2.glow ? '#f2d9a0' : (o2.color && !/^#(fff|ffffff)$/i.test(o2.color) ? K.jewelText(o2.color) : '#efe2c6'); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = h * .05; g.fillText(text, w / 2, h * .54); });
    const s = o2.size || .3; const m = new THREE.Mesh(new THREE.PlaneGeometry(s * w / h, s), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: true, color: o2.glow ? 0xffffff : 0xf0f0f0 }));
    m.renderOrder = 3; return m; };
  K.jewelText = (c) => { const col = new THREE.Color(c), hsl = {}; col.getHSL(hsl, THREE.SRGBColorSpace); return new THREE.Color().setHSL(hsl.h, Math.min(.7, hsl.s), Math.max(.55, Math.min(.72, hsl.l)), THREE.SRGBColorSpace).getStyle(); };
  /* high-limit room: patterned wool carpet (low contrast damask), dark walnut walls with brass sconces, distant warm lamps */
  K.backdrop = (bo = {}) => { const g = new THREE.Group(); scene.add(g); const y0 = bo.y ?? 0;
    const carpet = K.tex(512, 512, (c, w, h) => { c.fillStyle = '#2a0a0e'; c.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(0,0,0,${rnd(.02, .08)})`; c.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
      c.strokeStyle = 'rgba(176,141,87,.22)'; c.lineWidth = 2; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.save(); c.translate(x * 128 + 64, y * 128 + 64); for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.beginPath(); c.ellipse(0, 26, 8, 24, 0, 0, 7); c.stroke(); } c.beginPath(); c.arc(0, 0, 6, 0, 7); c.stroke(); c.restore(); } });
    repTex(carpet, 18, 18);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat2(0xffffff, { map: carpet, roughness: .97, normalMap: repTex(weaveN.clone(), 160, 160), normalScale: new THREE.Vector2(.5, .5) })); fl.rotation.x = -Math.PI / 2; fl.position.y = y0; fl.receiveShadow = true; g.add(fl);
    const wallT = K.tex(512, 512, (c, w, h) => { c.drawImage(woodTex.userData.canvas, 0, 0, w, h / 2); c.drawImage(woodTex.userData.canvas, 0, h / 2, w, h / 2); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(176,141,87,.5)'; c.lineWidth = 3; for (let x = 0; x < w; x += 128) { c.strokeRect(x + 10, 20, 108, h - 40); } });
    repTex(wallT, 10, 1); const wall = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 9, 64, 1, true, Math.PI * .55, Math.PI * .9), mat2(0xffffff, { map: wallT, roughness: .5, side: THREE.BackSide })); wall.position.set(0, y0 + 4.5, 0); g.add(wall);
    for (let i = 0; i < 14; i++) { const a = Math.PI * .6 + i / 13 * Math.PI * .8, x = Math.sin(a) * 21.6, z = Math.cos(a) * 21.6; const sc = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, .5, 16, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, .95, .55), toneMapped: false, side: THREE.DoubleSide }));
      sc.position.set(x, y0 + 3.4, z); g.add(sc); }
    const bG = new THREE.SphereGeometry(.06, 8, 6), bM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, .85, .5), toneMapped: false }); for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(bG, bM); b.position.set(rnd(-20, 20), y0 + 7 + rnd(0, 2), rnd(-6, -24)); g.add(b); }
    return g; };
  /* cinematic light: warm hard key spot making a pool on the table, soft warm fill, amber rims (no coloured club lights) */
  K.lights = (lo = {}) => { scene.add(new THREE.HemisphereLight(0xffe0b8, 0x0c0606, (lo.hemi ?? .4) * .55));
    const key = new THREE.SpotLight(0xffe2b8, (lo.key ?? 30) * .8, 30, .55, .75, 1.4); key.position.set(...(lo.keyPos || [1.5, 9, 4.5])); key.target.position.set(...(lo.target || [0, 0, 0])); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 4; scene.add(key, key.target);
    const warm = (c) => new THREE.Color(c ?? 0xffb070).lerp(new THREE.Color(0xffb070), .75);
    const a = new THREE.PointLight(warm(lo.c1), (lo.rim ?? 10) * .7, 14, 1.6); a.position.set(-5, 4, -2); const b = new THREE.PointLight(warm(lo.c2), (lo.rim ?? 10) * .7, 14, 1.6); b.position.set(5, 4, -2); scene.add(a, b);
    const win = new THREE.PointLight(0xffd59a, 0, 10, 1.4); win.position.set(0, 4, 2); scene.add(win); K.winLight = win; return { key, a, b, win }; };

  /* ---------- particles: instanced coins + candy confetti + glow sparks ---------- */
  const COINS = 80, coinG = new THREE.CylinderGeometry(.07, .07, .014, 20); coinG.rotateX(Math.PI / 2);
  const coinI = new THREE.InstancedMesh(coinG, K.M.gold, COINS); coinI.frustumCulled = false; scene.add(coinI);
  const CONF = 140, confI = new THREE.InstancedMesh(new THREE.PlaneGeometry(.06, .1), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), CONF); confI.frustumCulled = false; scene.add(confI);
  const ccols = ['#c9a45c', '#e8d3a0', '#8e6a2e', '#f2e6c8', '#7a1424', '#0f5a3e'].map(c => new THREE.Color(c));
  const parts = []; const dm = new THREE.Object3D(); const hidden = new THREE.Vector3(0, -50, 0);
  for (let i = 0; i < COINS + CONF; i++) parts.push({ live: false, coin: i < COINS, i: i < COINS ? i : i - COINS, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 });
  for (let i = 0; i < CONF; i++) confI.setColorAt(i, ccols[i % ccols.length]);
  let floorY = 0; K.setFloor = (y) => floorY = y;
  K.burst = (at, n = 30, o3 = {}) => { const src = at || new THREE.Vector3(0, 1, 0); let made = 0;
    for (const q of parts) { if (made >= n) break; if (q.live || (o3.coins === false && q.coin) || (o3.confetti === false && !q.coin)) continue; q.live = true; q.life = 0; made++;
      q.p.copy(src).add(new THREE.Vector3((Math.random() - .5) * .4, 0, (Math.random() - .5) * .4)); const sp = o3.speed || 1;
      q.v.set((Math.random() - .5) * 4 * sp, (2.5 + Math.random() * 3.5) * sp, (Math.random() - .2) * 3 * sp); q.w.set(Math.random() * 12, Math.random() * 12, Math.random() * 8); }
    if (o3.sound !== false) for (let i = 0; i < Math.min(8, n / 6); i++) setTimeout(SFX.coin, i * 60); };
  function stepParts(dt) { for (const q of parts) { const I = q.coin ? coinI : confI; if (!q.live) { dm.position.copy(hidden); dm.updateMatrix(); I.setMatrixAt(q.i, dm.matrix); continue; }
      q.life += dt; q.v.y -= (q.coin ? 9.8 : 3.2) * dt; if (!q.coin) q.v.multiplyScalar(.985); q.p.addScaledVector(q.v, dt); q.r.x += q.w.x * dt; q.r.y += q.w.y * dt; q.r.z += q.w.z * dt;
      if (q.p.y < floorY + .02) { q.p.y = floorY + .02; q.v.y *= -.3; q.v.x *= .6; q.v.z *= .6; }
      if (q.life > (q.coin ? 2.4 : 3.2)) q.live = false; dm.position.copy(q.p); dm.rotation.copy(q.r); dm.updateMatrix(); I.setMatrixAt(q.i, dm.matrix); }
    coinI.instanceMatrix.needsUpdate = true; confI.instanceMatrix.needsUpdate = true; }

  /* ---------- post ---------- */
  let composer = null, useBloom = true;
  try { composer = new EffectComposer(R); composer.addPass(new RenderPass(scene, cam)); const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), Math.min(.35, (o.bloom ?? .55) * .5), .4, 1.0); composer.addPass(bloom); composer.addPass(new OutputPass()); K.bloom = bloom; }
  catch (e) { composer = null; useBloom = false; }
  /* ---------- layout: game gives view(portrait, aspect) -> { pos:[x,y,z], look:[x,y,z], fov } ---------- */
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); K.shake = 0; K.camOffset = new THREE.Vector3();
  K.portrait = innerHeight > innerWidth;
  function resize() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; K.portrait = h > w;
    const v = (o.view || (() => ({ pos: [0, 5, 8], look: [0, 0, 0], fov: 45 })))(K.portrait, w / h); cam.fov = v.fov; cam.updateProjectionMatrix(); camPos.set(...v.pos); camLook.set(...v.look);
    if (composer) { composer.setPixelRatio(pr); composer.setSize(w, h); } (K.onResize || []).forEach(f => f()); }
  K.onResize = []; K.relayout = resize; addEventListener('resize', resize);
  /* ---------- adaptive quality ---------- */
  let qLvl = 0, fAcc = 0, fN = 0;
  function degrade() { qLvl++; if (qLvl === 1) pr = Math.min(pr, 1.5); else if (qLvl === 2) useBloom = false; else if (qLvl === 3) { pr = 1; R.shadowMap.enabled = false; scene.traverse(x => { if (x.material) x.material.needsUpdate = true; }); } R.setPixelRatio(pr); resize(); }
  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  K.pick = (e, objs) => { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, cam); return ray.intersectObjects(objs, true); };
  /* ---------- loop ---------- */
  const frames = []; K.onFrame = (f) => frames.push(f);
  let last = performance.now(); K.t = 0;
  function frame(now) { requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; K.t += dt; if (document.hidden) return;
    for (const f of frames) { try { f(dt, K.t); } catch (e) { console.error(e); } }
    stepParts(dt); if (K.winLight) K.winLight.intensity *= .95;
    K.shake *= .9; cam.position.copy(camPos).add(K.camOffset); cam.position.x += Math.sin(K.t * .23) * .06 + (Math.random() - .5) * K.shake; cam.position.y += Math.sin(K.t * .31) * .03 + (Math.random() - .5) * K.shake; cam.lookAt(camLook.x + K.camOffset.x * (K.camLookFollow || 0), camLook.y + K.camOffset.y * (K.camLookFollow || 0), camLook.z + K.camOffset.z * (K.camLookFollow || 0));
    shown += (Chips.bal() - shown) * Math.min(1, dt * 6); if (Math.abs(Chips.bal() - shown) < 1) shown = Chips.bal(); $('ckBal').textContent = fmt(shown);
    if (composer && useBloom) composer.render(); else R.render(scene, cam);
    if (K.t > 2.5 && qLvl < 3) { fAcc += dt; fN++; if (fN >= 90) { if (fAcc / fN > 1 / 38) degrade(); fAcc = 0; fN = 0; } } }
  K.start = () => { resize(); requestAnimationFrame(frame); setTimeout(() => { $('ckLoad').style.opacity = 0; }, 200); if (Chips.broke()) K.checkBroke(); };
  K.quality = () => qLvl;
  window.__ck = K;

  /* ---------- live table panel (mp.js room codes) ---------- */
  K.table = (to) => { if (!window.MP || !MP.available()) return null; $('ckTable').classList.remove('hide');
    body.insertAdjacentHTML('beforeend', `<div class="ck-sheet" id="ckTab"><div class="ck-box"><h2>Live table</h2><p>${esc(to.blurb || 'Play together with up to 6 friends on the same table.')}</p>
<input class="ck-in" id="ckName" maxlength="16" placeholder="Your name"><div id="ckIn"><button class="ck-ok" type="button" id="ckCreate">Open a table</button>
<div style="display:flex;gap:8px;margin-top:10px"><input class="ck-in" id="ckCode" maxlength="6" placeholder="CODE" style="flex:1;min-width:0;letter-spacing:.25em;text-transform:uppercase;font-weight:900" autocomplete="off"><button class="ck-ok" type="button" id="ckJoin" style="width:auto;margin:0;padding:0 16px">Join</button></div></div>
<div id="ckOn" class="hide"><div style="font:900 40px system-ui;letter-spacing:.25em;color:var(--gold);text-align:center" id="ckBig"></div><button class="ck-ok" type="button" id="ckShare">Share invite</button><button class="ck-ok" type="button" id="ckLeave" style="background:#3a1a2a;color:var(--gold)">Leave table</button></div>
<p id="ckErr" style="color:#ff9aa8;text-align:center"></p><button class="ck-ok" type="button" data-x style="background:transparent;color:var(--mut)">Close</button></div></div>
<div class="ck-feed hide" id="ckFeed"><div class="h"><b id="ckFC"></b> <span id="ckFN"></span></div><div id="ckFL"></div></div>`);
    $('ckTab').querySelector('[data-x]').onclick = () => $('ckTab').classList.remove('on');
    let name = ''; try { name = localStorage.getItem('gc18_name') || ''; } catch (e) {} $('ckName').value = name;
    const nm = () => { const n = $('ckName').value.trim().slice(0, 16) || 'Player'; try { localStorage.setItem('gc18_name', n); } catch (e) {} return n; };
    const T = { room: null };
    const up = (r) => { T.room = r; $('ckIn').classList.add('hide'); $('ckOn').classList.remove('hide'); $('ckBig').textContent = r.code; $('ckErr').textContent = ''; $('ckFeed').classList.remove('hide'); $('ckFC').textContent = 'TABLE ' + r.code;
      const pc = () => $('ckFN').textContent = '· ' + r.players.filter(p => p.on).length + '/' + (to.max || 6); r.on('players', pc); pc();
      r.on('status', s => { if (s === 'reconnecting') K.msg('Reconnecting…', 1500); }); r.on('closed', why => { down(); if (why) K.msg(why, 3000); });
      history.replaceState(null, '', '?room=' + r.code); to.onRoom && to.onRoom(r); };
    const down = () => { if (T.room) { const r = T.room; T.room = null; try { r.leave(); } catch (e) {} } $('ckIn').classList.remove('hide'); $('ckOn').classList.add('hide'); $('ckFeed').classList.add('hide'); history.replaceState(null, '', location.pathname); to.onLeave && to.onLeave(); };
    T.leave = down; T.feed = (lines) => { $('ckFL').innerHTML = lines.slice(0, 5).map(l => `<div class="${l.w ? 'w' : ''}">${esc(l.t)}</div>`).join(''); };
    $('ckTable').onclick = () => $('ckTab').classList.add('on');
    $('ckCreate').onclick = async () => { $('ckErr').textContent = 'Opening…'; try { up(await MP.create({ game: to.game, name: nm(), max: to.max || 6 })); } catch (e) { $('ckErr').textContent = e.message || 'Couldn’t open a table.'; } };
    $('ckJoin').onclick = async () => { $('ckErr').textContent = 'Joining…'; try { up(await MP.join($('ckCode').value, { game: to.game, name: nm(), max: to.max || 6 })); $('ckTab').classList.remove('on'); } catch (e) { $('ckErr').textContent = e.message || 'Couldn’t join.'; } };
    $('ckShare').onclick = async () => { if (T.room && await MP.share(T.room, 'Play ' + o.title + ' with me') === 'copied') K.msg('Invite copied', 1400); };
    $('ckLeave').onclick = () => { down(); $('ckTab').classList.remove('on'); };
    const rc = MP.codeFromUrl(); if (rc) { $('ckCode').value = rc; $('ckTab').classList.add('on'); }
    return T; };

  /* ---------- shared-result table: everyone bets locally, the HOST rolls one result for all (roulette, craps, big wheel) ----------
     st.phase 'bet' (until st.ends) -> 'go' with st.res and st.round. Each phone settles its own bets from st.res. */
  K.sharedRounds = (so) => { const S = { room: null, isLive: () => !!S.room, bets: {} , feed: [] };
    const engine = (r) => { let st = r.state && r.state.round != null ? r.state : { phase: 'bet', ends: Date.now() + so.betMs, round: 0, res: null, feed: [] };
      const push = () => r.setState(JSON.parse(JSON.stringify(st)));
      r.on('msg', (t, d, k) => { const p = r.players.find(x => x.key === k); if (!p) return;
        if (t === 'bet') { st.feed.unshift({ t: p.name + ' bet ' + fmt(+d.amt || 0) }); st.feed.length = Math.min(8, st.feed.length); push(); }
        if (t === 'won') { st.feed.unshift({ t: p.name + ' won +' + fmt(+d.amt || 0), w: 1 }); st.feed.length = Math.min(8, st.feed.length); push(); }
        if (t === 'go' && st.phase === 'bet') { st.ends = Math.min(st.ends, Date.now() + 1500); push(); } });
      clearInterval(S.iv); S.iv = setInterval(() => { if (!S.room || !r.isHost) { clearInterval(S.iv); return; } const now = Date.now();
        if (st.phase === 'bet' && now >= st.ends) { st.phase = 'go'; st.res = so.roll(st); st.round++; st.ends = now + so.goMs; push(); }
        else if (st.phase === 'go' && now >= st.ends) { st.phase = 'bet'; st.ends = now + so.betMs; push(); } }, 250);
      push(); };
    let lastRound = -1;
    S.attach = (r) => { S.room = r; lastRound = r.state && r.state.round != null ? r.state.round : -1;
      r.on('state', st => { if (!st || st.round == null) return; S.feed = st.feed || []; T && T.feed(S.feed);
        if (st.phase === 'go' && st.round !== lastRound) { lastRound = st.round; so.onResult(st.res, true); }
        so.onPhase && so.onPhase(st); });
      r.on('host', () => engine(r)); if (r.isHost) engine(r); };
    S.detach = () => { clearInterval(S.iv); S.room = null; so.onPhase && so.onPhase(null); };
    S.say = (t, d) => { if (S.room) S.room.send(t, d); };
    S.go = () => { if (S.room) S.room.send('go', {}); else so.onResult(so.roll({}), false); };
    const T = K.table({ game: so.game, blurb: so.blurb, onRoom: S.attach, onLeave: S.detach }); S.T = T;
    setInterval(() => { if (!S.room || !S.room.state) return; const st = S.room.state; so.onTick && so.onTick(st, Math.max(0, Math.ceil((st.ends - Date.now()) / 1000))); }, 250);
    return S; };
  /* ---------- juice: streaks, daily bonus, win celebrations (shared by every game) ---------- */
  body.insertAdjacentHTML('beforeend', `<div id="ckStreak" style="position:fixed;right:8px;top:calc(56px + env(safe-area-inset-top));z-index:8;font:400 14px var(--serif);letter-spacing:.06em;color:var(--gold2);background:rgba(10,8,8,.75);border:1px solid rgba(201,164,92,.45);border-radius:2px;padding:4px 10px;display:none"></div>
<div class="ck-sheet" id="ckDaily"><div class="ck-box" style="text-align:center"><h2>Daily gift</h2><p id="ckDailyP"></p><div style="font:400 46px var(--serif);color:var(--gold2)" id="ckDailyN"></div><button class="ck-ok" type="button" id="ckDailyGo">Collect</button></div></div>`);
  let streak = 0; const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const showStreak = () => { const e = $('ckStreak'); if (streak >= 2) { e.style.display = 'block'; e.textContent = 'Streak · ' + streak; } else e.style.display = 'none'; };
  K.daily = () => { let st = {}; try { st = JSON.parse(localStorage.getItem('gc18_daily') || '{}'); } catch (e) {} if (st.d === today()) return;
    const y = new Date(Date.now() - 864e5), yd = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate(); const run = st.d === yd ? Math.min(7, (st.run || 0) + 1) : 1, amt = 250 * run;
    $('ckDailyP').textContent = 'Day ' + run + ' in a row · come back tomorrow for more (up to 7 days).'; $('ckDailyN').textContent = '+' + fmt(amt);
    $('ckDailyGo').onclick = () => { Chips.give(amt); try { localStorage.setItem('gc18_daily', JSON.stringify({ d: today(), run })); } catch (e) {} $('ckDaily').classList.remove('on'); SFX.win(true); K.burst(new THREE.Vector3(0, 1.5, 0), 40); };
    setTimeout(() => $('ckDaily').classList.add('on'), 900); };
  /* call after each settled round: staked, returned (incl. stake), where (Vector3) */
  K.payout = (staked, returned, where, mode) => { K.result(staked, returned, mode); const net = returned - staked; if (window.GAudio) { if (net >= staked * 10 && staked) { GAudio.sfx('bigwin'); GAudio.say('Big winner!'); } else if (net > 0) GAudio.sfx('win'); else if (net < 0) GAudio.sfx('lose'); }
    if (returned > 0) K.give(returned);
    if (net > 0) { streak++; const big = returned >= staked * 5; K.msg((big ? 'BIG WIN ' : 'WIN ') + '+' + fmt(net) + (streak >= 3 ? '  ·  streak ' + streak : ''), big ? 2600 : 1800, big);
      SFX.win(big); K.burst(where, big ? 70 : 24); if (K.winLight) K.winLight.intensity = big ? 60 : 30; K.shake = big ? .08 : .02; }
    else if (net === 0 && staked > 0) { K.msg('Push · bet returned', 1400); }
    else { streak = 0; SFX.lose(); K.msg(returned > 0 ? 'Returned ' + fmt(returned) + ' · net −' + fmt(-net) : 'No win · −' + fmt(staked), 1600); setTimeout(K.checkBroke, 900); }
    K.session(staked, returned); showStreak(); return net; };
  K.streak = () => streak;
  K.session = (staked, returned) => { if (window.Wallet) Wallet.session(o.id, staked, returned); };
  if (window.Wallet) Wallet.session(o.id);
  setTimeout(() => { if (!Chips.broke()) K.daily(); }, 1500);
  return K;
}
