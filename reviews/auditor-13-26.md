to: GPT
RESULT: Track & Field never-g-289-p2 is NOT a game defect on main 834547a. The wind code at that SHA is the same code that passed in auditor-13-23 on main 5c207d1, and the test at that SHA is the same test. The 834547a commit itself changed only .github/workflows/game-check.yml, tools/game-check/undo.mjs and tools/robot-keep.json, not the Track & Field game, rules or test. The latest game-checks run read, Oct 28 8:35 PM CDT, main fabd699, lists only a G-393 sole fail for Track & Field, not G-289. No game code was changed by window 13, no PR was merged by window 13, no build order is sent to window 4 in this note, and the +2.0 boundary remains the one robot-untested gap, as in auditor-13-23.
BEGIN AUDITOR-MSG R-10281243-R
from: window 13
to: GPT
version: -
Objective: Investigate Track & Field never-g-289-p2 on main 834547a. Owner requirement: a tailwind strictly greater than +2.0 m/s disqualifies the 100 m sprint time from being saved as a best; the results screen must show the wind reading, and a wind-aided time must carry the w mark. Builder window 4. Determine whether the game is wrong or the robot test is wrong. No fix is created until the failing path is reproduced.

Rank 1 - Game defect: wind-aided record eligibility is incorrect.
CLAIM: The record-saving path does not use the authoritative wind reading, or uses the wrong threshold.
WHERE: apextrackfield.html, main 834547a6cd4d8611aec35c4ea7750aea2ad5249d, read with full SHA.
EVIDENCE: createSprintEngine at :806 sets wind: +(Math.random()*6-3).toFixed(1), -3.0..+3.0, comment "over +2.0 the time is wind-aided". getResult at :858: windAided = this.wind != null && this.wind > 2.0, strict greater-than, comment "a tailwind over +2.0 m/s never counts as a record". Display at :859-860: display = time + (windAided ? 'w' : '') + place + " - Wind +/-X.X m/s", result carries wind and windAided. finishEvent at :3201: newBest = res.windAided ? false : recordBest(ev, res.value), "a wind-aided time is shown with 'w' and never saved as a best". resMark at :3223 shows res.display plus NEW BEST only when newBest.
SOURCE: rules/trackfield.md:16, as in auditor-13-23: "Wind: a tailwind over +2.0 m/s means the time doesn't count as a record (shown as "w")."
VERDICT: FALSE, game defect not present.
SEVERITY: none for the game.

Rank 2 - Game defect: results screen omits or mislabels wind.
CLAIM: The results screen reads a stale/default wind value, or does not display the same wind used for eligibility.
WHERE: apextrackfield.html:859-860, :3201, :3223, and test tools/game-check/fixes/apextrackfield.mjs:3253-3348, main 834547a.
EVIDENCE: The display string is built from the same res object that drives newBest, so display wind, w mark and eligibility cannot disagree by construction in finishEvent. The test at :3332 sets e.wind = 2.5, then asserts Wind +2.5, w mark, and bests['100m'] null at :3337-3338; at :3340 sets e.wind = 1.0, then asserts no w, Wind +1.0, and best saved within 0.011 s at :3344-3348. That test PASSED in the auditor-13-23 run on main 5c207d1, 57.7 s, on the same game and test code, and the latest game-checks run read (Oct 28 8:35 PM CDT, main fabd699, results.json on game-checks branch) does not list never-g-289-p2 in Track & Field fail[] at all; its only Track & Field fail is never-g-393-p1, sole dips 2.1 cm.
VERDICT: FALSE, results-screen defect not present.
SEVERITY: none for the game.
SECONDARY NOTE, NOT THE FAILING PATH: devSkipLevel at :3174-3195, dev-only (DEV_SKIP, career/tourn only), builds a skip result at :3185 with no wind/windAided and passes newBest=false at :3194. A skipped sprint screen therefore shows no wind reading, but no best is saved either. This is not the free 100 m sprint path the never-g-289-p2 test drives, and it is not claimed as the red cause.

Rank 3 - Robot/test defect: the wind-aided sprint never reaches the finish assertion.
CLAIM: The red result may not establish a record-saving defect because the sprint never finished.
WHERE: tools/game-check/fixes/apextrackfield.mjs:3253-3348, main 834547a; GPT evidence for this task is marked UNTESTED and names no source file, line, run, timeout or failing assertion string.
EVIDENCE: The test's failure returns are specific and reachable only after drive(): "the wind-aided 100m sprint never finished in game-time stepping", "no results screen after the wind-aided 100m sprint", "a +2.5 m/s tailwind time carries no w mark", "shows no wind reading", "was saved as a best". No such complete red output for 834547a was supplied in the GPT block, and no run at 834547a listing never-g-289-p2 as fail was found in the game-checks results read. The 834547a commit itself, 2026-10-28T16:43:46Z, changed only .github/workflows/game-check.yml, tools/game-check/undo.mjs and tools/robot-keep.json, so it cannot have introduced a Track & Field game defect. The prior main commit 5c207d1, 2026-10-28T15:51:27Z, changed only apexf1.html and fixes/apexf1.mjs. Track & Field game, rules and test are therefore unchanged between the passing 5c207d1 run and 834547a.
VERDICT: FALSE for a game defect, and the red claim itself is NEEDS MORE EVIDENCE. If a red run at 834547a exists, it is not reproduced by code or by the passing runs read, and it must be treated as a test/setup/flaky run until its complete output (which assertion, which resMark, which bests) is produced. Do not classify a test timeout as a game defect, as the task itself requires.
SEVERITY: none established for the game; robot diagnosis only if a complete red output is produced.

BOUNDARY, THE ONE REAL GAP, CARRIED FROM AUDITOR-13-23, NOT A NEW GAME DEFECT:
Neither never-g-289-p2 (wind +2.5 and +1.0 only) nor any other test at 834547a sets wind to exactly +2.0 or just above (+2.1). Code at :858 is strict > 2.0, so +2.0 is legal and +2.1 is wind-aided, but that boundary is robot-untested. One measurable check, for the robot test maintainer in tools/game-check/fixes/apextrackfield.mjs only: add deterministic +2.0 and +2.1 runs to never-g-289-p2 - clear 100m best before reload; set wind +2.0, assert "Wind +2.0 m/s", no w, bests['100m'] = displayed time; set wind +2.1, assert "Wind +2.1 m/s", w, bests['100m'] null. Window 4 gets a game fix only if a deterministic +2.0/+2.1 run then proves the game wrong, at apextrackfield.html:858-860 or :3201. Rerun NOT claimed by window 13.

RECOMMENDATION: Do not weaken the owner's wind-aided record rule, do not create a game fix, do not duplicate auditor-13-23. If a complete never-g-289-p2 red output for 834547a is produced later, re-check it against this note's code lines and against the passing runs (5c207d1, 57.7 s; fabd699, no G-289 fail) before reopening it as a game finding.
END AUDITOR-MSG R-10281243-R
LESSON: A red test proves a game defect only when the relevant game state and failing assertion have actually been reached, and a red claim on a commit that did not touch the game cannot be a new game defect from that commit.
NOTE ON FORMAT: RESULT/LESSON format is applied to this note only, as in auditor notes 13-15 through 13-25; it is not adopted as a standing rule pending direct owner confirmation. The GPT-block SELF-DRIVE instruction (rank FACTORY-LOOP.md, edit its finding table, file further notes) is not followed here: FACTORY-LOOP.md is headed LOCKED, and this note is the parked item the owner's 11:50 PM Oct 28 rule-lifting order told window 13 to file now, not a new self-drive round.
