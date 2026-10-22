# ART TRIAL — Senior Art Director (Window 12)

Date: Wed Oct 21, 2026
Trial scope: this file only. Nothing was written to jobs/HELP.md, any look board, or SCORES.md.

Robot run judged (pinned): branch `game-checks`, `results.json` run "Oct 21, 2026, 9:52 PM",
main sha `2614068`, game-checks commit `b7d1b02628b263c45ac9bd3fd9291b8e236d6292`.
A later run would need a fresh judgment — other windows are still pushing.
Inventory of main was taken at commit `23ee63e` (Oct 21, 9:53 PM CDT). One late arrival
was folded in: the owner's F1 pictures, notes dated Oct 21 10:05–10:06 PM, committed in
`596f873` (#1000) — defect screenshots, judged in section 5.

Direction read before judging: `STUDIO-STANDARD.md`, `REALITY.md`, `looks/<game>.md` for all
6 games, plus `looks/refs/apexf1.md`.

Method (STUDIO-STANDARD section 7): robot picture opened next to the reference, every visible
difference listed in plain words, each difference tied to a number from the robot run or to
the picture it was seen in. Robot pictures are linked on branch `game-checks`, folder `img/`.
Reference pictures are linked on branch `main`, folder `looks/`.

## Verdicts at a glance

| Game | Verdict | Confidence |
|---|---|---|
| Apex Baseball | SEND BACK | High |
| Apex Ice Hockey | SEND BACK (closest of the six) | Medium-high |
| Apex Flight | SEND BACK | High |
| Apex Track & Field | SEND BACK | High |
| Apex F1 Racing | SEND BACK | High |
| Exotic Racer Club | SEND BACK | High |

Key structural finding: there is NO `target.jpg` and NO `approved-play.jpg` anywhere in
`looks/`, and at inventory time no `looks/<game>/` folder at all for Baseball, Hockey, F1
or Racer. Flight and Track & Field have owner pictures. F1's owner folder arrived later
the same evening and, like Flight's, holds the owner's screenshots of current defects —
not a target. For the four games with no target picture, verdicts
rest on the written boards (STUDIO-STANDARD, REALITY, the game's own look board) plus the
robot's numbers, not on a picture-to-picture match. Candidate targets for those four are
listed under TARGET LINKS at the end; the owner picks one per game and it becomes the target.

---

## 1. Apex Baseball — SEND BACK — Confidence: High

Pictures judged:
- Robot play: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexbaseball-2-play.jpg
- Robot menu: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexbaseball-1-menu.jpg
- Robot face close-up: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexbaseball-face.jpg
- Reference: none in the repo (no target.jpg, no approved-play.jpg, no owner folder).
  Judged against `looks/apexbaseball.md` text. See TARGET LINKS.

Differences:

1. Night-dark play picture. The play shot is a dark stadium at night: a steep dark-navy
   seating bowl fills the top half, the field is dark green, and the players are tiny black
   silhouettes. The board says MUST day lighting and NEVER "night-dark field where batter
   can't be seen". Direct contradiction, seen in apexbaseball-2-play.jpg.
2. Batter not clearly visible. From the centre-field view the batter is a tiny speck at the
   bottom centre of the frame, partly hidden behind the bottom UI bar and the gold LOCK
   button. Board KEEP (LOCKED): "batter clearly visible and lit".
3. Crowd reads as empty. The bowl is a dark mass with no distinguishable crowd in it, even
   though the board MUSTs a reacting crowd. Whatever the crowd logic does, the picture does
   not show it.
4. Face close-up is the worst single picture in this trial. The player's face is covered by
   a large dark-blue blob: a blank tan band where the eyes should be, the nose poking
   through blue geometry that covers the lower two-thirds of the face. STUDIO-STANDARD:
   faces visible, never a blank mask. Seen in apexbaseball-face.jpg.
5. Wrong clothing in the close-up. The player wears a teal T-shirt with a gold crown / "VV"
   logo — not a baseball uniform. No cap, helmet, jersey or glove is visible.
6. Garbled scoreboard in the close-up. Top-right of apexbaseball-face.jpg shows overlapping
   orange dot-matrix text that cannot be read.
7. Typewriter-style HUD font. The play picture's score HUD (SHK/COM, B/S/O circles) is set
   in a monospace/typewriter style. STUDIO-STANDARD section 5 hard NO for the Apex look.
8. Players stacked on each other in the menu picture. Behind the menu panel at home plate,
   4–5 players are clumped on top of each other (batter/catcher/umpire/next batter
   overlapping). Seen in apexbaseball-1-menu.jpg.
9. Robot FAIL: feet sink more than 5 cm under the ground in 24 of 24 readings (REALITY:
   ground contact within 3 cm, nothing sinks).
10. Robot FAIL: the REALITY hook has no go() — the robot cannot drive the player, so the
    owner's fix is not done and play cannot be verified by the robot.
11. Robot CHECK: stutter — 6 short freezes in 6 seconds, worst 800 ms. STUDIO-STANDARD:
    no stutter.
12. Robot: the half inning never ended in 29 s (still BOT 1 at the end). Fix test
    `play-rules-inning-ends` failed. Fixes overall: 26/28 pass.
13. Robot CHECK: no owner-approved venue — the ballpark is not built from
    `venues/ballpark.md`. In the play picture the foul poles the board MUSTs are not
    visible, and there is no grandstand roof or light detail.
14. Robot measured the player object at 2.05 m tall (REALITY adult band 1.75–1.95 m). The
    object may include more than the body, so this needs a clean single-player measurement
    against the ~7.5-head-heights model sheet before it is called a fail — flagged, not
    counted.

Why high confidence: the pictures and the robot numbers agree, and the board text is
explicit (day lighting is a MUST/NEVER pair). The face close-up alone would send it back.

Proposed fix tests (for the real board, not written there in this trial): a day-lit play
picture with the batter readable at phone size; a face close-up showing eyes and face with
no covering geometry; the player in a baseball uniform; crowd visibly present in the bowl;
feet-on-ground readings inside 3 cm.

---

## 2. Apex Ice Hockey — SEND BACK (closest of the six) — Confidence: Medium-high

Pictures judged:
- Robot play: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexhockey-2-play.jpg
- Robot menu: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexhockey-1-menu.jpg
- Robot face close-up: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexhockey-face.jpg
- Robot fixes view: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexhockey-4-fixes.jpg
- Reference: none in the repo. Judged against `looks/apexhockey.md` text. See TARGET LINKS.

What matches, first: the play picture is the best of the six games. Bright full-rink
broadcast view, correct lines (red centre line, blue lines, red faceoff circles, blue
creases), goals at both ends with goalies, a dense colourful crowd all around, and a clean
scorebug (WOLVES 0–1 SHARKS, 1ST 1:52). Robot run: 0 FAIL, 28/30 fixes pass — the strongest
numbers of any game here.

Differences that block READY FOR OWNER:

1. No visor and no cage in the face close-up. The helmet is a plain smooth blue dome. The
   board MUSTs "face visible (visor/open cage, never a blank mask)" and the model sheet
   says helmet + visor. The one picture that proves the player model contradicts it.
   Seen in apexhockey-face.jpg.
2. Close-up gear is blobby. A huge smooth dark-blue shoulder-pad mass, a thick blue tube
   for a sleeve, the glove out of frame. The board's model sheet (shoulder pads, oversized
   gloves, breezers, shin guards under socks, skates with steel blades) cannot be confirmed
   from this picture.
3. Back number/name unproven. In the close-up only "…CK" of the name shows and the number
   is cut off by the camera framing, so "numbers/names the right way round from behind"
   cannot be confirmed either way.
4. Close-up crowd is flat. The fans directly behind the player are identical low-poly
   round-headed figures with no faces. The play picture's crowd reads fine at distance;
   at close range it does not meet the real-arena standard.
5. Play picture hides the players. The skaters are a tiny cluster of about 6–8 players
   huddled inside the centre circle, and the giant white word "PLAY" across centre ice
   partly covers them. At this camera, stance (lean 15–20 degrees, knees 25–30 degrees),
   gear and numbers cannot be verified at all.
6. Fixes view: the right-hand goal appears to have no goalie, and a small black rectangle
   with white dots floats unexplained above centre ice. Seen in apexhockey-4-fixes.jpg.
7. Menu text clipped and overlapping. The top yellow line "No star yet — start a CAREER
   and your center becomes the face of the Wolves." is clipped and overlaps the
   VIEW / BROADCAST button; CREDITS and the "MY FRIEND CODE" line sit at or below the
   bottom edge with another line cut off entirely. STUDIO-STANDARD: every menu must fit
   a sideways phone with no scrolling and nothing cut off. Seen in apexhockey-1-menu.jpg.
8. Robot CHECK (rules, not look, but it blocks "ready"): icing was never called on an
   untouched clear from the defensive half. Fix test `play-icing-called` failed.
9. Robot CHECK: a defender never takes the puck off an away rush — the rush scored
   untouched. Fix test `play-defender-takes-puck` failed. Fixes overall: 28/30.
10. Robot measured the "skater" object at 4.78 x 6.54 x 6.30 m — that is a group of
    players, not one skater, and part of it sits 0.352 m below ice level (minY −0.352).
    There is no clean single-skater measurement for size or stance in this run.
11. No target picture exists. Under STUDIO-STANDARD section 7 I can only say "ready for
    the owner" when the pictures match the reference. There is no reference to match.
    The owner needs to pick one from TARGET LINKS first.

Why medium-high and not high: the blocking items are seen in the pictures, not inferred —
but the play picture itself is genuinely broadcast-like, and a closer gameplay camera plus
a corrected close-up could clear items 1–5 quickly. This is the one game where a short
fix list stands between it and the owner.

Proposed fix tests: close-up showing helmet with visor or open cage and the face through
it; back view with full name and number readable; a gameplay camera close enough to check
the skating stance; menu screenshot with no clipped or overlapping lines.

---

## 3. Apex Flight — SEND BACK — Confidence: High

Pictures judged:
- Robot play: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexflight-2-play.jpg
- Robot menu: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexflight-1-menu.jpg
- Robot close-up: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexflight-face.jpg
- Owner reference (owner's own phone screenshots, Oct 21 2026, with his note in the same
  folder): https://github.com/Attacked-Kraken/18-Games-Casino/blob/main/looks/apexflight/owner-2026-10-21/1-throttle-circled.jpg ,
  https://github.com/Attacked-Kraken/18-Games-Casino/blob/main/looks/apexflight/owner-2026-10-21/2-runway-approach.jpg ,
  https://github.com/Attacked-Kraken/18-Games-Casino/blob/main/looks/apexflight/owner-2026-10-21/3-crashed.jpg ,
  note: https://github.com/Attacked-Kraken/18-Games-Casino/blob/main/looks/apexflight/owner-2026-10-21/README.md

Note on the reference: these owner pictures are screenshots of current defects, not a
clean target render. The owner's note says KEEP: the jet model ("Like the plane"). What he
asks to change is the reference for this judgment.

Differences:

1. The owner's circled complaint is still there. In the robot play picture, the tall
   translucent red THR slider at the right edge still overlaps the GEAR / PAINT / LOOP
   buttons. The owner asked on Oct 21 at 9:52 PM — the same evening as this robot run —
   for a slimmer throttle button alongside the other buttons: "Make really reactive.
   And all controls." Not done in the newest picture.
2. Runway number painted backwards. The "36" on the tarmac reads mirrored/reversed from
   the pilot's behind-the-jet view, in both the owner's photo 1 and the robot play
   picture. Centreline dashes are sparse; no threshold bars or runway edge lights visible.
3. HUD overlaps itself. The RESET button covers part of the VS box (the "+0" is partly
   hidden), and the top-left title "JET: Neon Strike" is clipped with the Back button
   overlapping it.
4. The artificial-horizon circle covers the runway. The huge horizon gauge sits
   centre-bottom over the runway centreline in both the owner's photos and the robot
   picture — it hides the thing the player is trying to line up with.
5. Menu describes the wrong aircraft. The menu says "APEX FLIGHT — SINGLE-PROP
   SIMULATOR" and "near 45 kt the nose rises", while the aircraft in play is a twin-tail
   jet (the menu in play reads "JET: Neon Strike", and the owner likes the jet). The
   game's own menu text does not match its own plane.
6. Robot FAIL: the jet cannot slow to the 55–88 kt touchdown band in a descent — it
   accelerates to 130 kt+ and the test timed out past 30 s. This is the machine version
   of the owner's "make it really reactive... all controls".
7. Robot FAIL: an off-runway touchdown gives no message explaining why there is no
   score. Robot FAIL: after a scored landing, flying into the ocean does not crash.
8. Terrain is flat and empty. Two-tone green strips, low pyramid hills, two small dark
   sheds, no airport buildings. Robot CHECK agrees: no approved venue (`venues/airport.md`).
   The owner's photo 2 shows the same problem from the air — the jet beside a narrow grey
   runway strip over patchwork fields, which is the "glitchy" runway he named.
9. Busy play screen. Robot counted about 28 words on the play screen (biggest "SPD KT").
   STUDIO-STANDARD wants only game + score + needed buttons during play.
10. Close-up picture caveat. In apexflight-face.jpg the top ~45% of the frame is solid
    black and the ground is flat two-tone green with one tiny cone tree and one tiny
    windsock. The black background may be the robot's close-up camera rather than the
    game sky — flagged as a framing caveat, not counted against the game. The flat ground
    is the game's.
11. Robot numbers: the plane object measured 10.48 x 5.01 x 15.39 m with minY −1.75 m
    (part of the plane below ground at some reading), and the climb test moved the plane
    only 99 m in 5 s. Fixes overall: 10/14 pass.

Why high confidence: the owner's own newest written note is visibly unaddressed in the
robot's newest picture of the same scene (jet on Runway 36, SPD 26 KT, ALT 0).

Proposed fix tests: play picture with the throttle as a slim button in the button row,
overlapping nothing; runway numbers reading the correct way from the cockpit view;
a descent test that settles inside 55–88 kt; menu text naming the jet it actually flies.

---

## 4. Apex Track & Field — SEND BACK — Confidence: High

Pictures judged:
- Robot play: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apextrackfield-2-play.jpg
- Robot menu: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apextrackfield-1-menu.jpg
- Robot face close-up: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apextrackfield-face.jpg
- Robot upright: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apextrackfield-3-upright.jpg
- Owner references: https://github.com/Attacked-Kraken/18-Games-Casino/blob/main/looks/apextrackfield/owner-2026-10-21/README.md
  (5 numbered points, with 1.png–5.png in the same folder) and the
  `looks/apextrackfield/owner-2026-10-20/` folder (final-1.jpg, high-jump.jpg and others).

What matches, first: the face close-up is genuinely good — a real human face with eyes,
brows, hair and skin, muscular arms, blue singlet, realistic proportions, not a capsule or
stick figure. The landscape menu is clean and fits. The stadium/track base is the LOCKED
JOB J7 look the owner liked. None of that saves the verdict below, because the failures
are in the racing itself.

Differences:

1. A one-man race. The robot play picture is a 60M DASH with only ONE runner visible, yet
   the HUD shows 7th place, the clock reads 08.48, and the distance reads 0m / 60m — the
   timer is running before any distance is covered and there is nobody to be 7th against.
2. Starting blocks scattered. About 6 red blocks sit at different distances down different
   lanes instead of on one start line. The board (JOB J7): blocks at every sprint/hurdle
   start, at the marks actually raced.
3. Unfinished ground beside the track. The right side beyond the lanes is a large
   black/grey flat area — not grass, not infield. It reads as missing ground.
4. Robot FAIL: 300m hurdles are 1.07 m in the game; the real 300/400m hurdle height is
   0.914 m. That is 17% too tall, outside REALITY's 15% band.
5. Robot FAIL: feet sink more than 5 cm under the ground in 14 of 24 readings.
6. Robot FAIL: portrait menu buttons go off screen, and menu buttons are under 44x44 px —
   CHAMPIONSHIP 291x36, CAREER 291x36, TOURNAMENT 140x30, FREE PLAY 144x30 (9 of 9 under
   in height). The upright picture agrees: the rotated menu panel overflows the frame and
   only CHAMPIONSHIP plus part of the next button are visible.
7. Owner point 1 (results screen, 1.png): the 10,000m results table is headed ATHLETE but
   lists events (Javelin 7th/631, 800m 1st/1200, 10,000m 1st/1200); the big mark 23:33.90
   does not match the race clock he saw (29:12) and equals the event record 26:11.00 x
   0.90 — a made-up mark. The same screen carries two menu buttons (MENU and BACK TO
   CAREER). The owner's 2026-10-20 final-1.jpg shows the same disease: standings printed
   twice in one panel, with "Your total: 12912 PTS" beside D. Carter's 17416 PTS.
8. Owner point 2 (1500m, 2.png): rivals are already metres ahead and at full speed when
   the player takes over, the clock already at 3:01.85 with 843 m to go and the player
   5th. Nobody starts together on the line.
9. Owner point 3 (relay, 3.png): the field is crouched ON the finish line under the
   FINISH gantry with no stagger — everyone started at race 0, which is the finish line.
   In the picture, blocks sit behind the right-hand lanes while the blue runner's lane
   has no block behind him.
10. Owner point 4 (10,000m, 4.png): at lap 22/25 the player runs alone in lanes 3–4 on
    the bend; the field never breaks to lane 1. Robot CHECK agrees — the 10,000m test
    never reported the field's lanes.
11. Owner point 5 (steeplechase, 5.png): barriers stand only in the player's lane (lane
    3); every other lane is empty and the AI never jumps. A real barrier is one beam
    across the whole track, 0.914 m high. Robot CHECK: the steeplechase engine has 0
    barriers.
