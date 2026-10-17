// Owner's fix list for Apex Soccer (JOB J6, 2026-10-16). See README.md in this folder.
// The owner's words: "The stadium is still not right - make it a real soccer stadium: stands all
// around, lights, a crowd. The players do not steal the ball - computer players must tackle and
// win the ball. Players do not play correctly - mark, spread out, pass and position like real soccer."
// Tests drive the game through window.__sc / window.__stadium hooks the game exposes for this list.
const sc = () => {
  const S = window.__sc;
  if (!S || !S.players || !S.ball) return 'game hooks missing (window.__sc)';
  return S;
};
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
        const S = sc(); if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, sharks = S.teams[1];
        if (G.st === 'goal' || G.st === 'restart') return 'wait';
        if (!B.owner || B.owner.team !== sharks) {
          // (re)arm: a Sharks midfielder carries the ball at halfway, play on
          const c = sharks.players[4];
          c.pos.set(6, 0, 0); c.vel.set(0, 0, 0); c.face = Math.PI;
          B.pos.set(5, 0.11, 0); B.vel.set(0, 0, 0); B.owner = c; B.intended = null; B.noPickup = 0;
          G.st = 'play'; G.kickoffWait = false;
        }
        return 'armed';
      };
      await h.eval(arm);
      let last = null;
      for (let i = 0; i < 22; i++) {
        await h.wait(1000);
        last = await h.eval(() => {
          const S = sc(); if (typeof S === 'string') return { err: S };
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
        const S = sc(); if (typeof S === 'string') return S;
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
      await h.wait(3000);
      return h.eval(() => {
        const S = sc(); if (typeof S === 'string') return S;
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
        const S = sc(); if (typeof S === 'string') return S;
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
        const S = sc(); if (typeof S === 'string') return S;
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
        const S = sc(); if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, sharks = S.teams[1];
        if (G.st === 'goal' || G.st === 'restart') return 'wait';
        if (!B.owner || B.owner.team !== sharks) {
          const c = sharks.players[4];
          c.pos.set(10, 0, 0); c.vel.set(0, 0, 0); c.face = Math.PI;
          B.pos.set(9, 0.11, 0); B.vel.set(0, 0, 0); B.owner = c; B.intended = null; B.noPickup = 0;
          G.st = 'play'; G.kickoffWait = false;
        }
        return 'armed';
      };
      await h.eval(arm);
      let last = 0;
      for (let i = 0; i < 16; i++) {
        await h.wait(1000);
        last = await h.eval(() => { const S = sc(); return typeof S === 'string' ? { err: S } : { p: S.stats.passes }; });
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
        const S = sc(); if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, comets = S.teams[0];
        for (const p of comets.players) { p.pos.set(p.hx, 0, p.hz); p.vel.set(0, 0, 0); }
        const carrier = comets.players.find((p) => p.role === 'FWD' && p !== S.H.player) || comets.players[6];
        carrier.pos.set(35, 0, -3);
        B.pos.set(35.8, 0.11, -3); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null; B.noPickup = 0;
        G.st = 'play'; G.kickoffWait = false;
        return true;
      });
      if (setupA !== true) return setupA;
      await h.wait(5000);
      const a = await h.eval(() => {
        const S = sc(); if (typeof S === 'string') return S;
        const out0 = S.teams[0].players.filter((p) => p.role !== 'GK');
        return out0.reduce((s, p) => s + p.pos.x, 0) / out0.length;
      });
      if (typeof a === 'string') return a;
      if (!(a > 0)) return `attacking team did not push up: average position x=${a.toFixed(1)} (own half) with the ball at +35`;
      // phase B: Sharks have the ball deep in the Comets third -> the block drops goal-side of the ball
      const setupB = await h.eval(() => {
        const S = sc(); if (typeof S === 'string') return S;
        const B = S.ball, G = S.G, sharks = S.teams[1];
        const carrier = sharks.players[4];
        carrier.pos.set(-35, 0, 3); carrier.vel.set(0, 0, 0); carrier.face = Math.PI;
        B.pos.set(-35.8, 0.11, 3); B.vel.set(0, 0, 0); B.owner = carrier; B.intended = null; B.noPickup = 0;
        G.st = 'play'; G.kickoffWait = false;
        return true;
      });
      if (setupB !== true) return setupB;
      await h.wait(5000);
      return h.eval(() => {
        const S = sc(); if (typeof S === 'string') return S;
        const B = S.ball;
        const out0 = S.teams[0].players.filter((p) => p.role !== 'GK')
          .sort((m, n) => Math.hypot(m.pos.x - B.pos.x, m.pos.z - B.pos.z) - Math.hypot(n.pos.x - B.pos.x, n.pos.z - B.pos.z));
        const block = out0.slice(2); // the two nearest engage the carrier; the rest form the block
        const bad = block.filter((p) => p.pos.x > B.pos.x - 1);
        if (bad.length) return `${bad.length} defenders stayed ahead of the ball (not goal-side) while defending deep`;
        return true;
      });
    },
  },
];
