"""Generates playbook.json: 500 procedural plays (formations x concepts x mirrors x motions). Original names only."""
import json, itertools
F = {  # skill positions (x, z rel. to ball); +x = right
 'Gun Doubles':  {'WR1': (-15, -.8), 'WR2': (15, -.8), 'SL': (-9, -1.3), 'TE': (4.1, -1.0), 'RB': (1.1, -5.2), 'FB': (-1.2, -3.4)},
 'Gun Trips':    {'WR1': (-15, -.8), 'WR2': (15, -.8), 'SL': (10, -1.3), 'TE': (5.5, -1.2), 'RB': (-1.1, -5.2), 'FB': (1.2, -3.4)},
 'Gun Bunch':    {'WR1': (-15, -.8), 'WR2': (8, -.8), 'SL': (9.2, -2.0), 'TE': (7, -2.0), 'RB': (1.1, -5.2), 'FB': (-1.2, -3.4)},
 'Gun Empty':    {'WR1': (-15, -.8), 'WR2': (15, -.8), 'SL': (-9, -1.3), 'TE': (9, -1.3), 'RB': (5.5, -1.2), 'FB': (-4.8, -1.2)},
 'Pistol Ace':   {'WR1': (-14, -.8), 'WR2': (14, -.8), 'SL': (-4.1, -1.0), 'TE': (4.1, -1.0), 'RB': (0, -6.6), 'FB': (-1.0, -3.6)},
 'Singleback':   {'WR1': (-15, -.8), 'WR2': (13, -.8), 'SL': (8, -1.3), 'TE': (4.1, -1.0), 'RB': (0, -6.2), 'FB': (-4.1, -1.0)},
 'I-Form Pro':   {'WR1': (-15, -.8), 'WR2': (14, -.8), 'SL': (-4.1, -1.0), 'TE': (4.1, -1.0), 'RB': (0, -7.2), 'FB': (0, -5.6)},
 'Spread 3x1':   {'WR1': (-15, -.8), 'WR2': (15, -.8), 'SL': (11, -1.3), 'TE': (7, -1.3), 'RB': (-1.1, -5.2), 'FB': (1.2, -3.4)},
 'Wing Tight':   {'WR1': (-14, -.8), 'WR2': (12, -.8), 'SL': (5.4, -1.8), 'TE': (4.1, -1.0), 'RB': (0, -6.2), 'FB': (-1.0, -3.6)},
 'Ace Slot':     {'WR1': (-15, -.8), 'WR2': (15, -.8), 'SL': (-8, -1.3), 'TE': (8, -1.3), 'RB': (0, -6.2), 'FB': (-4.1, -1.0)}}
R = {  # route trees: (dx, dz) with dx>0 = toward the outside of the receiver's side
 'go': [(0, 25)], 'slant': [(0, 3), (-5, 9)], 'out': [(0, 7), (6, 7)], 'dig': [(0, 10), (-9, 10)], 'post': [(0, 11), (-6, 22)], 'corner': [(0, 10), (6, 20)],
 'curl': [(0, 10), (-.5, 8)], 'comeback': [(0, 13), (2.5, 10.5)], 'flat': [(0, 1), (6, 2.5)], 'drag': [(0, 3), (-14, 5)], 'wheel': [(4, 0), (7, 4), (7, 16)],
 'seam': [(0, 18)], 'hitch': [(0, 5), (0, 4)], 'fade': [(2, 22)], 'swing': [(5, 0), (8, 3)], 'block': [(0, 1.4)], 'whip': [(0, 4), (-2, 5), (3, 5)], 'sail': [(0, 12), (6, 15)], 'cross': [(0, 6), (-16, 12)]}
