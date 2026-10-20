# G-jobs - the owner's job system (fresh start, Oct 19 2026)

**All old jobs are gone.** Forget every J-number, old order, reminder and CLAIMS row. The owner sends G-jobs
(G-01, G-02, ...) straight into your window. One G-job at a time, one change per job.

## When you get "NEW JOB G-NN"
0. **Work only in your MAIN chat. Never start a side chat** (owner, Oct 20: side chats get things confused - the laptop can't see or answer them, and work there got stuck for hours).
1. Do ONLY what it says. Keep everything else in the game exactly as it is now.
2. Own branch (`g-nn-short-name`), PR, wait for the robot check, merge.
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
