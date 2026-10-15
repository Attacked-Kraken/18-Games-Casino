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
