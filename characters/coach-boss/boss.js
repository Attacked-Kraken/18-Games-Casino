/* "The Boss" — Joseph's Coach/Owner avatar. Original character built on Base Human v2 (imported, not modified; v1 untouched).
   Dark charcoal pinstripe three-piece suit, white shirt + gold silk tie, pocket square, gold watch + rings, slicked hair, groomed beard,
   optional fedora + shades. No real brands or likenesses. */
import { loadHumans } from '../base-human-v2/humans.js';
export async function loadBoss(THREE, base = 'characters/base-human-v2/') {
  const H = await loadHumans(THREE, base);
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a72a, metalness: 1, roughness: .22 });
  function make(o = {}) { const h = H.make({ g: 'm', skin: o.skin ?? 2, hair: 'parted_beard', hairCol: 0x15100c, outfit: 'blazer', cols: { top: 0xf4f2ec, jacket: 0x1d1d26, bottom: 0x1d1d26, shoes: 0x0c0a0a } }, o.h || 1.86);
    const obj = h.object; obj.updateMatrixWorld(true); const B = {}; obj.traverse((n) => { if (n.isBone) B[n.name] = n; });
    obj.traverse((n) => { if (n.isMesh && n.material && n.material.transparent && n.material.alphaTest) { n.material.roughness = .35; n.material.color.set(0x120d0a); } });   /* slicked, glossy hair & beard */
    let body = null; obj.traverse((n) => { if (n.isSkinnedMesh && n.material && n.material.customProgramCacheKey && n.material.customProgramCacheKey() === 'hum2') body = n; });
    if (body) { const mat = body.material, prev = mat.onBeforeCompile; mat.onBeforeCompile = (sh) => { prev(sh);
        sh.fragmentShader = sh.fragmentShader.replace('vec4 oc = outfit(vB);', `vec4 oc = outfit(vB);
  { vec3 q = vB; float ax = abs(q.x); vec3 SUIT = vec3(.011,.011,.017);
    if (oc.a > .5 && q.y > .13 && max(oc.r, max(oc.g, oc.b)) < .03) { float s = abs(fract((q.x + q.z * .35) * 70.) - .5); oc.rgb = SUIT + vec3(.022,.022,.025) * smoothstep(.035, .012, s); }   /* pinstripes */
    else if (oc.a > .5 && q.z > 0. && q.y > .98 && q.y < 1.47 && oc.r > .3) {                                                     /* shirt opening: waistcoat + silk tie */
      if (ax < .017 && q.y > 1.12) { oc.rgb = vec3(.62,.38,.04) * (.85 + .25 * step(.5, fract((q.y - q.x) * 60.))); if (q.y > 1.43) oc.rgb *= 1.15; }
      else if (q.y < 1.40) { oc.rgb = SUIT * 1.3; if (abs(ax - .028) < .006 && abs(fract(q.y * 18.) - .5) < .12 && q.x > 0.) oc.rgb = vec3(.5,.4,.2); } } }`); };
      mat.customProgramCacheKey = () => 'boss1'; mat.needsUpdate = true; }
    const at = (bone, mesh, x, y, z) => { if (!bone) return mesh; obj.add(mesh); mesh.position.set(x, y, z); mesh.updateMatrixWorld(true); bone.attach(mesh); return mesh; };
    const wp = (n) => { const v = new THREE.Vector3(); B[n].getWorldPosition(v); return obj.worldToLocal(v); };
    /* pocket square (gold silk, folded peaks) */
    { const ps = new THREE.Mesh(new THREE.ConeGeometry(.022, .035, 3), new THREE.MeshStandardMaterial({ color: 0xe8b84a, roughness: .35, metalness: .2 })); ps.rotation.set(0, 0, 0); at(B.spine_03, ps, .1, 1.355, .118); }
    /* lapel pin */
    { const pin = new THREE.Mesh(new THREE.SphereGeometry(.006, 10, 8), gold); at(B.spine_03, pin, -.09, 1.39, .125); }
    /* gold watch (left wrist) + rings */
    if (B.hand_l && B.lowerarm_l) { const a = wp('lowerarm_l'), b = wp('hand_l'), d = b.clone().sub(a).normalize(); const w = new THREE.Mesh(new THREE.TorusGeometry(.03, .008, 8, 20), gold);
      w.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); const p = b.clone().addScaledVector(d, -.035); at(B.lowerarm_l, w, p.x, p.y, p.z);
      const face = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .006, 20), new THREE.MeshStandardMaterial({ color: 0x0a1a12, metalness: .6, roughness: .15 })); face.quaternion.copy(w.quaternion); at(B.lowerarm_l, face, p.x, p.y + .03, p.z); }
    for (const s of ['l', 'r']) if (B['hand_' + s]) { const b = wp('hand_' + s); const r = new THREE.Mesh(new THREE.TorusGeometry(.011, .004, 6, 14), gold); r.rotation.y = Math.PI / 2; at(B['hand_' + s], r, b.x + (s === 'l' ? .075 : -.075), b.y - .005, b.z + .01); }
    /* fedora + shades (optional) */
    const acc = new THREE.Group(); { const felt = new THREE.MeshStandardMaterial({ color: 0x17161c, roughness: .75 });
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(.095, .108, .1, 28), felt); crown.position.y = .05; crown.scale.z = 1.12; acc.add(crown);
      const dent = new THREE.Mesh(new THREE.SphereGeometry(.095, 20, 8, 0, Math.PI * 2, 0, Math.PI * .3), felt); dent.position.y = .07; dent.scale.set(1, .5, 1.12); acc.add(dent);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(.165, .165, .008, 32), felt); brim.scale.z = 1.08; acc.add(brim);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(.109, .109, .022, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x4a2a8a, roughness: .4 })); band.position.y = .015; band.scale.z = 1.12; acc.add(band); }
    acc.rotation.x = -.06; at(B.Head, acc, 0, 1.77, -.012);
    const shades = new THREE.Group(); { const lm = new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: .05, metalness: .5, clearcoat: 1 });
      for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.042, .026, .006), lm); l.position.x = s * .033; shades.add(l); const arm = new THREE.Mesh(new THREE.BoxGeometry(.004, .004, .1), gold); arm.position.set(s * .058, .006, -.05); shades.add(arm); }
      const br = new THREE.Mesh(new THREE.BoxGeometry(.026, .004, .004), gold); br.position.y = .008; shades.add(br); }
    at(B.Head, shades, 0, 1.706, .094);
    h.setHat = (v) => (acc.visible = v); h.setShades = (v) => (shades.visible = v); h.setHat(o.hat ?? true); h.setShades(o.shades ?? false);
    return h; }
  return { make, H };
}
