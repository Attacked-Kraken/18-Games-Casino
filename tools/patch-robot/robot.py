#!/usr/bin/env python3
"""Patch robot - lets Muses change files that are too big for their GitHub tool.

It runs on GitHub (see .github/workflows/patch-robot.yml) whenever something lands in one of these folders,
on ANY branch, and does the work on that same branch:

1. patches/<name>.patch          a unified diff (git diff format) with only the lines you changed.
   -> applied to the big file, then the .patch is deleted.
   -> if it doesn't fit: patches/<name>.result.txt explains why; fix your patch and push it again.

2. bigfiles/<path>/part-001, part-002, ...  plus  bigfiles/<path>/DONE  (DONE holds the number of parts)
   -> the parts are joined into <path> (a whole new or replaced big file), then the folder is deleted.

3. pieces/request-<anything>.txt  containing a file path, e.g.  apexracer.html
   -> the file is cut into pieces/<path>/part-001.txt, part-002.txt ... (90 KB each) so you can read it
      in pieces if your tool can't open it whole. Delete the pieces folder when you're done.
"""
import glob
import os
import shutil
import subprocess
import sys

PIECE = 90 * 1024
done = []


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()


def safe_path(rel):
    rel = rel.strip().lstrip("/").replace("\\", "/")
    full = os.path.normpath(rel)
    if full.startswith("..") or full.startswith(".git") or full.startswith(".github") or os.path.isabs(full):
        return None
    return full


# 1. patches
for patch in sorted(glob.glob("patches/*.patch")):
    result = patch[:-len(".patch")] + ".result.txt"
    # strict on purpose: a patch only goes in if it fits the file exactly (no guessing where it goes)
    code, out = run(["git", "apply", "--recount", "--whitespace=nowarn", patch])
    how = "git apply"
    if code == 0:
        os.remove(patch)
        if os.path.exists(result):
            os.remove(result)
        done.append("applied %s (%s)" % (patch, how))
    else:
        with open(result, "w") as f:
            f.write("PATCH DID NOT APPLY: %s\n\n%s\n\nWhat to do: pull the latest version of the big file on your "
                    "branch, make your diff against THAT version (git diff format, with a few unchanged lines "
                    "of context around each change), and push the .patch again.\n" % (patch, out[-4000:]))
        done.append("FAILED %s - see %s" % (patch, result))

# 2. big files sent in parts
for marker in sorted(glob.glob("bigfiles/**/DONE", recursive=True)):
    folder = os.path.dirname(marker)
    target = safe_path(os.path.relpath(folder, "bigfiles"))
    parts = sorted(glob.glob(os.path.join(folder, "part-*")))
    try:
        want = int(open(marker).read().strip() or "0")
    except ValueError:
        want = 0
    note = os.path.join(folder, "RESULT.txt")
    if not target:
        open(note, "w").write("Not allowed: that path is outside the repo or in .git/.github.\n")
        done.append("FAILED bigfile %s (bad path)" % folder)
        continue
    if want and want != len(parts):
        open(note, "w").write("DONE says %d parts but I found %d. Push all parts, then DONE again.\n" % (want, len(parts)))
        done.append("FAILED bigfile %s (%d of %d parts)" % (target, len(parts), want))
        continue
    os.makedirs(os.path.dirname(target) or ".", exist_ok=True)
    with open(target, "wb") as out:
        for part in parts:
            with open(part, "rb") as f:
                out.write(f.read())
    shutil.rmtree(folder)
    done.append("joined %d parts into %s (%d bytes)" % (len(parts), target, os.path.getsize(target)))

# 3. read a big file in pieces
for req in sorted(glob.glob("pieces/request-*.txt")):
    target = safe_path(open(req).read())
    os.remove(req)
    if not target or not os.path.isfile(target):
        done.append("FAILED pieces request %s (no such file: %s)" % (req, target))
        continue
    data = open(target, "rb").read()
    folder = os.path.join("pieces", target)
    shutil.rmtree(folder, ignore_errors=True)
    os.makedirs(folder, exist_ok=True)
    n = 0
    for i in range(0, len(data), PIECE):
        n += 1
        with open(os.path.join(folder, "part-%03d.txt" % n), "wb") as f:
            f.write(data[i:i + PIECE])
    done.append("cut %s into %d pieces in %s" % (target, n, folder))

print("\n".join(done) if done else "nothing to do")
with open(os.environ.get("ROBOT_SUMMARY", "robot-summary.txt"), "w") as f:
    f.write("; ".join(done) if done else "")
sys.exit(0)
