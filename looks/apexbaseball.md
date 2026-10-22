# Look board — Baseball (`apexbaseball.html`)

Read this before every job on Baseball. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexbaseball.mjs`.

## WHERE THINGS ARE (`apexbaseball.html`, line numbers as of G-167)

- **Menus:** overlays in the HTML — `#loadOv` 179, `#startOv` 188, `#helpOv` 199, `#friendOv` 213, `#endOv` 226; `startGame()` 1531; the start menu opens only after the ballpark has loaded (loading gate).
- **Controls:** pitch UI + `#aimPad` in the HTML (~150–170); aim-pad input ~1567–1605 (drag tracked by pointer id, `resetInput()` 1597); flow is pick a pitch → THROW → aim on the pad → THROW → LOCK (`beginAim()` 850, `beginWindup()` 851).
- **Camera:** `FIELD_CAM` 302, `PITCHER_VIEW` 304, `BATTER_VIEW` 305 (FOV 42); G-151 reframed the two play-picture views closer and lower (PITCHER_VIEW [0,11,-26], FIELD_CAM [0,24,26] + the ball-tracking ride at its height ~1510) so the batter reads big and above the bottom bar; view pick `setCam()` 1335; `#viewBtn` 132 cycles auto/wide/close.
- **Players:** `TEAMS` 259; `FIELD_POS` 473; `dressDefense()` 488; `attachAthlete()` 604 (the `window.__reality` hook is set there, 689; the G-100 trot driver sits just above it, ~589–606; G-167 lives here too — the batter's helmet inside the Head-bone branch ~642 (crown shell + bill + ear flap, face clear) and the batter's button-front jersey set via the kit shader's `uCfg` just after the hook ~690); `fitAthletes()` 701; `athleteTick()` 711 (Idle/Walk/Jog/Sprint picked from measured speed); ground contact — the G-125 sole lift inside `attachAthlete()` plus the G-147 per-frame sole trim: `buildSoleSets()` 585 (foot vertex sets, the robot's skinned-sole selection), `soleTrim()` 735 (holds each athlete's lowest sole on the ground line, called for every athlete in the mover loop ~1516).
- **AI / rules:** `PITCHES` 835, `ZONE` ~840; `deliverPitch()` 903; count — `resetCount()` 988, `onWalk()` 1013, `onStrikeout()` 1026; `stepMovers()` 1474 (fielders chase, runners run); main `loop()` 1387.
- **HUD:** `#scoreboard` 138; top-right cluster `#viewBtn` / `#muteBtn` / `#helpHud` 132–134 (fixed widths, 8 px gaps).
- **Sounds:** owner's kit samples via `Mus.loadKit()` 1827 (called from `Mus.init()` ~1795) — bat crack / glove / big cheer / ambience from `sounds/stadium/baseball/`, synth voices as fallback; played at contact and results (971, ~1253–1280: crack, pop, cheer, riff); crowd excitement via `crowdExcite()`; kit state exposed as `__test.kitAudio` ~2120.
- **Venue:** old park built in `buildField()` 327 (`VENUE_FROM` 326, `oldParkMeshes` 431, hidden once the model loads); Night Ballpark loader ~2015 (`kit/stadiums/Night-Ballpark/stadium.glb` — DAY presentation since G-151 (bright sky/warm sun grade applied in the loader, `_park.night` false; the G-40 night grade is superseded by the art director + the board's locked day-light KEEP), kit field re-skin and touch material lightening all happen there); kit field re-skin `kitFieldOnPark()` 1940 (G-144: the composed kit texture also lands on the field mesh's LIVE material — on touch the G-85 Lambert pass replaces the original before the async swap; live state is `__test.stadium.kitFieldLive`); `window.__test` 2111.

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
