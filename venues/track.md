# Venue: track & field stadium

**Feel:** a championship final. A red running track, a green infield, a full bowl, and photo-finish cameras at the
line.

## The track (real sizes, metres)
- **400 m oval** (measured in lane 1): two straights of **84.39 m** and two bends of radius **36.5 m**.
- **8 lanes, 1.22 m wide**, with white lines 5 cm wide. Lane numbers are painted at the start and finish.
- Surface: red-brown rubber (or blue), with a fine grain. Never a flat colour.
- **Staggered starts** for the 200 m and 400 m (each lane starts further ahead). The **finish line** is shared, at
  the end of the home straight.
- **Starting blocks** in each lane for sprints.
- **100 m straight:** the home straight is extended past the bend so the 100 m runs in a straight line.
- Kerb on the inside of lane 1 (raised white or aluminium).

## Infield and field events
- Grass infield. **Long jump / triple jump** runway (40 m) with a sand pit and take-off board along one straight.
- **High jump** area (a fan-shaped apron) with the bar and mat.
- **Shot put** circle (2.135 m across), with a stop board and a 34.92° landing sector.
- **Javelin** runway with an arc. **Discus and hammer** in a cage.
- Water jump for the steeplechase, on the inside of one bend.

## The stadium
- A full bowl, 2 levels. **40,000–60,000 seats.**
- **Photo-finish** tower and cameras at the finish line, plus a big **results screen**.
- Floodlights on the roof ring or 4 towers. Flags of our own made-up nations or teams.
- **Crowd** gets louder as the leaders reach the home straight.
- Lighting preset: `track`.

## MUST
- A real 400 m oval with 8 lanes and correct lane widths
- Staggered starts, a shared finish line and starting blocks
- Field-event areas in the infield, and a full, moving crowd

## NEVER
- Lanes of different widths, or a track that isn't oval
- Empty stands

## Robot checks
- 8 lanes, each 1.22 m within 3%; lane 1 length 400 m within 1%; `report().fans >= 30000`
