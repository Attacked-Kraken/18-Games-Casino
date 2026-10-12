# builds the tiny HTML shell for a kit game: python3 tools/mkpage.py id "Title" "#accent" [mp]
import sys
gid, title, ac = sys.argv[1:4]; mp = len(sys.argv) > 4
mps = '<script src="vendor/peerjs.min.js"></script><script src="mp.js"></script>\n' if mp else ''
open(gid + '.html', 'w').write(f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<script src="age-gate.js"></script>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<title>{title} · 18 Games Casino</title>
<meta name="theme-color" content="#07030c"><meta name="robots" content="noindex">
<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="icon" href="{gid}-icon.png">
<script src="chips.js"></script><script src="arcade-record.js"></script><script src="casino-math.js"></script>
{mps}</head><body style="--ac:{ac}">
<script type="module" src="{gid}.js"></script>
</body></html>
''')
