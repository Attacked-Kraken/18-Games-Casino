// Ballpark venue for Apex Baseball (MODELS.md, WAITING OWNER)
// Built from venues/ballpark.md: real sizes (bases 27.43m, rubber 18.44m,
// foul poles 99m, wall 99m/122m), stands wrapping home plate, crowd.
// View in: tools/venue-viewer.html?m=models/ballpark.mjs&look=field&name=Ballpark

export async function buildBallpark() {
  const THREE = window.THREE;
  const group = new THREE.Group();
  group.name = 'ballpark';

  const M = (c) => new THREE.MeshLambertMaterial({ color: c });

  // --- Field: diamond (bases 27.43m apart) ---
  const B = 27.43, HB = B / Math.SQRT2; // half-diagonal

  // Grass (large circle, mown stripes via canvas)
  const gc = document.createElement('canvas'); gc.width = gc.height = 256;
  const gg = gc.getContext('2d');
  for (let i = 0; i < 8; i++) {
    gg.fillStyle = i % 2 ? '#2f8c3d' : '#2a7f36';
    gg.fillRect(0, i * 32, 256, 32);
  }
  const grassT = new THREE.CanvasTexture(gc);
  const grass = new THREE.Mesh(
    new THREE.CircleGeometry(140, 40),
    new THREE.MeshLambertMaterial({ map: grassT })
  );
  grass.rotation.x = -Math.PI / 2;
  group.add(grass);

  // Infield dirt (diamond shape)
  const dirtShape = new THREE.Shape();
  dirtShape.moveTo(0, HB); dirtShape.lineTo(HB, 0);
  dirtShape.lineTo(0, -HB); dirtShape.lineTo(-HB, 0);
  dirtShape.closePath();
  const dirt = new THREE.Mesh(
    new THREE.ShapeGeometry(dirtShape),
    M(0x9a6b3f)
  );
  dirt.rotation.x = -Math.PI / 2; dirt.position.y = 0.01;
  group.add(dirt);

  // Bases (white 38cm squares) at diamond corners
  const baseGeo = new THREE.BoxGeometry(0.38, 0.1, 0.38);
  const baseMat = M(0xffffff);
  [[HB, 0], [0, HB], [-HB, 0]].forEach(([x, z]) => {
    const b = new THREE.Mesh(baseGeo, baseMat);
    b.position.set(x, 0.05, z);
    group.add(b);
  });

  // Home plate (pentagon)
  const plateShape = new THREE.Shape();
  plateShape.moveTo(-0.2, 0); plateShape.lineTo(0.2, 0);
  plateShape.lineTo(0.2, -0.2); plateShape.lineTo(0, -0.35);
  plateShape.lineTo(-0.2, -0.2); plateShape.closePath();
  const plate = new THREE.Mesh(new THREE.ShapeGeometry(plateShape), M(0xffffff));
  plate.rotation.x = -Math.PI / 2; plate.position.set(0, 0.02, -HB);
  group.add(plate);

  // Pitcher's mound (5.5m across, 0.25m high, rubber 18.44m from plate)
  const mound = new THREE.Mesh(
    new THREE.CylinderGeometry(2.75, 2.75, 0.25, 20),
    M(0x9a6b3f)
  );
  mound.position.set(0, 0.12, -HB + 18.44);
  group.add(mound);
  const rubber = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.15), M(0xffffff)
  );
  rubber.position.set(0, 0.28, -HB + 18.44);
  group.add(rubber);

  // Foul lines (white, to poles at 99m)
  const lineMat = M(0xffffff);
  [[1, 1], [-1, 1]].forEach(([sx, sz]) => {
    const len = 99;
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, len), lineMat
    );
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = sx * sz * Math.PI / 4;
    line.position.set(sx * len / 2 / Math.SQRT2, 0.02, -HB + sz * len / 2 / Math.SQRT2);
    group.add(line);
  });

  // Foul poles (yellow, 99m)
  const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 12, 8);
  const poleMat = M(0xffcc00);
  [[1], [-1]].forEach(([sx]) => {
    const p = new THREE.Mesh(poleGeo, poleMat);
    p.position.set(sx * 99 / Math.SQRT2, 6, -HB + 99 / Math.SQRT2);
    group.add(p);
  });

  // Outfield wall (99m lines, 122m centre, 3m high, dark green)
  const wallMat = M(0x1a4d2e);
  const wallPts = [];
  for (let a = -45; a <= 45; a += 5) {
    const rad = a * Math.PI / 180;
    const dist = 99 + (122 - 99) * Math.cos(rad); // 99 at poles, 122 at centre
    wallPts.push([Math.sin(rad) * dist, -HB + Math.cos(rad) * dist]);
  }
  wallPts.forEach(([x, z], i) => {
    if (i === 0) return;
    const [px, pz] = wallPts[i - 1];
    const len = Math.hypot(x - px, z - pz);
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(len, 3, 0.5), wallMat
    );
    wall.position.set((x + px) / 2, 1.5, (z + pz) / 2);
    wall.rotation.y = Math.atan2(x - px, z - pz) + Math.PI / 2;
    group.add(wall);
  });

  // --- Stands: wrap from foul pole to foul pole behind home plate ---
  const standMat = M(0x8a8a8a);
  const seatColors = [0xcc3333, 0x3366cc, 0xffcc33, 0x33cc66];
  let fanCount = 0;
  const fans = new THREE.Group();

  // 3 tiers of stands in an arc behind home plate
  for (let tier = 0; tier < 3; tier++) {
    const radius = 35 + tier * 12;
    const yBase = 4 + tier * 8;
    for (let a = -70; a <= 70; a += 4) {
      const rad = (a - 90) * Math.PI / 180; // behind home plate
      const x = Math.sin(rad) * radius;
      const z = -HB + Math.cos(rad) * radius * 0.7;
      // Stand section
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(4, 6, 8), standMat
      );
      stand.position.set(x, yBase, z);
      stand.rotation.y = -rad;
      group.add(stand);
      // Crowd (instanced dots)
      for (let s = 0; s < 12; s++) {
        const fan = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 6, 5),
          M(seatColors[(s + tier) % 4])
        );
        fan.position.set(
          x + (Math.random() - 0.5) * 3,
          yBase + 3.5 + Math.random() * 1.5,
          z + (Math.random() - 0.5) * 6
        );
        fans.add(fan);
        fanCount++;
      }
    }
  }
  group.add(fans);

  // Light towers (6 banks on roof)
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
  for (let i = 0; i < 6; i++) {
    const a = (-60 + i * 24 - 90) * Math.PI / 180;
    const x = Math.sin(a) * 65, z = -HB + Math.cos(a) * 65 * 0.7;
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 25, 8), M(0x333333)
    );
    tower.position.set(x, 12.5, z);
    group.add(tower);
    const bank = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 0.5), lightMat
    );
    bank.position.set(x, 26, z);
    group.add(bank);
  }

  // Centre-field scoreboard
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(12, 6, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  board.position.set(0, 12, -HB + 125);
  group.add(board);
  const boardText = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 5),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  boardText.position.set(0, 12, -HB + 124.7);
  boardText.rotation.y = Math.PI;
  group.add(boardText);

  const report = () => ({
    bases_m: B,
    rubber_m: 18.44,
    fans: fanCount,
    wall_lf_m: 99, wall_cf_m: 122,
  });

  return { group, report };
}

export default { buildBallpark };
