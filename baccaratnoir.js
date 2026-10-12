/* Baccarat Noir: 8-deck punto banco (casino-math.js drawing rules; Banker 0.95:1, Player 1:1, Tie 9:1), 3D noir felt table,
   squeeze-style card reveals, bead-road history, live tables via mp.js (host deals one coup for everyone). FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
import { cardKit } from './cards3d.js';
const M = window.CMath;
const K = await boot({ id: 'baccaratnoir', title: 'Baccarat Noir', accent: '#4a1f5e', bloom: .5,
  rules: `<p>Bet on PLAYER, BANKER or TIE, then DEAL. The hand closest to 9 wins (tens and faces count 0). Third cards follow the standard tableau automatically.</p>
<table><tr><th>Bet</th><th>Pays</th></tr><tr><td>Player</td><td>1:1</td></tr><tr><td>Banker</td><td>0.95:1</td></tr><tr><td>Tie</td><td>9:1 (Player/Banker push)</td></tr></table><p>Live table: everyone bets during the countdown; one coup for the whole table.</p>`,
  view: (p) => p ? { pos: [0, 13.2, 6], look: [0, 0, .3], fov: 46 } : { pos: [0, 5.2, 4.4], look: [0, 0, -.2], fov: 40 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#14061e', pattern: ['#4a1f5e', '#c9a45c', '#ff2b6b'] }); K.lights({ c1: 0xc04dff, c2: 0xffb400, key: 18, hemi: .3 });
const CK = cardKit(K, '#14101c');
const felt = K.felt('#123a2a', (g, w, h) => { g.textAlign = 'center'; g.strokeStyle = '#ffd166'; g.lineWidth = 6;
  [['PLAYER', '#1f5f6e', .28], ['BANKER', '#8e1b2c', .72]].forEach(([t, c, x]) => { g.strokeRect(w * x - 190, h * .2, 380, 300); g.fillStyle = c; g.font = '400 64px Georgia'; g.fillText(t, w * x, h * .17); });
  g.fillStyle = '#ffd166'; g.font = '400 52px Georgia'; g.fillText('TIE PAYS 9 TO 1', w / 2, h * .66); g.font = 'italic 400 80px Georgia'; g.fillStyle = 'rgba(192,77,255,.55)'; g.fillText('Baccarat Noir', w / 2, h * .86); });
const table = K.rbox(5.6, 3.6, .3, .9, felt); table.rotation.x = -Math.PI / 2; table.position.y = -.15; scene.add(table);
const rail = new THREE.Mesh(new THREE.TorusGeometry(1, .06, 12, 64), K.M.gold); rail.rotation.x = -Math.PI / 2; rail.scale.set(2.95, 1.95, 1); scene.add(rail);
const glowRing = new THREE.Mesh(new THREE.TorusGeometry(1, .02, 8, 64), K.neon(0xc04dff, 1.8)); glowRing.rotation.x = -Math.PI / 2; glowRing.scale.set(3.12, 2.1, 1); glowRing.position.y = -.1; scene.add(glowRing);
const shoeBox = K.rbox(.6, .4, 1, .06, K.M.black); shoeBox.position.set(2.2, .2, -1.2); scene.add(shoeBox);
const P = new THREE.Vector3(-1.45, .03, -.35), B = new THREE.Vector3(1.45, .03, -.35);
let live = []; const totals = [K.label('', { size: .32 }), K.label('', { size: .32 })];
totals.forEach((t, i) => { t.rotation.x = -.9; t.position.set(i ? 1.45 : -1.45, .5, .6); scene.add(t); });
function setTotal(i, v, col) { const l = K.label(String(v), { size: .42, bg: col, color: '#fff' }); l.rotation.x = -.9; l.position.copy(totals[i].position); scene.remove(totals[i]); totals[i] = l; scene.add(l); }
/* hud */
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
K.el(`<div class="ck-row"><div class="ck-pill"><small>PLAYER</small><b id="bP">0</b></div><div class="ck-pill"><small>TIE</small><b id="bT">0</b></div><div class="ck-pill"><small>BANKER</small><b id="bB">0</b></div><div class="ck-pill" id="bTimerP" style="display:none"><small>DEAL IN</small><b id="bTimer"></b></div></div>`);
K.el(`<div class="ck-row" id="bRoad" style="gap:3px;min-height:16px"></div>`);
K.el(`<div class="ck-row"><button class="ck-sm" type="button" id="xP" style="background:#1d3f7a">PLAYER</button><button class="ck-sm" type="button" id="xT" style="background:#0f5a3e">TIE</button><button class="ck-sm" type="button" id="xB" style="background:#8e1b2c">BANKER</button><button class="ck-sm" type="button" id="xC">Clear</button><button class="ck-go" type="button" id="bGo">DEAL</button></div>`);
let bets = { player: 0, tie: 0, banker: 0 }, busy = false, phase = 'bet', road = [], lastBets = null;
const upd = () => { K.$('bP').textContent = K.fmt(bets.player); K.$('bT').textContent = K.fmt(bets.tie); K.$('bB').textContent = K.fmt(bets.banker); };
const stake = () => bets.player + bets.tie + bets.banker;
const add = (k) => { if (busy || (tb.isLive() && phase !== 'bet')) return; const v = chip.get(); if (!K.take(v)) return; bets[k] += v; tb.say('bet', { amt: v }); upd(); dropChip(k); };
const chipsG = new THREE.Group(); scene.add(chipsG);
function dropChip(k) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .045, 24), K.candy(chip.colorOf(chip.get()))); const x = k === 'player' ? -1.45 : k === 'banker' ? 1.45 : 0, z = k === 'tie' ? 1.1 : 1.25;
  const n = chipsG.children.filter(q => q.userData.k === k).length; c.userData.k = k; c.position.set(x + (Math.random() - .5) * .05, .03 + n * .045, z); c.castShadow = true; chipsG.add(c); }
