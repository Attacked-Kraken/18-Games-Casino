/* =====================================================================
   level-loader.js : Apex Level format v1 (loads levels made in level-editor.html)
   Plain JavaScript, no dependencies, works offline.

   ApexLevel.parse(jsonOrObject)   -> level  (throws Error with a readable message)
   ApexLevel.toJSON(level)         -> plain object, ready for JSON.stringify
   ApexLevel.load(url)             -> Promise<level>   (fetch; needs http(s), not file://)
   ApexLevel.fromStorage(id)       -> level or null    (levels saved by the editor)
   ApexLevel.listStorage()         -> [{id,name,updated}]
   ApexLevel.get(level,layer,x,y)  -> cell {t,...} or undefined
   ApexLevel.each(level,fn)        -> fn(cell,layer,x,y) for every placed tile
   ApexLevel.find(level,type)      -> first {x,y,t,...} of that type, or null
   ApexLevel.findAll(level,type)   -> array
   ApexLevel.count(level,type)     -> number
   ApexLevel.isSolid(type)         -> true for walls/floors the player stands on
   ApexLevel.drawTile(ctx,type,px,py,size,timeSeconds)   draws one tile with canvas
   ApexLevel.drawLevel(ctx,level,offsetX,offsetY,size,time,visibleLayers)
   ApexLevel.THEMES[name] -> [skyTop, skyBottom]

   FILE FORMAT (JSON)
   { "format":"apex-level", "version":1, "name":"Green Start", "author":"", "theme":"sky",
     "width":60, "height":18,            // grid size in tiles, (0,0) = top-left
     "tiles":[ {"x":0,"y":16,"t":"grass"}, {"x":9,"y":12,"t":"platform_h","range":3,"speed":1.5} ] }
   Each tile type lives on one layer: decor, terrain, items or actors (see TYPES).
   One tile per layer per cell. "start" and "finish" appear once.
   ===================================================================== */
