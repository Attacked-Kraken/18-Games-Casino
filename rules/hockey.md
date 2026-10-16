# Rules: ice hockey (apexhockey.html)

## Must enforce
- **5 skaters + 1 goalie** a side. Line changes on the fly (tired players skate slower).
- **Faceoffs** at the right dot: centre ice to start each period and after goals, the end-zone dots after icing,
  offside or a goalie freeze, and the neutral-zone dots otherwise.
- **Offside:** an attacker may not cross the blue line into the attacking zone before the puck. Whistle, and a
  faceoff outside the zone.
- **Icing:** shooting the puck from your own half past the opponent's goal line untouched. Whistle, and a faceoff in
  your own end. Not called when shorthanded.
- **Penalties** (2 minutes, or 5 for major): tripping, hooking, slashing, high-sticking, interference,
  too many men. A **delayed penalty** (play on until the penalised team touches the puck). **Power play / penalty
  kill**, and the penalised player leaves the penalty box early after a power-play goal (minors).
- **Goalie:** the puck is frozen in the glove. The crease is protected (no goal if the goalie is pushed).
- **Goal** only if the whole puck crosses the goal line between the posts and under the bar.
- **Body checking** on the puck carrier only (no checks from behind).

## Game flow
- 3 periods (20 min real, or shorter in quick games), with the clock stopping on whistles.
- Ties: 5-minute **3-on-3** sudden-death overtime, then a **shootout** (3 shooters each, then sudden death).
- Intermission between periods (stats card).

## Broadcast look
- Score bug at the top: teams, score, period, clock, and a power-play timer.
- Goal: horn, crowd stands, goal light, spotlights, and a replay from 2 angles.
- Cameras: broadcast side view (default), close, behind the net. Never lose the puck.

## Robot checks
- Offside called when an attacker enters ahead of the puck; icing called on an untouched clear
- A penalty gives a power play, with 4 skaters on the penalised side for 2:00 of game time
- The faceoff dot is correct after a goal, offside and icing
