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
