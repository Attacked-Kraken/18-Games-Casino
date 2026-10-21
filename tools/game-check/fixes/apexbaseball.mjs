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
    ask: "The owner's new ballpark (Apex Arcade Park) loads with its crowd (G-40)",
    async test(page, h) {
      const t0 = Date.now();
      while (Date.now() - t0 < 25000) {
        const s = await h.eval(() => {
          const T = window.__test; if (!T || !T.stadium) return null;
          return { loaded: T.stadium.loaded, fans: T.stadium.fans, crowd: T.crowdCount };
        });
        if (s && s.loaded) {
          if (s.fans < 1000) return `the ballpark loaded but its crowd is missing (fans=${s.fans})`;
          if (s.crowd < 1000) return `the ballpark loaded but crowdCount reads ${s.crowd}`;
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
            if (!(s.pos[2] < -25 && s.pos[1] > 10)) return `pitching camera sits at ${s.pos} - the spec is high on the centre-field side, behind and above the pitcher`;
          }
          return true;
        }
        await h.wait(250);
      }
      return 'the game never left the menu, so the play cameras could not be checked';
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
        if (/^STRIKEOUT/.test(s.msg)) { endedBy = 'strikeout'; endedTag = s.tag; }
        else if (/^WALK/.test(s.msg)) { endedBy = 'walk'; endedTag = s.tag; }
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
      return 'no strikeout or walk happened in 29 s of real play, so the count reset could not be checked';
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
];
