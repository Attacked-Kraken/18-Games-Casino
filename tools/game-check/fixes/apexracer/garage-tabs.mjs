// G-372 garage sweep, split ONE TAB PER TEST (VP Oct 31 2026): the four 5-tab sweeps ran 94-109 s each, over the robot's per-test clock, and every Racer PR played them.
// Same page-side census + checks as before (moved here unchanged); one tab = ~20 s, tagged by the part it exercises so a rims PR plays only the rim tabs.
const makeTest = (tabs, label) =>     async (page, h) => {
      const TABS17 = tabs;
      /* the whole tab runs page-side in one call: every option click rebuilds the car synchronously,
         so the census after each click is exact and the test stays inside the robot's per-test clock */
      const runTab = (tab) => {
        const PERF = { tire: 1, eng: 1, turbo: 1, nos: 1 };
        const E = window.__erc, R = window.__reality;
        const census = () => { const root = R && R.player; const S = E.S, G = E.G; const acc = {}, mats = new Set(), pos = []; let meshes = 0, rimHex = null, calHex = null;
          const hashTex = (img) => { try { const cx = img.getContext('2d'); const d = cx.getImageData(0, 0, Math.min(64, img.width), Math.min(8, img.height)).data; let s = 0; for (let i = 0; i < d.length; i += 16) s = (s * 31 + d[i] + d[i + 1] * 7 + d[i + 2] * 13) >>> 0; return img.width + 'x' + img.height + ':' + s; } catch (e) { return 'tex'; } };
          if (root) root.traverse((q) => { if (q.userData && q.userData.acc) { const a = q.userData.acc; acc[a] = (acc[a] || 0) + 1; const p = q.getWorldPosition(q.position.clone()); pos.push(a + '@' + p.x.toFixed(2) + ',' + p.y.toFixed(2) + ',' + p.z.toFixed(2)); } if (!q.isMesh) return; meshes++; const ms = q.material ? (Array.isArray(q.material) ? q.material : [q.material]) : []; for (const mm of ms) mats.add((mm.color ? mm.color.getHexString() : '-') + '/' + (mm.roughness ?? '-') + '/' + (mm.metalness ?? '-') + '/' + (mm.envMapIntensity ?? '-') + '/' + (mm.clearcoat ?? '-') + '/' + (mm.iridescence ?? '-') + '/' + (mm.sheen ?? '-') + '/' + (mm.map ? (mm.map.image && mm.map.image.getContext ? hashTex(mm.map.image) : 'map') : ''));
            if (q.userData && q.userData.acc) { if (q.userData.acc === 'rimface' && ms[0] && ms[0].color) rimHex = ms[0].color.getHexString(); if (q.userData.acc === 'caliper' && ms[0] && ms[0].color) calHex = ms[0].color.getHexString(); } });
          const st = document.getElementById('gstats');
          return { gSel: E.G.gSel, cfg: JSON.stringify(E.S.cars[E.G.gSel] || {}), acc, mats: [...mats].sort().join(';'), pos: pos.sort().join(';'), meshes, stats: st ? st.textContent : '', rimHex, calHex }; };
        const opts = () => [...document.querySelectorAll('#gopts .go')].map((el, i) => ({ i, on: el.classList.contains('on'), pv: el.classList.contains('pv'), input: !!el.querySelector('input'), label: ((el.querySelector('b') || {}).textContent || el.dataset.paint || el.dataset.rc || el.dataset.cal || el.dataset.wc || el.dataset.glow || el.dataset.fin || el.dataset.wrap || el.dataset.car || el.textContent.trim().replace(/\s+/g, ' ')).slice(0, 26), data: Object.assign({}, el.dataset) }));
        const fails = [];
        const tname = tab;
        const partCheck = (label, now) => {
          for (const p of (now.pos ? now.pos.split(';') : [])) { if (!p) continue; const m = p.split('@')[1].split(',').map(Number); if (Math.abs(m[0]) > 1.3 || m[1] < -0.25 || m[1] > 2.2 || Math.abs(m[2]) > 3.2) fails.push(tname + ' > ' + label + ': a fitted part floats off the car at ' + p); }
          if (tab === 'rim' && now.acc.rimface !== 4) fails.push(tname + ' > ' + label + ': only ' + (now.acc.rimface || 0) + ' rim faces on the car, not 4');
          if (tab === 'cal' && now.acc.caliper !== 4) fails.push(tname + ' > ' + label + ': only ' + (now.acc.caliper || 0) + ' calipers on the car, not 4');
        };
        const tb = document.querySelector('.gt[data-t="' + tab + '"]');
        if (!tb) return { fails, checked: 0, total: 0, noTab: true };
        tb.click();
        let base = census();
        const list = opts();
        let checked = 0;
        const sig = (c) => c.mats + '|' + c.pos + '|' + c.meshes + '|' + JSON.stringify(c.acc) + '|' + c.gSel;
        const isNeutral = (o) => o.data.wrap === 'none' || o.data.glow === '' || o.data.up === '0';
        let neutral = null;
        if (list.length && isNeutral(list[0]) && list[0].on) neutral = base;
        for (const o of list) {
          if (o.input) continue;
          const cur = opts(); const btnNow = cur[o.i] || {};
          if (btnNow.on) { checked++; if (isNeutral(o)) neutral = base; partCheck(o.label + ' (fitted)', base); continue; }
          const before = base;
          const el = document.querySelectorAll('#gopts .go')[o.i];
          if (!el) continue;
          el.click();
          const now = census();
          const after = opts(); const btn = after[o.i] || {};
          const applied = !!(btn.on || btn.pv || now.cfg !== before.cfg);
          const lookDiff = now.mats !== before.mats || now.pos !== before.pos || now.meshes !== before.meshes || now.gSel !== before.gSel || JSON.stringify(now.acc) !== JSON.stringify(before.acc);
          const statDiff = now.stats !== before.stats;
          checked++;
          if (isNeutral(o)) neutral = now;
          if (!applied) fails.push(tname + ' > ' + o.label + ': the option did not apply when tapped');
          else if (neutral && !isNeutral(o)) { const dead = PERF[tab] ? now.stats === neutral.stats : sig(now) === sig(neutral); if (dead) fails.push(tname + ' > ' + o.label + (PERF[tab] ? ': applies but the car stats do not move' : ': applies but changes nothing on the car')); }
          else if (PERF[tab] ? !statDiff : !lookDiff) fails.push(tname + ' > ' + o.label + (PERF[tab] ? ': applies but the car stats do not move' : ': applies but changes nothing on the car'));
          if (tab === 'rimCol' && o.data.rc && now.rimHex) { const want = o.data.rc.slice(1).toLowerCase(); if (now.rimHex !== want) fails.push(tname + ' > ' + o.label + ': the rim reads ' + now.rimHex + ', not the picked ' + want); }
          if (tab === 'cal' && o.data.cal && now.calHex) { const want = o.data.cal.slice(1).toLowerCase(); if (now.calHex !== want) fails.push(tname + ' > ' + o.label + ': the caliper reads ' + now.calHex + ', not the picked ' + want); }
          if (tab === 'glow') { const want = o.data.glow ? 1 : 0; if ((now.acc.underglow || 0) !== want) fails.push(tname + ' > ' + o.label + ': underglow parts read ' + (now.acc.underglow || 0) + ', expected ' + want); }
          if (tab === 'aero' && +(o.data.up || 0) > 0 && !(now.acc.wing >= 1)) fails.push(tname + ' > ' + o.label + ': no spoiler wing on the car');
          if (tab === 'kit' && +(o.data.up || 0) > 0 && !(now.acc.bodykit >= 1)) fails.push(tname + ' > ' + o.label + ': no body kit parts on the car');
          partCheck(o.label, now);
          base = now;
        }
        if (tab === 'cars') { const home = window.__sweepHome; const b = [...document.querySelectorAll('#gopts .go')].find((el) => el.dataset.car === home); if (b && E.G.gSel !== home) b.click(); }
        return { fails, checked, total: list.length };
      };
      await h.poll(() => h.eval(() => !!window.__erc), (v) => !!v, 30000);
      await h.eval(() => { const E = window.__erc; window.__sweepSave = JSON.stringify({ cars: E.S.cars, cur: E.S.cur, cash: E.S.cash }); E.S.cash = 99999999; if (!E.S.cars[E.S.cur]) { const ids = Object.keys(E.S.cars); if (ids.length) E.S.cur = ids[0]; } window.__sweepHome = E.S.cur; E.openGarage(); });
      await h.wait(400);
      const fails = [], unchecked = [];
      for (const [tab, tname] of TABS17) {
        const r = await h.eval(runTab, tab);
        await h.shot();
        if (!r || r.noTab || !r.total) { unchecked.push(tname); continue; }
        if (!r.checked) unchecked.push(tname);
        for (const f of r.fails || []) fails.push(f.replace(tab + ' >', tname + ' >'));
      }
      await h.eval(() => { const E = window.__erc, s = window.__sweepSave; if (s) { const o = JSON.parse(s); E.S.cars = o.cars; E.S.cur = o.cur; E.S.cash = o.cash; delete window.__sweepSave; delete window.__sweepHome; const key = Object.keys(localStorage).find((k) => k.indexOf('apexracer1_') === 0); if (key) try { localStorage.setItem(key, JSON.stringify(E.S)); } catch (e) {} } try { E.openGarage(); } catch (e) {} });
      if (fails.length) return 'G-372 garage tab ' + label + ': ' + [...new Set(fails)].slice(0, 6).join(' | ') + (fails.length > 6 ? ' | +' + (fails.length - 6) + ' more' : '');
      if (unchecked.length) return { inconclusive: 'G-372 garage tab ' + label + ' - tabs that could not be checked: ' + unchecked.join(', ') };
      return true;
    };
