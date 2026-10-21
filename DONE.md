# DONE.md - when a game (or a job) is really done

**Every builder and every tester reads this before every job (owner, Oct 20 2026).** Source: Grok's outside audit, reviews/grok-2026-10-20/.
Built on the repo's own rules: REALITY.md, STUDIO-STANDARD.md, STORE-READY.md (portrait rule), AGENTS.md.
A game is **DONE only when every line below passes**. "Looks fine in a screenshot" is not a pass. Each test is measurable;
the game-check robot measures the ones marked **[A]** on every pull request (tools/game-check: check.mjs, reality.mjs, mobile.mjs), the rest need a play test (`tools/game-check/fixes/<game>.mjs`) or a real phone.

## 1. Loads clean
- [ ] [A] Zero console errors / page errors during load + 10 s of play, at 844x390 and 390x844.
- [ ] [A] Canvas not blank: screenshot luma std-dev ≥ 6 (not a black/white screen) in both sizes.
- [ ] Loads to first playable frame in ≤ 5 s on a mid-range phone; loading screen shown while it loads.
- [ ] [A] Store/app ready: no runtime CDN URLs (all scripts/models/audio are in the repo, works offline once installed).

## 2. Controls (touch first, mouse works too)
- [ ] Thumbstick tracks ONE finger by pointerId; a second finger on a button does not move the stick.
- [ ] [A] Stick resets to centre on pointerup, pointercancel/touchcancel, window blur and visibilitychange (source handles all four).
- [ ] After release, player input reads 0 within 1 frame (log the input vector: |v| < 0.01).
- [ ] Every button reacts within 100 ms and has a pressed state; touch targets ≥ 44x44 CSS px ([A] counts any < 36 px).
- [ ] No double-fire from touch + synthetic click. Mouse drag on desktop drives the stick the same way.
- [ ] Holding stick 5 s full forward moves the player the way it faces (REALITY dot > 0.9).

## 3. Mobile layout
- [ ] [A] No HUD element / button / stick overlaps another (bounding boxes intersect < 6 px) in landscape AND portrait.
- [ ] [A] No interactive element is off-screen (all boxes inside the viewport).
- [ ] Safe-area insets respected (`env(safe-area-inset-*)`) — nothing under the notch / home bar.
- [ ] Games present landscape inside the game file only; non-game pages stay portrait (STORE-READY portrait rule).
- [ ] Player is never covered by HUD (player screen box ∩ HUD boxes = 0).

## 4. Realism & scale (REALITY.md)
- [ ] `window.__reality` hook is set once the player exists ([A] source/global check).
- [ ] Sizes within ±15% of the REALITY table (Box3 of the model in-game).
- [ ] Ground contact: wheels/feet/skates gap < 3 cm while grounded, every frame for 3 s. No floating, no sinking.
- [ ] Facing: forward vector · track tangent > 0.9 for 5 s; AI too. No moonwalking, no wrong-way cars.
- [ ] Animation speed matches travel speed (no foot slide, no spinning wheels in place).
- [ ] No z-fighting: no two coplanar surfaces within 1 cm unless polygonOffset is used; ramps are solid with side walls.
- [ ] People use the shared rigged bodies (`characters/base-human-v2`), ~7.5 head heights — never box/capsule people.

## 5. Camera
- [ ] Never inside a wall, car or player (raycast camera→player hits nothing else).
- [ ] Starts behind/around the player with the player fully visible on frame 1.
- [ ] Smooth: no frame-to-frame jump > 1 m except deliberate cuts.

## 6. Audio
- [ ] [A] AudioContext is created/resumed on the first user gesture (`.resume()` in a touchstart/pointerdown handler).
- [ ] Sound actually plays on iPhone with the silent switch off; mute button works and persists.
- [ ] Audio pauses on visibilitychange (backgrounded app is silent).

## 7. Performance
- [ ] 60 fps target, ≥ 30 fps floor, on a mid-range iPhone/Android (STORE-READY). the robot's fps is only a hint (no graphics card).
- [ ] Touch devices: pixel ratio ≤ 1.5, shadows/post off, draw calls ≤ 300, triangles ≤ 500k.
- [ ] No memory growth > 20% across 3 restarts.

## 8. Game loop
- [ ] Clear start (menu or tap-to-start) → play → win AND lose conditions → ONE results screen → restart / menu button.
- [ ] Restart resets score, timer, player position, AI. Play 3 full rounds without reload, no errors.
- [ ] Results match reality (finishing order = who actually crossed first). Opponents obey same rules.
- [ ] Progress/best scores saved in localStorage and survive reload.

## 9. Branding & shipping
- [ ] Uses the repo's own branding/assets and icons (`<game>-icon.svg/png`, manifest) — no third-party brands or logos.
- [ ] Casino pages: age gate (age-gate.js) and shared wallet/bet UI present per repo rules.
- [ ] Credits/licenses listed for every outside asset (ASSET-LAW.md, licenses/).

## 10. Proof
- [ ] The robot's game check shows no FAIL for your game, you looked at its pictures on the game-checks branch, and your play test is in `tools/game-check/fixes/<game>.mjs`.
- [ ] Anything not tested is written down as "untested" — never claimed done.
