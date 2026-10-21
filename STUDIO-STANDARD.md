# STUDIO STANDARD — what "good" looks like in every Apex game (owner, 2026-10-16)

The owner should never have to explain quality again. This file is the bar for **every** job. Every look board
(`looks/<game>.md`) sits on top of it: the look board adds the game's own MUST / NEVER lines, this file covers the rest.
The game check robot enforces the parts a machine can measure, **on every pull request**. A red check means the
pull request is not allowed to merge.

Not cartoon games. Real sports, real proportions, real gear, real arenas, as close to a console sports game as a phone can run.

---

## 1. People (athletes, crowds, referees)

**Always use the shared parts. Never build people from boxes, balls or tubes.**

| Need | Use this | Never |
|---|---|---|
| Body | `characters/base-human-v2/humans.js`: real CC0 rigged bodies (male + female, 6 skin tones, hair, faces, 11 animations) | blob/box/capsule people, "primitive" figures |
| Sport gear + stance | `characters/base-human-v2/gear.js`: `hockeyKit()` today, built from `gearKit` blocks for the next sports | bolting loose boxes on top of a hoodie |
| A quick look in real light | `tools/model-viewer.html?m=models/hockey-skater.mjs&look=rink` | mockups or drawings |

**Body rules** (the robot measures these where it can)
- About **7.5 head heights** tall (`kit.stance.measure().heads`). No big-head or chibi proportions.
- Athletes wear the **real gear of their sport**, sized to the body and riding the skeleton, so it bends with the
  animation. Hockey, for example: helmet with visor, shoulder pads and elbow pads under the jersey, oversized gloves,
  padded breezers, socks over shin guards, and skates with steel blades.
- **Sport stance, not a walk.** Each sport has its ready position (hockey: lean 15–20°, knees 25–30°, hips back over
  the heels, wide stance). The kit's `stance.apply()` sets it **exactly**, every frame, on top of any animation.
- **Equipment is held or worn, never floating.** Sticks, bats and rackets sit in the hands, with the blade or ball
  on the ground or in play. A loose object in the air is a defect.
- Numbers and names read the right way round from behind. Faces are visible (a visor or open cage, never a blank mask).
- Our own made-up team names, crests, numbers and player names only. No real leagues, teams, players or brands.

**How to add a new sport's gear** (football, soccer, baseball, basketball…)
1. Copy the pattern of `hockeyKit()` in `gear.js` into a new `footballKit()` (or similar). Pads, gloves and pants use
   `tube()` + `batch().add(geo, colour, [[boneA, boneB], ...])`, which skins them to the body. Helmets, gloves and
   shoes use `batch().add(geo, colour, 'boneName')`, which attaches them rigidly to one bone.
2. Give the sport its own `makeStance()` numbers, from the owner's reference picture.
3. Add a viewer model `models/<sport>-player.mjs` and a `MODELS.md` entry (`WAITING OWNER`), then wait for 👍.
4. Turn the reference picture's numbers into tests in `tools/game-check/fixes/<game>.mjs`. Copy the hockey ones.

## 2. Phone budget (iPhone, 60 fps target)

- **Draw calls:** under **300 per frame** in gameplay (the robot reports a CHECK over 450). One athlete from the kit
  is 9 draw calls. Merge static scenery (`BufferGeometryUtils.mergeGeometries`). Use `InstancedMesh` for crowds,
  seats and cones.
- **Triangles:** under about 300k on screen. One kit athlete is about 48k.
- **Textures:** 1024–2048 px. One atlas per character where possible (the jersey and sleeves share one).
- **Download:** under 60 MB before play (the robot reports a CHECK over that). Models as `.glb`. Big files go
  through the patch robot.
- **Per-frame code:** no `new THREE.*` inside the game loop, and reuse vectors. The kit's stance costs about
  0.2 ms per player.
