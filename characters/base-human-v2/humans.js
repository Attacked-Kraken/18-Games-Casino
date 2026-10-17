/* Base Human v2: CC0 Quaternius male + female bodies (faces, eyes, brows) on the Universal Animation Library rig,
   with modular, original outfits painted by a bind-pose region shader + swappable add-on meshes (hair, skirts, hood,
   bandana, jacket collar). Usage:
     const H = await loadHumans(THREE, base);         // base = folder URL of this directory
     const h = H.make(spec, heightMeters);            // spec = H.randomSpec('f', rnd) or a saved avatar spec
     h.object (Object3D), h.mixer, h.play(name)       // clips: H.clipNames
   Spec: { g:'m'|'f', skin:0-5, hair:style id, hairCol:hex, outfit:id, cols:{top,bottom,jacket,shoes} (optional overrides) } */
import { GLTFLoader } from '../../vendor/GLTFLoader.js';
import * as SkeletonUtils from '../../vendor/SkeletonUtils.js';

export const SKINS = [[1.04, 1, .97], [.95, .84, .76], [.84, .68, .56], [.66, .5, .38], [.5, .36, .27], [.38, .27, .2]];
export const HAIR_COLS = [0x1a1210, 0x2e1c12, 0x5a3a1e, 0x8a5a2e, 0xc8a060, 0xe8d0a0, 0x7a2a14, 0x9a9a9a, 0x3a1a4a];
export const HAIR = { m: ['parted', 'buzzed', 'parted_beard', 'buzzed_beard', 'bald_beard', 'long', 'curly', 'quiff'], f: ['long', 'buns', 'buzzedf', 'parted', 'long', 'bob', 'ponytail', 'curly'] };
/* real CC0 Quaternius hair meshes (Universal Base Characters, skinned to the same rig); others fall back to built shapes */
const REAL_HAIR = { parted: ['simpleparted'], buzzed: ['buzzed'], parted_beard: ['simpleparted', 'beard'], buzzed_beard: ['buzzed', 'beard'], bald_beard: ['beard'], long: ['long'], buns: ['buns'], buzzedf: ['buzzedfemale'], short: ['simpleparted'], buzz: ['buzzed'], bun: ['buns'] };
/* top: 0 plain tee, 1 graphic tee (logo), 2 button-up (plaid), 3 hoodie, 4 tracksuit top (stripes), 5 dress shirt, 6 tank/straps
   sleeves: 0 none, 1 short, 2 long. bottom: 0 trousers, 1 jeans, 2 skirt, 3 dress (top colour continues), 4 track pants, 5 shorts. shoes: 0 sneakers, 1 dress shoes, 2 heels */
