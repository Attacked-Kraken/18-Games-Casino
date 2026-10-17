// Owner's fix list for Apex Monster Truck (see README.md in this folder).
// Play tests: every game needs 5+ tests that play it by its rules.
export default [
  {
    id: 'play-drive-forward',
    ask: 'Truck drives forward when DRIVE is held',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        // Start the game if in menu
        if (M.getState() === 'menu') M.startGame();
        return new Promise((res) => {
          const waitPlay = setInterval(() => {
            if (M.getState() === 'play') {
              clearInterval(waitPlay);
              const x0 = M.T.x, z0 = M.T.z;
              M.input.throttleA = 1;
              setTimeout(() => {
                M.input.throttleA = 0;
                const d = Math.hypot(M.T.x - x0, M.T.z - z0);
                res(d > 5 ? true : `truck only moved ${d.toFixed(1)}m in 2s of full throttle`);
              }, 2000);
            }
          }, 200);
          setTimeout(() => { clearInterval(waitPlay); res('game never reached play state'); }, 10000);
        });
      });
    },
  },
  {
    id: 'play-crush-car',
    ask: 'Driving over a car crushes it and scores points',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        if (M.getState() === 'menu') M.startGame();
        return new Promise((res) => {
          const waitPlay = setInterval(() => {
            if (M.getState() === 'play') {
              clearInterval(waitPlay);
              const c = M.cars.find((x) => !x.crushed);
              if (!c) { res('no uncrushed car'); return; }
              const s0 = M.score;
              // Drive truck into the car
              M.T.x = c.x - 5; M.T.z = c.z; M.T.hd = Math.PI / 2; M.T.sp = 15;
              setTimeout(() => {
                M.T.sp = 0;
                res(c.crushed && M.score > s0 ? true : 'car not crushed or no score');
              }, 1500);
            }
          }, 200);
          setTimeout(() => { clearInterval(waitPlay); res('game never reached play state'); }, 10000);
        });
      });
    },
  },
  {
    id: 'play-jump-airtime',
    ask: 'Truck launches off a ramp, gets air, and lands',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        if (M.getState() === 'menu') M.startGame();
        return new Promise((res) => {
          const waitPlay = setInterval(() => {
            if (M.getState() === 'play') {
              clearInterval(waitPlay);
              const r = M.ramps[0];
              if (!r) { res('no ramps'); return; }
              M.T.x = r.lx; M.T.z = r.lz; M.T.hd = Math.atan2(r.dx, r.dz);
              M.T.sp = 25; M.T.y = 0; M.T.vy = 0; M.T.grounded = true;
              let sawAir = false;
              const iv = setInterval(() => {
                if (!M.T.grounded) sawAir = true;
                if (sawAir && M.T.grounded) { clearInterval(iv); res(true); }
              }, 100);
              setTimeout(() => { clearInterval(iv); res(sawAir ? 'got air but never landed' : 'never left ground'); }, 8000);
            }
          }, 200);
          setTimeout(() => { clearInterval(waitPlay); res('game never reached play state'); }, 10000);
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
