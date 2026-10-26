# Outside AI: camera specs + harsh 5-minute reviews per game - UNVERIFIED DRAFT

Filed Oct 25 2026 11:0x PM from an outside AI answer the owner forwarded. The AI has NOT played our games: every problem below is a guess to CHECK, not a fact. Camera numbers are starting ranges; the owner's locked camera rules and each game's looks/<game>.md REFERENCES + MUST MATCH override them (example: Track & Field's locked rule is 7 m back / 2.8 m up). Use: a tester/art director VERIFIES each line on the real game (picture or test) and marks it TRUE / FALSE / NOT IN OUR GAME before anything is built.

============================================================
CAMERA SPECS
Phone held sideways (landscape). All distances in meters relative to player/vehicle center.
============================================================

BASEBALL
- Distance: 12–18 m (close enough to read pitch release and swing, far enough to see infield geometry)
- Height: 4–7 m (slightly above batter eye-line so the mound and plate stay visible)
- Look-at: batter’s chest / pitch arrival zone
- Follow lag: 0.12–0.22 s (tight enough that the camera snaps with the swing, soft enough to avoid nausea on sudden head turns)
- 3 biggest moments:
  1. Pitch release → brief push-in 1.5–2 m closer + 0.3 s hold
  2. Contact → 0.15 s freeze + 8–12° shake, then track the ball for 0.8 s
  3. Safe/Out at base → hard cut to 6–8 m side angle of the bag for 1.2 s
- Must never: clip through the catcher or umpire, lose the ball in flight, hide the batter’s hands or feet during the swing

ICE HOCKEY
- Distance: 14–22 m (full rink width readable, players still identifiable)
- Height: 6–10 m (high enough to see both nets and the blue lines without extreme tilt)
- Look-at: puck when free, otherwise player with puck chest
- Follow lag: 0.18–0.28 s (hockey is fast; lag must feel floaty but never lose the puck)
- 3 biggest moments:
  1. Slap shot / one-timer → 0.2 s push-in + slight FOV widen
  2. Goal → 1.5 s orbit around the scorer + net, then slow pull-back
  3. Big hit / board crash → 0.25 s freeze + camera shake + brief low angle
- Must never: clip through the boards or glass, lose the puck under a pile, hide the player who just received the pass

FLIGHT (JET)
- Distance: 18–28 m (plane fully framed, horizon readable)
- Height: 3–8 m relative to aircraft center (slightly above and behind so the nose and wings stay clear)
- Look-at: aircraft nose / pilot canopy
- Follow lag: 0.25–0.40 s (jets turn hard; lag must smooth the high-G maneuvers)
- 3 biggest moments:
  1. Afterburner light-up → slight FOV widen + 0.3 s speed lines
  2. Missile launch / gun kill → hard lock on target for 1.2 s then return
  3. Near-miss / high-G turn → camera banks with the aircraft, never levels early
- Must never: clip through the jet body, lose the plane against the sky/ground, hide the wings or exhaust during throttle changes

TRACK & FIELD
- Distance: 8–14 m (athlete fully visible, track lanes still readable)
- Height: 2.5–4.5 m (just above head height so the runner’s form is clear)
- Look-at: athlete’s center of mass / hips
- Follow lag: 0.08–0.15 s (sprints are pure speed; lag must be almost locked)
- 3 biggest moments:
  1. Start gun → 0.4 s static low angle then hard follow
  2. Peak speed phase (60–80 m) → slight FOV narrow + side tracking
  3. Finish line → 1.0 s slow-motion pull-back + lean into the tape
- Must never: clip through other runners or hurdles, lose the athlete in a pack, hide the feet or arms during the stride

F1
- Distance: 10–16 m (car fully framed, track edges still visible)
- Height: 2.5–4.5 m (just above the halo so the cockpit and front wing stay clear)
- Look-at: cockpit / driver’s helmet
- Follow lag: 0.15–0.25 s (F1 is precise; lag must feel planted but not robotic)
- 3 biggest moments:
  1. Launch / lights out → 0.3 s FOV widen + slight low angle
  2. Overtake / side-by-side → hard lock between both cars for 1.5 s
  3. Crash / heavy braking → 0.2 s freeze + camera shake + debris priority
- Must never: clip through the car body or barriers, lose the car on high-speed straights, hide the front wing or rear tires during cornering

EXOTIC RACER
- Distance: 9–15 m (car fully visible, road and scenery still readable)
- Height: 2–4 m (slightly above the roof so the silhouette and exhaust stay clear)
- Look-at: car center / driver seat
- Follow lag: 0.18–0.30 s (arcade feel; lag must be smooth and slightly dramatic)
- 3 biggest moments:
  1. Nitro / boost → FOV widen + speed lines + slight low angle for 1.0 s
  2. Near-miss / drift → camera banks hard with the car, never levels early
  3. Finish / photo finish → 1.5 s slow-motion side tracking + confetti priority
- Must never: clip through the car or barriers, lose the car in traffic, hide the wheels or exhaust during boost

============================================================
HARSH 5-MINUTE STORE REVIEW
I am a store reviewer. I open each game, play exactly 5 minutes, and list the 10 worst problems ranked. Exact moment + single fix only.
============================================================

BASEBALL – 10 worst problems
1. First pitch – camera is too far; I cannot read the pitch release. Fix: start at 13 m distance.
2. First swing – bat clips through the batter’s body. Fix: add 0.08 s contact freeze + proper bat trail.
3. First ground ball – ball disappears into the dirt for 0.4 s. Fix: keep ball above ground by 0.05 m minimum.
4. First throw to first – camera lags so hard I lose the ball. Fix: cut lag to 0.15 s max on throws.
5. First safe call – no visual feedback, just a silent runner. Fix: 0.6 s side camera + safe flash.
6. Second at-bat – UI scoreboard covers the pitcher’s hand. Fix: move scoreboard to top 8 % of screen.
7. First fly ball – camera never looks up, ball goes off-screen. Fix: force look-at to ball for 1.2 s.
8. First stolen base – runner slides through the base model. Fix: proper slide animation + base collision.
9. First home run – no celebration, just a cut to next batter. Fix: 2 s orbit of the scorer.
10. 4:30 mark – frame rate drops when the crowd is visible. Fix: reduce crowd draw distance by 30 %.

ICE HOCKEY – 10 worst problems
1. Opening face-off – camera is too high; I cannot see the puck on the ice. Fix: drop height to 7 m.
2. First pass – puck tunnels under a player and vanishes. Fix: keep puck 0.12 m above ice at all times.
3. First shot – goalie animation is 0.3 s late; shot looks blocked when it scored. Fix: sync goalie reaction to shot release.
4. First big hit – camera does not shake or freeze; impact feels soft. Fix: 0.22 s freeze + 12° shake.
5. First goal – no net cam, no celebration, just a quiet scoreboard update. Fix: 1.8 s goal orbit.
6. First icing – lines are almost invisible on the ice. Fix: raise line contrast 40 %.
7. First power play – extra players clip through each other. Fix: simple separation force on contact.
8. First board battle – camera clips through the glass. Fix: hard clamp distance ≥ 1.5 m from boards.
9. First save – rebound is invisible for 0.5 s. Fix: force camera look-at to rebound for 0.7 s.
10. 4:45 mark – controls feel floaty on the turn; player keeps skating past the puck. Fix: add 15 % more turning friction.

FLIGHT (JET) – 10 worst problems
1. Take-off – plane clips through the runway for the first 2 s. Fix: raise wheels 0.3 m until airborne.
2. First turn – camera lags so hard the plane leaves the frame. Fix: cut lag to 0.30 s max.
3. First missile lock – lock circle is 40 % too small on phone. Fix: scale UI elements 1.35×.
4. First gun kill – no hit feedback, just a silent explosion far away. Fix: 0.4 s camera punch + hit marker.
5. First high-G turn – horizon flips and I lose orientation. Fix: add artificial horizon bar.
6. First afterburner – exhaust trails are invisible against the sky. Fix: force bright orange trail for 1.5 s.
7. First near-miss – no audio or visual warning. Fix: proximity warning + red screen edge.
8. First landing attempt – gear never appears. Fix: auto-deploy gear below 150 m.
9. First crash – plane just disappears; no debris. Fix: 2 s debris + slow camera pull-back.
10. 4:50 mark – controls invert when the plane is upside down and stay inverted. Fix: relative control scheme only.

TRACK & FIELD – 10 worst problems
1. Start – gun sound is 0.25 s late; I false-start every time. Fix: sync audio to visual flash.
2. First 20 m – camera is too high; I cannot see the athlete’s form. Fix: drop height to 3.2 m.
3. First hurdle – athlete clips through the hurdle. Fix: proper jump animation + collision.
4. Mid-race – other runners disappear when they are 8 m ahead. Fix: keep all runners in FOV for full race.
5. Peak speed – no speed feedback; I have no idea if I am fast. Fix: persistent speed number top-right.
6. Finish – tape is missing; I just run past an invisible line. Fix: visible tape + lean animation.
7. First jump event – camera never follows the jump arc. Fix: hard lock on athlete for the flight.
8. First throw – implement disappears the moment it leaves the hand. Fix: keep implement visible until landing.
9. Lane lines – almost invisible under the athlete. Fix: raise lane contrast 50 %.
10. 4:40 mark – controls feel delayed on the final sprint; I cannot lean. Fix: reduce input lag to 0.05 s.

F1 – 10 worst problems
1. Lights out – launch is delayed 0.4 s after the lights. Fix: sync launch to last light.
2. First corner – camera clips through the barrier. Fix: hard clamp 1.8 m from walls.
3. First overtake – both cars leave the frame; I lose the battle. Fix: dual-car framing for 2 s.
4. First heavy brake – no tire smoke or lock-up visual. Fix: add smoke + ABS shake.
5. First DRS – no visual or audio cue that DRS is open. Fix: wing animation + open sound.
6. First crash – car just vanishes; no debris or slow-mo. Fix: 1.5 s debris + camera hold.
7. First pit entry – pit lane is invisible until I am already in it. Fix: raise pit wall contrast.
8. First rain – track has no wet reflection; grip loss feels random. Fix: add wet sheen + spray.
9. First sector time – UI is too small and disappears after 1 s. Fix: keep sector delta for 3 s.
10. 4:55 mark – steering feels heavy and delayed on the final chicane. Fix: reduce steering lag 20 %.

EXOTIC RACER – 10 worst problems
1. Start – boost is already half-empty for no reason. Fix: full boost on race start.
2. First turn – camera banks the wrong way and I lose the road. Fix: bank with the car only.
3. First nitro – speed lines are so strong I cannot see the road. Fix: reduce speed-line opacity 40 %.
4. First near-miss – no feedback; I have no idea how close I was. Fix: red edge + near-miss sound.
5. First crash – car teleports upright with full health. Fix: proper damage + 1.2 s recovery.
6. First traffic – AI cars clip through each other constantly. Fix: simple separation on contact.
7. First drift – drift score never appears. Fix: persistent drift counter top-left.
8. First shortcut – no visual indication the shortcut is legal. Fix: green arrow + surface change.
9. First finish – no photo finish or slow-mo; just a cut to results. Fix: 2 s side tracking + confetti.
10. 4:50 mark – controls feel rubbery; car keeps sliding after I release steer. Fix: increase tire grip 18 %.

END OF DOCUMENT