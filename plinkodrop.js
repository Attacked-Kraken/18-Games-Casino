/* Plinko Drop: 12-row pegboard, fair 50/50 bounces (casino-math.js), three risk tables, many balls at once, auto-drop. FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
const M = window.CMath;
const K = await boot({ id: 'plinkodrop', title: 'Plinko Drop', accent: '#7a1a4a', bloom: .6, fog: [30, 70],
  rules: `<p>Pick a risk, DROP a ball. It bounces left or right at every peg (50/50) and lands in a slot that multiplies your bet.</p>${['low', 'mid', 'high'].map(r => `<h3>${r.toUpperCase()}</h3><p>${M.PLINKO[r].join(' · ')}×</p>`).join('')}<p>Every risk level returns about 97–99% over time.</p>`,
  view: (p) => p ? { pos: [0, 3.6, 17.5], look: [0, 3.4, 0], fov: 46 } : { pos: [0, 3.4, 9.5], look: [0, 3.2, 0], fov: 46 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#20061c', pattern: ['#7a1a4a', '#1f5f6e', '#c9a45c'], y: -1 }); K.setFloor(-1); K.lights({ c1: 0xff3fa4, c2: 0x2bc8ff, key: 22, keyPos: [2, 8, 9], target: [0, 3, 0] });
const ROWS = 12, GAP = .5, TOP = 6.6;
const back = K.rbox(ROWS * GAP + 1.6, 7.6, .2, .3, K.M.leather); back.position.set(0, 3.0, -.25); scene.add(back);
[-1, 1].forEach(sx => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 7.4, 8), K.neon(sx < 0 ? 0xff3fa4 : 0x2bc8ff, 2)); t.position.set(sx * (ROWS * GAP / 2 + .75), 3, -.05); scene.add(t); });
const sign = K.label('PLINKO DROP', { size: .7, glow: 1.6, color: '#c9a45c', stroke: '#5a0030' }); sign.position.set(0, 7.35, 0); scene.add(sign);
const pegG = new THREE.SphereGeometry(.07, 16, 12), pegM = K.M.chrome; const pegs = [];
for (let r = 0; r < ROWS; r++) for (let i = 0; i <= r + 2; i++) { if (r === 0 && false) continue; const p = new THREE.Mesh(pegG, pegM); p.position.set((i - (r + 2) / 2) * GAP, TOP - r * GAP, 0); scene.add(p); pegs.push(p); }
/* bins */
const BINS = ROWS + 1; let risk = 'mid'; const bins = [];
const binCols = ['#8e1b2c', '#9a5a18', '#c9a45c', '#3e6b1e', '#0f5a3e', '#1f5f6e', '#1d3f7a', '#1f5f6e', '#0f5a3e', '#3e6b1e', '#c9a45c', '#9a5a18', '#8e1b2c'];
function buildBins() { bins.forEach(b => scene.remove(b)); bins.length = 0;
  M.PLINKO[risk].forEach((m, i) => { const g = new THREE.Group(); const x = (i - ROWS / 2) * GAP; g.position.set(x, TOP - ROWS * GAP - .05, 0);
    const box = K.rbox(GAP * .94, .5, .3, .04, K.candy(binCols[i])); g.add(box);
    const l = K.label(String(m), { size: .34, h: 96, font: `500 64px ${K.SERIF}` }); if (l.geometry.parameters.width > GAP * .9) l.scale.x = GAP * .9 / l.geometry.parameters.width; l.position.z = .2; g.add(l); scene.add(g); bins.push(g); }); }
buildBins();
/* balls */
const ballG = new THREE.SphereGeometry(.11, 24, 16); const balls = [];
function drop(bet) { const path = M.plinkoPath(ROWS), bin = path.reduce((a, b) => a + b, 0);
  const m = new THREE.Mesh(ballG, (balls.length % 2 ? K.M.gold : K.M.chrome)); m.castShadow = true; scene.add(m);
  /* waypoints: start above, then each peg row offset */
  const pts = [new THREE.Vector3((Math.random() - .5) * .1, TOP + .6, .12)]; let pos = 0;
  for (let r = 0; r < ROWS; r++) { pos += path[r]; pts.push(new THREE.Vector3((pos - (r + 1) / 2) * GAP, TOP - r * GAP - GAP * .55, .12)); }
  pts.push(new THREE.Vector3((bin - ROWS / 2) * GAP, TOP - ROWS * GAP + .1, .12));
  balls.push({ m, pts, seg: 0, t: 0, bet, bin, risk }); K.SFX.pop(0); }
K.onFrame((dt) => { for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i]; b.t += dt * 6.5;
    while (b.t >= 1 && b.seg < b.pts.length - 2) { b.t -= 1; b.seg++; K.SFX.tick(); const p = b.pts[b.seg]; pegs.forEach(q => { if (q.position.distanceToSquared(p) < .2) q.scale.setScalar(1.6); }); }
    const a = b.pts[b.seg], c = b.pts[b.seg + 1], k = Math.min(1, b.t); b.m.position.lerpVectors(a, c, k); b.m.position.y += Math.sin(k * Math.PI) * .18 * (b.seg ? 1 : 0); b.m.rotation.z -= dt * 8;
    if (b.seg >= b.pts.length - 2 && b.t >= 1) { scene.remove(b.m); balls.splice(i, 1); land(b); } }
  pegs.forEach(q => q.scale.setScalar(Math.max(1, q.scale.x - dt * 4))); bins.forEach(g => g.position.y += ((TOP - ROWS * GAP - .05) - g.position.y) * Math.min(1, dt * 10)); });
function land(b) { const mult = M.PLINKO[b.risk][b.bin], ret = Math.round(b.bet * mult); bins[b.bin].position.y -= .15;
  if (ret > b.bet) { const where = bins[b.bin].position.clone().add(new THREE.Vector3(0, .4, .3)); K.payout(b.bet, ret, where); }
  else { K.result(b.bet, ret); if (ret) K.give(ret); K.SFX.pop(mult < 1 ? 0 : 4); K.checkBroke(); } }
/* hud */
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
K.el(`<div class="ck-row" id="pkRisk"><button class="ck-sm" data-r="low">LOW</button><button class="ck-sm on" data-r="mid">MID</button><button class="ck-sm" data-r="high">HIGH</button><button class="ck-sm" id="pkAuto" type="button">AUTO ×10</button><button class="ck-go" type="button" id="pkGo">DROP</button></div>`);
K.$('pkRisk').querySelectorAll('[data-r]').forEach(b => b.onclick = () => { if (balls.length) return; risk = b.dataset.r; K.$('pkRisk').querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x === b)); buildBins(); K.SFX.click(); });
const go = () => { const v = chip.get(); if (!K.take(v)) return false; drop(v); return true; };
K.$('pkGo').onclick = go;
K.$('pkAuto').onclick = () => { let n = 0; const iv = setInterval(() => { if (n++ >= 10 || !go()) clearInterval(iv); }, 280); };
window.__game = { drop: go };
K.start();
