// REALITY robot (owner Oct 20 8:50 PM: cars driving the wrong way, wrong-size cars, hockey skates floating).
// Measures the REALITY.md rules in the RUNNING game - numbers, not pictures. No AI, no usage.
//
// The game gives the robot a small hook (REALITY.md "Robot hook"):
//   window.__reality = {
//     kind: 'car' | 'f1' | 'truck' | 'person' | 'skater' | 'plane',   // what the player is
//     player: <THREE.Object3D>,               // the player's car / athlete / plane
//     others: [<THREE.Object3D>, ...],          // AI cars / opponents (optional)
//     contact: [<THREE.Object3D>, ...],         // nodes that must touch the ground: wheels, feet, skates (optional)
//     footOffset: 0.08,                         // for bones (no mesh): how far the bone sits above the sole (optional)
//     ground: (x, z) => y,                      // ground / ice height under a point (optional, default 0)
//     track: (x, z) => ({ x, z }),              // the right racing direction at a point, unit vector (optional)
//     go: (on) => {},                           // make the player move forward like a held GAS / RUN (optional)
//     expect: { length: [min, max], height: [min, max] }   // metres, overrides the kind defaults (optional)
//   }
// Missing hook = one CHECK line. Each broken rule = one FAIL line starting "REALITY:".

const SIZES = {             // metres, from REALITY.md (allow the range as written)
  f1:     { length: [4.8, 6.4] },
  car:    { length: [3.8, 5.6] },
  truck:  { height: [3.0, 4.5] },
  person: { height: [1.55, 2.15] },
  skater: { height: [1.55, 2.2] },
  plane:  { span: [6, 14] },
};

