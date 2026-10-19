// Prints how many triangles a .glb has (owner Oct 19, Gemini idea #2: "cap 3D asset detail so phones don't stutter").
// No libraries: reads the glTF JSON inside the .glb and adds up every triangle primitive. Usage: node tools/glb-tris.mjs file.glb
import fs from 'fs';
const b = fs.readFileSync(process.argv[2]);
if (b.readUInt32LE(0) !== 0x46546c67) { console.log(0); process.exit(0); }
const len = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + len).toString('utf8'));
let tris = 0;
for (const m of j.meshes || []) for (const p of m.primitives || []) {
  const mode = p.mode ?? 4; if (mode !== 4 && mode !== 5 && mode !== 6) continue;
  const n = p.indices != null ? j.accessors[p.indices].count : (j.accessors[p.attributes.POSITION] || {}).count || 0;
  tris += mode === 4 ? Math.floor(n / 3) : Math.max(0, n - 2);
}
// a mesh used many times (nodes pointing to the same mesh) costs every time it is drawn
const uses = {}; for (const nd of j.nodes || []) if (nd.mesh != null) uses[nd.mesh] = (uses[nd.mesh] || 0) + 1;
let drawn = 0;
(j.meshes || []).forEach((m, i) => { let t = 0; for (const p of m.primitives || []) { const n = p.indices != null ? j.accessors[p.indices].count : (j.accessors[p.attributes.POSITION] || {}).count || 0; t += Math.floor(n / 3); } drawn += t * (uses[i] || 1); });
console.log(Math.max(tris, drawn));
