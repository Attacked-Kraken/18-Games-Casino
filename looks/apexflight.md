# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1198 lines)
- Menus / HTML / CSS (menu + friend overlays - .panel capped at 100dvh-16px, compacted so every panel fits a 390-high phone, G-238; slim throttle bar CSS ~41; QUALITY button ~116): 1–157
- Imports, helpers, constants, state (offRwyMsg flag ~183): 158–189
- Renderer, scene, venue (step-6 look: ACES, shadow sun, PMREM env; runway block - tiling paint, threshold decals, polygonOffset ladder, G-132; crowdTick): 190–490
- The jet (owner's Apex Jet pack, created external): 491–498
- HUD artificial horizon: 499–524 · Messages: 525–528
- Game flow (respawn ~532, crash, touchdown/scoring): 529–592
- Input — keyboard (pollKeys ~597): 593–612 · Jet controls: pad + SHARED kit stick + throttle bar; resetInputs 702 (blur / touchcancel / hidden zero every input, G-238): 613–711
- Buttons / view toggle: 712–721 · Play a Friend codes: 722–765 · fitGame ~766: 766–775
- Physics (step ~781; lift/stall, airbrake in the forces block): 776–892
- Camera (step-5 offsets + sun follow): 893–925 · HUD update (off-runway reason re-assert): 926–967 · Music (procedural WebAudio): 968–1092
- QUALITY option wiring (~1095) · Test hooks (`__flight` 1105, `__reality` 1117): 1093–1143
- Main loop (kit axes merge ~1155; ?test= owner-check hook 1183): 1144–1198

Shared stick (G-232): pitch/roll come from kit/controls.js `createControls` (left
thumbstick, #apcZone trimmed to the old pack footprint); the jet pack keeps only
its 14-button pad. Let go = stop is the kit's: pointerup / pointercancel / blur /
hidden tab all reset it (play test play-stick-shared-resets).

Fit rule (G-238): every overlay panel fits a 844x390 phone outright - .panel is
compact (14px padding, slimmer buttons) and capped at calc(100dvh - 16px) with
internal scroll as the safety net. A touch cancel resets all input through
resetInputs (play test play-stick-never-stays-stuck).

## MUST
- (owner adds these)
- Runway numbers and markings read the correct way round from the pilot's view (never mirrored)
- The menus and HUD name the aircraft the game actually flies - the jet

## NEVER
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- No control overlapping another control - the throttle is a slim button in the button row
- 2026-10-22: After a scored landing, flying into the ocean must still crash the plane (today: nothing happens) (G-121)
- 2026-10-22: Landing challenge: touching down OFF the runway must tell the player why there is no score (today: silence) (G-121)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
