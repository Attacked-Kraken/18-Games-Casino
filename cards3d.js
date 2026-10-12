/* cd1: crisp canvas-drawn playing cards for the kit card games (Diamond Poker, Hold'em Royale, Baccarat Noir). */
const SUIT = ['♠', '♥', '♦', '♣'], SCOL = ['#141214', '#a3141f', '#a3141f', '#141214'], RK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export function cardKit(K, back = '#b0102e') {
  const { THREE } = K; const cache = {};
  const geo = new THREE.BoxGeometry(.64, .9, .012);
  const SER = "'Didot','Bodoni 72','Playfair Display',Georgia,'Times New Roman',serif";
  const paper = (g, w, h) => { g.fillStyle = '#f4efe4'; g.beginPath(); g.roundRect(0, 0, w, h, 16); g.fill();
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '90,70,40' : '255,255,255'},.035)`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    const v = g.createRadialGradient(w / 2, h / 2, w * .3, w / 2, h / 2, w * .85); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(80,60,30,.12)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,100,70,.35)'; g.lineWidth = 2; g.beginPath(); g.roundRect(1, 1, w - 2, h - 2, 16); g.stroke(); };
  const PIPS = { 0: [[.5, .2], [.5, .8]], 1: [[.5, .2], [.5, .5], [.5, .8]], 2: [[.3, .2], [.7, .2], [.3, .8], [.7, .8]], 3: [[.3, .2], [.7, .2], [.5, .5], [.3, .8], [.7, .8]], 4: [[.3, .2], [.7, .2], [.3, .5], [.7, .5], [.3, .8], [.7, .8]],
    5: [[.3, .2], [.7, .2], [.5, .35], [.3, .5], [.7, .5], [.3, .8], [.7, .8]], 6: [[.3, .2], [.7, .2], [.5, .35], [.3, .5], [.7, .5], [.5, .65], [.3, .8], [.7, .8]], 7: [[.3, .18], [.7, .18], [.3, .39], [.7, .39], [.3, .61], [.7, .61], [.3, .82], [.7, .82]],
    8: [[.3, .18], [.7, .18], [.3, .39], [.7, .39], [.5, .28], [.3, .61], [.7, .61], [.5, .72], [.3, .82], [.7, .82]] };
  const face = (c) => cache[c] || (cache[c] = K.tex(256, 360, (g, w, h) => { const s = (c / 13) | 0, r = c % 13, col = SCOL[s]; paper(g, w, h);
    const corner = () => { g.fillStyle = col; g.textAlign = 'center'; g.font = `500 ${r === 8 ? 40 : 46}px ${SER}`; g.fillText(RK[r], 30, 56); g.font = '34px Georgia'; g.fillText(SUIT[s], 30, 92); };
    corner(); g.save(); g.translate(w, h); g.rotate(Math.PI); corner(); g.restore();
    if (r >= 9 && r <= 11) { g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.strokeRect(58, 52, w - 116, h - 104); const gr = g.createLinearGradient(0, 52, 0, h - 52); gr.addColorStop(0, '#f0e2c0'); gr.addColorStop(.5, '#e7d3a6'); gr.addColorStop(1, '#f0e2c0'); g.fillStyle = gr; g.fillRect(60, 54, w - 120, h - 108);
      g.fillStyle = s % 3 ? '#a3141f' : '#1b2a52'; g.fillRect(60, h / 2 - 3, w - 120, 6); g.fillStyle = col; g.textAlign = 'center'; g.font = `400 96px ${SER}`; g.fillText(RK[r], w / 2, h / 2 - 20); g.save(); g.translate(w / 2, h / 2 + 20); g.rotate(Math.PI); g.fillText(RK[r], 0, 0); g.restore();
      g.font = '40px Georgia'; g.fillText(SUIT[s], 88, 90); g.save(); g.translate(w - 88, h - 90); g.rotate(Math.PI); g.fillText(SUIT[s], 0, 0); g.restore(); }
    else if (r === 12) { g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '130px Georgia'; g.fillText(SUIT[s], w / 2, h / 2); g.font = '500 9px Helvetica,Arial'; g.fillText('APEX SIGNALS · 18 GAMES CASINO', w / 2, h - 40); }
    else { g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '46px Georgia'; (PIPS[r] || []).forEach(([x, y]) => { const px = 50 + x * (w - 100), py = 30 + y * (h - 60); if (y > .5) { g.save(); g.translate(px, py); g.rotate(Math.PI); g.fillText(SUIT[s], 0, 0); g.restore(); } else g.fillText(SUIT[s], px, py); }); }
    for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(120,100,70,.06)'; g.beginPath(); const x = Math.random() * w; g.moveTo(x, 0); g.lineTo(x + Math.random() * 30 - 15, h); g.stroke(); } }));
  const backTex = K.tex(256, 360, (g, w, h) => { paper(g, w, h); g.fillStyle = back; g.fillRect(14, 14, w - 28, h - 28);
    g.strokeStyle = 'rgba(232,211,160,.5)'; g.lineWidth = 1; for (let i = -h; i < w + h; i += 9) { g.beginPath(); g.moveTo(i, 14); g.lineTo(i + h, h - 14); g.stroke(); g.beginPath(); g.moveTo(i + h, 14); g.lineTo(i, h - 14); g.stroke(); }
    g.strokeStyle = '#e8d3a0'; g.lineWidth = 2; g.strokeRect(22, 22, w - 44, h - 44); g.fillStyle = back; g.beginPath(); g.ellipse(w / 2, h / 2, 54, 70, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#e8d3a0'; g.font = `400 46px ${SER}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('A', w / 2, h / 2 + 2); });
  const edge = K.M.mat(0xd8d0c0, { roughness: .6 }), backM = K.M.mat(0xffffff, { map: backTex, roughness: .4 });
  /* card mesh lies flat (face up when rotation.x = -PI/2). set(c) shows a face; faceDown() shows the back */
  return { make(c) { const fm = K.M.mat(0xe2ddd2, { map: c == null ? backTex : face(c), roughness: .48, envMapIntensity: .35 });
      const m = new THREE.Mesh(geo, [edge, edge, edge, edge, fm, backM]); m.castShadow = true; m.rotation.x = -Math.PI / 2;
      m.set = (v) => { fm.map = face(v); fm.needsUpdate = true; m.userData.c = v; }; if (c != null) m.userData.c = c; return m; },
    /* tween helper: fly a card from a to b over ms with an arc and optional flip */
    fly(m, to, ms = 380, flip = false, delay = 0) { return new Promise(res => { const from = m.position.clone(), r0 = m.rotation.y; let t0 = null;
      const step = () => { if (t0 === null) t0 = performance.now() + delay; const k = Math.min(1, Math.max(0, (performance.now() - t0) / ms)), e = 1 - Math.pow(1 - k, 3);
        m.position.lerpVectors(from, to, e); m.position.y += Math.sin(e * Math.PI) * .35; if (flip) m.rotation.x = -Math.PI / 2 + Math.PI * (1 - e); m.rotation.y = r0 * (1 - e);
        if (k < 1) requestAnimationFrame(step); else res(); }; if (delay) setTimeout(() => K.SFX.card(), delay); else K.SFX.card(); requestAnimationFrame(step); }); } };
}
