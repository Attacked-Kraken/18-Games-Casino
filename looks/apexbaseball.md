# Look board — Baseball (`apexbaseball.html`)

Read this before every job on Baseball. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexbaseball.mjs`.

## WHERE THINGS ARE (`apexbaseball.html`, line numbers as of G-100)

- **Menus:** overlays in the HTML — `#loadOv` 179, `#startOv` 188, `#helpOv` 199, `#friendOv` 213, `#endOv` 226; `startGame()` 1469; the start menu opens only after the ballpark has loaded (loading gate).
- **Controls:** pitch UI + `#aimPad` in the HTML (~150–170); aim-pad input 1519–1557 (drag tracked by pointer id, `resetInput()` 1550); flow is pick a pitch → THROW → aim on the pad → THROW → LOCK (`beginAim()` 803, `beginWindup()` 804).
- **Camera:** `PITCHER_VIEW` / `BATTER_VIEW` 304–305 (one TV broadcast camera, FOV 42); view pick `setCam()` 1288; `#viewBtn` 132 cycles auto/wide/close.
- **Players:** `TEAMS` 259; `FIELD_POS` 473; `dressDefense()` 488; `attachAthlete()` 583 (the `window.__reality` hook is set there, ~655; the G-100 trot driver sits just above it, 565–582; the per-athlete sole lift sits right after the scale fit inside attachAthlete); `fitAthletes()` 664; `athleteTick()` 674 (Idle/Walk/Jog/Sprint picked from measured speed).
- **AI / rules:** `PITCHES` 768, `ZONE` 773; `deliverPitch()` 836; count — `resetCount()` 934, `onWalk()` 959, `onStrikeout()` 972; `stepMovers()` 1420 (fielders chase, runners run); main `loop()` 1333.
- **HUD:** `#scoreboard` 138; top-right cluster `#viewBtn` / `#muteBtn` / `#helpHud` 132–134 (fixed widths, 8 px gaps).
- **Sounds:** kit sounds via `Mus.*` at contact and results (917, 1199–1218: crack, pop, cheer, riff); crowd excitement via `crowdExcite()`.
- **Venue:** old park built in `buildField()` 327 (`VENUE_FROM` 326, `oldParkMeshes` 431, hidden once the model loads); Night Ballpark loader 1940 (`kit/stadiums/Night-Ballpark/stadium.glb` — night look, kit field re-skin and touch material lightening all happen there); `window.__test` 2036.

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

## NEVER
- No green dim / green tint on the game menu
- No night-dark field where you can't see the batter
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- No baseball stadium

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
