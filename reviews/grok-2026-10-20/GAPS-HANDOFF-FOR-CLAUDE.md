# Gaps handoff for Claude: 7 jobs (18-Games-Casino)
Audited at commit 77ea91c. This review changed nothing in the repo. Do these after (or alongside) the 10 jobs in HANDOFF-FOR-CLAUDE.md.
To check progress at any time, run `python3 verify_done.py /path/to/repo` (add `--headless` to also do browser runs). It prints a DONE / NOT DONE table for G1–G7 and J1–J10.
Sports games = apexbaseball, apexf1, apexflight, apexhockey, apexmonstertruck, apexmoto, apexpaperplane, apexracer, apexreefdash, apexsoccer, apextrackfield, steelfront (.html).

## G1. Wire window.__reality into every sports game
- **Why:** REALITY.md requires the hook. Without it, tools/game-check/reality.mjs can't measure floating, sinking, size or facing, so those bugs never get caught.
- **Files:** the 12 sports .html files above (truckstudio.html too if it has a drivable truck).
- **Steps:**
  1. After the player Object3D exists, set `window.__reality={kind, player, others, contact, footOffset?}`. The fields are in the REALITY.md "Robot hook" section.
  2. Use the right kind per game: f1 → 'f1', racer/moto → 'car', monster truck → 'truck', hockey → 'skater', flight/paperplane → 'plane', and the rest → 'person'.
  3. Set `contact` to the wheels, skates or foot bones.
- **PASS TEST:**
  - `window.__reality.player` is truthy 5 s after start in every sports game.
  - reality.mjs reports contact gap < 3 cm, facing dot > 0.9, and size within ±15% of the REALITY table.
- **Proof:** `node tools/game-check/check.mjs` (which runs reality.mjs) and `verify_done.py` row G1.

## G2. Make the game-check robot FAIL on layout, stick reset and 404s
- **Why:** these checks only exist in audit.py, so the robot lets broken pull requests merge.
- **Files:**
  - Add a new file, `tools/game-check/mobile.mjs`.
  - Edit `.github/workflows/game-check.yml`: add a step after check.mjs (line ~110).
- **Steps:**
  1. Port audit.py's PROBE to mobile.mjs using Playwright chromium at 844x390 and 390x844 with hasTouch. It must check:
     - overlapping buttons (> 6 px)
     - off-screen controls
     - 404 responses (`page.on('response', r => r.status() >= 400)`)
     - that the source handles pointercancel or touchcancel, plus blur or visibilitychange
     - a runtime check: start a stick touch, dispatch `blur`, and confirm the game's input vector is 0
  2. Dismiss the daily-gift modal before measuring.
  3. Write FAIL items into game-check-out/results.json the way check.mjs does, and `process.exit(1)` on any FAIL.
  4. In the yml, add `run: node tools/game-check/mobile.mjs http://127.0.0.1:8811/ game-check-out` with no `|| true`.
- **PASS TEST:**
  - A deliberately broken pull request (a button moved off-screen) turns the check red.
  - The fixed main branch stays green.
- **Proof:** the GitHub Actions game-check run, and `verify_done.py` row G2 (greps the yml for mobile.mjs).

## G3. Real-phone testing path (free)
- **Why:** swiftshader in Chrome isn't an iPhone. The owner and his players use iPhone Safari.
- **Files:**
  - Add `tools/game-check/nightly-phone.mjs`. Extend `tools/game-check/safari.mjs` rather than duplicating it.
  - Add `.github/workflows/nightly-phone.yml`, or a cron job on the owner's Mac mini.
  - Add `PHONE-CHECKLIST.md`.
- **Steps:**
  1. Nightly at 3 AM CT, use Playwright webkit with `devices['iPhone 13 landscape']` and `devices['Pixel 7']`. Play each game for 60 s with scripted stick input, and record fps (rAF count), errors and screenshots.
  2. Save the results to `nightly/<date>.json`, and open or refresh one GitHub issue per failing game using the free `gh` CLI.
  3. On the Mac mini, also run Safari with the iOS Simulator for free (`xcrun simctl`). Optionally use the free tier of BrowserStack or LambdaTest. No paid services.
  4. PHONE-CHECKLIST.md is the manual owner checklist (5 min per game):
     - opens in under 5 s
     - sound plays after the first tap
     - the stick releases after a notification or app switch
     - no UI under the notch
     - win, lose and restart all work
     - 3 rounds with no lag
     - add to home screen, then airplane mode, still opens
