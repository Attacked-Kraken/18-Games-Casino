// T3-26 (tester, window 3): the CLOSE camera never shows the close-up views -
// it sits at the field view [0,24,26] in every phase. See
// findings/apexbaseball/F-B-002.md. Fails on main 27a7db5: reads [0,24,26],
// 39 units from the expected PITCH_CLOSE_CAM [0,11,-38].
// Cause (game code): every setCam('pitch') runs while G.phase is 'call',
// 'bip' or 'start', so pitchingPhase() is false at setCam time and
// targetCam() falls through to FIELD_CAM every time.
export default [
  {
    id: 'tester-close-camera-shows-closeup',
    ask: 'CLOSE camera must show the close-up views: low behind the pitcher while pitching, behind the batter while batting - not the high field view',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        if (T.phase === 'start') { const b = document.getElementById('startBtn'); if (b) b.click(); return null; }
        return { phase: T.phase, view: T.cam ? T.cam.view : '?', mode: T.cam ? T.cam.mode : '?', pos: T.cam ? T.cam.pos : null };
      });
      // start the game and switch to CLOSE (viewBtn cycles auto -> wide -> close)
      const t0 = Date.now();
      let close = false;
      while (Date.now() - t0 < 15000) {
        const s = await snap();
        if (!s) { await h.wait(300); continue; }
        if (s.view === 'close') { close = true; break; }
        if (s.phase !== 'start') {
          await h.eval(() => { const b = document.getElementById('viewBtn'); if (b) b.click(); });
        }
        await h.wait(300);
      }
      if (!close) return 'the camera never switched to CLOSE (viewBtn did not cycle auto -> wide -> close)';
      // drive one pitch so setCam has run, then read the camera in the next
      // TOP select (pitching): it must sit at PITCH_CLOSE_CAM [0,11,-38].
      // A batted ball ('bip') takes a few seconds on a phone; the loop cap
      // (28 s) leaves room for one.
      let resolved = false;
      let pos = null;
      while (Date.now() - t0 < 28000) {
        const s = await snap();
        if (!s) { await h.wait(300); continue; }
        if (s.phase === 'call' || s.phase === 'bip') resolved = true;
        if (s.phase === 'select' && resolved) { pos = s.pos; break; }
        // drive the pitch: pick a pitch, throw, lock the windup
        await h.eval(() => {
          const fb = [...document.querySelectorAll('button')].find((x) => /FASTBALL/i.test(x.textContent) && x.offsetParent !== null);
          if (fb) fb.click();
          const t = document.getElementById('throwBtn');
          if (t && getComputedStyle(t).display !== 'none') t.click();
          const l = document.getElementById('lockBtn');
          if (l && getComputedStyle(l).display !== 'none') l.click();
        });
        await h.wait(300);
      }
      if (!pos) return 'no pitch resolved within 28 s, so the close pitching view could not be checked';
      const d = Math.hypot(pos[0] - 0, pos[1] - 11, pos[2] + 38);
      if (d > 3) return `CLOSE camera shows the field view, not the close-up: camera at [${pos.map((v) => +v.toFixed(1)).join(',')}] in TOP select, ${d.toFixed(1)} units from PITCH_CLOSE_CAM [0,11,-38] (it sits at FIELD_CAM [0,24,26])`;
      return true;
    },
  },
];
