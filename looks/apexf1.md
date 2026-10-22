# Look board — Apex F1 (`apexf1.html`)

Read this before every job on Apex F1. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexf1.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## WHERE THINGS ARE

Feature → line numbers in apexf1.html (on main after G-119):
- Page head + inline tab icon: lines 1-7 (icon declared G-95)
- Menu / overlay HTML (menu, track, team, grid, result, hub, friend): lines 176-278 (friend overlay #friendOv at 244)
- Import map (three + vendor loaders): line 279
- Audio Aud: line 297 (engine() at 331 - grand_prix kit loops crossfaded by throttle + shift one-shots (G-107), kitLoad() at 360, skid() at 411 - kit tire squeal loop; synth voices kept as fallback)
- Data: TRACKS 438, TEAMS 456, AI_NAMES 468
- Track (samples, buildGP for the kit circuit at 619): line 576
- Car mesh builder buildCarMesh: line 1014; Car class: line 1291
- Input object: line 1452; initInput (stick, buttons, releaseAll on blur): line 1461
- Race object: line 1624 (setup 1630, placeGrid ~1655, startLights 1695, beginRace 1721); trackGroundY at 1619 and updateCamera at 1910 (G-119: every view rides the road + a hard floor at the road nearest the camera)
- Career + friends: line 2030 (Save ~2031, friendCode 2044, parseFriend ~2050, showResults ~2060)
- Menu wiring (show 2123, friendBtn ~2162, friendGo ~2196): lines 2123-2240
- startWeekend: line 2251; runQuali: line ~2273; main loop: line 2320
- Cockpit attach CKAttach: line 2389; Grand Prix kit GPBoot ~2400, GPAttach 2416; applyGroundKit at 2430 (asphalt + kerb textures from kit/ground/512 on the 'asphalt'/'asphalt_runoff'/'pit_lane'/'kerb' materials, G-107)
- Test hooks window.__test: line 2450 (camProbe at 2462, kitAudio + groundKit probes ~2466); REALITY hook window.__reality: line 2541; boot calls: ~2560

## MUST
- Own fictional teams and drivers
- The car in the game must look like the model the owner approved

## NEVER
- Never show the owner mockups or drawings - only the real in-game car (model viewer or game check pictures)
- No rotate-your-phone sign
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- Game does not start (owner 2026-10-17 — the game must start and render gameplay, never a black/blank screen)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
