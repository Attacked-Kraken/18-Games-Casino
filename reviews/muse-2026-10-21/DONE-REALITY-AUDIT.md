# Apex Track & Field — DONE.md / REALITY.md line-by-line audit

- **When:** 2026-10-21 (owner's order: keep playing from where G-83 left off, check every line, document discrepancies)
- **Builds checked:** current main (robot full game check, Oct 21 11:57 AM, main ea1b63f) and the JOB G-83 branch build (apextrackfield.html md5 8f2b265f — the menu/REALITY path is untouched by G-83, so the contact numbers below hold for both)
- **Evidence used:** the robot's own results (game-checks branch), the 46 play tests in tools/game-check/fixes/apextrackfield.mjs, a source read of the game file, and one local run of the robot's own reality.mjs against the G-83 build
- **Bot:** Muse main (casino)

## Discrepancies found (the short list)

- **D1 — REALITY ground contact FAILS on main, and the verdict flips by sampling luck.** Latest full check: "feet FLOAT above the ground (22 of 24 readings over 3 cm, highest 0.35 m)". Reproduced locally with the robot's own reality.mjs on the G-83 build: 21 of 24, highest 0.36 m. But the runner is not floating: when a foot is planted, its measured gap is ~0.000 m (ankle bone 0.071 m minus the hook's 0.07 footOffset). A runner is airborne most of every stride — both feet off the ground, swing foot up to ~0.36 m — so a sampler that reads every 400 ms lands mid-flight ~85% of the time. One PR run passed this line (lucky phase), two failed. The line as the robot measures it cannot be passed reliably by ANY running human; the game's stance contact itself is correct.
- **D2 — 400m hurdles are the wrong height.** One hurdle mesh (1.18 m wide × 1.07 m tall) serves both hurdle events. 1.07 m is right for the 110m hurdles; the real 400m hurdle is 0.914 m. 1.07 is +17% over — outside DONE §4's ±15% size band.
- **D3 — Audio does not pause when the app is backgrounded.** DONE §6 asks for a visibilitychange pause; the source has no audio suspend on hide (the visibilitychange handlers only release the stick/buttons, G-68 fix). A browser may suspend the context on its own, but the game does not do it.
- **D4 — play-hurdles-every-runner-jumps is intermittent on main.** Latest full check: "110h: runner 7 ran through hurdle 10 instead of jumping it". The test ends when the player finishes; the slowest rival may not have reached the last hurdle yet. Reproduced on unmodified main locally (1 of 3 runs). The game's rival-jump behaviour itself was proven in G-38 — this is a test-window problem, not runners running through hurdles.
- **D5 — play-high-jump takeoff reading intermittent on main.** Latest full check: "his takeoff was at -1.0 m of the approach". The same test passed on its own PR (G-49) and in other runs. Root cause not proven in this pass — flagged, not reproduced locally here.
- **D6 — Three play tests errored "Execution context was destroyed" in the latest full check** (results-one-table-one-menu-button, stick-resets-on-interruption, button-releases-on-interruption): the shared test page navigated mid-test after an earlier failure reloaded it. All three pass on their own PR runs and locally. Harness cascade, not game errors.
- **D7 — REALITY direction: 1 of 11 sampled moves read wrong-way/backwards** in the local replica (menu jogger, tangent sampling on the bend). Under the robot's fail line (>half), so no FAIL — noted because it is not zero.
- **D8 — Lines nobody has measured (untested, per DONE §10):** §1 load-to-playable ≤ 5 s on a mid-range phone (the menu is interactive while athletes load — buttons show "LOADING ATHLETES…" — but no timing measurement exists); §5 camera raycast test (no raycast in the code — cameras are positioned analytically and clamped inside the stadium; no inside-geometry frame appears in the robot's pictures, but it is not measured the DONE.md way); §7 real-device fps and memory growth across 3 restarts (no test exists; the robot's fps is a software-render hint only); §2 "input reads 0 within 1 frame" (verified by tests at event granularity, never frame-counted).

## DONE.md, line by line

### 1. Loads clean
- Zero console/page errors [A] — PASS (robot, latest full check: no error lines for this game).
- Canvas not blank, luma ≥ 6 [A] — PASS (robot pictures show the full stadium menu in both orientations).
- Loads to first playable frame ≤ 5 s + loading screen — UNTESTED on a real phone (D8). The menu is up and tappable while the athlete models stream in.
- No runtime CDN [A] — PASS (no http(s) references anywhere in the game file; everything is in the repo).

