# The owner's FIX LIST (one test per complaint)

The owner should only ever have to say a problem **once**. When he reports one:

1. **Write the test first.** Add an entry to `tools/game-check/fixes/<game>.mjs` (same name as the game file,
   e.g. `apexmonstertruck.mjs`) that checks his complaint and **fails right now**. Use his words for `ask`.
2. **Then fix the game.** Merge. The game check robot runs every fix test after every merge, with the game
   started and held sideways like a phone.
3. **Only say "fixed" when the game check shows ✅ next to his words.** ❌ = not done, keep going.
   Until the new report posts, say "merged, NOT yet seen".
4. **Never delete or weaken a fix test.** They stay forever, so a fixed thing can't quietly break again.
   If the owner changes his mind, he says so and you change the test to match his new words.

Can't test it automatically (pure looks: "make the car shinier")? Still add the entry, with a test that returns
`'needs the owner\'s eyes'` - it shows as ❌ with that note until the owner says it's right, then change it to
`return true` in the same PR that the owner approved.

## Format

```js
// tools/game-check/fixes/apexmonstertruck.mjs
export default [
  {
    id: 'mute-works',                                  // short, never reused
    ask: 'Mute button doesn\'t work',                  // the owner's words
    async test(page, h) {
      // page = the running game (Playwright page, 844x390 touch phone). Helpers:
      //   h.tap(x, y)  h.press('#selector' | 'text=Words')  h.wait(ms)
      //   h.eval(fn, arg)  -> runs fn inside the game page and returns its result
      //   h.shot()     -> { mean, std, dark, lum } of a screenshot;  h.changed(a, b) -> 0..1 how much changed
      const before = await h.eval(() => window.AudioSys && AudioSys.muted);
      await h.press('#muteBtn');
      const after = await h.eval(() => window.AudioSys && AudioSys.muted);
      return before !== after || 'pressing the mute button did not change the sound';   // true = done
    },
  },
];
```

Return `true` when the complaint is gone. Return a short string (why it still fails) otherwise.
Each test gets 30 seconds.

## PLAY TESTS (owner, 2026-10-16) - tests that actually PLAY the game

The robot used to only check that a game *runs*. A broken game (runners leaving the track, a truck the size of a dot)
still passed. So every game also gets **at least 5 play tests** in the same file, with ids starting `play-`:

- Write them from the game's `rules/<sport>.md` sheet and `looks/<game>.md` MUST list - the rules of the real sport.
- They PLAY: press start, hold the controls (`h.tap`, `h.press`, `h.wait`), then read the game's state with `h.eval`
  (expose a small read-only `window.__test = { ... }` object in the game for this - positions, sizes, score, state).
- Examples: Track & Field `play-stay-in-lane` (run the whole 400 m: no runner ever leaves its lane), `play-finish`
  (the race ends with a result screen). Monster Truck `play-truck-towers` (truck height > 2x a car's height),
  `play-crush` (driving into a car crushes it). Soccer `play-ai-tackles` (within 30 s the computer wins the ball).
  Hockey `play-puck-in-rink` (the puck never leaves the boards). Racer `play-on-track` (AI cars finish a lap).
- A failing play test shows as a CHECK (it doesn't block merges) and pulls the game's daily score down until fixed.
- Under 5 play tests = a CHECK on that game.

## Wrong shape is rejected with the right one (Oct 23 2026)
An entry must have `id`, `ask` and a method named `test` (`async test(page, h)`). An entry that uses `run:` / `fn:` / `check:` instead
(window 6, PR #1282: "fx.test is not a function") now fails the PR check with `PLAY-TEST FORMAT: ... right shape: ...` naming
the file, the entry and what is wrong.
