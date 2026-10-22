# Look board — Baseball (`apexbaseball.html`)

## WHERE THINGS ARE (apexbaseball.html, main + G-125)
- Teams/kits: TEAMS line 259 · Camera (THREE.PerspectiveCamera, FOV 42): line 300; presets + ball-follow in the camera section around it
- Field positions: FIELD_POS line 473 · Defense dressing (pitcher/catcher/umpire/fielders): dressDefense line 488
- REALITY trot driver (go() base-path sprint): lines 565-582 · Athletes: attachAthlete line 583 (incl. the per-athlete sole lift after the scale fit) · REALITY hook (window.__reality, incl. go: since G-125) line 655 · athleteTick (clip by own speed) line 674
- Pitching: PITCHES line 768 · ZONE line 773 · beginAim line 803 · deliverPitch line 836 · aim pad input + resetInput around lines 1518-1568
- Main loop: realityTrotTick call line 1418 · stepMovers (fielders chase, runners run) line 1420
- Venue: Night Ballpark GLB loader line 1940 (night look applied on load; #loadOv gate until ready)
- Test hooks: window.__test line 2036

Read this before every job on Baseball. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexbaseball.mjs`.

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
