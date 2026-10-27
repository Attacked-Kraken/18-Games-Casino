#!/usr/bin/env node
// Map refresh (VP, owner Oct 27 2026 "fix it so it won't happen again on any PR"): the WHERE THINGS ARE map in looks/<game>.md
// carries line numbers that go stale on every edit, and a stale number used to turn a PR red (#1902, map-apexracer-current).
// This rewrites every "(name) L123" / "name L123" in the map to the line where that name is defined in the game page today.
// Usage: node tools/map-refresh.mjs apexracer [--check]   (--check = only print what is off; exit 1 if anything is)
import fs from 'node:fs';
import path from 'node:path';
const slug = (process.argv[2] || '').replace(/\.html$/, '');
const onlyCheck = process.argv.includes('--check');
if (!slug) { console.error('usage: node tools/map-refresh.mjs <game> [--check]'); process.exit(2); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const mapFile = path.join(root, 'looks', slug + '.md'), gameFile = path.join(root, slug + '.html');
const map = fs.readFileSync(mapFile, 'utf8'), game = fs.readFileSync(gameFile, 'utf8').split('\n');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function defLine(lines, name) {
  const n = esc(name);
  const res = [new RegExp('(async\\s+)?function\\s+' + n + '\\s*\\('), new RegExp('^\\s*(const|let|var)\\s+' + n + '\\b'),
    new RegExp('^\\s*' + n + '\\s*=[^=]'), new RegExp('\\b' + n + '\\s*=\\s*(async\\s*)?(function|\\()'), new RegExp('\\b' + n + '\\s*:\\s*(async\\s*)?function')];
  for (const re of res) { const i = lines.findIndex((l) => re.test(l)); if (i >= 0) return i + 1; }
  return 0;
}
const head = map.split(/\n## (?!WHERE)/)[0];          // only the map section at the top
let changed = 0, off = [];
const fixed = head.replace(/(^|[\s(])((?:window\.)?[A-Za-z_$][\w$.]*)(\)?)(\s+(?:at\s+)?)L(\d+)/gm, (all, pre, name, c, sp, num, at, src) => {
  if (/inside\s+$/.test(src.slice(Math.max(0, at - 8), at + pre.length))) return all;   // "(TINTS, inside makeGlbCar) L1196" points INTO a function, not at it
  if (!/[A-Z_$.]/.test(name)) return all;                                                 // plain English ("frame loop L2631") is not a code name
  const line = defLine(game, name);
  if (!line || line === +num) return all;
  off.push(name + ' L' + num + ' -> L' + line); changed++;
  return pre + name + c + sp + 'L' + line;
});
if (onlyCheck) { console.log(off.length ? 'MAP OFF: ' + off.join(', ') : 'MAP OK'); process.exit(off.length ? 1 : 0); }
if (changed) fs.writeFileSync(mapFile, fixed + map.slice(head.length));
console.log(changed ? 'MAP REFRESHED ' + slug + ': ' + off.join(', ') : 'MAP OK ' + slug + ' (nothing to change)');
