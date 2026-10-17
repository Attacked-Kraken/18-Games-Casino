/* apex-kit.js - the shared game kit for the Apex phone 3D sports games (Game Development titles only).
   One place for: audio + mute, pause/settings menu, saves, credits, touch controls, chase camera, performance,
   landscape sizing and the robot's window.__test hook. Fix it here and every game on the kit gets the fix.

   ES module:  import ApexKit from './kit/apex-kit.js';   (also sets window.ApexKit)
   No network, no outside URLs, no dependencies. three.js is passed in by the game, never imported here.
   How to use it: kit/README.md.  Proof it works: kit/demo.html.

   PORTRAIT RULE (STORE-READY.md): this file never injects the sideways (rotate) CSS. That block lives in each game
   file. The kit only SIZES to the landscape box, remaps touches when the game's stage is rotated, and asks for
   fullscreen + a landscape lock on the first tap. Never load this file on index.html, sports.html or any page that is not a game. */

const VERSION = '1.0.0';
const W = window, D = document;
const TOUCH = ('ontouchstart' in W) || navigator.maxTouchPoints > 0;
const GLOBAL_MUTE = 'apex_muted';               // house convention shared by the apex sports games ('1' / '0')
const Q_CAP = { low: 1, medium: 1.25, high: TOUCH ? 1.5 : 2 };   // STORE-READY: touch devices <= 1.5
const GFX_MAP = { low: 'low', medium: 'med', high: 'high' };    // apex-gfx.js quality names

let cfg = null, booted = false, started = false, paused = false, ui = null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = (tag, attrs, html) => { const e = D.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const call = (fn, ...a) => { if (typeof fn === 'function') { try { return fn(...a); } catch (e) { console.error('[ApexKit]', e); } } };
/* the game's stage is presented rotated (the game file's portrait CSS turned the body 90 degrees) */
function rotated() { try { return innerHeight > innerWidth && getComputedStyle(D.body).transform !== 'none'; } catch (e) { return false; } }

/* ------------------------------------------------------------------ SAVE */
/* Every key lives under  apexkit:<game id>:<key>  as {v: version, d: data}. Other games' keys are never read or written.
   A game's OLD keys (from before the kit) stay where they are - keep reading them in the game (FAMILY-RULES: keep saves). */
const save = {
  version: 1,
  _k(key) { if (!cfg) throw new Error('ApexKit.boot() first'); return 'apexkit:' + cfg.id + ':' + key; },
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(save._k(key)); if (raw == null) return fallback;
      const o = JSON.parse(raw); if (!o || typeof o !== 'object' || !('d' in o)) return fallback;
      if (o.v !== save.version) { if (cfg.migrate) { const m = call(cfg.migrate, key, o.d, o.v); if (m !== undefined) { save.set(key, m); return m; } } return fallback; }
      return o.d;
    } catch (e) { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(save._k(key), JSON.stringify({ v: save.version, d: value })); return true; } catch (e) { return false; } },
  remove(key) { try { localStorage.removeItem(save._k(key)); } catch (e) {} },
  keys() { const out = [], p = 'apexkit:' + cfg.id + ':'; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(p)) out.push(k.slice(p.length)); } } catch (e) {} return out; },
};

