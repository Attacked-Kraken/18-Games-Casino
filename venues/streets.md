# Venue: city streets (street racing)

**Feel:** a rich city at night. Wet-looking roads, neon, glass towers, and traffic you weave through.

## Roads (real sizes, metres)
- Lanes **3.5–3.7 m** wide. White dashed lane lines (3 m dash, 9 m gap), a double yellow centre line on two-way
  roads, and solid white edge lines.
- **Kerbs** 15 cm high, **sidewalks** 3–5 m wide with street lights every 30 m, trees, benches and bus stops.
- **Intersections** with traffic lights, crosswalks (white zebra bars) and stop lines.
- **Highway sections:** 3–4 lanes each way, a concrete median barrier, overhead signs (our own place names) and
  on/off ramps.
- Bridges, tunnels with lights, and a waterfront.

## The city
- Buildings of different heights, with lit windows at night, shop fronts, signs (our own brands) and parked cars.
- **Traffic:** cars, buses and trucks driving in lanes and stopping at lights. Never driving through each other.
- Pedestrians on the sidewalks (shared human kit, simple walk).
- Lighting preset: `night`, with reflections on the road.

## MUST
- Real lane widths and markings, sidewalks, street lights and traffic lights
- A lit, detailed city with real-looking traffic

## NEVER
- A road floating in a void, or boxes with no windows
- Real car brands, real city skylines or real company signs

## Robot checks
- Lane width 3.5–3.7 m; `report().streetLights >= 50`; traffic cars `>= 12`
