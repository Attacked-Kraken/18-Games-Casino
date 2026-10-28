// RESUME A CAPPED CHECK (master #123, window 6, owner Oct 27 2026 10:39 PM "build what window 6 needs").
// A play part that stopped at the time cap lists its remaining tests as "not run". The workflow then plays ONLY those tests again
// (ONLY_TESTS, a fresh game, into game-check-resume/) and this puts the new answers into the first results - tests already finished are
// never replayed. Fails safe: no resume file, or a test that is still "not run" = the first answer stays (and stays red/inconclusive).
//   node tools/game-check/resume-merge.mjs game-check-out/results.json game-check-resume/results.json
// With no resume file it prints the ids still to play:  node tools/game-check/resume-merge.mjs game-check-out/results.json --ids
import fs from 'fs';
const [first, second] = process.argv.slice(2);
const isNotRun = f => f && /^not run/i.test(String(f.note || ''));
let a; try { a = JSON.parse(fs.readFileSync(first, 'utf8')); } catch (e) { process.exit(0); }
if (second === '--ids') {
  const ids = [].concat(...(a.results || []).map(r => (r.fixes || []).filter(isNotRun).map(f => f.id)));
  console.log(ids.join(',')); process.exit(0);
}
let b; try { b = JSON.parse(fs.readFileSync(second, 'utf8')); } catch (e) { console.log('resume: no second result - first answer kept'); process.exit(0); }
let done = 0, left = 0;
for (const r of a.results || []) {
  const o = (b.results || []).find(x => x.file === r.file); if (!o) continue;
  const newer = new Map((o.fixes || []).filter(f => f && !isNotRun(f)).map(f => [f.id, f]));
  const resolved = [];
  r.fixes = (r.fixes || []).map(f => { if (isNotRun(f) && newer.has(f.id)) { done++; resolved.push(f); return { ...newer.get(f.id), resumed: true }; } if (isNotRun(f)) left++; return f; });
  // the "NOT RUN (robot time cap...)" red lines name the test's ask text - drop the ones that now have a real answer
  r.fail = (r.fail || []).filter(l => !/^NOT RUN \(robot time cap/.test(l) || !resolved.some(f => f.ask && l.includes('"' + f.ask + '"')));
  const still = r.fixes.filter(isNotRun).map(f => f.id);
  r.check = (r.check || []).filter(l => !/^(WHOLE-GAME CAP|ROBOT TIME CAP):/.test(l) || still.length > 0);
  if (resolved.length) (r.check = r.check || []).push(`RESUMED: ${resolved.length} test(s) that hit the time cap were played again by themselves${still.length ? ` (${still.length} still not run)` : ''}`);
  // a failing resumed test's own red lines come along
  for (const k of ['fail']) for (const l of o[k] || []) if (resolved.some(f => !f.ok && f.ask && String(l).includes(f.ask)) && !(r[k] || []).includes(l)) r[k].push(l);
}
fs.writeFileSync(first, JSON.stringify(a, null, 1));
console.log(`resume: ${done} test(s) answered on the second pass, ${left} still not run`);
