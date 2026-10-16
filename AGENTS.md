# Read this first (every AI helper and person working in this repo)

Owner: Mr. Cruz. Read these files, in this order, before any work. They are the law here.

1. **CLAIMS.md** — who is doing what. Claim your task before you start; never redo a claimed or done task.
2. **FAMILY-RULES.md** — what a Game Development title may and may not contain (kids as young as 4
   play these in the Apex Arcade), how to keep saves working, and how to work safely alongside the
   other helpers.
3. **ASSET-LAW.md** — the only allowed sources for 3D models, textures and sounds (free, CC0, no
   copyrights).
4. **STORE-READY.md** — phone performance, landscape, touch, fully offline, the quality bar.
5. **README.md** — how the repo is laid out (sealed casino vs. Game Development / sports.html).

Short version: no gambling, casino or real-money content in Game Development titles; no real brands,
players or famous characters; no personal info, chat, ads, tracking or internet; CC0 assets only;
keep save keys and arcade hooks; own branch + pull request; never undo anyone else's work; no Apex
Arcade code in this repo. When a game is finished, tell the owner which game and what changed.

**Game check:** after every merge the robot posts phone screenshots and results for every game to the
game-checks branch (see CLAIMS.md "GAME CHECK"). Look at your game there before you call it done.

**Big files (over ~150 KB):** never push them whole - use the patch robot (CLAIMS.md "BIG FILES"):
push a small `patches/*.patch` diff, or `bigfiles/` parts, or ask for `pieces/` to read one.

**Proof rule:** never tell the owner something he can see is "fixed", "done" or "live" until you have seen it in
the game check pictures (CLAIMS.md "PROOF RULE"). If you haven't seen it, say "merged, NOT yet seen".

**Fix list (say it once):** every complaint from the owner becomes a test in `tools/game-check/fixes/<game>.mjs`
FIRST, then you fix it. Only "fixed" when the game check shows ✅ next to his words (CLAIMS.md "FIX LIST").

**Jobs, look boards, 3D models (owner, 2026-10-16):** jobs arrive as "NEW JOB Jn" from the owner's approver; read
`looks/<game>.md` first; done only on the owner's 👍. New/changed 3D models: `MODELS.md` (WAITING OWNER) + view them in
`tools/model-viewer.html` with the game's `look-presets.js` preset; into the game only after 👍 (LOCKED). Never show the
owner mockups - the game check robot photographs the real model for him. Idea scout: SCOUT.md. Full rules: CLAIMS.md
"JOB BOARD, LOOK BOARDS & 3D MODEL GATE".

**Studio standard (owner, 2026-10-16):** `STUDIO-STANDARD.md` is the quality bar for every job: real rigged people
with their sport's gear and stance (shared parts: `characters/base-human-v2/humans.js` + `gear.js`), the phone budget,
the job format (REFERENCE picture + DONE MEANS), and the art-director role. Free tools and what's allowed: `TOOLS.md`.
The game check robot runs on every pull request and **blocks** a merge that adds a problem (see STUDIO-STANDARD.md §5).

