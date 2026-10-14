/* Casino shim for 27Hoops: wires the floating Back button (returns to the
   lobby), keeps the game in landscape, and caps the render resolution so
   phones don't run out of graphics memory (full 3x pixel ratio + this 3D
   scene crash-loops iOS Safari). */
(function () {
  function wire() { var b = document.getElementById('back'); if (!b) return;
    b.style.display = 'block';
    b.addEventListener('click', function () { location.href = 'index.html'; }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  /* landscape: rotate prompt in portrait; fullscreen + orientation lock where supported */
  var st = document.createElement('style');
  st.textContent = '#rotOv{display:none} @media (orientation: portrait){ #rotOv{display:flex} }';
  document.head.appendChild(st);
  function mkOv() { if (document.getElementById('rotOv')) return; var ov = document.createElement('div'); ov.id = 'rotOv';
    ov.setAttribute('style', 'position:fixed;inset:0;z-index:99;background:#05070f;color:#e8d3a0;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;font-family:system-ui;padding:24px');
    ov.innerHTML = '<div style="font-size:44px">&#8635;</div><div style="font-size:19px;font-weight:700;letter-spacing:.04em">Rotate your device</div><div style="font-size:14px;opacity:.75">27Hoops plays in landscape.</div><a href="index.html" style="color:#e8d3a0;font-size:13px;opacity:.8;margin-top:10px">&#8249; Back to the casino</a>';
    document.body.appendChild(ov); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mkOv); else mkOv();
  function tryLock() { try { var el = document.documentElement;
      if (el.requestFullscreen && !document.fullscreenElement) { var p = el.requestFullscreen(); if (p && p.catch) p.catch(function () {}); }
      if (screen.orientation && screen.orientation.lock) { var q = screen.orientation.lock('landscape'); if (q && q.catch) q.catch(function () {}); } } catch (e) {} }
  document.addEventListener('pointerdown', tryLock, { capture: true });
  /* resolution cap (2x still looks sharp on phones) */
  var n = 0, iv = setInterval(function () { n++; var h = window.__h27, r = h && h.renderer;
    if (r) { try { if (r.getPixelRatio() > 2) { r.setPixelRatio(2); r.setSize(window.innerWidth, window.innerHeight); window.dispatchEvent(new Event('resize')); } } catch (e) {} clearInterval(iv); }
    if (n > 120) clearInterval(iv); }, 250);
})();
