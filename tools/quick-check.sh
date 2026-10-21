#!/usr/bin/env bash
# QUICK CHECK (owner Oct 21 2026): run the game check robot on ONE game, before every pull request.
#   tools/quick-check.sh apexhockey.html
# Prints every red line the robot would post, and where the pictures are (quick-out/img/). Takes 1-3 minutes.
set -u
G="${1:-}"
[ -n "$G" ] || { echo "usage: tools/quick-check.sh apex<game>.html"; exit 2; }
[ -f "$G" ] || { echo "no such game page: $G"; exit 2; }
cd "$(dirname "$0")/.."
if ! node -e "require('playwright')" 2>/dev/null; then
  echo "installing the test browser once (~1 min)..."
  npm install --no-save --no-package-lock playwright@1.48.2 >/dev/null 2>&1
  npx playwright install --with-deps chromium >/dev/null 2>&1 || npx playwright install chromium >/dev/null 2>&1
fi
python3 -m http.server 8812 >/dev/null 2>&1 &
SRV=$!
sleep 2
ONLY="$G" SKIP_MODELS=1 node tools/game-check/check.mjs http://127.0.0.1:8812/ quick-out >quick-out.log 2>&1
kill $SRV 2>/dev/null
node -e '
const r = JSON.parse(require("fs").readFileSync("quick-out/results.json","utf8")).results.find(x => x.file === process.argv[1]);
if (!r) { console.log("the robot did not play " + process.argv[1] + " - see quick-out.log"); process.exit(1); }
console.log((r.status === "FAIL" ? "RED" : "CLEAN") + " - " + r.name + " (" + r.status + ")");
for (const f of r.fail) console.log("  RED: " + f);
for (const f of (r.fixes || []).filter(f => !f.ok)) console.log("  TEST FAILS: " + f.id + " - " + (f.note || f.ask));
for (const c of r.check) console.log("  check: " + c);
console.log("pictures: quick-out/" + Object.values(r.img || {}).join("  quick-out/"));
process.exit(r.status === "FAIL" ? 1 : 0);
' "$G"
