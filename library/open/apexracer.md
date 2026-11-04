# Exotic Racer Club (apexracer.html) - OPEN

Crew: tester window 8 · auditor window 6. Claude fixes everything marked FOR-CLAUDE.
Checklist: checklists/apexracer.md · Short rules: rules/short/apexracer.md · Findings: findings/apexracer/

## What's left (the auditor keeps this list current - newest finding first, BLOCKERs on top)
- F-R-001 (tester window 8, T8-11; audited in round A6-3: TRUE, KIND: CLAUDE, STATUS: FOR-CLAUDE): no race-type picker - race types offered 0 of 3 (word hits in apexracer.html: sprint 0, trial 0, time trial 0, checkpoint 0); the race sheet offers a place plus laps (8 / 10 / 12 / 15 / 20) only and every start is the same lap race.
- No BLOCKERs. Round A6-3 (auditor window 6): first look repeated - main was f258711 when the round was pulled and 21f7e89 at filing; apexracer.html blob b4682adb is identical on both, and the game was played start to finish on it (8 laps, finished 8th of 8, 4:22.18). The 9 items ticked at pull time were all re-measured and every one holds, so A6-3 filed 0 findings of its own. F-R-001 landed mid-round (PR #2299) and is audited above. The A6-1 measured lines below still stand for the unticked items.
- R04 traffic lights: DROPPED by the tester (checklist [-], T8-3) - no traffic lights exist on the course; traffic speeds at the grid measured 15.4-21.4 m/s in A6-3.
- R12 car size: player car profile 4.65 m long, 2.02 m wide; world box height 1.55 m - inside the checklist bands (4.5-4.8 m; 1.95 m ±15%; 1.1-1.4 m ±15%).
- R13 wheels on the ground: at the grid the player car's lowest point minus road height = 0.000 m and all 4 contact markers sat at +0.000 m; while-driving contact unverified in A6-1.
- R14 right way round: facing-vs-track dot sampled every 10 game-s while driving: 0.989-1.000, always above 0.9.
- R15 wheels present: mesh-name census is inconclusive (fetched models fuse wheels into body meshes; 0-10 of 26-69 meshes per car carry wheel/tyre names); menu car shows 4 wheels seated in the arches and a rival's wheels are visible on the road in the bumper-camera shot.
- R16 fetched paint: unverified - the garage model-swap paint comparison was not run in A6-1 or A6-3.
- R17 loading slices: the loading bar advanced 8% -> 18% -> 70% -> 92% during race setup (4 distinct live values sampled, A6-1).
- R18 real brands: visible menu / places / sheet text had 0 hits for a 27-name real-brand list and car names are fictional (V12 Goblin, Vanta GT, Kestrel RS); the credits screen lists one fetched model titled 'car tyre game ready p zero'.
- R19 controls: gas released at 33.7 m/s and the car stopped fully (0.000 m/s) in 9.67 game-s; the controls are the inline stick + buttons - the page loads no kit/controls.js (0 hits in the full main file).
- R20 REALITY hook: kind reads 'car' and go, time and speed are all functions on the hook.
- R21 menus fit 844x390: menu scrollHeight 390 = clientHeight 390, document scrollHeight 390, and the Race button sits at y 96-132 px, fully inside the viewport. Anomaly noted in A6-3 (not a finding): the menu stats strip overlaps the Back button by 16 px x 18 px at 844x390.

## Fixed this week
- (none yet)

## Waiting on the owner
- (nothing)

## Checklist progress
- 10 of 21 items ticked [x] in checklists/apexracer.md (R01, R02, R03, R05, R06, R07, R08, R09, R10, R11); 1 dropped [-] (R04); 10 unticked [ ] (R12-R21). Tester rounds T8-1 to T8-11 ticked R02, R03, R05, R06, R07, R08, R09, R10 and R11 with RESULT lines on the checklist (R10: camMode 0 default, clicks cycle 0->1->2->0, finish orbit height converging to 3.0, results screen; R11: RESULT: FOUND (F-R-001) - ticked as checked-and-failed, it does not hold).
- Round A6-3 re-measured all 9 ticked items on main f258711 - all hold. R01: 121 samples before GO, max move 0.000 m; first move at t = +0.017 s; 31.89 m at t = 2 s. R02: 0 laps at 0.451 lap driven (642 m); lap rose by exactly 1 at each 1,423 m crossing, 8 crossings. R03: 77,990 traffic observations, max |offset| 7.5 m vs road half-width 11 m, 0 violations. R05: 147 crashes in one race, biggest measured drop 80.26 m/s -> 14.24 m/s within 0.5 s, R.done false throughout, no game-over screen. R06: results table in DOM with 8 ordered rows (4:19.52 -> 4:22.18), R.best 30.43 s > 0, results sub-line reads 'best lap 0:30.43'. R07: 9 near misses, nitro rose from 0.301 to the 1.000 cap and never above it in 7,799 steps; HUD nitro arc tracked it (1,003 px at 0.301 -> 3,213 px at 1.000). R08: 0 '$', 0 'USD', 0 purchase controls across menu + garage + race sheet; only currency is coins, balance 200,000. R09: live HUD sampled 6 times - position text matched the standings 6/6, LAP text matched progress 6/6, BEST text matched R.best 6/6, speed-arc bright pixels rose 3,558 at 0 mph -> 11,749 at 163.1 mph, mini-map player marker centroid moved between samples. R10: camMode started at 0 and clicked 0 -> 1 -> 2 -> 0; settled camera distance / height at 0 m/s - mode 0: 6.238 m / +2.275 m, mode 1: 9.958 m / +3.783 m, mode 2 (bumper): 0.600 m ahead / +1.250 m; after a 1-lap finish the camera orbit height converged 2.560 m -> 2.865 m -> 2.945 m toward 3.0 m and the results screen showed. R11 was ticked after this round was pulled; its failure is F-R-001, audited TRUE / FOR-CLAUDE in this round (see What's left).
