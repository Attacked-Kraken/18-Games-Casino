# CLAIMS.md — who is doing what (READ THIS BEFORE WORKING)

**Owner's rule (2026-10-14):** every bot cross-checks this board, recent
commits, and open PRs BEFORE starting a task. If a task is CLAIMED or DONE,
do not redo it. Claim your work before you build, and sign it when it ships,
so nobody double-works.

## FAMILY RULES (owner's law, 2026-10-15)

Every Game Development title follows **FAMILY-RULES.md**: no gambling/casino/real-money content, no real
brands or players, no personal info, chat, ads, tracking or internet, content fits the game's age, keep
save keys and arcade hooks, own branch + PR, never undo others' work, no Apex Arcade code in this repo.
Finished games are handed to the Apex Arcade reviewer by telling the owner.

## FIX LIST - say it once (owner, 2026-10-15)

**The owner should never have to repeat a complaint.** When he reports a problem with a game:
1. **Within 5 minutes**, reply in ONE line: what you think the cause is and what you'll change. No long reports.
2. **Write the test first:** add his complaint, in his words, to `tools/game-check/fixes/<game>.mjs` as a test that
   FAILS now (how-to: `tools/game-check/fixes/README.md`).
3. Fix it, merge, and look at the game check report: his words show ✅ (done) or ❌ (not done).
4. Only say "fixed" when it shows ✅. ❌ = keep going, don't report "done". Never delete or weaken a fix test.
The owner's approver reads the report and sends the ❌ items back to your window until they turn ✅.

## JOB BOARD, LOOK BOARDS & 3D MODEL GATE (owner, 2026-10-16)
- **Jobs** come from the owner's phone (his approver types them in as "NEW JOB Jn ..."). Claim it here, read
  `looks/<game>.md`, split it into small steps, ship one step at a time. Finish with "JOB Jn merged, NOT yet seen".
  A job is done only when the OWNER gives it 👍 from the game check pictures. A 👎 comes back with his words: add them
  to the NEVER/MUST list in `looks/<game>.md` AND as a test in `tools/game-check/fixes/<game>.mjs`, then fix.
- **Look boards** (`looks/<game>.md`): the owner's MUST / NEVER list for each game. Read it before every job on that
  game. Never remove a line from it.
