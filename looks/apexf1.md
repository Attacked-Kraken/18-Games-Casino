# Look board — Apex F1 (`apexf1.html`)

Read this before every job on Apex F1. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexf1.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## WHERE THINGS ARE

Feature → line numbers in apexf1.html (on the G-224 branch: G-204 + the pack fix + G-224, 2026-10-23):
- Page head + inline tab icons: lines 1-8 (SVG icon declared G-95; empty data:, icon added G-224 line 8 - the Grok recheck still saw the favicon 404)
- Compact sideways CSS: line ~17-45 - #raceBtn min-height 44px at line 29 (G-224: LIGHTS OUT is a full tap target); the main menu buttons pair up two per row so the whole menu fits 844x390 (G-136)
- Menu / overlay HTML (menu, track, team, grid, result, hub, friend): lines 182-285 (friend overlay #friendOv at 251)
- Import map (three + vendor loaders): line 286
- Audio Aud: line 304 (engine() at 338 - grand_prix kit loops crossfaded by throttle + shift one-shots (G-107), kitLoad() at 367, skid() at 418 - kit tire squeal loop; synth voices kept as fallback)
- Data: TRACKS 445, TEAMS 463, AI_NAMES 475
- Track (samples, buildGP for the kit circuit at 626): line 583
- Car mesh builder buildCarMesh: line 1021; Car class: line 1298 (player steering at 1382-1386: G-136 the stick sets the heading directly, AI keeps the integrator)
- Input object: line 1460; initInput (stick, buttons, releaseAll on blur): line 1469
- Race object: line 1643 (setup 1649, placeGrid 1693, startLights 1714, beginRace 1740); trackGroundY at 1638 and updateCamera at 1929 (G-119: every view rides the road + a hard floor at the road nearest the camera); carContact just above trackGroundY (pack fix: separation capped per step, AI-AI spins need a big hit, speed glue per-second) and aiDrive above it (pack fix: close-range traffic speed match + each car's own quali line qOff)
- Career + friends: line ~2049 (Save 2050, friendCode 2063, parseFriend 2069, showResults 2079)
- Menu wiring (show 2142, friendBtn 2181, friendGo 2215): lines 2142-2259
- startWeekend: line 2270; runQuali: line 2292 (pack fix at 2293: qualifying starts with the field spread around the lap, not in one grid funnel; the SKIP QUALI button is created at 2302-2303 - G-224: min-height 44px inline); grid list UI in finishQuali (2328): two half tables side by side at 2336 (G-119 R1 - one 20-row list pushed LIGHTS OUT 214px off a sideways phone); main loop: line 2345
- Cockpit attach CKAttach: line 2414; Grand Prix kit GPBoot 2425, GPAttach 2441; applyGroundKit at 2455 (asphalt + kerb textures from kit/ground/512 on the 'asphalt'/'asphalt_runoff'/'pit_lane'/'kerb' materials, G-107)
- Test hooks window.__test: line 2475 (steerProbe at 2487 (G-136), camProbe at 2488, kitAudio + groundKit probes ~2501); REALITY hook window.__reality: line 2567; boot calls: ~2587; owner check link ?test=grid at the very end of the script (G-204: opens straight at the starting grid, LIGHTS OUT on screen)

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
