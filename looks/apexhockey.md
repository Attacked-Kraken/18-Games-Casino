# Look board — Ice Hockey (`apexhockey.html`)

Read this before every job on Ice Hockey. The owner says each thing ONCE; it lives here forever.
**This board sits on top of `STUDIO-STANDARD.md`. Read that first.**
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexhockey.mjs`.

**Lighting preset:** `look-presets.js` → `rink` (use the same one in the game and in tools/model-viewer.html).

## MUST
- Real skater models (a .glb from MODELS.md), not players built from boxes and tubes
- Own team names, colors and numbers (no NHL teams or real players)
- Back numbers read the right way round (not mirrored)
- Face visible through the cage
- The robot's face close-up is the proof: visor or open cage fitted, the face readable through it, and the full name and number readable from behind
- Owner's model sheet (2026-10-16): about 7.5 head heights; forward lean 15-20 deg; knee flex 25-30 deg; hips back over
  the heels; wide stance; helmet with visor; shoulder pads (bulk); oversized gloves; padded breezers; shin guards
  under the socks; skates with steel blades. Build players with the shared kit (`characters/base-human-v2/gear.js`,
  `hockeyKit`). The numbers are tests in `tools/game-check/fixes/apexhockey.mjs`.
- Stick held in both hands, blade flat on the ice; the puck rides the blade
- The arena follows `venues/rink.md`, and the game follows `rules/hockey.md`

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
- 2026-10-23: blades stay level in every direction - pitch AND roll measured and levelled, standing and skating, or the plate tips sideways up toward the leg (owner video)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
