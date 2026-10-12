/* Rocket Crash: the multiplier climbs while the rocket flies; CASH OUT before it explodes. Crash point = 0.97/(1-U) (casino-math.js,
   97% for any cash-out target), auto cash-out, round history. FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
const M = window.CMath;
const K = await boot({ id: 'rocketcrash', title: 'Rocket Crash', accent: '#ff7a1a', bloom: .7, bg: 0x05020e, fog: [40, 90],
  rules: `<p>Place a bet and LAUNCH. The multiplier rises from 1.00×. Tap CASH OUT any time to win bet × multiplier — but if the rocket explodes first, the bet is lost.</p><p>Set AUTO to cash out automatically at a target. About 1 in 33 rounds busts instantly at 1.00×. Every target returns 97% over time.</p>`,
  view: (p) => p ? { pos: [0, 2.5, 13], look: [0, 3.5, 0], fov: 55 } : { pos: [0, 3, 10], look: [0, 3.2, 0], fov: 50 } });
const { THREE, scene } = K;
K.lights({ c1: 0xff7a1a, c2: 0x2bc8ff, key: 20, target: [0, 2, 0] });
/* stars + planet */
const sg = new THREE.BufferGeometry(), sp = []; for (let i = 0; i < 900; i++) sp.push((Math.random() - .5) * 80, Math.random() * 60 - 5, -20 - Math.random() * 30); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: .12, toneMapped: false })); scene.add(stars);
const planet = new THREE.Mesh(new THREE.SphereGeometry(6, 48, 32), K.M.mat(0xffffff, { map: K.tex(512, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9b4dff'); gr.addColorStop(.5, '#ff3fa4'); gr.addColorStop(1, '#ff7a1a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,255,255,${.05 + Math.random() * .1})`; g.fillRect(0, Math.random() * h, w, 4 + Math.random() * 14); } }), roughness: .8 }));
planet.position.set(-9, 12, -26); scene.add(planet);
const ground = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 1, 64), K.M.mat(0x1a0a2a, { roughness: .9 })); ground.position.y = -1.5; scene.add(ground);
const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, .3, 32), K.M.mat(0x2a2a3a, { metalness: .6, roughness: .4 })); pad.position.y = -.9; scene.add(pad);
const padRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, .04, 8, 64), K.neon(0xff7a1a, 2)); padRing.rotation.x = Math.PI / 2; padRing.position.y = -.74; scene.add(padRing);
/* rocket */
const R = new THREE.Group(); scene.add(R);
const body = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, 1.6, 32), K.candy('#2b7bff')); R.add(body);
const nose = new THREE.Mesh(new THREE.ConeGeometry(.32, .7, 32), K.candy('#ff2b4e')); nose.position.y = 1.15; R.add(nose);
const win = new THREE.Mesh(new THREE.SphereGeometry(.14, 24, 16), K.candy('#2bc8ff')); win.position.set(0, .35, .3); R.add(win);
for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.06, .5, .45), K.candy('#ffd21f')); const a = i * Math.PI * 2 / 3; f.position.set(Math.sin(a) * .38, -.6, Math.cos(a) * .38); f.rotation.y = a; R.add(f); }
const flame = new THREE.Mesh(new THREE.ConeGeometry(.24, .9, 20), K.neon(0xff8a1a, 2.6)); flame.rotation.x = Math.PI; flame.position.y = -1.25; R.add(flame);
const flame2 = new THREE.Mesh(new THREE.ConeGeometry(.13, .6, 16), K.neon(0xffe680, 3)); flame2.rotation.x = Math.PI; flame2.position.y = -1.15; R.add(flame2);
R.position.y = 0;
/* trail */
const trailPts = []; const trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, .7, .2), toneMapped: false })); scene.add(trail);
/* hud */
document.body.insertAdjacentHTML('beforeend', `<div id="rcX" style="position:fixed;left:0;right:0;top:22%;text-align:center;font:900 64px system-ui;color:#fff;text-shadow:0 0 18px #ff7a1a,0 0 40px #ff7a1a,0 3px 0 #000;z-index:7;pointer-events:none">1.00×</div>
<div id="rcH" style="position:fixed;left:0;right:0;top:calc(56px + env(safe-area-inset-top));display:flex;gap:4px;justify-content:center;z-index:7;font:800 12px system-ui"></div>`);
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
K.el(`<div class="ck-row"><div class="ck-pill"><small>AUTO CASH-OUT</small><b><select id="rcA" style="background:transparent;color:#fff;border:0;font:900 15px system-ui"><option value="0">off</option><option>1.5</option><option>2</option><option>3</option><option>5</option><option>10</option><option>50</option></select></b></div><div class="ck-pill"><small>WIN NOW</small><b id="rcW">–</b></div></div>`);
K.el(`<div class="ck-row"><button class="ck-go" type="button" id="rcGo">LAUNCH</button></div>`);
let st = 'idle', t = 0, crash = 1, bet = 0, cashed = 0, mult = 1, hist = [];
const X = K.$('rcX'), go = K.$('rcGo');
function launch() { if (!K.take(chip.get())) return; bet = chip.get(); crash = M.crashPoint(); t = 0; mult = 1; cashed = 0; st = 'fly'; trailPts.length = 0; R.visible = true; R.position.set(0, 0, 0); R.rotation.z = 0;
  go.textContent = 'CASH OUT'; X.style.color = '#fff'; K.SFX.whoosh(); if (crash <= 1) boom(); }
