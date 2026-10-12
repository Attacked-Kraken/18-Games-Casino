# Base Human v2

Male + female CC0 bodies with faces (eyes, brows, painted features) on the Quaternius Universal Animation Library rig,
so every UAL clip (anims.glb: 11 clips) drives both. Outfits are modular and original:

- `humans.js` `loadHumans(THREE, base)` -> `{ make(spec, height), randomSpec(g, rnd, set), OUTFITS, HAIR, HAIR_COLS, SKINS }`
- Spec: `{ g:'m'|'f', skin, hair, hairCol, outfit, ci, cols? }` - JSON-serialisable (used for the player avatar in the shop).
- Outfits (`OUTFITS.m` / `OUTFITS.f`) are data: top type, sleeves, jacket (denim/blazer/vest), bottom (trousers/jeans/skirt/dress/track),
  shoes (sneakers/dress/heels), hood, bandana, and colour palettes. Sets: `casual`, `evening`, `street`.
  Painted by a bind-pose region shader (no extra textures) + small add-on meshes (hair styles, skirt/dress flare, hood, collar, bandana).
  To add an outfit, add an entry; to add a new garment shape, add a mesh in `make()` attached to a bone.
- Streetwear logo "VV / Velvet Vibes" is our own made-up mark. No third-party brands/logos.
- Size: male.glb 0.59 MB, female.glb 0.62 MB, anims.glb 0.27 MB (512px skin textures, normal/roughness maps dropped).

v1 (`characters/base-human-v1/`) is frozen; this folder supersedes it in the casino.
