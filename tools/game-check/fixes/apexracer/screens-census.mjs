// Racer screen census (master #4, VP Oct 31 2026): every button on the home menu, the pause screen and the end-of-race screen is pressed and must DO something visible
// (a different screen shows, or its label changes). One small test per button group so each stays far inside the robot's per-test clock (the page starts on the menu, so no test rebuilds it).
const visible = () => ['menu', 'world', 'sheet', 'garage', 'hud', 'pause', 'result', 'friend', 'loading', 'credits'].filter((i) => { const e = document.getElementById(i); return e && getComputedStyle(e).display !== 'none'; }).join('+');
const click = (h, id) => h.eval((i) => { document.getElementById(i).click(); return true; }, id);
const txt = (h, id) => h.eval((i) => document.getElementById(i).textContent, id);
const mk = (id, parts, ask, run) => ({ id, parts, ask, async test(page, h) {
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  const fails = []; const vis = () => h.eval(visible);
  const expect = async (what, want, re) => { await h.wait(250); const v = await vis(); if (re ? !re.test(v) : v !== want) fails.push(what + ' shows "' + v + '" instead of "' + want + '"'); };
  const toRace = async () => { await h.eval(() => { const E = window.__erc; E.startRace(E.PLACES[0], 1); return true; }); await h.poll(() => h.eval(() => window.__erc.G.mode), (m) => m === 'race', 25000); await h.wait(300); };
  await run({ h, fails, expect, vis, toRace, click: (i) => click(h, i), txt: (i) => txt(h, i) });
  await h.shot();
  if (errs.length) fails.push('script error: ' + errs[0]);
  return fails.length ? ask.split(':')[0] + ': ' + fails.join(' | ') : true;
} });

export default [
  mk('play-screen-menu-labels', ['menu'], 'Home menu labels: Graphics and Sound change their own label every press; Credits opens and its Back returns to the menu.', async ({ h, fails, expect, click, txt }) => {
    for (const b of ['mQ', 'mSnd']) { const a = await txt(b); await click(b); await h.wait(200); const c = await txt(b); if (a === c) fails.push('menu button #' + b + ' pressed and its label stayed "' + a + '"'); }
    await click('mCredits'); await expect('menu button #mCredits', 'credits'); await click('crBack'); await expect('Credits > Back', 'menu');
  }),
  mk('play-screen-menu-race', ['menu'], 'Home menu Race: the Race button opens the country and place list.', async ({ expect, click }) => { await click('mRace'); await expect('menu button #mRace', 'world'); }),
  mk('play-screen-menu-garage', ['menu'], 'Home menu Garage: the Garage button opens the garage.', async ({ expect, click }) => { await click('mGarage'); await expect('menu button #mGarage', 'garage'); }),
  mk('play-screen-menu-friends', ['menu'], 'Home menu Race Friends: with no racer name it asks for one on the menu; with a name it opens the friends screen.', async ({ h, fails, expect, click }) => {
    if (await h.eval(() => !!document.getElementById('nm'))) {
      await click('mFriends'); await expect('Race Friends with no racer name (should ask for a name)', 'menu');
      await h.eval(() => { document.getElementById('nm').value = 'RobotTest'; document.getElementById('nmB').click(); }); await h.wait(300);
    }
    await click('mFriends'); await expect('menu button #mFriends', 'friend');
  }),
  mk('play-screen-pause-open', ['menu'], 'Pause screen: the II button opens it, Resume returns to the race, and its Sound button changes its label.', async ({ h, fails, expect, click, txt, toRace }) => {
    await toRace(); await click('bPause'); await expect('the pause button (II)', 'pause', /pause/);
    const a = await txt('pMute'); await click('pMute'); await h.wait(150); if (a === await txt('pMute')) fails.push('pause Sound button pressed and its label stayed "' + a + '"');
    await click('pRes'); await expect('Resume', 'hud', /hud/);
  }),
  mk('play-screen-pause-restart', ['menu'], 'Pause screen Restart race: starts a fresh race (race screen on, pause off).', async ({ h, expect, click, toRace }) => {
    await toRace(); await click('bPause'); await h.wait(250); await click('pRe'); await h.poll(() => h.eval(() => window.__erc.G.mode), (m) => m === 'race', 25000); await expect('Restart race', 'hud', /^hud$/);
  }),
  mk('play-screen-pause-quit', ['menu'], 'Pause screen Quit race: returns to the home menu.', async ({ h, expect, click, toRace }) => { await toRace(); await click('bPause'); await h.wait(250); await click('pQuit'); await expect('Quit race', 'menu'); }),
  mk('play-screen-result-shows', ['menu'], 'End-of-race screen: it shows a title and a results table, and its Sound button changes its label.', async ({ h, fails, expect, click, txt, toRace }) => {
    await toRace(); await h.eval(() => window.__erc.showResults()); await expect('the end-of-race screen', 'result', /result/);
    const t = await h.eval(() => ({ t: document.getElementById('rTitle').textContent, rows: document.querySelectorAll('#rTab tr').length }));
    if (!t.t || t.rows < 2) fails.push('the end-of-race screen is empty (title "' + t.t + '", ' + t.rows + ' table rows)');
    const a = await txt('rMute'); await click('rMute'); await h.wait(150); if (a === await txt('rMute')) fails.push('results Sound button pressed and its label stayed "' + a + '"');
  }),
  mk('play-screen-result-garage', ['menu'], 'End-of-race Garage button: opens the garage.', async ({ h, expect, click, toRace }) => { await toRace(); await h.eval(() => window.__erc.showResults()); await h.wait(300); await click('rGar'); await expect('results Garage button', 'garage'); }),
  mk('play-screen-result-again', ['menu'], 'End-of-race Race again button: starts a new race.', async ({ h, expect, click, toRace }) => { await toRace(); await h.eval(() => window.__erc.showResults()); await h.wait(300); await click('rAgain'); await h.poll(() => h.eval(() => window.__erc.G.mode), (m) => m === 'race', 25000); await expect('Race again', 'hud', /^hud$/); }),
  mk('play-screen-result-next', ['menu'], 'End-of-race Next place button: opens the race sheet for the next place.', async ({ h, expect, click, toRace }) => { await toRace(); await h.eval(() => window.__erc.showResults()); await h.wait(300); await click('rNext'); await expect('Next place', 'sheet'); }),
];
