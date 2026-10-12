/* Engagement layer (fun chips only): XP / level bar fed by every wager, level-up chip rewards, and a once-a-day spin wheel. */
(function () { function boot() {
  var XK = 'gc18_xp', DK = 'gc18_dwheel';
  var xp = +localStorage.getItem(XK) || 0;
  function need(l) { return Math.round(400 * Math.pow(l, 1.45)); }
  function levelOf(x) { var l = 1; while (x >= need(l)) { x -= need(l); l++; } return { l: l, into: x, of: need(l) }; }
  var lv = levelOf(xp).l;
  var css = '#xpBar{position:fixed;z-index:7;left:8px;width:150px;font:800 10px system-ui;color:#ffe9a8;pointer-events:auto}#xpBar .t{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;text-shadow:0 1px 2px #000}#xpBar .b{height:8px;border-radius:5px;background:rgba(0,0,0,.65);border:1px solid #b08d57;overflow:hidden}#xpBar .f{height:100%;background:linear-gradient(90deg,#c47a10,#ffd34a,#fff2b0);box-shadow:0 0 8px #ffb400;transition:width .4s}' +
    '#xpBar .dw{margin-top:4px;display:none;border:0;border-radius:10px;padding:4px 8px;font:900 10px system-ui;letter-spacing:.08em;color:#2a1400;background:linear-gradient(#fff2b0,#ffb400);box-shadow:0 0 12px #ffb400;cursor:pointer;animation:dwP 1.2s infinite alternate}@keyframes dwP{to{box-shadow:0 0 22px #ffd34a}}' +
    '#dwOv{position:fixed;inset:0;z-index:100003;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;flex-direction:column;color:#fff;font:14px system-ui}#dwOv.on{display:flex}#dwOv h2{font:900 30px Georgia;color:#ffd34a;text-shadow:0 0 14px #ffb400;margin:0 0 10px}#dwOv button{margin-top:12px;border:0;border-radius:8px;padding:10px 26px;font:900 15px system-ui;color:#2a1400;background:linear-gradient(#fff2b0,#ffb400);cursor:pointer}' +
    '#xpToast{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%) scale(.6);opacity:0;z-index:100003;font:900 34px Georgia;color:#ffd34a;text-shadow:0 0 18px #ffb400,0 3px 0 #000;transition:.35s;pointer-events:none;text-align:center}#xpToast.on{opacity:1;transform:translate(-50%,-50%) scale(1)}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var bar, fill, txt, dw;
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function mount() { if (bar || !document.body) return; var floor = !!document.getElementById('floor3d'); bar = document.createElement('div'); bar.id = 'xpBar'; if (floor) { bar.style.top = 'calc(54px + env(safe-area-inset-top))'; bar.style.left = '50%'; bar.style.transform = 'translateX(-50%)'; bar.style.textAlign = 'center'; } else bar.style.top = 'calc(96px + env(safe-area-inset-top))';
    if (/steelfront/.test(location.pathname)) bar.style.display = 'none';
    bar.innerHTML = '<div class="t"><span id="xpL"></span><span id="xpN"></span></div><div class="b"><div class="f" id="xpF"></div></div><button type="button" class="dw" id="xpDW">🎡 DAILY SPIN</button>'; document.body.appendChild(bar);
    fill = bar.querySelector('#xpF'); txt = bar.querySelector('#xpL'); dw = bar.querySelector('#xpDW'); dw.onclick = openWheel; draw(); }
  function draw() { if (!bar) return; var L = levelOf(xp); txt.textContent = 'LV ' + L.l; bar.querySelector('#xpN').textContent = Math.floor(L.into).toLocaleString() + ' / ' + L.of.toLocaleString(); fill.style.width = (L.into / L.of * 100) + '%'; dw.style.display = localStorage.getItem(DK) === today() ? 'none' : 'inline-block'; }
  function toast(html) { var t = document.getElementById('xpToast'); if (!t) { t = document.createElement('div'); t.id = 'xpToast'; document.body.appendChild(t); } t.innerHTML = html; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, 2200); }
  function addXP(n) { xp += n; try { localStorage.setItem(XK, String(xp)); } catch (e) {} var L = levelOf(xp).l; if (L > lv) { var gift = (L - 1) * 100; lv = L; giveRaw(gift); toast('LEVEL ' + L + '!<br><span style="font:800 18px system-ui;color:#fff">+' + gift.toLocaleString() + ' fun chips</span>'); if (window.GAudio) { GAudio.sfx('bigwin'); GAudio.say('Level up!', 1); } } draw(); }
  var origTake = Chips.take.bind(Chips), giveRaw = Chips.give.bind(Chips);
  Chips.take = function (n) { var ok = origTake(n); if (ok && n > 0) addXP(n); return ok; };
  /* daily wheel */
  var SEG = [[100, '#7a1424'], [250, '#1d3f9a'], [500, '#0f6a46'], [100, '#9a6a18'], [1000, '#4a1f5e'], [250, '#7a1424'], [2500, '#1d3f9a'], [5000, '#ff2a4a']], WT = [22, 20, 16, 22, 9, 20, 3, 1];
  function openWheel() { if (localStorage.getItem(DK) === today()) return; var ov = document.getElementById('dwOv'); if (!ov) { ov = document.createElement('div'); ov.id = 'dwOv'; document.body.appendChild(ov); }
    ov.innerHTML = '<h2>DAILY SPIN</h2><canvas id="dwC" width="560" height="560" style="width:min(82vw,320px);height:min(82vw,320px)"></canvas><div id="dwR" style="font:900 26px system-ui;min-height:32px;margin-top:8px"></div><button type="button" id="dwGo">SPIN</button><small style="color:#a8916a;margin-top:8px">Free once a day · fun chips only</small>'; ov.classList.add('on');
    var c = ov.querySelector('#dwC'), g = c.getContext('2d'), N = SEG.length;
    function draw2(a) { g.clearRect(0, 0, 560, 560); g.save(); g.translate(280, 280); g.rotate(a); for (var i = 0; i < N; i++) { var a0 = i / N * Math.PI * 2; g.fillStyle = SEG[i][1]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 260, a0, a0 + Math.PI * 2 / N); g.fill(); g.strokeStyle = '#ffd34a'; g.lineWidth = 4; g.stroke(); g.save(); g.rotate(a0 + Math.PI / N); g.fillStyle = '#fff'; g.font = '900 34px system-ui'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(SEG[i][0].toLocaleString(), 240, 0); g.restore(); }
      g.restore(); for (var k = 0; k < 24; k++) { var b = k / 24 * Math.PI * 2; g.fillStyle = k % 2 ? '#fff6c0' : '#ffd34a'; g.beginPath(); g.arc(280 + Math.cos(b) * 266, 280 + Math.sin(b) * 266, 7, 0, 7); g.fill(); } g.fillStyle = '#ffd34a'; g.beginPath(); g.moveTo(280, 6); g.lineTo(262, 50); g.lineTo(298, 50); g.fill(); g.fillStyle = '#2a0e02'; g.beginPath(); g.arc(280, 280, 40, 0, 7); g.fill(); }
    draw2(0); ov.querySelector('#dwGo').onclick = function () { var b = this; b.disabled = true; var tot = WT.reduce(function (a, x) { return a + x; }, 0), x = Math.random() * tot, idx = 0; for (; idx < N; idx++) { x -= WT[idx]; if (x <= 0) break; } idx = Math.min(idx, N - 1);
      var end = -Math.PI / 2 - (idx + .5) / N * Math.PI * 2 + Math.PI * 12, t0 = performance.now(), D = 4000; if (window.GAudio) GAudio.sfx('whoosh');
      (function f() { var k = Math.min(1, (performance.now() - t0) / D), e = 1 - Math.pow(1 - k, 3); draw2(end * e); if (k < 1) requestAnimationFrame(f); else { var v = SEG[idx][0]; localStorage.setItem(DK, today()); giveRaw(v); ov.querySelector('#dwR').textContent = '+' + v.toLocaleString() + ' fun chips!'; if (window.GAudio) GAudio.sfx(v >= 1000 ? 'bigwin' : 'win'); b.textContent = 'COLLECT'; b.disabled = false; b.onclick = function () { ov.classList.remove('on'); draw(); }; } })(); }; }
  window.Engage = { addXP: addXP, openWheel: openWheel, spin: function () {}, get level() { return levelOf(xp).l; } };
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
}
  if (window.Chips) boot(); else { var s = document.createElement('script'); s.src = 'chips.js'; s.onload = function () { if (window.Chips) boot(); }; document.head.appendChild(s); }
})();
