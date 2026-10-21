// The robot's VERDICT on a pull request (owner Oct 21 2026 "split the good from repairs so it doesn't take 50 min"):
// the judging moved out of check.mjs so the games can be played SIDE BY SIDE (one robot per game, game-check-pr.yml) and
// one small step gives the verdict. Same rules as before: fair blame, FILE GUARD, tester vs builder, models.
//   as a tool:  node tools/game-check/judge.mjs <results.json> <base-results.json> <changed.txt> [out-dir]
//   as a module: import { judge } from './judge.mjs'  ->  judge({results, models, base0, changed, branch, title})
import fs from 'fs';
import path from 'path';

export function judge({ results = [], models = [], base0 = {}, changed = [], branch = '', title = '' }) {
  const norm = (x) => x.replace(/\d+/g, '#');
  const old = new Map((base0.results || []).map(r => [r.file, new Set((r.fail || []).map(norm))]));
  const blockers = [];
  // FAIR BLAME (Oct 18): a PR is only blocked for what it touched. Games re-checked just because a shared folder changed
  // (models/, characters/, tools/game-check/) block only on hard breakage, not on their old/flaky owner tests; a model
  // blocks only if the PR changed that model's own files. (Baseball #515 and Pebble #517 were blocked for Soccer marking
  // and a Monster Truck model crash they never touched.)
  const direct = new Set(changed.filter(f => /^apex[a-z0-9]*\.html$/.test(f))
    .concat(changed.filter(f => /^tools\/game-check\/fixes\/apex[a-z0-9]*\.mjs$/.test(f)).map(f => path.basename(f, '.mjs') + '.html')));
  const hard = /script error|black or blank|did not load|missing file|shader|not real 3d bodies|outside internet|casino wording|real brand/i;
  // TESTER PRs (owner Oct 20 10:10 PM, Claude 03's catch): a tester (windows 7-10) only adds play tests that FAIL today +
  // QUEUE lines - the red test IS the finding, the builder fixes the game next. A PR that changes ONLY test files, QUEUE.md,
  // job reports or reviews is never blocked by its own failing tests. Any game/kit/model change = normal rules.
  // FILE GUARD (owner Oct 21 2026 2:06 PM "make the file guard universal ... inside the game check robot itself, so it
  // runs on every pull request for every game, now and future"): a Muse's PR may change ONE game (its page, its play
  // tests, its looks/ folder) plus notes (job reports, QUEUE, reviews, CLAIMS, LESSONS, model lists). Shared parts
  // (kit/ venues/ models/ characters/ sounds/) change in their OWN PR with no game page in it (STUDIO-STANDARD 9.4).
  // Anything else (another game, the hub, robots, workflows) = FAIL. The owner's Claude branches (vp-, claude-, 03-..)
  // are exempt - they own the robots and the hub.
  // TESTER vs BUILDER pull requests (owner Oct 21 2026 2:25 PM "separate testers from builders everywhere"):
  //   tester  = title "TEST G-NN:" or branch test/  - may change only tests + notes; PASSES when its NEW tests FAIL on
  //             today's game (proof the problem is real); merges by itself at once; never on the owner's board.
  //   builder = title "BUILD G-NN:" or branch build/ - only the files its job lists; must be fully green.
  const prTitle = title || '';
  const prBranch = branch || '';
  const testerPR = /^test\//i.test(prBranch) || /^\s*TEST\s+G-\d+/i.test(prTitle);
  {
    const branch = prBranch;
    const claudeBranch = /^(vp|claude|c?0[3-9])[-\/]/i.test(branch);
    const NOTES = /^(jobs\/[^/]+\.md|needs\/[^/]+\.md|reviews\/.+|plans\/.+|looks\/.+|ideas\/.+|CLAIMS\.md|LESSONS\.md|NEWS\.md|MODEL-SEARCH\.md|MODEL-REQUESTS\.md|ASSETS\.md|MODELS\.md|SCORES\.md|PLAYBOOK\.md|TOOLS\.md|README\.md)$/;
    const isGame = f => /^apex[a-z0-9]*\.html$/.test(f);
    const isFix = f => /^tools\/game-check\/fixes\/apex[a-z0-9]*\.mjs$/.test(f);
    const isShared = f => /^(kit|venues|models|characters|sounds)\//.test(f);
    const games = [...new Set(changed.filter(isGame))];
    const fixes = changed.filter(isFix);
    const sharedF = changed.filter(isShared);
    const other = changed.filter(f => !NOTES.test(f) && !isGame(f) && !isFix(f) && !isShared(f));
    const guard = [];
    if (games.length > 1) guard.push(`FILE GUARD: this PR changes ${games.length} games (${games.join(', ')}) - ONE game per PR`);
    const fixGames = [...new Set(fixes.map(f => path.basename(f, '.mjs') + '.html'))];
    if (games.length === 1 && fixGames.some(g => g !== games[0])) guard.push(`FILE GUARD: play tests of another game changed (${fixGames.filter(g => g !== games[0]).join(', ')}) - only your game's tests`);
    if (games.length === 0 && fixGames.length > 1) guard.push(`FILE GUARD: play tests of ${fixGames.length} games changed - one game per PR`);
    if (games.length && sharedF.length) guard.push(`FILE GUARD: shared parts (${sharedF.slice(0, 3).join(', ')}) changed together with a game page - shared folders change in their OWN pull request (STUDIO-STANDARD 9.4)`);
    if (other.length && !claudeBranch) guard.push(`FILE GUARD: not yours to change: ${other.slice(0, 5).join(', ')} - a job may change only its game, its play tests, its looks/ folder, notes, or (alone) a shared folder`);
    if (testerPR && (games.length || sharedF.length)) guard.push(`FILE GUARD: a TEST pull request changed game code (${games.concat(sharedF).slice(0, 3).join(', ')}) - testers change only tests, notes, jobs/QUEUE.md, jobs/G-NN.md, reviews/ and CLAIMS.md`);
    if (guard.length && !claudeBranch) { blockers.push(...guard); }
    else if (guard.length) console.log('File guard (Claude branch, not blocking):\n- ' + guard.join('\n- '));
    else if (changed.length) console.log('File guard: OK (' + (games[0] || (sharedF.length ? 'shared parts' : 'notes/tests')) + ')');
  }
  const testOnly = changed.length && changed.every(f => /^tools\/game-check\/fixes\/[a-z0-9-]+\.mjs$|^jobs\/(QUEUE|G-\d+)\.md$|^needs\/window-\d+\.md$|^reviews\/|^CLAIMS\.md$|^LESSONS\.md$/.test(f)) || (testerPR && !blockers.length);
  if (testOnly) console.log('Tester PR (only tests / QUEUE / reports / CLAIMS changed): its failing play tests are findings for the builder, not blockers.');
  if (testOnly || testerPR) {
    // owner Oct 21 2:25 PM: a tester's NEW test must FAIL on today's game - a new test that passes proves nothing
    const baseIds = new Map((base0.results || []).map(r => [r.file, new Set((r.fixes || []).map(f => f.id))]));
    const touchedFix = new Set(changed.filter(f => /^tools\/game-check\/fixes\/apex[a-z0-9]*\.mjs$/.test(f)).map(f => path.basename(f, '.mjs') + '.html'));
    for (const r of results) {
      if (!touchedFix.has(r.file)) continue;
      const fresh = (r.fixes || []).filter(f => /^tester-/.test(f.id) && !(baseIds.get(r.file) || new Set()).has(f.id));
      const passing = fresh.filter(f => f.ok);
      if (fresh.length && passing.length === fresh.length)
        blockers.push(`TESTER: your new test${passing.length > 1 ? 's' : ''} ${passing.map(f => f.id).join(', ')} PASS on today's ${r.name} - that proves nothing. Make each one FAIL on the real problem, or drop it.`);
      else if (fresh.length) console.log(`Tester proof OK: ${fresh.length - passing.length} new test(s) fail on today's ${r.name}.`);
    }
  }
  for (const r of results) for (const f of r.fail) {
    if (/owner'?s eyes/i.test(f)) continue;
    if (testOnly && /NOT done yet/i.test(f)) continue;
    if (old.get(r.file) && old.get(r.file).has(norm(f))) continue;
    if (changed.length && !direct.has(r.file) && !hard.test(f)) continue;
    blockers.push(`${r.file}: ${f}`);
  }
  const oldM = new Set((base0.models || []).flatMap(m => (m.problems || []).map(x => m.name + '|' + norm(String(x)))));
  for (const m of models) {
    const mine = !changed.length || changed.some(f => f !== 'MODELS.md' && JSON.stringify(m).includes(f.replace(/\.(mjs|js|glb|webp|png|jpg)$/, '')));
    if (!mine) continue;
    for (const x of (m.problems || [])) if (!oldM.has(m.name + '|' + norm(String(x)))) blockers.push(`MODELS.md ${m.name}: ${x}`);
  }
  return blockers;

}

if (process.argv[1] && /judge\.mjs$/.test(process.argv[1])) {
  const [resFile, baseFile, changedFile, outDir] = process.argv.slice(2);
  let data = {}; try { data = JSON.parse(fs.readFileSync(resFile || 'game-check-out/results.json', 'utf8')); } catch (e) {}
  let base0 = {}; try { base0 = JSON.parse(fs.readFileSync(baseFile || 'base-results.json', 'utf8')); } catch (e) {}
  let changed = []; try { changed = fs.readFileSync(changedFile || 'changed.txt', 'utf8').split('\n').map(x => x.trim()).filter(Boolean); } catch (e) {}
  const blockers = judge({ results: data.results || [], models: data.models || [], base0, changed,
                           branch: process.env.PR_BRANCH || '', title: process.env.PR_TITLE || '' });
  for (const m of (data.missing || [])) blockers.push(`${m}: the robot could not play it (its run failed or timed out) - look at the run`);
  fs.mkdirSync(outDir || 'game-check-out', { recursive: true });
  fs.writeFileSync(path.join(outDir || 'game-check-out', 'blockers.txt'), blockers.join('\n'));
  if (blockers.length) { console.log('\nBLOCKED - this pull request adds problems main does not have:\n- ' + blockers.join('\n- ')); process.exit(1); }
  console.log('\nNo new problems - OK to merge.');
}
