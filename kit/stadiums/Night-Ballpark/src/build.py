import re
d='/tmp/t128/package/'
three=open(d+'build/three.min.js').read()
for f in ['examples/js/environments/RoomEnvironment.js','examples/js/controls/OrbitControls.js','examples/js/exporters/GLTFExporter.js']: three+='\n'+open(d+f).read()
three=three.replace('</script','<\\/script')
app=open('/workspace/ballpark-stadium/src/app.js').read()
s=open('/workspace/ballpark-stadium/src/shell.html').read().replace('/*THREE*/',three).replace('/*APP*/',app)
open('/workspace/ballpark-stadium/index.html','w').write(s); print(len(s))
