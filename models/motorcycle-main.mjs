// Main sport motorcycle for JOB J2 (motorcycle-world) — v4 (JOB J11: real rider)
// Crotch-rocket supersport: SOLID extruded aluminum twin-spar frame + swingarm,
// REAL human rider from the shared athlete kit (characters/base-human-v2) in a racing
// tuck — hands on the grips, feet on the pegs (2-bone IK), full-face helmet.
// Aggressive full fairing, clip-on bars, upswept tail. No raw boxes/cones for bodywork.
// Async: await buildMotorcycle(). Returns { group, wheels } — wheels spin via pivot.rotation.x
// NEVER: wheels as hollow see-through tori or sinking below ground (looks/motorcycle-world.md)

export async function buildMotorcycle(colorHex = 0xc01818) {
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

  // ---------- rider: REAL human from the shared athlete kit (characters/base-human-v2) ----------
  // Owner (JOB J11): "no rider human person on bike" -> a real rigged person in a racing tuck,
  // hands on the grips and feet on the pegs via 2-bone IK, full-face helmet on the head.
  // (Old code-built mannequin removed - STUDIO-STANDARD: never build people from boxes/tubes.)
  const hbase = new URL('../characters/base-human-v2/', import.meta.url).href;
  const { loadHumans } = await import(hbase + 'humans.js');
  const HH = await loadHumans(THREE, hbase);
  // dark leathers: long sleeves, no hood / bandana / skirt add-ons
  const rider = HH.make({ g: 'm', skin: 2, hair: 'buzzed', hairCol: 0x1a1210, outfit: 'denimjacket',
    cols: { top: 0x17171b, jacket: 0x101014, bottom: 0x141416, shoes: 0x0e0e10 } }, 1.78);
  const RB = {};
  rider.object.traverse(o => { if (o.isBone) RB[o.name] = o; });

  // --- pose helpers: object-space bone turns + 2-bone IK (pattern from gear.js stance) ---
  const RX = new THREE.Vector3(1, 0, 0);
  const rqa = new THREE.Quaternion(), rqp = new THREE.Quaternion(), rqo = new THREE.Quaternion(), rax = new THREE.Vector3();
  const D2R = Math.PI / 180;
  function rturn(name, axis, deg) {
    const b = RB[name]; if (!b || !deg) return;
    b.parent.updateWorldMatrix(true, false);
    rider.object.getWorldQuaternion(rqo); b.parent.getWorldQuaternion(rqp);
    rax.copy(axis).applyQuaternion(rqo).applyQuaternion(rqp.invert());
    rqa.setFromAxisAngle(rax, deg * D2R); b.quaternion.premultiply(rqa);
  }
  const rv1 = new THREE.Vector3(), rv2 = new THREE.Vector3(), rSx = new THREE.Vector3(),
        rEx = new THREE.Vector3(), rHx = new THREE.Vector3(), rTw = new THREE.Vector3(),
        rPw = new THREE.Vector3(), rdS = new THREE.Vector3(),
        rqw = new THREE.Quaternion(), rpw = new THREE.Quaternion(), rEw = new THREE.Vector3();
  const raim = (b, from, to) => {
    rv1.copy(from).normalize(); rv2.copy(to).normalize();
    rqw.setFromUnitVectors(rv1, rv2);
    b.parent.getWorldQuaternion(rpw);
    b.quaternion.premultiply(rpw.clone().invert().multiply(rqw).multiply(rpw));
  };
  // put the `hand` bone exactly at (tx,ty,tz) given in rider.object local space
  function rreach(upper, lower, hand, tx, ty, tz, px, py, pz) {
    const U = RB[upper], L = RB[lower], Hd = RB[hand]; if (!U || !L || !Hd) return;
    Hd.updateWorldMatrix(true, false);
    U.getWorldPosition(rSx); L.getWorldPosition(rEx); Hd.getWorldPosition(rHx);
    const l1 = rEx.distanceTo(rSx), l2 = rHx.distanceTo(rEx);
    rTw.set(tx, ty, tz).applyMatrix4(rider.object.matrixWorld);
    rdS.subVectors(rTw, rSx);
    const d = Math.min(Math.max(rdS.length(), Math.abs(l1 - l2) + 1e-3), (l1 + l2) * .999);
    rdS.normalize();
    rPw.set(px, py, pz).applyQuaternion(rider.object.getWorldQuaternion(rqo));
    rPw.addScaledVector(rdS, -rPw.dot(rdS)).normalize();
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    rEw.copy(rSx).addScaledVector(rdS, a).addScaledVector(rPw, h);
    raim(U, rv1.subVectors(rEx, rSx).clone(), rv2.subVectors(rEw, rSx).clone());
    Hd.updateWorldMatrix(true, false); L.getWorldPosition(rEx); Hd.getWorldPosition(rHx);
    raim(L, rv1.subVectors(rHx, rEx).clone(), rv2.subVectors(rTw, rEx).clone());
  }

  // seat the rider: pelvis exactly onto the seat (pad top ~0.72 at z=-0.28)
  rider.object.position.set(0, -0.175, -0.30);
  g.add(rider.object);
  g.updateMatrixWorld(true);
  { const pw = new THREE.Vector3(); RB['pelvis'].getWorldPosition(pw);
    rider.object.position.x += 0 - pw.x;
    rider.object.position.y += 0.74 - pw.y;
    rider.object.position.z += -0.30 - pw.z;
    g.updateMatrixWorld(true); }
  // bike-space -> rider-local (rider.object carries translation only)
  const RL = (x, y, z) => [x - rider.object.position.x, y - rider.object.position.y, z - rider.object.position.z];

  // racing tuck: torso forward over the tank, head up to see ahead
  rturn('pelvis', RX, 14);
  rturn('spine_01', RX, 8); rturn('spine_02', RX, 8); rturn('spine_03', RX, 8);
  rturn('neck_01', RX, -18); rturn('Head', RX, -14);
  g.updateMatrixWorld(true);

  // hands onto the grips, elbows down and slightly out
  rreach('upperarm_l', 'lowerarm_l', 'hand_l', ...RL(-0.265, 0.86, 0.505), -0.35, -1, 0.25);
  rreach('upperarm_r', 'lowerarm_r', 'hand_r', ...RL( 0.265, 0.86, 0.505),  0.35, -1, 0.25);
  // feet onto the pegs, knees forward and slightly out
  rreach('thigh_l', 'calf_l', 'foot_l', ...RL(-0.16, 0.30, -0.18), -0.30, 0.15, 1);
  rreach('thigh_r', 'calf_r', 'foot_r', ...RL( 0.16, 0.30, -0.18),  0.30, 0.15, 1);
  g.updateMatrixWorld(true);

  // bake the static pose into the skeleton
  rider.object.traverse(o => { if (o.isSkinnedMesh && o.skeleton) o.skeleton.update(); });

  // full-face helmet on the posed head (generous shell so it always covers)
  { const hw = new THREE.Vector3(); RB['Head'].getWorldPosition(hw);
    const hl = rider.object.worldToLocal(hw.clone());
    const helmet = new THREE.Group();
    const shellMat = new THREE.MeshPhysicalMaterial({ color: 0x18181c, roughness: 0.25, metalness: 0.4, clearcoat: 0.8 });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 16), shellMat);
    shell.scale.set(0.95, 1.02, 1.12);
    shell.position.set(0, 0.025, 0.005);
    shell.castShadow = true;
    helmet.add(shell);
    const hvisor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.128, 0.128, 0.085, 20, 1, true, -0.65, 1.3), visorMat);
    hvisor.position.set(0, 0.03, 0.015);
    hvisor.rotation.y = Math.PI; // opening faces forward
    helmet.add(hvisor);
    helmet.position.copy(hl);
    helmet.rotation.x = 0.1; // match the head's slight forward tilt
    rider.object.add(helmet); }
  g.updateMatrixWorld(true);

  return { group: g, wheels };
}
