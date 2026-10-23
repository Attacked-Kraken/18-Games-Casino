// Lints checklists/*.md: every item needs SOURCE (existing file), NUMBERS (each token word-for-word in that file),
// MEASURE, TEST = tester-chk-<id>, unique id. Usage: node tools/game-check/checklist-lint.mjs [dir]
import fs from 'node:fs'; import path from 'node:path';
const root = process.cwd(); const dir = process.argv[2] || 'checklists';
let bad = 0; const fail = (f, id, why) => { bad++; console.log(`CHECKLIST FAIL ${f} ${id}: ${why}`); };
for (const f of fs.readdirSync(path.join(root, dir)).filter(x => x.endsWith('.md') && x !== 'README.md')) {
  const ids = new Set();
  for (const line of fs.readFileSync(path.join(root, dir, f), 'utf8').split('\n')) {
    const m = line.match(/^- \[( |x|-)\] ([A-Z]\d+) \| (.*)$/); if (!m) continue;
    const id = m[2]; const parts = m[3].split(' | ').map(s => s.trim());
    const get = k => (parts.find(p => p.startsWith(k + ':')) || '').slice(k.length + 1).trim();
    if (ids.has(id)) fail(f, id, 'duplicate id'); ids.add(id);
    const src = get('SOURCE'), nums = get('NUMBERS'), meas = get('MEASURE'), test = get('TEST');
    if (!src || !fs.existsSync(path.join(root, src))) { fail(f, id, `SOURCE missing/not a file: ${src}`); continue; }
    if (!nums) fail(f, id, 'no NUMBERS');
    if (!meas) fail(f, id, 'no MEASURE');
    if (test !== 'tester-chk-' + id.toLowerCase()) fail(f, id, `TEST must be tester-chk-${id.toLowerCase()}`);
    const text = fs.readFileSync(path.join(root, src), 'utf8');
    for (const n of nums.split(',').map(s => s.trim()).filter(Boolean)) if (!text.includes(n)) fail(f, id, `number "${n}" not found in ${src}`);
  }
}
console.log(bad ? `${bad} problem(s)` : 'checklists OK');
process.exit(bad ? 1 : 0);