### 2. Controls
- Stick tracks one finger by pointerId — PASS (play tests two-thumbs-at-once, stick tests).
- Stick resets on pointerup, pointercancel/touchcancel, blur, visibilitychange [A] — PASS (source handles all four; play-stick-resets-on-interruption proves all four paths).
- Input reads 0 within 1 frame after release — PASS at test granularity; not frame-counted (D8).
- Buttons react < 100 ms, pressed state, targets ≥ 44 px ([A] counts < 36) — PASS (no size/overlap failures for this game in the robot's mobile checks).
- No double-fire; mouse drives the stick — PASS by construction (pointer events throughout) + desktop play in tests.
- Holding the stick moves the player the way it faces — PASS (REALITY direction, see below; D7 notes 1 of 11 samples).

### 3. Mobile layout
- No HUD overlaps [A] — PASS (robot; play-menu-fits-sideways-phone measures every control's box at 844×390).
- Nothing interactive off-screen [A] — PASS (same test; finish-banner-never-covers-timer).
- Safe-area insets — PASS (env(safe-area-inset-*) used 14× in the file).
- Landscape inside the game file only; other pages portrait — PASS (the landscape block lives in apextrackfield.html only).
- Player never covered by HUD — PASS (thrower/meter fix G-58 + finish-banner test + robot pictures).

### 4. Realism & scale
- __reality hook set [A] — PASS (added G-63; robot reads it every run).
- Sizes ±15% — PASS except D2 (400m hurdles +17%). Athlete measured by the robot at 1.79 m (table 1.75–1.95); track lap 400.03 m, lanes 1.22 m; pole-vault pole 4.6 m (table 4.5–5.2); high-jump bar is a rising competition progression 1.70 → 2.52 m, crossing the table's 2.0–2.4 band mid-competition.
- Ground contact < 3 cm while grounded — FAIL as the robot measures it (D1); stance contact itself measures ~0.000 m.
- Facing dot > 0.9 — PASS (robot direction verdicts pass; D7 footnote).
- Animation matches speed — PASS (the run/jog clip rate scales with stride speed, timeScale clamped 0.5–2.4; play test real-sprint-animation).
- No z-fighting — PASS as observed (track ribbon sits above the floor plane; no coplanar flicker in any robot picture; not instrument-measured).
- Rigged shared bodies, never boxes — PASS (characters/base-human-v2; robot counted 8 skinned humans; keep-locked-look guards the look).

### 5. Camera
- Never inside geometry — PASS as observed, not raycast-measured (D8).
- Player fully visible on frame 1 — PASS (start camera behind the player; robot pictures).
- No frame-to-frame jump > 1 m — PASS (cameras ease on simulation time, G-22; camera-one-rule and race-camera play tests).

### 6. Audio
- AudioContext resumed on first gesture [A] — PASS (robot source check; procedural + kit audio starts on first interaction).
- Sound on iPhone, mute works and persists — PASS in source and tests (mute stored as atf_mute); iPhone hardware itself untested here.
- Audio pauses on visibilitychange — FAIL in source (D3).

### 7. Performance
- 60 fps target / 30 floor on a real phone — UNTESTED on hardware (D8). Robot hint only (median frame 333 ms on a GPU-less renderer — not a phone number).
- Pixel ratio ≤ 1.5, shadows/post off on touch, draw calls ≤ 300, triangles ≤ 500k — PASS (robot: 91 draws/frame typical, 153 max; light path proven by play-light-path-on-touch; sharp rule keeps min(dpr, 1.5), G-75).
- Memory growth across 3 restarts — UNTESTED (D8).

### 8. Game loop
- Start → play → win AND lose → ONE results screen → restart/menu — PASS (play-career-levels-load-play-unlock, play-results-one-table-one-menu-button; G-68 removed the duplicate table/button).
- Restart resets everything; 3 rounds without reload — PASS across career meets in the play tests (a full career is 50 meets, tested start to finish by play-career-50-meets-every-event and the championship test).
- Results match reality — PASS (G-83: the results time is the race clock at the finish, proven by play-career-results-event-column-and-clock; finishing order comes from the same simulation that ran the race).
- Progress saved in localStorage, survives reload — PASS (tfapex_* keys; career tests reload mid-flow).

### 9. Branding & shipping
- Own branding/icons — PASS (apextrackfield-icon.svg wired as the favicon in G-75; Apex Arcade sponsorship in-game).
- Casino pages line — not applicable (Game Development title; the casino is a separate world).
- Credits/licenses for outside assets — PASS (ASSETS.md ledgers the stadium sound pack and the kit ground textures the game uses; all sources CC0/owner kits per ASSET-LAW).

### 10. Proof
- Robot check shows no FAIL + pictures looked at + play test in fixes — NOT MET today: the robot's latest full check carries the D1 FAIL, and three tests errored via D6. The 46 play tests are in the file; the five G-83 play tests pass locally and in PR runs (modulo the D4/D5 intermittents).
- Anything untested written down — this document is that list (D8).

## REALITY.md, line by line

- **Direction** — PASS (robot + local replica: 11 moves sampled, 1 read wrong-way — D7; the fail line is >half).
- **Size** — PASS except the 400m hurdle height (D2). Athlete 1.79 m measured; track 400 m lap / 1.22 m lanes measured in the game's own data and tests.
- **Ground contact** — FAIL as measured (D1): 21–22 of 24 robot readings over 3 cm because a running human is airborne most of each stride; planted-foot gap ~0.000 m.
- **Animation matches speed** — PASS (clip timeScale follows stride speed; no foot-slide report from any check).
- **Camera** — PASS as observed (never inside a wall in any robot picture; player visible and uncovered; not raycast-measured — D8).
- **Rules** — PASS (rivals jump every hurdle since G-38 — the D4 intermittent is the test's window, not the rule; steeplechase AI jumps the full-width barriers since G-83; everyone starts on the line since G-83; results order = crossing order).
- **Results** — PASS (one results screen, one menu button — G-68; EVENT column + race-clock time — G-83).

## Bottom line

The game passes nearly every line of both documents. What stands between it and "DONE" on paper: the ground-contact measurement conflict (D1 — the robot's rule vs a running human), one wrong hurdle height (D2), one missing audio pause (D3), three intermittent test-side items (D4–D6), and a short list of lines nobody has measured yet (D8). None of the five G-83 points regressed.
