# Look board — Apex Flight (`apexflight.html`)

Read this before every job on Apex Flight. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexflight.mjs`.

## WHERE THINGS ARE — `apexflight.html` (1262 lines)
- Menus / HTML / CSS (menu + friend overlays - .panel capped at 100dvh-16px, compacted so every panel fits a 390-high phone, G-238; THR button in the pad row, tall slider gone, G-280; QUALITY button ~113; #jetBtn placed under #back at ~55, G-243; touchdown band chip #bandBox CSS ~27 (centered chip under the runway box, G-283), HTML ~101, G-263): 1–154
- Imports, helpers, constants, state (offRwyMsg flag ~186; peakAir ~184, G-232 r1): 155–190
- Renderer, scene, venue (step-6 look: ACES, shadow sun, PMREM env; runway block - tiling paint, threshold decals (numbers flipped upright for the pilot, G-275), polygonOffset ladder, G-132; crowdTick): 191–499
- The jet (owner's Apex Jet pack, created external) + computer traffic (G-247: 4 pack jets in other styles/paints on wide loops, updateTraffic ~528): 500–541
- HUD artificial horizon: 542–565 · Messages: 566–570
- Game flow (respawn ~571, crash, touchdown/scoring): 571–629
- Input — keyboard (pollKeys ~642): 630–654 · Jet controls: pad + SHARED kit stick + THR button in the pad row (G-280); resetInputs 744 (blur / touchcancel / hidden zero every input, G-238): 655–753
- Buttons / view toggle: 754–775 · Play a Friend codes (friendCode ~776): 776–803 · fitGame ~804: 804–824
- Physics (step ~825; lift/stall, airbrake in the forces block; peakAir arms the gear-collapse check, G-232 r1): 825–938
- Camera (step-5 offsets + sun follow): 939–970 · HUD update (off-runway reason re-assert; touchdown band block ~1013, G-263/G-268): 971–1023 · Music (procedural WebAudio): 1024–1144
- QUALITY option wiring (~1148) · Test hooks (`__flight` 1163 incl. aiJets, `__reality` 1175 - traffic as others): 1145–1204
- Main loop (kit axes merge ~1217; updateTraffic ~1232; ?test= owner-check hook 1248, ?test=traffic = airborne in the traffic sky, ?test=band = challenge final at 70 kt, G-263, ?test=bandfree = free-flight final at 70 kt, G-268): 1205–1262

Manual takeoff (owner 2026-10-25, no job number): the plane must never lift by itself - throttle starts at idle on respawn (was forced full), the auto-rotate assist is gone, and the nose answers to the stick only once fast, so full throttle + no stick stays on the ground past rotate speed and pulling the stick up lifts it off. Help text updated to match. Test: play-takeoff (rewritten: starts-at-idle + stays-grounded-past-rotate + stick-lifts-off).

Shared stick (G-232): pitch/roll come from kit/controls.js `createControls` (left
thumbstick, #apcZone trimmed to the old pack footprint); the jet pack keeps only
its 14-button pad. Let go = stop is the kit's: pointerup / pointercancel / blur /
hidden tab all reset it (play test play-stick-shared-resets).

Computer traffic (G-247): four pack jets (delta/Inferno, fwdswept/Arctic,
stealth/Toxic, sport/Sunset) circle wide loops at 155-290 m, gear up, banked;
updateTraffic flies them every frame and eases one higher when the player
closes within 260 m. Tests see them as __flight.aiJets (play-ai-jets-flying).

Touchdown band (G-263): the 55-88 kt band already decides a rank level at touchdown (outside it costs a level) - now the pilot sees it during the approach. The #bandBox chip shows beside the runway box in the landing challenge (same window: challenge, airborne, within 9000 m of the runway) reading TD BAND 55-88 KT with IN BAND (green) / SLOW / FAST. Test: play-band-shows-on-approach.

Touchdown band, free flight (G-268): G-263's chip was challenge-only, but the robot's play picture is a free-flight scene, so the band never appeared in it. The chip now shows on approach in ANY mode (same 9000 m window, minus the mode gate; the runway box stays challenge-only). Test: play-band-shows-on-final-freeflight. Owner check: apexflight.html?test=bandfree.

Runway numbers upright (G-275): the threshold numbers were painted mirrored for the pilot landing toward them - glyph tops pointed AT the approaching jet, so from behind the jet 36 read upside-down. The number is now flipped vertically in its decal canvas (piano keys untouched); both ends share threshold(), so 18 is fixed too. Test: play-rwy36-reads-correct (reads the 36 decal's own canvas: the 6's loop mass sits toward the pilot).

Takeoff bounce (G-232 r1): a jet that just lifted off and sinks straight back was crash-checked with full landing criteria, so a banked stick at the bounce collapsed the gear on the runway (owner screenshot: liftoff flash, then Hard impact at ALT 0). The banked/nose-down criteria now arm only once peakAir passes gearHeight + 2 m; a hard impact (vs under -3.2) still crashes always. Test: never-g-232-p1.

Band chip uncovered (G-283): the TD band was a full-width strip at the very top, buried under the stats chips and the top buttons, so a pilot landing at 95 kt saw SPD big and centered but no band warning before the rank drop. The chip is now a distinct centered chip under the runway box (top 118 px), clear of every other HUD element, with the same 55-88 kt thresholds and SLOW/IN BAND/FAST states. Test: play-band-uncovered-on-approach.

Reset clear of VS (G-290): the RESET button sat at right:262px, overlapping the VS FPM chip by 27 px in the top bar (measured 518-582 over the VS chip 486-545). It now sits at right:100px, in the gap between VIEW and mute, clear of the stats chips and every other top-bar element. Test: play-reset-clear-of-vs.

Off-runway reason red line (G-334, test-only): the robot failed never-g-243-p1 on main b9f7978 ('reason never showed within 4.5 game-s, msg empty') but the game was right - play-first-frame-safe leaves a ?test=controls URL behind, and ANY ?test= value boots the game menu-hidden in free mode (the catch-all branch), so p1's reload of the CURRENT url hid the menu and its #btnChal press silently failed, running the touchdown in free mode where no reason exists. Fix: p1 reloads the BARE url (query stripped) so the menu opens and the challenge engages, plus a guard that fails loud ('challenge menu did not engage') instead of blaming the game. Regression test: play-g334-dirty-url-challenge.

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
- 2026-10-23: Landing challenge: touching down OFF the runway must tell the player why there is no score (today: silence) (G-243)
- 2026-10-23: After a scored landing, flying into the ocean must still crash the plane (today: nothing happens) (G-243)
- 2026-10-23: Takeoff: a full-throttle roll must end in a real climb - never lift off, wallow at rotate speed and sink back onto the gear (owner video, no job number)
- 2026-10-23: Frame time clamps at zero - a negative first frame threw the parked jet under the runway (y=-14), below ground contact, where it could never take off, land or crash (owner fix)
- 2026-10-24: taking off must not crash the jet when it settles back onto the runway banked - a bounce is a roll, not a landing (G-232)
- 2026-10-25: Takeoff is manual - it must not float up by itself, and the player loads the throttle up himself to take off and land (today: full throttle on start + auto-rotate lifts it with no stick input) (owner video, no job number)

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).

## REFERENCES (G-358)
- Broadcast angle: Red Bull Air Race as television - cameras on the tails of the race planes, in the cockpits, in helicopters and below the pylons: https://generalaviationnews.com/2018/11/29/red-bull-air-racing-reality-vs-tv/
- Athlete gear: fighter pilot in helmet and flight suit, visible in the cockpit of an F-35 on the runway: https://rare-gallery.com/4555321-military-military-aircraft-us-air-force-lockheed-martin-f-35-lightning-ii.html
- Stance: pilot seated in the cockpit at the controls, hands on the stick (Cochran in a P-40): https://www.gettyimages.in/detail/news-photo/pilot-jacqueline-cochran-sits-in-the-cockpit-of-a-p-40-news-photo/514867614
- Venue: Red Bull Air Race over the river at Porto, city behind the course: https://commons.wikimedia.org/wiki/File:Red_Bull_Air_Race_2_(Porto).jpg
- Best game example of this kind: Ace Combat 7: Skies Unknown (console) - photorealistic skies, full 360-degree movement, arcade jet handling: https://www.xbox.com/en-NZ/games/store/ace-combat-7-skies-unknown/BZ45MMFWZP7F/0001

## MUST MATCH (G-358, written from the links above)
- Proportions: single-seat low-wing jet, wingspan clearly shorter than fuselage length, tall tail fin, gear set wide under the wings.
- Camera height: chase view just above and behind the jet, looking slightly down at the runway, matching the tail-camera and helicopter broadcast angles.
- Gear silhouette: wide three-point gear under the fuselage, nose slightly up on final, gear clearly readable against the runway.
- Motion weight: banking turns carry momentum and bleed speed, rolls take time, touchdown sinks with weight rather than snapping flat.
