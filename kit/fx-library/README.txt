APEX EFFECTS LIBRARY
====================
86 canvas effects in one drop-in file (effects.js), plus 84 PNG particle textures and 11 sprite sheets.
Everything here is original and made from scratch, so it's safe for paid apps and no credit is needed.

QUICK START
  <canvas id="fx" style="position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none"></canvas>
  <script src="effects.js"></script>
  <script>
    const fx = new ApexFX(document.getElementById('fx'));   // options: {maxParticles:2500, dprCap:2}
    fx.autoLoop();                                          // or call fx.update(dt); fx.draw(); in your own loop
    fx.play('explosion_medium', x, y);                      // x, y in CSS pixels on the canvas
    fx.play('damage_number', x, y, {value: 42});            // some effects take {value} or {color}
    fx.screenShake(10, 0.3); fx.hitFlash('#fff', 0.15);
  </script>
  ApexFX.list() returns every effect name, and ApexFX.info(name) returns its description.
  The engine needs no image files: all of its textures are drawn in code when it starts. Particles are capped,
  the screen pixel ratio is capped at 2, and tinted textures are cached, so it stays fast on phones.
  To draw effects over your own game on the same canvas, call fx.draw(false) after you draw your frame.

DEMO
  Open demo.html; it works offline, including opened from the Files app in iPhone Safari, because the engine is built into the page.
  Tap an effect to play it, then tap the stage to replay it at that spot. "Play all" runs through every effect.
  Sound: unzip Effects-Sounds.zip next to demo.html so there's an "Effects-Sounds" folder beside it. A page opened from Files
  may not be able to reach sibling files; in that case the demo still runs, just silently.

SOUNDS
  Effects-Sounds.zip has one MP3 per effect, with the same name (e.g. Effects-Sounds/explosion_medium.mp3).

PNG ASSETS (for other engines)
  textures/      glow, orb, star, flare, spark and ring in 9 colors; smoke 1-6; hearts; pluses; drop; bubble; leaves; snowflake;
                 confetti; coin; gem; shard; rock; square
  spritesheets/  name_COLSxROWS_SIZEpx.png: explosion (fire, blue, green), smoke_puff, fire_loop, coin_spin,
                 sparkle_twinkle, portal_loop, shockwave, lightning, water_splash. Frames run left to right, then top to bottom.

EFFECTS
  sparkle                twinkling sparkles
  sparkle_burst          big sparkle ring
  explosion_small        small explosion
  explosion_medium       medium explosion
  explosion_large        large explosion + flash
  explosion_huge         huge explosion, double blast
  explosion_blue         blue energy explosion
  explosion_green        green toxic explosion
  confetti               confetti shower
  confetti_rain          confetti from the top of the screen
  smoke_puff             smoke puff
  smoke_column           rising smoke column
  dust                   dust kick-up
  landing_dust           landing dust ring
  fire                   burning fire (2.5 s)
  fireball               fireball trail burst
  sparks                 metal sparks
  grind_sparks           continuous grinding sparks
  electricity            electric arcs
  lightning_strike       lightning bolt from the sky
  water_splash           water splash
  water_drip             small drips
  bubbles                rising bubbles
  bubble_pop             bubble pop
  speed_lines            anime speed lines
  speed_streaks          horizontal speed streaks
  nitro_flame            nitro exhaust flame (aims left)
  exhaust_backfire       exhaust pop
  tire_smoke             tire smoke (drift)
  skid_marks_puff        quick skid puff
  screen_shake           camera shake
  hit_flash              white hit flash
  damage_flash           red damage flash + shake
  hit_spark              impact hit spark
  coin_burst             coins burst out
  coin_collect           coin collect sparkle
  star_pop               star pop
  star_rating            three stars pop in order
  trail                  glowing trail (follows a path for 1.5 s)
  rainbow_trail          rainbow trail
  fireworks              firework show (3 rockets)
  level_up_glow          level-up column glow
  shockwave              shockwave ring
  heal                   healing pluses rise
  shield                 shield bubble (2 s)
  shield_break           shield shatters
  portal                 swirling portal (2.5 s)
  teleport               teleport beam
  snow                   snowfall (5 s)
  rain                   rainfall (4 s)
  rain_splashes          rain splashes on the ground
  leaves                 falling leaves (5 s)
  petals                 pink petals drift
  magic_sparkles         magic spell sparkles
  magic_circle           rotating magic circle
  dark_magic             dark purple burst
  ice_shatter            ice crystals shatter
  poison_cloud           green poison cloud
  heart_burst            hearts burst
  damage_number          floating damage number
  crit_number            critical hit number
  combo_text             combo text pop
  perfect_text           PERFECT! text
  score_popup            +100 score popup
  power_up               power-up aura burst
  unlock_burst           unlock rays + sparkles
  chest_open             treasure chest open glow
  ground_slam            ground slam dust + crack
  debris                 rock debris
  glass_shatter          glass shards
  jump_puff              jump puff
  dash_afterimage        dash burst
  charge_up              charging energy (1.2 s)
  laser_beam             laser beam across screen
  muzzle_flash           muzzle flash (aims right)
  respawn                respawn sparkle column
  victory_burst          victory: confetti + fireworks + text
  game_over_fade         game over smoke + text
  glow_pulse             soft glow pulse
  firefly                fireflies drift (4 s)
  steam                  steam vent
  bounce_rings           bouncy pad rings
  checkpoint_flag        checkpoint sparkles + text
  finish_line            finish line confetti both sides
  boost_pad              boost pad chevrons
  collect_gem            gem collect flash
