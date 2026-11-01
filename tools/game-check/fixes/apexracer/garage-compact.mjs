/* Nov 1 2026 (owner): "make tabs smaller, can't even see the car when fitting it with accessories". On a phone-sized stage the
   garage panel must leave most of the screen to the car: the panel's height is under 40% of the stage on every tab. */
export default [{
  id: 'play-garage-panel-slim',
  parts: ['garage'],
  ask: 'In the garage on a phone-sized screen, is the bottom panel slim enough (under 40% of the screen height) that the car stays in view on every tab?',
  async test(page, h) {
    const r = await h.eval(async () => {
      const E = window.__erc, wait = (ms) => new Promise((r) => setTimeout(r, ms));
      try {
        for (let i = 0; i < 40 && E.G.mode === 'loading'; i++) await wait(200);
        E.openGarage(); await wait(600);
        const stageH = Math.min(document.body.offsetHeight, document.documentElement.clientHeight) || window.innerHeight;
        const out = { stageH, worst: 0, tab: '' };
        for (const b of [...document.querySelectorAll('.gt')]) {
          b.click(); await wait(120);
          const ph = document.getElementById('gpanel').offsetHeight;
          if (ph > out.worst) { out.worst = ph; out.tab = b.dataset.t; }
        }
        return out;
      } catch (e) { return { err: String(e).slice(0, 120) }; }
    }).catch((e) => ({ err: String(e).slice(0, 120) }));
    if (!r || r.err) return 'garage panel test error: ' + (r && r.err);
    if (r.stageH > 560) return { inconclusive: 'stage is ' + r.stageH + ' px tall - not a phone-sized screen' };
    if (r.worst > r.stageH * 0.4) return 'the garage panel is ' + r.worst + ' px of a ' + r.stageH + ' px screen (' + Math.round(100 * r.worst / r.stageH) + '%) on the ' + r.tab + ' tab - the car is hidden; it must stay under 40%';
    return true;
  },
}];
