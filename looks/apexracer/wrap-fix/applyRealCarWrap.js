function applyRealCarWrap(model, bodyMat, cfg) {
  if (!cfg.wrap || cfg.wrap === 'none') return;
  const acc = cfg.wrapCol || '#ffffff';
  const key = cfg.wrap + cfg.paint + acc + 'combined';
  let tex = WC[key];
  if (!tex) {
    const ts = wrapTex(cfg.wrap, cfg.paint, acc, 's'), tt = wrapTex(cfg.wrap, cfg.paint, acc, 't');
    tex = ctex(1024, 1024, (g, w, h) => { g.drawImage(tt.image, 0, 0, w, h * 0.5); g.drawImage(ts.image, 0, h * 0.5, w, h * 0.5); });
    WC[key] = tex;
  }
  bodyMat.map = tex; bodyMat.color.set(0xffffff);
  if (cfg.wrap === 'neon') {
    const ek = key + 'e'; let etex = WC[ek];
    if (!etex) { const es = wrapTex('neon', cfg.paint, acc, 'e'); etex = ctex(1024, 1024, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.drawImage(es.image, 0, h * 0.5, w, h * 0.5); }); WC[ek] = etex; }
    bodyMat.emissiveMap = etex; bodyMat.emissive = new THREE.Color(acc).multiplyScalar(2.5);
  }
  bodyMat.needsUpdate = true;
  /* ONE box for the whole body, in the model's own space (so stripes line up across bumper, door, roof) */
  model.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert(), v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  const box = new THREE.Box3(), meshes = [];
  model.traverse((q) => {
    if (!q.isMesh || q.material !== bodyMat || !q.geometry || !q.geometry.attributes.position || !q.geometry.attributes.normal) return;
    meshes.push(q); const p = q.geometry.attributes.position, m = new THREE.Matrix4().multiplyMatrices(inv, q.matrixWorld);
    for (let i = 0; i < p.count; i++) box.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(m));
  });
  if (!meshes.length) return;
  const L = box.max.x - box.min.x || 1, H = box.max.y - box.min.y || 1, W = box.max.z - box.min.z || 1;
  for (const q of meshes) {
    const geo = q.geometry; if (!geo.userData.uv0) geo.userData.uv0 = geo.attributes.uv ? geo.attributes.uv.clone() : null;
    const p = geo.attributes.position, nr = geo.attributes.normal, m = new THREE.Matrix4().multiplyMatrices(inv, q.matrixWorld); nm.getNormalMatrix(m);
    const uvs = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m); n.fromBufferAttribute(nr, i).applyMatrix3(nm).normalize();
      const ux = (v.x - box.min.x) / L, uy = (v.y - box.min.y) / H, uz = (v.z - box.min.z) / W;
      if (n.y > 0.35) { uvs[i * 2] = ux; uvs[i * 2 + 1] = 0.5 + 0.5 * uz; }
      else { uvs[i * 2] = v.z < 0 ? 1 - ux : ux; uvs[i * 2 + 1] = 0.5 * uy; }   /* -z side flipped so text reads right */
    }
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
}
