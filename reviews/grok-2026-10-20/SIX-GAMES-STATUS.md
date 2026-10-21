# SIX SPORTS GAMES — STATUS + FIX LIST (Grok review, Oct 20 2026 ~10:45 PM CT)
Review only. Repo at main (git pull: already up to date). Scores = audit.py headless (swiftshader; fps numbers are software-render hints, compare relative only).

## Builder work in flight / merged (last ~12h, times CT)
| Game | Open PRs | Merged |
|---|---|---|
| Baseball | #805 G-65 real-proportion players + TV cams (Muse Modern Plus, opened 9:48 PM, checks green); #801 G-57 TESTER 3 proven problems (9:23 PM, failing on purpose) | #794 G-51 kit grass/infield (9:14 PM) |
| Hockey | none | #790 G-52 career start un-stalled (Muse Dash, 8:37 PM); #797/#799 G-59 tester findings |
| Flight | #813 G-69 REALITY hook + wheels on ground (Muse algre141, opened 10:29 PM, green) | #806 G-53 descend at cruise speed (10:14 PM) |
| Track & Field | #812 G-68 final results once, one button, dark backing top-left words (10:25 PM, green) | #804 G-63 __reality hook (9:58 PM); #788 G-58 throw meters (8:35 PM); #785 G-49 jumps (8:10 PM) |
| F1 | none | #789 G-55 start heading (8:57 PM); #798 G-54 draw calls (9:20 PM) |
| Exotic Racer | none | #784 G-50 fetched GLB traffic (8:14 PM) |
Also open: #807 phone layout robot (green, not yet merged).

**Nobody is on Hockey defense, F1 lights, or Exotic Racer invisible/blob cars yet.**

## Scores (audit.py)
Baseball 3/10 · Flight 4/10 · Racer 6/10 · Hockey 7/10 · F1 8/10 · Track&Field 6/10 (hook present; fails console 404, off-screen item, fps hint, stick release).
Every game logs one or two 404s. No missing src/href file found in the html, so it is most likely /favicon.ico. Fix: add `<link rel="icon" href="data:,">` in <head> of each game.

## 1. Baseball — apexbaseball.html (3/10)
- **Stick/aim release (owner's "stick fix")** L1424-1425: aimPad has only pointerdown/pointermove; no pointerup/pointercancel/blur, and the file has 0 blur/visibilitychange handlers. Fix after L1425:
```js
const aimEnd=e=>{ try{aimPad.releasePointerCapture(e.pointerId)}catch(_){} };
['pointerup','pointercancel','lostpointercapture'].forEach(t=>aimPad.addEventListener(t,aimEnd));
addEventListener('blur',()=>{ /* clear any held swing/aim state here */ });
document.addEventListener('visibilitychange',()=>{ if(document.hidden) dispatchEvent(new Event('blur')); });
```
  Also `if(e.buttons)` in pointermove fails on iOS touch (buttons can be 0); track `aimPad._pid=e.pointerId` and check `e.pointerId===aimPad._pid`.
- **No window.__reality** — add per REALITY.md (copy pattern from apextrackfield.html L3593).
- **UI overlap**: `#viewBtn` overlaps `#helpHud` (both orientations), fix by moving helpHud down/left or viewBtn to the right safe-area.
- **Perf**: 5 fps hint, second-worst. #805 adds players + cameras, so re-check fps after it merges (InstancedMesh crowd, cap pixelRatio at 2).

## 2. Hockey — apexhockey.html (7/10)
- **Defense (owner complaint)**: no PR exists. Assign a job: AI defenders gap-control (stay between puck carrier and own net), poke-check in range, and back-check when possession flips.
- Stick L706-722: touch-only joystick, with touchcancel handled (good). No blur reset; the only visibilitychange is at L1664 and it pauses but never zeroes joyVec. Fix:
```js
addEventListener('blur',()=>{ joyVec.x=joyVec.y=0; joyVec.active=false; knob.style.transform='translate(-50%,-50%)'; });
```
  (the joy block is scoped in `{}`, so put this inside that block at L722).
- **No window.__reality**.
- **Perf**: 1.1 fps hint, very heavy. Profile the crowd/arena draw calls.

## 3. Flight — apexflight.html (4/10)
- **__reality hook**: in PR #813 (green). Merge it, then re-audit.
- Stick L645: pointerup/cancel handled, no blur. Add `addEventListener('blur',end)` (with a synthetic arg so `end` resets the stick).
- **Off-screen**: btnFree, friendGo, friendClose. **Overlap**: back x jetBtn, stick x stickZone, stickZone x friendBtn/friendGo. Clamp the friend panel inside the safe area and move jetBtn off the back button.

## 4. Track & Field — apextrackfield.html
- Hook present (L3593); stick cancel L3515 OK.
- **Results twice**: `showScreen('results')` is called from 7 places (L3089, 3107, 3204, 3216, 3224, 3339). showFinal (L3091-3108) runs after the last event's per-event results, so the player sees two results screens. PR #812 targets this. After it merges, verify that the last event goes straight to final standings, with a single BACK TO MENU button whose `G.nextFn` goes to the menu.

## 5. F1 — apexf1.html (8/10, best of the six)
- **Start lights** L1612-1636: the lights div is rebuilt each start, but `setTimeout(()=>hidden,600)` (L1631) is never cancelled. A restart within 600 ms hides the new lights. Fix: `clearTimeout(this._lt); this._lt=setTimeout(...)` and also `clearTimeout(this._lt)` inside startLights(). Also, `n` starts at 1 immediately (`floor(t/0.8)+1`), so the first lamp lights at t=0 and sound plays with no pause. Use `Math.floor(this.stateT/0.8)` so there is a beat before lamp 1.
- **Direction**: #789 merged the start heading fix. Owner still reports direction, so the REALITY robot direction check should confirm it once the hook exists.
- **No window.__reality**; 2 buttons under 44px.
- Stick L1406-1409 is touch-based, with cancel handled; there is no blur reset. Add `addEventListener('blur',()=>{stickId=null;Input.steer=0;setKnob(0);})`.

## 6. Exotic Racer — apexracer.html (6/10)
- **Invisible cars** L303-304 + L1009: a failed GLB load sets `glbTpl[k]=null`, then `glbTpl[key].clone(true)` throws, the car is never added, and it shows as invisible. Fix:
```js
const tpl = glbTpl[key] || glbTpl.goblin;           // fallback
if(!tpl){ console.warn('no car model',key); return makeBoxCar(cfg); }
const model = tpl.clone(true);
```
  and preload must be awaited before the first race spawns cars.
- **Blob cars** L1020+: paint is only swapped if `material.name` is in `MC.body`. Names that don't match leave Sketchfab "palettematerial" atlases, which look like blobs. Each model's centre/scale is also not normalized. Fix: after clone, `new THREE.Box3().setFromObject(model)` and scale to the car length, and log any unmatched material names once so the list in L295-299 can be corrected.
- Off-screen: `#nmB`. 6 buttons under 44px. Perf hint 0.5 fps: GLB clones share geometry, but each gets new materials. Cache bodyMat per paint.
- **No window.__reality**.

## Order for builders
1. Merge #813, #812, #805, #807.
2. Baseball stick (above).
3. Racer null-model fallback.
4. Hockey defense job (NEW).
5. F1 lights timeout.
6. __reality hooks in Baseball/Hockey/F1/Racer.
7. Favicon 404 everywhere.
