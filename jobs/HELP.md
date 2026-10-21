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
HELP-OWNER: window main · G-100 · the reality ground-contact rule still fails a real sprint - the base-human rig has no toe bones, so the foot bone is the foot's lowest point and it reads 0.08 m up at a forefoot touchdown (best ever measured 0.04 m), never within the 3 cm bar; PR #911 is blocked on this line only, everything else green - the rule needs a running calibration (touchdown cadence in game time, not wall-clock speed classes)
HELP-VP: window main · G-100 · the game checker counts an aborted download as 'Missing file' (the hair GLBs get flagged at random on busy runs) and each false block costs a full re-check cycle - please stop counting requestfailed/aborted loads as missing, or retry the file once before flagging it
HELP-VP: window main · G-100 · a fixes file that does not parse runs 0 tests and only shows a small check line (baseball's was broken from PR #901 until G-100 repaired it) - please make a fixes-file parse error a hard FAIL so it surfaces the day it lands
HELP-VP: window main · G-100 · my local sandbox renders at about 2-3 fps against the robot's 13-17, so quick-check cannot finish a full suite locally and the reality fast/walking classes do not transfer between the two; a readable check status (running / passed / failed) instead of polling PR comments would also cut the waiting on every job
