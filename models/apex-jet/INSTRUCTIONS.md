# Apex Arcade Jet: how to put it into apexflight.html

The files you need:
- `src/apexJet.js` has the model (6 styles × 8 paints, realistic PBR), the controls, `createApexJet`, `createJetControls`, `JET_STYLES`, `JET_PAINTS`, and `jetConfigFor`.
- `src/flightModel.js` has the physics, `JET_CONFIG`, and the Arcade/Normal/Pro presets.

`index.html` is the offline demo, with three.js r128 inlined. `glb/apex-jet-<style>.glb` holds one model per style, gear down. `apex-jet.glb` is the fighter.

Axes match the game: **+Z = nose, +Y = up, +X = left wing**. Units are metres.

**The wheels touch y = 0 when the jet's origin is at `jet.gearHeight`.** This value changes per style, so never hard-code it.

Both modules take `THREE` as an argument. They are written to work with the game's r169 (`import * as THREE from 'three'`). The demo uses r128 because it is the last version whose `examples/js` (GLTFExporter) can be inlined as a plain script for the iPhone chat viewer. Everything used (MeshPhysicalMaterial clearcoat, PMREM, PCF soft shadows, ShaderMaterial) exists in r169.

## Steps (one small PR per step)
1. Copy both files next to `apexflight.html`. Add:
   `import { createApexJet, createJetControls, JET_STYLE_KEYS, JET_PAINTS, JET_STYLES } from './apexJet.js';`
2. **Replace the model.** Delete the IIFE `(function buildPlane() {...})();` (around lines 469–520). Put this in its place:
   ```js
   const jet = createApexJet(THREE, { preset: 'normal', style: 'fighter', paint: 0 });
   const plane = jet.group; scene.add(plane); scene.add(jet.fx); scene.add(jet.worldFx);
   // fx = afterburner flames (kept outside the group so the REALITY size box ignores them); worldFx = wingtip vapour trails
   const gearWheels = jet.wheels;   // the same array stays valid after setStyle
   plane.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
   ```
   Replace `GEAR_H` (1.29) with `jet.gearHeight` everywhere.
3. **Physics: pick ONE option.**
   - **A (recommended).** In `step(dt)`, call `const s = jet.update(dt, jetInput);` and copy `s.pos`, `s.vel`, `s.onGround` and `s.thr` into `P`. Remove the old plane, prop, elevator and rudder lines (around 857–866). Respawn with `jet.flight.reset(x, z, heading[, airborne, speed, alt])`.
   - **B.** Keep the game's physics. Create the jet with `{ external: true }`, set `plane.position` and `plane.quaternion` yourself, and call `jet.update(dt, { pitch, roll, yaw, throttle, boost })` to animate the surfaces, gear, flames and lights.
4. **Controls.** Delete the old stick (around line 631, plus `#stickZone`). Add:
   ```js
   const jetInput = createJetControls(document.body, { rotated: () => innerHeight > innerWidth });
   jetInput.on('gear', d => jet.setGear(d)); jetInput.on('paint', () => jet.setPaint(jet.paint + 1));
   jetInput.on('style', () => jet.setStyle(JET_STYLE_KEYS.indexOf(jet.style) + 1));
   jetInput.on('cam', () => cockpit = !cockpit); jetInput.on('trick', n => jet.flight.startTrick(n));
   ```
   Call `jetInput.tick(dt)` every frame, before `jet.update`.
   - The stick follows one pointerId. It resets on pointerup, pointercancel, lostpointercapture, blur and visibilitychange.
   - The 14 pad buttons sit in a 3×5 grid in the bottom-right, inside the safe area. Every button is at least 44 px.
   - Remove `jetBtn`, or make its click call `jet.setPaint(jet.paint + 1)`.
5. **Camera.**
   - Chase offset: `-17 - speed*0.012` back, `+4.5` up.
   - Cockpit eye: `U*(jet.canopyY + 0.42) + F*canopy.z`.
   - Clamp `camera.position.y >= 0.6` so the camera never goes under the ground.
6. **Look (to match the demo).**
   - `renderer.toneMapping = ACESFilmicToneMapping`, sRGB output, and `shadowMap` PCFSoft.
   - A DirectionalLight with `castShadow`, a 2048 map, and a ±22 m ortho box that follows the jet every frame: `sun.position = jet + SUN_DIR*80; sun.target = jet`.
   - A HemisphereLight at 0.55.
   - **`scene.environment` = PMREM of a sky gradient plus a bright sun sphere.** Without it, the paint has nothing to reflect and looks flat. See the "environment for reflections" block in `src/demo.js`.
   - Add a LOW quality option: pixel ratio 1.25 and shadows off.
7. **REALITY hook.** Use `player: jet.group, contact: jet.wheels, kind: 'plane'`, and **add `expect: { span: [8, 16.5] }`**. The robot's small-plane range is 6–14 m, and the Delta is 16.1 m long. In `go(on)`, set `jetInput.throttle = 0.45`.

## Styles (`jet.setStyle(key | index)`, `opts.style`)
Sizes are the bounding box in metres with the gear down, measured headless. The robot uses the longest side.

| key | name | span × height × length | gearHeight | triangles | flight (× preset) |
|---|---|---|---|---|---|
| fighter | Twin-Tail Fighter | 10.48 × 5.01 × 15.39 | 1.75 | 22.3k | baseline |
| delta | Delta Interceptor | 9.78 × 5.65 × 16.09 | 1.85 | 21.0k | speed ×1.12, roll ×0.9, pitch ×0.85 |
| fwdswept | Forward-Swept X | 10.98 × 5.04 × 14.89 | 1.75 | 22.0k | pitch ×1.25, roll ×1.2, G ×1.12 |
| stealth | Stealth Wing | 13.96 × 2.50 × 8.85 | 1.45 | 5.8k (faceted) | speed ×0.88, roll ×0.7, floaty |
| sport | Sport Jet | 11.88 × 4.82 × 13.93 | 1.55 | 22.1k | speed ×0.8, roll ×0.65, G ×0.55 |
| canard | Canard Racer | 8.78 × 4.79 × 13.49 | 1.60 | 20.3k | roll ×1.35, pitch ×1.3, G ×1.18 |

