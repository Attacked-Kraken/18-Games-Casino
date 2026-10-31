// SCOPED CHECKS (window 6's pick, owner Oct 27 2026 10:39 PM "build what window 6 needs", master #122).
// A pull request that changes ONE part of a game replays only the play tests that part can affect, plus the always-on tests.
// Usage: node tools/game-check/scope.mjs <game.html> <base-sha> -> prints a comma list of test ids to play, or NOTHING (= play every test).
// Opt-in: a test says what it can be affected by with `parts: ['rims','wheels']`. A test with NO `parts` is ALWAYS-ON (always played),
// so nothing is skipped until a Muse/Claude tags tests. A file with no tagged test = play all. Any doubt = play all (never fewer tests by accident).
// Always played: untagged tests, ids starting owner-/never-/guard-/census, tests added or changed in this PR, tests tagged 'all'.
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { spawnSync } from 'child_process';
import { partOfLines } from './judge.mjs';

export function scopeIds({ game, tests, touchedParts, changedIds }) {
  const tagged = tests.filter(t => Array.isArray(t.parts) && t.parts.length);
  if (!tagged.length) return null;                       // nothing tagged -> play all
  if (!touchedParts || !touchedParts.length) return null;  // changed a place no part owns -> play all
  const want = new Set();
  for (const p of touchedParts) { want.add(p.toLowerCase()); const d = (game.parts || []).find(x => x.part === p); for (const w of (d && d.with) || []) want.add(String(w).toLowerCase()); }
  const out = [];
  for (const t of tests) {
    const always = !(Array.isArray(t.parts) && t.parts.length) || /^(owner-|never-|guard-|census)/.test(t.id) || t.parts.includes('all') || changedIds.has(t.id);
    if (always || t.parts.some(p => want.has(String(p).toLowerCase()))) out.push(t.id);
  }
  return out;
}

if (process.argv[1] && /scope\.mjs$/.test(process.argv[1])) {
  const [file, base] = process.argv.slice(2);
  try {
    const gj = JSON.parse(fs.readFileSync('tools/game-check/games.json', 'utf8')), game = (gj.games || gj).find(g => g.file === file);
    const slug = file.replace(/\.html$/, '');
    const fx = `tools/game-check/fixes/${slug}.mjs`;
    if (!game || !(game.parts || []).length || !fs.existsSync(fx) || !base) process.exit(0);
    const fdir = `tools/game-check/fixes/${slug}`;   // VP Oct 31 2026: per-job test files in the folder are read too (Racer has one, so scoping never ran and every PR played all 58 tests incl. 20 two-minute place tests)
    const names = spawnSync('git', ['diff', '--name-only', base, 'HEAD'], { encoding: 'utf8' }).stdout.split('\n');
    // the page itself must be the only game code that changed (other code, kit, shared folders = play all)
    const other = names.filter(n => n && !/^(jobs|reviews|plans|looks|ideas|team|notes|checklists)\/|\.md$/.test(n) && n !== file && !n.startsWith('tools/game-check/fixes/'));
    if (other.length) process.exit(0);
    const d = spawnSync('git', ['diff', '-U0', base, 'HEAD', '--', file], { encoding: 'utf8', maxBuffer: 64 << 20 }).stdout || '';
    const ranges = [...d.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)].map(h => [+h[1], +h[1] + Math.max(0, (h[2] === undefined ? 1 : +h[2]) - 1)]);
    const touched = ranges.length ? partOfLines(game.parts, fs.readFileSync(file, 'utf8'), ranges).map(t => t.part) : [];
    if (ranges.length && !touched.length) process.exit(0);
    const tests = [...((await import(pathToFileURL(path.resolve(fx)).href)).default || [])];
    if (fs.existsSync(fdir)) for (const f of fs.readdirSync(fdir).filter(x => x.endsWith('.mjs')).sort()) { const m = (await import(pathToFileURL(path.resolve(fdir, f)).href)).default; if (Array.isArray(m)) tests.push(...m); }
    const fd = spawnSync('git', ['diff', '-U0', base, 'HEAD', '--', fx, ...(fs.existsSync(fdir) ? [fdir] : [])], { encoding: 'utf8', maxBuffer: 64 << 20 }).stdout || '';
    const changedIds = new Set([...fd.matchAll(/^\+.*\bid:\s*'([^']+)'/gm)].map(m => m[1]));
    const ids = scopeIds({ game, tests, touchedParts: ranges.length ? touched : (changedIds.size ? ['__tests_only__'] : []), changedIds });
    if (ids) console.log(ids.join(','));
  } catch (e) { console.error('scope: ' + e.message + ' - playing everything'); }
}
