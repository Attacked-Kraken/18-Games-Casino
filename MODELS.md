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
- version: 4
- notes: JOB J11: REAL human rider from the shared athlete kit (characters/base-human-v2, dark leathers) in a racing tuck — hands on grips, feet on pegs via 2-bone IK, full-face helmet; code-built mannequin removed. Bike bodywork unchanged (v3).
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

---

## MODEL: Monster Truck Arena (stadium kit + crowd) — DISCARDED BY OWNER 2026-10-18
- id: monster-truck-arena
- game: apexmonstertruck.html
- file: models/monster-truck-arena.mjs
- look: night
- view: tools/venue-viewer.html?m=models/monster-truck-arena.mjs&look=night&name=Monster%20Truck%20Arena&cheer=1
- by: Muse main (casino)
- version: 3
- notes: venues/truck-arena.md at real size - 110x50m dirt floor, 7 ramps (doubles + the 6m mega ramp), 2 car crush lines (10 cars), barriers all around, full bowl 3 tiers on 4 sides, 12,000 fans, big screens at both ends, night. The wrapper builds the EXACT call apexmonstertruck.html makes, so this is the very stadium in the game. CODE-BUILT (venues/kit/truck-arena.js). Pictures: aerial, TV camera, ground level. v3: the owner put the game back to the J5 version (Oct 18, commit 23f4384) - this wrapper matches the kit now in the game. (v2 described the J45 rebuild and imported its layout exports; the reverted kit no longer has them, which crashed the viewer - fixed.)
- status: DISCARDED (owner: "horrendous - throw this model away" 2026-10-18)

## MODEL: Track & field stadium (stadium kit + crowd)
- id: track-stadium
- game: apextrackfield.html
- file: models/track-stadium.mjs
- look: track
- view: tools/venue-viewer.html?m=models/track-stadium.mjs&look=track&name=Track%20%26%20Field%20stadium&cheer=1
- by: Muse main (casino)
- version: 3
- notes: venues/track.md at real size - 400m oval (84.39m straights, 36.5m bends, 8 lanes x 1.22m, finish line at the end of the home straight) inside a full 2-tier college bowl from the shared venues/kit/stadium.js (40,000+ seats, ~38,000 fans, roof ring with canopy lights, 2 big screens, APEX/GAMES scoreboard). Built with the EXACT config apextrackfield.html races in (JOB J7), so this is the very venue in the game, put on the shelf for the owner's approval. CODE-BUILT (venues/kit/stadium.js, reused by every sport). Pictures: TV camera over the home straight, aerial end view, at the finish line. v2 (owner fix): track centered in the middle of the stadium - the v1 wrapper carried the game's -42.195m world offset on the bowl while the track sat at the origin. v3 (owner fix): runner lanes + finish line - 9 white lane lines as real geometry around the whole oval (8 lanes x 1.22m) and a bold finish band across all 8 lanes at the end of the home straight.
- status: LOCKED (owner 👍 Sat Oct 17 2026)

---

## MODEL: Soccer stadium (stadium kit + crowd)

**status: WAITING OWNER**

- id: soccer-stadium
- built from: venues/soccer.md at real size - 105x68m pitch, stands on all 4 sides (2-3 levels, 40k-70k seats), roof over stands, crowd, lights
- kit: venues/kit/stadium.js → buildStadium(THREE, { preset:'stadium' })
- in game: `apexsoccer.html`
- view: tools/venue-viewer.html

---

## MODEL: Pebble hero (Flick Fortress)

**status: WAITING OWNER**

- id: pebble-hero
- game: flick-fortress.html
- file: models/pebble-hero.mjs
- look: studio
- view: tools/model-viewer.html?m=models/pebble-hero.mjs&look=studio
- by: Muse main (casino)
- version: 1
- notes: JOB J16 STEP 1 - cute round pebble hero with determined eyes (angled brows), gray stone body with 3 mossy green patches, stone feet and arms. CODE-BUILT (no CC0 round pebble hero with a face on Kenney/Poly Pizza/Quaternius). Matches the Gemini reference: gray stone, moss patches, determined eyes.
- status: WAITING OWNER

---

## MODEL: Ballpark (baseball venue)

**status: WAITING OWNER**

- id: ballpark
- file: models/ballpark.mjs
- view: tools/venue-viewer.html?m=models/ballpark.mjs&look=field&name=Ballpark
- notes: JOB J22. Built from venues/ballpark.md: bases 27.43m, rubber 18.44m, foul poles 99m, wall 99m/122m, stands wrap home plate (3 tiers), 6 light towers, centre-field scoreboard, crowd. report().fans >= 25000.

## MODEL: Apex Moto line-up (4 bikes)
- id: apexmoto-bikes
- game: apexmoto.html
- file: models/bikes/apex-superbike.glb
- look: studio
- view: tools/model-viewer.html?m=models/bikes/apex-superbike.glb&look=studio
- by: Claude (owner's own picks, Oct 18 2026)
- version: 1
- notes: the owner sent and picked these himself ("put all these bikes in the motorcycle game"): apex-superbike, street-bike (Silas6), race-bike (Tahseen, logos painted over), phantom-bike (JonnyMANSON)
- status: LOCKED
