# MODEL-REQUESTS.md — ask the model fetcher for a 3D model (owner, 2026-10-17)

Only ONE window signs in to Sketchfab: the **model fetcher** (the idea scout window, it holds the owner's login in its
Secure Store). Builders never sign in anywhere. Need a Sketchfab model? Add a line here (own branch + PR + merge), then
carry on with other parts of your job. The fetcher downloads it, commits it as `<name>-raw.glb` on a branch so the
shrink robot makes the small `<name>.glb`, adds the ASSETS.md ledger entry, merges, and marks the line DONE.

**NEW (owner Oct 19): the Sketchfab fetch robot.** Put the EXACT model page link in your OPEN line
(`https://sketchfab.com/3d-models/<name>-<32-letter id>`) and merge. The robot (.github/workflows/sketchfab-fetch.yml)
checks the license (CC Attribution / CC0 only), downloads it with the owner's key, shrinks it to
`models/fetched/<name>.glb`, adds the ASSETS.md entry and marks your line DONE (or SKIPPED with the reason). Nobody signs in.
Your game must name the maker on its credits screen when you use a CC Attribution model.

**Checklist for every Muse (do all of it, then stop):**
1. Search sketchfab.com with the **Downloadable** filter. Never sign in, never download yourself.
2. Open the model page and check the license box says **CC Attribution** or **CC0** (skip "Free Standard" and anything else).
3. No real brand names, logos, teams or players on it. Download size (shown under Download) **under 20 MB**.
4. Add ONE line at the bottom: `- OPEN · what it's for · model name by maker · <exact model page link with the long id> · CC-BY · size`
5. Own branch, pull request, merge. Then stop - the robot downloads it, slims it for phones (under ~6 MB) and marks it DONE.

Rules for every request: license **CC Attribution** (CC-BY) or CC0 · trusted maker · no brands/logos · download
**under ~20 MB** (GitHub's limit is 100 MB, phones need a few MB) · the exact Sketchfab link.

Format (one line each, newest at the bottom):
`- OPEN · JOB J? · window ? · what it's for · model name by maker · link · license · size`

## Requests
- DRAFT · JOB J11 · window 2 · the motorcycle (real sport bike, CC-BY) · SPY-HYPERSPORT by Amvall is 177 MB - TOO BIG: find the same bike's smaller download (Sketchfab "glTF" / lower texture size) or the best other CC-BY sport bike under 20 MB · https://sketchfab.com (search "sport bike" CC Attribution, downloadable) · CC-BY · <20 MB
- DRAFT · JOB J11 · window 2 · REAL-LOOKING sport bike, NOT cartoon/low-poly (owner Oct 18 9:57 PM: "make it look like real motorcycle style, not cartoonish" - the 5 Poly Pizza bikes are all blocky) · a detailed street/sport bike with real paint, chrome, rubber tires, textures · https://sketchfab.com (search "sport bike" / "motorcycle", Downloadable, CC Attribution, no brand names or logos) · CC-BY · under 20 MB (send 2-3 choices if close)
- DONE (robot 2026-10-19: models/fetched/le-mans-race-car.glb) · a race car · Le Mans Race Car by Naudaff3D · https://sketchfab.com/3d-models/le-mans-race-car-95898a30f3544c0a93c60c1aecef154a · CC-BY · 9 MB
- OPEN · G-01 player car · Fictional supercar - V12 Goblin by ollitei · https://sketchfab.com/3d-models/fictional-supercar-v12-goblin-0a20e49ad5774d778567cb5c3f345786 · CC-BY · 9.2 MB
- OPEN · G-01 player car · Porsche 911 (930) Turbo 1975 by Lexyc16 · https://sketchfab.com/3d-models/porsche-911-930-turbo-1975-de1ffd344c41481892511f7fd332c136 · CC-BY · 4.6 MB
- OPEN · G-01 player car · McLaren Spider by SINNIK · https://sketchfab.com/3d-models/mclaren-spider-10b474f26b2643be82ee26417ca78a0a · CC-BY · 10.4 MB
- OPEN · G-01 player car · Honda NSX 1990 by Lexyc16 · https://sketchfab.com/3d-models/honda-nsx-1990-1cc15628a00a4739a6b6c01128927c8d · CC-BY · 6.6 MB
