# TOOLS.md — the studio toolbox (owner, 2026-10-16 · updated 2026-10-17)

Read this before every job. It lists **everything you can use right now** to make better graphics and better games,
in the order to reach for it. Two kinds of things live here:
- **Software / robots** you use to make or check things. What you make with them is ours.
- **Asset sources.** Anything that ends up inside a game must pass **ASSET-LAW.md**: CC0, or CC-BY 3.0/4.0 with credit
  (Part III). A source that is not on the ASSET-LAW list is **not allowed** until the owner adds it there.

## What you can really do from a Muse window (no terminal)

You have a **browser**, **GitHub** (commit files on your branch, open PRs) and the **robots below**, which run on GitHub
for you. You do NOT have a terminal, Blender or a GPU. So: download real models in the browser, commit them, and let the
robots shrink, photograph and test them. Never "fake" a hero model from code boxes when a real CC0/CC-BY one exists.

## Real graphics fast - look in this order (owner's recommendation, 2026-10-17)

1. **Our own shelves:** `characters/` (rigged CC0 humans + gear), `models/`, `venues/kit/`, and the asset warehouse
   repo Attacked-Kraken/3D-Assests-for-Arcade (full Quaternius packs).
2. **Kenney** (kenney.nl) - CC0, no credit needed: vehicles (cars, bikes, karts), sports props, city/track kits, UI,
   **sound effects** (music always stays our own - ASSET-LAW Part II). First stop for props, UI and sounds.
3. **Quaternius** (quaternius.com) and **KayKit free packs** - CC0 low-poly characters, animals, vehicles.
4. **Poly Pizza** (poly.pizza) - thousands of models; filter by license. CC0 first, then CC-BY (with credit).
5. **Poly Haven** (polyhaven.com) and **ambientCG** (ambientcg.com) - CC0 **realistic textures** (grass, ice, asphalt,
   dirt, wood, metal) and **HDRI skies** for real-looking lighting.
6. **Sketchfab** - ONLY "CC Attribution" models with the maker's Download button (Part III). Never sign in yourself:
   add the model to **MODEL-REQUESTS.md** and the model fetcher (the idea scout window, which holds the owner's
   login) downloads it for you.
7. **OpenGameArt** - ONLY items marked CC0 or CC-BY 3.0/4.0 (the asset check robot blocks everything else).

Every model: ledger entry in `ASSETS.md` in the same PR, credit in the game's Credits screen if CC-BY, then MODELS.md
WAITING OWNER for hero models.

## Already in this repo (use these first)

