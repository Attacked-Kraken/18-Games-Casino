/* =====================================================================
   weather.js : Weather + Racing FX add-on for the Apex Effects engine (effects.js).
   Load effects.js first, then weather.js. It adds 26 new effect names to the same fx.play():

   const fx = new ApexFX(canvas); fx.autoLoop();
   fx.play('rain_heavy');                 // weather keeps running until you stop it or swap it
   fx.weather('snow', { intensity: .6, wind: -40, prewarm: 4 });  fx.stopWeather();  fx.setWind(120);
   fx.play('lightning', x, y);            // one-shots take a position
   fx.play('skid_mark', x, y, { angle: 0.3, length: 120, width: 10 });   // marks STAY on screen
   fx.skidClear();                        // erase every skid mark  (fx.skidFade(0.02) fades them slowly)
   const smoke = fx.emitter('tire_smoke', () => [car.x, car.y]);  smoke.stop();
       // emitters follow a moving point; any tire_smoke / dirt_spray / sparks / water_spray name works
   fx.play('sparks', x, y, { angle: Math.PI, spread: .6 });   // angle = spray direction in radians
   ApexFX.list() now includes these names. ApexFX.sound(name) -> matching MP3 file name (or null).
   ===================================================================== */
(function () {
  'use strict';
  if (typeof ApexFX === 'undefined') { console.warn('weather.js: load effects.js first'); return; }
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2, pick = a => a[(Math.random() * a.length) | 0];
  const W = {}, SND = {};
  const def = (name, desc, fn, snd) => { W[name] = { desc, fn }; SND[name] = snd || null; };
  const P = ApexFX.prototype, oPlay = P.play, oList = ApexFX.list, oInfo = ApexFX.info, oDraw = P.draw, oClear = P.clear;
  P.play = function (n, x, y, o) { const f = W[n]; if (!f) return oPlay.call(this, n, x, y, o); if (x == null) x = this.w / 2; if (y == null) y = this.h / 2; f.fn(this, x, y, o || {}); if (this.onPlay) this.onPlay(n); };
  ApexFX.list = () => oList().concat(Object.keys(W)); ApexFX.weatherList = () => Object.keys(W);
  ApexFX.info = n => W[n] ? W[n].desc : oInfo(n); ApexFX.sound = n => SND[n] || null;
  /* ---------- persistent skid-mark layer (drawn under all particles) ---------- */
  function decal(fx) {
    if (!fx._dec) { const c = document.createElement('canvas'); fx._dec = c; fx._decSize = '';
      fx.addFX({ life: Infinity, under: true, keep: true, decal: true, draw(g) { const d = fx._dec; if (d.width) { g.save(); g.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0); g.drawImage(d, 0, 0, fx.w, fx.h); g.restore(); } } }); }
    const s = fx.w + 'x' + fx.h; if (fx._decSize !== s) { const c = fx._dec, old = c.width ? c : null, tmp = old ? document.createElement('canvas') : null;
      if (tmp) { tmp.width = old.width; tmp.height = old.height; tmp.getContext('2d').drawImage(old, 0, 0); }
      c.width = Math.round(fx.w * fx.dpr); c.height = Math.round(fx.h * fx.dpr); if (tmp) c.getContext('2d').drawImage(tmp, 0, 0, c.width, c.height); fx._decSize = s; }
    const g = fx._dec.getContext('2d'); g.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0); return g;
  }
  P.skidLine = function (x1, y1, x2, y2, width = 9, alpha = .5, color = '20,20,22') { const g = decal(this); g.lineCap = 'round'; g.strokeStyle = `rgba(${color},${alpha})`; g.lineWidth = width; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  P.skidClear = function () { if (this._dec) this._dec.getContext('2d').clearRect(0, 0, this._dec.width, this._dec.height); };
  P.skidFade = function (amount = .02) { if (!this._dec) return; const g = this._dec.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out'; g.fillStyle = `rgba(0,0,0,${amount})`; g.fillRect(0, 0, this._dec.width, this._dec.height); g.restore(); };
  P.clear = function () { const keep = this.fx.filter(f => f.decal); oClear.call(this); this.fx.push(...keep); this._wx = null; };
  /* ---------- weather (one at a time; screen-wide) ---------- */
  P.setWind = function (v) { this.wind = v; };
  P.stopWeather = function () { if (this._wx) { this._wx.stopping = true; this._wx = null; } };
  P.weather = function (kind, o = {}) {
    this.stopWeather(); if (!kind) return; const fx = this, k = o.intensity == null ? 1 : o.intensity; if (o.wind != null) fx.wind = o.wind; if (fx.wind == null) fx.wind = 0;
    const spec = WX[kind]; if (!spec) { console.warn('weather: unknown', kind); return; }
    let acc = 0, light = 0;
    const st = { life: Infinity, keep: true, under: !!spec.under, stopping: false, fade: 1,
      tick(fx, f, dt) { if (f.stopping) { f.fade -= dt; if (f.fade <= 0) f.life = 0; } else f.fade = Math.min(1, f.fade + dt);
        acc += dt * spec.rate * k * (f.stopping ? 0 : 1); while (acc >= 1) { acc--; spec.spawn(fx, k); }
        if (spec.lightning) { light -= dt; if (light <= 0 && !f.stopping) { light = R(3, 8) / Math.max(.3, k); if (Math.random() < .8) bolt(fx, R(.15, .85) * fx.w, 0, true); } } },
      draw: spec.draw ? (g, f) => spec.draw(g, f, fx, k) : null };
    if (st.draw === null) delete st.draw; fx.addFX(st); fx._wx = st;
    if (o.prewarm) for (let i = 0; i < o.prewarm * 30; i++) fx.update(1 / 30);   // start already full (seconds)
    return st;
  };
  const top = (fx, pad = 60) => ({ x: R(-pad - Math.max(0, fx.wind) * .6, fx.w + pad - Math.min(0, fx.wind) * .6), y: R(-40, -10) });
  function rainDrop(fx, sp, len, a) { const p = top(fx); fx.emit({ x: p.x, y: p.y, vx: fx.wind + R(-10, 10), vy: sp * R(.85, 1.15), life: (fx.h + 60) / sp * 1.05, s0: len, s1: len, a0: a, a1: a, tex: 'spark', stretch: .045, color: '#cfe6ff', add: false }); }
  function splashAt(fx, x, y, n = 3, c = '#d8ecff') { fx.burst(n, x, y, () => ({ vx: R(-60, 60), vy: R(-120, -40), ay: 500, life: R(.2, .35), s0: R(2, 4), s1: 0, tex: 'glow', color: c, add: false, a0: .8 })); }
  const fogDraw = (dense) => (g, f, fx) => { const t = fx.time; g.save(); g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 6; i++) { const x = ((i * 0.23 + t * (.01 + i * .004) + (fx.wind || 0) * t * .0003) % 1.4 - .2) * fx.w, y = fx.h * (.25 + .12 * i), r = fx.w * (.45 + .1 * (i % 3));
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(225,232,240,${(dense ? .32 : .18) * f.fade})`); gr.addColorStop(1, 'rgba(225,232,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, fx.w, fx.h); }
    g.fillStyle = `rgba(210,220,230,${(dense ? .25 : .1) * f.fade})`; g.fillRect(0, 0, fx.w, fx.h); g.restore(); };
  const WX = {
    rain_light: { rate: 70, spawn: fx => rainDrop(fx, 900, 18, .45) },
    rain: { rate: 180, spawn: fx => { rainDrop(fx, 1100, 26, .55); if (Math.random() < .25) splashAt(fx, R(0, fx.w), R(fx.h * .6, fx.h), 2); } },
    rain_heavy: { rate: 420, spawn: fx => { rainDrop(fx, 1300, 34, .6); if (Math.random() < .3) splashAt(fx, R(0, fx.w), R(fx.h * .5, fx.h), 3); }, draw: (g, f, fx) => { g.fillStyle = `rgba(40,55,80,${.18 * f.fade})`; g.fillRect(0, 0, fx.w, fx.h); }, under: true },
    rain_storm: { rate: 520, lightning: true, spawn: fx => { rainDrop(fx, 1500, 40, .6); if (Math.random() < .3) splashAt(fx, R(0, fx.w), R(fx.h * .5, fx.h), 3); }, draw: (g, f, fx) => { g.fillStyle = `rgba(20,30,55,${.3 * f.fade})`; g.fillRect(0, 0, fx.w, fx.h); }, under: true },
    snow_light: { rate: 18, spawn: fx => { const p = top(fx); fx.emit({ x: p.x, y: p.y, vx: fx.wind * .5, vy: R(30, 60), wob: 30, life: 30, s0: R(4, 8), s1: R(4, 8), a0: .9, a1: .9, tex: 'glow', color: '#fff', add: false }); } },
    snow: { rate: 60, spawn: fx => { const p = top(fx), s = R(5, 14); fx.emit({ x: p.x, y: p.y, vx: fx.wind * .6, vy: R(40, 90), wob: 40, life: 22, s0: s, s1: s, a0: .95, a1: .95, tex: s > 11 ? 'snow' : 'glow', spin: R(-1, 1), rot: R(0, 6), color: '#fff', add: false }); } },
    blizzard: { rate: 260, spawn: fx => { const s = R(3, 10), y = R(-20, fx.h), dir = (fx.wind || 300) >= 0 ? 1 : -1; fx.emit({ x: dir > 0 ? -20 : fx.w + 20, y, vx: (Math.abs(fx.wind) || 300) * dir * R(1.2, 2), vy: R(20, 80), wob: 60, life: fx.w / 300 + 1, s0: s, s1: s, a0: .9, a1: .7, tex: 'glow', color: '#fff', add: false }); }, draw: (g, f, fx) => { g.fillStyle = `rgba(230,238,248,${.22 * f.fade})`; g.fillRect(0, 0, fx.w, fx.h); }, under: false },
    fog: { rate: 0, spawn() {}, draw: fogDraw(false) },
    fog_heavy: { rate: 0, spawn() {}, draw: fogDraw(true) },
    wind: { rate: 22, spawn: fx => { const dir = (fx.wind || 260) >= 0 ? 1 : -1, sp = Math.abs(fx.wind || 260) * R(1.5, 2.5); fx.emit({ x: dir > 0 ? -60 : fx.w + 60, y: R(0, fx.h), vx: sp * dir, vy: R(-15, 15), life: (fx.w + 120) / sp, s0: R(40, 90), s1: R(40, 90), a0: .25, a1: .0, tex: 'spark', stretch: .3, color: '#ffffff', add: false }); } },
    wind_leaves: { rate: 14, spawn: fx => { const dir = (fx.wind || 220) >= 0 ? 1 : -1; fx.emit({ x: dir > 0 ? -30 : fx.w + 30, y: R(0, fx.h * .9), vx: Math.abs(fx.wind || 220) * dir * R(.8, 1.4), vy: R(-30, 40), wob: 80, life: 8, s0: R(12, 20), s1: R(12, 20), a0: 1, a1: 1, tex: 'leaf', spin: R(-4, 4), rot: 1, color: pick(['#e0912f', '#c8572a', '#8fae3a', '#e6c03a']), add: false }); } },
  };
  Object.keys(WX).forEach(n => def(n, { rain_light: 'light rain (keeps running)', rain: 'rain with ground splashes (keeps running)', rain_heavy: 'heavy rain + dark sky (keeps running)', rain_storm: 'storm: heavy rain + random lightning (keeps running)',
    snow_light: 'light snow (keeps running)', snow: 'snowfall with flakes (keeps running)', blizzard: 'sideways blizzard (keeps running)', fog: 'drifting fog (keeps running)', fog_heavy: 'thick fog (keeps running)',
    wind: 'wind streaks (keeps running)', wind_leaves: 'wind with blowing leaves (keeps running)' }[n], (fx, x, y, o) => fx.weather(n, o),
    { rain_light: 'rain_light_loop', rain: 'rain_medium_loop', rain_heavy: 'rain_heavy_loop', rain_storm: 'rain_heavy_loop', snow_light: 'snow_ambience_loop', snow: 'snow_ambience_loop', blizzard: 'wind_strong_loop', fog: 'fog_ambience_loop', fog_heavy: 'fog_ambience_loop', wind: 'wind_loop', wind_leaves: 'wind_loop' }[n]));
  def('weather_stop', 'stop the current weather (fades out)', fx => fx.stopWeather());
  /* ---------- lightning ---------- */
  function bolt(fx, x, y, auto, o = {}) {
    const ty = o.ty || fx.h * R(.55, .85), pts = [[x, y]]; let cx = x, cy = y; while (cy < ty) { cy += R(18, 40); cx += R(-28, 28); pts.push([cx, cy]); }
    const br = []; for (let i = 2; i < pts.length - 2; i += 3) if (Math.random() < .5) { let bx = pts[i][0], by = pts[i][1]; const a = [[bx, by]], d = Math.random() < .5 ? -1 : 1; for (let j = 0; j < 5; j++) { bx += d * R(10, 30); by += R(10, 30); a.push([bx, by]); } br.push(a); }
    const path = (g, p) => { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (const q of p) g.lineTo(q[0], q[1]); g.stroke(); };
    fx.addFX({ life: .45, draw(g, f) { const u = f.t / f.life, on = u < .15 || (u > .25 && u < .4); if (!on) return; g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(160,190,255,.35)'; g.lineWidth = 14; path(g, pts); g.strokeStyle = 'rgba(220,235,255,.9)'; g.lineWidth = 4; path(g, pts); g.strokeStyle = '#fff'; g.lineWidth = 1.6; path(g, pts);
      g.lineWidth = 1.5; g.strokeStyle = 'rgba(220,235,255,.7)'; br.forEach(b => path(g, b)); g.restore(); } });
    fx.hitFlash('#e8f0ff', .25, auto ? .35 : .55); fx.emit({ x: cx, y: cy, life: .3, s0: 40, s1: 120, a0: .9, tex: 'glow', color: '#cfe0ff' });
    if (fx.onWeatherSound) fx.onWeatherSound(Math.random() < .5 ? 'thunder_crack' : 'thunder_close');
  }
  def('lightning', 'lightning bolt from the top down to y', (fx, x, y, o) => bolt(fx, x, 0, false, { ty: y }), 'thunder_crack');
  def('lightning_flash', 'sky flash only (far lightning)', fx => { fx.hitFlash('#dfe8ff', .18, .4); setTimeout(() => fx.hitFlash('#dfe8ff', .12, .3), 160); }, 'thunder_rumble_far');
  /* ---------- racing ---------- */
  const dirV = (o, a0, sp0, sp1) => { const a = (o.angle == null ? a0 : o.angle) + R(-1, 1) * (o.spread == null ? .5 : o.spread), v = R(sp0, sp1); return { vx: Math.cos(a) * v, vy: Math.sin(a) * v }; };
  const smokePuff = (fx, x, y, o, k = 1) => fx.emit(Object.assign(dirV(o, -Math.PI / 2, 20, 70), { x: x + R(-6, 6), y: y + R(-4, 4), ay: -20, drag: 1.2, life: R(1, 1.8) * k, s0: R(16, 26) * k, s1: R(80, 130) * k, a0: .55, tex: 'smoke', color: o.color || '#e6e6ea', add: false, fadeIn: true, spin: R(-.6, .6), rot: R(0, 6) }));
  const SPAWN = {
    tire_smoke: (fx, x, y, o) => smokePuff(fx, x, y, o),
    dirt_spray: (fx, x, y, o) => { fx.emit(Object.assign(dirV(o, -Math.PI * .75, 160, 380), { x, y, ay: 700, drag: .5, life: R(.4, .8), s0: R(3, 7), s1: R(2, 4), tex: 'square', rot: R(0, 6), spin: R(-8, 8), color: pick(['#6b4a2b', '#8a5f38', '#4e351f']), add: false })); if (Math.random() < .3) smokePuff(fx, x, y, o, .6); },
    sparks: (fx, x, y, o) => fx.emit(Object.assign(dirV(o, Math.PI, 250, 600), { x, y, ay: 600, drag: 1, life: R(.25, .6), s0: R(4, 8), s1: 0, tex: 'spark', stretch: .05, color: pick(['#fff6c0', '#ffd060', '#ffa020']) })),
    water_spray: (fx, x, y, o) => fx.emit(Object.assign(dirV(o, -Math.PI * .7, 120, 320), { x, y, ay: 600, drag: .8, life: R(.4, .8), s0: R(3, 6), s1: R(8, 14), a0: .7, tex: 'glow', color: '#cfe6ff', add: false })),
  };
  P.emitter = function (kind, getPos, o = {}) {
    const fx = this, sp = SPAWN[kind.replace(/_(burst|loop)$/, '')]; if (!sp) { console.warn('emitter: unknown', kind); return { stop() {} }; }
    let acc = 0; const rate = o.rate || { tire_smoke: 30, dirt_spray: 80, sparks: 90, water_spray: 70 }[kind] || 40;
    fx.addFX({ life: Infinity }); const f = fx.fx[fx.fx.length - 1];
    f.tick = (fx, f, dt) => { if (f.stopped) { f.life = 0; return; } acc += dt * rate * (o.intensity == null ? 1 : o.intensity); const p = getPos(); while (acc >= 1) { acc--; sp(fx, p[0], p[1], o); } };
    return { stop() { f.stopped = true; }, set(v) { Object.assign(o, v); } };
  };
  const burstOf = (kind, n, dur) => (fx, x, y, o) => { if (!dur) { for (let i = 0; i < n; i++) SPAWN[kind](fx, x, y, o); return; } let acc = 0; fx.addFX({ life: dur, tick(fx, f, dt) { acc += dt * n / dur; while (acc >= 1) { acc--; SPAWN[kind](fx, x, y, o); } } }); };
  def('tire_smoke', 'tire smoke cloud for 1.5 s (use fx.emitter for continuous)', burstOf('tire_smoke', 45, 1.5), 'tire_smoke_hiss_loop');
  def('tire_smoke_burst', 'quick puff of tire smoke', burstOf('tire_smoke', 14), 'skid_short');
  def('burnout', 'burnout: heavy smoke + black marks', (fx, x, y, o) => { burstOf('tire_smoke', 90, 2.5)(fx, x, y, o); for (let i = 0; i < 6; i++) fx.skidLine(x - 18 + i, y + R(-3, 3), x + 18 - i, y + R(-3, 3), 12, .25); }, 'tire_smoke_hiss_loop');
  def('skid_mark', 'skid marks that stay (opts: angle, length, width, gap)', (fx, x, y, o) => { const a = o.angle || 0, L = o.length || 120, w = o.width || 9, gap = o.gap == null ? 26 : o.gap, nx = -Math.sin(a) * gap / 2, ny = Math.cos(a) * gap / 2, dx = Math.cos(a) * L, dy = Math.sin(a) * L;
    let t = 0; fx.addFX({ life: .45, tick(fx, f, dt) { const t2 = Math.min(1, f.t / f.life); [1, -1].forEach(s => fx.skidLine(x + nx * s + dx * t, y + ny * s + dy * t, x + nx * s + dx * t2, y + ny * s + dy * t2, w, .45)); t = t2; } }); SPAWN.tire_smoke(fx, x + dx, y + dy, {}); }, 'skid_short');
  def('skid_drift', 'curved drift skid marks that stay', (fx, x, y, o) => { const r = o.radius || 110, a0 = o.angle || -Math.PI / 2, sweep = o.sweep || 1.6; let last = null;
    fx.addFX({ life: .8, tick(fx, f) { const u = Math.min(1, f.t / f.life), a = a0 + sweep * u, pts = [[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * (r + 26), y + Math.sin(a) * (r + 26)]];
      if (last) pts.forEach((p, i) => fx.skidLine(last[i][0], last[i][1], p[0], p[1], 10, .4)); last = pts; if (Math.random() < .5) SPAWN.tire_smoke(fx, pts[1][0], pts[1][1], {}); } }); }, 'skid_long');
  def('dirt_spray', 'dirt clods + dust thrown back (opts: angle)', burstOf('dirt_spray', 60, .5), 'dirt_spray');
  def('gravel_spray', 'grey gravel spray', (fx, x, y, o) => burstOf('dirt_spray', 50, .4)(fx, x, y, Object.assign({}, o, { color: '#9a948a' })), 'gravel_spray');
  def('mud_splash', 'wet mud splash', (fx, x, y, o) => { for (let i = 0; i < 40; i++) fx.emit(Object.assign(dirV(o, -Math.PI / 2, 120, 360), { x, y, ay: 800, life: R(.5, .9), s0: R(5, 10), s1: R(6, 12), tex: 'glow', color: pick(['#4a3220', '#5e4028', '#3a2818']), add: false, a0: 1 })); }, 'puddle_splash');
  def('sparks', 'spark shower (opts: angle, spread)', burstOf('sparks', 50), 'sparks_scrape');
  def('sparks_scrape', 'sparks for 1 s, like scraping a wall', burstOf('sparks', 120, 1), 'metal_scrape_long');
  def('puddle_splash', 'puddle splash: crown + droplets + ripple', (fx, x, y) => { for (let i = 0; i < 36; i++) { const a = -Math.PI / 2 + R(-1.1, 1.1), v = R(120, 340); fx.emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ay: 900, life: R(.4, .8), s0: R(3, 7), s1: R(2, 4), tex: 'drop', color: '#cfe6ff', add: false, a0: .9 }); }
    fx.addFX({ life: .8, under: true, draw(g, f) { const u = f.t / f.life; g.save(); g.globalAlpha = (1 - u) * .7; g.strokeStyle = '#e6f2ff'; g.lineWidth = 3 * (1 - u) + 1; g.beginPath(); g.ellipse(x, y, 10 + u * 70, 4 + u * 22, 0, 0, TAU); g.stroke(); g.restore(); } }); }, 'puddle_splash');
  def('water_spray', 'water spray behind a wheel for 1 s (opts: angle)', burstOf('water_spray', 70, 1), 'wet_tires_loop');
  def('rain_splashes', 'little ground splashes in an area for 2 s', (fx, x, y) => { let acc = 0; fx.addFX({ life: 2, tick(fx, f, dt) { acc += dt * 40; while (acc >= 1) { acc--; splashAt(fx, x + R(-120, 120), y + R(-30, 30), 3); } } }); }, 'rain_light_loop');
  def('dust_cloud', 'big brown dust cloud', (fx, x, y, o) => { for (let i = 0; i < 26; i++) smokePuff(fx, x + R(-30, 30), y, Object.assign({}, o, { color: '#b39270' }), 1.3); }, 'dirt_spray');
})();
