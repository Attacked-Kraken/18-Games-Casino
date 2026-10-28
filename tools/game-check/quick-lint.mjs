// QUICK LINT (master #6, owner Oct 28 2026 "build"): the robot's checks that need NO browser, in about 2 seconds - made for a Muse sandbox whose
// Chromium cannot open 127.0.0.1 or cannot install. Usage: node tools/game-check/quick-lint.mjs apex<game>.html ["PART: x title"] [base-ref]
// Checks: (1) every inline <script> parses, (2) the game's test files load, (3) fixes-lint yellow lines, (4) PART GUARD against the base (default origin/main)
// with the PR title, (5) which tests the scoped check would replay. Exit 1 on a RED line; yellow lines never fail. The browser play is still the PR robot's job.
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { pathToFileURL } from 'url';
import { spawnSync } from 'child_process';
import { partOfLines, partGuard } from './judge.mjs';
import { lintFixes } from './fixes-lint.mjs';

export async function quickLint(file, title = '', base = 'origin/main') {
  const red = [], yellow = [], info = [];
  if (!fs.existsSync(file)) return { red: [`no such game page: ${file}`], yellow, info };
  const src = fs.readFileSync(file, 'utf8');
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m, n = 0;
  while ((m = re.exec(src))) {
    if (/\bsrc\s*=/.test(m[1]) || /type\s*=\s*["']?(importmap|application\/json|text\/template)/i.test(m[1])) continue;
    n++;
    const line0 = src.slice(0, m.index).split('\n').length;
    try { if (/type\s*=\s*["']?module/i.test(m[1])) new vm.SourceTextModule(m[2]); else new vm.Script(m[2], { filename: file }); }
    catch (e) { if (!/SourceTextModule/.test(String(e))) red.push(`SYNTAX: ${file} script #${n} (starts line ${line0}): ${String(e.message).slice(0, 160)}`); }
  }
  info.push(`${n} inline script(s) parse`);
  const slug = file.replace(/\.html$/, ''), fx = `tools/game-check/fixes/${slug}.mjs`, dir = `tools/game-check/fixes/${slug}`;
  const files = [fx, ...(fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).map(f => `${dir}/${f}`) : [])].filter(f => fs.existsSync(f));
  let tests = [];
  for (const f of files) {
    try { const t = (await import(pathToFileURL(path.resolve(f)).href + '?q=' + Date.now())).default || []; tests = tests.concat(t); }
    catch (e) { red.push(`TEST FILE WILL NOT LOAD: ${f}: ${String(e.message).slice(0, 160)}`); continue; }
    try { for (const l of lintFixes(fs.readFileSync(f, 'utf8'))) yellow.push(typeof l === 'string' ? `${f}: ${l}` : `${f} line ${l.line}, test ${l.id}: an h.eval that navigates/waits/polls needs .catch(...) or try/catch`); } catch (e) {}
  }
  info.push(`${tests.length} play test(s) in ${files.length} file(s)`);
  try {
    const gj = JSON.parse(fs.readFileSync('tools/game-check/games.json', 'utf8')), game = (gj.games || gj).find(g => g.file === file);
    const d = spawnSync('git', ['diff', '-U0', base, '--', file], { encoding: 'utf8', maxBuffer: 64 << 20 });
    if (d.status !== 0) yellow.push(`could not diff against ${base} (${String(d.stderr).slice(0, 80)}) - PART GUARD not checked`);
    else if (game && (game.parts || []).length) {
      const ranges = [...d.stdout.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)].map(h => [+h[1], +h[1] + Math.max(0, (h[2] === undefined ? 1 : +h[2]) - 1)]);
      const touched = ranges.length ? partOfLines(game.parts, src, ranges) : [];
      info.push(ranges.length ? `changed parts: ${touched.map(t => t.part).join(', ') || 'none owned by a part'}` : 'game page unchanged vs ' + base);
      for (const r of partGuard(game, touched, title || process.env.PR_TITLE || '', '')) red.push(r);
      if (!title && !process.env.PR_TITLE && touched.length) yellow.push('no PR title given - say it as the 2nd argument ("... PART: rims") to run PART GUARD fully');
    }
  } catch (e) { yellow.push('part check skipped: ' + String(e.message).slice(0, 100)); }
  return { red, yellow, info };
}

if (process.argv[1] && /quick-lint\.mjs$/.test(process.argv[1])) {
  const [file, title, base] = process.argv.slice(2);
  if (!file) { console.log('usage: node tools/game-check/quick-lint.mjs apex<game>.html ["PR title with PART: x"] [base-ref]'); process.exit(2); }
  const t0 = Date.now(), r = await quickLint(file, title || '', base || 'origin/main');
  console.log(`${r.red.length ? 'RED' : 'CLEAN'} (no browser, ${((Date.now() - t0) / 1000).toFixed(1)} s) - ${file}`);
  for (const x of r.red) console.log('  RED: ' + x);
  for (const x of r.yellow) console.log('  check: ' + x);
  for (const x of r.info) console.log('  ok: ' + x);
  console.log('  The browser play is the PR robot\'s job: open the PR early, its one "Check status" comment is the full check.');
  process.exit(r.red.length ? 1 : 0);
}
