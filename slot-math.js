/* slot-math.js: pure math for the themed 5x3 video slots (no DOM). 10 fixed lines; symbols 0-3 low, 4-6 high, 7 WILD, 8 BONUS
   (scatter / coin). Bonus kinds: 'free' (free spins x2), 'wheel' (bonus wheel w/ jackpots), 'hold' (hold & spin coins w/ jackpots),
   'expand' (expanding wild respins, Gem Burst) + 'wheel' on scatters. Jackpots are multiples of the total bet (+ progressive pool in the UI).
   FUN CHIPS ONLY. */
export const LINES = [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[1,0,1,2,1]];
export const JP = { MINI: 20, MINOR: 50, MAJOR: 250, GRAND: 1000 };
export const BASE_PAY = [[0,0,5,12,40],[0,0,5,12,40],[0,0,6,15,50],[0,0,6,15,50],[0,0,10,30,100],[0,0,15,50,150],[0,0,25,100,400],[0,0,40,150,750],[0,0,0,0,0]];
export const WEIGHTS = [8, 8, 7, 7, 5, 4, 3, 1.4, 1.6];
export const WHEEL = [['x', 5, 14], ['x', 8, 12], ['x', 10, 11], ['x', 15, 8], ['x', 20, 6], ['x', 30, 4], ['x', 50, 2.5], ['x', 100, 1], ['MINI', 0, 3.5], ['MINOR', 0, 1.8], ['MAJOR', 0, .5], ['GRAND', 0, .1]];
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
export function makeStrips(o = {}) { const w = o.weights || WEIGHTS, len = 40, strips = [];
  for (let r = 0; r < 5; r++) { const R = rng(1000 + r * 77 + (o.seed || 0)); let s = [];
    const tot = w.reduce((a, b) => a + b, 0); w.forEach((x, i) => { let n = Math.round(x / tot * len); if ((i === 7 && o.kind === 'expand' && (r === 0 || r === 4))) n = 0; if (i === 7 && o.kind === 'expand' && r > 0 && r < 4) n = Math.max(1, n); for (let k = 0; k < n; k++) s.push(i); });
    for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } strips.push(s); }
  return strips; }
export function evalLines(grid, pay, scale) { /* grid[c][r] */ const wins = [];
  LINES.forEach((L, li) => { let sym = -1, n = 0; for (let c = 0; c < 5; c++) { const s = grid[c][L[c]]; if (s === 8) break; if (s === 7) { n++; continue; } if (sym < 0) { sym = s; n++; } else if (s === sym) n++; else break; }
    if (sym < 0) sym = 7; /* all wilds */
    let wildRun = 0; for (let c = 0; c < 5; c++) { if (grid[c][L[c]] === 7) wildRun++; else break; }
    let p = n >= 3 ? pay[sym][n - 1] : 0, s2 = sym, n2 = n; const pw = wildRun >= 3 ? pay[7][wildRun - 1] : 0; if (pw > p) { p = pw; s2 = 7; n2 = wildRun; }
    if (p > 0) wins.push({ line: li, sym: s2, n: n2, pay: p * scale }); });
  return wins; }
export function countSym(grid, s) { let n = 0; grid.forEach((col) => col.forEach((x) => { if (x === s) n++; })); return n; }
export function spinGrid(strips, R = Math.random, stops) { const st = stops || strips.map((s) => Math.floor(R() * s.length)); return { stops: st, grid: strips.map((s, c) => [0, 1, 2].map((r) => s[(st[c] + r) % s.length])) }; }
export function wheelSpin(R = Math.random) { const tot = WHEEL.reduce((a, w) => a + w[2], 0); let x = R() * tot; for (let i = 0; i < WHEEL.length; i++) { x -= WHEEL[i][2]; if (x <= 0) return i; } return 0; }
export const COIN_VALS = [[1, 30], [2, 25], [3, 15], [5, 12], [10, 6], ['MINI', 3], ['MINOR', 1.2]];
export function coinVal(R = Math.random) { const tot = COIN_VALS.reduce((a, c) => a + c[1], 0); let x = R() * tot; for (const c of COIN_VALS) { x -= c[1]; if (x <= 0) return c[0]; } return 1; }
export const jpMul = (v) => (typeof v === 'string' ? JP[v] : v);
/* full round in bet multiples (no UI): returns {win (x bet), parts} */
export function playRound(G, R = Math.random) {
  const { strips, kind, scale } = G; let total = 0;
  let sp = spinGrid(strips, R); let grid = sp.grid; const lw = evalLines(grid, G.pay, scale); total += lw.reduce((a, w) => a + w.pay, 0) / 10;
  const sc = countSym(grid, 8);
  if (kind === 'expand') { let held = [0, 0, 0, 0, 0], g = grid, guard = 0; while (guard++ < 3) { let nw = false; for (let c = 1; c < 4; c++) if (!held[c] && g[c].includes(7)) { held[c] = 1; nw = true; } if (!nw) break;
      const ns = spinGrid(strips, R).grid; for (let c = 0; c < 5; c++) if (held[c]) ns[c] = [7, 7, 7]; g = ns; total += evalLines(g, G.pay, scale).reduce((a, w) => a + w.pay, 0) / 10; } }
  if (sc >= 3 && (kind === 'free')) { let n = { 3: 8, 4: 12, 5: 20 }[Math.min(5, sc)] || 20; while (n-- > 0) { const g = spinGrid(strips, R).grid; total += 2 * evalLines(g, G.pay, scale).reduce((a, w) => a + w.pay, 0) / 10; if (countSym(g, 8) >= 3) n += 5; } }
  if (sc >= 3 && (kind === 'wheel' || kind === 'expand')) { const w = WHEEL[wheelSpin(R)]; total += w[0] === 'x' ? w[1] * (sc - 2) : JP[w[0]]; }
  if (kind === 'hold' && sc >= 6) { const cells = Array(15).fill(null); grid.forEach((col, c) => col.forEach((s, r) => { if (s === 8) cells[c * 3 + r] = coinVal(R); }));
    let left = 3; while (left > 0 && cells.some((x) => x === null)) { left--; for (let i = 0; i < 15; i++) if (cells[i] === null && R() < G.holdP) { cells[i] = coinVal(R); left = 3; } }
    total += cells.reduce((a, v) => a + (v === null ? 0 : jpMul(v)), 0) + (cells.every((x) => x !== null) ? JP.GRAND : 0); }
  return total;
}
