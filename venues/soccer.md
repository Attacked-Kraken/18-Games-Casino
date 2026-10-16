# Venue: soccer stadium + pitch

**Feel:** a big international match. A deep green striped pitch, stands close to the touchlines, a roof over the
stands, and a wall of noise.

## The pitch (real sizes, metres)
- **105 × 68 m**, white lines **12 cm** wide.
- Grass mown in stripes (alternating light and dark bands every 5–6 m), with a little wear in the goal mouths.
- **Centre circle** radius **9.15 m**, centre spot, halfway line.
- **Penalty area** 16.5 m deep × 40.32 m wide. **Penalty spot** 11 m from the goal line. **Penalty arc** radius
  9.15 m from the spot.
- **Goal area** 5.5 m deep × 18.32 m wide.
- **Goals:** 7.32 × 2.44 m, white posts (12 cm), net with depth and back supports.
- **Corner arcs** radius 1 m, with corner flags (1.5 m poles).
- About 6 m of grass around the pitch, then advertising boards (LED, **our own sponsors**), then the stands.

## The stadium
- **Stands on all 4 sides**, close to the pitch, in 2–3 levels. **40,000–70,000 seats.**
- A **roof over the stands** (open over the pitch), with a lit edge.
- **Dugouts** (team benches) on one side, either side of the halfway line, plus a technical area marked in white.
- **Players' tunnel** at the halfway line.
- **Two big screens** in opposite corners or at the ends: score, clock, replays.
- **Floodlights:** a ring of lights along the roof edge (or 4 corner towers for an older ground).
- **Crowd:** packed (90%+), mostly home colours with an away end. Flags and scarves wave. They jump on goals.
- Lighting preset: `field`.

## MUST
- Real pitch markings at real sizes
- Stands on all sides with a roof, screens and floodlights
- A moving crowd, with a separate away end

## NEVER
- Grass that is one flat green
- Empty stands, or stands far away from the pitch
- Real club, league or sponsor names

## Robot checks
- `report().fans >= 30000`, `report().roof === true`, `report().screens >= 2`
- Pitch 105 × 68 m within 2%, penalty spots 11 m from the goal lines, goals 7.32 m wide
