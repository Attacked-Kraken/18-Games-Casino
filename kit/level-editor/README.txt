APEX LEVEL EDITOR
=================
An original, touch-friendly 2D platformer level editor in one offline HTML file.
Free to use in your paid apps.

FILES
  level-editor.html   the editor. Open it from the Files app (iPhone/iPad Safari) or any browser.
                      Everything is inside this one file: the code, the drawn tiles and the 20 sample levels.
  level-loader.js     load and draw editor levels in your own game (instructions at the top of the file)
  levels/             the 20 sample levels as .json files (01_green_start.json ... 20_grand_finale.json)

USING THE EDITOR
  Layers   Terrain / Items / Actors / Decor tabs. Tap a tab to switch, tap its eye to show or hide it.
  Tools    Paint (tap or drag), Erase (removes from the current layer first, then the top layer),
           Pan, Edit (tap a moving platform or enemy to set its range and speed), Grid on or off.
  Gestures one finger uses the tool; two fingers pan and pinch-zoom. The + / - / Fit buttons also zoom.
           On a computer: mouse wheel zooms, right-drag or Space+drag pans, Ctrl+Z / Ctrl+Y undo and redo.
  Undo/Redo  arrows in the top bar (up to 300 steps). A whole drag counts as one step.
  Test     plays the level right inside the editor. Controls: on-screen arrows and jump,
           or the arrow keys / WASD / Space. Stop returns to editing.
  Levels   your saved levels (open, copy, delete), a New level button and the 20 samples (each opens as an editable copy).
           Every change is saved automatically to this browser's localStorage.
  Menu     Export JSON (copy to clipboard or download a .json), Import JSON (paste or choose a file),
           Level settings (name, theme, width, height), Clear level.

TILES (37)
  Terrain: grass, block, brick, stone, ice (slippery), crate, sand, snow, spring (bounce), spikes, lava,
           moving platform sideways, moving platform up/down
  Items:   coin, big coin (5), star, gem (10 coins), extra life, power-ups: speed, shield, coin magnet, high jump
  Actors:  start, finish (one each), checkpoint, enemies: walker, flyer, spiky (cannot be stomped), hopper
  Decor:   bush, flower, tree, rock, cloud, sign, mushroom, lamp

THEMES: sky, night, cave, desert, snow, candy, volcano, ocean

NOTE: localStorage belongs to the browser. A file opened from Files keeps its levels in Safari,
but clearing website data deletes them. Use Export to keep backups.