/* ------------------------------------------------------------------ AUDIO */
/* Procedural WebAudio only (ASSET-LAW Part II): master -> music / sfx buses. Unlocks on the first touch or key. */
const A = { ctx: null, master: null, music: null, sfx: null, muted: false, musicVol: 0.6, sfxVol: 0.9, seq: null, want: null };
function audioInit() {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); return A.ctx; }
  try { A.ctx = new (W.AudioContext || W.webkitAudioContext)(); } catch (e) { return null; }
  const c = A.ctx, comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4; comp.connect(c.destination);
  A.master = c.createGain(); A.master.connect(comp); A.music = c.createGain(); A.sfx = c.createGain(); A.music.connect(A.master); A.sfx.connect(A.master);
  audioApply(true); if (A.want) audio.music(A.want); return c;
}
function audioApply(now) {
  if (!A.ctx) return; const t = A.ctx.currentTime, k = now ? 0.001 : 0.06;
  A.master.gain.setTargetAtTime(A.muted ? 0 : 0.9, t, k); A.music.gain.setTargetAtTime(A.musicVol * 0.5, t, k); A.sfx.gain.setTargetAtTime(A.sfxVol, t, k);
}
function audioPersist() {
  if (cfg) save.set('kit.audio', { muted: A.muted, music: A.musicVol, sfx: A.sfxVol });
  try { localStorage.setItem(GLOBAL_MUTE, A.muted ? '1' : '0'); } catch (e) {}
  try { if (W.GAudio && W.GAudio.muted !== A.muted) W.GAudio.setMute(A.muted); } catch (e) {}   // shared audio.js (GAudio), if a page has it
}
function unlock() { audioInit(); }
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function tone(bus, f, t, d, type, v, slide) {
  const c = A.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + 0.05);
}
let noiseBuf = null;
function noise(bus, t, d, v, f, type) {
  const c = A.ctx; if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const x = noiseBuf.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf; fl.type = type || 'bandpass'; fl.frequency.value = f || 1500;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + d + 0.05);
}
const SFX = {
  tap: (t, b) => tone(b, 880, t, 0.06, 'square', 0.06),
  hit: (t, b) => { tone(b, 160, t, 0.18, 'sine', 0.5, 0.4); noise(b, t, 0.08, 0.3, 1800); },
  score: (t, b) => [0, 4, 7, 12].forEach((s, i) => tone(b, mtof(72 + s), t + i * 0.08, 0.28, 'triangle', 0.14)),
  whistle: (t, b) => { tone(b, 2600, t, 0.35, 'sine', 0.12); tone(b, 2680, t, 0.35, 'sine', 0.08); },
  horn: (t, b) => { tone(b, 220, t, 0.9, 'sawtooth', 0.12); tone(b, 277, t, 0.9, 'sawtooth', 0.1); },
  boost: (t, b) => { tone(b, 200, t, 0.4, 'sawtooth', 0.12, 3); noise(b, t, 0.35, 0.15, 900); },
  error: (t, b) => tone(b, 200, t, 0.25, 'triangle', 0.12, 0.6),
};
/* two original built-in loops (menu = calm, game = energetic); games can pass their own {bpm, root, scale, melody, chords} */
const TRACKS = {
  menu: { bpm: 84, root: 57, scale: [0, 2, 4, 7, 9], chords: [0, 3, 4, 2], melody: [4, -1, 2, 3, 4, -1, 2, 1], drums: false },
  game: { bpm: 128, root: 55, scale: [0, 2, 3, 5, 7, 10], chords: [0, 5, 3, 4], melody: [0, 2, 4, 2, 5, 4, 2, -1], drums: true },
};
const audio = {
  get ctx() { return A.ctx; }, get musicBus() { audioInit(); return A.music; }, get sfxBus() { audioInit(); return A.sfx; },
  get muted() { return A.muted; }, get musicVolume() { return A.musicVol; }, get sfxVolume() { return A.sfxVol; },
  unlock,
  setMuted(m) { A.muted = !!m; audioPersist(); audioApply(); syncButtons(); call(cfg && cfg.onMute, A.muted); },
  toggleMute() { audio.setMuted(!A.muted); return A.muted; },
  setMusicVolume(v) { A.musicVol = clamp(+v || 0, 0, 1); audioPersist(); audioApply(); },
  setSfxVolume(v) { A.sfxVol = clamp(+v || 0, 0, 1); audioPersist(); audioApply(); },
  /* play a sound: a built-in name ('tap','hit','score','whistle','horn','boost','error') or fn(time, sfxBus, ctx) */
  sfx(name) { if (!A.ctx || A.ctx.state !== 'running') return false; const t = A.ctx.currentTime + 0.005; const f = typeof name === 'function' ? name : SFX[name]; if (!f) return false; f(t, A.sfx, A.ctx); return true; },
  music(track) {
    A.want = track; if (!A.ctx) return; audio.stopMusic(); A.want = track;
    const st = typeof track === 'string' ? TRACKS[track] : track; if (!st) return;
    const spb = 60 / st.bpm / 2, note = (deg, oct) => { const n = st.scale.length, o = Math.floor(deg / n); return st.root + st.scale[((deg % n) + n) % n] + 12 * (o + oct); };
    let step = 0, bar = 0, next = A.ctx.currentTime + 0.1;
    A.seq = setInterval(() => {
      if (!A.ctx || A.ctx.state !== 'running') return;
      while (next < A.ctx.currentTime + 0.25) {
        const t = next, s = step % 16, ch = st.chords[bar % st.chords.length], b = A.music;
        if (s === 0) [0, 2, 4].forEach((d) => tone(b, mtof(note(ch + d, 0)), t, spb * 15, 'triangle', 0.035));
        if (s % 4 === 0) tone(b, mtof(note(ch, -2)), t, spb * 1.8, 'triangle', 0.2);
        if (s % 2 === 0) { const m = st.melody[(s / 2 + (bar % 2) * 3) % st.melody.length]; if (m >= 0) tone(b, mtof(note(ch + m, 1)), t, spb * 1.6, 'sine', 0.07); }
        if (st.drums) { if (s % 4 === 0) tone(b, 110, t, 0.2, 'sine', 0.45, 0.35); if (s % 8 === 4) noise(b, t, 0.12, 0.18, 1800); if (s % 2 === 1) noise(b, t, 0.03, 0.05, 8000, 'highpass'); }
        next += spb; step++; if (step % 16 === 0) bar++;
      }
    }, 60);
  },
  stopMusic() { if (A.seq) { clearInterval(A.seq); A.seq = null; } A.want = null; },
};

