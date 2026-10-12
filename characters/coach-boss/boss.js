/* "The Boss" — Joseph's Coach/Owner avatar (original character; style-inspired by a reference, not a copy).
   Base Human v2 body (imported, unmodified). Dark navy three-piece: separate skinned jacket cloth mesh with real lapels + hem,
   waistcoat, crisp white collar, patterned dark tie, heavy gold Cuban chain + pocket-watch pendant, gold wristwatch, pocket square,
   lapel pin, charcoal fedora w/ black band, lit cigar with glowing tip + faint smoke, trimmed mustache, subtle cheek scar. */
import { loadHumans } from '../base-human-v2/humans.js';
import { shellFactory } from '../football-cruz/garment.js';
export async function loadBoss(THREE, base = 'characters/base-human-v2/') {
  const H = await loadHumans(THREE, base);
  const gold = new THREE.MeshStandardMaterial({ color: 0xe0ac30, metalness: 1, roughness: .2 });
  const NAVY = 0x121828;
  function make(o = {}) { const h = H.make({ g: 'm', skin: o.skin ?? 4, hair: 'parted', hairCol: 0x0e0a08, outfit: 'blazer', cols: { top: 0xf6f5f0, jacket: NAVY, bottom: NAVY, shoes: 0x080606 } }, o.h || 1.86);
    const obj = h.object; obj.updateMatrixWorld(true); const B = {}; obj.traverse((n) => { if (n.isBone) B[n.name] = n; });
    obj.traverse((n) => { if (n.isMesh && n.material && n.material.transparent && n.material.alphaTest) { n.material.roughness = .35; n.material.color.set(0x0e0a08); } });
    let body = null; obj.traverse((n) => { if (n.isSkinnedMesh && n.material && n.material.customProgramCacheKey && n.material.customProgramCacheKey() === 'hum2') body = n; });
    const at = (bone, mesh, x, y, z) => { if (!bone) return mesh; obj.add(mesh); mesh.position.set(x, y, z); mesh.updateMatrixWorld(true); bone.attach(mesh); return mesh; };
    if (body) { const mat = body.material, prev = mat.onBeforeCompile; mat.onBeforeCompile = (sh) => { prev(sh);
        sh.fragmentShader = sh.fragmentShader.replace('vec4 oc = outfit(vB);', `vec4 oc = outfit(vB);
  { vec3 q = vB; float ax = abs(q.x); vec3 SUIT = vec3(.006,.009,.022);
    if (oc.a > .5 && q.z > 0. && q.y > .98 && q.y < 1.5 && oc.r > .3) {                                                      /* shirt opening: waistcoat + patterned tie */
      float tw = .012 + .012 * smoothstep(1.43, 1.2, q.y);
      if (ax < tw && q.y > 1.13 && q.y < 1.47) { vec2 g = fract(q.xy * vec2(180., 180.)); oc.rgb = vec3(.025) + vec3(.07,.07,.075) * step(.5, g.x) * step(.5, g.y); }
      else if (q.y < 1.43 - (.06 - ax) * 2.5) { oc.rgb = SUIT; if (abs(ax) < .006 && abs(fract(q.y * 22.) - .5) < .14) oc.rgb = vec3(.02); } } }`); };
      mat.customProgramCacheKey = () => 'boss2'; mat.needsUpdate = true;
      /* jacket: separate skinned cloth over torso + full sleeves, open V front with lapels, hem below hips */
      const { shell, sm } = shellFactory(THREE, body);
      const keep = (x, y, z) => { const ax = Math.abs(x); if (ax > .27 && y > 1.24) return ax < .63; if (y > 1.53 || y < .74) return false; if (y < .93 && ax < .05) return false; return ax < .3; };
      const jk = shell(keep, (x, y, z) => { const ax = Math.abs(x); const sh = sm(1.32, 1.44, y) * (1 - sm(.22, .32, ax));
        if (ax > .27 && y > 1.24) return [.016 + .012 * sh + .006 * sm(.5, .62, ax), 0];
        return [.018 + .016 * sh + .03 * sm(.98, .76, y) + .008 * sm(1.1, 1.25, y) * (z > 0 ? 1 : .5), 0]; }, 'bossJacket');
      const U = { uT: { value: 0 } };
      const jm = new THREE.MeshStandardMaterial({ color: NAVY, roughness: .62, side: THREE.DoubleSide });
      jm.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 bindP; varying vec3 vB;').replace('#include <begin_vertex>', '#include <begin_vertex>\n vB = bindP;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vB;').replace('#include <color_fragment>', `#include <color_fragment>
  { vec3 q = vB; float ax = abs(q.x); bool arm = ax > .27 && q.y > 1.24;
    if (!arm && q.z > 0. && q.y > .99 && ax < .015 + (q.y - .99) * .3) discard;                                              /* open V front to the button */
    if (!arm && q.z > 0. && q.y <= .99 && q.y > .74 && ax < .012 + (.99 - q.y) * .25) discard;                                /* cutaway front hem */
    if (arm && ax > .615) discard; if (!arm && q.y < .76) discard;
    float s = abs(fract((q.x + q.z * .3) * 60.) - .5); diffuseColor.rgb *= 1. + .5 * smoothstep(.03, .01, s);                 /* faint chalk stripe */
    if (!arm && q.z > 0. && q.y > .99 && ax < .06 + (q.y - .99) * .3) diffuseColor.rgb *= .8; }`); };
      jm.customProgramCacheKey = () => 'bossJacket1'; jk.material = jm; body.parent.add(jk); jk.bind(body.skeleton, body.bindMatrix); jk.position.copy(body.position); jk.quaternion.copy(body.quaternion); jk.scale.copy(body.scale); }
    /* lapels (peaked, rolled) + white shirt collar */
    const lapM = new THREE.MeshStandardMaterial({ color: 0x0e1322, roughness: .45, side: THREE.DoubleSide });
    for (const s of [-1, 1]) { const sp = new THREE.Shape(); sp.moveTo(0, 0); sp.lineTo(.05, .02); sp.lineTo(.085, .29); sp.lineTo(.06, .33); sp.lineTo(.03, .3); sp.lineTo(.006, .33); sp.lineTo(-.004, .3); sp.lineTo(0, 0);
      const g = new THREE.ShapeGeometry(sp); const lp = new THREE.Mesh(g, lapM); lp.scale.x = s; lp.rotation.set(-.12, s * .45, s * -.03); at(B.spine_03 || B.spine_02, lp, s * .02, 1.0, .148);
      const col = new THREE.Mesh(new THREE.ConeGeometry(.016, .04, 3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .5 })); col.scale.z = .3; col.rotation.set(-.2, 0, s * 2.75); at(B.neck_01 || B.spine_03, col, s * .022, 1.47, .1); }
    /* Cuban chain + pocket-watch pendant */
    { const curve = new THREE.CatmullRomCurve3([[-.075, 1.5, .03], [-.09, 1.4, .12], [-.05, 1.25, .15], [0, 1.16, .155], [.05, 1.25, .15], [.09, 1.4, .12], [.075, 1.5, .03]].map((v) => new THREE.Vector3(...v)));
      const L = 46, lg = new THREE.TorusGeometry(.0085, .0035, 5, 10); for (let i = 0; i <= L; i++) { const u = i / L, p = curve.getPoint(u), tg = curve.getTangent(u); const l = new THREE.Mesh(lg, gold); l.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tg); if (i % 2) l.rotateX(Math.PI / 2); at(B.spine_03, l, p.x, p.y, p.z); }
      const pw = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .012, 24), gold); pw.rotation.x = Math.PI / 2; at(B.spine_03, pw, 0, 1.12, .16);
      const fc = new THREE.Mesh(new THREE.CircleGeometry(.024, 24), new THREE.MeshStandardMaterial({ color: 0xf2e6b8, roughness: .3 })); at(B.spine_03, fc, 0, 1.12, .167);
      const bow = new THREE.Mesh(new THREE.TorusGeometry(.009, .003, 6, 12), gold); at(B.spine_03, bow, 0, 1.155, .16); }
    /* pocket square, lapel pin */
    { const ps = new THREE.Mesh(new THREE.ConeGeometry(.024, .03, 4), new THREE.MeshStandardMaterial({ color: 0xead7a0, roughness: .4 })); at(B.spine_03, ps, .115, 1.31, .14);
      const pin = new THREE.Mesh(new THREE.OctahedronGeometry(.008), gold); at(B.spine_03, pin, -.11, 1.37, .15); }
    /* gold wristwatch + ring */
    const wp = (n) => { const v = new THREE.Vector3(); B[n].getWorldPosition(v); return obj.worldToLocal(v); };
    if (B.hand_l && B.lowerarm_l) { const a = wp('lowerarm_l'), b = wp('hand_l'), d = b.clone().sub(a).normalize(); const w = new THREE.Mesh(new THREE.TorusGeometry(.034, .01, 8, 20), gold);
      w.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); const p = b.clone().addScaledVector(d, -.03); at(B.lowerarm_l, w, p.x, p.y, p.z); }
    if (B.hand_r) { const b = wp('hand_r'); const r = new THREE.Mesh(new THREE.TorusGeometry(.011, .005, 6, 14), gold); r.rotation.y = Math.PI / 2; at(B.hand_r, r, b.x - .075, b.y - .005, b.z + .01); }
    /* face: trimmed mustache, subtle scar */
    { const mm = new THREE.MeshStandardMaterial({ color: 0x0a0706, roughness: .9 }); for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.005, .024, 3, 6), mm); m.rotation.set(0, 0, s * (Math.PI / 2 - .25)); at(B.Head, m, s * .014, 1.648, .101); }
      const sc = new THREE.Mesh(new THREE.BoxGeometry(.003, .03, .002), new THREE.MeshStandardMaterial({ color: 0x5a2a24, roughness: .8 })); sc.scale.y = .6; sc.rotation.z = .4; at(B.Head, sc, .052, 1.672, .084); }
    /* cigar with glowing tip + faint smoke */
    const cig = new THREE.Group(); { const c = new THREE.Mesh(new THREE.CylinderGeometry(.0065, .006, .075, 10), new THREE.MeshStandardMaterial({ color: 0x5a3418, roughness: .8 })); c.rotation.x = Math.PI / 2; c.position.z = .037; cig.add(c);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(.0068, .0068, .01, 10), gold); band.rotation.x = Math.PI / 2; band.position.z = .02; cig.add(band);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(.0068, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff5a10 })); tip.position.z = .075; cig.add(tip); cig.userData.tip = tip; }
    cig.rotation.set(.25, .35, 0); at(B.Head, cig, .018, 1.635, .095);
    const smoke = []; const smT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(220,220,225,.55)'); gr.addColorStop(1, 'rgba(220,220,225,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smT, transparent: true, depthWrite: false, opacity: 0 })); s.userData.ph = i / 6; smoke.push(s); }
    h.smoke = smoke; h.tickSmoke = (t, scene) => { const tip = cig.userData.tip, p = new THREE.Vector3(); tip.getWorldPosition(p); tip.material.color.setHSL(.05, 1, .45 + .12 * Math.sin(t * 3));
      smoke.forEach((s) => { if (!s.parent && scene) scene.add(s); const u = (t * .35 + s.userData.ph) % 1; s.position.set(p.x + Math.sin(u * 6 + s.userData.ph * 9) * .03, p.y + u * .45, p.z); s.scale.setScalar(.04 + u * .16); s.material.opacity = .32 * Math.sin(u * Math.PI); s.visible = obj.visible; }); };
    /* charcoal fedora, black band, pinched crown, snap brim */
    const acc = new THREE.Group(); { const felt = new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: .7 });
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(.09, .108, .11, 32), felt); crown.position.y = .055; crown.scale.z = 1.15; acc.add(crown);
      const top = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), felt); top.position.y = .108; top.scale.set(1, .32, 1.15); acc.add(top);
      if (0) for (const s of [-1, 1]) { const pinch = new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), new THREE.MeshStandardMaterial({ color: 0x1e1e22, roughness: .8 })); pinch.scale.set(.5, 1.4, 1); pinch.position.set(s * .05, .085, .085); acc.add(pinch); }
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(.175, .17, .008, 36), felt); brim.scale.z = 1.1; acc.add(brim);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(.109, .109, .026, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .45, side: THREE.DoubleSide })); band.position.y = .016; band.scale.z = 1.15; acc.add(band); }
    acc.rotation.set(.08, 0, -.05); at(B.Head, acc, 0, 1.77, -.012);
    h.setHat = (v) => (acc.visible = v); h.setShades = () => {}; h.setHat(o.hat ?? true);
    return h; }
  return { make, H };
}
