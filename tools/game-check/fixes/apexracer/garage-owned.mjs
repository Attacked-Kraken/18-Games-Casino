/* Nov 1 2026 (owner): a garage purchase stays bought. Buy a wrap / paint / rim once, switch away, switch back = no second charge,
   and the ownership is in the saved game (S.cars[id].owns -> localStorage), so it survives a reload. */
export default [{
  id: 'never-garage-buy-twice',
  parts: ['garage'],
  ask: 'After buying a wrap and a paint once, does switching away and back cost nothing, and is the purchase kept in the saved game?',
  async test(page, h) {
    const r = await h.eval(async () => {
      const E = window.__erc, wait = (ms) => new Promise((r) => setTimeout(r, ms));
      try {
        for (let i = 0; i < 40 && E.G.mode === 'loading'; i++) await wait(200);
        E.S.cash = 1000000; E.openGarage(); await wait(600);
        const tab = (t) => { const b = document.querySelector('.gt[data-t="' + t + '"]'); if (!b) throw new Error('no tab ' + t); b.click(); }
        const opt = (a, v) => [...document.querySelectorAll('#gopts .go')].find((e) => e.dataset[a] === v);
        const buyOpt = async (a, v) => { const el = opt(a, v); if (!el) throw new Error('no option ' + a + '=' + v); el.click(); await wait(120); const el2 = opt(a, v); if (el2) el2.click(); await wait(120); };
        const out = {};
        tab('wrap'); await wait(150);
        const c0 = E.S.cash; await buyOpt('wrap', 'circuit'); out.paid1 = c0 - E.S.cash;
        await buyOpt('wrap', 'none'); const c1 = E.S.cash;
        const el = opt('wrap', 'circuit'); out.label = (el.querySelector('.p') || {}).textContent;
        el.click(); await wait(150);
        out.paidBack = c1 - E.S.cash; out.wrapBack = E.S.cars[E.S.cur].wrap;
        tab('paint'); await wait(150);
        const all = [...document.querySelectorAll('[data-paint]')].map((e) => e.dataset.paint).filter((x) => x !== E.S.cars[E.S.cur].paint);
        const pa = all[0], pb = all[1], p0 = E.S.cash;
        await buyOpt('paint', pa); const p1 = E.S.cash; await buyOpt('paint', pb); const p2 = E.S.cash; await buyOpt('paint', pa); const p3 = E.S.cash;
        out.paintFirst = p0 - p1; out.paintBack = p2 - p3; out.paintNow = E.S.cars[E.S.cur].paint === pa;
        const saved = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => localStorage[k].includes('"owns"')) || '') || '{}');
        out.savedOwns = !!(saved.cars && saved.cars[saved.cur] && saved.cars[saved.cur].owns && saved.cars[saved.cur].owns.wrap && saved.cars[saved.cur].owns.wrap.circuit);
        return out;
      } catch (e) { return { err: String(e).slice(0, 120) }; }
    }).catch((e) => ({ err: String(e).slice(0, 120) }));
    if (!r || r.err) return 'garage test error: ' + (r && r.err);
    if (!(r.paid1 > 0)) return 'first purchase of the circuit wrap cost nothing (' + r.paid1 + ')';
    if (r.paidBack !== 0) return 'putting the bought wrap back on cost ' + r.paidBack + ' coins - a purchase must stay owned';
    if (r.wrapBack !== 'circuit') return 'the bought wrap did not go back on (wrap=' + r.wrapBack + ')';
    if (!/Owned/i.test(r.label || '')) return 'the bought wrap does not say Owned (label "' + r.label + '")';
    if (r.paintBack !== 0) return 'switching back to a paint already bought cost ' + r.paintBack + ' coins';
    if (!(r.paintFirst > 0)) return 'first paint purchase cost nothing';
    if (!r.paintNow) return 'the paint already bought did not go back on';
    if (!r.savedOwns) return 'the purchase is not in the saved game (S.cars[id].owns) - it would be lost on reload';
    return true;
  },
}];
