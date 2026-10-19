// Writes sounds/recipes/games.json: a MENU song + a PLAY song for every game (full length, ~2.5 min, its own style, key,
// chords and melody) + that game's own sound effects. Owner Oct 19 2026: "different music for each app, for its specific
// game sounds and effects", "the beat has too much bass in it, lean it up".
// Run: node tools/sound-themes.mjs   (then push - the sound robot makes the files; listen on sounds/lab.html)
// To change one song: edit its line in GAMES below (style, bpm, key, scale, chords, sound, seed) and run this again.
import fs from 'fs';

// owner Oct 19 2:24 PM "give me a delete button on Sound Lab ... he has to replace them and make something totally
// different": 🗑 on sounds/lab.html makes sounds/rejects/<name>.txt. Each one bumps that sound in sounds/bumps.json -
// a bumped SONG gets another style, tempo, key, instrument and seed; a bumped EFFECT gets other sounds and pitches.
const BUMPS = 'sounds/bumps.json';
let bumps = {}; try { bumps = JSON.parse(fs.readFileSync(BUMPS, 'utf8')); } catch {}
if (fs.existsSync('sounds/rejects')) for (const f of fs.readdirSync('sounds/rejects').filter(f => f.endsWith('.txt') && !f.startsWith('voice-'))) {
  const n = f.replace(/\.txt$/, ''); bumps[n] = (bumps[n] || 0) + 1; fs.unlinkSync('sounds/rejects/' + f); console.log('REMAKE ' + n + ' (take ' + (bumps[n] + 1) + ')'); }
fs.writeFileSync(BUMPS, JSON.stringify(bumps, null, 1) + '\n');
const RESTYLE = [['House', 'house', 124], ['Techno', 'techno', 130], ['Trap', 'trap', 140], ['Boom Bap', 'boombap', 90], ['Afrobeats', 'afro', 108],
  ['Reggaeton', 'dembow', 96], ['Lo-Fi', 'lofi', 82], ['Vaporwave', 'vapor', 100], ['Phonk', 'phonk', 130], ['Dubstep', 'dubstep', 140],
  ['Drum & Bass', 'dnb', 172], ['Jersey Club', 'jersey', 140], ['Nightcore', 'house', 158], ['Drill', 'trap', 142]];
const REKEY = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'F#', 'A#'], RESOUND = ['piano', 'strings', 'pizz', 'brass', 'horn', 'flute', 'harp', 'glock', 'lead', 'pluck', 'bell', 'keys', 'cello'];
function bumped(name, m) {
  const b = bumps[name] || 0; if (!b) return m;
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0), st = RESTYLE[(h + b * 5) % RESTYLE.length];
  return { ...m, style: st[0], groove: st[1], bpm: st[2], key: REKEY[(h + b * 3) % REKEY.length], scale: (h + b) % 2 ? 'Minor' : 'Major',
    sound: RESOUND[(h + b * 7) % RESOUND.length], seed: m.seed + 7919 * b, chords: [[0, 5, 3, 4], [0, 3, 4, 3], [5, 3, 0, 4], [0, 6, 5, 6], [0, 2, 5, 4]][(h + b) % 5],
    mel: undefined, bass: undefined, hats: undefined, shape: undefined, title: m.title + ' (take ' + (b + 1) + ')' };
}
const SWAP = { 'Airhorn': 'Brass stab', 'Airhorn long': 'Rave stab', 'Crowd cheer': 'Choir ah', 'Impact': 'Boom', 'Boom': 'Impact metal', 'Impact metal': 'Kick Distorted',
  'Whoosh': 'Sweep up', 'Sine ping': 'Chip blip', 'Chip blip': 'Laser pluck', 'Bell': 'Glass', 'Woodblock': 'Clave', 'Clave': 'Rimshot', 'Snare Crack': 'Clap Big',
  'Riser short': 'Sweep up', 'Laser': 'Laser zap', 'Scratch': 'Scratch fast', 'Siren alarm': 'Siren police', 'Shaker': 'Tambourine', 'Kick Punch': 'Kick Hard',
  'Hey': 'Yeah', 'Ooh': 'Oh', 'Downlifter': 'Sweep down', 'Snap': 'Clap Tight', 'Kick Tight': 'Kick Clicky' };
