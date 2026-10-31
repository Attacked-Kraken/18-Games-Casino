/* OWNER rim LOOK checks (Oct 31 2026 10:26 AM "something that could visually check the mismatches ... the tire white"): the older
   rim tests count meshes and measure sizes, so a white tyre or a Deep Dish that ignores the Rim Color tab passed. Measured on main
   (local render, Oct 31): Turbine style 2 - the tyre mesh (44967 verts) takes the rim colour (#ffffff); Deep Dish style 3 - the rim is
   #d25f00 whatever Rim Color is chosen, and a 826-vert ring beside it turns white; Mesh style 4 is #9d9d9d. Tests only read the live
   scene (no pictures), they cannot hang the robot. */
const SETUP = async (st, rimCol) => {
  const E = window.__erc, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const cfg = { ...(E.S.cars.goblin || {}), rim: st, rimCol, cal: '#e01b2b', wrap: 'name', fin: 'metal', aero: 0, wheel: 0 };
  E.S.cars.goblin = cfg; E.S.cur = 'goblin';
  const prev = window.__reality && window.__reality.player;
  try { E.openGarage(); } catch (e) { return null; }
  for (let i = 0; i < 60 && !(window.__reality.player && window.__reality.player !== prev); i++) { await wait(100); }
  await wait(1500);
  const root = window.__reality && window.__reality.player; if (!root) return null;
  root.updateMatrixWorld(true);
  const lum = (c) => { const r = c.r, g = c.g, b = c.b; return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const out = [];
  root.traverse((q) => {
    if (!q.isMesh || !q.geometry) return;
    if (!q.geometry.boundingBox) q.geometry.computeBoundingBox();
    const bb = q.geometry.boundingBox.clone().applyMatrix4(q.matrixWorld);
    const ctr = bb.getCenter(bb.min.clone()), sz = bb.getSize(bb.min.clone());
    if (Math.abs(ctr.x) < 0.6 || sz.y > 1.0 || sz.y < 0.25) return;
    const mat = Array.isArray(q.material) ? q.material[0] : q.material;
    if (!mat || !mat.color) return;
    out.push({ acc: q.userData.acc || '', v: q.geometry.attributes.position ? q.geometry.attributes.position.count : 0, hex: '#' + mat.color.getHexString(), l: lum(mat.color), name: q.name || '' });
  });
  return out;
};
const SRC = SETUP.toString();
const read = (h, st, col) => h.eval((a) => (0, eval)('(' + a.src + ')')(a.st, a.col), { src: SRC, st, col }).catch(() => null);
const lumHex = (hex) => { const n = parseInt(hex.slice(1), 16); const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
export default [
  {
    id: 'never-rim-tyre-takes-rim-colour',
    ask: 'Owner Oct 31: with a white rim colour the tyre must stay dark rubber - it must never take the rim colour.',
    async test(page, h) {
      const bad = [];
      for (let st = 0; st <= 5; st++) {
        const m = await read(h, st, '#f2f2f2');
        if (!m) return 'style ' + st + ': the garage car did not build, so tyre colour could not be read';
        for (const x of m) {
          if (x.acc || x.v < 500) continue;
          if (x.l > 0.55) { bad.push('style ' + st + ' (' + x.v + '-vert wheel part ' + (x.name || 'unnamed') + ') is ' + x.hex + ' with Rim Color set to #f2f2f2'); break; }
        }
      }
      return bad.length ? 'a tyre / wheel part turns the rim colour instead of staying dark rubber: ' + bad.join('; ') : true;
    },
  },
  {
    id: 'never-rim-colour-ignored',
    ask: 'Owner Oct 31: every rim style must follow the Rim Color tab - choosing white must not leave an orange or grey rim.',
    async test(page, h) {
      const bad = [];
      const want = lumHex('#f2f2f2');
      for (let st = 0; st <= 5; st++) {
        const m = await read(h, st, '#f2f2f2');
        if (!m) return 'style ' + st + ': the garage car did not build, so rim colour could not be read';
        const faces = m.filter((x) => x.acc === 'rimface');
        if (!faces.length) { bad.push('style ' + st + ' has no rim face'); continue; }
        const f = faces[0];
        if (Math.abs(lumHex(f.hex) - want) > 0.25) bad.push('style ' + st + ' rim is ' + f.hex + ' but Rim Color is #f2f2f2');
      }
      return bad.length ? 'the Rim Color tab is ignored: ' + bad.join('; ') : true;
    },
  },
];
