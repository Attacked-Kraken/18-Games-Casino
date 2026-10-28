// Fast main checks (Oct 20): a main run re-plays only the games its merges changed. This keeps the last report's
// result + pictures for every other game (it is the same code, so the same result), so results.json always
// lists every game. Usage: node carry.mjs prev-results.json game-check-out old-checks-dir
import fs from 'fs';
import path from 'path';
const [prevFile, out, oldDir] = process.argv.slice(2);
let prev = {}; try { prev = JSON.parse(fs.readFileSync(prevFile, 'utf8')); } catch (e) {}
const resFile = path.join(out, 'results.json');
let cur; try { cur = JSON.parse(fs.readFileSync(resFile, 'utf8')); } catch (e) { process.exit(0); }
const have = new Set((cur.results || []).map(r => r.file));
const copyImg = (rel) => {
  if (typeof rel !== 'string' || !rel || rel.includes('..')) return;
  const from = path.join(oldDir, rel), to = path.join(out, rel);
  try { if (fs.existsSync(from) && !fs.existsSync(to)) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); } } catch (e) {}
};
const carried = [];
for (const r of (prev.results || [])) {
  if (!r || !r.file || have.has(r.file)) continue;
  if (!fs.existsSync(r.file)) continue;                       // game was removed from main
  const c = { ...r, carried: r.carried || prev.sha || '' };   // sha of the run that really played it
  for (const v of Object.values(c.img || {})) copyImg(v);
  cur.results.push(c); carried.push(c);
}
if (process.env.SKIP_MODELS && Array.isArray(prev.models)) {
  cur.models = prev.models;
  for (const m of prev.models) for (const v of Object.values(m.img || {})) copyImg(v);
}
fs.writeFileSync(resFile, JSON.stringify(cur, null, 1));
// The README is written by report.mjs AFTER this runs (it lists carried games under "Not changed since the last check").
console.log(`re-played ${have.size}, kept ${carried.length}: ${carried.map(r => r.file).join(', ') || '-'}`);
