// PHONE LAYOUT robot (owner Oct 20 9:52 PM, from Grok's outside audit: "make the game check FAIL on layout, stick reset
// and missing files"). Missing files already FAIL in check.mjs. This adds, for the RUNNING game on a sideways phone:
//   - buttons / the stick on top of each other (more than 6 px both ways, and you can actually see both)
//   - buttons or the stick cut off by the screen edge
//   - a touch stick that can stick: the game (or a local script it loads) must handle pointercancel/touchcancel AND
//     blur/visibilitychange, or a phone call / notification leaves the car steering forever
// Each problem is one FAIL line. Old problems main already has never block a pull request (STRICT compares to main),
// so this only stops NEW layout breakage - and the builders get the old ones as fix steps.
import fs from 'fs';
import path from 'path';

const PROBE = () => {
  const vw = innerWidth, vh = innerHeight;
  const seen = el => {
    const r = el.getBoundingClientRect();
    if (r.width <= 4 || r.height <= 4) return false;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.05) return false;
    }
    // something else (a modal, the menu panel) covering its middle = not on screen for the player right now
    const cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(vh - 1, Math.max(0, r.top + r.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    return !hit || el.contains(hit) || hit.contains(el) || hit === el;
  };
  const els = [...document.querySelectorAll('button,[role=button],.btn,[class*=btn],[id*=stick],[class*=stick],[id*=joy],[class*=joy]')]
    .filter(seen);
  const name = e => ((e.id ? '#' + e.id : '') || (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 18) || (String(e.className).split(' ')[0] || e.tagName)).slice(0, 24);
  const R = els.map(e => ({ e, n: name(e), r: e.getBoundingClientRect() }));
  const off = R.filter(o => o.r.right > vw + 2 || o.r.bottom > vh + 2 || o.r.left < -2 || o.r.top < -2)
    .map(o => `${o.n} (${Math.round(Math.max(o.r.right - vw, o.r.bottom - vh, -o.r.left, -o.r.top))}px out)`);
  const over = [];
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const a = R[i], b = R[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (w > 6 && h > 6) over.push(`${a.n} + ${b.n}`);
  }
  return { off: [...new Set(off)].slice(0, 4), over: [...new Set(over)].slice(0, 4), n: R.length,
           stick: R.some(o => /stick|joy/i.test(String(o.e.id) + ' ' + String(o.e.className))) };
};

// the game's own code plus the local scripts it loads (one level: <script src>, import '...')
function gameSource(file) {
  let src = '';
  try { src = fs.readFileSync(path.join(process.cwd(), file), 'utf8'); } catch (e) { return ''; }
  let all = src;
  const refs = new Set();
  for (const m of src.matchAll(/(?:src=|import\s*(?:[^'"]*from\s*)?|import\()\s*["']([^"':]+\.m?js)["']/g)) refs.add(m[1]);
  for (const r of [...refs].slice(0, 30)) {
    try { all += '\n' + fs.readFileSync(path.join(process.cwd(), path.dirname(file), r.replace(/^\.?\//, '')), 'utf8'); } catch (e) {}
  }
  return all;
}

export async function mobileCheck(page, file) {
  const out = { fail: [], check: [], data: null };
  let p = null;
  try { p = await page.evaluate(PROBE); } catch (e) { out.check.push('Phone layout check could not run: ' + String(e.message).slice(0, 80)); return out; }
  out.data = p;
  if (p.over.length) out.fail.push(`LAYOUT: buttons on top of each other on a sideways phone - ${p.over.join(', ')} - move or shrink them so every button can be pressed`);
  if (p.off.length) out.fail.push(`LAYOUT: buttons cut off by the screen edge on a sideways phone (844x390) - ${p.off.join(', ')} - every control must sit fully on screen`);
  const src = gameSource(file);
  const touches = /touchstart|pointerdown/i.test(src);
  if (touches && src) {
    const cancel = /pointercancel|touchcancel/i.test(src), blur = /["']blur["']|visibilitychange/i.test(src);
    if (!cancel || !blur) out.fail.push(`STICK: the touch controls can get stuck - add ${!cancel ? 'pointercancel/touchcancel' : ''}${!cancel && !blur ? ' and ' : ''}${!blur ? 'window blur + visibilitychange' : ''} handlers that set the stick and every held button back to 0 (a call or notification on the phone must never leave the player moving or steering by itself)`);
  }
  return out;
}
