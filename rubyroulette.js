/* Ruby Roulette: single-zero European wheel (97.3% RTP, casino-math.js). 3D mahogany wheel, ball physics-feel spin, bet board sheet,
   live tables via mp.js (host spins one result for everyone, up to 6). FUN CHIPS ONLY. */
import { boot, CANDY } from './casino-kit.js';
const M = window.CMath;
const K = await boot({ id: 'rubyroulette', title: 'Ruby Roulette', accent: '#8e1b2c', bloom: .5,
  rules: `<p>European single-zero wheel. Place chips, then SPIN. Every bet returns 97.3% over time.</p><table><tr><th>Bet</th><th>Pays</th></tr>
<tr><td>Straight number</td><td>35:1</td></tr><tr><td>Dozen / Column</td><td>2:1</td></tr><tr><td>Red, Black, Odd, Even, 1-18, 19-36</td><td>1:1</td></tr></table><p>Live table: everyone bets during the countdown, one spin for the whole table.</p>`,
  view: (p) => p ? { pos: [0, 9.4, 6.4], look: [0, 0, .7], fov: 48 } : { pos: [0, 5.2, 5.2], look: [0, 0, .2], fov: 38 } });
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
/* ----- bets ----- */
let bets = []; /* {k,v,cover,stake,label} */
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
const info = K.el(`<div class="ck-row"><div class="ck-pill"><small>BET</small><b id="rBet">0</b></div><div class="ck-pill"><small>LAST</small><b id="rLast">–</b></div><div class="ck-pill" id="rTimerP" style="display:none"><small>SPIN IN</small><b id="rTimer">–</b></div></div>`);
const quick = K.el(`<div class="ck-row"></div>`);
[['RED', 'red', CANDY.red], ['BLACK', 'black', '#222'], ['ODD', 'odd'], ['EVEN', 'even'], ['1-18', 'low'], ['19-36', 'high']].forEach(([l, k, c]) => {
  const b = document.createElement('button'); b.className = 'ck-sm'; b.type = 'button'; b.textContent = l; if (c) b.style.background = c; b.onclick = () => place(k, null, l); quick.appendChild(b); });
const act = K.el(`<div class="ck-row"><button class="ck-sm" type="button" id="rBoard">Numbers</button><button class="ck-sm" type="button" id="rUndo">↶</button><button class="ck-sm" type="button" id="rRe">Rebet</button><button class="ck-go" type="button" id="rSpin">SPIN</button></div>`);
document.body.insertAdjacentHTML('beforeend', `<div class="ck-sheet" id="rBS"><div class="ck-box"><h2>Number board</h2><div id="rGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px"></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:6px" id="rOut"></div><button class="ck-ok" type="button" data-y>Done</button></div></div>`);
const grid = K.$('rGrid'); const z = document.createElement('button'); z.style.gridColumn = '1/4';
const cell = (b, n) => { b.type = 'button'; b.className = 'ck-sm'; b.style.background = M.rlColor(n) === 'red' ? '#8e1b2c' : M.rlColor(n) === 'green' ? '#0f5a3e' : '#1c1622'; b.textContent = n; b.onclick = () => place('n', n, '' + n); b.dataset.n = n; };
cell(z, 0); grid.appendChild(z); for (let n = 1; n <= 36; n++) { const b = document.createElement('button'); cell(b, n); grid.appendChild(b); }
[['1st 12', 'dozen', 0], ['2nd 12', 'dozen', 1], ['3rd 12', 'dozen', 2], ['Col 1', 'col', 0], ['Col 2', 'col', 1], ['Col 3', 'col', 2]].forEach(([l, k, v]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ck-sm'; b.textContent = l; b.onclick = () => place(k, v, l); K.$('rOut').appendChild(b); });
K.$('rBS').querySelector('[data-y]').onclick = () => K.$('rBS').classList.remove('on');
K.$('rBoard').onclick = () => K.$('rBS').classList.add('on');
let lastBets = [];
const total = () => bets.reduce((s, b) => s + b.stake, 0);
const chipStacks = new THREE.Group(); scene.add(chipStacks);
function drawBets() { K.$('rBet').textContent = K.fmt(total()); while (chipStacks.children.length) chipStacks.remove(chipStacks.children[0]);
  bets.forEach((b, i) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .05, 24), K.candy(chip.colorOf(b.chipV) || '#1d3f7a')); const a = -2.2 + (i % 9) * .55; c.position.set(a, .03 + Math.floor(i / 9) * .05, 3.0); chipStacks.add(c); });
  grid.querySelectorAll('button').forEach(x => x.style.outline = bets.some(b => b.k === 'n' && b.v === +x.dataset.n) ? '3px solid #c9a45c' : ''); }
function place(k, v, label) { if (spinning || (table.isLive() && phase !== 'bet')) return; const s = chip.get(); if (!K.take(s)) return;
  const ex = bets.find(b => b.k === k && b.v === v); if (ex) ex.stake += s; else bets.push({ k, v, cover: M.rlCover(k, v), stake: s, label, chipV: s });
  table.say('bet', { amt: s }); drawBets(); }
K.$('rUndo').onclick = () => { const b = bets.pop(); if (b) { K.give(b.stake); drawBets(); } };
K.$('rRe').onclick = () => { if (spinning || bets.length) return; const need = lastBets.reduce((s, b) => s + b.stake, 0); if (!need || !K.take(need)) return; bets = lastBets.map(b => ({ ...b })); drawBets(); };
K.$('rSpin').onclick = () => { if (spinning) return; if (!bets.length) { K.msg('Place a bet first', 1200); return; } K.$('rSpin').disabled = true; table.go(); };
/* ----- result ----- */
function showResult(n) { while (resLbl.children.length) resLbl.remove(resLbl.children[0]);
  const col = M.rlColor(n), l = K.label(String(n), { size: .9, bg: col === 'red' ? '#8e1b2c' : col === 'green' ? '#0f5a3e' : '#14101a', color: '#fff', stroke: '#000' }); resLbl.add(l); }
function onResult(n) { spinTo(n, () => { showResult(n); hist.unshift(n); hist.length = Math.min(8, hist.length); K.$('rLast').textContent = hist.slice(0, 5).join(' · ');
    const staked = total(); let ret = 0; bets.forEach(b => ret += M.rlPayout(b.cover, b.stake, n));
    if (staked) { K.payout(staked, ret, new THREE.Vector3(0, 1, 0), table.isLive() ? 'net' : 'cpu'); if (ret > staked) table.say('won', { amt: ret - staked }); }
    else K.msg(n + ' ' + M.rlColor(n).toUpperCase(), 1500);
    if (bets.length) lastBets = bets.map(b => ({ ...b })); bets = []; drawBets(); K.$('rSpin').disabled = false; }); }
let phase = 'bet';
const table = K.sharedRounds({ game: 'rr', betMs: 15000, goMs: 8000, roll: () => M.rlSpin(), onResult,
  blurb: 'Open a table and share the code. Everyone bets during the countdown; one spin for the whole table.',
  onPhase: (st) => { phase = st ? st.phase : 'bet'; K.$('rTimerP').style.display = st ? '' : 'none'; K.$('rSpin').textContent = st ? 'READY' : 'SPIN'; },
  onTick: (st, s) => { K.$('rTimer').textContent = st.phase === 'bet' ? s + 's' : '…'; } });
window.__game = { place, spin: () => K.$('rSpin').click() };
K.start();
