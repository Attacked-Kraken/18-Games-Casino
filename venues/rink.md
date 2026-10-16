# Venue: hockey arena + ice rink

**Feel:** a pro arena on game night. The ice is bright, the bowl is packed and dark above, light comes down from the
roof, and there's a big four-sided scoreboard hanging over centre ice.

## The ice (real sizes, metres)
- Rink **60.96 × 25.9 m** (200 × 85 ft), corner radius **8.5 m**.
- Boards **1.07 m** high: white, with a yellow kick plate at the bottom (0.25 m). Glass on top (about 1.8 m along
  the sides, 2.4 m at the ends), clear with a slight blue tint. Gaps for the bench doors.
- **Goal lines** red, 5 cm wide, **3.35 m** from each end board.
- **Blue lines** 30 cm wide, **22.86 m** from each end board (the neutral zone is 15.24 m).
- **Centre red line** 30 cm wide. Centre circle radius **4.57 m**, blue centre dot.
- **4 end-zone faceoff circles** (radius 4.57 m, red, with hash marks), 6.1 m out from the goal line and 6.7 m
  either side of centre. **4 neutral-zone dots**, 1.5 m inside the blue lines.
- **Goal crease:** light blue half circle, radius 1.83 m, outlined red.
- **Goals:** 1.83 m wide × 1.22 m high, red posts and crossbar, white netting, frame about 1.1 m deep.
- Trapezoid behind each goal (where the goalie may play the puck).
- Ice surface: white with a very light blue tint, a soft reflection of the roof lights, and skate scratches. Never
  pure flat white.

## The arena
- **Benches:** two team benches on one side, penalty boxes and the scorekeeper's box on the other.
- **Seating bowl:** lower bowl of 20–26 rows right up to the glass, then a concourse gap, then an upper bowl of
  15–20 rows. Steps in the aisles every 12–16 seats. **14,000–19,000 seats.**
- **Crowd:** at least 85% full. Fans wear mostly home colours, some away. They move all the time (small bobbing) and
  stand up and cheer on goals and big hits (`crowd.excite()`).
- **Scoreboard:** centre-hung over centre ice, four screens, with score, clock and period. Ring LED boards around
  the bowl between the levels.
- **Lights:** a ring of bright lights in the roof over the ice; the bowl is darker than the ice. Spotlights sweep on
  goals.
- **Roof:** closed, with dark steel trusses and banners hanging from them (our own team banners).
- Ad panels on the boards: **our own made-up sponsors only** ("APEX ARCADE", invented brands).
- Lighting preset: `rink`.

## MUST
- Real measurements above (markings in the right places, in the right colours)
- Packed, moving crowd, with a centre-hung scoreboard
- Glass on the boards, benches and penalty boxes

## NEVER
- Empty or flat-coloured stands, or a crowd that never moves
- Markings in the wrong places, or missing lines
- Real league, team or sponsor names

## Robot checks (become fix tests)
- `stadium.report().fans >= 12000`, `report().scoreboard === 'center-hung'`, `report().tiers >= 2`
- Rink size within 2% of 60.96 × 25.9 m (in the game's units)
- At least 9 faceoff spots, 2 blue lines, 1 red centre line, 2 goal lines, 2 creases
