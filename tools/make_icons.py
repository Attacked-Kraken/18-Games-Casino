"""Render tools/icons.html in headless Chromium and write <id>-icon.png (512px) for every game."""
import asyncio, base64, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1200, 'height': 900})
        await pg.goto((ROOT / 'tools' / 'icons.html').as_uri())
        for i in await pg.evaluate('IDS'):
            d = await pg.evaluate(f'paint("{i}")'); (ROOT / f'{i}-icon.png').write_bytes(base64.b64decode(d.split(',')[1])); print('wrote', i)
        await pg.screenshot(path='/workspace/casino-shots/icons-sheet.png', full_page=True); await b.close()
asyncio.run(main())
