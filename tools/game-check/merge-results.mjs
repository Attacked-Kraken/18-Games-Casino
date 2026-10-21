// Puts the side-by-side robots' results back together (game-check-pr.yml): parts/<name>/results.json + img/ ->
// <out>/results.json + <out>/img/. A game that was planned but has no part = "missing" (its robot failed or timed out).
//   node tools/game-check/merge-results.mjs parts/ game-check-out/ "apexhockey.html,apexf1.html"
import fs from 'fs';
import path from 'path';
const [parts, out, planned] = process.argv.slice(2);
fs.mkdirSync(path.join(out, 'img'), { recursive: true });
const results = [], models = [], seen = new Set();
let when = '', sha = '';
for (const d of fs.existsSync(parts) ? fs.readdirSync(parts).sort() : []) {
  const f = path.join(parts, d, 'results.json');
  if (!fs.existsSync(f)) continue;
  let j = {}; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { continue; }
  when = when || j.when || ''; sha = sha || j.sha || '';
  for (const r of j.results || []) if (!seen.has(r.file)) { seen.add(r.file); results.push(r); }
  for (const m of j.models || []) if (!models.some(x => x.id === m.id && x.name === m.name)) models.push(m);
  const img = path.join(parts, d, 'img');
  if (fs.existsSync(img)) for (const x of fs.readdirSync(img)) fs.copyFileSync(path.join(img, x), path.join(out, 'img', x));
  for (const extra of ['blockers.txt']) { /* parts never judge */ }
}
const missing = (planned || '').split(',').map(x => x.trim()).filter(x => x && x !== 'models' && !seen.has(x));
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ when, sha, results, models, missing }, null, 1));
console.log(`merged ${results.length} game(s), ${models.length} model(s)` + (missing.length ? `; MISSING: ${missing.join(', ')}` : ''));
