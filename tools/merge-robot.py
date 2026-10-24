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
import re
import json, os, subprocess, datetime, time

REPO = os.environ.get("GITHUB_REPOSITORY", "Attacked-Kraken/18-Games-Casino")
MAX_AGE_H = 72   # Oct 23 2026: 12 h hid dirty TEST PR #1200 for 18 h (analyst); only truly old PRs are left alone
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


NOTES_UNION = ("jobs/QUEUE.md", "CLAIMS.md", "jobs/HELP.md")  # needs/window-N.md: one window writes it, no union needed


def tidy_queue(path="jobs/QUEUE.md"):
    """After a both-sides merge a step can appear twice (one side ticked it '- [x]', the other still has '- [ ]'):
    keep the ticked one. (Oct 21: the hockey REALITY-hook step came back unticked after #883's merge.)"""
    try:
        lines = open(path, encoding="utf-8", errors="replace").read().split("\n")
    except OSError:
        return
    import re as _re
    key = lambda l: _re.sub(r"\s+", " ", _re.sub(r"^\s*-\s*\[.\]\s*(\([^)]*\)\s*)?", "", l)).strip().lower()[:90]
    done = {key(l) for l in lines if _re.match(r"\s*-\s*\[x\]", l, _re.I)}
    out, seen = [], set()
    for l in lines:
        if _re.match(r"\s*-\s*\[ \]", l) and key(l) in done:
            continue
        if _re.match(r"\s*-\s*\[.\]", l):
            if key(l) in seen:
                continue
            seen.add(key(l))
        out.append(l)
    if out != lines:
        open(path, "w", encoding="utf-8").write("\n".join(out))
        subprocess.run(["git", "add", path])


def auto_resolvable(path):
    """Oct 23 2026 (owner: cards faster; window 3's #1402 sat 'dirty' on looks/apexflight.md + fixes/apexflight.mjs, the two files every
    build job appends to): notes, look boards and a game's own play-test list are APPENDED to by both sides, so both sides are kept."""
    return (path in NOTES_UNION or path.startswith("jobs/G-") or (path.startswith("looks/") and path.endswith(".md"))
            or (path.startswith("tools/game-check/fixes/") and path.endswith(".mjs"))
            or (path.startswith("checklists/") and path.endswith(".md")))   # Oct 24 2026: merged by ITEM (tools/checklist-merge.py)


def play_test_file_ok(path):
    import re as _re
    r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
    if r.returncode != 0:
        return False
    ids = _re.findall(r"^\s*id:\s*['\"]([^'\"]+)['\"]", open(path, encoding="utf-8", errors="replace").read(), flags=_re.M)
    return len(ids) == len(set(ids))