- **PASS TEST:**
  - The nightly workflow has a schedule and has produced a nightly JSON in the last 48 h.
  - PHONE-CHECKLIST.md exists and has a dated sign-off row per game.
- **Proof:** `verify_done.py` row G3, plus the Actions "nightly-phone" history.

## G4. Service worker for offline play
- **Why:** STORE-READY wants installed games to work with no signal. There is no sw.js today.
- **Files:** add `sw.js` (repo root). Edit `manifest.webmanifest` and every game .html to register it.
- **Steps:**
  1. Write sw.js as cache-first, with a versioned cache name. Precache the game html, the shared .js/.css, three.module.min.js and vendor/, and cache models, sounds and venues at runtime.
  2. Register it with `navigator.serviceWorker.register('/sw.js')` from nav.js or each game.
  3. Bump the cache version on each release.
- **PASS TEST:** Playwright loads the game online, then sets `context.setOffline(true)` and reloads. The canvas is not blank and there are 0 page errors.
- **Proof:** `verify_done.py --headless` row G4.

## G5. App-store wrapper (Capacitor, iOS and Android)
- **Why:** the games are aimed at the App Store and Google Play (STORE-READY.md).
- **Files:**
  - Add `capacitor.config.json` (webDir: a build folder such as `www/`).
  - Edit `package.json` (add @capacitor/core, cli, ios, android).
  - Add `scripts/build-www.mjs` (copies the games and assets into www/).
  - Add `ios/` and `android/`, made by `npx cap add`.
  - Add `STORE-WRAPPER.md`.
- **Steps:**
  1. Run `npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`.
  2. Run `npx cap init "Apex Games" com.<owner>.games --web-dir www`.
  3. Run the build-www script, then `npx cap add ios` and `npx cap add android`, then `npx cap sync`.
  4. Lock orientation per game natively (or with the @capacitor/screen-orientation plugin), and set the status bar and safe-area handling.
  5. Make the icons and splash screens from app-icon-512.png (`@capacitor/assets`).
  6. Document signing: an Apple Developer account and a Play Console account are the only costs, and they're the owner's decision.
- **PASS TEST:**
  - `npx cap sync` exits 0.
  - `cd android && ./gradlew assembleDebug` builds an APK that launches a game in the emulator.
  - The iOS build succeeds in Xcode on the Mac mini.
- **Proof:** `verify_done.py` row G5 (checks the config and folders), plus a CI step that runs assembleDebug.

## G6. Missing-file (404) gate
- **Why:** every sports page asks for files that don't exist.
- **Files:**
  - Add `tools/game-check/missing-files.mjs`.
  - Add a step to `.github/workflows/game-check.yml`, or merge it into the file-guard.yml or asset-check.yml workflow.
- **Steps:**
  1. Static pass: parse src, href and import paths, plus quoted strings ending in .glb, .gltf, .mjs, .js, .png, .jpg, .ogg, .mp3, .wav or .json. Resolve them relative to the page, and fail any that don't exist.
  2. Runtime pass: load each game for 10 s and list every response with status ≥ 400.
  3. Exit 1 on any result.
- **PASS TEST:** 0 missing files, static and runtime, across all games. Adding a fake `models/nope.glb` reference makes the check red.
- **Proof:** the robot step, and `verify_done.py` row G6 (runs the runtime 404 scan with `--headless`).

## G7. Real-player error reporting (free, self-hosted)
- **Why:** bugs that happen on players' phones are invisible today.
- **Files:**
  - Add `errlog.js`, included in every game.
  - Add a tiny endpoint: a free Cloudflare Worker, or a small Node script on the Mac mini, `tools/errlog-server.mjs`.
  - Optionally add `.github/workflows/error-digest.yml`.
- **Steps:**
  1. errlog.js hooks `window.onerror` and `unhandledrejection`.
  2. It builds a payload of {game, msg, stack (first 1 KB), ua, viewport, build commit, time}.
  3. It removes duplicates by hash, sends at most 5 reports per session, and uses `navigator.sendBeacon(ENDPOINT, json)`.
  4. Make it opt-out, collect no personal data, and never send it from casino wallet fields.
  5. The endpoint appends to a log file. A nightly job groups the log and opens or updates one GitHub issue per error hash with `gh issue create`, so no GitHub token ever ships to the client.
- **PASS TEST:** a test page runs `throw new Error('errlog-test')`. Within 1 min the endpoint log has the entry, and the nightly digest makes or updates exactly one issue.
- **Proof:** `verify_done.py` row G7 (checks errlog.js exists and is included in every game, and that the onerror and sendBeacon calls are there).
