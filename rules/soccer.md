# Rules: soccer (apexsoccer.html)

## Must enforce
- **11 v 11** (10 outfield players + a goalkeeper).
- **Kick-off** from the centre spot to start each half and after every goal. The opponents stay outside the centre
  circle.
- **Out of play:**
  - over the touchline → **throw-in** (both hands, both feet on the ground)
  - over the goal line, last touched by the attacker → **goal kick**
  - over the goal line, last touched by the defender → **corner kick**
- **Offside:** an attacker in the opponent's half who is nearer the goal line than both the ball and the
  second-last defender, when the ball is played to him. Free kick to the defence. Not offside from a throw-in,
  corner or goal kick.
- **Fouls:** tripping, pushing, a tackle from behind, or handball → a free kick (the wall 9.15 m back). Inside the
  penalty area → a **penalty** (11 m).
- **Cards:** a yellow for a reckless foul. A **red** for serious foul play or a second yellow (the team plays a man
  down).
- **Goalkeeper** may handle the ball only inside his own penalty area, and not from a deliberate back-pass.
- **Goal** only when the whole ball crosses the line between the posts and under the bar.
- **Advantage:** play on when stopping would help the team that was fouled.

## Game flow
- 2 halves (45 min real, shorter in quick games), plus stoppage time shown on the board.
- Knockout games: extra time (2 × 15), then a **penalty shootout** (5 each, then sudden death).

## Broadcast look
- Score bug top-left: teams, score and clock. Goal: replay, a crowd roar and the scorer's name.
- Cameras: a high wide broadcast camera following the ball (default), behind the goal for penalties.

## Robot checks
- Ball over the touchline → throw-in to the right team; over the goal line → goal kick or corner (by last touch)
- Offside called correctly in a set test; a foul in the area → penalty
