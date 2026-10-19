# Paper Plane

A one-file HTML5 canvas game. No build step, no libraries, no internet needed.

## Play
- Open `index.html` (or `paper-plane.html`) in any browser. On iPhone: save it to Files, tap it, and it opens in Safari.
- **Hold** the screen (or Space / Up arrow) to climb. **Let go** to glide down.
- Don't touch the ground or any obstacle. Grab the coins 🪙: touching them with any part of the plane counts, and nearby coins get pulled in. Each coin pops, flies up to the counter and chimes. (The iPhone silent switch mutes game sounds.)
- Every coin is added to your saved total the moment you grab it, even if you crash or quit.
- **🎨 Plane color** on the main menu picks your plane: Classic white, Red, Orange, Yellow, Green, Blue, Purple, Pink, Black or Gold. A live preview shows the plane, and your choice is saved and used in every mode.
- The **II** button (top right) pauses. Pause also has Restart, Levels and the sound on/off switch.

## Levels mode: reach the other side
- 40 levels in 4 worlds of 10: **City**, **Mountains**, **Storm** and **Night**. Each world has its own sky.
- Each level is a fixed course. Fly to the **checkered finish line and flag**; the thin bar at the top shows how far you've got.
- You have **3 lives** per level. A crash puts you back a little way with a moment of blinking safety, so there's no waiting.
- **Stars:** ★ finish · ★★ grab half the coins · ★★★ no crashes and 80% of the coins.
- Finishing a level unlocks the next one. Stars and unlocks are saved on the device.
- Obstacles arrive a few at a time:
  - L1 storm clouds
  - L2 birds
  - L3 buildings (fly through the gap)
  - L5 wind gusts (arrows and streaks show which way they push)
  - L7 swooping kites
  - L12 drones
  - L14 lightning (the flashing yellow zone warns you first, then it strikes)

  Later levels mix everything, run faster and have tighter gaps.
- Levels are built from a fixed seed, so a level is the same every time. All 40 were checked by a computer solver to make sure they can be finished.

## Endless mode
The original mode: fly as far as you can. It gets faster and adds new obstacles the farther you go, and the world changes every 500 m. Your best distance and total coins are saved.

## Notes
- Sound effects are made in the browser (WebAudio). The mute setting is saved.
- Test-only URL flags: `#levels`, `#play=N`, `#auto`, `#at=SECONDS`, `#color`, `#c=N` (plane color 0-9), `#endless`, `#unlock`, `#done=N`.
