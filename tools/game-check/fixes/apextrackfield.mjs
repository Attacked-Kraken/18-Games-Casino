// Owner's fix list for Apex Track & Field (see README.md in this folder).
export default [
  {
    id: 'touch-controls',
    ask: "I can't play Track & Field - no way to control it",
    async test(page, h) {
      const s = await h.eval(() => {
        const t = document.getElementById('touch'), st = document.getElementById('stick'), a = document.getElementById('btnA');
        if (!t || !st || !a) return 'touch controls are missing from the page';
        if (getComputedStyle(t).display === 'none') return 'touch controls are hidden during play';
        const r1 = st.getBoundingClientRect(), r2 = a.getBoundingClientRect();
        if (r1.width < 40 || r2.width < 40) return 'stride stick or ACTION button too small to use';
        return true;
      });
      return s;
    },
  },
  {
    id: 'real-sprint-animation',
    ask: 'Runners must run with natural arm and leg motion - a real sprint animation, not posed bones',
    async test(page, h) {
      const ok0 = await h.eval(() => !!window.__tf);
      if (!ok0) return 'window.__tf missing - JOB J7 build not in the game';
      // PLAY the race: alternate strides through the game's own input - the same
      // stride() the arrow keys feed. Without strides the runner never leaves the
      // blocks and there is no sprint to measure. (Never stride during SET: false start.)
      // the driver lives IN the page (a held playing rhythm, like a real player's thumbs);
      // one eval installs it - per-call eval round-trips are too slow to sprint with
      await h.eval(() => { if (!window.__drv) { window.__tk = false; window.__drv = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.stride && e.phase !== 'set') { e.stride(window.__tk ? 'R' : 'L'); window.__tk = !window.__tk; } }, 120); } return true; });
      const drive = () => h.eval(() => true);
      const t0 = Date.now(); let best = null;
      while (Date.now() - t0 < 25000) {
        await drive();
        const s = await h.eval(() => { const e = window.__tf.eng(); return { pos: e && e.r ? e.r.pos : 0, pose: window.__tf.pose() }; });
        // steady state only: past the block start (>12m) - that is the sprint being
        // judged, not the crouch in the blocks this test used to end up measuring
        if (s.pos > 12) {
          for (const r of s.pose) {
            if (r.human && r.sf > 0.3 && /Sprint_Loop|Jog_Fwd_Loop/.test(r.clip || '')) { best = r; break; }
          }
        }
        if (best) break;
        await h.wait(160);
      }
      if (!best) return 'no runner was seen using Sprint_Loop / Jog_Fwd_Loop while racing';
      // thigh swing over a FULL cycle proves real leg drive (not a glide). G-249 r2:
      // the old 7x200ms wall window covered only ~0.5s of animation on the robot
      // (it paints ~3 frames a second, and the mixer advances on visual dt clamped
      // to 0.12s a frame - 0.36s of animation per wall second), so the range it read
      // was a phase-dependent slice of the cycle (0.43 rad on main 1efbb9b) while the
      // same clip measures 1.85-1.95 rad over a full cycle. 30x250ms covers 2+ cycles
      // at any frame rate. Ask and bar (0.7 rad) unchanged.
      let mn = 1e9, mx = -1e9;
      for (let i = 0; i < 30; i++) {
        await drive();
        const p = await h.eval(() => window.__tf.pose());
        for (const r of p) if (r.human && r.sf > 0.3) { mn = Math.min(mn, r.thighL); mx = Math.max(mx, r.thighL); }
        await h.wait(250);
      }
      if (mx - mn < 0.7) return 'thigh swing too small (' + (mx - mn).toFixed(2) + ' rad) - legs are not driving';
      return true;
    },
  },
  {
    id: 'runners-stand-upright',
    ask: 'Runners must run standing upright like real sprinters',
    async test(page, h) {
      // Drive the race with the game's own stride input, and judge the torso only in
      // steady state (past 12m): a sprinter's block-start lean is not 'hunched over',
      // and a standing athlete is not running at all. Threshold unchanged (0.42 rad).
      // the driver lives IN the page (a held playing rhythm, like a real player's thumbs);
      // one eval installs it - per-call eval round-trips are too slow to sprint with
      await h.eval(() => { if (!window.__drv) { window.__tk = false; window.__drv = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.stride && e.phase !== 'set') { e.stride(window.__tk ? 'R' : 'L'); window.__tk = !window.__tk; } }, 120); } return true; });
      const drive = () => h.eval(() => true);
      const t0 = Date.now(); let worst = -1, n = 0;
      while (Date.now() - t0 < 25000) {
        await drive();
        const s = await h.eval(() => { const e = window.__tf.eng(); return { pos: e && e.r ? e.r.pos : 0, pose: window.__tf.pose() }; });
        if (s.pos > 12) {
          for (const r of s.pose) {
            if (r.human && r.sf > 0.55 && /Sprint_Loop|Jog_Fwd_Loop/.test(r.clip || '')) {
              worst = Math.max(worst, Math.abs(r.pelvis + r.spine)); n++;
            }
          }
        }
        if (n >= 5) break;
        await h.wait(160);
      }
      if (n < 5) return 'never saw a runner at speed on a real run clip';
      if (worst > 0.42) return 'torso pitch too big at speed (' + worst.toFixed(2) + ' rad) - runners are hunched over';
      return true;
    },
  },
  {
    id: 'singlet-kit',
    ask: 'Sprinters wear a track singlet kit, not a soccer kit',
    async test(page, h) {
      const k = await h.eval(() => window.__tf && window.__tf.kit());
      if (k !== 'track_kit') return 'runner outfit is "' + k + '", not track_kit';
      return true;
    },
  },
  {
    id: 'real-400-oval',
    ask: 'A real 400m oval: 8 lanes of 1.22m, lane 1 lap is 400m',
    async test(page, h) {
      const g = await h.eval(() => {
        const tf = window.__tf; let lap = 0; let prev = tf.lanePoint(0, 0);
        for (let s = 2; s <= 400; s += 2) { const p = tf.lanePoint(s, 0); lap += Math.hypot(p.x - prev.x, p.z - prev.z); prev = p; }
        const sp = [0, 100, 200, 300].map(s => { const a = tf.lanePoint(s, 0), b = tf.lanePoint(s, 1); return Math.hypot(a.x - b.x, a.z - b.z); });
        return { lap, sp };
      });
      if (!g) return 'window.__tf missing';
      if (Math.abs(g.lap - 400) > 4) return 'lane 1 lap measures ' + g.lap.toFixed(1) + 'm, not 400m';
      for (const d of g.sp) if (Math.abs(d - 1.22) > 0.04) return 'lane spacing is ' + d.toFixed(2) + 'm, not 1.22m';
      return true;
    },
  },
  {
    id: 'staggered-starts-own-lane',
    ask: 'Staggered starts for 200m/400m and every runner in his own lane',
    async test(page, h) {
      const v = await h.eval(() => {
        const tf = window.__tf;
        return { spread400: tf.visS(5, 0, 400) - tf.visS(1, 0, 400),
                 spread200: tf.visS(7, 0, 200) - tf.visS(0, 0, 200),
                 finish: [0, 2, 4, 7].map(l => tf.visS(l, 400, 400)) };
      });
      if (!v) return 'window.__tf missing';
      if (v.spread400 < 25) return '400m stagger spread only ' + v.spread400.toFixed(1) + 'm between lanes 1 and 5';
      if (v.spread200 < 20) return '200m stagger spread only ' + v.spread200.toFixed(1) + 'm between lanes 0 and 7';
      for (const f of v.finish) if (Math.abs(f - 84.39) > 0.6) return 'lanes do not converge on the shared finish line at x=0 (s=' + f.toFixed(1) + ', wants 84.39)';
      return true;
    },
  },
  {
    id: 'real-college-bowl',
    ask: 'A real college track stadium: seating all the way around the oval, 30,000+ crowd',
    async test(page, h) {
      const r = await h.eval(() => window.__tf && window.__tf.stadium());
      if (!r) return 'no stadium report - the shared-kit bowl is not built';
      if (!(r.fans >= 30000)) return 'only ' + r.fans + ' fans (venues/track.md wants >= 30000)';
      if (!(r.seats >= 40000 && r.seats <= 60000)) return 'seats ' + r.seats + ' outside the 40,000-60,000 college bowl range';
      if (!(r.tiers >= 2)) return 'bowl has ' + r.tiers + ' tier(s), wants 2 levels';
      if (!r.roof) return 'no roof ring over the stands';
      if (!(r.screens >= 2)) return 'only ' + r.screens + ' big screen(s), wants 2';
      return true;
    },
  },
  {
    id: 'running-lanes-and-race-camera',
    ask: 'Add running lanes and move camera angel back 10 blocks and up 15 blocks and centered behind player',
    async test(page, h) {
      const L = await h.eval(() => (window.__tf && window.__tf.lanes) ? window.__tf.lanes() : null);
      if (!L) return 'running lanes are not built as real markings (no lane-line geometry in the game)';
      if (L.count < 9) return 'only ' + L.count + ' lane lines built, wants 9 (every edge of the 8 lanes)';
      if (!(L.width >= 0.05)) return 'lane lines only ' + L.width + 'm wide - too thin to see';
      const t0 = Date.now(); const S = []; let seen = 0;
      while (Date.now() - t0 < 24000 && S.length < 5) {
        const fo = await h.eval(() => {
          const tf = window.__tf; if (!tf || !tf.follow) return null;
          const f = tf.follow(); if (!f) return null;
          const e = tf.eng(); if (!e || !e.r) return null;
          return f;
        });
        if (fo) { seen++; if (seen > 3) S.push(fo); }
        await h.wait(400);
      }
      if (S.length < 3) return 'never saw the race camera settled behind the player';
      let behind = 0, lateral = 0, up = 0;
      for (const f of S) {
        behind += ((f.x - f.cx) * f.tx + (f.z - f.cz) * f.tz) / S.length;
        lateral += ((f.cx - f.x) * (-f.tz) + (f.cz - f.z) * f.tx) / S.length;
        up += f.cy / S.length;
      }
      // camera numbers re-spec'd by the owner (2026-10-17, ONE camera line on the looks
      // board): about twice the old distance back, just above shoulder height, centered.
      if (Math.abs(behind - 7) > 2) return 'camera sits ' + behind.toFixed(1) + 'm behind the player - the ONE camera rule wants 7m behind along the lane';
      if (Math.abs(up - 2.8) > 1.0) return 'camera flies ' + up.toFixed(1) + 'm up - the ONE camera rule wants 2.8m up';
      if (Math.abs(lateral) > 1) return 'camera rides ' + lateral.toFixed(1) + ' blocks off to the side, wants centered behind the player';
      return true;
    },
  },
  {
    id: 'full-field-humans-finish-banner',
    ask: 'Make camera angle always right behind player. And make the runners 3D humans from the studio. Make lanes for each tracker runner 1-7 and make finish line banner or floor marking to cross.',
    async test(page, h) {
      const fin = await h.eval(() => (window.__tf && window.__tf.finish) ? window.__tf.finish() : null);
      if (!fin || !fin.banner) return 'no finish banner to cross at the finish line';
      const fld = await h.eval(() => (window.__tf && window.__tf.field) ? window.__tf.field() : null);
      if (!fld) return 'no field report - the race has not started';
      if (fld.ai < 6) return 'only ' + (fld.ai + 1) + ' runner(s) in the race - wants a full field of 7, one in each of lanes 1-7';
      const t0 = Date.now(); let humans = 0, samples = 0, camBad = null;
      while (Date.now() - t0 < 22000) {
        const s = await h.eval(() => {
          const tf = window.__tf; if (!tf) return null;
          const p = tf.pose(); const f = tf.follow();
          return { humans: p.filter(r => r.human).length, f };
        });
        if (s) {
          humans = Math.max(humans, s.humans);
          if (s.f) {
            samples++;
            const behind = (s.f.x - s.f.cx) * s.f.tx + (s.f.z - s.f.cz) * s.f.tz;
            const lateral = (s.f.cx - s.f.x) * (-s.f.tz) + (s.f.cz - s.f.z) * s.f.tx;
            if (Math.abs(lateral) > 1 || Math.abs(behind - 7) > 2 || Math.abs(s.f.cy - 2.8) > 1.2) {
              camBad = 'behind ' + behind.toFixed(1) + ', up ' + s.f.cy.toFixed(1) + ', off-center ' + lateral.toFixed(1);
            }
          }
        }
        if (humans >= 7 && samples >= 4 && !camBad) break;
        await h.wait(500);
      }
      if (humans < 7) return 'only ' + humans + ' of the runners are the studio 3D humans - the rest are stand-ins';
      if (samples < 2) return 'never saw the race camera behind the player';
      if (camBad) return 'camera not on the ONE rule (' + camBad + ') - wants 7m behind along the lane, 2.8m up, centered, always';
      return true;
    },
  },
  {
    id: 'camera-one-rule',
    ask: "Camera 7 m behind the player's runner along the lane direction (it follows the lane around the curves), 2.8 m up, looking at a point 10 m ahead of the runner; it never goes behind the start line into the stands or through any wall - clamp it inside the stadium.",
    async test(page, h) {
      const tt = () => h.eval(() => (window.__tf && window.__tf.follow) ? window.__tf.follow() : null);
      const t0 = Date.now(); const S = [];
      let sharp = null;
      while (Date.now() - t0 < 22000 && S.length < 5) {
        const f = await tt();
        if (f) S.push(f);
        if (!sharp) sharp = await h.eval(() => (window.__tf && window.__tf.sharp) ? window.__tf.sharp() : null);
        await h.wait(400);
      }
      if (S.length < 3) return 'never saw the race camera behind the player';
      for (const f of S) {
        const behind = (f.x - f.cx) * f.tx + (f.z - f.cz) * f.tz;
        const lateral = (f.cx - f.x) * (-f.tz) + (f.cz - f.z) * f.tx;
        if (Math.abs(behind - 7) > 1.5) return 'camera sits ' + behind.toFixed(1) + 'm behind the player - the ONE rule wants 7m behind along the lane';
        if (Math.abs(f.cy - 2.8) > 0.8) return 'camera height ' + f.cy.toFixed(1) + 'm - the ONE rule wants 2.8m up';
        if (Math.abs(lateral) > 1) return 'camera rides ' + lateral.toFixed(1) + 'm off to the side - the ONE rule wants it centered behind the runner';
      }
      if (!sharp) return 'no sharpness report from the game';
      const want = Math.min(sharp.dpr || 1, 1.5);
      if (Math.abs(sharp.pr - want) > 0.06) return 'pixel ratio is ' + sharp.pr + ' - the sharp rule (STUDIO-STANDARD) is min(devicePixelRatio, 1.5) = ' + want + ', never lowered to save speed';
      if (sharp.fog > 0 && sharp.fog < 300) return 'fog starts at ' + sharp.fog + 'm - it hazes the runners; wants no fog on the runners';
      return true;
    },
  },
  {
    id: 'camera-never-sees-a-wall',
    ask: 'The camera never sees a wall in front of the runner at the 100 m start and on the 400 m curve (clamped inside the stadium)',
    async test(page, h) {
      const wc = await h.eval(() => (window.__tf && window.__tf.wallCheck) ? window.__tf.wallCheck() : null);
      if (!wc) return 'no wall check from the game (JOB J39 build missing)';
      if (!wc.start100) return 'at the 100m start the camera ends up behind a wall (in the stands) - clamp it inside the stadium';
      if (!wc.curve400) return 'on the 400m curve the camera ends up behind a wall - it must follow the lane and stay inside the stadium';
      const t0 = Date.now(); let seen = 0, blocked = 0;
      while (Date.now() - t0 < 15000 && seen < 4) {
        const c = await h.eval(() => (window.__tf && window.__tf.camClear) ? window.__tf.camClear() : null);
        if (c) { seen++; if (!c.clear) blocked++; }
        await h.wait(400);
      }
      if (seen && blocked) return 'the live race camera had a wall between it and the runner in ' + blocked + ' of ' + seen + ' samples';
      return true;
    },
  },
  {
    id: 'career-never-stalls',
    ask: 'Career mode must never stall',
    async test(page, h) {
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 26000;
      await h.eval(() => { if (!window.__tfdrv2) { window.__tfdrv2 = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.stride && !e.finished) { e.stride('L'); e.stride('R'); if (e.action && Math.random() < 0.3) e.action(); } }, 130); } return true; });
      // REPAIRED navigation (was: #menuScr/#resScr ids that do not exist in this game, so it could
      // never reach the menu): use the game's real screens (.screen.on) and real results buttons.
      let atMenu = false;
      while (budget() && !atMenu) {
        atMenu = await h.eval(() => { const on = document.querySelector('.screen.on'); if (on && on.id === 'menu') return true; if (on && on.id === 'grid') { const g = document.getElementById('bGridBack'); if (g) g.click(); return false; } if (on && on.id === 'results') { const n = document.getElementById('bResNext'); const lbl = n ? n.textContent : ''; if (/RETRY EVENT/.test(lbl)) { const m = document.getElementById('bResMenu'); if (m) m.click(); } else if (n) n.click(); } return false; });
        if (!atMenu) await h.wait(500);
      }
      if (!atMenu) return 'could not get back to the menu (a race or results screen is stuck)';
      const careerBtn = await h.eval(() => { const b = document.getElementById('bCareer'); if (b) { b.click(); return true; } return false; });
      if (!careerBtn) return 'no CAREER MODE button on the menu';
      await h.wait(600);
      // REPAIRED assertion (was: e.mode / e.pos - fields the engines do not have, so it could never
      // pass): prove we are really in the career flow by the career screen itself, then by the
      // engine's real phase / runner position advancing.
      const sawCareer = await h.eval(() => { const on = document.querySelector('.screen.on'); return !!(on && on.id === 'career'); });
      if (!sawCareer) return 'the CAREER MODE button did not open the career screen - career stalls before the meet';
      const meetBtn = await h.eval(() => { const b = document.getElementById('bCareerMeet'); if (b) { b.click(); return true; } return false; });
      if (!meetBtn) return 'no NEXT MEET button on the career screen - career stalls before the meet';
      await h.wait(600);
      const cardBtn = await h.eval(() => { const b = document.getElementById('bCardStart'); if (b) { b.click(); return true; } return false; });
      if (!cardBtn) return 'the career meet card never offered a start - career stalls at the card';
      let advanced = false; const phases = new Set();
      while (budget() && !advanced) {
        const st = await h.eval(() => { const e = window.__tf && window.__tf.eng(); return e ? { phase: e.phase || '', pos: e.r ? e.r.pos : 0 } : null; });
        if (st) { phases.add(st.phase); if (phases.size > 1 || st.pos > 2) advanced = true; }
        await h.wait(450);
      }
      if (!advanced) return 'the career race started but never advanced (frozen at the start) - career stalls';
      return true;
    },
  },
  {
    id: 'two-thumbs-at-once',
    ask: 'Holding the stick must never block TAP RUN / HURDLE - two thumbs at once',
    async test(page, h) {
      // JOB G-16: the tests before this one leave DRIVER intervals behind on the shared page
      // (career-never-stalls' __tfdrv2, the career drivers __tfdrv / __tfdrv4). They keep striding
      // whatever race is live: during 'marks'/'set' that is a false start, so the race is DQ'd,
      // the results screen replaces it mid-test, and this test then reports dropped thumbs and
      // lost taps the game never caused. Stop the leftover drivers first, then start from a known
      // state - a race really in its 'run' phase - the state a player's two thumbs actually meet.
      // One combined read+click per poll: the robot gives every test 30 s, eval round-trips on its
      // slow page are dear, and the touch sequence still needs its share of the budget.
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv4']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } return true; }); // JOB G-22: '__drv' added - the touch/sprint tests at the top of this file install it (it strides the live race every 120 ms) and NOBODY cleared it before this test; it sprinted this test's 60 m runner over the finish line mid-sequence, the results screen replaced the HUD, and the remaining taps hit the results panel ('only 2-3 of 5 taps landed')
      {
        const poll = () => h.eval(() => { const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng(); const playing = document.body.classList.contains('playing'); const run = !!(e && e.r && e.phase === 'run' && playing); if (!run && on) { const click = (id) => { const b = document.getElementById(id); if (b) b.click(); }; if (on.id === 'results') click('bResMenu'); else if (on.id === 'menu') click('bFree'); else if (on.id === 'grid') { const b = document.querySelector('#gridEvents button'); if (b) b.click(); } else if (on.id === 'card') click('bCardStart'); else if (on.id === 'career') click('bCareerBack'); } return run; });
        const t0 = Date.now();
        let run = await poll();
        while (!run && Date.now() - t0 < 17000) { await h.wait(350); run = await poll(); }
      }
      const rects = await h.eval(() => { const r = (id) => { const el = document.getElementById(id); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }; return { stick: r('stick'), tap: r('btnTap'), act: r('btnA'), playing: document.body.classList.contains('playing') }; });
      if (!rects.stick || !rects.tap) return 'the touch controls are not on screen (no race running?)';
      if (!rects.playing) return 'the game is not in a race';
      const cdp = await page.context().newCDPSession(page);
      const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
      const P = (id, x, y) => ({ id, x, y, radiusX: 12, radiusY: 12, force: 1 });
      await touch('touchStart', [P(1, rects.stick.x, rects.stick.y)]);
      await h.wait(150);
      await touch('touchMove', [P(1, rects.stick.x + 34, rects.stick.y)]);
      await h.wait(150);
      for (let i = 0; i < 5; i++) {
        await touch('touchStart', [P(1, rects.stick.x + 34, rects.stick.y), P(2, rects.tap.x, rects.tap.y)]);
        await h.wait(110);
        await touch('touchEnd', [P(2, rects.tap.x, rects.tap.y)]); // release ONLY the tap thumb - the stick thumb stays held
        await h.wait(110);
      }
      const mid = await h.eval(() => (window.__tf && window.__tf.input) ? window.__tf.input() : null);
      if (rects.act) {
        await touch('touchStart', [P(1, rects.stick.x + 34, rects.stick.y), P(3, rects.act.x, rects.act.y)]);
        await h.wait(110);
        await touch('touchEnd', [P(3, rects.act.x, rects.act.y)]); // release ONLY the action thumb
        await h.wait(110);
      }
      const end = await h.eval(() => (window.__tf && window.__tf.input) ? window.__tf.input() : null);
      await touch('touchEnd', []);
      if (!mid || !end) return 'no input report from the game (JOB J39 build missing)';
      if (!mid.stickHeld) return 'the stick did not stay held during the taps - the first thumb was dropped';
      if (mid.tap < 4) return 'only ' + mid.tap + ' of 5 TAP RUN taps landed while the stick was held - two thumbs must work at once';
      if (rects.act && end.act < 1) return 'the HURDLE / ACTION button did not land while the stick was held - two thumbs must work at once';
      return true;
    },
  },
  {
    id: 'portrait-fills-screen',
    ask: 'Held upright the game fills the WHOLE screen sideways (the robot fails under 90%)',
    async test(page, h) {
      // G-329: the old test read fill() once, 900 ms after resizing, and trusted
      // that reading - on a slow runner the resize had not registered yet, so it
      // reported landscape viewport values (844x390) as the upright state and
      // failed a correct game. Worse, fill().cov is bounding-rect AREA, which is
      // 1.0 even for an un-rotated canvas - so the old test passed the very
      // state it should fail. This version proves the rule properly: it waits
      // until the viewport really is 390x844, then measures CLIPPED overlap
      // (rotation-aware) plus the turned-box renderer size.
      await page.setViewportSize({ width: 390, height: 844 });
      let settled = false;
      for (let i = 0; i < 20; i++) {
        settled = await h.eval(() => window.innerWidth === 390 && window.innerHeight === 844).catch(() => false);
        if (settled) break;
        await h.wait(500);
      }
      const f = await h.eval(() => {
        const tf = window.__tf; if (!tf || !tf.fill) return null;
        const c = document.getElementById('game'); if (!c) return null;
        const r = c.getBoundingClientRect();
        const vw = window.innerWidth, vh = window.innerHeight;
        const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
        const iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        const rep = tf.fill();
        return { overlap: (ix * iy) / (vw * vh), W: rep.W, H: rep.H, iw: vw, ih: vh, rotated: getComputedStyle(document.body).transform !== 'none' };
      }).catch(() => null);
      await page.setViewportSize({ width: 844, height: 390 });
      await h.wait(400);
      if (!settled) return 'upright viewport never applied after resize (harness) - the fill rule cannot be proven from a landscape viewport (G-329)';
      if (!f) return 'no fill report from the game (JOB J39 build missing)';
      if (f.overlap < 0.9) return 'held upright the game fills only ' + Math.round(f.overlap * 100) + '% of the screen - wants the WHOLE screen (90%+)' + (f.rotated ? '' : ' (page un-rotated)');
      if (f.W !== f.ih || f.H !== f.iw) return 'the renderer is sized ' + f.W + 'x' + f.H + ' in an upright ' + f.iw + 'x' + f.ih + ' viewport - it must be sized to the turned (sideways) box ' + f.ih + 'x' + f.iw;
      return true;
    },
  },
  {
    id: 'keep-locked-look',
    ask: "KEEP - LOCKED (owner checked JOB J7, 2026-10-17, HE LIKES IT): 'how it looks and how it runs now - the stadium, crowd, track, runners, sharp picture, start camera' - no Muse may change it",
    async test(page, h) {
      // the run cycles register once the studio humans land - wait for them, then judge
      const t0 = Date.now();
      let k = null;
      while (Date.now() - t0 < 24000) {
        k = await h.eval(() => {
          const tf = window.__tf; if (!tf) return null;
          const st = tf.stadium ? tf.stadium() : null;
          const sh = tf.sharp ? tf.sharp() : null;
          const wall = tf.wallCheck ? tf.wallCheck() : null;
          const lanes = tf.lanes ? tf.lanes() : null;
          const fin = tf.finish ? tf.finish() : null;
          const c = tf.clips ? tf.clips() : null;
          return {
            seats: st ? st.seats : 0, fans: st ? st.fans : 0,
            runClip: c ? (c.run || '') : '', jogClip: c ? (c.jog || '') : '',
            kit: tf.kit ? tf.kit() : '',
            laneCount: lanes ? lanes.count : 0,
            banner: !!(fin && fin.banner),
            pr: sh ? sh.pr : 0, dpr: sh ? sh.dpr : 1,
            wallStart: wall ? wall.start100 : null, wallCurve: wall ? wall.curve400 : null
          };
        });
        if (k && /sprint/i.test(k.runClip) && /jog/i.test(k.jogClip)) break;
        await h.wait(1200);
      }
      if (!k) return 'no report from the game (the KEEP build is missing)';
      if (!(k.seats >= 40000 && k.fans >= 30000)) return 'KEEP BROKEN: the locked stadium/crowd changed - ' + k.seats + ' seats / ' + k.fans + ' fans (owner locked ~40.8k seats / ~37.6k fans)';
      if (!/sprint/i.test(k.runClip) || !/jog/i.test(k.jogClip)) return 'KEEP BROKEN: the runners lost their real run cycles (run=' + k.runClip + ', jog=' + k.jogClip + ')';
      if (k.kit !== 'track_kit') return 'KEEP BROKEN: the runners are not wearing the locked track singlet kit (' + k.kit + ')';
      if (k.laneCount !== 9) return 'KEEP BROKEN: the track lane lines changed - ' + k.laneCount + ' lines (locked: 9 lines for 8 lanes)';
      if (!k.banner) return 'KEEP BROKEN: the FINISH banner is gone';
      const want = Math.min(k.dpr || 1, 1.5);
      if (Math.abs(k.pr - want) > 0.06) return 'KEEP BROKEN: the picture is no longer sharp - pixel ratio ' + k.pr + ' (locked: min(devicePixelRatio, 1.5) = ' + want + ')';
      if (k.wallStart !== true || k.wallCurve !== true) return 'KEEP BROKEN: the locked start camera can see a wall (start100=' + k.wallStart + ', curve400=' + k.wallCurve + ')';
      return true;
    },
  },
  {
    id: 'play-career-levels-load-play-unlock',
    ask: "CAREER MODE: the levels don't work - every career level must load, play and unlock the next",
    async test(page, h) {
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 27000;
      await h.eval(() => { ['__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__drv'].forEach(k => { if (window[k]) { clearInterval(window[k]); window[k] = null; } }); return true; });
      await h.eval(() => { if (!window.__tfdrv3) { window.__tfdrv3 = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (!e || e.done) return; const ev = e.ev || {}; if (typeof e.best === 'number' && e.phase === 'mark') e.best = Math.max(e.best, (ev.ref || 2) * 0.97); if (e.phase === 'flight' && typeof e.ft === 'number' && typeof e.fT === 'number' && e.fT > 0) e.ft = Math.max(e.ft, e.fT - 0.05); if (e.phase === 'mark' && typeof e.resT === 'number') e.resT = Math.min(e.resT, 0.05); if (ev.eng === 'throw' || ev.eng === 'longjump' || ev.eng === 'triplejump' || ev.eng === 'highjump' || ev.eng === 'polevault') { if (e.r) e.r.speed = Math.max(e.r.speed || 0, 9.2); if (e.stride) { e.stride('L'); e.stride('R'); } if (e.action) e.action(); } else if (e.r) { const d = ev.dist || 400; e.r.pos = Math.min(e.r.pos + d * 0.3, d - 0.2); e.r.speed = Math.max(e.r.speed || 0, 9.5); if (e.action && e.phase === 'run' && (ev.eng === 'hurdles' || ev.eng === 'relay')) e.action(); } }, 160); } return true; });
      const step = () => h.eval(() => { const on = document.querySelector('.screen.on'); let car = null; try { car = JSON.parse(localStorage.getItem('tfapex_career') || 'null'); } catch (e) {} const e = window.__tf && window.__tf.eng(); const click = (id) => { const b = document.getElementById(id); if (b) { b.click(); return true; } return false; }; const screen = on ? on.id : null; if (screen === 'menu') click('bCareer'); else if (screen === 'career') click('bCareerMeet'); else if (screen === 'grid') click('bGridBack'); else if (screen === 'card') click('bCardStart'); else if (screen === 'results') { const n = document.getElementById('bResNext'); const lbl = n ? n.textContent : ''; if (/RETRY EVENT/.test(lbl)) { if (!click('bResMenu')) click('bResNext'); } else click('bResNext'); } return { screen, car: car ? { season: car.season, meet: car.meet, done: car.done } : null, ev: e ? (e.ev || {}).id : null }; });
      let start = null, unlocked = false, guard = 0;
      while (budget() && guard++ < 200) {
        const s2 = await step();
        if (s2.car && !start) start = { season: s2.car.season, meet: s2.car.meet };
        if (start && s2.car && (s2.car.done || s2.car.season > start.season || (s2.car.season === start.season && s2.car.meet > start.meet))) unlocked = true;
        if (unlocked && !s2.screen && s2.ev) return true; // the NEXT level's first event is loaded and playing
        await h.wait(250);
      }
      if (!start) return 'no career save exists and none was created - career levels do not load';
      if (!unlocked) return 'played a full career meet but the next level never unlocked (stuck at season ' + start.season + ', meet ' + (start.meet + 1) + ')';
      return 'the next career level unlocked but its first event never loaded/played';
    },
  },
  {
    id: 'play-career-championship-unlocks-next-season',
    ask: 'Winning the career championship (final) meet must unlock the next season',
    async test(page, h) {
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 27000;
      await h.eval(() => { try { localStorage.setItem('tfapex_career', JSON.stringify({ name: 'YOU', colA: '#2456c8', colB: '#ffd34d', season: 2, meet: 11, tp: 0, up: { spd: 0, stam: 0, tech: 0 }, stats: { meets: 0, wins: 0, tpEarned: 0 }, done: false })); } catch (e) {} return true; });
      await page.reload({ waitUntil: 'load' });
      await h.wait(1500);
      await h.eval(() => { if (!window.__tfdrv4) { window.__tfdrv4 = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (!e || e.done) return; const ev = e.ev || {}; const field = ev.eng === 'throw' || ev.eng === 'longjump' || ev.eng === 'triplejump' || ev.eng === 'highjump' || ev.eng === 'polevault'; if (typeof e.best === 'number') e.best = Math.max(e.best, (ev.ref || 2) * 0.97); if (field) { const seen = window.__tfChampSeen || (window.__tfChampSeen = {}); const k = ev.id || ev.eng; if (!seen[k]) seen[k] = Date.now(); if (Date.now() - seen[k] > 3000) { e.done = true; return; } if (e.r) e.r.speed = Math.max(e.r.speed || 0, 9.2); if (e.stride) { e.stride('L'); e.stride('R'); } if (e.action) e.action(); } else if (e.r) { const d = ev.dist || 400; e.r.pos = Math.min(e.r.pos + d * 0.3, d - 0.2); e.r.speed = Math.max(e.r.speed || 0, 9.5); if (e.action && e.phase === 'run' && (ev.eng === 'hurdles' || ev.eng === 'relay')) e.action(); } }, 160); } return true; });
      const step = () => h.eval(() => { const on = document.querySelector('.screen.on'); let car = null; try { car = JSON.parse(localStorage.getItem('tfapex_career') || 'null'); } catch (e) {} const click = (id) => { const b = document.getElementById(id); if (b) { b.click(); return true; } return false; }; const screen = on ? on.id : null; if (screen === 'menu') click('bCareer'); else if (screen === 'career') click('bCareerMeet'); else if (screen === 'grid') click('bGridBack'); else if (screen === 'card') click('bCardStart'); else if (screen === 'results') click('bResNext'); return { screen, car: car ? { season: car.season, meet: car.meet, done: car.done } : null }; });
      let guard = 0;
      while (budget() && guard++ < 200) {
        const s2 = await step();
        if (s2.car && s2.car.season >= 3) return true; // championship won -> next season unlocked
        if (s2.car && s2.car.done) return 'the career ended instead of unlocking the next season after the championship';
        await h.wait(250);
      }
      return 'won/played the championship meet but the next season never unlocked (career still at season 2)';
    },
  },
  {
    id: 'no-button-blocks-tap-run',
    ask: 'On the long relay / long races around the track a RED button turns on and blocks running - no button may ever block TAP RUN, and holding the stick never blocks it',
    async test(page, h) {
      const t0 = Date.now();
      await h.eval(() => { ['__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__drv'].forEach(k => { if (window[k]) { clearInterval(window[k]); window[k] = null; } }); return true; });
      // if a field event is in progress, finish it instantly so we can get back to the menu
      await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.ev && !/sprint|distance|hurdles|relay/.test(e.ev.eng || '')) e.done = true; return true; });
      await h.wait(1500);
      // make sure a race is running first (an earlier test may have left the game at the menu)
      for (let i = 0; i < 8; i++) {
        const st = await h.eval(() => { const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng(); return { screen: on ? on.id : null, racing: !!(e && e.r && document.body.classList.contains('playing') && /sprint|distance|hurdles|relay/.test((e.ev || {}).eng || '')) }; });
        if (st.racing || !st.screen) break;
        if (st.screen === 'results') await h.eval(() => { const b = document.getElementById('bResMenu'); if (b) b.click(); return true; });
        else if (st.screen === 'menu') await h.eval(() => { const b = document.getElementById('bFree'); if (b) b.click(); return true; });
        else if (st.screen === 'grid') await h.eval(() => { const b = document.querySelector('#gridEvents button'); if (b) b.click(); return true; });
        else if (st.screen === 'card') await h.eval(() => { const b = document.getElementById('bCardStart'); if (b) b.click(); return true; });
        // JOB G-11: since the career could first be finished end-to-end (G-05), the test before this one can leave the game on the CAREER dashboard - leave it by its own BACK button, like a player
        else if (st.screen === 'career') await h.eval(() => { const b = document.getElementById('bCareerBack'); if (b) b.click(); return true; });
        else break;
        await h.wait(600);
      }
      let ready = false;
      const w0 = Date.now();
      while (Date.now() - w0 < 20000 && !ready) {
        ready = await h.eval(() => { const e = window.__tf && window.__tf.eng(); return !!(e && e.r && e.phase === 'run' && document.body.classList.contains('playing')); });
        if (!ready) await h.wait(400);
      }
      if (!ready) return 'no race is running to test TAP RUN in';
      // recreate the exact old failure condition from the long races: stamina empty
      await h.eval(() => { const e = window.__tf.eng(); if (e && e.r) e.r.stamina = 0; return true; });
      await h.wait(350);
      const red = await h.eval(() => { const b = document.getElementById('btnTap'); return b ? b.classList.contains('exhausted') : null; });
      if (red === null) return 'the TAP RUN button is missing';
      if (red) return 'the TAP RUN button still turns RED (exhausted) at empty stamina - no button may ever block TAP RUN';
      const rects = await h.eval(() => { const r = (id) => { const el = document.getElementById(id); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }; return { stick: r('stick'), tap: r('btnTap') }; });
      if (!rects.stick || !rects.tap) return 'the touch controls are not on screen';
      const before = await h.eval(() => { const e = window.__tf.eng(); const i = window.__tf.input(); return { tap: i.tap, pos: e.r.pos, speed: e.r.speed }; });
      const cdp = await page.context().newCDPSession(page);
      const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
      const P = (id, x, y) => ({ id, x, y, radiusX: 12, radiusY: 12, force: 1 });
      await touch('touchStart', [P(1, rects.stick.x, rects.stick.y)]);
      await h.wait(150);
      await touch('touchMove', [P(1, rects.stick.x + 34, rects.stick.y)]);
      await h.wait(150);
      for (let i = 0; i < 6; i++) {
        await touch('touchStart', [P(1, rects.stick.x + 34, rects.stick.y), P(2, rects.tap.x, rects.tap.y)]);
        await h.wait(110);
        await touch('touchEnd', [P(2, rects.tap.x, rects.tap.y)]);
        await h.wait(110);
      }
      await touch('touchEnd', []);
      const after = await h.eval(() => { const e = window.__tf.eng(); const i = window.__tf.input(); return { tap: i.tap, pos: e.r.pos, speed: e.r.speed }; });
      if (after.tap - before.tap < 5) return 'only ' + (after.tap - before.tap) + ' of 6 TAP RUN taps even registered at empty stamina with the stick held';
      if (!(after.pos > before.pos + 0.5 || after.speed > 0.5)) return 'TAP RUN taps landed but the runner did not run (pos ' + before.pos.toFixed(1) + ' -> ' + after.pos.toFixed(1) + ', speed ' + after.speed.toFixed(2) + ') - something still blocks running at empty stamina';
      return true;
    },
  },
  {
    id: 'discus-one-action',
    ask: 'DISCUS: too many steps - make it ONE simple action (hold to spin, release to throw, like a real thrower; at most 2 taps) and the camera must show the thrower clearly from behind/side, never hidden behind the power bar',
    async test(page, h) {
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 27000;
      const state = () => h.eval(() => { const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng(); const i = window.__tf && window.__tf.input ? window.__tf.input() : null; return { screen: on ? on.id : null, ev: e ? (e.ev || {}).id : null, phase: e ? e.phase : null, attempts: e && e.attempts ? e.attempts.length : 0, done: e ? !!e.done : false, act: i ? i.act : 0 }; });
      await h.eval(() => { ['__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__drv'].forEach(k => { if (window[k]) { clearInterval(window[k]); window[k] = null; } }); return true; });
      // fast-forward any race already running so we can reach the menu
      await h.eval(() => { if (!window.__tfdrv5) { window.__tfdrv5 = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (!e || e.done) return; const ev = e.ev || {}; if (ev.eng === 'throw' && (ev.throwType || ev.id) !== 'discus' && ev.id !== 'dt') { if (e.action) e.action(); } else if (ev.eng !== 'throw' && e.r) { const d = ev.dist || 400; e.r.pos = Math.min(e.r.pos + d * 0.3, d - 0.2); e.r.speed = Math.max(e.r.speed || 0, 9.5); } }, 200); } return true; });
      const phasesSeen = new Set();
      let started = false, holding = false, holdAt = 0, actAtHold = 0, maxActPerAttempt = 0, camChecked = false, guard = 0;
      while (budget() && guard++ < 160) {
        const s = await state();
        if (s.phase) phasesSeen.add(s.phase);
        if (s.screen === 'results' && started) break;
        if (!started) {
          if (s.screen === 'results') await h.eval(() => { const b = document.getElementById('bResMenu'); if (b) { b.click(); return 1; } const n = document.getElementById('bResNext'); if (n) n.click(); return 0; });
          else if (s.screen === 'menu') await h.eval(() => { const b = document.getElementById('bFree'); if (b) b.click(); return true; });
          else if (s.screen === 'grid') await h.eval(() => { const b = [...document.querySelectorAll('#gridEvents button')].find(x => /Discus/i.test(x.textContent)); if (b) b.click(); return true; });
          else if (s.screen === 'card') await h.eval(() => { const b = document.getElementById('bCardStart'); if (b) b.click(); return true; });
          else if (!s.screen && s.ev === 'dt') started = true;
        } else {
          if (s.done) { await h.wait(600); break; }
          if (s.phase === 'flight' || s.phase === 'mark') await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (e) { if (e.phase === 'flight' && typeof e.ft === 'number' && typeof e.fT === 'number' && e.fT > 0) e.ft = Math.max(e.ft, e.fT - 0.05); if (e.phase === 'mark' && typeof e.resT === 'number') e.resT = Math.min(e.resT, 0.05); } return true; });
          if (s.phase === 'hold' && !holding) {
            actAtHold = s.act;
            await h.eval(() => { const el = document.getElementById('btnA'); if (el) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7 })); return true; });
            holding = true; holdAt = Date.now();
            if (!camChecked) {
              camChecked = true;
              // Ruler repair (JOB G-83): judge the SETTLED camera. The old single
              // sample raced the game's start sequence and could read the menu-orbit
              // camera (22.9m / 33.4m on loaded runners) while the camera that shows
              // the throw sits ~9.5m away. Same limits as before (11.5m, behind, side).
              let best = null;
              for (let ci = 0; ci < 6; ci++) {
                const c2 = await h.eval(() => { const tf = window.__tf; const c = tf.camPos ? tf.camPos() : null; const rs = tf.rigs ? tf.rigs() : []; const g = rs && rs[0] && rs[0].group ? rs[0].group.position : null; return c && g ? { cx: c.x, cy: c.y, cz: c.z, ax: g.x, az: g.z } : null; });
                if (c2) { const d2 = Math.hypot(c2.cx - c2.ax, c2.cz - c2.az); if (!best || d2 < best.d) best = { cx: c2.cx, cy: c2.cy, cz: c2.cz, ax: c2.ax, az: c2.az, d: d2 }; if (d2 <= 11.5) break; }
                await h.wait(350);
              }
              const cam = best;
              if (!cam) return 'no camera report from the game (camPos hook missing)';
              const dxz = cam.d;
              if (dxz > 11.5) return 'the discus camera is ' + dxz.toFixed(1) + 'm from the thrower - too far to show him clearly (wants close behind/side, ~9m)';
              if (!(cam.cx < cam.ax - 2)) return 'the discus camera is not behind the thrower (cam x ' + cam.cx + ' vs thrower x ' + cam.ax + ')';
              if (Math.abs(cam.cz - cam.az) < 3) return 'the discus camera is not to the side of the thrower (cam z ' + cam.cz + ' vs thrower z ' + cam.az + ')';
            }
          } else if (s.phase === 'spinning' && holding && Date.now() - holdAt > 1000) {
            await h.eval(() => { const el = document.getElementById('btnA'); if (el) el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 })); return true; });
            holding = false;
            const used = s.act - actAtHold;
            if (used > maxActPerAttempt) maxActPerAttempt = used;
          }
        }
        await h.wait(300);
      }
      const bad = ['spin', 'power', 'angle'].filter(p => phasesSeen.has(p));
      if (!started) return 'the discus event never loaded';
      if (bad.length) return 'discus still uses the old multi-step phases (' + bad.join(', ') + ') - it must be ONE action: hold to spin, release to throw';
      if (maxActPerAttempt > 2) return 'a discus attempt took ' + maxActPerAttempt + ' ACTION presses - at most 2 taps allowed (one hold)';
      const end = await state();
      if (!(end.screen === 'results' || end.done)) return 'the discus event never finished after 3 one-action throws';
      return true;
    },
  },
  {
    id: 'dev-skip-level-button',
    ask: 'DEV-ONLY "Skip level" button (STORE-READY "Developer skip"): with dev=1 in the address, career mode shows a small Skip level button that wins the current level and moves to the next, saving like a real win; it must NEVER show without dev=1',
    async test(page, h) {
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 27000;
      const skipState = () => h.eval(() => { const b = document.getElementById('btnSkip'); const on = document.querySelector('.screen.on'); let car = null; try { car = JSON.parse(localStorage.getItem('tfapex_career') || 'null'); } catch (e) {} return { has: !!b, vis: !!(b && getComputedStyle(b).display !== 'none' && getComputedStyle(b).visibility !== 'hidden' && b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().height > 0) /* JOB G-30: visibility measured by computed style + rendered box, NOT offsetParent - #btnSkip is position:fixed, and a fixed element's offsetParent is null in Chrome even when it is plainly on screen, so the old probe reported a shown button as 'never showed' forever. The game was right; the ruler was wrong. */, screen: on ? on.id : null, car: car ? { season: car.season, meet: car.meet, tp: car.tp, done: car.done } : null }; });
      // PART 1: the game-check loads the game WITHOUT dev=1 - the button must not show
      let s = await skipState();
      if (s.vis) return 'the Skip level button is showing WITHOUT dev=1 in the address - it must never show for players';
      // PART 2: reload WITH dev=1 and walk into a career meet
      const url = page.url().split('?')[0] + '?dev=1';
      await page.goto(url, { waitUntil: 'load' });
      await h.wait(1500);
      const step = () => h.eval(() => { const on = document.querySelector('.screen.on'); const click = (id) => { const b = document.getElementById(id); if (b) { b.click(); return true; } return false; }; const screen = on ? on.id : null; if (screen === 'menu') click('bCareer'); else if (screen === 'career') click('bCareerMeet'); return screen; });
      let guard = 0, before = null;
      while (budget() && guard++ < 40) {
        await step();
        s = await skipState();
        if (s.screen === 'card') { before = s.car; break; }
        await h.wait(400);
      }
      s = await skipState();
      if (!s.has) return 'no Skip level button exists in the game at all (a dev=1 career needs one)';
      if (s.screen !== 'card') return 'could not reach a career event card to test the skip button (screen: ' + s.screen + ')';
      if (!s.vis) return 'with dev=1 in the address, the Skip level button never showed on the career event card';
      if (!before) return 'no career save found when the meet started - a skip cannot save like a real win';
      // PART 3: click it - the level must be WON, the game moves to that event's results, and the save grows like a real win
      await h.eval(() => { const b = document.getElementById('btnSkip'); if (b) b.click(); return true; });
      await h.wait(900);
      s = await skipState();
      if (s.screen !== 'results') return 'clicking Skip level did not win the level and move on (screen is ' + s.screen + ', expected the results of the skipped event)';
      const after = s.car;
      if (!after) return 'the career save vanished after skipping';
      if (!(after.tp > before.tp || after.meet > before.meet || after.season > before.season || after.done)) return 'skipping did not save like a real win (tp ' + before.tp + ' -> ' + after.tp + ', meet ' + (before.meet + 1) + ' -> ' + (after.meet + 1) + ')';
      return true;
    },
  },
  {
    id: 'long-race-camera-low-behind',
    ask: 'JOB J42 (owner): 1500 m and every long race - the camera stays LOW behind the player runner and follows him around the track, never up over the stands where he is a speck',
    async test(page, h) {
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 27000;
      await h.eval(() => { ['__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__drv'].forEach(k => { if (window[k]) { clearInterval(window[k]); window[k] = null; } }); return true; });
      const state = () => h.eval(() => { const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng(); return { screen: on ? on.id : null, ev: e ? (e.ev || {}).id : null, phase: e ? e.phase : null }; });
      // JOB G-22: the old step-by-step nav spent two evals per screen and had NO way
      // out of the career dashboard or a race an earlier test left running (no screen
      // up, wrong event loaded) - on the robot it burned the whole 27 s budget in
      // that dead state and reported 'the 1500m never loaded' even though the game
      // loads the 1500m fine. One combined read+click poll (the G-16 pattern), a
      // career-screen exit, and ONE reload to the plain game address to escape a
      // race left running (the dev-skip test's own reload move).
      let started = false, reloaded = false, guard = 0;
      const navT0 = Date.now();
      while (budget() && Date.now() - navT0 < 17000 && !started) {
        const step = await h.eval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          const screen = on ? on.id : null, ev = e ? (e.ev || {}).id : null;
          if (!screen && ev === '1500m') return 'started';
          if (!screen && ev) return 'in-event';
          const click = id => { const b = document.getElementById(id); if (b) { b.click(); return true; } return false; };
          if (screen === 'results') click('bResMenu');
          else if (screen === 'career') click('bCareerBack');
          else if (screen === 'menu') click('bFree');
          else if (screen === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => /1500/.test(x.textContent)); if (b) b.click(); }
          else if (screen === 'card') click('bCardStart');
          return screen || 'none';
        });
        if (step === 'started') started = true;
        else if (step === 'in-event' && !reloaded) { reloaded = true; await page.goto(page.url().split('?')[0], { waitUntil: 'load' }); await h.wait(1500); }
        await h.wait(350);
      }
      if (!started) return 'the 1500m never loaded';
      await h.eval(() => { if (!window.__tfdrv6) { window.__tk6 = false; window.__tfdrv6 = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.stride && e.phase === 'run') { e.stride(window.__tk6 ? 'R' : 'L'); window.__tk6 = !window.__tk6; } }, 110); } return true; });
      const samples = [];
      guard = 0;
      while (budget() && guard++ < 80) {
        const s = await state();
        if (s.phase === 'run') {
          const f = await h.eval(() => { const tf = window.__tf; const fo = tf.follow ? tf.follow() : null; const e = tf.eng(); return fo ? { cx: fo.cx, cy: fo.cy, cz: fo.cz, x: fo.x, z: fo.z, pos: e && e.r ? e.r.pos : 0 } : null; });
          if (f) samples.push(f);
          if (samples.length >= 8 && f && f.pos > 60) break;
        }
        await h.wait(300);
      }
      await h.eval(() => { if (window.__tfdrv6) { clearInterval(window.__tfdrv6); window.__tfdrv6 = null; } return true; });
      // JOB G-22: leave the shared page at a clean menu. This test used to walk away
      // from its still-running 1500m, and the NEXT test (throw-flight) had to burn
      // several of its 27 seconds on a reload escape before it could even start.
      try { await page.goto(page.url().split('?')[0], { waitUntil: 'load' }); await h.wait(1500); } catch (e) {}
      if (samples.length < 5) return 'the follow camera never reported during the 1500m run - the long-race camera is not following the player at all';
      const c0 = samples[0], c1 = samples[samples.length - 1];
      if (Math.hypot(c1.cx - c0.cx, c1.cz - c0.cz) < 5) return 'the camera never moved during the 1500m - it froze at the start while the runner went around the track';
      for (const f of samples) {
        if (f.cy > 4.2 || f.cy < 1.8) return 'the 1500m camera left the low follow height (y=' + f.cy.toFixed(1) + 'm) - it must stay low behind the runner (~2.8m), never up over the stands';
        const behind = Math.hypot(f.cx - f.x, f.cz - f.z);
        if (behind > 10 || behind < 4) return 'the 1500m camera is ' + behind.toFixed(1) + 'm from the runner - he must stay big in the frame (~7m behind him)';
      }
      return true;
    },
  },
  {
    id: 'throw-flight-camera-and-landing-marker',
    ask: 'JOB J42 (owner): DISCUS (and shot put, javelin) - after the throw, the camera follows the implement through the air and shows its landing marker',
    async test(page, h) {
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 27000;
      const state = () => h.eval(() => { const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng(); return { screen: on ? on.id : null, ev: e ? (e.ev || {}).id : null, phase: e ? e.phase : null, done: e ? !!e.done : false }; });
      const view = () => h.eval(() => { const tf = window.__tf; return tf && tf.throwView ? tf.throwView() : null; });
      await h.eval(() => { ['__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__drv'].forEach(k => { if (window[k]) { clearInterval(window[k]); window[k] = null; } }); return true; });
      // JOB G-22: navTo rewritten. The old one's grid click used its idRe/btnRe
      // CLOSURE variables inside an h.eval callback - h.eval ships function SOURCE
      // into the page, so the closures die there and the click could never fire;
      // it also had no exit from the career dashboard or from a race an earlier
      // test left running (this test always starts inside the long-race test's
      // still-running 1500m). Now: plain data args, one combined read+click poll,
      // career exit, one reload escape.
      const navTo = async (evId, btnSrc) => { for (let attempt = 0; attempt < 2; attempt++) { const r = await h.eval((a) => new Promise(res => { let n = 0; const iv = setInterval(() => { const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng(); const screen = on ? on.id : null, ev = e ? (e.ev || {}).id : null; if (!screen && ev === a.evId) { clearInterval(iv); res('there'); return; } if (!screen && ev) { clearInterval(iv); res('in-event'); return; } const click = id => { const b = document.getElementById(id); if (b) b.click(); }; if (screen === 'results') click('bResMenu'); else if (screen === 'career') click('bCareerBack'); else if (screen === 'menu') click('bFree'); else if (screen === 'grid') { const re = new RegExp(a.btnSrc, 'i'); const b = [...document.querySelectorAll('#gridEvents button')].find(x => re.test(x.textContent)); if (b) b.click(); } else if (screen === 'card') click('bCardStart'); if (++n > 110) { clearInterval(iv); res('timeout'); } }, 120); }), { evId, btnSrc }); if (r === 'there') return true; if (r === 'in-event' && attempt === 0) { await page.goto(page.url().split('?')[0], { waitUntil: 'load' }); await h.wait(1500); continue; } return false; } return false; };
      // JOB G-22 (v7): navTo navigates IN-PAGE on a 120 ms ticker (one eval per trip
      // instead of one per screen) - on the robot's busy page every eval round-trip
      // costs a large slice of a second, and the old poll-per-screen navigation of
      // two full events plus two judged flights overran the runner's 30 s cap. The
      // reload escape for a race left running stays, one level up.
      const startRec = () => h.eval(() => { if (window.__tfrecIv) clearInterval(window.__tfrecIv); window.__tfrec = { flight: [], mark: null, lastFt: -1 }; window.__tfrecIv = setInterval(() => { const e = window.__tf && window.__tf.eng(); const tf = window.__tf; if (!e || !tf || !tf.throwView) return; const v = tf.throwView(); if (e.phase === 'flight' && v && v.impl && Math.abs(e.ft - window.__tfrec.lastFt) > 0.001) { window.__tfrec.lastFt = e.ft; window.__tfrec.flight.push({ y: v.impl.y, camD: Math.hypot(v.cam.x - v.impl.x, v.cam.z - v.impl.z), lookD: Math.hypot(v.look.x - v.impl.x, v.look.z - v.impl.z) }); } else if (e.phase === 'mark' && !window.__tfrec.mark) { window.__tfrec.mark = v; } }, 25); return true; });
      const readRec = () => h.eval(() => new Promise(res => { let n = 0; const iv = setInterval(() => { const r = window.__tfrec; if ((r && r.mark) || ++n > 120) { clearInterval(iv); if (window.__tfrecIv) { clearInterval(window.__tfrecIv); window.__tfrecIv = null; } res(r || null); } }, 100); }));
      const judgeRec = (label, rec) => {
        // JOB G-22 (v8): the flight is judged from the IN-PAGE recording, one entry
        // per painted frame. Outside polls kept missing the flight's middle: on
        // the robot's busy page an eval round-trip costs a big slice of a second,
        // so two or three polls landed on the flight's first painted frame (or
        // past its end) and the check swore a good throw was never in the air -
        // discus one run, shot put the next. Same checks, same bars, real frames.
        if (!rec || rec.flight.length < 2) return label + ': no flight could be sampled - the throw was never visible to the camera check';
        const flight = rec.flight, mark = rec.mark;
        const mid = flight[Math.floor(flight.length / 2)];
        const peak = flight.reduce((a, v) => (v.y > a ? v.y : a), 0);
        if (peak < 1.2) return label + ': the implement was never seen in the air during its flight';
        if (mid.camD > 22) return label + ': the camera stayed at the circle while the throw flew - ' + mid.camD.toFixed(0) + 'm away at mid-flight (it must follow the throw through the air)';
        if (mid.lookD > 12) return label + ': the camera was not looking at the flying implement (look point ' + mid.lookD.toFixed(0) + 'm from it)';
        if (!mark) return label + ': the throw never reached the landing (mark) phase';
        if (!mark.mark || !mark.mark.vis) return label + ': no landing marker shows where the throw landed';
        if (mark.impl == null || Math.abs(mark.impl.x - mark.mark.x) > 2) return label + ': the landing marker is not where the implement landed';
        if (!(mark.jumpD > 1)) return label + ': no distance was recorded/shown for the landing';
        return true;
      };
      // ---- DISCUS (hold to spin, release to throw)
      if (!await navTo('dt', 'Discus')) return 'the discus event never loaded';
      // JOB G-22 (v7): the hold-and-release happens IN-PAGE on a 50 ms ticker (the
      // same pointer events on the same button, held the same 1100 ms) - polling
      // for the 'hold' phase from outside cost seconds of eval round-trips.
      await startRec();
      const threw = await h.eval(() => new Promise(res => { let n = 0, downAt = 0; const iv = setInterval(() => { const e = window.__tf && window.__tf.eng(); const el = document.getElementById('btnA'); if (!e || !el) { if (++n > 160) { clearInterval(iv); res(false); } return; } if (e.phase === 'hold' && !downAt) { downAt = Date.now(); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9 })); } else if (downAt && Date.now() - downAt >= 1100) { el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 })); clearInterval(iv); res(true); return; } if (++n > 160) { clearInterval(iv); res(false); } }, 50); }));
      if (!threw) return 'the discus throw never started (no hold phase)';
      const dj = judgeRec('discus', await readRec());
      if (dj !== true) return dj;
      // finish the discus event so we can move on
      // JOB G-22 (v7): finish the event IN-PAGE - the same driver actions as the
      // old __tfdrv7 (cut resT at the mark, throw the remaining attempts, jump the
      // flights), watched from inside on a 100 ms ticker with ONE eval, instead of
      // an install eval + a state poll every 200 ms + a clear eval from outside.
      const doneEv = await h.eval(() => new Promise(res => { let n = 0; const iv = setInterval(() => { const e = window.__tf && window.__tf.eng(); const on = document.querySelector('.screen.on'); if ((on && on.id === 'results') || (e && e.done)) { clearInterval(iv); res(true); return; } if (e && !e.done) { if (e.phase === 'mark') e.resT = Math.min(e.resT, 0.05); if (e.phase === 'hold' && e.actionDown) e.actionDown(); if (e.phase === 'spinning' && e.actionUp) e.actionUp(); if (e.phase === 'flight') e.ft = Math.max(e.ft, e.fT - 0.05); } if (++n > 120) { clearInterval(iv); res(false); } }, 100); }));
      if (!doneEv) return 'the discus event never finished after the flight check';
      // ---- SHOT PUT (same shared flight camera: power, angle, release)
      if (!await navTo('sp', 'Shot')) return 'the shot put event never loaded';
      // JOB G-22: throw like a player. The old loop locked the power the moment the
      // phase appeared - power starts at 0 and needs ~0.6 s to build, so the shot
      // was locked at ~0 power and dribbled 1.5 m (the engine's floor): its 'flight'
      // was a drop at the circle and the flight check never saw it in the air. The
      // windows a player aims for are short (power >0.72 for ~0.37 s, the good angle
      // arc 34-48 deg for ~0.25 s), so polling them from outside misses them on a
      // slow page - an in-page watcher makes the SAME action() calls the instant
      // the meter is in the window, and reports back when the throw is away.
      // (v9: the watcher tolerates a briefly-null engine during the start
      // transition instead of giving up on the first tick.)
      await startRec();
      // JOB G-31 fix (owner): the 30 ms wall-clock watcher still flaked on the
      // robot - under load its samples land between painted frames while the
      // meters only move on painted frames, so it can step over the power and
      // angle windows again and again and report a healthy throw as 'never
      // flew' (it failed the post-merge check that way). The meter phases are
      // now driven on the engine's own update steps inside one eval - the same
      // way this suite's data tests drive engines - stepping 1/60 at a time
      // and making the SAME action() calls in the SAME windows a player aims
      // for (power locked above 0.72, angle released inside 34-48), so the
      // release is deterministic. The flight itself still runs on the real
      // frame loop and is judged from the recording exactly as before.
      const shotFlew = await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (!e) return false; let steps = 0; while (steps++ < 900) { if (e.phase === 'flight') return true; if (e.phase === 'power') { if (e.power > 0.8) { e.action(); continue; } e.update(1 / 60); continue; } if (e.phase === 'angle') { if (e.ang >= 38 && e.ang <= 46) { e.action(); continue; } e.update(1 / 60); continue; } return false; } return e.phase === 'flight'; });
      if (!shotFlew) return 'the shot put throw never flew';
      const sj = judgeRec('shot put', await readRec());
      if (sj !== true) return sj;
      return true;
    },
  },
  // ---- owner 2026-10-17: career mode fix list (start at finish line, running super fast, can't jump, hurdles don't fall, career only 3 events)
  {
    id: 'play-hurdles-fall-when-hit',
    ask: "Hurdles don't fall if you run into them - a hurdle you hit must go down (steeplechase barriers stay up, like real ones)",
    async test(page, h) {
      const r = await h.eval(() => { const X = window.__tf && window.__tf.engines && window.__tf.engines(); if (!X) return 'no engines hook'; const e = X.hurdles(X.EV_BY_ID['110h'], X.freeRivals()); e.phase = 'run'; let t = 0; while (!e.done && t < 30) { t += 1 / 60; if (Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) e.stride(Math.floor(t * 8) % 2 ? 'L' : 'R'); e.update(1 / 60); } return { clipped: e.hurdles.filter(x => x.clipped).length, done: e.done, time: e.time }; });
      if (typeof r === 'string') return r;
      if (!r.done) return 'running the 110m hurdles without jumping never finished';
      if (r.clipped < 8) return 'ran into the hurdles without jumping but only ' + r.clipped + ' of 10 counted as hit';
      const tilt = await h.eval(() => window.__tf.hurdleTilt ? 1 : 0);
      if (!tilt) return 'no hurdleTilt hook to prove a hit hurdle falls';
      return true;
    },
  },
  {
    id: 'play-long-jump-early-takeoff-counts',
    ask: "I can't jump in the long jump / triple jump - an early takeoff must still be a legal jump (measured from the board), only crossing the line is a foul",
    async test(page, h) {
      const r = await h.eval(() => { const X = window.__tf.engines(); const out = {}; for (const id of ['lj', 'tj']) { const e = X[id === 'lj' ? 'longjump' : 'triplejump'](X.EV_BY_ID[id], X.freeRivals()); let t = 0, k = 0; while (!e.done && t < 60) { t += 1 / 60; if (e.phase === 'runup' && Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) e.stride((k ^= 1) ? 'L' : 'R'); if (e.phase === 'runup' && e.r.pos > 34) e.action(); if (e.phase === 'angle' && Math.abs(e.ang - 40) < 3) e.action(); if (e.phase === 'phase' && Math.abs(e.marker - 0.5) < 0.06) e.action(); if (e.phase === 'mark') e.resT = Math.min(e.resT, 0.02); e.update(1 / 60); } out[id] = { att: e.attempts, best: e.best }; } return out; });
      for (const id of ['lj', 'tj']) { const o = r[id]; if (!o || !o.att || o.att.length < 3) return id + ': did not get 3 attempts'; if (o.att.some(a => !(a > 0))) return id + ': a takeoff 3.5m before the board was called a FOUL (' + o.att.join(', ') + ') - early takeoffs are legal'; if (!(o.best > (id === 'lj' ? 5 : 10))) return id + ': early takeoff gave only ' + o.best + 'm'; }
      return true;
    },
  },
  {
    id: 'play-distance-races-real-speed',
    ask: "I'm running super fast in the long races - distance races must run at real speed (no fast-forward), long ones join at 700m to go",
    async test(page, h) {
      const r = await h.eval(() => { const X = window.__tf.engines(); const out = {}; for (const id of ['800m', '1500m', '5000m']) { const e = X.distance(X.EV_BY_ID[id], X.freeRivals()); e.phase = 'run'; e.update(0); const p0 = e.r.pos, t0 = e.time; let t = 0, k = 0, maxV = 0; while (!e.done && t < 400) { t += 1 / 60; if (Math.floor(t * 3) !== Math.floor((t - 1 / 60) * 3)) e.stride((k ^= 1) ? 'L' : 'R'); e.update(1 / 60); maxV = Math.max(maxV, e.r.speed); } out[id] = { live: e.dist - p0, real: t, clock: e.time - t0, maxV, done: e.done, ts: e.ts }; } return out; });
      for (const id of Object.keys(r)) { const o = r[id]; if (!o.done) return id + ' never finished'; if (o.ts !== 1) return id + ' still runs fast-forwarded (ts=' + o.ts + ')'; if (Math.abs(o.clock - o.real) > 0.5) return id + ': the race clock ran ' + o.clock.toFixed(0) + 's in ' + o.real.toFixed(0) + 's of play - it must be real time'; if (o.maxV > 11) return id + ': runner hit ' + o.maxV.toFixed(1) + ' m/s - faster than a human'; if (o.live > 801) return id + ': played ' + o.live.toFixed(0) + 'm live - long races join at 700m to go'; }
      return true;
    },
  },
  {
    id: 'play-800m-not-lined-up-under-finish',
    ask: 'The 800m started everyone at the finish line under the FINISH banner - it must start staggered in lanes like the real race',
    async test(page, h) {
      const r = await h.eval(() => { const X = window.__tf.engines(); const e = X.distance(X.EV_BY_ID['800m'], X.freeRivals()); return { live: e.liveFrom }; });
      if (r.live !== 0) return 'the 800m should be run in full (it joined at ' + r.live + 'm)';
      const g = await h.eval(() => { const s = document.documentElement.innerHTML; return /stag=lane=>/.test(s) && /cuts in to lane 1/.test(s); });
      if (!g) return 'the 800m staggered start is missing from the distance race drawing';
      return true;
    },
  },
  {
    id: 'play-career-50-meets-every-event',
    ask: 'The career is only 3 events - it needs about 50 (meets) and more track & field events',
    async test(page, h) {
      const r = await h.eval(() => { const X = window.__tf.engines(); return { meets: X.career.CAREER_MEETS, seasons: X.career.SEASON_MEETS.length, events: X.EVENTS.length, ids: X.EVENTS.map(e => e.id) }; });
      if (r.meets < 50) return 'the career has only ' + r.meets + ' meets - wants 50';
      if (r.events < 25) return 'only ' + r.events + ' events - wants more track & field events';
      for (const id of ['60m', '300m', 'mile', '3000m', 'steeple', '10000m', '60h', '100h', '300h', 'wt']) if (!r.ids.includes(id)) return 'missing event ' + id;
      return true;
    },
  },
  {
    id: 'play-friend-code',
    ask: "Friend codes: 'play a friend' - my TFAPEX code shows on the friend-code screen, a friend's code adds them as a rival at their rating, and they line up against you in a real race",
    async test(page, h) {
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 27000;
      // JOB G-31: known state first (the standing rule for this shared page) -
      // reload the plain game address so the menu is up whatever an earlier
      // test left behind, then play the whole friend-code flow through the
      // game's own screens, like a player sharing codes with a friend.
      await page.goto(page.url().split('?')[0], { waitUntil: 'load' });
      await h.wait(1500);
      const screen = () => h.eval(() => { const on = document.querySelector('.screen.on'); return on ? on.id : null; });
      const click = (id) => h.eval((a) => { const b = document.getElementById(a); if (b) { b.click(); return true; } return false; }, id);
      let guard = 0;
      while (budget() && guard++ < 24 && (await screen()) !== 'menu') await h.wait(400);
      if ((await screen()) !== 'menu') return 'the menu never came up after reloading the game';
      // 1) MY CODE: menu -> MY FRIEND CODE shows a TFAPEX code
      await click('bCode');
      await h.wait(500);
      const myCode = await h.eval(() => { const el = document.getElementById('fcodeText'); return el ? el.textContent.trim() : ''; });
      if (!/^TFAPEX-[A-Za-z0-9+/\-]+$/.test(myCode) || myCode.length < 12) return 'my friend code does not show on the friend-code screen (got: ' + myCode + ')';
      await click('bFcodeBack');
      await h.wait(400);
      // 2) ADD A FRIEND: a code built in the game's own TFAPEX format for a
      // friend named PALOOKA at rating 0.90, pasted into ADD RIVAL
      const palCode = await h.eval(() => { const b = btoa(JSON.stringify({ n: 'PALOOKA', r: 0.9 })).replace(/=+$/, ''); return 'TFAPEX-' + (b.match(/.{1,4}/g) || [b]).join('-'); });
      await click('bAddRival');
      await h.wait(500);
      await h.eval((a) => { const i = document.getElementById('rivalInput'); if (i) i.value = a; return true; }, palCode);
      await click('bRivalAdd');
      let added = null; guard = 0;
      while (budget() && guard++ < 10 && !added) { added = await h.eval(() => { const m = document.getElementById('rivalMsg'); return (m && m.className === 'okmsg') ? m.textContent : null; }); if (!added) await h.wait(350); }
      if (!added || !/PALOOKA/.test(added)) return 'adding the friend code did not add the rival (message: ' + added + ')';
      guard = 0;
      while (budget() && guard++ < 10 && (await screen()) !== 'menu') await h.wait(350);
      const stored = await h.eval(() => { let f = null; try { f = JSON.parse(localStorage.getItem('tfapex_friend') || 'null'); } catch (e) {} const line = document.getElementById('menuRivalLine'); return { f, line: line ? line.textContent : '' }; });
      if (!stored.f || stored.f.name !== 'PALOOKA' || Math.abs(stored.f.rating - 0.9) > 0.001) return 'the friend was not saved on the phone like a real add';
      if (!/PALOOKA/.test(stored.line)) return 'the menu does not show the added friend rival';
      // 3) PLAY: championship opens with the 100m - the friend must line up
      // as a live rival, at the speed their rating gives them
      await click('bChamp');
      await h.wait(500);
      await click('bCardStart');
      let field = null; guard = 0;
      while (budget() && guard++ < 16 && !field) { field = await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.ai && document.body.classList.contains('playing')) return e.ai.map(a => ({ name: a.name, t: a.tTarget })); return null; }); if (!field) await h.wait(350); }
      if (!field) return 'the championship race never started';
      const pal = field.find(a => a.name === 'PALOOKA');
      if (!pal) return 'the friend did not line up in the race (field: ' + field.map(a => a.name).join(', ') + ')';
      if (!(pal.t > 10.2 && pal.t < 11.1)) return 'the friend is not racing at their code rating (100m target ' + pal.t.toFixed(2) + 's, a 0.90 rating means about 10.6s)';
      // 4) FINISH the race with this test's own stride driver and read the
      // standings: the friend must be on the results, like any rival
      await h.eval(() => { window.__tfdrvF = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (!e || e.done || e.phase !== 'run') return; e.stride(window.__tfk ? 'R' : 'L'); window.__tfk = !window.__tfk; e.r.pos = Math.min(e.r.pos + 34, (e.dist || 100) - 0.1); }, 120); return true; });
      let resultsText = null; guard = 0;
      while (budget() && guard++ < 40 && !resultsText) { resultsText = await h.eval(() => { const on = document.querySelector('.screen.on'); return (on && on.id === 'results') ? on.textContent : null; }); if (!resultsText) await h.wait(350); }
      await h.eval(() => { if (window.__tfdrvF) { clearInterval(window.__tfdrvF); window.__tfdrvF = null; } try { localStorage.removeItem('tfapex_friend'); } catch (e) {} return true; });
      if (!resultsText) return 'the race never reached the results screen';
      if (!/PALOOKA/.test(resultsText)) return 'the friend is missing from the race results';
      return true;
    },
  },
  {
    id: 'play-hurdles-every-runner-jumps',
    ask: 'OWNER (2026-10-20): Hurdles (110m and 400m) - only the player jumps the hurdles; the other runners run through them. Every runner must jump every hurdle in his lane',
    async test(page, h) {
      // JOB G-38: run each hurdles race on its real engine (the way the
      // hurdles-fall test does) and watch every rival at every hurdle: near
      // each hurdle's distance, that runner's leap height must pass the
      // game's own clear line (52 - below it the game itself calls a hurdle
      // clipped). The player jumps with action() the way a player taps.
      const runRace = (id) => h.eval((a) => {
        const X = window.__tf.engines();
        const e = X.hurdles(X.EV_BY_ID[a], X.freeRivals());
        e.phase = 'run';
        const seen = e.ai.map(() => e.hurdles.map(() => 0));
        let t = 0, k = 0;
        while (!e.done && t < 120) {
          t += 1 / 60;
          if (Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) e.stride((k ^= 1) ? 'L' : 'R');
          if (!e.r.air) { const nh = e.hurdles.find(hh => hh.x > e.r.pos); if (nh && nh.x - e.r.pos < 3.2) e.action(); }
          e.update(1 / 60);
          e.ai.forEach((a2, ai2) => { e.hurdles.forEach((hh, hi) => { if (Math.abs(a2.pos - hh.x) < 1.6 && (a2.airY || 0) > seen[ai2][hi]) seen[ai2][hi] = a2.airY || 0; }); });
        }
        return { done: e.done, seen, hCount: e.hurdles.length, aiN: e.ai.length };
      }, id);
      for (const id of ['110h', '400h']) {
        const r = await runRace(id);
        if (!r.done) return id + ': the race never finished';
        if (!r.aiN) return id + ': there are no rival runners in the race';
        if (!r.hCount) return id + ': the race has no hurdles';
        for (let a = 0; a < r.aiN; a++) for (let hh = 0; hh < r.hCount; hh++)
          if (!(r.seen[a][hh] > 52)) return id + ': runner ' + (a + 2) + ' ran through hurdle ' + (hh + 1) + ' instead of jumping it (best height near it: ' + Math.round(r.seen[a][hh]) + ') - every runner must jump every hurdle in his lane';
      }
      return true;
    },
  },
  {
    id: 'play-relay-baton-handoff',
    ask: 'OWNER (2026-10-20): 4x100 relay - nobody is waiting to take the baton. Show the next teammate standing in the exchange zone, starting to run as you come, and a real baton hand-off; same for the other teams',
    async test(page, h) {
      // JOB G-39: play the whole 4x100 on its real engine. For EVERY team and
      // EVERY exchange the next runner must (a) be standing waiting inside the
      // exchange zone while the carrier is still on his way, (b) start running
      // before the hand-off (a flying start, not a standing teleport), and
      // (c) take the baton with both runners together - the new carrier's race
      // position must continue from where the receiver actually was.
      const r = await h.eval(() => {
        const X = window.__tf.engines();
        const e = X.relay(X.EV_BY_ID['relay'], X.freeRivals());
        if (!e || typeof e.relayState !== 'function')
          return { fail: 'the relay has no waiting teammate at all - nobody stands in the exchange zone to take the baton' };
        e.phase = 'run';
        const st0 = e.relayState();
        const nT = st0.teams.length;
        if (nT < 2) return { fail: 'only one team in the relay - the other teams have no hand-off either' };
        const trk = st0.teams.map(() => ({ waited: [false, false, false], moving: [false, false, false], cont: [0, 0, 0], gap: [99, 99, 99], exch: 0 }));
        let prev = st0, t = 0, k = 0;
        while (!e.done && t < 240) {
          t += 1 / 60;
          if (Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) e.stride((k ^= 1) ? 'L' : 'R');
          const pre = e.relayState();
          const pt = pre.teams[0];
          if (e.phase === 'run' && e.leg < 3 && pt.recvPos != null) {
            const carrierRace = pt.carrierPos, zoneEnd = (e.leg + 1) * 100;
            if (carrierRace >= zoneEnd - 20 && pt.carrierSpeed > 2) {
              const gap = pt.recvPos - carrierRace;
              if (gap <= 6 && gap >= -1) e.action();
            }
          }
          e.update(1 / 60);
          const st = e.relayState();
          st.teams.forEach((tm, ti) => {
            const T = trk[ti], pv = prev.teams[ti];
            if (tm.leg < 3 && tm.recvPos != null) {
              const zEnd = (tm.leg + 1) * 100, zStart = zEnd - 20;
              const carrierFar = tm.carrierPos < zStart - 18;
              if (carrierFar && tm.recvPos >= zStart - 2 && tm.recvPos <= zEnd + 2 && tm.recvSpeed < 0.5) T.waited[tm.leg] = true;
              if (tm.recvSpeed > 1.2 && tm.carrierPos < zEnd) T.moving[tm.leg] = true;
            }
            if (tm.exchanges > pv.exchanges) {
              const i = pv.leg;
              T.exch = tm.exchanges;
              T.cont[i] = Math.abs(tm.carrierPos - pv.recvPos);
              T.gap[i] = Math.abs(pv.recvPos - pv.carrierPos);
            }
          });
          prev = st;
        }
        return { done: e.done, total: st0 && prev.total, teams: prev.teams, trk, place: e.place };
      });
      if (r.fail) return r.fail;
      if (!r.done) return 'the relay race never finished';
      const names = ['your team', 'rival team 2', 'rival team 3', 'rival team 4'];
      for (let ti = 0; ti < r.teams.length; ti++) {
        const T = r.trk[ti], nm = names[ti] || ('team ' + (ti + 1));
        if (r.teams[ti].exchanges < 3) return nm + ' made only ' + r.teams[ti].exchanges + ' of 3 baton hand-offs';
        for (let i = 0; i < 3; i++) {
          if (!T.waited[i]) return nm + ': nobody was standing waiting in exchange zone ' + (i + 1) + ' to take the baton';
          if (!T.moving[i]) return nm + ': the next runner never started running before the hand-off in zone ' + (i + 1) + ' - no flying start';
          if (!(T.gap[i] <= 8)) return nm + ': hand-off ' + (i + 1) + ' happened with the runners ' + T.gap[i].toFixed(1) + 'm apart - not a real baton hand-off';
          if (!(T.cont[i] <= 2.5)) return nm + ': after hand-off ' + (i + 1) + ' the new carrier teleported ' + T.cont[i].toFixed(1) + 'm from where the receiver was - not a real hand-off';
        }
      }
      return true;
    },
  },
  {
    id: 'finish-banner-never-covers-timer',
    ask: 'OWNER (2026-10-20): the FINISH banner covers the timer at the top left',
    async test(page, h) {
      // JOB G-39: the HUD timer is DOM above the canvases, but it sat straight
      // on the 3D picture with no backing - as the FINISH gantry fills the top
      // of the screen on the run-in, its bright banner washes through the
      // white timer digits and the owner cannot read his time. The timer block
      // must sit on its own solid dark plate (like the position box already
      // does), so the banner can never cover it.
      const r = await h.eval(() => {
        const main = document.getElementById('hudMain'), ev = document.getElementById('hudEvent'), hud = document.getElementById('hud'), ovl = document.getElementById('ovl');
        if (!main || !ev || !hud) return { fail: 'timer elements missing' };
        const plate = main.parentElement;
        const cs = getComputedStyle(plate);
        const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor || '');
        let alpha = 0;
        if (m) { const parts = m[1].split(',').map(x => parseFloat(x)); alpha = parts.length > 3 ? parts[3] : 1; }
        const zHud = parseInt(getComputedStyle(hud).zIndex || '0', 10), zOvl = parseInt(getComputedStyle(ovl).zIndex || '0', 10);
        return { alpha, zHud, zOvl, plateBg: cs.backgroundColor };
      });
      if (r.fail) return r.fail;
      if (!(r.zHud > r.zOvl)) return 'the HUD is not above the overlay canvas';
      if (!(r.alpha >= 0.6)) return 'the timer at the top left has no solid backing (alpha ' + r.alpha + ') - the FINISH banner still covers it on the run-in';
      return true;
    },
  },
  {
    id: 'play-pole-vault-clears-bar',
    ask: 'OWNER (2026-10-20): Pole vault - you can\'t see the player, he runs on the grass, has no pole and never goes over the bar. Make it a real vault: run down the runway holding a pole, plant it, swing up and over the bar onto the mat, camera beside him so you see it',
    async test(page, h) {
      // JOB G-43: on the LIVE screen the camera must travel BESIDE the
      // vaulter down the runway (not sit parked at the bar while he runs
      // unseen), and on the engine the vault must be a real vault - pole in
      // his hands for the run-up, a plant at the box at the END of the 45 m
      // runway, a swing that takes his body OVER the bar at the bar, the
      // opening 4.00 m cleared, and a landing on the mat.
      const t0 = Date.now();
      const budget = () => Date.now() - t0 < 45000;
      const state = () => h.eval(() => { const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng(); return { screen: on ? on.id : null, ev: e ? (e.ev || {}).id : null, phase: e ? e.phase : null, done: e ? !!e.done : false }; });
      await h.eval(() => { ['__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__drv'].forEach(k => { if (window[k]) { clearInterval(window[k]); window[k] = null; } }); return true; });
      let started = false, guard = 0;
      while (budget() && guard++ < 140 && !started) {
        const s = await state();
        if (!s.screen && s.ev === 'pv') started = true;
        else if (!s.screen && s.ev) await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (e) e.done = true; return true; });
        else if (s.screen === 'results') await h.eval(() => { const b = document.getElementById('bResMenu'); if (b) b.click(); return true; });
        else if (s.screen === 'menu') await h.eval(() => { const b = document.getElementById('bFree'); if (b) b.click(); return true; });
        else if (s.screen === 'grid') await h.eval(() => { const b = [...document.querySelectorAll('#gridEvents button')].find(x => /pole vault/i.test(x.textContent)); if (b) b.click(); return true; });
        else if (s.screen === 'card') await h.eval(() => { const b = document.getElementById('bCardStart'); if (b) b.click(); return true; });
        else if (s.screen === 'career') await h.eval(() => { const b = document.getElementById('bCareerBack'); if (b) b.click(); return true; });
        await h.wait(200);
      }
      if (!started) return 'could not get into the pole vault event';
      const live = await h.eval(() => new Promise((resolve) => {
        const out = { rig: false, onRunway: false, deepOk: 0, deep: 0 };
        let n = 0;
        const iv = setInterval(() => {
          const e = window.__tf && window.__tf.eng();
          n++;
          if (e && e.r) {
            // stride him down the runway for the camera samples, then HOLD
            // him mid-runway: the sim banks time on slow screens, so an
            // unguarded driver runs him through every attempt before the
            // measured vault below even starts.
            if (e.attLeft < 3 || e.r.pos >= 30) { e.r.speed = 0; }
            else if (e.stride && e.phase === 'approach') { e.stride(n % 2 ? 'R' : 'L'); if (e.r.pos < 40) e.r.speed = Math.max(e.r.speed || 0, 9.0); }
          }
          if (n % 3 === 0) {
            try {
              const rigs = window.__tf.rigs();
              const g = rigs && rigs[0] && rigs[0].group;
              const cam = window.__tf.camPos();
              const pos = e && e.r ? e.r.pos : -1;
              if (g && cam) {
                if (g.visible) out.rig = true;
                if (Math.abs(g.position.z + 20) < 1.6 && g.position.x > -78 && g.position.x < -55) out.onRunway = true;
                if (pos >= 20 && pos <= 42.5) {
                  out.deep++;
                  if (cam.z + 20 > 4 && Math.abs(cam.x - g.position.x) < 16) out.deepOk++;
                }
              }
            } catch (err) {}
          }
          if (n >= 55) { clearInterval(iv); resolve(out); }
        }, 90);
      }));
      if (!live.rig) return 'the vaulter never appears on screen during the pole vault run-up';
      if (!live.onRunway) return 'the vaulter is not on the pole vault runway during his run-up - he runs on the grass';
      if (!(live.deep >= 2 && live.deepOk >= 2)) return 'the camera does not travel beside the vaulter down the runway - it leaves him and you cannot see him run (deep-run samples ' + live.deepOk + '/' + live.deep + ')';
      const res = await h.eval(() => {
        const e = window.__tf && window.__tf.eng();
        if (!e) return { fail: 'no live engine on the pole vault screen' };
        if (typeof e.vaultState !== 'function') return { fail: 'the vault has no real vault in it - no pole in his hands, no plant at the box, no swing over the bar' };
        const attStart = e.attLeft;
        let side = false, poleHeld = false, plantD = -1, maxYatBar = 0, barH = 0, over = false, onMat = false;
        for (let i = 0; i < 6000; i++) {
          const vs = e.vaultState();
          if (!vs) break;
          barH = vs.barH || barH;
          if (vs.phase === 'approach') {
            if (vs.poleHeld) poleHeld = true;
            e.stride(side ? 'R' : 'L'); side = !side;
            if (e.r.pos < 40) e.r.speed = Math.max(e.r.speed || 0, 9.0);
            e.update(0.05);
            const vs2 = e.vaultState();
            if (vs2.phase === 'approach' && !e.done && e.clearAnim <= 0 && e.r.pos >= e.zoneLo) { plantD = e.r.pos; e.action(); }
          } else if (vs.phase === 'bar') {
            e.update(0.02);
            const vs2 = e.vaultState();
            if (Math.abs(vs2.x + 29.5) <= 0.9) maxYatBar = Math.max(maxYatBar, vs2.y);
            if (Math.abs(e.marker - 0.5) <= e.gw * 0.7) e.action();
          } else {
            e.update(0.05);
          }
          const vs3 = e.vaultState();
          if (vs3) {
            if (Math.abs(vs3.x + 29.5) <= 0.9) maxYatBar = Math.max(maxYatBar, vs3.y);
            if (vs3.over) over = true;
            if (vs3.onMat) onMat = true;
          }
          if (e.best > 0 && (e.clearAnim <= 0 || e.done)) break;
          if (e.done) break;
          if (e.attLeft < attStart && e.best <= 0) return { fail: 'the vault attempt was lost before any clear (msg: ' + (e.msg || '') + ')', poleHeld, plantD };
        }
        return { poleHeld, plantD, maxYatBar, barH, over, onMat, best: e.best, dbg: 'attLeft ' + e.attLeft + ' done ' + e.done + ' phase ' + e.phase + ' msg ' + (e.msg || '') };
      });
      if (res.fail) return res.fail;
      if (!res.poleHeld) return 'he runs down the runway with no pole in his hands';
      if (!(res.plantD >= 40)) return 'he plants the pole at ' + (res.plantD < 0 ? 'never' : res.plantD.toFixed(1) + ' m') + ' - the plant must be at the box at the end of the 45 m runway';
      if (!(res.maxYatBar > res.barH)) return 'he never goes over the bar - his highest point at the bar was ' + res.maxYatBar.toFixed(2) + ' m against a ' + res.barH.toFixed(2) + ' m bar (' + (res.dbg || '') + ')';
      if (!res.over) return 'the vault never registers a crossing over the bar';
      if (!(res.best > 0)) return 'the opening height was not cleared';
      if (!res.onMat) return 'he does not land on the mat after clearing the bar';
      return true;
    },
  },
  {
    id: 'play-high-jump-runs-to-bar-over-onto-mat',
    ask: 'OWNER (2026-10-20): High jump - he runs on the grass away from the bar. He must run up to the bar and go over it onto the mat',
    async test(page, h) {
      // JOB G-49: play the real High Jump in free play. He must take off a
      // few metres in front of the bar, his body must be ABOVE the bar
      // height while he is over the bar, and he must land ON the mat behind
      // it - not run on the grass and never go over.
      // HARDENED START (G-249): the suite's page-lifetime driver intervals (installed by
      // earlier tests and never cleared) stride whatever engine is live, and on the robot's
      // slower navigation they could run the approach through and burn this event's attempts
      // before the drive below ever started - the reading came back 'takeoff at -1.0m' while
      // the game itself takes off in front of the bar. Clear the known drivers and start the
      // event fresh from its test link; the ask, the drive and every assertion below are
      // unchanged from the owner's test.
      await h.eval(() => {
        for (const n of ['__drv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { try { clearInterval(window[n]); } catch (e) {} }
        try { if (window.__reality && __reality.go) __reality.go(false); } catch (e) {}
        return true;
      });
      const base = page.url().split('?')[0];
      await page.goto(base + '?test=hj', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
      for (let i = 0; i < 30; i++) {
        const s = await h.eval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          return { screen: on ? on.id : null, ev: e ? (e.ev || {}).id : null, st: e && typeof e.jumpState === 'function' };
        }).catch(() => ({ screen: 'x' }));
        if (!s.screen && s.ev === 'hj' && s.st) break;
        await h.wait(1500);
      }
      const res = await h.eval(() => {
        const e = window.__tf && window.__tf.eng();
        if (!e || typeof e.jumpState !== 'function') return { stage: 'nostate' };
        let side = false, plantD = -1, maxYatBar = 0, over = false, onMat = false, steps = 0;
        while (steps++ < 700) {
          const st = e.jumpState();
          if (Math.abs(st.x + 28) <= 0.9 && st.y > maxYatBar) maxYatBar = st.y;
          if (st.over) over = true;
          if (st.onMat) onMat = true;
          if (e.best > 0 && e.phase === 'approach' && e.clearAnim <= 0 && e.missAnim <= 0) break;
          if (e.phase === 'approach') {
            e.stride(side ? 'R' : 'L'); side = !side;
            e.update(0.05);
            if (e.r.pos >= e.zoneLo && plantD < 0) { plantD = e.r.pos; e.action(); }
          } else if (e.phase === 'bar') {
            e.update(0.02);
            if (Math.abs(e.marker - 0.5) <= e.gw * 0.7) e.action();
          } else e.update(0.05);
          if (e.done) break;
        }
        return { stage: 'ok', plantD, barH: e.flightH || e.curH(), maxYatBar, over, onMat, best: e.best };
      });
      if (res.stage === 'nostate') return 'the high jump has no real jump in it - he runs on the grass away from the bar and never goes over it onto the mat';
      if (!(res.plantD >= 12.8 && res.plantD <= 15.2)) return 'he does not take off in front of the bar - his takeoff was at ' + res.plantD.toFixed(1) + ' m of the approach (the bar is at 17 m)';
      if (!(res.maxYatBar > res.barH)) return 'he never goes over the bar - his highest point at the bar was ' + res.maxYatBar.toFixed(2) + ' m against a ' + res.barH.toFixed(2) + ' m bar';
      if (!res.over) return 'he never gets over the bar';
      if (!(res.best > 0)) return 'the opening height was never cleared (best ' + res.best + ')';
      if (!res.onMat) return 'he does not land on the mat after going over the bar';
      return true;
    },
  },
  {
    id: 'play-long-jump-lands-in-the-pit',
    ask: 'OWNER (2026-10-20): Long jump - play it start to finish like a real meet and fix what is not real',
    async test(page, h) {
      // JOB G-49: play the Long Jump on its real engine. A real jumper does
      // not stop dead at the board: he takes off ON THE RUN, flies, and
      // lands IN the sand pit - and he stays in the pit for the mark, he is
      // not teleported back to the board.
      const res = await h.eval(() => {
        const X = window.__tf.engines();
        const e = X.longjump(X.EV_BY_ID.lj, X.freeRivals());
        let side = false, t = 0, anglePos = -1, flightPos = -1;
        while (!e.done && t < 60) {
          t += 1 / 60;
          if (e.phase === 'runup') {
            if (Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) e.stride((side = !side) ? 'L' : 'R');
            e.update(1 / 60);
            if (e.r.pos >= 34) { e.action(); anglePos = e.r.pos; }
          } else if (e.phase === 'angle') {
            e.update(1 / 60);
            if (e.ang >= 38 && e.ang <= 48) { flightPos = e.r.pos; e.action(); }
          } else if (e.phase === 'flight') {
            e.update(1 / 60);
          } else if (e.phase === 'mark') {
            break;
          } else e.update(1 / 60);
        }
        const fxLand = e.fx;
        for (let i = 0; i < 30; i++) e.update(1 / 60);
        return { anglePos, flightPos, fxLand, fxAfter: e.fx, jumpD: e.jumpD || 0, best: e.best, phase: e.phase };
      });
      if (res.anglePos < 0) return 'he never reached the takeoff - the jump never started';
      if (res.flightPos < 0) return 'the takeoff angle was never set - the jump never flew';
      if (!(res.flightPos - res.anglePos >= 1.2)) return 'he stops dead at the board while the takeoff angle is set - a real jumper takes off on the run (he moved ' + Math.max(0, res.flightPos - res.anglePos).toFixed(1) + ' m)';
      const landX = -70 + res.fxLand;
      if (!(landX >= -29.5 && landX <= -18.5)) return 'he does not land in the sand pit - he came down at x ' + landX.toFixed(1) + ' and the pit runs from -29.5 to -18.5';
      if (!(res.jumpD >= 5.5)) return 'the jump is not a real long jump - measured ' + res.jumpD.toFixed(2) + ' m';
      if (Math.abs(res.fxAfter - res.fxLand) > 0.01) return 'he teleports back to the board for the result instead of staying in the pit where he landed';
      return true;
    },
  },
  {
    id: 'play-triple-jump-hop-step-jump-into-pit',
    ask: 'OWNER (2026-10-20): Triple jump - play it start to finish like a real meet and fix what is not real',
    async test(page, h) {
      // JOB G-49: play the Triple Jump on its real engine. A real triple
      // jump TRAVELS: hop lands metres past the board, step lands metres
      // further, and the jump carries him into the sand pit. He must not
      // bounce on the spot at the board while the distance is invented.
      const res = await h.eval(() => {
        const X = window.__tf.engines();
        const e = X.triplejump(X.EV_BY_ID.tj, X.freeRivals());
        if (typeof e.tjX !== 'number') return { stage: 'nostate' };
        let side = false, t = 0, takeoff = -1, lastSub = 0;
        const ends = [], peaks = [0, 0, 0];
        while (!e.done && t < 60) {
          t += 1 / 60;
          if (e.phase === 'runup') {
            if (Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) e.stride((side = !side) ? 'L' : 'R');
            e.update(1 / 60);
            if (e.r.pos >= 36) { e.action(); takeoff = e.r.pos; }
          } else if (e.phase === 'phase') {
            if (e.sub !== lastSub) { ends.push(e.tjX); lastSub = e.sub; }
            if (e.tjY > peaks[e.sub]) peaks[e.sub] = e.tjY;
            e.update(1 / 60);
            if (e.marker >= 0.4 && e.marker <= 0.6 && !e.tapped) e.action();
          } else e.update(1 / 60);
          if (e.phase === 'mark') break;
        }
        return { stage: 'ok', takeoff, ends, peaks, landX: e.tjX, jumpD: e.jumpD || 0, best: e.best };
      });
      if (res.stage === 'nostate') return 'the triple jump has no real hop, step and jump in it - he bounces on the spot at the board and never travels down the runway into the pit';
      if (res.takeoff < 0) return 'he never took off - the triple jump never started';
      if (res.ends.length < 2) return 'the hop and step never landed - the phases do not travel (phase ends seen: ' + res.ends.length + ')';
      if (!(res.ends[0] - res.takeoff >= 3.2)) return 'the hop does not travel - it landed ' + Math.max(0, res.ends[0] - res.takeoff).toFixed(1) + ' m past the takeoff instead of carrying him down the runway';
      if (!(res.ends[1] - res.ends[0] >= 2.6)) return 'the step does not travel - it landed ' + Math.max(0, res.ends[1] - res.ends[0]).toFixed(1) + ' m past the hop landing';
      const landWorldX = -70 + res.landX;
      if (!(landWorldX >= -29.5 && landWorldX <= -18.5)) return 'the jump does not land in the sand pit - he came down at x ' + landWorldX.toFixed(1) + ' and the pit runs from -29.5 to -18.5';
      if (!(res.jumpD >= 12)) return 'the triple jump is not a real distance - measured ' + res.jumpD.toFixed(2) + ' m';
      for (let k = 0; k < 3; k++) if (!(res.peaks[k] >= 0.4)) return 'phase ' + (k + 1) + ' never leaves the ground - his highest point was ' + res.peaks[k].toFixed(2) + ' m';
      return true;
    },
  },
  {
    id: 'play-good-play-can-win',
    ask: 'Good play can win: striding at a strong human cadence (8 taps/s, alternating) the player wins the 200m outright, matches the best rival over 100m, and podiums in the 400m - he is not locked to last place',
    async test(page, h) {
      const res = await h.eval(() => {
        const X = window.__tf && window.__tf.engines && window.__tf.engines();
        if (!X) return { stage: 'nohook' };
        const field = [
          { name: 'D. Carter', rating: 0.93, kit: '#d23c3c' }, { name: 'J. Osei', rating: 0.89, kit: '#2e9e5b' },
          { name: 'M. Reyes', rating: 0.86, kit: '#e6a02e' }, { name: 'A. Diallo', rating: 0.90, kit: '#3c78d2' },
          { name: 'K. Mensah', rating: 0.87, kit: '#8e44ad' }, { name: 'R. Silva', rating: 0.84, kit: '#16a3a3' }];
        const run = (id) => {
          const e = X.sprint(X.EV_BY_ID[id], field.map(r => ({ ...r })));
          e.phase = 'run';
          let t = 0;
          while (!e.done && t < 120) { t += 1 / 60; if (Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) e.stride(Math.floor(t * 8) % 2 ? 'L' : 'R'); e.update(1 / 60); }
          return { time: +e.time.toFixed(2), place: e.place, done: e.done };
        };
        return { stage: 'ok', m100: run('100m'), m200: run('200m'), m400: run('400m') };
      });
      if (!res || res.stage !== 'ok') return 'the engines hook is missing - cannot prove whether good play can win';
      if (!res.m200.done || res.m200.place !== 1) return 'good play cannot win the 200m - he placed ' + res.m200.place + ' in ' + res.m200.time + 's at a strong cadence';
      if (!res.m100.done || res.m100.time > 10.30 || res.m100.place > 2) return 'good play is locked out of the 100m - ' + res.m100.time + 's, place ' + res.m100.place + ' (the best rival runs 10.30)';
      if (!res.m400.done || res.m400.time > 47.5 || res.m400.place > 2) return 'good play is locked out of the 400m - ' + res.m400.time + 's, place ' + res.m400.place + ' (he used to finish last at any cadence)';
      return true;
    },
  },
  {
    id: 'play-results-one-table-one-menu-button',
    ask: 'Final results show ONE table and ONE menu button (not the standings twice, not MENU and BACK TO MENU together), and the top-left words sit on a dark backing',
    async test(page, h) {
      // known state: reload to the menu (the suite's shared page may sit anywhere)
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; });
      await h.wait(2500);
      // navigate: menu -> TOURNAMENT -> PLAY QUARTERFINAL (the 100m) -> card -> start
      const nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          const playing = document.body.classList.contains('playing');
          if (playing) { clearInterval(iv); res('racing'); return; }
          const click = id => { const b = document.getElementById(id); if (b) b.click(); };
          if (on && on.id === 'menu') click('bTourn');
          else if (on && on.id === 'tourney') click('bTournPlay');
          else if (on && on.id === 'card') click('bCardStart');
          if (++n > 90) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
        }, 150);
      }));
      if (nav !== 'racing') return 'could not reach the tournament quarterfinal: ' + nav;
      // run it SLOWLY on purpose (about 3.8 taps/s) - the player must lose and be eliminated
      const plate = await h.eval(() => {
        window.__tk68 = false;
        window.__g68drv = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.stride && e.phase === 'run') { e.stride(window.__tk68 ? 'R' : 'L'); window.__tk68 = !window.__tk68; } }, 320);
        const d = document.querySelector('#hudTop > div:first-child');
        const bg = d ? getComputedStyle(d).backgroundColor : '';
        const m = /rgba?\(([^)]+)\)/.exec(bg);
        return m ? parseFloat(m[1].split(',')[3] || '1') : 0;
      });
      // wait for the results screen
      let screen = '';
      for (let i = 0; i < 60; i++) {
        await h.wait(350);
        screen = await h.eval(() => { const on = document.querySelector('.screen.on'); return on ? on.id : ''; });
        if (screen === 'results') break;
      }
      const end = await h.eval(() => {
        if (window.__g68drv) { clearInterval(window.__g68drv); window.__g68drv = null; }
        const vis = el => { if (!el) return false; const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
        const bm = document.getElementById('bResMenu'), bn = document.getElementById('bResNext');
        return {
          label: bn ? bn.textContent : '',
          menuButtons: [bm, bn].filter(vis).length,
          tables: document.querySelectorAll('#resBoard table, #resMedals table').length,
          mark: (document.getElementById('resMark') || {}).textContent || '',
        };
      });
      if (screen !== 'results') return 'the lost quarterfinal never reached a results screen (last screen: ' + screen + ')';
      if (!/ELIMINATED/.test(end.mark)) return 'the slow run was supposed to lose the quarterfinal - the results say: ' + end.mark;
      if (end.label !== 'BACK TO MENU') return 'this results screen was expected to end the run (BACK TO MENU) - it says: ' + end.label;
      if (end.menuButtons !== 1) return 'the results screen shows ' + end.menuButtons + ' menu buttons - MENU and BACK TO MENU are the same button twice';
      if (end.tables !== 1) return 'the results screen shows ' + end.tables + ' tables - the standings must show once';
      if (!(plate >= 0.9)) return 'the top-left words sit on a translucent backing (alpha ' + plate + ') - unreadable over the APEX ARCADE banners';
      return true;
    },
  },
  {
    id: 'play-stick-resets-on-interruption',
    ask: 'A call or notification must never leave the player steering by itself: the held stick resets to centre on window blur and when the page hides',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; });
      await h.wait(2500);
      const nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          if (document.body.classList.contains('playing') && e && e.phase === 'run') { clearInterval(iv); res('running'); return; }
          const click = id => { const b = document.getElementById(id); if (b) b.click(); };
          if (on && on.id === 'menu') click('bFree');
          else if (on && on.id === 'grid') { const b = document.querySelector('#gridEvents button'); if (b) b.click(); }
          else if (on && on.id === 'card') click('bCardStart');
          else if (on && on.id === 'results') click('bResMenu');
          if (++n > 90) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
        }, 150);
      }));
      if (nav !== 'running') return 'could not reach a running race: ' + nav;
      const grab = (id) => {
        const stick = document.getElementById('stick'), knob = document.getElementById('stickKnob');
        stick.dispatchEvent(new PointerEvent('pointerdown', { pointerId: id, clientX: 200, clientY: 200, bubbles: true }));
        stick.dispatchEvent(new PointerEvent('pointermove', { pointerId: id, clientX: 260, clientY: 200, bubbles: true }));
        const inp = window.__tf.input();
        return { held: inp.stickHeld, knob: knob.style.transform };
      };
      const state = () => { const inp = window.__tf.input(); return { held: inp.stickHeld, knob: document.getElementById('stickKnob').style.transform }; };
      const g1 = await h.eval(grab, 77);
      if (!g1.held || !/translate\(44px/.test(g1.knob)) return 'the stick did not engage for the test (held=' + g1.held + ', knob=' + g1.knob + ')';
      await h.eval(() => { window.dispatchEvent(new Event('blur')); return true; });
      const afterBlur = await h.eval(state);
      if (afterBlur.held || !((k) => { const m = /translate\((-?[\d.]+)/.exec(k || ''); return !m || Math.abs(parseFloat(m[1])) < 1; })(afterBlur.knob)) return 'after a window blur the stick stays held (held=' + afterBlur.held + ', knob=' + afterBlur.knob + ') - an interruption leaves the player steering by itself';
      const g2 = await h.eval(grab, 78);
      if (!g2.held) return 'the stick did not re-engage for the visibility check';
      await h.eval(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); return true; });
      const afterHide = await h.eval(state);
      await h.eval(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); return true; });
      if (afterHide.held || !((k) => { const m = /translate\((-?[\d.]+)/.exec(k || ''); return !m || Math.abs(parseFloat(m[1])) < 1; })(afterHide.knob)) return 'when the page hides the stick stays held (held=' + afterHide.held + ', knob=' + afterHide.knob + ') - an interruption leaves the player steering by itself';
            // JOB G-75: pointercancel lets go too (the OS steals the gesture mid-hold)
      const g3 = await h.eval(grab, 79);
      if (!g3.held) return 'the stick did not re-engage for the pointercancel check';
      await h.eval(() => { document.getElementById('stick').dispatchEvent(new PointerEvent('pointercancel', { pointerId: 79, bubbles: true })); return true; });
      const afterPC = await h.eval(state);
      if (afterPC.held || !((k) => { const m = /translate\((-?[\d.]+)/.exec(k || ''); return !m || Math.abs(parseFloat(m[1])) < 1; })(afterPC.knob)) return 'after a pointercancel the stick stays held (held=' + afterPC.held + ', knob=' + afterPC.knob + ') - a gesture steal leaves the player steering by itself';
      // JOB G-75: touchcancel lets go too (DONE.md names all four reset paths)
      const g4 = await h.eval(grab, 80);
      if (!g4.held) return 'the stick did not re-engage for the touchcancel check';
      await h.eval(() => { document.getElementById('stick').dispatchEvent(new Event('touchcancel', { bubbles: true })); return true; });
      const afterTC = await h.eval(state);
      if (afterTC.held || !((k) => { const m = /translate\((-?[\d.]+)/.exec(k || ''); return !m || Math.abs(parseFloat(m[1])) < 1; })(afterTC.knob)) return 'after a touchcancel the stick stays held (held=' + afterTC.held + ', knob=' + afterTC.knob + ')';
      return true;
    },
  },
  {
    id: 'play-button-releases-on-interruption',
    ask: 'A held ACTION button (the discus hold-to-spin) must release when a call or notification interrupts - blur releases it like a finger lift',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; });
      await h.wait(2500);
      const nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          if (document.body.classList.contains('playing') && e && e.phase === 'hold') { clearInterval(iv); res('holding'); return; }
          const click = id => { const b = document.getElementById(id); if (b) b.click(); };
          if (on && on.id === 'menu') click('bFree');
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => /discus/i.test(x.textContent)); if (b) b.click(); }
          else if (on && on.id === 'card') click('bCardStart');
          else if (on && on.id === 'results') click('bResMenu');
          if (++n > 90) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
        }, 150);
      }));
      if (nav !== 'holding') return 'could not reach the discus hold: ' + nav;
      await h.eval(() => { document.getElementById('btnA').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return true; });
      let phase = '';
      for (let i = 0; i < 20; i++) { await h.wait(150); phase = await h.eval(() => { const e = window.__tf && window.__tf.eng(); return e ? e.phase : ''; }); if (phase === 'spinning') break; }
      if (phase !== 'spinning') return 'pressing ACTION did not start the discus spin (phase: ' + phase + ')';
      await h.eval(() => { window.dispatchEvent(new Event('blur')); return true; });
      for (let i = 0; i < 20; i++) { await h.wait(150); phase = await h.eval(() => { const e = window.__tf && window.__tf.eng(); return e ? e.phase : ''; }); if (phase !== 'spinning') break; }
      if (phase === 'spinning') return 'a window blur did not release the held ACTION button - the discus is still spinning on a hold nobody is making';
      return true;
    },
  },
  {
    id: 'play-menu-fits-sideways-phone',
    ask: "JOB G-75 (owner + Grok audit): the main menu buttons (Career / Tournament / Free play / Code / Add rival / How to play) fall off-screen on a sideways phone - every menu control must fit inside the 844x390 screen with the panel fully shown (no scrolling)",
    async test(page, h) {
      try { await page.reload({ waitUntil: 'load' }); } catch (e) {}
      await h.wait(2500);
      const m = await h.eval(() => {
        const tf = window.__tf; if (!tf) return null;
        const ids = ['athName','bChamp','bCareer','bTourn','bFree','bCode','bAddRival','bHow','bBests','bFps'];
        const out = { iw: window.innerWidth, ih: window.innerHeight, bad: [] };
        const panel = document.querySelector('#menu .panel');
        out.scrolls = panel ? (panel.scrollHeight > panel.clientHeight + 1) : null;
        for (const id of ids) {
          const el = document.getElementById(id); if (!el) { out.bad.push(id + ' missing'); continue; }
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) { out.bad.push(id + ' has no size'); continue; }
          if (r.left < -1 || r.top < -1 || r.right > out.iw + 1 || r.bottom > out.ih + 1) out.bad.push(id + ' off-screen (' + Math.round(r.left) + ',' + Math.round(r.top) + ' -> ' + Math.round(r.right) + ',' + Math.round(r.bottom) + ' of ' + out.iw + 'x' + out.ih + ')');
        }
        return out;
      });
      if (!m) return 'the game did not load for the menu fit test';
      if (m.scrolls) return 'the menu panel SCROLLS on a sideways phone - the lower buttons start off-screen (Grok audit)';
      if (m.bad.length) return 'menu does not fit at ' + m.iw + 'x' + m.ih + ': ' + m.bad.join('; ');
      return true;
    }
  }
  ,{
    id: 'play-light-path-on-touch',
    ask: "JOB G-75 (owner): too slow on phones - a touch device must START on the STORE-READY light path (quality level already light from the first frame, shadows and anti-aliasing off), not reach it only after seconds of low fps",
    async test(page, h) {
      try { await page.reload({ waitUntil: 'load' }); } catch (e) {}
      let L = null;
      const t0 = Date.now();
      while (Date.now() - t0 < 6000) {
        L = await h.eval(() => { const tf = window.__tf; return (tf && tf.light) ? tf.light() : null; });
        if (L) break;
        await h.wait(300);
      }
      if (!L) return 'no light-path report from the game (__tf.light is missing)';
      if (!L.coarse) return 'this touch viewport is not detected as a touch device - the light path never engages';
      if (!(L.level >= 2)) return 'a touch device boots at quality level ' + L.level + ' - it must START on the light path (level 2), not earn it after seconds of struggle';
      if (L.shadows !== false) return 'shadows are ON for a touch device - the STORE-READY light path has them off';
      if (L.aa !== false) return 'anti-aliasing is ON for a touch device - the STORE-READY light path has it off';
      return true;
    }
  }
  ,{
    id: 'play-relay-staggered-start-and-blocks',
    ask: "JOB G-83 (owner 3.png): the 4x100 relay must start at the REAL staggered relay start - never a line-up under the FINISH banner - and every lane has starting blocks",
    async test(page, h) {
      const navTo = (matchText) => h.eval((mt) => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          if (document.body.classList.contains('playing') && e) { clearInterval(iv); res('in'); return; }
          const click = id => { const b = document.getElementById(id); if (b) b.click(); };
          if (on && on.id === 'menu') click('bFree');
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.toLowerCase().includes(mt)); if (b) b.click(); }
          else if (on && on.id === 'card') click('bCardStart');
          else if (on && on.id === 'results') click('bResMenu');
          else if (on && on.id === 'career') click('bCareerBack');
          if (++n > 110) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
        }, 140);
      }), matchText);
      const nav = await navTo('relay');
      if (nav !== 'in') return 'could not start the relay: ' + nav;
      await h.wait(700);
      const s = await h.eval(() => window.__tf.relayStart ? window.__tf.relayStart() : null);
      if (!s) return 'no relay start report from the game (__tf.relayStart is missing)';
      if (s.blocks !== 8) return 'the relay start shows ' + s.blocks + ' starting blocks - every one of the 8 lanes must have blocks';
      if (!s.placed) return 'the blocks are not sitting on the staggered start marks of their lanes';
      if (!(s.playerArc >= 15)) return "the player's relay start is only " + s.playerArc + 'm of arc from the finish line - the staggered start must move the field off the finish line (the player starts ~23m around the bend), never under the FINISH banner';
      return true;
    }
  }
  ,{
    id: 'play-races-start-on-the-line-together',
    ask: "JOB G-83 (owner 2.png): EVERY race starts with ALL runners on the start line together - nobody ahead of the line and nobody already running when the gun goes",
    async test(page, h) {
      const check = (id) => h.eval((a) => {
        const X = window.__tf.engines();
        const e = a === '1500m' ? X.distance(X.EV_BY_ID[a], X.freeRivals()) : X.sprint(X.EV_BY_ID[a], X.freeRivals());
        const line = e.r.pos;
        let bad = '';
        e.ai.forEach((r, i) => { if (r.pos !== line) bad = 'rival ' + (i + 2) + ' starts at ' + r.pos + 'm but the line is ' + line + 'm - the field must start together'; if (r.speed !== 0) bad = 'rival ' + (i + 2) + ' is already moving at ' + r.speed + ' m/s before the gun'; });
        if (bad) return bad;
        let steps = 0, moved = '';
        while (e.phase !== 'run' && steps < 400) { e.update(1 / 60); steps++; e.ai.forEach((r, i) => { if (r.pos !== line && !moved) moved = 'rival ' + (i + 2) + ' moved to ' + r.pos + 'm before GO (phase ' + e.phase + ')'; }); }
        if (moved) return moved;
        if (e.phase !== 'run') return a + ': the race never reached GO';
        const spread = Math.max(...e.ai.map(r => Math.abs(r.pos - e.r.pos)));
        if (spread > 0.001) return 'at GO the field is already spread by ' + spread.toFixed(2) + 'm in the ' + a + ' - everyone must be on the line together';
        return true;
      }, id);
      for (const id of ['1500m', '100m']) { const r = await check(id); if (r !== true) return r; }
      return true;
    }
  }
  ,{
    id: 'play-steeplechase-barriers-span-track-ai-jump',
    ask: "JOB G-83 (owner 5.png): steeplechase - every barrier is ONE barrier across the whole track (not a hurdle in the player's lane only), and the AI runners jump them too",
    async test(page, h) {
      const navTo = (matchText) => h.eval((mt) => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          if (document.body.classList.contains('playing') && e) { clearInterval(iv); res('in'); return; }
          const click = id => { const b = document.getElementById(id); if (b) b.click(); };
          if (on && on.id === 'menu') click('bFree');
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.toLowerCase().includes(mt)); if (b) b.click(); }
          else if (on && on.id === 'card') click('bCardStart');
          else if (on && on.id === 'results') click('bResMenu');
          else if (on && on.id === 'career') click('bCareerBack');
          if (++n > 110) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
        }, 140);
      }), matchText);
      const nav = await navTo('steeplechase');
      if (nav !== 'in') return 'could not start the steeplechase: ' + nav;
      await h.wait(700);
      const b = await h.eval(() => { const tf = window.__tf; const e = tf.eng(); return { probe: tf.barriers ? tf.barriers() : null, want: e && e.hurdles ? e.hurdles.length : 0 }; });
      if (!b.probe) return 'no barrier report from the game (__tf.barriers is missing)';
      if (!(b.want >= 5)) return 'the steeplechase engine has only ' + b.want + ' barriers';
      if (b.probe.count !== b.want) return 'the track shows ' + b.probe.count + ' barriers but the race has ' + b.want + ' - every barrier must be on the track';
      if (!(b.probe.width >= 9.5)) return 'the barriers are only ' + b.probe.width + 'm wide - a steeplechase barrier spans the whole track (~10.6m), not one lane';
      if (!(b.probe.height > 0.85 && b.probe.height < 0.96)) return 'the barrier beam tops out at ' + b.probe.height + 'm - a steeplechase barrier is 0.914m high';
      const sim = await h.eval(() => {
        const X = window.__tf.engines();
        const e = X.distance(X.EV_BY_ID['steeple'], X.freeRivals());
        const seen = e.ai.map(() => e.hurdles.map(() => 0));
        let t = 0, k = 0;
        while (!e.done && t < 260) {
          t += 1 / 60;
          if (Math.floor(t * 8) !== Math.floor((t - 1 / 60) * 8)) e.stride((k ^= 1) ? 'L' : 'R');
          if (!e.r.air) { const nh = e.hurdles.find(hh => hh.x > e.r.pos); if (nh && nh.x - e.r.pos < 3.2) e.action(); }
          e.update(1 / 60);
          e.ai.forEach((a2, ai2) => { e.hurdles.forEach((hh, hi) => { if (Math.abs(a2.pos - hh.x) < 1.6 && (a2.airY || 0) > seen[ai2][hi]) seen[ai2][hi] = a2.airY || 0; }); });
        }
        return { done: e.done, seen, aiPos: e.ai.map(a => a.pos), hs: e.hurdles.map(hh => hh.x) };
      });
      if (!sim.done) return 'the steeplechase never finished in the proof run';
      for (let a = 0; a < sim.seen.length; a++) for (let hh = 0; hh < sim.hs.length; hh++) {
        if (sim.aiPos[a] > sim.hs[hh] + 2 && !(sim.seen[a][hh] > 52)) return 'steeplechase: runner ' + (a + 2) + ' ran through the barrier at ' + Math.round(sim.hs[hh]) + 'm instead of jumping it (best height near it: ' + Math.round(sim.seen[a][hh]) + ') - the AI must jump the barriers too';
      }
      return true;
    }
  }

  ,{
    id: 'tester-hurdle-height-400m',
    ask: 'TESTER (G-56): real sizes - the 400m hurdles stand 0.914 m high like real ones (REALITY.md: real sizes in metres, within 15%)',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let nav = null;
      for (let att = 0; att < 3 && nav === null; att++) {
        try { nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
          if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '400m Hurdles'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
          else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
          if (++n > 90) { clearInterval(iv); res('stuck'); }
        }, 150);
      })); } catch (e) { await h.wait(1200); }
      }
      if (nav !== 'racing') return 'could not start the 400m Hurdles: ' + nav;
      let m = null;
      for (let i = 0; i < 10 && !m; i++) {
        m = await h.eval(() => {
          const rigs = window.__tf.rigs(); if (!rigs || !rigs.length || !rigs[0].group) return null;
          let root = rigs[0].group; while (root.parent) root = root.parent;
          let found = null;
          root.traverse(o => {
            if (found || !o.isInstancedMesh || !o.count) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            const b = o.geometry.boundingBox, w = b.max.x - b.min.x, hh = b.max.y - b.min.y;
            if (w > 1.0 && w < 1.4 && hh > 0.5 && hh < 1.5) found = { count: o.count, w: +w.toFixed(3), h: +hh.toFixed(3) };
          });
          return found;
        }).catch(() => null);
        if (!m) await h.wait(500);
      }
      if (!m) return 'no hurdle mesh found in the 400m Hurdles race';
      const real = 0.914;
      if (Math.abs(m.h - real) / real > 0.15) return 'the 400m hurdles are ' + m.h + ' m tall in the game - real 400m hurdles are 0.914 m, so they are ' + Math.round((m.h / real - 1) * 100) + '% too tall (outside the 15% REALITY band)';
      return true;
    }
  }
  ,{
    id: 'tester-hurdle-height-300m',
    ask: 'TESTER (G-56): real sizes - the 300m hurdles stand 0.914 m high like real ones (REALITY.md: real sizes in metres, within 15%)',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let nav = null;
      for (let att = 0; att < 3 && nav === null; att++) {
        try { nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
          if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '300m Hurdles'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
          else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
          if (++n > 90) { clearInterval(iv); res('stuck'); }
        }, 150);
      })); } catch (e) { await h.wait(1200); }
      }
      if (nav !== 'racing') return 'could not start the 300m Hurdles: ' + nav;
      let m = null;
      for (let i = 0; i < 10 && !m; i++) {
        m = await h.eval(() => {
          const rigs = window.__tf.rigs(); if (!rigs || !rigs.length || !rigs[0].group) return null;
          let root = rigs[0].group; while (root.parent) root = root.parent;
          let found = null;
          root.traverse(o => {
            if (found || !o.isInstancedMesh || !o.count) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            const b = o.geometry.boundingBox, w = b.max.x - b.min.x, hh = b.max.y - b.min.y;
            if (w > 1.0 && w < 1.4 && hh > 0.5 && hh < 1.5) found = { count: o.count, w: +w.toFixed(3), h: +hh.toFixed(3) };
          });
          return found;
        }).catch(() => null);
        if (!m) await h.wait(500);
      }
      if (!m) return 'no hurdle mesh found in the 300m Hurdles race';
      const real = 0.914;
      if (Math.abs(m.h - real) / real > 0.15) return 'the 300m hurdles are ' + m.h + ' m tall in the game - real 300m hurdles are 0.914 m, so they are ' + Math.round((m.h / real - 1) * 100) + '% too tall (outside the 15% REALITY band)';
      return true;
    }
  }
  ,{
    id: 'tester-hurdle-height-100m',
    ask: 'TESTER (G-56): real sizes - the 100m hurdles stand 0.838 m high like real ones (REALITY.md: real sizes in metres, within 15%)',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let nav = null;
      for (let att = 0; att < 3 && nav === null; att++) {
        try { nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
          if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '100m Hurdles'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
          else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
          if (++n > 90) { clearInterval(iv); res('stuck'); }
        }, 150);
      })); } catch (e) { await h.wait(1200); }
      }
      if (nav !== 'racing') return 'could not start the 100m Hurdles: ' + nav;
      let m = null;
      for (let i = 0; i < 10 && !m; i++) {
        m = await h.eval(() => {
          const rigs = window.__tf.rigs(); if (!rigs || !rigs.length || !rigs[0].group) return null;
          let root = rigs[0].group; while (root.parent) root = root.parent;
          let found = null;
          root.traverse(o => {
            if (found || !o.isInstancedMesh || !o.count) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            const b = o.geometry.boundingBox, w = b.max.x - b.min.x, hh = b.max.y - b.min.y;
            if (w > 1.0 && w < 1.4 && hh > 0.5 && hh < 1.5) found = { count: o.count, w: +w.toFixed(3), h: +hh.toFixed(3) };
          });
          return found;
        }).catch(() => null);
        if (!m) await h.wait(500);
      }
      if (!m) return 'no hurdle mesh found in the 100m Hurdles race';
      const real = 0.838;
      if (Math.abs(m.h - real) / real > 0.15) return 'the 100m hurdles are ' + m.h + ' m tall in the game - real 100m hurdles are 0.838 m, so they are ' + Math.round((m.h / real - 1) * 100) + '% too tall (outside the 15% REALITY band)';
      return true;
    }
  }
  ,{
    id: 'tester-portrait-menu-fits-screen',
    ask: 'TESTER (G-105): mobile layout - on an upright phone (390x844) every main-menu button sits on the screen and can be tapped (DONE.md section 3: no interactive element off-screen, in portrait too)',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } return true; }).catch(() => {});
      await page.setViewportSize({ width: 390, height: 844 });
      await h.eval(() => { location.reload(); return true; }).catch(() => {});
      await h.wait(2000);
      let meas = null;
      for (let i = 0; i < 16 && !meas; i++) {
        meas = await h.eval(() => {
          const on = document.querySelector('#menu.screen.on');
          if (!on) return null;
          const bs = [...on.querySelectorAll('button')].filter(b => b.offsetParent !== null);
          if (!bs.length) return null;
          return bs.map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 16), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
        }).catch(() => null);
        if (!meas) await h.wait(500);
      }
      await page.setViewportSize({ width: 844, height: 390 });
      if (!meas) return 'the main menu never appeared on an upright phone (390x844)';
      const off = meas.filter(b => b.x < -1 || b.y < -1 || b.x + b.w > 391 || b.y + b.h > 845);
      if (off.length) return 'on an upright phone (390x844) ' + off.length + ' of ' + meas.length + ' main-menu buttons are off the screen (' + off.slice(0, 3).map(b => b.t + ' at x ' + b.x).join(', ') + ') - a player holding the phone upright cannot tap FREE PLAY, CAREER MODE or TOURNAMENT (DONE.md: no interactive element off-screen in portrait)';
      return true;
    }
  }
  ,{
    id: 'tester-menu-buttons-44px',
    ask: 'TESTER (G-105): controls - every main-menu button is at least the 44x44 CSS px touch target DONE.md section 2 asks for',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await page.setViewportSize({ width: 844, height: 390 });
      await h.wait(2000);
      let meas = null;
      for (let i = 0; i < 16 && !meas; i++) {
        meas = await h.eval(() => {
          const on = document.querySelector('#menu.screen.on');
          if (!on) return null;
          const bs = [...on.querySelectorAll('button')].filter(b => b.offsetParent !== null);
          if (!bs.length) return null;
          return bs.map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 16), w: Math.round(r.width), h: Math.round(r.height) }; });
        }).catch(() => null);
        if (!meas) await h.wait(500);
      }
      if (!meas) return 'the main menu never appeared';
      const small = meas.filter(b => b.w < 44 || b.h < 44);
      if (small.length) return 'the main-menu buttons are smaller than the 44x44 touch target in DONE.md: ' + small.slice(0, 4).map(b => b.t + ' is ' + b.w + 'x' + b.h).join(', ') + ' (' + small.length + ' of ' + meas.length + ' menu buttons under 44 px, all of them in height)';
      return true;
    }
  }
  ,{
    id: 'play-10000m-field-breaks-to-lane-1',
    ask: "JOB G-83 (owner 4.png): in the 10,000m, after the start the WHOLE field (the player too) moves to lane 1, like a real distance race - nobody runs the whole race alone in an outer lane",
    async test(page, h) {
      const navTo = (matchText) => h.eval((mt) => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          if (document.body.classList.contains('playing') && e) { clearInterval(iv); res('in'); return; }
          const click = id => { const b = document.getElementById(id); if (b) b.click(); };
          if (on && on.id === 'menu') click('bFree');
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.toLowerCase().includes(mt)); if (b) b.click(); }
          else if (on && on.id === 'card') click('bCardStart');
          else if (on && on.id === 'results') click('bResMenu');
          else if (on && on.id === 'career') click('bCareerBack');
          if (++n > 110) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
        }, 140);
      }), matchText);
      const nav = await navTo('10,000');
      if (nav !== 'in') return 'could not start the 10,000m: ' + nav;
      let lanes = null;
      const t0 = Date.now();
      while (Date.now() - t0 < 9000) {
        lanes = await h.eval(() => { const e = window.__tf.eng(); return (e && e._lanes) ? { player: e._lanes.player, ai: e._lanes.ai.slice(), phase: e.phase } : null; });
        if (lanes && lanes.phase === 'run') break;
        await h.wait(300);
      }
      if (!lanes) return 'the 10,000m draw never reported the field lanes';
      if (Math.abs(lanes.player - 3) > 0.35) return 'at the start the player should be in his own lane (3), drawn lane is ' + lanes.player.toFixed(2);
      await h.eval(() => { const e = window.__tf.eng(); e.r.pos = e.liveFrom + 160; e.ai.forEach(a => { a.pos = Math.max(a.pos, e.liveFrom + 160); }); return true; });
      let after = null;
      const t1 = Date.now();
      while (Date.now() - t1 < 9000) {
        after = await h.eval(() => { const e = window.__tf.eng(); return e._lanes ? { player: e._lanes.player, ai: e._lanes.ai.slice() } : null; });
        if (after && after.player <= 0.05 && after.ai.every(x => x <= 0.05)) break;
        await h.wait(300);
      }
      if (!after) return 'the lanes report vanished after the start';
      if (!(after.player <= 0.05)) return '160m after the start the player is still drawn in lane ' + after.player.toFixed(2) + ' - the field must break to lane 1';
      for (let i = 0; i < after.ai.length; i++) if (!(after.ai[i] <= 0.05)) return '160m after the start rival ' + (i + 2) + ' is still drawn in lane ' + after.ai[i].toFixed(2) + ' - everyone moves to lane 1';
      return true;
    }
  }
  ,{
    id: 'play-career-results-event-column-and-clock',
    ask: "JOB G-83 (owner 1.png): the career meet results table lists the meet's EVENTS so its column must say EVENT (not ATHLETE), and the big time on the results screen must be the same time the race clock showed at the finish",
    async test(page, h) {
      try { await page.reload({ waitUntil: 'load' }); } catch (e) {}
      await h.wait(2500);
      const out = await h.eval(() => new Promise(res => {
        let n = 0, clockAtFinish = null;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          if (clockAtFinish === null && e && e.done) clockAtFinish = e.time;
          if (on && on.id === 'results' && clockAtFinish !== null) {
            clearInterval(iv);
            const th = document.querySelector('#resBoard table tr th:nth-child(2)');
            const mark = (document.getElementById('resMark') || {}).textContent || '';
            res({ header: th ? th.textContent.trim() : '', mark, clock: clockAtFinish });
            return;
          }
          const click = id => { const b = document.getElementById(id); if (b) b.click(); };
          if (document.body.classList.contains('playing') && e && !e.done && e.phase === 'run') {
            if (e.stride) { e.stride('L'); e.stride('R'); }
            if (e.r && e.dist) e.r.pos = Math.min(e.dist - 0.2, e.r.pos + e.dist * 0.06);
          }
          else if (on && on.id === 'menu') click('bCareer');
          else if (on && on.id === 'career') click('bCareerMeet');
          else if (on && on.id === 'card') click('bCardStart');
          if (++n > 160) { clearInterval(iv); res({ stuck: on ? on.id : 'none', clock: clockAtFinish }); }
        }, 150);
      }));
      if (out.stuck) return 'the career results proof stalled at ' + out.stuck;
      if (out.header !== 'EVENT') return 'the career meet results column says "' + out.header + '" but the rows are the meet events - it must say EVENT';
      const tok = (out.mark || '').trim().split(/\s+/)[0];
      const parts = tok.split(':');
      const shown = parts.length === 2 ? (parseFloat(parts[0]) * 60 + parseFloat(parts[1])) : parseFloat(parts[0]);
      if (!isFinite(shown)) return 'could not read a time on the results screen ("' + out.mark + '")';
      if (Math.abs(shown - out.clock) > 0.06) return 'the results screen shows ' + tok + ' but the race clock at the finish read ' + out.clock.toFixed(2) + ' - they must be the same time';
      return true;
    }
  },
  {
    id: 'play-hurdles-set-in-every-lane',
    ask: 'G-39/G-43 fix (owner): hurdle races need hurdles in EVERY lane - a hurdle stands in front of every runner, not only in the player\'s lane',
    async test(page, h) {
      // Clear driver intervals earlier tests installed (suite hygiene).
      await h.eval(() => { ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv'].forEach(k => { try { clearInterval(window[k]); } catch (e) {} try { delete window[k]; } catch (e) {} }); return true; });
      // Reach the 110m hurdles through the game's own buttons.
      const nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          n++;
          const tf = window.__tf;
          const e = tf && tf.eng && tf.eng();
          if (e && e.ev && e.ev.id === '110h') { clearInterval(iv); res('in'); return; }
          if (n > 130) { clearInterval(iv); res('stuck'); return; }
          const click = id => { const b = document.getElementById(id); if (b && b.offsetParent !== null) { b.click(); return true; } return false; };
          const on = document.querySelector('.screen.on'); const scr = on ? on.id : '';
          if (scr === 'results') { if (!click('bResMenu')) click('bResNext'); return; }
          if (scr === 'career') { click('bCareerBack'); return; }
          if (scr === 'card') { click('bCardStart'); return; }
          if (scr === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => /110m Hurdles/i.test(x.textContent)); if (b) b.click(); return; }
          if (scr === 'menu') { click('bFree'); return; }
        }, 120);
      }));
      if (nav !== 'in') return 'the 110m hurdles never loaded (nav: ' + nav + ')';
      const hv = await h.eval(() => (window.__tf.hurdles ? window.__tf.hurdles() : null));
      if (!hv) return 'the game exposes no hurdle count - the every-lane hurdles are not in this build';
      if (hv.count !== 80 || hv.placed !== 80) return 'only ' + hv.placed + ' hurdles are set for the race (mesh shows ' + hv.count + ') - 10 hurdles in each of the 8 lanes = 80; the other lanes are empty';
      if (hv.distinct !== 80) return 'the 80 hurdles are not at 80 different spots (' + hv.distinct + ' distinct) - they must stand one per lane per hurdle, not stacked in one lane';
      return true;
    },
  }
  ,{
    id: 'play-portrait-menu-buttons-on-screen',
    ask: 'G-122: on an upright phone (390x844) every main-menu button is on the screen and the far buttons can really be tapped',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } return true; }).catch(() => {});
      await page.setViewportSize({ width: 390, height: 844 });
      await h.eval(() => { location.reload(); return true; }).catch(() => {});
      await h.wait(2000);
      let meas = null;
      for (let i = 0; i < 16 && !meas; i++) {
        meas = await h.eval(() => {
          const on = document.querySelector('#menu.screen.on');
          if (!on) return null;
          const bs = [...on.querySelectorAll('button')].filter(b => b.offsetParent !== null);
          if (bs.length < 9) return null;
          return bs.map(b => { const r = b.getBoundingClientRect(); return { id: b.id, t: b.textContent.trim().slice(0, 16), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
        }).catch(() => null);
        if (!meas) await h.wait(500);
      }
      if (!meas) { await page.setViewportSize({ width: 844, height: 390 }); return 'the main menu never appeared on an upright phone (390x844)'; }
      const off = meas.filter(b => b.x < -1 || b.y < -1 || b.x + b.w > 391 || b.y + b.h > 845);
      if (off.length) { await page.setViewportSize({ width: 844, height: 390 }); return 'G-122: ' + off.length + ' of ' + meas.length + ' main-menu buttons are off-screen on an upright phone (' + off.slice(0, 3).map(b => b.t + ' at x ' + b.x + ', y ' + b.y).join(', ') + ')'; }
      const bests = meas.find(b => b.id === 'bBests');
      if (!bests) { await page.setViewportSize({ width: 844, height: 390 }); return 'G-122: the BESTS button was not found on the menu'; }
      await page.touchscreen.tap(Math.round(bests.x + bests.w / 2), Math.round(bests.y + bests.h / 2));
      await h.wait(900);
      const opened = await h.eval(() => { const s = document.querySelector('#bests.screen.on'); return !!s; }).catch(() => false);
      await page.setViewportSize({ width: 844, height: 390 });
      await h.eval(() => { location.reload(); return true; }).catch(() => {});
      await h.wait(1200);
      if (!opened) return 'G-122: BESTS is on the screen in portrait but tapping it did not open the bests screen';
      return true;
    }
  }
  ,{
    id: 'play-racers-start-on-the-track',
    ask: 'owner 2026-10-21: "Why are the racers so far back into the wall stands" - at the start of a straight race (110m hurdles) every racer stands ON the painted track in his own lane, never out past the end of the straight in the stands',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } return true; }).catch(() => {});
      await h.eval(() => { location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let started = false;
      for (let i = 0; i < 40 && !started; i++) {
        started = await h.eval(() => {
          const tf = window.__tf; if (!tf) return false;
          const e = tf.eng && tf.eng();
          if (e && e.ev) return e.ev.id === '110h';
          const vis = id => { const el = document.getElementById(id); return el && el.offsetParent !== null; };
          if (vis('bCardStart')) { document.getElementById('bCardStart').click(); return false; }
          const gb = [...document.querySelectorAll('#gridEvents button')].find(x => /110m Hurdles/i.test(x.textContent));
          if (gb) { gb.click(); return false; }
          if (vis('bFree')) { document.getElementById('bFree').click(); return false; }
          return false;
        }).catch(() => false);
        if (!started) await h.wait(500);
      }
      if (!started) return 'the 110m hurdles never started';
      let meas = null;
      for (let i = 0; i < 20 && !meas; i++) {
        meas = await h.eval(() => {
          const R = window.__reality, tf = window.__tf;
          if (!R || !tf || !tf.lanePoint) return null;
          const groups = [];
          if (R.player && R.player.visible) groups.push(R.player);
          (R.others || []).forEach(g => { if (g.visible) groups.push(g); });
          if (groups.length < 6) return null;
          return groups.map(g => {
            const p = g.position; let best = 1e9;
            for (let l = 0; l < 8; l++) for (let s = 0; s < 400; s += 1) {
              const q = tf.lanePoint(s, l);
              const d = Math.hypot(q.x - p.x, q.z - p.z);
              if (d < best) best = d;
            }
            return Math.round(best * 100) / 100;
          });
        }).catch(() => null);
        if (!meas) await h.wait(500);
      }
      if (!meas) return 'the racers never loaded at the 110m hurdles start';
      const off = meas.filter(d => d > 1.3);
      if (off.length) return off.length + ' of ' + meas.length + ' racers stand off the painted track at the start (worst ' + Math.max.apply(null, meas) + ' m from the nearest lane) - the field starts out past the end of the straight, in the stands';
      return true;
    }
  }
