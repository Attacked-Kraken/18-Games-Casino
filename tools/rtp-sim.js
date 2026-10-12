/* RTP check for the new 18 Games Casino games: exact math where possible, Monte Carlo otherwise. node tools/rtp-sim.js */
const M = require('../casino-math.js'); const N = +process.argv[2] || 400000; const out = {};
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
out.roulette = { exact: 36 / 37 };
for (const r of ['low', 'mid', 'high']) out['plinko_' + r] = { exact: M.PLINKO[r].reduce((s, m, k) => s + m * C(12, k) / 4096, 0) };
out.keno = {}; for (let p = 1; p <= 10; p++) out.keno[p] = M.KENO_PAY[p].reduce((s, m, h) => s + m * C(p, h) * C(80 - p, 20 - h) / C(80, 20), 0);
out.bigwheel = Object.fromEntries(M.BW_SEG.map(s => [s.k, s.n * (s.pay + 1) / 50]));
out.crash = { exact: 0.97, note: 'P(crash >= x) = 0.97/x for any target x' };
{ let shoe = [], r = { player: 0, banker: 0, tie: 0 }; for (let i = 0; i < N; i++) { const h = M.bacDeal(shoe); for (const b in r) r[b] += M.bacReturn(b, h.win, 1); } for (const b in r) r[b] /= N; out.baccarat = r; }
{ const bets = { pass: 0, dont: 0, field: 0 }; let st = { point: 0 };
  // pass / dont per resolved decision; field per roll; place 6/5/4 per resolution
  let pr = 0, pn = 0, dr = 0, fr = 0, fn = 0; const pl = { 4: [0, 0], 5: [0, 0], 6: [0, 0] };
  for (let i = 0; i < N * 3; i++) { const d = M.roll(), t = d[0] + d[1], had = st.point;
    const res = M.crapsRoll(st, { pass: 1, dont: 1, field: 1, place: had ? { 4: 10, 5: 10, 6: 12 } : {} }, d);
    fr += res.out.field; fn++;
    if (res.clear.pass) { pr += res.out.pass; dr += res.out.dont; pn++; }
    if (had) for (const k of [4, 5, 6]) { const s = k === 6 ? 12 : 10; if (t === k) { pl[k][0] += res.out.place[k] + s; pl[k][1] += s; } else if (t === 7) { pl[k][1] += s; } }
    st.point = res.point; }
  out.craps = { pass: pr / pn, dontPass_inclPush: dr / pn, field: fr / fn, place4_10: pl[4][0] / pl[4][1], place5_9: pl[5][0] / pl[5][1], place6_8: pl[6][0] / pl[6][1] }; }
{ let ret = 0; const n = N / 2; for (let i = 0; i < n; i++) { const d = M.deck(); const h = d.slice(0, 5), hold = M.vpHint(h); let k = 5; const f = h.map((c, j) => hold.includes(j) ? c : d[k++]); ret += M.vpPay(f, 5).mult; } out.videopoker = { simpleStrategy: ret / n, optimalTheory: 0.9730 }; }
{ let t = 0, hit = 0, mx = 0; for (let i = 0; i < N; i++) { const r = M.crSpin(); t += r.total; if (r.total) hit++; mx = Math.max(mx, r.total); } out.candyrush = { rtp: t / N, hitRate: hit / N, max: mx, scale: M.CR_SCALE }; }
console.log(JSON.stringify(out, null, 1));
