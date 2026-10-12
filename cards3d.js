/* cd1: crisp canvas-drawn playing cards for the kit card games (Diamond Poker, Hold'em Royale, Baccarat Noir). */
const SUIT = ['♠', '♥', '♦', '♣'], SCOL = ['#141024', '#e0102e', '#ff2b8a', '#0a7a3c'], RK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export function cardKit(K, back = '#b0102e') {
  const { THREE } = K; const cache = {};
  const geo = new THREE.BoxGeometry(.64, .9, .012);
  const face = (c) => cache[c] || (cache[c] = K.tex(256, 360, (g, w, h) => { const s = (c / 13) | 0, r = c % 13, col = SCOL[s];
    g.fillStyle = '#fbf6ee'; g.beginPath(); g.roundRect(0, 0, w, h, 22); g.fill(); g.strokeStyle = '#d9c7a0'; g.lineWidth = 6; g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.font = '900 64px system-ui'; g.fillText(RK[r], 44, 72); g.font = '900 48px system-ui'; g.fillText(SUIT[s], 44, 122);
    g.save(); g.translate(w, h); g.rotate(Math.PI); g.font = '900 64px system-ui'; g.fillText(RK[r], 44, 72); g.font = '900 48px system-ui'; g.fillText(SUIT[s], 44, 122); g.restore();
    if (r >= 9 && r <= 11) { g.fillStyle = col; g.globalAlpha = .12; g.fillRect(70, 80, w - 140, h - 160); g.globalAlpha = 1; g.font = '900 120px Georgia,serif'; g.fillText(RK[r], w / 2, h / 2 + 30); g.font = '900 60px system-ui'; g.fillText(SUIT[s], w / 2, h / 2 + 100); }
    else { g.font = '900 150px system-ui'; g.fillText(SUIT[s], w / 2, h / 2 + 52); } }));
  const backTex = K.tex(256, 360, (g, w, h) => { g.fillStyle = back; g.beginPath(); g.roundRect(0, 0, w, h, 22); g.fill(); g.strokeStyle = '#ffd166'; g.lineWidth = 10; g.strokeRect(18, 18, w - 36, h - 36);
    g.strokeStyle = 'rgba(255,210,102,.55)'; g.lineWidth = 3; for (let i = -h; i < w + h; i += 22) { g.beginPath(); g.moveTo(i, 24); g.lineTo(i + h, h - 24); g.stroke(); g.beginPath(); g.moveTo(i + h, 24); g.lineTo(i, h - 24); g.stroke(); }
    g.fillStyle = '#ffd166'; g.font = '900 70px Georgia'; g.textAlign = 'center'; g.fillText('◆', w / 2, h / 2 + 24); });
  const edge = K.M.mat(0xf3ead8, { roughness: .5 }), backM = K.M.mat(0xffffff, { map: backTex, roughness: .4 });
  /* card mesh lies flat (face up when rotation.x = -PI/2). set(c) shows a face; faceDown() shows the back */
  return { make(c) { const fm = K.M.mat(0xd6d0c6, { map: c == null ? backTex : face(c), roughness: .55, envMapIntensity: .4 });
      const m = new THREE.Mesh(geo, [edge, edge, edge, edge, fm, backM]); m.castShadow = true; m.rotation.x = -Math.PI / 2;
      m.set = (v) => { fm.map = face(v); fm.needsUpdate = true; m.userData.c = v; }; if (c != null) m.userData.c = c; return m; },
    /* tween helper: fly a card from a to b over ms with an arc and optional flip */
    fly(m, to, ms = 380, flip = false, delay = 0) { return new Promise(res => { const from = m.position.clone(), r0 = m.rotation.y; let t0 = null;
      const step = () => { if (t0 === null) t0 = performance.now() + delay; const k = Math.min(1, Math.max(0, (performance.now() - t0) / ms)), e = 1 - Math.pow(1 - k, 3);
        m.position.lerpVectors(from, to, e); m.position.y += Math.sin(e * Math.PI) * .35; if (flip) m.rotation.x = -Math.PI / 2 + Math.PI * (1 - e); m.rotation.y = r0 * (1 - e);
        if (k < 1) requestAnimationFrame(step); else res(); }; if (delay) setTimeout(() => K.SFX.card(), delay); else K.SFX.card(); requestAnimationFrame(step); }); } };
}