(function (G) {
  var LAYERS = ['decor', 'terrain', 'items', 'actors'];
  function T(layer, label, o) { o = o || {}; o.layer = layer; o.label = label; return o; }
  var TYPES = {
    grass: T('terrain', 'Grass', { solid: 1 }), block: T('terrain', 'Block', { solid: 1 }),
    brick: T('terrain', 'Brick', { solid: 1 }), stone: T('terrain', 'Stone', { solid: 1 }),
    ice: T('terrain', 'Ice', { solid: 1, slippery: 1 }), crate: T('terrain', 'Crate', { solid: 1 }),
    sand: T('terrain', 'Sand', { solid: 1 }), snow: T('terrain', 'Snow', { solid: 1 }),
    spring: T('terrain', 'Spring', { solid: 1, bounce: 1 }),
    spikes: T('terrain', 'Spikes', { hazard: 1 }), lava: T('terrain', 'Lava', { hazard: 1 }),
    platform_h: T('terrain', 'Moving platform (sideways)', { moving: 'x', props: { range: 3, speed: 1.5 } }),
    platform_v: T('terrain', 'Moving platform (up/down)', { moving: 'y', props: { range: 3, speed: 1.5 } }),
    coin: T('items', 'Coin'), coin_big: T('items', 'Big coin (5)'), star: T('items', 'Star'),
    gem: T('items', 'Gem (10 coins)'), heart: T('items', 'Extra life'),
    pw_speed: T('items', 'Power-up: speed'), pw_shield: T('items', 'Power-up: shield'),
    pw_magnet: T('items', 'Power-up: coin magnet'), pw_jump: T('items', 'Power-up: high jump'),
    start: T('actors', 'Start', { unique: 1 }), finish: T('actors', 'Finish', { unique: 1 }),
    checkpoint: T('actors', 'Checkpoint'),
    enemy_walker: T('actors', 'Enemy: walker', { enemy: 1, stomp: 1, props: { speed: 2 } }),
    enemy_flyer: T('actors', 'Enemy: flyer', { enemy: 1, stomp: 1, props: { range: 2, speed: 2 } }),
    enemy_spiky: T('actors', 'Enemy: spiky (no stomp)', { enemy: 1, props: { speed: 1.2 } }),
    enemy_hopper: T('actors', 'Enemy: hopper', { enemy: 1, stomp: 1 }),
    bush: T('decor', 'Bush'), flower: T('decor', 'Flower'), tree: T('decor', 'Tree'),
    rock: T('decor', 'Rock'), cloud: T('decor', 'Cloud'), sign: T('decor', 'Sign'),
    mushroom: T('decor', 'Mushroom'), lamp: T('decor', 'Lamp')
  };
  var THEMES = { sky: ['#6ec6ff', '#d9f2ff'], night: ['#0b1236', '#30306e'], cave: ['#1d1a24', '#3c3346'],
    desert: ['#ffb36b', '#ffe6b0'], snow: ['#a9d6ff', '#f2f8ff'], candy: ['#ff9ad5', '#ffe0f2'],
    volcano: ['#3a0d0d', '#a8341c'], ocean: ['#2a8bd6', '#9be3ff'] };

  function isSolid(t) { var d = TYPES[t]; return !!(d && d.solid); }
  function key(x, y) { return x + ',' + y; }

  function parse(src) {
    var o = src;
    if (typeof src === 'string') { try { o = JSON.parse(src); } catch (e) { throw new Error('Not valid JSON: ' + e.message); } }
    if (!o || typeof o !== 'object') throw new Error('Level must be a JSON object');
    if (o.format && o.format !== 'apex-level') throw new Error('Not an Apex level (format = ' + o.format + ')');
    var w = Math.round(+o.width), h = Math.round(+o.height);
    if (!(w >= 8 && w <= 400 && h >= 6 && h <= 200)) throw new Error('width must be 8-400 and height 6-200');
    var L = { format: 'apex-level', version: 1, name: String(o.name || 'Untitled'), author: String(o.author || ''),
      theme: THEMES[o.theme] ? o.theme : 'sky', width: w, height: h, layers: {} };
    LAYERS.forEach(function (n) { L.layers[n] = {}; });
    (o.tiles || []).forEach(function (c) {
      var d = TYPES[c.t]; if (!d) return;                       // unknown types are skipped
      var x = Math.round(c.x), y = Math.round(c.y);
      if (!(x >= 0 && y >= 0 && x < w && y < h)) return;
      var cell = { t: c.t }, p = d.props || {};
      for (var k in p) cell[k] = (c[k] != null && isFinite(c[k])) ? +c[k] : p[k];
      L.layers[d.layer][key(x, y)] = cell;
    });
    return L;
  }
  function toJSON(L) {
    var tiles = [];
    each(L, function (c, layer, x, y) { var o = { x: x, y: y }; for (var k in c) o[k] = c[k]; tiles.push(o); });
    tiles.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    return { format: 'apex-level', version: 1, name: L.name, author: L.author || '', theme: L.theme,
      width: L.width, height: L.height, tiles: tiles };
  }
  function each(L, fn) {
    LAYERS.forEach(function (n) { var m = L.layers[n]; for (var k in m) { var i = k.indexOf(','); fn(m[k], n, +k.slice(0, i), +k.slice(i + 1)); } });
  }
  function get(L, layer, x, y) { return L.layers[layer][key(x, y)]; }
  function findAll(L, t) { var r = []; each(L, function (c, l, x, y) { if (c.t === t) { var o = { x: x, y: y }; for (var k in c) o[k] = c[k]; r.push(o); } }); return r; }
  function find(L, t) { return findAll(L, t)[0] || null; }
  function count(L, t) { return findAll(L, t).length; }
  function load(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(parse); }
  function store() { try { return JSON.parse(localStorage.getItem('apexLevels.v1') || '{}'); } catch (e) { return {}; } }
  function fromStorage(id) { var s = store()[id]; return s ? parse(s.level) : null; }
  function listStorage() { var s = store(), r = []; for (var id in s) r.push({ id: id, name: s[id].level.name, updated: s[id].updated }); return r.sort(function (a, b) { return b.updated - a.updated; }); }

  /* ---------------- drawing (all procedural, no images) ---------------- */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function star(c, cx, cy, R, r, n) { c.beginPath(); for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; c.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } c.closePath(); }
  function fill(c, col) { c.fillStyle = col; c.fill(); }
  function ball(c, x, y, r, col, rim) { c.beginPath(); c.arc(x, y, r, 0, 7); fill(c, col); if (rim) { c.lineWidth = r * .18; c.strokeStyle = rim; c.stroke(); } }
  function eyes(c, x, y, s, dir) { dir = dir || 0; [-1, 1].forEach(function (k) { ball(c, x + k * s * .14, y, s * .1, '#fff'); ball(c, x + k * s * .14 + dir * s * .03, y, s * .05, '#1b1b2e'); }); }
  function flag(c, x, y, s, col, checker) {
    c.fillStyle = '#5a5f73'; c.fillRect(x + s * .2, y + s * .08, s * .08, s * .9);
    if (checker) { for (var i = 0; i < 3; i++) for (var j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#fff'; c.fillRect(x + s * .28 + j * s * .15, y + s * .1 + i * s * .13, s * .15, s * .13); } }
    else { c.beginPath(); c.moveTo(x + s * .28, y + s * .1); c.lineTo(x + s * .9, y + s * .28); c.lineTo(x + s * .28, y + s * .48); fill(c, col); }
    rr(c, x + s * .08, y + s * .9, s * .34, s * .1, s * .04); fill(c, '#3c4156');
  }
  function drawTile(c, t, x, y, s, time) {
    time = time || 0; var cx = x + s / 2, cy = y + s / 2;
    c.save();
    switch (t) {
      case 'grass': c.fillStyle = '#9a5b2e'; c.fillRect(x, y, s, s); c.fillStyle = '#7d4522'; c.fillRect(x + s * .2, y + s * .55, s * .14, s * .12); c.fillRect(x + s * .62, y + s * .75, s * .12, s * .1);
        c.fillStyle = '#4fc94a'; c.fillRect(x, y, s, s * .3); c.fillStyle = '#7be36a'; c.fillRect(x, y, s, s * .1); break;
      case 'block': rr(c, x + 1, y + 1, s - 2, s - 2, s * .15); fill(c, '#5f7fb0'); rr(c, x + s * .14, y + s * .12, s * .72, s * .3, s * .1); fill(c, '#8fb0e0'); break;
      case 'brick': c.fillStyle = '#d86a3a'; c.fillRect(x, y, s, s); c.fillStyle = '#8a3d1e';
        c.fillRect(x, y + s * .47, s, s * .06); c.fillRect(x, y, s, s * .05); c.fillRect(x + s * .5, y, s * .06, s * .5); c.fillRect(x + s * .2, y + s * .5, s * .06, s * .5); c.fillRect(x + s * .75, y + s * .5, s * .06, s * .5); break;
      case 'stone': rr(c, x + 1, y + 1, s - 2, s - 2, s * .2); fill(c, '#8b8f9c'); ball(c, x + s * .3, y + s * .35, s * .1, '#a5a9b5'); ball(c, x + s * .66, y + s * .62, s * .13, '#767a87'); break;
      case 'ice': rr(c, x + 1, y + 1, s - 2, s - 2, s * .12); fill(c, '#a8e8ff'); c.beginPath(); c.moveTo(x + s * .2, y + s * .7); c.lineTo(x + s * .6, y + s * .2); c.lineTo(x + s * .75, y + s * .2); c.lineTo(x + s * .35, y + s * .7); fill(c, '#e8fbff'); break;
      case 'sand': c.fillStyle = '#e8c27a'; c.fillRect(x, y, s, s); c.fillStyle = '#d4a85c'; [[.2, .3], [.6, .5], [.35, .78], [.8, .2]].forEach(function (p) { c.fillRect(x + s * p[0], y + s * p[1], s * .08, s * .08); }); c.fillStyle = '#f5d999'; c.fillRect(x, y, s, s * .12); break;
      case 'snow': c.fillStyle = '#7a8ca8'; c.fillRect(x, y, s, s); c.fillStyle = '#fff'; c.fillRect(x, y, s, s * .34); ball(c, x + s * .25, y + s * .34, s * .12, '#fff'); ball(c, x + s * .7, y + s * .34, s * .1, '#fff'); break;
      case 'crate': c.fillStyle = '#b77a3c'; c.fillRect(x + 1, y + 1, s - 2, s - 2); c.strokeStyle = '#7a4a1e'; c.lineWidth = s * .1; c.strokeRect(x + s * .08, y + s * .08, s * .84, s * .84);
        c.beginPath(); c.moveTo(x + s * .12, y + s * .12); c.lineTo(x + s * .88, y + s * .88); c.moveTo(x + s * .88, y + s * .12); c.lineTo(x + s * .12, y + s * .88); c.stroke(); break;
      case 'spring': rr(c, x + s * .1, y + s * .75, s * .8, s * .25, s * .06); fill(c, '#555b70'); c.strokeStyle = '#c7ccd8'; c.lineWidth = s * .08; c.beginPath();
        for (var i = 0; i < 4; i++) { c.moveTo(x + s * .25, y + s * (.72 - i * .12)); c.lineTo(x + s * .75, y + s * (.66 - i * .12)); } c.stroke(); rr(c, x + s * .05, y + s * .12, s * .9, s * .16, s * .06); fill(c, '#ff4b5f'); break;
      case 'spikes': for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + k * s / 3, y + s); c.lineTo(x + (k + .5) * s / 3, y + s * .35); c.lineTo(x + (k + 1) * s / 3, y + s); fill(c, '#c9cdd8'); c.beginPath(); c.moveTo(x + (k + .5) * s / 3, y + s * .35); c.lineTo(x + (k + 1) * s / 3, y + s); c.lineTo(x + (k + .5) * s / 3, y + s); fill(c, '#8e93a3'); } break;
      case 'lava': c.fillStyle = '#ff5a1f'; c.fillRect(x, y + s * .2, s, s * .8); c.fillStyle = '#ffb21f'; c.beginPath(); c.moveTo(x, y + s * .3);
        for (var j = 0; j <= 8; j++) c.lineTo(x + j * s / 8, y + s * (.25 + .08 * Math.sin(j * 1.6 + time * 4 + x * .1))); c.lineTo(x + s, y + s * .5); c.lineTo(x, y + s * .5); fill(c, '#ffb21f');
        ball(c, x + s * (.3 + .1 * Math.sin(time * 2 + x)), y + s * .7, s * .07, '#ffe07a'); break;
      case 'platform_h': case 'platform_v': rr(c, x + 1, y + s * .05, s - 2, s * .4, s * .12); fill(c, '#9b5cff'); rr(c, x + s * .1, y + s * .1, s * .8, s * .1, s * .05); fill(c, '#c9a6ff');
        c.fillStyle = '#ffffffcc'; c.font = 'bold ' + (s * .45) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t === 'platform_h' ? '\u2194' : '\u2195', cx, y + s * .72); break;
      case 'coin': case 'coin_big': var sq = Math.abs(Math.cos(time * 3 + x * .05)) * .7 + .3, R = s * (t === 'coin' ? .3 : .42);
        c.beginPath(); c.ellipse(cx, cy, R * sq, R, 0, 0, 7); fill(c, '#f1b31c'); c.beginPath(); c.ellipse(cx, cy, R * sq * .65, R * .65, 0, 0, 7); fill(c, '#ffe46b');
        if (t === 'coin_big') { c.fillStyle = '#b07a00'; c.font = 'bold ' + (s * .36) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('5', cx, cy + 1); } break;
      case 'star': c.translate(cx, cy); c.rotate(Math.sin(time * 2) * .15); star(c, 0, 0, s * .42, s * .19, 5); fill(c, '#ffd23f'); c.lineWidth = s * .06; c.strokeStyle = '#e09a00'; c.stroke(); break;
      case 'gem': c.beginPath(); c.moveTo(cx - s * .3, cy - s * .15); c.lineTo(cx - s * .15, cy - s * .32); c.lineTo(cx + s * .15, cy - s * .32); c.lineTo(cx + s * .3, cy - s * .15); c.lineTo(cx, cy + s * .35); fill(c, '#3fe0f0'); c.beginPath(); c.moveTo(cx - s * .15, cy - s * .32); c.lineTo(cx, cy - s * .15); c.lineTo(cx + s * .15, cy - s * .32); fill(c, '#c9fbff'); break;
      case 'heart': c.translate(cx, cy + s * .05 + Math.sin(time * 4) * s * .03); c.beginPath(); c.moveTo(0, s * .3); c.bezierCurveTo(-s * .5, 0, -s * .3, -s * .4, 0, -s * .15); c.bezierCurveTo(s * .3, -s * .4, s * .5, 0, 0, s * .3); fill(c, '#ff4b6e'); break;
      case 'pw_speed': case 'pw_shield': case 'pw_magnet': case 'pw_jump':
        ball(c, cx, cy, s * .4, { pw_speed: '#46c94f', pw_shield: '#3b9cff', pw_magnet: '#ff4b5f', pw_jump: '#ff8a1f' }[t], '#ffffffaa');
        c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = s * .08; c.beginPath();
        if (t === 'pw_speed') { c.moveTo(cx + s * .05, cy - s * .25); c.lineTo(cx - s * .14, cy + s * .03); c.lineTo(cx, cy + s * .03); c.lineTo(cx - s * .05, cy + s * .25); c.lineTo(cx + s * .14, cy - s * .03); c.lineTo(cx, cy - s * .03); c.closePath(); c.fill(); }
        else if (t === 'pw_shield') { c.moveTo(cx, cy - s * .22); c.lineTo(cx + s * .18, cy - s * .14); c.quadraticCurveTo(cx + s * .16, cy + s * .14, cx, cy + s * .24); c.quadraticCurveTo(cx - s * .16, cy + s * .14, cx - s * .18, cy - s * .14); c.closePath(); c.fill(); }
        else if (t === 'pw_magnet') { c.arc(cx, cy, s * .15, Math.PI, 0, true); c.moveTo(cx - s * .15, cy); c.lineTo(cx - s * .15, cy - s * .15); c.moveTo(cx + s * .15, cy); c.lineTo(cx + s * .15, cy - s * .15); c.stroke(); }
        else { c.moveTo(cx, cy - s * .24); c.lineTo(cx + s * .18, cy); c.lineTo(cx + s * .06, cy); c.lineTo(cx + s * .06, cy + s * .22); c.lineTo(cx - s * .06, cy + s * .22); c.lineTo(cx - s * .06, cy); c.lineTo(cx - s * .18, cy); c.closePath(); c.fill(); }
        break;
      case 'start': flag(c, x, y, s, '#46c94f'); break;
      case 'finish': flag(c, x, y, s, '', 1); break;
      case 'checkpoint': flag(c, x, y, s, '#3b9cff'); break;
      case 'enemy_walker': var b = Math.abs(Math.sin(time * 6)) * s * .05; c.beginPath(); c.moveTo(x + s * .1, y + s * .95); c.quadraticCurveTo(x + s * .1, y + s * .2 - b, cx, y + s * .2 - b); c.quadraticCurveTo(x + s * .9, y + s * .2 - b, x + s * .9, y + s * .95); fill(c, '#9b5cff'); eyes(c, cx, y + s * .5, s); break;
      case 'enemy_flyer': var f = Math.sin(time * 14) * .3; c.fillStyle = '#ffffffdd';
        c.beginPath(); c.ellipse(cx - s * .3, cy - s * .1, s * .2, s * .1, -.5 + f, 0, 7); c.fill(); c.beginPath(); c.ellipse(cx + s * .3, cy - s * .1, s * .2, s * .1, .5 - f, 0, 7); c.fill(); ball(c, cx, cy, s * .28, '#ff4b5f'); eyes(c, cx, cy - s * .02, s); break;
      case 'enemy_spiky': c.translate(cx, cy + s * .05); c.rotate(time * 2); star(c, 0, 0, s * .45, s * .28, 9); fill(c, '#3c4156'); c.rotate(-time * 2); ball(c, 0, 0, s * .26, '#59607a'); eyes(c, 0, 0, s); break;
      case 'enemy_hopper': var hp = Math.max(0, Math.sin(time * 4)) * s * .12; c.beginPath(); c.ellipse(cx, y + s * .65 - hp, s * .38, s * .3, 0, 0, 7); fill(c, '#46c94f'); eyes(c, cx, y + s * .52 - hp, s); break;
      case 'bush': ball(c, x + s * .3, y + s * .72, s * .26, '#2f9e44'); ball(c, x + s * .66, y + s * .7, s * .28, '#37b24d'); ball(c, cx, y + s * .55, s * .26, '#40c057'); break;
      case 'flower': c.fillStyle = '#2f9e44'; c.fillRect(cx - s * .03, y + s * .5, s * .06, s * .5); for (var p = 0; p < 5; p++) ball(c, cx + Math.cos(p * 1.26) * s * .14, y + s * .4 + Math.sin(p * 1.26) * s * .14, s * .1, '#ff7ac8'); ball(c, cx, y + s * .4, s * .08, '#ffd23f'); break;
      case 'tree': c.fillStyle = '#8a5a2b'; c.fillRect(cx - s * .07, y + s * .55, s * .14, s * .45); ball(c, cx, y + s * .38, s * .32, '#2b8a3e'); ball(c, cx - s * .12, y + s * .3, s * .14, '#40c057'); break;
      case 'rock': c.beginPath(); c.moveTo(x + s * .1, y + s); c.lineTo(x + s * .25, y + s * .55); c.lineTo(x + s * .6, y + s * .45); c.lineTo(x + s * .9, y + s * .7); c.lineTo(x + s * .95, y + s); fill(c, '#868e96'); break;
      case 'cloud': ball(c, x + s * .3, cy, s * .2, '#ffffffdd'); ball(c, x + s * .55, cy - s * .08, s * .25, '#ffffffdd'); ball(c, x + s * .75, cy + s * .04, s * .17, '#ffffffdd'); break;
      case 'sign': c.fillStyle = '#8a5a2b'; c.fillRect(cx - s * .05, y + s * .5, s * .1, s * .5); rr(c, x + s * .12, y + s * .18, s * .76, s * .38, s * .06); fill(c, '#c9894a'); c.fillStyle = '#6b3f17'; c.fillRect(x + s * .25, y + s * .3, s * .5, s * .05); c.fillRect(x + s * .25, y + s * .41, s * .36, s * .05); break;
      case 'mushroom': c.fillStyle = '#f1e3c8'; c.fillRect(cx - s * .1, y + s * .55, s * .2, s * .45); c.beginPath(); c.arc(cx, y + s * .58, s * .34, Math.PI, 0); fill(c, '#ff4b5f'); ball(c, cx - s * .14, y + s * .45, s * .06, '#fff'); ball(c, cx + s * .12, y + s * .4, s * .07, '#fff'); break;
      case 'lamp': c.fillStyle = '#3c4156'; c.fillRect(cx - s * .04, y + s * .3, s * .08, s * .7); var gl = .5 + .15 * Math.sin(time * 3); c.globalAlpha = gl; ball(c, cx, y + s * .25, s * .3, '#ffe46b'); c.globalAlpha = 1; ball(c, cx, y + s * .25, s * .13, '#fff6c2'); break;
      default: c.fillStyle = '#f0f'; c.fillRect(x, y, s, s);
    }
    c.restore();
  }
  function drawLevel(c, L, ox, oy, s, time, vis) {
    LAYERS.forEach(function (n) {
      if (vis && !vis[n]) return; var m = L.layers[n];
      for (var k in m) { var i = k.indexOf(','), x = +k.slice(0, i), y = +k.slice(i + 1), px = ox + x * s, py = oy + y * s;
        if (px > -s && py > -s && px < c.canvas.width + s && py < c.canvas.height + s) drawTile(c, m[k].t, px, py, s, time); }
    });
  }
  G.ApexLevel = { LAYERS: LAYERS, TYPES: TYPES, THEMES: THEMES, parse: parse, toJSON: toJSON, load: load, fromStorage: fromStorage,
    listStorage: listStorage, get: get, each: each, find: find, findAll: findAll, count: count, isSolid: isSolid, drawTile: drawTile, drawLevel: drawLevel, key: key };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.ApexLevel;
