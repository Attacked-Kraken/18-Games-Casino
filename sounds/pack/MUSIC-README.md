# Music Loops Pack
There are 5 styles: arcade_chiptune, chill_lofi, epic_orchestral, sports_arena and puzzle. Each style has 7 pieces:
- Loops: `menu`, `gameplay_low`, `gameplay_mid`, `gameplay_high` and `boss`. They're 16 bars long, 31–60 s each, and loop seamlessly from the first sample to the last.
- Stings that don't loop: `victory_sting` and `gameover_sting`.

The three gameplay intensities in each style share the same tempo, key and chords. Start all three together and crossfade their volumes to raise or lower the intensity without breaking the beat.
For gapless looping use `.ogg`, not `.mp3` (WAV masters were left out of the zip to keep it small). Everything is at -16 LUFS. `manifest.json` lists the bpm, bars and duration of each piece. `preview.mp3` plays 6 s of each style.
## License
All audio was synthesized from scratch in code for Apex Arcade (no samples, recordings or third-party audio). It is free to use in paid apps, and no credit is needed. The generator scripts are in `tools/`.
