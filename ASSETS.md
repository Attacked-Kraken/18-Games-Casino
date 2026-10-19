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
