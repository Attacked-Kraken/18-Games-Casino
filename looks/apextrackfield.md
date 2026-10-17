# Look board — Track & Field (`apextrackfield.html`)

Read this before every job on Track & Field. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apextrackfield.mjs`.

**Lighting preset:** `look-presets.js` → `track` (use the same one in the game and in tools/model-viewer.html).

## MUST
- A college track stadium with seating all the way around the oval
- Realistic human athletes (real models), legs and arms clearly moving when they run

## NEVER
- No capsule / stick figures
- No athletes gliding with still legs
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- Add running lanes and move camera angel back 10 blocks and up 15 blocks and centered behind player.
- Make camera angel always right behind player. And make the runners 3D humans from the studio. Make lanes for each tracker runner 1-7 and make finish line banner or floor marking to cross.

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
