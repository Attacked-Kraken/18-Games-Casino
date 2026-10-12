/* Real football kit for Cruz + team: skinned shoulder-pad shell + separate jersey cloth mesh over it.
   Both are built from the body's own bind-pose surface (same skeleton + skin weights, so they follow every animation),
   offset along smoothed normals: squared pad shell with arch + caps, jersey drapes from pad edge, slight blouse, tucked at belt,
   loose sleeve cuff over the biceps. Secondary motion: vertex sway/flutter on hem + sleeves driven by the rig's velocity. */
const CACHE = new WeakMap();
export function addKit(THREE, h, body, T) {
  const src = body.geometry, P = src.attributes.position, N = P.count;
  /* smoothed normals keyed by position (welds UV seams so offsets never crack) */
  const key = (i) => `${Math.round(P.getX(i) * 2000)},${Math.round(P.getY(i) * 2000)},${Math.round(P.getZ(i) * 2000)}`;
  const nrm = src.attributes.normal, acc = new Map(), keys = new Array(N);
  for (let i = 0; i < N; i++) { const k = keys[i] = key(i); const a = acc.get(k) || [0, 0, 0]; a[0] += nrm.getX(i); a[1] += nrm.getY(i); a[2] += nrm.getZ(i); acc.set(k, a); }
  const sn = (i) => { const a = acc.get(keys[i]); const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const idx = src.index ? src.index.array : Array.from({ length: N }, (_, i) => i);
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const cache = CACHE.get(src) || {}; CACHE.set(src, cache);
  function shell(keepTri, offset, name) { if (cache[name]) { const m = new THREE.SkinnedMesh(cache[name]); m.name = name; m.frustumCulled = false; return m; } const g = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'uv', 'skinIndex', 'skinWeight']) if (src.attributes[k]) g.setAttribute(k, src.attributes[k].clone());
    const p = g.attributes.position, bind = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), n = sn(i), d = offset(x, y, z, n); bind[i * 3] = x; bind[i * 3 + 1] = y; bind[i * 3 + 2] = z;
      p.setXYZ(i, x + n[0] * d[0] + (d[1] || 0) * 0, y + n[1] * d[0] + (d[1] || 0), z + n[2] * d[0]); }
    g.setAttribute('bindP', new THREE.BufferAttribute(bind, 3));
    const out = []; for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; if (keepTri((P.getX(a) + P.getX(b) + P.getX(c)) / 3, (P.getY(a) + P.getY(b) + P.getY(c)) / 3, (P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3)) out.push(a, b, c); }
    g.setIndex(out); g.computeVertexNormals(); g.computeBoundingSphere(); cache[name] = g; const m = new THREE.SkinnedMesh(g); m.name = name; m.frustumCulled = false; return m; }
  const pad = (x, y, z) => { const ax = Math.abs(x); return sm(1.33, 1.42, y) * (1 - sm(.27, .31, ax)); };
  const inTorso = (x, y, z) => { const ax = Math.abs(x); if (ax > .27 && y > 1.28) return ax < .425; if (y > 1.56 || y < .94) return false; if (z > 0 && y > 1.52 + 1.6 * ax) return false; return ax < .27; };
  /* shoulder pads: squared shell, raised arch over the collarbones, rounded caps */
  const padM = shell((x, y, z) => y > 1.32 && y < 1.55 && Math.abs(x) < .335 && !(z > 0 && y > 1.50 + 1.6 * Math.abs(x)),
    (x, y, z, n) => { const ax = Math.abs(x), cap = Math.exp(-(((ax - .25) / .05) ** 2) - (((y - 1.43) / .06) ** 2)); const arch = sm(.06, .14, ax) * (1 - sm(.24, .3, ax)) * sm(1.42, 1.5, y);
      return [.022 + .03 * pad(x, y, z) + .012 * cap, .012 * arch]; }, 'pads');
  padM.material = new THREE.MeshStandardMaterial({ color: 0x1c1626, roughness: .7 });
  /* jersey cloth */
  const lat = (x, y, z) => { const ax = Math.abs(x); return Math.exp(-(((ax - .19) / .05) ** 2) - (((y - 1.24) / .1) ** 2)); };
  const jM = shell(inTorso, (x, y, z, n) => { const ax = Math.abs(x);
      const base = .016 + .056 * sm(1.3, 1.42, y) * (1 - sm(.22, .38, ax)) + .012 * lat(x, y, z) * (z < 0 ? 1 : .4);
      if (ax > .27 && y > 1.28) return [base + .014 * sm(.3, .4, ax), 0];                                                              /* sleeve: loose cuff */
      const blouse = Math.exp(-(((y - 1.04) / .04) ** 2)), tuck = sm(.965, 1.0, y);
      return [(base + .006 * blouse) * (.25 + .75 * tuck), .01 * sm(1.3, 1.42, y) * pad(x, y, z)]; }, 'jersey');
  const U = { uNum: { value: T.NUMT }, uName: { value: T.NAMET }, uM: { value: T.MT }, uVel: { value: new THREE.Vector3() }, uT: { value: 0 } };
  const jm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6, envMap: T.ENV, envMapIntensity: .5, side: THREE.DoubleSide });
  jm.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 bindP; varying vec3 vB; uniform vec3 uVel; uniform float uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
  vB = bindP; { float ax = abs(bindP.x); float hem = 1. - smoothstep(.97, 1.12, bindP.y); float slv = bindP.y > 1.28 ? smoothstep(.33, .405, ax) : 0.; float w = max(hem * .6, slv);
    float sp = length(uVel.xz); vec3 fl = vec3(sin(uT * 13. + bindP.y * 40. + bindP.x * 25.), sin(uT * 11. + bindP.x * 30.), sin(uT * 9. + bindP.z * 30.)) * (.003 + .004 * min(sp, 7.) / 7.);
    transformed += w * (fl - vec3(uVel.x, 0., uVel.z) * .0022 * hem + vec3(0., -.002, 0.) * slv * sp); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vB; uniform sampler2D uNum, uName, uM;
const vec3 PUR = vec3(.052,.006,.27), GLD = vec3(.78,.42,.01), WHT = vec3(.92);
vec4 tx(sampler2D s, vec2 uv){ if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.) return vec4(0.); return texture2D(s, uv); }
vec3 kit(vec3 p){ float ax=abs(p.x), y=p.y; vec3 c=PUR;
  if(ax>.27 && y>1.28){ if(ax>.372&&ax<.384) c=GLD; else if(ax>.384&&ax<.392) c=WHT; if(ax>.398) c=PUR*.75;
    return c; }
  if(p.z>0. && y > 1.47 + 1.6*ax) c = (y > 1.485 + 1.6*ax) ? GLD : WHT; if(p.z<0. && y>1.505 && ax<.1) c = y>1.52 ? GLD : WHT;
  if(p.z>0.){ vec4 n=tx(uNum, vec2(p.x/.30+.5, (y-1.10)/.19)); c=mix(c,n.rgb,n.a); vec4 m=tx(uM, vec2(p.x/.07+.5,(y-1.415)/.07)); c=mix(c,m.rgb,m.a); }
  else { vec4 n=tx(uNum, vec2(-p.x/.32+.5, (y-1.07)/.21)); c=mix(c,n.rgb,n.a); vec4 nm=tx(uName, vec2(-p.x/.26+.5, (y-1.30)/.07)); c=mix(c,nm.rgb,nm.a); }
  if(ax>.17&&ax<.18&&y<1.3) c*=.8; if(y<.99) c*=.8; return c; }`).replace('#include <color_fragment>', `#include <color_fragment>
  { float ax=abs(vB.x); bool arm = ax>.27 && vB.y>1.28; if((arm && ax>.405) || (!arm && vB.y<.962) || vB.y>1.545 || (vB.z>0. && vB.y>1.50+1.6*ax)) discard; }
  diffuseColor.rgb = kit(vB); { vec2 m = vB.xy*260. + vec2(vB.z*260.,0.); float hole = smoothstep(.22,.12,length(fract(m)-.5)); diffuseColor.rgb *= 1. - hole*.18*step(vB.y,1.5); }`); };
  jm.customProgramCacheKey = () => 'jersey1'; jM.material = jm;
  for (const m of [padM, jM]) { body.parent.add(m); m.bind(body.skeleton, body.bindMatrix); m.bindMode = body.bindMode; m.position.copy(body.position); m.quaternion.copy(body.quaternion); m.scale.copy(body.scale); }
  /* velocity in rig-local space for cloth sway */
  const last = new THREE.Vector3(), cur = new THREE.Vector3(), inv = new THREE.Quaternion(); let lt = 0, first = true;
  jM.onBeforeRender = () => { const t = performance.now() / 1000, dt = Math.min(.1, t - lt || .016); lt = t; U.uT.value = t; const r = h.rig || h.object; r.getWorldPosition(cur);
    if (!first) { const v = cur.clone().sub(last).divideScalar(dt); r.getWorldQuaternion(inv); inv.invert(); v.applyQuaternion(inv); U.uVel.value.lerp(v, .2); } first = false; last.copy(cur); };
  return { pads: padM, jersey: jM };
}
