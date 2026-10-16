// Game-check fix test for JOB J2 (motorcycle-world).
// Encodes the NEVER list from looks/motorcycle-world.md as runnable checks.
// Run: node tools/game-check/fixes/motorcycle-world.mjs
// Exit 0 = PASS, non-zero = FAIL with reason on stderr.
import * as THREE from '../../../three.module.min.js';
globalThis.THREE = THREE;
const { buildMotorcycle } = await import('../../../models/motorcycle-main.mjs');

const { group, wheels } = buildMotorcycle();
let failed = 0;
const fail = (msg) => { console.error('FAIL: ' + msg); failed = 1; };

// NEVER: nothing below the ground plane (y < 0)
const bbox = new THREE.Box3().setFromObject(group);
if (bbox.min.y < -0.01) fail(`model sinks below ground (bbox.min.y = ${bbox.min.y.toFixed(3)})`);

// NEVER: hollow see-through wheels — each wheel must carry a solid rim/disc
for (let i = 0; i < wheels.length; i++) {
  const hasRim = wheels[i].children.some(m =>
    m.geometry && m.geometry.type === 'CylinderGeometry' &&
    (m.geometry.parameters.radiusTop >= 0.15 || m.geometry.parameters.radiusBottom >= 0.15));
  if (!hasRim) fail(`wheel ${i} has no solid rim (hollow torus, see-through center)`);
}

if (!failed) console.log('PASS: motorcycle-world NEVER-list checks');
process.exit(failed);
