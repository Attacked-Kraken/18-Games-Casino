# Advisor report — game factory
Read: AGENTS.md, STUDIO-STANDARD.md, DONE.md, REALITY.md, LESSONS.md, jobs/HELP.md, and the last 20 jobs, G-81 to G-104. Read-only. Nothing in the repo was changed, pushed or merged.

## The 5 biggest reasons work is redone or stuck, biggest first

### 1. Jobs are sent for work that is already done
Four of the last 20 jobs ended as NO CHANGE, and at least two more were mostly already done. The tester or patch the job was based on was older than the fix already on main.
Example: G-92 and G-93 were two separate jobs, a day apart in work, both asking for the Hockey reality hook that G-86 had already shipped. G-84 was a patch that no longer fitted and would have added a second hook and undone a better aim fix. G-96 spent a job proving a closed pull request had already been merged another way.
Fix: before the Mac sends any job, it checks that job against today's main — if the named test already passes or the named part already exists there, the job is closed as already done and never reaches a window.

### 2. The robot checker is often wrong, slow or flaky, and everything waits on it
Builders are not mostly fighting games. They are fighting the ruler: readings taken on a busy, slow robot with no real graphics chip, tests that depend on luck, and downloads that fail by chance being counted as missing files.
Example: G-100 Baseball is still not merged. It was blocked only on ground contact: the shared human rig has no toe bones, so its lowest foot point reads about 8 cm up and could never pass a 3 cm rule, and the robot's stretched clock first called a sprint walking. That one job needed three separate robot fixes, and a test that waits for a random strikeout or walk kept failing it too. G-97 was blocked four times by the same old feet-float rule, and G-82 was failed on hair files that were there all along — a cut-off download was counted as a missing file.
Fix: a red line from a known robot fault is owned by the robot side and fixed first, and it does not block or re-test builder jobs while it is open. Any test that waits on luck, a cut-off download, or the robot's own clock must read as not proven, not as failed.

### 3. Looks and real sport rules are only really checked when you play it
The robot proves a game runs, measures sizes and directions, and takes pictures. Nobody with eyes and the sport's rules has to pass the look, the close camera and the opponents before you see it — so you are the first real check, and the game comes back.
Example: a Hockey puck shipped at about 38 to 40 cm across, five times the real 7.6 cm, and was only shrunk in G-102. In LESSONS, you played Track & Field event by event and found rival hurdlers running through hurdles, a relay with no one to hand the baton to, a pole vault with no pole, and a high jump run on the grass — all while the robot was green.
Fix: no game reaches you without one named pass first, on the robot's own pictures: a close picture of the player in his real gear, the venue, and one full play of every mode or event with the opponents following the same rules as the player. That pass is a job with a name on it, not a hope.

### 4. Job orders get lost, or point at things that are not there
A job lives as a message typed into one window. If only the reminder arrives, or the files it names are on an unmerged branch, the window loses hours searching the repo for something that was never in it.
Example: window 8 got a reminder for G-103 but never the order, searched the repo, and had to raise a HELP line to be told it was a Hockey tester round. There is still no G-103 report in the jobs folder. Before that, the jet job pointed at a model folder and a control that sat on unmerged pull request 873, and that window lost the day.
Fix: the Mac does not send a job it has not checked: every file, model and picture named in it must be found, with its branch or pull request number written in the job. A reminder is never sent on its own — the full order goes with it, every time.

### 5. Every game is one big file with its own copy of the shared parts
So the same fault is fixed game by game, a fix in a shared part breaks another game, and merging an old branch can wipe work.
Example: letting go of the stick so nothing stays stuck was fixed in Baseball in G-82, fixed again in Baseball in G-85, fixed in Hockey in G-86, fixed in F1 in G-91, then proved all over again for Hockey in G-98. The shared controls file the standard promises is still not in the kit folder today. Add to that: pull request 902 merged from an old main and wiped G-88's two tests, and a missing bracket added in G-87 left the whole Baseball test file unable to run at all until G-100 found it.
Fix: build that one shared controls file as its own job, make all six games use it, and have the robot fail any game that grows its own stick again. One shared fault then gets one fix, once.