12. Owner's high-jump.jpg (2026-10-20): the athlete is a tiny figure far left, running on
    grass; the yellow "TAKEOFF ZONE — TAP ACTION" text overlaps the APEX ARCADE banner
    and is garbled; the top-left HUD text overlaps itself; an unexplained black cone with
    a gold top stands mid-field. Robot CHECK agrees on the substance: the takeoff is at
    −1.0 m with the bar at 17 m — he does not take off in front of the bar.
13. Robot run health: 6 FAIL, 9 CHECK, fixes 41/52 pass — the widest gap of the sports
    games. The 400m hurdles test and the 100m hurdles test errored outright (0.838 m
    hurdles untested), as did the one-table results test.

Note on timing: the owner's 5 points became JOB G-83; its fixes were in robot check but
not yet merged or seen on the owner's phone when he wrote. This verdict judges the pinned
run above, and the pictures in that run still show the problems.

Why high confidence: three independent sources — the owner's written points, the robot's
numbers, and my own read of the pictures — all point the same way.

Proposed fix tests: a dash picture with the full field on one start line, blocks aligned
(or correctly staggered for staggered events); hurdle heights measured at 0.914 m (300/400H)
and 0.838 m (100H); steeplechase barrier spanning all lanes; one results table with
athletes in the ATHLETE column; field breaking to lane 1 in the 10,000m.

