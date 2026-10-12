/* wallet.js: casino-cashier style Wallet for the 18 Games Casino (floor HUD + every game page).
   Shows the shared fun-chip balance (chips.js) as a $-style amount, a transaction history (localStorage), and a
   "Transfer In" cashier flow that credits DEMO funds. NO REAL MONEY and NO payment code: nothing is charged,
   nothing leaves the phone, the "bank account" is a fixed demo label. */
(function () {
  if (window.Wallet) return;
  var TKEY = 'gc18_tx', MAX = 80, MAXIN = 10000;
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  function load() { try { return JSON.parse(localStorage.getItem(TKEY) || '[]') || []; } catch (e) { return []; } }
  function save(l) { try { localStorage.setItem(TKEY, JSON.stringify(l.slice(0, MAX))); } catch (e) {} }
  var game = (location.pathname.split('/').pop() || '').replace(/\.html$/, '') || 'floor';
  var tag = null;
  function log(kind, amt) { var l = load(), now = Date.now(), top = l[0];
    /* merge rapid same-kind entries from the same game (e.g. many small slot wagers) */
    if (top && top.k === kind && top.g === game && now - top.t < 20000 && (kind === 'Wager' || kind === 'Win')) { top.a += amt; top.n = (top.n || 1) + 1; top.t = now; }
    else l.unshift({ k: kind, a: amt, g: game, t: now });
    save(l); if ($('wlBox') && $('wlS').classList.contains('on')) render(); }
  function patch() { var C = window.Chips; if (!C || C.__wl) return; C.__wl = 1;
    var tk = C.take, gv = C.give, tu = C.topup;
    C.take = function (n) { var ok = tk.call(C, n); if (ok) log('Wager', -Math.round(n)); return ok; };
    C.give = function (n) { var r = gv.call(C, n); if (n > 0) log(tag || 'Win', Math.round(n)); return r; };
    C.topup = function () { var b = C.bal(), ok = tu.call(C); if (ok) log('Daily bonus', C.bal() - b); return ok; };
    if (C.on) C.on(function () { var b = $('wlBal'); if (b) b.textContent = money(C.bal()); }); }
  function needChips(cb) { if (window.Chips) { patch(); cb(); return; } var s = document.createElement('script'); s.src = 'chips.js'; s.onload = function () { patch(); cb(); }; s.onerror = cb; document.head.appendChild(s); }

  var SER = 'Didot,"Bodoni 72","Playfair Display",Georgia,serif';
  var css = '#wlS{position:fixed;inset:0;z-index:100001;background:rgba(5,3,3,.74);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;padding:12px}#wlS.on{display:flex}' +
    '#wlBox{width:min(440px,100%);max-height:92vh;overflow:auto;background:linear-gradient(160deg,#1b1410,#0b0807 60%);border:1px solid #b08d57;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.75),inset 0 0 0 4px rgba(176,141,87,.1);color:#e9dfcc;font:400 14px/1.45 -apple-system,Helvetica,Arial,sans-serif;padding:18px}' +
    '#wlBox h2{margin:0;font:400 26px ' + SER + ';color:#f0dca8}#wlBox .sub{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#a8946e}' +
    '.wlCard{margin:14px 0;padding:18px;border-radius:14px;background:linear-gradient(135deg,#2a1d12,#120c09 55%,#2a1d12);border:1px solid rgba(217,176,101,.55);position:relative;overflow:hidden}' +
    '.wlCard:after{content:"";position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(rgba(217,176,101,.25),transparent 70%)}' +
    '.wlCard small{display:block;font-size:10px;letter-spacing:.2em;color:#a8946e;text-transform:uppercase}.wlCard b{display:block;font:400 38px ' + SER + ';color:#f6e3b0;margin:4px 0}' +
    '.wlCard .chip{position:absolute;right:18px;top:18px;width:38px;height:28px;border-radius:5px;background:linear-gradient(135deg,#e6c47e,#8a6a2a)}.wlDemo{font-size:10.5px;color:#d9a0a8;letter-spacing:.06em}' +
    '.wlBtns{display:flex;gap:8px}.wlB{flex:1;border:0;border-radius:24px;padding:11px 10px;font:600 13px Georgia,serif;letter-spacing:.1em;cursor:pointer;text-transform:uppercase}' +
    '.wlB.g{background:linear-gradient(#ecca84,#a8823e);color:#1a1208}.wlB.o{background:transparent;color:#e8d3a0;border:1px solid #b08d57}' +
    '#wlBox h3{font:400 16px Georgia,serif;color:#d9bf85;margin:16px 0 6px;border-bottom:1px solid rgba(176,141,87,.3);padding-bottom:4px}' +
    '.wlTx{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)}.wlTx i{width:30px;height:30px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font:600 13px Georgia;font-style:normal;background:#241a12;border:1px solid rgba(176,141,87,.5);color:#d9bf85}' +
    '.wlTx div{flex:1;min-width:0}.wlTx div span{display:block;font-size:11px;color:#8a7d68}.wlTx em{font-style:normal;font-weight:600}.wlTx em.p{color:#8fd0a4}.wlTx em.m{color:#d98a96}' +
    '.wlIn{width:100%;box-sizing:border-box;background:#0d0a08;border:1px solid #6a5434;border-radius:10px;color:#f6e3b0;font:400 28px ' + SER + ';padding:10px 12px;text-align:center}' +
    '.wlQ{display:flex;gap:6px;margin:8px 0}.wlQ button{flex:1;background:#1c140e;border:1px solid #6a5434;color:#e8d3a0;border-radius:18px;padding:7px 0;font:600 12px Georgia;cursor:pointer}' +
    '.wlSel{width:100%;background:#0d0a08;border:1px solid #6a5434;color:#e9dfcc;border-radius:10px;padding:10px;font:14px Helvetica,Arial}' +
    '.wlSpin{width:54px;height:54px;margin:22px auto 10px;border-radius:50%;border:4px solid rgba(217,176,101,.2);border-top-color:#e6c47e;animation:wlr 1s linear infinite}@keyframes wlr{to{transform:rotate(360deg)}}' +
    '.wlOk{width:58px;height:58px;margin:12px auto;border-radius:50%;background:linear-gradient(#ecca84,#a8823e);color:#1a1208;font:700 30px Georgia;display:flex;align-items:center;justify-content:center;animation:wlp .4s ease-out}@keyframes wlp{from{transform:scale(.3);opacity:0}}' +
    '.wlR{border:1px dashed rgba(176,141,87,.5);border-radius:10px;padding:10px 12px;margin:10px 0;font:13px/1.8 Menlo,Consolas,monospace;color:#d8ccb4}.wlR div{display:flex;justify-content:space-between}' +
    '.wlF{margin-top:14px;font-size:10.5px;color:#8a7d68;text-align:center}.wlStat{font-size:11px;color:#a8946e;text-align:center;margin-top:6px;letter-spacing:.05em}' +
    '.wlFab{position:fixed;z-index:99999;right:10px;top:calc(env(safe-area-inset-top) + 98px);background:rgba(12,9,8,.86);color:#e8d3a0;border:1px solid #b08d57;border-radius:18px;padding:6px 12px;font:500 11px Georgia,serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}';
  var cssOn = false; function addCss() { if (cssOn) return; cssOn = true; var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }
  function ensure() { addCss(); if ($('wlS')) return;
    var d = document.createElement('div'); d.id = 'wlS'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.innerHTML = '<div id="wlBox"></div>'; document.body.appendChild(d);
    d.addEventListener('click', function (e) { if (e.target === d) close(); }); }
  var stats = null; function loadStats() { if (stats) return; fetch('stats.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { stats = j; var e = $('wlStat'); if (e && j) e.textContent = statTxt(); }).catch(function () {}); }
  function statTxt() { return stats ? 'App stats · ' + Number(stats.lines).toLocaleString() + ' lines of code · ' + stats.files + ' files' : ''; }
  var ICON = { 'Wager': '−', 'Win': '★', 'Daily bonus': '✦', 'Transfer in': '⇣', 'Bonus': '✦' };
  var NAME = { floor: 'Casino floor' };
  function gname(id) { try { var g = window.Lobby && Lobby.byId(id); if (g) return g.title; var r = window.HowTo && HowTo.RULES[id]; if (r) return r.title; } catch (e) {} return NAME[id] || id.replace(/^./, function (c) { return c.toUpperCase(); }); }
  function render() { var C = window.Chips, l = load(), b = $('wlBox');
    var tx = l.length ? l.slice(0, 25).map(function (t) { var d = new Date(t.t); return '<div class="wlTx"><i>' + (ICON[t.k] || '•') + '</i><div>' + t.k + (t.n > 1 ? ' ×' + t.n : '') + '<span>' + gname(t.g) + ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</span></div><em class="' + (t.a >= 0 ? 'p' : 'm') + '">' + (t.a >= 0 ? '+' : '−') + money(Math.abs(t.a)) + '</em></div>'; }).join('') : '<p style="color:#8a7d68">No transactions yet. Wins, wagers, bonuses and transfers show up here.</p>';
    b.innerHTML = '<h2>Wallet</h2><div class="sub">18 Games Casino · Player account</div>' +
      '<div class="wlCard"><div class="chip"></div><small>Available balance</small><b id="wlBal">' + money(C ? C.bal() : 0) + '</b><div class="wlDemo">Demo funds — no real money</div></div>' +
      '<div class="wlBtns"><button class="wlB g" id="wlIn" type="button">Transfer In</button><button class="wlB o" id="wlX" type="button">Close</button></div>' +
      '<h3>Recent transactions</h3>' + tx +
      '<div class="wlF">Demo funds — no real money. Balance is fun chips shown in $ style; it can’t be bought, withdrawn or cashed out. 18+.</div><div class="wlStat" id="wlStat">' + statTxt() + '</div>';
    $('wlIn').onclick = cashier; $('wlX').onclick = close; }
  var amt = 100, src = 'Checking ••4821';
  function cashier() { var b = $('wlBox');
    b.innerHTML = '<h2>Cashier</h2><div class="sub">Transfer in · demo funds</div>' +
      '<h3>From account</h3><select class="wlSel" id="wlSrc"><option>Checking ••4821</option><option>Savings ••0937</option></select>' +
      '<h3>Amount</h3><input class="wlIn" id="wlAmt" inputmode="decimal" value="' + money(amt) + '"><div class="wlQ">' + [50, 100, 500, 1000].map(function (v) { return '<button type="button" data-v="' + v + '">' + money(v).replace('.00', '') + '</button>'; }).join('') + '</div>' +
      '<div id="wlErr" style="color:#d98a96;font-size:12px;min-height:16px"></div>' +
      '<div class="wlBtns"><button class="wlB g" id="wlGo" type="button">Confirm transfer</button><button class="wlB o" id="wlBack" type="button">Back</button></div>' +
      '<div class="wlF">Demo funds — no real money. Nothing is charged and no bank is contacted; the account above is a demo label. Max ' + money(MAXIN) + ' per transfer.</div>';
    $('wlSrc').value = src; $('wlSrc').onchange = function () { src = this.value; };
    var inp = $('wlAmt'); inp.onfocus = function () { inp.value = String(amt); inp.select(); }; inp.onblur = function () { amt = parse(inp.value); inp.value = money(amt); };
    Array.prototype.forEach.call(b.querySelectorAll('.wlQ button'), function (q) { q.onclick = function () { amt = +q.getAttribute('data-v'); inp.value = money(amt); }; });
    $('wlBack').onclick = render; $('wlGo').onclick = function () { amt = parse(inp.value); if (!(amt >= 1)) { $('wlErr').textContent = 'Enter an amount of at least $1.'; return; } if (amt > MAXIN) { $('wlErr').textContent = 'Max ' + money(MAXIN) + ' per transfer.'; return; } process(); }; }
  function parse(v) { var n = Math.floor(parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0); return n; }
  function process() { var b = $('wlBox'), steps = ['Verifying account…', 'Authorizing transfer…', 'Crediting your wallet…'], i = 0;
    b.innerHTML = '<h2>Processing</h2><div class="sub">' + src + ' → Wallet</div><div class="wlSpin"></div><p id="wlStep" style="text-align:center;color:#d9bf85">' + steps[0] + '</p><div class="wlF">Demo funds — no real money.</div>';
    var iv = setInterval(function () { i++; if (i < steps.length) { $('wlStep').textContent = steps[i]; return; } clearInterval(iv); done(); }, 750); }
  function done() { var C = window.Chips; tag = 'Transfer in'; if (C) C.give(amt); tag = null;
    var ref = 'TX' + Date.now().toString(36).toUpperCase().slice(-8), d = new Date();
    $('wlBox').innerHTML = '<h2>Transfer complete</h2><div class="sub">Receipt</div><div class="wlOk">✓</div>' +
      '<div class="wlR"><div><span>Amount</span><span>' + money(amt) + '</span></div><div><span>From</span><span>' + src + '</span></div><div><span>To</span><span>Casino wallet</span></div><div><span>Reference</span><span>' + ref + '</span></div><div><span>Date</span><span>' + d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + '</span></div><div><span>New balance</span><span>' + money(C ? C.bal() : 0) + '</span></div></div>' +
      '<div class="wlBtns"><button class="wlB g" id="wlDone" type="button">Done</button></div><div class="wlF">Demo funds — no real money. Nothing was charged.</div>';
    $('wlDone').onclick = render; }
  function open() { ensure(); loadStats(); needChips(function () { render(); $('wlS').classList.add('on'); }); }
  function close() { var d = $('wlS'); if (d) d.classList.remove('on'); }
  /* session stats (this visit, per game): rounds, won, lost, net */
  function session(id, staked, returned) { var SK = 'gc18_sess_' + id, SS = { n: 0, won: 0, lost: 0 }; try { SS = JSON.parse(sessionStorage.getItem(SK)) || SS; } catch (e) {}
    if (staked != null) { SS.n++; var net = returned - staked; if (net > 0) SS.won += net; else SS.lost += -net; try { sessionStorage.setItem(SK, JSON.stringify(SS)); } catch (e) {} window.__lastResult = { staked: staked, returned: returned, net: net, t: Date.now() }; }
    var el = $('ckSess'); if (!el) { el = document.createElement('div'); el.id = 'ckSess'; el.style.cssText = 'position:fixed;z-index:30;left:10px;top:calc(env(safe-area-inset-top) + 62px);background:rgba(12,9,8,.82);border:1px solid rgba(176,141,87,.6);border-radius:14px;padding:5px 10px;font:500 11px Helvetica,Arial,sans-serif;color:#e8d3a0;letter-spacing:.03em;pointer-events:none'; document.body.appendChild(el); }
    var f = function (n) { return Math.round(n).toLocaleString('en-US'); }, nt = SS.won - SS.lost;
    el.innerHTML = (id === 'holdemroyale' ? 'Hands ' : 'Rounds ') + '<b>' + SS.n + '</b> · Won <b style="color:#8fd0a4">' + f(SS.won) + '</b> · Lost <b style="color:#d98a96">' + f(SS.lost) + '</b> · Net <b style="color:' + (nt >= 0 ? '#8fd0a4' : '#d98a96') + '">' + (nt >= 0 ? '+' : '−') + f(Math.abs(nt)) + '</b>'; }
  window.Wallet = { open: open, close: close, log: log, session: session };
  needChips(function () {});
  function addFab() { if (game === 'index' || game === 'floor' || $('wlFab')) return; var b = document.createElement('button'); b.id = 'wlFab'; b.className = 'wlFab'; b.type = 'button'; b.textContent = 'Wallet';
    b.onclick = open; addCss(); if (game === 'steelfront') { b.style.top = 'calc(10px + env(safe-area-inset-top))'; b.style.right = '52px'; b.style.bottom = 'auto'; b.style.left = 'auto'; } document.body.appendChild(b); }
  if (document.body) addFab(); else document.addEventListener('DOMContentLoaded', addFab);
})();
