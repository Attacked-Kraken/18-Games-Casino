// Rim + tyre shortlist (owner Nov 1 2026: "bring me new ones to pick rims and tire combos"). Search only - downloads nothing but small pictures.
import fs from 'fs';
const API = 'https://api.sketchfab.com/v3', Q = ['wheel tire', 'car wheel with tyre', 'alloy wheel tire', 'racing wheel tire', 'sports car wheel rim tyre', 'supercar wheel', 'drift wheel', 'forged wheel tire', 'rim and tire', 'multi spoke rim tyre'];
const lic = (l) => { const s = ((l && (l.slug || l.label)) || '').toLowerCase().trim(); return /cc0|public domain|zero/.test(s) ? 'CC0' : (s === 'by' || s === 'cc attribution') ? 'CC-BY' : ''; };
const seen = new Set(), out = [];
fs.mkdirSync('out', { recursive: true });
for (const q of Q) {
  const r = await fetch(`${API}/search?type=models&q=${encodeURIComponent(q)}&downloadable=true&sort_by=-likeCount&count=30`).then(x => x.json()).catch(e => ({ err: String(e) }));
  const m0 = (r.results || [])[0]; console.log('::notice title=search::' + q + ' -> ' + (r.results || []).length + ' ' + (r.err || '') + ' ' + (r.detail || '') + ' first=' + JSON.stringify(m0 ? { n: m0.name, l: m0.license, f: m0.faceCount, d: m0.isDownloadable } : null));
  let n = 0;
  for (const m of r.results || []) {
    if (seen.has(m.uid) || n >= 4) continue;
    const L = lic(m.license), f = m.faceCount || 0;
    if (!/wheel|rim|tire|tyre/i.test(m.name) || /steering|bike|bicycle|motorcycle|truck|tractor|forklift|cart\b/i.test(m.name)) continue;
    if (!L || f < 3000 || f > 150000) continue;
    const t = (m.thumbnails && m.thumbnails.images || []).slice().sort((a, b) => Math.abs(a.width - 500) - Math.abs(b.width - 500))[0];
    if (!t) continue;
    seen.add(m.uid); n++;
    const i = out.length + 1, buf = Buffer.from(await (await fetch(t.url)).arrayBuffer());
    fs.writeFileSync(`out/${String(i).padStart(2, '0')}.jpg`, buf);
    out.push({ n: i, name: m.name, uid: m.uid, license: L, faces: f, by: m.user && m.user.displayName, likes: m.likeCount, url: m.viewerUrl, query: q });
  }
}
fs.writeFileSync('out/list.json', JSON.stringify(out, null, 1));
console.log(out.length, 'candidates');
