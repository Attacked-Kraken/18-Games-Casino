// Complaints check (JOB-02). Run: node tools/complaints/check.mjs [--base <git-ref>]
// Reads COMPLAINTS.md and FAILS (exit 1) if a complaint is closed without a real proof file, has a bad status,
// or (with --base) an old complaint was deleted. No packages needed.
import fs from 'fs'; import { execFileSync } from 'child_process';
const A = process.argv.slice(2), bi = A.indexOf('--base'), BASE = bi >= 0 ? A[bi + 1] : null;
const STATUS = ['open', 'fixing', 'needs-proof', 'closed'], PROOF = /\.(png|jpe?g|webp|gif|mp4|webm|mov)$/i;
function parse(txt) {
  const out = []; let cur = null;
  for (const line of txt.split('\n')) {
    const h = line.match(/^## (C-\d{3,})\s+(.*)$/); if (h) { cur = { id: h[1], title: h[2].trim(), f: {} }; out.push(cur); continue; }
    const m = cur && line.match(/^- ([a-z ]+):\s*(.*)$/); if (m) cur.f[m[1].trim()] = m[2].trim();
  } return out; }
const list = parse(fs.readFileSync('COMPLAINTS.md', 'utf8')), bad = [], seen = new Set();
const isRealFile = (p) => { try { const st = fs.statSync(p); if (!st.isFile() || st.size < 200) return 'is empty or tiny';
  const b = fs.readFileSync(p).subarray(0, 12), hex = b.toString('hex'), asc = b.toString('latin1');
  const ok = hex.startsWith('89504e47') || hex.startsWith('ffd8ff') || asc.startsWith('GIF8') || (asc.startsWith('RIFF') && asc.slice(8, 12) === 'WEBP') || asc.slice(4, 8) === 'ftyp' || hex.startsWith('1a45dfa3');
  return ok ? null : 'is not a real picture or clip'; } catch (e) { return 'does not exist in the repo'; } };
for (const c of list) {
  if (seen.has(c.id)) bad.push(`${c.id}: the same number is used twice`); seen.add(c.id);
  const st = (c.f.status || '').toLowerCase();
  if (!STATUS.includes(st)) bad.push(`${c.id}: status "${c.f.status || ''}" - use one of ${STATUS.join(', ')}`);
  for (const k of ['game', 'what', 'done when']) if (!c.f[k]) bad.push(`${c.id}: missing "${k}:" line`);
  if (st === 'closed') {
    const files = (c.f.proof || '').split(/[\s,]+/).filter(Boolean);
    if (!files.length) bad.push(`${c.id} "${c.title}" is CLOSED with no proof - add a screenshot or clip to proof/complaints/ and list it on the "proof:" line`);
    for (const p of files) { if (!PROOF.test(p)) { bad.push(`${c.id}: proof "${p}" must be a .png/.jpg/.webp/.gif/.mp4/.webm/.mov`); continue; } const why = isRealFile(p); if (why) bad.push(`${c.id}: proof file ${p} ${why}`); }
  }
}
if (BASE) { try { const old = parse(execFileSync('git', ['show', `${BASE}:COMPLAINTS.md`], { encoding: 'utf8' }));
  for (const o of old) if (!seen.has(o.id)) bad.push(`${o.id} "${o.title}" was DELETED - never delete a complaint, close it with proof`); } catch (e) { /* no COMPLAINTS.md on base yet */ } }
const count = (s) => list.filter(c => (c.f.status || '').toLowerCase() === s).length;
console.log(`COMPLAINTS: ${list.length} total - open ${count('open')}, fixing ${count('fixing')}, needs-proof ${count('needs-proof')}, closed ${count('closed')}`);
for (const c of list) console.log(`  ${c.id} [${c.f.status}] ${c.title}`);
if (bad.length) { console.log('\nFAIL:\n- ' + bad.join('\n- ')); process.exit(1); } console.log('\nPASS - every closed complaint has real proof.');
