/* ArcadeRecord — wins / losses totals for a game, split by how it was played (owner, 2026-10-10: "show total wins and total losses
   for self playing games, friends code multiplayer games and pass and play" — "do that on every multiplayer game page").

   Load after arcade-shell.js:  <script src="/static/pulse-stack/arcade-record.js?v=1"></script>

   ArcadeRecord.add(game, mode, outcome)
       mode:    'cpu'  = against the computer / solo vs bots
                'net'  = friends table code / online room (your own result)
                'pass' = Pass & Play on one phone (counted for Player 1, the phone's owner)
       outcome: 'w' win, 'l' loss, 'd' draw/tie
   ArcadeRecord.box(game, { modes: ['cpu','net','pass'], theme: 'light'|'dark', seed: {cpu:{w,l,d}, ...} })
       returns a small card element (class "arcRec"); put it on the game's home / menu screen. Call .refresh() on it (or
       ArcadeRecord.refreshAll()) after a result to redraw. Shows only the modes the game has.
   ArcadeRecord.get(game) -> { cpu:{w,l,d}, net:{w,l,d}, pass:{w,l,d} }

   Saved per player on this phone under arc_rec:<game>:<player> (kept by "Start this game over", like other arc_ keys). No internet. */
(function () {
  if (window.ArcadeRecord) return;
  var MODES = ['cpu', 'net', 'pass'];
  var WORDS = {
    en: { all: 'ALL GAMES', cpu: 'Computer', net: 'Friends', pass: 'Pass & Play', w: 'W', l: 'L' },
    es: { all: 'TODOS LOS JUEGOS', cpu: 'Computadora', net: 'Amigos', pass: 'Pasa y juega', w: 'G', l: 'P' },
    zh: { all: '全部对局', cpu: '电脑', net: '好友', pass: '轮流玩', w: '胜', l: '负' },
    vi: { all: 'TẤT CẢ', cpu: 'Máy', net: 'Bạn bè', pass: 'Chơi chung', w: 'T', l: 'B' }
  };
  var ICON = { cpu: '🤖', net: '📱', pass: '👥' };
  function lang() { var l = 'en'; try { l = (window.ArcadeI18n && ArcadeI18n.lang()) || localStorage.getItem('arc_lang') || 'en'; } catch (e) {} return WORDS[l] ? l : 'en'; }
  function who() { var u = ''; try { u = (localStorage.getItem('ps_username') || '').trim().toLowerCase(); } catch (e) {} return u || 'guest'; }
  function key(game) { return 'arc_rec:' + String(game || '').toLowerCase() + ':' + who(); }
  function blank() { return { cpu: { w: 0, l: 0, d: 0 }, net: { w: 0, l: 0, d: 0 }, pass: { w: 0, l: 0, d: 0 } }; }
  function get(game) { var r = blank(); try { var o = JSON.parse(localStorage.getItem(key(game)) || 'null'); if (o) MODES.forEach(function (m) { if (o[m]) ['w', 'l', 'd'].forEach(function (k) { r[m][k] = Math.max(0, +o[m][k] || 0); }); }); } catch (e) {} return r; }
  function put(game, r) { try { localStorage.setItem(key(game), JSON.stringify(r)); } catch (e) {} }
  var boxes = [];
  function add(game, mode, outcome) {
    if (MODES.indexOf(mode) < 0 || 'wld'.indexOf(outcome) < 0 || !outcome) return; var r = get(game); r[mode][outcome]++; put(game, r);
    try { var d = JSON.parse(localStorage.getItem('arc_rec_seen') || '{}'); d[game] = 1; localStorage.setItem('arc_rec_seen', JSON.stringify(d)); } catch (e) {}
    refreshAll();
  }
  var css = '.arcRec{box-sizing:border-box;min-width:0;max-width:220px;border-radius:16px;padding:8px 10px;font-family:-apple-system,system-ui,sans-serif;line-height:1.25;text-align:left}' +
    '.arcRec.light{background:#fff;color:#2a1d3a;box-shadow:0 3px 0 rgba(0,0,0,.12),0 6px 14px rgba(0,0,0,.12)}' +
    '.arcRec.dark{background:rgba(10,8,24,.72);color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 6px 14px rgba(0,0,0,.3);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
    '.arcRec .arT{font:900 10.5px system-ui;letter-spacing:.08em;opacity:.7;text-align:center}.arcRec .arB{font:900 16px system-ui;text-align:center;margin:2px 0 4px;white-space:nowrap}' +
    '.arcRec .arR{display:flex;justify-content:space-between;gap:8px;font:800 12px system-ui;padding:3px 0;border-top:1px solid rgba(128,128,128,.25)}.arcRec .arR span,.arcRec .arR b{white-space:nowrap}';
  function style() { if (document.getElementById('arcRecCss')) return; var s = document.createElement('style'); s.id = 'arcRecCss'; s.textContent = css; (document.head || document.documentElement).appendChild(s); }
  function paint(el) {
    var o = el._rec, r = get(o.game), W = WORDS[lang()], seed = o.seed || {};
    var tot = { w: 0, l: 0 }, rows = '';
    o.modes.forEach(function (m) { var x = { w: r[m].w + ((seed[m] || {}).w || 0), l: r[m].l + ((seed[m] || {}).l || 0) }; tot.w += x.w; tot.l += x.l;
      rows += '<div class="arR"><span>' + ICON[m] + ' ' + W[m].replace('&', '&amp;') + '</span><b>' + x.w + W.w + ' · ' + x.l + W.l + '</b></div>'; });
    el.innerHTML = '<div class="arT">' + W.all + '</div><div class="arB">🏆 ' + tot.w + W.w + ' · 💔 ' + tot.l + W.l + '</div>' + rows;
  }
  function box(game, opt) {
    opt = opt || {}; style();
    var el = document.createElement('div'); el.className = 'arcRec ' + (opt.theme === 'dark' ? 'dark' : 'light'); el.setAttribute('data-noi18n', ''); el.classList.add('notranslate');
    el._rec = { game: game, modes: (opt.modes || MODES).filter(function (m) { return MODES.indexOf(m) >= 0; }), seed: opt.seed || null };
    el.refresh = function () { paint(el); }; paint(el); boxes.push(el); return el;
  }
  function refreshAll() { boxes = boxes.filter(function (b) { return b.isConnected || b.parentNode; }); boxes.forEach(function (b) { try { paint(b); } catch (e) {} }); }
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('arc_rec:') === 0) refreshAll(); });
  window.ArcadeRecord = { add: add, get: get, box: box, refreshAll: refreshAll };
})();
