# Next-step queue - the laptop's FREE next-step robot sends these, top first (owner Oct 19 10:40 PM)

How it works: when a window's G-job comes back CHANGED, is merged, and the robot's game check of main shows NO FAIL for
that game, the laptop sends that window the next unticked step below as a new G-job. If the robot still FAILs the game,
the laptop sends the job back once with the FAIL lines; a 2nd time it asks a Claude (Team talk).
Claudes: keep each list short, one change per step, the owner's words. `- [x]` = skip/done. Never reorder a step that
was already sent. Muses: don't edit this file.

## window 1 · apexbaseball.html
- [ ] Friend codes: add a "👥 Play a friend" button (My code / Enter a friend's code) using ApexKit.friend, plus a 'play-friend-code' test in tools/game-check/fixes/apexbaseball.mjs.
- [ ] The game freezes for about 1.5 seconds right after the start (the robot's gameplay picture is frozen) - find what loads or builds at that moment and make the start smooth.
- [ ] Make sure there are at least 5 play tests that play baseball by its rules (pitch, hit, out, run scores, inning ends) in tools/game-check/fixes/apexbaseball.mjs.

## window 2 · apexhockey.html
- [ ] The short freezes during play (the robot sees about 10 stalls in 6 seconds, worst 2.3 s) - stop making new objects every frame and preload what loads mid-game, so play is smooth.
- [ ] Career mode play tests: start every career level, play it to the end and check the next one unlocks ('play-career-...' tests in tools/game-check/fixes/apexhockey.mjs).
- [ ] Add a 'play-friend-code' test for the friend codes.

## window 3 · apexflight.html
- [ ] Add 5 play tests that fly the game by its rules (take off, climb, turn, land, crash) as 'play-...' tests in tools/game-check/fixes/apexflight.mjs.
- [ ] Friend codes: add a "👥 Play a friend" button (My code / Enter a friend's code) using ApexKit.friend, plus a 'play-friend-code' test.

## window 4 · apextrackfield.html
- [ ] Long relay / long races: a RED button turns on and blocks running - no button may ever block TAP RUN. Keep everything else as now.
- [ ] 1500 m and every long race: the camera stays LOW behind the player runner and follows him around the track. Discus, shot put and javelin: after the throw the camera follows it through the air to its landing marker.
- [ ] DISCUS: too many steps - make it ONE simple action (hold to spin, release to throw, at most 2 taps).
- [ ] A dev-only "Skip level" button: only with dev=1 in the address, career mode shows a small Skip level button that wins the level and moves on, saving like a real win. It must never show without dev=1.
- [ ] Add a 'play-friend-code' test for the friend codes.

## window 5 · apexf1.html
- [ ] Make it smooth on phones: about 1,800 draw calls per frame now - merge meshes (stands, scenery, barriers) until it is under 450, without changing how it looks.
- [ ] Career mode play tests: start every career level, play it to the end and check the next one unlocks ('play-career-...' tests).
- [ ] Friend codes: a 'play-friend-code' test (add the 👥 Play a friend button with ApexKit.friend if it's missing).

## window 6 · apexracer.html
- [x] (sent 22:35 with the friend-code test as one G-job) Add 5 play tests in tools/game-check/fixes/apexracer.mjs: the race starts, every car drives forward along the track, the lap counter goes up, the race finishes with results, buying a car in the garage works.
- [x] (sent 22:35) Add a 'play-friend-code' test for Race Friends.
- [ ] Every computer racer has its own real paint color (no two the same, no white) - check in the garage and race pictures.
