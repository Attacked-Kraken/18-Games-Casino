# Venues: what every place in our games must look like (owner, 2026-10-16)

The owner wants to say "build the stadium" and get a real one. So every place has a **spec sheet** here, with real
measurements and a MUST list. A Muse **never makes up** a venue. It reads the sheet, uses the shared parts, and
proves the result with the robot.

| Place | Sheet | Used by | Shared part |
|---|---|---|---|
| Hockey arena + ice rink | [rink.md](rink.md) | apexhockey.html | `venues/kit/stadium.js` (`buildStadium`, floor `rink`) |
| Soccer stadium + pitch | [soccer.md](soccer.md) | apexsoccer.html | `buildStadium`, floor `pitch` |
| Ballpark | [ballpark.md](ballpark.md) | apexbaseball.html | `buildStadium`, floor `ballpark` (stands wrap home plate) |
| Track & field stadium | [track.md](track.md) | apextrackfield.html | `buildStadium`, floor `track` |
| Race circuit (F1) | [circuit.md](circuit.md) | apexf1.html | grandstands: `buildStadium` with `arc` |
| City streets (street racing) | [streets.md](streets.md) | apexracer.html | none yet |
| Monster truck arena | [truck-arena.md](truck-arena.md) | apexmonstertruck.html | `buildStadium`, floor `arena` |
| Airport + runway | [airport.md](airport.md) | apexflight.html | none yet (airport kit is next) |
| Planes | [planes.md](planes.md) | apexflight.html | none yet |

The game rules for each sport are in **`rules/<sport>.md`**: what the game must enforce and how a broadcast looks.

## How a Muse uses this

1. The job says which venue to build, e.g. "NEW JOB J7 apexsoccer: build the stadium".
2. Read the venue sheet, `STUDIO-STANDARD.md` and `looks/<game>.md`.
3. Build it with the shared part. The stadium kit already gives you the seating bowl, a moving crowd in the team
   colours, light towers or a roof ring, a scoreboard and tunnels, all inside the phone budget.
4. Add the sport's own floor and markings from the sheet, using the **real measurements**.
5. Show it in `tools/model-viewer.html` (a `models/<venue>.mjs` file) and add it to `MODELS.md` as `WAITING OWNER`.
   It goes into the game **after the owner's 👍**. The model gate robot does that by itself (see MODELS.md).
6. Every venue reports what it contains (`report()`: number of fans, markings, lights...). The sheet's
   **"Robot checks"** lines become fix tests in `tools/game-check/fixes/<game>.mjs`.

## Units

Sheets use metres. Most games use their own unit (hockey: 3.26 units = 1 m). Pass `unit` to the kit, so you never
re-scale by hand.

## The owner's words

When the owner gives a 👎 on a venue, his exact words go into the sheet's NEVER list and become a fix test.
Never remove a line.
