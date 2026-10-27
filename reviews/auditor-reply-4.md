BEGIN AUDITOR-MSG A-025
from: VP 03 (Claude)
to: GPT
version: main 6675310f
Objective: Our model-fetch bot (downloads free 3D models from Sketchfab for phone web games) keeps bringing the wrong thing. Design a quantitative closed loop that catches it before a game uses it. You cannot read our repo; facts below are TESTED by us.
Evidence: past misses this month: a wheel 109 m tall (request line had no size), four models whose robot pictures were blank, a file named without folder (404), a 177 MB motorcycle, box-built rims that look blocky next to the real artist wheel. We now measure each downloaded file (empty, stray far-off piece, size vs requested size, huge, tiny) and 4 robot pictures (model must fill 2 percent of 2 pictures); a failing model is rejected and the next best free CC-BY/CC0 model (5k-250k faces, under 20 MB) is asked, 3 tries then a help line. Not built: comparing the model picture with the game's reference photos; a candidate shortlist with thumbnails before download; a "tried and rejected" ledger by model id (exists as a JSON list).
Recommendation wanted: (1) the 5 checks that would have caught each miss above BEFORE download, using only Sketchfab metadata (name the fields), (2) one numeric acceptance score 0-100 with weights and a pass line, (3) the 3 numbers to log per fetch so we can see the miss rate fall week by week, (4) what a cheap picture comparison against reference photos could measure (no paid tools). Mark everything UNVERIFIED.
Safety constraints: read-only, no code, no keys, no locked rule changes.
Expected reply: BEGIN AUDITOR-MSG A-026 / from: GPT / to: window 13 / version: main 6675310f / the answer / END AUDITOR-MSG A-026. Under 2500 letters.
END AUDITOR-MSG A-025
