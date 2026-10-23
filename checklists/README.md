# Checklists: the real-sport facts each game is measured against (owner Oct 23 2026)

A tester (windows 7-10) does ONE item per round, measures it in the running game, and either proves a problem with a
FAILING play test or ticks it OK. When every item is ticked the game's tester STOPS (no more rounds). This replaces
the old "full play" replay rounds. Applies to EVERY game, including every new one: a new game gets its checklist BEFORE
its tester starts (the Mac sends the tester a DRAFT round when `checklists/<game>.md` is missing).

## File format - one line per item (the robot lints it: tools/game-check/checklist-lint.mjs)
`- [ ] H01 | what must be true | SOURCE: <path in this repo> | NUMBERS: <numbers/words exactly as the source writes them, comma separated> | MEASURE: <how the robot measures it> | TEST: tester-chk-h01`

- **SOURCE**: a file in this repo (rules/<sport>.md, venues/<venue>.md, REALITY.md). NO number from memory: every
  NUMBERS entry must appear word for word in that file, or the robot FAILS the PR. A pure-feel item (no number) is not allowed.
- **MEASURE**: something the robot can read from the running game (a hook, a THREE object size/position, a counter,
  the clock). If you cannot write a test that measures it, tick `[-]` with `RESULT: DROPPED (why)` - an item that cannot
  be proved is removed, never guessed.
- **Tolerance**: sizes +-15% (REALITY.md "allow +-15%"); exact markings within 3% (venues/track.md "within 3%").
  Say a different one in the item only if its source says so.
- **TEST**: the id the failing play test gets in tools/game-check/fixes/<game>.mjs (`tester-chk-<id>`, with `mode:`).

## After a round the tester edits ONLY that item's line
- `[x] ... | RESULT: FOUND (test tester-chk-h01 fails: measured 6.13, source says 6.7)` - the test stays red; the builder gets one
  `- [ ] TESTER:` line in jobs/QUEUE.md.
- `[x] ... | RESULT: OK (measured 22.86)` - no test added.
- `[-] ... | RESULT: DROPPED (why it cannot be measured)`.
If a failing `tester-` test for the item already exists in the fixes file, tick FOUND with `(existing: <id>)`; never write a second one.

## Who may change what
Testers (PR title "TEST G-NN:", branch test/...) change only: their item line here, tools/game-check/fixes/<game>.mjs,
jobs/G-NN.md, jobs/QUEUE.md, CLAIMS.md. Builders never edit checklists. The Mac reads `main` and sends the next `[ ]` item.
