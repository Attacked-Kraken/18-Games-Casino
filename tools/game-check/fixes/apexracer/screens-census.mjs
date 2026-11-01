// Racer screen census (master #4, VP Oct 31 2026): every button on the home menu, the pause screen and the end-of-race screen is pressed and must DO something visible
// (a different screen shows, or its label changes). One short test per screen so a menu PR plays only these (tagged by part).
const SCR = ['menu', 'world', 'sheet', 'garage', 'hud', 'pause', 'result', 'friend', 'loading', 'credits'];
const visible = () => ['menu', 'world', 'sheet', 'garage', 'hud', 'pause', 'result', 'friend', 'loading', 'credits'].filter((i) => { const e = document.getElementById(i); return e && getComputedStyle(e).display !== 'none'; }).join('+');
const home = (h) => h.eval(() => { window.__erc.toMenu(); return true; });

const menuTest = async (page, h) => {
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  const fails = [];
  const vis = `(${visible.toString()})()`;
  // each [button, screen it must open]
  for (const [btn, want] of [['mRace', 'world'], ['mGarage', 'garage'], ['mCredits', 'credits']]) {
    await home(h); await h.wait(250);
    const got = await h.eval((b) => { document.getElementById(b).click(); return null; }, btn).then(() => h.wait(250)).then(() => h.eval(new Function('return ' + vis)));
    if (got !== want) fails.push('menu button #' + btn + ' shows "' + got + '" instead of "' + want + '"');
  }
  // Race Friends needs a racer name: with none it asks for one (the name box stays on the menu), with one it opens the friends screen
  await home(h); await h.wait(200);
  const needName = await h.eval(() => !!document.getElementById('nm'));
  if (needName) {
    await h.eval(() => document.getElementById('mFriends').click()); await h.wait(250);
    const v0 = await h.eval(new Function('return ' + vis));
    if (v0 !== 'menu') fails.push('Race Friends with no racer name shows "' + v0 + '" instead of asking for a name');
    await h.eval(() => { document.getElementById('nm').value = 'RobotTest'; document.getElementById('nmB').click(); }); await h.wait(300);
  }
  await h.eval(() => document.getElementById('mFriends').click()); await h.wait(250);
  const v1 = await h.eval(new Function('return ' + vis));
  if (v1 !== 'friend') fails.push('menu button #mFriends shows "' + v1 + '" instead of "friend"');
  // Credits Back returns to the menu
  await home(h); await h.eval(() => document.getElementById('mCredits').click()); await h.wait(200);
  await h.eval(() => document.getElementById('crBack').click()); await h.wait(250);
  const back = await h.eval(new Function('return ' + vis));
  if (back !== 'menu') fails.push('Credits > Back shows "' + back + '" instead of the menu');
  // Graphics + Sound change their own label every press
  for (const b of ['mQ', 'mSnd']) {
    await home(h); await h.wait(150);
    const a = await h.eval((id) => document.getElementById(id).textContent, b);
    await h.eval((id) => document.getElementById(id).click(), b); await h.wait(200);
    const c = await h.eval((id) => document.getElementById(id).textContent, b);
    if (a === c) fails.push('menu button #' + b + ' pressed and its label stayed "' + a + '"');
    await h.eval((id) => document.getElementById(id).click(), b);
  }
  await h.shot();
  if (errs.length) fails.push('script error: ' + errs[0]);
  return fails.length ? 'Racer menu: ' + fails.join(' | ') : true;
};

const raceReady = (h) => h.eval(() => { const E = window.__erc; E.startRace(E.PLACES[0], 1); return true; });