/* ------------------------------------------------------------------ STYLES + UI */
const CSS = `
.ak, .ak * { box-sizing:border-box; -webkit-user-select:none; user-select:none; -webkit-tap-highlight-color:transparent; }
.ak { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color:#eef3f8; }
.ak-btn { min-width:48px; min-height:48px; border-radius:14px; border:1px solid rgba(255,255,255,.28); background:rgba(14,20,30,.72);
  color:#eef3f8; font:700 15px system-ui, sans-serif; letter-spacing:.04em; cursor:pointer; touch-action:manipulation; }
.ak-btn:active { transform:scale(.96); background:rgba(40,52,70,.9); }
.ak-btn.primary { background:#2f8f83; border-color:#7fd6c9; color:#fff; }
.ak-corner { position:fixed; z-index:9990; top:calc(10px + env(safe-area-inset-top)); right:calc(12px + env(safe-area-inset-right));
  display:flex; gap:8px; }
.ak-corner .ak-btn { width:48px; height:48px; border-radius:50%; padding:0; font-size:18px; display:flex; align-items:center; justify-content:center; }
.ak-ov { position:fixed; inset:0; z-index:9995; display:none; align-items:center; justify-content:center; background:rgba(4,8,14,.72);
  -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); padding:calc(10px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left)); }
.ak-ov.on { display:flex; }
.ak-card { width:min(620px, 100%); max-height:100%; overflow:auto; background:rgba(16,22,32,.94); border:1px solid rgba(255,255,255,.16);
  border-radius:18px; padding:14px 18px 16px; box-shadow:0 18px 50px rgba(0,0,0,.55); -webkit-overflow-scrolling:touch; }
.ak-card h2 { margin:0 0 10px; font:800 20px system-ui, sans-serif; letter-spacing:.06em; text-align:center; }
.ak-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.ak-grid .ak-btn { min-height:54px; font-size:16px; }
.ak-grid .wide { grid-column:1 / -1; }
.ak-row { display:flex; align-items:center; gap:12px; margin:8px 0; min-height:48px; }
.ak-row > span { width:120px; font-weight:700; }
.ak-row input[type=range] { flex:1; height:40px; accent-color:#5cc8b8; }
.ak-seg { display:flex; gap:8px; flex:1; } .ak-seg .ak-btn { flex:1; }
.ak-seg .ak-btn.on, .ak-toggle.on { background:#2f8f83; border-color:#7fd6c9; }
.ak-credits { font-size:13px; line-height:1.5; }
.ak-credits .made { text-align:center; font-weight:800; letter-spacing:.08em; margin-bottom:8px; }
.ak-credits .item { border-top:1px solid rgba(255,255,255,.12); padding:6px 0; }
.ak-credits .item b { color:#fff; } .ak-credits .src { color:#9fb3c8; word-break:break-all; }
.ak-start { flex-direction:column; text-align:center; }
.ak-start h1 { margin:0 0 6px; font:900 34px system-ui, sans-serif; letter-spacing:.06em; }
.ak-start p { margin:0 0 18px; color:#b9c7d6; font-size:13px; letter-spacing:.12em; }
.ak-start .ak-btn { min-width:200px; min-height:60px; font-size:20px; }
.ak-joyzone { position:fixed; left:0; bottom:0; width:45%; height:72%; z-index:9000; touch-action:none; }
.ak-joy { position:absolute; width:128px; height:128px; margin:-64px 0 0 -64px; border-radius:50%; pointer-events:none;
  background:radial-gradient(circle, rgba(255,255,255,.08), rgba(255,255,255,.03)); border:2px solid rgba(255,255,255,.3); opacity:.55; transition:opacity .15s; }
.ak-joy.on { opacity:1; }
.ak-knob { position:absolute; left:50%; top:50%; width:56px; height:56px; margin:-28px 0 0 -28px; border-radius:50%;
  background:rgba(238,243,248,.85); box-shadow:0 2px 10px rgba(0,0,0,.4); }
.ak-pad { position:fixed; z-index:9001; right:calc(18px + env(safe-area-inset-right)); bottom:calc(18px + env(safe-area-inset-bottom));
  display:grid; grid-template-columns:repeat(2, 76px); gap:12px; direction:rtl; }
.ak-act { width:76px; height:76px; border-radius:50%; border:2px solid rgba(255,255,255,.4); background:rgba(14,20,30,.62); color:#fff;
  font:800 12px system-ui, sans-serif; letter-spacing:.06em; touch-action:none; direction:ltr; }
.ak-act.down { background:rgba(47,143,131,.9); border-color:#bff3ea; transform:scale(.94); }
.ak-fps { position:fixed; z-index:9999; left:50%; transform:translateX(-50%); top:calc(4px + env(safe-area-inset-top)); padding:3px 9px;
  border-radius:8px; background:rgba(0,0,0,.6); color:#9ff5c8; font:700 12px ui-monospace, Menlo, monospace; pointer-events:none; }
`;
function buildUI() {
  const st = el('style'); st.id = 'apexKitCss'; st.textContent = CSS; D.head.appendChild(st);
  const corner = el('div', { class: 'ak ak-corner' });
  const mute = el('button', { class: 'ak-btn', id: 'akMute', type: 'button', 'aria-label': 'Sound on or off' });
  const pauseB = el('button', { class: 'ak-btn', id: 'akPauseBtn', type: 'button', 'aria-label': 'Pause' }, '&#10073;&#10073;');
  corner.append(mute, pauseB); D.body.appendChild(corner);
  mute.addEventListener('click', (e) => { e.stopPropagation(); unlock(); audio.toggleMute(); audio.sfx('tap'); });
  pauseB.addEventListener('click', (e) => { e.stopPropagation(); unlock(); ApexKit.pause(); });

  const ov = el('div', { class: 'ak ak-ov', id: 'akMenu', role: 'dialog' });
  ov.innerHTML = `<div class="ak-card">
    <div data-page="main"><h2>PAUSED</h2><div class="ak-grid">
      <button class="ak-btn primary wide" data-act="resume" id="akResume" type="button">Resume</button>
      <button class="ak-btn" data-act="restart" id="akRestart" type="button">Restart</button>
      <button class="ak-btn" data-act="settings" id="akSettings" type="button">Settings</button>
      <button class="ak-btn" data-act="credits" id="akCreditsBtn" type="button">Credits</button>
      <button class="ak-btn" data-act="back" id="akBack" type="button">Back to Game Development</button></div></div>
    <div data-page="settings" hidden><h2>SETTINGS</h2>
      <div class="ak-row"><span>Sound</span><button class="ak-btn ak-toggle" id="akSound" type="button" style="flex:1"></button></div>
      <div class="ak-row"><span>Music volume</span><input type="range" id="akMusicVol" min="0" max="1" step="0.05" aria-label="Music volume"></div>
      <div class="ak-row"><span>Graphics</span><div class="ak-seg" id="akQuality">
        <button class="ak-btn" data-q="low" type="button">Low</button><button class="ak-btn" data-q="medium" type="button">Medium</button><button class="ak-btn" data-q="high" type="button">High</button></div></div>
      <div class="ak-grid" style="margin-top:10px"><button class="ak-btn primary wide" data-act="main" type="button">Done</button></div></div>
    <div data-page="credits" hidden><h2>CREDITS</h2><div class="ak-credits" id="akCredits"></div>
      <div class="ak-grid" style="margin-top:10px"><button class="ak-btn primary wide" data-act="main" type="button">Done</button></div></div>
  </div>`;
  D.body.appendChild(ov);
  ov.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act; audio.sfx('tap');
    if (a === 'resume') ApexKit.resume(); else if (a === 'restart') ApexKit.restart(); else if (a === 'back') ApexKit.back();
    else if (a === 'settings' || a === 'credits' || a === 'main') showPage(a);
  });
  ov.querySelector('#akSound').addEventListener('click', () => { audio.toggleMute(); });
  const mv = ov.querySelector('#akMusicVol'); mv.addEventListener('input', () => audio.setMusicVolume(mv.value));
  ov.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => perf.setQuality(b.dataset.q)));
  ui = { corner, mute, pauseB, ov };
  syncButtons();
}
function showPage(p) {
  if (!ui) return; ui.ov.querySelectorAll('[data-page]').forEach((d) => { d.hidden = d.dataset.page !== p; });
  if (p === 'credits') credits.render(ui.ov.querySelector('#akCredits'));
  syncButtons();
}
function syncButtons() {
  if (!ui) return;
  ui.mute.innerHTML = A.muted ? '&#128263;' : '&#128266;'; ui.mute.setAttribute('aria-pressed', A.muted ? 'true' : 'false'); ui.mute.dataset.muted = A.muted ? '1' : '0';
  const s = ui.ov.querySelector('#akSound'); s.textContent = A.muted ? 'Off' : 'On'; s.classList.toggle('on', !A.muted);
  ui.ov.querySelector('#akMusicVol').value = A.musicVol;
  ui.ov.querySelectorAll('[data-q]').forEach((b) => b.classList.toggle('on', b.dataset.q === perf.quality));
}

