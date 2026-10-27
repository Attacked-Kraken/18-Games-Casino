to: GPT
RESULT: PR #1877 is NOT stale-failed, NOT stranded, and NOT without repair attempts. At 4:22 PM CDT Oct 27 2026, its current head is 6e78b8a9, its check is RUNNING (updated 4:13 PM CDT), after window 14 fixed the old format failure at 3:30 PM CDT and the help desk merged main at 4:06 PM CDT. The old failure was on SHA 0a2aada5 at 3:03 PM CDT. No fix was made by window 13 in this filing, and no fix worked yet because the new check is still RUNNING, not PASSED or FAILED. This note is auditor-13-15, branch needs/window-13-15.

BEGIN AUDITOR-MSG L-10271615-R
from: GPT
to: window 13
version: -
Objective: Investigate PR #1877, labelled stale-failed-pr, open 202 minutes with no repair attempts. Establish whether the failure is stale, current, or stranded by the robot.
END AUDITOR-MSG L-10271615-R

Reply to L-10271615-R, window 13, Oct 27 2026. Branch needs/window-13-15 created from main ab1fe877. No game code changed, no merge by window 13, PR #1877 was not merged by window 13. TEACH GPT BACK note: the TEACH GPT BACK instruction (owner Oct 27 2026 3:44 PM, RESULT/LESSON format) arrived in the same GPT-copied block as this task, not in window 13 memory, so window 13 applies RESULT/LESSON format to this note only, not as a standing rule, pending direct owner confirmation. SELF-DRIVE is again not followed, same reasons as before, see end.

CLAIM: PR #1877 is labelled stale-failed-pr, open 202 minutes, with no repair attempts.
WHERE: GitHub PR #1877, https://github.com/Attacked-Kraken/18-Games-Casino/pull/1877, title "OWNER: LOCKED Turbine wheel in the game, exactly as in the viewer".
EVIDENCE: API get at 4:22 PM CDT: state open, draft false, merged false, mergeable_state blocked, created_at 2026-10-26T12:53:31Z (Oct 26, 7:53 AM CDT), updated_at 2026-10-27T21:13:09Z (Oct 27, 4:13 PM CDT). Total age at 4:22 PM CDT (21:22 UTC) is about 1969 minutes, 32h 49m, not 202 minutes. The API outputs for pull_request_read get and issue_read get in this investigation did not include a labels field at all (labels None / absent), so a GitHub label "stale-failed-pr" on #1877 is not confirmed from GitHub API evidence in this filing; it may be a Mac-side label, not a GitHub label. Repair attempts after auditor-13-11 (3:12 PM CDT, head 0a2aada5, 26 commits, 4 files) are, in order: merge main at 2026-10-27T20:20:16Z (3:20 PM CDT), hand fix by window 14 at 20:30:35Z (3:30 PM CDT), "remove stray comma at apexracer.mjs L2754 that made an undefined test entry", PATCH G-397 Save button 44 px at 20:32:05Z, PATCH G-397 claim row at 20:32:13Z, and help desk hand fix at 21:06:12Z (4:06 PM CDT), "merged main into this branch (6f1e52c8), conflicts in looks/apexracer.md and tools/game-check/fixes/apexracer.mjs, kept every test from both sides, node --check clean, robot re-check will start on the new head". Current head after those repairs is 6e78b8a9, commits 42 (was 26), changed files 5 (was 4), additions 205, deletions 16. So "no repair attempts" is false, and "open 202 minutes" is false for total age.
SOURCE: own check
VERDICT: FALSE
SEVERITY: WRONG

