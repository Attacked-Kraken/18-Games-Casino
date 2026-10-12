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
  /* stitched-style number / nameplate textures */
  const numTex = (txt, w = 512, h = 256, font = 210) => tex(THREE, w, h, (g) => { g.clearRect(0, 0, w, h); g.font = `900 ${font}px "Arial Black",Impact,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; const X = w / 2, Y = h / 2 + 8;
    g.lineJoin = 'round'; g.lineWidth = font * .2; g.strokeStyle = PURPLE; g.strokeText(txt, X, Y); g.lineWidth = font * .13; g.strokeStyle = GOLD; g.strokeText(txt, X, Y); g.fillStyle = '#ffffff'; g.fillText(txt, X, Y);
    g.setLineDash([5, 5]); g.lineWidth = 2; g.strokeStyle = 'rgba(90,60,10,.8)'; g.strokeText(txt, X, Y); g.setLineDash([]); });
  const NUMT = numTex(String(NUM)), NAMET = numTex('CRUZ', 512, 128, 92), MT = tex(THREE, 128, 128, (g) => drawM(g, 64, 64, 40));
  function make() { const h = H.make({ g: 'm', skin: 3, hair: 'buzzed', hairCol: 0x1a1210, outfit: 'football' }, 2.01); const obj = h.object; obj.updateMatrixWorld(true);
    const B = {}; obj.traverse((n) => { if (n.isBone) B[n.name] = n; }); let body = null; obj.traverse((n) => { if (n.isSkinnedMesh && n.material && n.material.customProgramCacheKey && n.material.customProgramCacheKey() === 'hum2') body = n; });
    const at = (bone, mesh, x, y, z) => { obj.add(mesh); mesh.position.set(x, y, z); mesh.updateMatrixWorld(true); bone.attach(mesh); return mesh; };
    /* uniform paint + sculpted pads: everything is ON the skinned body (no loose cloth meshes, nothing can flap) */
    if (body) { const mat = body.material, prev = mat.onBeforeCompile; mat.roughness = .62;
      mat.onBeforeCompile = (sh) => { prev(sh); Object.assign(sh.uniforms, { uNum: { value: NUMT }, uName: { value: NAMET }, uM: { value: MT } });
        sh.vertexShader = sh.vertexShader.replace('vB = position;', `vB = position;
  { vec3 p = position; float ax = abs(p.x), y = p.y;
    float pad = smoothstep(1.24, 1.40, y) * (1. - smoothstep(1.50, 1.56, y)) * (1. - smoothstep(.30, .37, ax));          /* shoulder pads under the jersey */
    pad += .5 * exp(-pow((ax - .24) / .05, 2.) - pow((y - 1.43) / .05, 2.));                                            /* deltoid caps */
    float chest = smoothstep(.98, 1.10, y) * (1. - smoothstep(1.24, 1.30, y)) * (1. - smoothstep(.2, .26, ax)) * .3;
    float knee = exp(-pow((y - .55) / .05, 2.)) * step(.0, p.z) * .5;
    float pants = (y > .45 && y < .97 && ax < .27) ? .12 : 0.;
    transformed += normal * (.042 * pad + .03 * chest + .03 * knee + .01 * pants); }`);
        sh.fragmentShader = sh.fragmentShader.replace('uniform sampler2D uLogo;', `uniform sampler2D uLogo, uNum, uName, uM;
const vec3 PUR = vec3(.075,.012,.19), GLD = vec3(.88,.46,.02), WHT = vec3(.85), BLK = vec3(.012);
vec4 tx(sampler2D s, vec2 uv){ if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.) return vec4(0.); return texture2D(s, uv); }
vec4 cruzFit(vec3 p){ float ax=abs(p.x), y=p.y; vec3 c; bool arm = ax>.27 && y>1.28;
  if(arm){ if(ax<.405){ c=PUR; if(ax>.372&&ax<.384) c=GLD; else if(ax>.384&&ax<.39) c=WHT; if(ax>.398) c=PUR*.7;
      if(y>1.425){ vec4 n=tx(uNum, vec2((ax-.29)/.075, (p.z+.042)/.06)); if(p.x<0.) n=tx(uNum, vec2(1.-(ax-.29)/.075, (p.z+.042)/.06)); c=mix(c,n.rgb,n.a); }
      return vec4(c,1.); }
    if(ax>.675){ c=GLD; if(y>1.43) c=PUR; if(ax<.69) c=WHT; return vec4(c,1.); }                                            /* gloves + wrist tape */
    return vec4(0.); }
  if(y>1.97) return vec4(0.);
  if(y>.975 && y<1.56){ bool coll = y>1.49 && (p.z>0. ? y > 1.49 + 2.2*ax - .02 : y > 1.515);
    if(y>1.54 || (p.z>0. && y > 1.50 + 1.6*ax)) return vec4(0.);                                                         /* V-neck opening */
    c=PUR; if(p.z>0. && y > 1.47 + 1.6*ax) c = (y > 1.485 + 1.6*ax) ? GLD : WHT;                                           /* collar trim */
    if(p.z<0. && y>1.505 && ax<.07) c=GLD;
    if(y<1.0) c=PUR*.8;                                                                                                   /* tuck fold */
    if(p.z>0.){ vec4 n=tx(uNum, vec2(p.x/.30+.5, (y-1.10)/.19)); c=mix(c,n.rgb,n.a); vec4 m=tx(uM, vec2(p.x/.07+.5,(y-1.415)/.07)); c=mix(c,m.rgb,m.a); }
    else { vec4 n=tx(uNum, vec2(-p.x/.32+.5, (y-1.07)/.21)); c=mix(c,n.rgb,n.a); vec4 nm=tx(uName, vec2(-p.x/.26+.5, (y-1.30)/.07)); c=mix(c,nm.rgb,nm.a); }
    if(ax>.17 && ax<.2 && y<1.28 && y>1.0) c*=.85;                                                                         /* side seam */
    return vec4(c,1.); }
  if(y>.935 && y<=.975){ c=BLK*1.6; if(p.z>.08 && ax<.03) c=GLD; return vec4(c,1.); }                                    /* belt + buckle */
  if(y>.44 && y<=.935){ c=GLD; float side = ax>.1 ? abs(p.z) : 1.; if(side<.012) c=PUR; else if(side<.018) c=WHT;          /* pants with side stripe */
    float kp = exp(-pow((y-.55)/.05,2.))*step(0.,p.z); c = mix(c, c*1.08+.03, kp); if(abs(y-.505)<.004 || abs(y-.6)<.004) c *= 1.-.25*step(0.,p.z)*step(.2,kp);
    if(y<.47) c=GLD*.8; return vec4(c,1.); }
  if(y>.12 && y<=.44){ c=PUR; if(y>.36&&y<.38) c=GLD; if(y>.38&&y<.39) c=WHT; if(y<.15) c=WHT; return vec4(c,1.); }          /* socks */
  if(y<=.12){ c=BLK; if(y<.022) c=GLD*.6; if(abs(p.z-.05)<.035 && y>.05 && y<.08 && ax>.09) c=PUR*1.3; return vec4(c,1.); }  /* cleats */
  return vec4(0.); }`).replace('vec4 oc = outfit(vB);', `vec4 oc = cruzFit(vB);
  if(oc.a<.5){ vec3 q=vB; float ax=abs(q.x); if(ax>.38&&ax<.7){ float bi=exp(-pow((ax-.47)/.05,2.)), fo=exp(-pow((ax-.6)/.06,2.)); float top=smoothstep(1.40,1.46,q.y); diffuseColor.rgb*=.86+.22*(bi*top+fo*.6)+.05*sin(ax*90.); }
    if(q.y>1.66&&q.y<1.69&&ax>.022&&ax<.058&&q.z>.07) diffuseColor.rgb=vec3(.03); }`); };
      mat.customProgramCacheKey = () => 'cruz2'; mat.needsUpdate = true; }
    /* helmet: glossy shell with centre stripe + M decals, cage facemask, tinted visor, chin strap */
    const ht = tex(THREE, 1024, 512, (g, w, hh) => { g.fillStyle = PURPLE; g.fillRect(0, 0, w, hh); for (const x of [w * .25, w * .75]) { g.fillStyle = '#fff'; g.fillRect(x - 26, 0, 52, hh); g.fillStyle = GOLD; g.fillRect(x - 18, 0, 36, hh); }
      for (const x of [0, w / 2, w]) drawM(g, x, hh * .55, 62); });
    const helm = new THREE.Mesh(new THREE.SphereGeometry(.158, 40, 24, 0, Math.PI * 2, 0, Math.PI * .7), new THREE.MeshPhysicalMaterial({ map: ht, roughness: .22, metalness: .1, clearcoat: 1, clearcoatRoughness: .08 }));
    helm.scale.set(1, 1.02, 1.12); helm.rotation.x = -.28; at(B.Head, helm, 0, 1.722, -.018);
    const gm = new THREE.MeshStandardMaterial({ color: 0x9a9aa2, metalness: .85, roughness: .3 }); const bar = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, gm); m.rotation.set(rx, ry, rz); at(B.Head, m, x, y, z); };
    for (const [y, r] of [[1.672, .148], [1.635, .14], [1.6, .125]]) { const g = new THREE.TorusGeometry(r, .0075, 6, 28, Math.PI * .78); bar(g, 0, y, .012, Math.PI / 2, 0, Math.PI + Math.PI * .11); }
    for (const x of [-.045, 0, .045]) bar(new THREE.CylinderGeometry(.006, .006, .085, 6), x, 1.635, .148 - Math.abs(x) * .25);
    const vis = new THREE.Mesh(new THREE.SphereGeometry(.158, 24, 8, -Math.PI * .28, Math.PI * .56, Math.PI * .4, Math.PI * .12), new THREE.MeshPhysicalMaterial({ color: 0x20202e, transparent: true, opacity: .6, roughness: .04, metalness: .4 })); at(B.Head, vis, 0, 1.712, .0);
    for (const s of [-1, 1]) { const jaw = new THREE.Mesh(new THREE.BoxGeometry(.03, .065, .085), new THREE.MeshPhysicalMaterial({ color: PURPLE, roughness: .25, clearcoat: 1 })); jaw.rotation.y = s * .25; at(B.Head, jaw, s * .132, 1.62, .045);
      const snap = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .01, 10), gm); snap.rotation.z = Math.PI / 2; at(B.Head, snap, s * .15, 1.6, .06); }
    { const strap = new THREE.Mesh(new THREE.TorusGeometry(.09, .01, 6, 18, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: .6 })); strap.rotation.set(0, Math.PI / 2, Math.PI / 2); strap.rotation.order = 'YXZ'; at(B.Head, strap, 0, 1.585, .06); }
    /* heavy build: bone scaling */
    const S = (n, x, y = x, z = x) => B[n] && B[n].scale.set(x, y, z);
    S('spine_02', 1.06); S('spine_03', 1.1); S('neck_01', 1.12); S('Head', 1 / (1.06 * 1.1 * 1.12) * 1.04); S('clavicle_l', 1.04); S('clavicle_r', 1.04);
    for (const s of ['l', 'r']) { S('upperarm_' + s, 1, 1.2, 1.2); S('lowerarm_' + s, 1, 1.12, 1.12); S('hand_' + s, 1 / (1.06 * 1.1 * 1.04), 1 / (1.06 * 1.1 * 1.04 * 1.2 * 1.12) * 1.1, 1 / (1.06 * 1.1 * 1.04 * 1.2 * 1.12) * 1.1); S('thigh_' + s, 1, 1.16, 1.16); S('calf_' + s, 1, 1.1, 1.1); S('foot_' + s, 1, 1 / 1.276, 1 / 1.276); }
    const rig = new THREE.Group(); rig.add(obj); h.rig = rig; return h; }
  return { make, H };
}
