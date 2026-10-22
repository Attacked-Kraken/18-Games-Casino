# Look board — Exotic Racer Club (`apexracer.html`)

## WHERE THINGS ARE (apexracer.html, line numbers on main after G-176)
- Car data: GLB_MODELS registry L294 · CARS stats L316 · paint material (paintMat) L642
- Places list (PLACES) L379
- Name wrap: addNameWrap L953 (door run judged at 0.85 of the door's own widest line; wheel zones break the run)
- Car building: makeGlbCar L1059 (lamps, on-lens glow quads, headlight pool L1106-1130) · makeCar (real-model swap, mockup fallback) L1135 · garage car (setGarageCar) L1229
- World and race setup: buildWorld L1339 · setupRace L1785 (night headlight pools parked in the scene L1816) · startRace L2096 · back to menu (toMenu) L2065
- Sound: audioInit L1697 · sfx L1718 · music speed mix (musRaceMix) L1756
- Racing: stepPlayer L1833 · stepAI L1878 (G-70 gap band + G-123 player-pace cap) · stepTraffic L1912 · posePool L1922 · poseCar L1923 · updateRace L1931 (skids guard at its head, G-123 player pace tracker)
- Test hooks: window.__erc L2323 · window.__reality L2334

Read this before every job on Exotic Racer Club. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexracer.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## MUST
- Cars match the owner's photo: wheels and rims exactly as in the picture (e.g. white rims)
- Night exposure keeps every car's shape readable - lights never blow a car out to a white blob

## NEVER
- No car missing its wheels
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- No untextured bars or stray parts on a car - every part on the car belongs to the car
- No gameplay or proof camera inside a car

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
