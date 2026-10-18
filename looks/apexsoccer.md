# Look board — Apex Soccer (`apexsoccer.html`)

Read this before every job on Apex Soccer. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexsoccer.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## MUST
- TEAM camera high and wide, most of the field visible, follows the ball sideline to sideline
- Clean kits
- Real stadium (JOB J6): stands all around in tiers, a roof over the stands, floodlights, 2 big screens, a 30,000+ crowd that moves - mostly home colours with a separate away end
- Computer players tackle and WIN the ball: a presser engages the carrier, a second man covers the lane, and clean tackles come away with possession
- Defenders mark men goal-side when the other team has the ball
- Teams keep their shape and SPREAD OUT - full width of the pitch, no bunching in the middle
- Teams pass and build up: the carrier finds the open man instead of only dribbling at goal
- Teams position by the ball: push up with it when attacking, drop goal-side of it when defending

## NEVER
- No white stripe on dark shorts
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- "Script error: Cannot read properties of undefined (reading 'pos')" / "undefined is not an object (evaluating 'mate.pos')" (2026-10-17): a `.find()` result must never be dereferenced without a guard — kickoff crashed on iPhone Safari when no MID matched

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
