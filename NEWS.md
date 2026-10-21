# NEWS.md — owner decisions every Muse must know (the approver tells each Muse every new entry once)

Newest at the top. Format: `## YYYY-MM-DD · short title` then 1-3 lines. Only the owner's helpers add entries here.
Muses: when the approver sends you FACTORY NEWS, follow it from then on; the full rules are in the files named.

## 2026-10-20 · DONE.md is the bar for every job
Read DONE.md and REALITY.md before every job. The robot now also FAILs buttons on top of each other, buttons cut off by the screen edge, and a stick that can get stuck (no pointercancel/touchcancel + blur/visibilitychange reset). Every sports game must set window.__reality (REALITY.md "Robot hook").

## 2026-10-20 · New GitHub account for Muses: algre141-cyber
The owner made a separate GitHub account just for Muse work: **algre141-cyber** (shown as "apex-muse-bot"). It gets access to THIS repo only. Nothing changes for you today - keep working as now. When the owner switches you over (with the Mac mini move), sign in to GitHub with that account and use only it. Never use or ask for the owner's own account (Attacked-Kraken).

## 2026-10-18 · Flagship: Ice Hockey first · one Muse per FILE
The owner wants ONE game finished all the way to store-ready before spreading out: Ice Hockey is the flagship (his board shows "🏁 How close to the store" for every game). Up to 3 Muses work on it at once, each owning a DIFFERENT file so nobody blocks anybody: the lead owns apexhockey.html (and wires the others in), one owns venues/kit/rink.js (arena, crowd), one owns kit/apex-sound.js (the sound pack). Never edit a file another Muse has claimed on CLAIMS.md - ask for it in your PR instead. Small PRs, pull main before you merge. Every game also needs a great FIRST 60 SECONDS and a SOUND PASS (STORE-READY.md).

## 2026-10-18 · Plan first, build in stages
Big jobs and new games now start with a ONE-PAGE PLAN (plans/TEMPLATE.md): 30-second fun, controls, one camera spec, 3 reference pictures, KEEP, stages, done means. Commit it alone ('PLAN JOB Jn'), say 'PLAN READY JOB Jn' and STOP until the owner's 👍 on his board. Then build in stages (gray box → one polished level → the rest), one PR each, nothing outside the plan. Small fixes don't need a plan. Rules: STUDIO-STANDARD.md 4b.

## 2026-10-17 · Tests use GAME time · merges wait for the robot
1) The robot's phone has no graphics card, so games run in slow motion there: "wait 2 seconds" is only a fraction of a second of game time. Every game must expose `window.__test.step(seconds)` that runs the game forward by that much GAME time at once (fixed 1/60 s steps, no drawing), and play tests use it instead of real waits. 2) Your merge now WAITS until the game-check robot finishes on your PR; if the check FAILS the approver presses Deny - read the robot's comment on your PR, fix it, push, then ask to merge again. 3) The robot now really stops a test after 30 s and reloads the game after any failed test, so one test can't break the next. Test commands are Playwright (`page.setViewportSize`, `page.context().newCDPSession(page)`), not Puppeteer.

## 2026-10-17 · Every game gets friend codes
Owner: multiplayer with friend codes on every game. Menu button "👥 Play a friend": My code (+ Share) / Enter a friend's code; you then play against your friend's player, team or ghost at their strength, and the result goes on both records with nicknames. Games stay offline (no servers here) - live online play comes with the Arcade. Use `ApexKit.friend` from the shared kit (being built now from Ice Hockey's codes) and add a `play-friend-code` test. Full rule: STORE-READY.md "Friend codes". Add it whenever you work on a game.

## 2026-10-17 · Clean screen: only the buttons you need
Owner: no long words on the game screen. During play show only the game, the score line and the buttons needed right now. All instructions go behind a "How to play" (?) button, closed by default, turned sideways with the game. No keyboard words on phones ("space", "1 2 3", "WASD"). The robot now FAILS a play screen with 40+ words or keyboard words and CHECKs one with 20+. Rules: STUDIO-STANDARD.md "Clean screen".

## 2026-10-17 · CRASH FIRST: read the exact error, don't guess from pictures
F1 stayed black through 3 tries; the real cause was ONE error message ("rain light" missing on the rebuilt car, crashing every frame) that the robot already had. Rule: when a game is black, frozen or broken, FIRST read the robot's exact "Script error" / "Missing file" lines on your PR or in the job message and fix that line. Never change looks or cameras while a crash error is open. After changing a model or part, search the code for everything that used the old part.

## 2026-10-17 · Career modes get a ⏭ Skip level button (development only)
The Game Development page now opens every game with `?dev=1`. When that's in the address, every career/season/tournament mode must show a small "⏭ Skip level" button that wins the current level and moves to the next, so the owner can check all levels fast. Never show it without `dev=1`. This is for EVERY game with levels. Before a game goes to the Arcade, all testing tools are scrubbed out (STORE-READY.md "Scrub before the Arcade"). Also: every career level must be easy to SEE - nothing important off-screen or hidden behind buttons, menus or the power bar. Rules in STORE-READY.md "Developer skip".

## 2026-10-17 · Going to the Arcade = progress is saved
In testing, saving is optional. When the owner sends a game to the Apex Arcade, it must save progress first: career level and unlocks, best scores/times, coins/upgrades and settings survive closing the app (`ApexKit.save`), proven by `play-save-...` tests (STORE-READY.md "Ready for the Arcade").

## 2026-10-17 · Save usage: the robot tests for you · no endless redos
1) Do NOT play or measure the game in your own browser - that burns your usage fast. Push to your branch and open a pull request: the game-check robot plays it on a phone for free and posts pictures + every play test result. Read those. 2) When the owner sends a job back, write a FAILING play test for his complaint first, then fix it, and merge only when that test passes - a fix without a test is how the same thing comes back. 3) From the 3rd send-back the approver makes you list every past complaint and why each fix didn't stick, then fix ALL of them in ONE merge.

