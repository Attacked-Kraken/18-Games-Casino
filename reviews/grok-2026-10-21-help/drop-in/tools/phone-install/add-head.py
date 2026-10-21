#!/usr/bin/env python3
"""JOB-03: put the phone-install <head> snippet into the 6 sports games. Safe to run twice.
Usage (from the repo root): python3 tools/phone-install/add-head.py"""
import os, re
SIX = ['apexbaseball.html', 'apexhockey.html', 'apexflight.html', 'apextrackfield.html', 'apexf1.html', 'apexracer.html']
snip = open(os.path.join(os.path.dirname(__file__), 'install-head.html')).read().strip()
for g in SIX:
    s = open(g, encoding='utf-8').read()
    if 'JOB-03 phone install' in s: print('already has it:', g); continue
    s = s.replace('<link rel="manifest" href="manifest.webmanifest">\n', '')         # that one is the casino app - it opened the casino
    for tag in ('apple-mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style'):  # avoid duplicates
        s = re.sub(r'<meta name="%s"[^>]*>\n?' % tag, '', s)
    m = re.search(r'<meta charset[^>]*>\n?', s, re.I) or re.search(r'<head[^>]*>\n?', s, re.I)
    s = s[:m.end()] + snip + '\n' + s[m.end():]
    open(g, 'w', encoding='utf-8').write(s); print('added:', g)
