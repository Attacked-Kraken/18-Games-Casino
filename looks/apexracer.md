# Look board \u2014 Exotic Racer Club (`apexracer.html`)

## WHERE THINGS ARE (apexracer.html - line numbers on main of Oct 24, 2026, after the owner garage-options fix; keep current per STUDIO-STANDARD 9.7)
- Menu / turntable: menu home + showroom orbit (toMenu) L2260 - menu refresh (refreshMenu) L2253 - turntable spin + garage camera (updateGarage) L2468 - frame loop L2491
- Garage: openGarage L2340 - garage cards and buying (renderGarage) L2350 - the shown car (setGarageCar) L1373
## WHERE THINGS ARE (apexracer.html - line numbers on main of Oct 24, 2026, after G-313 fix 1; keep current per STUDIO-STANDARD 9.7)
- Menu / turntable: menu home + showroom orbit (toMenu) L2260 - menu refresh (refreshMenu) L2253 - turntable spin + garage camera (updateGarage) L2468 - frame loop L2491
- Garage: openGarage L2340 - garage cards and buying (renderGarage) L2350 - the shown car (setGarageCar) L1373
- Car data: model registry (GLB_MODELS) L295 - skinned-pose bake (bakeSkins) L302 - car stats (CARS) L343 - places (PLACES) L402 - paint material (paintMat) L682 - computer-car paints stay bright (brightPaint) L570
- Car building: name wrap (addNameWrap) L993 - real-model car builder (makeGlbCar) L1099 - window tint table (TINTS, inside makeGlbCar) L1110 - bought options built onto the car: measured wheel hubs + real 3D rim wheels (G-345) + calipers + underglow + aero wing + body kit (inside makeGlbCar) L1187 - its lamp glow lies on the measured body surface (lampSurf, inside makeGlbCar) - car entry + real-model swap (makeCar) L1279
- World and race setup: world build in slices (buildWorld) L1483 - scenery keeps off the road (skirtClear, inside buildWorld) - finish-line sign text (drawSign/setSign) L521 - race setup (setupRace) L1979 - grid camera inside setupRace L2013 - race start guards (PR #1023: startRace ignores a second start while loading) - race start (startRace) L2291
- Driving physics: player car (stepPlayer) L2028
- AI: stepAI L2073 - G-70 gap band + the G-270 pace cap (58% of player pace) at L2078
- Traffic: stepTraffic L2107 - headlight pool follow (posePool) L2117 - car posing (poseCar) L2118
- Camera: chase camera inside updateRace L2126 - race render (renderRace) L2242
- HUD: lap/time readout inside updateRace L2126 - big center message (bigMsg) L2026 - race step (updateRace) L2126
- Sounds: audioInit L1844 - sfx L1868 - engine kit + engine sound (engineSnd) L1890 - music mix by speed (musRaceMix) L1949
- Test hooks: window.__erc L2519 - REALITY hook (window.__reality, go/time/speed) L2530 - ?test=night owner link at boot L2517

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
- 2026-10-23: the engine sound is a thin high-pitched whine, not an engine - the kit loops must play slow (playback rate never above 0.8) through a lowpass so the car growls deep (G-240)
- 2026-10-24: the field is as fast as the player, so he can never lap anyone - all cars must be fast AND the player's car must lap the whole field (G-270)
- 2026-10-24: a garage option is sold that the car never shows - every tab's chosen style must be ON the car in the garage and in races: underglow, caliper colour, window tint, spoiler, body kit, rim style and rim colour (owner)
- 2026-10-25: garage rims are a flat sticker on the wheel - a zero-depth drawn disc (measured 0.000 m thick, 30 vertices) instead of real 3D rim geometry with depth, sized to the wheel (G-345)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