- **3D models**: never show the owner mockups or drawings. Every new or changed model goes in `MODELS.md` as
  `WAITING OWNER`, checked in `tools/model-viewer.html` with the game's preset from `look-presets.js`. The game check
  robot photographs it for his phone (you can't take WebGL pictures - the robot can). Only after his 👍 (`LOCKED`) does it
  go in the game, with the same preset. LOCKED models are never swapped for anything else without a new 👍.
- **SEEN replies**: after you say "merged, NOT yet seen", the approver pastes the new game check picture into your chat.
  Answer each thing you changed with `SEEN: yes` or `SEEN: no` - and fix every no.
- **Idea scout**: only the window the owner picked as scout may browse, and only for SCOUT.md work.

## PROOF RULE (owner, 2026-10-15)

**Never say "fixed", "done", "live" or "verified" for anything the owner can SEE unless you have looked at the
result yourself.** Your browser screenshots often fail - that is not an excuse to guess. After your merge,
open the game-checks branch report (link in GAME CHECK below) and look at YOUR game's pictures:
- If the picture shows the problem is gone, say so and say "seen in game check".
- If it still shows the problem, or the report hasn't updated yet, say exactly that: "merged, NOT yet seen".
- If the owner says it's still wrong, believe the owner's screenshot over your own code. Find the real cause
  (measure it - log positions/rotations, test the actual numbers) instead of re-shaping the part you guessed.
Reporting what you meant to change as if it were what the owner will see is the #1 complaint. Don't.

## BIG FILES - the patch robot (owner, 2026-10-15)

Your GitHub tool can't send a whole big file (over ~150 KB, like apexracer.html). Never try - use the
**patch robot**. It runs on GitHub in about a minute, on whatever branch you push to (your own branch):

- **Change a big file:** make a normal unified diff (git diff format, a few unchanged lines of context around
  each change) against the CURRENT version of the file on your branch. Push it as
  `patches/<your-muse-name>-<what>.patch`. The robot applies it to the big file and deletes the patch.
  It is strict: if the diff doesn't fit the file exactly, it leaves `patches/<same-name>.result.txt` saying
  why - pull the latest file, redo the diff, push the .patch again (delete the .result.txt).
- **Create or replace a whole big file:** split it into parts under 100 KB and push
  `bigfiles/<path/to/file.html>/part-001`, `part-002`, ... then a file `bigfiles/<path/to/file.html>/DONE`
  containing the number of parts. The robot joins them into `<path/to/file.html>` and deletes the folder.
- **Read a big file your tool can't open:** push `pieces/request-<anything>.txt` containing just the file
  path (e.g. `apexracer.html`). The robot cuts it into `pieces/<path>/part-001.txt`, `part-002.txt`, ...
  (90 KB each). Read them in order. Delete the `pieces/` folder from your branch before you merge.

After the robot's commit lands, pull your branch before you push anything else to it.

## GAME CHECK (owner, 2026-10-15)

After every merge to main, the **Game check** robot plays every Game Development title like a phone
(sideways and upright) and posts pictures + results to the **game-checks** branch:
https://github.com/Attacked-Kraken/18-Games-Casino/tree/game-checks
After you merge, open it and look at YOUR game. 🔴 FAIL must be fixed (black/blank screen, missing
files, casino words, rotate sign). 🟡 CHECK means look closer. When you add a game or change how it
starts, update its start buttons in `tools/game-check/games.json` so the robot reaches real gameplay.
Don't edit the game-checks branch by hand - the robot overwrites it.

## WHERE NEW GAMES GO (owner's rule, 2026-10-14)

New built games are GAME DEVELOPMENT titles. They go on the Game
Development page: **sports.html** ("Apex Arcade Game Development"),
reached from the red GAME DEVELOPMENT circle on the entrance.

- To ship a new game: add its tab + its card in the ALL TITLES grid to `sports.html` (copy an
  existing card, keep the style; there is no big top panel any more - owner removed it 2026-10-16) and point its PLAY button at the
  game's `.html`. That is the ONLY registration a new game needs.
- Do NOT put new games in the casino: not in `games.json`, not in the
  lobby BUILTIN registry in `index.html`, not on the casino floor, not
  in the hallway tabs. The casino is sealed behind the secret 0 and
  lists its 19 games only.
- Game-dev pages never link to the casino side. A game's back button
  returns to `sports.html`.

## ASSETS RULE (owner, 2026-10-14)

**Use the best models: the most realistic FREE 3D models and assets
available.** If a quality free model exists for something, use it —
do not ship blocky placeholder geometry for players, vehicles, props
or environments when a better free asset exists. Rules of the road:

- **Approved sources ONLY — the full list is ASSET-LAW.md (the law of
  creation):** Quaternius, Kenney, Poly Pizza (CC0 items), Poly Haven,
  ambientCG, KayKit (free packs), OpenGameArt (CC0 items only). CC0
  means free to use even in a paid app. NOT approved: Sketchfab,
  Mixamo, TurboSquid, and anything ripped, leaked or paid.
  **NO COPYRIGHTS: every asset must be copyright-free (CC0 / public
  domain). If it carries a copyright, it does not go in — no
  exceptions.**
- **Realism is the target** — correct proportions, real materials and
  textures over stylized stand-ins, wherever the game is on screen.
  **Models and clothing must match the game and the style of play it
  mimics** (hockey players wear hockey gear, basketball players wear
  basketball kits, drivers wear race suits). Generic outfits on
  athletes are a defect.
- **Store-ready budget still applies** (see STORE-READY.md): pick the
  best-looking model that stays inside the mobile performance budget —
  sane poly counts, textures <= 2048px, GLB format, animations
  included when the asset needs to move. Best-looking AND fast; if a
  model is gorgeous but sinks a phone, optimize it or pick the next
  best.
- When you swap in a better model, say so in your PR: what asset,
  from where, what license.

## MUSIC & SOUND LAW (owner, 2026-10-14)

**Every game needs home-page music, in-game music, and game sounds.**
Menu music (calm, looped), a distinct in-game track (energy matched
to the game), and sound effects for the core actions. Original audio
only — procedural WebAudio is the house method (no files, no
copyright possible; the no-copyrights law covers sound too). Mute
toggle on every game, persisted; audio starts on first interaction.
A game is not DONE without all three. Full text: ASSET-LAW.md
Part II.

## LANDSCAPE LAW (owner, 2026-10-15)
**PORTRAIT RULE (owner, 2026-10-15 — read before touching landscape):** the landscape presentation is built INTO each sports game file only. It must NEVER be injected from a shared script (engage.js loads on the entrance + every casino page — a landscape block there rotated the owner's entrance sideways and broke the app, removed in the portrait fix). The entrance (index.html), the dev hub (sports.html), and ALL casino pages are NOT games and stay PORTRAIT, exactly as designed.

**Every game starts in landscape, locked, already loaded. There is
no "rotate your device" sign and no portrait state.** In portrait the
stage presents rotated to landscape, the renderer sizes to the
landscape box, touch input is remapped to the rotated frame, and the
first tap requests fullscreen + an orientation lock where the
platform allows it. If your game shows a turn sign, it breaks the
law. Full text: STORE-READY.md, checklist item 2.

## STORE-READY RULE (owner, 2026-10-14)

Every game here is headed for the Apple App Store and Google Play.
**All games must be built Apple/Google store-app ready for iPhone and
Android** — phone performance first, landscape fit, touch-first,
fully bundled and offline, on-device saves only. The full checklist is
in **STORE-READY.md**; a game that breaks it is not done.

## How to claim

1. Add a row under **Board** with status `CLAIMED`: the task, your bot id,
   your branch, and the time (CDT). Push it *before* you start building.
2. When the work ships, flip your row to `DONE` and add the PR number and
   merge sha.
3. If you stop or abandon a task, mark it `RELEASED` so another bot can
   take it cleanly.
4. Every PR description names the bot that did the work.

Statuses: `CLAIMED` = in progress · `DONE` = merged · `RELEASED` = free to take

## Board
| CLAIMED | Monster truck life: walking crowds, trees, waving flags | Muse algre141 | monstertruck-life | | 2026-10-16 01:05 CDT |
| CLAIMED | Monster truck speed + mega jump ramp (faster truck, long ramp for big air) | Muse algre141 | monstertruck-speed | | 2026-10-16 00:55 CDT |
| CLAIMED | Monster truck z-fighting fix: outer.y -3, camera near 0.5, dirt anisotropy | Muse algre141 | monstertruck-zfight | | 2026-10-15 23:30 CDT |
| CLAIMED | Monster truck fixes: mute button clickable, bigger ramps for 4x trucks | Muse algre141 | monstertruck-fixes2 | | 2026-10-15 22:15 CDT |
| DONE | Soccer TEAM camera (apexsoccer.html): true broadcast follow-cam — sees most of field, tightly follows ball | Muse Dash | soccer-teamcam-dash | PR #297, main b2fbec08 | 2026-10-15 21:58 CDT |
| CLAIMED | Monster truck mute button (HUD sound toggle) | Muse algre141 | monstertruck-mute | | 2026-10-15 21:42 CDT |
| CLAIMED | Monster truck camera: move out/up (48 back, 24 up), look ahead, more responsive follow | Muse algre141 | monstertruck-camera | | 2026-10-15 21:40 CDT |
| CLAIMED | Monster truck rally: fixed ramp pile-up (spread doubles), daytime always, 4x bigger trucks, rally car formations, career mode, overhead intro with 'GO RALLY!' | Muse algre141 | monstertruck-rally | | 2026-10-15 20:15 CDT |
| CLAIMED | Monster Jam stadium arena: 30x bigger (4000x4000), jump-to-jump doubles in center, colored ramps (red/blue/black) with white edges | Muse algre141 | monstertruck-arena | | 2026-10-15 16:20 CDT |
| CLAIMED | Monster truck hotfix: restore missing landscape-law JS (touch remap, fitLandscape, fullscreen lock) regressed by PR #240 | Muse algre141 | monstertruck-hotfix | | 2026-10-15 14:34 CDT |
| DONE | Monster truck: studio-style redesign (big aggressive tires, wide -offset, lift-kit suspension, exhaust stacks with smoke on gas, Apex Arcade bed logos) + AI truck roster (different colors, pickup + SUV styles) | Muse algre141 | monstertruck-redesign-v2 | PR #240 | 2026-10-15 14:10 CDT |

| CLAIMED | Exotic Racer Club mockup-faithful rebuild (apexracer.html): replace CC0 low-poly body with smooth procedural supercar matching the approved fleet mockup (quad round headlights, sculpted bumper, sleek curves); all 8 cars | Muse Cruz.inc | apexracer-mockup | — | 2026-10-15 12:35 CDT |
| DONE | Exotic Racer Club CC0 car model swap (apexracer.html): box-built bodies replaced with Teh_Bucket 'Sports Car (lowpoly)' CC0 wedge-supercar model (OpenGameArt, CC0 1.0); all 8 cars + traffic, glossy paint, silver 5-spokes, wing/intakes/glasshouse; QA 8+/10 all points, 0 page errors | Muse Cruz.inc | apexracer-cc0car | PR #219, main 70fd504 | 2026-10-15 12:20 CDT |
| Status | Task | Bot | Branch | PR / sha | Updated |
| CLAIMED | F1 reference upgrade (apexf1.html): 10 teams with unique glossy liveries, fictional drivers, tire sidewall stripes, start gantry, barriers, Apex Arcade signage; revert PR #266 duplicates in apexracer.html | Muse main | f1-ref-upgrade-v2 | | 2026-10-15 21:11 CDT |
| DONE | Track & Field upright run: bone animation now relative to rest pose (cached at load), no more overwriting | Muse Modern Plus | trackfield-upright | PR #325, main b3a3fcad | 2026-10-16 01:30 CDT |
| DONE | Track & Field natural run: toned down bone animation (thigh 35deg, knee 95deg max, natural cadence), bone reset when idle | Muse Modern Plus | trackfield-natural-run | PR #320, main 5884307e | 2026-10-16 01:05 CDT |
| DONE | Track & Field realistic humans: re-enabled Quaternius GLBs, procedural bone animation (thigh/calf/arms/pelvis) since GLB has no run clip | Muse Modern Plus | trackfield-human-realistic | PR #309, main 7a6a46a8 | 2026-10-15 23:50 CDT |
| DONE | Track & Field legs + stadium: disabled GLB upgrade (run clips missing -> idle), all procedural with boosted animation; added 4 corner stands for complete bowl | Muse Modern Plus | trackfield-legs-stadium | PR #304, main 12b8cb16 | 2026-10-15 23:25 CDT |
| DONE | Track & Field real track + bigger legs: ground plane grass->dark, track wider (7.5m) and brighter blue, leg swing +15%, knee bend 2.2rad, GLB speed 2.4x | Muse Modern Plus | trackfield-real-track | PR #296, main d86de93d | 2026-10-15 21:40 CDT |
| DONE | Landscape law for all games: monstertruck + f1 full pattern; trackfield already done by owner; 19 casino games via engage.js (CSS rotate + lock) | Muse algre141 | landscape-all | PR #203, main cfdc59c6 | 2026-10-15 09:51 CDT |
| DONE | Track & Field human run animation + tap-to-run exhaustion: biomechanical run cycle (hip drive, knee lift, arm pump, torso lean), TAP button with auto-alternating strides, exhaustion at 0 stamina (30% speed cap, red button, recover to 30) | Muse Modern Plus | trackfield-human-run | PR #279, main 0f33ea13 | 2026-10-15 21:15 CDT |
| DONE | Track & Field toggle-stick controls: replaced STRIDE L/R buttons with stick + ACTION button | Muse Modern Plus | trackfield-stick | PR #212, main 1b931f8b | 2026-10-15 11:05 CDT |
| DONE | Monster truck pickup rebuild: pickup body (hood/cab/bed, open wheels), bigger tires, steering fix (left=left), 6x arena, 12 bigger ramps + lip pop, 2 AI rivals jumping — 30/30 tests | Muse algre141 | mt-pickup | PR #199, main 41d8e795 | 2026-10-15 08:35 CDT |
| DONE | Track & Field landscape law (apextrackfield.html): removed rotate hint, portrait rotates stage to landscape, fullscreen+lock on first tap | Muse Modern Plus | trackfield-landscape | PR #201, main 485a4b62 | 2026-10-15 08:45 CDT |
|---|---|---|---|---|---|
| DONE | FIX LIST system: owner's complaints become permanent tests in tools/game-check/fixes/<game>.mjs, run by the game check after every merge (✅/❌ per complaint in the report + results.json); rule posted (CLAIMS FIX LIST + AGENTS). First test: Track & Field touch controls during a race (✅). Track & Field check now starts a real race (#grid button) | Claude (owner's session) | fix-list-tests | this PR | 2026-10-15 23:50 CDT |
| DONE | Dev hub lineup v2 (owner's ask): every game runs LIVE in its box as you scroll to it (2 at a time so phones stay fast), each box shows the game at real phone-landscape size scaled down (looks like the phone, just smaller). Track & Field: touch controls (stick + ACTION) now appear on phones even if audio start-up fails inside the hub frame - small change in apextrackfield.html firstGesture only, save keys untouched | Claude (owner's session) | devhub-autoplay-tf-touch | this PR | 2026-10-15 20:20 CDT |
| CLAIMED | Soccer player agility (apexsoccer.html): sprint lean, snappier turns/accel | Muse Dash | soccer-agility-dash3 | - | 2026-10-15 17:15 CDT |
| DONE | Dev hub LIVE LINEUP (sports.html, owner's ask): ALL TITLES grid now renders as one column of playable landscape screens - tap to play in place (one game at a time to keep phones fast), full-screen button with an exit X, up/down arrows to reorder (saved on the device, new key apexDevLineupOrder), a game's own Back button closes its screen. Built from the .gcard cards, so registering a game is unchanged. Hub page itself stays portrait (PORTRAIT RULE). Tested on a 390x844 touch viewport: inline play, full screen, reorder persists after reload, zero console errors | Claude (owner's session) | devhub-live-lineup | this PR | 2026-10-15 17:55 CDT |
| CLAIMED | Soccer clean kits (apexsoccer.html): fix white shader-stripe artifact on dark shorts — COMETS + GK shorts to white | Muse Dash | soccer-players-dash2 | - | 2026-10-15 14:52 CDT |
| DONE | PROOF RULE posted: nothing the owner can see is 'fixed/done/live' until seen in the game check pictures; believe the owner's screenshot over your code | Claude (owner's reviewer) | proof-rule-claude | this PR | 2026-10-15 14:45 CDT |
| DONE | F1 car fixes (apexf1.html): (1) cars sat sideways on diagonal stretches - the facing formula was mirrored; now aimed down the track + turned by headAngle (fixes AI cars too); (2) the 'stick' poking out sideways was the sidepods, rotated a quarter turn - now run along the car beside the cockpit. Verified with game check pictures | Claude (owner's reviewer) | f1-car-facing-claude | this PR | 2026-10-15 14:40 CDT |
| DONE | Soccer start screen + camera tracking (apexsoccer.html): compact start card so KICK OFF is visible without scrolling in portrait-rotated mode; cameras follow the ball sideline to sideline (kx 0.62->0.95, wider clamp) | Muse Dash | soccer-startcam-dash | PR #238, main c49bc760 | 2026-10-15 13:55 CDT |
| DONE | Soccer gameplay fixes (apexsoccer.html): fix phantom fouls causing weird midfield free kicks, fix touch buttons cut off in portrait-rotated mode, better camera views | Muse Dash | soccer-fixes-dash | PR #230, main 47bb44fb | 2026-10-15 13:20 CDT |
| DONE | Patch robot for BIG FILES (tools/patch-robot + workflow): Muses push a small patches/*.patch, or bigfiles/<path>/part-NNN + DONE, or pieces/request-*.txt; the robot applies / joins / cuts on the same branch. Strict: a patch only goes in if it fits exactly, else patches/<name>.result.txt says why | Claude (owner's reviewer) | patch-robot-claude | this PR | 2026-10-15 13:05 CDT |
| DONE | Game checker: tools/game-check plays every Game Development title like a phone (sideways + upright) after each merge to main and posts a picture report to the game-checks branch. FAIL = black/blank screen, missing files, casino words, rotate sign; CHECK = menu off-screen, no gameplay, frozen, script errors | Claude (owner's reviewer) | game-checker-claude | this PR | 2026-10-15 11:55 CDT |
| DONE | Track & Field daylight restyle (apextrackfield.html): bright daytime look like reference photos — blue sky, blue track, starting blocks, lane numbers | Muse Modern Plus | trackfield-daylight | PR #196, main 0b6a7086 | 2026-10-15 08:25 CDT |
| DONE | Exotic Racer Club car visual rebuild (apexracer.html): 8 distinct modern supercars, integrated aero, dark tinted glass, no floating parts; drift + traffic avoidance verified; screenshot-verified | Muse Cruz.inc | apexracer-cars2 | #207 | 2026-10-15 09:45 CDT |
| DONE | Monster truck realism pass 2: sculpted arch fenders, deep-dish rims + lug nuts, hero spotlight, rim light, grille surround + valance, mud — 28/28 checks, screenshots verified | Muse algre141 | mt-realism3 | PR #189, main a1a855bb | 2026-10-15 07:46 CDT |
| DONE | Exotic Racer Club realism upgrade (apexracer.html): realistic supercar bodies/wheels/liveries, richer trackside detail, Apex Arcade branding, menu + in-game music, friend-code multiplayer, sports.html registration | Muse Cruz.inc | apexracer-ship | PR #162, main 2e842ce4 | 2026-10-15 00:34 CDT |
| DONE | Soccer athlete-load hardening (apexsoccer.html): preload athlete GLBs + retry initAthletes 3x with backoff so the realistic athletes reliably replace the fallback | Muse Dash | soccer-athload-dash | PR #191, main e85a54c8 | 2026-10-15 07:50 CDT |
| DONE | Monster truck realism pass + thumbsticks: image-based lighting, textured paint/tires/dirt with tire tracks, suspension/drivetrain detail, vignette, dual analog sticks (left steers, right drives/brakes) | Muse algre141 | mt-realism2 | PR #177, main d84a26f | 2026-10-15 02:05 CDT (stamped by the arcade reviewer for Muse after GitHub 403s) |
| DONE | Track & Field view fix (apextrackfield.html): landscape race view is black/broken, fix camera framing + scene lighting so athletes and track are clearly visible | Muse Modern Plus | trackfield-viewfix | PR #187 | 2026-10-15 07:35 CDT |
| DONE | Soccer realism + stadium fix (apexsoccer.html): stands set back off the pitch, goals with nets + goalies, realistic proportioned players/kits, Apex Arcade branding kept | Muse Dash | soccer-realism-dash | PR #174, main 5f812a71 | 2026-10-15 01:27 CDT |
| DONE | Track & Field retest #1 (apextrackfield.html): full playthrough, career crash fix, PLAYER NICKNAME law, Okafor->Osei rename, UE5 polish (rim light + vignette); 489/489 tests, lag + store-ready re-verified | Muse Modern Plus | trackfield-retest1 | PR #166, main 946a4686 | 2026-10-15 01:13 CDT |
| DONE | Monster truck mega upgrade: 3x arena, 4800-fan grandstands, 10 bigger ramps, detailed truck, 28/28 checks | Muse algre141 | mt-mega-arena2 | PR #159, main 4f366aa5 | 2026-10-15 00:14 CDT |
| DONE | Monster truck retest round 3: full loop, 27/27 checks, night-sky starfield | Muse algre141 | mt-retest3-fix | PR #153, main 069ba8db | 2026-10-14 23:52 CDT |
| DONE | F1 store-ready: back button to sports.html, sports.html registration (tab+panel+gcard) | Muse main | f1-store-ready2 | PR #147, main 88130284 | 2026-10-14 23:25 CDT |
| DONE | Track & Field 3D rebuild (apextrackfield.html v2): Three.js realistic graphics, Quaternius athletes, 3D stadium; career/tournament/free-play + Apex Games pageantry; music & sound law (menu/in-game music, mute); tested bugs/lag/store-ready | Muse Modern Plus | apextrackfield-3d | PR #155 (b15512bd) + v2.1 PR #158 (7f5b1e8f) | 2026-10-15 00:12 CDT |
| DONE | Monster truck STORE-READY pass: phone light path (pixel ratio <=1.5, shadows off on touch), offline audit | Muse algre141 | mt-store-ready | PR #131, main f0ff2047 | 2026-10-14 23:10 CDT |
| DONE | Monster truck retest round 2: retest with key-hold driving, 19/19 logic checks, game-over ground-snap fix | Muse algre141 | monstertruck-retest-fix | PR #118, main ebec37aa | 2026-10-14 22:46 CDT |
| DONE | F1 UE5 visual pass + retest fixes: ACES tone mapping, sky dome, tire smoke/dust particles, asphalt grain, vignette, P20 HUD fix, landscape touch layout | Muse main | f1-visual-retest-batch | PR #112, main 7d44478d | 2026-10-14 22:32 CDT |
| DONE | F1 mobile pass: fix touch/HUD overlaps (minimap+ERS bar), bigger DRS/ERS/PIT/CAM buttons, rotate hint, safe-area insets | Muse main | f1-mobile-pass | PR #102, main 714dfbfb | 2026-10-14 22:12 CDT |
| DONE | F1 playtest fix batch: desktop DRS/PIT/CAM keys, 5s start no-contact grace, SKIP QUALI truly P12, grid-accurate HUD position, bigger minimap dots, keyboard docs | Muse main | f1-playtest-fixes | PR #92, main cf525630 | 2026-10-14 21:58 CDT |
| DONE | F1 Apex Arcade sponsor branding: trackside banner boards + start gantry + menu splash (casino bot covers hockey/soccer/baseball/flight) | Muse main | f1-sponsor-final | PR #88, main df9063e3 | 2026-10-14 21:45 CDT |
| DONE | Monster truck v1 playtest fixes: play the game, log issues, fix them | Muse algre141 | monstertruck-fixes | PR #95, main d6f9538b | 2026-10-14 22:01 CDT |
| DONE | Monster truck game (apexmonstertruck.html): 3D freestyle arena — crush cars, ramp jumps, score attack | Muse algre141 | apex-monstertruck | PR #82, main a234df86 | 2026-10-14 21:34 CDT |
| DONE | F1 menu fix: updateForecast TypeError killed initMenus, all menu buttons dead | Muse main | f1-menu-fix | PR #71, main a93545b8 | 2026-10-14 21:20 CDT |
| DONE | F1 Apex Racing: realistic F1 game — real rules (DRS/tires/pits/points), real tracks, crowds, cheat-y AI, dynamic weather, career mode + friend-code multiplayer | Muse main | f1-apex-racing | PR #63, main de763763 | 2026-10-14 20:55 CDT |
| DONE | Hockey arena fix: stands out of rink, realistic ice, pro rules, crowd audio (cheer/boo/goal swell), better cameras + landscape first-load lag & oversize fix | Muse main | hockey-arena-final | PR #46, main 3de86ba5 | 2026-10-14 19:38 CDT |
| DONE | Hosting move: repo public again, GitHub Pages live — every merge to main auto-deploys | owner + Muse main | — | main @ 20871fb3 era | 2026-10-14 15:28 CDT |
| DONE | Layout fix: all four Apex games fill the screen after rotation + hockey framing/lighting | Muse main (casino) | layout-fix | PR #24 | 2026-10-14 14:33 CDT |
| DONE | Face v12h (visits/scans/approach) + commentary cast2 (true stats) + soccer v4 (goals/keepers/scoring/teammates) | Muse main (casino) | face-v12h-cast2-soccer-v4 | PR #25, main 40ee0b8a | 2026-10-14 14:33 CDT |
| DONE | Face v12i (no hole, she keeps off the door side) + hoops v13 (rim/board/swish sound, through-the-net, FT form, locomotion) | Muse main (casino) | face-v12i-hoops-v13 | PR #26, main 20871fb3 | 2026-10-14 14:47 CDT |
| DONE | Face v12j (baked portrait — lag fix, down-look surveillance, anger glare) + hoops v14 (rotation/menu perf, real steals & blocks, run-out inbounds) | Muse main (casino) | face-v12j-hoops-v14 | PR #27, main d70d3a4c | 2026-10-14 15:52 CDT |
| DONE | This claims board + the cross-check-and-claim rule | Muse main (casino) | claims-board | this PR | 2026-10-14 16:05 CDT |
| DONE | Door hold on/off switch: persistent toggle on hallway 1 - OFF = plain tap on the 0 (no hold), ON = hold-then-tap as now | Muse main (casino) | door-hold-switch | PR #30, main 6cd181a5 | 2026-10-14 17:22 CDT |
| DONE | Hockey career mode: menu career options, star player showcase on menu, friend-code matches (async) | Muse main (casino) | hockey-career | PR #33, main 64cab4eb | 2026-10-14 17:40 CDT |
| DONE | Hoops v15: agility + realistic jumps, reach-in steal with fouls, jump swat block, smarter AI, clearer player visuals | Muse main (casino) | hoops-v15 | PR #37, main 89b1c15a | 2026-10-14 19:32 CDT |
| DONE | Hoops perf auto-tuner: FPS watchdog steps graphics down until smooth, one-tap report of changes, persists per phone | Muse main (casino) | hoops-perf-tuner | PR #43, main 52d66264 | 2026-10-14 19:34 CDT |
| DONE | Hoops crowd people (clap/cheer/signs/high-fives/the wave) + 2K-style Apex Arcade sponsor presentation | Muse main (casino) | hoops-crowd-2k | PR #47, main 6c343e81 | 2026-10-14 19:55 CDT |
| DONE | Soccer playability hotfix: kickoff pass to nearest mid, AI tackling, defender pace 8.9, keeper saves, idle-player AI assist | Muse algre141 | soccer-playability | PR #41, main 5e32edee | 2026-10-14 19:34 CDT |
| DONE | Hoops v18: ball-tracking reach-in steal (arm aims at the ball, contact fouls), strategic AI shot discipline (no half-court 3 spam), difficulty tiers Rookie/Pro/All-Star/Hall of Fame | Muse main (casino) | hoops-v18 | PR #51, main 37d0a857 | 2026-10-14 19:57 CDT |
| DONE | Vault reset: locked-out owner gets an erase-and-start-new-vault flow on the PIN screen (old contents stay crypto-locked, wipe is total) | Muse main (casino) | vault-reset | PR #53, main d667f9ff | 2026-10-14 20:05 CDT |
| DONE | Hoops v19: bigger court (+15%) with arena/stands rebuilt around it, denser crowd + upper-bowl fans + walkers in the aisles | Muse main (casino) | hoops-v19 | PR #56, main 0edfd835 | 2026-10-14 20:16 CDT |
| DONE | Hoops v20: crowd PRESENCE pass (bigger/denser fans, signs up in play, livelier idle, faster+more walkers incl. stairs, wave fires more) + DUNK button (tap dunk, double-tap layup) | Muse main (casino) | hoops-v20 | PR #60, main 00a35670 | 2026-10-14 20:32 CDT |
| DONE | THE SPLIT: new Apex Arcade Game Development page (sports only, game tabs) + red-circle GAME DEVELOPMENT tab on the entrance; casino sealed behind the 0 - sports removed from hallways/floor/registry/games.json, back-links retargeted, casino wording cut on the sports side | Muse main (casino) | split-gamedev | PR #64, main cb4897ba | 2026-10-14 20:58 CDT |
| DONE | Post the owner's rule on the repo: new built games go on the Game Development page (sports.html), NOT the casino floor - notice in CLAIMS.md + README + sports.html (claim row from PR #67 was dropped in a parallel board rewrite; work shipped in PR #68) | Muse main (casino) | gamedev-notice | PR #68, main eddbb068 | 2026-10-14 21:10 CDT |
| DONE | Dev hub redo (lead-architect pass): sports.html v2 - whole roster visible (tabs + ALL TITLES grid, accent cards, icon fallbacks) + hoops27 v21 wires the dead Back button home to sports.html | Muse main (casino) | devhub-v2 + hoops-v21 | PRs #73 (hub, main b3eb53f2) + #74 (hoops v21, main b48998af) | 2026-10-14 21:24 CDT |
| DONE | Apex Arcade is ALWAYS the sponsor: sponsorship pass across the Game Development titles - hockey, soccer, flight shipped in PR #80 (arena signage, surface logos, PRESENTS splashes); baseball completed by the baseball ship (PR #84): sponsor boards on the outfield wall + APEX ARCADE menu branding. 27Hoops sponsored since v17. ALL TITLES DONE | Muse main (casino) | sponsor-pass | PR #80, main 1df0cee6 + PR #84 | 2026-10-14 21:52 CDT |
| DONE | Baseball (apexbaseball) human-look + rules pass: full playtest, player look/movement fixes, baseball rules verified, Apex Arcade sponsor branding | Muse algre141 | baseball-ship | PR #84, main c9b542cf | 2026-10-14 21:36 CDT |
| DONE | Post the owner's store-ready rule on the repo: every game must be Apple/Google store-app ready (iPhone + Android) - STORE-READY.md checklist + CLAIMS.md + README pointers (claim row lost in a parallel board rewrite; work shipped in PR #98) | Muse main (casino) | store-ready-doc | PR #98, main 92be3fbf | 2026-10-14 22:06 CDT |
| DONE | Soccer (apexsoccer) human-look pass: 1.82m athletes, soccer kits, real ball size, yellow/red cards + sendings-off, penalty kicks | Muse algre141 | soccer-ship | PR #96, main f623b7bb | 2026-10-14 22:05 CDT |
| DONE | Post the owner's quality standard on the repo: 'retest' = play it, find issues, fix them; UE5-style quality bar; mobile-app graphics always (into STORE-READY.md) | Muse main (casino) | quality-std | PR #105, main 7d99021f | 2026-10-14 22:17 CDT |
| DONE | Soccer (apexsoccer) retest: sent-off player handling fixes, ACES tone mapping, PCFSoft shadows, 2048 shadow maps | Muse algre141 | soccer-retest-ship | PR #108, main 858da064 | 2026-10-14 22:18 CDT |
| DONE | Hockey retest fixes (owner playtest): sticks planted on the ice (were hand-bone crutches in the air), helmets + long-sleeve kits (players look like players), crouch/skating stance with stride rock, crowd made people-sized and bright (stands read full) - retested by playing, screenshots before/after | Muse main (casino) | hockey-look-fix | PR #119, main aa9f21ff | 2026-10-14 22:47 CDT |
| DONE | Post the owner's assets rule on the repo: use the best realistic FREE models/assets (into CLAIMS.md + STORE-READY.md) | Muse main (casino) | assets-rule | PR #124, main 27ff4764 | 2026-10-14 22:51 CDT |
| DONE | README: state plainly that every Game Development title is a full 3D game (and refresh the sports title list) | Muse main (casino) | readme-3d-line | PR #129, main f0bcaf69 | 2026-10-14 23:02 CDT |
| DONE | Post the LAW OF CREATION: the owner's approved free-asset sources list (Quaternius/Kenney/Poly Pizza/Poly Haven/ambientCG/KayKit/OpenGameArt-CC0) + realistic style rule (models and clothing match the game being mimicked) - ASSET-LAW.md + CLAIMS.md + STORE-READY.md | Muse main (casino) | asset-law | PR #134, main e51e6496 | 2026-10-14 23:09 CDT |
| DONE | Add the owner's no-copyrights clause to the law of creation (ASSET-LAW.md + CLAIMS.md) | Muse main (casino) | nocopyright-clause | PR #143, main 44a2147e | 2026-10-14 23:18 CDT |
| DONE | Soccer Retest #1: ball ground indicator, mobile TEAM camera default | Muse algre141 | soccer-r1-ship | PR #116, main 173732e4 | 2026-10-14 22:35 CDT |
| DONE | Baseball Retest #1: UE5 visual polish (ACES tone mapping, PCFSoft shadows, sRGB) | Muse algre141 | baseball-r1-ship | PR #137, main 72268e26 | 2026-10-14 23:05 CDT |
| DONE | Add the owner's music & sound law: every game needs home-page music, in-game music and game sounds (ASSET-LAW.md + CLAIMS.md + STORE-READY.md) | Muse main (casino) | music-law | PR #150, main 2f3c587a | 2026-10-14 23:38 CDT |
| DONE | Hockey gameplay retest fixes (owner playtest #2): passes connect (receiver skates to the pass, stick release, no self-re-grab, interceptions need a slow puck), real teammate support (slot/far lane/points/trailer), pace calmed (cap 24, shots 82 max, calmer AI), crowd verified full from CLOSE view | Muse main (casino) | hockey-gameplay-fix | PR #172, main 65fff891 | 2026-10-15 01:22 CDT |
| DONE | Landscape-start law + build: every game starts in landscape, locked, already loaded - NO rotate sign. Law posted (PR #181); built into hockey/baseball/soccer/flight (PR #182: rotated stage in portrait, landscape-sized renderer, remapped touch, fullscreen+lock on first tap); 27Hoops already rotated via its shell + lock added, file restored in PR #183 after another worker removed it in a 'handoff' (see owner decision pending). F1/monstertruck/trackfield/racer follow under the law with their owners | Muse main (casino) | landscape-start | PR #182 + #183 | 2026-10-15 02:05 CDT |
| DONE | 27Hoops REMOVED from this repo (owner-confirmed 2026-10-15): the game was handed off to the Game-Development-Apex-Arcade repo (removal commit 6ff3d65 by another worker); Muse main's safety restore (PR #183/#185) reverted, hoops27.html + icon deleted, and the dev hub's basketball tab/panel/card removed so nothing links to a dead file. If the other repo goes live, the hub card can return pointing at it | Muse main (casino) | hoops-removed-final | - | 2026-10-15 02:10 CDT |
| DONE | TEAM NOTICE (owner, 2026-10-15): the Game-Development-Apex-Arcade repo is DELETED. Everything is built in THIS repo (18-Games-Casino) and every bot pulls work from here - this repo is the single source of truth. Do not build in side repos or hand games off elsewhere | Muse main (casino) | note-consolidation | - | 2026-10-15 08:08 CDT |
| DONE | Baseball Retest #3: CPU pitch camera fix, CPU whiff range, mound z-fighting | Muse algre141 | baseball-r3-ship | PR #208, main 36dd88b9 | 2026-10-15 10:15 CDT |
| DONE | Fix: owner's home-screen icon opened the STALE Netlify copy (pre-split build, no GAME DEVELOPMENT button). Deployed the full current main site (172 files) to Netlify - his existing icon now serves the current app on the same origin, vault/saves untouched. Verified live: gdTab present, sports.html + games 200 (Netlify deploy 6ad106b9) | Muse main (casino) | claim-netlify-mirror (PR #216) + stamp-netlify-mirror | - | 2026-10-15 12:03 CDT |
| DONE | Portrait fix: LANDSCAPE LAW injection REMOVED from engage.js (it had rotated the entrance + all casino pages since a7008f6). Fix PR #222 (engage.js cleaned, XP/wheel untouched, syntax-checked; PORTRAIT RULE posted in CLAIMS.md + STORE-READY.md). Harness-verified portrait: entrance upright, red circle tappable -> sports.html, Velvet 21 upright, zero errors. Live-verified BOTH origins (Pages + Netlify deploy 6ad10ac6): engage.js carries no orientation lock; gdTab present | Muse main (casino) | claim-portrait-fix (PR #221) + fix PR #222 + stamp-portrait-fix | 222 | 2026-10-15 12:19 CDT |
| DONE | Baseball Retest #4: visual strike zone frame for batters | Muse algre141 | baseball-r4-ship | PR #255, main ac053df2 | 2026-10-15 17:35 CDT |
| DONE | Baseball Retest #5: pitch trail for ball visibility | Muse algre141 | baseball-r5-ship | PR #258, main 3763e68c | 2026-10-15 19:55 CDT |
| DONE | Hockey broadcast-realism pass (apexhockey.html): TV broadcast camera tracking the puck, broadcast scorebug, player indicator ring + name tag, center-ice APEX logo + glossy ice, kit upgrade (jersey numbers, hockey pants, gloves). Owner's ask: match the presentation of his NHL broadcast video (original assets only, no NHL/EA IP) | Muse main (casino) | hockey-broadcast | PR #268 | 2026-10-15 20:36 CDT |
| DONE | Hockey players pass (apexhockey.html): the full-gear build from the owner's list — helmet v2 + visor, shoulder pads, shin guards, padded pants, name bars over numbers, chest crest; skating feel: banking into turns, speed crouch, ice-spray on hard stops. Completing the recommendation list the owner approved (broadcast pass shipped PR #268) | Muse main (casino) | hockey-players | PR #271 | 2026-10-15 20:48 CDT |
| DONE | Hockey kit corrections (owner): chest/waist tube REMOVED (PR #274); jerseys now HANG to mid-thigh with trim hem, back name/number plates hug the jersey, small front number beside the crest (PR #276) | Muse main (casino) | hockey-jersey | PR #276 | 2026-10-15 21:05 CDT |
| DONE | Hockey player v3 (apexhockey.html): rebuild the skater to the owner's reference-model blueprint — cage helmet, striped hockey socks, jersey waist + sleeve stripes, bigger cuffed gloves, pants side stripe, laced skate boots, shoulder numbers. Original parts only (no brand marks from the references) | Muse main (casino) | hockey-playerv3 | PR #283 | 2026-10-15 21:11 CDT |
| DONE | Racer landscape law (apexracer.html): visualViewport resize listener added via patch robot (portrait CSS, landscape sizing, touch remap, fullscreen+lock already present) | Muse algre141 | racer-landscape-v2 | PR #275, main 830f29ac | 2026-10-15 20:50 CDT |
| DONE | Hockey uniform system (apexhockey.html): match the owner's reference uniforms — shoulder yoke panel, collar ring, pants side stripes, accent-color gloves; helmets stay team-colored with the cage. Wolves/Sharks colors and career re-skins preserved | Muse main (casino) | hockey-uniforms | PR #288 | 2026-10-15 21:28 CDT |
| DONE | Hockey ONE-UNIFORM rebuild (apexhockey.html): the kit becomes paint on the rig via the outfit shader (jersey + yoke + waist stripes, pants, striped socks, gloves) — bolted-on clothing pieces (skirt, yoke cap, collar, bands, sock tubes) removed; helmet/cage/stick/blades/name plates stay as equipment | Muse main (casino) | hockey-uniform-puck | PR #293 | 2026-10-15 21:35 CDT |
| DONE | Hockey loose-puck fix (apexhockey.html): owner reports nobody grabs a loose puck when he is not moving — reproduce with a no-input probe, fix the cause, re-probe | Muse main (casino) | hockey-uniform-puck | PR #293 | 2026-10-15 21:35 CDT |
| CLAIMED | Hockey CONTROLS fix (apexhockey.html): portrait-held play gets its controls under the thumbs — stick at the visual bottom-left, buttons bottom-right (they rendered along the left edge of the rotated stage); stick axes re-verified in all four directions | Muse main (casino) | claim-hockey-rules2 | - | 2026-10-15 23:40 CDT |
| CLAIMED | Hockey KIT prints + helmet (apexhockey.html): name/number + crest printed INTO the jersey paint (no floating plates); helmet rebuilt (elongated shell, ear covers, fuller cage); deeper hockey stance | Muse main (casino) | claim-hockey-rules2 | - | 2026-10-15 23:40 CDT |
| CLAIMED | Hockey RULES + STRATEGY (apexhockey.html): penalties + power play (illegal checks to the box, 4v5), hybrid icing (race can waive it), offside with tag-up grace, line changes + stamina at whistles, breakout / cycle / point-shot / net-front strategy; idle puck carriers get stripped under pressure | Muse main (casino) | claim-hockey-rules2 | - | 2026-10-15 23:40 CDT |
| DONE | Baseball Retest #6: realism pass (day game, no menu dim, foul poles, batter light) | Muse algre141 | baseball-r6-ship | PR #314, main 86798697 | 2026-10-15 23:45 CDT |
| DONE | Hockey print/helmet micro-fix (apexhockey.html): back name/number print was MIRRORED (found while building the full-res model demo — flip the plate UV); helmet shell 0.66π → 0.58π so the face + cage read from the front | Muse main (casino) | hockey-print-fix | PR #317 | 2026-10-16 00:40 CDT |
