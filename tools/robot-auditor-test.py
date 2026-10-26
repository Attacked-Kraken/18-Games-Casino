#!/usr/bin/env python3
"""Drill for the auditor's rules (no GitHub): every case says what it must do. exit 0 = all good."""
import importlib.util, os, sys
sys.argv.append("--test")
spec = importlib.util.spec_from_file_location("ra", os.path.join(os.path.dirname(__file__), "robot-auditor.py"))
ra = importlib.util.module_from_spec(spec); spec.loader.exec_module(ra)
ra.REPO = "o/r"
GREEN = [{"name": "check", "status": "completed", "conclusion": "success"}]
def pr(files, **kw):
    p = {"number": 1, "title": "Sketchfab robot: pictures", "draft": False, "labels": [], "head": {"repo": {"full_name": "o/r"}},
         "user": {"login": "Attacked-Kraken"}, "mergeable_state": "clean", "_runs": GREEN,
         "_files": [{"filename": f, "patch": "+echo hi"} if isinstance(f, str) else f for f in files]}
    p.update(kw); return p
cases = [
 ("allowed fetch robot file", pr([".github/workflows/sketchfab-fetch.yml"]), True),
 ("allowed + notes", pr(["tools/glb-clean.mjs", "jobs/G-1.md"]), True),
 ("game file mixed in", pr([".github/workflows/sketchfab-fetch.yml", "apexhockey.html"]), False),
 ("other workflow", pr([".github/workflows/game-check.yml"]), False),
 ("merge robot itself", pr(["tools/merge-robot.py"]), False),
 ("the auditor itself", pr(["tools/robot-auditor.py"]), False),
 ("no robot file at all", pr(["jobs/G-1.md"]), False),
 ("adds permissions", pr([{"filename": ".github/workflows/sketchfab-fetch.yml", "patch": "+permissions: write-all"}]), False),
 ("adds a new secret", pr([{"filename": ".github/workflows/sketchfab-fetch.yml", "patch": "+  X: ${{ secrets.OTHER }}"}]), False),
 ("uses merge token", pr([{"filename": ".github/workflows/sketchfab-fetch.yml", "patch": "+  X: ${{ secrets.ROBOT_MERGE_TOKEN }}"}]), False),
 ("sketchfab secret is fine", pr([{"filename": ".github/workflows/sketchfab-fetch.yml", "patch": "+  X: ${{ secrets.SKETCHFAB_TOKEN }}"}]), True),
 ("no readable diff", pr([{"filename": ".github/workflows/sketchfab-fetch.yml"}]), False),
 ("draft", pr([".github/workflows/sketchfab-fetch.yml"], draft=True), False),
 ("hold title", pr([".github/workflows/sketchfab-fetch.yml"], title="HOLD: x"), False),
 ("no-auto label", pr([".github/workflows/sketchfab-fetch.yml"], labels=[{"name": "no-auto"}]), False),
 ("fork", pr([".github/workflows/sketchfab-fetch.yml"], head={"repo": {"full_name": "x/r"}}), False),
 ("stranger author", pr([".github/workflows/sketchfab-fetch.yml"], user={"login": "someone"}), False),
 ("conflicted", pr([".github/workflows/sketchfab-fetch.yml"], mergeable_state="dirty"), False),
 ("check red", pr([".github/workflows/sketchfab-fetch.yml"], _runs=[{"name": "check", "status": "completed", "conclusion": "failure"}]), False),
 ("check missing", pr([".github/workflows/sketchfab-fetch.yml"], _runs=[]), False),
 ("other check running", pr([".github/workflows/sketchfab-fetch.yml"], _runs=GREEN + [{"name": "x", "status": "in_progress"}]), False),
]
bad = 0
for name, p, want in cases:
    ok, why = ra.judge(p)
    print(("PASS " if ok == want else "FAIL ") + name + " -> " + why)
    bad += ok != want
print("AUDITOR DRILL:", "ALL GOOD" if not bad else "%d FAILED" % bad)
sys.exit(1 if bad else 0)
