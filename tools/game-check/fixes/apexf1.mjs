// Game-check fix tests for Apex F1 (apexf1.html) — JOB J38
// PLAY TESTS: these actually PLAY the game by its rules.
// window.__test is exposed by the game (see bottom of apexf1.html).

/* ================= G-33 CAREER HELPERS (runner side only) =================
   Every function passed to h.eval is fully self-contained (the runner ships
   the function source, not its closure). The tests share one page, so each
   career test first puts a known save in place and reloads to the menu. */
const g33CareerFn = () => {
  try { return JSON.parse(localStorage.getItem('apexf1_career') || 'null'); } catch (e) { return null; }
};
async function g33Reset(page, h, seed) {
  try {
    await h.eval((s) => {
      try {
        if (s) localStorage.setItem('apexf1_career', JSON.stringify(s));
        else localStorage.removeItem('apexf1_career');
      } catch (e) {}
      location.reload();
    }, seed || null);
  } catch (e) {} // the reload kills that eval - expected
  for (let i = 0; i < 24; i++) {
    await h.wait(400);
    let ok = false;
    try { ok = await h.eval(() => !!(window.__test && window.__test.race().mode === 'menu')); } catch (e) {}
    if (ok) return true;
  }
  return false;
}
// From a freshly started career weekend (mode 'quali'): skip qualifying with
// the game's own button, start the race, fast-forward every car to just
// before the finish on the final lap (same trick as play-race-ends-with-
// results) and wait for the results screen.
async function g33FinishRace(page, h) {
  await h.press('#qualiSkip');
  await h.wait(800);
  await h.press('#raceBtn');
  await h.wait(1500);
  await h.eval(() => {
    const t = window.__test; if (!t) return;
    const L = t.trackLength(), laps = t.race().laps, n = t.cars().length;
    for (let i = 0; i < n; i++) { t.setCarLap(i, laps); t.setCarS(i, L - 300 - i * 10); }
    t.setInput({ gas: true });
  });
  for (let i = 0; i < 10; i++) {
    await h.wait(2000);
    let done = false;
    try { done = await h.eval(() => { const t = window.__test; return t ? !!t.race().hasResults : false; }); } catch (e) {}
    if (done) return true;
  }
  return false;
}


/* ================= G-66 PACE HELPERS (runner side only) =================
   The pace windows use FIXED wall-clock waits on purpose: on a slow page the
   game's catch-up stepping makes game time track wall time imperfectly, but
   every window in a test shrinks by the same factor, so a distance ratio
   between two windows stays an honest pace ratio. Each measured car is
   staged by the game's own test helper onto the same corner section; every
   other car is staged far down the track, and the player is staged ahead of
   them with the line driver running, so he keeps circulating at race pace
   while an AI car is measured (the AI's rubber-band then reads a real gap,
   not a parked-player artifact). */
async function g66ToRace(page, h) {
  if (!await g33Reset(page, h, null)) return false;
  await h.press('#careerBtn');
  await h.press('#toTeamBtn');
  await h.press('#startBtn');
  await h.wait(1200);
  await h.press('#qualiSkip');
  await h.wait(800);
  await h.press('#raceBtn');
  for (let i = 0; i < 16; i++) {
    await h.wait(600);
    const racing = await h.eval(() => { const t = window.__test; return t ? t.race().mode === 'race' : false; }).catch(() => false);
    if (racing) return true;
  }
  return false;
}
async function g66Driver(page, h, on) {
  await h.eval((start) => { const t = window.__test; if (!t) return;
    if (window.__g66drv) { clearInterval(window.__g66drv); window.__g66drv = null; }
    if (!start) { t.setInput({ gas: false, brake: false, steer: 0 }); return; }
    window.__g66drv = setInterval(() => { const t2 = window.__test; if (!t2 || !t2.paceCars) return;
      const cs = t2.paceCars(); const p = cs.find(c => c.isPlayer); if (!p) return;
      const ref = t2.lineAt(p.s + p.v * 0.5 + 18);
      let steer = (ref.rlD - p.d) * 0.5 - p.headAngle * 1.1;
      steer = Math.max(-1, Math.min(1, steer));
      t2.setInput({ gas: true, brake: false, ers: ref.curv < 0.004 && p.ers > 15, steer });
    }, 50);
  }, on).catch(() => {});
}
async function g66Window(page, h, idx, pi) {
  await h.eval((a) => { const t = window.__test; if (!t) return;
    const n = t.cars().length;
    for (let i = 0; i < n; i++) { if (i === a.idx) continue; t.setCarS(i, i === a.pi ? 4700 : 3400 + i * 60); }
    t.setCarS(a.idx, 2950);
  }, { idx, pi }).catch(() => {});
  const rd = async () => { try { return await h.eval((mi) => { const t = window.__test; return t ? t.paceCars()[mi].raceDist : null; }, idx); } catch (e) { return null; } };
  const rd0 = await rd(); if (rd0 === null) return null;
  await h.wait(5000);
  const rd1 = await rd(); if (rd1 === null) return null;
  return rd1 - rd0;
}
async function g66PaceTest(page, h, pickFastest) {
  if (!await g66ToRace(page, h)) return 'race never started';
  const field = await h.eval(() => { const t = window.__test; if (!t || !t.paceCars) return null;
    return t.paceCars().map((c, i) => ({ i, skill: c.skill, isPlayer: c.isPlayer })); }).catch(() => null);
  if (!field) return 'pace probe missing (window.__test.paceCars)';
  const ai = field.filter(c => !c.isPlayer).sort((a, b) => a.skill - b.skill);
  const target = pickFastest ? ai[ai.length - 1] : ai[0];
  const label = pickFastest ? 'fastest' : 'slowest';
  const pi = field.find(c => c.isPlayer).i;
  await g66Driver(page, h, true);
  const d1 = await g66Window(page, h, target.i, pi);
  const d2 = await g66Window(page, h, target.i, pi);
  const dP = await g66Window(page, h, pi, pi);
  await g66Driver(page, h, false);
  const dAI = Math.max(d1 || 0, d2 || 0); // a spin or a wall scrape only ever slows a window - the better one is the car's true pace
  if (!(dAI > 50)) return `${label} AI pace window failed`;
  if (!(dP > 50)) return 'player pace window failed';
  const r = dAI / dP;
  if (r < 0.94) return `${label} AI covered only ${(r * 100).toFixed(0)}% of the player's distance in identical windows - the player just drives away from the field`;
  if (r > 1.06) return `${label} AI covered ${(r * 100).toFixed(0)}% of the player's distance in identical windows - not the same pace as the player`;
  return true;
}

