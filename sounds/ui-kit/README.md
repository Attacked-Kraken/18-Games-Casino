# UI Sound Kit
There are 69 UI sounds: 23 sounds in 3 styles, `arcade/` (chip and square), `soft/` (warm marimba with a little room) and `scifi/` (FM with shimmer).
Each sound comes as `.wav` and `.mp3`. Sounds are about -16 LUFS. Very short ticks (taps and toggles) are peak-normalized instead, because they're too short to measure loudness on.
The sounds are: tap, tap_light, toggle_on/off, coin_pickup, combo_x2–x5 (each one higher), level_up, unlock, error, swoosh_in/out, popup_open/close, star_1/2/3, win_jingle, lose_jingle, daily_reward and chest_open.
`manifest.json` lists every file. `preview.mp3` plays through all 3 styles.
## License
All audio was synthesized from scratch in code for Apex Arcade (no samples, recordings or third-party audio). It is free to use in paid apps, and no credit is needed. The generator scripts are in `tools/`.
