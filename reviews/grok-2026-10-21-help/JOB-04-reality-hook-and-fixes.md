# JOB-04: REALITY hook in Baseball, Hockey, F1, and Racer, plus the stick and hockey fixes

Apply with `git apply patches/04x-....patch` from the repo root. Every patch was checked with `git apply --check` against main at 96a092a (Oct 21, 12:2x AM CT), one at a time and all together.
Each game was then loaded headless with **no new console errors**. Full patched files are also in `drop-in/` if a patch ever stops applying, but prefer the patches.

## 04a: Hockey (`apexhockey.html` + `characters/base-human-v2/gear.js`)
- **Skates sink / no blades (C-001):** the stance pinned the foot *bone*, but the steel is what you see. Now, every frame, `snapSkatesToIce()` reads the real skinned position of the blade vertices and moves the rig so the lowest blade edge sits at y=0.
  - Blades are 60% taller.
  - The holder is taller and white.
  - The steel no longer renders near-black: metalness was .9 with no env map, now .45 with a little emissive.
  - Measured: blades at 0.000 to 0.004 units on every skater over 3 s. Before: −0.3 units (sunk 9 cm), or floating. See `proof/hockey-skates-before.png` and `hockey-skates-after.png`.
- **SAVED! twice (C-002):** each goalie gets one save per shot. A rebound within 1.2 s is the same save, so no second banner or second commentary line.
- **Camera rewind (C-002):** when a faceoff or whistle teleports the play more than 60 units, the camera **cuts** like TV instead of sweeping back across the rink.
- **Camera through the ice (C-003):** `CAM_MIN_Y = 1.5 m` (4.89 units) after every camera move. The PLAYER view was at 0.67 m, so it now sits at 1.5 m. Measured lowest camera in every view: 4.89 units or more.
- **Stick reset:** the joystick and keys let go on `blur`, `pagehide`, `pointercancel`, and `visibilitychange` (hidden).
- **REALITY hook:** `kind 'skater'`, with `player` = your skater.
  - `contact` = a marker at the real lowest blade edge of the skate carrying the weight. The other foot lifts on each stride, which is real skating.
  - `expect.height` is scaled because the rink is 3.26 units per metre.
  - REALITY robot result: **PASS** (no fail, no check). Height 6.47 units = 1.98 m. It moved 9 times, never wrong-way or backwards.

## 04b: Baseball (`apexbaseball.html`)
- **Aim pad (C-005):** it follows one finger (`pointerId`) and lets go on up, cancel, lost capture, blur, pagehide, and hidden. Before, it kept following `e.buttons`.
- **REALITY hook:** `kind 'person'`. `player` = the batter, or the pitcher when you pitch. `others` = the catcher plus fielders.
  - The ground includes the mound height.
  - The field is about 1.1 units per metre (mound 20.17 units = 18.4 m).
  - REALITY robot: **no fail**. Height 1.91 units ≈ 1.75 m. There's one CHECK, "did not move with go()", because a batter doesn't run on his own. That's OK.
- **Not in this patch:** the 8 ft players (C-004). That's PR #805/#831's job. Once they land, the REALITY robot will measure them with this hook.

## 04c: F1 (`apexf1.html`)
- **Start lights (C-007):** the 600 ms "hide lights" timer is stored and cancelled when a new start begins, and it won't hide lights that are showing again.
- **Stick reset:** steering, gas, brake, reverse, and ERS all let go on blur, pagehide, pointercancel, and hidden. Before, it only handled touchend and touchcancel.
- **REALITY hook:** `kind 'f1'`. `contact` = the 4 wheel pivots, and `footOffset` = the tyre radius measured from the wheel mesh. `track` = the track direction at the player's spot, and `go` = gas.
  - REALITY robot: **PASS**. Length 5.95 m, moving the right way, wheels on the track.

## 04d: Exotic Racer (`apexracer.html`)
- **Fallback car:** **not needed anymore.** PR #819 (G-70) already swaps a model that failed to load for another loaded model, or the built-in car (line 1059). I checked `makeGlbCar` is only called from there.
- **Stick reset:** the stick and all buttons let go on blur, pagehide, pointercancel, and hidden. The game already paused on hidden, but the stick stayed pushed.
- **REALITY hook:** `kind 'car'`. `contact` = the tyre meshes of the real model, and `track` = the direction of the track centre line at the player.
  - `expect.length` is widened by 1.2x, because G-01 made the cars 1.2x bigger on the owner's request. Delete that line if he wants real size.
- **REALITY robot found a real problem:** 2 of 4 tyres sit about 5 cm above the road ("FLOAT 12 of 24 readings, highest 0.05 m"). The model probably sits nose-up, or the front and back tyres are different sizes.
  - **Heads-up:** with this hook, game-check will show that as a new FAIL on the racer, so the patch may go red until a builder levels the car (lower `model.position.y`, or tilt it, so all 4 tyres touch).
  - It also showed "did not move in 5 s": the race was still counting down or loading in my run. Give it a longer wait in games.json if it repeats.

## How to verify
```
git apply --check patches/04a-*.patch patches/04b-*.patch patches/04c-*.patch patches/04d-*.patch
git apply patches/04*.patch
# then the normal robots: game-check (REALITY lines), plus JOB-01 visual-check for the close-ups
```
Patch 03 (phone heads) also applies cleanly on top of the 04 patches. Both orders were tested.
