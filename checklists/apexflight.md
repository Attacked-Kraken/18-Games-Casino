# Apex Flight Checklist (apexflight.html)

DRAFT — tester window 9, G-231. Each item has SOURCE (file), NUMBERS (copied word-for-word), MEASURE (robot can do), TEST (tester-chk-<id>).

## 1. Jet model
- SOURCE: rules/short/apexflight.md
- NUMBERS: "models/apex-jet"
- MEASURE: Check `window.__flight.jet` exists and `jet.group` is a THREE.Group (not boxes)
- TEST: tester-chk-jet-model

## 2. Takeoff
- SOURCE: rules/short/apexflight.md
- NUMBERS: "takeoff"
- MEASURE: From free flight start, full throttle → liftoff (ground=false) within 3000 frames
- TEST: tester-chk-takeoff

## 3. Landing on runway scores
- SOURCE: rules/short/apexflight.md
- NUMBERS: "landing ON the runway scores"
- MEASURE: In challenge mode, touchdown with |x| ≤ 14 and -700 < z < 700 → phase='scored'
- TEST: tester-chk-landing-scores

## 4. Off-runway tells pilot
- SOURCE: rules/short/apexflight.md
- NUMBERS: "off the runway tells the pilot"
- MEASURE: In challenge mode, touchdown off runway → flash message shown
- TEST: tester-chk-offrunway-message

## 5. Ocean crashes
- SOURCE: rules/short/apexflight.md
- NUMBERS: "the ocean always crashes"
- MEASURE: Fly to x < -9950 → phase='crashed'
- TEST: tester-chk-ocean-crash

## 6. Wingspan in real range
- SOURCE: REALITY.md
- NUMBERS: "8-11 wing span"
- MEASURE: Box3 of jet model → width between 8 and 11 meters (±15%)
- TEST: tester-chk-wingspan

## 7. Ground contact
- SOURCE: REALITY.md
- NUMBERS: "gap under 3 cm"
- MEASURE: Lowest wheel point minus ground height < 0.03m while grounded for 3s
- TEST: tester-chk-ground-contact

## 8. Facing direction
- SOURCE: REALITY.md
- NUMBERS: "dot of facing vs track direction > 0.9"
- MEASURE: Forward vector · velocity direction > 0.9 for 5s of flight
- TEST: tester-chk-facing

## 9. Touch targets
- SOURCE: DONE.md
- NUMBERS: "≥ 44x44 CSS px"
- MEASURE: All pad buttons bounding boxes ≥ 44x44 CSS pixels
- TEST: tester-chk-touch-targets

## 10. Speed band
- SOURCE: apexflight.html
- NUMBERS: "55-88kt"
- MEASURE: Challenge touchdown at 55-88kt → no downgrade; outside → downgrade applied
- TEST: tester-chk-speed-band
