# PLAN · JOB J54 · Ice Hockey Arena (venues/kit/rink.js)

**The 30-second fun:** The player skates out into a full NHL barn — 18,000 seats rising on all four sides, the crowd on its feet and roaring after a goal, the centre-hung scoreboard flashing the score in real 7-segment digits, arena light cutting through the air above the ice. It feels like Game 7, not a practice rink. (Venue only — the lead wires it into apexhockey.html.)

**The first 60 seconds:** In tools/venue-viewer.html the arena loads complete — ice, boards, glass, full bowl, moving crowd, lit scoreboard — and the camera makes one slow sweep around the bowl so the owner sees every side with no interaction. The "wow" is the bowl: stands all around, not an empty black void past the glass.

**Controls:** Venue viewer orbit only (drag to rotate, scroll/pinch to zoom — the standard viewer controls). No game controls in this file; the lead owns gameplay in apexhockey.html.

**Camera (ONE spec):** Viewer sweep — starts 18 m above the ice and 32 m back from centre ice on the side, looking at centre ice; slow 360° orbit at that height showing all four sides of the bowl, never through walls or under the ice.

**Looks like (3 reference pictures):**
1. EA NHL 24 broadcast view — copy the low TV camera angle, the steep crowd bowl rising on all sides, and the big centre-hung jumbotron over centre ice.
2. A real NHL barn at puck drop (Bell Centre / United Center) — copy the lighting catwalk glow from above, the glass reflections, and the sheer wall of people.
3. Today's apexhockey game-check picture — copy what the owner already likes up close (ice markings, boards, glass); the bowl gets built around it, nothing up close changes.

**KEEP - stays exactly as now:**
- The ice surface with every marking (real NHL 60.96 × 25.9 m, centre circle, faceoff dots/circles, creases, lines) — owner liked it.
- Boards with kick plate + glass + goals with nets, as now.
- The ~6 draw calls the rink itself costs today; the whole arena stays under 450.
- Do NOT touch apexhockey.html (lead's file).

**Stages (one PR each, robot-checked):**
1. Bowl + crowd — full NHL-size bowl of stands all around (instanced, one material), big moving crowd (instanced bodies, idle sway + goal-cheer jump), proves the bowl shape and the draw-call budget.
2. Scoreboard + lighting — centre-hung scoreboard with real 7-segment digits from kit/apex-fx.js, arena lighting rig (catwalk glow, ice sheen), glass polish.
3. Final — venue-viewer integration, MODELS.md Hockey arena → WAITING OWNER with 3 new pictures, draw calls verified under 450, play tests green.

**Done means:**
1. tools/venue-viewer.html renders the full arena: ice + boards + glass + full bowl + moving crowd + scoreboard + lighting.
2. MODELS.md Hockey arena entry is WAITING OWNER with 3 new pictures.
3. Robot draw calls under 450.
4. The crowd visibly moves and cheers on goals.
5. The scoreboard shows 7-segment digits from kit/apex-fx.js.
6. The ice, boards, and glass look the same up close as now.
