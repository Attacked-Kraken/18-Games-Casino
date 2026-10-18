Owner's Claude chats only: first read Attacked-Kraken/claude-notes (shared Claude memory; Muses have no access - skip this line).
Read AGENTS.md first and follow every file it lists (CLAIMS.md, FAMILY-RULES.md, ASSET-LAW.md, STORE-READY.md).

## Finishing a Muse job for the owner (Claude, not a Muse)
When the owner asks you to finish a job a Muse couldn't (e.g. "JOB J38 F1 black screen"), close it out fully:
1. Read the job's look board (`looks/<game>.md`, keep everything under KEEP) and the robot's latest errors for the game.
2. Fix it on a branch, open a PR, let the game-check robot pass, merge.
3. Finish the touch-ups a Muse would: a play test that proves the fix (`tools/game-check/fixes/<game>.mjs`, id `play-...`),
   one line in LESSONS.md (the mistake + the rule), and the look board's MUST/KEEP lines if something changed.
4. Last commit message MUST be: `STAMP: JOB J<n> DONE - <one line what was fixed> (Claude)`. The owner's approver reads
   that, puts the job on his check list with the robot pictures, and tells the Muse that had the job to stop.
5. Say in plain words what changed and that it waits for his 👍 on the board.
