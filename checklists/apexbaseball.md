# Checklist: Baseball (apexbaseball.html) - numbers come only from the SOURCE file named on each line
- [ ] B01 | Bases are 27.4 m apart | SOURCE: REALITY.md | NUMBERS: 27.4 | MEASURE: distance between neighbouring base objects, within 3% | TEST: tester-chk-b01
- [ ] B02 | The pitcher's mound is 18.4 m from home plate | SOURCE: REALITY.md | NUMBERS: 18.4 | MEASURE: distance from mound to plate objects, within 3% | TEST: tester-chk-b02
- [ ] B03 | The ball is 0.074 m wide and the bat 0.86 m long (the props size check parked in LATER.md item 8) | SOURCE: REALITY.md | NUMBERS: 0.074, 0.86 | MEASURE: Box3 of the ball and bat meshes, within 15%; if the ball/bat mesh cannot be reached from the page without the props hook, tick DROPPED (needs props hook) | TEST: tester-chk-b03
- [ ] B04 | A game is 9 innings | SOURCE: rules/baseball.md | NUMBERS: 9 innings | MEASURE: play a full game mode to the end and read the inning counter at game over | TEST: tester-chk-b04
- [ ] B05 | The batting order has 9 batters | SOURCE: rules/baseball.md | NUMBERS: Batting order of 9 | MEASURE: count distinct batters before the order repeats | TEST: tester-chk-b05