| Tool | Where | What for |
|---|---|---|
| Base humans | `characters/base-human-v2/humans.js` | real rigged CC0 bodies, hair, skin, 11 animations |
| Athlete kit | `characters/base-human-v2/gear.js` | sport gear that rides the skeleton, plus exact sport stances (`hockeyKit`, `gearKit`) |
| Model viewer | `tools/model-viewer.html` | see any `.glb` / `.mjs` model in the game's real lighting, front, side and back |
| Model shelf | `tools/models.html` | the owner's page: every model in MODELS.md with **Open in 3D** and option buttons (team, goalie, skating...). Add your model's options to `OPTIONS` at the top of the page |
| Venue viewer | `tools/venue-viewer.html` | whole places at real size: aerial, TV camera, end and floor cameras, plus a 📣 Goal! button |
| Look presets | `look-presets.js` | the same lighting in the game and the viewer (`rink`, `field`, `track`, `night`, `studio`) |
| Game check robot | `tools/game-check/` | plays every game like a phone, takes pictures, runs the fix tests, blocks bad pull requests |
| Patch robot | `tools/patch-robot/` | moves big files through small patches |
| three.js add-ons | `vendor/` | GLTFLoader, SkeletonUtils, BufferGeometryUtils (merging meshes), bloom and post-processing |
| **Effects pack** | `kit/apex-fx.js` (demo `kit/fx-demo.html`, guide kit/README.md) | ready-made ice spray, dust, dirt, sparks, confetti, splash, smoke, crowd flashes, waving flags/nets/grass, glowing lights, code-drawn wood/seats/ice/grass/asphalt/numbers/signs, 7-segment scoreboard clocks, camera shake, slow motion, baked arena/sun lighting, event bus (one signal = sound + effects), shared shader clock. USE THESE - don't rebuild them |
| **Shared game kit** | `kit/apex-kit.js` (guide `kit/README.md`) | pause/settings, mute, saves, credits screen, touch controls, chase camera, `__test` hooks. Build every new game on it |
| **Shrink robot** | `.github/workflows/model-shrink.yml` | commit a download as `<name>-raw.glb` → you get a small `<name>.glb`; `<name>-raw.png/.jpg` → `<name>.webp` (≤1024 px, see-through kept); `<name>-raw2k.png/.jpg` → `<name>.webp` up to 2048 px for big ground textures and skies. Tested: a 959 KB picture became 92 KB. Always use the small file |
| **Asset check robot** | `tools/asset-check.mjs` | blocks a PR whose 3D files aren't in ASSETS.md with an allowed license + credit |
| **iPhone Safari pass** | `tools/game-check/safari.mjs` | the robot also plays every game in real iPhone Safari (WebKit) |
| **Auto-undo** | `tools/game-check/undo.mjs` | a merge that newly breaks a game is reverted automatically; your branch keeps the work |
| **Play tests** | `tools/game-check/fixes/` (`play-` ids, `window.__test`) | the robot actually plays: start, move, score. 5+ per game |
| **Venue gate** | `venues/*.md` + robot | a game must show its real place (track inside a stadium, real rink) or it fails |
| **Owner's notes** | jobs from the board, with his pencil drawings and screen recordings | the owner circles problems in the game itself; every point is a must-fix |
| **Factory memory** | `NEWS.md`, `LESSONS.md`, `PLAYBOOK.md`, `SCORES.md` | owner decisions, mistakes never to repeat, what works, honest scores |

## Tricks that cost zero file size (use them before adding heavy files)

- **Shaders (GLSL in three.js materials):** shiny ice, wet asphalt, waving grass, crowd shimmer, stadium light cones -
  made on the phone's graphics chip, no texture files. Keep them simple (the phone budget in STUDIO-STANDARD.md).
- **Stay on WebGL (`WebGLRenderer`).** Not WebGPU: many owners' iPhones and the robot's test phone don't run it yet.
- **Sound from code (Web Audio):** the house method (ASSET-LAW Part II): noise for crowds and engines, short sine/
  square hits for bounces and bats, low thuds for body checks. Zero sound files.
- **Pictures drawn in code (canvas → `THREE.CanvasTexture`):** court wood grain, seat rows, chalk/ice lines, jersey
  numbers, score boxes, timers, arrows, pause buttons - drawn once at start-up, sharp on every screen, no files.
- **Particles (`THREE.Points` + one `BufferGeometry`):** ice spray from skates, dirt from tyres, dust, crowd camera
  flashes, confetti, sparks - thousands in one draw call. Reuse the array, never make new objects every frame.
