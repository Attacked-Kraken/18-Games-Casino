/* Nov 1 2026 (owner): "an easier way to rotate the car, it doesn't spin correctly". A finger sweep ALONG the stage (the long side of the
   landscape view - on a portrait phone that is the screen's up-down) must turn the car, a sweep of 200 px by well over a quarter turn. */
export default [{
  id: 'play-garage-spin',
  parts: ['garage'],
  ask: 'In the garage, does sweeping a finger along the long side of the screen spin the car (200 px = more than a quarter turn)?',
  async test(page, h) {
    const r = await h.eval(async () => {
      const E = window.__erc, wait = (ms) => new Promise((r) => setTimeout(r, ms));
      try {
        for (let i = 0; i < 40 && E.G.mode === 'loading'; i++) await wait(200);
        E.openGarage(); await wait(500);
        const cv = document.querySelector('canvas'), portrait = window.innerHeight > window.innerWidth;
        const ev = (t, x, y) => (t === 'pointerdown' ? cv : window).dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, pointerId: 7, bubbles: true }));
        const th0 = E.gOrb.th;
        const sx = portrait ? 60 : 300, sy = portrait ? 200 : 60;
        ev('pointerdown', sx, sy);
        ev('pointermove', portrait ? sx : sx + 200, portrait ? sy + 200 : sy);
        ev('pointerup', 0, 0);
        return { moved: Math.abs(E.gOrb.th - th0), portrait };
      } catch (e) { return { err: String(e).slice(0, 120) }; }
    }).catch((e) => ({ err: String(e).slice(0, 120) }));
    if (!r || r.err) return 'garage spin test error: ' + (r && r.err);
    if (r.moved < 1.57) return 'sweeping 200 px along the screen only turned the car ' + r.moved.toFixed(2) + ' rad (' + (r.portrait ? 'portrait' : 'landscape') + ') - it must turn more than a quarter turn (1.57)';
    return true;
  },
}];
