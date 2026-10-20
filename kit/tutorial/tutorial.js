/* =====================================================================
   tutorial.js : Apex Tutorial Kit (drop-in, no dependencies, works offline)
   Uses the UI-Art-Kit color styles: sky, lime, sunset, grape, cherry.

   SHOW ONCE
     ApexTutorial.once('intro-v1', function (done) { ...show things...; done(); });  // runs only the first time
     ApexTutorial.seen('intro-v1')  ApexTutorial.markSeen('intro-v1')  ApexTutorial.reset('intro-v1')  ApexTutorial.resetAll()
   HAND / GESTURE HINTS  (all return a handle with .remove())
     ApexTutorial.tap(target)                 // target = element, CSS selector, or {x,y} in page pixels
     ApexTutorial.doubleTap(target)   ApexTutorial.hold(target, {seconds:1.2})
     ApexTutorial.swipe(target, 'left'|'right'|'up'|'down', {distance:140})
     ApexTutorial.drag(fromTarget, toTarget)
     ApexTutorial.tilt({ side: 'both'|'left'|'right' })        // phone tilting icon, centered
     ApexTutorial.pinch(target)
     ApexTutorial.arrow(target, { dir: 'down', text: 'Here!' }) // bouncing arrow pointing at target
   HIGHLIGHT
     ApexTutorial.spotlight(target, { padding: 10, shape: 'round'|'circle', text: 'Tap to jump', block: true })
     ApexTutorial.ring(target)                 // pulsing ring, no dimming
   STEPS (guided tour)
     ApexTutorial.steps([
       { target: '#jump', text: 'Tap to jump', gesture: 'tap', waitFor: 'click' },  // waits for a real click on target
       { target: '#joy',  text: 'Drag to steer', gesture: 'drag', to: '#goal', waitFor: 3000 },  // or ms
       { text: 'Tilt your phone to lean', gesture: 'tilt' },                       // no target => Next button
     ], { onDone: fn, skippable: true, id: 'tour-v1' })   // id => shows only once
   HOW-TO-PLAY CARDS
     ApexTutorial.cards([{ icon: 'tap', title: 'Jump', text: 'Tap anywhere to jump.' }, ...], { onDone: fn, id: 'howto-v1' })
     icons: tap, swipe, drag, hold, tilt, coin, star, heart, trophy, clock, shield, bolt
   STYLE   ApexTutorial.setStyle('grape')   ApexTutorial.clear()   (removes everything on screen)
   ===================================================================== */
