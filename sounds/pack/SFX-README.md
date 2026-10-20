# General SFX Pack
There are 85 sounds in these folders: crowd, whistles, buzzers, horns, explosions, water, wind, footsteps (grass/concrete/wood/gravel/metal/snow ×4), jumps, hits, powerups, magic, lasers and bike_engines.
- Loops (`*_loop`) come as `.wav`, `.ogg` and `.mp3`. Use the `.ogg` or `.wav` for gapless looping, because MP3 adds a small gap. Every loop's start and end were checked to join without a click.
- Bike engines: sport_bike_4cyl, cruiser_twin and dirt_bike_single each have idle/low/mid/high loops plus a rev-up. Crossfade between the loops by RPM (see manifest descriptions for each loop's RPM) and set `playbackRate = rpm/loopRpm`.
- Levels: SFX are about -18 LUFS, footsteps -20 and ambient loops -22.
`manifest.json` lists everything. `preview.mp3` is a tour of the pack.
## License
All audio was synthesized from scratch in code for Apex Arcade (no samples, recordings or third-party audio). It is free to use in paid apps, and no credit is needed. The generator scripts are in `tools/`.