/* ------------------------------------------------------------------ CREDITS */
const CREDIT_LIST = [];
const credits = {
  /* { title, maker, license, source, changes } - every CC-BY model MUST be added (ASSET-LAW Part III). Source shows as text, never a link. */
  add(c) { if (!c || !c.title) return; if (!CREDIT_LIST.some((x) => x.title === c.title && x.maker === c.maker)) CREDIT_LIST.push(Object.assign({}, c)); },
  list() { return CREDIT_LIST.map((c) => Object.assign({}, c)); },
  open() { if (!paused) ApexKit.pause(); showPage('credits'); },
  render(box) {
    if (!box) return;
    let h = `<div class="made">Made by Apex Arcade</div><div class="item"><b>${esc(cfg ? cfg.name : '')}</b> - game, music and sounds are original, made for Apex Arcade. Apex Arcade is the only sponsor.</div>`;
    for (const c of CREDIT_LIST) h += `<div class="item"><b>"${esc(c.title)}"</b> by ${esc(c.maker || 'unknown')}, ${esc(c.license || '')}` +
      (c.source ? `<div class="src">Source: ${esc(c.source)}</div>` : '') + (c.changes ? `<div>Changes: ${esc(c.changes)}</div>` : '') + '</div>';
    box.innerHTML = h;
  },
};

