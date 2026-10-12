/* Forum wing shops: gift shop & cosmetics (spend fun chips on avatar flair), cafe hourly bonus, sportsbook fun picks. Fun chips only. */
const INV = 'gc18_inv', CAFE = 'gc18_cafe';
const inv = () => { try { return JSON.parse(localStorage.getItem(INV) || '[]'); } catch (e) { return []; } };
const CATALOG = {
  gift: { title: 'Palatino Gift Shop', items: [['Gold-rim sunglasses', 500, '🕶️'], ['Velvet dinner jacket', 1500, '🧥'], ['Lucky rabbit charm', 250, '🍀'], ['Diamond pinky ring', 5000, '💍'], ['Mystery chip box (50–600 chips)', 200, '🎁']] },
  cosm: { title: 'Lumière Nova Cosmetics', items: [['Rose-gold avatar glow', 800, '✨'], ['Midnight perfume aura', 1200, '🌙'], ['Ruby lipstick badge', 400, '💄'], ['Platinum hair', 2000, '💇']] } };
const TEAMS = [['Harbor Hawks', 1.85, 'Desert Comets', 2.05], ['Iron Valley', 1.6, 'Bay City Kings', 2.4], ['North Star FC', 2.2, 'Granite United', 1.7]];
function sheet(html) { let s = document.getElementById('shopS'); if (!s) { s = document.createElement('div'); s.id = 'shopS'; document.body.appendChild(s);
    const st = document.createElement('style'); st.textContent = `#shopS{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center}#shopS.on{display:flex}#shopS .b{width:min(92vw,420px);max-height:84vh;overflow:auto;background:linear-gradient(#221612,#120a08);border:1px solid #b08d57;border-radius:10px;padding:18px;color:#efe2c6;font:14px system-ui}
#shopS h2{font:500 24px Georgia;color:#e8d3a0;margin:0 0 4px}#shopS small{color:#a8916a}#shopS .it{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(176,141,87,.25)}#shopS .it span{font-size:26px}#shopS .it div{flex:1}#shopS button{background:linear-gradient(#e2c587,#b08d57);border:0;border-radius:6px;padding:8px 12px;font:700 12px system-ui;color:#1a1208;cursor:pointer}#shopS button[disabled]{opacity:.45}#shopS .x{margin-top:12px;width:100%;background:#2a1d18;color:#e8d3a0;border:1px solid #b08d57}`; document.head.appendChild(st);
    s.addEventListener('click', (e) => { if (e.target === s || e.target.classList.contains('x')) s.classList.remove('on'); }); }
  s.innerHTML = `<div class="b">${html}<button class="x" type="button">Close</button><p style="margin:8px 0 0;text-align:center"><small>Demo fun chips only · no real money · nothing can be bought with money or cashed out</small></p></div>`; s.classList.add('on'); return s; }
const fmt = (n) => Math.round(n).toLocaleString('en-US');
export function openShop(kind) { const C = window.Chips;
  if (kind === 'gift' || kind === 'cosm') { const cat = CATALOG[kind], own = inv();
    const s = sheet(`<h2>${cat.title}</h2><small>Balance ${fmt(C ? C.bal() : 0)} chips</small>` + cat.items.map(([n, p, e], i) => `<div class="it"><span>${e}</span><div>${n}<br><small>${fmt(p)} chips</small></div><button type="button" data-i="${i}" ${own.includes(n) && !n.startsWith('Mystery') ? 'disabled' : ''}>${own.includes(n) && !n.startsWith('Mystery') ? 'Owned' : 'Buy'}</button></div>`).join(''));
    s.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const [n, p] = cat.items[+b.dataset.i]; if (!C || !C.take(p)) { b.textContent = 'Not enough'; return; }
      if (n.startsWith('Mystery')) { const w = 50 + Math.floor(Math.random() * 551); C.give(w); b.textContent = '+' + w + '!'; setTimeout(() => openShop(kind), 1200); return; }
      const o = inv(); o.push(n); localStorage.setItem(INV, JSON.stringify(o)); openShop(kind); }); return; }
  if (kind === 'cafe') { const last = +localStorage.getItem(CAFE) || 0, ready = Date.now() - last > 3600e3, mins = Math.ceil((3600e3 - (Date.now() - last)) / 60e3);
    const s = sheet(`<h2>Café Forum</h2><small>Espresso bar under the painted sky</small><div class="it"><span>☕</span><div>Free espresso + 100 fun chips<br><small>${ready ? 'Ready now' : 'Next one in ' + mins + ' min'}</small></div><button type="button" id="cafeGo" ${ready ? '' : 'disabled'}>Collect</button></div>`);
    const b = s.querySelector('#cafeGo'); if (b) b.onclick = () => { localStorage.setItem(CAFE, String(Date.now())); C && C.give(100); b.textContent = '+100'; b.disabled = true; }; return; }
  if (kind === 'sports') { const s = sheet(`<h2>Sportsbook</h2><small>Fun picks · 100 chips · settles instantly · fictional teams</small>` + TEAMS.map(([a, oa, b, ob], i) => `<div class="it"><div>${a} vs ${b}</div><button type="button" data-p="${i},0">${a.split(' ')[0]} ${oa}</button><button type="button" data-p="${i},1">${b.split(' ')[0]} ${ob}</button></div>`).join('') + `<p id="sbRes" style="text-align:center;font:700 16px Georgia;color:#ffd34a;min-height:20px"></p>`);
    s.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { const [i, k] = b.dataset.p.split(',').map(Number), o = TEAMS[i][k ? 3 : 1]; if (!C || !C.take(100)) { s.querySelector('#sbRes').textContent = 'Not enough chips'; return; }
      const win = Math.random() < .95 / o; if (win) C.give(Math.round(100 * o)); s.querySelector('#sbRes').textContent = win ? `${TEAMS[i][k ? 2 : 0]} won! +${fmt(100 * o - 100)}` : `${TEAMS[i][k ? 0 : 2]} won · −100`; }); }
}
