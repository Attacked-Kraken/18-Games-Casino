// Sound robot (owner Oct 19 2026: "make a way that a robot can create our own sounds with my new beat machine").
// For every recipe in sounds/recipes/*.json it opens beatmachine.html in a hidden browser, sets it up and exports a WAV:
//   { "name": "truck-menu", "type": "beat", "style": "Trap", "bpm": 140, "loops": 8, "pitch": 0 }   -> a music loop
//   { "name": "coin",       "type": "sfx",  "lib": "Coin" }                                        -> one library sound
//   { "name": "rally-v8",   "type": "engine", "kind": "v8", "rpm": 1200, "seconds": 2 }            -> a seamless engine loop
//       kind: v8 | diesel | inline4 | vtwin | superbike   rpm 500-16000   rev: [from, to] = a rev sweep instead of a loop
//       deep 0..1 (more chest), rough 0..1 (lumpy idle), blower 0..1 (supercharger whine), clatter 0..1 (diesel knock)
//   { "name": "hockey-goal-horn", "type": "mix", "layers": [{ "lib": "Airhorn long", "at": 0, "pitch": -7, "gain": 1 }, ...] }
//       -> a game sound effect made of library sounds stacked together (at = seconds, pitch = semitones, seconds = cut)
// Every recipe can also have: "title" (what the Sound Lab shows), "game" (hockey, baseball, ... or all), "tab" (music,
// effect, engine - guessed from the type). Music is saved as .m4a (small, full length), the rest as .wav.
// Per-game songs + effects come from tools/sound-themes.mjs (writes sounds/recipes/games.json).
// A recipe file can hold one recipe or a list. Output: sounds/made/<name>.wav (+ the recipe it came from in
// sounds/made/<name>.json, so an unchanged recipe is not made again). Also writes sounds/made/OPTIONS.md (every style and
// every library sound name) and sounds/made/catalog.json (what sounds/lab.html lists). All sounds are our own.
// Run: node tools/sound-robot.mjs   (needs playwright + a static server on :8899, see .github/workflows/sound-robot.yml)
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';

const OUT = 'sounds/made';
fs.mkdirSync(OUT, { recursive: true });
const recipes = [], ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;   // ONLY=hockey- makes just those (a test)
for (const f of fs.readdirSync('sounds/recipes').filter(f => f.endsWith('.json'))) {
  try { const j = JSON.parse(fs.readFileSync(path.join('sounds/recipes', f), 'utf8')); for (const r of [].concat(j)) if (!ONLY || ONLY.test(r.name || '')) recipes.push({ ...r, _file: f }); }
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
  options.lib.map(e => `- ${e.name} (${e.cat})`).join('\n') + '\n\n## Full control of a beat (any of these, all optional - see sounds/recipes/games.json, made by tools/sound-themes.mjs)\n' +
  '- style: start from a style, then change anything below\n- bpm, swing (0-100), pitch (-12..12), key ("C".."B"), scale (Minor, Major, Dorian, Harmonic minor, Minor pentatonic, Major pentatonic, Blues, Chromatic)\n' +
  '- patterns: up to 8 (A-H), each { drums: { kick, snare, clap, chat, ohat, tom, rim, bass: "x...o..." (x loud, o soft, . rest, 16 steps) }, clear: true (empty the other drums), bass: [16 semitones], melody: [16 scale steps, -1 = rest], chords: [4 chord roots I=0..vii=6, -1 = none], len }\n' +
  '- song: [["Intro",0,["kick","bass"]],["Verse",0],["Hook",1],["Build",1],["Drop",1],["Outro",0]] (section name, pattern 0-7, instruments OFF in that section: kick snare clap hat ohat tom rim bass melody chords) - Build adds a riser, Drop an impact\n' +
  '- master: clean | punchy (default) | loud\n' +
  '- sound: { melody: lead | pluck | keys | pad | bell | chip, or a REAL instrument: piano | strings | cello | pizz | brass | horn | flute | harp | glock (CC0 recordings), octave, melVol, chdVol }\n' +
  '- tracks: { kick|snare|clap|chat|ohat|tom|rim|bass: { vol 0-1, pan -1..1, pitch, reverse, mute, sample: "lib:<library sound>" or "file:sounds/real/<your recording>.wav" } }\n' +
  '- fx: { reverb 0-100, size, drive, lowpass 0-100, highpass 0-100, resonance, crush (bits 4-16), crushMix, comp true/false, compThreshold, compRatio, echo 0-1, echoBeats, echoFeedback }\n' +
  '- sidechain, glide, crackle: true/false; loops 1-16\n' +
  '- REAL sounds: put recordings (WAV) in sounds/real/ and use them with "file:sounds/real/<name>.wav" on any track\n' +
  '\n\n## Engines ("type": "engine")\n- kind: v8, diesel, inline4, vtwin, superbike\n- rpm, seconds, rev [from,to], deep, rough, blower, clatter (0..1)\n');
