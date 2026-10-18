# JOB J45 — HANDOVER from Muse main (casino), 2026-10-18

## Where things stand
- The J45 big upgrade was BUILT AND SHIPPED in full: claim PR #497, tests #498 (27 fix tests),
  game PR #500, stamp #501, model gate #502. Fix round 1 for the 1:18 AM game check (7 fails)
  shipped as #505 (game), #506 (test-suite restore), #507 (stamp).
- **The OWNER then reverted the game to the J5 version** (commit 23f4384, Oct 18 06:34 CDT;
  game + venues/kit/truck-arena.js + looks + fixes all restored). His words on the commit:
  "J45 changed his truck, lost the ramps and made the camera bad - he only wanted a bigger stadium."
  Main's apexmonstertruck.html is the 73,493-byte J5 build. Do NOT re-ship the J45 game over
  his revert without his word.
- The arena MODEL was repaired to match the reverted kit (PR #521): models/monster-truck-arena.mjs
  is v3, MODELS.md monster-truck-arena = version 3, WAITING OWNER, renders clean in the venue
  viewer (the game-check models report shows problems: none).
- Latest game check (main @ 257a901, Oct 18 8:42 AM) on the J5 build: play-drive-forward,
  play-crush-car and play-jump-airtime FAIL. Diagnosis: J5 predates the factory's game-time
  rule - it has no window.__test.step, so its tests run on wall-clock while the robot's phone
  renders in slow motion and everything under-measures. The J45 build passed all three on
  game time. Engine revs / music / real-sizes pass.

## In this folder (the J45 work, NOT on main)
- `apexmonstertruck-j45.html` - the J45 game at fix-round-1 state (PR #505 content).
- `truck-arena-j45.js` - the J45 stadium kit: 110x50 floor, close 3-tier bowl (bowlGap 9.5),
  44,964 fans who stand on big air, 7 wedge jumps (6 m mega), catch fence, 2 live screens,
  pyro, setScreen/stepCrowd/firePyro/report API. Exports buildTruckArena, TRUCK_JUMPS,
  TRUCK_CAR_SPOTS, ARENA_LAYOUT.
- `cannon-es-vendor.js` - cannon-es 0.20.0 minified ESM (MIT) - ships as vendor/cannon-es.js.
- `fixes-apexmonstertruck-j45.mjs` - the 27-test J45 suite (26 unique ids).
- `monster-truck-arena-model-v2.mjs` - the J45 model-gate wrapper for the kit above.
- `phys.mjs` - the node physics prototype with the TUNED constants and why (run it in node).

## If the owner asks for "just the bigger stadium" back on the J5 game
Swap in truck-arena-j45.js as venues/kit/truck-arena.js and wire the J5 game to it the way
apexmonstertruck-j45.html does (its buildStadium section): jump physics bodies from
TRUCK_JUMPS, crush cars at TRUCK_CAR_SPOTS, crowd excitement -> stepCrowd, screens via
setScreen. Keep the J5 truck, ramps behaviour and camera - those are what he locked.

## Traps that cost real time (all proven)
- cannon-es: a CANNON.Plane ground's world AABB ends at z=0 - wheel rays miss for z>0.
  ALWAYS a static BOX for raycast-vehicle ground.
- rollInfluence is the roll-moment arm scaler: 0.01 = corners flat, 0.47 = real body roll.
- NEVER call vehicle.updateWheelTransform/getWheelTransformWorld for rendering - it resets
  isInContact=false and corrupts grounded reads. Compute wheel visuals in truck-local space.
- The repo has NO examples/ dir: RoomEnvironment.js 404s live. Build the env scene inline.
- Robot phone = slow motion: tests must drive window.__test.step(seconds), never wall-clock.
- After editing a shared fixes file, COUNT its `id: '` entries against the original and use
  exact-match replacements only (a span regex once silently ate 4 tests).
- h.eval functions must be fully self-contained (source is shipped into the page).
- A merge PUT can disconnect mid-response and still have merged - always verify by GET.
