// Asset check robot (owner's law, ASSET-LAW.md Part III). No browser needed.
// Fails when: a 3D file has no ASSETS.md entry, an entry has a license we don't allow, or a game uses a CC-BY asset
// without naming its maker anywhere in the game's files (its credits screen).
// Run: node tools/asset-check.mjs      (exit 1 = problems)
import fs from 'fs';
import { execSync } from 'child_process';

const ALLOWED = /^(CC0|CC-BY (3\.0|4\.0))\b/i;
const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n')
  .filter(f => /\.(glb|gltf|fbx|obj)$/i.test(f) && !f.startsWith('node_modules/'));
const ledger = [];
let cur = null, fence = false;
for (const line of fs.readFileSync('ASSETS.md', 'utf8').split('\n')) {
  if (line.trim().startsWith('```')) { fence = !fence; cur = null; continue; }
  if (fence) continue;
  const h = line.match(/^##\s*ASSET:\s*(.+)$/);
  if (h) { cur = { path: h[1].trim() }; ledger.push(cur); continue; }
  const kv = line.match(/^\s*-\s*([a-z ]+):\s*(.*)$/i);
  if (cur && kv) cur[kv[1].trim().toLowerCase()] = kv[2].trim();
}
const problems = [];
for (const e of ledger) {
  if (!ALLOWED.test(e.license || '')) problems.push(`ASSETS.md "${e.path}": license "${e.license || 'missing'}" is not allowed (CC0, CC-BY 3.0, CC-BY 4.0 only)`);
  for (const k of ['maker', 'source']) if (!e[k]) problems.push(`ASSETS.md "${e.path}": missing "${k}"`);
}
const cover = f => ledger.find(e => e.path === f || (e.path.endsWith('/') && f.startsWith(e.path)));
for (const f of files) if (!cover(f)) problems.push(`${f} has no entry in ASSETS.md (add title, maker, source, license)`);
// CC-BY: every game that loads the asset must name the maker (its credits screen)
const games = fs.readdirSync('.').filter(f => /^apex[a-z0-9]*\.html$/.test(f));
const gameText = g => [g, g.replace('.html', '.js')].filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n');
for (const e of ledger.filter(e => /^CC-BY/i.test(e.license || ''))) {
  for (const g of games) {
    const t = gameText(g);
    const uses = t.includes(e.path) || (e['used in'] || '').includes(g);
    if (uses && !t.includes(e.maker)) problems.push(`${g} uses CC-BY "${e.title || e.path}" but its credits don't name the maker "${e.maker}"`);
  }
}
if (problems.length) { console.log('ASSET CHECK - problems:\n- ' + problems.join('\n- ')); process.exit(1); }
console.log(`ASSET CHECK - ok: ${files.length} 3D files, ${ledger.length} ledger entries, every one allowed and credited.`);
