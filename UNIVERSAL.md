# UNIVERSAL.md - everything the Muses say will help them (builders 1-6, testers 7-10)

## How this list works
- It is YOUR list. Every rule here came from a window saying what would have saved it time.
- Got a tip, lesson or missing tool that would help every Muse? Write one line in your chat: `IDEA: <what would help>`. The Mac reads your chat (any wording works, `IDEA:` is just the surest), separates ideas from problems, and a Claude checks it and adds it here the same day.
- Stuck or worried about something? That is a problem, not an idea: write `HELP-MAC: <file>, <line>, <number you verified>, <decision needed>` (or a HELP-VP line). Problems get answered; ideas get filed.
- Read this list with LESSONS.md and your game's short list before every job. Once a rule is here it stays - nobody removes one unless the owner says.

One list for ALL windows. When any window teaches the factory something, it is added here the same day. Read it with the short list and LESSONS.md before a job.

1. **Ask what saved the hour.** If you lose time on something the robot already knew, file `HELP-VP: robot` naming exactly what was missing (window 6, PR #1614: the robot now saves the error stack, code lines, console and pictures).
2. **HELP-MAC line.** Anything broken, uncertain or left for someone else to decide: write `HELP-MAC: <file>, <line>, <number you verified>, <decision needed>` in your chat. The Mac reads it and a Claude answers you. Never "that's his call" with nothing filed.
3. **Say "unverified".** If you could not check a fact, write `unverified`. Never guess.
4. **Receipt.** Your FIRST reply to any order is one line: `<job number> received - doing: <what>`.
5. **Read before you claim absent.** Never say a test or function is missing from a file after a pattern search - read the region (quote style hid play-garage-options from a single-quote search).
6. **Census what YOU started.** A play test that starts a race/match counts the one IT started, never the first ready one left by the last test: wait for the object's identity to change.
7. **Restore shared state.** A test that changes shared page state restores it before it ends, also on early returns.
8. **Trace before fixing.** A margin that flickers is a distribution - measure the real cause before changing code; three wrong theories cost an hour.
9. **`h.eval` that navigates, reloads, waits or polls carries `.catch(() => false)` (or sits in try/catch).** "Execution context was destroyed" only fires on the robot, never on a Muse's local runner (window 5, Oct 25 2026). The robot now prints a yellow LINT line naming the test and line (`node tools/game-check/fixes-lint.mjs <file>`).
10. **Red lines now carry `[test id: ...]` and 400 chars of the error** (window 5 idea). Quote the id back in your HELP line - never "the robot failed".

## Ideas filed (status shown, so nobody files them twice)
- window 5, Oct 25 2026 2:06 PM: red lines name the test id + full error - BUILT (game PR #1753). Lint for `h.eval` without `.catch` - BUILT (#1753). Robot-style local runner that throws on navigation so a robot-only throw can be watched failing first - QUEUED (next robot job). Game PR template carrying the report fields so one merged PR closes a job - PARKED: the Mac's proof reads jobs/G-NN-wN.md; smaller first step = the Mac drafts the report file from the merged PR (to look at after the runner).
- window 4, Oct 25 2026 2:25 PM (six ideas): (1) each fix test gets a fresh page or a documented entry state (leftover state caused G-335's false red and G-249's driver pollution) - QUEUED robot job: `fresh: true` flag on a test, measure the time cost first. (2) a check that a contents PUT really changed the blob sha and a merge diff shows only the branch's files (silent 422s caused G-267 round 1's empty merge) - QUEUED as a ROBOT-side guard (a BUILD PR whose job claims changes but whose merge diff has none), not a Muse helper. (3) fix the robot's resized-context reading that intermittently comes back un-rotated instead of known-faulting it (hit G-309 menu lines and G-326 upright-fill) - NEXT robot job, must land before the Oct 28 known-fault expiry. (4) show each known fault in the game-check README section with its PR number and expiry - QUEUED (small: report.mjs reads known-faults.json). (5) CLAIMS.md append-only / one claim file per window (a rewrite by another bot dropped G-326's row) - PARKED: find what rewrote it first (merge-robot union merge), then decide. (6) tell the window when its PR verdict flips from RUNNING to PASSED/FAILED - QUEUED Mac-side: one plain line when its PR passes + merges (failures already go back in 2 minutes).

