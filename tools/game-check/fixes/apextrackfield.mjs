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
      let atMenu = false;
      while (budget() && !atMenu) {
        atMenu = await h.eval(() => { const m = document.getElementById('menuScr'); return !!(m && !m.classList.contains('hidden')); });
        if (!atMenu) {
          await h.eval(() => { const b = [...document.querySelectorAll('#resScr button, #resScr .btn')].find(x => /MENU|CAREER|NEXT/i.test(x.textContent) && x.offsetParent); if (b) b.click(); return true; });
          await h.wait(500);
        }
      }
      if (!atMenu) return 'could not get back to the menu (a race or results screen is stuck)';
      const careerBtn = await h.eval(() => { const b = document.getElementById('bCareer'); if (b) { b.click(); return true; } return false; });
      if (!careerBtn) return 'no CAREER MODE button on the menu';
      await h.wait(600);
      const meetBtn = await h.eval(() => { const b = document.getElementById('bCareerMeet'); if (b) { b.click(); return true; } return false; });
      if (!meetBtn) return 'no NEXT MEET button on the career screen - career stalls before the meet';
      await h.wait(600);
      const cardBtn = await h.eval(() => { const b = document.getElementById('bCardStart'); if (b) { b.click(); return true; } return false; });
      if (!cardBtn) return 'the career meet card never offered a start - career stalls at the card';
      let advanced = false; const phases = new Set();
      while (budget() && !advanced) {
        const st = await h.eval(() => { const e = window.__tf && window.__tf.eng(); return e ? { mode: e.mode || '', phase: e.phase || '', pos: e.pos || 0 } : null; });
        if (st) { phases.add(st.phase); if (st.mode !== 'career') return 'the meet started a ' + st.mode + ' race, not career'; if (phases.size > 1 || st.pos > 2) advanced = true; }
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
];
