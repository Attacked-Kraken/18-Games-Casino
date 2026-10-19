// Sound robot (owner Oct 19 2026: "make a way that a robot can create our own sounds with my new beat machine").
// For every recipe in sounds/recipes/*.json it opens beatmachine.html in a hidden browser, sets it up and exports a WAV:
//   { "name": "truck-menu", "type": "beat", "style": "Trap", "bpm": 140, "loops": 8, "pitch": 0 }   -> a music loop
//   { "name": "coin",       "type": "sfx",  "lib": "Coin" }                                        -> one library sound
//   { "name": "rally-v8",   "type": "engine", "kind": "v8", "rpm": 1200, "seconds": 2 }            -> a seamless engine loop
//       kind: v8 | diesel | inline4 | vtwin | superbike   rpm 500-16000   rev: [from, to] = a rev sweep instead of a loop
//       deep 0..1 (more chest), rough 0..1 (lumpy idle), blower 0..1 (supercharger whine), clatter 0..1 (diesel knock)
// A recipe file can hold one recipe or a list. Output: sounds/made/<name>.wav (+ the recipe it came from in
// sounds/made/<name>.json, so an unchanged recipe is not made again). Also writes sounds/made/OPTIONS.md (every style and
// every library sound name) and sounds/made/index.html (a page to listen to everything). All sounds are our own.
// Run: node tools/sound-robot.mjs   (needs playwright + a static server on :8899, see .github/workflows/sound-robot.yml)
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const OUT = 'sounds/made';
fs.mkdirSync(OUT, { recursive: true });
const recipes = [];
for (const f of fs.readdirSync('sounds/recipes').filter(f => f.endsWith('.json'))) {
  try { const j = JSON.parse(fs.readFileSync(path.join('sounds/recipes', f), 'utf8')); for (const r of [].concat(j)) recipes.push({ ...r, _file: f }); }
  catch (e) { console.log(`BAD RECIPE ${f}: ${e.message}`); }
}
const exe = process.env.CHROME || undefined;
const b = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto('http://localhost:8899/beatmachine.html'); await p.waitForTimeout(2500);
await p.waitForFunction(() => window.APB && APB.STY, null, { timeout: 30000 });
const options = await p.evaluate(() => ({ styles: Object.keys(APB.STY), lib: APB.LIBR.map(e => ({ id: e.id, name: e.name, cat: e.cat })) }));
fs.writeFileSync(path.join(OUT, 'OPTIONS.md'), '# What the sound robot can make\n\n## Beat styles ("type": "beat", "style": ...)\n' +
  options.styles.map(s => '- ' + s).join('\n') + '\n\nbpm 60-180, pitch -12..12, loops 1-16\n\n## Library sounds ("type": "sfx", "lib": ...)\n' +
  options.lib.map(e => `- ${e.name} (${e.cat})`).join('\n') + '\n\n## Engines ("type": "engine")\n- kind: v8, diesel, inline4, vtwin, superbike\n- rpm, seconds, rev [from,to], deep, rough, blower, clatter (0..1)\n');