const TABS = [["cars", "Cars"], ["paint", "Paint"], ["wrap", "Wraps"], ["fin", "Finish"], ["rim", "Rims"], ["rimCol", "Rim Color"], ["wheel", "Wheel Size"], ["cal", "Calipers"], ["tint", "Tint"], ["aero", "Spoiler"], ["kit", "Body Kit"], ["glow", "Underglow"], ["tire", "Tires"], ["eng", "Engine"], ["turbo", "Turbo"], ["nos", "Nitro"]];
const PARTS = {"cars": ["garage"], "paint": ["garage", "paint"], "wrap": ["garage", "wraps"], "fin": ["garage", "wraps", "paint"], "rim": ["garage", "rims", "wheels"], "rimCol": ["garage", "rims", "wheels"], "wheel": ["garage", "rims", "wheels"], "cal": ["garage", "rims", "wheels"], "tint": ["garage", "body"], "aero": ["garage", "body"], "kit": ["garage", "body"], "glow": ["garage", "body"], "tire": ["garage"], "eng": ["garage"], "turbo": ["garage"], "nos": ["garage"]};
export default TABS.map(([tab, name]) => ({
  id: 'play-garage-tab-' + tab, parts: PARTS[tab],
  ask: 'G-372 garage tab ' + name + ': opens the garage, applies every option on this tab and checks the car changed (census + robot picture); a dead option is named in the red line.',
  test: makeTest([[tab, name]], name),
}));
