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

## Robot and tests
- all · tests assumed a fresh menu; the robot runs all of a game's tests on ONE page → every test starts from its own fresh state and presses only visible buttons.
- all · tests drove input state directly / sampled meters on a wall clock → drive the game through its real controls; measure in game time, not the robot's clock.
- all · Puppeteer calls (page.target, page.setViewport) in play tests → the robot is Playwright; use its calls.
- all · a test that waits for a random event (a strikeout in 29 s) failed the game → such a test is INCONCLUSIVE (yellow), make the test CREATE the situation it checks.
- all · a play-test file with a syntax error silently ran zero tests → it is now a hard FAIL naming the file; run node --check before the PR.
- all · the REALITY robot read the ankle bone and the robot's clock → contact is the foot's LOWEST point, speed/gait from the game (hook time(), speed(), gait()); a sprint's first steps are running steps.
- all · the game loop capped every frame at 0.033 s, so game time crawled on the robot → the simulation banks real time; the visual dt stays clamped; cameras ease by the simulation dt.

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
