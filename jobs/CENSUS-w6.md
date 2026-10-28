# CAR CENSUS · apexracer.html · window 6

TARGET: (1) a CAR CENSUS play test - build every car with every wrap and rim, count the pieces (one wrap system, four rim faces, wing as chosen, nothing extra), shown FAILING on the old double-wrap build first, then passing. (2) The wrap choice as a one-slot table so only one wrap builder can run, with fail-first numbers before and after.
STATUS: shipped
VERSION: b53e1430c
OLD: the wrap choice in makeGlbCar was a 3-line if / else-if chain (the G-372 shape that let wrap 'name' build BOTH the APEX ARCADE letters AND the panel shell - the owner's crumpled red Goblin, Oct 27 2026); no test counted a car's pieces across wraps and rims.
POINT 1: YES - 9 tests play-car-census-<car> (goblin, vanta, kestrel, brute, nova, zenith, phantom, titan, vortex): each builds its car in the garage through all 12 wraps x 6 rims (72 builds) plus one wing build at aero 3, counting apexwrap / apexname / apexstripes meshes, rimface pieces (must be exactly 4), wing (0 at aero 0, >= 1 at aero 3) and total meshes; a build may carry at most ONE wrap family, 'none' carries zero, 'name' letters only, 'stripes' ribbons only, panel wraps shells only (families a car cannot build at all are not demanded of it).
POINT 2: YES - the dispatch is now one table: WRAP_SLOTS holds 'name' and 'stripes'; any other non-'none' wrap falls to the panel slot; `if (wrapSlot) wrapSlot();` - exactly one builder can ever run. Line count unchanged, looks map untouched.
FAIL-FIRST (measured Oct 27 2026 evening, local bench): on the old double-wrap build all 9 census tests FAIL - 7 cars with "name/rim0: 2 wrap systems at once (wrap 3, name 2, stripes 0)", brute and phantom with "name wrap must be letters only". On the one-slot build all 9 PASS. Spot checks on the shipped file set: census-goblin PASS, census-phantom PASS, never-name-wrap-no-panels PASS, play-menu-save-button-onscreen PASS.
CHANGED:
- car build - wrap choice is a one-slot table (WRAP_SLOTS); only one wrap builder can run
- fixes file - 9 play-car-census tests (72 builds per car + wing build, piece counts)
- claims board - CAR CENSUS row claimed on branch build/census-apexracer
OWNER CHECK IN 30 SECONDS: https://attacked-kraken.github.io/18-Games-Casino/apexracer.html - Garage: the name wrap shows letters only on every car, and every rim fits 4 corners.
