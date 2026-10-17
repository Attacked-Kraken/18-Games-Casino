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
