/* gfx1 2026-10-05 - Apex Arcade shared graphics kit (owner: "Fix all the games graphics that are not like this new strategy").
   One look for every 3D game: image-based lighting (sky or studio reflections), soft shadows, HDR glow (bloom),
   filmic color, gentle vignette, and automatic quality steps so phones stay smooth.
   Usage inside a game module (after THREE + renderer exist):
     const G = ApexGFX.install(THREE, renderer, { bloom: 0.7 });
     G.env(scene, 'sky' | 'studio' | 'night', { top, horizon, ground, sun, intensity });
     G.shadows(dirLight, 2048);           // optional: crisp soft sun shadows
     ...in the loop: G.render(scene, camera, timeSeconds)   (instead of renderer.render)
   Quality: 'high' (glow + full res), 'med' (glow, capped res), 'low' (no glow). Saved per device; steps down by itself if FPS drops. */
(function () {
  var KEY = 'apex_gfx_q';
  function lsGet() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function lsSet(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function install(THREE, renderer, opt) {
    opt = opt || {};
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    if (opt.exposure) renderer.toneMappingExposure = opt.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var gl = renderer.getContext();
    var HALF = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
    var isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    var mobile = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
    var Q = lsGet() || 'high';   // sharp1: always start at Max
    var baseDPR = Math.min(window.devicePixelRatio || 1, 2);

    /* ---------------- post: HDR bloom + filmic composite ---------------- */
    var FSV = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
    function SM(frag, u) { return new THREE.ShaderMaterial({ vertexShader: FSV, fragmentShader: frag, uniforms: u, depthTest: false, depthWrite: false }); }
    var P = { rt: null, mips: [], ups: [], w: 0, h: 0, bloom: opt.bloom == null ? 0.7 : opt.bloom, th: opt.threshold || 1.0, vig: opt.vignette == null ? 0.35 : opt.vignette,
      sat: opt.saturation || 1.06, con: opt.contrast || 1.04, scene: new THREE.Scene(), cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
    P.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); P.quad.frustumCulled = false; P.scene.add(P.quad);
    var mBright = SM('uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c=texture2D(t,vUv).rgb; float l=max(c.r,max(c.g,c.b)); float k=max(l-th,0.)/max(l,1e-4); gl_FragColor=vec4(min(c*k,vec3(30.)),1.); }', { t: { value: null }, th: { value: 1 } });
    var mDown = SM('uniform sampler2D t; uniform vec2 px; varying vec2 vUv; void main(){ vec3 s=texture2D(t,vUv).rgb*4.; s+=texture2D(t,vUv-px).rgb; s+=texture2D(t,vUv+px).rgb; s+=texture2D(t,vUv+vec2(px.x,-px.y)).rgb; s+=texture2D(t,vUv-vec2(px.x,-px.y)).rgb; gl_FragColor=vec4(s*.125,1.); }', { t: { value: null }, px: { value: new THREE.Vector2() } });
    var mUp = SM('uniform sampler2D t; uniform sampler2D hi; uniform vec2 px; varying vec2 vUv; void main(){' +
      ' vec3 s=texture2D(t,vUv+vec2(-px.x*2.,0.)).rgb + texture2D(t,vUv+vec2(-px.x,px.y)).rgb*2. + texture2D(t,vUv+vec2(0.,px.y*2.)).rgb + texture2D(t,vUv+vec2(px.x,px.y)).rgb*2.' +
      ' + texture2D(t,vUv+vec2(px.x*2.,0.)).rgb + texture2D(t,vUv+vec2(px.x,-px.y)).rgb*2. + texture2D(t,vUv+vec2(0.,-px.y*2.)).rgb + texture2D(t,vUv+vec2(-px.x,-px.y)).rgb*2.;' +
      ' gl_FragColor=vec4(s/12.+texture2D(hi,vUv).rgb,1.); }', { t: { value: null }, hi: { value: null }, px: { value: new THREE.Vector2() } });
    var mComp = SM('uniform sampler2D tS; uniform sampler2D tB; uniform float bS; uniform float vig; uniform float tm; uniform float sat; uniform float con; varying vec2 vUv;' +
      ' float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }' +
      ' void main(){ vec2 c=vUv-.5; vec3 col=texture2D(tS,vUv).rgb; col+=texture2D(tB,vUv).rgb*bS; col*=1.-dot(c,c)*vig; gl_FragColor=vec4(col,1.);\n' +
      '#include <tonemapping_fragment>\n#include <colorspace_fragment>\n' +
      ' { float L=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722)); gl_FragColor.rgb=clamp(mix(vec3(L),gl_FragColor.rgb,sat),0.,1.); gl_FragColor.rgb=clamp((gl_FragColor.rgb-.5)*con+.5,0.,1.); }' +
      ' gl_FragColor.rgb+=(hash(vUv*913.+tm)-.5)/255.; }', { tS: { value: null }, tB: { value: null }, bS: { value: 0.2 }, vig: { value: 0.35 }, tm: { value: 0 }, sat: { value: 1 }, con: { value: 1 } });
    function mkRT(w, h, ms) { return new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { type: HALF ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: ms || 0, depthBuffer: !!ms, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); }
    function freeRT() { if (P.rt) { P.rt.dispose(); P.mips.forEach(function (r) { r.dispose(); }); P.ups.forEach(function (r) { r.dispose(); }); } P.rt = null; P.mips = []; P.ups = []; }
    function sizeRT(w, h) { freeRT(); P.w = w; P.h = h; P.rt = mkRT(w, h, isWebGL2 ? (Q === 'high' ? 4 : 2) : 0); if (!isWebGL2) P.rt.depthBuffer = true;
      var mw = w >> 1, mh = h >> 1; for (var i = 0; i < 5; i++) { P.mips.push(mkRT(mw, mh)); P.ups.push(mkRT(mw, mh)); mw = Math.max(1, mw >> 1); mh = Math.max(1, mh >> 1); } }
    var v2 = new THREE.Vector2(), tmp = new THREE.Vector2();
    function pass(m, u, target) { for (var k in u) m.uniforms[k].value = u[k]; P.quad.material = m; renderer.setRenderTarget(target); renderer.render(P.scene, P.cam); }

    /* ---------------- quality + auto step-down ---------------- */
    var fpsT = 0, fpsN = 0, lowFor = 0, lastTs = 0, userSet = !!lsGet();
    function applyDPR() { var cap = Q === 'high' ? baseDPR : Q === 'med' ? Math.min(baseDPR, 1.5) : Math.min(baseDPR, 1.25);
      if (Math.abs(renderer.getPixelRatio() - cap) > 0.01 && !opt.keepDPR) { var s = renderer.getSize(tmp); renderer.setPixelRatio(cap); renderer.setSize(s.x, s.y, false); } }
    function setQ(q, save) { if (['high', 'med', 'low'].indexOf(q) < 0) return; Q = q; if (save) { lsSet(q); userSet = true; } freeRT(); applyDPR(); if (G.onQuality) try { G.onQuality(Q); } catch (e) {} }
    function watch(now) { if (!lastTs) { lastTs = now; return; } var dt = now - lastTs; lastTs = now; if (dt > 250) return; fpsT += dt; fpsN++;
      if (fpsT > 2000) { var fps = 1000 * fpsN / fpsT; fpsT = 0; fpsN = 0; if (fps < 38) lowFor++; else lowFor = 0;
        if (false && lowFor >= 2 && Q !== 'low') { /* sharp1: no automatic blur */ lowFor = 0; setQ(Q === 'high' ? 'med' : 'low', false); } } }

    /* ---------------- environment lighting (reflections everywhere, nothing downloaded) ---------------- */
    var pmrem = new THREE.PMREMGenerator(renderer), envRT = null;
    function skyScene(o) {
      var s = new THREE.Scene(), top = new THREE.Color(o.top || '#3a7bd5'), hor = new THREE.Color(o.horizon || '#cfe6ff'), gnd = new THREE.Color(o.ground || '#5a5a4a');
      var m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: top }, hor: { value: hor }, gnd: { value: gnd }, sun: { value: new THREE.Vector3().fromArray(o.sun || [0.5, 0.6, 0.3]).normalize() }, sp: { value: o.sunPower == null ? 14 : o.sunPower }, sc: { value: new THREE.Color(o.sunColor || '#fff4dc') } },
        vertexShader: 'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 gnd; uniform vec3 sun; uniform float sp; uniform vec3 sc; varying vec3 vD; void main(){ float y=vD.y; vec3 c = y>0. ? mix(hor,top,pow(y,.55)) : mix(hor,gnd,pow(-y,.35)); float d=max(dot(normalize(vD),sun),0.); c += sc*(pow(d,900.)*sp*6. + pow(d,12.)*.6); gl_FragColor=vec4(c,1.); }' });
      s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), m)); return s; }
    function studioScene(o) { /* soft-box room, like a photo studio: bright panels give clean reflections on metal and paint */
      var s = new THREE.Scene(), room = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 12), new THREE.MeshBasicMaterial({ color: o.wall || 0x6a6f7a, side: THREE.BackSide })); room.position.y = 2.5; s.add(room);
      function panel(x, y, z, w, h, rx, ry, k, col) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col || 0xffffff).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m); }
      panel(0, 5.9, 0, 6, 6, Math.PI / 2, 0, o.key || 7); panel(-5.9, 3, 0, 4, 3, 0, Math.PI / 2, 3, o.fill); panel(5.9, 3, 1.5, 3, 2, 0, -Math.PI / 2, 4.5, o.rim || 0xfff0dc); panel(0, 2.5, -5.9, 5, 2, 0, 0, 2.2);
      var fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: o.floor || 0x2a2a2e })); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.99; s.add(fl); return s; }
    function env(scene, kind, o) { o = o || {}; var es;
      if (kind === 'studio') es = studioScene(o);
      else if (kind === 'night') es = skyScene({ top: o.top || '#060a1a', horizon: o.horizon || '#1a2a4a', ground: o.ground || '#0a0a10', sun: o.sun || [-0.3, 0.5, 0.4], sunPower: o.sunPower == null ? 2 : o.sunPower, sunColor: o.sunColor || '#cfe0ff' });
      else es = skyScene(o);
      if (envRT) envRT.dispose(); envRT = pmrem.fromScene(es, 0.035);
      es.traverse(function (m) { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
      scene.environment = envRT.texture; if ('environmentIntensity' in scene) scene.environmentIntensity = o.intensity == null ? 0.45 : o.intensity;
      if (o.background) scene.background = envRT.texture;
      return envRT.texture; }
    function shadows(light, size) { if (!light || !light.shadow) return; var s = size || 2048; if (Q === 'low') s = Math.min(s, 1024); light.castShadow = true; light.shadow.mapSize.set(s, s); light.shadow.bias = -0.0004; light.shadow.normalBias = 0.02; if ('radius' in light.shadow) light.shadow.radius = 3; }
    /* Turn old flat/plastic materials into realistic ones (keeps color, textures, glow, transparency). Call after building a scene;
       safe to call again on new objects. Pass {skip: fn(material)} to leave some materials alone. */
    var swapped = new WeakMap();
    function pbr(root, o) { o = o || {}; root.traverse(function (obj) { if (!obj.isMesh || !obj.material) return; var arr = Array.isArray(obj.material), L = arr ? obj.material : [obj.material], ch = false;
      var out = L.map(function (m) { if (!m || !(m.isMeshLambertMaterial || m.isMeshPhongMaterial) || (o.skip && o.skip(m))) return m; var n = swapped.get(m); if (!n) {
          n = new THREE.MeshStandardMaterial({ color: m.color, map: m.map, emissive: m.emissive, emissiveMap: m.emissiveMap, emissiveIntensity: m.emissiveIntensity, transparent: m.transparent, opacity: m.opacity, side: m.side, alphaTest: m.alphaTest, vertexColors: m.vertexColors, flatShading: m.flatShading, fog: m.fog, depthWrite: m.depthWrite, normalMap: m.normalMap || null,
            roughness: m.isMeshPhongMaterial ? Math.max(0.18, 1 - Math.min(m.shininess || 30, 200) / 220) : (o.roughness == null ? 0.82 : o.roughness), metalness: o.metalness || 0 });
          n.name = m.name; n.userData = m.userData; swapped.set(m, n); } ch = true; return n; });
      if (ch) obj.material = arr ? out : out[0]; }); }

    var G = {
      THREE: THREE, renderer: renderer, post: P,
      get quality() { return Q; }, setQuality: function (q) { setQ(q, true); },
      env: env, shadows: shadows, pbr: pbr,
      render: function (scene, cam, t) { var now = performance.now(); watch(now);
        if (Q === 'low' || P.bloom <= 0) { renderer.setRenderTarget(null); renderer.render(scene, cam); return; }
        var s = renderer.getDrawingBufferSize(v2), w = s.x | 0, h = s.y | 0; if (!P.rt || w !== P.w || h !== P.h) sizeRT(w, h);
        renderer.setRenderTarget(P.rt); renderer.render(scene, cam);
        var M = P.mips, U = P.ups;
        pass(mBright, { t: P.rt.texture, th: HALF ? P.th : Math.min(P.th, 0.8) }, M[0]);
        for (var i = 1; i < 5; i++) pass(mDown, { t: M[i - 1].texture, px: new THREE.Vector2(1 / M[i - 1].width, 1 / M[i - 1].height) }, M[i]);
        pass(mUp, { t: M[4].texture, hi: M[3].texture, px: new THREE.Vector2(1 / M[4].width, 1 / M[4].height) }, U[3]);
        for (var j = 2; j >= 0; j--) pass(mUp, { t: U[j + 1].texture, hi: M[j].texture, px: new THREE.Vector2(1 / U[j + 1].width, 1 / U[j + 1].height) }, U[j]);
        pass(mComp, { tS: P.rt.texture, tB: U[0].texture, bS: P.bloom * 0.22, vig: P.vig, tm: ((t == null ? now / 1000 : t) % 100), sat: P.sat, con: P.con }, null); },
      dispose: function () { freeRT(); if (envRT) envRT.dispose(); pmrem.dispose(); }
    };
    applyDPR();
    window.ApexGFXActive = G;
    return G;
  }
  /* A small Graphics chooser any game can drop into its settings: ApexGFX.picker(el) */
  function picker(el) { if (!el) return; var G = window.ApexGFXActive, cur = G ? G.quality : (lsGet() || 'med');
    el.innerHTML = '<div style="font-weight:800;margin:6px 0 4px">Graphics</div><div style="display:flex;gap:6px">' + [['low', 'Smooth'], ['med', 'Balanced'], ['high', 'Max']].map(function (q) {
      return '<button type="button" data-gq="' + q[0] + '" style="flex:1;border-radius:10px;padding:8px;font-weight:800;border:1px solid #ffffff33;background:' + (cur === q[0] ? '#2dd4bf;color:#032' : '#0a1628;color:#fff') + '">' + q[1] + '</button>'; }).join('') + '</div>';
    el.querySelectorAll('[data-gq]').forEach(function (b) { b.onclick = function () { var q = b.getAttribute('data-gq'); if (window.ApexGFXActive) window.ApexGFXActive.setQuality(q); else lsSet(q); picker(el); }; }); }
  window.ApexGFX = { install: install, picker: picker };
})();
