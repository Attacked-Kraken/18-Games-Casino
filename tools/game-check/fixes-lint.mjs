// Fixes-file lint (Oct 25 2026, window 5 idea, VP): an `h.eval(...)` whose page code navigates, reloads, waits or polls can lose its
// execution context ("Execution context was destroyed") on the robot's browser - and that error never shows on a Muse's local runner.
// RULE: such an h.eval must end with .catch(...) or sit inside try { } catch { }. This lint names the test id and the line BEFORE the
// robot runs. Yellow (CHECK) only: it never blocks a PR. Usage: import { lintFixes } ; or `node fixes-lint.mjs file.mjs` ; `--self` = self test.
import fs from 'node:fs';

const RISKY = /location\s*[.=]|\.reload|history\.|setTimeout|setInterval|new Promise|requestAnimationFrame/;

function closeParen(src, open) {                       // index of the ) matching the ( at `open`, skipping strings/comments
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i = src.indexOf('*/', i + 2); if (i < 0) return -1; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { const q = c; for (i++; i < src.length && src[i] !== q; i++) if (src[i] === '\\') i++; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

export function lintFixes(src) {
  const out = [];
  const idAt = (pos) => { let id = ''; const re = /id:\s*['"]([^'"]+)['"]/g; let m; while ((m = re.exec(src)) && m.index < pos) id = m[1]; return id; };
  const re = /\bh\.eval\s*\(/g; let m;
  while ((m = re.exec(src))) {
    const open = m.index + m[0].length - 1, end = closeParen(src, open);
    if (end < 0) continue;
    const body = src.slice(open, end + 1);
    if (!RISKY.test(body)) continue;                                   // plain read of the page: cannot lose its context mid-wait
    if (/^\s*\.catch\s*\(/.test(src.slice(end + 1, end + 40))) continue;
    const before = src.slice(Math.max(0, m.index - 600), m.index);
    if (/try\s*\{[^}]*$/.test(before) || /try\s*\{(?:(?!\}\s*catch)[\s\S])*$/.test(before)) continue;   // inside try { } catch
    out.push({ id: idAt(m.index), line: src.slice(0, m.index).split('\n').length });
  }
  return out;
}

export function lintLines(src, slug) {
  return lintFixes(src).map(x => `LINT fixes/${slug}.mjs line ${x.line}: test ${x.id || '?'} has an h.eval that navigates / waits / polls but no .catch - add .catch(() => false) (or wrap it in try/catch) so a destroyed execution context does not fail the test`);
}

if (process.argv[1] && process.argv[1].endsWith('fixes-lint.mjs')) {
  if (process.argv.includes('--self')) {
    const bad = `export default [{ id: 'tester-a', test: async (p, h) => { await h.eval(async () => { await new Promise(r => setTimeout(r, 500)); return 1; }); } }];`;
    const good1 = `export default [{ id: 'tester-b', test: async (p, h) => { await h.eval(async () => { await new Promise(r => setTimeout(r, 500)); return 1; }).catch(() => false); } }];`;
    const good2 = `export default [{ id: 'tester-c', test: async (p, h) => { try { await h.eval(() => { location.reload(); }); } catch (e) {} } }];`;
    const plain = `export default [{ id: 'tester-d', test: async (p, h) => { return await h.eval(() => document.title.length > 0); } }];`;
    const r = [lintFixes(bad).length, lintFixes(good1).length, lintFixes(good2).length, lintFixes(plain).length];
    console.log('self test (want 1,0,0,0):', r.join(','), lintFixes(bad)[0]);
    process.exit(r.join(',') === '1,0,0,0' ? 0 : 1);
  }
  for (const f of process.argv.slice(2)) {
    const src = fs.readFileSync(f, 'utf8'); const hits = lintLines(src, f.split('/').pop().replace('.mjs', ''));
    console.log(f + ': ' + hits.length + ' hit(s)'); hits.forEach(h => console.log('  ' + h));
  }
}