## 2026-10-17 · You are the store reviewer · career modes are robot-checked
The owner gives a few words, not the details. Before any code on a job, play EVERY mode, level and event like an App Store reviewer and write the full gap list (STORE-READY.md "The store reviewer"), then fix it all. Career/season modes must be playable start to finish: add `play-career-...` tests (every level loads, plays, finishes, unlocks the next). The robot now gives a CHECK for a career mode without them and lists any that fail.
## 2026-10-17 · KEEP sections are locked - fix only what the owner names
When the owner taps "👌 Keep what I like · fix the rest", his likes go under a **KEEP** section at the top of `looks/<game>.md`. Everything under KEEP is LOCKED: never change it, and protect it with a play test. Change ONLY the things he listed to fix. If a fix seems to need a KEEP thing changed, ask him first.

## 2026-10-17 · Apex look: no more green "computer screen" menus
The owner wants the green film and green typewriter letters gone. NEW HARD NO (STUDIO-STANDARD.md §5 "Apex look"): menus use the house look of F1 and Monster Truck - bold clean letters, white text, Apex red + gold, a dark see-through panel, the venue clear behind (no green tint). The robot FAILS typewriter/green menus. Today: Baseball, Flight, Hockey, Soccer - fix them.

## 2026-10-17 · Every menu fits a sideways phone - no scrolling to find PLAY
The owner had to scroll down to press Play. NEW HARD NO (STUDIO-STANDARD.md §5 "Fits the screen"): the robot FAILS a game whose start button sits below the bottom of a sideways phone (844x390). Scale the menu panel to fit or put PLAY at the top; long rules go behind "How to play". Today: Baseball "PLAY BALL" 192px below, Track & Field "FREE PLAY" 87px below - fix them. Hockey, F1, Soccer, Flight, Monster Truck, Racer fit.

## 2026-10-17 · Need a Sketchfab model? Ask the model fetcher - never sign in yourself
The owner made ONE Sketchfab account. Only the model fetcher (the idea scout window) holds the login. Builders: add a line to MODEL-REQUESTS.md (CC-BY or CC0, no brands, under ~20 MB, exact link) and keep working; the fetcher downloads it, runs it through the shrink robot, logs it in ASSETS.md and marks it DONE. Never sign in to Sketchfab or any site yourself.

## 2026-10-17 · Upright phones: the game fills the WHOLE screen - owner's law, never again
Held upright, a sideways game must fill the entire screen (the owner saw Track & Field on half the screen, the rest black). The robot now FAILS any game that fills under 90% upright. Fix: size the renderer and camera to the turned (sideways) box - `ApexKit.fit()` does it, or copy its sizing. Today: Track & Field 46% (FAIL - fix it), Hockey, F1, Baseball, Soccer, Racer 100%.

## 2026-10-17 · No blurry players - ever
The owner saw blurry players in Track & Field: the game lowered its own sharpness when it got slow. NEW RULE (STUDIO-STANDARD.md §2 "Sharp picture"): draw at `Math.min(devicePixelRatio, 1.5)` on phones and never go lower to save speed - cut crowd detail, shadows or effects instead. The robot now checks sharpness on a 2x phone screen in every game check ("Blurry picture" CHECK under 1.4x). Today: Track & Field 1.25x (fix it), Hockey, Baseball, Soccer, Monster Truck 1.5x (good).

