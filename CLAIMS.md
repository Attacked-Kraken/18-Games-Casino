# CLAIMS.md — who is doing what (READ THIS BEFORE WORKING)

**Owner's rule (2026-10-14):** every bot cross-checks this board, recent
commits, and open PRs BEFORE starting a task. If a task is CLAIMED or DONE,
do not redo it. Claim your work before you build, and sign it when it ships,
so nobody double-works.

## WHERE NEW GAMES GO (owner's rule, 2026-10-14)

New built games are GAME DEVELOPMENT titles. They go on the Game
Development page: **sports.html** ("Apex Arcade Game Development"),
reached from the red GAME DEVELOPMENT circle on the entrance.

- To ship a new game: add its tab + panel to `sports.html` (copy an
  existing game panel, keep the style) and point its PLAY button at the
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

- **Free licenses only** — CC0 preferred (Quaternius, Kenney, Poly
  Pizza CC0 and similar); other free licenses only when their terms
  allow commercial app use, and credit the source in the repo
  (CREDITS.txt / the asset folder's README). Never ripped, leaked or
  paid assets.
- **Realism is the target** — correct proportions, real materials and
  textures over stylized stand-ins, wherever the game is on screen.
- **Store-ready budget still applies** (see STORE-READY.md): pick the
  best-looking model that stays inside the mobile performance budget —
  sane poly counts, textures <= 2048px, GLB format, animations
  included when the asset needs to move. Best-looking AND fast; if a
  model is gorgeous but sinks a phone, optimize it or pick the next
  best.
- When you swap in a better model, say so in your PR: what asset,
  from where, what license.

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

| Status | Task | Bot | Branch | PR / sha | Updated |
|---|---|---|---|---|---|
| CLAIMED | Monster truck STORE-READY pass: phone light path (pixel ratio <=1.5, shadows off on touch), offline audit | Muse algre141 | mt-store-ready | - | 2026-10-14 22:54 CDT |
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
