/* Cruz: original football quarterback NPC (6'7", 270 lb build, #12) built on Base Human v2 (CC0 Quaternius body, UAL CC0 clips).
   Bulk via bone scaling (wider chest/shoulders, thick neck/arms/thighs), procedural pads, helmet with face mask, gloves, knee pads.
   Purple + goldfish-gold palette, original "M" monogram (no real team marks). */
import { loadHumans } from './humans.js';
export const PURPLE = '#4a1478', GOLD = '#f2b51c';
export function drawM(g, cx, cy, s, fill = GOLD, edge = '#ffffff', out = PURPLE) { /* original angular "M" monogram with a split-peak */
  const pts = [[-1, .8], [-1, -.8], [-.55, -.8], [0, -.05], [.55, -.8], [1, -.8], [1, .8], [.6, .8], [.6, -.15], [.12, .5], [-.12, .5], [-.6, -.15], [-.6, .8]];
  const path = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(cx + x * s, cy + y * s) : g.moveTo(cx + x * s, cy + y * s))); g.closePath(); };
  g.lineJoin = 'miter'; path(); g.lineWidth = s * .34; g.strokeStyle = out; g.stroke(); path(); g.lineWidth = s * .16; g.strokeStyle = edge; g.stroke(); path(); g.fillStyle = fill; g.fill(); }
