# Look board — Exotic Racer Club (`apexracer.html`)

## WHERE THINGS ARE (apexracer.html - line numbers on main of Oct 23, 2026, after G-207 fix 1; keep current per STUDIO-STANDARD 9.7)
- Menu / turntable: menu home + showroom orbit (toMenu) L2131 - menu refresh (refreshMenu) L2124 - turntable spin + garage camera (updateGarage) L2339 - frame loop L2362
- Garage: openGarage L2198 - garage cards and buying (renderGarage) L2221 - the shown car (setGarageCar) L1278
- Car data: model registry (GLB_MODELS) L294 - skinned-pose bake (bakeSkins) L301 - car stats (CARS) L339 - places (PLACES) L402 - paint material (paintMat) L678 - computer-car paints stay bright (brightPaint) L570
- Car building: name wrap (addNameWrap) L989 - real-model car builder (makeGlbCar) L1095 - its lamp glow lies on the measured body surface (lampSurf, inside makeGlbCar) - car entry + real-model swap (makeCar) L1184
- World and race setup: world build in slices (buildWorld) L1388 - scenery keeps off the road (skirtClear, inside buildWorld) - finish-line sign text (drawSign/setSign) L517 - race setup (setupRace) L1850 - grid camera inside setupRace L1884 - race start guards (PR #1023: startRace ignores a second start while loading) - race start (startRace) L2162
- Driving physics: player car (stepPlayer) L1899
- AI: stepAI L1944 - G-70 gap band + the G-123 player-pace cap on top
- Traffic: stepTraffic L1978 - headlight pool follow (posePool) L1988 - car posing (poseCar) L1989
- Camera: chase camera inside updateRace L1997 - race render (renderRace) L2113
- HUD: lap/time readout inside updateRace L1997 - big center message (bigMsg) L1897 - race step (updateRace) L1997
- Sounds: audioInit L1749 - sfx L1770 - music mix by speed (musRaceMix) L1821
- Test hooks: window.__erc L2390 - REALITY hook (window.__reality, go/time/speed) L2401 - ?test=night owner link at boot L2388

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
- 2026-10-23: the finish-line sign says Finish at the wrong time - it must say START on lap 1, the completed/total count (1/3, 2/3) on the laps between, and Finish ONLY on the last lap (G-207)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
