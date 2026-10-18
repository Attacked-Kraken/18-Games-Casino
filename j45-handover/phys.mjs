// J45 physics prototype - tune the cannon-es raycast monster truck in node.
import * as CANNON from './ces/cannon-es.min.js';

const P = {
  mass: 5000,
  // chassis shape half extents (x width, y height, z length) - truck 3.8 wide, 5.9 long
  shapeHalf: new CANNON.Vec3(1.55, 0.62, 2.85),
  shapeOffset: new CANNON.Vec3(0, 0.55, -0.05), // box above COM
  wheelRadius: 0.85,
  connY: -0.15,           // wheel connection height in body frame
  connX: 1.42,            // half track
  connZ: 1.95,            // half wheelbase
  restLength: 0.95,
  stiffness: 26,
  dampC: 3.2,
  dampR: 1.9,
  maxSuspForce: 1e8,
  maxTravel: 1.05,
  frictionFront: 1.7,
  frictionRear: 1.15,
  rollInfluence: 0.47,
  engineForce: 11200,     // per wheel, 4WD
  boostMul: 1.55,
  brakeForce: 60,
  vmax: 31.5,             // rev limiter m/s
  angularDamping: 0.25,
  linearDamping: 0.012,
};

function buildWorld() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.solver.iterations = 12;
  const groundMat = new CANNON.Material('ground');
  const wheelMat = new CANNON.Material('wheel');
  const chassisMat = new CANNON.Material('chassis');
  world.addContactMaterial(new CANNON.ContactMaterial(wheelMat, groundMat, { friction: 0.25, restitution: 0.0, contactEquationStiffness: 1e7, contactEquationRelaxation: 3 }));
  world.addContactMaterial(new CANNON.ContactMaterial(chassisMat, groundMat, { friction: 0.4, restitution: 0.05 }));
  world.defaultContactMaterial.friction = 0.3;
  // NOTE: cannon-es Plane shape has a broken world AABB (z max = 0) - wheel rays miss
  // for z > 0. Always use a BOX for raycast-vehicle ground.
  const ground = new CANNON.Body({ mass: 0, material: groundMat, shape: new CANNON.Box(new CANNON.Vec3(600, 0.5, 600)) });
  ground.position.set(0, -0.5, 0);
  world.addBody(ground);
  return { world, groundMat, wheelMat, chassisMat };
}

function buildTruck(mats) {
  const body = new CANNON.Body({ mass: P.mass, material: mats.chassisMat, angularDamping: P.angularDamping, linearDamping: P.linearDamping, allowSleep: false });
  body.addShape(new CANNON.Box(P.shapeHalf), P.shapeOffset);
  const vehicle = new CANNON.RaycastVehicle({
    chassisBody: body,
    indexRightAxis: 0, indexUpAxis: 1, indexForwardAxis: 2,
  });
  const opts = (front) => ({
    radius: P.wheelRadius,
    directionLocal: new CANNON.Vec3(0, -1, 0),
    axleLocal: new CANNON.Vec3(-1, 0, 0),
    suspensionStiffness: P.stiffness,
    suspensionRestLength: P.restLength,
    frictionSlip: front ? P.frictionFront : P.frictionRear,
    dampingCompression: P.dampC,
    dampingRelaxation: P.dampR,
    maxSuspensionForce: P.maxSuspForce,
    maxSuspensionTravel: P.maxTravel,
    rollInfluence: P.rollInfluence,
    customSlidingRotationalSpeed: -30,
    useCustomSlidingRotationalSpeed: true,
    chassisConnectionPointLocal: new CANNON.Vec3(),
  });
  // forward = +Z: front wheels at +Z
  const conns = [
    [-P.connX, P.connY, P.connZ, true], [P.connX, P.connY, P.connZ, true],
    [-P.connX, P.connY, -P.connZ, false], [P.connX, P.connY, -P.connZ, false],
  ];
  for (const [x, y, z, front] of conns) {
    const o = opts(front);
    o.chassisConnectionPointLocal.set(x, y, z);
    vehicle.addWheel(o);
  }
  return { body, vehicle };
}

function attitude(body) {
  // local axes in world
  const q = body.quaternion;
  const right = q.vmult(new CANNON.Vec3(1, 0, 0));
  const up = q.vmult(new CANNON.Vec3(0, 1, 0));
  const fwd = q.vmult(new CANNON.Vec3(0, 0, 1));
  // pitch: rotation about right axis = angle of fwd above horizon (nose up +)
  const pitch = Math.asin(Math.max(-1, Math.min(1, fwd.y)));
  // roll: rotation about fwd axis = angle of right axis below/above horizon
  const roll = Math.asin(Math.max(-1, Math.min(1, -right.y)));
  return { pitch, roll, upY: up.y, pitchRaw: Math.atan2(fwd.y, Math.hypot(fwd.x, fwd.z)) };
}

