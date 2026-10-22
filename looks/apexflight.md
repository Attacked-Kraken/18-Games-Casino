# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1110 lines)
- Menus / HTML / CSS (menu + friend overlays, HUD DOM, slim throttle bar CSS ~39): 1–152
- Imports, helpers, constants, state: 153–181
- Renderer, scene, venue (runway, ocean, sky, crowd; crowdTick 426): 182–442
- The jet (owner's Apex Jet pack, created external): 443–450
- HUD artificial horizon: 451–476 · Messages: 477–480
- Game flow (respawn 484, crash 501, touchdown/scoring 508): 483–543
- Input — keyboard (pollKeys ~553): 544–562 · Jet controls pad + tricks + throttle bar (580): 563–655
- Buttons / view toggle: 656–665 · Play a Friend codes: 666–705 · fitGame: 706–719
- Physics (step ~727; lift/stall, airbrake in the forces block ~777): 720–836
- Camera: 837–865 · HUD update: 866–903 · Music (procedural WebAudio): 904–1022
- Test hooks (`__flight` 1023, `__reality` 1035): 1023–1061
- Main loop (throttle/brake/boost/yaw latches ~1072–1080): 1062–1110

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## MUST
- (owner adds these)
- Runway numbers and markings read the correct way round from the pilot's view (never mirrored)
- The menus and HUD name the aircraft the game actually flies - the jet

## NEVER
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- No control overlapping another control - the throttle is a slim button in the button row

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
