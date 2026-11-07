/* APEX STUDIO - the owner's no-code editor inside every game (owner Nov 6 2026 11:08 PM "without no help from AI ... add trees in the grass,
   build roads, change engine sound and tune it, change characters, add a new camera view, better movement").
   Open any game with ?studio=1 (or tap the game's 🎛️ button once studio is on). Everything is sliders, taps and drags.

   HOW A GAME USES IT (a few lines, any game, 2D or 3D):
     <script src="kit/studio.js"></script>                       (before the game's own script)
     const v = Studio.num('engine.pitch', 1, {min:0.5, max:2, step:0.01, label:'Engine pitch', group:'Engine sound'});
            - call it where the number is used; it returns the owner's value, or the default
     Studio.color('player.shirt', '#ff2d20', {label:'Shirt colour', group:'Players'});
     Studio.world({THREE, scene, camera, renderer, canvas, groundY:(x,z)=>0, center:()=>({x,z})});   3D games: lets him place things
     Studio.camView()  -> null, or {back, up, side, ahead, fov} when he picked one of HIS camera views; the game frames it its own way
     Studio.ownsCamera() -> true while he is placing things (the game skips its own camera that frame)
     Studio.points('track.edit', defaultArray)  -> a list of {x,z} he may drag (track / road shapes); the game rebuilds from it
     Studio.on('change', fn)  -> fn(key) after any edit (rebuild things that are only built once)

   WHERE IT SAVES: this phone first (instant, only you see it), then "Publish" makes a code you paste into the Mac mini's
   controller (🎛️ Studio publish) - a Muse window writes it to mods/<game>.json on GitHub, the robot checks it, and every
   player gets it. mods/<game>.json is read by this file when the game loads.
*/
(function () {
  if (window.Studio) return;
  const GAME = (location.pathname.split('/').pop() || 'game').replace(/\.html?$/, '') || 'game';
  const KEY = 'apexStudio_' + GAME;
  const defs = {}, order = [], listeners = {};
  let pub = { v: 1, nums: {}, colors: {}, props: [], cams: [], points: {} };      // published (mods/<game>.json)
  let mine = null;                                                                 // this phone's draft
  try { const x = new XMLHttpRequest(); x.open('GET', 'mods/' + GAME + '.json?' + Date.now(), false); x.send(); if (x.status === 200) pub = Object.assign(pub, JSON.parse(x.responseText)); } catch (e) {}
  try { const s = localStorage.getItem(KEY); if (s) mine = JSON.parse(s); } catch (e) {}
  const D = () => mine || pub;
  const ensure = () => { if (!mine) mine = JSON.parse(JSON.stringify(pub)); return mine; };
  const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) {} };
  const emit = (ev, a) => (listeners[ev] || []).forEach(f => { try { f(a); } catch (e) { console.warn('studio listener', e); } });
  const on = () => { try { return /[?&]studio=1/.test(location.search) || localStorage.getItem('apexStudioOn') === '1'; } catch (e) { return false; } };
  if (/[?&]studio=1/.test(location.search)) { try { localStorage.setItem('apexStudioOn', '1'); } catch (e) {} }

  function declare(list) { (list || []).forEach(d => reg(d.key, d.def, d, d.kind || 'num')); }      // a game lists its sliders up front, so they show before they are used
  function reg(key, def, opt, kind) {
    if (!defs[key]) { defs[key] = Object.assign({ def, kind, label: key, group: 'Other' }, opt || {}); order.push(key); if (ui.open) ui.draw(); }
  }
  function num(key, def, opt) {
    reg(key, def, opt, 'num');
    const v = D().nums[key];
    return (typeof v === 'number' && isFinite(v)) ? v : def;
  }
  function color(key, def, opt) { reg(key, def, opt, 'color'); const v = D().colors[key]; return (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) ? v : def; }
  function set(kind, key, v) { const m = ensure(); m[kind === 'color' ? 'colors' : 'nums'][key] = v; saveLocal(); emit('change', key); }
  function points(key, def) { const p = D().points[key]; return Array.isArray(p) && p.length > 1 ? p : def; }

  /* ---------- world: placing things in 3D ---------- */
  const W = { ok: false, THREE: null, objs: [], placing: false, kind: 'tree', cam: { x: 0, z: 0, h: 90, y: 0 } };
  const KINDS = {
    tree:   { label: 'Tree', make(T, s) { const g = new T.Group(); const tr = new T.Mesh(new T.CylinderGeometry(0.35 * s, 0.5 * s, 3 * s, 6), new T.MeshLambertMaterial({ color: 0x5a3d26 })); tr.position.y = 1.5 * s; g.add(tr);
              const l = new T.MeshLambertMaterial({ color: 0x2f7a35 }); for (const [y, r] of [[4, 2.2], [5.4, 1.6], [6.5, 1.0]]) { const b = new T.Mesh(new T.SphereGeometry(r * s, 8, 6), l); b.position.y = y * s; g.add(b); } return g; } },
    pine:   { label: 'Pine tree', make(T, s) { const g = new T.Group(); const tr = new T.Mesh(new T.CylinderGeometry(0.3 * s, 0.4 * s, 2 * s, 6), new T.MeshLambertMaterial({ color: 0x4a3322 })); tr.position.y = s; g.add(tr);
              const c = new T.Mesh(new T.ConeGeometry(2 * s, 6 * s, 8), new T.MeshLambertMaterial({ color: 0x1f5a2a })); c.position.y = 5 * s; g.add(c); return g; } },
    bush:   { label: 'Bush', make(T, s) { const m = new T.Mesh(new T.SphereGeometry(1.2 * s, 8, 6), new T.MeshLambertMaterial({ color: 0x3b8a3a })); m.scale.y = 0.6; m.position.y = 0.6 * s; return m; } },
    rock:   { label: 'Rock', make(T, s) { const m = new T.Mesh(new T.DodecahedronGeometry(1.2 * s, 0), new T.MeshLambertMaterial({ color: 0x80868c })); m.position.y = 0.7 * s; m.rotation.set(0.4, 0.9, 0.2); return m; } },
    cone:   { label: 'Cone', make(T, s) { const m = new T.Mesh(new T.ConeGeometry(0.35 * s, 0.9 * s, 12), new T.MeshLambertMaterial({ color: 0xff6a00 })); m.position.y = 0.45 * s; return m; } },
    tyres:  { label: 'Tyre stack', make(T, s) { const g = new T.Group(); const mm = new T.MeshLambertMaterial({ color: 0x1a1a1a }); for (let i = 0; i < 3; i++) { const t = new T.Mesh(new T.TorusGeometry(0.45 * s, 0.2 * s, 6, 14), mm); t.rotation.x = Math.PI / 2; t.position.y = (0.2 + i * 0.38) * s; g.add(t); } return g; } },
    light:  { label: 'Light pole', make(T, s) { const g = new T.Group(); const p = new T.Mesh(new T.CylinderGeometry(0.12 * s, 0.15 * s, 9 * s, 6), new T.MeshLambertMaterial({ color: 0x9aa3ad })); p.position.y = 4.5 * s; g.add(p);
              const h = new T.Mesh(new T.BoxGeometry(1.4 * s, 0.3 * s, 0.6 * s), new T.MeshBasicMaterial({ color: 0xfff6d0 })); h.position.y = 9 * s; g.add(h); return g; } },
    block:  { label: 'Building', make(T, s) { const m = new T.Mesh(new T.BoxGeometry(8 * s, 10 * s, 8 * s), new T.MeshLambertMaterial({ color: 0xb7a99a })); m.position.y = 5 * s; return m; } },
    road:   { label: 'Road piece', make(T, s) { const m = new T.Mesh(new T.BoxGeometry(10 * s, 0.08, 20 * s), new T.MeshLambertMaterial({ color: 0x3a3d42 })); m.position.y = 0.05; return m; } },
    fence:  { label: 'Fence', make(T, s) { const g = new T.Group(); const mm = new T.MeshLambertMaterial({ color: 0xd8dde2 }); for (const y of [0.5, 1.0]) { const r = new T.Mesh(new T.BoxGeometry(10 * s, 0.08, 0.08), mm); r.position.y = y * s; g.add(r); } for (const x of [-5, 0, 5]) { const p = new T.Mesh(new T.BoxGeometry(0.1, 1.2 * s, 0.1), mm); p.position.set(x * s, 0.6 * s, 0); g.add(p); } return g; } },
    crowd:  { label: 'People', make(T, s) { const g = new T.Group(); for (let i = 0; i < 6; i++) { const c = new T.Color().setHSL(Math.random(), 0.6, 0.5); const b = new T.Mesh(new T.CapsuleGeometry ? new T.CapsuleGeometry(0.25 * s, 0.9 * s, 3, 6) : new T.CylinderGeometry(0.25 * s, 0.25 * s, 1.4 * s, 6), new T.MeshLambertMaterial({ color: c })); b.position.set((i % 3 - 1) * 0.8 * s, 0.8 * s, ((i / 3) | 0) * 0.8 * s); g.add(b); } return g; } },
  };
  function addKind(id, label, make) { KINDS[id] = { label, make }; }
  function buildProp(p) {
    const T = W.THREE, k = KINDS[p.kind]; if (!T || !k) return null;
    const o = k.make(T, p.s || 1); o.position.x += p.x; o.position.z += p.z; o.position.y += (W.groundY ? W.groundY(p.x, p.z) : 0); o.rotation.y = p.r || 0;
    o.userData.studio = p; W.root.add(o); return o;
  }
  function scopeNow() { try { return W.scope ? String(W.scope()) : ''; } catch (e) { return ''; } }      // e.g. the track id: things belong to the track they were placed on
  function rebuildProps() { if (!W.ok) return; while (W.root.children.length) W.root.remove(W.root.children[0]); const sc = scopeNow(); (D().props || []).filter(p => !p.t || p.t === sc).forEach(buildProp); }
  function world(o) {
    Object.assign(W, o); W.ok = !!(o.THREE && o.scene && o.camera);
    if (!W.ok) return;
    if (!W.root) { W.root = new o.THREE.Group(); W.root.name = 'studioProps'; }
    if (W.root.parent !== o.scene) o.scene.add(W.root);
    rebuildProps();
    W.cv = o.canvas || (o.renderer && o.renderer.domElement);
    if (!window.__studioTaps) { window.__studioTaps = 1; window.addEventListener('pointerdown', tapStart, true); window.addEventListener('pointerup', tapEnd, true); window.addEventListener('pointermove', tapMove, true); }
  }
  let tap = null;
  function inPanel(e) { return ui.el && (ui.el.contains(e.target) || (ui.btn && ui.btn.contains(e.target))); }
  function tapStart(e) { if (!W.placing || inPanel(e)) return; tap = { x: e.clientX, y: e.clientY, cx: W.cam.x, cz: W.cam.z, moved: false }; e.stopPropagation(); e.preventDefault(); }
  function tapMove(e) { if (!W.placing || !tap) return; const dx = e.clientX - tap.x, dy = e.clientY - tap.y; if (Math.abs(dx) + Math.abs(dy) > 8) tap.moved = true;
    const k = W.cam.h / 400; W.cam.x = tap.cx - dx * k; W.cam.z = tap.cz - dy * k; e.stopPropagation(); e.preventDefault(); }
  function tapEnd(e) {
    if (!W.placing || !tap) return; e.stopPropagation(); e.preventDefault(); const was = tap; tap = null; if (was.moved) return;
    const T = W.THREE, r = (W.cv || e.target).getBoundingClientRect();
    const v = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const rc = new T.Raycaster(); rc.setFromCamera(v, W.camera);
    const hit = rc.intersectObjects(W.root.children, true)[0];
    if (W.kind === 'erase') { if (hit) { let o = hit.object; while (o.parent && o.parent !== W.root) o = o.parent; const m = ensure(); m.props = m.props.filter(p => p !== o.userData.studio && !(p.x === o.userData.studio.x && p.z === o.userData.studio.z)); saveLocal(); rebuildProps(); ui.draw(); } return; }
    const gy = W.groundY ? W.groundY(W.cam.x, W.cam.z) : 0;
    const pt = new T.Vector3(); if (!rc.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -gy), pt)) return;
    const m = ensure(); const p = { kind: W.kind, x: Math.round(pt.x * 10) / 10, z: Math.round(pt.z * 10) / 10, s: ui.size, r: Math.round(Math.random() * 628) / 100 }; const sc = scopeNow(); if (sc) p.t = sc;
    m.props.push(p); saveLocal(); buildProp(p); ui.draw();
  }
  function ownsCamera() {
    if (!W.placing || !W.ok) return false;
    const c = W.camera, gy = W.groundY ? W.groundY(W.cam.x, W.cam.z) : 0;
    c.position.set(W.cam.x, gy + W.cam.h, W.cam.z + W.cam.h * 0.35); c.lookAt(W.cam.x, gy, W.cam.z); return true;
  }

  /* ---------- the owner's own camera views ---------- */
  let camPick = -1;
  try { camPick = +(localStorage.getItem(KEY + '_cam') || -1); } catch (e) {}
  function camView() { const c = D().cams || []; return camPick >= 0 && c[camPick] ? c[camPick] : null; }
  function camNext() { const n = (D().cams || []).length; camPick = n ? (camPick + 1 >= n ? -1 : camPick + 1) : -1; try { localStorage.setItem(KEY + '_cam', camPick); } catch (e) {} return camView(); }

  /* ---------- the panel ---------- */
  const ui = { open: false, tab: 'tune', size: 1, el: null, btn: null };
  const css = `#apxStudioBtn{position:fixed;left:50%;transform:translateX(-50%);top:max(6px,env(safe-area-inset-top,0px));z-index:99998;font:700 15px system-ui,sans-serif;padding:9px 12px;border-radius:12px;border:1px solid #ffd23a;background:#1a1408e6;color:#ffd23a}
#apxStudio{position:fixed;right:0;top:0;bottom:0;width:min(400px,92vw);z-index:99999;background:#0e1219f2;color:#eef1f5;font:14px system-ui,sans-serif;overflow:auto;padding:10px 12px 60px;box-shadow:-4px 0 18px #0008}
#apxStudio h3{margin:12px 0 4px;font-size:14px;color:#ffd23a}#apxStudio .tabs{display:flex;gap:4px;flex-wrap:wrap}#apxStudio button{font:inherit;border-radius:9px;border:1px solid #39424f;background:#1b2230;color:#eef1f5;padding:7px 10px;margin:2px}
#apxStudio button.on{background:#ffd23a;color:#111;border-color:#ffd23a}#apxStudio .row{margin:6px 0}#apxStudio .row label{display:flex;justify-content:space-between;font-size:13px}
#apxStudio input[type=range]{width:100%}#apxStudio .sub{color:#9aa3b2;font-size:12px}#apxStudio textarea{width:100%;min-height:110px;font:11px ui-monospace,Menlo,monospace;background:#05070b;color:#cfe;border:1px solid #39424f;border-radius:8px}
#apxStudio .chg{color:#ffd23a}`;
  ui.mount = function () {
    if (ui.btn || !on()) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    ui.btn = document.createElement('button'); ui.btn.id = 'apxStudioBtn'; ui.btn.textContent = '🎛️ Studio'; ui.btn.onclick = () => { ui.open = !ui.open; ui.draw(); };
    document.body.appendChild(ui.btn);
    ui.el = document.createElement('div'); ui.el.id = 'apxStudio'; ui.el.hidden = true; document.body.appendChild(ui.el);
    ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown', 'click'].forEach(ev => ui.el.addEventListener(ev, e => e.stopPropagation()));
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  ui.draw = function () {
    if (!ui.el) return; ui.el.hidden = !ui.open; ui.btn.textContent = ui.open ? '✕ Close Studio' : '🎛️ Studio';
    if (!ui.open) { W.placing = false; return; }
    const tabs = [['tune', 'Tune'], ['place', 'Place'], ['cam', 'Cameras'], ['save', 'Save']];
    let h = `<div class="tabs">${tabs.map(([k, n]) => `<button class="${ui.tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
    W.placing = ui.tab === 'place' && W.ok;
    if (ui.tab === 'tune') {
      const groups = {}; order.forEach(k => { (groups[defs[k].group] = groups[defs[k].group] || []).push(k); });
      if (!order.length) h += '<p class="sub">Nothing to tune yet - play a bit (things appear as the game uses them).</p>';
      for (const g of Object.keys(groups)) {
        h += `<h3>${esc(g)}</h3>`;
        for (const k of groups[g]) {
          const d = defs[k];
          if (d.kind === 'color') { const v = color(k, d.def); h += `<div class="row"><label><span class="${v !== d.def ? 'chg' : ''}">${esc(d.label)}</span><input type="color" data-color="${k}" value="${v}"></label></div>`; continue; }
          const v = num(k, d.def), mn = d.min != null ? d.min : d.def * 0.25, mx = d.max != null ? d.max : d.def * 4 || 1, stp = d.step || ((mx - mn) / 200);
          h += `<div class="row"><label><span class="${v !== d.def ? 'chg' : ''}">${esc(d.label)}</span><b>${(+v).toFixed(stp < 1 ? 2 : 0)}</b></label><input type="range" data-num="${k}" min="${mn}" max="${mx}" step="${stp}" value="${v}">`
             + (v !== d.def ? ` <button data-reset="${k}">normal (${d.def})</button>` : '') + `</div>`;
        }
      }
    } else if (ui.tab === 'place') {
      if (!W.ok) h += '<p class="sub">This game has no 3D world hooked up yet.</p>';
      else {
        h += `<p class="sub">The view turns into a map from above. <b>Drag</b> to move around, <b>tap</b> to put the picked thing there. Changes are saved on this phone at once.</p>`;
        h += `<div>${Object.keys(KINDS).map(k => `<button class="${W.kind === k ? 'on' : ''}" data-kind="${k}">${esc(KINDS[k].label)}</button>`).join('')}<button class="${W.kind === 'erase' ? 'on' : ''}" data-kind="erase">🗑️ Erase (tap a thing)</button></div>`;
        h += `<div class="row"><label>Size <b>${ui.size.toFixed(1)}</b></label><input type="range" data-size="1" min="0.3" max="4" step="0.1" value="${ui.size}"></div>`;
        h += `<div class="row"><label>Height of the map view <b>${W.cam.h | 0} m</b></label><input type="range" data-camh="1" min="15" max="400" step="5" value="${W.cam.h}"></div>`;
        h += `<p class="sub">${(D().props || []).length} things placed.</p><button data-undo="1">↩️ Undo last</button><button data-center="1">🎯 Back to the car / player</button>`;
      }
    } else if (ui.tab === 'cam') {
      const cams = D().cams || [];
      h += `<p class="sub">Make your own camera views. In the game, the camera button steps through the game's views, then yours.</p>`;
      cams.forEach((c, i) => {
        h += `<h3>${esc(c.name || 'My view ' + (i + 1))} ${camPick === i ? '(in use)' : ''}</h3>`;
        for (const [f, lab, mn, mx] of [['back', 'Behind (m)', -20, 60], ['up', 'Height (m)', 0, 60], ['side', 'To the side (m)', -30, 30], ['ahead', 'Looks ahead (m)', -10, 80], ['fov', 'Zoom (field of view)', 20, 110]])
          h += `<div class="row"><label>${lab}<b>${c[f]}</b></label><input type="range" data-cam="${i}" data-f="${f}" min="${mn}" max="${mx}" step="0.5" value="${c[f]}"></div>`;
        h += `<button data-usecam="${i}">${camPick === i ? '✓ Using it' : 'Use this view'}</button><button data-delcam="${i}">🗑️ Delete</button>`;
      });
      h += `<div><button data-addcam="1">➕ Add a camera view</button> ${camPick >= 0 ? '<button data-usecam="-1">Back to the game\'s views</button>' : ''}</div>`;
    } else {
      const js = JSON.stringify(mine || pub);
      h += `<p class="sub">${mine ? 'You have changes saved on THIS phone only.' : 'No changes on this phone.'}</p>`;
      h += `<button data-pub="1">📤 Publish (opens your controller)</button> <button data-clear="1">↩️ Undo ALL my changes</button>`;
      h += `<p class="sub">Publish opens your controller's Paste a fix page with it filled in: tap Check, then Send. A Muse window saves it to mods/${GAME}.json; after the robot check every player gets it.</p>`;
      h += `<textarea id="apxPub" readonly placeholder="tap Make the publish code">${ui.pubText || ''}</textarea><div class="sub" id="apxPubMsg"></div>`;
      h += `<p class="sub">${esc(GAME)} · ${order.length} sliders · ${(D().props || []).length} things · ${(D().cams || []).length} camera views · ${js.length} letters</p>`;
    }
    ui.el.innerHTML = h;
    ui.el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { ui.tab = b.dataset.tab; if (ui.tab === 'place' && W.center) { const c = W.center(); if (c) { W.cam.x = c.x; W.cam.z = c.z; } } ui.draw(); });
    ui.el.querySelectorAll('[data-num]').forEach(r => { r.oninput = () => { set('num', r.dataset.num, +r.value); r.previousElementSibling.querySelector('b').textContent = (+r.value).toFixed(+r.step < 1 ? 2 : 0); }; r.onchange = () => ui.draw(); });
    ui.el.querySelectorAll('[data-color]').forEach(r => r.oninput = () => set('color', r.dataset.color, r.value));
    ui.el.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => { const m = ensure(); delete m.nums[b.dataset.reset]; saveLocal(); emit('change', b.dataset.reset); ui.draw(); });
    ui.el.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { W.kind = b.dataset.kind; ui.draw(); });
    const sz = ui.el.querySelector('[data-size]'); if (sz) sz.oninput = () => { ui.size = +sz.value; sz.previousElementSibling.querySelector('b').textContent = ui.size.toFixed(1); };
    const ch = ui.el.querySelector('[data-camh]'); if (ch) ch.oninput = () => { W.cam.h = +ch.value; ch.previousElementSibling.querySelector('b').textContent = (W.cam.h | 0) + ' m'; };
    const un = ui.el.querySelector('[data-undo]'); if (un) un.onclick = () => { const m = ensure(); m.props.pop(); saveLocal(); rebuildProps(); ui.draw(); };
    const ce = ui.el.querySelector('[data-center]'); if (ce) ce.onclick = () => { const c = W.center && W.center(); if (c) { W.cam.x = c.x; W.cam.z = c.z; } };
    ui.el.querySelectorAll('[data-cam]').forEach(r => r.oninput = () => { const m = ensure(); m.cams[+r.dataset.cam][r.dataset.f] = +r.value; saveLocal(); camPick = +r.dataset.cam; r.previousElementSibling.querySelector('b').textContent = r.value; emit('change', 'cam'); });
    ui.el.querySelectorAll('[data-cam]').forEach(r => r.onchange = () => ui.draw());
    ui.el.querySelectorAll('[data-usecam]').forEach(b => b.onclick = () => { camPick = +b.dataset.usecam; try { localStorage.setItem(KEY + '_cam', camPick); } catch (e) {} emit('change', 'cam'); ui.draw(); });
    ui.el.querySelectorAll('[data-delcam]').forEach(b => b.onclick = () => { const m = ensure(); m.cams.splice(+b.dataset.delcam, 1); camPick = -1; saveLocal(); ui.draw(); });
    const ac = ui.el.querySelector('[data-addcam]'); if (ac) ac.onclick = () => { const m = ensure(); const c = W.camDefault || { back: 12, up: 4, side: 0, ahead: 10, fov: 60 }; m.cams.push(Object.assign({ name: 'My view ' + (m.cams.length + 1) }, c)); camPick = m.cams.length - 1; saveLocal(); emit('change', 'cam'); ui.draw(); };
    const pb = ui.el.querySelector('[data-pub]'); if (pb) pb.onclick = () => {
      ui.pubText = 'STUDIO ' + GAME + ' ' + JSON.stringify(mine || pub); ui.draw();
      const ta = document.getElementById('apxPub'); const msg = document.getElementById('apxPubMsg');
      try { navigator.clipboard.writeText(ui.pubText).catch(() => {}); } catch (e) {}
      const b64 = btoa(unescape(encodeURIComponent(ui.pubText))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const w = window.open('about:blank', '_blank');
      let t = '', pin = '', home = 'http://192.168.1.231:8765'; try { t = localStorage.getItem('apexLinkTopic') || ''; pin = localStorage.getItem('apexLinkPin') || ''; home = (localStorage.getItem('apexCtlUrl') || home).replace(/\/$/, ''); } catch (e) {}
      const open = u => { const url = u + '/fix#fp=' + b64 + (pin ? '&pin=' + encodeURIComponent(pin) : ''); if (w) w.location = url; else location.href = url; msg.textContent = 'Opening your controller...'; };
      if (!t) open(home); else fetch('https://ntfy.sh/' + encodeURIComponent(t) + '/json?poll=1&since=24h', { cache: 'no-store' }).then(r => r.text()).then(x => { let u = '';
        x.trim().split('\n').forEach(l => { try { const m = (JSON.parse(l).message || '').match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if (m) u = m[0]; } catch (e) {} }); open(u || home); }).catch(() => open(home));
    };
    const cl = ui.el.querySelector('[data-clear]'); if (cl) cl.onclick = () => { if (cl.dataset.sure) { mine = null; try { localStorage.removeItem(KEY); } catch (e) {} rebuildProps(); emit('change', '*'); ui.draw(); } else { cl.dataset.sure = 1; cl.textContent = 'Tap again to undo everything'; } };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui.mount); else ui.mount();

  window.Studio = { declare, num, color, points, world, ownsCamera, camView, camNext, addKind, kinds: KINDS,
    on: (ev, f) => { (listeners[ev] = listeners[ev] || []).push(f); }, active: on, game: GAME,
    data: () => D(), placing: () => W.placing, debug: () => ({ world: W.ok, scope: scopeNow(), props: W.root ? W.root.children.length : 0 }), refresh: () => { if (W.ok && W.root.parent !== W.scene) W.scene.add(W.root); rebuildProps(); } };
})();
