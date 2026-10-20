import re
d='/tmp/t128/package/'
three=open(d+'build/three.min.js').read()
for f in ['examples/js/environments/RoomEnvironment.js','examples/js/controls/OrbitControls.js','examples/js/exporters/GLTFExporter.js']: three+='\n'+open(d+f).read()
three=three.replace('</script','<\\/script')
app=open('/workspace/open-wheel-cockpit/src/app.js').read()
s=open('/workspace/open-wheel-cockpit/src/shell.html').read().replace('/*THREE*/',three).replace('/*APP*/',app)
open('/workspace/open-wheel-cockpit/index.html','w').write(s); print(len(s))
