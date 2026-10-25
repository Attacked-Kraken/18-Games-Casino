#!/usr/bin/env python3
"""Owner Oct 24 2026 9:12 PM: a builder must not re-create a script error by hand (window 6 lost an hour on #1614).
check.mjs saves <game>/evidence/<slug>/{error.json,before.jpg,at.jpg,after.jpg} on the first script error. This step (check job, PR runs):
 1. pushes them to the `pr-evidence` branch as pr-<N>/<slug>/..., 2. writes game-check-out/evidence.md = stack lines, the last console
 lines, picture links, and 3 lines of game code around the failing line (read from this checkout = the PR's code),
 which status-comment.sh appends to the ONE Check status comment. Usage: pr-evidence.py <PR number> <parts dir> [out dir]"""
import json, os, subprocess, sys, glob, shutil, tempfile
pr, parts = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else "game-check-out"
repo = os.environ.get("GITHUB_REPOSITORY", "")
items = sorted(glob.glob(os.path.join(parts, "*", "evidence", "*", "error.json")) + glob.glob(os.path.join(parts, "evidence", "*", "error.json")))
if not items or not pr or pr == "null":
    sys.exit(0)
os.makedirs(out, exist_ok=True)
tmp = tempfile.mkdtemp()
tok = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN", "")
url = "https://x-access-token:%s@github.com/%s.git" % (tok, repo)
def git(*a, check=True):
    return subprocess.run(["git", "-C", tmp] + list(a), capture_output=True, text=True, check=check)
subprocess.run(["git", "clone", "-q", "--depth", "1", "--branch", "pr-evidence", url, tmp], capture_output=True)
if not os.path.isdir(os.path.join(tmp, ".git")):
    subprocess.run(["git", "init", "-q", tmp]); git("checkout", "-q", "-b", "pr-evidence"); git("remote", "add", "origin", url)
git("config", "user.name", "game-check robot"); git("config", "user.email", "robot@users.noreply.github.com")
dest_pr = os.path.join(tmp, "pr-" + pr)
shutil.rmtree(dest_pr, ignore_errors=True)
lines = []
for ej in items:
    d = os.path.dirname(ej); slug = os.path.basename(d)
    info = json.load(open(ej))
    dd = os.path.join(dest_pr, slug); os.makedirs(dd, exist_ok=True)
    for f in os.listdir(d):
        shutil.copy(os.path.join(d, f), os.path.join(dd, f))
    raw = "https://raw.githubusercontent.com/%s/pr-evidence/pr-%s/%s/" % (repo, pr, slug)
    lines.append("**Evidence for the script error in %s** (the robot saved it so you do not have to re-create it):" % info.get("game", slug))
    lines.append("- error: `%s`" % info.get("message", ""))
    if info.get("file"):
        lines.append("- where: `%s` line %s%s" % (info["file"], info.get("line"), (" col %s" % info["col"]) if info.get("col") else ""))
    lines.append("- stack:")
    for x in (info.get("stack") or [])[:8]:
        lines.append("    " + x.strip())
    f, n = info.get("file") or "", int(info.get("line") or 0)
    path = f.split("?")[0].lstrip("/")
    if path and n and os.path.isfile(path):
        src = open(path, encoding="utf-8", errors="replace").read().split("\n")
        lines.append("- game code around line %d (this PR's code):" % n)
        for i in range(max(1, n - 1), min(len(src), n + 1) + 1):
            lines.append("    %d%s %s" % (i, ">" if i == n else " ", src[i - 1][:200]))
    ct = info.get("console") or []
    if ct:
        lines.append("- last console lines:")
        for x in ct[-20:]:
            lines.append("    " + x[:200])
    pics = info.get("pics") or {}
    lines.append("- pictures: " + " · ".join("[%s](%s%s)" % (k, raw, v) for k, v in pics.items()) if pics else "- pictures: none could be taken")
    lines.append("- all files: https://github.com/%s/tree/pr-evidence/pr-%s/%s" % (repo, pr, slug))
git("add", "-A")
if git("status", "--porcelain").stdout.strip():
    git("commit", "-q", "-m", "evidence for PR #%s" % pr)
    for _ in range(3):
        if git("push", "-q", "origin", "HEAD:pr-evidence", check=False).returncode == 0:
            break
        git("pull", "-q", "--rebase", "origin", "pr-evidence", check=False)
open(os.path.join(out, "evidence.md"), "w").write("\n".join(lines) + "\n")
print("evidence for PR #%s: %d game(s)" % (pr, len(items)))
