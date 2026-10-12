/* Hold'em Royale: No-Limit Texas Hold'em, 6-seat 3D table. Solo vs 5 bots, or a live table via mp.js room codes (up to 6 people,
   bots fill empty seats; the HOST runs the dealer engine). Buy-in 1,000 fun chips from the shared wallet, cash out any time.
   Side pots, showdown with best-5 (casino-math.js best7). FUN CHIPS ONLY. */
import { boot } from './casino-kit.js';
import { cardKit } from './cards3d.js';
const M = window.CMath;
const BUY = 1000, SB = 10, BB = 20, SEATS = 6, BOTN = ['Ruby', 'Ace', 'Vegas', 'Lucky', 'Duke', 'Kitty', 'Bluff', 'Jade'];
const K = await boot({ id: 'holdemroyale', title: "Hold'em Royale", accent: '#c9a45c', bloom: .5,
  rules: `<p>No-Limit Texas Hold'em. Blinds ${SB}/${BB}. Sit down with ${BUY} fun chips from your wallet; CASH OUT returns your stack to the wallet.</p><p>Make the best five-card hand from your two cards and the five on the board. Royal flush › straight flush › four of a kind › full house › flush › straight › three of a kind › two pair › pair › high card.</p><p><b>Live table</b>: open a table and share the code; up to 6 friends, bots fill empty seats. The table opener deals.</p>`,
  onBack: () => { cashOut(); },
  view: (p) => p ? { pos: [0, 12, 7.2], look: [0, 0, .6], fov: 50 } : { pos: [0, 6.6, 6.2], look: [0, 0, .2], fov: 42 } });
const { THREE, scene } = K;
K.backdrop({ carpet: '#1e1204', pattern: ['#c9a45c', '#8e1b2c', '#1f5f6e'], y: -1.2 }); K.setFloor(-1.2); K.lights({ c1: 0xffb400, c2: 0xff2b6b, key: 16, hemi: .35 });
const CK = cardKit(K, '#5e101c');
const felt = K.felt('#0f5a35', (g, w, h) => { g.textAlign = 'center'; g.font = 'italic 400 70px Georgia'; g.fillStyle = 'rgba(255,180,0,.45)'; g.fillText("Hold'em Royale", w / 2, h * .66); g.strokeStyle = 'rgba(255,214,102,.5)'; g.lineWidth = 5; g.beginPath(); g.roundRect(w * .22, h * .38, w * .56, h * .2, 30); g.stroke(); });
const tbl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .3, 64), [K.M.wood, felt, K.M.wood]); tbl.scale.set(3.2, 1, 2.1); felt.map.center.set(.5, .5); felt.map.rotation = Math.PI / 2; felt.normalMap.repeat.set(16, 10); tbl.position.y = -.15; const leg = new THREE.Mesh(new THREE.CylinderGeometry(.5, .9, 1.1, 24), K.M.wood); leg.position.y = -.75; scene.add(leg); tbl.receiveShadow = true; scene.add(tbl);
const rail = new THREE.Mesh(new THREE.TorusGeometry(1, .09, 16, 96), K.M.mat(0x2a0a0a, { roughness: .6 })); rail.rotation.x = -Math.PI / 2; rail.scale.set(3.25, 2.15, 1); scene.add(rail);
const glow = new THREE.Mesh(new THREE.TorusGeometry(1, .015, 8, 96), K.neon(0xffb400, 1.8)); glow.rotation.x = -Math.PI / 2; glow.scale.set(3.4, 2.3, 1); glow.position.y = -.2; scene.add(glow);
/* seat geometry: index 0 = bottom (me), then clockwise */
const SEATPOS = [[0, 1.75], [-2.55, 1.0], [-2.55, -1.0], [0, -1.75], [2.55, -1.0], [2.55, 1.0]].map(([x, z]) => new THREE.Vector3(x, 0, z));
const seatG = SEATPOS.map(p => { const g = new THREE.Group(); g.position.copy(p); scene.add(g); return g; });
/* ---------------- engine (runs on host / solo) ---------------- */
const rnd = (a) => a[M.int(a.length)];
function newState(players) { return { seats: Array.from({ length: SEATS }, () => null), board: [], pot: 0, stage: 'wait', toAct: -1, dealer: -1, curBet: 0, minRaise: BB, hand: 0, log: [], show: null, deck: [] }; }
function sitBot(st, i) { const used = st.seats.filter(Boolean).map(s => s.name); st.seats[i] = { key: 'bot' + i, name: rnd(BOTN.filter(n => !used.includes(n))) || 'Bot', bot: true, stack: BUY, bet: 0, tot: 0, cards: [], folded: true, allin: false, acted: false, out: false }; }
function live(st) { return st.seats.map((s, i) => s && !s.out && s.stack > 0 ? i : -1).filter(i => i >= 0); }
function nextIdx(st, i, f) { for (let k = 1; k <= SEATS; k++) { const j = (i + k) % SEATS, s = st.seats[j]; if (s && f(s, j)) return j; } return -1; }
function startHand(st) { st.seats.forEach((s, i) => { if (s && s.bot && s.stack < BB) s.stack = BUY; });
  const L = live(st); if (L.length < 2) { st.stage = 'wait'; return; }
  st.hand++; st.board = []; st.pot = 0; st.show = null; st.deck = M.deck(1); st.curBet = BB; st.minRaise = BB; st.log = [];
  st.seats.forEach((s, i) => { if (!s) return; s.bet = 0; s.tot = 0; s.allin = false; s.acted = false; s.folded = !(L.includes(i)); s.cards = s.folded ? [] : [st.deck.pop(), st.deck.pop()]; s.win = 0; s.best = ''; });
  st.dealer = nextIdx(st, st.dealer < 0 ? 0 : st.dealer, (s, j) => L.includes(j));
  const heads = L.length === 2, sb = heads ? st.dealer : nextIdx(st, st.dealer, (s, j) => L.includes(j)), bb = nextIdx(st, sb, (s, j) => L.includes(j));
  post(st, sb, SB); post(st, bb, BB); st.stage = 'pre'; st.toAct = nextIdx(st, bb, s => !s.folded && !s.allin); st.deadline = Date.now() + 25000; }