function bumpFx(name, layers) {
  const b = bumps[name] || 0; if (!b) return layers;
  const shift = [5, -4, 7, -7, 3, -2][(b - 1) % 6];
  return layers.map((l, i) => l.inst ? { ...l, note: l.note + shift, inst: ['brass', 'horn', 'strings', 'glock', 'harp', 'piano'][(i + b) % 6] }
    : { ...l, lib: (b % 2 ? SWAP[l.lib] : null) || l.lib, pitch: (l.pitch || 0) + shift });
}

const SCALES = { Minor: [0, 2, 3, 5, 7, 8, 10], Major: [0, 2, 4, 5, 7, 9, 11], Dorian: [0, 2, 3, 5, 7, 9, 10], 'Harmonic minor': [0, 2, 3, 5, 7, 8, 11] };
// drum rows per groove: x loud, o soft, . rest (16 steps = one bar). bass = when the bass note plays.
const GROOVE = {
  house:  { kick: 'x...x...x...x...', clap: '....x.......x...', chat: 'x.o.x.o.x.o.x.o.', ohat: '..x...x...x...x.', bass: '..x...x...x...xo' },
  techno: { kick: 'x...x...x...x...', clap: '....x.......x...', chat: 'oxoxoxoxoxoxoxox', rim: '..o..o....o..o..', bass: '.x.x.x.x.x.x.x.x' },
  boombap:{ kick: 'x......x..x.....', snare: '....x.......x...', chat: 'x.x.x.x.x.x.x.xo', bass: 'x......x..x.....' },
  afro:   { kick: 'x..x..x...x..x..', clap: '....x.......x...', chat: 'xoooxoooxoooxooo', rim: '..x..x....x..x..', tom: '.......o.....o..', bass: 'x..x......x..x..' },
  dembow: { kick: 'x...x...x...x...', snare: '...x..x....x..x.', chat: 'x.x.x.x.x.x.x.x.', bass: 'x..x..x.x..x..x.' },
  lofi:   { kick: 'x.....x...x.....', snare: '....x.......x...', chat: 'x.o.x.o.x.o.x.o.', bass: 'x.....x...x.....' },
  vapor:  { kick: 'x.......x.......', snare: '....x.......x...', chat: '..x...x...x...x.', ohat: '..............x.', bass: 'x.......x...x...' },
  phonk:  { kick: 'x..x..x...x..x..', snare: '....x.......x...', chat: 'xoxoxoxoxoxoxoxo', rim: 'x.x..x.x..x.x...', bass: 'x..x..x...x..x..' },
  dubstep:{ kick: 'x.........x.....', snare: '........x.......', chat: 'x.o.x.o.x.o.x.o.', tom: '..............ox', bass: 'x..x.x....x.x...' },
  dnb:    { kick: 'x.........x.....', snare: '....x.......x...', chat: 'x.x.x.x.x.x.x.x.', ohat: '......x.......x.', bass: 'x.....x...x.....' },
  trap:   { kick: 'x......x..x.....', snare: '........x.......', chat: 'xxxoxxxoxxxoxxox', bass: 'x......x..x.....' },
  jersey: { kick: 'x..x..x.x.x...x.', clap: '....x.......x...', chat: 'x.x.x.x.x.x.x.x.', bass: 'x..x..x.x.......' },
  rock:   { kick: 'x.......x.x.....', snare: '....x.......x...', chat: 'x.x.x.x.x.x.x.x.', ohat: '..............x.', bass: 'x.x.x.x.x.x.x.x.' },
};
// game: [menu song, play song]. chords = scale degrees (0 = home chord), 4 chords = 2 bars.
const GAMES = [
  { game: 'hockey', name: 'Ice Hockey',
    menu: { title: 'Ice Hockey - menu', style: 'House', groove: 'house', bpm: 122, key: 'A', scale: 'Minor', chords: [0, 5, 2, 6], sound: 'piano', seed: 11 },
    play: { title: 'Ice Hockey - game time', style: 'Techno', groove: 'techno', bpm: 132, key: 'A', scale: 'Minor', chords: [0, 0, 5, 6], sound: 'lead', seed: 12 } },
  { game: 'baseball', name: 'Baseball',
    menu: { title: 'Baseball - menu', style: 'Boom Bap', groove: 'boombap', bpm: 92, key: 'D', scale: 'Dorian', chords: [0, 3, 0, 4], sound: 'keys', seed: 21 },
    play: { title: 'Baseball - at the plate', style: 'Afrobeats', groove: 'afro', bpm: 108, key: 'G', scale: 'Major', chords: [0, 4, 5, 3], sound: 'pizz', seed: 22 } },
  { game: 'soccer', name: 'Soccer',
    menu: { title: 'Soccer - menu', style: 'Reggaeton', groove: 'dembow', bpm: 96, key: 'E', scale: 'Minor', chords: [0, 5, 2, 6], sound: 'pluck', seed: 31 },
    play: { title: 'Soccer - match', style: 'Afrobeats', groove: 'afro', bpm: 114, key: 'C', scale: 'Major', chords: [5, 3, 0, 4], sound: 'brass', seed: 32 } },
  { game: 'flight', name: 'Flight',
    menu: { title: 'Flight - menu', style: 'Lo-Fi', groove: 'lofi', bpm: 82, key: 'F', scale: 'Major', chords: [0, 2, 3, 4], sound: 'harp', seed: 41 },
    play: { title: 'Flight - in the sky', style: 'Vaporwave', groove: 'vapor', bpm: 104, key: 'D', scale: 'Major', chords: [0, 4, 5, 3], sound: 'strings', seed: 42 } },
  { game: 'monstertruck', name: 'Monster Truck',
    menu: { title: 'Monster Truck - menu', style: 'Phonk', groove: 'phonk', bpm: 130, key: 'C#', scale: 'Minor', chords: [0, 5, 3, 4], sound: 'bell', seed: 51 },
    play: { title: 'Monster Truck - arena', style: 'Dubstep', groove: 'dubstep', bpm: 140, key: 'E', scale: 'Harmonic minor', chords: [0, 5, 3, 4], sound: 'horn', seed: 52 } },
  { game: 'f1', name: 'F1',
    menu: { title: 'F1 - menu', style: 'Techno', groove: 'techno', bpm: 126, key: 'B', scale: 'Minor', chords: [0, 6, 5, 6], sound: 'pluck', seed: 61 },
    play: { title: 'F1 - race', style: 'Drum & Bass', groove: 'dnb', bpm: 172, key: 'B', scale: 'Minor', chords: [0, 5, 3, 4], sound: 'lead', seed: 62 } },
  { game: 'trackfield', name: 'Track & Field',
    menu: { title: 'Track & Field - menu', style: 'House', groove: 'house', bpm: 120, key: 'G', scale: 'Major', chords: [0, 5, 3, 4], sound: 'piano', seed: 71 },
    play: { title: 'Track & Field - race day', style: 'Jersey Club', groove: 'jersey', bpm: 140, key: 'G', scale: 'Minor', chords: [0, 5, 6, 4], sound: 'pluck', seed: 72 } },
  { game: 'racer', name: 'Exotic Racer',
    menu: { title: 'Exotic Racer - menu', style: 'Phonk', groove: 'phonk', bpm: 128, key: 'F#', scale: 'Minor', chords: [0, 3, 5, 4], sound: 'glock', seed: 81 },
    play: { title: 'Exotic Racer - street race', style: 'Nightcore', groove: 'house', bpm: 150, key: 'F#', scale: 'Minor', chords: [0, 5, 2, 6], sound: 'lead', seed: 82 } },
  { game: 'moto', name: 'Apex Moto',
    menu: { title: 'Apex Moto - menu', style: 'Trap', groove: 'trap', bpm: 140, key: 'D', scale: 'Minor', chords: [0, 5, 3, 4], sound: 'strings', seed: 91 },
    play: { title: 'Apex Moto - race', style: 'Drum & Bass', groove: 'dnb', bpm: 174, key: 'A', scale: 'Harmonic minor', chords: [0, 3, 5, 4], sound: 'lead', seed: 92 } },
];

