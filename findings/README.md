# FINDINGS - how a tester reports a problem so Claude can fix it (owner Nov 3 2026, LOCKED)

No G-numbers and no jobs/ report files (owner Nov 3 2026 5:18 PM) - this folder is the paperwork.
One problem = one file: `findings/<game>/F-<L>-<NNN>.md` (L = R Racer, F F1, H Hockey, T Track & Field, B Baseball, A Flight;
NNN = the next free number in that folder, three digits). Copy `findings/TEMPLATE.md`. A picture goes next to it as
`findings/<game>/pics/F-<L>-<NNN>.jpg` (the robot's picture link is fine too). Never two problems in one file, never a file
without the HOW TO SEE IT steps - a finding that cannot be seen again is not a finding.

## Who writes which part
1. **Tester** (the window that plays the game) fills every line from FINDING down to `STATUS: NEW`. Pull request on branch
   `test/<game>-F-<L>-<NNN>`, title `FIND <game>: F-<L>-<NNN> - <one line>`. Notes + a failing play test only; the merge robot
   merges it by itself.
2. **Auditor** (the window that checks that game) adds the AUDIT block. It opens the game on main, follows HOW TO SEE IT, and
   writes what it really saw. TRUE / FALSE / DUPLICATE, then the KIND:
   - `SMALL` = words, menu/HUD layout or colour, a game number, a sound, a test. The auditor fixes it itself: branch
     `fix/<game>-F-<L>-<NNN>`, title `FIX F-<L>-<NNN> (PART: <part>): <one line>`, one part, one change, a play test that
     proves it. STATUS becomes `FIXED` with the PR number.
   - `CLAUDE` = anything 3D, a model, wheels, paint/wraps, a camera, physics, movement, a track, stadium, scenery, lighting,
     a shared kit/ file, or a change that touches more than one part. STATUS becomes `FOR-CLAUDE`. The Mac mini sees the
     word FOR-CLAUDE on main and puts it on Claude's list - nothing else to do.
   Audit pull request: branch `test/audit-<game>-<date>`, title `AUDIT <game>: F-<L>-<NNN>, F-<L>-<NNN>` (notes only).
   The auditor also updates `library/open/<game>.md` "What's left" in the same PR.
3. **Claude** fixes FOR-CLAUDE findings, writes `FIX: PR #N merged <time>` and STATUS `FIXED`.
4. **Tester** re-checks a FIXED finding on main in its next round: STATUS `DONE` (with the date) or back to `NEW` with
   `RE-OPENED: what is still wrong`.

## The lines (all of them, in this order)
```
FINDING: F-R-001
GAME: apexracer.html
BY: window 8 (tester)
MAIN: <the main commit you tested, 7 letters>
WHERE: menu | garage | race | HUD | result screen | <mode or ?test= link>
WHAT I SAW: one line, in plain words
EXPECTED: one line + where it says so (rules/<sport>.md, checklists/<game>.md item, the owner's words, REALITY.md)
HOW TO SEE IT:
1. open apexracer.html?test=rims
2. tap Garage > Rims > Deep Dish
3. look at the front left wheel
MEASURED: numbers with units (6.47 m long; 31 px button; 0 fps for 1.5 s) - 'looks wrong' alone is not a finding
PROOF: findings/apexracer/pics/F-R-001.jpg and/or play test id tester-chk-r13 (fails on main)
SEVERITY: BLOCKER (cannot play) | BAD (wrong, visible) | SMALL (polish)
PART: <one part from tools/game-check/games.json 'parts' for this game>
STATUS: NEW
```
Then the auditor adds:
```
AUDIT: TRUE | FALSE | DUPLICATE of F-R-00X
AUDITED BY: window 6, <date>, main <7 letters>
CHECKED: what you did and measured (numbers) - never 'looks fine'
KIND: SMALL | CLAUDE
STATUS: FOR-CLAUDE | FIXED PR #N | CLOSED-FALSE | DUPLICATE
```

## Rules
- Numbers come from the running game (the REALITY hook, Box3, the clock, the DOM), never from memory.
- A finding on a game that is CLOSED in `library/closed/` is not filed here - that game lives in the Apex Arcade now.
- One open pull request per window at a time. File the next finding after the first one merged (minutes, not hours).
- A play test that FAILS on main is the strongest proof; add it when the problem can be measured.
- The owner's own notes are findings too: Claude files them as `F-<L>-<NNN>` with `BY: owner` - they go first.
