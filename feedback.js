/* Owner's feedback kit (owner, 2026-10-16) - Game Development page only, never in a launched game.
   While a game runs on sports.html:  ✏️ draw / circle on the screen · 🎥 record the game WITH the drawing ·
   📸 snap a picture · 📤 send it all to the Muses (it opens the owner's controller, which turns it into a job).
   No network calls of its own: the video goes straight from this page to the controller tab on the owner's phone. */
(function () {
  var CTL_KEY = 'apexCtlUrl', DEF = 'http://192.168.1.25:8765/';
  function ctl() { try { return localStorage.getItem(CTL_KEY) || DEF; } catch (e) { return DEF; } }
  var css = document.createElement('style');
  css.textContent =
    '.fbk{position:absolute;inset:0;z-index:30;pointer-events:none}' +
    /* owner 2026-10-17: phone held upright = the game turns itself sideways, so the pencil, record bar and drawing turn
       with it (same turn as the games: 90deg clockwise) - the video and circles then line up with the game */
    '.fbk.turned{inset:auto;left:0;top:0;transform-origin:left top;transform:rotate(90deg) translateY(-100%)}' +
    '.fbk canvas.ink{position:absolute;inset:0;width:100%;height:100%;touch-action:none}' +
    '.fbk.drawing canvas.ink{pointer-events:auto;cursor:crosshair}' +
    /* owner 2026-10-17: small, icons only, so the game is still playable with the tools open */
    '.fbk .bar{position:absolute;top:6px;left:50%;transform:translateX(-50%);display:flex;gap:3px;pointer-events:auto;' +
    'background:rgba(10,12,20,.6);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:3px}' +
    '.fbk .bar button{font:600 13px/1 system-ui;color:#fff;background:rgba(42,47,61,.85);border:0;border-radius:9px;padding:5px 6px;min-width:30px;height:28px}' +
    '.fbk .bar button.on{background:#e8322a}.fbk .bar .send{background:#2563eb}' +
    '.fbk .msg{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;' +
    'font:600 13px system-ui;padding:7px 12px;border-radius:10px;pointer-events:none;opacity:0;transition:opacity .3s}' +
    '.fbk .msg.show{opacity:1}.fbk .rec{position:absolute;top:12px;right:12px;width:14px;height:14px;border-radius:50%;background:#e8322a;display:none}' +
    '.fbk.recording .rec{display:block;animation:fbkb 1s infinite}@keyframes fbkb{50%{opacity:.2}}';
  document.head.appendChild(css);

  function gameCanvas(f) {
    try {
      var cs = Array.prototype.slice.call(f.contentDocument.querySelectorAll('canvas'));
      cs.sort(function (a, b) { return b.width * b.height - a.width * a.height; });
      return cs[0] || null;
    } catch (e) { return null; }
  }

  function open(stage, iframe, name) {
    var old = stage.querySelector('.fbk'); if (old) { old._close(); return; }
    var box = document.createElement('div'); box.className = 'fbk';
    box.innerHTML = '<canvas class="ink"></canvas><div class="rec"></div><div class="bar">' +
      '<button data-a="draw" aria-label="Draw">✏️</button><button data-a="erase" aria-label="Erase">🧽</button><button data-a="rec" aria-label="Record">🎥</button>' +
      '<button data-a="snap" aria-label="Picture">📸</button><button data-a="send" class="send" aria-label="Send">📤</button><button data-a="set">⚙</button><button data-a="close">✕</button></div><div class="msg"></div>';
    stage.appendChild(box);
    var ink = box.querySelector('.ink'), ix = ink.getContext('2d'), msgEl = box.querySelector('.msg');
    var snaps = [], video = null, rec = null, chunks = [], recTimer = 0, mt;
    function say(t) { msgEl.textContent = t; msgEl.classList.add('show'); clearTimeout(mt); mt = setTimeout(function () { msgEl.classList.remove('show'); }, 2500); }
    var turned = false;
    function size() {
      var r = stage.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      turned = r.height > r.width;   /* upright phone: work sideways, like the game */
      box.classList.toggle('turned', turned);
      box.style.width = turned ? r.height + 'px' : ''; box.style.height = turned ? r.width + 'px' : '';
      var w = turned ? r.height : r.width, h = turned ? r.width : r.height;
      if (ink.width === Math.round(w * d) && ink.height === Math.round(h * d)) return;   /* same size: keep the drawing as is */
      var keep = ink.width ? ink.toDataURL() : null;
      ink.width = Math.round(w * d); ink.height = Math.round(h * d);
      ix.lineCap = ix.lineJoin = 'round'; ix.strokeStyle = '#ff2a1e'; ix.lineWidth = 6 * d;
      if (keep) { var im = new Image(); im.onload = function () { ix.drawImage(im, 0, 0, ink.width, ink.height); }; im.src = keep; }
    }
    size(); window.addEventListener('resize', size);
    var ro = null; try { ro = new ResizeObserver(function () { size(); }); ro.observe(stage); } catch (e) {}
    // drawing
    var last = null;
    function pt(e) {
      if (turned) { var s = stage.getBoundingClientRect(); return [(e.clientY - s.top) * ink.width / s.height, (s.right - e.clientX) * ink.height / s.width]; }
      var r = ink.getBoundingClientRect(); return [(e.clientX - r.left) * ink.width / r.width, (e.clientY - r.top) * ink.height / r.height]; }
    ink.addEventListener('pointerdown', function (e) { last = pt(e); ink.setPointerCapture(e.pointerId); e.preventDefault(); });
    ink.addEventListener('pointermove', function (e) { if (!last) return; var p = pt(e); ix.beginPath(); ix.moveTo(last[0], last[1]); ix.lineTo(p[0], p[1]); ix.stroke(); last = p; e.preventDefault(); });
    ink.addEventListener('pointerup', function () { last = null; });
    // the game's own 3D picture, as a live video we can paint with the drawing on top
    function gameVideo() {
      if (video) return video;
      var gc = gameCanvas(iframe);
      if (!gc || !gc.captureStream) return null;
      video = document.createElement('video'); video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
      video.srcObject = gc.captureStream(30); video.play().catch(function () {});
      return video;
    }
    var comp = document.createElement('canvas'), cx = comp.getContext('2d');
    function compose() {
      var v = gameVideo(); comp.width = Math.min(1280, ink.width); comp.height = Math.round(comp.width * ink.height / ink.width);
      cx.fillStyle = '#000'; cx.fillRect(0, 0, comp.width, comp.height);
      if (v && v.videoWidth) cx.drawImage(v, 0, 0, comp.width, comp.height);
      cx.drawImage(ink, 0, 0, comp.width, comp.height);
    }
    function loop() { if (!rec) return; compose(); requestAnimationFrame(loop); }
    function startRec() {
      if (!window.MediaRecorder || !comp.captureStream) { say('This phone can\'t record here - use the phone\'s screen recorder'); return; }
      if (!gameVideo()) { say('Couldn\'t reach this game\'s picture - use the phone\'s screen recorder'); return; }
      compose();
      var type = ['video/mp4', 'video/webm;codecs=vp8', 'video/webm'].filter(function (t) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t); })[0] || '';
      chunks = []; rec = new MediaRecorder(comp.captureStream(30), type ? { mimeType: type } : undefined);
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start(500); loop(); box.classList.add('recording'); btn('rec').classList.add('on'); btn('rec').textContent = '⏹';
      recTimer = setTimeout(stopRec, 60000); say('Recording (up to 60 s) - play and draw');
    }
    function stopRec() {
      if (!rec) return; clearTimeout(recTimer); var r = rec; rec = null; r.stop();
      box.classList.remove('recording'); btn('rec').classList.remove('on'); btn('rec').textContent = '🎥';
      say('Recorded - tap 📤 Send');
    }
    function btn(a) { return box.querySelector('[data-a="' + a + '"]'); }
    function videoBlob() { return chunks.length ? new Blob(chunks, { type: chunks[0].type || 'video/mp4' }) : null; }
    function send() {
      if (rec) stopRec();
      var text = prompt('What\'s wrong in ' + name + '? (one line - the Muse works out the rest)', '');
      if (text === null) return;
      (function () {
        var payload = { type: 'apex-note', game: name, href: iframe.getAttribute('src') || '', text: text, images: snaps.slice(0, 6), video: videoBlob() };
        if (!snaps.length && !payload.video) { compose(); payload.images = [comp.toDataURL('image/jpeg', 0.8)]; }
        var sent = false, w = window.open(ctl() + '?note=1', '_blank');
        function onMsg(e) {
          if (sent || !e.data || e.data.type !== 'muse-ready' || e.source !== w) return;
          sent = true; window.removeEventListener('message', onMsg);
          w.postMessage(payload, '*');
        }
        window.addEventListener('message', onMsg);
        setTimeout(function () {
          if (sent) { snaps = []; chunks = []; ix.clearRect(0, 0, ink.width, ink.height); return; }
          window.removeEventListener('message', onMsg);
          var v = payload.video;
          if (v && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([v], 'game-note.mp4', { type: v.type })] })) {
            if (confirm('Couldn\'t reach your controller (are you on home Wi-Fi?).\n\nSave the video instead, then add it to a note later?'))
              navigator.share({ files: [new File([v], 'game-note.mp4', { type: v.type })], text: name + ': ' + text }).catch(function () {});
          } else say('Couldn\'t reach your controller - are you on home Wi-Fi? (⚙ to change its address)');
        }, 20000);
      })();
    }
    box.querySelector('.bar').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var a = b.dataset.a;
      if (a === 'draw') { box.classList.toggle('drawing'); b.classList.toggle('on'); say(box.classList.contains('drawing') ? 'Draw with your finger - tap ✏️ again to play' : 'Playing'); }
      if (a === 'erase') ix.clearRect(0, 0, ink.width, ink.height);
      if (a === 'rec') rec ? stopRec() : startRec();
      if (a === 'snap') { compose(); snaps.push(comp.toDataURL('image/jpeg', 0.8)); if (snaps.length > 6) snaps.shift(); say('📸 ' + snaps.length + ' picture(s) saved'); }
      if (a === 'send') send();
      if (a === 'close') close();
      if (a === 'set') { var u = prompt('Your controller address (shown on the approver page, e.g. http://192.168.1.25:8765/):', ctl()); if (u) try { localStorage.setItem(CTL_KEY, u); say('Saved'); } catch (x) {} }
    });
    function close() { if (rec) stopRec(); window.removeEventListener('resize', size); if (ro) try { ro.disconnect(); } catch (e) {} if (video) { try { video.srcObject.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} } box.remove(); }
    box._close = close;
    say('✏️ Draw · 🎥 Record · 📸 Snap · 📤 Send to the Muses');
  }
  window.ApexFeedback = { open: open, setController: function (u) { try { localStorage.setItem(CTL_KEY, u); } catch (e) {} } };
})();
