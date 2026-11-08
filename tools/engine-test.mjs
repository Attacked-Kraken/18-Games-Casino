/* tools/engine-test.mjs - proves the APEX ENGINE core (kit/apex-engine.js): fixed step, seeded random, record -> replay frame-exact,
   pause / step one frame / slow motion, events. Run: node tools/engine-test.mjs  (no browser, no deps). */
import { Engine } from '../kit/apex-engine.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
function make(seed) {
  return Engine.create({ sheet: { name: 'Test', controls: ['gas', 'brake', 'start'] }, seed, step: 1 / 60,
    init: (E) => ({ x: 0, v: 0, lap: 0, jitter: E.random(), bumps: 0 }),
    sim: (S, inp, dt, E) => { if (inp.buttons.gas) S.v += 10 * dt; if (inp.buttons.brake) S.v -= 20 * dt; S.v = Math.max(0, S.v - S.v * 0.1 * dt);
      S.x += S.v * dt * (1 + S.jitter * 0.1) + inp.x * dt; if (E.random() < 0.01) S.bumps++; if (S.x > 100) { S.x -= 100; S.lap++; E.emit('lap', { lap: S.lap }); } } });
}
const drive = (E, n) => { for (let i = 0; i < n; i++) { E.input.set({ x: Math.sin(E.steps / 30) * 0.5, buttons: { gas: (E.steps % 200) < 150, brake: (E.steps % 200) >= 180, start: E.steps === 0 } }); E.stepOnce(); } };
/* 1) same seed + same inputs = same run */
const A = make(42), B = make(42); drive(A, 900); drive(B, 900);
ok(A.hash() === B.hash() && A.state.x === B.state.x, 'same seed + inputs -> same hash (' + A.hash() + ') and x ' + A.state.x.toFixed(4));
/* 2) a different seed changes the run */
const C = make(43); drive(C, 900); ok(C.hash() !== A.hash(), 'different seed -> different hash');
/* 3) record, then replay on a FRESH engine = identical, step for step */
const R = make(7); R.record.start(); let laps = 0; R.on('lap', () => laps++); drive(R, 1200); const rec = R.record.stop();
ok(rec.count === 1200 && rec.inputs.length < 1200, 'recording holds 1200 steps in ' + rec.inputs.length + ' run-length rows');
const P = make(1); const hashes = []; P.on('step', () => { if (P.steps % 300 === 0) hashes.push(P.hash()); }); P.replay(rec, { now: true });
ok(P.hash() === rec.hash && P.steps === 1200, 'replay on a fresh engine -> same final hash ' + P.hash() + ' after ' + P.steps + ' steps');
const R2 = make(7); const h2 = []; R2.on('step', () => { if (R2.steps % 300 === 0) h2.push(R2.hash()); }); R2.replay(rec, { now: true });
ok(JSON.stringify(hashes) === JSON.stringify(h2), 'replayed twice -> the same hash at every 300th step');
ok(laps >= 1, 'lap events fired during the drive (' + laps + ')');
/* 4) mid-run recording (fresh:false) replays from its snapshot */
const M = make(5); drive(M, 400); M.record.start({ fresh: false }); drive(M, 300); const mrec = M.record.stop();
const M2 = make(99); M2.replay(mrec, { now: true }); ok(M2.hash() === mrec.hash && M2.steps === 700, 'mid-run recording (from step ' + mrec.from + ') replays exact on another engine');
/* 5) pause, step one frame, slow motion, time */
const T = make(3); T.start(); T.pause(); const s0 = T.steps; T.stepOnce(); ok(T.steps === s0 + 1, 'stepOnce advances exactly one step while paused');
T.resume(); for (let ms = 0; ms <= 1000; ms += 1000 / 60) T.tick(ms); ok(T.steps >= 60 && T.steps <= 62, 'one second of 60 Hz frames = 60 steps (' + T.steps + ')');
const s1 = T.steps; T.speed(0.25); for (let ms = 1000; ms <= 2000; ms += 1000 / 60) T.tick(ms); ok(T.steps - s1 >= 14 && T.steps - s1 <= 16, 'slow motion 0.25 -> 15 steps in a second (' + (T.steps - s1) + ')');
ok(Math.abs(T.time() - T.steps / 60) < 1e-9, 'time() is game time = steps x step');
T.stop();
/* 6) a replay with the wrong sheet speaks */
const W = make(1); let mism = 0; W.on('replay-mismatch', () => mism++); W.replay(Object.assign({}, rec, { sheetHash: 'nope' }), { now: true }); ok(mism === 1, 'replay-mismatch event when the sheet changed');
console.log(fails ? ('FAILED ' + fails) : 'ALL PASS'); process.exit(fails ? 1 : 0);
