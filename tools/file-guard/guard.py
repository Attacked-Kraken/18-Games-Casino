#!/usr/bin/env python3
"""File guard (owner 2026-10-17: "make sure this doesn't happen again").

On 2026-10-17 one helper's GitHub tool saved CLAIMS.md as one long line of base64 (every
helper then read gibberish), and saved apexf1.html "double-encoded", so every emoji and
symbol turned into junk (🏆 -> "ð", — -> "â", · -> "Â·").

This robot runs on GitHub after every push (and every hour as a safety net) and REPAIRS
both kinds of damage by itself, on the same branch:
  1. a text file saved as base64  -> decoded back to the real text
  2. a text file saved as UTF-16  -> rewritten as normal UTF-8
  3. double-encoded (garbled) characters -> turned back into the right symbol/emoji
It only changes a file when the repair is certain (the garbled bytes decode cleanly into
real characters), so normal text and accented letters are never touched.

Usage: python3 tools/file-guard/guard.py [--check] [files...]
  no files  -> checks every tracked text file
  --check   -> report only, change nothing (exit 1 if anything is broken)
"""
import base64, os, re, subprocess, sys

TEXT_EXT = ('.html', '.htm', '.md', '.js', '.mjs', '.json', '.css', '.txt', '.svg', '.yml', '.yaml', '.py', '.csv')
SKIP_DIRS = ('vendor/', 'node_modules/', '.git/')
SKIP_FILES = ('three.module.min.js',)
B64_RE = re.compile(r'^[A-Za-z0-9+/=\s]+$')
CP1252_EXTRA = set('ŒœŠšŸŽžƒˆ˜–—‘’‚“”„†‡•…‰‹›€™')

def tracked_files():
    out = subprocess.run(['git', 'ls-files'], capture_output=True, text=True, check=True).stdout.split('\n')
    return [f for f in out if f]

def wanted(path):
    return path.lower().endswith(TEXT_EXT) and not path.startswith(SKIP_DIRS) and os.path.basename(path) not in SKIP_FILES

def looks_like_text(s):
    if not s: return False
    bad = sum(1 for ch in s[:4000] if ord(ch) < 32 and ch not in '\n\r\t')
    return bad == 0 and ('\n' in s or len(s) < 400)

def fix_base64(raw):
    """A whole text file saved as base64 -> its real text (or None)."""
    t = raw.decode('ascii', 'replace').strip()
    if len(t) < 200 or '\n' in t.strip() and t.count('\n') > 2 or not B64_RE.match(t):
        return None
    try:
        dec = base64.b64decode(re.sub(r'\s+', '', t), validate=True).decode('utf-8')
    except Exception:
        return None
    return dec if looks_like_text(dec) else None

def fix_utf16(raw):
    if raw[:2] in (b'\xff\xfe', b'\xfe\xff'):
        try: return raw.decode('utf-16')
        except Exception: return None
    return None

CONT = '[\u0080-\u00bf' + ''.join(sorted(CP1252_EXTRA)) + ']'
# one double-encoded UTF-8 character: a lead byte followed by exactly the continuation bytes it needs
SEQ_RE = re.compile('[\u00f0-\u00f4]' + CONT + '{3}|[\u00e0-\u00ef]' + CONT + '{2}|[\u00c2-\u00df]' + CONT)

def _bytes(run):
    out = bytearray()
    for c in run:
        o = ord(c)
        if o < 256: out.append(o)                       # latin-1 view (also covers cp1252's 5 unused bytes)
        else: out += c.encode('cp1252')                 # cp1252 view (\u20ac -> 0x80, \u2014 -> 0x97 ...)
    return bytes(out)

def fix_mojibake(s):
    """Double-encoded UTF-8 ('ð' 'â' 'Â·' ...) -> the real characters. Returns (text, count)."""
    count = 0
    def one(m):
        nonlocal count
        try:
            ch = _bytes(m.group(0)).decode('utf-8')
        except (UnicodeDecodeError, UnicodeEncodeError):
            return m.group(0)
        if len(ch) != 1 or ord(ch) < 0x80:
            return m.group(0)
        count += 1
        return ch
    return SEQ_RE.sub(one, s), count

def repair(path, check):
    try:
        raw = open(path, 'rb').read()
    except Exception:
        return None
    if not raw: return None
    msgs = []
    text = fix_utf16(raw)
    if text is not None: msgs.append('was saved as UTF-16')
    else:
        text = fix_base64(raw) if (b'\n' not in raw.strip() or raw.count(b'\n') <= 2) else None
        if text is not None: msgs.append('was saved as base64 (one long scrambled line)')
        else:
            try: text = raw.decode('utf-8')
            except UnicodeDecodeError: return None
    text2, n = text, 0
    for _ in range(3):                       # text garbled twice needs two passes
        text2, k = fix_mojibake(text2); n += k
        if not k: break
    if n: msgs.append('%d garbled symbol%s (double-encoded) restored' % (n, '' if n == 1 else 's'))
    if not msgs: return None
    if not check:
        open(path, 'w', encoding='utf-8', newline='').write(text2)
    return path + ': ' + '; '.join(msgs)

def main(argv):
    check = '--check' in argv
    files = [a for a in argv if not a.startswith('--')] or tracked_files()
    report = [r for r in (repair(f, check) for f in files if wanted(f) and os.path.isfile(f)) if r]
    for r in report: print(('BROKEN ' if check else 'REPAIRED ') + r)
    summ = os.environ.get('GUARD_SUMMARY')
    if summ: open(summ, 'w').write('; '.join(report))
    if not report: print('file guard: all text files are clean')
    return 1 if (check and report) else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