- **Shader math blocks:** distance fields for perfect glowing circles (stadium lights, pucks' glow, UI rings) and a
  `sin(time)` wave in the vertex shader for flags, nets, grass and banners - no extra CPU, no files.
- **Physics:** simple maths first. If a game truly needs real physics (ball spin, collisions, ragdolls), vendor
  **cannon-es** (MIT, small) or Rapier into `vendor/` - never load it from the internet.

## Free software (for a person at a computer - the robots already do the shrinking for you)

| Tool | Licence | Use it for |
|---|---|---|
| **Blender** (blender.org) | GPL (the program only, what you make is ours) | modelling, rigging, UV, baking, exporting `.glb` - **needs a person at a computer; Muses can't run it**. Ask the owner if a model truly needs it |
| **glTF-Transform** (gltf-transform.dev) | MIT | shrinking `.glb` files: `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp` |
| **meshoptimizer / gltfpack** | MIT | fewer triangles with the same look, LODs |
| **KTX-Software (Basis)** | Apache-2.0 | GPU textures that load fast on phones |
| **Rapier** (rapier.rs) | Apache-2.0 | real physics (pucks, balls, ragdolls), if a game needs more than simple maths. Vendor the file, no CDN. |
| **Krita / GIMP / Inkscape** | GPL | textures, crests, jersey numbers, UI art |
| **Audacity** | GPL | trimming our own recordings (ASSET-LAW Part II: original audio) |
| **Playwright** | Apache-2.0 | the robot's phone tests (already used) |
| **Google Colab** (free tier) | Google terms | heavy jobs (baking, batch-shrinking models), when a laptop is too slow |

## Free asset sources: allowed now (on ASSET-LAW)

CC0: Quaternius · Kenney · Poly Pizza · Poly Haven · ambientCG · KayKit free packs · OpenGameArt.
CC-BY 3.0/4.0 with credit (Part III): Poly Pizza · Sketchfab "CC Attribution" · OpenGameArt.
Keep the paper trail in `ASSETS.md` (the robot checks it).

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

Mixamo, TurboSquid, any NC/ND/SA or "personal use" license, Sketchfab models that aren't "CC Attribution" (ASSET-LAW Part III), brands/logos, anything ripped or "free download, all rights reserved", any CDN or web
font or online API in a game (games are fully offline).


## Robots that make things for you (owner, 2026-10-19)
- **Sketchfab fetch robot**: add an OPEN line with the exact Sketchfab model link to MODEL-REQUESTS.md and merge. It
  downloads CC Attribution / CC0 models with the owner's key into `models/fetched/<name>.glb` and logs ASSETS.md. Never sign in.
- **Phone budget for 3D models** (owner Oct 19): every fetched model ends at most 6 MB AND at most 100,000 triangles
  (the robot simplifies it). Check any model: `node tools/glb-tris.mjs <file.glb>`. Many copies of one model (12 racers)
  = use a lighter version for the far ones.
- **Model search robot**: add `- SEARCH · <words> · for <game>` to MODEL-SEARCH.md and merge. The robot finds free
  Sketchfab models (CC-BY / CC0, under 20 MB) and shows them on tools/model-search.html (Game Development -> Model Search).
  The OWNER spins them in 3D and taps Get it; the fetch robot downloads + slims his pick. Never pick for him.
- **Sound robot**: add a recipe to `sounds/recipes/<anything>.json` and merge. It makes the WAV in `sounds/made/` with the
  owner's Beat Machine (our own sounds, no license worries). Kinds: `beat` (style, bpm, loops, pitch), `sfx` (a Beat Machine
  library sound), `engine` (kind v8 / diesel / inline4 / vtwin / superbike, rpm or rev [from,to], deep, rough, blower,
  clatter), `mix` (a game sound effect: library sounds stacked with at / pitch / gain). Every option: `sounds/made/OPTIONS.md`.
  Listen: **`sounds/lab.html`** (Sound Lab on Game Development: tabs Newest / Soundtracks / Sound effects / Engines, pick a game).
  Give every recipe `title` + `game`. Beat Machine now has 8 patterns (A-H), sections that switch instruments off
  (song block 3rd item, e.g. ["Verse",0,["kick","bass"]]), REAL recorded instruments (sound.melody: piano, strings, cello,
  pizz, brass, horn, flute, harp, glock - CC0, sounds/instruments/) and a master stage ("master": clean / punchy / loud). **Each game has its OWN menu song + play song (full length ~2.5 min, .m4a) and its own
  effects** in `sounds/recipes/games.json`, written by `tools/sound-themes.mjs` - change a game's song there (style, bpm,
  key, chords, seed) and run it. Owner: keep the bass LEAN (808 vol 0.3, kick 0.5, highpass 34). A sound you remove from
  the recipes is removed from sounds/made by the robot.
  A `beat` recipe can set EVERY Beat Machine control: drum rows per track, bass line, melody, chords, up to 4 patterns,
  a song arrangement (Intro / Verse / Hook / Build / Drop / Outro), synth sound, per-track volume / pan / pitch / reverse,
  FX (reverb, echo, drive, filters, crush, compressor), sidechain, glide - see `sounds/recipes/games.json`.
  For sounds that don't sound made-by-computer, put a REAL recording in `sounds/real/` (owner's recordings, Kenney CC0
  audio) and use it on a track with `"sample": "file:sounds/real/<name>.wav"`.