function post(st, i, n) { const s = st.seats[i]; const a = Math.min(n, s.stack); s.stack -= a; s.bet += a; s.tot += a; st.pot += a; if (!s.stack) s.allin = true; }
function act(st, i, type, amt) { if (st.toAct !== i || !['pre', 'flop', 'turn', 'river'].includes(st.stage)) return false; const s = st.seats[i], need = st.curBet - s.bet;
  if (type === 'fold') { s.folded = true; st.log.unshift(s.name + ' folds'); }
  else if (type === 'check' || (type === 'call' && need <= 0)) { if (need > 0) return false; st.log.unshift(s.name + ' checks'); }
  else if (type === 'call') { post(st, i, need); st.log.unshift(s.name + ' calls ' + Math.min(need, s.bet)); }
  else if (type === 'raise') { let to = Math.max(Math.round(amt || 0), st.curBet + st.minRaise); to = Math.min(to, s.bet + s.stack); const inc = to - st.curBet;
    post(st, i, to - s.bet); if (to > st.curBet) { if (inc >= st.minRaise) st.minRaise = inc; st.curBet = to; st.seats.forEach((o, j) => { if (o && j !== i) o.acted = false; }); } st.log.unshift(s.name + (s.allin ? ' ALL IN ' : ' raises to ') + to); }
  else return false;
  s.acted = true; st.log.length = Math.min(6, st.log.length); advance(st); return true; }
function advance(st) { const inH = st.seats.map((s, i) => s && !s.folded ? i : -1).filter(i => i >= 0);
  if (inH.length === 1) { const w = st.seats[inH[0]]; w.stack += st.pot; w.win = st.pot; st.show = { winners: [inH[0]], text: w.name + ' wins ' + st.pot, reveal: false }; st.pot = 0; st.stage = 'show'; st.toAct = -1; st.deadline = Date.now() + 3500; return; }
  const canAct = inH.filter(i => !st.seats[i].allin);
  const pending = canAct.filter(i => { const s = st.seats[i]; return !s.acted || s.bet < st.curBet; });
  if (pending.length && !(canAct.length === 1 && st.seats[canAct[0]].bet >= st.curBet)) { st.toAct = nextIdx(st, st.toAct, (s, j) => pending.includes(j)); st.deadline = Date.now() + 25000; return; }
  /* street over */
  st.seats.forEach(s => { if (s) { s.bet = 0; s.acted = false; } }); st.curBet = 0; st.minRaise = BB;
  const order = ['pre', 'flop', 'turn', 'river']; const k = order.indexOf(st.stage);
  if (k === 3) return showdown(st);
  st.stage = order[k + 1]; st.deck.pop(); if (st.stage === 'flop') st.board.push(st.deck.pop(), st.deck.pop(), st.deck.pop()); else st.board.push(st.deck.pop());
  if (canAct.length < 2) { st.toAct = -1; st.deadline = Date.now() + 1100; st.runout = true; return; }
  st.toAct = nextIdx(st, st.dealer, (s, j) => canAct.includes(j)); st.deadline = Date.now() + 25000; }