C = {  # concept: route per role (+ target), category
 'Four Verts':  ('Deep',   'SL', {'WR1': 'go', 'WR2': 'go', 'SL': 'seam', 'TE': 'seam', 'RB': 'swing', 'FB': 'block'}),
 'Smash':       ('Quick',  'TE', {'WR1': 'hitch', 'WR2': 'hitch', 'SL': 'corner', 'TE': 'corner', 'RB': 'flat', 'FB': 'block'}),
 'Flood':       ('Dropback', 'SL', {'WR1': 'post', 'WR2': 'go', 'SL': 'sail', 'TE': 'flat', 'RB': 'block', 'FB': 'flat'}),
 'Mesh':        ('Quick',  'SL', {'WR1': 'drag', 'WR2': 'drag', 'SL': 'whip', 'TE': 'seam', 'RB': 'swing', 'FB': 'block'}),
 'Y-Cross':     ('Dropback', 'TE', {'WR1': 'go', 'WR2': 'post', 'SL': 'flat', 'TE': 'cross', 'RB': 'swing', 'FB': 'block'}),
 'Stick':       ('Quick',  'TE', {'WR1': 'go', 'WR2': 'slant', 'SL': 'flat', 'TE': 'hitch', 'RB': 'block', 'FB': 'flat'}),
 'Levels':      ('Dropback', 'WR2', {'WR1': 'go', 'WR2': 'dig', 'SL': 'drag', 'TE': 'seam', 'RB': 'swing', 'FB': 'block'}),
 'Dagger':      ('Deep',   'WR1', {'WR1': 'dig', 'WR2': 'go', 'SL': 'seam', 'TE': 'flat', 'RB': 'block', 'FB': 'block'}),
 'Slant-Flat':  ('Quick',  'WR1', {'WR1': 'slant', 'WR2': 'slant', 'SL': 'flat', 'TE': 'seam', 'RB': 'flat', 'FB': 'block'}),
 'Post-Wheel':  ('Deep',   'RB', {'WR1': 'post', 'WR2': 'curl', 'SL': 'drag', 'TE': 'block', 'RB': 'wheel', 'FB': 'block'}),
 'Curl-Flat':   ('Quick',  'WR2', {'WR1': 'curl', 'WR2': 'curl', 'SL': 'flat', 'TE': 'seam', 'RB': 'swing', 'FB': 'block'}),
 'Comeback':    ('Dropback', 'WR1', {'WR1': 'comeback', 'WR2': 'fade', 'SL': 'out', 'TE': 'dig', 'RB': 'block', 'FB': 'flat'}),
 'PA Boot':     ('Play Action', 'TE', {'WR1': 'go', 'WR2': 'post', 'SL': 'drag', 'TE': 'flat', 'RB': 'block', 'FB': 'flat'})}
M = {'': None, 'Jet': ('SL', 1), 'Orbit': ('FB', -1)}
out = []; names = set()
import random
combos = list(itertools.product(F.items(), C.items(), [False, True], M.items())); keep = set(random.Random(18).sample(range(len(combos)), 500))
for ci, ((fn, fm), (cn, (cat, tgt, rt)), mir, (mn, mv)) in enumerate(combos):
  if ci not in keep: continue
  s = -1 if mir else 1
  f = {k: [round(x * s, 2), z] for k, (x, z) in fm.items()}
  r = {}
  for k, rn in rt.items():
    side = 1 if f[k][0] >= 0 else -1
    r[k] = [[round(dx * side, 2), dz] for dx, dz in R[rn]]
  mot = None
  if mv:
    who, d = mv; fx, fz = f[who]; mot = {'p': who, 'to': [round(-fx * .35 if d > 0 else fx + 3 * s, 2), round(fz - .4, 2)]}
  name = f"{fn} {'Lt' if mir else 'Rt'} {cn}" + (f" {mn}" if mn else '')
  if name in names: continue
  names.add(name)
  out.append({'id': len(out), 'name': name, 'cat': ('Motion' if mn else cat), 'concept': cn, 'form': fn, 'tgt': tgt, 'drop': 4.2 if cat == 'Deep' else 2.2 if cat == 'Quick' else 3.2, 'pa': cn == 'PA Boot', 'f': f, 'r': r, 'm': mot})
  if len(out) >= 500: break
json.dump({'v': 1, 'plays': out}, open('playbook.json', 'w'), separators=(',', ':'))
print(len(out), sorted(set(p['cat'] for p in out)))
