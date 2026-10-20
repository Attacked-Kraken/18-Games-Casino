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
if (carried.length) {
  let md = `\n# Not changed since the last check\n\nThese games' files didn't change, so the robot kept their last result ` +
    `(played at main @ \`${prev.sha || '?'}\`). A full check of every game runs every 4 hours.\n\n`;
  for (const r of carried) {
    md += `## ${{ PASS: '✅ PASS', CHECK: '🟡 CHECK', FAIL: '🔴 FAIL' }[r.status] || r.status} — ${r.name}\n\n\`${r.file}\`\n\n`;
    for (const x of r.fail || []) md += `- 🔴 ${x}\n`;
    for (const x of r.check || []) md += `- 🟡 ${x}\n`;
    if (r.img) md += `\n<img src="${r.img.menu}" width="300"> <img src="${r.img.play}" width="300">\n\n`;
  }
  fs.appendFileSync(path.join(out, 'README.md'), md);
}
console.log(`re-played ${have.size}, kept ${carried.length}: ${carried.map(r => r.file).join(', ') || '-'}`);
