# Look board — Exotic Racer Club (`apexracer.html`)

## WHERE THINGS ARE (apexracer.html - line numbers on main of Oct 22, 2026, after the lamp-glow surface fix; keep current per STUDIO-STANDARD 9.7)
- Menu / turntable: menu home + showroom orbit (toMenu) L2078 - menu refresh (refreshMenu) L2071 - turntable spin + garage camera (updateGarage) L2286 - frame loop L2309
- Garage: openGarage L2158 - garage cards and buying (renderGarage) L2168 - the shown car (setGarageCar) L1242
- Car data: model registry (GLB_MODELS) L294 - car stats (CARS) L316 - places (PLACES) L379 - paint material (paintMat) L642
- Car building: name wrap (addNameWrap) L953 - real-model car builder (makeGlbCar) L1059 - its lamp glow lies on the measured body surface (lampSurf, inside makeGlbCar) - car entry + real-model swap (makeCar) L1148
- World and race setup: world build in slices (buildWorld) L1352 - race setup (setupRace) L1798 - grid camera inside setupRace L1832 - race start guards (PR #1023: startRace ignores a second start while loading) - race start (startRace) L2109
- Driving physics: player car (stepPlayer) L1846
- AI: stepAI L1891 - G-70 gap band + the G-123 player-pace cap on top
- Traffic: stepTraffic L1925 - headlight pool follow (posePool) L1935 - car posing (poseCar) L1936
- Camera: chase camera inside updateRace L2012-2018 - race render (renderRace) L2060
- HUD: lap/time readout inside updateRace L2041 - big center message (bigMsg) L1844 - race step (updateRace) L1944
- Sounds: audioInit L1710 - sfx L1731 - music mix by speed (musRaceMix) L1769
- Test hooks: window.__erc L2336 - REALITY hook (window.__reality, go/time/speed) L2347

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
- 2026-10-22: report has no 'OWNER CHECK IN 30 SECONDS: <test link> - <what to look at>' line (G-176)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
