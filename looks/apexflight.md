# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1119 lines)
- Menus / HTML / CSS (menu + friend overlays, HUD DOM, slim throttle bar CSS ~39): 1–152
- Imports, helpers, constants, state (offRwyMsg flag ~177): 153–182
- Renderer, scene, venue (runway, ocean, sky, crowd; crowdTick ~427): 183–443
- The jet (owner's Apex Jet pack, created external): 444–451
- HUD artificial horizon: 452–477 · Messages: 478–481
- Game flow (respawn ~486, crash ~503, touchdown/scoring ~510): 484–546
- Input — keyboard (pollKeys ~556): 547–565 · Jet controls pad + tricks + throttle bar (~583): 566–658
- Buttons / view toggle: 659–668 · Play a Friend codes: 669–708 · fitGame: 709–722
- Physics (step ~730; lift/stall, airbrake in the forces block ~780): 723–839
- Camera: 840–868 · HUD update (off-runway reason re-assert ~907): 869–912 · Music (procedural WebAudio): 913–1031
- Test hooks (`__flight` 1032, `__reality` 1044): 1032–1070
- Main loop (throttle/brake/boost/yaw latches ~1081–1089): 1071–1119

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
