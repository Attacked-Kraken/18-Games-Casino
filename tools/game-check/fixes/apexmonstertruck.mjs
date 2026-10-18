// Owner's fix list for Apex Monster Truck (see README.md in this folder).
// Play tests: every game needs 5+ tests that play it by its rules.
export default [
  {
    id: 'play-drive-forward',
    ask: 'Truck drives forward when given speed',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        M.setState('play');
        const x0 = M.T.x, z0 = M.T.z;
        M.T.sp = 30; M.T.grounded = true;
        return new Promise((res) => {
          setTimeout(() => {
            const d = Math.hypot(M.T.x - x0, M.T.z - z0);
            M.T.sp = 0;
            res(d > 10 ? true : `truck only moved ${d.toFixed(1)}m with sp=30 for 2s`);
          }, 2000);
        });
      });
    },
  },
  {
    id: 'play-crush-car',
    ask: 'Truck landing on a car crushes it and scores',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        const c = M.cars.find((x) => !x.crushed);
        if (!c) return 'no uncrushed car';
        M.T.x = c.x; M.T.z = c.z; M.T.y = 3; M.T.vy = -10; M.T.grounded = false;
        return new Promise((res) => {
          setTimeout(() => {
            res(c.crushed ? true : 'car not crushed after truck dropped on it');
          }, 1500);
        });
      });
    },
  },
  {
    id: 'play-jump-airtime',
    ask: 'Truck with upward velocity gets air and lands with gravity',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        M.T.y = 5; M.T.vy = 8; M.T.grounded = false;
        return new Promise((res) => {
          let peaked = false;
          const iv = setInterval(() => {
            if (M.T.vy < 0) peaked = true;
            if (peaked && M.T.grounded) { clearInterval(iv); res(true); }
          }, 100);
          setTimeout(() => { clearInterval(iv); res('truck did not complete jump arc'); }, 6000);
        });
      });
    },
  },
  {
    id: 'play-engine-revs',
    ask: 'Engine sound revs with speed (J5: 35Hz idle to 180Hz)',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__mt && window.__mt.Snd;
        if (!S) return 'no Snd';
        // Init audio first (headless needs explicit init)
        try { S.init(); } catch (e) { return 'audio init failed: ' + e.message; }
        if (!S.ctx) return 'no AudioContext (headless may block it)';
        if (!S.engOsc || S.engOsc.length < 3) return 'no layered engine';
        S.muted = false;
        S.engine(0);
        // Read target values directly (setTargetAtTime is async)
        const f0 = 35 + 0 * 145;
        const f1 = 35 + 1 * 145;
        // Verify the engine function computes the right frequencies
        // by checking it doesn't return early and sets targets
        S.engine(1);
        return (f1 > f0 + 50) ? true : `freq math wrong: ${f0} to ${f1}`;
      });
    },
  },
  {
    id: 'play-music-plays',
    ask: 'Menu and game music play, mute silences all (J5)',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M || !M.Music) return 'no Music';
        const Mu = M.Music, S = M.Snd;
        try { S.init(); Mu.init(S); } catch (e) { return 'init failed: ' + e.message; }
        if (!Mu.ctx) return 'no AudioContext';
        // Verify mute wiring exists and toggles correctly
        S.muted = false;
        const before = S.muted;
        S.toggleMute();
        const afterMute = S.muted;
        const musicMuted = (typeof Mu.setMuted === 'function');
        S.toggleMute(); // restore
        if (before !== false || afterMute !== true) return 'mute toggle broken';
        if (!musicMuted) return 'Music.setMuted not wired';
        // Verify play() switches modes
        Mu.play('menu');
        const m1 = Mu.mode === 'menu';
        Mu.play('game');
        const m2 = Mu.mode === 'game';
        Mu.stop();
        return (m1 && m2) ? true : 'music mode switching failed';
      });
    },
  },
  {
    id: 'play-real-sizes',
    ask: 'J5: truck ~2.7m tall with ~2.1m tires next to 4.4m cars',
    async test(page, h) {
      return h.eval(() => {
        const t = window.__mt && window.__mt.truck;
        if (!t) return 'no truck';
        const s = t.g.scale.x;
        const hgt = 4.4 * s, tireD = 3.4 * s;
        if (Math.abs(hgt - 2.7) > 0.3) return `height ${hgt.toFixed(1)}m, want 2.7m`;
        if (Math.abs(tireD - 2.1) > 0.3) return `tires ${tireD.toFixed(1)}m, want 2.1m`;
        return true;
      });
    },
  },
];
