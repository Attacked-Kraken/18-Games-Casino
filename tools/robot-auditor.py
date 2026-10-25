#!/usr/bin/env python3
"""ROBOT AUDITOR (owner Oct 25 2026 6:07-6:13 PM "how can we not wait for a Claude and have an auditor that fixes them itself").
The merge robot never merges a pull request that changes .github/ (a robot that merged its own rules could rewrite them). Those
waited for a Claude (#1777 sat green 39 min). This auditor merges ONLY a short, fixed kind of them, with the owner's
ROBOT_MERGE_TOKEN (fine-grained, this repo only, 90 days), and ONLY when ALL of these hold:
  1. every changed file is on ALLOW (the Sketchfab fetch robot + its helpers, known-faults.json) or is a plain notes file;
  2. at least one changed file is a robot file (.github/ or tools/) - everything else is the merge robot's job;
  3. NEVER touched: this auditor, the merge robot, known-fault-rerun, any workflow not on ALLOW;
  4. the diff adds no secret other than SKETCHFAB_TOKEN / GITHUB_TOKEN, no `permissions:` change, no pull_request_target,
     no mention of ROBOT_MERGE_TOKEN;
  5. from this repo (not a fork), opened by Attacked-Kraken or github-actions[bot], not draft, no hold word / label `no-auto`;
  6. mergeable_state is clean and the robot's `check` PASSED on the newest commit with nothing else red or running.
Every merge: a PR comment 'hand merge by robot auditor, reason', a ::notice, and a line in robot-status/auditor.json (the Mac
turns that into a Team talk line). Also publishes the token's expiry date (read from GitHub's own response header) to the
branch `robot-status` so the Mac and the laptop can warn the owner before it runs out. DRY=1 = look only."""
import json, os, re, subprocess, datetime, sys

REPO = os.environ.get("GITHUB_REPOSITORY", "Attacked-Kraken/18-Games-Casino")
MERGE_TOKEN = os.environ.get("MERGE_TOKEN", "")
DRY = bool(os.environ.get("DRY"))
ALLOW = {".github/workflows/sketchfab-fetch.yml", "tools/sketchfab-fetch.mjs", "tools/glb-clean.mjs", "tools/model-shots.mjs",
         "tools/game-check/known-faults.json"}
NOTES = re.compile(r"^(jobs/[^/]+\.md|UNIVERSAL\.md|LESSONS\.md|NEWS\.md|TOOLS\.md|ASSETS\.md|MODEL-REQUESTS\.md|team/[^/]+\.md|needs/[^/]+\.md)$")
NEVER = re.compile(r"(robot-auditor|merge-robot|known-fault-rerun)")
BAD_ADD = re.compile(r"(\bpermissions\s*:|pull_request_target|ROBOT_MERGE_TOKEN|secrets\.(?!SKETCHFAB_TOKEN\b|GITHUB_TOKEN\b))")
AUTHORS = {"Attacked-Kraken", "github-actions[bot]"}
HOLD = re.compile(r"^\s*\[?\s*(wip|draft|hold)\b|do not merge", re.I)
OK = {"success", "skipped", "neutral"}


def gh(*args, method="GET", token=None, fields=None, headers=False):
    env = dict(os.environ)
    if token:
        env["GH_TOKEN"] = token
    cmd = ["gh", "api"] + (["-i"] if headers else []) + ["-X", method] + list(args)
    for k, v in (fields or {}).items():
        cmd += ["-f", "%s=%s" % (k, v)]
    r = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if headers:
        return r.stdout
    if r.returncode != 0:
        print("gh api failed:", " ".join(args), r.stderr.strip()[:200], r.stdout.strip()[:200])
        return None
    return json.loads(r.stdout) if r.stdout.strip() else {}


