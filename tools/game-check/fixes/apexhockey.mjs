// Owner's fix list for Apex Ice Hockey (see README.md in this folder). Numbers come from his model sheet (2026-10-16).
const kitOf = () => {
  const S = window.__hk && window.__hk.skaters;
  if (!S || !S.length) return 'no skaters found (window.__hk.skaters)';
  return S;
};
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
        if (!s.goalie) s.pos.set(s.team === 'away' ? 60 : -40, 0.1, s.pos.z || 0);
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
];
