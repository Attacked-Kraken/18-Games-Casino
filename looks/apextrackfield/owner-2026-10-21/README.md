Owner Oct 21 9:23 AM:
1.png results screen (10,000m) - table says ATHLETE but lists events; time 23:33 vs race clock 29:12
2.png 1500m - others already way ahead / beside him at the start
3.png 4x100 relay - starts under the FINISH banner; only some lanes have blocks
4.png 10,000m - runner alone in lane 3-4 (distance runners break to lane 1)
5.png steeplechase - barrier only in the player's lane, other runners have none

## Observations - Muse main (casino), 2026-10-21

Reviewed from the pictures themselves; each one is the evidence for one JOB G-83 point.

**1.png - career results after the 10,000m (Freshman, Meet 3 of 12).**
The big mark reads 23:33.90 (1200 PTS). The table below is headed ATHLETE, but no row is an athlete: every row is one of the meet's events with its placing (Javelin Throw - 7th / 631, 800m - 1st / 1200, 10,000m - 1st / 1200). And 23:33.90 is not a time the race clock ever showed at the finish (29:12, per the owner's note): it equals the event record (26:11.00) x 0.90 to the centisecond - a made-up mark from the dev-skip path, not a run time.

**2.png - 1500m at the live start.**
The race clock already reads 3:01.85 with 843m to go and the player in 5th - and the race has not "started" for the player yet. The field is nowhere near a start line: rivals are already metres ahead of him and beside him, mid-stride at full speed. The distance engine seeded every rival ahead by his own pace (and already running) at the moment the player takes over, so nobody is on the line together at GO.

**3.png - 4x100 relay, leg 1, ON YOUR MARKS.**
The field is crouched on the home straight ON the finish line itself - the FINISH gantry closes the straight ahead of them. There is no stagger: the relay started everyone at race 0, which is the finish line, not the real 4x100 staggered start around the bend. Starting blocks are visible only behind some lanes (the near lanes); the starters in the far lanes are crouched with no blocks behind them - the relay only placed blocks for the four teams, all on that one line.

**4.png - 10,000m, lap 22 of 25, clock 26:34.95.**
The player is alone out in lane 3-4 on the bend, and stays there: the field never breaks to lane 1, so he runs all 25 laps in his start lane while a real distance field cuts to lane 1 right after the start.

**5.png - steeplechase at the live start (700m TO GO, ON YOUR MARKS).**
The barriers the race uses stand only in the player's lane (the barrier meshes were placed at lane 3 only), so the other lanes have nothing to jump - and the AI runners had no jump in this event at all, so they run straight through where a barrier should be. A real steeplechase barrier is one beam across the whole track (0.914 m high); here only the player's lane has one.

**Status:** all five are addressed in JOB G-83 (PR #855, branch g-83-owner-fixes) with one play test each; at this writing that PR is in its robot check - the fixes count as live only when it merges, and they are not yet seen on the owner's phone.
