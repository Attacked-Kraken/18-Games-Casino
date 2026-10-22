# Look board — Baseball (`apexbaseball.html`)

Read this before every job on Baseball. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexbaseball.mjs`.

## WHERE THINGS ARE (`apexbaseball.html`, line numbers as of G-144)

- **Menus:** overlays in the HTML — `#loadOv` 179, `#startOv` 188, `#helpOv` 199, `#friendOv` 213, `#endOv` 226; `startGame()` 1477; the start menu opens only after the ballpark has loaded (loading gate).
- **Controls:** pitch UI + `#aimPad` in the HTML (~150–170); aim-pad input ~1520–1558 (drag tracked by pointer id, `resetInput()` 1550); flow is pick a pitch → THROW → aim on the pad → THROW → LOCK (`beginAim()` 803, `beginWindup()` 804).
- **Camera:** `PITCHER_VIEW` / `BATTER_VIEW` 304–305 (one TV broadcast camera, FOV 42); view pick `setCam()` 1288; `#viewBtn` 132 cycles auto/wide/close.
- **Players:** `TEAMS` 259; `FIELD_POS` 473; `dressDefense()` 488; `attachAthlete()` 583 (the `window.__reality` hook is set there, 655; the G-100 trot driver sits just above it, 565–582); `fitAthletes()` 664; `athleteTick()` 674 (Idle/Walk/Jog/Sprint picked from measured speed).
- **AI / rules:** `PITCHES` 768, `ZONE` 773; `deliverPitch()` 836; count — `resetCount()` 934, `onWalk()` 959, `onStrikeout()` 972; `stepMovers()` 1420 (fielders chase, runners run); main `loop()` 1333.
- **HUD:** `#scoreboard` 138; top-right cluster `#viewBtn` / `#muteBtn` / `#helpHud` 132–134 (fixed widths, 8 px gaps).
- **Sounds:** owner's kit samples via `Mus.loadKit()` 1760 (called from `Mus.init()` 1728) — bat crack / glove / big cheer / ambience from `sounds/stadium/baseball/`, synth voices as fallback; played at contact and results (917, 1199–1226: crack, pop, cheer, riff); crowd excitement via `crowdExcite()`; kit state exposed as `__test.kitAudio` 2053.
- **Venue:** old park built in `buildField()` 327 (`VENUE_FROM` 326, `oldParkMeshes` 431, hidden once the model loads); Night Ballpark loader 1948 (`kit/stadiums/Night-Ballpark/stadium.glb` — night look, kit field re-skin and touch material lightening all happen there); kit field re-skin `kitFieldOnPark()` 1873 (G-144: the composed kit texture also lands on the field mesh's LIVE material — on touch the G-85 Lambert pass replaces the original before the async swap; live state is `__test.stadium.kitFieldLive`); `window.__test` 2044.

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
