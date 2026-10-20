/* =====================================================================
   hud.js : Apex Sports & Racing HUD (drop-in, no dependencies, works offline)
   Uses the same 5 color styles as UI-Art-Kit: sky, lime, sunset, grape, cherry.

   var hud = ApexHUD.mount(document.body, { style: 'sky', scale: 1 });
   var sb  = hud.scoreboard({ home: 'HOME', away: 'AWAY', period: 'Q1', clock: '12:00' , position:'top'});
         sb.set({ homeScore: 2, awayScore: 1, clock: '08:41', period: 'Q2' });  sb.flash('home');
   var bar = hud.topbar({ left: 'BLUE', right: 'RED', center: '1st 15:00' });  bar.set({ leftScore:1 });
   var lap = hud.lapTimer({ laps: 5 });  lap.start(); lap.nextLap(); lap.set({ lap: 2 });  (keeps best lap)
   var pos = hud.positions({ names: ['You','Racer 2','Racer 3','Racer 4'], you: 0 });  pos.set(['Racer 2','You','Racer 3','Racer 4']);
   var map = hud.minimap({ size: 120, shape: 'round' });  map.draw(function(ctx,w,h){ ... });  map.dots([{x:.5,y:.5,color:'#ff0',me:true}]);
   var spd = hud.speedometer({ max: 320, unit: 'KM/H', type: 'analog' | 'digital' });  spd.set(180);
   var tac = hud.tachometer({ max: 12, redline: 10.5 });  tac.set(8.2, 4);   (rpm in thousands, gear)
   var nos = hud.boost({ label: 'NITRO' });  nos.set(0.7);
   var cd  = hud.countdown();  cd.start(function(){ go(); });   (5 red lights, then green GO)
   hud.setStyle('grape');  hud.show(false);  hud.destroy();
   Every widget has .el (its DOM node), .show(bool) and .remove().
   Positions: pass { position: 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom' | 'center' }.
   The HUD ignores taps (pointer-events: none), so your game still gets touch input underneath.
   ===================================================================== */
