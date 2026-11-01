// MASTER #128 (VP-04, owner Oct 28 2026): the robot LOOKS at the real garage for EVERY option.
// Owner: "most options do nothing", "rims do not change", "if I switch off something I bought I have to buy again".
// Two tests: (1) every option on every look tab changes the car picture (canvas only, UI hidden), and
// every stat tab changes the stats; (2) going back to an option you already bought costs nothing.
const SETUP = async (args) => {
  const E = window.__erc; if (!E) return 'no __erc hook';
  E.S.cash = 90000000; E.S.cars = E.S.cars || {};
  const id = 'goblin';
  E.S.cars[id] = E.S.cars[id] || {}; E.S.cur = id; E.G.gSel = id; E.G.tab = 'cars';
  E.openGarage();
  return true;
};
const LOOK_TABS = ['paint', 'wrap', 'fin', 'rim', 'rimCol', 'cal', 'glow', 'kit', 'aero', 'tint'];
const STAT_TABS = ['eng', 'turbo', 'nos', 'tire', 'wheel'];
async function openTab(h, tab) {
  return h.eval(async (t) => { const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const b = document.querySelector('#gtabs .gt[data-t="' + t + '"]'); if (!b) return -1; b.click(); await wait(250);
    return document.querySelectorAll('#gopts .go').length; }, tab);
}
async function tapOption(h, idx, times) {
  return h.eval(async (a) => { const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let k = 0; k < a[1]; k++) { const bs = document.querySelectorAll('#gopts .go'); if (!bs[a[0]]) return 'gone'; bs[a[0]].click(); await wait(350); }
    await wait(900); return document.getElementById('gstats').innerText; }, [idx, times]);
}
// own picture + compare at 400x225 (the robot's 96x54 thumbnail is too coarse to see a rim change)
async function carShot(page, h) {
  await h.eval(() => { const g = document.getElementById('garage'); if (g) g.style.visibility = 'hidden'; });
  await h.wait(500);
  const jpg = await page.screenshot({ timeout: 60000, type: 'jpeg', quality: 80 });
  await h.eval(() => { const g = document.getElementById('garage'); if (g) g.style.visibility = ''; });
  return jpg.toString('base64');
}
async function pixDiff(h, a, b) {
  return h.eval(async (ab) => {
    const px = async (b64) => { const im = new Image(); im.src = 'data:image/jpeg;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = 400; c.height = 225; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 400, 225); return x.getImageData(0, 0, 400, 225).data; };
    const A = await px(ab[0]), B = await px(ab[1]); let n = 0;
    for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60) n++;
    return n / (A.length / 4); }, [a, b]);
}
export default [
  {
    id: 'play-garage-every-option-changes',
    ask: 'Most garage options do nothing - rims do not change, wraps break the body (owner Oct 28)',
    async test(page, h) {
      const ok = await h.eval(SETUP); if (ok !== true) return String(ok);
      await h.wait(1500);
      const dead = [];
      for (const tab of LOOK_TABS) {
        const n = await openTab(h, tab); if (n < 2) continue;
        const shots = [];
        for (let i = 0; i < n; i++) { await tapOption(h, i, 2); shots.push(await carShot(page, h)); }
        for (let i = 1; i < shots.length; i++) { const c = await pixDiff(h, shots[i - 1], shots[i]); if (c < 0.0015) dead.push(tab + ' option ' + (i + 1) + ' looks the same as option ' + i + ' (' + (c * 100).toFixed(2) + '% changed)'); }
      }
      for (const tab of STAT_TABS) {
        const n = await openTab(h, tab); if (n < 2) continue;
        const seen = new Set();
        for (let i = 0; i < n; i++) seen.add(await tapOption(h, i, 2));
        if (seen.size < 2) dead.push(tab + ': no option changes the car numbers');
      }
      return dead.length ? dead.length + ' dead garage option(s): ' + dead.slice(0, 8).join('; ') : true;
    },
  },
  {
    id: 'play-garage-no-rebuy',
    ask: 'If I switch off something I bought I have to buy it again (owner Oct 28)',
    async test(page, h) {
      const ok = await h.eval(SETUP); if (ok !== true) return String(ok);
      const bad = [];
      for (const tab of ['paint', 'wrap', 'fin', 'rim', 'rimCol', 'cal', 'glow']) {
        const n = await openTab(h, tab); if (n < 3) continue;
        const cash = () => h.eval(() => window.__erc.S.cash);
        await tapOption(h, 1, 2);            // buy option 2
        await tapOption(h, 2, 2);            // buy option 3 (option 2 now switched off)
        const c1 = await cash();
        await tapOption(h, 1, 2);            // back to option 2 - already bought, must be free
        const c2 = await cash();
        if (c2 < c1) bad.push(tab + ' charged ' + (c1 - c2) + ' to switch back to an option already bought');
      }
      return bad.length ? bad.join('; ') : true;
    },
  },
];
