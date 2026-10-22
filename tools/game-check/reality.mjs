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
//     time: () => seconds,                      // the GAME's clock (optional; owner Oct 21 5:26 PM - a busy robot computer
//                                               //   stretches wall time and would call a sprint "walking"; game time can't)
//     speed: () => metresPerSecond,             // the game's own player speed (optional; wins over the robot's estimate)
//     gait: () => 'stand'|'walk'|'run',         // what the player is doing now (optional; wins over speed - owner Oct 21)
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
        for (const c of (R.contact || [])) {   // the LOWEST point of the whole foot (toe/sole), never the ankle bone itself
          try {
            const b = box(c); const q = wp(c); let low = b ? b.minY : Infinity;
            if (!b) {
              // Advisor Oct 21 2026 10:55 PM (ONE robot job: Racer wheels 48/48 "sinking" + Baseball feet "sinking" were
              // the same measuring mistake): the ground point of a contact node is MEASURED, never assumed.
              //  (1) a plain marker node (not a bone, nothing under it - e.g. the Racer's 4 tyre points) IS the contact point;
              //  (2) a bone (foot / ankle) is measured on the SKINNED BODY: the lowest posed vertex the body skins to that
              //      bone (or the bones under it) = the real sole, whatever the rig's toe bones or the hook's footOffset say;
              //  (3) only when no skinned body is found: lowest bone under it minus footOffset (or the rig's 0.08 m).
              let lowest = q.y, bones = 0, isBone = false;
              c.traverse && c.traverse(n => { try { if (n.isBone) { bones++; isBone = true; } const w = wp(n); if (w.y < lowest) lowest = w.y; } catch (e) {} });
              let sole = null;
              if (isBone) {
                try {
                  if (!c.__sole) {                // once per node: which skinned meshes + vertices belong to this foot
                    const ids = new Set(); c.traverse(n => { if (n.isBone) ids.add(n.uuid); });
                    const list = [];
                    P.traverse(m => {
                      if (!m.isSkinnedMesh || !m.skeleton || !m.geometry || !m.geometry.attributes.skinIndex) return;
                      const bi = m.skeleton.bones.map((bn, i) => ids.has(bn.uuid) ? i : -1).filter(i => i >= 0);
                      if (!bi.length) return;
                      const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, vs = [];
                      for (let v = 0; v < si.count; v++) {
                        let w = 0; for (let k = 0; k < 4; k++) if (bi.includes(si.getComponent(v, k))) w += sw.getComponent(v, k);
                        if (w > 0.5) vs.push(v);
                      }
                      const step = Math.max(1, Math.ceil(vs.length / 500));
                      if (vs.length) list.push({ m, vs: vs.filter((_, i) => i % step === 0) });
                    });
                    c.__sole = list;
                  }
                  for (const { m, vs } of c.__sole) {
                    if (!m.visible) continue;
                    m.updateMatrixWorld(true); m.skeleton.update && m.skeleton.update();
                    const v = c.position.clone();
                    for (const i of vs) { m.getVertexPosition(i, v); m.localToWorld(v); if (sole == null || v.y < sole) sole = v.y; }
                  }
                } catch (e) { sole = null; }
              }
              if (sole != null) { low = sole; R.__measuredSole = true; }
              else if (!isBone) low = lowest;     // a marker node: no offset at all
              else {
                const off = R.footOffset != null ? +R.footOffset : (bones <= 1 ? 0.08 : 0);
                low = lowest - off;
                if (R.footOffset == null && bones <= 1) R.__assumedOffset = true;
              }
            }
            gaps.push(+(low - g(q.x, q.z)).toFixed(3));
          } catch (e) {}
        }
        const assumed = !!R.__assumedOffset;
        let gt = null; try { if (R.time) gt = +R.time(); } catch (e) {}
        let gs = null; try { if (R.speed) gs = +R.speed(); } catch (e) {}
        let ga = ''; try { if (R.gait) ga = String(R.gait() || '').toLowerCase(); } catch (e) {}
        const others = (R.others || []).slice(0, 30).map(o => { try { const b = box(o, true); return b && { x: b.x, y: b.y, z: b.z }; } catch (e) { return null; } }).filter(Boolean);
        return { t: (gt != null && isFinite(gt)) ? gt : performance.now() / 1000, gameTime: gt != null && isFinite(gt), speed: (gs != null && isFinite(gs)) ? gs : null, assumed,
          gait: ga, x: p.x, z: p.z, fwd, tr, size: box(P, true), gaps, others, kind: R.kind || '', expect: R.expect || null };
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
      // seconds of GAME time when the hook gives a clock (a slow robot can't stretch it); the game's own speed wins
      const dt = prev ? Math.max(0.05, s.t - prev.t) : 0.4;
      const v = s.speed != null ? s.speed : (prev ? Math.hypot(s.x - prev.x, s.z - prev.z) / dt : 0);
      // owner Oct 21 6:38 PM (window 1, G-100): the first steps of a sprint from a standstill are still under 2 m/s, but
      // they are RUNNING steps (both feet leave the ground). A reading counts as standing/walking only when the hook's
      // gait() says so, or - without gait() - when the player is NOT speeding up and no fast reading follows within 1 s.
      const next = samples.slice(i + 1).find(x => x.t - s.t <= 1.0 && x.t > s.t);
      const nv = next ? (next.speed != null ? next.speed : Math.hypot(next.x - s.x, next.z - s.z) / Math.max(0.05, next.t - s.t)) : v;
      const speeding = next && nv > v * 1.15 + 0.2;
      let isFast = v > 2 || speeding || nv > 2;
      if (s.gait === 'run') isFast = true; else if (s.gait === 'walk' || s.gait === 'stand') isFast = false;
      (isFast ? fast : slow).push({ low: Math.min(...s.gaps), t: s.t, v });
    }
    // Advisor Oct 21 2026 10:55 PM (#911): telling standing/walking from a sprint start needs the GAME's clock or gait().
    // Without them the robot is guessing from its own busy clock, so FLOAT-while-walking and no-touchdown-while-fast are
    // yellow (robot side owns it) until the hook gives time()/speed() or gait(). SINK stays red at any speed.
    const gaitKnown = samples.some(x => x.gameTime || x.gait);
    const gaitLine = (msg) => gaitKnown ? out.fail.push(msg) : out.check.push(msg.replace('REALITY: ', 'REALITY (yellow - no time()/gait() in the hook, so the robot cannot tell a sprint start from walking): '));
    const slowGaps = slow.flatMap(s => [s.low]);
    const floating = slowGaps.filter(g => g > 0.03).length;
    if (slow.length >= 3 && floating > slow.length * 0.2)
      gaitLine(`REALITY: wheels/feet/skates FLOAT above the ground while standing/walking (${floating} of ${slow.length} readings over 3 cm, highest ${Math.max(...slowGaps).toFixed(2)} m)`);
    if (fast.length >= 2) {
      let longest = 0, since = null;
      for (const f of fast) {
        if (f.low <= 0.03) since = f.t;
        else if (since != null) longest = Math.max(longest, f.t - since);
        else longest = Math.max(longest, 0.4);
      }
      const ever = fast.some(f => f.low <= 0.03);
      if (!ever || longest > 0.6)
        gaitLine(`REALITY: feet/skates/wheels never touch down while moving fast - ${ever ? 'no touchdown for ' + longest.toFixed(1) + ' s' : 'no touchdown in ' + fast.length + ' fast readings'} (a sprint lands a foot at least every 0.5 s; lowest ${Math.min(...fast.map(f => f.low)).toFixed(2)} m)`);
    }
  } else out.check.push('REALITY: no contact nodes in the hook - list the wheels / feet / skates so the robot can check they touch the ground');
  out.data = { kind, size: sz, moves, wrongWay, backwards, gaps: gaps.length, gameTime: samples.some(s => s.gameTime), gameSpeed: samples.some(s => s.speed != null) };
  if (gaps.length && samples.some(s => s.assumed)) out.check.push('REALITY: the contact nodes are ankle bones with no footOffset - the robot assumed the studio rig sole offset 0.08 m; set footOffset in the hook to be exact');
  if (gaps.length && !samples.some(s => s.gameTime)) out.check.push('REALITY: the hook has no time() - add time: () => <game seconds> and speed: () => <m/s> so a busy robot cannot mistake a sprint for walking (REALITY.md)');
  return out;
}

