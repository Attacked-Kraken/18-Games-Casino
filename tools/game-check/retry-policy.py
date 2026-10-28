#!/usr/bin/env python3
"""ONE RETRY RULE for every robot failure (master list #16, Oct 27 2026).
Before this, four robots each had their own retry idea (merge-robot twice, robot-doctor, game-check-retry, known-fault-rerun).
The rule, in one place:
  1. A failure is retried by the robot ONLY when it is not a verdict on the PR: the run was CANCELLED / timed out, or a job died in
     SETUP (not in the game's own 'Play <game>' step). A real test failure is never retried (the Muse gets the exact line).
  2. A run attempt is restarted at most ONCE (marker comment <!-- robot-restart:<sha7>:<run id>:<attempt> -->).
  3. One commit gets at most MAX_PER_SHA (3) restarts in total; after that a human/Claude looks (the Mac speaks at 45 min).
Used by tools/merge-robot.py. Other robots should import this instead of keeping their own counters.
Run `python3 tools/game-check/retry-policy.py --selftest` to check the rule."""
import sys

MAX_PER_SHA = 3


def marker(sha, run_id, attempt):
    return "<!-- robot-restart:%s:%s:%s -->" % (sha[:7], run_id, attempt or 1)


def is_verdict(conclusion, failed_step_name=None):
    """True when the failure is a real verdict (never retried): the job FAILED inside the game's own Play step."""
    if conclusion in ("cancelled", "timed_out"):
        return False
    return bool(failed_step_name) and failed_step_name.startswith("Play ")


def may_restart(comments, sha, run_id, attempt):
    """comments = list of {body} on the PR. Returns (ok, why)."""
    bodies = [(c.get("body") or "") for c in comments or []]
    if any(marker(sha, run_id, attempt) in b for b in bodies):
        return False, "this attempt was already restarted"
    if sum(1 for b in bodies if "<!-- robot-restart:%s:" % sha[:7] in b) >= MAX_PER_SHA:
        return False, "%d restarts of this commit already - left for a human" % MAX_PER_SHA
    return True, "ok"


def _selftest():
    sha = "abcdef1234567"
    assert may_restart([], sha, 1, 1) == (True, "ok")
    assert not may_restart([{"body": marker(sha, 1, 1)}], sha, 1, 1)[0]
    assert may_restart([{"body": marker(sha, 1, 1)}], sha, 1, 2)[0]
    three = [{"body": marker(sha, i, 1)} for i in (1, 2, 3)]
    assert not may_restart(three, sha, 9, 1)[0]
    assert may_restart(three, "ffffffffff", 9, 1)[0]
    assert is_verdict("failure", "Play apexhockey.html")
    assert not is_verdict("failure", "Set up job")
    assert not is_verdict("cancelled", "Play x")
    assert not is_verdict("timed_out", None)
    assert not is_verdict("failure", None)
    print("retry-policy selftest OK")


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        _selftest()
