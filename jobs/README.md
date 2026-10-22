# G-jobs - the owner's job system (fresh start, Oct 19 2026)

**All old jobs are gone.** Forget every J-number, old order, reminder and CLAIMS row. The owner sends G-jobs
(G-01, G-02, ...) straight into your window. One G-job at a time, one change per job.

## When you get "NEW JOB G-NN"
0. **Work only in your MAIN chat. Never start a side chat** (owner, Oct 20: side chats get things confused - the laptop can't see or answer them, and work there got stuck for hours).
1. Read DONE.md and REALITY.md (the bar), then do ONLY what it says. Keep everything else in the game exactly as it is now.
2. Own branch (`g-nn-short-name`), PR, wait for the robot check, merge. The robot writes ONE comment on your PR, "🤖 Check status": RUNNING / PASSED / FAILED + the reason lines. Read that comment (one `get comments` call) - no check_runs digging. While it says RUNNING, wait.
3. Need a 3D model? Add `- SEARCH · <words> · for <game>` lines to MODEL-SEARCH.md and merge - the OWNER picks on
   Model Search. Never pick or guess a model yourself. Picked models arrive in models/fetched/.
4. Write your report `jobs/G-NN.md` (format below), merge it, then **STOP and wait**. The owner judges it.

## The report (the laptop reads it - keep these exact words)
```
# G-NN · <game file> · window <n>
STATUS: CHANGED            (or: NO CHANGE - and say why on a NOTE line)
VERSION: <the merged main commit id with your change>
OLD: <the main commit id from before your change>
NOTE: <one line, optional>
CHANGED:
- one plain line per thing you changed (what the owner will SEE)
MODELS:
- models/fetched/<file>.glb   (only when the owner must choose between models)
```

## Answers from the owner
- `G-NN APPROVED 👍` - done. Change nothing more for it.
- `G-NN 👌 ... small fix` - make only that fix, update VERSION in the same report file, STOP.
- `G-NN 👎 NOT right yet` - redo just that part, update the report (new VERSION, or STATUS: NO CHANGE), STOP.
- `G-NN OWNER PICKED this model: <path>` - use exactly that model, update the report, STOP.

A red robot line you are sure is the ROBOT's mistake (its ruler, its timing, a test that waits for luck): do not fight it - add one line to jobs/HELP.md: `HELP-VP: window N · G-NN · robot fault: <the exact red line> - <why it is wrong>`. The VP puts it in tools/game-check/known-faults.json and from the next check that line is yellow ("KNOWN ROBOT FAULT") and never blocks your job.