export async function realityCheck(page, wait) {
  const out = { fail: [], check: [], data: null };
  let has = false;
  try { has = await page.evaluate(() => !!(window.__reality && window.__reality.player)); } catch (e) {}
  if (!has) {
    out.check.push('No REALITY hook yet (window.__reality) - add it so the robot can measure direction, sizes and ground contact (REALITY.md "Robot hook")');
    return out;
  }
  try { await page.evaluate(() => { try { window.__reality.go && window.__reality.go(true); } catch (e) {} }); } catch (e) {}
  const samples = [];
  for (let i = 0; i < 12; i++) {
    await wait(400);
    try {
      samples.push(await page.evaluate(() => {
        const R = window.__reality, P = R.player;
        const wp = o => { o.updateMatrixWorld && o.updateMatrixWorld(true); const v = o.position.clone(); return o.parent ? o.parent.localToWorld(v) : v; };
        const box = (o, own) => {        // bounding box of every mesh under o (no global THREE needed); own = in o's own
          let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], n = 0;   // axes (true size even when turned), else world
          o.updateMatrixWorld && o.updateMatrixWorld(true);
          const inv = own ? o.matrixWorld.clone().invert() : null;
          o.traverse(m => {
            if (!m.geometry || !m.visible) return;
            if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
            const mw = own ? inv.clone().multiply(m.matrixWorld) : m.matrixWorld;
            const b = m.geometry.boundingBox.clone().applyMatrix4(mw);
            mn = [Math.min(mn[0], b.min.x), Math.min(mn[1], b.min.y), Math.min(mn[2], b.min.z)];
            mx = [Math.max(mx[0], b.max.x), Math.max(mx[1], b.max.y), Math.max(mx[2], b.max.z)]; n++;
          });
          return n ? { x: mx[0] - mn[0], y: mx[1] - mn[1], z: mx[2] - mn[2], minY: mn[1] } : null;
        };
        const g = (x, z) => { try { return R.ground ? +R.ground(x, z) : 0; } catch (e) { return 0; } };
        const p = wp(P);
        let fwd = null;
        try { const d = P.getWorldDirection(P.position.clone()); fwd = { x: d.x, z: d.z }; } catch (e) {}
        let tr = null;
        try { tr = R.track ? R.track(p.x, p.z) : null; } catch (e) {}
        const gaps = [];
        for (const c of (R.contact || [])) {
          try { const b = box(c); const q = wp(c); gaps.push(+((b ? b.minY : q.y - (+R.footOffset || 0)) - g(q.x, q.z)).toFixed(3)); } catch (e) {}
        }
        const others = (R.others || []).slice(0, 30).map(o => { try { const b = box(o, true); return b && { x: b.x, y: b.y, z: b.z }; } catch (e) { return null; } }).filter(Boolean);
        return { t: performance.now(), x: p.x, z: p.z, fwd, tr, size: box(P, true), gaps, others, kind: R.kind || '', expect: R.expect || null };
      }));
    } catch (e) { out.check.push('REALITY hook error: ' + String(e.message).slice(0, 100)); return out; }
  }
  try { await page.evaluate(() => { try { window.__reality.go && window.__reality.go(false); } catch (e) {} }); } catch (e) {}
  const s0 = samples[0], kind = (s0.kind || '').toLowerCase();
  const exp = Object.assign({}, SIZES[kind] || {}, s0.expect || {});
  // ---- size: the longest side for cars/planes, the height for people/trucks
  const sz = s0.size;
  if (sz) {
    const len = Math.max(sz.x, sz.z), ht = sz.y;
    const chk = (name, v, r) => { if (r && (v < r[0] || v > r[1])) out.fail.push(`REALITY: the player is the wrong size - ${name} ${v.toFixed(2)} m, real is ${r[0]}-${r[1]} m (REALITY.md sizes)`); };
    chk('length', len, exp.length); chk('height', ht, exp.height); chk('wing span', len, exp.span);
    const bad = (s0.others || []).filter(o => exp.length ? (Math.max(o.x, o.z) < exp.length[0] || Math.max(o.x, o.z) > exp.length[1]) : exp.height ? (o.y < exp.height[0] || o.y > exp.height[1]) : false);
    if (bad.length) out.fail.push(`REALITY: ${bad.length} of ${s0.others.length} opponents are the wrong size (REALITY.md sizes)`);
  }
  // ---- direction: moving the right way round, and facing the way it moves (no moonwalking / reversing)
  let moves = 0, wrongWay = 0, backwards = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
    if (d < 0.3) continue;
    moves++;
    const vx = dx / d, vz = dz / d;
    if (b.tr && Math.hypot(b.tr.x, b.tr.z) > 0.5 && vx * b.tr.x + vz * b.tr.z < 0) wrongWay++;
    if (b.fwd && Math.hypot(b.fwd.x, b.fwd.z) > 0.5) { const f = Math.hypot(b.fwd.x, b.fwd.z); if ((vx * b.fwd.x + vz * b.fwd.z) / f < -0.3) backwards++; }
  }
  if (moves >= 3 && wrongWay > moves / 2) out.fail.push(`REALITY: the player goes the WRONG WAY round the track (${wrongWay} of ${moves} moments against the track direction)`);
  if (moves >= 3 && backwards > moves / 2) out.fail.push(`REALITY: the player moves BACKWARDS - it travels opposite to where its model faces (flip the model or the movement)`);
  if (!moves) out.check.push('REALITY: the player did not move in 5 s with go(true) - add go() to the hook so the robot can drive/run');
  // ---- ground contact: wheels / feet / skates on the ground (gap under 3 cm, never sunk more than 5 cm)
  // Owner Oct 21 4:10 PM (Baseball G-100: a real sprint has BOTH feet off the ground mid-stride, 4-54 cm up): while the
  // player moves FAST (running, skating, driving) the rule is: the LOWEST foot/skate/wheel touches down (within 3 cm) at
  // least once every ~0.5 s, and nothing ever goes under the ground. Standing / walking keep the old rule (every reading).
  const gaps = samples.flatMap(s => s.gaps || []);
  if (gaps.length) {
    const sunk = gaps.filter(g => g < -0.05).length;
    if (sunk > gaps.length * 0.2) out.fail.push(`REALITY: wheels/feet/skates SINK into the ground (${sunk} of ${gaps.length} readings more than 5 cm under)`);
    const fast = [], slow = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i], prev = samples[i - 1];
      if (!(s.gaps || []).length) continue;
      const dt = prev ? Math.max(0.05, (s.t - prev.t) / 1000) : 0.4;
      const v = prev ? Math.hypot(s.x - prev.x, s.z - prev.z) / dt : 0;
      (v > 2 ? fast : slow).push({ low: Math.min(...s.gaps), t: s.t, v });
    }
    const slowGaps = slow.flatMap(s => [s.low]);
    const floating = slowGaps.filter(g => g > 0.03).length;
    if (slow.length >= 3 && floating > slow.length * 0.2)
      out.fail.push(`REALITY: wheels/feet/skates FLOAT above the ground while standing/walking (${floating} of ${slow.length} readings over 3 cm, highest ${Math.max(...slowGaps).toFixed(2)} m)`);
    if (fast.length >= 2) {
      let longest = 0, since = null;
      for (const f of fast) {
        if (f.low <= 0.03) since = f.t;
        else if (since != null) longest = Math.max(longest, (f.t - since) / 1000);
        else longest = Math.max(longest, 0.4);
      }
      const ever = fast.some(f => f.low <= 0.03);
      if (!ever || longest > 0.6)
        out.fail.push(`REALITY: feet/skates/wheels never touch down while moving fast - ${ever ? 'no touchdown for ' + longest.toFixed(1) + ' s' : 'no touchdown in ' + fast.length + ' fast readings'} (a sprint lands a foot at least every 0.5 s; lowest ${Math.min(...fast.map(f => f.low)).toFixed(2)} m)`);
    }
  } else out.check.push('REALITY: no contact nodes in the hook - list the wheels / feet / skates so the robot can check they touch the ground');
  out.data = { kind, size: sz, moves, wrongWay, backwards, gaps: gaps.length };
  return out;
}