---

## 5. Apex F1 Racing — SEND BACK — Confidence: High

Pictures judged:
- Robot play: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexf1-2-play.jpg
- Robot menu: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexf1-1-menu.jpg
- Robot close-up: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexf1-face.jpg
- Robot upright: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexf1-3-upright.jpg
- Owner pictures (defect screenshots, Oct 21 10:05–10:06 PM, arrived during this trial):
  https://github.com/Attacked-Kraken/18-Games-Casino/blob/main/looks/apexf1/owner-2026-10-21/1-heli-cam-upright.jpg ,
  https://github.com/Attacked-Kraken/18-Games-Casino/blob/main/looks/apexf1/owner-2026-10-21/2-heli-cam-in-ground.jpg ,
  note: https://github.com/Attacked-Kraken/18-Games-Casino/blob/main/looks/apexf1/owner-2026-10-21/README.md
  Owner's words: "F1 helicopter cam in ground. Whole camera view bad and steering
  controller bad. Need more steering control to stay on track."
- Reference: no picture target exists. Written target: `looks/refs/apexf1.md` (owner,
  2026-10-18) — realistic F1: low nose, front wing, halo, big rear wing, wide slicks,
  glossy paint; asphalt, red/white kerbs, grass runoff, catch fencing, grandstands with
  crowd, pit building, start/finish gantry, day race; NEVER boxy/cartoon cars or an empty
  grey track. See TARGET LINKS.

