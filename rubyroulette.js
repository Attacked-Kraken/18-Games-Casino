/* Ruby Roulette: single-zero European wheel (97.3% RTP, casino-math.js). 3D mahogany wheel, ball physics-feel spin, bet board sheet,
   live tables via mp.js (host spins one result for everyone, up to 6). FUN CHIPS ONLY. */
import { boot, CANDY } from './casino-kit.js';
import * as BU from './bet-ui.js';
const M = window.CMath;
const K = await boot({ id: 'rubyroulette', title: 'Ruby Roulette', accent: '#8e1b2c', bloom: .5,
  rules: `<p>European single-zero wheel. Place chips, then SPIN. Every bet returns 97.3% over time.</p><table><tr><th>Bet</th><th>Pays</th></tr>
<tr><td>Straight number</td><td>35:1</td></tr><tr><td>Dozen / Column</td><td>2:1</td></tr><tr><td>Red, Black, Odd, Even, 1-18, 19-36</td><td>1:1</td></tr></table><p>Live table: everyone bets during the countdown, one spin for the whole table.</p>`,
  view: (p) => p ? { pos: [0, 9.4, 6.4], look: [0, 0, .7], fov: 48 } : { pos: [2.9, 6.2, 4.6], look: [2.9, 0, .9], fov: 40 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#2a0610' }); K.lights({ c1: 0xff2b4e, c2: 0xffb400, target: [0, 0, 0] });
/* ----- wheel ----- */
const W = new THREE.Group(); scene.add(W);
const bowl = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.75, .5, 64, 1, true), K.M.wood); bowl.material.side = THREE.DoubleSide; bowl.position.y = .25; W.add(bowl);
const rim = new THREE.Mesh(new THREE.TorusGeometry(2.62, .09, 16, 96), K.M.gold); rim.rotation.x = -Math.PI / 2; rim.position.y = .5; W.add(rim);
const base = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.1, .3, 64), K.M.wood); base.position.y = -.1; base.receiveShadow = true; W.add(base);
const track = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.56, 96), K.M.mat(0x2a0a08, { roughness: .25, metalness: .2 })); track.rotation.x = -Math.PI / 2; track.position.y = .32; W.add(track);
const N = 37, step = Math.PI * 2 / N;
const rotor = new THREE.Group(); rotor.position.y = .34; W.add(rotor);
const tex = K.tex(1024, 1024, (g, w, h) => { const cx = w / 2, cy = h / 2; g.fillStyle = '#1a0605'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < N; i++) { const n = M.RL_WHEEL[i], a0 = i * step - step / 2 - Math.PI / 2, a1 = a0 + step, col = M.rlColor(n);
    g.fillStyle = col === 'red' ? '#8e1b2c' : col === 'green' ? '#0f5a3e' : '#14101a'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 510, a0, a1); g.closePath(); g.fill();
    g.strokeStyle = '#e6b94a'; g.lineWidth = 4; g.stroke();
    g.save(); g.translate(cx, cy); g.rotate(a0 + step / 2 + Math.PI / 2); g.fillStyle = '#fff'; g.font = '500 40px Georgia'; g.textAlign = 'center'; g.fillText(n, 0, -440); g.restore(); }
  g.fillStyle = '#3a120c'; g.beginPath(); g.arc(cx, cy, 300, 0, 7); g.fill(); g.strokeStyle = '#e6b94a'; g.lineWidth = 10; g.stroke();
  for (let i = 0; i < 8; i++) { g.save(); g.translate(cx, cy); g.rotate(i * Math.PI / 4); g.fillStyle = i % 2 ? '#8e1b2c' : '#c9a45c'; g.beginPath(); g.moveTo(0, -60); g.lineTo(26, -280); g.lineTo(-26, -280); g.fill(); g.restore(); } });
