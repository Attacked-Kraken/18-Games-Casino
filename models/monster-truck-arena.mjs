// Monster Truck Arena for the 3D model gate (MODELS.md), shown in the venue viewer at real size:
//   tools/venue-viewer.html?m=models/monster-truck-arena.mjs&look=night&name=Monster%20Truck%20Arena&cheer=1
// The venue kit (venues/kit/truck-arena.js) with the EXACT config apexmonstertruck.html
// plays in (JOB J45) - same jumps, same bowl, same crowd - so the owner approves the
// very stadium that is in the game. Pictures: aerial, TV camera, ground level.
export async function buildMonsterTruckArena() {
  const THREE = window.THREE;
  const { buildTruckArena, TRUCK_CAR_SPOTS } = await import(new URL('../venues/kit/truck-arena.js', import.meta.url).href);
  const arena = buildTruckArena(THREE);   // the game's own call, no options - identical venue
  const g = new THREE.Group();
  g.add(arena.group);

  // crush cars on the lines (venue props at real car size, 4.4m - the game builds its own)
  const paints = [0x2e7fd9, 0xd9d9d9, 0x37c26a, 0xe8c832, 0xb03030, 0x30455e, 0xd97f2e, 0x8a93a3];
  TRUCK_CAR_SPOTS.forEach((s, i) => {
    const car = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({ color: paints[i % paints.length], roughness: 0.4, metalness: 0.3 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x10161f, roughness: 0.2, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.62, 1.9), paint);
    body.position.y = 0.66; car.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.55, 1.72), glass);
    cab.position.set(-0.15, 1.22, 0); car.add(cab);
    car.position.set(s.x, 0, s.z);
    car.rotation.y = s.ry;
    g.add(car);
  });
  arena.setScreen('APEX ARCADE', 'MONSTER TRUCK', 'ARENA');

  // viewer adapter: live crowd (stands on cheer), pyro, honest counts
  let excite = 0.12;
  const adapter = {
    report() {
      let drawCalls = 0;
      g.traverse((o) => { if (o.isMesh || o.isPoints) drawCalls++; });
      const r = arena.report();
      return { fans: r.fans, capacity: 48000, drawCalls };
    },
    update(dt) {
      excite = Math.max(0.12, excite - dt * 0.05);
      arena.stepCrowd(performance.now() / 1000, excite);
      arena.stepFx(dt);
    },
    crowd: { excite(v) { excite = Math.min(1.2, v); arena.firePyro(); } },
  };
  window.__venue = { stadium: adapter.report() };
  return {
    group: g, stadium: adapter,
    cams: {
      front: { pos: [0, 30, 58], at: [-6, 2, 0] },        // TV camera: over the south stands, across the floor
      side: { pos: [92, 38, 0], at: [0, 2, 0] },          // end view down the 110m floor
      floor: { pos: [-47, 2.1, -9], at: [20, 4, 4] },     // ground level at the start gate
    },
  };
}
