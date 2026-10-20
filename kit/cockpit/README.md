# Open-Wheel Cockpit — realistic 3D interior

A generic open-wheel single-seater cockpit modelled entirely in code with three.js (r128). No brands, logos, or real team or car names.

## Files
- `index.html` — the whole viewer in one offline file (three.js plus the RoomEnvironment, OrbitControls and GLTFExporter add-ons are inlined; no internet needed). Open it in Safari or the chat HTML viewer.
- `cockpit.glb` — the same model as glTF binary. The steering wheel is its own node named **`SteeringWheel`**. Rotate it about its local Z axis to steer. Its parent `Wheel_Mount` holds the column angle. Buttons are `Button_*`, dials `Rotary_*`, paddles `Paddle_Upshift` / `Paddle_Downshift` / `Clutch_Paddle_*`, LEDs `LED_0..14`.
- `src/` — source (`app.js`, `shell.html`, `build.py`, which rebuilds index.html).

## What's modelled
- Carbon monocoque tub with a procedural 2x2 twill weave and clearcoat. Tapered nose, cockpit rim with suede pad, dash/bulkhead with switches, bolt heads and wiring looms.
- Halo safety bar with titanium mounts, mirrors with real reflections, padded headrest and side pads.
- Molded seat with a 6-point harness, aluminium buckle and adjusters. Footwell pedal box: drilled brake and throttle pedals, master cylinders, bias bar.
- Front wheels and tyres, wishbones, push rods, track rods, front wing with endplates. Sidepods, engine cover, airbox.
- Steering wheel on a quick-release hub and column: rubber grips, center display, a 15-LED shift-light strip, 8 buttons, 5 rotary dials, shift paddles and clutch paddles.
- PBR physical materials (carbon, brushed aluminium, titanium, rubber, suede, foam). Room environment lighting, soft shadows, ACES tone mapping.

## Controls
- **Turn the wheel:** click/touch and drag around its center. It turns up to ±270° with hard stops, springs back to center when you let go. Arrow keys also turn it.
- **Drag anywhere else** to orbit, scroll or pinch to zoom, right-drag or two-finger drag to pan.
- **Tap buttons, dials and paddles:** buttons press in, dials click round, paddles change gear on the display.
- **Camera presets:** Driver's eye, Three-quarter, Wheel close-up. **Export GLB** saves or shares `cockpit.glb`.
