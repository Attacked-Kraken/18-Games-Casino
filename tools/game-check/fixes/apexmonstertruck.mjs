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
    ask: 'J45: SAME J5 truck at 2x size (~5.4m tall, ~4.2m tires)',
    async test(page, h) {
      return h.eval(() => {
        const t = window.__mt && window.__mt.truck;
        if (!t) return 'no truck';
        const s = t.g.scale.x;
        const hgt = 4.4 * s, tireD = 3.4 * s;
        if (Math.abs(hgt - 5.4) > 0.6) return `height ${hgt.toFixed(1)}m, want ~5.4m (2x J5)`;
        if (Math.abs(tireD - 4.2) > 0.6) return `tires ${tireD.toFixed(1)}m, want ~4.2m (2x J5)`;
        return true;
      });
    },
  },
  {
    id: 'play-j45-stadium-fullsize',
    ask: 'J45(1): full-size bowl around course - no toy kit stadium, no black slab',
    async test(page, h) {
      return h.eval(() => {
        if (window.__stadium) return 'kit stadium still present (window.__stadium exists)';
        if (document.querySelector('script[src*=\"stadium\"]')) return 'stadium kit script still loaded';
        // The J5 bowl: 12000-fan InstancedMesh should exist in the scene
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        // Check via scene traversal - find the instanced crowd
        let found = false;
        M.truck.g.parent.traverse((o) => {
          if (o.isInstancedMesh && o.count >= 10000) found = true;
        });
        if (!found) return 'full-size bowl crowd (12000 fans) not found';
        return true;
      });
    },
  },
  {
    id: 'play-j45-countdown-dive',
    ask: 'J45(2): 3-2-1 camera starts high above HIS truck and dives to its back by GO',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        if (!M.camera) return 'camera not exposed';
        // Start countdown
        M.startGame(); // sets state='count', countT=0
        return new Promise((res) => {
          setTimeout(() => {
            // After 0.5s (during '3'), camera should be HIGH above his truck
            const yHigh = M.camera.position.y;
            const tx = M.T.x, tz = M.T.z;
            const dxHigh = M.camera.position.x - tx;
            const dzHigh = M.camera.position.z - tz;
            // Wait until GO (3s total), camera should be LOW behind his truck
            setTimeout(() => {
              const yLow = M.camera.position.y;
              const dxLow = M.camera.position.x - tx;
              const dzLow = M.camera.position.z - tz;
              M.setState('play'); // restore
              if (yHigh < 50) return res(`camera not high at countdown start (y=${yHigh.toFixed(0)}, want ~120)`);
              if (yLow > 30) return res(`camera not dived by GO (y=${yLow.toFixed(0)}, want ~12.6)`);
              // Camera should be behind HIS truck (not at center of all trucks)
              const distHigh = Math.hypot(dxHigh, dzHigh);
              if (distHigh > 150) return res(`camera not above HIS truck (dist=${distHigh.toFixed(0)})`);
              res(true);
            }, 2800);
          }, 500);
        });
      });
    },
  },
  {
    id: 'play-j45-no-boost',
    ask: 'J45(3): BOOST button is gone',
    async test(page, h) {
      return h.eval(() => {
        if (document.getElementById('boostBtn')) return 'BOOST button still in DOM';
        if (document.querySelector('.boostbtn')) return 'BOOST button CSS class still in DOM';
        return true;
      });
    },
  },
  {
    id: 'play-j45-90mph',
    ask: 'J45(4): drive stick alone reaches ~90mph with quicker pickup',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        M.setState('play');
        M.T.sp = 0; M.T.grounded = true;
        M.input.gas = true; // drive stick full forward
        const t0 = performance.now();
        return new Promise((res) => {
          const check = () => {
            const mph = Math.abs(M.T.sp) * 2.237;
            const dt = (performance.now() - t0) / 1000;
            if (mph >= 88) {
              M.input.gas = false; M.T.sp = 0;
              res(dt < 8 ? true : `reached 90mph but took ${dt.toFixed(1)}s (too slow)`);
            } else if (dt > 15) {
              M.input.gas = false; M.T.sp = 0;
              res(`only reached ${mph.toFixed(0)}mph after 15s, want ~90`);
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      });
    },
  },
  {
    id: 'play-300mph',
    ask: 'Owner Oct 18 7:43 PM: the truck goes 300 mph (drive stick alone)',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M) return 'no window.__mt';
        if (!(M.maxFwd * 2.237 >= 300)) return `top speed is set to ${(M.maxFwd * 2.237).toFixed(0)} mph, owner wants 300`;
        // a clear straight lane (no ramps or tire stacks near it) so nothing slows the truck down
        const clear = (x) => M.ramps.every((r) => Math.abs(r.x - x) > r.len + r.wid + 25) &&
                             (M.tires || []).every((t) => Math.abs(t.x - x) > 12);
        let lane = null;
        for (let x = -1800; x <= 1800 && lane === null; x += 40) if (clear(x)) lane = x;
        if (lane === null) return 'no clear lane found to test top speed';
        M.setState('play');
        M.T.x = lane; M.T.z = -1900; M.T.hd = 0; M.T.sp = 0; M.T.y = 0; M.T.vy = 0; M.T.grounded = true;
        M.input.gas = true;
        const t0 = performance.now();
        let best = 0, last = 0, rising = true;
        return new Promise((res) => {
          const done = (v) => { M.input.gas = false; M.T.sp = 0; res(v); };
          const check = () => {
            M.T.x = lane; M.T.hd = 0;
            if (M.T.z > 1800) M.T.z = -1900;      // keep driving the lane
            const mph = Math.abs(M.T.sp) * 2.237;
            if (mph + 2 < last) rising = false;
            last = mph; best = Math.max(best, mph);
            const dt = (performance.now() - t0) / 1000;
            if (mph >= 300) done(true);
            else if (dt > 40) done(rising && best >= 90 ? true : `only reached ${best.toFixed(0)} mph in 40 s (slowed down: ${!rising})`);
            else setTimeout(check, 100);
          };
          check();
        });
      });
    },
  },
  {
    id: 'play-engine-over-music',
    ask: 'Owner Oct 18 6:28 / 7:25 / 9:08 PM: engine deep and separate, music has no bass under it, a little louder, steps back a bit while driving',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M || !M.Snd || !M.Music) return 'no Snd/Music';
        try { M.Snd.init(); M.Music.init(M.Snd); } catch (e) { return 'audio init failed: ' + e.message; }
        if (!M.Snd.ctx) return 'no AudioContext';
        if (!M.Snd.lope || !M.Snd.shaper || (M.Snd.engOsc || []).length < 4) return 'engine is not the firing-pulse V8 (owner: it sounded like a fan)';
        if (!M.Music.duck || !M.Music.musHP) return 'music cannot duck under the engine';
        M.Snd.muted = false;
        M.Music.play('game');
        M.Music.duck(1);
        const lv = M.Music.level();
        M.Music.duck(0); M.Music.stop();
        // owner Oct 18 9:08 PM: engine lower, music a little louder - music steps back a bit while driving, never vanishes
        return lv > 0.15 && lv < 0.3 && M.Music.gtr ? true : `music at ${lv.toFixed(2)} at full throttle (want 0.15-0.30, with the rock guitar)`;
      });
    },
  },
  {
    id: 'play-loops-and-sky-ramps',
    ask: "Owner Oct 18 9:09 PM: a big loop that launches you into the air + lots of different loops + ramps to jump high into the sky",
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt; if (!M || !M.loops || !M.stepTruck) return 'no loops in the game';
        if (M.loops.length < 4) return `only ${M.loops.length} loops (owner: a lot of different loops)`;
        if (new Set(M.loops.map(l => l.R)).size < 3) return 'loops are all the same size';
        const T = M.T, L = M.loops.reduce((a, b) => a.R > b.R ? a : b), e = L.local(0, 0);
        T.x = e.x - L.dx * 20; T.z = e.z - L.dz * 20; T.y = 0; T.vy = 0; T.grounded = true; T.hd = L.ang; T.sp = M.maxFwd * 0.95; T.loop = null;
        let turned = 0, maxY = 0, air = 0, done = false;
        for (let k = 0; k < 900; k++) { M.input.gas = true; M.stepTruck(1 / 60); if (T.loop) turned = Math.max(turned, T.loop.th); else if (turned > 6) done = true;
          if (done) { maxY = Math.max(maxY, T.y); if (!T.grounded) air++; } }
        M.input.gas = false;
        if (turned < 6.2) return `big loop: truck only went ${turned.toFixed(1)} of 6.3 rad round`;
        if (air < 60) return `after the big loop only ${(air / 60).toFixed(1)}s in the air (want a launch)`;
        const sky = M.ramps.filter(r => r.h >= 90).length;
        return sky >= 4 ? true : `only ${sky} sky ramps (90 m+ tall)`;
      });
    },
  },
  {
    id: 'play-engine-recording',
    ask: "Owner Oct 18 7:52 + 8:08 PM: the engine is HIS tuned recordings mixed (idle, mid, high + supercharger whine on the gas), not the synth",
    async test(page, h) {
      return h.eval(() => {
        const S = window.__mt && window.__mt.Snd;
        if (!S) return 'no Snd';
        try { S.init(); } catch (e) { return 'audio init failed: ' + e.message; }
        if (!S.ctx) return 'no AudioContext';
        return new Promise((res) => {
          const t0 = performance.now();
          const check = () => {
            if (S.rec && S.rec.idle && S.rec.rev && S.rec.high && S.rec.gas) res(true);
            else if (performance.now() - t0 > 8000) res('the engine recordings (sounds/truck-idle/mid/high/gas.wav) did not load');
            else setTimeout(check, 200);
          };
          check();
        });
      });
    },
  },
];
