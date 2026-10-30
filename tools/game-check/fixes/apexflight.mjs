// Owner's fix list for Apex Flight (JOB J9, 2026-10-18). See README.md in this folder.
// The owner's words: "Gameplay picture frozen for 1.5 seconds."
// Tests drive the game through the page; each h.eval function is self-contained.
export default [
  {
    id: 'not-frozen-on-start',
    ask: 'Gameplay picture frozen for 1.5 seconds',
    async test(page, h) {
      // Start the game, throttle up through the real lever, then verify the
      // picture changes over 1.5s (plane moves). Takeoff is manual since the
      // lever replaced buttons (G-280 gone, lever live): a parked jet at 0%
      // throttle moves nothing, so pressing start alone can never prove the
      // picture moves - the old test measured a parked jet, not a frozen game.
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(500);
      const engaged = await h.eval(() => document.getElementById('startOv').hidden);
      if (!engaged) return 'menu did not engage after FREE FLIGHT press (test setup, not the game)';
      const lever = await h.eval(() => {
        const lev = document.getElementById('thrLever');
        if (!lev) return 'no throttle lever on the page';
        const r = lev.getBoundingClientRect();
        if (r.width < 44 || r.height < 100) return 'throttle lever too small to drag';
        const yFor = (pct) => r.top + (1 - pct) * r.height;
        lev.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 13, clientY: yFor(1), bubbles: true }));
        lev.dispatchEvent(new PointerEvent('pointermove', { pointerId: 13, clientY: yFor(1), bubbles: true }));
        lev.dispatchEvent(new PointerEvent('pointerup', { pointerId: 13, clientY: yFor(1), bubbles: true }));
        return true;
      });
      if (lever !== true) return lever;
      await h.wait(1000);
      const a = await h.shot();
      await h.wait(1500);
      const b = await h.shot();
      const changed = h.changed(a, b);
      if (changed < 0.01) return 'gameplay picture did not change over 1.5s (frozen)';
      return true;
    },
  },
  {
    id: 'menu-apex-look',
    ask: 'Menu has the old green "computer screen" look',
    async test(page, h) {
      return h.eval(() => {
        const out = [];
        // check for monospace fonts (typewriter look)
        const all = document.querySelectorAll('*');
        let mono = 0, total = 0;
        for (const el of all) {
          const fs = getComputedStyle(el).fontFamily;
          if (fs) { total++; if (/monospace/i.test(fs)) mono++; }
          if (total > 200) break;
        }
        if (total > 0 && mono / total > 0.5) out.push(Math.round(mono/total*100) + '% monospace fonts');
        // check menu text for green-dominant colors (the old "computer screen" look):
        // any .panel text whose computed color has green > red and green > blue
        const els = document.querySelectorAll('.panel, .panel *');
        let green = 0;
        for (const el of els) {
          const m = getComputedStyle(el).color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (m) {
            const r = +m[1], g = +m[2], b = +m[3];
            if (g > r && g > b) green++;
          }
        }
        if (green > 0) out.push(green + ' menu text elements are green-dominant');
        return out.length ? out.join('; ') : true;
      });
    },
  },
  {
    id: 'play-no-easy-stall',
    ask: 'The plane stalls too easily when flying around - normal flying should be forgiving, stall only when you really pull up too slow',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // put the plane airborne, slow (18 m/s, under the stall speed), normal
        // level flying. Slow flight means THROTTLE BACK (0.1): left at full
        // throttle the engine (3.2 m/s^2) accelerates the plane past the
        // 20 m/s stall speed in ~0.65 s, before the pull-up even starts -
        // that race is why this test failed on main while passing on branches.
        F.P.pos.set(0, 60, 0); F.P.vel.set(0, 0, 18); F.P.ground = false;
        F.P.pitch = 0; F.P.thr = 0.1; F.inp.pitchUp = 0;
        return new Promise((res) => {
          setTimeout(() => {
            if (F.stallNow) return res('stalled during normal level flying at 18 m/s (too easy)');
            // now really pull up at the same slow speed: hold the real key
            // (pollKeys reads keys[] every frame and resets inp.pitchUp to 0
            // when nothing is held, so setting inp directly does not stick)
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            const t0 = Date.now();
            const iv = setInterval(() => {
              if (F.stallNow) {
                clearInterval(iv);
                F.P.thr = 1;
                window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
                return res(true);
              }
              if (Date.now() - t0 > 3000) {
                clearInterval(iv);
                F.P.thr = 1;
                window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
                return res('no stall when really pulling up slow (too forgiving)');
              }
            }, 200);
          }, 700);
        });
      });
    },
  },
  {
    id: 'play-takeoff',
    ask: 'take off is manual: full throttle with no stick stays on the ground past rotate speed, and pulling the stick up lifts it off (owner: the plane must never lift by itself) - judged in GAME seconds (window.__reality.time()), not robot wall-clock',
    async test(page, h) {
      // Same shared-page prelude as before: get the plane back on the runway first.
      const st = await h.eval(() => ({
        menu: !document.getElementById('startOv').hidden,
        crashed: !document.getElementById('crashOv').hidden,
        ground: !!(window.__flight && window.__flight.P.ground),
      })).catch(() => null);
      if (!st) return 'no window.__flight hook';
      // Fresh page or reload lands on the menu with the plane already parked
      // (ground true) - the menu must still start free flight, or the test
      // would sit in the menu forever watching a parked plane.
      let freshStart = false;
      if (st.menu) {
        if (!(await h.press('#btnFree'))) return 'could not press FREE FLIGHT';
        freshStart = true;
      } else if (!st.ground) {
        try {
          if (st.crashed) await h.press('#crashOv');
          else await h.press('#resetBtn');
        } catch (e) {}
      }
      if (freshStart) {
        await h.wait(400);
        // A fresh start must hand the player an idle plane, not full throttle.
        const thr0 = await h.eval(() => window.__flight ? window.__flight.P.thr : null).catch(() => null);
        if (thr0 !== null && thr0 > 0.01) return 'takeoff starts at full throttle - the player never spools up (thr ' + thr0.toFixed(2) + ')';
      }
      // The roll is stepped by hand with the game's own physics (window.__test.simStep, 1/60 game-s per step), so a slow robot
      // renderer cannot stretch it: every number below is in GAME seconds read from window.__reality.time().
      return h.eval(() => {
        const F = window.__flight, T = window.__test, R = window.__reality;
        if (!F || !T || !T.simStart || !R || !R.time) return 'no window.__flight / __test / __reality.time() hook';
        const frames = (n) => new Promise((ok) => { let k = 0; const t = setTimeout(ok, 1500); const f = () => { if (++k >= n) { clearTimeout(t); ok(); } else requestAnimationFrame(f); }; requestAnimationFrame(f); });
        return (async () => {
          const DT = 1 / 60;
          T.simStart('free');
          try {
            // Stage the roll exactly like a fresh free flight, then spool up by hand.
            F.P.pos.set(0, F.jet.gearHeight, -600); F.P.vel.set(0, 0, 0); F.P.yaw = 0; F.P.pitch = 0; F.P.roll = 0; F.P.ground = true;
            F.P.thr = 1; F.jetInput.throttle = 1;   // holding full throttle, like the player would
            const t0 = R.time(); let n = 0, tRot = -1;
            while (R.time() - t0 < 15) {            // 15 s: the old test's own limit, now in game time
              const ok = T.simStep(DT); n++;
              const v = Math.hypot(F.P.vel.x, F.P.vel.z);
              if (!ok) return 'plane crashed on the take-off roll after ' + (R.time() - t0).toFixed(1) + ' game-s (' + F.P.pos.y.toFixed(1) + ' m)';
              if (F.P.ground === false) return 'plane lifted off with no stick input at ' + v.toFixed(1) + ' m/s after ' + (R.time() - t0).toFixed(1) + ' game-s - takeoff is not manual';
              if (v >= 25) { tRot = R.time() - t0; break; }
            }
            if (Math.abs((R.time() - t0) - n * DT) > 0.01) return 'game clock did not follow the physics steps (' + (R.time() - t0).toFixed(3) + ' game-s for ' + n + ' steps)';
            if (tRot < 0) return 'plane never reached rotate speed at full throttle in 15 game-s (v ' + Math.hypot(F.P.vel.x, F.P.vel.z).toFixed(1) + ' m/s, hook speed ' + R.speed().toFixed(1) + ')';
            // Past rotate speed with full throttle and no stick, still on the ground: that is the proof. Now pull the stick up like the player would
            // (a real key press; two real frames let the game's own key reader set the stick before the stepping resumes).
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            await frames(3);
            try {
              const t1 = R.time(); let lifted = -1;
              while (R.time() - t1 < 10) {            // 10 s: the old test's own limit
                F.P.thr = 1; F.jetInput.throttle = 1;
                const ok = T.simStep(DT);
                if (!ok) return 'plane crashed after the stick was pulled: ' + document.getElementById('crashWhy').textContent;
                if (F.P.ground === false && F.P.pos.y > F.jet.gearHeight + 2) { lifted = R.time() - t1; break; }
              }
              if (lifted < 0) return 'stick up at rotate speed did not lift the plane off in 10 game-s (y ' + F.P.pos.y.toFixed(1) + ', v ' + F.P.vel.length().toFixed(1) + ')';
              window.__takeoffGameTimes = { rotateSpeedAt: +tRot.toFixed(2), liftOffAfterStick: +lifted.toFixed(2) };
              return true;
            } finally { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }
          } finally { T.simEnd(); }
        })();
      }).catch((e) => ({ inconclusive: 'the page navigated away or closed during the test - robot side: ' + String(e && e.message).split('\n')[0].slice(0, 100) }));
    },
  },
  {
    id: 'play-throttle-lever',
    ask: 'throttle is a visible lever, not buttons: dragging the THR lever sets the throttle, the old THR buttons are hidden, and the lever overlaps no pad button (owner 2026-10-25)',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(500);
      return h.eval(() => {
        const F = window.__flight;
        if (!F || !F.jetInput) return 'no flight/jetInput hook';
        const lev = document.getElementById('thrLever');
        if (!lev) return 'no throttle lever on the page';
        const cs = getComputedStyle(lev);
        if (cs.display === 'none' || cs.visibility === 'hidden') return 'throttle lever is not visible';
        const r = lev.getBoundingClientRect();
        if (r.width < 44 || r.height < 100) return 'throttle lever is only ' + Math.round(r.width) + 'x' + Math.round(r.height) + 'px (want >= 44 wide, >= 100 tall)';
        if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) return 'throttle lever sits off the phone screen';
        // The old THR buttons must be gone from the player's view (they stay in
        // the DOM for the robot's checks, but hidden - visibility keeps the pad layout).
        for (const id of ['jThrUp', 'jThrDn']) {
          const b = document.getElementById(id);
          if (!b) return 'pad button #' + id + ' is missing from the DOM';
          if (getComputedStyle(b).visibility !== 'hidden') return 'pad button #' + id + ' is still visible - throttle must be a lever, not buttons';
        }
        // The lever must overlap no pad button (G-280: the old slider covered GEAR/PAINT/LOOP).
        const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        for (const id of ['jBoost', 'jYawL', 'jYawR', 'jGear', 'jCam', 'jStyle', 'jPaint', 'jBrake', 'jRoll', 'jLoop', 'jImm', 'jSplit']) {
          const b = document.getElementById(id);
          if (b && hit(r, b.getBoundingClientRect())) return 'throttle lever overlaps pad button #' + id;
        }
        // Drag the lever: down near the top must raise the throttle, down near
        // the bottom must lower it, and letting go must hold the value.
        const P = F.P, J = F.jetInput;
        const yFor = (pct) => r.top + (1 - pct) * r.height;
        const drag = (pct) => {
          lev.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 13, clientY: yFor(pct), bubbles: true }));
          lev.dispatchEvent(new PointerEvent('pointermove', { pointerId: 13, clientY: yFor(pct), bubbles: true }));
          lev.dispatchEvent(new PointerEvent('pointerup', { pointerId: 13, clientY: yFor(pct), bubbles: true }));
        };
        P.thr = 0.2; J.throttle = 0.2;
        drag(0.8);
        if (Math.abs(P.thr - 0.8) > 0.12) return 'dragging the lever to 80% gave throttle ' + P.thr.toFixed(2) + ' (want ~0.80)';
        drag(0.3);
        if (Math.abs(P.thr - 0.3) > 0.12) return 'dragging the lever to 30% gave throttle ' + P.thr.toFixed(2) + ' (want ~0.30)';
        if (Math.abs(J.throttle - P.thr) > 0.02) return 'pad throttle (' + J.throttle.toFixed(2) + ') disagrees with the game throttle (' + P.thr.toFixed(2) + ') after a lever drag';
        return true;
      });
    },
  },
  {
    id: 'play-climb-and-fly',
    ask: 'climb and fly: stick up gains altitude and the plane keeps flying (5 game-seconds, judged on window.__reality.time())',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight, T = window.__test, R = window.__reality;
        if (!F || !T || !T.simStart || !R || !R.time) return 'no window.__flight / __test / __reality.time() hook';
        const frames = (n) => new Promise((ok) => { let k = 0; const t = setTimeout(ok, 1500); const f = () => { if (++k >= n) { clearTimeout(t); ok(); } else requestAnimationFrame(f); }; requestAnimationFrame(f); });
        return (async () => {
          const DT = 1 / 60;
          T.simStart('free');
          try {
            F.P.pos.set(0, 120, 0); F.P.vel.set(0, 0, 35); F.P.ground = false;
            F.P.pitch = 0; F.P.roll = 0; F.P.yaw = 0;
            const y0 = F.P.pos.y, x0 = F.P.pos.x, z0 = F.P.pos.z, yaw0 = F.P.yaw;
            // A real key press (the game's own key reader), then game-time stepping with the physics by hand.
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            await frames(3);
            try {
              const t0 = R.time(); let n = 0, ok = true;
              while (R.time() - t0 < 5) { ok = T.simStep(DT); n++; if (!ok) break; }
              const gs = R.time() - t0;
              if (Math.abs(gs - n * DT) > 0.01) return 'game clock did not follow the physics steps (' + gs.toFixed(3) + ' game-s for ' + n + ' steps)';
              if (!ok) return 'plane crashed during the climb after ' + gs.toFixed(1) + ' game-s: ' + document.getElementById('crashWhy').textContent;
              const gain = F.P.pos.y - y0, dYaw = Math.abs(F.P.yaw - yaw0);
              const dist = Math.hypot(F.P.pos.x - x0, F.P.pos.z - z0);
              if (dist < 100) return `plane barely moved (${dist.toFixed(0)} m in ${gs.toFixed(1)} game-s)`;
              if (gain < 8) return `stick up gained only ${gain.toFixed(1)} m in ${gs.toFixed(1)} game-s (want > 8 m)`;
              return true;
            } finally { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }
          } finally { T.simEnd(); }
        })();
      }).catch((e) => ({ inconclusive: 'the page navigated away or closed during the test - robot side: ' + String(e && e.message).split('\n')[0].slice(0, 100) }));
    },
  },
  {
    id: 'play-turn',
    ask: 'turn: holding right banks the plane and changes heading (4 game-seconds, judged on window.__reality.time())',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight, T = window.__test, R = window.__reality;
        if (!F || !T || !T.simStart || !R || !R.time) return 'no window.__flight / __test / __reality.time() hook';
        const frames = (n) => new Promise((ok) => { let k = 0; const t = setTimeout(ok, 1500); const f = () => { if (++k >= n) { clearTimeout(t); ok(); } else requestAnimationFrame(f); }; requestAnimationFrame(f); });
        return (async () => {
          const DT = 1 / 60;
          T.simStart('free');
          try {
            F.P.pos.set(0, 120, 0); F.P.vel.set(0, 0, 35); F.P.ground = false;
            F.P.pitch = 0; F.P.roll = 0; F.P.yaw = 0;
            const y0 = F.P.pos.y, x0 = F.P.pos.x, z0 = F.P.pos.z, yaw0 = F.P.yaw;
            // A real key press (the game's own key reader), then game-time stepping with the physics by hand.
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
            await frames(3);
            try {
              const t0 = R.time(); let n = 0, ok = true;
              while (R.time() - t0 < 4) { ok = T.simStep(DT); n++; if (!ok) break; }
              const gs = R.time() - t0;
              if (Math.abs(gs - n * DT) > 0.01) return 'game clock did not follow the physics steps (' + gs.toFixed(3) + ' game-s for ' + n + ' steps)';
              if (!ok) return 'plane crashed during the turn after ' + gs.toFixed(1) + ' game-s: ' + document.getElementById('crashWhy').textContent;
              const gain = F.P.pos.y - y0, dYaw = Math.abs(F.P.yaw - yaw0);
              const dist = Math.hypot(F.P.pos.x - x0, F.P.pos.z - z0);
              if (dYaw < 0.3) return `heading changed only ${dYaw.toFixed(2)} rad in ${gs.toFixed(1)} game-s (want > 0.3)`;
              return true;
            } finally { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' })); }
          } finally { T.simEnd(); }
        })();
      }).catch((e) => ({ inconclusive: 'the page navigated away or closed during the test - robot side: ' + String(e && e.message).split('\n')[0].slice(0, 100) }));
    },
  },
  {
    id: 'play-land-on-runway',
    ask: 'land on the runway: a gentle approach touches down without crashing',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      // the shared page can leave the plane crashed - reset first, then set up
      const crashed = await h.eval(() => !document.getElementById('crashOv').hidden).catch(() => false);
      if (crashed) { try { await h.press('#crashOv'); await h.wait(600); } catch (e) {} }
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // short final: 22 m up, 350 m short of the runway centre, flying at it
        F.P.pos.set(0, 22, -350); F.P.vel.set(0, -1, 30); F.P.ground = false;
        F.P.pitch = -0.1; F.P.roll = 0; F.P.yaw = 0; F.P.thr = 0.35; F.inp.pitchUp = 0;
        return new Promise((res) => {
          const t0 = Date.now();
          const iv = setInterval(() => {
            // fly the descent like a pilot: hold ~-1.8 m/s sink with pitch
            // (pitch is game state, not input - pollKeys never resets it),
            // easing off near the ground so the touchdown is gentle
            const low = F.P.pos.y < 8;
            const target = low ? -1.2 : -1.8;
            const vs = F.P.vel.y;
            if (vs < target - 0.5) F.P.pitch = Math.min(F.P.pitch + 0.03, 0.1);
            else if (vs > target + 0.5) F.P.pitch = Math.max(F.P.pitch - 0.03, low ? -0.2 : -0.3);
            if (document.getElementById('crashOv').hidden === false) {
              clearInterval(iv);
              return res('plane crashed instead of landing');
            }
            if (F.P.ground === true) {
              clearInterval(iv);
              const onRwy = Math.abs(F.P.pos.x) <= 14 && F.P.pos.z > -700 && F.P.pos.z < 700;
              return res(onRwy ? true : `touched down off the runway (x=${F.P.pos.x.toFixed(1)}, z=${F.P.pos.z.toFixed(1)})`);
            }
            if (Date.now() - t0 > 20000) {
              clearInterval(iv);
              return res('never touched down after 20s of approach');
            }
          }, 200);
        });
      });
    },
  },
  {
    id: 'play-crash',
    ask: 'crash: a hard nose-down impact ends the flight with the crash screen',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        F.P.pos.set(0, 30, 0); F.P.vel.set(0, -20, 15); F.P.ground = false;
        F.P.pitch = -0.5; F.P.roll = 0; F.inp.pitchUp = 0;
        return new Promise((res) => {
          const t0 = Date.now();
          const iv = setInterval(() => {
            if (document.getElementById('crashOv').hidden === false) {
              clearInterval(iv);
              return res(true);
            }
            if (Date.now() - t0 > 15000) {
              clearInterval(iv);
              return res('hard impact did not crash the plane');
            }
          }, 300);
        });
      });
    },
  },
  {
    id: 'play-friend-code',
    ask: 'Play a friend with a friend code (My code / Enter code)',
    async test(page, h) {
      return h.eval(() => {
        const F = window.__flight;
        if (!F || !F.friend) return 'no friend hooks (friend codes not implemented)';
        const b = document.getElementById('friendBtn');
        if (!b) return 'no friendBtn on menu';
        const ov = document.getElementById('friendOv');
        if (!ov) return 'no friendOv overlay';
        const code = F.friend.code();
        if (typeof code !== 'string' || !code.startsWith('FLAPEX-')) return `bad my-code: ${String(code).slice(0, 20)}`;
        if (!F.friend.set(code)) return 'could not set my own code';
        if (!F.friend.active()) return 'friend match not active after set';
        if (typeof F.friend.strength() !== 'number') return 'no friend strength';
        if (F.friend.set('NOT-A-CODE')) return 'bad code accepted';
        F.friend.clear();
        if (F.friend.active()) return 'friend match not cleared';
        return true;
      });
    },
  },
  {
    id: 'play-descend-at-speed',
    ask: 'Play every Flight mode start to finish like a real pilot: at cruise speed, full nose-down must make the plane DESCEND - it climbed instead, so you could not come down to land',
    async test(page, h) {
      // Same shared-page reset as play-takeoff: menu FREE FLIGHT, crash tap, or HUD RESET.
      const st = await h.eval(() => ({
        menu: !document.getElementById('startOv').hidden,
        crashed: !document.getElementById('crashOv').hidden,
        ground: !!(window.__flight && window.__flight.P.ground),
      })).catch(() => null);
      if (!st) return 'no window.__flight hook';
      if (!st.ground) {
        try {
          if (st.menu) await h.press('#btnFree');
          else if (st.crashed) await h.press('#crashOv');
          else await h.press('#resetBtn');
        } catch (e) {}
      }
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // Put the plane in a fast cruise: 800 m up, 80 m/s, half throttle.
        F.P.pos.set(0, 800, 0); F.P.vel.set(0, 0, 80);
        F.P.pitch = 0; F.P.roll = 0; F.P.yaw = 0; F.P.ground = false; F.P.thr = 0.4;
        const y0 = F.P.pos.y;
        let minVy = 0;
        // Hold FULL nose-down with the real key, like a pilot pushing the stick.
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        return new Promise((res) => {
          const t0 = Date.now();
          const iv = setInterval(() => {
            minVy = Math.min(minVy, F.P.vel.y);
            const dropped = y0 - F.P.pos.y;
            if (!document.getElementById('crashOv').hidden) {
              clearInterval(iv);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
              res('plane crashed during a cruise descent');
            } else if (minVy < -2.5 && dropped > 30) {
              clearInterval(iv);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
              res(true);
            } else if (Date.now() - t0 > 12000) {
              clearInterval(iv);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
              res('full nose-down at cruise speed did not descend: min vertical speed ' +
                minVy.toFixed(1) + ' m/s, altitude change ' + (-dropped).toFixed(0) + ' m in 12 s');
            }
          }, 250);
        });
      });
    },
  },
  {
    id: 'tester-challenge-offrunway-feedback',
    ask: 'Landing challenge: touching down OFF the runway must tell the player why there is no score (today: silence)',
    async test(page, h) {
      // G-263 round 1: reload to a known menu first - on the shared page an
      // earlier test's flight hides the menu for good, so #btnChal can never be
      // pressed again and the test silently runs in the wrong mode
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnChal');
      } catch (e) {}
      await h.wait(400);
      const crashed = await h.eval(() => !document.getElementById('crashOv').hidden).catch(() => false);
      if (crashed) { try { await h.press('#crashOv'); await h.wait(600); } catch (e) {} }
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // G-263 round 1: judge in game time, not the robot's wall clock - the
        // gentle descent takes ~10 game-s, which is over 25 wall-s on a slow runner
        let gt = 0, last = performance.now();
        const tick = (t) => { gt += Math.min(0.05, (t - last) / 1000); last = t; if (gt < 120) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        // short final 30 m right of the centreline: a gentle touchdown in the grass
        F.P.pos.set(30, 18, -350); F.P.vel.set(0, -1.8, 30);
        F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.08; F.P.thr = 0.3; F.P.ground = false;
        return new Promise((res) => {
          const iv = setInterval(() => {
            const vs = F.P.vel.y;
            if (vs < -2.3) F.P.pitch = Math.min(F.P.pitch + 0.03, 0.1);
            else if (vs > -1.3) F.P.pitch = Math.max(F.P.pitch - 0.03, -0.3);
            if (document.getElementById('crashOv').hidden === false) {
              clearInterval(iv);
              return res('plane crashed instead of landing gently in the grass');
            }
            if (F.P.ground === true) {
              clearInterval(iv);
              if (!document.getElementById('scoreOv').hidden) return res('off-runway touchdown scored (it should not)');
              const msg = document.getElementById('msg').textContent || '';
              if (/off|runway|grass|no score/i.test(msg)) return res(true);
              return res('off-runway touchdown shows no message explaining why there is no score');
            }
            if (gt > 30) { clearInterval(iv); return res('never touched down (30 game-s)'); }
          }, 200);
        });
      });
    },
  },
  {
    id: 'tester-postscore-crash',
    ask: 'After a scored landing, flying into the ocean must still crash the plane (today: nothing happens)',
    async test(page, h) {
      // G-263 round 1: reload to a known menu first - on the shared page an
      // earlier test's flight hides the menu for good, so #btnChal can never be
      // pressed again and the test silently runs in the wrong mode
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnChal');
      } catch (e) {}
      await h.wait(400);
      const crashed = await h.eval(() => !document.getElementById('crashOv').hidden).catch(() => false);
      if (crashed) { try { await h.press('#crashOv'); await h.wait(600); } catch (e) {} }
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // G-263 round 1: game time, not the wall clock (see the off-runway test
        // above) - the gentle landing takes ~13 game-s, over 20 wall-s when slow
        let gt = 0, last = performance.now();
        const tick = (t) => { gt += Math.min(0.05, (t - last) / 1000); last = t; if (gt < 120) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        // score a gentle on-runway landing first. VP Oct 27 2026 (known fault 'ocean ... took over', expires Oct 29): from
        // (1, 8, -300) the touchdown alone took 11 game-s = 220 frames, about 33 s on a normal robot (150 ms frames) - over the
        // robot's 30 s cap before the ocean part even began. Same profile started lower and closer, like never-g-243-p2:
        // touchdown in ~3-4 game-s (local run: (1,3,-60) scored at 2.3 game-s, ocean crash at 3.2).
        F.P.pos.set(1, 3, -120); F.P.vel.set(0, -0.6, 30);
        F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.02; F.P.thr = 0.12; F.P.ground = false;
        return new Promise((res) => {
          let phase2 = false, phase2Gt = 0;
          const iv = setInterval(() => {
            if (!phase2) {
              const vs = F.P.vel.y;
              if (vs < -0.8) F.P.pitch = Math.min(F.P.pitch + 0.015, 0.1);
              else if (vs > -0.4) F.P.pitch = Math.max(F.P.pitch - 0.015, -0.25);
              if (document.getElementById('scoreOv').hidden === false) {
                phase2 = true; phase2Gt = gt;
                // scored: now fly west into the ocean from close by
                F.P.pos.set(-9900, 500, 0); F.P.vel.set(-60, 0, 0);
                F.P.yaw = -Math.PI / 2; F.P.pitch = 0; F.P.roll = 0; F.P.ground = false; F.P.thr = 0.6;
              } else if (document.getElementById('crashOv').hidden === false) {
                clearInterval(iv);
                return res('plane crashed before the scored landing');
              } else if (gt > 30) {
                clearInterval(iv);
                return res('never scored a landing (30 game-s)');
              }
            } else {
              if (document.getElementById('crashOv').hidden === false) {
                clearInterval(iv);
                const why = document.getElementById('crashWhy').textContent || '';
                return res(/ocean/i.test(why) ? true : 'crashed after scoring but not for the ocean: ' + why);
              }
              if (gt - phase2Gt > 30) { clearInterval(iv); return res('flew past x=-9950 after a scored landing and did not crash (30 game-s)'); }
            }
          }, 200);
        });
      }).catch(() => ({ inconclusive: 'the page navigated away during the test (destroyed execution context) - robot side' }));
    },
  },
  {
    id: 'play-jet-controls',
    ask: 'G-90: the jet control pad (12 buttons + throttle lever + stick) is on the phone screen and every button works',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(500);
      return h.eval(() => {
        const F = window.__flight;
        if (!F || !F.jetInput || !F.jet) return 'no jet controls hook (window.__flight.jetInput)';
        const ids = ['jBoost', 'jYawL', 'jYawR', 'jGear', 'jCam', 'jStyle', 'jPaint', 'jBrake', 'jRoll', 'jLoop', 'jImm', 'jSplit'];
        for (const id of ids) {
          const b = document.getElementById(id);
          if (!b) return 'missing pad button #' + id;
          const r = b.getBoundingClientRect();
          if (r.width < 44 || r.height < 44) return 'pad button #' + id + ' is only ' + Math.round(r.width) + 'x' + Math.round(r.height) + 'px (min 44)';
          if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) return 'pad button #' + id + ' sits off the phone screen';
        }
        if (document.getElementById('stickZone')) return 'the old touch stick is still on the page';
        const lev = document.getElementById('thrLever');
        if (!lev) return 'throttle lever is missing (THR buttons are hidden, the lever must replace them)';
        const lr = lev.getBoundingClientRect();
        if (getComputedStyle(lev).visibility === 'hidden' || lr.width < 44 || lr.height < 100) return 'throttle lever is not a visible lever (' + Math.round(lr.width) + 'x' + Math.round(lr.height) + 'px)';
        const down = (id) => document.getElementById(id).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7 }));
        const up = (id) => document.getElementById(id).dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 }));
        const p0 = F.jet.paint; down('jPaint'); up('jPaint');
        if (F.jet.paint === p0) return 'PAINT button did not change the jet paint';
        const s0 = F.jet.style; down('jStyle'); up('jStyle');
        if (F.jet.style === s0) return 'STYLE button did not change the jet';
        let n = 0; while (F.jet.style !== 'fighter' && n++ < 7) { down('jStyle'); up('jStyle'); }
        // gear in the air: raise then lower
        F.P.pos.set(0, 300, 0); F.P.vel.set(0, 0, 40); F.P.ground = false;
        down('jGear'); up('jGear');
        if (F.jet.gearDown) return 'GEAR button did not raise the gear in the air';
        down('jGear'); up('jGear');
        if (!F.jet.gearDown) return 'GEAR button did not lower the gear again';
        // held buttons drive their inputs
        down('jBoost'); const boost = F.jetInput.boost === true; up('jBoost');
        if (!boost) return 'BOOST button did not set boost while held';
        down('jBrake'); const brake = F.jetInput.brake === true; up('jBrake');
        if (!brake) return 'BRAKE button did not set brake while held';
        down('jYawR'); const yaw = F.jetInput.yaw === 1; up('jYawR');
        if (!yaw) return 'YAW button did not set yaw while held';
        return true;
      });
    },
  },
  {
    id: 'tester-challenge-can-slow-to-band',
    ask: 'Landing challenge: the jet must be able to slow to the 55-88 kt touchdown band in a descent (today: it accelerates to 130kt+ and cannot slow down, making the runway unreachable)',
    async test(page, h) {
      try { await h.press('#btnChal'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        if (!F.jetInput) return 'no jetInput (G-90 controls missing)';
        // VP Oct 27 2026 (known fault, expires Oct 29): the 30 s budget was WALL time, which a slow runner day cannot meet.
        // Judged in GAME time now - the rAF delta-sum clamped to 0.05 s like the game's own loop (apexflight.html loop(): dt
        // clamped to 0.05), the same clock never-g-243-p1 / tester-postscore-crash use.
        let gt = 0, last = performance.now();
        const tick = (t) => { gt += Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t; if (gt < 60) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        return new Promise((res) => {
          let minSpd = 999;
          const iv = setInterval(() => {
            // competent player: idle throttle, BRAKE airbrake on, gentle -600fpm descent
            F.jetInput.throttle = 0;
            if (F.P) F.P.thr = 0;
            F.jetInput.brake = 1;
            const vs = F.P.vel.y;
            if (vs < -3.5) F.P.pitch = Math.min(F.P.pitch + 0.03, 0.1);
            else if (vs > -1.5) F.P.pitch = Math.max(F.P.pitch - 0.03, -0.25);
            const spdKt = F.P.vel.length() * 1.94384;
            if (spdKt < minSpd) minSpd = spdKt;
            // stop when we touch down, crash, or run out of time/altitude
            if (F.P.ground || document.getElementById('crashOv').hidden === false) {
              clearInterval(iv);
              if (minSpd > 88) return res('jet could not slow below 88kt in the descent (min ' + Math.round(minSpd) + 'kt) - the 55-88kt touchdown band is unreachable');
              return res(true);
            }
            if (gt > 30) {
              clearInterval(iv);
              return res('never touched down after 30 game-s (min speed ' + Math.round(minSpd) + 'kt)');
            }
          }, 200);
        });
      }).catch(() => ({ inconclusive: 'the page navigated away during the test (destroyed execution context) - robot side' }));
    },
  },
  {
    id: 'play-controls-answer-in-100ms',
    ask: 'G-117: every flight control answers within 100ms of the touch and stops at once when let go - stick, throttle lever, BOOST, BRAKE, YAW (in the air too), GEAR, trick buttons',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F || !F.jetInput || !F.jet) return 'no flight/jetInput hook';
        const J = F.jetInput, P = F.P, R = window.__reality;
        if (!R || !R.time) return 'no window.__reality.time() hook';
        const el = (id) => document.getElementById(id);
        const down = (id) => el(id).dispatchEvent(new PointerEvent('pointerdown', { pointerId: 11, bubbles: true }));
        const up = (id) => el(id).dispatchEvent(new PointerEvent('pointerup', { pointerId: 11, bubbles: true }));
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        const until = async (fn, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return Math.round(performance.now() - t0); await wait(4); } return -1; };
        return (async () => {
          const bad = [];
          // GENUINE LATENCY CHECK, wall-clock on purpose: "answers within 100 ms of the touch" is real time the player waits. It is only
          // measurable when the page draws a frame at least every ~50 ms; a slower robot renderer cannot show a 100 ms answer, so then it is
          // INCONCLUSIVE (yellow), never a false red. The heading change (YAW) is judged in game time below, not here.
          const fts = []; await new Promise((ok) => { let k = 0, prev = performance.now(); const t = setTimeout(ok, 3000); const f = (now) => { fts.push(now - prev); prev = now; if (++k >= 12) { clearTimeout(t); ok(); } else requestAnimationFrame(f); }; requestAnimationFrame(f); });
          fts.sort((a, b) => a - b); const medFrame = fts.length ? fts[fts.length >> 1] : 9999;
          if (medFrame > 50) return { inconclusive: 'robot renderer too slow to measure a 100 ms answer (median frame ' + medFrame.toFixed(0) + ' ms) - latency not judged' };
          // airborne setup, level and steady (state set through the hook, then real controls only)
          P.pos.set(0, 300, 0); P.vel.set(0, 0, 45); P.pitch = 0; P.roll = 0; P.yaw = 0; P.ground = false; P.thr = 0.6; J.throttle = 0.6;
          await wait(150);
          // STICK: press and push down-right - the jet must answer, and stop when let go
          const zone = el('apcZone'); const r = zone.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          zone.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, clientX: cx, clientY: cy, bubbles: true }));
          zone.dispatchEvent(new PointerEvent('pointermove', { pointerId: 9, clientX: cx + 26, clientY: cy + 26, bubbles: true }));
          let ms = await until(() => F.inp.pitchUp > 0.15 && F.inp.rollRight > 0.15, 100);
          if (ms < 0) bad.push('stick did not move the jet within 100ms');
          zone.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, clientX: cx + 26, clientY: cy + 26, bubbles: true }));
          ms = await until(() => F.inp.pitchUp === 0 && F.inp.rollRight === 0, 100);
          if (ms < 0) bad.push('stick did not stop within 100ms of letting go');
          // THR LEVER: dragging it must move the throttle at once, and letting
          // go must hold the value (the lever replaces the old THR + / THR - buttons)
          const lev = el('thrLever');
          if (!lev) bad.push('throttle lever is missing');
          else {
            const lr = lev.getBoundingClientRect();
            const levDown = (pct) => lev.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 11, clientY: lr.top + (1 - pct) * lr.height, bubbles: true }));
            const levUp = (pct) => lev.dispatchEvent(new PointerEvent('pointerup', { pointerId: 11, clientY: lr.top + (1 - pct) * lr.height, bubbles: true }));
            P.thr = 0.5; J.throttle = 0.5; await wait(60);
            levDown(0.9);
            ms = await until(() => P.thr > 0.85, 100);
            if (ms < 0) bad.push('throttle lever drag up did not raise the throttle within 100ms');
            levUp(0.9); await wait(80); const thrHold = P.thr; await wait(150);
            if (Math.abs(P.thr - thrHold) > 0.002) bad.push('throttle kept moving after the lever was let go');
            levDown(0.2);
            ms = await until(() => P.thr < thrHold - 0.03, 100);
            if (ms < 0) bad.push('throttle lever drag down did not lower the throttle within 100ms');
            levUp(0.2);
          }
          // BOOST and BRAKE: flags answer at once and clear at once
          down('jBoost'); ms = await until(() => J.boost === true, 100);
          if (ms < 0) bad.push('BOOST did not answer within 100ms');
          up('jBoost'); ms = await until(() => J.boost === false, 100);
          if (ms < 0) bad.push('BOOST did not stop within 100ms of letting go');
          down('jBrake'); ms = await until(() => J.brake === true, 100);
          if (ms < 0) bad.push('BRAKE did not answer within 100ms');
          up('jBrake'); ms = await until(() => !J.brake, 100);
          if (ms < 0) bad.push('BRAKE did not stop within 100ms of letting go');
          // YAW: in the air the jet's heading must actually turn, and stop when let go
          const gwait = async (sec) => { const g0 = R.time(), w0 = performance.now(); while (R.time() - g0 < sec && performance.now() - w0 < 4000) await wait(8); return R.time() - g0; };
          const yaw0 = P.yaw;
          down('jYawR');
          const gy = await gwait(0.1);               // 0.1 GAME second (was 100 wall ms): the heading must have turned by then
          if (gy < 0.1) bad.push('YAW: the game advanced only ' + gy.toFixed(2) + ' game-s in 4 wall-s - could not judge the heading');
          else if (Math.abs(P.yaw - yaw0) <= 0.02) bad.push('YAW did not turn the jet within 0.1 game-s (dead in the air; turned ' + Math.abs(P.yaw - yaw0).toFixed(3) + ' rad)');
          up('jYawR'); await gwait(0.1); const yawHold = P.yaw; await gwait(0.25);
          if (Math.abs(P.yaw - yawHold) > 0.005) bad.push('jet kept yawing after YAW was let go (' + Math.abs(P.yaw - yawHold).toFixed(3) + ' rad in 0.25 game-s)');
          // GEAR: a tap flips the gear state at once, both ways
          if (!F.jet.gearDown) { down('jGear'); up('jGear'); await until(() => F.jet.gearDown, 200); }
          down('jGear'); up('jGear');
          ms = await until(() => F.jet.gearDown === false, 100);
          if (ms < 0) bad.push('GEAR did not retract within 100ms of the tap');
          down('jGear'); up('jGear');
          ms = await until(() => F.jet.gearDown === true, 100);
          if (ms < 0) bad.push('GEAR did not extend within 100ms of the tap');
          // TRICK: a tap starts the maneuver at once
          down('jRoll'); up('jRoll');
          ms = await until(() => F.trick === 'barrelRoll', 100);
          if (ms < 0) bad.push('BARREL button did not start the trick within 100ms');
          // leave the shared page in a clean flying state on success (a failed
          // test gets a harness reload anyway): the next test on this page
          // starts from whatever state it finds, and an unpiloted jet left
          // mid-maneuver can crash in the gap and strand it. Park it high,
          // level, cruising.
          if (!bad.length) {
            P.pos.set(0, 300, 0); P.vel.set(0, 0, 40); P.pitch = 0; P.roll = 0; P.thr = 0.45; P.ground = false;
            F.jetInput.throttle = 0.45; F.jetInput.pitch = 0; F.jetInput.roll = 0; F.jetInput.yaw = 0;
          }
          return bad.length ? bad.join('; ') : true;
        })();
      }).catch((e) => ({ inconclusive: 'the page navigated away or closed during the test - robot side: ' + String(e && e.message).split('\n')[0].slice(0, 100) }));
    },
  },
  {
    id: 'tester-recheck-g158-freeflight',
    ask: 'G-158 re-check: free flight stays stable - steady cruise keeps finite position and velocity, no crash, the jet keeps moving',
    async test(page, h) {
      // dismiss the menu / a crash overlay with the game's own buttons, in-page
      // (robust at any frame rate - no timed Playwright clicks)
      await h.eval(() => {
        if (!document.getElementById('startOv').hidden) document.getElementById('btnFree').click();
        else if (!document.getElementById('crashOv').hidden) document.getElementById('crashOv').click();
      }).catch(() => {});
      await h.wait(600);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        F.P.pos.set(0, 150, -2000); F.P.vel.set(0, 0, 40); F.P.ground = false;
        F.P.pitch = 0; F.P.roll = 0; F.P.yaw = 0; F.P.thr = 0.5;
        const x0 = F.P.pos.x, z0 = F.P.pos.z;
        return new Promise((res) => {
          setTimeout(() => {
            const p = F.P.pos, v = F.P.vel;
            if (![p.x, p.y, p.z, v.x, v.y, v.z].every(Number.isFinite)) return res('non-finite position/velocity in steady free flight');
            if (!document.getElementById('crashOv').hidden) return res('jet crashed during steady free flight');
            const moved = Math.hypot(p.x - x0, p.z - z0);
            if (moved < 1) return res('jet did not move in 8s of steady free flight');
            res(true);
          }, 8000);
        });
      });
    },
  },
  {
    id: 'play-jet-on-runway',
    ask: 'G-141: the owners jet is the player plane (INSTRUCTIONS steps 1-2, 5, 6) and it starts parked ON THE RUNWAY on the ground; the step-6 look is in (PMREM environment so the paint reflects, a shadow-casting sun) - today the jet is in but the look is not: no environment, shadows off',
    async test(page, h) {
      const url = await h.eval(() => location.href);
      await page.goto(url);
      for (let i = 0; i < 25; i++) { if (await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden))) break; await h.wait(400); }
      if (!(await h.press('#btnFree'))) return 'could not press FREE FLIGHT after reloading to the menu';
      return h.eval(() => new Promise((res) => {
        const t0 = performance.now();
        const iv = setInterval(() => {
          const F = window.__flight, P = F && F.P;
          if (F && F.jet && P && P.ground === true && Math.abs(P.pos.x) <= 12 && P.pos.z > -700 && P.pos.z < 700 && Math.abs(P.pos.y - F.jet.gearHeight) < 0.1) {
            const scene = F.jet.group.parent;
            let sun = null;
            scene.traverse(o => { if (o.isDirectionalLight) sun = o; });
            const missing = [];
            if (!(F.jet.wheels && F.jet.wheels.length >= 3)) missing.push('jet wheels');
            if (!scene.environment) missing.push('PMREM environment (step 6)');
            if (!(sun && sun.castShadow && sun.shadow.mapSize.x === 2048)) missing.push('shadow sun 2048 (step 6)');
            clearInterval(iv);
            return res(missing.length ? 'jet is parked on the runway, but missing: ' + missing.join(', ') : true);
          }
          if (performance.now() - t0 > 6000) { clearInterval(iv); res('jet did not start parked on the runway (ground / on-runway / at gear height never all true)'); }
        }, 150);
      }));
    },
  },
  {
    id: 'play-stick-shared-resets',
    ask: 'G-232: the stick is the shared kit/controls.js stick (the jet pack stick is gone) and letting go stops it - pointerup, pointercancel, blur and hidden tab all reset it to centre',
    async test(page, h) {
      await h.eval(() => { location.href = location.href; });
      await h.wait(900);
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const C = window.__controls, F = window.__flight;
        if (!C || C.shared !== true) return 'the shared kit controls are not loaded (window.__controls missing)';
        if (document.getElementById('jetStickZone')) return 'the jet pack stick zone is still on the page';
        const zone = document.getElementById('apcZone');
        if (!zone) return 'the shared stick zone (#apcZone) is missing';
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        const until = async (fn, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await wait(5); } return false; };
        const r = zone.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const drag = () => {
          zone.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: cx, clientY: cy, bubbles: true }));
          zone.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, clientX: cx + 30, clientY: cy + 30, bubbles: true }));
        };
        const centred = () => { const c = C.read(); return c.x === 0 && c.y === 0; };
        const inpZero = () => !F || (F.inp.pitchUp === 0 && F.inp.rollRight === 0);
        return (async () => {
          const bad = [];
          const cases = [
            ['pointerup', () => zone.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, bubbles: true }))],
            ['pointercancel', () => zone.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7, bubbles: true }))],
            ['blur', () => window.dispatchEvent(new Event('blur'))],
          ];
          for (const [name, fire] of cases) {
            drag();
            if (!(await until(() => { const c = C.read(); return c.x > 0.3 && c.y > 0.3; }, 300))) { bad.push(name + ': the stick did not deflect on drag'); continue; }
            fire();
            if (!(await until(centred, 300))) bad.push(name + ' did not reset the shared stick');
            else if (!(await until(inpZero, 300))) bad.push(name + ' reset the stick but the jet kept steering');
          }
          // hidden tab: the reset must land while the tab is hidden (the kit
          // releases synchronously on visibilitychange), then restore the tab
          drag();
          if (!(await until(() => { const c = C.read(); return c.x > 0.3 && c.y > 0.3; }, 300))) { bad.push('hidden tab: the stick did not deflect on drag'); }
          else {
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
            if (!centred()) bad.push('hidden tab did not reset the shared stick');
            Object.defineProperty(document, 'hidden', { value: false, configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
            if (!(await until(inpZero, 300))) bad.push('hidden tab reset the stick but the jet kept steering');
          }
          return bad.length ? bad.join('; ') : true;
        })();
      });
    },
  },
  {
    id: 'play-stick-never-stays-stuck',
    ask: 'A cancelled touch (call, notification, palm) never leaves the stick stuck: touchcancel zeroes the stick and all input at once (G-238)',
    test: async (page, h) => {
      await h.eval(() => { location.href = location.href; });
      await h.wait(900);
      await h.press('#btnFree');
      await h.wait(400);
      const r = await h.eval(async () => {
        const F = window.__flight, C = window.__controls;
        if (!C || !C.shared) return 'shared controls not loaded';
        const zone = document.getElementById('apcZone');
        if (!zone) return 'no kit stick zone';
        const zr = zone.getBoundingClientRect();
        const cx = zr.left + zr.width / 2, cy = zr.top + zr.height / 2;
        const ev = (type, x, y) => zone.dispatchEvent(new PointerEvent(type, { pointerId: 11, clientX: x, clientY: y, bubbles: true }));
        ev('pointerdown', cx, cy); ev('pointermove', cx + 26, cy + 26);
        const until = async (fn, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await new Promise(r2 => setTimeout(r2, 25)); } return fn(); };
        if (!await until(() => Math.abs(C.read().x) > 0.3 && Math.abs(F.inp.pitchUp) > 0.2, 1500)) return 'stick drag never deflected the jet';
        window.dispatchEvent(new TouchEvent('touchcancel', { bubbles: true }));
        if (!await until(() => Math.abs(C.read().x) < 0.02 && Math.abs(C.read().y) < 0.02 && F.inp.pitchUp === 0 && F.inp.rollRight === 0, 1500)) return 'touchcancel left the stick stuck: read=' + JSON.stringify(C.read()) + ' inp=' + F.inp.pitchUp + '/' + F.inp.rollRight;
        return true;
      });
      return r === true ? true : r;
    }
  }
