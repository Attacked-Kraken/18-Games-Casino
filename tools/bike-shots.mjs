// photographs each bike in tools/bike-pick.html from 3 sides (run by .github/workflows/bike-preview.yml)
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = path.join('.', decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(8899);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 600, height: 520 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
const p = await ctx.newPage();
p.on('response', r => { if (/poly\.pizza/.test(r.url())) console.log('model', r.status(), r.url()); });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8899/tools/bike-pick.html'); await p.waitForTimeout(2000);
fs.mkdirSync('previews', { recursive: true });
for (let i = 0; i < 5; i++) {
  await p.evaluate(i => document.querySelectorAll('#bar button')[i].click(), i);
  await p.waitForFunction(() => !/Loading/.test(document.getElementById('info').textContent), null, { timeout: 60000 }).catch(() => {});
  console.log(i + 1, await p.textContent('#info'));
  for (const [k, yaw] of [['side', 1.57], ['front', 0.6], ['back', 3.8]]) {
    await p.evaluate(y => { window.__setView && window.__setView(y); }, yaw); await p.waitForTimeout(700);
    await p.locator('#view').screenshot({ path: `previews/bike-${i + 1}-${k}.jpg`, type: 'jpeg', quality: 80 });
  }
}
await b.close(); srv.close();
