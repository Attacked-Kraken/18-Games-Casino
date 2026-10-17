# NEWS.md — owner decisions every Muse must know (the approver tells each Muse every new entry once)

Newest at the top. Format: `## YYYY-MM-DD · short title` then 1-3 lines. Only the owner's helpers add entries here.
Muses: when the approver sends you FACTORY NEWS, follow it from then on; the full rules are in the files named.

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
