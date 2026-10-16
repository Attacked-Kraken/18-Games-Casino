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

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
