# MODELS.md — every 3D model the owner sees before it goes in a game

Owner rule: **never show the owner mockups or drawings. Show him the real model, in the real lighting, on his phone.**

How it works:
1. Make or get the model (ASSET-LAW.md sources only, CC0, our own design — no real players, teams or brands).
   Shrink it for phones (textures 1024–2048, one .glb, ideally under 3 MB; big files through the patch robot).
2. Check it yourself in **tools/model-viewer.html** (same lighting as the game: `look-presets.js`):
   `tools/model-viewer.html?m=<file.glb>&anims=<anims.glb>&look=<rink|field|track|night|studio>`
3. Add a section below with `status: WAITING OWNER` and merge to main. The game check robot photographs it in the
   viewer (you can't take WebGL pictures yourself — the robot can) and the owner's phone shows it with 👍 / 👎.
4. **👎** = his words come back to you. Fix exactly that, bump `version`, set `WAITING OWNER` again.
   **👍** = set `status: LOCKED`. Then put it in the game, using the same look preset as the viewer.
5. A **LOCKED** model may not be replaced, re-colored or swapped for a boxy/placeholder version without a new 👍.

Format (one section per model — keep the keys exactly like this):

```
## MODEL: Hockey skater
- id: hockey-skater
- game: apexhockey.html
- file: characters/hockey/skater.glb
- anims: characters/base-human-v2/anims.glb
- look: rink
- view: tools/model-viewer.html?m=characters/hockey/skater.glb&anims=characters/base-human-v2/anims.glb&look=rink
- by: your Muse account email
- version: 1
- notes: one line on what changed
- status: WAITING OWNER
```

---

(no models yet)
