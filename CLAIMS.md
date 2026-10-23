# CLAIMS.md — who is doing what (READ THIS BEFORE WORKING)

**Owner's rule (2026-10-14):** every bot cross-checks this board, recent
commits, and open PRs BEFORE starting a task. Since the fresh start (2026-10-19) only G-jobs
exist - one row per open G-job, see FRESH START below.

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
- **Jobs** (since 2026-10-19) are G-jobs only: "NEW JOB G-NN ..." from the owner's board - see jobs/README.md. Read
  `looks/<game>.md`, do the one change, write jobs/G-NN.md, STOP.
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

## RACER RULING - CLOSED (owner, 2026-10-19)
The old 2026-10-16 freeze on apexracer.html is over. Exotic Racer is changed only through the owner's G-jobs.

## FRESH START (owner, 2026-10-19 2:15 PM)

**Every old J-job and every old claim is erased** (they live only in git history now). Don't finish, re-claim or
mention any J-number. Work ONLY on the G-job the owner sends you - see **jobs/README.md**.

While you work on a G-job, keep ONE row below (delete it when the owner 👍s): `| G-NN | window N | files you touch | branch |`.
Two Muses never touch the same file - if a file you need is in someone else's row, wait.

## Board
| G-242 | window 7 | tools/game-check/fixes/apexbaseball.mjs, checklists/apexbaseball.md, jobs/G-242.md, CLAIMS.md | test/g-242-apexbaseball |
| G-job | Window | Files | Branch |
|---|---|---|---|
| G-238 | window 7 | jobs/G-238.md, CLAIMS.md | test/g-238-apexbaseball |
| G-237 | window 1 | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs, looks/apexbaseball.md, jobs/G-237.md, CLAIMS.md | build/g-237-apexbaseball |
| G-232 | window 3 | apexflight.html, tools/game-check/fixes/apexflight.mjs, looks/apexflight.md, jobs/G-232.md | build/g-232-apexflight |
| G-141 | window 10 | tools/game-check/fixes/apextrackfield.mjs (tester- tests only), jobs/QUEUE.md, jobs/G-141.md | test/g-141-apextrackfield |
| G-145 | window 10 | tools/game-check/fixes/apextrackfield.mjs (tester- tests only), jobs/QUEUE.md, jobs/G-145.md | test/g-145-apextrackfield |
| G-229 | window 10 | jobs/QUEUE.md (window 4 tester-line tick only), jobs/G-229.md, CLAIMS.md | test/g-229-apextrackfield |
| G-226 | window 10 | jobs/QUEUE.md (window 4 tester-line ticks only), jobs/G-226.md, CLAIMS.md | test/g-226-apextrackfield |
| G-222 | window 1 | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs, looks/apexbaseball.md, jobs/G-222.md, CLAIMS.md | build/g-222-apexbaseball |
| G-227 | window 10 | tools/game-check/fixes/apextrackfield.mjs (tester- tests only), jobs/QUEUE.md, jobs/G-227.md, CLAIMS.md | test/g-227-apextrackfield |
| G-187 | window 10 | jobs/QUEUE.md (window 4 tester-line ticks only), jobs/G-187.md, CLAIMS.md | test/g-187-apextrackfield |
| G-183 | window 10 | tools/game-check/fixes/apextrackfield.mjs, jobs/QUEUE.md, jobs/G-183.md, CLAIMS.md | test/g-183-apextrackfield |
| G-184 | window 7 | tools/game-check/fixes/apexbaseball.mjs, jobs/QUEUE.md, jobs/G-184.md, CLAIMS.md | test/g-184-apexbaseball |
| G-229 | window 7 | tools/game-check/fixes/apexbaseball.mjs, checklists/apexbaseball.md, jobs/G-229.md, CLAIMS.md | test/g-229-apexbaseball |
| G-201 | window 7 | jobs/G-201.md, CLAIMS.md | test/g-201-apexbaseball |
| G-196 | window 7 | jobs/G-196.md, CLAIMS.md | test/g-196-apexbaseball |
| G-177 | window 7 | tools/game-check/fixes/apexbaseball.mjs, jobs/QUEUE.md, jobs/G-177.md, CLAIMS.md | test/g-177-apexbaseball |
| G-167 | window 1 | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs, looks/apexbaseball.md, jobs/G-167.md, CLAIMS.md | build/g-167-apexbaseball |
| G-151 | window 1 | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs, looks/apexbaseball.md, jobs/G-151.md, CLAIMS.md | build/g-151-apexbaseball |
| G-147 | window 1 | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs, looks/apexbaseball.md, jobs/G-146.md, CLAIMS.md | build/g-146-apexbaseball |
| G-144 | window 1 | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs, looks/apexbaseball.md, jobs/G-144.md, CLAIMS.md | build/g-144-apexbaseball |
| G-134 | window 1 | tools/game-check/fixes/apexbaseball.mjs, jobs/G-134.md, CLAIMS.md | build/g-134-apexbaseball |
| G-116 | window 7 | tools/game-check/fixes/apexbaseball.mjs, jobs/QUEUE.md, jobs/G-116.md, CLAIMS.md | test/g-111-apexbaseball |
| G-87 | window 1 | tools/game-check/fixes/apexbaseball.mjs, jobs/QUEUE.md, jobs/G-87.md, CLAIMS.md | test/g-87 |
| G-85 | window main | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs | g-85-perf-sticktests |
| G-82 | window main | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs | g-82-input-ui-404 |
| G-79 | window main | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs | g-79-loading-screen |
| G-08 | window main | apexbaseball.html, tools/game-check/fixes/apexbaseball.mjs | g-08-baseball-friend |
| G-13 | window main | tools/game-check/fixes/apexbaseball.mjs | g-13-baseball-play-tests |
| G-36 | window main | apexbaseball.html | g-36-baseball-kits |
| G-17 | window 3 | apexflight.html (freeze check), jobs/G-17.md | g-17-flight-freeze |
| owner-direct Vanta GT build (owner greenlit 2026-10-21) | window 1 | apexracer.html | vanta-gt-build |
| G-53 | window 3 | apexflight.html, tools/game-check/fixes/apexflight.mjs, jobs/G-53.md | g-53-flight-modes |
| G-69 | window 3 | apexflight.html, jobs/G-69.md | g-69-reality-hook |
| G-39 | window main | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, LESSONS.md | g-39-relay-baton-v2 |
| G-43 | window main | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, LESSONS.md | g-43-pole-vault |
| G-56 | window main | tools/game-check/fixes/apextrackfield.mjs (tester- tests only), jobs/QUEUE.md, jobs/G-56.md | test/g-56-trackfield-tester |
| G-105 | window main | tools/game-check/fixes/apextrackfield.mjs (tester- tests only), jobs/QUEUE.md, jobs/G-105.md | test/g-105-apextrackfield |
| G-122 | window 4 | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, looks/apextrackfield.md, jobs/G-122.md, CLAIMS.md, LESSONS.md | build/g-122-apextrackfield - DONE, PR #1010 merged 15af2212 |
| G-122 ROUND 1 | window 4 | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, looks/apextrackfield.md | build/g-122-apextrackfield - DONE, PR #1058 merged 70a92359 |
| G-139 | window 4 | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, looks/apextrackfield.md | build/g-139-apextrackfield - DONE round 1, PR #1085 merged 27f8f56b (round 0: PR #1078 fa2600ba) |
| G-152 | window 4 | jobs/G-152.md | build/g-152-apextrackfield - NO CHANGE, duplicate of G-122 round 1 (PR #1058) |
| G-154 | window 4 | jobs/G-154.md | build/g-154-apextrackfield - NO CHANGE, duplicate of G-83 (PR #879) |
| G-156 | window 4 | jobs/G-156.md | build/g-156-apextrackfield - NO CHANGE, duplicate of G-83 (PR #879) |
| G-160 | window 4 | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, looks/apextrackfield.md | build/g-160-apextrackfield - DONE, PR #1109 merged 94c67f94 |
| G-165 | window 4 | jobs/G-165.md | build/g-165-apextrackfield - NO CHANGE, duplicate of G-160 (PR #1109) |
| G-168 | window 4 | jobs/G-168.md | build/g-168-apextrackfield - NO CHANGE, duplicate of G-160 (PR #1109) |
| G-169 | window 4 | tools/game-check/fixes/apextrackfield.mjs, jobs/G-169.md | build/g-169-apextrackfield - DONE PR #1127 (8adefac5): guard never-g-169-p1 added for the one-board hurdle point; game fix shipped as G-160 |
| G-171 | window 4 | - | renamed G-172, G-173, then G-174 by the Mac (2026-10-22) - final report jobs/G-174.md |
| G-173 | window 4 | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, looks/apextrackfield.md, jobs/G-173.md | build/g-171-apextrackfield - DONE PR #1137 (4155bef2): ?test=<event id> test link + hurdles countdown framing; play test play-test-link-starts-the-event |
| G-174 | window 4 | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, looks/apextrackfield.md, jobs/G-174.md | build/g-171-apextrackfield - DONE PR #1137 (4155bef2): ?test= test link; rounds 1-2 DONE PR #1181 (7aed11ab): hurdles face the runner (dot -1.00) + NEVER line + never-g-174-p1 |
| G-193 | window 4 | apextrackfield.html, tools/game-check/fixes/apextrackfield.mjs, jobs/G-193.md | build/g-193-apextrackfield - DONE PR #1185 (4da0c8a5): 10000m results follow the crossing order; tester-10000m-results-match-crossing passes | Round 1 DONE PR #1245 (0469d092): relay PASS works from the zone start (receiver checks up 0.55->0.30, reach 6->8m, fumble cap 3.2->6.0) + never-g-193-p1 + NEVER line + owner screenshot |

| G-89 | window 3 | apexflight.html, models/apex-jet/apexJet.js, models/apex-jet/flightModel.js, jobs/G-89.md | g-89-jet-game |
| G-90 | window 3 | apexflight.html, tools/game-check/fixes/apexflight.mjs, jobs/G-90.md | build/g-90-jet-controls |
| G-115 | window 3 | apexflight.html, looks/apexflight.md, jobs/G-115.md | build/g-115-apexflight |
| G-116 | window 3 | apexflight.html, jobs/G-116.md | build/g-116-apexflight |
| G-117 | window 3 | apexflight.html, tools/game-check/fixes/apexflight.mjs, looks/apexflight.md, jobs/G-117.md | build/g-117-apexflight |
| G-121 | window 3 | apexflight.html, tools/game-check/fixes/apexflight.mjs, looks/apexflight.md, jobs/G-121.md | build/g-121-apexflight |
| G-125 | window main | tools/game-check/fixes/apextrackfield.mjs (tester- tests only), jobs/QUEUE.md, jobs/G-125.md | test/g-125-apextrackfield |
| G-121 | window 3 | apexflight.html, tools/game-check/fixes/apexflight.mjs, looks/apexflight.md, jobs/G-121.md | build/g-121-fix1-apexflight |
| G-132 | window 3 | apexflight.html, tools/game-check/fixes/apexflight.mjs, looks/apexflight.md, jobs/G-132.md | build/g-132-apexflight |
| G-132 | window 3 | apexflight.html, tools/game-check/fixes/apexflight.mjs, jobs/G-132.md | build/g-132-fix1-apexflight |
| G-176 | window 6 | apexracer.html, tools/game-check/fixes/apexracer.mjs, looks/apexracer.md, jobs/G-176.md | build/g-163-wrap-fix |
| G-176 fix 1 | window 6 | jobs/G-176.md, looks/apexracer.md, tools/game-check/fixes/apexracer.mjs | report/g-176-fix-window6 |
| G-179 | window 6 | looks/apexracer.md, tools/game-check/fixes/apexracer.mjs, jobs/G-179.md | build/g-179-apexracer |
| G-206 | window 6 | apexracer.html, tools/game-check/fixes/apexracer.mjs, looks/apexracer.md, jobs/G-206.md | build/g-206-apexracer |
| G-225 | window 10 | jobs/QUEUE.md (window 4 tester-line tick only), jobs/G-225.md, CLAIMS.md | test/g-225-apextrackfield |
| G-207 | window 6 | apexracer.html, tools/game-check/fixes/apexracer.mjs, looks/apexracer.md, jobs/G-207.md | build/g-207-apexracer |
| G-207 fix 1 | window 6 | apexracer.html, tools/game-check/fixes/apexracer.mjs, looks/apexracer.md, jobs/G-207.md | build/g-207-fix1-apexracer |

<!-- merge robot heartbeat test a, Oct 23 2026, safe to ignore -->
<!-- merge robot heartbeat test b, Oct 23 2026, safe to ignore -->

<!-- merge robot heartbeat test c, Oct 23 2026, safe to ignore -->
<!-- merge robot heartbeat test d, Oct 23 2026, safe to ignore -->
