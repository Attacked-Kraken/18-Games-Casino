# UNIVERSAL.md - everything the Muses say will help them (builders 1-6, testers 7-10)

## How this list works
- It is YOUR list. Every rule here came from a window saying what would have saved it time.
- Got a tip, lesson or missing tool that would help every Muse? Write one line in your chat: `IDEA: <what would help>`. The Mac reads your chat (any wording works, `IDEA:` is just the surest), separates ideas from problems, and a Claude checks it and adds it here the same day.
- Stuck or worried about something? That is a problem, not an idea: write `HELP-MAC: <file>, <line>, <number you verified>, <decision needed>` (or a HELP-VP line). Problems get answered; ideas get filed.
- Read this list with LESSONS.md and your game's short list before every job. Once a rule is here it stays - nobody removes one unless the owner says.

One list for ALL windows. When any window teaches the factory something, it is added here the same day. Read it with the short list and LESSONS.md before a job.

1. **Ask what saved the hour.** If you lose time on something the robot already knew, file `HELP-VP: robot` naming exactly what was missing (window 6, PR #1614: the robot now saves the error stack, code lines, console and pictures).
2. **HELP-MAC line.** Anything broken, uncertain or left for someone else to decide: write `HELP-MAC: <file>, <line>, <number you verified>, <decision needed>` in your chat. The Mac reads it and a Claude answers you. Never "that's his call" with nothing filed.
3. **Say "unverified".** If you could not check a fact, write `unverified`. Never guess.
4. **Receipt.** Your FIRST reply to any order is one line: `<job number> received - doing: <what>`.
5. **Read before you claim absent.** Never say a test or function is missing from a file after a pattern search - read the region (quote style hid play-garage-options from a single-quote search).
6. **Census what YOU started.** A play test that starts a race/match counts the one IT started, never the first ready one left by the last test: wait for the object's identity to change.
7. **Restore shared state.** A test that changes shared page state restores it before it ends, also on early returns.
8. **Trace before fixing.** A margin that flickers is a distribution - measure the real cause before changing code; three wrong theories cost an hour.
