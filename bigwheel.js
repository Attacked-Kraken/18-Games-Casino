/* Big Wheel: 50-segment money wheel (casino-math.js, every bet ~96%), giant 3D lit wheel with bulbs and a ticking clapper,
   live tables via mp.js (host spins once for everyone). FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
import * as BU from './bet-ui.js';
const M = window.CMath;
const SEG = M.BW_SEG, LAY = M.bwLayout(), N = LAY.length, step = Math.PI * 2 / N;
const K = await boot({ id: 'bigwheel', title: 'Big Wheel', accent: '#c9a45c', bloom: .6, fog: [30, 70],
  rules: `<p>Bet on the symbol you think the pointer will stop on, then SPIN.</p><table><tr><th>Symbol</th><th>Segments</th><th>Pays</th></tr>${SEG.map(s => `<tr><td>${s.k}</td><td>${s.n}</td><td>${s.pay}:1</td></tr>`).join('')}</table><p>Live table: everyone bets during the countdown; one spin for the whole table.</p>`,
  view: (p) => p ? { pos: [0, 2.8, 16], look: [0, 3.0, 0], fov: 46 } : { pos: [0, 3, 9.5], look: [0, 3.2, 0], fov: 44 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#1e1004', pattern: ['#c9a45c', '#8e1b2c', '#1f5f6e'], y: -1 }); K.setFloor(-1); K.lights({ c1: 0xffd21f, c2: 0xff3fa4, key: 18, keyPos: [1, 6, 9], target: [0, 3, 0] });
const C = new THREE.Vector3(0, 3.6, 0), RAD = 2.9;
const wheel = new THREE.Group(); wheel.position.copy(C); scene.add(wheel);
const tex = K.tex(1024, 1024, (g, w, h) => { const cx = w / 2, cy = h / 2; for (let i = 0; i < N; i++) { const s = SEG.find(x => x.k === LAY[i]), a0 = -Math.PI / 2 + i * step - step / 2;
    g.fillStyle = s.c; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 512, a0, a0 + step); g.closePath(); g.fill(); g.strokeStyle = '#3a2000'; g.lineWidth = 3; g.stroke();
    g.save(); g.translate(cx, cy); g.rotate(a0 + step / 2 + Math.PI / 2); g.fillStyle = s.k === '1' ? '#2a1f12' : '#efe2c6'; g.textAlign = 'center'; g.font = s.k.length > 2 ? '500 26px Georgia' : '500 52px Georgia';
    if (s.k.length > 2) { g.fillStyle = '#fff'; g.fillText(s.k === 'JOKER' ? '🃏' : '⭐', 0, -440); g.font = '500 20px Georgia'; g.fillText(s.k, 0, -400); } else g.fillText(s.k, 0, -430); g.restore(); }
  g.fillStyle = '#0d0a0a'; g.beginPath(); g.arc(cx, cy, 300, 0, 7); g.fill(); g.strokeStyle = '#b08d57'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#d9bf85'; g.font = 'italic 400 80px Georgia'; g.textAlign = 'center'; g.fillText('BIG', cx, cy - 10); g.fillText('WHEEL', cx, cy + 70); });
const face = new THREE.Mesh(new THREE.CircleGeometry(RAD, 100), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xe8e8e8 })); face.position.z = .16; wheel.add(face);
const backD = new THREE.Mesh(new THREE.CylinderGeometry(RAD + .1, RAD + .1, .3, 100), K.M.wood); backD.rotation.x = Math.PI / 2; wheel.add(backD);
for (let i = 0; i < N; i++) { const a = i * step + step / 2, p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .16, 8), K.M.chrome); p.rotation.x = Math.PI / 2; p.position.set(Math.sin(a) * (RAD - .05), Math.cos(a) * (RAD - .05), .24); wheel.add(p); }
const rim = new THREE.Mesh(new THREE.TorusGeometry(RAD + .2, .14, 16, 120), K.M.gold); scene.add(rim); rim.position.copy(C);
const bulbs = []; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2, b = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), K.neon(i % 2 ? 0xffd21f : 0xff3fa4, 2.2)); b.position.set(C.x + Math.sin(a) * (RAD + .2), C.y + Math.cos(a) * (RAD + .2), .16); scene.add(b); bulbs.push(b); }
const stand = new THREE.Mesh(new THREE.CylinderGeometry(.25, .7, 4.6, 24), K.M.gold); stand.position.set(0, 1.0, -.5); scene.add(stand);
const clap = new THREE.Mesh(new THREE.ConeGeometry(.16, .55, 4), K.candy('#8e1b2c')); clap.rotation.z = Math.PI; clap.position.set(0, C.y + RAD + .32, .3); scene.add(clap);
let ang = 0, spinning = false, anim = null, lastSeg = 0;
K.onFrame((dt, t) => { if (anim) anim(); wheel.rotation.z = ang; bulbs.forEach((b, i) => b.visible = spinning ? ((i + Math.floor(t * 12)) % 3 !== 0) : ((i + Math.floor(t * 2)) % 2 === 0) || true);
  const seg = Math.floor(((ang % (Math.PI * 2)) + Math.PI * 2) / step); if (seg !== lastSeg) { lastSeg = seg; if (spinning) { K.SFX.tick(); clap.rotation.z = Math.PI + .5; } } clap.rotation.z += (Math.PI - clap.rotation.z) * .25; });
/* segment i sits at angle i*step clockwise from top; with wheel.rotation.z = ang (ccw), the top pointer shows segment i when ang = i*step */
function spinTo(i, done) { spinning = true; const a0 = ang, target = a0 + Math.PI * 2 * 5 + (((i * step - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) + (Math.random() - .5) * step * .7; const t0 = performance.now(), T = 5500;
  anim = () => { const k = Math.min(1, (performance.now() - t0) / T), e = 1 - Math.pow(1 - k, 4); ang = a0 + (target - a0) * e; if (k >= 1) { anim = null; spinning = false; done(); } }; K.SFX.whoosh(); }
/* hud */
const chip = K.chipPicker([10, 25, 100, 500, 1000]);
const bets = {}; SEG.forEach(s => bets[s.k] = 0);
const row = K.el(`<div class="ck-row"></div>`);
SEG.forEach(s => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ck-sm'; b.style.background = s.c; b.style.color = s.k === '1' ? '#2a1f12' : '#efe2c6'; b.style.minWidth = '50px'; b.innerHTML = `${s.k === 'JOKER' ? 'Joker' : s.k === 'STAR' ? 'Star' : s.k}<br><small style="font-size:9px" id="bw${s.k}">${s.pay}:1</small>`; b.style.height = '60px'; b.style.position = 'relative'; b.id = 'bwS' + s.k; b.style.lineHeight = '1';
  b.onclick = () => { if (spinning || (tb.isLive() && phase !== 'bet')) return; const v = chip.get(); if (!K.take(v)) return; bets[s.k] += v; tb.say('bet', { amt: v }); upd(); }; row.appendChild(b); });
K.el(`<div class="ck-row"><div class="ck-pill"><small>BET</small><b id="bwT">0</b></div><div class="ck-pill" id="bwTP" style="display:none"><small>SPIN IN</small><b id="bwTm"></b></div><button class="ck-sm" type="button" id="bwC">Clear</button><button class="ck-go" type="button" id="bwGo">SPIN</button></div>`);
const total = () => Object.values(bets).reduce((a, b) => a + b, 0);
function upd() { SEG.forEach(s => BU.stackOn(K.$('bwS' + s.k), bets[s.k])); K.$('bwT').textContent = K.fmt(total()); SEG.forEach(s => K.$('bw' + s.k).textContent = bets[s.k] ? K.fmt(bets[s.k]) : s.pay + ':1'); }
K.$('bwC').onclick = () => { if (spinning) return; K.give(total()); SEG.forEach(s => bets[s.k] = 0); upd(); };
let last = null;
K.$('bwGo').onclick = () => { if (spinning) return; if (!total()) { if (last && K.take(Object.values(last).reduce((a, b) => a + b, 0))) { Object.assign(bets, last); upd(); } else { K.msg('Bet on a symbol', 1200); return; } } K.$('bwGo').disabled = true; tb.go(); };
function onResult(i) { spinTo(i, () => { const k = LAY[i], s = SEG.find(x => x.k === k); K.msg(k === 'JOKER' ? 'Joker' : k === 'STAR' ? 'Star' : k, 1500, s.pay >= 11);
    const st = total(); if (st) { const ret = bets[k] ? bets[k] * (s.pay + 1) : 0; BU.glow([K.$('bwS' + k)]); BU.settle(SEG.filter(x => bets[x.k]).map(x => ({ el: K.$('bwS' + x.k), win: x.k === k }))); BU.banner(st, ret); K.payout(st, ret, C.clone().add(new THREE.Vector3(0, RAD, .5)), tb.isLive() ? 'net' : 'cpu'); if (ret > st) tb.say('won', { amt: ret - st }); last = { ...bets }; }
    SEG.forEach(x => bets[x.k] = 0); K.$('bwT').textContent = '0'; K.$('bwGo').disabled = false; }); }
let phase = 'bet';
const tb = K.sharedRounds({ game: 'bw', betMs: 15000, goMs: 9000, roll: () => M.bwSpin(), onResult, blurb: 'Open a table and share the code. Everyone bets during the countdown; one spin for the whole table.',
  onPhase: st => { phase = st ? st.phase : 'bet'; K.$('bwTP').style.display = st ? '' : 'none'; }, onTick: (st, s) => K.$('bwTm').textContent = st.phase === 'bet' ? s + 's' : '…' });
window.__game = { bet: (k) => { bets[k] += 10; Chips.take(10); upd(); }, spin: () => K.$('bwGo').click() };
upd(); K.start();
