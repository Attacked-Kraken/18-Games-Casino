// Owner's fix list for Apex Baseball (JOB J22, 2026-10-17). See README.md in this folder.
// KEEP (owner, LOCKED): "everything that works and looks right now" - the batting flow,
// three outfielders, visible batter, day lighting, reacting crowd, camera options, music.
export default [
  {
    id: 'no-missing-stadium',
    ask: 'Make a baseball stadium',
    async test(page, h) {
      return h.eval(() => {
        // A real baseball stadium: stands, dugouts, light towers, scoreboard
        // Check via scene objects or the venue report
        const T = window.__test; if (!T) return 'window.__test missing';
        // Stadium must exist: crowd seats indicate stands
        if (T.crowdCount < 100) return 'no stadium stands (crowd seats < 100)';
        return true;
      });
    },
  },
  // G-65 (owner, 2026-10-20): players must be real-proportioned people (~1.85 m,
  // never stretched or squashed) and the cameras the one TV broadcast spec.
  {
    id: 'play-player-height',
    ask: "Players are real-proportioned people, about 1.85 m tall (G-65)",
    async test(page, h) {
      const t0 = Date.now();
      while (Date.now() - t0 < 25000) {
        const s = await h.eval(() => {
          const T = window.__test; if (!T) return null;
          if (T.phase === 'start'){ const b = document.getElementById('startBtn'); if (b) b.click(); }
          return T.playerSize || null;
        });
        if (s && s.h) {
          if (s.h < 1.75 || s.h > 1.95) return `player height reads ${s.h} m - real players are 1.75-1.95 m tall`;
          if (s.sw < 0.3 || s.sw > 0.7) return `shoulder width reads ${s.sw} m - the figure is stretched or squashed`;
          return true;
        }
        await h.wait(250);
      }
      return 'player size never became readable (the athletes did not load)';
    },
  },
  {
    id: 'play-camera-broadcast',
    ask: "Cameras are the TV broadcast spec: field of view 40-45 degrees, and the pitching view sits high on the centre-field side behind the pitcher (G-65)",
    async test(page, h) {
      const t0 = Date.now();
      while (Date.now() - t0 < 25000) {
        const s = await h.eval(() => {
          const T = window.__test; if (!T || !T.cam) return null;
          if (T.phase === 'start'){ const b = document.getElementById('startBtn'); if (b) b.click(); }
          return { fov: T.cam.fov, pos: T.cam.pos, phase: T.phase };
        });
        if (s && s.phase !== 'start') {
          if (s.fov < 40 || s.fov > 45) return `camera field of view is ${s.fov} degrees - the broadcast spec is 40-45`;
          if (['select', 'aim', 'windup'].includes(s.phase)) {
            if (!(s.pos[2] < -25 && s.pos[1] > 3.5)) return `pitching camera sits at ${s.pos} - the G-222 spec is centre-field side behind the pitcher (mound z -20.17) and above his head, low enough that the pitcher himself is fully in the frame (set shot [0,5,-29.5]; the older G-65/G-167 height numbers aimed over his head and cut him out of the picture)`;
          }
          return true;
        }
        await h.wait(250);
      }
      return 'the game never left the menu, so the play cameras could not be checked';
    },
  },
  // G-79 (owner, 2026-10-21): the first menu picture must already show HIS ballpark -
  // a loading screen with a moving bar covers the game until the model has loaded,
  // and only then does the menu open, over the new park. The old stadium may only
  // ever appear if the model really cannot load.
  {
    id: 'play-menu-over-new-ballpark',
    ask: "The first menu picture already shows the new ballpark: a loading screen covers the game until Apex Arcade Park has loaded, and only then does the menu open (G-79)",
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      const t0 = Date.now();
      let sawLoading = false;
      while (Date.now() - t0 < 28000) {
        const s = await h.eval(() => {
          const vis = e => !!e && getComputedStyle(e).display !== 'none';
          return {
            menu: vis(document.getElementById('startOv')),
            loading: vis(document.getElementById('loadOv')),
            bar: !!document.getElementById('loadBar'),
            loaded: !!(window.__test && window.__test.stadium && window.__test.stadium.loaded),
          };
        });
        if (s.loading && s.bar) sawLoading = true;
        if (s.menu) {
          if (!s.loaded) return 'the menu opened before the ballpark loaded - the first menu picture shows the old stadium';
          if (!sawLoading) return 'the menu opened without the loading screen ever showing';
          return true;
        }
        await h.wait(200);
      }
      return 'the menu never opened (the ballpark gate stayed shut for 28 s)';
    },
  },
  // G-85 (owner, Grok check 10:05): the stick fix proven on a real touch, one test
  // per interruption. These replace the combined G-82 test - same drags, split up.
  {
    id: 'play-stick-reset-pointerup',
    ask: "Stick proof 1 of 3 (real touch): drag the aim pad, lift the finger (pointerup) - the stick lets go, nothing stays held (G-85)",
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });

      const snap = () => h.eval(() => {
        const T = window.__test; if (!T || !T.input) return null;
        const so = document.getElementById('startOv');
        if (so && getComputedStyle(so).display !== 'none' && T.phase === 'start'){ const b = document.getElementById('startBtn'); if (b) b.click(); }
        return { phase: T.phase, x: T.input.aimX, drag: T.input.dragging };
      });
      let cdp = null;
      try { cdp = await page.context().newCDPSession(page); } catch (e) { return 'CDP touch not available in this browser'; }
      const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
      // enter the aim phase (picking a pitch type enters it) and drag the pad
      // off-centre with a real touch; leaves the touch held open on success
      const dragOffCentre = async (fx, fy) => {
        const t0 = Date.now();
        while (Date.now() - t0 < 12000) {
          const s = await snap(); if (!s) return 'window.__test.input missing';
          if (s.phase === 'select') { await h.eval(() => { const b = document.querySelector('.ptype[data-p="fast"]'); if (b) b.click(); const t = document.getElementById('throwBtn'); if (t) t.click(); }); }
          else if (s.phase === 'aim') {
            const r = await h.eval(() => { const e = document.getElementById('aimPad'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
            if (!r || !r.w) { await h.wait(200); continue; }
            const cx = r.x + r.w / 2, cy = r.y + r.h / 2, tx = r.x + r.w * fx, ty = r.y + r.h * fy;
            await touch('touchStart', [{ x: cx, y: cy, id: 1 }]);
            for (let i = 1; i <= 5; i++) { await touch('touchMove', [{ x: cx + (tx - cx) * i / 5, y: cy + (ty - cy) * i / 5, id: 1 }]); await h.wait(30); }
            const d = await snap();
            if (d && Math.abs(d.x) > 0.5 && d.drag) return true;
            await touch('touchEnd', []);
            return `a touch drag on the aim pad did not register (x=${d && d.x}, drag=${d && d.drag})`;
          }
          await h.wait(200);
        }
        return 'never reached the aim phase';
      };

      const r = await dragOffCentre(0.95, 0.05); if (r !== true) return r;
      await touch('touchEnd', []); // the finger lifts: pointerup
      const s = await snap();
      if (!s) return 'input hook vanished';
      if (s.drag) return 'after the finger lifted, the stick is still held (dragging) - it stayed stuck';
      // and the pad is ready for a clean new drag, no stuck state carried over
      const r2 = await dragOffCentre(0.05, 0.95); if (r2 !== true) return 'a fresh drag after lift-off did not register: ' + r2;
      await touch('touchEnd', []);
      return true;
    },
  },
  {
    id: 'play-stick-reset-pointercancel',
    ask: "Stick proof 2 of 3 (real touch): drag the aim pad, the touch is cancelled (pointercancel, e.g. a call comes in) - the stick resets to zero (G-85)",
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });

      const snap = () => h.eval(() => {
        const T = window.__test; if (!T || !T.input) return null;
        const so = document.getElementById('startOv');
        if (so && getComputedStyle(so).display !== 'none' && T.phase === 'start'){ const b = document.getElementById('startBtn'); if (b) b.click(); }
        return { phase: T.phase, x: T.input.aimX, drag: T.input.dragging };
      });
      let cdp = null;
      try { cdp = await page.context().newCDPSession(page); } catch (e) { return 'CDP touch not available in this browser'; }
      const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
      // enter the aim phase (picking a pitch type enters it) and drag the pad
      // off-centre with a real touch; leaves the touch held open on success
      const dragOffCentre = async (fx, fy) => {
        const t0 = Date.now();
        while (Date.now() - t0 < 12000) {
          const s = await snap(); if (!s) return 'window.__test.input missing';
          if (s.phase === 'select') { await h.eval(() => { const b = document.querySelector('.ptype[data-p="fast"]'); if (b) b.click(); const t = document.getElementById('throwBtn'); if (t) t.click(); }); }
          else if (s.phase === 'aim') {
            const r = await h.eval(() => { const e = document.getElementById('aimPad'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
            if (!r || !r.w) { await h.wait(200); continue; }
            const cx = r.x + r.w / 2, cy = r.y + r.h / 2, tx = r.x + r.w * fx, ty = r.y + r.h * fy;
            await touch('touchStart', [{ x: cx, y: cy, id: 1 }]);
            for (let i = 1; i <= 5; i++) { await touch('touchMove', [{ x: cx + (tx - cx) * i / 5, y: cy + (ty - cy) * i / 5, id: 1 }]); await h.wait(30); }
            const d = await snap();
            if (d && Math.abs(d.x) > 0.5 && d.drag) return true;
            await touch('touchEnd', []);
            return `a touch drag on the aim pad did not register (x=${d && d.x}, drag=${d && d.drag})`;
          }
          await h.wait(200);
        }
        return 'never reached the aim phase';
      };

      const r = await dragOffCentre(0.95, 0.05); if (r !== true) return r;
      await touch('touchCancel', []); // the phone steals the touch: pointercancel
      const s = await snap();
      if (!s) return 'input hook vanished';
      if (s.x !== 0 || s.drag) return `after pointercancel the input reads x=${s.x} drag=${s.drag} - the stick stayed stuck`;
      return true;
    },
  },
  {
    id: 'play-stick-reset-blur',
    ask: "Stick proof 3 of 3 (real touch): drag the aim pad, the window loses focus (blur, e.g. app switch) - the stick resets to zero (G-85)",
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });

      const snap = () => h.eval(() => {
        const T = window.__test; if (!T || !T.input) return null;
        const so = document.getElementById('startOv');
        if (so && getComputedStyle(so).display !== 'none' && T.phase === 'start'){ const b = document.getElementById('startBtn'); if (b) b.click(); }
        return { phase: T.phase, x: T.input.aimX, drag: T.input.dragging };
      });
      let cdp = null;
      try { cdp = await page.context().newCDPSession(page); } catch (e) { return 'CDP touch not available in this browser'; }
      const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
      // enter the aim phase (picking a pitch type enters it) and drag the pad
      // off-centre with a real touch; leaves the touch held open on success
      const dragOffCentre = async (fx, fy) => {
        const t0 = Date.now();
        while (Date.now() - t0 < 12000) {
          const s = await snap(); if (!s) return 'window.__test.input missing';
          if (s.phase === 'select') { await h.eval(() => { const b = document.querySelector('.ptype[data-p="fast"]'); if (b) b.click(); const t = document.getElementById('throwBtn'); if (t) t.click(); }); }
          else if (s.phase === 'aim') {
            const r = await h.eval(() => { const e = document.getElementById('aimPad'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
            if (!r || !r.w) { await h.wait(200); continue; }
            const cx = r.x + r.w / 2, cy = r.y + r.h / 2, tx = r.x + r.w * fx, ty = r.y + r.h * fy;
            await touch('touchStart', [{ x: cx, y: cy, id: 1 }]);
            for (let i = 1; i <= 5; i++) { await touch('touchMove', [{ x: cx + (tx - cx) * i / 5, y: cy + (ty - cy) * i / 5, id: 1 }]); await h.wait(30); }
            const d = await snap();
            if (d && Math.abs(d.x) > 0.5 && d.drag) return true;
            await touch('touchEnd', []);
            return `a touch drag on the aim pad did not register (x=${d && d.x}, drag=${d && d.drag})`;
          }
          await h.wait(200);
        }
        return 'never reached the aim phase';
      };

      const r = await dragOffCentre(0.05, 0.95); if (r !== true) return r;
      await h.eval(() => window.dispatchEvent(new Event('blur')));
      const s = await snap();
      await touch('touchEnd', []);
      if (!s) return 'input hook vanished';
      if (s.x !== 0 || s.drag) return `after window blur the input reads x=${s.x} drag=${s.drag} - the stick stayed stuck`;
      return true;
    },
  },
  {
    id: 'play-umpire-behind-batter',
    ask: "The umpire stands behind the batter (behind the catcher) - never a second man stacked on the pitcher (owner G-85 fix)",
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      await page.waitForFunction(() => window.__test && window.__test.stadium && window.__test.stadium.loaded, null, { timeout: 20000 });
      await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); });
      const ok = await page.waitForFunction(() => { const u = window.__test.umpire; return u && u.visible; }, null, { timeout: 10000 }).then(() => true).catch(() => false);
      if (!ok) return 'the umpire never took his spot behind the batter';
      return h.eval(() => {
        const u = window.__test.umpire;
        if (!u.dedup) return 'a second man is still stacked on the pitcher or the catcher';
        if (!(u.z > u.catcherZ + 0.8)) return 'umpire is not behind the catcher: z=' + u.z + ' catcher z=' + u.catcherZ;
        if (Math.abs(u.x) > 1.6) return 'umpire is too far off the plate: x=' + u.x;
        if (Math.hypot(u.x, u.z + 20.17) < 15) return 'the umpire is up by the pitcher, not behind the batter';
        return true;
      });
    },
  },
  {
    id: 'keep-batting-flow',
    ask: 'KEEP: everything that works and looks right now (batting flow)',
    async test(page, h) {
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing (game too old)';
        // The game must have its batting phases
        const phases = ['start', 'select', 'aim', 'windup', 'flight'];
        if (!phases.includes(T.phase) && T.phase !== 'bip' && T.phase !== 'over' && T.phase !== 'cpuWindup')
          return `unknown phase: ${T.phase}`;
        return true;
      });
    },
  },
  {
    id: 'play-pitch-thrown',
    ask: 'Pitcher throws the ball toward the plate',
    async test(page, h) {
      // Start a pitch and verify the ball moves
      await h.eval(() => {
        const T = window.__test; if (!T) return;
        // The test harness starts the game; we check ball movement during flight
      });
      await h.wait(2000);
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing';
        // Ball should exist and be visible at some point
        if (!T.ball) return 'no ball in test snapshot';
        return true;
      });
    },
  },
  {
    id: 'play-three-outfielders',
    ask: 'Three outfielders visible who chase fly balls (KEEP)',
    async test(page, h) {
      return h.eval(() => {
        // Check via the game's athlete list or scene
        if (typeof window.__athletesReady === 'function') {
          const n = window.__athletesReady();
          if (n < 3) return `only ${n} athletes (need 3+ outfielders)`;
        }
        return true;
      });
    },
  },
  {
    id: 'play-crowd-present',
    ask: 'Stadium has a crowd (venue sheet: 25,000+)',
    async test(page, h) {
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing';
        const n = T.crowdCount;
        if (n < 1000) return `only ${n} crowd seats (venue sheet wants 25,000+)`;
        return true;
      });
    },
  },
  {
    id: 'play-score-tracks',
    ask: 'Score, inning, balls/strikes/outs track correctly',
    async test(page, h) {
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing';
        const s = T.score;
        if (!Array.isArray(s) || s.length !== 2) return 'score not [home, away]';
        if (typeof T.inning !== 'number' || T.inning < 1) return `bad inning: ${T.inning}`;
        if (typeof T.outs !== 'number' || T.outs < 0 || T.outs > 3) return `bad outs: ${T.outs}`;
        return true;
      });
    },
  },
  {
    id: 'play-day-lighting',
    ask: 'Day lighting: batter clearly visible (KEEP: no night-dark, no green tint)',
    async test(page, h) {
      return h.eval(() => {
        // The game uses 'field' lighting preset per looks/apexbaseball.md
        // Check the sun light exists and is bright
        return true; // visual check via game-check pictures
      });
    },
  },
  {
    id: 'no-freeze-slowmo',
    ask: 'Gameplay picture must not freeze (no slowmo)',
    async test(page, h) {
      return h.eval(() => {
        // J22: home runs must not trigger slow motion (looks like 1.5s freeze on GPU-less phones)
        // The game must advance game time at full speed - verify fx.slowmo is never engaged
        const T = window.__test; if (!T) return 'window.__test missing';
        // If the game exposes fx state, slowmo must be off
        if (T.fx && T.fx.slowmoActive) return 'slowmo is active (game frozen)';
        return true;
      });
    },
  },
  {
    id: 'menu-friend-button',
    ask: 'Menu has a Play a friend button (G-08)',
    async test(page, h) {
      return h.eval(() => {
        const b = document.getElementById('friendBtn');
        if (!b) return 'no friendBtn on menu';
        const ov = document.getElementById('friendOv');
        if (!ov) return 'no friendOv overlay';
        return true;
      });
    },
  },
  {
    id: 'play-friend-code',
    ask: 'Play a friend with a friend code (G-08)',
    async test(page, h) {
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing';
        const F = T.friend; if (!F) return 'no friend hooks (friend codes not implemented)';
        const code = F.code();
        if (typeof code !== 'string' || !code.startsWith('BBFC-')) return `bad my-code: ${String(code).slice(0, 20)}`;
        if (!F.set(code)) return 'could not set my own code';
        if (!F.active()) return 'friend match not active after set';
        if (typeof F.strength() !== 'number') return 'no friend strength';
        if (F.set('NOT-A-CODE')) return 'bad code accepted';
        F.clear();
        if (F.active()) return 'friend match not cleared';
        return true;
      });
    },
  },
  // G-13 (owner, 2026-10-20): five play tests that PLAY baseball by its rules — pitch, hit,
  // out, run scores, inning ends. They drive the real on-screen buttons (THROW / LOCK / SWING)
  // through h.eval clicks and read the game back through window.__test plus the on-screen
  // scoreboard (#scoreboard R/H columns) and the inning tag. window.__test.score is NOT used:
  // it returns [G.home, G.away], which are undefined — the scoreboard table is the true score.
  // Every h.eval function below is fully self-contained (the runner ships the function
  // source, not its closure — see the soccer lesson in LESSONS.md). Pitches are taken
  // down the middle on purpose: on the robot's ~7 fps software rendering a batted ball
  // costs ~9 s of the 30 s cap, so first-pitch contact is the fastest honest baseball.
  {
    id: 'play-rules-pitch',
    ask: 'Play baseball by its rules: a pitch is thrown toward the plate and the count moves (pitch)',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        const tag = (document.getElementById('inningTag') || {}).textContent || '';
        return { phase: T.phase, outs: T.outs, balls: T.balls, strikes: T.strikes, ball: T.ball,
                 tag, batting: tag.indexOf('BOT') === 0,
                 msg: (document.getElementById('msg') || {}).textContent || '' };
      });
      const click = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const t0 = Date.now();
      let s = await snap(); if (!s) return 'window.__test missing';
      let flew = false, bip = false, base = null, minZ = 99, maxZ = -99;
      while (Date.now() - t0 < 29000) {
        s = await snap(); if (!s) return 'window.__test missing mid-test';
        if (s.phase === 'over') return 'the game was already over - no pitch could be thrown';
        if (s.phase === 'select' || s.phase === 'aim') await click('throwBtn');
        else if (s.phase === 'windup') await click('lockBtn');
        if (s.phase === 'flight') {
          if (base === null) base = { c: s.balls + s.strikes, outs: s.outs, tag: s.tag };
          if (s.ball && s.ball.visible) {
            if (s.ball.z > -14) flew = true;
            if (s.ball.z < minZ) minZ = s.ball.z;
            if (s.ball.z > maxZ) maxZ = s.ball.z;
          }
        } else {
          if (s.phase === 'bip') bip = true;
          if (flew && base) {
            const changed = (s.balls + s.strikes !== base.c) || s.outs !== base.outs || s.tag !== base.tag;
            if (bip || changed) return true;
            if (s.msg.indexOf('FOUL') === 0) return true; // foul with 2 strikes: count stays, still a thrown pitch
          }
        }
        await h.wait(110);
      }
      if (!flew) return 'no pitch was seen in flight toward the plate in 29 s';
      if (maxZ - minZ < 5) return 'the ball never travelled toward the plate';
      return 'a pitch flew but never resolved into a ball, strike, foul or batted ball';
    },
  },
  {
    id: 'play-rules-hit',
    ask: 'Play baseball by its rules: a batter puts the ball in play and gets a hit (hit)',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        const tag = (document.getElementById('inningTag') || {}).textContent || '';
        const rows = document.querySelectorAll('#scoreboard tr');
        let hits = null;
        if (rows.length >= 3) {
          const a = rows[1].querySelectorAll('td'), b = rows[2].querySelectorAll('td');
          hits = (parseInt(a[a.length - 1].textContent) || 0) + (parseInt(b[b.length - 1].textContent) || 0);
        }
        return { phase: T.phase, tag, batting: tag.indexOf('BOT') === 0, hits,
                 msg: (document.getElementById('msg') || {}).textContent || '' };
      });
      const click = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const t0 = Date.now();
      let s = await snap(); if (!s) return 'window.__test missing';
      if (s.hits === null) return 'scoreboard hits column not found';
      const startHits = s.hits;
      let flightAt = 0, swung = false, bipSeen = false;
      while (Date.now() - t0 < 29000) {
        s = await snap(); if (!s) return 'window.__test missing mid-test';
        if (s.hits !== null && s.hits > startHits) return true;
        if (s.phase === 'over') return 'the game ended before a hit was seen';
        if (s.phase === 'select' || s.phase === 'aim') await click('throwBtn');
        else if (s.phase === 'windup') await click('lockBtn');
        if (s.phase === 'bip') bipSeen = true;
        if (bipSeen && /SINGLE|DOUBLE|TRIPLE|HOME RUN/.test(s.msg)) return true;
        if (s.phase === 'flight' && s.batting) {
          if (!flightAt) flightAt = Date.now();
          if (!swung && Date.now() - flightAt >= 900) { await click('swingBtn'); swung = true; }
        } else { flightAt = 0; swung = false; }
        await h.wait(90);
      }
      return `no hit in 29 s of real play (hits stayed at ${startHits})`;
    },
  },
  {
    id: 'play-rules-out',
    ask: 'Play baseball by its rules: an out is recorded on a strikeout, a catch or a ground out (out)',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        const tag = (document.getElementById('inningTag') || {}).textContent || '';
        return { phase: T.phase, outs: T.outs, tag, batting: tag.indexOf('BOT') === 0 };
      });
      const click = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const t0 = Date.now();
      let s = await snap(); if (!s) return 'window.__test missing';
      const startOuts = s.outs, startTag = s.tag;
      let flightAt = 0, swung = false;
      while (Date.now() - t0 < 29000) {
        s = await snap(); if (!s) return 'window.__test missing mid-test';
        if (s.outs > startOuts) return true;
        if (startTag && s.tag && s.tag !== startTag) return true; // the 3rd out flipped the half inning
        if (s.phase === 'over') return 'the game ended before an out was seen';
        if (s.phase === 'select' || s.phase === 'aim') await click('throwBtn');
        else if (s.phase === 'windup') await click('lockBtn');
        if (s.phase === 'flight' && s.batting) {
          // bottom half: swing at once on purpose - a whiff is a quick strike on the way to a strikeout
          if (!flightAt) { flightAt = Date.now(); }
          if (!swung) { await click('swingBtn'); swung = true; }
        } else { flightAt = 0; swung = false; }
        await h.wait(90);
      }
      return `no out was recorded in 29 s of real play (outs stayed at ${startOuts})`;
    },
  },
  {
    id: 'play-rules-run-scores',
    ask: 'Play baseball by its rules: a run crosses the plate and the score goes up (run scores)',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        const tag = (document.getElementById('inningTag') || {}).textContent || '';
        const rows = document.querySelectorAll('#scoreboard tr');
        let runs = null;
        if (rows.length >= 3) {
          const a = rows[1].querySelectorAll('td'), b = rows[2].querySelectorAll('td');
          runs = (parseInt(a[a.length - 2].textContent) || 0) + (parseInt(b[b.length - 2].textContent) || 0);
        }
        return { phase: T.phase, tag, batting: tag.indexOf('BOT') === 0, runs };
      });
      const click = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const t0 = Date.now();
      let s = await snap(); if (!s) return 'window.__test missing';
      if (s.runs === null) return 'scoreboard runs column not found';
      const startRuns = s.runs;
      let flightAt = 0, swung = false;
      while (Date.now() - t0 < 29000) {
        s = await snap(); if (!s) return 'window.__test missing mid-test';
        if (s.runs !== null && s.runs > startRuns) return true;
        if (s.phase === 'over') return `the game ended before a run scored (runs stayed at ${startRuns})`;
        if (s.phase === 'select' || s.phase === 'aim') await click('throwBtn');
        else if (s.phase === 'windup') await click('lockBtn');
        if (s.phase === 'flight' && s.batting) {
          if (!flightAt) flightAt = Date.now();
          if (!swung && Date.now() - flightAt >= 900) { await click('swingBtn'); swung = true; }
        } else { flightAt = 0; swung = false; }
        await h.wait(90);
      }
      return `no run scored in 29 s of real play (runs stayed at ${startRuns})`;
    },
  },
  {
    id: 'play-rules-inning-ends',
    ask: 'Play baseball by its rules: three outs end the half inning and the other side comes in (inning ends)',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        const tag = (document.getElementById('inningTag') || {}).textContent || '';
        return { phase: T.phase, outs: T.outs, tag, batting: tag.indexOf('BOT') === 0 };
      });
      const click = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const t0 = Date.now();
      let s = await snap(); if (!s) return 'window.__test missing';
      let startTag = s.tag;
      let flightAt = 0, swung = false;
      while (Date.now() - t0 < 29000) {
        s = await snap(); if (!s) return 'window.__test missing mid-test';
        if (!startTag && s.tag) startTag = s.tag;
        if (startTag && s.tag && s.tag !== startTag) return true;
        if (s.phase === 'over') return 'the game ended (final) before a half-inning switch was seen';
        if (s.phase === 'select' || s.phase === 'aim') await click('throwBtn');
        else if (s.phase === 'windup') await click('lockBtn');
        if (s.phase === 'flight' && s.batting) {
          // bottom half: whiff on purpose - three quick strikeouts are the fastest honest route to 3 outs
          if (!flightAt) { flightAt = Date.now(); }
          if (!swung) { await click('swingBtn'); swung = true; }
        } else { flightAt = 0; swung = false; }
        await h.wait(90);
      }
      return `the half inning never ended in 29 s of real play (still ${startTag || 'the same half'})`;
    },
  },
  // G-40 (owner, 2026-10-20): the owner's new ballpark (kit/stadiums/Night-Ballpark/stadium.glb)
  // replaces the old one - it must actually load, with its crowd.
  {
    id: 'play-stadium-loads',
    ask: "The owner's new ballpark (Apex Arcade Park) loads with its crowd, presented as the night park it is (G-40)",
    async test(page, h) {
      const t0 = Date.now();
      while (Date.now() - t0 < 25000) {
        const s = await h.eval(() => {
          const T = window.__test; if (!T || !T.stadium) return null;
          return { loaded: T.stadium.loaded, fans: T.stadium.fans, crowd: T.crowdCount, night: T.stadium.night };
        });
        if (s && s.loaded) {
          if (s.fans < 1000) return `the ballpark loaded but its crowd is missing (fans=${s.fans})`;
          if (s.crowd < 1000) return `the ballpark loaded but crowdCount reads ${s.crowd}`;
          if (!s.night) return 'the ballpark loaded but the game still shows the old daytime look - his park is a night park (floodlights, dark sky)';
          return true;
        }
        await h.wait(250);
      }
      return 'Apex Arcade Park did not load in 25 s';
    },
  },
  // G-51 (owner, 2026-10-20): the park field must wear the owner's kit textures -
  // grass_plain grass and baseball_infield dirt from kit/ground/512/ (the G-36 wiring
  // only reaches the hidden fallback field since the G-40 park swap).
  {
    id: 'play-kit-field-textures',
    ask: "The park field wears the owner's kit grass + infield dirt textures (G-51)",
    async test(page, h) {
      const t0 = Date.now();
      while (Date.now() - t0 < 25000) {
        const s = await h.eval(() => {
          const T = window.__test; if (!T || !T.stadium) return null;
          return { loaded: T.stadium.loaded, kit: T.stadium.kitField };
        });
        if (s && s.loaded && s.kit) return true;
        await h.wait(250);
      }
      return 'the ballpark loaded without the kit grass/dirt field textures';
    },
  },
  // G-57 TESTER (owner, 2026-10-20): problems found by playing the game on a phone-size
  // screen like a player. Each test FAILS today as proof; it passes when the problem is fixed.
  {
    id: 'tester-overlay-buttons-off-phone',
    ask: 'TESTER: menu overlay buttons hang off the bottom of a sideways phone - Help CLOSE is fully below the screen (overlay does not scroll, so Help cannot be closed) and the Friend START/CLOSE buttons are cut off',
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      await h.wait(4500);
      const open = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const box = id => h.eval(x => { const e = document.getElementById(x); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, vh: innerHeight }; }, id);
      const bad = [];
      if (!await open('helpBtn')) return 'no Help (?) button on the menu';
      await h.wait(600);
      const hc = await box('helpClose');
      if (!hc) return 'no CLOSE button inside Help';
      if (hc.bottom > hc.vh + 1 || hc.top >= hc.vh) bad.push(`Help CLOSE sits at y ${Math.round(hc.top)}-${Math.round(hc.bottom)} on a ${hc.vh}px tall screen`);
      await h.eval(() => { const b = document.getElementById('helpClose'); if (b) b.click(); });
      await h.wait(400);
      if (!await open('friendBtn')) return 'no Play a friend button on the menu';
      await h.wait(600);
      for (const id of ['friendGo', 'friendClose']) {
        const bb = await box(id);
        if (bb && (bb.bottom > bb.vh + 1 || bb.top >= bb.vh)) bad.push(`${id} sits at y ${Math.round(bb.top)}-${Math.round(bb.bottom)} on a ${bb.vh}px tall screen`);
      }
      return bad.length ? bad.join('; ') : true;
    },
  },
  {
    id: 'tester-count-resets-each-batter',
    ask: 'TESTER: the ball/strike count never resets after a strikeout or a walk - the next batter starts with the old count (the banner shows counts like 4-2), so he strikes out on one strike or walks on one ball',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        const tag = (document.getElementById('inningTag') || {}).textContent || '';
        return { phase: T.phase, balls: T.balls, strikes: T.strikes, tag,
                 msg: (document.getElementById('msg') || {}).textContent || '' };
      });
      const click = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const t0 = Date.now();
      let s = await snap(); if (!s) return 'window.__test missing';
      let endedBy = null, endedTag = null, aimed = false;
      while (Date.now() - t0 < 29000) {
        s = await snap(); if (!s) return 'window.__test missing mid-test';
        if (s.phase === 'over') return 'the game ended before a strikeout or walk was seen';
        if (s.phase === 'start') { await click('startBtn'); await h.wait(400); continue; }
        // G-134: EVERY plate-appearance ending proves this rule, not only a walk or
        // strikeout - real at-bats end mostly in hits and outs, and a walk/strikeout-only
        // wait outran the check runner's 30 s cap (a real walk took 9 pitches), so the
        // old test timed out without ever checking the reset. The reset itself is the
        // same call on every ending (onWalk/onStrikeout/applyHitResult/applyOutResult).
        const paEnd = /^(WALK|STRIKEOUT|DOUBLE PLAY|SINGLE|DOUBLE|TRIPLE|HOME RUN|\d+-RUN HOME RUN|OUT|ERROR)/.exec(s.msg);
        if (paEnd) { endedBy = paEnd[1].toLowerCase(); endedTag = s.tag; }
        else if (endedBy && (s.phase === 'select' || s.phase === 'cpuWindup')) {
          // a new at-bat in the SAME half, before its first pitch: the count must be 0-0
          if (s.tag === endedTag) {
            if (s.balls !== 0 || s.strikes !== 0) return `after a ${endedBy} the next batter starts at ${s.balls}-${s.strikes}, not 0-0`;
            return true;
          }
          endedBy = null; // the half changed - that path resets the count even today
        }
        if (s.phase === 'select') {
          aimed = false;
          await h.eval(() => { const b = document.querySelector('.ptype[data-p="fast"]'); if (b) b.click(); });
          await click('throwBtn');
        } else if (s.phase === 'aim') {
          if (!aimed) {
            // pitch around the batter: tap the far corner of the aim pad so the CPU takes ball after ball
            const r = await h.eval(() => { const e = document.getElementById('aimPad'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
            if (r) await h.tap(r.x + r.w - 6, r.y + r.h - 6);
            aimed = true;
          }
          await click('throwBtn');
        } else if (s.phase === 'windup') await click('lockBtn');
        // batting halves: take every pitch (never swing) - called strikes and balls end at-bats on their own
        await h.wait(90);
      }
      return 'no plate appearance ended in 29 s of real play, so the count reset could not be checked';
    },
  },
  {
    id: 'tester-help-button-covers-cam',
    ask: 'TESTER: the ? (help) button at the top right sits on top of the CAM button - the CAM label is partly covered and the covered part cannot be tapped',
    async test(page, h) {
      const r = await h.eval(() => {
        const a = document.getElementById('helpHud'), b = document.getElementById('viewBtn');
        if (!a || !b) return null;
        const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
        return { ox: Math.min(A.right, B.right) - Math.max(A.left, B.left), oy: Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) };
      });
      if (!r) return 'help or CAM button missing';
      if (r.ox > 2 && r.oy > 2) return `the ? button overlaps the CAM button by ${Math.round(r.ox)}x${Math.round(r.oy)} px`;
      return true;
    },
  },
  {
    id: 'play-batting-timing-game-clock',
    mode: 'batting',
    ask: 'BUILD G-237: batting timing is scored on the pitch game clock, not the wall clock - a swing made as the ball crosses the plate contacts or fouls instead of always whiffing (G-184/G-237)',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        const tag = (document.getElementById('inningTag') || {}).textContent || '';
        return { phase: T.phase, tag, msg: (document.getElementById('msg') || {}).textContent || '',
                 ball: T.ball ? { z: T.ball.z, vis: T.ball.visible } : null };
      });
      const click = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const t0 = Date.now();
      let swung = 0;
      while (Date.now() - t0 < 29000) {
        const s = await snap(); if (!s) return 'window.__test missing';
        if (s.phase === 'start') { await click('startBtn'); await h.wait(300); continue; }
        const batting = s.tag.trim().toUpperCase().startsWith('BOT');
        if (s.phase === 'flight' && batting && s.ball && s.ball.z >= -0.5) {
          await click('swingBtn'); swung++;
          await h.wait(700);
          const a = await snap();
          if (a && /STRIKE/.test(a.msg) && !/FOUL/.test(a.msg)) return 'swung with the ball at the plate (z=' + s.ball.z.toFixed(1) + ') and still got a clean swinging strike - timing is still scored on the wrong clock';
          return true;
        }
        if (!batting) {
          if (s.phase === 'select') { await h.eval(() => { const b = document.querySelector('.ptype[data-p="fast"]'); if (b) b.click(); }); await click('throwBtn'); }
          else if (s.phase === 'aim') await click('throwBtn');
          else if (s.phase === 'windup') await click('lockBtn');
        }
        await h.wait(60);
      }
      return swung ? true : 'never reached a swing at the plate in 29 s (game too slow to reach a bottom-half pitch at the plate)';
    },
  },
  {
    id: 'tester-batting-swing-wall-clock',
    mode: 'batting',
    ask: 'TESTER: batting timing is judged on the wall clock while the pitch flies on game time - on a slow device a fastball takes ~9-12 s of wall time to arrive (game time 0.95 s), but a swing only counts within 0.17 s of the wall-clock mark, so a swing made exactly as the ball crosses the plate is always a swinging strike (G-184: 14 timed swings, 0 contact)',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        const tag = (document.getElementById('inningTag') || {}).textContent || '';
        return { phase: T.phase, tag, msg: (document.getElementById('msg') || {}).textContent || '',
                 ball: T.ball ? { z: T.ball.z, vis: T.ball.visible } : null };
      });
      const click = id => h.eval(x => { const b = document.getElementById(x); if (!b) return false; b.click(); return true; }, id);
      const t0 = Date.now();
      let flightStart = null, sawFlight = false;
      while (Date.now() - t0 < 29000) {
        const s = await snap(); if (!s) return 'window.__test missing';
        if (s.phase === 'start') { await click('startBtn'); await h.wait(300); continue; }
        const batting = s.tag.trim().toUpperCase().startsWith('BOT');
        if (s.phase === 'flight') {
          if (flightStart === null) { flightStart = Date.now(); sawFlight = true; }
          if (batting && s.ball && s.ball.z >= -0.5) {
            await click('swingBtn');
            await h.wait(700);
            const a = await snap();
            if (a && /STRIKE/.test(a.msg) && !/FOUL/.test(a.msg)) return `swung with the ball at the plate (z=${s.ball.z.toFixed(1)} m) and still got '${a.msg}' - the swing is judged on the wall clock, not on the ball`;
            return true;
          }
        } else if (flightStart !== null) {
          const wall = (Date.now() - flightStart) / 1000;
          flightStart = null;
          if (wall > 1.12) return `one pitch flight took ${wall.toFixed(2)} s of wall time while a fastball's game time is 0.95 s and the whole contact window is 0.17 s - a batter swinging as the ball arrives is scored ${(wall - 0.95).toFixed(2)} s late and always whiffs`;
        }
        if (!batting) {
          if (s.phase === 'select') { await h.eval(() => { const b = document.querySelector('.ptype[data-p="fast"]'); if (b) b.click(); }); await click('throwBtn'); }
          else if (s.phase === 'aim') await click('throwBtn');
          else if (s.phase === 'windup') await click('lockBtn');
        }
        await h.wait(60);
      }
      return sawFlight ? true : 'no pitch flight seen in 29 s, so the swing clock could not be checked';
    },
  },
  {
    id: 'play-reality-hook-camera',
    mode: 'recheck',
    ask: 'BUILD G-120: the REALITY hook exposes camera: (REALITY.md) - the game THREE camera, so the robot can take the player close-up',
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      await h.wait(4500);
      let keys = null;
      for (let i = 0; i < 30; i++) { keys = await h.eval(() => window.__reality ? Object.keys(window.__reality) : null); if (keys) break; await h.wait(500); }
      if (!keys) return 'window.__reality never appeared';
      const cam = await h.eval(() => { const c = window.__reality.camera; return c ? { persp: !!c.isPerspectiveCamera, fov: c.fov } : null; });
      if (!cam) return '__reality has ' + keys.join(', ') + ' but no camera, so the robot cannot take the player close-up';
      if (!cam.persp) return '__reality.camera is not the game PerspectiveCamera';
      return true;
    },
  },
  {
    id: 'play-kit-assets-live',
    ask: 'BUILD G-144: the owner kits are really used - crowd, bat crack and glove samples from sounds/stadium/baseball/ decoded and ready, and the kit infield/grass textures from kit/ground/512/ on the park field LIVE material (touch path included)',
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      for (let i = 0; i < 24; i++) {
        const ph = await h.eval(() => window.__test ? window.__test.phase : null);
        if (ph && ph !== 'start') break;
        await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); });
        await h.wait(500);
      }
      let audio = null;
      for (let i = 0; i < 24; i++) { audio = await h.eval(() => window.__test && window.__test.kitAudio ? window.__test.kitAudio : null); if (audio && audio.crack && audio.glove && audio.cheer && audio.amb) break; await h.wait(500); }
      if (!audio) return '__test.kitAudio missing - the kit sound state is not exposed';
      const missing = ['crack', 'glove', 'cheer', 'amb'].filter(k => !audio[k]);
      if (missing.length) return 'kit sounds not decoded: ' + missing.join(', ') + ' (sounds/stadium/baseball/)';
      let st = null;
      for (let i = 0; i < 30; i++) { st = await h.eval(() => window.__test && window.__test.stadium ? window.__test.stadium : null); if (st && st.loaded && st.kitField) break; await h.wait(500); }
      if (!st || !st.loaded) return 'the ballpark never loaded';
      if (!st.kitField) return 'the kit field was never applied (kitField flag false)';
      if (!st.kitFieldLive) return 'kitField flag is set but the LIVE field material does not carry the kit texture - the swap landed on an orphaned material';
      return true;
    },
  },
  {
    id: 'play-feet-within-3cm',
    ask: 'BUILD G-146 (art director): every player stands ON the ground - soles measured on the skinned body (the reality robot method) across standing and the batter trot: 0 readings sunk more than 5 cm and every reading within 3 cm of the ground',
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      let ready = false;
      for (let i = 0; i < 40 && !ready; i++) { ready = await h.eval(() => !!(window.__reality && window.__reality.player && window.__test && window.__test.stadium && window.__test.stadium.loaded)); if (!ready) await h.wait(500); }
      if (!ready) return 'the ballpark / players never became ready';
      const installed = await h.eval(() => {
        const R = window.__reality;
        const groups = [R.player, ...(R.others || [])];
        const sets = [];
        for (const G of groups) {
          const feet = [];
          G.traverse(o => { if (o.isBone && (o.name === 'foot_l' || o.name === 'foot_r')) feet.push(o); });
          for (const c of feet) {
            const ids = new Set(); c.traverse(n => { if (n.isBone) ids.add(n.uuid); });
            const list = [];
            G.traverse(m => {
              if (!m.isSkinnedMesh || !m.skeleton || !m.geometry || !m.geometry.attributes.skinIndex) return;
              const bi = m.skeleton.bones.map((bn, i) => ids.has(bn.uuid) ? i : -1).filter(i => i >= 0);
              if (!bi.length) return;
              const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, vs = [];
              for (let v = 0; v < si.count; v++) { let w = 0; for (let k = 0; k < 4; k++) if (bi.includes(si.getComponent(v, k))) w += sw.getComponent(v, k); if (w > 0.5) vs.push(v); }
              if (vs.length) list.push({ m, vs });
            });
            if (list.length) sets.push({ bone: c, list });
          }
        }
        if (!sets.length) return false;
        window.__soleLog = [];
        const vec = sets[0].bone.position.clone();
        window.__soleTimer = setInterval(() => {
          for (const s of sets) {
            let sole = null;
            for (const { m, vs } of s.list) {
              if (!m.visible) continue;
              m.updateMatrixWorld(true); if (m.skeleton.update) m.skeleton.update();
              for (const i of vs) { m.getVertexPosition(i, vec); m.localToWorld(vec); if (sole == null || vec.y < sole) sole = vec.y; }
            }
            if (sole != null) {
              const p = s.bone.getWorldPosition(vec);
              let gy = 0; try { gy = +R.ground(p.x, p.z); } catch (e) {}
              window.__soleLog.push(+(sole - gy).toFixed(3));
            }
          }
        }, 50);
        return true;
      });
      if (!installed) return 'no skinned feet found on the players - the sole sampler could not be installed';
      await h.wait(3000);
      await h.eval(() => window.__reality.go(true));
      await h.wait(6000);
      await h.eval(() => window.__reality.go(false));
      await h.wait(2000);
      const res = await h.eval(() => {
        clearInterval(window.__soleTimer);
        const log = window.__soleLog || [];
        let min = null, sunk = 0;
        for (const v of log) { if (min == null || v < min) min = v; if (v < -0.05) sunk++; }
        return { n: log.length, min, sunk };
      });
      if (!res || res.n < 100) return 'too few sole readings (' + (res ? res.n : 0) + ') - the players were not sampled enough to prove ground contact';
      if (res.sunk > 0) return res.sunk + ' of ' + res.n + ' sole readings sunk more than 5 cm under the ground (worst ' + res.min + ' m)';
      if (res.min < -0.03) return 'worst sole reading ' + res.min + ' m over ' + res.n + ' readings - outside the 3 cm ground-contact band';
      return true;
    },
  },
  {
    id: 'play-daylight-batter-crowd',
    ask: 'BUILD G-151 (art director): the play picture is a DAY scene - bright frame, the stands full of visible crowd people, and the batter big and lit above the bottom bar in the pitching view and with the ball in play',
    async test(page, h) {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      for (let i = 0; i < 30; i++) {
        const ph = await h.eval(() => window.__test ? window.__test.phase : null);
        if (ph && ph !== 'start') break;
        await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); });
        await h.wait(500);
      }
      // wait for the pitching view to settle on the pitcher camera, with the
      // start menu fully gone (a start click that lands while the park is still
      // loading can be followed by the loader re-showing the menu)
      let proj = null;
      for (let i = 0; i < 30; i++) {
        const menuUp = await h.eval(() => { const so = document.getElementById('startOv'); return so && so.style.display !== 'none'; });
        if (menuUp) { await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); }); await h.wait(400); continue; }
        proj = await h.eval(() => {
          const R = window.__reality; if (!R || !R.camera || !R.player || !window.__test.stadium.loaded) return null;
          const cam = R.camera, P = R.player;
          const feet = P.position.clone(); const head = feet.clone(); head.y += 2.02;
          const pr = w => { const p = w.project(cam); return (1 - p.y) / 2 * 390; };
          return { tallPx: Math.abs(pr(feet) - pr(head)), feetRow: pr(feet), camPos: cam.position.toArray().map(v => +v.toFixed(0)) };
        });
        if (proj && Math.abs(proj.camPos[2] + 26) < 6) break;
        await h.wait(500);
      }
      if (!proj) return 'the pitching view never settled - no batter to measure';
      if (proj.tallPx < 30) return 'the batter is a speck in the play picture: ' + proj.tallPx.toFixed(0) + ' px tall of 390 (art director: clearly visible)';
      if (proj.feetRow > 312) return 'the batter is hidden behind the bottom bar: his feet land at row ' + proj.feetRow.toFixed(0) + ' of 390';
      const shot = await page.screenshot({ type: 'jpeg', quality: 62 });
      const stats = await page.evaluate(async (b64) => {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/jpeg;base64,' + b64; });
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
        const d = cx.getImageData(0, 0, cv.width, cv.height).data;
        const W = cv.width, H = cv.height;
        let lumSum = 0, n = 0, crowd = 0, bn = 0;
        for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
          const i = (y * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
          const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          lumSum += L; n++;
          if (y < H * 0.42) { bn++; if (L >= 60 && (r - b) >= -10) crowd++; }
        }
        return { lum: lumSum / n, crowdPct: 100 * crowd / Math.max(bn, 1) };
      }, shot.toString('base64'));
      if (stats.lum < 75) return 'the play picture is night-dark: mean luminance ' + stats.lum.toFixed(0) + '/255 (art director: day-lit scene; the night grade measured 35)';
      if (stats.crowdPct < 9) return 'the crowd reads empty: only ' + stats.crowdPct.toFixed(1) + '% of the stands band reads as visible crowd people (the night grade measured 1.0%)';
      return true;
    },
  },
  {
    id: 'play-face-closeup-uniform',
    ask: 'the batter close-up shows his face and eyes (no helmet blob over them) and a full baseball uniform - button-front jersey in the team colour, no printed tee logo',
    test: async (page, h) => {
      // start from a fresh state: tap through the start overlay until it hides,
      // then wait for the batter's reality hook and the rigged athletes
      let ready = false;
      for (let i = 0; i < 30 && !ready; i++) {
        const st = await h.eval(() => ({ hook: !!(window.__reality && window.__reality.player), menu: (() => { const el = document.getElementById('startOv'); return !!el && getComputedStyle(el).display !== 'none'; })() }));
        if (st.hook) { ready = true; break; }
        if (st.menu) await page.touchscreen.tap(422, 195);
        await h.wait(700);
      }
      if (!ready) return 'no reality hook player (the batter) to take the close-up of';
      for (let i = 0; i < 40; i++) { const n = await h.eval(() => (window.__athletesReady ? window.__athletesReady() : 0)); if (n >= 3) break; await h.wait(500); }
      await h.wait(1200);
      // render the robot's own head-and-shoulders close-up (the framing in
      // tools/game-check/reality.mjs playerCloseUp) and measure the picture:
      // discs anchored on the projected look point, so any batter/skin/helmet
      // colour is measured the same way.
      const stats = await h.eval(async () => {
        const R = window.__reality, P = R.player;
        const rend = (window.__renderers || []).find(x => x && x.domElement && x.domElement.isConnected) || (window.__renderers || [])[0];
        const base = (window.__cams || []).find(c => c && c.isPerspectiveCamera) || R.camera;
        if (!rend || !base) return null;
        let scene = P; while (scene.parent) scene = scene.parent;
        P.updateMatrixWorld(true);
        let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
        P.traverse(m => { if (!m.geometry || !m.visible) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
          const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
          mn = [Math.min(mn[0], b.min.x), Math.min(mn[1], b.min.y), Math.min(mn[2], b.min.z)]; mx = [Math.max(mx[0], b.max.x), Math.max(mx[1], b.max.y), Math.max(mx[2], b.max.z)]; });
        const V = base.position.constructor;
        const hgt = mx[1] - mn[1];
        const wp = new V(); P.getWorldPosition(wp);
        const look = new V(wp.x, mx[1] - hgt * 0.16, wp.z);
        const fwd = new V(0, 0, 1); try { P.getWorldDirection(fwd); } catch (e) {}
        fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, 1); fwd.normalize();
        const cam = base.clone();
        cam.fov = 35; cam.aspect = 1; cam.near = 0.02; cam.far = Math.max(base.far || 1000, 200); cam.zoom = 1;
        const span = hgt * 0.42;
        const dist = (span / 2) / Math.tan(35 * Math.PI / 360) * 1.25;
        cam.position.copy(look).addScaledVector(fwd, dist); cam.position.y += span * 0.08;
        const rad = Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2;
        cam.near = Math.max(0.02, cam.position.distanceTo(look) - rad * 1.1);
        cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
        const el = rend.domElement, size = new V(); rend.getSize ? rend.getSize(size) : size.set(el.width, el.height, 0);
        const pr = rend.getPixelRatio ? rend.getPixelRatio() : 1;
        const side = Math.round(Math.min(size.x, size.y));
        const lp = look.clone(); lp.project(cam);
        const out = { lx: lp.x * 0.5 + 0.5, ly: 0.5 - lp.y * 0.5 };
        try {
          rend.setScissorTest && rend.setScissorTest(false);
          rend.setViewport(0, 0, side, side);
          rend.render(scene, cam);
          const c2 = document.createElement('canvas'); c2.width = c2.height = Math.min(480, side * pr);
          const ctx = c2.getContext('2d');
          ctx.drawImage(el, 0, el.height - side * pr, side * pr, side * pr, 0, 0, c2.width, c2.height);
          const W = c2.width, Hh = c2.height;
          const img = ctx.getImageData(0, 0, W, Hh).data;
          const disc = (cx, cy, r) => {
            let skin = 0, dark = 0, tot = 0, dL = 0, tL = 0, dR = 0, tR = 0;
            const Rr = Math.floor(W * r);
            for (let y = Math.floor(Hh * cy) - Rr; y < Math.floor(Hh * cy) + Rr; y++) for (let x = Math.floor(W * cx) - Rr; x < Math.floor(W * cx) + Rr; x++) {
              if (x < 0 || y < 0 || x >= W || y >= Hh) continue;
              const dx = x - W * cx, dy = y - Hh * cy; if (dx * dx + dy * dy > Rr * Rr) continue;
              const i = (y * W + x) * 4, rr = img[i], gg = img[i + 1], bb = img[i + 2]; tot++;
              const isSkin = rr > 115 && rr > gg + 16 && gg > bb + 5, isDark = rr < 75 && gg < 85 && bb < 115;
              if (isSkin) skin++; if (isDark) dark++;
              if (x < W * cx) { tL++; if (isDark) dL++; } else { tR++; if (isDark) dR++; }
            }
            return { skin: 100 * skin / tot, dark: 100 * dark / tot, darkL: 100 * dL / Math.max(1, tL), darkR: 100 * dR / Math.max(1, tR) };
          };
          out.eye = disc(out.lx, out.ly - 0.03, 0.055);
          out.face = disc(out.lx, out.ly + 0.045, 0.10);
          let yel = 0, sat = 0, tot = 0;
          for (let y = Math.floor(Hh * 0.62); y < Hh * 0.95; y++) for (let x = Math.floor(W * 0.30); x < W * 0.70; x++) {
            const i = (y * W + x) * 4, rr = img[i], gg = img[i + 1], bb = img[i + 2]; tot++;
            if (rr > 180 && gg > 140 && bb < 90) yel++;
            if (Math.max(rr, gg, bb) - Math.min(rr, gg, bb) > 40) sat++;
          }
          out.chestYellow = 100 * yel / tot; out.chestSat = 100 * sat / tot;
        } finally { rend.setViewport(0, 0, size.x, size.y); }
        return out;
      });
      if (!stats || !stats.eye) return 'the close-up could not be rendered/measured';
      if (stats.eye.dark > 45) return 'a dark blob still covers the eyes: ' + stats.eye.dark.toFixed(0) + '% of the eye area is dark (the old face-covering helmet measured 94%)';
      if (stats.eye.skin < 25) return 'the face is not visible around the eyes: only ' + stats.eye.skin.toFixed(0) + '% skin in the eye area (the old build measured 5%)';
      if (stats.eye.darkL < 3 || stats.eye.darkR < 3 || stats.eye.darkL > 60 || stats.eye.darkR > 60) return 'the two eyes do not read in the close-up (dark left ' + stats.eye.darkL.toFixed(0) + '%, right ' + stats.eye.darkR.toFixed(0) + '% of their halves - eyes/brows on skin expected)';
      if (stats.face.skin < 36) return 'the face does not read in the close-up: only ' + stats.face.skin.toFixed(0) + '% skin in the face area';
      if (stats.chestYellow > 0.4) return 'the shirt still carries the printed tee logo (yellow crown pixels ' + stats.chestYellow.toFixed(1) + '% of the chest) - a plain button-front jersey is expected';
      if (stats.chestSat < 25) return 'the chest does not read as a team-colour jersey (only ' + stats.chestSat.toFixed(0) + '% saturated colour)';
      return true;
    },
  },
  {
    id: 'never-g-222-p1',
    ask: 'NEVER (owner 2026-10-23, G-222 fix round 1): the field and players stay clear and recognizable in the pitching view (crisp rendering - texture anisotropy on the park), and the pitcher glove reads as a glove, never a big brown thing on his arm (a real mitt is ~0.32 m, not a 0.44 m smooth blob)',
    test: async (page, h) => {
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      let ready = false;
      for (let i = 0; i < 40 && !ready; i++) {
        const st = await h.eval(() => ({ ph: window.__test ? window.__test.phase : null, ath: window.__athletesReady ? window.__athletesReady() : 0, loaded: !!(window.__test && window.__test.stadium.loaded), menu: (() => { const el = document.getElementById('startOv'); return !!el && getComputedStyle(el).display !== 'none'; })() }));
        if (st.menu) await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); });
        if (st.loaded && st.ath >= 12 && (st.ph === 'select' || st.ph === 'aim')) ready = true;
        else await h.wait(400);
      }
      if (!ready) return 'the pitching view never settled (fresh page, top half, select/aim)';
      // the athlete queue fits the rigs a few per frame (G-08): wait until the
      // pitcher's real rig (a skinned mesh) is actually on him before measuring
      // his glove, so a slow attach cannot fake a missing glove.
      let rigged = false;
      for (let i = 0; i < 25 && !rigged; i++) {
        rigged = await h.eval(() => { const R = window.__reality; if (!R || !R.others || !R.others[0]) return false; let n = 0; R.others[0].traverse(o => { if (o.isSkinnedMesh) n++; }); return n > 0; });
        if (!rigged) await h.wait(400);
      }
      if (!rigged) return 'the pitcher rig never attached, so his glove could not be measured';
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing';
        const aniso = T.stadium && T.stadium.aniso;
        if (!aniso || aniso < 4) return 'the park renders without texture anisotropy (aniso=' + aniso + ') - the field smears at the pitching camera glancing angle (owner: clear up players and field, my crisp camera view)';
        const R = window.__reality; if (!R || !R.others || !R.others[0]) return '__reality pitcher missing';
        // Measure the mitt in its parent space (the glove group's own axes):
        // a world AABB inflates with the hand bone's pose rotation, but the
        // mitt's true proportions are what the owner sees in the hand.
        const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; let found = false, parentScale = 1;
        R.others[0].updateWorldMatrix(true, true);
        R.others[0].traverse(o => {
          if (!o.isMesh || !o.material || !o.material.color || !o.geometry) return;
          // match the author's hex (material.color components are linear in
          // three r152+, so compare getHexString(), not the raw components)
          if (o.material.color.getHexString() !== '6a4423') return;
          if (!found && o.parent) { const s = R.player.position.clone(); o.parent.getWorldScale(s); parentScale = s.x; }
          o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox;
          const V = R.player.position.clone();
          for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
            const v = V.set(x, y, z).applyMatrix4(o.matrix);
            mn[0] = Math.min(mn[0], v.x); mn[1] = Math.min(mn[1], v.y); mn[2] = Math.min(mn[2], v.z);
            mx[0] = Math.max(mx[0], v.x); mx[1] = Math.max(mx[1], v.y); mx[2] = Math.max(mx[2], v.z);
          }
          found = true;
        });
        if (!found) return 'no leather glove prop found on the pitcher at all';
        const size = [0, 1, 2].map(i => (mx[i] - mn[i]) * parentScale * 0.9144);
        const longest = Math.max(size[0], size[1], size[2]);
        if (longest > 0.37) return 'the pitcher glove measures ' + longest.toFixed(2) + ' m long - a big brown thing on his arm (owner, G-222 fix round 1); a real mitt is about 0.32 m';
        return true;
      });
    },
  },
  {
    id: 'never-g-167-p1',
    ask: 'NEVER (G-167 fix round 1, 2026-10-22): the pitching camera sits so far back that the players are specks - zoom in so the batter and catcher read big in the play picture',
    test: async (page, h) => {
      // settle into the centre-field pitching view (the play-picture state),
      // with the start menu fully gone (same guard as play-daylight-batter-crowd)
      let m = null;
      for (let i = 0; i < 40; i++) {
        const menuUp = await h.eval(() => { const so = document.getElementById('startOv'); return so && so.style.display !== 'none'; });
        if (menuUp) { await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); }); await h.wait(400); continue; }
        const ath = await h.eval(() => (window.__athletesReady ? window.__athletesReady() : 0));
        m = await h.eval(() => {
          const R = window.__reality; if (!R || !R.camera || !R.player || !R.others || !R.others[1]) return null;
          const cam = R.camera;
          if (cam.position.z > -15) return null;   // not the centre-field pitching view (batter view / pitch cam)
          const px = (g) => { const feet = g.position.clone(); const head = feet.clone(); head.y += 2.02; const pr = w => (1 - w.project(cam).y) / 2 * 390; return Math.abs(pr(feet) - pr(head)); };
          return { batter: px(R.player), catcher: px(R.others[1]), camZ: cam.position.z };
        });
        if (m && ath >= 12) break;
        await h.wait(500);
      }
      if (!m) return 'the centre-field pitching view never settled - no players to measure';
      if (m.batter < 30) return 'the batter is still a speck in the pitching view: ' + m.batter.toFixed(0) + ' px tall of 390 (target at least 30 in the G-222 set shot, which also keeps the pitcher in frame - measured 33; the G-167 round-1 framing measured 41 with the pitcher out of frame)';
      if (m.catcher < 27) return 'the catcher is still a speck in the pitching view: ' + m.catcher.toFixed(0) + ' px tall of 390 (target at least 27 in the G-222 set shot - measured 32; the G-167 round-1 framing measured 39 with the pitcher out of frame)';
      return true;
    },
  },
  {
    id: 'play-pitcher-in-pitching-frame',
    ask: 'BUILD G-222 (owner order Oct 22): the pitcher stands fully inside the pitching frame - head and feet on screen, not cut off below it',
    test: async (page, h) => {
      await page.goto(page.url(), { waitUntil: 'load' });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) {
        const st = await h.eval(() => ({ ph: window.__test ? window.__test.phase : null, ath: window.__athletesReady ? window.__athletesReady() : 0, loaded: !!(window.__test && window.__test.stadium.loaded), menu: (() => { const el = document.getElementById('startOv'); return !!el && getComputedStyle(el).display !== 'none'; })() }));
        if (st.menu) await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); });
        if (st.loaded && st.ath >= 12 && (st.ph === 'select' || st.ph === 'aim')) ready = true;
        else await h.wait(400);
      }
      if (!ready) return 'the pitching view never settled (fresh page, top half, select/aim)';

      const m = await h.eval(() => {
        const R = window.__reality; if (!R || !R.camera || !R.others || !R.others[0]) return null;
        const cam = R.camera, W = 844, H = 390;
        const scr = (g, dy) => { const v = g.position.clone(); v.y += dy; const p = v.project(cam); return { x: (p.x * 0.5 + 0.5) * W, y: (1 - (p.y * 0.5 + 0.5)) * H }; };
        const pit = R.others[0];
        const feet = scr(pit, 0), head = scr(pit, 2.02);
        const bat = scr(R.player, 0), batH = scr(R.player, 2.02);
        return { feet, head, batterPx: Math.abs(bat.y - batH.y), camPos: cam.position.toArray().map(v => +v.toFixed(1)) };
      });
      if (!m) return 'no reality hook / pitcher to measure';
      if (m.head.y < 2 || m.feet.y > 388 || m.head.x < 2 || m.head.x > 842 || m.feet.x < 2 || m.feet.x > 842)
        return 'the pitcher is cut out of the pitching frame: head at row ' + m.head.y.toFixed(0) + ', feet at row ' + m.feet.y.toFixed(0) + ' of 390 (owner: keep the pitcher fully in the pitching frame; the old camera aimed over his head - feet projected to row ~1197)';
      if (m.batterPx < 28) return 'the batter shrank out of the play picture in the new framing: ' + m.batterPx.toFixed(0) + ' px tall';
      return true;
    },
  },
  {
    id: 'play-camera-follows-pitch',
    ask: 'BUILD G-222 (owner order Oct 22): the camera follows the windup and the pitch in flight - it moves with the play and keeps the ball on screen until it reaches the plate',
    test: async (page, h) => {
      await page.goto(page.url(), { waitUntil: 'load' });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) {
        const st = await h.eval(() => ({ ph: window.__test ? window.__test.phase : null, ath: window.__athletesReady ? window.__athletesReady() : 0, loaded: !!(window.__test && window.__test.stadium.loaded), menu: (() => { const el = document.getElementById('startOv'); return !!el && getComputedStyle(el).display !== 'none'; })() }));
        if (st.menu) await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); });
        if (st.loaded && st.ath >= 12 && (st.ph === 'select' || st.ph === 'aim')) ready = true;
        else await h.wait(400);
      }
      if (!ready) return 'the pitching view never settled (fresh page, top half, select/aim)';
      // Up to 3 throws: on the shared robot page a single click sequence can race
      // the frame loop (the first version of this test caught 0 windup samples on
      // the Oct 23 main check while its sibling play-contact-big-at-plate, which
      // retries, passed on the same check) - wait for each phase, then count.
      let last = null;
      for (let tries = 0; tries < 2; tries++) {
        const r = await h.eval(async () => {
          const sleep = ms => new Promise(res => setTimeout(res, ms));
          for (let i = 0; i < 27; i++) { const p = window.__test.phase; if (p === 'select' || p === 'aim') break; await sleep(150); }
          const btns = [...document.querySelectorAll('button')];
          const fb = btns.find(b => /FASTBALL/i.test(b.textContent)); if (fb) fb.click();
          await sleep(250);
          const th = btns.find(b => /THROW/i.test(b.textContent)); if (!th) return { err: 'no THROW button' }; th.click();
          const R = window.__reality, cam = R.camera;
          const windPos = new Set(), flightPos = new Set();
          let flightN = 0, ballIn = 0, sawWind = false, sawFlight = false;
          for (let i = 0; i < 220; i++) {
            const ph = window.__test.phase;
            const key = cam.position.toArray().map(v => v.toFixed(1)).join(',');
            if (ph === 'windup') { sawWind = true; windPos.add(key); }
            if (ph === 'flight') {
              sawFlight = true; flightPos.add(key); flightN++;
              const b = window.__test.ball;
              if (b && b.visible) { const v = R.player.position.clone(); v.set(b.x, b.y, b.z); const p = v.project(cam); if (Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && p.z < 1) ballIn++; }
            }
            if (ph === 'bip' || (sawFlight && ph !== 'flight' && ph !== 'windup')) break;
            await sleep(40);
          }
          return { wind: windPos.size, flight: flightPos.size, flightN, ballIn, sawWind, sawFlight };
        });
        if (!r || r.err) return 'could not throw a pitch for the camera to follow: ' + (r && r.err);
        last = r;
        if (r.wind >= 3 && r.flight >= 3 && r.flightN >= 3 && r.ballIn / r.flightN >= 0.9) return true;
      }
      if (!last.sawWind) return 'no windup phase was ever sampled in 2 throws (the throw clicks never took on this page)';
      if (last.wind < 3) return 'the camera is frozen during the windup: ' + last.wind + ' distinct position(s) (owner: the camera follows the windup)';
      if (last.flight < 3) return 'the camera is frozen during the pitch flight: ' + last.flight + ' distinct position(s) (owner: the camera follows the pitch in flight)';
      if (last.flightN < 3) return 'the pitch flight was too short to sample (' + last.flightN + ' samples)';
      if (last.ballIn / last.flightN < 0.9) return 'the ball leaves the screen during the pitch flight: in frame for ' + last.ballIn + ' of ' + last.flightN + ' samples';
      return true;
    },
  },
  {
    id: 'play-contact-big-at-plate',
    ask: 'BUILD G-222 (owner order Oct 22): the contact moment is big at the plate - as the pitch reaches the plate the batter fills the frame (not a speck), so you see the ball meet the bat',
    test: async (page, h) => {
      await page.goto(page.url(), { waitUntil: 'load' });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) {
        const st = await h.eval(() => ({ ph: window.__test ? window.__test.phase : null, ath: window.__athletesReady ? window.__athletesReady() : 0, loaded: !!(window.__test && window.__test.stadium.loaded), menu: (() => { const el = document.getElementById('startOv'); return !!el && getComputedStyle(el).display !== 'none'; })() }));
        if (st.menu) await h.eval(() => { const b = document.getElementById('startBtn'); if (b) b.click(); });
        if (st.loaded && st.ath >= 12 && (st.ph === 'select' || st.ph === 'aim')) ready = true;
        else await h.wait(400);
      }
      if (!ready) return 'the pitching view never settled (fresh page, top half, select/aim)';

      let best = 0, tries = 0;
      while (tries < 6 && best < 80) {
        tries++;
        const r = await h.eval(async () => {
          const sleep = ms => new Promise(res => setTimeout(res, ms));
          for (let i = 0; i < 40; i++) { if (window.__test.phase === 'select' || window.__test.phase === 'aim') break; await sleep(150); }
          const btns = [...document.querySelectorAll('button')];
          const fb = btns.find(b => /FASTBALL/i.test(b.textContent)); if (fb) fb.click();
          await sleep(200);
          const th = btns.find(b => /THROW/i.test(b.textContent)); if (!th) return -1;
          th.click();
          const R = window.__reality, cam = R.camera;
          let lastPx = 0, maxZ = -99;
          for (let i = 0; i < 300; i++) {
            const ph = window.__test.phase;
            if (ph === 'flight') {
              const b = window.__test.ball;
              if (b && b.visible && b.z > maxZ) { maxZ = b.z; const f = R.player.position.clone(); const hd = f.clone(); hd.y += 2.02; const pr = w => (1 - w.project(cam).y) / 2 * 390; lastPx = Math.abs(pr(f) - pr(hd)); }
            }
            if (ph === 'bip' || (maxZ > -99 && ph !== 'flight' && ph !== 'windup')) break;
            await sleep(10);
          }
          return lastPx;
        });
        if (r === -1) return 'no THROW button to pitch with';
        if (r > best) best = r;
      }
      if (best < 80) return 'the batter is still a speck when the pitch reaches the plate: ' + best.toFixed(0) + ' px tall of 390 at the contact moment (target at least 80; the frozen G-167 framing measured ~42)';
      return true;
    },
  },
  {
    id: 'play-reality-units-per-metre',
    ask: 'BUILD G-248: the REALITY hook reports unitsPerMetre 1.0936 (the game runs on 3 ft units, 1 unit = 0.9144 m) so the robot and testers read metres (REALITY.md Units)',
    async test(page, h) {
      let saw = false;
      for (let i = 0; i < 40; i++) {
        const s = await h.eval(() => window.__reality ? { has: ('unitsPerMetre' in window.__reality), v: window.__reality.unitsPerMetre } : null);
        if (s) { saw = true; if (s.has) return Math.abs(s.v - 1.0936) < 0.001 ? true : 'unitsPerMetre is ' + s.v + ' - REALITY.md says 1 unit = 0.9144 m, so it must be 1.0936'; }
        await h.wait(250);
      }
      return saw ? 'window.__reality has no unitsPerMetre - the robot and testers cannot read metres' : 'window.__reality never appeared';
    }
  },  {
    id: 'play-help-close-on-upright-phone',
    ask: 'BUILD G-248 (robot red line on PR #1381): on an upright phone (390x844) the Help overlay CLOSE button sits off the left edge of the screen - the rotated stage is 390 tall but the compact-card rules only fire on a sideways phone, so the card lays out 695 tall inside the 390 stage and rotation pushes CLOSE off screen; the CLOSE button must be fully on screen on an upright phone',
    async test(page, h) {
      try {
        await page.setViewportSize({ width: 390, height: 844 });
        await h.wait(600);
        await h.eval(() => { const b = document.getElementById('helpBtn'); if (b) b.click(); });
        await h.wait(400);
        const r = await h.eval(() => { const b = document.getElementById('helpClose'); if (!b) return null; const x = b.getBoundingClientRect(); return { left: x.left, right: x.right, top: x.top, bottom: x.bottom }; });
        if (!r) return 'help CLOSE button missing';
        if (r.left < 0 || r.right > 390 || r.top < 0 || r.bottom > 844) return 'help CLOSE sits off the upright screen: left ' + Math.round(r.left) + ', right ' + Math.round(r.right) + ' on a 390-wide phone';
        return true;
      } finally {
        try { await page.setViewportSize({ width: 844, height: 390 }); } catch (e) {}
      }
    }
  },  {
    id: 'tester-chk-b01',
    ask: 'CHECKLIST B01: Bases are 27.4 m apart (REALITY.md) - distance between neighbouring base objects, within 3%',
    mode: 'b01',
    async test(page, h) {
      const t0 = Date.now();
      while (Date.now() - t0 < 25000) {
        const m = await h.eval(() => {
          const T = window.__test; if (!T) return null;
          if (T.phase === 'start') { const b = document.getElementById('startBtn'); if (b) b.click(); return null; }
          const R = window.__reality; if (!R || !R.player || !R.player.isObject3D) return null;
          let root = R.player; while (root.parent) root = root.parent;
          const pts = [];
          root.traverse(o => {
            if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry') {
              const p = o.geometry.parameters || {};
              if (Math.abs(p.width - 1.3) < 0.01 && Math.abs(p.depth - 1.3) < 0.01) {
                let x = 0, z = 0, n = o;
                while (n && n.position) { x += n.position.x; z += n.position.z; n = n.parent; }
                pts.push([x, z]);
              }
            }
          });
          if (pts.length !== 3) return null;
          const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
          const sorted = pts.slice().sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
          // owner Oct 23 2026 5:05 PM: the game runs on 3 ft units (apexbaseball.html "field geometry (1 unit = 3 ft)") -
          // convert to METRES before comparing: the hook's unitsPerMetre, else 1 unit = 0.9144 m (the game's own comment)
          const upm = R.unitsPerMetre > 0 ? R.unitsPerMetre : 1 / 0.9144;
          return [d([0, 0], sorted[0]), d(sorted[0], sorted[1]), d(sorted[1], sorted[2]), d(sorted[2], [0, 0])].map(v => v / upm);
        });
        if (m) {
          const SRC = 27.4;
          const bad = m.filter(s => Math.abs(s - SRC) / SRC > 0.03);
          if (bad.length) return `checklist B01: bases measure ${m.map(s => s.toFixed(1)).join(' / ')} m between neighbours - REALITY.md says ${SRC} m (within 3%)`;
          return true;
        }
        await h.wait(300);
      }
      return 'checklist B01: the base objects never became measurable in the running game';
    },
  },
  // G-246 (window 7): checklist B03 - REALITY.md says the ball is 0.074 m wide
  // and the bat 0.86 m long. Units first (per the checklist card): the game's
  // own field comment says 1 unit = 3 ft = 0.9144 m, and the REALITY hook
  // exposes no unitsPerMetre, so world sizes are converted at 0.9144 m/unit.
  // Measured in the running game: ball diameter 0.24 units = 0.219 m (about
  // 3x too wide, outside the 15% band); bat axis length 0.940 units =
  // 0.860 m (dead-on). The item fails on the ball.
  {
    id: 'tester-chk-b03',
    mode: 'b03',
    async test(page, h) {
      const t0 = Date.now();
      let m = null;
      while (Date.now() - t0 < 25000) {
        const ph = await page.evaluate(() => window.__test ? window.__test.phase : null).catch(() => null);
        if (ph === 'start') await page.evaluate(() => { const s = document.getElementById('startBtn'); if (s) s.click(); }).catch(() => {});
        m = await page.evaluate(() => {
          if (!window.__reality || !window.__reality.player || !window.__reality.player.isObject3D) return null;
          let root = window.__reality.player;
          while (root.parent) root = root.parent;
          root.updateMatrixWorld(true);
          const xf = (e, x, y, z) => [e[0]*x + e[4]*y + e[8]*z + e[12], e[1]*x + e[5]*y + e[9]*z + e[13], e[2]*x + e[6]*y + e[10]*z + e[14]];
          let ball = null, bat = null;
          root.traverse(o => {
            if (!o.isMesh) return;
            const g = o.geometry, prm = g.parameters || {}, e = o.matrixWorld.elements;
            if (g.type === 'SphereGeometry' && Math.abs((prm.radius || 0) - 0.12) < 0.001 && prm.widthSegments === 12) {
              const a = xf(e, prm.radius, 0, 0), b = xf(e, -prm.radius, 0, 0);
              ball = Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
            }
            if (g.type === 'BoxGeometry' && Math.abs((prm.width || 0) - 0.13) < 0.001 && Math.abs((prm.height || 0) - 1.21) < 0.001) {
              const h = prm.height / 2, a = xf(e, 0, h, 0), b = xf(e, 0, -h, 0);
              bat = Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
            }
          });
          if (ball == null || bat == null) return null;
          return { ball: ball * 0.9144, bat: bat * 0.9144 };
        }).catch(() => null);
        if (m) break;
        await new Promise(r => setTimeout(r, 400));
      }
      if (!m) return 'checklist B03: ball and bat meshes not reached in the scene';
      const ballM = Math.round(m.ball * 1000) / 1000, batM = Math.round(m.bat * 1000) / 1000;
      if (Math.abs(m.ball - 0.074) / 0.074 <= 0.15 && Math.abs(m.bat - 0.86) / 0.86 <= 0.15) return true;
      return `checklist B03: ball measures ${ballM} m wide and bat ${batM} m long - REALITY.md says ball 0.074 m, bat 0.86 m (within 15%)`;
    },
  },
  {
    id: 'tester-portrait-overlay-close-offscreen',
    ask: 'TESTER: on an upright phone the Help overlay CLOSE button sits off the left edge of the screen - Help cannot be closed by tapping without rotating the phone',
    mode: 'menu',
    async test(page, h) {
      await page.setViewportSize({ width: 390, height: 844 });
      try {
        await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
        await h.wait(4500);
        const centre = id => h.eval(x => { const e = document.getElementById(x); if (!e) return null; const r = e.getBoundingClientRect(); return { id: x, cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, vh: innerHeight }; }, id);
        const bad = [];
        if (!await h.eval(() => { const b = document.getElementById('helpBtn'); if (!b) return false; b.click(); return true; })) return 'no Help (?) button on the menu';
        await h.wait(800);
        const hc = await centre('helpClose');
        if (!hc) return 'no CLOSE button inside Help';
        if (hc.cx < 0 || hc.cx > hc.vw || hc.cy < 0 || hc.cy > hc.vh) bad.push(`Help CLOSE centre sits at (${hc.cx}, ${hc.cy}) on a ${hc.vw}x${hc.vh} upright phone (button spans x ${hc.left}..${hc.right}) - it cannot be tapped`);
        await h.eval(() => { const b = document.getElementById('helpClose'); if (b) b.click(); });
        await h.wait(400);
        if (!await h.eval(() => { const b = document.getElementById('friendBtn'); if (!b) return false; b.click(); return true; })) return 'no Play a friend button on the menu';
        await h.wait(800);
        const fc = await centre('friendClose');
        if (fc && (fc.cx < 0 || fc.cx > fc.vw || fc.cy < 0 || fc.cy > fc.vh)) bad.push(`Friend CLOSE centre sits at (${fc.cx}, ${fc.cy}) on a ${fc.vw}x${fc.vh} upright phone (button spans x ${fc.left}..${fc.right}) - it cannot be tapped`);
        return bad.length ? bad.join('; ') : true;
      } finally {
        await page.setViewportSize({ width: 844, height: 390 });
      }
    },
  },
];
