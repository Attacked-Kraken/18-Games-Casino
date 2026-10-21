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