function rng(seed) { let s = seed * 9301 + 49297; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const pick = (r, a) => a[Math.floor(r() * a.length)];
// owner Oct 19 2:20 PM "every beat sounds the same": every song now draws its OWN melody style, bass style, hat feel,
// chord speed and song shape (below), and every song opens on its hook - no more identical quiet chord intros.
const MEL = ['riff', 'arp', 'call', 'anthem', 'step', 'stab'];
const BASS = ['root', 'octave', 'synco', 'walk', 'pump'];
const HATS = ['x.x.x.x.x.x.x.x.', 'xxxxxxxxxxxxxxxx', 'x.xxx.xxx.xxx.xx', '..x...x...x...x.', 'xoxoxoxoxoxoxoxo', 'x..xx..xx..xx..x', 'xxx.xxx.xxx.xxx.'];
const SHAPES = [
  // hook first: the game's tune from the first second
  ['H1', 'H2', 'H1', 'H2', 'V1', 'V2', 'V1', 'V2', 'B', 'D1', 'H2', 'H1', 'H2', 'X1', 'X2', 'X1', 'X2', 'V1', 'V2', 'B', 'D1', 'H2', 'H1', 'H2', 'O'],
  // short build into the drop
  ['V1', 'V2', 'B', 'D1', 'H2', 'H1', 'H2', 'V1', 'V2', 'V1', 'V2', 'X1', 'X2', 'X1', 'X2', 'B', 'D1', 'H2', 'H1', 'H2', 'H1', 'H2', 'O'],
  // riff intro, call and answer
  ['X1', 'X2', 'H1', 'H2', 'H1', 'H2', 'V1', 'V2', 'V1', 'V2', 'H1', 'H2', 'X1', 'X2', 'B', 'D1', 'H2', 'H1', 'H2', 'H1', 'H2', 'O'],
  // groove first, then everything
  ['G', 'G', 'V1', 'V2', 'V1', 'V2', 'B', 'D1', 'H2', 'H1', 'H2', 'X1', 'X2', 'X1', 'X2', 'V1', 'V2', 'B', 'D1', 'H2', 'H1', 'H2', 'O'],
];
function melodyBar(r, style, c1, c2, hook, motif) {
  const out = Array(16).fill(-1), up = hook ? 7 : 0, tone = (c, k) => Math.max(0, Math.min(13, c + [0, 2, 4, 7][k] + up));
  if (style === 'arp') { const ord = pick(r, [[0, 1, 2, 3], [0, 2, 1, 3], [3, 2, 1, 0], [0, 1, 2, 1]]); const step = hook ? 1 : 2;
    for (let s = 0; s < 16; s += step) out[s] = tone(s < 8 ? c1 : c2, ord[(s / step) % 4]); return out; }
  if (style === 'anthem') { const at = hook ? [0, 4, 6, 8, 12] : [0, 8]; at.forEach((s, i) => out[s] = tone(s < 8 ? c1 : c2, motif[i % motif.length] % 4)); return out; }
  if (style === 'stab') { const at = hook ? [0, 3, 6, 10, 12, 14] : [0, 6, 10]; at.forEach((s, i) => out[s] = tone(s < 8 ? c1 : c2, motif[i % motif.length] % 4)); return out; }
  if (style === 'riff') { const rh = hook ? [0, 2, 3, 5, 8, 10, 11, 13] : [0, 3, 8, 11];
    rh.forEach((s, i) => { const c = s < 8 ? c1 : c2; out[s] = Math.max(0, Math.min(13, c + motif[i % motif.length] + up)); }); return out; }
  if (style === 'call') { const call = hook ? [0, 1, 2, 4, 6] : [0, 2, 4]; call.forEach((s, i) => out[s] = Math.max(0, Math.min(13, c1 + motif[i % motif.length] + up)));
    [8, 10, 12].forEach((s, i) => out[s] = Math.max(0, Math.min(13, c2 + motif[(motif.length - 1 - i + motif.length) % motif.length] + up - (i === 2 ? 1 : 0)))); return out; }
  // step: walking up/down the scale
  let v = c1 + up + (hook ? 2 : 0), dir = r() < 0.5 ? 1 : -1; const at = hook ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 4, 8, 12];
  for (const s of at) { out[s] = Math.max(0, Math.min(13, v)); v += dir * (r() < 0.75 ? 1 : 2); if (v > 12 || v < 1) dir = -dir; }
  return out;
}
function song(g, m, which) {
  const r = rng(m.seed), sc = SCALES[m.scale], gr = GROOVE[m.groove], ch = m.chords;
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let kOff = NOTES.indexOf(m.key) - 9; if (kOff < -6) kOff += 12; if (kOff > 5) kOff -= 12;   // the 808 is tuned from A
  const root = d => { let v = sc[((d % 7) + 7) % 7] + kOff; while (v > 7) v -= 12; while (v < -6) v += 12; return v; };
  const melStyle = m.mel || pick(r, MEL), bassStyle = m.bass || pick(r, BASS), hat = m.hats || pick(r, HATS), shape = SHAPES[m.shape ?? Math.floor(r() * SHAPES.length)];
  const motif = Array.from({ length: 4 + Math.floor(r() * 3) }, () => pick(r, [0, 1, 2, 3, 4, 5, 7, -1, -3]));
  const bassRow = { root: gr.bass, octave: 'x.x.x.x.x.x.x.x.', synco: 'x..x..x...x.x..x', walk: 'x...x...x...x...', pump: 'xxxxxxxxxxxxxxxx' }[bassStyle] || gr.bass;
  const bassOf = (a, b) => Array.from({ length: 16 }, (_, s) => root(s < 8 ? a : b) + (bassStyle === 'octave' && s % 4 === 2 ? 12 : 0) + (bassStyle === 'walk' ? [0, 0, 0, 0, 2, 2, 2, 2, 4, 4, 4, 4, 5, 5, 5, 5][s] * 0 + (s % 4 === 0 ? 0 : 0) : 0));
  const drums = (full) => { const o = { ...gr, chat: hat, bass: bassRow }; if (!full) { delete o.ohat; delete o.tom; } return o; };
  const groove = { kick: gr.kick, chat: hat, rim: gr.rim || '....x.......x...', bass: bassRow };
  const P = (rows, a, b, mel, chords) => ({ drums: rows, clear: true, bass: bassOf(a, b), melody: mel, chords });
  const [A, B, C, D] = ch;
  const pats = [
    P(drums(false), A, B, melodyBar(r, melStyle, A, B, false, motif), [A, -1, B, -1]),                       // 0 V1
    P(drums(false), C, D, melodyBar(r, melStyle, C, D, false, motif), [C, -1, D, -1]),                       // 1 V2
    P(drums(true), A, B, melodyBar(r, melStyle, A, B, true, motif), [A, -1, B, -1]),                         // 2 H1
    P(drums(true), C, D, melodyBar(r, melStyle, C, D, true, motif), [C, -1, D, -1]),                         // 3 H2
    P(drums(true), D, C, melodyBar(r, pick(r, MEL.filter(x => x !== melStyle)), D, C, true, motif.slice().reverse()), [D, -1, C, -1]),   // 4 X1 second hook
    P(drums(true), B, A, melodyBar(r, pick(r, MEL.filter(x => x !== melStyle)), B, A, true, motif.slice().reverse()), [B, -1, A, -1]),   // 5 X2
    P(groove, A, A, Array(16).fill(-1), [A, -1, -1, -1]),                                                    // 6 G groove only
    P({ kick: 'x...............', chat: hat, bass: 'x...............' }, D, D, melodyBar(r, 'anthem', D, D, true, motif), [D, -1, -1, -1]),   // 7 O outro
  ];
  const map = { V1: ['Verse', 0], V2: ['Verse', 1], H1: ['Hook', 2], H2: ['Hook', 3], X1: ['Hook', 4], X2: ['Hook', 5], G: ['Intro', 6], O: ['Outro', 7], B: ['Build', 1, ['kick']], D1: ['Drop', 2] };
  const songBlocks = shape.map(k => map[k]);
  // a breakdown once in the middle: drums out, melody + chords only
  const mid = Math.floor(songBlocks.length * 0.55); songBlocks.splice(mid, 0, ['Verse', 0, ['kick', 'snare', 'clap', 'bass']], ['Verse', 1, ['kick', 'snare', 'clap', 'bass']]);
  const bar = 60 / m.bpm * 4, loops = Math.max(1, Math.min(16, Math.round(150 / (bar * songBlocks.length))));
  return {
    name: g.game + '-' + which, title: m.title, game: g.game, tab: 'music', type: 'beat', style: m.style, bpm: m.bpm, key: m.key, scale: m.scale,
    patterns: pats, song: songBlocks, sound: { melody: m.sound, melVol: 0.85, chdVol: 0.5, octave: m.oct || (melStyle === 'arp' ? 5 : 4) }, loops, master: 'punchy',
    swing: m.swing ?? (['boombap', 'lofi', 'afro'].includes(m.groove) ? 18 : 0),
    // owner Oct 19 "too much bass - lean it up": soft 808, lighter kick, low end trimmed
    tracks: { kick: { vol: 0.5 }, bass: { vol: 0.3 }, snare: { vol: 0.7 }, clap: { vol: 0.62 }, chat: { vol: 0.42 } },
    fx: { highpass: 34, comp: true, reverb: m.verb ?? Math.round(8 + r() * 18), echo: ['anthem', 'stab'].includes(melStyle) ? 0.18 : 0 },
    _how: melStyle + ' melody · ' + bassStyle + ' bass',
  };
}