def fix_notes_conflict(pr):
    """Merge main into the PR branch; conflicts in notes files are resolved by keeping both sides' lines."""
    n, branch = pr["number"], pr["head"]["ref"]
    def git(*a):
        return subprocess.run(["git"] + list(a), capture_output=True, text=True)
    git("config", "user.name", "merge robot"); git("config", "user.email", "actions@users.noreply.github.com")
    # NOTE: git has a built-in "union" merge (.gitattributes merge=union). Do NOT define merge.union.driver here: the old
    # "... > %A" version emptied the PR's own file before merging and silently dropped its lines (found Oct 23 2026).
    def warn(why, r=None):
        # annotations are readable through the API (the run log is not): say WHY a fix did not happen
        print("::warning title=Merge robot::#%d: %s %s" % (n, why, ((r.stderr or r.stdout or "").strip()[:160].replace("\n", " ") if r else "")))
        return False
    r = git("fetch", "-q", "origin", "+refs/heads/main:refs/remotes/origin/main", "+refs/heads/%s:refs/remotes/origin/%s" % (branch, branch))
    if r.returncode != 0:
        return warn("could not fetch main/branch", r)
    r = git("checkout", "-q", "-B", branch, "origin/" + branch)
    if r.returncode != 0:
        return warn("could not check out the branch", r)
    r = git("merge", "--no-edit", "origin/main")
    if r.returncode != 0:
        left = [x for x in git("diff", "--name-only", "--diff-filter=U").stdout.split() if x]
        if left and not all(auto_resolvable(x) for x in left):
            git("merge", "--abort")
            # Oct 24 2026 (PR #1355 got 960 of these): ONE comment per PR, edited in place - never a new post each round
            tell_pr(n, git("rev-parse", "origin/main").stdout.strip() or "main",
                    "this pull request conflicts with main in %s - merge main into your branch and push again." % ", ".join(left[:5]))
            print("#%d: conflict in %s - left for the Muse" % (n, ", ".join(left[:5]))); return False
        for f in left:   # a notes / look-board / play-test file the union driver did not catch
            if f.startswith("tools/game-check/fixes/") and f.endswith(".mjs"):
                # Oct 23 2026: two PRs that each ADD tests conflict at the end of the list, and keeping both text sides breaks the
                # file. Merge by test ENTRY: main's file + the tests only this PR has (tools/game-check/merge-play-tests.mjs).
                ok = False
                try:
                    tmp = "/tmp/mpt"; os.makedirs(tmp, exist_ok=True)
                    for k, nm in ((1, "base"), (2, "pr"), (3, "main")):
                        open("%s/%s.mjs" % (tmp, nm), "w", encoding="utf-8").write(git("show", ":%d:%s" % (k, f)).stdout)
                    m = subprocess.run(["node", "tools/game-check/merge-play-tests.mjs", tmp + "/base.mjs", tmp + "/pr.mjs", tmp + "/main.mjs", f],
                                       capture_output=True, text=True)
                    ok = m.returncode == 0 and play_test_file_ok(f)
                    why = (m.stderr or m.stdout or "").strip()[:160].replace("\n", " ")
                except Exception as e:
                    why = str(e)[:160]
                if not ok:
                    git("merge", "--abort")
                    tell_pr(n, git("rev-parse", "origin/main").stdout.strip() or "main",
                            "both sides changed %s and the tests could not be combined (%s) - merge main into your branch by hand and push again." % (f, why))
                    print("::warning title=Merge robot::#%d: play-test merge of %s failed (%s) - left for the Muse" % (n, f, why)); return False
                git("add", f); continue
            if f.startswith("checklists/") and f.endswith(".md"):
                # Oct 24 2026: a checklist is merged item by item (the tester's ticked line wins over main's open line)
                tmp = "/tmp/mcl"; os.makedirs(tmp, exist_ok=True)
                for k, nm in ((1, "base"), (2, "pr"), (3, "main")):
                    open("%s/%s.md" % (tmp, nm), "w", encoding="utf-8").write(git("show", ":%d:%s" % (k, f)).stdout)
                m = subprocess.run(["python3", "tools/checklist-merge.py", tmp + "/base.md", tmp + "/pr.md", tmp + "/main.md", f],
                                   capture_output=True, text=True)
                if m.returncode != 0:
                    git("merge", "--abort")
                    tell_pr(n, git("rev-parse", "origin/main").stdout.strip() or "main",
                            "both sides changed %s and the items could not be combined - merge main into your branch by hand and push again." % f)
                    print("::warning title=Merge robot::#%d: checklist merge of %s failed - left for the Muse" % (n, f)); return False
                git("add", f); continue
            txt = open(f, encoding="utf-8", errors="replace").read()
            import re as _re
            txt = _re.sub(r"<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n", lambda m: m.group(1) + m.group(2), txt, flags=_re.S)
            open(f, "w", encoding="utf-8").write(txt)
            git("add", f)
        tidy_queue()
        r = git("commit", "-q", "-m", "merge robot: merged main, notes kept from both sides")
        if r.returncode != 0:
            git("merge", "--abort"); return warn("merge could not be committed", r)
    r = git("push", "-q", "origin", branch)
    if r.returncode != 0:
        return warn("could not push the merge to %s" % branch, r)
    gh("repos/%s/actions/workflows/game-check-pr.yml/dispatches" % REPO, method="POST", fields={"ref": branch})
    print("::notice title=Merge robot::#%d: merged main into %s (notes kept from both sides), check restarted" % (n, branch))
    return True