function showdown(st) { while (st.board.length < 5) st.board.push(st.deck.pop()); const inH = st.seats.map((s, i) => s && !s.folded ? i : -1).filter(i => i >= 0);
  const ev = {}; inH.forEach(i => { ev[i] = M.best7(st.seats[i].cards.concat(st.board)); st.seats[i].best = ev[i].name; });
  /* side pots by contribution level */ const lv = [...new Set(st.seats.filter(Boolean).map(s => s.tot).filter(x => x > 0))].sort((a, b) => a - b); let prev = 0, winners = new Set();
  lv.forEach(L => { let pot = 0; st.seats.forEach(s => { if (s) pot += Math.max(0, Math.min(s.tot, L) - prev); }); const elig = inH.filter(i => st.seats[i].tot >= L); if (!elig.length || !pot) { prev = L; return; }
    const best = Math.max(...elig.map(i => ev[i].score)), ws = elig.filter(i => ev[i].score === best); const share = Math.floor(pot / ws.length); ws.forEach((i, j) => { const a = share + (j === 0 ? pot - share * ws.length : 0); st.seats[i].stack += a; st.seats[i].win += a; winners.add(i); }); prev = L; });
  st.pot = 0; const W = [...winners]; st.show = { winners: W, text: W.map(i => st.seats[i].name).join(' & ') + ' win' + (W.length > 1 ? '' : 's') + ' with ' + ev[W[0]].name, reveal: true }; st.stage = 'show'; st.toAct = -1; st.deadline = Date.now() + 5000; }
/* bots: hand strength + pot odds + a little bluff */
function botMove(st, i) { const s = st.seats[i], need = st.curBet - s.bet; let str;
  if (!st.board.length) { const [a, b] = s.cards.map(c => c % 13), hi = Math.max(a, b), lo = Math.min(a, b), suited = ((s.cards[0] / 13) | 0) === ((s.cards[1] / 13) | 0); str = (a === b ? .5 + a / 26 : (hi + lo) / 26 * .7) + (suited ? .06 : 0) + (hi - lo === 1 ? .04 : 0); }
  else { const e = M.best7(s.cards.concat(st.board)); str = Math.min(1, .18 + e.cat * .16 + (e.cat === 1 && e.pairRank >= 9 ? .1 : 0)); }
  const r = M.rnd(), odds = need / (st.pot + need + 1);
  if (str > .75 && r < .7) return ['raise', st.curBet + Math.max(st.minRaise, Math.round(st.pot * (.5 + r) / 10) * 10)];
  if (need <= 0) return r < .12 + str * .2 ? ['raise', st.curBet + st.minRaise] : ['check'];
  if (str > odds + .15 || (need <= BB && str > .3) || r < .06) return ['call']; return ['fold']; }
/* ---------------- controller ---------------- */
let S = null, room = null, meKey = 'me', myName = 'You'; try { myName = localStorage.getItem('gc18_name') || 'You'; } catch (e) {}
const isHost = () => !room || room.isHost;
function push() { if (room) room.setState(JSON.parse(JSON.stringify(S))); render(); }
function hostTick() { if (!S || !isHost()) return; const now = Date.now();
  if (room) { /* seat new players, remove gone ones */ room.players.forEach(p => { if (!S.seats.some(s => s && s.key === p.key)) { let i = S.seats.findIndex(s => !s || (s.bot && s.folded) || (s.bot && S.stage === 'wait')); if (i < 0) i = S.seats.findIndex(s => s && s.bot); if (i >= 0) { S.seats[i] = { key: p.key, name: p.name, bot: false, stack: 0, bet: 0, tot: 0, cards: [], folded: true, allin: false, acted: false, out: true, pend: true }; push(); } } });
    S.seats.forEach((s, i) => { if (s && !s.bot && !room.players.some(p => p.key === s.key && p.on)) { if (s.left === undefined) s.left = now; if (now - s.left > 30000) { sitBot(S, i); push(); } } else if (s) delete s.left; }); }
  if (S.stage === 'wait' || (S.stage === 'show' && now > S.deadline)) { S.seats.forEach((s, i) => { if (s && s.leaving) sitBot(S, i); }); startHand(S); push(); return; }
  if (S.runout && now > S.deadline) { S.runout = false; S.toAct = -1; const L = S.seats.map((s, i) => s && !s.folded && !s.allin ? i : -1).filter(i => i >= 0); S.seats.forEach(s => s && (s.acted = true)); S.stage = S.stage; advanceRun(); return; }
  const s = S.seats[S.toAct]; if (!s) return;
  if (s.bot && now > (S.botAt || 0)) { if (!S.botAt) { S.botAt = now + 700 + M.int(900); return; } S.botAt = 0; const [t, a] = botMove(S, S.toAct); act(S, S.toAct, t, a) || act(S, S.toAct, 'fold'); push(); return; }
  if (!s.bot && now > S.deadline) { act(S, S.toAct, S.curBet > s.bet ? 'fold' : 'check'); push(); } }
