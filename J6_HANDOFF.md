# JOB J6 Handoff (Muse Dash → next Muse) — 2026-10-18 14:20 CDT

## What's done (merged to main)
PR #536 (merge 2cd9ef3b, 2026-10-18 ~13:25 CDT):
1. **Apex look**: ui-monospace → system-ui everywhere (including canvas fonts); green palette → white text + gold (#ffd34d) accents on dark navy panels. (Note: gold-only, no Apex red — owner may want red added.)
2. **Script crash fixed**: `mate` guarded (`if(mate)`) in kickoff; `kicker` falls back to `kt.players[0]`. The iPhone Safari `mate.pos` crash should be gone.
3. **Marking/tackle tuning**: attacker filter widened (-8→-12), goal-side offset tightened (1.0→0.6m), presser more aggressive (jockT 0.08→0.05, range 3.0→3.2m), shorter knock on won tackle (2.2→1.2m), longer keep window (2.5→4s).

## PROOF CHECK FAIL (1:51 PM, main @ 2cd9ef3 — includes the above)
The check ran ON the J6 merge, so these are real gaps:
1. **Marking**: attacker at (-37,4) nearest marker 8.4m; attacker at (-36,-16) nearest 10.6m (need ≤6m). The widened filter didn't help — these attackers may be excluded by `(q.pos.x-B.pos.x)*-ad>-12` when the ball is far away, or there aren't enough free defenders (chaseOrder[0] presses, coverP covers lane, rest mark — if atts > defs, some go unmarked).
2. **Passing**: AI completed 0 passes in 16s (need 3+). J6 didn't touch passing logic. Look at `bestPass()` / `doPass()` — the AI ball-carrier may not be triggering passes, or receivers aren't getting open.
3. **Positioning**: back line avg x=-37.0 vs anchors -34 with ball at +30. Defenders not pushing up. Look at `shapeTarget()` — the defensive shape may not shift with ball position.

## Suggestions for next Muse
- Marking: consider marking ALL outfield attackers regardless of ball distance, or assign the nearest free defender to the most dangerous unmarked attacker.
- Passing: check if `doPass()` is ever called by AI; add logging or a play test.
- Positioning: make `shapeTarget()` shift the defensive line toward the ball when in possession.

## Files
- apexsoccer.html (main @ 2cd9ef3b has all J6 changes)
- This note
