# Next-step queue - the laptop's FREE next-step robot sends these, top first (owner Oct 19 10:40 PM)

How it works: when a window's G-job comes back CHANGED, is merged, and the robot's game check of main shows NO FAIL for
that game, the laptop sends that window the next unticked step below as a new G-job. If the robot still FAILs the game,
the laptop sends the job back once with the FAIL lines; a 2nd time it asks a Claude (Team talk).
Claudes: keep each list short, one change per step, the owner's words. `- [x]` = skip/done. Never reorder a step that
was already sent. Muses: don't edit this file.

## window 1 · apexbaseball.html
- [x] TESTER: Tapping THROW before picking a pitch skips the aim step completely - the pitch goes straight to windup and the aim pad never appears, so that pitch cannot be aimed (the Help flow is pick a pitch, aim, then THROW). See it: start a game and tap THROW first. Proof: play test tester-throw-skips-aim fails in tools/game-check/fixes/apexbaseball.mjs. (fixed by G-85, PR #892 - re-proven on current main 2026-10-21: one THROW tap now goes select -> aim, the test passes)
- [ ] TESTER: The REALITY hook has no go(), so the reality robot cannot drive the player and every game check reports 'the player did not move in 5 s'. See it: window.__reality in a running game has kind/player/others/contact/ground but no go. Proof: play test tester-reality-hook-no-go fails in tools/game-check/fixes/apexbaseball.mjs.
- [x] TESTER: The ball/strike count never resets after a strikeout or a walk - the next batter starts with the old count (the banner shows counts like 4-2), so he can strike out on one strike or walk on one ball. See it: finish an at-bat with a strikeout or a walk, then watch the next batter's count. (fixed in the G-57 redo)
- [x] TESTER: Help cannot be closed on a sideways phone - the CLOSE button sits fully below the screen and the overlay does not scroll; the Play a friend START and CLOSE buttons are cut off at the bottom too. See it: open ? Help or Play a friend with the phone held sideways. (fixed in the G-57 redo)
- [x] TESTER: The ? help button sits on top of the CAM button at the top right and covers half of it (CAM reads 'M-AUTO'), so the covered part of the CAM button cannot be tapped. See it: look at the top right corner on any screen. (fixed in the G-57 redo)
- [x] Friend codes: add a "👥 Play a friend" button (My code / Enter a friend's code) using ApexKit.friend, plus a 'play-friend-code' test in tools/game-check/fixes/apexbaseball.mjs. (sent as G-08)
- [x] The game freezes for about 1.5 seconds right after the start (the robot's gameplay picture is frozen) - find what loads or builds at that moment and make the start smooth. (sent as G-08)
- [x] Short freezes during play: the robot sees about 6 stalls in 6 seconds (worst 0.4 s) - stop making new objects every frame and preload what loads mid-game so play is smooth. Keep everything else exactly as now. (not needed: robot clean 4:53 AM, only the venue is left)
- [x] Make sure there are at least 5 play tests that play baseball by its rules (pitch, hit, out, run scores, inning ends) in tools/game-check/fixes/apexbaseball.mjs. (not needed: robot clean 4:53 AM, only the venue is left)
- [ ] Use the owner's new kits (TOOLS.md): baseball crowd + bat crack + glove sounds from sounds/stadium/baseball/, and the infield / grass textures from kit/ground/512/. Keep the look and play the same.

## window 2 · apexhockey.html
- [ ] TESTER: No window.__reality hook, so the REALITY robot cannot measure hockey at all (direction, real sizes, skates on the ice) - the hook is never set, even in a match. Proof: play test tester-reality-hook fails in tools/game-check/fixes/apexhockey.mjs.
- [ ] TESTER: The stick never resets when the app loses focus or is hidden mid-hold - the knob stays pushed at +40 px after blur and a hide/show cycle, and only a real touchend centres it. Proof: play test tester-stick-resets-on-blur fails in tools/game-check/fixes/apexhockey.mjs.
- [ ] TESTER: The puck is about 5x too big: about 40 cm across and 11 cm thick measured in the game - a real puck is 7.6 cm across and 2.5 cm thick (REALITY.md). Proof: play test tester-puck-size fails in tools/game-check/fixes/apexhockey.mjs.
- [ ] TESTER: Career shows 1 goal scored before any game is played (career panel says 1 G · 0 A at 0-0 with Week 1 unplayed) - start a career and open the career panel.
- [ ] TESTER: Pressing PLAY WEEK 1 in career leaves the game for the sports hub and the game reopens at its main menu instead of starting the match - open a career and press PLAY WEEK 1 vs SHARKS.
- [ ] The short freezes during play (the robot sees about 10 stalls in 6 seconds, worst 2.3 s) - stop making new objects every frame and preload what loads mid-game, so play is smooth.
- [ ] Career mode play tests: start every career level, play it to the end and check the next one unlocks ('play-career-...' tests in tools/game-check/fixes/apexhockey.mjs).
- [ ] Add a 'play-friend-code' test for the friend codes.
- [ ] Hockey commentary from sounds/commentary/hockey (name the color voice on the Credits screen).
- [ ] Use the owner's new kits (TOOLS.md): hockey crowd, goal horn, puck and skate sounds from sounds/stadium/hockey/, and the ice_rink texture from kit/ground/512/. Keep the look and play the same.

## window 3 · apexflight.html
- [x] Add 5 play tests that fly the game by its rules (take off, climb, turn, land, crash) as 'play-...' tests in tools/game-check/fixes/apexflight.mjs. (sent as G-09)
- [x] The plane must still stall when you REALLY pull up too slow - it never stalls now (robot test play-no-easy-stall). Keep normal flying forgiving and keep everything else exactly as now. (sent by hand, window 3)

## window 4 · apextrackfield.html
- [ ] Holding the stick must never block TAP RUN / HURDLE - two thumbs at once, in every race. Keep everything else as now.
- [ ] Painted running lanes on the track, so every runner stays in his own lane. Keep everything else as now.
- [ ] 1500 m and every long race: the camera stays LOW behind the player runner and follows him around the track. Discus, shot put and javelin: after the throw the camera follows it through the air to its landing marker.
- [ ] DISCUS: too many steps - make it ONE simple action (hold to spin, release to throw, at most 2 taps).
- [ ] A dev-only "Skip level" button: only with dev=1 in the address, career mode shows a small Skip level button that wins the level and moves on, saving like a real win. It must never show without dev=1.
- [ ] Use the owner's new kits (TOOLS.md): starting gun, crowd and footstep sounds from sounds/stadium/track/, and the running_track texture from kit/ground/512/. Keep the look and play the same.

## window 5 · apexf1.html
- [ ] Put the owner's new Grand Prix track into F1 (owner said do it, Oct 20 10:14 AM): kit/tracks/Grand-Prix-Track/ (read README.txt + MUSE-GUIDE.txt). Replace the old track with grand-prix-track.glb using track-loader.js: grid, laps by checkpoints, AI cars on its racing line, start lights. Keep OUR F1 car models (not the preview's box cars), MPH, the HUD and controls. Add its race-day sounds from kit/tracks/Grand-Prix-Track-Sounds/.
- [ ] Cockpit view for the player's car (owner, Oct 20 12:27 PM): add a driver's-eye camera from kit/cockpit/cockpit.glb (read its README.md) - the player sees the real cockpit, halo and steering wheel, and the SteeringWheel turns with his steering (and the shift lights follow the revs). Make it a CAM choice next to the chase camera. Keep everything else the same.
- [x] (the new Grand Prix track above replaces the old track) Trees, buildings and walls stand ON the F1 track (owner's pictures 9:43 AM) - move every one off the road so the whole track is clear to drive. Keep everything else the same.
- [ ] Make it smooth on phones: about 1,800 draw calls per frame now - merge meshes (stands, scenery, barriers) until it is under 450, without changing how it looks.
- [ ] Friend codes: a 'play-friend-code' test (add the 👥 Play a friend button with ApexKit.friend if it's missing).
- [ ] Grand Prix commentary from sounds/commentary/grandprix (name the color voice on the Credits screen).
- [ ] Use the owner's new kits (TOOLS.md): the grand_prix engine sounds from sounds/engines/grand_prix/ (idle + accel loops crossfaded by throttle, shifts, tire squeal) and asphalt + kerb textures from kit/ground/512/. Keep everything else the same.

## window 6 · apexracer.html
- [x] (sent as G-19) Two of your Racer play tests fail on the robot: 'play-garage-buy' ("no garage card for kestrel") and 'play-friend-code' ("no friend code shown on the friends screen"). The garage and Race Friends exist - fix the TESTS so they find the real buttons/cards (open the garage / friends screen the way a player does). Do not change the game.
- [x] (sent as G-21) The OWNER says all the cars look RED. Every car in the race and the garage must show its OWN paint color (different for each computer racer, never all the same) - find why the paint isn't showing on the real 3D models and fix it. Check it in the robot's garage and race pictures.
- [x] (sent as G-23) An "APEX ARCADE" name wrap on the owner's car (the V12 Goblin): big clean APEX ARCADE letters along both sides of the body (Apex red/gold or white, readable from the chase camera), as a wrap choice in the garage and ON by default for his car. Keep the car's paint, shape and size exactly as now.
- [x] (G-28 was cut off by G-29 - re-queued below) Home screen like an Xbox / Forza game menu (owner): the car big, sharp and fully visible center-right on a round SHOW-CAR TURNTABLE (no white haze washing it out, nothing covering it): it turns smoothly all the way around nonstop like a car at an auto show, spotlights from above, a glossy floor that reflects the car, and a swipe on the car spins it by hand. Menu buttons in the Apex look: glassy dark tiles with a bright edge on the selected one, bold clean letters. A slim menu column on the LEFT: RACE big on top, then Garage, Race Friends, Graphics, Sound, Credits smaller. Coins / rep / wins / car name as a thin bar along the top. Name box + Save tucked under the menu. Must fit a sideways phone with no scrolling. Keep every button and what it does exactly as now.
- [ ] (re-sent - G-28 was cut off) Home screen like an Xbox / Forza game menu: the car big and sharp center-right on a show-car TURNTABLE that turns nonstop (spotlights, glossy floor, swipe to spin it), glassy dark menu tiles in a slim column on the LEFT (RACE big on top, then Garage, Race Friends, Graphics, Sound, Credits), coins/rep/wins as a thin top bar, fits a sideways phone with no scrolling. Keep every button and what it does.
- [ ] The city traffic cars (the slow cars on the road) become real 3D models too, like the racers (use the models in models/fetched/, each its own paint, nose forward, normal size - STUDIO-STANDARD 3b).
- [ ] Better steering (owner): smoother and more responsive - the car turns where the stick points without sliding wide or snapping; keep the speed, drift and nitro as now.
- [ ] New sound kit for the whole game (owner): use the owner's own sounds - music from sounds/pack/music/sports_arena/ (menu = menu, race = gameplay_low/mid/high crossfaded by speed or position, victory_sting / gameover_sting at the end) and the UI sounds from sounds/ui-kit/arcade/ (taps, coin_pickup, combo_x2-x5 for near misses, unlock / level_up for garage buys, popup_open/close, star_1-3, win_jingle). Keep the engine and nitro sounds unless they sound worse. Credits: none needed (owner's own pack).
- [ ] More car options (owner): add 6 SEARCH lines to MODEL-SEARCH.md for fictional supercars / sports cars (NO real brands), so the owner can pick new garage cars.
- [x] (sent 22:35 with the friend-code test as one G-job) Add 5 play tests in tools/game-check/fixes/apexracer.mjs: the race starts, every car drives forward along the track, the lap counter goes up, the race finishes with results, buying a car in the garage works.
- [x] (sent 22:35) Add a 'play-friend-code' test for Race Friends.
- [x] (covered by the first step: own paint on every car) Every computer racer has its own real paint color.
- [ ] Use the owner's new kits (TOOLS.md): the supercar engine sounds from sounds/engines/supercar/ (idle + accel loops crossfaded by throttle, shifts, backfires, tire squeal). Keep everything else the same.
