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




## ASSET: models/fetched/patriot-p10-xr-d87ddc.glb
- title: Patriot P10-XR
- maker: Swiss_Fox
- source: https://sketchfab.com/3d-models/patriot-p10-xr-d87ddc3e30134ff2990d8ee4d2586bdd
- license: CC-BY 4.0
- downloaded: 2026-10-19 by the Sketchfab fetch robot
- used in: (not in a game yet - the game that uses it must name "Swiss_Fox" on its credits screen)
- changes: shrunk for phones (textures max 1024 px, WebP)

## ASSET: models/fetched/tokii-abyss-gt-7-v12-c39956.glb
- title: Tokii Abyss GT.7 V12
- maker: Glas'kavin
- source: https://sketchfab.com/3d-models/tokii-abyss-gt7-v12-c399568541104e0e903cf138b1e24908
- license: CC-BY 4.0
- downloaded: 2026-10-19 by the Sketchfab fetch robot
- used in: (not in a game yet - the game that uses it must name "Glas'kavin" on its credits screen)
- changes: shrunk for phones (textures max 1024 px, WebP)

## ASSET: models/fetched/shc-mc-free-promotion-car-cfaabd.glb
- title: SHC MC Free Promotion Car
- maker: denniswoo1993
- source: https://sketchfab.com/3d-models/shc-mc-free-promotion-car-cfaabdec76a74b68a48ba5657b6d9aee
- license: CC-BY 4.0
- downloaded: 2026-10-19 by the Sketchfab fetch robot
- used in: (not in a game yet - the game that uses it must name "denniswoo1993" on its credits screen)
- changes: shrunk for phones (textures max 1024 px, WebP)

## ASSET: sounds/announcer/voices/
- title: announcer voice samples (Grok hockey / Grand Prix / motorcycle packs, woman 40s, man 40s)
- maker: Grok (xAI) for the owner
- source: the owner's Grok chat "Apex Arcade Pass" (proof: licenses/proof/2026-10-19-grok-announcer-packs.jpg)
- license: OWNER - AI voices made for the owner by Grok (xAI terms), no real person's voice; proof in licenses/
- downloaded: 2026-10-19, sent by the owner
- used in: Sound Lab -> Announcer; reference voices for the announcer robot

## ASSET: sounds/commentary/
- title: sports commentary packs - hockey 138, soccer 183, football 143, Grand Prix 106, moto street 97 lines (two commentators)
- maker: made for the owner in his "Apex Arcade Pass" chat with Piper TTS (proof: licenses/proof/2026-10-19-apex-arcade-pass-zips-*.jpg)
- source: the owner's zips (untouched originals kept privately in the approver repo, owner-assets/2026-10-19/)
- license: CC0 + CC-BY-SA 4.0 - announcer voice en_US-joe (CC0); color commentator voice en_GB-northern_english_male (CC BY-SA 4.0, OpenSLR 83)
- downloaded: 2026-10-19, sent by the owner
- used in: Sound Lab -> Announcer. A game that plays the color commentator MUST show on its Credits screen: "Color commentator voice: Piper en_GB-northern_english_male, trained on OpenSLR SLR83 (CC BY-SA 4.0)"
- changes: MP3 only (the OGG copies dropped)

## ASSET: sounds/announcer/voices/kokoro/
- title: 13 game voices (Kokoro-82M auditions) + voice tools
- maker: Kokoro-82M v1.0 (hexgrad), made for the owner
- source: the owner's Game-Voice-Library.zip
- license: Apache-2.0 - commercial use OK, no credit needed (courtesy: "Voices: Kokoro-82M (Apache-2.0)")
- downloaded: 2026-10-19, sent by the owner
- used in: Sound Lab -> Announcer

## ASSET: sounds/real/monster-truck/
- title: monster truck idle, rev, diesel high speed, blower
- maker: made for the owner ("Apex Arcade Pass" chat, proof in licenses/proof/)
- source: the owner's Monster-Truck-Engine-Sounds.zip (WAV masters kept privately)
- license: OWNER - made for the owner
- downloaded: 2026-10-19, sent by the owner
- used in: Sound Lab -> Engines

## ASSET: apexpaperplane.html, apexreefdash.html
- title: Paper Plane, Reef Dash (one-file canvas games, code-drawn art, WebAudio sounds)
- maker: made for the owner ("Apex Arcade Pass" chat)
- source: the owner's Paper-Plane-Game.zip / Reef-Dash-Game.zip
- license: OWNER - the owner's games
- downloaded: 2026-10-19, sent by the owner
- used in: Game Development page

## ASSET: sounds/ui-kit/
- title: UI Sound Kit - 23 game sounds in 3 styles (arcade, soft, scifi): taps, toggles, coin, combos, level up, unlock, stars, win/lose, daily reward, chest
- maker: made for the owner ("Apex Arcade Pass" chat) - synthesized from scratch, no samples
- source: the owner's UI-Sound-Kit.zip (WAV masters + generator kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-19, sent by the owner
- used in: any game (MP3s here)

## ASSET: sounds/pack/
- title: the owner's Music Loops Pack (chill_lofi + puzzle: menu, gameplay, victory/game-over stings) and General SFX Pack (hits, water, powerups)
- maker: made for the owner ("Apex Arcade Pass" chat) - synthesized from scratch, no samples
- source: the owner's Music-Loops-Pack part1-3 and General-SFX-Pack part1-2 zips (all originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-19, sent by the owner
- used in: Paper Plane (chill lo-fi music + arcade UI sounds), Reef Dash (puzzle music + soft UI sounds + water/powerup effects), Exotic Racer (sports_arena music)