What each model has:
- A lofted fuselage made of superellipse cross-sections, with an area-ruled waist and baked AO in the vertex colours.
- NACA 00xx airfoil wings, tails and canards, with rounded tips.
- Hinged airfoil control surfaces.
- Intake lips, a deep dark duct and a compressor face.
- Converging nozzles with 18 turkey-feather petals and a glowing flame holder.
- A gold-tint bubble canopy with a frame and sills, and an ejection seat with a pilot (helmet and visor).
- Landing gear with a strut, chrome oleo, torque links, drag brace, treaded tyres (twin nose wheel) and doors.
- Pitot, blade antennas, a refuel probe, and wingtip rails with missiles (on the fighter, delta, forward-swept and canard).
- An afterburner shader with shock diamonds, heat glow, nav, strobe and beacon lights, and wingtip vapour trails above 3.5 g.

## Paints (`jet.setPaint(index | name)`)
The default is #0. Each paint has a body colour, a secondary colour (belly, tips, surfaces) and a stripe/trim colour, with its own PBR settings:
- 0 Neon Strike (gloss clearcoat)
- 1 Inferno
- 2 Royal
- 3 Midnight Stealth (matte: roughness 0.88, no clearcoat)
- 4 Arctic
- 5 Toxic
- 6 Chrome (metalness 1, roughness 0.07)
- 7 Sunset

The textures are generated on canvas:
- Panel lines and rivets, which also feed the normal map.
- A grime roughness map.
- Tail soot and a dark radome.
- Stencils: "RESCUE", "NO STEP" and "DANGER INTAKE".
- "APEX ARCADE" on both fuselage sides and both wings, plus the "AA 07" tail art. The fins have separate UVs per face, so the text is no longer mirrored on either side.

"APEX ARCADE" is the only sponsor text.

## Flight config (`JET_CONFIG`, src/flightModel.js)
`jet.setPreset('arcade'|'normal'|'pro')` applies the preset plus the style multipliers. `jet.flight.setConfig({...})` changes values live.

| field | default | meaning |
|---|---|---|
| maxSpeed | 250 m/s | Hard speed cap, including afterburner. The demo's "Top speed" slider sets this, along with cruiseSpeed = 0.68 × maxSpeed. |
| cruiseSpeed | 170 m/s | Top speed at full dry throttle. Drag is calculated from this. |
| stallSpeed | 52 m/s | Below this, lift fades, the nose drops, and control authority falls (to a minimum of 30%). |
| takeoffSpeed | 68 m/s | Pulling back on the runway only rotates the nose above this speed. |
| landingSpeed | 62 m/s | Recommended touchdown speed, for HUD hints. |
| thrust | 30 m/s² | Acceleration at 100% dry throttle. |
| throttleResponse | 0.7 /s | How fast the engine follows the throttle lever. |
| afterburnerBoost | 1.5 | Thrust multiplier while BOOST is held. Only works above 50% throttle. |
| drag | 0 (auto) | Quadratic drag coefficient. 0 means thrust / cruiseSpeed². |
| liftCoefficient | 1.0 | 1 means level flight exactly at stallSpeed. Higher is floatier. |
| pitchRate / rollRate / yawRate | 1.3 / 2.8 / 0.45 rad/s | Rotation rates at full stick. |
| stability | 0.6 | 0..1 assist. When the stick is released, it levels the wings and brings the nose to the horizon. The demo's "Stability" slider sets this. |
| damping | 5 /s | How quickly rates follow the stick. |
| gLimit | 8 | Caps the pull (pitch rate ≤ gLimit·g / speed). |
| turnCoordination | 0.8 | 0..1. Banking turns the nose on its own. |
| autoTrim | true | Hands-off, the assist also holds altitude. |
| groundSteer / groundFriction / brake | 0.5 rad/s / 0.5 / 9 m/s² | Runway handling. |
| gearHeight | per style | Origin height on the wheels. |
| substepHz / maxSubsteps | 120 / 15 | Fixed-step physics: no jitter or flipping at low fps. |

Presets:
- **arcade:** stability 0.95, stall 38, 6 g.
- **normal:** the defaults above.
- **pro:** stability 0.12, faster rates, 9 g, no autoTrim.

Safety: inputs are clamped, dt is clamped to 0..0.25 s, and if any value becomes NaN the state rolls back to the last good frame (`state.nanRecovered` counts it).
Tricks: `jet.flight.startTrick('barrelRoll'|'loop'|'immelmann'|'splitS')`. Each trick is closed-loop on the jet's real rotation.

## Prove it works (attach these to the PR)
1. Screenshots at 844×390: on the runway, a wheel close-up, chase view on BOOST, and the phone UI.
2. For every style (`setStyle` in a loop), the lowest wheel's `Box3.min.y` on the runway is 0 ± 0.02, and the size is inside `expect.span`.
3. Hold full throttle and pull back above takeoffSpeed. Each style should be airborne within about 4 s.
4. Every `button` is inside the viewport, at least 44×44, doesn't overlap another button, and isn't under the stick zone.
5. Run 60 s of random stick input at random dt (1/120–0.1 s), then 10 s hands-off. Expect 0 NaN, and up.y > 0.95 on Arcade.
6. No console errors, and the game-check and REALITY robots are green.
