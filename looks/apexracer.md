# Look board \u2014 Exotic Racer Club (`apexracer.html`)

## WHERE THINGS ARE (apexracer.html - line numbers on main of Oct 26, 2026, after G-371; keep current per STUDIO-STANDARD 9.7)
- Menu / turntable: menu home + showroom orbit (toMenu) L2343 - menu refresh (refreshMenu) L2336 - turntable spin + garage camera (updateGarage) L2551 - frame loop L2574
- Garage: openGarage L2423 - garage cards and buying (renderGarage) L2433 - the shown car (setGarageCar) L1398 - rims lab, Classic 5 + the five fetched wheels side by side (showRims/hideRims, G-371; the fetched-wheel loader loadRimLib L337 + RIM_FILES L335, the fit helper fitFetchedWheel L1413) L1431
- Car data: model registry (GLB_MODELS) L295 - skinned-pose bake (bakeSkins) L302 - car stats (CARS) L348 - places (PLACES) L407 - paint material (paintMat) L687 - computer-car paints stay bright (brightPaint) L579
- Car building: name wrap (addNameWrap) L998 - rim builder shared by the cars and the lab (procRim) L1105 - real-model car builder (makeGlbCar) L1122 - window tint table (TINTS, inside makeGlbCar) L1133 - bought options built onto the car: measured wheel hubs + real 3D rim styles + Wheel Size lift (G-345) + calipers + underglow + aero wing + body kit (inside makeGlbCar) L1210 - its lamp glow lies on the measured body surface (lampSurf, inside makeGlbCar) - car entry + real-model swap (makeCar) L1304
- World and race setup: world build in slices (buildWorld) L1566 - scenery keeps off the road (skirtClear, inside buildWorld) - finish-line sign text (drawSign/setSign) L526 - race setup (setupRace) L2062 - grid camera inside setupRace L2096 - race start guards (PR #1023: startRace ignores a second start while loading) - race start (startRace) L2374
- Driving physics: player car (stepPlayer) L2111
- AI: stepAI L2156 - G-70 gap band + the G-270 pace cap (58% of player pace) at L2161
- Traffic: stepTraffic L2190 - headlight pool follow (posePool) L2200 - car posing (poseCar) L2201
- Camera: chase camera inside updateRace L2209 - race render (renderRace) L2325
- HUD: lap/time readout inside updateRace L2209 - big center message (bigMsg) L2109 - race step (updateRace) L2209
- Sounds: audioInit L1927 - sfx L1951 - engine kit + engine sound (engineSnd) L1973 - music mix by speed (musRaceMix) L2032
- Test hooks: window.__erc L2602 - REALITY hook (window.__reality, go/time/speed) L2613 - ?test=night / ?test=rim / ?test=rims owner links at boot L2600

Read this before every job on Exotic Racer Club. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexracer.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## MUST
- Cars match the owner's photo: wheels and rims exactly as in the picture (e.g. white rims)
- Night exposure keeps every car's shape readable - lights never blow a car out to a white blob
- Every computer car shows its body in every city, day and night - computer paints are never near-black (owner, Oct 22 2026)

## REFERENCES
- https://www.motorsport.com/f1/photos/ - broadcast-angle race photography: car stance, liveries and wheels at speed
- https://www.fiawec.com - endurance night racing: headlight glow, pit venues, cars under floodlights
- https://www.singaporegp.sg - the night street circuit: barriers, floodlights, city venue
- https://www.imsa.com - North American endurance and street racing: venues and car presentation
- Best console example: https://www.gran-turismo.com/us/products/gt7/ - the garage and showroom standard for car and wheel presentation
- Direct pictures (the Mac mini downloads these to compare with the robot's recordings; also in looks/refs/apexracer.md):
- Broadcast / chase-camera view - Formula E race action at trackside, cars at speed in a pack - https://upload.wikimedia.org/wikipedia/commons/1/19/EFLT_PueblaEPrix2021-7.jpg
- True-proportion side view - a sports car in pure side profile, wheels and stance at real scale - https://upload.wikimedia.org/wikipedia/commons/e/e1/1968_AMC_AMX_silver_red_interior_343_V8_console_auto_at_2025_AMO_3of6.jpg
- Gear close-up - an alloy wheel face in close-up, spokes and barrel as real 3D shape - https://upload.wikimedia.org/wikipedia/commons/2/23/BMW_Alpina_alloy_wheel.jpg
- Venue - a night street circuit under city lights (Singapore Grand Prix) - https://upload.wikimedia.org/wikipedia/commons/f/f0/1_singapore_f1_night_race_2012_city_skyline.jpg
- Best-in-class game example - Gran Turismo 7 official key art, the console bar for car presentation - https://www.gran-turismo.com/images/c/i101nzxi8307fO.jpg

## MUST MATCH
- proportions: real car and wheel proportions - the wheel diameter reads true against the body, no cartoon stretch
- camera height: the chase camera rides low, near kerb height, never a top-down toy view
- gear silhouette: cars and wheels read by silhouette first - a rim design shows as a shape, not a texture
- motion weight: the car leans and dives with its weight - braking dive, cornering roll, never floating

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
- 2026-10-25: the rim colour repaints the whole wheel, and the brake caliper floats on the wheel face - the colour may tint only the rim itself (never the tyre, caliper or hub), and the caliper must sit behind the rim's face plane measured from the fitted rim's own depth, not the tyre's width (G-355)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
