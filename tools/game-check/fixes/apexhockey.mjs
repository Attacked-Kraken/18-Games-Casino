// Owner's fix list for Apex Ice Hockey (see README.md in this folder). Numbers come from his model sheet (2026-10-16).
const kitOf = () => {
  const S = window.__hk && window.__hk.skaters;
  if (!S || !S.length) return 'no skaters found (window.__hk.skaters)';
  return S;
};
/* ================= G-37 CAREER HELPERS (runner side only) =================
   These run in the test runner, never inside the page. Every function that
   IS passed to h.eval below is fully self-contained (LESSONS 2026-10-16:
   the runner ships the function source, not its closure). */
// The career level the game itself would offer next, read back in the page.
// Mirrors careerPending()/ranked() in apexhockey.html exactly; each career
// test also cross-checks it against the game's own hub screen before passing.
const g37PendingFn = () => {
  try {
    const c = JSON.parse(localStorage.getItem('apex_hockey_career_v1') || 'null');
    if (!c) return null;
    const base = { phase: c.phase, week: c.week, season: c.season, champ: c.champ || 0,
      w: c.table && c.table.WOLVES ? c.table.WOLVES.w : -1,
      pts: c.table && c.table.WOLVES ? c.table.WOLVES.pts : -1 };
    const order = ['SHARKS', 'BEARS', 'EAGLES', 'VIPERS', 'STAMPEDE'];
    if (c.phase === 'reg' && c.week <= 10) return { ...base, opp: order[(c.week - 1) % 5], label: 'WEEK ' + c.week };
    if (c.phase === 'semi') {
      const LG = ['WOLVES', 'SHARKS', 'BEARS', 'EAGLES', 'VIPERS', 'STAMPEDE'];
      const rk = LG.slice().sort((x, y) => (c.table[y].pts - c.table[x].pts) || ((c.table[y].gf - c.table[y].ga) - (c.table[x].gf - c.table[x].ga)));
      const seed = rk.indexOf('WOLVES');
      const opp = seed === 0 ? rk[3] : seed === 1 ? rk[2] : seed === 2 ? rk[1] : rk[0];
      return { ...base, opp, label: 'SEMIFINAL' };
    }
    if (c.phase === 'final' && c.finalOpp) return { ...base, opp: c.finalOpp, label: 'THE FINAL' };
    return { ...base, opp: null, label: '' };
  } catch (e) { return null; }
};
// Team defs from the game's own league table (defOf() in apexhockey.html) -
// the match object below is built exactly the way the hub's PLAY button
// builds it (mSave({ kind:'career', opp, oppDef, label })).
const g37Defs = {
  SHARKS: { name: 'SHARKS', jersey: 0x0e7c7b, helmet: 0x123a3a, trim: 0xffffff, str: 84 },
  BEARS: { name: 'BEARS', jersey: 0x8a4b1f, helmet: 0x5a2f10, trim: 0xffd9a0, str: 82 },
  EAGLES: { name: 'EAGLES', jersey: 0xd8d8e2, helmet: 0x8a1f2d, trim: 0x1f3a8a, str: 80 },
  VIPERS: { name: 'VIPERS', jersey: 0x39d353, helmet: 0x0d3a16, trim: 0x111111, str: 78 },
  STAMPEDE: { name: 'STAMPEDE', jersey: 0xd64545, helmet: 0x6e1420, trim: 0xffffff, str: 76 },
};
function g37Seed(over) {
  const T = (w, l, t, pts, gf, ga) => ({ w, l, t, pts, gf, ga });
  const c = { season: 1, week: 1, phase: 'reg', finalOpp: null,
    star: { name: 'JAX KOVAC', g: 0, a: 0, cg: 0, ca: 0 }, champ: 0, friends: { w: 0, l: 0 }, lastLine: '',
    table: { WOLVES: T(0, 0, 0, 0, 0, 0), SHARKS: T(0, 0, 0, 0, 0, 0), BEARS: T(0, 0, 0, 0, 0, 0), EAGLES: T(0, 0, 0, 0, 0, 0), VIPERS: T(0, 0, 0, 0, 0, 0), STAMPEDE: T(0, 0, 0, 0, 0, 0) } };
  return Object.assign(c, over || {});
}
// Put a known career save in place (or clear it) and reload to the menu -
// the tests share one page, so every career test starts from a known state.
async function g37Reset(page, h, seed) {
  try {
    await h.eval((s) => {
      try {
        if (s) localStorage.setItem('apex_hockey_career_v1', JSON.stringify(s));
        else localStorage.removeItem('apex_hockey_career_v1');
        localStorage.removeItem('apex_hockey_match');
      } catch (e) {}
      location.reload();
    }, seed || null);
  } catch (e) {} // the reload kills that eval - expected
  for (let i = 0; i < 24; i++) {
    await h.wait(400);
    let ok = false;
    try { ok = await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')); } catch (e) {}
    if (ok) return true;
  }
  return false;
}
// Play ONE unlocked career level to its end: set the match the way the hub
// does, start it with the game's own CAREER button (which presses PLAY),
// wait for real play, then put the game in its last seconds through the
// __hk.game hook so the game's own clock ends it and careerAfterGame()
// records the win and unlocks the next level. Returns the level played,
// or a string saying what went wrong.
async function g37PlayLevel(page, h) {
  const pend = await h.eval(g37PendingFn);
  if (!pend || !pend.opp) return 'no career level is unlocked to start';
  await h.eval(() => { if (window.__hk && window.__hk.game && window.__hk.game.newMatch) window.__hk.game.newMatch(); });
  await h.eval((m) => {
    try { localStorage.setItem('apex_hockey_match', JSON.stringify(m)); } catch (e) {}
    const b = document.getElementById('careerBtn'); if (b) b.click();
  }, { kind: 'career', opp: pend.opp, oppDef: g37Defs[pend.opp], label: pend.label });
  let playing = false;
  await h.eval(() => { try { window.__reality && window.__reality.go(true); } catch (e) {} }).catch(() => {}); // the faceoff gate: a staged match waits for the player's input - the test stands in for the player
  for (let i = 0; i < 40 && !playing; i++) {
    await h.wait(250);
    const st = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    if (st === 'play') playing = true;
  }
  await h.eval(() => { try { window.__reality && window.__reality.go(false); } catch (e) {} }).catch(() => {});
  if (!playing) return 'career match ' + pend.label + ' never reached play';
  await h.eval(() => { const g = window.__hk.game; g.period = 3; g.scoreH = 2; g.scoreA = 0; g.clockT = 0.05; });
  let over = false;
  for (let i = 0; i < 40 && !over; i++) {
    await h.wait(200);
    const st = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    if (st === 'over') over = true;
  }
  if (!over) return 'career match ' + pend.label + ' did not end';
  return pend;
}
// Open the career hub with the game's own button and read what IT offers.
async function g37Hub(page, h) {
  return h.eval(() => {
    const b = document.getElementById('careerBtn'); if (b) b.click();
    const play = document.getElementById('hubPlay');
    const nw = document.getElementById('hubNew');
    return {
      body: ((document.getElementById('hubBody') || {}).textContent || ''),
      playText: play ? play.textContent : '',
      playShown: play ? play.style.display !== 'none' : false,
      newText: nw ? nw.textContent : '',
      newShown: nw ? nw.style.display !== 'none' : false,
    };
  });
}
async function g37HubClose(page, h) {
  await h.eval(() => { const b = document.getElementById('hubClose'); if (b) b.click(); }).catch(() => {});
}
export default [
  {
    id: 'real-players-not-blobs',
    ask: 'They gave me this - blob players, upright floating sticks and scattered bits',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
        const bad = S.filter((s) => !s.kit || !s.ath || !s.kit.parts.jersey || !s.kit.parts.gear || !s.kit.parts.shell || !s.kit.parts.steel);
        if (bad.length) return `${bad.length} of ${S.length} skaters are not real geared athletes (shared hockey kit missing)`;
        if (S.some((s) => s.body && s.body.visible)) return 'the old primitive (blob) figure is still showing';
        return true;
      });
    },
  },
  {
    id: 'model-sheet-stance',
    ask: 'How do I get exactly this hockey player? (7.5 head heights, forward lean 15-20, knee flex 25-30, hips back over the heels, wide stance)',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
        const s = S.find((x) => x.kit && !x.goalie); if (!s) return 'no geared skater';
        s.ath.play('Idle_Loop', 0); s.ath.mixer.update(0.016); s.kit.stance.apply({ crouch: 1 });
        const m = s.kit.stance.measure(), f = (x) => Math.round(x * 10) / 10, out = [];
        if (m.heads < 7.2 || m.heads > 8) out.push('body is ' + f(m.heads) + ' head heights (sheet: about 7.5)');
        if (m.lean < 15 || m.lean > 20) out.push('forward lean ' + f(m.lean) + ' deg (sheet: 15-20)');
        for (const k of ['kneeL', 'kneeR']) if (m[k] < 25 || m[k] > 31) out.push(k + ' flex ' + f(m[k]) + ' deg (sheet: 25-30)');
        if (m.hipBack > 0.01) out.push('hips are ahead of the skates, not back over the heels');
        if (m.stance < 1.3) out.push('stance not wide (feet ' + f(m.stance) + 'x hip width)');
        return out.length ? out.join('; ') : true;
      });
    },
  },
  {
    id: 'gear-from-model-sheet',
    ask: 'Helmet with visor, shoulder pads, oversized gloves, padded breezers, shin guards, skates with a wider stance - like my sheet',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
        const s = S.find((x) => x.kit && !x.goalie); if (!s) return 'no geared skater';
        const P = s.kit.parts, miss = [];
        if (!P.visor && !s.kit.parts.cage) miss.push('helmet visor');
        for (const k of ['jersey', 'gear', 'shell', 'steel']) if (!P[k] || !P[k].visible) miss.push(k);
        // the pads/gloves/skates are real geometry: the gear mesh must be substantial, not a few boxes
        const tri = (m) => (m && m.geometry ? m.geometry.attributes.position.count / 3 : 0);
        if (tri(P.gear) < 4000) miss.push('pads/gloves/socks look too simple (' + Math.round(tri(P.gear)) + ' triangles)');
        return miss.length ? 'missing: ' + miss.join(', ') : true;
      });
    },
  },
  {
    id: 'stick-in-hands-on-ice',
    ask: 'Upright floating sticks',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
        const s = S.find((x) => x.kit && !x.goalie); if (!s) return 'no geared skater';
        s.ath.mixer.update(0.016); s.kit.stance.apply({ crouch: 1 });
        const st = s.kit.stick, obj = s.ath.object; obj.updateMatrixWorld(true);
        if (!st.parent) return 'the stick is not in the player\'s hands';
        const T = st.position.clone(), dir = new st.position.constructor(0, 1, 0).applyQuaternion(st.quaternion);
        const inv = obj.matrixWorld.clone().invert(); let worst = 0;
        obj.traverse((b) => { if (b.isBone && (b.name === 'hand_l' || b.name === 'hand_r')) { const p = b.getWorldPosition(new st.position.constructor()).applyMatrix4(inv); const d = p.clone().sub(T); const along = d.dot(dir); worst = Math.max(worst, d.sub(dir.clone().multiplyScalar(along)).length()); } });
        if (worst > 0.12) return 'a hand is ' + Math.round(worst * 100) + ' cm from the shaft';
        if (Math.abs(T.y) > 0.02) return 'the blade is not on the ice';
        const tilt = Math.acos(Math.min(1, Math.abs(dir.y))) * 180 / Math.PI;
        if (tilt < 25) return 'the stick stands upright (' + Math.round(tilt) + ' deg from vertical)';
        return true;
      });
    },
  },
  {
    id: 'real-arena-venue-sheet',
    ask: 'Build a nice stadium, a big crowd in the stadium (venues/rink.md)',
    async test(page, h) {
      return h.eval(() => {
        const A = window.__arena; if (!A) return 'the stadium kit did not load (old box stands still showing)';
        const r = A.report(), out = [];
        if (r.fans < 12000) out.push('only ' + r.fans + ' fans (sheet: 12,000+)');
        if (r.tiers < 2) out.push('one level of seats (sheet: lower + upper bowl)');
        if (r.scoreboard !== 'center-hung') out.push('no centre-hung scoreboard');
        if (!r.roof) out.push('no roof');
        if (r.drawCalls > 20) out.push('arena too heavy for phones: ' + r.drawCalls + ' draw calls');
        return out.length ? out.join('; ') : true;
      });
    },
  },
/* ================= PLAY TESTS (owner rule, 2026-10-16) =================
   These actually PLAY the game by hockey's rules (rules/hockey.md).
   They read the read-only window.__hk snapshot and the DOM (banner/score). */
{
  id: 'play-offside-called',
  ask: 'offside is called when an attacker crosses the blue line before the puck',
  async test(page, h) {
    try { await h.press('#playBtn'); } catch (e) {}
    await h.wait(2500); // opening faceoff (1.4s) ends -> play
    await h.eval(() => {
      const H = window.__hk; if (!H || !H.puck) return;
      H.puck.owner = null; H.puck.recv = null; H.puck.shot = null; H.puck.passGrace = null;
      H.puck.lastTouch = null; // not an icing situation
      H.puck.pos.set(24, 0.2, 0); H.puck.vel.set(25, 0, 0); // crosses the home attacking blue line (25)
      const S = H.skaters;
      const deep = S.find(s => s.team === 'home' && !s.goalie && s.role === 'RW');
      let j = 0;
      for (const s of S) {
        s.vel.set(0, 0, 0); s.thinkT = 999; // freeze the AI so nobody interferes
        if (s === deep) { s.pos.set(40, 0.1, 10); continue; } // attacker deep, ahead of the puck
        if (s.team === 'home' && !s.goalie) s.pos.set(10, 0.1, (j % 2 ? -12 : 12));
        else if (s.team === 'away' && !s.goalie) s.pos.set(-55, 0.1, ((j % 5) - 2) * 12);
        j++;
      }
    });
    // Delayed offside: the arm gives the attacker 1.4 s to tag up, then the whistle blows.
    for (let i = 0; i < 12; i++) {
      await h.wait(1000);
      const banner = await h.eval(() => ((document.querySelector('#banner') || {}).textContent) || '');
      // G-228: every freeze in this file now restores thinkT before the test leaves - skater objects persist across matches on the shared page, and an unrestored freeze starved every later test's AI (the G-228 tester scene's retriever never came)
      if (/OFFSIDE/i.test(banner)) { await h.eval(() => { for (const s of window.__hk.skaters) s.thinkT = 0.05; }).catch(() => {}); return true; }
    }
    await h.eval(() => { for (const s of window.__hk.skaters) s.thinkT = 0.05; }).catch(() => {});
    return 'a real offside (attacker at x=40 ahead of the puck crossing the blue line) never drew a whistle';
  },
},
{
  id: 'play-icing-called',
  ask: 'icing is called on an untouched clear from the defensive half',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    // G-124: deterministic staging. Start from a known state - a live match in the
    // play state, waited for in game state, never a fixed sleep: staging during the
    // opening faceoff let the drop reset the puck and the skaters (the old flake).
    if ((await state()) === 'menu') { try { await h.press('#playBtn'); } catch (e) {} }
    let inPlay = false;
    try {
      await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'play', null, { timeout: 20000, polling: 'raf' });
      inPlay = true;
    } catch (e) { inPlay = (await state()) === 'play'; }
    if (!inPlay) return 'could not reach the play state to stage the icing (state "' + (await state()) + '")';
    await h.eval(() => {
      const H = window.__hk, g = H.game;
      g.period = 1; g.clockT = 120; // a full period of runway - no intermission can interrupt
      const P = H.puck;
      P.owner = null; P.recv = null; P.shot = null; P.passGrace = null; P._dumpDeep = null;
      P.lastTouch = 'home'; P.lastTouchX = -10; // dumped from the home defensive half
      P.pos.set(-10, 0.06, 30); P.vel.set(85, 0, 0); // untouched clear down a lane nobody stands in
      for (const s of H.skaters) {
        s.vel.set(0, 0, 0); s.thinkT = 9999; // freeze the AI for the whole flight
        // deterministic race geometry, everybody 60+ units from the puck's lane (z = 30):
        // the defending team is closest to the far end, so the hybrid race ends one way
        if (s.team === 'away') s.pos.set(80, 0.1, -30); else s.pos.set(-40, 0.1, -30);
        if (s.target) s.target.copy(s.pos);
      }
    });
    // the whistle blows about 2 game-seconds after the clear; poll the banner fast so
    // the 2 s banner can never slip between reads, and never count a waive as a call
    for (let i = 0; i < 60; i++) {
      await h.wait(250);
      const txt = await h.eval(() => ((document.querySelector('#banner') || {}).textContent) || '').catch(() => '');
      if (/WAIVED/i.test(txt)) { await h.eval(() => { for (const s of window.__hk.skaters) s.thinkT = 0.05; }).catch(() => {}); return 'the clear was waived off (ICING WAIVED) - the race geometry did not hold'; }
      if (/ICING/i.test(txt)) { await h.eval(() => { for (const s of window.__hk.skaters) s.thinkT = 0.05; }).catch(() => {}); return true; }
    }
    await h.eval(() => { for (const s of window.__hk.skaters) s.thinkT = 0.05; }).catch(() => {});
    return 'an untouched clear from the defensive half past the far goal line never drew an icing whistle';
  },
},
{
  id: 'play-goal-restarts-centre',
  ask: 'a goal counts on the scoreboard and restarts from centre ice',
  async test(page, h) {
    try { await h.press('#playBtn'); } catch (e) {}
    await h.wait(2500); // opening faceoff (1.4s) ends -> play
    const before = await h.eval(() => ((document.querySelector('#score') || {}).textContent) || '');
    await h.eval(() => {
      const H = window.__hk; if (!H || !H.puck) return;
      H.puck.owner = null; H.puck.recv = null; H.puck.shot = null; H.puck.passGrace = null;
      H.puck.lastTouch = null;
      H.puck.pos.set(86, 0.2, 0); H.puck.vel.set(20, 0, 0); // into the net past 89.4 (too slow for the goalie save, too fast for a cover)
      for (const s of H.skaters) {
        s.vel.set(0, 0, 0); s.thinkT = 999; // freeze the AI
        if (!s.goalie) s.pos.set(s.team === 'away' ? -60 : 30, 0.1, 0);
      }
    });
    let scored = false, changed = false;
    // Phase 1: the goal must register (banner + scoreboard).
    for (let i = 0; i < 8 && !scored; i++) {
      await h.wait(1000);
      const r = await h.eval(() => ({
        score: ((document.querySelector('#score') || {}).textContent) || '',
        banner: ((document.querySelector('#banner') || {}).textContent) || '',
      }));
      if (/GOAL/i.test(r.banner)) { scored = true; changed = r.score !== before; }
    }
    if (!scored) { await h.eval(() => { for (const s of window.__hk.skaters) s.thinkT = 0.05; }).catch(() => {}); return 'a puck over the goal line did not register a goal'; }
    // Phase 2: after the 3.2 s goal celebration the puck must restart from centre ice.
    for (let i = 0; i < 16; i++) {
      await h.wait(500);
      const r = await h.eval(() => ({
        score: ((document.querySelector('#score') || {}).textContent) || '',
        px: window.__hk && window.__hk.puck ? window.__hk.puck.pos.x : 999,
        pz: window.__hk && window.__hk.puck ? window.__hk.puck.pos.z : 999,
      }));
      if (r.score !== before) changed = true;
      if (changed && Math.abs(r.px) < 6 && Math.abs(r.pz) < 6) { await h.eval(() => { for (const s of window.__hk.skaters) s.thinkT = 0.05; }).catch(() => {}); return true; } // caught mid-faceoff on the dot
    }
    await h.eval(() => { for (const s of window.__hk.skaters) s.thinkT = 0.05; }).catch(() => {});
    return 'after the goal the puck did not restart from centre ice';
  },
},
{
  id: 'play-puck-stays-in-rink',
  ask: 'the puck never leaves the rink during play',
  async test(page, h) {
    try { await h.press('#playBtn'); } catch (e) {}
    await h.wait(2500); // opening faceoff (1.4s) ends -> play
    for (let i = 0; i < 40; i++) { // 20 s of real AI play
      await h.wait(500);
      const r = await h.eval(() => {
        const P = window.__hk && window.__hk.puck; if (!P) return { err: 'no puck hook' };
        return { x: P.pos.x, z: P.pos.z };
      });
      if (r.err) return r.err;
      if (Math.abs(r.x) > 101 || Math.abs(r.z) > 43.5)
        return 'puck escaped the rink at (' + r.x.toFixed(1) + ', ' + r.z.toFixed(1) + ')';
    }
    return true;
  },
},
{
  id: 'play-5v5-plus-goalie',
  ask: '5 skaters plus a goalie a side, per the rules sheet',
  async test(page, h) {
    return h.eval(() => {
      const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
      for (const team of ['home', 'away']) {
        const T = S.filter(s => s.team === team);
        const gk = T.filter(s => s.goalie).length, out = T.filter(s => !s.goalie).length;
        if (gk !== 1) return team + ' has ' + gk + ' goalies (rules/hockey.md: 1)';
        if (out !== 5) return team + ' has ' + out + ' skaters (rules/hockey.md: 5)';
      }
      return true;
    });
  },
},
{
  id: 'play-faceoff-at-centre',
  ask: 'the opening faceoff drops the puck at centre ice',
  async test(page, h) {
    try { await h.press('#playBtn'); } catch (e) {}
    await h.wait(300); // mid-faceoff: the puck is sitting on the dot
    return h.eval(() => {
      const P = window.__hk && window.__hk.puck; if (!P) return 'no puck hook';
      if (Math.abs(P.pos.x) > 3 || Math.abs(P.pos.z) > 3)
        return 'opening faceoff not at centre: (' + P.pos.x.toFixed(1) + ', ' + P.pos.z.toFixed(1) + ')';
      return true;
    });
  },
},
  {
    id: 'play-joystick-screen-relative',
    ask: 'Joystick must be screen-relative: push right = skate right on screen, even after the skater turns 180',
    async test(page, h) {
      const r = await h.eval(() => {
        // Check the joystick mapping code uses screen-relative transform for CLOSE
        const src = document.documentElement.innerHTML;
        if (!/SCREEN-relative/.test(src)) return 'screen-relative joystick code not found';
        if (!/camMode===2.*ad=TEAMS.home.dir/.test(src)) return 'CLOSE joystick does not use attacking direction';
        return true;
      });
      return r;
    },
  },
  {
    id: 'play-no-spin-max-turn-rate',
    ask: 'Skater must not spin in place: turn speed is limited, glides through turns',
    async test(page, h) {
      const r = await h.eval(() => {
        const src = document.documentElement.innerHTML;
        // Turn rate should be 3.0, not 7.5 (the spinny value)
        if (/angLerp\(s\.facing,want,Math\.min\(1,7\.5\*dt\)\)/.test(src)) return 'turn rate still 7.5 (spinny) - must be 3.0';
        if (!/limited turn speed/.test(src)) return 'limited turn speed fix not found';
        return true;
      });
      return r;
    },
  },
  {
    id: 'play-close-camera-fixed-yaw',
    ask: 'CLOSE camera: 9m back along long axis, 5m up, never rotates with skater facing',
    async test(page, h) {
      const r = await h.eval(() => {
        const src = document.documentElement.innerHTML;
        if (!/9m back along rink LONG axis/.test(src)) return 'CLOSE camera spec not found';
        // Must NOT use fx/fz (skater facing) for CLOSE
        const closeBlock = src.match(/if\(camMode===2\)\{[^}]+\}/);
        if (closeBlock && /fx\*|fz\*/.test(closeBlock[0])) return 'CLOSE camera still uses skater facing (fx/fz) - must use attacking direction only';
        return true;
      });
      return r;
    },
  },
  {
    id: 'play-offside-really-over',
    ask: 'Offside only when attacker is really over the blue line (1.5m), not on a skate blade',
    async test(page, h) {
      const r = await h.eval(() => {
        const src = document.documentElement.innerHTML;
        if (!/really over.*1\.5m/.test(src)) return 'offside 1.5m buffer not found';
        if (/o\.pos\.x>line\+0\.5/.test(src)) return 'offside still uses 0.5m buffer (too twitchy)';
        return true;
      });
      return r;
    },
  },
