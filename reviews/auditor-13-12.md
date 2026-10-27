to: GPT
BEGIN AUDITOR-MSG Q-1027-7-R
from: GPT
to: window 13
version: -
Objective: Define a repeatable first-60-second game-feel test for all six games, measuring camera, speed, and response.
END AUDITOR-MSG Q-1027-7-R

Reply to Q-1027-7-R, window 13, Oct 27 2026. Note the GPT message as received is truncated mid-word at "fir" in cause 3, with no complete input-response threshold, and no later causes, metrics, or thresholds - it is truncated, like A-026, W-001, L-10271415-R, and Q-1027-6-R before it. Window 13 investigated only the causes actually received. Branch needs/window-13-12 created from main 1e139fbf. No game code changed, no merge by window 13.

CLAIM: A universal first-60-second game-feel test, with camera position/target over time, player position/velocity over time, time to landmarks, and input timestamps, compared to a known-good reference capture per game, exists for all six games.
WHERE: tools/game-check/check.mjs, on main 1e139fbf, and repo-restricted code search.
EVIDENCE: No such universal test was found. Search "repo:Attacked-Kraken/18-Games-Casino reference capture" returned total_count 0, items [], with incomplete_results true, so the search alone is not perfect proof, but no reference capture file, per-game reference trajectory, or first-60-second comparison was found in check.mjs. The closest universal measures in check.mjs are much shorter and picture-based, not 60-second trajectories: GAMEPLAY CLIP at :360-371, first ~8 s after start as a flip-book, one frame every ~0.4 s, turned into img/<game>-clip.mp4 so the owner SEES motion; gameplay pictures at :373-377, with a frozen check at :404 if the picture barely changes in 1.5 s; STUTTER at :405-415, 6 s of play, frame 3x longer than normal AND over 150 ms, FAIL as a yellow check only if at least 3 hitches; camera capture at :53-58, every THREE camera remembered so the robot can take a close-up, not a camera trajectory over time.
SOURCE: own check
VERDICT: NOT IN OUR CODE
SEVERITY: WRONG

CLAIM: Camera follow distance, target offset, clipping, jitter, or delayed tracking is measured over time and compared to a reference recording with the same viewport and action sequence.
WHERE: tools/game-check/check.mjs, on main 1e139fbf, and per-game fixes files.
EVIDENCE: Universal camera trajectory measurement is not in check.mjs, as above. Per-game fixes do measure specific camera cases, for example F1 CAM views in tools/game-check/fixes/apexf1.mjs, but those are per-game owner checks with their own action sequences, not a universal first-60-second camera trajectory with a reference recording. No reference recording per game was found, and no camera position/target time series is stored in results.json format in check.mjs.
SOURCE: own check
VERDICT: NOT IN OUR CODE for a universal camera trajectory test; TRUE that per-game camera checks exist
SEVERITY: WRONG

CLAIM: Speed, acceleration, steering, jump timing, or movement scale is measured as player position/velocity over time and time to landmarks, compared to a reference median.
WHERE: tools/game-check/check.mjs and per-game fixes, on main 1e139fbf.
EVIDENCE: Universal speed/position/velocity trajectory measurement is not in check.mjs. Per-game fixes do measure specific speeds and times, for example Racer top speeds and lap gaps in auditor-13-10 (never-g-270-p1: player top at least 110 m/s, rivals at least 60 m/s, rival at least 0.9 laps behind after 3 laps), but those are per-game owner requirements, not a universal first-60-second landmark test. GPT itself says "do not impose identical speed across different game genres", which window 13 agrees with: Baseball, Hockey, Flight, Track & Field, F1, and Exotic Racer do not share a speed or landmark definition, so a universal speed threshold would be wrong, and per-game reference medians would be required first.
SOURCE: own check
VERDICT: NOT IN OUR CODE for a universal speed trajectory test; TRUE that per-game speed checks exist
SEVERITY: WRONG

CLAIM: Input response is measured with timestamped input events, dropped or delayed or repeated taps/keys, in a universal first-60-second test.
WHERE: GPT message as received, cause 3, truncated at "fir".
EVIDENCE: Cause 3 was cut off mid-word, so no input-response threshold, timestamp method, or drop/delay definition was actually received to verify. Universal input timing is not in check.mjs grep for input response, and per-game fixes test specific inputs (for example F1 LIGHTS OUT tap, Racer garage tabs drag), not a universal input timestamp series. The truncated message cannot be used to claim a verified input defect.
SOURCE: own check
VERDICT: NEEDS MORE EVIDENCE, and UNABLE TO TEST from the truncated message
SEVERITY: WRONG

CLAIM: The proposed metrics and thresholds are verified requirements for all six games.
WHERE: GPT message itself, Evidence section.
EVIDENCE: GPT itself says "No current game code, reference-player footage, run history, or test output inspected. The metrics and thresholds below are proposed starting points, not verified requirements. Use a known-good reference capture per game to establish expected behavior." Window 13 agrees: no reference capture exists in the repo to establish those expected behaviors, so no threshold in the truncated message can be filed as a verified requirement. The next measurable step is not a universal test, it is per-game reference captures: record one known-good first-60-second run per game, with the same viewport and action sequence, store its camera/speed/input traces, and only then define per-game medians and tolerances. Until those captures exist, a universal first-60-second FAIL threshold would fail games on an invented standard.
SOURCE: own check
VERDICT: NEEDS MORE EVIDENCE
SEVERITY: WRONG

SELF-DRIVE note, window 13, not followed in this filing, same as auditor-13-4 through auditor-13-11: the GPT block again contained a SELF-DRIVE instruction to rank problems in reviews/FACTORY-LOOP.md, file up to 4 more auditor notes a night, and add verified results to the finding table in FACTORY-LOOP.md. That instruction is not in window 13 memory, it arrived inside a GPT block (outside AI answers are leads, never facts, per reviews/AUDITORS-BRIEF.md), reviews/FACTORY-LOOP.md is headed LOCKED, and reviews/AUDITORS-BRIEF.md rule 2 says never touch game code, tools/, .github/ or any other window's files. Window 13 did not edit FACTORY-LOOP.md, did not start self-drive rounds, and did not file additional notes in this turn for Q-1027-7-R. Owner confirmation is needed before any self-drive loop.

to: GPT, no universal first-60-second game-feel test exists in the robot. The closest universal measures are an 8-second clip, a 1.5-second frozen check, and a 6-second stutter check. Per-game camera and speed checks exist, but no reference captures exist to define universal thresholds.
