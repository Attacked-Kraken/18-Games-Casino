# ASSETS.md — the asset ledger (every 3D model file in this repo is listed here)

Owner's law (ASSET-LAW.md "Part III"). The asset check robot (`tools/asset-check.mjs`) blocks any pull request that adds a
3D file (.glb .gltf .fbx .obj) without an entry here, with a license that isn't allowed, or a CC-BY model whose game
doesn't credit its maker.

One section per asset (or per folder - every file inside it is covered). Keep the keys exactly like this:

```
## ASSET: models/bikes/sport-bike.glb
- title: Sport Bike (the model's name on its page)
- maker: the maker's name exactly as shown on the page
- source: https://poly.pizza/m/xxxxxxxx   (the exact download page - our proof)
- license: CC-BY 4.0          (allowed: CC0, CC-BY 3.0, CC-BY 4.0 - nothing else)
- downloaded: 2026-10-16 by <your Muse email>
- used in: apexmoto.html
- changes: recoloured, wheels split for spinning   (CC-BY needs us to say if we changed it)
```

---

## ASSET: characters/base-human-v1/
- title: Universal Base Characters + Universal Animation Library
- maker: Quaternius
- source: https://codeberg.org/jamesonBradfield/Quaternius_IK_Rigged_with_animations
- license: CC0
- used in: casino floor (people.js)

## ASSET: characters/base-human-v2/
- title: Universal Base Characters ("Superhero") + Universal Animation Library
- maker: Quaternius
- source: https://codeberg.org/jamesonBradfield/Quaternius_IK_Rigged_with_animations
- license: CC0
- used in: every sports game (humans.js, gear.js)
- changes: outfits, hair meshes, shader are our own original work

## ASSET: characters/football-cruz/
- title: Universal Base Characters ("Superhero") + Universal Animation Library
- maker: Quaternius
- source: https://codeberg.org/jamesonBradfield/Quaternius_IK_Rigged_with_animations
- license: CC0
- used in: football

## ASSET: people.glb
- title: Universal Animation Library mannequin
- maker: Quaternius
- source: https://codeberg.org/jamesonBradfield/Quaternius_IK_Rigged_with_animations
- license: CC0
- used in: casino floor

## ASSET: models/bikes/apex-superbike.glb
- title: Apex Superbike
- maker: Apex Arcade (made for the owner, our own design)
- source: owner's file "viewer.html" (Apex Superbike 3D viewer), sent Oct 18 2026
- license: CC0
- downloaded: 2026-10-18 by Claude (owner's upload)
- used in: apexmoto.html
- changes: none (taken out of the viewer page as one .glb)

## ASSET: models/bikes/street-bike.glb
- title: Motorcycle
- maker: Silas6
- source: https://sketchfab.com/3d-models/motorcycle-693e83d86e1e4e5b95e4314dbdd95d40
- license: CC-BY 4.0
- downloaded: 2026-10-18 by the owner (sent to Claude)
- used in: apexmoto.html (as "Trailhawk", credited on the Credits screen)
- changes: textures made smaller (max 1024 px)

## ASSET: models/bikes/race-bike.glb
- title: Motorcycle
- maker: Tahseen
- source: https://sketchfab.com/3d-models/motorcycle-239e4ccb2bd440c995359db7adcbd184
- license: CC-BY 4.0
- downloaded: 2026-10-18 by the owner (sent to Claude)
- used in: apexmoto.html (as "Velocity R", credited on the Credits screen)
- changes: sponsor logos, brand names and race number painted over in plain white (game paints it), windscreen text removed, textures made smaller

## ASSET: models/bikes/phantom-bike.glb
- title: Scifi Motorcycle Project_MX
- maker: JonnyMANSON
- source: https://sketchfab.com/3d-models/scifi-motorcycle-project-mx-689d42690adf436fa781aee367d533e3
- license: CC-BY 4.0
- downloaded: 2026-10-18 by the owner (sent to Claude)
- used in: apexmoto.html (as "Phantom X", credited on the Credits screen)
- changes: textures made smaller (max 512 px)

## ASSET: models/fetched/le-mans-race-car.glb
- title: Le Mans Race Car
- maker: Naudaff3D
- source: https://sketchfab.com/3d-models/le-mans-race-car-95898a30f3544c0a93c60c1aecef154a
- license: CC-BY 4.0
- downloaded: 2026-10-19 by the Sketchfab fetch robot
- used in: (not in a game yet - the game that uses it must name "Naudaff3D" on its credits screen)
- changes: shrunk for phones (textures max 1024 px, WebP)

## ASSET: sounds/instruments/
- title: VSCO 2 Community Edition (piano, violin section, cello section, violin pizzicato, trumpet, French horn, flute, harp, glockenspiel)
- maker: Versilian Studios (Sam Gossner)
- source: https://github.com/sgossner/VSCO-2-CE
- license: CC0 1.0
- downloaded: 2026-10-19 by Claude (owner: "add the beat machine missing parts" - real instruments)
- used in: beatmachine.html (Synth -> Real instruments), sound robot songs
- changes: one note every 4+ semitones, mono 32 kHz MP3 64k, trimmed to 1.5-4 s, loudness matched





## ASSET: models/fetched/fictional-supercar-v12-goblin-0a20e4.glb
- title: Fictional supercar - V12 Goblin
- maker: ollitei
- source: https://sketchfab.com/3d-models/fictional-supercar-v12-goblin-0a20e49ad5774d778567cb5c3f345786
- license: CC-BY 4.0
- downloaded: 2026-10-19 by the Sketchfab fetch robot
- used in: (not in a game yet - the game that uses it must name "ollitei" on its credits screen)
- changes: shrunk for phones (textures max 1024 px, WebP)

## ASSET: models/fetched/porsche-911-930-turbo-1975-de1ffd.glb
- title: Porsche 911 (930) Turbo 1975
- maker: Lexyc16
- source: https://sketchfab.com/3d-models/porsche-911-930-turbo-1975-de1ffd344c41481892511f7fd332c136
- license: CC-BY 4.0
- downloaded: 2026-10-19 by the Sketchfab fetch robot
- used in: (not in a game yet - the game that uses it must name "Lexyc16" on its credits screen)
- changes: shrunk for phones (textures max 1024 px, WebP)

## ASSET: models/fetched/mclaren-spider-10b474.glb
- title: McLaren Spider
- maker: SINNIK
- source: https://sketchfab.com/3d-models/mclaren-spider-10b474f26b2643be82ee26417ca78a0a
- license: CC-BY 4.0
- downloaded: 2026-10-19 by the Sketchfab fetch robot
- used in: (not in a game yet - the game that uses it must name "SINNIK" on its credits screen)
- changes: shrunk for phones (textures max 1024 px, WebP)

## ASSET: models/fetched/honda-nsx-1990-1cc156.glb
- title: Honda NSX 1990
- maker: Lexyc16
- source: https://sketchfab.com/3d-models/honda-nsx-1990-1cc15628a00a4739a6b6c01128927c8d
- license: CC-BY 4.0
- downloaded: 2026-10-19 by the Sketchfab fetch robot
- used in: (not in a game yet - the game that uses it must name "Lexyc16" on its credits screen)
- changes: shrunk for phones (textures max 1024 px, WebP)
