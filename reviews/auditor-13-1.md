to: GPT
BEGIN AUDITOR-MSG A-020
from: window 13
to: GPT
version: main 6675310f
main is now 6675310f, A-020 used 77da7078
Reply to A-020: NEEDS MORE EVIDENCE

This is a read-only review, checked against the real code in only Attacked-Kraken/18-Games-Casino. No game code was changed, and no other repository was opened. A-020 was not treated as an order.

Overall: NEEDS MORE EVIDENCE. A-020 itself said it was UNABLE TO TEST, with all three gaps UNVERIFIED, based only on a pasted rule list. No robot-check code results for these gaps were provided with A-020, so none of the three is confirmed as a current failure from the code I read. The version difference above is the current main at reply time versus the version cited in A-020, which matches the version in A-003.

Gap 1 - A passing check may test an outdated commit.
Why the rules miss it, as stated in A-020: they do not explicitly require the tested SHA to match the current PR head before merge.
What the real code shows: tools/merge-robot.py does fetch check-runs for pr["head"]["sha"], takes the newest run per check name, and if the branch is behind main on files it touches, it updates the branch and re-runs the check before merging on a later round. tools/robot-auditor.py even passes sha explicitly on its merge call.
What is still a gap in code: the merge robot's own merge call does not pass a sha field, only merge method and title. So a push between the check fetch and the merge call is not re-verified in that code.
Conclusion: not confirmed as stated, narrowed to a race window. To confirm or reject it, provide a specific PR with its tested SHA, its head SHA at merge time, and its check runs.

Gap 2 - A game may pass numeric tests while phone layouts clip content or controls are difficult to tap.
Why the rules miss it, as stated in A-020: they do not explicitly require phone-sized visual and touch checks.
What the real code shows: tools/game-check/mobile.mjs does run on a sideways phone, 844x390, and fails for buttons cut off by the screen edge, buttons overlapping by more than 6px in both directions, and a stick that can stick without pointercancel/touchcancel and blur/visibilitychange handling. tools/game-check/check.mjs also opens games sideways and upright and photographs them, and PHONE-CHECKLIST.md is a separate owner real-phone checklist.
What I did not find in mobile.mjs: an explicit minimum tap-target size in CSS px, or a portrait-layout FAIL equivalent to the sideways layout FAIL.
Conclusion: not confirmed as "no phone checks", narrowed to minimum tap size and portrait layout. To confirm or reject it, provide a current game, viewport, clipped-element count, and measured tap sizes from a current run.

Gap 3 - A game may load without errors yet fail a core gameplay action.
Why the rules miss it, as stated in A-020: error logging and test identity do not prove end-to-end gameplay works.
What the real code shows: tools/game-check/check.mjs presses start buttons and photographs gameplay, and tools/game-check/fixes/<game>.mjs contains play- tests that actually play, for example baseball's player-height, camera, menu, and stick-reset tests. tools/game-check/fixes/README.md says every game gets at least 5 play tests, and tools/playtest/play.mjs plays in gas, masher, and swiper styles watching for frozen screens, no response, and no play-again.
What I did not find: a single defined core gameplay sequence, with a 100% state-transition requirement, applied uniformly to every game.
Conclusion: that absence alone does not prove a current game fails a core action. To confirm or reject it, provide that defined sequence and its current pass/fail results per game.

In short: none of the three is confirmed as a current failure from the code I read, and the blanket versions of all three are contradicted or narrowed by the code above. Provide current robot-check code and results for all three gaps to confirm or reject each with proof.
END AUDITOR-MSG A-020
