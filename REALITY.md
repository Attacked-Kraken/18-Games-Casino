# REALITY.md - does it look and move like the real thing? (owner Oct 20 8:23 PM)

Testers check EVERY line below in their game and prove each problem with a failing play test
(`tools/game-check/fixes/<game>.mjs`, id `tester-...`). Builders read it before every job.
Measure with numbers from the running game (positions, bounding boxes, speeds) - never guess from a picture.

## Everywhere
- **Direction**: everything moves the way it faces. Cars, runners, skaters, planes go FORWARD along the track/lane in the
  same direction as the AI and the lap checkpoints (dot of facing vs track direction > 0.9). No moonwalking, no driving the wrong way.
- **Size**: real sizes, in metres, against each other (see the table). Measure the model's bounding box in the game.
- **Ground contact**: feet, wheels and skates TOUCH the ground/ice while on it (gap under 3 cm). Nothing floats, nothing sinks.
- **Animation matches speed**: legs/wheels/skates move as fast as the body travels (no sliding feet, no spinning in place).
- **Camera**: never inside a wall, a car or a player; the player is always visible and not covered by HUD or a box.
- **Rules**: opponents obey the same rules as the player (hurdles, offsides, track limits, outs, laps).
- **Results**: finishing order matches who actually crossed first; one results screen, one menu button.

## Real sizes (metres)
| Thing | Real size |
|---|---|
| Adult player / athlete | 1.75-1.95 tall |
| Ice hockey rink | 61 x 26, boards 1.07 high, goal 1.83 wide x 1.22 high, puck 0.076 wide |
| F1 car | 5.6 long, 2.0 wide, 0.95 high; wheels 0.72 tall; track ~14 wide |
| Supercar / road car | 4.5-4.8 long, 1.95 wide, 1.1-1.4 high |
| Monster truck | 3.7 high, tires 1.7 tall |
| Baseball | bases 27.4 apart, mound to plate 18.4, ball 0.074 wide, bat 0.86 long |
| Athletics track | 400 m lap, lanes 1.22 wide, hurdles 1.067 (men 110 m) / 0.914 (400 m) high |
| High jump bar | 2.0-2.4 for men; pole vault pole 4.5-5.2 long |
| Small plane | 8-11 wing span, runway 30-45 wide |

## How to measure (play test ideas)
- Facing vs direction: compare the player's forward vector with the track's tangent at its position for 5 s of driving.
- Floating: lowest point of the feet/skates/wheels minus the ground height under it, every frame for 3 s.
- Size: `new THREE.Box3().setFromObject(model).getSize(v)` and compare with the table (allow +-15%).

## Robot hook (the REALITY robot measures all of this by itself on every game check)
Every game sets this once the player exists (tools/game-check/reality.mjs reads it):
```js
window.__reality = {
  kind: 'f1',                 // 'f1' | 'car' | 'truck' | 'person' | 'skater' | 'plane'
  player: playerObject3D,     // the player's car / athlete / plane
  others: aiObjects,          // AI cars / opponents (array, optional)
  contact: [wheelFL, wheelFR, wheelRL, wheelRR],   // what must touch the ground: wheels, feet, skates
  footOffset: 0.08,           // only if contact are bones: how far the bone sits above the sole
  ground: (x, z) => 0,        // ground / ice height under a point
  track: (x, z) => ({ x: 0, z: 1 }),   // the right racing direction there (unit vector) - racing games
  go: (on) => {},             // hold GAS / RUN so the player moves (the robot calls go(true) for 5 s)
  expect: { length: [4.8, 6.4] }        // only if this game's real size differs from the table
};
```
The robot then FAILS the game with a "REALITY:" line for: wrong size, wrong way round the track, moving backwards,
floating or sunk wheels/feet/skates. No hook = a CHECK line asking for it.


## Ground contact while moving fast (owner Oct 21 2026)
A real sprint has both feet off the ground mid-stride, so the robot does NOT fail a running player for a foot in the air. While the player moves fast (over 2 m/s - running, skating, driving) the rule is: the LOWEST foot / skate / wheel touches down (within 3 cm of the ground) at least once every ~0.5 s, and nothing ever goes under the ground. Standing and walking keep the strict rule (every reading within 3 cm). Running and skating games (Baseball, Track & Field, Hockey) are judged this way.
