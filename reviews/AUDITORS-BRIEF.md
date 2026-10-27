# Auditors 13 + 14 - brief (owner Oct 26 2026)

Window 13 = AUDITOR. Window 14 = BUILDER OF VERIFIED FIXES. Both reach ONLY this repo (Attacked-Kraken/18-Games-Casino).
Nothing here is trusted until it is checked against main. Outside AI answers (ChatGPT / Grok) are leads, never facts.

## Mailbox (flat files in reviews/, so the merge robot treats them as notes)
- Findings (13 writes): `reviews/auditor-13-<n>.md`
- Verified fixes (14 writes): `reviews/auditor-14-<n>.md` (the proposal only - game code still goes through a normal BUILD job)
- Replies (VP / robot / owner's Claude): `reviews/auditor-reply-<n>.md`
- One PR per file. Title `NOTES window 13 audit <n>` / `NOTES window 14 fix <n>`. Branch `needs/window-<N>-...`. The merge robot merges it.

## Finding format (window 13) - every line must be checkable
```
CLAIM: <one sentence>
WHERE: <file path + function or line on main, or the game screen>
EVIDENCE: <robot picture link, test id, number with unit, or the exact text on main>
SOURCE: <own check | ChatGPT | Grok | owner>  (outside sources: say UNVERIFIED until you checked main)
VERDICT: TRUE | FALSE | NOT IN OUR GAME
SEVERITY: BLOCKER | WRONG | POLISH
```
Only TRUE lines become jobs. FALSE / NOT IN OUR GAME stay on file so the same claim is not re-checked.

## Rules
1. Read main before claiming anything. State the commit you read (first 8 characters).
2. Never touch game code, tools/, .github/ or any other window's files.
3. Locked rules win over any outside advice: six-game lock, one fix per job, house look, shared controls.
4. Never ask the owner to decide what you can measure. HELP-OWNER only for how a game should look or feel.
5. Say `unverified` when you are not sure. Write a one-line receipt as the first reply to every order.
6. Window 14 only proposes a fix after window 13 (or the robot) shows a TRUE finding with evidence. It then writes the fix plan + the failing test id; the owning builder window gets the job.

## VALUE RULE - LOCKED (owner Oct 26 2026 10:34 PM: "make sure GPT and 13 are doing valuable work, not simple tasks")
Valuable = it can change what the owner ships. Work on these, in this order:
1. A TRUE defect or gap in one of the six games (Baseball, Hockey, Flight, Track & Field, F1, Exotic Racer) that the robot did NOT already catch - proved by a test id, file + line on main, or a robot picture.
2. A blind spot in the robot itself: something that looks wrong on the robot's picture or in a recording while the check says PASSED (name the check and the picture).
3. A screen, tab, option, mode, control or end screen of a game nobody has a picture + failing test for (UNIVERSAL.md "every aspect is checked") - list the gaps for ONE game at a time, most owner-visible first.
4. Checking a claim another window or an outside AI made, when that claim would change a job (TRUE / FALSE with evidence).
NOT valuable - never send, never accept: write-a-file / create-a-branch / list-things tests, re-checking something already marked TRUE or FALSE on file, vague "investigate X" with no proof path, anything that only proves the pipe works (that is the Mac's job).
If nothing valuable is left, the answer is one line `IDLE: <why>` and NO file - an idle auditor costs nothing, busywork costs usage.
Every message between GPT and window 13 names: the game, the defect or gap, the evidence path, and who would fix it (robot / one builder window / owner decision).

## SELF-DRIVE - LOCKED (owner Oct 26 2026 10:53 PM "sending by itself, 13 finds the worst things for GPT to fix")
Window 13 chooses the work. After each answer it ranks the open problems in reviews/FACTORY-LOOP.md (minutes lost, repeats, games affected), takes the worst one with no GPT answer yet, and files the next reviews/auditor-13-<n>.md to GPT (one question, real file text pasted). Verified results go into the finding table. Max 4 rounds a night, stop on IDLE. Nobody else has to push a message.

## WINDOW 14 STANDING JOB - JOIN CONFLICTED PULL REQUESTS (VP, owner Oct 27 2026)
When the laptop courier types "CONFLICT FIX C-<N>": check out that PR's branch, merge origin/main into it, keep BOTH sides'
intent at every conflicted spot (never just take one side), `node --check` every changed .js/.mjs, push to the SAME branch, and
comment on the PR "conflict joined by window 14, C-<N>". The robot re-checks and merges it. If the two sides truly contradict,
reply IDLE with the exact lines and file one HELP-VP line. The courier follows each order until the PR is clean or merged.

## TEAM - who does what, 24 hours a day (owner Oct 27 2026 12:00 PM)
- **ChatGPT (window 15, laptop square 3)** - outside thinker. The Mac sends it LIVE factory problems (hidden finder, Fixer cases) with measured facts, hourly, and the GPT-QUEUE.md questions every 3 h when nothing is live. It answers in ONE block `from: GPT / to: window 13`.
- **Window 13 (auditor, laptop square 4)** - checks every ChatGPT answer against this repo (TRUE / FALSE / UNTESTED, with file + line or a test), fixes or files the TRUE ones, and asks ChatGPT follow-ups as reviews/auditor-13-<n>.md `to: GPT`.
- **Window 14 (verified fixer, laptop square 5)** - joins conflicted / stuck pull requests (merge origin/main in, keep both sides, push to the SAME branch, comment) and builds the fixes window 13 marks TRUE.
- **Claude** - last resort. **The owner** - only 3D models and approval cards.
- Only real defects with proof. No busywork: nothing to do = write `IDLE: <why>`.

