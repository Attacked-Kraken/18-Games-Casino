// Play tests for Exotic Racer Club (JOB G-10, 2026-10-19). See README.md in this folder.
// Owner's list: race starts, cars drive forward, lap counter goes up, race finishes with
// results, garage buy works, play-friend-code. Tests drive the game through window.__erc;
// each h.eval function is self-contained.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
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
    id: 'play-paint-covers-car',
    ask: 'G-46 fix: proper shiny paint covers every racer car - the clearcoat paint is on the whole body shell, not a small slice, so no car can vanish into dark factory materials',
    async test(page, h) {
      await h.eval(() => { const E = window.__erc; if (E) E.startRace(E.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      return h.eval(() => {
        const E = window.__erc, R = E.R;
        if (!R) return 'no race';
        const MIN = { goblin: 0.75, patriot: 0.55, tokii: 0.18, shc: 0.8 };
        let sawPlayer = false;
        for (const e of R.cars) {
          if (!e.car || !e.car.paint) return (e.carId || 'a car') + ' has no paint material';
          if (e === R.P || e.carId === 'goblin') sawPlayer = true;
          const p = e.car.paint;
          if (p.clearcoat !== 1 || !(p.envMapIntensity >= 1.5)) return e.carId + ' paint is not the shiny clearcoat paint';
          let tot = 0, painted = 0;
          e.car.root.traverse((q) => { if (!q.isMesh || q.userData.lamp || q.userData.blob || q.userData.hlight) return; /* G-163: headlight meshes are not body paint */ const n = q.geometry && q.geometry.attributes && q.geometry.attributes.position ? q.geometry.attributes.position.count : 0; tot += n; if (q.material === p) painted += n; });
          if (!tot) return e.carId + ' has no geometry';
          const share = painted / tot, key = e.car.glbKey || '?', min = MIN[key];
          if (min !== undefined && share < min) return e.carId + ' (' + key + ') wears its paint on only ' + Math.round(share * 100) + '% of the car - the rest is dark factory material and the car vanishes at night';
        }
        if (!sawPlayer) return 'the player car is not in the grid';
        return true;
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
        const nm = document.getElementById('nm'); if (nm && !nm.value) nm.value = 'T50'; /* G-130: the name box only exists before a name is saved - once an earlier test saves one, #nm is gone and reading it crashed this test */
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
  {
    id: 'play-colliders-visible',
    ask: 'G-145: every car that can be hit is drawn and visible - in the scene, real car size, at its road position, with its own bright headlights and no light bars',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('no race');
            E.step(420, 1 / 60); // past the countdown, the whole field is on the road
            const R = E.R;
            const check = (o, kind, i) => {
              const c = o.car; if (!c || !c.root) return kind + ' ' + i + ' has no car to draw';
              let top = c.root, inScene = false;
              while (top) { if (top.visible === false) return kind + ' ' + i + ' is under an invisible parent'; if (top === R.W.scene) { inScene = true; break; } top = top.parent; }
              if (!inScene) return kind + ' ' + i + ' car is not in the world scene';
              let meshes = 0, bars = 0, hl = 0;
              let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9, mnz = 1e9, mxz = -1e9;
              c.root.updateMatrixWorld(true);
              c.root.traverse((q) => {
                if (!q.isMesh || !q.visible || q.userData.blob || !q.geometry || !q.geometry.attributes || !q.geometry.attributes.position) return;
                meshes++; if (q.userData.lamp) bars++; if (q.userData.hlight) hl++;
                const p = q.geometry.attributes.position, m = q.matrixWorld.elements, stride = Math.max(1, Math.floor(p.count / 400));
                for (let vi = 0; vi < p.count; vi += stride) { const x = p.getX(vi), y = p.getY(vi), z = p.getZ(vi);
                  const wx = m[0] * x + m[4] * y + m[8] * z + m[12], wy = m[1] * x + m[5] * y + m[9] * z + m[13], wz = m[2] * x + m[6] * y + m[10] * z + m[14];
                  if (wx < mnx) mnx = wx; if (wx > mxx) mxx = wx; if (wy < mny) mny = wy; if (wy > mxy) mxy = wy; if (wz < mnz) mnz = wz; if (wz > mxz) mxz = wz; }
              });
              if (meshes < 3) return kind + ' ' + i + ' has only ' + meshes + ' visible meshes - nothing to see';
              if (bars) return kind + ' ' + i + ' still has a light bar';
              if (hl < 2) { let gl = 0; c.root.traverse((q) => { if (q.userData.glow) gl++; }); if (hl + gl < 2) return kind + ' ' + i + ' has no bright headlights of its own'; }
              const len = Math.max(mxx - mnx, mxz - mnz), hgt = mxy - mny;
              if (len < 3.2 || len > 6.8) return kind + ' ' + i + ' is ' + len.toFixed(1) + ' m long - not a real car size';
              if (hgt < 0.5 || hgt > 2.2) return kind + ' ' + i + ' is ' + hgt.toFixed(1) + ' m tall - not a real car shape';
              const cx = (mnx + mxx) / 2, cz = (mnz + mxz) / 2;
              if (Math.abs(cx - o.x) > 1.6 || Math.abs(cz - o.z) > 1.6) return kind + ' ' + i + ' is drawn at (' + cx.toFixed(0) + ',' + cz.toFixed(0) + ') but collides at (' + o.x.toFixed(0) + ',' + o.z.toFixed(0) + ') - an invisible blocker';
              return true;
            };
            for (let i = 0; i < R.cars.length; i++) { const r = check(R.cars[i], 'racer', i); if (r !== true) return res(r); }
            for (let i = 0; i < R.traffic.length; i++) { const r = check(R.traffic[i], 'traffic', i); if (r !== true) return res(r); }
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-ai-models',
    ask: 'G-70: every AI racer and traffic car is a real fetched 3D model, never the blob mockup',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('no race');
            E.step(300, 1 / 60);
            const keys = ['goblin', 'patriot', 'tokii', 'shc', 'lemans'];
            const check = (o, kind, i) => {
              const c = o.car; if (!c) return kind + ' ' + i + ' has no car';
              if (!c.glbKey) return kind + ' ' + i + ' is the blob mockup (no glbKey)';
              if (!keys.includes(c.glbKey)) return kind + ' ' + i + ' uses unknown model ' + c.glbKey;
              let verts = 0;
              c.root.traverse((q) => { if (q.isMesh && !q.userData.blob && q.geometry && q.geometry.attributes && q.geometry.attributes.position) verts += q.geometry.attributes.position.count; });
              if (verts < 15000) return kind + ' ' + i + ' (' + c.glbKey + ') has only ' + verts + ' vertices - not the real fetched model';
              return true;
            };
            const R = E.R;
            for (let i = 0; i < R.cars.length; i++) { if (!R.cars[i].ai) continue; const r = check(R.cars[i], 'AI racer', i); if (r !== true) return res(r); }
            for (let i = 0; i < R.traffic.length; i++) { const r = check(R.traffic[i], 'traffic', i); if (r !== true) return res(r); }
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-ai-pace',
    ask: 'G-70: AI lap times within 5 percent of the player - the field is as fast as the player, nobody just drives away',
    async test(page, h) {
      // start the race from here and wait until the build has fully finished before stepping it:
      // R.skids is created at the end of setupRace, and stepping a half-built race crashes it
      await h.eval(() => { const E = window.__erc; if (E) E.startRace(E.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      return h.eval(() => {
        const E = window.__erc;
        if (!E || !E.R) return 'no race';
        const R = E.R, P = R.P, T = R.T;
        E.K.gas = 1;
        let guard = 0;
        while (guard++ < 4800) {
          const idx = ((P.idx + 10) % T.N + T.N) % T.N;
          let dh = Math.atan2(T.tx[idx], T.tz[idx]) - P.h;
          while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
          E.K.sx = Math.max(-1, Math.min(1, dh * 1.6));
          E.step(6, 1 / 60);
          if ((P.lapT || []).length >= 2 && R.cars.every((e2) => !e2.ai || (e2.lapT || []).length >= 2)) break;
        }
        E.K.gas = 0; E.K.sx = 0;
        if ((P.lapT || []).length < 1) return 'the player set no lap time in 8 sim-minutes';
        const pBest = Math.min.apply(null, P.lapT);
        const ais = R.cars.filter((e2) => e2.ai);
        if (!ais.length) return 'no AI cars in the race';
        const times = [];
        for (const e2 of ais) { if (!(e2.lapT || []).length) return 'AI car ' + e2.name + ' set no lap time'; times.push(Math.min.apply(null, e2.lapT)); }
        times.sort((a, b) => a - b);
        const med = times[Math.floor(times.length / 2)];
        for (const tt of times) if (tt > pBest * 1.05) return 'an AI best lap of ' + tt.toFixed(1) + 's is more than 5% slower than the player best ' + pBest.toFixed(1) + 's - the player can just drive away';
        if (med < pBest * 0.95) return 'the AI field median best lap ' + med.toFixed(1) + 's is more than 5% faster than the player best ' + pBest.toFixed(1) + 's';
        return true;
      });
    },
  },
  {
    id: 'play-steering-feel',
    ask: 'G-76: better steering - the car answers the stick quickly, turns where it points without sliding wide, and never snaps',
    async test(page, h) {
      // start the race from here and wait until the build has fully finished before stepping it:
      // R.skids is created at the end of setupRace, and stepping a half-built race crashes it
      await h.eval(() => { const E = window.__erc; if (E) E.startRace(E.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      return h.eval(() => {
        const E = window.__erc;
        if (!E || !E.R) return 'no race';
        const R = E.R, P = R.P, T = R.T;
        R.t = 0; // skip the countdown
        // clear stretch: player 150 segments ahead of the grid, traffic parked 400 m up the road, AI left behind
        P.prog += 150; P.s = P.prog;
        const at = {}; T.at(P.prog, 0, at);
        P.x = at.x; P.z = at.z; P.h = at.h; P.idx = ((Math.floor(P.prog) % T.N) + T.N) % T.N;
        P.vx = Math.sin(P.h) * 22; P.vz = Math.cos(P.h) * 22;
        for (const e2 of R.cars) if (e2.ai) { e2.s = P.prog - 60; e2.prog = e2.s; }
        for (const tr of R.traffic) tr.s = P.prog + 400 / T.ds;
        const unwrap = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
        E.K.gas = 1;
        let n = 0; while (P.spd < 24 && n++ < 900) E.step(3, 1 / 60);
        if (P.spd < 20) { E.K.gas = 0; return 'the car never got up to speed (' + P.spd.toFixed(0) + ' m/s)'; }
        // full lock for 0.5 s: measure the turn-in, the smoothness and the slide at the end
        const h0 = P.h; let prev = P.h, maxJump = 0;
        E.K.sx = 1;
        for (let i = 0; i < 10; i++) { E.step(3, 1 / 60); const dh = Math.abs(unwrap(P.h, prev)); if (dh > maxJump) maxJump = dh; prev = P.h; }
        const dhA = Math.abs(unwrap(P.h, h0));
        const fx = Math.sin(P.h), fz = Math.cos(P.h), rx = -fz, rz = fx;
        const vF = P.vx * fx + P.vz * fz, vL = P.vx * rx + P.vz * rz;
        const slide = Math.atan2(Math.abs(vL), Math.abs(vF));
        // let go: the wheel must unwind just as smoothly, no snap back
        E.K.sx = 0; prev = P.h;
        for (let i = 0; i < 8; i++) { E.step(3, 1 / 60); const dh = Math.abs(unwrap(P.h, prev)); if (dh > maxJump) maxJump = dh; prev = P.h; }
        E.K.gas = 0;
        if (dhA < 0.30) return 'the car barely answered the stick: only ' + dhA.toFixed(2) + ' rad of turn in 0.5 s at ' + P.spd.toFixed(0) + ' m/s - steering still lags';
        if (slide > 0.20) return 'the car slides wide: its travel points ' + (slide * 57.3).toFixed(0) + ' degrees away from its nose in a steady turn';
        if (maxJump > 0.16) return 'the steering snaps: the nose jumped ' + maxJump.toFixed(2) + ' rad in one 0.05 s sample';
        return true;
      });
    },
  },
  {
    id: 'play-sound-kit',
    ask: 'G-80: the game uses the owner sound packs - every music and UI file it plays is in the repo at the path the code asks for',
    async test(page, h) {
      const files = [
        'sounds/pack/music/sports_arena/sports_arena_menu.mp3',
        'sounds/pack/music/sports_arena/sports_arena_gameplay_low.mp3',
        'sounds/pack/music/sports_arena/sports_arena_gameplay_mid.mp3',
        'sounds/pack/music/sports_arena/sports_arena_gameplay_high.mp3',
        'sounds/pack/music/sports_arena/sports_arena_victory_sting.mp3',
        'sounds/pack/music/sports_arena/sports_arena_gameover_sting.mp3',
        'sounds/ui-kit/arcade/tap.mp3',
        'sounds/ui-kit/arcade/coin_pickup.mp3',
        'sounds/ui-kit/arcade/combo_x2.mp3',
        'sounds/ui-kit/arcade/combo_x3.mp3',
        'sounds/ui-kit/arcade/combo_x4.mp3',
        'sounds/ui-kit/arcade/combo_x5.mp3',
        'sounds/ui-kit/arcade/unlock.mp3',
        'sounds/ui-kit/arcade/level_up.mp3',
        'sounds/ui-kit/arcade/popup_open.mp3',
        'sounds/ui-kit/arcade/popup_close.mp3',
        'sounds/ui-kit/arcade/star_1.mp3',
        'sounds/ui-kit/arcade/star_2.mp3',
        'sounds/ui-kit/arcade/star_3.mp3',
        'sounds/ui-kit/arcade/win_jingle.mp3',
      ];
      for (const f of files) if (!fs.existsSync(path.join(repoRoot, f))) return 'sound file missing from the repo: ' + f;
      return h.eval((needles) => {
        const src = document.documentElement.innerHTML;
        for (const n of needles) if (!src.includes(n)) return 'the game code does not use the sound pack (missing ' + n + ')';
        return true;
      }, ['sports_arena_', 'gameplay_low', 'gameplay_mid', 'gameplay_high', 'combo_x', 'coin_pickup', 'win_jingle', 'popup_open']);
    },
  },
  {
    id: 'play-reality-go',
    ask: 'G-137: the REALITY robot can drive the car - go(true) really moves the player (over 0.3 m between samples)',
    async test(page, h) {
      const out = await h.eval(() => {
        const H = window.__reality, E = window.__erc;
        if (!H || typeof H.go !== 'function') return 'no __reality.go';
        return new Promise((res) => {
          let last = null, best = 0, path = 0, n = 0;
          H.go(true);
          const iv = setInterval(() => {
            n++;
            const inRace = E && E.R && E.R.P && E.R.P.car && H.player === E.R.P.car.root;
            const p = inRace && H.player.position ? [H.player.position.x, H.player.position.z] : null;
            if (p && last) { const d = Math.hypot(p[0] - last[0], p[1] - last[1]); if (d < 60) { best = Math.max(best, d); path += d; } }
            last = p;
            if ((best > 0.3 && path > 2) || n >= 55) { clearInterval(iv); H.go(false); if (E) E.toMenu(); res(best > 0.3 && path > 2 ? true : 'go(true) did not move the player (biggest step ' + best.toFixed(2) + ' m, path ' + path.toFixed(1) + ' m in ' + (n * 0.4).toFixed(1) + ' s)'); }
          }, 400);
        });
      });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-reality-time-speed',
    ask: 'G-143: the REALITY hook reports game time and player speed - time() advances in race seconds and speed() reads the car in m/s',
    async test(page, h) {
      const out = await h.eval(() => {
        const H = window.__reality, E = window.__erc;
        if (!H) return 'no __reality hook';
        if (typeof H.time !== 'function') return 'the hook has no time()';
        if (typeof H.speed !== 'function') return 'the hook has no speed()';
        const s0 = H.speed(); if (typeof s0 !== 'number' || !(s0 >= 0)) return 'speed() is not a non-negative number before a race (' + s0 + ')';
        return new Promise((res) => {
          let n = 0, t1 = null;
          H.go(true);
          const iv = setInterval(() => {
            n++;
            const R = E && E.R;
            if (R && R.P && H.time() > 0.2) {
              if (t1 === null) { t1 = H.time(); return; }
              const dtg = H.time() - t1, sp = H.speed();
              if (dtg > 0.3 && sp > 2) { clearInterval(iv); H.go(false); E.toMenu(); res(true); }
              else if (n > 50) { clearInterval(iv); H.go(false); E.toMenu(); res('time advanced ' + dtg.toFixed(2) + ' s but speed() read ' + sp.toFixed(1) + ' m/s while go(true) was driving'); }
            } else if (n > 55) { clearInterval(iv); H.go(false); if (E) E.toMenu(); res('the race clock never started under go(true)'); }
          }, 300);
        });
      });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-wrap-on-door',
    ask: 'G-149 point 1: the APEX ARCADE name wrap sits on the door - its strip never reaches the wheel zones at either end',
    async test(page, h) {
      await h.eval(() => { const E = window.__erc; E.S.cur = 'goblin'; E.startRace(E.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R;
        const strips = [];
        R.P.car.root.traverse((q) => { if (q.isMesh && q.name === 'apexname') strips.push(q); });
        if (!strips.length) return 'the player goblin wears no APEX ARCADE wrap';
        const tilt = strips[0].parent;
        let mnx = 1e9, mxx = -1e9;
        const v = tilt.position.clone();
        tilt.updateWorldMatrix(true, true);
        tilt.traverse((q) => { if (!q.isMesh || q.name === 'apexname') return; const p = q.geometry && q.geometry.attributes && q.geometry.attributes.position; if (!p) return;
          for (let i = 0; i < p.count; i += 3) { v.fromBufferAttribute(p, i); v.applyMatrix4(q.matrixWorld); const l = tilt.worldToLocal(v.clone()); if (l.x < mnx) mnx = l.x; if (l.x > mxx) mxx = l.x; } });
        const L = mxx - mnx, cx = (mnx + mxx) / 2, rearAx = cx - 0.31 * L, frontAx = cx + 0.31 * L;
        for (const s of strips) { s.geometry.computeBoundingBox(); const b = s.geometry.boundingBox;
          if (b.min.x < rearAx + 0.45) return 'the wrap starts at x ' + b.min.x.toFixed(2) + ' - over the rear wheel (the door starts at ' + (rearAx + 0.45).toFixed(2) + ')';
          if (b.max.x > frontAx - 0.45) return 'the wrap ends at x ' + b.max.x.toFixed(2) + ' - over the front wheel (the door ends at ' + (frontAx - 0.45).toFixed(2) + ')'; }
        E.toMenu();
        return true;
      });
      if (out !== true) await h.eval(() => { window.__erc.toMenu(); });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-no-light-bars',
    ask: 'G-145 point 2: no car wears a light bar - the G-70 bumper bars are gone from the garage car, the race grid and traffic',
    async test(page, h) {
      const gBars = await h.eval(() => { const H = window.__reality; let n = 0; if (H && H.player) H.player.traverse((q) => { if (q.userData.lamp) n++; }); return n; });
      if (gBars) return 'the garage car still wears ' + gBars + ' light bar(s)';
      await h.eval(() => { window.__erc.startRace(window.__erc.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R, bad = [];
        for (const e of [...R.cars, ...R.traffic]) { let n = 0; e.car.root.traverse((q) => { if (q.userData.lamp) n++; }); if (n) bad.push((e.carId || 'traffic') + ' x' + n); }
        E.toMenu();
        return bad.length ? 'light bars remain on: ' + bad.join(', ') : true;
      });
      if (out !== true) await h.eval(() => { window.__erc.toMenu(); });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-headlights-bright',
    ask: 'G-163: every car shines from its own headlights and tail lights - lamp meshes plus a soft glow front and rear, nothing solid',
    async test(page, h) {
      await h.eval(() => { window.__erc.startRace(window.__erc.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R, bad = [];
        for (const e of [...R.cars, ...R.traffic]) { let f = 0, r = 0, dim = 0;
          e.car.root.traverse((q) => { if (q.userData.glow === 1) { f++; return; } if (q.userData.glow === 2) { r++; return; } if (!q.userData.hlight) return; if (q.userData.hlight === 1) f++; else r++;
            const m = q.material; const bright = m && m.isMeshBasicMaterial ? Math.max(m.color.r, m.color.g, m.color.b) >= 1.5 : ((m && m.emissiveIntensity) || 0) >= 1.5; if (!bright) dim++; });
          const cid = e.carId || 'traffic';
          if (!f) bad.push(cid + ' has no front headlight');
          if (!r) bad.push(cid + ' has no rear light');
          if (dim) bad.push(cid + ' has ' + dim + ' dim lamp(s)'); }
        E.toMenu();
        return bad.length ? bad.join('; ') : true;
      });
      if (out !== true) await h.eval(() => { window.__erc.toMenu(); });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-lights-no-solids',
    ask: 'G-163 point 1 + owner glow fix: no solid light blocks, and the glow sits ON the lens - no glow quad reaches past the nose or the tail, nothing floats in front of the car',
    async test(page, h) {
      await h.eval(() => { window.__erc.startRace(window.__erc.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R, bad = [];
        for (const e of [...R.cars, ...R.traffic]) { let gf = 0, gr = 0, solid = 0;
          e.car.root.traverse((q) => { if (q.userData.glow === 1) gf++; if (q.userData.glow === 2) gr++; if (q.userData.lamp) solid++; if (q.isMesh && q.userData.hlight && q.geometry && q.geometry.type === 'BoxGeometry' && q.geometry.parameters && q.geometry.parameters.width <= 0.1) solid++; });
          const cid = e.carId || 'traffic';
          if (solid) bad.push(cid + ' still wears a solid light block');
          if (gf < 2) bad.push(cid + ' has ' + gf + ' front glow(s), want 2');
          if (gr < 2) bad.push(cid + ' has ' + gr + ' rear glow(s), want 2');
          /* the glow must lie ON the body: measure the tilt-space body half-length from the real meshes, then check every glow quad against it */
          const M4 = e.car.root.matrixWorld.constructor, V3 = e.car.root.position.constructor;
          const inv = new M4().copy(e.car.tilt.matrixWorld).invert();
          let half = 0;
          e.car.tilt.traverse((q) => { if (!q.isMesh || q.userData.glow || q.name === 'apexname') return; const g = q.geometry; if (!g) return; g.computeBoundingBox(); const bb = g.boundingBox; if (!bb) return; const m = new M4().multiplyMatrices(inv, q.matrixWorld); for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) { const v = new V3(cx, cy, cz).applyMatrix4(m); half = Math.max(half, Math.abs(v.x)); } });
          e.car.tilt.traverse((q) => { if (q.userData.glow && Math.abs(q.position.x) > half + 0.03) bad.push(cid + ' has a glow floating ' + (Math.abs(q.position.x) - half).toFixed(2) + ' m past the body'); }); }
        E.toMenu();
        return bad.length ? bad.join('; ') : true;
      });
      if (out !== true) await h.eval(() => { window.__erc.toMenu(); });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-headlight-pool',
    ask: 'G-163 point 2: at night the headlights throw a pool of light on the road ahead of the car',
    async test(page, h) {
      const started = await h.eval(() => { const E = window.__erc; const ni = E.PLACES.findIndex((p) => p.tod === 'n'); if (ni < 0) return 'no night place exists'; E.S.cur = 'goblin'; E.startRace(E.PLACES[ni], 3); return 'ok'; });
      if (started !== 'ok') return started;
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the night race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R;
        if (!R.W.night) { E.toMenu(); return 'the picked place is not a night race'; }
        E.step(5, 1 / 60); /* pose the car once so its pool takes its place on the road */
        const car = R.P.car;
        if (!car.pool) { E.toMenu(); return 'the player car has no headlight pool'; }
        if (!car.pool.visible) { E.toMenu(); return 'the headlight pool is not switched on at night'; }
        const pp = new (car.pool.position.constructor)(); car.pool.getWorldPosition(pp);
        const fwd = new (car.root.position.constructor)(); car.root.getWorldDirection(fwd);
        const ahead = (pp.x - car.root.position.x) * fwd.x + (pp.z - car.root.position.z) * fwd.z;
        const m = car.pool.material;
        E.toMenu();
        if (ahead < 2) return 'the light pool sits ' + ahead.toFixed(1) + ' m ahead of the car - it must lie on the road in front';
        if (!m || m.blending !== 2 || !(m.opacity >= 0.25)) return 'the pool is not a soft additive light pool';
        return true;
      });
      if (out !== true) await h.eval(() => { window.__erc.toMenu(); });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-brake-lights',
    ask: 'G-163 point 3: brake lights - the rear lamps and glows flare bright red while the brake is held',
    async test(page, h) {
      await h.eval(() => { const E = window.__erc; E.S.cur = 'goblin'; E.startRace(E.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R;
        const rearOp = () => { let op = -1; R.P.car.root.traverse((q) => { if (q.userData.glow === 2) op = q.material.opacity; }); return op; };
        for (let i = 0; i < 20 && R.t <= 0.2; i++) E.step(30, 1 / 60);
        const off = rearOp();
        E.K.brake = true; E.step(3, 1 / 60);
        const on = rearOp();
        E.K.brake = false; E.step(3, 1 / 60);
        const off2 = rearOp();
        E.toMenu();
        if (off < 0) return 'the player car has no rear glow to flare';
        if (!(on > off)) return 'rear glow did not flare under braking (opacity ' + off + ' -> ' + on + ')';
        if (!(off2 <= off + 0.01)) return 'rear glow stayed flared after the brake was released';
        return true;
      });
      if (out !== true) await h.eval(() => { window.__erc.toMenu(); });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-wrap-both-doors',
    ask: 'G-176: the APEX ARCADE name wrap is on BOTH doors of the Goblin - a strip on each side, each inside the door span between the axles',
    async test(page, h) {
      await h.eval(() => { const E = window.__erc; E.S.cur = 'goblin'; E.startRace(E.PLACES[0], 3); });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R, car = R.P.car, tilt = car.tilt;
        const M4 = car.root.matrixWorld.constructor, V3 = car.root.position.constructor;
        const inv = new M4().copy(tilt.matrixWorld).invert();
        const box = (o) => { const g = o.geometry; g.computeBoundingBox(); const bb = g.boundingBox, m = new M4().multiplyMatrices(inv, o.matrixWorld), r = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }; for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) { const v = new V3(cx, cy, cz).applyMatrix4(m); r.x0 = Math.min(r.x0, v.x); r.x1 = Math.max(r.x1, v.x); r.z0 = Math.min(r.z0, v.z); r.z1 = Math.max(r.z1, v.z); } return r; };
        let fb = null; const strips = [];
        tilt.traverse((q) => { if (!q.isMesh || !q.geometry) return; if (q.name === 'apexname') { strips.push(box(q)); return; } if (q.material === car.paint) { const b = box(q); fb = fb ? { x0: Math.min(fb.x0, b.x0), x1: Math.max(fb.x1, b.x1) } : b; } });
        E.toMenu();
        if (!fb) return 'no painted body found on the player car';
        if (!strips.length) return 'the player goblin wears no APEX ARCADE wrap at all';
        const L = fb.x1 - fb.x0, cx = (fb.x0 + fb.x1) / 2, rearAx = cx - L * 0.31, frontAx = cx + L * 0.31;
        const pos = strips.filter((b) => (b.z0 + b.z1) / 2 > 0), neg = strips.filter((b) => (b.z0 + b.z1) / 2 < 0);
        if (!pos.length) return 'no wrap strip on the +z door';
        if (!neg.length) return 'no wrap strip on the -z door';
        for (const b of strips) { if (b.x0 < rearAx + 0.3 || b.x1 > frontAx - 0.3) return 'a wrap strip spills out of the door span (x ' + b.x0.toFixed(2) + '..' + b.x1.toFixed(2) + ', doors ' + (rearAx + 0.3).toFixed(2) + '..' + (frontAx - 0.3).toFixed(2) + ')'; }
        return true;
      });
      if (out !== true) await h.eval(() => { window.__erc.toMenu(); });
      return out === true ? true : out;
    },
  },
  {
    id: 'play-glow-on-surface',
    ask: 'Lamp glow sits on the measured body surface, lamp-sized - no floating white dots (owner, G-163 follow-up)',
    async test(page, h) {
      const src = fs.readFileSync(path.join(repoRoot, 'apexracer.html'), 'utf8');
      if (!/lampSurf/.test(src)) return 'apexracer.html has no lamp surface measurement (lampSurf) - the glow is not anchored to the measured body surface';
      await h.eval(() => { const E = window.__erc; if (!(E.R && E.R.skids && E.R.P)) E.startRace(E.PLACES[0], 3); return true; });
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R;
        const cars = (R.cars || []).concat(R.traffic || []).map((c) => c.car).filter(Boolean);
        let checked = 0;
        for (const car of cars) {
          let hasLamp = false; const glows = [];
          car.tilt.traverse((q) => { if (q.userData.hlight) hasLamp = true; if (q.userData.glow) glows.push(q); });
          if (hasLamp) continue;
          for (const g of glows) { const p = g.geometry && g.geometry.parameters; if (!p) return 'a lamp glow has no plane geometry on ' + (car.glbKey || 'a car'); if (p.width > 0.36 || p.height > 0.20) return 'a lamp glow is ' + p.width + 'x' + p.height + ' m on ' + (car.glbKey || 'a car') + ' - big enough to hang off the curved nose as a floating dot'; checked++; }
        }
        E.toMenu();
        if (!checked) return 'no lamp-less car glow was checked';
        return true;
      });
      if (out !== true) await h.eval(() => { window.__erc.toMenu(); });
      return out === true ? true : out;
    },
  },
  {
    id: 'never-g-176-p1',
    ask: 'NEVER (G-176): the job report carries an OWNER CHECK IN 30 SECONDS line with the target picture link and what to look at',
    async test(page, h) {
      const rep = fs.readFileSync(path.join(repoRoot, 'jobs/G-176.md'), 'utf8');
      const line = rep.split('\n').find((l) => l.startsWith('OWNER CHECK IN 30 SECONDS:'));
      if (!line) return 'jobs/G-176.md has no OWNER CHECK IN 30 SECONDS line';
      if (!line.includes('https://raw.githubusercontent.com/Attacked-Kraken/18-Games-Casino/game-checks/img/apexracer-2-play.jpg')) return 'the OWNER CHECK line does not carry the target picture link';
      if (!/ - \S/.test(line.split('apexracer-2-play.jpg')[1] || '')) return 'the OWNER CHECK line says nothing about what to look at';
      return true;
    },
  },
  {
    id: 'map-apexracer-current',
    ask: 'STUDIO-STANDARD 9.7 (G-179): the WHERE THINGS ARE map at the top of looks/apexracer.md names the main parts and its line numbers match apexracer.html',
    async test(page, h) {
      const map = fs.readFileSync(path.join(repoRoot, 'looks/apexracer.md'), 'utf8');
      const game = fs.readFileSync(path.join(repoRoot, 'apexracer.html'), 'utf8').split('\n');
      for (const part of ['Menu', 'Garage', 'Driving physics', 'AI', 'Traffic', 'Camera', 'HUD', 'Sounds', 'REALITY']) {
        if (!new RegExp(part, 'i').test(map)) return 'the map does not name ' + part;
      }
      const pairs = [
        ['toMenu', /function toMenu\(/],
        ['renderGarage', /function renderGarage\(/],
        ['makeGlbCar', /function makeGlbCar\(/],
        ['buildWorld', /async function buildWorld\(/],
        ['setupRace', /async function setupRace\(/],
        ['stepPlayer', /function stepPlayer\(/],
        ['stepAI', /function stepAI\(/],
        ['stepTraffic', /function stepTraffic\(/],
        ['musRaceMix', /function musRaceMix\(/],
        ['__reality', /window\.__reality =/],
      ];
      for (const [name, re2] of pairs) {
        const actual = game.findIndex((l) => re2.test(l)) + 1;
        if (!actual) return name + ' not found in apexracer.html';
        const m = map.match(new RegExp(name.replace(/[.]/g, '\\.') + '[^\\n]{0,28}?L(\\d+)'));
        if (!m) return 'the map carries no line number for ' + name;
        if (Math.abs(parseInt(m[1], 10) - actual) > 4) return 'the map says ' + name + ' is at L' + m[1] + ' but apexracer.html has it at L' + actual + ' - refresh the map (STUDIO-STANDARD 9.7)';
      }
      return true;
    },
  },
  {
    id: 'play-cars-visible',
    ask: 'Owner Oct 22 2026: every computer car SHOWS in every city - a real model and a paint bright enough to read at dusk/night, never near-black',
    async test(page, h) {
      const rows = await h.eval(async () => {
        const E = window.__erc, out = [];
        const places = [E.PLACES[0], E.PLACES.find((p) => p.city === 'Honolulu')];
        for (const place of places) {
          E.startRace(place, 3);
          for (let i = 0; i < 80; i++) { if (E.R && E.R.skids && E.R.P) break; await new Promise((r) => setTimeout(r, 250)); }
          if (!(E.R && E.R.P)) return [{ bad: 'race never built at ' + place.city }];
          (E.R.cars || []).forEach((c) => { if (c !== E.R.P && c.car) out.push({ real: !!c.car.glbKey, paint: '#' + c.car.paint.color.getHexString() }); });
          (E.R.traffic || []).forEach((c) => { if (c.car) out.push({ real: !!c.car.glbKey, paint: '#' + c.car.paint.color.getHexString() }); });
          E.toMenu(); await new Promise((r) => setTimeout(r, 400));
        }
        return out;
      });
      if (!Array.isArray(rows) || rows.length < 20) return 'only sampled ' + (rows && rows.length) + ' computer cars - not enough to prove they all show';
      const lum = (hex) => { const n = parseInt(hex.slice(1), 16), f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
      for (const row of rows) {
        if (row.bad) return row.bad;
        if (!row.real) return 'a computer car is not a real model (mockup or missing)';
        if (lum(row.paint) < 0.1) return 'a computer car wears ' + row.paint + ' (luminance ' + lum(row.paint).toFixed(3) + ') - near-black, invisible at dusk/night';
      }
      return true;
    },
  },
  {
    id: 'play-mountains-clear',
    ask: 'Owner Oct 22 2026: mountains out of the road - no tall scenery (mountains, volcano, mesas) comes within 25 m of the road',
    async test(page, h) {
      const res = await h.eval(async () => {
        const E = window.__erc;
        const place = E.PLACES.find((p) => p.city === 'Honolulu');
        E.startRace(place, 3);
        for (let i = 0; i < 80; i++) { if (E.R && E.R.skids && E.R.P) break; await new Promise((r) => setTimeout(r, 250)); }
        if (!(E.R && E.R.P)) return { bad: 'race never built at Honolulu' };
        const R = E.R, T = R.T; let min = 1e9, checked = 0;
        R.W.scene.traverse((o) => {
          if (!(o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position)) return;
          o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox, sy = Math.abs(o.matrixWorld.elements[5]) || 1, sx = Math.abs(o.matrixWorld.elements[0]) || 1;
          const height = (bb.max.y - bb.min.y) * sy, width = (bb.max.x - bb.min.x) * sx;
          if (height <= 55 || width > 3000) return;
          const pos = o.geometry.attributes.position, e = o.matrixWorld.elements, stride = Math.max(1, Math.floor(pos.count / 4000));
          for (let i = 0; i < pos.count; i += stride) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const wx = e[0] * x + e[4] * y + e[8] * z + e[12], wz = e[2] * x + e[6] * y + e[10] * z + e[14]; const q = T.near(wx, wz, 3); if (q) { checked++; if (q.d < min) min = q.d; } }
        });
        return { min, checked };
      });
      if (!res || res.bad) return (res && res.bad) || 'no measurement came back';
      if (!res.checked) return 'no tall scenery vertices were measured at Honolulu';
      if (res.min < 25) return 'tall scenery comes within ' + Math.round(res.min) + ' m of the road at Honolulu - mountains belong off the road';
      return true;
    },
  },
  {
    id: 'play-night-no-blob',
    ask: 'G-206: at night no car blows out to a pink/white blob - the headlight pool stays low-energy on every car, pools still exist, and the ?test=night owner link is in the game',
    async test(page, h) {
      const src = fs.readFileSync(path.join(repoRoot, 'apexracer.html'), 'utf8');
      if (!src.includes("get('test')") || !src.includes("tq === 'night'")) return 'the ?test=night owner-check link is missing from apexracer.html';
      const started = await h.eval(() => { const E = window.__erc; const ni = E.PLACES.findIndex((p) => p.tod === 'n'); if (ni < 0) return 'no night place exists'; E.S.cur = 'goblin'; E.startRace(E.PLACES[ni], 3); return 'ok'; });
      if (started !== 'ok') return started;
      let ready = false;
      for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
      if (!ready) return 'the night race never finished building';
      const out = await h.eval(() => {
        const E = window.__erc, R = E.R;
        if (!R.W.night) { E.toMenu(); return 'the picked place is not a night race'; }
        E.step(5, 1 / 60);
        const rows = [];
        const see = (c) => { if (c && c.car && c.car.pool) rows.push({ op: c.car.pool.material.opacity, cmax: Math.max(c.car.pool.material.color.r, c.car.pool.material.color.g, c.car.pool.material.color.b), vis: !!c.car.pool.parent }); };
        (R.cars || []).forEach(see); (R.traffic || []).forEach(see);
        E.toMenu();
        return rows;
      });
      if (!Array.isArray(out)) return String(out);
      if (out.length < 8) return 'only ' + out.length + ' cars have headlight pools at night - the pools must stay, just weaker';
      for (const r of out) {
        if (!r.vis) return 'a headlight pool is not in the night scene';
        if (r.op > 0.2) return 'a headlight pool has opacity ' + r.op + ' - that additive energy blows the centre car out to a pink/white blob at night (cap 0.2)';
        if (r.cmax > 0.85) return 'a headlight pool color peaks at ' + r.cmax.toFixed(2) + ' - too hot at night (cap 0.85)';
      }
      return true;
    },
  },
  {
    id: 'play-cars-grounded',
    ask: 'G-207 (owner): every computer car in every city sits ON the road for the whole race - the skinned Tokii model shared one skeleton across all its cars and rendered sunk under the road (invisible cars); the pose is baked at load now, so no car may contain a skinned mesh or ride below the road while driving',
    async test(page, h) {
      const nights = [];
      const nPlaces = await h.eval(() => window.__erc.PLACES.length);
      for (let i = 0; i < nPlaces; i++) { const tod = await h.eval((idx) => window.__erc.PLACES[idx].tod, i); if (tod === 'n') nights.push(i); }
      const picks = [nights[0], nights[Math.floor(nights.length / 2)], nights[nights.length - 1]].filter((v, i, a) => v !== undefined && a.indexOf(v) === i);
      for (const ni of picks) {
        const started = await h.eval((idx) => { const E = window.__erc; E.S.cur = 'goblin'; E.startRace(E.PLACES[idx], 3); return 'ok'; }, ni);
        if (started !== 'ok') return started;
        let ready = false;
        for (let i = 0; i < 60 && !ready; i++) { ready = await h.eval(() => !!(window.__erc && window.__erc.R && window.__erc.R.skids && window.__erc.R.P)); if (!ready) await h.wait(200); }
        if (!ready) return 'a night race never finished building';
        const out = await h.eval(() => {
          const E = window.__erc, R = E.R;
          let worst = 0, skinned = 0, cars = 0;
          const census = () => {
            const see = (c) => {
              if (!c || !c.car || !c.car.root) return;
              cars++;
              const root = c.car.root; root.updateWorldMatrix(true, true);
              root.traverse(q => {
                if (!q.isMesh) return;
                if (q.isSkinnedMesh) skinned++;
                q.geometry.computeBoundingBox(); const bb = q.geometry.boundingBox; if (!bb) return;
                const e = q.matrixWorld.elements;
                for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) { const y = cx * e[1] + cy * e[5] + cz * e[9] + e[13]; if (y < worst) worst = y; }
              });
            };
            (R.cars || []).forEach(see); (R.traffic || []).forEach(see);
          };
          census();
          E.K.gas = 1;
          for (let r = 0; r < 4; r++) { for (let i = 0; i < 150; i++) E.step(1, 1 / 30); census(); }
          E.K.gas = 0;
          E.toMenu();
          return { worst: +worst.toFixed(2), skinned, cars };
        });
        if (out.skinned > 0) return 'a car still contains ' + out.skinned + ' skinned meshes - the shared-skeleton model was not baked at load';
        if (out.cars < 10) return 'only ' + out.cars + ' computer cars censused - too few to prove the field';
        if (out.worst < -0.15) return 'a computer car rides ' + out.worst + ' m under the road while driving (place index ' + ni + ') - an invisible car';
      }
      return true;
    },
  },
  {
    id: 'never-g-207-p1',
    ask: 'G-207 fix 1 (owner): the finish-line sign says START on lap 1, the completed/total count on the laps between, and Finish only on the last lap',
    run: async (page, h) => {
      await h.eval(() => { const E = window.__erc; E.startRace(E.PLACES[0], 3); return true; });
      let s0 = null;
      for (let i = 0; i < 40 && !s0; i++) { await h.wait(500); s0 = await h.eval(() => { const R = window.__erc.R; return R && R.P ? R.signTxt : null; }); }
      if (s0 !== 'START') return 'on lap 1 the finish-line sign says ' + JSON.stringify(s0) + ', not START';
      const cross = async (want) => {
        await h.eval(() => { const E = window.__erc, R = E.R, T = R.T, P = R.P; const o = { x: 0, z: 0, h: 0 }; T.at(T.N - 2, 0, o); P.x = o.x; P.z = o.z; P.h = o.h; P.idx = T.N - 2; P.prog = Math.floor(P.prog / T.N) * T.N + (T.N - 2); P.vx = P.vz = 0; return true; });
        return h.eval((w) => { const E = window.__erc, R = E.R; E.K.gas = 1; for (let i = 0; i < 4000 && R.signTxt !== w; i++) E.step(1, 1 / 30); E.K.gas = 0; return R.signTxt; }, want);
      };
      const s1 = await cross('1/3');
      if (s1 !== '1/3') return 'going into lap 2 the sign says ' + JSON.stringify(s1) + ', not 1/3';
      const s2 = await cross('Finish');
      if (s2 !== 'Finish') return 'on the last lap the sign says ' + JSON.stringify(s2) + ', not Finish';
      return null;
    },
  },
];
