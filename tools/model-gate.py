#!/usr/bin/env python3
"""Model gate robot (owner, 2026-10-16): hands-off. When the owner gives a model a thumbs up, its MODELS.md status
becomes LOCKED. This robot then merges every open pull request that was waiting for that model and re-runs the
game check, so the owner gets new pictures without anyone pressing anything.

A pull request waits for models by having a line in its description:   waits-model: hockey-skater
(several lines, or several ids on one line, are fine). It is merged only when EVERY model it waits for is LOCKED.
A model given a thumbs down (or NO) leaves its pull requests waiting - the Muse fixes the model first.
Runs in GitHub Actions (.github/workflows/model-gate.yml). Uses only the GitHub REST API through `gh api`."""
import json, os, re, subprocess, sys

REPO = os.environ.get("GITHUB_REPOSITORY", "Attacked-Kraken/18-Games-Casino")


def gh(*args, data=None):
    cmd = ["gh", "api"] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True, input=data)
    if r.returncode != 0:
        print("gh api failed:", " ".join(args), r.stderr.strip()[:300])
        return None
    return json.loads(r.stdout) if r.stdout.strip() else {}


def models():
    out, cur, fence = {}, None, False
    for line in open("MODELS.md", encoding="utf-8").read().splitlines():
        if line.strip().startswith("```"):
            fence = not fence; cur = None; continue
        if fence:
            continue
        h = re.match(r"^##\s*MODEL\s*:\s*(.+)$", line.strip(), re.I)
        if h:
            cur = {"name": h.group(1).strip()}; continue
        if line.startswith("## "):
            cur = None; continue
        kv = re.match(r"^\s*[-*]\s*([A-Za-z][A-Za-z ]{0,24}):\s*(.*)$", line)
        if cur is not None and kv:
            cur[kv.group(1).strip().lower()] = kv.group(2).strip()
            if kv.group(1).strip().lower() == "id":
                out[kv.group(2).strip()] = cur
    return out


def main():
    M = models()
    locked = {i for i, m in M.items() if re.match(r"^LOCKED", m.get("status", ""), re.I)}
    print("LOCKED models:", ", ".join(sorted(locked)) or "none")
    prs = gh(f"repos/{REPO}/pulls?state=open&per_page=100") or []
    merged = 0
    for pr in prs:
        body = pr.get("body") or ""
        want = set()
        for m in re.finditer(r"waits-model:\s*([a-z0-9 ,\-]+)", body, re.I):
            want |= {w.strip().lower() for w in re.split(r"[ ,]+", m.group(1)) if w.strip()}
        if not want:
            continue
        missing = sorted(w for w in want if w not in locked)
        if missing:
            print(f"PR #{pr['number']} still waits for: {', '.join(missing)}")
            continue
        full = gh(f"repos/{REPO}/pulls/{pr['number']}") or {}
        if full.get("mergeable") is False:
            gh(f"repos/{REPO}/issues/{pr['number']}/comments", "-f",
               "body=🔒➡️✅ The owner approved the model(s) this waits for, but this pull request no longer merges cleanly. "
               "Update the branch from main (git pull --rebase origin main), fix the conflicts, push, and the model gate robot will merge it.")
            print(f"PR #{pr['number']}: conflicts - asked the author to update")
            continue
        r = gh("-X", "PUT", f"repos/{REPO}/pulls/{pr['number']}/merge", "-f", "merge_method=merge",
               "-f", f"commit_title=Model gate: owner approved {', '.join(sorted(want))} - merge #{pr['number']}")
        if r and r.get("merged"):
            merged += 1
            print(f"PR #{pr['number']} merged (owner approved {', '.join(sorted(want))})")
            gh(f"repos/{REPO}/issues/{pr['number']}/comments", "-f",
               "body=✅ Merged by the model gate robot: the owner gave 👍 to " + ", ".join(sorted(want)) + ". The game check runs next; say \"merged, NOT yet seen\" until he has looked.")
    if merged:
        # merges made with the robot's token don't start other workflows by themselves - start the game check by hand
        gh("-X", "POST", f"repos/{REPO}/actions/workflows/game-check.yml/dispatches", "-f", "ref=main")
        print("Game check started.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
