# LESSONS.md — mistakes we already made (read before EVERY job)

Owner: Mr. Cruz. This is the factory's memory. Every time the owner gives a 👎, or a game check / fix test fails,
the Muse doing that job adds ONE line here: **the mistake → the rule that stops any Muse repeating it.**
Never delete a line. Never repeat a mistake that is listed here. Newest at the bottom.

Format: `- YYYY-MM-DD · game · mistake → rule`

## Lessons so far

- 2026-10-16 · all · Said "fixed" / "live" before looking at the game check pictures → never say done until you have SEEN it in the game check; say "merged, NOT yet seen".
- 2026-10-16 · all · A Muse rewrote MODELS.md and tools/model-viewer.html while doing one model → only ADD your own entry; never rewrite shared files or other people's entries.
- 2026-10-16 · all · Two MODELS.md entries used the same id (hockey-skater) → every model id must be unique; check before adding one.
- 2026-10-16 · all · Showed the owner drawings / mockups instead of the real thing → the owner only judges the real model in the viewer or the real game in the game check pictures.
- 2026-10-16 · motorcycle · Main bike was code-built from simple shapes and the owner said "Fix." → hero models (the thing the player drives or controls) must be a real CC0 3D model (ASSET-LAW.md), not boxes and cylinders.
- 2026-10-16 · monster truck · Smashable cars and objects were too small, jumps floated, no music, weak engine sound → use real-world sizes (a car is ~4.5 m long next to a 3.7 m tall truck), real gravity (9.8 m/s², faster fall than rise), music on by default and a deep engine sound that rises with speed.
- 2026-10-16 · soccer · Players didn't steal the ball or play like real soccer and the stadium looked wrong → AI players must tackle, mark, pass and keep positions per rules/ ; build stadiums from venues/ spec sheets with real sizes.
- 2026-10-16 · all · Jobs were started without a reference picture or a DONE MEANS list → no job starts until you have both; each DONE MEANS line becomes a fix test first.
- 2026-10-16 · motorcycle · Owner rejected the bike again: "use a real 3D bike, not shapes" — v1 wore its primitives in plain sight (box frame, sphere tank, cone nose) → if no CC0 .glb exists and you must code-build a hero model, sculpt EVERY visible surface (lathe/extrude/tube); a single raw box/sphere/cone as bodywork is an instant 👎.
- 2026-10-16 · motorcycle · Owner: "bike needs solid frame not hollow, rider needs to be human" — v2 had thin tube spars you could see through and a capsule-mannequin rider → hero vehicle frames must be chunky solid beams (extruded spars, not tubes), and riders need human taper (lathe torso, neck, real helmet, tapered limbs) — if it reads as a robot, it's a 👎.
- 2026-10-16 · all · Hero models were code-built from shapes because only CC0 was allowed → CC-BY models are now allowed with credits (ASSET-LAW.md Part III); use a real model and log it in ASSETS.md.
- 2026-10-16 · monster truck · Owner said objects were too small; a Muse SHRANK THE TRUCK instead → never fix "too small" by shrinking the hero; scale the world around it to real sizes.
- 2026-10-16 · all · Games scored 100/100 while broken because the robot only checks that they run → passing the robot is not "good"; the art director grade and the owner's verdict decide.
- 2026-10-16 · soccer (JOB J6 fix tests) · The fix tests shared a top-level helper that the game-check runner cannot see inside h.eval functions (it ships the function source, not its closure), so tests crashed with 'sc is not defined' and judged nothing -> every h.eval function must be fully self-contained, and a shipped fix-test file must be run through the real (page, h) interface locally before it is pushed.
