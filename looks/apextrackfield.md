# Look board — Track & Field (`apextrackfield.html`)

Read this before every job on Track & Field. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apextrackfield.mjs`.

## WHERE THINGS ARE (apextrackfield.html - line numbers, kept current per job)
- Stage portrait rotation (the sideways box): line 21 - screens/panels CSS: lines 29-52
- Compact menu for short boxes incl. the G-122 portrait rule: lines 33-53 (media query line 41)
- Touch layer (stick / TAP RUN / ACTION): line 169 - menu markup: line 175 - event grid: line 206 - career screen: line 241
- fitGame (sizes renderer + camera to the turned box): line 337 - audio (AudioSys): line 388
- Live engine pointer ENG: line 789 - race frame loop frame(): line 3639 - REALITY hook: line 3704 - test hooks (__tf): line 3714

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
- Owner 2026-10-21: "racers so far back into the wall stands" - the field always starts ON the painted track; sprint/hurdles starts sit on the oval (visS), never on a straight-line extension past the track's end (guarded by play-racers-start-on-the-track).
- 2026-10-22: the 300m and 400m hurdles stand 1.07 m - hurdles stand at their REAL heights: 100m 0.838 m, 300m/400m 0.914 m, 110m 1.067 m (G-122)
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
