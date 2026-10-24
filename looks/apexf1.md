# Look board — Apex F1 (`apexf1.html`)

Read this before every job on Apex F1. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexf1.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## WHERE THINGS ARE

Feature → line numbers in apexf1.html (re-checked on the G-265 R1 build, 2026-10-24):
- Page head + inline tab icons: lines 1-8 (SVG icon declared G-95; empty data:, icon added G-224 line 7 - the Grok recheck still saw the favicon 404)
- Compact CSS: lines ~16-45 - landscape compact block at 16, portrait #teamMenu block at 36-45 (G-265 R1: the upright phone gets its own no-scroll fit); #raceBtn min-height 44px at line 29 (G-224: LIGHTS OUT is a full tap target); the main menu buttons pair up two per row so the whole menu fits 844x390 (G-136)
- Menu / overlay HTML (menu, track, team, grid, result, hub, friend): lines 192-294 (friend overlay #friendOv at 260)
- Import map (three + vendor loaders): line 295
- Audio: line 320 (engine() at 347 - grand_prix kit loops crossfaded by throttle + shift one-shots (G-107), kitLoad() at 376 (G-239: a missing band borrows its nearest decoded neighbour - the kit dies only when nothing decoded; kitRetry() at ~403 gives one retry; the synth fallback is de-squeaked: filter Q 0.8, sweep capped ~1.5 kHz), skid() at 433 - kit tire squeal loop; synth voices kept as fallback)
- Data: TRACKS 460, TEAMS 478, AI_NAMES 490
- Track (samples, buildGP for the kit circuit at 641): line 598
- Car mesh builder buildCarMesh: line 1043; Car class: line 1320 (player steering at ~1408-1421: G-239 - the player holds a WORLD heading (_yawW): stick deflected = G-136 stick-sets-heading against the road; stick centred = the world heading holds and the road curves away, the driver steers it back. AI keeps the integrator. Track-limits gate beside it: no accrual while _shoveT>0, brief brushes decay)
- Sponsor boards + gantries: buildSponsorBoards at 944 and the buildScenery gantry at ~897 (G-239: boxes carry a pre-flipped texture on the back face - APEX ARCADE reads correctly from both sides, never mirrored); horizon fog at 524 (300-1150, melts into the sky colour)
- Input object: line 1497; initInput (stick, buttons, releaseAll on blur): line 1506
- Race object: line 1681 (setup ~1687, placeGrid 1712, startLights ~1752, beginRace ~1778); trackGroundY at ~1676 and updateCamera at 1967 (G-119: every view rides the road + a hard floor; G-239: broadcast rides behind/above the car in the car's own frame looking down the road, frame-rate-independent easing, contact shake never applies to it); carContact at 1641 (pack fix + G-239: CONTACT! banners only when the player is in the pair, and a hard hit stamps the player's _shoveT limits grace) and aiDrive at 1567 (pack fix: close-range traffic speed match + each car's own quali line qOff)
- Career + friends: line ~2089 (Save 2089, friendCode 2102, parseFriend 2108, showResults 2118)
- Menu wiring (show 2181, friendBtn 2220, friendGo 2254): lines 2181-2268
- startWeekend: line 2309; runQuali: line 2328 (pack fix at 2328: qualifying starts with the field spread around the lap, not in one grid funnel; the SKIP QUALI button is created at 2342 - G-224: min-height 44px inline; G-239: top-centre at top:104px - at right/top:150 it sat on the speedometer); updateQuali at 2348 (G-239: sets the quali _gapF1 as a best-lap delta, null until both cars have a lap - HUD shows GAP —, never a fake +0.0s); grid list UI in finishQuali (2369): two half tables side by side (G-119 R1); main loop: line 2386

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
- 2026-10-23: The car drives itself on gas alone - "I'm just pressing gas and it does the laps. Player had to control." The heading was measured against the road itself, so a centred stick lapped hands-free (measured 2,192 m in 60 s at d=0.0). The player's nose now holds a WORLD heading; only the stick turns it (G-239)
- 2026-10-23: The helicopter/broadcast camera jitters and shakes everywhere (owner's recordings) - it now follows steady in the car's own frame and contact shake never reaches it (G-239)
- 2026-10-23: A 5s PENALTY banner must not ride a whole clean lap - no limits fine for where a rival shoved you, and brief brushes decay instead of stacking (G-239)
- 2026-10-23: CONTACT! is the player's news only - AI-on-AI hits never shout on his screen (seen video2-05) (G-239)
- 2026-10-23: The quali GAP readout must never sit at a fake +0.0s, and SKIP QUALI must never cover the speedometer (every frame of the recordings) (G-239)
- 2026-10-23: APEX ARCADE text must read correctly from both sides of every board and gantry - never mirrored (seen video1-01, video2-09) (G-239)
- 2026-10-23: The engine must be the grand_prix kit - one failed sound file must never kill the kit and leave the synth ("sounds like a rubber chicken") (G-239)
- 2026-10-24: Play-test entries must use test: (never run:) - the robot rejects a run: entry up front with a PLAY-TEST FORMAT line and drops it from the run, so the game loses the guard and takes the red line (G-253)
- 2026-10-24: teamMenu must fit with no scrolling and no race button may overlap the stick on the UPRIGHT phone too - the landscape compact rules do not apply there, so the base touch buttons and the portrait menu stack need their own fit (G-265 R1)

## G-239 — the owner's two recordings (looks/apexf1/owner-2026-10-23/), frame by frame
- video1-01..07 + video2-01..09, ALL frames: '5s PENALTY' pinned top-centre for 50 s of clean on-road driving; stick knob dead-centre while the car corners at 113-191 MPH and gains places (P4→P3) hands-free; SKIP QUALI pill covering the speed digits; GAP frozen at +0.0s while the name behind it changes.
- video2-05: CONTACT! in giant letters for a side-by-side in the pack - the player was not the one hit.
- video1-01 (top edge) + video2-09 (left fence): APEX ARCADE mirrored off the gantry banner and a board's back face.
- All frames: the horizon is a hard line - flat sky, no haze (fog now 300-1150 m into the sky colour).

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
