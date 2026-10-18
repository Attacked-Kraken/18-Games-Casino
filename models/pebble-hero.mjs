// Pebble hero for Flick Fortress (JOB J16) - the main 3D model for the owner's approval.
// Adorable round pebble character with big sparkly eyes, rosy cheeks and a happy smile,
// gray stone body with mossy green patches. v2: owner said "make more adorable".
// CODE-BUILT (no CC0 round pebble hero with a face exists on Kenney/Poly Pizza/Quaternius).
// View: tools/model-viewer.html?m=models/pebble-hero.mjs&look=studio

export async function buildPebbleHero() {
  const THREE = window.THREE;
  const g = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9a9da2, roughness: 0.8, metalness: 0.05 });
  const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x7e8186, roughness: 0.85, metalness: 0.05 });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x6a9d4a, roughness: 1.0, metalness: 0.0 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.1 });
  const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xe88a8a, roughness: 0.9 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x4a2a2a, roughness: 0.7 });

  // Body: a round chubby pebble, slightly squashed, with a subtle lumpy surface
  const bodyGeo = new THREE.SphereGeometry(1, 48, 32);
  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = 1 + 0.03 * Math.sin(x * 5.1) * Math.sin(y * 4.3) * Math.sin(z * 3.7);
    pos.setXYZ(i, x * n * 1.08, y * n * 0.95, z * n * 1.02);
  }
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, stoneMat);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Mossy green patches (3 patches, flattened spheres on the surface)
  const patchSpots = [
    { p: [0.55, 0.68, 0.35], s: 0.38 },
    { p: [-0.65, 0.4, -0.3], s: 0.3 },
    { p: [0.1, -0.5, 0.75], s: 0.34 },
  ];
  for (const spot of patchSpots) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(spot.s, 24, 16), mossMat);
    const v = new THREE.Vector3(...spot.p).normalize();
    patch.position.copy(v.multiplyScalar(0.94));
    patch.scale.set(1, 0.4, 1);
    patch.lookAt(patch.position.clone().multiplyScalar(2));
    patch.castShadow = true;
    g.add(patch);
  }

  // ADORABLE eyes: big, round, with sparkles. No angry brows.
  const eyeY = 0.3, eyeX = 0.32, eyeZ = 0.84;
  for (const s of [-1, 1]) {
    // Big eye white (bigger than v1)
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 20), eyeWhiteMat);
    eye.position.set(s * eyeX, eyeY, eyeZ);
    eye.scale.set(1, 1.2, 0.55);
    g.add(eye);
    // Big pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), pupilMat);
    pupil.position.set(s * eyeX, eyeY + 0.03, eyeZ + 0.16);
    g.add(pupil);
    // Sparkle highlight (makes eyes look cute and lively)
    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), sparkleMat);
    sparkle.position.set(s * eyeX - 0.05, eyeY + 0.09, eyeZ + 0.24);
    g.add(sparkle);
  }

  // Rosy cheeks (blush marks below and outside the eyes)
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), cheekMat);
    cheek.position.set(s * 0.58, 0.02, 0.78);
    cheek.scale.set(1, 0.7, 0.4);
    g.add(cheek);
  }

  // Happy smile: a curved torus segment
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.045, 12, 24, Math.PI * 0.7),
    mouthMat
  );
  smile.position.set(0, -0.12, 0.92);
  smile.rotation.z = Math.PI * 1.15; // orient the arc as a smile
  smile.rotation.x = -0.15;
  g.add(smile);

  // Small stone feet
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14), darkStoneMat);
    foot.position.set(s * 0.4, -0.85, 0.1);
    foot.scale.set(1, 0.55, 1.2);
    foot.castShadow = true;
    g.add(foot);
  }

  // Tiny stubby arms
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), darkStoneMat);
    arm.position.set(s * 1.04, -0.02, 0.15);
    arm.scale.set(0.7, 1.0, 0.7);
    arm.rotation.z = s * -0.25;
    arm.castShadow = true;
    g.add(arm);
  }

  return g;
}