WAIT_UNTIL = time.time() + 120   # total seconds this run may spend waiting for GitHub to work out 'mergeable'


def settle_pr(n):
    """Oct 23 2026 (window 5's PR #1264 sat 'dirty' with nobody noticing): right after main moves, GitHub answers
    mergeable=null ("still working it out") for a while. The old robot read that as 'not mergeable yet', skipped the PR,
    and nothing woke it again. Ask a few more times, within a total budget."""
    full = gh("repos/%s/pulls/%d" % (REPO, n)) or {}
    while full.get("mergeable") is None and time.time() < WAIT_UNTIL:
        time.sleep(7)
        full = gh("repos/%s/pulls/%d" % (REPO, n)) or full
    return full


def approve_waiting(open_prs):
    """Oct 23 2026 live test (PRs #1279/#1280): when the robot merged main into a PR branch, GitHub started that PR's
    'Game check (PR)' / 'Asset check' runs in state action_required (a bot pushed - waits for a human to press
    'Approve and run'). Those runs leave the required check 'check' EXPECTED, so the PR stayed 'blocked' for ever even though the
    robot's own re-check was green. Approve them here. ONLY runs of OUR repo's own open pull-request branches (never a fork)."""
    branches = {pr["head"]["ref"] for pr in open_prs if pr["head"].get("repo") and pr["head"]["repo"]["full_name"] == REPO}
    waiting = (gh("repos/%s/actions/runs?status=action_required&per_page=30" % REPO) or {}).get("workflow_runs", [])
    done = 0
    for r in waiting:
        if r.get("event") != "pull_request" or r.get("head_branch") not in branches:
            continue
        if (r.get("head_repository") or {}).get("full_name") != REPO:
            continue
        if gh("repos/%s/actions/runs/%d/approve" % (REPO, r["id"]), method="POST") is not None:
            done += 1
            print("::notice title=Merge robot::approved the waiting run %s (%s) on %s" % (r["id"], r.get("name"), r.get("head_branch")))
        else:
            print("::warning title=Merge robot::could not approve the waiting run %s (%s) on %s" % (r["id"], r.get("name"), r.get("head_branch")))
    return done


def restart_cancelled(pr):
    """Owner Oct 23 2026 1:38 PM (PR #1269: its Racer play job was cancelled by GitHub, the check then failed 'could not
    play it', the status comment kept saying RUNNING, and the PR sat blocked until a Claude restarted it by hand):
    when a pull request's NEWEST 'Game check (PR)' run on its newest commit was CANCELLED and no newer run exists, the
    robot re-runs it ONCE by itself and rewrites the stale status comment to 'cancelled, restarting'. A re-run replaces the
    old attempt in place (a second run next to it would leave the old failed 'check' behind, and GitHub's ruleset still
    counts that one). Once per run: a marker comment with the run id. Returns True when it restarted a run."""
    n, sha, branch = pr["number"], pr["head"]["sha"], pr["head"]["ref"]
    runs = (gh("repos/%s/actions/runs?head_sha=%s&per_page=30" % (REPO, sha)) or {}).get("workflow_runs", [])
    mine = [r for r in runs if r.get("name") == "Game check (PR)"]
    if not mine:
        return False
    newest = max(mine, key=lambda r: (r.get("created_at") or "", r.get("run_attempt") or 0))
    if newest.get("status") != "completed" or newest.get("conclusion") != "cancelled":
        return False                      # still running, finished, or a newer run already replaced it
    marker = "<!-- robot-restart:%s:%s -->" % (sha[:7], newest["id"])
    comments = gh("repos/%s/issues/%d/comments?per_page=100" % (REPO, n)) or []
    if any(marker in (c.get("body") or "") for c in comments):
        return False                      # already restarted this one once - a second cancel is left for a human to look at
    when = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M")
    how = "re-ran it"
    if gh("repos/%s/actions/runs/%d/rerun" % (REPO, newest["id"]), method="POST") is None:
        if gh("repos/%s/actions/workflows/game-check-pr.yml/dispatches" % REPO, method="POST", fields={"ref": branch}) is None:
            print("::warning title=Merge robot::#%d: the check run %s was cancelled and could not be restarted" % (n, newest["id"]))
            return False
        how = "started a new run"
    for c in comments:                    # the stale 'RUNNING' comment must not keep lying
        if (c.get("body") or "").startswith("<!-- check-status -->"):
            gh("repos/%s/issues/comments/%d" % (REPO, c["id"]), method="PATCH", fields={"body":
               "<!-- check-status -->\n## \U0001F916 Check status: \U0001F7E1 CANCELLED - restarting\n\n"
               "GitHub cancelled the robot's check run (this is not a problem with this pull request). "
               "The merge robot %s at %s UTC; this comment is rewritten when the new run starts.\n\n"
               "_Updated %s UTC by the merge robot._" % (how, when, when)})
            break
    gh("repos/%s/issues/%d/comments" % (REPO, n), method="POST", fields={"body":
       "%s\n\U0001F916 Merge robot: the check run %s on commit %s was CANCELLED, so it %s at %s UTC (once; no human needed)."
       % (marker, newest["id"], sha[:7], how, when)})
    print("::notice title=Merge robot::#%d: the check run %s was cancelled - %s at %s UTC" % (n, newest["id"], how, when))
    return True


