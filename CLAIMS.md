# CLAIMS.md — who is doing what (READ THIS BEFORE WORKING)

**Owner's rule (2026-10-14):** every bot cross-checks this board, recent
commits, and open PRs BEFORE starting a task. If a task is CLAIMED or DONE,
do not redo it. Claim your work before you build, and sign it when it ships,
so nobody double-works.

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
| DONE | Hosting move: repo public again, GitHub Pages live — every merge to main auto-deploys | owner + Muse main | — | main @ 20871fb3 era | 2026-10-14 15:28 CDT |
| DONE | Layout fix: all four Apex games fill the screen after rotation + hockey framing/lighting | Muse main (casino) | layout-fix | PR #24 | 2026-10-14 14:33 CDT |
| DONE | Face v12h (visits/scans/approach) + commentary cast2 (true stats) + soccer v4 (goals/keepers/scoring/teammates) | Muse main (casino) | face-v12h-cast2-soccer-v4 | PR #25, main 40ee0b8a | 2026-10-14 14:33 CDT |
| DONE | Face v12i (no hole, she keeps off the door side) + hoops v13 (rim/board/swish sound, through-the-net, FT form, locomotion) | Muse main (casino) | face-v12i-hoops-v13 | PR #26, main 20871fb3 | 2026-10-14 14:47 CDT |
| DONE | Face v12j (baked portrait — lag fix, down-look surveillance, anger glare) + hoops v14 (rotation/menu perf, real steals & blocks, run-out inbounds) | Muse main (casino) | face-v12j-hoops-v14 | PR #27, main d70d3a4c | 2026-10-14 15:52 CDT |
| DONE | This claims board + the cross-check-and-claim rule | Muse main (casino) | claims-board | this PR | 2026-10-14 16:05 CDT |
| CLAIMED | Door hold on/off switch: persistent toggle on hallway 1 - OFF = plain tap on the 0 (no hold), ON = hold-then-tap as now | Muse main (casino) | door-hold-switch | - | 2026-10-14 17:08 CDT |
