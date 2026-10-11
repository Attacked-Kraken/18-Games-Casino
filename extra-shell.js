/* 18 Games Casino - a tiny stand-in for the arcade's shared shell, so Steelfront and Velvet 21 run on their own with no arcade
   connection: no player names, no scores sent anywhere, no friends tables, no arcade floor. Saves stay on this device.
   Back from a game's main menu returns to this project's own home page (index.html). */
(function () {
  var cfg = {}, resizeCbs = [], rotCbs = [], dir = 1;
  function goHome() { location.href = './'; }
  function back() { if (cfg.onBack) { try { if (cfg.onBack() === true) return; } catch (e) {} } goHome(); }
  function wireBack() {
    var b = cfg.backEl ? document.querySelector(cfg.backEl) : null;
    if (b) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); back(); }, true); return; }
    b = document.createElement('button'); b.type = 'button'; b.textContent = '‹ Back';
    b.style.cssText = 'position:fixed;z-index:2147483000;top:calc(10px + env(safe-area-inset-top,0px));left:calc(10px + env(safe-area-inset-left,0px));' +
      'border:0;border-radius:12px;padding:8px 12px;font:800 14px system-ui;color:#fff;background:rgba(8,16,30,.7)';
    b.onclick = back; document.body.appendChild(b);
  }
  addEventListener('resize', function () { resizeCbs.forEach(function (f) { try { f(); } catch (e) {} }); });
  addEventListener('devicemotion', function (e) { var g = e.accelerationIncludingGravity; if (!g || g.x == null) return; var x = g.x, y = g.y;
    if (!/iP(hone|ad|od)/.test(navigator.userAgent)) { x = -x; y = -y; }
    if (Math.abs(x) > 6 && Math.abs(x) > Math.abs(y) * 1.4) { var d = x < 0 ? 1 : -1; if (d !== dir) { dir = d; rotCbs.forEach(function (f) { try { f(d); } catch (er) {} }); } } });
  document.addEventListener('touchend', function ask() { document.removeEventListener('touchend', ask);
    try { if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) DeviceMotionEvent.requestPermission().catch(function () {}); } catch (e) {} });
  var noop = function () {};
  window.ArcadeShell = {
    init: function (o) { cfg = o || {}; if (document.body) wireBack(); else document.addEventListener('DOMContentLoaded', wireBack); },
    onResize: function (f) { resizeCbs.push(f); }, onRotDir: function (f) { rotCbs.push(f); }, rotDir: function () { return dir; },
    music: noop, submit: noop, frame: noop, level: noop, fail: noop, ease: noop, live: noop, ARCADE_URL: './'
  };
  window.ArcadeNames = { key: function () { return ''; }, name: function () { return ''; } };
  window.ArcadeTables = { lobby: function () { alert('Playing with friends isn’t available here. Play against the computer instead.'); } };
})();