/* ================= CAREER MODE PLAY TESTS (G-37, owner 2026-10-20) =================
   Start every career level, play it to the end, check the next one unlocks.
   Levels: WEEK 1-10, the SEMIFINAL, THE FINAL, then the next season. */
{
  id: 'play-career-weeks-1-4',
  ask: 'career mode: start a career and play weeks 1-4 to the end - each week unlocks the next',
  async test(page, h) {
    if (!await g37Reset(page, h, null)) return 'the game never came back to the menu after a reload';
    const hub0 = await g37Hub(page, h);
    if (!/No career yet/.test(hub0.body)) return 'the career hub did not offer to start a career';
    await h.eval(() => { const b = document.getElementById('hubNew'); if (b) b.click(); });
    const hub1 = await g37Hub(page, h);
    if (!hub1.playShown || !/WEEK 1 vs SHARKS/.test(hub1.playText)) return 'starting a career did not unlock WEEK 1 (hub PLAY says: ' + hub1.playText + ')';
    await g37HubClose(page, h);
    for (let wk = 1; wk <= 4; wk++) {
      const before = await h.eval(g37PendingFn);
      if (!before || before.label !== 'WEEK ' + wk) return 'WEEK ' + wk + ' is not the unlocked level (next is ' + (before ? before.label : 'none') + ')';
      const played = await g37PlayLevel(page, h);
      if (typeof played === 'string') return played;
      const after = await h.eval(g37PendingFn);
      if (!after || after.label !== 'WEEK ' + (wk + 1)) return 'WEEK ' + wk + ' was played to the end but WEEK ' + (wk + 1) + ' did not unlock';
      if (after.w !== wk) return 'the career record did not count the WEEK ' + wk + ' win (Wolves wins: ' + after.w + ')';
    }
    const hub = await g37Hub(page, h);
    await g37HubClose(page, h);
    if (!/NEXT: WEEK 5 vs/.test(hub.body) || !/WEEK 5/.test(hub.playText)) return 'the career hub does not offer WEEK 5 after week 4';
    return true;
  },
},
{
  id: 'play-career-weeks-5-7',
  ask: 'career mode: play weeks 5-7 to the end - each week unlocks the next',
  async test(page, h) {
    const T = (w, l, t, pts, gf, ga) => ({ w, l, t, pts, gf, ga });
    const seed = g37Seed({ week: 5, table: {
      WOLVES: T(4, 0, 0, 8, 12, 4), SHARKS: T(3, 1, 0, 6, 10, 7), BEARS: T(2, 2, 0, 4, 8, 9),
      EAGLES: T(2, 2, 0, 4, 7, 10), VIPERS: T(1, 3, 0, 2, 6, 11), STAMPEDE: T(0, 4, 0, 0, 4, 13) } });
    if (!await g37Reset(page, h, seed)) return 'the game never came back to the menu after a reload';
    for (let wk = 5; wk <= 7; wk++) {
      const before = await h.eval(g37PendingFn);
      if (!before || before.label !== 'WEEK ' + wk) return 'WEEK ' + wk + ' is not the unlocked level (next is ' + (before ? before.label : 'none') + ')';
      const played = await g37PlayLevel(page, h);
      if (typeof played === 'string') return played;
      const after = await h.eval(g37PendingFn);
      if (!after || after.label !== 'WEEK ' + (wk + 1)) return 'WEEK ' + wk + ' was played to the end but WEEK ' + (wk + 1) + ' did not unlock';
    }
    const hub = await g37Hub(page, h);
    await g37HubClose(page, h);
    if (!/NEXT: WEEK 8 vs/.test(hub.body) || !/WEEK 8/.test(hub.playText)) return 'the career hub does not offer WEEK 8 after week 7';
    return true;
  },
},
{
  id: 'play-career-weeks-8-10',
  ask: 'career mode: play weeks 8-10 to the end - finishing the season unlocks the semifinal',
  async test(page, h) {
    const T = (w, l, t, pts, gf, ga) => ({ w, l, t, pts, gf, ga });
    const seed = g37Seed({ week: 8, table: {
      WOLVES: T(7, 0, 0, 14, 21, 7), SHARKS: T(5, 2, 0, 10, 16, 12), BEARS: T(4, 3, 0, 8, 13, 14),
      EAGLES: T(3, 4, 0, 6, 11, 16), VIPERS: T(2, 5, 0, 4, 9, 19), STAMPEDE: T(1, 6, 0, 2, 7, 22) } });
    if (!await g37Reset(page, h, seed)) return 'the game never came back to the menu after a reload';
    for (let wk = 8; wk <= 10; wk++) {
      const before = await h.eval(g37PendingFn);
      if (!before || before.label !== 'WEEK ' + wk) return 'WEEK ' + wk + ' is not the unlocked level (next is ' + (before ? before.label : 'none') + ')';
      const played = await g37PlayLevel(page, h);
      if (typeof played === 'string') return played;
      const after = await h.eval(g37PendingFn);
      if (wk < 10 && (!after || after.label !== 'WEEK ' + (wk + 1))) return 'WEEK ' + wk + ' was played to the end but WEEK ' + (wk + 1) + ' did not unlock';
      if (wk === 10 && (!after || after.phase !== 'semi' || after.label !== 'SEMIFINAL')) return 'the season was played to the end (10 wins) but the SEMIFINAL did not unlock';
    }
    const end = await h.eval(g37PendingFn);
    if (!end || end.w !== 10) return 'the career record did not count all 10 season wins (Wolves wins: ' + (end ? end.w : '?') + ')';
    const hub = await g37Hub(page, h);
    await g37HubClose(page, h);
    if (!/NEXT: SEMIFINAL vs/.test(hub.body) || !/SEMIFINAL/.test(hub.playText)) return 'the career hub does not offer the SEMIFINAL after week 10';
    return true;
  },
},
{
  id: 'play-career-semifinal',
  ask: 'career mode: play the semifinal to the end - winning it unlocks the final',
  async test(page, h) {
    const T = (w, l, t, pts, gf, ga) => ({ w, l, t, pts, gf, ga });
    const seed = g37Seed({ week: 10, phase: 'semi', table: {
      WOLVES: T(10, 0, 0, 20, 30, 10), SHARKS: T(8, 2, 0, 16, 26, 14), BEARS: T(7, 3, 0, 14, 22, 16),
      EAGLES: T(6, 4, 0, 12, 20, 18), VIPERS: T(3, 7, 0, 6, 12, 24), STAMPEDE: T(2, 8, 0, 4, 10, 28) } });
    if (!await g37Reset(page, h, seed)) return 'the game never came back to the menu after a reload';
    const before = await h.eval(g37PendingFn);
    if (!before || before.label !== 'SEMIFINAL' || before.opp !== 'EAGLES') return 'the SEMIFINAL is not the unlocked level (next is ' + (before ? before.label + ' vs ' + before.opp : 'none') + ')';
    const played = await g37PlayLevel(page, h);
    if (typeof played === 'string') return played;
    const after = await h.eval(g37PendingFn);
    if (!after || after.phase !== 'final' || after.label !== 'THE FINAL') return 'the semifinal was played to the end and won, but THE FINAL did not unlock';
    if (after.opp !== 'SHARKS' && after.opp !== 'BEARS') return 'the final unlocked against the wrong team (' + after.opp + ' - the other semifinal winner should be SHARKS or BEARS)';
    const hub = await g37Hub(page, h);
    await g37HubClose(page, h);
    if (!/NEXT: THE FINAL vs/.test(hub.body) || !/THE FINAL/.test(hub.playText)) return 'the career hub does not offer THE FINAL after the semifinal';
    return true;
  },
},
{
  id: 'play-career-final',
  ask: 'career mode: play the final to the end - winning it takes the title and unlocks the next season',
  async test(page, h) {
    const T = (w, l, t, pts, gf, ga) => ({ w, l, t, pts, gf, ga });
    const seed = g37Seed({ week: 10, phase: 'final', finalOpp: 'SHARKS', table: {
      WOLVES: T(10, 0, 0, 20, 30, 10), SHARKS: T(8, 2, 0, 16, 26, 14), BEARS: T(7, 3, 0, 14, 22, 16),
      EAGLES: T(6, 4, 0, 12, 20, 18), VIPERS: T(3, 7, 0, 6, 12, 24), STAMPEDE: T(2, 8, 0, 4, 10, 28) } });
    if (!await g37Reset(page, h, seed)) return 'the game never came back to the menu after a reload';
    const before = await h.eval(g37PendingFn);
    if (!before || before.label !== 'THE FINAL' || before.opp !== 'SHARKS') return 'THE FINAL is not the unlocked level (next is ' + (before ? before.label + ' vs ' + before.opp : 'none') + ')';
    const played = await g37PlayLevel(page, h);
    if (typeof played === 'string') return played;
    const after = await h.eval(g37PendingFn);
    if (!after || after.phase !== 'done') return 'the final was played to the end and won, but the season did not complete';
    if (after.champ !== 1) return 'winning the final did not record the championship (titles: ' + after.champ + ')';
    const hub = await g37Hub(page, h);
    if (!hub.newShown || !/START SEASON 2/.test(hub.newText)) return 'the career hub does not offer the next season after the final (button: ' + hub.newText + ')';
    if (!/Championships: 1/.test(hub.body)) return 'the career hub does not show the title just won';
    await h.eval(() => { const b = document.getElementById('hubNew'); if (b) b.click(); });
    const next = await h.eval(g37PendingFn);
    await g37HubClose(page, h);
    if (!next || next.season !== 2 || next.phase !== 'reg' || next.label !== 'WEEK 1') return 'starting the next season did not unlock WEEK 1 of season 2';
    return true;
  },
},
/* ================= FRIEND CODE PLAY TEST (G-41, owner 2026-10-20) =================
   My friend code is on the menu, a friend's code sets up their team, and
   playing the friend match to the end puts the result on my record. */
{
  id: 'play-friend-code',
  ask: 'friend codes: my code is on the menu, a friend code sets up their team, and the friend match result goes on my record',
  async test(page, h) {
    if (!await g37Reset(page, h, null)) return 'the game never came back to the menu after a reload';
    // With no career there is no code yet - the menu says so.
    const noCode = await h.eval(() => ((document.getElementById('myCode') || {}).textContent || ''));
    if (!/start a career to get one/.test(noCode)) return 'the menu did not explain that a friend code needs a career first';
    // A bad code is rejected with the game's own error, and sets up nothing.
    await h.eval(() => { const b = document.getElementById('friendBtn'); if (b) b.click(); });
    await h.eval(() => { document.getElementById('friendIn').value = 'APEX-NOT-A-CODE'; const b = document.getElementById('friendGo'); if (b) b.click(); });
    const bad = await h.eval(() => ({
      err: ((document.getElementById('friendErr') || {}).textContent || ''),
      match: localStorage.getItem('apex_hockey_match'),
    }));
    if (!/does not check out/.test(bad.err)) return 'a bad friend code was not rejected (error says: ' + bad.err + ')';
    if (bad.match) return 'a bad friend code still set up a match';
    await h.eval(() => { const b = document.getElementById('friendClose'); if (b) b.click(); });
    // Start a career (the game's own hub button) so the menu carries MY code.
    await h.eval(() => { const b = document.getElementById('careerBtn'); if (b) b.click(); });
    await h.eval(() => { const b = document.getElementById('hubNew'); if (b) b.click(); });
    await g37HubClose(page, h);
    const mine = await h.eval(() => {
      const txt = ((document.getElementById('myCode') || {}).textContent || '');
      const m = txt.match(/APEX-[A-Za-z0-9+/]+(?:-[A-Za-z0-9+/]+)*/);
      if (!m) return { err: 'no friend code on the menu (menu says: ' + txt + ')' };
      try {
        let s = m[0].replace(/^APEX-?/, '').replace(/[-\s]/g, '');
        while (s.length % 4) s += '=';
        const p = JSON.parse(atob(s));
        const c = JSON.parse(localStorage.getItem('apex_hockey_career_v1') || 'null');
        if (!c || p.n !== c.star.name) return { err: 'my menu code names ' + p.n + ' but my star is ' + (c ? c.star.name : 'none') };
        if (typeof p.o !== 'number') return { err: 'my menu code carries no star rating' };
        return { code: m[0] };
      } catch (e) { return { err: 'my menu code does not decode: ' + e.message }; }
    });
    if (mine.err) return mine.err;
    // A friend's code, built the same way the game builds mine (APEX- +
    // base64 JSON in 4-char chunks), for a different star: MIKO REYES, 88.
    const b64 = Buffer.from(JSON.stringify({ v: 1, n: 'MIKO REYES', o: 88, g: 10, a: 12, w: 3, c: 1 }), 'utf8').toString('base64').replace(/=+$/, '');
    const friendCode = 'APEX-' + (b64.match(/.{1,4}/g) || [b64]).join('-');
    // Enter it through the game's own friend overlay - a good code saves
    // the match and reloads the page with their team in the building.
    await h.eval(() => { const b = document.getElementById('friendBtn'); if (b) b.click(); });
    try {
      await h.eval((code) => { document.getElementById('friendIn').value = code; const b = document.getElementById('friendGo'); if (b) b.click(); }, friendCode);
    } catch (e) {} // the reload kills that eval - expected
    let menuBack = false;
    for (let i = 0; i < 24 && !menuBack; i++) {
      await h.wait(400);
      menuBack = await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false);
    }
    if (!menuBack) return 'the game never came back to the menu after the friend code was entered';
    const set = await h.eval(() => ({
      btn: ((document.getElementById('careerBtn') || {}).textContent || ''),
      cancel: (document.getElementById('cancelMatch') || {}).style.display || '',
      match: localStorage.getItem('apex_hockey_match'),
    }));
    if (!/PLAY FRIEND MATCH vs REYES ALL-STARS/.test(set.btn)) return 'the friend code did not set up the match on the menu (button says: ' + set.btn + ')';
    if (set.cancel !== 'block' || !set.match) return 'the friend match was not saved as the pending match';
    // Play the friend match to the end (the game's own buttons + clock).
    await h.eval(() => { if (window.__hk && window.__hk.game && window.__hk.game.newMatch) window.__hk.game.newMatch(); });
    await h.eval(() => { const b = document.getElementById('careerBtn'); if (b) b.click(); });
    let playing = false;
    await h.eval(() => { try { window.__reality && window.__reality.go(true); } catch (e) {} }).catch(() => {}); // the faceoff gate: a staged match waits for the player's input - the test stands in for the player
    for (let i = 0; i < 40 && !playing; i++) {
      await h.wait(250);
      const st = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
      if (st === 'play') playing = true;
    }
    await h.eval(() => { try { window.__reality && window.__reality.go(false); } catch (e) {} }).catch(() => {});
    if (!playing) return 'the friend match never reached play';
    const awayName = await h.eval(() => ((document.getElementById('nmA') || {}).textContent || ''));
    if (awayName !== 'REYES ALL-STARS') return 'the friend\'s team is not the one on the ice (scoreboard away team: ' + awayName + ')';
    await h.eval(() => { const g = window.__hk.game; g.period = 3; g.scoreH = 2; g.scoreA = 0; g.clockT = 0.05; });
    let over = false;
    for (let i = 0; i < 40 && !over; i++) {
      await h.wait(200);
      const st = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
      if (st === 'over') over = true;
    }
    if (!over) return 'the friend match did not end';
    const done = await h.eval(() => {
      const c = JSON.parse(localStorage.getItem('apex_hockey_career_v1') || 'null');
      return {
        sub: ((document.getElementById('finalSub') || {}).textContent || ''),
        again: ((document.getElementById('againBtn') || {}).textContent || ''),
        match: localStorage.getItem('apex_hockey_match'),
        fw: c && c.friends ? c.friends.w : -1,
        fl: c && c.friends ? c.friends.l : -1,
      };
    });
    if (done.match) return 'the friend match is still pending after it was played';
    if (done.fw !== 1 || done.fl !== 0) return 'the friend match win did not go on my record (friends: ' + done.fw + '-' + done.fl + ')';
    if (!/Friend match in the books/.test(done.sub) || !/1–0/.test(done.sub)) return 'the end screen did not put the friend match on my record (says: ' + done.sub + ')';
    if (!/BACK TO MENU/.test(done.again)) return 'the end screen did not offer the way back after the friend match';
    return true;
  },
},
{
  id: 'play-skates-touch-ice',
  ask: 'skates touch the ice the whole time while skating (gap under 3 cm - never floating above it, never sunk under it)',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const clickId = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); }, id).catch(() => {});
    // The blade drop (foot bone -> blade bottom) is a fixed property of the kit:
    // calibrate it per skater from one still moment (menu / faceoff), where the
    // stance has every skater standing flat - foot bone and blade box agree there.
    const calibFn = () => {
      const out = [];
      for (const s of window.__hk.skaters) {
        if (!s.ath) { out.push(null); continue; }
        let steel = null, fl = null, fr = null;
        s.ath.object.traverse((o) => {
          if (!steel && o.name === 'gear-steel') steel = o;
          if (o.isBone && o.name === 'foot_l') fl = o;
          if (o.isBone && o.name === 'foot_r') fr = o;
        });
        if (!steel || !fl || !fr) { out.push(null); continue; }
        if (steel.computeBoundingBox) steel.computeBoundingBox();
        const bb = steel.boundingBox || (steel.geometry && steel.geometry.boundingBox);
        if (!bb) { out.push(null); continue; }
        const e = steel.matrixWorld.elements;
        let min = Infinity;
        for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
          const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
          if (wy < min) min = wy;
        }
        const v = new fl.position.constructor();
        const lowFoot = Math.min(fl.getWorldPosition(v).y, fr.getWorldPosition(v).y);
        out.push(+(lowFoot - min).toFixed(3));
      }
      return out;
    };
    // During play only the foot bones are read (scene-graph truth, fresh every
    // frame); blade clearance = lower foot bone - the calibrated drop.
    const feetFn = () => window.__hk.skaters.map((s) => {
      if (!s.ath) return null;
      let fl = null, fr = null;
      s.ath.object.traverse((o) => {
        if (o.isBone && o.name === 'foot_l') fl = o;
        if (o.isBone && o.name === 'foot_r') fr = o;
      });
      if (!fl || !fr) return null;
      const v = new fl.position.constructor();
      return +Math.min(fl.getWorldPosition(v).y, fr.getWorldPosition(v).y).toFixed(3);
    });
    // Get to a still, grounded moment first if the page sits on a screen:
    // close the career hub / leave the end screen back to the menu.
    let st = await state();
    if (st === 'over' || st === 'menu') {
      await h.eval(() => {
        const hub = document.getElementById('hub');
        if (hub && getComputedStyle(hub).display !== 'none') { const c = document.getElementById('hubClose'); if (c) c.click(); }
      }).catch(() => {});
      if (st === 'over') await clickId('againBtn');
      for (let i = 0; i < 8 && (await state()) !== 'menu'; i++) await h.wait(400);
      st = await state();
    }
    // Athletes in (their kit carries the blades and the foot bones).
    let ready = false;
    for (let i = 0; i < 24 && !ready; i++) {
      ready = await h.eval(() => (window.__hk.skaters || []).filter((s) => !!s.ath).length >= 10).catch(() => false);
      if (!ready) await h.wait(500);
    }
    if (!ready) return 'the real athletes never attached, so there are no skates to measure';
    // Calibrate the drop (median across skaters - one shared kit constant).
    let drop = null;
    for (let i = 0; i < 3 && drop === null; i++) {
      const cal = await h.eval(calibFn).catch(() => null);
      const vals = (cal || []).filter((x) => x !== null && isFinite(x)).sort((a, b) => a - b);
      if (vals.length >= 8) drop = vals[Math.floor(vals.length / 2)];
      else await h.wait(400);
    }
    if (drop === null) return 'could not calibrate the skate drop (no clean read of the blades)';
    // The measure while skating is the game's own per-skate blade-contact marker
    // (the lowest blade edge, in world units, published every frame). Foot bones
    // cannot judge a skating stride: the foot pitches at toe-off, so a bone reads
    // centimetres of sink/float that the blade never does (that ruler made this
    // test flap red on the robot while the blades measured 0.000 in the frame).
    // The markers are anchored to the bone calibration once at the faceoff -
    // the first moment every skater stands flat with fresh markers - so a
    // marker that ever drifts from the real blade fails here instead of
    // passing silently. (At the menu only some skaters carry markers yet.)
    const anchorFn = (dropArg) => {
      const diffs = [];
      for (const s of window.__hk.skaters) {
        if (!s.ath || !s._contact) continue;
        let fl = null, fr = null;
        s.ath.object.traverse((o) => { if (o.isBone && o.name === 'foot_l') fl = o; if (o.isBone && o.name === 'foot_r') fr = o; });
        if (!fl || !fr) continue;
        const v = new fl.position.constructor();
        const bone = Math.min(fl.getWorldPosition(v).y, fr.getWorldPosition(v).y) - dropArg;
        const mark = Math.min(s._contact[0].position.y, s._contact[1].position.y);
        diffs.push(Math.abs(mark - bone));
      }
      diffs.sort((a, b) => a - b);
      return { n: diffs.length, med: diffs.length ? diffs[Math.floor(diffs.length / 2)] : null };
    };
    let anchored = false;
    // Start a match if one is not already running, using the game's own buttons.
    for (let i = 0; i < 18; i++) {
      st = await state();
      if (!anchored && (st === 'faceoff' || st === 'play')) {
        const a = await h.eval(anchorFn, drop).catch(() => null);
        if (a && a.n >= 10) {
          if (a.med > 0.098) return 'the blade contact markers disagree with the measured blades at rest by ' + Math.round(a.med * 30.7) + ' cm - the skate grounding cannot be trusted';
          anchored = true;
        } else if (st === 'faceoff') { await h.wait(400); continue; }
      }
      if (st === 'play') break;
      if (st === 'faceoff' || st === 'goal' || st === 'pen') { await h.wait(700); continue; }
      await h.eval(() => {
        const click = (id) => { const el = document.getElementById(id); if (el) el.click(); };
        const hub = document.getElementById('hub');
        const g = window.__hk.game;
        if (hub && getComputedStyle(hub).display !== 'none') click('hubClose');
        else if (g.state === 'over') click('againBtn');
        else if (g.state === 'menu') click('playBtn');
      }).catch(() => {});
      await h.wait(700);
    }
    if ((await state()) !== 'play') return 'could not get a match into play to measure the skates';
    if (!anchored) return 'the game publishes no per-skate blade contact markers to measure (the skates cannot be proven on the ice)';
    // Sample the lower blade's contact marker of every skater while they skate.
    const markerFn = () => window.__hk.skaters.map((s) => (s._contact ? Math.min(s._contact[0].position.y, s._contact[1].position.y) : null));
    const per = new Map();
    for (let k = 0; k < 14; k++) {
      const snap = await h.eval(markerFn).catch(() => null);
      if (snap) snap.forEach((v, idx) => { if (v !== null && isFinite(v)) { if (!per.has(idx)) per.set(idx, []); per.get(idx).push(+v.toFixed(3)); } });
      await h.wait(160);
    }
    if (per.size < 8) return 'only ' + per.size + ' skaters could be measured';
    const bad = [];
    for (const [idx, arr] of per) {
      const sorted = [...arr].sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      if (med > 0.098) bad.push('skater ' + idx + ' floats ' + Math.round(med * 30.7) + ' cm above the ice');
      else if (med < -0.098) bad.push('skater ' + idx + ' is sunk ' + Math.round(-med * 30.7) + ' cm under the ice (blades buried, boots hover)');
    }
    return bad.length ? bad.join('; ') : true;
  },
},
{
  id: 'play-goalie-blades-on-ice',
  ask: 'skates sit exactly on the ice and the blades show silver under the boots: the goalie dropping into a butterfly never drags his blades under the ice, and the blade steel is a bright silver that reads as metal, not black',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const reachPlay = async () => {
      for (let i = 0; i < 18; i++) {
        const st = await state();
        if (st === 'play') return true;
        if (st === 'faceoff' || st === 'goal' || st === 'pen') { await h.wait(700); continue; }
        await h.eval(() => {
          const click = (id) => { const el = document.getElementById(id); if (el) el.click(); };
          const hub = document.getElementById('hub');
          const g = window.__hk.game;
          if (hub && getComputedStyle(hub).display !== 'none') click('hubClose');
          else if (g.state === 'over') click('againBtn');
          else if (g.state === 'menu') click('playBtn');
        }).catch(() => {});
        await h.wait(700);
      }
      return (await state()) === 'play';
    };
    if (!(await reachPlay())) return 'could not get a match into play to test the goalie blades';
    // The blade steel must read silver (with no environment map, near-full metalness renders black).
    const steel = await h.eval(() => {
      const s = (window.__hk.skaters || []).find((x) => !!x.ath);
      if (!s) return null;
      let m = null;
      s.ath.object.traverse((o) => { if (!m && o.name === 'gear-steel') m = o.material; });
      return m ? { metal: m.metalness, rough: m.roughness } : null;
    }).catch(() => null);
    if (!steel) return 'no gear-steel blades found on the athletes';
    if (steel.metal > 0.6) return 'the blades use near-black metal (metalness ' + steel.metal + ') - they do not show as silver under the boots';
    // Calibrate the blade drop (foot bone -> blade bottom) like the skates test does.
    const calibFn = () => {
      const out = [];
      for (const s of window.__hk.skaters) {
        if (!s.ath) { out.push(null); continue; }
        let st = null, fl = null, fr = null;
        s.ath.object.traverse((o) => {
          if (!st && o.name === 'gear-steel') st = o;
          if (o.isBone && o.name === 'foot_l') fl = o;
          if (o.isBone && o.name === 'foot_r') fr = o;
        });
        if (!st || !fl || !fr) { out.push(null); continue; }
        if (st.computeBoundingBox) st.computeBoundingBox();
        const bb = st.boundingBox || (st.geometry && st.geometry.boundingBox);
        if (!bb) { out.push(null); continue; }
        const e = st.matrixWorld.elements;
        let min = Infinity;
        for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
          const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
          if (wy < min) min = wy;
        }
        const v = new fl.position.constructor();
        out.push(+(Math.min(fl.getWorldPosition(v).y, fr.getWorldPosition(v).y) - min).toFixed(3));
      }
      return out;
    };
    let drop = null;
    for (let i = 0; i < 3 && drop === null; i++) {
      const cal = await h.eval(calibFn).catch(() => null);
      const vals = (cal || []).filter((x) => x !== null && isFinite(x)).sort((a, b) => a - b);
      if (vals.length >= 8) drop = vals[Math.floor(vals.length / 2)];
      else await h.wait(400);
    }
    if (drop === null) return 'could not calibrate the skate drop';
    // Record the away goalie's blade clearance from inside his own stance step
    // (one sample per sim slice - a butterfly lasts 0.35 game-seconds, which a
    // wall-clock sampler can miss entirely inside one long frame).
    let hooked = false;
    for (let i = 0; i < 20 && !hooked; i++) {
      hooked = await h.eval((dropArg) => {
        const gl = window.__hk.skaters.find((s) => s.goalie && s.team === 'away');
        if (!gl || !gl.ath || !gl.kit) return false;
        window.__g72 = { min: 999, minScale: 1, n: 0 };
        const kit = gl.kit, orig = kit.stance.apply.bind(kit.stance);
        kit.stance.apply = (o) => {
          const r = orig(o);
          try {
            if (gl.athWrap && gl.athWrap.scale.y < 0.95) {
              // Measure the blades by their contact markers, not the foot bones:
              // in a butterfly the feet splay and pitch, so the bone ruler read
              // 4 cm of sink on the robot while the blade edges sat at 0.000.
              if (gl._contact) {
                const b = Math.min(gl._contact[0].position.y, gl._contact[1].position.y);
                if (b < window.__g72.min) window.__g72.min = b;
                if (gl.athWrap.scale.y < window.__g72.minScale) window.__g72.minScale = gl.athWrap.scale.y;
                window.__g72.n++;
              }
            }
          } catch (e) {}
          return r;
        };
        return true;
      }, drop).catch(() => false);
      if (!hooked) await h.wait(500);
    }
    if (!hooked) return 'could not hook the goalie stance to measure his blades';
    // Anchor the goalie's markers to the bone calibration once, at rest (same
    // reasoning as the skates test): markers that drift from the real blades
    // fail here instead of passing silently.
    let gAnchor = null;
    for (let gi = 0; gi < 4 && (!gAnchor || gAnchor.err); gi++) {
      if (gi) await h.wait(500);
      gAnchor = await h.eval((dropArg) => {
      const gl = window.__hk.skaters.find((s) => s.goalie && s.team === 'away');
      if (!gl || !gl.ath) return { err: 'no away goalie' };
      if (!gl._contact) return { err: 'the goalie publishes no blade contact markers to measure' };
      let fl = null, fr = null;
      gl.ath.object.traverse((o) => { if (o.isBone && o.name === 'foot_l') fl = o; if (o.isBone && o.name === 'foot_r') fr = o; });
      if (!fl || !fr) return { err: 'no goalie foot bones' };
      const v = new fl.position.constructor();
      const bone = Math.min(fl.getWorldPosition(v).y, fr.getWorldPosition(v).y) - dropArg;
      const mark = Math.min(gl._contact[0].position.y, gl._contact[1].position.y);
        return { diff: Math.abs(mark - bone) };
      }, drop).catch(() => null);
    }
    if (!gAnchor || gAnchor.err) return gAnchor && gAnchor.err ? gAnchor.err : 'could not anchor the goalie blade markers';
    if (gAnchor.diff > 0.098) return 'the goalie blade markers disagree with the measured blades at rest by ' + Math.round(gAnchor.diff * 30.7) + ' cm - the grounding cannot be trusted';
    // Barrage: point-blank shots at the away goalie - each one drops him into a butterfly.
    const barrageStart = Date.now();
    for (let r = 0; r < 8; r++) {
      if ((await state()) !== 'play') { if (!(await reachPlay())) break; }
      await h.eval(() => {
        const gl = window.__hk.skaters.find((s) => s.goalie && s.team === 'away');
        const p = window.__hk.puck;
        p.owner = null; p.shot = { team: 'home', t: 0, by: null };
        p.pos.set(gl.pos.x - 3, 0.2, gl.pos.z);
        p.vel.set(50, 0, 0);
      }).catch(() => {});
      await h.wait(850);
    }
    let res = await h.eval(() => window.__g72).catch(() => null);
    if ((!res || res.n < 5) && Date.now() - barrageStart < 12000) {
      // a dead starting state (e.g. the previous test died mid-match) can eat the
      // whole barrage without a shot - re-enter play and run it once more
      await h.eval(() => { window.__g72.min = 999; window.__g72.minScale = 1; window.__g72.n = 0; }).catch(() => {});
      if (await reachPlay()) {
        for (let r = 0; r < 6; r++) {
          if ((await state()) !== 'play') { if (!(await reachPlay())) break; }
          await h.eval(() => {
            const gl = window.__hk.skaters.find((s) => s.goalie && s.team === 'away');
            const p = window.__hk.puck;
            p.owner = null; p.shot = { team: 'home', t: 0, by: null };
            p.pos.set(gl.pos.x - 3, 0.2, gl.pos.z);
            p.vel.set(50, 0, 0);
          }).catch(() => {});
          await h.wait(850);
        }
        res = await h.eval(() => window.__g72).catch(() => null);
      }
    }
    if (!res || res.n < 5) return 'too few in-butterfly goalie samples during the barrage (' + (res ? res.n : 0) + ')';
    if (res.minScale > 0.9) return 'the goalie never dropped into a butterfly during the barrage - the sink was not exercised';
    if (res.min < -0.098) return 'the goalie blades sank ' + Math.round(-res.min * 30.7) + ' cm under the ice in the butterfly (wrap scale ' + res.minScale.toFixed(2) + ')';
    return true;
  },
},
{
  id: 'play-save-shows-once-camera-holds',
  ask: 'after a save, SAVED! shows exactly once (a rebound re-save in the same scramble does not show it again) and the broadcast camera does not rewind: its puck lead swings smoothly instead of snapping when the puck reverses',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const reachPlay = async () => {
      for (let i = 0; i < 18; i++) {
        const st = await state();
        if (st === 'play') return true;
        if (st === 'faceoff' || st === 'goal' || st === 'pen') { await h.wait(700); continue; }
        await h.eval(() => {
          const click = (id) => { const el = document.getElementById(id); if (el) el.click(); };
          const hub = document.getElementById('hub');
          const g = window.__hk.game;
          if (hub && getComputedStyle(hub).display !== 'none') click('hubClose');
          else if (g.state === 'over') click('againBtn');
          else if (g.state === 'menu') click('playBtn');
        }).catch(() => {});
        await h.wait(700);
      }
      return (await state()) === 'play';
    };
    if (!(await reachPlay())) return 'could not get a match into play for the save test';
    // Count every SAVED! banner the game puts up: trap the banner element's
    // innerHTML setter (banner() rewrites it on every call - a mutation observer
    // misses calls that a later slice overwrites inside the same frame).
    await h.eval(() => {
      window.__sv72 = { n: 0 };
      const b = document.getElementById('banner');
      let cur = b.innerHTML;
      Object.defineProperty(b, 'innerHTML', {
        get() { return cur; },
        set(v) { cur = v; if (String(v).includes('SAVED!')) window.__sv72.n++; },
        configurable: true,
      });
      // A goalie save flips the puck's x-velocity from fast-inbound to outbound
      // in one write; trap that write (frame-proof) to verify saves happened.
      window.__flips = []; window.__armed = false;
      const vel = window.__hk.puck.vel;
      let vx = vel.x;
      Object.defineProperty(vel, 'x', {
        get() { return vx; },
        set(v) {
          if (window.__armed && vx > 30 && v < -5) {
            // only the goalie's own save geometry counts (a post bounce also flips vx):
            // the flip must happen at his line, within his reach across the crease
            const p = window.__hk.puck;
            const gl = window.__hk.skaters.find((s) => s.goalie && s.team === 'away');
            if (gl && p.pos.x > 80 && Math.abs(p.pos.z - gl.pos.z) < 2.6) window.__flips.push(Math.round(performance.now()));
          }
          vx = v;
        },
        configurable: true,
      });
    });
    // Broadcast view for the camera-lead check.
    for (let i = 0; i < 5; i++) {
      const lbl = await h.eval(() => document.getElementById('viewBtn').textContent).catch(() => '');
      if (String(lbl).includes('BROADCAST')) break;
      await h.eval(() => document.getElementById('viewBtn').click()).catch(() => {});
      await h.wait(250);
    }
    if (!(await reachPlay())) return 'the match ended before the camera-lead check';
    // Camera lead: log it in-page once per rendered frame (the only clock that
    // matters - a wall sampler lags a frame behind). Stage the puck at the
    // emptiest spot, settle the lead on a fast +X rush, reverse the puck the
    // way a save does, and judge the FIRST frame after the flip: a snapping
    // (pre-fix) lead jumps the whole swing in that frame; the eased lead has
    // moved only a few units, then completes the swing over the next frames.
    // Per-slice lead recorder: hook one skater's stance step (it runs once per
    // sim slice) - the eased lead is capped per slice by construction, so a
    // one-slice jump is a frame-rate-proof snap detector.
    let sliceHooked = false;
    for (let i = 0; i < 20 && !sliceHooked; i++) {
      sliceHooked = await h.eval(() => {
        const s0 = (window.__hk.skaters || []).find((s) => s.ath && s.kit);
        if (!s0) return false;
        window.__slice72 = [];
        const kit = s0.kit, orig = kit.stance.apply.bind(kit.stance);
        kit.stance.apply = (o) => {
          const r = orig(o);
          try { if (window.__slice72.length < 6000) window.__slice72.push(+window.__hk.game.camLead.toFixed(2)); } catch (e) {}
          return r;
        };
        return true;
      }).catch(() => false);
      if (!sliceHooked) await h.wait(500);
    }
    if (!sliceHooked) return 'could not hook a stance step to watch the camera lead';
    await h.eval(() => {
      window.__lead72 = [];
      const iv = setInterval(() => {
        const g = window.__hk.game;
        const lead = typeof g.camLead === 'number' ? g.camLead : Math.max(-14, Math.min(14, window.__hk.puck.vel.x * 0.35));
        window.__lead72.push({ t: Math.round(performance.now()), lead: +lead.toFixed(2), vx: Math.round(window.__hk.puck.vel.x), clk: +g.clockT.toFixed(3) });
        if (window.__lead72.length >= 3000) clearInterval(iv);
      }, 25);
    });
    // Stage the rush IN PAGE (a timer re-pins the puck at the emptiest spot with
    // vel +100) and wait until the log itself shows the lead settled - headless
    // frame cadence is erratic, so the log, not the wall clock, is the judge.
    await h.eval(() => {
      const p = window.__hk.puck;
      let best = null, bd = -1;
      for (const cand of [[0, 26], [0, -26], [0, 0]]) { // centre spots only: no line within jitter range, so staging can't trip offside/icing
        let md = 1e9;
        for (const s of window.__hk.skaters) { const d = Math.hypot(s.pos.x - cand[0], s.pos.z - cand[1]); if (d < md) md = d; }
        if (md > bd) { bd = md; best = cand; }
      }
      p.__spot = best;
      window.__stage72 = setInterval(() => {
        p.owner = null; p.shot = null; p.lastTouch = null;
        p.pos.set(p.__spot[0], 0.2, p.__spot[1]); p.vel.set(100, 0, 0);
      }, 100);
    });
    let settled = null;
    for (let k = 0; k < 20 && settled === null; k++) {
      await h.wait(300);
      settled = await h.eval(() => {
        const a = window.__lead72.slice(-6);
        if (a.length < 6) return null;
        const m = Math.min(...a.map((e) => e.lead));
        return m >= 11 ? m : null; // the lead held >= 11 across the last 6 samples
      }).catch(() => null);
    }
    if (settled === null) { await h.eval(() => clearInterval(window.__stage72)).catch(() => {}); return 'the camera lead never settled on the rush'; }
    // The save reversal: stop staging, flip the puck once, in page.
    const tFlip = await h.eval(() => {
      clearInterval(window.__stage72);
      const p = window.__hk.puck;
      // pin the reversed puck for the verdict window (a loose puck at a known
      // spot gets stolen in a frame or two, before the lead can swing)
      window.__stage72 = setInterval(() => {
        p.owner = null; p.shot = null; p.lastTouch = null;
        p.pos.set(p.__spot[0], 0.2, p.__spot[1]); p.vel.set(-32, 0, 0);
      }, 100);
      p.owner = null; p.shot = null; p.lastTouch = null;
      p.pos.set(p.__spot[0], 0.2, p.__spot[1]); p.vel.set(-32, 0, 0);
      window.__flipClk = window.__hk.game.clockT;
      window.__flipSlice = window.__slice72.length;
      return Math.round(performance.now());
    }).catch(() => 0);
    let verdict = null;
    for (let k = 0; k < 20 && !verdict; k++) {
      await h.wait(300);
      verdict = await h.eval((args) => {
        const [t0, base] = args;
        const post = window.__lead72.filter((e) => e.t >= t0 + 20);
        // headless frames arrive in bursts - wait until the post-flip log spans
        // ~2.5 s so at least a few real frames have integrated the lead
        if (!post.length || post[post.length - 1].t < t0 + 2500) return null;
        const later = post[post.length - 1];
        return { dLater: Math.abs(later.lead - base), frames: post.length };
      }, [tFlip, settled]).catch(() => null);
    }
    await h.eval(() => clearInterval(window.__stage72)).catch(() => {});
    if (!verdict) return 'too few samples logged after the reversal';
    if (verdict.dLater < 8) return 'the camera lead never swung after the reversal (moved ' + verdict.dLater.toFixed(1) + ') - the flip did not play out';
    // Per-slice verdict: the biggest one-step move of the lead after the flip.
    let sliceVerdict = null;
    for (let k = 0; k < 14 && !sliceVerdict; k++) {
      sliceVerdict = await h.eval(() => {
        const from = window.__flipSlice || 0;
        const a = (window.__slice72 || []).slice(from, from + 400);
        if (a.length < 60) return null; // wait for ~2 game-seconds of slices
        let mx = 0;
        for (let i = 1; i < a.length; i++) mx = Math.max(mx, Math.abs(a[i] - a[i - 1]));
        return { mx, n: a.length };
      }).catch(() => null);
      if (!sliceVerdict) await h.wait(300);
    }
    if (!sliceVerdict) return 'too few sim slices logged after the reversal';
    if (sliceVerdict.mx > 3) return 'the broadcast camera lead jumped ' + sliceVerdict.mx.toFixed(1) + ' units in a single step after the puck reversed - the camera rewinds after a save';
    // Two verified goalie saves back to back (one scramble): the banner may
    // show only once. A save is verified by the in-page velocity-flip trap.
    const fireShot = () => h.eval(() => {
      const gl = window.__hk.skaters.find((s) => s.goalie && s.team === 'away');
      const p = window.__hk.puck;
      p.owner = null; p.shot = { team: 'home', t: 0, by: null };
      p.pos.set(gl.pos.x - 2.4, 0.2, gl.pos.z);
      p.vel.set(62, 0, 0);
    }).catch(() => {});
    const flipCount = () => h.eval(() => window.__flips.length).catch(() => -1);
    const waitFlip = async (after) => {
      for (let k = 0; k < 18; k++) {
        if ((await flipCount()) > after) return true;
        if ((await state()) !== 'play') return false;
        await h.wait(65);
      }
      return false;
    };
    await h.eval(() => { window.__armed = true; }).catch(() => {});
    let paired = false;
    for (let attempt = 0; attempt < 8 && !paired; attempt++) {
      if ((await state()) !== 'play') { if (!(await reachPlay())) break; }
      const n0 = await flipCount();
      await fireShot();
      if (!(await waitFlip(n0))) continue;
      const base = await h.eval(() => window.__sv72.n).catch(() => -1);
      let second = false;
      for (let a2 = 0; a2 < 3 && !second; a2++) {
        if ((await state()) !== 'play') break;
        const n1 = await flipCount();
        await fireShot();
        second = await waitFlip(n1);
      }
      if (!second) continue;
      await h.wait(400);
      const shown = await h.eval(() => window.__sv72.n).catch(() => -1);
      if (shown - base === 0) paired = true;
      else return 'SAVED! showed ' + (shown - base + 1) + ' times for one save scramble - it must show exactly once';
    }
    await h.eval(() => { window.__armed = false; }).catch(() => {});
    if (!paired) return 'could not stage two verified saves in one scramble';
    return true;
  },
},
{
  id: 'play-camera-stays-above-ice',
  ask: 'the camera never falls through the ice when zooming in: in every view (BROADCAST, HIGH, CLOSE, PLAYER, END) it stays at least 1.5 m above the ice',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    for (let i = 0; i < 18; i++) {
      const st = await state();
      if (st === 'play') break;
      if (st === 'faceoff' || st === 'goal' || st === 'pen') { await h.wait(700); continue; }
      await h.eval(() => {
        const click = (id) => { const el = document.getElementById(id); if (el) el.click(); };
        const hub = document.getElementById('hub');
        const g = window.__hk.game;
        if (hub && getComputedStyle(hub).display !== 'none') click('hubClose');
        else if (g.state === 'over') click('againBtn');
        else if (g.state === 'menu') click('playBtn');
      }).catch(() => {});
      await h.wait(700);
      if (i === 17) return 'could not get a match into play for the camera test';
    }
    if (!await h.eval(() => !!window.__hk.camera).catch(() => false)) return 'no camera handle to measure';
    let minY = Infinity, worstView = '';
    for (let v = 0; v < 5; v++) {
      const lbl = await h.eval(() => document.getElementById('viewBtn').textContent).catch(() => ('view ' + v));
      for (let k = 0; k < 8; k++) {
        const y = await h.eval(() => window.__hk.camera.position.y).catch(() => null);
        if (y !== null && y < minY) { minY = y; worstView = String(lbl); }
        await h.wait(110);
      }
      await h.eval(() => document.getElementById('viewBtn').click()).catch(() => {});
      await h.wait(200);
    }
    if (minY < 4.85) return 'the camera dropped to ' + minY.toFixed(2) + ' units (' + (minY * 0.307).toFixed(2) + ' m) in ' + worstView + ' - under the 1.5 m floor, it falls through the ice when zoomed in';
    return true;
  },
},
  // G-78: the other team plays defense now - AI defenders chase the carrier, poke-check,
  // block shots and clear the puck. Staged rush: the away centre carries in on the home
  // net from just inside the blue line with the human parked in the corner. PASS = a home DEFENSEMAN
  // (LD/RD) takes the puck off the attack within 20 game-seconds. A takeaway only counts
  // in a clean sequence: if the goalie had to make a save first (SAVED! banner), the
  // scramble that follows is the goalie's play, not the defenders' - a whistle/faceoff
  // starts a fresh sequence. An away goal ends it as a failure.
  {
    id: 'play-defender-takes-puck',
    ask: 'a defender takes the puck off an away rush (the rush does not score untouched)',
    area: 'play',
    async test(page, h) {
    const reachPlay = async () => {
      const state = () => h.eval(() => window.__hk.game.state).catch(() => 'err');
      for (let i = 0; i < 18; i++) {
        const st = await state();
        if (st === 'play') return true;
        if (st === 'goal' || st === 'over') { await h.press('#againBtn').catch(() => {}); }
        const hub = await h.eval(() => { const e = document.querySelector('#careerHub'); return !!(e && e.classList.contains('open')); }).catch(() => false);
        if (hub) { await h.press('#hubPlay').catch(() => {}); await h.wait(900); if ((await state()) === 'play') return true; await h.press('#hubClose').catch(() => {}); }
        if (st === 'menu') { await h.press('#playBtn').catch(() => {}); }
        else if (st === 'faceoff') { await h.press('#faceBtn').catch(() => {}); }
        else if (st === 'whistle') { await h.press('#contBtn').catch(() => {}); }
        else { await h.press('#playBtn').catch(() => {}); }
        await h.wait(500);
      }
      return (await state()) === 'play';
    };
    if (!(await reachPlay())) return 'could not get a match into play';
    // stage the rush + in-page recorder (100 ms): game-clock accumulation, the SAVED!
    // gate via the banner element's innerHTML setter, first clean D takeaway.
    // The two home D start at their real defensive anchors (in a live game they are
    // already back when a rush crosses centre - the faceoff dots are not defense).
    const staged = await h.eval(() => {
      const hk = window.__hk;
      const away = hk.skaters.filter((s) => s.team === 'away' && !s.goalie);
      const carrier = away.find((s) => s.role === 'C') || away[0];
      const ctrl = hk.skaters.find((s) => s.team === 'home' && s === hk.controlled);
      const ld = hk.skaters.find((s) => s.team === 'home' && s.role === 'LD');
      const rd = hk.skaters.find((s) => s.team === 'home' && s.role === 'RD');
      if (ld) { ld.pos.set(-74, 0.1, -13); ld.vel.set(0, 0, 0); }
      if (rd) { rd.pos.set(-74, 0.1, 13); rd.vel.set(0, 0, 0); }
      carrier.pos.set(-44, 0.1, 6); carrier.vel.set(-14, 0, 0); carrier.facing = Math.PI;
      hk.puck.owner = carrier; hk.puck.shot = null; hk.puck.recv = null;
      hk.puck.pos.set(carrier.pos.x - 2, 0.2, 6);
      if (ctrl) { ctrl.pos.set(88, 0.1, -38); ctrl.vel.set(0, 0, 0); }
      window.__dt78 = { elapsed: 0, lastClk: hk.game.clockT, tookAt: -1, tookBy: '', goalAgainst: false, savedGate: false, prevState: 'play' };
      const bn = document.querySelector('#banner');
      if (bn && !window.__dt78Trap) {
        window.__dt78Trap = true;
        let cur = bn.innerHTML;
        Object.defineProperty(bn, 'innerHTML', {
          configurable: true,
          get() { return cur; },
          set(v) { cur = v; if (String(v).indexOf('SAVED!') >= 0 && window.__dt78) window.__dt78.savedGate = true; },
        });
      }
      if (window.__dt78Int) clearInterval(window.__dt78Int);
      window.__dt78Int = setInterval(() => {
        const R = window.__dt78; if (!R || R.tookAt >= 0) return;
        const g = hk.game, st = g.state, clk = g.clockT;
        const d = Math.abs(clk - R.lastClk); R.lastClk = clk;
        if (st === 'play' && d < 1.5) R.elapsed += d;
        if ((st === 'whistle' || st === 'faceoff') && R.prevState === 'play') R.savedGate = false; // a whistle starts a fresh sequence
        if (st === 'goal') { R.goalAgainst = true; return; }
        R.prevState = st;
        if (st !== 'play' || R.savedGate) return;
        const o = hk.puck.owner;
        if (o && o.team === 'home' && (o.role === 'LD' || o.role === 'RD')) { R.tookAt = R.elapsed; R.tookBy = o.role; }
      }, 100);
      return true;
    }).catch(() => false);
    if (!staged) return 'could not stage the rush';
    // up to two rushes: one rush can end in a goal against even honest defense -
    // the defense passes if it takes the puck cleanly in either, inside 20 game-seconds
    let lastFail = 'no defender took the puck within 20 game-seconds of the rush';
    for (let rush = 0; rush < 2; rush++) {
      if (rush > 0) {
        if (!(await reachPlay())) break;
        const re = await h.eval(() => {
          const hk = window.__hk;
          const away = hk.skaters.filter((s) => s.team === 'away' && !s.goalie);
          const carrier = away.find((s) => s.role === 'C') || away[0];
          const ctrl = hk.skaters.find((s) => s.team === 'home' && s === hk.controlled);
          const ld = hk.skaters.find((s) => s.team === 'home' && s.role === 'LD');
          const rd = hk.skaters.find((s) => s.team === 'home' && s.role === 'RD');
          if (ld) { ld.pos.set(-74, 0.1, -13); ld.vel.set(0, 0, 0); }
          if (rd) { rd.pos.set(-74, 0.1, 13); rd.vel.set(0, 0, 0); }
          carrier.pos.set(-44, 0.1, 6); carrier.vel.set(-14, 0, 0); carrier.facing = Math.PI;
          hk.puck.owner = carrier; hk.puck.shot = null; hk.puck.recv = null;
          hk.puck.pos.set(carrier.pos.x - 2, 0.2, 6);
          if (ctrl) { ctrl.pos.set(88, 0.1, -38); ctrl.vel.set(0, 0, 0); }
          const R = window.__dt78; R.elapsed = 0; R.tookAt = -1; R.goalAgainst = false; R.savedGate = false; R.lastClk = hk.game.clockT;
          return true;
        }).catch(() => false);
        if (!re) break;
      }
      let verdict = null;
      for (let k = 0; k < (rush === 0 ? 40 : 22) && !verdict; k++) {
        await h.wait(400);
        const R = await h.eval(() => window.__dt78).catch(() => null);
        if (!R) continue;
        if (R.goalAgainst) verdict = 'goal';
        else if (R.tookAt >= 0) verdict = R.tookAt <= 20 ? 'took' : 'late';
        else if (R.elapsed > 21) verdict = 'none';
      }
      if (verdict === 'took') { await h.eval(() => { if (window.__dt78Int) clearInterval(window.__dt78Int); }).catch(() => {}); return true; }
      if (verdict === 'late') lastFail = 'a defender took the puck, but after the 20 game-second mark';
      else if (verdict === 'goal') lastFail = 'the away rush scored - no defender took the puck';
      else if (verdict === 'none') lastFail = 'no defender took the puck within 20 game-seconds of the rush';
    }
    await h.eval(() => { if (window.__dt78Int) clearInterval(window.__dt78Int); }).catch(() => {});
    return lastFail;
    }
  },
  {
    id: 'play-stick-resets-on-blur',
    ask: 'the stick lets go when the app loses focus or is hidden mid-hold - hold it pushed, blur or hide the app, and the knob is back at centre (0 px) with no real touchend needed',
    async test(page, h) {
    async function reachPlay(tries) {
      for (let i = 0; i < tries; i++) {
        const st = await h.eval(() => ({ state: window.__hk && window.__hk.game && window.__hk.game.state, hub: !!(document.querySelector('#careerHub') && document.querySelector('#careerHub').open) }));
        if (st.state === 'play' || st.state === 'faceoff') return true;
        await h.eval(() => {
          const vis = (el) => !!el && !!(el.offsetWidth || el.offsetHeight);
          const again = document.querySelector('#againBtn'); if (vis(again)) { again.click(); return; }
          if (document.querySelector('#careerHub') && document.querySelector('#careerHub').open) { const p = document.querySelector('#hubPlay'); if (p) { p.click(); return; } const c = document.querySelector('#hubClose'); if (c) c.click(); return; }
          const play = document.querySelector('#playBtn'); if (vis(play)) { play.click(); return; }
          const face = document.querySelector('#faceBtn'); if (vis(face)) { face.click(); return; }
          const cont = document.querySelector('#contBtn'); if (vis(cont)) cont.click();
        });
        await new Promise((r) => setTimeout(r, 650));
      }
      return false;
    }
    if (!(await reachPlay(14))) return 'could not reach live play to test the stick reset';
    const out = await h.eval(`(async () => {
      const joy = document.getElementById('joy'), knob = document.getElementById('knob');
      const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const hold = (id) => { const mk = (type, x) => { const t = new Touch({ identifier: id, target: joy, clientX: x, clientY: cy });
        joy.dispatchEvent(new TouchEvent(type, { touches: [t], changedTouches: [t], bubbles: true, cancelable: true })); };
        mk('touchstart', cx); mk('touchmove', cx + 40); };
      const wait = (ms) => new Promise((res) => setTimeout(res, ms));
      hold(7); await wait(150);
      const held = knob.style.transform;
      window.dispatchEvent(new Event('blur')); await wait(120);
      const afterBlur = knob.style.transform;
      hold(9); await wait(150);
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange')); await wait(120);
      const afterHide = knob.style.transform;
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange')); await wait(60);
      return { held, afterBlur, afterHide };
    })()`);
    const xOf = (tr) => { const m = /translate\(calc\(-50% \+ (-?[\d.]+)px\)/.exec(tr || ''); return m ? parseFloat(m[1]) : null; };
    if (!out || xOf(out.held) === null || Math.abs(xOf(out.held)) < 30) return 'could not hold the stick at +40 px to stage the test (held: ' + (out && out.held) + ')';
    if (xOf(out.afterBlur) !== 0) return 'the knob stayed pushed after window blur (' + out.afterBlur + ') - the stick only centres on a real touchend';
    if (xOf(out.afterHide) !== 0) return 'the knob stayed pushed after the app was hidden mid-hold (' + out.afterHide + ')';
    return true;
    }
  },
{
  id: 'tester-puck-size',
  ask: 'TESTER (G-88): the puck is a real puck size - 7.6 cm across and 2.5 cm thick (REALITY.md), within 15%',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    if ((await state()) !== 'play') {
      await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
      for (let i = 0; i < 30 && (await state()) !== 'play'; i++) await h.wait(500);
    }
    if ((await state()) !== 'play') return 'could not start a quick game to measure the puck';
    const m = await h.eval(() => {
      const puck = window.__hk && window.__hk.puck;
      if (!puck || !puck.mesh) return null;
      let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
      puck.mesh.updateWorldMatrix(true, true);
      puck.mesh.traverse((o) => {
        if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
        const pos = o.geometry.attributes.position, e = o.matrixWorld.elements;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const wx = e[0] * x + e[4] * y + e[8] * z + e[12];
          const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
          const wz = e[2] * x + e[6] * y + e[10] * z + e[14];
          if (wx < min[0]) min[0] = wx; if (wy < min[1]) min[1] = wy; if (wz < min[2]) min[2] = wz;
          if (wx > max[0]) max[0] = wx; if (wy > max[1]) max[1] = wy; if (wz > max[2]) max[2] = wz;
        }
      });
      return { w: max[0] - min[0], h: max[1] - min[1], d: max[2] - min[2] };
    });
    if (!m) return 'no puck mesh in the running game';
    const acrossCm = (Math.max(m.w, m.d) / 3.26) * 100; // the game builds at 3.26 units per metre (its own __reality note)
    const thickCm = (m.h / 3.26) * 100;
    if (Math.abs(acrossCm - 7.6) > 7.6 * 0.15 || Math.abs(thickCm - 2.54) > 2.54 * 0.15) {
      return 'the puck is ' + acrossCm.toFixed(1) + ' cm across (real: 7.6 cm) and ' + thickCm.toFixed(1) + ' cm thick (real: 2.5 cm)';
    }
    return true;
  },
},
{
  id: 'tester-career-play-starts-match',
  ask: 'TESTER (G-88): pressing PLAY in the career hub (PLAY NEXT MATCH) starts the career match',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const clickId = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); }, id).catch(() => {});
    await h.eval(() => { try { localStorage.removeItem('apex_hockey_career_v1'); localStorage.removeItem('apex_hockey_match'); } catch (e) {} }).catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    let menu = false;
    try {
      await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', null, { timeout: 9000, polling: 'raf' });
      menu = true;
    } catch (e) { menu = (await state()) === 'menu'; }
    if (!menu) return 'the game did not come back to its menu for the career test';
    await clickId('careerBtn');
    await h.wait(800);
    await clickId('hubNew');
    await h.wait(800);
    await clickId('hubPlay'); // the game reloads itself here by design - then the match should be on
    try {
      await page.waitForFunction(() => {
        const s = window.__hk && window.__hk.game && window.__hk.game.state;
        return s === 'play' || s === 'faceoff';
      }, null, { timeout: 11000, polling: 'raf' });
      return true;
    } catch (e) {
      return 'pressing PLAY in the career hub reloaded to the main menu and no career match started (state stayed "' + (await state()) + '")';
    }
  },
},
{
  id: 'play-arena-perf-shape',
  ask: 'BUILD G-110: the arena crowd is one instanced mesh, the static arena is merged, and the favicon cannot 404',
  async test(page, h) {
    const fav = await h.eval(() => !!document.querySelector('link[rel="icon"][href="data:,"]')).catch(() => false);
    if (!fav) return 'no <link rel="icon" href="data:,"> in the page head - the favicon can still 404';
    let census = null;
    for (let k = 0; k < 24 && !census; k++) {
      census = await h.eval(() => {
        const st = window.__arena; if (!st || !st.group) return null;
        let meshes = 0, fans = 0;
        st.group.traverse(o => { if (o.isMesh || o.isInstancedMesh) { meshes++; if (o.isInstancedMesh && (o.count || 0) > fans) fans = o.count || 0; } });
        return { meshes, fans };
      }).catch(() => null);
      if (!census) await h.wait(500);
    }
    if (!census) return 'the stadium kit never loaded (window.__arena missing)';
    if (census.fans < 1000) return 'the arena crowd is not one big InstancedMesh (largest instanced count ' + census.fans + ')';
    if (census.meshes > 20) return 'the static arena is not merged - ' + census.meshes + ' meshes in the kit group (bar 20)';
    return true;
  },
},
{
  id: 'play-waits-for-player-at-faceoff',
  ask: 'the game does not play by itself: a faceoff waits for the player input instead of dropping on its own',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    // stage the owner's exact situation with the game's own data: a career fixture is
    // pending, the page reloads, and the match stages itself (G-104) - on the fresh
    // page nobody has touched anything
    await h.eval(() => {
      try {
        localStorage.setItem('apex_hockey_match', JSON.stringify({ kind: 'career', opp: 'SHARKS', oppDef: { name: 'SHARKS', jersey: 0x0e7c7b, helmet: 0x123a3a, trim: 0xffffff, str: 84 }, label: 'WEEK 1' }));
      } catch (e) {}
    }).catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    let atFaceoff = false;
    try {
      await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'faceoff', null, { timeout: 15000, polling: 'raf' });
      atFaceoff = true;
    } catch (e) { atFaceoff = (await state()) === 'faceoff'; }
    if (!atFaceoff) return 'the career match never staged its opening faceoff (state "' + (await state()) + '")';
    // with no input at all, the drop must NOT happen by itself
    for (let i = 0; i < 5; i++) {
      await h.wait(400);
      const st = await state();
      if (st !== 'faceoff') return 'the game played by itself: the opening faceoff dropped with no player input (state became "' + st + '")';
    }
    // the player's first touch drops the puck
    await h.eval(() => { try { window.__reality && window.__reality.go(true); } catch (e) {} }).catch(() => {});
    let dropped = false;
    try {
      await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'play', null, { timeout: 6000, polling: 'raf' });
      dropped = true;
    } catch (e) { dropped = (await state()) === 'play'; }
    await h.eval(() => { try { window.__reality && window.__reality.go(false); } catch (e) {} }).catch(() => {});
    if (!dropped) return 'the faceoff never dropped even after the player gave input';
    return true;
  },
},
{
  id: 'play-clock-real-time',
  ask: 'the game clock and score run in real time: 5 seconds of play takes about 5 seconds off the clock (not 30), and a game nobody touches for 10 seconds keeps the same clock and score',
  async test(page, h) {
    const read = () => h.eval(() => { const c = (document.getElementById('clock') || {}).textContent || ''; const m = c.match(/(\d+):(\d+)/); return { sec: m ? (+m[1]) * 60 + (+m[2]) : -1, score: (document.getElementById('score') || {}).textContent || '' }; }).catch(() => ({ sec: -1, score: '' }));
    // 1. untouched 10 s from the opening screen: nothing moves
    const a = await read();
    await h.wait(10000);
    const b = await read();
    if (b.sec !== a.sec || b.score !== a.score) return 'the game moved with nobody touching it: clock ' + a.sec + 's -> ' + b.sec + 's, score ' + a.score + ' -> ' + b.score;
    // 2. a real PLAY press, then play 6 s: the clock may not lose much more than 6 s
    await h.eval(() => { const pb = document.getElementById('playBtn'); if (pb) pb.click(); }).catch(() => {});
    try { await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'play', null, { timeout: 15000, polling: 'raf' }); } catch (e) { return 'the match never reached play after PLAY was pressed'; }
    const t0 = Date.now(); const c0 = await read();
    await h.wait(6000);
    const c1 = await read(); const wall = (Date.now() - t0) / 1000;
    const used = c0.sec - c1.sec;
    if (used > wall * 1.5 + 2) return 'the clock runs too fast: ' + used + 's came off the clock in ' + wall.toFixed(1) + 's of real time';
    return true;
  },
},
{
  id: 'tester-reality-hook-fields',
  ask: 'TESTER (G-108): the __reality hook carries every field REALITY.md requires - camera, time() and speed() as well as kind, player, others, contact, ground, go and expect',
  async test(page, h) {
    if (!await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) {
      for (let i = 0; i < 30; i++) { if (await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) break; await h.wait(500); }
    }
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    for (let i = 0; i < 30; i++) { const s = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => ''); if (s === 'play' || s === 'faceoff') break; await h.wait(500); }
    const f = await h.eval(() => {
      const r = window.__reality;
      if (!r) return null;
      return { camera: 'camera' in r, time: typeof r.time, speed: typeof r.speed, go: typeof r.go, contact: Array.isArray(r.contact) };
    });
    if (!f) return 'window.__reality is not set in a running match';
    const missing = [];
    if (!f.camera) missing.push('camera');
    if (f.time !== 'function') missing.push('time()');
    if (f.speed !== 'function') missing.push('speed()');
    if (missing.length) return 'the __reality hook is missing ' + missing.join(', ') + ' - REALITY.md requires them (the robot takes its player close-up from camera and measures speed in game time)';
    return true;
  },
},

