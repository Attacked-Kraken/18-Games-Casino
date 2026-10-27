#!/usr/bin/env python3
"""Start the PR game check for a branch ONLY if GitHub has not already started one for that commit.
Oct 27 2026 (04 + VP): every robot that updated a PR branch (merge-robot x4, known-fault-rerun, game-check-retry) also dispatched
game-check-pr.yml by hand, while GitHub had already started the pull_request check. Both share the concurrency group
game-check-pr-<branch> (cancel-in-progress), so one cancelled the other EVERY time and the cancelled run wrote a false FAILED
comment (build/owner-turbine-apexracer: pairs at 09:11, 12:15, 13:07, 13:16, 15:20Z). ONE helper for every robot.

Usage: start-check.py <branch> [wait_seconds=25]
  - looks at the branch's newest commit; a 'Game check (PR)' run on it that is queued / in progress / waiting for approval, or
    finished (not cancelled) in the last 3 min, counts as 'already started' -> nothing is dispatched;
  - waits up to wait_seconds (polling every 5 s) for GitHub's own run to appear before dispatching;
  - a cancelled run does NOT count (the check must be started again).
Exit 0 = a check exists or was started; 1 = could not start. Prints one ::notice line either way."""
import datetime, json, subprocess, sys, time

REPO_ENV = None

def gh(*a):
    r = subprocess.run(["gh", "api"] + list(a), capture_output=True, text=True)
    return (json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else None), (r.stderr or "")[:160]

def repo():
    import os
    return os.environ.get("GITHUB_REPOSITORY") or "Attacked-Kraken/18-Games-Casino"

def parse(t):
    return datetime.datetime.fromisoformat(t.replace("Z", "+00:00"))

def existing_run(sha, now=None):
    now = now or datetime.datetime.now(datetime.timezone.utc)
    d, _ = gh("repos/%s/actions/runs?head_sha=%s&per_page=30" % (repo(), sha))
    for r in (d or {}).get("workflow_runs", []):
        if r.get("name") != "Game check (PR)":
            continue
        st, cc = r.get("status"), r.get("conclusion")
        if st in ("queued", "in_progress", "waiting", "pending", "requested") or cc == "action_required":
            return r
        if st == "completed" and cc != "cancelled" and (now - parse(r["created_at"])).total_seconds() < 180:
            return r
    return None

def start_check(branch, wait=25):
    b, err = gh("repos/%s/branches/%s" % (repo(), branch))
    sha = ((b or {}).get("commit") or {}).get("sha")
    if not sha:
        print("::warning::start-check: could not read branch %s (%s)" % (branch, err)); return False
    t0 = time.time()
    while True:
        r = existing_run(sha)
        if r:
            print("::notice::start-check: %s already has a check on %s (run %s, %s) - not starting another" % (branch, sha[:7], r["id"], r.get("event"))); return True
        if time.time() - t0 >= wait:
            break
        time.sleep(5)
    rc = subprocess.run(["gh", "api", "-X", "POST", "repos/%s/actions/workflows/game-check-pr.yml/dispatches" % repo(), "-f", "ref=" + branch],
                        capture_output=True, text=True)
    if rc.returncode != 0:
        print("::warning::start-check: dispatch on %s failed %s" % (branch, (rc.stderr or "")[:120])); return False
    print("::notice::start-check: no check on %s for %s after %ds - started one" % (branch, sha[:7], wait)); return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: start-check.py <branch> [wait_seconds]")
    sys.exit(0 if start_check(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 25) else 1)
