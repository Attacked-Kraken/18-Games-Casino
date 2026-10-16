/* look-presets.js - ONE shared lighting/floor setup per kind of game, used by BOTH tools/model-viewer.html and the
   games themselves, so a 3D model looks the same in the owner's viewer as it does in the game (MODELS.md rule).
   Usage (ES module):  import { applyLook } from './look-presets.js';
     const L = applyLook(THREE, renderer, scene, 'rink');   // 'rink' | 'field' | 'track' | 'night' | 'studio'
     ...each frame: L.render(scene, camera, timeSeconds)
   Uses the shared ApexGFX kit (apex-gfx.js) when the page loaded it, plain three.js lighting otherwise. */
export const LOOKS = {
  rink:   { env: 'studio', floor: '#e9f3fb', rough: 0.12, sky: '#1b2433', hemi: ['#eef4ff', '#5a6a80', 1.0], sun: ['#ffffff', 2.4, [3, 9, 4]], fill: ['#cfe0ff', 0.9, [-4, 6, -3]], exposure: 1.0 },
  field:  { env: 'sky', floor: '#3f7d32', rough: 0.9, sky: '#8fc4f2', hemi: ['#e8f3ff', '#4a6a35', 1.1], sun: ['#fff4e0', 2.8, [5, 10, 3]], fill: ['#bcd6ff', 0.5, [-5, 5, -4]], exposure: 1.0 },
  track:  { env: 'sky', floor: '#b4472f', rough: 0.85, sky: '#9cc9f0', hemi: ['#eaf4ff', '#7a4a35', 1.1], sun: ['#fff1dc', 2.8, [5, 10, 3]], fill: ['#bcd6ff', 0.5, [-5, 5, -4]], exposure: 1.0 },
  night:  { env: 'night', floor: '#2a2f38', rough: 0.6, sky: '#070b18', hemi: ['#9fb4ff', '#101018', 0.6], sun: ['#e6eeff', 3.2, [2, 12, 5]], fill: ['#ffd9a8', 0.8, [-5, 7, -3]], exposure: 1.1 },
  studio: { env: 'studio', floor: '#8a8f99', rough: 0.7, sky: '#2b2f38', hemi: ['#ffffff', '#40444c', 1.0], sun: ['#ffffff', 2.2, [3, 8, 5]], fill: ['#dfe8ff', 1.0, [-4, 5, -4]], exposure: 1.0 }
};

export function applyLook(THREE, renderer, scene, name, opt) {
  opt = opt || {};
  const L = LOOKS[name] || LOOKS.studio;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = L.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  let G = null;
  try { G = window.ApexGFX ? window.ApexGFX.install(THREE, renderer, { bloom: 0.35, exposure: L.exposure }) : null; } catch (e) { G = null; }
  if (G) G.env(scene, L.env, { intensity: 0.5 });
  scene.background = new THREE.Color(L.sky);
  const hemi = new THREE.HemisphereLight(L.hemi[0], L.hemi[1], L.hemi[2]); scene.add(hemi);
  const sun = new THREE.DirectionalLight(L.sun[0], L.sun[1]); sun.position.set(...L.sun[2]); scene.add(sun);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  const sc = sun.shadow.camera; sc.left = sc.bottom = -4; sc.right = sc.top = 4; sc.near = 0.5; sc.far = 40;
  if (G) G.shadows(sun, 2048);
  const fill = new THREE.DirectionalLight(L.fill[0], L.fill[1]); fill.position.set(...L.fill[2]); scene.add(fill);
  let floor = null;
  if (opt.floor !== false) {
    floor = new THREE.Mesh(new THREE.CircleGeometry(opt.floorSize || 12, 64),
      new THREE.MeshStandardMaterial({ color: L.floor, roughness: L.rough, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  }
  return {
    name, preset: L, gfx: G, sun, fill, hemi, floor,
    render(s, cam, t) { if (G) G.render(s, cam, t); else renderer.render(s, cam); }
  };
}
