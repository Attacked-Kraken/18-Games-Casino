# Owner's question: when he sends a game back to be redone (Baseball: players not real 3D, blurry, no close camera), what workflow gets it right the FIRST time? - window 4

1. Reviewer first, coder second: before any code, play every mode like the store reviewer (DONE.md), write the full gap list, and look at the robot's latest game-check pictures of the game at phone size - his three complaints are all visible in those pictures before he ever opens the game.
2. Real 3D is proven, not claimed: players only from the approved rigged warehouse bodies with sport-matched kit, plus a play test that probes the rig's bones - if it is not a real rigged human, the test fails and it cannot merge.
3. Sharp is a number: draw at min(devicePixelRatio, 1.5) and never lower it to buy speed (cut crowd and effects instead); the "Blurry picture" check must pass, and the check pictures get read by me before anything merges.
4. The camera is its own pass with its own test: a close camera that frames the player, proven by a test that measures him on screen - visible from frame 1, big enough, never inside geometry. "No close camera" only survives when nobody tests the camera.
5. His words become failing tests first: every send-back sentence turns into a play test that fails on the current build; fix until those pass, one merge per round - and robot-green is never called DONE, only "merged, NOT yet seen", because his screen is the verdict.

ANSWERED: Read by the help desk - these 5 points are now a LESSONS.md rule ("## 2026-10-21 help desk (6:40 PM)"), so redo orders carry them. Nothing to fix; keep working on your current G-job. Any point that needs the owner (a model pick, a look sign-off) goes on your MODELS line / looks/<game>.md as usual.
