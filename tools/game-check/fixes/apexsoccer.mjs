// Owner's fix list for Apex Soccer (JOB J6, 2026-10-16). See README.md in this folder.
// The owner's words: "The stadium is still not right - make it a real soccer stadium: stands all
// around, lights, a crowd. The players do not steal the ball - computer players must tackle and
// win the ball. Players do not play correctly - mark, spread out, pass and position like real soccer."
// Tests drive the game through window.__sc / window.__stadium hooks the game exposes for this list.
// NOTE: every function handed to h.eval runs ALONE in the page - it cannot see helpers
// defined in this file (the runner ships the function source, not its closure). So each
// eval'd function reads window.__sc for itself; a shared helper here crashed tests with
// 'sc is not defined' in the 2026-10-16 22:13 game check. Thresholds unchanged.
export default [
  {
    id: 'stadium-is-real',
    ask: 'The stadium is still not right - make it a real soccer stadium: stands all around, lights, a crowd',
    async test(page, h) {
      return h.eval(() => {
        const A = window.__stadium; if (!A) return 'the stadium kit did not load (old box stands still showing)';
        const r = A.report(), out = [];
        if (r.fans < 30000) out.push('only ' + r.fans + ' fans (venue sheet: 30,000+)');
        if (r.tiers < 2) out.push('one level of seats (sheet: 2 tiers)');
        if (!r.roof) out.push('no roof over the stands');
        if (r.screens < 2) out.push('only ' + r.screens + ' big screens (sheet: 2)');
        if (!r.lights || r.lights === 'none') out.push('no floodlights');
        return out.length ? out.join('; ') : true;
      });
    },
  },
  {
    id: 'ai-tackles-and-wins',
    ask: 'The players do not steal the ball - computer players must tackle and win the ball',
    async test(page, h) {
      const arm = () => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, sharks = S.teams[1];
        if (G.st === 'goal' || G.st === 'restart') return 'wait';
        if (B.owner) { S._looseT = 0; if (B.owner.team === sharks) return 'armed'; }
        else { // a pass or a won ball is still travelling: let it be collected before re-arming
          S._looseT = S._looseT || Date.now();
          if (Date.now() - S._looseT < 1500) return 'loose';
        }
        // (re)arm: a Sharks midfielder carries the ball at halfway, play on
        const c = sharks.players[4];
        c.pos.set(6, 0, 0); c.vel.set(0, 0, 0); c.face = Math.PI;
        B.pos.set(5, 0.11, 0); B.vel.set(0, 0, 0); B.owner = c; B.intended = null; B.noPickup = 0;
        G.st = 'play'; G.kickoffWait = false; S._looseT = 0;
        return 'armed';
      };
      await h.eval(arm);
      let last = null;
      for (let i = 0; i < 22; i++) {
        await h.wait(1000);
        last = await h.eval(() => {
          const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return { err: S };
          return { tw: S.stats.tacklesWon, bw: S.stats.ballsWon };
        });
        if (last.err) return last.err;
        if (last.tw >= 2 && last.bw >= 1) return true;
        await h.eval(arm);
      }
      return `defending AI won the ball ${last ? last.tw : 0}x and kept it ${last ? last.bw : 0}x in 22s (need 2 steals, 1 kept)`;
    },
  },
  {
    id: 'defenders-mark-men',
    ask: 'Players do not play correctly - mark like real soccer',
    async test(page, h) {
      const setup = await h.eval(() => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, sharks = S.teams[1], comets = S.teams[0];
        const carrier = sharks.players[4];
        carrier.pos.set(-35, 0, 4); carrier.vel.set(0, 0, 0); carrier.face = Math.PI;
        sharks.players[6].pos.set(-44, 0, -6); sharks.players[6].vel.set(0, 0, 0); // FWD pushed up
        sharks.players[3].pos.set(-40, 0, 12); sharks.players[3].vel.set(0, 0, 0);
        sharks.players[5].pos.set(-38, 0, -15); sharks.players[5].vel.set(0, 0, 0);
        B.pos.set(-35.8, 0.11, 4); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null; B.noPickup = 0;
        G.st = 'play'; G.kickoffWait = false;
        return true;
      });
      if (setup !== true) return setup;
      await h.wait(4000);
      return h.eval(() => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const sharks = S.teams[1], comets = S.teams[0], out = [];
        for (const a of sharks.players) {
          if (a.role === 'GK' || a.pos.x > -17.5) continue; // attackers in the Comets defensive third
          let bd = 1e9;
          for (const d of comets.players) { if (d.role === 'GK') continue; bd = Math.min(bd, Math.hypot(d.pos.x - a.pos.x, d.pos.z - a.pos.z)); }
          if (bd > 6) out.push(`an attacker at (${Math.round(a.pos.x)},${Math.round(a.pos.z)}) has no marker within 6m (nearest ${bd.toFixed(1)}m)`);
        }
        return out.length ? out.join('; ') : true;
      });
    },
  },
  {
    id: 'team-spreads-out',
    ask: 'Players do not play correctly - spread out like real soccer',
    async test(page, h) {
      const setup = await h.eval(() => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, comets = S.teams[0];
        const carrier = comets.players.find((p) => p.role === 'MID' && p !== S.H.player) || comets.players[4];
        for (const p of comets.players) { p.pos.set(p.hx, 0, p.hz); p.vel.set(0, 0, 0); }
        carrier.pos.set(0, 0, 0);
        B.pos.set(0, 0.11, 0); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null; B.noPickup = 0;
        G.st = 'play'; G.kickoffWait = false;
        return true;
      });
      if (setup !== true) return setup;
      await h.wait(3000);
      return h.eval(() => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const out0 = S.teams[0].players.filter((p) => p.role !== 'GK');
        const xs = out0.map((p) => p.pos.x), zs = out0.map((p) => p.pos.z);
        const xSpread = Math.max(...xs) - Math.min(...xs), zSpread = Math.max(...zs) - Math.min(...zs);
        if (zSpread < 40) return `team is bunched: only ${zSpread.toFixed(0)}m wide (need 40m+ of the 68m pitch)`;
        if (xSpread < 30) return `team is flat: only ${xSpread.toFixed(0)}m deep (need 30m+)`;
        return true;
      });
    },
  },
  {
    id: 'ai-builds-up-with-passes',
    ask: 'Players do not play correctly - pass like real soccer',
    async test(page, h) {
      const arm = () => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, sharks = S.teams[1];
        if (G.st === 'goal' || G.st === 'restart') return 'wait';
        if (B.owner) { S._looseT = 0; if (B.owner.team === sharks) return 'armed'; }
        else { // a pass is in flight: let the receiver collect it before re-arming
          S._looseT = S._looseT || Date.now();
          if (Date.now() - S._looseT < 2500) return 'loose';
        }
        const c = sharks.players[4];
        c.pos.set(10, 0, 0); c.vel.set(0, 0, 0); c.face = Math.PI;
        B.pos.set(9, 0.11, 0); B.vel.set(0, 0, 0); B.owner = c; B.intended = null; B.noPickup = 0;
        G.st = 'play'; G.kickoffWait = false; S._looseT = 0;
        return 'armed';
      };
      await h.eval(arm);
      let last = 0;
      for (let i = 0; i < 16; i++) {
        await h.wait(1000);
        last = await h.eval(() => { const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; return typeof S === 'string' ? { err: S } : { p: S.stats.passes }; });
        if (last.err) return last.err;
        if (last.p >= 3) return true;
        await h.eval(arm);
      }
      return `AI team completed only ${last.p} passes in 16s of possession (need 3+)`;
    },
  },
  {
    id: 'team-positioning',
    ask: 'Players do not play correctly - position like real soccer',
    async test(page, h) {
      // phase A: Comets have the ball deep in the Sharks half -> the whole team pushes up
      const setupA = await h.eval(() => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, comets = S.teams[0];
        for (const p of comets.players) { p.pos.set(p.hx, 0, p.hz); p.vel.set(0, 0, 0); }
        const carrier = comets.players.find((p) => p.role === 'MID' && p !== S.H.player) || comets.players[4];
        carrier.pos.set(30, 0, 0);
        B.pos.set(30.8, 0.11, 0); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null; B.noPickup = 0;
        G.st = 'play'; G.kickoffWait = false;
        return true;
      });
      if (setupA !== true) return setupA;
      for (let i = 0; i < 5; i++) { // keep the spell alive: if the spell breaks, the same midfielder retakes it at +30
        await h.wait(1000);
        await h.eval(() => { const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return;
          const B = S.ball, G = S.G, comets = S.teams[0];
          if (G.st === 'play' && (!B.owner || B.owner.team !== comets)) {
            const carrier = comets.players.find((p) => p.role === 'MID' && p !== S.H.player) || comets.players[4];
            carrier.pos.set(30, 0, 0); carrier.vel.set(0, 0, 0);
            B.pos.set(30.8, 0.11, 0); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null; B.noPickup = 0; } });
      }
      const a = await h.eval(() => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const out0 = S.teams[0].players.filter((p) => p.role !== 'GK');
        const defs = S.teams[0].players.filter((p) => p.role === 'DEF');
        return { team: out0.reduce((s, p) => s + p.pos.x, 0) / out0.length, line: defs.reduce((s, p) => s + p.pos.x, 0) / defs.length };
      });
      if (typeof a === 'string') return a;
      if (!(a.line > -18)) return `back line did not push up: defenders average x=${a.line.toFixed(1)} (anchors are -34) with the ball at +30`;
      if (!(a.team > -10)) return `attacking team did not push up: team average x=${a.team.toFixed(1)} with the ball at +30`;
      // phase B: Sharks have the ball deep in the Comets third -> the block drops goal-side of the ball
      const setupB = await h.eval(() => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, sharks = S.teams[1], comets = S.teams[0];
        for (const p of comets.players) { p.pos.set(p.hx, 0, p.hz); p.vel.set(0, 0, 0); }
        const carrier = sharks.players[4];
        carrier.pos.set(-35, 0, 3); carrier.vel.set(0, 0, 0); carrier.face = Math.PI;
        B.pos.set(-35.8, 0.11, 3); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null; B.noPickup = 0;
        G.st = 'play'; G.kickoffWait = false;
        return true;
      });
      if (setupB !== true) return setupB;
      for (let i = 0; i < 5; i++) { // keep the spell alive: if the spell breaks, the same midfielder retakes it at -35
        await h.wait(1000);
        await h.eval(() => { const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return;
          const B = S.ball, G = S.G, sharks = S.teams[1];
          if (G.st === 'play' && (!B.owner || B.owner.team !== sharks || B.pos.x < -44)) {
            const carrier = sharks.players[4];
            carrier.pos.set(-35, 0, 3); carrier.vel.set(0, 0, 0); carrier.face = Math.PI;
            B.pos.set(-35.8, 0.11, 3); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null; B.noPickup = 0; } });
      }
      return h.eval(() => {
        const S = (window.__sc && window.__sc.players && window.__sc.ball) ? window.__sc : 'game hooks missing (window.__sc)'; if (typeof S === 'string') return S;
        const B = S.ball;
        const out0 = S.teams[0].players.filter((p) => p.role !== 'GK')
          .sort((m, n) => Math.hypot(m.pos.x - B.pos.x, m.pos.z - B.pos.z) - Math.hypot(n.pos.x - B.pos.x, n.pos.z - B.pos.z));
        const block = out0.slice(2); // the two nearest engage the carrier; the rest form the block
        const bad = block.filter((p) => p.pos.x > B.pos.x - 1);
        if (bad.length > 1) return `${bad.length} defenders stayed ahead of the ball (not goal-side) while defending deep`;
        return true;
      });
    },
  },
  /* ================= PLAY TESTS (owner, JOB J6, 2026-10-17) =================
     These actually PLAY the game by soccer's rules (rules/soccer.md).
     They read the read-only window.__test snapshot the game exposes. */
  {
    id: 'play-ai-wins-ball-30s',
    ask: 'computer players win the ball back within 30 s',
    async test(page, h) {
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing (game too old)';
        return true; // hook check only; the timed steal is measured below
      }).then(async (hook) => {
        if (hook !== true) return hook;
        // Give the human team the ball at halfway, then watch the AI take it back.
        await h.eval(() => {
          const S = window.__sc; if (!S || !S.ball) return;
          const B = S.ball, G = S.G, comets = S.teams[0];
          const carrier = comets.players.find(p => p.role === 'MID') || comets.players[4];
          carrier.pos.set(0, 0, 0); carrier.vel.set(0, 0, 0);
          B.pos.set(0.8, 0.11, 0); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null;
          G.st = 'play'; G.kickoffWait = false;
        });
        const t0 = Date.now();
        while (Date.now() - t0 < 30000) {
          await h.wait(1000);
          const r = await h.eval(() => {
            const T = window.__test; if (!T) return { err: 'window.__test missing' };
            return { owner: T.ball.owner, state: T.state };
          });
          if (r.err) return r.err;
          if (r.owner === 'SHARKS') return true; // AI (Sharks) won it back
        }
        return 'AI did not win the ball back within 30 s';
      });
    },
  },
  {
    id: 'play-keep-positions',
    ask: 'players keep their positions (formation discipline, not everyone chasing)',
    async test(page, h) {
      await h.eval(() => {
        const S = window.__sc; if (!S || !S.ball) return;
        const B = S.ball, G = S.G, sharks = S.teams[1];
        const c = sharks.players[4];
        c.pos.set(20, 0, 0); c.vel.set(0, 0, 0);
        B.pos.set(20.8, 0.11, 0); B.vel.set(0, 0, 0); B.owner = c; B.intended = null;
        G.st = 'play'; G.kickoffWait = false;
      });
      await h.wait(5000); // let the shape settle for 5 s of play
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing';
        const defs = T.players.filter(p => p.team === 'COMETS' && p.role === 'DEF');
        if (!defs.length) return 'no COMETS defenders found';
        // Defenders should stay roughly goal-side: average x well behind the ball (ball at x=20).
        const avgX = defs.reduce((s, p) => s + p.x, 0) / defs.length;
        if (avgX > 5) return `defenders abandoned shape: avg x=${avgX.toFixed(1)} with ball at x=20 (chasing, not holding line)`;
        // Spread: defenders should not all be in one spot.
        const xs = defs.map(p => p.x), zs = defs.map(p => p.z);
        const spread = Math.max(...xs) - Math.min(...xs) + Math.max(...zs) - Math.min(...zs);
        if (spread < 8) return `defenders bunched together (spread ${spread.toFixed(1)}m) instead of holding a line`;
        return true;
      });
    },
  },
  {
    id: 'play-goal-restarts-centre',
    ask: 'a goal restarts from the centre spot',
    async test(page, h) {
      // Force a goal for the human team, then check the restart puts the ball at centre.
      await h.eval(() => {
        const S = window.__sc; if (!S || !S.ball) return;
        const B = S.ball, G = S.G, comets = S.teams[0];
        // Put the ball just over the Sharks goal line (Sharks defend x=+52).
        B.pos.set(52.5, 0.11, 0); B.vel.set(5, 0, 0); B.owner = null;
        G.st = 'play'; G.kickoffWait = false;
      });
      // Wait for the goal to register and the restart to be set up (up to 15 s).
      for (let i = 0; i < 15; i++) {
        await h.wait(1000);
        const r = await h.eval(() => {
          const T = window.__test; if (!T) return { err: 'window.__test missing' };
          return { state: T.state, bx: T.ball.x, bz: T.ball.z, score: T.score };
        });
        if (r.err) return r.err;
        if (r.score[0] >= 1 && Math.abs(r.bx) < 3 && Math.abs(r.bz) < 3) return true; // scored, ball back at centre
      }
      return 'after a goal the ball did not restart from the centre spot';
    },
  },
  {
    id: 'play-11v11',
    ask: '11 v 11 - ten outfield players plus a goalkeeper per team',
    async test(page, h) {
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing';
        const sizes = T.teamSizes;
        if (sizes[0] !== 11 || sizes[1] !== 11)
          return `wrong team sizes: ${sizes[0]} v ${sizes[1]} (rules: 11 v 11)`;
        for (const team of ['COMETS', 'SHARKS']) {
          const gk = T.players.filter(p => p.team === team && p.role === 'GK').length;
          if (gk !== 1) return `${team} has ${gk} goalkeepers (rules: 1)`;
        }
        return true;
      });
    },
  },
  {
    id: 'play-kickoff-from-centre',
    ask: 'kick-off starts from the centre spot',
    async test(page, h) {
      return h.eval(() => {
        const T = window.__test; if (!T) return 'window.__test missing';
        // At kickoff ('start' state or right after) the ball should be at the centre spot.
        if (T.state === 'start' || T.state === 'restart') {
          if (Math.abs(T.ball.x) > 2 || Math.abs(T.ball.z) > 2)
            return `ball not at centre for kick-off: (${T.ball.x}, ${T.ball.z})`;
        }
        return true;
      });
    },
  },
];
