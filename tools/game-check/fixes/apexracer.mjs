// Play tests for Exotic Racer Club (JOB G-10, 2026-10-19). See README.md in this folder.
// Owner's list: race starts, cars drive forward, lap counter goes up, race finishes with
// results, garage buy works, play-friend-code. Tests drive the game through window.__erc;
// each h.eval function is self-contained.
export default [
  {
    id: 'play-race-starts',
    ask: 'Race starts: starting a race creates the race, the player car and a full grid',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('startRace did not create a race');
            if (!E.R.P) return res('no player car in the race');
            if (E.R.cars.length < 8) return res('only ' + E.R.cars.length + ' cars on the grid (expected 8)');
            const lap = document.getElementById('lapT');
            if (!lap || !/LAP/.test(lap.textContent || '')) return res('lap/HUD readout not shown');
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-cars-drive-forward',
    ask: 'Cars drive forward once the race runs',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('no race');
            const ai = E.R.cars.find((c) => c.ai);
            if (!ai) return res('no AI car found');
            const s0 = ai.s, p0 = E.R.P.prog;
            E.K.gas = 1;
            E.step(900, 1 / 60); // 15 sim-seconds: past the 4.2s countdown
            E.K.gas = 0;
            if (ai.s <= s0) return res('AI car did not drive forward');
            if (E.R.P.prog <= p0 && E.R.P.spd <= 0) return res('player car never moved');
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-lap-goes-up',
    ask: 'Lap counter goes up as cars complete laps',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('no race');
            const ai = E.R.cars.find((c) => c.ai);
            if (!ai) return res('no AI car found');
            // let the AI drive (up to 3 sim-minutes) until it finishes a lap
            let n = 0;
            while ((ai.lap || 0) < 1 && n < 180) { E.step(60, 1 / 60); n++; }
            if ((ai.lap || 0) < 1) return res('AI car lap never went up in 3 sim-minutes');
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-race-finishes',
    ask: 'Race finishes with a results screen',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('no race');
            const T = E.R.T, total = E.R.laps * T.N;
            // teleport the player to just before the line and drive over it
            const P = E.R.P;
            P.prog = total - 30; P.s = P.prog;
            E.K.gas = 1;
            let n = 0;
            while (!P.fin && n < 1200) { E.step(30, 1 / 60); n++; }
            E.K.gas = 0;
            if (!P.fin) return res('player never crossed the finish');
            E.showResults();
            const scr = document.getElementById('result');
            if (!scr) return res('no results screen element');
            const title = (document.getElementById('rTitle') || {}).textContent || '';
            const tab = (document.getElementById('rTab') || {}).textContent || '';
            if (!title.trim()) return res('results screen has no title');
            if (!tab.trim()) return res('results screen has no standings');
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-garage-buy',
    ask: 'Garage buy works: buying a car adds it to the garage and selects it',
    async test(page, h) {
      // open the garage the way a player does: back to the menu, then the Garage button
      // (h.press takes a selector and really clicks it - h.tap takes screen x/y)
      await h.eval(() => { if (window.__erc) window.__erc.toMenu(); return true; });
      await h.wait(300);
      const opened = await h.press('#mGarage');
      if (!opened) return 'Garage button on the menu could not be pressed';
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        const gar = document.getElementById('garage');
        if (!gar || getComputedStyle(gar).display === 'none') return 'garage screen did not open';
        E.S.cash = 1000000;
        const ids = ['kestrel', 'brute', 'nova', 'zenith', 'phantom', 'vortex'];
        const id = ids.find((x) => !E.S.cars[x]);
        if (!id) return 'player already owns every buyable car';
        window.confirm = () => true; // the game asks before buying
        const card = document.querySelector('[data-car="' + id + '"]');
        if (!card) return 'no garage card for ' + id;
        card.click(); // select (preview) - the garage re-renders after this
        const again = document.querySelector('[data-car="' + id + '"]');
        (again || card).click(); // buy
        if (!E.S.cars[id]) return 'car ' + id + ' not in the garage after buying';
        if (E.S.cur !== id) return 'bought car was not selected';
        return true;
      });
    },
  },
  {
    id: 'play-friend-code',
    ask: "Friend code: entering a friend's RACE- code puts their car in your race",
    async test(page, h) {
      // a player saves a racer name first (Race Friends asks for one), then taps Race Friends
      await h.eval(() => { if (window.__erc) window.__erc.toMenu(); return true; });
      await h.wait(300);
      await h.eval(() => {
        const nm = document.getElementById('nm');
        if (nm) { nm.value = 'Racer One'; document.getElementById('nmB').click(); }
        return true;
      });
      await h.wait(300);
      const opened = await h.press('#mFriends');
      if (!opened) return 'Race Friends button on the menu could not be pressed';
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        const mine = ((document.getElementById('fCode') || {}).textContent || '').trim();
        if (!/^RACE-/.test(mine)) return 'no friend code shown on the friends screen';
        // build a code for a different racer, same format the game makes
        const j = JSON.stringify({ n: 'Test Friend', r: 5, car: 'kestrel', p: '#1e8bff', f: 'metal', ri: 0, g: '' });
        const b = btoa(unescape(encodeURIComponent(j))).replace(/\+/g, '~').replace(/\//g, '_').replace(/=+$/, '');
        const code = 'RACE-' + (b.match(/.{1,4}/g) || [b]).join('-');
        const inp = document.getElementById('fIn');
        inp.value = code;
        document.getElementById('fGo').click();
        const err = (document.getElementById('fErr') || {}).textContent || '';
        if (/did not scan|your own code/i.test(err)) return 'friend code was rejected: ' + err;
        if (!E.G || !E.G.friend) return 'friend was not stored after entering the code';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('race did not start with the friend');
            const fr = E.R.cars.find((c) => c.friendR);
            if (!fr) return res('friend car is not in the race');
            res(true);
          }, 500);
        });
      });
    },
  },
  {
    id: 'play-paint-own-colors',
    ask: 'Every car shows its own paint: each real 3D model body material is replaced by that car paint, and grid paints are not all the same',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        // body material names inside each fetched GLB (from the .glb files themselves):
        // if one of these names survives on a built car, the paint never reached the body
        const BODY = { goblin: ['clearcoat'], vanta: ['paintjob'], nova: ['paintjob'], vortex: ['paintjob'], kestrel: ['palettematerial003', 'palettematerial002'], zenith: ['palettematerial003', 'palettematerial002'], titan: ['palettematerial003', 'palettematerial002'], brute: ['palettematerial001'], phantom: ['palettematerial001'] };
        const check = () => {
          const R = E.R; if (!R) return 'no race';
          const paints = new Set();
          for (const e of R.cars) {
            if (e.cfg && e.cfg.paint) paints.add(e.cfg.paint.toLowerCase());
            if (!e.car.paint || !e.cfg) return 'a car has no paint material';
            if ('#' + e.car.paint.color.getHexString() !== e.cfg.paint.toLowerCase()) return e.carId + ' paint material is not its own paint color';
            const bad = BODY[e.carId] || [];
            let hit = '';
            e.car.root.traverse((q) => { if (!q.isMesh) return; const ms = Array.isArray(q.material) ? q.material : [q.material]; for (const m of ms) { const mn = (m.name || '').toLowerCase(); if (bad.includes(mn)) hit = mn; } });
            if (hit) return e.carId + ' body still wears the model material ' + hit + ' - paint did not reach the body';
          }
          if (paints.size < 2) return 'all grid paints are the same color';
          return true;
        };
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            const a = check(); if (a !== true) return res(a);
            const hi = E.PLACES.reduce((p, c) => (c.tier > p.tier ? c : p), E.PLACES[0]);
            E.startRace(hi, 8);
            setTimeout(() => res(check()), 3500);
          }, 1500);
        });
      });
    },
  },
  {
    id: 'play-goblin-name-wrap',
    ask: "APEX ARCADE name wrap: on the V12 Goblin by default, letters riding on both sides of the body",
    async test(page, h) {
      await h.eval(() => { if (window.__erc) window.__erc.toMenu(); return true; });
      await h.wait(300);
      const opened = await h.press('#mGarage');
      if (!opened) return 'Garage button on the menu could not be pressed';
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        const g = E.S.cars.goblin;
        if (!g) return 'no goblin in the garage';
        if (g.wrap !== 'name') return "goblin wrap is '" + g.wrap + "' - APEX ARCADE should be on by default";
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            const R = E.R; if (!R || !R.P) return res('no race / player car');
            const decals = [];
            R.P.car.root.traverse((q) => { if (q.isMesh && q.name === 'apexname') decals.push(q); });
            if (decals.length < 2) return res('player Goblin has ' + decals.length + ' APEX ARCADE decals - need both sides');
            const zs = decals.map((d) => { d.geometry.computeBoundingBox(); const bb = d.geometry.boundingBox; return (bb.min.z + bb.max.z) / 2; });
            if (!zs.some((z) => z > 0.3) || !zs.some((z) => z < -0.3)) return res('decals are not on opposite sides: ' + zs.map((z) => z.toFixed(2)).join(','));
            for (const d of decals) { if (!d.material || !d.material.map) return res('a decal has no letter texture'); }
            res(true);
          }, 1500);
        });
      });
    },
  },
  {
    id: 'play-race-start-fast',
    ask: 'Lap choices show on the race sheet and the race starts promptly - twice in a row (staged start, cached environment)',
    async test(page, h) {
      await h.eval(() => { if (window.__erc) window.__erc.toMenu(); return true; });
      await h.wait(300);
      const opened = await h.press('#mRace');
      if (!opened) return 'Race button on the menu could not be pressed';
      await h.wait(400);
      const picked = await h.press('#plist .pl');
      if (!picked) return 'no place card could be pressed';
      await h.wait(400);
      const laps = await h.eval(() => document.querySelectorAll('#shLaps .chip').length);
      if (laps !== 5) return 'lap choices missing on the sheet (' + laps + ' chips, expected 5)';
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          const t0 = performance.now();
          E.startRace(E.PLACES[0], 8);
          const iv = setInterval(() => {
            if (E.R && E.R.P && E.G.mode === 'race') {
              clearInterval(iv);
              if (performance.now() - t0 > 20000) return res('first race start took over 20s');
              E.toMenu();
              const t1 = performance.now();
              E.startRace(E.PLACES[0], 8);
              const iv2 = setInterval(() => {
                if (E.R && E.R.P && E.G.mode === 'race') { clearInterval(iv2); if (performance.now() - t1 > 20000) return res('second race start took over 20s'); res(true); }
              }, 100);
            }
          }, 100);
        });
      });
    },
  },
  {
    id: 'play-menu-turntable',
    ask: 'Home screen: slim left tile column (RACE, Garage, Race Friends, Graphics, Sound, Credits in that order), thin top stat bar with the coins, everything fits the sideways phone, and the car keeps turning on its turntable',
    async test(page, h) {
      await h.eval(() => { if (window.__erc) window.__erc.toMenu(); return true; });
      await h.wait(600);
      const layout = await h.eval(() => {
        const ids = ['mRace', 'mGarage', 'mFriends', 'mQ', 'mSnd', 'mCredits'];
        const W = innerWidth, H = innerHeight;
        let prevTop = -1;
        for (const id of ids) { const el = document.getElementById(id); if (!el) return 'missing button #' + id;
          const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
          if (cs.display === 'none' || r.width < 10 || r.height < 10) return '#' + id + ' is not visible';
          if (r.left > W * 0.45) return '#' + id + ' is not in the left column (left ' + Math.round(r.left) + ' of ' + W + ')';
          if (r.top < prevTop) return '#' + id + ' is out of order in the column';
          prevTop = r.top;
          if (r.bottom > H + 1 || r.top < 0) return '#' + id + ' does not fit the screen height (' + Math.round(r.bottom) + ' of ' + H + ')';
        }
        const bar = document.getElementById('mtop'); if (!bar) return 'no top bar';
        const br = bar.getBoundingClientRect(); if (br.top > 2 || br.height > 48) return 'top bar is not a thin strip at the top (height ' + Math.round(br.height) + ')';
        const st = document.getElementById('mstat'); if (!st || !/\u{1FA99}/u.test(st.textContent || '')) return 'top bar does not show the coins';
        return true;
      });
      if (layout !== true) return layout;
      const spin = await h.eval(() => {
        const E = window.__erc; if (!E) return 'no window.__erc hook';
        const a = E.G.mSpin || 0;
        return new Promise((res) => setTimeout(() => { const b = E.G.mSpin || 0; res(b - a > 0.25 ? true : 'car is not turning on the home screen (spin moved ' + (b - a).toFixed(2) + ' rad in 1.4s)'); }, 1400));
      });
      if (spin !== true) return spin;
      const gar = await h.press('#mGarage');
      if (!gar) return 'Garage button could not be pressed from the new column';
      await h.wait(400);
      const back = await h.press('#gDone');
      if (!back) return 'no way back from the garage to the home screen';
      await h.wait(300);
      return true;
    },
  },
  {
    id: 'play-traffic-glb',
    ask: 'G-50: city traffic cars are real fetched 3D models, each in its own paint',
    async test(page, h) {
      const setup = await h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        if (E.R && E.endRace) E.endRace();
        const nmEl = document.getElementById('nm'); if (nmEl && !nmEl.value) nmEl.value = 'T50'; /* #nm is gone once a name is saved (refreshMenu swaps it for static text) - the race does not need it */
        return true;
      });
      if (setup !== true) return setup;
      const out = await h.eval(() => {
        const E = window.__erc;
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          let n = 0;
          const iv = setInterval(() => {
            n++;
            if (E.R && E.R.traffic && E.R.traffic.length >= 9) {
              clearInterval(iv);
              const keys = ['patriot', 'tokii', 'shc', 'lemans'];
              const seen = new Set(), paints = new Set();
              for (const t of E.R.traffic) {
                const c = t.car;
                if (!c.glbKey) return res('a traffic car is not a real 3D model (no glbKey)');
                if (!keys.includes(c.glbKey)) return res('traffic car uses unknown model ' + c.glbKey);
                seen.add(c.glbKey);
                let verts = 0;
                c.root.traverse((q) => { if (q.isMesh && !q.userData.blob && q.geometry && q.geometry.attributes && q.geometry.attributes.position) verts += q.geometry.attributes.position.count; });
                if (verts < 15000) return res('traffic ' + c.glbKey + ' has only ' + verts + ' vertices - not the real fetched model');
                if (c.paint && c.paint.color) paints.add(c.paint.color.getHexString());
              }
              if (seen.size < 2) return res('traffic all use one model (' + [...seen][0] + ') - the fetched models should rotate');
              if (paints.size < 4) return res('traffic paints are not individual - only ' + paints.size + ' distinct colors');
              res(true);
            } else if (n > 75) { clearInterval(iv); res('traffic never appeared in the race'); }
          }, 200);
        });
      });
      if (out !== true) return out;
      if (h.shot) await h.shot('traffic-glb');
      await h.eval(() => { const E = window.__erc; if (E.R && E.endRace) E.endRace(); if (E.toMenu) E.toMenu(); return true; });
      return true;
    },
  },
];
