# Look board — Exotic Racer Club (`apexracer.html`)

## WHERE THINGS ARE (apexracer.html - line numbers on main of Oct 22, 2026, after G-206; keep current per STUDIO-STANDARD 9.7)
- Menu / turntable: menu home + showroom orbit (toMenu) L2107 - menu refresh (refreshMenu) L2100 - turntable spin + garage camera (updateGarage) L2315 - frame loop L2338
- Garage: openGarage L2187 - garage cards and buying (renderGarage) L2197 - the shown car (setGarageCar) L1268
- Car data: model registry (GLB_MODELS) L294 - skinned-pose bake (bakeSkins) L301 - car stats (CARS) L339 - places (PLACES) L402 - paint material (paintMat) L668 - computer-car paints stay bright (brightPaint) L558
- Car building: name wrap (addNameWrap) L979 - real-model car builder (makeGlbCar) L1085 - its lamp glow lies on the measured body surface (lampSurf, inside makeGlbCar) - car entry + real-model swap (makeCar) L1174
- World and race setup: world build in slices (buildWorld) L1378 - scenery keeps off the road (skirtClear, inside buildWorld) - race setup (setupRace) L1827 - grid camera inside setupRace L1861 - race start guards (PR #1023: startRace ignores a second start while loading) - race start (startRace) L2138
- Driving physics: player car (stepPlayer) L1875
- AI: stepAI L1920 - G-70 gap band + the G-123 player-pace cap on top
- Traffic: stepTraffic L1954 - headlight pool follow (posePool) L1964 - car posing (poseCar) L1965
- Camera: chase camera inside updateRace L2041-2024 - race render (renderRace) L2089
- HUD: lap/time readout inside updateRace L2070 - big center message (bigMsg) L1873 - race step (updateRace) L1973
- Sounds: audioInit L1739 - sfx L1760 - music mix by speed (musRaceMix) L1798
- Test hooks: window.__erc L2366 - REALITY hook (window.__reality, go/time/speed) L2377 - ?test=night owner link at boot L2364

Read this before every job on Exotic Racer Club. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexracer.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## MUST
- Cars match the owner's photo: wheels and rims exactly as in the picture (e.g. white rims)
- Night exposure keeps every car's shape readable - lights never blow a car out to a white blob
- Every computer car shows its body in every city, day and night - computer paints are never near-black (owner, Oct 22 2026)

## NEVER
- No car missing its wheels
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- No untextured bars or stray parts on a car - every part on the car belongs to the car
- No gameplay or proof camera inside a car
- No mountain, mesa or volcano skirt within reach of the road - tall scenery keeps its distance from the track (owner, Oct 22 2026)
- 2026-10-22: report has no 'OWNER CHECK IN 30 SECONDS: <test link> - <what to look at>' line (G-176)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
