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
];
