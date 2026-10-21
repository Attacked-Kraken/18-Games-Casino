# JOB-05: FPS floor, so no PR can make a game slower

**Why:** Hockey, Track & Field, and Racer already run very slowly in testing, and nothing stops a change from making them slower still.

**Files:**
- `drop-in/tools/fps-check/fps.mjs`: measures frames per second for each game, headless at 844x390. It counts frames for 4 s, three times, and keeps the middle number.
- `drop-in/tools/fps-check/fps-baseline.json`: main's numbers, measured here on Oct 21.
- `drop-in/.github/workflows/fps-floor.yml`: on a PR, it measures **main and the PR back to back on the same machine**. It fails if any game the PR touches is more than **15%** slower. If the PR changes shared people, models, or three.js, it checks all 6.

**Main's numbers here** (headless software graphics, so the absolute values are low. Only compare like with like):

| Game | fps |
|---|---|
| Flight | 97 |
| Baseball | 17.9 |
| F1 | 7.8 |
| Hockey | 4.1 |
| Racer | 3.1 |
| Track & Field | 2.8 |

**Tested here:** I ran it on main to make the baseline, then on the JOB-04 patched games. Hockey 4.1 → 4.1, Baseball 17.9 → 21, F1 7.8 → 8.4, Racer 3.1 → 3.1. All PASS, so the per-frame skate measuring in 04a costs nothing you can see.

**Run it:**
```
node tools/fps-check/fps.mjs --update                    # new baseline
node tools/fps-check/fps.mjs apexhockey.html             # compare (exit 1 = more than 15% slower)
FPS_DROP=0.10 node tools/fps-check/fps.mjs ...           # stricter
```
**Done when:** a PR that makes hockey more than 15% slower shows a red "FPS floor" check.
**Next step (not in this job):** set a real floor, for example "Hockey at least 30 fps on the owner's phone". That needs numbers from the phone. JOB-03 makes testing on the phone easy.
