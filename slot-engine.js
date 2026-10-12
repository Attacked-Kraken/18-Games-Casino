/* Themed 5x3 video-slot engine shared by the six themed games (math in slot-math.js; FUN CHIPS ONLY).
   3D cabinet with a live canvas reel window, 10 paylines, Grand/Major/Minor/Mini progressive meters, bonus features
   (free spins / bonus wheel / hold & spin / expanding wilds), BIG/MEGA/EPIC win coin showers, autoplay. */
import { boot } from './casino-kit.js';
import * as SM from './slot-math.js';
export async function slotGame(T) {
  const K = await boot({ id: T.id, title: T.title, accent: T.accent, bloom: .55, fog: [30, 70], rules: T.rules,
    view: (p) => p ? { pos: [0, 2.9, 14.8], look: [0, 2.9, 0], fov: 46 } : { pos: [0, 2.7, 8.2], look: [0, 2.6, 0], fov: 42 } });
  const { THREE, scene } = K;
  K.backdrop({ carpet: T.carpet, pattern: T.pattern, y: -1 }); K.setFloor(-1); K.lights({ c1: T.light1, c2: T.light2, key: 16, keyPos: [1, 6, 9], target: [0, 2.6, 0] });
  /* ---------- symbol sprites ---------- */
  const TS = 200, sprites = T.symbols.map((s, i) => paintSym(s, i));
  /* drawn dragon-head emblem (vector paths, renders on every device; no font glyphs) */
  function dragonEmblem(g, cx, cy) { g.save(); g.translate(cx, cy); g.shadowColor = '#ffb400'; g.shadowBlur = 14;
    const gr = g.createLinearGradient(0, -44, 0, 40); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(1, '#d08a10'); g.fillStyle = gr; g.strokeStyle = '#3a0800'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-46, 10); g.quadraticCurveTo(-40, -30, -8, -34); g.lineTo(-18, -52); g.lineTo(4, -38); g.lineTo(10, -56); g.lineTo(22, -34);
    g.quadraticCurveTo(46, -26, 54, -2); g.lineTo(40, 2); g.lineTo(50, 14); g.quadraticCurveTo(22, 20, 6, 12); g.lineTo(14, 30); g.lineTo(-6, 18); g.lineTo(-12, 36); g.lineTo(-22, 18); g.quadraticCurveTo(-36, 22, -46, 10); g.closePath(); g.fill(); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#c2261a'; g.beginPath(); g.ellipse(16, -16, 8, 5, -.3, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(18, -17, 2.4, 0, 7); g.fill();
    g.strokeStyle = '#7a2a04'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-18 + i * 10, -4 + i * 2, 9, .3, 2.2); g.stroke(); }
    g.fillStyle = '#ff6a2a'; g.beginPath(); g.moveTo(52, 6); g.quadraticCurveTo(72, 0, 80, 12); g.quadraticCurveTo(70, 10, 66, 20); g.quadraticCurveTo(60, 10, 52, 6); g.fill(); g.restore(); }
  function paintSym(s, i) { const c = document.createElement('canvas'); c.width = c.height = TS; const g = c.getContext('2d'), h = TS / 2;
    const bg = g.createRadialGradient(h, h * .8, 10, h, h, TS * .7); bg.addColorStop(0, s.bg ? s.bg[0] : T.tile[0]); bg.addColorStop(1, s.bg ? s.bg[1] : T.tile[1]); g.fillStyle = bg; g.fillRect(0, 0, TS, TS);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.strokeRect(2, 2, TS - 4, TS - 4); g.textAlign = 'center'; g.textBaseline = 'middle';
    const grad = (c1, c2) => { const gr = g.createLinearGradient(0, 30, 0, TS - 30); gr.addColorStop(0, c1); gr.addColorStop(1, c2); return gr; };
    const txt = (t, size, c1, c2, y = h + 6) => { g.font = `900 ${size}px "Arial Black",Georgia,"Noto Sans Symbols",serif`; g.lineWidth = 10; g.strokeStyle = '#1a0a04'; g.strokeText(t, h, y); g.fillStyle = grad(c1, c2); g.shadowColor = c1; g.shadowBlur = 16; g.fillText(t, h, y); g.shadowBlur = 0; g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.6)'; g.strokeText(t, h, y - 1); };
    const gem = (col, dark) => { g.save(); g.translate(h, h + 6); const r = 66; g.fillStyle = dark; g.beginPath(); g.moveTo(-r, -r * .2); g.lineTo(0, r); g.lineTo(r, -r * .2); g.fill(); g.fillStyle = col; g.beginPath(); g.moveTo(-r * .45, -r * .2); g.lineTo(0, r); g.lineTo(r * .45, -r * .2); g.fill();
      g.beginPath(); g.moveTo(-r, -r * .2); g.lineTo(-r * .55, -r * .7); g.lineTo(r * .55, -r * .7); g.lineTo(r, -r * .2); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(-r * .55, -r * .7); g.lineTo(-r * .2, -r * .2); g.lineTo(-r, -r * .2); g.fill(); g.restore(); };
    const coin = (col, label) => { const r = 70; const gr = g.createLinearGradient(h - r, h - r, h + r, h + r); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.4, col || '#ffd34a'); gr.addColorStop(1, '#a8650a'); g.fillStyle = '#5a3404'; g.beginPath(); g.arc(h, h + 6, r, 0, 7); g.fill(); g.fillStyle = gr; g.beginPath(); g.arc(h, h, r, 0, 7); g.fill(); g.strokeStyle = '#a8650a'; g.lineWidth = 6; g.beginPath(); g.arc(h, h, r * .75, 0, 7); g.stroke(); if (label) txt(label, label.length > 3 ? 30 : 46, '#fff', '#ffd34a', h + 2); };
    if (s.t === 'gem') gem(s.c, s.d || '#222'); else if (s.t === 'coin') coin(s.c, s.label); else if (s.t === 'cherry') { g.strokeStyle = '#2a7a1a'; g.lineWidth = 7; g.beginPath(); g.moveTo(70, 120); g.quadraticCurveTo(100, 30, 140, 40); g.moveTo(130, 128); g.quadraticCurveTo(120, 60, 140, 40); g.stroke(); for (const [x, y] of [[70, 130], [132, 136]]) { const r = g.createRadialGradient(x - 10, y - 12, 4, x, y, 34); r.addColorStop(0, '#fff'); r.addColorStop(.3, '#ff2030'); r.addColorStop(1, '#600'); g.fillStyle = r; g.beginPath(); g.arc(x, y, 32, 0, 7); g.fill(); } }
    else if (s.t === 'bar') { for (let k = 0; k < s.n; k++) { const y = h - (s.n - 1) * 26 + k * 52; g.fillStyle = '#111'; g.fillRect(28, y - 22, TS - 56, 44); g.strokeStyle = '#ffd34a'; g.lineWidth = 4; g.strokeRect(28, y - 22, TS - 56, 44); g.font = '900 34px "Arial Black",Georgia'; g.fillStyle = '#fff'; g.fillText('BAR', h, y + 2); } }
    else if (s.t === 'pyramid') { const gr = g.createLinearGradient(40, 40, 160, 170); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(1, '#a8650a'); g.fillStyle = gr; g.beginPath(); g.moveTo(h, 28); g.lineTo(178, 168); g.lineTo(22, 168); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(h, 28); g.lineTo(178, 168); g.lineTo(h, 168); g.fill(); txt(s.label || 'BONUS', 30, '#fff', '#ffd34a', 182); }
    else if (s.t === 'wild') { g.fillStyle = grad(s.c || '#ffd34a', s.d || '#a8650a'); g.beginPath(); g.roundRect(14, 46, TS - 28, TS - 92, 18); g.fill(); if (s.emblem === 'dragon') dragonEmblem(g, h, 66); else if (s.glyph) txt(s.glyph, 70, '#fff', '#fff2c0', 62); txt('WILD', 44, '#fff', s.c || '#ffd34a', s.glyph ? 140 : h); }
    else txt(s.g, s.size || (s.g.length > 2 ? 60 : s.g.length > 1 ? 80 : 108), s.c || '#fff', s.d || T.accent2);
    return c; }
  /* ---------- reel window (canvas texture on a curved panel) ---------- */
  const RW = 1000, RH = 600, rc = document.createElement('canvas'); rc.width = RW; rc.height = RH; const rg = rc.getContext('2d'); const rtex = new THREE.CanvasTexture(rc); rtex.colorSpace = THREE.SRGBColorSpace;
  const curve = new THREE.CylinderGeometry(6, 6, 2.7, 40, 1, true, -.4, .8); curve.rotateY(Math.PI); curve.translate(0, 0, 6);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.7), new THREE.MeshBasicMaterial({ map: rtex, toneMapped: false })); scr.position.set(0, 2.6, .02); scene.add(scr);
  /* cabinet */
  const body = K.rbox(5.3, 4.1, .5, .25, K.candy(T.cab)); body.position.set(0, 2.55, -.35); scene.add(body);
  const bez = K.rbox(4.8, 3.0, .2, .12, K.M.gold); bez.position.set(0, 2.6, -.12); scene.add(bez);
  const top = K.label(T.title.toUpperCase(), { size: .62, glow: 1.6, color: T.titleCol || '#ffd34a', stroke: '#1a0800' }); top.position.set(0, 4.95, 0); scene.add(top);
  const leds = []; for (let i = 0; i < 26; i++) { const a = i / 26; const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); const per = 2 * (5.3 + 4.1); let d = a * per, x, y;
    if (d < 5.3) { x = -2.65 + d; y = 4.6; } else if ((d -= 5.3) < 4.1) { x = 2.65; y = 4.6 - d; } else if ((d -= 4.1) < 5.3) { x = 2.65 - d; y = .5; } else { d -= 5.3; x = -2.65; y = .5 + d; } b.position.set(x, y, -.05); scene.add(b); leds.push(b); }
  K.onFrame((dt, t) => leds.forEach((b, i) => { const on = ((i + Math.floor(t * 8)) % 4) === 0 || state.celebrate > 0; b.material.color.set(on ? T.ledA : T.ledB).multiplyScalar(on ? 2.2 : .5); }));
  /* ---------- meters (DOM) ---------- */
  const PK = 'gc18_jp_' + T.id; let pool = { GRAND: 0, MAJOR: 0, MINOR: 0, MINI: 0 }; try { Object.assign(pool, JSON.parse(localStorage.getItem(PK) || '{}')); } catch (e) {}
  const meterEl = document.createElement('div'); meterEl.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(158px + env(safe-area-inset-top));z-index:6;display:flex;gap:4px;pointer-events:none;width:min(96vw,520px)';
  document.body.appendChild(meterEl);
  const MC = { GRAND: '#ff2a4a', MAJOR: '#c060ff', MINOR: '#3ab0ff', MINI: '#3ad070' };
  meterEl.innerHTML = ['GRAND', 'MAJOR', 'MINOR', 'MINI'].map((k) => `<div style="flex:${k === 'GRAND' ? 1.4 : 1};text-align:center;background:linear-gradient(#1a0606,#060202);border:2px solid ${MC[k]};border-radius:8px;padding:2px 2px;box-shadow:0 0 12px ${MC[k]}88"><div style="font:800 9px system-ui;letter-spacing:.14em;color:${MC[k]}">${k}</div><div id="jp${k}" style="font:900 ${k === 'GRAND' ? 16 : 13}px system-ui;color:#fff;text-shadow:0 0 8px ${MC[k]}">–</div></div>`).join('');
  const bet = () => chip.get();
  const jpVal = (k) => SM.JP[k] * bet() + (pool[k] || 0);
  const fm2 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let drift = 0; K.onFrame((dt) => { drift += dt; for (const k of ['GRAND', 'MAJOR', 'MINOR', 'MINI']) K.$('jp' + k).textContent = fm2(jpVal(k) + (k === 'GRAND' ? (drift * 3.7) % 1 : 0)); });
  /* ---------- controls ---------- */
  const chip = K.chipPicker([10, 25, 50, 100, 250, 500]);
  K.el(`<div class="ck-row"><div class="ck-pill"><small>WIN</small><b id="slW">0</b></div><div class="ck-pill" id="slFS" style="display:none"><small>FREE SPINS</small><b id="slFSn">0</b></div><button class="ck-sm" type="button" id="slAuto">AUTO</button><button class="ck-go" type="button" id="slGo">SPIN</button></div>`);
  /* ---------- game state + reel animation ---------- */
  const strips = SM.makeStrips({ kind: T.kind, weights: T.weights }), G = { strips, kind: T.kind, scale: T.scale, pay: SM.BASE_PAY, holdP: T.holdP || .085 };
  const state = { grid: strips.map((s) => [s[0], s[1], s[2]]), spinning: false, cols: [0, 0, 0, 0, 0].map(() => ({ off: 0, v: 0, stopAt: 0, target: null, held: false })), wins: [], hl: 0, celebrate: 0, auto: 0, mult: 1 };
  function drawReels(t) { rg.fillStyle = '#05030a'; rg.fillRect(0, 0, RW, RH);
    for (let c = 0; c < 5; c++) { const C = state.cols[c], x = c * 200;
      if (C.v > 0) { for (let k = -1; k < 4; k++) { const y = k * 200 + (C.off % 200); const s = strips[c][(Math.floor(C.off / 200) * -1 + k + 400 * 40) % strips[c].length]; rg.globalAlpha = .85; rg.drawImage(sprites[s], x, y, 200, 200); } rg.globalAlpha = 1; const bl = rg.createLinearGradient(0, 0, 0, RH); bl.addColorStop(0, 'rgba(0,0,0,.55)'); bl.addColorStop(.5, 'rgba(0,0,0,0)'); bl.addColorStop(1, 'rgba(0,0,0,.55)'); rg.fillStyle = bl; rg.fillRect(x, 0, 200, RH); }
      else for (let r = 0; r < 3; r++) { const bounce = C.bounce > 0 ? Math.sin(C.bounce * 12) * C.bounce * 30 : 0; rg.drawImage(sprites[state.grid[c][r]], x, r * 200 + bounce, 200, 200); }
      rg.fillStyle = 'rgba(0,0,0,.6)'; rg.fillRect(x + 197, 0, 6, RH); }
    if (state.wins.length && !state.spinning) { const w = state.wins[Math.floor(t * 1.2) % state.wins.length], L = SM.LINES[w.line];
      rg.strokeStyle = T.lineCol || '#ffd34a'; rg.lineWidth = 10; rg.shadowColor = rg.strokeStyle; rg.shadowBlur = 20; rg.beginPath(); L.forEach((r, c) => { const x = c * 200 + 100, y = r * 200 + 100; c ? rg.lineTo(x, y) : rg.moveTo(x, y); }); rg.stroke(); rg.shadowBlur = 0;
      for (let c = 0; c < w.n; c++) { rg.strokeStyle = '#fff'; rg.lineWidth = 6; rg.strokeRect(c * 200 + 8, L[c] * 200 + 8, 184, 184); } }
    rtex.needsUpdate = true; }
  K.onFrame((dt, t) => { state.cols.forEach((C) => { if (C.v > 0) { C.off += C.v * dt; if (C.stopAt && performance.now() >= C.stopAt) { C.v = 0; C.stopAt = 0; C.bounce = .3; if (window.GAudio) GAudio.sfx('reelStop'); } } else if (C.bounce > 0) C.bounce = Math.max(0, C.bounce - dt); }); if (state.celebrate > 0) state.celebrate -= dt; drawReels(t); });
  function spinTo(grid, fast) { return new Promise((res) => { state.spinning = true; state.wins = []; if (window.GAudio) GAudio.sfx('reelSpin'); const now = performance.now();
    state.cols.forEach((C, c) => { if (C.held) return; C.v = 3600; C.stopAt = now + (fast ? 350 : 700) + c * (fast ? 120 : 260); });
    const chk = setInterval(() => { if (state.cols.every((C) => C.v === 0)) { clearInterval(chk); state.grid = grid; state.spinning = false; res(); } }, 30); setTimeout(() => { state.grid = grid; }, (fast ? 350 : 700) - 40); }); }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  /* ---------- overlays: big win, wheel, hold & spin ---------- */
  const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;flex-direction:column;background:radial-gradient(rgba(0,0,0,.3),rgba(0,0,0,.8));pointer-events:auto'; document.body.appendChild(ov);
  async function bigWin(amount, b) { const x = amount / b, tier = x >= 50 ? 'EPIC WIN' : x >= 25 ? 'MEGA WIN' : 'BIG WIN';
    ov.innerHTML = `<div style="font:900 52px 'Arial Black',Georgia;letter-spacing:.04em;background:linear-gradient(#fff6c0,#ffd34a 50%,#c47a10);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 18px #ffb400) drop-shadow(0 4px 0 #3a1a00);animation:slPop .5s">${tier}</div><div id="slBW" style="font:900 44px system-ui;color:#fff;text-shadow:0 0 20px #ffb400">0</div>`;
    ov.style.display = 'flex'; state.celebrate = 4; if (window.GAudio) { GAudio.sfx('bigwin'); GAudio.say(tier.toLowerCase() + '!', 1); } const pts = new THREE.Vector3(0, 4.6, .5);
    const t0 = performance.now(), D = 2600; let skip = false; ov.onclick = () => (skip = true);
    while (!skip && performance.now() - t0 < D) { const k = (performance.now() - t0) / D; K.$('slBW').textContent = K.fmt(amount * (1 - Math.pow(1 - k, 3))); K.burst(pts, 6, { speed: 1.4 }); if (window.GAudio && Math.random() < .3) GAudio.sfx('coin'); await sleep(80); }
    K.$('slBW').textContent = K.fmt(amount); await sleep(skip ? 200 : 900); ov.style.display = 'none'; }
  const st = document.createElement('style'); st.textContent = '@keyframes slPop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}'; document.head.appendChild(st);
  async function wheelBonus(sc, b) { const W = SM.WHEEL, idx = SM.wheelSpin(), N = W.length; if (window.GAudio) { GAudio.sfx('bonus'); GAudio.say('Bonus wheel!', 1); }
    ov.innerHTML = `<div style="font:900 30px Georgia;color:#ffd34a;text-shadow:0 0 14px #ffb400;margin-bottom:10px">BONUS WHEEL</div><canvas id="slWh" width="600" height="600" style="width:min(80vw,340px);height:min(80vw,340px)"></canvas><div id="slWr" style="font:900 28px system-ui;color:#fff;margin-top:10px;min-height:34px"></div>`; ov.style.display = 'flex';
    const cv = K.$('slWh'), g = cv.getContext('2d'); const draw = (a) => { g.clearRect(0, 0, 600, 600); g.save(); g.translate(300, 300); g.rotate(a); for (let i = 0; i < N; i++) { const a0 = i / N * Math.PI * 2; g.fillStyle = W[i][0] === 'x' ? ['#7a1424', '#1d3f9a', '#0f6a46', '#9a6a18'][i % 4] : MC[W[i][0]]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 280, a0, a0 + Math.PI * 2 / N); g.fill(); g.strokeStyle = '#ffd34a'; g.lineWidth = 3; g.stroke();
      g.save(); g.rotate(a0 + Math.PI / N); g.fillStyle = '#fff'; g.font = '900 26px system-ui'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(W[i][0] === 'x' ? '×' + W[i][1] : W[i][0], 265, 0); g.restore(); } g.restore();
      g.fillStyle = '#ffd34a'; g.beginPath(); g.moveTo(300, 8); g.lineTo(282, 48); g.lineTo(318, 48); g.fill(); g.fillStyle = '#2a0e02'; g.beginPath(); g.arc(300, 300, 40, 0, 7); g.fill(); };
    const end = -Math.PI / 2 - (idx + .5) / N * Math.PI * 2 + Math.PI * 2 * 6, t0 = performance.now(), D = 4200; let lastSeg = -1;
    await new Promise((r) => { const f = () => { const k = Math.min(1, (performance.now() - t0) / D), e = 1 - Math.pow(1 - k, 3), a = end * e; draw(a); const seg = Math.floor(((-a - Math.PI / 2) / (Math.PI * 2) * N % N + N) % N); if (seg !== lastSeg) { lastSeg = seg; if (window.GAudio) GAudio.sfx('click'); } k < 1 ? requestAnimationFrame(f) : r(); }; f(); });
    const w = W[idx], v = w[0] === 'x' ? w[1] * (sc - 2) * b : jackpot(w[0]); K.$('slWr').textContent = (w[0] === 'x' ? '×' + w[1] * (sc - 2) : w[0] + ' JACKPOT') + '  +' + K.fmt(v); await sleep(1600); ov.style.display = 'none'; return v; }
  function jackpot(k) { const v = Math.round(jpVal(k)); pool[k] = 0; savePool(); if (window.GAudio) GAudio.say(k.toLowerCase() + ' jackpot!', 1); return v; }
  function savePool() { try { localStorage.setItem(PK, JSON.stringify(pool)); } catch (e) {} }
  async function holdBonus(grid, b) { if (window.GAudio) { GAudio.sfx('bonus'); GAudio.say('Hold and spin!', 1); } const cells = Array(15).fill(null); grid.forEach((col, c) => col.forEach((s, r) => { if (s === 8) cells[r * 5 + c] = SM.coinVal(); }));
    ov.innerHTML = `<div style="font:900 30px Georgia;color:#ffd34a;text-shadow:0 0 14px #ffb400">HOLD &amp; SPIN</div><div id="slHR" style="font:800 14px system-ui;color:#fff;margin:6px">RESPINS 3</div><div id="slHG" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;width:min(92vw,420px)"></div><div id="slHT" style="font:900 26px system-ui;color:#fff;margin-top:10px"></div>`; ov.style.display = 'flex';
    const lab = (v) => typeof v === 'string' ? v : K.fmt(v * b);
    const paint = () => { K.$('slHG').innerHTML = cells.map((v) => `<div style="aspect-ratio:1;border-radius:10px;display:flex;align-items:center;justify-content:center;font:900 ${typeof v === 'string' ? 12 : 15}px system-ui;${v === null ? 'background:#120a1e;border:2px solid #3a2a5a;color:#555' : `background:radial-gradient(#fff6c0,${typeof v === 'string' ? MC[v] : '#ffb400'} 60%,#7a4a08);border:2px solid #fff;color:#2a1400;box-shadow:0 0 14px ${typeof v === 'string' ? MC[v] : '#ffb400'}`}">${v === null ? '' : lab(v)}</div>`).join(''); };
    paint(); await sleep(900); let left = 3;
    while (left > 0 && cells.some((x) => x === null)) { left--; K.$('slHR').textContent = 'RESPINS ' + left; if (window.GAudio) GAudio.sfx('reelSpin'); await sleep(700); let hit = false;
      for (let i = 0; i < 15; i++) if (cells[i] === null && Math.random() < G.holdP) { cells[i] = SM.coinVal(); hit = true; } if (hit) { left = 3; K.$('slHR').textContent = 'RESPINS 3'; if (window.GAudio) GAudio.sfx('coin'); } paint(); await sleep(500); }
    let tot = 0; cells.forEach((v) => { if (v !== null) tot += typeof v === 'string' ? jackpot(v) : v * b; }); if (cells.every((x) => x !== null)) tot += jackpot('GRAND');
    K.$('slHT').textContent = 'TOTAL +' + K.fmt(tot); await sleep(1800); ov.style.display = 'none'; return Math.round(tot); }
  /* ---------- round ---------- */
  const lineWin = (grid, b, mult = 1) => { const w = SM.evalLines(grid, G.pay, G.scale); state.wins = w; return Math.round(w.reduce((a, x) => a + x.pay, 0) / 10 * b * mult); };
  async function round() { if (state.spinning || state.busy) return; const b = bet(); if (!K.take(b)) { state.auto = 0; updAuto(); return; } state.busy = true; K.$('slGo').disabled = true; K.$('slW').textContent = '0';
    for (const k of ['GRAND', 'MAJOR', 'MINOR', 'MINI']) pool[k] = (pool[k] || 0) + b * { GRAND: .006, MAJOR: .003, MINOR: .0015, MINI: .001 }[k]; savePool();
    let total = 0; let sp = state.nextGrid ? { grid: state.nextGrid } : SM.spinGrid(strips); state.nextGrid = null; await spinTo(sp.grid); total += lineWin(sp.grid, b); K.$('slW').textContent = K.fmt(total);
    const sc = SM.countSym(sp.grid, 8);
    if (T.kind === 'expand') { let held = [0, 0, 0, 0, 0], g = sp.grid, guard = 0; while (guard++ < 3) { let nw = false; for (let c = 1; c < 4; c++) if (!held[c] && g[c].includes(7)) { held[c] = 1; nw = true; } if (!nw) break;
        K.msg('EXPANDING WILD · RESPIN', 1100, true); if (window.GAudio) GAudio.sfx('bonus'); state.grid = g.map((col, c) => held[c] ? [7, 7, 7] : col); await sleep(900);
        const ns = SM.spinGrid(strips).grid; for (let c = 0; c < 5; c++) if (held[c]) ns[c] = [7, 7, 7]; state.cols.forEach((C, c) => (C.held = !!held[c])); await spinTo(ns, true); state.cols.forEach((C) => (C.held = false)); g = ns; total += lineWin(g, b); K.$('slW').textContent = K.fmt(total); await sleep(500); } }
    if (sc >= 3 && T.kind === 'free') { let n = { 3: 8, 4: 12, 5: 20 }[Math.min(5, sc)] || 20; if (window.GAudio) { GAudio.sfx('bonus'); GAudio.say(n + ' free spins!', 1); }
      ov.innerHTML = `<div style="font:900 40px Georgia;color:#ffd34a;text-shadow:0 0 18px #ffb400;animation:slPop .5s">${n} FREE SPINS</div><div style="font:700 16px system-ui;color:#fff">All wins ×2</div>`; ov.style.display = 'flex'; await sleep(1600); ov.style.display = 'none';
      K.$('slFS').style.display = ''; while (n-- > 0) { K.$('slFSn').textContent = n + 1; const g = SM.spinGrid(strips).grid; await spinTo(g, true); total += lineWin(g, b, 2); K.$('slW').textContent = K.fmt(total); if (SM.countSym(g, 8) >= 3) { n += 5; K.msg('+5 FREE SPINS', 1000, true); } await sleep(state.wins.length ? 700 : 250); }
      K.$('slFS').style.display = 'none'; }
    if (sc >= 3 && (T.kind === 'wheel' || T.kind === 'expand')) total += await wheelBonus(sc, b);
    if (T.kind === 'hold' && sc >= 6) total += await holdBonus(sp.grid, b);
    K.$('slW').textContent = K.fmt(total);
    if (total >= b * 10) await bigWin(total, b); else if (total > 0) K.burst(new THREE.Vector3(0, 4.6, .5), Math.min(30, 6 + total / b * 3));
    K.payout(b, total, new THREE.Vector3(0, 4.4, .6)); if (window.Engage) Engage.spin(b, total);
    state.busy = false; K.$('slGo').disabled = false; if (state.auto > 0) { state.auto--; updAuto(); setTimeout(round, 500); } }
  function updAuto() { K.$('slAuto').textContent = state.auto > 0 ? 'STOP ' + state.auto : 'AUTO'; }
  K.$('slGo').onclick = round; K.$('slAuto').onclick = () => { state.auto = state.auto > 0 ? 0 : 10; updAuto(); if (state.auto && !state.busy) round(); };
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); round(); } });
  window.__game = { spin: round, state, next: (g) => (state.nextGrid = g) };
  K.start(); return K;
}