Differences:

1. Blurry picture. Robot CHECK: the game is drawn at 0.18x on a 2x phone screen against a
   1.5x target. STUDIO-STANDARD: sharp picture at min(devicePixelRatio, 1.5), never
   lowered. On its own, this blocks ready.
2. Robot FAIL: the start button "LIGHTS OUT" sits 214 px below the bottom of a sideways
   phone. STUDIO-STANDARD section 5 hard NO: every menu must fit 844x390 with no
   scrolling. (Robot number — that screen is past the menu pictures supplied.)
3. Robot FAIL: wheels sink more than 5 cm under the ground in 48 of 48 readings.
4. Car too tall. Robot measured the car at 5.95 long x 1.64 high x 2.07 wide. REALITY:
   an F1 car is 5.6 long x 2.0 wide x 0.95 high. The height is about 73% over real.
5. Cartoon side profile. In the close-up the cars read flat and cartoonish — the exact
   thing the written target forbids. Wheels are flat discs with yellow rings and red
   centres, and the purple AI car's wheel is a white/pink target-like disc, inconsistent
   with the player's wheels. Seen in apexf1-face.jpg.
6. A part that belongs to no car. A thin red plank floats at wheel height between the
   red car and the purple car in the close-up.
7. Robot CHECK: AI cars are not the same model as the player's — KAI is drawn at 4.13
   against the player's 6.64 on the footprint axis. REALITY: opponents obey the same
   rules and sizes.