SUMMARY = []


def say(line):
    print(line)
    SUMMARY.append(line)


def tell_pr(n, sha, text):
    """Owner Oct 21 2026 'every robot writes its fail reason as a PR comment': ONE comment per PR, edited in place.
    Oct 24 2026 (HELP line, PR #1427 had 677 comments): the old check read only the first 50 comments, so on a PR with more
    than 50 comments it never found its own earlier comment and posted a new one every ~2.5 min. Now every page is read (up to
    30 pages of 100); an existing robot comment with the same commit + text = nothing to do; with another commit/text = that one
    comment is edited; none = one new comment."""
    try:
        body = "\U0001F916 Merge robot (commit %s): %s" % (sha[:7], text)
        mine = None
        for page in range(1, 31):
            cs = gh("repos/%s/issues/%d/comments?per_page=100&page=%d" % (REPO, n, page)) or []
            for c in cs:
                if (c.get("body") or "").startswith("\U0001F916 Merge robot (commit"):
                    mine = c      # keep the NEWEST robot comment
            if len(cs) < 100:
                break
        if mine is not None:
            if (mine.get("body") or "").strip() == body.strip():
                return
            gh("repos/%s/issues/comments/%d" % (REPO, mine["id"]), method="PATCH", fields={"body": body})
            return
        gh("repos/%s/issues/%d/comments" % (REPO, n), method="POST", fields={"body": body})
    except Exception:
        pass