def judge(p):
    """-> (ok, why). Pure rules, tested by tools/robot-auditor-test.py."""
    n = p["number"]
    if p.get("draft"):
        return False, "draft"
    if HOLD.search(p.get("title") or "") or any((l.get("name") or "").lower() in ("hold", "no-auto") for l in p.get("labels") or []):
        return False, "hold word or label"
    if (p.get("head") or {}).get("repo", {}).get("full_name") != REPO:
        return False, "from a fork"
    if (p.get("user") or {}).get("login") not in AUTHORS:
        return False, "author %s not allowed" % (p.get("user") or {}).get("login")
    files = p["_files"]
    names = [f["filename"] for f in files]
    if not any(x.startswith((".github/", "tools/")) for x in names):
        return False, "no robot file (the merge robot handles it)"
    for f in files:
        x = f["filename"]
        if NEVER.search(x):
            return False, "%s is never auto-merged" % x
        if x in ALLOW or NOTES.match(x):
            continue
        return False, "%s is not on the allowlist" % x
    for f in files:
        if f["filename"].startswith(".github/") or f["filename"].endswith((".mjs", ".py", ".sh")):
            if not f.get("patch"):
                return False, "no readable diff for %s" % f["filename"]
            for line in f["patch"].split("\n"):
                if line.startswith("+") and not line.startswith("+++") and BAD_ADD.search(line):
                    return False, "diff adds a risky line in %s: %s" % (f["filename"], line[:60].strip())
    if p.get("mergeable_state") != "clean":
        return False, "merge state is %s" % p.get("mergeable_state")
    runs = p["_runs"]
    if not any(r.get("name") == "check" and r.get("conclusion") == "success" for r in runs):
        return False, "robot check has not passed"
    bad = [r["name"] for r in runs if r.get("status") != "completed" or (r.get("conclusion") not in OK)]
    if bad:
        return False, "other checks not done or red: %s" % ", ".join(bad[:3])
    return True, "all files on the allowlist, diff clean, robot check passed, merge state clean"


def expiry():
    """The merge token's own expiry date, from GitHub's response header on any call made with it."""
    if not MERGE_TOKEN:
        return {"ok": False, "why": "ROBOT_MERGE_TOKEN secret is empty or missing"}
    out = gh("/rate_limit", token=MERGE_TOKEN, headers=True)
    head = out.split("\n\n")[0] if out else ""
    if " 401" in head.split("\n")[0] or " 403" in head.split("\n")[0]:
        return {"ok": False, "why": "GitHub refused the token (expired or removed)"}
    m = re.search(r"github-authentication-token-expiration:\s*(.+)", head, re.I)
    if not m:
        return {"ok": True, "expires": None, "why": "token works; GitHub gave no expiry date (no expiry set?)"}
    return {"ok": True, "expires": m.group(1).strip()}


def main():
    status = {"read_at": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "token": expiry(), "merges": [], "held": []}
    try:
        old = json.load(open("robot-status/auditor.json"))
        status["merges"] = old.get("merges", [])[-9:]
    except Exception:
        pass
    prs = gh("repos/%s/pulls?state=open&per_page=60" % REPO) or []
    for pr in prs:
        n = pr["number"]
        full = gh("repos/%s/pulls/%d" % (REPO, n)) or pr
        files = gh("repos/%s/pulls/%d/files?per_page=100" % (REPO, n)) or []
        if not any(f["filename"].startswith((".github/", "tools/")) for f in files):
            continue
        sha = full["head"]["sha"]
        runs = (gh("repos/%s/commits/%s/check-runs?per_page=100" % (REPO, sha)) or {}).get("check_runs", [])
        full["_files"], full["_runs"] = files, runs
        ok, why = judge(full)
        print("#%d %s -> %s: %s" % (n, (full.get("title") or "")[:50], "MERGE" if ok else "leave", why))
        if not ok:
            status["held"].append({"pr": n, "why": why})
            continue
        if DRY or not status["token"].get("ok"):
            status["held"].append({"pr": n, "why": "would merge (dry run or token not working)"})
            continue
        r = gh("repos/%s/pulls/%d/merge" % (REPO, n), method="PUT", token=MERGE_TOKEN,
               fields={"merge_method": "squash", "sha": sha, "commit_title": "%s (#%d)" % (full["title"], n),
                       "commit_message": "hand merge by robot auditor, reason: %s" % why})
        if r and r.get("merged"):
            gh("repos/%s/issues/%d/comments" % (REPO, n), method="POST",
               fields={"body": "hand merge by robot auditor (tools/robot-auditor.py), reason: %s. Files: %s" % (why, ", ".join(f["filename"] for f in files)[:300])})
            print("::notice title=Robot auditor::merged #%d - %s" % (n, why))
            status["merges"].append({"pr": n, "title": (full.get("title") or "")[:80], "at": status["read_at"], "files": [f["filename"] for f in files][:8]})
        else:
            status["held"].append({"pr": n, "why": "merge refused by GitHub"})
    os.makedirs("robot-status", exist_ok=True)
    json.dump(status, open("robot-status/auditor.json", "w"), indent=1)
    print(json.dumps(status["token"]))


if __name__ == "__main__" and "--test" not in sys.argv:
    main()
