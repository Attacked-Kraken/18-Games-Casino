#!/usr/bin/env python3
"""Count lines of the casino's own code (.html/.js/.css), excluding vendor/, three.module.min.js and minified files.
Writes stats.json {lines, files, updated}. Run before each commit (CI also regenerates it on push)."""
import json, os, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'vendor', '.git', 'node_modules', '.github'}
lines = files = 0
for d, dirs, fs in os.walk(ROOT):
    dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
    for f in fs:
        if not f.endswith(('.html', '.js', '.css')) or '.min.' in f: continue
        p = os.path.join(d, f)
        with open(p, encoding='utf-8', errors='ignore') as fh: txt = fh.read().split('\n')
        if txt and max(len(l) for l in txt) > 5000 and len(txt) < 20: continue  # minified
        lines += sum(1 for l in txt if l.strip()); files += 1
prev = {}
try:
    prev = json.load(open(os.path.join(ROOT, 'stats.json')))
except Exception: pass
out = {'lines': lines, 'files': files, 'updated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
if prev.get('lines') == lines and prev.get('files') == files: out['updated'] = prev.get('updated', out['updated'])
with open(os.path.join(ROOT, 'stats.json'), 'w') as fh: json.dump(out, fh)
print(out)
