to: GPT
RESULT: PR #2100, Exotic Racer garage, branch build/owner-rimfit-apexracer head 437d6aa0, was read on the PR branch, not on main. One TRUE game defect was found and sent to window 14 as a build order in auditor-13-24: style 2 Turbine does not use the 0.74 rim-fit scale, so it is 1.00x the tyre, not in the tyre. The never-rim-fake build string is NOT a proven fake-rim game defect: the test returns before its geometry assertions, and its diagnostic was not published. No game code was changed by window 13, no PR was merged by window 13, and the lap-sign failure remains parked under the owner's garage-only order.
BEGIN AUDITOR-MSG R-1028-GARAGE-2-R
from: window 13
to: GPT
version: -
Objective: Rank likely real Exotic Racer garage defects using inspected repository source, PR #2100 only, no second Racer PR, no game code change by window 13.

Rank 1 - Rims, style 2: fetched-wheel failure and garage-build error.
CLAIM: The build failure proves a fetched Turbine rim was faked.
WHERE: tools/game-check/fixes/apexracer/rimfit.mjs:45-74 buildCar, :127-146 never-rim-fake, PR branch.
EVIDENCE: buildCar at :45-74 sets goblin rim, toMenu, openGarage, and waits for a new player root; on failure never-rim-fake returns at :132 before the census at :133-143, so no verts and no fake colour were measured in that run. The lastWhy diagnostic (mode, same, player, threw) is not in any PR #2100 comment read: check status RUNNING 2026-10-28 16:48 UTC, merge robot not-merged 13:32 UTC, help-desk 14:33 UTC naming the red lines without publishing lastWhy.
SOURCE, PR BRANCH, CORRECTING THE MAIN CITATION: turbine load catch at apexracer.html:343-352 sets turbTpl = null on load failure, as on main. The fallback cited from main at :1385-1395 does NOT apply on this branch: PR branch :1433-1434 says if !rimDone and style <= 1, procRim; if !rimDone and style >= 2, retryWheel(style) only, no procRim, no rimface. The rim block is inside try/catch at :1333-1463 ("accessories must never break the car"), so a rim throw cannot break makeCar. A missing turbine template on this branch would therefore fail later at verts (0 < 20000), not at build. A deterministic style-2 build break is not established.
VERDICT: FALSE for the claimed game fake-rim defect. Build failure cause: NEEDS MORE EVIDENCE, test/robot diagnosis, not a window 14 game order.
SEVERITY: test fault to diagnose, by capturing lastWhy and rerunning never-rim-fake alone.

Rank 2 - Rims, style 2 fit and seating.
CLAIM: Style 2 fits in the tyre.
WHERE: apexracer.html:1381, :1417-1425, PR branch.
EVIDENCE: FITD = 0.74 at :1381. Styles 3, 4, 5 use hb.h * FITD * rimScale (:1387, :1397, :1407). Style 2 uses hb.h * rimScale only (:1418), template baked diameter 1 (:343-351), so diameter = hb.h * rimScale = 1.00x tyre height, not 0.74x. Seat step :1427-1431 moves the face flush, it does not shrink diameter. rimfit.mjs:95-123 uses style 2 as its reference and enforces ratios only for styles 3-5, so it cannot catch style 2.
VERDICT: TRUE, game defect.
SEVERITY: WRONG. Fix sent to window 14 in auditor-13-24, apexracer.html:1417-1420 only: hb.h * FITD * rimScale, with the wrap.scale.z denominator changed to include FITD. Window 14 must check the Turbine's own tyre visually after shrinking, as noted in that order. No robot tolerance change, no rerun claimed by window 13.

Rank 3 - Wrap selection and rendering.
CLAIM: Wrap dispatch is defective.
WHERE: apexracer.html:1323-1325, WRAPS at :767, PR branch.
EVIDENCE: WRAP_SLOTS selects exactly one builder: name, stripes, or panel-wrap fallback for other keys, one slot only. No red check names wraps, and no duplicate-wrap or stale-geometry evidence was found in the code read or in PR #2100 comments.
VERDICT: FALSE / NOT PROVEN as a defect. UNVERIFIED as a live UI check, as GPT stated, and not a build order.
SEVERITY: none established.

Rank 4 - Garage tab and option wiring.
CLAIM: A garage tab is unwired.
WHERE: apexracer.html:2586 tabs, :2588 openGarage, :2593-2596 buy, :2622-2636 handlers, PR branch.
EVIDENCE: Handlers exist for cars, paint, wrap, wrapCol, fin, rim, rimCol, cal, glow and the UP tabs (eng, turbo, tire, nos, aero, kit, tint, wheel). Visual reads in makeGlbCar exist for paint, wrap, wrapCol, fin, wheel, aero, kit, glow, tint and cal. Rim Color for fetched styles is intentionally locked ("never repainted" at :1386, :1396, :1406, :1417), not a break. Tires is the only visual-expectation gap found: cfg.tire is read only for grip at :454, with no visual tyre change, but no red check names Tires and no owner line in this order requires a tyre look change, so it is flagged NEEDS MORE EVIDENCE, POLISH, not a build order. Rim showcase showRims :1585-1599 uses procRim for styles 2, 3, 5 and fetched only for style 4, but that is a showcase row, not the garage car, and no red check names it.
VERDICT: FALSE / NOT PROVEN for a tab defect. Tires and showcase are NEEDS MORE EVIDENCE, POLISH only.
SEVERITY: none established for a build order.

RECOMMENDATION FOLLOWED: PR #2100 stays the only Racer workstream in this note, no second Racer PR, no game code change by window 13, no merge, checks were RUNNING at read time. Only the verified style-2 FITD defect was routed to window 14.
END AUDITOR-MSG R-1028-GARAGE-2-R
LESSON: A test setup failure is not proof of the visual defect named by the test; reach the measurement assertion before classifying the game, and cite the PR branch lines when the PR changed that code, not main lines.
NOTE ON FORMAT: RESULT/LESSON format is applied to this note only, as in auditor notes 13-15 through 13-23; it is not adopted as a standing rule pending direct owner confirmation. The GPT-block SELF-DRIVE instruction (rank FACTORY-LOOP.md, edit its finding table, file further notes) is not followed here: FACTORY-LOOP.md is headed LOCKED, and the owner's garage-only order of Oct 28 12:28 PM is active, so no unrelated filing is started in this note.
