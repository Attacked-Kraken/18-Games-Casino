// Owner's fix list for Apex F1 (JOB J39 - see looks/apexf1.md).
// Every h.eval function is fully self-contained (no closure helpers) - the robot
// ships each function's source into the page alone.
export default [
  {
    id: 'play-boots-clean',
    ask: 'The game must start clean - no script errors, the race actually starts',
    async test(page, h) {
      const ok = await h.eval(() => !!window.__f1);
      if (!ok) return 'window.__f1 missing - JOB J39 build not in the game (or the script died before the race: the checks keep reporting "W is not defined")';
      const st = await h.eval(() => window.__f1.state());
      if (!st || !st.started) return 'the race never started';
      if (!(st.cars >= 10)) return 'only ' + (st ? st.cars : 0) + ' cars in the race - wants a full grid of 10+';
      return true;
    },
  },
  {
    id: 'play-chase-camera',
    ask: 'Camera low and right behind MY car (chase cam like a real F1 game), my car big in the picture',
    async test(page, h) {
      const ok = await h.eval(() => !!window.__f1);
      if (!ok) return 'window.__f1 missing - JOB J39 build not in the game';
      // hold GAS through the game's own touch button so the car is racing
      await h.eval(() => { if (!window.__f1drv) { window.__f1drv = setInterval(() => { const b = document.getElementById('btnGas'); if (b) { b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); } }, 300); } return true; });
      const t0 = Date.now(); const S = [];
      while (Date.now() - t0 < 20000 && S.length < 5) {
        const c = await h.eval(() => window.__f1.cam());
        if (c) S.push(c);
        await h.wait(400);
      }
      if (S.length < 3) return 'never saw the chase camera behind the player car';
      for (const c of S) {
        if (Math.abs(c.behind - 7.5) > 1.5) return 'camera sits ' + c.behind.toFixed(1) + 'm behind the car - wants about 7.5 (low and right behind, car big in the picture)';
        if (Math.abs(c.up - 2.7) > 0.8) return 'camera flies ' + c.up.toFixed(1) + 'm up - wants about 2.7 (low, like a real F1 game)';
        if (Math.abs(c.lat) > 0.8) return 'camera rides ' + c.lat.toFixed(1) + 'm off to the side - wants centered behind MY car';
      }
      return true;
    },
  },
  {
    id: 'play-full-grid',
    ask: 'A full grid of 10+ F1-style cars',
    async test(page, h) {
      const g = await h.eval(() => (window.__f1 && window.__f1.grid) ? window.__f1.grid() : null);
      if (!g) return 'no grid report - the race has not started';
      if (g.cars < 10) return 'only ' + g.cars + ' cars on the grid - wants 10+ F1-style cars (target 20)';
      if (g.offTrack > 0) return g.offTrack + ' car(s) spawned off the track';
      return true;
    },
  },
  {
    id: 'play-grid-races',
    ask: 'A full grid of 10+ F1-style cars, all racing',
    async test(page, h) {
      const a = await h.eval(() => (window.__f1 && window.__f1.grid) ? window.__f1.grid() : null);
      if (!a || !a.aiPos) return 'no grid report - the race has not started';
      await h.wait(12000);
      const b = await h.eval(() => (window.__f1 && window.__f1.grid) ? window.__f1.grid() : null);
      if (!b || !b.aiPos) return 'grid report vanished mid-race';
      let moved = 0;
      for (let i = 0; i < Math.min(a.aiPos.length, b.aiPos.length); i++) {
        let d = b.aiPos[i] - a.aiPos[i];
        if (d < -1000) d += 100000; // lap wrap safety, tracks are ~5km
        if (d > 50) moved++;
      }
      if (moved < Math.min(9, a.aiPos.length)) return 'only ' + moved + ' of ' + a.aiPos.length + ' rival cars are racing (moved 50m+) - the grid must race, not sit on the grid';
      return true;
    },
  },
  {
    id: 'play-circuit-dressing',
    ask: 'A real F1 street-circuit venue (venues/circuit.md): kerbs, barriers, start gantry, pit lane with garages',
    async test(page, h) {
      const v = await h.eval(() => (window.__f1 && window.__f1.venue) ? window.__f1.venue() : null);
      if (!v) return 'no venue report from the game';
      if (!(v.kerbs > 0)) return 'no kerbs built - a real circuit has red/white kerbs';
      if (!(v.barriers > 0)) return 'no barriers built - a street circuit is lined with barriers';
      if (!v.gantry) return 'no start gantry over the start line';
      if (v.pitGarages < 10) return 'only ' + v.pitGarages + ' pit garages - wants garages for 10 teams';
      return true;
    },
  },
  {
    id: 'play-city-and-crowd',
    ask: 'City around the circuit and a crowd in the stands - never an empty green field',
    async test(page, h) {
      const v = await h.eval(() => (window.__f1 && window.__f1.venue) ? window.__f1.venue() : null);
      if (!v) return 'no venue report from the game';
      if (v.stands < 3) return 'only ' + v.stands + ' grandstands - wants packed stands on the main straight and at the big corners';
      if (v.crowd < 5000) return 'only ' + v.crowd + ' crowd figures - wants a packed crowd (5000+)';
      if (v.skyline < 20) return 'only ' + v.skyline + ' skyline buildings - wants a city around the circuit, not an empty field';
      return true;
    },
  },
];
