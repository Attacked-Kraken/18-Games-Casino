/* Diamond Poker: Jacks or Better video poker, 8/5 paytable (casino-math.js), 3D cabinet deck with tap-to-hold cards, HOLD hint,
   double-up (pick a higher card) for juice. FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
import { cardKit } from './cards3d.js';
const M = window.CMath;
const K = await boot({ id: 'diamondpoker', title: 'Diamond Poker', accent: '#1f5f6e', bloom: .5,
  rules: `<p>Jacks or Better. DEAL five cards, tap the ones to HOLD, then DRAW. Max bet (5 coins) pays 800 for a Royal Flush.</p><table><tr><th>Hand</th><th>Pays ×coins</th></tr>${M.VP_PAY.map(r => `<tr><td>${r[0]}</td><td>${r[2] ? r[1] + ' (' + r[2] + ' at 5)' : r[1]}</td></tr>`).join('')}</table><p>Returns 97.3% with the HINT strategy. Double up: after a win, pick a card higher than the dealer's to double it.</p>`,
  view: (p) => p ? { pos: [0, 9.6, 5.2], look: [0, 0, -.1], fov: 46 } : { pos: [0, 4.4, 3.2], look: [0, 0, .1], fov: 40 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#06142a', pattern: ['#1f5f6e', '#4a1f5e', '#c9a45c'] }); K.lights({ c1: 0x2bc8ff, c2: 0x9b4dff, key: 16, hemi: .3 });
const CK = cardKit(K, '#1b2a52');
/* cabinet deck */
const deck = K.rbox(4.2, 2.4, .3, .2, K.felt('#0a2d6b', (g, w, h) => { g.fillStyle = 'rgba(201,164,92,.3)'; g.font = '400 90px Georgia'; g.textAlign = 'center'; g.fillText('◆ DIAMOND POKER ◆', w / 2, h * .9); }));
deck.rotation.x = -Math.PI / 2; deck.position.set(0, -.15, .2); scene.add(deck);
const trim = new THREE.Mesh(new THREE.TorusGeometry(1, .015, 8, 4), K.neon(0x2bc8ff, 1.6)); trim.rotation.set(-Math.PI / 2, 0, Math.PI / 4); trim.scale.set(3.0, 1.75, 1); trim.position.set(0, .02, .2); scene.add(trim);
/* paytable board */
const pt = K.tex(1024, 420, (g, w, h) => { g.fillStyle = '#0a0808'; g.beginPath(); g.roundRect(0, 0, w, h, 4); g.fill(); g.strokeStyle = '#b08d57'; g.lineWidth = 3; g.stroke();
  g.font = '400 32px Georgia'; M.VP_PAY.forEach((r, i) => { const y = 52 + i * 41; g.fillStyle = i === 0 ? '#e8d3a0' : '#c9b48a'; g.textAlign = 'left'; g.fillText(r[0].toUpperCase(), 40, y);
    g.textAlign = 'right'; g.fillStyle = '#fff'; [1, 2, 3, 4, 5].forEach((c, j) => g.fillText(c === 5 && r[2] ? r[2] * 5 : r[1] * c, 600 + j * 92, y)); }); });