// CLOSE-UP of the main player (owner Oct 21 5:54 PM, window 1's redo workflow, rule 1): where the player's head and
// shoulders are ON SCREEN, so check.mjs can take a close-up picture for the owner's card. Uses the hook's `camera`, else
// any THREE camera it can find. Returns {x, y, width, height} in page pixels, or null (+ why).
export async function playerScreenBox(page) {
  try {
    return await page.evaluate(async () => {
      const R = window.__reality, P = R && R.player;
      if (!P) return { why: 'no player in the hook' };
      const canvas = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
      if (!canvas) return { why: 'no canvas' };
      const cr = canvas.getBoundingClientRect();
      let cam = R.camera || null;
      if (!cam) {
        // the robot remembered every camera the game made (STUDIO_PROBE): the game camera is a perspective camera shaped
        // like the screen that MOVES (follows the play); shadow / light cameras are square or never move
        const want = cr.width / Math.max(1, cr.height);
        const cams = (window.__cams || []).filter(c => c && c.isPerspectiveCamera && Math.abs((c.aspect || 1) - want) < 0.25);
        const before = cams.map(c => c.matrixWorld.elements.slice());
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 300))));
        const moved = cams.filter((c, i) => c.matrixWorld.elements.some((v, k) => Math.abs(v - before[i][k]) > 1e-4));
        cam = moved[0] || cams[0] || null;
      }
      if (!cam) for (const k of Object.keys(window)) { try { const v = window[k]; if (v && v.isCamera && v.projectionMatrix) { cam = v; break; } } catch (e) {} }
      if (!cam) return { why: 'no screen camera found - add camera: <THREE.Camera> to window.__reality' };
      P.updateMatrixWorld(true); cam.updateMatrixWorld(true); cam.updateProjectionMatrix && cam.updateProjectionMatrix();
      let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], n = 0;
      P.traverse(m => { if (!m.geometry || !m.visible) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
        mn = [Math.min(mn[0], b.min.x), Math.min(mn[1], b.min.y), Math.min(mn[2], b.min.z)]; mx = [Math.max(mx[0], b.max.x), Math.max(mx[1], b.max.y), Math.max(mx[2], b.max.z)]; n++; });
      if (!n) return { why: 'player has no meshes' };
      const V = cam.position.constructor;            // THREE.Vector3 without a global THREE
      const pts = [];
      for (const x of [mn[0], mx[0]]) for (const y of [mn[1], mx[1]]) for (const z of [mn[2], mx[2]]) {
        const v = new V(x, y, z).project(cam);
        pts.push({ x: cr.left + (v.x + 1) / 2 * cr.width, y: cr.top + (1 - v.y) / 2 * cr.height, z: v.z });
      }
      if (pts.every(p => p.z > 1)) return { why: 'player is behind the camera' };
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const top = Math.min(...ys), bottom = Math.max(...ys), left = Math.min(...xs), right = Math.max(...xs);
      const h = bottom - top, w = right - left;
      // head and shoulders = the top 38% of the player, a little room around it, never smaller than 160 px
      const size = Math.max(160, h * 0.38 * 1.3, w * 0.9);
      const cx = (left + right) / 2, cy = top + h * 0.19;
      const x = Math.max(0, Math.min(innerWidth - size, cx - size / 2)), y = Math.max(0, Math.min(innerHeight - size, cy - size / 2));
      return { x: Math.round(x), y: Math.round(y), width: Math.round(Math.min(size, innerWidth)), height: Math.round(Math.min(size, innerHeight)), playerH: Math.round(h) };
    });
  } catch (e) { return { why: String(e.message).slice(0, 80) }; }
}

