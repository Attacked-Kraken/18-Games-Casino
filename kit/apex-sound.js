/* kit/apex-sound.js — ApexSound: shared WebAudio sound pack for Apex sports games.
   JOB J55 SOUND PASS (owner, 2026-10-18). Fully offline: every sound is synthesized
   in code, no audio files. One-line use:
     ApexSound.play('puckSlap')          // sport hit / UI sound
     ApexSound.crowd('roar', 0.8)        // murmur | roar | groan | chant (+intensity 0..1)
     ApexSound.music('menu')             // 'menu' | 'game' | 'stop'
     ApexSound.setMuted(true)            // one mute, game only
   Works standalone or alongside kit/apex-kit.js (uses its own buses; follows the
   house 'apex_muted' flag when the kit is present).
   In a module: import { ApexSound } from './kit/apex-sound.js';
   As a classic script: window.ApexSound. */
(function (G) {
  'use strict';
  const MUTE_KEY = 'apex_muted';

  const S = {
    ctx: null, master: null, sfx: null, music: null, crowd: null,
    muted: false, volume: 0.9, musicVol: 0.5,
    crowdNodes: null, musicTimer: null, musicStep: 0, musicBar: 0, musicNext: 0,
    revOsc: null, revGain: null,
  };

  function ctx() {
    if (!S.ctx) {
      const AC = G.AudioContext || G.webkitAudioContext;
      if (!AC) return null;
      S.ctx = new AC();
      S.master = S.ctx.createGain(); S.master.gain.value = S.muted ? 0 : S.volume;
      S.master.connect(S.ctx.destination);
      S.sfx = S.ctx.createGain(); S.sfx.gain.value = 1; S.sfx.connect(S.master);
      S.music = S.ctx.createGain(); S.music.gain.value = S.musicVol * 0.6; S.music.connect(S.master);
      S.crowd = S.ctx.createGain(); S.crowd.gain.value = 0.5; S.crowd.connect(S.master);
      try { S.muted = localStorage.getItem(MUTE_KEY) === '1'; applyMute(); } catch (e) {}
    }
    if (S.ctx.state === 'suspended') S.ctx.resume().catch(() => {});
    return S.ctx;
  }
  function applyMute() {
    if (!S.ctx) return;
    S.master.gain.setTargetAtTime(S.muted ? 0 : S.volume, S.ctx.currentTime, 0.02);
    try { localStorage.setItem(MUTE_KEY, S.muted ? '1' : '0'); } catch (e) {}
  }
  // ---- tiny synth helpers ----
  function tone(bus, freq, t, dur, type, vol, slideTo) {
    const c = S.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  let _noiseBuf = null;
  function noiseBuf() {
    if (_noiseBuf) return _noiseBuf;
    const c = S.ctx, b = c.createBuffer(1, c.sampleRate * 1.2, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (_noiseBuf = b);
  }
  function noise(bus, t, dur, vol, freq, type, q) {
    const c = S.ctx, src = c.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t); src.stop(t + dur + 0.05);
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  // ---- sport hits & UI (one-shot) ----
  const HITS = {
    tap: (t, b) => tone(b, 880, t, 0.06, 'square', 0.05),
    uiMove: (t, b) => tone(b, 660, t, 0.05, 'sine', 0.06),
    uiBack: (t, b) => tone(b, 440, t, 0.07, 'sine', 0.06),
    // hockey
    puckSlap: (t, b) => { tone(b, 180, t, 0.12, 'sine', 0.5, 70); noise(b, t, 0.06, 0.35, 2600); },
    stickClick: (t, b) => { noise(b, t, 0.04, 0.25, 3200, 'highpass'); tone(b, 900, t, 0.03, 'square', 0.08); },
    skateScrape: (t, b) => noise(b, t, 0.28, 0.12, 5200, 'highpass'),
    goalHorn: (t, b) => { [196, 233, 262].forEach(f => tone(b, f, t, 1.1, 'sawtooth', 0.09)); noise(b, t, 0.9, 0.05, 500, 'lowpass'); },
    // baseball / bat
    batCrack: (t, b) => { tone(b, 220, t, 0.09, 'square', 0.4, 90); noise(b, t, 0.05, 0.4, 3800); },
    glovePop: (t, b) => { tone(b, 300, t, 0.07, 'sine', 0.3, 140); noise(b, t, 0.04, 0.2, 1500); },
    // soccer / basketball
    ballKick: (t, b) => { tone(b, 140, t, 0.14, 'sine', 0.5, 60); noise(b, t, 0.06, 0.25, 900); },
    ballBounce: (t, b) => tone(b, 220, t, 0.08, 'sine', 0.25, 110),
    whistle: (t, b, d) => { const dd = d || 0.4; tone(b, 2500, t, dd, 'sine', 0.1); tone(b, 2580, t, dd, 'sine', 0.07); },
    whistle2: (t, b) => { tone(b, 2500, t, 0.16, 'sine', 0.1); tone(b, 2500, t + 0.2, 0.28, 'sine', 0.1); },
    // racing
    engineRev: (t, b) => { tone(b, 70, t, 0.5, 'sawtooth', 0.16, 220); noise(b, t, 0.4, 0.06, 400, 'lowpass'); },
    skid: (t, b) => noise(b, t, 0.35, 0.1, 2800, 'bandpass', 3),
    crash: (t, b) => { noise(b, t, 0.4, 0.4, 700, 'lowpass'); tone(b, 90, t, 0.3, 'sine', 0.4, 40); },
    // generic
    score: (t, b) => [0, 4, 7, 12].forEach((s, i) => tone(b, mtof(72 + s), t + i * 0.09, 0.3, 'triangle', 0.12)),
    buzzer: (t, b) => tone(b, 175, t, 0.5, 'sawtooth', 0.14),
    error: (t, b) => tone(b, 200, t, 0.22, 'triangle', 0.1, 140),
    pop: (t, b) => tone(b, 700, t, 0.07, 'sine', 0.18, 1400),
    ding: (t, b) => { tone(b, 1320, t, 0.4, 'sine', 0.12); tone(b, 1980, t, 0.3, 'sine', 0.05); },
    swoosh: (t, b) => noise(b, t, 0.22, 0.12, 1800, 'bandpass', 2),
  };

  // ---- crowd bed: murmur loop + reactive one-shots ----
  function ensureCrowd() {
    if (S.crowdNodes || !ctx()) return;
    const c = S.ctx;
    const src = c.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.4;
    const g = c.createGain(); g.gain.value = 0.05; // idle murmur
    const lfo = c.createOscillator(); lfo.frequency.value = 0.13;
    const lfoG = c.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(f); f.connect(g); g.connect(S.crowd);
    src.start(); lfo.start();
    S.crowdNodes = { src, f, g, lfo };
  }
  function crowd(kind, intensity) {
    if (!ctx()) return false;
    ensureCrowd();
    const t = S.ctx.currentTime + 0.005, b = S.crowd, k = Math.max(0, Math.min(1, intensity == null ? 0.7 : intensity));
    if (kind === 'murmur') {
      S.crowdNodes.g.gain.setTargetAtTime(0.04 + k * 0.05, t, 0.4);
      return true;
    }
    if (kind === 'roar') { // goal / big play: swell then settle
      const g = S.crowdNodes.g.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0.05 + k * 0.5, t + 0.25);
      g.exponentialRampToValueAtTime(0.07, t + 2.2);
      noise(b, t, 1.6, 0.12 + k * 0.2, 1000);
      return true;
    }
    if (kind === 'groan') { // near miss / bad call
      const g = S.crowdNodes.g.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0.05 + k * 0.3, t + 0.2);
      g.exponentialRampToValueAtTime(0.05, t + 1.4);
      tone(b, 220, t, 0.9, 'sawtooth', 0.03 + k * 0.04, 130);
      return true;
    }
    if (kind === 'chant') { // rhythmic "de-fense" pulse
      for (let i = 0; i < 4; i++) {
        tone(b, 196, t + i * 0.42, 0.22, 'sawtooth', 0.05);
        tone(b, 147, t + i * 0.42, 0.22, 'sawtooth', 0.04);
        noise(b, t + i * 0.42, 0.18, 0.08, 900);
      }
      return true;
    }
    if (kind === 'ooh') { // gasp
      noise(b, t, 0.7, 0.1 + k * 0.12, 1600, 'bandpass', 1.5);
      return true;
    }
    return false;
  }

  // ---- music: short menu tune, calm in-game loop (all original, in code) ----
  const TUNES = {
    menu: { bpm: 84, root: 57, scale: [0, 2, 4, 7, 9], chords: [0, 5, 3, 4], mel: [4, -1, 2, 3, 4, -1, 2, 1], drums: false, vol: 0.8 },
    game: { bpm: 104, root: 55, scale: [0, 2, 4, 7, 9], chords: [0, 0, 5, 4], mel: [0, -1, 2, 4, 2, -1, 0, -1], drums: true, soft: true, vol: 0.55 },
  };
  function music(name) {
    stopMusic();
    if (!name || name === 'stop') return true;
    const st = TUNES[name];
    if (!st || !ctx()) return false;
    const spb = 60 / st.bpm / 2;
    const note = (deg, oct) => { const n = st.scale.length, o = Math.floor(deg / n); return st.root + st.scale[((deg % n) + n) % n] + 12 * (o + oct); };
    S.musicStep = 0; S.musicBar = 0; S.musicNext = S.ctx.currentTime + 0.1;
    const b = S.music, vv = st.vol;
    S.musicTimer = setInterval(() => {
      if (!S.ctx || S.ctx.state !== 'running') return;
      while (S.musicNext < S.ctx.currentTime + 0.3) {
        const t = S.musicNext, s = S.musicStep % 16, ch = st.chords[S.musicBar % st.chords.length];
        if (s === 0) [0, 2, 4].forEach(d => tone(b, mtof(note(ch + d, 0)), t, spb * 14, 'triangle', 0.03 * vv));
        if (s % 4 === 0) tone(b, mtof(note(ch, -2)), t, spb * 1.8, 'sine', 0.16 * vv);
        if (s % 2 === 0) { const m = st.mel[(s / 2) % st.mel.length]; if (m >= 0) tone(b, mtof(note(ch + m, 1)), t, spb * 1.6, 'sine', 0.055 * vv); }
        if (st.drums) {
          if (s % 4 === 0) tone(b, 95, t, 0.18, 'sine', st.soft ? 0.18 : 0.4, 45);
          if (s % 8 === 4) noise(b, t, 0.1, st.soft ? 0.06 : 0.14, 1800);
          if (s % 2 === 1) noise(b, t, 0.03, st.soft ? 0.02 : 0.05, 8000, 'highpass');
        }
        S.musicNext += spb; S.musicStep++;
        if (S.musicStep % 16 === 0) S.musicBar++;
      }
    }, 70);
    return true;
  }
  function stopMusic() {
    if (S.musicTimer) { clearInterval(S.musicTimer); S.musicTimer = null; }
  }
  // continuous engine hum tied to throttle 0..1 (racing games): call every frame or on change
  function engine(thr) {
    if (!ctx()) return;
    const t = S.ctx.currentTime;
    if (!S.revOsc) {
      const o = S.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60;
      const f = S.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
      const g = S.ctx.createGain(); g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(S.sfx); o.start();
      S.revOsc = o; S.revGain = g;
    }
    const k = Math.max(0, Math.min(1, thr));
    S.revOsc.frequency.setTargetAtTime(55 + k * 165, t, 0.06);
    S.revGain.gain.setTargetAtTime(k * 0.14, t, 0.08);
  }

  const ApexSound = {
    /* unlock on first user gesture; safe to call any time */
    unlock() { ctx(); return !!S.ctx; },
    /* one-line effects: ApexSound.play('puckSlap') — also accepts (t,bus,ctx)=>{} fns */
    play(name, when) {
      if (!ctx() || S.ctx.state !== 'running') return false;
      const t = when || S.ctx.currentTime + 0.005;
      const f = typeof name === 'function' ? name : HITS[name];
      if (!f) return false;
      f(t, S.sfx, S.ctx);
      return true;
    },
    /* crowd bed + reactions: 'murmur' | 'roar' | 'groan' | 'chant' | 'ooh' */
    crowd,
    /* music: 'menu' | 'game' | 'stop' */
    music,
    /* engine hum 0..1 */
    engine,
    /* one mute for the game */
    setMuted(m) { S.muted = !!m; if (S.ctx) applyMute(); else { try { localStorage.setItem(MUTE_KEY, S.muted ? '1' : '0'); } catch (e) {} } },
    toggleMute() { ApexSound.setMuted(!S.muted); return S.muted; },
    get muted() { return S.muted; },
    setVolume(v) { S.volume = Math.max(0, Math.min(1, +v || 0)); if (S.ctx) applyMute(); },
    setMusicVolume(v) { S.musicVol = Math.max(0, Math.min(1, +v || 0)); if (S.ctx) S.music.gain.setTargetAtTime(S.musicVol * 0.6, S.ctx.currentTime, 0.05); },
    /* connect an external source (e.g. kit buses) — optional */
    get ctx() { return S.ctx; },
    get sfxBus() { ctx(); return S.sfx; },
    get musicBus() { ctx(); return S.music; },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = { ApexSound };
  G.ApexSound = ApexSound;
})(typeof window !== 'undefined' ? window : globalThis);
