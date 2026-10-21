# JOB-03: install the 6 games on the phone and play offline

**Why:** the owner should be able to play the newest build every morning on his own phone in a minute, with no signal.
That's how touch and speed problems get caught, the ones the test computer misses.

**Files:**
- `drop-in/apex-sports.html`: the launcher, with 6 big buttons, install instructions, and a "Save all 6 for offline" button
- `drop-in/sports.webmanifest`: the sports app, opening in landscape and full screen at apex-sports.html
- `drop-in/sw.js`: the service worker. Games load network-first, so there's always a fresh build when online. Models, sounds, and three.js load cache-first and refresh in the background.
- `drop-in/icons/apex-sports-180.png`, `-192.png`, `-512.png`
- `drop-in/tools/phone-install/install-head.html`: the `<head>` snippet
- `drop-in/tools/phone-install/add-head.py`: puts the snippet into the 6 games (safe to run twice)
- `patches/03-phone-install-heads.patch`: the same head change as a patch, if you'd rather apply it

**Important:** the 6 games currently link `manifest.webmanifest`, the **casino** app whose start page is `./`. So "Add to Home Screen" from a sports game opened the casino. The snippet swaps that for `sports.webmanifest`. The casino manifest itself is not touched.

**Owner steps (iPhone):** open `apex-sports.html` from the GitHub Pages site in Safari → Share → Add to Home Screen → open it once while online → tap "Save all 6 for offline".

**Tested here (headless Chrome):** the service worker registers ("offline ready ✓"), and all 6 cards show. After playing hockey and F1 once, with the network turned off: the launcher, hockey, and F1 all reloaded with their 3D canvas and no script errors. See `proof/launcher-apex-sports.png`.

**Done when:** the owner's phone opens Apex Sports from the home screen in airplane mode and plays hockey.

**Note:** `verify_done.py` G4 looks for `sw.js` plus `serviceWorker` in each game. Both are true after this job.
