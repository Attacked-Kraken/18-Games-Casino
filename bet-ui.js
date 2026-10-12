/* Shared "visible bets on the layout" helpers: chip stacks rendered ON a DOM bet spot, win banner, results strip. */
const css = `.bu-spot{position:relative}.bu-stack{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:3;transition:transform .55s ease,opacity .55s ease}
.bu-chip{width:26px;height:26px;border-radius:50%;border:3px dashed #fff;box-shadow:0 2px 0 #000,0 0 0 2px rgba(0,0,0,.6),0 3px 6px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font:800 9px system-ui;color:#fff;text-shadow:0 1px 1px #000}
.bu-stack .bu-chip+.bu-chip{margin-top:-23px}.bu-stack.lose{transform:translate(-50%,-260%) scale(.4);opacity:0}.bu-stack.win .bu-chip{box-shadow:0 0 0 2px #ffd76a,0 0 14px #ffd76a}
.bu-win{animation:buPulse .5s ease-in-out 4 alternate;box-shadow:inset 0 0 0 3px #ffd76a,0 0 18px #ffd76a!important;z-index:2}@keyframes buPulse{to{filter:brightness(1.6)}}
#buBan{position:fixed;left:50%;top:30%;transform:translate(-50%,-50%) scale(.6);opacity:0;z-index:60;pointer-events:none;font:900 34px Georgia;letter-spacing:.04em;padding:14px 26px;border-radius:14px;border:2px solid #ffd76a;background:linear-gradient(#5a0b1a,#2a0510);color:#ffe9a8;text-shadow:0 0 14px #ffb400;transition:.35s;white-space:nowrap}
#buBan.on{opacity:1;transform:translate(-50%,-50%) scale(1)}#buBan.lose{border-color:#777;color:#ddd;text-shadow:none;background:#1a1418;font-size:24px}
.bu-total{font:800 13px system-ui;color:#ffe9a8}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const COLS = { 1: '#6b6b6b', 5: '#8e1b2c', 10: '#1d3f7a', 25: '#0f5a3e', 50: '#c06a10', 100: '#141414', 500: '#4a1f5e', 1000: '#9a6a18', 5000: '#7a1424' };
export const chipColor = (v) => { let c = '#1d3f7a'; for (const k of Object.keys(COLS).map(Number).sort((a, b) => a - b)) if (v >= k) c = COLS[k]; return c; };
const short = (v) => v >= 1e6 ? (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + 'M' : v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'K' : String(v);
/* render a stack showing `amount` on element `el` (null/0 removes) */
export function stackOn(el, amount) { let s = el.querySelector(':scope>.bu-stack'); if (!amount) { if (s) s.remove(); return; }
  if (!s) { s = document.createElement('div'); s.className = 'bu-stack'; el.appendChild(s); el.classList.add('bu-spot'); } s.className = 'bu-stack';
  const n = Math.min(4, 1 + Math.floor(Math.log10(Math.max(1, amount / 10))));
  s.innerHTML = Array.from({ length: n }, (_, i) => `<div class="bu-chip" style="background:${chipColor(amount)}">${i === n - 1 ? short(amount) : ''}</div>`).join(''); }
/* settle: winners glow, losers swept away; then cleared */
export function settle(entries, ms = 2200) { /* entries: [{el, win:bool}] */
  entries.forEach(({ el, win }) => { const s = el.querySelector(':scope>.bu-stack'); if (s) s.classList.add(win ? 'win' : 'lose'); });
  setTimeout(() => entries.forEach(({ el }) => { const s = el.querySelector(':scope>.bu-stack'); if (s && (s.classList.contains('win') || s.classList.contains('lose'))) s.remove(); }), ms); }
export function glow(els, ms = 2600) { els.forEach(e => e.classList.add('bu-win')); setTimeout(() => els.forEach(e => e.classList.remove('bu-win')), ms); }
export function banner(staked, ret) { let b = document.getElementById('buBan'); if (!b) { b = document.createElement('div'); b.id = 'buBan'; document.body.appendChild(b); }
  const net = ret - staked; b.className = net > 0 ? '' : 'lose'; b.textContent = net > 0 ? 'YOU WON +' + net.toLocaleString('en-US') : ret === staked && staked ? 'PUSH · BET RETURNED' : 'NO WIN · −' + (staked - ret).toLocaleString('en-US');
  requestAnimationFrame(() => b.classList.add('on')); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), 2200); }