function scenario(name, setup, run) {
  const mats = buildWorld();
  const { body, vehicle } = buildTruck(mats);
  vehicle.addToWorld(mats.world);
  const ctx = { ...mats, body, vehicle };
  setup(ctx);
  const out = run(ctx);
  console.log(name.padEnd(14), out);
  vehicle.removeFromWorld(mats.world);
}

const H = 1 / 60;
function drive(ctx, { gas = 0, steer = 0, boost = false } = {}) {
  const b = ctx.body, veh = ctx.vehicle;
  const q = b.quaternion;
  const fwd = q.vmult(new CANNON.Vec3(0, 0, 1));
  const right = q.vmult(new CANNON.Vec3(1, 0, 0));
  const fwdSpeed = b.velocity.dot(fwd);
  const att = attitude(b);
  const grounded = veh.wheelInfos.filter(w => w.isInContact).length;
  const mul = boost ? P.boostMul : 1;
  // drive force split: 55% through the wheels (grip, spin, some pitch moment),
  // 45% as a body force at the COM (pure push, no flip moment)
  let wf = -P.engineForce * 0.55 * gas * mul;
  if (gas > 0 && fwdSpeed > P.vmax) wf = 0;
  if (gas > 0 && grounded >= 2 && att.pitch * 57.3 > 26) wf = 0; // tail-stand safety
  for (let i = 0; i < 4; i++) veh.applyEngineForce(wf, i);
  if (gas !== 0 && !(gas > 0 && fwdSpeed > P.vmax)) {
    const cf = gas * P.engineForce * 4 * 0.45 * mul;
    b.force.x += fwd.x * cf; b.force.y += fwd.y * cf; b.force.z += fwd.z * cf;
  }
  veh.wheelInfos.forEach((w) => { if (w._baseSlip === undefined) w._baseSlip = w.frictionSlip; w.frictionSlip = w._baseSlip * (boost ? 1.35 : 1); });
  // wheelie hold: a hard launch at low speed holds the nose at ~15 deg.
  // Angle PD with stiffness just above the suspension's pitch stiffness.
  if (gas > 0.7 && grounded >= 2 && Math.abs(fwdSpeed) < 12) {
    const pitchRate = -b.angularVelocity.dot(right); // + = nosing up
    let tq = (att.pitch - 0.26) * 2600000 + pitchRate * 260000;
    tq = Math.max(-700000, Math.min(700000, tq));
    b.torque.x += right.x * tq; b.torque.y += right.y * tq; b.torque.z += right.z * tq;
  }
  // emergency roll damper only (hard tip-overs): strong rate damping past 17 deg
  if (grounded >= 2 && Math.abs(att.roll) > 0.3) {
    const rollRate = b.angularVelocity.dot(fwd);
    let tq = -rollRate * 300000;
    tq = Math.max(-600000, Math.min(600000, tq));
    b.torque.x += fwd.x * tq; b.torque.y += fwd.y * tq; b.torque.z += fwd.z * tq;
  }
  const maxSteer = 0.55 / (1 + Math.abs(fwdSpeed) * 0.06);
  veh.setSteeringValue(steer * maxSteer, 0);
  veh.setSteeringValue(steer * maxSteer, 1);
}

// 1) settle
scenario('settle', ({ body }) => { body.position.set(0, 2.2, 0); },
  ({ world, body, vehicle }) => {
    let comp = [];
    for (let i = 0; i < 180; i++) { world.step(H); }
    for (const w of vehicle.wheelInfos) comp.push((P.restLength - w.suspensionLength).toFixed(2));
    return `y=${body.position.y.toFixed(2)} vel=${body.velocity.length().toFixed(2)} compression=[${comp}] grounded=${vehicle.wheelInfos.map(w => w.isInContact ? 1 : 0)}`;
  });

// 2) accel + top speed
scenario('accel', ({ body }) => { body.position.set(0, 2.2, -46); body.quaternion.setFromEuler(0, Math.PI / 2, 0); },
  (ctx) => {
    const { world, body } = ctx;
    for (let i = 0; i < 120; i++) world.step(H);
    let t60 = -1, max = 0, pitchMax = 0;
    for (let i = 0; i < 60 * 12; i++) {
      drive(ctx, { gas: 1 });
      world.step(H);
      const sp = body.velocity.length();
      max = Math.max(max, sp);
      if (t60 < 0 && sp >= 26.8) t60 = i * H;
      if (i * H < 1.6) pitchMax = Math.max(pitchMax, attitude(body).pitch);
    }
    return `0-60=${t60.toFixed(2)}s top=${max.toFixed(1)} m/s (${(max * 2.237).toFixed(0)} mph) wheeliePitch=${(pitchMax * 57.3).toFixed(1)}deg dist=${body.position.x.toFixed(0)}m`;
  });

