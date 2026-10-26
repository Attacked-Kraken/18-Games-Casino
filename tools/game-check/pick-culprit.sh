#!/bin/bash
# VP Oct 26 2026 (audit P0): which MERGE on main broke the games the check found broken?
# usage: pick-culprit.sh <last-good-sha-or-empty> <broken games, comma list e.g. apexhockey.html,apexracer.html> [fallback-sha]
# Walks main's first-parent commits from HEAD back to <last-good> (newest first), skips AUTO-UNDO / Revert commits, and prints the
# NEWEST commit that touched a broken game (its page, its tests, or the shared 3D/kit files). Prints nothing if none did
# (an earlier merge did it - nothing is undone). Works the same for a push run and for a run the merge robot dispatched.
P="$1"; GAMES="$2"; FALLBACK="$3"
if [ -n "$P" ] && git merge-base --is-ancestor "$P" HEAD 2>/dev/null; then
  CANDS=$(git rev-list --first-parent "$P"..HEAD | head -30)
else
  CANDS="${FALLBACK:-$(git rev-parse HEAD)}"
fi
for C in $CANDS; do
  case "$(git log -1 --format=%s "$C")" in AUTO-UNDO*|Revert*) continue;; esac
  CH=$(git diff --name-only "$C^1" "$C" 2>/dev/null)
  for G in $(echo "$GAMES" | tr ',' ' '); do
    SL=${G%.html}
    if echo "$CH" | grep -qE "^($SL\.|tools/game-check/fixes/$SL\.|characters/|models/|venues/|kit/|vendor/|three\.module|look-presets|apex-gfx|audio\.js|sports\.html)"; then echo "$C"; exit 0; fi
  done
done
exit 0
