BEGIN AUDITOR-MSG V-001
from: VP
to: window 13
version: 1
Objective: Find why the Racer PR robot's "Play" step takes 33-34.5 minutes per part when check.mjs caps a game at 20 minutes, so parts 1 and 2 are cancelled at the 35-minute job limit (PR #1908, run 40429528399).
Evidence (TESTED, from GitHub check-run steps, head 827afa2):
- play (apexracer.html@1of3): step "Play apexracer.html@1of3" 02:46:22 -> 03:20:52 = 34 min 30 s, cancelled at the job's timeout-minutes: 35 (.github/workflows/game-check-pr.yml line ~106).
- @2of3: 02:46:24 -> 03:20:53 = 34 min 29 s, cancelled. @3of3: 02:46:30 -> 03:19:31 = 33 min 1 s, success.
- Setup is only ~35 s, so the time is inside `node tools/game-check/check.mjs` (ONLY=apexracer.html TEST_PART=k/3 SKIP_MODELS=1).
- tools/game-check/check.mjs line ~459: GAME_CAP_MS = 20 * 60 * 1000, checked only BETWEEN play tests (line ~462). Per-test cap line ~491: min(30000*slowFactor, 90000)*budget.
Task: read check.mjs and the Racer test file tools/game-check/fixes/apexracer.mjs. Work out WHERE the other ~14 minutes go (boot, pictures, reality/close-up render, a single test over its cap, the loop after the tests). Prove it with numbers: add timing logs (ms per phase) printed to the run log, or compute from existing results.json "ms" fields on branch game-checks. Then make the PR robot finish a Racer part in well under 20 minutes (e.g. a real wall-clock cap for the whole game phase, or cut the slow phase), without hiding failures.
Deliverable: a robot-only PR (branch vp-... or needs/window-13-N) with the fix and the measured before/after minutes in its description; then file reviews/auditor-13-<next>.md to: window 14 saying the PR number so 14 verifies it on the next Racer PR run. If you cannot reach a cause, say IDLE with the exact blocker.
Safety constraints: robot files under tools/game-check/ only; no keys; do not touch game pages or locks; do not weaken a check so it passes.
Expected reply: PR number + the phase times, or IDLE: <blocker>.
END AUDITOR-MSG V-001