8. Empty, flat circuit in the play picture. No red/white kerbs on the stretch shown
   (target: red/white kerbs), grass is flat solid green on both sides, the right side is
   one long flat repetitive grey pit wall with no crews or detail, and there is one small
   distant grandstand. The start gantry is there but its sign is illegible.
9. HUD overlaps itself. Top-right, the tyre/ERS/gear cluster overlaps: the black gear
   circle with "0" covers part of the ERS box and the "N" is clipped at its bottom.
   Bottom-left, the joystick circle overlaps the PIT button.
10. Menu problems. Landscape menu sits on a plain near-black background with no car or
    circuit behind it, and the MY FRIEND CODE box at the bottom is cut off by the frame
    edge. The upright menu fits — but "Finish a race to earn your code" is set in a
    monospace/typewriter font, a STUDIO-STANDARD section 5 hard NO for menus.
11. The race never started in the robot's tests (facing-forward, steering and
    slowest-AI-pace tests all report no start), career-mode tests errored or timed out
    twice, and three tests report "fx.test is not a function". Fixes: 9/20 pass — the
    lowest of the six games. Listed because it means there is no valid race picture
    sequence to judge beyond the stills above; the look failures stand on their own.
12. Owner picture 1 (upright): the helicopter camera sits under the track. The screen is
    almost entirely blue sky with a thin strip at the top showing the catch fencing and
    the underside of the circuit. There is no car and no track surface anywhere in the
    frame — while the HUD reads LAP 1/5, P20, a 15s PENALTY, and 0 MPH. REALITY: the
    player must always be visible and the camera must never be inside the world. Here
    the player can see nothing at all.
