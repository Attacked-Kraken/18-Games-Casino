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
      // thigh swing over ~1.4s proves real leg drive (not a glide)
      let mn = 1e9, mx = -1e9;
      for (let i = 0; i < 7; i++) {
        await drive();
        const p = await h.eval(() => window.__tf.pose());
        for (const r of p) if (r.human && r.sf > 0.3) { mn = Math.min(mn, r.thighL); mx = Math.max(mx, r.thighL); }
        await h.wait(200);
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
        atMenu = await h.eval(() => { const on = document.querySelector('.screen.on'); if (on && on.id === 'menu') return true; if (on && on.id === 'results') { const n = document.getElementById('bResNext'); const lbl = n ? n.textContent : ''; if (/RETRY EVENT/.test(lbl)) { const m = document.getElementById('bResMenu'); if (m) m.click(); } else if (n) n.click(); } return false; });
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
      const rects = await h.eval(() => { const r = (id) => { const el = document.getElementById(id); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }; return { stick: r('stick'), tap: r('btnTap'), act: r('btnA'), playing: document.body.classList.contains('playing') }; });
      if (!rects.stick || !rects.tap) return 'the touch controls are not on screen (no race running?)';
      if (!rects.playing) return 'the game is not in a race';
      const cdp = await page.target().createCDPSession();
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
      await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
      await h.wait(900);
      const f = await h.eval(() => (window.__tf && window.__tf.fill) ? window.__tf.fill() : null);
      await page.setViewport({ width: 844, height: 390, hasTouch: true, isMobile: true });
      await h.wait(400);
      if (!f) return 'no fill report from the game (JOB J39 build missing)';
      if (f.cov < 0.9) return 'held upright the game fills only ' + Math.round(f.cov * 100) + '% of the screen - wants the WHOLE screen (90%+)';
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
      const step = () => h.eval(() => { const on = document.querySelector('.screen.on'); let car = null; try { car = JSON.parse(localStorage.getItem('tfapex_career') || 'null'); } catch (e) {} const e = window.__tf && window.__tf.eng(); const click = (id) => { const b = document.getElementById(id); if (b) { b.click(); return true; } return false; }; const screen = on ? on.id : null; if (screen === 'menu') click('bCareer'); else if (screen === 'career') click('bCareerMeet'); else if (screen === 'card') click('bCardStart'); else if (screen === 'results') { const n = document.getElementById('bResNext'); const lbl = n ? n.textContent : ''; if (/RETRY EVENT/.test(lbl)) { if (!click('bResMenu')) click('bResNext'); } else click('bResNext'); } return { screen, car: car ? { season: car.season, meet: car.meet, done: car.done } : null, ev: e ? (e.ev || {}).id : null }; });
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
      await h.eval(() => { try { localStorage.setItem('tfapex_career', JSON.stringify({ name: 'YOU', colA: '#2456c8', colB: '#ffd34d', season: 2, meet: 3, tp: 0, up: { spd: 0, stam: 0, tech: 0 }, stats: { meets: 0, wins: 0, tpEarned: 0 }, done: false })); } catch (e) {} return true; });
      await page.reload({ waitUntil: 'load' });
      await h.wait(1500);
      await h.eval(() => { if (!window.__tfdrv4) { window.__tfdrv4 = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (!e || e.done) return; const ev = e.ev || {}; const field = ev.eng === 'throw' || ev.eng === 'longjump' || ev.eng === 'triplejump' || ev.eng === 'highjump' || ev.eng === 'polevault'; if (typeof e.best === 'number') e.best = Math.max(e.best, (ev.ref || 2) * 0.97); if (field) { const seen = window.__tfChampSeen || (window.__tfChampSeen = {}); const k = ev.id || ev.eng; if (!seen[k]) seen[k] = Date.now(); if (Date.now() - seen[k] > 3000) { e.done = true; return; } if (e.r) e.r.speed = Math.max(e.r.speed || 0, 9.2); if (e.stride) { e.stride('L'); e.stride('R'); } if (e.action) e.action(); } else if (e.r) { const d = ev.dist || 400; e.r.pos = Math.min(e.r.pos + d * 0.3, d - 0.2); e.r.speed = Math.max(e.r.speed || 0, 9.5); if (e.action && e.phase === 'run' && (ev.eng === 'hurdles' || ev.eng === 'relay')) e.action(); } }, 160); } return true; });
      const step = () => h.eval(() => { const on = document.querySelector('.screen.on'); let car = null; try { car = JSON.parse(localStorage.getItem('tfapex_career') || 'null'); } catch (e) {} const click = (id) => { const b = document.getElementById(id); if (b) { b.click(); return true; } return false; }; const screen = on ? on.id : null; if (screen === 'menu') click('bCareer'); else if (screen === 'career') click('bCareerMeet'); else if (screen === 'card') click('bCardStart'); else if (screen === 'results') click('bResNext'); return { screen, car: car ? { season: car.season, meet: car.meet, done: car.done } : null }; });
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
      const cdp = await page.target().createCDPSession();
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
              const cam = await h.eval(() => { const tf = window.__tf; const c = tf.camPos ? tf.camPos() : null; const rs = tf.rigs ? tf.rigs() : []; const g = rs && rs[0] && rs[0].group ? rs[0].group.position : null; return c && g ? { cx: c.x, cy: c.y, cz: c.z, ax: g.x, az: g.z } : null; });
              if (!cam) return 'no camera report from the game (camPos hook missing)';
              const dxz = Math.hypot(cam.cx - cam.ax, cam.cz - cam.az);
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
      const skipState = () => h.eval(() => { const b = document.getElementById('btnSkip'); const on = document.querySelector('.screen.on'); let car = null; try { car = JSON.parse(localStorage.getItem('tfapex_career') || 'null'); } catch (e) {} return { has: !!b, vis: !!(b && b.offsetParent !== null && getComputedStyle(b).display !== 'none'), screen: on ? on.id : null, car: car ? { season: car.season, meet: car.meet, tp: car.tp, done: car.done } : null }; });
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
      let started = false, guard = 0;
      while (budget() && guard++ < 40 && !started) {
        const s = await state();
        if (!s.screen && s.ev === '1500m') started = true;
        else if (s.screen === 'results') await h.eval(() => { const b = document.getElementById('bResMenu'); if (b) b.click(); return true; });
        else if (s.screen === 'menu') await h.eval(() => { const b = document.getElementById('bFree'); if (b) b.click(); return true; });
        else if (s.screen === 'grid') await h.eval(() => { const b = [...document.querySelectorAll('#gridEvents button')].find(x => /1500/.test(x.textContent)); if (b) b.click(); return true; });
        else if (s.screen === 'card') await h.eval(() => { const b = document.getElementById('bCardStart'); if (b) b.click(); return true; });
        await h.wait(400);
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
      const navTo = async (idRe, btnRe) => { let g = 0; while (budget() && g++ < 40) { const s = await state(); if (!s.screen && s.ev && idRe.test(s.ev)) return true; if (s.screen === 'results') await h.eval(() => { const b = document.getElementById('bResMenu'); if (b) b.click(); return true; }); else if (s.screen === 'menu') await h.eval(() => { const b = document.getElementById('bFree'); if (b) b.click(); return true; }); else if (s.screen === 'grid') await h.eval(() => { const b = [...document.querySelectorAll('#gridEvents button')].find(x => btnRe.test(x.textContent)); if (b) b.click(); return true; }); else if (s.screen === 'card') await h.eval(() => { const b = document.getElementById('bCardStart'); if (b) b.click(); return true; }); await h.wait(400); } return false; };
      const judgeFlight = async (label) => {
        // samples the flight, then returns the mark-phase view (or an error string)
        let flight = [], g = 0, mark = null;
        while (budget() && g++ < 70) {
          const s = await state();
          if (s.phase === 'flight') { const v = await view(); if (v && v.impl) flight.push(v); if (flight.length >= 3) await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.phase === 'flight') e.ft = Math.max(e.ft, e.fT - 0.05); return true; }); }
          else if (s.phase === 'mark') { mark = await view(); break; }
          await h.wait(150);
        }
        if (flight.length < 2) return label + ': no flight could be sampled - the throw was never visible to the camera check';
        const mid = flight[Math.floor(flight.length / 2)];
        if (!mid.impl || mid.impl.y < 1.2) return label + ': the implement was never seen in the air during its flight';
        const camD = Math.hypot(mid.cam.x - mid.impl.x, mid.cam.z - mid.impl.z);
        if (camD > 22) return label + ': the camera stayed at the circle while the throw flew - ' + camD.toFixed(0) + 'm away at mid-flight (it must follow the throw through the air)';
        const lookD = Math.hypot(mid.look.x - mid.impl.x, mid.look.z - mid.impl.z);
        if (lookD > 12) return label + ': the camera was not looking at the flying implement (look point ' + lookD.toFixed(0) + 'm from it)';
        if (!mark) return label + ': the throw never reached the landing (mark) phase';
        if (!mark.mark || !mark.mark.vis) return label + ': no landing marker shows where the throw landed';
        if (mark.impl == null || Math.abs(mark.impl.x - mark.mark.x) > 2) return label + ': the landing marker is not where the implement landed';
        return true;
      };
      // ---- DISCUS (hold to spin, release to throw)
      if (!await navTo(/^dt$/, /Discus/i)) return 'the discus event never loaded';
      let threw = false, g2 = 0;
      while (budget() && g2++ < 30 && !threw) {
        const s = await state();
        if (s.phase === 'hold') { await h.eval(() => { const el = document.getElementById('btnA'); if (el) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9 })); return true; }); await h.wait(1100); await h.eval(() => { const el = document.getElementById('btnA'); if (el) el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 })); return true; }); threw = true; }
        await h.wait(200);
      }
      if (!threw) return 'the discus throw never started (no hold phase)';
      const dj = await judgeFlight('discus');
      if (dj !== true) return dj;
      // finish the discus event so we can move on
      await h.eval(() => { if (!window.__tfdrv7) { window.__tfdrv7 = setInterval(() => { const e = window.__tf && window.__tf.eng(); if (!e || e.done) return; if (e.phase === 'mark') e.resT = Math.min(e.resT, 0.05); if (e.phase === 'hold') { e.actionDown && e.actionDown(); } if (e.phase === 'spinning') { e.actionUp && e.actionUp(); } if (e.phase === 'flight') e.ft = Math.max(e.ft, e.fT - 0.05); }, 200); } return true; });
      let g3 = 0, doneEv = false;
      while (budget() && g3++ < 40 && !doneEv) { const s = await state(); if (s.screen === 'results' || s.done) doneEv = true; await h.wait(300); }
      await h.eval(() => { if (window.__tfdrv7) { clearInterval(window.__tfdrv7); window.__tfdrv7 = null; } return true; });
      if (!doneEv) return 'the discus event never finished after the flight check';
      // ---- SHOT PUT (same shared flight camera: power, angle, release)
      if (!await navTo(/^sp$/, /Shot/i)) return 'the shot put event never loaded';
      let g4 = 0, shotFlew = false;
      while (budget() && g4++ < 40 && !shotFlew) {
        const s = await state();
        if (s.phase === 'power' || s.phase === 'angle') await h.eval(() => { const e = window.__tf && window.__tf.eng(); if (e && e.action) e.action(); return true; });
        else if (s.phase === 'flight') shotFlew = true;
        await h.wait(200);
      }
      if (!shotFlew) return 'the shot put throw never flew';
      const sj = await judgeFlight('shot put');
      if (sj !== true) return sj;
      return true;
    },
  },
];
