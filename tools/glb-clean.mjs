// Owner Oct 19 (Gemini idea "asset sanitizer"): before a fetched model reaches a game, take out the flat
// shadow / ground / backdrop pieces. On the V12 Goblin a hidden square shadow made the game size the car
// at HALF size and turn it SIDEWAYS. Usage: cp tools/glb-clean.mjs /tmp/gt/ && node /tmp/gt/glb-clean.mjs in.glb out.glb
// The robot copies this file into /tmp/gt (where the libraries are installed) and runs it from there.
import { NodeIO, getBounds } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
process.on('uncaughtException', (e) => { console.log('::error title=Model cleaner::' + e.message); process.exit(1); });
const [inp, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); const doc = await io.read(inp);
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
// Gemini idea (owner Oct 19): a model whose HEIGHT is its longest side came in standing up / tipped over
if (sz[1] === Math.max(...sz) && !/person|man|woman|player|character|human|tree|tower|lamp/i.test(out))
  console.log(`::warning title=Model cleaner::${out} looks STANDING UP (taller than it is long) - turn it flat in the game's wrapper`);
console.log(`::notice title=Model cleaner::${out}: removed ${removed.length ? removed.join(', ') : 'nothing'}; size ${sz.join(' x ')}; long side = ${long}`);