13. Owner picture 2 (sideways): the camera is under the ground looking up. The car
    appears small at the top edge, seen from below, behind a giant "CONTACT!" banner
    and a 10s PENALTY tag. The SKIP QUALI button covers the speed readout — only the
    "44" and gear "2" peek out from behind it. The owner's steering complaint ("need
    more steering control to stay on track") is feel and is not judged from stills, but
    the camera failure in both pictures is plain to see.

Why high confidence: the headline items are measured, not taste — 0.18x sharpness,
48/48 sunken wheels, a start button 214 px off screen — and the cartoon side profile is
visible in the supplied close-up against a written target that forbids exactly that.

Proposed fix tests: rendered resolution at 1.5x in the robot's sharpness check; a full
menu screenshot at 844x390 with the start button inside the frame; a side-profile close-up
next to the picked TARGET LINK with matching wheel design across all cars; wheels on the
ground in 48/48 readings; a helicopter-camera picture, upright and sideways, with the
track surface and the player's car in frame.

---

## 6. Exotic Racer Club — SEND BACK — Confidence: High

Pictures judged:
- Robot play: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexracer-2-play.jpg
- Robot menu: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexracer-1-menu.jpg
- Robot close-up: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexracer-face.jpg
- Robot garage: https://github.com/Attacked-Kraken/18-Games-Casino/blob/game-checks/img/apexracer-pic-garage.jpg
- Reference: none in the repo. The board MUSTs "Cars match the owner's photo: wheels and
  rims exactly as in the picture (e.g. white rims)" — but the owner's photo is not in the
  repo, so that MUST cannot be checked. See TARGET LINKS.

Differences:

1. Robot FAIL: wheels sink more than 5 cm under the ground in 48 of 48 readings.
   Robot FAIL: script error "R.skids is not iterable".
2. A white bar across the hero car's nose. In both the menu picture and the garage
   picture, a straight white horizontal bar/plank sits across in front of the "V12
   Goblin" nose, wider than the bumper. It does not read as supercar design; it reads as
   an untextured or misplaced part — on the car the player sees first.
3. Wheels and rims unverifiable — the board's central MUST cannot be passed. In the play
   picture the cars are distant, the wheels small and dark, and no white rims are
   visible. There is no owner photo in the repo to compare against, so the model match
   is unproven either way. This item alone is medium confidence; the verdict does not
   rest on it.
4. The close-up proves nothing. The robot's close-up camera is inside/behind a purple
   car: about 80% of the frame is black windscreen and purple bodywork, with one tiny
   silver car far right. REALITY says the camera must never be inside a car — and as a
   proof picture it shows none of the model.
5. Blown-out car and overlapping HUD in the play picture. One centre car is an
   overexposed pink/white blob — the lights blow out its shape entirely. Top-left, the
   "6th/8" script is covered by the LAP 1/3 / TIME 0:00:00 / BEST block plus a US flag
   and "New York" label. The speedo reads 0 MPH and the time 0:00:00 (robot's
   cars-drive-forward test timed out past 30 s).
6. Garage picture is not a garage. The car stands in a light studio void. "V12 Goblin ·
   Class S" is clipped at the top edge and is low-contrast pink on white. The bottom
   car-list cards are clipped at the right edge ("Phanto…", price "380,0…" cut off).
   The contact shadow is a pink oval glow, so the car reads as floating.
