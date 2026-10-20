// Owner Oct 19 (Gemini idea "asset sanitizer"): before a fetched model reaches a game, take out the flat
// shadow / ground / backdrop pieces. On the V12 Goblin a hidden square shadow made the game size the car
// at HALF size and turn it SIDEWAYS. Usage: node tools/glb-clean.mjs in.glb out.glb   (needs GT_DIR = where
// @gltf-transform/core + functions are installed)
import { createRequire } from 'module';
const req = createRequire((process.env.GT_DIR || '/tmp/gt') + '/package.json');
const { NodeIO, getBounds } = req('@gltf-transform/core');
const { prune } = req('@gltf-transform/functions');
const [inp, out] = process.argv.slice(2);
const io = new NodeIO(); const doc = await io.read(inp);
const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
const whole = getBounds(scene); const span = Math.max(...whole.max.map((v, i) => v - whole.min[i])) || 1;
const removed = [];
for (const node of doc.getRoot().listNodes()) {
  if (!node.getMesh()) continue;
  const b = getBounds(node); const s = b.max.map((v, i) => v - b.min[i]);
  const flat = s[1] < span * 0.01 && Math.max(s[0], s[2]) > span * 0.3;           // a thin flat sheet
  const named = /shadow|ground|floor|backdrop|plane0|^plane/i.test(node.getName() + ' ' + node.getMesh().getName());
  if (flat || named) { removed.push(node.getName() || '(no name)'); node.dispose(); }
}
await doc.transform(prune());
await io.write(out, doc);
const nb = getBounds(doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0]);
const sz = nb.max.map((v, i) => +(v - nb.min[i]).toFixed(2));
const long = ['X (sideways in most games)', 'Y (standing up!)', 'Z (front-back)'][sz.indexOf(Math.max(...sz))];
console.log(`::notice title=Model cleaner::${out}: removed ${removed.length ? removed.join(', ') : 'nothing'}; size ${sz.join(' x ')}; long side = ${long}`);
