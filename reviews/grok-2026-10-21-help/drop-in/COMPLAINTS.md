# COMPLAINTS.md - the owner's list (JOB-02)

Every problem the owner sees gets ONE entry here. Builders and testers read it before every job.
A complaint is only **closed** when a picture or clip in the repo PROVES it is fixed. The robot
(`tools/complaints/check.mjs`, workflow "Complaints check") turns the PR red if:
- a complaint is marked `closed` with no `proof:` file, or the proof file is missing / empty / not a picture or clip
- a complaint is deleted (never delete - close it with proof instead)
- the status is not one of: `open`, `fixing`, `needs-proof`, `closed`

Status words:
- `open` - seen by the owner, nobody is on it yet
- `fixing` - a builder has the job (put the job / PR number in `fix:`)
- `needs-proof` - code is merged, but nobody has shown it working yet
- `closed` - proof file added (screenshot `.png/.jpg/.webp` or clip `.mp4/.webm/.gif`) and the owner can see it

Put proof files in `proof/complaints/` named `C-0xx-short-name.png`. The visual robot (JOB-01) writes
`visual-out/<game>/closeup.png` and `clip.mp4` - copy the one that shows the fix.

Format (copy this):
```
## C-0xx Short title in the owner's words
- game: apexhockey.html
- status: open
- reported: 2026-10-21 (how: video / screenshot / chat)
- what: what the owner saw
- done when: what a person must SEE for it to count as fixed
- fix: G-xx / PR #nnn
- proof: proof/complaints/C-0xx-name.png
```

---

## C-001 Hockey skates sink into the ice and no blades show
- game: apexhockey.html
- status: fixing
- reported: 2026-10-21 (owner video, after #815 merged)
- what: every player's boots sink into the ice like ankle-deep snow; no steel blades visible
- done when: close-up shows the steel blade on top of the ice, boots above it, for skaters and goalies, while skating
- fix: #815 did not fix it; JOB-04 patch 04a (measured blade snap + taller visible blades)
- proof:

## C-002 Hockey camera rewinds after a save and SAVED! shows twice
- game: apexhockey.html
- status: fixing
- reported: 2026-10-21 (owner video)
- what: after a save the camera swings back to the old play and the SAVED! banner shows a second time
- done when: clip of a save shows ONE SAVED! banner and the camera never sweeps back across the rink
- fix: JOB-04 patch 04a (one save per shot, camera cuts instead of sweeping)
- proof:

## C-003 Hockey camera falls through the ice when it zooms in
- game: apexhockey.html
- status: fixing
- reported: 2026-10-21 (owner video)
- what: camera drops under the rink and looks up from below the ice
- done when: visual robot "camera lowest" is at least 1.5 m in every view (BROADCAST/HIGH/CLOSE/PLAYER/END)
- fix: JOB-04 patch 04a (camera never below 1.5 m)
- proof:

## C-004 Baseball players are 8 ft tall
- game: apexbaseball.html
- status: fixing
- reported: 2026-10-20 (robot blocked #805: players 2.64 m)
- what: the new players in #805 came out 2.64 m (8 ft 8 in) and the same change deleted hockey hair files
- done when: REALITY robot measures players 1.75-1.95 m, hockey hair files still present, screenshot of batter next to catcher
- fix: PR #805 / #831
- proof:

## C-005 Baseball stick (aim pad) stays stuck after you let go
- game: apexbaseball.html
- status: fixing
- reported: 2026-10-20 (owner)
- what: the aim pad keeps following / stays held after lifting the finger or switching apps
- done when: play test lifts the finger mid-drag and switches apps; aim stops moving
- fix: JOB-04 patch 04b
- proof:

## C-006 Exotic Racer cars invisible or blobs
- game: apexracer.html
- status: needs-proof
- reported: 2026-10-20 (owner)
- what: cars go invisible when a model fails to load; others look like paint blobs
- done when: screenshot of the starting grid with all 8 cars as real models, plus one with a model blocked (fallback car shows)
- fix: PR #819 merged 2026-10-20 11:13 PM CT
- proof:

## C-007 F1 start lights disappear on a quick restart
- game: apexf1.html
- status: fixing
- reported: 2026-10-20 (owner)
- what: restart quickly and the new start lights vanish (old 600 ms hide timer still running)
- done when: clip: start, restart within 1 s, all 5 lights come on and go out normally
- fix: JOB-04 patch 04c
- proof:

## C-008 Flight buttons off the screen and overlapping
- game: apexflight.html
- status: open
- reported: 2026-10-20 (audit at 844x390 landscape)
- what: three buttons sit off-screen and a few overlap on an iPhone in landscape
- done when: screenshot at 844x390 and 390x844 with every button fully on screen and none overlapping (audit.py no_offscreen / no_overlap PASS)
- fix:
- proof:

## C-009 Track & Field results show twice
- game: apextrackfield.html
- status: needs-proof
- reported: 2026-10-20 (owner)
- what: the results screen appears twice, then the menu
- done when: clip of one finished race: ONE results screen, ONE menu button
- fix: PR #812 merged 2026-10-20
- proof:
