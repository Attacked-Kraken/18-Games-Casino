// Joins the 4 testers' results into one report (README.md + results.json) for the "playtests" branch.
// Usage: node tools/playtest/report.mjs <dir with results-*.json and img/>
import fs from 'fs';
import path from 'path';
const dir = process.argv[2] || 'playtest-out';
const results = [];
for (const f of fs.readdirSync(dir).filter(f => /^results-.*\.json$/.test(f))) {
  try { results.push(...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); } catch (e) {}
}
results.sort((a, b) => (a.status === 'ISSUES' ? 0 : 1) - (b.status === 'ISSUES' ? 0 : 1) || a.file.localeCompare(b.file));
const when = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' });
const sha = (process.env.GITHUB_SHA || '').slice(0, 7);
let md = `# 🎮 Play testers\n\n**${when} (Central)** · main @ \`${sha}\`\n\n` +
  `4 robot testers really PLAYED each game for a few minutes in 3 styles (gas = holds drive, masher = taps every button, ` +
  `swiper = drags across the screen) and wrote down what went wrong. Muses: fix your game's lines, then the next ` +
  `round checks it again. Made by tools/playtest.\n\n`;
for (const r of results) {
  md += `## ${r.status === 'ISSUES' ? '🔴' : '✅'} ${r.name} — \`${r.file}\`\n\n`;
  if (!r.problems.length) md += `- Played all 3 styles, nothing wrong.\n`;
  for (const p of r.problems) md += `- ${p.what}${p.img ? ` ([picture](${p.img}))` : ''}\n`;
  const st = Object.entries(r.styles || {}).map(([k, v]) => `${k}: moving ${v.motion}%, rounds ended ${v.overs}`).join(' · ');
  if (st) md += `\n<sub>${st}${r.firstOverS ? ` · first round ended after ${r.firstOverS} s` : ''}</sub>\n`;
  const pics = r.problems.filter(p => p.img).slice(0, 2).map(p => p.img);
  if (r.end && !pics.length) pics.push(r.end);
  if (pics.length) md += '\n' + pics.map(p => `<img src="${p}" width="300">`).join(' ') + '\n';
  md += '\n';
}
fs.writeFileSync(path.join(dir, 'README.md'), md);
fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify({ when, sha, results }, null, 1));
console.log(md);
