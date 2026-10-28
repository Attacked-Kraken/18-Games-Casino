# OWNER RIM-FIT · apexracer.html · window 6

TARGET: owner's spec (Oct 28 2026 7:36 AM CDT): "The rims should fit in tire and should switch and show the look with every option pressed it should change what the rims are."
STATUS: shipped
VERSION: 751033c652c4ec31a04f4727b4a8d1715804e4bd
OLD: bare fetched rims fitted at 1.00x the tyre diameter (measured), the "red square" in the wheel was the caliper drawn as a 0.14 x 0.20 m slab with no brake disc at all, and a fetched style whose model failed to load silently drew a 1,640-vert procedural stand-in in the rim colour (the real Mesh is 130,328 verts)
CHANGED: rim fit - bare fetched rims now fit at 0.74x the tyre diameter, face seated flush at the tyre surface (measured -0.001..-0.006 m)
CHANGED: rim switching - a fetched style never draws the stand-in; a missing model reloads and the real wheel swaps itself into the garage car
CHANGED: brakes - real brake disc behind every rim and the caliper shrunk from the 0.20 m slab to brake size; guards never-caliper-billboard, never-rim-seat-size, never-rim-fake, play-rims-switch-presses in tools/game-check/fixes/apexracer/rimfit.mjs
OWNER CHECK IN 30 SECONDS: https://attacked-kraken.github.io/18-Games-Casino/apexracer.html?test=rims - the rims lab: every style sits inside the tyre and changes the look the moment you press it (hard-refresh the page first)
