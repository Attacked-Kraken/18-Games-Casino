/* OWNER Nov 1 2026: five fetched rim+tyre swaps (Pure Sport, Carbon Disc, Pirelli Spoke, Tuner 5-Spoke, Sci-Fi Pod) in the garage Rims tab.
   Fails when choosing one changes nothing (the car keeps the old wheel) - it counts the wheel-area vertices and needs each style to differ
   from the stock Classic 5 and from each other, and the tyre must stay dark with a white Rim Color. Reads the live scene only. */
const READ = async (st, rimCol) => {
  const E = window.__erc, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const cfg = { ...(E.S.cars.goblin || {}), rim: st, rimCol, rimKeep: 0, cal: '#e01b2b', wrap: 'shardcamo', fin: 'metal', aero: 0, wheel: 0 };
  E.S.cars.goblin = cfg; E.S.cur = 'goblin';
  try { E.openGarage(); } catch (e) { return null; }
  let last = null;
  for (let i = 0; i < 300; i++) { /* the model loads in the background; wait until the count settles (max 45 s) */
    await wait(150);
    const root = window.__reality && window.__reality.player; if (!root) continue;
    root.updateMatrixWorld(true);
    let verts = 0, bright = 0;
    root.traverse((q) => {
      if (!q.isMesh || !q.geometry) return;
      if (!q.geometry.boundingBox) q.geometry.computeBoundingBox();
      const bb = q.geometry.boundingBox.clone().applyMatrix4(q.matrixWorld), c = bb.getCenter(bb.min.clone()), s = bb.getSize(bb.min.clone());
      if (Math.abs(c.x) < 0.6 || s.y > 1.0 || s.y < 0.25) return;
      const v = q.geometry.attributes.position ? q.geometry.attributes.position.count : 0; verts += v;
      const m = Array.isArray(q.material) ? q.material[0] : q.material;
      if (v > 20000 && m && m.color && (m.color.r + m.color.g + m.color.b) / 3 > 0.7) bright++;
    });
    if (verts && last && Math.abs(verts - last.verts) < 1 && i > 12 && (st < 6 || verts !== window.__rn0)) return { verts, bright };
    last = { verts, bright };
  }
  return last;
};
const SRC = READ.toString();
const read = (h, st, col) => h.eval((a) => (0, eval)('(' + a.src + ')')(a.st, a.col), { src: SRC, st, col }).catch(() => null);
export default [
  {
    id: 'play-garage-new-rims-differ',
    ask: 'Owner Nov 1: each new rim in the Rims tab must really change the wheels - never leave the old wheel on the car.',
    async test(page, h) {
      const base = await read(h, 0, '#f2f2f2');
      if (!base) return 'the garage car did not build';
      await h.eval((n) => { window.__rn0 = n; }, base.verts).catch(() => {});
      const seen = { 0: base.verts }, bad = [];
      for (let st = 6; st <= 10; st++) {
        const m = await read(h, st, '#f2f2f2');
        if (!m) { bad.push('style ' + st + ' did not build'); continue; }
        for (const k of Object.keys(seen)) if (seen[k] === m.verts) bad.push('style ' + st + ' has the same ' + m.verts + ' wheel vertices as style ' + k + ' (the swap changed nothing)');
        seen[st] = m.verts;
        if (m.bright) bad.push('style ' + st + ': a big wheel part turns the white Rim Color (tyre must stay dark)');
      }
      return bad.length ? bad.join('; ') : true;
    },
  },
];
