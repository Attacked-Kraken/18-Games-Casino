# Look board \u2014 Exotic Racer Club (`apexracer.html`)

## WHERE THINGS ARE (apexracer.html - line numbers on main of Oct 24, 2026, after the owner garage-options fix; keep current per STUDIO-STANDARD 9.7)
- Menu / turntable: menu home + showroom orbit (toMenu) L2279 - menu refresh (refreshMenu) L2272 - turntable spin + garage camera (updateGarage) L2487 - frame loop L2510
- Garage: openGarage L2359 - garage cards and buying (renderGarage) L2369 - the shown car (setGarageCar) L1392
## WHERE THINGS ARE (apexracer.html - line numbers on main of Oct 24, 2026, after G-313 fix 1; keep current per STUDIO-STANDARD 9.7)
- Menu / turntable: menu home + showroom orbit (toMenu) L2279 - menu refresh (refreshMenu) L2272 - turntable spin + garage camera (updateGarage) L2487 - frame loop L2510
- Garage: openGarage L2359 - garage cards and buying (renderGarage) L2369 - the shown car (setGarageCar) L1392
- Car data: model registry (GLB_MODELS) L295 - skinned-pose bake (bakeSkins) L302 - car stats (CARS) L343 - places (PLACES) L402 - paint material (paintMat) L682 - computer-car paints stay bright (brightPaint) L570
- Car building: name wrap (addNameWrap) L993 - real-model car builder (makeGlbCar) L1099 - window tint table (TINTS, inside makeGlbCar) L1110 - bought options built onto the car: measured wheel hubs + real 3D rim styles + Wheel Size lift (G-345) + calipers + underglow + aero wing + body kit (inside makeGlbCar) L1187 - its lamp glow lies on the measured body surface (lampSurf, inside makeGlbCar) - car entry + real-model swap (makeCar) L1298
- World and race setup: world build in slices (buildWorld) L1502 - scenery keeps off the road (skirtClear, inside buildWorld) - finish-line sign text (drawSign/setSign) L521 - race setup (setupRace) L1998 - grid camera inside setupRace L2032 - race start guards (PR #1023: startRace ignores a second start while loading) - race start (startRace) L2310
- Driving physics: player car (stepPlayer) L2047
- AI: stepAI L2092 - G-70 gap band + the G-270 pace cap (58% of player pace) at L2097
- Traffic: stepTraffic L2126 - headlight pool follow (posePool) L2136 - car posing (poseCar) L2137
- Camera: chase camera inside updateRace L2145 - race render (renderRace) L2261
- HUD: lap/time readout inside updateRace L2145 - big center message (bigMsg) L2045 - race step (updateRace) L2126
- Sounds: audioInit L1863 - sfx L1887 - engine kit + engine sound (engineSnd) L1909 - music mix by speed (musRaceMix) L1968
- Test hooks: window.__erc L2538 - REALITY hook (window.__reality, go/time/speed) L2549 - ?test=night owner link at boot L2536

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
- 2026-10-25: the Rims style buttons do nothing on a real car, and wheel size is not a choice - every style must be real 3D geometry on the car (Mesh = the owner's locked fetched wheel in its own finish), and a bigger wheel size must lift the car so it rides higher (G-345)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
