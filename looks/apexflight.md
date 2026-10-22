# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1139 lines)
- Menus / HTML / CSS (menu + friend overlays, HUD DOM, slim throttle bar CSS ~39): 1–152
- Imports, helpers, constants, state (offRwyMsg flag ~177): 153–182
- Renderer, scene, venue (runway block 263-312 - tiling paint, threshold decals, polygonOffset ladder, G-132; crowdTick ~449): 183–469
- The jet (owner's Apex Jet pack, created external): 470–477
- HUD artificial horizon: 478–503 · Messages: 504–507
- Game flow (respawn ~512, crash ~524, touchdown/scoring ~531): 510–572
- Input — keyboard (pollKeys ~582): 573–591 · Jet controls pad + tricks + throttle bar (~609): 592–684
- Buttons / view toggle: 685–694 · Play a Friend codes: 695–734 · fitGame: 735–748
- Physics (step ~752; lift/stall, airbrake in the forces block ~806): 749–865
- Camera: 866–892 · HUD update (off-runway reason re-assert ~902): 893–938 · Music (procedural WebAudio): 939–1051
- Test hooks (`__flight` 1052, `__reality` 1064): 1052–1096
- Main loop (throttle/brake/boost/yaw latches ~1107–1115): 1097–1139

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
