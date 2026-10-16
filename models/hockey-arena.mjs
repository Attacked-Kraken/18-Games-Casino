// Hockey arena for the 3D model gate (MODELS.md), shown in the venue viewer at real size:
//   tools/venue-viewer.html?m=models/hockey-arena.mjs&look=rink&name=Hockey%20arena
// The shared stadium kit (venues/kit/stadium.js, preset 'arena') around the real-size rink (venues/kit/rink.js),
// following venues/rink.md. ?cheer=1 = a goal celebration.
export async function buildHockeyArena() {
  const THREE = window.THREE;
  const { buildStadium } = await import(new URL('../venues/kit/stadium.js', import.meta.url).href);
  const { buildRink, RINK } = await import(new URL('../venues/kit/rink.js', import.meta.url).href);
  const home = 0x1f6fd6, away = 0x0e7c7b;
  const st = buildStadium(THREE, { preset: 'arena', floor: { a: RINK.L / 2, b: RINK.W / 2, r: RINK.R }, setback: 2.6, home, away });
  const rink = buildRink(THREE, { home, away });
  st.setScore({ home: 'WOLVES', away: 'SHARKS', hs: 2, as: 1, clock: '12:47', period: '2ND' });
  const g = new THREE.Group(); g.add(st.group, rink.group);
  window.__venue = { stadium: st.report(), rink: rink.report() };
  return { group: g, stadium: st,
    cams: { front: { pos: [0, 15, 32], at: [0, 0, -2] },            // TV camera: high on the long side
            side: { pos: [44, 11, 0], at: [0, 2, 0] },              // behind the net, upper bowl
            floor: { pos: [-20, 1.8, 9], at: [5, 7, -6] } } };       // a player's eye view up into the crowd
}
