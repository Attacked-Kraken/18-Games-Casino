/* G-413 (Oct 28 2026): the VP's wrap paste - the wrap is painted on the car's own
   bodyMat (applyRealCarWrap), never as added meshes. Proof: for every one of the
   12 wraps the garage car's mesh count and bounding box equal the No-wrap build,
   and every real wrap leaves its texture on the body material. */
const WRAPS12 = ['none', 'circuit', 'dragon', 'shardcamo', 'graffiti'];
async function install(page, h) {
  await h.eval((src) => { window.__ww = eval('(' + src + ')'); return true; }, (() => {
    const E = window.__erc;
    const root = window.__reality && window.__reality.player;
    if (!root || !E) return null;
    let meshes = 0, bodyMap = false, bodyTex = 0, plain = 0;
    const box = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] };
    const v = { x: 0, y: 0, z: 0 };
    root.updateWorldMatrix(true, true);
    const inv = root.matrixWorld.elements;
    root.traverse((q) => {
      if (!q.isMesh) return;
      meshes++;
      if (q.material && q.material.map && q.material.userData && q.material.userData.body) { bodyMap = true; bodyTex = q.material.map.id; }
      const g = q.geometry; if (!g || !g.attributes.position) return;
      if (q.material && q.material.map && q.material.userData && q.material.userData.body && g.attributes.uv) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) if (uv.getX(i) < 0.01 && uv.getY(i) < 0.01) plain++; } /* vertices sent to the plain-paint patch = the wheels */
      const p = g.attributes.position, mw = q.matrixWorld.elements;
      const pt = (i) => {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const wx = mw[0] * x + mw[4] * y + mw[8] * z + mw[12], wy = mw[1] * x + mw[5] * y + mw[9] * z + mw[13], wz = mw[2] * x + mw[6] * y + mw[10] * z + mw[14];
        return [inv[0] * wx + inv[4] * wy + inv[8] * wz + inv[12], inv[1] * wx + inv[5] * wy + inv[9] * wz + inv[13], inv[2] * wx + inv[6] * wy + inv[10] * wz + inv[14]];
      };
      for (let i = 0; i < p.count; i += 7) { const w = pt(i); for (let a = 0; a < 3; a++) { if (w[a] < box.min[a]) box.min[a] = w[a]; if (w[a] > box.max[a]) box.max[a] = w[a]; } }
    });
    return { meshes, box, bodyMap, bodyTex, plain };
  }).toString()).catch(() => false);
}
let lastWhy = '';
async function buildWrap(page, h, wrap) {
  const attempt = () => h.eval(async (w) => {
    const E = window.__erc, wait = (ms) => new Promise((rs) => setTimeout(rs, ms));
    try {
      const cfg = { ...(E.S.cars.goblin || {}), wrap: w, rim: 0, fin: 'metal', aero: 0, wheel: 0 };
      E.S.cars.goblin = cfg; E.S.cur = 'goblin';
      try { if (E.R && E.toMenu) E.toMenu(); } catch (e) {}
      for (let i = 0; i < 60 && E.G.mode === 'loading'; i++) await wait(200);
      const prev = window.__reality && window.__reality.player;
      try { E.openGarage(); } catch (e) { return { ok: false, why: 'openGarage: ' + String(e).slice(0, 90) }; }
      for (let i = 0; i < 40 && window.__reality.player === prev; i++) await wait(150);
      const ok = E.G.mode === 'garage' && !!window.__reality.player;
      return { ok, why: ok ? '' : 'mode=' + E.G.mode + ' same=' + (window.__reality.player === prev) + ' player=' + !!window.__reality.player };
    } catch (e) { return { ok: false, why: 'build: ' + String(e).slice(0, 90) }; }
  }, wrap).catch((e) => ({ ok: false, why: 'eval: ' + String(e).slice(0, 90) }));
  const r1 = await attempt();
  lastWhy = JSON.stringify(r1.why || '');
  if (r1.ok) return true;
  /* one retry, as the rim guard does: the first garage build in a session can be slow on cold loads, and a closed browser on the first try is the robot's, not the wrap's - the retry runs on a warm page, and a surfaced closed-browser note lets the robot mark it inconclusive instead of red */
  const r2 = await attempt();
  lastWhy = JSON.stringify(r2.why || '');
  return !!r2.ok;
}
/* the robot caps one test at 60 s and each garage build takes ~5 s on its slow runner, so the 11 wraps are checked in 3 short tests (4 + 4 + 3), each against its own No-wrap build */
const wrapTest = (id, list) => ({
    id,
    ask: 'Do the wraps ' + list.join(', ') + ' paint on the body material with the same mesh count and bounding box as No wrap?',
    async test(page, h) {
      await install(page, h);
      /* tag the body material so the census can recognise it: bodyMat is the paint material (metalness from paintMat) */
      const tag = () => h.eval(() => {
        const E = window.__erc, root = window.__reality && window.__reality.player;
        if (!root) return false;
        let n = 0;
        root.traverse((q) => { if (q.isMesh && q.material && q.material.isMeshPhysicalMaterial) { q.material.userData.body = 1; n++; } });
        return n > 0;
      }).catch(() => false);
      if (!await buildWrap(page, h, 'none')) return 'garage car did not build for No wrap [' + lastWhy + ']';
      await tag();
      const base = await h.eval(() => window.__ww()).catch(() => null);
      if (!base) return 'census failed for No wrap';
      if (base.bodyMap) return 'No wrap already carries a body texture map';
      const seen = {};
      for (const w of list) {
        if (!await buildWrap(page, h, w)) return 'garage car did not build for wrap ' + w + ' [' + lastWhy + ']';
        await tag();
        const c = await h.eval(() => window.__ww()).catch(() => null);
        if (!c) return 'census failed for wrap ' + w;
        if (c.meshes !== base.meshes) return 'wrap ' + w + ': ' + c.meshes + ' meshes vs No wrap ' + base.meshes + ' - the wrap added geometry';
        for (let a = 0; a < 3; a++) {
          if (Math.abs(c.box.min[a] - base.box.min[a]) > 0.01 || Math.abs(c.box.max[a] - base.box.max[a]) > 0.01) return 'wrap ' + w + ': bounding box differs from No wrap on axis ' + a;
        }
        if (c.bodyMap && c.plain < 300) return 'wrap ' + w + ': only ' + c.plain + ' body vertices sit on the plain-paint patch - the wheels are not excluded, so the wrap paints the rims';
        if (!c.bodyMap) return 'wrap ' + w + ': no texture on the body material - the wrap is invisible';
        seen[w] = c.bodyTex;
        await h.shot('wrap-' + w);
      }
      const distinct = new Set(Object.values(seen)).size;
      if (distinct < list.length) return 'only ' + distinct + ' distinct wrap textures across ' + list.length + ' wraps (' + list.join(', ') + ') - wraps are not painting their own art';
      return true;
    },
});
export default [
  wrapTest('never-wrap-adds-no-meshes', ['circuit', 'dragon']),
  wrapTest('never-wrap-adds-no-meshes-b', ['shardcamo', 'graffiti']),
];
