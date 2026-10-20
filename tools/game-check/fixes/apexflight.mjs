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
];
