# Exotic Racer Club (apexracer.html) - OPEN

Crew: tester window 8 · auditor window 6. Claude fixes everything marked FOR-CLAUDE.
Checklist: checklists/apexracer.md · Short rules: rules/short/apexracer.md · Findings: findings/apexracer/

## What's left (the auditor keeps this list current - newest finding first, BLOCKERs on top)
- No BLOCKERs. Round A6-1 (auditor window 6, main 6f661f4): the one ticked item R01 was re-measured and holds (126 samples before GO, max move 0.000 m; 31.89 m at t = 2 s after GO) - 0 findings filed. The 20 unticked items below were probed in the same round; one measured line each.
- R02 laps in order: progress laps read 0 at 963 m (0.68 lap), 3 at 4,933 m, 6 at 9,198 m, finish at exactly 8 laps (track 1,422.3 m).
- R03 traffic lanes: 10 traffic cars, lateral offsets all within ±7.5 m of the centre line (max |d| 7.5 m at the grid and in every driving sample).
- R04 traffic lights: unverified - no traffic light was encountered on the New York night course in a full 8-lap race; traffic speeds at the grid 14.0-21.9 m/s.
- R05 crash cost: 153 collisions in one 8-lap race, player speed fell to 5.2 m/s in collision batches, race always continued to the finish (no game over).
- R06 finish results: results table shown with 8 rows ordered by time (1st 4:31.70 to 8th 4:37.07); best lap unverified this round (the sim drive path does not record lap times).
- R07 nitro: 7 near misses in one race; nitro rose per near miss and capped at 1.000, never above; nitro arc + NITRO label drawn on the speedometer canvas.
- R08 no real money: menu / places / sheet text scan found 0 '$', no 'USD' and no purchase control; the only currency shown is coins (balance 200,000; 1st place pays 2,500).
- R09 race HUD: live HUD read position '6th/8', 'LAP 1/8', 'TIME 0:00.15', 'BEST --'; speedometer (#spd) and mini-map (#mini) canvases present and drawn.
- R10 cameras: camMode starts at 0 and cycles 0 -> 1 -> 2 on the camera button; measured camera distance / height - mode 0: 11.14 m / +4.81 m (countdown sweep), mode 1: 14.46 m / +3.82 m, mode 2 (bumper): 0.6 m / +1.25 m; finish replay unverified this round.
- R11 race types: no circuit / sprint / time trial picker - those words appear 0 times in the menu, places and sheet text; the sheet offers a place plus laps (8 / 10 / 12 / 15 / 20) only.
- R12 car size: player car profile 4.65 m long, 2.02 m wide; world box height 1.55 m - inside the checklist bands (4.5-4.8 m; 1.95 m ±15%; 1.1-1.4 m ±15%).
- R13 wheels on the ground: at the grid the player car's lowest point minus road height = 0.000 m and all 4 contact markers sat at +0.000 m; while-driving contact unverified this round.
- R14 right way round: facing-vs-track dot sampled every 10 game-s while driving: 0.989-1.000, always above 0.9.
- R15 wheels present: mesh-name census is inconclusive (fetched models fuse wheels into body meshes; 0-10 of 26-69 meshes per car carry wheel/tyre names); menu car shows 4 wheels seated in the arches and a rival's wheels are visible on the road in the bumper-camera shot.
- R16 fetched paint: unverified - the garage model-swap paint comparison was not run this round.
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
- 1 of 21 items ticked [x] in checklists/apexracer.md. Round A6-1 re-measured the 1 ticked item (R01 - holds) and probed the other 20; 0 findings filed.
