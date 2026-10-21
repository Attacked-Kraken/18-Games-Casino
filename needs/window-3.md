# needs/window-3.md - getting a redo right the FIRST time (owner question)

When a game comes back for a redo (Baseball: players not real 3D, blurry, no close camera), the miss is never the code - it is the look being reviewed last instead of first. The workflow that gets it right the first time:

1. **Look board before gameplay.** The owner approves `looks/<game>.md` with reference pictures (real rigged players, camera distance, clarity bar) before any game logic is built. Nothing gets built on an unapproved look.
2. **Real models through the model gate, never placeholders.** The owner picks the 3D models in MODELS.md, they are viewed in `tools/model-viewer.html`, and only then go into the game. Box/capsule players never ship, not even "temporarily".
3. **Camera in the DONE MEANS.** Every job states the camera shot ("close camera: the player fills the frame") and the robot's PR screenshots prove it. The builder looks at the pictures before calling done (PROOF RULE) - never "looks fine in code".
4. **Clarity is measured, not eyeballed.** The job sets the sharpness bar (texture sizes, pixel ratio, no blur) and the robot's screenshot checks enforce it. "Looks fine" is not a pass (DONE.md).
5. **One visual gate, not a redo.** Looks + camera + clarity are the FIRST check on every PR, same as gameplay. Redos happen when visuals get reviewed after the fact instead of up front.