,{
    id: 'never-g-122-p1',
    ask: 'NEVER (G-122): the 400m and 300m hurdles stand 0.914 m high like real ones (the robot FAIL lines of G-122 round 1)',
    async test(page, h) {
      const measure = async (evName) => {
        await h.eval(() => { for (const k of ['__drv','__tfdrv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
        await h.wait(1500);
        // h.eval ships function SOURCE: the event name is baked into the source string below, never closed over
        const navFn = eval(`() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '${evName}'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            if (++n > 90) { clearInterval(iv); res('stuck'); }
          }, 150);
        })`);
        let nav = null;
        for (let att = 0; att < 3 && nav === null; att++) {
          try { nav = await h.eval(navFn); } catch (e) { await h.wait(1200); }
        }
        if (nav !== 'racing') return { err: 'could not start ' + evName + ': ' + nav };
        let m = null;
        for (let i = 0; i < 10 && !m; i++) {
          m = await h.eval(() => {
            const rigs = window.__tf.rigs(); if (!rigs || !rigs.length || !rigs[0].group) return null;
            let root = rigs[0].group; while (root.parent) root = root.parent;
            let found = null;
            root.traverse(o => {
              if (found || !o.isInstancedMesh || !o.count) return;
              if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
              const b = o.geometry.boundingBox, w = b.max.x - b.min.x, hh = b.max.y - b.min.y;
              if (w > 1.0 && w < 1.4 && hh > 0.5 && hh < 1.5) found = { count: o.count, h: +hh.toFixed(3) };
            });
            return found;
          }).catch(() => null);
          if (!m) await h.wait(500);
        }
        if (!m) return { err: 'no hurdle mesh found in the ' + evName + ' race' };
        return m;
      };
      const a = await measure('400m Hurdles');
      if (a.err) return a.err;
      if (Math.abs(a.h - 0.914) / 0.914 > 0.15) return 'the 400m hurdles are ' + a.h + ' m tall - real 400m hurdles are 0.914 m (G-122 round 1)';
      const b = await measure('300m Hurdles');
      if (b.err) return b.err;
      if (Math.abs(b.h - 0.914) / 0.914 > 0.15) return 'the 300m hurdles are ' + b.h + ' m tall - real 300m hurdles are 0.914 m (G-122 round 1)';
      return true;
    }
  }
,{
    id: 'never-g-139-p1',
    ask: 'NEVER (G-139): every main-menu button is at least the 44x44 CSS px touch target (DONE.md section 2)',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv','__tfdrv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await page.setViewportSize({ width: 844, height: 390 });
      await h.wait(2000);
      let meas = null;
      for (let i = 0; i < 16 && !meas; i++) {
        meas = await h.eval(() => {
          const on = document.querySelector('#menu.screen.on');
          if (!on) return null;
          const bs = [...on.querySelectorAll('button')].filter(b => b.offsetParent !== null);
          if (!bs.length) return null;
          return bs.map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 16), w: Math.round(r.width), h: Math.round(r.height) }; });
        }).catch(() => null);
        if (!meas) await h.wait(500);
      }
      if (!meas) return 'the main menu never appeared';
      const small = meas.filter(b => b.w < 44 || b.h < 44);
      if (small.length) return 'menu buttons under the 44x44 touch target: ' + small.map(b => b.t + ' is ' + b.w + 'x' + b.h).join(', ');
      return true;
    }
  }
