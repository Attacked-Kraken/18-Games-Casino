# LESSONS.md — what still matters (read before EVERY job)

Owner: Mr. Cruz. Trimmed Oct 21 2026 ("cut to what still matters"): the full history is in LESSONS-ARCHIVE.md.
A new lesson goes here as ONE line: `- game · mistake → rule`. When a rule REPLACES an older one, delete the old
line (a solved bug leaves its test + one line of cause). Per-game short lists: rules/short/<game>.md.

## Factory (every window)
- all · "fixed" said before the pictures were seen → never say done until you SEE it in the robot's pictures; say "merged, NOT yet seen".
- all · the owner's complaint words were fixed from memory → every owner point becomes a play test that FAILS on today's game first; the job is done when it passes.
- all · a fix rewrote the code around it → change only the piece the job names (one fix per job); never rewrite placement, steering, AI, cameras on the way.
- all · shared files were rewritten by one job → only ADD your own entry to MODELS.md / ASSETS.md / CLAIMS.md; shared folders change only in their own job.
- all · a job's files sat on an unmerged branch and a Muse lost a day → a job names its files as path + branch/PR; the Mac checks they exist before sending; "RE-SEND, same job, nothing new" means exactly that.
- all · side chats → work ONLY in your main chat (the Mac cannot type or press cards in a side chat).
- all · a tester's reminder arrived without the order → a G-NN order is the message the Mac typed to YOUR window; every reminder now carries the full order again.
- all · red robot lines were waited on as "an owner job" → red lines come to the builder by themselves (ROBOT RED LINES step); a robot mistake goes in jobs/HELP.md as "robot fault" and lands in tools/game-check/known-faults.json.
- all · the merge robot merged a branch behind main and wiped another job's tests → only an up-to-date, green branch merges.
- all · a tool saved files as base64 / double-encoded UTF-8 → always send plain UTF-8 text.
- all · the quick check cannot run in a Muse sandbox that blocks 127.0.0.1 → open the PR early; the PR robot + its one "🤖 Check status" comment IS the quick check.
- all · MUSIC through hidden audio elements (G-80 -> Exotic Racer: constant static + skipping on the owner's phone; files were clean 192 kbps) → music is decoded ONCE into an AudioBuffer (decodeAudioData) and looped with a looping AudioBufferSourceNode on the game's own AudioContext clock, layers started at the same context time; NEVER <audio>/HTMLMediaElement + createMediaElementSource (own clock, drifts, garbles on every pause/resume and loop seam). Every sound already did it right - the music was the only thing on the bad path. Guard test: play-music-buffers (0 media elements created across menu -> race -> menu). Fixed in game PR #1269; owner's ears are the final proof.
- all · FENCE RULE: a Muse that fixes another PR's identical defect edits TEST FILES ONLY (tools/game-check/fixes/, jobs/, reviews/) and says so on that PR - untagged swarm-help is how branch drift happened in G-84.

## Robot and tests
- ROBOT REPAIRS ARE RACED BEFORE THEY SHIP (owner Oct 23 2026, after 7 h on one setup failure): repair -> side-by-side on a scratch branch (not a PR), the new way and today's way, N runs each at the same time -> numbers -> only then a PR. Never prove a robot repair through the sick checker itself. The race of Oct 23 (12 runs each): Microsoft's Playwright image 0 failures, apt fix 1, saved browser 0 of 10 - the image shipped (#1374).
- all · tests assumed a fresh menu; the robot runs all of a game's tests on ONE page → every test starts from its own fresh state and presses only visible buttons.
- all · tests drove input state directly / sampled meters on a wall clock → drive the game through its real controls; measure in game time, not the robot's clock.
- all · Puppeteer calls (page.target, page.setViewport) in play tests → the robot is Playwright; use its calls.
- apexracer · the REALITY robot read moves 0 while go(true) only set a gas flag → a hook that must MOVE the game steps the simulation itself in game time; never trust the frame loop on a robot page (its dt is clamped and its frames are starved).
- all · a test that waits for a random event (a strikeout in 29 s) failed the game → such a test is INCONCLUSIVE (yellow), make the test CREATE the situation it checks.
- all · a play-test file with a syntax error silently ran zero tests → it is now a hard FAIL naming the file; run node --check before the PR.
- all · the REALITY robot read the ankle bone and the robot's clock → contact is the foot's LOWEST point, speed/gait from the game (hook time(), speed(), gait()); a sprint's first steps are running steps.
- all · the game loop capped every frame at 0.033 s, so game time crawled on the robot → the simulation banks real time; the visual dt stays clamped; cameras ease by the simulation dt.
- all · Baseball's feet sat 5 cm in the dirt and the fix tried was editing footOffset → a red SINK / FLOAT line means the BODY is in the wrong place: move the player's height on the field until the ground line is clean. Never change the hook's measuring numbers (footOffset, contact, ground) to clear a red line - the robot measures the real sole on the body and ignores footOffset (PR #1027).

## Look and build
- all · hero things built from boxes / capsules → the player's car, bike, jet, athlete is a real model (CC0 / CC-BY with credit), picked through the model gate; people are the rigged studio humans.
- all · the picture went blurry when the game got slow → pixel ratio min(devicePixelRatio, 1.5), never lowered; cut crowd/effects instead.
- all · "too small" was fixed by shrinking the hero → never shrink the hero; scale the world to real sizes.
- all · a held control stayed held through a call / app switch → every hold releases on pointercancel, blur, pagehide, hidden tab (kit/controls.js does this; no game writes its own stick).
- all · a menu that fit on one machine was off-screen on another → test menus at 390 px tall sideways; nothing may sit below the screen.
- all · the owner's camera notes stacked up and went in circles → ONE full camera spec (distance, height, look point, follows the lane, never through walls) replaces the old lines.
- all · one giant game file with its own controls → one fix per job, shared controls in kit/controls.js, new games split into small files (STUDIO-STANDARD §9).
- all · a fetched model came in white / sideways / half size → read each model's own materials and nose; clean shadow sheets; check every car shows its own paint.
- all · the owner's redo workflow: his 👎 points are numbered, each with a TARGET (his picture, a link, a number); a 3D-model complaint picks and locks the model FIRST; every point goes to the game's NEVER list with a test; the report answers POINT k: YES/NO.

## 2026-10-21 help desk (8:15 PM)
- all · a game sent back for a redo (Baseball: players not real 3D, blurry, no close camera) came back again → first time right: (1) replay TODAY's main first - skip what is already fixed; (2) every send-back line becomes a measurable pass/fail and a failing tester-/play- test BEFORE any code; (3) real rigged models from SEARCH/REQUEST lines at true size, no code-drawn stand-ins (owner picks); (4) look at the robot's menu, play and close-up pictures at phone size, in both orientations - the report says "seen", not just "merged"; (5) the report names what was NOT tested.
- all · quick-check.sh cannot run where the Muse's Chromium blocks 127.0.0.1 → open the PR early; the PR robot's one "🤖 Check status" comment is the quick check.
- all · a report may say the wrong window number → the Mac reads jobs/G-NN.md by job id; write your own window number, nothing else changes.
- all · a redo can pass on the robot but change nothing on the owner's phone because his old save hides it → check the pictures with an OLD save loaded too (window 7).

## 2026-10-21 help desk (9:12 PM)
- advisor · a report left without an ANSWERED line shows as open on every run → every advisor report ends with one ANSWERED line per numbered item (FIXED / PART DONE / WON'T FIX).
## 2026-10-21 help desk (9:40 PM)
- A PR robot verdict "nothing new is broken" is not the finish line: the job's own proof test must also pass in the main game-check on the merged commit. Read both before you write "done".
- apextrackfield · the compact menu keyed on the viewport's own orientation, so an upright phone kept the tall one-column menu inside the rotated sideways box and 8 of 9 menu buttons landed off-screen → rule: in portrait the stage IS the landscape box - any layout keyed to the short box must include (orientation:portrait) too.
- apextrackfield · the sprint/hurdles start used a straight-line model that runs past the west end of the painted track, so the 100m and 110m hurdles fields started in the stands → rule: every start is placed on the painted oval (visS) - one model the camera, the blocks and the runners all share.
- 2026-10-22 · apexflight · The game-check page is shared by every fix test and the start menu never comes back after the first flight (the harness also starts in FREE FLIGHT) → rule: a test that needs a mode must reload the page back to the menu itself before pressing its button, or it silently runs in the mode an earlier test left - both challenge tester tests fail on main this way (free-flight mode: the challenge never scores and never messages), not from the game behaviors they name.
- apextrackfield · the G-139 sink guard cached sole indices on the menu rig's bones and passed blind once the race rebuilt the rig -> a measuring test builds its index on the bones it samples and fails closed when readings are missing (G-139 round 1)

- 2026-10-22 · apexflight · A look-only change (shadows, tone mapping, environment) can flip the tightest wall-clock play test on the robot with no real slowdown behind it → rule: measure fps old-vs-new before redesigning anything (G-141 step-6 look: 3.5 vs 3.3 fps in the software renderer - the misses were the runner's clock, later filed as known robot faults).
## 2026-10-22 help desk
- A job whose number never reached a Muse (lost order): ask the Mac for the next G-number, or file the report in reviews/<window>-<topic>.md - never invent a G-number.
- Before filing an art-director/robot line, read main's newest check: a measuring error (0.18x sharpness, 48/48 sunk) may already be fixed in tools/game-check (#1044, #1027).
- A queue line whose proof test passes on main is done: tick it [x] with the job/PR number.
- A tester report always starts WINDOW: N / PLAYED: N min (every round kind); a duplicate job = one-line NO CHANGE naming the earlier job/PR.
- Two builds of the same change (G-100 PR #911 + G-125): keep one live PR, the second to merge takes main's version of the shared line.

## 2026-10-22 help desk (9:45 AM)
- A job step that names a feature but no place for it (a LOW quality option, "parked"): choose the smallest reading, keep everything else as is, write the choice in the report's NOTE line - and any new menu control must fit inside 844x390.

## 2026-10-22 help desk
- Tests that wait on WALL-clock seconds fail on slow runner days (Flight G-141). Rule: a play test judges time in GAME time (or retries once on a fresh page); a wall-clock budget is a robot fault - file "HELP-VP: robot", never fight it in the game.
- 2026-10-22 (window 6, G-163): a ratio threshold is a claim about a real profile - print the profile (band/dband/run) from the actual car before shipping the fix. The Goblin door tapers ~10% under its own peak (peak 1.331, mid-door 1.18-1.22), so 0.92 of the peak left a 4-bucket island and the APEX ARCADE strip silently never drew.

## 2026-10-22 help desk (2:40 PM)
- A bug found in an old tester run (1 s of game time per frame, Hockey G-129) may already be fixed: before asking for an owner job, read the line on today's main and the robot play test that covers it (play-clock-real-time); if it passes, say "already fixed" - no new job.

## 2026-10-22 help desk
- When orders land while the owner's own fix is in flight: owner's fix first, then the older small fix, then the new job - one at a time, one report each.

## 2026-10-22 help desk (5:40 PM)
- A one-letter "MODE: g" in a tester order was a Mac typo, not a real mode. Rule: if a MODE name is not one the game has (see the game modes list), play ALL real modes, list them as "MODES:" in the report, and say in one HELP line which name looked wrong.

## 2026-10-22 help desk (7:10 PM)
- Finished tester round branches piled up unpushed because push approval taps never reached detached runs. Rule: push every finished round as a TEST PR the same day; drop only rounds already reported on main.

## 2026-10-22 help desk (8:15 PM)
- The art director cannot grade the upright phone view without a picture of it. Rule: when a grader (window 11/12) needs a picture the robot does not save, file ONE "HELP-VP: robot" line naming the file and the picture wanted - never grade or ask windows from memory.

## 2026-10-22 help desk (9:20 PM)
- When main moves during a tester round, the report names the main commit the round was played on, and each TESTER line is re-run on current main before it is filed (file only if it still fails there).

## 2026-10-22 help desk
- A request for a robot picture 'that is missing' may already exist under a different file name: list img/ on the game-checks branch (e.g. <game>-3-upright.jpg) before filing a robot change.

## 2026-10-23 help desk
- A PR check that reads RUNNING for a long time may have finished and merged since: read the PR state (merged?) before filing a HELP line. Rule: "stuck RUNNING" = look at `merged` and the check list first.

## 2026-10-23 help desk
- Several robot-fault lines with one cause (slow-runner wall-clock) are answered by the first fix; file ONE HELP line per cause, not one per test, and read the lines above yours for a FIXED first.

## 2026-10-23 VP (stuck work)
- NEVER wait for a job number. The owner's typed fix has none on purpose: branch + PR now, and add it as an extra CHANGED line in your current job's report (window 5 sat on a finished pack fix all night waiting for a number).
- "Passed" means MERGED. Before telling the owner a fix passed, read the PR: `merged: true`, and its Check status comment. A green verdict followed by a cancelled / failed required check is NOT passed (window 6 told him "PASSED" on a red PR).
- A play job cancelled at the 55-minute limit is a robot-side problem: re-run the failed job (Actions > Re-run failed jobs), and if it times out twice file ONE "HELP-VP: robot" line naming the game and the run. Do not push again (every push restarts the whole check).
- Your HELP line only exists once its notes PR is MERGED on main. If your notes PR conflicts or sits over 30 minutes, say so in your next HELP line - never assume it was seen.
- Test the real symptom, not a stand-in: a car that measured 0.00 m on the grid but sank 0.6 m mid-race passed every check. Your play test must reproduce what the owner saw (driving, mid-race), then pass.
- The merge robot's "every 5 minutes" timer is NOT reliable (GitHub ran it every few hours), and a conflicted pull request never starts a check, so nothing wakes the robot for it. Since Oct 23 the robot wakes itself (heartbeat) while any pull request still needs a second look; if your PR sits conflicted or unmerged over 10 minutes, merge main into your branch yourself and say so in your next report.
- Conflicted or "blocked" pull request that nothing merges (Oct 23): the merge robot now fixes it by itself (heartbeat wake, full checkout, built-in union merge, approves bot-started check runs). Read the PR's commits for a "merge robot" merge commit first; only if the robot failed twice, merge main into your branch yourself - and say why in your report. Never call it done before `merged: true`.

## 2026-10-23 help desk
- all · a tester branch re-filed a report file (jobs/G-NN.md) another window already merged under that number → a TEST PR whose report name already exists on main conflicts forever: take the next free job number for your own report, never reuse a merged one.
- all · a superseded duplicate BUILD PR (same job, rebased copy) stays open and confuses the board → the builder writes "Supersedes #N" and closes the old one the same hour.

## 2026-10-23 help desk
- A notes PR (needs/window-N.md) goes "dirty" when main's copy of that file gained an ANSWERED line after you branched. Branch needs/ updates from fresh main, never reuse an old needs branch; if conflicted, a Claude re-files it.

## Oct 23 2026 help desk
- A PR whose check shows only guard and no Check status update is waiting on a run that never started; file the HELP line with the PR number and head, and a Claude merges main in to restart it. Do not wait hours.

## 2026-10-23 help desk (3:36 PM)
- A PR whose required `check` shows "expected" with no status: look at the PR HEAD first - if the head moved (main merged in), the new head runs its own check; read the Check status comment on the newest head before filing HELP.

## 2026-10-23 help desk (4:10 PM)
- An order with one CHANGED line per point may have a point that measures clean on today's build: file the other CHANGED lines, answer that point "YES - nothing to fix, measured clean" with the evidence in a NOTE line. Never invent a change to fill a line.

## 2026-10-23 help desk
- A play job that dies in ~4 min with "exit code 1" and NO test lines (check says "the robot could not play it") never reached a test: file the HELP line, the help desk re-runs it once; do not change game code for it. A second identical failure = HELP-VP: robot with both run links.

## 2026-10-23 help desk (5 PM)
- Two windows can end up with the same G-number (testers self-start rounds). Use the number the MAC typed; with none, take the next free jobs/G-NN.md on main right before filing; on a clash file HELP-VP naming both windows.
- A needs/window-N.md PR that conflicts on a long-open branch: re-file the new lines on a fresh branch from main (prepend, keep every old line) and close the old PR as superseded.

## 2026-10-23 help desk (5:20 PM)
- A play job that dies in ~4.5 min with no test lines is usually the browser INSTALL step (apt lock / stall), not the game. Check the failed job's last lines; if it says 'Could not get lock' or 'Failed to install browsers', file ONE HELP-VP: robot line with the run link and do not push or rebuild - a push restarts the whole check.

## 2026-10-23 help desk
- A tester round that numbers itself with a G-number can overwrite or clash with a builder's jobs/G-NN.md and start a branch with no shared history (PR #1281, #1296): start every self-started round from a fresh branch off main and name the report T-<window>-<HHMM>, never G-NN.
- A green TEST PR that sits unmerged for hours is usually (a) a conflict in a tests file where both sides appended (keep both sides) or (b) GitHub leaving mergeable unknown while main moves (merge robot fix: game PR #1351). Do not wait; file HELP-VP.

## 2026-10-23 help desk (6:10 PM)
- Tests/jobs/notes-only TEST PRs never need the owner's go-ahead: push them, the merge robot lands them. Waiting for a tap you do not need is the same as an idle window. A checklist item that measures OK is a tick + NO CHANGE report only.

## 2026-10-23 help desk (Oct 23 06:14 PM)
- A Muse token cannot re-run Actions jobs (403); a help-desk Claude can: ask with a HELP-VP line naming the PR and run id.

## 2026-10-23 help desk (6:58 PM)
- A PR that conflicts with main gets no useful check - a red robot line on it may just be the stale run. Look at mergeable state first; if conflicted, the help desk merges main in keeping both sides and the check restarts.

## Oct 23 help desk
- A tester round numbers itself only from the Mac's NEXT list; two PRs with the same G-number overwrite each other's jobs/G-NN.md. If it happens, the report moves to jobs/G-NN-wN.md.

## 2026-10-23 window 5 (G-239)
- apexf1 · heading measured against the road itself made gas-only a full autopilot - the player's nose now holds a world heading and only the stick turns it; a robot check line can also be the robot's own older setup (two red lines cleared untouched on the newest setup's re-run), so read the re-run before pushing a fix.

## 2026-10-23 help desk (8:25 PM)
- A notes PR from an old needs/window-N branch can have NO shared history with main and show "dirty" forever; the fix is a fresh branch from main with the notes added, not a merge. Window helpers: start every notes PR from current main.

## Oct 23 2026 help desk
- A test that waits on a wall-clock message cap goes red on a slow runner though the game is right; judge by game time, and file HELP-VP: robot (not a game change) with the red line.

## 2026-10-23 help desk (10:45 PM)
- A known-faults.json "match" must use words the red line really prints (the test's ask text), not only the test id; before filing a fault, copy the exact red line and check the entry's pattern against it. Best cure: fix the test's wall-clock cap (scale by window.__slow) so no entry is needed.
- Known-fault patterns match `<red line> <ids of the failing tests>` - the id comes AFTER the text, so write `(?=.*the-test-id)<text pattern>`, never `.*the-test-id.*<text>` (never-g-243-p1 and two tester entries could never match; fixed Oct 23 2026 10:45 PM).

## 2026-10-23 help desk (late)
- A tester round you start yourself is named T-<window>-<HHMM> (file jobs/T-<window>-<HHMM>.md), never a G-number: there is no NEXT list for windows to read, and self-picked G-numbers collided (G-238, G-246).
- A needs/window-N branch must start from current main (git checkout -b from origin/main), never `git init` or a fresh orphan: a branch with no shared history can never merge (PRs #1347, #1408, #1409).

## 2026-10-24 help desk
- A conflicted PR gets no real check (only the guard runs). When a test file and looks/*.md both gained entries on main, merge main in keeping BOTH sides; re-add your own test block after main's last entry rather than hand-editing the conflict markers. Run `node --check` and import the fixes file before pushing.

## 2026-10-24 help desk
- A tester asked where the Mac's NEXT list lives: it is not a repo file. A typed number is yours; a self-started round is T-<window>-HHMM, never a G-number.

## 2026-10-24, 03:42 AM help desk
- Notes PR with no shared history with main can never merge (PR #1441 again): re-file its newest section on a fresh branch from main, never merge main into it, and keep stale CLAIMS rows out.

## 2026-10-24 help desk (merge robot)
- A green pull request sat unmerged because a push cancels the old run's bare `play` job and nothing replaces that name (the new ones are `play (<game>.html)`), so the merge robot read the cancelled leftover as a FAILED check. The robot now ignores a cancelled check whose matrix children exist on the same commit. Rule for a Muse: a PR whose Check status says PASSED while the robot comment says "FAILED: play" is the robot's leftover - file HELP-VP: robot, do not push.

## 2026-10-24 VP (hand merges)
- Hand merge = say so (Team talk + PR comment, who and why). Read the whole HELP file and the PR timeline before 'I don't know'. A robot fix is proven only by the robot doing the job on a real PR (merged_by github-actions[bot]).

## 2026-10-24 help desk (comment spam)
- A PR that "GitHub has not computed" is not always conflicted: check `git merge-tree` against main and the Check status comment first. #1427 was clean; one red inconclusive sampler test plus a merge-robot comment every 2.5 min (676) made it look stuck. Fix = merge main to re-run the check; the robot-side repair is filed as a HELP-VP: robot line.

## 2026-10-24 help desk
- A code-drawn model (no model file) is not a MODEL FIRST job: do the fix, state it in the MODELS: line. A same-shaped entry the order did not name is listed in the report NOTE, not fixed.

## 2026-10-24 help desk
- A timing play test must not measure the robot's own speed: after a fix scores on the game clock, a leg that checks wall-clock duration (tester-batting-swing-wall-clock, 1.40 s vs 0.95 s) fails on a busy robot for no game reason. Keep only the leg that tests the rule; when the fix lands, drop the old wall-time leg in the same PR.
- Testers do not wait for an owner go-ahead to file TEST PRs: push the backlog one PR at a time from a fresh branch off main, named T-<window>-HHMM.

## 2026-10-24 help desk
- A robot send-back that says "ignore it if your newest merge is newer": first check whether the robot's checked main CONTAINS your merge (git merge-base --is-ancestor). If it does, the red lines are yours - do not ignore them.
- A main-run FAIL has no PR Check status comment; read the apexf1 (or your game's) entry in results.json on the game-checks branch instead. A play test must use `async test(page, h)`, never `run`.

## Oct 24 2026 help desk
- A step that says "show X on the final approach" or similar with no mode named means every mode where that moment happens; build it once and give a ?test= link per mode. Builder reports always go in jobs/G-NN-w<window>.md, never the plain jobs/G-NN.md (that file can belong to a tester round).
- A tester recheck that finds the defect already fixed on main reports STATUS: NO CHANGE plus a NOTE line naming the fixing commit/PR and what was measured. Only STATUS: CHANGED or NO CHANGE exist (jobs/README.md).

## 2026-10-24 help desk
- An art director line that window 12 shows but main lacks after 30 min: the owner taps Tell 03 and the help desk files it under jobs/HELP.md and queues the one-fix job. Rule: file it verbatim, answer directly under it, queue ONE job for the game owner window.

## 2026-10-24 window 6 lesson
- Window 6 lesson (Oct 24 2026, PR #1614): a Muse lost ~1 h re-creating a script error the robot had already seen. RULE: when a window loses time on something the robot knows, (1) ask that window 'what would have saved you this hour?', (2) build the robot side from its answer, (3) prove it on a real red PR before saying it works. Window 6's answers became: the robot saves the error stack + 3 code lines + last 20 console lines + 3 pictures in the PR's one Check status comment; the line names the STEP it fired in (boot / during play test X); each line says NEW in this PR or also on main; the 2-minute message carries the robot's EXACT red lines with their numbers (6.47 m, not 'wrong size'); a failed row on the controller shows it all. Muses: if the robot's line lacks something you need, file a HELP-VP: robot line naming exactly what is missing - that is how this was built. A message held because the owner is typing in a window is retried, never dropped (PR ladder, v2026.10.24-65).

## Oct 24 2026 help desk
- A play test that changes shared page state (E.S.cur, E.S.cars, R.on) must restore it before it ends, also on early returns: later tests in the same file run on the same page (PR #1614: play-garage-options left the Kestrel with a kit on, so never-g-270-p1 could not finish 3 laps).
- G-300 (Oct 24 2026): gating only a car's target speed for the countdown does not freeze the car - the AI lane logic below the gate walked stationary rivals up to 3.9 m sideways across the grid before GO (R01 audit). Freeze the whole step while R.t < 0 (stepPlayer already zeroed its own throttle; stepAI did not).
- G-313 fix 1 (Oct 25 2026): a test margin that flickers at the line is a distribution, not a verdict - trace the actual stall before fixing. Three wrong theories died on measurements (save pollution, traffic jams, the pace cap); the real cause was a >97-degree nose-in at the start bend: the wall glance-off refuses turns past 1.7 rad, a stopped car has no steering authority, and the wrong-way trigger needs 4 m/s, so the car sat out the 3.5 s stuck reset in a loop and the driven lap times swung by whole lap-chunks.

## 2026-10-25 help desk
- A Mac order can arrive twice and name two report filenames (jobs/G-NN.md and jobs/G-NN-wN.md). Do the job once; the report file that counts is the window's own jobs/G-NN-w<window>.md.

## 2026-10-25 help desk (2)
- A play test that sets `location.href` inside `h.eval` must end the call with `.catch(() => {})` - the navigation kills the page context and the test reports "Execution context was destroyed" as a game failure. Any helper a test calls (g265PortraitOverlaps) must be defined in the same fixes file; the robot shows "X is not defined" as a red line against the game.

## 2026-10-25 window 6 (G-345)
- A play test that starts a race on the shared page must census the race IT started, never the first ready R: the previous test's live race passes every readiness check, so play-garage-options read the sign test's stock Goblin and reported its bought underglow missing while the game built the kit car correctly. Capture the old R before startRace and wait for R to change identity. And: never claim a test is absent from a file on a pattern search - read the region; quote style alone hid play-garage-options (double quotes) from a single-quote grep.

## 2026-10-25 help desk
- Confusion: the playtests robot said Flight "swiper: slow - under 15 fps several times" and a builder wondered whether to trim shadows. Rule: a playtests fps line is a robot reading (headless software rendering) - compare the three styles in results.json (lowFps per style) first; if gas/masher/swiper dip about equally it is the robot, not the input style, and no game change is ordered without a dip reproduced on a phone with a named scene.
- Measure 'looks fake' as geometry before picking the fix: today's rim face is 0.000 m thick with 30 vertices (a drawn disc - the design lives in a canvas texture), so never-g-345-p1 holds real rim depth >= 0.03 m and >= 300 vertices per wheel (window 6, G-345 fix 1).
