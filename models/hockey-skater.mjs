// Hockey skater for the model viewer and the 3D model gate (MODELS.md):
//   tools/model-viewer.html?m=models/hockey-skater.mjs&look=rink&name=Hockey%20skater
// Real CC0 body (characters/base-human-v2) + the shared hockey kit (characters/base-human-v2/gear.js), in the skating stance.
// ?team=away shows the green kit, ?cage=1 the kids' cage, ?goalie=1 the goalie stance.
export async function buildHockeySkater() {
  const THREE = window.THREE, q = new URLSearchParams(location.search);
  const base = new URL('../characters/base-human-v2/', import.meta.url).href;
  const { loadHumans } = await import(base + 'humans.js');
  const { hockeyKit } = await import(base + 'gear.js');
  const H = await loadHumans(THREE, base);
  const a = H.make({ g: q.get('g') === 'f' ? 'f' : 'm', skin: +(q.get('skin') || 2), hair: 'buzzed', outfit: 'hoodie' }, 1.85);
  const away = q.get('team') === 'away';
  const kit = hockeyKit(THREE, a, away
    ? { jersey: 0x0e7c7b, yoke: 0x0a4443, trim: 0xffffff, pants: 0x0a2a29, helmet: 0x0a4443, gloves: 0x0a4443, num: 27, name: 'SHARKE', crest: 'S', cage: q.get('cage') === '1', goalie: q.get('goalie') === '1' }
    : { jersey: 0x1f6fd6, yoke: 0x123c73, trim: 0xffffff, pants: 0x0d1a2e, helmet: 0x123c73, gloves: 0x123c73, num: 17, name: 'VANCE', crest: 'W', cage: q.get('cage') === '1', goalie: q.get('goalie') === '1' });
  const g = new THREE.Group(); g.add(a.object);
  // hold the pose every frame: the viewer's mixer drives the clip, the kit adds the stance on top
  let t = 0;
  a.play('Idle_Loop', 0);
  const tick = () => { t += 1 / 60; a.mixer.update(1 / 60); kit.stance.apply({ crouch: 1, stride: +(q.get('stride') || 0), phase: t }); requestAnimationFrame(tick); };
  a.mixer.update(0); kit.stance.apply({ crouch: 1 }); a.object.updateMatrixWorld(true); requestAnimationFrame(tick);
  window.__kit = kit;
  return { group: g };
}