,{
    id: 'never-g-139-p2',
    ask: 'NEVER (G-139): feet do not sink into the ground - REALITY sampling at the menu (12 samples, go(true)) finds no more than 20% of foot readings more than 5 cm under',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv','__tfdrv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      let ready = false;
      for (let i = 0; i < 30 && !ready; i++) { ready = await h.eval(() => !!(window.__reality && window.__reality.player)).catch(() => false); if (!ready) await h.wait(1000); }
      if (!ready) return 'the REALITY player never loaded';
      const gaps = await h.eval(() => new Promise(res => {
        const R = window.__reality; const out = [];
        try { R.go && R.go(true); } catch (e) {}
        let n = 0;
        const iv = setInterval(() => {
          try {
            const P = R.player;
            if (P) {
              for (const c of R.contact) {
                if (!c.__soleIdx) {
                  const ids = new Set(); c.traverse(x => { if (x.isBone) ids.add(x.uuid); });
                  const list = [];
                  P.traverse(m => {
                    if (!m.isSkinnedMesh || !m.skeleton) return;
                    const bi = m.skeleton.bones.map((bn, i2) => ids.has(bn.uuid) ? i2 : -1).filter(x => x >= 0);
                    if (!bi.length) return;
                    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, vs = [];
                    for (let i2 = 0; i2 < si.count; i2++) { let w = 0; for (let k = 0; k < 4; k++) if (bi.includes(si.getComponent(i2, k))) w += sw.getComponent(i2, k); if (w > 0.5) vs.push(i2); }
                    const step = Math.max(1, Math.ceil(vs.length / 500));
                    list.push({ m, vs: vs.filter((_, i2) => i2 % step === 0) });
                  });
                  c.__soleIdx = list;
                }
                let sole = null; const wp = new (c.position.constructor)(); c.getWorldPosition(wp);
                for (const e of c.__soleIdx) { if (!e.m.visible) continue; const v = wp.clone(); for (const i2 of e.vs) { e.m.getVertexPosition(i2, v); e.m.localToWorld(v); if (sole == null || v.y < sole) sole = v.y; } }
                if (sole != null) out.push(+sole.toFixed(3));
              }
            }
          } catch (e) {}
          if (++n >= 12) { clearInterval(iv); try { R.go && R.go(false); } catch (e) {} res(out); }
        }, 400);
      })).catch(() => null);
      if (!gaps || gaps.length < 12) return 'too few foot readings to judge the sink (' + (gaps ? gaps.length : 0) + ')';
      // G-139 round 1: the robot also samples the player STANDING (idle clip at the marks,
      // the SET crouch) - those clips ground low too, so sample a standing 100m start as well.
      const nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
          if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '100m'); if (b) b.click(); else { clearInterval(iv); res('no event'); } }
          else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
          if (++n > 90) { clearInterval(iv); res('stuck'); }
        }, 150);
      })).catch(() => null);
      if (nav !== 'racing') return 'could not start the 100m to sample the standing start: ' + nav;
      const gaps2 = await h.eval(() => new Promise(res => {
        const R = window.__reality; const out = [];
        let n = 0;
        const iv = setInterval(() => {
          try {
            const P = R.player;
            if (P) {
              for (const c of R.contact) {
                // the race start rebuilds the player rig, so the menu-cached index is gone:
                // build the sole index on THESE bones when missing (same scan as above).
                if (!c.__soleIdx) {
                  const ids = new Set(); c.traverse(x => { if (x.isBone) ids.add(x.uuid); });
                  const list = [];
                  P.traverse(m => {
                    if (!m.isSkinnedMesh || !m.skeleton) return;
                    const bi = m.skeleton.bones.map((bn, i2) => ids.has(bn.uuid) ? i2 : -1).filter(x => x >= 0);
                    if (!bi.length) return;
                    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight, vs = [];
                    for (let i2 = 0; i2 < si.count; i2++) { let w = 0; for (let k = 0; k < 4; k++) if (bi.includes(si.getComponent(i2, k))) w += sw.getComponent(i2, k); if (w > 0.5) vs.push(i2); }
                    const step = Math.max(1, Math.ceil(vs.length / 500));
                    list.push({ m, vs: vs.filter((_, i2) => i2 % step === 0) });
                  });
                  c.__soleIdx = list;
                }
                let sole = null; const wp = new (c.position.constructor)(); c.getWorldPosition(wp);
                for (const e of c.__soleIdx) { if (!e.m.visible) continue; const v = wp.clone(); for (let i2 = 0; i2 < e.vs.length; i2++) { e.m.getVertexPosition(e.vs[i2], v); e.m.localToWorld(v); if (sole == null || v.y < sole) sole = v.y; } }
                if (sole != null) out.push(+sole.toFixed(3));
              }
            }
          } catch (e) {}
          if (++n >= 8) { clearInterval(iv); res(out); }
        }, 400);
      })).catch(() => null);
      if (!gaps2 || gaps2.length < 6) return 'too few standing readings to judge the start-line sink (' + (gaps2 ? gaps2.length : 0) + ') - the test must sample the marks and SET, not pass blind (G-139)';
      gaps.push(...gaps2);
      // The standing readings are judged on their own pool too: on the round-0 build they
      // hide inside the clean running pool (idle stands -0.05, the SET crouch reaches -0.115).
      if (gaps2 && gaps2.length >= 8) {
        const sunk2 = gaps2.filter(g => g < -0.05).length;
        if (sunk2 > gaps2.length * 0.2) return 'feet SINK into the ground at the start line: ' + sunk2 + ' of ' + gaps2.length + ' standing readings more than 5 cm under - the idle and SET clips must ground on the track too (G-139)';
        if (Math.min(...gaps2) < -0.08) return 'a foot buries ' + Math.abs(Math.min(...gaps2)).toFixed(2) + ' m under the track at the start - the SET crouch must sit on the ground line (G-139)';
      }
      const sunk = gaps.filter(g => g < -0.05).length;
      if (sunk > gaps.length * 0.2) return 'feet SINK into the ground: ' + sunk + ' of ' + gaps.length + ' readings more than 5 cm under (worst ' + Math.min(...gaps).toFixed(2) + ' m) - G-139';
      if (Math.min(...gaps) < -0.12) return 'a foot buries ' + Math.abs(Math.min(...gaps)).toFixed(2) + ' m under the track - the stance foot must stay on the ground line (G-139)';
      return true;
    }
  },

