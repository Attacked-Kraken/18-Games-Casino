to: window 14
BEGIN AUDITOR-MSG W-001
from: VP
to: window 13
version: main 3f0c6d8d
Objective: Find why the Racer PR robot's "Play" step takes 33-34.5 minutes per part when check.mjs caps a game at 20 minutes, so parts 1 and 2 are cancelled at the 35-minute job limit (PR #1908, run 40429528399).
END AUDITOR-MSG W-001

Reply to W-001, window 13, Oct 27 2026. Fix PR: #1946, branch vp-w001-racer-whole-cap, commit 8e404130. Notes PR for this file is separate; the fix PR is the one to verify. No game code changed, robot-only: tools/game-check/check.mjs only. Main read: 3f0c6d8d.

CLAIM: The old 20-minute cap did not cap a Racer part, because it started at the play tests, not at the game start, and every part redid the same non-play work.
WHERE: tools/game-check/check.mjs old lines 459-462 (GAME_CAP_MS = 20 * 60 * 1000, tGame = Date.now() at the play-test loop, checked only between play tests); phases at lines 233, 326, 378, 421, 664; job limit in .github/workflows/game-check-pr.yml, play job timeout-minutes: 35.
EVIDENCE: PR #1908 run 40429528399, head 827afa2, VP TESTED: Play apexracer.html@1of3 34 min 30 s cancelled, @2of3 34 min 29 s cancelled, @3of3 33 min 1 s success. Update Oct 27 7:00 AM, VP TESTED: after Racer split into 6 robots (game PR #1937), PR #1906 had 2of6, 3of6, 4of6 cancelled at 35 min, 1/5/6 passed in 18-28 min. Daily results.json on branch game-checks (Oct 26, 2026, 9:54 AM, sha e49fcdc), apexracer.html full run, playMs 972394 ms = 16.2 min: load + menu + start 21.9 s, idle watch + first pictures 493.7 s, pictures + reality + checks 106.5 s, play tests + the rest 350.3 s. Sum of play-test ms 179.0 s, so post-play inside the last phase is 171.2 s. Slowest test play-garage-sweep 103456 ms, took over 60 s.
SOURCE: own check
VERDICT: TRUE
SEVERITY: BLOCKER

CLAIM: Pre-play plus the old play cap plus post-play already reaches the job limit, before any slow test overrun.
WHERE: tools/game-check/check.mjs, same cap lines above; extra pictures loop at old lines 347-360 (each picture loads the game fresh, games.json apexracer.html pictures: garage, garage-rims, garage-rimred).
EVIDENCE: 21.9 + 493.7 + 106.5 = 622.1 s = 10.4 min pre-play, plus 20 min play cap, plus 171.2 s = 2.9 min post-play = 33.3 min, plus one over-cap test (per-test cap old line 491: min(30000 * slowFactor, 90000) * budget, budget 2 on retry, so up to 180 s) = up to about 36 min. Cancellation at 35 min is expected, not a fluke.
SOURCE: own check
VERDICT: TRUE
SEVERITY: BLOCKER

CLAIM: Count-based splitting does not fix this, because every part redid pre-play and post-play, and the merged result already discards those phases from parts 2+.
WHERE: tools/game-check/check.mjs old TEST_PART filter at lines 454-456 (only the play-test list is filtered, no other phase is skipped); tools/game-check/merge-results.mjs:23 (img / reality / slow / fps / phases kept only from part 1).
EVIDENCE: PR #1906 6-part result above: 3 parts still cancelled, 3 passed in 18-28 min, despite each part playing only about 1/6 of the play tests (current tools/game-check/fixes/apexracer.mjs has 52 entries, about 9 per part at 6 parts, including one garage-sweep test in parts 1, 2, 3 and 6).
SOURCE: own check
VERDICT: TRUE
SEVERITY: WRONG

Fix in PR #1946, tools/game-check/check.mjs only:
- TEST_PART is parsed at the game start. Parts 2+ skip clip, extra pictures, virtual clock, reality + close-up + phone layout, and upright. Part 1 (and a whole, unsplit run) still does all of them, so the merged result loses nothing.
- PR parts only: whole-game cap 15 min from game start (tGame0), play tests stop at 13 min total elapsed (2 min reserve), post-play phases are skipped at 15 min with an explicit SKIPPED (whole-game cap, robot side, not a game result) yellow line. A test not run stays inconclusive for play tests and red for owner/never tests, as before. No failure is hidden, and no skipped phase is silently passed.
- Part 1 extra pictures are time-boxed: if the game is already 8 min in, remaining extra pictures are skipped with the same explicit SKIPPED line.
- Finer timing: phases are now load, idle, pictures + reality + checks, play tests, reality + close-up + mobile, upright + rest, and the run log prints TIMING <game> part=<part> total=<s> phases=<phase:s, ...>. Non-part runs are unchanged (old 20-min play cap, no whole-game cap).

Before / after, in minutes:
- Before: 1of3 34.5 cancelled, 2of3 34.5 cancelled, 3of3 33.0 success; 6-part 2/3/4 cancelled at 35, 1/5/6 passed 18-28; daily full Racer 16.2.
- After, computed from the numbers above, NOT yet measured on a Racer PR run: parts 2-6 about 3-4 min (pre-play about 150 s + play subset about 30 s, about 100 s on a sweep part), about 7-8 min even at 2x PR-runner slowness; part 1 at most about 18 min (play stopped at 13 min total, post-play skipped at 15 min, plus one over-cap test worst 3 min).
- Verification note for window 14: a robot-only PR like #1946 plays only the Paper Plane reference game in game-check-pr.yml robot-only mode, so this PR's own check cannot measure Racer. Please verify the after numbers on the next Racer PR and read its TIMING lines. If a Racer part still exceeds 20 min, the TIMING phases will show which phase, not just the total.
- Checks done by window 13: node --check on the file as pushed, and the file was read back on branch vp-w001-racer-whole-cap (W-001 / partOnlyPlay / TIMING present). No merge by window 13.

to: window 14, please verify PR #1946 on the next Racer PR.
