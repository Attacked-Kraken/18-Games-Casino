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
   player gets it. mods/<game>.json is read by this file when the game loads - only when mods/index.json lists the game (no 404s).
*/
(function () {
  if (window.Studio) return;
  const GAME = (location.pathname.split('/').pop() || 'game').replace(/\.html?$/, '') || 'game';
  const KEY = 'apexStudio_' + GAME;
  const defs = {}, order = [], listeners = {};
  let pub = { v: 1, nums: {}, colors: {}, props: [], cams: [], points: {}, edits: {} };      // edits = the Scene tab: changes to the game's OWN objects, by path      // published (mods/<game>.json)
  let mine = null;                                                                 // this phone's draft
  /* Nov 7 2026: mods/index.json (always on main) lists the games that HAVE a mods/<game>.json - a game without one asks for nothing,
     so the robot never sees a 404 'Missing file' (F1's main check showed 'Missing file: mods/apexf1.json' after the Nov 6 Studio) */
  const getJSON = (u) => { try { const x = new XMLHttpRequest(); x.open('GET', u + '?' + Date.now(), false); x.send(); return x.status === 200 ? JSON.parse(x.responseText) : null; } catch (e) { return null; } };
  const MODS_BASE = /\/templates\//.test(location.pathname) ? '../mods/' : 'mods/';
  const IDX = getJSON(MODS_BASE + 'index.json');
  if (IDX && Array.isArray(IDX.games) && IDX.games.indexOf(GAME) >= 0) { const m = getJSON(MODS_BASE + GAME + '.json'); if (m) pub = Object.assign(pub, m); }
  try { const s = localStorage.getItem(KEY); if (s) mine = JSON.parse(s); } catch (e) {}
  const D = () => mine || pub;
  const ensure = () => { if (!mine) mine = JSON.parse(JSON.stringify(pub)); return mine; };
  const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) {} };
  const emit = (ev, a) => (listeners[ev] || []).forEach(f => { try { f(a); } catch (e) { console.warn('studio listener', e); } });
  const on = () => { if (window.__apxTest) return false; try { return /[?&]studio=1/.test(location.search) || localStorage.getItem('apexStudioOn') === '1'; } catch (e) { return false; } };
  if (/[?&]studio=1/.test(location.search)) { try { localStorage.setItem('apexStudioOn', '1'); } catch (e) {} }
  /* owner Nov 7 2026 'I want to see code of how the finish line and track are set in that specific spot': while Studio is on, every 3D thing remembers
     WHERE IN THE CODE it was made (the call chain when three.js built it). Scene tab -> 'Show the code that made this' opens those lines in the Code tab. */
  const BORN = new WeakMap();
  if (on()) try { Error.stackTraceLimit = Math.max(Error.stackTraceLimit || 10, 30);
    Object.defineProperty(Object.prototype, 'isObject3D', { configurable: true, get() { return undefined; },
      set(v) { Object.defineProperty(this, 'isObject3D', { value: v, writable: true, configurable: true, enumerable: true }); try { BORN.set(this, new Error().stack || ''); } catch (e) {} } });
  } catch (e) {}
  function bornAt(o) {                          // [{file, line, fn}] - the game's own code first, three.js itself left out
    const st = BORN.get(o) || '', out = [], me = (location.pathname.split('/').pop() || '');
    st.split('\n').forEach(l => { const m = l.match(/(?:at\s+(?:new\s+)?([^\s(]+)\s+\()?([^\s()@]*?\/([^\/\s()?#]+?\.(?:html?|js|mjs)))(?:\?[^:\s)]*)?:(\d+):\d+/) || null;
      if (!m) return; const file = m[3]; if (/three\.module|studio\.js|GLTFLoader|meshopt|vendor/.test(m[2])) return;
      const fn = m[1] || (l.split('@')[0] || '').trim(); out.push({ file, line: +m[4], fn: fn && !/^(https?|async|eval)/.test(fn) ? fn.replace(/^Object\./, '') : '', mine: file === me }); });
    return out.slice(0, 6);
  }

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
    if (!window.__studioTaps) { window.__studioTaps = 1; window.addEventListener('pointerdown', tapStart, true); window.addEventListener('pointerup', tapEnd, true); window.addEventListener('pointermove', tapMove, true);
      window.addEventListener('pointerdown', sceneTapStart, true); window.addEventListener('pointerup', sceneTapEnd, true); window.addEventListener('pointermove', sceneTapMove, true); }
    if (!W.keptRan) { W.keptRan = 1; setTimeout(runKept, 1500); }   // console lines the owner kept (mods/<game>.json "code")
    applyAll(); E.tries = 0; const re = setInterval(() => { applyAll(); if (++E.tries > 20) clearInterval(re); }, 1500);    // objects a game builds a little later still get their edits
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
    if (ownsCameraScene()) return true;
    if (!W.placing || !W.ok) return false;
    const c = W.camera, gy = W.groundY ? W.groundY(W.cam.x, W.cam.z) : 0;
    c.position.set(W.cam.x, gy + W.cam.h, W.cam.z + W.cam.h * 0.35); c.lookAt(W.cam.x, gy, W.cam.z); return true;
  }

  /* ---------- SCENE: the game's OWN objects (owner Nov 7 2026 7:31 AM "look over games and move and delete and change out things") ----------
     Tap anything in the live scene -> it is picked (box drawn round it), its name + numbers show, drag to move / lift / turn / resize,
     hide, delete (= hidden), recolour, swap it for a model. Every change is saved by the object's PATH in the scene (name#index/...),
     re-applied when the game loads, and published like every other Studio change (mods/<game>.json). */
  const E = { sel: null, tool: 'pick', helper: null, drag: null, level: null, freeze: false, applied: 0, tries: 0, loader: null, models: null };
  const pathOf = (o) => { const parts = []; let x = o; while (x && x !== W.scene) { const p = x.parent; if (!p) return null; parts.unshift((x.name || x.type) + '#' + p.children.indexOf(x)); x = p; } return x === W.scene ? parts.join('/') : null; };
  const byPath = (path) => { let x = W.scene; for (const seg of String(path).split('/')) { const i = +seg.slice(seg.lastIndexOf('#') + 1), nm = seg.slice(0, seg.lastIndexOf('#')); let c = x.children[i]; if (!c || (c.name || c.type) !== nm) c = x.children.find(k => (k.name || k.type) === nm); if (!c) return null; x = c; } return x; };
  const skip = (o) => { let x = o; while (x) { if (x === W.root || x.userData.studioHelper || x.isLight || x.isCamera) return true; x = x.parent; } return false; };
  const sizeOf = (o) => { try { const b = new W.THREE.Box3().setFromObject(o), v = b.getSize(new W.THREE.Vector3()); return Math.max(v.x, v.y, v.z) || 0; } catch (e) { return 0; } };
  function pickTarget(mesh) {            // the mesh -> the THING it belongs to (a tree group, a car), never the whole stadium
    let x = mesh; while (x.parent && x.parent !== W.scene && x.parent.children.length <= 16 && sizeOf(x.parent) <= 60) x = x.parent; return x;
  }
  const label = (o) => (o.name || o.type) + (o.children.length ? ' (' + o.children.length + ' inside)' : '');
  const listLabel = (o) => { const sz = sizeOf(o); let col = ''; o.traverse(m => { if (!col && m.isMesh && m.material && m.material.color) col = '#' + m.material.color.getHexString(); }); return (col ? `<i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${col};margin-right:4px"></i>` : '') + esc(o.name || (o.isMesh ? 'shape' : o.type)) + ` <span class="sub">${sz >= 1000 ? (sz / 1000).toFixed(1) + 'k' : sz.toFixed(sz < 10 ? 1 : 0)}</span>` + (o.children.length ? ' ▸' : ''); };
  function select(o) {
    E.sel = o || null;
    if (E.helper) { W.scene.remove(E.helper); E.helper = null; }
    if (o) { const T = W.THREE; E.helper = new T.BoxHelper(o, 0xffd23a); E.helper.userData.studioHelper = 1; E.helper.renderOrder = 999; W.scene.add(E.helper);
      if (!o.userData.studioOrig) o.userData.studioOrig = { p: o.position.toArray(), r: o.rotation.toArray().slice(0, 3), s: o.scale.toArray(), v: o.visible }; }
    if (ui.open) ui.draw();
  }
  function editOf(o, make) { const m = make ? ensure() : D(); m.edits = m.edits || {}; const k = pathOf(o); if (!k) return null; if (make && !m.edits[k]) m.edits[k] = {}; return m.edits[k] || null; }
  function record(o, patch) { const e = editOf(o, true); if (!e) return; Object.assign(e, patch); saveLocal(); if (E.helper) E.helper.update(); emit('change', 'scene'); }
  function recordTransform(o) { record(o, { p: o.position.toArray().map(v => +v.toFixed(3)), r: o.rotation.toArray().slice(0, 3).map(v => +v.toFixed(4)), s: o.scale.toArray().map(v => +v.toFixed(3)) }); }
  function applyEdit(o, e) {
    if (!o || !e) return; const key = JSON.stringify(e); if (o.userData.studioApplied === key) return; o.userData.studioApplied = key;
    if (!o.userData.studioOrig) o.userData.studioOrig = { p: o.position.toArray(), r: o.rotation.toArray().slice(0, 3), s: o.scale.toArray(), v: o.visible };
    if (e.p) o.position.fromArray(e.p); if (e.r) o.rotation.set(e.r[0], e.r[1], e.r[2]); if (e.s) o.scale.fromArray(e.s);
    o.visible = !(e.hide || e.del);
    if (e.col) o.traverse(m => { if (m.isMesh && m.material && m.material.color) { if (!m.userData.studioMat) m.userData.studioMat = m.material; m.material = m.material.clone(); m.material.color.set(e.col); } });
    if (e.model) swapModel(o, e.model, false);
  }
  function applyAll() { if (!W.ok) return; const ed = D().edits || {}; for (const k in ed) { const o = byPath(k); if (o) applyEdit(o, ed[k]); } E.applied++; }
  function resetSel() { const o = E.sel; if (!o) return; const m = ensure(); const k = pathOf(o); if (m.edits) delete m.edits[k]; saveLocal();
    const g = o.userData.studioOrig; if (g) { o.position.fromArray(g.p); o.rotation.set(g.r[0], g.r[1], g.r[2]); o.scale.fromArray(g.s); o.visible = g.v; }
    o.traverse(x => { if (x.userData.studioMat) { x.material = x.userData.studioMat; delete x.userData.studioMat; } }); if (o.userData.studioSwap) { o.remove(o.userData.studioSwap); delete o.userData.studioSwap; o.traverse(x => { if (x.userData.studioHidden) { x.visible = true; delete x.userData.studioHidden; } }); }
    delete o.userData.studioApplied; if (E.helper) E.helper.update(); emit('change', 'scene'); ui.draw(); }
  async function loader() { if (E.loader) return E.loader; try { const m = await import(new URL('vendor/GLTFLoader.js', location.href.replace(/\/templates\/[^/]*$/, '/x')).href); E.loader = new m.GLTFLoader(); } catch (e) { E.loader = null; } return E.loader; }
  async function swapModel(o, name, rec) {      // the thing keeps its spot; its own meshes hide and the model is shown in their place, scaled to the same size
    const L = await loader(); if (!L || !o) return; const size = sizeOf(o) || 2;
    L.load((/\/templates\//.test(location.pathname) ? '../' : '') + 'models/fetched/' + name + '.glb', g => {
      if (o.userData.studioSwap) o.remove(o.userData.studioSwap);
      o.children.forEach(c => { if (c !== o.userData.studioSwap && !c.userData.studioHelper) { c.visible = false; c.userData.studioHidden = 1; } });
      const T = W.THREE, m = g.scene, b = new T.Box3().setFromObject(m), v = b.getSize(new T.Vector3()), k = size / (Math.max(v.x, v.y, v.z) || 1);
      m.scale.setScalar(k); b.setFromObject(m); m.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); o.add(m); o.userData.studioSwap = m;
      if (rec) record(o, { model: name }); if (E.helper) E.helper.update(); ui.draw();
    }, undefined, () => { if (ui.el) ui.msg = 'Could not load models/fetched/' + name + '.glb'; ui.draw(); });
  }
  async function modelList() { if (E.models) return E.models; E.models = []; try { const r = await fetch('https://api.github.com/repos/Attacked-Kraken/18-Games-Casino/git/trees/main?recursive=1'); const j = await r.json();
    E.models = (j.tree || []).map(x => x.path).filter(p => /^models\/fetched\/[^/]+\.glb$/.test(p)).map(p => p.slice(15, -4)); } catch (e) {} return E.models; }
  function editing() { return ui.open && ui.tab === 'scene' && W.ok; }
  function ownsCameraScene() { return E.freeze && editing(); }      // freeze = the game's camera stays put while he works
  function sceneTapStart(e) { if (!editing() || inPanel(e)) return; E.drag = { x: e.clientX, y: e.clientY, moved: false, p: E.sel && E.sel.position.clone(), ry: E.sel && E.sel.rotation.y, sc: E.sel && E.sel.scale.clone() }; e.stopPropagation(); e.preventDefault(); }
  function sceneTapMove(e) {
    if (!editing() || !E.drag) return; const d = E.drag, dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true; e.stopPropagation(); e.preventDefault();
    const o = E.sel; if (!o || E.tool === 'pick' || !d.moved) return;
    if (E.tool === 'move') { const T = W.THREE, r = (W.cv || e.target).getBoundingClientRect(), v = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), rc = new T.Raycaster(); rc.setFromCamera(v, W.camera);
      const wp = o.getWorldPosition(new T.Vector3()), pt = new T.Vector3(); if (rc.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -wp.y), pt)) { const lp = o.parent.worldToLocal(pt.clone()); o.position.x = lp.x; o.position.z = lp.z; } }
    else if (E.tool === 'lift') o.position.y = d.p.y - dy * 0.02 * Math.max(0.2, sizeOf(o) / 4);
    else if (E.tool === 'turn') o.rotation.y = d.ry + dx * 0.01;
    else if (E.tool === 'size') { const k = Math.max(0.05, 1 - dy * 0.005); o.scale.set(d.sc.x * k, d.sc.y * k, d.sc.z * k); }
    if (E.helper) E.helper.update();
  }
  function sceneTapEnd(e) {
    if (!editing() || !E.drag) return; const d = E.drag; E.drag = null; e.stopPropagation(); e.preventDefault();
    if (d.moved) { if (E.sel && E.tool !== 'pick') { recordTransform(E.sel); ui.draw(); } return; }
    const T = W.THREE, r = (W.cv || e.target).getBoundingClientRect(), v = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), rc = new T.Raycaster(); rc.setFromCamera(v, W.camera);
    const hits = rc.intersectObjects(W.scene.children, true).filter(h => h.object.visible && !skip(h.object) && !(h.object.isLine) && !(h.object.isPoints));
    if (!hits.length) return select(null);
    const tg = hits.slice(0, 6).map(h => pickTarget(h.object)); select(tg.find(t => sizeOf(t) < 150) || tg[0]);   // a tap on the field picks the thing, not the whole park under it
  }

  /* ---------- the owner's own camera views ---------- */
  let camPick = -1;
  try { camPick = +(localStorage.getItem(KEY + '_cam') || -1); } catch (e) {}
  function camView() { const c = D().cams || []; return camPick >= 0 && c[camPick] ? c[camPick] : null; }
  function camNext() { const n = (D().cams || []).length; camPick = n ? (camPick + 1 >= n ? -1 : camPick + 1) : -1; try { localStorage.setItem(KEY + '_cam', camPick); } catch (e) {} return camView(); }


  /* ---------- CODE + PHYSICS (owner Nov 7 2026 'I want coding control! And three.js physics control in game development'):
     Physics = every number next to a physics word in the game's REAL code (gravity, grip, mass, speed, friction, bounce...), change it, ▶ run the game with it,
     📤 send it as a real code fix (OLD/NEW) through the controller. Code = edit any part of the game's code, run it, send it; and a live three.js console
     (THREE, scene, camera, renderer, game, find('name')) - a line you like can be kept in the game for everyone. ---------- */
  const C = { lines: null, loading: false, err: '', q: '', pq: '', out: '', hit: -1, chunk: '', console: '' };
  const CKEY = 'apexStudioCode_' + GAME;
  let CE = { nums: {}, chunks: [] };          // nums: {line: {col: {old, neu}}}  chunks: [{a, b, old, text}] (lines a..b replaced)
  try { const s = localStorage.getItem(CKEY); if (s) CE = Object.assign(CE, JSON.parse(s)); } catch (e) {}
  const saveCE = () => { try { localStorage.setItem(CKEY, JSON.stringify(CE)); } catch (e) {} };
  const PHYS = /(gravity|grav|grip|mass|weight|friction|drag|damp|accel|acc|speed|spd|top|vmax|maxv|brake|steer|turn|bounce|restitution|elastic|jump|lift|spring|stiff|force|power|torque|thrust|impulse|kick|throw|launch|wind|slide|slip|traction|downforce|aero|inertia|rpm|gear|boost|velocity|vel|decel|roll)/i;
  function loadSrc() {
    if (C.lines || C.loading) return; C.loading = true;
    fetch(location.pathname + '?src=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject('HTTP ' + r.status)).then(t => {
      C.lines = t.split('\n'); C.loading = false;
      for (const i of Object.keys(CE.nums)) for (const c of Object.keys(CE.nums[i])) { const e = CE.nums[i][c]; if ((C.lines[i] || '').substr(+c, e.old.length) !== e.old) delete CE.nums[i][c]; }  // the file changed since: drop stale edits
      CE.chunks = CE.chunks.filter(k => C.lines.slice(k.a, k.b + 1).join('\n') === k.old); saveCE(); ui.draw();
    }).catch(e => { C.loading = false; C.err = String(e); ui.draw(); });
  }
  let NUMS = null;
  function physNums() {                         // every number with a physics word right before it (same line, within 40 letters)
    if (NUMS || !C.lines) return NUMS || [];
    const out = [], re = /(^|[^\w.#$])(-?\d+(?:\.\d+)?)(?![\w.])/g;
    let inJs = false;
    C.lines.forEach((ln, i) => { const wasJs = inJs; if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(ln) && !/type="importmap"/i.test(ln)) inJs = true; if (/<\/script>/i.test(ln)) inJs = false; if (!wasJs && !inJs) return;   // only the game's own JavaScript, never CSS / HTML
      if (!PHYS.test(ln) || /^\s*(\/\/|\*|<)/.test(ln) && !/<script/.test(ln)) return; let m; re.lastIndex = 0;
      while ((m = re.exec(ln))) { const col = m.index + m[1].length, before = ln.slice(Math.max(0, col - 40), col), ws = before.match(new RegExp('[\\w.]*' + PHYS.source + '\\w*', 'gi')), w = ws && [ws[ws.length - 1]];
        const cm = ln.search(/(^|[^:])\/\//); if (cm >= 0 && col > cm) continue;        // inside a // comment
        if (!w || /0x$/i.test(before) || /['"][^'"]*$/.test(before.slice(-12))) continue;
        const kk = before.match(/(\w+)\s*[:=]\s*\(?\s*$/), wd = w[0].replace(/[^\w.]+$/, '');
        out.push({ i, col, old: m[2], word: wd + (kk && kk[1] !== wd.split('.').pop() ? ' · ' + kk[1] : ''), ctx: ln.slice(Math.max(0, col - 46), col).replace(/^\s+/, ''), after: ln.slice(col + m[2].length, col + m[2].length + 18) }); if (out.length >= 1500) break; } });
    return (NUMS = out);
  }
  function lineNow(i) { const ln = C.lines[i], ed = CE.nums[i]; if (!ed) return ln; let t = ln; Object.keys(ed).map(Number).sort((a, b) => b - a).forEach(c => { const e = ed[c]; t = t.slice(0, c) + e.neu + t.slice(c + e.old.length); }); return t; }
  function sourceNow() {                        // the game's code with all of my changes in it
    const L = C.lines.map((ln, i) => CE.nums[i] ? lineNow(i) : ln);
    CE.chunks.slice().sort((x, y) => y.a - x.a).forEach(k => L.splice(k.a, k.b - k.a + 1, ...k.text.split('\n')));
    return L.join('\n');
  }
  function changeCount() { let n = CE.chunks.length; for (const i in CE.nums) n += Object.keys(CE.nums[i]).length; return n; }
  function runMine() {                          // the changed game runs over the page in a frame; the original stays underneath
    let html = sourceNow(); const base = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
    html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '"><script>window.__apxTest=1<\/script>');
    let box = document.getElementById('apxRun'); if (box) box.remove();
    box = document.createElement('div'); box.id = 'apxRun'; box.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#000';
    box.innerHTML = '<iframe style="border:0;width:100%;height:100%" allow="autoplay; fullscreen"></iframe><div style="position:fixed;left:50%;transform:translateX(-50%);bottom:max(6px,env(safe-area-inset-bottom,0px));display:flex;gap:6px;font:700 14px system-ui"><button data-x="back" style="padding:9px 12px;border-radius:10px;border:1px solid #fff6;background:#000c;color:#fff">✕ Back to the real game</button><button data-x="send" style="padding:9px 12px;border-radius:10px;border:0;background:#ffd23a;color:#111">📤 Send this as a code fix</button></div>';
    document.body.appendChild(box); box.querySelector('iframe').srcdoc = html;
    box.querySelector('[data-x=back]').onclick = () => box.remove(); box.querySelector('[data-x=send]').onclick = () => { box.remove(); sendFix(); };
  }
  function fixPack() {                          // OLD/NEW pairs, each OLD made unique in the file by adding the lines around it
    const src = C.lines.join('\n'), regions = [];
    for (const i in CE.nums) if (Object.keys(CE.nums[i]).length && !CE.chunks.some(k => +i >= k.a && +i <= k.b)) regions.push({ a: +i, b: +i, text: lineNow(+i) });
    CE.chunks.forEach(k => regions.push({ a: k.a, b: k.b, text: k.text }));
    regions.sort((x, y) => x.a - y.a); const pairs = [];
    for (const r of regions) { let a = r.a, b = r.b, pre = [], post = [];
      for (let k = 0; k < 8; k++) { const old = pre.concat(C.lines.slice(r.a, r.b + 1), post).join('\n'); if (old.trim() && src.split(old).length === 2) break;
        if (k % 2 === 0 && a > 0) pre.unshift(C.lines[--a]); else if (b < C.lines.length - 1) post.push(C.lines[++b]); }
      pairs.push('OLD:\n' + pre.concat(C.lines.slice(r.a, r.b + 1), post).join('\n') + '\nNEW:\n' + pre.concat(r.text.split('\n'), post).join('\n')); }
    return 'FIX PACK\nFILE: ' + GAME + '.html\nWHY: owner code change from the in-game Studio (' + changeCount() + ' change' + (changeCount() === 1 ? '' : 's') + ')\n' + pairs.join('\n') + '\nEND';
  }
  function sendFix() { if (!changeCount()) { ui.msg = 'No code changes yet.'; ui.draw(); return; } const fp = fixPack();
    try { navigator.clipboard.writeText(fp).catch(() => {}); } catch (e) {}
    const b64 = btoa(unescape(encodeURIComponent(fp))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); openCtl('/fix#fp=' + b64); }
  function runConsole(code) {                   // live three.js console against the running game
    const find = n => { let f = null; W.scene && W.scene.traverse(o => { if (!f && o.name && o.name.toLowerCase().includes(String(n).toLowerCase())) f = o; }); return f; };
    if (!W.scene) return '✗ The 3D world is not up yet - start playing (or press START), then run it again.';
    try { const r = new Function('THREE', 'scene', 'camera', 'renderer', 'game', 'find', 'Studio', '"use strict";\n' + (/^\s*(return|const|let|var|for|if|\{)/.test(code) || code.includes(';') || code.includes('\n') ? code : 'return (' + code + ')'))(W.THREE, W.scene, W.camera, W.renderer, window.__game || window.__test, find, window.Studio);
      let t; try { t = r && r.isObject3D ? (r.type + ' "' + (r.name || '') + '" at ' + ['x', 'y', 'z'].map(a => r.position[a].toFixed(2)).join(', ')) : JSON.stringify(r, (k, v) => typeof v === 'number' ? +v.toFixed(4) : v, 1); } catch (e) { t = String(r); }
      return '✓ ' + (t === undefined ? 'done' : String(t).slice(0, 1200)); } catch (e) { return '✗ ' + e.message; }
  }
  function runKept() { (D().code || []).forEach(c => { try { runConsole(c); } catch (e) {} }); }
  function liveNums() {                         // numbers inside the running game's own objects (window.__game): change them while you play
    const g = window.__game, out = []; if (!g || typeof g !== 'object') return out;
    const walk = (o, path, d) => { if (!o || typeof o !== 'object' || d > 2 || out.length > 60 || o.isObject3D || o.isVector3) return;
      for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'number' && isFinite(v)) out.push({ path: path + k, v }); else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, path + k + '.', d + 1); } };
    walk(g, '', 0); return out;
  }
  function setLive(path, v) { const ks = path.split('.'); let o = window.__game; for (let i = 0; i < ks.length - 1; i++) o = o && o[ks[i]]; if (o) o[ks[ks.length - 1]] = v; }

  /* ---------- the panel ---------- */
  const ui = { open: false, tab: 'scene', size: 1, el: null, btn: null, msg: '', swapOpen: false };
  const css = `#apxStudioBtn{position:fixed;left:50%;transform:translateX(-50%);top:max(6px,env(safe-area-inset-top,0px));z-index:99998;font:700 15px system-ui,sans-serif;padding:9px 12px;border-radius:12px;border:1px solid #ffd23a;background:#1a1408e6;color:#ffd23a}
#apxStudio{text-align:left;position:fixed;right:0;top:0;bottom:0;width:min(400px,92vw);z-index:99999;background:#0e1219f2;color:#eef1f5;font:14px system-ui,sans-serif;overflow:auto;padding:10px 12px 60px;box-shadow:-4px 0 18px #0008}
#apxStudio h3{margin:12px 0 4px;font-size:14px;color:#ffd23a}#apxStudio .tabs{display:flex;gap:4px;flex-wrap:wrap}#apxStudio button{font:inherit;border-radius:9px;border:1px solid #39424f;background:#1b2230;color:#eef1f5;padding:7px 10px;margin:2px}
#apxStudio button.on{background:#ffd23a;color:#111;border-color:#ffd23a}#apxStudio .row{margin:6px 0}#apxStudio .row label{display:flex;justify-content:space-between;font-size:13px}
#apxStudio input[type=range]{width:100%}#apxStudio .sub{color:#9aa3b2;font-size:12px}#apxStudio textarea{width:100%;min-height:110px;font:11px ui-monospace,Menlo,monospace;background:#05070b;color:#cfe;border:1px solid #39424f;border-radius:8px}
#apxStudio .chg{color:#ffd23a}#apxStudio .xyz{display:flex;gap:6px}#apxStudio .xyz input{width:30%;font:13px ui-monospace,Menlo,monospace;background:#05070b;color:#eef1f5;border:1px solid #39424f;border-radius:6px;padding:5px}`;
  ui.mount = function () {
    if (ui.btn || !on()) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    ui.btn = document.createElement('button'); ui.btn.id = 'apxStudioBtn'; ui.btn.textContent = '🎛️ Studio'; ui.btn.onclick = () => { ui.open = !ui.open; ui.draw(); };
    document.body.appendChild(ui.btn);
    ui.el = document.createElement('div'); ui.el.id = 'apxStudio'; ui.el.hidden = true; document.body.appendChild(ui.el);
    ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown', 'click'].forEach(ev => ui.el.addEventListener(ev, e => e.stopPropagation()));
  };
  function openCtl(pathHash) {     // opens a page of the owner's controller: the Mac mini's away link from ntfy (learned on sports.html), else the home address; the PIN rides in the #
    const w = window.open('about:blank', '_blank');
    let t = '', pin = '', home = 'http://192.168.1.231:8765'; try { t = localStorage.getItem('apexLinkTopic') || ''; pin = localStorage.getItem('apexLinkPin') || ''; home = (localStorage.getItem('apexCtlUrl') || home).replace(/\/$/, ''); } catch (e) {}
    const go = u => { const url = u + pathHash + (pin ? (pathHash.includes('#') ? '&' : '#') + 'pin=' + encodeURIComponent(pin) : ''); if (w) w.location = url; else location.href = url; };
    if (!t) go(home); else fetch('https://ntfy.sh/' + encodeURIComponent(t) + '/json?poll=1&since=24h', { cache: 'no-store' }).then(r => r.text()).then(x => { let u = '';
      x.trim().split('\n').forEach(l => { try { const m = (JSON.parse(l).message || '').match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if (m) u = m[0]; } catch (e) {} }); go(u || home); }).catch(() => go(home));
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  ui.draw = function () {
    if (!ui.el) return; ui.el.hidden = !ui.open; ui.btn.textContent = ui.open ? '✕ Close Studio' : '🎛️ Studio';
    if (!ui.open) { W.placing = false; return; } ui.el.style.width = (ui.tab === 'phys' || ui.tab === 'code') ? 'min(720px,98vw)' : '';
    const tabs = [['scene', 'Scene'], ['phys', '⚙️ Physics'], ['code', '💻 Code'], ['tune', 'Tune'], ['place', 'Place'], ['cam', 'Cameras'], ['save', 'Save']];
    let h = `<div class="tabs">${tabs.map(([k, n]) => `<button class="${ui.tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
    W.placing = ui.tab === 'place' && W.ok;
    if (ui.tab === 'scene') {
      if (!W.ok) h += '<p class="sub">This game has no 3D world hooked up yet.</p>';
      else {
        const o = E.sel, nEd = Object.keys(D().edits || {}).length;
        h += `<p class="sub"><b>Tap anything in the game</b> to pick it. Then pick a tool and <b>drag</b> on the screen. ${nEd} change${nEd === 1 ? '' : 's'} saved on this phone.</p>`;
        h += `<div>${[['pick', '👆 Pick'], ['move', '✥ Move'], ['lift', '↕ Lift'], ['turn', '↻ Turn'], ['size', '⤢ Size']].map(([k, n]) => `<button class="${E.tool === k ? 'on' : ''}" data-tool="${k}">${n}</button>`).join('')}<button class="${E.freeze ? 'on' : ''}" data-freeze="1">📷 ${E.freeze ? 'Camera frozen' : 'Freeze camera'}</button></div>`;
        if (ui.msg) { h += `<p class="sub chg">${esc(ui.msg)}</p>`; ui.msg = ''; }
        if (o) {
          const ed = editOf(o) || {}, deg = (o.rotation.y * 180 / Math.PI).toFixed(0);
          h += `<h3>${esc(label(o))}</h3><p class="sub">${esc(pathOf(o) || '')} · ${sizeOf(o).toFixed(1)} units big${o.userData.studioApplied ? ' · <span class="chg">changed</span>' : ''}</p>`;
          h += `<div class="row"><label>Position (x · up · z)</label><div class="xyz">${['x', 'y', 'z'].map(a => `<input type="number" step="0.1" data-pos="${a}" value="${o.position[a].toFixed(2)}">`).join('')}</div></div>`;
          h += `<div class="row"><label>Turn (degrees) <b>${deg}</b></label><input type="range" data-rot="1" min="-180" max="180" step="1" value="${deg}"></div>`;
          h += `<div class="row"><label>Size <b>${o.scale.x.toFixed(2)}</b></label><input type="range" data-scl="1" min="0.05" max="5" step="0.01" value="${o.scale.x.toFixed(2)}"></div>`;
          h += `<div class="row"><label>Colour <input type="color" data-col="1" value="${ed.col || '#ffffff'}"></label></div>`;
          h += `<div><button data-hide="1">${o.visible ? '🙈 Hide' : '👁 Show'}</button><button data-del="1">🗑️ Delete</button><button data-up="1">⬆ Bigger group</button><button data-reset="1">↩️ Put it back</button><button data-swap="1">📦 Swap for a model…</button></div>`;
          { const bt = bornAt(o) .length ? bornAt(o) : (o.parent ? bornAt(o.parent) : []);
            h += `<h3>💻 The code that made this</h3>` + (bt.length ? bt.map(f => `<div><button data-born="${f.mine ? f.line : ''}" ${f.mine ? '' : 'disabled'} style="text-align:left;width:100%;font:11px ui-monospace,Menlo,monospace">${esc(f.file)} line ${f.line}${f.fn ? ' · ' + esc(f.fn) : ''}${f.mine ? ' →' : ' (shared kit file)'}</button></div>`).join('') + '<p class="sub">Top line = where it was built; the lines under it = what called that. Tap one to open it in the Code tab.</p>' : '<p class="sub">No record of where this was made (it was built before Studio was on - reload the game with Studio on).</p>'); }
          if (ui.swapOpen) { const ms = E.models; h += `<div class="row">${ms === null || !ms ? '<span class="sub">reading the model list…</span>' : (ms.length ? ms.map(m => `<button data-model="${esc(m)}">${esc(m)}</button>`).join('') : '<span class="sub">no models/fetched/*.glb found</span>')}</div>`; if (!E.models) modelList().then(() => ui.draw()); }
        } else {
          const lvl = E.level || W.scene, list = lvl.children.filter(c => !skip(c)).slice(0, 80);
          h += `<h3>What is in the scene${lvl !== W.scene ? ': ' + esc(label(lvl)) : ''}</h3>${lvl !== W.scene ? '<button data-lvlup="1">⬆ back out</button>' : ''}`;
          h += '<div>' + list.map((c, i) => `<button data-lvl="${lvl.children.indexOf(c)}">${listLabel(c)}</button>`).join('') + '</div>';
          h += `<p class="sub">Tap a name to pick it (▸ = has things inside: pick it, then "⬆ Bigger group" / tap inside it in the game).</p>`;
        }
        h += `<div style="margin-top:10px"><button data-fixit="1">🔧 Fix a bug in this game (opens your controller)</button></div>`;
      }
    } else if (ui.tab === 'phys' || ui.tab === 'code') {
      const n = changeCount();
      h += `<div style="position:sticky;top:-10px;background:#0e1219;padding:6px 0;z-index:2"><b class="${n ? 'chg' : ''}">${n} code change${n === 1 ? '' : 's'}</b> <button data-run="1" ${n ? '' : 'disabled'}>▶ Run the game with them</button><button data-send="1" ${n ? '' : 'disabled'}>📤 Send as a code fix</button>${n ? '<button data-undoall="1">↩️ Undo all</button>' : ''}</div>`;
      if (ui.msg) { h += `<p class="sub chg">${esc(ui.msg)}</p>`; ui.msg = ''; }
      if (!C.lines) { h += C.err ? `<p class="sub">Could not read the game's code: ${esc(C.err)}</p>` : '<p class="sub">Reading the game\'s code…</p>'; loadSrc(); }
      else if (ui.tab === 'phys') {
        const L = liveNums();
        if (L.length) { h += `<h3>Live - changes the game right now</h3>`; L.slice(0, 40).forEach(x => { h += `<div class="row"><label><span>${esc(x.path)}</span><input type="number" step="any" data-live="${esc(x.path)}" value="${+x.v.toFixed(4)}" style="width:110px;font:13px ui-monospace,Menlo,monospace;background:#05070b;color:#eef1f5;border:1px solid #39424f;border-radius:6px;padding:4px"></label></div>`; }); }
        const all = physNums(), q = C.pq.toLowerCase(), list = all.filter(x => !q || (x.word + ' ' + x.ctx + ' ' + (x.i + 1)).toLowerCase().includes(q));
        h += `<h3>In the code (${all.length} physics numbers)</h3><input type="search" data-pq="1" placeholder="filter: grip, gravity, jump, line 1200…" value="${esc(C.pq)}" style="width:100%;padding:7px;border-radius:8px;border:1px solid #39424f;background:#05070b;color:#eef1f5">`;
        list.slice(0, 120).forEach(x => { const ed = (CE.nums[x.i] || {})[x.col], v = ed ? ed.neu : x.old;
          h += `<div class="row" style="border-bottom:1px solid #222a36;padding-bottom:4px"><div class="sub" style="font:11px ui-monospace,Menlo,monospace;word-break:break-all">line ${x.i + 1}: …${esc(x.ctx)}<b class="chg">${esc(x.old)}</b>${esc(x.after)}</div><label><span class="${ed ? 'chg' : ''}">${esc(x.word)}</span><span><button data-nstep="${x.i}:${x.col}:-1">−</button><input type="number" step="any" data-n="${x.i}:${x.col}" value="${esc(v)}" style="width:96px;font:13px ui-monospace,Menlo,monospace;background:#05070b;color:#eef1f5;border:1px solid #39424f;border-radius:6px;padding:4px"><button data-nstep="${x.i}:${x.col}:1">+</button></span></label></div>`; });
        if (list.length > 120) h += `<p class="sub">${list.length - 120} more - type in the filter to narrow it.</p>`;
        h += `<p class="sub">− / + changes the number by 10%. Then ▶ Run to drive it, 📤 Send to make it real (a Muse window puts it in the code, the robot checks it).</p>`;
      } else {
        h += `<h3>Live three.js console</h3><p class="sub">Runs inside the game now. You have <b>THREE, scene, camera, renderer, game, find('name')</b>. Try: <code>find('ball').scale.setScalar(3)</code> · <code>scene.fog = null</code> · <code>camera.fov = 90; camera.updateProjectionMatrix()</code></p>`;
        h += `<textarea data-con="1" spellcheck="false" style="min-height:70px">${esc(C.console)}</textarea><button data-conrun="1">▶ Run now</button><button data-conkeep="1">📌 Keep it in the game</button>`;
        if (C.out) h += `<pre style="white-space:pre-wrap;font:11px ui-monospace,Menlo,monospace;background:#05070b;padding:6px;border-radius:8px;max-height:160px;overflow:auto">${esc(C.out)}</pre>`;
        const kept = D().code || []; if (kept.length) { h += `<p class="sub">Kept (run every time the game loads; Save tab → Publish sends them):</p>`; kept.forEach((c, i) => { h += `<div class="sub" style="font:11px ui-monospace,Menlo,monospace">${esc(c.slice(0, 140))} <button data-condel="${i}">🗑️</button></div>`; }); }
        h += `<h3>Edit the game's code</h3><input type="search" data-cq="1" placeholder="find in the code (or a line number): frameAt, lapCrossed, jump, 2140…" value="${esc(C.q)}" style="width:100%;padding:7px;border-radius:8px;border:1px solid #39424f;background:#05070b;color:#eef1f5">`;
        if (C.hit < 0 && /^\d+$/.test(C.q.trim()) && +C.q > 0) C.hit = Math.min(C.lines.length - 1, +C.q - 1);
        if (C.hit >= 0) {
          const a = Math.max(0, C.hit - 6), b = Math.min(C.lines.length - 1, C.hit + 24), mineK = CE.chunks.find(k => k.a === a);
          h += `<p class="sub">Lines ${a + 1}-${b + 1} of ${C.lines.length}. Change anything, then "Use this change".</p><textarea data-chunk="${a}:${b}" spellcheck="false" style="min-height:300px;white-space:pre;overflow:auto">${esc(mineK ? mineK.text : C.lines.slice(a, b + 1).map((l, i) => CE.nums[a + i] ? lineNow(a + i) : l).join('\n'))}</textarea>`;
          h += `<button data-chunkuse="1">✓ Use this change</button><button data-chunkup="1">⬆ Earlier lines</button><button data-chunkdn="1">⬇ Later lines</button><button data-chunkx="1">✕ Close</button>`;
        } else if (C.q.length >= 2) {
          const q = C.q.toLowerCase(), hits = []; C.lines.forEach((l, i) => { if (hits.length < 40 && l.toLowerCase().includes(q)) hits.push(i); });
          h += hits.length ? hits.map(i => `<div><button data-hit="${i}" style="text-align:left;width:100%;font:11px ui-monospace,Menlo,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i + 1}: ${esc(C.lines[i].trim().slice(0, 90))}</button></div>`).join('') : '<p class="sub">not found</p>';
        }
        if (CE.chunks.length) { h += `<h3>My code changes</h3>`; CE.chunks.forEach((k, i) => { h += `<div class="sub">lines ${k.a + 1}-${k.b + 1} <button data-chunkdel="${i}">↩️ undo</button></div>`; }); }
      }
    } else if (ui.tab === 'tune') {
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
      h += `<p class="sub">${esc(GAME)} · ${order.length} sliders · ${(D().props || []).length} things · ${Object.keys(D().edits || {}).length} scene changes · ${(D().cams || []).length} camera views · ${js.length} letters</p>`;
    }
    ui.el.innerHTML = h;
    ui.el.querySelectorAll('[data-born]').forEach(b => b.onclick = () => { const n = +b.dataset.born; if (!n) return; ui.tab = 'code'; C.hit = n - 1; C.q = ''; ui.draw(); const ta = ui.el.querySelector('[data-chunk]'); if (ta) ta.scrollIntoView({ block: 'start' }); });
    const rn = ui.el.querySelector('[data-run]'); if (rn) rn.onclick = runMine;
    const sd = ui.el.querySelector('[data-send]'); if (sd) sd.onclick = sendFix;
    const ua = ui.el.querySelector('[data-undoall]'); if (ua) ua.onclick = () => { if (!ua.dataset.sure) { ua.dataset.sure = 1; ua.textContent = 'Tap again to undo all code changes'; return; } CE = { nums: {}, chunks: [] }; saveCE(); ui.draw(); };
    const pq = ui.el.querySelector('[data-pq]'); if (pq) pq.oninput = () => { C.pq = pq.value; const p = pq.selectionStart; ui.draw(); const n = ui.el.querySelector('[data-pq]'); if (n) { n.focus(); n.setSelectionRange(p, p); } };
    const setN = (key, v) => { const [i, col] = key.split(':').map(Number), x = (NUMS || []).find(z => z.i === i && z.col === col); if (!x) return; v = String(v).trim();
      CE.nums[i] = CE.nums[i] || {}; if (v === x.old || v === '' || isNaN(+v)) delete CE.nums[i][col]; else CE.nums[i][col] = { old: x.old, neu: v }; if (!Object.keys(CE.nums[i]).length) delete CE.nums[i]; saveCE(); };
    ui.el.querySelectorAll('[data-n]').forEach(inp => inp.onchange = () => { setN(inp.dataset.n, inp.value); ui.draw(); });
    ui.el.querySelectorAll('[data-nstep]').forEach(b => b.onclick = () => { const [i, col, dir] = b.dataset.nstep.split(':'), inp = ui.el.querySelector(`[data-n="${i}:${col}"]`), v = +inp.value || 0, dec = (inp.value.split('.')[1] || '').length;
      let nv = v === 0 ? (+dir) * 0.1 : v * (1 + 0.1 * dir); nv = +nv.toFixed(Math.max(dec, Math.abs(nv) < 10 ? 2 : 1)); setN(i + ':' + col, String(nv)); ui.draw(); });
    ui.el.querySelectorAll('[data-live]').forEach(inp => inp.onchange = () => { if (inp.value !== '' && isFinite(+inp.value)) setLive(inp.dataset.live, +inp.value); });
    const con = ui.el.querySelector('[data-con]'); if (con) con.oninput = () => { C.console = con.value; };
    const cr = ui.el.querySelector('[data-conrun]'); if (cr) cr.onclick = () => { C.out = runConsole(C.console) + (C.out ? '\n' + C.out : ''); C.out = C.out.slice(0, 3000); ui.draw(); };
    const ck = ui.el.querySelector('[data-conkeep]'); if (ck) ck.onclick = () => { const t = C.console.trim(); if (!t) return; const r = runConsole(t); if (r[0] === '✗') { C.out = 'Not kept - it has an error: ' + r; ui.draw(); return; } const m = ensure(); (m.code = m.code || []).push(t); saveLocal(); C.out = 'Kept. It runs every time the game loads on this phone; Save → Publish sends it to everyone.'; ui.draw(); };
    ui.el.querySelectorAll('[data-condel]').forEach(b => b.onclick = () => { const m = ensure(); (m.code || []).splice(+b.dataset.condel, 1); saveLocal(); ui.draw(); });
    const cq = ui.el.querySelector('[data-cq]'); if (cq) cq.oninput = () => { C.q = cq.value; C.hit = -1; const p = cq.selectionStart; ui.draw(); const n = ui.el.querySelector('[data-cq]'); if (n) { n.focus(); n.setSelectionRange(p, p); } };
    ui.el.querySelectorAll('[data-hit]').forEach(b => b.onclick = () => { C.hit = +b.dataset.hit; ui.draw(); const ta = ui.el.querySelector('[data-chunk]'); if (ta) ta.scrollIntoView({ block: 'start' }); });
    const cu = ui.el.querySelector('[data-chunkuse]'); if (cu) cu.onclick = () => { const ta = ui.el.querySelector('[data-chunk]'), [a, b] = ta.dataset.chunk.split(':').map(Number), old = C.lines.slice(a, b + 1).join('\n');
      CE.chunks = CE.chunks.filter(k => k.b < a || k.a > b); for (let i = a; i <= b; i++) delete CE.nums[i]; if (ta.value !== old) CE.chunks.push({ a, b, old, text: ta.value }); saveCE(); ui.msg = ta.value !== old ? 'Change kept. ▶ Run to try it, 📤 Send to make it real.' : 'No change in those lines.'; C.hit = -1; ui.draw(); };
    const cup = ui.el.querySelector('[data-chunkup]'); if (cup) cup.onclick = () => { C.hit = Math.max(6, C.hit - 25); ui.draw(); };
    const cdn = ui.el.querySelector('[data-chunkdn]'); if (cdn) cdn.onclick = () => { C.hit = Math.min(C.lines.length - 1, C.hit + 25); ui.draw(); };
    const cx = ui.el.querySelector('[data-chunkx]'); if (cx) cx.onclick = () => { C.hit = -1; ui.draw(); };
    ui.el.querySelectorAll('[data-chunkdel]').forEach(b => b.onclick = () => { CE.chunks.splice(+b.dataset.chunkdel, 1); saveCE(); ui.draw(); });
    ui.el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { E.tool = b.dataset.tool; ui.draw(); });
    const fz = ui.el.querySelector('[data-freeze]'); if (fz) fz.onclick = () => { E.freeze = !E.freeze; ui.draw(); };
    ui.el.querySelectorAll('[data-pos]').forEach(i => i.onchange = () => { const o = E.sel; if (!o) return; o.position[i.dataset.pos] = +i.value || 0; recordTransform(o); });
    const rt = ui.el.querySelector('[data-rot]'); if (rt) { rt.oninput = () => { const o = E.sel; if (!o) return; o.rotation.y = +rt.value * Math.PI / 180; rt.previousElementSibling.querySelector('b').textContent = rt.value; if (E.helper) E.helper.update(); }; rt.onchange = () => { if (E.sel) recordTransform(E.sel); ui.draw(); }; }
    const sl = ui.el.querySelector('[data-scl]'); if (sl) { sl.oninput = () => { const o = E.sel; if (!o) return; o.scale.setScalar(+sl.value); sl.previousElementSibling.querySelector('b').textContent = (+sl.value).toFixed(2); if (E.helper) E.helper.update(); }; sl.onchange = () => { if (E.sel) recordTransform(E.sel); ui.draw(); }; }
    const cc = ui.el.querySelector('[data-col]'); if (cc) cc.oninput = () => { const o = E.sel; if (!o) return; record(o, { col: cc.value }); delete o.userData.studioApplied; applyEdit(o, editOf(o)); };
    const hd = ui.el.querySelector('[data-hide]'); if (hd) hd.onclick = () => { const o = E.sel; if (!o) return; o.visible = !o.visible; record(o, { hide: o.visible ? 0 : 1 }); ui.draw(); };
    const dl = ui.el.querySelector('[data-del]'); if (dl) dl.onclick = () => { const o = E.sel; if (!o) return; o.visible = false; record(o, { del: 1 }); ui.msg = 'Deleted (hidden from the game). "Put it back" undoes it.'; select(null); };
    const up = ui.el.querySelector('[data-up]'); if (up) up.onclick = () => { const o = E.sel; if (o && o.parent && o.parent !== W.scene) select(o.parent); else ui.msg = 'That is already a top-level thing.', ui.draw(); };
    const rs = ui.el.querySelector('[data-reset]'); if (rs) rs.onclick = resetSel;
    const sw = ui.el.querySelector('[data-swap]'); if (sw) sw.onclick = () => { ui.swapOpen = !ui.swapOpen; ui.draw(); };
    ui.el.querySelectorAll('[data-model]').forEach(b => b.onclick = () => { if (E.sel) { ui.msg = 'Loading ' + b.dataset.model + '…'; swapModel(E.sel, b.dataset.model, true); ui.swapOpen = false; ui.draw(); } });
    ui.el.querySelectorAll('[data-lvl]').forEach(b => b.onclick = () => { const lvl = E.level || W.scene, c = lvl.children[+b.dataset.lvl]; if (c) select(c); });
    const lu = ui.el.querySelector('[data-lvlup]'); if (lu) lu.onclick = () => { E.level = (E.level && E.level.parent !== W.scene) ? E.level.parent : null; ui.draw(); };
    const fx = ui.el.querySelector('[data-fixit]'); if (fx) fx.onclick = () => openCtl('/fixit#game=' + encodeURIComponent(GAME + '.html'));
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
      msg.textContent = 'Opening your controller...'; openCtl('/fix#fp=' + b64);
    };
    const cl = ui.el.querySelector('[data-clear]'); if (cl) cl.onclick = () => { if (cl.dataset.sure) { mine = null; try { localStorage.removeItem(KEY); } catch (e) {} rebuildProps(); emit('change', '*'); ui.draw(); } else { cl.dataset.sure = 1; cl.textContent = 'Tap again to undo everything'; } };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui.mount); else ui.mount();

  window.Studio = { declare, num, color, points, world, ownsCamera, camView, camNext, addKind, kinds: KINDS,
    on: (ev, f) => { (listeners[ev] = listeners[ev] || []).push(f); }, active: on, game: GAME,
    code: { run: runMine, pack: () => C.lines ? fixPack() : '', count: changeCount, console: runConsole, load: loadSrc, nums: () => physNums() }, bornAt, data: () => D(), placing: () => W.placing, debug: () => ({ world: W.ok, scope: scopeNow(), props: W.root ? W.root.children.length : 0 }), refresh: () => { if (W.ok && W.root.parent !== W.scene) W.scene.add(W.root); rebuildProps(); applyAll(); }, select, applyAll, edits: () => D().edits || {} };
})();
