# LAUNCH GATE — one scorecard for every game (Window 11 - Senior Advisor, owner-ordered Oct 22 2026)

Every game travels the same road: **LAB → CERTIFIED → ARCADE → LIVE**. A game moves only when every box at its gate is ticked with proof, not opinion. Any red box stops the promotion — no exceptions, no "merge it and see." The VP runs the gate; testers supply the play proof; only the owner can say LIVE.

Copy the header onto the game's claim before scoring:

```
GAME: <file> · VERSION (main sha): <sha> · DATE: <date>
TESTER: window <7-10> · PLAYED: <minutes> · VP CHECK: <name/date> · OWNER VERDICT (LIVE only): <date>
```

## Gate 1 — LAB (Game Development)
Where games are built. Ugly is allowed here; nothing here is promised to anyone.
- [ ] Plays start to finish in the local harness with zero page errors.
- [ ] Every PR robot-green on its branch, report filed in jobs/.
- [ ] Named owner window; open problems live as QUEUE lines, each with a failing proof test.
A LAB game never appears in the Arcade, not even hidden.

## Gate 2 — CERTIFIED (ready for the Arcade floor)
All of these, on **current main** — a green PR branch is not proof (a game has already been green on its branch and red on main):
- [ ] Full main game-check green on the exact version above, including ground contact, camera and controls — no red line waived, known-flaky yellows named.
- [ ] Tester played **every mode and event start to finish** on that version; report carries real window number and minutes played; no open TESTER lines.
- [ ] Real rules pass: the sport's (or game's) rules sheet checked line by line — sizes and measurements in the running game match the real thing (a puck is 7.6 cm, not 38).
- [ ] Looks pass: robot's close-up picture next to the reference picture and the looks/ sheet — right gear, right venue, player fills the frame, nothing blurry or toy-like at phone size.
- [ ] Phone pass: played on a real phone (not only the robot's machine) — controls reachable, buttons at least 44 px, smooth enough that the tester would keep playing.
- [ ] Score: current SCORES.md grade **35/50 or better, with plays-right at 7/10 or better** and no single score under 5/10.

## Gate 3 — ARCADE (on the floor, invite-only players)
- [ ] Arcade integration proven in the shell: player sign-in, saved progress, tickets/coins, avatar/gear, friends and tournament hooks all work inside the Arcade — not just in the loose game page.
- [ ] Analytics firing: plays, finishes and quits for this game appear in the owner's dashboard.
- [ ] The exact certified version is what the Arcade serves (version number shown and matching); a rollback copy of the last good version is saved.
- [ ] No casino-side content: nothing crosses from the development-only catalogue into the Arcade build.

## Gate 4 — LIVE (public, App Store / Google Play)
- [ ] Score **40/50 or better** ("would you pay for it" line) and the owner's own full play-through with verdict recorded — the owner approves the look and the feel, not basic defects.
- [ ] Store basics in place: privacy labels true, account deletion works, support contact live, age rating matches the catalogue, payments only through the store.
- [ ] Safety proven before strangers arrive: a backup from the last 24 hours exists **and a restore from it has been tested**; health log clean for 7 days.
- [ ] Staged opening: invite players first, watch crashes/quits for a week, then open the doors. Any stage can send the game back a gate.

## Demotion — the road runs both ways
A LIVE or ARCADE game that fails a main check, draws the same complaint twice, or breaks a real rule drops back one gate the same day, and its QUEUE lines reopen. Demotion is routine, not punishment — it is how the floor stays trustworthy.

*One page, on purpose. If a box can't be ticked, the answer is which job fixes it — write that job, don't argue with the gate.*