K.$('xP').onclick = () => add('player'); K.$('xT').onclick = () => add('tie'); K.$('xB').onclick = () => add('banker');
K.$('xC').onclick = () => { if (busy || !stake()) return; K.give(stake()); bets = { player: 0, tie: 0, banker: 0 }; while (chipsG.children.length) chipsG.remove(chipsG.children[0]); upd(); };
K.$('bGo').onclick = () => { if (busy) return; if (!stake()) { if (lastBets) { const n = lastBets.player + lastBets.tie + lastBets.banker; if (K.take(n)) { bets = { ...lastBets }; Object.keys(bets).forEach(k => { for (let v = bets[k]; v > 0; v -= chip.get()) dropChip(k); }); upd(); } return; } K.msg('Bet on Player, Banker or Tie', 1300); return; } tb.go(); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function onResult(res) { busy = true; K.$('bGo').disabled = true; live.forEach(m => scene.remove(m)); live = []; totals.forEach(t => t.visible = false);
  const from = shoeBox.position.clone().add(new THREE.Vector3(0, .3, 0)); const seq = [[res.p[0], P, 0], [res.b[0], B, 0], [res.p[1], P, 1], [res.b[1], B, 1]];
  const put = async (c, at, i) => { const m = CK.make(null); m.set(c); m.position.copy(from); m.rotation.x = Math.PI / 2; scene.add(m); live.push(m); await CK.fly(m, at.clone().add(new THREE.Vector3((i - 1) * .7 + .35, i * .002, i === 2 ? .2 : 0)), 420, true); if (i === 2) m.rotation.z = Math.PI / 2; };
  for (const [c, at, i] of seq) await put(c, at, i);
  const tot = h => h.reduce((s, c) => s + M.bacVal(c), 0) % 10; setTotal(0, tot(res.p.slice(0, 2)), '#1d3f7a'); setTotal(1, tot(res.b.slice(0, 2)), '#8e1b2c');
  if (res.p[2] != null) { await sleep(500); K.SFX.tease(); await put(res.p[2], P, 2); setTotal(0, res.pt, '#1d3f7a'); }
  if (res.b[2] != null) { await sleep(500); K.SFX.tease(); await put(res.b[2], B, 2); setTotal(1, res.bt, '#8e1b2c'); }
  await sleep(450); K.msg(res.win === 'tie' ? 'TIE ' + res.pt : res.win.toUpperCase() + ' WINS ' + Math.max(res.pt, res.bt), 1600);
  const st = stake(); if (st) { let ret = 0; ['player', 'banker', 'tie'].forEach(k => { if (bets[k]) ret += M.bacReturn(k, res.win, bets[k]); }); await sleep(900); K.payout(st, Math.round(ret), res.win === 'player' ? P.clone() : res.win === 'banker' ? B.clone() : new THREE.Vector3(0, .5, .8), tb.isLive() ? 'net' : 'cpu'); if (ret > st) tb.say('won', { amt: ret - st }); lastBets = { ...bets }; }
  road.unshift(res.win); road.length = Math.min(14, road.length); K.$('bRoad').innerHTML = road.map(w => `<span style="width:14px;height:14px;border-radius:50%;display:inline-block;background:${w === 'player' ? '#1d3f7a' : w === 'banker' ? '#8e1b2c' : '#0f5a3e'}"></span>`).join('');
  bets = { player: 0, tie: 0, banker: 0 }; upd(); while (chipsG.children.length) chipsG.remove(chipsG.children[0]); busy = false; K.$('bGo').disabled = false; }
const shoe = [];
const tb = K.sharedRounds({ game: 'bac', betMs: 15000, goMs: 9000, roll: () => M.bacDeal(shoe), onResult, blurb: 'Open a table and share the code. Everyone bets during the countdown; one coup for the whole table.',
  onPhase: st => { phase = st ? st.phase : 'bet'; K.$('bTimerP').style.display = st ? '' : 'none'; }, onTick: (st, s) => K.$('bTimer').textContent = st.phase === 'bet' ? s + 's' : '…' });
window.__game = { bet: add, deal: () => K.$('bGo').click() };
K.start();
