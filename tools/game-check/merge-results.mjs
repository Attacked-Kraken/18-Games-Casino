// Puts the side-by-side robots' results back together (game-check-pr.yml): parts/<name>/results.json + img/ ->
// <out>/results.json + <out>/img/. A game that was planned but has no part = "missing" (its robot failed or timed out).
//   node tools/game-check/merge-results.mjs parts/ game-check-out/ "apexhockey.html,apexf1.html"
import fs from 'fs';
import path from 'path';
process.on('uncaughtException', (e) => { console.log('::error title=Merge results crashed::' + String(e && e.stack || e).slice(0, 300).replace(/\n/g, ' ')); process.exit(1); });
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
  // pictures: files AND folders (img/models/ holds the 3D model shots - Oct 21: a plain copyFileSync on that folder
  // crashed the whole verdict step of PR #873 with no reason shown)
  const img = path.join(parts, d, 'img');
  if (fs.existsSync(img)) { try { fs.cpSync(img, path.join(out, 'img'), { recursive: true, force: true }); } catch (e) { console.log('::warning title=Merge results::could not copy pictures of ' + d + ': ' + e.message); } }
  const clips = path.join(parts, d, 'clips');
  if (fs.existsSync(clips)) { try { fs.cpSync(clips, path.join(out, 'clips'), { recursive: true, force: true }); } catch (e) {} }
}
const missing = (planned || '').split(',').map(x => x.trim()).filter(x => x && x !== 'models' && !seen.has(x));
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ when, sha, results, models, missing }, null, 1));
console.log(`merged ${results.length} game(s), ${models.length} model(s)` + (missing.length ? `; MISSING: ${missing.join(', ')}` : ''));