function cash() { if (st !== 'fly' || cashed) return; cashed = mult; const ret = Math.floor(bet * mult); K.payout(bet, ret, R.position.clone()); go.textContent = 'CASHED ' + mult.toFixed(2) + '×'; go.disabled = true; X.style.color = '#7dff6a'; }
function boom() { st = 'boom'; X.textContent = 'BUST ' + crash.toFixed(2) + '×'; X.style.color = '#ff2b4e'; K.SFX.boom(); K.shake = .25; R.visible = false; K.burst(R.position.clone(), 50, { coins: false, sound: false, speed: 1.4 });
  if (!cashed) { K.result(bet, 0); K.msg('Crashed at ' + crash.toFixed(2) + '×', 1600); setTimeout(K.checkBroke, 900); }
  hist.unshift(crash); hist.length = Math.min(8, hist.length); K.$('rcH').innerHTML = hist.map(h => `<span style="padding:2px 7px;border-radius:9px;background:${h >= 2 ? '#0a9a52' : h >= 1.2 ? '#ff7a1a' : '#d6102e'};color:#fff">${h.toFixed(2)}×</span>`).join('');
  setTimeout(() => { st = 'idle'; go.textContent = 'LAUNCH'; go.disabled = false; R.visible = true; R.position.set(0, 0, 0); R.rotation.z = 0; trailPts.length = 0; trail.geometry.setFromPoints([]); X.textContent = '1.00×'; X.style.color = '#fff'; }, 2400); }
go.onclick = () => { if (st === 'idle') launch(); else if (st === 'fly') cash(); };
let lastBeep = 1;
K.onFrame((dt, T) => { stars.position.y = -(R.position.y * .6) % 30; flame.scale.y = 1 + Math.sin(T * 40) * .2; flame2.scale.y = 1 + Math.cos(T * 37) * .2; padRing.material.color.setRGB(2, .9 + Math.sin(T * 3) * .3, .2);
  if (st === 'fly') { t += dt; mult = Math.min(crash, Math.floor(M.crashAt(t) * 100) / 100); X.textContent = mult.toFixed(2) + '×'; X.style.transform = `scale(${1 + Math.min(.4, (mult - 1) * .04)})`;
    const h = Math.log(mult) * 6; R.position.set(Math.sin(t * .7) * .6, h, 0); R.rotation.z = -Math.cos(t * .7) * .12; K.camOffset.set(0, Math.min(h, 40) * .85, 0);
    trailPts.push(R.position.clone().add(new THREE.Vector3(0, -1.2, 0))); if (trailPts.length > 200) trailPts.shift(); trail.geometry.setFromPoints(trailPts);
    K.$('rcW').textContent = cashed ? 'cashed' : K.fmt(bet * mult);
    if (mult >= lastBeep + .5 || (mult >= 2 && mult >= lastBeep * 1.25)) { lastBeep = mult; K.tone(400 + mult * 40, .08, 'square', .04); }
    const a = +K.$('rcA').value; if (a && !cashed && mult >= a) cash();
    if (mult >= crash) boom(); }
  else { K.camOffset.y *= .92; lastBeep = 1; } });
window.__game = { launch: () => go.click(), cash };
K.start();
