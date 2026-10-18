# Look board — Monster Truck (`apexmonstertruck.html`)

Read this before every job on Monster Truck. The owner says each thing ONCE; it lives here forever.
When the owner gives a 👎, his exact words are added under NEVER (or MUST) and as a test in
`tools/game-check/fixes/apexmonstertruck.mjs`.

**Lighting preset:** `look-presets.js` → `field` (use the same one in the game and in tools/model-viewer.html).

## MUST
- Solid dirt floor
- J5: Engine is a deep layered V8 roar (sub-bass + detuned saws), revs 35Hz idle to 180Hz with speed
- J5: Menu music (112 BPM rock) and game music (132 BPM driving riff) play; mute silences everything
- J5: Truck ~2.7m tall with ~2.1m tires next to 4.4m cars - real Monster Jam proportions
- J5: Jumps arc fast (GRAV 38), land hard with dust burst + camera shake + thud - no floating
- J5 pic: camera 18 back / 9 up - truck fills the screen, not a tiny dot
- J5 pic: dirt repeat 220 (not 880) - no obvious tiling/streaking

## KEEP (owner, Oct 18 - LOCKED: never change these, whatever a job says)
- The truck exactly as in the J5 version (owner 👍 Oct 17, main 726a1dc): same model, body, tires, colors and style.
  Make it bigger only if the owner asks; never swap or rebuild it.
- Every ramp and jump the J5 version has (jump-to-jump doubles, mega ramp, colored ramps). Add ramps, never remove one.
- The J5 camera (18 back / 9 up, truck fills the screen) unless the owner gives a new camera spec.
- J45 (Oct 18) changed the truck, lost the ramps and made the camera low - the owner rejected it and the game went
  back to the J5 version. Only change what the owner asked for.

## NEVER
- No flicker between brown dirt and gray on phones (z-fighting)
- No streaky dirt
- No real brands, leagues, teams, players or characters
- Nothing built from boxes when a real model is possible

## Reference pictures
- The owner's photo / Gemini picture for this game (sent in chat by the approver) is the target.
- Approved 3D models: see MODELS.md (LOCKED ones may not be swapped).
