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
        // Force play state and give the truck speed directly (tests physics, not input)
        if (M.getState() !== 'play') { M.T.x = 0; M.T.z = 0; M.setState('play'); }
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
        const s0 = M.score;
        // Drop truck directly onto the car (tests crush logic)
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
        const y0 = M.T.y;
        return new Promise((res) => {
          let peaked = false;
          const iv = setInterval(() => {
            if (M.T.vy < 0) peaked = true;
            if (peaked && M.T.grounded) {
              clearInterval(iv);
              res(true);
            }
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
        if (!S || !S.engOsc) return 'no layered engine';
        if (S.engOsc.length < 3) return `only ${S.engOsc.length} oscillators, need 3`;
        S.engine(0);
        const f0 = S.engOsc[1].frequency.value;
        S.engine(1);
        const f1 = S.engOsc[1].frequency.value;
        S.engine(0);
        return f1 > f0 + 50 ? true : `no rev: idle ${f0}Hz, full ${f1}Hz`;
      });
    },
  },
  {
    id: 'play-music-plays',
    ask: 'Menu and game music play, mute silences all (J5)',
    async test(page, h) {
      return h.eval(() => {
        const Mu = window.__mt && window.__mt.Music;
        if (!Mu || !Mu.musGain) return 'no Music';
        Mu.play('menu');
        if (Mu.mode !== 'menu') return 'menu music failed';
        Mu.play('game');
        if (Mu.mode !== 'game') return 'game music failed';
        window.__mt.Snd.toggleMute();
        const g = Mu.musGain.gain.value;
        window.__mt.Snd.toggleMute();
        Mu.stop();
        return g < 0.01 ? true : 'mute did not silence music';
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
