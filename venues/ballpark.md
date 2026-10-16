# Venue: ballpark (baseball)

**Feel:** a summer night at a classic ballpark. Brown infield dirt, a bright green outfield, stands wrapping behind
home plate, and a big scoreboard in centre field.

## The field (real sizes, metres)
- **Bases 27.43 m apart** (90 ft), in a square ("the diamond"). Bases are white, 38 cm squares; home plate is a
  white five-sided plate.
- **Pitcher's mound:** 5.5 m across, 25 cm high, with the rubber **18.44 m** from home plate.
- **Infield dirt:** the base paths and an arc of dirt about 29 m from the mound. The rest of the infield is grass.
- **Foul lines:** white, from home plate past 1st and 3rd base to the **foul poles** (yellow, about 99 m from home).
- **Outfield wall:** about 99 m down the lines and 122 m to centre field, 2.5–4 m high, padded and dark green, with
  distance numbers on it.
- **Warning track:** 4.5 m of dirt in front of the wall.
- **Batter's boxes:** 1.22 × 1.83 m either side of the plate, with a catcher's box behind.
- **On-deck circles** and **coaching boxes** at 1st and 3rd.
- Grass in a mown pattern (checkerboard or stripes).

## The ballpark
- **Stands** wrap from foul pole to foul pole behind home plate, in 2–3 levels. Outfield bleachers. **30,000–45,000.**
- **Dugouts** sunk below the field on the 1st and 3rd base sides. Bullpens in the outfield.
- **Backstop** net behind home plate.
- **Light towers** on the roof of the stands (6–8 banks).
- **Centre-field scoreboard** with the line score (runs per inning), balls, strikes and outs.
- **Crowd:** moving, standing on home runs, a wave now and then.
- Lighting preset: `field` (or `night` for night games).

## MUST
- Real base distances, a real mound and real foul poles
- Dirt and grass in the right shapes, and a wall with distance numbers
- Stands wrapping home plate, dugouts, light towers and a scoreboard

## NEVER
- A flat green square with white dots for bases
- Real team, league or sponsor names

## Robot checks
- Bases 27.43 m apart within 2%, rubber 18.44 m from the plate, `report().fans >= 25000`
