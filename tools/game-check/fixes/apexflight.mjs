// Owner's fix list for Apex Flight (JOB J9, 2026-10-18). See README.md in this folder.
// The owner's words: "Gameplay picture frozen for 1.5 seconds."
// Tests drive the game through the page; each h.eval function is self-contained.
export default [
  {
    id: 'not-frozen-on-start',
    ask: 'Gameplay picture frozen for 1.5 seconds',
    async test(page, h) {
      // Start the game, then verify the picture changes over 1.5s (plane moves)
      try { await h.press('#btnStart'); } catch (e) {}
      await h.wait(500);
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
    ask: 'take off: full throttle on the runway lifts the plane into the air',
    async test(page, h) {
      // The robot runs all tests on ONE shared page, so an earlier test can
      // leave the plane flying or crashed - and h.press never clicks a hidden
      // button. Return to the runway with the game's own buttons first:
      // menu FREE FLIGHT, crash-overlay tap, or the HUD RESET button.
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
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        return new Promise((res) => {
          const t0 = Date.now();
          let sawGround = F.P.ground === true;
          const iv = setInterval(() => {
            if (F.P.ground === true) sawGround = true;
            if (sawGround && !F.P.ground && F.P.pos.y > 2) {
              clearInterval(iv);
              res(true);
            } else if (!document.getElementById('crashOv').hidden) {
              clearInterval(iv);
              res('plane crashed during the takeoff roll');
            } else if (Date.now() - t0 > 22000) {
              clearInterval(iv);
              res(sawGround ? 'plane rolled but never lifted off' : 'plane did not start on the runway');
            }
          }, 300);
        });
      });
    },
  },
  {
    id: 'play-climb-and-fly',
    ask: 'climb and fly: stick up gains altitude and the plane keeps flying',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        F.P.pos.set(0, 120, 0); F.P.vel.set(0, 0, 35); F.P.ground = false;
        F.P.pitch = 0; F.P.roll = 0; F.P.yaw = 0;
        const y0 = F.P.pos.y, x0 = F.P.pos.x, z0 = F.P.pos.z;
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        return new Promise((res) => {
          setTimeout(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
            const gain = F.P.pos.y - y0;
            const dist = Math.hypot(F.P.pos.x - x0, F.P.pos.z - z0);
            const crashed = !document.getElementById('crashOv').hidden;
            if (crashed) return res('plane crashed during the climb');
            if (dist < 100) return res(`plane barely moved (${dist.toFixed(0)}m in 5s)`);
            if (gain < 8) return res(`stick up gained only ${gain.toFixed(1)}m in 5s (want > 8m)`);
            res(true);
          }, 5000);
        });
      });
    },
  },
  {
    id: 'play-turn',
    ask: 'turn: holding right banks the plane and changes heading',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        F.P.pos.set(0, 120, 0); F.P.vel.set(0, 0, 35); F.P.ground = false;
        F.P.pitch = 0; F.P.roll = 0; F.P.yaw = 0;
        const yaw0 = F.P.yaw;
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
        return new Promise((res) => {
          setTimeout(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
            const dYaw = Math.abs(F.P.yaw - yaw0);
            const crashed = !document.getElementById('crashOv').hidden;
            if (crashed) return res('plane crashed during the turn');
            if (dYaw < 0.3) return res(`heading changed only ${dYaw.toFixed(2)} rad in 4s (want > 0.3)`);
            res(true);
          }, 4000);
        });
      });
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
        // score a gentle on-runway landing first
        F.P.pos.set(1, 8, -300); F.P.vel.set(0, -0.6, 30);
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
      });
    },
  },
  {
    id: 'play-jet-controls',
    ask: 'G-90: the jet control pad (14 buttons + stick) is on the phone screen and every button works',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(500);
      return h.eval(() => {
        const F = window.__flight;
        if (!F || !F.jetInput || !F.jet) return 'no jet controls hook (window.__flight.jetInput)';
        const ids = ['jThrUp', 'jThrDn', 'jBoost', 'jYawL', 'jYawR', 'jGear', 'jCam', 'jStyle', 'jPaint', 'jBrake', 'jRoll', 'jLoop', 'jImm', 'jSplit'];
        for (const id of ids) {
          const b = document.getElementById(id);
          if (!b) return 'missing pad button #' + id;
          const r = b.getBoundingClientRect();
          if (r.width < 44 || r.height < 44) return 'pad button #' + id + ' is only ' + Math.round(r.width) + 'x' + Math.round(r.height) + 'px (min 44)';
          if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) return 'pad button #' + id + ' sits off the phone screen';
        }
        if (document.getElementById('stickZone')) return 'the old touch stick is still on the page';
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
        return new Promise((res) => {
          const t0 = Date.now();
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
            if (Date.now() - t0 > 30000) {
              clearInterval(iv);
              return res('never touched down after 30s (min speed ' + Math.round(minSpd) + 'kt)');
            }
          }, 200);
        });
      });
    },
  },
  {
    id: 'play-controls-answer-in-100ms',
    ask: 'G-117: every flight control answers within 100ms of the touch and stops at once when let go - stick, THR+, THR-, BOOST, BRAKE, YAW (in the air too), GEAR, trick buttons',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F || !F.jetInput || !F.jet) return 'no flight/jetInput hook';
        const J = F.jetInput, P = F.P;
        const el = (id) => document.getElementById(id);
        const down = (id) => el(id).dispatchEvent(new PointerEvent('pointerdown', { pointerId: 11, bubbles: true }));
        const up = (id) => el(id).dispatchEvent(new PointerEvent('pointerup', { pointerId: 11, bubbles: true }));
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        const until = async (fn, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return Math.round(performance.now() - t0); await wait(4); } return -1; };
        return (async () => {
          const bad = [];
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
          // THR + : throttle must start rising at once, and stop when let go
          P.thr = 0.5; J.throttle = 0.5; await wait(60);
          down('jThrUp');
          ms = await until(() => P.thr > 0.53, 100);
          if (ms < 0) bad.push('THR+ did not raise the throttle within 100ms');
          up('jThrUp'); await wait(80); const thrHold = P.thr; await wait(150);
          if (Math.abs(P.thr - thrHold) > 0.002) bad.push('throttle kept moving after THR+ was let go');
          // THR - : throttle must start falling at once
          down('jThrDn');
          ms = await until(() => P.thr < thrHold - 0.03, 100);
          if (ms < 0) bad.push('THR- did not lower the throttle within 100ms');
          up('jThrDn');
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
          const yaw0 = P.yaw;
          down('jYawR');
          ms = await until(() => Math.abs(P.yaw - yaw0) > 0.02, 100);
          if (ms < 0) bad.push('YAW did not turn the jet within 100ms (dead in the air)');
          up('jYawR'); await wait(80); const yawHold = P.yaw; await wait(150);
          if (Math.abs(P.yaw - yawHold) > 0.005) bad.push('jet kept yawing after YAW was let go');
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
      });
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
    ask: 'takeoff climbs: a full-throttle roll rotates and climbs away - no wallow back onto the gear (owner video 2026-10-23: the jet lifted, sank and collapsed its gear)',
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
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        return new Promise((res) => {
          // Judged in GAME time (rAF delta-sum, the harness clock) - wall time only backstops.
          let gt = 0, last = performance.now();
          const tick = (t) => { gt += Math.min(0.05, (t - last) / 1000); last = t; if (gt < 90) requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
          const w0 = Date.now();
          let gtV23 = -1;
          const iv = setInterval(() => {
            F.P.thr = 1; F.jetInput.throttle = 1;
            const v = Math.hypot(F.P.vel.x, F.P.vel.z);
            if (v >= 22.5) F.P.pitch = 0.22;   // the auto-rotate assist's own pitch, held
            if (gtV23 < 0 && v >= 23) gtV23 = gt;
            if (!document.getElementById('crashOv').hidden) { clearInterval(iv); return res('crashed during the climb-out: ' + document.getElementById('crashWhy').textContent); }
            if (gtV23 >= 0 && F.P.pos.y > F.jet.gearHeight + 12) { clearInterval(iv); return res(gt - gtV23 <= 12 ? true : 'climbed, but took ' + (gt - gtV23).toFixed(1) + ' game-s after rotate speed'); }
            if (gtV23 >= 0 && gt - gtV23 > 12) { clearInterval(iv); return res('reached rotate speed but could not climb - wallowed at y=' + F.P.pos.y.toFixed(1) + ' with vy=' + F.P.vel.y.toFixed(1)); }
            if (Date.now() - w0 > 28000) { clearInterval(iv); return res('ran out of wall time (v23 at ' + gtV23.toFixed(1) + ' game-s)'); }
          }, 100);
        });
      });
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
        // the tester's own gentle approach profile (started lower - same profile, less dead time)
        F.P.pos.set(1, 5, -300); F.P.vel.set(0, -0.6, 30);
        F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.02; F.P.thr = 0.12; F.P.ground = false;
        return new Promise((res) => {
          let phase2 = false, gtScore = 0; const w0 = Date.now();
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
              else if (Date.now() - w0 > 28000) { clearInterval(iv); return res('never scored (game time reached only ' + gt.toFixed(1) + 's of the 20 game-s budget)'); }
            } else {
              if (document.getElementById('crashOv').hidden === false) {
                clearInterval(iv);
                const why = document.getElementById('crashWhy').textContent || '';
                return res(/ocean/i.test(why) ? true : 'crashed after scoring but not for the ocean: ' + why);
              }
              if (gt - gtScore > 10) { clearInterval(iv); return res('flew into the ocean after scoring and did not crash within 10 game-s'); }
              if (Date.now() - w0 > 29000) { clearInterval(iv); return res('ocean phase ran out of wall time'); }
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
        // The 6's loop sits at the BOTTOM of a correctly oriented digit: in the
        // number's canvas rows, the lower third of the 6 half must carry more
        // light pixels than the upper third. Mirrored (old) paint flips that.
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
        const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        const W = img.width;
        const light = (x, y) => data[(y * W + x) * 4] > 150;
        let top = 0, bottom = 0;
        for (let y = 325; y < 360; y++) for (let x = 128; x < 218; x++) if (light(x, y)) top++;
        for (let y = 395; y < 430; y++) for (let x = 128; x < 218; x++) if (light(x, y)) bottom++;
        if (top === 0 && bottom === 0) return 'no light pixels in the 6 half (canvas ' + img.width + 'x' + img.height + ')';
        if (bottom > top) return true;
        return '36 reads mirrored: 6-half light pixels top=' + top + ' bottom=' + bottom + ' (correct paint has bottom > top)';
      });
    },
  },
];
