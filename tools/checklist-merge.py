#!/usr/bin/env python3
"""Merge a checklist file by ITEM, not by text (owner Oct 24 2026: PR #1355 sat 'dirty' for 15 h and the merge robot posted
960 'conflicts' comments - checklists/*.md were never auto-resolvable).

A checklist line is  - [ ] H14 | ... | TEST: tester-chk-h14 [| RESULT: ...]   ([ ] open, [x] ticked, [-] dropped).
Two PRs conflict when a tester ticks one item while main changed the same line or the lines around it. Rule, per item id:
  - only one side changed the item since the common base  -> take that side's line;
  - both changed it                                       -> take the more FINISHED line (has RESULT, then [x]/[-] over [ ]),
                                                             a tie keeps main's line;
  - an item only the PR has (new)                          -> added after the item that precedes it in the PR;
  - an item only main has                                  -> kept.
Every other line (title, notes) comes from main. Usage: checklist-merge.py BASE PR MAIN OUT   (exit 0 = written)."""
import re
import sys

ITEM = re.compile(r"^\s*-\s*\[(.)\]\s*([A-Za-z]+\d+)\s*\|")


def read(path):
    try:
        return open(path, encoding="utf-8", errors="replace").read().split("\n")
    except OSError:
        return []


def items(lines):
    d = {}
    for l in lines:
        m = ITEM.match(l)
        if m:
            d[m.group(2).upper()] = l
    return d


def progress(line):
    m = ITEM.match(line)
    if not m:
        return -1
    return (2 if "RESULT:" in line else 0) + (1 if m.group(1) in "x-" else 0)


def merge(base, pr, main):
    b, p, m = items(base), items(pr), items(main)
    out = list(main)
    pos = {}
    for i, l in enumerate(out):
        mm = ITEM.match(l)
        if mm:
            pos[mm.group(2).upper()] = i
    # existing items: decide per id
    for k, i in pos.items():
        if k not in p:
            continue
        pl, ml, bl = p[k], m[k], b.get(k)
        if pl == ml:
            continue
        pr_changed = pl != bl
        main_changed = ml != bl
        if pr_changed and not main_changed:
            out[i] = pl
        elif pr_changed and main_changed and progress(pl) > progress(ml):
            out[i] = pl
    # items only the PR has: insert after the item before it in the PR file
    prev = None
    inserts = []
    for l in pr:
        mm = ITEM.match(l)
        if not mm:
            continue
        k = mm.group(2).upper()
        if k not in pos and k not in b:       # new in the PR (an item that was in base and is gone from main was removed on purpose)
            inserts.append((prev, l))
        prev = k
    for after, l in inserts:
        idx = pos.get(after.upper() if after else "", None)
        if idx is None:
            last = max(pos.values()) if pos else len(out) - 1
            idx = last
        out.insert(idx + 1, l)
        pos = {}
        for i, x in enumerate(out):
            mm = ITEM.match(x)
            if mm:
                pos[mm.group(2).upper()] = i
    return out


def main():
    if len(sys.argv) != 5:
        print(__doc__)
        return 2
    base, pr, mn = (read(a) for a in sys.argv[1:4])
    dest = sys.argv[4]
    if not mn:
        return 1
    res = merge(base, pr, mn)
    open(dest, "w", encoding="utf-8").write("\n".join(res))
    return 0


if __name__ == "__main__":
    sys.exit(main())
