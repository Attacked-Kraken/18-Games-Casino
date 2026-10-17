# Apex game kit (`kit/apex-kit.js`)

One shared kit for the phone 3D sports games. It gives every game the same menu, pause, sound, saves, credits,
touch controls, chase camera, speed handling and robot test hook. **Fix something in the kit and every game on
the kit gets the fix.** A new game starts half-built.

Proof it works: open `kit/demo.html` (a box you drive with the stick). Add `?fps=1` to see the speed meter.

---

## What the kit does for you

| Piece | What you get | Required? |
|---|---|---|
| `ApexKit.boot({...})` | Wires everything below. Call it once. | **Required** |
| Sound | Unlocks on the first touch; master, music and effects volume; one mute button (top right) that is saved for this game and also follows the house-wide `apex_muted` flag; two built-in original music loops (`menu`, `game`) and ready sounds (`tap`, `hit`, `score`, `whistle`, `horn`, `boost`, `error`). | Built in |
| Pause menu | Pause button (top right): Resume, Restart, Settings (sound on/off, music volume, graphics Low/Medium/High), Credits, Back to Game Development. Pauses by itself when the phone locks or the app goes to the background. Big buttons, sideways layout. | Built in |
| Saves | `ApexKit.save.get(key, fallback)` / `.set(key, value)` / `.remove(key)` / `.keys()`. Stored as `apexkit:<game id>:<key>` with a version number. Never touches another game's saves. | Optional |
| Credits | `ApexKit.credits.add({ title, maker, license, source, changes })`. The Credits screen always says **Made by Apex Arcade**. | **Required for every CC-BY model** (ASSET-LAW Part III) |
| Touch controls | `ApexKit.controls({ buttons:[...] })`: left thumb stick (appears where the thumb lands) + up to 4 round buttons on the right. `read()` gives `{ x, y, buttons }`. Keyboard works too: WASD / arrows, Space = first button, Shift = second, E, Q. | Optional |
| Chase camera | `ApexKit.chase(camera, target, { distance, height, lag, lookAhead })` then `cam.update(dt)` each frame. | Optional |
| Speed | `?fps=1` shows the fps meter. Optional auto quality (off by default - the owner wants full sharpness, see apex-gfx.js "sharp1"; turn on with `autoQuality: true`) lowers the picture sharpness one step when the game runs under ~45 fps for 2 seconds, and raises it back when there is room (57+ fps for 3 seconds). Never goes below 1, so the picture stays sharp. Phone caps: High 1.5, Medium 1.25, Low 1. | Built in |
| Sideways fit | Sizes the renderer and camera to the sideways box on every resize / turn. First tap asks for fullscreen + landscape lock where the phone allows it. Touches are remapped when the stage is turned. | Built in when you pass `three` |
| Robot test hook | `ApexKit.test.expose({ score: () => game.score })` puts read-only values on `window.__test` for PLAY TESTS. `window.__test.kit` is always there (paused, muted, quality, fps, input, which menu page is open). | **Required** (5+ play tests per game) |
| Arcade hook | `ApexKit.score(score, level)` calls `ArcadeShell.submit(id, score, level)` when the arcade shell is there. | Optional |

**What the kit does NOT do (on purpose):**
- It never adds the sideways CSS. The PORTRAIT RULE (STORE-READY.md) says the landscape presentation lives inside
  each game file. Keep (or paste) this in the game's own `<style>`:
  ```css
  @media (orientation: portrait) { body { position:fixed; left:0; top:0; width:100vh; height:100vw;
    transform-origin:left top; transform:rotate(90deg) translateY(-100vw); } }
  ```
  Never load the kit on `index.html`, `sports.html` or any page that is not a game.
- It never shows a "turn your phone" sign (the robot fails that).
- No internet, no outside links. A credit's `source` shows as plain text, not a link.

---

## Put a NEW game on the kit (6 steps)

1. Copy the top of `kit/demo.html`: the viewport meta, the `<style>` with the sideways block, the icon links and
   the import map `{"imports":{"three":"./three.module.min.js"}}` (games live in the repo root, so `./`).
2. Import the kit: `import ApexKit from './kit/apex-kit.js';`
3. Build your scene, renderer and camera.
4. Call `ApexKit.boot({...})` (snippet below). Put your game step in `onFrame(dt)`. It stops by itself while paused.
5. Add controls, chase camera, credits and the test hook.
6. Write 5+ play tests in `tools/game-check/fixes/<game>.mjs` that read `window.__test`.

