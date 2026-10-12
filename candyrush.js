/* Candy Rush: 6x5 scatter-pays tumbling slot (casino-math.js crSpin, ~96.5%): 8+ of a candy anywhere pays, winners pop, new candy
   falls in, tumble chains multiply the fun. Glossy 3D candies, cascade combo counter, turbo + autoplay. FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
const M = window.CMath, S = M.CR_SYM;
const K = await boot({ id: 'candyrush', title: 'Candy Rush', accent: '#ff3fa4', bloom: .5, fog: [30, 70],
  rules: `<p>8 or more of the same candy ANYWHERE on the 6×5 grid wins. Winning candy pops, new candy tumbles down, and new wins keep paying until no more form.</p><table><tr><th>Candy</th><th>8-9</th><th>10-11</th><th>12+</th></tr>${S.map(s => `<tr><td style="color:${s.c}">● ${s.k}</td><td>${s.p[0]}×</td><td>${s.p[1]}×</td><td>${s.p[2]}×</td></tr>`).join('')}</table>`,
  view: (p) => p ? { pos: [0, 2.5, 12.5], look: [0, 2.4, 0], fov: 46 } : { pos: [0, 2.6, 8.5], look: [0, 2.5, 0], fov: 44 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#2a0624', pattern: ['#ff3fa4', '#ffd21f', '#7ad400'], y: -1 }); K.setFloor(-1); K.lights({ c1: 0xff3fa4, c2: 0x2bc8ff, key: 18, keyPos: [1, 6, 9], target: [0, 2.5, 0] });
const COLS = 6, ROWS = 5, D = .82, X0 = -(COLS - 1) * D / 2, Y0 = 2.4 + (ROWS - 1) * D / 2;
const panel = K.rbox(COLS * D + .5, ROWS * D + .5, .2, .3, K.felt('#3a0a48')); panel.position.set(0, 2.4, -.4); scene.add(panel);
const frame = K.rbox(COLS * D + .8, ROWS * D + .8, .15, .4, K.candy('#ff3fa4')); frame.position.set(0, 2.4, -.55); scene.add(frame);
const sign = K.label('CANDY RUSH', { size: .75, glow: 1.5, color: '#ffd21f', stroke: '#6a0040' }); sign.position.set(0, 2.4 + ROWS * D / 2 + .85, 0); scene.add(sign);
/* candy geometries */
const geos = [
  (() => { const s = new THREE.Shape(); s.moveTo(0, -.3); s.bezierCurveTo(-.45, .05, -.3, .35, 0, .15); s.bezierCurveTo(.3, .35, .45, .05, 0, -.3); const g = new THREE.ExtrudeGeometry(s, { depth: .14, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 4 }); g.center(); return g; })(), /* heart */
  (() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .14 : .32, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const g = new THREE.ExtrudeGeometry(s, { depth: .12, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 3 }); g.center(); return g; })(), /* star */
  new THREE.CylinderGeometry(.18, .3, .4, 24), /* gumdrop */
  new THREE.TorusGeometry(.22, .1, 16, 32), /* swirl */
  new THREE.SphereGeometry(.28, 24, 16), /* drop */
  new THREE.CapsuleGeometry(.14, .26, 8, 16), /* bean */
  new THREE.CylinderGeometry(.28, .28, .14, 32), /* mint */
  new THREE.OctahedronGeometry(.3) /* drop2 gem */ ];
geos[2].translate(0, 0, 0); const mats = S.map(s => K.candy(s.c));
const cells = []; /* cells[c][r] = mesh */
const pos = (c, r) => new THREE.Vector3(X0 + c * D, Y0 - r * D, 0);
function mk(k) { const m = new THREE.Mesh(geos[k], mats[k]); m.castShadow = true; m.userData.k = k; if (k === 2 || k === 6) m.rotation.x = Math.PI / 2 * (k === 6 ? 1 : 0); if (k === 5) m.rotation.z = .6; m.userData.spin = Math.random() * 6; scene.add(m); return m; }
function setGrid(g, fromAbove) { cells.forEach(col => col.forEach(m => m && scene.remove(m))); cells.length = 0;
  for (let c = 0; c < COLS; c++) { cells.push([]); for (let r = 0; r < ROWS; r++) { const m = mk(g[c][r]); const p = pos(c, r); m.position.copy(p); if (fromAbove) m.position.y += 6 + r * .1; m.userData.to = p; m.userData.delay = fromAbove ? c * .06 + (ROWS - r) * .03 : 0; cells[c].push(m); } } }
