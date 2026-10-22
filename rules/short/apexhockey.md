# Ice Hockey - the short list (apexhockey.html, builder window 2, tester window 8)
1. Real skater models (MODELS.md, locked ones never swapped), own team names/colors/numbers, numbers readable, face visible through the cage.
2. Owner's model sheet: ~7.5 heads, forward lean 15-20°, knee flex 25-30°, visor, shoulder pads, big gloves, shin guards, steel blades - tested in fixes/apexhockey.mjs.
3. Stick in both hands, blade flat, the puck rides the blade; skates ON the ice (REALITY contact at the blade edge).
4. AI teammates hold the blue line until the puck crosses it - never offside because of the AI.
5. Hockey by its rules (rules/hockey.md): icing, offside, faceoffs, goals restart play, periods end - each a passing play test; the game loop never stalls on a slow screen.
6. The arena follows venues/rink.md (lighting preset rink).
7. Sharp picture, phone budget (draw calls under the limit), start button on screen sideways.
8. Controls come from kit/controls.js only; let go = stop.
9. One fix per job; a play test proves every owner point; report POINT k: YES/NO.
