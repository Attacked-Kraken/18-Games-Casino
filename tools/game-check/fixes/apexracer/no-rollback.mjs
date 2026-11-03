// OWNER Nov 1 2026 9:36 PM: "make sure cars are not able to slide backwards by themselves - my car moves backwards if you don't press gas".
// With no gas and no brake the player car must never roll backwards (it did: -4.3 m/s from the coast drag at a standstill).
export default [{
  id: 'play-no-rollback',
  ask: 'Owner Nov 1 2026: with no gas and no brake the car never rolls backwards by itself.',
  async test(page, h) {
    await h.eval(() => { const E = window.__erc; window.__nrPrev = E.R; E.startRace(E.PLACES[0], 3); return true; });
    await h.poll(() => h.eval(() => { const E = window.__erc; return !!(E.R && E.R !== window.__nrPrev && E.R.skids && E.R.P); }), (v) => v, 40000);
    return h.eval(() => { const E = window.__erc, P = E.R.P; E.K.gas = 0; E.K.brake = 0; E.K.sx = 0; E.step(400, 1 / 60); const s0 = P.prog; E.step(600, 1 / 60);
      if (P.spd < -0.05 || P.prog - s0 < 0) return 'the car rolled backwards with no gas: speed ' + P.spd.toFixed(2) + ' m/s, moved ' + (P.prog - s0) + ' track steps'; return true; });
  },
}];
