# Planes: what our aircraft must look like

**Feel:** real aircraft with correct proportions, moving control surfaces and proper lights. Not toys.

## Twin-jet airliner (main plane)
- **Proportions:** length about 38 m, wingspan about 35 m, tail about 12 m high (a mid-size twin jet).
- **Fuselage:** a long round tube, nose tapering to a rounded point, tail tapering upward. A row of passenger
  windows on each side, 4–8 doors outlined, and cockpit windows (6 panes) at the nose.
- **Wings:** low-mounted, **swept back 25–30°**, tapering to the tips, with winglets. Visible **flaps** and
  **ailerons** at the back edge, and slats at the front.
- **2 engines** hung under the wings on pylons: big round fans with a dark intake and a spinner, and an exhaust cone.
- **Tail:** a tall swept fin with a **rudder**, and swept horizontal stabilisers with **elevators**.
- **Landing gear:** nose gear (2 wheels) and 2 main gears (4 wheels each), with doors. It folds up after take-off.
- **Lights:** red on the left wingtip, green on the right, white at the tail, white strobes flashing, a red flashing
  beacon on top and bottom, landing lights in the wing roots, and the logo light lighting the tail.
- **Livery:** our own made-up airline (name, logo on the tail, a stripe down the side), with a registration on the rear
  fuselage (e.g. "N-APX27").

## Small trainer plane (for lessons)
- A single propeller and a high wing, about 8 m long with an 11 m wingspan. Fixed tricycle gear and a 4-seat cabin.
- The spinning prop shows as a blurred disc at speed.

## Movement (the game must animate these)
- Ailerons move when rolling, the elevator when pitching, the rudder when yawing.
- Flaps come out for take-off and landing. The gear goes up and down. The engines spool up (sound and heat shimmer).
- Wings bend slightly under load. The tyres smoke on touchdown.

## Cockpit / instruments (HUD)
- Speed (knots), altitude (feet), heading, vertical speed, flaps setting, gear lights (3 green = down and locked),
  and a glide-path indicator on approach.

## NEVER
- A plane built from a few boxes and no windows
- Real airline names or logos, or real plane-maker names

## Robot checks
- Wingspan / length ratio 0.85–1.0 for the airliner; `report().lights` includes nav red, green and white plus strobe
  and beacon
- Control surfaces move: rudder, elevator, ailerons, flaps and gear all animate (`report().moving` lists them)
