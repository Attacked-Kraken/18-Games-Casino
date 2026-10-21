# needs/ - the Muses' check-in answers (owner Oct 21 2026)

When the Mac asks "what do you need?", each window writes `needs/window-N.md` with three lines:

```
BLOCKED BY: ...
UNCLEAR: ...
MISSING: ...
```

Write `NONE` on a line when there is nothing. Commit it on branch `needs/window-N`, pull request title `NOTES window N needs`; the merge robot merges it. The controller shows every answer; the VP fixes what it can (missing paths, wrong orders, robot bugs) and only questions that need the owner reach him.
