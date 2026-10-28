// AUTO-UNDO helper (owner, 2026-10-17): which games did the latest merge NEWLY break?
// node tools/game-check/undo.mjs prev-results.json game-check-out/results.json  -> prints JSON {games:[...], why:[...]}
// "Newly broken" = a FAIL the game didn't have before, or an owner's fix test that PASSED before and fails now.
// A brand-new fix test that fails (the owner's FIX LIST rule: test first) and brand-new games never count.
import fs from 'fs';
const [prevFile, nowFile, firstFile] = process.argv.slice(2);
// VP Oct 27 2026: with a 3rd file (the play robots' FIRST result), a game counts only when BOTH the first result and the
// re-check found it newly broken - the re-check runs in the check job (no test container, 9-min timeout) and alone it
// blamed games the play robots had passed (#2009: Baseball owner tests 'broke' only in the re-check).
let firstBroken = null;
if (firstFile) { try { firstBroken = new Set(JSON.parse(fs.readFileSync(firstFile, 'utf8')).games || []); } catch (e) { firstBroken = null; } }
let prev = {}, now = {};
try { prev = JSON.parse(fs.readFileSync(prevFile, 'utf8')); } catch (e) {}
try { now = JSON.parse(fs.readFileSync(nowFile, 'utf8')); } catch (e) {}
const P = Object.fromEntries((prev.results || []).map(r => [r.file, r]));
const games = [], why = [], tests = [], skipped = [];
const ROBOT_CRASH = /could not finish checking|has been closed|Target page, context or browser|browser\.newContext|Navigation timeout of|net::ERR_|runner lost/i;
let other = 0;   // VP Oct 27 2026: new problems that are NOT play tests (load, script error, reality...) - those need the whole game re-played
for (const r of now.results || []) {
  const p = P[r.file];
  if (!p) continue;                                       // new game: nothing to compare with
  if (firstBroken && !firstBroken.has(r.file)) { skipped.push(r.file); continue; }
  // VP Oct 27 2026 (#1984 / #2009 undid merges that only touched one game's tests): when the ROBOT's own browser died
  // ("could not finish checking", "browser has been closed") the game was never fully checked - its fails and its owner-test
  // results are not evidence, so the game is NOT counted as broken. The next full check judges it again.
  const crashed = (r.fail || []).some(f => ROBOT_CRASH.test(f));
  if (crashed) { skipped.push(r.file); continue; }
  const before = new Set(p.fail || []);
  const okBefore = new Set((p.fixes || []).filter(x => x.ok).map(x => x.id));
  const bad = [];
  for (const f of r.fail || []) {
    if (before.has(f)) continue;
    if (/^Owner's fix NOT done yet/.test(f)) continue;    // judged by id below
    bad.push(f); other++;
  }
  for (const x of r.fixes || []) if (!x.ok && okBefore.has(x.id)) { bad.push(`Owner's fix broke again: "${x.ask}"`); tests.push(x.id); }
  if (bad.length) { games.push(r.file); why.push(`${r.name}: ${bad.slice(0, 3).join('; ')}`); }
}
console.log(JSON.stringify({ games, why, tests, other, skipped }));
