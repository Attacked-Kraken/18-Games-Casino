# Venue: monster truck arena

**Feel:** a sold-out stadium show. A dirt floor built into jumps, a line of old cars to crush, fireworks, and a
huge crowd all around.

## The floor (real sizes, metres)
- A football-stadium floor, about **110 × 50 m**, covered in packed brown **dirt** with tyre tracks and ruts.
- **Jumps:** dirt ramps 2–4 m high with steep take-offs and long landings, in pairs ("doubles"). One **mega ramp**
  about 6 m high at one end.
- **Car crush lines:** rows of 4–6 old cars (our own made-up models), and a bus or two.
- **Concrete barriers** around the floor, with a catch fence above them.
- **Start gate** with lights. Pit area with team trailers at one end, behind barriers.
- Fire cannons and pyro posts along the edges, which fire on big jumps.

## The stadium
- A full football-size bowl: 2–3 levels, a roof (dome) or open sky. **40,000–60,000 seats.**
- Big screens at both ends: scores, replays, the freestyle judges' numbers.
- **Crowd** stands up on big air and crashes.
- Lighting preset: `night` (stadium lights and spotlights).

## MUST
- A dirt floor with real jumps, car crush lines and barriers
- A full stadium with a moving crowd, screens and pyro

## NEVER
- A flat floor with floating ramps
- Real truck, show or sponsor names

## Robot checks
- `report().fans >= 30000`; jumps `>= 6`; crush cars `>= 8`