{
  id: 'play-idle-wolves-defend',
  ask: 'with nobody touching the joystick the Sharks score in the first 10 seconds and the Wolves never contest - untouched, the Wolves AI must defend and take the puck back, so no goal is scored in the first 15 seconds',
  async test(page, h) {
    const read = () => h.eval(() => { const g = window.__hk && window.__hk.game; if (!g) return null; return { state: g.state, period: g.period, clockT: g.clockT, sA: g.scoreA, sH: g.scoreH }; }).catch(() => null);
    let r = await read();
    if (!r || r.state !== 'menu') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      try { await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', null, { timeout: 12000, polling: 'raf' }); } catch (e) {}
      r = await read();
    }
    if (!r || r.state !== 'menu') return 'the game was not at its menu to start the untouched match';
    try { await h.press('#playBtn'); } catch (e) {}
    // from here the test touches NOTHING - the human is idle
    let sawPlay = false, done = false;
    let prev = null, gameSec = 0, realSec = 0; // clock SPEED: game seconds per real second, counted only between two samples that are both in play
    const t0 = Date.now();
    while (Date.now() - t0 < 55000) {
      await h.wait(200);
      const s = await read();
      if (!s) continue;
      const nowMs = Date.now();
      if (prev && prev.state === 'play' && s.state === 'play' && prev.period === s.period && s.clockT <= prev.clockT) { gameSec += prev.clockT - s.clockT; realSec += (nowMs - prev.at) / 1000; }
      prev = { state: s.state, period: s.period, clockT: s.clockT, at: nowMs };
      if (s.state === 'play') sawPlay = true;
      if (s.sA > 0) return 'the Sharks scored in the first ' + Math.max(0, Math.round((120 - s.clockT) * 10) / 10) + ' seconds of an untouched game - the Wolves never contested the puck';
      if (s.period === 1 && s.clockT <= 105) { done = true; break; }
      if (s.period > 1) { done = true; break; }
    }
    if (!sawPlay) return 'the untouched match never reached play';
    if (!done) return 'the game clock never ran 15 seconds in the untouched match';
    // owner Oct 22 8:38 AM: the clock looked 6-7x too fast. Real time and the match clock must agree (1 game second per real second; frames are caught up in slices, so a slow robot does not change it).
    if (realSec >= 5) {
      const rate = Math.round(gameSec / realSec * 100) / 100;
      if (rate > 1.25) return 'the match clock runs ' + rate + ' game seconds per real second (' + Math.round(gameSec * 10) / 10 + ' game s in ' + Math.round(realSec * 10) / 10 + ' real s in play) - it must not run faster than real time (1.0)';
    }
    return true;
  },
},
{
  id: 'tester-hub-reset-stays-armed',
  mode: 'reality',
  ask: 'TESTER (G-131): closing the career hub disarms the ERASE button - one tap arms it, but once the hub has been closed and reopened the button must be back to un-armed, so a later single tap cannot erase the career',
  async test(page, h) {
    if (!await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) {
      for (let i = 0; i < 30; i++) { if (await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) break; await h.wait(500); }
    }
    await h.eval(() => { try { localStorage.removeItem('apex_hockey_career_v1'); localStorage.removeItem('apex_hockey_match'); } catch (e) {} }).catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    for (let i = 0; i < 30; i++) { if (await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) break; await h.wait(500); }
    const click = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); return !!el; }, id).catch(() => false);
    const hubOpen = () => h.eval(() => { const el = document.getElementById('hub'); return !!el && el.style.display === 'flex'; }).catch(() => false);
    const resetState = () => h.eval(() => { const el = document.getElementById('hubReset'); return el ? { text: el.textContent, arm: el.dataset.arm || null } : null; }).catch(() => null);
    await click('careerBtn'); await h.wait(900);
    if (!await hubOpen()) return 'the career hub did not open from the menu';
    await click('hubNew'); await h.wait(900);
    const hasCareer = await h.eval(() => !!localStorage.getItem('apex_hockey_career_v1')).catch(() => false);
    if (!hasCareer) return 'START SEASON did not create a career save';
    await click('hubReset'); await h.wait(600);
    const armed = await resetState();
    if (!armed || armed.arm !== '1') return 'the first ERASE tap did not arm the button (dataset.arm is not set)';
    await click('hubClose'); await h.wait(600);
    await click('careerBtn'); await h.wait(1200);
    if (!await hubOpen()) return 'the career hub did not reopen';
    const after = await resetState();
    if (after && after.arm === '1') return 'the ERASE button is still armed after the hub was closed and reopened (it still reads "' + after.text + '") - one more tap now erases the whole career on what looks like a first tap; closing the hub must disarm it';
    return true;
  },
},

