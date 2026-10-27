# FACTORY LOOP - the closed loop for problems that keep coming back (owner Oct 26 2026 10:46 PM, LOCKED)

Goal: a problem that happened once is measured, fixed at the root, proven by a real event, and then watched - so it never comes back unseen.
Owners: GPT (free outside advice, never trusted) -> window 13 (checks it against main) -> window 14 / the owning builder / the VP Claude (fix) -> the robot or Mac (proof).

## The loop (every problem goes through all 6 steps)
1. DETECT - a number from GitHub or the Mac says it happened (not a feeling). 2. CLASSIFY - one class below. 3. ASK - GPT is asked the class question in reviews/GPT-QUEUE.md.
4. VERIFY - window 13 checks GPT's answer against main (TRUE / FALSE with file + line). 5. FIX - one fix at the root, one job, with a test. 6. PROVE - a real later event shows the fix working (e.g. merged_by github-actions[bot]); until then the line says UNPROVEN.

## Problem classes and their numbers (baseline Oct 26 2026 10:46 PM, from GitHub)
| Class | Number to watch | Baseline | Source |
|---|---|---|---|
| MERGE BOT | minutes PR opened -> merged (median / p90 / max); PRs closed unmerged | 95 merged in 48 h: median 1.6, p90 19.6, max 179 min; 5 closed unmerged | pulls API |
| MERGE BOT | PRs open 3+ h | Racer #1877 #1884 #1902 open | pulls API |
| CHECK ROBOT | runs cancelled / failed in setup | last 100 runs since 10 AM: 21 cancelled, 5 running | actions API |
| FETCH BOT | models rejected by acceptance; re-fetch tries | tools/model-accept.mjs live since 7:43 AM, no tally yet | models/tried.json, audit.md |
| COURIER / MAC | messages typed twice, unsent, unread answers | fixed 8:47 PM (final send), 10:25 PM (unsent arrow) | laptop log |
| WINDOWS | idle builder minutes with open steps | Mac `quiet-record` | Mac |
Add a row when a new class shows up. A class with no number is not a class yet.

## Findings from window 13 (file = reviews/auditor-13-N.md) - status table
| Id | Class | Claim | Verdict | Fix | Status |
|---|---|---|---|---|---|
| F-1 | MERGE BOT | tools/merge-robot.py merges without `sha:` (head can change after checks) - robot-auditor.py already does it right | TRUE (code), no incident seen | add `sha` to the merge call (PR below) | FIXED in code - UNPROVEN until a merge refused for "Head branch was modified" or a normal merge by the bot shows it works |
| F-2 | CHECK ROBOT | no universal portrait clipping / tap-size check (per-game only) | NOT IN OUR CODE, POLISH | robot check | OPEN - GPT asked how |
| F-3 | PLAY | no common core-play sequence across the six games | see auditor-13-2 | - | OPEN |

## Morning report (the VP writes it from this file + GitHub, owner reads one page)
Every morning 7 AM Central: what GPT asked, what 13 verified (TRUE / FALSE counts), what was fixed (PR + merged_by + time), what is UNPROVEN, the numbers above against the baseline.