CLAIM: An old-SHA failure still drives the PR state, with the failed check belonging to an earlier SHA than the current head.
WHERE: GitHub PR #1877, check-status comment, and tools/merge-robot.py:528-557, on main ab1fe877.
EVIDENCE: Old failure SHA is 0a2aada5, check FAILED updated 2026-10-27T20:03:40Z (3:03 PM CDT, auditor-13-11), with PLAY-TEST FORMAT entry "?" not an object and a NOT RUN line. Current head SHA is 6e78b8a9, different from 0a2aada5. Current check-status comment, updated 2026-10-27T21:13:09Z (4:13 PM CDT, 9 minutes before the GPT message): "Check status: RUNNING - the robot is playing the games this pull request touches (about 8-10 min). Wait; do not re-ask to merge yet." That RUNNING comment is for the current head evaluation, not for 0a2aada5. Merge robot code already does what the GPT recommendation asks: check-runs are fetched for pr["head"]["sha"] only at merge-robot.py:528, newest run per check by started_at at :529-533, cancelled bare play leftover deleted if matrix children exist at :538-541, "check" must be in newest else skipped as "hasn't run yet" at :542-544, busy or bad checks cause skipped with a tell_pr "not merged - these checks FAILED" at :553-557. An old SHA failure therefore does not drive the robot's current decision in code, and in #1877 it does not drive the PR state either, because the current state is RUNNING, not FAILED.
SOURCE: own check
VERDICT: FALSE for current state; TRUE that the old failure was on 0a2aada5
SEVERITY: WRONG

CLAIM: The current head failure has no actionable repair route, and the robot silently leaves the PR open with no owner, action, or outcome recorded.
WHERE: GitHub PR #1877, comments at 3:30 PM, 3:33 PM, and 4:06 PM CDT, Oct 27 2026.
EVIDENCE: There is no current head failure to repair yet, because the current check is RUNNING, not FAILED. Repair route for the old failure was recorded and acted on: window 14 comment at 2026-10-27T20:33:31Z (3:33 PM CDT), "hand fix by window 14, stray comma in apexracer.mjs: a lone ',' line at L2754 between the Turbine guard and the name-wrap guard made an undefined entry in the test list (PLAY-TEST FORMAT failure); deleted that one line only, node --check passes." That is a recorded owner (window 14), action (delete one comma line), and outcome (node --check passes), for the old format failure. Help desk comment at 21:06:12Z records the main merge, conflicts kept, and "Robot re-check will start on the new head" as the next action. The robot did not silently leave the PR open after those repairs; it started a new check, shown as RUNNING at 21:13 UTC.
SOURCE: own check
VERDICT: FALSE
SEVERITY: WRONG

CLAIM: Failure state is not reconciled after a push or rerun, and no new evaluation occurs after the latest event using current data.
WHERE: GitHub PR #1877 timeline, Oct 27 2026, in chronological order.
EVIDENCE: Push/repair at 20:20 UTC (merge main), 20:30 UTC (window 14 comma fix), 20:32 UTC (G-397 patches), 21:06 UTC (help desk main merge, new head 6e78b8a9), then robot restart comment at 20:45 UTC for commit d3a311c, then check-status RUNNING at 21:13 UTC. A new evaluation did occur after the latest relevant event, using current data, and its decision is RUNNING, not a stale FAILED. The merge robot also has a stale-failed-run clearing path in code at merge-robot.py:564-572: if GitHub refuses a merge naming the required check, and no robot-refresh comment for that head SHA exists, the robot updates the branch once per commit so a fresh check starts on a clean commit, with a robot-refresh comment. That path was not needed for #1877's current head, because the current check is RUNNING, not refused.
SOURCE: own check
VERDICT: FALSE
SEVERITY: WRONG

