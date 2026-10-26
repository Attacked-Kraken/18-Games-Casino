# Exotic Racer - measured lines (DRAFT, started Oct 26 2026)

One file for this game. Every card, send-back and recording verdict names ONE failing line from here (by its id).

STATUS OF EVERY NUMBER BELOW: **draft**. The draft comes from two nightly films (Oct 26 5:20 AM and 9:56 AM UTC, rec/apexracer/ on branch `recordings`), and those films include the misses.
So a draft PASS means only "close to last night" - it is NOT proof the game feels right. The owner's accepted minute replaces every draft number. A line he widened or rejected after looking at it is marked here with the date.
Do NOT roll this to Baseball until one Racer night has a real pass/fail per line (ledger: recordings branch verdict.txt).

## BLOCK NOW (not taste - no warning week)
| id | line | measured from |
|---|---|---|
| R-FRAME | the car stays on screen: playerOnScreenPct >= 95 (draft; last 2 films 100) | measures.json playerOnScreenPct |
| R-60S | a finish, score or boost event shows before 60 s of GAME time (draft; films reached only 30.5 / 35.2 game seconds because the robot runs slowly - a run that never reaches 60 game s is "NOT PLAYED", never a pass) | measures.json moments / gameSecondsReached |
| R-DIFF | picture-difference has a saved image to compare with (looks/apexracer/approved-play.jpg + approved-face.jpg); missing = FAIL | looks_diff |

## YELLOW until Nov 2 2026, then BLOCK (day 8 = Nov 2 2026)
Log PASS / FAIL for each on every nightly run. On Nov 2 a line becomes a block ONLY if it failed at least once during the week and the owner did not widen it. A line that never failed stays logged, not blocking. Nothing stays yellow past Nov 2.
| id | line (all draft) | last 2 films |
|---|---|---|
| R-CAM-DIST | camera distance mean 10-17 m, never under 5 m | mean 13.9 / 13.6, min 6.63, max 33 (a 33 m peak = the countdown fly-in? verify) |
| R-CAM-HEIGHT | camera height mean 2.5-4 m | mean 3.16 / 3.07, max 17 (fly-in?) |
| R-FOLLOW-LAG | follow lag <= 0.05 m per m/s | 0.015 / 0.025 |
| R-HIT-FREEZE | hit pause under 0.15 s | NOT MEASURED by the recorder yet - draft number has no film behind it; needs the recorder to log it before this line can pass or fail |

## Facts from the two films (for the owner's minute to be judged against)
- speed mean 55-57, max 93-96; metres moved 156 / 206 (the robot driver is a weak, human-style driver)
- camera aim error mean 6.7-6.9 deg
- fpsAtEnd 1 (software-rendered robot - not a phone number)
- nearest thing to a score moment: "NEAR MISS! +NITRO" at 23.5 s (second film only)

## How a draft becomes law
1. The owner records one minute he accepts (tools/record60). 2. The numbers are re-read from THAT minute and replace the draft values. 3. A line he rejects or widens after looking at its frame is edited here with the date.