function advanceRun() { const order = ['pre', 'flop', 'turn', 'river']; const k = order.indexOf(S.stage); if (k === 3) showdown(S); else { S.stage = order[k + 1]; S.deck.pop(); if (S.stage === 'flop') S.board.push(S.deck.pop(), S.deck.pop(), S.deck.pop()); else S.board.push(S.deck.pop()); S.runout = true; S.deadline = Date.now() + 1100; } push(); }
setInterval(hostTick, 200);
function onMsg(t, d, k) { if (!S) return; const i = S.seats.findIndex(s => s && s.key === k); if (i < 0) return; const s = S.seats[i];
  if (t === 'buyin' && s.pend) { s.stack = Math.min(BUY, +d.n || BUY); s.out = false; s.pend = false; push(); }
  if (t === 'act') { if (act(S, i, d.type, d.amt)) push(); }
  if (t === 'leave') { s.folded = true; s.leaving = true; if (S.toAct === i) advance(S); push(); } }
/* local seat / wallet */
let seated = false;
function mySeat() { return S ? S.seats.findIndex(s => s && s.key === meKey) : -1; }
function sitSolo() { if (!K.take(BUY)) return false; S = newState(); S.seats[0] = { key: meKey, name: myName, bot: false, stack: BUY, bet: 0, tot: 0, cards: [], folded: true, allin: false, acted: false, out: false }; for (let i = 1; i < SEATS; i++) sitBot(S, i); seated = true; savePending(); push(); return true; }
function savePending() { try { const i = mySeat(); localStorage.setItem('hr_pending', i >= 0 ? String(S.seats[i].stack + S.seats[i].bet * 0) : '0'); } catch (e) {} }
function cashOut() { const i = mySeat(); if (i >= 0 && seated) { const s = S.seats[i]; const n = s.stack; if (n > 0) K.give(n); s.stack = 0; seated = false; try { localStorage.setItem('hr_pending', '0'); } catch (e) {} if (room) room.send('leave', {}); } }
try { const p = +localStorage.getItem('hr_pending') || 0; if (p > 0) { Chips.give(p); localStorage.setItem('hr_pending', '0'); K.msg('Returned ' + K.fmt(p) + ' chips from your last table', 2200); } } catch (e) {}
addEventListener('pagehide', () => { if (seated) savePending(); });
/* ---------------- view ---------------- */
const boardM = [], seatViews = [];
const potL = { m: null, s: '' }; function setLbl(o, txt, parent, pos, opt) { if (o.s === txt) return; o.s = txt; if (o.m) parent.remove(o.m); if (!txt) { o.m = null; return; } o.m = K.label(txt, opt); o.m.position.copy(pos); o.m.rotation.x = -1.0; parent.add(o.m); }
for (let i = 0; i < SEATS; i++) seatViews.push({ name: { m: null, s: '' }, bet: { m: null, s: '' }, cards: [], key: '' });
const dealerBtn = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .05, 24), K.M.mat(0xffffff, { map: K.tex(64, 64, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#111'; g.font = '500 40px Georgia'; g.textAlign = 'center'; g.fillText('D', 32, 46); }) })); scene.add(dealerBtn);
const turnRing = new THREE.Mesh(new THREE.TorusGeometry(.62, .03, 8, 48), K.neon(0xffd21f, 2.4)); turnRing.rotation.x = -Math.PI / 2; scene.add(turnRing);
let lastHand = -1, lastBoard = 0;
const view = (i) => { const me = Math.max(0, mySeat()); return (i - me + SEATS) % SEATS; };
function render() { if (!S) return; const me = mySeat();
  if (S.hand !== lastHand) { lastHand = S.hand; boardM.forEach(m => scene.remove(m)); boardM.length = 0; lastBoard = 0; seatViews.forEach(v => { v.cards.forEach(c => seatG[0].parent.remove(c)); v.cards = []; v.dealt = false; }); }
  while (lastBoard < S.board.length) { const k = lastBoard++; const m = CK.make(null); m.set(S.board[k]); m.scale.setScalar(.85); m.position.set(0, 1.2, -2.5); m.rotation.x = Math.PI / 2; scene.add(m); boardM.push(m); CK.fly(m, new THREE.Vector3(-1.2 + k * .6, .03, -.15), 420, true, (k % 3) * 120); }
  S.seats.forEach((s, i) => { const v = seatViews[i], g = seatG[view(i)], p = g.position;
    setLbl(v.name, s ? (s.name + ' · ' + K.fmt(s.stack) + (s.allin ? ' ALL-IN' : '')) : 'empty', scene, p.clone().add(new THREE.Vector3(0, .25, Math.sign(p.z) * .5 || .5)), { size: .27, bg: s && S.show && S.show.winners.includes(i) ? '#b8860b' : s && s.folded ? '#2a2030' : 'rgba(20,8,30,.9)', color: '#fff' });
    setLbl(v.bet, s && s.bet ? K.fmt(s.bet) : '', scene, p.clone().multiplyScalar(.62).add(new THREE.Vector3(0, .12, 0)), { size: .2, bg: '#c9a45c', color: '#2a1400', stroke: '#fff3c4' });
    if (s && s.cards.length && !v.dealt && !s.folded) { v.dealt = true; s.cards.forEach((c, j) => { const m = CK.make(null); m.scale.setScalar(view(i) === 0 ? 1 : .7); m.position.set(0, 1, -.2); m.rotation.x = Math.PI / 2; scene.add(m); v.cards.push(m); CK.fly(m, p.clone().multiplyScalar(.78).add(new THREE.Vector3((j - .5) * (view(i) === 0 ? .55 : .4), .04 + j * .003, 0)), 380, false, (i * 2 + j) * 80); }); }
    const reveal = i === me || (S.show && S.show.reveal && !s.folded);
    v.cards.forEach((m, j) => { if (!s || s.folded) { m.visible = false; return; } m.visible = true; if (reveal && m.userData.c !== s.cards[j]) { m.set(s.cards[j]); } m.rotation.x = reveal ? -Math.PI / 2 : Math.PI / 2; }); });
  setLbl(potL, S.pot ? 'POT ' + K.fmt(S.pot) : '', scene, new THREE.Vector3(0, .2, .55), { size: .3, bg: '#14081e', color: '#c9a45c' });
  if (S.dealer >= 0) dealerBtn.position.copy(seatG[view(S.dealer)].position).multiplyScalar(.7).add(new THREE.Vector3(.55, .03, 0));
  turnRing.visible = S.toAct >= 0; if (S.toAct >= 0) turnRing.position.copy(seatG[view(S.toAct)].position).multiplyScalar(.78).add(new THREE.Vector3(0, .02, 0));
  if (S.show && S.show.text !== render.lastShow) { render.lastShow = S.show.text; const mine = me >= 0 && S.show.winners.includes(me); K.msg(S.show.text, 2600, mine); if (mine) { K.SFX.win(S.seats[me].win > BB * 20); K.burst(seatG[0].position.clone().add(new THREE.Vector3(0, .5, 0)), 40); K.record('w', room ? 'net' : 'cpu'); } else if (me >= 0 && S.seats[me] && S.seats[me].tot) K.record('l', room ? 'net' : 'cpu'); }
  if (seated) savePending(); hud(); }
/* hud */
K.el(`<div class="ck-row"><div class="ck-pill" style="min-width:150px"><small id="hS">TABLE</small><b id="hInfo">–</b></div><div class="ck-pill"><small>STACK</small><b id="hStack">–</b></div></div>`);
const bar = K.el(`<div class="ck-row"><button class="ck-sm" type="button" id="hFold" style="background:#5a1a2a">FOLD</button><button class="ck-sm" type="button" id="hCall">CHECK</button><button class="ck-sm" type="button" id="hR1">+½ POT</button><button class="ck-sm" type="button" id="hR2">POT</button><button class="ck-sm" type="button" id="hAll" style="background:#8e1b2c">ALL IN</button></div>`);
K.el(`<div class="ck-row"><button class="ck-go" type="button" id="hSit">SIT DOWN · ${BUY}</button><button class="ck-sm hide" type="button" id="hOut">CASH OUT</button></div>`);
function send(type, amt) { const me = mySeat(); if (me < 0) return; K.SFX.chip(); if (room && !room.isHost) room.send('act', { type, amt }); else { if (act(S, me, type, amt)) push(); } }
K.$('hFold').onclick = () => send('fold'); K.$('hCall').onclick = () => { const s = S.seats[mySeat()]; send(S.curBet > s.bet ? 'call' : 'check'); };
K.$('hR1').onclick = () => send('raise', S.curBet + Math.max(S.minRaise, Math.round(S.pot / 2 / 10) * 10)); K.$('hR2').onclick = () => send('raise', S.curBet + Math.max(S.minRaise, S.pot));
K.$('hAll').onclick = () => { const s = S.seats[mySeat()]; send('raise', s.bet + s.stack); };
K.$('hSit').onclick = () => { if (room) { if (!K.take(BUY)) return; seated = true; room.send('buyin', { n: BUY }); K.$('hSit').classList.add('hide'); return; } if (!seated && sitSolo()) K.SFX.win(false); };
K.$('hOut').onclick = () => { cashOut(); if (!room) { S = null; resetView(); } hud(); };
function resetView() { seatViews.forEach(v => { v.cards.forEach(c => scene.remove(c)); v.cards = []; v.dealt = false; [v.name, v.bet].forEach(o => { if (o.m) scene.remove(o.m); o.m = null; o.s = ''; }); }); boardM.forEach(m => scene.remove(m)); boardM.length = 0; if (potL.m) scene.remove(potL.m); potL.m = null; potL.s = ''; lastHand = -1; turnRing.visible = false; }
function hud() { const me = mySeat(), s = me >= 0 && S ? S.seats[me] : null, my = s && S.toAct === me && seated && !s.pend;
  bar.style.display = my ? '' : 'none'; K.$('hSit').classList.toggle('hide', seated); K.$('hOut').classList.toggle('hide', !seated);
  K.$('hStack').textContent = s ? K.fmt(s.stack) : '–'; K.$('hS').textContent = room ? 'TABLE ' + room.code : 'SOLO VS BOTS';
  K.$('hInfo').textContent = !S ? 'Sit down to play' : my ? 'Your move' : S.stage === 'show' ? 'Next hand…' : S.toAct >= 0 && S.seats[S.toAct] ? S.seats[S.toAct].name + '…' : S.stage === 'wait' ? 'Waiting for players' : S.stage.toUpperCase();
  if (my) { const need = S.curBet - s.bet; K.$('hCall').textContent = need > 0 ? 'CALL ' + K.fmt(Math.min(need, s.stack)) : 'CHECK'; if (s.best === '' && S.board.length) {} } }
setInterval(() => { if (S && S.toAct === mySeat() && seated) { const left = Math.max(0, Math.ceil((S.deadline - Date.now()) / 1000)); if (left <= 8) K.$('hInfo').textContent = 'Your move · ' + left + 's'; } }, 500);
/* live table */
const T = K.table({ game: 'holdem', max: 6, blurb: 'Open a Hold\'em table and share the code. Up to 6 players; bots fill the empty seats. The table opener deals.',
  onRoom: (r) => { if (seated && !room) cashOut(); S = null; resetView(); room = r; meKey = r.me; seated = false;
    if (r.isHost) { S = newState(); for (let i = 1; i < SEATS; i++) sitBot(S, i); S.seats[0] = null; push(); }
    r.on('state', st => { if (!r.isHost) { S = st; render(); } }); r.on('msg', onMsg); r.on('host', () => { S = r.state; }); if (r.state) { S = r.state; render(); } hud(); K.$('ckTab').classList.remove('on'); },
  onLeave: () => { cashOut(); room = null; meKey = 'me'; S = null; resetView(); hud(); } });
K.onFrame((dt, t) => { turnRing.scale.setScalar(1 + Math.sin(t * 6) * .05); });
window.__game = { sit: () => K.$('hSit').click(), state: () => S, call: () => K.$('hCall').click() };
hud(); K.start();
