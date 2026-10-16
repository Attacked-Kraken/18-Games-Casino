# TOOLS.md — free tools for the studio (owner, 2026-10-16)

Two kinds of things live here:
- **Software** you use to make or check things. Its licence only covers the program, and what you make with it is ours.
- **Asset sources.** Anything that ends up inside a game must also pass **ASSET-LAW.md** (CC0 only). A source that
  is not on the ASSET-LAW list is **not allowed** until the owner adds it there.

## Already in this repo (use these first)

| Tool | Where | What for |
|---|---|---|
| Base humans | `characters/base-human-v2/humans.js` | real rigged CC0 bodies, hair, skin, 11 animations |
| Athlete kit | `characters/base-human-v2/gear.js` | sport gear that rides the skeleton, plus exact sport stances (`hockeyKit`, `gearKit`) |
| Model viewer | `tools/model-viewer.html` | see any `.glb` / `.mjs` model in the game's real lighting, front, side and back |
| Look presets | `look-presets.js` | the same lighting in the game and the viewer (`rink`, `field`, `track`, `night`, `studio`) |
| Game check robot | `tools/game-check/` | plays every game like a phone, takes pictures, runs the fix tests, blocks bad pull requests |
| Patch robot | `tools/patch-robot/` | moves big files through small patches |
| three.js add-ons | `vendor/` | GLTFLoader, SkeletonUtils, BufferGeometryUtils (merging meshes), bloom and post-processing |

## Free software (make things)

| Tool | Licence | Use it for |
|---|---|---|
| **Blender** (blender.org) | GPL (the program only, what you make is ours) | modelling, rigging, UV, baking, exporting `.glb` |
| **glTF-Transform** (gltf-transform.dev) | MIT | shrinking `.glb` files: `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp` |
| **meshoptimizer / gltfpack** | MIT | fewer triangles with the same look, LODs |
| **KTX-Software (Basis)** | Apache-2.0 | GPU textures that load fast on phones |
| **Rapier** (rapier.rs) | Apache-2.0 | real physics (pucks, balls, ragdolls), if a game needs more than simple maths. Vendor the file, no CDN. |
| **Krita / GIMP / Inkscape** | GPL | textures, crests, jersey numbers, UI art |
| **Audacity** | GPL | trimming our own recordings (ASSET-LAW Part II: original audio) |
| **Playwright** | Apache-2.0 | the robot's phone tests (already used) |
| **Google Colab** (free tier) | Google terms | heavy jobs (baking, batch-shrinking models), when a laptop is too slow |

## Free asset sources: allowed now (on ASSET-LAW)

Quaternius · Kenney · Poly Pizza (CC0 items only) · Poly Haven · ambientCG · KayKit free packs · OpenGameArt (CC0 items only).
Keep the paper trail: source, link and licence go in the folder's `CREDITS.txt`.

## Ask the owner first (NOT on ASSET-LAW yet, so don't use them until he adds them)

| Source | Why it's interesting | Licence note |
|---|---|---|
| MakeHuman | realistic human bodies | the exported models are CC0, but check the version and the plugins used |
| CMU Motion Capture library | thousands of real human motions (skating, running, throwing) | free to use in games, but the raw data can't be resold. Retarget it onto our rig. |
| Freesound (CC0 filter only) | real sport sounds (skates, crowd, whistle) | each sound has its own licence. CC0 only. |
| Sonniss GDC free bundles | pro sound effects | royalty-free, no credit needed, but you can't hand out the raw files. Owner decision. |
| AI 3D generators (TRELLIS, Hunyuan3D, ...) | quick base meshes | each has its own licence (some limit where or how you can use it). Owner decision, model by model. |
| Gemini or other image AI | **reference pictures only** (what it should look like) | never ship an AI picture as a game asset without the owner's OK |

## Never

Sketchfab, Mixamo, TurboSquid (ASSET-LAW), anything ripped or "free download, all rights reserved", any CDN or web
font or online API in a game (games are fully offline).
