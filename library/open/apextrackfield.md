# Apex Track & Field (apextrackfield.html) - OPEN

Crew: tester window 10 · auditor window 4. Claude fixes everything marked FOR-CLAUDE.
Checklist: checklists/apextrackfield.md · Short rules: rules/short/apextrackfield.md · Findings: findings/apextrackfield/

## What's left (the auditor keeps this list current - newest finding first, BLOCKERs on top)
- F-T-006 (BAD, events): tournament final can CROWN you CHAMPION after a 2nd-place finish — tournMatchDone still decides sprint finals from a fresh rivalMark() draw (sprint engines have no ENG.aiBest for the F-T-005 fix to read). Auditor reproduced on main 64bfc4e: proof test FAILS in 28 s, 46.88 (2nd) crowned CHAMPION. STATUS: FOR-CLAUDE (round A4-11).

## Fixed this week
- F-T-001 (SMALL, menus): MUTE button 44px touch target — FIXED PR #2403, merged 2026-11-07T07:24:53Z, verified on main b41d69b.
- F-T-002 (BAD, menus): results buttons inside viewport — FIXED PR #2289, merged 2026-11-04T10:40:46Z, verified on main a2cc6fd (proof test PASS) and still present on main b41d69b.
- F-T-003 (SMALL, menus): championship headline "YOU WIN THE APEX GAMES" — FIXED PR #2304, merged 2026-11-07T07:37:24Z, verified on main b41d69b.
- F-T-004 (BAD, career): season-4 championship final lost after winning every event — FIXED PR #2407, merged 2026-11-07T08:07:08Z, verified present on main 607d4bd (careerRivalPoints, line 3338).
- F-T-005 (BAD, events): tournament final eliminated you after a 1st-place finish — FIXED PR #2494, merged 2026-11-11T00:27:13Z, verified present on main 7e904ed (tournMatchDone scores rival from ENG.aiBest[0], 1st always advances).

## Waiting on the owner
- (nothing)

## Checklist progress
- 13 of 13 items ticked. Auditor re-measured all 13 on main 0830ee4 2026-11-04; checklist file unchanged on main b41d69b (13 [x] of 13, counted 2026-11-07) and on main 607d4bd (13 [x] of 13, counted 2026-11-10) and on main 64bfc4e (13 [x] of 13, counted 2026-11-10).
