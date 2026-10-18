# Look board — Monster Truck (`apexmonstertruck.html`)

Read this before every job on Monster Truck. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexmonstertruck.mjs`.

**Lighting preset:** `look-presets.js` → `night` (owner JOB J45: stadium lights at night; supersedes `field`).

## MUST
- Solid dirt floor
- J5: Engine is a deep layered V8 roar (sub-bass + detuned saws), revs 35Hz idle to 180Hz with speed
- J5: Menu music (112 BPM rock) and game music (132 BPM driving riff) play; mute silences everything
- J5: Truck ~2.7m tall with ~2.1m tires next to 4.4m cars - real Monster Jam proportions → SUPERSEDED by J45 below (3.7m / 1.7m / 3.8m)
- J5: Jumps arc fast (GRAV 38), land hard with dust burst + camera shake + thud - no floating
- J5 pic: camera 18 back / 9 up - truck fills the screen, not a tiny dot
- J5 pic: dirt repeat 220 (not 880) - no obvious tiling/streaking


## MUST — JOB J45 (owner, 2026-10-17: BIG UPGRADE, one Muse, one job)
- J45: CLEAN SCREEN - during play only the game, score/timer/speed and the buttons needed now; ALL instructions behind a (?) 'How to play' button, closed by default, turned sideways with the game; under 20 words during play; NO keyboard words anywhere (test: play-clean-screen)
- J45: TRUCK BIGGER - real Monster Jam size: 3.7m tall, 1.7m (66-inch) tires, 3.8m wide, next to 4.4m cars; fills about a third of the screen height in the chase view (tests: play-real-sizes, play-truck-fills-screen)
- J45: SPEED - about 70 mph top on flat dirt, 0-60 mph in about 4s, plus a BOOST button (tests: play-top-speed, play-zero-to-sixty, play-boost-button)
- J45: REAL PHYSICS (cannon-es raycast vehicle, vendored) - long-travel suspension squashes on landings and bounces back, heavy 5-ton feel, body roll in turns, wheelies on hard throttle, front/back flips with the stick in the air, slides on dirt, cars crush FLAT, a FLIP BACK button after a rollover (tests: j5-gravity-weight, play-suspension-squash, play-body-roll, play-wheelie, play-air-flip, play-dirt-slide, play-crush-car, play-flip-back)
- J45: REALLY HUGE STADIUM (venues/kit/truck-arena.js at the venues/truck-arena.md spec) - 110x50m dirt floor, 3-tier bowl on all 4 sides, 40,000-60,000 fans who stand up on big air, stadium lights at night, giant screens at both ends, pyro, 6+ jumps, a 6m mega ramp, car crush lines, barriers + catch fence. NO open land anywhere (tests: play-arena-spec, play-crowd-stands, play-pyro-fires)
- J45: friend codes (Play a friend: my code / enter a friend's code; rival truck + target score) - test: play-friend-code
- J45: rally career playable end to end (every event starts, plays to its goal, unlocks the next) + dev-only Skip with dev=1 - tests: play-career-rally-events, dev-skip-rally-event

## NEVER
- No flicker between brown dirt and gray on phones (z-fighting)
- No streaky dirt
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
