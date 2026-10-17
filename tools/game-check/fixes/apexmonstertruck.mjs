// Owner's fix list for Apex Monster Truck (see README.md in this folder).
// Play tests: every game needs 5+ tests that play it by its rules.
export default [
  {
    id: 'play-drive-forward',
    ask: 'Truck drives forward when DRIVE is held',
    async test(page, h) {
      return h.eval(() => {
        const T = window.__mt && window.__mt.T;
        if (!T) return 'no truck state (window.__mt.T)';
        const x0 = T.x, z0 = T.z;
        // Simulate 2 seconds of full throttle
        return new Promise((res) => {
          const iv = setInterval(() => {
            if (window.__mt.input) { window.__mt.input.throttleA = 1; }
          }, 50);
          setTimeout(() => {
            clearInterval(iv);
            if (window.__mt.input) window.__mt.input.throttleA = 0;
            const d = Math.hypot(T.x - x0, T.z - z0);
            res(d > 5 ? true : `truck only moved ${d.toFixed(1)}m in 2s of full throttle`);
          }, 2000);
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
        if (!M || !M.cars || !M.cars.length) return 'no cars found';
        const s0 = M.score || 0;
        const c = M.cars.find((x) => !x.crushed);
        if (!c) return 'no uncrushed car to test';
        // Teleport truck onto the car
        M.T.x = c.x; M.T.z = c.z; M.T.y = 0.5; M.T.vy = -5;
        return new Promise((res) => {
          setTimeout(() => {
            res(c.crushed && M.score > s0 ? true : 'car not crushed or no score after driving over it');
          }, 1000);
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
        if (!M || !M.ramps || !M.ramps.length) return 'no ramps found';
        const r = M.ramps[0];
        // Place truck at ramp base with speed toward it
        M.T.x = r.lx; M.T.z = r.lz; M.T.hd = Math.atan2(r.dx, r.dz);
        M.T.sp = 20; M.T.y = 0; M.T.vy = 0; M.T.grounded = true;
        return new Promise((res) => {
          let sawAir = false;
          const iv = setInterval(() => {
            if (!M.T.grounded) sawAir = true;
            if (sawAir && M.T.grounded) {
              clearInterval(iv);
              res(true);
            }
          }, 100);
          setTimeout(() => { clearInterval(iv); res(sawAir ? 'got air but never landed' : 'truck never left the ground off the ramp'); }, 8000);
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
        if (!S || !S.engOsc) return 'no layered engine (window.__mt.Snd.engOsc)';
        if (S.engOsc.length < 3) return `only ${S.engOsc.length} engine oscillators, need 3 for V8 roar`;
        S.engine(0);
        const f0 = S.engOsc[1].frequency.value;
        S.engine(1);
        const f1 = S.engOsc[1].frequency.value;
        S.engine(0);
        if (f1 <= f0 + 50) return `engine doesn't rev: idle ${f0}Hz, full ${f1}Hz`;
        return true;
      });
    },
  },
  {
    id: 'play-music-plays',
    ask: 'Menu and game music play, mute silences all (J5)',
    async test(page, h) {
      return h.eval(() => {
        const Mu = window.__mt && window.__mt.Music;
        if (!Mu) return 'no Music object (window.__mt.Music)';
        if (!Mu.musGain) return 'no music gain node';
        Mu.play('menu');
        if (Mu.mode !== 'menu') return 'menu music did not start';
        Mu.play('game');
        if (Mu.mode !== 'game') return 'game music did not start';
        const S = window.__mt.Snd;
        S.toggleMute();
        const g = Mu.musGain.gain.value;
        S.toggleMute();
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
        const M = window.__mt;
        if (!M || !M.truck) return 'no truck ref';
        const s = M.truck.g.scale.x;
        // Truck built at ~4.4m tall, scaled by 0.62 = ~2.7m
        const hgt = 4.4 * s;
        if (Math.abs(hgt - 2.7) > 0.3) return `truck height ${hgt.toFixed(1)}m, want ~2.7m`;
        const tireD = 3.4 * s;
        if (Math.abs(tireD - 2.1) > 0.3) return `tire diameter ${tireD.toFixed(1)}m, want ~2.1m`;
        return true;
      });
    },
  },
];
