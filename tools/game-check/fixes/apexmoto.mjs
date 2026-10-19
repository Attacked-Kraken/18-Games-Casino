// Owner's fix list for Apex Moto (see README.md in this folder).
// Owner Oct 18 10:23 PM: "create a motorcycle racing game and put these motorcycles in it as the racing line up, make a few
// extra colors like the epic Cruz" + 10:27 "green, blue and orange extra apex motorcycles, so many bikes to choose from"
// + 10:28 "and more computer racers".
export default [
  {
    id: 'play-all-his-bikes',
    ask: 'All the bikes he sent are in the garage, plus green / blue / orange Apex bikes',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__moto; if (!M) return 'no window.__moto';
        const models = new Set(M.BIKES.map(b => b.model));
        for (const m of ['apex', 'street', 'race', 'phantom']) if (!models.has(m)) return 'missing bike model ' + m;
        for (const c of ['green', 'blue', 'orange']) if (!M.BIKES.some(b => b.model === 'apex' && b.paint === c)) return 'no ' + c + ' Apex bike';
        return M.BIKES.length >= 7 ? true : `only ${M.BIKES.length} bikes to choose from`;
      });
    },
  },
  {
    id: 'play-epic-cruz-paint',
    ask: 'Extra paint jobs like the Epic Cruz',
    async test(page, h) {
      return h.eval(() => { const M = window.__moto; const ids = M.PAINTS.map(p => p.id);
        return ids.includes('epic') && ids.filter(i => /^c/.test(i)).length >= 3 && ids.length >= 8 ? true : 'paint jobs missing: ' + ids.join(','); });
    },
  },
  {
    id: 'play-more-racers',
    ask: 'More computer racers in the line-up',
    async test(page, h) {
      await h.wait(4000);
      return h.eval(() => { const M = window.__moto; const ai = M.racers.filter(r => !r.isPlayer).length;
        return ai >= 10 ? true : `only ${ai} computer racers on the grid`; });
    },
  },
  {
    id: 'play-ai-race-laps',
    ask: 'Computer racers race the circuit (no one stuck)',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__moto; if (!M.racers.length) return 'no racers';
        const ai = M.racers.filter(r => !r.isPlayer), p0 = ai.map(r => r.prog), keep = M.state; M.state = 'test';
        for (let k = 0; k < 60 * 40; k++) for (const r of ai) M.stepRacer(r, 1 / 60);
        M.state = keep;
        const slow = ai.filter((r, i) => r.prog - p0[i] < 900);
        return slow.length ? `${slow.length} racers went under 900 m in 40 s` : true;
      });
    },
  },
  {
    id: 'play-player-rides',
    ask: 'Your bike speeds up and rides the track',
    async test(page, h) {
      return h.eval(() => {
        const M = window.__moto, P = M.player; if (!P) return 'no player bike';
        const g0 = P.prog, keep = M.state; M.state = 'test'; M.input.gas = true;
        for (let k = 0; k < 60 * 8; k++) { M.input.steerA = 0; M.stepRacer(P, 1 / 60); }
        M.input.gas = false; M.state = keep;
        return P.sp > 40 && P.prog - g0 > 150 ? true : `player at ${P.sp.toFixed(0)} m/s, moved ${(P.prog - g0).toFixed(0)} m in 8 s`;
      });
    },
  },
  {
    id: 'play-tires-on-asphalt',
    ask: "Owner Oct 19: the motorcycle tires are going into the asphalt - tires always sit on top of it, not in it",
    async test(page, h) {
      return h.eval(async () => {
        const M = window.__moto, T = M.THREE, bad = [];
        for (const k of Object.keys(M.MODELS)) { await M.loadModel(k);
          const b = M.buildBike({ model: k, paint: 'orig' }); b.g.position.set(0, M.ROAD_Y + 0.01, 5000); b.g.updateMatrixWorld(true);
          const ray = new T.Raycaster(); let lowest = 99;
          for (const f of [-0.42, -0.36, 0.36, 0.42]) { ray.set(new T.Vector3(0, -5, 5000 + f * M.MODELS[k].len), new T.Vector3(0, 1, 0)); const hit = ray.intersectObject(b.lean, true)[0]; if (hit) lowest = Math.min(lowest, hit.point.y); }
          M.scene.remove(b.g);
          if (lowest < M.ROAD_Y - 0.005) bad.push(`${k} tire ${((M.ROAD_Y - lowest) * 100).toFixed(1)} cm into the road`);
          if (lowest > M.ROAD_Y + 0.06) bad.push(`${k} floats ${((lowest - M.ROAD_Y) * 100).toFixed(1)} cm above the road`); }
        return bad.length ? bad.join('; ') : true;
      });
    },
  },
  {
    id: 'play-credits',
    ask: 'Every CC-BY bike maker is credited',
    async test(page, h) {
      return h.eval(() => { const t = document.getElementById('credits').textContent;
        const miss = ['Silas6', 'Tahseen', 'JonnyMANSON'].filter(n => !t.includes(n)); return miss.length ? 'credits missing ' + miss.join(', ') : true; });
    },
  },
];