- Shadows: on desktop, off or baked on phones (`COARSE` / touch devices).
- **Sharp picture (owner, 2026-10-17: "get them to not make blurry players"):** draw the 3D picture at
  `Math.min(devicePixelRatio, 1.5)` on phones and **never lower it to save speed** - blurry players are worse than
  a few fps. When a game is slow, cut crowd detail, shadows, particles or draw calls instead. No depth-of-field, no
  heavy fog over the players, no downscaled player textures. The robot measures it on a 2x phone screen and gives a
  CHECK under 1.4x ("Blurry picture"). The shared kit's auto quality is OFF for this reason (apex-gfx "sharp").
- **Full screen, always sideways (owner's law):** held upright, the game is shown sideways and fills the WHOLE screen
  - never half a screen with black. The robot FAILS under 90%. Use `ApexKit.fit()` or size to the turned box.
- **Controls work together:** holding the move stick never blocks the action buttons (run, shoot, jump) - every
  game supports two thumbs at once (multi-touch). Add a play test that holds the stick and taps the button.

- **No stutter** (Oct 18): the robot CHECKs 3+ short freezes in 6 s of play; the owner's phone reports them too. Build every
  model, texture and crowd BEFORE play starts, reuse objects instead of making new ones every frame, and use the kit's
  far-away detail helper (`ApexKit.lod`) for stands and crowds.

## 3. Arenas and worlds

- **Every place has a spec sheet in `venues/`** with real measurements and a MUST list: rink, soccer, ballpark,
  track, F1 circuit, streets, monster truck arena, airport, planes. Never make up a venue.
- **Use the shared parts:** `venues/kit/stadium.js` (the seating bowl and a moving crowd of 15,000+ fans in about
  10 draw calls; presets `arena`, `stadium`, `ballpark`, `grandstand`) and `venues/kit/rink.js` (a real-size rink).
  Check them in **`tools/venue-viewer.html`** (aerial, TV camera, end and floor cameras at real size).
- **Every sport has a rules sheet in `rules/`**: what the game must enforce (offside, icing, fouls, outs...), the
  game flow and the broadcast look.

- Use the lighting preset from `look-presets.js` (`rink`, `field`, `track`, `night`, `studio`), the same one in the
  game and in the model viewer.
- Real venue layout for the sport: correct lines, goals, boards, stands, lights, scoreboard. Our own sponsor names
  only ("APEX ARCADE").
- Crowds move (instanced, cheap). Nothing should stand perfectly still.

## 3b. Using a fetched 3D model (Sketchfab etc.) (owner, Oct 19 2026)
Learned the hard way on G-01 (the V12 Goblin came in white, sideways and half size):
1. Wrap it: put the loaded model inside its own empty Group. Turn/scale/move ONLY that inner model once, at load,
   to face the way the game drives. All driving, steering and color code works on the outer Group, never the model.
   A color/paint change only swaps or recolors materials - it never touches any part's rotation or position.
2. Measure from the VISIBLE meshes only. Hidden parts (shadow planes, collision boxes) make the size and the
   "which way is long" check wrong.
3. Don't trust material names. On the Goblin "car_body" was the RIMS. Check each part's color in the garage
   picture before you say done.
4. Give every car a real starting color - never white or grey by default.
5. Before "done": a robot picture of the model in the garage AND in the race, nose pointing down the track.
6. EVERY model has its OWN turn - never one turn for all (Oct 19: G-04 gave the wagons the Goblin's turn - they drove
   sideways and came in huge). Find each model's nose (low front, smaller front tires) and give it its own value.
7. Fix ONLY what the job says. Never rewrite the code around it (how cars sit on the track, steering, computer
   drivers, cameras) - change the smallest piece that fixes the point (owner Oct 19: "Muses still mess stuff up while
   trying to fix something else").

## 4. Feel

- The camera always shows the play. No camera stuck inside a wall or a player. A zoom that hides the action is a defect.
- Every action has a sound and visual feedback (ASSET-LAW Part II: menu music, game music and sounds, plus a mute button).
- Sideways play only (LANDSCAPE LAW). Big touch buttons, at least 44 px.
- **Phone polish** (owner, Oct 19 2026, from Gemini):
  - Touch: the game area has `touch-action: none` and touch handlers call `preventDefault()` - a thumb on the stick
    never scrolls, zooms or drags the page.
  - Juice: big moments (goal, crash, landing, coin) get a short screen shake, a sound and a quick "pop" (kit/apex-fx.js
    has all three).
  - Sound unlock: start the game's sound on the first tap (the PLAY button), or iPhones stay silent.
  - Buttons and the score line stay inside the phone's safe edges (`env(safe-area-inset-*)`), never under the notch.
  - Camera follows smoothly (eases toward the player), never snaps or shakes from being glued to the model.
  - Game over / finish: a big one-tap "Play again" that restarts at once, no reload. Best scores are saved on the phone.
- **Clean screen** (owner, Oct 17 2026): during play the screen shows only the game, the score line and the buttons
  you need right now (short labels or icons). All instructions live behind a **"How to play" (?) button**, closed by
  default, that turns sideways with the game. No keyboard words on phones ("space", "press 1", "WASD", "arrow keys").
  A tip may flash for 2 seconds at most and must never cover the play. The robot FAILS a play screen with 40+ words.

## 4b. Plan first, build in stages (owner, Oct 18 2026)

Every NEW game and every BIG change (stadium, venue, crowd, career, new mode, rebuild, 3D model) starts with a
one-page plan - `plans/<game>-<job>.md` from `plans/TEMPLATE.md`: the 30-second fun, controls, ONE camera spec,
3 reference pictures of real games, what stays exactly as now (KEEP), the stages and Done means. Commit it alone
(message `PLAN JOB Jn`), say `PLAN READY JOB Jn` and STOP - the owner sees it on his board and taps 👍 Build it or
👎 Change the plan. No game code before his 👍. Then build in stages, one PR per stage, nothing outside the plan:
1) gray box that proves the fun and the camera, 2) one polished level/match, 3) everything else.
Why: guessing what the owner wants caused most redo's (Monster Truck J45 rebuilt his truck when he asked for a
bigger stadium).