## 2026-10-17 · Effects pack: camera shake, slow motion, scoreboard clocks, baked lighting
New in `kit/apex-fx.js` (try them in `kit/fx-demo.html`): camera shake on hits and goals (draw with `fx.render`), slow motion for goals/home runs (`fx.slowmo`, move the game with the time step `fx.update` returns), live 7-segment scoreboard clocks and counts (`fx.tex.segments`), and baked lighting for big floors: `'arena'` pools of light on rink ice, `'sun'` for open-air fields (`fx.lightMask`). Ice Hockey and Baseball first.

## 2026-10-17 · One signal = sound + effects
`ApexKit.emit('goal', { pos })` (or `fx.emit`) now plays the horn AND fires the confetti/flashes - one line in the game. Linked already: goal → horn, score, hit, whistle, boost. Add more with `fx.sound('bounce', 'tap')`. Guide: kit/README.md "Effects pack".

## 2026-10-17 · NEW: the effects pack - use it, don't rebuild effects
`kit/apex-fx.js` (open `kit/fx-demo.html` to see it all): ice spray, dust, dirt, sparks, confetti, splash, smoke, crowd camera flashes, waving flags/nets/grass, glowing stadium lights, code-drawn wood, seats with crowd, ice, grass, asphalt, jersey numbers and signs, plus `fx.emit('goal')`-style events. One tested version for every game, robot-checked. Guide: kit/README.md "Effects pack". Ice Hockey and Baseball (launch focus) should get it first.

## 2026-10-17 · More zero-size tricks: code-drawn pictures, particles, shader blocks
TOOLS.md "tricks that cost zero file size" now also has: canvas-drawn textures and UI (wood grain, seat rows, lines, numbers, timers), cheap particles in one draw call (ice spray, dirt, flashes, confetti), glowing circles with distance fields, and waving flags/nets/grass from a `sin(time)` vertex wave. Use these for atmosphere before adding any file.

## 2026-10-17 · Shrink robot now does pictures too + zero-size tricks
Commit a texture/sprite/sky as `<name>-raw.png` or `.jpg` (or `-raw2k` for big ground/sky pictures) and the robot makes a small `<name>.webp` on your branch (959 KB became 92 KB in the test). TOOLS.md also has "tricks that cost zero file size": shaders for ice, grass and lights, sound from code, stay on WebGL, and cannon-es for real physics when needed.

## 2026-10-17 · One Muse per JOB - only while the job is open (nobody owns a game or model forever)
A window owns a game or model ONLY while it has an open job on it (the job board and CLAIMS.md show who has what right now). The moment that job is done or the owner gives 👍, it's free again - any window can get the next job on it. Never refuse a job because "window N did that game before". If you get a job and another window has an OPEN job on the same game/model, say "window N has this open" and stop. Owner 👍/👎 and extra orders go as "EXTRA ORDER for JOB …" to the window that has that open job.

## 2026-10-17 · One Muse per game or model - no double work
Never work on a game or 3D model another window is already on: check CLAIMS.md and the job board first. If someone has it, stop and say "window N has this". The approver hands jobs for the same game/model to the window that has one OPEN, and to anyone once it's finished. (Two Muses rebuilt the same motorcycle twice on Oct 16 - wasted work.)

## 2026-10-17 · Real 3D models with credit (CC-BY) are ALLOWED
ASSET-LAW.md Part III: CC0 and CC-BY 3.0/4.0 are allowed (never NC/ND/SA). Use a real model from Poly Pizza or Sketchfab (CC Attribution, trusted maker, no brands) instead of building heroes from code shapes. Log it in ASSETS.md and credit the maker in the game's Credits screen.

## 2026-10-17 · Shared game kit for every game
kit/apex-kit.js (guide kit/README.md): pause/settings, mute, saves, credits, touch controls, chase camera, __test. New games are built on it; launch-focus games move onto it.

## 2026-10-17 · Robot safety net
The robot also checks every game in iPhone Safari, and AUTO-UNDOES a merge that newly breaks a game (your branch keeps the work - fix it and merge again). A game that freezes the robot is a FAIL - stay in the phone budget.

## 2026-10-16 · Launch focus: Ice Hockey + Baseball first
These 2 go to the arcade floor first. Jobs on them come before everything except the owner's own notes. Target: daily score 85 + owner thumbs up.

## 2026-10-16 · Venue first, play tests, honest scores
Every game needs a real owner-approved venue from venues/<sheet>.md (MODELS.md LOCKED) and 5+ play tests (fixes/README.md 'PLAY TESTS'). Passing the robot is not "good": the art director (SCORES.md) and the owner decide. Read LESSONS.md and PLAYBOOK.md before every job.

## 2026-10-16 · "Merged" must be real
A job only reaches the owner if the repo really changed after it was sent. Never say merged/fixed/live without a real commit and the game check pictures (PROOF RULE).
