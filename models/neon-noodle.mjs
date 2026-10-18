// Neon Noodle main 3D model for JOB J15 (MODELS.md, WAITING OWNER)
// A glowing neon snake: segmented body, head with eyes, emissive materials for glow.
// View in: tools/model-viewer.html?m=models/neon-noodle.mjs&look=night&name=Neon%20Noodle
// Built in code (zero file size - no textures, emissive glow via materials).

export async function buildNeonNoodle() {
  const THREE = window.THREE;
  const group = new THREE.Group();
  group.name = 'neon-noodle';

  // Neon color palette (cyan/magenta/green like classic snake.io)
  const COLORS = [0x00ffcc, 0xff00ff, 0x00ff00, 0xffff00];

  // Body: 12 glowing segments, tapering toward tail
  const SEGMENTS = 12;
  const bodyGroup = new THREE.Group();
  const color = COLORS[0]; // cyan noodle

  for (let i = 0; i < SEGMENTS; i++) {
    const t = i / (SEGMENTS - 1);
    const r = 0.5 * (1 - t * 0.6); // taper: head 0.5, tail 0.2
    const geo = new THREE.SphereGeometry(r, 16, 12);
    // Emissive for neon glow (no texture needed)
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8 - t * 0.3,
      roughness: 0.3,
      metalness: 0.1,
    });
    const seg = new THREE.Mesh(geo, mat);
    // S-curve pose
    const x = i * 0.85;
    const z = Math.sin(i * 0.7) * 1.2;
    const y = 0.5 + Math.sin(i * 0.5) * 0.15;
    seg.position.set(x, y, z);
    // Slight squash for organic feel
    seg.scale.set(1, 0.9, 1);
    bodyGroup.add(seg);

    // Glow ring between segments (alternating accent color)
    if (i < SEGMENTS - 1) {
      const ringGeo = new THREE.TorusGeometry(r * 0.95, 0.06, 8, 20);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x + 0.42, y, z);
      ring.rotation.y = Math.PI / 2;
      bodyGroup.add(ring);
    }
  }

  // Head: larger, with eyes and antennae
  const headGeo = new THREE.SphereGeometry(0.65, 20, 16);
  const headMat = new THREE.MeshStandardMaterial({
    color: color, emissive: color, emissiveIntensity: 1.0,
    roughness: 0.2, metalness: 0.1,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(-0.7, 0.55, 0);
  head.scale.set(1.1, 1, 1);
  bodyGroup.add(head);

  // Eyes: white with black pupils, on top-front of head
  for (const sx of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    eyeWhite.position.set(-1.05, 0.85, sx * 0.28);
    bodyGroup.add(eyeWhite);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    pupil.position.set(-1.18, 0.87, sx * 0.28);
    bodyGroup.add(pupil);
  }

  // Antennae: two glowing stalks
  for (const sx of [-1, 1]) {
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc })
    );
    stalk.position.set(-0.5, 1.1, sx * 0.2);
    stalk.rotation.z = -0.3;
    stalk.rotation.x = sx * 0.3;
    bodyGroup.add(stalk);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xff00ff })
    );
    tip.position.set(-0.58, 1.35, sx * 0.28);
    bodyGroup.add(tip);
  }

  group.add(bodyGroup);

  // Report for the model viewer
  const report = () => ({
    segments: SEGMENTS,
    colors: COLORS.length,
    drawCalls: bodyGroup.children.length,
  });

  return { group, report };
}

// Default export for the model viewer
export default { buildNeonNoodle };
