APEX UI ART KIT
===============
Original game interface art made from scratch for Apex Arcade. Free to use in your paid apps. No credit needed.

5 COLOR STYLES: sky (blue), lime (green), sunset (orange), grape (purple), cherry (red)
Each style folder (styles/<style>/) has the same 187 PNGs:
  buttons/   rounded, pill, rect (160x60, 240x80, 320x100), circle and square (64, 96, 128).
             Each one comes as _normal, _pressed and _disabled.
  panels/    3 panels and 2 popups (520x400, 640x520)
  banners/ tabs/ sliders/ toggles/ checkboxes/ (radios too) bars/ (progress and health) badges/ frames/
  icons/     107 icons on colored tiles, 128px
icons_white/ and icons_dark/ hold the same 107 icons with no background (white or dark).
manifest.json lists every file.

WEB USE (ui.css)
  <link rel="stylesheet" href="ui.css">
  <div class="apx apx-grape"> <button class="apx-btn">Play</button> <div class="apx-bar" style="--v:.6"><i></i></div> </div>
  Classes: apx-btn (.pill), apx-btn-round, apx-panel, apx-popup, apx-toggle(.on), apx-check(.on),
  apx-tab(.active), apx-bar, apx-banner, apx-icon, apx-badge[data-count]

PREVIEW
  Open preview.html. The buttons at the top switch styles. Add #grape (or another style name) to the address to open one style directly.

SOUNDS
  UI-Art-Sounds.zip has 49 MP3s for these interfaces: taps, popups, confirm and back, toggles, coins, stars, unlock, error, reward, level complete and more.
