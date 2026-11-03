# PHASE 2 - who does what (owner Mr. Cruz, Nov 3 2026, LOCKED)

Phase 1 proved the factory can build, check and merge games from a phone.
Phase 2 fixes what Phase 1 showed: **Muses cannot build 3D.** Every shape, camera,
physics, paint-on-a-model or scenery job made by a Muse came back broken or slow.
So the work is split by KIND of work, not by window.

## The owner
- Plays the game, takes pictures, says what is wrong (one batch of notes at a time).
- Taps thumbs up on what looks right. Picks 3D models. Nothing else reaches him.

## Claude (the VP chat)
- Does ALL 3D and game-engine work: model fitting, cars/players/wheels, paint and wraps,
  cameras, physics, tracks, stadiums, scenery, lighting, shared kit/ files,
  and any fix that touches more than one part of a game.
- Ships each fix with pictures; the merge robot merges it.
- Gives a Muse a small job when the job is small (below).

## Muses (free workers) - SMALL JOBS ONLY
You MAY do:
- Words and menus: text, labels, button size/position, colours in the menu/HUD.
- Game numbers: speeds, scores, timers, difficulty, prices, balance.
- Sounds (Kenney / made by the sound robot), music on/off.
- Play tests (`tools/game-check/fixes/<game>.mjs`) and checklist ticks (`checklists/`).
- Finding FREE 3D models: write the Sketchfab link + licence + size on a MODEL-REQUESTS.md line.
  The fetch robot downloads and checks it. You never edit model code.

You MAY NOT touch (write ONE line in jobs/HELP.md instead: `HELP-VP: window N · G-NN · needs Claude: <what>`, then stop):
- 3D models, model loading code, wheels, bodies, paint/wrap/livery code, textures on models.
- Cameras, physics, collisions, car or player movement.
- Tracks, stadiums, scenery, lighting, shaders.
- Anything in kit/, venues/, models/, characters/.
- A job that changes more than one part of the game.

## Machines
- **Mac mini approver:** presses the Muses' approval cards, runs the phone controller,
  away link and backups. It sends NO jobs and NO automatic messages (switches "Cards only"
  and "All automatic messages off" stay ON).
- **Advisor laptop, windows 11-14 and the ChatGPT courier:** PARKED. They did not produce
  game fixes in Phase 1. Can be switched back on by the owner's word only.
- **Robots (GitHub):** quick paperwork check on each pull request, the merge robot, the
  model fetch + acceptance robot, the nightly sweep. No game playing on pull requests.

## The loop
owner notes -> Claude sorts them -> 3D/engine work: Claude fixes and shows pictures ->
small work: one-line job to a Muse -> robot merges -> owner plays -> thumbs up or next notes.
One game at a time until it is done.

**OLD WORK TRASHED + NO MORE G-NUMBERS (owner, Nov 3 2026 5:17 PM): every old G-job, jobs/QUEUE.md line and jobs/G-NN.md report is archive - never finish, restructure or report it. Rounds come from MAC as T<window>-<n> (tester) / A<window>-<n> (auditor). The ONLY paperwork is findings/<game>/F-x-NNN.md + library/open/<game>.md (findings/README.md). No report files: end a round with one chat line 'ROUND DONE <round id>: <finding ids or none>'.**

## Crews (owner Nov 3 2026 4:35 PM, LOCKED) - 5 testers, 5 auditors, Claude fixes
| Game | Tester (plays + measures) | Auditor (checks + sorts) |
|---|---|---|
| Exotic Racer Club | window 8 | window 6 |
| Apex F1 Racing | window 7 | window 5 |
| Apex Ice Hockey | window 9 | window 2 |
| Apex Track & Field | window 10 | window 4 |
| Apex Baseball | window 3 | window 1 |
| Apex Flight | rests until a pair is free | - |

**TESTER** - plays its ONE game on main, one checklist item or one mode per round, measures with real numbers, and files
each problem as ONE finding file (findings/README.md). Never changes game code. Re-checks fixed findings.
**AUDITOR** - reads every NEW finding for its game, opens the game on main and follows the steps, writes TRUE / FALSE /
DUPLICATE with what it measured, sorts it: SMALL (text, menu/HUD layout or colour, a number, a sound, a test) = fixes it
itself in a one-part PR; everything 3D / engine / camera / physics / shared / multi-part = FOR-CLAUDE. Keeps
`library/open/<game>.md` current. Never builds 3D.
**CLAUDE (VP)** - fixes every FOR-CLAUDE finding and the owner's notes, with pictures; answers HELP lines; closes games
into `library/closed/` on the owner's word.
**OWNER** - plays, pictures, thumbs, picks models. Nothing else reaches him.

## The pipeline never waits on one window (owner: "asymmetric")
Testers keep measuring whether or not the auditor has read the last finding. Auditors audit whatever is NEW whenever they
are free. Claude works FOR-CLAUDE findings by severity (BLOCKER > BAD > SMALL), the owner's notes first. Each window has
ONE open pull request at a time and opens the next the minute it merges. No window asks another window for anything; the
files on main are the hand-off (findings/, library/, jobs/HELP.md).

## Paperwork that keeps PRs from piling up
- Findings, audits and library pages are notes: the merge robot merges them at once (no robot play, no batch wait).
- An AUTO-UNDO pull request nobody merged in 6 h is closed by the robot with a note (the next red check opens a fresh one).
- A SMALL fix is one part, one change, one play test, title `FIX F-<L>-<NNN> (PART: <part>): ...`.
- The Mac mini sends only role work: a tester round, an audit round, a re-check - one at a time, when the window is free.
  No nudges, no reminders, no re-sends.
