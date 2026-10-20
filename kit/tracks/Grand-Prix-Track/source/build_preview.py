"""Bundles preview-src.js (+three.js) with esbuild and inlines the GLB, track data, minimap and Effects-Library into ../preview.html."""
import subprocess, base64, os, json, sys
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.dirname(HERE)
NM=os.environ.get("THREE_NODE_MODULES","/tmp/t3/node_modules")
bundle="/tmp/gp_bundle.js"
subprocess.run([os.path.join(NM,".bin","esbuild"),os.path.join(HERE,"preview-src.js"),"--bundle","--format=esm","--minify","--target=es2022","--outfile="+bundle],check=True,env=dict(os.environ,NODE_PATH=NM))
js=open(bundle).read()
glb=base64.b64encode(open(os.path.join(OUT,"grand-prix-track.glb"),"rb").read()).decode()
mm=base64.b64encode(open(os.path.join(OUT,"minimap.png"),"rb").read()).decode()
data=open(os.path.join(OUT,"track-data.json")).read()
fxp=os.path.join(OUT,"..","Effects-Library","effects.js"); fxjs=open(fxp).read() if os.path.exists(fxp) else ""
html=f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Apex Grand Prix Track - preview</title><style>
html,body{{margin:0;height:100%;overflow:hidden;background:#000;font:13px system-ui,sans-serif;color:#fff}}canvas{{display:block}}
#fx{{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}}
#ui{{position:fixed;left:0;right:0;top:0;padding:calc(6px + env(safe-area-inset-top)) 8px 6px;background:linear-gradient(#000a,#0000);display:flex;flex-wrap:wrap;gap:4px}}
button{{background:#1c2540cc;color:#fff;border:1px solid #fff3;border-radius:8px;padding:6px 9px;font:600 12px system-ui}}button.on{{background:#ffc828;color:#000}}
#modes{{display:flex;flex-wrap:wrap;gap:4px}}#hud{{position:fixed;left:8px;bottom:calc(8px + env(safe-area-inset-bottom));right:160px;text-shadow:0 1px 3px #000;font-weight:600}}
#mode{{position:fixed;right:8px;top:calc(92px + env(safe-area-inset-top));background:#0008;padding:4px 8px;border-radius:6px}}
#mm{{position:fixed;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));width:150px;height:150px;background:#0006;border-radius:10px}}
#toast{{position:fixed;left:50%;top:40%;transform:translateX(-50%);background:#000a;padding:8px 14px;border-radius:8px;opacity:0;transition:opacity .4s}}
#loading{{position:fixed;inset:0;display:grid;place-items:center;background:#0b1020;font-size:18px}}</style></head><body>
<canvas id="fx"></canvas><div id="ui"><div id="modes"></div><button id="dir">Director</button><button id="tgt">Next car</button><button id="night">Night</button><button id="snd">Sound</button><button id="start">Restart</button><button id="fin">Finish</button></div>
<div id="mode"></div><div id="hud"></div><canvas id="mm" width="300" height="300"></canvas><div id="toast"></div><div id="loading">Loading track...</div>
<img id="minimap" hidden src="data:image/png;base64,{mm}">
<script id="trackdata" type="application/json">{data}</script>
<script id="glb" type="application/octet-stream">{glb}</script>
<script>{fxjs}</script>
<script type="module">{js}</script></body></html>"""
open(os.path.join(OUT,"preview.html"),"w").write(html); print("preview.html",round(len(html)/1e6,2),"MB")
