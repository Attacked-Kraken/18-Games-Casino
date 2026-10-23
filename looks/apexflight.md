# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1180 lines)
- Menus / HTML / CSS (menu + friend overlays, HUD DOM, slim throttle bar CSS ~39, QUALITY button ~113): 1–157
- Imports, helpers, constants, state (offRwyMsg flag ~180): 158–185
- Renderer, scene, venue (step-6 look 191-219: ACES, SUN_DIR 203, shadow sun, PMREM env; runway block ~282-331; crowdTick ~470): 186–486
- The jet (owner's Apex Jet pack, created external): 487–494
- HUD artificial horizon: 495–520 · Messages: 521–524
- Game flow (respawn ~526, crash ~543, touchdown/scoring ~550): 525–587
- Input — keyboard (pollKeys ~597): 588–606 · Jet controls pad + tricks + throttle bar (~628): 607–699
- Buttons / view toggle: 700–709 · Play a Friend codes: 710–749 · fitGame: 750–763
- Physics (step ~771; lift/stall, airbrake in the forces block ~825): 764–880
- Camera (step-5 offsets + sun follow): 881–913 · HUD update (off-runway reason re-assert ~925): 914–955 · Music (procedural WebAudio): 956–1074
- QUALITY option wiring (~1075) · Test hooks (`__flight` 1093, `__reality` 1105): 1075–1131
- Main loop (throttle/brake/boost/yaw latches ~1142–1150): 1132–1180
## WHERE THINGS ARE — `apexflight.html` (1153 lines)
- Menus / HTML / CSS (menu + friend overlays, HUD DOM, slim throttle bar CSS ~39): 1–152
- Imports, helpers, constants, state (shared controls import at 156): 153–185
- Renderer, scene, venue (runway block - tiling paint, threshold decals, polygonOffset ladder, G-132; crowdTick): 186–468
- The jet (owner's Apex Jet pack, created external): 469–476
- HUD artificial horizon: 477–502 · Messages: 503–506
- Game flow (respawn 508 - also shows the kit stick, crash, touchdown/scoring): 507–570
- Input — keyboard (pollKeys 580): 571–589 · Jet controls: pad + SHARED kit stick (kit/controls.js, G-232; kit created ~601, pack zone removed ~599) + throttle bar: 590–694
- Buttons / view toggle: 695–704 · Play a Friend codes: 705–748 · fitGame ~749: 749–758
- Physics (step ~762; lift/stall, airbrake in the forces block): 759–875
- Camera: 876–904 · HUD update (off-runway reason re-assert): 905–946 · Music (procedural WebAudio): 947–1063
- Test hooks (`__flight` ~1058, `__reality` ~1070): 1058–1104
- Main loop (kit axes merge ~1113; ?test= owner-check hook ~1138): 1105–1153

Shared stick (G-232): pitch/roll come from kit/controls.js `createControls` (left
thumbstick, #apcZone trimmed to the old pack footprint); the jet pack keeps only
its 14-button pad. Let go = stop is the kit's: pointerup / pointercancel / blur /
hidden tab all reset it (play test play-stick-shared-resets).

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).
**Jet pack camera + look (G-141, INSTRUCTIONS steps 5-6):** chase offset is the pack's -17 - speed*0.012 back, +4.5 up; cockpit eye = U*(jet.canopyY + 0.42) + F*(JET_STYLES[style].canopy.z); camera ground clamp 0.6. Look = ACES tone mapping, the demo's shadow sun (SUN_DIR, 2048 PCFSoft, +-22 m box) following the jet, hemi 0.55, and the demo's PMREM environment so the paint reflects. LOW option (start-menu QUALITY toggle): pixel ratio 1.25, shadow sun off.

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
