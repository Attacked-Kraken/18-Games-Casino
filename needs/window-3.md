# Window 3 - what would get a sent-back game right the FIRST time

1. Complaint first, test second, code third: every line the owner sends back ("players not real 3D", "blurry", "no close camera") becomes a play test that FAILS on today's game before I touch the game - a fix with no failing test first is how the same complaint comes back.
2. His pictures are the spec: the owner's reference photos and footage stay open while building, and every model, texture and camera is measured against them - never against my imagination. People come only from SEARCH/REQUEST model lines the owner picks; no code-drawn stand-ins.
3. Prove the one screen he complained about before building the rest: the close camera on the real players, one picture, his sign-off - a wrong direction then costs one picture, not a whole game.
4. Robot pictures are the finish line, not the merge: the game-check robot plays it on a phone and I read the menu, gameplay and close-camera pictures against his complaint list with my own eyes - the report says "seen", never just "merged".
5. If it still comes back: list every past complaint and why each fix did not stick, then fix ALL of them in one merge - no drip-feed of one-line patches.

ANSWERED: Read by the help desk - these 5 points are now a LESSONS.md rule ("## 2026-10-21 help desk (6:40 PM)"), so redo orders carry them. Nothing to fix; keep working on your current G-job. Any point that needs the owner (a model pick, a look sign-off) goes on your MODELS line / looks/<game>.md as usual.

## 2026-10-21, 9:31 PM - what are you missing / what is unclear
BLOCKED BY: NONE - G-116 is not blocked; the airbrake fix is sim-verified and going through the PR robot now.
UNCLEAR: one gap - a PR can show a green verdict ("nothing new is broken") while the job's own proof test is still red in the main game-check (G-115: PR green, but the main check at 24dd5ca still showed tester-challenge-can-slow-to-band over 30 s); I now read BOTH before calling a job done - tell me if the main game-check is not the standard you want judged by.
MISSING: NONE - every spec, test and file for the current job is on main and reachable.

ANSWERED (9:31 PM section): yes - judge by BOTH. The PR's "nothing new is broken" verdict is only half; the job is done when its own proof test (the one named in the order) also passes in the main game-check on the merged commit. The Mac's proof rule reads the same (green main, zero red lines for the game, proof test passing), so a PR-green job with a red proof test on main is not done: fix it and push. Keep reading both, as you do.

## 2026-10-22, 5:25 AM - G-141 (jet steps 5-6): what are you missing / what is unclear
BLOCKED BY: NONE - steps 1-2 and 4 are already on main (G-89 PR #947, G-90 PR #969); steps 5-6 are fully specified in models/apex-jet/INSTRUCTIONS.md, and the PMREM environment block it points at is inside the pack's demo.html (found and porting it, SUN_DIR and all).
UNCLEAR: two judgment calls I am making - shout if either is wrong. (1) Step 6's LOW quality option names no UI: I am putting a QUALITY toggle in the start menu (default HIGH = the full step-6 look; LOW = pixel ratio 1.25 and shadows off), remembered across visits. (2) "Parked": free-flight spawn today sits on the runway at full throttle and rolls at once; I read parked as on the ground on the runway (the new play-jet-on-runway test proves exactly that) and I am NOT changing spawn throttle, since the order also says keep everything else the same.
MISSING: NONE - jet.canopyY is exported by the pack and JET_STYLES carries each style's canopy.z, so the step-5 cockpit eye formula has both numbers it needs.

ANSWERED (2026-10-22 5:25 AM section): both calls are fine. (1) QUALITY toggle in the start menu, default HIGH, remembered - OK (the order only says "add a LOW option"); keep it inside the 844x390 frame, nothing off-screen. (2) "Parked" = on the runway, spawn throttle unchanged - OK, INSTRUCTIONS step 7 only sets throttle 0.45 inside go(on). Carry on.

## 2026-10-23, 4:04 PM - G-238 (Grok audit fixes, Apex Flight): what are you missing / what is unclear
BLOCKED BY: NONE - G-141 merged (528f40a) and its report is in; G-238 is built and in lab verification, nothing external in the way.
UNCLEAR: one small one - G-238 point 3 (missing files / 404s): measured on today's build, the game makes zero failed requests and zero console errors (menu, friend overlay, free flight), so that point needs NO CHANGE, yet the order's DONE asks for 3 CHANGED lines, one per point. I am filing 2 CHANGED lines plus a NOTE line carrying point 3's evidence - shout if the VP wants a different shape.
MISSING: NONE - the Grok report and shot are on main (reviews/grok-2026-10-20/), and all three points were reproduced or cleared on today's build first: touchcancel leaves the stick at 0.5/0.5 today, friendGo/friendClose/qualityBtn sit off the 390-high screen today, and the 404 list is empty today.
ANSWERED (help desk, Oct 23 4:10 PM): your shape is right - 2 CHANGED lines plus a NOTE line with the zero-404 / zero-console-error evidence for point 3 is fine (no change needed = say so, do not invent a change). Write "POINT 3: YES - nothing to fix, measured clean" in the point answers.

## 2026-10-23, 5:07 PM - G-243 (Grok check fixes, Apex Flight): what are you missing / what is unclear
BLOCKED BY: NONE - measuring today's build point by point now; branch + PR follow.
UNCLEAR: the order is written against the pre-G-232/G-238 build (it names stickZone, which G-232 removed, and the off-screen buttons, which G-238 re-measured an hour ago: friendGo/friendClose now fit at 844x390). I am re-measuring every point on today's build, fixing only what is still broken (favicon link, portrait stick, jetBtn vs back are the live candidates), and writing the per-point play test.
MISSING: NONE - the Grok check lines are specific enough to measure against; portrait gets measured at 390x844, landscape at 844x390.

ANSWERED (help desk, Oct 23 8:25 PM Central): yes - re-measure each point on today's main and fix only what still fails; for a point already fixed, say "already fixed by G-NN" in your report with the proof test. Measure portrait at 390x844 and landscape at 844x390 as you planned.

## 2026-10-23 (G-247 close-out)
BLOCKED BY: NONE - G-247 is merged (8669e90) and reported; the G-243 fix round is a robot-wait, not a block
UNCLEAR: NONE - the G-247 order was complete; the owner's 8:25 PM takeoff report is clear and being reproduced now
MISSING: NONE

ANSWERED (help desk, Oct 23 11:45 PM Central): nothing open - G-247 close-out noted, all three lines NONE.
