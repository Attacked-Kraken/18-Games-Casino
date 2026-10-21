// Owner Oct 21 2026 (Sketchfab robot upgrade b): front, side, back and top pictures of a model, saved next to it as
// <model>-front.jpg / -side.jpg / -back.jpg / -top.jpg. The owner approves the model from these on his job card
// before any game uses it.   node tools/model-shots.mjs http://127.0.0.1:8814/ models/fetched/car.glb
import fs from 'fs';
import { chromium } from 'playwright';
const [base, file] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
let ok = 0;
for (const side of ['front', 'side', 'back', 'top']) {
  try {
    await page.goto(base + 'tools/model-viewer.html?m=' + encodeURIComponent(file) + '&shot=' + side + '&look=studio&name=' + encodeURIComponent(file.split('/').pop()), { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => document.title === 'ready', null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(800);
    fs.writeFileSync(file.replace(/\.glb$/, '') + '-' + side + '.jpg', await page.screenshot({ type: 'jpeg', quality: 80 }));
    ok++;
  } catch (e) { console.log('::warning title=Model pictures::' + file + ' ' + side + ': ' + e.message.slice(0, 100)); }
}
await browser.close();
console.log(`::notice title=Model pictures::${file}: ${ok} of 4 pictures (front, side, back, top)`);
process.exit(ok ? 0 : 1);
