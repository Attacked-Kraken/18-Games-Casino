// Sketchfab SEARCH robot (owner Oct 19 2026: "yes search mode for the sketchfab bot" - no more guessing for 3D models).
// For every "- SEARCH · <words> · for <what>" line in MODEL-SEARCH.md (or the workflow's `search` input) it asks Sketchfab
// for DOWNLOADABLE models, keeps only CC Attribution / CC0 ones under 20 MB, best first, and writes
// models/search/<slug>.json + models/search/index.json. The owner looks at them with pictures and spins them in 3D on
// tools/model-search.html, taps "Get it", and the fetch robot downloads that one (models/picks/<id>.txt).
import fs from 'fs';

const API = 'https://api.sketchfab.com/v3', today = new Date().toISOString().slice(0, 10), MAX_MB = 20, KEEP = 12;
const say = (s) => { console.log(s); console.log('::notice title=Sketchfab search::' + s.replace(/[\r\n]+/g, ' ')); };
const file = 'MODEL-SEARCH.md';
let lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n') : [];
const todo = [];
for (const q of String(process.env.SEARCH || '').split(';').map(s => s.trim()).filter(Boolean)) todo.push({ words: q, for: '', i: -1 });
lines.forEach((l, i) => { const m = l.match(/^\s*-\s*SEARCH\s*·\s*([^·]+?)\s*(?:·\s*(?:for\s+)?(.+?))?\s*$/i); if (m) todo.push({ words: m[1], for: m[2] || '', i }); });
if (!todo.length) { say('No SEARCH lines in MODEL-SEARCH.md.'); process.exit(0); }
fs.mkdirSync('models/search', { recursive: true });
const idxFile = 'models/search/index.json';
let index = []; try { index = JSON.parse(fs.readFileSync(idxFile, 'utf8')); } catch {}
const licOf = (lic) => { const s = ((lic && (lic.slug || lic.label)) || '').toLowerCase();
  return /cc0|public domain/.test(s) ? 'CC0' : (s === 'by' || /^cc attribution$|attribution$/.test(s) && !/non|share|deriv/.test(s)) ? 'CC-BY 4.0' : null; };
const thumb = (m) => { const im = ((m.thumbnails || {}).images || []).filter(x => x.width >= 200).sort((a, b) => a.width - b.width); return (im[0] || {}).url || ''; };
for (const t of todo) {
  const slug = t.words.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'search';
  try {
    const found = [];
    let url = `${API}/search?type=models&q=${encodeURIComponent(t.words)}&downloadable=true&sort_by=-likeCount&count=24`;
    for (let page = 0; page < 3 && url && found.length < KEEP; page++) {
      const j = await (await fetch(url)).json();
      for (const m of j.results || []) {
        if (found.length >= KEEP || m.isDownloadable === false) continue;
        let lic = licOf(m.license);
        if (!lic && !m.license) { try { lic = licOf((await (await fetch(`${API}/models/${m.uid}`)).json()).license); } catch {} }
        if (!lic) continue;
        const ar = m.archives || {}, a = ar.glb || ar.gltf || {}, mb = a.size ? a.size / 1e6 : null;
        if (mb != null && mb > MAX_MB) continue;
        found.push({ uid: m.uid, name: m.name, maker: (m.user && (m.user.displayName || m.user.username)) || '', license: lic,
          mb: mb != null ? Math.round(mb * 10) / 10 : null, faces: a.faceCount || m.faceCount || null, likes: m.likeCount || 0,
          link: m.viewerUrl || `https://sketchfab.com/3d-models/${m.uid}`, thumb: thumb(m) });
      }
      url = j.next || '';
    }
    fs.writeFileSync(`models/search/${slug}.json`, JSON.stringify({ words: t.words, for: t.for, date: today, results: found }, null, 1) + '\n');
    index = index.filter(x => x.slug !== slug); index.unshift({ slug, words: t.words, for: t.for, date: today, count: found.length });
    say(`SEARCH "${t.words}": ${found.length} free models (CC-BY / CC0, under ${MAX_MB} MB)`);
    if (t.i >= 0) lines[t.i] = lines[t.i].replace(/^(\s*-\s*)SEARCH/i, `$1DONE (robot ${today}: ${found.length} found - tools/model-search.html)`);
  } catch (e) { say(`SEARCH "${t.words}" FAILED: ${e.message}`); }
}
fs.writeFileSync(idxFile, JSON.stringify(index.slice(0, 60), null, 1) + '\n');
if (lines.length) fs.writeFileSync(file, lines.join('\n'));
