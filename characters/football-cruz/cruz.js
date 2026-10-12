/* Cruz: original football quarterback NPC (6'7", 270 lb build, #12) built on Base Human v2 (CC0 Quaternius body, UAL CC0 clips).
   Bulk via bone scaling (wider chest/shoulders, thick neck/arms/thighs), procedural pads, helmet with face mask, gloves, knee pads.
   Purple + goldfish-gold palette, original "M" monogram (no real team marks). */
import { loadHumans } from './humans.js';
import { addKit } from './garment.js';
export const PURPLE = '#3a0a8c', GOLD = '#e0a81a';
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
  const NT = {}, numT = (n) => NT[n] || (NT[n] = numTex(String(n))), NMT = {}, nameT = (s) => NMT[s] || (NMT[s] = numTex(s, 512, 128, 92)), MT = tex(THREE, 128, 128, (g) => drawM(g, 64, 64, 40));
  const ENV = tex(THREE, 512, 256, (g, w, hh) => { const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#fff6e0'); gr.addColorStop(.45, '#a88a6a'); gr.addColorStop(.55, '#3a2a30'); gr.addColorStop(1, '#120a10'); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
    g.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(i * 64 + 20, 40 + (i % 2) * 20, 18, 8, 0, 0, 7); g.fill(); } }); ENV.mapping = THREE.EquirectangularReflectionMapping;
  function make(o = {}) { const NUMT = numT(o.num ?? NUM), NAMET = nameT(o.name || 'CRUZ'); const h = H.make({ g: 'm', skin: o.skin ?? 3, hair: 'buzzed', hairCol: 0x1a1210, outfit: 'football' }, o.h || 2.01); const obj = h.object; obj.updateMatrixWorld(true);
    const B = {}; obj.traverse((n) => { if (n.isBone) B[n.name] = n; }); let body = null; obj.traverse((n) => { if (n.isSkinnedMesh && n.material && n.material.customProgramCacheKey && n.material.customProgramCacheKey() === 'hum2') body = n; });
    const at = (bone, mesh, x, y, z) => { obj.add(mesh); mesh.position.set(x, y, z); mesh.updateMatrixWorld(true); bone.attach(mesh); return mesh; };
    /* uniform paint + sculpted pads: everything is ON the skinned body (no loose cloth meshes, nothing can flap) */
    if (body) { const mat = body.material, prev = mat.onBeforeCompile; mat.roughness = .55; mat.envMap = ENV; mat.envMapIntensity = .6;
      mat.onBeforeCompile = (sh) => { prev(sh); Object.assign(sh.uniforms, { uNum: { value: NUMT }, uName: { value: NAMET }, uM: { value: MT } });
        sh.vertexShader = sh.vertexShader.replace('vB = position;', `vB = position;
  { vec3 p = position; float ax = abs(p.x), y = p.y;
    float ledge = smoothstep(1.38, 1.45, y) * (1. - smoothstep(1.50, 1.535, y)) * smoothstep(.05, .12, ax) * (1. - smoothstep(.27, .31, ax));  /* squared pad ledge */
    float cap = exp(-pow((ax - .23) / .04, 2.) - pow((y - 1.44) / .045, 2.));
    float knee = exp(-pow((y - .55) / .045, 2.)) * smoothstep(0., .03, p.z);
    float thighpad = exp(-pow((y - .78) / .06, 2.)) * smoothstep(0., .04, p.z) * step(.05, ax);
    vec3 n = normal; n.y = max(n.y, 0.);
    transformed += normalize(n + vec3(0., .3, 0.)) * (.028 * ledge + .012 * cap) + normal * (.012 * knee + .006 * thighpad); }`);
        sh.fragmentShader = sh.fragmentShader.replace('uniform sampler2D uLogo;', `uniform sampler2D uLogo, uNum, uName, uM;
const vec3 PUR = vec3(.052,.006,.27), GLD = vec3(.78,.42,.01), WHT = vec3(.92), BLK = vec3(.008);
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
    if(q.y>1.672&&q.y<1.684&&ax>.028&&ax<.052&&q.z>.07) diffuseColor.rgb=vec3(.03); }
  else { vec3 q=vB; float jer = step(.975,q.y)*step(q.y,1.56); vec2 m = q.xy*vec2(260.,260.) + vec2(q.z*260.,0.); vec2 f=fract(m)-.5; float hole = smoothstep(.22,.12,length(f));     /* athletic mesh knit */
    diffuseColor.rgb *= 1. - jer*hole*.22; float pan = step(.44,q.y)*step(q.y,.935); diffuseColor.rgb *= 1. - pan*.06*step(.5,fract((q.y+q.x)*400.)); }`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
  { vec3 q=vB; if(q.y>.44&&q.y<.935&&abs(q.x)<.3) metalnessFactor=.45; }`).replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  { vec3 q=vB; float jy=step(.975,q.y)*step(q.y,1.56); float py=step(.44,q.y)*step(q.y,.935); roughnessFactor = mix(roughnessFactor, .5, jy); roughnessFactor = mix(roughnessFactor, .3, py); if(abs(q.x)>.4&&abs(q.x)<.67) roughnessFactor=.42; }`); };
      mat.customProgramCacheKey = () => 'cruz2'; mat.needsUpdate = true; }
    if (body) addKit(THREE, h, body, { NUMT, NAMET, MT, ENV });
    /* helmet v4 (Speedflex-style, original): opaque snug shell ~13% over skull, inner liner (no see-through), back ridge, ear holes, jaw flaps, attached grey cage */
    const ht = tex(THREE, 1024, 512, (g, w, hh) => { g.fillStyle = PURPLE; g.fillRect(0, 0, w, hh); for (const x of [w * .25, w * .75]) { g.fillStyle = '#fff'; g.fillRect(x - 22, 0, 44, hh); g.fillStyle = GOLD; g.fillRect(x - 15, 0, 30, hh); }
      for (const x of [0, w / 2, w]) drawM(g, x, hh * .5, 56); });
    const shellM = new THREE.MeshPhysicalMaterial({ map: ht, roughness: .14, metalness: .2, clearcoat: 1, clearcoatRoughness: .04, envMap: ENV, envMapIntensity: 1.3, transparent: false, opacity: 1, side: THREE.FrontSide });
    const flapM = shellM.clone(); flapM.map = null; flapM.color = new THREE.Color(PURPLE);
    const linerM = new THREE.MeshStandardMaterial({ color: 0x1a1420, roughness: .9, side: THREE.BackSide });
    const HC = [0, 1.716, -.012], HR = [.106, .108, .121];
    const piece = (geo, mat, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.scale.set(HR[0] / .1, HR[1] / .1, HR[2] / .1); m.rotation.x = rx; at(B.Head, m, ...HC); return m; };
    const shellG = new THREE.SphereGeometry(.1, 48, 28, 0, Math.PI * 2, 0, Math.PI * .6);
    piece(shellG, shellM, -.32); piece(shellG, linerM, -.32);
    /* lower back + side flaps (jaw guards) closing the shell down to the neck/jaw */
    const backG = new THREE.SphereGeometry(.1, 32, 10, Math.PI * 1.1, Math.PI * .8, Math.PI * .5, Math.PI * .3); piece(backG, flapM, -.32); piece(backG, linerM, -.32);
    for (const s of [-1, 1]) { const g = new THREE.SphereGeometry(.1, 14, 10, s < 0 ? -Math.PI * .1 : Math.PI * .76, Math.PI * .34, Math.PI * .5, Math.PI * .32); piece(g, flapM, -.32); piece(g, linerM, -.32);
      const ear = new THREE.Mesh(new THREE.CircleGeometry(.011, 16), new THREE.MeshBasicMaterial({ color: 0x050308 })); ear.scale.set(1.5, 1, 1); ear.rotation.y = s * Math.PI / 2; at(B.Head, ear, s * (HR[0] + .002), 1.672, -.012);
      const jp = new THREE.Mesh(new THREE.CapsuleGeometry(.012, .035, 4, 8), new THREE.MeshStandardMaterial({ color: 0x241a2c, roughness: .8 })); at(B.Head, jp, s * .088, 1.63, .045);
      const clip = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .008, 12), new THREE.MeshStandardMaterial({ color: 0xc9cbd0, metalness: .5, roughness: .3 })); clip.rotation.z = Math.PI / 2; at(B.Head, clip, s * (HR[0] + .003), 1.64, .06); }
    { const ridge = new THREE.Mesh(new THREE.TorusGeometry(.1, .006, 6, 40, Math.PI * .9), shellM); ridge.scale.set(1, HR[1] / .1 * 1.02, HR[2] / .1 * 1.02); ridge.rotation.set(-.32, Math.PI / 2, 0); at(B.Head, ridge, ...HC); }
    /* cage: grey/white bars anchored on the shell at the temples & jaw clips */
    const gm = new THREE.MeshStandardMaterial({ color: 0xcfd1d6, metalness: .35, roughness: .32 }); const bar = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, gm); m.rotation.set(rx, ry, rz); at(B.Head, m, x, y, z); return m; };
    for (const [y, r, sz] of [[1.675, .118, 1.22], [1.64, .116, 1.24], [1.605, .106, 1.28]]) { const a = bar(new THREE.TorusGeometry(r, .0062, 8, 36, Math.PI * .86), 0, y, .004, Math.PI / 2, 0, Math.PI * .07); a.scale.set(1, sz, 1); }
    for (const x of [-.05, 0, .05]) bar(new THREE.CylinderGeometry(.0056, .0056, .075, 8), x, 1.64, x ? .136 : .146);
    { const cup = new THREE.Mesh(new THREE.CapsuleGeometry(.016, .022, 4, 10), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: .5 })); cup.rotation.z = Math.PI / 2; at(B.Head, cup, 0, 1.6, .092); }
    for (const s of [-1, 1]) { const post = bar(new THREE.CylinderGeometry(.006, .006, .075, 8), s * .112, 1.64, .03); post.rotation.x = .1; }

    /* Riddell-style details: top vents, clear cage clips, chin strap with buckles, rear bumper */
    { const rx = -.32, ell = (th, ph, k = 1) => { const v = new THREE.Vector3(Math.sin(th) * Math.sin(ph) * HR[0] * k, Math.cos(th) * HR[1] * k, Math.sin(th) * Math.cos(ph) * HR[2] * k); v.applyAxisAngle(new THREE.Vector3(1, 0, 0), rx); return v.add(new THREE.Vector3(...HC)); };
      const vm = new THREE.MeshStandardMaterial({ color: 0x08060c, roughness: .8 });
      for (const [th, ph] of [[.42, .32], [.42, -.32], [.62, .55], [.62, -.55], [.55, 2.9], [.55, -2.9]]) { const v = new THREE.Mesh(new THREE.CapsuleGeometry(.0055, .022, 3, 8), vm); const p = ell(th, ph, 1.005); v.lookAt(p.clone().sub(new THREE.Vector3(...HC)).add(p)); v.rotateX(Math.PI / 2); at(B.Head, v, p.x, p.y, p.z); }
      const clipM = new THREE.MeshPhysicalMaterial({ color: 0xe8eef2, roughness: .15, transmission: 0, clearcoat: 1, metalness: 0 });
      for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.016, .012, .01), clipM); at(B.Head, c, s * .07, 1.726, .093); }
      const strapM = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: .7 }), bkM = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: .8, roughness: .3 });
      for (const s of [-1, 1]) for (const [a, b, c] of [[[s * .108, 1.648, -.01], [s * .085, 1.6, .05], [s * .03, 1.585, .095]], [[s * .1, 1.67, .06], [s * .08, 1.62, .085], [s * .03, 1.6, .1]]]) {
        const cur = new THREE.CatmullRomCurve3([a, b, c].map((q) => new THREE.Vector3(...q))); const tb = new THREE.Mesh(new THREE.TubeGeometry(cur, 10, .0035, 5), strapM); tb.scale.set(1, 1, 1); obj.add(tb); tb.updateMatrixWorld(true); B.Head.attach(tb);
        const bk = new THREE.Mesh(new THREE.BoxGeometry(.012, .012, .004), bkM); const m = cur.getPoint(.45); bk.lookAt(m.clone().add(new THREE.Vector3(s, 0, .3))); at(B.Head, bk, m.x + s * .003, m.y, m.z); }
      { const bump = new THREE.Mesh(new THREE.TorusGeometry(.1, .007, 6, 20, Math.PI * .5), new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: .5 })); bump.scale.set(HR[0] / .1 * 1.03, 1, HR[2] / .1 * 1.03); bump.rotation.set(Math.PI / 2, 0, Math.PI * 1.25); at(B.Head, bump, 0, 1.635, -.012); } }
    /* heavy build: bone scaling */
    const S = (n, x, y = x, z = x) => B[n] && B[n].scale.set(x, y, z);
    S('spine_03', 1.06); S('neck_01', 1.1); S('Head', 1 / (1.06 * 1.1)); S('clavicle_l', 1.07); S('clavicle_r', 1.07);
    for (const s of ['l', 'r']) { S('upperarm_' + s, 1, 1.17, 1.17); S('lowerarm_' + s, 1, 1.07, 1.07); S('hand_' + s, 1 / (1.06 * 1.07), 1 / (1.06 * 1.07 * 1.17 * 1.07) * 1.05, 1 / (1.06 * 1.07 * 1.17 * 1.07) * 1.05); S('thigh_' + s, 1, 1.07, 1.07); S('calf_' + s, 1, 1.12, 1.12); S('foot_' + s, 1, 1 / (1.07 * 1.12), 1 / (1.07 * 1.12)); }
    const rig = new THREE.Group(); rig.add(obj); h.rig = rig; return h; }
  return { make, H };
}
