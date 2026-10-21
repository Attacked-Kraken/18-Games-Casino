// Writes README.md for a side-by-side main check (game-check.yml, owner Oct 21 2026 "needs to be faster"):
// the games were played in parallel and put back together by merge-results.mjs; this writes the same picture report
// check.mjs writes for a single run. Usage: node tools/game-check/report.mjs game-check-out
import fs from 'fs';
import path from 'path';
const out = process.argv[2] || 'game-check-out';
let j = {}; try { j = JSON.parse(fs.readFileSync(path.join(out, 'results.json'), 'utf8')); } catch (e) {}
const results = j.results || [], models = j.models || [];
const when = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' });
const sha = (process.env.GITHUB_SHA || j.sha || '').slice(0, 7);
if (sha) j.sha = sha;
j.when = j.when || when;
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(j, null, 1));
const count = s => results.filter(r => r.status === s).length;
let md = `# Game check\n\n**${when} (Central)**${sha ? ` · main @ \`${sha}\`` : ''} · played side by side\n\n`;
md += `**${count('PASS')} pass · ${count('CHECK')} to check · ${count('FAIL')} fail** out of ${results.length} games.\n\n`;
if ((j.missing || []).length) md += `⚠️ The robot could not finish: ${j.missing.join(', ')} (kept their last result if there was one).\n\n`;
const order = { FAIL: 0, CHECK: 1, PASS: 2 };
for (const r of results.slice().sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3))) {
  md += `## ${{ PASS: '✅ PASS', CHECK: '🟡 CHECK', FAIL: '🔴 FAIL' }[r.status] || r.status} — ${r.name}\n\n\`${r.file}\`\n\n`;
  for (const x of r.fail || []) md += `- 🔴 ${x}\n`;
  for (const x of r.check || []) md += `- 🟡 ${x}\n`;
  if (r.status === 'PASS') md += `- Loaded, started and moving. Nothing flagged.\n`;
  if (r.fixes && r.fixes.length) {
    md += `\n**Owner's fix list** (${r.fixes.filter(f => f.ok).length} of ${r.fixes.length} done):\n`;
    for (const f of r.fixes) md += `- ${f.ok ? '✅' : '❌'} ${f.ask}${!f.ok && f.note ? ' — ' + f.note : ''}\n`;
  }
  const im = r.img || {};
  md += `\n${[im.menu && `<img src="${im.menu}" width="300">`, im.play && `<img src="${im.play}" width="300">`, im.upright && `<img src="${im.upright}" width="90">`, im.face && `<img src="${im.face}" width="120">`].filter(Boolean).join(' ')}\n\n`;
}
const shown = models.filter(m => m.img);
if (shown.length) {
  md += `# 3D models (MODELS.md)\n\n`;
  for (const m of shown) {
    md += `## ${m.name} — ${m.status || ''}\n\n${m.info || ''}\n\n`;
    for (const x of m.problems || []) md += `- 🔴 ${x}\n`;
    md += ['q', 'front', 'side'].filter(k => m.img[k]).map(k => `<img src="${m.img[k]}" width="300">`).join(' ') + '\n\n';
  }
}
md += `---\nMade by tools/game-check (runs after every merge to main, one robot per game side by side).\n`;
fs.writeFileSync(path.join(out, 'README.md'), md);
console.log(`report: ${results.length} games, ${count('FAIL')} fail`);
