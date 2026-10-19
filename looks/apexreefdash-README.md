# Reef Dash

A one-file HTML5 canvas game. No build step, no libraries, no internet needed.

## Play
- Open `index.html` (or `reef-dash.html`) in any browser. On iPhone: save it to Files, tap it, and it opens in Safari.
- **Steering: Joystick (default).** Touch and hold anywhere and a faint thumbstick appears under your thumb. Push the knob the way you want to go: a small push goes slowly, a full push goes full speed, in any direction including diagonals. Let go and the sub glides to a stop. When you're not touching, the stick rests faintly at the bottom left. Only your first finger steers, so a second finger can tap **II** to pause.
- **Steering: Drag.** Switch with **🕹️ Controls** on the menu or the pause screen; the choice is saved. In Drag mode, drag anywhere and the sub follows your finger's movement.
- **Keyboard:** arrow keys or WASD.
- The reef scrolls by on its own. Reach the **glowing finish gate** at the end; the thin bar at the top shows your progress.
- **Pearls** are your score. Touching one with any part of the sub collects it, and nearby pearls get pulled in. Every pearl is saved the moment you grab it.
- **Oxygen (O₂ bar)** runs down all the time. Grab **air bubbles (O₂)** to refill it. The bar flashes red and beeps when you're low, and running out costs a life.
- **Shield bubbles 🛡** protect you for 6 seconds and block one hit.
- **II** (top right) pauses. Pause also has Restart, Levels and the sound on/off switch. The game pauses itself if you switch apps.

## Levels
- 40 levels in 4 zones of 10, each with its own look: **Sunny Shallows**, **Kelp Forest**, **Shipwreck** and **Deep Trench**.
- New hazards arrive one at a time, each with a 3-second hint under the scoreboard:
  - L1 sea mines
  - L2 jellyfish (drift up and down)
  - L3 chained mines (bob on their chains)
  - L4 coral tunnels (stay in the gap)
  - L5 shield bubbles
  - L6 currents (push you; the arrows show the direction)
  - L8 pufferfish (shake, then puff up)
  - L11 sharks (a flashing red lane warns you, then the shark dashes across)
  - L16 dark caves (only your headlight cone lights the way; mines blink and jellyfish glow)
  - L21 swinging anchors

  Later levels mix everything, scroll faster, have tighter tunnels and give you less oxygen.
- You have **3 lives** per level. A hit puts you back a little way with a moment of blinking safety.
- **Stars:** ★ finish · ★★ half the pearls · ★★★ no hits and 80% of the pearls. Finishing a level unlocks the next one.
- Levels are built from a fixed seed, so each level is the same every time. All 40 were checked by a computer solver to make sure they can be finished.

## Endless
Dive as far as you can with one life. It gets faster and harder the farther you go, and the zone changes every 600 m.

## Sub color
**🎨 Sub color** on the menu offers 10 colors with a live preview. Your choice is saved.

## Notes
- Saved on the device: pearls, stars and unlocks, best distance, sub color and the mute setting.
- Sound effects are made in the browser (WebAudio). The iPhone silent switch mutes them.
- Test-only URL flags: `#levels`, `#w=N`, `#play=N`, `#at=SECONDS`, `#auto`, `#endless`, `#unlock`, `#done=N`, `#color`, `#c=N`, `#ctrl=stick|drag`.