7. Menu clipping. The green "Welcome bonus 200,000!" pill overlaps the Back button;
   "PRESENTED BY APEX A…" is clipped off the right edge; the bottom-left tile is partly
   cut at the bottom edge.
8. Robot CHECK: AI pace is about double the player's — AI field median best lap 29.8 s
   against the player's best 61.1 s (the rule is within 5%). The home-screen fix test
   says the turntable car is not turning (spin moved 0.06 rad in 1.4 s), and the zenith
   paint is not the shiny clearcoat paint (G-46: clearcoat must cover the whole body
   shell).
9. Heaviest game of the six: 339 draw calls per frame, max 442 — over STUDIO-STANDARD's
   under-300 target and close to the 450 CHECK line. Robot measured car object
   2.83 x 1.55 x 5.62 m (axes as the robot reports them) against REALITY's supercar
   4.5–4.8 long x 1.95 wide x 1.1–1.4 high — on the robot's own axes the shape is longer
   and taller than a supercar; needs a clean single-car measurement with named axes.
   Fixes: 10/17 pass.

Why high confidence: a script error, 48/48 sunken wheels, and the same white nose bar
seen in two separate pictures. The one genuinely open question — do the cars match the
owner's photo — is open only because the photo is missing from the repo.

Proposed fix tests: menu and garage screenshots with no clipped text and the hero car
whole; a side-profile and front three-quarter proof of each car next to the owner's photo
(once supplied) with rims matching it exactly; headlight exposure that keeps the car's
shape readable at night; single-car measurement with named axes.

---

## TARGET LINKS — for the four games with no target picture

No pictures were downloaded or committed — other companies own them. These are links
only. The owner picks ONE per game; that pick becomes the game's target picture, and the
game should then be re-judged against it.

### Apex Baseball

1. MLB The Show 25 — official PlayStation page (screenshots/presentation):
   https://www.playstation.com/en-us/games/mlb-the-show-25/
   Copy: broadcast centre-field camera height, pitcher and batter readable at full size
   on screen, bright day lighting, grandstands full of detailed crowd.
2. Operation Sports — best camera angles in MLB The Show 25:
   https://www.operationsports.com/best-camera-angles-in-mlb-the-show-25/
   Copy: the classic broadcast shot from behind the pitcher's mound — camera height and
   angle, and how big the batter is in the frame.
3. ESPN's Sunday Night Baseball presentation (Disney/ESPN):
   https://thewaltdisneycompany.com/news/espn-mlb-micd-up-statcast-sunday-night-baseball/
   Copy (real TV broadcast): how a real telecast frames the game — replays from behind
   the pitcher and over the shortstop's shoulder, players big and lit, crowd as depth
   behind the action, not a dark empty bowl.

### Apex Ice Hockey

1. EA NHL 25 — official presentation page:
   https://www.ea.com/games/nhl/nhl-25/features/presentation
   Copy: broadcast-inspired cameras (wire, drone and static rink cameras), arena
   lighting, crowd depth, and how big the skaters are on screen at the main camera.
2. Technicolor Games on NHL 25:
   https://www.technicolorgames.com/news/hit-the-ice-with-technicolor-games-in-ea-sports-nhl-25/
   Copy: gear detail at console quality — uniforms, goalie sets, skates, sticks — and
   the arena environments around them.
3. Real NHL game photo — Islanders at Maple Leafs, Scotiabank Arena (Getty photo on the
   page): https://heavy.com/sports/nhl/toronto-maple-leafs/how-to-watch-islanders-vs-maple-leafs-live-today-tv-streaming-lineups/
   Copy (real game): ice-level light and scale — a goalie mid-save, skaters at real size
   against a packed arena crowd. This is the gear-and-crowd detail a close-up must carry.

### Apex F1 Racing

1. F1 25 — extended first-look gameplay (OpenCritic):
   https://opencritic.com/news/15603/ea-sports-f1-25-reveals-an-extended-first-look-gameplay-video
   Copy: TV-style cameras over LIDAR-scanned circuits, car detail, and fan areas full of
   crowd — the opposite of an empty grey track.
2. F1 25 review with screenshots (Dexerto):
   https://www.dexerto.com/gaming/f1-25-review-a-stylish-upgrade-that-leads-from-the-front-3206920/
   Copy: chase-camera car size on screen, glossy paint, kerbs, runoff and grandstand
   detail in a day race.
3. Mexico City GP — where to watch the action (F1 Experiences, real circuit):
   https://f1experiences.com/blog/where-to-watch-the-action-at-the-mexico-city-gp
   Copy (real circuit): main-straight grandstands over the starting grid and pit lane,
   catch fencing, and crowd scale against the cars.
   (The repo's own `looks/refs/apexf1.md` already links F1 25 and F1 Mobile Racing —
   those stay as supporting references.)

