#!/usr/bin/env python3
"""Proof before merge + a watch after merge, for the robot auditor (04 + VP, Oct 27 2026).
(2) PROOF BEFORE MERGE: every robot file an allow-listed PR changes is read at the PR's own commit and proven - python compiles,
    node --check, workflow YAML parses and has jobs, shell parses, known-faults.json entries each have match / why / since /
    until (until within 14 days of since, so a fault can never hide a real bug for long) and a match that compiles as a JS regex.
    A changed robot file with NO proof registered is held. Nothing is merged on 'it looks fine'.
(3) TRACK RECORD AFTER MERGE: at merge the auditor stores a baseline (share of cancelled 'Game check (PR)' runs over the last 40,
    open PRs idle 3+ h). When 10 more distinct branches have had a check run, the same numbers are measured again and written in a
    PR comment. Clearly worse (cancelled share up 10+ points with 3+ cancels, or 3+ more idle PRs) = the auditor opens a revert PR.
Pure functions below are drilled by tools/robot-proof-test.py (no GitHub)."""
import base64, datetime, json, os, re, subprocess, sys, tempfile

REPO = os.environ.get("GITHUB_REPOSITORY", "Attacked-Kraken/18-Games-Casino")
WATCH_BRANCHES = 10
WATCH_MAX_DAYS = 7
WORSE_RATIO = 0.10
WORSE_CANCELS = 3
WORSE_IDLE = 3


def _run(cmd, inp=None):
    r = subprocess.run(cmd, capture_output=True, text=True, input=inp)
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def _date(s):
    return datetime.date.fromisoformat(str(s)[:10])


def proof_text(name, text):
    """-> (ok, why). Registered proofs only; anything else is 'no proof registered' (held)."""
    if name.endswith(".py"):
        try:
            compile(text, name, "exec"); return True, "python compiles"
        except SyntaxError as e:
            return False, "python syntax error line %s" % e.lineno
    if name.endswith((".mjs", ".js")):
        with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False) as f:
            f.write(text); p = f.name
        rc, out = _run(["node", "--check", p]); os.unlink(p)
        return (rc == 0, "node --check ok" if rc == 0 else "node --check failed: " + out.strip()[:120])
    if name.endswith(".sh"):
        rc, out = _run(["bash", "-n"], text)
        return (rc == 0, "bash -n ok" if rc == 0 else "bash -n failed: " + out.strip()[:120])
    if name.endswith((".yml", ".yaml")):
        try:
            import yaml
            d = yaml.safe_load(text)
        except Exception as e:
            return False, "yaml does not parse: %s" % str(e)[:100]
        if not isinstance(d, dict) or "jobs" not in d:
            return False, "workflow has no jobs"
        return True, "workflow parses, %d job(s)" % len(d["jobs"])
    if name.endswith("known-faults.json"):
        try:
            d = json.loads(text)
        except Exception as e:
            return False, "json does not parse: %s" % str(e)[:100]
        faults = d.get("faults") if isinstance(d, dict) else None
        if not isinstance(faults, list):
            return False, "no 'faults' list"
        for i, e in enumerate(faults):
            for k in ("game", "match", "why", "since", "until"):
                if not str(e.get(k, "")).strip():
                    return False, "entry %d has no '%s'" % (i, k)
            try:
                if (_date(e["until"]) - _date(e["since"])).days > 14:
                    return False, "entry %d (%s) lasts over 14 days - a known fault must expire" % (i, str(e["match"])[:30])
            except Exception:
                return False, "entry %d has a bad date" % i
        rc, out = _run(["node", "-e", "const f=JSON.parse(require('fs').readFileSync(0,'utf8')).faults;"
                        "for(const [i,e] of f.entries()){try{new RegExp(e.match)}catch(x){console.log('BAD '+i);process.exit(1)}}"], text)
        if rc != 0:
            return False, "a 'match' does not compile as a regex (%s)" % out.strip()[:40]
        return True, "%d fault entries, each with why + expiry, regexes compile" % len(faults)
    if re.search(r"\.(md|txt)$", name):
        return True, "notes file"
    return False, "no proof registered for %s" % name


