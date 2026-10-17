/* apex-fx.js - ready-made effects for every Apex game (owner, 2026-10-17). Zero files: everything is drawn in code.
   One tested version for every game, so no Muse rebuilds ice spray or a waving flag from scratch.

   import ApexFX from './kit/apex-fx.js';
   const fx = ApexFX.create({ THREE, scene });        // three.js is passed in, never imported here
   ...each frame:  fx.update(dt);                     // (or call it from ApexKit's onFrame)

   What's inside (guide: kit/README.md "Effects pack"):
   - fx.time                      one shared clock for every shader effect ({ value: seconds })
   - fx.on(name, fn) / fx.emit(name, data)   tiny event bus: the game says WHAT happened, effects + sounds listen
                                  (also ApexKit.emit / ApexKit.on when the kit is there)
   - fx.sound(event, sfx)         a kit sound on an event (goal->horn, score, hit, whistle, boost are linked already)
   - fx.burst(kind, pos, opts)    particles: 'ice' 'dust' 'dirt' 'sparks' 'confetti' 'splash' 'smoke'
   - fx.when(event, kind, opts)   wire an event to a burst once:  fx.when('skate_brake', 'ice')  then  fx.emit('skate_brake', {pos})
   - fx.flashes(opts)             crowd camera flashes twinkling over the stands (box or list of points)
   - fx.wave(material, opts)      flags, nets, banners, grass, water wave by themselves (patches the material's shader)
   - fx.glow(opts)                soft glowing light (stadium lamp, puck glow, goal light) - a sprite, no picture file
   - fx.tex.*                     pictures drawn in code: wood, seats, ice, grass, asphalt, number, label, segments (live
                                  7-segment scoreboard digits), lines, noise
   - fx.shake / fx.render         camera shake on hits and goals, drawn without fighting your camera code
   - fx.slowmo                    slow motion that eases back; fx.update(dt) returns the game's time step
   - fx.lightMask(mesh, {mode})   baked lighting on floors: 'arena' (rink pools of light) or 'sun' (open-air field)
   - fx.math                      rand, range, pick, clamp, lerp, smooth, noise2 (smooth noise), fbm2
   - fx.stats()                   counts for the robot (also on window.__test.fx when ApexKit is there)
   Phone budget: every burst kind is ONE draw call with a fixed size (default 400 particles), arrays are reused,
   nothing is created per frame. fx.setQuality('low') halves the particles. */

const VERSION = '1.0.0';

/* ------------------------------------------------------------------ math */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s | 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function noise2(x, y, seed = 0) {           // smooth value noise, 0..1
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm2(x, y, oct = 4, seed = 0) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f, seed + i); n += a; a *= 0.5; f *= 2; } return s / n; }
const math = { clamp, lerp, smooth, noise2, fbm2, rand: Math.random, range: (a, b) => a + Math.random() * (b - a), pick: (arr) => arr[(Math.random() * arr.length) | 0] };

/* ------------------------------------------------------------------ burst kinds (all tuned in metres / seconds) */
const KINDS = {
  ice:      { colors: ['#ffffff', '#e6f4ff', '#cfe9ff'], count: 26, size: [0.06, 0.14], speed: [1.5, 4], up: [0.6, 2], life: [0.35, 0.7], gravity: -6, drag: 2.5, spread: 1.1, blend: 'normal' },
  dust:     { colors: ['#c9ad86', '#b7966d', '#d8c3a2'], count: 22, size: [0.18, 0.4], speed: [0.4, 1.4], up: [0.3, 0.9], life: [0.7, 1.3], gravity: -0.4, drag: 1.6, spread: 1.6, grow: 1.8, blend: 'normal' },
  dirt:     { colors: ['#6b4a2b', '#7d5733', '#4f3720'], count: 24, size: [0.06, 0.13], speed: [2, 5], up: [1.5, 3.5], life: [0.5, 0.9], gravity: -9.8, drag: 0.6, spread: 0.9, blend: 'normal' },
  sparks:   { colors: ['#fff3b0', '#ffc94a', '#ff8a2a'], count: 30, size: [0.04, 0.08], speed: [3, 7], up: [0.5, 2.5], life: [0.25, 0.55], gravity: -7, drag: 0.8, spread: 1.4, blend: 'add' },
  confetti: { colors: ['#ff3b5c', '#ffd23f', '#3bceac', '#4d7cff', '#ffffff', '#ff8a2a'], count: 60, size: [0.07, 0.12], speed: [2, 5], up: [3, 6], life: [1.6, 2.6], gravity: -3.2, drag: 1.2, spread: 2.2, flutter: 1, blend: 'normal' },
  splash:   { colors: ['#e8f6ff', '#bfe3ff', '#ffffff'], count: 34, size: [0.05, 0.11], speed: [1.5, 3.5], up: [2, 4], life: [0.4, 0.8], gravity: -9.8, drag: 0.8, spread: 1.6, blend: 'normal' },
  smoke:    { colors: ['#9aa0a6', '#7d838a', '#b5bac0'], count: 14, size: [0.3, 0.6], speed: [0.2, 0.7], up: [0.6, 1.2], life: [1.2, 2.2], gravity: 0.3, drag: 1.2, spread: 1, grow: 2.4, blend: 'normal', alpha: 0.55 },
};

