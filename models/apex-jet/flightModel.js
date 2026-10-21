/* Apex Arcade Jet - flight model (stable, fixed-timestep).  Units: metres, seconds, radians.
   Axes match apexflight.html: +Z = nose/forward, +Y = up, +X = LEFT wing.          */
export const JET_CONFIG = {
  maxSpeed: 250,          // m/s hard cap (with afterburner)
  cruiseSpeed: 170,       // m/s top speed at full DRY throttle (drag is derived from this)
  stallSpeed: 52,         // m/s below this lift fades and the nose drops
  takeoffSpeed: 68,       // m/s jet may rotate (lift off) above this
  landingSpeed: 62,       // m/s recommended touchdown speed (HUD warns above +25)
  thrust: 30,             // m/s^2 at full dry throttle
  throttleResponse: 0.7,  // throttle change per second (0..1 units)
  afterburnerBoost: 1.5,  // thrust multiplier while boost held
  drag: 0,                // 0 = auto (thrust / cruiseSpeed^2); else quadratic drag coefficient
  liftCoefficient: 1.0,   // 1 = level flight exactly at stallSpeed; higher = floatier
  pitchRate: 1.3,         // rad/s at full stick
  rollRate: 2.8,          // rad/s at full stick
  yawRate: 0.45,          // rad/s at full rudder
  stability: 0.6,         // 0..1 auto-level / stability assist (wings level + nose to horizon when stick released)
  damping: 5,             // 1/s how fast body rates follow the stick (higher = snappier, lower = floatier)
  gLimit: 8,              // max pull in g (caps pitch rate at speed)
  turnCoordination: 0.8,  // 0..1 banking turns the nose automatically
  autoTrim: true,         // hold altitude hands-off when stability > 0
  groundSteer: 0.5,       // rad/s nose-wheel steering at full stick
  groundFriction: 0.5,    // m/s^2 rolling resistance
  brake: 9,               // m/s^2 wheel brake
  gearHeight: 1.75,       // origin height above ground when sitting on wheels (wheel bottom = y 0)
  gravity: 9.81,
  substepHz: 120,         // fixed physics rate
  maxSubsteps: 15         // prevents spiral-of-death at very low fps (~8 fps still real time)
};
export const JET_PRESETS = {
  arcade: { stability: 0.95, stallSpeed: 38, takeoffSpeed: 50, landingSpeed: 48, pitchRate: 1.1, rollRate: 2.2, gLimit: 6, turnCoordination: 1.0, damping: 4, liftCoefficient: 1.3 },
  normal: {},
  pro:    { stability: 0.12, stallSpeed: 60, takeoffSpeed: 75, landingSpeed: 70, pitchRate: 1.7, rollRate: 4.0, yawRate: 0.6, gLimit: 9, turnCoordination: 0.35, damping: 7, liftCoefficient: 0.95, autoTrim: false }
};
export function makeJetConfig(preset = 'normal', overrides = {}) {
  return Object.assign({}, JET_CONFIG, JET_PRESETS[preset] || {}, overrides);
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);
/* tricks: list of phases. axis pitch/roll, amount (rad), sign */
const TRICKS = {
  barrelRoll: [{ axis: 'roll', amt: Math.PI * 2, s: 1, pitch: 0.35 }],
  loop:       [{ axis: 'pitch', amt: Math.PI * 2, s: 1 }],
  immelmann:  [{ axis: 'pitch', amt: Math.PI, s: 1 }, { axis: 'roll', amt: Math.PI, s: 1 }],
  splitS:     [{ axis: 'roll', amt: Math.PI, s: 1 }, { axis: 'pitch', amt: Math.PI, s: 1 }]
};
export function createFlightModel(THREE, cfgIn) {
  const cfg = Object.assign({}, JET_CONFIG, cfgIn || {});
  const s = {
    pos: new THREE.Vector3(0, cfg.gearHeight, 0), q: new THREE.Quaternion(),
    speed: 0, vs: 0, w: { pitch: 0, yaw: 0, roll: 0 }, thr: 0, boost: false,
    onGround: true, stalled: false, g: 1, gearDown: true, crashed: false,
    trick: null, pitchAngle: 0, rollAngle: 0, heading: 0, vel: new THREE.Vector3()
  };
  const F = new THREE.Vector3(), U = new THREE.Vector3(), Rt = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0), tq = new THREE.Quaternion(), ax = new THREE.Vector3(), eul = new THREE.Euler();
  let acc = 0; const good = { pos: s.pos.clone(), q: s.q.clone(), speed: 0 };
  function reset(x = 0, z = 0, heading = 0, airborne = false, speed = 0, alt = 300) {
    s.pos.set(x, airborne ? alt : cfg.gearHeight, z); s.q.setFromEuler(eul.set(0, heading, 0, 'YXZ'));
    s.speed = speed; s.vs = 0; s.w.pitch = s.w.yaw = s.w.roll = 0; s.thr = airborne ? 0.75 : 0;
    s.onGround = !airborne; s.crashed = false; s.trick = null; s.stalled = false; acc = 0;
  }
  function startTrick(name) { if (TRICKS[name] && !s.onGround) s.trick = { name, i: 0, done: 0 }; return !!s.trick; }
  function axes() {
    F.set(0, 0, 1).applyQuaternion(s.q); U.set(0, 1, 0).applyQuaternion(s.q); Rt.copy(F).cross(U);
    s.pitchAngle = Math.asin(clamp(F.y, -1, 1)); s.rollAngle = Math.atan2(-Rt.y, U.y); s.heading = Math.atan2(F.x, F.z);
  }
  function rot(x, y, z, a) { tq.setFromAxisAngle(ax.set(x, y, z), a); s.q.multiply(tq); }
  function sub(h, inp) {
    const g = cfg.gravity;
    let pin = clamp(fin(inp.pitch), -1, 1), rin = clamp(fin(inp.roll), -1, 1), yin = clamp(fin(inp.yaw), -1, 1);
    let thrIn = clamp(fin(inp.throttle, s.thr), 0, 1), boost = !!inp.boost, assist = cfg.stability;
    // trick autopilot (closed loop on actual rotation, so it works at any speed / fps)
    if (s.trick) {
      const ph = TRICKS[s.trick.name][s.trick.i];
      assist = 0; thrIn = 1; boost = true; yin = 0;
      if (ph.axis === 'pitch') { pin = ph.s; rin = 0; s.trick.done += Math.abs(s.w.pitch) * h; }
      else { rin = ph.s; pin = ph.pitch || 0; s.trick.done += Math.abs(s.w.roll) * h; }
      if (s.trick.done >= ph.amt) { s.trick.i++; s.trick.done = 0; if (s.trick.i >= TRICKS[s.trick.name].length) s.trick = null; }
    }
    s.thr += clamp(thrIn - s.thr, -cfg.throttleResponse * h, cfg.throttleResponse * h);
    s.boost = boost && s.thr > 0.5;
    axes();
    const V = Math.max(s.speed, 1);
    const lf = clamp(cfg.liftCoefficient * (s.speed / cfg.stallSpeed) ** 2, 0, 1.25);
    s.stalled = !s.onGround && s.speed < cfg.stallSpeed * 0.95;
    const auth = s.onGround ? 1 : clamp(s.speed / cfg.stallSpeed, 0.3, 1);
    let pT = pin * cfg.pitchRate * auth, rT = rin * cfg.rollRate * auth, yT = yin * cfg.yawRate * auth;
    if (!s.onGround) {
      // stability assist: wings level and nose toward the horizon when the stick is released
      if (assist > 0 && Math.abs(rin) < 0.15) rT += clamp(-s.rollAngle * assist * 2.5, -cfg.rollRate, cfg.rollRate) * (1 - Math.abs(rin) / 0.15);
      if (assist > 0 && Math.abs(pin) < 0.15 && U.y > 0.2) {
        let tgt = 0; if (cfg.autoTrim) tgt = clamp(-s.vs * 0.01, -0.15, 0.15);
        pT += clamp((tgt - s.pitchAngle) * assist * 1.6, -0.8, 0.8);
      }
      // coordinated turn
      if (cfg.turnCoordination > 0 && U.y > 0.1) {
        const bank = clamp(s.rollAngle, -1.3, 1.3), om = g * Math.tan(bank) / Math.max(V, 30) * cfg.turnCoordination;
        yT += om * Math.cos(bank); pT += Math.abs(om * Math.sin(bank));
      }
      if (s.stalled) pT -= (1 - s.speed / cfg.stallSpeed) * 1.2 * Math.max(U.y, 0.2);
      // G limit
      const pmax = cfg.gLimit * g / V; pT = clamp(pT, -pmax * 0.6, pmax);
    }
    const k = Math.min(1, cfg.damping * h);
    s.w.pitch += (pT - s.w.pitch) * k; s.w.roll += (rT - s.w.roll) * k; s.w.yaw += (yT - s.w.yaw) * k;
    s.g = 1 + s.speed * s.w.pitch / g;
    // speed
    const drag = cfg.drag || cfg.thrust / (cfg.cruiseSpeed * cfg.cruiseSpeed);
    let a = cfg.thrust * s.thr * (s.boost ? cfg.afterburnerBoost : 1) - drag * s.speed * s.speed - g * F.y;
    if (s.onGround) a -= cfg.groundFriction + (inp.brake ? cfg.brake : 0);
    s.speed = clamp(s.speed + a * h, 0, cfg.maxSpeed);
    if (s.onGround) {
      // ground roll: nose-wheel steering, no roll, pitch only once fast enough to rotate
      const steer = clamp(rin + yin, -1, 1) * cfg.groundSteer * clamp(s.speed / 10, 0, 1);
      let p = s.pitchAngle;
      if (s.speed >= cfg.takeoffSpeed && pin > 0) p = Math.min(p + pin * cfg.pitchRate * 0.5 * h, 0.22);
      else p = Math.max(0, p - 0.5 * h);
      const hd = s.heading - steer * h;   // steer right = heading toward -X
      s.q.setFromEuler(eul.set(-p, hd, 0, 'YXZ')); s.w.roll = s.w.yaw = 0; s.w.pitch = 0;
      axes();
      s.vs = Math.max(0, s.vs);
      if (lf >= 1 && p > 0.05) s.vs += (lf - 1) * g * 4 * h;
    } else {
      rot(1, 0, 0, -s.w.pitch * h); rot(0, 0, 1, s.w.roll * h); rot(0, 1, 0, -s.w.yaw * h); s.q.normalize(); axes();
      // arcade lift: flight path follows the nose while fast enough (loops keep altitude); sink only when slow / knife-edge
      const lift = g * lf * (0.8 + 0.2 * Math.abs(U.y));
      s.vs = clamp(s.vs + (lift - g) * h, -80, 8);
      if (lift >= g * 0.98) s.vs *= 1 - Math.min(1, 1.5 * h);
    }
    s.vel.copy(F).multiplyScalar(s.speed).addScaledVector(Y, s.vs);
    s.pos.addScaledVector(s.vel, h);
    const gh = cfg.gearHeight, floor = s.gearDown ? gh : 0.9;
    if (s.pos.y <= floor) {
      if (!s.onGround) {
        const hard = s.vs < -8 || s.vel.y < -9 || Math.abs(s.rollAngle) > 0.5 || !s.gearDown || s.pitchAngle < -0.2;
        if (hard) s.crashed = true;
        s.onGround = true;
      }
      s.pos.y = floor; s.vs = 0;
    } else if (s.onGround && s.pos.y > gh + 0.05) s.onGround = false;
    if (s.onGround && s.pos.y > gh + 0.001 && s.speed < cfg.takeoffSpeed) s.pos.y = gh;
    if (s.onGround && s.vs > 0.5 && s.pos.y > gh + 0.02) s.onGround = false;
  }
  function step(dt, input = {}) {
    dt = clamp(fin(dt), 0, 0.25); s.gearDown = input.gear !== undefined ? !!input.gear : s.gearDown;
    const h = 1 / cfg.substepHz; acc += dt; let n = 0;
    while (acc >= h && n < cfg.maxSubsteps) { sub(h, input); acc -= h; n++; }
    if (n >= cfg.maxSubsteps) acc = 0;
    // NaN / blow-up guard: restore last good state
    const ok = [s.pos.x, s.pos.y, s.pos.z, s.q.x, s.q.y, s.q.z, s.q.w, s.speed, s.vs].every(Number.isFinite);
    if (!ok) { s.pos.copy(good.pos); s.q.copy(good.q); s.speed = good.speed; s.vs = 0; s.w.pitch = s.w.roll = s.w.yaw = 0; s.nanRecovered = (s.nanRecovered || 0) + 1; }
    else { good.pos.copy(s.pos); good.q.copy(s.q); good.speed = s.speed; }
    return s;
  }
  return { cfg, state: s, step, reset, startTrick, setConfig: (o) => Object.assign(cfg, o), tricks: Object.keys(TRICKS) };
}
