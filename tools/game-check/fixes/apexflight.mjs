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
      try { await h.press('#btnChal'); } catch (e) {}
      await h.wait(400);
      const crashed = await h.eval(() => !document.getElementById('crashOv').hidden).catch(() => false);
      if (crashed) { try { await h.press('#crashOv'); await h.wait(600); } catch (e) {} }
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // short final 30 m right of the centreline: a gentle touchdown in the grass
        F.P.pos.set(30, 18, -350); F.P.vel.set(0, -1.8, 30);
        F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.08; F.P.thr = 0.3; F.P.ground = false;
        return new Promise((res) => {
          const t0 = Date.now();
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
            if (Date.now() - t0 > 25000) { clearInterval(iv); return res('never touched down after 25s'); }
          }, 200);
        });
      });
    },
  },
  {
    id: 'tester-postscore-crash',
    ask: 'After a scored landing, flying into the ocean must still crash the plane (today: nothing happens)',
    async test(page, h) {
      try { await h.press('#btnChal'); } catch (e) {}
      await h.wait(400);
      const crashed = await h.eval(() => !document.getElementById('crashOv').hidden).catch(() => false);
      if (crashed) { try { await h.press('#crashOv'); await h.wait(600); } catch (e) {} }
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // score a gentle on-runway landing first
        F.P.pos.set(1, 8, -300); F.P.vel.set(0, -0.6, 30);
        F.P.yaw = 0; F.P.roll = 0; F.P.pitch = -0.02; F.P.thr = 0.12; F.P.ground = false;
        return new Promise((res) => {
          const t0 = Date.now();
          let phase2 = false;
          const iv = setInterval(() => {
            if (!phase2) {
              const vs = F.P.vel.y;
              if (vs < -0.8) F.P.pitch = Math.min(F.P.pitch + 0.015, 0.1);
              else if (vs > -0.4) F.P.pitch = Math.max(F.P.pitch - 0.015, -0.25);
              if (document.getElementById('scoreOv').hidden === false) {
                phase2 = true;
                // scored: now fly west into the ocean from close by
                F.P.pos.set(-9900, 500, 0); F.P.vel.set(-60, 0, 0);
                F.P.yaw = -Math.PI / 2; F.P.pitch = 0; F.P.roll = 0; F.P.ground = false; F.P.thr = 0.6;
              } else if (document.getElementById('crashOv').hidden === false) {
                clearInterval(iv);
                return res('plane crashed before the scored landing');
              } else if (Date.now() - t0 > 20000) {
                clearInterval(iv);
                return res('never scored a landing after 20s');
              }
            } else {
              if (document.getElementById('crashOv').hidden === false) {
                clearInterval(iv);
                const why = document.getElementById('crashWhy').textContent || '';
                return res(/ocean/i.test(why) ? true : 'crashed after scoring but not for the ocean: ' + why);
              }
              if (Date.now() - t0 > 30000) { clearInterval(iv); return res('flew past x=-9950 after a scored landing and did not crash'); }
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
          const zone = el('jetStickZone'); const r = zone.getBoundingClientRect();
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
          return bad.length ? bad.join('; ') : true;
        })();
      });
    },
  },
  {
    id: 'tester-recheck-g117-controls',
    ask: 'Re-check G-117 BUILD: YAW pad buttons must turn the jet in the air, and stick inputs must answer the same frame (G-117 fix verification)',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        if (!F.jetInput) return 'no jetInput (G-90 controls missing)';
        return new Promise((res) => {
          // take off first
          F.jetInput.throttle = 1; if (F.P) F.P.thr = 1;
          const t0 = Date.now();
          let phase = 'takeoff';
          let yaw0 = 0;
          const iv = setInterval(() => {
            if (phase === 'takeoff') {
              if (!F.P.ground) { phase = 'yaw'; yaw0 = F.P.yaw; F.jetInput.yaw = 1; }
              else if (Date.now() - t0 > 20000) { clearInterval(iv); return res('never took off'); }
            } else if (phase === 'yaw') {
              const dyaw = F.P.yaw - yaw0;
              F.jetInput.yaw = 0;
              if (Math.abs(dyaw) < 0.05) { clearInterval(iv); return res('YAW R did not turn the jet in the air (dyaw=' + dyaw.toFixed(3) + ')'); }
              phase = 'done'; clearInterval(iv); return res(true);
            }
            if (Date.now() - t0 > 30000) { clearInterval(iv); return res('timed out'); }
          }, 200);
        });
      });
    },
  },
  {
    id: 'play-throttle-bar',
    ask: 'G-121: the slim throttle bar beside the pad - dragging it sets the throttle at once, the fill shows the level live, and SPD KT answers (the old fat right-edge THR slider is gone)',
    async test(page, h) {
      try { await h.press('#btnFree'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        const P = F.P;
        const bar = document.getElementById('thrBar');
        if (!bar) return 'no #thrBar - the slim throttle bar is missing';
        if (document.getElementById('thr')) return 'the old #thr slider is still there';
        const fill = document.getElementById('thrBarFill');
        if (!fill) return 'no #thrBarFill inside the bar';
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        const until = async (fn, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await wait(15); } return fn(); };
        const spd = () => parseInt((document.getElementById('hSpd') || {}).textContent || '0', 10) || 0;
        const pev = (type, x, y) => bar.dispatchEvent(new PointerEvent(type, { pointerId: 13, clientX: x, clientY: y, bubbles: true }));
        return (async () => {
          // geometry: slim, same height as the button block, standing alongside it
          const pad = document.querySelector('.ajc .pad');
          if (!pad) return 'jet pad not found';
          const br = bar.getBoundingClientRect(), pr = pad.getBoundingClientRect();
          if (br.width > 30) return 'bar is ' + Math.round(br.width) + 'px wide - not slim (about half a button)';
          if (Math.abs(br.height - pr.height) > 12) return 'bar height ' + Math.round(br.height) + ' != button block height ' + Math.round(pr.height);
          if (br.right > pr.left + 2) return 'bar overlaps the button block instead of standing alongside it';
          if (Math.abs(br.bottom - pr.bottom) > 4) return 'bar bottom does not line up with the button block';
          const cx = br.left + br.width / 2;
          // drag to the bottom: the touch alone must cut the throttle at once
          pev('pointerdown', cx, br.bottom - 4);
          if (!await until(() => P.thr <= 0.1, 100)) { pev('pointerup', cx, br.bottom - 4); return 'touching the bottom of the bar did not cut the throttle at once (thr ' + P.thr.toFixed(2) + ')'; }
          pev('pointerup', cx, br.bottom - 4);
          if (!await until(() => spd() <= 1, 3000)) return 'jet did not settle after throttle cut (spd ' + spd() + ' kt)';
          const spd0 = spd();
          // touch the top: throttle must jump at once, and the fill must show it live
          pev('pointerdown', cx, br.top + 4);
          if (!await until(() => P.thr >= 0.9, 100)) { pev('pointerup', cx, br.top + 4); return 'touching the top of the bar did not set full throttle at once (thr ' + P.thr.toFixed(2) + ')'; }
          await wait(120);
          const fillFrac = fill.offsetHeight / br.height;
          if (fillFrac < 0.8) { pev('pointerup', cx, br.top + 4); return 'fill does not show the throttle level (fill ' + Math.round(fillFrac * 100) + '% at full throttle)'; }
          pev('pointerup', cx, br.top + 4);
          // SPD KT must answer: the jet gathers speed under the dragged throttle
          if (!await until(() => spd() >= spd0 + 10, 5000)) return 'SPD KT did not answer - speed stuck at ' + spd() + ' kt with full throttle set from the bar';
          const spd1 = spd();
          // drag back to the bottom: throttle cuts at once and the speed stops growing
          pev('pointerdown', cx, br.bottom - 4);
          if (!await until(() => P.thr <= 0.1, 100)) { pev('pointerup', cx, br.bottom - 4); return 'dragging the bar down did not cut the throttle at once (thr ' + P.thr.toFixed(2) + ')'; }
          pev('pointerup', cx, br.bottom - 4);
          await wait(1500);
          if (spd() > spd1 + 1) return 'speed kept growing after the bar cut the throttle (' + spd1 + ' -> ' + spd() + ' kt)';
          return true;
        })();
      });
    },
  },
  {
    id: 'never-g-121-p1',
    ask: 'NEVER (G-121): after a scored landing, flying into the ocean must still crash the plane - judged in game time so a slow runner cannot fake the failure',
    async test(page, h) {
      try { await h.press('#btnChal'); } catch (e) {}
      await h.wait(400);
      return h.eval(() => {
        const F = window.__flight;
        if (!F) return 'no window.__flight hook';
        // game-time clock: sum of capped frame deltas - measures the game, not the runner
        let gt = 0, last = performance.now();
        const tick = (t) => { gt += Math.min(0.05, (t - last) / 1000); last = t; if (gt < 120) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        // the tester's own gentle approach profile
        F.P.pos.set(1, 8, -300); F.P.vel.set(0, -0.6, 30);
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
    id: 'never-g-121-p2',
    ask: 'NEVER (G-121): touching down OFF the runway in the challenge must keep telling the player why there is no score for as long as the jet sits in the grass - not just one 3.4s flash',
    async test(page, h) {
      try { await h.press('#btnChal'); } catch (e) {}
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
          let landedGt = null; const w0 = Date.now();
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
              const msg = document.getElementById('msg').textContent || '';
              if (!/off|runway|grass|no score/i.test(msg)) { clearInterval(iv); return res('sitting in the grass ' + (gt - landedGt).toFixed(1) + ' game-s after touchdown, the no-score reason is gone (msg: "' + msg + '")'); }
              if (gt - landedGt > 4.5) { clearInterval(iv); return res(true); }
            }
            if (Date.now() - w0 > 28000) { clearInterval(iv); return res(landedGt === null ? 'never touched down' : 'ran out of wall time watching the message'); }
          }, 200);
        });
      });
    },
  },
];
