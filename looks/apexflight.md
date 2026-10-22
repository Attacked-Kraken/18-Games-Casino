# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1090 lines)
- Menus / HTML / CSS (menu + friend overlays, HUD DOM): 1–152
- Imports, helpers, constants, state: 153–181
- Renderer, scene, venue (runway, ocean, sky, crowd; crowdTick 426): 182–442
- The jet (owner's Apex Jet pack, created external): 443–450
- HUD artificial horizon: 451–476 · Messages: 477–480
- Game flow (respawn 482, crash 499, touchdown/scoring 506): 481–541
- Input — keyboard (pollKeys 551): 542–560 · Jet controls pad + tricks: 561–635
- Buttons / view toggle: 636–645 · Play a Friend codes: 646–685 · fitGame: 686–699
- Physics (step 707; lift/stall, airbrake in the forces block ~757): 700–816
- Camera: 817–845 · HUD update: 846–883 · Music (procedural WebAudio): 884–1002
- Test hooks (`__flight` 1003, `__reality` 1015): 1003–1041
- Main loop (throttle/brake/boost/yaw latches 1052–1060): 1042–1090

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## MUST
- (owner adds these)

## NEVER
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