## What a factory like this should have, that you do not — free only
Checked against TOOLS.md, so nothing here is something you already list.

- The shared controls file above. It is promised in the standard and still missing from kit/.
- Gear kits for the other five sports. Today only hockey has one. Baseball, Track & Field, Flight, F1 and Exotic Racer players have no ready-made real gear and stance that rides the skeleton, so each builder makes do, and people come back looking wrong.
- Real sport movements. The shared bodies have 11 general clips. There is no approved set of pitching, batting, sprint start, hurdle, skating stride, throw and jump movements. The CMU motion capture library in TOOLS.md is still in the ask-the-owner-first list, not approved. It is free — approve it, or an equal free source, and retarget those movements once for everyone.
- A real phone in the loop. The robot has no graphics chip, so its speed readings are only a hint and its slow runs invent faults. One used mid-range iPhone and one mid-range Android, plugged in on the Mac, playing each merged game for real — a second-hand cost only if you buy one; using a phone you already own costs nothing.
- A picture-difference check. The robot posts pictures, but only a person notices they do not match the reference. Free tools like pixelmatch, run by the robot, can show how much the close-up picture changed and flag a player who got smaller, blurrier or further away than the last good picture.
- One run of the real test set-up, copied on the Mac. Builders keep getting local results the robot disagrees with, and tests written with the wrong test library's calls. One saved, known-good test setup that every window copies would end local-it-passes, robot-it-fails rounds.

## What I would stop doing
- Stop sending a job, a patch or a tester complaint made against an old copy of main. If it is not checked against today, it does not go out.
- Stop calling merged, or robot-green, done. It is not done until someone has looked at the pictures and played the whole game, every mode.
- Stop fixing the same shared fault one game at a time.
- Stop adding a new rule file, or a new rule, after every failure. AGENTS.md tells every window to read about a dozen files before every job, and LESSONS.md alone is over 5,000 words and still growing. No window can hold that. Cut it to one short list per game, and when a rule changes, take the old line out — the camera rules already had to be fixed once for being stacked instead of replaced.
- Stop letting you be the first person to play a mode, an event or a career all the way through. That is the testers' pass, before it reaches you.
- Stop starting a redo from complaint words. Every send-back starts from the failing test and the reference picture, or it does not start.

ANSWERED (help desk, Oct 21 9:40 PM): 1 (jobs for work already done): FIXED - the Mac checks every step against today's main before sending (step_done_on_main, queue_close_pass, done-in-file; Mac v63/v72/v74). 2 (robot wrong/flaky): FIXED - game PRs #929, #953, #963 (known-faults.json), #990; luck/cut-off-download tests now read as inconclusive, not failed. 3 (looks + rules need a named pass): FIXED in part - close-up picture of the player in every check, picture-difference vs the last 👍, tester rounds rotate recheck / mode / sport rules / break-it; the owner is no longer the first to play a mode. 4 (lost orders, missing files): FIXED - refs_check holds a job whose path or ApexKit name is not on main and names the branch/PR; every reminder carries the full order. 5 (shared controls): FIXED - kit/controls.js (PR #962) + robot fails a game with its own stick; the 6 games' switch-over jobs are in each window's list.
Free tools: gear kits for the other 5 sports and the shared test set-up = LATER.md (starts when the owner says the 6 games are done; a known-good test setup copy is queued there too). Picture difference = done (Mac v64). Real phone on the Mac = LATER.md, needs the owner's phone.
Stop doing: old-main jobs = done (item 1); merged/green is not done = Mac proves only clean games (PROVEN rule); shared fault one game at a time = done (item 5); trim rules = done (PR #966, rules/short/<game>.md, LESSONS.md 29 rules); redo from complaint words = redo flow (failing test + TARGET picture first, Mac v59).
OWNER: Advisor asks you to approve the free CMU motion-capture library (or an equal free source) for real sport movements - say yes or no when the 6 games are done.