const board = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.48), new THREE.MeshBasicMaterial({ map: pt, toneMapped: true })); board.position.set(0, .7, -1.3); board.rotation.x = -.6; scene.add(board);
/* cards */
const slots = [-1.6, -.8, 0, .8, 1.6].map(x => new THREE.Vector3(x, .03, .55));
let hand = [], cards = [], held = [false, false, false, false, false], stage = 'idle', deckArr = [], coins = 5, lastWin = 0;
const holdLbls = slots.map(s => { const l = K.label('HELD', { size: .2, glow: 2.2, color: '#c9a45c', stroke: '#3a2600' }); l.rotation.x = -Math.PI / 2; l.position.set(s.x, .05, s.z + .62); l.visible = false; scene.add(l); return l; });
for (let i = 0; i < 5; i++) { const m = CK.make(null); m.position.copy(slots[i]); m.rotation.x = Math.PI / 2; scene.add(m); cards.push(m); }
/* hud */
const chip = K.chipPicker([1, 5, 25, 100, 500]);
K.el(`<div class="ck-row"><div class="ck-pill"><small>COINS</small><b id="pC">5</b></div><div class="ck-pill"><small>BET</small><b id="pB">5</b></div><div class="ck-pill" style="min-width:130px"><small>HAND</small><b id="pH">–</b></div></div>`);
K.el(`<div class="ck-row"><button class="ck-sm" type="button" id="pCoin">BET ONE</button><button class="ck-sm" type="button" id="pHint">Hint</button><button class="ck-sm hide" type="button" id="pDbl">×2 DOUBLE</button><button class="ck-go" type="button" id="pGo">DEAL</button></div>`);
const bet = () => coins * chip.get();
const upd = () => { K.$('pC').textContent = coins; K.$('pB').textContent = K.fmt(bet()); };
chip.el.addEventListener('click', upd);
K.$('pCoin').onclick = () => { if (stage === 'hold') return; coins = coins % 5 + 1; K.SFX.click(); upd(); };
function toggle(i) { if (stage !== 'hold') return; held[i] = !held[i]; holdLbls[i].visible = held[i]; cards[i].position.y = held[i] ? .12 : .03; K.SFX.click(); }
K.canvas.addEventListener('pointerdown', e => { const h = K.pick(e, cards); if (h.length) toggle(cards.indexOf(h[0].object)); });
K.$('pHint').onclick = () => { if (stage !== 'hold') return; const keep = M.vpHint(hand); for (let i = 0; i < 5; i++) if (held[i] !== keep.includes(i)) toggle(i); };
const name = () => { const p = M.vpPay(hand, coins); return p.mult ? p.name : M.eval5(hand).name; };
async function deal() { if (!K.take(bet())) return; stage = 'busy'; deckArr = M.deck(1); hand = deckArr.splice(0, 5); held = [false, false, false, false, false]; holdLbls.forEach(l => l.visible = false); K.$('pDbl').classList.add('hide');
  await Promise.all(cards.map((m, i) => { m.position.set(0, 1.4, -1); m.rotation.x = Math.PI / 2; m.set(hand[i]); return CK.fly(m, slots[i], 360, true, i * 90); }));
  stage = 'hold'; K.$('pGo').textContent = 'DRAW'; const p = M.vpPay(hand, coins); K.$('pH').textContent = p.mult ? p.name : '–'; if (p.mult) K.SFX.pop(3); }
async function draw() { stage = 'busy'; const flies = []; for (let i = 0; i < 5; i++) if (!held[i]) { hand[i] = deckArr.shift(); const m = cards[i]; m.position.set(0, 1.4, -1); m.rotation.x = Math.PI / 2; m.set(hand[i]); flies.push(CK.fly(m, slots[i], 340, true, flies.length * 110)); }
  await Promise.all(flies); const p = M.vpPay(hand, coins), ret = p.mult * chip.get(); K.$('pH').textContent = p.mult ? p.name : M.eval5(hand).name;
  if (ret) { K.msg(p.name.toUpperCase(), 1400, p.mult >= 25); } K.payout(bet(), ret, new THREE.Vector3(0, .6, .5)); lastWin = ret;
  stage = 'idle'; K.$('pGo').textContent = 'DEAL'; K.$('pDbl').classList.toggle('hide', !ret); }
/* double up: dealer card vs your pick of 4 face-down; higher doubles, tie pushes */
K.$('pDbl').onclick = async () => { if (stage !== 'idle' || !lastWin || !K.take(lastWin)) return; K.$('pDbl').classList.add('hide'); stage = 'busy'; const d = M.deck(1);
  holdLbls.forEach(l => l.visible = false); cards.forEach(c => { c.rotation.x = Math.PI / 2; c.position.y = .03; }); cards[0].set(d[0]); cards[0].rotation.x = -Math.PI / 2; K.$('pH').textContent = 'Pick a higher card';
  for (let i = 1; i < 5; i++) cards[i].set(d[i]);
  const pick = await new Promise(res => { const f = e => { const h = K.pick(e, cards.slice(1)); if (h.length) { K.canvas.removeEventListener('pointerdown', f); res(cards.indexOf(h[0].object)); } }; K.canvas.addEventListener('pointerdown', f); window.__pick = res; });
  await CK.fly(cards[pick], cards[pick].position.clone(), 300, true); const a = d[0] % 13, b = d[pick] % 13; const ret = b > a ? lastWin * 2 : b === a ? lastWin : 0;
  K.payout(lastWin, ret, cards[pick].position.clone()); lastWin = ret > lastWin ? ret : 0; K.$('pH').textContent = b > a ? 'Doubled!' : b === a ? 'Tie' : 'Lost it'; stage = 'idle'; K.$('pDbl').classList.toggle('hide', !lastWin); };
K.$('pGo').onclick = () => { if (stage === 'idle') deal(); else if (stage === 'hold') draw(); };
window.__game = { go: () => K.$('pGo').click(), hint: () => K.$('pHint').click() };
upd(); K.start();
