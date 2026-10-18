/* Monster truck arena at real sizes from venues/truck-arena.md:
   110x50m dirt floor with jumps, car crush lines, barriers, full stadium bowl
   with 3-tier stands, 12k crowd, big screens. Night lighting preset.
     import { buildTruckArena } from './venues/kit/truck-arena.js';
     const arena = buildTruckArena(THREE); scene.add(arena.group); arena.report()
   Metres: floor 110 x 50, bowl ~140 x 80 overall. */

export const TRUCK_ARENA = {
  floorL: 110, floorW: 50,
  jumpH: [2, 3, 4], megaRampH: 6,
  carsPerLine: 5, barriers: true,
  tiers: 3, fans: 12000,
};

export function buildTruckArena(THREE, o = {}) {
  const K = TRUCK_ARENA, group = new THREE.Group();
  group.name = 'truck-arena';

  // Dirt floor 110x50m
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x6b472a, roughness: 1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(K.floorL, K.floorW), dirtMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Jumps: 6 dirt ramps (2-4m) in doubles + 1 mega ramp (6m)
  const rampMat = new THREE.MeshStandardMaterial({ color: 0x7d5732, roughness: 1 });
  const jumps = [];
  const mkRamp = (x, z, w, h, rotY) => {
    const g = new THREE.BoxGeometry(w, h, w * 0.7);
    const m = new THREE.Mesh(g, rampMat);
    m.position.set(x, h / 2, z);
    m.rotation.y = rotY;
    m.castShadow = true;
    group.add(m);
    jumps.push({ x, z, h });
  };
  // Doubles in the middle
  mkRamp(-20, 0, 12, 3, 0); mkRamp(-8, 0, 12, 3, 0);
  mkRamp(8, 0, 12, 4, 0); mkRamp(20, 0, 12, 4, 0);
  mkRamp(-14, -15, 10, 2, 0.3); mkRamp(14, 15, 10, 2, -0.3);
  // Mega ramp at one end
  mkRamp(0, -20, 16, K.megaRampH, 0);

  // Car crush lines: 2 rows of 5 cars
  const carMat = new THREE.MeshStandardMaterial({ color: 0x2e7fd9, roughness: 0.5, metalness: 0.4 });
  const cars = [];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < K.carsPerLine; i++) {
      const car = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.4, 2.0), carMat);
      car.position.set(-12 + i * 6, 0.7, 12 + row * 6);
      car.castShadow = true;
      group.add(car);
      cars.push(car);
    }
  }

  // Concrete barriers around floor
  const barMat = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, roughness: 0.8 });
  const barGeo = new THREE.BoxGeometry(6, 1.2, 0.6);
  for (let i = 0; i < 18; i++) {
    for (const [x, z, ry] of [
      [-51 + i * 6, -26.5, 0], [-51 + i * 6, 26.5, 0],
      [-56.5, -24 + i * 3, Math.PI/2], [56.5, -24 + i * 3, Math.PI/2],
    ]) {
      const b = new THREE.Mesh(barGeo, barMat);
      b.position.set(x, 0.6, z); b.rotation.y = ry;
      group.add(b);
    }
  }

  // Stadium bowl: 3 tiers on 4 sides
  const standMat = new THREE.MeshStandardMaterial({ color: 0x3a4150, roughness: 0.9 });
  const W = K.floorL + 20, D = K.floorW + 20;
  for (let side = 0; side < 4; side++) {
    const ang = side * Math.PI / 2;
    for (let tier = 0; tier < K.tiers; tier++) {
      const w = (side % 2 === 0 ? W : D) + tier * 30;
      const d = 18, hgt = 8 + tier * 10;
      const stand = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d), standMat);
      const rad = (side % 2 === 0 ? D : W) / 2 + d / 2 + tier * 15;
      stand.position.set(Math.sin(ang) * rad, hgt / 2, Math.cos(ang) * rad);
      stand.rotation.y = ang;
      group.add(stand);
    }
  }

  // Crowd: 12,000 instanced fans
  const fanGeo = new THREE.BoxGeometry(0.5, 1.1, 0.35);
  const fans = new THREE.InstancedMesh(fanGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), K.fans);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  const palette = [0xd94f2e, 0x2e7fd9, 0x37c26a, 0xe8c832, 0x9a4fd9, 0xd9d9d9];
  let fi = 0;
  for (let side = 0; side < 4 && fi < K.fans; side++) {
    const ang = side * Math.PI / 2;
    for (let tier = 0; tier < K.tiers && fi < K.fans; tier++) {
      const y = 8 + tier * 10 + 1.2;
      const rad = (side % 2 === 0 ? D : W) / 2 + 9 + tier * 15;
      const per = Math.floor(K.fans / 12);
      const span = (side % 2 === 0 ? W : D) + tier * 30 - 10;
      for (let i = 0; i < per && fi < K.fans; i++, fi++) {
        const t = (i / per - 0.5) * span;
        dummy.position.set(
          Math.sin(ang) * rad + Math.cos(ang) * t,
          y, Math.cos(ang) * rad - Math.sin(ang) * t
        );
        dummy.rotation.y = ang + Math.PI;
        dummy.updateMatrix();
        fans.setMatrixAt(fi, dummy.matrix);
        fans.setColorAt(fi, col.setHex(palette[(Math.random() * palette.length) | 0]));
      }
    }
  }
  fans.count = fi;
  fans.instanceMatrix.needsUpdate = true;
  if (fans.instanceColor) fans.instanceColor.needsUpdate = true;
  group.add(fans);

  // Big screens at both ends
  for (const sz of [-1, 1]) {
    const scr = new THREE.Mesh(
      new THREE.BoxGeometry(20, 12, 1),
      new THREE.MeshBasicMaterial({ color: 0x0a0f1a })
    );
    scr.position.set(0, 25, sz * (D / 2 + 25));
    group.add(scr);
  }

  const report = () => ({ fans: fi, jumps: jumps.length, cars: cars.length });

  return { group, report, K };
}
