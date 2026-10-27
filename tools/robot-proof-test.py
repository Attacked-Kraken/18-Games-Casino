#!/usr/bin/env python3
"""Drill for tools/robot-proof.py (no GitHub). exit 0 = all good."""
import datetime, importlib.util, json, os, sys
sp = importlib.util.spec_from_file_location("rp", os.path.join(os.path.dirname(os.path.abspath(__file__)), "robot-proof.py"))
rp = importlib.util.module_from_spec(sp); sp.loader.exec_module(rp)
F = lambda **k: dict({"game": "g.html", "match": "abc.*", "why": "w", "since": "2026-10-20", "until": "2026-10-27"}, **k)
J = lambda *e: json.dumps({"faults": list(e)})
real = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "game-check", "known-faults.json")).read()
proof = [
 ("good python", "a.py", "x = 1\n", True), ("bad python", "a.py", "def (:\n", False),
 ("good node", "a.mjs", "const a = 1;\n", True), ("bad node", "a.mjs", "const = ;\n", False),
 ("good sh", "a.sh", "echo hi\n", True), ("bad sh", "a.sh", "if then\n", False),
 ("good workflow", "a.yml", "on: push\njobs:\n  a:\n    runs-on: x\n", True), ("workflow no jobs", "a.yml", "on: push\n", False),
 ("bad yaml", "a.yml", "a: [\n", False),
 ("good faults", "known-faults.json", J(F()), True), ("faults no why", "known-faults.json", J(F(why="")), False),
 ("faults no expiry", "known-faults.json", J(F(until="")), False), ("faults 30 days", "known-faults.json", J(F(until="2026-11-30")), False),
 ("faults bad regex", "known-faults.json", J(F(match="(unclosed")), False), ("faults not json", "known-faults.json", "{", False),
 ("the REAL faults file", "known-faults.json", real, True),
 ("notes", "jobs/x.md", "hi", True), ("unknown type", "a.bin", "x", False),
]
base = {"at": "2026-10-27T12:00:00Z", "runs": 40, "cancelled": 4, "ratio": 0.1, "idle": 1}
def runs(n_branches, cancelled, total):
    return [{"head_branch": "b%d" % (i % n_branches), "created_at": "2026-10-27T13:%02d:00Z" % (i % 60), "conclusion": "cancelled" if i < cancelled else "success"} for i in range(total)]
NOW = datetime.datetime(2026, 10, 27, 15, tzinfo=datetime.timezone.utc)
dec = [
 ("only 4 branches -> wait", runs(4, 1, 20), 1, "wait"), ("10 branches, same -> ok", runs(10, 4, 40), 1, "ok"),
 ("10 branches, cancelled share up -> worse", runs(10, 20, 40), 1, "worse"), ("few cancels (2) even if share is up -> ok", runs(10, 2, 10), 1, "ok"),
 ("more idle PRs -> worse", runs(10, 4, 40), 5, "worse"),
]
bad = 0
for name, fn, text, want in proof:
    ok, why = rp.proof_text(fn, text); print(("PASS " if ok == want else "FAIL ") + name + " -> " + why); bad += ok != want
for name, r, idle, want in dec:
    st, txt = rp.decide(base, r, idle, NOW); print(("PASS " if st == want else "FAIL ") + name + " -> " + st + " " + txt[:70]); bad += st != want
old = datetime.datetime(2026, 11, 5, tzinfo=datetime.timezone.utc)
st, txt = rp.decide(base, runs(2, 0, 4), 1, old); print(("PASS " if st == "ok" else "FAIL ") + "7 days with few PRs and no harm -> " + st); bad += st != "ok"
print("PROOF DRILL:", "ALL GOOD" if not bad else "%d FAILED" % bad); sys.exit(1 if bad else 0)
