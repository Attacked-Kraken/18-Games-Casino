/* Dice Palace: craps (casino-math.js crapsRoll): Pass / Don't Pass, Field, Place 6 & 8. 3D candy dice thrown across a palace felt,
   point puck, hot-roll streak, live tables via mp.js (host throws the dice for everyone). FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
const M = window.CMath;
const K = await boot({ id: 'dicepalace', title: 'Dice Palace', accent: '#7ad400', bloom: .5,
  rules: `<p><b>Pass</b>: come-out 7 or 11 wins, 2/3/12 loses, anything else sets the POINT; then hit the point before a 7 to win 1:1. <b>Don't Pass</b> is the opposite (12 pushes on come-out).</p>
<p><b>Field</b> (one roll): 3, 4, 9, 10, 11 pay 1:1; 2 pays 2:1; 12 pays 3:1. <b>Place 6 / 8</b> (works while a point is on): pays 7:6 every time it rolls, lost on a 7.</p><p>Live table: one shooter (the host) throws for everyone.</p>`,
  view: (p) => p ? { pos: [0, 10.8, 6.6], look: [0, 0, .3], fov: 46 } : { pos: [0, 6.2, 5.6], look: [0, 0, 0], fov: 40 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#0c1c04', pattern: ['#7ad400', '#ffd21f', '#ff2b6b'] }); K.lights({ c1: 0x7ad400, c2: 0xff3fa4, key: 18, hemi: .35 });
const felt = K.felt('#0d5a2a', (g, w, h) => { g.textAlign = 'center'; g.strokeStyle = '#ffd166'; g.lineWidth = 6; g.fillStyle = '#ffe9a8';
  g.strokeRect(60, 60, w - 120, 180); g.font = '900 70px Georgia'; g.fillText('PASS LINE', w / 2, 175);
  g.strokeRect(60, 280, w - 120, 150); g.font = '900 50px Georgia'; g.fillText("DON'T PASS · BAR 12", w / 2, 375);
  g.strokeRect(60, 470, w - 120, 170); g.font = '900 56px Georgia'; g.fillStyle = '#ffd21f'; g.fillText('FIELD  2 · 3 · 4 · 9 · 10 · 11 · 12', w / 2, 575);
  g.fillStyle = '#ffe9a8'; [[6, .35], [8, .65]].forEach(([n, x]) => { g.strokeRect(w * x - 120, 690, 240, 220); g.font = '900 140px Georgia'; g.fillText(n, w * x, 860); });
  g.font = 'italic 900 60px Georgia'; g.fillStyle = 'rgba(255,210,31,.5)'; g.fillText('Dice Palace', w / 2, 980); });
const table = K.rbox(5.4, 4.2, .3, .6, felt); table.rotation.x = -Math.PI / 2; table.position.y = -.15; scene.add(table);
const rail = K.rbox(5.9, 4.7, .2, .7, K.M.wood); rail.rotation.x = -Math.PI / 2; rail.position.y = -.25; scene.add(rail);
/* dice */
const pip = (v, col) => K.tex(256, 256, (g, w) => { g.fillStyle = col; g.beginPath(); g.roundRect(0, 0, w, w, 40); g.fill(); g.fillStyle = '#fff';
  const P = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .22], [.73, .22], [.27, .5], [.73, .5], [.27, .78], [.73, .78]] }[v];
  P.forEach(([x, y]) => { g.beginPath(); g.arc(x * w, y * w, w * .09, 0, 7); g.fill(); }); });
const FACES = [3, 4, 1, 6, 2, 5]; /* +x -x +y -y +z -z */
const UP = { 1: [0, 0, 0], 3: [0, 0, Math.PI / 2], 4: [0, 0, -Math.PI / 2], 6: [Math.PI, 0, 0], 2: [-Math.PI / 2, 0, 0], 5: [Math.PI / 2, 0, 0] };
const dice = ['#ff2b4e', '#2b7bff'].map((c, i) => { const ms = FACES.map(v => K.M.mat(0xffffff, { map: pip(v, c), roughness: .25, metalness: 0 })); const d = new THREE.Mesh(new THREE.BoxGeometry(.38, .38, .38), ms); d.castShadow = true; d.position.set(-.4 + i * .8, .19, 1.5); scene.add(d); return d; });
const puck = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .06, 32), K.M.mat(0xffffff, { map: K.tex(128, 128, (g) => { g.fillStyle = '#111'; g.beginPath(); g.arc(64, 64, 64, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 40px system-ui'; g.textAlign = 'center'; g.fillText('OFF', 64, 78); }) }));
puck.position.set(2.2, .03, -1.5); scene.add(puck);
function setPuck(p) { puck.material.map = K.tex(128, 128, (g) => { g.fillStyle = p ? '#fff' : '#111'; g.beginPath(); g.arc(64, 64, 64, 0, 7); g.fill(); g.fillStyle = p ? '#111' : '#fff'; g.font = '900 ' + (p ? 60 : 40) + 'px system-ui'; g.textAlign = 'center'; g.fillText(p ? p : 'OFF', 64, p ? 84 : 78); }); puck.material.needsUpdate = true;
  const zx = { 4: -1.8, 5: -1.1, 6: -.4, 8: .4, 9: 1.1, 10: 1.8 }; puck.position.set(p ? zx[p] : 2.2, .03, -1.5); }
let anim = null; K.onFrame(() => anim && anim());
function throwDice(d, done) { const t0 = performance.now(), T = 1500; const st = dice.map(x => x.position.clone()); const end = [new THREE.Vector3(-.35 + (Math.random() - .5) * .3, .19, -.9 + Math.random() * .3), new THREE.Vector3(.35 + (Math.random() - .5) * .3, .19, -.8 + Math.random() * .3)];
  const spin = dice.map(() => new THREE.Vector3(8 + Math.random() * 6, 6 + Math.random() * 6, 7 + Math.random() * 5)); const fin = d.map(v => new THREE.Euler(...UP[v])); const yaw = d.map(() => Math.random() * Math.PI * 2);
  K.SFX.roll(); let bounced = false;
  anim = () => { const k = Math.min(1, (performance.now() - t0) / T), e = 1 - Math.pow(1 - k, 2);
    dice.forEach((x, i) => { x.position.lerpVectors(st[i], end[i], e); x.position.y = .19 + Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k) * 1.2;
      if (k < .82) x.rotation.set(spin[i].x * k * (1 - k * .5), spin[i].y * k, spin[i].z * k * (1 - k * .5)); else { const q = new THREE.Quaternion().setFromEuler(fin[i]); q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw[i])); x.quaternion.slerp(q, .35); } });
    if (k > .3 && !bounced) { bounced = true; K.SFX.thud(); }
    if (k >= 1) { anim = null; dice.forEach((x, i) => { const q = new THREE.Quaternion().setFromEuler(fin[i]); q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw[i])); x.quaternion.copy(q); }); done(); } }; }