## 5. Hard NOs (the robot FAILS the pull request)

- Players that are not real rigged 3D bodies, in a sports game (`"people": true` in `tools/game-check/games.json`)
- Any call to the outside internet (fetch, CDNs, fonts, analytics). Games are fully offline.
- Real brand, league, team or player names on screen
- Casino or gambling words in a Game Development title
- A wordy play screen (40+ words during play) or keyboard words ("space", "WASD") - see "Clean screen"
- A "Your name" box. It must say **"Player nickname"**.
- A broken 3D shader, missing files, a black screen, or a rotate sign
- **Apex look:** menus in typewriter (monospace) letters or green "computer screen" text, or a green film over the venue.
  Use the house look of F1 / Monster Truck: bold clean letters (system-ui), white text, Apex red + gold accents,
  dark see-through panel, the venue clear behind it (owner, Oct 17)
- **Fits the screen:** a start/PLAY button below the bottom of a sideways phone (844x390). Every menu must fit with NO
  scrolling - scale the menu panel down or put PLAY at the top, and keep long text behind "How to play" (owner, Oct 17)
- Any of the owner's fix tests (`tools/game-check/fixes/<game>.mjs`) that this PR breaks

The robot only blocks problems the pull request **adds**. Problems main already has are listed, but they don't trap you.

---

## 6. How a job is written (owner and approver)

Every job has **three parts**. A job without them is sent back:

```
NEW JOB Jn <game>: <one line, what to make>
REFERENCE: <the picture the owner sent, or a MODELS.md / looks/ entry>
SPEC: venues/<place>.md and/or rules/<sport>.md (the job may just say "build the stadium", the sheet says how)
DONE MEANS: <3-6 things the robot or the owner can check, with numbers where possible>
```
If the owner's job only names a place or a rule ("build the stadium", "add icing"), the **spec sheet's "Robot checks"
lines are the DONE MEANS**.

Example: *"DONE MEANS: players 7.5 heads tall; lean 15–20°; knees 25–30°; helmet + visor; stick in both hands
with the blade on the ice; under 300 draw calls."*

Before starting, the Muse writes each "done means" line as a fix test. The job is done when the robot shows ✅ on
every line **and** the owner gives 👍 on the pictures.

