#!/usr/bin/env bash
# ONE "check status" readout per pull request (owner Oct 21 5:26 PM, window 1 G-100: "give Muses one check status readout").
# Usage: status-comment.sh <PR number> <RUNNING|RETRYING|PASSED|FAILED> [reason file]
# Keeps a single comment (marker <!-- check-status -->) and rewrites it in place, so a Muse reads ONE place:
#   🤖 Check status: RUNNING / PASSED / FAILED + the reason lines. Needs GH_TOKEN and GITHUB_REPOSITORY.
set -u
PR="$1"; STATE="$2"; FILE="${3:-}"
[ -n "$PR" ] && [ "$PR" != "null" ] || exit 0
case "$STATE" in
  RUNNING) ICON="🟡"; WORDS="RUNNING - the robot is playing the games this pull request touches (about 8-10 min). Wait; do not re-ask to merge yet." ;;
  RETRYING) ICON="🟠"; WORDS="RETRYING - the robot itself hit a setup problem (not your game), so it is re-running the failed part once by itself. Wait about 8-10 min; do not push, do not re-ask to merge." ;;
  PASSED)  ICON="🟢"; WORDS="PASSED - nothing new is broken. Ask to merge (the merge robot merges green pull requests by itself)." ;;
  *)       ICON="🔴"; WORDS="FAILED - fix the lines below and push again (only NEW problems this pull request brings are listed)." ;;
esac
{
  echo "<!-- check-status -->"
  echo "## 🤖 Check status: $ICON $STATE"
  echo
  echo "$WORDS"
  if [ -n "$FILE" ] && [ -s "$FILE" ]; then echo; echo "Reason:"; echo; sed 's/^/- /' "$FILE" | head -40; fi
  echo
  echo "_Updated $(date -u +'%Y-%m-%d %H:%M UTC') · this one comment is rewritten every run - read it instead of check_runs._"
} > /tmp/check-status.md
ID=$(gh api "repos/$GITHUB_REPOSITORY/issues/$PR/comments?per_page=100" -q '[.[]|select(.body|startswith("<!-- check-status -->"))]|first|.id' 2>/dev/null || true)
if [ -n "$ID" ] && [ "$ID" != "null" ]; then
  gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$ID" -F body=@/tmp/check-status.md >/dev/null || true
else
  gh api "repos/$GITHUB_REPOSITORY/issues/$PR/comments" -F body=@/tmp/check-status.md >/dev/null || true
fi
