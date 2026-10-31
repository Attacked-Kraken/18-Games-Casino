/* G-375 race places, ONE place per test (VP Oct 31 2026): the old 20 tests each raced 5 places and needed ~110 s against the robot's 60 s cap, so all 20 timed out on every run and starved the owner tests. One place is ~22 s. Same checks, same red-line wording. */
const place = (PI) => ({
    id: 'play-place-census-' + String(PI).padStart(3, '0'), parts: ['track'],
    ask: 'G-375 (owner): race place #' + (PI + 1) + ' loads and races - the robot starts the race there, the car drives along the track until the lap counter advances (LAP 2/2), no script error, no black screen, venue and sky draw, one picture. A failing place is named in the red line.',
    async test(page, h) {
      const errs = [];
      page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
      const fails = [];
      for (const pi of [PI]) {
        const city = await h.eval((k) => window.__erc.PLACES[k].city, pi);
        const err0 = errs.length;
        await h.eval((k) => { const E = window.__erc, c = E.S.cars[E.S.cur]; Object.assign(c, { eng: 4, turbo: 3, aero: 3, tire: 3, kit: 3, nos: 3 }); E.startRace(E.PLACES[k], 2); }, pi);
        let ready = false;
        for (let i = 0; i < 200 && !ready; i++) { ready = await h.eval((k) => { const R = window.__erc.R; return !!(R && R.skids && R.P && R.W && R.place && R.place.city === k && R.t < 30); }, city); if (!ready) await h.wait(150); }
        if (!ready) { fails.push(city + ': the race never finished building'); continue; }
        const info = await h.eval(() => { const R = window.__erc.R, W = R.W; let kids = 0; W.scene.traverse(() => kids++); return { city: R.place.city, kids, sky: !!(W.sky || W.scene.background), fog: !!W.scene.fog, N: R.T.N }; });
        if (!info || info.city !== city) { fails.push(city + ': the loaded race is for ' + (info && info.city)); continue; }
        if (info.kids < 200) fails.push(city + ': the venue barely drew (scene objects ' + info.kids + ')');
        if (!info.sky) fails.push(city + ': no sky or backdrop in the scene');
        if (!info.fog) fails.push(city + ': no fog/atmosphere in the scene');
        const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const shotRes = await h.shot('place-' + slug);
        if (shotRes && shotRes.lum && shotRes.lum.length) { const L = shotRes.lum, mean = L.reduce((a, b) => a + b, 0) / L.length; if (mean < 10) fails.push(city + ': the screen is black (mean luminance ' + mean.toFixed(1) + ')'); }
        const drive = await h.eval(() => {
          const E = window.__erc, R = E.R, P = R.P, T = R.T;
          E.K.gas = 1; let loops = 0;
          while (loops++ < 1600) {
            const idx = ((P.idx + 10) % T.N + T.N) % T.N;
            let dh = Math.atan2(T.tx[idx], T.tz[idx]) - P.h;
            while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
            E.K.sx = Math.max(-1, Math.min(1, dh * 1.6));
            E.step(6, 1 / 15);
            if ((P.lapT || []).length >= 1) break;
          }
          E.K.gas = 0; E.K.sx = 0;
          return { lapT: (P.lapT || []).length, prog: Math.round(P.prog) };
        });
        if (!drive || drive.lapT < 1) { fails.push(city + ': the car never finished a lap (prog ' + (drive && drive.prog) + ' of ' + info.N + ') - the lap counter never moved'); }
        else { await h.wait(300); const hud2 = await h.eval(() => ((document.getElementById('lapT') || {}).textContent || '').replace(/\s+/g, ' ')); if (!/LAP 2\/2/.test(hud2 || '')) fails.push(city + ': the lap counter did not advance on screen (HUD reads "' + hud2 + '")'); }
        const newErrs = errs.slice(err0);
        if (newErrs.length) fails.push(city + ': script error while racing: ' + newErrs[0]);
      }
      return fails.length ? fails.join(' | ') : true;
    },
  });
export default Array.from({ length: 100 }, (_, i) => place(i));
