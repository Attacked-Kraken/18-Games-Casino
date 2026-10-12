/* GAudio: shared synthesized audio for the whole casino (no samples, no copyrighted music; everything is generated live).
   Buses: master -> music / sfx / ambience. Per-game music loops via a small step sequencer, floor ambience, SFX, dealer voice
   lines (speechSynthesis). Starts only after a user gesture (mobile autoplay rules). Settings persist in localStorage. */
(function () {
  var S = { mute: false, master: .8, music: .5, sfx: .9, voice: true }; try { var j = JSON.parse(localStorage.getItem('gc18_audio') || 'null'); if (j) for (var k in j) S[k] = j[k]; if (localStorage.getItem('gc18_mute') === '1' && !j) S.mute = true; } catch (e) {}
  var ctx = null, master, musicBus, sfxBus, ambBus, comp, started = false, wantMusic = null, wantAmb = false, seq = null, amb = null;
  function save() { try { localStorage.setItem('gc18_audio', JSON.stringify(S)); localStorage.setItem('gc18_mute', S.mute ? '1' : '0'); } catch (e) {} }
  function apply() { if (!ctx) return; var t = ctx.currentTime; master.gain.setTargetAtTime(S.mute ? 0 : S.master, t, .08); musicBus.gain.setTargetAtTime(S.music * .55, t, .1); sfxBus.gain.setTargetAtTime(S.sfx, t, .05); ambBus.gain.setTargetAtTime(S.music * .7, t, .2); }
  function init() { if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; } try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0; master.connect(comp); musicBus = ctx.createGain(); sfxBus = ctx.createGain(); ambBus = ctx.createGain(); [musicBus, sfxBus, ambBus].forEach(function (b) { b.connect(master); }); apply(); return ctx; }
  function unlock() { if (started) return; started = true; init(); if (ctx && ctx.state === 'suspended') ctx.resume(); if (wantMusic) startMusic(wantMusic); if (wantAmb) startAmb(); }
  ['pointerdown', 'keydown', 'touchend'].forEach(function (ev) { addEventListener(ev, unlock, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () { if (!ctx) return; document.hidden ? ctx.suspend() : ctx.resume(); });
  /* ---------- synth voices ---------- */
  function env(g, t, a, d, v) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function osc(bus, f, t, d, type, v, opt) { opt = opt || {}; var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * opt.slide), t + d); if (opt.det) o.detune.value = opt.det;
    var out = g; if (opt.lp) { var fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(opt.lp, t); if (opt.lpEnv) fl.frequency.exponentialRampToValueAtTime(Math.max(80, opt.lp * .2), t + d); g.connect(fl); out = fl; }
    env(g, t, opt.a || .006, d, v); o.connect(g); out.connect(bus); o.start(t); o.stop(t + d + .1); }
  var nbuf = null; function noiseBuf() { if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate); var x = nbuf.getChannelData(0); for (var i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; } return nbuf; }
  function nz(bus, t, d, v, f, type, q) { var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf(); fl.type = type || 'bandpass'; fl.frequency.value = f || 1500; fl.Q.value = q || 1; env(g, t, .002, d, v); s.connect(fl).connect(g).connect(bus); s.start(t, Math.random()); s.stop(t + d + .05); }
  var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  /* ---------- music styles (original patterns) ---------- */
  var STY = {
    lobby: { bpm: 92, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 5, 3, 4], lead: 'triangle', pad: 'sawtooth', drums: 'swing', mel: [0, 2, 4, 2, 6, 4, 2, -1] },
    slots: { bpm: 128, root: 60, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 3], lead: 'square', pad: 'triangle', drums: 'four', mel: [0, 1, 2, 4, 3, 2, 1, 2] },
    candy: { bpm: 136, root: 64, scale: [0, 2, 4, 7, 9], prog: [0, 4, 5, 3], lead: 'square', pad: 'triangle', drums: 'four', mel: [4, 2, 0, 2, 4, 4, 4, -1] },
    cards: { bpm: 84, root: 45, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 3, 6, 4], lead: 'sine', pad: 'triangle', drums: 'brush', mel: [4, -1, 2, 3, 4, -1, 6, 4] },
    roulette: { bpm: 100, root: 48, scale: [0, 1, 4, 5, 7, 8, 10], prog: [0, 3, 0, 4], lead: 'triangle', pad: 'sawtooth', drums: 'tango', mel: [0, 1, 2, 1, 4, 2, 1, 0] },
    dice: { bpm: 112, root: 43, scale: [0, 3, 5, 6, 7, 10], prog: [0, 0, 3, 4], lead: 'sawtooth', pad: 'square', drums: 'shuffle', mel: [0, 1, 2, 3, 2, 1, 0, -1] },
    instant: { bpm: 140, root: 57, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 5, 3, 4], lead: 'square', pad: 'sawtooth', drums: 'four', mel: [0, 2, 4, 6, 4, 2, 7, 4] },
    space: { bpm: 120, root: 45, scale: [0, 2, 3, 7, 8], prog: [0, 4, 3, 1], lead: 'sawtooth', pad: 'sawtooth', drums: 'four', mel: [0, -1, 2, -1, 3, 2, 4, -1] },
    keno: { bpm: 96, root: 55, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 0], lead: 'sine', pad: 'triangle', drums: 'brush', mel: [2, 4, 2, 0, 4, 3, 2, -1] },
    egypt: { bpm: 104, root: 50, scale: [0, 1, 4, 5, 7, 8, 11], prog: [0, 1, 0, 4], lead: 'sawtooth', pad: 'triangle', drums: 'tango', mel: [0, 1, 2, 1, 3, 2, 1, 0] },
    ocean: { bpm: 96, root: 53, scale: [0, 2, 4, 7, 9, 11], prog: [0, 4, 5, 3], lead: 'sine', pad: 'triangle', drums: 'brush', mel: [4, 3, 2, 4, 5, 4, 2, -1] },
    jazz: { bpm: 150, root: 48, scale: [0, 2, 3, 5, 7, 9, 10], prog: [1, 4, 0, 5], lead: 'triangle', pad: 'sine', drums: 'swing', mel: [0, 2, 4, 6, 5, 4, 2, 1] },
    classic: { bpm: 124, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 4], lead: 'square', pad: 'square', drums: 'four', mel: [0, 2, 4, 7, 4, 2, 0, -1] },
    gems: { bpm: 132, root: 62, scale: [0, 2, 4, 7, 9], prog: [0, 5, 3, 4], lead: 'triangle', pad: 'sawtooth', drums: 'four', mel: [4, 2, 4, 6, 7, 6, 4, 2] },
    dragon: { bpm: 108, root: 52, scale: [0, 2, 4, 7, 9], prog: [0, 5, 0, 4], lead: 'sawtooth', pad: 'triangle', drums: 'tango', mel: [4, 3, 2, 0, 2, -1, 3, 4] },
    war: { bpm: 118, root: 41, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 6, 4], lead: 'sawtooth', pad: 'sawtooth', drums: 'march', mel: [0, -1, 0, 2, 3, -1, 2, 0] } };
  var GAME = { lobby: 'lobby', gildedreels: 'slots', candyrush: 'candy', velvet21: 'cards', diamondpoker: 'cards', baccaratnoir: 'cards', holdemroyale: 'cards', rubyroulette: 'roulette', dicepalace: 'dice', plinkodrop: 'instant', bigwheel: 'instant', rocketcrash: 'space', luckykeno: 'keno', steelfront: 'war',
    pharaohsgold: 'egypt', poseidonsfortune: 'ocean', diamondclub: 'jazz', classic777: 'classic', gemburst: 'gems', dragonjackpot: 'dragon' };
  function note(st, deg, oct) { var n = st.scale.length, o = Math.floor(deg / n); return st.root + st.scale[((deg % n) + n) % n] + 12 * (o + (oct || 0)); }
  function drum(kind, step, t) { var b = musicBus;
    var kick = function () { osc(b, 120, t, .22, 'sine', .55, { slide: .3 }); }, snare = function (v) { nz(b, t, .12, v || .22, 1800, 'bandpass', .7); }, hat = function (v) { nz(b, t, .03, v || .07, 8000, 'highpass'); };
    if (kind === 'four') { if (step % 4 === 0) kick(); if (step % 8 === 4) snare(); if (step % 2 === 1) hat(); }
    else if (kind === 'swing') { if (step % 8 === 0) kick(); if (step % 8 === 4) snare(.1); if (step % 4 === 0 || step % 4 === 3) hat(.05); }
    else if (kind === 'brush') { if (step % 8 === 0) kick(); nz(b, t, .09, step % 4 === 2 ? .06 : .025, 3000, 'bandpass', .5); }
    else if (kind === 'tango') { if (step === 0 || step === 3 || step === 6 || step === 8 || step === 11 || step === 14) kick(); if (step % 8 === 4) snare(.15); if (step % 2) hat(.04); }
    else if (kind === 'shuffle') { if (step % 8 === 0 || step % 8 === 6) kick(); if (step % 8 === 4) snare(); if (step % 3 === 0) hat(.06); }
    else if (kind === 'march') { if (step % 4 === 0) kick(); if (step % 2 === 1) snare(.08); if (step % 8 === 7) snare(.2); } }
  function startMusic(id) { wantMusic = id; if (!started || !init()) return; stopMusic(); var st = STY[GAME[id] || id] || STY.lobby, step = 0, bar = 0, next = ctx.currentTime + .1, spb = 60 / st.bpm / 2;
    seq = { st: st, timer: setInterval(function () { while (next < ctx.currentTime + .25) { var t = next, s16 = step % 16, chord = st.prog[bar % st.prog.length];
      if (s16 === 0) { [0, 2, 4].forEach(function (d, i) { osc(musicBus, mtof(note(st, chord + d, 0)), t, spb * 15, st.pad, .045, { a: .08, lp: 1400, det: (i - 1) * 7 }); }); }
      if (s16 % 4 === 0 || (st.drums === 'four' && s16 % 4 === 2)) osc(musicBus, mtof(note(st, chord, -2)), t, spb * 1.6, 'triangle', .22, { lp: 600 });
      if (s16 % 2 === 0) { var m = st.mel[(s16 / 2 + (bar % 2) * 3) % st.mel.length]; if (m >= 0 && (bar % 4 !== 3 || s16 < 8)) osc(musicBus, mtof(note(st, chord + m, 1)), t, spb * 1.7, st.lead, .07, { lp: 3200, lpEnv: 1 }); }
      drum(st.drums, s16, t); next += spb; step++; if (step % 16 === 0) bar++; } }, 60) }; }
  function stopMusic() { if (seq) { clearInterval(seq.timer); seq = null; } }
  function startAmb() { wantAmb = true; if (!started || !init() || amb) return; var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    s.buffer = noiseBuf(); s.loop = true; f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = .6; g.gain.value = .12; l.frequency.value = .15; lg.gain.value = .05; l.connect(lg).connect(g.gain); s.connect(f).connect(g).connect(ambBus); s.start(); l.start();
    amb = { s: s, timer: setInterval(function () { if (document.hidden) return; var t = ctx.currentTime, r = Math.random();
      if (r < .35) { var n = [72, 76, 79, 84, 88][Math.random() * 5 | 0]; for (var k = 0; k < (Math.random() < .3 ? 5 : 2); k++) osc(ambBus, mtof(n + k * 4), t + k * .08, .25, 'sine', .035); }
      else if (r < .45) for (var c = 0; c < 6; c++) nz(ambBus, t + c * .05, .04, .05, 3500); else if (r < .5) nz(ambBus, t, .5, .03, 900, 'lowpass'); }, 700) }; }
  /* ---------- SFX ---------- */
  var FX = {
    click: function (t) { osc(sfxBus, 900, t, .04, 'square', .05); },
    chip: function (t) { nz(sfxBus, t, .05, .3, 2600, 'bandpass', 2); osc(sfxBus, 2300, t, .05, 'sine', .06); nz(sfxBus, t + .04, .04, .18, 3000, 'bandpass', 2); },
    chips: function (t) { for (var i = 0; i < 6; i++) FX.chip(t + i * .045 + Math.random() * .02); },
    card: function (t) { nz(sfxBus, t, .08, .28, 4200, 'highpass'); }, deal: function (t) { FX.card(t); FX.card(t + .12); },
    reelSpin: function (t) { for (var i = 0; i < 14; i++) nz(sfxBus, t + i * .06, .03, .09, 2400 + (i % 3) * 300, 'bandpass', 3); },
    reelStop: function (t) { osc(sfxBus, 160, t, .12, 'sine', .3, { slide: .5 }); nz(sfxBus, t, .04, .2, 1200); },
    dice: function (t) { for (var i = 0; i < 7; i++) { nz(sfxBus, t + i * .07 + Math.random() * .03, .03, .25 - i * .02, 1800 + Math.random() * 1500, 'bandpass', 4); } },
    ball: function (t) { for (var i = 0; i < 40; i++) nz(sfxBus, t + i * (.05 + i * .004), .02, .05, 5000 - i * 60, 'bandpass', 6); for (var j = 0; j < 4; j++) nz(sfxBus, t + 3 + j * .18, .03, .2, 2600, 'bandpass', 5); },
    win: function (t) { [0, 4, 7, 12].forEach(function (s, i) { osc(sfxBus, mtof(72 + s), t + i * .09, .3, 'triangle', .13); }); },
    bigwin: function (t) { [0, 4, 7, 12, 16, 19, 24].forEach(function (s, i) { osc(sfxBus, mtof(67 + s), t + i * .08, .5, 'square', .07, { lp: 4000 }); osc(sfxBus, mtof(55 + s), t + i * .08, .5, 'triangle', .07); }); for (var c = 0; c < 30; c++) osc(sfxBus, 2400 + Math.random() * 1600, t + .3 + c * .05, .1, 'sine', .04); },
    coin: function (t) { osc(sfxBus, 1800, t, .08, 'square', .04); osc(sfxBus, 2700, t + .05, .18, 'square', .04); },
    lose: function (t) { osc(sfxBus, 300, t, .25, 'triangle', .08, { slide: .7 }); },
    whoosh: function (t) { nz(sfxBus, t, .5, .18, 800, 'bandpass', .8); }, boom: function (t) { osc(sfxBus, 80, t, .8, 'sine', .6, { slide: .3 }); nz(sfxBus, t, .9, .5, 400, 'lowpass'); },
    bonus: function (t) { for (var i = 0; i < 10; i++) osc(sfxBus, mtof(64 + [0, 4, 7, 12, 16][i % 5] + (i > 4 ? 12 : 0)), t + i * .07, .25, 'square', .05, { lp: 5000 }); } };
  function sfx(n) { if (!started || !init() || !FX[n]) return; FX[n](ctx.currentTime + .005); }
  /* ---------- dealer voice ---------- */
  var voice = null; function pickVoice() { try { var v = speechSynthesis.getVoices(); voice = v.filter(function (x) { return /en[-_](GB|US)/i.test(x.lang); }).sort(function (a, b) { return (/male|daniel|alex|fred|george/i.test(b.name) ? 1 : 0) - (/male|daniel|alex|fred|george/i.test(a.name) ? 1 : 0); })[0] || v[0] || null; } catch (e) {} }
  try { speechSynthesis.onvoiceschanged = pickVoice; pickVoice(); } catch (e) {}
  var lastSay = 0; function say(text, force) { if (S.mute || !S.voice || !window.speechSynthesis || !started) return; var now = Date.now(); if (!force && now - lastSay < 2500) return; lastSay = now;
    try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); if (voice) u.voice = voice; u.rate = .98; u.pitch = .85; u.volume = Math.min(1, S.master * 1.1); speechSynthesis.speak(u); } catch (e) {} }
  /* ---------- controls UI ---------- */
  var css = '#gaPop{position:fixed;z-index:100002;right:10px;top:calc(56px + env(safe-area-inset-top));width:240px;background:linear-gradient(#221612,#120a08);border:1px solid #b08d57;border-radius:10px;padding:12px 14px;color:#efe2c6;font:13px system-ui;display:none;box-shadow:0 10px 30px rgba(0,0,0,.6)}#gaPop.on{display:block}#gaPop h4{margin:0 0 8px;font:500 16px Georgia;color:#e8d3a0}#gaPop label{display:flex;align-items:center;gap:8px;margin:6px 0}#gaPop label span{width:58px}#gaPop input[type=range]{flex:1;accent-color:#c9a45c}#gaPop button{width:100%;margin-top:8px;background:linear-gradient(#e2c587,#b08d57);border:0;border-radius:6px;padding:8px;font:700 12px system-ui;color:#1a1208;cursor:pointer}';
  function pop() { var p = document.getElementById('gaPop'); if (p) return p; var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); p = document.createElement('div'); p.id = 'gaPop';
    p.innerHTML = '<h4>Sound</h4>' + ['master', 'music', 'sfx'].map(function (k) { return '<label><span>' + { master: 'Volume', music: 'Music', sfx: 'Effects' }[k] + '</span><input type="range" min="0" max="1" step="0.05" data-k="' + k + '"></label>'; }).join('') + '<label><input type="checkbox" data-k="voice"> Dealer voice</label><button type="button" id="gaMute"></button><small style="color:#a8916a;display:block;margin-top:6px">All music is synthesized live · original</small>';
    document.body.appendChild(p); p.querySelectorAll('input').forEach(function (i) { var k = i.dataset.k; if (i.type === 'checkbox') i.checked = !!S[k]; else i.value = S[k]; i.oninput = function () { S[k] = i.type === 'checkbox' ? i.checked : +i.value; if (k !== 'voice' && +i.value > 0) S.mute = false; save(); apply(); sync(); }; });
    p.querySelector('#gaMute').onclick = function () { setMute(!S.mute); }; addEventListener('pointerdown', function (e) { if (p.classList.contains('on') && !p.contains(e.target) && !(e.target.closest && e.target.closest('[data-ga]'))) p.classList.remove('on'); }); sync(); return p; }
  var btns = []; function sync() { var p = document.getElementById('gaPop'); if (p) p.querySelector('#gaMute').textContent = S.mute ? 'Unmute' : 'Mute all'; btns.forEach(function (b) { b.textContent = S.mute ? 'Muted' : 'Sound'; }); }
  function setMute(m) { S.mute = m; save(); unlock(); apply(); if (m && window.speechSynthesis) speechSynthesis.cancel(); sync(); }
  function bindButton(b) { if (!b) return; b.setAttribute('data-ga', '1'); btns.push(b); b.onclick = function (e) { e.stopPropagation(); unlock(); pop().classList.toggle('on'); }; sync(); }
  window.GAudio = { music: function (id) { startMusic(id); }, stopMusic: stopMusic, ambience: startAmb, sfx: sfx, say: say, bindButton: bindButton, setMute: setMute, get muted() { return S.mute; }, get settings() { return S; },
    ctx: function () { return started ? init() : null; }, get sfxBus() { return sfxBus; }, unlock: unlock };
  setTimeout(function () { if (btns.length || !document.body) return; var b = document.createElement('button'); b.type = 'button'; b.style.cssText = 'position:fixed;z-index:99998;right:10px;top:calc(134px + env(safe-area-inset-top));padding:7px 12px;border-radius:16px;border:1px solid #b08d57;background:rgba(12,8,8,.78);color:#e8d3a0;font:600 11px system-ui;letter-spacing:.12em;text-transform:uppercase;cursor:pointer'; document.body.appendChild(b); bindButton(b); }, 1800);
  var pm = location.pathname.match(/([a-z0-9]+)\.html$/i); if (pm && GAME[pm[1]] && pm[1] !== 'index') wantMusic = pm[1];
})();