## 6b. Hands-off approvals: the model gate robot

1. Build the new player, venue or vehicle as a `models/*.mjs` file and add it to `MODELS.md` (`WAITING OWNER`).
   Venues use `tools/venue-viewer.html` in the `view:` line.
2. Build the game change that uses it on its own branch, and open the pull request **with the line
   `waits-model: <id>` in its description**. Don't merge it yourself.
3. The robot photographs the model. The owner taps 👍 or 👎 on his phone.
   - **👍:** the Muse sets the model's status to `LOCKED`, nothing else. **`tools/model-gate.py` then merges every
     pull request waiting for it** and re-runs the game check by itself.
   - **👎:** his words come back to you. Fix exactly that, bump `version`, and set `WAITING OWNER` again. The waiting
     pull request stays waiting.

## 7. Art director (one Muse window, picked by the owner)

The art director makes nothing new. For every pull request that changes how a game looks, it:
1. Opens the robot's pictures (game-checks branch or the PR's check) next to the job's REFERENCE picture.
2. Lists every visible difference in plain words ("helmet too small", "stick floats above the ice", "socks have no stripes").
3. Turns each difference into a fix test, or a MUST/NEVER line in `looks/<game>.md`, and sends it back to the Muse
   who did the work.
4. Says "ready for the owner" only when the pictures match the reference. The owner gives the final 👍.

## 8. Before you say "done"

- [ ] Read `looks/<game>.md` and this file
- [ ] Used the shared parts (humans.js + gear.js); built nothing from boxes
- [ ] The pictures match the REFERENCE picture (front, side, in game)
- [ ] Every "done means" line is a fix test, and every one is ✅
- [ ] The game check on your pull request is green
- [ ] Say "merged, NOT yet seen" until the owner has looked

## 9. How every game is built - from now on (owner, Oct 21 2026: "make it stick for the future games")

Why: each game was one giant file with its own copy of the controls, so one fix broke something else, the same fix had
to be made 11 times, and shared parts (characters/) broke other games.

1. **One fix per job.** A job asks for ONE change. The owner's list of 5 points = 5 jobs, sent one after another.
2. **Shared controls.** Thumbstick, buttons, button layout and "let go = stop" (pointerup / pointercancel / blur /
   hidden tab) live in ONE shared kit file (`kit/controls.js`, built first by one builder for its own game). Every
   game uses it. A game never writes its own stick again; a stick bug is fixed once, in the kit.
3. **NEW games are split into small files** from day one: `games/<slug>/` with `controls`, `camera`, `world`,
   `players`/`cars`, `ai`, `menus`, `rules` - each one job's worth. The page itself only loads them. No game file
   over ~800 lines.
4. **Shared folders (characters/, kit/, venues/, models/) change only in their own job**, and that pull request must
   show the robot pictures of EVERY game that uses the part, not just yours.
5. Every job still ends with a play test that proves it (`tools/game-check/fixes/<game>.mjs`) - see DONE.md.
6. **FILE GUARD (owner, Oct 21 2026).** Every job order says `FILES YOU MAY CHANGE: ...`. A pull request may change ONE
   game (its page `apex<game>.html`, its play tests `tools/game-check/fixes/apex<game>.mjs`, its `looks/<game>/` folder)
   plus notes (your `jobs/G-NN.md` report, `jobs/QUEUE.md`, `reviews/`, `CLAIMS.md`, `LESSONS.md`, `MODEL-SEARCH.md`,
   `MODEL-REQUESTS.md`). The report and test files are ALWAYS allowed. A shared part (`kit/`, `venues/`, `models/`,
   `characters/`, `sounds/`) changes in its OWN pull request with no game page in it. Anything else (another game, the
   hub `sports.html`, `games.json`, robots, workflows) is not yours: the game check robot FAILS the pull request with a
   `FILE GUARD:` line and it cannot merge. This runs on every pull request, for every game, now and in the future.

The 6 games being finished now (Baseball, Hockey, Flight, Track & Field, F1, Exotic Racer) follow rules 1, 2, 4 and 5
now. Rule 3 (splitting their big files) waits - see LATER.md.