def main():
    now = datetime.datetime.now(datetime.timezone.utc)
    merged, follow = [], set()
    revisit, looked = False, 0   # revisit = some PR still needs the robot to look again soon
    open_prs = gh("repos/%s/pulls?state=open&per_page=50" % REPO) or []
    try:
        if approve_waiting(open_prs):
            revisit = True      # their check runs now; look again when it finishes
    except Exception as e:
        print("::warning title=Merge robot::approving waiting runs failed: %s" % e)
    for pr in open_prs:
        n, title = pr["number"], pr.get("title", "")
        made = datetime.datetime.strptime(pr["created_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)
        too_old = (now - made).total_seconds() > MAX_AGE_H * 3600
        if too_old:
            # owner Oct 23 2026 7:46 AM: help lines + notes PRs older than 12 h were never touched again (window 3's HELP
            # lines sat 13 h in PR #1152). A PR that changes ONLY notes files is never 'too old'.
            _nf = gh("repos/%s/pulls/%d/files?per_page=100" % (REPO, n)) or []
            if not (_nf and all(re.match(r"^(jobs/[^/]+\.md|needs/[^/]+\.md|reviews/[^/]+\.md|CLAIMS\.md|LESSONS\.md|team/[^/]+\.md)$", f["filename"]) for f in _nf)):
                continue
        low = title.lower()
        # Oct 23 2026 6:05 PM: window 9's "TEST G-231: DRAFT checklist apexflight" (#1293) sat green 4.5 h - the word 'draft' ANYWHERE in
        # the title counted as 'do not merge' (it means a first-draft checklist). Hold only on GitHub's draft flag, a 'hold' label,
        # or a title that STARTS with WIP / DRAFT / HOLD / [..] or says 'do not merge'.
        if pr.get("draft") or re.match(r"\s*\[?\s*(wip|draft|hold)\b", low) or "do not merge" in low or \
                any(l.get("name", "").lower() == "hold" for l in pr.get("labels", [])):
            say("#%d skipped: draft/hold" % n); continue
        if pr["head"]["repo"] is None or pr["head"]["repo"]["full_name"] != REPO:
            say("#%d skipped: from another repo" % n); continue
        files = gh("repos/%s/pulls/%d/files?per_page=100" % (REPO, n)) or []
        looked += 1
        if any(f["filename"].startswith(".github/") for f in files):
            say("#%d skipped: changes the robots (.github/) - owner/Claude merges those" % n); continue
        full = settle_pr(n)
        if full.get("mergeable") is False and full.get("mergeable_state") == "dirty":
            # owner Oct 21 2026 2:24 PM (PR #883, window 8: green but a conflict in jobs/QUEUE.md): the robot fixes
            # NOTES conflicts by itself - QUEUE.md / job reports / CLAIMS.md keep BOTH sides' lines (git 'union' merge,
            # .gitattributes) - pushes the fix to the PR's branch and restarts its check. Anything else stays for a Muse.
            if fix_notes_conflict(pr):
                print("#%d: merged main into its branch (notes kept from both sides) - check restarted" % n)
            revisit = True      # look again soon: the fix may not have taken, or main may have moved again
            continue
        if full.get("mergeable") is False:
            say("#%d skipped: not mergeable (%s)" % (n, full.get("mergeable_state"))); continue
        if full.get("mergeable") is None:
            # Oct 23 2026 5:17 PM (window 9 #1293 green + clean, open 3 h 40 min): while main moves every few minutes GitHub can leave
            # 'mergeable' unworked-out for HOURS, and the robot skipped such PRs on every round. The merge call itself is the real test:
            # GitHub refuses it (405) if the PR really conflicts. So a green PR with an unknown state is TRIED, not skipped.
            print("::notice title=Merge robot::#%d: GitHub has not worked out 'mergeable' - trying the merge anyway if its checks are green" % n)
        # window 2, Oct 21 2026 (PR #902 merged from an old main and wiped G-88's two tests): a branch BEHIND main is
        # brought up to date first (main merged in, check re-run on the updated branch); it merges on a later round.
        try:
            cmp = gh("repos/%s/compare/%s...%s" % (REPO, full["base"]["sha"], pr["head"]["sha"])) or {}
            behind = int(cmp.get("behind_by") or 0)
        except Exception:
            behind = 0
        if behind > 0:
            # only when main's newer commits touch a file this PR changes (a notes / tests / checklist PR behind main on OTHER files
            # merges as it is - updating it re-ran its 10-min check, main moved again, and it never merged: #1293, #1281, #1309)
            try:
                mfiles = {f["filename"] for f in ((gh("repos/%s/compare/%s...main" % (REPO, pr["head"]["sha"])) or {}).get("files") or [])}
            except Exception:
                mfiles = None
            if mfiles is not None and not (mfiles & {f["filename"] for f in files}):
                print("#%d is %d behind main but main's newer commits touch none of its files - merging as it is" % (n, behind))
                behind = 0
        if behind > 0:
            res = gh("repos/%s/pulls/%d/update-branch" % (REPO, n), method="PUT")
            if res is not None:
                gh("repos/%s/actions/workflows/game-check-pr.yml/dispatches" % REPO, method="POST", fields={"ref": pr["head"]["ref"]})
                print("::notice title=Merge robot::#%d was %d commit(s) behind main - merged main into %s and restarted its check; merges next round if green" % (n, behind, pr["head"]["ref"]))
            else:
                print("#%d: behind main by %d but could not update the branch" % (n, behind))
            revisit = True
            continue
        try:
            if restart_cancelled(pr):
                revisit = True
                say("#%d: its cancelled check was restarted by the robot" % n); continue
        except Exception as e:
            print("::warning title=Merge robot::#%d: restarting a cancelled check failed: %s" % (n, e))
        runs = (gh("repos/%s/commits/%s/check-runs?per_page=50" % (REPO, pr["head"]["sha"])) or {}).get("check_runs", [])
        newest = {}
        for r in runs:                       # a re-run leaves the old run behind: only the newest of each check counts
            k = r.get("name", "")
            if k not in newest or (r.get("started_at") or "") > (newest[k].get("started_at") or ""):
                newest[k] = r
        # Oct 24 2026 (PR #1452): a push cancels the old run's bare 'play' job (the matrix parent, started before the plan job
        # lists the games). Nothing ever replaces that name - the new runs are 'play (<game>.html)' - so the robot read the
        # cancelled leftover as a FAILED check for good and never merged a green PR. A cancelled bare name that has matrix
        # children ('play (...)') on the same commit is a leftover, not a verdict: the children and 'check' decide.
        for k in list(newest):
            r = newest[k]
            if r.get("status") == "completed" and r.get("conclusion") == "cancelled" and any(o.startswith(k + " (") for o in newest):
                del newest[k]
        if "check" not in newest:
            revisit = True
            say("#%d skipped: the robot's game check hasn't run yet" % n); continue
        busy = [k for k, r in newest.items() if r.get("status") != "completed"]
        bad = [k for k, r in newest.items() if r.get("status") == "completed" and r.get("conclusion") not in OK]
        if busy or bad:
            say("#%d skipped: checks %s" % (n, ("running: " + ", ".join(busy)) if busy else ("FAILED: " + ", ".join(bad))))
            if bad:
                tell_pr(n, pr["head"]["sha"], "not merged - these checks FAILED: %s. Their own comment above says what to fix; push a fix and the check re-runs." % ", ".join(bad))
            continue
        res = gh("repos/%s/pulls/%d/merge" % (REPO, n), method="PUT",
                 fields={"merge_method": "squash", "commit_title": "%s (#%d) - merged by the merge robot (green)" % (title, n)})
        if not (res and res.get("merged")):
            revisit = True
            print("::warning title=Merge robot::#%d: green but GitHub refused the merge (%s) - looking again next round" % (n, (res or {}).get("message", "no answer")))
        if res and res.get("merged"):
            merged.append(n)
            for wf, starts in FOLLOW:
                if any(f["filename"].startswith(starts) for f in files):
                    follow.add(wf)
            print("::notice title=Merge robot::merged #%d %s" % (n, title))
    if merged and looked > len(merged):
        revisit = True          # a merge moved main: the other open PRs may have just turned conflicted
    try:   # tells the workflow's heartbeat job to wake this robot again in a few minutes (GitHub's 5-minute timer is not reliable)
        with open(os.environ.get("GITHUB_OUTPUT", "/dev/null"), "a") as f:
            f.write("revisit=%s\n" % ("true" if revisit else "false"))
        if revisit:
            print("heartbeat: asking to be woken again in a few minutes")
    except Exception:
        pass
    if merged:
        gh("repos/%s/actions/workflows/game-check.yml/dispatches" % REPO, method="POST", fields={"ref": "main"})
        print("started the Game check on main")
        for wf in sorted(follow):
            gh("repos/%s/actions/workflows/%s/dispatches" % (REPO, wf), method="POST", fields={"ref": "main"})
            print("started %s for what the merge changed" % wf)
    else:
        print("nothing green to merge")
    try:   # the run summary says why each open pull request was or wasn't merged (owner Oct 21 2026: never only in the log)
        with open(os.environ.get("GITHUB_STEP_SUMMARY", "/dev/null"), "a") as f:
            f.write("## Merge robot\n" + ("\n".join("- " + x for x in SUMMARY) if SUMMARY else "- nothing to report") +
                    ("\n- merged: " + ", ".join("#%d" % m for m in merged) if merged else "") + "\n")
    except Exception:
        pass


if __name__ == "__main__":
    main()
