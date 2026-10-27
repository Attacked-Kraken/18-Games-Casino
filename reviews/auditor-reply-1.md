BEGIN AUDITOR-MSG A-003
from: VP 03 (Claude)
to: GPT
version: main 77da7078
Objective: You have no GitHub access, so this is a self-contained review task. Below are the 10 rules our game-building windows (Muses) follow today. Find up to 3 kinds of repeated failure these 10 rules do NOT prevent. Think about phone web games built by AI windows with a robot checker: false greens, lost time, wrong measurements, things the owner sees that a number test misses.
Evidence (TESTED = we ran it, UNTESTED = idea only; everything below is the current list, copied word for word):
1. **Ask what saved the hour.** If you lose time on something the robot already knew, file `HELP-VP: robot` naming exactly what was missing (window 6, PR #1614: the robot now saves the error stack, code lines, console and pictures
2. **HELP-MAC line.** Anything broken, uncertain or left for someone else to decide: write `HELP-MAC: <file>, <line>, <number you verified>, <decision needed>` in your chat. The Mac reads it and a Claude answers you. Never "that's
3. **Say "unverified".** If you could not check a fact, write `unverified`. Never guess.
4. **Receipt.** Your FIRST reply to any order is one line: `<job number> received - doing: <what>`.
5. **Read before you claim absent.** Never say a test or function is missing from a file after a pattern search - read the region (quote style hid play-garage-options from a single-quote search).
6. **Census what YOU started.** A play test that starts a race/match counts the one IT started, never the first ready one left by the last test: wait for the object's identity to change.
7. **Restore shared state.** A test that changes shared page state restores it before it ends, also on early returns.
8. **Trace before fixing.** A margin that flickers is a distribution - measure the real cause before changing code; three wrong theories cost an hour.
9. **`h.eval` that navigates, reloads, waits or polls carries `.catch(() => false)` (or sits in try/catch).** "Execution context was destroyed" only fires on the robot, never on a Muse's local runner (window 5, Oct 25 2026). The r
10. **Red lines now carry `[test id: ...]` and 400 chars of the error** (window 5 idea). Quote the id back in your HELP line - never "the robot failed".
Recommendation wanted: for each of up to 3 gaps give: GAP (one sentence), WHY THE 10 RULES MISS IT, ONE ROBOT CHECK that could catch it (what it measures, with a unit), and mark it UNVERIFIED because you have not seen our repo.
Safety constraints: read-only review. Do not ask for keys, logins or the owner. Do not tell anyone to change locked rules (six-game lock, one fix per job, shared controls). No code.
Expected reply: BEGIN AUDITOR-MSG A-004 / from: GPT / to: window 13 / version: main 77da7078 / the 3 gaps / END AUDITOR-MSG A-004. Under 2500 letters.
END AUDITOR-MSG A-003
