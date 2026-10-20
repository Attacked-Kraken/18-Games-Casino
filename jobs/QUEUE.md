# Next-step queue - the laptop's FREE next-step robot sends these, top first (owner Oct 19 10:40 PM)

How it works: when a window's G-job comes back CHANGED, is merged, and the robot's game check of main shows NO FAIL for
that game, the laptop sends that window the next unticked step below as a new G-job. If the robot still FAILs the game,
the laptop sends the job back once with the FAIL lines; a 2nd time it asks a Claude (Team talk).
Claudes: keep each list short, one change per step, the owner's words. `- [x]` = skip/done. Never reorder a step that
was already sent. Muses: don't edit this file.

## window 1 · apexbaseball.html
- [x] Friend codes: add a "👥 Play a friend" button (My code / Enter a friend's code) using ApexKit.friend, plus a 'play-friend-code' test in tools/game-check/fixes/apexbaseball.mjs. (sent as G-08)
- [x] The game freezes for about 1.5 seconds right after the start (the robot's gameplay picture is frozen) - find what loads or builds at that moment and make the start smooth. (sent as G-08)
- [x] Short freezes during play: the robot sees about 6 stalls in 6 seconds (worst 0.4 s) - stop making new objects every frame and preload what loads mid-game so play is smooth. Keep everything else exactly as now. (not needed: robot clean 4:53 AM, only the venue is left)
- [x] Make sure there are at least 5 play tests that play baseball by its rules (pitch, hit, out, run scores, inning ends) in tools/game-check/fixes/apexbaseball.mjs. (not needed: robot clean 4:53 AM, only the venue is left)

## window 2 · apexhockey.html
- [ ] The short freezes during play (the robot sees about 10 stalls in 6 seconds, worst 2.3 s) - stop making new objects every frame and preload what loads mid-game, so play is smooth.
- [ ] Career mode play tests: start every career level, play it to the end and check the next one unlocks ('play-career-...' tests in tools/game-check/fixes/apexhockey.mjs).
- [ ] Add a 'play-friend-code' test for the friend codes.
- [ ] Hockey commentary from sounds/commentary/hockey (name the color voice on the Credits screen).

## window 3 · apexflight.html
- [x] Add 5 play tests that fly the game by its rules (take off, climb, turn, land, crash) as 'play-...' tests in tools/game-check/fixes/apexflight.mjs. (sent as G-09)
- [x] The plane must still stall when you REALLY pull up too slow - it never stalls now (robot test play-no-easy-stall). Keep normal flying forgiving and keep everything else exactly as now. (sent by hand, window 3)
- [ ] Friend codes: add a "👥 Play a friend" button (My code / Enter a friend's code) using ApexKit.friend, plus a 'play-friend-code' test.

## window 4 · apextrackfield.html
- [ ] Holding the stick must never block TAP RUN / HURDLE - two thumbs at once, in every race. Keep everything else as now.
- [ ] Painted running lanes on the track, so every runner stays in his own lane. Keep everything else as now.
- [ ] 1500 m and every long race: the camera stays LOW behind the player runner and follows him around the track. Discus, shot put and javelin: after the throw the camera follows it through the air to its landing marker.
- [ ] DISCUS: too many steps - make it ONE simple action (hold to spin, release to throw, at most 2 taps).
- [ ] A dev-only "Skip level" button: only with dev=1 in the address, career mode shows a small Skip level button that wins the level and moves on, saving like a real win. It must never show without dev=1.
- [ ] Add a 'play-friend-code' test for the friend codes.

## window 5 · apexf1.html
- [ ] Make it smooth on phones: about 1,800 draw calls per frame now - merge meshes (stands, scenery, barriers) until it is under 450, without changing how it looks.
- [ ] Career mode play tests: start every career level, play it to the end and check the next one unlocks ('play-career-...' tests).
- [ ] Friend codes: a 'play-friend-code' test (add the 👥 Play a friend button with ApexKit.friend if it's missing).
- [ ] Grand Prix commentary from sounds/commentary/grandprix (name the color voice on the Credits screen).

## window 6 · apexracer.html
- [ ] Two of your Racer play tests fail on the robot: 'play-garage-buy' ("no garage card for kestrel") and 'play-friend-code' ("no friend code shown on the friends screen"). The garage and Race Friends exist - fix the TESTS so they find the real buttons/cards (open the garage / friends screen the way a player does). Do not change the game.
- [ ] The OWNER says all the cars look RED. Every car in the race and the garage must show its OWN paint color (different for each computer racer, never all the same) - find why the paint isn't showing on the real 3D models and fix it. Check it in the robot's garage and race pictures.
- [ ] An "APEX ARCADE" name wrap on the owner's car (the V12 Goblin): big clean APEX ARCADE letters along both sides of the body (Apex red/gold or white, readable from the chase camera), as a wrap choice in the garage and ON by default for his car. Keep the car's paint, shape and size exactly as now.
- [ ] Home screen like an Xbox / Forza game menu (owner): the car big, sharp and fully visible center-right on a round SHOW-CAR TURNTABLE (no white haze washing it out, nothing covering it): it turns smoothly all the way around nonstop like a car at an auto show, spotlights from above, a glossy floor that reflects the car, and a swipe on the car spins it by hand. Menu buttons in the Apex look: glassy dark tiles with a bright edge on the selected one, bold clean letters. A slim menu column on the LEFT: RACE big on top, then Garage, Race Friends, Graphics, Sound, Credits smaller. Coins / rep / wins / car name as a thin bar along the top. Name box + Save tucked under the menu. Must fit a sideways phone with no scrolling. Keep every button and what it does exactly as now.
- [ ] The city traffic cars (the slow cars on the road) become real 3D models too, like the racers (use the models in models/fetched/, each its own paint, nose forward, normal size - STUDIO-STANDARD 3b).
- [ ] Better steering (owner): smoother and more responsive - the car turns where the stick points without sliding wide or snapping; keep the speed, drift and nitro as now.
- [ ] New sound kit for the whole game (owner): use the owner's own sounds - music from sounds/pack/music/sports_arena/ (menu = menu, race = gameplay_low/mid/high crossfaded by speed or position, victory_sting / gameover_sting at the end) and the UI sounds from sounds/ui-kit/arcade/ (taps, coin_pickup, combo_x2-x5 for near misses, unlock / level_up for garage buys, popup_open/close, star_1-3, win_jingle). Keep the engine and nitro sounds unless they sound worse. Credits: none needed (owner's own pack).
- [ ] More car options (owner): add 6 SEARCH lines to MODEL-SEARCH.md for fictional supercars / sports cars (NO real brands), so the owner can pick new garage cars.
- [x] (sent 22:35 with the friend-code test as one G-job) Add 5 play tests in tools/game-check/fixes/apexracer.mjs: the race starts, every car drives forward along the track, the lap counter goes up, the race finishes with results, buying a car in the garage works.
- [x] (sent 22:35) Add a 'play-friend-code' test for Race Friends.
- [x] (covered by the first step: own paint on every car) Every computer racer has its own real paint color.
