# Look board — Apex F1 (`apexf1.html`)

Read this before every job on Apex F1. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexf1.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## WHERE THINGS ARE

Feature → line numbers in apexf1.html (on main):
- Page head + inline tab icon: lines 1-7 (icon declared G-95)
- Menu / overlay HTML (menu, track, team, grid, result, hub, friend): lines 176-260 (friend overlay #friendOv at 244)
- Import map (three + vendor loaders): line 279
- Data: TRACKS 378, TEAMS 396, AI_NAMES 408
- Track (samples, buildGP for the kit circuit at 559): line 516
- Car mesh builder buildCarMesh: line 954; Car class: line 1231
- Input object: line 1392; initInput (stick, buttons, releaseAll on blur): line 1401
- Race object: line 1558 (setup 1560, placeGrid 1608, startLights 1629, beginRace 1655)
- Career + friends: line 1957 (Save 1958, friendCode 1971, parseFriend 1977, showResults 1989)
- Menu wiring (show 2050, friendBtn 2089, friendGo 2123): lines 2040-2160
- startWeekend: line 2181; runQuali: ~line 2199; main loop: line 2247
- Cockpit attach CKAttach: line 2316; Grand Prix kit GPBoot 2327, GPAttach 2343
- Test hooks window.__test: line 2358; REALITY hook window.__reality: line 2436; boot calls: 2453-2456

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
