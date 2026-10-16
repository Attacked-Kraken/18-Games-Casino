// Owner's fix list for Apex Ice Hockey (see README.md in this folder). Numbers come from his model sheet (2026-10-16).
const kitOf = () => {
  const S = window.__hk && window.__hk.skaters;
  if (!S || !S.length) return 'no skaters found (window.__hk.skaters)';
  return S;
};
export default [
  {
    id: 'real-players-not-blobs',
    ask: 'They gave me this - blob players, upright floating sticks and scattered bits',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
        const bad = S.filter((s) => !s.kit || !s.ath || !s.kit.parts.jersey || !s.kit.parts.gear || !s.kit.parts.shell || !s.kit.parts.steel);
        if (bad.length) return `${bad.length} of ${S.length} skaters are not real geared athletes (shared hockey kit missing)`;
        if (S.some((s) => s.body && s.body.visible)) return 'the old primitive (blob) figure is still showing';
        return true;
      });
    },
  },
  {
    id: 'model-sheet-stance',
    ask: 'How do I get exactly this hockey player? (7.5 head heights, forward lean 15-20, knee flex 25-30, hips back over the heels, wide stance)',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
        const s = S.find((x) => x.kit && !x.goalie); if (!s) return 'no geared skater';
        s.ath.play('Idle_Loop', 0); s.ath.mixer.update(0.016); s.kit.stance.apply({ crouch: 1 });
        const m = s.kit.stance.measure(), f = (x) => Math.round(x * 10) / 10, out = [];
        if (m.heads < 7.2 || m.heads > 8) out.push('body is ' + f(m.heads) + ' head heights (sheet: about 7.5)');
        if (m.lean < 15 || m.lean > 20) out.push('forward lean ' + f(m.lean) + ' deg (sheet: 15-20)');
        for (const k of ['kneeL', 'kneeR']) if (m[k] < 25 || m[k] > 31) out.push(k + ' flex ' + f(m[k]) + ' deg (sheet: 25-30)');
        if (m.hipBack > 0.01) out.push('hips are ahead of the skates, not back over the heels');
        if (m.stance < 1.3) out.push('stance not wide (feet ' + f(m.stance) + 'x hip width)');
        return out.length ? out.join('; ') : true;
      });
    },
  },
  {
    id: 'gear-from-model-sheet',
    ask: 'Helmet with visor, shoulder pads, oversized gloves, padded breezers, shin guards, skates with a wider stance - like my sheet',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
        const s = S.find((x) => x.kit && !x.goalie); if (!s) return 'no geared skater';
        const P = s.kit.parts, miss = [];
        if (!P.visor && !s.kit.parts.cage) miss.push('helmet visor');
        for (const k of ['jersey', 'gear', 'shell', 'steel']) if (!P[k] || !P[k].visible) miss.push(k);
        // the pads/gloves/skates are real geometry: the gear mesh must be substantial, not a few boxes
        const tri = (m) => (m && m.geometry ? m.geometry.attributes.position.count / 3 : 0);
        if (tri(P.gear) < 4000) miss.push('pads/gloves/socks look too simple (' + Math.round(tri(P.gear)) + ' triangles)');
        return miss.length ? 'missing: ' + miss.join(', ') : true;
      });
    },
  },
  {
    id: 'stick-in-hands-on-ice',
    ask: 'Upright floating sticks',
    async test(page, h) {
      return h.eval(() => {
        const S = window.__hk && window.__hk.skaters; if (!S || !S.length) return 'no skaters found';
        const s = S.find((x) => x.kit && !x.goalie); if (!s) return 'no geared skater';
        s.ath.mixer.update(0.016); s.kit.stance.apply({ crouch: 1 });
        const st = s.kit.stick, obj = s.ath.object; obj.updateMatrixWorld(true);
        if (!st.parent) return 'the stick is not in the player\'s hands';
        const T = st.position.clone(), dir = new st.position.constructor(0, 1, 0).applyQuaternion(st.quaternion);
        const inv = obj.matrixWorld.clone().invert(); let worst = 0;
        obj.traverse((b) => { if (b.isBone && (b.name === 'hand_l' || b.name === 'hand_r')) { const p = b.getWorldPosition(new st.position.constructor()).applyMatrix4(inv); const d = p.clone().sub(T); const along = d.dot(dir); worst = Math.max(worst, d.sub(dir.clone().multiplyScalar(along)).length()); } });
        if (worst > 0.12) return 'a hand is ' + Math.round(worst * 100) + ' cm from the shaft';
        if (Math.abs(T.y) > 0.02) return 'the blade is not on the ice';
        const tilt = Math.acos(Math.min(1, Math.abs(dir.y))) * 180 / Math.PI;
        if (tilt < 25) return 'the stick stands upright (' + Math.round(tilt) + ' deg from vertical)';
        return true;
      });
    },
  },
  {
    id: 'real-arena-venue-sheet',
    ask: 'Build a nice stadium, a big crowd in the stadium (venues/rink.md)',
    async test(page, h) {
      return h.eval(() => {
        const A = window.__arena; if (!A) return 'the stadium kit did not load (old box stands still showing)';
        const r = A.report(), out = [];
        if (r.fans < 12000) out.push('only ' + r.fans + ' fans (sheet: 12,000+)');
        if (r.tiers < 2) out.push('one level of seats (sheet: lower + upper bowl)');
        if (r.scoreboard !== 'center-hung') out.push('no centre-hung scoreboard');
        if (!r.roof) out.push('no roof');
        if (r.drawCalls > 20) out.push('arena too heavy for phones: ' + r.drawCalls + ' draw calls');
        return out.length ? out.join('; ') : true;
      });
    },
  },
];

