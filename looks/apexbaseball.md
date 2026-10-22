# Look board — Baseball (`apexbaseball.html`)

Read this before every job on Baseball. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexbaseball.mjs`.

## WHERE THINGS ARE (`apexbaseball.html`, line numbers as of G-100)

- **Menus:** overlays in the HTML — `#loadOv` 179, `#startOv` 188, `#helpOv` 199, `#friendOv` 213, `#endOv` 226; `startGame()` 1469; the start menu opens only after the ballpark has loaded (loading gate).
- **Controls:** pitch UI + `#aimPad` in the HTML (~150–170); aim-pad input 1512–1550 (drag tracked by pointer id, `resetInput()` 1542); flow is pick a pitch → THROW → aim on the pad → THROW → LOCK (`beginAim()` 795, `beginWindup()` 796).
- **Camera:** `PITCHER_VIEW` / `BATTER_VIEW` 304–305 (one TV broadcast camera, FOV 42); view pick `setCam()` 1280; `#viewBtn` 132 cycles auto/wide/close.
- **Players:** `TEAMS` 259; `FIELD_POS` 473; `dressDefense()` 488; `attachAthlete()` 583 (the `window.__reality` hook is set there, ~647; the G-100 trot driver sits just above it, 565–582); `fitAthletes()` 656; `athleteTick()` 666 (Idle/Walk/Jog/Sprint picked from measured speed).
- **AI / rules:** `PITCHES` 760, `ZONE` 765; `deliverPitch()` 828; count — `resetCount()` 926, `onWalk()` 951, `onStrikeout()` 964; `stepMovers()` 1412 (fielders chase, runners run); main `loop()` 1325.
- **HUD:** `#scoreboard` 138; top-right cluster `#viewBtn` / `#muteBtn` / `#helpHud` 132–134 (fixed widths, 8 px gaps).
- **Sounds:** kit sounds via `Mus.*` at contact and results (909, 1191–1210: crack, pop, cheer, riff); crowd excitement via `crowdExcite()`.
- **Venue:** old park built in `buildField()` 327 (`VENUE_FROM` 326, `oldParkMeshes` 431, hidden once the model loads); Night Ballpark loader 1932 (`kit/stadiums/Night-Ballpark/stadium.glb` — night look, kit field re-skin and touch material lightening all happen there); `window.__test` 2028.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## KEEP (owner, 2026-10-17 — LOCKED: no Muse may change anything under this section)
"everything that works and looks right now":
- The batting flow: aim → windup → swing → ball flight → fielding
- Three outfielders who chase and catch fly balls
- The batter clearly visible and lit
- Day lighting on the field (no green tint, no night-dark)
- Crowd that reacts (cheers on hits, excitement on home runs)
- Camera options (auto / wide / close views)
- Music: menu and game modes with working mute

## MUST
- A real stadium: grandstands, foul poles, day lighting
- Three outfielders visible who chase and catch fly balls
- The batter clearly visible and lit
- Realistic, not cartoonish
- The player's face is visible in every close-up: eyes and face uncovered, never hidden by mask or blob geometry
- Players wear the baseball uniform (cap or helmet, jersey, glove) in every picture, close-ups included

## NEVER
- No green dim / green tint on the game menu
- No night-dark field where you can't see the batter
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- No baseball stadium
- No covered or masked faces in close-ups, and no street clothes (T-shirts) on players

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
