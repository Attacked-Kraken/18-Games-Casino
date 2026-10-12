/* Lucky Keno: pick 1-10 of 80, 20 balls are drawn (casino-math.js paytable). 3D lit board, tumbling ball globe, quick pick. FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
const M = window.CMath;
const K = await boot({ id: 'luckykeno', title: 'Lucky Keno', accent: '#1f5f6e', bloom: .55, fog: [30, 70],
  rules: `<p>Tap 1 to 10 numbers on the board (or QUICK PICK), then PLAY. 20 balls are drawn. The more of your numbers hit, the more you win.</p><table><tr><th>Picks</th><th>Hits → pays ×bet</th></tr>${Object.keys(M.KENO_PAY).map(k => `<tr><td>${k}</td><td>${M.KENO_PAY[k].map((v, h) => v ? h + '→' + v : '').filter(Boolean).join(', ')}</td></tr>`).join('')}</table>`,
  view: (p) => p ? { pos: [0, 3.0, 15.5], look: [0, 2.9, 0], fov: 46 } : { pos: [0, 3.2, 8], look: [0, 2.4, 0], fov: 42 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#041a1c', pattern: ['#1f5f6e', '#c9a45c', '#7a1a4a'], y: -1 }); K.setFloor(-1); K.lights({ c1: 0x00d2b4, c2: 0xff3fa4, key: 16, keyPos: [1, 7, 9], target: [0, 2.5, 0] });
let picks = new Set(), drawn = [], hits = new Set(), busy = false;
const BW = 1024, BH = 820;
const boardTex = K.tex(BW, BH, () => {}); const bc = boardTex.userData.canvas, g = bc.getContext('2d');
function paint() { g.fillStyle = '#0b0909'; g.fillRect(0, 0, BW, BH); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let n = 1; n <= 80; n++) { const i = n - 1, x = (i % 10) * 100 + 14, y = Math.floor(i / 10) * 100 + 14, P = picks.has(n), D = drawn.includes(n), H = P && D;
    g.fillStyle = H ? '#c9a45c' : P ? '#7a1424' : D ? '#0f4a3a' : n <= 40 ? '#1a1414' : '#141418'; g.beginPath(); g.roundRect(x, y, 88, 88, 18); g.fill();
    if (H) { g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); } g.fillStyle = H ? '#1a1208' : '#e8dcc4'; g.font = '400 42px Georgia'; g.fillText(n, x + 44, y + 47); }
  g.fillStyle = '#c9a45c'; g.font = '400 28px Georgia'; g.fillText(picks.size ? picks.size + ' PICKED · ' + hits.size + ' HIT' : 'TAP NUMBERS TO PICK', BW / 2, 800 - 0); boardTex.needsUpdate = true; }
const board = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2 * BH / BW), new THREE.MeshBasicMaterial({ map: boardTex, toneMapped: false }));
board.position.set(0, 2.15, 0); scene.add(board);
const frame = K.rbox(5.6, 4.6, .2, .25, K.M.gold); frame.position.set(0, 2.15, -.3); scene.add(frame);
/* globe */
const globe = new THREE.Mesh(new THREE.SphereGeometry(.85, 32, 24), K.M.glass); globe.position.set(0, 6.25, -.4); scene.add(globe);
const ring = new THREE.Mesh(new THREE.TorusGeometry(.88, .04, 8, 48), K.neon(0x00d2b4, 2)); ring.position.copy(globe.position); scene.add(ring);
const bcols = ['#8e1b2c', '#c9a45c', '#1d3f7a', '#0f5a3e', '#4a1f5e', '#9a5a18'];
const ballTex = (n) => K.tex(128, 64, (c, w, h) => { c.fillStyle = bcols[n % 6]; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 4, h / 2, 22, 0, 7); c.arc(w * .75, h / 2, 22, 0, 7); c.fill(); c.fillStyle = '#111'; c.font = '500 24px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, w / 4, h / 2 + 1); c.fillText(n, w * .75, h / 2 + 1); });
const tumble = []; for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), K.candy(bcols[i % 6])); globe.add(b); tumble.push(b); }
const outBalls = [];
K.onFrame((dt, t) => { const sp = busy ? 9 : 1.4; tumble.forEach((b, i) => { const a = t * sp * (.6 + i * .07) + i; b.position.set(Math.sin(a) * .55, Math.cos(a * 1.3) * .5, Math.sin(a * .8 + i) * .5); });
  ring.rotation.y += dt * sp * .3; outBalls.forEach(o => { o.m.position.lerp(o.to, Math.min(1, dt * 7)); o.m.rotation.y += dt * 3; }); });