K.onFrame((dt, t) => { cells.forEach(col => col.forEach(m => { if (!m) return; const u = m.userData; if (u.delay > 0) { u.delay -= dt; return; } if (u.pop) { m.scale.multiplyScalar(1 + dt * 4); if (m.scale.x > 1.6) { scene.remove(m); u.dead = true; } return; }
    const dy = u.to.y - m.position.y; if (dy < -.01) { u.vy = (u.vy || 0) - 30 * dt; m.position.y = Math.max(u.to.y, m.position.y + u.vy * dt); if (m.position.y === u.to.y) { u.vy = 0; u.bounce = .12; } } m.position.x = u.to.x;
    if (u.bounce) { u.bounce *= .85; m.scale.set(1 + u.bounce, 1 - u.bounce, 1); if (u.bounce < .005) { u.bounce = 0; m.scale.set(1, 1, 1); } }
    m.rotation.y = Math.sin(t * 1.5 + u.spin) * .35 + (u.win ? t * 6 : 0); })); sign.position.y = 2.4 + ROWS * D / 2 + .85 + Math.sin(t * 2) * .05; });
setGrid(M.crGrid(), false);
/* hud */
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
K.el(`<div class="ck-row"><div class="ck-pill"><small>TUMBLE</small><b id="crT">–</b></div><div class="ck-pill"><small>WIN</small><b id="crW">0</b></div><button class="ck-sm" type="button" id="crTurbo">⚡</button><button class="ck-sm" type="button" id="crAuto">AUTO 10</button><button class="ck-go" type="button" id="crGo">SPIN</button></div>`);
let busy = false, turbo = false, auto = 0; const sleep = ms => new Promise(r => setTimeout(r, turbo ? ms * .45 : ms));
K.$('crTurbo').onclick = () => { turbo = !turbo; K.$('crTurbo').classList.toggle('on', turbo); };
K.$('crAuto').onclick = () => { if (auto) { auto = 0; K.$('crAuto').textContent = 'AUTO 10'; return; } auto = 10; K.$('crAuto').textContent = 'STOP'; if (!busy) spin(); };
async function spin() { if (busy) return; const bet = chip.get(); if (!K.take(bet)) { auto = 0; K.$('crAuto').textContent = 'AUTO 10'; return; } busy = true; K.$('crGo').disabled = true; K.$('crW').textContent = '0'; K.$('crT').textContent = '–';
  const res = M.crSpin(); K.SFX.whoosh(); setGrid(res.steps[0].grid, true); await sleep(900); let won = 0;
  for (let i = 0; i < res.steps.length; i++) { const st = res.steps[i]; if (!st.wins.length) break;
    if (i > 0) { /* tumble: rebuild from this step's grid, candies above the holes fall */ setGrid(st.grid, false); }
    st.wins.forEach(w => w.cells.forEach(([c, r]) => cells[c][r].userData.win = true)); K.tone(660 + i * 120, .2, 'triangle', .12); await sleep(650);
    st.wins.forEach((w, j) => w.cells.forEach(([c, r]) => { cells[c][r].userData.pop = true; })); st.wins.forEach((w, j) => K.SFX.pop(i + j + 2));
    won += st.wins.reduce((s, w) => s + w.pay, 0) * bet; K.$('crW').textContent = K.fmt(won); K.$('crT').textContent = '×' + (i + 1); if (i >= 1) K.msg('TUMBLE ×' + (i + 1) + '!', 900);
    K.burst(new THREE.Vector3(0, 2.4, .6), 14, { coins: false, sound: false }); await sleep(500);
    const nx = res.steps[i + 1]; if (nx) { /* drop new grid in: holes filled from above */ const old = cells.map(col => col.map(m => m)); setGrid(nx.grid, false);
      for (let c = 0; c < COLS; c++) { const holes = st.wins.reduce((n, w) => n + w.cells.filter(x => x[0] === c).length, 0); for (let r = 0; r < ROWS; r++) { const m = cells[c][r]; if (r < holes) m.position.y += holes * D + 2; else m.position.y += holes * D; } } K.SFX.roll(); await sleep(700); } }
  const ret = Math.round(won); K.payout(bet, ret, new THREE.Vector3(0, 2.4, 1)); if (ret >= bet * 20) K.msg('SUGAR RUSH! +' + K.fmt(ret - bet), 2600, true);
  busy = false; K.$('crGo').disabled = false; if (auto > 0) { auto--; if (!auto) K.$('crAuto').textContent = 'AUTO 10'; setTimeout(spin, turbo ? 350 : 800); } }
K.$('crGo').onclick = spin;
window.__game = { spin };
K.start();
