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
