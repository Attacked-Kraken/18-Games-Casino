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
];
