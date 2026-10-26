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

const TOKEN = process.env.SKETCHFAB_TOKEN || '', DRY = !!process.env.DRY || !!(process.env.TEST_UID || '').trim(), API = 'https://api.sketchfab.com/v3';
const today = new Date().toISOString().slice(0, 10);
const report = [];
const say = (s) => { console.log(s); console.log((/^(FAILED|SKIPPED)/.test(s) ? '::error' : '::notice') + ' title=Sketchfab robot::' + s.replace(/[\r\n]+/g, ' ')); report.push(s); };   // notices show on the run page
const reqFile = 'MODEL-REQUESTS.md';
let text = fs.readFileSync(reqFile, 'utf8');
const lines = text.split('\n');
// owner Oct 19: "Get it" on tools/model-search.html makes models/picks/<id>.txt (a Sketchfab link + what it's for) -
// each pick becomes an OPEN request line here, then it is fetched like any other
if (fs.existsSync('models/picks')) for (const f of fs.readdirSync('models/picks').filter(f => f.endsWith('.txt'))) {
  const t = fs.readFileSync('models/picks/' + f, 'utf8').trim(), link = (t.match(/https:\/\/sketchfab\.com\/[^\s·]+/) || [])[0];
  if (link) { lines.push(`- OPEN · ${t.replace(link, '').replace(/[·\s]+$/, '').replace(/^[·\s]+/, '') || 'picked by the owner'} · picked by the owner on Model search · ${link}`); }
  if (!process.env.DRY) fs.unlinkSync('models/picks/' + f);
}
const TEST = (process.env.TEST_UID || '').trim();   // a token test: check one model, download its info, save nothing
const todo = TEST ? [{ l: '- OPEN test', i: -1, m: ['', 'test', TEST.match(/[0-9a-f]{32}/i)?.[0] || TEST] }] : lines.map((l, i) => ({ l, i, m: l.match(/sketchfab\.com\/3d-models\/([a-z0-9-]*?)-?([0-9a-f]{32})/i) }))
  .filter(x => /^\s*-\s*OPEN\b/.test(x.l) && x.m);
if (!todo.length) { say('No OPEN Sketchfab requests with an exact model link.'); fs.writeFileSync('fetch-report.txt', report.join('\n')); process.exit(0); }
// Oct 25 2026 (owner "getting ridiculous every night"): PRs #1800 + #1808 fetched the SAME model as an already-open fetch PR, because
// every push to main re-ran the robot while the first fetch PR still waited, and the OPEN line was still OPEN on main. Now: while a
// robot/sketchfab-* pull request is open, a run fetches nothing (the merge starts the next run for what is left).
if (!TEST && !process.env.DRY && process.env.GH_TOKEN && process.env.GITHUB_REPOSITORY) {
  try {
    const r = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls?state=open&per_page=100`, { headers: { Authorization: 'Bearer ' + process.env.GH_TOKEN, 'User-Agent': 'fetch-robot' } });
    const open = r.ok ? (await r.json()).filter(p => (p.head?.ref || '').startsWith('robot/sketchfab-')) : [];
    if (open.length) { say(`Another fetch pull request is still open (#${open.map(p => p.number).join(', #')}) - not fetching again until it merges.`); fs.writeFileSync('fetch-report.txt', report.join('\n')); process.exit(0); }
  } catch (e) { say('Could not list open fetch PRs (' + e.message + ') - going on.'); }
}
if (!TOKEN) { say('No SKETCHFAB_TOKEN secret yet - the owner adds it once in GitHub Settings > Secrets and variables > Actions.'); fs.writeFileSync('fetch-report.txt', report.join('\n')); process.exit(0); }
const H = { Authorization: 'Token ' + TOKEN };
const ledger = fs.readFileSync('ASSETS.md', 'utf8');
let addLedger = '';
fs.mkdirSync('models/fetched', { recursive: true });
for (const t of todo) {
  // owner Oct 19: 4 cars all landed as none.glb (links like /3d-models/none-<id>) - a name now comes from the model's own
  // title when the link has none, and always ends with the first 6 letters of its id, so two models never share a file
  const uid = t.m[2], linkSlug = (t.m[1] || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const titleSlug = ((t.l.split('·').map(x => x.trim()).find(x => / by /i.test(x)) || '').split(/ by /i)[0] || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = ((/^(none|model|undefined|null)?$/.test(linkSlug) ? titleSlug : linkSlug) || 'model').slice(0, 34) + '-' + uid.slice(0, 6);
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
    const sizeAsk = /\b(length|height|width)\s*:?\s*([\d.]+)\s*m\b/i.exec(t.l);     // owner Oct 21: "length 4.6 m" on the line = scale to it
    if (sizeAsk) fs.writeFileSync(raw.replace('-raw.glb', '.size'), sizeAsk[1].toLowerCase() + ' ' + sizeAsk[2]);
    else if (!d.glb) { const tmp = fs.mkdtempSync('/tmp/sf-'); fs.writeFileSync(tmp + '/m.zip', buf); execSync(`unzip -q -o m.zip`, { cwd: tmp });
      const g = execSync(`find ${tmp} -name '*.gltf' | head -1`, { encoding: 'utf8' }).trim();
      execSync(`gltf-transform copy "${g}" "${raw}"`, { stdio: 'inherit' }); }
    const out = raw.replace('-raw.glb', '.glb');
    if (!ledger.includes(`## ASSET: ${out}`)) addLedger += `\n## ASSET: ${out}\n- title: ${info.name}\n- maker: ${maker}\n- source: ${info.viewerUrl || 'https://sketchfab.com/3d-models/' + uid}\n- license: ${licName}\n- downloaded: ${today} by the Sketchfab fetch robot\n- used in: (not in a game yet - the game that uses it must name "${maker}" on its credits screen)\n- changes: shrunk for phones (textures max 1024 px, WebP)\n`;
    lines[t.i] = lines[t.i].replace(/^(\s*-\s*)OPEN/, `$1DONE (robot ${today}: ${out})`);
  } catch (e) { say(`FAILED ${uid}: ${e.message}`); }
}
if (!DRY) { fs.writeFileSync(reqFile, lines.join('\n')); if (addLedger) fs.appendFileSync('ASSETS.md', addLedger); }
fs.writeFileSync('fetch-report.txt', report.join('\n'));
