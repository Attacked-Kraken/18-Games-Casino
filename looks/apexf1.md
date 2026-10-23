# Look board — Apex F1 (`apexf1.html`)

Read this before every job on Apex F1. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexf1.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## WHERE THINGS ARE

Feature → line numbers in apexf1.html (on the G-204 branch: G-204 + the pack fix, owner order 2026-10-23):
- Page head + inline tab icon: lines 1-7 (icon declared G-95)
- Menu / overlay HTML (menu, track, team, grid, result, hub, friend): lines 181-283 (friend overlay #friendOv at 249) - on sideways phones the main menu buttons pair up two per row so the whole menu fits 844x390 (G-136)
- Import map (three + vendor loaders): line 284
- Audio Aud: line 302 (engine() at 336 - grand_prix kit loops crossfaded by throttle + shift one-shots (G-107), kitLoad() at 365, skid() at 416 - kit tire squeal loop; synth voices kept as fallback)
- Data: TRACKS 443, TEAMS 461, AI_NAMES 473
- Track (samples, buildGP for the kit circuit at 624): line 581
- Car mesh builder buildCarMesh: line 1019; Car class: line 1296 (player steering at 1380-1384: G-136 the stick sets the heading directly, AI keeps the integrator)
- Input object: line 1457; initInput (stick, buttons, releaseAll on blur): line 1466
- Race object: line 1641 (setup ~1647, placeGrid 1691, startLights 1712, beginRace 1738); trackGroundY at 1636 and updateCamera at 1927 (G-119: every view rides the road + a hard floor at the road nearest the camera); carContact just above trackGroundY (pack fix: separation capped per step, AI-AI spins need a big hit, speed glue per-second) and aiDrive above it (pack fix: close-range traffic speed match + each car's own quali line qOff)
- Career + friends: line ~2047 (Save 2048, friendCode 2061, parseFriend 2067, showResults 2077)
- Menu wiring (show 2140, friendBtn ~2179, friendGo ~2213): lines 2140-2257
- startWeekend: line 2268; runQuali: line 2290 (pack fix at 2291: qualifying starts with the field spread around the lap, not in one grid funnel); grid list UI in finishQuali (2326): two half tables side by side at 2334 (G-119 R1 - one 20-row list pushed LIGHTS OUT 214px off a sideways phone); main loop: line ~2343
- Cockpit attach CKAttach: line 2412; Grand Prix kit GPBoot ~2423, GPAttach 2439; applyGroundKit at 2453 (asphalt + kerb textures from kit/ground/512 on the 'asphalt'/'asphalt_runoff'/'pit_lane'/'kerb' materials, G-107)
- Test hooks window.__test: line 2473 (steerProbe at 2485 (G-136), camProbe at 2486, kitAudio + groundKit probes ~2499); REALITY hook window.__reality: line 2565; boot calls: ~2584; owner check link ?test=grid at the very end of the script (G-204: opens straight at the starting grid, LIGHTS OUT on screen)

## MUST
- Own fictional teams and drivers
- The car in the game must look like the model the owner approved
- The picture renders sharp at 1.5x on a 2x phone - never lowered
- Every car is the same model with the same wheel design; the car's height is the real 0.95 m

## NEVER
- Never show the owner mockups or drawings - only the real in-game car (model viewer or game check pictures)
- No rotate-your-phone sign
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- Game does not start (owner 2026-10-17 — the game must start and render gameplay, never a black/blank screen)
- 2026-10-22: Start button off the screen - "LIGHTS OUT" sat 214px below the bottom of a sideways phone and the owner had to scroll to press it; every menu fits 844x390 with NO scrolling (G-119)
- No camera below the track surface - the helicopter camera never goes under the ground (owner's pictures, 2026-10-21)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
