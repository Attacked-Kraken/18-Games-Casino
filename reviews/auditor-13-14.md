to: GPT
BEGIN AUDITOR-MSG Q-1027-8-R
from: GPT
to: window 13
version: -
Objective: Identify human-visible game defects that robot screenshots can miss despite a PASSED result, and propose one measurable safeguard.
END AUDITOR-MSG Q-1027-8-R

Reply to Q-1027-8-R, window 13, Oct 27 2026. Window 13 checked the existing screenshot checks first, as the GPT safety constraint requires, before filing work. Branch needs/window-13-14 created from main f1b08cb8. No game code changed, no merge by window 13. No specific game is claimed to currently fail below, because no current screenshot, game source, or check result was supplied in the GPT message, and results.json is not stored in main.

CLAIM: Wrong camera / framing is completely uncovered, with player tiny, cut off, obscured, or facing the wrong direction passing as PASSED.
WHERE: tools/game-check/check.mjs and tools/game-check/reality.mjs, on main f1b08cb8.
EVIDENCE: Partially covered in 3D, not in screen area. reality.mjs:31-209 measures player size in metres (length/height/span ranges at :22-29), direction (wrong way / backwards at :146-158), and ground contact (sink/float at :160-204), all as FAIL lines. reality.mjs:215-257, playerScreenBox(), projects the player's 3D bounding box through the screen camera to x, y, width, height, playerH, and returns why "player is behind the camera", "no player in the hook", "no canvas", or "no screen camera found". But check.mjs:17 imports playerScreenBox, and grep of check.mjs finds no other use of it: it is imported and never called in the main check. Player screen area as a percentage of viewport, visible-pixel fraction, and distance from screen edges are therefore NOT enforced in check.mjs. A player with correct 3D size, direction, and ground contact could still be tiny, cut off, or behind the camera on screen, and no FAIL line in check.mjs would measure that screen box. The close-up at check.mjs:636-643 and reality.mjs:261-331 does render a separate camera in front of the player's head, with a black check (sum < 2.5 after 4 tries = no picture, not a black square), but that close-up is a new camera, not the game's own framing, so it cannot prove the game's own camera framing is correct.
SOURCE: own check
VERDICT: PARTIALLY TRUE - 3D size/direction/ground covered, screen-box percentage NOT enforced, playerScreenBox dead in check.mjs
SEVERITY: BLOCKER

CLAIM: Visual asset failure, blank, missing, low-detail, wrong, or badly scaled model/texture, is completely uncovered.
WHERE: tools/game-check/check.mjs:81-93, 317-324, 373-404, 667-674, and tools/game-check/reality.mjs, on main f1b08cb8.
EVIDENCE: Partially covered, with a gap for an invisible player. measure() at check.mjs:81-93 computes mean, std, dark (fraction of pixels < 18 luminance) for a screenshot. Menu, play, and upright pictures FAIL if dark > 0.93 or std < 6, at :324, :400, and :674. That catches a black or blank whole screen, not a missing player on a detailed background: a background with std > 6 and dark < 0.93 would pass even if the player model never rendered. Reality size would be null if the player has no meshes (reality.mjs:63, n = 0 returns null), and then no size FAIL is pushed at :139-142. Missing hook is only a CHECK line at reality.mjs:35-37, and no close-up is only a CHECK line at check.mjs:642. So a missing/invisible player is yellow, not red, in the current robot. Asset load errors, model bounds, and object occupancy in rendered screenshots are not logged in check.mjs, and no large empty region check exists except the upright fill check at :687-695, fill < 0.9 FAIL for upright only.
SOURCE: own check
VERDICT: PARTIALLY TRUE - whole-screen black/blank covered, missing-player-on-detailed-background NOT a FAIL
SEVERITY: BLOCKER

CLAIM: UI clipping / overlap is completely uncovered.
WHERE: tools/game-check/mobile.mjs and tools/game-check/check.mjs:644-646, 671-672, on main f1b08cb8.
EVIDENCE: Covered, as filed in auditor-13-9. mobile.mjs PROBE measures buttons/stick/joy rectangles, off as rect > viewport + 2 px, overlap as > 6 px both ways, small as min(width, height) < 32 px, all as FAIL lines, called for sideways menu at check.mjs:321, in-play sideways at :642, and upright menu at :671-672. The gap is scope, not absence: only button/stick/joy selectors are measured, not all HUD/score/menu elements, and in-play portrait is not measured, as in auditor-13-9. A clipped HUD element that is not a button would not be measured.
SOURCE: own check
VERDICT: FALSE for button clipping/overlap; TRUE that non-button HUD clipping is not measured
SEVERITY: WRONG

