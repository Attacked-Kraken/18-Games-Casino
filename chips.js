/* ch1 2026-10-11 (owner: "10 new casino games"): one shared FUN-CHIP wallet for the new 18 Games Casino games.
   FUN CHIPS ONLY: no real money, chips can't be bought, won as prizes or cashed out. Saved on this phone only (localStorage).
   Start 5,000; when a player is broke (< 10 chips) they can collect a free top-up of 5,000 once per calendar day.
   Chips.bal(), Chips.can(n), Chips.take(n) -> bool, Chips.give(n), Chips.on(fn), Chips.topupReady(), Chips.topup() -> bool */
(function () {
  if (window.Chips) return;
  var KEY = 'gc18_chips', START = 5000, TOP = 5000, MIN = 10, fns = [];
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && isFinite(o.bal)) return o; } catch (e) {} return { bal: START, day: '' }; }
  var S = load();
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} fns.forEach(function (f) { try { f(S.bal); } catch (e) {} }); }
  window.addEventListener('storage', function (e) { if (e.key === KEY) { S = load(); save(); } });
  window.Chips = {
    START: START, TOPUP: TOP, NOTE: 'Fun chips only · no real money',
    bal: function () { return S.bal; },
    can: function (n) { return n > 0 && S.bal >= n; },
    take: function (n) { n = Math.round(n); if (!(n > 0) || S.bal < n) return false; S.bal -= n; save(); return true; },
    give: function (n) { n = Math.round(n); if (n > 0) { S.bal += n; save(); } },
    on: function (f) { fns.push(f); },
    broke: function () { return S.bal < MIN; },
    topupReady: function () { return S.bal < MIN && S.day !== today(); },
    topup: function () { if (!this.topupReady()) return false; S.bal += TOP; S.day = today(); save(); return true; }
  };
})();
