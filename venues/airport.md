# Venue: airport + runway

**Feel:** a real international airport, seen from the cockpit. Long runways with proper markings, lights at night,
taxiways, a terminal with planes at the gates, and a control tower.

## Runway (real sizes, metres)
- **Length 2,500–3,500 m, width 45 m** (60 m for big jets). Grey asphalt or concrete, with darker tyre marks in
  the touchdown zones.
- **Runway numbers** at each end = the compass heading ÷ 10, e.g. **09** at one end and **27** at the other (they
  always differ by 18). White numbers about **18 m tall**, just past the threshold.
- **Threshold "piano keys":** white stripes across the start of the runway (8 stripes for 30 m, **12 for 45 m**,
  16 for 60 m). Each is 30 m long and 1.8 m wide.
- **Centreline:** white dashes **36 m long with 24 m gaps**, 0.9 m wide.
- **Aiming point:** two big white bars (60 m × 10 m) either side of the centreline, **400 m** past the threshold.
- **Touchdown-zone marks:** pairs of white bars in groups of 3, 2, 2, 1, 1 every 150 m from the threshold.
- **Edge lines:** solid white, 0.9 m wide.
- **Lights:**
  - **edge:** white, every 60 m
  - **centreline:** white, turning red near the end
  - **threshold:** green
  - **runway end:** red
  - **approach lights:** a 900 m line of lights before the runway, with crossbars and a "rabbit" flash running
    toward it
  - **PAPI:** 4 lights on the left, 300 m in. 2 white and 2 red = on the right glide path (3°)
- **Blast pad** at each end (yellow chevrons), and grass either side with a few signs.

## Taxiways and apron
- **Taxiways 23 m wide**, with a **yellow centreline** and **blue edge lights** (green centre lights at night).
- **Hold-short lines** where taxiways meet a runway: 2 solid + 2 dashed yellow lines, with a red sign showing the
  runway numbers.
- Yellow-on-black **location signs** and black-on-yellow **direction signs**.
- **Apron:** a big concrete area at the terminal, with yellow lead-in lines to each gate and parked planes, fuel
  trucks, baggage carts and buses.

## Buildings
- **Terminal** with glass walls, 8–20 gates and **jet bridges** to the planes.
- **Control tower** 40–80 m tall, with a glass cab on top and a beacon (green and white).
- **Hangars** (big curved roofs), a cargo area, a **fire station**, a fuel farm and car parks.
- **Windsock** (orange and white) near each runway end.
- Perimeter fence, a road with cars, and a city or hills on the horizon.
- Lighting presets: `studio` / `field` for day, `night` for night flights (lights on).

## MUST
- Real runway size, numbers, markings and lights (including the PAPI and approach lights)
- Taxiways with yellow lines, blue lights and hold-short lines
- A terminal with planes at gates, a tower, hangars and a windsock

## NEVER
- A grey rectangle for a runway, or a runway with no numbers
- Real airport, airline or plane-maker names

## Robot checks
- Runway width 45 m within 3%, length >= 2500 m; runway numbers at both ends differ by 18
- Piano-key stripes = 12 per end for 45 m; centreline dash 36 m and gap 24 m within 5%
- `report().papi === 4`, approach lights `>= 20`, gates `>= 8`, tower `true`
