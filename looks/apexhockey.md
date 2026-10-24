# Look board — Ice Hockey (`apexhockey.html`)

Read this before every job on Ice Hockey. The owner says each thing ONCE; it lives here forever.
**This board sits on top of `STUDIO-STANDARD.md`. Read that first.**
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexhockey.mjs`.

**Lighting preset:** `look-presets.js` → `rink` (use the same one in the game and in tools/model-viewer.html).

## WHERE THINGS ARE (apexhockey.html, line numbers as of G-266 round 1)
- Goal broadcast (G-266): #goalLight/#spotlights CSS 42-47, divs 128-129, goalFx() + lastGoalX after hideStatCard (~826), lit in onGoal(), cleared in faceoff() and gameOver(); the replay cuts live in stepCamera() (search 'REPLAY: two broadcast cuts').
- Crease paint (G-266): makeIceTexture's goal-creases arc bulges toward centre ice (in front of the goal line).
- Rink constants: GOAL_LINE/BLUE 191, PERIOD_LEN/DOTS 192-193; boards bounce in stepPuck, carried-puck clamp in stepPuck's owned branch (G-216).
- Test hook: window.__hk at 581, 718 and 776 (skaters, puck, game state getters/setters, newMatch); window.__reality 1725.
- Score + G-257 stat counters (statShots/statSaves/statFO): globals 767-768, reset at 782 in __hk.newMatch() (which also clears the OT bench marks).
- HUD 796; banner() 811; intermission stats card: CSS #statCard 39, div 123, showStatCard() 816, hideStatCard() 821.
- OT 3-on-3 (G-261): otLines()/otBenchRank 1090-1106, called at the top of faceoff() 1107; benched skaters (otOut, boxT 999, benchSpot) are held by aiSkater's bench branch, skipped by the puck grab in stepPuck and by nearestSkater; the golden goal already lived in onGoal() 1121 (period>3 ends the game).
- Skaters/AI: aiSkater 1161; faceoff positions in setupFaceoffPositions (above faceoff).
- Shooting: shootFrom() 993, shot record at 1003 (statShots counted there).
- Puck: stepPuck() 1431; the icing gate inside stepPuck (crossing detectors, hybrid race, BOARDSTOP, the shorthanded gate from G-228).
- Goalies: goalieSaves() 1563 (statSaves counted in its save branch); the crease push lives nearby.
- Camera: stepCamera() 1627 - broadcast/chase/close/face views.
- Blades: levelBlades() 1679 (per-foot measure + counter-rotate, two passes), snapSkatesToIce() 1711.
- Main loop: tick() ends 1744; the intermission branch (period end, showStatCard, 6 s break) 1769-1778.
- End screen: gameOver() 1795; career hub renderHub() 2004.
- Owner test scenes: ?test= parsing near the file end (intermission 2070).

## NEVER
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- "They gave me this": blob players, upright floating sticks, scattered bits (2026-10-16)
- "Why do I get offsides every time" (2026-10-17): AI teammates must hold the attacking blue line until the puck crosses it — never skate ahead of the puck into the zone
- No menu text clipped or overlapping at 844x390 - every line inside the frame
- 2026-10-22: skate blades pitched toe-down off the ice (owner screenshot) - blades must stay down flat on the ice (G-170)
- 2026-10-23: the puck never leaves the rink - the carrier standing at the end boards and at the side boards facing them with the puck on his stick must keep the puck inside the boards shell (G-216)
- 2026-10-23: blades flat in live play too, not just standing - the weight-bearing blade of a skating player lies flat on the ice, never pitched like a toe pick in the close camera (owner picture) (G-47 REDO)
- 2026-10-23: skates stay levelled while skating around also - a skating player's planted blade lies flat on the ice, not only when he is stopped (G-217)
- 2026-10-23: icing is never called against a shorthanded team - while one of the dumpers sits in the box the deep dump is legal and play carries on (G-228)
- 2026-10-23: the end-zone faceoff dots sit 6.7 m either side of centre (venues/rink.md) - 21.4 units, never back at 20 units / 6.13 m (G-228)
- 2026-10-23: the intermission between periods shows a stats card (shots, saves, faceoffs won) - never just the END OF PERIOD banner (G-257)
- 2026-10-24: Overtime is 3-on-3 - two skaters a side stay on the bench for the whole OT (otLines() in faceoff(); never-g-261-p2) (G-261)
- 2026-10-24: The puck never leaves the rink under boards pressure - the boards tests keep play alive between phases or they starve their own sampler (never-g-261-p1) (G-261)
- 2026-10-24: A goal brings the broadcast look - horn, crowd, the red goal light, spotlights and a replay cut to 2 angles during the goal state (goalFx() + stepCamera replay cuts; never-g-266-p1) (G-266)
- 2026-10-24: Each goal crease is painted IN FRONT of its goal - a light-blue semicircle r 1.83 m on the centre-ice side of the goal line, never behind it in the trapezoid (never-g-266-p2) (G-266)
- 2026-10-23: blades stay level in every direction - pitch AND roll measured and levelled, standing and skating, or the plate tips sideways up toward the leg (owner video)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
