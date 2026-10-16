# Rules: baseball (apexbaseball.html)

## Must enforce
- **9 innings** (fewer in quick games). Each team bats in its half of the inning (away team on top) until **3 outs**.
- **Count:** 4 balls = a walk to 1st base. 3 strikes = out. A foul ball is a strike, except it can't be strike 3
  (unless it's a bunt). A pitch in the strike zone (over the plate, knees to the middle of the chest) is a strike
  even if not swung at.
- **Outs:** strikeout, a catch on the fly, a **force out** (the base touched before the runner arrives when he had to
  run), a **tag out** (the runner touched with the ball off a base), or a runner hit by the batted ball.
- **Fair / foul** by the foul lines and foul poles. A ball over the outfield wall in fair territory is a **home run**.
- **Runners** must touch every base in order. A runner must **tag up** after a caught fly ball before advancing.
  Stolen bases are allowed.
- **Hit by pitch** sends the batter to 1st base.
- **Extra innings** if tied after 9.

## Game flow
- Batting order of 9. The pitcher tires (speed and accuracy drop), and relief pitchers come from the bullpen.

## Broadcast look
- Score bug: runs, inning (▲/▼), balls-strikes-outs, and the runners on base (a small diamond).
- Cameras: behind the pitcher (for batting), following the ball on hits, and a replay on home runs.
- The line score on the centre-field board.

## Robot checks
- 4 balls → walk, 3 strikes → out, a foul with 2 strikes stays at 2 strikes
- 3 outs end the half inning; a ball over the wall in fair territory = home run
