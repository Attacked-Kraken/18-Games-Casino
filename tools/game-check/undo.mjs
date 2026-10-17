// AUTO-UNDO helper (owner, 2026-10-17): which games did the latest merge NEWLY break?
// node tools/game-check/undo.mjs prev-results.json game-check-out/results.json  -> prints JSON {games:[...], why:[...]}
// "Newly broken" = a FAIL the game didn't have before, or an owner's fix test that PASSED before and fails now.
// A brand-new fix test that fails (the owner's FIX LIST rule: test first) and brand-new games never count.
import fs from 'fs';
const [prevFile, nowFile] = process.argv.slice(2);
let prev = {}, now = {};
try { prev = JSON.parse(fs.readFileSync(prevFile, 'utf8')); } catch (e) {}
try { now = JSON.parse(fs.readFileSync(nowFile, 'utf8')); } catch (e) {}
const P = Object.fromEntries((prev.results || []).map(r => [r.file, r]));
const games = [], why = [];
for (const r of now.results || []) {
  const p = P[r.file];
  if (!p) continue;                                       // new game: nothing to compare with
  const before = new Set(p.fail || []);
  const okBefore = new Set((p.fixes || []).filter(x => x.ok).map(x => x.id));
  const bad = [];
  for (const f of r.fail || []) {
    if (before.has(f)) continue;
    if (/^Owner's fix NOT done yet/.test(f)) continue;    // judged by id below
    bad.push(f);
  }
  for (const x of r.fixes || []) if (!x.ok && okBefore.has(x.id)) bad.push(`Owner's fix broke again: "${x.ask}"`);
  if (bad.length) { games.push(r.file); why.push(`${r.name}: ${bad.slice(0, 3).join('; ')}`); }
}
console.log(JSON.stringify({ games, why }));
