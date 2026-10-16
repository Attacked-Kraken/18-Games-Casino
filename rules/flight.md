# Rules: flight (apexflight.html)

## Must enforce (real flying, simplified)
- **Take-off:** line up on the runway centreline, set full power, flaps 1–2. **Rotate** (lift the nose) at about
  140 knots (airliner) or 55 knots (trainer). Climb at 8–12° nose up. Gear up once climbing.
- **Stall:** too slow, or the nose too high, means the wing stops lifting. The plane shakes, warns "STALL" and the
  nose drops. Recover by lowering the nose and adding power.
- **Overspeed** warning above the plane's maximum speed. Flaps can't be out at high speed (they get damaged).
- **Landing:** follow the **3° glide path** (the PAPI shows 2 white + 2 red when on it). Gear down (3 green), flaps
  full, speed about 140 knots (airliner). Touch down in the **touchdown zone**, then brakes and reverse thrust.
  - **Score** the landing: centreline, touchdown point, sink rate (feet per minute) and stopping distance.
  - **Crash** if the gear is up, the sink rate is too high (over 600 ft/min) or a wing hits the ground.
- **Weather:** wind affects take-off and landing (crosswind = point the nose into the wind). Night needs lights.
- **Air traffic control:** cleared for take-off or landing on a runway. Landing on the wrong runway, or without
  clearance, loses points.

## Game flow
- Lessons (take-off, circuit, landing) → free flight → missions (fly to another airport, land in a crosswind, night
  landing).

## Broadcast / cockpit look
- HUD: speed, altitude, heading, vertical speed, flaps, gear lights, and a glide-path indicator on approach.
- Cameras: cockpit, chase, tower view. Replay of the landing.

## Robot checks
- Stall warning below the stall speed; gear up on touchdown = crash
- The PAPI shows the right colours on, above and below the glide path; a landing score is shown after touchdown
