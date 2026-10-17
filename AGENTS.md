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

6. **NEWS.md** — the owner's latest decisions (newest first). The approver also tells you each new one.
7. **LESSONS.md** — every mistake we already made and the rule that stops it. Read it before EVERY job. After every
   owner 👎 or failed check, add one line to it.

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

**Venues, rules and hands-off approvals (owner, 2026-10-16):** every place has a spec sheet in `venues/` (real sizes,
MUST list, robot checks) and every sport a rules sheet in `rules/`. Build places with `venues/kit/` (stadium bowl +
moving crowd, real rink) and check them in `tools/venue-viewer.html`. Game changes that need a new model wait in a pull
request marked `waits-model: <id>`. The owner's 👍 makes the model LOCKED, and the model gate robot merges them by itself
(STUDIO-STANDARD.md §6b).


**Daily scores & self-improvement (owner, 2026-10-16):** the owner's approver scores every game out of 100 once a day
(robot check, fix tests, phone speed, real players, owner thumbs) and puts improvement jobs on the board for the weakest
games. A job that starts with "DAILY SCORE" is one of these: fix every problem it lists, then improve the game. Every 👎
becomes a line in `LESSONS.md` — the factory gets smarter with every mistake.

**Real 3D models with credit (owner, 2026-10-16):** CC-BY models are now allowed as well as CC0 (ASSET-LAW.md Part III).
Every 3D file goes in `ASSETS.md` (title, maker, source page, license); every game using a CC-BY model shows a Credits
screen naming each maker. The asset check robot blocks anything else. Prefer a real model over shapes built in code.

**Art director (owner, 2026-10-16):** once a day one Muse gets an "ART DIRECTOR" job: grade every game harshly in
`SCORES.md` (looks, play, fun, sound, phone feel, /50). It is half of each game's daily score. The robot only proves a
game RUNS; the art director and the owner decide if it is GOOD. An open owner complaint caps a game at 50/100.

**The owner's pipeline (owner, 2026-10-16) — this is how games get made here:**
1. The idea scout puts ideas on the owner's vision board. The owner 👍s the ones to build.
2. A Muse builds it: STEP 1 the main 3D model (owner 👍), STEP 2 the game — and the game MUST appear on the Game
   Development page (`sports.html` ALL TITLES card + `tools/game-check/games.json`). The robot FAILS any apex*.html that
   isn't on that page.
3. Every game gets 5+ PLAY TESTS (`tools/game-check/fixes/<game>.mjs`, ids `play-...`, see fixes/README.md) that
   actually play it by its rules. A broken game can no longer pass the robot.
4. The owner plays it, draws on the screen and records it with the ✏️ pencil on the Game Development page, and sends it.
   It arrives as an OWNER'S NOTE job with pictures: break it down, fix it, add a test for each point.
5. Memory: every 👎 → one line in LESSONS.md. Every 👍 → one line in PLAYBOOK.md (what worked). Read both before every job.
6. Games move to the Apex Arcade only when the owner says so (launch is about a month out).

**VENUE GATE (owner, 2026-10-16):** every game plays in a real place built from its `venues/<sheet>.md` (real sizes,
stands all around, moving crowd) with `venues/kit/`, checked in `tools/venue-viewer.html` and approved by the owner in
MODELS.md (WAITING OWNER → LOCKED) — exactly like the hockey arena. Build the venue BEFORE tuning gameplay. The robot
flags every game without a LOCKED venue. Look at real TV pictures of the sport and the top store games before building.

**Safety net (owner, 2026-10-17):** after every merge the robot also opens every game in **iPhone Safari** (WebKit) —
problems only Safari has show as "iPhone Safari: ..." CHECK items. If a merge **newly breaks** a game (a new FAIL, or an
owner's fix test that passed before now fails) and a second check confirms it, the robot **undoes the merge by itself**
("AUTO-UNDO: ..." on main). Nothing is lost: your branch still has the work — fix it and merge again, and add the lesson
to LESSONS.md. A brand-new failing fix test (test-first) never triggers an undo.

**Shared game kit (owner, 2026-10-17):** `kit/apex-kit.js` (guide: `kit/README.md`, demo: `kit/demo.html`, self-test:
`kit/kit-test.mjs`) gives every game the same pause/settings menu, mute (house-wide `apex_muted`), saves, credits screen,
touch joystick + buttons, chase camera, fps meter and `window.__test` hook. **Every NEW game is built on it.** Existing
games move onto it when they are a launch-focus game (a "KIT MOVE" job). Fix the kit, not one game, when a shared thing
is wrong — every game gets better at once. Never break the kit's self-test.

**No double work (owner, 2026-10-17):** one game or 3D model = one Muse at a time. Before starting, check CLAIMS.md and
the job board; if another window has it, stop and say so. The approver hands every job for the same game/model to the
window already working on it. New owner decisions arrive as FACTORY NEWS and are listed in NEWS.md.
