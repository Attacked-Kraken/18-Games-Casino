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
6. **Never rewrite this file's format, `tools/model-viewer.html` or `look-presets.js`.** The owner's phone and the game
   check robot read them exactly as they are. Add your model as a new `## MODEL:` section below - that's all.
7. Prefer a real `.glb` model (Quaternius, Kenney, Poly Pizza - ASSET-LAW). A code-built `.mjs` model (boxes, tubes) is
   allowed only if no real model fits, must say so in `notes`, and the viewer labels it CODE-BUILT for the owner.

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

## MODEL: Main sport motorcycle
- id: motorcycle-main
- game: new:motorcycle-world
- file: models/motorcycle-main.mjs
- look: studio
- view: tools/model-viewer.html?m=models/motorcycle-main.mjs&look=studio&name=Main%20sport%20motorcycle
- by: algre141@gmail.com
- version: 1
- notes: JOB J2 step 1. CODE-BUILT from shapes (not a real .glb) - owner decides
- status: WAITING OWNER

## MODEL: Hockey skater (shared athlete kit)
- id: hockey-skater
- game: apexhockey.html
- file: models/hockey-skater.mjs
- look: rink
- view: tools/model-viewer.html?m=models/hockey-skater.mjs&look=rink&name=Hockey%20skater
- by: Claude (arcade reviewer)
- version: 1
- waits: PR #350 (already built and tested) - on 👍 ONLY set status LOCKED; the model gate robot merges PR #350 by itself. Don't rebuild it.
- notes: Owner's model sheet (2026-10-16). REAL CC0 rigged body (characters/base-human-v2) + CODE-BUILT gear from characters/base-human-v2/gear.js (no real hockey-gear .glb is CC0) - helmet + clear visor, shoulder/elbow pads under the jersey, oversized gloves, padded breezers, socks over shin guards, skates with steel blades, stick in both hands. Stance: lean 15-20, knees 25-30, hips back, wide. Away kit: add &team=away
- status: LOCKED (owner 👍 Fri Oct 16 2026 on his job board)

## MODEL: Hockey arena (stadium kit + crowd)
- id: hockey-arena
- game: apexhockey.html
- file: models/hockey-arena.mjs
- look: rink
- view: tools/venue-viewer.html?m=models/hockey-arena.mjs&look=rink&name=Hockey%20arena&cheer=1
- by: Claude (arcade reviewer)
- version: 1
- waits: PR #351 (already built; also needs Hockey skater 👍) - on 👍 ONLY set status LOCKED; the model gate robot merges it by itself.
- notes: venues/rink.md at real size - 60.96 x 25.9 m rink with every marking, boards + glass, goals, benches; 2-level bowl (38 rows, 18,000 seats, 16,000 moving fans in team colours who stand and cheer on goals), tunnels, LED ribbons, centre-hung 4-sided scoreboard, roof with trusses and a ring of lights. 12 draw calls. CODE-BUILT (venues/kit/stadium.js + rink.js, reused by every sport). Pictures: aerial (roof off), TV camera, behind the net.
- status: LOCKED (owner 👍 Fri Oct 16 2026 on his job board)

