// MODEL RETRY robot (owner Oct 26 2026: "if it ever comes out horrible or not what it's supposed to be it needs to
// automatically bring the correct one"). Run right after tools/model-accept.mjs --write. For every model that FAILED acceptance:
//   1. its request line in MODEL-REQUESTS.md becomes "REJECTED (acceptance robot <date>: <why>)" - the owner never sees it
//   2. the bad file, its 4 pictures and its ledger entry are removed (a failed model is never saved on main)
//   3. a replacement is asked for by itself, up to MAX tries per request:
//        try 1 after an EMPTY download = the SAME model once more as a glTF zip (`FORMAT gltf` on the new OPEN line);
//        otherwise the next-best free Sketchfab model for the same job (CC-BY / CC0, downloadable, under 20 MB, 5k-250k
//        triangles, never one already in models/tried.json) as a new OPEN line - the fetch robot picks it up on merge;
//   4. after MAX failed tries it stops and files ONE line in jobs/HELP.md ("HELP-VP: robot · model fetch ...").
// A model that is LOCKED in MODELS.md or already used by a game is only REPORTED, never replaced.
//   node tools/model-retry.mjs [--dry] models/fetched/a.glb ...      (reads <name>.accept.json written by model-accept)
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2), DRY = args.includes('--dry'), files = args.filter(a => /\.glb$/i.test(a));
const MAX = 3, API = 'https://api.sketchfab.com/v3', today = new Date().toISOString().slice(0, 10);
const report = []; const say = (s) => { console.log(s); console.log('::notice title=Model retry::' + s.replace(/[\r\n]+/g, ' ')); report.push(s); };
const reqFile = 'MODEL-REQUESTS.md', triedFile = 'models/tried.json';
let lines = fs.readFileSync(reqFile, 'utf8').split('\n');
let tried = {}; try { tried = JSON.parse(fs.readFileSync(triedFile, 'utf8')); } catch {}
let ledger = fs.existsSync('ASSETS.md') ? fs.readFileSync('ASSETS.md', 'utf8') : '';