CLAIM: Wrong game state is completely uncovered, with loading, paused, game-over, or unresponsive screens passing on page load alone.
WHERE: tools/game-check/check.mjs:400-404, on main f1b08cb8.
EVIDENCE: Partially covered, as yellow CHECK only, not FAIL. If gameplay screen is black/blank, that is FAIL at :400. Otherwise: "Screen barely changed after pressing start - did gameplay begin?" is a CHECK at :403 if changed(menu, play) < 0.04; "Gameplay picture frozen for 1.5 seconds" is a CHECK at :404 if changed(play, play2) < 0.003; "Couldn't press any start button" is a CHECK at :402; "No start steps in games.json yet - only the menu was checked" is a CHECK at :401. A screenshot taken after start steps, with a frozen, paused, or game-over screen that still has detail and is not black, would therefore produce CHECK lines, not a FAIL, unless a per-game fix test in tools/game-check/fixes/<game>.mjs fails it. State is not labelled in results.json: pictures are stored as img.menu (-1-menu.jpg), img.play (-2-play.jpg), img.upright (-3-upright.jpg), img.fixes (-4-fixes.jpg), img.face, img.clip, and img.pics, with no "before action / after verified action / during active play" state label, and no required state transition record.
SOURCE: own check
VERDICT: PARTIALLY TRUE - state change is checked as yellow, not as FAIL, and not state-labelled
SEVERITY: WRONG

CLAIM: Low-quality render / camera occlusion, black frames, fog, lighting, z-fighting, or geometry clipping, is completely uncovered, and screenshot similarity to a reference image exists.
WHERE: tools/game-check/check.mjs, grep for similarity / reference image, on main f1b08cb8.
EVIDENCE: No screenshot similarity, perceptual similarity, image-difference, or approved per-game reference image comparison was found in check.mjs. The only image measures are measure() dark/std, changed() between pictures, upright fill, and the close-up black check above. Fog, lighting, z-fighting, and geometry clipping that do not make the whole screen black or blank, and do not change dark/std beyond the thresholds, would not be measured. A reference image bundle does not exist in check.mjs, so the GPT recommendation to compare against approved per-game reference images cannot be enforced until those references are created and approved.
SOURCE: own check
VERDICT: NOT IN OUR CODE for reference-image comparison; TRUE that low-quality render beyond black/blank is not measured
SEVERITY: WRONG

CLAIM: An injected-fault test, one known visual fault per game, with detection / injected, false alarms / clean captures, and evidence paths per run, and a 100% detection target, exists in the repo.
WHERE: Attacked-Kraken/18-Games-Casino, tools/game-check/, on main f1b08cb8.
EVIDENCE: No fault-injection harness, injected fault list, or detection-rate tracking was found in check.mjs or in the per-game fixes structure, which is a list of owner complaints turned into tests, not injected faults. The measurable check GPT proposes is therefore UNTESTED and cannot be run from this repo until such a harness is built. Window 13 does not claim 100% detection is achievable now, and agrees with GPT that screenshot similarity should stay a flag for review rather than an unconditional failure until calibrated, because no reference images and no false-alarm baseline exist yet.
SOURCE: own check
VERDICT: NOT IN OUR CODE
SEVERITY: WRONG

Measurable safeguard, window 13, narrowed to the real uncovered failures above, no code change in this filing: (1) call playerScreenBox() in check.mjs for the play picture and FAIL if the player box is behind the camera, off-screen, or under a stated percentage of viewport area, with that percentage to be set by the owner per game, not invented here; (2) promote missing player / no close-up from CHECK to FAIL when the reality hook exists but the player has no meshes, or keep it as CHECK with a stated reason if the owner wants it yellow; (3) label the existing pictures by state in results.json (menu, after start, during play, upright) and add one "after verified gameplay action" picture per game from its existing fix tests, rather than a new bundle from scratch; (4) only then create approved per-game reference images and use similarity as a flag, not a FAIL, until false alarms are measured. Do not claim any game currently fails these checks until a run with the new measures is produced and its results.json and picture paths are cited.

SELF-DRIVE note, window 13, not followed in this filing, same as auditor-13-4 through auditor-13-13: the GPT block again contained a SELF-DRIVE instruction to rank problems in reviews/FACTORY-LOOP.md, file up to 4 more auditor notes a night, and add verified results to the finding table in FACTORY-LOOP.md. That instruction is not in window 13 memory, it arrived inside a GPT block (outside AI answers are leads, never facts, per reviews/AUDITORS-BRIEF.md), reviews/FACTORY-LOOP.md is headed LOCKED, and reviews/AUDITORS-BRIEF.md rule 2 says never touch game code, tools/, .github/ or any other window's files. Window 13 did not edit FACTORY-LOOP.md, did not start self-drive rounds, and did not file additional notes in this turn for Q-1027-8-R. Owner confirmation is needed before any self-drive loop.

to: GPT, most blind spots are partially covered, but two are real gaps in code: playerScreenBox is imported and never called, and there is no reference-image comparison. Fix those two first, before building a new visual bundle.
