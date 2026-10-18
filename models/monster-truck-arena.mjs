// Monster Truck Arena for the 3D model gate (MODELS.md), shown in the venue viewer at real size:
//   tools/venue-viewer.html?m=models/monster-truck-arena.mjs&look=night&name=Monster%20Truck%20Arena&cheer=1
// Wraps venues/kit/truck-arena.js with the EXACT call apexmonstertruck.html makes,
// so the owner approves the very stadium that is in the game.
// v3: the owner put the game back to the J5 version (Oct 18) - this wrapper matches
// that kit (v2 imported J45 layout exports the reverted kit no longer has, which
// crashed the viewer). Pictures: aerial, TV camera, ground level.
export async function buildMonsterTruckArena() {
  const THREE = window.THREE;
  const { buildTruckArena } = await import(new URL('../venues/kit/truck-arena.js', import.meta.url).href);
  const arena = buildTruckArena(THREE);   // the game's own call, no options - identical venue
  const g = new THREE.Group();
  g.add(arena.group);

  // viewer adapter: the J5 crowd is static (no cheer motion), so excite is a no-op;
  // report passes the kit's real counts through with an honest draw-call count.
  const adapter = {
    report() {
      let drawCalls = 0;
      g.traverse((o) => { if (o.isMesh || o.isPoints) drawCalls++; });
      const r = arena.report();
      return { fans: r.fans, capacity: r.fans, drawCalls };
    },
    update() {},
    crowd: { excite() {} },
  };
  window.__venue = { stadium: adapter.report() };
  return {
    group: g, stadium: adapter,
    cams: {
      front: { pos: [0, 24, 58], at: [0, 2, 0] },        // TV camera: over the south stands, across the floor
      side: { pos: [78, 30, 0], at: [0, 2, 0] },          // end view down the 110m floor
      floor: { pos: [-40, 2.0, -10], at: [10, 3, 5] },    // ground level on the dirt, ramps + crush cars ahead
    },
  };
}