/* picking on board */
K.canvas.addEventListener('pointerdown', e => { if (busy) return; const h = K.pick(e, [board]); if (!h.length) return; const u = h[0].uv, px = u.x * BW, py = (1 - u.y) * BH; const c = Math.floor((px - 7) / 100), r = Math.floor((py - 7) / 100); if (c < 0 || c > 9 || r < 0 || r > 7) return;
  toggle(r * 10 + c + 1); });
function toggle(n) { if (busy) return; if (drawn.length) { drawn = []; hits.clear(); clearOut(); } if (picks.has(n)) picks.delete(n); else if (picks.size < 10) picks.add(n); else { K.msg('Max 10 numbers', 1000); return; } K.SFX.pop(picks.size); paint(); upd(); }
function clearOut() { outBalls.forEach(o => scene.remove(o.m)); outBalls.length = 0; }
/* hud */
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
K.el(`<div class="ck-row"><div class="ck-pill"><small>PICKS</small><b id="kP">0</b></div><div class="ck-pill"><small>HITS</small><b id="kH">0</b></div><div class="ck-pill" style="min-width:120px"><small>TOP PRIZE</small><b id="kT">–</b></div></div>`);
K.el(`<div class="ck-row"><button class="ck-sm" type="button" id="kQ">Quick pick</button><button class="ck-sm" type="button" id="kC">CLEAR</button><button class="ck-go" type="button" id="kGo">PLAY</button></div>`);
function upd() { K.$('kP').textContent = picks.size; K.$('kH').textContent = hits.size; const p = M.KENO_PAY[picks.size]; K.$('kT').textContent = p ? K.fmt(p[p.length - 1] * chip.get()) : '–'; }
chip.el.addEventListener('click', upd);
K.$('kQ').onclick = () => { if (busy) return; drawn = []; hits.clear(); clearOut(); picks = new Set(M.shuffle(Array.from({ length: 80 }, (_, i) => i + 1)).slice(0, Math.max(picks.size, 6) > 10 ? 10 : Math.max(picks.size, 6))); K.SFX.roll(); paint(); upd(); };
K.$('kC').onclick = () => { if (busy) return; picks.clear(); drawn = []; hits.clear(); clearOut(); paint(); upd(); };
K.$('kGo').onclick = async () => { if (busy) return; if (!picks.size) { K.msg('Pick some numbers', 1200); return; } const bet = chip.get(); if (!K.take(bet)) return;
  busy = true; K.$('kGo').disabled = true; drawn = []; hits.clear(); clearOut(); paint(); const res = M.kenoDraw();
  for (let i = 0; i < res.length; i++) { const n = res[i]; await new Promise(r => setTimeout(r, 260)); drawn.push(n); const hit = picks.has(n); if (hit) hits.add(n);
    const m = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 16), K.M.mat(0xffffff, { map: ballTex(n), roughness: .3 })); m.position.copy(globe.position); scene.add(m);
    outBalls.push({ m, to: new THREE.Vector3(-2.34 + (i % 10) * .52, i < 10 ? 5.0 : 4.52, .2) });
    if (hit) { K.SFX.pop(hits.size + 3); K.tone(880 + hits.size * 110, .15, 'triangle', .1); } else K.SFX.tick(); paint(); upd(); }
  const mult = (M.KENO_PAY[picks.size] || [])[hits.size] || 0, ret = Math.round(bet * mult);
  K.$('kT').textContent = mult ? '×' + mult : 'no win'; K.payout(bet, ret, new THREE.Vector3(0, 2.5, 1));
  busy = false; K.$('kGo').disabled = false; };
window.__game = { quick: () => K.$('kQ').click(), play: () => K.$('kGo').click() };
paint(); upd(); K.start();
