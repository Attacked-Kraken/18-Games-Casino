import urllib.request, time, sys, re, json, os
# Watches jobs/HELP.md (public repo, no login needed). Prints one line per NEW open HELP-VP / HELP-OWNER line. Run it with Monitor.
SEEN = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".helpseen.json")
URL = "https://raw.githubusercontent.com/Attacked-Kraken/18-Games-Casino/main/jobs/HELP.md?t=%d"
def get():
    r = urllib.request.Request(URL % time.time(), headers={"User-Agent": "mini-helper"})
    return urllib.request.urlopen(r, timeout=30).read().decode("utf-8", "replace")
def open_lines(txt):
    out, incode, L = [], False, txt.splitlines()
    for i, l in enumerate(L):
        if l.strip().startswith("```"): incode = not incode; continue
        if incode: continue
        s = l.strip()
        if not re.match(r"HELP-(VP|OWNER)\b", s) or re.search(r"window N\b.*G-NN", s): continue
        nxt = next((x.strip() for x in L[i+1:] if x.strip()), "")
        if re.match(r"(FIXED|WON'?T FIX):", nxt, re.I): continue
        out.append(s)
    return out
seen = set(json.load(open(SEEN))) if os.path.exists(SEEN) else None
while True:
    try:
        cur = open_lines(get())
        if seen is None:
            seen = set(cur); json.dump(sorted(seen), open(SEEN, "w")); print("ARMED: %d open lines already known (not alerted)" % len(cur), flush=True)
        for l in cur:
            if l not in seen:
                seen.add(l); json.dump(sorted(seen), open(SEEN, "w"))
                tag = "ADVISOR" if "advisor" in l.lower() else "ART-DIRECTOR" if "art director" in l.lower() else "ROBOT" if "robot" in l.lower() else "OWNER" if l.startswith("HELP-OWNER") else "VP"
                print("NEW HELP LINE [%s]: %s" % (tag, l[:300]), flush=True)
    except Exception:
        pass
    time.sleep(30)