let made = 0;
// 16-bit stereo WAV -> the same loop played `reps` times, overlapped so every reverb tail rings into the next copy
function repeatWav(buf, loopSecs, reps) {
  const nc = buf.readUInt16LE(22), sr = buf.readUInt32LE(24), n = (buf.length - 44) / 2 / nc, step = Math.round(loopSecs * sr);
  const total = step * (reps - 1) + n, mix = new Float32Array(total * nc);
  for (let k = 0; k < reps; k++) for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) mix[(k * step + i) * nc + c] += buf.readInt16LE(44 + (i * nc + c) * 2) / 32768;
  let m = 0; for (const v of mix) m = Math.max(m, Math.abs(v)); const g = m > 0.98 ? 0.98 / m : 1;
  const out = Buffer.alloc(44 + total * nc * 2); buf.copy(out, 0, 0, 44); out.writeUInt32LE(36 + total * nc * 2, 4); out.writeUInt32LE(total * nc * 2, 40);
  for (let i = 0; i < mix.length; i++) out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(mix[i] * g * 32767))), 44 + i * 2);
  return out;
}
const tabOf = r => r.tab || (r.type === 'engine' ? 'engine' : (r.type === 'sfx' || r.type === 'mix') ? 'effect' : 'music');
let ffmpeg = true; try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch { ffmpeg = false; console.log('NOTE no ffmpeg - music stays .wav'); }
let oldCat = {}; try { for (const c of JSON.parse(fs.readFileSync(path.join(OUT, 'catalog.json'), 'utf8')).sounds) oldCat[c.name] = c; } catch {}
const cat = [], keep = new Set(['OPTIONS.md', 'index.html', 'catalog.json']);
const durOf = f => { try { return +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim() || 0; } catch { return 0; } };
for (const r of recipes) {
  const name = String(r.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!name) { console.log('SKIP a recipe with no name in ' + r._file); continue; }
  const tab = tabOf(r), ext = tab === 'music' && ffmpeg ? '.m4a' : '.wav';
  const key = JSON.stringify({ ...r, _file: undefined }), meta = path.join(OUT, name + '.json'), wav = path.join(OUT, name + '.wav'), file = path.join(OUT, name + ext);
  keep.add(name + '.json'); keep.add(name + ext);
  const entry = (secs, made) => cat.push({ name, title: r.title || name.replace(/-/g, ' '), game: r.game || 'all', tab, file: name + ext,
    secs: Math.round(secs * 10) / 10, kb: Math.round(fs.statSync(file).size / 1024), made });
  if (fs.existsSync(file) && fs.existsSync(meta) && fs.readFileSync(meta, 'utf8') === key) {
    console.log('SAME ' + name); const o = oldCat[name]; entry(o?.secs || durOf(file), o?.made || new Date().toISOString()); continue; }
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
      if (r.type === 'mix') {   // a game sound effect: library sounds stacked, each with its own start, pitch and level
        const find = w => { w = String(w || '').toLowerCase(); return B.LIBR.find(e => e.name.toLowerCase() === w) || B.LIBR.find(e => e.name.toLowerCase().includes(w)); };
        const lay = [];
        let IM = null;
        for (const l of r.layers || []) {
          if (l.inst) {   // a REAL recorded instrument note (sounds/instruments, CC0): { inst: "brass", note: 67 }
            IM = IM || await (await fetch('/sounds/instruments/instruments.json')).json();
            const d = IM[l.inst]; if (!d) return { err: 'no instrument "' + l.inst + '"' };
            const want = +l.note || 60, n = d.notes.reduce((a, b) => Math.abs(b - want) < Math.abs(a - want) ? b : a);
            const ab = await (await fetch('/sounds/instruments/' + l.inst + '/' + n + '.mp3')).arrayBuffer();
            const buf = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(ab);
            lay.push({ ...l, buf, rate: Math.pow(2, (want - n + (+l.pitch || 0)) / 12) }); continue; }
          const e = find(l.lib); if (!e) return { err: 'no library sound "' + l.lib + '"' };
          const sm = await B.ensureLib(e.id); lay.push({ ...l, buf: sm.buf, rate: Math.pow(2, (+l.pitch || 0) / 12) }); }
        if (!lay.length) return { err: 'a mix needs layers' };
        const sr = 44100, end = Math.min(12, r.seconds || Math.max(...lay.map(l => (+l.at || 0) + (l.seconds || l.buf.duration / l.rate))) + 0.05);
        const oc = new OfflineAudioContext(2, Math.ceil(sr * end), sr);
        for (const l of lay) { const src = oc.createBufferSource(); let bf = l.buf;
          if (l.reverse) { bf = oc.createBuffer(l.buf.numberOfChannels, l.buf.length, l.buf.sampleRate); for (let c = 0; c < bf.numberOfChannels; c++) bf.getChannelData(c).set(l.buf.getChannelData(c).slice().reverse()); }
          src.buffer = bf; src.playbackRate.value = l.rate; const g = oc.createGain(), t0 = +l.at || 0; g.gain.value = l.gain ?? 1;
          if (l.seconds) { g.gain.setValueAtTime(l.gain ?? 1, t0 + Math.max(0, l.seconds - 0.05)); g.gain.linearRampToValueAtTime(0, t0 + l.seconds); }
          src.connect(g).connect(oc.destination); src.start(t0); }
        const out = await oc.startRendering(), chs = [out.getChannelData(0), out.getChannelData(1)];
        let m = 0; for (const d of chs) for (const v of d) m = Math.max(m, Math.abs(v)); for (const d of chs) for (let i = 0; i < d.length; i++) d[i] = d[i] / (m || 1) * 0.9;
        return { b64: toB64(wav(chs, sr)), what: lay.length + ' layers', secs: end };
      }
      if (r.type === 'sfx') {
        const want = String(r.lib || '').toLowerCase(), e = B.LIBR.find(e => e.id === r.lib || e.name.toLowerCase() === want) || B.LIBR.find(e => e.name.toLowerCase().includes(want));
        if (!e) return { err: 'no library sound called "' + r.lib + '" (see sounds/made/OPTIONS.md)' };
        const sm = await B.ensureLib(e.id), bf = sm.buf, chs = []; for (let c = 0; c < bf.numberOfChannels; c++) chs.push(bf.getChannelData(c));
        return { b64: toB64(wav(chs, bf.sampleRate)), what: e.name };
      }
      if (r.style && !B.STY[r.style]) return { err: 'no style called "' + r.style + '" (see sounds/made/OPTIONS.md)' };
      B.S.songOn = false; if (r.style) B.applyStyle(r.style);
      // owner Oct 19: "teach it to use all the buttons and mixing" - every Beat Machine control a recipe can set
      const S = B.S, TR = { kick: 0, snare: 1, clap: 2, chat: 3, hat: 3, ohat: 4, tom: 5, rim: 6, bass: 7, '808': 7 };
      const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      if (r.key != null) S.key = typeof r.key === 'number' ? ((r.key % 12) + 12) % 12 : Math.max(0, NOTES.indexOf(String(r.key).toUpperCase().replace('B#', 'C')));
      if (r.scale) S.scale = r.scale;
      S.bassPitch = r.bassPitch ?? 0;
      (r.patterns || []).slice(0, 8).forEach((pt, i) => { const P = S.pats[i]; if (!P) return;
        if (pt.drums) { let len = 0; for (const [k, row] of Object.entries(pt.drums)) { const t = TR[k.toLowerCase()]; if (t == null) continue;
            const v = String(row).replace(/\s/g, '').split('').slice(0, 16).map(c => c === 'x' ? 1 : c === 'o' ? 0.6 : 0); len = Math.max(len, v.length);
            P.steps[t] = Array.from({ length: 16 }, (_, j) => v[j] || 0); }
          if (pt.clear) for (let t = 0; t < 8; t++) if (!Object.keys(pt.drums).some(k => TR[k.toLowerCase()] === t)) P.steps[t] = Array(16).fill(0);
          P.len = pt.len || len || 16; }
        if (pt.bass) P.bassNotes = Array.from({ length: 16 }, (_, j) => pt.bass[j] || 0);
        if (pt.melody) P.mel = Array.from({ length: 16 }, (_, j) => pt.melody[j] == null ? -1 : pt.melody[j]);
        if (pt.chords) P.chord = Array.from({ length: 4 }, (_, j) => pt.chords[j] == null ? -1 : pt.chords[j]);
        if (pt.len) P.len = pt.len; });
      const OFF = { kick: 0, snare: 1, clap: 2, chat: 3, hat: 3, ohat: 4, tom: 5, rim: 6, bass: 7, '808': 7, melody: 8, chords: 9 };
      const offs = l => (l || []).map(k => OFF[String(k).toLowerCase()]).filter(x => x != null);   // instruments switched off in that section
      if (Array.isArray(r.song) && r.song.length) { S.song = r.song.map(b => Array.isArray(b) ? { name: b[0], pat: b[1] || 0, off: offs(b[2]) } : { name: b.name || 'Verse', pat: b.pat || 0, off: offs(b.off) }); S.songOn = true; }
      S.masterMode = r.master || 'punchy';
      const snd = r.sound || {};
      if (snd.melody) S.melWave = snd.melody; if (snd.octave) S.melOct = snd.octave;
      if (snd.melVol != null) S.melVol = snd.melVol; if (snd.chdVol != null) S.chdVol = snd.chdVol;
      for (const [k, o] of Object.entries(r.tracks || {})) { const t = TR[k.toLowerCase()]; if (t == null) continue;
        if (o.vol != null) S.vol[t] = o.vol; if (o.mute != null) S.mute[t] = !!o.mute;
        if (o.pan != null) S.tp[t].pan = o.pan; if (o.pitch != null) S.tp[t].pitch = o.pitch; if (o.reverse != null) S.tp[t].rev = !!o.reverse;
        if (o.sample) { const sp = String(o.sample);
          if (sp.startsWith('file:')) {   // a REAL recording from the repo (sounds/real/...) on this drum track
            const res = await fetch('/' + sp.slice(5)); if (!res.ok) return { err: 'no file ' + sp.slice(5) };
            const f = new File([await res.blob()], sp.split('/').pop(), { type: 'audio/wav' }); await B.loadFiles([f]);
            const last = [...B.LIB.values()].pop(); if (last) S.tp[t].sample = last.id;
          } else { const w = sp.replace(/^lib:/, '').toLowerCase(), e = B.LIBR.find(e => e.name.toLowerCase() === w) || B.LIBR.find(e => e.name.toLowerCase().includes(w));
            if (!e) return { err: 'no library sound "' + sp + '"' }; await B.ensureLib(e.id); S.tp[t].sample = e.id; } } }
      const fx = r.fx || {}, F = S.fx;
      const setn = (k, v) => { if (v != null) F[k] = v; };
      setn('rev', fx.reverb); setn('size', fx.size); setn('drive', fx.drive); setn('lp', fx.lowpass); setn('hp', fx.highpass); setn('res', fx.resonance);
      setn('bits', fx.crush); setn('crushMix', fx.crushMix); setn('thr', fx.compThreshold); setn('ratio', fx.compRatio);
      if (fx.comp != null) F.on.comp = !!fx.comp;
      if (fx.echo != null) B.M.echo = fx.echo; if (fx.echoBeats != null) B.M.echoBeats = fx.echoBeats; if (fx.echoFeedback != null) B.M.fb = fx.echoFeedback;
      if (r.sidechain != null) S.sidechain = !!r.sidechain; if (r.glide != null) S.glide = !!r.glide;
      if (r.bpm) B.S.bpm = Math.max(60, Math.min(180, Math.round(r.bpm)));
      if (r.pitch != null) B.S.tune = Math.max(-12, Math.min(12, +r.pitch));
      if (r.swing != null) B.S.swing = Math.max(0, Math.min(100, +r.swing));
      if (r.crackle != null) B.S.crackle = !!r.crackle;
      // the browser slows down a LOT on long renders (1 loop 15 s, 5 loops 7+ min), so it renders ONE loop and Node
      // lays the copies end to end (each with its own reverb tail, so the joins are seamless)
      const sel = document.getElementById('wavLoops'), nl = '1';
      const loopSecs = (S.songOn && S.song.length ? S.song : [{ pat: S.cur }]).reduce((a, b) => a + S.pats[b.pat].len * 60 / S.bpm / 4, 0);
      if (![...sel.options].some(o => o.value === nl)) { const o = document.createElement('option'); o.value = nl; o.textContent = nl + 'x'; sel.appendChild(o); }
      sel.value = nl; B.lastExport.blob = null;
      await B.exportWav();
      if (!B.lastExport.blob) return { err: 'the export made nothing' };
      return { b64: toB64(await B.lastExport.blob.arrayBuffer()), what: r.style + ' ' + B.S.bpm + ' BPM', loopSecs };
    } catch (e) { return { err: e.message }; }
  }, r);
  if (res.err) { console.log(`FAILED ${name}: ${res.err}`); console.log(`::error title=Sound robot::FAILED ${name}: ${String(res.err).slice(0, 200)}`); continue; }
  let buf = Buffer.from(res.b64, 'base64');
  const reps = r.type === 'beat' || !r.type ? Math.max(1, Math.min(16, +(r.loops || 4))) : 1;
  if (reps > 1 && res.loopSecs) buf = repeatWav(buf, res.loopSecs, reps);
  fs.writeFileSync(wav, buf);
  if (ext === '.m4a') { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '128k', file]); fs.unlinkSync(wav); }
  fs.writeFileSync(meta, key); made++;
  entry(durOf(file), new Date().toISOString());
  console.log(`MADE ${name}${ext} (${res.what}, ${Math.round(fs.statSync(file).size / 1024)} KB)`);
}
await b.close();
// sounds that no recipe makes any more are removed (owner Oct 19: "I don't like those truck record")
if (!ONLY) for (const f of fs.readdirSync(OUT)) if (!keep.has(f)) { fs.unlinkSync(path.join(OUT, f)); console.log('REMOVED ' + f); }
fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify({ made: new Date().toISOString(), sounds: cat }, null, 1) + '\n');
// the listening page is sounds/lab.html (tabs: Newest / Soundtracks / Sound effects / Engines); this one just sends you there
fs.writeFileSync(path.join(OUT, 'index.html'), '<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../lab.html"><a href="../lab.html">Apex Sound Lab</a>\n');
console.log(`SOUND ROBOT: ${made} new, ${recipes.length} recipes`);