{
    id: 'tester-hurdle-cross-plane',
    ask: 'TESTER (G-130): one board per hurdle - a hurdle is a single board facing the runner, not two full-size boards crossed at 90 degrees (the sideways copy sticks through the middle of every hurdle and shows as cross/plus shapes and extra hurdles between the real ones)',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let nav = null;
      for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
      nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
          if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '110m Hurdles'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
          else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
          if (++n > 90) { clearInterval(iv); res('stuck'); }
        }, 150);
      })).catch(() => null);
        if (nav !== 'racing') await h.wait(1200);
      }
      if (nav !== 'racing') return 'could not start the 110m Hurdles: ' + nav;
      let m = null;
      for (let i = 0; i < 10 && !m; i++) {
        m = await h.eval(() => {
          const rigs = window.__tf.rigs(); if (!rigs || !rigs.length || !rigs[0].group) return null;
          let root = rigs[0].group; while (root.parent) root = root.parent;
          let mesh = null;
          root.traverse(o => {
            if (mesh || !o.isInstancedMesh || !o.count) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            const b = o.geometry.boundingBox, w = b.max.x - b.min.x, hh = b.max.y - b.min.y;
            if (w > 1.0 && w < 1.4 && hh > 0.5 && hh < 1.5) mesh = o;
          });
          if (!mesh) return null;
          const p = mesh.geometry.attributes.position.array;
          let side = 0, total = 0;
          for (let t = 0; t + 8 < p.length; t += 9) {
            const ax = p[t], ay = p[t + 1], az = p[t + 2], bx = p[t + 3], by = p[t + 4], bz = p[t + 5], cx = p[t + 6], cy = p[t + 7], cz = p[t + 8];
            const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
            const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            const area = 0.5 * Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (area === 0) continue;
            total += area;
            if (Math.abs(nx) / (2 * area) > 0.9) side += area;
          }
          if (!total) return null;
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          const bb = mesh.geometry.boundingBox;
          return { sideShare: +(100 * side / total).toFixed(1), depth: +(bb.max.z - bb.min.z).toFixed(2) };
        }).catch(() => null);
        if (!m) await h.wait(500);
      }
      if (!m) return 'no hurdle mesh found in the 110m Hurdles race';
      if (m.sideShare > 20) return 'each hurdle is two full-size boards crossed at 90 degrees: ' + m.sideShare + '% of the hurdle surface faces sideways (geometry depth ' + m.depth + ' m, as deep as the hurdle is wide) - the sideways board sticks through the middle of every hurdle and shows as cross/plus shapes and extra hurdles between the real ones; a hurdle should be one board facing the runner';
      return true;
    }
  },{
    id: 'never-g-160-p1',
    ask: 'NEVER (G-160): one board per hurdle - a hurdle is a single board facing the runner, never two full-size boards crossed at 90 degrees',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv','__tfdrv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let nav = null;
      for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
        nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '110m Hurdles'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            if (++n > 90) { clearInterval(iv); res('stuck'); }
          }, 150);
        })).catch(() => null);
        if (nav !== 'racing') await h.wait(1200);
      }
      if (nav !== 'racing') return 'could not start the 110m Hurdles: ' + nav;
      let m = null;
      for (let i = 0; i < 10 && !m; i++) {
        m = await h.eval(() => {
          const rigs = window.__tf.rigs(); if (!rigs || !rigs.length || !rigs[0].group) return null;
          let root = rigs[0].group; while (root.parent) root = root.parent;
          let mesh = null;
          root.traverse(o => {
            if (mesh || !o.isInstancedMesh || !o.count) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            const b = o.geometry.boundingBox, w = b.max.x - b.min.x, hh = b.max.y - b.min.y;
            if (w > 1.0 && w < 1.4 && hh > 0.5 && hh < 1.5) mesh = o;
          });
          if (!mesh) return null;
          const p = mesh.geometry.attributes.position.array;
          let side = 0, total = 0;
          for (let t2 = 0; t2 + 8 < p.length; t2 += 9) {
            const ax = p[t2], ay = p[t2 + 1], az = p[t2 + 2], bx = p[t2 + 3], by = p[t2 + 4], bz = p[t2 + 5], cx = p[t2 + 6], cy = p[t2 + 7], cz = p[t2 + 8];
            const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
            const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            const area = 0.5 * Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (area === 0) continue;
            total += area;
            if (Math.abs(nx) / (2 * area) > 0.9) side += area;
          }
          if (!total) return null;
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          const bb = mesh.geometry.boundingBox;
          return { sideShare: +(100 * side / total).toFixed(1), depth: +(bb.max.z - bb.min.z).toFixed(2) };
        }).catch(() => null);
        if (!m) await h.wait(500);
      }
      if (!m) return 'no hurdle mesh found in the 110m Hurdles race';
      if (m.sideShare > 20) return 'each hurdle is two boards crossed at 90 degrees: ' + m.sideShare + '% of the hurdle surface faces sideways - one board per hurdle, facing the runner (G-160)';
      if (m.depth > 0.2) return 'the hurdle geometry is ' + m.depth + ' m deep - a single board facing the runner has no sideways copy sticking through it (G-160)';
      return true;
    }
  },
{
    id: 'never-g-169-p1',
    ask: 'NEVER (G-160): one board per hurdle - a hurdle is a single board facing the runner, never two full-size boards crossed at 90 degrees',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv','__tfdrv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let nav = null;
      for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
        nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '110m Hurdles'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            if (++n > 90) { clearInterval(iv); res('stuck'); }
          }, 150);
        })).catch(() => null);
        if (nav !== 'racing') await h.wait(1200);
      }
      if (nav !== 'racing') return 'could not start the 110m Hurdles: ' + nav;
      let m = null;
      for (let i = 0; i < 10 && !m; i++) {
        m = await h.eval(() => {
          const rigs = window.__tf.rigs(); if (!rigs || !rigs.length || !rigs[0].group) return null;
          let root = rigs[0].group; while (root.parent) root = root.parent;
          let mesh = null;
          root.traverse(o => {
            if (mesh || !o.isInstancedMesh || !o.count) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            const b = o.geometry.boundingBox, w = b.max.x - b.min.x, hh = b.max.y - b.min.y;
            if (w > 1.0 && w < 1.4 && hh > 0.5 && hh < 1.5) mesh = o;
          });
          if (!mesh) return null;
          const p = mesh.geometry.attributes.position.array;
          let side = 0, total = 0;
          for (let t2 = 0; t2 + 8 < p.length; t2 += 9) {
            const ax = p[t2], ay = p[t2 + 1], az = p[t2 + 2], bx = p[t2 + 3], by = p[t2 + 4], bz = p[t2 + 5], cx = p[t2 + 6], cy = p[t2 + 7], cz = p[t2 + 8];
            const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
            const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            const area = 0.5 * Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (area === 0) continue;
            total += area;
            if (Math.abs(nx) / (2 * area) > 0.9) side += area;
          }
          if (!total) return null;
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          const bb = mesh.geometry.boundingBox;
          return { sideShare: +(100 * side / total).toFixed(1), depth: +(bb.max.z - bb.min.z).toFixed(2) };
        }).catch(() => null);
        if (!m) await h.wait(500);
      }
      if (!m) return 'no hurdle mesh found in the 110m Hurdles race';
      if (m.sideShare > 20) return 'each hurdle is two boards crossed at 90 degrees: ' + m.sideShare + '% of the hurdle surface faces sideways - one board per hurdle, facing the runner (G-160)';
      if (m.depth > 0.2) return 'the hurdle geometry is ' + m.depth + ' m deep - a single board facing the runner has no sideways copy sticking through it (G-160)';
      return true;
    }
  },
{
    id: 'play-test-link-starts-the-event',
    ask: 'G-171 (Mac, 2026-10-22): apextrackfield.html?test=60h (any EVENTS id) opens that event in Free Play and starts it at once - no menu, no card, no story; in a hurdles event the countdown camera holds every lane\u2019s first hurdle close in frame so the owner can check the hurdles in seconds',
    async test(page, h) {
      const base = page.url().split('?')[0];
      const nav = async (url) => { for (let i = 0; i < 3; i++) { try { await page.goto(url, { waitUntil: 'load', timeout: 30000 }); return true; } catch (e) { await h.wait(1200); } } return false; };
      if (!await nav(base + '?test=60h')) return 'the test-link page would not load';
      let started = null;
      for (let i = 0; i < 40 && !started; i++) {
        started = await h.eval(() => {
          const e = window.__tf && __tf.eng();
          if (!e || !e.ev || e.ev.id !== '60h') return null;
          return { phase: e.phase, screen: (document.querySelector('.screen.on') || {}).id || null, playing: document.body.classList.contains('playing'), hurdles: __tf.hurdles() };
        }).catch(() => null);
        if (!started) await h.wait(500);
      }
      if (!started) return 'apextrackfield.html?test=60h never started the 60m Hurdles by itself (a menu or card is still in the way)';
      if (started.screen === 'menu' || started.screen === 'card' || started.screen === 'grid') return 'the test link stopped at the ' + started.screen + ' instead of starting the event';
      if (!started.playing) return 'the test link started no race (the page is not in the playing state)';
      if (!started.hurdles || started.hurdles.count !== 40 || started.hurdles.placed !== 40) return 'the 60m Hurdles should stand 5 hurdles in each of 8 lanes (40 hurdles), got ' + JSON.stringify(started.hurdles);
      const shot = await h.eval(() => new Promise(res => {
        let last = null, tries = 0;
        const cap = () => {
          try {
            const tv = __tf.throwView && __tf.throwView(); if (!tv || !tv.cam || !tv.look) return null;
            let root = window.__reality && __reality.player; if (!root) return null;
            while (root.parent) root = root.parent;
            let mesh = null;
            root.traverse(o => { if (!mesh && o.isInstancedMesh && o.count === 40) mesh = o; });
            if (!mesh) return null;
            mesh.updateMatrixWorld();
            const cvs = document.querySelector('canvas'); if (!cvs || !cvs.height) return null;
            const aspect = cvs.width / cvs.height;
            const f = 1 / Math.tan((58 * Math.PI / 180) / 2); // the game camera is PerspectiveCamera(58, W/H) in the source
            const eye = [tv.cam.x, tv.cam.y, tv.cam.z], tgt = [tv.look.x, tv.look.y, tv.look.z];
            let zx = eye[0] - tgt[0], zy = eye[1] - tgt[1], zz = eye[2] - tgt[2];
            const zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
            let xx = zz, xy = 0, xz = -zx;
            const xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xy /= xl; xz /= xl;
            const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
            const im = mesh.instanceMatrix.array, mw = mesh.matrixWorld.elements;
            const mul = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
            let cx = 0, cz = 0; const pts = [];
            for (let i2 = 0; i2 < 8; i2++) {
              const w = mul(mw, im[i2 * 16 + 12], im[i2 * 16 + 13], im[i2 * 16 + 14]);
              const dx = w[0] - eye[0], dy = w[1] - eye[1], dz = w[2] - eye[2];
              const xv = xx * dx + xy * dy + xz * dz, yv = yx * dx + yy * dy + yz * dz, zv = zx * dx + zy * dy + zz * dz;
              pts.push({ x: +((f / aspect) * xv / -zv).toFixed(2), y: +(f * yv / -zv).toFixed(2), behind: zv >= 0 });
              cx += w[0]; cz += w[2];
            }
            cx /= 8; cz /= 8;
            return { pts, dist: +Math.hypot(eye[0] - cx, eye[2] - cz).toFixed(1) };
          } catch (err) { return null; }
        };
        const iv = setInterval(() => {
          tries++;
          const e = window.__tf && __tf.eng();
          if (!e) { if (tries > 240) { clearInterval(iv); res(last); } return; }
          if (e.phase === 'marks' || e.phase === 'set') { const s = cap(); if (s) last = s; if (e.phase === 'set' && last) { clearInterval(iv); res(last); } return; }
          if (last || tries > 240) { clearInterval(iv); res(last); }
        }, 120);
      })).catch(() => null);
      if (!shot) return 'no countdown framing could be measured (the first hurdle row was never in front of the camera during marks/set)';
      const out = shot.pts.filter(p => p.behind || Math.abs(p.x) > 0.98 || Math.abs(p.y) > 0.98);
      if (out.length) return 'during the countdown ' + out.length + ' of the 8 first-row hurdles are outside the camera frame - the owner cannot see every lane\u2019s hurdle: ' + JSON.stringify(shot.pts);
      if (shot.dist > 9) return 'during the countdown the camera is ' + shot.dist + ' m from the first hurdle row - not close enough to check the hurdles';
      let ran = false;
      for (let i = 0; i < 40 && !ran; i++) {
        ran = await h.eval(() => { const e = window.__tf && __tf.eng(); return !!(e && e.phase === 'run' && e.ai && e.ai.length && e.ai[0].pos > 1); }).catch(() => false);
        if (!ran) await h.wait(500);
      }
      if (!ran) return 'the test-link race never left the start (the field is not running after the gun)';
      await nav(base);
      return true;
    }
  }
  ,{
    id: 'tester-10000m-results-match-crossing',
    mode: '10000m',
    ask: 'TESTER (G-183): 10,000m - the results order matches who actually crosses the finish line first on the track (REALITY.md: finishing order = who crossed first). The player joins the leaders with 700m to go; if he runs the live segment fastest and crosses the line first, the results must place him 1st - a rival who is still short of the line cannot be credited ahead of him with a faster total time built from his own private early pace.',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let nav = null;
      for (let attempt = 0; attempt < 3 && nav !== 'in'; attempt++) {
      nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          const e = window.__tf && window.__tf.eng();
          if (document.body.classList.contains('playing') && e && e.ev && e.ev.id === '10000m') { clearInterval(iv); res('in'); return; }
          const click = id => { const b = document.getElementById(id); if (b) b.click(); };
          if (on && on.id === 'menu') click('bFree');
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.includes('10,000')); if (b) b.click(); }
          else if (on && on.id === 'card') click('bCardStart');
          else if (on && on.id === 'results') click('bResMenu');
          if (++n > 110) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
        }, 140);
      })).catch(() => null);
      if (nav !== 'in') await h.wait(1200);
      }
      if (nav !== 'in') return 'could not start the 10,000m: ' + nav;
      const fin = await h.eval(() => {
        const e = window.__tf.eng();
        let side = 'L', last = -99, steps = 0;
        while (!e.done && steps < 30000) {
          e.update(1 / 60); steps++;
          const t = steps / 60;
          if (e.phase === 'run' && t - last >= 0.12) { e.stride(side); side = side === 'L' ? 'R' : 'L'; last = t; }
        }
        if (!e.done) return { notDone: true, pos: Math.round(e.r.pos), phase: e.phase };
        return {
          time: +e.time.toFixed(2), place: e.place,
          ai: e.ai.map(a => ({ n: a.name, tt: +a.tTarget.toFixed(1), pos: Math.round(a.pos) })),
          crossed: e.ai.filter(a => a.pos >= 10000).length
        };
      }).catch(() => null);
      if (!fin) return 'the 10,000m drive could not be measured';
      if (fin.notDone) return 'the player never finished the 10,000m (stuck at ' + fin.pos + 'm, phase ' + fin.phase + ')';
      if (fin.crossed > 0) return true;
      const best = fin.ai.reduce((a, b) => (b.pos > a.pos ? b : a), fin.ai[0]);
      const credited = fin.ai.filter(a => a.tt < fin.time).sort((a, b) => a.tt - b.tt);
      if (fin.place !== 1) return 'the player crossed the 10,000m finish line FIRST on the track (no rival reached 10000m; nearest rival ' + best.n + ' was still ' + (10000 - best.pos) + 'm short at ' + best.pos + 'm when the player finished in ' + fin.time + 's), but the results place him ' + fin.place + ' - credited ahead of him: ' + credited.map(a => a.n + ' ' + a.tt + 's').join(', ') + '. Rivals are ranked by their own private target times for the first 9300m instead of the race on the track (REALITY: finishing order matches who actually crossed first)';
      return true;
    }
  },
{
    id: 'never-g-174-p1',
    ask: 'NEVER (G-174, owner video 2026-10-22): hurdles facing the wrong way - a hurdle board front faces the approaching runner: dot(board normal, lane tangent) = -1 at every hurdle, never 0 (edge-on)',
    async test(page, h) {
      const base = page.url().split('?')[0];
      const nav = async (url) => { for (let i = 0; i < 3; i++) { try { await page.goto(url, { waitUntil: 'load', timeout: 30000 }); return true; } catch (e) { await h.wait(1200); } } return false; };
      if (!await nav(base + '?test=110h')) return 'the 110m Hurdles test-link page would not load';
      let m = null;
      for (let i = 0; i < 40 && !m; i++) {
        m = await h.eval(() => {
          const e = window.__tf && __tf.eng();
          if (!e || !e.ev || e.ev.id !== '110h') return null;
          let root = window.__reality && __reality.player; if (!root) return null;
          while (root.parent) root = root.parent;
          let mesh = null;
          root.traverse(o => { if (!mesh && o.isInstancedMesh && o.count === 80) mesh = o; });
          if (!mesh) return null;
          mesh.updateMatrixWorld();
          const im = mesh.instanceMatrix.array, mw = mesh.matrixWorld.elements;
          const mul = (mm, x, y, z) => [mm[0] * x + mm[4] * y + mm[8] * z + mm[12], mm[1] * x + mm[5] * y + mm[9] * z + mm[13], mm[2] * x + mm[6] * y + mm[10] * z + mm[14]];
          const P = [], N = [], P2 = [];
          for (let i2 = 0; i2 < 8; i2++) { P.push(mul(mw, im[i2 * 16 + 12], im[i2 * 16 + 13], im[i2 * 16 + 14])); N.push([im[i2 * 16 + 8], im[i2 * 16 + 10]]); P2.push(mul(mw, im[(i2 + 8) * 16 + 12], im[(i2 + 8) * 16 + 13], im[(i2 + 8) * 16 + 14])); }
          let best = null;
          for (let s = 0; s < 400; s += 0.5) { const lp = __tf.lanePoint(s, 3); const d = (lp.x - P[3][0]) * (lp.x - P[3][0]) + (lp.z - P[3][2]) * (lp.z - P[3][2]); if (!best || d < best.d) best = { d, tx: lp.tx, tz: lp.tz }; }
          if (!best || best.d > 4) return null;
          const tl = Math.hypot(best.tx, best.tz) || 1; const t = [best.tx / tl, best.tz / tl];
          const dots = N.map(n => { const l = Math.hypot(n[0], n[1]) || 1; return +((n[0] / l) * t[0] + (n[1] / l) * t[1]).toFixed(2); });
          return { dots };
        }).catch(() => null);
        if (!m) await h.wait(500);
      }
      if (!m) return 'no hurdle facing could be measured in the 110m Hurdles';
      const bad = m.dots.filter(d => d > -0.75);
      if (bad.length) return 'the hurdles face the wrong way: dot(board normal, lane tangent) is ' + JSON.stringify(m.dots) + ' - the board front must face the approaching runner (-1.00); 0 means the boards stand edge-on (G-174)';
      return true;
    }
  },{
id: 'never-g-193-p1',
title: 'G-193 r1: the relay PASS button works from the start of the exchange zone - the receiver is in reach when the carrier arrives, not only in the last metres',
async test(page, h) {
  const base = page.url().split('?')[0];
  await page.goto(base + '?test=relay', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  let started = false;
  for (let i = 0; i < 30 && !started; i++) {
    started = await h.eval(() => { const e = window.__tf && __tf.eng(); return !!(e && e.ev && e.ev.id === 'relay' && e.relayState); }).catch(() => false);
    if (!started) await h.wait(1500);
  }
  if (!started) return 'relay did not start from the test link';
  const out = await h.eval(() => {
    for (const n of ['__drv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { try { clearInterval(window[n]); } catch (e) {} }
    try { if (window.__reality && __reality.go) __reality.go(false); } catch (e) {}
    const e = __tf.eng();
    let side = 'L', firstOkAt = null, fumbled = false, tooFarAt80 = null;
    for (let step = 0; step < 60 * 40; step++) {
      e.update(1 / 60);
      if (e.phase === 'run' && !e.done && step % 2 === 0) { e.stride(side); side = side === 'L' ? 'R' : 'L'; }
      const st = e.relayState(); const T0 = st.teams[0];
      if (st.leg === 0 && T0.carrierPos >= 80 && T0.recvPos !== null) {
        const before = T0.exchanges;
        e.action();
        if (T0.carrierPos <= 80.5 && e.msg === 'RECEIVER TOO FAR' && tooFarAt80 === null) tooFarAt80 = +T0.carrierPos.toFixed(1);
        const st2 = e.relayState();
        if (st2.teams[0].exchanges > before) { firstOkAt = +T0.carrierPos.toFixed(1); break; }
      }
      if (st.leg >= 1) { fumbled = e.msg === 'FUMBLED EXCHANGE'; break; }
      if (e.done) break;
    }
    return { firstOkAt, fumbled, tooFarAt80 };
  });
  if (!out) return 'relay drive failed';
  if (out.fumbled) return 'the leg-1 exchange FUMBLED - the carrier ran out of the zone without the pass button ever working';
  if (out.firstOkAt === null) return 'the PASS button never exchanged in the zone';
  if (out.firstOkAt > 84) return 'PASS only started working at ' + out.firstOkAt + 'm - for most of the 20m zone the button refused (RECEIVER TOO FAR at 80m: ' + out.tooFarAt80 + ') - the owner: my player ran past the receiver, could not pass it and got stuck';
  return true;
}
},{
id: 'play-free-results-return-to-events',
title: 'OWNER 2026-10-23: after a Free Play event the results bring you back to the free play menu to pick something else, and the event menu has its BACK button at the top (to the main menu)',
async test(page, h) {
  const base = page.url().split('?')[0];
  await page.goto(base + '?test=200m', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  let started = false;
  for (let i = 0; i < 30 && !started; i++) {
    started = await h.eval(() => { const e = window.__tf && __tf.eng(); return !!(e && e.ev && e.ev.id === '200m'); }).catch(() => false);
    if (!started) await h.wait(1500);
  }
  if (!started) return 'the 200m did not start from the test link';
  await h.eval(() => {
    for (const n of ['__drv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { try { clearInterval(window[n]); } catch (e) {} }
    try { if (window.__reality && __reality.go) __reality.go(false); } catch (e) {}
    const e = __tf.eng();
    let side = 'L';
    for (let step = 0; step < 60 * 45 && !e.done; step++) {
      e.update(1 / 60);
      if (e.phase === 'run') { e.stride(side); side = side === 'L' ? 'R' : 'L'; }
    }
    return e.done;
  });
  let onResults = false;
  for (let i = 0; i < 40 && !onResults; i++) {
    onResults = await h.eval(() => { const on = document.querySelector('.screen.on'); return !!(on && on.id === 'results'); }).catch(() => false);
    if (!onResults) await h.wait(1500);
  }
  if (!onResults) return 'the results screen never appeared after the free play 200m';
  const chk = await h.eval(() => {
    const next = document.getElementById('bResNext');
    const menu = document.getElementById('bResMenu');
    const out = { nextLabel: next ? next.textContent : '', menuLabel: menu ? menu.textContent : '' };
    if (menu) menu.click();
    return out;
  });
  await h.wait(500);
  const after = await h.eval(() => { const on = document.querySelector('.screen.on'); return on ? on.id : null; }).catch(() => null);
  if (!/RETRY EVENT/.test(chk.nextLabel || '')) return 'expected the free play results (RETRY EVENT button), got next=' + chk.nextLabel;
  if (after !== 'grid') return 'after a free play event the results exit went to "' + after + '" - the owner: it must always bring you back to the free play menu (CHOOSE EVENT) to pick something else';
  const top = await h.eval(() => {
    const back = document.getElementById('bGridBack');
    const firstEv = document.querySelector('#gridEvents button');
    if (!back || !firstEv) return { ok: false, why: 'missing back or events' };
    const br = back.getBoundingClientRect(), er = firstEv.getBoundingClientRect();
    return { ok: br.top < er.top && br.top >= 0 && br.bottom <= window.innerHeight, backTop: Math.round(br.top), evTop: Math.round(er.top) };
  });
  if (!top || !top.ok) return 'the event menu BACK button is not at the top of the panel (back top=' + (top && top.backTop) + ', first event top=' + (top && top.evTop) + ') - the owner circled the top of the panel: on his phone it sits under all 29 events where it cannot be reached';
  await h.eval(() => { const b = document.getElementById('bGridBack'); if (b) b.click(); });
  await h.wait(500);
  const home = await h.eval(() => { const on = document.querySelector('.screen.on'); return on ? on.id : null; }).catch(() => null);
  if (home !== 'menu') return 'the event menu BACK button went to "' + home + '", not the main game menu';
  return true;
}
},{
id: 'play-60m-field-starts-together',
title: 'G-244 (art director): the 60m field waits on ONE start line until the player starts - no rivals racing off alone, no 7th place at 0m with the clock running',
async test(page, h) {
  const base = page.url().split('?')[0];
  await page.goto(base + '?test=60m', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  let started = false;
  for (let i = 0; i < 30 && !started; i++) {
    started = await h.eval(() => { const e = window.__tf && __tf.eng(); return !!(e && e.ev && e.ev.id === '60m' && e.ai); }).catch(() => false);
    if (!started) await h.wait(1500);
  }
  if (!started) return 'the 60m did not start from the test link';
  const held = await h.eval(() => {
    for (const n of ['__drv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { try { clearInterval(window[n]); } catch (e) {} }
    try { if (window.__reality && __reality.go) __reality.go(false); } catch (e) {}
    const e = __tf.eng();
    for (let step = 0; step < 60 * 5; step++) e.update(1 / 60);
    const rigs = __tf.rigs();
    const px = rigs[0].group.position.x, pz = rigs[0].group.position.z;
    const line = rigs.slice(0, 7).map(r => ({ vis: r.group.visible, dx: +(r.group.position.x - px).toFixed(1), dz: +(r.group.position.z - pz).toFixed(1) }));
    return { phase: e.phase, time: +e.time.toFixed(2), place: e.place, rPos: +e.r.pos.toFixed(1), aiPos: e.ai.map(a => +a.pos.toFixed(1)), line };
  });
  if (!held) return 'the held-start measurement failed';
  if (held.aiPos.some(p => p > 0.5)) return 'the field raced off without the player (rivals at ' + JSON.stringify(held.aiPos) + 'm after 5s with the player still on the line) - the robot play picture: one runner on the track, the field gone';
  if (held.place !== 1) return 'with the whole field level on the start line the HUD place reads ' + held.place + ' - the place must count only the runners on the track (all level, nobody ahead)';
  if (held.time > 0.05) return 'the race clock ran to ' + held.time + 's while the player was still on the start line at 0m';
  if (held.line.some(r => !r.vis || Math.abs(r.dx) > 2.5)) return 'not every runner stands on the one start line: ' + JSON.stringify(held.line);
  const fin = await h.eval(() => {
    const e = __tf.eng();
    let side = 'L';
    for (let step = 0; step < 60 * 45 && !e.done; step++) {
      e.update(1 / 60);
      if (e.phase === 'run') { e.stride(side); side = side === 'L' ? 'R' : 'L'; }
    }
    return { done: e.done, place: e.place, aiPos: e.ai.map(a => +a.pos.toFixed(0)) };
  });
  if (!fin || !fin.done) return 'once the player started striding the 60m never finished';
  if (fin.aiPos.some(p => p < 30)) return 'once the player started, the field did not race with him: ' + JSON.stringify(fin.aiPos);
  if (!(fin.place >= 1 && fin.place <= 7)) return 'the finishing place ' + fin.place + ' is outside the field that exists (7 runners)';
  return true;
}
},{
id: 'never-g-249-p1',
title: 'G-249 r1 (owner): jumping was too hard - the green window on the timing bar was tiny (high jump 0.10-0.22 wide, ~0.1-0.2s), the long jump angle swept at 95 deg/s and you fouled running past the line while setting it, the triple jump marker ran at 1.6/s',
async test(page, h) {
  const base = page.url().split('?')[0];
  const waitEv = async (id) => {
    for (let i = 0; i < 25; i++) {
      const ok = await h.eval((a) => { const e = window.__tf && __tf.eng(); return !!(e && e.ev && e.ev.id === a.id); }, { id }).catch(() => false);
      if (ok) return true;
      await h.wait(1200);
    }
    return false;
  };
  const clean = () => h.eval(() => {
    for (const n of ['__drv','__tfdrv2','__tfdrv3','__tfdrv4','__tfdrv5','__tfdrv6','__tfdrvF','__g68drv']) { try { clearInterval(window[n]); } catch (e) {} }
    try { if (window.__reality && __reality.go) __reality.go(false); } catch (e) {}
    return true;
  }).catch(() => false);
  // HIGH JUMP: green width + sweep speed in the bar phase
  await page.goto(base + '?test=hj', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  if (!await waitEv('hj')) return 'the high jump did not start from the test link';
  await clean();
  const hj = await h.eval(() => {
    const e = __tf.eng();
    let side = 'L', guard = 0;
    while (e.phase === 'approach' && guard++ < 800) {
      e.stride(side); side = side === 'L' ? 'R' : 'L';
      e.update(0.05);
      if (e.r.pos >= e.zoneLo && e.r.pos <= e.zoneHi) e.action();
    }
    if (e.phase !== 'bar') return { stage: 'nobar', phase: e.phase };
    const gw = e.gw;
    e.marker = 0; e.mdir = 1;
    let path = 0, prev = 0;
    for (let i = 0; i < 50; i++) { e.update(0.02); path += Math.abs(e.marker - prev); prev = e.marker; }
    return { stage: 'ok', gw: +gw.toFixed(3), rate: +path.toFixed(2) };
  });
  if (!hj || hj.stage !== 'ok') return 'the high jump never reached the timing bar (stage ' + (hj && hj.stage) + ')';
  if (hj.gw < 0.19) return 'the high jump green window is still only ' + (hj.gw * 2).toFixed(2) + ' of the bar wide - the owner: it is difficult to get in between green with the line bar (target: at least 0.40 wide)';
  if (hj.rate > 0.9) return 'the high jump timing bar still sweeps at ' + hj.rate.toFixed(2) + '/s - the green lasts about a tenth of a second (target: 0.75/s, green at least half a second)';
  // LONG JUMP: setting the angle must not foul, and the needle must be settable
  await page.goto(base + '?test=lj', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  if (!await waitEv('lj')) return 'the long jump did not start from the test link';
  await clean();
  const lj = await h.eval(() => {
    const e = __tf.eng();
    let side = 'L', guard = 0;
    while (e.phase === 'runup' && guard++ < 900) {
      e.stride(side); side = side === 'L' ? 'R' : 'L';
      e.update(0.05);
      if (e.r.pos >= 30) e.action();
      if (e.phase !== 'runup') break;
    }
    if (e.phase !== 'angle') return { stage: 'noangle', phase: e.phase, foul: e.foul };
    let path = 0, prev = e.ang;
    for (let i = 0; i < 10; i++) { e.update(0.05); path += Math.abs(e.ang - prev); prev = e.ang; }
    for (let i = 0; i < 20; i++) e.update(0.05);
    return { stage: 'ok', sweep: +path.toFixed(1), phase: e.phase, foul: e.foul, moved: +(e.r.pos - 30).toFixed(1) };
  });
  if (!lj || lj.stage !== 'ok') return 'the long jump never reached the angle phase (stage ' + (lj && lj.stage) + ')';
  if (lj.foul || lj.phase === 'mark') return 'setting the long jump angle still fouls - crossing the line while you set it ends the jump (owner: make the jump button easy, freely controlled)';
  if (lj.phase !== 'angle' && lj.phase !== 'flight') return 'the long jump left the angle phase the wrong way (phase ' + lj.phase + ')';
  if (lj.sweep > 30) return 'the long jump angle still sweeps at ' + lj.sweep.toFixed(0) + ' deg per half-second - too fast to set (target: 55 deg/s)';
  // TRIPLE JUMP: marker speed
  await page.goto(base + '?test=tj', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  if (!await waitEv('tj')) return 'the triple jump did not start from the test link';
  await clean();
  const tj = await h.eval(() => {
    const e = __tf.eng();
    let side = 'L', guard = 0;
    while (e.phase === 'runup' && guard++ < 900) {
      e.stride(side); side = side === 'L' ? 'R' : 'L';
      e.update(0.05);
      if (e.r.pos >= 30) e.action();
      if (e.phase !== 'runup') break;
    }
    if (e.phase !== 'phase') return { stage: 'nophase', phase: e.phase };
    let path = 0, prev = e.marker;
    for (let i = 0; i < 25; i++) { e.update(0.02); path += Math.abs(e.marker - prev); prev = e.marker; }
    e.marker = 0.32; const before = e.qs.length; e.action();
    const q = e.qs.length > before ? e.qs[e.qs.length - 1] : -1;
    return { stage: 'ok', rate: +path.toFixed(2), q: +q.toFixed(2) };
  });
  if (!tj || tj.stage !== 'ok') return 'the triple jump never reached its timing phases (stage ' + (tj && tj.stage) + ')';
  if (tj.rate > 0.55) return 'the triple jump marker still runs at ' + tj.rate.toFixed(2) + ' per half-second (1.6/s) - the fastest tap in the game (target: 1.0/s)';
  if (tj.q < 0.72) return 'a triple jump tap just inside the old green edge still scores only ' + tj.q.toFixed(2) + ' - the quality window was not widened with the green';
  return true;
}
},{
    id: 'tester-chk-t04',
    mode: 't04',
    ask: 'CHECKLIST T04 (G-259): the relay baton changeover zone is 30 m long (rules/trackfield.md) - the green zone markings painted on the track in the relay event must span 30 m, within 3%',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      // G-289 r1: wait for the NEW page before navigating - on a slow load the old page is still playing its race and the nav mistakes that for the target event.
      for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }

      let nav = null;
      for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
      nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          if (document.body.classList.contains('playing')) { const e = window.__tf && window.__tf.eng(); if (e && e.ev && e.ev.eng === 'relay') { clearInterval(iv); res('racing'); return; } }
          if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => /relay/i.test(x.textContent)); if (b) b.click(); else { clearInterval(iv); res('no relay button'); } }
          else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
          if (++n > 120) { clearInterval(iv); res('stuck'); }
        }, 150);
      })).catch(() => null);
        if (nav !== 'racing') await h.wait(1200);
      }
      if (nav !== 'racing') return 'could not start the relay event: ' + nav;
      let m = null;
      for (let i = 0; i < 10 && !m; i++) {
        m = await h.eval(() => {
          const e = window.__tf && window.__tf.eng(); const grp = e && e._zone;
          if (!grp || !grp.children.length) return null;
          const upm = (window.__reality && window.__reality.unitsPerMetre) || 1;
          const lens = [];
          grp.children.forEach(mesh => {
            const p = mesh.geometry.attributes.position.array;
            for (let l = 0; l < 8; l++) {
              const base = l * 10 * 3; let len = 0;
              for (let j = 0; j < 4; j++) {
                const a = base + j * 6, b = base + (j + 1) * 6;
                len += Math.hypot(p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]);
              }
              lens.push(len / upm);
            }
          });
          const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
          return { mean: +mean.toFixed(2), n: lens.length, min: +Math.min(...lens).toFixed(2), max: +Math.max(...lens).toFixed(2) };
        }).catch(() => null);
        if (!m) await h.wait(500);
      }
      if (!m) return 'no relay changeover-zone markings found in the relay event';
      if (Math.abs(m.mean - 30) / 30 > 0.03) return 'the relay changeover zone markings span ' + m.mean + ' m on average (' + m.n + ' lane strips, ' + m.min + '-' + m.max + ' m) but rules/trackfield.md says the changeover zone is 30 m long - the markings are ' + (100 * (30 - m.mean) / 30).toFixed(0) + '% short';
      return true;
    }
  }
,{
    id: 'tester-chk-t05',
    mode: 't05',
    ask: 'CHECKLIST T05 (G-260): a tailwind over +2.0 m/s means the time does not count as a record, shown as "w" (rules/trackfield.md) - the sprint results screen must show a wind reading, and a wind-aided time must carry the "w" mark instead of counting as a best',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      let nav = null;
      for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
      nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
          if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '100m'); if (b) b.click(); else { clearInterval(iv); res('no 100m button'); } }
          else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
          if (++n > 120) { clearInterval(iv); res('stuck'); }
        }, 150);
      })).catch(() => null);
        if (nav !== 'racing') await h.wait(1200);
      }
      if (nav !== 'racing') return 'could not start the 100m sprint: ' + nav;
      const driven = await h.eval(() => {
        const e = window.__tf && window.__tf.eng();
        if (!e) return null;
        let side = 0, steps = 0;
        while (!e.done && steps < 6000) {
          if (e.phase === 'run') { e.stride(side % 2 ? 'R' : 'L'); side++; }
          e.update(1 / 60);
          steps++;
        }
        return { done: e.done };
      }).catch(() => null);
      if (!driven) return 'no sprint engine found in the 100m race';
      if (!driven.done) return 'the 100m sprint never finished in game-time stepping';
      for (let w = 0; w < 10; w++) {
        const shown = await h.eval(() => {
          const on = document.querySelector('.screen.on');
          const mk = document.getElementById('resMark');
          return !!(on && on.id === 'results' && mk && mk.textContent !== '--');
        }).catch(() => false);
        if (shown) break;
        await h.wait(300);
      }
      const m = await h.eval(() => {
        const e = window.__tf && window.__tf.eng();
        const on = document.querySelector('.screen.on');
        const windKeys = Object.keys(e).filter(k => /wind/i.test(k));
        const resMark = document.getElementById('resMark') ? document.getElementById('resMark').textContent : '';
        const bodyText = document.body.innerText || '';
        const windShown = /wind/i.test(bodyText) || /[+-]\d\.\d\s*m\/s/.test(resMark);
        let bests = null;
        try { bests = localStorage.getItem('tfapex_bests'); } catch (err) {}
        return { screen: on ? on.id : null, windKeys, resMark, windShown, bests };
      }).catch(() => null);
      if (!m) return 'no sprint engine found in the 100m race';
      if (!m.windShown) return 'the game models no wind at all: the sprint engine has no wind value (' + m.windKeys.length + ' wind keys), the results screen shows "' + m.resMark + '" with no wind reading and no "w" mark, and the time was saved as a best (' + m.bests + ') - so a tailwind over +2.0 m/s (rules/trackfield.md: the time does not count as a record, shown as "w") can never apply';
      return true;
    }
  }
