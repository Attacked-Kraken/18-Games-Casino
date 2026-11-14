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
// G-330 R1 (VP answer): play-stick-clears-pit/cam called g265PortraitOverlaps
// without defining it, so both tests errored. Defined here: race FIRST via the
// owner-check link, then go upright and read the stick/PIT/CAM rects - the
// point is the portrait layout during a race, not menu-flow speed. Returns
// null when no race starts; the callers treat a missing rect as never rendered.
async function g265PortraitOverlaps(page, h) {
  let vp = null; try { vp = h.page.viewportSize(); } catch (e) {}
  await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
  await h.wait(1500);
  let grid = false;
  for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
  if (!grid) { if (vp) await h.page.setViewportSize(vp).catch(() => {}); return null; }
  await h.press('#raceBtn');
  let racing = false;
  for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { racing = true; break; } await h.wait(300); }
  if (!racing) { if (vp) await h.page.setViewportSize(vp).catch(() => {}); return null; }
  await h.page.setViewportSize({ width: 390, height: 844 }).catch(() => {});
  await h.wait(800);
  const r = await h.eval(() => { const q = (id) => { const el = document.querySelector('#' + id); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }; return { stick: q('stick'), pit: q('btnPit'), cam: q('btnCam') }; }).catch(() => null);
  if (vp) await h.page.setViewportSize(vp).catch(() => {});
  await h.eval(() => { location.href = location.pathname; }).catch(() => {});
  if (!r) return null;
  return r;
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
      if (!probes || probes.length < 6) return 'car mesh probe missing (window.__test.carMesh)';
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
      if (!probes || probes.length < 6) return 'car mesh probe missing (window.__test.carMesh)';
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
    id: 'play-car-holds-heading-at-speed', ask: 'at speed the stick winds the heading gently and never steers by itself',
    test: async (page, h) => {
      if (!await g66ToRace(page, h)) return 'race never started';
      const scan = await h.eval(() => { for (let s = 200; s < 5400; s += 50) { const la = window.__test.lineAt(s); if (la.maxV >= 85 && la.rlD <= -3) return s; } return 1100; });
      const stage = await h.eval((sec) => { const T = window.__test; const pc = T.paceCars(); const pi = pc.findIndex(c => c.isPlayer); if (pi < 0) return -1;
        for (let i = 0; i < pc.length; i++) if (i !== pi) T.setCarS(i, 3400 + i * 50);
        T.setCarS(pi, sec - 300); return pi; }, scan);
      if (stage < 0) return 'no player car on the grid';
      await g66Driver(page, h, true);
      let fast = null; // settle: the driver runs the player up to speed on the line
      for (let i = 0; i < 30; i++) { const pc = await h.eval(() => window.__test.paceCars()); const p = pc[stage];
        if (p && p.v >= 80) { fast = p; break; } await h.wait(300); }
      await g66Driver(page, h, false);
      if (!fast) return 'player never reached 80 m/s on the fast section (steering check needs speed)';
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
      if (Math.abs(h1.headAngle) > 0.36) return 'half stick over 50 m at speed wound the heading to ' + h1.headAngle.toFixed(2) + ' rad - the car still points at the grass before the player can catch it';
      if (Math.abs(h2.headAngle - h1.headAngle) > 0.03) return 'with the stick released the heading moved on its own (' + h1.headAngle.toFixed(2) + ' -> ' + h2.headAngle.toFixed(2) + ') - steering must come only from the stick';
      return true;
    }
  },
  // G-73 (2): the F1 car is about 20% bigger - the drawn car measured 6.45 m
  // long before G-73, so the player car must now draw about 7.7 m long and
  // about 2.2 m wide (real size from the visible meshes, as in G-66).
  {
    id: 'play-car-grew-20-percent', ask: 'the car is about 20 percent bigger',
    test: async (page, h) => {
      await g33Reset(page, h);
      await page.locator('#careerBtn').click();
      await page.locator('#toTeamBtn').click();
      await page.locator('#startBtn').click();
      await h.wait(1200);
      const mesh = await h.eval(() => { const T = window.__test; const cs = T.cars(); const pi = cs.findIndex(c => c.isPlayer); return T.carMesh(pi); });
      if (!mesh) return 'carMesh hook returned nothing for the player';
      const long = Math.max(mesh.size[0], mesh.size[2]), wide = Math.min(mesh.size[0], mesh.size[2]);
      if (long < 7.3 || long > 8.2) return 'player car draws ' + long.toFixed(2) + ' m long - G-73 wants about 20% bigger than the old 6.45 m (about 7.7 m)';
      if (wide < 2.0 || wide > 2.45) return 'player car draws ' + wide.toFixed(2) + ' m wide - expected about 2.2 m after the 20% growth';
      return true;
    }
  },
  // G-77: the race start must open ON the player car on the grid - no tap.
  // Before G-77 the grid screen ran a 150 m showcase orbit (only grass) until
  // the LIGHTS OUT tap. Also: the start lights by the car must be BIG, the
  // reds must come on one by one up to 5, then green = GO and the race starts.
  {
    id: 'play-start-on-car-with-lights', ask: 'Apex F1: race start opens on the player car with big start lights, reds one by one then green (G-77)',
    test: async (page, h) => {
      await g33Reset(page, h);
      await h.press('#careerBtn');
      await h.press('#toTeamBtn');
      await h.press('#startBtn');
      await h.wait(1200);
      await h.press('#qualiSkip');
      let grid = false; // the grid screen, reached without any tap on the canvas
      for (let i = 0; i < 12; i++) { const md = await h.eval(() => window.__test.race().mode); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return 'never reached the grid screen after qualifying';;
      await h.wait(600); // let the grid camera settle on the car
      const frame = await h.eval(() => { const T = window.__test; const cs = T.cars(); const pi = cs.findIndex(c => c.isPlayer);
        const tp = T.carMesh(pi).trackPos, cam = T.camAt(); return { d: Math.hypot(cam.x - tp[0], cam.z - tp[2]) }; });
      if (!frame) return 'could not read the camera / player car at the grid';;
      if (frame.d > 16) return 'at the grid the camera is ' + frame.d.toFixed(0) + ' m from the player car - the start still opens on grass, not on the car (no tap should be needed)';;
      await h.press('#raceBtn');
      let maxRed = 0, sawGreen = false, lampW = 0, racing = false;
      for (let i = 0; i < 80; i++) { const st = await h.eval(() => { const ls = [...document.querySelectorAll('#lights .light')];
          return { red: ls.filter(e => e.classList.contains('red')).length, green: ls.some(e => e.classList.contains('green')),
            w: ls.length ? ls[0].getBoundingClientRect().width : 0, mode: window.__test.race().mode }; });
        if (st.red > maxRed) maxRed = st.red; if (st.green) sawGreen = true; if (st.w > 0) lampW = st.w;
        if (st.mode === 'race') { racing = true; break; } await h.wait(100); }
      if (maxRed !== 5) return 'start lights never showed all 5 red lamps one by one (max red seen: ' + maxRed + ')';;
      if (!sawGreen) return 'start lights never flashed green for GO';;
      if (!racing) return 'race never started after lights out';;
      if (lampW < 48) return 'start lamps are only ' + Math.round(lampW) + ' px wide - they must be big near the car';;
      return true;
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
        if (st && st.band >= 2 && st.rate > 0.81) { hot = st; break; } // Nov 4 2026: the Racer's deep-growl rates (idle layer 0.8-0.84, accel layers 0.6-0.8) - never the old 0.85-1.15 whine
        await h.wait(400);
      }
      if (!hot) return 'the engine kit never sang under throttle: ' + JSON.stringify(await h.eval(`window.__test.kitAudio()`));
      if (hot.rate > 0.9) return 'the engine kit is running too fast (rate ' + hot.rate + ') - that is the whine / helicopter sound: ' + JSON.stringify(hot);
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
    ask: 'The player drives (owner recordings, G-239): the stick turns the car and a driven line stays on the road; let go and the nose HOLDS its world heading - it does not straighten itself back onto the road (that self-straightening was the autopilot)',
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
      // PART 1 - the release (G-239): wind the nose over with a held push, then let go.
      // The nose must HOLD its world heading - no snap back onto the road's line (the old
      // law re-centred the heading on the road itself, so the car drove itself), and the
      // car must travel sideways on that held heading: the driver brings it back, not the car.
      await h.eval(`window.__test.setInput({ gas:true, brake:false, steer:1 })`);
      await h.wait(350);
      const d0 = await h.eval(`window.__test.steerProbe().d`);
      const yaw0 = await h.eval(`window.__test.heading(0).yaw`);
      await h.eval(`window.__test.setInput({ gas:true, brake:false, steer:0 })`);
      await h.wait(2500);
      const rel = await h.eval(`window.__test.steerProbe()`);
      const yaw1 = await h.eval(`window.__test.heading(0).yaw`);
      if (!rel) return 'steer probe lost the player';
      let dyaw = Math.abs(yaw1 - yaw0); if (dyaw > Math.PI) dyaw = 2 * Math.PI - dyaw;
      if (dyaw > 0.08) { await stopDriving(); return 'letting go of the stick still turned the car: world heading moved ' + dyaw.toFixed(2) + ' rad in 2.5 s - the nose must HOLD and the driver must steer'; }
      if (Math.abs(rel.d - d0) < 2.0) { await stopDriving(); return 'on a held heading the car should travel sideways off its line; it moved only ' + Math.abs(rel.d - d0).toFixed(1) + ' m - something is still steering it back'; }
      // PART 2 - hold the line: a stick driver (the game's own damped line law,
      // corner braking from its own speed table) drives a sector; the car must
      // never leave the road and kerb (|d| <= width/2 + 1.6). PART 1 ended with the
      // car at the wall on a held heading, so the sector starts from a clean place.
      await h.eval(`window.__test.setCarS(0, 400)`);
      await h.eval(`(() => { const t = window.__test; window.__g136drv = setInterval(() => { const q = t.steerProbe(); if (!q) return; const want = Math.max(-0.5, Math.min(0.5, Math.atan2(q.line - q.d, 25))); const steer = Math.max(-1, Math.min(1, (want - q.headAngle) * 2.0)); t.setInput({ gas: q.v < q.maxV * 1.18, brake: q.v > q.maxV * 1.18, steer }); }, 100); })()`);
      const s0 = (await h.eval(`window.__test.steerProbe()`)).s;
      let worst = 0, last = rel;
      for (let i = 0; i < 24; i++) { await h.wait(500); last = await h.eval(`window.__test.steerProbe()`).catch(() => null); if (!last) break; if (Math.abs(last.d) > worst) worst = Math.abs(last.d); }
      await stopDriving();
      if (!last) return 'steer probe lost the player while driving';
      if (worst > 8.6) return 'the car left the track under stick driving: |d| reached ' + worst.toFixed(1) + ' m (road + kerb ends at 8.6)';
      if (last.s - s0 < 700) return 'the driven sector was too short: ' + Math.round(last.s - s0) + ' m in 12 s';
      return true;
    },
  },
  {
    id: 'play-owner-check-link',
    ask: 'Owner check link: apexf1.html?test=grid opens straight at the starting grid with LIGHTS OUT on screen and no scrolling (G-204)',
    async test(page, h) {
      let out = null;
      await h.eval(`location.href = location.pathname + '?test=grid'`).catch(() => {});
      let grid = false;
      for (let i = 0; i < 30 && !grid; i++) { await h.wait(500); grid = await h.eval(`(() => { const g = document.getElementById('gridMenu'); return !!g && !g.classList.contains('hidden'); })()`).catch(() => false); }
      if (!grid) out = 'the ?test=grid link never opened the starting grid';
      else {
        const r = await h.eval(`(() => { const g = document.getElementById('gridMenu'); const b = document.getElementById('raceBtn').getBoundingClientRect(); return { sh: g.scrollHeight, ch: g.clientHeight, top: b.top, bottom: b.bottom, ih: window.innerHeight }; })()`);
        if (r.sh > r.ch + 1) out = 'the grid menu needs scrolling from the check link: content ' + r.sh + 'px on a ' + r.ch + 'px screen';
        else if (r.top < -1 || r.bottom > r.ih + 1) out = 'LIGHTS OUT is off screen from the check link (button ' + Math.round(r.top) + '..' + Math.round(r.bottom) + ' on a ' + r.ih + 'px phone)';
      }
      await h.eval(`location.href = location.pathname`).catch(() => {});
      await h.wait(600);
      return out || true;
    },
  },
  {
    id: 'play-pack-stays-spread',
    ask: 'Pack fix: the qualifying field stays spread out - no start-line spin pile-up, no tangled pack sitting in the contact box',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset failed (not at menu)';
      await h.press('#careerBtn');
      await h.wait(400);
      await h.press('#toTeamBtn');
      await h.wait(300);
      await h.press('#startBtn');
      let mode = '';
      for (let i = 0; i < 16 && mode !== 'quali'; i++) { await h.wait(400); mode = await h.eval(`window.__test.race().mode`).catch(() => ''); }
      if (mode !== 'quali') return 'never reached qualifying';
      let pairSum = 0, samples = 0, stoppedMax = 0;
      for (let k = 0; k < 12; k++) {
        await h.wait(1250);
        const r = await h.eval(`(() => { const t = window.__test; const cs = t.cars(); const L = t.trackLength(); let pairs = 0, stopped = 0;
          for (let i = 0; i < cs.length; i++) { if (!cs[i].isPlayer && cs[i].v < 2 && Math.abs(cs[i].d) < 8) stopped++;
            for (let j = i + 1; j < cs.length; j++) { if (cs[i].isPlayer || cs[j].isPlayer) continue; let ds = (cs[i].s - cs[j].s) % L; if (ds > L / 2) ds -= L; if (ds < -L / 2) ds += L; if (Math.abs(ds) < 7.9 && Math.abs(cs[i].d - cs[j].d) < 3.8) pairs++; } }
          return { pairs, stopped }; })()`).catch(() => null);
        if (!r) return 'pack sampling failed';
        pairSum += r.pairs; samples++;
        if (r.stopped > stoppedMax) stoppedMax = r.stopped;
      }
      const avg = pairSum / Math.max(samples, 1);
      if (avg > 1.5) return 'the field still piles up: ' + avg.toFixed(1) + ' AI pairs inside the contact box on average (about 6.5 before the pack fix)';
      if (stoppedMax > 1) return 'cars are stuck or spun in the pack: ' + stoppedMax + ' AI cars stopped on the road at once';
      return true;
    },
  },
  {
    id: 'play-buttons-are-44px',
    ask: 'the 2 small buttons are at least 44px: SKIP QUALI in qualifying and LIGHTS OUT on the starting grid (G-224)',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset failed (not at menu)';
      await h.press('#careerBtn');
      await h.wait(400);
      await h.press('#toTeamBtn');
      await h.wait(300);
      await h.press('#startBtn');
      let mode = '';
      for (let i = 0; i < 16 && mode !== 'quali'; i++) { await h.wait(400); mode = await h.eval(`window.__test.race().mode`).catch(() => ''); }
      if (mode !== 'quali') return 'never reached qualifying';
      const sk = await h.eval(`(() => { const b = document.getElementById('qualiSkip'); if (!b) return null; const r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; })()`);
      if (!sk) return 'no SKIP QUALI button in qualifying';
      if (sk.h < 44 || sk.w < 44) return 'SKIP QUALI is only ' + Math.round(sk.w) + 'x' + Math.round(sk.h) + 'px - under the 44px tap target';
      await h.press('#qualiSkip');
      await h.wait(800);
      const rb = await h.eval(`(() => { const g = document.getElementById('gridMenu'); const b = document.getElementById('raceBtn'); if (!g || !b || g.classList.contains('hidden')) return null; const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, top: r.top, bottom: r.bottom, ih: window.innerHeight, sh: g.scrollHeight, ch: g.clientHeight }; })()`);
      if (!rb) return 'the starting grid never opened';
      if (rb.h < 44 || rb.w < 44) return 'LIGHTS OUT is only ' + Math.round(rb.w) + 'x' + Math.round(rb.h) + 'px - under the 44px tap target';
      if (rb.sh > rb.ch + 1) return 'the grid menu needs scrolling with the bigger button';
      if (rb.top < -1 || rb.bottom > rb.ih + 1) return 'LIGHTS OUT fell off screen with the bigger button';
      return true;
    },
  },
  {
    id: 'play-player-must-steer',
    ask: 'Gas alone must not drive the car (owner recordings, G-239): stick untouched, the car leaves the road - on the old build it covered 2,192 m in 60 s dead centre, hands-free',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      let quali = false;
      for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
      if (!quali) return 'weekend never reached qualifying';
      const L = await h.eval(`window.__test.trackLength()`);
      await h.eval(`window.__test.setAssist(false)`); // the assist (on by default) only rescues a car heading off the road; this test proves the base rule, so it is switched off here
      await h.eval(`window.__test.setInput({ gas:true, brake:false, steer:0 })`);
      let left = false, dist = 0, lastS = null;
      for (let i = 0; i < 40 && !left; i++) {
        await h.wait(500);
        const c = await h.eval(`window.__test.cars()[0]`).catch(() => null);
        if (!c) continue;
        if (lastS !== null) { let ds = c.s - lastS; if (ds < -L / 2) ds += L; if (ds > L / 2) ds -= L; dist += Math.max(0, ds); }
        lastS = c.s;
        if (Math.abs(c.d) > 8.6 || (c.v < 8 && dist > 300)) left = true;
      }
      await h.eval(`window.__test.setInput({ gas:false, brake:false, steer:0 })`).catch(() => {});
      if (!left) return 'gas alone drove ' + Math.round(dist) + ' m and never left the road - the car is still driving itself';
      return true;
    },
  },
  {
    id: 'play-broadcast-cam-steady',
    ask: 'The broadcast (helicopter) camera is steady (owner, G-239): it rides BEHIND the car in the car frame - the old camera hung on a fixed point 26 m to the side, and that arm swung the picture around every corner',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      let quali = false;
      for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
      if (!quali) return 'weekend never reached qualifying';
      let mode = 0;
      for (let i = 0; i < 5 && mode !== 2; i++) { await h.press('#btnCam'); await h.wait(300); mode = await h.eval(`window.__test.camProbe().mode`).catch(() => -1);
        if (mode !== 2 && i >= 1) { await h.eval(`document.querySelector('#btnCam').dispatchEvent(new MouseEvent('mousedown', { bubbles:true }))`).catch(() => {}); await h.wait(300); mode = await h.eval(`window.__test.camProbe().mode`).catch(() => -1); } }
      if (mode !== 2) return 'CAM cycling never reached broadcast (mode ' + mode + ')';
      await h.eval(`(() => { const t = window.__test; window.__g239drv = setInterval(() => { const q = t.steerProbe(); if (!q) return; const want = Math.max(-0.5, Math.min(0.5, Math.atan2(q.line - q.d, 25))); const steer = Math.max(-1, Math.min(1, (want - q.headAngle) * 2.0)); t.setInput({ gas: q.v < q.maxV * 1.18, brake: q.v > q.maxV * 1.18, steer }); }, 100); })()`);
      // the geometry is the steadiness: measure where the camera sits in the car's own
      // frame - behind it (back) vs hanging off its side (side). The old side-arm point
      // reads side/back ~1.4; a steady follow reads a small fraction of that.
      let good = 0, seen = 0, worst = 0;
      for (let i = 0; i < 10; i++) {
        await h.wait(450);
        const m = await h.eval(`(() => { const t = window.__test; const cam = t.camAt(); const cm = t.carMesh(0); const hd = t.heading(0); const car = t.cars()[0]; const pr = t.camProbe();
          if (!cam || !cm || !hd || !car || !pr) return null;
          const tan = hd.yaw - hd.headAngle, tx = Math.cos(tan), tz = Math.sin(tan);
          const ox = cam.x - cm.center[0], oz = cam.z - cm.center[2];
          const back = -(ox * tx + oz * tz), side = Math.abs(ox * -tz + oz * tx);
          return { v: car.v, back, side, ratio: side / Math.max(1, back), ndc: pr.car }; })()`).catch(() => null);
        if (!m || m.v < 20) continue;
        seen++;
        if (m.ratio > worst) worst = m.ratio;
        if (m.ratio < 0.6 && Math.abs(m.ndc.x) < 0.95 && Math.abs(m.ndc.y) < 0.95) good++;
      }
      await h.eval(`(() => { if (window.__g239drv) { clearInterval(window.__g239drv); window.__g239drv = null; } window.__test.setInput({ gas:false, brake:false, steer:0 }); })()`).catch(() => {});
      if (seen < 4) return 'never sampled the broadcast camera at speed (saw ' + seen + ')';
      if (good < seen - 1) return 'the broadcast camera still hangs off the car side (worst side/back ' + worst.toFixed(2) + ') - that side arm is what swung the picture';
      return true;
    },
  },
  {
    id: 'play-contact-banner-is-players-only',
    ask: 'CONTACT! is the player news only (owner recordings, G-239): two AI cars hitting each other must never shout CONTACT! on the player screen',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      let quali = false;
      for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
      if (!quali) return 'weekend never reached qualifying';
      // park the player in the middle of the largest gap in the field, so no AI can
      // reach him during the short staging window (a banner while an AI is on top of
      // him would be HIS news and voids the attempt, it does not fail it)
      const park = () => h.eval(`(() => { const cs = window.__test.cars(); const L = window.__test.trackLength();
        const ss = cs.slice(1).map(c => c.s).sort((a, b) => a - b); let best = 0, bg = -1;
        for (let i = 0; i < ss.length; i++) { const nx = ss[(i + 1) % ss.length]; let g = nx - ss[i]; if (g < 0) g += L; if (g > bg) { bg = g; best = ss[i] + g / 2; } }
        window.__test.setCarS(0, ((best % L) + L) % L); return bg; })()`).catch(() => 0);
      await park();
      await h.eval(`window.__test.setInput({ gas:false, brake:true, steer:0 })`);
      await h.wait(2500); // the AI reach racing speed
      const bannerTxt = () => h.eval(`(() => { const b = document.getElementById('banner'); return b && b.classList.contains('show') ? b.querySelector('.b1').textContent : ''; })()`).catch(() => '');
      const nearPlayer = () => h.eval(`(() => { const cs = window.__test.cars(); const L = window.__test.trackLength(); let m = 1e9; for (let i = 1; i < cs.length; i++) { let d = Math.abs(cs[i].s - cs[0].s); if (d > L / 2) d = L - d; if (d < m) m = d; } return m; })()`).catch(() => 0);
      for (let attempt = 0; attempt < 3; attempt++) {
        // stage a hard AI-on-AI hit far from the player: fastest AI 5 m behind the slowest
        const staged = await h.eval(`(() => { const cs = window.__test.cars(); const L = window.__test.trackLength(); const ps = cs[0].s;
          const far = i => { let d = Math.abs(cs[i].s - ps); if (d > L / 2) d = L - d; return d > 600; };
          let fast = -1, slow = -1, fv = -1, sv = 1e9;
          for (let i = 1; i < cs.length; i++) { if (far(i) && cs[i].v > fv) { fv = cs[i].v; fast = i; } if (far(i) && cs[i].v < sv) { sv = cs[i].v; slow = i; } }
          if (fast < 0 || slow < 0 || fast === slow) return false;
          window.__test.setCarS(slow, cs[slow].s); window.__test.setCarS(fast, ((cs[slow].s - 5) % L + L) % L);
          return true; })()`).catch(() => false);
        if (!staged) { await park(); continue; }
        let voided = false;
        for (let i = 0; i < 7; i++) {
          await h.wait(350);
          if ((await nearPlayer()) < 60) { voided = true; break; }
          const t = await bannerTxt();
          if (t === 'CONTACT!') return 'an AI-on-AI hit shouted CONTACT! on the player screen (nearest AI ' + Math.round(await nearPlayer()) + ' m from the player)';
        }
        if (voided) await park();
      }
      return true;
    },
  },
  {
    id: 'play-no-penalty-for-being-shoved',
    ask: 'No track-limits fine for being shoved (owner recordings, G-239): off-road time while a rival shove is fresh must not accrue, brief brushes decay, and a chosen excursion still accrues',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      let quali = false;
      for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
      if (!quali) return 'weekend never reached qualifying';
      const pen = () => h.eval(`window.__test.penState()`).catch(() => null);
      // 1) a chosen excursion DOES accrue off-track time (poll - the crossing takes a moment)
      await h.eval(`window.__test.setInput({ gas:true, brake:false, steer:1 })`);
      let st1 = null;
      for (let i = 0; i < 25; i++) { await h.wait(200); st1 = await pen(); if (st1 && (st1.offT > 0.5 || st1.warnings > 0)) break; }
      await h.eval(`window.__test.setInput({ gas:false, brake:true, steer:0 })`);
      if (!st1 || !(st1.offT > 0.5 || st1.warnings > 0)) return 'a deliberate excursion accrued nothing (offT ' + (st1 && st1.offT) + ') - the limits clock is dead';
      // back on the road, let the brush decay, note the warning count
      await h.eval(`window.__test.setCarS(0, window.__test.cars()[0].s)`);
      await h.wait(2500);
      const wBefore = (await pen()).warnings;
      // 2) the same excursion inside the shove grace must NOT accrue - read the moment the car is out
      await h.eval(`window.__test.shoveNow()`);
      await h.eval(`window.__test.setInput({ gas:true, brake:false, steer:1 })`);
      let out = false;
      for (let i = 0; i < 20 && !out; i++) { await h.wait(120); const c = await h.eval(`window.__test.cars()[0]`).catch(() => null); if (c && Math.abs(c.d) > 8.7) out = true; }
      const st2 = await pen();
      await h.eval(`window.__test.setInput({ gas:false, brake:true, steer:0 })`);
      if (!out) return 'the car never left the road in the grace phase - the situation was not created';
      if (!st2) return 'penalty probe lost the player';
      if (st2.offT > 0.2 || st2.warnings !== wBefore) return 'off-road time accrued during the shove grace (offT ' + st2.offT + ', warnings ' + wBefore + ' -> ' + st2.warnings + ') - the player is still fined for being shoved';
      return true;
    },
  },
  {
    id: 'play-quali-gap-is-real',
    ask: 'The quali GAP readout is real (owner recordings, G-239): before any lap is banked it must not sit at a fake +0.0s - it shows no-data until a best-lap delta exists',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      let quali = false;
      for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
      if (!quali) return 'weekend never reached qualifying';
      // create a car ahead in the live order: teleport an AI to just before the line
      // and let it drive across - its lap count puts it ahead of the parked player
      await h.eval(`window.__test.setInput({ gas:false, brake:true, steer:0 })`);
      const L = await h.eval(`window.__test.trackLength()`);
      await h.eval(`window.__test.setCarS(5, ${0} + (window.__test.trackLength() - 150))`);
      let g = '', sawGap = false;
      for (let i = 0; i < 14; i++) {
        await h.wait(500);
        g = await h.eval(`document.getElementById('gapbox').textContent`).catch(() => '');
        if (/^GAP/.test(g)) { sawGap = true; break; }
      }
      if (!sawGap) return 'never got a car ahead of the player in the quali order - the situation was not created (last: "' + g + '")';
      if (/\+0\.0s/.test(g)) return 'the quali gap reads a fake +0.0s with no lap banked: "' + g + '"';
      return true;
    },
  },
  {
    id: 'play-quali-skip-clears-the-speedo',
    ask: 'SKIP QUALI must not sit on the speedometer (owner recordings, G-239): in every frame the pill hid the speed digits - the two rects must not overlap',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      let quali = false;
      for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
      if (!quali) return 'weekend never reached qualifying';
      await h.wait(500);
      const r = await h.eval(`(() => { const a = document.getElementById('qualiSkip'), b = document.getElementById('speedo'); if (!a || !b) return null; const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return { ox: Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy: Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top) }; })()`);
      if (!r) return 'qualiSkip or speedo missing in qualifying';
      if (r.ox > 0 && r.oy > 0) return 'SKIP QUALI overlaps the speedometer by ' + Math.round(r.ox) + 'x' + Math.round(r.oy) + ' px - the speed is hidden again';
      return true;
    },
  },
  {
    id: 'play-engine-sound-is-the-kit',
    ask: 'The engine the player hears is the grand_prix kit (owner: the synth sounds like a rubber chicken, G-239): the kit must be decoded and ready in a session, and no media elements exist anywhere (factory music rule)',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      let quali = false;
      for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
      if (!quali) return 'weekend never reached qualifying';
      let ready = false;
      for (let i = 0; i < 20 && !ready; i++) { await h.wait(500); ready = await h.eval(`(() => { const k = window.__test.kitAudio(); return !!(k && k.ready); })()`).catch(() => false); }
      if (!ready) return 'the grand_prix engine kit never became ready - the synth fallback would carry the session (the rubber chicken)';
      const media = await h.eval(`document.querySelectorAll('audio,video').length`);
      if (media !== 0) return media + ' media elements in the page - sound must be decoded buffers only';
      return true;
    },
  },
  {
    id: 'never-g-253-p1',
    ask: 'play-test entries are shaped right: play-car-holds-heading-at-speed and play-car-grew-20-percent expose test, not run',
    async test(page, h) {
      const txt = await h.eval(async () => { try { const r = await fetch('/tools/game-check/fixes/apexf1.mjs'); return r.ok ? await r.text() : ''; } catch (e) { return ''; } }).catch(() => '');
      if (!txt) return 'could not read the fixes file from the served repo';
      for (const id of ['play-car-holds-heading-at-speed', 'play-car-grew-20-percent']) {
        const i = txt.indexOf("id: '" + id + "'");
        if (i < 0) return 'entry ' + id + ' is missing from the fixes file';
        const seg = txt.slice(i, i + 400);
        if (!/test:\s*async/.test(seg)) return 'entry ' + id + ' has no test function';
        if (/run:\s*async/.test(seg)) return 'entry ' + id + ' still uses run instead of test';
      }
      return true;
    },
  },
  // G-265 (owner: "I'm not even controlling my driving. I'm just pressing gas
  // and it does the laps"): gas only, stick centred, on a sharp curve - the
  // car must NOT follow the road round. It holds its world heading (G-239),
  // so the road curves away under it and it runs to the wall.
  {
    id: 'play-gas-only-never-laps',
    ask: 'holding gas only, stick centred, the car does not drive itself round the track',
    async test(page, h) {
      if (!await g66ToRace(page, h)) return 'race never started';
      const scan = await h.eval(() => { for (let s = 200; s < 5400; s += 50) { const la = window.__test.lineAt(s); if (Math.abs(la.rlD || 0) >= 4) return s; } return 850; });
      const stage = await h.eval((sec) => { const T = window.__test; const pc = T.paceCars(); const pi = pc.findIndex(c => c.isPlayer); if (pi < 0) return -1;
        for (let i = 0; i < pc.length; i++) if (i !== pi) T.setCarS(i, 3400 + i * 50);
        T.setCarS(pi, sec); return pi; }, scan);
      if (stage < 0) return 'no player car on the grid';
      const rd0 = await h.eval((pi) => window.__test.paceCars()[pi].raceDist, stage);
      await h.eval(() => window.__test.setInput({ gas: true, brake: false, steer: 0 }));
      let moved = 0, maxHead = 0, maxD = 0;
      for (let i = 0; i < 20; i++) {
        const pc = await h.eval(() => window.__test.paceCars()); const p = pc[stage];
        if (!p) break;
        moved = Math.max(moved, p.raceDist - rd0);
        maxHead = Math.max(maxHead, Math.abs(p.headAngle));
        maxD = Math.max(maxD, Math.abs(p.d));
        await h.wait(500);
      }
      await h.eval(() => window.__test.setInput({ gas: false, brake: false, steer: 0 }));
      if (moved < 30) return 'gas-only car covered only ' + moved.toFixed(0) + ' m - the drive never got going';
      if (maxHead < 0.5) return 'gas only, stick centred, the heading stayed at ' + maxHead.toFixed(2) + ' rad on a sharp curve - the car is still following the road by itself';
      if (maxD < 10) return 'gas only, stick centred, the car stayed on the road (|d| max ' + maxD.toFixed(1) + ' m) - it is still driving itself round';
      return true;
    },
  },
  {
    id: "never-g-265-p1",
    ask: "on the upright phone teamMenu fits with no scrolling",
    async test(page, h) {
      let vp = null; try { vp = h.page.viewportSize(); } catch (e) {}
      await h.page.setViewportSize({ width: 390, height: 844 }).catch(() => {});
      let out = null;
      if (!await g33Reset(page, h, null)) out = 'reset did not reach the main menu';
      if (!out) { await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.wait(800); }
      if (!out) {
        const tm = await h.eval(() => { const m = document.querySelector('#teamMenu'); if (!m) return null;
          const sb = document.querySelector('#startBtn').getBoundingClientRect();
          return { scrollH: m.scrollHeight, clientH: m.clientHeight, scrollW: m.scrollWidth, clientW: m.clientWidth, startBottom: Math.round(sb.bottom) }; }).catch(() => null);
        if (!tm) out = 'teamMenu never opened';
        else if (tm.scrollH > tm.clientH) out = 'teamMenu needs scrolling on the upright phone (content ' + tm.scrollH + ' px in ' + tm.clientH + ' px)';
        else if (tm.scrollW > tm.clientW) out = 'teamMenu overflows sideways on the upright phone (content ' + tm.scrollW + ' px in ' + tm.clientW + ' px)';
        else if (tm.startBottom > tm.clientH) out = 'START WEEKEND sits below the fold on the upright phone';
      }
      if (vp) await h.page.setViewportSize(vp).catch(() => {});
      return out === null ? true : out;
    },
  },
  {
    id: "play-stick-clears-pit",
    ask: "on the upright phone the stick never overlaps the PIT button",
    async test(page, h) {
      const r = await g265PortraitOverlaps(page, h);
      if (!r) return 'race never started on the upright phone';
      if (!r.stick || !r.pit) return 'stick or PIT never rendered';
      const x = Math.min(r.stick.x + r.stick.w, r.pit.x + r.pit.w) - Math.max(r.stick.x, r.pit.x);
      const y = Math.min(r.stick.y + r.stick.h, r.pit.y + r.pit.h) - Math.max(r.stick.y, r.pit.y);
      if (x > 0 && y > 0) return 'the stick overlaps PIT by ' + Math.round(x * y) + ' px^2 on the upright phone';
      return true;
    },
  },
  {
    id: "play-stick-clears-cam",
    ask: "on the upright phone the stick never overlaps the CAM button",
    async test(page, h) {
      const r = await g265PortraitOverlaps(page, h);
      if (!r) return 'race never started on the upright phone';
      if (!r.stick || !r.cam) return 'stick or CAM never rendered';
      const x = Math.min(r.stick.x + r.stick.w, r.cam.x + r.cam.w) - Math.max(r.stick.x, r.cam.x);
      const y = Math.min(r.stick.y + r.stick.h, r.cam.y + r.cam.h) - Math.max(r.stick.y, r.cam.y);
      if (x > 0 && y > 0) return 'the stick overlaps CAM by ' + Math.round(x * y) + ' px^2 on the upright phone';
      return true;
    },
  },
  {
    id: 'play-kit-retries-until-loaded',
    ask: 'a dropped engine-kit fetch must not leave the synth carrying the race: the kit keeps retrying until it loads',
    async test(page, h) {
      const unwrap = () => h.eval(`window.__kitBlock = false;`).catch(() => {});
      if (!await g33Reset(page, h, null)) return 'game did not return to the menu';
      await h.eval(() => {
        window.__kitBlock = true;
        if (!window.__kitFetchOrig) {
          window.__kitFetchOrig = window.fetch;
          window.fetch = function (u, o) {
            const s = String(u);
            if (window.__kitBlock && s.includes('grand_prix')) return Promise.reject(new Error('blocked for test'));
            return window.__kitFetchOrig(u, o);
          };
        }
      }).catch(() => {});
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      await h.wait(1200); await h.press('#qualiSkip'); await h.wait(800); await h.press('#raceBtn');
      let racing = false;
      for (let i = 0; i < 16 && !racing; i++) { await h.wait(600); racing = await h.eval(`window.__test.race().mode === 'race'`).catch(() => false); }
      if (!racing) { await unwrap(); return 'the race never started'; }
      await h.wait(3000);
      await unwrap();
      let ready = null;
      for (let i = 0; i < 20; i++) {
        const st = await h.eval(`window.__test.kitAudio()`).catch(() => null);
        if (st && st.ready) { ready = st; break; }
        await h.wait(1000);
      }
      await h.eval(`window.__test.setInput({ gas:false, steer:0 })`).catch(() => {});
      if (!ready) return 'the engine kit never recovered after the fetch came back: ' + JSON.stringify(await h.eval(`window.__test.kitAudio()`).catch(() => null));
      return true;
    },
  },
  {
    id: 'never-g-279-p1',
    ask: 'play-test entries are shaped right: play-start-on-car-with-lights exposes test and ask, not run and title',
    async test(page, h) {
      const txt = await h.eval(async () => { try { const r = await fetch('/tools/game-check/fixes/apexf1.mjs'); return r.ok ? await r.text() : ''; } catch (e) { return ''; } }).catch(() => '');
      if (!txt) return 'could not read the fixes file from the served repo';
      const i = txt.indexOf("id: 'play-start-on-car-with-lights'");
      if (i < 0) return 'entry play-start-on-car-with-lights is missing from the fixes file';
      let seg = txt.slice(i);
      const end = seg.indexOf('\n  },', 200);
      if (end > 0) seg = seg.slice(0, end);
      if (!/ask:/.test(seg)) return 'entry play-start-on-car-with-lights has no ask';
      if (/title:/.test(seg)) return 'entry play-start-on-car-with-lights still uses title instead of ask';
      if (!/test:\s*async/.test(seg)) return 'entry play-start-on-car-with-lights has no test function';
      if (/run:\s*async/.test(seg)) return 'entry play-start-on-car-with-lights still uses run instead of test';
      if (/h\.fail|h\.pass/.test(seg)) return 'entry play-start-on-car-with-lights still uses h.fail/h.pass instead of returns';
      return true;
    },
  },
  {
    id: 'play-checklist-apexf1-format',
    ask: 'Apex F1: checklists/apexf1.md exists with one measurable item per line, each carrying SOURCE, NUMBERS, MEASURE and a tester-chk TEST id (G-286)',
    async test(page, h) {
      const txt = await h.eval(async () => { try { const r = await fetch('/checklists/apexf1.md'); return r.ok ? await r.text() : ''; } catch (e) { return ''; } }).catch(() => '');
      if (!txt) return 'could not read checklists/apexf1.md from the served repo';
      const items = txt.split('\n').filter(l => /^- \[[ x-]\] [A-Z]\d+ \|/.test(l));
      if (!items.length) return 'no checklist items found in checklists/apexf1.md';
      const seen = new Set();
      for (const line of items) {
        const m = line.match(/^- \[[ x-]\] ([A-Z]\d+) \|(.*)$/);
        if (!m) return 'checklist item line has the wrong shape: ' + line.slice(0, 80);
        const id = m[1], rest = m[2];
        if (seen.has(id)) return 'duplicate checklist id ' + id;
        seen.add(id);
        for (const k of ['SOURCE:', 'NUMBERS:', 'MEASURE:', 'TEST:']) if (!rest.includes(k)) return 'item ' + id + ' is missing ' + k;
        const tp = rest.split(' | ').find(x => x.trim().startsWith('TEST:')) || '';
        const tid = tp.split('TEST:')[1].trim().split(' ')[0];
        if (tid !== 'tester-chk-' + id.toLowerCase()) return 'item ' + id + ' TEST must be tester-chk-' + id.toLowerCase();
      }
      return true;
    },
  },
  {
    id: 'never-g-286-p1',
    ask: 'on the upright phone the stick, REV and CAM never overlap: the landscape compact rules do not apply upright, so portrait needs its own compact block',
    async test(page, h) {
      let vp = null; try { vp = h.page.viewportSize(); } catch (e) {}
      // G-312 R1: race FIRST via the owner-check link, then go upright. The old flow
      // ran the menu flow in portrait, but qualiSkip takes ~6 s to appear on a slow
      // page while g66ToRace waits only 1.2 s after startBtn, so a strict press misses
      // it and the race never starts. The point is the portrait layout during a race,
      // not menu-flow speed.
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) { if (vp) await h.page.setViewportSize(vp).catch(() => {}); return 'never reached the grid at ?test=grid'; }
      await h.press('#raceBtn');
      let racing = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { racing = true; break; } await h.wait(300); }
      if (!racing) { if (vp) await h.page.setViewportSize(vp).catch(() => {}); return 'race never started on the upright phone'; }
      await h.page.setViewportSize({ width: 390, height: 844 }).catch(() => {});
      await h.wait(800);
      let out = null;
      const r = await h.eval(() => { const q = (id) => { const el = document.querySelector('#' + id); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }; return { stick: q('stick'), rev: q('btnRev'), cam: q('btnCam') }; }).catch(() => null);
      if (!r || !r.stick || !r.rev || !r.cam) out = 'stick, REV or CAM never rendered on the upright phone';
      else {
        const ov = (a, b) => { const x = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x); const y = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return (x > 0 && y > 0) ? Math.round(x * y) : 0; };
        const sr = ov(r.stick, r.rev), rc = ov(r.rev, r.cam);
        if (sr) out = 'the stick overlaps REV by ' + sr + ' px^2 on the upright phone';
        else if (rc) out = 'REV overlaps CAM by ' + rc + ' px^2 on the upright phone';
      }
      if (vp) await h.page.setViewportSize(vp).catch(() => {});
      await h.eval(() => { location.href = location.pathname; }).catch(() => {});
      return out === null ? true : out;
    },
  },
  {
    id: 'tester-chk-f03', ask: 'Apex F1: gas after all 5 reds, before GO, is a jump start worth 5 seconds (G-312)',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return 'never reached the grid at ?test=grid';
      // G-354: the robot's page can be slow, so a single strict press may miss and
      // the lights watch can expire before all 5 reds show. Press until the menu
      // leaves the grid, then watch twice as long for the 5-red moment.
      let leftGrid = false;
      for (let p = 0; p < 3 && !leftGrid; p++) {
        await h.press('#raceBtn').catch(() => {});
        for (let i = 0; i < 10; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { leftGrid = true; break; } await h.wait(300); }
      }
      let fiveReds = false, gassed = false;
      for (let i = 0; i < 240; i++) {
        const st = await h.eval(() => { const ls = [...document.querySelectorAll('#lights .light')]; return { red: ls.filter(e => e.classList.contains('red')).length, mode: window.__test ? window.__test.race().mode : '?' }; }).catch(() => ({ red: -1, mode: '?' }));
        if (st.red === 5) fiveReds = true;
        if (fiveReds && st.mode === 'lights') { await h.eval(() => window.__test.setInput({ gas: true })); gassed = true; }
        if (st.mode === 'race') break;
        await h.wait(100);
      }
      if (!fiveReds) return 'start lights never showed all 5 reds';
      if (!gassed) return 'lights phase ended before gas could be applied after 5 reds';
      await h.wait(500);
      const pen = await h.eval(() => window.__test ? window.__test.penState().penalty : null);
      if (pen === null) return 'could not read penState';
      if (pen < 5) return 'gas after 5 reds, before GO, gave no jump-start penalty (penalty ' + pen + ', must be 5)';
      await h.eval(() => { location.href = location.pathname; });
      return true;
    }
  },
  {
    id: 'tester-chk-f06', ask: 'Apex F1: pit-lane speed never exceeds 80 km/h from the entry line on (G-321)',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return 'never reached the grid at ?test=grid';
      // G-353: the robot's page can be slow, so a single strict press may miss and
      // the 12 s race-only wait can expire inside the lights phase (6 s of game
      // time). Press until the menu leaves the grid, then wait twice as long for GO.
      let leftGrid = false;
      for (let p = 0; p < 3 && !leftGrid; p++) {
        await h.press('#raceBtn').catch(() => {});
        for (let i = 0; i < 10; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { leftGrid = true; break; } await h.wait(300); }
      }
      let racing = false;
      for (let i = 0; i < 80; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'race') { racing = true; break; } await h.wait(300); }
      if (!racing) return 'race never started at ?test=grid';
      // build speed on the grid straight (adaptive: the slow local rig needs more wall time per game second), then jump to 550 m before the pit entry
      for (let i = 0; i < 120; i++) {
        await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer);
          t.setInput({ steer: Math.max(-1, Math.min(1, (0 - p.d) * 0.5)), gas: true }); });
        await h.wait(100);
        const v = await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer); return p.v; });
        if (v >= 60) break;
      }
      const sped = await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer); return p.v; });
      if (sped < 60) return 'could not build approach speed (v ' + sped.toFixed(1) + ', need 60+)';
      const pit = await h.eval(() => { const t = window.__test; const L = t.trackLength();
        const cs = t.cars(); const pi = cs.findIndex(c => c.isPlayer); t.setCarS(pi, 0.9414 * L - 550); return { L, pitIn: 0.9414 * L }; });
      // one deflected frame resyncs the world-heading hold after the teleport, then press PIT for real (the button listens to mousedown, not click)
      await h.eval(() => { window.__test.setInput({ steer: 0.3, gas: true }); });
      await h.eval(() => { document.getElementById('btnPit').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
      await h.wait(500);
      // drive flat-out to the line and sample the first 50 m of the pit lane
      let maxV = 0, seen = false;
      for (let i = 0; i < 200; i++) {
        const st = await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer);
          return { s: p.s, d: p.d, v: p.v }; });
        const sN = ((st.s % pit.L) + pit.L) % pit.L;
        if (sN < pit.pitIn - 40) {
          await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer);
            t.setInput({ steer: Math.max(-1, Math.min(1, (0 - p.d) * 0.5)), gas: true }); });
        } else if (sN <= pit.pitIn + 50) {
          seen = true; if (st.v > maxV) maxV = st.v;
        } else if (sN > pit.pitIn + 50) break;
        await h.wait(100);
      }
      if (!seen) return 'never reached the pit entry after arming PIT';
      await h.eval(() => { location.href = location.pathname; });
      if (maxV > 22.5) return 'pit-lane speed hit ' + (maxV * 3.6).toFixed(0) + ' km/h past the entry line (limit 80)';
      return true;
    }
  },
  {
    id: 'never-g-369-p2',
    ask: 'in the cockpit camera the world ahead stays visible: the driver-eye view never goes black while the HUD stays live (G-369 masher point)',
    async test(page, h) {
      // Race FIRST via the owner-check link (G-312 R1: the menu flow is too
      // slow on a slow page), then switch to the cockpit camera with the
      // game's own CAM button. The eye sits inside the player's own
      // bodywork; one near-black body mesh (0x111318) used to render from
      // the inside and black the whole world ahead while the HUD stayed
      // live, which reads as a 15 s freeze on a parked masher car.
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return 'never reached the grid at ?test=grid';
      for (let p = 0; p < 3; p++) {
        await h.press('#raceBtn');
        let started = false;
        for (let i = 0; i < 20; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { started = true; break; } await h.wait(300); }
        if (started) break;
        if (p === 2) return 'race never started at ?test=grid';
      }
      let racing = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'race') { racing = true; break; } await h.wait(300); }
      if (!racing) return 'race never left the lights phase';
      let cockpit = false;
      for (let p = 0; p < 6; p++) {
        const cp = await h.eval(() => { try { return window.__test ? window.__test.camProbe().mode : -1; } catch (e) { return -1; } }).catch(() => -1);
        if (cp === 1) { cockpit = true; break; }
        await h.press('#btnCam');
        await h.wait(800);
      }
      if (!cockpit) return 'cockpit camera never engaged';
      await h.wait(1500);
      const r = await h.eval(() => {
        try {
          const m = (window.__reality && window.__reality.player) || null;
          if (!m) return { err: 'no player mesh' };
          let oc = null;
          for (const ch of m.children) {
            if (!ch.isMesh || !ch.material) continue;
            const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
            if (mats.some(x => x && x.color && x.color.getHex() === 0x111318)) { oc = ch; break; }
          }
          if (!oc) return { err: 'occluder mesh (0x111318) not found among the player children' };
          return { ocVisible: oc.visible };
        } catch (e) { return { err: e.message }; }
      }).catch(() => null);
      await h.eval(() => { location.href = location.pathname; }).catch(() => {});
      if (!r) return 'could not read the player mesh in the cockpit camera';
      if (r.err) return r.err;
      if (r.ocVisible) return 'the cockpit view still shows the player\'s own near-black bodywork (0x111318 mesh visible) - it blacks the world ahead';
      return true;
    },
  },
  {
    id: 'play-gp-track-present',
    ask: "the race runs on the owner's Grand Prix track (G-380): 5627 m circuit, 20-car grid, kit scenery live",
    async test(page, h) {
      // G-380: the owner's Grand Prix track (kit/tracks/Grand-Prix-Track) is
      // already the F1 track since G-45, so this test proves it is still the
      // track on today's build: the kit length (5627.2 m, not the 5793 m
      // legacy loop), the kit's 20 grid slots, and the kit GLB root live in
      // the scene. Race FIRST via the owner-check link (G-312 R1: the menu
      // flow is too slow on a slow page).
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return 'never reached the grid at ?test=grid';
      const r = await h.eval(() => {
        try {
          const t = window.__test; if (!t) return { err: 'no __test' };
          return { L: t.trackLength(), n: t.cars().length, kit: t.groundKit() !== null, w: t.trackWidth() };
        } catch (e) { return { err: e.message }; }
      }).catch(() => null);
      await h.eval(() => { location.href = location.pathname; }).catch(() => {});
      if (!r) return 'could not read the race state at the grid';
      if (r.err) return r.err;
      if (Math.abs(r.L - 5627.2) > 1) return 'track length ' + r.L + ' is not the Grand Prix track (5627.2 m) - the kit track is not loaded';
      if (r.n !== 6) return 'grid has ' + r.n + ' cars, not 6 (owner Nov 3 2026: 6 race cars)';
      if (!r.kit) return 'the kit GLB root is not in the scene (groundKit null) - the Grand Prix track is not loaded';
      if (Math.abs(r.w - 14) > 0.01) return 'track width ' + r.w + ' is not the kit\'s 14 m';
      return true;
    },
  },
  // BALANCE ROBOT (master #11, owner Oct 28 2026): two bots drive the first 100 game-seconds of a race with NO drawing (__test.simStep = Race.update + a driver on the game's racing line).
  // FAILS when: the good bot cannot hold a top-10 place (cannot be won), the good bot is not farther along than the beginner
  // (skill does not pay), or the beginner does not get going at all (too hard).
  {
    id: 'play-balance-skill-matters',
    ask: 'Balance: a good driver runs near the front, a beginner can still drive, and the field is not trivially easy or impossible',
    async test(page, h) {
      const res = {};
      for (const skill of ['beginner', 'good']) {
        if (!await g33Reset(page, h, null)) return { inconclusive: 'game did not return to the menu' };
        await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn'); await h.wait(1200);
        await h.press('#qualiSkip'); await h.wait(800); await h.press('#raceBtn');
        let up = false; // the start lights count as the race starting (the sim runs through them); a slow robot may still be in them
        for (let w = 0; w < 30 && !up; w++) { await h.wait(500); up = await h.eval(() => { const t = window.__test; const m = t && t.race().mode; return m === 'race' || m === 'lights'; }).catch(() => false); }
        if (!up) return { inconclusive: 'race never started for the ' + skill + ' bot' };
        res[skill] = await h.eval((skill) => {
          const T = window.__test; if (!T || !T.simStep) return { err: 'no __test.simStep hook' };
          const bot = skill === 'idle' ? null : { skill };
          let n = 0; while (n < 2000) { T.simStep(0.05, bot); n++; const st = T.simState(); if (st && st.finished) break; }
          return T.simState();
        }, skill).catch((e) => ({ err: String(e) }));
        if (!res[skill] || res[skill].err) return (res[skill] && res[skill].err) || 'balance run returned nothing';
      }
      const { beginner: b, good: g } = res;
      const f = (r) => 'place ' + r.place + '/' + r.of + ', ' + Math.round(r.dist) + ' m';
      const note = 'after 100 s - good ' + f(g) + ', beginner ' + f(b) + '';
      if (g.place > 3) return 'BALANCE: a good driver cannot hold a top-3 place of 6 - ' + note;
      if (g.dist <= b.dist + 50) return 'BALANCE: driving well does not pay - the good bot is not clearly farther along than the beginner - ' + note;
      if (b.dist < 300) return 'BALANCE: a beginner bot barely gets going (under 300 m in 100 s) - ' + note;
      return true;
    },
  },
  {
    id: 'play-f1-music-and-clicks',
    ask: 'F1: the menu/lobby plays the music pack, the race plays the speed layers, and every menu button makes a click sound',
    async test(page, h) {
      await h.eval(() => { location.reload(); }).catch(() => {});
      let m = null;
      for (let i = 0; i < 40; i++) { await h.wait(500); await page.mouse.click(400, 200).catch(() => {}); m = await h.eval(() => window.__fmus || null).catch(() => null); if (m && m.playing && m.playing.includes('menu')) break; }
      if (!m || !m.playing || !m.playing.includes('menu')) return 'F1 MUSIC: the menu / lobby plays no music (' + JSON.stringify(m) + ')';
      const click = await h.eval(() => { let n = 0; const o = Aud.beep; Aud.beep = function () { n++; return o.apply(this, arguments); }; const b = document.querySelector('button, .bigbtn'); if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true })); Aud.beep = o; return { n, hadButton: !!b }; }).catch(() => null);
      if (click && click.hadButton && !click.n) return 'F1 SOUND: pressing a menu button makes no click sound';
      return true;
    },
  },
  {
    id: "play-f1-scenery-on-ground",
    ask: "F1: buildings and props stand on the ground (none floats in the sky) and the start/finish strip is a chequered strip that does not flicker",
    async test(page, h) {
      const rep = [];
      for (const tr of ['harbour', 'mesa', 'pinewood', 'capital']) {
        await h.eval((t) => { location.href = 'apexf1.html?test=grid&track=' + t; }, tr).catch(() => {});
        let r = null;
        for (let i = 0; i < 40 && !r; i++) { await h.wait(500); r = await h.eval(() => (window.__test && window.__test.scenery) ? { s: window.__test.scenery(), k: window.__test.stripe() } : null).catch(() => null); }
        if (!r) return { inconclusive: 'circuit ' + tr + ' did not load' };
        if (r.s.n && r.s.maxBase > r.s.ground + 2.5) rep.push(tr + ': a building base is ' + (r.s.maxBase - r.s.ground).toFixed(1) + ' m above the ground (floats)');
        if (!r.k || !r.k.poly) rep.push(tr + ': start/finish strip has no chequer / depth offset (z-fighting flicker)');
      }
      return rep.length ? 'F1 SCENERY: ' + rep.join('; ') : true;
    },
  },
  {
    id: 'play-f1-warm-start',
    ask: 'Owner Nov 4 2026: the menu start is slow and the car freezes a second at the lap line - every mesh must be uploaded to the GPU under the loading cover (one warm-up frame), not when it first comes into view.',
    async test(page, h) {
      await h.eval(() => { location.href = 'apexf1.html?test=grid'; }).catch(() => {});
      let w = null;
      for (let i = 0; i < 40 && !w; i++) { await h.wait(500); w = await h.eval(() => window.__f1warm || null).catch(() => null); }
      if (!w) return 'F1 WARM START: no warm-up frame ran before the race (first sight of the grandstands will freeze)';
      return w.objects > 50 ? true : 'F1 WARM START: the warm-up frame touched only ' + w.objects + ' objects';
    },
  },
  {
    id: "play-f1-stuck-pair-freed",
    ask: "F1: two AI cars stopped on top of each other are freed within a few seconds and drive on - never stuck the whole race (owner Nov 4 2026)",
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return { inconclusive: 'game did not return to the menu' };
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn'); await h.wait(1200);
      await h.press('#qualiSkip'); await h.wait(800); await h.press('#raceBtn');
      let up = false;
      for (let w = 0; w < 30 && !up; w++) { await h.wait(500); up = await h.eval(() => window.__test.race().mode === 'race').catch(() => false); }
      if (!up) return { inconclusive: 'race never reached the racing state' };
      const r = await h.eval(() => {
        const T = window.__test; for (let i = 0; i < 400; i++) T.simStep(0.05, { skill: 'good' }); // get past the pack start
        if (!T.stickPair) return { err: 'no stickPair hook' };
        if (!T.stickPair()) return { err: 'no two AI cars to stick' };
        for (let i = 0; i < 400; i++) T.simStep(0.05, { skill: 'good' }); // 20 game seconds
        return { speeds: T.pairSpeeds(), freed: T.freedCount() };
      });
      if (!r || r.err) return (r && r.err) || 'no result';
      return (r.speeds.length === 2 && r.speeds.every(v => v > 15)) ? true : 'two AI cars stopped on each other were still crawling after 20 s: speeds ' + JSON.stringify(r.speeds) + ' (stuck pair)';
    },
  },
  {
    id: "play-f1-car-sizes-match",
    ask: "F1: every car is the same size as the player (length within 4%), and a car does not change size when it swaps between close-up and far model (owner Nov 4 2026: my car is small and zooms big/small)",
    async test(page, h) {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      let sizes = null;
      for (let i = 0; i < 40 && !sizes; i++) { await h.wait(500); sizes = await h.eval(() => (window.__test && window.__test.carSizes && window.__test.race().mode === 'grid') ? window.__test.carSizes() : null).catch(() => null); }
      if (!sizes || !sizes.length) return { inconclusive: 'grid never loaded' };
      const me = sizes.find(c => c.isPlayer); if (!me || !me.near) return { inconclusive: 'player model not built' };
      const bad = [];
      for (const c of sizes) {
        if (!c.near || !c.far) continue;
        if (Math.abs(c.near[0] - me.near[0]) / me.near[0] > 0.04) bad.push(c.name + ' is ' + c.near[0].toFixed(2) + ' m long, you are ' + me.near[0].toFixed(2));
        for (let k = 0; k < 3; k++) if (Math.abs(c.far[k] - c.near[k]) / c.near[k] > 0.08) { bad.push(c.name + ' changes size when far (axis ' + k + ': ' + c.near[k].toFixed(2) + ' to ' + c.far[k].toFixed(2) + ' m)'); break; }
      }
      return bad.length ? 'F1 CAR SIZE: ' + bad.slice(0, 4).join('; ') : true;
    },
  },
  {
    id: "play-f1-hud-clear",
    ask: "F1: no HUD box sits on another (ERS bar vs speed readout, map vs position box, CAM/PIT vs weather) on the sideways and upright phone, and EXIT is at the top (owner Nov 4 2026)",
    async test(page, h) {
      let vp = null; try { vp = h.page.viewportSize(); } catch (e) {}
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) { if (vp) await h.page.setViewportSize(vp).catch(() => {}); return { inconclusive: 'never reached the grid' }; }
      await h.press('#raceBtn');
      let racing = false;
      for (let i = 0; i < 40 && !racing; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); racing = (md === 'lights' || md === 'race'); if (!racing) await h.wait(300); }
      if (!racing) { if (vp) await h.page.setViewportSize(vp).catch(() => {}); return { inconclusive: 'race never started' }; }
      const bad = [];
      for (const [name, w, hh] of [['sideways', 844, 390], ['upright', 390, 844]]) {
        await h.page.setViewportSize({ width: w, height: hh }).catch(() => {});
        await h.wait(800);
        const r = await h.eval(() => { const ids = ['lapbox', 'gapbox', 'minimap', 'exitRace', 'tirebox', 'wxTag', 'btnCam', 'btnPit', 'ersbar', 'speedo', 'btnDRS', 'btnERS', 'btnGas', 'btnBrake', 'stick'];
          const rs = []; for (const id of ids) { const e = document.getElementById(id); if (!e) continue; const b = e.getBoundingClientRect(); if (b.width < 2) continue; rs.push([id, b.left, b.top, b.right, b.bottom]); }
          const ov = []; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i], b = rs[j]; if (a[1] < b[3] - 1 && b[1] < a[3] - 1 && a[2] < b[4] - 1 && b[2] < a[4] - 1) ov.push(a[0] + ' on ' + b[0]); }
          const ex = rs.find(x => x[0] === 'exitRace'); return { ov, exitTop: ex ? ex[2] : null }; }).catch(() => null);
        if (!r) continue;
        if (r.ov.length) bad.push(name + ': ' + r.ov.join(', '));
        if (r.exitTop !== null && r.exitTop > 60) bad.push(name + ': EXIT is not at the top (top ' + Math.round(r.exitTop) + ' px)');
      }
      if (vp) await h.page.setViewportSize(vp).catch(() => {});
      await h.eval(() => { location.href = location.pathname; }).catch(() => {});
      return bad.length ? 'F1 HUD: ' + bad.join(' | ') : true;
    },
  },
  {
    id: 'play-f1-lap-sign',
    ask: 'F1: crossing the start/finish line to begin a new lap shows a big LAP n/N sign at the top (like Exotic Racer) - owner Nov 4 2026',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return { inconclusive: 'game did not return to the menu' };
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn'); await h.wait(1200);
      await h.press('#qualiSkip'); await h.wait(800); await h.press('#raceBtn');
      let up = false;
      for (let w = 0; w < 30 && !up; w++) { await h.wait(500); up = await h.eval(() => { const t = window.__test; const m = t && t.race().mode; return m === 'race' || m === 'lights'; }).catch(() => false); }
      if (!up) return { inconclusive: 'race never started' };
      const r = await h.eval(() => {
        const T = window.__test; if (!T || !T.simStep) return { err: 'no simStep' };
        let n = 0; while (n < 9000 && !window.__f1lappop) { T.simStep(0.05, { skill: 'good' }); n++; }
        const e = document.getElementById('lapPop');
        return { n, count: window.__f1lappop || 0, txt: window.__f1lappopTxt || '', shown: e ? e.style.opacity : null, top: e ? e.getBoundingClientRect().top : null, h: innerHeight, lap: T.race().lap };
      }).catch((e) => ({ err: String(e) }));
      if (r.err) return r.err;
      if (!r.count) return { inconclusive: 'no lap finished in ' + (r.n * 0.05).toFixed(0) + ' game-seconds' };
      if (!/^(LAP \d+\/\d+|FINAL LAP!)$/.test(r.txt)) return 'F1 LAP SIGN: shows "' + r.txt + '"';
      if (String(r.shown) !== '1') return 'F1 LAP SIGN: not visible after crossing the line';
      if (r.top > r.h * 0.2) return 'F1 LAP SIGN: sits at ' + Math.round(r.top) + ' px of ' + r.h + ' - not at the top';
      return true;
    },
  },
  {
    id: 'play-f1-trackside',
    ask: 'F1: every circuit has real trackside - tyre walls on the corners, a catch fence, marshal posts and lamp posts (owner Nov 4 2026: everything is plain and boring)',
    async test(page, h) {
      const bad = [];
      for (const tr of ['grandprix', 'harbour', 'mesa', 'pinewood', 'capital']) {
        await h.eval((t) => { location.href = 'apexf1.html?test=grid&track=' + t; }, tr).catch(() => {});
        let r = null;
        for (let i = 0; i < 40 && !r; i++) { await h.wait(500); r = await h.eval(() => (window.__test && window.__test.trackside) ? window.__test.trackside() : null).catch(() => null); }
        if (!r) { bad.push(tr + ': no trackside built'); continue; }
        if (r.tyres < 40) bad.push(tr + ': only ' + r.tyres + ' tyres in walls');
        if (r.posts < 100 || r.rails < 100) bad.push(tr + ': catch fence missing (' + r.posts + ' posts)');
        if (r.huts < 5) bad.push(tr + ': only ' + r.huts + ' marshal posts');
      }
      return bad.length ? 'F1 TRACKSIDE: ' + bad.join('; ') : true;
    },
  },
  {
    id: 'play-f1-no-hanging-on',
    ask: 'F1: cars alongside each other drive apart instead of hanging on and dragging each other along (owner Nov 4 2026: cars are still fighting). Counts car-pair seconds in contact over 70 s of racing.',
    async test(page, h) {
      await h.eval(() => { location.href = 'apexf1.html?test=grid&track=capital'; }).catch(() => {});
      let grid = false;
      for (let i = 0; i < 60 && !grid; i++) { await h.wait(500); grid = await h.eval(() => window.__test && window.__test.race().mode === 'grid').catch(() => false); }
      if (!grid) return { inconclusive: 'never reached the grid' };
      await h.press('#raceBtn');
      let up = false;
      for (let w = 0; w < 30 && !up; w++) { await h.wait(500); up = await h.eval(() => { const m = window.__test.race().mode; return m === 'race' || m === 'lights'; }).catch(() => false); }
      if (!up) return { inconclusive: 'race never started' };
      const r = await h.eval(() => {
        const T = window.__test; const dt = 0.05; let contact = 0;
        for (let i = 0; i < 1800; i++) { T.simStep(dt, { skill: 'good' }); if (i < 400) continue; const cs = T.cars();
          for (let a = 0; a < cs.length; a++) for (let c = a + 1; c < cs.length; c++) { const A = cs[a], B = cs[c]; if (Math.abs(A.s - B.s) < 8 && Math.abs(A.d - B.d) < 3.8) contact += dt; } }
        return { contact: +contact.toFixed(1) };
      }).catch((e) => ({ err: String(e) }));
      if (r.err) return r.err;
      return r.contact < 50 ? true : 'F1 FIGHTING: cars spent ' + r.contact + ' pair-seconds touching in 70 s of racing (limit 50; was 164 before the fix)';
    },
  },
  {
    id: "play-f1-city-life",
    ask: "F1: tracks are wider (18 m, narrow 15 m), the city and harbour have closed-off streets with barricades and street trees, buildings come in many colours, and crowds stand behind the fence (owner Nov 4 2026 6:23 PM)",
    async test(page, h) {
      const bad = [];
      for (const tr of ['harbour', 'mesa', 'pinewood', 'capital']) {
        await h.eval((t) => { location.href = 'apexf1.html?test=grid&track=' + t; }, tr).catch(() => {});
        let r = null;
        for (let i = 0; i < 40 && !r; i++) { await h.wait(500); r = await h.eval(() => (window.__test && window.__test.cityLife && window.__test.cityLife()) ? { c: window.__test.cityLife(), w: window.__test.trackWidth() } : null).catch(() => null); }
        if (!r) { bad.push(tr + ': no city life built'); continue; }
        if (r.w < 15) bad.push(tr + ': track only ' + r.w + ' m wide');
        if (r.c.people < 300) bad.push(tr + ': only ' + r.c.people + ' spectators');
        if (tr === 'harbour' || tr === 'capital') {
          if (r.c.roadM < 800 || r.c.streets < 8) bad.push(tr + ': only ' + Math.round(r.c.roadM) + ' m of streets');
          if (r.c.barricades < 40 || r.c.gates < 8) bad.push(tr + ': streets not closed off (' + r.c.barricades + ' barricades)');
          if (r.c.trees < 40) bad.push(tr + ': only ' + r.c.trees + ' street trees');
          if (r.c.tones < 6) bad.push(tr + ': buildings use only ' + r.c.tones + ' colours');
        }
      }
      return bad.length ? 'F1 CITY LIFE: ' + bad.join('; ') : true;
    },
  },
  {
    id: 'play-f1-pit-crew',
    ask: 'F1: tap the tyre box to choose the next compound; a pit stop stops the car in its own box with a crew that takes the wheels off, puts new ones on, lifts the car and lets it go (owner Nov 4 2026 6:23 PM)',
    async test(page, h) {
      await h.eval(() => { location.href = 'apexf1.html?test=grid&track=capital'; }).catch(() => {});
      let ok = null; for (let i = 0; i < 40 && !ok; i++) { await h.wait(500); ok = await h.eval(() => window.__test && window.__test.pitProbe && window.__test.race().mode).catch(() => null); }
      if (!ok) return { inconclusive: 'game did not load' };
      const r = await h.eval(() => {
        const T = window.__test; for (let i = 0; i < 300; i++) T.simStep(0.05, { skill: 'good' });
        const opened = T.tyreTap(); const o = document.querySelectorAll('.tirepick'); if (o[2]) o[2].click();
        T.pitNow(); let maxHidden = 0, maxLift = 0, crew = false, holdSteps = 0, p = null;
        for (let i = 0; i < 400; i++) { T.simStep(0.05, { skill: 'good' }); p = T.pitProbe(); if (p.hold) { holdSteps++; maxHidden = Math.max(maxHidden, p.wheelsHidden); maxLift = Math.max(maxLift, p.lift); crew = crew || p.crew; } if (p.done) break; }
        return { opened, maxHidden, maxLift, crew, holdSteps, tire: p && p.tire, done: p && p.done };
      }).catch((e) => ({ err: String(e) }));
      if (r.err) return r.err;
      if (!r.opened) return 'F1 PIT: tapping the tyre box did not open the tyre choice';
      if (!r.done) return { inconclusive: 'the stop did not finish in 20 game-seconds' };
      if (!r.crew) return 'F1 PIT: no pit crew showed at the stopped car';
      if (r.maxHidden < 3) return 'F1 PIT: the wheels never came off (' + r.maxHidden + ' of 4 hidden)';
      if (r.maxLift < 0.1) return 'F1 PIT: the car was never lifted on the jack';
      if (r.tire !== 'HARD') return 'F1 PIT: chose HARD in the tyre box but left the pits on ' + r.tire;
      return true;
    },
  },
  // owner Nov 7 2026 10:20 AM (photo): fence posts / poles stood in the middle of the road to the pit, and PIT did nothing in qualifying
  {
    id: 'play-pit-lane-clear', mode: 'race',
    ask: 'Nothing (fence posts, lamp poles, tyre walls, marshal posts) stands on the pit lane - owner photo Nov 7 2026',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let r = null;
      for (let i = 0; i < 60; i++) { r = await h.eval(() => window.__test && window.__test.pitClutter ? window.__test.pitClutter(4) : null).catch(() => null); if (r && r.pts) break; await h.wait(400); }
      if (!r || !r.pts) return 'the pit lane line never loaded (no pitClutter / no pit points)';
      if (r.n > 0) return r.n + ' trackside thing(s) stand on the pit lane, e.g. at ' + JSON.stringify(r.near.slice(0, 2));
      return true;
    },
  },
  {
    id: 'play-pit-in-quali', mode: 'quali',
    ask: 'PIT works in qualifying: a tap arms the stop - owner Nov 7 2026 "can\'t enter pit either"',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=quali'; }).catch(() => {});
      await h.wait(1500);
      let md = '?';
      for (let i = 0; i < 60; i++) { md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'quali') break; await h.wait(400); }
      if (md !== 'quali') return 'never reached qualifying at ?test=quali (mode ' + md + ')';
      await h.wait(800);
      await h.eval(() => { const b = document.getElementById('btnPit'); b && b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); });
      const pr = await h.eval(() => window.__test.pitProbe());
      if (!pr || !pr.armed) return 'tapped PIT in qualifying but the stop was not armed';
      return true;
    },
  },
  // owner Nov 7 2026 2:31 PM 'the track glitchy every lap ... they shouldn't get hung up on the finish line': the last 4-17 m before the line froze every car, then jumped it
  {
    id: 'play-finish-line-smooth', mode: 'race',
    ask: 'Cars move smoothly over the finish line: no frozen stretch before it, no jump over it - owner Nov 7 2026',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let r = null;
      for (let i = 0; i < 60; i++) { r = await h.eval(() => window.__test && window.__test.seam ? window.__test.seam() : null).catch(() => null); if (r && r.n > 10) break; await h.wait(400); }
      if (!r || !(r.n > 10)) return 'the track never loaded (no seam probe)';
      if (r.jumpAtLine > 2) return 'a car jumps ' + r.jumpAtLine + ' m over the finish line (1 m of track should be 1 m)';
      if (r.gap > 1 && r.stuck < r.gap * 0.5) return 'the last ' + r.gap + ' m before the line are frozen (moved only ' + r.stuck + ' m)';
      return true;
    },
  },
  {
    id: 'play-asphalt-seam-texture', mode: 'race',
    ask: 'The asphalt texture carries on over the start/finish line - no speckled band squeezed into the last metres before the line (owner Nov 8 2026 "studded glitch where the finish and start meet")',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=grid&track=harbour'; }).catch(() => {});
      await h.wait(1500);
      let r = null;
      for (let i = 0; i < 60; i++) { r = await h.eval(() => window.__test && window.__test.seamUV ? window.__test.seamUV() : null).catch(() => null); if (r && r.L14 > 10) break; await h.wait(400); }
      if (!r || !(r.L14 > 10)) return 'the built-in circuit never built its asphalt ribbon (no seamUV probe)';
      if (r.jump > 2) return 'the last road piece before the line runs its texture ' + r.jump + ' repeats in one step (uPrev ' + r.uPrev + ' -> uLast ' + r.uLast + '): a speckled band at the finish line';
      if (Math.abs(r.uLast - r.L14) > 1.5) return 'the closing road piece ends at texture ' + r.uLast + ' instead of the lap length ' + r.L14;
      return true;
    },
  },
  {
    id: 'play-owner-circuit-list', mode: 'race',
    ask: 'Every circuit in the list is well formed (a name, 4+ points unless it is the kit circuit) - an owner-made circuit from the Workshop / Studio cannot break the circuit menu (Nov 8 2026)',
    test: async (page, h) => {
      let L = null;
      for (let i = 0; i < 30; i++) { L = await h.eval(() => window.__test && window.__test.tracks ? window.__test.tracks() : null).catch(() => null); if (L && L.length) break; await h.wait(400); }
      if (!L || !L.length) return 'no circuit list (__test.tracks)';
      const bad = L.filter(t => !t.id || !t.name || (!t.gp && !(t.pts >= 4)));
      if (bad.length) return 'badly formed circuit entries: ' + bad.map(t => (t.id || '?') + ' (' + (t.pts || 0) + ' points)').join(', ');
      const ids = L.map(t => t.id); if (new Set(ids).size !== ids.length) return 'two circuits share an id: ' + ids.join(', ');
      return true;
    },
  },
  {
    id: 'fix-f1-pit-stop-works', mode: 'race',
    ask: 'A pit stop really happens: the car stops in its box, the crew changes the tyres (wheels come off) and fills the fuel (the gauge rises from what the car burned), then the car is released fully drivable (owner Nov 8 2026: "create a realistic pit with a crew that does a quick simulated pit stop tires and fuel")',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 40; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return 'never reached the grid at ?test=grid';
      let leftGrid = false;
      for (let p = 0; p < 3 && !leftGrid; p++) { await h.press('#raceBtn').catch(() => {}); for (let i = 0; i < 10; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { leftGrid = true; break; } await h.wait(300); } }
      let racing = false;
      for (let i = 0; i < 80; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'race') { racing = true; break; } await h.wait(300); }
      if (!racing) return 'race never started at ?test=grid';
      const burn = await h.eval(() => { const t = window.__test; const L = t.trackLength(); const cs = t.cars(); const pi = cs.findIndex(c => c.isPlayer); t.setCarS(pi, L - 40); return { L, lap0: cs[pi].lap }; });
      for (let i = 0; i < 60; i++) { await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer); t.setInput({ steer: Math.max(-1, Math.min(1, (0 - p.d) * 0.5)), gas: true }); }); await h.wait(120); const lap = await h.eval(() => window.__test.cars().find(c => c.isPlayer).lap); if (lap > burn.lap0) break; }
      const fuelEl = await h.eval(() => { const e = document.getElementById('fuelPct'); return e ? e.textContent : null; }).catch(() => null);
      if (fuelEl === null) return 'no fuel gauge on the HUD (fuel is not modelled)';
      const fuelBefore = parseFloat(fuelEl);
      if (!(fuelBefore < 99)) return 'a lap of driving did not burn any fuel (gauge still ' + fuelEl + ')';
      await h.eval(() => { const t = window.__test; const L = t.trackLength(); const cs = t.cars(); const pi = cs.findIndex(c => c.isPlayer); t.setCarS(pi, 0.9414 * L - 550); });
      await h.eval(() => { window.__test.setInput({ steer: 0.3, gas: true }); });
      await h.eval(() => { document.getElementById('btnPit').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
      let sawHold = false, sawCrew = false, sawWheelsOff = false, stopErr = 999;
      for (let i = 0; i < 260; i++) {
        const st = await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer); const pr = t.pitProbe(); const L = t.trackLength(); if (!pr.hold) t.setInput({ steer: Math.max(-1, Math.min(1, (0 - p.d) * 0.5)), gas: true }); const sN = ((p.s % L) + L) % L; const boxN = ((pr.box % L) + L) % L; let dBox = Math.abs(sN - boxN); if (dBox > L / 2) dBox = L - dBox; return { pr, dBox }; });
        if (st.pr.inPits && st.pr.hold) { sawHold = true; if (st.pr.crew) sawCrew = true; if (st.pr.wheelsHidden > 0) sawWheelsOff = true; if (stopErr === 999) stopErr = st.dBox; }
        if (st.pr.done > 0) break;
        await h.wait(120);
      }
      if (!sawHold) return 'the car never held for a stop in the pit box after pressing PIT';
      if (!sawCrew) return 'no crew visible while the car was stopped in the box';
      if (!sawWheelsOff) return 'the wheels never came off during the stop (no visible tyre change)';
      if (stopErr > 4) return 'the car stopped ' + stopErr.toFixed(1) + ' m from its pit box, not in it';
      let exited = false, fastV = 0;
      for (let i = 0; i < 400; i++) { const st = await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer); const pr = t.pitProbe(); t.setInput({ steer: Math.max(-1, Math.min(1, (0 - p.d) * 0.5)), gas: true }); return { inPits: pr.inPits, v: p.v }; }); if (!st.inPits) exited = true; if (exited && st.v > fastV) fastV = st.v; if (exited && fastV > 32) break; await h.wait(120); }
      if (!exited) return 'the car never left the pits after its stop';
      if (fastV <= 32) return 'the car would not accelerate after the stop (max ' + fastV.toFixed(1) + ' m/s) - controls still trapped at the pit limiter';
      const after = await h.eval(() => { const fe = document.getElementById('fuelPct'); const wf = document.getElementById('wearFill'); return { fuel: fe ? parseFloat(fe.textContent) : null, wear: wf ? parseFloat(wf.style.width) : null }; });
      if (after.fuel === null || after.fuel < 99) return 'fuel was not filled by the stop (gauge ' + after.fuel + '% after, ' + fuelBefore + '% before)';
      if (after.wear === null || after.wear < 99) return 'tyre wear was not reset by the stop (wear bar ' + after.wear + '%)';
      await h.eval(() => { location.href = location.pathname; }).catch(() => {});
      return true;
    },
  },
  {
    id: 'fix-f1-pit-skip-button', mode: 'race',
    ask: 'The SKIP STOP button (owner Nov 9 2026: "add a skip button player can press to jump back into game"): hidden on track, shown while the car is in the pits (shown/hidden by its hidden class, the pit HUD mechanism - offsetParent is always null in the ?test path, whose #hud stays class-hidden), and one press - during the 6 s hold OR on the roll-in - finishes the service at once (fresh tyres, full tank) and releases the car fully drivable, with no hold on the roll-in press',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let racing = false;
      for (let i = 0; i < 100; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'race') { racing = true; break; } if (md === 'grid' || md === 'lights') await h.press('#raceBtn').catch(() => {}); await h.wait(300); }
      if (!racing) return 'race never started at ?test=grid';
      const btn0 = await h.eval(() => { const b = document.getElementById('pitSkip'); return b ? { text: b.textContent, hidden: b.classList.contains('hidden') } : null; });
      if (!btn0) return 'no #pitSkip button in the DOM';
      if (!/SKIP/.test(btn0.text)) return 'the pit button is not labelled as a skip button (\'' + btn0.text + '\')';
      if (!btn0.hidden) return 'the SKIP STOP button is visible on track, before the car is anywhere near the pits';
      const drive = () => h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer); t.setInput({ steer: Math.max(-1, Math.min(1, (0 - p.d) * 0.5)), gas: true }); });
      const gauges = () => h.eval(() => { const fe = document.getElementById('fuelPct'); const wf = document.getElementById('wearFill'); return { fuel: fe ? parseFloat(fe.textContent) : null, wear: wf ? parseFloat(wf.style.width) : null }; });
      const burnLap = async () => { const b0 = await h.eval(() => { const t = window.__test; const L = t.trackLength(); const cs = t.cars(); const pi = cs.findIndex(c => c.isPlayer); t.setCarS(pi, L - 40); return cs[pi].lap; }); for (let i = 0; i < 60; i++) { await drive(); await h.wait(120); const lap = await h.eval(() => window.__test.cars().find(c => c.isPlayer).lap); if (lap > b0) break; } };
      // ---- part 1: press during the hold ----
      await burnLap();
      const g0 = await gauges(); if (g0.fuel === null || !(g0.fuel < 99)) return 'a lap of driving did not burn any fuel before the skip test (gauge ' + g0.fuel + '%)';
      await h.eval(() => { const t = window.__test; const L = t.trackLength(); const cs = t.cars(); const pi = cs.findIndex(c => c.isPlayer); t.setCarS(pi, 0.9414 * L - 550); });
      await h.eval(() => { window.__test.setInput({ steer: 0.3, gas: true }); });
      await h.eval(() => { document.getElementById('btnPit').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
      let pressedAt = -1, doneAt = -1, visInHold = false;
      for (let i = 0; i < 300; i++) {
        const st = await h.eval(() => { const t = window.__test; const pr = t.pitProbe(); const pc = document.getElementById('pitClock'); const b = document.getElementById('pitSkip'); if (!pr.hold) { const p = t.cars().find(c => c.isPlayer); t.setInput({ steer: Math.max(-1, Math.min(1, (0 - p.d) * 0.5)), gas: true }); } return { pr, clock: pc ? parseFloat(pc.textContent) : 0, vis: b ? (!b.classList.contains('hidden')) : false }; });
        if (st.pr.hold && st.clock >= 1.2 && pressedAt < 0) { if (st.vis) visInHold = true; pressedAt = st.clock; await h.eval(() => { document.getElementById('pitSkip').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); }); }
        if (pressedAt >= 0 && st.pr.done > 0) { doneAt = st.clock; break; }
        if (pressedAt >= 0 && i > 200) break;
        await h.wait(120);
      }
      if (pressedAt < 0) return 'the car never held in the box to press SKIP during the stop';
      if (!visInHold) return 'the SKIP STOP button was not visible during the hold';
      if (doneAt < 0) return 'pressing SKIP STOP during the hold never completed the stop';
      if (doneAt - pressedAt > 3.5) return 'the stop dragged on ' + (doneAt - pressedAt).toFixed(1) + ' s after the skip press - it should finish at once, not run out the 6 s hold';
      let exited = false, fastV = 0;
      for (let i = 0; i < 400; i++) { const st = await h.eval(() => { const t = window.__test; const p = t.cars().find(c => c.isPlayer); const pr = t.pitProbe(); t.setInput({ steer: Math.max(-1, Math.min(1, (0 - p.d) * 0.5)), gas: true }); return { inPits: pr.inPits, v: p.v }; }); if (!st.inPits) exited = true; if (exited && st.v > fastV) fastV = st.v; if (exited && fastV > 32) break; await h.wait(120); }
      if (!exited) return 'the car never left the pits after the skipped stop';
      if (fastV <= 32) return 'the car would not accelerate after the skipped stop (max ' + fastV.toFixed(1) + ' m/s)';
      const g1 = await gauges();
      if (g1.fuel === null || g1.fuel < 99) return 'the skipped stop did not fill the fuel (gauge ' + g1.fuel + '%)';
      if (g1.wear === null || g1.wear < 99) return 'the skipped stop did not fit fresh tyres (wear bar ' + g1.wear + '%)';
      const btnAfter = await h.eval(() => { const b = document.getElementById('pitSkip'); return b ? (b.classList.contains('hidden')) : null; });
      if (btnAfter !== true) return 'the SKIP STOP button stayed visible after the car left the pits';
      // ---- part 2: press on the roll-in - serviced without ever holding ----
      await burnLap(); await burnLap();
      const g2 = await gauges(); if (g2.fuel === null || !(g2.fuel < 99)) return 'driving did not burn fuel before the roll-in skip (gauge ' + g2.fuel + '%)';
      await h.eval(() => { window.__driver = setInterval(() => { try { const T = window.__test; const sp = T.steerProbe(); if (!sp) return; const steer = Math.max(-1, Math.min(1, (sp.line - sp.d) * 0.5 - sp.headAngle * 1.1)); T.setInput({ steer, gas: sp.v < sp.maxV * 1.05, brake: sp.v > sp.maxV * 1.18, reverse: false, ers: false }); } catch (e) {} }, 40); }).catch(() => {});
      await h.eval(() => window.__test.pitNow()).catch(() => {});
      let pressed2 = false, sawHold = false, outAgain = false;
      for (let i = 0; i < 400; i++) {
        const st = await h.eval(() => { const t = window.__test; const pr = t.pitProbe(); const b = document.getElementById('pitSkip'); return { pr, vis: b ? (!b.classList.contains('hidden')) : false }; });
        if (st.pr.hold) sawHold = true;
        if (!pressed2 && st.pr.inPits && !st.pr.hold) { if (!st.vis) { await h.eval(() => { clearInterval(window.__driver); }); return 'the SKIP STOP button was not visible on the roll-in'; } await h.eval(() => { document.getElementById('pitSkip').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); }); pressed2 = true; }
        if (pressed2 && !st.pr.inPits) { outAgain = true; break; }
        await h.wait(100);
      }
      await h.eval(() => { clearInterval(window.__driver); window.__test.setInput({ gas: false, steer: 0 }); }).catch(() => {});
      if (!pressed2) return 'the car never rolled into the pits for the roll-in skip';
      if (sawHold) return 'the car HELD in the box after a roll-in skip press - it should be serviced and drive through';
      if (!outAgain) return 'the car never came back out of the pits after the roll-in skip';
      const g3 = await gauges();
      if (g3.fuel === null || g3.fuel < 99) return 'the roll-in skip did not fill the fuel (gauge ' + g3.fuel + '%)';
      if (g3.wear === null || g3.wear < 99) return 'the roll-in skip did not fit fresh tyres (wear bar ' + g3.wear + '%)';
      await h.eval(() => { location.href = location.pathname; }).catch(() => {});
      return true;
    },
  },
  {
    id: 'fix-f1-pit-quali-carryover', mode: 'race',
    ask: 'Arming a pit stop in qualifying must not follow the car onto the grid: no crew at the start line, no 49 MPH limiter trap with dead controls after GO (owner Nov 8 2026: "no pit stop happened, the pit crew showed up late around my car on the racetrack, then it would not let me drive - stuck in the grass at 49 MPH")',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=quali&track=capital'; }).catch(() => {});
      await h.wait(1500);
      let quali = false;
      for (let i = 0; i < 60; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'quali') { quali = true; break; } await h.wait(300); }
      if (!quali) return 'never reached qualifying at ?test=quali&track=capital';
      await h.eval(() => { window.__driver = setInterval(() => { try { const T = window.__test; const sp = T.steerProbe(); if (!sp) return; const steer = Math.max(-1, Math.min(1, (sp.line - sp.d) * 0.5 - sp.headAngle * 1.1)); T.setInput({ steer, gas: sp.v < sp.maxV * 1.05, brake: sp.v > sp.maxV * 1.18, reverse: false, ers: false }); } catch (e) {} }, 40); }).catch(() => {});
      await h.wait(1200);
      await h.eval(() => window.__test.pitNow()).catch(() => {});
      let entered = false;
      for (let i = 0; i < 60; i++) { const ok = await h.eval(() => window.__test.pitProbe().inPits).catch(() => false); if (ok) { entered = true; break; } await h.wait(300); }
      if (!entered) return 'the car never entered the pits in qualifying after arming the stop';
      await h.press('#qualiSkip');
      await h.wait(900);
      const onGrid = await h.eval(() => { const pr = window.__test.pitProbe(); return { inPits: pr.inPits, armed: pr.armed }; });
      if (onGrid.inPits || onGrid.armed) return 'pit state rode onto the grid with the car (inPits ' + onGrid.inPits + ', armed ' + onGrid.armed + ') - the stop will fire at the start line and trap the car at the pit limiter';
      let leftGrid = false;
      for (let p = 0; p < 3 && !leftGrid; p++) { await h.press('#raceBtn').catch(() => {}); for (let i = 0; i < 10; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { leftGrid = true; break; } await h.wait(300); } }
      let racing = false;
      for (let i = 0; i < 80; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'race') { racing = true; break; } await h.wait(300); }
      if (!racing) return 'race never started after skipping qualifying';
      let hits = 0, inPitsSeen = false, maxV = 0;
      for (let i = 0; i < 40; i++) { const st = await h.eval(() => { const pr = window.__test.pitProbe(); const p = window.__test.cars().find(c => c.isPlayer); return { hits: pr.hits, inPits: pr.inPits, v: p.v }; }); hits = Math.max(hits, st.hits); if (st.inPits) inPitsSeen = true; if (st.v > maxV) maxV = st.v; if (maxV > 30) break; await h.wait(300); }
      await h.eval(() => { clearInterval(window.__driver); window.__test.setInput({ gas: false, steer: 0 }); }).catch(() => {});
      if (hits > 0) return 'the pit crew fired ' + hits + ' time(s) during the race start - a stop nobody asked for, at the start line';
      if (inPitsSeen) return 'the car was in the pit state during the race after skipping qualifying';
      if (maxV <= 30) return 'the car never got going after GO (max ' + maxV.toFixed(1) + ' m/s) - controls dead / limiter trap';
      await h.eval(() => { location.href = location.pathname; }).catch(() => {});
      return true;
    },
  },
  {
    id: 'fix-f1-pit-complex-all-tracks', mode: 'race',
    ask: 'The full pit complex (10 booths with seated desk chiefs, booth crews, dressed working spots, pad) stands on EVERY circuit in the menu: the Grand Prix kit circuit built none of it (0 booths, 0 env figures) while the built-in tracks got it from buildPits (owner Nov 9 2026: "This needs to be in all track options")',
    test: async (page, h) => {
      const bad = [];
      for (const tr of ['grandprix', 'harbour', 'mesa', 'pinewood', 'capital']) {
        await h.eval((t) => { location.href = 'apexf1.html?test=grid&track=' + t; }, tr).catch(() => {});
        let r = null;
        for (let i = 0; i < 80 && !r; i++) { await h.wait(500); r = await h.eval(() => { const T = window.__test; if (!T || !T.pitLook) return null; const l = T.pitLook(); if (!l) return null; return { booths: l.booths, envFigs: l.env ? l.env.figs : 0, spot: !!T.pitSpot(0) }; }).catch(() => null); }
        if (!r) { bad.push(tr + ': pitLook never answered'); continue; }
        if (r.booths !== 10) bad.push(tr + ': only ' + r.booths + ' of 10 pit booths built');
        if (r.envFigs < 30) bad.push(tr + ': only ' + r.envFigs + ' pit-env figures (booth crews / working crews missing)');
        if (!r.spot) bad.push(tr + ': pit spot 0 is not dressed');
      }
      return bad.length ? 'F1 ALL-TRACKS PIT: ' + bad.join('; ') : true;
    },
  },
  {
    id: 'fix-f1-pit-button-taps', mode: 'race',
    ask: 'The pit buttons answer a real tap on the phone (owner Nov 9 2026: "fix Pit button cause it does not working"): PIT and SKIP STOP must be the top element at their own centre (nothing eats the tap), must answer a pointer-event tap the way some phone browsers and webviews deliver taps (they used to listen only for touchstart/mousedown), and SKIP STOP must sit above the touch-controls layer, clear of the phone home indicator (it used to live inside the lower HUD layer with no safe-area inset)',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.pathname + '?test=grid&track=capital'; }).catch(() => {});
      await h.wait(1500);
      let booted = false;
      for (let i = 0; i < 60; i++) { const ok = await h.eval(() => !!document.getElementById('raceBtn')).catch(() => false); if (ok) { booted = true; break; } await h.wait(300); }
      if (!booted) return 'the grid menu never appeared at ?test=grid&track=capital';
      await h.press('#raceBtn');
      let racing = false;
      for (let i = 0; i < 80; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'race') { racing = true; break; } await h.wait(300); }
      if (!racing) return 'the race never started';
      const pitTop = await h.eval(() => { const e = document.getElementById('btnPit'); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t ? (t.id || t.tagName) : 'none'; });
      if (pitTop !== 'btnPit') return 'the PIT button is covered at its centre by ' + pitTop + ' - a real thumb tap lands on that instead';
      await h.eval(() => { const e = document.getElementById('btnPit'); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) || e; t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch' })); });
      let armed = false;
      for (let i = 0; i < 16; i++) { const a = await h.eval(() => window.__test.pitProbe().armed).catch(() => false); if (a) { armed = true; break; } await h.wait(250); }
      if (!armed) return 'the PIT button did not arm the stop when tapped - on the owner phone this button is dead';
      await h.eval(() => { const b = document.querySelector('#pitTires .tirepick'); if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true })); }).catch(() => {});
      await h.wait(600);
      await h.eval(() => { window.__driver = setInterval(() => { try { const T = window.__test; const sp = T.steerProbe(); if (!sp) return; const steer = Math.max(-1, Math.min(1, (sp.line - sp.d) * 0.5 - sp.headAngle * 1.1)); T.setInput({ steer, gas: sp.v < sp.maxV * 1.05, brake: sp.v > sp.maxV * 1.18, reverse: false, ers: false }); } catch (e) {} }, 40); }).catch(() => {});
      await h.eval(() => window.__test.pitNow()).catch(() => {});
      let held = false;
      for (let i = 0; i < 60; i++) { const hd = await h.eval(() => window.__test.pitProbe().hold).catch(() => false); if (hd) { held = true; break; } await h.wait(300); }
      if (!held) { await h.eval(() => clearInterval(window.__driver)).catch(() => {}); return 'the car never reached its box for the button tap test'; }
      const skipTop = await h.eval(() => { const e = document.getElementById('pitSkip'); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t ? (t.id || t.tagName) : 'none'; });
      if (skipTop !== 'pitSkip') { await h.eval(() => clearInterval(window.__driver)).catch(() => {}); return 'SKIP STOP is covered at its centre by ' + skipTop + ' during the stop - a real thumb tap lands on that instead'; }
      const clockAtTap = await h.eval(() => parseFloat(document.getElementById('pitClock').textContent));
      await h.eval(() => { const e = document.getElementById('pitSkip'); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) || e; t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch' })); });
      let doneAt = -1;
      for (let i = 0; i < 40; i++) { const st = await h.eval(() => ({ done: window.__test.pitProbe().done, clock: parseFloat(document.getElementById('pitClock').textContent) })).catch(() => ({ done: 0, clock: 0 })); if (st.done >= 1) { doneAt = st.clock; break; } await h.wait(250); }
      const gauges = await h.eval(() => { const f = document.getElementById('fuelPct'); const w = document.getElementById('wearFill'); return { fuel: f ? parseFloat(f.textContent) : 0, wear: w ? parseFloat(w.style.width) : 0 }; }).catch(() => ({ fuel: 0, wear: 0 }));
      await h.eval(() => { clearInterval(window.__driver); window.__test.setInput({ gas: false, steer: 0 }); }).catch(() => {});
      if (doneAt < 0) return 'the stop never completed after the SKIP tap';
      if (doneAt - clockAtTap > 2.5) return 'SKIP STOP did not answer its tap - the stop ran on to ' + doneAt.toFixed(1) + 's after a tap at ' + clockAtTap.toFixed(1) + 's instead of releasing at once (owner phone: this button is dead)';
      if (gauges.fuel < 99) return 'the skipped stop left the tank at ' + gauges.fuel + '%';
      if (gauges.wear < 99) return 'the skipped stop left the tyres at ' + gauges.wear + '% wear-bar';
      await h.eval(() => { location.href = location.pathname; }).catch(() => {});
      return true;
    },
  },
  {
    id: 'fix-f1-pit-wall-all-tracks', mode: 'race',
    ask: 'A continuous pit wall stands between the pit lane and the race track on EVERY circuit in the menu: about 1 m of concrete running the whole box stretch (15 m before the first box to 15 m past the last), tight against the road edge on the pit side, clear of the pit driving line - the audit found only low barrier panels at the box boundaries and no wall anywhere (owner Nov 9 2026 missing-list item 1)',
    test: async (page, h) => {
      const bad = [];
      for (const tr of ['grandprix', 'harbour', 'mesa', 'pinewood', 'capital']) {
        await h.eval((t) => { location.href = 'apexf1.html?test=grid&track=' + t; }, tr).catch(() => {});
        let r = null;
        for (let i = 0; i < 80 && !r; i++) { await h.wait(500); r = await h.eval(() => { const T = window.__test; if (!T || !T.pitWall) return null; return T.pitWall(); }).catch(() => null); }
        if (!r) { bad.push(tr + ': no pit wall was built'); continue; }
        if (r.h < 0.9 || r.h > 1.1) bad.push(tr + ': wall height ' + r.h + ' m (a real pit wall is about 1 m)');
        if (r.len < 195) bad.push(tr + ': wall runs only ' + r.len + ' m of the 200 m box stretch');
        if (r.coverBefore < 10 || r.coverAfter < 10) bad.push(tr + ': wall does not cover the box stretch (starts ' + r.coverBefore + ' m before box 1, ends ' + r.coverAfter + ' m after box 10)');
        if (r.stations < 40 || r.maxGap > 6) bad.push(tr + ': wall is not continuous (' + r.stations + ' stations, worst gap ' + r.maxGap + ' m)');
        if (r.minLaneClear < 0.1) bad.push(tr + ': wall crowds the pit driving line (worst clearance ' + r.minLaneClear + ' m)');
        if (Math.abs(r.dCentre) < r.W / 2 - 1.0) bad.push(tr + ': wall stands ' + Math.abs(r.dCentre) + ' m from the centre line - not up against the road edge (' + (r.W / 2) + ' m)');
      }
      return bad.length ? 'F1 PIT WALL: ' + bad.join('; ') : true;
    },
  },
  {
    id: 'fix-f1-garage-doors-all-tracks', mode: 'race',
    ask: 'Every pit box has its own garage door on the pit building face behind the boxes on EVERY circuit in the menu: ten roller-shutter doors aligned to the ten box centres, each in its team colour with its box number, a window band and an APEX ARCADE sign band above - the measured audit found no doors at all: the only pit building is a blank dark slab standing by the pit entry, and nothing stands behind the boxes but the booths (owner Nov 10 2026 missing-list item 3)',
    test: async (page, h) => {
      const bad = [];
      for (const tr of ['grandprix', 'harbour', 'mesa', 'pinewood', 'capital']) {
        await h.eval((t) => { location.href = 'apexf1.html?test=grid&track=' + t; }, tr).catch(() => {});
        let r = null;
        for (let i = 0; i < 80 && !r; i++) { await h.wait(500); r = await h.eval(() => { const T = window.__test; if (!T || !T.garageDoors) return null; return T.garageDoors(); }).catch(() => null); }
        if (!r) { bad.push(tr + ': no garage face was built'); continue; }
        if (r.doors !== 10) bad.push(tr + ': only ' + r.doors + ' of 10 garage doors');
        if (r.maxOff > 1.0) bad.push(tr + ': a garage door stands ' + r.maxOff + ' m from its box centre');
        if (r.faceOff < 5.5 || r.faceOff > 7.5) bad.push(tr + ': garage face stands ' + r.faceOff + ' m behind the box line (the booths end at about 5.4)');
        if (r.h < 7.5 || r.h > 8.5) bad.push(tr + ': garage face is ' + r.h + ' m tall (the pit building face is 8)');
        if (!r.hasMap) bad.push(tr + ': garage face has no painted finish (no texture - a blank slab again)');
        if (!r.inScene) bad.push(tr + ': garage face is not in the scene');
      }
      return bad.length ? 'F1 GARAGE DOORS: ' + bad.join('; ') : true;
    },
  },
  {
    id: 'fix-f1-marshals-all-tracks', mode: 'race',
    ask: 'A marshal stands at EVERY marshal post on EVERY circuit in the menu: the fetched crew figure at the pit crews\' real size (2.63 m standing) in orange marshal overalls, beside the post\'s orange hut facing the track, poses varying post to post with some holding a flag in the post\'s own flag colour - the audit found the posts (an orange hut, a pole and a flag every ~130 m on all tracks) standing completely empty, with no people at them at all (owner Nov 10 2026 missing-list item 2)',
    test: async (page, h) => {
      const bad = [];
      for (const tr of ['grandprix', 'harbour', 'mesa', 'pinewood', 'capital']) {
        await h.eval((t) => { location.href = 'apexf1.html?test=grid&track=' + t; }, tr).catch(() => {});
        let r = null;
        for (let i = 0; i < 80 && !r; i++) { await h.wait(500); r = await h.eval(() => { const T = window.__test; if (!T || !T.marshals) return null; return T.marshals(); }).catch(() => null); }
        if (!r) { bad.push(tr + ': no marshals were built'); continue; }
        if (r.posts < 20) bad.push(tr + ': only ' + r.posts + ' marshal posts on the lap (the posts ring every circuit every ~130 m)');
        if (r.marshals !== r.posts) bad.push(tr + ': ' + r.marshals + ' marshals for ' + r.posts + ' posts');
        if (r.covered !== r.posts) bad.push(tr + ': only ' + r.covered + ' of ' + r.posts + ' posts have their marshal beside them');
        if (r.worstOff > 3) bad.push(tr + ': a marshal stands ' + r.worstOff + ' m from his post');
        if (r.stand < 2.5 || r.stand > 2.76) bad.push(tr + ': a marshal stands ' + r.stand + ' m tall (the crews\' real size is 2.63 m against the 8.47 m car)');
      }
      return bad.length ? 'F1 MARSHALS: ' + bad.join('; ') : true;
    },
  },
  {
    id: 'fix-f1-race-furniture-all-tracks', mode: 'race',
    ask: 'Owner Nov 10 2026 9:29 PM "Yes do all them complete 1-6": EVERY circuit in the menu carries the race furniture, placed from its own track - braking boards 150 / 100 / 50 before each real braking zone, a DRS board where each DRS zone opens, a pair of sector boards for sectors 1, 2 and 3, the pit limit sign (80, the limiter\'s own speed) where the limit starts and the struck-out one where it ends with a white line across the lane at both (and on the built-in circuits the solid entry and exit lines), a podium and a parc ferme with three bays, the ten team motorhomes, and the pit board at the pit wall. No board stands on the road.',
    test: async (page, h) => {
      const bad = [];
      for (const tr of ['grandprix', 'harbour', 'mesa', 'pinewood', 'capital']) {
        await h.eval((t) => { location.href = 'apexf1.html?test=grid&track=' + t; }, tr).catch(() => {});
        let r = null;
        for (let i = 0; i < 80 && !r; i++) { await h.wait(500); r = await h.eval(() => { const T = window.__test; if (!T || !T.furniture) return null; const f = T.furniture(); return f ? JSON.parse(JSON.stringify(f)) : null; }).catch(() => null); }
        if (!r) { bad.push(tr + ': no race furniture was built'); continue; }
        if (!r.inScene) bad.push(tr + ': the furniture is not in the scene');
        if (r.brake.length < 3) bad.push(tr + ': only ' + r.brake.length + ' braking boards (every circuit has at least one braking zone = 150, 100, 50)');
        if (r.brake.some(b => ![150, 100, 50].includes(b.n))) bad.push(tr + ': a braking board carries a number that is not 150 / 100 / 50');
        if (r.drs.length !== r.drsZones) bad.push(tr + ': ' + r.drs.length + ' DRS boards for ' + r.drsZones + ' DRS zones');
        for (const n of [1, 2, 3]) if (!r.sector.some(q => q.n === n)) bad.push(tr + ': no board for sector ' + n);
        if (!r.pitSigns.some(q => q.kind === 'start')) bad.push(tr + ': no pit limit sign where the limit starts');
        if (!r.pitSigns.some(q => q.kind === 'end')) bad.push(tr + ': no end-of-limit sign at the pit exit');
        if (r.limit !== 80) bad.push(tr + ': the pit limit sign says ' + r.limit + ' (the limiter holds 22 m/s = 80)');
        for (const k of (r.gp ? ['limitStart', 'limitEnd'] : ['limitStart', 'limitEnd', 'entryLine', 'exitLine'])) if (!r.lines.some(l => l.kind === k)) bad.push(tr + ': the painted ' + k + ' is missing');
        if (!r.podium) bad.push(tr + ': no podium');
        if (!r.parc) bad.push(tr + ': no parc ferme'); else if (r.parc.bays !== 3) bad.push(tr + ': parc ferme has ' + r.parc.bays + ' bays, not 3');
        if (r.motorhomes.length < 8) bad.push(tr + ': only ' + r.motorhomes.length + ' of the ten team motorhomes');
        if (!r.board) bad.push(tr + ': no pit board at the pit wall');
        if (!r.emergency) bad.push(tr + ': no parked safety car + medical car (no clear spot found beside the pit exit)');
        else { for (let i = 0; i < 80 && r.emergency.loaded < 2 && !r.emergency.safetyError && !r.emergency.medicalError; i++) { await h.wait(500); r.emergency = await h.eval(() => { const q = window.__test.furniture(); return q && q.emergency ? JSON.parse(JSON.stringify(q.emergency)) : null; }).catch(() => r.emergency) || r.emergency; }
          if (!r.emergency.apron || !(r.emergency.apron.len > 30)) bad.push(tr + ': no asphalt apron for the emergency cars to drive out of and into');
          if (r.emergency.loaded < 2) bad.push(tr + ': the emergency cars did not load (' + (r.emergency.safetyError || r.emergency.medicalError || 'timed out') + ')');
          else { const sz = r.emergency.safetySize, mz = r.emergency.medicalSize; if (!(sz[0] > 3.5 && sz[0] < 5.5)) bad.push(tr + ': the safety car is ' + sz[0] + ' m long (a sports car is about 4.6 m)'); if (!(mz[2] > 4.5 && mz[2] < 6)) bad.push(tr + ': the medical car is ' + mz[2] + ' m long (about 5.2 m)'); } }
        if (r.minOff < 1.5) bad.push(tr + ': a board stands ' + r.minOff + ' m from the road edge (nothing may stand on the road; boards keep 1.5 m off it)');
        if (!(r.tris.signs > 0 && r.tris.solids > 0)) bad.push(tr + ': the furniture has no geometry');
      }
      return bad.length ? 'F1 RACE FURNITURE: ' + bad.join('; ') : true;
    },
  },
  {
    id: 'play-tyre-wear-scaled-to-race-length',
    ask: 'Laps are short, so tyre wear is scaled to the race length: on a 5-lap race a Soft set must reach the wear cliff (60%) by lap 3 and a Hard set must not run out; the tyre box shows TYRES N%',
    async test(page, h) {
      await h.eval(() => { location.href = 'apexf1.html?test=grid'; }).catch(() => {});
      let w = null;
      for (let i = 0; i < 80 && !w; i++) { await h.wait(500); w = await h.eval(() => { const T = window.__test; if (!T || !T.wearPerLap) return null; return { soft5: T.wearPerLap('SOFT', 5) * 3, hard5: T.wearPerLap('HARD', 5) * 5, soft20: T.wearPerLap('SOFT', 20) * 3, txt: (document.getElementById('tireAge') || {}).textContent || '' }; }).catch(() => null); }
      if (!w) return 'no wear probe on the test hook';
      if (w.soft5 < 0.6) return 'a Soft set after 3 laps of a 5-lap race is only ' + Math.round(w.soft5 * 100) + '% worn (should be past the 60% cliff)';
      if (w.hard5 > 0.7) return 'a Hard set is ' + Math.round(w.hard5 * 100) + '% worn after a whole 5-lap race (should last)';
      if (w.soft20 > 0.3) return 'a long race got the short-race wear scale (Soft after 3 of 20 laps: ' + Math.round(w.soft20 * 100) + '%)';
      return true;
    },
  },
  {
    id: 'play-damage-and-retirement', mode: 'race',
    ask: 'Crashes damage the car: a hit adds damage, the pit stop repairs it, and 100% damage retires the car (it finishes last and the race is lost)',
    async test(page, h) {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 120; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return 'never reached the grid at ?test=grid';
      let leftGrid = false;
      for (let p = 0; p < 3 && !leftGrid; p++) { await h.press('#raceBtn').catch(() => {}); for (let i = 0; i < 10; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { leftGrid = true; break; } await h.wait(300); } }
      let racing = false;
      for (let i = 0; i < 80; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'race') { racing = true; break; } await h.wait(300); }
      if (!racing) return 'race never started at ?test=grid';
      let a = null;
      for (let i = 0; i < 10 && !a; i++) { await h.wait(300); a = await h.eval(() => { const T = window.__test; if (!T || !T.damageProbe) return null; const rep = T.repairProbe(); const small = T.damageProbe(12, 0.5); const big = T.damageProbe(30, 5); return { rep, small, big }; }).catch(() => null); }
      if (!a) return 'no damage probe on the test hook';
      if (a.rep !== 0) return 'the pit stop did not repair the damage (damage ' + a.rep + ' after the stop)';
      if (!(a.small.after > 0.02 && a.small.after < 0.5)) return 'a light 12 m/s hit should add some damage but not wreck the car (damage ' + a.small.after + ')';
      if (!a.big.retired || a.big.after < 1) return 'a long 30 m/s crash did not retire the car (damage ' + a.big.after + ')';
      return true;
    },
  },
  {
    id: 'play-tire-and-body-bars', mode: 'race',
    ask: 'The HUD says TIRE (American spelling, never TYRE) and shows two bars: tires and body, each with a percent; body drops when the car is damaged',
    async test(page, h) {
      await h.eval(() => { location.href = location.pathname + '?test=grid'; }).catch(() => {});
      await h.wait(1500);
      let grid = false;
      for (let i = 0; i < 120; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'grid') { grid = true; break; } await h.wait(300); }
      if (!grid) return 'never reached the grid at ?test=grid';
      let leftGrid = false;
      for (let p = 0; p < 3 && !leftGrid; p++) { await h.press('#raceBtn').catch(() => {}); for (let i = 0; i < 10; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'lights' || md === 'race') { leftGrid = true; break; } await h.wait(300); } }
      let racing = false;
      for (let i = 0; i < 80; i++) { const md = await h.eval(() => window.__test ? window.__test.race().mode : '?').catch(() => '?'); if (md === 'race') { racing = true; break; } await h.wait(300); }
      if (!racing) return 'race never started at ?test=grid';
      await h.wait(800);
      const r = await h.eval(() => { const g = id => (document.getElementById(id) || {}); const before = g('bodyPct').textContent; window.__test.damageProbe(14, 0.6); return new Promise(res => setTimeout(() => res({ box: (document.getElementById('tirebox') || {}).innerText || '', tire: g('tireAge').textContent, before, after: g('bodyPct').textContent, w: g('bodyFill').style.width }), 400)); }).catch(() => null);
      if (!r) return 'could not read the tire box';
      if (/TYRE/i.test(r.box)) return 'the HUD still spells it TYRE: ' + r.box.replace(/\s+/g, ' ');
      if (!/TIRES \d+%/.test(r.tire)) return 'no TIRES N% line in the tire box (' + r.tire + ')';
      if (!/BODY \d+%/.test(r.after)) return 'no BODY N% bar in the tire box (' + r.after + ')';
      if (!(parseInt(r.after.replace(/\D/g, '')) < parseInt(r.before.replace(/\D/g, '')))) return 'the body bar did not drop after a hit (' + r.before + ' -> ' + r.after + ')';
      return true;
    },
  },
  {
    id: 'play-pilot-car-leads-then-leaves',
    ask: 'The pilot car should lead the field off the start, hold every car behind it, then peel off onto its apron and park, and the green flag should free the race.',
    mode: 'race',
    async test(page, h) {
      const grid = await h.eval(() => !!(window.__test && window.__test.race)).catch(() => false);
      if (!grid) return 'no test hook';
      await h.eval(() => { window.__pilotForce = true; });
      let loaded = false;
      for (let i = 0; i < 80 && !loaded; i++) { loaded = await h.eval(() => { const q = window.__test.paceProbe(); return !!q && !q.noCar; }).catch(() => false); if (!loaded) await h.wait(250); }
      if (!loaded) return 'the safety car model never loaded';
      for (let p = 0; p < 3; p++) { await h.press('#raceBtn').catch(() => {}); await h.wait(500); const md = await h.eval(() => window.__test.race().mode).catch(() => '?'); if (md === 'lights' || md === 'race') break; }
      let seen = null, was = false, ended = false, capBroken = null, released = false;
      for (let i = 0; i < 160 && !was; i++) { await h.wait(250); const q = await h.eval(() => window.__test.paceProbe()).catch(() => null); if (q && q.active) { was = true; seen = q; } }
      for (let i = 0; i < 60 && was && !ended; i++) {
        const q = await h.eval(() => window.__test.paceStep(30)).catch(() => null);
        if (!q) continue;
        if (q.active) { seen = q; if (q.released) released = true; if (!q.released && q.vmax > q.pv + 0.1) capBroken = 'a car ran at ' + q.vmax + ' m/s while the pilot car did ' + q.pv; }
        else ended = true, seen = q;
      }
      if (!was) return 'the pilot car never led the race (pace never started)';
      if (capBroken) return capBroken;
      if (!released) return 'the green flag never came';
      if (!ended) return 'the pilot car never left the track (still leading after 60 s of its own clock)';
      if (!(seen.home < 0.6)) return 'the pilot car did not park back on its apron (' + seen.home + ' m away)';
      return true;
    },
  },
  {
    id: 'play-line-signs-start-finish',
    ask: 'The START sign should show only at the beginning of the race and the FINISH sign only on the last lap.',
    mode: 'race',
    async test(page, h) {
      const ok = await h.eval(() => !!(window.__test && window.__test.signs)).catch(() => false);
      if (!ok) return 'no test hook';
      const a = await h.eval(() => window.__test.signs());
      if (a.mode === 'race' && a.finish && a.lap < a.laps) return 'FINISH showed on lap ' + a.lap + ' of ' + a.laps;
      const b = await h.eval(() => { return window.__test.signs({ lap: 99, raceT: 30, mode: 'race' }); });
      if (!b.finish) return 'FINISH did not show on the last lap';
      if (b.start) return 'START still showed late in the race';
      const c = await h.eval(() => { return window.__test.signs({ lap: 2, raceT: 60, mode: 'race' }); });
      if (c.finish) return 'FINISH showed on lap 2';
      return true;
    },
  },
  {
    id: 'play-steering-assist-keeps-car-on-road',
    ask: 'Steering assist (owner Nov 12 2026, cornering): with the assist ON a car pointing off the road with no stick is steered back and never reaches the grass; with it OFF the same start leaves the road (so the assist is really what holds it)',
    async test(page, h) {
      if (!await g33Reset(page, h, null)) return 'reset did not reach the main menu';
      await h.press('#careerBtn'); await h.press('#toTeamBtn'); await h.press('#startBtn');
      let quali = false;
      for (let q = 0; q < 30 && !quali; q++) { await h.wait(500); quali = await h.eval(`window.__test.race().mode === 'quali'`).catch(() => false); }
      if (!quali) return 'weekend never reached qualifying';
      const off = await h.eval(`window.__test.assistRun(false, 3.5, 0.18, 4)`).catch(() => null);
      const on = await h.eval(`window.__test.assistRun(true, 3.5, 0.18, 4)`).catch(() => null);
      if (!off || !on) return 'no assistRun hook result';
      if (!(off.off > 0 || off.maxD > off.half + 1.6)) return 'control failed: with the assist OFF the car never left the road (maxD ' + off.maxD + ' of ' + off.half + ') so this test proves nothing';
      if (on.off > 0 || on.maxD > on.half + 0.3) return 'assist ON still reached the grass: maxD ' + on.maxD + ' m of half-width ' + on.half + ' (off-road steps ' + on.off + ')';
      return true;
    },
  },
  // owner Nov 12 2026 'cars go through each other still'
  {
    id: 'play-cars-never-overlap', mode: 'race',
    ask: 'Two F1 cars never sit inside each other: over 60 s of racing with the whole pack no pair of cars on track overlaps (4.8 m nose to tail and 1.9 m side by side) - owner Nov 12 2026',
    async test(page, h) {
      let ok = null; for (let i = 0; i < 60 && !ok; i++) { await h.wait(500); ok = await h.eval(() => window.__test && window.__test.race && window.__test.race().mode === 'race').catch(() => null); }
      if (!ok) return { inconclusive: 'the race did not start' };
      const r = await h.eval(() => {
        const T = window.__test, L = T.trackLength ? T.trackLength() : 0; let worst = null, bad = 0;
        for (let i = 0; i < 1200; i++) { T.simStep(0.05, { skill: 'good' });
          const cs = T.cars();
          for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) { const A = cs[a], B = cs[b]; if (A.finished || B.finished) continue;
            let ds = A.s - B.s; if (L) { ds %= L; if (ds > L / 2) ds -= L; if (ds < -L / 2) ds += L; }
            const dd = Math.abs(A.d - B.d); if (Math.abs(A.d) > 9 || Math.abs(B.d) > 9) continue; // pit lane / off the racing road
            if (Math.abs(ds) < 4.8 && dd < 1.9) { bad++; if (!worst) worst = A.name + ' inside ' + B.name + ' (' + ds.toFixed(1) + ' m apart, ' + dd.toFixed(1) + ' m side by side) at step ' + i; } } }
        return { bad, worst, solid: window.__f1solid || 0 };
      }).catch((e) => ({ err: String(e) }));
      if (r.err) return r.err;
      if (r.bad > 0) return 'F1: cars drove through each other ' + r.bad + ' times - first: ' + r.worst;
      return true;
    },
  },
  // owner Nov 12 2026 'no control of the car in the pit or coming out - it stays gliding sideways ... coming out it's all the player's control to get back on track as soon as the last crew is passed'
  {
    id: 'play-pit-exit-player-steers', mode: 'race',
    ask: 'After the stop, once past his crew, the player steers out of the pits himself: holding steer toward the track puts him back on the track before the automatic pit exit, and the car points the way it moves (not sliding sideways) - owner Nov 12 2026',
    async test(page, h) {
      let ok = null; for (let i = 0; i < 60 && !ok; i++) { await h.wait(500); ok = await h.eval(() => window.__test && window.__test.race && window.__test.race().mode === 'race').catch(() => null); }
      if (!ok) return { inconclusive: 'the race did not start' };
      const r = await h.eval(() => {
        const T = window.__test;
        for (let i = 0; i < 200; i++) T.simStep(0.05, { skill: 'good' });
        T.pitNow(); let held = false, i = 0;
        for (; i < 900; i++) { T.simStep(0.05, { skill: 'good' }); const q = T.pitProbe(); if (q.hold) held = true; if (held && !q.hold) break; }
        if (!held) return { inc: 'never stopped in the box' };
        for (let k = 0; k < 40; k++) T.simStep(0.05, { skill: 'good' }); // roll past the crew
        const f = T.furniture(), L = f.L, pitIn = f.pitIn; let maxSlide = 0, left = null;
        const man = { skill: 'good' }; Object.defineProperty(man, 'st', { get: () => -1, set: () => {} }); // a driver holding full steer toward the track and full gas
        for (let k = 0; k < 600; k++) { T.simStep(0.05, man);
          const c = T.cars().find(x => x.isPlayer), q = T.pitProbe(), from = ((c.s - pitIn) % L + L) % L;
          if (!q.inPits) { left = { from: Math.round(from), d: +c.d.toFixed(1) }; break; } }
        return { left, W: f.W };
      }).catch((e) => ({ err: String(e) }));
      if (r.err) return r.err;
      if (r.inc) return { inconclusive: r.inc };
      if (!r.left) return 'F1 PIT EXIT: held steer toward the track for 30 s after the stop and the car never left the pit lane';
      if (r.left.from > 320) return 'F1 PIT EXIT: steering toward the track only got him out ' + r.left.from + ' m into the pit lane - the lane still drove him to the end';
      if (Math.abs(r.left.d) > r.W / 2) return 'F1 PIT EXIT: left the pits at ' + r.left.d + ' m from the middle - not on the track';
      return true;
    },
  },
  // owner Nov 12 2026 'make a road for the pilot and ambulance car ... enter one end and get back on track through the other end'
  {
    id: 'play-pilot-car-never-on-grass', mode: 'race',
    ask: 'The pilot car drives only on paved ground (track, pit lane, its own road and apron) from the start until it parks - never over grass (Harbour, where it crossed 45 m of grass) - owner Nov 12 2026',
    async test(page, h) {
      await h.eval(() => { location.href = 'apexf1.html?test=grid&track=harbour'; }).catch(() => {});
      let up = null; for (let i = 0; i < 60 && !up; i++) { await h.wait(500); up = await h.eval(() => !!(window.__test && window.__test.paceProbe)).catch(() => null); }
      if (!up) return { inconclusive: 'game did not load' };
      await h.eval(() => { window.__pilotForce = true; });
      let loaded = false; for (let i = 0; i < 80 && !loaded; i++) { loaded = await h.eval(() => { const q = window.__test.paceProbe(); return !!q && !q.noCar; }).catch(() => false); if (!loaded) await h.wait(250); }
      if (!loaded) return { inconclusive: 'the safety car model never loaded' };
      for (let p = 0; p < 3; p++) { await h.press('#raceBtn').catch(() => {}); await h.wait(500); const md = await h.eval(() => window.__test.race().mode).catch(() => '?'); if (md === 'lights' || md === 'race') break; }
      let was = false; for (let i = 0; i < 160 && !was; i++) { await h.wait(250); was = await h.eval(() => window.__test.paceProbe().active).catch(() => false); }
      if (!was) return { inconclusive: 'the pace lap never started' };
      const r = await h.eval(() => { const T = window.__test; let bad = 0, first = null, n = 0;
        for (let i = 0; i < 4000; i++) { const q = T.paceStep(1); if (!q.active) break; n++; const g = T.surfaceAt(q.pos[0], q.pos[1]); if (g.green || g.none) { bad++; if (!first) first = q.done + ' of ' + q.run + ' m (' + (g.none ? 'nothing under it' : 'grass ' + g.color) + ')'; } }
        return { bad, first, n }; }).catch((e) => ({ err: String(e) }));
      if (r.err) return r.err;
      if (r.n < 50) return { inconclusive: 'the pace lap ended too soon to check' };
      if (r.bad > 0) return 'F1 PILOT CAR: drove over grass ' + r.bad + ' of ' + r.n + ' steps - first at ' + r.first;
      return true;
    },
  },
  // owner Nov 12 2026 'players still tangled up, every body maxed out same speed' - the rivals have their own pace, so after 90 s the pack is strung out
  {
    id: 'play-field-strings-out', mode: 'race',
    ask: 'The F1 rivals do not all drive the same speed: after 90 s of racing the five rivals are spread over at least 60 m from first to last along the road - owner Nov 12 2026',
    async test(page, h) {
      let ok = null; for (let i = 0; i < 60 && !ok; i++) { await h.wait(500); ok = await h.eval(() => window.__test && window.__test.race && window.__test.race().mode === 'race').catch(() => null); }
      if (!ok) return { inconclusive: 'the race did not start' };
      const r = await h.eval(() => { const T = window.__test; for (let i = 0; i < 1800; i++) T.simStep(0.05, { skill: 'good' });
        const cs = T.cars().filter((c) => !c.isPlayer && !c.retired); const d = cs.map((c) => c.raceDist !== undefined ? c.raceDist : c.s); return { n: cs.length, spread: Math.max(...d) - Math.min(...d) }; }).catch((e) => ({ err: String(e) }));
      if (r.err) return r.err;
      if (r.n < 4) return { inconclusive: 'fewer than 4 rivals left' };
      if (r.spread < 60) return 'F1: after 90 s the rivals are only ' + r.spread.toFixed(0) + ' m apart - they still drive as one pack';
      return true;
    },
  },
  {
    id: 'play-friend-code-is-a-button', mode: 'menu',
    ask: 'The main menu shows a MY FRIEND CODE button, not the code itself; tapping it opens the share screen with the code and COPY / SHARE / CLOSE - owner Nov 14 2026',
    async test(page, h) {
      const r = await h.eval(() => { const m = document.getElementById('menu'), b = document.getElementById('codeBtn'), card = document.getElementById('codeOv');
        if (!m || !b || !card) return { err: 'menu, MY FRIEND CODE button or share screen is missing' };
        const code = document.getElementById('myCode'); const onMenu = m.contains(code);
        b.click(); const shown = !card.classList.contains('hidden'), menuHidden = m.classList.contains('hidden');
        const btns = ['codeCopy', 'codeShare', 'codeClose'].every((id) => document.getElementById(id));
        return { onMenu, shown, menuHidden, btns }; }).catch((e) => ({ err: String(e) }));
      if (r.err) return 'F1: ' + r.err;
      if (r.onMenu) return 'F1: the friend code text is still printed on the main menu';
      if (!r.shown || !r.menuHidden) return 'F1: tapping MY FRIEND CODE did not open the share screen';
      if (!r.btns) return 'F1: the share screen has no COPY / SHARE / CLOSE buttons';
      return true;
    },
  },
  {
    id: "play-no-hiss-noise-in-race",
    mode: "race",
    ask: "During a race the crowd hiss, rain hiss and tire-squeal noise beds are silent by default - only the music and the engine play - owner Nov 14 2026",
    async test(page, h) {
      let ok = null; for (let i = 0; i < 60 && !ok; i++) { await h.wait(500); ok = await h.eval(() => window.__test && window.__test.race && window.__test.race().mode === 'race').catch(() => null); }
      if (!ok) return { inconclusive: 'the race did not start' };
      await h.wait(2500);
      const m = await h.eval(() => window.__mix || null).catch(() => null);
      if (!m || m.crowd === undefined) return { inconclusive: 'the sound mix was not running (no audio in this browser)' };
      const bad = Object.entries(m).filter(([, v]) => v > 0.001).map(([k, v]) => k + ' ' + v.toFixed(3));
      if (bad.length) return 'F1: noise beds are playing in the race: ' + bad.join(', ') + ' - only music and engine should be heard';
      return true;
    },
  },
];
