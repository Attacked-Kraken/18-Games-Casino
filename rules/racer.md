# Rules: street racing (apexracer.html)

## Must enforce
- **Race types:**
  - **circuit:** laps of a closed city loop
  - **sprint:** point to point through checkpoints
  - **time trial:** beat the clock
- **Checkpoints** must be passed in order. Missing one = the lap or run doesn't count. The car is reset to the last
  checkpoint if it's stuck or off the map.
- **Traffic:** AI cars drive in their lanes and stop at lights. A crash costs speed and time, never a game over.
- **Start:** a 3-2-1-GO countdown, and no moving before GO.
- **Finish:** positions by order across the line, a results table and a best lap.
- **Nitro / boost:** earned by drafting, drifting and near misses. Limited, shown on the HUD.
- Rewards: in-game coins for new cars and paint (our own made-up car designs). **No real money, ever.**

## Broadcast look
- HUD: position, lap, speedometer, nitro bar, mini-map. Replay of the finish.
- Cameras: chase (default), bumper, cinematic replay.

## Robot checks
- Countdown before the start; checkpoints count in order; a missed checkpoint is not a valid lap
