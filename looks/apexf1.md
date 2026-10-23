# Look board — Apex F1 (`apexf1.html`)

Read this before every job on Apex F1. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexf1.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## WHERE THINGS ARE

Feature → line numbers in apexf1.html (on main after G-136):
- Page head + inline tab icon: lines 1-7 (icon declared G-95)
- Menu / overlay HTML (menu, track, team, grid, result, hub, friend): lines 181-283 (friend overlay #friendOv at 249) - on sideways phones the main menu buttons pair up two per row so the whole menu fits 844x390 (G-136)
- Import map (three + vendor loaders): line 284
- Audio Aud: line 302 (engine() at 336 - grand_prix kit loops crossfaded by throttle + shift one-shots (G-107), kitLoad() at 365, skid() at 416 - kit tire squeal loop; synth voices kept as fallback)
- Data: TRACKS 443, TEAMS 461, AI_NAMES 473
- Track (samples, buildGP for the kit circuit at 624): line 581
- Car mesh builder buildCarMesh: line 1019; Car class: line 1296 (player steering at 1380-1384: G-136 the stick sets the heading directly, AI keeps the integrator)
- Input object: line 1457; initInput (stick, buttons, releaseAll on blur): line 1466
- Race object: line 1630 (setup 1636, placeGrid 1680, startLights 1701, beginRace 1727); trackGroundY at 1625 and updateCamera at 1916 (G-119: every view rides the road + a hard floor at the road nearest the camera)
- Career + friends: line 2036 (Save ~2037, friendCode 2050, parseFriend ~2056, showResults ~2066)
- Menu wiring (show 2129, friendBtn ~2168, friendGo ~2202): lines 2129-2246
- startWeekend: line 2257; runQuali: line ~2279; grid list UI in finishQuali (2311): two half tables side by side at 2322 (G-119 R1 - one 20-row list pushed LIGHTS OUT 214px off a sideways phone); main loop: line 2328
- Cockpit attach CKAttach: line 2397; Grand Prix kit GPBoot 2408, GPAttach 2424; applyGroundKit at 2438 (asphalt + kerb textures from kit/ground/512 on the 'asphalt'/'asphalt_runoff'/'pit_lane'/'kerb' materials, G-107)
- Test hooks window.__test: line 2458 (steerProbe at 2470 (G-136), camProbe at 2471, kitAudio + groundKit probes ~2475); REALITY hook window.__reality: line 2550; boot calls: ~2569; owner check link ?test=grid at the very end of the script (G-204: opens straight at the starting grid, LIGHTS OUT on screen)

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
