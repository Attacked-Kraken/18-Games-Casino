# Exotic Racer Club (apexracer.html) - OPEN

Crew: tester window 8 · auditor window 6. Claude fixes everything marked FOR-CLAUDE.
Checklist: checklists/apexracer.md · Short rules: rules/short/apexracer.md · Findings: findings/apexracer/

## What's left (the auditor keeps this list current - newest finding first, BLOCKERs on top)
- No BLOCKERs and no open findings. Round A6-2 (auditor window 6, main 450ea97): findings/apexracer/ on main holds 0 finding files (only pics/.keep, 0 bytes) - 0 findings with STATUS: NEW to audit, 0 AUDIT blocks added, 0 fixes this round. apexracer.html is unchanged since round A6-1 (blob b4682adb), so the A6-1 measured lines below still stand for the unticked items.
- R04 traffic lights: DROPPED by the tester (checklist [-], T8-3) - no traffic lights exist on the course; traffic speeds at the grid measured 14.0-21.9 m/s in A6-1.
- R10 cameras: camMode starts at 0 and cycles 0 -> 1 -> 2 on the camera button; measured camera distance / height - mode 0: 11.14 m / +4.81 m (countdown sweep), mode 1: 14.46 m / +3.82 m, mode 2 (bumper): 0.6 m / +1.25 m; finish replay unverified in A6-1.
- R11 race types: no circuit / sprint / time trial picker - those words appear 0 times in the menu, places and sheet text; the sheet offers a place plus laps (8 / 10 / 12 / 15 / 20) only.
- R12 car size: player car profile 4.65 m long, 2.02 m wide; world box height 1.55 m - inside the checklist bands (4.5-4.8 m; 1.95 m ±15%; 1.1-1.4 m ±15%).
- R13 wheels on the ground: at the grid the player car's lowest point minus road height = 0.000 m and all 4 contact markers sat at +0.000 m; while-driving contact unverified in A6-1.
- R14 right way round: facing-vs-track dot sampled every 10 game-s while driving: 0.989-1.000, always above 0.9.
- R15 wheels present: mesh-name census is inconclusive (fetched models fuse wheels into body meshes; 0-10 of 26-69 meshes per car carry wheel/tyre names); menu car shows 4 wheels seated in the arches and a rival's wheels are visible on the road in the bumper-camera shot.
- R16 fetched paint: unverified - the garage model-swap paint comparison was not run in A6-1.
- R17 loading slices: the loading bar advanced 8% -> 18% -> 70% -> 92% during race setup (4 distinct live values sampled).
- R18 real brands: visible menu / places / sheet text had 0 hits for a 27-name real-brand list and car names are fictional (V12 Goblin, Vanta GT, Kestrel RS); the credits screen lists one fetched model titled 'car tyre game ready p zero'.
- R19 controls: gas released at 33.7 m/s and the car stopped fully (0.000 m/s) in 9.67 game-s; the controls are the inline stick + buttons - the page loads no kit/controls.js (0 hits in the full main file).
- R20 REALITY hook: kind reads 'car' and go, time and speed are all functions on the hook.
- R21 menus fit 844x390: menu scrollHeight 390 = clientHeight 390, document scrollHeight 390, and the Race button sits at y 96-132 px, fully inside the viewport.

## Fixed this week
- (none yet)

## Waiting on the owner
- (nothing)

## Checklist progress
- 8 of 21 items ticked [x] in checklists/apexracer.md (R01, R02, R03, R05, R06, R07, R08, R09); 1 dropped [-] (R04); 12 unticked [ ] (R10-R21). Tester rounds T8-1 to T8-8 ticked R02, R03, R05, R06, R07, R08 and R09 with RESULT numbers on the checklist (R02: 0 laps after 0.45 lap driven, exactly 1 lap after a full loop; R03: max |offset| 7.5 m vs road half-width 11 m, 9,550 observations, 0 violations; R05: speed 85.1 -> 6.9 at a driven crash, race continued, R.done false; R06: results table with 8 ordered positions, best lap 0:35.10; R07: 25 near-miss fires, nitro +0.18 to cap 1.0, HUD bar present; R08: 0 real-money prices/controls in menu + garage + race setup, all prices in coins, balance 200,000; R09: all 5 HUD elements live in race, position tracking 18/18 samples, speed arc 0-167 mph, mini-map drawn). Round A6-1 re-measured the then-only ticked item R01 (holds: 126 samples before GO, max move 0.000 m; 31.89 m at t = 2 s after GO). Round A6-2 audited 0 findings - none are filed on main.