/* ------------------------------------------------------------------ pictures drawn in code */
function makeTex(THREE, draw, w = 256, h = 256, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if ('colorSpace' in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.anisotropy = 4; t.needsUpdate = true; return t;
}
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); const r = clamp(((n >> 16) & 255) * f, 0, 255), g = clamp(((n >> 8) & 255) * f, 0, 255), b = clamp((n & 255) * f, 0, 255); return `rgb(${r | 0},${g | 0},${b | 0})`; }
function noisy(g, w, h, base, amt, scale, seed) {
  const img = g.createImageData(w, h), n = parseInt(base.slice(1), 16), R = (n >> 16) & 255, G = (n >> 8) & 255, B = n & 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const f = 1 + (fbm2(x / scale, y / scale, 4, seed) - 0.5) * 2 * amt, i = (y * w + x) * 4;
    img.data[i] = clamp(R * f, 0, 255); img.data[i + 1] = clamp(G * f, 0, 255); img.data[i + 2] = clamp(B * f, 0, 255); img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}
function texKit(THREE) {
  return {
    /* court / bat / bench wood: planks with grain.  fx.tex.wood({ color:'#c8955a', planks:8, repeat:[4,4] }) */
    wood(o = {}) {
      const col = o.color || '#c8955a', planks = o.planks || 8;
      return makeTex(THREE, (g, w, h) => {
        const ph = h / planks;
        for (let p = 0; p < planks; p++) {
          const f = 0.88 + hash2(p, 3, 9) * 0.24;
          for (let y = 0; y < ph; y++) for (let x = 0; x < w; x += 2) {
            const grain = Math.sin((x / w) * 30 + fbm2(x / 40, (p * ph + y) / 6, 3, p) * 9) * 0.06;
            g.fillStyle = shade(col, f + grain); g.fillRect(x, p * ph + y, 2, 1);
          }
          g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, p * ph, w, 1);
          g.fillRect(((hash2(p, 1, 2) * w) | 0), p * ph, 1, ph);
        }
      }, o.size || 256, o.size || 256, { repeat: o.repeat || [1, 1] });
    },
    /* rows of stadium seats.  fx.tex.seats({ colors:['#1f4fbf','#ffffff'], rows:16, cols:32, people:0.6 }) */
    seats(o = {}) {
      const rows = o.rows || 16, cols = o.cols || 32, colors = o.colors || ['#1f4fbf'], people = o.people == null ? 0.6 : o.people;
      const skin = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'], shirts = o.shirts || ['#e63946', '#f1faee', '#1d3557', '#ffb703', '#2a9d8f', '#222'];
      return makeTex(THREE, (g, w, h) => {
        const cw = w / cols, rh = h / rows; g.fillStyle = '#2a2d33'; g.fillRect(0, 0, w, h);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const x = c * cw, y = r * rh;
          g.fillStyle = colors[(r + c) % colors.length]; g.fillRect(x + cw * 0.1, y + rh * 0.35, cw * 0.8, rh * 0.55);
          if (hash2(r, c, 5) < people) {
            g.fillStyle = shirts[(hash2(c, r, 7) * shirts.length) | 0]; g.fillRect(x + cw * 0.22, y + rh * 0.3, cw * 0.56, rh * 0.45);
            g.fillStyle = skin[(hash2(r, c, 8) * skin.length) | 0]; g.beginPath(); g.arc(x + cw / 2, y + rh * 0.22, Math.min(cw, rh) * 0.2, 0, 6.3); g.fill();
          }
        }
      }, o.w || 512, o.h || 256, { repeat: o.repeat || [1, 1] });
    },
    /* rink ice with faint skate scratches */
    ice(o = {}) {
      return makeTex(THREE, (g, w, h) => {
        noisy(g, w, h, o.color || '#eef6fb', 0.04, 60, 3);
        g.strokeStyle = 'rgba(160,190,210,.35)'; g.lineWidth = 1;
        for (let i = 0; i < (o.scratches || 70); i++) { const x = hash2(i, 1, 4) * w, y = hash2(i, 2, 4) * h, a = hash2(i, 3, 4) * 6.3, l = 20 + hash2(i, 4, 4) * 60; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 8, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      }, o.size || 512, o.size || 512, { repeat: o.repeat || [1, 1] });
    },
    /* mowed grass with stripes.  fx.tex.grass({ stripes:10 }) */
    grass(o = {}) {
      return makeTex(THREE, (g, w, h) => {
        noisy(g, w, h, o.color || '#3f8a3a', 0.12, 18, 7);
        const s = o.stripes || 10; for (let i = 0; i < s; i += 2) { g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(i * w / s, 0, w / s, h); }
      }, o.size || 512, o.size || 512, { repeat: o.repeat || [1, 1] });
    },
    /* road / track asphalt */
    asphalt(o = {}) { return makeTex(THREE, (g, w, h) => { noisy(g, w, h, o.color || '#3b3d41', 0.22, 3, 11); }, o.size || 256, o.size || 256, { repeat: o.repeat || [1, 1] }); },
    /* any noise texture: fx.tex.noise({ color:'#8a6d4b', amount:.3, scale:20 }) (dirt, sand, clay) */
    noise(o = {}) { return makeTex(THREE, (g, w, h) => { noisy(g, w, h, o.color || '#8a6d4b', o.amount || 0.3, o.scale || 20, o.seed || 1); }, o.size || 256, o.size || 256, { repeat: o.repeat || [1, 1] }); },
    /* jersey / bib numbers: fx.tex.number('23', { fg:'#fff', bg:'#c8102e', outline:'#000' }) */
    number(text, o = {}) {
      return makeTex(THREE, (g, w, h) => {
        if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); }
        g.font = `900 ${Math.round(h * 0.72)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        if (o.outline) { g.lineWidth = h * 0.06; g.strokeStyle = o.outline; g.strokeText(String(text), w / 2, h * 0.54); }
        g.fillStyle = o.fg || '#ffffff'; g.fillText(String(text), w / 2, h * 0.54);
      }, o.size || 256, o.size || 256);
    },
    /* a sign / banner / score box: fx.tex.label('HOME 2 - 1 AWAY', { w:512, h:128, bg:'#111', fg:'#ffd23f' }) */
    label(text, o = {}) {
      const w = o.w || 512, h = o.h || 128;
      return makeTex(THREE, (g) => {
        g.fillStyle = o.bg || '#101418'; g.fillRect(0, 0, w, h);
        if (o.border) { g.strokeStyle = o.border; g.lineWidth = h * 0.06; g.strokeRect(h * 0.04, h * 0.04, w - h * 0.08, h - h * 0.08); }
        let fs = Math.round(h * (o.fontScale || 0.5));
        do { g.font = `${o.weight || 800} ${fs}px system-ui, sans-serif`; fs -= 2; } while (fs > 8 && g.measureText(String(text)).width > w * 0.88);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = o.fg || '#ffffff'; g.fillText(String(text), w / 2, h * 0.54);
      }, w, h);
    },
    /* scoreboard digits drawn as 7-segment lights (clocks, balls/strikes, scores). Live: t.set('12:44') redraws it.
       const clock = fx.tex.segments('20:00', { color:'#ff3b30', bg:'#0b0b0b', w:512, h:160 }) */
    segments(text, o = {}) {
      const w = o.w || 512, h = o.h || 160, on = o.color || '#ff3b30', off = o.dim || 'rgba(255,255,255,.06)';
      const SEG = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '', 'E': 'afged', 'H': 'fbgec', 'P': 'abfge', 'L': 'fed', 'A': 'abcefg', 'b': 'fgedc', 'C': 'afed', 'd': 'bgedc', 'F': 'afge', 'o': 'gcde', 'r': 'eg', 't': 'fged', 'U': 'fbcde' };
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      const t = new THREE.CanvasTexture(c); if ('colorSpace' in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      function bar(x, y, len, th, vert, lit) {
        g.fillStyle = lit ? on : off; g.beginPath();
        if (vert) { g.moveTo(x, y); g.lineTo(x + th / 2, y + th / 2); g.lineTo(x + th / 2, y + len - th / 2); g.lineTo(x, y + len); g.lineTo(x - th / 2, y + len - th / 2); g.lineTo(x - th / 2, y + th / 2); }
        else { g.moveTo(x, y); g.lineTo(x + th / 2, y - th / 2); g.lineTo(x + len - th / 2, y - th / 2); g.lineTo(x + len, y); g.lineTo(x + len - th / 2, y + th / 2); g.lineTo(x + th / 2, y + th / 2); }
        g.closePath(); g.fill();
      }
      t.set = (txt) => {
        txt = String(txt); g.fillStyle = o.bg || '#0b0b0b'; g.fillRect(0, 0, w, h);
        const chars = [...txt], digits = chars.filter((ch) => ch !== ':' && ch !== '.').length, colons = chars.length - digits;
        const dh = h * 0.78, dw = Math.min(dh * 0.55, (w * 0.92) / (digits + colons * 0.35)), th = dw * 0.16, gap = dw * 0.28;
        let x = (w - (digits * (dw + gap) + colons * dw * 0.35 - gap)) / 2; const y = (h - dh) / 2;
        if (on && o.glow !== false) { g.shadowColor = on; g.shadowBlur = th * 1.2; }
        for (const ch of chars) {
          if (ch === ':' || ch === '.') { g.fillStyle = on; const cx = x + dw * 0.12; if (ch === ':') g.fillRect(cx - th / 2, y + dh * 0.3, th, th); g.fillRect(cx - th / 2, y + dh * 0.7 - th, th, th); x += dw * 0.35; continue; }
          const L = SEG[ch] || SEG[ch.toUpperCase()] || '', hl = dw - th, vl = dh / 2 - th * 0.5;
          bar(x + th / 2, y, hl, th, false, L.includes('a'));
          bar(x + dw - th / 2, y + th * 0.25, vl, th, true, L.includes('b'));
          bar(x + dw - th / 2, y + dh / 2 + th * 0.25, vl, th, true, L.includes('c'));
          bar(x + th / 2, y + dh, hl, th, false, L.includes('d'));
          bar(x + th / 2, y + dh / 2 + th * 0.25, vl, th, true, L.includes('e'));
          bar(x + th / 2, y + th * 0.25, vl, th, true, L.includes('f'));
          bar(x + th / 2, y + dh / 2, hl, th, false, L.includes('g'));
          x += dw + gap;
        }
        g.shadowBlur = 0; t.text = txt; t.needsUpdate = true; return t;
      };
      return t.set(text);
    },
    /* draw your own lines (court lines, chalk, lane markings): fx.tex.lines((g, w, h) => { g.strokeRect(...) }, { size:1024, bg:'#3f8a3a' }) */
    lines(draw, o = {}) {
      const w = o.w || o.size || 1024, h = o.h || o.size || 1024;
      return makeTex(THREE, (g) => { if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); } g.strokeStyle = o.color || '#ffffff'; g.fillStyle = o.color || '#ffffff'; g.lineWidth = o.width || 6; g.lineCap = 'round'; draw(g, w, h); }, w, h);
    },
  };
}

/* ------------------------------------------------------------------ the pack */
function create(o) {
  if (!o || !o.THREE || !o.scene) throw new Error('ApexFX.create needs { THREE, scene }');
  const THREE = o.THREE, scene = o.scene;
  const time = { value: 0 };
  const listeners = {};
  let quality = o.quality || 'high';
  const systems = {}, flashSets = [], waves = [], glows = [];
  let bursts = 0;

  /* one Points cloud per kind: fixed size, reused forever */
  const VS = `attribute vec3 aColor; attribute float aSize; attribute float aLife; attribute float aAlpha;
    varying vec3 vColor; varying float vAlpha; uniform float uScale;
    void main(){ vColor=aColor; vAlpha=aAlpha*clamp(aLife*3.0,0.0,1.0);
      vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uScale/max(0.1,-mv.z); gl_Position=projectionMatrix*mv; }`;
  const FS = `varying vec3 vColor; varying float vAlpha;
    void main(){ vec2 p=gl_PointCoord-0.5; float d=length(p); float a=smoothstep(0.5,0.32,d)*vAlpha; if(a<0.01) discard; gl_FragColor=vec4(vColor,a); }`;
  function system(kind) {
    if (systems[kind]) return systems[kind];
    const K = KINDS[kind]; if (!K) throw new Error('unknown burst kind "' + kind + '" - use ' + Object.keys(KINDS).join(', '));
    const N = o.max || 400;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), life = new Float32Array(N), alpha = new Float32Array(N);
    const vel = new Float32Array(N * 3), max = new Float32Array(N), base = new Float32Array(N), seed = new Float32Array(N);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aLife', new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
      blending: K.blend === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uScale: { value: o.pointScale || 600 } } });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.name = 'fx-' + kind; pts.renderOrder = 5;
    scene.add(pts);
    const palette = K.colors.map((c) => new THREE.Color(c));
    return (systems[kind] = { K, N, g, pts, pos, col, size, life, alpha, vel, max, base, seed, palette, next: 0, alive: 0 });
  }

  function burst(kind, p, opt = {}) {
    const s = system(kind), K = s.K;
    let n = Math.round((opt.count || K.count) * (quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : 1));
    const dir = opt.dir ? new THREE.Vector3(opt.dir.x || 0, opt.dir.y || 0, opt.dir.z || 0).normalize() : null;
    const sc = opt.scale || 1, px = p ? p.x || 0 : 0, py = p ? p.y || 0 : 0, pz = p ? p.z || 0 : 0;
    for (; n > 0; n--) {
      const i = s.next; s.next = (s.next + 1) % s.N;
      const a = Math.random() * Math.PI * 2, sp = math.range(K.speed[0], K.speed[1]) * sc * (opt.speed || 1);
      let vx = Math.cos(a) * sp * K.spread * 0.5, vz = Math.sin(a) * sp * K.spread * 0.5, vy = math.range(K.up[0], K.up[1]) * sc;
      if (dir) { vx = vx * 0.45 + dir.x * sp; vz = vz * 0.45 + dir.z * sp; vy = vy * 0.6 + dir.y * sp; }
      s.pos[i * 3] = px + (Math.random() - 0.5) * 0.1 * sc; s.pos[i * 3 + 1] = py; s.pos[i * 3 + 2] = pz + (Math.random() - 0.5) * 0.1 * sc;
      s.vel[i * 3] = vx; s.vel[i * 3 + 1] = vy; s.vel[i * 3 + 2] = vz;
      const c = opt.color ? new THREE.Color(opt.color) : s.palette[(Math.random() * s.palette.length) | 0];
      s.col[i * 3] = c.r; s.col[i * 3 + 1] = c.g; s.col[i * 3 + 2] = c.b;
      s.base[i] = math.range(K.size[0], K.size[1]) * sc; s.size[i] = s.base[i];
      s.max[i] = math.range(K.life[0], K.life[1]); s.life[i] = 1; s.alpha[i] = K.alpha || 1; s.seed[i] = Math.random() * 10;
    }
    bursts++;
    return s;
  }

  function stepSystems(dt) {
    let alive = 0;
    for (const k in systems) {
      const s = systems[k], K = s.K; let a = 0;
      const drag = Math.exp(-K.drag * dt);
      for (let i = 0; i < s.N; i++) {
        if (s.life[i] <= 0) continue;
        s.life[i] -= dt / s.max[i];
        if (s.life[i] <= 0) { s.life[i] = 0; s.alpha[i] = 0; continue; }
        a++;
        const j = i * 3;
        s.vel[j] *= drag; s.vel[j + 2] *= drag; s.vel[j + 1] = s.vel[j + 1] * drag + K.gravity * dt;
        if (K.flutter) { s.vel[j] += Math.sin(time.value * 9 + s.seed[i]) * 2.2 * dt; s.vel[j + 2] += Math.cos(time.value * 7 + s.seed[i]) * 2.2 * dt; }
        s.pos[j] += s.vel[j] * dt; s.pos[j + 1] += s.vel[j + 1] * dt; s.pos[j + 2] += s.vel[j + 2] * dt;
        if (o.floor != null && s.pos[j + 1] < o.floor) { s.pos[j + 1] = o.floor; s.vel[j + 1] *= -0.25; s.vel[j] *= 0.6; s.vel[j + 2] *= 0.6; }
        if (K.grow) s.size[i] = s.base[i] * (1 + (1 - s.life[i]) * K.grow);
      }
      s.alive = a; alive += a;
      if (a || s.wasAlive) { for (const n of ['position', 'aColor', 'aSize', 'aLife', 'aAlpha']) s.g.attributes[n].needsUpdate = true; }
      s.wasAlive = a > 0; s.pts.visible = a > 0;
    }
    return alive;
  }

  /* crowd camera flashes: fx.flashes({ box:{ min:{x,y,z}, max:{x,y,z} }, rate: 6 })  or  { points:[{x,y,z},...] } */
  function flashes(opt = {}) {
    const N = Math.min(opt.max || 300, 1500), g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3), life = new Float32Array(N), col = new Float32Array(N * 3), size = new Float32Array(N), alpha = new Float32Array(N);
    const pick = () => {
      if (opt.points && opt.points.length) return math.pick(opt.points);
      const b = opt.box || { min: { x: -20, y: 2, z: -20 }, max: { x: 20, y: 10, z: 20 } };
      return { x: math.range(b.min.x, b.max.x), y: math.range(b.min.y, b.max.y), z: math.range(b.min.z, b.max.z) };
    };
    for (let i = 0; i < N; i++) { const q = pick(); pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 1; size[i] = opt.size || 0.5; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aLife', new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uScale: { value: o.pointScale || 600 } } });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.name = 'fx-flashes'; scene.add(pts);
    const set = { pts, g, pos, life, alpha, N, rate: opt.rate == null ? 6 : opt.rate, acc: 0, pick, on: true, count: 0,
      setRate(r) { set.rate = r; }, burst(k = 40) { for (let i = 0; i < k; i++) set._fire(); },
      _fire() { const i = (Math.random() * N) | 0, q = pick(); pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z; life[i] = 1; set.count++; g.attributes.position.needsUpdate = true; },
      remove() { scene.remove(pts); g.dispose(); m.dispose(); flashSets.splice(flashSets.indexOf(set), 1); } };
    flashSets.push(set); return set;
  }
  function stepFlashes(dt) {
    for (const f of flashSets) {
      if (!f.on) continue;
      f.acc += f.rate * dt * (quality === 'low' ? 0.5 : 1);
      while (f.acc >= 1) { f.acc -= 1; f._fire(); }
      for (let i = 0; i < f.N; i++) { if (f.life[i] > 0) { f.life[i] = Math.max(0, f.life[i] - dt * 7); f.alpha[i] = f.life[i] > 0 ? 1 : 0; } }
      f.g.attributes.aLife.needsUpdate = true; f.g.attributes.aAlpha.needsUpdate = true;
    }
  }

  /* waving cloth / grass / water: patches a three.js material so its vertices move with fx.time.
     fx.wave(flagMaterial, { amp:0.15, freq:3, speed:4, pin:'left' })      flags + banners: pinned edge stays still
     fx.wave(netMaterial,  { amp:0.04, freq:6, speed:2 })                   nets
     fx.wave(grassMaterial,{ amp:0.08, freq:1.5, speed:2, mode:'sway' })    grass / plants: tops move, roots stay
     fx.wave(waterMaterial,{ amp:0.05, freq:2, speed:1.2, mode:'water' })   water surface */
  function wave(material, opt = {}) {
    const amp = opt.amp == null ? 0.12 : opt.amp, freq = opt.freq || 3, speed = opt.speed || 4, mode = opt.mode || 'cloth', pin = opt.pin || 'left';
    const old = material.onBeforeCompile;
    material.onBeforeCompile = (sh, r) => {
      if (old) old(sh, r);
      sh.uniforms.uFxTime = time;
      sh.vertexShader = 'uniform float uFxTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          float fxA = ${amp.toFixed(4)}, fxF = ${freq.toFixed(4)}, fxS = ${speed.toFixed(4)};
          ${mode === 'sway'
            ? 'float fxH = max(0.0, transformed.y); transformed.x += sin(uFxTime*fxS + position.x*fxF + position.z*fxF*0.7) * fxA * fxH; transformed.z += cos(uFxTime*fxS*0.8 + position.z*fxF) * fxA * 0.5 * fxH;'
            : mode === 'water'
              ? 'transformed.z += (sin(position.x*fxF + uFxTime*fxS) + cos(position.y*fxF*1.3 + uFxTime*fxS*0.7)) * fxA;'
              : `#ifdef USE_UV
                 float fxU = ${pin === 'right' ? '1.0 - uv.x' : pin === 'top' ? '1.0 - uv.y' : pin === 'none' ? '1.0' : 'uv.x'};
                 #else
                 float fxU = 1.0;
                 #endif
                 transformed.z += sin(position.x*fxF - uFxTime*fxS) * cos(position.y*fxF*0.6 - uFxTime*fxS*0.5) * fxA * fxU;`}
        }`);
    };
    material.customProgramCacheKey = () => 'fxwave-' + mode + amp + freq + speed + pin;
    material.needsUpdate = true; waves.push(material); return material;
  }

  /* soft glowing light - a camera-facing sprite drawn with a distance-field falloff (no picture file).
     fx.glow({ color:'#fff6d8', size:3, pos:{x,y,z}, pulse:0 })  returns the THREE.Sprite */
  let glowTex = null;
  function glow(opt = {}) {
    if (!glowTex) glowTex = makeTex(THREE, (g, w, h) => {
      const img = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - w / 2 + 0.5, y - h / 2 + 0.5) / (w / 2), core = smooth(0.22, 0, d), halo = Math.pow(clamp(1 - d, 0, 1), 2.6);
        const a = clamp(core + halo * 0.85, 0, 1), i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = a * 255;
      }
      g.putImageData(img, 0, 0);
    }, 128, 128);
    const mat = new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(opt.color || '#fff6d8'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opt.opacity == null ? 1 : opt.opacity });
    const sp = new THREE.Sprite(mat); const s = opt.size || 2; sp.scale.set(s, s, 1); sp.name = 'fx-glow';
    if (opt.pos) sp.position.set(opt.pos.x || 0, opt.pos.y || 0, opt.pos.z || 0);
    sp.userData.fx = { base: s, pulse: opt.pulse || 0, speed: opt.pulseSpeed || 3, seed: Math.random() * 6 };
    (opt.parent || scene).add(sp); glows.push(sp); return sp;
  }

  /* ---- camera shake ("juice"): fx.shake(0.3, 0.4)  then draw with  fx.render(renderer, scene, camera)
     (it nudges the camera only while drawing, then puts it back, so your camera code never fights it).
     Linked already (shakes:false turns off): hit -> small shake, goal -> big shake. A pause/settings
     "less motion" choice: fx.setMotion(false) turns shakes off. */
  const shakeState = { amp: 0, dur: 0, t: 0, seed: Math.random() * 100, motion: true, count: 0 };
  function shake(amount = 0.25, seconds = 0.35) { if (!shakeState.motion) return; shakeState.amp = Math.max(shakeState.amp * (1 - shakeState.t / Math.max(0.001, shakeState.dur)), amount); shakeState.dur = seconds; shakeState.t = 0; shakeState.count++; }
  const _off = new THREE.Vector3();
  function render(renderer, sc, camera) {
    let k = 0;
    if (shakeState.t < shakeState.dur && shakeState.amp > 0) {
      const p = shakeState.t / shakeState.dur; k = shakeState.amp * (1 - p) * (1 - p);
      const tt = time.value * 38 + shakeState.seed;
      _off.set(Math.sin(tt) * k, Math.sin(tt * 1.3 + 1.7) * k * 0.7, Math.sin(tt * 0.9 + 3.1) * k * 0.5);
      camera.position.add(_off);
    }
    renderer.render(sc, camera);
    if (k) camera.position.sub(_off);
  }

  /* ---- slow motion ("bullet time"): fx.slowmo(0.25, 1.2) = quarter speed, easing back to normal over 1.2 s.
     fx.update(dt) RETURNS the game time step - use it for your game:  const gdt = fx.update(dt);
     Effects, waves and particles slow down too. Never during play the player controls - use it on goals,
     home runs, finishes, replays. */
  const slow = { scale: 1, from: 1, t: 0, dur: 0 };
  function slowmo(speed = 0.25, seconds = 1.2) { slow.from = clamp(speed, 0.05, 1); slow.scale = slow.from; slow.t = 0; slow.dur = seconds; }

  /* ---- light masks: bake lighting into a big floor/field mesh with vertex colours (free on phones).
     fx.lightMask(iceMesh, { mode:'arena', spots:4 })  bright overhead pools on rink ice, darker boards
     fx.lightMask(fieldMesh, { mode:'sun', dir:{x:1,z:-0.5} })  sunny side to shadow side, for open-air fields
     The mesh needs segments (e.g. PlaneGeometry(60, 30, 60, 30)). */
  function lightMask(mesh, opt = {}) {
    const geo = mesh.geometry, pos = geo.attributes.position; if (!pos) return mesh;
    geo.computeBoundingBox(); const bb = geo.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2, cz = (bb.min.z + bb.max.z) / 2;
    const sx = Math.max(1e-3, (bb.max.x - bb.min.x) / 2), sy = Math.max(1e-3, (bb.max.y - bb.min.y) / 2), sz = Math.max(1e-3, (bb.max.z - bb.min.z) / 2);
    const flatY = sy < 1e-2; // a PlaneGeometry lies in x/y before it is rotated
    const col = new Float32Array(pos.count * 3), mode = opt.mode || 'arena', lo = opt.min == null ? (mode === 'arena' ? 0.62 : 0.7) : opt.min, hi = opt.max == null ? 1.12 : opt.max;
    const spots = opt.spots || 4, d = opt.dir || { x: 1, z: -0.4 }, dl = Math.hypot(d.x || 0, d.z || 0) || 1;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) - cx) / sx, v = flatY ? (pos.getZ(i) - cz) / sz : (pos.getY(i) - cy) / sy; let f;
      if (mode === 'sun') f = lerp(lo, hi, (((u * (d.x || 0) + v * (d.z || 0)) / dl) * 0.5 + 0.5)) * (1 - 0.06 * (u * u + v * v));
      else { let b = 0; for (let k = 0; k < spots; k++) { const px = -0.75 + 1.5 * (spots === 1 ? 0.5 : k / (spots - 1)); b = Math.max(b, Math.exp(-((u - px) ** 2 * 5 + (v * 0.9) ** 2 * 3))); } f = lerp(lo, hi, b) * (1 - 0.18 * Math.max(Math.abs(u), Math.abs(v)) ** 4); }
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = f;
      if (opt.tint) { const tc = new THREE.Color(opt.tint); col[i * 3] *= tc.r; col[i * 3 + 1] *= tc.g; col[i * 3 + 2] *= tc.b; }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; for (const m of mats) { m.vertexColors = true; m.needsUpdate = true; }
    return mesh;
  }
  const fx = {
    version: VERSION, time, math, kinds: Object.keys(KINDS), tex: texKit(THREE),
    on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); return () => fx.off(name, fn); },
    off(name, fn) { const l = listeners[name]; if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } },
    emit(name, data) { const l = listeners[name]; if (!l) return 0; for (const fn of l.slice()) { try { fn(data); } catch (e) { console.error('[ApexFX]', name, e); } } return l.length; },
    when(event, kind, opt) { return fx.on(event, (d) => burst(kind, d && (d.pos || d), Object.assign({}, opt, d && d.opts))); },
    /* a sound on an event: fx.sound('goal', 'horn') - plays the kit's sound (ApexKit.audio) every time 'goal' is emitted.
       A function works too: fx.sound('bounce', (t, bus, ctx) => {...}). Default links (sounds:false turns them off):
       goal -> horn, score -> score, hit -> hit, whistle -> whistle, boost -> boost */
    sound(event, name) { return fx.on(event, () => { try { const K = window.ApexKit; if (K && K.audio) { K.audio.sfx(name); fx._sounds++; } } catch (e) {} }); },
    burst, flashes, wave, glow, shake, render, slowmo, lightMask,
    setMotion(on) { shakeState.motion = !!on; if (!on) shakeState.amp = 0; },
    get timeScale() { return slow.scale; },
    setQuality(q) { quality = q === 'low' || q === 'medium' ? q : 'high'; },
    update(dt) {
      dt = Math.min(0.05, Math.max(0, +dt || 0));
      if (slow.dur > 0) { slow.t += dt; const p = clamp(slow.t / slow.dur, 0, 1); slow.scale = lerp(slow.from, 1, p * p * (3 - 2 * p)); if (p >= 1) { slow.dur = 0; slow.scale = 1; } }
      shakeState.t += dt;
      dt *= slow.scale; time.value += dt;
      const alive = stepSystems(dt); stepFlashes(dt);
      for (const g of glows) { const u = g.userData.fx; if (u.pulse) { const k = u.base * (1 + Math.sin(time.value * u.speed + u.seed) * u.pulse); g.scale.set(k, k, 1); } }
      fx._alive = alive;
      return dt;
    },
    clear() { for (const k in systems) { systems[k].life.fill(0); systems[k].alpha.fill(0); } },
    stats() { return { version: VERSION, time: +time.value.toFixed(2), bursts, particles: fx._alive || 0, kinds: Object.keys(systems), alive: Object.fromEntries(Object.keys(systems).map((k) => [k, systems[k].alive])), flashes: flashSets.reduce((a, f) => a + f.count, 0), waves: waves.length, glows: glows.length, sounds: fx._sounds, shakes: shakeState.count, shaking: shakeState.t < shakeState.dur && shakeState.amp > 0, timeScale: +slow.scale.toFixed(2), quality }; },
    _alive: 0, _sounds: 0,
  };
  if (o.shakes !== false) { fx.on('hit', (d) => shake((d && d.shake) || 0.12, 0.25)); fx.on('goal', (d) => shake((d && d.shake) || 0.35, 0.6)); }
  if (o.sounds !== false) for (const [ev, snd] of [['goal', 'horn'], ['score', 'score'], ['hit', 'hit'], ['whistle', 'whistle'], ['boost', 'boost']]) fx.sound(ev, snd);
  try {
    const K = window.ApexKit;
    if (K) {
      if (K.test) K.test.expose({ fx: () => fx.stats() });
      /* one signal for everything: ApexKit.emit('goal', { pos }) == fx.emit(...) - sound AND effects answer it */
      if (!K.emit) { K.emit = fx.emit; K.on = fx.on; K.off = fx.off; }
    }
  } catch (e) {}
  return fx;
}

const ApexFX = { version: VERSION, create, math, kinds: Object.keys(KINDS) };
if (typeof window !== 'undefined') window.ApexFX = ApexFX;
export { ApexFX };
export default ApexFX;
