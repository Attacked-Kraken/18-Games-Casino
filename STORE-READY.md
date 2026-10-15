# STORE-READY — every game ships as an app (owner's rule, 2026-10-14)

These games are headed for the **Apple App Store and Google Play** as
iPhone/Android apps. Every game in this repo — new builds and upgrades —
must be built **store-app ready**. If a change breaks any line of this
checklist, it is not done, whatever the CLAIMS board says.

## The checklist

1. **Runs great on real phones.** 60 fps on a mid-range iPhone/Android is
   the bar. Touch devices take the light path: capped pixel ratio
   (<= 1.5), shadows and post-processing off, textures modest
   (<= 2048px, most <= 1024px), draw calls kept low. If it only runs
   well on a desktop, it is not finished.
2. **Landscape, full-screen, any screen.** Sports titles start and stay
   in landscape. CSS owns the canvas size; the game refits on resize,
   rotation and visualViewport changes (the `fitGame()` pattern), and
   respects safe-area insets. Nothing important may sit off-screen on
   any phone.
3. **Touch first.** Every action is reachable with on-screen touch
   controls sized for thumbs. Nothing may require hover or a keyboard;
   keyboard support is a bonus, never the only way.
4. **Fully bundled, fully offline.** The store apps bundle these files —
   Apple rejects apps that just load a remote web view (guideline 4.7) —
   so a game must run entirely from the repo: no CDN scripts, no hotlinked
   assets, no runtime downloads, no missing-file 404s (icons included).
   A game must boot clean in airplane mode with zero console errors.
5. **Saves live on the device only.** localStorage / IndexedDB. No
   accounts, no servers, nothing uploaded. That keeps the store privacy
   labels truthful: *data not collected*.
6. **One self-contained file per game** wherever possible (a single
   `.html`), sharing only `three.module.min.js` and `characters/`.
   Keep the footprint small; the whole library ships inside the app.
7. **Content posture.** The Game Development titles (sports.html) carry
   no gambling content at all. Nothing anywhere involves real money;
   casino chips are fun-only. Ratings and age handling are applied at
   the app-shell level for the store build — never bolt your own age
   gate into a game.
8. **Identity.** Every game has its icon file, its Apex Arcade
   sponsorship inside the game (Apex Arcade is always the sponsor), and
   its registration on the Game Development page (see the WHERE NEW
   GAMES GO rule in CLAIMS.md). Its back button returns to sports.html.

## Before you stamp DONE

Boot the game on a phone-sized viewport with touch emulation and check:
landscape fit, no console errors, no 404s, touch controls all reachable,
frame rate steady in play. Say in your PR what you checked.

## The quality standard (owner, 2026-10-14)

**"Retest" is an order.** When the owner says *retest*, it means: load
the game and actually PLAY it — do not just boot it — hunt for issues
(visual defects, gameplay breaks, performance, screen fit, errors),
**fix what you find**, then test again to prove the fixes. A retest
report lists what was found and what was fixed. "It loads" is not a
retest.

**The bar is UE5-style quality.** Every testing and fixing pass should
leave the game visibly better than you found it — lighting, materials,
atmosphere, animation, game feel. We are building premium mobile app
games: **graphics for mobile app games, always** — phone-first visuals
at the top of what the store-ready performance budget allows, never
desktop afterthoughts and never placeholder-looking work. Quality goes
up with every pass; it never stays flat and it never goes backwards.

## Assets: the law of creation (owner, 2026-10-14)

Use the most realistic **free** models and assets available instead of
placeholder geometry for anything on screen: players, vehicles, props,
environments. Assets come ONLY from the owner's approved CC0 sources —
Quaternius, Kenney, Poly Pizza, Poly Haven, ambientCG, KayKit (free
packs), OpenGameArt (CC0 items) — never Sketchfab, Mixamo or
TurboSquid. Models and clothing must be realistic and must match the
game and the style of play it mimics. The full law, with sources and
working rules, is **ASSET-LAW.md**. Always inside the performance
budget above: sane poly counts, textures <= 2048px, GLB. If a better
free model exists, the upgrade is the job.

## Music and sound are required (owner, 2026-10-14)

Every game ships with **home-page (menu) music, in-game music, and
sound effects** for its core actions — all original audio (procedural
WebAudio is the house method), a persisted mute toggle, and audio
that starts on first interaction. A silent game is not store-ready.
Full law: ASSET-LAW.md, Part II.
