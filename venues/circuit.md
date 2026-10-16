# Venue: race circuit (F1-style)

**Feel:** a top-level Grand Prix. Smooth grey asphalt, red-and-white kerbs, a pit lane with garages, packed
grandstands and a start gantry.

## The track (real sizes, metres)
- **Track width 12–15 m**, length 4–6 km, with 12–20 corners mixing slow hairpins, fast sweepers and one long straight.
- Asphalt: dark grey with rubber lines on the racing line. White track-limit lines (20 cm) on both edges.
- **Kerbs** on the inside and outside of corners: red/white stripes, raised and ridged.
- **Run-off areas:** striped tarmac and **gravel traps** on the outside of fast corners.
- **Barriers:** tyre walls at the end of run-offs, steel guardrail, and tall **catch fences** in front of the crowd.
- **Start/finish straight:** the **grid boxes** (two rows, staggered 8 m), a white start line, and a **start gantry**
  with 5 red lights over the track. A chequered line at the finish.
- **Pit lane:** parallel to the main straight, with a speed limit line at each end, pit boxes and garages for
  10 teams, and pit wall stands.
- **Marshal posts** with flags around the lap. **Distance boards** (300/200/100 m) before heavy braking zones.

## Around the track
- **Grandstands** on the main straight and at the best corners, with covered roofs. Packed, moving crowd.
- Big screens facing the grandstands. A control tower and a podium over the pit lane.
- Hills, trees and a skyline beyond. Never an empty flat plane.
- Sponsor boards: **our own made-up brands only**. Teams and drivers: fictional (see `looks/apexf1.md`).
- Lighting preset: `field` (or `night` for a night race with floodlights all round the lap).

## MUST
- A real-width track with kerbs, run-offs, barriers, a grid, a gantry and a pit lane
- Grandstands with a moving crowd, and scenery beyond the barriers

## NEVER
- A road with no kerbs or barriers, or a flat green void outside the track
- Real circuits, teams, drivers or sponsors

## Robot checks
- Track width 12–15 m; `report().grid === 20`; start gantry lights 5; `report().fans >= 10000`