let made = 0;
for (const r of recipes) {
  const name = String(r.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!name) { console.log('SKIP a recipe with no name in ' + r._file); continue; }
  const key = JSON.stringify({ ...r, _file: undefined }), meta = path.join(OUT, name + '.json'), wav = path.join(OUT, name + '.wav');
  if (fs.existsSync(wav) && fs.existsSync(meta) && fs.readFileSync(meta, 'utf8') === key) { console.log('SAME ' + name); continue; }
  const res = await p.evaluate(async (r) => {
    const toB64 = (ab) => { let s = '', u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
    const wav = (chs, sr) => { const n = chs[0].length, nc = chs.length, ab = new ArrayBuffer(44 + n * nc * 2), v = new DataView(ab); let o = 0;
      const ws = t => { for (const c of t) v.setUint8(o++, c.charCodeAt(0)); }, u32 = x => { v.setUint32(o, x, true); o += 4; }, u16 = x => { v.setUint16(o, x, true); o += 2; };
      ws('RIFF'); u32(36 + n * nc * 2); ws('WAVE'); ws('fmt '); u32(16); u16(1); u16(nc); u32(sr); u32(sr * nc * 2); u16(nc * 2); u16(16); ws('data'); u32(n * nc * 2);
      for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) { const x = Math.max(-1, Math.min(1, chs[c][i])); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2; } return ab; };
    try {
      const B = window.APB;
      if (r.type === 'engine') {   // our own engine synth: firing pulses through a body resonance + exhaust, seamless loop
        const K = { v8: { cyl: 8, res: 95, lope: 0.35 }, diesel: { cyl: 8, res: 70, lope: 0.15 }, inline4: { cyl: 4, res: 160, lope: 0.05 },
          vtwin: { cyl: 2, res: 85, lope: 0.5 }, superbike: { cyl: 4, res: 260, lope: 0.02 } }[r.kind || 'v8'];
        if (!K) return { err: 'engine kind must be v8, diesel, inline4, vtwin or superbike' };
        const sr = 44100, deep = r.deep ?? 0.5, rough = r.rough ?? 0.3, blower = r.blower ?? 0, clat = r.clatter ?? (r.kind === 'diesel' ? 0.5 : 0);
        const rev = Array.isArray(r.rev) ? r.rev : null, rpm0 = rev ? rev[0] : (r.rpm || 1000);
        // a loop is a whole number of engine cycles long, so it repeats with no click
        const cycle = 120 / rpm0, secs = rev ? (r.seconds || 3) : Math.max(cycle, Math.round((r.seconds || 2) / cycle) * cycle);
        const n = Math.round(secs * sr), out = new Float32Array(n);
        let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const amp = Array.from({ length: K.cyl }, () => 1 - rough * 0.5 * rnd()), lag = Array.from({ length: K.cyl }, (_, i) => (i % 2 ? 1 : -1) * K.lope * 0.25 * (0.5 + rough));
        // biquad helpers (resonant low-pass), coefficients updated as the rpm changes
        const bq = () => ({ b0: 0, b1: 0, b2: 0, a1: 0, a2: 0, x1: 0, x2: 0, y1: 0, y2: 0 });
        const setLP = (f, fc, Q) => { const w = 2 * Math.PI * Math.min(fc, sr * 0.45) / sr, al = Math.sin(w) / (2 * Q), c = Math.cos(w), a0 = 1 + al;
          f.b0 = (1 - c) / 2 / a0; f.b1 = (1 - c) / a0; f.b2 = f.b0; f.a1 = -2 * c / a0; f.a2 = (1 - al) / a0; };
        const run = (f, x) => { const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2; f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y; return y; };
        const body = bq(), exh = bq(), exh2 = bq();
        let ph = 0, fired = -1, env = 0, nz = 0, bph = 0, lastRpm = -1, dcx = 0, dcy = 0;
        const f0 = K.res * (1.15 - deep * 0.45), decay = 0.0035 + deep * 0.004;
        for (let i = 0; i < n; i++) {
          const t = i / sr, k = rev ? t / secs : 0, rpm = rev ? rev[0] + (rev[1] - rev[0]) * (k * k * (3 - 2 * k)) : rpm0;
          if (Math.abs(rpm - lastRpm) > 5) { lastRpm = rpm; setLP(body, f0 * (1 + rpm / 7000), 3.5); const ec = 700 + rpm * 0.35 + (1 - deep) * 900; setLP(exh, ec, 0.8); setLP(exh2, ec * 1.6, 0.7); }
          ph += rpm / 60 * K.cyl / 2 / sr;
          const idx = Math.floor(ph + lag[((Math.floor(ph) % K.cyl) + K.cyl) % K.cyl]);
          if (idx !== fired) { fired = idx; const c = ((idx % K.cyl) + K.cyl) % K.cyl; env = amp[c]; nz = env * (0.25 + clat * 0.75); }
          env *= Math.exp(-1 / (sr * decay)); nz *= Math.exp(-1 / (sr * (clat ? 0.003 : 0.0018)));
          const ex = env + (rnd() * 2 - 1) * nz * 0.6;
          let x = run(body, ex) * 0.55 + ex * 1.1;   // body thump + the sharp firing crack (the crack is what a phone speaker can play)
          if (blower) { bph += (rpm / 60 * 3.2) / sr; x += blower * 0.12 * (Math.sin(2 * Math.PI * bph) * 0.75 + Math.sin(4 * Math.PI * bph) * 0.25) * (0.5 + rpm / 9000); }
          const y = run(exh2, run(exh, x)); dcy = y - dcx + 0.9975 * dcy; dcx = y;   // DC blocker (pulses are one-sided)
          out[i] = Math.tanh(dcy * 2.2);
        }
        if (!rev) { const xf = Math.min(Math.round(sr * 0.02), n >> 3); for (let i = 0; i < xf; i++) { const g = i / xf; out[i] = out[i] * g + out[n - xf + i] * (1 - g); } }
        let m = 0; for (const v of out) m = Math.max(m, Math.abs(v)); for (let i = 0; i < n; i++) out[i] = out[i] / (m || 1) * 0.9;
        return { b64: toB64(wav([out], sr)), what: (r.kind || 'v8') + ' ' + (rev ? rev.join('-') + ' rpm sweep' : rpm0 + ' rpm loop') };
      }
      if (r.type === 'sfx') {
        const want = String(r.lib || '').toLowerCase(), e = B.LIBR.find(e => e.id === r.lib || e.name.toLowerCase() === want) || B.LIBR.find(e => e.name.toLowerCase().includes(want));
        if (!e) return { err: 'no library sound called "' + r.lib + '" (see sounds/made/OPTIONS.md)' };
        const sm = await B.ensureLib(e.id), bf = sm.buf, chs = []; for (let c = 0; c < bf.numberOfChannels; c++) chs.push(bf.getChannelData(c));
        return { b64: toB64(wav(chs, bf.sampleRate)), what: e.name };
      }
      if (!B.STY[r.style]) return { err: 'no style called "' + r.style + '" (see sounds/made/OPTIONS.md)' };
      B.S.songOn = false; B.applyStyle(r.style);
      if (r.bpm) B.S.bpm = Math.max(60, Math.min(180, Math.round(r.bpm)));
      if (r.pitch != null) B.S.tune = Math.max(-12, Math.min(12, +r.pitch));
      if (r.swing != null) B.S.swing = Math.max(0, Math.min(100, +r.swing));
      if (r.crackle != null) B.S.crackle = !!r.crackle;
      const sel = document.getElementById('wavLoops'), nl = String(Math.max(1, Math.min(16, +(r.loops || 4))));
      if (![...sel.options].some(o => o.value === nl)) { const o = document.createElement('option'); o.value = nl; o.textContent = nl + 'x'; sel.appendChild(o); }
      sel.value = nl; B.lastExport.blob = null;
      await B.exportWav();
      if (!B.lastExport.blob) return { err: 'the export made nothing' };
      return { b64: toB64(await B.lastExport.blob.arrayBuffer()), what: r.style + ' ' + B.S.bpm + ' BPM' };
    } catch (e) { return { err: e.message }; }
  }, r);
  if (res.err) { console.log(`FAILED ${name}: ${res.err}`); continue; }
  fs.writeFileSync(wav, Buffer.from(res.b64, 'base64')); fs.writeFileSync(meta, key); made++;
  console.log(`MADE ${name}.wav (${res.what}, ${Math.round(fs.statSync(wav).size / 1024)} KB)`);
}
await b.close();
// a page to listen to everything the robot made
const list = fs.readdirSync(OUT).filter(f => /\.(wav|m4a|mp3)$/.test(f)).sort();
fs.writeFileSync(path.join(OUT, 'index.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Apex Sound Lab</title><style>body{font-family:-apple-system,sans-serif;background:#0f1218;color:#f2f4f8;margin:0;padding:18px}h1{font-size:20px;margin:0 0 4px}
p{color:#9aa6b5;font-size:13px;margin:0 0 14px}.s{background:#171b23;border-radius:12px;padding:10px 12px;margin-bottom:10px}.s b{display:block;margin-bottom:6px}audio{width:100%}</style></head>
<body><h1>Apex Sound Lab</h1><p>Every sound the robot made from Beat Machine recipes (sounds/recipes). ${list.length} sounds.</p>
${list.map(f => `<div class="s"><b>${f}</b><audio controls preload="none" src="${f}"></audio></div>`).join('\n')}
</body></html>`);
console.log(`SOUND ROBOT: ${made} new, ${recipes.length} recipes`);
