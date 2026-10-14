/* 27Hoops PREVIEW: real CC0 Quaternius body (Universal Base Characters "SuperHero_Male", same file as Ringside) in an original
   basketball kit, driven by the game's own 17-bone poses via world-space retargeting. No game files touched. */
import { THREE, hskeleton } from './gfx.js';
import { GLTFLoader } from './GLTFLoader.js';
import * as SkeletonUtils from './SkeletonUtils.js';
/* game joint -> Quaternius bone; unlisted bones inherit the nearest mapped game joint's rotation */
const MAP = { pelvis: 'hips', spine_01: 'spine', spine_02: 'chest', spine_03: 'chest', neck_01: 'neck', Head: 'head',
  clavicle_l: 'chest', upperarm_l: 'shL', lowerarm_l: 'elL', hand_l: 'elL', clavicle_r: 'chest', upperarm_r: 'shR', lowerarm_r: 'elR', hand_r: 'elR',
  thigh_l: 'hipL', calf_l: 'knL', foot_l: 'ftL', ball_l: 'ftL', thigh_r: 'hipR', calf_r: 'knR', foot_r: 'ftR', ball_r: 'ftR' };
function numTex(u, num, nm) { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = u.jersey; g.fillRect(0, 0, 1024, 512); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  /* u=0.5 is the front (+z), u=0/1 the back */
  const word = (u.word || 'APEX').toUpperCase(); g.font = 'italic 900 64px "Arial Black",system-ui';
  [...word].forEach((ch, i) => { const k = i - (word.length - 1) / 2; g.save(); g.translate(512 + k * 46, 150 + k * k * 4); g.rotate(k * 0.08); g.lineWidth = 10; g.strokeStyle = u.trim; g.strokeText(ch, 0, 0); g.fillStyle = u.num; g.fillText(ch, 0, 0); g.restore(); });
  g.font = '900 140px "Arial Black",system-ui'; g.lineWidth = 18; g.strokeStyle = u.trim; g.strokeText(String(num), 512, 290); g.fillStyle = u.num; g.fillText(String(num), 512, 290);
  for (const x of [0, 1024]) { g.font = '900 54px system-ui'; g.fillStyle = u.num; g.fillText(nm.toUpperCase(), x, 120); g.font = '900 190px "Arial Black",system-ui'; g.lineWidth = 20; g.strokeText(String(num), x, 290); g.fillText(String(num), x, 290); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
const lin = (h) => new THREE.Color(h), BASE = new THREE.Color('#e3b9a0');
function kitMat(orig, u, p) {
  const sk = lin(p.skinHex || '#7a4e30'), mul = new THREE.Vector3(sk.r / BASE.r, sk.g / BASE.g, sk.b / BASE.b);
  const m = new THREE.MeshPhysicalMaterial({ map: orig.map, roughness: 0.5, sheen: 0.25, sheenRoughness: 0.6, sheenColor: sk.clone().offsetHSL(0, -0.1, 0.12), clearcoat: 0.1 });
  const U = { uSkin: { value: mul }, uJ: { value: lin(u.jersey) }, uTrim: { value: lin(u.trim) }, uSide: { value: lin(u.side) }, uSh: { value: lin(u.shorts) }, uShoe: { value: lin(u.shoe) }, uSock: { value: lin(u.sock) },
    uHair: { value: lin('#120c0a') }, uBand: { value: lin(u.trim) }, uNum: { value: numTex(u, p.num, p.last) } };
  m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vB;').replace('#include <begin_vertex>', `#include <begin_vertex>
vB = position; { vec3 p = position; float ax = abs(p.x), y = p.y, m = 0.;
  m += exp(-pow((ax-.10)/.07,2.)-pow((y-1.35)/.06,2.)) * step(0.,p.z) * .8;  m += exp(-pow((ax-.24)/.06,2.)-pow((y-1.43)/.07,2.)) * 1.2;
  m += smoothstep(.27,.33,ax)*smoothstep(.56,.47,ax)*smoothstep(.13,.02,abs(y-1.42)) * .9; m += smoothstep(.56,.68,y)*smoothstep(.95,.84,y) * .7; m += exp(-pow((y-.40)/.08,2.)) * step(p.z,.02) * .8;
  float sho = smoothstep(.5,.58,y)*smoothstep(1.08,1.0,y)*(1.-step(.27,ax)*step(1.28,y));          /* loose shorts */
  float jer = smoothstep(1.0,1.06,y)*smoothstep(1.5,1.4,y)*(1.-step(.2,ax)*step(1.3,y));          /* jersey sits off the skin */
  transformed += objectNormal * (m * .014 + sho * .06 + jer * .014); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vB; uniform vec3 uSkin,uJ,uTrim,uSide,uSh,uShoe,uSock,uHair,uBand; uniform sampler2D uNum;
vec4 kit(vec3 p){ float ax=abs(p.x); bool arm = ax>.2 && p.y>1.28; float u=atan(p.x,p.z)/6.2831853+.5;
  if(arm && ax>.62 && ax<.68 && p.x<0.) return vec4(uTrim,1.);                                            /* wristband, shooting hand */
  if(arm) return vec4(0.);
  if(p.y<.02) return vec4(vec3(.12),1.);                                                                  /* outsole */
  if(p.y<.05) return vec4(vec3(.95),1.);                                                                  /* midsole */
  if(p.y<.17){ vec3 c=uShoe; if(abs(p.y-.1+ (p.z)*.25)<.012 && ax>.04) c=uSide; if(p.z>.1 && p.y<.09) c=vec3(.95); return vec4(c,1.); }   /* high-top + side swoop-free bolt stripe + toe */
  if(p.y<.30){ vec3 c=uSock; if(abs(p.y-.27)<.01) c=uSide; return vec4(c,1.); }                            /* crew socks */
  if(p.y>.5 && p.y<1.06){ vec3 c=uSh; if(p.y>1.02) c=uSide; else if(ax>.15 && abs(p.z)<.02) c=uSide; else if(p.y<.53) c=uSide; return vec4(c,1.); }
  if(p.y>=1.06 && p.y<1.52){ bool hole = ax>.135 && p.y>1.36; float nk = p.z>0. ? 1.5 - ax*1.6 : 1.53 - ax*.4; if(hole || p.y>nk) { if((hole && ax<.15) || abs(p.y-nk)<.012) return vec4(uTrim,1.); return vec4(0.); }
    vec4 t = texture2D(uNum, vec2(u, clamp((p.y-1.06)/.44,0.,1.))); vec3 c=t.rgb; if(abs(ax-.17)<.025 && p.y<1.36) c=uSide; if(p.y<1.08) c=uTrim; return vec4(c,1.); }
  return vec4(0.); }`).replace('#include <map_fragment>', `#include <map_fragment>
vec4 oc = kit(vB); diffuseColor.rgb = mix(diffuseColor.rgb*uSkin, oc.rgb, oc.a);
{ vec3 q=vB-vec3(0.,1.70,0.); float r=.115; bool sc = q.y > r*.55 || (q.z < -r*.05 && q.y > -r*.5) || (q.z < r*.3 && q.y > r*.1 && abs(q.x) > r*.55);
  if(q.y > -r*.6 && sc) diffuseColor.rgb = uHair*(.8+.2*fract(sin(dot(floor(vB.xy*900.),vec2(12.9,78.2)))*43758.));
  if(abs(q.y - r*.62) < .016 && q.y > -r) diffuseColor.rgb = uBand; }                                   /* headband */`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nif(oc.a>.5) roughnessFactor = max(roughnessFactor, .6);'); };
  m.customProgramCacheKey = () => 'hoopq1'; return m; }
let SRC = null;
export async function loadQ() { if (SRC) return SRC; const gl = await new GLTFLoader().loadAsync('./characters/base-human-v2/male.glb'); SRC = gl.scene; return SRC; }
/* same inputs/outputs as buildHooper(p,u,ukey): returns J (game 17-bone rig, used for poses/hand positions) + J.q (visual body) */
export function buildHooperQ(p, u, ukey) {
  const big = p.pos === 'C' || p.pos === 'PF', w = big ? 1.16 : p.pos === 'PG' ? 1.0 : 1.07;
  const S = { leg: 0.5, torso: 0.44, sh: 0.19 * w, arm: 0.32, hip: 0.098 * w }, J = hskeleton(S);   /* invisible driver rig, identical to the game's */
  const obj = SkeletonUtils.clone(SRC); const bones = {}; obj.traverse((o) => { if (o.isBone) bones[o.name] = o; if (o.isMesh) { o.castShadow = true; o.frustumCulled = false;
    if (o.name.startsWith('SuperHero')) o.material = kitMat(o.material, u, p); } });
  obj.updateMatrixWorld(true);
  const order = []; obj.traverse((o) => { if (o.isBone && MAP[o.name]) order.push(o); });
  const objInv = obj.getWorldQuaternion(new THREE.Quaternion()).invert();
  const oq = (b) => objInv.clone().multiply(b.getWorldQuaternion(new THREE.Quaternion()));   /* rotation in body space */
  const rest = new Map(), parRest = new Map(), wp = (o) => obj.worldToLocal(o.getWorldPosition(new THREE.Vector3()));
  /* the Quaternius rest is a T-pose; the game's rest has arms hanging down, so pre-rotate each limb's rest to the game's rest direction */
  const KID = { upperarm_l: 'lowerarm_l', lowerarm_l: 'hand_l', hand_l: 'middle_01_l', upperarm_r: 'lowerarm_r', lowerarm_r: 'hand_r', hand_r: 'middle_01_r', thigh_l: 'calf_l', calf_l: 'foot_l', thigh_r: 'calf_r', calf_r: 'foot_r' };
  for (const b of order) { let q = oq(b); if (!MAP[b.parent.name]) parRest.set(b, oq(b.parent));
    if (KID[b.name] && bones[KID[b.name]]) { const d = wp(bones[KID[b.name]]).sub(wp(b)).normalize(); q = new THREE.Quaternion().setFromUnitVectors(d, new THREE.Vector3(0, -1, 0)).multiply(q); }
    rest.set(b, q); }
  const pelvis = bones.pelvis; pelvis.userData.y0 = pelvis.position.y;
  obj.scale.multiplyScalar(p.h / 1.82); J.root.add(obj); J.sc = p.h / 2.0;
  const gq = {}, tmp = new THREE.Quaternion(), rootInv = new THREE.Quaternion();
  J.q = { obj, bones, sync() {
    J.root.updateMatrixWorld(true); rootInv.copy(J.root.getWorldQuaternion(tmp)).invert();
    for (const n of ['hips', 'spine', 'chest', 'neck', 'head', 'shL', 'shR', 'elL', 'elR', 'hipL', 'hipR', 'knL', 'knR', 'ftL', 'ftR']) gq[n] = (gq[n] || new THREE.Quaternion()).copy(rootInv).multiply(J[n].getWorldQuaternion(tmp));
    const wq = new Map();
    for (const b of order) { const want = gq[MAP[b.name]].clone().multiply(rest.get(b)); const pw = wq.get(b.parent) || parRest.get(b);
      b.quaternion.copy(pw.clone().invert().multiply(want)); wq.set(b, want); }
    pelvis.position.y = pelvis.userData.y0 * (J.hips.position.y / (S.leg * 2 + 0.1)); } };
  return J;
}
