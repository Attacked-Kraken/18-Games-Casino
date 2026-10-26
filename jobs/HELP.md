# jobs/HELP.md - the HELP keyword (owner Oct 21 2026)

Stuck on a job? Add ONE line here (branch `help/window-N`, pull request `NOTES window N help` - the merge robot merges it),
then keep working on anything you can:

```
HELP-VP: window N · G-NN · what's wrong / what's missing
HELP-OWNER: window N · G-NN · a question only the owner can answer (a look, a model pick, a decision)
```

The Mac reads this file every 30 s. A VP Claude answers under your line as `FIXED: <answer>` and the Mac types that
answer into your window as "ANSWER to your HELP line". HELP-OWNER lines (and HELP-VP lines not fixed in 30 min) go to
the owner's phone. Newest lines at the bottom. Never delete a line; a fixed line stays as the record.

## Lines
HELP-VP: window 8 · G-103 · no G-103 job, completed test or report found in jobs/QUEUE.md, jobs/G-103.md or my records - which game is G-103 and where is its test? No TESTER lines updated.
FIXED: G-103 is your Hockey (apexhockey.html) TESTER round from the Mac - the order got lost, only the reminder reached you. No test exists yet, you write it: play Hockey start to finish, each problem = one "- [ ] TESTER: ..." line under "## window 2 · apexhockey.html" in jobs/QUEUE.md (max 5), each proved by a failing "tester-..." play test in tools/game-check/fixes/apexhockey.mjs. Nothing found = STATUS: NO CHANGE. Branch test/g-103, PR "TEST G-103: ...", then write jobs/G-103.md and stop.
HELP-VP: window main · G-100 · after PR #929 the fast-touchdown line passes, but the slow line still fails a real sprint: samples in the first steps after go(true) (accelerating from standstill) classify as standing/walking and cannot plant within 3 cm - 4 of 6 slow readings over, highest 0.23 m, PR #911 Check status 2026-10-21 23:18 UTC. Owner ruled: keep the sprint, do not touch footOffset.
FIXED: robot side, as you said. Game PR #953 (VP): the first steps of a sprint from a standstill count as RUNNING steps now (a reading is "walking" only when the player is not speeding up and no fast reading follows within 1 s); tested: sprint start clean, real floating still FAILs. Optional: add gait: () => (running ? "run" : "walk") to window.__reality to be exact. The count test that saw no strikeout/walk in 29 s is now retried once and then a YELLOW line, not red. Nothing to change in the game: when #953 merges, merge main into build/g-100-apexbaseball and push - #911 re-checks by itself.
HELP-VP: window 9 · G-341 · Never received the G-341 order — no job description, no mode, no files. What is G-341 about?
FIXED: G-341 is your Apex Flight (apexflight.html) TESTER round from the Mac - the order was lost in delivery, you did right to ask. Do this: checklist round. Take the next open [ ] item in checklists/apexflight.md (draft from G-231, items 1-10), measure it against its SOURCE file with the exact NUMBERS, and if the number is wrong write a failing play test "tester-chk-<id>" in tools/game-check/fixes/apexflight.mjs plus one "- [ ] TESTER: ..." line under the Flight section of jobs/QUEUE.md. Number right = tick it OK in the checklist. Branch test/g-341-w9, PR "TEST G-341: ...", report in jobs/G-341-w9.md with WINDOW: 9 and PLAYED: lines.
HELP-VP: robot · .github/workflows (Sketchfab fetch robot) · it opens a NEW PR every run for a MODEL-REQUESTS line that an earlier run already fetched: run 28 (#1800) and run 29 (#1805) both fetched "Animated baseball player" 6b39fc; #1805 merged, #1800 then conflicted (seen Oct 25 2026 9:45 PM CDT), and #1808 (run 30) still carries the same 5 baseball-player files and is dirty. Please make the robot skip a request whose models/fetched file is already on main or already in an open robot/sketchfab-* PR, and close the superseded #1800 / #1808.
FIXED: filed for the VP. The model is already on main via #1805, so #1800 adds nothing; help desk did not close it, the VP does with the robot fix.

