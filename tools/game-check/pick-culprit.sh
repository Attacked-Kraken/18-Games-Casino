#!/bin/bash
# VP Oct 26 2026 (audit P0): which MERGE on main broke the games the check found broken?
# usage: pick-culprit.sh <last-good-sha-or-empty> <broken games, comma list e.g. apexhockey.html,apexracer.html> [fallback-sha]
# Walks main's first-parent commits from HEAD back to <last-good> (newest first), skips AUTO-UNDO / Revert commits, and prints the
# NEWEST commit that touched a broken game (its page, its tests, or a shared 3D/kit file that game's page names). Prints nothing if none did
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
    # its own page always counts. A merge that touched ONLY the game's test file / notes cannot have changed the game (#2067 undid a Flight
    # NO CHANGE PR: jobs file + test) - a red test is the test's fault, handled by the PR ladder, never by an undo.
    if echo "$CH" | grep -qE "^$SL\."; then echo "$C"; exit 0; fi
    # VP Oct 28 2026 (auto-undo false blame: a Racer wheel .glb undid F1 and Baseball): a shared file counts for a game ONLY when
    # that game's page (as of the merge) names the file. Engine files every game loads still count for all.
    if echo "$CH" | grep -qE "^(vendor/|three\.module|look-presets|apex-gfx|audio\.js)"; then echo "$C"; exit 0; fi
    for F in $(echo "$CH" | grep -E "^(characters/|models/|venues/|kit/|sounds/)"); do
      B=$(basename "$F"); B=${B%.*}
      if git show "$C:$G" 2>/dev/null | grep -qF -- "$B"; then echo "$C"; exit 0; fi
    done
  done
done
exit 0
