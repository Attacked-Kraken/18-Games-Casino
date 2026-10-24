// Merge robot helper (Oct 23 2026, owner: "cards faster"). Two pull requests that each ADD play tests to the same
// tools/game-check/fixes/<game>.mjs always conflict at the end of the list. Text merging breaks the file, so merge by ENTRY:
//   node merge-play-tests.mjs <base.mjs> <pr.mjs> <main.mjs> <out.mjs>
// out = main's file untouched + every test whose id only the PR has, appended before the closing "];".
// A test that BOTH sides changed (same id, different code) is not guessed: exit 2, the Muse merges it by hand.
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const [base, pr, main, out] = process.argv.slice(2).map(p => path.resolve(p));
const load = async (p, tag) => { const t = p + '.' + tag + '.mjs'; fs.copyFileSync(p, t); try { return (await import(pathToFileURL(t).href)).default; } finally { fs.unlinkSync(t); } };
const key = t => JSON.stringify(Object.entries(t).map(([k, v]) => [k, typeof v === 'function' ? v.toString() : v]));
const B = new Map((await load(base, 'b')).map(t => [t.id, key(t)]));
const P = await load(pr, 'p');
const M = new Map((await load(main, 'm')).map(t => [t.id, key(t)]));
const add = [];
for (const t of P) {
  const k = key(t);
  if (M.has(t.id)) {
    if (M.get(t.id) === k) continue;                         // same on both sides
    if (B.has(t.id) && B.get(t.id) === k) continue;          // PR never touched it; main changed it
    if (B.has(t.id) && B.get(t.id) === M.get(t.id)) {        // only the PR changed it - cannot patch in place safely
      console.error('PR changed existing test ' + t.id); process.exit(2);
    }
    console.error('both sides changed test ' + t.id); process.exit(2);
  }
  if (B.has(t.id)) continue;                                  // main deleted it on purpose
  const parts = [];
  for (const [k2, v] of Object.entries(t)) {
    if (typeof v === 'function') {
      const s = v.toString();
      parts.push(new RegExp('^(async\\s+)?' + k2 + '\\s*\\(').test(s) ? s : k2 + ': ' + s);
    } else parts.push(k2 + ': ' + JSON.stringify(v));
  }
  add.push('  {\n    ' + parts.join(',\n    ') + ',\n  },\n');
}
let txt = fs.readFileSync(main, 'utf8');
const i = txt.lastIndexOf('\n];');
if (i < 0) { console.error('no closing ]; in main file'); process.exit(2); }
let head = txt.slice(0, i + 1).replace(/\s+$/, '\n');
if (!/[,\[]\s*$/.test(head.trimEnd()) ) head = head.trimEnd() + ',\n';
fs.writeFileSync(out, head + add.join('') + txt.slice(i + 1));
console.log('added ' + add.length + ' test(s): ' + add.map(a => /id: ['"]([^'"]+)['"]/.exec(a)?.[1]).join(', '));
