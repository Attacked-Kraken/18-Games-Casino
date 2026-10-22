/* kit/controls.js - the ONE shared phone controls file (owner Oct 21 2026, STUDIO-STANDARD §9 rule 2).
   Thumbstick (appears where the thumb lands, left half), up to 4 round buttons (right), optional second stick (right
   half), keyboard, and "let go = stop": pointerup / pointercancel / lost capture / blur / pagehide / hidden tab all
   release everything. Works with or without kit/apex-kit.js. No game writes its own stick code any more - the robot
   fails a game that does (tools/game-check/check.mjs "own stick code").

   Use (a module page):   import { createControls } from './kit/controls.js';
   or a classic page:     <script src="kit/controls.js"></script>  ->  window.ApexControls.create(...)

   const input = createControls({
     buttons: [{ id: 'shoot', label: 'SHOOT', key: 'Space', onPress(){}, onRelease(){} }, ...],   // up to 4
     stick: true,            // left thumb stick (default true)
     rightStick: false,      // second stick on the right half (planes): read().rx / .ry
     radius: 52,             // stick travel in px
     deadzone: 0.08,
     rotated: () => false,   // return true while the page is turned 90° (portrait phone) so touches are remapped
     paused: () => false,    // return true while the game is paused - everything reads 0 / false
     onFirstTouch(){},       // unlock sound here
   });
   each frame:  const c = input.read();   // { x, y, rx, ry, buttons: { shoot: true }, any }
                x: -1 left .. 1 right   y: -1 up/forward .. 1 down/back (screen style)
   input.pressed('shoot') - true once per press.   input.release() - let go of everything (menus, goals, pauses).
   input.show(false) hides the pad.   input.destroy() removes it. */