const disc = new THREE.Mesh(new THREE.CircleGeometry(1.95, 96), K.M.mat(0xffffff, { map: tex, roughness: .3, metalness: .15 })); disc.rotation.x = -Math.PI / 2; disc.receiveShadow = true; rotor.add(disc);
for (let i = 0; i < N; i++) { const a = i * step + step / 2, f = new THREE.Mesh(new THREE.BoxGeometry(.02, .07, .5), K.M.gold); f.position.set(Math.sin(a) * 1.66, .035, -Math.cos(a) * 1.66); f.rotation.y = -a; rotor.add(f); }
const hub = new THREE.Mesh(new THREE.ConeGeometry(.4, .5, 32), K.M.gold); hub.position.y = .25; rotor.add(hub);
const cross = new THREE.Mesh(new THREE.TorusGeometry(.42, .05, 12, 32), K.M.chrome); cross.rotation.x = Math.PI / 2; cross.position.y = .12; rotor.add(cross);
const ruby = new THREE.Mesh(new THREE.OctahedronGeometry(.16), K.candy(0xff0030, { transmission: 0, roughness: .1 })); ruby.position.y = .6; rotor.add(ruby);
const ball = new THREE.Mesh(new THREE.SphereGeometry(.075, 24, 16), K.M.mat(0xf2f2f2, { roughness: .15, metalness: .1 })); ball.castShadow = true; scene.add(ball);
const neonRing = new THREE.Mesh(new THREE.TorusGeometry(3.15, .04, 8, 128), K.neon(0xff2b4e, 2.5)); neonRing.rotation.x = -Math.PI / 2; neonRing.position.y = .06; scene.add(neonRing);
const resLbl = new THREE.Group(); resLbl.position.set(0, 1.6, -1.4); scene.add(resLbl);
/* history strip */
const hist = [];
/* ----- spin state ----- */
let rotA = 0, rotV = .35, ballA = 0, ballR = 2.42, ballY = .42, spinning = false, anim = null;
function ballPos() { ball.position.set(Math.sin(ballA) * ballR, ballY, -Math.cos(ballA) * ballR); }
K.onFrame((dt, t) => { rotA += rotV * dt; rotor.rotation.y = -rotA; ruby.rotation.y += dt * 2;
  if (anim) anim(dt); else { ballA = -rotA + restIdx * step + step / 2 * 0; ballA = rotA2pocket(restIdx); } ballPos(); });
