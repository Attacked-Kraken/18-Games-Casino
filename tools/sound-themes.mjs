// Writes sounds/recipes/games.json: a MENU song + a PLAY song for every game (full length, ~2.5 min, its own style, key,
// chords and melody) + that game's own sound effects. Owner Oct 19 2026: "different music for each app, for its specific
// game sounds and effects", "the beat has too much bass in it, lean it up".
// Run: node tools/sound-themes.mjs   (then push - the sound robot makes the files; listen on sounds/lab.html)
// To change one song: edit its line in GAMES below (style, bpm, key, scale, chords, sound, seed) and run this again.
import fs from 'fs';

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
// a melody bar over 2 chords (steps 0-7 and 8-15). hook = busier and higher. -1 = hold/rest.
function melodyBar(r, c1, c2, hook, prev) {
  const rhythm = hook ? [[0, 2, 3, 6, 8, 10, 11, 14], [0, 3, 6, 8, 10, 12, 14], [0, 2, 4, 6, 8, 11, 14]] : [[0, 3, 6, 10, 12], [0, 4, 6, 8, 12], [0, 3, 8, 11, 14]];
  const hits = rhythm[Math.floor(r() * rhythm.length)], out = Array(16).fill(-1), up = hook ? 7 : 0;
  let last = prev ?? (c1 + up);
  for (const s of hits) {
    const c = s < 8 ? c1 : c2, tones = [c - 3, c, c + 2, c + 4, c + 7].map(t => t + up).filter(t => t !== last && t >= 0 && t <= 13);
    tones.sort((a, b) => Math.abs(a - last) - Math.abs(b - last));   // move by small steps, never sit on one note
    const pick = r() < 0.6 ? tones[0] : tones[Math.min(tones.length - 1, 1 + Math.floor(r() * 2))];
    out[s] = Math.max(0, Math.min(14, pick)); last = out[s];
  }
  return out;
}
function song(g, m, which) {
  const r = rng(m.seed), sc = SCALES[m.scale], gr = GROOVE[m.groove], ch = m.chords;
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let kOff = NOTES.indexOf(m.key) - 9; if (kOff < -6) kOff += 12; if (kOff > 5) kOff -= 12;   // the 808 is tuned from A
  const root = d => { let v = sc[((d % 7) + 7) % 7] + kOff; while (v > 7) v -= 12; while (v < -6) v += 12; return v; };   // in key, low
  const bassOf = (a, b) => Array.from({ length: 16 }, (_, s) => root(s < 8 ? a : b));
  const lean = (rows, full) => { const o = {}; for (const [k, v] of Object.entries(rows)) {
    if (!full && (k === 'ohat' || k === 'tom')) continue;            // verses leave room
    o[k] = v; } return o; };
  const v1 = melodyBar(r, ch[0], ch[1], false), v2 = melodyBar(r, ch[2], ch[3], false, v1.filter(x => x >= 0).pop());
  const h1 = melodyBar(r, ch[0], ch[1], true), h2 = h1.slice(0, 12).concat(melodyBar(r, ch[2], ch[3], true, h1[10]).slice(12));   // the hook repeats, new ending
  for (let s = 0; s < 12; s++) if (h2[s] >= 0) { let v = h2[s] + (ch[2] - ch[0]); while (v > 13) v -= 7; while (v < 0) v += 7; h2[s] = v; }   // ...moved to the 2nd chord pair
  const pats = [
    { drums: lean(gr, false), clear: true, bass: bassOf(ch[0], ch[1]), melody: v1, chords: [ch[0], -1, ch[1], -1] },
    { drums: lean(gr, false), clear: true, bass: bassOf(ch[2], ch[3]), melody: v2, chords: [ch[2], -1, ch[3], -1] },
    { drums: lean(gr, true), clear: true, bass: bassOf(ch[0], ch[1]), melody: h1, chords: [ch[0], -1, ch[1], -1] },
    { drums: lean(gr, true), clear: true, bass: bassOf(ch[2], ch[3]), melody: h2, chords: [ch[2], -1, ch[3], -1] },
  ];
  // owner Oct 19 "longer songs with real changes": a 40-bar arrangement - sections switch instruments off and on
  const V = (n, off) => Array.from({ length: n }, (_, i) => ['Verse', i % 2, off]), H = (n, first) => Array.from({ length: n }, (_, i) => [i === 0 && first ? 'Drop' : 'Hook', 2 + i % 2]);
  const songBlocks = [['Intro', 0, ['kick', 'bass', 'melody']], ['Intro', 1, ['kick', 'bass', 'melody']], ['Intro', 0, ['melody']], ['Intro', 1, ['melody']],
    ...V(8), ['Build', 1, ['kick']], ...H(8, true),
    ...V(4, ['kick', 'bass', 'snare', 'clap']), ...V(4), ['Build', 1, ['kick']], ...H(8, true), ['Outro', 2, ['kick', 'melody']], ['Outro', 3, ['kick', 'bass', 'melody']]];
  const bar = 60 / m.bpm * 4, loops = Math.max(1, Math.min(16, Math.round(150 / (bar * songBlocks.length))));
  return {
    name: g.game + '-' + which, title: m.title, game: g.game, tab: 'music', type: 'beat', style: m.style, bpm: m.bpm, key: m.key, scale: m.scale,
    patterns: pats, song: songBlocks, sound: { melody: m.sound, melVol: 0.85, chdVol: 0.55 }, loops, master: 'punchy',
    // owner Oct 19 "too much bass - lean it up": soft 808, lighter kick, low end trimmed
    tracks: { kick: { vol: 0.5 }, bass: { vol: 0.3 }, snare: { vol: 0.7 }, clap: { vol: 0.62 } },
    fx: { highpass: 34, comp: true }   // highpass 34 = cut below ~80 Hz (the mud),
  };
}
// each game's own sound effects: layers of Beat Machine library sounds (at = seconds, pitch = semitones, gain 0-1)
const L = (lib, at = 0, pitch = 0, gain = 1, extra = {}) => ({ lib, at, pitch, gain, ...extra });
const FX = {
  all: [
    ['ui-tap', 'Menu tap', [L('Chip blip', 0, 7, 0.8)]],
    ['ui-back', 'Menu back', [L('Chip blip', 0, -5, 0.8)]],
    ['countdown', 'Countdown 3-2-1-GO', [L('Sine ping', 0, 12), L('Sine ping', 1, 12), L('Sine ping', 2, 12), L('Sine ping', 3, 19), L('Bell', 3, 19, 0.5)]],
    ['win', 'You win', [L('Airhorn', 0), L('Crowd cheer', 0.05, 0, 0.8), L('Yeah', 0.25, 0, 0.7)]],
    ['lose', 'You lose', [L('Downlifter', 0, 0, 0.8), L('Sweep down', 0.2, -5, 0.5)]],
    ['coin', 'Coin / points', [L('Bell', 0, 12, 0.7), L('Bell', 0.07, 19, 0.8)]],
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
    ['organ-charge', 'Organ CHARGE!', [L('Organ', 0, 0), L('Organ', 0.18, 5), L('Organ', 0.36, 9), L('Organ', 0.54, 12), L('Organ', 0.9, 9), L('Organ', 1.08, 12, 1, { seconds: 2.2 })]],
    ['strike', 'Strike call', [L('Hey', 0, -3), L('Woodblock', 0, 0, 0.5)]],
  ],
  soccer: [
    ['ball-kick', 'Ball kick', [L('Kick Punch', 0, 12), L('Snap', 0, 0, 0.6)]],
    ['goal', 'GOAL!', [L('Crowd cheer', 0), L('Airhorn long', 0.2, 0, 0.6), L('Oh', 0, 0, 0.5)]],
    ['whistle', 'Referee whistle', [L('Sine ping', 0, 31, 0.8), L('Sine ping', 0.07, 31, 0.8), L('Sine ping', 0.14, 31, 0.8), L('Sine ping', 0.21, 31, 0.8)]],
    ['net', 'Ball in the net', [L('Shaker', 0, -5), L('Whoosh', 0, 5, 0.5)]],
  ],
  flight: [
    ['jet-pass', 'Jet pass', [L('Whoosh', 0, -7), L('Wind', 0, 0, 0.5, { seconds: 2 })]],
    ['ring', 'Fly through a ring', [L('Bell', 0, 12, 0.8), L('Glass', 0.05, 19, 0.6)]],
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
    ['finish', 'Finish line', [L('Crowd cheer', 0), L('Bell', 0, 12, 0.5)]],
    ['jump', 'Long jump sand', [L('Shaker', 0, -12), L('Kick Soft', 0, 0, 0.6)]],
    ['record', 'New record', [L('Airhorn', 0, 0, 0.7), L('Choir ah', 0, 0, 0.6)]],
  ],
  racer: [
    ['nitro', 'Nitro', [L('Riser short', 0), L('Laser', 0.1, -12, 0.4)]],
    ['shift', 'Gear shift', [L('Snap', 0), L('Kick Tight', 0, 12, 0.6)]],
  ],
  moto: [
    ['start-lights', 'Start lights', [L('Sine ping', 0, 5), L('Sine ping', 1, 5), L('Sine ping', 2, 5), L('Sine ping', 3, 17)]],
    ['lap-bell', 'Last lap bell', [L('Bell', 0, 0), L('Triangle', 0, 12, 0.5), L('Bell', 0.4, 0)]],
    ['wheelie', 'Wheelie crowd', [L('Ooh', 0), L('Crowd cheer', 0.1, 0, 0.6)]],
    ['knee-scrape', 'Knee scrape', [L('Scratch fast', 0, 7, 0.5), L('Shaker', 0, 0, 0.3)]],
  ],
};
const out = [];
for (const g of GAMES) { out.push(song(g, g.menu, 'menu'), song(g, g.play, 'play')); }
for (const [game, list] of Object.entries(FX)) for (const [n, title, layers] of list)
  out.push({ name: game + '-' + n, title, game, tab: 'effect', type: 'mix', layers });
fs.writeFileSync('sounds/recipes/games.json', JSON.stringify(out, null, 1) + '\n');
console.log('wrote sounds/recipes/games.json: ' + out.length + ' recipes');