,
  {
    id: 'play-g243-buttons-inside-safe-area',
    ask: 'G-243 point 1: btnFree, friendGo and friendClose sit fully inside the 844x390 safe area',
    test: async (page, h) => {
      const evalRetry = async (fn) => { for (let i = 0; i < 6; i++) { try { return await h.eval(fn); } catch (e) { await h.wait(500); } } throw new Error('page never became ready after reload'); };
      await h.eval(() => { location.href = location.href; });
      await h.wait(900);
      const inside = (id) => { const e = document.getElementById(id); if (!e) return id + ' missing'; const r = e.getBoundingClientRect(); return (r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight) ? true : id + ' at [' + Math.round(r.left) + ',' + Math.round(r.top) + '->' + Math.round(r.right) + ',' + Math.round(r.bottom) + '] vs ' + innerWidth + 'x' + innerHeight; };
      const a = await evalRetry(() => { const e = document.getElementById('btnFree'); if (!e) return 'btnFree missing'; const r = e.getBoundingClientRect(); return (r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight) ? true : 'btnFree at [' + Math.round(r.left) + ',' + Math.round(r.top) + '->' + Math.round(r.right) + ',' + Math.round(r.bottom) + ']'; });
      if (a !== true) return a;
      await h.press('#friendBtn');
      await h.wait(400);
      const b = await evalRetry(() => {
        const chk = (id) => { const e = document.getElementById(id); if (!e) return id + ' missing'; const r = e.getBoundingClientRect(); return (r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight) ? true : id + ' at [' + Math.round(r.left) + ',' + Math.round(r.top) + '->' + Math.round(r.right) + ',' + Math.round(r.bottom) + ']'; };
        return [chk('friendGo'), chk('friendClose')].find(x => x !== true) || true;
      });
      return b === true ? true : b;
    }
  },
  {
    id: 'play-g243-jetbtn-clear-of-back',
    ask: 'G-243 point 2: the JET button does not overlap the back button',
    test: async (page, h) => {
      const r = await h.eval(() => {
        const a = document.getElementById('back').getBoundingClientRect();
        const b = document.getElementById('jetBtn').getBoundingClientRect();
        const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        return overlap ? 'jetBtn [' + Math.round(b.left) + ',' + Math.round(b.top) + '->' + Math.round(b.right) + ',' + Math.round(b.bottom) + '] overlaps back [' + Math.round(a.left) + ',' + Math.round(a.top) + '->' + Math.round(a.right) + ',' + Math.round(a.bottom) + ']' : true;
      });
      return r === true ? true : r;
    }
  },
  {
    id: 'play-g243-zone-never-covers-friend',
    ask: 'G-243 point 3: the stick zone never covers the Play-a-Friend buttons',
    test: async (page, h) => {
      await h.press('#friendBtn');
      await h.wait(400);
      const r = await h.eval(() => {
        const z = document.getElementById('apcZone');
        if (z && getComputedStyle(z).display !== 'none') return 'stick zone is visible over the menu';
        const b = document.getElementById('friendGo');
        const r2 = b.getBoundingClientRect();
        const hit = document.elementFromPoint(r2.left + r2.width / 2, r2.top + r2.height / 2);
        return (hit === b || b.contains(hit)) ? true : 'friendGo is covered by ' + (hit ? (hit.id || hit.className || hit.tagName) : 'nothing');
      });
      return r === true ? true : r;
    }
  },
  {
    id: 'play-g243-favicon-declared',
    ask: 'G-243 point 5: the page declares a data: favicon so the browser never asks for /favicon.ico',
    test: async (page, h) => {
      const r = await h.eval(() => {
        const l = document.querySelector('link[rel="icon"]');
        return (l && (l.getAttribute('href') || '').startsWith('data:')) ? true : 'no data: icon link in the page head';
      });
      return r === true ? true : r;
    }
  },
  {
    id: 'play-g243-portrait-stick-on-screen',
    ask: 'G-243 point 4: in portrait (390x844, body rotated) the stick base sits on the screen and the stick answers',
    test: async (page, h) => {
      const evalRetry = async (fn) => { for (let i = 0; i < 8; i++) { try { return await h.eval(fn); } catch (e) { await h.wait(500); } } return 'page never became ready'; };
      await page.setViewport({ width: 390, height: 844 });
      try {
        await h.eval(() => { location.href = location.href.split('?')[0] + '?test=controls'; });
        await h.wait(1000);
        const r = await evalRetry(async () => {
          const C = window.__controls;
          if (!C || !C.shared) return 'shared controls not loaded in portrait';
          const j = document.querySelector('.apc-joy');
          if (!j) return 'no stick base in portrait';
          const jr = j.getBoundingClientRect();
          if (jr.right <= 0 || jr.bottom <= 0 || jr.left >= innerWidth || jr.top >= innerHeight) return 'stick base off-screen in portrait: [' + Math.round(jr.left) + ',' + Math.round(jr.top) + '->' + Math.round(jr.right) + ',' + Math.round(jr.bottom) + '] vs ' + innerWidth + 'x' + innerHeight;
          const z = document.getElementById('apcZone');
          const zr = z.getBoundingClientRect();
          const cx = zr.left + zr.width / 2, cy = zr.top + zr.height / 2;
          const ev = (type, x, y) => z.dispatchEvent(new PointerEvent(type, { pointerId: 13, clientX: x, clientY: y, bubbles: true }));
          ev('pointerdown', cx, cy); ev('pointermove', cx, cy + 30);
          await new Promise(r2 => setTimeout(r2, 250));
          const c = C.read();
          ev('pointerup', cx, cy);
          return (Math.abs(c.x) > 0.25 || Math.abs(c.y) > 0.25) ? true : 'stick did not answer in portrait: ' + JSON.stringify(c);
        });
        return r === true ? true : r;
      } finally {
        try { await page.setViewport({ width: 844, height: 390 }); } catch (e) {}
        try { await h.eval(() => { location.href = location.href.split('?')[0]; }); } catch (e) {}
        await h.wait(900);
      }
    }
  }