,
  {
      id: 'tester-10000m-mash-no-speed-exploit',
      mode: '10000m',
      ask: 'TESTER (G-200, BREAK round): 10,000m - mashing the run controls faster than any human cadence must not make the player faster. Stride input needs a rate cap: after settling into the run, 30 game-seconds of striding on EVERY tick (60/s) must not average more than 8.6 m/s (honest 0.30 s alternating cadence measured 7.56 m/s average, peak 7.97, on 2026-10-22; rivals are capped near 5.5-6.3 m/s).',
      async test(page, h) {
        await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
        await h.wait(1500);
        let nav = null;
        for (let attempt = 0; attempt < 3 && nav !== 'in'; attempt++) {
        nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            const e = window.__tf && window.__tf.eng();
            if (document.body.classList.contains('playing') && e && e.ev && e.ev.id === '10000m') { clearInterval(iv); res('in'); return; }
            const click = id => { const b = document.getElementById(id); if (b) b.click(); };
            if (on && on.id === 'menu') click('bFree');
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.includes('10,000')); if (b) b.click(); }
            else if (on && on.id === 'card') click('bCardStart');
            else if (on && on.id === 'results') click('bResMenu');
            if (++n > 110) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
          }, 140);
        })).catch(() => null);
        if (nav !== 'in') await h.wait(1200);
        }
        if (nav !== 'in') return 'could not start the 10,000m: ' + nav;
        const m = await h.eval(() => {
          const e = window.__tf.eng();
          let side = 'L', last = -99;
          // settle: 10 game-s of honest 0.30 s cadence once running
          for (let i = 0; i < 600; i++) { e.update(1 / 60); const t = i / 60; if (e.phase === 'run' && t - last >= 0.30) { e.stride(side); side = side === 'L' ? 'R' : 'L'; last = t; } }
          if (e.phase !== 'run') return { notRun: true, phase: e.phase };
          const p0 = e.r.pos;
          let peak = 0;
          // mash: stride on every tick for 30 game-s
          for (let i = 0; i < 1800; i++) { e.stride(side); side = side === 'L' ? 'R' : 'L'; e.update(1 / 60); if (e.r.speed > peak) peak = e.r.speed; }
          return { gain: +(e.r.pos - p0).toFixed(1), avg: +((e.r.pos - p0) / 30).toFixed(2), peak: +peak.toFixed(2) };
        }).catch(() => null);
        if (!m) return 'the mash measurement could not be taken';
        if (m.notRun) return 'the 10,000m never reached the run phase (phase ' + m.phase + ')';
        if (m.avg > 8.6) return 'mashing the run controls on every tick (60 strides/s) for 30 game-s moved the player ' + m.gain + 'm - an average of ' + m.avg + ' m/s, peak ' + m.peak + ' m/s - while honest 0.30 s alternating taps average 7.56 m/s and the rivals are capped near 5.5-6.3 m/s. There is no cap on stride rate, so inhuman tapping buys inhuman speed in the 10,000m (UNFAIR: the rivals obey caps the player can tap past)';
        return true;
      }
    },
  {
    id: "tester-300mh-hurdle-count",
    mode: "freeplay",
    ask: "TESTER (G-234): real sport - the 300m Hurdles has 7 hurdles per lane like the real 300m hurdles (rules/short/apextrackfield.md: every event is the REAL sport start to finish).",
    async test(page, h) {
        await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
        await h.wait(1500);
        let nav = null;
        for (let att = 0; att < 3 && nav === null; att++) {
          try { nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '300m Hurdles'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            if (++n > 90) { clearInterval(iv); res('stuck'); }
          }, 150);
        })); } catch (e) { await h.wait(1200); }
        }
        if (nav !== 'racing') return 'could not start the 300m Hurdles: ' + nav;
        let m = null;
        for (let i = 0; i < 10 && !m; i++) {
          try { m = await h.eval(() => (window.__tf && typeof window.__tf.hurdles === 'function') ? window.__tf.hurdles() : null); } catch (e) {}
          if (!m) await h.wait(400);
        }
        if (!m) return 'the 300m Hurdles never placed its hurdle mesh';
        const perLane = Math.round(m.count / 8);
        if (perLane !== 7) return 'the 300m Hurdles places ' + perLane + ' hurdles per lane (' + m.count + ' hurdle instances for 8 lanes) - the real 300m hurdles has 7 hurdles per lane (rules/short/apextrackfield.md: every event is the REAL sport start to finish)';
        return true;
      },
  },
  {
      id: 'tester-chk-t07',
      mode: 't07',
      ask: 'TESTER (G-271, checklist T07): throws get 3 attempts (plus 3 more for the top 8) - rules/trackfield.md.',
      async test(page, h) {
        await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
        await h.wait(1500);
      // G-289 r1: wait for the NEW page before navigating - on a slow load the old page is still playing its race and the nav mistakes that for the target event.
      for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }

        let nav = null;
        for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
          nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            const e = window.__tf && window.__tf.eng();
            if (document.body.classList.contains('playing') && e && e.ev && e.ev.id === 'sp') { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === 'Shot Put'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            else if (on && on.id === 'results') { const b = document.getElementById('bResMenu'); if (b) b.click(); }
            if (++n > 90) { clearInterval(iv); res('stuck'); }
          }, 150);
        })).catch(() => null);
          if (nav !== 'racing') await h.wait(1200);
        }
        if (nav !== 'racing') return 'could not start the Shot Put: ' + nav;
        const m = await h.eval(() => {
          const e = window.__tf.eng();
          let steps = 0;
          while (!e.done && steps < 20000) {
            e.update(1 / 60); steps++;
            if (e.phase === 'power' && e.power >= 0.97) e.action();
            else if (e.phase === 'angle' && e.ang >= 40.5 && e.ang <= 43.5) e.action();
          }
          if (!e.done) return { notDone: true };
          const before = e.attempts.length;
          e.action(); for (let s = 0; s < 120; s++) e.update(1 / 60);
          return { attempts: e.attempts.length, attMax: e.attMax, done: e.done, afterDone: e.attempts.length, extra: e.attempts.length - before };
        }).catch(() => null);
        if (!m) return 'the Shot Put attempt count could not be read';
        if (m.notDone) return 'the Shot Put never finished its attempts';
        if (m.attempts <= 3 && m.done) return 'the Shot Put ended after ' + m.attempts + ' attempts (attMax ' + m.attMax + ') and no athlete got 3 more attempts - rules/trackfield.md says throws get 3 attempts (plus 3 more for the top 8)';
        return true;
      }
  },{
id: 'never-g-249-p3',
title: 'G-249 r2 point 2 (owner, CHECKLIST T04): the relay baton changeover zone is 30 m long - the green zone markings painted on the track in the relay event must span 30 m, within 3% (today: 20.08 m on average)',
async test(page, h) {
  const base = page.url().split('?')[0];
  await page.goto(base + '?test=relay', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  let m = null;
  for (let i = 0; i < 30 && !m; i++) {
    m = await h.eval(() => {
      const e = window.__tf && __tf.eng();
      if (!e || !e.ev || e.ev.id !== 'relay') return null;
      const grp = e._zone;
      if (!grp || !grp.children.length) return null;
      const upm = (window.__reality && __reality.unitsPerMetre) || 1;
      const lens = [];
      grp.children.forEach(mesh => {
        const p = mesh.geometry.attributes.position.array;
        for (let l = 0; l < 8; l++) {
          const b0 = l * 10 * 3; let len = 0;
          for (let j = 0; j < 4; j++) {
            const a = b0 + j * 6, b = b0 + (j + 1) * 6;
            len += Math.hypot(p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]);
          }
          lens.push(len / upm);
        }
      });
      const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
      return { mean: +mean.toFixed(2), n: lens.length, min: +Math.min(...lens).toFixed(2), max: +Math.max(...lens).toFixed(2) };
    }).catch(() => null);
    if (!m) await h.wait(1500);
  }
  if (!m) return 'no relay changeover-zone markings found in the relay event';
  if (Math.abs(m.mean - 30) / 30 > 0.03) return 'the relay changeover zone markings span ' + m.mean + ' m on average (' + m.n + ' lane strips, ' + m.min + '-' + m.max + ' m) but rules/trackfield.md says the changeover zone is 30 m long';
  return true;
}
},
{
id: 'never-g-249-p2',
title: 'G-249 r2 point 1 (owner): runners must run with natural arm and leg motion - a real sprint animation, not posed bones (mirrors the hardened real-sprint-animation sampling: thighL range over a full cycle must reach 0.70 rad; the old 1.4s wall window read 0.43 rad on the ~3fps robot while the same clip measures 1.85+ rad over a full cycle)',
async test(page, h) {
  const base = page.url().split('?')[0];
  await page.goto(base + '?test=60m', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await h.eval(() => { if (!window.__drv) { window.__tk = false; window.__drv = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.stride && e.phase !== 'set') { e.stride(window.__tk ? 'R' : 'L'); window.__tk = !window.__tk; } }, 120); } return true; });
  const t0 = Date.now(); let best = null;
  while (Date.now() - t0 < 120000) {
    const st = await h.eval(() => { const e = window.__tf.eng(); return { pos: e && e.r ? e.r.pos : 0, pose: window.__tf.pose() }; });
    if (st.pos > 12) {
      for (const r of st.pose) {
        if (r.human && r.sf > 0.3 && /Sprint_Loop|Jog_Fwd_Loop/.test(r.clip || '')) { best = r; break; }
      }
    }
    if (best) break;
    await h.wait(160);
  }
  if (!best) return 'no runner was seen using Sprint_Loop / Jog_Fwd_Loop while racing';
  let mn = 1e9, mx = -1e9;
  for (let i = 0; i < 30; i++) {
    const p = await h.eval(() => window.__tf.pose());
    for (const r of p) if (r.human && r.sf > 0.3) { mn = Math.min(mn, r.thighL); mx = Math.max(mx, r.thighL); }
    await h.wait(250);
  }
  if (mx - mn < 0.7) return 'thigh swing too small (' + (mx - mn).toFixed(2) + ' rad) - legs are not driving';
  return true;
}
},
{
id: 'never-g-267-p1',
title: 'G-267 (owner): the live race camera never has a wall between it and the runner - the wall check ray must target the runner (its length must match the camera-to-runner distance) and 4 samples must all read clear (today the ray targets the infield centre because ox/oz are never written)',
async test(page, h) {
  const base = page.url().split('?')[0];
  await page.goto(base + '?test=60m', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await h.eval(() => { if (!window.__drv) { window.__tk = false; window.__drv = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.stride && e.phase !== 'set') { e.stride(window.__tk ? 'R' : 'L'); window.__tk = !window.__tk; } }, 120); } return true; });
  const t0 = Date.now(); let live = null;
  while (Date.now() - t0 < 120000) {
    const st = await h.eval(() => { const e = window.__tf.eng(); const rigs = window.__tf.rigs(); const rp = rigs && rigs[0] && rigs[0].group ? rigs[0].group.position : null; return { pos: e && e.r ? e.r.pos : 0, phase: e ? e.phase : null, cam: window.__tf.camPos(), rig: rp ? { x: rp.x, z: rp.z } : null, clear: window.__tf.camClear() }; });
    if (st.phase === 'run' && st.pos > 5 && st.cam && st.rig && st.clear) { live = st; break; }
    await h.wait(160);
  }
  if (!live) return 'no live race camera seen on the runner';
  const trueD = Math.hypot(live.cam.x - live.rig.x, live.cam.z - live.rig.z);
  if (Math.abs(live.clear.dist - trueD) > 2) return 'camera ray does not target the runner: ray length ' + live.clear.dist + ' m but the runner is ' + trueD.toFixed(1) + ' m from the camera';
  let seen = 0, blocked = 0;
  for (let i = 0; i < 4; i++) {
    const c = await h.eval(() => window.__tf.camClear());
    if (c) { seen++; if (!c.clear) blocked++; }
    await h.wait(400);
  }
  if (seen && blocked) return 'the live race camera had a wall between it and the runner in ' + blocked + ' of ' + seen + ' samples';
  return true;
}
},{
    id: 'never-g-267-p2',
      mode: '10000m',
      ask: 'NEVER (G-267 round 1): 10,000m - mashing the run controls faster than any human cadence must not make the player faster (tester-10000m-mash-no-speed-exploit: 30 game-s of striding on every tick must not average more than 8.6 m/s).',
      async test(page, h) {
        await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
        await h.wait(1500);
        let nav = null;
        for (let attempt = 0; attempt < 3 && nav !== 'in'; attempt++) {
        nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            const e = window.__tf && window.__tf.eng();
            if (document.body.classList.contains('playing') && e && e.ev && e.ev.id === '10000m') { clearInterval(iv); res('in'); return; }
            const click = id => { const b = document.getElementById(id); if (b) b.click(); };
            if (on && on.id === 'menu') click('bFree');
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.includes('10,000')); if (b) b.click(); }
            else if (on && on.id === 'card') click('bCardStart');
            else if (on && on.id === 'results') click('bResMenu');
            if (++n > 110) { clearInterval(iv); res('stuck:' + (on ? on.id : 'none')); }
          }, 140);
        })).catch(() => null);
        if (nav !== 'in') await h.wait(1200);
        }
        if (nav !== 'in') return 'could not start the 10,000m: ' + nav;
        const m = await h.eval(() => {
          const e = window.__tf.eng();
          let side = 'L', last = -99;
          for (let i = 0; i < 600; i++) { e.update(1 / 60); const t = i / 60; if (e.phase === 'run' && t - last >= 0.30) { e.stride(side); side = side === 'L' ? 'R' : 'L'; last = t; } }
          if (e.phase !== 'run') return { notRun: true, phase: e.phase };
          const p0 = e.r.pos;
          let peak = 0;
          for (let i = 0; i < 1800; i++) { e.stride(side); side = side === 'L' ? 'R' : 'L'; e.update(1 / 60); if (e.r.speed > peak) peak = e.r.speed; }
          return { gain: +(e.r.pos - p0).toFixed(1), avg: +((e.r.pos - p0) / 30).toFixed(2), peak: +peak.toFixed(2) };
        }).catch(() => null);
        if (!m) return 'the mash measurement could not be taken';
        if (m.notRun) return 'the 10,000m never reached the run phase (phase ' + m.phase + ')';
        if (m.avg > 8.6) return 'mashing on every tick for 30 game-s still averages ' + m.avg + ' m/s (peak ' + m.peak + ') - the distance stride rate cap is not holding (G-267 round 1)';
        return true;
}
},
{
    id: 'never-g-267-p3',
      mode: 'freeplay',
      ask: 'NEVER (G-267 round 1): the 300m Hurdles has 7 hurdles per lane like the real 300m hurdles (tester-300mh-hurdle-count).',
      async test(page, h) {
        await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
        await h.wait(1500);
        let nav = null;
        for (let att = 0; att < 3 && nav === null; att++) {
          try { nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '300m Hurdles'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            if (++n > 90) { clearInterval(iv); res('stuck'); }
          }, 150);
        })); } catch (e) { await h.wait(1200); }
        }
        if (nav !== 'racing') return 'could not start the 300m Hurdles: ' + nav;
        let m = null;
        // Robot 2026-10-24: the mesh was not placed within 10 s late in the shared-page suite - poll up to 60 s.
        for (let i = 0; i < 60 && !(m && m.count > 0); i++) {
          try { m = await h.eval(() => (window.__tf && typeof window.__tf.hurdles === 'function') ? window.__tf.hurdles() : null); } catch (e) {}
          if (!(m && m.count > 0)) await h.wait(1000);
        }
        if (!m || m.count <= 0) return 'the 300m Hurdles never placed its hurdle mesh';
        const perLane = Math.round(m.count / 8);
        if (perLane !== 7) return 'the 300m Hurdles places ' + perLane + ' hurdles per lane (' + m.count + ' hurdle instances for 8 lanes) - the real 300m hurdles has 7 (G-267 round 1)';
        return true;
}
}
,{
    id: 'never-g-289-p1',
    mode: 'relay',
    ask: 'NEVER (G-289): the relay changeover-zone markings are not found in the relay event on a slow load - the zones must paint at race start on the scene alone, not wait for the full 3D load',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      // G-289 robot lesson: reload + a fixed 1500 ms wait is not enough late in
      // the suite - early evals can still hit the dying page, whose race is
      // still playing. Wait for the NEW page (menu on, not playing, hooks live)
      // before navigating; the gate is best-effort and nav follows regardless.
      for (let i = 0; i < 120; i++) {
        const ready = await h.eval(() => {
          const on = document.querySelector('.screen.on');
          return !!(window.__tf && on && on.id === 'menu' && !document.body.classList.contains('playing'));
        }).catch(() => false);
        if (ready) break;
        await h.wait(500);
      }

      let nav = null;
      for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
      nav = await h.eval(() => new Promise(res => {
        let n = 0;
        const iv = setInterval(() => {
          const on = document.querySelector('.screen.on');
          if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
          if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
          else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => /relay/i.test(x.textContent)); if (b) b.click(); else { clearInterval(iv); res('no relay button'); } }
          else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
          if (++n > 120) { clearInterval(iv); res('stuck'); }
        }, 150);
      })).catch(() => null);
        if (nav !== 'racing') await h.wait(1200);
      }
      if (nav !== 'racing') return 'could not start the relay event: ' + nav;
      let m = null;
      for (let i = 0; i < 8 && !m; i++) {
        m = await h.eval(() => {
          const e = window.__tf && window.__tf.eng(); const grp = e && e._zone;
          if (!grp || !grp.children.length) return null;
          const upm = (window.__reality && window.__reality.unitsPerMetre) || 1;
          const lens = [];
          grp.children.forEach(mesh => {
            const p = mesh.geometry.attributes.position.array;
            for (let l = 0; l < 8; l++) {
              const base = l * 10 * 3; let len = 0;
              for (let j = 0; j < 4; j++) {
                const a = base + j * 6, b = base + (j + 1) * 6;
                len += Math.hypot(p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]);
              }
              lens.push(len / upm);
            }
          });
          const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
          return { mean: +mean.toFixed(2), n: lens.length, min: +Math.min(...lens).toFixed(2), max: +Math.max(...lens).toFixed(2) };
        }).catch(() => null);
        if (!m) await h.wait(250);
      }
      if (!m) return 'no relay changeover-zone markings within 2 s of race start - the zones still wait for the full 3D load (G-289)';
      if (Math.abs(m.mean - 30) / 30 > 0.03) return 'the relay changeover zone markings span ' + m.mean + ' m on average (' + m.n + ' lane strips, ' + m.min + '-' + m.max + ' m) but the changeover zone is 30 m long (G-289)';
      return true;
    }
  }

