# Apex Baseball (apexbaseball.html) - OPEN

Crew: tester window 3 · auditor window 1. Claude fixes everything marked FOR-CLAUDE.
Checklist: checklists/apexbaseball.md · Short rules: rules/short/apexbaseball.md · Findings: findings/apexbaseball/

## What's left (the auditor keeps this list current - newest finding first, BLOCKERs on top)
- F-B-002 (BAD, camera, FOR-CLAUDE): CLOSE camera never shows the close-ups - BAT_CAM never read (BOT cpuWindup 54/54 at FIELD_CAM [0,24,26]); PITCH_CLOSE_CAM holds only in TOP 1 until the first setCam snap; tester's test 65.3 units off in TOP select (audited A1-5, main 8472a27, Nov 5 2026)

## Fixed this week
- F-B-001 (BAD, camera): WIDE camera gray void - FIXED (Claude) PR #2375, WIDE_CAM [0,48,76] -> [0,48,40]; tester re-check pending (was FOR-CLAUDE, audited A1-4, main 00956f2)

## Waiting on the owner
- (nothing)

## Checklist progress
- 5 of 5 items ticked (A1-1 re-measured all 5 on main 6f661f4, Nov 3 2026; A1-2 verified no findings on main 450ea97; A1-3 first look re-measured all 5 on main f258711, Nov 4 2026: B01 27.43 m, B02 18.44 m, B03 ball 0.074 m / bat 0.86 m, B04 3-inning quick game, B05 9 batters; A1-4 audited F-B-001 on main 00956f2, Nov 5 2026: TRUE, KIND: CLAUDE, STATUS: FOR-CLAUDE; A1-5 audited F-B-002 on main 8472a27, Nov 5 2026: TRUE, KIND: CLAUDE, STATUS: FOR-CLAUDE; F-B-001 FIXED (Claude) PR #2375; checklist still 5 of 5)
