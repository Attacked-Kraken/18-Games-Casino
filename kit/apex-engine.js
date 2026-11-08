/* kit/apex-engine.js - APEX ENGINE core (owner Nov 8 2026 "my own specialized engine to create my games"; master list #161).
   One engine, games as SHEETS. The simulation runs on a FIXED STEP, separate from drawing; random is SEEDED; every input
   sample is RECORDED - so any run replays frame-exact on the phone and in the robot (a bug report = a replay file).
   No dependencies (THREE stays in the game). Pause / step one frame / slow motion are built in (Studio debug mode #155).

   Use (templates/racer.html is the worked example):
     import { Engine } from './kit/apex-engine.js';
     const E = Engine.create({
       sheet,                      // the GAME SHEET (plain object: name, laps, rivals, track, cameras, feel, sounds ...)
       seed: 1234,                 // any whole number; same seed + same inputs = the same run
       step: 1 / 60,               // simulation step in seconds (game time)
       init: (E) => state,         // make the starting state (plain numbers / arrays / objects only - no THREE objects)
       sim:  (S, input, dt, E) => { ...change S... },   // ONE fixed step; may only read S, input, dt, E.random(), E.sheet
       draw: (S, alpha, E) => { ...meshes, camera, HUD, sound from S... },
       digest: (S) => [numbers]    // optional: the numbers that define the run (for E.hash()); default = every number in S
     });
     E.input.use(() => ({ x, y, buttons: { gas: true } }));   // live input each step (a controls object's read())
     E.start(); E.pause(); E.resume(); E.stepOnce(); E.speed(0.25);
     E.on('lap', fn); E.emit('crash', data);      // events (When/Then blocks later, #163)
     E.record.start(); const rec = E.record.stop(); E.replay(rec);   // rec = { v, seed, sheet, step, inputs, hash }
     E.time() = game seconds (steps x step), E.steps, E.hash() = checksum of the state now
   Robot / Studio: window.__engine = E is set by the game. */

const VERSION = 1;

function mulberry32(seed) {                                      /* restorable: .a is the whole state */
  const g = { a: seed | 0, next() { g.a = (g.a + 0x6D2B79F5) | 0; let t = Math.imul(g.a ^ (g.a >>> 15), 1 | g.a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } };
  return g;
}
const copy = (v) => JSON.parse(JSON.stringify(v));
function fnv(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); }
function numbersOf(v, out, depth) {
  if (depth > 6 || out.length > 4000) return out;
  if (typeof v === 'number') { out.push(Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : 0); return out; }
  if (typeof v === 'boolean') { out.push(v ? 1 : 0); return out; }
  if (Array.isArray(v)) { for (const x of v) numbersOf(x, out, depth + 1); return out; }
  if (v && typeof v === 'object') { for (const k of Object.keys(v).sort()) numbersOf(v[k], out, depth + 1); }
  return out;
}
const clamp1 = (n) => Math.max(-1, Math.min(1, +n || 0));

function sheetFrom(config, defaults) {
  const s = Object.assign({ name: 'Game', laps: 3, rivals: 3, track: '', scenery: [], car: '', carColor: '#ff2d20', sky: '#8fb8e0', ground: '#4f8a43',
    controls: ['gas', 'brake'], feel: { camBack: 9, camUp: 3.5, fov: 65 }, rules: {}, sounds: {} }, defaults || {}, config || {});
  s.controls = Array.isArray(s.controls) && s.controls.length ? s.controls.slice(0, 16) : ['gas', 'brake'];
  return s;
}

