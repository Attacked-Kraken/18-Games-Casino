// Game-check fix tests for Apex F1 (apexf1.html) â JOB J38
// PLAY TESTS: these actually PLAY the game by its rules.
// window.__test is exposed by the game (see bottom of apexf1.html).

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
];
