# Look board — Track & Field (`apextrackfield.html`)

Read this before every job on Track & Field. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apextrackfield.mjs`.

## WHERE THINGS ARE (apextrackfield.html - line numbers, kept current per job)
- Stage portrait rotation (the sideways box): line 21 - screens/panels CSS: lines 29-52
- Compact menu for short boxes incl. the G-122 portrait rule: lines 33-53 (media query line 41)
- Touch layer (stick / TAP RUN / ACTION): line 172 - menu markup: line 178 - event grid (#grid, BACK button bGridBack renders at the TOP of the panel via CSS order - DOM-last on purpose: the robot's '#grid button' start step must hit the first event): lines 209-215 - career screen: line 244
- fitGame (sizes renderer + camera to the turned box): line 340 - audio (AudioSys): line 391
- Live engine pointer ENG: line 792
- Live race camera (G-267): followCam() line 2541 (records the followed runner's world position into ENG.r.ox/oz, so the wall check rays at the runner) - clampCamXZ() line 2531 (R 46.0, inside the bowl's ~47.5 m inner wall) - guard never-g-267-p1
- Distance stride rate cap (G-267 r1): createDistanceEngine stride (impulse pre-scaled past 12 strides/game-s) - guard never-g-267-p2; 300m hurdles hCount 7 (event line) - guard never-g-267-p3
- Relay changeover zones (G-249 r2): buildRelayZones() line 2564 (30 m of track per lane, walked along each lane's line) - frame() retry line 3718 (builds them if the race attach was skipped on a slow load; scene-gated since G-289: the scene exists at boot, the full load does not) - guard never-g-249-p3; sprint swing: real-sprint-animation sampling hardened to 30x250ms (full cycle) + guard never-g-249-p2 - zone-at-start guard never-g-289-p1
- Sprint wind (G-289): createSprintEngine wind field line 806 (-3.0..+3.0 m/s per race) - getResult 'w' mark + Wind reading lines 858-860 - finishEvent wind-aided best exclusion line 3197 - guard never-g-289-p2
- Jump timing controls (G-249 r1): long jump angle sweep line 1217 (55 deg/s, no run-on/foul while setting it) - triple jump quality curve line 1265, marker rate line 1292 (1.0/s), drawn green line 2798 - high jump / pole vault green half-width line 1351 (gw 0.20-0.24), bar sweep line 1381 (0.75/s) - TESTLINK (?test= link event, G-171): line 793 - sprint start hold (G-244, field waits on the line; line numbers may have moved, search "start hold"): lines 834-836 - hurdles test-link countdown framing: line 2677 - results finishCommon: line 3195 - results exit wiring (bResMenu: free play returns to the event grid): line 3557 - ?test= boot hook: line 3664 - race frame loop frame(): line 3670 - REALITY hook: line 3735 - test hooks (__tf): line 3745

## KEEP — LOCKED (owner checked JOB J7, 2026-10-17: HE LIKES IT — no Muse may change it)
The owner, word for word: "how it looks and how it runs now - the stadium, crowd, track, runners, sharp picture, start camera"
- The stadium and the crowd exactly as they are (the venue is also LOCKED in MODELS.md as track-stadium)
- The track exactly as it is (true 400 m oval, 8 lanes, real-geometry lane lines, finish line + FINISH banner)
- The runners exactly as they are (studio 3D humans, real Sprint/Jog/Crouch run cycles, upright sprinting)
- The sharp picture exactly as it is (pixel ratio min(devicePixelRatio, 1.5), never lowered)
- The start camera exactly as it is (7 m behind the runner, 2.8 m up, looking 10 m ahead, clamped inside the stadium)
LOCKED means locked: change NOTHING this section protects. A play test (`keep-locked-look`) guards it.
If a fix seems to need a KEEP thing changed, ask the owner first.

**Lighting preset:** `look-presets.js` → `track` (use the same one in the game and in tools/model-viewer.html).

## MUST
- A college track stadium with seating all the way around the oval
- Realistic human athletes (real models), legs and arms clearly moving when they run
- JOB J39 (owner, 2026-10-17): career mode must never stall
- JOB J39 (owner, 2026-10-17): holding the stick must never block TAP RUN / HURDLE - two thumbs at once
- JOB J39 (owner, 2026-10-17): held upright the game fills the WHOLE screen sideways (the robot fails under 90%)
- JOB J7 keep-it (owner, 2026-10-17): CAREER MODE - every career level must load, play and unlock the next
- JOB J7 keep-it (owner, 2026-10-17): no button may ever block TAP RUN - on the long relay / long races a RED button turns on and blocks running; holding the stick never blocks TAP RUN either
- JOB J7 keep-it (owner, 2026-10-17): DISCUS is ONE simple action - hold to spin, release to throw, like a real thrower (at most 2 taps) - and the camera shows the thrower clearly from behind/side, never hidden behind the power bar
- JOB J42 (owner, 2026-10-17): DEV-ONLY "Skip level" button in career/season/tournament modes - only when the address has dev=1, NEVER without; it wins the current level and moves to the next, saving like a real win (STORE-READY.md "Developer skip")
- JOB J42 (owner, 2026-10-17): 1500 m and every long race - the camera stays LOW behind the player's runner and follows him around the whole track, never up over the stands where he is a speck
- JOB J42 (owner, 2026-10-17): DISCUS (and shot put, javelin) - after the throw, the camera follows the implement through the air and shows its landing marker
- Hurdle heights are the real ones, measured in the robot run: 0.914 m (300/400 m hurdles), 0.838 m (100 m hurdles); the steeplechase barrier is 0.914 m and spans all lanes in one beam
- Results screens show ONE table, athletes under the ATHLETE heading, and marks that match the race clock

## NEVER
- 2026-10-24: the relay changeover-zone markings are not found in the relay event on a slow load - the zones were built only when the full 3D load finished (W3D.ready), so a 5 s poll found nothing; the zones paint at race start on the scene alone (G-289)
- 2026-10-24: a tailwind over +2.0 m/s still counts as a record - the sprint engine had no wind at all; every sprint race now carries a wind reading, a wind-aided time shows "w" and is never saved as a best (G-289)
- 2026-10-24: mashing the run controls faster than any human cadence makes the player faster in the 10,000m - stride input past the 12th in a game-second window is pre-scaled in the distance engine, so 60 strides/s cannot outrun honest pace (G-267)
- 2026-10-24: the 300m hurdles has 8 hurdles per lane - the real 300m hurdles has 7 (45 m to the first, 35 m apart, last at 255 m) (G-267)
- 2026-10-24: the live race camera has a wall between it and the runner in 1 of 4 samples - the wall check ray targeted the infield centre, not the runner, because ENG.r.ox/oz were never written; the camera itself stays inside the stadium (clamp 46.0 m, inside the bowl's ~47.5 m inner wall) and its ray must land on the runner it follows (G-267)
- Owner 2026-10-21: "racers so far back into the wall stands" - the field always starts ON the painted track; sprint/hurdles starts sit on the oval (visS), never on a straight-line extension past the track's end (guarded by play-racers-start-on-the-track).
- 2026-10-22: the 300m and 400m hurdles stand 1.07 m - hurdles stand at their REAL heights: 100m 0.838 m, 300m/400m 0.914 m, 110m 1.067 m (G-122)
- 2026-10-22: menu buttons under the 44x44 touch target (36px/30px tall in the compact menu) (G-139)
- 2026-10-22: feet sink into the ground - the run clips' stance sole dives up to 0.16 m under the track; the run-mode ground trim holds it on the ground line (G-139)
- 2026-10-22: feet still sink at the marks and in the SET crouch (robot 16 of 24 after the first fix) - the ground trim is constant in every state, and the guard test samples the standing start too (G-139)
- 2026-10-22: a hurdle is two full-size boards crossed at 90 degrees - one board per hurdle, facing the runner (G-160)
- 2026-10-22: hurdles facing the wrong way - the boards stand edge-on to the runners (dot(normal, lane tangent) 0.00); a hurdle's front face faces the approaching runner (dot -1.00) (G-174)
- 2026-10-23: relay baton pass refused for most of the exchange zone - the receiver's run-up left the gap at 7.6-8.7m when the carrier reached the zone and PASS said RECEIVER TOO FAR until the last metres (44 of 45 taps refused with a slower carrier); a fumbled exchange then capped the next carrier at 3.2 m/s so the leg crawled - the owner: ran past the receiver, could not pass it and got stuck; the pass must work from the start of the zone (G-193)
- 2026-10-24: the sprint-animation check read a 0.43 rad thigh swing on the robot while the same clip measures 1.85+ rad over a full cycle - the old 7x200ms wall window covered only ~0.5s of animation on the ~3fps robot (mixer advances on visual dt clamped to 0.12s a frame); judge the swing over a full cycle, never over a wall-clock slice (G-249)
- 2026-10-24: the relay changeover zone is not 30 m - the painted green zone markings spanned 20.08 m on average (17.3-21.2 m), and on a slow load they were not found at all; the zone is 30 m of track per lane, painted at the end of each leg (G-249)
- 2026-10-23: jumping too hard to control - the tap had to land in a tiny green window on the timing bar (high jump green 0.10-0.22 of the bar, about 0.1-0.2 s), the long jump angle swept at 95 deg/s and you fouled running past the line while setting it, the triple jump marker ran at 1.6/s - jumping needs much more user-friendly controls (G-249)
- No capsule / stick figures
- No athletes gliding with still legs
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- Add running lanes.
- Make the runners 3D humans from the studio. Make lanes for each tracker runner 1-7 and make finish line banner or floor marking to cross.
- Camera 7 m behind the player's runner along the lane direction (it follows the lane around the curves), 2.8 m up, looking at a point 10 m ahead of the runner; it never goes behind the start line into the stands or through any wall - clamp it inside the stadium.
- No field starting on the finish line, and nobody starting metres ahead at full speed - the whole field starts together on its own start line, staggered where the event is staggered

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).

## JOB J7 additions (owner's job board, 2026-10-16)
- Runners run with the REAL UAL run cycles (Sprint_Loop at speed, Jog_Fwd_Loop cruising, Crouch_Idle_Loop at SET) - upright like real sprinters, natural arm and leg drive; never hand-posed sine bones while a run clip exists
- Runners wear the track singlet kit (tank + racing shorts + white spikes) - never a soccer kit
- Real 400 m oval: kerb radius 36.5 m, lane 1 measure line 36.8 m (400.00 m lap), 8 lanes of exactly 1.22 m, lane 1 innermost, painted lines on the true lane boundaries
- Staggered starts for 200 m / 400 m / 400 m hurdles; every runner in his OWN lane; all lanes share the one finish line
- A real college bowl from the shared stadium kit: seating all the way around the oval, 2 tiers, 40,000-60,000 seats, 30,000+ fans, canopy roof with a floodlight ring, 2 end screens
- Starting blocks at every sprint / hurdle start, placed at the lanes and marks actually raced (including staggered marks)