/* ------------------------------------------------------------------ TOUCH CONTROLS */
/* ApexKit.controls({ buttons: [{ id:'jump', label:'JUMP', key:'Space' }, ...], joystick:true })
   -> input.read() = { x, y, buttons:{ jump:true } }   x: -1 left .. 1 right, y: -1 up/forward .. 1 down/back (screen style) */
let input = null;
function controls(opts) {
  opts = opts || {};
  if (input) return input;
  const btnDefs = (opts.buttons || [{ id: 'action', label: 'GO', key: 'Space' }]).slice(0, 4);
  const state = { x: 0, y: 0, buttons: {}, jx: 0, jy: 0, keys: new Set() }, edges = {};
  btnDefs.forEach((b) => { state.buttons[b.id] = false; });
  const R = opts.radius || 52;
  let zone = null, joy = null, knob = null, pid = null, ox = 0, oy = 0, home = null;
  if (opts.joystick !== false) {
    zone = el('div', { class: 'ak ak-joyzone', id: 'akJoyZone' }); joy = el('div', { class: 'ak-joy', id: 'akJoy' }); knob = el('div', { class: 'ak-knob' });
    joy.appendChild(knob); zone.appendChild(joy); D.body.appendChild(zone);
    home = () => { joy.style.left = '100px'; joy.style.top = Math.max(80, zone.clientHeight - 100) + 'px'; };   // zone's own (landscape) frame
    home(); addEventListener('resize', home);
    const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px, ${dy}px)`; };
    zone.addEventListener('pointerdown', (e) => {
      if (pid != null || paused) return; e.preventDefault(); unlock(); pid = e.pointerId; try { zone.setPointerCapture(pid); } catch (er) {}
      const r = zone.getBoundingClientRect(); ox = e.clientX; oy = e.clientY;
      const lx = rotated() ? oy - r.top : ox - r.left, ly = rotated() ? r.right - ox : oy - r.top;   // rotated stage: visual -> landscape frame
      joy.style.left = lx + 'px'; joy.style.top = ly + 'px'; joy.classList.add('on');
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return; e.preventDefault();
      let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      if (rotated()) { const t = dx; dx = dy; dy = -t; } // rotated stage: remap to the landscape frame (same as hockey)
      setKnob(dx, dy); state.jx = dx / R; state.jy = dy / R;
    });
    const end = (e) => { if (e.pointerId !== pid) return; pid = null; state.jx = state.jy = 0; setKnob(0, 0); joy.classList.remove('on'); home(); };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
  }
  const pad = el('div', { class: 'ak ak-pad', id: 'akPad' }); const btnEls = {};
  btnDefs.forEach((b) => {
    const e = el('button', { class: 'ak-act', type: 'button', 'data-btn': b.id, id: 'akBtn-' + b.id }, esc(b.label || b.id)); btnEls[b.id] = e; pad.appendChild(e);
    const down = (ev) => { ev.preventDefault(); unlock(); if (paused) return; if (!state.buttons[b.id]) edges[b.id] = true; state.buttons[b.id] = true; e.classList.add('down'); call(b.onPress); };
    const up = (ev) => { ev.preventDefault(); state.buttons[b.id] = false; e.classList.remove('down'); call(b.onRelease); };
    e.addEventListener('pointerdown', down); e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up); e.addEventListener('pointerleave', up);
  });
  D.body.appendChild(pad);
  /* keyboard fallback: WASD / arrows move, each button's key (default: Space for the first one) */
  const keyOf = (b, i) => b.key || (i === 0 ? 'Space' : i === 1 ? 'ShiftLeft' : i === 2 ? 'KeyE' : 'KeyQ');
  const onKey = (down) => (e) => {
    if (e.repeat && down) return; const c = e.code;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) { down ? state.keys.add(c) : state.keys.delete(c); e.preventDefault(); }
    btnDefs.forEach((b, i) => { if (keyOf(b, i) === c) { e.preventDefault(); if (paused && down) return; if (down && !state.buttons[b.id]) { edges[b.id] = true; call(b.onPress); } if (!down && state.buttons[b.id]) call(b.onRelease); state.buttons[b.id] = down; btnEls[b.id].classList.toggle('down', down); } });
  };
  addEventListener('keydown', onKey(true)); addEventListener('keyup', onKey(false));
  addEventListener('blur', () => { state.keys.clear(); });
  input = {
    read() {
      const k = state.keys; let kx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0), ky = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
      if (kx && ky) { kx *= Math.SQRT1_2; ky *= Math.SQRT1_2; }
      state.x = paused ? 0 : clamp(state.jx + kx, -1, 1); state.y = paused ? 0 : clamp(state.jy + ky, -1, 1);
      return { x: state.x, y: state.y, buttons: Object.assign({}, state.buttons) };
    },
    /* true once per press (then false until released and pressed again) */
    pressed(id) { if (edges[id]) { edges[id] = false; return true; } return false; },
    reset() { state.jx = state.jy = 0; state.keys.clear(); for (const id in state.buttons) { state.buttons[id] = false; edges[id] = false; btnEls[id].classList.remove('down'); } },
    show(on) { if (zone) zone.style.display = on ? '' : 'none'; pad.style.display = on ? '' : 'none'; },
    get x() { return state.x; }, get y() { return state.y; }, get buttons() { return Object.assign({}, state.buttons); },
  };
  return input;
}

/* ------------------------------------------------------------------ CHASE CAMERA */
/* const cam = ApexKit.chase(camera, carMesh, { distance:7, height:3, lag:0.15, lookAhead:4 }); then each frame cam.update(dt)
   "forward" is the target's local +Z (three.js getWorldDirection). Pass { forward: -1 } for models that face -Z. */
function chase(camera, target, o) {
  o = Object.assign({ distance: 7, height: 3, lag: 0.15, lookAhead: 3, lookHeight: 1, forward: 1, minY: 0.5 }, o || {});
  const V = (o.THREE && o.THREE.Vector3) || (cfg && cfg.three && cfg.three.THREE && cfg.three.THREE.Vector3) || camera.position.constructor;
  const fwd = new V(), want = new V(), look = new V(), lookNow = new V(), tp = new V();
  let first = true;
  function goal() {
    target.getWorldPosition(tp); target.getWorldDirection(fwd); fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, 1); fwd.normalize().multiplyScalar(o.forward);
    want.copy(tp).addScaledVector(fwd, -o.distance); want.y = Math.max(tp.y + o.height, o.minY);
    look.copy(tp).addScaledVector(fwd, o.lookAhead); look.y = tp.y + o.lookHeight;
  }
  const rig = {
    options: o,
    update(dt) {
      goal(); const k = first || !(o.lag > 0) ? 1 : 1 - Math.exp(-Math.max(0, dt || 0) / o.lag); first = false;
      camera.position.lerp(want, k); lookNow.lerp(look, k === 1 ? 1 : Math.min(1, k * 1.6)); camera.lookAt(lookNow); return camera;
    },
    snap() { first = true; goal(); lookNow.copy(look); return rig.update(0); },
  };
  rig.snap();
  return rig;
}

/* ------------------------------------------------------------------ PERFORMANCE */
/* Measures fps with its own requestAnimationFrame. Auto quality: fps under ~45 for 2 s -> pixel ratio down 0.25
   (never below 1 so the picture stays sharp), fps 57+ for 3 s -> back up toward the chosen quality's cap. */
const perf = {
  fps: 0, pixelRatio: 1, quality: 'high', auto: true, meter: null, _low: 0, _high: 0, _cool: 0,
  cap() { return Math.min(W.devicePixelRatio || 1, Q_CAP[perf.quality] || 1.5); },
  floor() { return Math.min(1, perf.cap()); },
  setQuality(q, quiet) {
    if (!Q_CAP[q]) return; perf.quality = q; if (!quiet && cfg) save.set('kit.quality', q);
    try { if (W.ApexGFXActive) W.ApexGFXActive.setQuality(GFX_MAP[q]); } catch (e) {}
    perf.setPixelRatio(perf.cap()); syncButtons(); if (!quiet) call(cfg && cfg.onQuality, q);
  },
  setPixelRatio(pr) { perf.pixelRatio = clamp(pr, perf.floor(), perf.cap()); fit(); },
  _sample(fps) {   // one ~1 s measurement; also callable by tests
    perf.fps = fps; if (perf.meter) perf.meter.textContent = Math.round(fps) + ' fps · x' + perf.pixelRatio.toFixed(2) + ' · ' + perf.quality;
    if (!perf.auto || !started || paused || D.hidden) { perf._low = perf._high = 0; return; }
    if (perf._cool > 0) { perf._cool--; return; }
    if (fps < 45) { perf._low++; perf._high = 0; } else if (fps >= 57) { perf._high++; perf._low = 0; } else { perf._low = perf._high = 0; }
    if (perf._low >= 2 && perf.pixelRatio > perf.floor() + 0.01) { perf.setPixelRatio(perf.pixelRatio - 0.25); perf._low = 0; perf._cool = 2; }
    else if (perf._high >= 3 && perf.pixelRatio < perf.cap() - 0.01) { perf.setPixelRatio(perf.pixelRatio + 0.25); perf._high = 0; perf._cool = 2; }
  },
};
function perfLoop() {
  let last = performance.now(), n = 0, acc = 0;
  const f = (now) => { const dt = now - last; last = now; if (dt < 250) { acc += dt; n++; } if (acc >= 1000) { perf._sample(1000 * n / acc); acc = 0; n = 0; } requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

/* ------------------------------------------------------------------ LANDSCAPE FIT */
/* Sizes the renderer + camera to the LANDSCAPE box on every resize / rotation / visualViewport change (fitGame pattern). */
function fit() {
  const t = cfg && cfg.three; if (!t || !t.renderer) return;
  let w = D.documentElement.clientWidth || innerWidth, h = D.documentElement.clientHeight || innerHeight;
  if (h > w) { const s = w; w = h; h = s; }
  if (!w || !h) return;
  if (Math.abs(t.renderer.getPixelRatio() - perf.pixelRatio) > 0.001) t.renderer.setPixelRatio(perf.pixelRatio);
  t.renderer.setSize(w, h, false);
  if (t.camera && t.camera.isPerspectiveCamera) { t.camera.aspect = w / h; t.camera.updateProjectionMatrix(); }
  call(cfg.onResize, w, h);
}

/* ------------------------------------------------------------------ TEST HOOK */
/* ApexKit.test.expose({ score: () => game.score, carX: () => car.position.x, ... }) -> window.__test.score etc.
   Values are read-only snapshots (functions are called on read). window.__test.kit is always there. */
const exposed = {};
function publishTest() {
  const t = {};
  const snap = (v) => { try { return v == null || typeof v !== 'object' ? v : JSON.parse(JSON.stringify(v)); } catch (e) { return undefined; } };
  for (const k in exposed) Object.defineProperty(t, k, { enumerable: true, get: () => snap(typeof exposed[k] === 'function' ? call(exposed[k]) : exposed[k]) });
  Object.defineProperty(W, '__test', { configurable: true, enumerable: true, get: () => t, set: () => {} });
}
const test = { expose(obj) { if (!obj) return; for (const k in obj) if (k !== 'kit') exposed[k] = obj[k]; publishTest(); } };
exposed.kit = () => ({ version: VERSION, id: cfg && cfg.id, started, paused, muted: A.muted, musicVolume: A.musicVol, quality: perf.quality,
  pixelRatio: perf.pixelRatio, fps: Math.round(perf.fps), audio: A.ctx ? A.ctx.state : 'locked', credits: CREDIT_LIST.length,
  input: input ? { x: input.x, y: input.y, buttons: input.buttons } : null, menu: ui && ui.ov.classList.contains('on') ? ([...ui.ov.querySelectorAll('[data-page]')].find((d) => !d.hidden) || {}).dataset.page : null });

/* ------------------------------------------------------------------ BOOT + GAME FLOW */
let loopLast = 0;
function gameLoop(now) {
  const dt = loopLast ? Math.min(0.05, (now - loopLast) / 1000) : 0; loopLast = now;
  if (started && !paused) call(cfg.onFrame, dt, now / 1000);
  requestAnimationFrame(gameLoop);
}
function showStart() {
  const ov = el('div', { class: 'ak ak-ov ak-start on', id: 'akStart' });
  ov.innerHTML = `<h1>${esc(cfg.name)}</h1><p>APEX ARCADE</p><button class="ak-btn primary" id="akPlay" type="button">Play</button>`;
  D.body.appendChild(ov);
  ov.querySelector('#akPlay').addEventListener('click', () => { unlock(); ov.remove(); ApexKit.start(); });
}
const ApexKit = {
  version: VERSION, save, audio, credits, test, perf, controls, chase, fit, rotated,
  get started() { return started; }, get paused() { return paused; }, get id() { return cfg && cfg.id; },
  /* ApexKit.boot({ id, name, onStart, onPause, onResume, onRestart, three:{ THREE, renderer, camera }, ...optional }) */
  boot(o) {
    if (booted) return ApexKit;
    if (!o || !o.id || !/^[a-z0-9_-]+$/i.test(o.id)) throw new Error('ApexKit.boot needs an id like "apexhockey"');
    cfg = Object.assign({ name: o.id, backHref: 'sports.html', saveVersion: 1, startScreen: false, music: { menu: 'menu', game: 'game' }, autoQuality: false, lockLandscape: true }, o);
    booted = true; save.version = cfg.saveVersion;
    /* audio settings: this game's own save first, else the house-wide apex_muted flag */
    const as = save.get('kit.audio', null);
    let gm = null; try { gm = localStorage.getItem(GLOBAL_MUTE); } catch (e) {}
    A.muted = as ? !!as.muted : gm === '1'; if (as) { A.musicVol = clamp(+as.music, 0, 1); A.sfxVol = clamp(+as.sfx, 0, 1); }
    ['pointerdown', 'touchend', 'keydown'].forEach((ev) => addEventListener(ev, unlock, { capture: true, passive: true }));
    D.addEventListener('visibilitychange', () => {
      if (A.ctx) { try { D.hidden ? A.ctx.suspend() : A.ctx.resume(); } catch (e) {} }
      if (D.hidden && started && !paused) ApexKit.pause();
    });
    addEventListener('keydown', (e) => { if (e.code === 'Escape' || e.code === 'KeyP') { if (!started) return; paused ? ApexKit.resume() : ApexKit.pause(); } else if (e.code === 'KeyM') audio.toggleMute(); });
    if (cfg.lockLandscape) addEventListener('pointerdown', () => {   /* LANDSCAPE LAW: fullscreen + landscape lock where allowed */
      try { const de = D.documentElement; if (de.requestFullscreen && !D.fullscreenElement) { const p = de.requestFullscreen(); if (p && p.then) p.then(() => { try { const q = screen.orientation.lock('landscape'); if (q && q.catch) q.catch(() => {}); } catch (e) {} }).catch(() => {}); } } catch (e) {}
    }, { once: true });
    perf.auto = !!cfg.autoQuality;
    perf.setQuality(save.get('kit.quality', cfg.quality || 'high'), true);
    const go = () => {
      buildUI();
      if (/[?&]fps=1\b/.test(location.search)) { perf.meter = el('div', { class: 'ak-fps', id: 'akFps' }, '-- fps'); D.body.appendChild(perf.meter); }
      ['resize', 'orientationchange'].forEach((ev) => addEventListener(ev, () => { fit(); setTimeout(fit, 150); setTimeout(fit, 450); }));
      if (W.visualViewport) visualViewport.addEventListener('resize', fit);
      fit(); perfLoop(); publishTest();
      if (cfg.onFrame) requestAnimationFrame(gameLoop);
      if (cfg.music && cfg.music.menu) audio.music(cfg.music.menu);
      if (cfg.startScreen) showStart(); else ApexKit.start();
    };
    if (D.body) go(); else D.addEventListener('DOMContentLoaded', go);
    return ApexKit;
  },
  start() { if (started) return; started = true; if (cfg.music && cfg.music.game) audio.music(cfg.music.game); call(cfg.onStart); },
  pause() {
    if (!booted) return; if (input) input.reset();
    if (!paused) { paused = true; call(cfg.onPause); }
    if (ui) { showPage('main'); ui.ov.classList.add('on'); }
  },
  resume() { if (ui) ui.ov.classList.remove('on'); if (!paused) return; paused = false; loopLast = 0; call(cfg.onResume); },
  restart() {
    if (ui) ui.ov.classList.remove('on'); paused = false; loopLast = 0; if (input) input.reset();
    if (cfg.onRestart) call(cfg.onRestart); else location.reload();
  },
  back() { location.href = cfg.backHref; },
  /* hand a final score to the arcade shell when the game runs inside it (keeps the arcade hook working) */
  score(score, level) { try { if (W.ArcadeShell && W.ArcadeShell.submit) W.ArcadeShell.submit(cfg.id, score, level); } catch (e) {} },
};
W.ApexKit = ApexKit;
export { ApexKit };
export default ApexKit;