export const OUTFITS = {
  m: {
    tee_jeans:      { name: 'Graphic tee + jeans', set: 'casual', top: 1, sleeves: 1, bottom: 1, shoes: 0, cols: { top: [0x111114, 0xe8e2d6, 0x8a1a2a, 0x1d4a6a], bottom: [0x2a3a5a, 0x1a2234], shoes: [0xf2f2f2, 0x222222] } },
    buttonup:       { name: 'Plaid button-up + chinos', set: 'casual', top: 2, sleeves: 2, bottom: 0, shoes: 0, cols: { top: [0x8a1a1a, 0x1d4a2a, 0x2a3a6a], bottom: [0xb8a07a, 0x3a3a3a], shoes: [0x5a3a1e, 0xf2f2f2] } },
    denimjacket:    { name: 'Denim jacket + tee', set: 'casual', top: 0, sleeves: 2, jacket: 'denim', bottom: 0, shoes: 0, cols: { top: [0xe8e2d6, 0x111114], jacket: [0x3a5a8a], bottom: [0x1a1a1e, 0x5a4a3a], shoes: [0xf2f2f2] } },
    hoodie:         { name: 'Hoodie + joggers', set: 'casual', top: 3, sleeves: 2, hood: 1, bottom: 0, shoes: 0, cols: { top: [0x4a4a52, 0x1a2a4a, 0x7a1a2a, 0x2a4a2a], bottom: [0x222226, 0x4a4a52], shoes: [0xf2f2f2, 0x111111] } },
    blazer:         { name: 'Blazer + dress shirt', set: 'evening', top: 5, sleeves: 2, jacket: 'blazer', bottom: 0, shoes: 1, cols: { top: [0xf2f0ea, 0xbcd0e8], jacket: [0x141418, 0x1a2238, 0x3a1a1a], bottom: [0x141418, 0x1a2238], shoes: [0x111111] } },
    suit_open:      { name: 'Evening suit, open collar', set: 'evening', top: 5, sleeves: 2, jacket: 'blazer', bottom: 0, shoes: 1, cols: { top: [0x111114], jacket: [0x5a0f1c, 0x2a2a2e], bottom: [0x111114], shoes: [0x111111] } },
    track_purple:   { name: 'VV purple tracksuit', set: 'street', top: 4, sleeves: 2, hood: 1, bottom: 4, shoes: 0, bandana: 1, cols: { top: [0x5a1a8a], bottom: [0x5a1a8a], shoes: [0xf2f2f2], acc: [0x7a2aaa] } },
    dealer:         { name: 'Casino dealer', set: 'staff', top: 5, sleeves: 2, jacket: 'vest', bottom: 0, shoes: 1, cols: { top: [0xf4f2ec], jacket: [0x111114], bottom: [0x111114], shoes: [0x111111] } },
    vest_street:    { name: 'VV vest + hoodie', set: 'street', top: 3, sleeves: 2, jacket: 'vest', bottom: 1, shoes: 0, bandana: 1, cols: { top: [0x4a1a7a], jacket: [0x111114], bottom: [0x1a1a22], shoes: [0x6a2aaa], acc: [0x6a2aaa] } },
    baseball_kit:   { name: 'Baseball uniform', set: 'sport', top: 1, sleeves: 1, bottom: 0, shoes: 0, cols: { top: [0x1e3fae, 0xb3122e], bottom: [0xe8e8e8], shoes: [0x222222] } },
    soccer_kit:     { name: 'Soccer kit', set: 'sport', top: 1, sleeves: 1, bottom: 5, shoes: 0, cols: { top: [0xff7a1a, 0x19b8ff], bottom: [0x161616, 0xf2f2f2], shoes: [0xffffff, 0x111111] } },
    track_kit:      { name: 'Track singlet', set: 'sport', top: 6, sleeves: 0, bottom: 5, shoes: 0, cols: { top: [0xd23c3c, 0x2456a8], bottom: [0x14141c, 0xf2f2f2], shoes: [0xffffff] } } },
  f: {
    tee_jeans:      { name: 'Graphic tee + jeans', set: 'casual', top: 1, sleeves: 1, bottom: 1, shoes: 0, cols: { top: [0xf2ede4, 0x111114, 0xd06a8a], bottom: [0x2a3a5a, 0x5a7aa0], shoes: [0xf2f2f2] } },
    denimjacket:    { name: 'Denim jacket + skirt', set: 'casual', top: 0, sleeves: 2, jacket: 'denim', bottom: 2, shoes: 0, cols: { top: [0xf2ede4], jacket: [0x5a7aa0], bottom: [0x111114, 0x8a1a2a], shoes: [0xf2f2f2] } },
    hoodie:         { name: 'Hoodie + leggings', set: 'casual', top: 3, sleeves: 2, hood: 1, bottom: 0, shoes: 0, cols: { top: [0xd8a0b0, 0x8aa0c8, 0x4a4a52], bottom: [0x111114], shoes: [0xf2f2f2] } },
    cocktail:       { name: 'Cocktail dress', set: 'evening', top: 6, sleeves: 0, bottom: 3, shoes: 2, cols: { top: [0x8a0a1e, 0x111114, 0x1a2a6a, 0x0f4a3a, 0xc8a050], shoes: [0x111111, 0xc8a050] } },
    skirt_top:      { name: 'Silk top + skirt', set: 'evening', top: 5, sleeves: 1, bottom: 2, shoes: 2, cols: { top: [0xf2f0ea, 0xe8c8a8, 0x5a1a4a], bottom: [0x111114, 0x2a2a3a], shoes: [0x111111] } },
    blazer:         { name: 'Blazer + trousers', set: 'evening', top: 6, sleeves: 0, jacket: 'blazer', bottom: 0, shoes: 2, cols: { top: [0x111114], jacket: [0xe8e2d6, 0x1a1a1e, 0x8a1a2a], bottom: [0x111114, 0xe8e2d6], shoes: [0x111111] } },
    track_purple:   { name: 'VV purple tracksuit', set: 'street', top: 4, sleeves: 2, hood: 1, bottom: 4, shoes: 0, bandana: 1, cols: { top: [0x5a1a8a], bottom: [0x5a1a8a], shoes: [0xf2f2f2], acc: [0x7a2aaa] } },
    dealer:         { name: 'Casino dealer', set: 'staff', top: 5, sleeves: 2, jacket: 'vest', bottom: 0, shoes: 1, cols: { top: [0xf4f2ec], jacket: [0x111114], bottom: [0x111114], shoes: [0x111111] } },
    vest_street:    { name: 'VV vest + crop hoodie', set: 'street', top: 3, sleeves: 2, jacket: 'vest', bottom: 1, shoes: 0, bandana: 1, cols: { top: [0x6a2aaa], jacket: [0x111114], bottom: [0x1a1a22], shoes: [0x6a2aaa], acc: [0x6a2aaa] } },
    baseball_kit:   { name: 'Baseball uniform', set: 'sport', top: 1, sleeves: 1, bottom: 0, shoes: 0, cols: { top: [0x1e3fae, 0xb3122e], bottom: [0xe8e8e8], shoes: [0x222222] } },
    soccer_kit:     { name: 'Soccer kit', set: 'sport', top: 1, sleeves: 1, bottom: 5, shoes: 0, cols: { top: [0xff7a1a, 0x19b8ff], bottom: [0x161616, 0xf2f2f2], shoes: [0xffffff, 0x111111] } },
    track_kit:      { name: 'Track singlet', set: 'sport', top: 6, sleeves: 0, bottom: 5, shoes: 0, cols: { top: [0xd23c3c, 0x2456a8], bottom: [0x14141c, 0xf2f2f2], shoes: [0xffffff] } } } };
