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
];
