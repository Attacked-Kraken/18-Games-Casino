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
// owner Oct 21 2026 (Sketchfab robot upgrade a): the MODEL-REQUESTS line may say a real size - "length 4.6 m", "height 1.8 m"
// or "width 2 m" - and the model is scaled to it here, so no game guesses. length = the longest flat side (X or Z),
// height = Y, width = the shorter flat side.
const want = /^(length|height|width)\s+([\d.]+)/i.exec(process.env.SIZE || '');
if (want) {
  const sc = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const bb = getBounds(sc); const d = bb.max.map((v, i) => v - bb.min[i]);
  const have = want[1].toLowerCase() === 'height' ? d[1] : want[1].toLowerCase() === 'width' ? Math.min(d[0], d[2]) : Math.max(d[0], d[2]);
  const f = +want[2] / (have || 1);
  if (f > 0 && isFinite(f) && Math.abs(f - 1) > 0.01) {
    for (const n of sc.listChildren()) { const s0 = n.getScale(); n.setScale([s0[0] * f, s0[1] * f, s0[2] * f]); const t0 = n.getTranslation(); n.setTranslation([t0[0] * f, t0[1] * f, t0[2] * f]); }
    console.log(`::notice title=Model cleaner::${out}: scaled x${f.toFixed(3)} so its ${want[1].toLowerCase()} is ${want[2]} m (was ${have.toFixed(2)} m)`);
  }
}
await io.write(out, doc);
const nb = getBounds(doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0]);
const sz = nb.max.map((v, i) => +(v - nb.min[i]).toFixed(2));
const long = ['X (sideways in most games)', 'Y (standing up!)', 'Z (front-back)'][sz.indexOf(Math.max(...sz))];
// Gemini idea (owner Oct 19): a model whose HEIGHT is its longest side came in standing up / tipped over
if (sz[1] === Math.max(...sz) && !/person|man|woman|player|character|human|tree|tower|lamp/i.test(out))
  console.log(`::warning title=Model cleaner::${out} looks STANDING UP (taller than it is long) - turn it flat in the game's wrapper`);
console.log(`::notice title=Model cleaner::${out}: removed ${removed.length ? removed.join(', ') : 'nothing'}; size ${sz.join(' x ')}; long side = ${long}`);