// 3) boost accel 5->20
scenario('boost', ({ body }) => { body.position.set(0, 2.2, -46); body.quaternion.setFromEuler(0, Math.PI / 2, 0); },
  (ctx) => {
    const run = (boost) => {
      const mats = buildWorld(); const t = buildTruck(mats); t.vehicle.addToWorld(mats.world);
      t.body.position.set(0, 2.2, -46); t.body.quaternion.setFromEuler(0, Math.PI / 2, 0);
      for (let i = 0; i < 120; i++) mats.world.step(H);
      let tm = 0, started = false;
      for (let i = 0; i < 60 * 8; i++) {
        drive({ ...mats, ...t }, { gas: 1, boost });
        mats.world.step(H);
        const sp = t.body.velocity.length();
        if (sp >= 5) started = true;
        if (started) tm += H;
        if (sp >= 20) break;
      }
      t.vehicle.removeFromWorld(mats.world);
      return tm;
    };
    return `5-20 plain=${run(false).toFixed(2)}s boost=${run(true).toFixed(2)}s`;
  });

// 4) roll in turn at 15 m/s
scenario('roll', ({ body }) => { body.position.set(0, 2.2, -40); body.quaternion.setFromEuler(0, Math.PI / 2, 0); },
  (ctx) => {
    const { world, body } = ctx;
    for (let i = 0; i < 120; i++) world.step(H);
    let n = 0;
    while (body.velocity.length() < 14 && n++ < 400) { drive(ctx, { gas: 1 }); world.step(H); }
    let maxRoll = 0;
    for (let i = 0; i < 72; i++) { drive(ctx, { gas: 0.6, steer: 1 }); world.step(H); maxRoll = Math.max(maxRoll, Math.abs(attitude(body).roll)); }
    return `maxRoll=${(maxRoll * 57.3).toFixed(1)}deg speedEnd=${body.velocity.length().toFixed(1)}`;
  });

// 5) drop 6m
scenario('drop6', ({ body }) => { body.position.set(0, 2.2 + 6, 0); },
  ({ world, body, vehicle }) => {
    for (let i = 0; i < 30; i++) world.step(H);
    body.position.y += 6; body.velocity.setZero();
    let steps = 0, peak = 0, contact = false;
    while (steps < 600) {
      world.step(H); steps++;
      const anyC = vehicle.wheelInfos.some(w => w.isInContact);
      if (anyC) contact = true;
      if (contact) {
        peak = Math.max(peak, ...vehicle.wheelInfos.map(w => P.restLength - w.suspensionLength));
        if (vehicle.wheelInfos.filter(w => w.isInContact).length >= 3 && Math.abs(body.velocity.y) < 0.5) break;
      }
    }
    return `stepsToLand=${steps} peakCompression=${peak.toFixed(2)}m`;
  });

// 6) air flip with torque control
scenario('airflip', ({ body }) => { body.position.set(0, 14, 0); body.quaternion.setFromEuler(0, Math.PI / 2, 0); },
  ({ world, body }) => {
    body.angularDamping = 0.03;
    let total = 0, last = attitude(body).pitchRaw, steps = 0;
    const right = () => body.quaternion.vmult(new CANNON.Vec3(1, 0, 0));
    while (body.position.y > 3.4 && steps < 300) {
      // air control: desired pitch rate about local right axis
      const cur = body.angularVelocity.dot(right());
      const want = 2.4;
      const tq = (want - cur) * P.mass * 5.0;
      const r = right();
      body.torque.x += r.x * tq; body.torque.y += r.y * tq; body.torque.z += r.z * tq;
      world.step(H); steps++;
      const p = attitude(body).pitchRaw;
      let d = p - last; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      total += Math.abs(d); last = p;
    }
    return `rotated=${(total * 57.3).toFixed(0)}deg in ${(steps * H).toFixed(2)}s (y=${body.position.y.toFixed(1)})`;
  });

// 7) dirt slide
scenario('slide', ({ body }) => { body.position.set(0, 2.2, -40); body.quaternion.setFromEuler(0, Math.PI / 2, 0); },
  (ctx) => {
    const { world, body, vehicle } = ctx;
    for (let i = 0; i < 120; i++) world.step(H);
    let n = 0;
    while (body.velocity.length() < 19 && n++ < 500) { drive(ctx, { gas: 1 }); world.step(H); }
    // cut rear grip for the slide
    vehicle.wheelInfos[2]._baseSlip = 0.5; vehicle.wheelInfos[3]._baseSlip = 0.5; vehicle.wheelInfos[2].frictionSlip = 0.5; vehicle.wheelInfos[3].frictionSlip = 0.5;
    let maxDrift = 0;
    for (let i = 0; i < 48; i++) {
      drive(ctx, { gas: 0.7, steer: 1 }); world.step(H);
      const v = body.velocity;
      if (v.length() > 8) {
        const fwd = body.quaternion.vmult(new CANNON.Vec3(0, 0, 1));
        const vAng = Math.atan2(v.x, v.z), fAng = Math.atan2(fwd.x, fwd.z);
        let d = Math.abs(vAng - fAng); if (d > Math.PI) d = 2 * Math.PI - d;
        maxDrift = Math.max(maxDrift, d);
      }
    }
    return `maxDrift=${(maxDrift * 57.3).toFixed(0)}deg`;
  });
