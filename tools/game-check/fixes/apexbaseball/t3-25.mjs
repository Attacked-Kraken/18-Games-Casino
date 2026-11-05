// T3-25 (tester, window 3): the WIDE camera shows a gray void instead of the
// ballpark - see findings/apexbaseball/F-B-001.md. Fails on main ed1dad4:
// mean colourfulness of the play area in wide view is ~5 (uniform gray),
// while the AUTO view at the same moments reads 70-99.
export default [
  {
    id: 'tester-wide-camera-shows-field',
    ask: 'WIDE camera must show the ballpark: in wide view the field, players and ball are visible, not a gray void',
    async test(page, h) {
      const snap = () => h.eval(() => {
        const T = window.__test; if (!T) return null;
        if (T.phase === 'start') { const b = document.getElementById('startBtn'); if (b) b.click(); return null; }
        return { phase: T.phase, view: T.cam ? T.cam.view : '?' };
      });
      // start the game and switch to WIDE (viewBtn cycles auto -> wide -> close)
      const t0 = Date.now();
      let wide = false;
      while (Date.now() - t0 < 20000) {
        const s = await snap();
        if (!s) { await h.wait(300); continue; }
        if (s.view === 'wide') { wide = true; break; }
        if (s.phase !== 'start') {
          await h.eval(() => { const b = document.getElementById('viewBtn'); if (b) b.click(); });
        }
        await h.wait(300);
      }
      if (!wide) return 'the camera never switched to WIDE (viewBtn did not cycle auto -> wide)';
      // wait for the camera glide to SETTLE at the wide position: a fixed
      // wait screenshots mid-glide (the camera passes over the visible field
      // on its way up) and reads high. Settled = within 5 units of [0,48,76];
      // the view is already the gray void there, and the glide ends at 0.1.
      const t1 = Date.now();
      let settled = false;
      while (Date.now() - t1 < 20000) {
        const p = await h.eval(() => { const T = window.__test; return T && T.cam ? T.cam.pos : null; });
        if (p && Math.hypot(p[0], p[1] - 48, p[2] - 76) < 5) { settled = true; break; }
        await h.wait(300);
      }
      if (!settled) return 'the camera never settled at the WIDE position [0,48,76]';
      await h.wait(500); // let the VIEW: WIDE banner fade
      // the 3D band (below the HUD, above the bottom buttons) must show the
      // ballpark, not a uniform gray: measure its colourfulness. Take three
      // frames and keep the LOWEST: one frame can catch a banner or a pitch
      // button glow and spike, but the void itself always reads low, while
      // a visible ballpark reads 70+ in every frame.
      const chromas = [];
      for (let i = 0; i < 3; i++) {
        const buf = await page.screenshot({ clip: { x: 0, y: 70, width: 844, height: 250 }, type: 'jpeg', quality: 62 });
        chromas.push(await h.eval(async (b64) => {
          const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode();
          const c = document.createElement('canvas'); c.width = 96; c.height = 54;
          const x = c.getContext('2d'); x.drawImage(img, 0, 0, 96, 54);
          const d = x.getImageData(0, 0, 96, 54).data;
          let sum = 0, n = 0;
          for (let j = 0; j < d.length; j += 4) { sum += Math.max(d[j], d[j + 1], d[j + 2]) - Math.min(d[j], d[j + 1], d[j + 2]); n++; }
          return sum / n;
        }, buf.toString('base64')));
        await h.wait(800);
      }
      const chroma = Math.min(...chromas);
      if (chroma < 30) return `WIDE view shows a gray void: mean colourfulness of the play area is ${chroma.toFixed(1)} (lowest of ${chromas.map(v => v.toFixed(1)).join(', ')}) - a visible ballpark reads 70+, the AUTO view reads 70-99`;
      return true;
    },
  },
];
