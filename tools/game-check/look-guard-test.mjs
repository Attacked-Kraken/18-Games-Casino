// Drill for the LOOK GUARD verdict (no browser): node tools/game-check/look-guard-test.mjs  - exits 1 if a rule is wrong.
import { lookVerdict, viewsOf } from './look-guard.mjs';
let bad = 0; const t = (n, c) => { console.log((c ? 'ok   ' : 'FAIL ') + n); if (!c) bad++; };
const g = { file: 'apexx.html' };
const menu = { name: 'menu', parts: ['menus'], status: 'changed', changedPct: 20, pics: 'p' }, play = { name: 'play', parts: [], status: 'changed', changedPct: 30 };
t('screen with parts changed by another part = RED', lookVerdict(g, [menu], 'PART: car', 'build/x').red.length === 1);
t('same, PR with no part = RED', lookVerdict(g, [menu], 'fix', 'build/x').red.length === 1);
t('screen changed by its own part = no red', lookVerdict(g, [menu], 'PART: menus', 'build/x').red.length === 0);
t('part name is case-insensitive', lookVerdict(g, [menu], 'PART: Menus', 'build/x').red.length === 0);
t('screen with no parts = yellow only', (r => r.red.length === 0 && r.yellow.length === 1)(lookVerdict(g, [play], 'PART: car', 'build/x')));
t('claude / robot branches are exempt', lookVerdict(g, [menu], 'x', 'vp-fix').red.length === 0);
t('TEST titles are exempt', lookVerdict(g, [menu], 'TEST G-1: x', 'test/x').red.length === 0);
t('inconclusive never fails', (r => r.red.length === 0 && r.yellow.length === 1)(lookVerdict(g, [{ name: 'menu', parts: ['menus'], status: 'inconclusive', why: 'noisy' }], 'PART: car', 'build/x')));
t('unchanged screen says nothing', (r => !r.red.length && !r.yellow.length)(lookVerdict(g, [{ name: 'menu', parts: ['menus'], status: 'same' }], 'PART: car', 'build/x')));
t('default views = menu + play', viewsOf({ file: 'a.html', start: ['#go'] }).map(v => v.name).join() === 'menu,play');
t('own views list wins', viewsOf({ file: 'a.html', views: [{ name: 'x' }] }).length === 1);
console.log(bad ? `\n${bad} FAILED` : '\nall ok'); process.exit(bad ? 1 : 0);
