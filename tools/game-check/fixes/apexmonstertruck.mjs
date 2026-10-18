// Owner's fix list for Apex Monster Truck (see README.md in this folder).
// Play tests: every game needs 5+ tests that play it by its rules.
// JOB J45 (2026-10-17): timing tests run in GAME time via window.__test.step(seconds)
// (NEWS 2026-10-17 - the robot's phone renders in slow motion, real-time waits lie).
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
  }
,
  {
    id: 'play-jump-airtime',
    ask: 'Truck with upward velocity gets air and lands with gravity',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step (game-time hook missing)';
        // judged in GAME time (factory rule): the old version waited on the wall
        // clock and timed out on the robot's slow phone even with good physics
        M.setState('play');
        M.T.y = 5; M.T.vy = 8; M.T.grounded = false;
        let peaked = false;
        for (let i = 0; i < 600; i++) {
          S.step(1 / 60);
          if (M.T.vy < 0) peaked = true;
          if (peaked && M.T.grounded) return true;
        }
        return 'truck did not complete jump arc';
      });
    },
  },

  {
    id: 'play-clean-screen',
    ask: "J45: during play only the game, score/timer and needed buttons - under 20 words, no keyboard words, ALL instructions behind a (?) How to play button closed by default (also held upright)",
    async test(page, h) {
      const count = () => h.eval(() => {
        const M = window.__mt; if (!M) return { err: 'no window.__mt' };
        M.startGame();
        if (window.__test && window.__test.step) window.__test.step(4);
        if (M.getState() !== 'play') return { err: 'not in play state: ' + M.getState() };
        const words = [];
        const walk = (el) => {
          for (const n of el.children) {
            const cs = getComputedStyle(n);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            const r = n.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (n.children.length === 0) { const t = (n.textContent || '').trim(); if (t) words.push(t); }
            else walk(n);
          }
        };
        walk(document.body);
        const text = words.join(' ');
        return {
          n: text.split(/\s+/).filter(w => /[A-Za-z]/.test(w)).length,
          text,
          kb: /(wasd|space|arrow|keyboard)/i.test(text),
          helpBtn: !!document.getElementById('helpBtn'),
          panelHidden: (() => { const p = document.getElementById('helpPanel'); return !p || getComputedStyle(p).display === 'none'; })(),
        };
      });
      let r = await count();
      if (r.err) return r.err;
      if (r.kb) return 'keyboard words on the play screen: ' + r.text;
      if (!r.helpBtn) return 'no (?) How to play button';
      if (!r.panelHidden) return 'help panel is open by default';
      if (r.n >= 20) return `play screen shows ${r.n} words (want under 20): ${r.text}`;
      const opened = await h.eval(() => {
        document.getElementById('helpBtn').click();
        const p = document.getElementById('helpPanel');
        const vis = !!p && getComputedStyle(p).display !== 'none';
        const words = p ? p.textContent.trim().split(/\s+/).filter(w => /[A-Za-z]/.test(w)).length : 0;
        document.getElementById('helpBtn').click();
        return { vis, words };
      });
      if (!opened.vis || opened.words < 10) return 'help button does not open an instructions panel';
      try { await page.setViewportSize({ width: 390, height: 844 }); } catch (e) { return 'could not set upright viewport: ' + e.message; }
      await h.wait(700);
      r = await count();
      try { await page.setViewportSize({ width: 844, height: 390 }); } catch (e) {}
      if (r.err) return 'upright: ' + r.err;
      if (r.kb) return 'upright: keyboard words on the play screen';
      if (r.n >= 20) return `upright play screen shows ${r.n} words (want under 20): ${r.text}`;
      return true;
    },
  },
  {
    id: 'play-real-sizes',
    ask: 'J45: truck at real Monster Jam size - 3.7m tall, 1.7m (66-inch) tires, 3.8m wide, next to 4.4m cars',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M || !M.measure) return 'no __mt.measure';
        const m = M.measure();
        if (Math.abs(m.height - 3.7) > 0.3) return `truck height ${m.height.toFixed(2)}m, want 3.7m`;
        if (Math.abs(m.tireD - 1.7) > 0.15) return `tire diameter ${m.tireD.toFixed(2)}m, want 1.7m (66in)`;
        if (Math.abs(m.width - 3.8) > 0.3) return `truck width ${m.width.toFixed(2)}m, want 3.8m`;
        const car = M.cars && M.cars[0];
        if (car && car.len && Math.abs(car.len - 4.4) > 0.3) return `car length ${car.len.toFixed(1)}m, want 4.4m`;
        return true;
      });
    },
  },
  {
    id: 'j5-sizes-real',
    ask: 'J45 sizes: cars are real size (4.4m) next to the real-size truck (3.7m tall, 1.7m tires)',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M || !M.measure) return 'no __mt.measure';
        const m = M.measure();
        if (Math.abs(m.height - 3.7) > 0.35) return `truck height ${m.height.toFixed(2)}m, want ~3.7m`;
        if (Math.abs(m.tireD - 1.7) > 0.2) return `tires ${m.tireD.toFixed(2)}m, want ~1.7m`;
        return true;
      });
    },
  },
  {
    id: 'play-truck-fills-screen',
    ask: 'J45 pic: the truck fills about a third of the screen height in the chase view',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        if (!M.screenFrac) return 'no __mt.screenFrac';
        M.startGame(); S.step(4);
        const f = M.screenFrac();
        if (!(f >= 0.28)) return `truck fills ${(f * 100).toFixed(0)}% of screen height, want about 33%`;
        if (f > 0.62) return `truck fills ${(f * 100).toFixed(0)}% - framing broken`;
        return true;
      });
    },
  },
  {
    id: 'j5-gravity-weight',
    ask: 'Real gravity: truck falls fast and lands with weight (dust + thud + shake) - judged in GAME time',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step (game-time hook missing)';
        M.startGame(); S.step(4);
        M.teleport(M.T.x, 6, M.T.z);
        let steps = 0;
        while (!M.T.grounded && steps < 600) { S.step(1 / 60); steps++; }
        if (!M.T.grounded) return 'truck never landed from 6m';
        if (steps > 120) return `truck floated: ${steps} steps to fall 6m (want < 120)`;
        S.step(0.3);   // let the chassis plunge: peak squash lands ~0.1s after first wheel touch
        const land = M.landing && M.landing();
        if (!land || !(land.maxSquash > 0.1)) return 'landing had no weight (no suspension squash recorded)';
        return true;
      });
    },
  },
  {
    id: 'play-crush-car',
    ask: 'J45: truck dropping onto a car crushes it FLAT and scores',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        const c = M.cars.find(x => !x.crushed);
        if (!c) return 'no uncrushed car';
        const score0 = M.score;
        M.teleport(c.x, 3, c.z);
        let n = 0;
        while (!c.crushed && n < 400) { S.step(1 / 60); n++; }
        if (!c.crushed) return 'car not crushed after truck dropped on it';
        if (!(c.hNow < 0.35)) return `car crushed but not flat: ${c.hNow.toFixed(2)}m tall (want < 0.35m)`;
        if (!(M.score > score0)) return 'crushing scored nothing';
        return true;
      });
    },
  },
  {
    id: 'play-top-speed',
    ask: 'J45: top speed about 70 mph (31 m/s) on flat dirt',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        M.teleport(-46, 0, 0, { hd: Math.PI / 2 });
        M.setInput({ gas: 1, steer: 0, boost: false });
        let max = 0;
        for (let i = 0; i < 44; i++) { S.step(0.25); max = Math.max(max, M.vel().speed); }
        M.setInput({ gas: 0, steer: 0, boost: false });
        if (max < 29 || max > 34.5) return `top speed ${max.toFixed(1)} m/s (${(max * 2.237).toFixed(0)} mph), want ~31 m/s (70 mph)`;
        return true;
      });
    },
  },
  {
    id: 'play-zero-to-sixty',
    ask: 'J45: 0-60 mph in about 4 seconds',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        M.teleport(-46, 0, 0, { hd: Math.PI / 2 });
        M.setInput({ gas: 1, steer: 0, boost: false });
        let t = 0;
        while (M.vel().speed < 26.8 && t < 8) { S.step(0.05); t += 0.05; }
        M.setInput({ gas: 0, steer: 0, boost: false });
        if (t >= 8) return 'never reached 60 mph';
        if (t > 4.5) return `0-60 mph took ${t.toFixed(1)}s (want about 4s)`;
        return true;
      });
    },
  },
  {
    id: 'play-boost-button',
    ask: 'J45: BOOST button exists and clearly boosts acceleration while held',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        if (!document.getElementById('btnBoost')) return 'no BOOST button';
        const run = (boost) => {
          M.startGame(); S.step(4);
          M.teleport(-46, 0, 0, { hd: Math.PI / 2 });
          M.setInput({ gas: 1, steer: 0, boost });
          let t = 0;
          while (M.vel().speed < 20 && t < 8) { S.step(0.05); t += 0.05; }
          M.setInput({ gas: 0, steer: 0, boost: false });
          return t;
        };
        const plain = run(false), boosted = run(true);
        if (boosted >= plain * 0.82) return `boost did not help: 0-20 m/s plain ${plain.toFixed(1)}s vs boost ${boosted.toFixed(1)}s`;
        return true;
      });
    },
  },
  {
    id: 'play-suspension-squash',
    ask: 'J45: long-travel suspension squashes on a hard landing and bounces back',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        M.teleport(0, 5, 0);
        let n = 0;
        while (!M.T.grounded && n < 400) { S.step(1 / 60); n++; }
        S.step(0.25);
        const L = M.landing && M.landing();
        if (!L) return 'no landing record';
        if (!(L.maxSquash > 0.25)) return `suspension only squashed ${L.maxSquash.toFixed(2)}m on a 5m drop (want > 0.25m)`;
        S.step(1.5);
        const w = M.wheels();
        const settled = Math.max(...w.map(x => x.travel));
        if (!(settled < L.maxSquash - 0.08)) return `suspension did not bounce back (settled travel ${settled.toFixed(2)}m vs squash ${L.maxSquash.toFixed(2)}m)`;
        return true;
      });
    },
  },
  {
    id: 'play-body-roll',
    ask: 'J45: body roll in turns (the truck leans like a real 5-ton truck)',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        M.teleport(-30, 0, 0, { hd: Math.PI / 2 });
        M.setInput({ gas: 1, steer: 0, boost: false });
        let n = 0;
        while (M.vel().speed < 14 && n++ < 200) S.step(0.05);
        M.setInput({ gas: 0.6, steer: 1, boost: false });
        let maxRoll = 0;
        for (let i = 0; i < 24; i++) { S.step(0.05); maxRoll = Math.max(maxRoll, Math.abs(M.attitude().roll)); }
        M.setInput({ gas: 0, steer: 0, boost: false });
        if (!(maxRoll > 0.07)) return `body roll only ${(maxRoll * 57.3).toFixed(1)} degrees in a hard turn (want > 4)`;
        return true;
      });
    },
  },
  {
    id: 'play-wheelie',
    ask: 'J45: wheelie on hard throttle from a standstill',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        M.teleport(0, 0, 0, { hd: Math.PI / 2 });
        M.setInput({ gas: 1, steer: 0, boost: false });
        let maxPitch = 0;
        for (let i = 0; i < 30; i++) { S.step(0.05); maxPitch = Math.max(maxPitch, M.attitude().pitch); }
        M.setInput({ gas: 0, steer: 0, boost: false });
        if (!(maxPitch > 0.17)) return `no wheelie: nose rose only ${(maxPitch * 57.3).toFixed(1)} degrees (want > 10)`;
        return true;
      });
    },
  },
  {
    id: 'play-air-flip',
    ask: 'J45: the stick flips the truck in the air (front/back flips)',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        M.teleport(0, 12, 0, { hd: Math.PI / 2 });
        M.setInput({ gas: 0, steer: 0, boost: false, airPitch: 1, airRoll: 0 });
        let total = 0, last = M.attitude().pitchRaw, n = 0;
        while (!M.T.grounded && n++ < 240) {
          S.step(1 / 60);
          const p = M.attitude().pitchRaw;
          let d = p - last;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          total += Math.abs(d); last = p;
        }
        M.setInput({ gas: 0, steer: 0, boost: false, airPitch: 0, airRoll: 0 });
        if (!(total > 2.1)) return `stick only rotated the truck ${(total * 57.3).toFixed(0)} degrees in the air (want > 120)`;
        return true;
      });
    },
  },
  {
    id: 'play-dirt-slide',
    ask: 'J45: the truck slides on dirt in a hard turn at speed',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        M.teleport(-30, 0, 0, { hd: Math.PI / 2 });
        M.setInput({ gas: 1, steer: 0, boost: false });
        let n = 0;
        while (M.vel().speed < 19 && n++ < 240) S.step(0.05);
        M.setInput({ gas: 0.7, steer: 1, boost: false });
        let maxDrift = 0;
        for (let i = 0; i < 16; i++) {
          S.step(0.05);
          const v = M.vel();
          if (v.speed > 8) {
            const vAng = Math.atan2(v.x, v.z);
            let d = Math.abs(vAng - M.T.hd);
            while (d > Math.PI) d = 2 * Math.PI - d;
            maxDrift = Math.max(maxDrift, d);
          }
        }
        M.setInput({ gas: 0, steer: 0, boost: false });
        if (!(maxDrift > 0.21)) return `no dirt slide: drift angle peaked at ${(maxDrift * 57.3).toFixed(0)} degrees (want > 12)`;
        return true;
      });
    },
  },
  {
    id: 'play-flip-back',
    ask: 'J45: after a rollover a FLIP BACK button appears and rights the truck',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        M.flip();
        S.step(1.0);
        if (!M.rolled()) return 'truck did not register as rolled over';
        const btn = document.getElementById('btnFlip');
        if (!btn || getComputedStyle(btn).display === 'none') return 'FLIP BACK button did not appear after the rollover';
        btn.click();
        S.step(1.5);
        if (!(M.attitude().upY > 0.7)) return 'flip-back did not right the truck';
        return true;
      });
    },
  },
  {
    id: 'play-arena-spec',
    ask: 'J45: huge stadium at the venues/truck-arena.md spec - 110x50m floor, 3-tier bowl close on all 4 sides, 40k+ fans, 6+ jumps, crush lines, screens, catch fence, night',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M || !M.arena) return 'no __mt.arena';
        const a = M.arena();
        if (!(a.fans >= 40000)) return `only ${a.fans} fans (want 40,000-60,000)`;
        if (!(a.jumps >= 6)) return `only ${a.jumps} jumps (want 6+)`;
        if (!(a.cars >= 8)) return `only ${a.cars} crush cars (want 8+)`;
        if (Math.abs(a.floorL - 110) > 3 || Math.abs(a.floorW - 50) > 3) return `floor is ${a.floorL}x${a.floorW}m (want 110x50)`;
        if (!(a.screens >= 2)) return 'giant screens missing at the ends';
        if (!a.fence) return 'no catch fence';
        if (!(a.bowlGap <= 30)) return `stands are ${a.bowlGap}m from the floor - open land (want the stadium close)`;
        if (!a.night) return 'not a night stadium';
        return true;
      });
    },
  },
  {
    id: 'play-crowd-stands',
    ask: 'J45: the crowd stands up on big air',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        const before = M.crowd();
        M.teleport(0, 12, 0);
        let n = 0;
        while (!M.T.grounded && n < 400) { S.step(1 / 60); n++; }
        S.step(0.5);
        const after = M.crowd();
        if (!(after > 0.5)) return `crowd did not stand for big air (excitement ${after.toFixed(2)})`;
        if (!(after > before)) return 'crowd excitement did not rise';
        return true;
      });
    },
  },
  {
    id: 'play-pyro-fires',
    ask: 'J45: pyro fires on big air',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        M.startGame(); S.step(4);
        const before = M.pyro();
        M.teleport(0, 12, 0);
        let n = 0;
        while (!M.T.grounded && n < 400) { S.step(1 / 60); n++; }
        S.step(0.5);
        if (!(M.pyro() > before)) return 'no pyro fired for the big air';
        return true;
      });
    },
  },
  {
    id: 'play-friend-code',
    ask: "Friend codes: a 'Play a friend' button - my code works, a friend's code brings their rival truck + target score",
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt;
        if (!M || !M.friend) return 'no friend codes';
        if (!document.getElementById('friendBtn')) return "no 'Play a friend' button";
        try { localStorage.setItem('apexmt_best', '1234'); } catch (e) {}
        const code = M.friend.make();
        if (!code || code.length < 6) return 'my friend code was not generated';
        if (M.friend.apply('not-a-code')) return 'a junk code was accepted';
        if (!M.friend.apply(code)) return 'a valid friend code was rejected';
        const r = M.friend.rival();
        if (!r || !r.name) return 'no rival arrived from the friend code';
        if (r.target !== 1234) return `rival target is ${r.target}, want the friend's best 1234`;
        return true;
      });
    },
  },
  {
    id: 'play-career-rally-events',
    ask: 'Rally career: every event starts, plays to its goal through the real counters, and unlocks the next',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__mt, S = window.__test;
        if (!M || !S || !S.step) return 'no __test.step';
        const R = M.rally;
        if (!R) return 'no rally career mode';
        if (R.state().events !== 3) return 'rally does not have 3 events';
        for (let e = 0; e < 3; e++) {
          if (!R.start(e)) return `rally event ${e} is locked or would not start`;
          S.step(4);
          if (M.getState() !== 'play') return `rally event ${e} never reached play`;
          let guard = 0;
          while (!R.state().done[e] && guard++ < 80) {
            const st = R.state();
            if (st.type === 'crush') {
              const c = M.cars.find(x => !x.crushed);
              if (!c) { S.step(2); continue; }
              M.teleport(c.x, 3, c.z); S.step(1.0);
            } else if (st.type === 'jump') {
              M.teleport(0, 12, 0); S.step(2.4);
            } else {
              const c = M.cars.find(x => !x.crushed);
              if (c) { M.teleport(c.x, 8, c.z); S.step(1.8); } else S.step(2);
            }
          }
          if (!R.state().done[e]) return `rally event ${e} (${R.state().type}) could not be finished`;
          if (e < 2 && !(R.state().unlocked > e + 1)) return `rally event ${e + 1} did not unlock`;
        }
        if (!R.state().complete) return 'rally not marked complete after the finale';
        return true;
      });
    },
  },
  {
    id: 'dev-skip-rally-event',
    ask: "DEV-ONLY Skip (STORE-READY): with dev=1 a rally event can be skipped like a win and it saves; it must NEVER show without dev=1",
    async test(page, h) {
      let r = await h.eval(() => {
        const M = window.__mt;
        if (!M || !M.rally) return 'no rally mode';
        M.rally.start(0);
        if (window.__test) window.__test.step(4);
        const b = document.getElementById('btnSkip');
        return (b && getComputedStyle(b).display !== 'none') ? 'skip button visible WITHOUT dev=1' : true;
      });
      if (r !== true) return r;
      const url = page.url().split('?')[0] + '?dev=1';
      await page.goto(url, { waitUntil: 'load' });
      await h.wait(1500);
      r = await h.eval(() => {
        const M = window.__mt;
        if (!M || !M.rally) return 'no rally mode after reload';
        M.rally.start(0);
        if (window.__test) window.__test.step(4);
        const b = document.getElementById('btnSkip');
        if (!b || getComputedStyle(b).display === 'none') return 'skip button did not show with dev=1';
        b.click();
        if (!M.rally.state().done[0]) return 'skip did not complete the rally event';
        let saved = null;
        try { saved = localStorage.getItem('apexmt_rally'); } catch (e) {}
        if (!saved) return 'skip did not save rally progress';
        return true;
      });
      return r;
    },
  },
];
