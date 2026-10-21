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
  for (let i = 0; i < 40 && !playing; i++) {
    await h.wait(250);
    const st = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
    if (st === 'play') playing = true;
  }
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
      if (/OFFSIDE/i.test(banner)) return true;
    }
    return 'a real offside (attacker at x=40 ahead of the puck crossing the blue line) never drew a whistle';
  },
},
{
  id: 'play-icing-called',
  ask: 'icing is called on an untouched clear from the defensive half',
  async test(page, h) {
    try { await h.press('#playBtn'); } catch (e) {}
    await h.wait(2500); // opening faceoff (1.4s) ends -> play
    await h.eval(() => {
      const H = window.__hk; if (!H || !H.puck) return;
      H.puck.owner = null; H.puck.recv = null; H.puck.shot = null; H.puck.passGrace = null;
      H.puck.lastTouch = 'home'; H.puck.lastTouchX = -10; // dumped from the home defensive half
      H.puck.pos.set(-10, 0.2, 30); H.puck.vel.set(60, 0, 0); // untouched clear down the ice (too fast to grab)
      for (const s of H.skaters) {
        s.vel.set(0, 0, 0); s.thinkT = 999; // freeze the AI
        // away wins the race, so the icing stands (not waived)
        if (!s.goalie) { s.pos.set(s.team === 'away' ? 60 : -40, 0.1, s.pos.z || 0); if (s.target) s.target.copy(s.pos); } // 03: stop them skating to old targets
      }
    });
    for (let i = 0; i < 12; i++) {
      await h.wait(1000);
      const banner = await h.eval(() => ((document.querySelector('#banner') || {}).textContent) || '');
      if (/ICING/i.test(banner)) return true;
    }
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
    if (!scored) return 'a puck over the goal line did not register a goal';
    // Phase 2: after the 3.2 s goal celebration the puck must restart from centre ice.
    for (let i = 0; i < 16; i++) {
      await h.wait(500);
      const r = await h.eval(() => ({
        score: ((document.querySelector('#score') || {}).textContent) || '',
        px: window.__hk && window.__hk.puck ? window.__hk.puck.pos.x : 999,
        pz: window.__hk && window.__hk.puck ? window.__hk.puck.pos.z : 999,
      }));
      if (r.score !== before) changed = true;
      if (changed && Math.abs(r.px) < 6 && Math.abs(r.pz) < 6) return true; // caught mid-faceoff on the dot
    }
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
    for (let i = 0; i < 40 && !playing; i++) {
      await h.wait(250);
      const st = await h.eval(() => (window.__hk && window.__hk.game ? window.__hk.game.state : '')).catch(() => '');
      if (st === 'play') playing = true;
    }
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
];