```js
import * as THREE from 'three';
import ApexKit from './kit/apex-kit.js';

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(60, 2, 0.1, 500);
// ... build the world, the player mesh `car` ...

ApexKit.boot({
  id: 'apexkarts',              // the game's file name without .html (letters, numbers, - and _ only)
  name: 'Apex Karts',           // shown on the start card and in Credits
  three: { THREE, renderer, camera },
  startScreen: true,            // optional: a Play card (also starts the music on that tap)
  onStart()   { /* begin the match */ },
  onPause()   { /* stop timers you run yourself */ },
  onResume()  { },
  onRestart() { /* put everything back to the start */ },
  onFrame(dt) { /* move things, then: */ cam.update(dt); renderer.render(scene, camera); },
});
const pad = ApexKit.controls({ buttons: [
  { id: 'jump', label: 'JUMP', key: 'Space', onPress: () => ApexKit.audio.sfx('tap') },
  { id: 'boost', label: 'BOOST' } ] });
const cam = ApexKit.chase(camera, car, { distance: 7, height: 3, lag: 0.15, lookAhead: 4, THREE });
ApexKit.credits.add({ title: 'Kart', maker: 'Maker Name', license: 'CC-BY 4.0', source: 'poly.pizza/m/xxxx', changes: 'recoloured' });
ApexKit.test.expose({ score: () => game.score, carX: () => car.position.x });

// inside onFrame:   const { x, y, buttons } = pad.read();   if (pad.pressed('jump')) ...   (y = -1 is forward / up)
// saves:            ApexKit.save.set('best', 1234);  ApexKit.save.get('best', 0)
```

**More boot options (all optional):** `backHref` (default `'sports.html'`), `music: { menu:'menu', game:'game' }`
(or your own `{ bpm, root, scale, melody, chords }`, or `false`), `quality` (first-run default, `'high'`),
`autoQuality` (default `false` - owner prefers full sharpness), `lockLandscape` (default `true`), `saveVersion` + `migrate(key, oldData, oldVersion)`,
`onQuality(q)` (turn shadows on/off), `onMute(muted)`, `onResize(w, h)`.

**Your own sounds:** play anything through the kit's buses so mute and volume work:
`ApexKit.audio.sfx((t, bus, ctx) => { /* WebAudio nodes into bus at time t */ })`, or connect to
`ApexKit.audio.sfxBus` / `ApexKit.audio.musicBus`.

**No own loop?** Leave out `onFrame` and keep your own `requestAnimationFrame` loop; check `ApexKit.paused` in it.

---

## Move an EXISTING game onto the kit (checklist)

Do it on your own branch, one game per pull request, and say in the PR what changed.

- [ ] **Keep the old save keys.** Never rename or delete them (FAMILY-RULES). Keep reading them in the game, or copy
      them once into `ApexKit.save` and leave the old key in place.
- [ ] **Keep the game's own sideways CSS** in its `<style>`. Delete its own `fitGame()` only after passing
      `three: { THREE, renderer, camera }` (the kit does the same sizing). If the game uses `onResize`, keep extras there.
- [ ] **Keep `#back`** if the robot's `games.json` start steps press it, or remove it once the pause menu's
      "Back to Game Development" replaces it. Keep any `ArcadeShell` calls (or use `ApexKit.score`).
- [ ] **Mute:** remove the game's own `#muteBtn` and its `apex_muted` code; play its music and sounds through
      `ApexKit.audio.musicBus` / `sfxBus`. Update fix tests that press `#muteBtn` to press `#akMute` and read
      `window.__test.kit.muted`. (Never weaken a fix test - change only the selector.)
- [ ] **Pause:** move the game's pause/menu code into `onPause` / `onResume` / `onRestart`; delete its own pause button.
- [ ] **Controls:** replace the game's joystick (`#joy`, `#knob`, `joyVec`) with `ApexKit.controls`. Note the y
      sign: up on the stick is `y = -1`, like the old `joyVec.y`.
- [ ] **Graphics:** if the game uses `apex-gfx.js`, the kit's Low/Medium/High also sets `ApexGFXActive` quality.
      Remove the game's own quality picker so there is only one.
- [ ] **Credits:** `credits.add` every CC-BY model from `ASSETS.md`.
- [ ] **Test hook:** `ApexKit.test.expose(...)` the values your PLAY TESTS need. If the game already has
      `window.__hk`-style objects, keep them; `__test` is new.
- [ ] **Check it:** boot at 844x390 touch, no console errors, no 404s, stick, buttons, pause, mute after reload,
      then the game check robot. Say "merged, NOT yet seen" until the owner has looked.

## Element ids (for fix tests)

`#akMute`, `#akPauseBtn`, `#akMenu`, `#akResume`, `#akRestart`, `#akSettings`, `#akCreditsBtn`, `#akBack`,
`#akSound`, `#akMusicVol`, `#akQuality [data-q=low|medium|high]`, `#akCredits`, `#akPlay` (start card),
`#akJoyZone`, `#akBtn-<id>`, `#akFps`.