## ASSET: kit/fx-library/ + sounds/effects/
- title: Apex Effects Library - 86 canvas effects in one file (effects.js, ApexFX), 84 particle textures, 11 sprite sheets, demo.html; one MP3 per effect in sounds/effects/
- maker: made for the owner - original, made from scratch
- source: the owner's Effects-Library.zip + Effects-Sounds.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game (explosions, coins, confetti, damage numbers, sparks, screen shake...)

## ASSET: kit/ui-art/ + sounds/ui-art/
- title: Apex UI Art Kit - buttons, panels, popups, banners, tabs, sliders, toggles, bars, badges, frames, 107 icons in 5 color styles (sky, lime, sunset, grape, cherry) + ui.css; 49 UI sounds in sounds/ui-art/
- maker: made for the owner - original, made from scratch
- source: the owner's UI-Art-Kit.zip + UI-Art-Sounds.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game's menus and HUD

## ASSET: kit/loading/
- title: Apex Loading Pages - 39 offline loading screens (race track, coin fill, neon sign, rocket launch...), API setProgress / setTip / done, MUSE-GUIDE.txt
- maker: made for the owner - original, made from scratch
- source: the owner's Loading-Pages.zip (original kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game's loading screen

## ASSET: kit/level-editor/
- title: Apex Level Editor - offline 2D platformer level editor (37 tiles, layers, undo, Test, JSON export) + level-loader.js + 20 sample levels
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands/logos/real teams/voices
- source: the owner's Level-Editor.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game

## ASSET: kit/backgrounds/
- title: Apex Backgrounds Pack - 45 phone backgrounds, 15 themes x 3, portrait + landscape + parallax layers
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands/logos/real teams/voices
- source: the owner's Backgrounds-Pack-part1.zip + part2.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game

## ASSET: sounds/engines/
- title: Apex Car Engine Sounds - 63 MP3s: grand_prix (F1), supercar (Exotic Racer), monster_truck - idle/accel/decel loops, revs, shifts, backfires, tire squeal
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands/logos/real teams/voices
- source: the owner's Car-Engine-Sounds.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game

## ASSET: sounds/stadium/
- title: Apex Stadium Sounds - 109 MP3s for soccer, football, hockey, baseball, basketball, track: crowd loops, cheers, groans, chants, whistles, horns, bat crack, puck hits, starting gun
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands/logos/real teams/voices
- source: the owner's Stadium-Sounds.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game

## ASSET: kit/ground/
- title: Apex Ground Textures - 24 seamless textures (asphalt, kerbs, grass, pitch stripes, dirt, gravel, ice rink, baseball infield, running track, sand, concrete, snow, mud, cobblestone) at 1024/512 + normal maps
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands/logos/real teams/voices
- source: the owner's Ground-Textures-part1.zip + part2.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game

## ASSET: kit/hud/
- title: Apex Sports HUD Kit - hud.js live scoreboard, lap timer, positions, minimap, speedometer, tachometer, boost, countdown, top bar in 5 styles
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands/logos/real teams/voices
- source: the owner's Sports-HUD-Kit.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game

## ASSET: kit/weather-fx/ + sounds/weather-fx/
- title: Apex Weather + Racing FX - weather.js on top of the Effects Library (rain, snow, fog, wind, lightning, tire smoke, skid marks, dirt/gravel spray, sparks, puddles) + 24 matching MP3s
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands/logos/real teams/voices
- source: the owner's Weather-Racing-FX.zip + Weather-Racing-FX-Sounds.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game

## ASSET: kit/tutorial/
- title: Apex Tutorial Kit - tutorial.js tap/swipe/hold/drag hints, guided steps, how-to cards, show-once, 135 PNGs in 5 styles
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands/logos/real teams/voices
- source: the owner's Tutorial-Kit.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: any game

## ASSET: kit/tracks/Grand-Prix-Track/ + kit/tracks/Grand-Prix-Track-Sounds/
- title: Apex Grand Prix Track - original 5.6 km closed circuit, 16 corners - REALISTIC v2 (grand-prix-track.glb 6.6 MB meshopt, 26 draw calls: PBR asphalt with rubbered line, rounded kerbs, mowed grass, gravel, guardrails, tyre stacks, roofed stands, glass pit buildings, baked shadows), track-data.json (centerline, checkpoints, grid, pit lane, racing line, AI speeds), track-loader.js, grand-prix-event.js (crowds, start lights, fireworks, podium), race-cameras.js, minimap; 22 race-day MP3s
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code, no brands besides APEX ARCADE
- source: the owner's Grand-Prix-Track-Realistic.zip + Grand-Prix-Track-Sounds.zip (originals kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: Apex F1

## ASSET: kit/tracks/Grand-Prix-Track/grand-prix-track.glb
- title: Apex Grand Prix Track (realistic v2) - the 3D circuit model
- maker: made for the owner ("Apex Arcade Pass" chat) - original, generated by code
- source: the owner's Grand-Prix-Track-Realistic.zip (original kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: Apex F1

## ASSET: kit/cockpit/cockpit.glb
- title: Open-Wheel Cockpit - realistic 3D single-seater interior: carbon tub, halo, seat + harness, pedals, mirrors, front wheels/wing, and a detailed steering wheel (node `SteeringWheel`, 15 shift LEDs, buttons, dials, paddles, display); viewer kit/cockpit/index.html
- maker: made for the owner (his "lio" chat) - original, modelled in code with three.js, no brands/logos/real team or car names
- source: the owner's open-wheel-cockpit.zip (original kept privately in muse-approver owner-assets)
- license: OWNER - made for the owner, free in paid apps, no credit needed
- downloaded: 2026-10-20, sent by the owner
- used in: Apex F1 (driver's-eye cockpit view)