export default [
  {
    id: 'game-starts-not-black',
    ask: 'Game does not start',
    async test(page, h) {
      await h.press('#quickBtn');
      await h.wait(5000);
      const state = await h.eval(() => {
        const t = window.__test;
        if (!t) return { error: 'no __test' };
        const r = t.race();
        const canvas = document.querySelector('canvas');
        return { mode: r.mode, hasCanvas: !!canvas };
      });
      if (state.error) return state.error;
      if (!state.hasCanvas) return 'no canvas element found';
      if (!['race','lights','quali'].includes(state.mode)) {
        return `game did not start (mode=${state.mode})`;
      }
      return true;
    },
  },
  {
    id: 'play-cars-stay-on-track',
    ask: 'cars stay on the track',
    async test(page, h) {
      await h.press('#quickBtn');
      await h.wait(8000); // let the race start and cars spread out
      const bad = await h.eval(() => {
        const t = window.__test;
        if (!t) return 'no __test';
        const half = t.trackWidth() / 2 + 5; // 5m margin for curb/runoff
        return t.cars()
          .filter(c => Math.abs(c.d) > half)
          .map(c => `${c.name}:d=${c.d.toFixed(1)}`);
      });
      if (bad === 'no __test') return 'window.__test not exposed';
      return bad.length === 0 || `cars off track: ${bad.join(', ')}`;
    },
  },
  {
    id: 'play-ai-finishes-lap',
    ask: 'AI cars finish a lap',
    async test(page, h) {
      await h.press('#quickBtn');
      await h.wait(3000);
      // Fast-forward: place first AI car just before the finish line
      await h.eval(() => {
        const t = window.__test;
        const L = t.trackLength();
        t.setCarS(1, L - 200); // car index 1 = first AI car
        t.setInput({ gas: true });
      });
      // Wait up to 25s for it to cross the line (lap 1 -> 2)
      for (let i = 0; i < 5; i++) {
        await h.wait(5000);
        const lap2 = await h.eval(() => {
          const t = window.__test;
          return t ? t.cars().filter(c => !c.isPlayer && c.lap >= 2).length : -1;
        });
        if (lap2 === -1) return 'window.__test not exposed';
        if (lap2 > 0) return true;
      }
      return 'no AI car reached lap 2 within 25s';
    },
  },
  {
    id: 'play-lap-counter-goes-up',
    ask: 'lap counter goes up',
    async test(page, h) {
      await h.press('#quickBtn');
      await h.wait(3000);
      const lap0 = await h.eval(() => window.__test && window.__test.race().lap);
      if (lap0 == null) return 'window.__test not exposed';
      // Fast-forward: place player just before the finish line
      await h.eval(() => {
        const t = window.__test;
        const L = t.trackLength();
        t.setCarS(0, L - 200); // car index 0 = player
        t.setInput({ gas: true });
      });
      // Wait up to 25s for the lap counter to increment
      for (let i = 0; i < 5; i++) {
        await h.wait(5000);
        const lap = await h.eval(() => window.__test.race().lap);
        if (lap > lap0) return true;
      }
      return `player lap counter stayed at ${lap0} after 25s`;
    },
  },
  {
    id: 'play-braking-slows-car',
    ask: 'braking slows the car',
    async test(page, h) {
      await h.press('#quickBtn');
      await h.wait(3000);
      // Get up to speed first
      await h.eval(() => window.__test.setInput({ gas: true, brake: false }));
      await h.wait(5000);
      const v0 = await h.eval(() => {
        const c = window.__test.cars().find(c => c.isPlayer);
        return c ? c.v : -1;
      });
      if (v0 < 0) return 'window.__test not exposed';
      if (v0 < 5) return `car too slow to test braking (v=${v0.toFixed(1)})`;
      // Slam the brakes
      await h.eval(() => window.__test.setInput({ gas: false, brake: true }));
      await h.wait(3000);
      const v1 = await h.eval(() => {
        const c = window.__test.cars().find(c => c.isPlayer);
        return c ? c.v : -1;
      });
      await h.eval(() => window.__test.setInput({ brake: false }));
      return v1 < v0 * 0.8 || `braking did not slow the car (v ${v0.toFixed(1)} -> ${v1.toFixed(1)})`;
    },
  },
  {
    id: 'play-throttle-accelerates-car',
    ask: 'throttle accelerates the car',
    async test(page, h) {
      await h.press('#quickBtn');
      await h.wait(3000);
      const v0 = await h.eval(() => {
        const c = window.__test.cars().find(c => c.isPlayer);
        return c ? c.v : -1;
      });
      if (v0 < 0) return 'window.__test not exposed';
      await h.eval(() => window.__test.setInput({ gas: true }));
      await h.wait(5000);
      const v1 = await h.eval(() => {
        const c = window.__test.cars().find(c => c.isPlayer);
        return c ? c.v : -1;
      });
      await h.eval(() => window.__test.setInput({ gas: false }));
      return v1 > v0 + 5 || `throttle did not accelerate the car (v ${v0.toFixed(1)} -> ${v1.toFixed(1)})`;
    },
  },
  {
    id: 'play-race-ends-with-results',
    ask: 'the race ends with results',
    async test(page, h) {
      await h.press('#quickBtn');
      await h.wait(3000);
      // Fast-forward: place all cars on the final lap just before the finish
      await h.eval(() => {
        const t = window.__test;
        const L = t.trackLength();
        const laps = t.race().laps;
        const n = t.cars().length;
        for (let i = 0; i < n; i++) {
          t.setCarLap(i, laps); // final lap
          t.setCarS(i, L - 300 - i * 10);
        }
        t.setInput({ gas: true });
      });
      for (let i = 0; i < 6; i++) {
        await h.wait(5000);
        const st = await h.eval(() => {
          const t = window.__test;
          if (!t) return null;
          const r = t.race();
          return { hasResults: r.hasResults, finished: t.cars().filter(c => c.finished).length };
        });
        if (!st) return 'window.__test not exposed';
        if (st.hasResults) return true;
      }
      return 'race did not produce results within 30s';
    },
  },
  {
    id: 'play-career-first-round',
    ask: 'career mode works end to end',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'game did not return to the menu after clearing the career save';
      // New career through the game's own menus: CAREER -> track -> team -> START WEEKEND
      await h.press('#careerBtn');
      await h.press('#toTeamBtn');
      await h.press('#startBtn');
      await h.wait(1200);
      const inQuali = await h.eval(() => { const t = window.__test; return t ? t.race().mode : ''; }).catch(() => '');
      if (inQuali !== 'quali') return `career weekend did not start (mode=${inQuali})`;
      if (!await g33FinishRace(page, h)) return 'career round 1 race never produced results';
      const c = await h.eval(g33CareerFn).catch(() => null);
      if (!c) return 'no career was saved after round 1';
      if (c.round !== 1) return `career round should be 1 after the first race, got ${c.round}`;
      const pts = Object.values(c.table || {}).reduce((a, b) => a + b, 0);
      if (!(pts > 0)) return 'no championship points were banked after round 1';
      // Results NEXT takes a career back to the hub, offering round 2
      await h.press('#resNext');
      await h.wait(600);
      const hub = await h.eval(() => {
        const el = document.getElementById('hub');
        return { shown: !!el && !el.classList.contains('hidden'),
                 body: (document.getElementById('hubBody') || {}).textContent || '' };
      }).catch(() => ({ shown: false, body: '' }));
      if (!hub.shown) return 'results NEXT did not open the career hub';
      if (!/Round 2\/5/.test(hub.body)) return `career hub does not offer round 2 (hub says: ${hub.body.slice(0, 80)})`;
      return true;
    },
  },
  {
    id: 'play-career-next-round',
    ask: 'career mode works end to end',
    async test(page, h) {
      // A career already under way: round 1 done at Monza, 25 points banked.
      const seed = { name: 'YOU', team: 'apex', season: 1, round: 1, rating: 50, wins: 1, champs: 0,
        friends: { w: 0, l: 0 }, drivers: [], table: { YOU: 25 } };
      if (!await g33Reset(page, h, seed)) return 'game did not return to the menu with the seeded career';
      // The hub must offer round 2 (Monaco) - start it with the game's own NEXT RACE button
      await h.press('#careerBtn');
      await h.wait(600);
      const hub = await h.eval(() => {
        const el = document.getElementById('hub');
        return { shown: !!el && !el.classList.contains('hidden'),
                 body: (document.getElementById('hubBody') || {}).textContent || '' };
      }).catch(() => ({ shown: false, body: '' }));
      if (!hub.shown) return 'career hub did not open for the saved career';
      if (!/Round 2\/5/.test(hub.body)) return `hub does not offer round 2 (hub says: ${hub.body.slice(0, 80)})`;
      await h.press('#hubNext');
      await h.wait(1200);
      const inQuali = await h.eval(() => { const t = window.__test; return t ? t.race().mode : ''; }).catch(() => '');
      if (inQuali !== 'quali') return `career round 2 weekend did not start (mode=${inQuali})`;
      if (!await g33FinishRace(page, h)) return 'career round 2 race never produced results';
      const c = await h.eval(g33CareerFn).catch(() => null);
      if (!c) return 'the career save vanished after round 2';
      if (c.round !== 2) return `career round should be 2 after the second race, got ${c.round}`;
      const pts = Object.values(c.table || {}).reduce((a, b) => a + b, 0);
      if (!(pts > 25)) return `championship points did not grow in round 2 (total ${pts}, seeded 25)`;
      return true;
    },
  },
  {
    id: 'play-player-starts-facing-forward',
    ask: 'the player car starts facing the right way and drives the same way as the AI cars and the checkpoints',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'game did not return to the menu';
      await h.press('#careerBtn');
      await h.press('#toTeamBtn');
      await h.press('#startBtn');
      await h.wait(1200);
      const piOf = (t) => t.cars().findIndex(c => c.isPlayer);
      const q = await h.eval(() => { const t = window.__test; if (!t) return null;
        return t.heading(t.cars().findIndex(c => c.isPlayer)); }).catch(() => null);
      if (!q) return 'no heading probe in qualifying (window.__test.heading missing)';
      if (!(q.dot > 0.9)) return `player faces the wrong way in qualifying (alignment ${q.dot.toFixed(2)})`;
      // find the stick like a player would, then skip qualifying
      await h.eval(() => { const t = window.__test; t.setInput({ gas: true, steer: 0.7 }); });
      await h.wait(900);
      await h.eval(() => { const t = window.__test; t.setInput({ gas: false, steer: 0 }); });
      await h.press('#qualiSkip');
      await h.wait(800);
      // on the grid EVERY car faces the way the track goes, with a clean steering angle
      const g = await h.eval(() => { const t = window.__test; if (!t) return null;
        return t.cars().map((c, i) => { const hd = t.heading(i); return hd ? hd.dot : 0; }); }).catch(() => null);
      if (!g || !g.length) return 'no heading probe on the grid';
      const worst = Math.min(...g);
      if (!(worst > 0.9)) return `a car faces the wrong way on the grid (worst alignment ${worst.toFixed(2)})`;
      const ph = await h.eval(() => { const t = window.__test; return t.heading(t.cars().findIndex(c => c.isPlayer)); }).catch(() => null);
      if (!ph) return 'no player heading on the grid';
      if (Math.abs(ph.headAngle) > 0.05) return `player's steering is still wound on at the grid (${ph.headAngle.toFixed(2)}) - the car would crab off the start`;
      // lights out: the player drives FORWARD, the same way the checkpoints count
      await h.press('#raceBtn');
      await h.eval(() => { const t = window.__test; t.setInput({ gas: true, steer: 0 }); });
      let prev = null, sawRace = false, lastV = 0;
      for (let i = 0; i < 14; i++) {
        await h.wait(700);
        const st = await h.eval(() => { const t = window.__test; if (!t) return null;
          const cs = t.cars(); const pi = cs.findIndex(c => c.isPlayer);
          return { mode: t.race().mode, s: cs[pi].s, v: cs[pi].v }; }).catch(() => null);
        if (!st) return 'lost the game while checking the race start';
        if (st.mode === 'race') {
          if (prev !== null && st.s < prev - 1 && !(prev > 5000 && st.s < 700)) return `player is going backwards (s ${prev.toFixed(0)} -> ${st.s.toFixed(0)})`;
          prev = st.s; sawRace = true; lastV = st.v;
        }
        if (sawRace && i > 8) break;
      }
      await h.eval(() => { const t = window.__test; t.setInput({ gas: false }); });
      if (!sawRace) return 'race never started';
      if (!(lastV > 5)) return 'player is not moving after lights out';
      return true;
    },
  },
  {
    id: 'play-steering-smooth-and-controllable',
    ask: 'steering is smooth and controllable with the stick',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'game did not return to the menu';
      await h.press('#careerBtn');
      await h.press('#toTeamBtn');
      await h.press('#startBtn');
      await h.wait(1200);
      await h.press('#qualiSkip');
      await h.wait(800);
      await h.press('#raceBtn');
      let racing = false;
      for (let i = 0; i < 12 && !racing; i++) {
        await h.wait(600);
        racing = await h.eval(() => { const t = window.__test; return t ? t.race().mode === 'race' : false; }).catch(() => false);
      }
      if (!racing) return 'race never started';
      const probe = () => h.eval(() => { const t = window.__test; if (!t) return null;
        const cs = t.cars(); const pi = cs.findIndex(c => c.isPlayer);
        const hd = t.heading(pi); return { d: cs[pi].d, v: cs[pi].v, head: hd ? hd.headAngle : 0 }; }).catch(() => null);
      await h.eval(() => { const t = window.__test; t.setInput({ gas: true, steer: 0 }); });
      await h.wait(1500);
      const p0 = await probe();
      if (!p0) return 'probe failed at speed';
      if (!(p0.v > 15)) return `car did not get going (v=${p0.v.toFixed(0)})`;
      // hold the stick toward the middle of the road: d moves that way smoothly
      // (never jumps the other way), by a clear but bounded amount
      const dir = p0.d > 0 ? -1 : 1; // steer toward the centre line from whichever slot side we got
      await h.eval((sgn) => { const t = window.__test; t.setInput({ gas: true, steer: 0.18 * sgn }); }, dir);
      const ds = [];
      for (let i = 0; i < 4; i++) { await h.wait(130); const p = await probe(); if (p) ds.push(p.d); }
      await h.eval(() => { const t = window.__test; t.setInput({ gas: true, steer: 0 }); });
      if (ds.length < 3) return 'steering samples missing';
      for (let i = 1; i < ds.length; i++) if ((ds[i] - ds[i - 1]) * dir < -0.35) return `steering jumped around (d samples: ${ds.map(x => x.toFixed(1)).join(', ')})`;
      const gain = (ds[ds.length - 1] - p0.d) * dir;
      if (!(gain > 0.8)) return `holding the stick barely moved the car (d ${p0.d.toFixed(1)} -> ${ds[ds.length - 1].toFixed(1)})`;
      if (!(Math.abs(ds[ds.length - 1]) < 9)) return `the car speared off under a held stick (d=${ds[ds.length - 1].toFixed(1)})`;
      // stick centred: the heading stops winding (no oscillation, no self-steer)
      const h1 = await probe(); await h.wait(450); const h2 = await probe();
      if (!h1 || !h2) return 'probe failed after centering the stick';
      if (Math.abs(h2.head - h1.head) > 0.03) return `heading keeps changing with the stick centred (${h1.head.toFixed(2)} -> ${h2.head.toFixed(2)})`;
      // steer back the other way: the car answers both directions
      const dBefore = h2.d;
      await h.eval((sgn) => { const t = window.__test; t.setInput({ gas: true, steer: -0.3 * sgn }); }, dir);
      await h.wait(1000);
      const p3 = await probe();
      await h.eval(() => { const t = window.__test; t.setInput({ gas: false, steer: 0 }); });
      if (!p3) return 'probe failed on the way back';
      if (!((dBefore - p3.d) * dir > 0.8)) return `steering back did not move the car (d ${dBefore.toFixed(1)} -> ${p3.d.toFixed(1)})`;
      return true;
    },
  },
  {
    id: 'play-no-invisible-cars',
    ask: 'every car that can be hit is drawn and visible where it actually is',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'game did not return to the menu';
      await h.press('#careerBtn');
      await h.press('#toTeamBtn');
      await h.press('#startBtn');
      await h.wait(1200);
      const probes = await h.eval(() => { const t = window.__test; if (!t || !t.carMesh) return null;
        return t.cars().map((c, i) => ({ name: c.name, m: t.carMesh(i) })); }).catch(() => null);
      if (!probes || probes.length < 20) return 'car mesh probe missing (window.__test.carMesh)';
      for (const p of probes) {
        if (!p.m) return `${p.name}: no mesh probe`;
        if (!p.m.attached) return `${p.name}: car mesh is not in the scene - it can be hit but never seen`;
        if (!p.m.chain) return `${p.name}: car is hidden by an invisible parent - it can be hit but never seen`;
        if (!(p.m.vis >= 5)) return `${p.name}: only ${p.m.vis} visible meshes drawn - the car is effectively invisible`;
        const longAxis = Math.max(p.m.size[0], p.m.size[2]);
        if (!(longAxis >= 4.5)) return `${p.name}: drawn car is only ${longAxis}m long - not a visible F1 car`;
        const dx = p.m.center[0] - p.m.trackPos[0], dz = p.m.center[2] - p.m.trackPos[2];
        if (Math.hypot(dx, dz) > 2.5) return `${p.name}: drawn car sits ${Math.hypot(dx, dz).toFixed(1)}m from the car you can hit - an invisible blocker`;
      }
      return true;
    },
  },
  {
    id: 'play-ai-cars-full-model',
    ask: 'every AI car uses the real F1 car model, same quality as the player car',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'game did not return to the menu';
      await h.press('#careerBtn');
      await h.press('#toTeamBtn');
      await h.press('#startBtn');
      await h.wait(1200);
      const probes = await h.eval(() => { const t = window.__test; if (!t || !t.carMesh) return null;
        return t.cars().map((c, i) => ({ name: c.name, isPlayer: c.isPlayer, m: t.carMesh(i) })); }).catch(() => null);
      if (!probes || probes.length < 20) return 'car mesh probe missing (window.__test.carMesh)';
      const player = probes.find(p => p.isPlayer);
      const ais = probes.filter(p => !p.isPlayer);
      if (!player || !player.m) return 'player car probe missing';
      const ref = ais[0].m;
      if (!ref) return 'AI car probe missing';
      for (const p of ais) {
        if (!p.m) return `${p.name}: no mesh probe`;
        if (p.m.meshes !== ref.meshes || p.m.vis !== ref.vis || p.m.mats !== ref.mats)
          return `${p.name}: different model from the other AI cars (${p.m.meshes}/${p.m.vis}/${p.m.mats} vs ${ref.meshes}/${ref.vis}/${ref.mats}) - a blob or a stand-in`;
        const fp = (m) => [Math.min(m.size[0], m.size[2]), m.size[1], Math.max(m.size[0], m.size[2])]; // yaw-independent footprint: [width, height, length]
        const mine = fp(p.m), want = fp(player.m);
        for (let a = 0; a < 3; a++) {
          if (want[a] > 0 && Math.abs(mine[a] - want[a]) / want[a] > 0.08)
            return `${p.name}: drawn size ${mine[a]} vs the player's ${want[a]} on footprint axis ${a} - not the same car model`;
        }
      }
      if (player.m.vis !== ref.vis) return `player car draws ${player.m.vis} visible meshes but AI cars draw ${ref.vis} - not the same quality`;
      return true;
    },
  },
  {
    id: 'play-ai-pace-slowest-matches-player',
    ask: 'the slowest AI car laps within 5 percent of the player - nobody gets driven away from',
    async test(page, h) { return g66PaceTest(page, h, false); },
  },
  {
    id: 'play-ai-pace-fastest-matches-player',
    ask: 'the fastest AI car laps within 5 percent of the player - same real F1 pace',
    async test(page, h) { return g66PaceTest(page, h, true); },
  },
  // G-73 (1): at speed the stick must wind the heading gently - a firm half-stick
  // hold over 50 m at 80+ m/s may not point the car more than 0.36 rad off the
  // track (before G-73 it wound to ~0.42 and the car was on the grass before the
  // player could catch it). And with the stick released the heading must FREEZE:
  // steering still comes only from the stick, no self-steering (G-27 rule).
  {
    id: 'play-car-holds-heading-at-speed', title: 'Apex F1: at speed the stick winds the heading gently and never steers by itself (G-73)',
    run: async (page, h) => {
      const m = await g66ToRace(page, h); if (m) return h.fail(m);
      const scan = await h.eval(() => { for (let s = 200; s < 5400; s += 50) { const la = window.__test.lineAt(s); if (la.maxV >= 85 && la.rlD <= -3) return s; } return 1100; });
      const stage = await h.eval((sec) => { const T = window.__test; const pc = T.paceCars(); const pi = pc.findIndex(c => c.isPlayer); if (pi < 0) return -1;
        for (let i = 0; i < pc.length; i++) if (i !== pi) T.setCarS(i, 3400 + i * 50);
        T.setCarS(pi, sec - 300); return pi; }, scan);
      if (stage < 0) return h.fail('no player car on the grid');
      await g66Driver(page, h, true);
      let fast = null; // settle: the driver runs the player up to speed on the line
      for (let i = 0; i < 30; i++) { const pc = await h.eval(() => window.__test.paceCars()); const p = pc[stage];
        if (p && p.v >= 80) { fast = p; break; } await h.wait(300); }
      await g66Driver(page, h, false);
      if (!fast) return h.fail('player never reached 80 m/s on the fast section (steering check needs speed)');
      const rd0 = await h.eval(() => window.__test.paceCars());
      const start = rd0[stage].raceDist;
      await h.eval(() => window.__test.setInput({ gas: true, brake: false, steer: 0.5 }));
      let rd1 = start; // hold half stick until the car has covered 50 m (distance = page-speed proof)
      for (let i = 0; i < 60; i++) { const pc = await h.eval(() => window.__test.paceCars()); rd1 = pc[stage].raceDist; if (rd1 - start >= 50) break; await h.wait(100); }
      const h1 = await h.eval((pi) => window.__test.heading(pi), stage);
      await h.eval(() => window.__test.setInput({ gas: true, brake: false, steer: 0 }));
      let rd2 = rd1; // released: cover 30 m more and confirm the heading did not move on its own
      for (let i = 0; i < 60; i++) { const pc = await h.eval(() => window.__test.paceCars()); rd2 = pc[stage].raceDist; if (rd2 - rd1 >= 30) break; await h.wait(100); }
      const h2 = await h.eval((pi) => window.__test.heading(pi), stage);
      await h.eval(() => window.__test.setInput({ gas: false, brake: false, steer: 0 }));
      if (Math.abs(h1.headAngle) > 0.36) return h.fail('half stick over 50 m at speed wound the heading to ' + h1.headAngle.toFixed(2) + ' rad - the car still points at the grass before the player can catch it');
      if (Math.abs(h2.headAngle - h1.headAngle) > 0.03) return h.fail('with the stick released the heading moved on its own (' + h1.headAngle.toFixed(2) + ' -> ' + h2.headAngle.toFixed(2) + ') - steering must come only from the stick');
      return h.pass('half stick over 50 m at speed wound the heading to only ' + h1.headAngle.toFixed(2) + ' rad, and with the stick released it stayed at ' + h2.headAngle.toFixed(2) + ' (no self-steering)');
    }
  },
  // G-73 (2): the F1 car is about 20% bigger - the drawn car measured 6.45 m
  // long before G-73, so the player car must now draw about 7.7 m long and
  // about 2.2 m wide (real size from the visible meshes, as in G-66).
  {
    id: 'play-car-grew-20-percent', title: 'Apex F1: the car is about 20 percent bigger (G-73)',
    run: async (page, h) => {
      await g33Reset(page, h);
      await page.locator('#careerBtn').click();
      await page.locator('#toTeamBtn').click();
      await page.locator('#startBtn').click();
      await h.wait(1200);
      const mesh = await h.eval(() => { const T = window.__test; const cs = T.cars(); const pi = cs.findIndex(c => c.isPlayer); return T.carMesh(pi); });
      if (!mesh) return h.fail('carMesh hook returned nothing for the player');
      const long = Math.max(mesh.size[0], mesh.size[2]), wide = Math.min(mesh.size[0], mesh.size[2]);
      if (long < 7.3 || long > 8.2) return h.fail('player car draws ' + long.toFixed(2) + ' m long - G-73 wants about 20% bigger than the old 6.45 m (about 7.7 m)');
      if (wide < 2.0 || wide > 2.45) return h.fail('player car draws ' + wide.toFixed(2) + ' m wide - expected about 2.2 m after the 20% growth');
      return h.pass('player car draws ' + long.toFixed(2) + ' m long x ' + wide.toFixed(2) + ' m wide (was 6.45 x 1.86 before G-73)');
    }
  },
  // G-77: the race start must open ON the player car on the grid - no tap.
  // Before G-77 the grid screen ran a 150 m showcase orbit (only grass) until
  // the LIGHTS OUT tap. Also: the start lights by the car must be BIG, the
  // reds must come on one by one up to 5, then green = GO and the race starts.
  {
    id: 'play-start-on-car-with-lights', title: 'Apex F1: race start opens on the player car with big start lights, reds one by one then green (G-77)',
    run: async (page, h) => {
      await g33Reset(page, h);
      await page.locator('#careerBtn').click();
      await page.locator('#toTeamBtn').click();
      await page.locator('#startBtn').click();
      await h.wait(1200);
      await page.locator('#qualiSkip').click();
      let grid = false; // the grid screen, reached without any tap on the canvas
      for (let i = 0; i < 12; i++) { const md = await h.eval(() => window.__test.race().mode); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return h.fail('never reached the grid screen after qualifying');
      await h.wait(600); // let the grid camera settle on the car
      const frame = await h.eval(() => { const T = window.__test; const cs = T.cars(); const pi = cs.findIndex(c => c.isPlayer);
        const tp = T.carMesh(pi).trackPos, cam = T.camAt(); return { d: Math.hypot(cam.x - tp[0], cam.z - tp[2]) }; });
      if (!frame) return h.fail('could not read the camera / player car at the grid');
      if (frame.d > 16) return h.fail('at the grid the camera is ' + frame.d.toFixed(0) + ' m from the player car - the start still opens on grass, not on the car (no tap should be needed)');
      await page.locator('#raceBtn').click();
      let maxRed = 0, sawGreen = false, lampW = 0, racing = false;
      for (let i = 0; i < 80; i++) { const st = await h.eval(() => { const ls = [...document.querySelectorAll('#lights .light')];
          return { red: ls.filter(e => e.classList.contains('red')).length, green: ls.some(e => e.classList.contains('green')),
            w: ls.length ? ls[0].getBoundingClientRect().width : 0, mode: window.__test.race().mode }; });
        if (st.red > maxRed) maxRed = st.red; if (st.green) sawGreen = true; if (st.w > 0) lampW = st.w;
        if (st.mode === 'race') { racing = true; break; } await h.wait(100); }
      if (maxRed !== 5) return h.fail('start lights never showed all 5 red lamps one by one (max red seen: ' + maxRed + ')');
      if (!sawGreen) return h.fail('start lights never flashed green for GO');
      if (!racing) return h.fail('race never started after lights out');
      if (lampW < 48) return h.fail('start lamps are only ' + Math.round(lampW) + ' px wide - they must be big near the car');
      return h.pass('grid opened with the camera ' + frame.d.toFixed(1) + ' m from the player car (no tap), lamps ' + Math.round(lampW) + ' px wide, reds climbed to 5, green flash, race started');
    }
  },
  /* ================= G-101 FRIEND CODE PLAY TEST =================
     Friend codes, played the way a player plays them: my career hub shows
     MY code, a bad code is rejected with the game's own error on the
     friend screen, and pasting a good code (here: my own, which names
     MIKO REYES at rating 90) puts that driver on my race grid as an AI
     car carrying the coded rating. Driven with the game's own buttons;
     the grid is read back through window.__test. */
  {
    id: 'play-friend-code',
    ask: 'friend codes: my code is shown in my career hub, a bad code is rejected, and a friend code puts that driver on my grid at their coded rating (G-101)',
    async test(page, h) {
      const seed = { name: 'MIKO REYES', team: 'apex', season: 1, round: 0, rating: 50, wins: 0, champs: 0, friends: { w: 0, l: 0 }, drivers: [] };
      if (!await g33Reset(page, h, seed)) return 'the game never came back to the menu after a reload';
      // My code: opening my career hub shows the code the game made for me.
      await h.press('#careerBtn');
      await h.wait(400);
      const mine = await h.eval(() => {
        const txt = ((document.getElementById('hubBody') || {}).textContent || '');
        const m = txt.match(/F1APEX-[A-Za-z0-9+/]+(?:-[A-Za-z0-9+/]+)*/);
        if (!m) return { err: 'no friend code in the career hub (hub says: ' + txt.slice(0, 80) + ')' };
        try {
          let s = m[0].replace(/^F1APEX-?/i, '').replace(/[-\s]/g, '');
          while (s.length % 4) s += '=';
          const p = JSON.parse(atob(s));
          if (p.n !== 'MIKO REYES') return { err: 'my code names ' + p.n + ', not MIKO REYES' };
          if (typeof p.o !== 'number') return { err: 'my code carries no rating' };
          return { code: m[0], rating: p.o };
        } catch (e) { return { err: 'my code does not decode: ' + e.message }; }
      });
      if (!mine || mine.err) return (mine && mine.err) || 'could not read my friend code';
      await h.press('#hubMenu');
      // A bad code is rejected with the game's own error and sets up nothing.
      await h.press('#friendBtn');
      await h.eval(() => { document.getElementById('friendIn').value = 'F1APEX-NOT-A-CODE'; });
      await h.press('#friendGo');
      const bad = await h.eval(() => ({
        err: ((document.getElementById('friendErr') || {}).textContent || ''),
        ovOpen: !document.getElementById('friendOv').classList.contains('hidden'),
        trackOpen: !document.getElementById('trackMenu').classList.contains('hidden'),
      }));
      if (!/does not check out/.test(bad.err)) return 'a bad friend code was not rejected (error says: ' + bad.err + ')';
      if (!bad.ovOpen || bad.trackOpen) return 'a bad friend code still left the friend screen';
      // A good code moves on to picking the circuit.
      await h.eval((code) => { document.getElementById('friendIn').value = code; }, mine.code);
      await h.press('#friendGo');
      const set = await h.eval(() => ({
        trackOpen: !document.getElementById('trackMenu').classList.contains('hidden'),
        ovOpen: !document.getElementById('friendOv').classList.contains('hidden'),
      }));
      if (!set.trackOpen || set.ovOpen) return 'a good friend code did not move on to picking the circuit';
      // Start the weekend and skip through qualifying to the grid.
      await h.press('#toTeamBtn');
      await h.press('#startBtn');
      let quali = false;
      for (let i = 0; i < 16; i++) { await h.wait(500); const md = await h.eval(() => window.__test.race().mode).catch(() => ''); if (md === 'quali') { quali = true; break; } }
      if (!quali) return 'the friend weekend never reached qualifying';
      await h.press('#qualiSkip');
      await h.wait(800);
      await h.press('#raceBtn');
      let onGrid = false;
      for (let i = 0; i < 16; i++) { await h.wait(500); const md = await h.eval(() => window.__test.race().mode).catch(() => ''); if (md === 'race' || md === 'lights' || md === 'grid') { onGrid = true; break; } }
      if (!onGrid) return 'the friend race never reached the grid';
      const grid = await h.eval(() => {
        const t = window.__test; if (!t) return null;
        const cs = t.cars(); const pc = t.paceCars();
        const i = cs.findIndex(c => c.name === 'MIK');
        if (i < 0) return { err: 'no MIK car on the grid (grid: ' + cs.map(c => c.name).join(',') + ')' };
        if (cs[i].isPlayer) return { err: 'the MIK car is the player, not the friend' };
        return { skill: pc[i] ? pc[i].skill : null };
      });
      if (!grid) return 'window.__test missing at the grid';
      if (grid.err) return grid.err;
      if (typeof grid.skill !== 'number' || Math.abs(grid.skill - mine.rating / 100) > 0.02) return 'the friend is on the grid but at skill ' + grid.skill + ', not the coded ' + (mine.rating / 100);
      return true;
    },
  },
  {
    id: 'play-grand-prix-kits',
    ask: 'The circuit wears the owner ground kit (asphalt + kerb textures from kit/ground/512) and the engine is the owner grand_prix sound kit: idle/accel loops crossfaded by throttle, shift sounds, tire squeal',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      if (!await h.poll(() => h.eval(`window.__test.race().mode`), m => m === 'quali', 15000)) return 'weekend never reached qualifying';
      const gk = await h.eval(`window.__test.groundKit()`);
      if (!gk || gk.asphalt !== 'kit-ground-asphalt') return 'the road is not wearing the kit asphalt texture: ' + JSON.stringify(gk);
      if (gk.kerb !== 'kit-ground-kerb') return 'the kerbs are not wearing the kit kerb texture: ' + JSON.stringify(gk);
      await h.press('#qualiSkip'); await h.wait(800); await h.press('#raceBtn');
      let racing = false;
      for (let i = 0; i < 16 && !racing; i++) { await h.wait(600); racing = await h.eval(`window.__test.race().mode === 'race'`).catch(() => false); }
      if (!racing) return 'the race never started';
      if (!await h.poll(() => h.eval(`window.__test.kitAudio().ready`), r => r === true, 8000)) return 'the engine sound kit never became ready';
      await h.eval(`window.__test.setInput({ gas:true })`);
      let hot = null;
      const t0 = Date.now();
      while (Date.now() - t0 < 9000) {
        const st = await h.eval(`window.__test.kitAudio()`);
        if (st && st.band >= 2 && st.rate > 1.0) { hot = st; break; }
        await h.wait(400);
      }
      if (!hot) return 'the engine kit never sang under throttle: ' + JSON.stringify(await h.eval(`window.__test.kitAudio()`));
      if (!(hot.shifts >= 1)) return 'no gear-shift sound fired while accelerating: ' + JSON.stringify(hot);
      await h.eval(`window.__test.setInput({ gas:true, steer:1 })`);
      let squeal = 0;
      const t1 = Date.now();
      while (Date.now() - t1 < 7000) {
        const st = await h.eval(`window.__test.kitAudio()`);
        if (st && st.squeal > 0.02) { squeal = st.squeal; break; }
        await h.wait(300);
      }
      await h.eval(`window.__test.setInput({ gas:false, steer:0 })`);
      if (!squeal) return 'the tire squeal never sounded off track: ' + JSON.stringify(await h.eval(`window.__test.kitAudio()`));
      return true;
    },
  },
  {
    id: 'play-cameras-above-ground',
    ask: 'Every CAM view (chase, cockpit, broadcast helicopter, onboard) stays above the road with the car and the track ahead in view, sideways and upright - the owner saw the helicopter cam under the ground',
    async test(page, h) {
      const stopDriving = async () => { await h.eval(`(() => { if (window.__g119drv) { clearInterval(window.__g119drv); window.__g119drv = null; } const t = window.__test; if (t) t.setInput({ gas:false, brake:false, steer:0 }); })()`).catch(() => {}); };
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      { let quali = false;
        for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
        if (!quali) return 'weekend never reached qualifying'; }
      await h.press('#qualiSkip'); await h.wait(800); await h.press('#raceBtn');
      let racing = false;
      for (let i = 0; i < 16 && !racing; i++) { await h.wait(600); racing = await h.eval(`window.__test.race().mode === 'race'`).catch(() => false); }
      if (!racing) return 'the race never started';
      // a robot driver keeps the car circulating while the views cycle
      await h.eval(`(() => {
        if (window.__g119drv) { clearInterval(window.__g119drv); window.__g119drv = null; }
        window.__g119drv = setInterval(() => {
          const t = window.__test; if (!t || !t.paceCars) return;
          const cs = t.paceCars(); const p = cs.find(c => c.isPlayer); if (!p) return;
          const ref = t.lineAt(p.s + p.v * 0.5 + 18);
          let steer = (ref.rlD - p.d) * 0.5 - p.headAngle * 1.1;
          steer = Math.max(-1, Math.min(1, steer));
          t.setInput({ gas: true, brake: false, steer });
        }, 50);
      })()`);
      const NAMES = ['CHASE', 'COCKPIT', 'BROADCAST', 'ONBOARD'];
      const sampleMode = async (mode, dwellMs) => {
        for (let i = 0; i < 5; i++) {
          const pr = await h.eval(`window.__test.camProbe()`);
          if (pr && pr.mode === mode) break;
          await h.press('#btnCam'); await h.wait(200);
        }
        const pr0 = await h.eval(`window.__test.camProbe()`);
        if (!pr0 || pr0.mode !== mode) return 'CAM button never reached ' + NAMES[mode];
        let worst = 1e9, judged = 0, inFrame = 0;
        const t0 = Date.now();
        while (Date.now() - t0 < dwellMs) {
          const pr = await h.eval(`window.__test.camProbe()`);
          if (pr) {
            const clear = pr.camY - pr.groundY;
            if (clear < worst) worst = clear;
            if (Date.now() - t0 > dwellMs / 2) { // framing judged on the settled half
              judged++;
              const v = (mode === 0 || mode === 2) ? pr.car : pr.ahead;
              if (v && Math.abs(v.x) <= 1.02 && Math.abs(v.y) <= 1.02 && v.z < 1 && v.z > -1) inFrame++;
            }
          }
          await h.wait(220);
        }
        if (worst < 0.25) return NAMES[mode] + ' camera went under the road (clearance ' + worst.toFixed(2) + ' m)';
        if (judged && inFrame / judged < 0.8) return NAMES[mode] + ' lost the car / track ahead (' + inFrame + '/' + judged + ' settled frames in view)';
        return null;
      };
      for (const m of [0, 1, 2, 3]) { const bad = await sampleMode(m, 2000); if (bad) { await stopDriving(); return bad; } }
      await page.setViewportSize({ width: 390, height: 844 }); await h.wait(500); // upright phone
      for (const m of [0, 1, 2, 3]) { const bad = await sampleMode(m, 1100); if (bad) { await stopDriving(); return 'upright phone: ' + bad; } }
      await page.setViewportSize({ width: 844, height: 390 });
      await stopDriving();
      return true;
    },
  },
  {
    id: 'never-g-119-p1',
    ask: 'Start button on the screen: LIGHTS OUT and every menu fits 844x390 with no scrolling (the owner had to scroll to start the race)',
    async test(page, h) {
      const fits = async (label) => {
        const r = await h.eval(`(() => {
          const vis = [...document.querySelectorAll('.overlay')].find(o => !o.classList.contains('hidden'));
          if (!vis) return { err: 'no menu visible' };
          return { id: vis.id, sh: vis.scrollHeight, ch: vis.clientHeight };
        })()`);
        if (!r || r.err) return label + ': ' + (r ? r.err : 'probe failed');
        if (r.sh > r.ch + 1) return label + ' (' + r.id + ') needs scrolling: content is ' + r.sh + 'px tall on a ' + r.ch + 'px screen';
        return null;
      };
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      let bad = await fits('main menu'); if (bad) return bad;
      await h.press('#careerBtn'); await h.wait(400);
      bad = await fits('track menu'); if (bad) return bad;
      await h.press('#toTeamBtn'); await h.wait(400);
      bad = await fits('team menu'); if (bad) return bad;
      await h.press('#startBtn');
      { let quali = false;
        for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
        if (!quali) return 'weekend never reached qualifying'; }
      await h.press('#qualiSkip'); await h.wait(800);
      bad = await fits('starting grid menu'); if (bad) return bad;
      const btn = await h.eval(`(() => { const b = document.getElementById('raceBtn').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, ih: window.innerHeight }; })()`);
      if (!btn || btn.top < -1 || btn.bottom > btn.ih + 1) return 'LIGHTS OUT is off the screen (button ' + (btn ? Math.round(btn.top) + '..' + Math.round(btn.bottom) : '?') + ' on a ' + (btn ? btn.ih : '?') + 'px tall phone)';
      return true;
    },
  },
  {
    id: 'play-steering-holds-the-line',
    ask: 'Steering gives real control: the car turns in with the stick, holds the racing line, and straightens the moment the stick is released (owner: steering is bad, he cannot stay on the track)',
    async test(page, h) {
      const stopDriving = async () => { await h.eval(`(() => { if (window.__g136drv) { clearInterval(window.__g136drv); window.__g136drv = null; } const t = window.__test; if (t) t.setInput({ gas:false, brake:false, steer:0 }); })()`).catch(() => {}); };
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      { let quali = false;
        for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
        if (!quali) return 'weekend never reached qualifying'; }
      await h.press('#qualiSkip'); await h.wait(800); await h.press('#raceBtn');
      let racing = false;
      for (let i = 0; i < 16 && !racing; i++) { await h.wait(600); racing = await h.eval(`window.__test.race().mode === 'race'`).catch(() => false); }
      if (!racing) return 'the race never started';
      // drive alone: jump the player ahead of the pack so no contact can shove him
      await h.eval(`window.__test.setCarS(0, 400)`);
      await h.eval(`window.__test.setInput({ gas:true, brake:false, steer:0 })`);
      for (let i = 0; i < 10; i++) { await h.wait(300); const v = await h.eval(`window.__test.steerProbe().v`).catch(() => 0); if (v > 40) break; }
      // PART 1 - the release: wind the nose over with a held push, then let go.
      // A wheel that stays wound drifts the car off the road (today: ~10 m in 2.5 s).
      await h.eval(`window.__test.setInput({ gas:true, brake:false, steer:1 })`);
      await h.wait(350);
      const d0 = await h.eval(`window.__test.steerProbe().d`);
      await h.eval(`window.__test.setInput({ gas:true, brake:false, steer:0 })`);
      await h.wait(2500);
      const rel = await h.eval(`window.__test.steerProbe()`);
      if (!rel) return 'steer probe lost the player';
      if (Math.abs(rel.headAngle) > 0.06) { await stopDriving(); return 'the car did not straighten on release: heading still ' + rel.headAngle.toFixed(2) + ' rad with the stick centered'; }
      if (Math.abs(rel.d - d0) > 3.5) { await stopDriving(); return 'letting go of the stick drifted the car ' + Math.abs(rel.d - d0).toFixed(1) + ' m sideways in 2.5 s - it must straighten at once'; }
      // PART 2 - hold the line: a stick driver (the game's own damped line law,
      // corner braking from its own speed table) drives a sector; the car must
      // never leave the road and kerb (|d| <= width/2 + 1.6).
      await h.eval(`(() => { const t = window.__test; window.__g136drv = setInterval(() => { const q = t.steerProbe(); if (!q) return; const steer = Math.max(-1, Math.min(1, (q.line - q.d) * 0.5 - q.headAngle * 1.1)); t.setInput({ gas: q.v < q.maxV * 1.18, brake: q.v > q.maxV * 1.18, steer }); }, 100); })()`);
      const s0 = rel.s;
      let worst = 0, last = rel;
      for (let i = 0; i < 24; i++) { await h.wait(500); last = await h.eval(`window.__test.steerProbe()`).catch(() => null); if (!last) break; if (Math.abs(last.d) > worst) worst = Math.abs(last.d); }
      await stopDriving();
      if (!last) return 'steer probe lost the player while driving';
      if (worst > 8.6) return 'the car left the track under stick driving: |d| reached ' + worst.toFixed(1) + ' m (road + kerb ends at 8.6)';
      if (last.s - s0 < 700) return 'the driven sector was too short: ' + Math.round(last.s - s0) + ' m in 12 s';
      return true;
    },
  }

];
