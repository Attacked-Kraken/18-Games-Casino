#!/usr/bin/env python3
"""Merge robot (owner, 2026-10-19 8:34 PM "yes fix" - a finished, green G-01 fix sat unmerged for an hour because the
laptop didn't press a stacked approval card). Every few minutes, on GitHub (no screen, no laptop needed), it merges each
open pull request that is:
  - fresh (opened in the last 12 hours - old J-job pull requests from before the fresh start are never touched),
  - not a draft, no "hold"/"wip"/"draft" in the title or a "hold" label,
  - free of conflicts,
  - GREEN: the robot's "check" ran on its newest commit and passed, and no other check failed or is still running,
  - not changing the robots themselves (.github/) - those wait for the owner / Claude.
After merging it starts the Game check on main once (merges made by this robot don't start it by themselves).
If the Muse later asks to merge it too, its card just finds it already merged - harmless."""
import json, os, subprocess, datetime

REPO = os.environ.get("GITHUB_REPOSITORY", "Attacked-Kraken/18-Games-Casino")
MAX_AGE_H = 12
OK = {"success", "skipped", "neutral"}
# merges made with the robot's own key don't start the "on push to main" robots - start the ones a merge needs by hand
FOLLOW = [("sound-robot.yml", ("sounds/recipes/", "sounds/rejects/", "tools/sound-robot.mjs", "tools/sound-themes.mjs", "beatmachine.html")),
          ("announcer-robot.yml", ("sounds/announcer/", "sounds/rejects/voice-", "tools/announcer-robot.py")),
          ("model-gate.yml", ("MODELS.md",)),
          ("sketchfab-fetch.yml", ("MODEL-REQUESTS.md", "MODEL-SEARCH.md", "models/picks/")),
          ("patch-robot.yml", ("patches/", "bigfiles/", "pieces/request-"))]


def gh(*args, method="GET", fields=None):
    cmd = ["gh", "api", "-X", method] + list(args)
    for k, v in (fields or {}).items():
        cmd += ["-f", "%s=%s" % (k, v)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("gh api failed:", " ".join(args), r.stderr.strip()[:200])
        return None
    return json.loads(r.stdout) if r.stdout.strip() else {}


def main():
    now = datetime.datetime.now(datetime.timezone.utc)
    merged, follow = [], set()
    for pr in gh("repos/%s/pulls?state=open&per_page=50" % REPO) or []:
        n, title = pr["number"], pr.get("title", "")
        made = datetime.datetime.strptime(pr["created_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)
        if (now - made).total_seconds() > MAX_AGE_H * 3600:
            continue
        low = title.lower()
        if pr.get("draft") or any(w in low for w in ("hold", "wip", "draft", "do not merge")) or \
                any(l.get("name", "").lower() == "hold" for l in pr.get("labels", [])):
            print("#%d skipped: draft/hold" % n); continue
        if pr["head"]["repo"] is None or pr["head"]["repo"]["full_name"] != REPO:
            print("#%d skipped: from another repo" % n); continue
        files = gh("repos/%s/pulls/%d/files?per_page=100" % (REPO, n)) or []
        if any(f["filename"].startswith(".github/") for f in files):
            print("#%d skipped: changes the robots (.github/) - owner/Claude merges those" % n); continue
        full = gh("repos/%s/pulls/%d" % (REPO, n)) or {}
        if full.get("mergeable") is not True:
            print("#%d skipped: not mergeable yet (%s)" % (n, full.get("mergeable_state"))); continue
        runs = (gh("repos/%s/commits/%s/check-runs?per_page=50" % (REPO, pr["head"]["sha"])) or {}).get("check_runs", [])
        newest = {}
        for r in runs:                       # a re-run leaves the old run behind: only the newest of each check counts
            k = r.get("name", "")
            if k not in newest or (r.get("started_at") or "") > (newest[k].get("started_at") or ""):
                newest[k] = r
        if "check" not in newest:
            print("#%d skipped: the robot's game check hasn't run yet" % n); continue
        busy = [k for k, r in newest.items() if r.get("status") != "completed"]
        bad = [k for k, r in newest.items() if r.get("status") == "completed" and r.get("conclusion") not in OK]
        if busy or bad:
            print("#%d skipped: checks %s" % (n, ("running: " + ", ".join(busy)) if busy else ("FAILED: " + ", ".join(bad)))); continue
        res = gh("repos/%s/pulls/%d/merge" % (REPO, n), method="PUT",
                 fields={"merge_method": "squash", "commit_title": "%s (#%d) - merged by the merge robot (green)" % (title, n)})
        if res and res.get("merged"):
            merged.append(n)
            for wf, starts in FOLLOW:
                if any(f["filename"].startswith(starts) for f in files):
                    follow.add(wf)
            print("::notice title=Merge robot::merged #%d %s" % (n, title))
    if merged:
        gh("repos/%s/actions/workflows/game-check.yml/dispatches" % REPO, method="POST", fields={"ref": "main"})
        print("started the Game check on main")
        for wf in sorted(follow):
            gh("repos/%s/actions/workflows/%s/dispatches" % (REPO, wf), method="POST", fields={"ref": "main"})
            print("started %s for what the merge changed" % wf)
    else:
        print("nothing green to merge")


if __name__ == "__main__":
    main()