(function (G) {
  var STYLES = { sky: ['#3b9cff', '#1f6fc4'], lime: ['#46c94f', '#2e9636'], sunset: ['#ff8a1f', '#c9640c'], grape: ['#9b5cff', '#6a35c4'], cherry: ['#ff4b5f', '#c22c3e'] };
  var CSS = '.apxh{position:absolute;inset:0;pointer-events:none;font-family:var(--apxh-font,system-ui,-apple-system,"Segoe UI",sans-serif);color:#fff;z-index:50;' +
    '--c:#3b9cff;--cd:#1f6fc4;--ink:#141a33;--glass:rgba(16,22,44,.78);--acc:#ffd23f;--s:1;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}' +
    '.apxh *{box-sizing:border-box}.apxh .w{position:absolute;transform-origin:top left;transform:scale(var(--s))}' +
    '.apxh .p-top{top:calc(8px + env(safe-area-inset-top));left:50%;transform:translateX(-50%) scale(var(--s));transform-origin:top center}' +
    '.apxh .p-bottom{bottom:calc(10px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%) scale(var(--s));transform-origin:bottom center}' +
    '.apxh .p-top-left{top:calc(8px + env(safe-area-inset-top));left:calc(8px + env(safe-area-inset-left))}.apxh .p-top-right{top:calc(8px + env(safe-area-inset-top));right:calc(8px + env(safe-area-inset-right));transform-origin:top right}' +
    '.apxh .p-bottom-left{bottom:calc(10px + env(safe-area-inset-bottom));left:calc(8px + env(safe-area-inset-left));transform-origin:bottom left}.apxh .p-bottom-right{bottom:calc(10px + env(safe-area-inset-bottom));right:calc(8px + env(safe-area-inset-right));transform-origin:bottom right}' +
    '.apxh .p-center{top:50%;left:50%;transform:translate(-50%,-50%) scale(var(--s));transform-origin:center}' +
    '.apxh .pill{background:var(--glass);border:2px solid rgba(255,255,255,.18);border-radius:14px;box-shadow:0 3px 0 rgba(0,0,0,.35);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}' +
    /* scoreboard slim */
    '.apxh .sb{display:flex;align-items:stretch;height:34px;font-weight:800;font-size:15px;overflow:hidden}.apxh .sb .tm{padding:0 10px;display:flex;align-items:center;letter-spacing:.04em}' +
    '.apxh .sb .sc{min-width:30px;display:flex;align-items:center;justify-content:center;background:var(--c);font-size:17px;font-variant-numeric:tabular-nums}.apxh .sb .sc.b{background:var(--cd)}' +
    '.apxh .sb .ck{padding:0 10px;display:flex;flex-direction:column;justify-content:center;align-items:center;font-variant-numeric:tabular-nums;font-size:14px;line-height:1}.apxh .sb .ck small{font-size:9px;opacity:.75;margin-top:2px}' +
    '.apxh .flash{animation:apxhF .7s 3}@keyframes apxhF{50%{background:var(--acc);color:var(--ink)}}' +
    /* top bar */
    '.apxh .tb{display:flex;align-items:center;gap:0;height:28px;font-weight:800;font-size:13px;border-radius:0 0 14px 14px;border-top:0;overflow:hidden}.apxh .tb>span{padding:0 10px;display:flex;align-items:center;height:100%}' +
    '.apxh .tb .l{background:linear-gradient(90deg,var(--c),transparent)}.apxh .tb .r{background:linear-gradient(270deg,var(--cd),transparent)}.apxh .tb b{font-size:16px;min-width:18px;text-align:center;font-variant-numeric:tabular-nums}.apxh .tb .m{opacity:.9;font-size:12px}' +
    /* lap timer */
    '.apxh .lt{padding:6px 10px;min-width:118px;font-variant-numeric:tabular-nums}.apxh .lt .lp{font-size:11px;font-weight:800;color:var(--acc);letter-spacing:.06em}.apxh .lt .cur{font-size:20px;font-weight:800}.apxh .lt .best{font-size:11px;opacity:.8}' +
    /* positions */
    '.apxh .pb{padding:4px;min-width:118px}.apxh .pb div{display:flex;align-items:center;gap:6px;height:20px;font-size:12px;font-weight:700;padding:0 6px;border-radius:8px;transition:transform .3s}' +
    '.apxh .pb i{font-style:normal;width:16px;text-align:center;font-weight:900;color:var(--acc)}.apxh .pb .me{background:var(--c)}.apxh .pb .me i{color:#fff}' +
    /* minimap */
    '.apxh .mm{position:relative;overflow:hidden;border:3px solid var(--c);box-shadow:0 3px 0 var(--cd),0 0 0 2px rgba(0,0,0,.35)}.apxh .mm.round{border-radius:50%}.apxh .mm.square{border-radius:16px}.apxh .mm canvas{display:block;width:100%;height:100%}' +
    /* speedo */
    '.apxh .sp{position:relative}.apxh .sp svg{display:block}.apxh .sp .num{position:absolute;left:0;right:0;text-align:center;font-weight:900;font-variant-numeric:tabular-nums;line-height:1}.apxh .sp .u{font-size:9px;opacity:.75;font-weight:800;letter-spacing:.08em}' +
    '.apxh .dg{padding:4px 12px 6px;text-align:right;font-variant-numeric:tabular-nums}.apxh .dg b{font-size:34px;font-weight:900;line-height:1;display:block}.apxh .dg small{font-size:10px;font-weight:800;opacity:.75;letter-spacing:.08em}' +
    '.apxh .dg .sg{display:flex;gap:2px;margin-top:4px}.apxh .dg .sg i{flex:1;height:5px;border-radius:2px;background:rgba(255,255,255,.15)}.apxh .dg .sg i.on{background:var(--c)}.apxh .dg .sg i.on.hot{background:#ff4b5f}' +
    /* boost */
    '.apxh .bo{display:flex;align-items:center;gap:6px;padding:4px 8px 4px 6px;height:26px}.apxh .bo small{font-size:10px;font-weight:900;letter-spacing:.08em;color:var(--acc)}' +
    '.apxh .bo .tr{width:120px;height:10px;border-radius:5px;background:rgba(255,255,255,.15);overflow:hidden}.apxh .bo .tr i{display:block;height:100%;width:0;border-radius:5px;background:linear-gradient(90deg,var(--c),var(--acc));transition:width .15s}' +
    '.apxh .bo.full .tr i{animation:apxhG .5s infinite alternate}@keyframes apxhG{to{filter:brightness(1.5)}}' +
    /* countdown */
    '.apxh .cdn{display:flex;gap:10px;padding:10px 14px;border-radius:20px}.apxh .cdn i{width:34px;height:34px;border-radius:50%;background:#2a2f45;box-shadow:inset 0 -4px 0 rgba(0,0,0,.4)}' +
    '.apxh .cdn i.red{background:#ff3b3b;box-shadow:0 0 16px #ff3b3b,inset 0 -4px 0 rgba(0,0,0,.25)}.apxh .cdn i.green{background:#46e05a;box-shadow:0 0 16px #46e05a,inset 0 -4px 0 rgba(0,0,0,.25)}' +
    '.apxh .go{font-size:64px;font-weight:900;color:#46e05a;text-shadow:0 4px 0 rgba(0,0,0,.4);text-align:center;animation:apxhP .9s forwards}@keyframes apxhP{0%{transform:scale(.4);opacity:0}25%{transform:scale(1.15);opacity:1}80%{opacity:1}100%{transform:scale(1);opacity:0}}';
  function css() { if (document.getElementById('apxh-css')) return; var s = document.createElement('style'); s.id = 'apxh-css'; s.textContent = CSS; document.head.appendChild(s); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(ms) { if (ms == null || !isFinite(ms)) return '--:--.---'; var m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, x = Math.floor(ms % 1000); return m + ':' + (s < 10 ? '0' : '') + s + '.' + ('00' + x).slice(-3); }
  function mount(parent, opt) {
    css(); opt = opt || {}; parent = parent || document.body;
    if (getComputedStyle(parent).position === 'static' && parent !== document.body) parent.style.position = 'relative';
    var root = el('div', 'apxh'); if (parent === document.body) root.style.position = 'fixed'; parent.appendChild(root);
    var H = { el: root, widgets: [] };
    H.setStyle = function (n) { var c = STYLES[n] || STYLES.sky; root.style.setProperty('--c', c[0]); root.style.setProperty('--cd', c[1]); H.style = n; };
    H.setScale = function (s) { root.style.setProperty('--s', s); };
    H.show = function (v) { root.style.display = v === false ? 'none' : ''; };
    H.destroy = function () { H.widgets.forEach(function (w) { if (w._stop) w._stop(); }); root.remove(); };
    H.setStyle(opt.style || 'sky'); H.setScale(opt.scale || 1);
    function widget(node, pos, extra) {
      var w = el('div', 'w p-' + (pos || 'top')); w.appendChild(node); root.appendChild(w);
      var o = extra || {}; o.el = w; o.show = function (v) { w.style.display = v === false ? 'none' : ''; return o; }; o.remove = function () { if (o._stop) o._stop(); w.remove(); };
      H.widgets.push(o); return o;
    }
    H.scoreboard = function (o) {
      o = o || {}; var n = el('div', 'pill sb', '<span class="tm">' + esc(o.home || 'HOME') + '</span><span class="sc a">0</span><span class="ck"><span class="t">' + esc(o.clock || '00:00') + '</span><small class="pe">' + esc(o.period || '') + '</small></span><span class="sc b">0</span><span class="tm">' + esc(o.away || 'AWAY') + '</span>');
      var q = function (s) { return n.querySelector(s); };
      var w = widget(n, o.position || 'top', {
        set: function (v) { if (v.homeScore != null) q('.sc.a').textContent = v.homeScore; if (v.awayScore != null) q('.sc.b').textContent = v.awayScore; if (v.clock != null) q('.t').textContent = v.clock; if (v.period != null) q('.pe').textContent = v.period; if (v.home) q('.tm').textContent = v.home; if (v.away) n.querySelectorAll('.tm')[1].textContent = v.away; return w; },
        flash: function (side) { var e = q(side === 'away' ? '.sc.b' : '.sc.a'); e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); return w; }
      }); w.set(o); return w;
    };
    H.topbar = function (o) {
      o = o || {}; var n = el('div', 'pill tb', '<span class="l">' + esc(o.left || 'HOME') + '&nbsp;<b class="ls">0</b></span><span class="m">' + esc(o.center || '') + '</span><span class="r"><b class="rs">0</b>&nbsp;' + esc(o.right || 'AWAY') + '</span>');
      n.style.borderRadius = '0 0 14px 14px';
      var w = widget(n, 'top', { set: function (v) { if (v.leftScore != null) n.querySelector('.ls').textContent = v.leftScore; if (v.rightScore != null) n.querySelector('.rs').textContent = v.rightScore; if (v.center != null) n.querySelector('.m').textContent = v.center; return w; } });
      w.el.style.top = '0'; return w;
    };
    H.lapTimer = function (o) {
      o = o || {}; var n = el('div', 'pill lt', '<div class="lp">LAP <span class="l">1</span>/<span class="n">' + (o.laps || 3) + '</span></div><div class="cur">0:00.000</div><div class="best">BEST --:--.---</div>');
      var t0 = 0, run = false, best = null, raf = 0, lap = 1, laps = o.laps || 3;
      function tick() { if (run) { n.querySelector('.cur').textContent = fmt(performance.now() - t0); raf = requestAnimationFrame(tick); } }
      var w = widget(n, o.position || 'top-left', {
        start: function () { t0 = performance.now(); run = true; cancelAnimationFrame(raf); tick(); return w; }, stop: function () { run = false; return w; },
        time: function () { return run ? performance.now() - t0 : 0; },
        nextLap: function () { var t = performance.now() - t0; if (best == null || t < best) { best = t; n.querySelector('.best').textContent = 'BEST ' + fmt(best); } lap = Math.min(laps, lap + 1); n.querySelector('.l').textContent = lap; t0 = performance.now(); return t; },
        set: function (v) { if (v.lap != null) { lap = v.lap; n.querySelector('.l').textContent = lap; } if (v.laps != null) { laps = v.laps; n.querySelector('.n').textContent = laps; } if (v.best != null) { best = v.best; n.querySelector('.best').textContent = 'BEST ' + fmt(best); } if (v.time != null) n.querySelector('.cur').textContent = fmt(v.time); return w; },
        _stop: function () { run = false; cancelAnimationFrame(raf); }
      }); return w;
    };
    H.positions = function (o) {
      o = o || {}; var n = el('div', 'pill pb'), me = (o.names || [])[o.you || 0];
      var w = widget(n, o.position || 'top-right', {
        set: function (names, you) { if (you != null) me = you; n.innerHTML = names.slice(0, o.max || 6).map(function (nm, i) { return '<div class="' + (nm === me ? 'me' : '') + '"><i>' + (i + 1) + '</i>' + esc(nm) + '</div>'; }).join(''); return w; }
      }); w.set(o.names || ['You', 'Racer 2', 'Racer 3']); return w;
    };
    H.minimap = function (o) {
      o = o || {}; var s = o.size || 120, n = el('div', 'mm ' + (o.shape || 'round')); n.style.width = n.style.height = s + 'px'; n.style.background = o.background || 'rgba(16,22,44,.7)';
      var c = el('canvas'), d = Math.min(2, window.devicePixelRatio || 1); c.width = c.height = s * d; n.appendChild(c); var x = c.getContext('2d'), bg = null, dots = [];
      function paint() { x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, s, s); if (bg) bg(x, s, s); dots.forEach(function (p) { x.beginPath(); x.arc(p.x * s, p.y * s, p.me ? 5 : 3.5, 0, 7); x.fillStyle = p.color || (p.me ? '#ffd23f' : '#fff'); x.fill(); if (p.me) { x.lineWidth = 2; x.strokeStyle = '#141a33'; x.stroke(); } }); }
      var w = widget(n, o.position || 'bottom-left', { canvas: c, draw: function (f) { bg = f; paint(); return w; }, dots: function (a) { dots = a || []; paint(); return w; } }); paint(); return w;
    };
    function arcPath(cx, cy, r, a0, a1) { var p = function (a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }, s = p(a0), e = p(a1); return 'M' + s[0].toFixed(1) + ' ' + s[1].toFixed(1) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + e[0].toFixed(1) + ' ' + e[1].toFixed(1); }
    function dial(o, isTach) {
      var S = o.size || 130, cx = S / 2, cy = S / 2, r = S / 2 - 10, A0 = Math.PI * .75, A1 = Math.PI * 2.25, max = o.max || (isTach ? 10 : 260), red = o.redline;
      var ticks = '', steps = isTach ? max : 10;
      for (var i = 0; i <= steps; i++) { var a = A0 + (A1 - A0) * i / steps, big = true, x1 = cx + Math.cos(a) * (r - 2), y1 = cy + Math.sin(a) * (r - 2), x2 = cx + Math.cos(a) * (r - (big ? 10 : 6)), y2 = cy + Math.sin(a) * (r - 10);
        ticks += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + (red && i >= red ? '#ff4b5f' : '#fff') + '" stroke-width="2" stroke-linecap="round" opacity=".85"/>';
        if ((isTach && (S >= 120 || steps <= 8 || i % 2 === 0)) || (!isTach && i % 2 === 0)) { var lx = cx + Math.cos(a) * (r - 20), ly = cy + Math.sin(a) * (r - 20) + 3; ticks += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" fill="#fff" font-size="9" font-weight="700" text-anchor="middle" opacity=".8">' + Math.round(max * i / steps) + '</text>'; } }
      var redArc = red ? '<path d="' + arcPath(cx, cy, r, A0 + (A1 - A0) * red / max, A1) + '" stroke="#ff4b5f" stroke-width="5" fill="none"/>' : '';
      var svg = '<svg width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (S / 2 - 2) + '" fill="rgba(16,22,44,.78)" stroke="rgba(255,255,255,.2)" stroke-width="2"/>' +
        '<path d="' + arcPath(cx, cy, r, A0, A1) + '" stroke="rgba(255,255,255,.15)" stroke-width="5" fill="none"/><path class="val" d="" stroke="var(--c)" stroke-width="5" fill="none" stroke-linecap="round"/>' + redArc + ticks +
        '<g class="nd"><line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + r - 14) + '" y2="' + cy + '" stroke="var(--acc)" stroke-width="3" stroke-linecap="round"/></g><circle cx="' + cx + '" cy="' + cy + '" r="6" fill="var(--c)" stroke="#fff" stroke-width="2"/></svg>';
      var n = el('div', 'sp', svg + '<div class="num" style="top:' + (S * .62) + 'px;font-size:' + (S * .17) + 'px"><span class="v">0</span><div class="u">' + esc(o.unit || (isTach ? 'x1000 RPM' : 'KM/H')) + '</div></div>');
      var nd = n.querySelector('.nd'), val = n.querySelector('.val'), v = n.querySelector('.v'), cur = 0;
      var w = widget(n, o.position || 'bottom-right', {
        set: function (x, gear) { cur = Math.max(0, Math.min(max, +x || 0)); var a = A0 + (A1 - A0) * cur / max; nd.setAttribute('transform', 'rotate(' + (a * 180 / Math.PI).toFixed(2) + ' ' + cx + ' ' + cy + ')');
          val.setAttribute('d', cur > 0 ? arcPath(cx, cy, r, A0, Math.max(A0 + .001, a)) : ''); v.textContent = gear != null ? gear : (isTach ? cur.toFixed(1) : Math.round(cur)); return w; }, value: function () { return cur; }
      }); w.set(0, isTach ? 'N' : null); return w;
    }
    H.speedometer = function (o) {
      o = o || {}; if (o.type !== 'digital') return dial(o, false);
      var max = o.max || 260, segs = 16, n = el('div', 'pill dg', '<b class="v">0</b><small>' + esc(o.unit || 'KM/H') + '</small><div class="sg">' + new Array(segs + 1).join('<i></i>') + '</div>'), I = n.querySelectorAll('.sg i');
      var w = widget(n, o.position || 'bottom-right', { set: function (x) { x = Math.max(0, Math.min(max, +x || 0)); n.querySelector('.v').textContent = Math.round(x); var k = Math.round(x / max * segs); for (var i = 0; i < segs; i++) { I[i].className = (i < k ? 'on' : '') + (i >= segs * .8 ? ' hot' : ''); } return w; } });
      w.set(0); return w;
    };
    H.tachometer = function (o) { o = o || {}; o.max = o.max || 10; if (o.redline == null) o.redline = o.max * .85; return dial(o, true); };
    H.boost = function (o) {
      o = o || {}; var n = el('div', 'pill bo', '<small>' + esc(o.label || 'BOOST') + '</small><div class="tr"><i></i></div>'); if (o.width) n.querySelector('.tr').style.width = o.width + 'px';
      var w = widget(n, o.position || 'bottom', { set: function (v) { v = Math.max(0, Math.min(1, +v || 0)); n.querySelector('i').style.width = (v * 100) + '%'; n.classList.toggle('full', v >= 1); return w; } });
      w.set(o.value || 0); return w;
    };
    H.countdown = function (o) {
      o = o || {}; var n = el('div', 'pill cdn', '<i></i><i></i><i></i><i></i><i></i>'), T = [], L = n.querySelectorAll('i');
      var w = widget(n, o.position || 'center', {
        start: function (cb) { w._stop(); w.show(true); L.forEach(function (l) { l.className = ''; }); var step = o.step || 800;
          for (var i = 0; i < 5; i++) (function (k) { T.push(setTimeout(function () { L[k].className = 'red'; if (o.onTick) o.onTick(5 - k); }, step * (k + 1))); })(i);
          T.push(setTimeout(function () { L.forEach(function (l) { l.className = 'green'; }); var g = el('div', 'go', esc(o.goText || 'GO!')); n.parentNode.appendChild(g); setTimeout(function () { g.remove(); w.show(false); }, 900); if (cb) cb(); }, step * 6 + (o.randomHold ? Math.random() * 1200 : 0)));
          return w; },
        set: function (k) { L.forEach(function (l, i) { l.className = k === 'go' ? 'green' : (i < k ? 'red' : ''); }); return w; },
        _stop: function () { T.forEach(clearTimeout); T = []; }
      }); return w;
    };
    return H;
  }
  G.ApexHUD = { mount: mount, STYLES: STYLES, formatTime: fmt };
})(window);
