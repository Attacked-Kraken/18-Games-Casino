/* kit/apex-music.js - the ONE way every Apex game plays the owner's music pack (sounds/pack/music/<style>/).
   Written Nov 4 2026 after F1's music glitched ("staticy, in and out"). Rules from sounds/pack/MUSIC-README.md, built in so no game can get them wrong:
   - .ogg where the browser plays it (gapless loops), .mp3 only where it can not (the pack's mp3 has a small gap at the loop point);
   - all loops of a style are decoded first, then STARTED TOGETHER at one context time and never stopped - only their volumes change (layers started
     one by one sit out of step = the glitch; start/stop clicks);
   - the layer volumes always add up to about one track (each file is -16 LUFS) and a limiter sits on the bus, so nothing clips;
   - real AudioBuffers on the game's own AudioContext, never hidden <audio> elements (LESSONS: those garble).
   Use:  const mus = ApexMusic.attach(audioCtx, destinationGainNode, {style:'sports_arena'});   (style: sports_arena has menu + low/mid/high; chill_lofi + puzzle have menu + mid)
         mus.setMode('menu' | 'play' | 'off');  mus.setIntensity(0..1) (play only: low -> mid -> high);  mus.sting(true|false) = victory / game-over once.
   Mute = silence the destination node you passed; the kit never owns the mute. Nothing is touched until the context is 'running'. */
(function (root) {
  'use strict';
  const BASE = 'sounds/pack/music/';
  const LAYERS = { sports_arena: { menu: 'menu', low: 'gameplay_low', mid: 'gameplay_mid', high: 'gameplay_high' }, chill_lofi: { menu: 'menu', mid: 'gameplay_mid' }, puzzle: { menu: 'menu', mid: 'gameplay_mid' } };
  function ext() { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; } catch (e) { return 'mp3'; } }
  function attach(ctx, dest, opts) {
    opts = opts || {}; const style = LAYERS[opts.style] ? opts.style : 'sports_arena', names = LAYERS[style], ex = opts.ext || ext(), base = opts.base || BASE;
    const m = { style, ext: ex, mode: 'off', intensity: 0, bufs: {}, started: false, loading: false, gains: null, stings: {} };
    function file(n) { return base + style + '/' + style + '_' + n + '.' + ex; }
    function load(n) { return fetch(file(n)).then((r) => { if (!r.ok) throw new Error(n); return r.arrayBuffer(); }).then((ab) => new Promise((ok, no) => ctx.decodeAudioData(ab, ok, no))); }
    function build() {
      if (m.loading) return; m.loading = true;
      const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -8; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
      m.bus = ctx.createGain(); m.bus.gain.value = opts.level || 0.55; m.bus.connect(lim); lim.connect(dest); m.lim = lim; m.gains = {};
      for (const k in names) { const g = ctx.createGain(); g.gain.value = 0; g.connect(m.bus); m.gains[k] = g; load(names[k]).then((b) => { m.bufs[k] = b; tryStart(); }).catch(() => {}); }
    }
    function tryStart() {
      if (m.started || Object.keys(m.bufs).length < Object.keys(names).length) return; m.started = true; const t0 = ctx.currentTime + 0.1;
      for (const k in m.bufs) { const s = ctx.createBufferSource(); s.buffer = m.bufs[k]; s.loop = true; s.connect(m.gains[k]); s.start(t0); }
    }
    function targets() {
      const tg = {}; for (const k in names) tg[k] = 0;
      if (m.mode === 'menu') tg.menu = 1;
      else if (m.mode === 'play') {
        const x = Math.max(0, Math.min(1, isFinite(m.intensity) ? m.intensity : 0));
        if (names.high) { const mid = x < 0.35 ? x / 0.35 : x < 0.65 ? 1 : x < 0.85 ? 1 - (x - 0.65) / 0.2 : 0, high = x < 0.65 ? 0 : Math.min(1, (x - 0.65) / 0.2); tg.mid = Math.min(1, mid); tg.high = high; tg.low = Math.max(0, 1 - tg.mid - tg.high); }
        else tg.mid = 1;
      }
      return tg;
    }
    function tick() {
      try {
        if (!ctx || ctx.state !== 'running') return; if (!m.gains) build();
        const tg = targets(), t = ctx.currentTime;
        for (const k in tg) m.gains[k].gain.setTargetAtTime(m.started ? tg[k] : 0, t, 0.4);
        root.__apexMusic = m.report();
      } catch (e) {}
    }
    m.setMode = function (mode) { m.mode = mode === 'menu' || mode === 'play' ? mode : 'off'; tick(); };
    m.setIntensity = function (x) { m.intensity = x; };
    m.sting = function (win) {
      try { if (!ctx || ctx.state !== 'running') return; const n = win ? 'victory_sting' : 'gameover_sting';
        const go = (b) => { const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = 0.8; s.connect(g); g.connect(dest); s.start(); };
        if (m.stings[n]) go(m.stings[n]); else load(n).then((b) => { m.stings[n] = b; go(b); }).catch(() => {}); } catch (e) {}
    };
    m.report = function () { const tg = targets(); return { style, ext: ex, mode: m.mode, started: m.started, loaded: Object.keys(m.bufs), audible: m.started ? Object.keys(tg).filter((k) => tg[k] > 0.02) : [] }; };
    m.timer = setInterval(tick, 250);
    return m;
  }
  /* follow(): for a game that already has its own music object (procedural synth). cfg = {ctx:()=>AudioContext, dest:()=>gain node, mode:()=>'menu'|'play'|'off',
     intensity:()=>0..1 (optional), style}. Returns {playing()} - the game's old synth scheduler returns early while playing() is true, so the pack replaces it
     the moment it is loaded and the synth stays as the fallback if a phone cannot load the files. */
  function follow(cfg) {
    const f = { m: null, playing() { return !!(f.m && f.m.started); } };
    setInterval(() => { try {
      const c = cfg.ctx && cfg.ctx(), d = cfg.dest && cfg.dest(); if (!c || !d || c.state !== 'running') return;
      if (!f.m) f.m = attach(c, d, { style: cfg.style || 'sports_arena' });
      f.m.setIntensity(cfg.intensity ? cfg.intensity() : 0.5); f.m.setMode(cfg.mode());
    } catch (e) {} }, 250);
    return f;
  }
  root.ApexMusic = { attach, follow, ext, LAYERS };
})(typeof window !== 'undefined' ? window : globalThis);
