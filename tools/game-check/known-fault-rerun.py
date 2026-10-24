#!/usr/bin/env python3
"""Owner Oct 23 2026 8:58 PM "a check that already failed must re-run by itself when a known fault is added afterwards".
Open PR whose one Check status comment says FAILED, every Reason line matched by a LIVE entry of tools/game-check/known-faults.json
on main, and the comment older than the latest commit to that file  ->  merge main into the PR branch and start a fresh check
(the robot, never a hand push). Once the fresh check rewrites the comment it is newer than the faults file, so it cannot loop.
Needs GH_TOKEN + GITHUB_REPOSITORY. DRY_RUN=1 only prints. Optional ONLY_PR=<n>."""
import json, os, re, subprocess, sys, datetime
REPO = os.environ["GITHUB_REPOSITORY"]; DRY = os.environ.get("DRY_RUN") == "1"; ONLY = os.environ.get("ONLY_PR", "")
def gh(*a, inp=None):
    r = subprocess.run(["gh", "api", *a], capture_output=True, text=True, input=inp)
    return r.returncode, r.stdout, r.stderr
def j(*a):
    rc, out, err = gh(*a)
    return json.loads(out) if rc == 0 and out.strip() else None
def parse(t): return datetime.datetime.strptime(t, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)
today = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
rc, out, _ = gh(f"repos/{REPO}/contents/tools/game-check/known-faults.json?ref=main", "-H", "Accept: application/vnd.github.raw")
faults = [f for f in json.loads(out).get("faults", []) if not f.get("until") or f["until"] >= today]
cm = j(f"repos/{REPO}/commits?path=tools/game-check/known-faults.json&sha=main&per_page=1")
faults_at = parse(cm[0]["commit"]["committer"]["date"])
print(f"{len(faults)} live faults; file last changed {faults_at.isoformat()}")
def matches(line):
    for f in faults:
        if f.get("game") and f["game"] not in line: continue
        try:
            if re.search(f["match"], line, re.I): return True
        except re.error: pass
    return False
n = 0
for pr in j(f"repos/{REPO}/pulls?state=open&per_page=100") or []:
    num = pr["number"]
    if ONLY and str(num) != ONLY: continue
    if pr["head"]["repo"]["full_name"] != REPO: continue
    cs = [c for c in (j(f"repos/{REPO}/issues/{num}/comments?per_page=100") or []) if c["body"].startswith("<!-- check-status -->")]
    if not cs: continue
    c = cs[0]; body = c["body"]
    if "Check status: 🔴 FAILED" not in body: continue
    reasons = [l[2:].strip() for l in body.split("Reason:", 1)[-1].splitlines() if l.startswith("- ")]
    if not reasons: continue
    upd = parse(c["updated_at"])
    ok = all(matches(r) for r in reasons)
    print(f"#{num}: FAILED, {len(reasons)} reason line(s), all known faults: {ok}, comment {upd.isoformat()} vs faults {faults_at.isoformat()}")
    if not ok or upd >= faults_at: continue
    n += 1
    if DRY: print(f"  DRY RUN: would merge main into {pr['head']['ref']} and start a fresh check"); continue
    why = "/tmp/why.txt"; open(why, "w").write("A known robot fault was added on main after this check ran, and every red line here is that fault. The robot merged main into your branch and is checking it again - do not push, do not re-ask to merge.\n")
    subprocess.run(["bash", "tools/game-check/status-comment.sh", str(num), "RETRYING", why])
    gh("-X", "PUT", f"repos/{REPO}/pulls/{num}/update-branch")
    import time; time.sleep(20)
    rc, _, err = gh("-X", "POST", f"repos/{REPO}/actions/workflows/game-check-pr.yml/dispatches", "-f", f"ref={pr['head']['ref']}")
    print(f"  ROBOT RE-RUN of #{num} ({pr['head']['ref']}): dispatch rc={rc} {err[:100]}")
print(f"done: {n} PR(s) {'would be ' if DRY else ''}re-run")
