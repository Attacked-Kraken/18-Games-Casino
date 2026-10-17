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
      if (Math.abs(behind - 10) > 2) return 'camera sits ' + behind.toFixed(1) + ' blocks behind the player, wants 10';
      if (Math.abs(up - 15) > 2) return 'camera flies ' + up.toFixed(1) + ' blocks up, wants 15';
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
            if (Math.abs(lateral) > 1 || Math.abs(behind - 10) > 2.5 || Math.abs(s.f.cy - 15) > 2.5) {
              camBad = 'behind ' + behind.toFixed(1) + ', up ' + s.f.cy.toFixed(1) + ', off-center ' + lateral.toFixed(1);
            }
          }
        }
        if (humans >= 7 && samples >= 4 && !camBad) break;
        await h.wait(500);
      }
      if (humans < 7) return 'only ' + humans + ' of the runners are the studio 3D humans - the rest are stand-ins';
      if (samples < 2) return 'never saw the race camera behind the player';
      if (camBad) return 'camera not right behind the player (' + camBad + ') - wants 10 back, 15 up, centered, always';
      return true;
    },
  },
];
