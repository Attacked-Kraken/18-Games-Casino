# JOB-01: a robot that watches the game, not only the code

**Why:** the sunk hockey skates and the 8 ft baseball players reached the owner first. The robots only read code.
This one films each game and compares it with the last good build.

**Files (copy into the repo at the same paths):**
- `drop-in/tools/visual-check/visual.mjs`
- `drop-in/.github/workflows/visual-check.yml`

**What it does for each of the 6 games:**
1. Opens the game like a landscape iPhone (844x390), presses the start buttons from `tools/game-check/games.json`.
2. Takes 12 frames over 6 s (`frames/00..11.png`), plus `clip.mp4` when ffmpeg is available.
3. If the game has `window.__reality` (JOB-04), it also:
   - takes a **close-up** of the feet, skates or wheels against the ground (`closeup.png`)
   - reads the **camera height above the ground** on every frame
   - reads the **gap between the feet/skates/wheels and the ground** on every frame
4. It goes red when:
   - the screen is blank or the game is frozen
   - the camera goes under the ground or ice (lower than 0.3 m)
   - the feet, skates or wheels sink or float more than 6 cm, or 3 cm worse than the last good build
   - the picture changes a lot from the last good build (more than 45% for gameplay, 60% for the close-up), or loses half its detail. Those are the invisible-car or missing-model cases.
5. On main, after a merge, it saves the run as the new baseline on the `visual-baselines` branch. On a PR, it compares against that baseline and uploads all the pictures as an artifact called `visual-play-test`.

**Tested here:** on the patched hockey game it passed (camera lowest 12.3 m, skates 0.1 cm from the ice). Then I sank the skates on purpose by 12 cm and it **failed** with "feet/skates/wheels SINK 12.3 cm" and "ground contact got WORSE". See `proof/visual-robot-catches-sunk-skates.png`. Flight passed.

**Run it yourself:**
```
npm i --no-save playwright@1.48.2 pngjs@7 pixelmatch@5 && npx playwright install chromium
node tools/visual-check/visual.mjs --out visual-out --baseline visual-baseline --update      # make a baseline
node tools/visual-check/visual.mjs --out visual-out --baseline visual-baseline apexhockey.html # compare
```

**Done when:** a PR that re-sinks the skates goes red on "Visual play-test", and the owner can open `closeup.png` from the run page.

**Notes:**
- Games without `__reality` still get the blank, frozen and diff checks. Close-ups only appear after JOB-04 lands.
- Random numbers are seeded so runs look alike. If a game still flickers too much, raise `VISUAL_DIFF_LIMIT` in the workflow env. Don't remove the checks.
