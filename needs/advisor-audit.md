# Advisor audit — the whole factory, from outside (Window 11, Wed Oct 21 2026, evening Chicago time)

Read-only audit of Attacked-Kraken/18-Games-Casino: pull requests, branches, robot tests, job waits, tester reporting. Numbers are from the repo's own records at audit time. Where a number could not be got, this says so instead of guessing.

## Open pull requests and their ages

Only 8 open at the final check — the factory is fast. Of the newest 600 PRs, 562 merged, 32 closed unmerged, and a merged PR's typical life is 2.5 minutes (three quarters close within 10 minutes).

- #911 BUILD G-100 (Baseball REALITY go()) — open 4+ hours, the oldest by far. The robot fixes it was waiting on (#929, #953) already merged, but nobody pulled them into its branch and re-ran it. A same-evening recheck (#987) still reports the go() missing on main.
- #957 the VP's locked side-by-side game check, and #943 a window's needs notes — both hours old, neither blocking a game.
- The rest (#971, #983, #984, #985, #987) are fresh test/report PRs under 90 minutes old.

Fix: any BUILD or TEST PR open over 1 hour is named, with what it waits on, until it moves. One stuck PR held a whole game feature hostage while everything around it merged in minutes.

## The branch pile

At least 480 branches — proven, not estimated: branch pages of 30 were still full at page 16, and the alphabet had only reached "h". The first 50 branches alone (a–b) held 10 leftover auto-undo branches and seven baseball retest branches. The newest 600 PRs used 590 different branches — a new branch for nearly every PR, almost none reused.

An exact total could not be finished: the branch list takes minutes per page through the connector and timed out repeatedly. That is reported as a lower bound, not a guess.

Fix: a branch is deleted when its PR merges or closes. The owner is already clearing the pile; the rule is what stops it growing back.

## The robot's flaky tests

Named, with where each was seen:

- Ground contact / feet float (Baseball, blocked G-97 four times and G-100): the shared base-human rig has no toe bones, so the lowest foot point reads about 8 cm up and could never pass a 3 cm rule. Robot fixes #909, #929, #953 followed.
- Sprint called walking (G-100): the robot's stretched wall clock misread game time; fixed in #953, undecided tests now read yellow, not failed.
- The batter count test (G-100): waits for a random strikeout or walk inside 29 s; luck, not code. Now retried, then yellow.
- Phantom missing files (G-82, same as G-65): an aborted download counted as a missing file — hair files that existed were failed as absent.
- play-icing-called (G-88, G-102, G-103, G-108): passes and fails on the same code; testers write "timing-sensitive, not filed."
- play-goal-restarts-centre and play-faceoff-at-centre (G-88, G-103, G-108): fail locally across rounds while controlled checks pass — sequencing artifacts with no owner.
- play-defender-takes-puck (G-102, G-108): "varies by run," fails intermittently even against the unedited game.

Around them: local suites hit 30-second caps (career and friend-code tests), one mirror renders the game about 25x slow, and G-97 lost time to tests written with the wrong harness's calls. Fix: each flaky test gets one owner on the robot side, and until fixed it is marked known-flaky so it cannot block a builder job.

## How long jobs wait

Not in merging — merging takes minutes. The wait is getting to green, and stale orders:

- Hockey's career PLAY button took five jobs: filed in G-88, re-verified in G-103, fixed in G-104 (PR #933), reported still broken in G-108 off a stale snapshot, and G-109's order arrived about an hour after the fix had already shipped. G-109 confirmed the fix on main and the live build — and the QUEUE line for career PLAY was still open in jobs/QUEUE.md afterwards.
- G-100 sat behind three separate robot fixes (#909, #929, #953) before its own work could be judged.
- The 32 closed-unmerged PRs in the newest 600 typically lived 2.3 hours before being abandoned; the worst lived 3.5 days.

The Mac's own dispatch-to-start times are not in the repo, so true order-to-start waits cannot be audited from GitHub — only PR lifetimes and job-file evidence, which are what the numbers above use. Fix: when a PR merges, the Mac closes every QUEUE line it covers, and a job whose fix already shipped is never sent.

## Tester real play time vs what they filed

This cannot be checked from GitHub today, and that is the finding. Not one job report records minutes played. The tester scoreboard (Mac v66/v67) lives only in the Mac's log: v66 timed only the robot's final check step, so real play sessions read 0.4 minutes; v67 retimes the robot's play jobs, but the corrected minutes were still "built, not yet seen" at audit time. Names also disagree: the Mac log credits tester windows 7, 8 and 10 for rounds whose job files are headed with game windows 1, 2 and 4.

What the tester rounds did file, from their own reports: G-105 (Track & Field) two new proved problems — 8 of 9 menu buttons off-screen on an upright phone, all menu buttons under the 44 px touch size. G-108 (Hockey) one new proved problem — the REALITY hook missing camera, time() and speed(). G-103 (Hockey) no new problems, three earlier lines re-verified fixed, one still open. G-109 no change at all — a stale order (see above).

Fix: every tester report writes its minutes played and its real window number (7–10), so the scoreboard can be checked from GitHub. And SCORES.md, meant to be graded daily and worth half of every game's score, was last graded Oct 18. Of job numbers G-01 to G-109, seven reports never landed in jobs/ at all: 12, 14, 26, 28, 61, 99, 106.

## What this audit could not verify

Exact branch total (lower bound given), the Mac's own wait-time logs, and true played minutes per tester — none of these live in the repo. Each becomes checkable the day the fixes above land.

ANSWERED: PRs open over 1 hour: PART DONE - G-100 PR #911 was brought up to date with main and re-checked (Oct 21 8:49 PM); naming old PRs on the board is not built yet, left for the VP (Mac work).
ANSWERED: Branch pile: FIXED - daily branch sweeper deletes every branch whose PR merged/closed with no newer work (game PR #989).
ANSWERED: Flaky robot tests: FIXED - known-faults.json (PR #963, #990) owns play-icing-called, play-goal-restarts-centre, play-defender-takes-puck on the robot side (yellow, expire Oct 28); aborted downloads fixed in #929; luck-based tests are INCONCLUSIVE (#953).
ANSWERED: Job waits / stale orders: FIXED - the Mac closes QUEUE lines whose tests already pass on main (queue_close_pass) and skips steps already in today's file (Mac versions 2026.10.21-63, -72).
ANSWERED: Tester real play time: FIXED - tester orders end with "WINDOW: <7-10> and PLAYED: <minutes> min" and the scoreboard compares it to the robot's measured minutes (v72); daily grades back in SCORES.md via window 7's first round after 9 AM (v73).
