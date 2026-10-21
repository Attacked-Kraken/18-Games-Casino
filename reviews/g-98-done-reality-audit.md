# G-98 audit — Ice Hockey vs DONE.md + REALITY.md (2026-10-21, window 2 / Muse Dash)

Played the game (local robot: tools/game-check/check.mjs, ONLY=apexhockey.html) and checked it
against DONE.md and REALITY.md line by line, plus the robot's latest main run
(Oct 21, 2026, 1:23 PM CDT, sha cd03c32). Discrepancies found:

## Open discrepancies

1. **play-goalie-blades-on-ice FAILS on the robot's main run** — "the goalie blades sank 4 cm
   under the ice in the butterfly". Cause: the rig is now pinned by the real skinned blade
   vertices (G-86 snapSkatesToIce, the owner's patch), and the goalie test's foot-bone ruler
   disagrees with the blade edge by ~0.1 units when the butterfly squash (athWrap scale 0.82)
   deforms the skinned blade against the bone. The blade EDGE itself measures 0.00 and the
   REALITY audit reads 12/12 contact gaps ~0. Locally the same test passes (6.9-16.2 s).
   Already disclosed in PR #867 and jobs/G-86.md. Not a G-98 scope item (stick job) - listed
   here so it is on the record in one place.

2. **play-icing-called FAILED on the robot's latest main run** ("an untouched clear from the
   defensive half past the far goal line never...") after passing on PR #856 and locally
   (G-86/G-94 runs). It is flow-dependent: since G-78 the AI itself clears the puck up the
   boards, which changes the staged sequences this test drives. Needs a look under its own
   job; treat as flaky-until-proven - it is the only red play test besides #1.

3. **play-skates-touch-ice is borderline by the same ruler conflict as #1** — it read OK on
   the robot's latest main run and 3-4 cm "sunk" in some local runs at stride extremes
   (skinned blade deforms ~0.1 u against the foot bone mid-stride while the edge sits at 0).

## Verified clean (no discrepancy)

- REALITY.md hook + rules: window.__reality present (G-86); robot reality data on main:
  kind skater, height 6.49 in [5.05, 7.17], 9 moves, 0 wrong-way, 12 contact gaps, no
  REALITY FAIL, no 'No REALITY hook' line. Local reality.mjs run: FAIL [] / CHECK [].
- DONE.md §2 stick: resets on touchend/touchcancel AND on blur, pagehide, pointercancel and
  visibilitychange (G-86) — now PROVEN by the new play test play-stick-resets-on-blur
  (this job): hold at +40 px → blur → knob 0 px; hide mid-hold → knob 0 px. The same test
  fails on the pre-G-86 build with the tester's exact symptom.
- DONE.md §9 / STORE-READY: pixel ratio capped at 1.5 on every device (G-94); shadows and
  antialias off on touch; no post-processing; draw calls 145-179 per match frame (< 300);
  page icon declared — zero failed requests and zero console errors across menu, hub,
  credits, friend screen, match and a goal (G-94).
- DONE.md §8 opponents obey the same rules: AI defense shipped in G-78 (gap control,
  poke-check, shot blocks, clears, both teams) with play-defender-takes-puck green on the
  robot's latest main run.
- Career + friend + rules tests: all green on the robot's latest main run (career weeks 1-4,
  5-7, 8-10, semifinal, final; play-friend-code; offside; goal-restarts-centre; 5v5).
  Locally the career tests exceed the 30 s cap on this VM (known ~2x slowdown since G-52);
  the robot runs them in time.

## Local quick-check (this job, before the PR)

Run 2026-10-21 (this VM, tools/game-check/check.mjs ONLY=apexhockey.html, the quick-check.sh
recipe): status CHECK, **fail: [] - zero red FAIL lines for Ice Hockey**, and the new
play-stick-resets-on-blur passes inside the full run. Also green locally this run:
play-icing-called, play-goalie-blades-on-ice, play-skates-touch-ice (the three borderline
items above all passed here - they are intermittent, not constant). Local-only failures, all
passing on the robot's main run and in isolated local runs: play-goal-restarts-centre and
play-faceoff-at-centre (shared-page staging is timing-sensitive at this VM's ~2x slowdown -
the faceoff probe found the puck already at (-13.2, -1.5), i.e. play had moved on) and
play-career-weeks-1-4 / play-career-weeks-8-10 (30 s cap on this VM; weeks 5-7, the
semifinal and the final passed even here). The local snapshot's reality/layout sections
returned null; the REALITY verdict above comes from the robot's main run and from direct
local runs of the robot's own reality.mjs (FAIL [] / CHECK []).
