#!/usr/bin/env python3
"""Headless round test for every chip game: plays one round, asserts (1) the shared wallet balance changed during the
round, (2) a result was recorded/shown (window.__lastResult from Wallet.session), (3) no page errors.
Usage: python3 tools/test_rounds.py [BASE_URL] [game,game,...]   (needs playwright + chromium)"""
import asyncio, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
INIT = ("localStorage.setItem('ax_born',JSON.stringify({m:1,y:1990}));var d=new Date();"
        "localStorage.setItem('gc18_daily',JSON.stringify({d:d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),run:1}));"
        "localStorage.setItem('gc18_wheel',d.toDateString())")
ACT = {
  'gildedreels': ("__gr.spin()", 9000),
  'candyrush': ("__game.spin()", 9000),
  'rubyroulette': ("__game.place('red',null,'RED');__game.spin()", 16000),
  'diamondpoker': ("__game.go();setTimeout(()=>__game.go(),2500)", 9000),
  'baccaratnoir': ("__game.bet('banker');__game.deal()", 14000),
  'plinkodrop': ("__game.drop()", 16000),
  'rocketcrash': ("__game.launch();setTimeout(()=>{try{__game.cash()}catch(e){}},1600)", 12000),
  'luckykeno': ("__game.quick();setTimeout(__game.play,400)", 12000),
  'bigwheel': ("__game.bet(Object.keys({1:1})[0]);__game.spin()", 14000),
  'dicepalace': ("__game.bet('pass');__game.roll()", 9000),
  'holdemroyale': ("__game.sit();setInterval(()=>{const s=__game.state();if(s&&s.toAct===0)__game.call()},400)", 40000),
  'velvet21': ("document.getElementById('soloB').click();setTimeout(()=>{document.querySelector('.chipB').click();document.getElementById('dealB').click()},800);"
               "setInterval(()=>{const b=document.getElementById('standB');if(b&&!b.disabled&&b.offsetParent)b.click()},700)", 16000),
}
async def run(b, g):
  act, wait = ACT[g]
  pg = await b.new_page(viewport={'width': 390, 'height': 844}); await pg.add_init_script(INIT); errs = []
  pg.on('pageerror', lambda e: errs.append(str(e)))
  await pg.goto(BASE + g + '.html', timeout=40000); await pg.wait_for_timeout(4500)
  await pg.evaluate("window.__bals=[Chips.bal()];setInterval(()=>{const v=Chips.bal();if(__bals[__bals.length-1]!==v)__bals.push(v)},50)")
  await pg.evaluate(act)
  res = None
  for _ in range(int(wait / 500)):
    await pg.wait_for_timeout(500)
    res = await pg.evaluate("window.__lastResult||null")
    if res: break
  await pg.wait_for_timeout(800)
  bals = await pg.evaluate("__bals")
  await pg.screenshot(path=f'/workspace/casino-shots/test-{g}.png'); await pg.close()
  ok = bool(res) and len(bals) > 1 and not errs
  print(('PASS' if ok else 'FAIL'), g, 'balances', bals[:6], 'result', res, 'errors', errs[:3])
  return ok
async def main():
  games = sys.argv[2].split(',') if len(sys.argv) > 2 else list(ACT)
  async with async_playwright() as p:
    b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    oks = []
    for i in range(0, len(games), 4): oks += await asyncio.gather(*[run(b, g) for g in games[i:i + 4]])
    await b.close()
  print('ALL PASS' if all(oks) else 'SOME FAILED'); sys.exit(0 if all(oks) else 1)
asyncio.run(main())