(function (root) {
  'use strict';
  const VERSION = '2026.10.21';
  const D = typeof document !== 'undefined' ? document : null;
  const CSS = `
.apc{position:fixed;z-index:60;touch-action:none;-webkit-user-select:none;user-select:none}
.apc-zone{left:0;top:0;width:50%;height:100%}.apc-zone.right{left:50%}
.apc-joy{position:absolute;width:112px;height:112px;margin:-56px 0 0 -56px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.45);opacity:.55;transition:opacity .15s}
.apc-joy.on{opacity:1}.apc-knob{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(0,0,0,.4)}
.apc-pad{right:14px;bottom:14px;display:grid;grid-template-columns:repeat(2,74px);gap:10px}
.apc-pad.one{grid-template-columns:74px}.apc-pad.three{grid-template-columns:repeat(3,74px)}
.apc-btn{width:74px;height:74px;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:rgba(20,30,60,.55);color:#fff;font:700 15px/1 system-ui,sans-serif;letter-spacing:.5px;touch-action:none}
.apc-btn.down{background:rgba(255,255,255,.85);color:#102}
.apc-hide{display:none!important}`;
  function createControls(opts) {
    opts = opts || {};
    const btnDefs = (opts.buttons || []).slice(0, 4);
    const R = opts.radius || 52, dead = opts.deadzone == null ? 0.08 : opts.deadzone;
    const rotated = typeof opts.rotated === 'function' ? opts.rotated : () => false;
    const paused = typeof opts.paused === 'function' ? opts.paused : () => false;
    const st = { jx: 0, jy: 0, rx: 0, ry: 0, buttons: {}, keys: new Set() }, edges = {}, btnEls = {};
    btnDefs.forEach(b => { st.buttons[b.id] = false; });
    let first = false;
    const firstTouch = () => { if (first) return; first = true; try { opts.onFirstTouch && opts.onFirstTouch(); } catch (e) {} };
    if (D && !D.getElementById('apc-css')) { const s = D.createElement('style'); s.id = 'apc-css'; s.textContent = CSS; D.head.appendChild(s); }
    const el = (tag, cls, id) => { const e = D.createElement(tag); e.className = cls; if (id) e.id = id; return e; };
    const sticks = [];
    function makeStick(side) {
      const zone = el('div', 'apc apc-zone' + (side === 'right' ? ' right' : ''), side === 'right' ? 'apcZoneR' : 'apcZone');
      const joy = el('div', 'apc-joy'), knob = el('div', 'apc-knob'); joy.appendChild(knob); zone.appendChild(joy); D.body.appendChild(zone);
      let pid = null, ox = 0, oy = 0;
      const home = () => { joy.style.left = (side === 'right' ? zone.clientWidth - 100 : 100) + 'px'; joy.style.top = Math.max(80, zone.clientHeight - 100) + 'px'; };
      home(); addEventListener('resize', home);
      const set = (x, y) => { if (side === 'right') { st.rx = x; st.ry = y; } else { st.jx = x; st.jy = y; } knob.style.transform = 'translate(' + (x * R) + 'px,' + (y * R) + 'px)'; };
      zone.addEventListener('pointerdown', e => {
        if (pid != null || paused()) return; e.preventDefault(); firstTouch(); pid = e.pointerId; try { zone.setPointerCapture(pid); } catch (er) {}
        const r = zone.getBoundingClientRect(); ox = e.clientX; oy = e.clientY;
        const lx = rotated() ? oy - r.top : ox - r.left, ly = rotated() ? r.right - ox : oy - r.top;
        joy.style.left = lx + 'px'; joy.style.top = ly + 'px'; joy.classList.add('on');
      });
      zone.addEventListener('pointermove', e => {
        if (e.pointerId !== pid) return; e.preventDefault();
        let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; }
        if (rotated()) { const t = dx; dx = dy; dy = -t; }
        let x = dx / R, y = dy / R; if (Math.hypot(x, y) < dead) { x = 0; y = 0; }
        set(x, y);
      });
      const end = e => { if (e && e.pointerId != null && e.pointerId !== pid) return; pid = null; set(0, 0); joy.classList.remove('on'); home(); };
      zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
      sticks.push({ zone, end });
    }
    if (D && opts.stick !== false) makeStick('left');
    if (D && opts.rightStick) makeStick('right');
    const pad = D ? el('div', 'apc apc-pad' + (btnDefs.length === 1 ? ' one' : btnDefs.length === 3 ? ' three' : ''), 'apcPad') : null;
    const call = f => { try { f && f(); } catch (e) {} };
    btnDefs.forEach(b => {
      if (!D) return;
      const e = el('button', 'apc-btn', 'apcBtn-' + b.id); e.type = 'button'; e.textContent = b.label || b.id; btnEls[b.id] = e; pad.appendChild(e);
      const down = ev => { ev.preventDefault(); firstTouch(); if (paused()) return; if (!st.buttons[b.id]) edges[b.id] = true; st.buttons[b.id] = true; e.classList.add('down'); call(b.onPress); };
      const up = ev => { if (ev) ev.preventDefault(); if (!st.buttons[b.id]) return; st.buttons[b.id] = false; e.classList.remove('down'); call(b.onRelease); };
      e.addEventListener('pointerdown', down); e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up); e.addEventListener('pointerleave', up);
      e._up = up;
    });
    if (pad) D.body.appendChild(pad);
    const keyOf = (b, i) => b.key || (i === 0 ? 'Space' : i === 1 ? 'ShiftLeft' : i === 2 ? 'KeyE' : 'KeyQ');
    const MOVE = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const onKey = down => e => {
      if (e.repeat && down) return; const c = e.code;
      if (MOVE.includes(c)) { down ? st.keys.add(c) : st.keys.delete(c); e.preventDefault(); }
      btnDefs.forEach((b, i) => { if (keyOf(b, i) !== c) return; e.preventDefault(); if (paused() && down) return;
        if (down && !st.buttons[b.id]) { edges[b.id] = true; call(b.onPress); } if (!down && st.buttons[b.id]) call(b.onRelease);
        st.buttons[b.id] = down; if (btnEls[b.id]) btnEls[b.id].classList.toggle('down', down); });
    };
    // LET GO = STOP: anything that can take the finger or the page away releases everything
    const release = () => { sticks.forEach(s => s.end(null)); st.keys.clear(); for (const id in st.buttons) { if (btnEls[id] && btnEls[id]._up) btnEls[id]._up(null); st.buttons[id] = false; } };
    if (typeof addEventListener === 'function') {
      addEventListener('keydown', onKey(true)); addEventListener('keyup', onKey(false));
      addEventListener('blur', release); addEventListener('pagehide', release);
      D && D.addEventListener('visibilitychange', () => { if (D.hidden) release(); });
    }
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const input = {
      version: VERSION, shared: true,
      read() {
        const k = st.keys;
        let kx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
        let ky = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
        if (kx && ky) { kx *= Math.SQRT1_2; ky *= Math.SQRT1_2; }
        const p = paused();
        const out = { x: p ? 0 : clamp(st.jx + kx, -1, 1), y: p ? 0 : clamp(st.jy + ky, -1, 1), rx: p ? 0 : st.rx, ry: p ? 0 : st.ry, buttons: {} };
        for (const id in st.buttons) out.buttons[id] = p ? false : st.buttons[id];
        out.any = !!(out.x || out.y || out.rx || out.ry || Object.values(out.buttons).some(Boolean));
        return out;
      },
      pressed(id) { if (edges[id]) { edges[id] = false; return true; } return false; },
      release, reset: release,
      show(on) { [...sticks.map(s => s.zone), pad].forEach(e => e && e.classList.toggle('apc-hide', !on)); },
      destroy() { release(); [...sticks.map(s => s.zone), pad].forEach(e => e && e.remove()); },
      get x() { return this.read().x; }, get y() { return this.read().y; }, get buttons() { return this.read().buttons; },
    };
    try { root.__controls = { shared: true, version: VERSION, read: () => input.read(), buttons: btnDefs.map(b => b.id) }; } catch (e) {}
    return input;
  }
  root.ApexControls = { create: createControls, VERSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = { createControls };
})(typeof window !== 'undefined' ? window : globalThis);
export const createControls = (typeof window !== 'undefined' ? window : globalThis).ApexControls.create;
export default createControls;
