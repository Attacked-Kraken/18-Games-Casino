/* OWNER rim-fit job (Oct 28 2026): rims fit IN the tyre, every press switches the rims,
   no fake fetched wheels, brakes look like brakes. Window 6. */
const LOUD = '#ff00ff';
function wheelCensus() {
  const root = window.__reality.player; if (!root) return null;
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), e = inv.elements;
  const toRoot = (b) => {
    const pts = [];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z])
      pts.push([e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]);
    return { min: [0, 1, 2].map((i) => Math.min(...pts.map((p) => p[i]))), max: [0, 1, 2].map((i) => Math.max(...pts.map((p) => p[i]))) };
  };
  const faces = [], cals = [], brakes = [], others = [];
  root.traverse((q) => {
    if (!q.isMesh || !q.geometry) return;
    const g = q.geometry; if (!g.boundingBox) g.computeBoundingBox();
    const wb = g.boundingBox.clone().applyMatrix4(q.matrixWorld);
    const b = toRoot(wb);
    const rec = { b, cx: (b.min[0] + b.max[0]) / 2, cy: (b.min[1] + b.max[1]) / 2, cz: (b.min[2] + b.max[2]) / 2, verts: g.attributes.position ? g.attributes.position.count : 0, col: q.material && q.material.color ? '#' + q.material.color.getHexString() : '?', map: !!(q.material && q.material.map) };
    if (q.userData.acc === 'rimface') faces.push(rec);
    else if (q.userData.acc === 'caliper') cals.push(rec);
    else if (q.userData.acc === 'brake') brakes.push(rec);
    else others.push(rec);
  });
  const tyrePts = [];
  root.traverse((q) => {
    if (!q.isMesh || !q.geometry || q.userData.acc) return;
    const p = q.geometry.attributes.position;
    if (!p || p.count < 3000) return;
    const e2 = q.matrixWorld.elements, step = Math.max(1, Math.floor(p.count / 4000));
    for (let i = 0; i < p.count; i += step) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const wx = e2[0] * x + e2[4] * y + e2[8] * z + e2[12], wy = e2[1] * x + e2[5] * y + e2[9] * z + e2[13], wz = e2[2] * x + e2[6] * y + e2[10] * z + e2[14];
      tyrePts.push([e[0] * wx + e[4] * wy + e[8] * wz + e[12], e[1] * wx + e[5] * wy + e[9] * wz + e[13], e[2] * wx + e[6] * wy + e[10] * wz + e[14]]);
    }
  });
  return { faces, cals, brakes, others, tyrePts };
}
const CENSUS_SRC = wheelCensus.toString();
async function install(page, h) {
  return h.eval((src) => { window.__wc = eval('(' + src + ')'); return typeof window.__wc === 'function'; }, CENSUS_SRC).catch(() => false);
}
async function buildCar(page, h, rim, extra) {
  await install(page, h);
  const attempt = () => h.eval(async (arg) => {
    const E = window.__erc, wait = (ms) => new Promise((rs) => setTimeout(rs, ms));
    if (E.toMenu) E.toMenu();
    for (let i = 0; i < 40 && E.G.mode === 'loading'; i++) await wait(150);
    const cfg = { ...(E.S.cars.goblin || {}), rim: arg.rim, rimCol: '#ff00ff', cal: '#e01b2b', wrap: 'name', fin: 0, aero: 0, wheel: 0, ...(arg.extra || {}) };
    E.S.cars.goblin = cfg; E.S.cur = 'goblin';
    const prev = window.__reality && window.__reality.player;
    E.openGarage();
    for (let i = 0; i < 60 && window.__reality.player === prev; i++) await wait(150);
    await wait(350);
    return !!window.__reality.player && E.G.mode === 'garage';
  }, { rim, extra: extra || null }).catch(() => false);
  if (await attempt()) return true;
  return attempt();
}
export default [
  {
    id: 'never-caliper-billboard',
    ask: 'Is the brake caliper a small block on a real brake disc, not a red billboard in the wheel?',
    async test(page, h) {
      if (!await buildCar(page, h, 3)) return 'garage car did not build';
      return h.eval(() => {
        const c = window.__wc();
        if (!c) return 'no car';
        if (c.cals.length !== 4) return 'expected 4 calipers, found ' + c.cals.length;
        for (const k of c.cals) {
          const ex = [k.b.max[0] - k.b.min[0], k.b.max[1] - k.b.min[1], k.b.max[2] - k.b.min[2]].sort((a, b) => a - b);
          if (ex[2] > 0.13) return 'caliper face is ' + ex[2].toFixed(2) + ' m - a billboard, not a caliper';
          if (ex[0] > 0.09) return 'caliper is ' + ex[0].toFixed(2) + ' m thick - a slab, not a caliper';
        }
        if (c.brakes.length !== 4) return 'expected a brake disc at all 4 wheels, found ' + c.brakes.length;
        return true;
      }).catch((err) => 'eval failed: ' + err);
    },
  },
  {
    id: 'never-rim-seat-size',
    ask: 'Do the fetched rims fit IN the tyre: bare rims at a real diameter, face seated at the tyre surface?',
    async test(page, h) {
      const bands = { 3: [0.60, 0.86], 4: [0.60, 0.86], 5: [0.60, 0.86] };
      let ref = null;
      for (const style of [2, 3, 4, 5]) {
        if (!await buildCar(page, h, style)) return 'garage car did not build for style ' + style;
        const r = await h.eval((st) => {
          const c = window.__wc();
          if (!c || c.faces.length !== 4) return 'style ' + st + ': expected 4 rim faces, found ' + (c ? c.faces.length : 0);
          const rows = [];
          for (const f of c.faces) {
            const side = f.cx >= 0 ? 1 : -1; /* root space: the car's length lies along z, its width along x - the seat is measured on x */
            const pts = c.tyrePts.filter((p) => Math.abs(p[1] - f.cy) < 0.5 && Math.abs(p[2] - f.cz) < 0.55 && Math.sign(p[0]) === side);
            if (pts.length < 20) return 'style ' + st + ': too few tyre points near a wheel (' + pts.length + ')';
            const tyreOuter = side > 0 ? Math.max(...pts.map((p) => p[0])) : Math.min(...pts.map((p) => p[0]));
            const rimOuter = side > 0 ? f.b.max[0] : f.b.min[0];
            rows.push({ rimD: f.b.max[1] - f.b.min[1], seat: (rimOuter - tyreOuter) * side });
          }
          return rows;
        }, style).catch(() => null);
        if (!r) return 'seat census failed for style ' + style;
        if (typeof r === 'string') return r;
        if (style === 2) { ref = r.map((x) => x.rimD); continue; }
        const [lo, hi] = bands[style];
        for (let i = 0; i < 4; i++) {
          const ratio = r[i].rimD / ref[i];
          if (ratio < lo || ratio > hi) return 'style ' + style + ': rim diameter is ' + ratio.toFixed(2) + 'x the tyre - does not fit in the tyre';
          if (r[i].seat < -0.025 || r[i].seat > 0.03) return 'style ' + style + ': rim face sits ' + r[i].seat.toFixed(2) + ' m from the tyre surface - buried or poking out';
        }
      }
      return true;
    },
  },
  {
    id: 'never-rim-fake',
    ask: 'Is a fetched rim never faked: real verts and colours when loaded, and no red stand-in if its model drops?',
    async test(page, h) {
      const bands = { 2: 20000, 3: 40000, 4: 100000, 5: 100000 };
      for (const style of [2, 3, 4, 5]) {
        if (!await buildCar(page, h, style)) return 'garage car did not build for style ' + style;
        const r = await h.eval(() => {
          const c = window.__wc();
          if (!c) return null;
          return { verts: c.faces.reduce((a, f) => a + f.verts, 0), loud: c.faces.filter((f) => f.col === '#ff00ff').length, n: c.faces.length };
        }).catch(() => null);
        if (!r) return 'census failed for style ' + style;
        if (r.loud) return 'style ' + style + ': a rim face wears the rim colour - a fake stand-in';
        if (r.verts < bands[style]) return 'style ' + style + ': only ' + r.verts + ' rim verts - not the real model';
      }
      const ready = await h.eval(() => (window.__erc.wheelState ? window.__erc.wheelState() : null)).catch(() => null);
      if (!ready) return 'the game exposes no wheelState hook - cannot prove the no-fake path';
      const dropped = await h.eval(() => (typeof window.__erc.dropWheel === 'function' ? (window.__erc.dropWheel(4), true) : false)).catch(() => false);
      if (!dropped) return 'the game exposes no dropWheel hook - cannot prove the no-fake path';
      if (!await buildCar(page, h, 4)) return 'garage car did not rebuild after the Mesh model dropped';
      const mid = await h.eval(() => {
        const c = window.__wc();
        if (!c) return null;
        return { verts: c.faces.reduce((a, f) => a + f.verts, 0), loud: c.faces.filter((f) => f.col === '#ff00ff').length };
      }).catch(() => null);
      if (mid && mid.loud) return 'with the Mesh model dropped, a red fake appeared (' + mid.verts + ' verts in rim colour)';
      const back = await h.poll(() => h.eval(() => {
        const c = window.__wc();
        return c ? c.faces.reduce((a, f) => a + f.verts, 0) : 0;
      }).catch(() => 0), (v) => v >= 100000, 30000).catch(() => false);
      if (!back) return 'the real Mesh wheel never swapped in after its model re-loaded';
      return true;
    },
  },
  {
    id: 'play-rims-switch-presses',
    ask: 'Does every Rims press visibly switch the rims on the car?',
    async test(page, h) {
      await install(page, h);
      await h.eval(() => { if (window.__erc) window.__erc.toMenu(); return true; }).catch(() => {});
      await h.wait(300);
      let opened = await h.press('#mGarage').catch(() => false);
      if (!opened) opened = await h.eval(() => { const b = document.getElementById('mGarage'); if (b) { b.click(); return true; } return false; }).catch(() => false);
      if (!opened) return 'Garage button could not be pressed';
      await h.wait(800);
      return h.eval(async () => {
        const wait = (ms) => new Promise((rs) => setTimeout(rs, ms));
        const tab = [...document.querySelectorAll('#gtabs button, #gtabs .gt')].find((b) => /Rims/.test(b.textContent || ''));
        if (!tab) return 'no Rims tab';
        tab.click(); await wait(600);
        let prevSig = '';
        for (let style = 0; style <= 5; style++) {
          const card = document.querySelector('[data-rim="' + style + '"]');
          if (!card) return 'no rim card for style ' + style;
          card.click(); await wait(1400);
          const c = window.__wc();
          if (!c || !c.faces.length) return 'style ' + style + ': no rim faces after pressing its card';
          const cluster = c.others.filter((o) => c.faces.some((f) => Math.abs(o.cx - f.cx) < 0.55 && Math.abs(o.cy - f.cy) < 0.55 && Math.abs(o.cz - f.cz) < 0.55));
          const sig = c.faces.reduce((a, f) => a + f.verts, 0) + '+' + cluster.reduce((a, o) => a + o.verts, 0) + '|' + c.faces.map((f) => f.col + (f.map ? 'T' : '')).join(',');
          if (sig === prevSig) return 'style ' + style + ': pressing its card changed nothing on the car';
          prevSig = sig;
        }
        return true;
      }).catch((err) => 'eval failed: ' + err);
    },
  },
];