const tex = (THREE, w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
export async function loadCruz(THREE, base = 'characters/football-cruz/', NUM = 12) {
  const H = await loadHumans(THREE, base);
  function make() { const h = H.make({ g: 'm', skin: 3, hair: 'buzzed', hairCol: 0x1a1210, outfit: 'football' }, 2.01); const obj = h.object; obj.updateMatrixWorld(true);
    const B = {}; obj.traverse((n) => { if (n.isBone) B[n.name] = n; }); const v = new THREE.Vector3(); const k = obj.scale.x;
    const at = (bone, mesh, x, y, z) => { obj.add(mesh); mesh.position.set(x, y, z); mesh.updateMatrixWorld(true); bone.attach(mesh); return mesh; };
    const bpos = (n) => { B[n].getWorldPosition(v); return obj.worldToLocal(v.clone()); };
    const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .45, metalness: 0 }, o));
    /* jersey shell: front M + 12, back CRUZ 12, gold trim at hem / collar */
    const jt = tex(THREE, 1024, 512, (g, w, hh) => { g.fillStyle = PURPLE; g.fillRect(0, 0, w, hh); g.fillStyle = GOLD; g.fillRect(0, 0, w, 26); g.fillRect(0, hh - 34, w, 34); g.fillStyle = '#fff'; g.fillRect(0, 26, w, 8); g.fillRect(0, hh - 42, w, 8);
      drawM(g, w / 2, 200, 62); g.font = '900 150px Impact,Arial Black,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#fff';
      for (const x of [0, w]) { g.font = '900 70px Impact,Arial Black,sans-serif'; g.strokeText('CRUZ', x, 215); g.fillStyle = GOLD; g.fillText('CRUZ', x, 215); g.font = '900 175px Impact,Arial Black,sans-serif'; g.strokeText(String(NUM), x, 370); g.fillText(String(NUM), x, 370); }
      g.font = '900 120px Impact,Arial Black,sans-serif'; g.strokeText(String(NUM), w / 2, 370); g.fillStyle = GOLD; g.fillText(String(NUM), w / 2, 370); });
    const shellG = new THREE.CylinderGeometry(.205, .175, .47, 32, 1, true, Math.PI, Math.PI * 2); const shell = new THREE.Mesh(shellG, std({ map: jt, side: THREE.DoubleSide, roughness: .55 })); shell.scale.set(1.02, 1, .95);
    at(B.spine_03, shell, 0, 1.275, -.025);
    /* shoulder pads */
    const pt = tex(THREE, 512, 256, (g, w, hh) => { g.fillStyle = PURPLE; g.fillRect(0, 0, w, hh); g.fillStyle = GOLD; g.fillRect(0, hh - 40, w, 22); g.fillStyle = '#fff'; g.fillRect(0, hh - 18, w, 8); });
    const pads = new THREE.Mesh(new THREE.SphereGeometry(.27, 28, 12, 0, Math.PI * 2, 0, Math.PI * .45), std({ map: pt, roughness: .5 })); pads.scale.set(1.28, .6, 1.0); at(B.spine_03, pads, 0, 1.385, 0);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.12, 18, 10, 0, Math.PI * 2, 0, Math.PI * .55), std({ color: PURPLE })); e.scale.set(1.05, .7, 1); e.rotation.z = -s * .35; at(B.spine_03, e, s * .27, 1.43, 0);
     }
    /* helmet with M decals, centre stripe, face mask, visor */
    const ht = tex(THREE, 1024, 512, (g, w, hh) => { g.fillStyle = PURPLE; g.fillRect(0, 0, w, hh); g.fillStyle = GOLD; for (const x of [w * .25, w * .75]) g.fillRect(x - 22, 0, 44, hh); g.fillStyle = '#fff'; for (const x of [w * .25, w * .75]) { g.fillRect(x - 30, 0, 8, hh); g.fillRect(x + 22, 0, 8, hh); }
      for (const x of [0, w / 2, w]) drawM(g, x, hh * .62, 70); });
    const hc = .127 + 1.70, hr = .158; const helm = new THREE.Mesh(new THREE.SphereGeometry(hr, 32, 18, 0, Math.PI * 2, 0, Math.PI * .66), std({ map: ht, roughness: .25, metalness: .15 })); helm.scale.set(1, 1.04, 1.1); helm.rotation.x = -.2;
    at(B.Head, helm, 0, 1.715, -.012); const gm = std({ color: 0xc8c8c8, metalness: .8, roughness: .3 });
    for (const [y, rr] of [[1.665, .15], [1.625, .135]]) { const b = new THREE.Mesh(new THREE.TorusGeometry(rr, .009, 6, 24, Math.PI * .85), gm); b.rotation.set(Math.PI / 2, 0, Math.PI * .075 - Math.PI); b.scale.set(1, 1.15, 1); at(B.Head, b, 0, y, .02); }
    { const vb = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .09, 6), gm); at(B.Head, vb, 0, 1.64, .163); const vis = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 8, -Math.PI * .3, Math.PI * .6, Math.PI * .38, Math.PI * .13), new THREE.MeshPhysicalMaterial({ color: 0x1a1a2a, transparent: true, opacity: .55, roughness: .05, metalness: .3 })); at(B.Head, vis, 0, 1.70, .0); vis.rotation.y = 0; }
    for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .02, 12), std({ color: GOLD })); ear.rotation.z = Math.PI / 2; at(B.Head, ear, s * .155, 1.675, .02); }
    /* gloves, knee pads, wrist bands */
    for (const s of ['l', 'r']) { const p = bpos('hand_' + s); const gl = new THREE.Mesh(new THREE.SphereGeometry(.058, 14, 10), std({ color: GOLD, roughness: .6 })); gl.scale.set(1.5, .85, 1.1); at(B['hand_' + s], gl, p.x + Math.sign(p.x) * .06, p.y, p.z);
      const wb = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .06, 14), std({ color: 0xffffff, roughness: .8 })); wb.rotation.z = Math.PI / 2; at(B['hand_' + s], wb, p.x - Math.sign(p.x) * .03, p.y, p.z);
      const q = bpos('calf_' + s); const kp = new THREE.Mesh(new THREE.SphereGeometry(.075, 14, 10), std({ color: 0xffffff, roughness: .6 })); kp.scale.set(1, 1.1, .6); at(B['calf_' + s], kp, q.x, q.y, q.z + .06);
      const f = bpos('foot_' + s); const cl = new THREE.Mesh(new THREE.BoxGeometry(.11, .025, .26), std({ color: GOLD })); at(B['foot_' + s], cl, f.x, .012, f.z + .05); }
    /* heavy build: bone scaling (uniform cascades kept exact by compensating the head/hands) */
    const S = (n, x, y = x, z = x) => B[n] && B[n].scale.set(x, y, z);
    S('spine_02', 1.08); S('spine_03', 1.14); S('neck_01', 1.1); S('Head', 1 / (1.08 * 1.14 * 1.1) * 1.06); S('clavicle_l', 1.06); S('clavicle_r', 1.06);
    for (const s of ['l', 'r']) { S('upperarm_' + s, 1, 1.18, 1.18); S('lowerarm_' + s, 1, 1.12, 1.12); S('hand_' + s, 1 / (1.08 * 1.14 * 1.06), 1 / (1.08 * 1.14 * 1.06 * 1.18 * 1.12), 1 / (1.08 * 1.14 * 1.06 * 1.18 * 1.12)); S('thigh_' + s, 1, 1.18, 1.18); S('calf_' + s, 1, 1.1, 1.1); S('foot_' + s, 1, 1 / 1.3, 1 / 1.3); }
    /* muscle definition: darken grooves on exposed forearm skin (procedural normal-ish shading) */
    obj.traverse((n) => { if (n.isMesh && n.material && n.material.onBeforeCompile && n.material.customProgramCacheKey && n.material.customProgramCacheKey() === 'hum2') { const prev = n.material.onBeforeCompile;
      n.material.onBeforeCompile = (sh) => { prev(sh); sh.fragmentShader = sh.fragmentShader.replace('diffuseColor.rgb = mix(diffuseColor.rgb*uSkin, oc.rgb, oc.a);', `diffuseColor.rgb = mix(diffuseColor.rgb*uSkin, oc.rgb, oc.a);
  { float ax=abs(vB.x); if(oc.a<.5 && ax>.38 && ax<.72){ float m=.5+.5*sin(ax*48.)*sin(vB.z*60.+1.); diffuseColor.rgb*= .86+.2*m; } if(oc.a<.5 && vB.y>1.42 && vB.y<1.56 && ax<.08){ diffuseColor.rgb*=.9+.15*sin(vB.x*80.); } }`); };
      n.material.customProgramCacheKey = () => 'cruz'; n.material.needsUpdate = true; } });
    const rig = new THREE.Group(); rig.add(obj); h.rig = rig; return h; }
  return { make, H };
}
