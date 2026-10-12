/* Favorites: star toggles stored in localStorage (gc18_fav). Game pages get a star button automatically. */
(function () {
  var KEY = 'gc18_fav', subs = [];
  function list() { try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} subs.forEach(function (f) { try { f(a); } catch (e) {} }); }
  function has(id) { return list().indexOf(id) >= 0; }
  function toggle(id) { var a = list(), i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.unshift(id); save(a); return i < 0; }
  function star(on) { return on ? '★' : '☆'; }
  var css = '.fv-star{font:20px/1 system-ui;width:40px;height:40px;border-radius:50%;border:1px solid #b08d57;background:rgba(12,8,8,.75);color:#e8d3a0;cursor:pointer;padding:0}.fv-star.on{color:#ffd34a;text-shadow:0 0 10px #ffb400;border-color:#ffd34a}' +
    '#fvGame{position:fixed;z-index:99998;top:calc(98px + env(safe-area-inset-top));right:104px;width:34px;height:34px;font-size:18px}' +
    '.fv-sec{margin:0 0 12px}.fv-sec h3{font:500 12px system-ui;letter-spacing:.2em;color:#c9a45c;margin:0 0 8px}.fv-row{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px}' +
    '.fv-tile{flex:none;width:76px;text-align:center;color:#e8d3a0;font:600 11px system-ui;cursor:pointer;background:none;border:0;padding:0}.fv-tile img{width:72px;height:72px;border-radius:16px;display:block;margin:0 auto 4px;box-shadow:0 2px 10px rgba(0,0,0,.6)}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  window.Fav = { list: list, has: has, toggle: toggle, star: star, onChange: function (f) { subs.push(f); },
    button: function (id, cls) { var b = document.createElement('button'); b.type = 'button'; b.className = 'fv-star' + (cls ? ' ' + cls : ''); b.setAttribute('aria-label', 'Favorite');
      function upd() { var on = has(id); b.textContent = star(on); b.classList.toggle('on', on); b.title = on ? 'Remove from favorites' : 'Add to favorites'; }
      b.onclick = function (e) { e.stopPropagation(); e.preventDefault(); toggle(id); upd(); }; subs.push(upd); upd(); return b; } };
  /* game pages: star in the header area */
  var m = location.pathname.match(/([a-z0-9]+)\.html$/i), id = m && m[1];
  if (id && id !== 'index') { var go = function () { var b = Fav.button(id); b.id = 'fvGame'; if (id === 'steelfront') { b.style.right = '10px'; b.style.top = 'calc(10px + env(safe-area-inset-top))'; } document.body.appendChild(b); };
    if (document.body) go(); else addEventListener('DOMContentLoaded', go); }
})();