/* landmarks of the bind pose (metres, T-pose, facing +z) */
const LM = { m: { neck: 1.535, chest: 1.36, waist: 1.0, hip: .93, knee: .55, ankle: .11, sleeveS: .36, sleeveL: .68, shoulder: .2, headC: 1.70, headTop: 1.81, headR: .115 },
             f: { neck: 1.50, chest: 1.32, waist: .99, hip: .91, knee: .54, ankle: .10, sleeveS: .32, sleeveL: .62, shoulder: .15, headC: 1.665, headTop: 1.77, headR: .108 } };
/* our own made-up streetwear logo: "VV" (Velvet Vibes) crown monogram */
function logoTex(THREE) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#ffd34a'; g.beginPath(); [[60, 80], [88, 40], [112, 76], [128, 30], [144, 76], [168, 40], [196, 80]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineTo(196, 96); g.lineTo(60, 96); g.fill();
  g.font = '900 120px Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = '#000'; g.strokeText('VV', 128, 168); g.fillStyle = '#fff'; g.fillText('VV', 128, 168);
  g.font = '800 22px system-ui'; g.fillStyle = '#ffd34a'; g.fillText('VELVET VIBES', 128, 236); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

export async function loadHumans(THREE, base = 'characters/base-human-v2/') {
  const L = new GLTFLoader(); const [m, f, a] = await Promise.all(['male', 'female', 'anims'].map((n) => L.loadAsync(base + n + '.glb')));
  const clips = {}; a.animations.forEach((c) => (clips[c.name] = c));
  const hairSrc = {}; await Promise.all(['simpleparted', 'buzzed', 'buzzedfemale', 'beard', 'long', 'buns'].map((n) => L.loadAsync(base + 'hair/hair_' + n + '.glb').then((g) => { g.scene.traverse((o) => { if (o.isSkinnedMesh) hairSrc[n] = o; }); }).catch(() => {})));
  function realHair(obj, body, names, hc) { const bones = {}; obj.traverse((b) => { if (b.isBone) bones[b.name] = b; }); let ok = false;
    names.forEach((n) => { const s = hairSrc[n]; if (!s) return; const sk = new THREE.Skeleton(s.skeleton.bones.map((b) => bones[b.name] || bones.Head), s.skeleton.boneInverses); const m = new THREE.SkinnedMesh(s.geometry, new THREE.MeshStandardMaterial({ map: s.material.map, color: hc, roughness: .6, metalness: 0, side: THREE.DoubleSide })); m.frustumCulled = false; body.parent.add(m); m.bind(sk, body.bindMatrix); ok = true; }); return ok; } const LOGO = logoTex(THREE); const src = { m: m.scene, f: f.scene };
  const col = (h) => new THREE.Color(h);
  function bodyMat(orig, g, o, cols, skin) { const mat = new THREE.MeshStandardMaterial({ map: orig.map, roughness: .7, metalness: 0 }); const lm = LM[g];
    const U = { uSkin: { value: new THREE.Vector3(...SKINS[skin]) }, uTop: { value: col(cols.top) }, uBot: { value: col(cols.bottom) }, uJak: { value: col(cols.jacket ?? cols.top) }, uShoe: { value: col(cols.shoes) },
      uCfg: { value: new THREE.Vector4(o.top, o.sleeves, o.bottom, o.shoes) }, uJ: { value: { none: 0, denim: 1, blazer: 2, vest: 3 }[o.jacket || 'none'] }, uLogo: { value: LOGO },
      uL1: { value: new THREE.Vector4(lm.neck, lm.chest, lm.waist, lm.hip) }, uL2: { value: new THREE.Vector4(lm.knee, lm.ankle, lm.sleeveS, lm.sleeveL) }, uSh: { value: lm.shoulder }, uScalp: { value: 0 }, uHair: { value: new THREE.Color(0x2e1c12) }, uHd: { value: new THREE.Vector4(lm.headC, lm.headR, 0, 0) } };
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vB;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvB = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vB; uniform vec3 uSkin,uTop,uBot,uJak,uShoe; uniform vec4 uCfg,uL1,uL2; uniform float uJ,uSh,uScalp; uniform vec3 uHair; uniform vec4 uHd; uniform sampler2D uLogo;
float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec4 outfit(vec3 p){ float ax=abs(p.x); float neck=uL1.x,chest=uL1.y,waist=uL1.z,hip=uL1.w,knee=uL2.x,ankle=uL2.y,sS=uL2.z,sL=uL2.w;
  float top=uCfg.x,slv=uCfg.y,bot=uCfg.z,sho=uCfg.w; bool arm = ax>uSh+.07 && p.y>chest-.08; vec3 c=vec3(0.); float a=0.;
  if(p.y<ankle+.02 && !arm){ c=uShoe; a=1.; if(sho<.5 && p.y<.035) c=vec3(.95); if(sho>1.5 && p.y>.06) { a=0.; } return vec4(c,a);} 
  bool torso = !arm && p.y<(ax>.075 ? neck+.06 : neck-.03) && p.y>waist-.02; bool legs = !arm && p.y<=waist-.02;
  if(arm){ float lim = slv<.5 ? 0. : slv<1.5 ? sS : sL; if(ax<lim){ c = uJ>.5 && uJ<2.5 ? uJak : uTop; a=1.; if(top>3.5&&top<4.5&&abs(p.z+.01)<.012) c=vec3(.95);} }
  if(torso){ c=uTop; a=1.;
    if(top>5.5){ if(p.y>chest+.06 && abs(ax-.1)>.014) a=0.; }                                   /* straps / bodice */
    if(top>1.5&&top<2.5){ float s=step(.5,fract(p.x*28.))*.5+step(.5,fract(p.y*28.))*.5; c=mix(c,c*0.55+vec3(.05),s*.6); }   /* plaid */
    if(top>0.5&&top<1.5&&p.z>0.&&abs(p.x)<.11&&p.y>chest-.12&&p.y<chest+.1){ vec4 l=texture2D(uLogo,vec2(p.x/.22+.5,(p.y-chest+.12)/.22)); c=mix(c,l.rgb,l.a); }
    if((top>2.5&&top<4.5)&&p.z>0.&&abs(p.x)<.07&&p.y>chest-.04&&p.y<chest+.1){ vec4 l=texture2D(uLogo,vec2(p.x/.14+.5,(p.y-chest+.04)/.14)); c=mix(c,l.rgb,l.a); }
    if(top>4.5&&top<5.5&&p.z>0.&&ax<.006) c*=.7;                                          /* placket */
    if(uJ>.5){ bool v = p.z>0. && ax < .09*(p.y-waist)/(neck-waist) + .015 && uJ<2.5; if(!v){ c=uJak; if(uJ>2.5&&p.z>0.&&ax<.03) c=uTop; } }
    if(uJ>.5&&uJ<1.5){ float n=hsh(floor(p.xy*400.)); c*=.9+.12*n; } }
  if(legs){ bool skirt = bot>1.5&&bot<3.5; float end = skirt ? (bot>2.5 ? knee+.12 : knee+.04) : (bot>4.5 ? (hip+knee)*.5+.02 : ankle+.02);
    if(p.y>end){ c = bot>2.5&&bot<3.5 ? uTop : uBot; a=1.; if(bot>0.5&&bot<1.5){ float n=hsh(floor(p.xy*500.)); c*=.85+.25*n; } if(bot>3.5&&abs(abs(p.x)-.11)>.07&&abs(p.z)<.02) c=vec3(.95); }
    if(bot>3.5 && p.y>end && abs(p.z+.03)<.01) c=vec3(.95); }
  return vec4(c,a); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
vec4 oc = outfit(vB); diffuseColor.rgb = mix(diffuseColor.rgb*uSkin, oc.rgb, oc.a);
  if(uScalp>.5){ vec3 q=vB-vec3(0.,uHd.x,0.); float r=uHd.y; bool sc = q.y > r*.62 || (q.z < -r*.05 && q.y > -r*.55) || (q.z < r*.3 && q.y > r*.1 && abs(q.x) > r*.55); if(q.y > -r*.6 && sc) diffuseColor.rgb = uHair*(.8+.2*fract(sin(dot(floor(vB.xy*900.),vec2(12.9,78.2)))*43758.)); }`); };
    mat.customProgramCacheKey = () => 'hum2'; mat.userData.U = U; return mat; }
  function hairMesh(style, g, hc) { const lm = LM[g], mat = new THREE.MeshStandardMaterial({ color: hc, roughness: .55, metalness: .05 }), grp = new THREE.Group(), R = lm.headR;
    const cap = (s = 1.06, cov = .52, back = .02) => { const m = new THREE.Mesh(new THREE.SphereGeometry(R * s * 1.08, 18, 12, 0, Math.PI * 2, 0, Math.PI * (cov + .08)), mat); m.rotation.x = -.5; m.position.set(0, .004, -back - .012); m.scale.set(1, 1, 1.06); return m; };
    const add = (m, x, y, z) => { m.position.set(x, y, z); grp.add(m); return m; };
    if (style === 'bald') return null;
    if (style === 'buzz') grp.add(cap(1.02, .5)); else if (style === 'short' || style === 'pixie') grp.add(cap(1.07, .5)); else if (style === 'quiff') { grp.add(cap(1.06, .5)); add(new THREE.Mesh(new THREE.SphereGeometry(R * .55, 12, 8), mat), 0, R * .78, R * .45).scale.set(1.2, .6, .8); }
    else if (style === 'curly') { grp.add(cap(1.1, .55)); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; add(new THREE.Mesh(new THREE.SphereGeometry(R * .32, 8, 6), mat), Math.cos(a) * R * .9, R * .45 + (i % 2) * R * .2, Math.sin(a) * R * .9 - R * .1); } }
    else { grp.add(cap(1.08, .54)); if (style === 'long' || style === 'bob') { const len = style === 'long' ? (g === 'f' ? .34 : .22) : .14; const back = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * (style === 'long' ? 1.25 : 1.1), len, 18, 1, true, Math.PI * .4, Math.PI * 1.2), mat); back.material.side = THREE.DoubleSide; add(back, 0, -len / 2 + R * .3, -R * .1); }
      if (style === 'bun') add(new THREE.Mesh(new THREE.SphereGeometry(R * .45, 12, 8), mat), 0, R * .85, -R * .75);
      if (style === 'ponytail') { add(new THREE.Mesh(new THREE.SphereGeometry(R * .3, 10, 8), mat), 0, R * .55, -R * 1.0); const t = add(new THREE.Mesh(new THREE.CapsuleGeometry(R * .22, R * 1.8, 4, 8), mat), 0, -R * .5, -R * 1.25); t.rotation.x = .25; } }
    return grp; }
  function make(spec, h = 1.72) { const g = spec.g === 'f' ? 'f' : 'm', o = OUTFITS[g][spec.outfit] || Object.values(OUTFITS[g])[0], lm = LM[g];
    const pick = (k, i) => { const v = (spec.cols && spec.cols[k] != null) ? spec.cols[k] : o.cols[k] ? o.cols[k][(i ?? spec.ci ?? 0) % o.cols[k].length] : undefined; return v; };
    const cols = { top: pick('top'), bottom: pick('bottom') ?? pick('top'), jacket: pick('jacket'), shoes: pick('shoes') ?? 0x222222, acc: pick('acc') ?? 0x6a2aaa };
    let bodyMesh = null; const obj = SkeletonUtils.clone(src[g]); const k = h / (g === 'f' ? 1.767 : 1.81); obj.scale.setScalar(k); obj.updateMatrixWorld(true); let head = null, pelvis = null, neck = null;
    obj.traverse((n) => { if (n.isBone) { if (n.name === 'Head') head = n; if (n.name === 'pelvis') pelvis = n; if (n.name === 'neck_01') neck = n; }
      if (n.isMesh) { n.frustumCulled = false; if (/Eyebrow|^Face$/i.test(n.name) || (n.material && /Hair/.test(n.material.name))) n.material = new THREE.MeshStandardMaterial({ map: n.material.map, color: spec.hairCol ?? 0x2e1c12, transparent: true, alphaTest: .3 });
        else if (n.material && /Superhero|SuperHero/i.test(n.material.name)) { n.material = bodyMat(n.material, g, o, cols, spec.skin ?? 1); bodyMesh = n; } } });
    const attach = (bone, mesh, wx, wy, wz) => { if (!bone || !mesh) return; obj.add(mesh); mesh.position.set(wx, wy, wz); mesh.updateMatrixWorld(true); bone.attach(mesh); };
    const hs = spec.hair || HAIR[g][0]; const used = bodyMesh && REAL_HAIR[hs] && !o.helmet && realHair(obj, bodyMesh, REAL_HAIR[hs], spec.hairCol ?? 0x2e1c12);
    if (bodyMesh && !o.helmet && hs !== 'bald_beard' && hs !== 'bald') { const U = bodyMesh.material.userData.U; if (U) { U.uScalp.value = 1; U.uHair.value.set(spec.hairCol ?? 0x2e1c12).multiplyScalar(.85); } }
    if (!used && !o.helmet) { const hair = hairMesh(hs, g, spec.hairCol ?? 0x2e1c12); if (hair) attach(head, hair, 0, lm.headC, -.01); }
    if (o.bandana) { const b = new THREE.Mesh(new THREE.TorusGeometry(lm.headR * 1.08, .016, 6, 24), new THREE.MeshStandardMaterial({ color: cols.acc, roughness: .6 })); b.rotation.x = Math.PI / 2 - .3; attach(head, b, 0, lm.headC + .035, -.01); }
    if (o.hood) { const hd = new THREE.Mesh(new THREE.TorusGeometry(.1, .04, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: cols.top, roughness: .8 })); hd.rotation.set(Math.PI / 2 + .3, 0, Math.PI); attach(neck, hd, 0, lm.neck - .02, -.07); }
    if (o.bottom === 2 || o.bottom === 3) { const len = o.bottom === 3 ? (lm.waist - lm.knee - .1) : (lm.waist - lm.knee - .03); const sk = new THREE.Mesh(new THREE.CylinderGeometry(.17, .25, len, 20, 1, true), new THREE.MeshStandardMaterial({ color: o.bottom === 3 ? cols.top : cols.bottom, roughness: o.bottom === 3 ? .35 : .7, side: THREE.DoubleSide })); attach(pelvis, sk, 0, lm.waist - len / 2 - .01, -.03); }
    if (o.jacket === 'blazer' || o.jacket === 'denim') { const cl = new THREE.Mesh(new THREE.TorusGeometry(.075, .018, 6, 14, Math.PI * 1.3), new THREE.MeshStandardMaterial({ color: cols.jacket, roughness: .6 })); cl.rotation.set(Math.PI / 2, 0, Math.PI * 1.15 - Math.PI); attach(neck, cl, 0, lm.neck - .05, -.035); }
    const mixer = new THREE.AnimationMixer(obj); const r = { object: obj, mixer, act: null, clip: '', spec, ts: 1 };
    r.play = (name, fade = .3, once) => { if (r.clip === name || !clips[name]) return; const a = mixer.clipAction(clips[name]); a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = !!once; a.timeScale = r.ts;
      if (r.act) r.act.crossFadeTo(a, fade, false); a.play(); r.act = a; r.clip = name; };
    return r; }
  function randomSpec(g, rnd = Math.random, set) { const ids = Object.keys(OUTFITS[g]).filter((k) => set ? OUTFITS[g][k].set === set : OUTFITS[g][k].set !== 'staff'); return { g, skin: Math.floor(rnd() * SKINS.length), hair: HAIR[g][Math.floor(rnd() * HAIR[g].length)], hairCol: HAIR_COLS[Math.floor(rnd() * (rnd() < .15 ? HAIR_COLS.length : 7))], outfit: ids[Math.floor(rnd() * ids.length)], ci: Math.floor(rnd() * 5) }; }
  return { make, randomSpec, clipNames: Object.keys(clips), OUTFITS, HAIR, HAIR_COLS, SKINS }; }