// A real CLOSE-UP (owner Oct 21 2026 6:45 PM: on the phone players are 20-30 px tall, so a crop of the screen is not a
// close-up): the robot renders ONE extra frame with its own camera 'in front of the player's head', using the game's own
// renderer and scene (remembered by STUDIO_PROBE), reads it as a JPEG and lets the game carry on. Nothing in the game
// changes. Returns { jpg: dataURL } or { why }.
export async function playerCloseUp(page) {
  try {
    return await page.evaluate(async () => {
      const R = window.__reality, P = R && R.player;
      if (!P) return { why: 'no player in the hook' };
      const rend = (window.__renderers || []).find(x => x && x.domElement && x.domElement.isConnected) || (window.__renderers || [])[0];
      if (!rend) return { why: 'no renderer found' };
      const base = (window.__cams || []).find(c => c && c.isPerspectiveCamera) || R.camera;
      if (!base) return { why: 'no camera found' };
      let scene = P; while (scene.parent) scene = scene.parent;
      P.updateMatrixWorld(true);
      let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], n = 0;
      P.traverse(m => { if (!m.geometry || !m.visible) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
        mn = [Math.min(mn[0], b.min.x), Math.min(mn[1], b.min.y), Math.min(mn[2], b.min.z)]; mx = [Math.max(mx[0], b.max.x), Math.max(mx[1], b.max.y), Math.max(mx[2], b.max.z)]; n++; });
      if (!n) return { why: 'player has no meshes' };
      const V = base.position.constructor;
      const h = mx[1] - mn[1], cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
      const kind = String(R.kind || '').toLowerCase();
      const tall = /person|skater|player|athlete/.test(kind) || (!/car|f1|truck|plane|bike|moto/.test(kind) && h > Math.max(mx[0] - mn[0], mx[2] - mn[2]));
      // a person: aim at the head over the body's own spot (a bat or stick held out widens the box, not the body)
      const wp = new V(); P.getWorldPosition(wp);
      const look = new V(tall ? wp.x : cx, tall ? mx[1] - h * 0.16 : mn[1] + h * 0.6, tall ? wp.z : cz);
      const fwd = new V(0, 0, 1); try { P.getWorldDirection(fwd); } catch (e) {}
      fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, 1); fwd.normalize();
      const cam = base.clone();
      cam.fov = 35; cam.aspect = 1; cam.near = 0.02; cam.far = Math.max(base.far || 1000, 200); cam.zoom = 1;
      const span = tall ? h * 0.42 : Math.max(mx[0] - mn[0], mx[2] - mn[2]) * 0.9;   // head and shoulders / the whole car
      const dist = (span / 2) / Math.tan(35 * Math.PI / 360) * 1.25;
      cam.position.copy(look).addScaledVector(fwd, dist); cam.position.y += span * 0.08;
      cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
      const el = rend.domElement, size = new V(); rend.getSize ? rend.getSize(size) : size.set(el.width, el.height, 0);
      const pr = rend.getPixelRatio ? rend.getPixelRatio() : 1;
      const side = Math.round(Math.min(size.x, size.y));
      let url = '';
      try {
        rend.setScissorTest && rend.setScissorTest(false);
        rend.setViewport(0, 0, side, side);
        rend.render(scene, cam);
        const c2 = document.createElement('canvas'); c2.width = c2.height = Math.min(480, side * pr);
        c2.getContext('2d').drawImage(el, 0, el.height - side * pr, side * pr, side * pr, 0, 0, c2.width, c2.height);
        url = c2.toDataURL('image/jpeg', 0.85);
      } finally { rend.setViewport(0, 0, size.x, size.y); }
      return url ? { jpg: url, tall } : { why: 'render failed' };
    });
  } catch (e) { return { why: String(e.message).slice(0, 80) }; }
}
