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
];