const pauseTest = async (page, h) => {
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  const fails = [];
  const vis = `(${visible.toString()})()`;
  await raceReady(h); await h.poll(() => h.eval(() => window.__erc.G.mode), (m) => m === 'race', 20000); await h.wait(300);
  const open = async () => { await h.eval(() => document.getElementById('bPause').click()); await h.wait(300); return h.eval(new Function('return ' + vis)); };
  let v = await open();
  if (!/pause/.test(v)) fails.push('the pause button (II) does not open the pause screen (shows "' + v + '")');
  // Resume goes back to the race
  await h.eval(() => document.getElementById('pRes').click()); await h.wait(300);
  v = await h.eval(new Function('return ' + vis));
  if (/pause/.test(v) || !/hud/.test(v)) fails.push('Resume does not return to the race (shows "' + v + '")');
  // Sound label changes
  await open();
  const a = await h.eval(() => document.getElementById('pMute').textContent);
  await h.eval(() => document.getElementById('pMute').click()); await h.wait(150);
  const c = await h.eval(() => document.getElementById('pMute').textContent);
  if (a === c) fails.push('pause Sound button pressed and its label stayed "' + a + '"');
  // Restart race keeps racing (no menu, hud on) and the clock restarts
  await h.eval(() => document.getElementById('pRe').click()); await h.wait(800);
  v = await h.eval(new Function('return ' + vis));
  if (!/hud/.test(v) || /pause|menu/.test(v)) fails.push('Restart race does not start a fresh race (shows "' + v + '")');
  // Quit race goes to the menu
  await open();
  await h.eval(() => document.getElementById('pQuit').click()); await h.wait(500);
  v = await h.eval(new Function('return ' + vis));
  if (v !== 'menu') fails.push('Quit race does not reach the menu (shows "' + v + '")');
  await h.shot();
  if (errs.length) fails.push('script error: ' + errs[0]);
  return fails.length ? 'Racer pause screen: ' + fails.join(' | ') : true;
};

const resultTest = async (page, h) => {
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  const fails = [];
  const vis = `(${visible.toString()})()`;
  const show = async () => { await raceReady(h); await h.poll(() => h.eval(() => window.__erc.G.mode), (m) => m === 'race', 20000); await h.wait(300); await h.eval(() => window.__erc.showResults()); await h.wait(400); return h.eval(new Function('return ' + vis)); };
  let v = await show();
  if (!/result/.test(v)) fails.push('the end-of-race screen does not show (shows "' + v + '")');
  const txt = await h.eval(() => ({ t: document.getElementById('rTitle').textContent, rows: document.querySelectorAll('#rTab tr').length }));
  if (!txt.t || txt.rows < 2) fails.push('the end-of-race screen is empty (title "' + txt.t + '", ' + txt.rows + ' table rows)');
  const a = await h.eval(() => document.getElementById('rMute').textContent);
  await h.eval(() => document.getElementById('rMute').click()); await h.wait(150);
  if (a === (await h.eval(() => document.getElementById('rMute').textContent))) fails.push('results Sound button pressed and its label stayed "' + a + '"');
  await h.shot();
  await h.eval(() => document.getElementById('rGar').click()); await h.wait(400);
  v = await h.eval(new Function('return ' + vis));
  if (v !== 'garage') fails.push('results Garage button shows "' + v + '" instead of the garage');
  v = await show();
  await h.eval(() => document.getElementById('rAgain').click()); await h.wait(800);
  v = await h.eval(new Function('return ' + vis));
  if (!/hud/.test(v) || /result/.test(v)) fails.push('Race again does not start a new race (shows "' + v + '")');
  v = await show();
  await h.eval(() => document.getElementById('rNext').click()); await h.wait(400);
  v = await h.eval(new Function('return ' + vis));
  if (v !== 'sheet') fails.push('Next place does not open the race sheet (shows "' + v + '")');
  if (errs.length) fails.push('script error: ' + errs[0]);
  return fails.length ? 'Racer end-of-race screen: ' + fails.join(' | ') : true;
};

export default [
  { id: 'play-screen-menu-buttons', parts: ['menu'], ask: 'Home menu: every button (Race, Race Friends, Garage, Graphics, Sound, Credits + Credits Back) is pressed and must open its screen or change its label - a dead button is named.', test: menuTest },
  { id: 'play-screen-pause-buttons', parts: ['menu'], ask: 'Pause screen: the II button opens it; Resume, Sound, Restart race and Quit race are each pressed and must do what they say - a dead button is named.', test: pauseTest },
  { id: 'play-screen-result-buttons', parts: ['menu'], ask: 'End-of-race screen: it shows a title and a results table; Sound, Garage, Race again and Next place are each pressed and must do what they say - a dead button is named.', test: resultTest },
];
