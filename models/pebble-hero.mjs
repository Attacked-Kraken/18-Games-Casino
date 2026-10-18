// Pebble hero for Flick Fortress (JOB J16) - the main 3D model for the owner's approval.
// Cute round pebble character with determined eyes, gray stone body with mossy green patches.
// CODE-BUILT (no CC0 round pebble hero with a face exists on Kenney/Poly Pizza/Quaternius).
// View: tools/model-viewer.html?m=models/pebble-hero.mjs&look=studio

export async function buildPebbleHero() {
  const THREE = window.THREE;
  const g = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8d91, roughness: 0.85, metalness: 0.05 });
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x6e7176, roughness: 0.9, metalness: 0.05 });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x5a7d3a, roughness: 1.0, metalness: 0.0 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x3a3d41, roughness: 0.8 });

  // Body: a round pebble, slightly squashed (wider than tall), with a subtle lumpy surface
  const bodyGeo = new THREE.SphereGeometry(1, 48, 32);
  // Slightly deform for a hand-shaped pebble feel (not a perfect ball)
  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Gentle noise: pebbles aren't perfect spheres
    const n = 1 + 0.04 * Math.sin(x * 5.1) * Math.sin(y * 4.3) * Math.sin(z * 3.7);
    pos.setXYZ(i, x * n * 1.05, y * n * 0.92, z * n * 1.0);
  }
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, stoneMat);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Mossy green patches (3 patches, flattened spheres stuck on the surface)
  const patchSpots = [
    { p: [0.55, 0.62, 0.45], s: 0.42 },
    { p: [-0.62, 0.35, -0.35], s: 0.33 },
    { p: [0.15, -0.55, 0.72], s: 0.38 },
  ];
  for (const spot of patchSpots) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(spot.s, 24, 16), mossMat);
    const v = new THREE.Vector3(...spot.p).normalize();
    patch.position.copy(v.multiplyScalar(0.92));
    patch.scale.set(1, 0.45, 1);
    patch.lookAt(patch.position.clone().multiplyScalar(2));
    patch.castShadow = true;
    g.add(patch);
  }

  // Determined eyes: white spheres with dark pupils, angled brows
  // Eyes sit on the front (+z), slightly above center
  const eyeY = 0.28, eyeX = 0.34, eyeZ = 0.82;
  for (const s of [-1, 1]) {
    // Eye white
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), eyeWhiteMat);
    eye.position.set(s * eyeX, eyeY, eyeZ);
    eye.scale.set(1, 1.15, 0.6);
    g.add(eye);
    // Pupil (looking slightly inward = determined)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), pupilMat);
    pupil.position.set(s * (eyeX - 0.04), eyeY + 0.02, eyeZ + 0.13);
    g.add(pupil);
    // Angry/determined brow: a box rotated to slant down toward the center
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.08), browMat);
    brow.position.set(s * (eyeX + 0.02), eyeY + 0.32, eyeZ + 0.05);
    brow.rotation.z = s * -0.35; // slant down toward nose
    brow.rotation.y = s * 0.15;
    g.add(brow);
  }

  // Small stone feet (two nubs at the bottom so it can stand)
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), darkStoneMat);
    foot.position.set(s * 0.42, -0.82, 0.1);
    foot.scale.set(1, 0.6, 1.2);
    foot.castShadow = true;
    g.add(foot);
  }

  // Tiny stone arms (nubs on the sides)
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), darkStoneMat);
    arm.position.set(s * 1.02, -0.05, 0.15);
    arm.scale.set(0.7, 1.1, 0.7);
    arm.rotation.z = s * -0.3;
    arm.castShadow = true;
    g.add(arm);
  }

  return g;
}
