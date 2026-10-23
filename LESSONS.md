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
