/* Rocket Crash: the multiplier climbs while the rocket flies; CASH OUT before it explodes. Crash point = 0.97/(1-U) (casino-math.js,
   97% for any cash-out target), auto cash-out, round history. FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
const M = window.CMath;
const K = await boot({ id: 'rocketcrash', title: 'Rocket Crash', accent: '#9a5a18', bloom: .7, bg: 0x05020e, fog: [40, 90],
  rules: `<p>Place a bet and LAUNCH. The multiplier rises from 1.00×. Tap CASH OUT any time to win bet × multiplier — but if the rocket explodes first, the bet is lost.</p><p>Set AUTO to cash out automatically at a target. About 1 in 33 rounds busts instantly at 1.00×. Every target returns 97% over time.</p>`,
  view: (p) => p ? { pos: [0, 2.5, 13], look: [0, 3.5, 0], fov: 55 } : { pos: [0, 3, 10], look: [0, 3.2, 0], fov: 50 } });
const { THREE, scene } = K;
K.lights({ c1: 0xffa860, c2: 0x4a6a9a, key: 16, target: [0, 2, 0] });
/* stars + planet */
const sg = new THREE.BufferGeometry(), sp = []; for (let i = 0; i < 900; i++) sp.push((Math.random() - .5) * 80, Math.random() * 60 - 5, -20 - Math.random() * 30); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
{ const sc = []; for (let i = 0; i < 900; i++) { const t = Math.random(); sc.push(.75 + t * .25, .78 + t * .2, .85 + (1 - t) * .15); } sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); }
const stars = new THREE.Points(sg, new THREE.PointsMaterial({ vertexColors: true, size: .07, transparent: true, opacity: .85 })); scene.add(stars);
const planet = new THREE.Mesh(new THREE.SphereGeometry(6, 48, 32), K.M.mat(0xffffff, { map: K.tex(512, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1830'); gr.addColorStop(.5, '#4a1a24'); gr.addColorStop(1, '#5a3a18'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,255,255,${.05 + Math.random() * .1})`; g.fillRect(0, Math.random() * h, w, 4 + Math.random() * 14); } }), roughness: .8 }));
planet.position.set(-9, 12, -26); scene.add(planet);
const atmo = new THREE.Mesh(new THREE.SphereGeometry(6.35, 48, 32), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }', fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float r = pow(1. - abs(dot(vN, vV)), 3.); gl_FragColor = vec4(vec3(.85,.55,.35) * r * .55, 1.); }' })); atmo.position.copy(planet.position); scene.add(atmo);
const ground = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 1, 64), K.M.mat(0x15141a, { roughness: .92 })); ground.position.y = -1.5; scene.add(ground);
const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, .3, 32), K.M.mat(0x3a3a40, { metalness: .7, roughness: .45 })); pad.position.y = -.9; scene.add(pad);
const padRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, .04, 8, 64), K.neon(0xc98a3a, 1.2)); padRing.rotation.x = Math.PI / 2; padRing.position.y = -.74; scene.add(padRing);
/* rocket */
const R = new THREE.Group(); scene.add(R);
const body = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, 1.6, 32), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: .35, roughness: .38, clearcoat: .5, clearcoatRoughness: .3, map: K.tex(512, 512, (g, w, h) => { g.fillStyle = '#d8d6d2'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,36,34,.35)'; g.lineWidth = 2; for (let y = 64; y < h; y += 96) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.fillStyle = '#16151a'; g.fillRect(0, h * .78, w, h * .1); g.fillStyle = '#7a1420'; g.fillRect(0, h * .2, w, 10); g.fillStyle = '#2a2622'; g.font = '600 46px Georgia,serif'; g.textAlign = 'center'; g.save(); g.translate(w * .75, h * .5); g.rotate(-Math.PI / 2); g.fillText('A P E X', 0, 0); g.restore(); }) })); R.add(body);
const nose = new THREE.Mesh(new THREE.ConeGeometry(.32, .7, 32), new THREE.MeshPhysicalMaterial({ color: 0x1a191c, metalness: .6, roughness: .3, clearcoat: .6 })); nose.position.y = 1.15; R.add(nose);
const win = new THREE.Mesh(new THREE.SphereGeometry(.14, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x0a1218, metalness: .2, roughness: .05, clearcoat: 1 })); win.position.set(0, .35, .3); R.add(win);
for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.06, .5, .45), new THREE.MeshPhysicalMaterial({ color: 0x2a282c, metalness: .8, roughness: .35 })); const a = i * Math.PI * 2 / 3; f.position.set(Math.sin(a) * .38, -.6, Math.cos(a) * .38); f.rotation.y = a; R.add(f); }
const flame = new THREE.Mesh(new THREE.ConeGeometry(.24, .9, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .55, .12), transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); flame.rotation.x = Math.PI; flame.position.y = -1.25; R.add(flame);
const flame2 = new THREE.Mesh(new THREE.ConeGeometry(.13, .6, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.9, 1.5), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); flame2.rotation.x = Math.PI; flame2.position.y = -1.15; R.add(flame2);
R.position.y = 0;
/* trail */
const trailPts = []; const trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, .7, .2), toneMapped: false })); scene.add(trail);
/* hud */
document.body.insertAdjacentHTML('beforeend', `<div id="rcX" style="position:fixed;left:0;right:0;top:22%;text-align:center;font:500 64px Georgia;color:#fff;text-shadow:0 0 18px #9a5a18,0 0 40px #9a5a18,0 3px 0 #000;z-index:7;pointer-events:none">1.00×</div>
<div id="rcH" style="position:fixed;left:0;right:0;top:calc(56px + env(safe-area-inset-top));display:flex;gap:4px;justify-content:center;z-index:7;font:800 12px system-ui"></div>`);
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
K.el(`<div class="ck-row"><div class="ck-pill"><small>AUTO CASH-OUT</small><b><select id="rcA" style="background:transparent;color:#fff;border:0;font:500 15px Georgia"><option value="0">off</option><option>1.5</option><option>2</option><option>3</option><option>5</option><option>10</option><option>50</option></select></b></div><div class="ck-pill"><small>WIN NOW</small><b id="rcW">–</b></div></div>`);
K.el(`<div class="ck-row"><button class="ck-go" type="button" id="rcGo">LAUNCH</button></div>`);
let st = 'idle', t = 0, crash = 1, bet = 0, cashed = 0, mult = 1, hist = [];
const X = K.$('rcX'), go = K.$('rcGo');
function launch() { if (!K.take(chip.get())) return; bet = chip.get(); crash = M.crashPoint(); t = 0; mult = 1; cashed = 0; st = 'fly'; trailPts.length = 0; R.visible = true; R.position.set(0, 0, 0); R.rotation.z = 0;
  go.textContent = 'CASH OUT'; X.style.color = '#fff'; K.SFX.whoosh(); if (crash <= 1) boom(); }
