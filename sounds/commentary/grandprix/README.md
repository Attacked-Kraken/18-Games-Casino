# Grand Prix Commentary Pack

106 voice clips, two commentators, enthusiastic style. Original lines only; no real leagues, teams, players or brands.

## Files
- `clips/<event>/<id>.mp3` and `.ogg`: 44.1 kHz mono, about -16 LUFS, silence trimmed.
- `manifest.json`: id, event, speaker (`announcer` or `color`), text, file, file_ogg, duration, plus `dialogue_id` and `order` for dialogue pairs.
- `commentary.js`: picks a random non-repeating line per event, plays dialogue pairs in order, cooldown so lines never overlap.
- `demo.html`: buttons for every event. Serve the folder (`python3 -m http.server`) and open it.
- `sample.mp3`: short mock broadcast with a soft synthesized crowd bed.

## Use
```html
<script src="commentary.js"></script>
<script>
const c = new Commentary({ base: 'commentary/', cooldown: 600 });
await c.load('manifest.json');
c.say('pass');                    // skipped if a line is still playing or cooling down
c.say('goal', { priority: true }); // interrupts whatever is playing
c.dialogue();                      // random two-line exchange
</script>
```
Browsers need a tap or click before audio can play (call it from a user gesture first).

## Events
- `start`: 6 clips
- `overtake`: 7 clips
- `boost_zone`: 4 clips
- `pit_stop`: 5 clips
- `tires`: 4 clips
- `crash`: 4 clips
- `safety_car`: 4 clips
- `flags`: 5 clips
- `fastest_lap`: 3 clips
- `last_lap`: 4 clips
- `checkered_flag`: 4 clips
- `photo`: 2 clips
- `podium`: 4 clips
- `lose`: 2 clips
- `crowd`: 3 clips
- `idle`: 5 clips
- `dialogue`: 40 clips

## Voices and licenses
Made offline with Piper TTS (the Piper program is GPL-3.0; only its audio output is shipped, no Piper code).
- Announcer: `en_US-joe-medium`, trained on a dataset released as CC0 (public domain). Commercial use OK, no attribution required.
- Color commentator: `en_GB-northern_english_male-medium`, trained on OpenSLR 83 (CC BY-SA 4.0). Commercial use OK. Credit it, e.g. in game credits: "Color commentator voice: Piper en_GB-northern_english_male, trained on OpenSLR SLR83 (CC BY-SA 4.0)". Share-alike may extend to these audio clips if redistributed on their own.
- Rejected: `en_US-ryan-high` (dataset CC BY-NC-SA, non-commercial) and `en_GB-alan` (license unclear).
Not legal advice.
