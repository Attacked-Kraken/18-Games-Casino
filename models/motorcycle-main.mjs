// Main sport motorcycle for JOB J2 (motorcycle-world) — v3
// Crotch-rocket supersport: SOLID extruded aluminum twin-spar frame + swingarm,
// human rider (tapered torso/limbs, neck, real helmet with chin bar + curved visor),
// aggressive full fairing, clip-on bars, upswept tail. No raw boxes/cones for bodywork.
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
  tail.rotation.x = -(Math.PI / 2) + 0.48; // aggressive upsweep (crotch rocket)
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
  tl.position.set(0, 0.75, -0.78);
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
  // headlights: slim aggressive slanted lenses (crotch rocket)
  for (const sx of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), lensMat);
    hl.scale.set(1.35, 0.55, 0.5);
    hl.position.set(sx * 0.095, 0.73, 1.00);
    hl.rotation.y = sx * 0.5;
    hl.rotation.z = -sx * 0.28;
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

  // ---------- frame: SOLID twin-spar aluminum beams (not hollow tubes) ----------
  const aluMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.32, metalness: 0.9 });
  const sparShape = new THREE.Shape();
  sparShape.moveTo(0, 0);
  sparShape.lineTo(1.12, 0.015);
  sparShape.lineTo(1.15, 0.09);
  sparShape.lineTo(0.06, 0.15);
  sparShape.lineTo(0, 0.06);
  sparShape.lineTo(0, 0);
  const sparGeo = new THREE.ExtrudeGeometry(sparShape, {
    depth: 0.05, bevelEnabled: true, bevelThickness: 0.012,
    bevelSize: 0.010, bevelSegments: 2, curveSegments: 4
  });
  sparGeo.translate(0, 0, -0.025); // center width
  for (const sx of [-1, 1]) {
    const spar = shadowed(new THREE.Mesh(sparGeo, aluMat));
    spar.rotation.y = Math.PI / 2; // shape X -> world -Z (front to rear)
    spar.position.set(sx * 0.095, 0.52, 0.58);
    spar.rotation.x = -0.06; // slight drop toward rear
    g.add(spar);
  }
  // steering head: solid block tying spars to fork
  const steerHead = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 14), aluMat));
  steerHead.position.set(0, 0.62, 0.56);
  steerHead.rotation.x = 0.42;
  g.add(steerHead);
  // cross brace between spars
  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.19, 10), darkMetal);
  brace.rotation.z = Math.PI / 2;
  brace.position.set(0, 0.56, -0.05);
  g.add(brace);
  // swingarm: SOLID plates (not tubes)
  const swingShape = new THREE.Shape();
  swingShape.moveTo(0, 0);
  swingShape.lineTo(0.46, 0.01);
  swingShape.lineTo(0.48, 0.07);
  swingShape.lineTo(0.02, 0.10);
  swingShape.lineTo(0, 0);
  const swingGeo = new THREE.ExtrudeGeometry(swingShape, {
    depth: 0.035, bevelEnabled: true, bevelThickness: 0.008,
    bevelSize: 0.008, bevelSegments: 2, curveSegments: 4
  });
  swingGeo.translate(0, 0, -0.0175);
  for (const sx of [-1, 1]) {
    const sw = shadowed(new THREE.Mesh(swingGeo, aluMat));
    sw.rotation.y = Math.PI / 2;
    sw.position.set(sx * 0.085, 0.34, -0.28);
    g.add(sw);
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

  // ---------- handlebar: low clip-ons (crotch rocket) + mirrors + grips ----------
  g.add(tube([
    [-0.24, 0.855, 0.50], [-0.12, 0.87, 0.54], [0, 0.865, 0.55],
    [0.12, 0.87, 0.54], [0.24, 0.855, 0.50]
  ], 0.016, darkMetal, 20));
  for (const sx of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 10), leather);
    grip.rotation.z = Math.PI / 2 - sx * 0.25;
    grip.position.set(sx * 0.265, 0.86, 0.505);
    g.add(grip);
    // mirror stalk + head
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), darkMetal);
    stalk.position.set(sx * 0.20, 0.94, 0.54);
    stalk.rotation.z = -sx * 0.35;
    g.add(stalk);
    const mirror = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), paintDark));
    mirror.scale.set(1.3, 0.75, 0.45);
    mirror.position.set(sx * 0.245, 1.01, 0.54);
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

  // ---------- rider: HUMAN racing tuck (tapered, not capsule mannequin) ----------
  // tapered limb segment between points
  function tapered(a, b, r1, r2, mat, radial = 14) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, radial), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return shadowed(m);
  }
  // torso: lathe with human taper (narrow waist -> wide chest -> neck)
  const torsoPts = [
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.092, 0.01),
    new THREE.Vector2(0.104, 0.08), new THREE.Vector2(0.116, 0.16),
    new THREE.Vector2(0.126, 0.24), new THREE.Vector2(0.128, 0.30),
    new THREE.Vector2(0.112, 0.36), new THREE.Vector2(0.062, 0.40),
    new THREE.Vector2(0.001, 0.415)
  ];
  const torso = shadowed(new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 20), leather));
  torso.scale.set(1.35, 1, 0.85); // shoulders wider than deep
  torso.rotation.x = 0.9; // lean forward over tank
  torso.position.set(0, 0.78, -0.30);
  g.add(torso);
  // neck
  g.add(tapered(new THREE.Vector3(0, 1.045, 0.015), new THREE.Vector3(0, 1.09, 0.07), 0.048, 0.042, leather));
  // helmet: shell + chin bar + curved visor (reads as a real helmet, not a ball)
  const helmet = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.105, 22, 16), paint));
  helmet.scale.set(0.95, 1.02, 1.18);
  helmet.position.set(0, 1.155, 0.135);
  helmet.rotation.x = 0.25; // face slightly down-forward
  g.add(helmet);
  const chin = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), paint));
  chin.scale.set(0.88, 0.72, 1.05);
  chin.position.set(0, 1.115, 0.205);
  g.add(chin);
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.098, 0.098, 0.085, 18, 1, true, -0.62, 1.24), visorMat);
  visor.position.set(0, 1.16, 0.155);
  visor.rotation.x = 0.25;
  visor.rotation.y = Math.PI; // curve faces forward
  g.add(visor);
  // arms: shoulder -> elbow -> wrist (tapered, human)
  for (const sx of [-1, 1]) {
    const sh = new THREE.Vector3(sx * 0.165, 1.03, 0.01);
    const el = new THREE.Vector3(sx * 0.225, 0.915, 0.27);
    const wr = new THREE.Vector3(sx * 0.265, 0.865, 0.495);
    g.add(tapered(sh, el, 0.058, 0.047, leather));
    g.add(tapered(el, wr, 0.047, 0.037, leather));
    // glove: fist shaped around grip
    const glove = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), leather));
    glove.scale.set(0.95, 0.85, 1.35);
    glove.position.set(sx * 0.268, 0.86, 0.51);
    glove.rotation.x = 0.3;
    g.add(glove);
  }
  // legs: hip -> knee -> ankle (tapered, human)
  for (const sx of [-1, 1]) {
    const hp = new THREE.Vector3(sx * 0.10, 0.80, -0.28);
    const kn = new THREE.Vector3(sx * 0.175, 0.60, 0.00);
    const an = new THREE.Vector3(sx * 0.17, 0.33, -0.16);
    g.add(tapered(hp, kn, 0.080, 0.060, leather));
    g.add(tapered(kn, an, 0.060, 0.044, leather));
    // boot: heel + toe
    const boot = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), leather));
    boot.scale.set(0.95, 0.85, 1.1);
    boot.position.set(sx * 0.17, 0.30, -0.175);
    g.add(boot);
    const toe = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), leather));
    toe.scale.set(0.9, 0.7, 1.4);
    toe.position.set(sx * 0.17, 0.275, -0.10);
    g.add(toe);
  }

  return { group: g, wheels };
}