function cash() { if (st !== 'fly' || cashed) return; cashed = mult; const ret = Math.floor(bet * mult); K.payout(bet, ret, R.position.clone()); go.textContent = 'CASHED ' + mult.toFixed(2) + '×'; go.disabled = true; X.style.color = '#7dff6a'; }
function boom() { st = 'boom'; X.textContent = 'BUST ' + crash.toFixed(2) + '×'; X.style.color = '#8e1b2c'; K.SFX.boom(); K.shake = .25; R.visible = false; K.burst(R.position.clone(), 50, { coins: false, sound: false, speed: 1.4 });
  if (!cashed) { K.result(bet, 0); K.msg('Crashed at ' + crash.toFixed(2) + '×', 1600); setTimeout(K.checkBroke, 900); }
  hist.unshift(crash); hist.length = Math.min(8, hist.length); K.$('rcH').innerHTML = hist.map(h => `<span style="padding:2px 7px;border-radius:9px;background:${h >= 2 ? '#0f5a3e' : h >= 1.2 ? '#9a5a18' : '#8e1b2c'};color:#fff">${h.toFixed(2)}×</span>`).join('');
  setTimeout(() => { st = 'idle'; go.textContent = 'LAUNCH'; go.disabled = false; R.visible = true; R.position.set(0, 0, 0); R.rotation.z = 0; trailPts.length = 0; trail.geometry.setFromPoints([]); X.textContent = '1.00×'; X.style.color = '#fff'; }, 2400); }
go.onclick = () => { if (st === 'idle') launch(); else if (st === 'fly') cash(); };
let lastBeep = 1;
K.onFrame((dt, T) => { stars.position.y = -(R.position.y * .6) % 30; flame.scale.y = 1 + Math.sin(T * 40) * .2; flame2.scale.y = 1 + Math.cos(T * 37) * .2; padRing.material.color.setRGB(1.1, .65 + Math.sin(T * 3) * .08, .25);
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