/* bets */
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
let bets = { pass: 0, dont: 0, field: 0, place: { 6: 0, 8: 0 } }, point = 0, busy = false, hot = 0, phase = 'bet';
K.el(`<div class="ck-row"><div class="ck-pill"><small>POINT</small><b id="dPt">OFF</b></div><div class="ck-pill"><small>ON TABLE</small><b id="dOn">0</b></div><div class="ck-pill"><small>ROLL</small><b id="dR">–</b></div><div class="ck-pill" id="dTP" style="display:none"><small>ROLL IN</small><b id="dTm"></b></div></div>`);
K.el(`<div class="ck-row"><button class="ck-sm" type="button" data-b="pass">PASS</button><button class="ck-sm" type="button" data-b="dont">DON'T</button><button class="ck-sm" type="button" data-b="field">FIELD</button><button class="ck-sm" type="button" data-b="6">6</button><button class="ck-sm" type="button" data-b="8">8</button></div>`);
K.el(`<div class="ck-row"><button class="ck-go" type="button" id="dGo">ROLL</button></div>`);
const onTable = () => bets.pass + bets.dont + bets.field + bets.place[6] + bets.place[8];
const upd = () => { K.$('dPt').textContent = point || 'OFF'; K.$('dOn').textContent = K.fmt(onTable()); document.querySelectorAll('[data-b]').forEach(b => { const k = b.dataset.b, v = k === '6' || k === '8' ? bets.place[k] : bets[k]; b.classList.toggle('on', v > 0); b.title = v; }); };
document.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { if (busy || (tb.isLive() && phase !== 'bet')) return; const k = b.dataset.b;
  if ((k === 'pass' || k === 'dont') && point) { K.msg('Line bets go on before the point', 1300); return; } if ((k === '6' || k === '8') && !point) { K.msg('Place bets work once a point is set', 1300); return; }
  const v = chip.get(); if (!K.take(v)) return; if (k === '6' || k === '8') bets.place[k] += v; else bets[k] += v; tb.say('bet', { amt: v }); upd(); });
K.$('dGo').onclick = () => { if (busy) return; if (!onTable()) { K.msg('Put chips on PASS or FIELD', 1300); return; } K.$('dGo').disabled = true; tb.go(); };
function onResult(d) { busy = true; throwDice(d, () => { const before = onTable(), res = M.crapsRoll({ point }, bets, d); K.$('dR').textContent = d[0] + ' + ' + d[1] + ' = ' + res.total;
    /* stakes leaving the table */ let staked = 0; ['pass', 'dont', 'field'].forEach(k => { if (res.clear[k]) { staked += bets[k]; bets[k] = 0; } }); [6, 8].forEach(n => { if (res.clear['place' + n]) { staked += bets.place[n]; bets.place[n] = 0; } });
    const ret = res.ret; const placeWins = Object.values(res.out.place).reduce((a, b) => a + b, 0); if (placeWins) staked += 0;
    const hit = ret > staked;
    if (staked || ret) K.payout(staked, ret + (placeWins ? 0 : 0), new THREE.Vector3(0, .5, -.6), tb.isLive() ? 'net' : 'cpu'); else K.msg(res.total === 7 && !point ? 'SEVEN!' : String(res.total), 1000);
    if (placeWins && !staked) { /* place hits returned winnings only (bet stays up) */ }
    if (ret > staked) tb.say('won', { amt: ret - staked });
    if (!point && res.point) { K.msg('POINT IS ' + res.point, 1500); K.SFX.pop(5); }
    if (point && !res.point && res.total === point) { hot++; K.msg('🔥 POINT HIT! Hot roll ×' + hot, 1800, true); } if (res.total === 7 && point) hot = 0;
    point = res.point; setPuck(point); upd(); busy = false; K.$('dGo').disabled = false; void before; }); }
const tb = K.sharedRounds({ game: 'dice', betMs: 12000, goMs: 4000, roll: () => M.roll(), onResult, blurb: 'Open a table and share the code. The host is the shooter; everyone bets on the same dice.',
  onPhase: st => { phase = st ? st.phase : 'bet'; K.$('dTP').style.display = st ? '' : 'none'; }, onTick: (st, s) => K.$('dTm').textContent = st.phase === 'bet' ? s + 's' : '🎲' });
window.__game = { bet: (k) => document.querySelector(`[data-b="${k}"]`).click(), roll: () => K.$('dGo').click() };
upd(); K.start();
