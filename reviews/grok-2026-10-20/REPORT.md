# Audit report — Attacked-Kraken/18-Games-Casino
Commit audited: **77ea91c (2026-10-21 02:01:42 +0000)** (git pull --ff-only, read-only; no repo changes). Run: Oct 20 2026 ~9:05–9:35 PM CT.
Tool: audit.py, headless Chrome + swiftshader, iPhone touch viewports 844x390 (land) and 390x844 (port).
33 game pages (all top-level *.html except index.html, go.html): 15 sports/3D/tools + 18 casino.

## How to read this
- **fps** is swiftshader software rendering with 3 audits in parallel — a *relative* hint only. Real phones need a device test.
- Casino overlaps "ck-chip x ckDailyGo" are mostly the **Daily gift modal** sitting over the bet chips on first load
  (see shots/rubyroulette-land.jpg). Expected modal behaviour, but on 844x390 the modal covers the whole table and the
  gift card's own content is close to clipping — check it. **reality_hook** is not counted for casino games.
- No game rendered a blank canvas. No game hard-crashed (no PAGEERROR/LOADFAIL).
- Not tested: real phones, real audio output, full rounds/win-lose, physics/scale numbers (needs each game's __reality hook).

## Scorecard
Status "works" = ≤1 failed check. No game reached that bar.
| Game | Pass | Status | fps (hint) | Failed checks | Overlaps (sample) | Off-screen | Evidence |
|---|---|---|---|---|---|---|---|
| apexbaseball.html | 3/10 | needs fixes | 5.1 | no_console_errors, no_overlap_land, no_overlap_port, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe, reality_hook | viewBtn x helpHud; viewBtn x helpHud | helpClose | shots/apexbaseball-land.jpg |
| apexf1.html | 8/10 | needs fixes | 60.2 | no_console_errors, reality_hook | - | - | shots/apexf1-land.jpg |
| apexflight.html | 3/10 | needs fixes | 16.2 | no_console_errors, no_overlap_land, no_overlap_port, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe, reality_hook | back x jetBtn; stick x stickZone; back x stickZone | btnFree, friendGo, friendClose, stickZone | shots/apexflight-land.jpg |
| apexhockey.html | 7/10 | needs fixes | 1.1 | no_console_errors, fps_ge_30_swiftshader_hint, reality_hook | - | - | shots/apexhockey-land.jpg |
| apexmonstertruck.html | 6/10 | needs fixes | 2.5 | no_console_errors, fps_ge_30_swiftshader_hint, stick_release_safe, reality_hook | - | - | shots/apexmonstertruck-land.jpg |
| apexmoto.html | 6/10 | needs fixes | 4.1 | no_console_errors, fps_ge_30_swiftshader_hint, stick_release_safe, reality_hook | - | - | shots/apexmoto-land.jpg |
| apexpaperplane.html | 7/10 | needs fixes | 28.7 | no_console_errors, fps_ge_30_swiftshader_hint, reality_hook | - | - | shots/apexpaperplane-land.jpg |
| apexracer.html | 6/10 | needs fixes | 0.5 | no_console_errors, no_offscreen, fps_ge_30_swiftshader_hint, reality_hook | - | nmB, nmB | shots/apexracer-land.jpg |
| apexreefdash.html | 7/10 | needs fixes | 11.9 | no_console_errors, fps_ge_30_swiftshader_hint, reality_hook | - | - | shots/apexreefdash-land.jpg |
| apexsoccer.html | 6/10 | needs fixes | 0.5 | no_console_errors, fps_ge_30_swiftshader_hint, stick_release_safe, reality_hook | - | - | shots/apexsoccer-land.jpg |
| apextrackfield.html | 5/10 | needs fixes | 0.6 | no_console_errors, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe, reality_hook | - | bCareer, bTourn, bFree, bCode, bAddRival, bHow, bB | shots/apextrackfield-land.jpg |
| beatmachine.html | 5/10 | needs fixes | 45.1 | no_console_errors, no_overlap_land, no_offscreen, stick_release_safe, reality_hook | tabbtn on x seqPlay | BUTTON, BUTTON, BUTTON, BUTTON, BUTTON, BUTTON, BU | shots/beatmachine-land.jpg |
| sports.html | 5/10 | needs fixes | 2.4 | no_overlap_port, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe, reality_hook | refresh x tab | tab, tab, tab, tab, lbtns, fbb, stopb, mv, tab, ta | shots/sports-land.jpg |
| steelfront.html | 7/10 | needs fixes | 5.3 | no_offscreen, fps_ge_30_swiftshader_hint, reality_hook | - | btn pri, btn pri | shots/steelfront-land.jpg |
| truckstudio.html | 6/10 | needs fixes | 13.0 | no_console_errors, fps_ge_30_swiftshader_hint, stick_release_safe, reality_hook | - | - | shots/truckstudio-land.jpg |
| baccaratnoir.html | 6/9 | needs fixes | 4.2 | no_overlap_land, fps_ge_30_swiftshader_hint, stick_release_safe | xP x ckDailyGo; xT x ckDailyGo | - | shots/baccaratnoir-land.jpg |
| bigwheel.html | 5/9 | needs fixes | 4.2 | no_overlap_land, no_overlap_port, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip x ckDailyGo; ck-chip x ckDailyGo; bwS5 x htX | - | shots/bigwheel-land.jpg |
| candyrush.html | 5/9 | needs fixes | 3.3 | no_overlap_land, no_overlap_port, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo; crTurbo x htX | - | shots/candyrush-land.jpg |
| classic777.html | 5/9 | needs fixes | 3.5 | no_overlap_land, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo | htX | shots/classic777-land.jpg |
| diamondclub.html | 5/9 | needs fixes | 3.6 | no_overlap_land, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo | htX | shots/diamondclub-land.jpg |
| diamondpoker.html | 5/9 | needs fixes | 9.2 | no_overlap_land, no_overlap_port, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo; pHint x htX | - | shots/diamondpoker-land.jpg |
| dicepalace.html | 5/9 | needs fixes | 5.7 | no_overlap_land, no_overlap_port, fps_ge_30_swiftshader_hint, stick_release_safe | BUTTON x ckDailyGo; BUTTON x ckDailyGo; BUTTON x htX | - | shots/dicepalace-land.jpg |
| dragonjackpot.html | 5/9 | needs fixes | 4.1 | no_overlap_land, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo | htX | shots/dragonjackpot-land.jpg |
| gemburst.html | 5/9 | needs fixes | 3.7 | no_overlap_land, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo | htX | shots/gemburst-land.jpg |
| gildedreels.html | 6/9 | needs fixes | 2.9 | no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe | - | htX | shots/gildedreels-land.jpg |
| holdemroyale.html | 7/9 | needs fixes | 5.7 | fps_ge_30_swiftshader_hint, stick_release_safe | - | - | shots/holdemroyale-land.jpg |
| luckykeno.html | 7/9 | needs fixes | 4.6 | fps_ge_30_swiftshader_hint, stick_release_safe | - | - | shots/luckykeno-land.jpg |
| pharaohsgold.html | 5/9 | needs fixes | 3.2 | no_overlap_land, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo | htX | shots/pharaohsgold-land.jpg |
| plinkodrop.html | 6/9 | needs fixes | 5.2 | no_overlap_land, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo | - | shots/plinkodrop-land.jpg |
| poseidonsfortune.html | 5/9 | needs fixes | 3.8 | no_overlap_land, no_offscreen, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo | htX | shots/poseidonsfortune-land.jpg |
| rocketcrash.html | 6/9 | needs fixes | 6.4 | no_overlap_land, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo | - | shots/rocketcrash-land.jpg |
| rubyroulette.html | 5/9 | needs fixes | 3.6 | no_overlap_land, no_overlap_port, fps_ge_30_swiftshader_hint, stick_release_safe | ck-chip on x ckDailyGo; ck-chip x ckDailyGo; rClr x htX | - | shots/rubyroulette-land.jpg |
| velvet21.html | 7/9 | needs fixes | 7.9 | fps_ge_30_swiftshader_hint, stick_release_safe | - | - | shots/velvet21-land.jpg |

## Top issues by severity
1. **No game sets `window.__reality`** (all 15 sports/3D pages). REALITY.md says every game must, so the REALITY robot can't measure float/sink, scale, or facing at all. That's why those bugs slip through.
2. **Stick doesn't reset on cancel/blur** in 9 of 15 sports pages (no pointercancel/touchcancel *and* blur/visibilitychange handlers): baseball, flight, monstertruck, moto, soccer, trackfield, truckstudio, beatmachine, sports. A phone call, notification, or palm touch leaves the stick stuck. apexf1, apexhockey, apexpaperplane, apexracer, apexreefdash, steelfront pass.
3. **Console 404s in every sports page** (resource requests the static server can't find, likely runtime-loaded models/textures/sounds). Missing assets = missing models/sound on device.
4. **apexflight**: stick overlaps stickZone/Back, jet button overlaps Back; Play-a-Friend modal runs off the bottom at 844x390 (its button is cut off) — shots/apexflight-land.jpg. btnFree/friendGo/friendClose are off-screen.
5. **apexbaseball**: viewBtn overlaps helpHud in both orientations; helpClose is off-screen, so the help can't be closed on a phone.
6. **apextrackfield** main menu buttons (Career/Tournament/Free/Code/Rival/How) are off-screen at 390x844 / 844x390.
7. **Very heavy 3D**: soccer 0.5, racer 0.5, trackfield 0.6, hockey 1.1, monstertruck 2.5 fps vs apexf1 60 fps on the same machine. Big risk of missing the STORE-READY 60 fps bar on real phones.
8. **apexracer** nmB (name) buttons off-screen; **steelfront** primary buttons off-screen.
9. **beatmachine**: tab button overlaps seqPlay; many buttons off-screen in landscape.
10. **Casino**: in-game hint (htX) off-screen on 8 slot/table games; bigwheel/candyrush/diamondpoker/dicepalace/rubyroulette controls overlap the hint card in portrait. All casino pages under 36 px targets in places (see results.json "small").

## Closest to done
1. **apexf1** 8/10: only 404s + missing __reality. 60 fps hint, clean layout, stick-safe.
2. **apexhockey**, **apexpaperplane**, **apexreefdash**, **steelfront** 7/10.
3. Casino: **holdemroyale**, **luckykeno**, **velvet21** 7/9 (only stick/fps hints, which barely apply to card games).

Raw data: results.json (every check, overlap list, small-target count, errors) in the zip.