,
  {
    id: 'play-ai-jets-flying',
    ask: 'G-247: 3-5 computer jets in the other styles and paints fly wide loops and stay above the ground',
    test: async (page, h) => {
      const evalRetry = async (fn) => { for (let i = 0; i < 8; i++) { try { return await h.eval(fn); } catch (e) { await h.wait(500); } } return 'page never became ready'; };
      await h.eval(() => { location.href = location.href.split('?')[0] + '?test=traffic'; });
      await h.wait(1200);
      const r = await evalRetry(() => new Promise((res) => {
        const F = window.__flight;
        if (!F || !F.aiJets) return res('no aiJets on the flight hook');
        const jets = F.aiJets;
        if (jets.length < 3 || jets.length > 5) return res('expected 3-5 computer jets, found ' + jets.length);
        const styles = new Set(jets.map(a => a.jet.style)), paints = new Set(jets.map(a => a.jet.paint));
        if (styles.size !== jets.length) return res('computer jets must each fly a different style');
        if (paints.size !== jets.length) return res('computer jets must each wear a different paint');
        if (styles.has('fighter')) return res('a computer jet uses the player style (fighter)');
        const snap = () => jets.map(a => { const p = a.jet.group.position; return [p.x, p.y, p.z]; });
        const a = snap();
        for (const p of a) if (p[1] < 60) return res('a computer jet is too low: y=' + Math.round(p[1]));
        setTimeout(() => {
          const b = snap();
          for (let i = 0; i < jets.length; i++) {
            if (b[i][1] < 60) return res('computer jet ' + i + ' dropped too low: y=' + Math.round(b[i][1]));
            const d = Math.hypot(b[i][0] - a[i][0], b[i][2] - a[i][2]);
            if (d < 12) return res('computer jet ' + i + ' barely moved (' + d.toFixed(1) + ' m in 3 s)');
          }
          return res(true);
        }, 3000);
      }));
      return r === true ? true : r;
    }
  },
  {
    id: 'play-takeoff-climbs',
    ask: 'takeoff climbs: a full-throttle roll rotates and climbs away - no wallow back onto the gear (owner video 2026-10-23: the jet lifted, sank and collapsed its gear) - judged in GAME seconds (window.__reality.time())',
    async test(page, h) {
      // Same shared-page prelude as play-takeoff: get the plane back on the runway first.
      const st = await h.eval(() => ({
        menu: !document.getElementById('startOv').hidden,
        crashed: !document.getElementById('crashOv').hidden,
        ground: !!(window.__flight && window.__flight.P.ground),
      })).catch(() => null);
      if (!st) return 'no window.__flight hook';
      if (!st.ground) {
        try {
          if (st.menu) await h.press('#btnFree');
          else if (st.crashed) await h.press('#crashOv');
          else await h.press('#resetBtn');
        } catch (e) {}
      }
      return h.eval(() => {
        const F = window.__flight, T = window.__test, R = window.__reality;
        if (!F || !T || !T.simStart || !R || !R.time) return 'no window.__flight / __test / __reality.time() hook';
        const DT = 1 / 60;
        T.simStart('free');
        try {
          F.P.pos.set(0, F.jet.gearHeight, -600); F.P.vel.set(0, 0, 0); F.P.yaw = 0; F.P.pitch = 0; F.P.roll = 0; F.P.ground = true;
          const t0 = R.time(); let n = 0, tV23 = -1;
          while (R.time() - t0 < 90) {                 // the old test's own 90 game-s cap
            F.P.thr = 1; F.jetInput.throttle = 1;
            const v = Math.hypot(F.P.vel.x, F.P.vel.z);
            if (v >= 22.5) F.P.pitch = 0.22;           // the auto-rotate assist's own pitch, held
            if (tV23 < 0 && v >= 23) tV23 = R.time() - t0;
            const ok = T.simStep(DT); n++;
            if (!ok) return 'crashed during the climb-out after ' + (R.time() - t0).toFixed(1) + ' game-s: ' + document.getElementById('crashWhy').textContent;
            if (tV23 >= 0 && F.P.pos.y > F.jet.gearHeight + 12) {
              const took = (R.time() - t0) - tV23;
              return took <= 12 ? true : 'climbed, but took ' + took.toFixed(1) + ' game-s after rotate speed';
            }
            if (tV23 >= 0 && (R.time() - t0) - tV23 > 12) return 'reached rotate speed (at ' + tV23.toFixed(1) + ' game-s) but could not climb - wallowed at y=' + F.P.pos.y.toFixed(1) + ' with vy=' + F.P.vel.y.toFixed(1);
          }
          if (Math.abs((R.time() - t0) - n * DT) > 0.05) return 'game clock did not follow the physics steps';
          return 'plane never reached climb-out in 90 game-s (v23 at ' + tV23.toFixed(1) + ' game-s, v ' + R.speed().toFixed(1) + ' m/s)';
        } finally { T.simEnd(); }
      }).catch((e) => ({ inconclusive: 'the page navigated away or closed during the test - robot side: ' + String(e && e.message).split('\n')[0].slice(0, 100) }));
    },
  },
  {
    id: 'play-first-frame-safe',
    ask: 'first frame: a fresh load never throws the parked jet under the world (negative frame time - lab-measured 2026-10-23: frame 2 read y=-14.4, vy=+12.6, and ground contact could never reach it again)',
    async test(page, h) {
      // Fresh fly-phase load, then watch the first frames: the jet must sit on the runway.
      await h.eval(() => { location.href = location.href.split('?')[0] + '?test=controls'; return true; }).catch(() => {});
      let sane = 0;
      for (let i = 0; i < 40; i++) {
        await h.wait(400);
        const s = await h.eval(() => { const F = window.__flight; if (!F) return null; return { y: F.P.pos.y, vy: F.P.vel.y, gnd: F.P.ground }; }).catch(() => null);
        if (!s) continue;
        if (s.y <= -2) return 'jet thrown under the world on load (y=' + s.y.toFixed(1) + ')';
        if (s.gnd && s.y > 1 && Math.abs(s.vy) < 3) { if (++sane >= 5) return true; } else sane = 0;
      }
      return 'jet never settled on the runway after load';
    },
  },
  {
    id: "never-g-243-p1",
    ask: "NEVER (G-243): Landing challenge: touching down OFF the runway must tell the player why there is no score - the reason stays on screen while the jet sits in the grass, judged in game time",
    async test(page, h) {
      // shared-page trap (G-334): the test before this one leaves a ?test= URL behind
      // (play-first-frame-safe navigates to ?test=controls and never comes back), and
      // ANY ?test= value boots the game menu-hidden in free mode (the catch-all branch),
      // so reloading the CURRENT url hides the menu and the #btnChal press silently
      // fails - the touchdown then runs in free mode and no reason ever shows (the
      // robot's exact red line on main b9f7978). Reload the BARE url so the menu opens.
      try {
        const url = await h.eval(() => location.href.split('?')[0]);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        const menuUp = await h.eval(() => !document.getElementById('startOv').hidden).catch(() => false);
        await h.press('#btnChal');
        const engaged = menuUp && await h.eval(() => document.getElementById('startOv').hidden).catch(() => false);
        if (!engaged) return 'challenge menu did not engage after reload (test setup, not the game)';
      } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        let gt = 0, last = performance.now();
        const tick = (t) => { gt += Math.min(0.05, (t - last) / 1000); last = t; if (gt < 120) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        // the tester's own setup: short final right of the centreline, a gentle touchdown in the grass
        F.P.pos.set(30, 8, -350); F.P.vel.set(0, -1.8, 30);
        F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.08; F.P.thr = 0.3; F.P.ground = false;
        return new Promise((res) => {
          let landedGt = null, sawReason = false;
          const iv = setInterval(() => {
            if (document.getElementById('crashOv').hidden === false) { clearInterval(iv); return res('plane crashed instead of landing gently in the grass'); }
            if (!F.P.ground) {
              const vs = F.P.vel.y;
              if (vs < -2.3) F.P.pitch = Math.min(F.P.pitch + 0.03, 0.1);
              else if (vs > -1.3) F.P.pitch = Math.max(F.P.pitch - 0.03, -0.3);
            } else {
              if (landedGt === null) {
                landedGt = gt;
                if (!document.getElementById('scoreOv').hidden) { clearInterval(iv); return res('off-runway touchdown scored (it should not)'); }
                F.P.thr = 0; F.P.pitch = 0;   // pilot cuts power and sits in the grass
              }
              // The first frames after touchdown can still show the throttle hint
              // ("FULL THROTTLE - BUILD SPEED") before the off-runway reason lands -
              // grace of 0.3 game-s, then the reason must be up and STAY up while
              // the jet sits in the grass (robot check 2026-10-23 11:09 PM: failed
              // at 0.0 game-s on the hint).
              const el = gt - landedGt;
              const msg = document.getElementById('msg').textContent || '';
              const hasReason = /off|runway|grass|no score/i.test(msg);
              if (el >= 0.3) {
                if (hasReason) { sawReason = true; if (el > 4.5) { clearInterval(iv); return res(true); } }
                else if (sawReason) { clearInterval(iv); return res('the no-score reason blinked out ' + el.toFixed(1) + ' game-s after touchdown (msg: "' + msg + '")'); }
                else if (el > 4.5) { clearInterval(iv); return res('the no-score reason never showed within 4.5 game-s of touchdown (msg: "' + msg + '")'); }
              }
            }
            if (gt > 100) { clearInterval(iv); return res(landedGt === null ? 'never touched down' : 'message never settled (game time)'); }   // game time ONLY (VP's alternative, 2026-10-23): a wall cap here was always tighter than the harness's own budget, so slow GPU-bound runs failed on the clock, not the game
          }, 200);
        });
      });
    },
  },
  {
    id: "never-g-243-p2",
    ask: "NEVER (G-243): after a scored landing, flying into the ocean must still crash the plane - judged in game time so a slow runner cannot fake the failure",
    async test(page, h) {
      // shared-page trap: an earlier test's flight hides the menu for good, so
      // #btnChal can never be pressed again - reload to a known menu first
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnChal');
      } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // game-time clock: sum of capped frame deltas - measures the game, not the runner
        let gt = 0, last = performance.now();
        const tick = (t) => { gt += Math.min(0.05, (t - last) / 1000); last = t; if (gt < 120) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        // the tester's own gentle approach profile (started lower and closer -
        // same profile, less dead time, so a slow runner still finishes in budget)
        F.P.pos.set(1, 3, -120); F.P.vel.set(0, -0.6, 30);
        F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.02; F.P.thr = 0.12; F.P.ground = false;
        return new Promise((res) => {
          let phase2 = false, gtScore = 0;
          const iv = setInterval(() => {
            if (!phase2) {
              const vs = F.P.vel.y;
              if (vs < -0.8) F.P.pitch = Math.min(F.P.pitch + 0.015, 0.1);
              else if (vs > -0.4) F.P.pitch = Math.max(F.P.pitch - 0.015, -0.25);
              if (document.getElementById('scoreOv').hidden === false) {
                phase2 = true; gtScore = gt;
                if (gtScore > 20) { clearInterval(iv); return res('scored but too slowly: ' + gtScore.toFixed(1) + ' game-s (budget 20 game-s)'); }
                // scored: now fly west into the ocean from close by (the tester's phase 2)
                F.P.pos.set(-9900, 500, 0); F.P.vel.set(-60, 0, 0);
                F.P.yaw = -Math.PI / 2; F.P.pitch = 0; F.P.roll = 0; F.P.ground = false; F.P.thr = 0.6;
              } else if (document.getElementById('crashOv').hidden === false) { clearInterval(iv); return res('plane crashed before the scored landing'); }
              else if (gt > 40) { clearInterval(iv); return res('never scored (game time reached ' + gt.toFixed(1) + 's)'); }   // game time ONLY - the 28 s wall cap fired after 1.4 game-s on a slow runner
            } else {
              if (document.getElementById('crashOv').hidden === false) {
                clearInterval(iv);
                const why = document.getElementById('crashWhy').textContent || '';
                return res(/ocean/i.test(why) ? true : 'crashed after scoring but not for the ocean: ' + why);
              }
              if (gt - gtScore > 10) { clearInterval(iv); return res('flew into the ocean after scoring and did not crash within 10 game-s'); }   // game time ONLY - the 29 s wall cap is what the robot quoted on main 519430d
            }
          }, 200);
        });
      });
    },
  },
  {
    id: "play-band-shows-on-approach",
    ask: "G-263: the 55-88 kt touchdown band shows during the landing approach, and says whether the speed is inside it",
    async test(page, h) {
      // shared-page trap: an earlier test's flight hides the menu for good, so
      // #btnChal can never be pressed again - reload to a known menu first
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnChal');
      } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // final: on the centreline, 80 m up, 1.8 km out - inside the runway box's 9000 m window
        F.P.pos.set(0, 80, -2500); F.P.vel.set(0, -2, 36); F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.05; F.P.thr = 0.4; F.P.ground = false;
        return new Promise((res) => {
          let step = 0, ticks = 0;
          const iv = setInterval(() => {
            ticks++;
            // gentle-descent trim (same pattern as never-g-243-p1): keeps speed stable
            if (!F.P.ground) {
              const vs = F.P.vel.y;
              if (vs < -2.3) F.P.pitch = Math.min(F.P.pitch + 0.03, 0.1);
              else if (vs > -1.3) F.P.pitch = Math.max(F.P.pitch - 0.03, -0.3);
            }
            const b = document.getElementById('bandBox');
            const txt = b ? (b.textContent || '') : '';
            const vis = !!(b && b.style.display === 'block');
            if (step === 0) {
              if (!b) { clearInterval(iv); return res('no #bandBox element on approach'); }
              if (vis && /55/.test(txt) && /88/.test(txt) && /IN BAND/i.test(txt)) { step = 1; F.P.vel.set(0, -2, 20); }
              else if (ticks > 40) { clearInterval(iv); return res('band not showing IN BAND on approach after 40 ticks (visible: ' + vis + ', text: "' + txt + '")'); }
            } else if (step === 1) {
              if (/SLOW/i.test(txt)) { step = 2; F.P.vel.set(0, -2, 50); }
              else if (ticks > 70) { clearInterval(iv); return res('band never flipped to SLOW at ~39 kt (text: "' + txt + '")'); }
            } else {
              if (/FAST/i.test(txt)) { clearInterval(iv); return res(true); }
              else if (ticks > 100) { clearInterval(iv); return res('band never flipped to FAST at ~97 kt (text: "' + txt + '")'); }
            }
          }, 250);
        });
      });
    },
  },
  {
    id: "play-band-shows-on-final-freeflight",
    ask: "G-268: the 55-88 kt band shows on the HUD during final approach in free flight too, so the robot's play picture shows it",
    async test(page, h) {
      // shared-page trap: an earlier test's flight hides the menu for good, so
      // #btnFree can never be pressed again - reload to a known menu first
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnFree');
      } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // final in free flight: on the centreline, 80 m up, 1.8 km out, 70 kt
        F.P.pos.set(0, 80, -2500); F.P.vel.set(0, -2, 36); F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.05; F.P.thr = 0.4; F.P.ground = false;
        return new Promise((res) => {
          let ticks = 0;
          const iv = setInterval(() => {
            ticks++;
            if (!F.P.ground) {
              const vs = F.P.vel.y;
              if (vs < -2.3) F.P.pitch = Math.min(F.P.pitch + 0.03, 0.1);
              else if (vs > -1.3) F.P.pitch = Math.max(F.P.pitch - 0.03, -0.3);
            }
            const b = document.getElementById('bandBox');
            const txt = b ? (b.textContent || '') : '';
            const vis = !!(b && b.style.display === 'block');
            if (vis && /55/.test(txt) && /88/.test(txt) && /IN BAND/i.test(txt)) { clearInterval(iv); return res(true); }
            if (ticks > 40) { clearInterval(iv); return res('band not showing IN BAND on a free-flight final after 40 ticks (visible: ' + vis + ', text: "' + txt + '")'); }
          }, 250);
        });
      });
    },
  },
  {
    id: "play-rwy36-reads-correct",
    ask: "G-275: runway 36 reads the correct way from behind the jet (not mirrored)",
    async test(page, h) {
      return h.eval(() => {
        const decals = window.__rwyDecals;
        if (!decals || !decals.length) return 'runway decals not exposed';
        const m36 = decals.find((d) => d && d.userData && d.userData.num === '36');
        if (!m36) return 'no 36 decal found';
        const img = m36.material && m36.material.map && m36.material.map.image;
        if (!img || !img.getContext) return '36 decal has no canvas texture';
        // The 6's loop sits at the glyph's BOTTOM, and correct paint puts the
        // glyph's bottom toward the approaching pilot - for the 36 end that is
        // the SMALL canvas rows, so the upper third of the 6 half must carry
        // more light pixels than the lower third. Mirrored (old) paint flips that.
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
        const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        const W = img.width;
        const light = (x, y) => data[(y * W + x) * 4] > 150;
        let top = 0, bottom = 0;
        for (let y = 325; y < 360; y++) for (let x = 128; x < 218; x++) if (light(x, y)) top++;
        for (let y = 395; y < 430; y++) for (let x = 128; x < 218; x++) if (light(x, y)) bottom++;
        if (top === 0 && bottom === 0) return 'no light pixels in the 6 half (canvas ' + img.width + 'x' + img.height + ')';
        if (top > bottom) return true;
        return '36 reads mirrored: 6-half light pixels top=' + top + ' bottom=' + bottom + ' (correct paint has top > bottom)';
      });
    },
  },
  {
    id: "play-thr-button-in-row",
    ask: "G-280: the tall THR slider is gone; a slim THR button sits in the pad row overlapping nothing and ramps the throttle while held",
    async test(page, h) {
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnFree');
      } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        if (document.getElementById('thrBar')) return 'tall THR slider still present';
        const pad = document.querySelector('.ajc .pad');
        const btn = document.getElementById('thrBtn');
        if (!pad || !btn) return 'THR button missing from the pad row';
        if (!pad.contains(btn)) return 'THR button is not inside the pad row';
        const r = (el) => el.getBoundingClientRect();
        const br = r(btn);
        for (const id of ['jGear', 'jPaint', 'jLoop']) {
          const el = document.getElementById(id);
          if (!el) return 'pad button ' + id + ' missing';
          const o = r(el);
          if (br.left < o.right && br.right > o.left && br.top < o.bottom && br.bottom > o.top) return 'THR button overlaps ' + id;
        }
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        F.P.thr = 0.2;
        btn.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, bubbles: true }));
        const t0 = F.P.thr;
        return new Promise((res) => {
          setTimeout(() => {
            const t1 = F.P.thr;
            btn.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, bubbles: true }));
            if (t1 > t0 + 0.05) return res(true);
            return res('THR button did not ramp the throttle while held (thr ' + t0.toFixed(2) + ' -> ' + t1.toFixed(2) + ')');
          }, 1200);
        });
      });
    },
  },
  {
    id: "never-g-232-p1",
    ask: "NEVER (G-232): taking off must not crash the jet when it settles back onto the runway banked - a bounce is a roll, not a landing",
    async test(page, h) {
      // shared-page trap: an earlier test's flight hides the menu for good, so
      // #btnFree can never be pressed again - reload to a known menu first
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnFree');
      } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // just lifted off, sinking gently back, stick banked + slightly nose-down
        // (the owner's takeoff: liftoff flash shown, then gear-collapse crash)
        F.P.pos.set(0, F.jet.gearHeight + 0.3, -600); F.P.vel.set(0, -1.0, 25);
        F.P.yaw = 0; F.P.roll = 0.5; F.P.pitch = -0.2; F.P.thr = 1.0; F.P.ground = false;
        return new Promise((res) => {
          let ticks = 0;
          const iv = setInterval(() => {
            ticks++;
            if (!F.P.ground) { F.P.roll = 0.5; F.P.pitch = -0.2; }
            const crashOv = document.getElementById('crashOv');
            if (crashOv && crashOv.hidden === false) { clearInterval(iv); return res('takeoff bounce crashed the jet: ' + (document.getElementById('crashWhy').textContent || '')); }
            if (F.P.ground) { clearInterval(iv); return res(true); }
            if (ticks > 60) { clearInterval(iv); return res('neither crashed nor touched down after 60 ticks'); }
          }, 250);
        });
      });
    },
  },
  {
    id: "play-band-uncovered-on-approach",
    ask: "G-283: on a landing-challenge approach the TD band chip is a distinct chip nothing overlaps, so the 55-88 kt warning is actually seen",
    async test(page, h) {
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnChal');
      } catch (e) {}
      await h.wait(4200);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        F.P.pos.set(0, 80, -2500); F.P.vel.set(0, -2, 49); F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.05; F.P.thr = 0.4; F.P.ground = false;
        return new Promise((res) => {
          setTimeout(() => {
            const bb = document.getElementById('bandBox');
            if (!bb) return res('no #bandBox element on approach');
            if (bb.style.display !== 'block') return res('band chip not displayed on approach');
            const txt = bb.textContent || '';
            if (!/55/.test(txt) || !/88/.test(txt) || !/FAST/i.test(txt)) return res('band chip does not warn FAST at 95 kt (text: "' + txt + '")');
            const r = (el) => el.getBoundingClientRect();
            const br = r(bb);
            const ids = ['stats', 'rwyBox', 'viewBtn', 'resetBtn', 'jetBtn', 'muteBtn', 'back', 'msg', 'ahWrap'];
            for (const id of ids) {
              const el = document.getElementById(id);
              if (!el) continue;
              const o = r(el);
              if (o.width === 0 || o.height === 0) continue;
              if (br.left < o.right && br.right > o.left && br.top < o.bottom && br.bottom > o.top) return res('band chip overlaps #' + id + ' - the warning is buried, not seen');
            }
            const pad = document.querySelector('.ajc .pad');
            if (pad) {
              const o = r(pad);
              if (br.left < o.right && br.right > o.left && br.top < o.bottom && br.bottom > o.top) return res('band chip overlaps the pad buttons');
            }
            return res(true);
          }, 1500);
        });
      });
    },
  },
  {
    id: "play-reset-clear-of-vs",
    ask: "G-290: the RESET button in the top bar overlaps nothing, least of all the VS speed box, on a challenge approach",
    async test(page, h) {
      try {
        const url = await h.eval(() => location.href);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnChal');
      } catch (e) {}
      await h.wait(4200);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        F.P.pos.set(0, 80, -2500); F.P.vel.set(0, -2, 49); F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.05; F.P.thr = 0.4; F.P.ground = false;
        return new Promise((res) => {
          setTimeout(() => {
            const rb = document.getElementById('resetBtn');
            if (!rb) return res('no #resetBtn in the top bar');
            const r = (el) => el.getBoundingClientRect();
            const br = r(rb);
            const ids = ['viewBtn', 'muteBtn', 'jetBtn', 'back', 'rwyBox', 'bandBox', 'msg', 'ahWrap'];
            for (const id of ids) {
              const el = document.getElementById(id);
              if (!el) continue;
              const o = r(el);
              if (o.width === 0 || o.height === 0) continue;
              if (br.left < o.right && br.right > o.left && br.top < o.bottom && br.bottom > o.top) return res('RESET button overlaps #' + id);
            }
            const chips = [...document.querySelectorAll('#stats .chip')];
            if (!chips.length) return res('no stats chips in the top bar');
            for (const c of chips) {
              const o = r(c);
              if (br.left < o.right && br.right > o.left && br.top < o.bottom && br.bottom > o.top) {
                const label = (c.textContent || '').trim().slice(0, 12);
                return res('RESET button overlaps the stats chip "' + label + '"');
              }
            }
            const pad = document.querySelector('.ajc .pad');
            if (pad) {
              const o = r(pad);
              if (br.left < o.right && br.right > o.left && br.top < o.bottom && br.bottom > o.top) return res('RESET button overlaps the pad buttons');
            }
            return res(true);
          }, 1500);
        });
      });
    },
  },
{
    id: "play-g334-dirty-url-challenge",
    ask: "G-334: after an earlier test leaves a ?test= URL behind, the challenge menu still engages and the off-runway reason shows and stays",
    async test(page, h) {
      // the suite-order trap itself: the previous test leaves ?test=controls behind.
      // Settle the page first (the robot's suite runs the previous test on a booted
      // page), then dirty the URL and prove the dirty boot committed - the free-mode
      // catch-all hides the menu - before the fixed prelude recovers from it.
      for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
      await h.eval(() => { location.href = location.href.split('?')[0] + '?test=controls'; return true; }).catch(() => {});
      for (let i = 0; i < 20; i++) { await h.wait(400); const dirty = await h.eval(() => !!(window.__flight && document.getElementById('startOv').hidden)).catch(() => false); if (dirty) break; }
      // shared-page trap (G-334): the test before this one leaves a ?test= URL behind
      // (play-first-frame-safe navigates to ?test=controls and never comes back), and
      // ANY ?test= value boots the game menu-hidden in free mode (the catch-all branch),
      // so reloading the CURRENT url hides the menu and the #btnChal press silently
      // fails - the touchdown then runs in free mode and no reason ever shows (the
      // robot's exact red line on main b9f7978). Reload the BARE url so the menu opens.
      try {
        const url = await h.eval(() => location.href.split('?')[0]);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        const menuUp = await h.eval(() => !document.getElementById('startOv').hidden).catch(() => false);
        await h.press('#btnChal');
        const engaged = menuUp && await h.eval(() => document.getElementById('startOv').hidden).catch(() => false);
        if (!engaged) return 'challenge menu did not engage after reload (test setup, not the game)';
      } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        let gt = 0, last = performance.now();
        const tick = (t) => { gt += Math.min(0.05, (t - last) / 1000); last = t; if (gt < 120) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        // the tester's own setup: short final right of the centreline, a gentle touchdown in the grass
        F.P.pos.set(30, 8, -350); F.P.vel.set(0, -1.8, 30);
        F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.08; F.P.thr = 0.3; F.P.ground = false;
        return new Promise((res) => {
          let landedGt = null, sawReason = false;
          const iv = setInterval(() => {
            if (document.getElementById('crashOv').hidden === false) { clearInterval(iv); return res('plane crashed instead of landing gently in the grass'); }
            if (!F.P.ground) {
              const vs = F.P.vel.y;
              if (vs < -2.3) F.P.pitch = Math.min(F.P.pitch + 0.03, 0.1);
              else if (vs > -1.3) F.P.pitch = Math.max(F.P.pitch - 0.03, -0.3);
            } else {
              if (landedGt === null) {
                landedGt = gt;
                if (!document.getElementById('scoreOv').hidden) { clearInterval(iv); return res('off-runway touchdown scored (it should not)'); }
                F.P.thr = 0; F.P.pitch = 0;   // pilot cuts power and sits in the grass
              }
              // The first frames after touchdown can still show the throttle hint
              // ("FULL THROTTLE - BUILD SPEED") before the off-runway reason lands -
              // grace of 0.3 game-s, then the reason must be up and STAY up while
              // the jet sits in the grass (robot check 2026-10-23 11:09 PM: failed
              // at 0.0 game-s on the hint).
              const el = gt - landedGt;
              const msg = document.getElementById('msg').textContent || '';
              const hasReason = /off|runway|grass|no score/i.test(msg);
              if (el >= 0.3) {
                if (hasReason) { sawReason = true; if (el > 4.5) { clearInterval(iv); return res(true); } }
                else if (sawReason) { clearInterval(iv); return res('the no-score reason blinked out ' + el.toFixed(1) + ' game-s after touchdown (msg: "' + msg + '")'); }
                else if (el > 4.5) { clearInterval(iv); return res('the no-score reason never showed within 4.5 game-s of touchdown (msg: "' + msg + '")'); }
              }
            }
            if (gt > 100) { clearInterval(iv); return res(landedGt === null ? 'never touched down' : 'message never settled (game time)'); }   // game time ONLY (VP's alternative, 2026-10-23): a wall cap here was always tighter than the harness's own budget, so slow GPU-bound runs failed on the clock, not the game
          }, 200);
        });
      });
    },
  },
  {
    id: 'play-qualityBtn-on-screen',
    ask: 'G-391: the QUALITY button sits fully on screen (upright and sideways), at least 44 px tall',
    async test(page, h) {
      // Menu state is shared-page fragile: reload the bare URL to a known menu first.
      try {
        const url = await h.eval(() => location.href.split('?')[0]);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
      } catch (e) {}
      return h.eval(() => {
        const b = document.getElementById('qualityBtn');
        if (!b) return 'no #qualityBtn element';
        if (document.getElementById('startOv').hidden) return 'menu did not engage (test setup, not the game)';
        const r = b.getBoundingClientRect();
        if (r.height < 44) return 'QUALITY button is only ' + Math.round(r.height) + 'px tall (want >= 44)';
        if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return 'QUALITY button cut off: rect [' + [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v)).join(',') + '] in ' + innerWidth + 'x' + innerHeight;
        return true;
      });
    },
  },
  {
    id: 'play-no-coaching-during-roll',
    ask: 'G-403: no live coaching instructions during the ground roll (Clean screen) - the roll shows only the game, the score and the buttons',
    async test(page, h) {
      // Reload the bare URL to a known menu first (shared-page trap).
      try {
        const url = await h.eval(() => location.href.split('?')[0]);
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        for (let i = 0; i < 20; i++) { await h.wait(400); const ready = await h.eval(() => !!(window.__flight && !document.getElementById('startOv').hidden)).catch(() => false); if (ready) break; }
        await h.press('#btnFree');
      } catch (e) {}
      const engaged = await h.eval(() => document.getElementById('startOv').hidden).catch(() => false);
      if (!engaged) return 'menu did not engage (test setup, not the game)';
      const lever = await h.eval(() => { const lev = document.getElementById('thrLever'); if (!lev) return 'no throttle lever on the page'; const r = lev.getBoundingClientRect(); const yFor = (pct) => r.top + (1 - pct) * r.height;
        lev.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 13, clientY: yFor(1), bubbles: true }));
        lev.dispatchEvent(new PointerEvent('pointermove', { pointerId: 13, clientY: yFor(1), bubbles: true }));
        lev.dispatchEvent(new PointerEvent('pointerup', { pointerId: 13, clientY: yFor(1), bubbles: true })); return true; }).catch(() => 'lever eval failed');
      if (lever !== true) return lever;
      // Judge in GAME time (rAF delta-sum): the start flash lasts 2.6 game-s,
      // so a wall-clock wait reads the flash, not the coaching - poll the
      // message across game-s 0-8 and fail if coaching ever shows.
      return h.eval(() => {
        return new Promise((res) => {
          let gt = 0, last = performance.now();
          const tick = (t) => { gt += Math.min(0.05, (t - last) / 1000); last = t; if (gt < 8) requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
          const w0 = Date.now();
          let saw = '';
          const iv = setInterval(() => {
            const txt = (document.getElementById('msg') || {}).textContent || '';
            if (/FULL THROTTLE|STICK UP/i.test(txt)) saw = txt;
            if (gt >= 8) { clearInterval(iv); return res(saw ? 'live coaching showed during the roll: "' + saw + '"' : true); }
            if (Date.now() - w0 > 240000) { clearInterval(iv); return res('ran out of wall time waiting 8 game-s (gt ' + gt.toFixed(1) + ')'); }
          }, 100);
        });
      });
    },
  },
  {
    id: 'play-balance-skill-matters',
    ask: 'balance (master #11): on a short final a skilled pilot lands and scores GOOD or better, a pilot who never touches the stick does not score, and a stick-masher crashes - skill must matter',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(300);
      return h.eval(() => {
        const T = window.__test, F = window.__flight;
        if (!T || !T.simStart || !F) return 'no balance hooks (window.__test.simStart)';
        const clamp = (a, l, hi) => Math.max(l, Math.min(hi, a));
        const out = {};
        function run(skill) {
          T.simStart('challenge');
          F.P.pos.set(0, 30, -600); F.P.vel.set(0, -2, 34); F.P.pitch = -0.05; F.P.thr = 0.35;
          let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
          let t = 0, s;
          for (let i = 0; i < 3000; i++) {
            s = T.simState();
            let pu = 0, rr = 0, thr = 0.35;
            if (skill === 'good') {
              const vyT = s.y < 8 ? -0.6 : -1.8;
              const pd = clamp(s.pitch + (vyT - s.vy) * 0.05, -0.3, 0.12);
              pu = clamp((pd - s.pitch) * 4, -1, 1);
              thr = 0.12; rr = clamp(-s.roll * 2 - s.x * 0.01, -1, 1);
            } else if (skill === 'masher') {
              if (i % 6 === 0) { F.inp.pitchUp = rnd() < 0.5 ? 1 : -1; F.inp.rollRight = rnd() < 0.5 ? 1 : -1; }
              pu = F.inp.pitchUp; rr = F.inp.rollRight; thr = 1;
            }
            F.inp.pitchUp = pu; F.inp.rollRight = rr; F.P.thr = thr; F.jetInput.throttle = thr;
            const ok = T.simStep(1 / 30); t += 1 / 30;
            if (!ok) break;
          }
          s = T.simState();
          out[skill] = { phase: s.phase, rank: s.phase === 'scored' ? s.ranked : '', why: s.phase === 'crashed' ? s.why : '', t: +t.toFixed(1) };
          F.inp.pitchUp = 0; F.inp.rollRight = 0;
          T.simEnd();
        }
        try { run('good'); run('idle'); run('masher'); } finally { T.simEnd(); }
        const g = out.good, i = out.idle, m = out.masher;
        const sum = 'good ' + JSON.stringify(g) + ' idle ' + JSON.stringify(i) + ' masher ' + JSON.stringify(m);
        if (g.phase !== 'scored') return 'a skilled pilot could not land and score on a short final: ' + sum;
        if (g.rank === 'ROUGH') return 'a skilled pilot only managed a ROUGH landing: ' + sum;
        if (i.phase === 'scored') return 'a pilot who never touched the stick still scored a landing: ' + sum;
        if (m.phase === 'scored') return 'a stick-masher landed and scored: ' + sum;
        return true;
      });
    },
  },
];
