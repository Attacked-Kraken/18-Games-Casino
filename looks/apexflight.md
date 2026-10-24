# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1238 lines)
- Menus / HTML / CSS (menu + friend overlays - .panel capped at 100dvh-16px, compacted so every panel fits a 390-high phone, G-238; slim throttle bar CSS ~41; QUALITY button ~117; #jetBtn placed under #back at ~53, G-243): 1–159
- Imports, helpers, constants, state (offRwyMsg flag ~185): 160–191
- Renderer, scene, venue (step-6 look: ACES, shadow sun, PMREM env; runway block - tiling paint, threshold decals, polygonOffset ladder, G-132; crowdTick): 192–492
- The jet (owner's Apex Jet pack, created external) + computer traffic (G-247: 4 pack jets in other styles/paints on wide loops, updateTraffic ~519): 493–535
- HUD artificial horizon: 536–561 · Messages: 562–565
- Game flow (respawn ~567, crash, touchdown/scoring): 566–629
- Input — keyboard (pollKeys ~639): 630–649 · Jet controls: pad + SHARED kit stick + throttle bar; resetInputs 739 (blur / touchcancel / hidden zero every input, G-238): 650–748
- Buttons / view toggle: 749–758 · Play a Friend codes (friendCode ~771): 759–798 · fitGame ~799: 799–812
- Physics (step ~820; lift/stall, airbrake in the forces block): 813–929
- Camera (step-5 offsets + sun follow): 930–962 · HUD update (off-runway reason re-assert): 963–1004 · Music (procedural WebAudio): 1005–1124
- QUALITY option wiring (~1128) · Test hooks (`__flight` 1142 incl. aiJets, `__reality` 1154 - traffic as others): 1125–1180
- Main loop (kit axes merge ~1193; updateTraffic ~1208; ?test= owner-check hook 1224, ?test=traffic = airborne in the traffic sky): 1181–1238

Shared stick (G-232): pitch/roll come from kit/controls.js `createControls` (left
thumbstick, #apcZone trimmed to the old pack footprint); the jet pack keeps only
its 14-button pad. Let go = stop is the kit's: pointerup / pointercancel / blur /
hidden tab all reset it (play test play-stick-shared-resets).

Computer traffic (G-247): four pack jets (delta/Inferno, fwdswept/Arctic,
stealth/Toxic, sport/Sunset) circle wide loops at 155-290 m, gear up, banked;
updateTraffic flies them every frame and eases one higher when the player
closes within 260 m. Tests see them as __flight.aiJets (play-ai-jets-flying).

Fit rule (G-238): every overlay panel fits a 844x390 phone outright - .panel is
compact (14px padding, slimmer buttons) and capped at calc(100dvh - 16px) with
internal scroll as the safety net. A touch cancel resets all input through
resetInputs (play test play-stick-never-stays-stuck).

## MUST
- (owner adds these)
- Runway numbers and markings read the correct way round from the pilot's view (never mirrored)
- The menus and HUD name the aircraft the game actually flies - the jet

## NEVER
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible
- No control overlapping another control - the throttle is a slim button in the button row
- 2026-10-22: After a scored landing, flying into the ocean must still crash the plane (today: nothing happens) (G-121)
- 2026-10-22: Landing challenge: touching down OFF the runway must tell the player why there is no score (today: silence) (G-121)
- 2026-10-23: Takeoff: a full-throttle roll must end in a real climb - never lift off, wallow at rotate speed and sink back onto the gear (owner video, no job number)
- 2026-10-23: Frame time clamps at zero - a negative first frame threw the parked jet under the runway (y=-14), below ground contact, where it could never take off, land or crash (owner fix)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
