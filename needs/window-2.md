BLOCKED BY: NONE
UNCLEAR: The G-47 follow-up "fix skates when skiing around" - I fixed the robot's red skate tests (the blades measure 0.000 while skating; the foot-bone ruler was inventing sink), but if the owner saw something visual in the skates, no picture or extra words ever reached me to confirm it.
MISSING: An owner job for the intermittent play-icing-called robot failure (documented in reviews/g-98-done-reality-audit.md) - it has no owner yet; everything else assigned to this window is shipped.

OWNER QUESTION - a game sent back to be redone (Baseball: players not real 3D, blurry, no close camera): what workflow gets it right the FIRST time?
- Failures become tests before code: every owner complaint is written as a play test in tools/game-check/fixes/<game>.mjs first - the redo is done when those tests pass, not when the builder thinks it looks better.
- Real 3D through the model gate, no stand-ins: rigged people and gear only from approved sources, checked in the model viewer, owner-approved and LOCKED in MODELS.md before they enter the game - a game built on placeholder shapes is sent back every time.
- Camera and clarity are numbers, not taste: a working close/PLAYER camera is a required test, and "blurry" is measured - pixel ratio capped, textures at full resolution, screenshots read at phone size before the PR.
- Play it before you ship it: full robot run plus your own eyes on the game-check pictures (menu, gameplay, close-up) - if the close-up does not show real 3D players, it is not ready, however green the code checks are.
- One window owns the game end to end and verifies on main after the merge - "merged, NOT yet seen" until the pictures prove it; no mid-redo hand-offs, no reporting from a branch.
