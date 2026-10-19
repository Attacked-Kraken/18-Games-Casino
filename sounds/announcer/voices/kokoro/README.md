# Game Voice Library (Kokoro-82M, offline)

All voices are from **Kokoro-82M v1.0** (hexgrad/Kokoro-82M), run offline with kokoro-onnx (MIT).
**License: Apache-2.0** for the model and its voice packs. Commercial and paid apps are allowed, and no credit line is required.
An optional courtesy credit is "Voices: Kokoro-82M (Apache-2.0)". Keep a copy of the Apache-2.0 license with the source files. Not legal advice.

| Voice | Gender | Accent | Style / role | License | Credit needed |
|---|---|---|---|---|---|
| af_heart ⭐ (woman demo) | F | US | Hype announcer, bright and warm | Apache-2.0 | No |
| af_bella | F | US | Young and energetic | Apache-2.0 | No |
| af_nicole | F | US | Soft, calm tutorial guide | Apache-2.0 | No |
| af_sarah | F | US | Friendly coach | Apache-2.0 | No |
| bf_emma | F | UK | Warm story narrator | Apache-2.0 | No |
| bf_isabella | F | UK | Bright presenter / arena host | Apache-2.0 | No |
| am_michael ⭐ (man demo) | M | US | Warm narrator, versatile | Apache-2.0 | No |
| am_fenrir | M | US | Gruff tough guy | Apache-2.0 | No |
| am_puck | M | US | Young and energetic | Apache-2.0 | No |
| am_onyx | M | US | Deep arena MC | Apache-2.0 | No |
| am_eric | M | US | Calm coach | Apache-2.0 | No |
| bm_george | M | UK | Sports caller | Apache-2.0 | No |
| bm_fable | M | UK | Young adventure hero | Apache-2.0 | No |

Each `auditions/<voice>.mp3` file has a shared line ("Hi, I'm one of your game voices...") and then a line for that voice's role.

## Processing (tool/voicegen.py)
- Silence trim.
- 80 Hz high-pass filter.
- De-esser.
- -1.5 dB at 250 Hz to cut mud and +2 dB at 3.2 kHz for presence.
- Gentle 2.5:1 compression.
- No pitch shift, to avoid a chipmunk sound.
- Loudness: the level is measured (EBU R128) and gain is set to hit -16 LUFS, with a peak limiter. This is done in two passes, so short clips reach -16 too.

## Use
```
pip install kokoro-onnx soundfile        # plus ffmpeg
# put kokoro-v1.0.onnx and voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases) in a folder; export KOKORO_DIR=that folder
python tool/voicegen.py am_onyx "In the red corner, the champion!" mc.mp3 --speed 1.0
python tool/reel.py af_heart demo.mp3 0.95     # 7-line game reel with a soft bed
```

## Piper voices checked and rejected or not used
- en_US-ryan-high: dataset is CC BY-NC-SA (non-commercial). Rejected.
- en_GB-alan: dataset license unclear. Rejected.
- en_US-joe (CC0) and en_GB-northern_english_male (CC BY-SA 4.0, credit needed) are both allowed. They're used in the current sports packs but sound less natural than Kokoro.
