# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1156 lines)
- Menus / HTML / CSS (menu + friend overlays, HUD DOM, slim throttle bar CSS ~39): 1–152
- Imports, helpers, constants, state (shared controls import at 156): 153–185
- Renderer, scene, venue (runway block - tiling paint, threshold decals, polygonOffset ladder, G-132; crowdTick): 186–468
- The jet (owner's Apex Jet pack, created external): 469–476
- HUD artificial horizon: 477–502 · Messages: 503–506
- Game flow (respawn 508 - also shows the kit stick, crash, touchdown/scoring): 507–570
- Input — keyboard (pollKeys 580): 571–589 · Jet controls: pad + SHARED kit stick (kit/controls.js, G-232; kit created 607, pack stick zone removed 605) + throttle bar: 590–694
- Buttons / view toggle: 695–704 · Play a Friend codes: 705–748 · fitGame ~749: 749–758
- Physics (step ~762; lift/stall, airbrake in the forces block): 759–875
- Camera: 876–904 · HUD update (off-runway reason re-assert): 905–946 · Music (procedural WebAudio): 947–1063
- Test hooks (`__flight` ~1064, `__reality` ~1076): 1064–1104
- Main loop (kit stick merge at 1119; ?test= owner-check hook at 1144): 1105–1156

Shared stick (G-232): pitch/roll come from kit/controls.js `createControls` (left
thumbstick, #apcZone trimmed to the old pack footprint); the jet pack keeps only
its 14-button pad. Let go = stop is the kit's: pointerup / pointercancel / blur /
hidden tab all reset it (play test play-stick-shared-resets).

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

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