def proof_pr(n, files, sha):
    """Read each changed robot file at the PR head and prove it. -> (ok, why)."""
    notes = []
    for f in files:
        name = f["filename"]
        if re.search(r"\.(md|txt)$", name):
            continue
        if f.get("status") == "removed":
            return False, "%s is deleted - a removed robot file needs a person" % name
        rc, out = _run(["gh", "api", "repos/%s/contents/%s?ref=%s" % (REPO, name, sha)])
        try:
            text = base64.b64decode(json.loads(out)["content"]).decode("utf-8", "replace")
        except Exception:
            return False, "could not read %s at %s" % (name, sha[:7])
        ok, why = proof_text(name, text)
        if not ok:
            return False, "%s: %s" % (name, why)
        notes.append("%s: %s" % (name.split("/")[-1], why))
    return True, "; ".join(notes) or "notes only"


def health(runs):
    """runs = 'Game check (PR)' run dicts -> {runs, cancelled, ratio}."""
    c = sum(1 for r in runs if r.get("conclusion") == "cancelled")
    return {"runs": len(runs), "cancelled": c, "ratio": round(c / len(runs), 3) if runs else 0.0}


def fetch_pr_runs(limit=100):
    rc, out = _run(["gh", "api", "repos/%s/actions/workflows/game-check-pr.yml/runs?per_page=%d" % (REPO, limit)])
    try:
        runs = json.loads(out).get("workflow_runs", [])
    except Exception:
        return []
    return [r for r in runs if r.get("name") == "Game check (PR)"]


def idle_prs(hours=3):
    rc, out = _run(["gh", "api", "repos/%s/pulls?state=open&per_page=60" % REPO])
    try:
        prs = json.loads(out)
    except Exception:
        return 0
    now = datetime.datetime.now(datetime.timezone.utc)
    return sum(1 for p in prs if (now - datetime.datetime.fromisoformat(p["updated_at"].replace("Z", "+00:00"))).total_seconds() > hours * 3600)


def baseline():
    h = health(fetch_pr_runs(40)[:40]); h["idle"] = idle_prs()
    h["at"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return h


def decide(base, after_runs, idle_now, now=None):
    """-> (state, text). state: wait | ok | worse. Pure: drilled offline."""
    now = now or datetime.datetime.now(datetime.timezone.utc)
    since = base["at"]
    mine = [r for r in after_runs if (r.get("created_at") or "") > since]
    branches = {r.get("head_branch") for r in mine}
    age = (now - datetime.datetime.fromisoformat(since.replace("Z", "+00:00"))).days
    if len(branches) < WATCH_BRANCHES and age < WATCH_MAX_DAYS:
        return "wait", "%d of %d branches seen" % (len(branches), WATCH_BRANCHES)
    a = health(mine)
    txt = ("cancelled check runs: %d of %d (%.0f%%) after vs %d of %d (%.0f%%) before · open PRs idle 3+ h: %d now vs %d at merge · %d branches"
           % (a["cancelled"], a["runs"], a["ratio"] * 100, base["cancelled"], base["runs"], base["ratio"] * 100, idle_now, base["idle"], len(branches)))
    if (a["ratio"] - base["ratio"] >= WORSE_RATIO and a["cancelled"] >= WORSE_CANCELS) or idle_now - base["idle"] >= WORSE_IDLE:
        return "worse", txt
    return "ok", txt


def revert_pr(merge_sha, n, title, why):
    """Open a revert pull request of the auditor's own merge (the auditor merges it later by the same allow rules)."""
    br = "robot/revert-%d" % n
    cmds = [["git", "config", "user.name", "robot auditor"], ["git", "config", "user.email", "actions@users.noreply.github.com"],
            ["git", "fetch", "-q", "origin", "main"], ["git", "checkout", "-q", "-B", br, "origin/main"],
            ["git", "revert", "--no-edit", merge_sha], ["git", "push", "-q", "-f", "origin", br]]
    for c in cmds:
        rc, out = _run(c)
        if rc != 0:
            return None, "git %s failed: %s" % (c[1], out.strip()[:100])
    body = "The robot auditor merged #%d and the numbers got worse: %s\n\nThis reverts it. hand merge by robot auditor when it is green (same allow rules)." % (n, why)
    rc, out = _run(["gh", "api", "repos/%s/pulls" % REPO, "-f", "title=Revert #%d: %s" % (n, title[:60]), "-f", "head=" + br, "-f", "base=main", "-f", "body=" + body])
    try:
        num = json.loads(out)["number"]
    except Exception:
        return None, "could not open the revert PR: %s" % out.strip()[:100]
    subprocess.run(["python3", "tools/game-check/start-check.py", br, "25"], capture_output=True, text=True)
    return num, "revert PR #%d opened" % num
