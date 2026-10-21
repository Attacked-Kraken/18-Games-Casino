# Apex help pack: 5 jobs for the 6 sports games

From the owner's review helper. The 6 games we're finishing first: Baseball, Hockey, Flight, Track & Field, F1, Exotic Racer.
Everything here was built and tested against main at **96a092a** (Oct 21, ~12:25 AM CT). **Nothing was pushed to the repo.**

## What's inside
- `JOB-01` to `JOB-05` `.md`: one page each, in plain words. They cover what it does, which files, how it was tested, and when it's done.
- `drop-in/`: new files, laid out at their **real repo paths**. Copy `drop-in/*` into the repo root.
- `patches/`: changes to existing game files, as `git apply` patches.
- `proof/`: before and after pictures from the tests.

## Order to apply (one PR each is easiest for the merge robot)
1. **JOB-04 patches** (`patches/04a` to `04d`): the owner's bugs plus the REALITY hook. Hockey first.
   `git apply patches/04a-hockey-*.patch` (then 04b, 04c, 04d as separate PRs).
   Watch out: **04d (racer)** turns a hidden problem into a visible FAIL. 2 of the 4 tyres float about 5 cm, so a builder needs to level the car in the same PR.
2. **JOB-02 complaints list**: copy `COMPLAINTS.md`, `tools/complaints/`, `proof/complaints/`, and `.github/workflows/complaints-check.yml`.
   From now on, every owner complaint goes in this list and is closed only with a picture or clip.
3. **JOB-01 visual play-tester**: copy `tools/visual-check/` and `.github/workflows/visual-check.yml`.
   The first run on main makes the baseline. After that, PRs get compared against it.
4. **JOB-05 FPS floor**: copy `tools/fps-check/` and `.github/workflows/fps-floor.yml`.
5. **JOB-03 phone install**: copy `apex-sports.html`, `sports.webmanifest`, `sw.js`, `icons/apex-sports-*.png`, and `tools/phone-install/`.
   Then run `python3 tools/phone-install/add-head.py`, or `git apply patches/03-phone-install-heads.patch`.

## How to check each one is really done
| Job | Proof it works |
|---|---|
| 04 | `git apply --check` passes. On game-check, Hockey, F1, and Baseball show no "No REALITY hook" line and no REALITY FAIL. The visual robot's hockey `closeup.png` shows steel blades on the ice. |
| 02 | `node tools/complaints/check.mjs` → PASS. Marking any complaint `closed` without a proof file turns the PR red. |
| 01 | "Visual play-test" runs on PRs and uploads `visual-play-test` pictures. Re-sinking the skates turns it red. |
| 05 | "FPS floor" runs on PRs. A slower game shows FAIL with the % in the job summary. |
| 03 | `verify_done.py <repo> --headless` G4 (service worker + offline reload) shows DONE. The owner's phone opens Apex Sports from the home screen in airplane mode. |

## What I tested (headless Chrome, swiftshader)
- **Patches:** every patch passes `git apply --check` on main, alone and all together, with 03 before or after 04.
- **Console errors:** hockey, baseball, F1, and racer load and play with none.
- **REALITY robot** (`tools/game-check/reality.mjs`) on the patched games:
  - Hockey PASS
  - F1 PASS
  - Baseball no fail (one "didn't move" check, because a batter doesn't run)
  - Racer: tyres float about 5 cm (a real finding)
- **Hockey:**
  - Blades measured at 0.000 to 0.004 units every frame (before: sunk about 9 cm).
  - Camera never below 1.5 m in any view.
- **Visual robot:** catches a deliberate 12 cm skate sink.
- **Complaints checker:** blocks closing without proof and blocks deleting a complaint.
- **Offline:** the launcher, hockey, and F1 reload with no network.
- **FPS:** no game got slower with the patches.

## Not done, or for a builder
- C-004, the 8 ft baseball players: still with PR #805/#831. The new hook will measure them.
- C-008, the Flight off-screen buttons: no patch in this pack. It's open in COMPLAINTS.md.
- The Racer tyre float that the new hook found (see JOB-04).
- SAVED! once: fixed in code (one save per shot, 1.2 s cooldown). In my 20 s headless test it showed once, but saves are random, so the visual robot clip is the final proof.
