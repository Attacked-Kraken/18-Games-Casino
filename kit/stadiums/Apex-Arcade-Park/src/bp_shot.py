import asyncio,base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':720}); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append('c:'+m.text) if m.type=='error' else None)
        await pg.goto('file:///workspace/ballpark-stadium/index.html'); await pg.wait_for_timeout(6000)
        print('errs',errs[:5]); print('fans',await pg.evaluate('__bp.fans'))
        for i,k in enumerate(['home','upper','bleach','aerial','field']):
            await pg.evaluate(f"__bp.setCam('{k}',true)"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f'/workspace/ballpark-stadium/screenshots/{i+1:02d}-{k}.png')
        s=await pg.evaluate("__bp.exportGLB().then(ab=>{let u=new Uint8Array(ab),s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);})")
        open('/workspace/ballpark-stadium/stadium.glb','wb').write(base64.b64decode(s)); print('errs2',errs[:5])
        await b.close()
asyncio.run(main())