const jobKey = (l) => l.replace(/^\s*-\s*[A-Z]+[^·]*·\s*/, '').split('·').slice(0, 2).join('·').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80);
export function inUse(file) {
  try { if (new RegExp('^## MODEL:[^\\n]*\\n(?:(?!^## MODEL)[\\s\\S])*?' + path.basename(file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:(?!^## MODEL)[\\s\\S])*?status:\\s*\\**\\s*LOCKED', 'm').test(fs.readFileSync('MODELS.md', 'utf8'))) return 'LOCKED in MODELS.md'; } catch {}
  try { const hit = execSync(`grep -l -F "${file}" *.html 2>/dev/null || true`, { encoding: 'utf8' }).trim(); if (hit) return 'used by ' + hit.split('\n')[0]; } catch {}
  return '';
}
const licOf = (lic) => { const s = ((lic && (lic.slug || lic.label)) || '').toLowerCase(); return /cc0|public domain/.test(s) ? 'CC0' : (s === 'by' || (/attribution$/.test(s) && !/non|share|deriv/.test(s))) ? 'CC-BY 4.0' : null; };

async function candidates(words, skip) {
  const out = [];
  const url = `${API}/search?type=models&q=${encodeURIComponent(words)}&downloadable=true&sort_by=-likeCount&count=24`;
  const j = await (await fetch(url)).json();
  for (const m of j.results || []) {
    if (skip.has(m.uid) || m.isDownloadable === false) continue;
    const lic = licOf(m.license); if (!lic) continue;
    const a = (m.archives || {}).glb || (m.archives || {}).gltf || {}, mb = a.size ? a.size / 1e6 : null, faces = a.faceCount || m.faceCount || 0;
    if (mb != null && mb > 20) continue;
    if (faces && (faces < 5000 || faces > 250000)) continue;
    out.push({ uid: m.uid, name: m.name, maker: (m.user && (m.user.displayName || m.user.username)) || 'unknown', lic, mb: mb != null ? Math.round(mb * 10) / 10 : null, faces, link: m.viewerUrl || `https://sketchfab.com/3d-models/${m.uid}` });
  }
  return out;
}

for (const f of files) {
  const accFile = f.replace(/\.glb$/i, '.accept.json');
  let acc; try { acc = JSON.parse(fs.readFileSync(accFile, 'utf8')); } catch { continue; }
  if (acc.ok) continue;
  const why = (acc.why || []).map(w => w.split(':')[0]).join('+') + ' - ' + String((acc.why || [])[0] || '').slice(0, 110);
  const used = inUse(f);
  if (used) { say(`NOT REPLACED ${f}: failed acceptance (${why}) but it is ${used} - the VP decides`); continue; }
  const i = lines.findIndex(l => /^\s*-\s*DONE\b/.test(l) && l.includes(f));
  if (i < 0) { say(`NOT REPLACED ${f}: no DONE request line names it (not fetched by request) - reported only`); continue; }
  const old = lines[i], uid = (old.match(/[0-9a-f]{32}/i) || [''])[0], key = jobKey(old);
  const rec = tried[key] || (tried[key] = { uids: [], tries: 0, formats: [] });
  if (uid && !rec.uids.includes(uid)) rec.uids.push(uid);
  rec.tries++;
  const sizeAsk = (/\b(length|height|width)\s*:?\s*[\d.]+\s*m\b/i.exec(old) || [''])[0];
  const name = (old.split('·').map(x => x.trim()).find(x => / by /i.test(x)) || '').split(/ by /i)[0] || '';
  const forWhat = old.replace(/^\s*-\s*DONE[^)]*\)\s*·?\s*/, '').split('·').slice(0, 2).join('·').trim();
  lines[i] = old.replace(/^(\s*-\s*)DONE\s*\([^)]*\)/, `$1REJECTED (acceptance robot ${today}: ${why.replace(/[()]/g, '')})`);
  // remove the bad model, its pictures, its ledger entry
  if (!DRY) {
    for (const g of [f, accFile, ...['front', 'side', 'back', 'top'].map(s => f.replace(/\.glb$/i, '-' + s + '.jpg'))]) try { fs.unlinkSync(g); } catch {}
    ledger = ledger.replace(new RegExp('\\n## ASSET: ' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n(?:(?!\\n## ASSET:|\\n---)[\\s\\S])*', 'g'), '\n');
  }
  if (rec.tries >= MAX) {
    say(`GAVE UP "${forWhat}": ${rec.tries} candidates failed acceptance - one HELP line filed`);
    if (!DRY) { try { fs.appendFileSync('jobs/HELP.md', `\nHELP-VP: robot · model fetch for "${forWhat.slice(0, 90)}" · ${rec.tries} candidates in a row failed the acceptance robot (last: ${name} - ${why.slice(0, 120)}); tried ids are in models/tried.json - please pick the model by hand or loosen the request\n`); } catch {} }
    continue;
  }
  // try 1 after an EMPTY download: the same model as a glTF zip
  if (/^EMPTY/.test((acc.why || [])[0] || '') && uid && !rec.formats.includes(uid)) {
    rec.formats.push(uid);
    lines.splice(i + 1, 0, `- OPEN · ${forWhat} · ${name} by ${(old.match(/ by ([^·]+?)\s*·/) || [, 'maker'])[1]} · https://sketchfab.com/3d-models/${uid} · FORMAT gltf (the glb came back empty) · ${sizeAsk} · (replacement ${rec.tries + 1} of ${MAX})`.replace(/\s+·\s+·/g, ' ·'));
    say(`RETRY same model as glTF: "${name}" (${why.slice(0, 60)})`);
    continue;
  }
  try {
    const words = (name || forWhat).replace(/\b(by|v\d+|the|a)\b/gi, ' ').replace(/[^a-z0-9 ]+/gi, ' ').split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
    const skip = new Set(rec.uids), found = await candidates(words, skip);
    if (!found.length) { say(`NO CANDIDATE for "${words}" - will try again at the next run`); rec.tries--; lines[i] = old; continue; }
    const c = found[0]; rec.uids.push(c.uid);
    lines.splice(i + 1, 0, `- OPEN · ${forWhat} · ${c.name} by ${c.maker} · ${c.link} · ${c.lic} · ${c.mb != null ? c.mb + ' MB' : 'size ?'}${sizeAsk ? ' · ' + sizeAsk : ''} · (replacement ${rec.tries + 1} of ${MAX} - the last one failed: ${(acc.why || [])[0] ? acc.why[0].split(':')[0] : 'acceptance'})`);
    say(`REPLACEMENT asked: "${c.name}" by ${c.maker} (${c.faces || '?'} faces) for "${forWhat}" - the last one failed ${why.slice(0, 60)}`);
  } catch (e) { say(`RETRY FAILED for ${f}: ${e.message}`); rec.tries--; lines[i] = old; }
}
if (!DRY) { fs.writeFileSync(reqFile, lines.join('\n')); fs.mkdirSync('models', { recursive: true }); fs.writeFileSync(triedFile, JSON.stringify(tried, null, 1) + '\n'); if (ledger) fs.writeFileSync('ASSETS.md', ledger); }
fs.writeFileSync('retry-report.txt', report.join('\n') + '\n');
