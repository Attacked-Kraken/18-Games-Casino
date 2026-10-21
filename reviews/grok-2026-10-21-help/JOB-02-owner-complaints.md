# JOB-02: the owner's complaints list, and no closing without proof

**Why:** the owner's notes get lost between chats, and "merged" was being treated as "fixed".

**Files:**
- `drop-in/COMPLAINTS.md`: the list, already filled with the 9 complaints we know about (C-001 to C-009)
- `drop-in/tools/complaints/check.mjs`: the checker (plain Node, no packages)
- `drop-in/.github/workflows/complaints-check.yml`: runs it on every PR that touches the list or `proof/`
- `drop-in/proof/complaints/README.md`: where proof pictures and clips go

**Rules the robot enforces (red X = no merge):**
- Status must be one of `open`, `fixing`, `needs-proof`, `closed`.
- `closed` needs a `proof:` line pointing to a real `.png/.jpg/.webp/.gif/.mp4/.webm/.mov` file in the repo. The robot checks that the file exists, isn't empty, and really is a picture or video.
- A complaint can never be deleted. The check compares against main.
- Every entry needs `game:`, `what:`, and `done when:`.

**How builders use it:**
1. When the owner reports something, add a `## C-0xx` entry with `status: open`.
2. When a builder takes the job, set `status: fixing` and fill in `fix: G-xx / PR #nnn`.
3. After the merge, set `status: needs-proof`.
4. To close it, add the visual robot's `closeup.png` or `clip.mp4` (or a phone screenshot) to `proof/complaints/`, put the path on `proof:`, and set `status: closed`.

**Tested here:** the list passes as written. Closing C-006 with no proof → FAIL. Closing it with a real png → PASS. Deleting C-009 → FAIL "was DELETED".

**Done when:** `node tools/complaints/check.mjs` prints PASS on main, and the workflow shows up on PRs that touch COMPLAINTS.md.
