/* Casino shim for 27Hoops: on the Apex Arcade platform the shell wired the
   floating Back button; here it simply returns to the casino lobby. */
(function () {
  function wire() { var b = document.getElementById('back'); if (!b) return;
    b.style.display = 'block';
    b.addEventListener('click', function () { location.href = 'index.html'; }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
