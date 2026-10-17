// Main sport motorcycle for JOB J2 (motorcycle-world) — v2
// REALISTIC build: sculpted lathe tank, extruded fairings, tube exhaust/frame,
// spoked wheels with brake discs, articulated rider. No raw boxes/cones for bodywork.
// Returns { group, wheels } — wheels spin via pivot.rotation.x
// NEVER: wheels as hollow see-through tori or sinking below ground (looks/motorcycle-world.md)

export function buildMotorcycle(colorHex = 0xc01818) {
  const g = new THREE.Group();
  const wheels = [];

  // ---------- materials ----------
  const paint = new THREE.MeshPhysicalMaterial({
    color: colorHex, roughness: 0.28, metalness: 0.35,
    clearcoat: 0.9, clearcoatRoughness: 0.12
  });
  const paintDark = new THREE.MeshPhysicalMaterial({
    color: 0x141416, roughness: 0.35, metalness: 0.3, clearcoat: 0.7
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.95 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.35, metalness: 0.85 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.25, metalness: 0.95 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x232326, roughness: 0.5, metalness: 0.7 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.75 });
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0e18, roughness: 0.05, metalness: 0.9, clearcoat: 1
  });
  const screenMat = new THREE.MeshPhysicalMaterial({
    color: 0x8a97a8, roughness: 0.08, metalness: 0.2,
    transparent: true, opacity: 0.45, clearcoat: 1, side: THREE.DoubleSide
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xf4f8ff, emissive: 0xdceaff, emissiveIntensity: 1.4, roughness: 0.15
  });
  const tailLensMat = new THREE.MeshStandardMaterial({
    color: 0x550000, emissive: 0xff2020, emissiveIntensity: 1.2, roughness: 0.2
  });

  const shadowed = (m) => { m.castShadow = true; return m; };

  // limb between two points (capsule) — organic, not boxy
  function limb(a, b, r, mat) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return shadowed(m);
  }
  // tube along points — exhaust, frame, bars
  function tube(points, r, mat, segs = 32) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return shadowed(new THREE.Mesh(new THREE.TubeGeometry(curve, segs, r, 12), mat));
  }

  // ---------- wheels: tire + 5-spoke rim + brake disc, grounded ----------
  const TIRE_R = 0.325; // outer radius
  function makeWheel(x, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, TIRE_R, z);
    // tire
    const tire = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.08, 18, 40), tireMat));
    tire.rotation.y = Math.PI / 2;
    pivot.add(tire);
    // rim ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.022, 10, 32), rimMat);
    ring.rotation.y = Math.PI / 2;
    pivot.add(ring);
    // 5 spoke bars (10 spokes) radiating in the wheel plane
    for (let i = 0; i < 5; i++) {
      const holder = new THREE.Group();
      holder.rotation.x = (i / 5) * Math.PI * 2; // sweep about wheel axle
      for (const sy of [1, -1]) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.30, 0.055), rimMat);
        sp.position.set(0, sy * 0.10, 0);
        holder.add(sp);
      }
      pivot.add(holder);
    }
    // hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 14), darkMetal);
    hub.rotation.z = Math.PI / 2;
    pivot.add(hub);
    // brake disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.016, 28), steelMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = 0.055;
    pivot.add(disc);
    g.add(pivot);
    wheels.push(pivot);
    return pivot;
  }
  makeWheel(0, 0.72);   // front
  makeWheel(0, -0.73);  // rear

  // ---------- fuel tank: lathe teardrop, stretched ----------
  const tankPts = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.09, 0.008),
    new THREE.Vector2(0.135, 0.035), new THREE.Vector2(0.148, 0.075),
    new THREE.Vector2(0.132, 0.115), new THREE.Vector2(0.10, 0.15),
    new THREE.Vector2(0.058, 0.175), new THREE.Vector2(0.012, 0.185)
  ];
  const tank = shadowed(new THREE.Mesh(new THREE.LatheGeometry(tankPts, 28), paint));
  tank.scale.set(1, 2.4, 1); // stretch lathe height -> tank length along bike
  tank.rotation.x = Math.PI / 2 - 0.12; // lie back slightly, nose down
  tank.position.set(0, 0.62, 0.18);
  g.add(tank);
  // tank cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 14), darkMetal);
  cap.position.set(0, 0.795, 0.10);
  g.add(cap);

  // ---------- seat + tail unit: sculpted ----------
  const tailPts = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.085, 0.01),
    new THREE.Vector2(0.115, 0.05), new THREE.Vector2(0.105, 0.10),
    new THREE.Vector2(0.07, 0.15), new THREE.Vector2(0.028, 0.185),
    new THREE.Vector2(0.001, 0.20)
  ];
  const tail = shadowed(new THREE.Mesh(new THREE.LatheGeometry(tailPts, 24), paint));
  tail.scale.set(0.85, 2.0, 1); // stretch -> tail length along bike
  tail.rotation.x = -(Math.PI / 2) + 0.35; // tip up at back
  tail.position.set(0, 0.60, -0.42);
  g.add(tail);
  // seat pad
  const seat = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), leather));
  seat.scale.set(0.95, 0.38, 1.9);
  seat.position.set(0, 0.70, -0.28);
  g.add(seat);
  // taillight
  const tl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), tailLensMat);
  tl.scale.set(1.6, 0.7, 0.6);
  tl.position.set(0, 0.72, -0.78);
  g.add(tl);

  // ---------- front nose fairing: extruded side profile with bevel ----------
  const noseShape = new THREE.Shape();
  noseShape.moveTo(0, 0);
  noseShape.bezierCurveTo(0.10, 0.02, 0.20, 0.06, 0.26, 0.13);  // lower nose
  noseShape.bezierCurveTo(0.30, 0.19, 0.28, 0.26, 0.20, 0.30);  // nose tip up
  noseShape.bezierCurveTo(0.12, 0.335, 0.02, 0.33, -0.06, 0.28); // top back to tank
  noseShape.bezierCurveTo(-0.10, 0.20, -0.08, 0.08, 0, 0);
  const noseGeo = new THREE.ExtrudeGeometry(noseShape, {
    depth: 0.24, bevelEnabled: true, bevelThickness: 0.05,
    bevelSize: 0.045, bevelSegments: 4, curveSegments: 16
  });
  noseGeo.translate(0, 0, -0.12);
  const nose = shadowed(new THREE.Mesh(noseGeo, paint));
  nose.rotation.y = Math.PI / 2; // extrude axis -> bike Z... shape XY -> after rot, shape X -> world -Z?
  nose.rotation.y = -Math.PI / 2;
  nose.position.set(0, 0.52, 0.78);
  nose.scale.set(1, 1, 1);
  g.add(nose);
  // headlights: dual angled lenses in the nose
  for (const sx of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), lensMat);
    hl.scale.set(0.9, 0.75, 0.55);
    hl.position.set(sx * 0.085, 0.72, 1.02);
    hl.rotation.y = sx * 0.35;
    hl.rotation.x = -0.15;
    g.add(hl);
  }

  // ---------- side fairings: extruded panels ----------
  const fairShape = new THREE.Shape();
  fairShape.moveTo(0, 0);
  fairShape.bezierCurveTo(0.18, -0.02, 0.34, 0.02, 0.42, 0.10);
  fairShape.bezierCurveTo(0.44, 0.16, 0.36, 0.22, 0.22, 0.24);
  fairShape.bezierCurveTo(0.10, 0.25, -0.02, 0.18, -0.04, 0.08);
  fairShape.bezierCurveTo(-0.05, 0.03, -0.02, 0.0, 0, 0);
  const fairGeo = new THREE.ExtrudeGeometry(fairShape, {
    depth: 0.03, bevelEnabled: true, bevelThickness: 0.02,
    bevelSize: 0.018, bevelSegments: 3, curveSegments: 12
  });
  for (const sx of [-1, 1]) {
    const f = shadowed(new THREE.Mesh(fairGeo, paint));
    f.rotation.y = -Math.PI / 2;
    f.position.set(sx * 0.16, 0.42, 0.42);
    f.scale.set(1, 1, 1);
    if (sx < 0) { f.position.x = -0.16; }
    g.add(f);
  }
  // belly pan
  const belly = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), paintDark));
  belly.scale.set(0.75, 0.55, 1.6);
  belly.position.set(0, 0.30, 0.15);
  g.add(belly);

  // ---------- windshield: curved screen ----------
  const screen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.26, 0.22, 20, 1, true, -0.6, 1.2),
    screenMat
  );
  screen.position.set(0, 0.88, 0.72);
  screen.rotation.x = 0.5; // tilt back at top, wide end down
  g.add(screen);

  // ---------- frame: twin-spar tubes ----------
  for (const sx of [-1, 1]) {
    g.add(tube([
      [sx * 0.09, 0.62, 0.55], [sx * 0.10, 0.58, 0.10],
      [sx * 0.10, 0.55, -0.35], [sx * 0.09, 0.50, -0.62]
    ], 0.028, darkMetal));
  }
  // swingarm
  for (const sx of [-1, 1]) {
    g.add(tube([
      [sx * 0.09, 0.42, -0.30], [sx * 0.085, 0.36, -0.55], [sx * 0.07, 0.325, -0.73]
    ], 0.024, rimMat));
  }

  // ---------- front fork + fender ----------
  for (const sx of [-1, 1]) {
    const fork = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.62, 12), steelMat));
    fork.position.set(sx * 0.085, 0.55, 0.66);
    fork.rotation.x = 0.42; // rake
    g.add(fork);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.030, 0.30, 12), darkMetal);
    lower.position.set(sx * 0.085, 0.35, 0.72);
    lower.rotation.x = 0.42;
    g.add(lower);
  }
  // front fender: curved hugger over wheel
  const fender = shadowed(new THREE.Mesh(
    new THREE.TorusGeometry(0.345, 0.045, 10, 20, 1.5), paint));
  fender.rotation.y = Math.PI / 2;
  fender.rotation.x = 0; // arc over top
  fender.position.set(0, 0.325, 0.72);
  fender.rotation.z = 0;
  // orient arc to top: torus arc starts at +X; rotate so arc covers top
  fender.rotation.set(0, Math.PI / 2, 0);
  const fenderArc = new THREE.Group();
  fenderArc.add(fender);
  fenderArc.rotation.x = -0.5; // swing arc over the front-top of wheel
  g.add(fenderArc);

  // ---------- handlebar + mirrors + grips ----------
  g.add(tube([
    [-0.26, 0.92, 0.52], [-0.12, 0.94, 0.56], [0, 0.93, 0.57],
    [0.12, 0.94, 0.56], [0.26, 0.92, 0.52]
  ], 0.016, darkMetal, 20));
  for (const sx of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 10), leather);
    grip.rotation.z = Math.PI / 2 - sx * 0.25;
    grip.position.set(sx * 0.28, 0.915, 0.515);
    g.add(grip);
    // mirror stalk + head
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), darkMetal);
    stalk.position.set(sx * 0.20, 1.0, 0.55);
    stalk.rotation.z = -sx * 0.35;
    g.add(stalk);
    const mirror = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), paintDark));
    mirror.scale.set(1.3, 0.75, 0.45);
    mirror.position.set(sx * 0.245, 1.07, 0.55);
    g.add(mirror);
  }

  // ---------- exhaust: curved header into tapered muffler ----------
  g.add(tube([
    [0.07, 0.42, 0.30], [0.10, 0.32, 0.05], [0.11, 0.30, -0.25],
    [0.13, 0.36, -0.50], [0.15, 0.44, -0.62]
  ], 0.032, steelMat));
  const muffler = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.38, 18), steelMat));
  muffler.rotation.x = Math.PI / 2 - 0.28;
  muffler.position.set(0.155, 0.50, -0.72);
  g.add(muffler);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 18), darkMetal);
  tip.rotation.x = Math.PI / 2 - 0.28;
  tip.position.set(0.155, 0.555, -0.895);
  g.add(tip);

  // ---------- engine block: sculpted ----------
  const engine = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), darkMetal));
  engine.scale.set(0.85, 0.9, 1.15);
  engine.position.set(0, 0.38, 0.12);
  g.add(engine);
  // radiator
  const rad = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.20, 0.05), paintDark);
  rad.position.set(0, 0.52, 0.52);
  rad.rotation.x = 0.35;
  g.add(rad);

  // ---------- chain + sprockets ----------
  const sprocket = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20), steelMat);
  sprocket.rotation.z = Math.PI / 2;
  sprocket.position.set(-0.075, 0.325, -0.73);
  g.add(sprocket);
  g.add(tube([[-0.075, 0.415, -0.73], [-0.075, 0.44, -0.30]], 0.012, darkMetal, 8));
  g.add(tube([[-0.075, 0.235, -0.73], [-0.075, 0.34, -0.30]], 0.012, darkMetal, 8));
  // footpegs
  for (const sx of [-1, 1]) {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.09, 8), darkMetal);
    peg.rotation.z = Math.PI / 2;
    peg.position.set(sx * 0.16, 0.30, -0.18);
    g.add(peg);
  }

  // ---------- rider: articulated racing tuck ----------
  const H = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);
  // pelvis / hips
  const hips = shadowed(new THREE.Mesh(H(0.105, 0.12), leather));
  hips.position.set(0, 0.80, -0.30);
  hips.rotation.x = 1.15;
  g.add(hips);
  // torso leaning forward over tank
  const chestA = new THREE.Vector3(0, 0.86, -0.26);
  const chestB = new THREE.Vector3(0, 1.02, 0.10);
  g.add(limb(chestA, chestB, 0.115, leather));
  // shoulders pad
  const shoulders = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 10), leather));
  shoulders.scale.set(1.45, 0.8, 0.9);
  shoulders.position.set(0, 1.0, 0.06);
  g.add(shoulders);
  // helmet + visor
  const helmetPos = new THREE.Vector3(0, 1.10, 0.22);
  const helmet = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 14), paint));
  helmet.position.copy(helmetPos);
  g.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 10), visorMat);
  visor.scale.set(0.82, 0.55, 0.62);
  visor.position.set(0, 1.095, 0.285);
  g.add(visor);
  // arms: shoulder -> elbow -> grip
  for (const sx of [-1, 1]) {
    const sh = new THREE.Vector3(sx * 0.16, 1.00, 0.06);
    const el = new THREE.Vector3(sx * 0.22, 0.90, 0.30);
    const gr = new THREE.Vector3(sx * 0.28, 0.915, 0.515);
    g.add(limb(sh, el, 0.048, leather));
    g.add(limb(el, gr, 0.042, leather));
    const glove = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), leather));
    glove.position.copy(gr);
    g.add(glove);
  }
  // legs: hip -> knee -> footpeg
  for (const sx of [-1, 1]) {
    const hp = new THREE.Vector3(sx * 0.09, 0.80, -0.28);
    const kn = new THREE.Vector3(sx * 0.16, 0.62, 0.02);
    const ft = new THREE.Vector3(sx * 0.16, 0.31, -0.18);
    g.add(limb(hp, kn, 0.068, leather));
    g.add(limb(kn, ft, 0.052, leather));
    const boot = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), leather));
    boot.scale.set(0.9, 0.8, 1.5);
    boot.position.set(sx * 0.16, 0.29, -0.14);
    g.add(boot);
  }

  return { group: g, wheels };
}