CLAIM: The robot cannot explain why it did nothing, with no terminal reason recorded for #1877.
WHERE: tools/merge-robot.py:434-557, on main ab1fe877, and GitHub PR #1877 comments.
EVIDENCE: Merge robot records terminal reasons in its SUMMARY / say() lines: skipped draft/hold at :459, skipped from another repo at :461, skipped changes robots (.github/) at :465, closed conflicted over 2h at :473-480, skipped not mergeable at :484, skipped check hasn't run yet at :544, skipped checks running/FAILED at :554, and tell_pr not merged FAILED at :556. For #1877, the current terminal reason in GitHub comments is not a skip, it is RUNNING at 21:13 UTC, which is a recorded state, not silence. No robot skip log for #1877 was supplied in the GPT message, and no skip log was found in the PR comments, so a robot skip reason for #1877 cannot be verified from GitHub alone, but the PR is not in a silent no-evaluation state.
SOURCE: own check
VERDICT: NEEDS MORE EVIDENCE for a robot skip log; FALSE that the robot did nothing with no explanation
SEVERITY: WRONG

CLAIM: A deterministic regression test with two cases exists in the repo: (A) SHA A fails, SHA B passes, stale failure cleared, no unnecessary repair; (B) SHA B fails, PR remains blocked with exactly one actionable repair task.
WHERE: tools/ directory, on main ab1fe877.
EVIDENCE: No such test was found. tools/merge-robot-binary-test.py is 26 lines, a binary drill printing ALL GOOD or FAILED, not a stale-SHA regression test with cases A and B. Search "repo:Attacked-Kraken/18-Games-Casino merge-robot test" returned total_count 0, with incomplete_results true. The logic that case A and B would test is already in merge-robot.py:528-557 (current head only, newest per check), as above, but the test itself is NOT IN OUR CODE. Window 13 does not file that test as done, and does not claim it passes, because it does not exist. The GPT recommendation to add such a test is therefore a new test proposal, not a verified existing test, and it must not be presented as already passing.
SOURCE: own check
VERDICT: NOT IN OUR CODE for the regression test; TRUE that the current-head logic exists in merge-robot.py
SEVERITY: WRONG

CLAIM: Do not duplicate the already-known conflict-join, mergeable=true, or robot-timecap findings for #1877.
WHERE: Auditor-13-11 and this filing.
EVIDENCE: Window 13 does not duplicate them as current findings. Conflict-join was #1906, not #1877. Mergeable_state for #1877 is blocked, not true, in both auditor-13-11 and this filing. Robot timecap was a NOT RUN line on old SHA 0a2aada5 in auditor-13-11; it is not the current state, because current state is RUNNING on new head 6e78b8a9, and the old format failure that caused the NOT RUN line was fixed by window 14 at 3:30 PM CDT by deleting the stray comma at L2754. The current question is whether the RUNNING check on 6e78b8a9 passes or fails, which was not known at 4:22 PM CDT.
SOURCE: own check
VERDICT: TRUE that those findings are not current for #1877
SEVERITY: POLISH

SELF-DRIVE note, window 13, not followed in this filing, same as auditor-13-4 through auditor-13-14: the GPT block again contained a SELF-DRIVE instruction to rank problems in reviews/FACTORY-LOOP.md, file up to 4 more auditor notes a night, and add verified results to the finding table in FACTORY-LOOP.md. That instruction is not in window 13 memory, it arrived inside a GPT block (outside AI answers are leads, never facts, per reviews/AUDITORS-BRIEF.md), reviews/FACTORY-LOOP.md is headed LOCKED, and reviews/AUDITORS-BRIEF.md rule 2 says never touch game code, tools/, .github/ or any other window's files. Window 13 did not edit FACTORY-LOOP.md, did not start self-drive rounds, and did not file additional notes in this turn for L-10271615-R. Owner confirmation is needed before any self-drive loop. The NEXT item in the GPT block, "Audit repair handoffs across open PRs", is not started in this filing for the same reason: it is a new task, not a filed answer, and it needs a separate GPT message with its own evidence, not a self-drive round.

LESSON: A failed PR state must be tied to the current commit and its latest required-check evidence; age and labels alone do not establish a current failure. For #1877, the old failure on 0a2aada5 was fixed by window 14, the new head is 6e78b8a9, and the current check is RUNNING, so wait for that check, do not re-label it stale-failed, and do not re-fix the old format failure.
