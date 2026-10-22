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