(function (G) {
  var STY = { sky: ['#3b9cff', '#1f6fc4'], lime: ['#46c94f', '#2e9636'], sunset: ['#ff8a1f', '#c9640c'], grape: ['#9b5cff', '#6a35c4'], cherry: ['#ff4b5f', '#c22c3e'] };
  var KEY = 'apexTutorial.seen.', cur = 'sky', live = [];
  var CSS = '.apxt{position:fixed;z-index:9000;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;--c:#3b9cff;--cd:#1f6fc4;--ink:#141a33}' +
    '.apxt-hand{width:64px;height:64px;margin:-6px 0 0 -18px;filter:drop-shadow(0 4px 4px rgba(0,0,0,.35))}' +
    '.apxt-tap .apxt-hand{animation:apxtTap 1.2s infinite}.apxt-dbl .apxt-hand{animation:apxtDbl 1.4s infinite}@keyframes apxtTap{0%,100%{transform:translate(8px,10px) scale(1)}40%{transform:translate(0,0) scale(.88)}55%{transform:translate(0,0) scale(.88)}}' +
    '@keyframes apxtDbl{0%,100%{transform:translate(8px,10px)}15%,35%{transform:translate(0,0) scale(.88)}25%{transform:translate(3px,4px)}}' +
    '.apxt-ripple{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:4px solid var(--c);opacity:0;animation:apxtRip 1.2s infinite}.apxt-dbl .apxt-ripple{animation:apxtRip 1.4s infinite}@keyframes apxtRip{0%,38%{opacity:0;transform:scale(.3)}45%{opacity:.9}100%{opacity:0;transform:scale(1.6)}}' +
    '.apxt-hold .apxt-hand{animation:apxtHold var(--hd,1.6s) infinite}.apxt-hold .apxt-fill{position:absolute;left:-26px;top:-26px;width:52px;height:52px}.apxt-hold .apxt-fill circle{fill:none;stroke:var(--c);stroke-width:5;stroke-dasharray:151;stroke-dashoffset:151;animation:apxtFill var(--hd,1.6s) infinite;transform:rotate(-90deg);transform-origin:26px 26px}' +
    '@keyframes apxtHold{0%,100%{transform:translate(8px,10px)}15%,85%{transform:translate(0,0) scale(.88)}}@keyframes apxtFill{0%,15%{stroke-dashoffset:151}80%{stroke-dashoffset:0}100%{stroke-dashoffset:0;opacity:0}}' +
    '.apxt-move{animation:apxtMove var(--md,1.6s) cubic-bezier(.5,0,.4,1) infinite}@keyframes apxtMove{0%{transform:translate(0,0);opacity:0}12%{opacity:1;transform:translate(0,0)}75%{transform:translate(var(--dx),var(--dy));opacity:1}90%,100%{transform:translate(var(--dx),var(--dy));opacity:0}}' +
    '.apxt-trail{position:absolute;height:10px;border-radius:5px;background:linear-gradient(90deg,transparent,var(--c));opacity:.55;transform-origin:0 50%}' +
    '.apxt-tilt{left:50%;top:42%;transform:translate(-50%,-50%)}.apxt-tilt svg{width:110px;height:110px;animation:apxtTilt 2.4s ease-in-out infinite;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))}' +
    '@keyframes apxtTilt{0%,100%{transform:rotate(0)}25%{transform:rotate(var(--tl,-24deg))}75%{transform:rotate(var(--tr,24deg))}}' +
    '.apxt-arrow{animation:apxtBob .8s ease-in-out infinite alternate}@keyframes apxtBob{to{transform:translate(var(--bx,0),var(--by,10px))}}.apxt-arrow svg{display:block;filter:drop-shadow(0 3px 3px rgba(0,0,0,.35))}' +
    '.apxt-label{position:absolute;white-space:nowrap;background:#fff;color:var(--ink);font-weight:800;font-size:15px;padding:6px 12px;border-radius:12px;box-shadow:0 3px 0 rgba(0,0,0,.25);transform:translate(-50%,0)}' +
    '.apxt-dim{inset:0;transition:opacity .25s}.apxt-dim.block{pointer-events:auto}.apxt-hole{position:absolute;box-shadow:0 0 0 200vmax rgba(8,12,30,.62);border-radius:18px;transition:all .3s}.apxt-hole.circle{border-radius:50%}' +
    '.apxt-hole:after{content:"";position:absolute;inset:-6px;border-radius:inherit;border:4px solid var(--c);animation:apxtPulse 1.2s infinite}@keyframes apxtPulse{50%{inset:-12px;opacity:.4}}' +
    '.apxt-ring{position:absolute;border-radius:50%;border:5px solid var(--c);animation:apxtRing 1.2s infinite;box-shadow:0 0 18px var(--c)}@keyframes apxtRing{50%{transform:scale(1.12);opacity:.5}}' +
    '.apxt-tip{position:absolute;max-width:min(80vw,320px);background:#fff;color:var(--ink);border-radius:18px;padding:12px 14px;font-size:16px;font-weight:700;line-height:1.3;box-shadow:0 5px 0 rgba(0,0,0,.25);border:3px solid var(--c);pointer-events:auto}' +
    '.apxt-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}.apxt-b{appearance:none;border:0;border-radius:12px;background:var(--c);color:#fff;font:800 14px system-ui,sans-serif;padding:9px 14px;box-shadow:0 4px 0 var(--cd);cursor:pointer}.apxt-b:active{transform:translateY(3px);box-shadow:0 1px 0 var(--cd)}.apxt-b.ghost{background:#e6ebf5;color:var(--ink);box-shadow:0 4px 0 #b9c2d6}' +
    '.apxt-cards{inset:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;background:rgba(8,12,30,.62);padding:16px}' +
    '.apxt-card{width:min(92vw,360px);background:#fff;color:var(--ink);border-radius:24px;border:4px solid var(--c);box-shadow:0 8px 0 rgba(0,0,0,.25);overflow:hidden;text-align:center}' +
    '.apxt-card .hd{background:var(--c);padding:22px 0 16px}.apxt-card .hd svg{width:96px;height:96px}.apxt-card h3{margin:14px 16px 6px;font-size:22px}.apxt-card p{margin:0 18px;font-size:16px;line-height:1.35;min-height:44px;font-weight:600;color:#3a4260}' +
    '.apxt-dots{display:flex;gap:6px;justify-content:center;margin:14px 0 4px}.apxt-dots i{width:9px;height:9px;border-radius:50%;background:#cfd6e6}.apxt-dots i.on{background:var(--c);width:22px;border-radius:5px}.apxt-card .apxt-btns{padding:8px 14px 16px;justify-content:space-between}';
  function css() { if (document.getElementById('apxt-css')) return; var s = document.createElement('style'); s.id = 'apxt-css'; s.textContent = CSS; document.head.appendChild(s); }
  function el(cls, html, style) { var e = document.createElement('div'); e.className = 'apxt ' + (cls || ''); if (html) e.innerHTML = html; if (style) e.style.cssText += style; var c = STY[cur]; e.style.setProperty('--c', c[0]); e.style.setProperty('--cd', c[1]); document.body.appendChild(e); live.push(e); return e; }
  function rect(t) { if (t && t.x != null && t.getBoundingClientRect == null) return { left: t.x - (t.w || 0) / 2, top: t.y - (t.h || 0) / 2, width: t.w || 0, height: t.h || 0 }; var e = typeof t === 'string' ? document.querySelector(t) : t; if (!e) return { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 }; return e.getBoundingClientRect(); }
  function center(t) { var r = rect(t); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r }; }
  function handle(nodes, extra) { nodes = [].concat(nodes); var h = { remove: function () { nodes.forEach(function (n) { n.remove(); }); live = live.filter(function (n) { return nodes.indexOf(n) < 0; }); if (h._off) h._off(); } }; for (var k in extra || {}) h[k] = extra[k]; return h; }
  var HAND = '<svg class="apxt-hand" viewBox="0 0 64 64"><path d="M22 30V10a5 5 0 0 1 10 0v16l2-.6V22a5 5 0 0 1 10 0v4a5 5 0 0 1 9 2.5V44c0 9-7 16-16 16h-4c-5 0-9-2.5-11.5-6.5L12 42a4.6 4.6 0 0 1 7-6l3 3.5Z" fill="#fff" stroke="#141a33" stroke-width="3.5" stroke-linejoin="round"/><path d="M32 30v10M41 31v9M49 34v7" stroke="#141a33" stroke-width="2.5" stroke-linecap="round" opacity=".35"/></svg>';
  function at(cls, c, inner) { return el(cls, inner, 'left:' + c.x + 'px;top:' + c.y + 'px'); }
  var T = {
    setStyle: function (s) { if (STY[s]) cur = s; },
    seen: function (id) { try { return localStorage.getItem(KEY + id) === '1'; } catch (e) { return false; } },
    markSeen: function (id) { try { localStorage.setItem(KEY + id, '1'); } catch (e) { } },
    reset: function (id) { try { localStorage.removeItem(KEY + id); } catch (e) { } },
    resetAll: function () { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(KEY) === 0) localStorage.removeItem(k); }); } catch (e) { } },
    once: function (id, fn) { if (T.seen(id)) return false; fn(function () { T.markSeen(id); }); return true; },
    clear: function () { live.slice().forEach(function (n) { n.remove(); }); live = []; },
    tap: function (t) { css(); return handle(at('apxt-tap', center(t), '<div class="apxt-ripple"></div>' + HAND)); },
    doubleTap: function (t) { css(); return handle(at('apxt-dbl', center(t), '<div class="apxt-ripple"></div>' + HAND)); },
    hold: function (t, o) { css(); o = o || {}; var e = at('apxt-hold', center(t), '<svg class="apxt-fill" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/></svg>' + HAND); e.style.setProperty('--hd', ((o.seconds || 1.2) + .4) + 's'); return handle(e); },
    swipe: function (t, dir, o) { o = o || {}; var d = o.distance || 140, v = { left: [-d, 0], right: [d, 0], up: [0, -d], down: [0, d] }[dir || 'right'], c = center(t); return T.drag({ x: c.x - v[0] / 2, y: c.y - v[1] / 2 }, { x: c.x + v[0] / 2, y: c.y + v[1] / 2 }, { swipe: true, speed: o.speed }); },
    drag: function (a, b, o) { css(); o = o || {}; var p = center(a), q = center(b), dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
      var tr = el('', '<div class="apxt-trail" style="width:' + L + 'px;transform:rotate(' + ang + 'deg)"></div>', 'left:' + p.x + 'px;top:' + (p.y - 5) + 'px');
      var m = at('apxt-move', p, HAND); m.style.setProperty('--dx', dx + 'px'); m.style.setProperty('--dy', dy + 'px'); m.style.setProperty('--md', (o.speed || (o.swipe ? 1.1 : 1.8)) + 's'); return handle([tr, m]); },
    pinch: function (t) { var c = center(t), h1 = T.drag({ x: c.x - 18, y: c.y - 18 }, { x: c.x - 70, y: c.y - 70 }), h2 = T.drag({ x: c.x + 18, y: c.y + 18 }, { x: c.x + 70, y: c.y + 70 }); return { remove: function () { h1.remove(); h2.remove(); } }; },
    tilt: function (o) { css(); o = o || {}; var e = el('apxt-tilt', '<svg viewBox="0 0 110 110"><path d="M14 40a44 44 0 0 1 14-18M96 40a44 44 0 0 0-14-18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M24 16l4 7-8 1zM86 16l-4 7 8 1z" fill="#fff"/><rect x="36" y="18" width="38" height="74" rx="9" fill="#fff" stroke="#141a33" stroke-width="4"/><rect x="42" y="27" width="26" height="52" rx="3" fill="var(--c)"/><circle cx="55" cy="85" r="3" fill="#141a33"/></svg>');
      var s = e.querySelector('svg'); if (o.side === 'left') { s.style.setProperty('--tr', '0deg'); } if (o.side === 'right') { s.style.setProperty('--tl', '0deg'); } if (o.y != null) e.style.top = o.y + 'px'; if (o.text) e.insertAdjacentHTML('beforeend', '<div class="apxt-label" style="left:50%;top:118px">' + esc(o.text) + '</div>'); return handle(e); },
    arrow: function (t, o) { css(); o = o || {}; var dir = o.dir || 'down', c = center(t), r = c.r, rot = { down: 0, up: 180, left: 90, right: -90 }[dir], off = 18;
      var pos = { down: [c.x, r.top - off], up: [c.x, r.top + r.height + off], left: [r.left + r.width + off, c.y], right: [r.left - off, c.y] }[dir];
      var e = el('apxt-arrow', '<svg width="44" height="54" viewBox="0 0 44 54" style="transform:translate(-22px,' + (dir === 'down' ? -54 : dir === 'up' ? 0 : -27) + 'px) rotate(' + rot + 'deg)"><path d="M14 2h16v26h12L22 52 2 28h12z" fill="var(--c)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>', 'left:' + pos[0] + 'px;top:' + pos[1] + 'px');
      var b = { down: [0, '10px'], up: [0, '-10px'], left: ['-10px', 0], right: ['10px', 0] }[dir]; e.style.setProperty('--bx', b[0]); e.style.setProperty('--by', b[1]);
      if (o.text) e.insertAdjacentHTML('beforeend', '<div class="apxt-label" style="left:0;top:' + (dir === 'down' ? -96 : 60) + 'px">' + esc(o.text) + '</div>'); return handle(e); },
    ring: function (t, o) { css(); o = o || {}; var c = center(t), s = Math.max(c.r.width, c.r.height) + (o.padding || 16); return handle(el('', '<div class="apxt-ring" style="left:' + (-s / 2) + 'px;top:' + (-s / 2) + 'px;width:' + s + 'px;height:' + s + 'px"></div>', 'left:' + c.x + 'px;top:' + c.y + 'px')); },
    spotlight: function (t, o) { css(); o = o || {}; var r = rect(t), p = o.padding == null ? 10 : o.padding, circle = o.shape === 'circle', x = r.left - p, y = r.top - p, w = r.width + p * 2, h = r.height + p * 2;
      if (circle) { var s = Math.max(w, h); x -= (s - w) / 2; y -= (s - h) / 2; w = h = s; }
      var d = el('apxt-dim' + (o.block ? ' block' : ''), '<div class="apxt-hole' + (circle ? ' circle' : '') + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px"></div>');
      var nodes = [d]; if (o.text) { var below = y + h + 120 < innerHeight; nodes.push(tip(o.text, { left: Math.max(10, Math.min(innerWidth - 330, x + w / 2 - 150)), top: below ? y + h + 16 : null, bottom: below ? null : innerHeight - y + 16 }, o.buttons)); }
      return handle(nodes, { hole: d.firstChild }); },
    steps: function (list, o) { o = o || {}; if (o.id && T.seen(o.id)) { if (o.onDone) o.onDone(true); return null; } var i = -1, cleanup = null, timer = 0;
      function finish() { clean(); if (o.id) T.markSeen(o.id); if (o.onDone) o.onDone(false); }
      function clean() { clearTimeout(timer); if (cleanup) cleanup(); cleanup = null; }
      function next() { clean(); i++; if (i >= list.length) return finish(); var s = list[i], parts = [];
        if (s.target) parts.push(T.spotlight(s.target, { padding: s.padding, shape: s.shape, block: s.waitFor !== 'click' && s.block !== false }));
        if (s.gesture) { var g = s.gesture, tg = s.target || { x: innerWidth / 2, y: innerHeight * .45 };
          parts.push(g === 'tilt' ? T.tilt({ text: null }) : g === 'swipe' ? T.swipe(tg, s.dir || 'right') : g === 'drag' ? T.drag(tg, s.to || { x: center(tg).x + 120, y: center(tg).y }) : g === 'hold' ? T.hold(tg) : g === 'arrow' ? T.arrow(tg, { dir: s.dir }) : g === 'doubleTap' ? T.doubleTap(tg) : T.tap(tg)); }
        var btns = []; if (o.skippable !== false && i < list.length - 1) btns.push(['Skip', 'ghost', finish]); if (s.waitFor == null || s.waitFor === 'next') btns.push([i === list.length - 1 ? (o.doneText || 'Got it!') : 'Next', '', next]);
        var r = s.target ? rect(s.target) : null, below = !r || r.top + r.height + 150 < innerHeight;
        parts.push(tip((o.counter !== false ? '<small style="opacity:.55">' + (i + 1) + ' / ' + list.length + '</small><br>' : '') + esc(s.text || ''), r ? { left: Math.max(10, Math.min(innerWidth - 330, r.left + r.width / 2 - 150)), top: below ? r.top + r.height + 22 : null, bottom: below ? null : innerHeight - r.top + 22 } : { left: Math.max(10, innerWidth / 2 - 160), top: innerHeight * .62 }, btns, true));
        if (s.waitFor === 'click' && s.target) { var e = typeof s.target === 'string' ? document.querySelector(s.target) : s.target; var f = function () { e.removeEventListener('click', f, true); setTimeout(next, 50); }; if (e && e.addEventListener) e.addEventListener('click', f, true); parts.push({ remove: function () { if (e && e.removeEventListener) e.removeEventListener('click', f, true); } }); }
        if (typeof s.waitFor === 'number') timer = setTimeout(next, s.waitFor);
        cleanup = function () { parts.forEach(function (p) { p.remove(); }); }; if (s.onShow) s.onShow(); }
      next(); return { next: next, skip: finish, get index() { return i; } }; },
    cards: function (list, o) { o = o || {}; if (o.id && T.seen(o.id)) { if (o.onDone) o.onDone(true); return null; } css(); var i = 0, d = el('apxt-cards', '<div class="apxt-card"></div>'), c = d.firstChild;
      function draw() { var k = list[i]; c.innerHTML = '<div class="hd">' + icon(k.icon || 'star') + '</div><h3>' + esc(k.title || '') + '</h3><p>' + esc(k.text || '') + '</p><div class="apxt-dots">' + list.map(function (_, j) { return '<i class="' + (j === i ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
          '<div class="apxt-btns"><button class="apxt-b ghost" data-a="prev" style="visibility:' + (i ? 'visible' : 'hidden') + '">Back</button><button class="apxt-b" data-a="next">' + (i === list.length - 1 ? (o.doneText || "Let's play!") : 'Next') + '</button></div>'; }
      function end() { h.remove(); if (o.id) T.markSeen(o.id); if (o.onDone) o.onDone(false); }
      c.addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'prev') i = Math.max(0, i - 1); else if (i === list.length - 1) return end(); else i++; draw(); });
      var sx = null; c.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true }); c.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { i = Math.max(0, Math.min(list.length - 1, i + (dx < 0 ? 1 : -1))); draw(); } sx = null; });
      draw(); var h = handle(d, { go: function (n) { i = n; draw(); }, close: end }); return h; }
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tip(html, pos, btns, raw) { var e = el('', '', 'inset:0'); var t = document.createElement('div'); t.className = 'apxt-tip'; t.innerHTML = raw ? html : esc(html);
    for (var k in pos) if (pos[k] != null) t.style[k] = pos[k] + 'px'; if (btns && btns.length) { var b = document.createElement('div'); b.className = 'apxt-btns'; btns.forEach(function (x) { var q = document.createElement('button'); q.className = 'apxt-b ' + x[1]; q.textContent = x[0]; q.onclick = x[2]; b.appendChild(q); }); t.appendChild(b); }
    e.appendChild(t); return { remove: function () { e.remove(); } }; }
  function icon(n) { var W = 'fill="#fff"', S = 'stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"', P = {
      tap: '<circle cx="48" cy="40" r="18" ' + S + ' opacity=".5"/><g transform="translate(28 30) scale(.9)">' + HAND.replace('class="apxt-hand" ', '').replace('<svg viewBox="0 0 64 64">', '').replace('</svg>', '') + '</g>',
      swipe: '<path d="M14 48h66M64 32l16 16-16 16" ' + S + '/><circle cx="20" cy="48" r="8" ' + W + ' opacity=".6"/>', drag: '<circle cx="24" cy="66" r="12" ' + W + ' opacity=".6"/><path d="M30 60L66 28M50 26h18v18" ' + S + '/><rect x="62" y="12" width="22" height="22" rx="6" ' + W + '/>',
      hold: '<circle cx="48" cy="48" r="34" stroke="#ffffff55" stroke-width="8" fill="none"/><path d="M48 14a34 34 0 0 1 34 34" ' + S + '/><circle cx="48" cy="48" r="12" ' + W + '/>',
      tilt: '<g transform="rotate(-18 48 48)"><rect x="30" y="12" width="36" height="72" rx="8" ' + W + '/><rect x="36" y="20" width="24" height="50" rx="3" fill="#00000033"/></g><path d="M10 40a40 40 0 0 1 12-18M86 40a40 40 0 0 0-12-18" ' + S + '/>',
      coin: '<circle cx="48" cy="48" r="34" fill="#ffd23f" stroke="#fff" stroke-width="6"/><circle cx="48" cy="48" r="20" fill="none" stroke="#c99a00" stroke-width="5"/>',
      star: '<path d="M48 10l11 23 25 3-18 17 5 25-23-12-23 12 5-25-18-17 25-3z" fill="#ffd23f" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>',
      heart: '<path d="M48 84C14 60 8 40 18 26c9-12 24-10 30 2 6-12 21-14 30-2 10 14 4 34-30 58z" fill="#ff4b6e" stroke="#fff" stroke-width="5"/>',
      trophy: '<path d="M30 14h36v20a18 18 0 0 1-36 0zM30 20H16a12 12 0 0 0 14 16M66 20h14a12 12 0 0 1-14 16M48 52v14M34 80h28M38 66h20v14H38z" ' + S + '/>',
      clock: '<circle cx="48" cy="48" r="34" ' + S + '/><path d="M48 28v20l14 10" ' + S + '/>', shield: '<path d="M48 10l32 12c0 30-12 50-32 64C28 72 16 52 16 22z" ' + S + '/>', bolt: '<path d="M54 8L22 54h22l-6 34 34-48H50z" fill="#ffd23f" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>' };
    return '<svg viewBox="0 0 96 96">' + (P[n] || P.star) + '</svg>'; }
  T.iconSVG = icon; T.handSVG = HAND; T.STYLES = STY;
  G.ApexTutorial = T;
})(window);
