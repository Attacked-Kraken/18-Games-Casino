// Sketchfab fetch robot (owner Oct 19 2026: "nobody can get into Sketchfab without the Safari site - need a way better system").
// Reads the OPEN lines in MODEL-REQUESTS.md that have an exact Sketchfab model link, and for each one:
//   1. checks the license on Sketchfab (CC Attribution or CC0 only - anything else is SKIPPED, never downloaded)
//   2. downloads it with the owner's Sketchfab API token (GitHub secret SKETCHFAB_TOKEN - never in the repo or a chat)
//   3. saves models/fetched/<name>-raw.glb (the workflow shrinks it to <name>.glb)
//   4. adds the ASSETS.md ledger entry (title, maker, source, license) and marks the request line DONE
// Run by .github/workflows/sketchfab-fetch.yml. DRY=1 only checks and reports.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TOKEN = process.env.SKETCHFAB_TOKEN || '', DRY = !!process.env.DRY, API = 'https://api.sketchfab.com/v3';
const today = new Date().toISOString().slice(0, 10);
const report = [];
const say = (s) => { console.log(s); report.push(s); };
const reqFile = 'MODEL-REQUESTS.md';
let text = fs.readFileSync(reqFile, 'utf8');
const lines = text.split('\n');
const todo = lines.map((l, i) => ({ l, i, m: l.match(/sketchfab\.com\/3d-models\/([a-z0-9-]*?)-?([0-9a-f]{32})/i) }))
  .filter(x => /^\s*-\s*OPEN\b/.test(x.l) && x.m);
if (!todo.length) { say('No OPEN Sketchfab requests with an exact model link.'); fs.writeFileSync('fetch-report.txt', report.join('\n')); process.exit(0); }
if (!TOKEN) { say('No SKETCHFAB_TOKEN secret yet - the owner adds it once in GitHub Settings > Secrets and variables > Actions.'); fs.writeFileSync('fetch-report.txt', report.join('\n')); process.exit(0); }
const H = { Authorization: 'Token ' + TOKEN };
const ledger = fs.readFileSync('ASSETS.md', 'utf8');
let addLedger = '';
fs.mkdirSync('models/fetched', { recursive: true });
for (const t of todo) {
  const uid = t.m[2], slug = (t.m[1] || 'model').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'model';
  try {
    const info = await (await fetch(`${API}/models/${uid}`)).json();
    const lic = info.license || {}, lslug = (lic.slug || lic.label || '').toLowerCase();
    const licName = /cc0|public/.test(lslug) ? 'CC0' : (lslug === 'by' || /attribution$/.test((lic.label || '').toLowerCase())) ? 'CC-BY 4.0' : null;
    const maker = (info.user && (info.user.displayName || info.user.username)) || 'unknown';
    if (!licName) { say(`SKIPPED ${uid} "${info.name}": license "${lic.label || lslug || 'none'}" is not CC Attribution or CC0`);
      lines[t.i] = lines[t.i].replace(/^(\s*-\s*)OPEN/, `$1SKIPPED (license ${lic.label || 'not allowed'}, robot ${today})`); continue; }
    if (info.isDownloadable === false) { say(`SKIPPED ${uid} "${info.name}": the maker turned downloads off`);
      lines[t.i] = lines[t.i].replace(/^(\s*-\s*)OPEN/, `$1SKIPPED (not downloadable, robot ${today})`); continue; }
    const dl = await fetch(`${API}/models/${uid}/download`, { headers: H });
    if (!dl.ok) { say(`FAILED ${uid} "${info.name}": Sketchfab answered ${dl.status} to the download (token wrong or not allowed?)`); continue; }
    const d = await dl.json(), pick = d.glb || d.gltf;
    if (!pick || !pick.url) { say(`FAILED ${uid}: no glb/gltf download offered`); continue; }
    const mb = (pick.size || 0) / 1e6;
    say(`${DRY ? 'WOULD FETCH' : 'FETCHING'} "${info.name}" by ${maker} (${licName}) - ${d.glb ? 'glb' : 'gltf zip'} ${mb.toFixed(1)} MB`);
    if (DRY) continue;
    if (mb > 90) { say(`SKIPPED ${uid}: ${mb.toFixed(0)} MB is too big even to shrink - ask for a smaller one`);
      lines[t.i] = lines[t.i].replace(/^(\s*-\s*)OPEN/, `$1SKIPPED (${mb.toFixed(0)} MB too big, robot ${today})`); continue; }
    const buf = Buffer.from(await (await fetch(pick.url)).arrayBuffer());
    const raw = `models/fetched/${slug}-raw.glb`;
    if (d.glb) fs.writeFileSync(raw, buf);
    else { const tmp = fs.mkdtempSync('/tmp/sf-'); fs.writeFileSync(tmp + '/m.zip', buf); execSync(`unzip -q -o m.zip`, { cwd: tmp });
      const g = execSync(`find ${tmp} -name '*.gltf' | head -1`, { encoding: 'utf8' }).trim();
      execSync(`gltf-transform copy "${g}" "${raw}"`, { stdio: 'inherit' }); }
    const out = raw.replace('-raw.glb', '.glb');
    if (!ledger.includes(`## ASSET: ${out}`)) addLedger += `\n## ASSET: ${out}\n- title: ${info.name}\n- maker: ${maker}\n- source: ${info.viewerUrl || 'https://sketchfab.com/3d-models/' + uid}\n- license: ${licName}\n- downloaded: ${today} by the Sketchfab fetch robot\n- used in: (not in a game yet - the game that uses it must name "${maker}" on its credits screen)\n- changes: shrunk for phones (textures max 1024 px, WebP)\n`;
    lines[t.i] = lines[t.i].replace(/^(\s*-\s*)OPEN/, `$1DONE (robot ${today}: ${out})`);
  } catch (e) { say(`FAILED ${uid}: ${e.message}`); }
}
if (!DRY) { fs.writeFileSync(reqFile, lines.join('\n')); if (addLedger) fs.appendFileSync('ASSETS.md', addLedger); }
fs.writeFileSync('fetch-report.txt', report.join('\n'));
