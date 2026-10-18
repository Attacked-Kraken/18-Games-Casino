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

## 4. Feel

- The camera always shows the play. No camera stuck inside a wall or a player. A zoom that hides the action is a defect.
- Every action has a sound and visual feedback (ASSET-LAW Part II: menu music, game music and sounds, plus a mute button).
- Sideways play only (LANDSCAPE LAW). Big touch buttons, at least 44 px.
- **Clean screen** (owner, Oct 17 2026): during play the screen shows only the game, the score line and the buttons
  you need right now (short labels or icons). All instructions live behind a **"How to play" (?) button**, closed by
  default, that turns sideways with the game. No keyboard words on phones ("space", "press 1", "WASD", "arrow keys").
  A tip may flash for 2 seconds at most and must never cover the play. The robot FAILS a play screen with 40+ words.

## 5. Hard NOs (the robot FAILS the pull request)

- Players that are not real rigged 3D bodies, in a sports game (`"people": true` in `tools/game-check/games.json`)
- Any call to the outside internet (fetch, CDNs, fonts, analytics). Games are fully offline.
- Real brand, league, team or player names on screen
- Casino or gambling words in a Game Development title
- A wordy play screen (40+ words during play) or keyboard words ("space", "WASD") - see "Clean screen"
- A "Your name" box. It must say **"Player nickname"**.
- A broken 3D shader, missing files, a black screen, or a rotate sign
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