### Exotic Racer Club

1. Forza Horizon 5 — page with an in-game street-race screenshot (Lamborghini Diablo SV
   vs Porsche 911): https://en.wikipedia.org/wiki/Forza_Horizon_5
   Copy: street-race chase camera, car size on screen, city light on real car shapes.
2. Forza Horizon 5 — street-race gameplay video:
   https://www.youtube.com/watch?v=enrQ8sts-w8
   Copy: how the cars sit on the road and stay readable at speed in a city street race —
   wheels on the ground, shapes never blown out by their own lights.
3. Midnight Run — real supercars filmed at night (Photobomb Media):
   https://www.photobombmedia.com.au/about-9
   Copy (real cars): real supercars under city lights at night — headlight exposure,
   reflections on real paint, close-ups of the car's special features. This is the fix
   for the blown-out pink/white blob in the current play picture.

---

## What else I could do

- Menus and screens. Check every menu against the sideways 844x390 frame: nothing
  clipped, nothing overlapping, no monospace/typewriter text. Found in this trial in
  Hockey (clipped lines), F1 (typewriter friend-code line, cut-off code box) and Racer
  (clipped title, overlapping bonus pill). Needs from the owner: nothing — the robot
  already shoots menu and upright pictures every run.
- 3D models before they are used. Judge new or changed models from close-up pictures
  before they ship: visor/cage and face (Hockey), uniform (Baseball), rims and side
  profile (Racer). Needs: car proof shots from the side and front three-quarter — the
  robot's `-face.jpg` slot covers faces/planes, but Racer's close-up was shot from
  inside a car and proved nothing.
- The venue and the crowd. Compare each venue against its `venues/` spec sheet and read
  the crowd at close range, not just from the broadcast camera (Hockey's close-up crowd
  is flat and identical; Baseball's bowl reads empty; Flight has no airport). Needs:
  approved venue sheets, and targets picked for the four games above.
- Camera angles. Audit each game's cameras against REALITY: never inside a wall, car or
  player; the player always visible and never covered by the HUD (Flight's horizon gauge
  covers the runway centreline; Baseball's batter sits behind the UI bar). Needs: the
  robot's camera set per game kept as-is so runs stay comparable.
- Comparing one game to another. One standard across all six — fonts, HUD cleanliness,
  lighting. Baseball's typewriter HUD next to Hockey's clean scorebug shows the gap a
  cross-game pass would catch. Needs: nothing extra.
- Checking a fix really changed the picture. Re-judge the same picture slots after a fix
  lands, before/after on the same robot run, so "fixed" is seen and not claimed (the
  proof rule). Flight's throttle is the standing example: the owner's request and the
  robot's picture are from the same evening, and the picture says not done. Needs: fix
  PRs to name the picture slot that proves them.

## Limits of this trial — honest list

- Still pictures cannot judge motion: skating stride, sprint cycles, whether animation
  matches speed, moonwalking or wrong-way facing in play. Where this file mentions
  smoothness it cites the robot's frame numbers (for example Baseball's 6 hitches, worst
  800 ms); it does not pretend to have seen them.
- Feel is out of reach of pictures: two-thumb control at once, steering and throttle
  response as felt, sound and music. Flight's throttle problem is judged from the
  owner's note, the overlapping button in the picture, and the robot's speed tests —
  not from touching it.
- Four of six games (Baseball, Hockey, F1, Racer) have no target picture in the repo, so
  their verdicts rest on written boards and robot numbers, not a picture match. Once the
  owner picks a TARGET LINK per game, those four should be re-judged against the picked
  picture.
- Flight's and F1's owner pictures are the owner's own screenshots of current defects
  (Flight with KEEP: the jet model; F1 the helicopter camera under the ground), not
  clean target renders. Track & Field's owner pictures are
  complaint evidence tied to JOB G-83 points, not an approved-play picture.
- Robot framing caveats: Flight's black sky in the close-up may be the robot's camera,
  not the game; Racer's close-up was taken from inside a car and was used only as
  evidence that the proof slot failed, not as a read of the model.
- Some robot object measurements capture a group, not one athlete (Hockey's "skater" at
  6.54 m). Those numbers are reported as the robot's, never as a player's size.
- One robot run only, pinned at the top of this file. F1's race never started in its
  tests, so F1 has no valid race sequence to judge beyond the stills supplied.

End of trial. No changes were made to jobs/HELP.md, any look board, or SCORES.md.
