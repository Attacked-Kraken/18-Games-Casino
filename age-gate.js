/* ag1 2026-10-11 (owner: "get me ready"): neutral age check for 18 Games Casino. Asks month and year of birth once (no hint which
   answer passes), keeps it on this device only, and never sends it anywhere. Velvet 21 and Gilded Reels need 18+, Steelfront 13+.
   A game page opened directly checks too and sends a player who hasn't answered (or is too young) back to the home page. */
(function () {
  var KEY = 'ax_born', NEED = { velvet21: 18, steelfront: 13, gildedreels: 18, rubyroulette: 18, diamondpoker: 18, holdemroyale: 18, baccaratnoir: 18, dicepalace: 18, plinkodrop: 18, rocketcrash: 18, luckykeno: 18, bigwheel: 18, candyrush: 18 };
  function born() { try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.y ? v : null; } catch (e) { return null; } }
  function age() { var b = born(); if (!b) return -1; var d = new Date(), a = d.getFullYear() - b.y; if (d.getMonth() + 1 < b.m) a--; return a; }
  function ok(id) { return age() >= (NEED[id] || 0); }
  window.AXAge = { NEED: NEED, born: born, age: age, ok: ok, save: function (m, y) { try { localStorage.setItem(KEY, JSON.stringify({ m: m, y: y })); } catch (e) {} } };
  var page = (location.pathname.match(/(velvet21|steelfront|gildedreels|rubyroulette|diamondpoker|holdemroyale|baccaratnoir|dicepalace|plinkodrop|rocketcrash|luckykeno|bigwheel|candyrush)\.html$/) || [])[1];
  if (page && !ok(page)) location.replace('./?play=' + page);
})();
