# ART DIRECTOR RUBRIC (owner Oct 25 2026 10:38 PM, from the outside quality plan; LOCKED)

The art director (window 12) grades every game against these SEVEN numbered categories, in this order. Every complaint is ONE line
that can become a failing play test. No category = no complaint. Max 3 open lines per game (existing rule).

1. PROPORTIONS + GEAR - athlete height in heads, limb ratios, gear shape and where it attaches, vehicle size against the track.
2. CAMERA - height, distance, framing of the action, never clips through players or walls, matches the real broadcast angle.
3. MOTION WEIGHT + TIMING - does the body or car feel heavy, do starts, stops and turns take real time, no sliding, no teleporting.
4. FIRST 60 SECONDS - can a new player score or finish something in the first minute without reading anything.
5. JUICE - hit, goal, crash and finish each get a short, readable visual response (shake, particles, flash, slow motion).
6. SOUND - music starts on the first tap, core actions make a sound, crowd where it belongs, mute stays muted.
7. PHONE READABILITY + CONTROL FEEL - buttons reachable by thumbs, text readable on a 390 px wide phone, no input lag.

## One line per complaint (copy this shape - no free-form paragraphs)
`HELP-VP: art director · <game> · <category number + name> · <what is wrong> · FRAME: <robot picture link or file> · TEST: <failing test id the builder must create> · SEVERITY: blocks ship / high / medium`

Example: `HELP-VP: art director · apexhockey · 2 CAMERA · the camera sits 1.1 m above the ice and loses the puck behind the net · FRAME: looks/apexhockey/ad-2026-10-26.jpg · TEST: tester-chk-cam-puck-framed · SEVERITY: high`

## What the robot and the Mac do with it
- The VP files each line, the builder adds the failing test first, and a game with an open visual line cannot score above 50 (existing cap).
- A line that has no category number, no FRAME, no TEST id or no SEVERITY is sent back to the art director once.
- Complaints about a real-sport measurement (field size, speed, rule) go to the tester checklist, not here.