function create(o) {
  if (!o || typeof o.sim !== 'function' || typeof o.init !== 'function') throw new Error('Engine.create needs init and sim');
  const sheet = sheetFrom(o.sheet);
  const step = o.step > 0 ? o.step : 1 / 60;
  const names = sheet.controls;                                   // button names -> bit positions (recording stays small)
  const E = { sheet, step, steps: 0, seed: 0, state: null, running: false, paused: false, replaying: false, scale: 1,
    sheetHash: fnv(JSON.stringify(sheet)), version: VERSION };
  let rng = mulberry32(1), reader = null, live = { x: 0, y: 0, b: 0 }, rec = null, play = null, acc = 0, lastNow = null, raf = 0;
  const handlers = {};

  /* ---- events ---- */
  E.on = (n, f) => { (handlers[n] = handlers[n] || []).push(f); return () => E.off(n, f); };
  E.off = (n, f) => { handlers[n] = (handlers[n] || []).filter((g) => g !== f); };
  E.emit = (n, d) => { for (const f of (handlers[n] || []).slice()) { try { f(d, E); } catch (e) { console.warn('engine event', n, e); } } for (const f of (handlers['*'] || []).slice()) { try { f(n, d, E); } catch (e) {} } };

  /* ---- random (seeded, only the sim should call it) ---- */
  E.random = () => rng.next();
  E.reseed = (seed) => { E.seed = (seed | 0) || 1; rng = mulberry32(E.seed); };

  /* ---- input: one sample per fixed step, packed as x, y (thousandths) + button bits ---- */
  function pack(i) {
    let b = 0; const bt = (i && i.buttons) || {};
    for (let k = 0; k < names.length; k++) if (bt[names[k]]) b |= (1 << k);
    return { x: Math.round(clamp1(i && i.x) * 1000), y: Math.round(clamp1(i && i.y) * 1000), b };
  }
  function unpack(p) { const buttons = {}; for (let k = 0; k < names.length; k++) buttons[names[k]] = !!(p.b & (1 << k)); return { x: p.x / 1000, y: p.y / 1000, buttons, raw: p }; }
  E.input = {
    use: (fn) => { reader = fn; },                                  // fn() -> {x, y, buttons}
    set: (i) => { live = pack(i); },                                // or push a sample by hand (robot / tests)
    names,
  };
  function sample() {
    if (play) {                                                     // replay: the recorded sample for this step
      const p = play.at(E.steps - play.from);
      if (p) return p;
      play = null; E.replaying = false; E.emit('replay-end', { steps: E.steps, hash: E.hash() });
      if (E.holdAfterReplay) { E.paused = true; E.emit('pause', { why: 'replay-end' }); return { x: 0, y: 0, b: 0 }; }
    }
    if (reader) { try { live = pack(reader()); } catch (e) {} }
    return live;
  }

  /* ---- recording: run-length rows [count, x, y, b] ---- */
  function Recorder() {
    const rows = []; let last = null;
    return {
      push(p) { if (last && last[1] === p.x && last[2] === p.y && last[3] === p.b) last[0]++; else { last = [1, p.x, p.y, p.b]; rows.push(last); } },
      rows,
      count: () => rows.reduce((n, r) => n + r[0], 0),
    };
  }
  function Player(rows) {
    const flat = []; for (const r of rows || []) for (let i = 0; i < r[0]; i++) flat.push({ x: r[1], y: r[2], b: r[3] });
    return { at: (i) => flat[i] || null, length: flat.length };
  }
  E.record = {
    /* start({fresh:true}) (default) resets to a clean run first; start({fresh:false}) records from this moment - either way the
       starting state + random state are kept in the recording, so the replay is exact whatever Studio sliders say later */
    start: (opt) => { if (!E.state || !(opt && opt.fresh === false)) E.reset(opt && opt.seed != null ? opt.seed : E.seed);
      rec = Recorder(); rec.seed = E.seed; rec.from = E.steps; rec.state0 = copy(E.state); rec.rng0 = rng.a; rec.startHash = E.hash(); E.emit('record-start', { steps: E.steps }); },
    stop: () => {
      if (!rec) return null;
      const out = { v: VERSION, game: sheet.name, sheetHash: E.sheetHash, seed: rec.seed, step, from: rec.from, state0: rec.state0, rng0: rec.rng0, inputs: rec.rows.slice(), count: rec.count(), hash: E.hash(), steps: E.steps, startHash: rec.startHash };
      rec = null; E.emit('record-stop', out); return out;
    },
    active: () => !!rec,
  };

  /* ---- the run ---- */
  E.reset = (seed) => { E.reseed(seed == null ? (E.seed || 1) : seed); E.steps = 0; acc = 0; E.state = o.init(E); E.emit('reset', { seed: E.seed }); return E.state; };
  E.hash = () => fnv(JSON.stringify(o.digest ? o.digest(E.state, E) : numbersOf(E.state, [], 0)));
  E.time = () => E.steps * step;
  function advance() {
    const p = sample(); const inp = unpack(p);
    if (rec) rec.push(p);
    o.sim(E.state, inp, step, E);
    E.steps++;
    E.emit('step', { steps: E.steps, input: inp });
  }
  E.stepOnce = () => { if (!E.state) E.reset(); advance(); E.emit('frame', { steps: E.steps }); if (o.draw) o.draw(E.state, 0, E); return E.steps; };
  E.tick = (nowMs) => {
    if (!E.state) E.reset();
    if (lastNow == null) lastNow = nowMs;
    let dt = Math.max(0, Math.min(0.25, (nowMs - lastNow) / 1000)) * E.scale; lastNow = nowMs;
    if (!E.paused) { acc += dt; let guard = 0; while (acc >= step && guard++ < 240) { advance(); acc -= step; if (E.paused) break; } }
    if (o.draw) o.draw(E.state, E.paused ? 0 : acc / step, E);
  };
  E.start = (seed) => { if (!E.state || seed != null) E.reset(seed); E.running = true; E.paused = false; lastNow = null; E.emit('start', { seed: E.seed });
    if (typeof requestAnimationFrame === 'function') { const loop = (t) => { if (!E.running) return; E.tick(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); } return E; };
  E.stop = () => { E.running = false; if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf); raf = 0; E.emit('stop', {}); };
  E.pause = () => { E.paused = true; E.emit('pause', {}); };
  E.resume = () => { E.paused = false; lastNow = null; E.emit('resume', {}); };
  E.speed = (x) => { E.scale = Math.max(0, Math.min(4, +x || 0)); return E.scale; };

  /* ---- replay: same seed + same inputs from the same starting state = the same run ---- */
  E.replay = (data, opt) => {
    if (!data || !Array.isArray(data.inputs)) throw new Error('replay needs inputs');
    if (data.sheetHash && data.sheetHash !== E.sheetHash) E.emit('replay-mismatch', { want: data.sheetHash, have: E.sheetHash });
    E.holdAfterReplay = !!(opt && opt.hold);
    E.reset(data.seed);
    if (data.state0) { E.state = copy(data.state0); E.steps = data.from | 0; if (typeof data.rng0 === 'number') rng.a = data.rng0 | 0; }
    play = Player(data.inputs); play.from = data.from | 0; E.replaying = true; E.emit('replay-start', { count: play.length, seed: data.seed });
    if (opt && opt.now) { for (let i = 0; i < play.length && play; i++) advance(); }
    return E;
  };
  E.save = (data) => { try { localStorage.setItem('apexReplay:' + sheet.name, JSON.stringify(data)); return true; } catch (e) { return false; } };
  E.load = () => { try { return JSON.parse(localStorage.getItem('apexReplay:' + sheet.name) || 'null'); } catch (e) { return null; } };

  E.reseed(o.seed == null ? 1 : o.seed);
  return E;
}

export const Engine = { create, sheetFrom, VERSION, _fnv: fnv, _rng: mulberry32 };
export default Engine;
