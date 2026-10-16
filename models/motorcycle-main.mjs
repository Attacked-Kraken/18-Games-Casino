// Main 3D motorcycle model for JOB J2 (motorcycle-world)
// Sport motorcycle - procedural, original design
// To be rendered in tools/model-viewer.html

export function buildMotorcycle(colorHex = 0xd42a1e) {
  // Returns { group, wheels } - wheels for spin animation
  const g = new THREE.Group();
  const wheels = [];
  
  const paintMat = new THREE.MeshStandardMaterial({ 
    color: colorHex, roughness: 0.35, metalness: 0.6 
  });
  const darkMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a, roughness: 0.8 
  });
  const chromeMat = new THREE.MeshStandardMaterial({ 
    color: 0xc0c0c0, roughness: 0.25, metalness: 0.9 
  });
  const tireMat = new THREE.MeshStandardMaterial({ 
    color: 0x0a0a0a, roughness: 0.95 
  });
  
  // Wheels (front and rear) — solid rims, resting on y=0 (NEVER hollow / below ground)
  const wheelGeo = new THREE.TorusGeometry(0.35, 0.12, 12, 24);
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 20);
  const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.8 });
  const WHEEL_R = 0.47; // torus outer radius: 0.35 + 0.12
  
  function makeWheel(x, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, WHEEL_R, z); // bottom of tire touches y=0
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat); // solid disc fills the torus hole
    rim.rotation.z = Math.PI / 2;
    rim.castShadow = true;
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    hub.rotation.z = Math.PI / 2;
    pivot.add(tire, rim, hub);
    g.add(pivot);
    wheels.push(pivot);
    return pivot;
  }
  
  const frontWheel = makeWheel(0, 0.9);
  const rearWheel = makeWheel(0, -0.7);
  
  // Frame (central body)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 1.2), darkMat);
  frame.position.set(0, 0.65, 0.1);
  frame.castShadow = true;
  g.add(frame);
  
  // Fuel tank (sculpted)
  const tank = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), paintMat);
  tank.scale.set(0.8, 0.7, 1.4);
  tank.position.set(0, 0.95, 0.25);
  tank.castShadow = true;
  g.add(tank);
  
  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.55), darkMat);
  seat.position.set(0, 0.92, -0.35);
  seat.castShadow = true;
  g.add(seat);
  
  // Tail (rear fairing)
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.4), paintMat);
  tail.position.set(0, 0.98, -0.65);
  tail.castShadow = true;
  g.add(tail);
  
  // Front fairing (sport bike nose)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), paintMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.85, 0.95);
  nose.castShadow = true;
  g.add(nose);
  
  // Windshield
  const shield = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.7 })
  );
  shield.position.set(0, 1.05, 0.85);
  shield.rotation.x = -0.4;
  g.add(shield);
  
  // Handlebars
  const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
  const handlebar = new THREE.Mesh(barGeo, chromeMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.1, 0.65);
  handlebar.castShadow = true;
  g.add(handlebar);
  
  // Front fork
  const forkGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
  for (const x of [-0.12, 0.12]) {
    const fork = new THREE.Mesh(forkGeo, chromeMat);
    fork.position.set(x, 0.65, 0.85);
    fork.rotation.x = 0.15;
    fork.castShadow = true;
    g.add(fork);
  }
  
  // Exhaust pipe
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 10), chromeMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0.15, 0.45, -0.5);
  exhaust.castShadow = true;
  g.add(exhaust);
  
  // Headlight
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 0.8 })
  );
  light.position.set(0, 0.88, 1.05);
  g.add(light);
  
  // Rider (simple)
  const riderBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.4, 6, 10), darkMat);
  riderBody.position.set(0, 1.25, -0.1);
  riderBody.rotation.x = 0.5; // leaning forward
  riderBody.castShadow = true;
  g.add(riderBody);
  
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), paintMat);
  helmet.position.set(0, 1.55, 0.15);
  helmet.castShadow = true;
  g.add(helmet);
  
  return { group: g, wheels };
}
