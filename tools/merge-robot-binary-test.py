#!/usr/bin/env python3
"""Drill: the merge robot keeps the PR's side of a conflicting binary file (modify/delete, both modified) or keeps it deleted. Real git, temp repos."""
import importlib.util, os, subprocess, sys, tempfile
sp = importlib.util.spec_from_file_location("m", os.path.join(os.path.dirname(os.path.abspath(__file__)), "merge-robot.py")); m = importlib.util.module_from_spec(sp)
try: sp.loader.exec_module(m)
except SystemExit: pass
def mk(kind):
    d = tempfile.mkdtemp(); g = lambda *a: subprocess.run(["git"] + list(a), cwd=d, capture_output=True, text=True)
    g("init", "-q", "-b", "main"); g("config", "user.email", "a@b"); g("config", "user.name", "n")
    open(d + "/m.glb", "wb").write(b"v0\x00"); g("add", "."); g("commit", "-qm", "0"); g("checkout", "-qb", "pr")
    if kind == "pr-deletes": g("rm", "-q", "m.glb")
    else: open(d + "/m.glb", "wb").write(b"PR\x00\x01")
    g("commit", "-qam", "pr"); g("checkout", "-q", "main")
    if kind == "main-deletes": g("rm", "-q", "m.glb")
    else: open(d + "/m.glb", "wb").write(b"MAIN\x00\x02")
    g("commit", "-qam", "main"); g("checkout", "-q", "pr"); g("merge", "--no-edit", "main")
    return d, g
bad = 0
for kind, want in (("main-deletes", b"PR\x00\x01"), ("both-modified", b"PR\x00\x01"), ("pr-deletes", None)):
    d, g = mk(kind)
    conflict = "m.glb" in g("diff", "--name-only", "--diff-filter=U").stdout.split()
    ok = m.resolve_binary(g, "m.glb"); got = open(d + "/m.glb", "rb").read() if os.path.exists(d + "/m.glb") else None
    c = g("commit", "-qm", "merge")
    good = conflict and ok and got == want and c.returncode == 0
    print(("PASS " if good else "FAIL ") + kind + " (conflict seen: %s, resolved: %s, commit: %s)" % (conflict, ok, c.returncode == 0)); bad += not good
print("BINARY DRILL:", "ALL GOOD" if not bad else "%d FAILED" % bad); sys.exit(1 if bad else 0)
