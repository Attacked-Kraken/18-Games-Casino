# Handoff for Claude — 18-Games-Casino audit
- Repo: Attacked-Kraken/18-Games-Casino, commit **77ea91c (2026-10-21 02:01:42 +0000)**. This audit made NO repo changes.
- Read first: REPORT.md (scorecard + top issues), DEFINITION-OF-DONE.md (the bar), shots/ (evidence: <game>-land.jpg, -port.jpg, -land-stick.jpg while stick held, -port-stick.jpg).

## Run the checks
```
pip install playwright pillow   # uses system Chrome; set CHROME=/path/to/chrome if not /usr/bin/google-chrome
python3 audit.py /path/to/repo apexf1.html apexhockey.html --shots shots --json results.json
python3 audit.py /path/to/repo            # all top-level games
```
Prints one line per game: score + FAIL list. A game is done only when it prints no FAILs (casino: ignore reality_hook) AND the manual DoD items pass.
Limits: fps is software rendering (hint only); overlap check only sees buttons/stick-class elements; modals open at load count as overlaps.

## Fix jobs (priority order, one per game per issue)
Each job: fix, rerun audit.py on that game, attach new shots.
1. **ALL sports pages — add REALITY hook.** Files: apexbaseball/f1/flight/hockey/monstertruck/moto/paperplane/racer/reefdash/soccer/trackfield.html, steelfront.html. Set `window.__reality={kind,player,others,contact}` once the player exists (see REALITY.md "Robot hook"). Pass: audit reality_hook PASS and tools/game-check/reality.mjs reports gap<3 cm, dot>0.9, size ±15%.
2. **Stick reset** — apexbaseball, apexflight, apexmonstertruck, apexmoto, apexsoccer, apextrackfield, truckstudio, beatmachine, sports .html. Add pointercancel/touchcancel + window blur + visibilitychange → reset stick & input to 0. Evidence: shots/<game>-land-stick.jpg. Pass: stick_release_safe PASS; manual: hold stick, trigger blur, input vector |v|<0.01.
3. **404s** — every apex*.html, truckstudio, beatmachine. Open DevTools Network, list failing URLs, add the files or fix paths. Pass: no_console_errors PASS in both viewports.
4. **apexflight.html** — stick vs stickZone vs Back overlap; Play-a-Friend modal overflows 390px height; btnFree/friendGo/friendClose off-screen. Evidence: shots/apexflight-land.jpg. Pass: no_overlap_land/port + no_offscreen PASS; modal scrolls or fits with max-height:100dvh.
5. **apexbaseball.html** — viewBtn overlaps helpHud; helpClose off-screen. Evidence: shots/apexbaseball-land.jpg, -port.jpg. Pass: overlap/offscreen PASS, help closable on 844x390.
6. **apextrackfield.html** — menu buttons bCareer/bTourn/bFree/bCode/bAddRival/bHow off-screen. Evidence: shots/apextrackfield-*.jpg. Pass: no_offscreen PASS.
7. **Performance** — apexsoccer, apexracer, apextrackfield, apexhockey, apexmonstertruck (≤2.5 fps hint vs apexf1 60). Apply STORE-READY light path (DPR≤1.5, shadows/post off on touch, ≤300 draw calls). Pass: fps hint ≥30 here, then 60 fps on a real mid-range phone.
8. **apexracer.html** (nmB) and **steelfront.html** (btn pri) off-screen. Pass: no_offscreen PASS.
9. **beatmachine.html** tabbtn overlaps seqPlay; buttons off-screen landscape. Pass: overlap/offscreen PASS.
10. **Casino (classic777, diamondclub, dragonjackpot, gemburst, gildedreels, pharaohsgold, poseidonsfortune)** — hint card htX off-screen; **bigwheel, candyrush, diamondpoker, dicepalace, rubyroulette** controls overlap htX in portrait. Likely shared code (casino-kit.js / bet-ui.js) — fix once. Pass: overlap/offscreen PASS with daily-gift modal dismissed.

## How DEFINITION-OF-DONE maps onto REALITY.md
| DoD section | REALITY.md rule |
|---|---|
| 4 Realism: facing dot>0.9 | "Direction" |
| 4 Realism: sizes ±15% | "Size" + Real sizes table |
| 4 Realism: gap<3 cm | "Ground contact" |
| 4 Realism: anim matches speed | "Animation matches speed" |
| 5 Camera | "Camera: never inside a wall…, player always visible, not covered by HUD" |
| 8 Game loop: AI same rules, results order, one results screen | "Rules" + "Results" |
| 4 __reality hook | "Robot hook" |
Sections 1–3, 6, 7, 9 come from STORE-READY.md and STUDIO-STANDARD.md (phones, 60 fps, portrait rule, shared human bodies, assets/licenses).