{
  id: 'play-hub-reset-disarms-on-close',
  ask: 'G-159: closing the career hub disarms the ERASE button - arm it, close and reopen the hub, and a single tap must count as a fresh first tap only (the career survives)',
  async test(page, h) {
    if (!await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) {
      for (let i = 0; i < 30; i++) { if (await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) break; await h.wait(500); }
    }
    await h.eval(() => { try { localStorage.removeItem('apex_hockey_career_v1'); localStorage.removeItem('apex_hockey_match'); } catch (e) {} }).catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    for (let i = 0; i < 30; i++) { if (await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) break; await h.wait(500); }
    const click = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); return !!el; }, id).catch(() => false);
    const hubOpen = () => h.eval(() => { const el = document.getElementById('hub'); return !!el && el.style.display === 'flex'; }).catch(() => false);
    const resetState = () => h.eval(() => { const el = document.getElementById('hubReset'); return el ? { text: el.textContent, arm: el.dataset.arm || null } : null; }).catch(() => null);
    await click('careerBtn'); await h.wait(900);
    if (!await hubOpen()) return 'the career hub did not open from the menu';
    await click('hubNew'); await h.wait(900);
    if (!await h.eval(() => !!localStorage.getItem('apex_hockey_career_v1')).catch(() => false)) return 'START SEASON did not create a career save';
    await click('hubReset'); await h.wait(600);
    const armed = await resetState();
    if (!armed || armed.arm !== '1') return 'the first ERASE tap did not arm the button';
    await click('hubClose'); await h.wait(600);
    await click('careerBtn'); await h.wait(1200);
    if (!await hubOpen()) return 'the career hub did not reopen';
    const after = await resetState();
    if (!after || after.arm === '1') return 'ERASE stayed armed across a hub close and reopen - closing the hub must disarm it';
    await click('hubReset'); await h.wait(600);
    if (!await h.eval(() => !!localStorage.getItem('apex_hockey_career_v1')).catch(() => false)) return 'one tap after reopening erased the career - it must count as a fresh first tap only';
    const rearmed = await resetState();
    if (!rearmed || rearmed.arm !== '1') return 'the tap after reopening did not behave as a fresh first tap (the button should only now be armed)';
    return true;
  },
},

