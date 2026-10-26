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
