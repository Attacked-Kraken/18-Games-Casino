// Track & field stadium for the 3D model gate (MODELS.md), shown in the venue viewer at real size:
//   tools/venue-viewer.html?m=models/track-stadium.mjs&look=track&name=Track%20%26%20Field%20stadium
// The shared stadium kit (venues/kit/stadium.js, preset 'stadium') wrapped around the real 400m oval
// from venues/track.md, using the EXACT config apextrackfield.html races in (JOB J7) - same tiers,
// same colours, same scoreboard line - so the owner approves the very venue that is in the game.
export async function buildTrackStadium() {
  const THREE = window.THREE;
  const { buildStadium } = await import(new URL('../venues/kit/stadium.js', import.meta.url).href);
  const st = buildStadium(THREE, { floor: { a: 78.7, b: 36.5, r: 36.5 }, setback: 11, preset: 'stadium',
    tiers: [{ rows: 24, depth: .8, rise: .4 }, { rows: 18, depth: .8, rise: .52, gap: 3.5, lift: 4 }],
    home: 0x2456a8, away: 0xd8dde6, homeShare: 0.34, awayShare: 0.08, fill: 0.92 });
  // Centered: the kit builds the bowl symmetric around its own origin (measured bbox
  // x -128.25..128.25, z -86.05..86.05), and the oval below is built around the same
  // origin, so the track sits in the middle of the stadium. (The game offsets the bowl
  // group inside its larger world layout; a standalone model must NOT copy that offset.)
  st.setScore({ home: 'APEX', away: 'GAMES', hs: '', as: '', clock: 'TRACK & FIELD', period: 'COLLEGE STADIUM' });

  // the 400m oval at real size: 84.39m straights, 36.5m bends, 8 lanes x 1.22m (venues/track.md)
  const HS = 84.39 / 2;
  const capsule = (R) => {
    const pts = [];
    pts.push(new THREE.Vector2(-HS, -R));
    pts.push(new THREE.Vector2(HS, -R));
    for (let i = 1; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * Math.PI; pts.push(new THREE.Vector2(HS + Math.cos(a) * R, Math.sin(a) * R)); }
    pts.push(new THREE.Vector2(-HS, R));
    for (let i = 1; i <= 24; i++) { const a = Math.PI / 2 + (i / 24) * Math.PI; pts.push(new THREE.Vector2(-HS + Math.cos(a) * R, Math.sin(a) * R)); }
    return pts;
  };
  const g = new THREE.Group();
  const trackShape = new THREE.Shape(capsule(36.5 + 9.76));
  trackShape.holes.push(new THREE.Path(capsule(36.5 - 0.3)));
  const track = new THREE.Mesh(new THREE.ShapeGeometry(trackShape, 4),
    new THREE.MeshStandardMaterial({ color: 0x2e63a8, roughness: 0.95 }));
  track.rotation.x = -Math.PI / 2; track.position.y = 0.02;
  g.add(track);
  const infield = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(capsule(36.5 - 0.3)), 4),
    new THREE.MeshStandardMaterial({ color: 0x3d9950, roughness: 1 }));
  infield.rotation.x = -Math.PI / 2; infield.position.y = 0.015;
  g.add(infield);
  const fin = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 9.76),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  fin.rotation.x = -Math.PI / 2; fin.rotation.z = Math.PI / 2;
  fin.position.set(0, 0.035, -(36.5 + 4.58)); // the finish line, end of the home straight
  g.add(fin);
  g.add(st.group);
  window.__venue = { stadium: st.report() };
  return { group: g, stadium: st,
    cams: { front: { pos: [0, 15, -95], at: [0, 2, -20] },          // TV camera: over the home straight
            side: { pos: [150, 55, 0], at: [0, 0, 0] },              // aerial end view of the whole oval
            floor: { pos: [-14, 1.8, -41.4], at: [30, 3, -41.4] } } }; // at the finish line, looking down the straight
}