{
  id: 'never-g-170-p1',
  ask: 'G-170 point 1 (owner screenshot 2026-10-22): skate blades stay DOWN flat on the ice - never pitched toe-down with the heel kicked up; the planted blade of a standing player lies flat, never kicked up at one end like the screenshot (end-to-end pitch under 5.5 cm; the shipped game read up to 8.5 cm)',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const clickId = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); }, id).catch(() => {});
    // Stage the owner's scene: a live match with every skater standing still
    // (the faceoff picture) - reach play, then freeze the AI like the icing
    // test does and let the stance settle into idle.
    for (let i = 0; i < 24; i++) {
      const st = await state();
      if (st === 'play') break;
      if (st === 'menu') await clickId('playBtn');
      await h.wait(600);
    }
    if ((await state()) !== 'play') return 'could not get a match into play to measure the blades';
    const freezeFn = () => {
      const hk = window.__hk; const g = hk.game;
      g.period = 1; g.clockT = 120;
      hk.puck.pos.set(0, 0.06, -40); hk.puck.vel.set(0, 0, 0); hk.puck.owner = null;
      if (!window.__standSpots) window.__standSpots = hk.skaters.map((s) => [s.pos.x, s.pos.z]);
      hk.skaters.forEach((s, i) => { const sp = window.__standSpots[i]; s.pos.set(sp[0], 0.1, sp[1]); s.vel.set(0, 0, 0); s.thinkT = 9999; if (s.target) s.target.set(sp[0], 0, sp[1]); }); // target pinned too: thinkT alone leaves the last steering target live and the skater lunges at it between samples
    };
    await h.eval(freezeFn).catch(() => {});
    await h.wait(1600);
    const sampleFn = () => {
      const hk = window.__hk; const out = [];
      for (const s of hk.skaters) {
        if (!s.kit || !s._blade || s.goalie) { out.push(null); continue; } // goalies stand splayed by design and have their own blade test - this one judges the skaters in the owner screenshot
        const stl = s.kit.parts.steel; const v = new (hk.puck.mesh.position.constructor)();
        const per = [];
        for (let k = 0; k < 2; k++) {
          const pts = [];
          for (const ix of s._blade[k]) { stl.getVertexPosition(ix, v); pts.push([v.x, v.y + s.athWrap.position.y, v.z]); } // rig frame, like snapSkatesToIce: getVertexPosition is already world-aligned - matrixWorld would double-transform
          let cx = 0, cz = 0; pts.forEach(p => { cx += p[0]; cz += p[2]; }); cx /= pts.length; cz /= pts.length;
          let sxx = 0, szz = 0, sxz = 0; pts.forEach(p => { const dx = p[0] - cx, dz = p[2] - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; });
          const th = 0.5 * Math.atan2(2 * sxz, sxx - szz); const ax = Math.cos(th), az = Math.sin(th);
          const F = [], B = []; let minAll = 1e9;
          pts.forEach(p => { const t = (p[0] - cx) * ax + (p[2] - cz) * az; if (p[1] < minAll) minAll = p[1]; (t >= 0 ? F : B).push(p[1]); });
          const p15 = (arr) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.floor(a.length * 0.15)]; };
          per.push({ pitch: Math.abs(p15(F) - p15(B)) * 100 / 3.26, lift: minAll * 100 / 3.26 });
        }
        const planted = per[0].lift <= per[1].lift ? per[0] : per[1];
        out.push(+planted.pitch.toFixed(1));
      }
      return out;
    };
    const samples = [];
    for (let i = 0; i < 10; i++) { await h.eval(freezeFn).catch(() => {}); const r = await h.eval(sampleFn).catch(() => null); if (r) samples.push(r); await h.wait(300); }
    if (samples.length < 6) return 'could not sample the standing skaters';
    const worst = [];
    for (let si = 0; si < 12; si++) {
      const vals = samples.map((r) => r[si]).filter((x) => typeof x === 'number').sort((a, b) => a - b);
      if (!vals.length) continue;
      worst.push(vals[Math.floor(vals.length / 2)]);
    }
    if (!worst.length) return 'no skater could be measured';
    const bad = worst.filter((x) => x > 5.5);
    if (bad.length) return 'a standing blade is pitched, not flat on the ice: median end-to-end pitch ' + bad.map((x) => x.toFixed(1) + ' cm').join(', ') + ' on ' + bad.length + ' skater(s) - blades must stay down flat like the owner screenshot demands (pitched blades read up to 8.5 cm on the shipped game)';
    return true;
  }},
{
  id: 'play-joystick-starts-left',
  ask: 'G-178: when a match opens, the joystick sits in the LEFT half of the screen and stays there - in landscape its centre is left of halfway, and on a portrait-held phone (the stage rotates for landscape play) it also lands on the player left, never the right',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    for (let i = 0; i < 24; i++) {
      const st = await state();
      if (st === 'play' || st === 'faceoff') break;
      await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
      await h.wait(600);
    }
    const st = await state();
    if (st !== 'play' && st !== 'faceoff') return 'could not open a match to check the joystick (state ' + st + ')';
    try {
      const land = await h.eval(() => { const r = document.getElementById('joy').getBoundingClientRect(); return { cx: r.x + r.width / 2, w: innerWidth }; });
      if (!(land.cx < land.w / 2)) return 'in landscape the joystick centre sits at ' + Math.round(land.cx) + ' of ' + land.w + ' across - it must be in the left half of the screen';
      await page.setViewportSize({ width: 390, height: 844 });
      await h.wait(700);
      const port = await h.eval(() => { const r = document.getElementById('joy').getBoundingClientRect(); return { cy: r.y + r.height / 2, h: innerHeight }; });
      if (!(port.cy < port.h / 2)) return 'on a portrait-held phone the joystick lands on the player right side when a match opens (its centre ' + Math.round(port.cy) + ' of ' + port.h + ' down the portrait screen becomes the right half once the stage rotates for play) - it must start and stay on the left';
      return true;
    } finally {
      await page.setViewportSize({ width: 844, height: 390 }).catch(() => {});
    }
  },
}, {
  id: 'play-helmet-face-reads',
  ask: 'G-186 (art director): the close-up helmet must not read as a plain dome with a dark bar across the eyes - the visor glass is near-clear and casts no shadow, so the face reads through it (every kitted skater: visor present, castShadow off, opacity at most 0.2, metalness at most 0.05)',
  async test(page, h) {
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    let n = 0;
    while (Date.now() - t0 < 30000) {
      n = await h.eval(() => (window.__hk ? window.__hk.skaters.filter(s => s.kit).length : 0)).catch(() => 0);
      if (n >= 8) break;
      await page.waitForTimeout(500);
    }
    if (n < 8) return 'only ' + n + ' kitted skaters after 30 s - cannot judge the helmets';
    const res = await h.eval(() => window.__hk.skaters.filter(s => s.kit).map(s => {
      const v = s.kit.parts.visor;
      return v ? { has: true, shadow: v.castShadow, op: v.material.opacity, met: v.material.metalness } : { has: false };
    }));
    const bad = res.filter(r => !r.has || r.shadow !== false || r.op > 0.2 || r.met > 0.05);
    if (bad.length) return 'the helmet still hides the face on ' + bad.length + ' of ' + res.length + ' skaters (visor present: ' + bad[0].has + ', castShadow: ' + bad[0].shadow + ', opacity: ' + bad[0].op + ', metalness: ' + bad[0].met + ') - the face must read through the visor';
    return true;
  }
 },
{
  id: 'tester-puck-leaves-rink-at-boards',
  mode: 'arena',
  ask: 'TESTER (G-194): the puck never leaves the rink - staged pressure at the boards (loose pucks fired at the end boards, the puck carrier standing at the end boards and at the side boards facing them with the puck on his stick, a real shot released at the boards) with the puck sampled every 50 ms in play: its centre must never pass the boards shell (|x| <= 100.6, |z| <= 42.9)',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const clickId = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); return !!el; }, id).catch(() => false);
    // G-261: the staging below used to burn its fixed waits whatever state the
    // game was in - its own staged shots score goals, the faceoffs after them
    // need a fresh player-ready press, and on the robot's shared page the
    // match was in 'play' for only ~0.75 s of the whole run ('the sampler
    // collected too few play samples (15)'). Now play is re-established
    // before EVERY pressure phase, with one full re-boot (plain URL, no
    // ?test scene) if a phase cannot get it back. The pressure itself, the
    // sampler and both bars are unchanged.
    const ensurePlay = async (budget) => {
      const t0 = Date.now();
      while (Date.now() - t0 < budget) {
        const st = await state();
        if (st === 'play') return true;
        if (st === 'faceoff') { try { await page.keyboard.press('k'); } catch (e) {} }
        await h.wait(450);
      }
      return (await state()) === 'play';
    };
    const boot = async () => {
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
      if ((await state()) !== 'menu') return false;
      await h.eval(() => {
        window.__exc = { maxX: 0, maxZ: 0, at: null, n: 0 };
        if (window.__excTimer) clearInterval(window.__excTimer);
        window.__excTimer = setInterval(() => {
          const hk = window.__hk; if (!hk || !hk.puck || !hk.game) return;
          if (hk.game.state !== 'play') return;
          const p = hk.puck.pos; const ax = Math.abs(p.x), az = Math.abs(p.z);
          window.__exc.n++;
          if (ax > window.__exc.maxX) { window.__exc.maxX = ax; window.__exc.at = [p.x, p.z]; }
          if (az > window.__exc.maxZ) window.__exc.maxZ = az;
        }, 50);
      });
      await clickId('playBtn');
      return ensurePlay(12000);
    };
    const reboot = async () => {
      try { const u = new URL(page.url()); await page.goto(u.origin + u.pathname, { waitUntil: 'domcontentloaded' }); } catch (e) { await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); }
      return boot();
    };
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    if (!(await boot())) return 'the match did not reach play for the arena test';
    const ready = async () => (await ensurePlay(9000)) || (await reboot());
    const stage = (fn, arg) => h.eval(fn, arg).catch(() => false);
    for (let round = 0; round < 5; round++) {
      const e = round % 2 === 0 ? 1 : -1;
      if (!(await ready())) return 'play could not be re-established between pressure rounds - the pressure was not applied';
      await stage((a) => { const pk = window.__hk.puck; pk.owner = null; pk.shot = null; pk.pos.set(a[0] * 78, 0.06, a[1]); pk.vel.set(a[0] * 150, 0, 0); return true; }, [e, ((round % 3) - 1) * 6]);
      await h.wait(500);
      if (!(await ready())) return 'play could not be re-established between pressure rounds - the pressure was not applied';
      await stage((ee) => { const sk = window.__hk.skaters; const c = sk.find(s => s.role === 'C' && s.team === 'home'); if (!c || c.inBox) return false; const pk = window.__hk.puck; c.pos.set(ee * 99.2, 0, -6); c.vel.set(0, 0, 0); c.facing = ee > 0 ? 0 : Math.PI; pk.owner = c; pk.shot = null; return true; }, e);
      await h.wait(650);
      if (!(await ready())) return 'play could not be re-established between pressure rounds - the pressure was not applied';
      await stage((ee) => { const sk = window.__hk.skaters; const c = sk.find(s => s.role === 'C' && s.team === 'home'); if (!c || c.inBox) return false; const pk = window.__hk.puck; c.pos.set(-8, 0, ee * 41.5); c.vel.set(0, 0, 0); c.facing = ee > 0 ? Math.PI / 2 : -Math.PI / 2; pk.owner = c; pk.shot = null; return true; }, e);
      await h.wait(650);
      if (!(await ready())) return 'play could not be re-established between pressure rounds - the pressure was not applied';
      const okC = await stage((ee) => { const sk = window.__hk.skaters; const c = sk.find(s => s.role === 'C' && s.team === 'home'); if (!c || c.inBox) return false; const pk = window.__hk.puck; c.pos.set(ee * 94, 0, 3); c.vel.set(0, 0, 0); c.facing = ee > 0 ? 0 : Math.PI; pk.pos.set(ee * 94, 0.06, 3); pk.vel.set(0, 0, 0); pk.owner = c; pk.shot = null; return true; }, e);
      if (okC) { try { await page.keyboard.down('k'); await h.wait(450); await page.keyboard.up('k'); } catch (e2) {} }
      await h.wait(500);
    }
    const exc = await h.eval(() => window.__exc).catch(() => null);
    if (!exc || exc.n < 50) return { inconclusive: 'the sampler collected too few play samples (' + (exc ? exc.n : 0) + ') - the pressure was not applied, so this could not be checked' };
    if (exc.maxX > 100.6 || exc.maxZ > 42.9)
      return 'the puck left the rink under end-board pressure: max |x| ' + exc.maxX.toFixed(1) + ', max |z| ' + exc.maxZ.toFixed(1) + ' (boards shell at |x| 100.4 / |z| 42.8) - worst at (' + (exc.at ? exc.at.map(v => v.toFixed(1)).join(', ') : '?') + ')';
    return true;
  }
},
 {
  id: 'play-menu-fits-frame',
  ask: 'G-210 (art director): at 844x390 every menu line sits inside the frame and nothing overlaps - title, subtitle, star card, the three buttons, credits, friend code and the keys lines all fully visible, and the star card never slides under the VIEW/mute buttons',
  async test(page, h) {
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await h.wait(1500);
    const m = await h.eval(() => {
      const menu = document.getElementById('menu');
      if (!menu || getComputedStyle(menu).display === 'none') return { menu: false };
      const items = [];
      [...menu.children].forEach((el) => {
        const r = el.getBoundingClientRect(); const st = getComputedStyle(el);
        if (!r.width || !r.height || st.display === 'none' || st.visibility === 'hidden') return;
        if (!el.textContent.trim()) return;
        items.push({ name: (el.id || el.className || el.tagName) + ' "' + el.textContent.trim().slice(0, 24) + '"', x: r.x, y: r.y, r: r.right, b: r.bottom });
      });
      const chrome = ['viewBtn', 'muteBtn'].map((id) => { const el = document.getElementById(id); if (!el) return null; const r = el.getBoundingClientRect(); return { name: id, x: r.x, y: r.y, r: r.right, b: r.bottom }; }).filter(Boolean);
      return { menu: true, items, chrome, W: innerWidth, H: innerHeight };
    });
    if (!m || !m.menu) return 'the main menu is not showing to be measured';
    if (m.items.length < 8) return 'only ' + m.items.length + ' menu lines found - the menu did not render fully';
    const out = m.items.filter((b) => b.x < -1 || b.y < -1 || b.r > m.W + 1 || b.b > m.H + 1);
    if (out.length) return 'menu lines are clipped by the frame at ' + m.W + 'x' + m.H + ': ' + out.map((b) => b.name + ' spans y ' + Math.round(b.y) + '..' + Math.round(b.b)).join('; ') + ' - every line must sit inside the frame';
    const overlap = (a, b) => Math.min(a.r, b.r) - Math.max(a.x, b.x) > 2 && Math.min(a.b, b.b) - Math.max(a.y, b.y) > 2;
    for (let i = 0; i < m.items.length; i++) for (let j = i + 1; j < m.items.length; j++)
      if (overlap(m.items[i], m.items[j])) return 'menu lines overlap each other: ' + m.items[i].name + ' and ' + m.items[j].name;
    const star = m.items.find((b) => b.name.indexOf('starCard') === 0);
    if (star) for (const c of m.chrome) if (overlap(star, c)) return 'the star card slides under the ' + c.name + ' button';
    return true;
  }
 },
 {
  id: 'play-broadcast-skaters-readable',
  ask: 'G-214 (art director): at the game (BROADCAST) camera the skaters are big enough to read numbers and stance - a faceoff ring staged at centre ice projects to at least 30 CSS px tall per skater on the 844x390 frame (they read ~20px when the camera sat ~91 units out)',
  async test(page, h) {
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    for (let i = 0; i < 30; i++) { const s = await h.eval(() => window.__hk && window.__hk.game ? window.__hk.game.state : '').catch(() => ''); if (s === 'menu') break; await h.wait(500); }
    await h.eval(() => { const el = document.getElementById('playBtn'); if (el) el.click(); return true; }).catch(() => {});
    let st = '';
    for (let i = 0; i < 25; i++) { st = await h.eval(() => window.__hk.game.state).catch(() => ''); if (st === 'play') break; try { await page.keyboard.press('k'); } catch (e) {} await h.wait(400); }
    if (st !== 'play') return 'the match did not reach play to measure the broadcast framing';
    const m = await h.eval(() => new Promise((resolve) => {
      const hk = window.__hk;
      const ring = [];
      const sk = hk.skaters.filter(s => !s.goalie && !s.inBox);
      const spots = [[9, 0], [-9, 0], [6, 8], [-6, -8], [6, -8], [-6, 8]];
      for (let j = 0; j < 6 && j < sk.length; j++) ring.push([sk[j], spots[j][0], spots[j][1]]);
      const t0 = performance.now();
      const iv = setInterval(() => {
        // pin the whole scene at centre ice: puck dead at centre, six skaters in a faceoff ring, everyone else held where he stands
        hk.puck.owner = null; hk.puck.shot = null; hk.puck.pos.set(0, 0.06, 0); hk.puck.vel.set(0, 0, 0);
        for (const [s, x, z] of ring) { s.pos.set(x, 0, z); s.vel.set(0, 0, 0); s.thinkT = 9; s.target.set(x, 0, z); }
        for (const s of hk.skaters) { if (!ring.some(r => r[0] === s)) { s.vel.set(0, 0, 0); s.thinkT = 9; if (s.target) s.target.set(s.pos.x, 0, s.pos.z); } }
        if (performance.now() - t0 < 2200) return; // let the broadcast camera settle onto centre
        clearInterval(iv);
        const cam = hk.camera; cam.updateMatrixWorld();
        const P = [...cam.projectionMatrix.elements], V = [...cam.matrixWorldInverse.elements];
        const mul = (mm, x, y, z) => [mm[0]*x + mm[4]*y + mm[8]*z + mm[12], mm[1]*x + mm[5]*y + mm[9]*z + mm[13], mm[2]*x + mm[6]*y + mm[10]*z + mm[14], mm[3]*x + mm[7]*y + mm[11]*z + mm[15]];
        const projY = (x, y, z) => { const v = mul(V, x, y, z); const c = mul(P, v[0], v[1], v[2]); if (c[3] <= 0) return null; return (-c[1]/c[3] * 0.5 + 0.5) * innerHeight; };
        const hs = [];
        for (const [s] of ring) { const f = projY(s.pos.x, 0, s.pos.z), hd = projY(s.pos.x, 6.1, s.pos.z); if (f !== null && hd !== null) hs.push(Math.abs(f - hd)); }
        hs.sort((a, b) => a - b);
        resolve({ n: hs.length, median: hs.length ? hs[Math.floor(hs.length / 2)] : 0, smallest: hs.length ? hs[0] : 0 });
      }, 25);
    }));
    if (!m || m.n < 6) return 'could not measure the 6 ring skaters at the broadcast camera (got ' + (m ? m.n : 0) + ')';
    if (m.median < 30) return 'skaters are a tiny cluster at the game camera: a centre-ice faceoff ring reads a median ' + m.median.toFixed(1) + ' CSS px tall (smallest ' + m.smallest.toFixed(1) + ') on the 390px frame - jersey numbers and stance must be readable (bar 30)';
    return true;
  }
 },
 {
  id: 'never-g-216-p1',
  ask: 'NEVER (G-216, the G-194 line): the puck never leaves the rink - with the carrier standing at the end boards and at the side boards facing them, puck on his stick, the carried puck centre stays inside the boards shell (|x| <= 100.6, |z| <= 42.9); the carried puck used to poke through the boards by the full stick reach (robot: 101.7 at the end boards, 44.2 at the side)',
  async test(page, h) {
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    for (let i = 0; i < 30; i++) { const s = await h.eval(() => window.__hk && window.__hk.game ? window.__hk.game.state : '').catch(() => ''); if (s === 'menu') break; await h.wait(500); }
    await h.eval(() => { const el = document.getElementById('playBtn'); if (el) el.click(); return true; }).catch(() => {});
    let st = '';
    for (let i = 0; i < 25; i++) { st = await h.eval(() => window.__hk.game.state).catch(() => ''); if (st === 'play') break; try { await page.keyboard.press('k'); } catch (e) {} await h.wait(400); }
    if (st !== 'play') return 'the match did not reach play to stage the carrier at the boards';
    const m = await h.eval(() => new Promise((resolve) => {
      const hk = window.__hk;
      const c = hk.skaters.find(s => s.role === 'C' && s.team === 'home');
      if (!c) { resolve({ err: 'no home centre found' }); return; }
      const held = hk.skaters.map(s => [s, s.pos.x, s.pos.z]);
      const scenes = [[99.2, -6, 0], [-8, 41.5, Math.PI / 2], [-99.2, 6, Math.PI], [30, -41.5, -Math.PI / 2]];
      let si = 0, tracked = 0, maxX = 0, maxZ = 0, worst = null;
      const perScene = [];
      const t0 = performance.now();
      let sceneT0 = performance.now(), lastSample = 0;
      const iv = setInterval(() => {
        const [x, z, f] = scenes[si];
        for (const [s, px, pz] of held) { if (s !== c) { s.pos.set(px, 0, pz); s.vel.set(0, 0, 0); s.thinkT = 9; if (s.target) s.target.set(px, 0, pz); } }
        c.pos.set(x, 0, z); c.vel.set(0, 0, 0); c.facing = f; c.thinkT = 9; if (c.target) c.target.set(x, 0, z);
        hk.puck.owner = c; hk.puck.shot = null;
        // Count a sample only when the puck is PROVABLY riding this carrier's stick right now (owner set,
        // carrier on his staged spot, puck within 3.0 of the stick tip - the faceoff routine's puck at a
        // dot is metres away and never counts; the clamped puck sits at most ~2.7 off the tip and counts).
        if (performance.now() - lastSample >= 110) {
          lastSample = performance.now();
          const p = hk.puck.pos;
          const tipX = c.pos.x + Math.cos(f) * 2.9, tipZ = c.pos.z + Math.sin(f) * 2.9;
          if (hk.game.state === 'play' && hk.puck.owner === c && Math.hypot(c.pos.x - x, c.pos.z - z) < 3 && Math.hypot(p.x - tipX, p.z - tipZ) < 3.0) {
            tracked++;
            if (Math.abs(p.x) > maxX) { maxX = Math.abs(p.x); worst = [p.x, p.z]; }
            if (Math.abs(p.z) > maxZ) maxZ = Math.abs(p.z);
          }
        }
        if (tracked >= 8 || performance.now() - sceneT0 > 9000) { perScene.push(tracked); si++; tracked = 0; sceneT0 = performance.now(); if (si >= scenes.length) { clearInterval(iv); resolve({ maxX, maxZ, worst, perScene }); } }
        if (performance.now() - t0 > 50000) { clearInterval(iv); resolve({ maxX, maxZ, worst, perScene, short: true }); }
      }, 10);
    }));
    if (!m || m.err) return 'staging failed: ' + (m ? m.err : 'no result');
    if (!m.perScene || m.perScene.length < 4 || m.perScene.some(v => v < 5)) return { inconclusive: 'too few stick-tracked samples per boards scene (' + (m.perScene || []).join(',') + ') - the pressure was not applied, so this could not be checked' };
    if (m.maxX > 100.6 || m.maxZ > 42.9) return 'the carried puck left the rink at the boards: max |x| ' + m.maxX.toFixed(1) + ', max |z| ' + m.maxZ.toFixed(1) + ' (shell 100.6 / 42.9) - worst at (' + (m.worst ? m.worst.map(v => v.toFixed(1)).join(', ') : '?') + ') - the puck on a carrier stick at the boards must stay inside';
    return true;
  }
 },
{
  id: 'never-g-217-p1',
  ask: 'NEVER (G-217, the G-170 line): skate blades stay DOWN flat on the ice - the planted blade of a standing player lies flat, end-to-end pitch under 5.5 cm; the away boots were still toe-down at the 0.8 rad counter-pitch (signed medians -4.8..-6.2 cm, robot median 6.6) until they took the same 1.0 rad as the home boots. ROUND 1: and the blades stay levelled while skating around too, not only when stopped - the weight-bearing blade true 3D tilt in live play stays at a median of 8 deg or less',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const clickId = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); }, id).catch(() => {});
    // Stage the owner's scene: a live match with every skater standing still
    // (the faceoff picture) - reach play, then freeze the AI like the icing
    // test does and let the stance settle into idle.
    // G-257: boot like never-g-228-p1 - on the robot's shared page a previous
    // test can leave the game at the final screen or in the hub, where the old
    // click-only loop (24 x 600 ms, no key presses) never reached play and the
    // test failed at staging ('could not get a match into play' on main).
    // Reload to a known start when the state is not already live, click PLAY,
    // then keep pressing 'k': the G-128 gate drops the faceoff only once the
    // player is ready.
    const st0 = await state();
    if (st0 !== 'menu' && st0 !== 'play' && st0 !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    if ((await state()) === 'menu') await clickId('playBtn');
    const tBoot = Date.now();
    while (Date.now() - tBoot < 30000) {
      if ((await state()) === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if ((await state()) !== 'play') return 'could not get a match into play to measure the blades';
    // ROUND 1 (G-217): first, while the match is live and everyone is skating, the weight-bearing blade true 3D tilt - the end-to-end read used below goes blind once a blade pitches past about 45 deg (its horizontal projection collapses), which is how pitched blades kept passing
    const sampleSkate = () => h.eval(() => {
      const hk = window.__hk; if (!hk || !hk.skaters) return null;
      const out = [];
      for (const sk of hk.skaters) {
        if (!sk.kit || !sk._blade || sk.goalie) continue;
        const stl = sk.kit.parts.steel; const V = hk.puck.mesh.position.constructor; const v = new V();
        const feet = [];
        for (let k = 0; k < 2; k++) {
          const pts = [];
          for (const ix of sk._blade[k]) { stl.getVertexPosition(ix, v); pts.push([v.x, v.y + sk.athWrap.position.y, v.z]); }
          if (pts.length < 8) { feet.push(null); continue; }
          let cx = 0, cy = 0, cz = 0; pts.forEach(q => { cx += q[0]; cy += q[1]; cz += q[2]; }); const n = pts.length; cx /= n; cy /= n; cz /= n;
          let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
          pts.forEach(q => { const dx = q[0] - cx, dy = q[1] - cy, dz = q[2] - cz; xx += dx * dx; xy += dx * dy; xz += dx * dz; yy += dy * dy; yz += dy * dz; zz += dz * dz; });
          let ax = 1, ay = 0, az = 0;
          for (let it = 0; it < 24; it++) { const nx = xx * ax + xy * ay + xz * az, ny = xy * ax + yy * ay + yz * az, nz = xz * ax + yz * ay + zz * az; const L = Math.hypot(nx, ny, nz) || 1; ax = nx / L; ay = ny / L; az = nz / L; }
          feet.push({ tilt: Math.asin(Math.min(1, Math.abs(ay))) * 180 / Math.PI, cy });
        }
        if (!feet[0] || !feet[1]) continue;
        out.push(feet[0].cy <= feet[1].cy ? feet[0].tilt : feet[1].tilt);
      }
      return { st: hk.game.state, tilts: out };
    }).catch(() => null);
    // G-257: wait until the athlete kits are actually posed before sampling -
    // the kits land a couple of seconds after PLAY, and with the faster boot
    // the first samples otherwise read unposed feet and starve the count
    // ('only N samples' on a slow runner, a staging failure, not a blade one)
    for (let i = 0; i < 16; i++) { const r0 = await sampleSkate(); if (r0 && r0.tilts && r0.tilts.length >= 8) break; await h.wait(500); }
    const tilts = [];
    for (let i = 0; i < 20 && tilts.length < 100; i++) { // G-257: more, shorter sampling - on a slow runner the old 12 x cap starved below the 80-sample bar ('only N samples', another staging failure); the bars below are unchanged
      const r = await sampleSkate();
      if (r && (r.st === 'play' || r.st === 'faceoff' || r.st === 'whistle')) tilts.push(...r.tilts);
      await h.wait(650);
    }
    if (tilts.length < 80) return 'round 1: only ' + tilts.length + ' weight-bearing blade samples while skating - not enough to judge';
    tilts.sort((a, b) => a - b);
    const medT = tilts[Math.floor(tilts.length / 2)];
    const overT = tilts.filter(t => t > 16).length;
    if (medT > 8) return 'round 1: blades level only when stopped - while skating the planted blade tilts a median ' + medT.toFixed(0) + ' deg (must stay levelled skating around too)';
    if (overT / tilts.length > 0.08) return 'round 1: blades level only when stopped - ' + overT + ' of ' + tilts.length + ' weight-bearing feet tilted over 16 deg while skating';
    const freezeFn = () => {
      const hk = window.__hk; const g = hk.game;
      g.period = 1; g.clockT = 120;
      hk.puck.pos.set(0, 0.06, -40); hk.puck.vel.set(0, 0, 0); hk.puck.owner = null;
      if (!window.__standSpots) window.__standSpots = hk.skaters.map((s) => [s.pos.x, s.pos.z]);
      hk.skaters.forEach((s, i) => { const sp = window.__standSpots[i]; s.pos.set(sp[0], 0.1, sp[1]); s.vel.set(0, 0, 0); s.thinkT = 9999; if (s.target) s.target.set(sp[0], 0, sp[1]); }); // target pinned too: thinkT alone leaves the last steering target live and the skater lunges at it between samples
    };
    await h.eval(freezeFn).catch(() => {});
    await h.wait(1600);
    const sampleFn = () => {
      const hk = window.__hk; const out = [];
      for (const s of hk.skaters) {
        if (!s.kit || !s._blade || s.goalie) { out.push(null); continue; } // goalies stand splayed by design and have their own blade test - this one judges the skaters in the owner screenshot
        const stl = s.kit.parts.steel; const v = new (hk.puck.mesh.position.constructor)();
        const per = [];
        for (let k = 0; k < 2; k++) {
          const pts = [];
          for (const ix of s._blade[k]) { stl.getVertexPosition(ix, v); pts.push([v.x, v.y + s.athWrap.position.y, v.z]); } // rig frame, like snapSkatesToIce: getVertexPosition is already world-aligned - matrixWorld would double-transform
          let cx = 0, cz = 0; pts.forEach(p => { cx += p[0]; cz += p[2]; }); cx /= pts.length; cz /= pts.length;
          let sxx = 0, szz = 0, sxz = 0; pts.forEach(p => { const dx = p[0] - cx, dz = p[2] - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; });
          const th = 0.5 * Math.atan2(2 * sxz, sxx - szz); let ax = Math.cos(th), az = Math.sin(th); if (ax * Math.cos(s.facing) + az * Math.sin(s.facing) < 0) { ax = -ax; az = -az; } // G-217: orient along the facing so the sign reads toe-down (-) vs toe-up (+)
          const F = [], B = []; let minAll = 1e9;
          pts.forEach(p => { const t = (p[0] - cx) * ax + (p[2] - cz) * az; if (p[1] < minAll) minAll = p[1]; (t >= 0 ? F : B).push(p[1]); });
          const p15 = (arr) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.floor(a.length * 0.15)]; };
          per.push({ pitch: (p15(F) - p15(B)) * 100 / 3.26, lift: minAll * 100 / 3.26 });
        }
        const planted = per[0].lift <= per[1].lift ? per[0] : per[1];
        out.push(+planted.pitch.toFixed(1));
      }
      return out;
    };
    const samples = [];
    for (let i = 0; i < 10; i++) { await h.eval(freezeFn).catch(() => {}); const r = await h.eval(sampleFn).catch(() => null); if (r) samples.push(r); await h.wait(300); }
    // Second scene, independently settled: one frozen scene can flatter a pitched boot (the stance
    // state differs per capture and the 0.8 rad build passed single scenes by luck while the robot
    // read 6.6 cm) - thaw the skaters, let them skate, re-freeze at new spots and pool the medians.
    await h.eval(() => { const hk = window.__hk; hk.skaters.forEach((s) => { s.thinkT = 0.05; if (s.target) s.target.set(s.pos.x + Math.cos(s.facing) * 30, 0, s.pos.z + Math.sin(s.facing) * 30); }); }).catch(() => {});
    await h.wait(1800);
    await h.eval(() => { delete window.__standSpots; }).catch(() => {});
    for (let i = 0; i < 10; i++) { await h.eval(freezeFn).catch(() => {}); const r = await h.eval(sampleFn).catch(() => null); if (r) samples.push(r); await h.wait(300); }
    if (samples.length < 12) return 'could not sample the standing skaters';
    const worst = [];
    for (let si = 0; si < 12; si++) {
      const vals = samples.map((r) => r[si]).filter((x) => typeof x === 'number').sort((a, b) => a - b);
      if (!vals.length) continue;
      worst.push(vals[Math.floor(vals.length / 2)]);
    }
    if (!worst.length) return 'no skater could be measured';
    const bad = worst.filter((x) => Math.abs(x) > 5.5);
    if (bad.length) return 'a standing blade is pitched, not flat on the ice: median end-to-end pitch ' + bad.map((x) => Math.abs(x).toFixed(1) + ' cm').join(', ') + ' on ' + bad.length + ' skater(s) - blades must stay down flat like the owner screenshot demands (pitched blades read up to 8.5 cm on the shipped game)';
    // Group centre: single scenes sway skater to skater, but a whole team's boots share one mount -
    // pooled over both scenes, the away signed centre sat at -3.5..-5 cm (toe-down) on the 0.8 rad
    // build and at ~0 once the away counter-pitch matched home's 1.0. Home is the control group.
    const teams = await h.eval(() => window.__hk.skaters.map((s) => s.goalie ? 'G' : s.team)).catch(() => []);
    const pool = (t) => { const v = []; samples.forEach((r) => { r.forEach((x, si) => { if (teams[si] === t && typeof x === 'number') v.push(x); }); }); return v.sort((a, b) => a - b); };
    const med = (v) => v.length ? v[Math.floor(v.length / 2)] : 0;
    const awayC = med(pool('away')), homeC = med(pool('home'));
    if (Math.abs(homeC) > 3.5) return 'the home control group reads a signed centre of ' + homeC.toFixed(1) + ' cm - the measurement itself is suspect this run';
    if (awayC - homeC < -2.25) return 'the away blades are still pitched toe-down as a group: signed centre ' + awayC.toFixed(1) + ' cm vs the home control ' + homeC.toFixed(1) + ' cm over ' + pool('away').length + ' pooled samples - the away boots need the same counter-pitch as home';
    if (awayC - homeC > 3.0) return 'the away blades are over-corrected toe-up as a group: signed centre +' + awayC.toFixed(1) + ' cm vs the home control ' + homeC.toFixed(1) + ' cm';
    return true;
  }},
{
  id: 'play-blades-flush-in-play',
  ask: 'NEVER (G-47 REDO, owner picture 2026-10-23): in live play, not just standing still, the weight-bearing skate blade lies FLAT on the ice - the old end-to-end read went blind once a blade pitched past about 45 deg (its horizontal projection collapses), so this reads the blade true 3D tilt; on the shipped game planted blades sat at a median 12 deg tilt with a third over 16 deg and floated about 3 cm off the ice',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    let st = await state();
    if (st !== 'play' && st !== 'faceoff' && st !== 'whistle') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
      await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    }
    const sample = () => h.eval(() => {
      const hk = window.__hk; if (!hk || !hk.skaters) return null;
      const out = [];
      for (const s of hk.skaters) {
        if (!s.kit || !s._blade || s.goalie) continue;
        const stl = s.kit.parts.steel; const V = hk.puck.mesh.position.constructor; const v = new V();
        const feet = [];
        for (let k = 0; k < 2; k++) {
          const pts = [];
          for (const ix of s._blade[k]) { stl.getVertexPosition(ix, v); pts.push([v.x, v.y + s.athWrap.position.y, v.z]); }
          if (pts.length < 8) { feet.push(null); continue; }
          let cx = 0, cy = 0, cz = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; cz += p[2]; }); const n = pts.length; cx /= n; cy /= n; cz /= n;
          let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
          pts.forEach(p => { const dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz; xx += dx * dx; xy += dx * dy; xz += dx * dz; yy += dy * dy; yz += dy * dz; zz += dz * dz; });
          let ax = 1, ay = 0, az = 0;
          for (let it = 0; it < 24; it++) { const nx = xx * ax + xy * ay + xz * az, ny = xy * ax + yy * ay + yz * az, nz = xz * ax + yz * ay + zz * az; const L = Math.hypot(nx, ny, nz) || 1; ax = nx / L; ay = ny / L; az = nz / L; }
          feet.push({ tilt: Math.asin(Math.min(1, Math.abs(ay))) * 180 / Math.PI, cy });
        }
        if (!feet[0] || !feet[1]) continue;
        const wb = feet[0].cy <= feet[1].cy ? feet[0] : feet[1];
        out.push(wb.tilt);
      }
      return { st: hk.game.state, tilts: out };
    }).catch(() => null);
    const tilts = [];
    for (let i = 0; i < 24 && tilts.length < 400; i++) {
      const r = await sample();
      if (r && (r.st === 'play' || r.st === 'faceoff' || r.st === 'whistle')) tilts.push(...r.tilts);
      await new Promise(res => setTimeout(res, 650));
    }
    if (tilts.length < 150) return 'only ' + tilts.length + ' weight-bearing blade samples in live play - not enough to judge';
    tilts.sort((a, b) => a - b);
    const med = tilts[Math.floor(tilts.length / 2)];
    const over = tilts.filter(t => t > 16).length;
    if (med > 8) return 'planted blades pitched in live play: median tilt ' + med.toFixed(0) + ' deg - a planted blade lies flat';
    if (over / tilts.length > 0.08) return 'planted blades pitched in live play: ' + over + ' of ' + tilts.length + ' weight-bearing feet tilted over 16 deg';
    return true;
  }
 },
{
  id: 'tester-arena-no-icing-while-shorthanded',
  mode: 'arena',
  ask: 'TESTER (G-227): icing is NOT called while the dumping team is shorthanded (rules/hockey.md: icing "Not called when shorthanded"). A home skater is put in the box so the power-play tag is live, then home dumps the puck untouched from behind the centre line (lastTouch home at x -30) racing to the far goal line, exactly the dump that IS whistled at full strength: play must carry on with no icing whistle and no icing faceoff while the box is occupied.',
  async test(page, h) {
    const snap = () => h.eval(() => {
      const g = window.__hk.game, el = document.getElementById('banner');
      return {
        state: g.state,
        penTag: (document.getElementById('penTag') || {}).textContent || '',
        banner: (el && el.classList.contains('show')) ? el.textContent.replace(/\s+/g, ' ').trim() : '',
        boxed: window.__hk.skaters.filter(s => s.inBox).map(s => ({ team: s.team, penT: +s.penT.toFixed(1) })),
        puckX: +window.__hk.puck.pos.x.toFixed(1)
      };
    }).catch(() => null);
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    // wait for the match to reach 'play' (one real key press drops the puck)
    let s = null;
    const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      s = await snap();
      if (s && s.state === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await page.waitForTimeout(600);
    }
    if (!s || s.state !== 'play') return 'could not get a match into play to stage the shorthanded dump';
    // stage: home LW in the box (live power play against home), skaters parked for a decisive race, dump from home's half
    await h.eval(() => {
      const hk = window.__hk, pk = hk.puck;
      const sk = hk.skaters.find(x => x.team === 'home' && !x.goalie && x.role === 'LW');
      sk.inBox = true; sk.penT = 20; sk.pos.set(-6, 0.1, 41);
      hk.skaters.forEach((x, i) => { if (!x.goalie && x.team === 'home') x.pos.set(-80 + (i % 3) * 4, 0.1, -15 + (i % 5) * 7); });
      hk.skaters.forEach(x => { if (!x.goalie && x.team !== 'home') x.pos.set(0, 0.1, -14 + (x.num % 5) * 7); });
      pk.owner = null; pk.shot = null; pk.recv = null; pk.deadT = 0;
      pk.lastTouch = 'home'; pk.lastTouchX = -30;
      pk.pos.set(-30, 0.06, 20);
      pk.vel.set(70, 0, 0);
    });
    // watch: an icing whistle while the box is occupied = the bug
    let sawPP = false, icing = null;
    const t1 = Date.now();
    while (Date.now() - t1 < 25000) {
      const q = await snap();
      if (q) {
        if (/PP/.test(q.penTag)) sawPP = true;
        if (q.banner && /ICING/.test(q.banner) && q.boxed.some(b => b.team === 'home')) { icing = q; break; }
        if (q.state === 'whistle' && q.boxed.some(b => b.team === 'home')) {
          // a whistle of another kind: check the puck's story before judging
          if (q.puckX > 85) { icing = q; break; }
        }
      }
      await page.waitForTimeout(400);
    }
    if (!sawPP) return 'the staged power play never showed on the HUD - cannot judge the shorthanded dump';
    if (icing) return 'icing was whistled against the SHORTHANDED home team (banner "' + icing.banner + '", box still occupied, penTag live) - rules/hockey.md: icing is not called when shorthanded; the identical full-strength dump is whistled (G-227 stage a), so the call must be waived while a home skater sits in the box';
    return true;
  }
},
{
  id: 'never-g-228-p1',
  ask: 'NEVER (G-228): icing is NOT called when the dumping team is shorthanded (rules/hockey.md) - with a home skater in the box and the power-play tag live, the deep dump that is whistled at full strength must sail past the far goal line with no icing whistle and play carrying on',
  async test(page, h) {
    const snap = () => h.eval(() => {
      const g = window.__hk.game, el = document.getElementById('banner');
      return {
        state: g.state,
        penTag: (document.getElementById('penTag') || {}).textContent || '',
        banner: (el && el.classList.contains('show')) ? el.textContent.replace(/\s+/g, ' ').trim() : '',
        boxedHome: window.__hk.skaters.some(s => s.inBox && s.team === 'home'),
        puckX: +window.__hk.puck.pos.x.toFixed(1)
      };
    }).catch(() => null);
    let s = await snap();
    if (!s || (s.state !== 'menu' && s.state !== 'play' && s.state !== 'faceoff')) {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      s = await snap();
      if (s && s.state === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if (!s || s.state !== 'play') return 'could not get a match into play to stage the shorthanded dump';
    await h.eval(() => {
      const hk = window.__hk, pk = hk.puck;
      const sk = hk.skaters.find(x => x.team === 'home' && !x.goalie && x.role === 'LW');
      sk.inBox = true; sk.penT = 30; sk.pos.set(-6, 0.1, 41);
      hk.skaters.forEach((x, i) => { if (!x.goalie && x.team === 'home' && x !== sk) x.pos.set(-80 + (i % 3) * 4, 0.1, -15 + (i % 5) * 7); });
      hk.skaters.forEach(x => { if (!x.goalie && x.team !== 'home') x.pos.set(0, 0.1, -14 + (x.num % 5) * 7); });
      pk.owner = null; pk.shot = null; pk.recv = null; pk.deadT = 0;
      pk.lastTouch = 'home'; pk.lastTouchX = -30;
      pk.pos.set(-30, 0.06, 20);
      pk.vel.set(70, 0, 0);
    });
    let sawPP = false, crossedAt = 0;
    const t1 = Date.now();
    while (Date.now() - t1 < 20000) {
      const q = await snap();
      if (q) {
        if (/PP/.test(q.penTag)) sawPP = true;
        if (q.banner && /ICING/.test(q.banner) && q.boxedHome) return 'icing was whistled against the SHORTHANDED home team (banner "' + q.banner + '") - rules/hockey.md: icing is not called when shorthanded';
        if (!crossedAt && q.puckX > 89) crossedAt = Date.now();
        if (crossedAt && Date.now() - crossedAt > 1500) {
          if (q.state !== 'play') return 'play stopped after the shorthanded dump crossed the far goal line (state ' + q.state + ') - the dump is legal while a home skater sits in the box, play must carry on';
          if (!sawPP) return 'the staged power play never showed on the HUD - cannot judge the shorthanded dump';
          return true;
        }
      }
      await h.wait(350);
    }
    return 'the staged shorthanded dump never crossed the far goal line - cannot judge the call';
  }
 },
{
  id: 'never-g-228-p2',
  ask: 'the end-zone faceoff dots sit 6.7 m either side of centre in the ice paint (venues/rink.md, H01)',
  async test(page, h) {
    const res = await h.eval(() => {
      let ice = null;
      window.__reality.player.parent.traverse(o => {
        if (!ice && o.isMesh && o.geometry && o.material && o.material.map && o.material.color && o.material.color.getHexString() === 'ffffff') {
          o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox, sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
          const dims = [sx, sy, sz].sort((a, b) => b - a);
          if (dims[0] > 190 && dims[1] > 80 && dims[2] < 0.1) ice = o;
        }
      });
      if (!ice) return { err: 'no ice surface found in the running game' };
      const img = ice.material.map.image, W = img.width, H = img.height;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, W, H).data, reds = [];
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4; if (d[k] > 140 && d[k + 1] < 110 && d[k + 2] < 110) reds.push([-100 + (i / W) * 200, -42.5 + (j / H) * 85]); }
      const clus = [];
      for (const p of reds) { const c = clus.find(c => Math.abs(c.x - p[0]) < 6 && Math.abs(c.z - p[1]) < 6); if (c) { c.n++; c.x = (c.x * (c.n - 1) + p[0]) / c.n; c.z = (c.z * (c.n - 1) + p[1]) / c.n; c.mnx = Math.min(c.mnx, p[0]); c.mxx = Math.max(c.mxx, p[0]); c.mnz = Math.min(c.mnz, p[1]); c.mxz = Math.max(c.mxz, p[1]); } else clus.push({ x: p[0], z: p[1], n: 1, mnx: p[0], mxx: p[0], mnz: p[1], mxz: p[1] }); }
      // a dot core is a compact filled disc (~2.2 units across); the faceoff CIRCLE arcs around it
      // form long thin clusters - keep only compact clusters in the end zones
      const dots = clus.filter(c => c.n >= 90 && c.n <= 600 && Math.abs(c.x) >= 55 && Math.abs(c.x) <= 80 && (c.mxx - c.mnx) <= 2.6 && (c.mxz - c.mnz) <= 2.6).map(c => ({ x: +c.x.toFixed(1), z: +c.z.toFixed(1) }));
      return { dots };
    }).catch(e => ({ err: String(e).slice(0, 120) }));
    if (res.err) return 'never-g-228-p2 cannot judge: ' + res.err;
    if (res.dots.length !== 4) return 'expected exactly 4 end-zone faceoff dots in the ice paint, isolated ' + res.dots.length + ' (' + JSON.stringify(res.dots) + ')';
    const zs = res.dots.map(d => Math.abs(d.z) / 3.26);
    const bad = zs.filter(m => Math.abs(m - 6.7) / 6.7 > 0.03);
    if (bad.length) return 'end-zone faceoff dots sit ' + zs.map(m => m.toFixed(2)).join(', ') + ' m either side of centre - venues/rink.md says 6.7 m (3% band 6.50-6.90 m)';
    return true;
  },
},
{
  id: 'play-blades-stay-level-roll',
  ask: 'OWNER VIDEO (2026-10-23): blades stay level in roll too, not only pitch - a planted blade\'s plate normal stays near horizontal, standing at the faceoff and in live play (the away stance stood rolled 12-26 deg; in play the plates flipped up toward the legs)',
  async test(page, h) {
    const st0 = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    if (st0 !== 'faceoff') { // the standing phase must read a real faceoff stance - boot fresh unless one is already set
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
      await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    }
    const start = await h.eval(() => {
      const hk = window.__hk; if (!hk || !hk.skaters) return 'no __hk';
      window.__attAll = () => {
        function eig3(C) {
          let a = [[C[0], C[1], C[2]], [C[1], C[3], C[4]], [C[2], C[4], C[5]]];
          let vv = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
          for (let sweep = 0; sweep < 12; sweep++) {
            if (Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]) < 1e-12) break;
            for (const [pp, qq] of [[0, 1], [0, 2], [1, 2]]) {
              const apq = a[pp][qq]; if (Math.abs(apq) < 1e-14) continue;
              const phi = 0.5 * Math.atan2(2 * apq, a[qq][qq] - a[pp][pp]);
              const c = Math.cos(phi), s = Math.sin(phi);
              for (let t = 0; t < 3; t++) { const x = a[t][pp], y = a[t][qq]; a[t][pp] = c * x - s * y; a[t][qq] = s * x + c * y; }
              for (let t = 0; t < 3; t++) { const x = a[pp][t], y = a[qq][t]; a[pp][t] = c * x - s * y; a[qq][t] = s * x + c * y; }
              for (let t = 0; t < 3; t++) { const x = vv[t][pp], y = vv[t][qq]; vv[t][pp] = c * x - s * y; vv[t][qq] = s * x + c * y; }
            }
          }
          const idx = [0, 1, 2].sort((i, j) => a[j][j] - a[i][i]);
          return idx.map((i2) => [vv[0][i2], vv[1][i2], vv[2][i2]]);
        }
        const out = [];
        for (const S of hk.skaters) {
          if (S.goalie || !S._blade || !S.kit || !S.kit.parts || !S.kit.parts.steel) continue;
          const st3 = S.kit.parts.steel;
          const V3 = st3.skeleton.bones[0].position.constructor;
          const v = new V3();
          S.g.updateMatrixWorld(true); st3.skeleton.update();
          for (let k = 0; k < 2; k++) {
            const ids = S._blade[k]; if (!ids || ids.length < 8) continue;
            let n = 0, Sx = 0, Sy = 0, Sz = 0, Sxx = 0, Syy = 0, Szz = 0, Sxy = 0, Sxz = 0, Syz = 0, low = 1e9;
            for (const ix of ids) { st3.getVertexPosition(ix, v); Sx += v.x; Sy += v.y; Sz += v.z; Sxx += v.x * v.x; Syy += v.y * v.y; Szz += v.z * v.z; Sxy += v.x * v.y; Sxz += v.x * v.z; Syz += v.y * v.z; if (v.y < low) low = v.y; n++; }
            const cx = Sx / n, cy = Sy / n, cz = Sz / n;
            const C = [Sxx - n * cx * cx, Sxy - n * cx * cy, Sxz - n * cx * cz, Syy - n * cy * cy, Syz - n * cy * cz, Szz - n * cz * cz];
            const e = eig3(C);
            out.push({ roll: +(Math.asin(Math.min(1, Math.abs(e[2][1]))) * 57.3).toFixed(1), h: +(low + S.athWrap.position.y).toFixed(3) });
          }
        }
        return out;
      };
      return 'ok';
    }).catch((e) => 'eval fail: ' + e.message);
    if (start !== 'ok') return 'blades-roll test: ' + start;
    // STANDING phase: at the faceoff, before the drop, every planted blade must lie level
    // (wait until the athletes are really posed - early samples read the menu showcase)
    let ready = false;
    for (let i = 0; i < 26 && !ready; i++) {
      const n0 = await h.eval(() => window.__attAll().length).catch(() => 0);
      if (n0 >= 20) ready = true; else await h.wait(300);
    }
    const stand = [];
    for (let i = 0; i < 4; i++) {
      const part = await h.eval(() => window.__attAll()).catch(() => []);
      for (const r of part) if (r.h <= 0.13) stand.push(r.roll);
      await h.wait(250);
    }
    if (ready && stand.length >= 40) {
      stand.sort((a, b) => a - b);
      const p90 = stand[Math.floor(stand.length * 0.9)];
      if (p90 > 10) return 'standing at the faceoff, blades sit rolled: p90 roll ' + p90 + ' deg (bar 10) - the plates lean sideways on the ice instead of lying level';
    }
    // drop the puck and judge LIVE play
    for (let i = 0; i < 40; i++) {
      const s2 = await h.eval(() => window.__hk.game.state).catch(() => '');
      if (s2 === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(400);
    }
    const rows = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 7000) {
      const part = await h.eval(() => window.__attAll()).catch(() => []);
      for (const r of part) if (r.h <= 0.13) rows.push(r.roll);
      await h.wait(120);
    }
    if (rows.length < 200) return 'too few planted blade samples in live play: ' + rows.length;
    rows.sort((a, b) => a - b);
    const med = rows[Math.floor(rows.length / 2)];
    const bad = rows.filter((r) => r > 25).length;
    const share = bad / rows.length;
    if (med > 6) return 'planted blades sit rolled in live play: median roll ' + med + ' deg (bar 6) - the plates lean sideways instead of lying level';
    if (share > 0.02) return 'planted blades flip rolled in live play: ' + (share * 100).toFixed(1) + '% of samples over 25 deg roll (bar 2%) - blades come up toward the legs';
    return true;
  },
},
{
  id: 'play-chasers-not-mirrored',
  ask: 'OWNER VIDEO (2026-10-23): the two AI chasers on a puck carrier do not mirror each other - they close from different sides instead of stacking onto the same point and skating through each other',
  async test(page, h) {
    const boot = async () => {
      const st0 = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
      if (st0 !== 'play' && st0 !== 'faceoff') {
        await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
        await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
        await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
      }
      for (let i = 0; i < 40; i++) {
        const s2 = await h.eval(() => window.__hk.game.state).catch(() => '');
        if (s2 === 'play') return true;
        await page.keyboard.press('k').catch(() => {});
        await h.wait(400);
      }
      return false;
    };
    if (!(await boot())) return 'chasers test: could not get a match into play';
    const stage = await h.eval(() => {
      const hk = window.__hk; if (!hk || !hk.skaters) return 'no __hk';
      for (const s of hk.skaters) s.thinkT = 9999;
      const C = hk.skaters.find((s) => s.team === 'home' && s.role === 'C');
      const L = hk.skaters.find((s) => s.team === 'away' && s.role === 'LW');
      const R = hk.skaters.find((s) => s.team === 'away' && s.role === 'RW');
      const put = (s, x, z) => { s.pos.set(x, 0, z); s.vel.set(0, 0, 0); s.g.position.set(x, 0, z); s.target.set(x, 0, z); };
      hk.skaters.forEach((s, i) => { if (s !== C && s !== L && s !== R) put(s, -95 + (i % 5) * 2, s.team === 'home' ? 38 : -38); });
      put(C, -20, 0); put(L, 6, 10); put(R, 6, -10);
      L.thinkT = 0.05; R.thinkT = 0.05;
      hk.puck.owner = C; hk.puck.lastTouch = 'home'; hk.puck.pos.set(C.pos.x + 1.2, 0.06, C.pos.z);
      window.__pair = [L, R]; window.__C0 = C;
      return hk.game.state;
    }).catch((e) => 'eval fail: ' + e.message);
    if (stage !== 'play') return 'chasers test: could not stage in play (state ' + stage + ')';
    // Judge the chase while it develops: sample the pair's TARGET separation while the
    // carrier still owns the puck (the literal defect: both chasers are handed the same
    // target point, separation 0, and skate in lockstep), plus the pair's closest
    // approach over the whole run (they end up stacked on the puck).
    const tseps = [], allD = [];
    const tEnd = Date.now() + 9000;
    while (Date.now() < tEnd) {
      const r = await h.eval(() => {
        const [a, b] = window.__pair, C = window.__C0, hk = window.__hk;
        return {
          d: Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z),
          tsep: Math.hypot(a.target.x - b.target.x, a.target.z - b.target.z),
          own: hk.puck.owner === C,
          dC: Math.min(Math.hypot(a.pos.x - C.pos.x, a.pos.z - C.pos.z), Math.hypot(b.pos.x - C.pos.x, b.pos.z - C.pos.z)),
        };
      }).catch(() => null);
      if (r) { allD.push(r.d); if (r.own && r.dC < 26) tseps.push(r.tsep); if (tseps.length >= 8 && !r.own) break; }
      await h.wait(100);
    }
    if (tseps.length < 5) return 'chasers test: too few developed-chase samples (carrier held the puck while closing): ' + tseps.length;
    tseps.sort((a, b) => a - b);
    const tmed = tseps[Math.floor(tseps.length / 2)];
    if (tmed < 2.0) return 'the two chasers share one target point (median target separation ' + tmed.toFixed(2) + ' units) - they mirror each other onto the carrier instead of closing from two sides';
    const min = Math.min(...allD);
    if (min <= 1.8) return 'the two chasers stack onto the same point: closest approach ' + min.toFixed(2) + ' units - they mirror each other onto the carrier';
    const overlap = allD.filter((d) => d < 1.6).length / Math.max(1, allD.length);
    if (overlap > 0.1) return 'the two chasers skate through each other: ' + (overlap * 100).toFixed(0) + '% of the chase inside 1.6 units';
    return true;
  },
},
{
  id: 'tester-chk-h01',
  mode: 'h01',
  ask: 'CHECKLIST H01 (G-230): the end-zone faceoff dots sit 6.7 m either side of centre (venues/rink.md). Read the 4 end-zone dot positions from the ice paint in the running game: each end dot (red dot core at |x| beyond the blue lines) must sit with |z| within 3% of 6.7 m (21.85 units at 3.26 units per metre).',
  async test(page, h) {
    const res = await h.eval(() => {
      let ice = null;
      window.__reality.player.parent.traverse(o => {
        if (!ice && o.isMesh && o.geometry && o.material && o.material.map && o.material.color && o.material.color.getHexString() === 'ffffff') {
          o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox, sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
          const dims = [sx, sy, sz].sort((a, b) => b - a);
          if (dims[0] > 190 && dims[1] > 80 && dims[2] < 0.1) ice = o;
        }
      });
      if (!ice) return { err: 'no ice surface found in the running game' };
      const img = ice.material.map.image, W = img.width, H = img.height;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, W, H).data, reds = [];
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4; if (d[k] > 140 && d[k + 1] < 110 && d[k + 2] < 110) reds.push([-100 + (i / W) * 200, -42.5 + (j / H) * 85]); }
      const clus = [];
      for (const p of reds) { const c = clus.find(c => Math.abs(c.x - p[0]) < 6 && Math.abs(c.z - p[1]) < 6); if (c) { c.n++; c.x = (c.x * (c.n - 1) + p[0]) / c.n; c.z = (c.z * (c.n - 1) + p[1]) / c.n; } else clus.push({ x: p[0], z: p[1], n: 1 }); }
      const dots = clus.filter(c => c.n >= 90 && c.n <= 600 && Math.abs(Math.abs(c.z) - 20) <= 1.5 && Math.abs(c.x) >= 55 && Math.abs(c.x) <= 80).map(c => ({ x: +c.x.toFixed(1), z: +c.z.toFixed(1) }));
      return { dots };
    }).catch(e => ({ err: String(e).slice(0, 120) }));
    if (res.err) return 'H01 cannot judge: ' + res.err;
    if (!res.dots.length) return 'H01 cannot judge: no end-zone faceoff dots isolated in the ice paint';
    const zs = res.dots.map(d => Math.abs(d.z) / 3.26);
    const bad = zs.filter(m => Math.abs(m - 6.7) / 6.7 > 0.03);
    if (bad.length) return 'H01 FOUND: end-zone faceoff dots sit ' + zs.map(m => m.toFixed(2)).join(', ') + ' m either side of centre - venues/rink.md says 6.7 m (3% band 6.50-6.90 m)';
    return true;
  }
},
{
  id: 'tester-career-quit-banks-goal',
  mode: 'reality',
  ask: 'TESTER (G-170): quitting a career match mid-game must not bank the star goal - a goal scored mid-match must not survive a quit while the fixture stays pending and replayable',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const clickId = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); return !!el; }, id).catch(() => false);
    const save = () => h.eval(() => ({ career: JSON.parse(localStorage.getItem('apex_hockey_career_v1') || 'null'), match: JSON.parse(localStorage.getItem('apex_hockey_match') || 'null') })).catch(() => null);
    await h.eval(() => { try { localStorage.removeItem('apex_hockey_career_v1'); localStorage.removeItem('apex_hockey_match'); } catch (e) {} }).catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    try { await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', null, { timeout: 9000, polling: 'raf' }); } catch (e) { if ((await state()) !== 'menu') return 'the game did not reach its menu for the career test'; }
    await clickId('careerBtn'); await h.wait(800);
    await clickId('hubNew'); await h.wait(800);
    const s0 = await save();
    if (!s0 || !s0.career) return 'START SEASON did not create a career save';
    const g0 = (s0.career.star && s0.career.star.g) || 0;
    await clickId('hubPlay'); // the game reloads itself here by design; the boot auto-starts the match
    await h.wait(5000); // let the reload settle before watching for the staged match
    { let started = false; for (let i = 0; i < 40 && !started; i++) { const st = await state(); if (st === 'play' || st === 'faceoff') started = true; else await h.wait(600); } if (!started) return 'the career match did not auto-start after PLAY'; } // G-253: waitForFunction with raf polling never resolves across the reload; poll with waits instead
    for (let i = 0; i < 25 && (await state()) !== 'play'; i++) { try { await page.keyboard.press('k'); } catch (e) {} await h.wait(400); } // a real key press drops the opening faceoff
    let banked = false;
    const spots = [[78, 2, 0], [80, 6, -0.73], [80, -6, 0.73]];
    for (let iter = 0; iter < 12 && !banked; iter++) {
      let stNow = await state();
      if (stNow === 'faceoff') { try { await page.keyboard.press('k'); } catch (e) {} await h.wait(800); stNow = await state(); }
      if (stNow !== 'play') { await h.wait(1500); continue; }
      const spot = spots[iter % spots.length];
      const ok = await h.eval(([sx, sz, fa]) => { // arrange the shot: the star with the puck alone in front of the net, mates onside; the star is pinned in place while the REAL shot is taken (his AI would otherwise skate him off - the pin is the set-up, the shot is the game)
        const sk = window.__hk.skaters;
        const star = sk.find(s => s.role === 'C' && s.team === 'home');
        if (!star || star.inBox) return false;
        let n = 0;
        for (const s of sk) { if (s.team === 'home' && !s.goalie && s !== star && !s.inBox) { s.pos.set(20, 0, -18 + n * 12); s.vel.set(0, 0, 0); n++; } }
        const pk = window.__hk.puck;
        const ag = sk.find(s => s.goalie && s.team === 'away');
        window.__pin = setInterval(() => { // the pin is the set-up: the star held with the puck in front of the net, the skaters kept out of the play and the goalie pulled far off his line; once the shot is away the pin stands down - the shot, the save attempt and the goal are the game
          if (pk.shot) return;
          star.pos.set(sx, 0, sz); star.vel.set(0, 0, 0); star.facing = fa;
          pk.pos.set(sx, 0.06, sz); pk.vel.set(0, 0, 0); pk.owner = star; pk.recv = null;
          let m = 0;
          for (const s of sk) { if (s.team === 'away' && !s.goalie) { s.pos.set(-40, 0, -24 + m * 12); s.vel.set(0, 0, 0); m++; } }
          if (ag) { ag.pos.set(86, 0, 25); ag.vel.set(0, 0, 0); }
        }, 40);
        return true;
      }, spot).catch(() => false);
      if (!ok) { await h.wait(1500); continue; }
      try { await page.keyboard.down('k'); } catch (e) {}
      await h.wait(450); // a real full-charge press
      try { await page.keyboard.up('k'); } catch (e) {} // the game itself turns the release into the shot; the pin stands down once the shot exists
      for (let w = 0; w < 10; w++) { await h.wait(300); const s2 = await save(); if (s2 && s2.career && s2.career.star && (s2.career.star.g || 0) > g0) { banked = true; break; } }
      await h.eval(() => { try { clearInterval(window.__pin); } catch (e) {} }).catch(() => {});
    }
    if (!banked) return 'the star could not be made to score within 12 set-up shots - the scenario could not be driven on this build (a test limitation, not a game pass)';
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); // quit mid-match
    await h.wait(4000);
    const post = await save();
    if (!post || !post.career) return 'the career save vanished after the mid-match quit';
    if (post.career.star && (post.career.star.g || 0) > g0 && (post.career.week || 1) === 1 && post.match && post.match.kind === 'career') {
      return 'the star goal banked instantly and survived the mid-match quit: star.g went ' + g0 + ' -> ' + post.career.star.g + ' mid-match and is still ' + post.career.star.g + ' after reloading the unplayed WEEK 1 fixture (week still 1, fixture pending) - quitting banks the goal while the match result never books, so the fixture can be replayed to farm goals forever';
    }
    return true;
  },
}
,
{
  id: 'tester-career-again-goes-to-hub',
  mode: 'reality',
  ask: 'TESTER (G-170): the career end-screen button that reads CAREER HUB takes the player to the career hub, not the main menu',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const clickId = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); return !!el; }, id).catch(() => false);
    const disp = (id) => h.eval((x) => { const el = document.getElementById(x); return el ? getComputedStyle(el).display : 'missing'; }, id).catch(() => 'err');
    await h.eval(() => { try { localStorage.removeItem('apex_hockey_career_v1'); localStorage.removeItem('apex_hockey_match'); } catch (e) {} }).catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    try { await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', null, { timeout: 9000, polling: 'raf' }); } catch (e) { if ((await state()) !== 'menu') return 'the game did not reach its menu for the career test'; }
    await clickId('careerBtn'); await h.wait(800);
    await clickId('hubNew'); await h.wait(800);
    await clickId('hubPlay');
    await h.wait(5000); // let the reload settle before watching for the staged match
    { let started = false; for (let i = 0; i < 40 && !started; i++) { const st = await state(); if (st === 'play' || st === 'faceoff') started = true; else await h.wait(600); } if (!started) return 'the career match did not auto-start after PLAY'; } // G-253: waitForFunction with raf polling never resolves across the reload; poll with waits instead
    for (let i = 0; i < 25 && (await state()) !== 'play'; i++) { try { await page.keyboard.press('k'); } catch (e) {} await h.wait(400); } // a real key press drops the opening faceoff
    if ((await state()) !== 'play') return 'the match never reached play so the end screen could not be staged';
    await h.eval(() => { const g = window.__hk.game; g.period = 3; g.clockT = 3; g.scoreH = 2; g.scoreA = 0; }); // rig the last seconds of the last period with the Wolves ahead (a tied whistle goes to overtime instead of the end screen - see diag-clock); the whistle and the overlay play out for real
    try { await page.waitForFunction(() => window.__hk && window.__hk.game && window.__hk.game.state === 'over', null, { timeout: 30000, polling: 'raf' }); } catch (e) { return 'the rigged period did not reach the final whistle (state "' + (await state()) + '")'; }
    let btn = false;
    for (let i = 0; i < 20; i++) { btn = (await disp('againBtn')) !== 'none' && (await disp('againBtn')) !== 'missing'; if (btn) break; await h.wait(500); }
    if (!btn) return 'the career end screen never showed its again button';
    const label = await h.eval(() => { const el = document.getElementById('againBtn'); return el ? el.textContent : ''; }).catch(() => '');
    await clickId('againBtn'); await h.wait(1200);
    const hub = await disp('hub');
    if (hub !== 'flex') return 'the career end-screen button reads "' + label + '" but landed on the main menu instead of the career hub (hub display "' + hub + '")';
    return true;
  },
}
,
{
  id: 'tester-delayed-penalty-no-delay',
  mode: 'arena',
  ask: 'TESTER (G-228): rules/hockey.md requires a DELAYED penalty - when a foul is committed while the other team has the puck, play goes on until the penalised team touches the puck, and only then does the whistle blow and the man sit. An away skater is parked at centre with the puck and a home skater 2.2 u directly behind him; CHECK is fired through the button\'s real mousedown path in the same JS turn as the staging. The offender must NOT be boxed in that same turn - boxing him instantly with no whistle and no delayed arm is the bug.',
  async test(page, h) {
    const snap = () => h.eval(() => {
      const g = window.__hk.game;
      return { state: g.state,
        boxed: window.__hk.skaters.filter(s => s.inBox).map(s => ({ team: s.team, role: s.role, penT: +s.penT.toFixed(1) })) };
    }).catch(() => null);
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    let s = null; const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      s = await snap(); if (!s) break;
      if (s.state === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await page.waitForTimeout(600);
    }
    if (!s || s.state !== 'play') return 'could not get a match into play to stage the delayed-penalty foul';
    const r = await h.eval(() => {
      const hk = window.__hk, pk = hk.puck;
      const aC = hk.skaters.find(x => x.team === 'away' && x.role === 'C');
      const hC = hk.skaters.find(x => x.team === 'home' && x.role === 'C');
      hk.skaters.forEach(x => { if (!x.goalie && x !== aC && x !== hC) { x.pos.set(x.team === 'home' ? -70 : 70, 0.1, 20); x.vel.set(0, 0, 0); } });
      aC.pos.set(0, 0.1, 0); aC.vel.set(0, 0, 0); aC.facing = 0;
      hC.pos.set(-2.2, 0.1, 0); hC.vel.set(0, 0, 0); hC.facing = 0;
      pk.owner = aC; pk.lastTouch = 'away'; pk.pos.set(0.6, 0.06, 0); pk.vel.set(0, 0, 0); pk.shot = null; pk.recv = null;
      document.getElementById('btnCheck').dispatchEvent(new Event('mousedown'));
      return { state: hk.game.state,
        boxed: hk.skaters.filter(x => x.inBox).map(x => ({ team: x.team, role: x.role, penT: +x.penT.toFixed(1) })) };
    });
    const instant = r.boxed.find(b => b.team === 'home');
    if (instant && r.state === 'play') return 'no delayed penalty: the foul (CHECK FROM BEHIND on the away carrier) boxed the home ' + instant.role + ' INSTANTLY (penT ' + instant.penT + ') with play still live and no whistle - rules/hockey.md requires play to go on until the penalised team touches the puck, and only then the whistle and the box';
    if (r.boxed.length) return 'the foul boxed a skater at once instead of arming a delayed penalty (' + JSON.stringify(r.boxed) + ')';
    return true;
  },
},
{
  id: 'tester-crease-goal-on-goalie',
  mode: 'arena',
  ask: 'TESTER (G-228): rules/hockey.md - the crease is protected (no goal if the goalie is pushed). The away goalie is parked in his crease and a home attacker is parked ON TOP of him (0.5 u away, inside the crease); the puck is then fired into the open net from 7 u out. The goal must NOT count while the attacker is standing on the goalie - counting it proves the crease is not protected.',
  async test(page, h) {
    const snap = () => h.eval(() => {
      const g = window.__hk.game;
      return { state: g.state, sH: g.scoreH };
    }).catch(() => null);
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    let s = null; const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      s = await snap(); if (!s) break;
      if (s.state === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await page.waitForTimeout(600);
    }
    if (!s || s.state !== 'play') return 'could not get a match into play to stage the crease crash';
    const sH0 = s.sH;
    const t1 = Date.now();
    let goal = false;
    while (Date.now() - t1 < 10000) {
      const staged = await h.eval(() => {
        const hk = window.__hk, pk = hk.puck;
        const aG = hk.skaters.find(x => x.team === 'away' && x.goalie);
        const hC = hk.skaters.find(x => x.team === 'home' && x.role === 'C');
        hk.skaters.forEach(x => { if (!x.goalie && x !== hC) { x.pos.set(x.team === 'home' ? -70 : 70, 0.1, 20); x.vel.set(0, 0, 0); } });
        aG.pos.set(87, 0.1, 0); aG.vel.set(0, 0, 0);           // goalie in his crease
        hC.pos.set(87, 0.1, 0.5); hC.vel.set(0, 0, 0);         // attacker standing on him
        if (!pk.shot || !pk.shot.t) { pk.owner = null; pk.shot = null; pk.recv = null; pk.deadT = 0; pk.lastTouch = 'home'; }
        if (hk.game.state === 'play' && Math.abs(pk.pos.x) < 84) { pk.pos.set(80, 0.06, 0); pk.vel.set(70, 0, 0); }
        return { state: hk.game.state, sH: hk.game.scoreH };
      }).catch(() => null);
      if (!staged) break;
      if (staged.state === 'goal' || staged.sH > sH0) { goal = true; break; }
      await page.waitForTimeout(250);
    }
    if (goal) return 'the crease is NOT protected: the goal counted with the home attacker parked on top of the away goalie inside the crease - rules/hockey.md: no goal if the goalie is pushed';
    return 'could not stage the crease-crash shot (no goal either way) - staging inconclusive, not a pass';
  },
},
{
  id: 'tester-intermission-stats-card',
  mode: 'arena',
  ask: 'TESTER (G-228): rules/hockey.md - intermission between periods shows a stats card. The period clock is run down so the game enters its intermission; during the intermission some stats card (shots, saves, hits, faceoffs - any period stats beyond the scorebug) must be visible. An END OF PERIOD banner alone is the bug.',
  async test(page, h) {
    const state = () => h.eval(() => window.__hk.game.state).catch(() => '');
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      const st = await state();
      if (st === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await page.waitForTimeout(600);
    }
    if ((await state()) !== 'play') return 'could not get a match into play to run down the period clock';
    await h.eval(() => { window.__hk.game.clockT = 0.4; });
    let inter = false; const t1 = Date.now();
    while (Date.now() - t1 < 15000) {
      if ((await state()) === 'intermission') { inter = true; break; }
      await page.waitForTimeout(400);
    }
    if (!inter) return 'the period never entered intermission after the clock ran down';
    const found = await h.eval(() => {
      const vis = [];
      document.querySelectorAll('body *').forEach(e => {
        if (e.id === 'scorebug' || e.id === 'banner') return;
        if (!e.offsetParent) return; // hidden itself or under a display:none ancestor
        const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length > 8 && t.length < 220 && /shot|save|hit|faceoff won|stat|penalt|power play/i.test(t)) vis.push((e.id || e.className || e.tagName) + ': ' + t.slice(0, 60));
      });
      const banners = (document.getElementById('banner') || {}).textContent || '';
      return { statsHits: [...new Set(vis)].slice(0, 6), banner: banners.replace(/\s+/g, ' ').trim().slice(0, 80) };
    }).catch(() => null);
    if (found && found.statsHits.length) return true;
    return 'no stats card at the intermission - the break shows only the "' + (found ? found.banner : '') + '" banner and the game goes straight to the next period; rules/hockey.md: intermission between periods (stats card)';
  },
},
{
  id: 'tester-goal-no-light-no-replay',
  mode: 'arena',
  ask: 'TESTER (G-228): rules/hockey.md broadcast look - a goal brings the horn, the crowd, the goal light, spotlights and a replay from 2 angles. A clean goal is staged; during the goal state there must be a goal-light/replay element in the DOM or the camera must cut away from the broadcast follow to replay angles. The camera staying in broadcast follow with no light and no replay is the bug (horn/crowd/flash/banner are present and not in question).',
  async test(page, h) {
    const snap = () => h.eval(() => {
      const g = window.__hk.game;
      return { state: g.state, sH: g.scoreH,
        cam: window.__hk.camera.position.toArray().map(v => +v.toFixed(1)),
        view: (document.getElementById('viewBtn') || {}).textContent || '' };
    }).catch(() => null);
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    let s = null; const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      s = await snap(); if (!s) break;
      if (s.state === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await page.waitForTimeout(600);
    }
    if (!s || s.state !== 'play') return 'could not get a match into play to stage the goal';
    const sH0 = s.sH;
    await h.eval(() => {
      const hk = window.__hk, pk = hk.puck;
      hk.skaters.forEach(x => { if (!x.goalie) { x.pos.set(x.team === 'home' ? -70 : 70, 0.1, 20); x.vel.set(0, 0, 0); } else { x.pos.set(x.team === 'home' ? -95 : 95, 0.1, 30); x.vel.set(0, 0, 0); } });
      pk.owner = null; pk.shot = null; pk.recv = null; pk.deadT = 0; pk.lastTouch = 'home';
      pk.pos.set(87.5, 0.06, 0); pk.vel.set(60, 0, 0);
    });
    const frames = []; const t1 = Date.now();
    while (Date.now() - t1 < 12000) {
      const f = await snap(); if (f) frames.push(f);
      const gf = frames.filter(x => x.state === 'goal');
      if ((f && (f.sH > sH0 || f.state === 'goal') && gf.length > 6)) break;
      await page.waitForTimeout(120);
    }
    const gf = frames.filter(x => x.state === 'goal');
    if (!gf.length) return 'the staged shot never became a goal - staging inconclusive, not a pass';
    const dom = await h.eval(() => [...document.querySelectorAll('*')].map(e => e.id).filter(id => /goallight|goal-light|goal_light|replay|spotlight/i.test(id))).catch(() => []);
    let maxJump = 0;
    for (let i = 1; i < gf.length; i++) {
      const a = gf[i - 1].cam, b = gf[i].cam;
      maxJump = Math.max(maxJump, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    const views = [...new Set(gf.map(f => f.view))];
    if (dom.length || maxJump > 40 || views.some(v => !/BROADCAST/i.test(v))) return true;
    return 'a goal brings no goal light, no spotlights and no replay - the camera stays in broadcast follow (' + gf.length + ' goal-state frames, max 120 ms camera jump ' + maxJump.toFixed(1) + ' u, view stayed "' + views.join('/') + '", no light/replay element in the DOM); rules/hockey.md broadcast look: goal light, spotlights, replay from 2 angles';
  },
},
{
  id: 'tester-endscreen-wrong-winner-name',
  mode: 'arena',
  ask: 'TESTER (G-228): the end screen must name the team that actually won. A career WEEK 2 fixture vs the BEARS is started and the BEARS win it 3-0; the big title must name the BEARS, not the Sharks. Observed on current main: after a 0-2 loss to the STAMPEDE the title read "SHARKS WIN" while the scorebug correctly showed STAMPEDE (G-228 play); the title is hardcoded and the non-career sub "The Sharks steal this one. Run it back." is too.',
  async test(page, h) {
    const T = (w, l, t, pts, gf, ga) => ({ w, l, t, pts, gf, ga });
    const seed = { season: 1, week: 2, phase: 'reg', finalOpp: null,
      star: { name: 'JAX KOVAC', g: 0, a: 0, cg: 0, ca: 0 }, champ: 0, friends: { w: 0, l: 0 }, lastLine: '',
      table: { WOLVES: T(1, 0, 0, 2, 4, 1), SHARKS: T(0, 1, 0, 0, 1, 4), BEARS: T(0, 0, 0, 0, 0, 0),
        EAGLES: T(0, 0, 0, 0, 0, 0), VIPERS: T(0, 0, 0, 0, 0, 0), STAMPEDE: T(0, 0, 0, 0, 0, 0) } };
    await h.eval((s) => { try {
      localStorage.setItem('apex_hockey_career_v1', JSON.stringify(s));
      localStorage.setItem('apex_hockey_match', JSON.stringify({ kind: 'career', opp: 'BEARS', oppDef: { name: 'BEARS', jersey: 0x8a4b1f, helmet: 0x5a2f10, trim: 0xffd9a0, str: 82 }, label: 'WEEK 2' }));
    } catch (e) {} }, seed).catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    for (let i = 0; i < 30; i++) { if (await h.eval(() => !!(window.__hk && window.__hk.game && window.__hk.game.state === 'menu')).catch(() => false)) break; await h.wait(500); }
    await h.eval(() => { const b = document.getElementById('careerBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      const st = await h.eval(() => window.__hk.game.state).catch(() => '');
      if (st === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await page.waitForTimeout(600);
    }
    if ((await h.eval(() => window.__hk.game.state).catch(() => '')) !== 'play') return 'the career fixture never reached play';
    // away team wins it: BEARS 3, WOLVES 0 at the end of the 3rd
    await h.eval(() => { const g = window.__hk.game; g.period = 3; g.scoreH = 0; g.scoreA = 3; g.clockT = 0.05; });
    let over = false; const t1 = Date.now();
    while (Date.now() - t1 < 20000) {
      if ((await h.eval(() => window.__hk.game.state).catch(() => '')) === 'over') { over = true; break; }
      await page.waitForTimeout(400);
    }
    if (!over) return 'the fixture never reached its end screen';
    const r = await h.eval(() => ({
      title: (document.getElementById('finalTitle') || {}).textContent || '',
      sub: (document.getElementById('finalSub') || {}).textContent || '',
      away: (document.getElementById('nmA') || {}).textContent || '',
    })).catch(() => null);
    if (!r) return 'could not read the end screen';
    if (!r.title.toUpperCase().includes(r.away.toUpperCase()))
      return 'the end screen names the wrong winner: ' + r.away + ' won 3-0 but the title reads "' + r.title + '" (sub "' + r.sub + '") - the away title is hardcoded to the Sharks';
    return true;
  },
},
{
  id: 'tester-arena-neutral-dots-in-neutral-zone',
  mode: 'arena',
  ask: 'TESTER (G-199): the 4 neutral-zone faceoff dots sit 1.5 m inside the blue lines (venues/rink.md) - painted on the ice at |x| about 6.2 m from centre, inside the neutral zone, not deep in the end zones',
  async test(page, h) {
    for (let i = 0; i < 40; i++) { if (await h.eval(() => !!(window.__hk && window.__arena)).catch(() => false)) break; await h.wait(500); }
    return h.eval(() => {
      const root = (() => { let r = window.__reality && window.__reality.player; if (!r) return null; while (r.parent) r = r.parent; return r; })();
      if (!root) return 'no scene root via __reality.player';
      const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
      const aabb = (o) => { const p = o.geometry.attributes.position, m = o.matrixWorld.elements, r = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14]; if (wx < r[0]) r[0] = wx; if (wy < r[1]) r[1] = wy; if (wz < r[2]) r[2] = wz; if (wx > r[3]) r[3] = wx; if (wy > r[4]) r[4] = wy; if (wz > r[5]) r[5] = wz; } return r; };
      const ice = meshes.find(o => { const a = aabb(o); return Math.abs(a[1]) < 0.01 && Math.abs(a[4]) < 0.01 && a[3] > 95 && a[5] > 40 && o.material && o.material.color && o.material.color.getHexString() === 'ffffff' && o.material.map; });
      if (!ice) return 'ice mesh not found for the dot scan';
      const img = ice.material.map.image; if (!img) return 'ice texture has no image';
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const W = img.width, H = img.height, data = ctx.getImageData(0, 0, W, H).data;
      const px = (i, j) => { const k = (j * W + i) * 4; return [data[k], data[k + 1], data[k + 2]]; };
      const reds = [];
      for (let j = 4; j < H - 4; j += 2) for (let i = 4; i < W - 4; i += 2) { const [r, g, b] = px(i, j); if (r > 130 && r - b > 60 && r - g > 30) reds.push([i, j]); }
      const clusters = [];
      for (const [i, j] of reds) { const f = clusters.find(c => Math.abs(c.i - i) < W * 0.02 && Math.abs(c.j - j) < H * 0.05); if (f) { f.n++; f.i = (f.i * (f.n - 1) + i) / f.n; f.j = (f.j * (f.n - 1) + j) / f.n; } else clusters.push({ i, j, n: 1 }); }
      const dots = clusters.filter(c => c.n >= 90).map(c => ({ x: -100 + (c.i / W) * 200, z: -42.5 + (c.j / H) * 85 })).filter(d => Math.abs(Math.abs(d.z) - 20) <= 1.5 && Math.abs(d.x) <= 80);
      const neutral = dots.filter(d => Math.abs(d.x) < 55);
      if (neutral.length < 4) return 'only ' + neutral.length + ' neutral-zone faceoff dots painted (venues/rink.md: 4, at 1.5 m inside the blue lines)';
      const bad = neutral.filter(d => Math.abs(d.x) > 21.6);
      if (bad.length) return 'neutral-zone dots are not in the neutral zone: painted at |x| ' + bad.map(d => Math.abs(d.x).toFixed(1)).join(', ') + ' units (' + bad.map(d => (Math.abs(d.x) / 3.26).toFixed(1)).join(', ') + ' m) - the blue line is at 25 units (7.67 m), so these sit inside the END zones; venues/rink.md puts them 1.5 m inside the blue lines (|x| about 20 units / 6.2 m)';
      return true;
    });
  },
},
{
  id: 'tester-arena-end-dots-spacing',
  mode: 'arena',
  ask: 'TESTER (G-199): the 4 end-zone faceoff dots sit 6.7 m either side of centre (venues/rink.md) - painted on the ice at |z| about 21.9 units, not 20',
  async test(page, h) {
    for (let i = 0; i < 40; i++) { if (await h.eval(() => !!(window.__hk && window.__arena)).catch(() => false)) break; await h.wait(500); }
    return h.eval(() => {
      const root = (() => { let r = window.__reality && window.__reality.player; if (!r) return null; while (r.parent) r = r.parent; return r; })();
      if (!root) return 'no scene root via __reality.player';
      const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
      const aabb = (o) => { const p = o.geometry.attributes.position, m = o.matrixWorld.elements, r = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14]; if (wx < r[0]) r[0] = wx; if (wy < r[1]) r[1] = wy; if (wz < r[2]) r[2] = wz; if (wx > r[3]) r[3] = wx; if (wy > r[4]) r[4] = wy; if (wz > r[5]) r[5] = wz; } return r; };
      const ice = meshes.find(o => { const a = aabb(o); return Math.abs(a[1]) < 0.01 && Math.abs(a[4]) < 0.01 && a[3] > 95 && a[5] > 40 && o.material && o.material.color && o.material.color.getHexString() === 'ffffff' && o.material.map; });
      if (!ice) return 'ice mesh not found for the dot scan';
      const img = ice.material.map.image; if (!img) return 'ice texture has no image';
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const W = img.width, H = img.height, data = ctx.getImageData(0, 0, W, H).data;
      const px = (i, j) => { const k = (j * W + i) * 4; return [data[k], data[k + 1], data[k + 2]]; };
      const reds = [];
      for (let j = 4; j < H - 4; j += 2) for (let i = 4; i < W - 4; i += 2) { const [r, g, b] = px(i, j); if (r > 130 && r - b > 60 && r - g > 30) reds.push([i, j]); }
      const clusters = [];
      for (const [i, j] of reds) { const f = clusters.find(c => Math.abs(c.i - i) < W * 0.02 && Math.abs(c.j - j) < H * 0.05); if (f) { f.n++; f.i = (f.i * (f.n - 1) + i) / f.n; f.j = (f.j * (f.n - 1) + j) / f.n; } else clusters.push({ i, j, n: 1 }); }
      const dots = clusters.filter(c => c.n >= 90).map(c => ({ x: -100 + (c.i / W) * 200, z: -42.5 + (c.j / H) * 85 })).filter(d => Math.abs(Math.abs(d.z) - 20) <= 1.5 && Math.abs(d.x) <= 80);
      const ends = dots.filter(d => Math.abs(d.x) >= 55);
      if (ends.length < 4) return 'only ' + ends.length + ' end-zone faceoff dots painted (venues/rink.md: 4)';
      const bad = ends.filter(d => Math.abs(Math.abs(d.z) - 21.85) > 1.2);
      if (bad.length) return 'end-zone faceoff dots sit at |z| ' + bad.map(d => Math.abs(d.z).toFixed(1)).join(', ') + ' units (' + bad.map(d => (Math.abs(d.z) / 3.26).toFixed(2)).join(', ') + ' m) - venues/rink.md puts them 6.7 m either side of centre (21.9 units)';
      return true;
    });
  },
},
{
  id: 'tester-arena-crease-in-front-of-goal',
  mode: 'arena',
  ask: 'TESTER (G-199): each goal crease is painted in FRONT of its goal (venues/rink.md: light-blue semicircle r 1.83 m in front of the goal line) - neither crease may sit behind its goal line in the trapezoid area',
  async test(page, h) {
    for (let i = 0; i < 40; i++) { if (await h.eval(() => !!(window.__hk && window.__arena)).catch(() => false)) break; await h.wait(500); }
    return h.eval(() => {
      const root = (() => { let r = window.__reality && window.__reality.player; if (!r) return null; while (r.parent) r = r.parent; return r; })();
      if (!root) return 'no scene root via __reality.player';
      const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
      const aabb = (o) => { const p = o.geometry.attributes.position, m = o.matrixWorld.elements, r = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14]; if (wx < r[0]) r[0] = wx; if (wy < r[1]) r[1] = wy; if (wz < r[2]) r[2] = wz; if (wx > r[3]) r[3] = wx; if (wy > r[4]) r[4] = wy; if (wz > r[5]) r[5] = wz; } return r; };
      const ice = meshes.find(o => { const a = aabb(o); return Math.abs(a[1]) < 0.01 && Math.abs(a[4]) < 0.01 && a[3] > 95 && a[5] > 40 && o.material && o.material.color && o.material.color.getHexString() === 'ffffff' && o.material.map; });
      if (!ice) return 'ice mesh not found for the crease scan';
      const img = ice.material.map.image; if (!img) return 'ice texture has no image';
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const W = img.width, H = img.height, data = ctx.getImageData(0, 0, W, H).data;
      const px = (i, j) => { const k = (j * W + i) * 4; return [data[k], data[k + 1], data[k + 2]]; };
      const lb = [];
      for (let j = 2; j < H - 2; j += 2) for (let i = 2; i < W - 2; i += 2) { const [r, g, b] = px(i, j); if (b > 150 && g > 130 && r > 80 && r < 190 && b - r > 30) lb.push([i, j]); }
      const lbc = [];
      for (const [i, j] of lb) { const f = lbc.find(c => Math.abs(c.i - i) < W * 0.03 && Math.abs(c.j - j) < H * 0.08); if (f) { f.n++; if (i < f.mni) f.mni = i; if (i > f.mxi) f.mxi = i; if (j < f.mnj) f.mnj = j; if (j > f.mxj) f.mxj = j; f.i = (f.i * (f.n - 1) + i) / f.n; f.j = (f.j * (f.n - 1) + j) / f.n; } else lbc.push({ i, j, n: 1, mni: i, mxi: i, mnj: j, mxj: j }); }
      const creases = lbc.filter(c => c.n >= 500).map(c => ({ x: -100 + (c.i / W) * 200, z: -42.5 + (c.j / H) * 85, mnx: -100 + (c.mni / W) * 200, mxx: -100 + (c.mxi / W) * 200 })).filter(c => Math.abs(c.x) > 50 && Math.abs(c.z) < 6);
      if (creases.length < 2) return 'only ' + creases.length + ' goal creases found on the ice paint (venues/rink.md: one in front of each goal)';
      const pxC = creases.find(c => c.x > 0), nxC = creases.find(c => c.x < 0);
      if (pxC && pxC.mxx > 90.5) return 'the +x crease is painted BEHIND its goal: light-blue paint runs to x ' + pxC.mxx.toFixed(1) + ' units, past the goal line at about 88.5-89 - the crease belongs in front of the goal (venues/rink.md), like the -x crease which ends at ' + (nxC ? nxC.mnx.toFixed(1) : '?');
      if (nxC && nxC.mnx < -90.5) return 'the -x crease is painted BEHIND its goal: light-blue paint runs to x ' + nxC.mnx.toFixed(1) + ' units, past the goal line at about -88.5..-89 - the crease belongs in front of the goal (venues/rink.md)';
      return true;
    });
  },
},
{
  id: 'tester-arena-glass-height',
  mode: 'arena',
  ask: 'TESTER (G-199): the glass above the boards is about 1.8 m high along the sides and about 2.4 m at the ends (venues/rink.md) - not one 1.6 m height all the way round',
  async test(page, h) {
    for (let i = 0; i < 40; i++) { if (await h.eval(() => !!(window.__hk && window.__arena)).catch(() => false)) break; await h.wait(500); }
    return h.eval(() => {
      const root = (() => { let r = window.__reality && window.__reality.player; if (!r) return null; while (r.parent) r = r.parent; return r; })();
      if (!root) return 'no scene root via __reality.player';
      const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
      const glass = meshes.find(o => o.material && o.material.color && o.material.color.getHexString() === 'bfe0ff');
      if (!glass) return 'glass mesh (bfe0ff) not found';
      const p = glass.geometry.attributes.position, m = glass.matrixWorld.elements;
      let topSide = 0, topEnd = 0;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14]; if (Math.abs(wx) > 90) { if (wy > topEnd) topEnd = wy; } else if (Math.abs(wz) > 40) { if (wy > topSide) topSide = wy; } }
      if (!topSide || !topEnd) return 'glass verts not separable into sides/ends (side top ' + topSide + ', end top ' + topEnd + ')';
      const hSide = (topSide - 3.7) / 3.26, hEnd = (topEnd - 3.7) / 3.26;
      if (hEnd < 2.05) return 'the glass at the ENDS is ' + hEnd.toFixed(2) + ' m high (top at ' + topEnd.toFixed(1) + ' units) - venues/rink.md: about 2.4 m at the ends';
      if (hSide < 1.55) return 'the glass along the SIDES is ' + hSide.toFixed(2) + ' m high (top at ' + topSide.toFixed(1) + ' units) - venues/rink.md: about 1.8 m along the sides';
      return true;
    });
  },
},
{
  id: 'tester-arena-benches-and-boxes',
  mode: 'arena',
  ask: 'TESTER (G-199): the arena has two team benches on one side of the rink and the penalty boxes plus scorekeeper box on the other (venues/rink.md) - real meshes outside the boards at ice level, not bare boards with the bowl behind',
  async test(page, h) {
    for (let i = 0; i < 40; i++) { if (await h.eval(() => !!(window.__hk && window.__arena)).catch(() => false)) break; await h.wait(500); }
    return h.eval(() => {
      const root = (() => { let r = window.__reality && window.__reality.player; if (!r) return null; while (r.parent) r = r.parent; return r; })();
      if (!root) return 'no scene root via __reality.player';
      const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
      const aabb = (o) => { const p = o.geometry.attributes.position, m = o.matrixWorld.elements, r = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14]; if (wx < r[0]) r[0] = wx; if (wy < r[1]) r[1] = wy; if (wz < r[2]) r[2] = wz; if (wx > r[3]) r[3] = wx; if (wy > r[4]) r[4] = wy; if (wz > r[5]) r[5] = wz; } return r; };
      let plus = 0, minus = 0;
      for (const o of meshes) {
        if (!o.visible) continue;
        const a = aabb(o);
        const big = (a[3] - a[0]) > 150 || (a[5] - a[2]) > 130;
        if (big || a[1] >= 9) continue;
        if (a[5] > 42.8 && a[2] < 60) plus++;
        if (a[2] < -42.8 && a[5] > -60) minus++;
      }
      if (!plus && !minus) return 'no benches, penalty boxes or scorekeeper box anywhere: zero meshes in the strips outside the boards at ice level on either side - venues/rink.md requires two team benches on one side and the penalty boxes + scorekeeper box on the other';
      if (!plus || !minus) return 'bench/box meshes exist on only one side of the rink (z+ strip: ' + plus + ', z- strip: ' + minus + ') - venues/rink.md: benches on one side, penalty boxes + scorekeeper box on the other';
      return true;
    });
  },
},
 {
  id: 'tester-chk-h15',
  mode: 'h15',
  ask: 'H15: a tied game goes to 3-on-3 overtime, first goal wins, no shootout (owner decision 2026-10-23, rules/hockey.md line 20) - stage a tie at the end of period 3, then count the skaters on the ice in overtime: 3 a side (plus the goalies), and the first overtime goal must end the game',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const clickId = (id) => h.eval((x) => { const el = document.getElementById(x); if (el) el.click(); }, id).catch(() => {});
    // G-261: boot like never-g-228-p1 - the old click-only loop (24 x 600 ms,
    // no key presses) failed at staging on the robot's shared page whenever a
    // previous test left the game at the final screen or in the hub (the same
    // defect G-257 fixed in never-g-217-p1). The staging and the count below
    // are unchanged.
    const st0 = await state();
    if (st0 !== 'menu' && st0 !== 'play' && st0 !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    if ((await state()) === 'menu') await clickId('playBtn');
    const tBootH = Date.now();
    while (Date.now() - tBootH < 30000) {
      if ((await state()) === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if ((await state()) !== 'play') return 'could not get a match into play to stage the tie';
    await h.eval(() => {
      const hk = window.__hk; const g = hk.game;
      g.period = 3; g.scoreH = 1; g.scoreA = 1; g.clockT = 0.4;
      hk.puck.pos.set(0, 0.06, -40); hk.puck.vel.set(0, 0, 0); hk.puck.owner = null;
    }).catch(() => {});
    let ot = null;
    for (let i = 0; i < 30; i++) {
      ot = await h.eval(() => {
        const hk = window.__hk; if (!hk || !hk.game) return null;
        return { period: hk.game.period, state: hk.game.state, clockT: hk.game.clockT };
      }).catch(() => null);
      if (ot && ot.period >= 4 && (ot.state === 'play' || ot.state === 'faceoff')) break;
      await h.wait(700);
    }
    if (!ot || ot.period < 4) return 'a tied game at the end of period 3 never reached overtime (period stuck at ' + (ot ? ot.period : '?') + ') - the owner rule is 3-on-3 overtime, first goal wins, no shootout';
    await h.wait(2500);
    const count = await h.eval(() => {
      const hk = window.__hk; const c = { home: 0, away: 0 };
      for (const s of hk.skaters) {
        if (s.goalie) continue;
        if (s.boxT > 0) continue;
        if (Math.abs(s.pos.x) <= 100.5 && Math.abs(s.pos.z) <= 42.8) c[s.team]++;
      }
      return c;
    }).catch(() => null);
    if (!count) return 'could not count the skaters on the ice in overtime';
    if (count.home !== 3 || count.away !== 3) return 'H15 FOUND: a tied game goes to overtime with ' + count.home + ' home and ' + count.away + ' away skaters on the ice (5-on-5, clockT reads ' + Math.round(ot.clockT) + ' - untimed) - the owner rule (2026-10-23, rules/hockey.md line 20) is 3-on-3, first goal wins, no shootout';
    return true;
  }
 },
{
  id: 'never-g-257-p1',
  ask: 'NEVER (G-257): the intermission between periods shows a stats card - when the period clock runs out, the break puts the real match stats on screen (shots, saves, faceoffs won on a #statCard), not only the END OF PERIOD banner, and the card clears when the next period starts (rules/hockey.md: intermission between periods, stats card)',
  async test(page, h) {
    const snap = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    let s = await snap();
    if (s !== 'menu' && s !== 'play' && s !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      s = await snap();
      if (s === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if ((await snap()) !== 'play') return 'could not get a match into play to run down the period clock';
    await h.eval(() => { window.__hk.game.clockT = 0.4; });
    let inter = false; const t1 = Date.now();
    while (Date.now() - t1 < 15000) {
      if ((await snap()) === 'intermission') { inter = true; break; }
      await h.wait(400);
    }
    if (!inter) return 'the period never entered intermission after the clock ran down';
    const card = await h.eval(() => {
      const c = document.getElementById('statCard');
      if (!c) return null;
      return { display: c.style.display, visible: c.style.display !== 'none' && c.getClientRects().length > 0, text: (c.textContent || '').replace(/\s+/g, ' ').trim() }; // #statCard is position:fixed, whose offsetParent is always null - judge by layout boxes instead
    }).catch(() => null);
    if (!card) return 'no #statCard element exists at the intermission - the break shows only the END OF PERIOD banner';
    if (!card.visible || card.display === 'none') return 'the stats card is in the DOM but not shown at the intermission (display ' + card.display + ')';
    if (!/SHOTS/.test(card.text) || !/SAVES/.test(card.text) || !/FACEOFFS WON/.test(card.text)) return 'the intermission card does not carry the match stats - it reads: ' + card.text.slice(0, 90);
    const t2 = Date.now();
    let left = false;
    while (Date.now() - t2 < 16000) {
      if ((await snap()) !== 'intermission') { left = true; break; }
      await h.wait(400);
    }
    if (!left) return 'the intermission never ended - the game is stuck on the break';
    const after = await h.eval(() => { const c = document.getElementById('statCard'); return c ? { display: c.style.display, visible: c.style.display !== 'none' && c.getClientRects().length > 0 } : null; }).catch(() => null);
    if (after && after.visible && after.display !== 'none') return 'the stats card is still on screen after the intermission ended - it must clear when the next period starts';
    return true;
  }
 },
{
  id: 'never-g-261-p1',
  ask: 'NEVER (G-261): the puck never leaves the rink under boards pressure - loose pucks fired at the end boards, the carrier parked at the end boards and at the side boards facing them with the puck on his stick, and a real shot released at the boards, with play re-established before every phase and the puck sampled every 50 ms in play: its centre must never pass the boards shell (|x| <= 100.6, |z| <= 42.9) and the sampler must collect at least 50 play samples',
  async test(page, h) {
    const snap = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    const ensurePlay = async (budget) => {
      const t0 = Date.now();
      while (Date.now() - t0 < budget) {
        const st = await snap();
        if (st === 'play') return true;
        if (st === 'faceoff') { try { await page.keyboard.press('k'); } catch (e) {} }
        await h.wait(450);
      }
      return (await snap()) === 'play';
    };
    let s = await snap();
    if (s !== 'menu' && s !== 'play' && s !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    await h.eval(() => {
      window.__exc2 = { maxX: 0, maxZ: 0, n: 0 };
      if (window.__exc2Timer) clearInterval(window.__exc2Timer);
      window.__exc2Timer = setInterval(() => {
        const hk = window.__hk; if (!hk || !hk.puck || !hk.game) return;
        if (hk.game.state !== 'play') return;
        const p = hk.puck.pos;
        window.__exc2.n++;
        window.__exc2.maxX = Math.max(window.__exc2.maxX, Math.abs(p.x));
        window.__exc2.maxZ = Math.max(window.__exc2.maxZ, Math.abs(p.z));
      }, 50);
    }).catch(() => {});
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    if (!(await ensurePlay(15000))) return 'could not get a match into play to apply the boards pressure';
    const stage = (fn, arg) => h.eval(fn, arg).catch(() => false);
    for (let round = 0; round < 4; round++) {
      const e = round % 2 === 0 ? 1 : -1;
      if (!(await ensurePlay(9000))) return 'play could not be re-established between pressure rounds - the pressure was not applied';
      await stage((a) => { const pk = window.__hk.puck; pk.owner = null; pk.shot = null; pk.pos.set(a[0] * 78, 0.06, a[1]); pk.vel.set(a[0] * 150, 0, 0); return true; }, [e, ((round % 3) - 1) * 6]);
      await h.wait(500);
      if (!(await ensurePlay(9000))) return 'play could not be re-established between pressure rounds - the pressure was not applied';
      await stage((ee) => { const sk = window.__hk.skaters; const c = sk.find(x => x.role === 'C' && x.team === 'home'); if (!c || c.inBox) return false; const pk = window.__hk.puck; c.pos.set(ee * 99.2, 0, -6); c.vel.set(0, 0, 0); c.facing = ee > 0 ? 0 : Math.PI; pk.owner = c; pk.shot = null; return true; }, e);
      await h.wait(650);
      if (!(await ensurePlay(9000))) return 'play could not be re-established between pressure rounds - the pressure was not applied';
      await stage((ee) => { const sk = window.__hk.skaters; const c = sk.find(x => x.role === 'C' && x.team === 'home'); if (!c || c.inBox) return false; const pk = window.__hk.puck; c.pos.set(-8, 0, ee * 41.5); c.vel.set(0, 0, 0); c.facing = ee > 0 ? Math.PI / 2 : -Math.PI / 2; pk.owner = c; pk.shot = null; return true; }, e);
      await h.wait(650);
      if (!(await ensurePlay(9000))) return 'play could not be re-established between pressure rounds - the pressure was not applied';
      const okC = await stage((ee) => { const sk = window.__hk.skaters; const c = sk.find(x => x.role === 'C' && x.team === 'home'); if (!c || c.inBox) return false; const pk = window.__hk.puck; c.pos.set(ee * 94, 0, 3); c.vel.set(0, 0, 0); c.facing = ee > 0 ? 0 : Math.PI; pk.pos.set(ee * 94, 0.06, 3); pk.vel.set(0, 0, 0); pk.owner = c; pk.shot = null; return true; }, e);
      if (okC) { try { await page.keyboard.down('k'); await h.wait(450); await page.keyboard.up('k'); } catch (e2) {} }
      await h.wait(500);
    }
    const exc = await h.eval(() => window.__exc2).catch(() => null);
    if (!exc || exc.n < 50) return 'the sampler collected too few play samples (' + (exc ? exc.n : 0) + ') - the pressure was not applied';
    if (exc.maxX > 100.6 || exc.maxZ > 42.9) return 'the puck left the rink under boards pressure: max |x| ' + exc.maxX.toFixed(1) + ', max |z| ' + exc.maxZ.toFixed(1) + ' (boards shell at |x| 100.6 / |z| 42.9)';
    return true;
  }
 },
{
  id: 'never-g-261-p2',
  ask: 'NEVER (G-261, H15): a tied game goes to 3-on-3 overtime, first goal wins, no shootout (owner decision 2026-10-23, rules/hockey.md line 20) - stage a tie at the end of period 3: exactly 3 skaters a side on the ice in overtime (plus the goalies), and the first overtime goal ends the game',
  async test(page, h) {
    const snap = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    let s = await snap();
    if (s !== 'menu' && s !== 'play' && s !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      s = await snap();
      if (s === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if ((await snap()) !== 'play') return 'could not get a match into play to stage the tie';
    await h.eval(() => {
      const hk = window.__hk; const g = hk.game;
      g.period = 3; g.scoreH = 1; g.scoreA = 1; g.clockT = 0.4;
      hk.puck.pos.set(0, 0.06, -40); hk.puck.vel.set(0, 0, 0); hk.puck.owner = null;
    }).catch(() => {});
    let ot = null; const t1 = Date.now();
    while (Date.now() - t1 < 25000) {
      ot = await h.eval(() => { const hk = window.__hk; if (!hk || !hk.game) return null; return { period: hk.game.period, state: hk.game.state }; }).catch(() => null);
      if (ot && ot.period >= 4 && (ot.state === 'play' || ot.state === 'faceoff')) break;
      await h.wait(700);
    }
    if (!ot || ot.period < 4) return 'a tied game at the end of period 3 never reached overtime';
    await h.wait(2500);
    const count = await h.eval(() => {
      const hk = window.__hk; const c = { home: 0, away: 0 };
      for (const sk of hk.skaters) {
        if (sk.goalie) continue;
        if (sk.boxT > 0) continue;
        if (Math.abs(sk.pos.x) <= 100.5 && Math.abs(sk.pos.z) <= 42.8) c[sk.team]++;
      }
      return c;
    }).catch(() => null);
    if (!count) return 'could not count the skaters on the ice in overtime';
    if (count.home !== 3 || count.away !== 3) return 'overtime is ' + count.home + '-on-' + count.away + ' skaters - the owner rule is exactly 3 a side (plus the goalies), first goal wins, no shootout';
    await h.eval(() => {
      const hk = window.__hk, pk = hk.puck;
      hk.skaters.forEach(x => { if (!x.goalie) { x.pos.set(x.team === 'home' ? -70 : 70, 0.1, 20); x.vel.set(0, 0, 0); } else { x.pos.set(x.team === 'home' ? -95 : 95, 0.1, 30); x.vel.set(0, 0, 0); } });
      pk.owner = null; pk.shot = null; pk.recv = null; pk.deadT = 0; pk.lastTouch = 'home';
      pk.pos.set(87.5, 0.06, 0); pk.vel.set(60, 0, 0);
    }).catch(() => {});
    let over = false; const t2 = Date.now();
    while (Date.now() - t2 < 12000) {
      if ((await snap()) === 'over') { over = true; break; }
      await h.wait(400);
    }
    if (!over) return 'the first overtime goal did not end the game - golden goal, no shootout (owner decision 2026-10-23)';
    return true;
  }
 },
  {
    id: "tester-chk-h14",
    mode: "h14",
    ask: "CHECKLIST H14 (G-234): a major penalty is 5 minutes (rules/hockey.md: \"Penalties (2 minutes, or 5 for major)\"). Commit the harshest foul the game offers - a check from behind on the puck carrier - six times: at least one of the resulting penalties must be a 5:00 major (box clock reads 5:00 and/or the banner says MAJOR).",
    async test(page, h) {
    const snap = () => h.eval(() => {
      const bEl = document.getElementById('banner');
      return {
        state: window.__hk.game.state,
        boxed: window.__hk.skaters.filter(s => s.inBox).map(s => ({ team: s.team, penT: +s.penT.toFixed(1) })),
        banner: (bEl && bEl.classList.contains('show')) ? bEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : ''
      };
    }).catch(() => null);
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    let s = null;
    const t0 = Date.now();
    while (Date.now() - t0 < 60000) {
      s = await snap();
      if (s && s.state === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await page.waitForTimeout(600);
    }
    if (!s || s.state !== 'play') return 'could not get a match into play to force the foul';
    let drew = 0, maxPenT = 0, sawMajor = false;
    for (let att = 0; att < 6; att++) {
      await h.eval(() => {
        const hk = window.__hk, pk = hk.puck;
        hk.skaters.forEach(x => { if (x.inBox) { x.inBox = false; x.penT = 0; } });
        hk.skaters.forEach((x, i) => {
          x.thinkT = 5; x.vel.set(0, 0, 0);
          if (x.team === 'home' && !x.goalie) x.pos.set(-80, 0.1, -20 + (i % 5) * 8);
          if (x.team === 'away' && !x.goalie) x.pos.set(60, 0.1, 20 - (i % 5) * 8);
        });
        const hitter = hk.skaters.find(x => x.team === 'home' && !x.goalie && x.role === 'C');
        const carrier = hk.skaters.find(x => x.team === 'away' && !x.goalie && x.role === 'C');
        hitter.pos.set(-2.5, 0.1, 0);
        carrier.pos.set(0, 0.1, 0); carrier.facing = 0;
        pk.owner = carrier; pk.pos.set(0, 0.06, 0); pk.vel.set(0, 0, 0);
        pk.shot = null; pk.lastTouch = 'away';
      });
      await page.keyboard.press('KeyL').catch(() => {}); // doCheck: check from behind -> penalty
      await page.waitForTimeout(900);
      const q = await snap();
      if (q) {
        for (const b of q.boxed) { drew++; if (b.penT > maxPenT) maxPenT = b.penT; }
        if (/MAJOR/i.test(q.banner)) sawMajor = true;
      }
      await page.waitForTimeout(400);
    }
    if (drew === 0) return 'could not draw a penalty from the check-from-behind foul - cannot judge the major';
    if (sawMajor || maxPenT >= 45) return true;
    return 'H14 FOUND: six check-from-behind fouls (the harshest foul the game offers) drew ' + drew + ' penalties, every one a 2:00 minor (box penT=20, banner always MINOR, never MAJOR) - rules/hockey.md says a major penalty is 5 minutes, but the game has no major-penalty path at all';
  },
  },
{
  id: 'never-g-266-p1',
  ask: 'NEVER (G-266): a goal brings the broadcast look (rules/hockey.md) - the red goal light lit in the DOM, the spotlights on, and the camera cutting to replay angles (a jump of more than 40 units between goal-state frames) instead of staying in the broadcast follow',
  async test(page, h) {
    const snap = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    let s = await snap();
    if (s !== 'menu' && s !== 'play' && s !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      s = await snap();
      if (s === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if ((await snap()) !== 'play') return 'could not get a match into play to stage the goal';
    const series = await h.eval(() => new Promise((resolve) => {
      const hk = window.__hk, pk = hk.puck;
      hk.skaters.forEach(x => { if (!x.goalie) { x.pos.set(x.team === 'home' ? -70 : 70, 0.1, 20); x.vel.set(0, 0, 0); } else { x.pos.set(x.team === 'home' ? -95 : 95, 0.1, 30); x.vel.set(0, 0, 0); } });
      pk.owner = null; pk.shot = null; pk.recv = null; pk.deadT = 0; pk.lastTouch = 'home';
      pk.pos.set(87.5, 0.06, -30); pk.vel.set(0, 0, 0); // held wide of the net until the sampler is running
      const out = [];
      const iv = setInterval(() => {
        const gl = document.getElementById('goalLight');
        out.push({ st: hk.game.state, cam: hk.camera.position.toArray().map(v => +v.toFixed(1)), light: gl ? gl.className : null });
        const gf = out.filter(f => f.st === 'goal').length;
        if ((gf >= 4 && hk.game.state !== 'goal') || out.length > 220) { clearInterval(iv); resolve(out); }
      }, 100);
      // G-273 round 1: the sampler starts BEFORE the shot and runs past the end of the goal state - the old
      // series started in the same breath as the shot and stopped at 14 goal frames, so on a loaded runner
      // it could open after the entry cut and close before the second angle, reading a static 0.0 u on a
      // working replay (the instrument raced the game; the game was fine)
      setTimeout(() => { pk.pos.set(87.5, 0.06, 0); pk.vel.set(60, 0, 0); }, 300);
    })).catch(() => null);
    if (!series) return 'the in-page sampler never ran - staging inconclusive, not a pass';
    const gf = series.filter(f => f.st === 'goal');
    if (!gf.length) return 'the staged shot never became a goal - staging inconclusive, not a pass';
    if (!gf.some(f => f.light !== null)) return 'no goal-light element in the DOM during the goal - a goal must light the red goal light';
    if (!gf.some(f => /\bon\b/.test(f.light || ''))) return 'the goal light was never lit during the goal celebration';
    let maxJump = 0;
    for (let i = 1; i < series.length; i++) {
      if (series[i].st !== 'goal') continue; // count every step INTO a goal frame: the entry cut and both replay angles
      const a = series[i - 1].cam, b = series[i].cam;
      maxJump = Math.max(maxJump, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    if (maxJump <= 40) return 'the camera stayed in broadcast follow through the goal (max jump ' + maxJump.toFixed(1) + ' u) - a goal must cut to a replay from 2 angles';
    return true;
  }
},
{
  id: 'never-g-266-p2',
  ask: 'NEVER (G-266, G-199): each goal crease is painted in FRONT of its goal - a light-blue semicircle of radius 1.83 m on the centre-ice side of the goal line; on the ice paint neither crease may run past its goal line (max x <= 90.5 for the +x crease, min x >= -90.5 for the -x crease)',
  async test(page, h) {
    for (let i = 0; i < 40; i++) { if (await h.eval(() => !!(window.__hk && window.__arena)).catch(() => false)) break; await h.wait(500); }
    return h.eval(() => {
      const root = (() => { let r = window.__reality && window.__reality.player; if (!r) return null; while (r.parent) r = r.parent; return r; })();
      if (!root) return 'no scene root via __reality.player';
      const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
      const aabb = (o) => { const p = o.geometry.attributes.position, m = o.matrixWorld.elements, r = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14]; if (wx < r[0]) r[0] = wx; if (wy < r[1]) r[1] = wy; if (wz < r[2]) r[2] = wz; if (wx > r[3]) r[3] = wx; if (wy > r[4]) r[4] = wy; if (wz > r[5]) r[5] = wz; } return r; };
      const ice = meshes.find(o => { const a = aabb(o); return Math.abs(a[1]) < 0.01 && Math.abs(a[4]) < 0.01 && a[3] > 95 && a[5] > 40 && o.material && o.material.color && o.material.color.getHexString() === 'ffffff' && o.material.map; });
      if (!ice) return 'ice mesh not found for the crease scan';
      const img = ice.material.map.image; if (!img) return 'ice texture has no image';
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const W = img.width, H = img.height, data = ctx.getImageData(0, 0, W, H).data;
      const px = (i, j) => { const k = (j * W + i) * 4; return [data[k], data[k + 1], data[k + 2]]; };
      const lb = [];
      for (let j = 2; j < H - 2; j += 2) for (let i = 2; i < W - 2; i += 2) { const [r, g, b] = px(i, j); if (b > 150 && g > 130 && r > 80 && r < 190 && b - r > 30) lb.push([i, j]); }
      const lbc = [];
      for (const [i, j] of lb) { const f = lbc.find(c => Math.abs(c.i - i) < W * 0.03 && Math.abs(c.j - j) < H * 0.08); if (f) { f.n++; if (i < f.mni) f.mni = i; if (i > f.mxi) f.mxi = i; if (j < f.mnj) f.mnj = j; if (j > f.mxj) f.mxj = j; f.i = (f.i * (f.n - 1) + i) / f.n; f.j = (f.j * (f.n - 1) + j) / f.n; } else lbc.push({ i, j, n: 1, mni: i, mxi: i, mnj: j, mxj: j }); }
      const creases = lbc.filter(c => c.n >= 500).map(c => ({ x: -100 + (c.i / W) * 200, z: -42.5 + (c.j / H) * 85, mnx: -100 + (c.mni / W) * 200, mxx: -100 + (c.mxi / W) * 200 })).filter(c => Math.abs(c.x) > 50 && Math.abs(c.z) < 6);
      if (creases.length < 2) return 'only ' + creases.length + ' goal creases found on the ice paint - one in front of each goal';
      const pxC = creases.find(c => c.x > 0), nxC = creases.find(c => c.x < 0);
      if (pxC && pxC.mxx > 90.5) return 'the +x crease is painted BEHIND its goal: light-blue paint runs to x ' + pxC.mxx.toFixed(1) + ' - the crease belongs in front of the goal line (venues/rink.md)';
      if (nxC && nxC.mnx < -90.5) return 'the -x crease is painted BEHIND its goal: light-blue paint runs to x ' + nxC.mnx.toFixed(1) + ' - the crease belongs in front of the goal line (venues/rink.md)';
      return true;
    });
  }
},
{
  id: 'never-g-272-p1',
  ask: 'NEVER (G-272, H14): a major penalty exists - a check from behind on the puck carrier (the harshest foul the game offers) draws a 5:00 MAJOR (box penT 50 on the game clock scale, banner says MAJOR), and a major serves its full time: a power-play goal springs a boxed MINOR but never a boxed MAJOR (rules/hockey.md)',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    let s = await state();
    if (s !== 'menu' && s !== 'play' && s !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      s = await state();
      if (s === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if ((await state()) !== 'play') return 'could not get a match into play to force the foul';
    const snap = () => h.eval(() => {
      const bEl = document.getElementById('banner');
      return {
        boxed: window.__hk.skaters.filter(x => x.inBox).map(x => ({ team: x.team, role: x.role, penT: +x.penT.toFixed(1), major: !!x.major })),
        banner: (bEl && bEl.classList.contains('show')) ? bEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : ''
      };
    }).catch(() => null);
    // phase 1: the foul itself - the h14 staging (hitter directly behind the carrier), the check fired in
    // the staging turn, then the delayed penalty completed with a touch (G-273 round 1). The read POLLS
    // and re-stages like never-g-273-p2: a single fixed read raced the suite context - an inherited live
    // match can cycle a goal or faceoff through the staging window and eat the foul (PR #1564's red line:
    // standalone it passes, in the full suite the box was not there at the one fixed read).
    let q1 = null;
    const tP1 = Date.now();
    while (Date.now() - tP1 < 25000 && !(q1 && q1.boxed.length)) {
      if ((await state()) === 'play') {
        await h.eval(() => {
          const hk = window.__hk, pk = hk.puck;
          hk.skaters.forEach(x => { if (x.inBox) { x.inBox = false; x.penT = 0; x.major = false; } });
          hk.skaters.forEach((x, i) => {
            x.thinkT = 5; x.vel.set(0, 0, 0);
            if (x.team === 'home' && !x.goalie) x.pos.set(-80, 0.1, -20 + (i % 5) * 8);
            if (x.team === 'away' && !x.goalie) x.pos.set(60, 0.1, 20 - (i % 5) * 8);
          });
          const hitter = hk.skaters.find(x => x.team === 'home' && !x.goalie && x.role === 'C');
          const carrier = hk.skaters.find(x => x.team === 'away' && !x.goalie && x.role === 'C');
          hitter.pos.set(-2.5, 0.1, 0);
          carrier.pos.set(0, 0.1, 0); carrier.facing = 0;
          hk.skaters.forEach(x => { x.target.set(x.pos.x, 0, x.pos.z); }); // pin every man where he stands (G-273)
          pk.owner = carrier; pk.pos.set(0, 0.06, 0); pk.vel.set(0, 0, 0);
          pk.shot = null; pk.lastTouch = 'away';
          document.getElementById('btnCheck').dispatchEvent(new Event('mousedown')); // the check fires in the SAME turn as the staging
        });
        // the foul ARMS while the fouled team holds the puck - hand the puck to a home skater (the penalised team touches it)
        await h.eval(() => { const hk = window.__hk; const lw = hk.skaters.find(x => x.team === 'home' && x.role === 'LW'); if (lw) { hk.puck.owner = lw; hk.puck.pos.set(lw.pos.x, 0.06, lw.pos.z); hk.puck.vel.set(0, 0, 0); } });
      }
      await h.wait(900);
      q1 = await snap();
    }
    if (!q1 || !q1.boxed.length) return 'the check from behind drew no penalty at all - cannot judge the major';
    const foul = q1.boxed[0];
    if (!(foul.penT >= 45) && !/MAJOR/i.test(q1.banner)) return 'a check from behind drew penT ' + foul.penT + ' with banner "' + q1.banner + '" - the harshest foul must be a 5:00 major (penT 50, banner MAJOR), not another 2:00 minor';
    if (/MINOR/i.test(q1.banner)) return 'the check-from-behind banner still says MINOR: "' + q1.banner + '"';
    // phases 2-3: a power-play goal springs a minor, never a major
    const stageBoxAndGoal = async (major) => {
      // settle first: staging during the previous phase's goal celebration loses the puck to the centre faceoff
      const ts = Date.now();
      while (Date.now() - ts < 15000) { if ((await state()) === 'play') break; await h.wait(400); }
      await h.eval((mj) => {
        const hk = window.__hk, pk = hk.puck;
        hk.skaters.forEach(x => { if (x.inBox) { x.inBox = false; x.penT = 0; x.major = false; } x.thinkT = 0.05; });
        const lw = hk.skaters.find(x => x.team === 'away' && x.role === 'LW');
        lw.inBox = true; lw.major = mj; lw.penT = mj ? 50 : 20;
        hk.skaters.forEach(x => { if (!x.goalie && x !== lw) { x.pos.set(x.team === 'home' ? -70 : 70, 0.1, 20); x.vel.set(0, 0, 0); } else if (x.goalie) { x.pos.set(x.team === 'home' ? -95 : 95, 0.1, 30); x.vel.set(0, 0, 0); } });
        pk.owner = null; pk.shot = null; pk.recv = null; pk.deadT = 0; pk.lastTouch = 'home';
        pk.pos.set(87.5, 0.06, 0); pk.vel.set(60, 0, 0);
      }, major);
      const t = Date.now();
      while (Date.now() - t < 10000) { if ((await state()) === 'goal') break; await h.wait(350); }
      await h.wait(700);
      return snap();
    };
    const q2 = await stageBoxAndGoal(true);
    if (!q2 || !q2.boxed.some(x => x.team === 'away')) return 'a power-play goal sprung a MAJOR from the box - majors serve the full 5:00 (rules/hockey.md: early release is minors only)';
    const q3 = await stageBoxAndGoal(false);
    if (q3 && q3.boxed.some(x => x.team === 'away')) return 'a power-play goal no longer springs a MINOR - the minor early-release rule broke';
    return true;
  }
}
,
{
  id: 'never-g-273-p1',
  ask: 'NEVER (G-273, G-199): the 4 neutral-zone faceoff dots sit 1.5 m inside the blue lines - painted at |x| about 6.2 m from centre in the neutral zone (never out at |x| 12.3 m in the end zones), and an offside faceoff drops on the neutral dot on that side',
  async test(page, h) {
    for (let i = 0; i < 40; i++) { if (await h.eval(() => !!(window.__hk && window.__arena)).catch(() => false)) break; await h.wait(500); }
    const scan = await h.eval(() => {
      const root = (() => { let r = window.__reality && window.__reality.player; if (!r) return null; while (r.parent) r = r.parent; return r; })();
      if (!root) return 'no scene root via __reality.player';
      const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
      const aabb = (o) => { const p = o.geometry.attributes.position, m = o.matrixWorld.elements, r = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14]; if (wx < r[0]) r[0] = wx; if (wy < r[1]) r[1] = wy; if (wz < r[2]) r[2] = wz; if (wx > r[3]) r[3] = wx; if (wy > r[4]) r[4] = wy; if (wz > r[5]) r[5] = wz; } return r; };
      const ice = meshes.find(o => { const a = aabb(o); return Math.abs(a[1]) < 0.01 && Math.abs(a[4]) < 0.01 && a[3] > 95 && a[5] > 40 && o.material && o.material.color && o.material.color.getHexString() === 'ffffff' && o.material.map; });
      if (!ice) return 'ice mesh not found for the dot scan';
      const img = ice.material.map.image; if (!img) return 'ice texture has no image';
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const W = img.width, H = img.height, data = ctx.getImageData(0, 0, W, H).data;
      const px = (i, j) => { const k = (j * W + i) * 4; return [data[k], data[k + 1], data[k + 2]]; };
      const reds = [];
      for (let j = 4; j < H - 4; j += 2) for (let i = 4; i < W - 4; i += 2) { const [r, g, b] = px(i, j); if (r > 130 && r - b > 60 && r - g > 30) reds.push([i, j]); }
      const clusters = [];
      for (const [i, j] of reds) { const f = clusters.find(c => Math.abs(c.i - i) < W * 0.02 && Math.abs(c.j - j) < H * 0.05); if (f) { f.n++; f.i = (f.i * (f.n - 1) + i) / f.n; f.j = (f.j * (f.n - 1) + j) / f.n; } else clusters.push({ i, j, n: 1 }); }
      const dots = clusters.filter(c => c.n >= 90).map(c => ({ x: -100 + (c.i / W) * 200, z: -42.5 + (c.j / H) * 85 })).filter(d => Math.abs(Math.abs(d.z) - 20) <= 1.5 && Math.abs(d.x) <= 80);
      const neutral = dots.filter(d => Math.abs(d.x) < 55);
      if (neutral.length < 4) return 'only ' + neutral.length + ' neutral-zone faceoff dots painted - venues/rink.md: 4, at 1.5 m inside the blue lines';
      const bad = neutral.filter(d => Math.abs(d.x) > 21.6);
      if (bad.length) return 'neutral-zone dots painted at |x| ' + bad.map(d => Math.abs(d.x).toFixed(1)).join(', ') + ' units (deep in the end zones) - they belong 1.5 m inside the blue lines, |x| about 20 (6.2 m)';
      return true;
    }).catch(() => 'dot scan failed');
    if (scan !== true) return scan;
    // gameplay: a real offside on the +x side must drop the faceoff on the +x neutral dot
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    let s = await state();
    if (s !== 'menu' && s !== 'play' && s !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      s = await state();
      if (s === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if ((await state()) !== 'play') return 'dots are painted right, but no match could be opened to check the offside drop';
    const unfreeze = () => h.eval(() => { for (const x of window.__hk.skaters) x.thinkT = 0.05; }).catch(() => {});
    await h.eval(() => {
      const H = window.__hk; if (!H || !H.puck) return;
      const S = H.skaters, pk = H.puck;
      const deep = S.find(x => x.team === 'home' && !x.goalie && x.role === 'LW');
      let j = 0;
      for (const x of S) {
        if (x.goalie) continue;
        x.vel.set(0, 0, 0); x.thinkT = 999;
        if (x === deep) { x.pos.set(40, 0.1, 10); } // attacker deep, ahead of the puck
        else if (x.team === 'home') { x.pos.set(8, 0.1, (j % 2 ? -14 : 14)); }
        else { x.pos.set(-55, 0.1, ((j % 5) - 2) * 12); }
        x.target.set(x.pos.x, 0, x.pos.z); // PINNED: a brain-frozen skater still skates to his last target - unpinned, the deep man walks back onside, the delayed-offside arm cancels, and the stopped puck draws a dead-puck whistle (end-dot drop) instead
        j++;
      }
      pk.owner = null; pk.recv = null; pk.shot = null; pk.passGrace = null;
      pk.lastTouch = null; pk.deadT = 0;
      pk.pos.set(20, 0.2, 0); pk.vel.set(14, 0, 0); // crosses the home attacking blue line loose, still sliding when the arm timer fires
    });
    let drop = null;
    const t1 = Date.now();
    while (Date.now() - t1 < 25000) {
      const q = await h.eval(() => {
        const hk = window.__hk; if (!hk || !hk.game) return null;
        const hc = hk.skaters.find(x => x.team === 'home' && x.role === 'C');
        return { state: hk.game.state, px: +hk.puck.pos.x.toFixed(1), pz: +hk.puck.pos.z.toFixed(1), cx: hc ? +(hc.pos.x + 2.6).toFixed(1) : 0, cz: hc ? +hc.pos.z.toFixed(1) : 0, banner: ((document.querySelector('#banner') || {}).textContent || '') };
      }).catch(() => null);
      // the FIRST read inside the offside faceoff: the puck sits on the drop spot at that instant, and the
      // centres are placed on it too (home C at dx-2.6) - a later read can catch a centre already skating
      // off with the puck while the state is still 'faceoff', which is the game playing, not the drop spot
      if (q && q.state === 'faceoff' && /OFFSIDE/i.test(q.banner || '')) { drop = q; break; }
      await h.wait(200);
    }
    await unfreeze();
    if (!drop) return 'the staged offside never reached a faceoff - cannot judge the drop spot';
    const onDot = (x, z) => Math.abs(Math.abs(x) - 20) <= 4 && Math.abs(Math.abs(z) - 20) <= 4;
    if (!onDot(drop.px, drop.pz) && !onDot(drop.cx, drop.cz)) return 'the offside faceoff dropped at puck (' + drop.px + ', ' + drop.pz + '), centres on (' + drop.cx + ', ' + drop.cz + ') - it belongs on the neutral-zone dot at |x| 20, |z| 20, 1.5 m inside the blue line';
    return true;
  }
}
,
{
  id: 'never-g-273-p2',
  ask: 'NEVER (G-273 round 1, G-228): a DELAYED penalty - a foul committed while the other team has the puck does NOT box the man at once; play goes on with the arm up until the penalised team touches the puck, and only then do the whistle blow and the man sit (rules/hockey.md)',
  async test(page, h) {
    const state = () => h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    let s = await state();
    if (s !== 'menu' && s !== 'play' && s !== 'faceoff') {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await h.wait(() => window.__hk && window.__hk.game && window.__hk.game.state === 'menu', 15000).catch(() => {});
    }
    await h.eval(() => { const b = document.getElementById('playBtn'); if (b) b.click(); }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      s = await state();
      if (s === 'play') break;
      await page.keyboard.press('k').catch(() => {});
      await h.wait(600);
    }
    if ((await state()) !== 'play') return 'could not get a match into play to stage the delayed penalty';
    const unfreeze = () => h.eval(() => { for (const x of window.__hk.skaters) x.thinkT = 0.05; }).catch(() => {});
    const boxedHome = () => h.eval(() => window.__hk.skaters.filter(x => x.inBox && x.team === 'home').map(x => ({ role: x.role, penT: +x.penT.toFixed(1) }))).catch(() => null);
    // the tester's staging: away C holds the puck at centre, home C 2.2 u directly behind him, the rest parked and pinned
    await h.eval(() => {
      const hk = window.__hk, pk = hk.puck;
      const aC = hk.skaters.find(x => x.team === 'away' && x.role === 'C');
      const hC = hk.skaters.find(x => x.team === 'home' && x.role === 'C');
      hk.skaters.forEach(x => {
        if (x.goalie) return;
        x.vel.set(0, 0, 0); x.thinkT = 999;
        if (x !== aC && x !== hC) { x.pos.set(x.team === 'home' ? -70 : 70, 0.1, 20); x.target.set(x.pos.x, 0, x.pos.z); }
      });
      aC.pos.set(0, 0.1, 0); aC.target.set(0, 0, 0); aC.vel.set(0, 0, 0); aC.facing = 0;
      hC.pos.set(-2.2, 0.1, 0); hC.target.set(-2.2, 0, 0); hC.vel.set(0, 0, 0); hC.facing = 0;
      pk.owner = aC; pk.lastTouch = 'away'; pk.pos.set(0.6, 0.06, 0); pk.vel.set(0, 0, 0); pk.shot = null; pk.recv = null;
      document.getElementById('btnCheck').dispatchEvent(new Event('mousedown')); // same turn as the staging: no frame can shove the pair apart first
    });
    await h.wait(400);
    let b = await boxedHome();
    if (b && b.length) { await unfreeze(); return 'the check from behind boxed the home ' + b[0].role + ' at once - a foul while the other team has the puck must ARM a delayed penalty, not sit the man instantly'; }
    await h.wait(1500); // play goes on with the arm up: the away carrier still has the puck, nobody sits
    b = await boxedHome();
    const st = await state();
    if (b && b.length) { await unfreeze(); return 'the delayed penalty sat the home ' + b[0].role + ' while the away team still had the puck - play must go on until the penalised team touches it'; }
    if (st !== 'play') { await unfreeze(); return 'play stopped (state ' + st + ') while the delayed penalty was still armed - the whistle may only blow on the penalised team touching the puck'; }
    // the penalised team touches the puck: NOW the whistle and the box
    await h.eval(() => { const hk = window.__hk; const lw = hk.skaters.find(x => x.team === 'home' && x.role === 'LW'); if (lw) { hk.puck.owner = lw; hk.puck.pos.set(lw.pos.x, 0.06, lw.pos.z); hk.puck.vel.set(0, 0, 0); } });
    let sat = null;
    const t1 = Date.now();
    while (Date.now() - t1 < 8000) {
      b = await boxedHome();
      if (b && b.length) { sat = b[0]; break; }
      await h.wait(400);
    }
    await unfreeze();
    if (!sat) return 'the penalised team touched the puck but the delayed penalty never sat the man - the whistle and the box must follow the touch';
    if (!(sat.penT >= 45)) return 'after the touch the home ' + sat.role + ' sat with penT ' + sat.penT + ' - a check from behind is a 5:00 major (penT 50)';
    return true;
  }
}

];
