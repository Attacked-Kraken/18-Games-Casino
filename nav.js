/* Coarse walkability grid + A* for NPC crowd navigation. Cells are tested against the floor's own collide() so tables,
   slot banks, columns, walls and the hall/wing outlines are all respected. Paths are string-pulled for natural lines. */
export function createNav(collide, B = { x0: -46, x1: 46, z0: -66, z1: 63 }, cs = .7) {
  const W = Math.ceil((B.x1 - B.x0) / cs), D = Math.ceil((B.z1 - B.z0) / cs), G = new Uint8Array(W * D);
  const cx = (i) => B.x0 + (i + .5) * cs, cz = (j) => B.z0 + (j + .5) * cs;
  for (let j = 0; j < D; j++) for (let i = 0; i < W; i++) { const x = cx(i), z = cz(j), r = collide(x, z); G[j * W + i] = Math.hypot(r[0] - x, r[1] - z) < .02 ? 1 : 0; }
  const ok = (i, j) => i >= 0 && j >= 0 && i < W && j < D && G[j * W + i] === 1;
  const cell = (x, z) => [Math.floor((x - B.x0) / cs), Math.floor((z - B.z0) / cs)];
  function nearest(x, z) { const [i0, j0] = cell(x, z); for (let r = 0; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; if (ok(i0 + di, j0 + dj)) return [i0 + di, j0 + dj]; } return null; }
  const free = (x, z) => { const [i, j] = cell(x, z); return ok(i, j); };
  function los(ax, az, bx, bz) { const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / (cs * .4)); for (let k = 1; k < n; k++) { const t = k / n; if (!free(ax + (bx - ax) * t, az + (bz - az) * t)) return false; } return true; }
  const gS = new Float32Array(W * D), from = new Int32Array(W * D), seen = new Uint32Array(W * D); let stamp = 0;
  function path(ax, az, bx, bz) { const s = nearest(ax, az), e = nearest(bx, bz); if (!s || !e) return null; stamp++; const S = s[1] * W + s[0], E = e[1] * W + e[0];
    const heap = [], push = (f, n) => { heap.push([f, n]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } },
      pop = () => { const top = heap[0], l = heap.pop(); if (heap.length) { heap[0] = l; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const h = (n) => Math.hypot(n % W - e[0], ((n / W) | 0) - e[1]); seen[S] = stamp; gS[S] = 0; from[S] = -1; push(h(S), S); let it = 0, found = false;
    while (heap.length && it++ < 20000) { const [, n] = pop(); if (n === E) { found = true; break; } const i = n % W, j = (n / W) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (!ok(ni, nj) || (di && dj && (!ok(i + di, j) || !ok(i, j + dj)))) continue;
        const m = nj * W + ni, g = gS[n] + (di && dj ? 1.414 : 1); if (seen[m] === stamp && gS[m] <= g) continue; seen[m] = stamp; gS[m] = g; from[m] = n; push(g + h(m), m); } }
    if (!found) return null; const pts = []; for (let n = E; n !== -1; n = from[n]) pts.push([cx(n % W), cz((n / W) | 0)]); pts.reverse(); pts.push([bx, bz]);
    const out = [[ax, az]]; let k = 0; while (k < pts.length - 1) { let f = pts.length - 1; while (f > k + 1 && !los(out[out.length - 1][0], out[out.length - 1][1], pts[f][0], pts[f][1])) f--; out.push(pts[f]); k = f; } out.shift(); return out; }
  function random(rnd, pred) { for (let t = 0; t < 400; t++) { const i = Math.floor(rnd() * W), j = Math.floor(rnd() * D); if (ok(i, j) && ok(i + 1, j) && ok(i - 1, j) && ok(i, j + 1) && ok(i, j - 1) && (!pred || pred(cx(i), cz(j)))) return [cx(i), cz(j)]; } return null; }
  return { path, random, free, nearest: (x, z) => { const c = nearest(x, z); return c && [cx(c[0]), cz(c[1])]; }, los, W, D, cs, G, B };
}