,{
    id: 'never-g-289-p2',
    mode: 'wind',
    ask: 'NEVER (G-289): a tailwind over +2.0 m/s still counts as a record - the sprint results screen must show a wind reading, a wind-aided time must carry the "w" mark, and it must never be saved as a best',
    async test(page, h) {
      // G-289 robot lesson: clear the saved 100m best BEFORE reloading, so the
      // fresh boot loads clean in-memory bests too (the game loads bests once
      // at boot; deleting after boot leaves a stale in-memory best behind).
      // The delete is verified - a reload-race throw used to swallow it and a
      // stale 0.03 s fast-forward best from an earlier suite test survived.
      let cleared = false;
      for (let d = 0; d < 2 && !cleared; d++) {
        cleared = await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } try { const b = JSON.parse(localStorage.getItem('tfapex_bests') || '{}'); delete b['100m']; localStorage.setItem('tfapex_bests', JSON.stringify(b)); const chk = JSON.parse(localStorage.getItem('tfapex_bests') || '{}'); return chk['100m'] == null; } catch (err) { return false; } }).catch(() => false);
      }
      if (!cleared) return 'could not clear the saved 100m best before the wind runs (G-289)';
      await h.eval(() => { location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      // G-289 robot lesson: reload + a fixed 1500 ms wait is not enough late in
      // the suite - early evals can still hit the dying page, whose race is
      // still playing. Wait for the NEW page (menu on, not playing, hooks live)
      // before navigating; the gate is best-effort and nav follows regardless.
      for (let i = 0; i < 120; i++) {
        const ready = await h.eval(() => {
          const on = document.querySelector('.screen.on');
          return !!(window.__tf && on && on.id === 'menu' && !document.body.classList.contains('playing'));
        }).catch(() => false);
        if (ready) break;
        await h.wait(500);
      }

      const nav100 = async () => {
        let nav = null;
        for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
        nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            if (document.body.classList.contains('playing')) { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === '100m'); if (b) b.click(); else { clearInterval(iv); res('no 100m button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            else if (on && on.id === 'results') { const b = document.getElementById('bResMenu'); if (b) b.click(); }
            if (++n > 120) { clearInterval(iv); res('stuck'); }
          }, 150);
        })).catch(() => null);
          if (nav !== 'racing') await h.wait(1200);
        }
        return nav;
      };
      const drive = async () => {
        const driven = await h.eval(() => {
          const e = window.__tf && window.__tf.eng();
          if (!e) return null;
          let side = 0, steps = 0;
          while (!e.done && steps < 6000) {
            if (e.phase === 'run') { e.stride(side % 2 ? 'R' : 'L'); side++; }
            e.update(1 / 60);
            steps++;
          }
          return { done: e.done };
        }).catch(() => null);
        if (!driven || !driven.done) return false;
        for (let w = 0; w < 10; w++) {
          const shown = await h.eval(() => {
            const on = document.querySelector('.screen.on');
            const mk = document.getElementById('resMark');
            return !!(on && on.id === 'results' && mk && mk.textContent !== '--');
          }).catch(() => false);
          if (shown) return true;
          await h.wait(300);
        }
        return false;
      };
      const readRes = async () => h.eval(() => {
        const mk = document.getElementById('resMark');
        let bests = null;
        try { bests = JSON.parse(localStorage.getItem('tfapex_bests') || '{}'); } catch (err) {}
        return { resMark: mk ? mk.textContent : '', bests };
      }).catch(() => null);
      if (await nav100() !== 'racing') return 'could not start the 100m sprint (wind-aided run)';
      await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (e) e.wind = 2.5; return true; }).catch(() => {});
      if (!await drive()) return 'the wind-aided 100m sprint never finished in game-time stepping';
      const r1 = await readRes();
      if (!r1) return 'no results screen after the wind-aided 100m sprint';
      if (!/\d+\.\d+w\s*\(/.test(r1.resMark)) return 'a +2.5 m/s tailwind time carries no "w" mark: results show "' + r1.resMark + '" (G-289)';
      if (!/Wind \+2\.5 m\/s/.test(r1.resMark)) return 'a +2.5 m/s tailwind time shows no wind reading: results show "' + r1.resMark + '" (G-289)';
      if (r1.bests && r1.bests['100m'] != null) return 'a wind-aided 100m time was saved as a best (' + r1.bests['100m'] + ') though the results show "' + r1.resMark + '" (G-289)';
      if (await nav100() !== 'racing') return 'could not start the 100m sprint (legal-wind run)';
      await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (e) e.wind = 1.0; return true; }).catch(() => {});
      if (!await drive()) return 'the legal-wind 100m sprint never finished in game-time stepping';
      const r2 = await readRes();
      if (!r2) return 'no results screen after the legal-wind 100m sprint';
      if (/\d+\.\d+w\s*\(/.test(r2.resMark)) return 'a +1.0 m/s wind time wrongly carries a "w" mark: results show "' + r2.resMark + '" (G-289)';
      if (!/Wind \+1\.0 m\/s/.test(r2.resMark)) return 'a +1.0 m/s wind time shows no wind reading: results show "' + r2.resMark + '" (G-289)';
      const tm = r2.resMark.match(/(\d+\.\d+)\s*\(/);
      if (!tm) return 'could not read the legal-wind 100m time from "' + r2.resMark + '" (G-289)';
      if (!r2.bests || Math.abs(r2.bests['100m'] - parseFloat(tm[1])) > 0.011) return 'a legal-wind 100m time was not saved as a best: results show "' + r2.resMark + '", saved bests ' + JSON.stringify(r2.bests) + ' (G-289)';
      return true;
    }
  },
  {
    id: 'never-g-289-r1-p1',
    ask: 'G-289 r1: throws get 3 attempts plus 3 more for the top 8 - the Shot Put ends with 6 attempts, the Discus still ends with 1',
    async test(page, h) {
    const navEv = async (btn, evId) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const r = await h.eval((a) => new Promise(res => {
          let n = 0; const iv = setInterval(() => {
            const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng();
            if (document.body.classList.contains('playing') && e && e.ev && e.ev.id === a.evId) { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const re = new RegExp(a.btn, 'i'); const b = [...document.querySelectorAll('#gridEvents button')].find(x => re.test(x.textContent.trim())); if (b) b.click(); else { clearInterval(iv); res('no button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            else if (on && on.id === 'results') { const b = document.getElementById('bResMenu'); if (b) b.click(); }
            if (++n > 120) { clearInterval(iv); res('stuck'); }
          }, 150);
        }), { evId: evId, btn: btn }).catch(() => null);
        if (r === 'racing') return true;
        await h.wait(1200);
      }
      return false;
    };
    await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
    await h.wait(1500);
    for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }
      if (!await navEv('Shot Put', 'sp')) return 'could not start the Shot Put (G-289 r1)';
      const m = await h.eval(() => {
        const e = window.__tf.eng();
        let steps = 0;
        while (!e.done && steps < 20000) {
          e.update(1 / 60); steps++;
          if (e.phase === 'power' && e.power >= 0.97) e.action();
          else if (e.phase === 'angle' && e.ang >= 40.5 && e.ang <= 43.5) e.action();
        }
        if (!e.done) return { notDone: true };
        return { attempts: e.attempts.length, attMax: e.attMax };
      }).catch(() => null);
      if (!m) return 'the Shot Put attempt count could not be read (G-289 r1)';
      if (m.notDone) return 'the Shot Put never finished its attempts (G-289 r1)';
      if (m.attempts !== 6 || m.attMax !== 6) return 'the Shot Put ended after ' + m.attempts + ' attempts (attMax ' + m.attMax + ') - rules/trackfield.md says 3 attempts plus 3 more for the top 8 (G-289 r1)';
    await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
    await h.wait(1500);
    for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }
      if (!await navEv('Discus', 'dt')) return 'could not start the Discus (G-289 r1)';
      const d = await h.eval(() => {
        const e = window.__tf.eng();
        let steps = 0;
        while (!e.done && steps < 6000) {
          if (e.phase === 'hold') e.actionDown();
          else if (e.phase === 'spinning' && e.spinT >= 1.55) e.actionUp();
          e.update(1 / 60); steps++;
        }
        if (!e.done) return { notDone: true };
        return { attempts: e.attempts.length, attMax: e.attMax };
      }).catch(() => null);
      if (!d) return 'the Discus attempt count could not be read (G-289 r1)';
      if (d.notDone) return 'the Discus never finished (G-289 r1)';
      if (d.attempts !== 1 || d.attMax !== 1) return 'the Discus ended after ' + d.attempts + ' attempts (attMax ' + d.attMax + ') - the owner rule (G-25) says the Discus is ONE action (G-289 r1)';
      return true;
    }
  },
  {
    id: 'never-g-289-r1-p2',
    ask: 'G-289 r1: relay zones paint at race start even when arriving from another race already playing (the main-check arrival)',
    async test(page, h) {
    const navEv = async (btn, evId) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const r = await h.eval((a) => new Promise(res => {
          let n = 0; const iv = setInterval(() => {
            const on = document.querySelector('.screen.on'); const e = window.__tf && window.__tf.eng();
            if (document.body.classList.contains('playing') && e && e.ev && e.ev.id === a.evId) { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const re = new RegExp(a.btn, 'i'); const b = [...document.querySelectorAll('#gridEvents button')].find(x => re.test(x.textContent.trim())); if (b) b.click(); else { clearInterval(iv); res('no button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            else if (on && on.id === 'results') { const b = document.getElementById('bResMenu'); if (b) b.click(); }
            if (++n > 120) { clearInterval(iv); res('stuck'); }
          }, 150);
        }), { evId: evId, btn: btn }).catch(() => null);
        if (r === 'racing') return true;
        await h.wait(1200);
      }
      return false;
    };
    await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
    await h.wait(1500);
    for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }
      if (!await navEv('60m Dash', '60m')) return 'could not start the arrival 60m race (G-289 r1)';
    await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
    await h.wait(1500);
    for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }
      if (!await navEv('Relay', 'relay')) return 'could not start the relay event after the arrival race (G-289 r1)';
      let m = null;
      for (let i = 0; i < 8 && !m; i++) {
        m = await h.eval(() => {
          const e = window.__tf && window.__tf.eng(); const grp = e && e._zone;
          if (!grp || !grp.children.length) return null;
          const lens = [];
          grp.children.forEach(mesh => {
            const p = mesh.geometry.attributes.position.array;
            for (let l = 0; l < 8; l++) {
              const base = l * 10 * 3; let len = 0;
              for (let j = 0; j < 4; j++) {
                const a = base + j * 6, b = base + (j + 1) * 6;
                len += Math.hypot(p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]);
              }
              lens.push(len);
            }
          });
          const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
          return { mean: +mean.toFixed(2), n: lens.length };
        }).catch(() => null);
        if (!m) await h.wait(250);
      }
      if (!m) return 'no relay changeover-zone markings within 2 s of race start after arriving from another race (G-289 r1)';
      if (Math.abs(m.mean - 30) / 30 > 0.03) return 'the relay changeover zone markings span ' + m.mean + ' m on average (' + m.n + ' lane strips) but rules/trackfield.md says 30 m (G-289 r1)';
      return true;
    }
  },
  {
      id: 'tester-chk-t10',
      mode: 't10',
      ask: 'TESTER (G-311, checklist T10): the shot put landing sector is 34.92 degrees - venues/track.md.',
      async test(page, h) {
        await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
        await h.wait(1500);
      for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }

        let nav = null;
        for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
          nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            const e = window.__tf && window.__tf.eng();
            if (document.body.classList.contains('playing') && e && e.ev && e.ev.id === 'sp') { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === 'Shot Put'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            else if (on && on.id === 'results') { const b = document.getElementById('bResMenu'); if (b) b.click(); }
            if (++n > 90) { clearInterval(iv); res('stuck'); }
          }, 150);
        })).catch(() => null);
          if (nav !== 'racing') await h.wait(1200);
        }
        if (nav !== 'racing') return 'could not start the Shot Put: ' + nav;
        const m = await h.eval(() => {
          const rigs = window.__tf.rigs();
          let root = rigs.length && rigs[0].group ? rigs[0].group : null;
          if (!root) return null;
          while (root.parent) root = root.parent;
          const CX = -52, CZ = 20, dirs = [];
          root.traverse(o => {
            if (!o.isMesh || !o.geometry) return;
            const g = o.geometry, p = g.parameters || {};
            if (g.type === 'PlaneGeometry' && Math.abs(p.width - 46) < 0.01 && Math.abs(p.height - 0.14) < 0.01) {
              const dx = o.position.x - CX, dz = o.position.z - CZ;
              if (Math.abs(Math.hypot(dx, dz) - 23) < 0.5) dirs.push(Math.atan2(dz, dx));
            }
          });
          if (dirs.length < 2) return { n: dirs.length };
          const dot = Math.cos(dirs[0]) * Math.cos(dirs[1]) + Math.sin(dirs[0]) * Math.sin(dirs[1]);
          const cross = Math.cos(dirs[0]) * Math.sin(dirs[1]) - Math.sin(dirs[0]) * Math.cos(dirs[1]);
          return { angle: +(Math.atan2(Math.abs(cross), dot) * 180 / Math.PI).toFixed(2), n: dirs.length };
        }).catch(() => null);
        if (!m) return 'the shot put sector lines could not be read';
        if (!m.angle) return 'fewer than two shot put sector lines found (' + m.n + ')';
        if (Math.abs(m.angle - 34.92) / 34.92 > 0.03) return 'the shot put landing sector measures ' + m.angle + ' degrees between its markings but venues/track.md says 34.92 degrees';
        return true;
      }
  },
  {
    id: 'tester-chk-t11',
    mode: 't11',
    ask: 'CHECKLIST T11 (G-316): the long jump runway is 40 m - venues/track.md. The runway mesh length must be within 3% of 40 m.',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }
      let m = null;
      for (let w = 0; w < 60; w++) {
        m = await h.eval(() => {
          try {
            const tf = window.__tf; if (!tf) return null;
            const rigs = tf.rigs() || [];
            let scene = null;
            for (const r of rigs) { const g = r.group || (r.h && r.h.object) || r.object || null; if (g && !scene) { let o = g; while (o.parent) o = o.parent; scene = o; } }
            if (!scene) return null;
            const found = [];
            scene.traverse(o => {
              if (!o.isMesh || !o.geometry) return;
              const p = o.geometry.parameters || {};
              if (o.geometry.type !== 'BoxGeometry') return;
              if (Math.abs(p.height - 0.08) > 0.01 || Math.abs(p.depth - 1.4) > 0.01) return;
              o.updateWorldMatrix(true, false);
              const wz = o.matrixWorld.elements[14];
              if (Math.abs(wz - 8) > 0.5) return;
              found.push(+p.width.toFixed(2));
            });
            return { n: found.length, lens: found };
          } catch (e) { return { err: e.message }; }
        }).catch(() => null);
        if (m && (m.n != null || m.err)) break;
        await h.wait(500);
      }
      if (!m) return 'no long-jump runway scene found after reload (G-316)';
      if (m.err) return 'runway measurement threw: ' + m.err;
      if (m.n !== 1) return 'expected 1 long-jump runway strip, found ' + m.n + ' (G-316)';
      const len = m.lens[0];
      if (Math.abs(len - 40) / 40 > 0.03) return 'the long jump runway mesh spans ' + len + ' m but venues/track.md says 40 m (G-316)';
      return true;
    }
  },
  {
    id: 'tester-chk-t12',
    mode: 't12',
    ask: 'CHECKLIST T12 (G-326): the high jump bar is 2.0-2.4 m for men - REALITY.md. The bar height values offered in the men\'s high jump must all lie in 2.0-2.4 m.',
    async test(page, h) {
      await h.eval(() => { for (const k of ['__drv', '__tfdrv', '__tfdrv2', '__tfdrv3', '__tfdrv4', '__tfdrv5', '__tfdrv6', '__tfdrvF', '__g68drv']) { if (window[k]) { clearInterval(window[k]); window[k] = null; } } location.reload(); return true; }).catch(() => {});
      await h.wait(1500);
      for (let g = 0; g < 120; g++) { const ready = await h.eval(() => !!(window.__tf) && (document.querySelector('.screen.on') || {}).id === 'menu' && !document.body.classList.contains('playing')).catch(() => false); if (ready) break; await h.wait(500); }
      let nav = null;
      for (let attempt = 0; attempt < 3 && nav !== 'racing'; attempt++) {
        nav = await h.eval(() => new Promise(res => {
          let n = 0;
          const iv = setInterval(() => {
            const on = document.querySelector('.screen.on');
            const e = window.__tf && window.__tf.eng();
            if (document.body.classList.contains('playing') && e && e.ev && e.ev.id === 'hj') { clearInterval(iv); res('racing'); return; }
            if (on && on.id === 'menu') { const b = document.getElementById('bFree'); if (b) b.click(); }
            else if (on && on.id === 'grid') { const b = [...document.querySelectorAll('#gridEvents button')].find(x => x.textContent.trim() === 'High Jump'); if (b) b.click(); else { clearInterval(iv); res('no event button'); } }
            else if (on && on.id === 'card') { const b = document.getElementById('bCardStart'); if (b) b.click(); }
            else if (on && on.id === 'results') { const b = document.getElementById('bResMenu'); if (b) b.click(); }
            if (++n > 90) { clearInterval(iv); res('stuck'); }
          }, 150);
        })).catch(() => null);
        if (nav !== 'racing') await h.wait(1200);
      }
      if (nav !== 'racing') return 'could not start the High Jump: ' + nav;
      const m = await h.eval(() => {
        const e = window.__tf.eng();
        return { heights: e.heights || null };
      }).catch(() => null);
      if (!m || !m.heights || !m.heights.length) return 'no high jump heights offered (G-326)';
      const bad = m.heights.filter(h => h < 2.0 || h > 2.4);
      if (bad.length) return 'the men\'s high jump offers bar heights outside 2.0-2.4 m: ' + bad.join(',') + ' (full list ' + m.heights.join(',') + ') (G-326)';
      return true;
    }
  }
];