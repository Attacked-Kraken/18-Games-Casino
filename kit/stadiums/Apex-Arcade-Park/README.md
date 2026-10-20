# Apex Arcade Park: a realistic 3D ballpark

A packed big-league ballpark at night, built entirely in code with three.js (r128). The only brand in it is **Apex Arcade**. There are no real teams, logos, or other sponsors.

## Files
- `index.html`: the whole viewer in one offline file (about 0.7 MB). three.js, RoomEnvironment, OrbitControls, and GLTFExporter are inlined, so it needs no internet.
- `stadium.glb`: the model as glTF binary (about 7 MB). The crowd is baked into light colored cards (1 in 4 fans) and textures are capped at 512 px.
- `screenshots/`: behind home, upper deck, bleachers, and aerial views.
- `src/`: `app.js`, `shell.html`, and `build.py` (rebuilds index.html).

## What's modelled
- **Field:** regulation layout (90 ft bases, 60.5 ft mound) with clay infield and dirt arc. Diamond-mowed grass, base paths, chalk foul lines, batter's and catcher's boxes, on-deck circles, raised mound and rubber, bases, home plate, warning track, and bullpens.
- **Fences and markers:** an outfield wall with green padding, a yellow top line, and APEX ARCADE ad panels. Distance markers (328/375/400) and yellow foul poles with screens.
- **Seating bowl:** a lower deck wrapping foul territory, outfield bleachers, and a club level with lit suite windows. The upper deck has aisles, glass and metal railings, and a roof canopy on columns. The outer facade has lit concourse arches.
- **Crowd:** about 34,000 instanced fans in varied shirt colors (lots of orange and navy for the home side) with varied skin tones. Fans bob in the GPU shader, and the **Wave** button sends a wave around the stands.
- **Sponsor signage (Apex Arcade):** LED ribbon boards on the club fascia, upper deck, roof fascia, and bleachers. An LED board behind home plate, the wall ads, the "APEX ARCADE PARK" name on the upper facade and on top of the scoreboard, and the logo mowed into the grass behind home.
- **Boards and lights:** an animated video board that cycles messages every 4 s, a line-score board, and waving flags. Four outfield light towers and six roof light banks have night glow.
- **People:** dugouts with players on the bench. On the field: 9 fielders, a batter with a bat, a catcher, an umpire, and a runner on first.
- **Lighting:** PBR materials, ACES tone mapping, and a 2048 shadow map.

## Controls
Drag to orbit, pinch or scroll to zoom, and two-finger or right-drag to pan. Camera buttons: Behind home, Upper deck, Bleachers, Aerial, Field level. Also Wave and Export GLB (share sheet or download).
