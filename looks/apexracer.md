# Look board — Exotic Racer Club (`apexracer.html`)

## WHERE THINGS ARE (apexracer.html, line numbers on main after G-123)
- Car data: GLB_MODELS registry L294 · CARS stats L316 · paint material (paintMat) L642
- Places list (PLACES) L379
- Car building: makeGlbCar L1057 · makeCar (real-model swap, mockup fallback) L1112 · garage car (setGarageCar) L1206
- World and race setup: buildWorld L1316 · setupRace L1762 · startRace L2070 · back to menu (toMenu) L2039
- Sound: audioInit L1674 · sfx L1695 · music speed mix (musRaceMix) L1733
- Racing: stepPlayer L1809 · stepAI L1854 (G-70 gap band + G-123 player-pace cap) · stepTraffic L1888 · updateRace L1906 (G-123 player pace tracker)
- Test hooks: window.__erc L2297 · window.__reality L2308

Read this before every job on Exotic Racer Club. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexracer.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## MUST
- Cars match the owner's photo: wheels and rims exactly as in the picture (e.g. white rims)

## NEVER
- No car missing its wheels
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
