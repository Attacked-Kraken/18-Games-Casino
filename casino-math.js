/* cm1 2026-10-11 (owner: "10 new casino games, fair documented odds"): the rules, paytables and random draws for the new
   18 Games Casino games, in one plain file so the same code runs in the game and in the RTP simulator (tools/rtp-sim.js).
   FUN CHIPS ONLY. Randomness: crypto.getRandomValues (unbiased), never seeded or steered by the player's balance. */
(function (root) {
  var cr = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null, buf = new Uint32Array(64), bi = 64;
  function u32() { if (!cr) return Math.floor(Math.random() * 4294967296); if (bi >= 64) { cr.getRandomValues(buf); bi = 0; } return buf[bi++]; }
  var M = {};
  M.rnd = function () { return (u32() + u32() / 4294967296) / 4294967296; };          /* [0,1) */
  M.int = function (n) { var lim = 4294967296 - (4294967296 % n), x; do { x = u32(); } while (x >= lim); return x % n; }; /* unbiased 0..n-1 */
  M.shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = M.int(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

  /* ---------------- cards: 0..51, rank = c % 13 (0 = 2 ... 12 = A), suit = c / 13 | 0 (0 ♠ 1 ♥ 2 ♦ 3 ♣) ---------------- */
  M.deck = function (n) { var d = []; for (var k = 0; k < (n || 1); k++) for (var i = 0; i < 52; i++) d.push(i); return M.shuffle(d); };
  M.RANKS = '23456789TJQKA'; M.SUITS = ['♠', '♥', '♦', '♣'];
  M.cardName = function (c) { return (M.RANKS[c % 13] === 'T' ? '10' : M.RANKS[c % 13]) + M.SUITS[(c / 13) | 0]; };
  var HN = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush', 'Royal flush'];
  M.HAND_NAMES = HN;
  /* 5-card evaluation -> { cat 0..9, score (bigger wins), name } */
  M.eval5 = function (cs) {
    var r = cs.map(function (c) { return c % 13; }).sort(function (a, b) { return b - a; }), s = cs.map(function (c) { return (c / 13) | 0; });
    var flush = s.every(function (x) { return x === s[0]; }), cnt = {}, i;
    r.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; });
    var groups = Object.keys(cnt).map(Number).sort(function (a, b) { return cnt[b] - cnt[a] || b - a; });
    var uniq = groups.length === 5, hi = r[0], straight = false;
    if (uniq && r[0] - r[4] === 4) straight = true;
    if (uniq && r[0] === 12 && r[1] === 3 && r[4] === 0) { straight = true; hi = 3; }
    var cat;
    if (straight && flush) cat = hi === 12 ? 9 : 8;
    else if (cnt[groups[0]] === 4) cat = 7;
    else if (cnt[groups[0]] === 3 && cnt[groups[1]] === 2) cat = 6;
    else if (flush) cat = 5; else if (straight) cat = 4;
    else if (cnt[groups[0]] === 3) cat = 3;
    else if (cnt[groups[0]] === 2 && cnt[groups[1]] === 2) cat = 2;
    else if (cnt[groups[0]] === 2) cat = 1; else cat = 0;
    var kick = straight ? [hi] : groups, sc = cat;
    for (i = 0; i < 5; i++) sc = sc * 16 + (kick[i] == null ? 0 : kick[i]);
    return { cat: cat, score: sc, name: HN[cat], pairRank: cat === 1 ? groups[0] : -1 };
  };
  M.best7 = function (cs) { var best = null, n = cs.length, idx = [];
    (function rec(st, pick) { if (pick.length === 5) { var five = pick.map(function (i) { return cs[i]; }), e = M.eval5(five); e.cards = five; if (!best || e.score > best.score) best = e; return; }
      for (var i = st; i < n; i++) rec(i + 1, pick.concat(i)); })(0, idx);
    return best; };

  /* ---------------- Diamond Poker: Jacks or Better, 8/5 paytable (97.30% with optimal holds) ---------------- */
  M.VP_PAY = [['Royal flush', 250, 800], ['Straight flush', 50], ['Four of a kind', 25], ['Full house', 8], ['Flush', 5], ['Straight', 4], ['Three of a kind', 3], ['Two pair', 2], ['Jacks or better', 1]];
  M.vpPay = function (cs, coins) { var e = M.eval5(cs); var m = 0;
    if (e.cat === 9) m = coins === 5 ? 800 : 250; else if (e.cat === 8) m = 50; else if (e.cat === 7) m = 25; else if (e.cat === 6) m = 8; else if (e.cat === 5) m = 5;
    else if (e.cat === 4) m = 4; else if (e.cat === 3) m = 3; else if (e.cat === 2) m = 2; else if (e.cat === 1 && e.pairRank >= 9) m = 1;
    return { mult: m, name: m ? (e.cat === 1 ? 'Jacks or better' : e.name) : '' }; };
  /* a simple strong hold strategy (used for the HOLD hint and the simulator; ~0.5% below perfect play) */
  M.vpHint = function (cs) {
    var r = cs.map(function (c) { return c % 13; }), s = cs.map(function (c) { return (c / 13) | 0; }), e = M.eval5(cs), all = [0, 1, 2, 3, 4];
    var cnt = {}; r.forEach(function (x) { cnt[x] = (cnt[x] || 0) + 1; });
    var idx = function (f) { return all.filter(f); };
    if (e.cat >= 4 && e.cat !== 7) return all;
    if (e.cat === 7) return idx(function (i) { return cnt[r[i]] === 4; });
    var bySuit = [0, 1, 2, 3].map(function (q) { return idx(function (i) { return s[i] === q; }); });
    var royal4 = bySuit.map(function (g) { return g.filter(function (i) { return r[i] >= 8; }); }).filter(function (g) { return g.length >= 4; })[0];
    if (royal4) return royal4;
    if (e.cat === 3) return idx(function (i) { return cnt[r[i]] === 3; });
    var sf4 = null; bySuit.forEach(function (g) { if (g.length >= 4) { for (var lo = -1; lo <= 8; lo++) { var w = g.filter(function (i) { var v = r[i] === 12 && lo === -1 ? -1 : r[i]; return v >= lo && v <= lo + 4; }); if (w.length >= 4) sf4 = w.slice(0, 4); } } });
    if (sf4) return sf4;
    if (e.cat === 2) return idx(function (i) { return cnt[r[i]] === 2; });
    if (e.cat === 1 && e.pairRank >= 9) return idx(function (i) { return cnt[r[i]] === 2; });
    var royal3 = bySuit.map(function (g) { return g.filter(function (i) { return r[i] >= 8; }); }).filter(function (g) { return g.length === 3; })[0];
    if (royal3) return royal3;
    var fl4 = bySuit.filter(function (g) { return g.length === 4; })[0]; if (fl4) return fl4;
    if (e.cat === 1) return idx(function (i) { return cnt[r[i]] === 2; });
    /* open-ended 4 to a straight */
    var u = Object.keys(cnt).map(Number).sort(function (a, b) { return a - b; });
    for (var lo2 = 0; lo2 <= 9; lo2++) { var run = [lo2, lo2 + 1, lo2 + 2, lo2 + 3]; if (lo2 <= 8 && run.every(function (v) { return cnt[v]; })) { var pick = [], seen = {}; all.forEach(function (i) { if (run.indexOf(r[i]) >= 0 && !seen[r[i]]) { seen[r[i]] = 1; pick.push(i); } }); return pick; } }
    var hi = idx(function (i) { return r[i] >= 9; });
    var hs = bySuit.map(function (g) { return g.filter(function (i) { return r[i] >= 9; }); }).filter(function (g) { return g.length >= 2; })[0]; if (hs) return hs.slice(0, 2);
    if (hi.length) return hi.sort(function (a, b) { return r[a] - r[b]; }).slice(0, 2);
    return [];
  };

  /* ---------------- Ruby Roulette: single-zero European wheel, 97.30% on every bet ---------------- */
  M.RL_WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  M.RL_RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  M.rlColor = function (n) { return n === 0 ? 'green' : M.RL_RED.indexOf(n) >= 0 ? 'red' : 'black'; };
  /* bet = { k: 'n'|'split'|'street'|'corner'|'line'|'red'|'black'|'odd'|'even'|'low'|'high'|'dozen'|'col', nums:[...] } -> numbers covered; pays 36/len - 1 to 1 */
  M.rlCover = function (k, v) { var a = [], i;
    if (k === 'n') return [v];
    if (k === 'red') return M.RL_RED.slice(); if (k === 'black') { for (i = 1; i <= 36; i++) if (M.RL_RED.indexOf(i) < 0) a.push(i); return a; }
    if (k === 'odd' || k === 'even') { for (i = 1; i <= 36; i++) if (i % 2 === (k === 'odd' ? 1 : 0)) a.push(i); return a; }
    if (k === 'low' || k === 'high') { for (i = k === 'low' ? 1 : 19; i <= (k === 'low' ? 18 : 36); i++) a.push(i); return a; }
    if (k === 'dozen') { for (i = v * 12 + 1; i <= v * 12 + 12; i++) a.push(i); return a; }
    if (k === 'col') { for (i = v + 1; i <= 36; i += 3) a.push(i); return a; }
    return v; /* split/street/corner/line pass the array of numbers */ };
  M.rlPayout = function (cover, stake, n) { return cover.indexOf(n) >= 0 ? stake * (36 / cover.length) : 0; }; /* total returned incl. stake */
  M.rlSpin = function () { return M.int(37); };

  /* ---------------- Baccarat Noir: 8-deck shoe, standard drawing rules. Banker pays 0.95:1, Player 1:1, Tie 9:1 (pushes main bets) */
  M.bacVal = function (c) { var r = c % 13; return r >= 8 && r <= 11 ? 0 : r === 12 ? 1 : r + 2; };
  M.bacDeal = function (shoe) {
    var d = function () { if (shoe.length < 6) { var n = M.deck(8); shoe.length = 0; Array.prototype.push.apply(shoe, n); } return shoe.pop(); };
    var p = [d(), d()], b = [d(), d()], tot = function (h) { return h.reduce(function (s, c) { return s + M.bacVal(c); }, 0) % 10; };
    var pt = tot(p), bt = tot(b), p3 = null;
    if (pt < 8 && bt < 8) {
      if (pt <= 5) { p3 = d(); p.push(p3); }
      var v = p3 == null ? -1 : M.bacVal(p3), bt2 = tot(b), draw;
      if (p3 == null) draw = bt2 <= 5;
      else draw = bt2 <= 2 || (bt2 === 3 && v !== 8) || (bt2 === 4 && v >= 2 && v <= 7) || (bt2 === 5 && v >= 4 && v <= 7) || (bt2 === 6 && (v === 6 || v === 7));
      if (draw) b.push(d());
    }
    pt = tot(p); bt = tot(b);
    return { p: p, b: b, pt: pt, bt: bt, win: pt > bt ? 'player' : bt > pt ? 'banker' : 'tie' };
  };
  M.bacReturn = function (bet, win, stake) { if (bet === 'tie') return win === 'tie' ? stake * 10 : 0;
    if (win === 'tie') return stake; if (bet === win) return bet === 'banker' ? stake * 1.95 : stake * 2; return 0; };

  /* ---------------- Dice Palace: craps. Pass/Don't Pass (bar 12), Field (2 pays 2:1, 12 pays 3:1), Place 6/8 7:6, 5/9 7:5, 4/10 19:10 */
  M.roll = function () { return [1 + M.int(6), 1 + M.int(6)]; };
  M.PLACE = { 4: 1.9, 5: 1.4, 6: 7 / 6, 8: 7 / 6, 9: 1.4, 10: 1.9 };
  /* resolve one roll: state {point}, bets {pass, dont, field, place:{4..10}} -> { ret: total returned, cleared: {...}, point } */
  M.crapsRoll = function (st, bets, d) {
    var t = d[0] + d[1], ret = 0, out = { pass: 0, dont: 0, field: 0, place: {} }, clr = {}, point = st.point || 0;
    if (bets.field) { var f = t === 2 ? 3 : t === 12 ? 4 : [3, 4, 9, 10, 11].indexOf(t) >= 0 ? 2 : 0; ret += bets.field * f; out.field = bets.field * f; clr.field = 1; }
    if (point) Object.keys(bets.place || {}).forEach(function (k) { var s = bets.place[k]; if (!s) return; k = +k;
      if (t === k) { var w = Math.floor(s * M.PLACE[k]); ret += w; out.place[k] = w; /* place bet stays up */ }
      else if (t === 7) { clr['place' + k] = 1; } });
    if (!point) {
      if (t === 7 || t === 11) { ret += (bets.pass || 0) * 2; out.pass = (bets.pass || 0) * 2; clr.pass = clr.dont = 1; }
      else if (t === 2 || t === 3 || t === 12) { var dr = t === 12 ? (bets.dont || 0) : (bets.dont || 0) * 2; ret += dr; out.dont = dr; clr.pass = clr.dont = 1; }
      else point = t;
    } else {
      if (t === point) { ret += (bets.pass || 0) * 2; out.pass = (bets.pass || 0) * 2; clr.pass = clr.dont = 1; point = 0; }
      else if (t === 7) { ret += (bets.dont || 0) * 2; out.dont = (bets.dont || 0) * 2; clr.pass = clr.dont = 1; point = 0; }
    }
    return { ret: ret, out: out, clear: clr, point: point, total: t };
  };

  /* ---------------- Plinko Drop: 12 rows, binomial bins, three risk levels ---------------- */
  M.PLINKO = {
    low:  [10, 3, 1.6, 1.4, 1.1, .95, .5, .95, 1.1, 1.4, 1.6, 3, 10],
    mid:  [24, 9, 4, 2, 1.2, .6, .2, .6, 1.2, 2, 4, 9, 24],
    high: [140, 24, 7.4, 2, .7, .2, .2, .2, .7, 2, 7.4, 24, 140]
  };
  M.plinkoPath = function (rows) { var p = []; for (var i = 0; i < (rows || 12); i++) p.push(M.int(2)); return p; }; /* 0 left 1 right; bin = sum */

  /* ---------------- Rocket Crash: crash point = 0.97 / (1 - U), 1.00x means instant bust; 97% for any cash-out target ---------------- */
  M.crashPoint = function () { var u = M.rnd(), x = 0.97 / (1 - u); x = Math.floor(x * 100) / 100; return Math.max(1, Math.min(x, 10000)); };
  M.crashAt = function (t) { return Math.pow(Math.E, 0.11 * t); }; /* multiplier after t seconds of flight */

  /* ---------------- Lucky Keno: 80 balls, 20 drawn, pick 1-10. KENO_PAY[picks][hits] = total return per 1 chip staked ---------------- */
  M.KENO_PAY = {
    1: [0, 3.85], 2: [0, 1, 9.6], 3: [0, 0, 2.2, 47], 4: [0, 0, 1.7, 6.9, 97], 5: [0, 0, 1.1, 3.2, 16, 315], 6: [0, 0, 0, 2.3, 9.2, 69, 1400],
    7: [0, 0, 0, .9, 5.6, 24, 280, 3750], 8: [0, 0, 0, 0, 3.3, 15, 100, 835, 8350], 9: [0, 0, 0, 0, 1.6, 7.8, 39, 310, 3100, 15500],
    10: [2.8, 0, 0, 0, 0, 4.6, 18, 140, 925, 4600, 23100]
  };
  M.kenoDraw = function () { var a = []; for (var i = 1; i <= 80; i++) a.push(i); return M.shuffle(a).slice(0, 20); };

  /* ---------------- Big Wheel: 50 segments, every bet returns 96% ---------------- */
  M.BW_SEG = [{ k: '1', pay: 1, n: 24, c: '#e9dfc8' }, { k: '3', pay: 3, n: 12, c: '#1d3f7a' }, { k: '5', pay: 5, n: 8, c: '#7a1424' }, { k: '11', pay: 11, n: 4, c: '#0f5a3e' },
    { k: 'JOKER', pay: 47, n: 1, c: '#141414' }, { k: 'STAR', pay: 47, n: 1, c: '#9a6a18' }];
  M.bwLayout = function () { /* fixed, spread-out order of the 50 segments */
    var order = []; var pat = ['1', '3', '1', '5', '1', '3', '1', '11', '1', '3', '1', '5'], cnt = {}; M.BW_SEG.forEach(function (s) { cnt[s.k] = s.n; });
    for (var i = 0; order.length < 48; i++) { var k = pat[i % pat.length]; if (cnt[k] > 0) { order.push(k); cnt[k]--; } else { var alt = ['1', '3', '5', '11'].filter(function (q) { return cnt[q] > 0; })[0]; order.push(alt); cnt[alt]--; } }
    order.splice(12, 0, 'JOKER'); order.splice(37, 0, 'STAR'); return order; };
  M.bwSpin = function () { return M.int(50); };

  /* ---------------- Candy Rush: 6x5 tumbling scatter-pays slot. 8+ of a candy anywhere pays; winners pop and new candy falls ---------------- */
  M.CR_SYM = [ /* weight, pays for 8-9 / 10-11 / 12+ (× total bet) */
    { k: 'heart', w: 4, p: [10, 25, 100], c: '#ff2b6b' }, { k: 'star', w: 6, p: [2.5, 10, 25], c: '#ffb800' }, { k: 'gumdrop', w: 8, p: [2, 5, 15], c: '#9b4dff' },
    { k: 'swirl', w: 10, p: [1.5, 2, 12], c: '#00d2a8' }, { k: 'drop', w: 12, p: [1, 1.5, 10], c: '#2b8bff' }, { k: 'bean', w: 14, p: [.8, 1.2, 8], c: '#7ad400' },
    { k: 'mint', w: 16, p: [.5, 1, 5], c: '#00c6ff' }, { k: 'drop2', w: 17, p: [.4, .9, 4], c: '#ff6a00' }
  ];
  M.CR_SCALE = .985; /* tuned by tools/rtp-sim.js */
  var crTot = M.CR_SYM.reduce(function (s, x) { return s + x.w; }, 0);
  M.crSym = function () { var r = M.int(crTot); for (var i = 0; i < M.CR_SYM.length; i++) { r -= M.CR_SYM[i].w; if (r < 0) return i; } return 0; };
  M.crGrid = function () { var g = []; for (var c = 0; c < 6; c++) { g.push([]); for (var r = 0; r < 5; r++) g[c].push(M.crSym()); } return g; }; /* g[col][row], row 0 = top */
  M.crPay = function (k, n) { var p = M.CR_SYM[k].p; return n >= 12 ? p[2] : n >= 10 ? p[1] : n >= 8 ? p[0] : 0; };
  /* one full spin with tumbles -> { steps:[{grid, wins:[{k,n,pay,cells}], drops}], total } (total is × bet) */
  M.crSpin = function () { var g = M.crGrid(), steps = [], total = 0;
    for (var guard = 0; guard < 40; guard++) {
      var counts = {}; g.forEach(function (col, c) { col.forEach(function (k, r) { (counts[k] = counts[k] || []).push([c, r]); }); });
      var wins = []; Object.keys(counts).forEach(function (k) { var n = counts[k].length, p = M.crPay(+k, n) * M.CR_SCALE; if (p > 0) wins.push({ k: +k, n: n, pay: p, cells: counts[k] }); });
      var snap = g.map(function (c) { return c.slice(); });
      if (!wins.length) { steps.push({ grid: snap, wins: [] }); break; }
      var hit = {}; wins.forEach(function (w) { total += w.pay; w.cells.forEach(function (x) { hit[x[0] + ',' + x[1]] = 1; }); });
      steps.push({ grid: snap, wins: wins });
      g = g.map(function (col, c) { var keep = col.filter(function (_, r) { return !hit[c + ',' + r]; }), add = []; while (add.length + keep.length < 5) add.push(M.crSym()); return add.concat(keep); });
    }
    return { steps: steps, total: total };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.CMath = M;
})(typeof window !== 'undefined' ? window : this);