// each game's own sound effects: layers of Beat Machine library sounds (at = seconds, pitch = semitones, gain 0-1)
const L = (lib, at = 0, pitch = 0, gain = 1, extra = {}) => ({ lib, at, pitch, gain, ...extra });
// a real recorded instrument note (CC0 orchestra): I('brass', 67, 0.3) = trumpet G4 at 0.3 s
const I = (inst, note, at = 0, gain = 1, seconds) => ({ inst, note, at, gain, ...(seconds ? { seconds } : {}) });
const FAN = (inst, notes, step, g = 1) => notes.map((n, i) => I(inst, n, i * step, g, i === notes.length - 1 ? 1.6 : step + 0.05));
const FX = {
  all: [
    ['ui-tap', 'Menu tap', [L('Chip blip', 0, 7, 0.8)]],
    ['ui-back', 'Menu back', [L('Chip blip', 0, -5, 0.8)]],
    ['countdown', 'Countdown 3-2-1-GO', [L('Sine ping', 0, 12), L('Sine ping', 1, 12), L('Sine ping', 2, 12), L('Sine ping', 3, 19), L('Bell', 3, 19, 0.5)]],
    ['win', 'You win', [...FAN('brass', [60, 64, 67, 72], 0.16), ...FAN('horn', [48, 52, 55, 60], 0.16, 0.6), L('Crowd cheer', 0.5, 0, 0.5)]],
    ['lose', 'You lose', [...FAN('brass', [67, 66, 65, 64], 0.32, 0.9), L('Downlifter', 0, 0, 0.3)]],
    ['coin', 'Coin / points', [I('glock', 84, 0, 0.8, 0.4), I('glock', 91, 0.08, 1, 0.9)]],
  ],
  hockey: [
    ['goal-horn', 'Goal horn', [L('Airhorn long', 0, -7), L('Airhorn long', 0, -12, 0.6), L('Crowd cheer', 0.1, 0, 0.9)]],
    ['puck-hit', 'Puck slap shot', [L('Woodblock', 0, 5), L('Snare Crack', 0, 7, 0.6), L('Impact metal', 0, 12, 0.3)]],
    ['buzzer', 'Period buzzer', [L('Siren alarm', 0, -12, 0.8, { seconds: 1.4 })]],
    ['skate', 'Skate swoosh', [L('Whoosh', 0, 9, 0.6), L('Shaker', 0.05, 5, 0.4)]],
    ['board-hit', 'Hit the boards', [L('Boom', 0, 3, 0.8), L('Impact', 0, 5, 0.6)]],
  ],
  baseball: [
    ['bat-crack', 'Bat crack', [L('Clave', 0, 7), L('Snare Crack', 0, 5, 0.7), L('Impact', 0, 12, 0.3)]],
    ['glove-pop', 'Ball in the glove', [L('Kick Tight', 0, 12, 0.8), L('Snap', 0, 0, 0.7)]],
    ['home-run', 'Home run', [L('Crowd cheer', 0), L('Airhorn', 0.3, 0, 0.6), L('Riser short', 0, 0, 0.3)]],
    ['organ-charge', 'CHARGE! fanfare', [...FAN('brass', [67, 72, 76, 79], 0.18).slice(0, 3), I('brass', 79, 0.54, 1, 0.3), I('brass', 76, 0.9, 1, 0.2), I('brass', 79, 1.1, 1, 1.4)]],
    ['strike', 'Strike call', [L('Hey', 0, -3), L('Woodblock', 0, 0, 0.5)]],
  ],
  soccer: [
    ['ball-kick', 'Ball kick', [L('Kick Punch', 0, 12), L('Snap', 0, 0, 0.6)]],
    ['goal', 'GOAL!', [L('Crowd cheer', 0), ...FAN('brass', [62, 66, 69, 74], 0.14, 0.7), L('Shaker', 0, -5, 0.4)]],
    ['whistle', 'Referee whistle', [L('Sine ping', 0, 31, 0.8), L('Sine ping', 0.07, 31, 0.8), L('Sine ping', 0.14, 31, 0.8), L('Sine ping', 0.21, 31, 0.8)]],
    ['net', 'Ball in the net', [L('Shaker', 0, -5), L('Whoosh', 0, 5, 0.5)]],
  ],
  flight: [
    ['jet-pass', 'Jet pass', [L('Whoosh', 0, -7), L('Wind', 0, 0, 0.5, { seconds: 2 })]],
    ['ring', 'Fly through a ring', [...FAN('harp', [72, 76, 79, 84], 0.05, 0.8), I('glock', 91, 0.2, 0.5, 0.8)]],
    ['boost', 'Afterburner', [L('Riser short', 0, 0, 0.8), L('Laser', 0, -12, 0.4)]],
    ['crash', 'Crash', [L('Boom', 0), L('Impact metal', 0.03, -5, 0.6)]],
    ['landing', 'Touch down', [L('Kick Deep', 0, -3, 0.8), L('Shaker', 0.05, -7, 0.4)]],
  ],
  monstertruck: [
    ['big-landing', 'Big landing', [L('Boom', 0), L('Impact metal', 0, -5, 0.7)]],
    ['crush', 'Car crush', [L('Impact metal', 0, -7), L('Scratch fast', 0.05, -12, 0.5)]],
    ['crowd-wow', 'Crowd WOW', [L('Crowd cheer', 0), L('Ooh', 0, 0, 0.7)]],
    ['loop-done', 'Loop done', [L('Riser short', 0, 0, 0.6), L('Impact', 0.6, 0, 0.8), L('Hey', 0.65, 0, 0.6)]],
  ],
  f1: [
    ['start-lights', 'Start lights', [L('Sine ping', 0, 7), L('Sine ping', 1, 7), L('Sine ping', 2, 7), L('Sine ping', 3, 7), L('Sine ping', 4, 7), L('Sine ping', 5, 19, 1, { seconds: 1 })]],
    ['tire-screech', 'Tire screech', [L('Scratch', 0, 12, 0.7), L('Noise texture', 0, 12, 0.3, { seconds: 1 })]],
    ['overtake', 'Overtake', [L('Whoosh', 0, 5)]],
    ['pit-radio', 'Pit radio', [L('Chip blip', 0, 12, 0.6), L('Room tone', 0, 0, 0.3, { seconds: 0.6 })]],
  ],
  trackfield: [
    ['start-gun', 'Starting gun', [L('Snare Crack', 0, 7), L('Impact', 0, 12, 0.6), L('Boom', 0, 12, 0.3)]],
    ['finish', 'Finish line', [L('Crowd cheer', 0), ...FAN('horn', [55, 60, 64], 0.2, 0.7)]],
    ['jump', 'Long jump sand', [L('Shaker', 0, -12), L('Kick Soft', 0, 0, 0.6)]],
    ['record', 'New record', [...FAN('brass', [67, 72, 76, 79], 0.2), L('Choir ah', 0.6, 0, 0.5)]],
  ],
  racer: [
    ['nitro', 'Nitro', [L('Riser short', 0), L('Laser', 0.1, -12, 0.4)]],
    ['shift', 'Gear shift', [L('Snap', 0), L('Kick Tight', 0, 12, 0.6)]],
  ],
  moto: [
    ['start-lights', 'Start lights', [L('Sine ping', 0, 5), L('Sine ping', 1, 5), L('Sine ping', 2, 5), L('Sine ping', 3, 17)]],
    ['lap-bell', 'Last lap bell', [I('glock', 84, 0, 1, 0.5), I('glock', 84, 0.35, 1, 0.5), I('glock', 84, 0.7, 1, 1.2)]],
    ['wheelie', 'Wheelie crowd', [L('Ooh', 0), L('Crowd cheer', 0.1, 0, 0.6)]],
    ['knee-scrape', 'Knee scrape', [L('Scratch fast', 0, 7, 0.5), L('Shaker', 0, 0, 0.3)]],
  ],
};
const out = [];
for (const g of GAMES) { out.push(song(g, bumped(g.game + '-menu', g.menu), 'menu'), song(g, bumped(g.game + '-play', g.play), 'play')); }
for (const [game, list] of Object.entries(FX)) for (const [n, title, layers] of list)
  out.push({ name: game + '-' + n, title: title + ((bumps[game + '-' + n] || 0) ? ' (take ' + (bumps[game + '-' + n] + 1) + ')' : ''), game, tab: 'effect', type: 'mix', layers: bumpFx(game + '-' + n, layers) });
fs.writeFileSync('sounds/recipes/games.json', JSON.stringify(out, null, 1) + '\n');
console.log('wrote sounds/recipes/games.json: ' + out.length + ' recipes');
