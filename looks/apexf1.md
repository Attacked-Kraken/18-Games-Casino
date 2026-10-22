# Look board — Apex F1 (`apexf1.html`)

Read this before every job on Apex F1. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexf1.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## WHERE THINGS ARE

Feature → line numbers in apexf1.html (on main after G-119 fix round 1):
- Page head + inline tab icon: lines 1-7 (icon declared G-95)
- Menu / overlay HTML (menu, track, team, grid, result, hub, friend): lines 178-280 (friend overlay #friendOv at 246)
- Import map (three + vendor loaders): line 281
- Audio Aud: line 299 (engine() at 333 - grand_prix kit loops crossfaded by throttle + shift one-shots (G-107), kitLoad() at 362, skid() at 413 - kit tire squeal loop; synth voices kept as fallback)
- Data: TRACKS 440, TEAMS 458, AI_NAMES 470
- Track (samples, buildGP for the kit circuit at 621): line 578
- Car mesh builder buildCarMesh: line 1016; Car class: line 1293
- Input object: line 1454; initInput (stick, buttons, releaseAll on blur): line 1463
- Race object: line 1626 (setup 1632, placeGrid 1676, startLights 1697, beginRace 1723); trackGroundY at 1621 and updateCamera at 1912 (G-119: every view rides the road + a hard floor at the road nearest the camera)
- Career + friends: line 2032 (Save ~2033, friendCode 2046, parseFriend ~2052, showResults ~2062)
- Menu wiring (show 2125, friendBtn ~2164, friendGo ~2198): lines 2125-2242
- startWeekend: line 2253; runQuali: line ~2275; grid list UI in finishQuali (2307): two half tables side by side at 2318 (G-119 R1 - one 20-row list pushed LIGHTS OUT 214px off a sideways phone); main loop: line 2324
- Cockpit attach CKAttach: line 2393; Grand Prix kit GPBoot 2404, GPAttach 2420; applyGroundKit at 2434 (asphalt + kerb textures from kit/ground/512 on the 'asphalt'/'asphalt_runoff'/'pit_lane'/'kerb' materials, G-107)
- Test hooks window.__test: line 2454 (camProbe at 2466, kitAudio + groundKit probes ~2470); REALITY hook window.__reality: line 2545; boot calls: ~2564

## MUST
- Own fictional teams and drivers
- The car in the game must look like the model the owner approved

## NEVER
- Never show the owner mockups or drawings - only the real in-game car (model viewer or game check pictures)
- No rotate-your-phone sign
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- Game does not start (owner 2026-10-17 — the game must start and render gameplay, never a black/blank screen)
- 2026-10-22: Start button off the screen - "LIGHTS OUT" sat 214px below the bottom of a sideways phone and the owner had to scroll to press it; every menu fits 844x390 with NO scrolling (G-119)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