let restIdx = 0; const rotA2pocket = (i) => rotA + i * step; /* pocket centre angle in world (clockwise from -z) */
function spinTo(num, done) { spinning = true; const idx = M.RL_WHEEL.indexOf(num); rotV = 1.6; let t = 0; const T = 5.2, t0 = performance.now(); const a0 = ballA;
  /* ball: fast counter orbit that decays, then drops in and locks to pocket */
  const totalBall = -Math.PI * 2 * 5.5; let ticked = 0;
  anim = (dt) => { t = (performance.now() - t0) / 1000; const k = Math.min(1, t / T), e = 1 - Math.pow(1 - k, 3);
    const target = rotA2pocket(idx); const free = a0 + totalBall * e;
    const blend = Math.max(0, (k - .7) / .3), b2 = blend * blend * (3 - 2 * blend);
    let d = ((target - free) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI; ballA = free + d * b2;
    ballR = 2.42 - .8 * b2; ballY = .42 - .04 * b2 + Math.abs(Math.sin(t * 9)) * .05 * (1 - k) * (k > .6 ? 1 : 0);
    if (k > .55 && Math.floor(t * 8) !== ticked) { ticked = Math.floor(t * 8); if (k < .95) K.SFX.tick(); }
    rotV = 1.6 * (1 - e) + .35 * e;
    if (k >= 1) { anim = null; restIdx = idx; spinning = false; done(); } };
  K.SFX.whoosh(); }
/* ----- bets: real betting layout (DOM board, chips rendered on spots) ----- */
let bets = []; /* {key,k,v,cover,stake} */
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
const info = K.el(`<div class="ck-row" style="gap:6px"><div class="ck-pill"><small>TOTAL BET</small><b id="rBet">0</b></div><div class="ck-pill" id="rTimerP" style="display:none"><small>SPIN IN</small><b id="rTimer">–</b></div><div id="rStrip" style="display:flex;gap:3px;align-items:center;flex-wrap:wrap;max-width:300px;font:800 11px system-ui"></div></div>`);
const boardWrap = K.el(`<div class="ck-row" style="justify-content:center"><div id="rBoardEl" style="position:relative;user-select:none;-webkit-user-select:none;touch-action:manipulation"></div></div>`);
const act = K.el(`<div class="ck-row"><button class="ck-sm" type="button" id="rUndo">↶ Undo</button><button class="ck-sm" type="button" id="rClr">Clear</button><button class="ck-sm" type="button" id="rRe">Rebet</button><button class="ck-sm" type="button" id="rX2">×2</button><button class="ck-go" type="button" id="rSpin">SPIN</button></div>`);
const B = K.$('rBoardEl'); const spots = new Map(); /* key -> {el, k, v, cover, rect} */
const RED = (n) => M.rlColor(n) === 'red';
const nx = (n) => Math.ceil(n / 3), ny = (n) => 2 - ((n - 1) % 3); /* logical 14x5: x 0=zero, 1..12 numbers, 13=2to1; y 0..2 numbers, 3 dozens, 4 outside */
function addSpot(key, k, v, rect, html, style, hot) { const e = document.createElement('div'); e.innerHTML = html || ''; e.dataset.key = key;
  e.style.cssText = `position:absolute;display:flex;align-items:center;justify-content:center;box-sizing:border-box;cursor:pointer;font:700 13px Georgia;color:#fff;${hot ? 'z-index:4;' : 'border:1px solid rgba(255,230,170,.55);'}${style || ''}`;
  e.onclick = (ev) => { ev.stopPropagation(); place(k, v, key); }; B.appendChild(e); spots.set(key, { el: e, k, v, cover: M.rlCover(k, v), rect, hot }); }
addSpot('n0', 'n', 0, [0, 0, 1, 3], '0', 'background:#0f6a46;border-radius:40% 0 0 40%');
for (let n = 1; n <= 36; n++) addSpot('n' + n, 'n', n, [nx(n), ny(n), 1, 1], n, `background:${RED(n) ? '#b0182e' : '#16121a'}`);
for (let c = 0; c < 3; c++) addSpot('c' + c, 'col', c, [13, 2 - c, 1, 1], '2to1', 'background:#0b4a33;font-size:10px');
['1st 12', '2nd 12', '3rd 12'].forEach((l, d) => addSpot('d' + d, 'dozen', d, [1 + d * 4, 3, 4, 1], l, 'background:#0b4a33'));
[['1-18', 'low'], ['EVEN', 'even'], ['RED', 'red', 'background:#b0182e'], ['BLACK', 'black', 'background:#16121a'], ['ODD', 'odd'], ['19-36', 'high']]
  .forEach(([l, k, s], i) => addSpot(k, k, null, [1 + i * 2, 4, 2, 1], l, (s || 'background:#0b4a33')));
/* splits / streets / corners as small hot zones on the lines */
const HZ = .34;
for (let n = 1; n <= 36; n++) { const x = nx(n), y = ny(n);
  if (n % 3 !== 0) addSpot('s' + n + '_' + (n + 1), 'split', [n, n + 1], [x + .5 - HZ / 2, y - HZ / 2, HZ, HZ], '', '', 1);
  if (n <= 33) addSpot('s' + n + '_' + (n + 3), 'split', [n, n + 3], [x + 1 - HZ / 2, y + .5 - HZ / 2, HZ, HZ], '', '', 1);
  if (n % 3 !== 0 && n <= 32) addSpot('q' + n, 'corner', [n, n + 1, n + 3, n + 4], [x + 1 - HZ / 2, y - HZ / 2, HZ, HZ], '', '', 1);
  if (n % 3 === 1) addSpot('t' + n, 'street', [n, n + 1, n + 2], [x + .5 - HZ / 2, 3 - HZ / 2, HZ, HZ], '', '', 1); }
let portrait = false;
function layout() { portrait = innerHeight > innerWidth; const vw = innerWidth, vh = innerHeight;
  const W = portrait ? Math.min(vw * .94, 380) : Math.min(vw * .56, 680, (vh - 150) * 14 / 5 / 1.05), H = portrait ? Math.min(vh * .42, W * 14 / 5 * .62) : W * 5 / 14 * 1.05;
  B.style.width = W + 'px'; B.style.height = H + 'px';
  Object.assign(boardWrap.style, portrait ? { position: '', right: '', top: '', zIndex: '' } : { position: 'fixed', right: '14px', top: Math.max(96, (vh - H) / 2 - 20) + 'px', zIndex: '5', margin: 0 });
  spots.forEach(({ el, rect: [x, y, w, h] }) => { let L, T, Wd, Ht;
    if (!portrait) { L = x / 14; T = y / 5; Wd = w / 14; Ht = h / 5; } else { L = (5 - (y + h)) / 5; T = x / 14; Wd = h / 5; Ht = w / 14; }
    Object.assign(el.style, { left: L * 100 + '%', top: T * 100 + '%', width: Wd * 100 + '%', height: Ht * 100 + '%' }); }); }
layout(); addEventListener('resize', layout);
let lastBets = [];
const total = () => bets.reduce((s, b) => s + b.stake, 0);
function drawBets() { K.$('rBet').textContent = K.fmt(total()); spots.forEach((s, key) => { const b = bets.find(x => x.key === key); BU.stackOn(s.el, b ? b.stake : 0); }); }
const canBet = () => !(spinning || (table.isLive() && phase !== 'bet'));
function place(k, v, key) { if (!canBet()) return; const s = chip.get(); if (!K.take(s)) { K.msg('Not enough chips', 1200); return; }
  if (!spots.has(key)) { key = null; spots.forEach((s, kk) => { if (!key && s.k === k && JSON.stringify(s.v) === JSON.stringify(v ?? null)) key = kk; }); } if (!key) return; lastKey = key; const ex = bets.find(b => b.key === key); if (ex) ex.stake += s; else bets.push({ key, k, v, cover: M.rlCover(k, v), stake: s });
  K.tone(900, .04, 'triangle', .05); table.say('bet', { amt: s }); drawBets(); }
const undo = []; let lastKey = null; /* stack of keys placed */
const _place = place; place = (k, v, key) => { const before = total(); _place(k, v, key); if (total() > before) undo.push([lastKey, total() - before]); };
K.$('rUndo').onclick = () => { if (!canBet()) return; const u = undo.pop(); if (!u) return; const b = bets.find(x => x.key === u[0]); if (!b) return; b.stake -= u[1]; K.give(u[1]); if (b.stake <= 0) bets = bets.filter(x => x !== b); drawBets(); };
K.$('rClr').onclick = () => { if (!canBet()) return; const t = total(); if (t) K.give(t); bets = []; undo.length = 0; drawBets(); };
K.$('rRe').onclick = () => { if (!canBet() || bets.length) return; const need = lastBets.reduce((s, b) => s + b.stake, 0); if (!need) { K.msg('No previous bets', 1000); return; } if (!K.take(need)) { K.msg('Not enough chips', 1200); return; } bets = lastBets.map(b => ({ ...b })); undo.length = 0; drawBets(); };
K.$('rX2').onclick = () => { if (!canBet() || !bets.length) return; const t = total(); if (!K.take(t)) { K.msg('Not enough chips to double', 1200); return; } bets.forEach(b => { undo.push([b.key, b.stake]); b.stake *= 2; }); drawBets(); };
K.$('rSpin').onclick = () => { if (spinning) return; if (!bets.length) { K.msg('Tap the board to place a bet', 1400); return; } K.$('rSpin').disabled = true; table.go(); };
function drawStrip() { const cnt = {}; hist.forEach(n => cnt[n] = (cnt[n] || 0) + 1); const ranked = Object.keys(cnt).map(Number).sort((a, b) => cnt[b] - cnt[a]);
  const cold = []; for (let n = 0; n <= 36; n++) if (!cnt[n]) cold.push(n);
  const ball = (n, big) => `<span style="display:inline-block;min-width:${big ? 26 : 20}px;padding:${big ? 4 : 2}px 3px;border-radius:12px;text-align:center;background:${M.rlColor(n) === 'red' ? '#b0182e' : M.rlColor(n) === 'green' ? '#0f6a46' : '#16121a'};color:#fff;border:1px solid #c9a45c">${n}</span>`;
  K.$('rStrip').innerHTML = hist.slice(0, 10).map((n, i) => ball(n, !i)).join('') + (hist.length >= 5 ? `<span style="color:#ff8a5c;margin-left:6px">🔥${ranked.slice(0, 3).join(' ')}</span><span style="color:#8fd0ff;margin-left:6px">❄${(cold.length ? cold : ranked.slice(-3)).slice(0, 3).join(' ')}</span>` : ''); }
/* ----- result ----- */
function showResult(n) { while (resLbl.children.length) resLbl.remove(resLbl.children[0]);
  const col = M.rlColor(n), l = K.label(String(n), { size: .9, bg: col === 'red' ? '#8e1b2c' : col === 'green' ? '#0f5a3e' : '#14101a', color: '#fff', stroke: '#000' }); resLbl.add(l); }
function onResult(n) { spinTo(n, () => { showResult(n); hist.unshift(n); hist.length = Math.min(60, hist.length); drawStrip();
    const staked = total(); let ret = 0; bets.forEach(b => ret += M.rlPayout(b.cover, b.stake, n));
    BU.glow([spots.get('n' + n).el]); BU.settle(bets.map(b => ({ el: spots.get(b.key).el, win: b.cover.includes(n) })));
    if (staked) { BU.banner(staked, ret); K.payout(staked, ret, new THREE.Vector3(0, 1, 0), table.isLive() ? 'net' : 'cpu'); if (ret > staked) table.say('won', { amt: ret - staked }); }
    else K.msg(n + ' ' + M.rlColor(n).toUpperCase(), 1500);
    if (bets.length) lastBets = bets.map(b => ({ ...b })); bets = []; undo.length = 0; K.$('rBet').textContent = '0'; K.$('rSpin').disabled = false; }); }
let phase = 'bet';
const table = K.sharedRounds({ game: 'rr', betMs: 15000, goMs: 8000, roll: () => M.rlSpin(), onResult,
  blurb: 'Open a table and share the code. Everyone bets during the countdown; one spin for the whole table.',
  onPhase: (st) => { phase = st ? st.phase : 'bet'; K.$('rTimerP').style.display = st ? '' : 'none'; K.$('rSpin').textContent = st ? 'READY' : 'SPIN'; },
  onTick: (st, s) => { K.$('rTimer').textContent = st.phase === 'bet' ? s + 's' : '…'; } });
window.__game = { place, spin: () => K.$('rSpin').click() };
K.start();
