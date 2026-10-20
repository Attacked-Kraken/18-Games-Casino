(function(){
'use strict';
const T=THREE, V=(x,y,z)=>new T.Vector3(x,y,z);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap; renderer.physicallyCorrectLights=true;
document.body.prepend(renderer.domElement);
const scene=new T.Scene(); scene.background=new T.Color(0x15171c);
const pmrem=new T.PMREMGenerator(renderer); scene.environment=pmrem.fromScene(new T.RoomEnvironment(),0.04).texture;
const camera=new T.PerspectiveCamera(62,innerWidth/innerHeight,0.02,60);
const controls=new T.OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=0.08; controls.minDistance=0.15; controls.maxDistance=7; controls.enablePan=true;
const key=new T.DirectionalLight(0xffffff,2.2); key.position.set(2.5,4,-1.5); key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.radius=4; key.shadow.bias=-0.0004; key.shadow.normalBias=0.01;
Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:0.5,far:12}); scene.add(key);
const fill=new T.DirectionalLight(0xbfd8ff,0.6); fill.position.set(-3,2,3); scene.add(fill);
scene.add(new T.HemisphereLight(0xffffff,0x202020,0.35));
const floor=new T.Mesh(new T.CircleGeometry(9,64),new T.MeshStandardMaterial({color:0x141518,roughness:0.9,metalness:0}));
floor.rotation.x=-Math.PI/2; floor.position.y=-0.02; floor.receiveShadow=true; scene.add(floor);

/* ---------- procedural textures ---------- */
function cvs(w,h,f){ const c=document.createElement('canvas'); c.width=w; c.height=h; f(c.getContext('2d'),w,h); return c; }
function tex(c,srgb){ const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=8; if(srgb) t.encoding=T.sRGBEncoding; return t; }
// 2x2 twill carbon weave
const weave=(rough)=>cvs(512,512,(g,w)=>{ const n=16,s=w/n; g.fillStyle=rough?'#888':'#0b0c0e'; g.fillRect(0,0,w,w);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const horiz=((i+j)>>1)%2===0, x=i*s, y=j*s;
    const gr=horiz?g.createLinearGradient(x,y,x,y+s):g.createLinearGradient(x,y,x+s,y);
    if(rough){ gr.addColorStop(0,'#9a9a9a'); gr.addColorStop(.5,'#6a6a6a'); gr.addColorStop(1,'#9a9a9a'); }
    else{ const a=horiz?'#202328':'#121417', b=horiz?'#3a3f47':'#262a30'; gr.addColorStop(0,a); gr.addColorStop(.5,b); gr.addColorStop(1,a); }
    g.fillStyle=gr; g.fillRect(x+0.6,y+0.6,s-1.2,s-1.2);
    g.strokeStyle=rough?'rgba(120,120,120,.5)':'rgba(255,255,255,.035)'; g.lineWidth=1;
    for(let k=1;k<4;k++){ g.beginPath(); if(horiz){ g.moveTo(x,y+k*s/4); g.lineTo(x+s,y+k*s/4);} else { g.moveTo(x+k*s/4,y); g.lineTo(x+k*s/4,y+s);} g.stroke(); } } });
const noise=(base,amp,w=256)=>cvs(w,w,(g)=>{ const id=g.createImageData(w,w); for(let i=0;i<id.data.length;i+=4){ const v=base+(Math.random()-.5)*amp; id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255; } g.putImageData(id,0,0); });
const brushed=()=>cvs(512,64,(g,w,h)=>{ g.fillStyle='#999'; g.fillRect(0,0,w,h); for(let i=0;i<900;i++){ const y=Math.random()*h; g.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'0,0,0')+','+(Math.random()*0.12)+')'; g.fillRect(0,y,w,0.6+Math.random()); } });
const carbonMap=tex(weave(false),true), carbonRough=tex(weave(true),false);
const M={
  carbon:new T.MeshPhysicalMaterial({name:'Carbon',map:carbonMap,roughnessMap:carbonRough,metalnessMap:carbonRough,roughness:0.55,metalness:0.15,clearcoat:1,clearcoatRoughness:0.06}),
  carbonMatte:new T.MeshPhysicalMaterial({name:'CarbonMatte',map:carbonMap,roughnessMap:carbonRough,metalnessMap:carbonRough,roughness:0.75,metalness:0.1,clearcoat:0.25,clearcoatRoughness:0.4}),
  alu:new T.MeshPhysicalMaterial({name:'BrushedAluminium',color:0xc9ccd1,map:tex(brushed(),true),metalness:1,roughness:0.32}),
  titan:new T.MeshPhysicalMaterial({name:'Titanium',color:0x8d9097,metalness:1,roughness:0.38}),
  black:new T.MeshPhysicalMaterial({name:'BlackAnodised',color:0x121315,metalness:0.8,roughness:0.4}),
  rubber:new T.MeshPhysicalMaterial({name:'Rubber',color:0x151515,roughness:0.92,metalness:0}),
  suede:new T.MeshPhysicalMaterial({name:'Suede',color:0x1d1f24,roughness:1,map:tex(noise(150,50),true),sheen:new T.Color(0x3a3d46)}),
  foam:new T.MeshPhysicalMaterial({name:'PaddingFoam',color:0x23262c,roughness:0.95,map:tex(noise(160,40),true)}),
  belt:new T.MeshPhysicalMaterial({name:'HarnessWebbing',color:0x2b5fd0,roughness:0.8,map:tex(cvs(64,64,(g,w)=>{ for(let y=0;y<w;y+=2){ g.fillStyle=y%4?'#d8d8d8':'#b8b8b8'; g.fillRect(0,y,w,2);} }),true),side:T.DoubleSide}),
  paint:new T.MeshPhysicalMaterial({name:'BodyPaint',color:0x2b313c,roughness:0.35,metalness:0.35,clearcoat:1,clearcoatRoughness:0.05}),
  accent:new T.MeshPhysicalMaterial({name:'AccentPaint',color:0x0fa3a3,roughness:0.3,metalness:0.2,clearcoat:1,clearcoatRoughness:0.05}),
  mirror:new T.MeshPhysicalMaterial({name:'MirrorGlass',color:0xffffff,metalness:1,roughness:0.02}),
  red:new T.MeshPhysicalMaterial({name:'RedAnodised',color:0xc8202a,metalness:0.7,roughness:0.35}),
  yellow:new T.MeshPhysicalMaterial({name:'YellowAnodised',color:0xf2b705,metalness:0.6,roughness:0.35}),
  rim:new T.MeshPhysicalMaterial({name:'WheelRim',color:0x1b1c1f,metalness:0.9,roughness:0.3}),
  tyreWall:new T.MeshPhysicalMaterial({name:'Tyre',color:0x1a1a1a,roughness:0.85}),
};
function uvScale(geo,s){ const uv=geo.attributes.uv; if(!uv) return geo; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*s,uv.getY(i)*s); uv.needsUpdate=true; return geo; }
const root=new T.Group(); root.name='OpenWheelCockpit'; scene.add(root);
function mesh(geo,mat,parent,name,pos,rot){ const m=new T.Mesh(geo,mat); m.castShadow=m.receiveShadow=true; if(name) m.name=name; if(pos) m.position.copy(pos); if(rot) m.rotation.set(rot[0],rot[1],rot[2]); (parent||root).add(m); return m; }
function rbox(w,h,d,r,seg=3){ r=Math.min(r,w/2-1e-3,h/2-1e-3,d/2-1e-3); const s=new T.Shape(), x=-w/2+r, y=-h/2+r, ww=w-2*r, hh=h-2*r;
  s.moveTo(x,y-r); s.lineTo(x+ww,y-r); s.quadraticCurveTo(x+ww+r,y-r,x+ww+r,y); s.lineTo(x+ww+r,y+hh); s.quadraticCurveTo(x+ww+r,y+hh+r,x+ww,y+hh+r); s.lineTo(x,y+hh+r); s.quadraticCurveTo(x-r,y+hh+r,x-r,y+hh); s.lineTo(x-r,y); s.quadraticCurveTo(x-r,y-r,x,y-r);
  const g=new T.ExtrudeGeometry(s,{depth:Math.max(1e-3,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r*0.98,bevelSegments:seg,curveSegments:seg*2}); g.translate(0,0,-(d-2*r)/2); g.computeVertexNormals(); return g; }
function tube(pts,r,seg=48,rs=10,closed=false){ return new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>V(...p)),closed,'centripetal'),seg,r,rs,closed); }
function strap(pts,w,parent,name){ // flat webbing ribbon following a path; width oriented by a hint normal
  const c=new T.CatmullRomCurve3(pts.map(p=>V(...p))), n=40, pos=[], uv=[], idx=[]; const up=V(1,0,0);
  for(let i=0;i<=n;i++){ const t=i/n, p=c.getPoint(t), tg=c.getTangent(t), side=V().crossVectors(tg,V(0,0,1)).normalize(); if(side.lengthSq()<0.1) side.copy(up);
    const a=p.clone().addScaledVector(side,w/2), b=p.clone().addScaledVector(side,-w/2); pos.push(a.x,a.y,a.z,b.x,b.y,b.z); uv.push(0,t*8,1,t*8); if(i<n){ const k=i*2; idx.push(k,k+1,k+2,k+1,k+3,k+2); } }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return mesh(g,M.belt,parent,name); }

/* ---------- monocoque tub: U cross-section extruded along z, tapered into the nose ---------- */
// car axes: +z forward, +y up, driver hip ~ z=-0.35. Tub from z=-1.0 (rear bulkhead) to z=1.9 (nose start)
function tubSection(outW,outH,wall){ const s=new T.Shape(); const r=0.09, w=outW/2;
  s.moveTo(-w,outH); s.lineTo(-w,r); s.quadraticCurveTo(-w,0,-w+r,0); s.lineTo(w-r,0); s.quadraticCurveTo(w,0,w,r); s.lineTo(w,outH);
  s.lineTo(w-wall,outH); s.lineTo(w-wall,wall+r*0.6); s.quadraticCurveTo(w-wall,wall,w-wall-r*0.6,wall); s.lineTo(-w+wall+r*0.6,wall); s.quadraticCurveTo(-w+wall,wall,-w+wall,wall+r*0.6); s.lineTo(-w+wall,outH); s.lineTo(-w,outH); return s; }
(function(){
  const sideH=0.62, len=1.55; // open cockpit section z -1.0..0.55
  const g=new T.ExtrudeGeometry(tubSection(0.86,sideH,0.05),{depth:len,bevelEnabled:true,bevelThickness:0.012,bevelSize:0.01,bevelSegments:2,curveSegments:10});
  // shape top edge: lower cockpit rim towards the rear, add rounded taper at the front
  const p=g.attributes.position; for(let i=0;i<p.count;i++){ const z=p.getZ(i); let y=p.getY(i); if(y>0.3){ const t=z/len; y=y-0.08*(1-t)+0.0; } p.setY(i,y); }
  g.translate(0,0,-1.0); g.computeVertexNormals(); uvScale(g,4); mesh(g,M.carbon,root,'Monocoque_Tub');
  // front chassis / nose: closed section tapering to the nose tip, scaled per-vertex along z
  const s=new T.Shape(); const w=0.43,h=0.6,r=0.12; s.moveTo(-w+r,0); s.lineTo(w-r,0); s.quadraticCurveTo(w,0,w,r); s.lineTo(w*0.85,h-r); s.quadraticCurveTo(w*0.8,h,w*0.6,h); s.lineTo(-w*0.6,h); s.quadraticCurveTo(-w*0.8,h,-w*0.85,h-r); s.lineTo(-w,r); s.quadraticCurveTo(-w,0,-w+r,0);
  const nl=2.6, ng=new T.ExtrudeGeometry(s,{depth:nl,steps:24,bevelEnabled:false,curveSegments:10}); const q=ng.attributes.position;
  for(let i=0;i<q.count;i++){ const t=q.getZ(i)/nl, k=1-0.78*Math.pow(t,1.15), kx=1-0.72*Math.pow(t,1.05); q.setX(i,q.getX(i)*kx); const y=q.getY(i); q.setY(i,0.08*t+y*k+0.0*t); }
  ng.translate(0,0,0.55); ng.computeVertexNormals(); uvScale(ng,4); mesh(ng,M.paint,root,'Nose_Chassis');
  // carbon cockpit surround (coaming) with padded edge
  mesh(tube([[-0.41,0.5,-0.98],[-0.42,0.55,-0.4],[-0.4,0.6,0.25],[-0.25,0.62,0.55],[0,0.63,0.6],[0.25,0.62,0.55],[0.4,0.6,0.25],[0.42,0.55,-0.4],[0.41,0.5,-0.98]],0.028,80,10),M.suede,root,'Cockpit_Rim_Pad');
  // dash/bulkhead inside front of cockpit
  const dash=mesh(rbox(0.74,0.36,0.04,0.015),M.carbonMatte,root,'Dash_Bulkhead',V(0,0.4,0.5),[0.18,0,0]);
  // rear bulkhead + headrest structure
  mesh(rbox(0.82,0.62,0.05,0.02),M.carbonMatte,root,'Rear_Bulkhead',V(0,0.33,-1.0));
  // side impact pads & headrest (padding foam, suede faced)
  const hr=new T.Group(); hr.name='Headrest_Pads'; root.add(hr);
  mesh(rbox(0.36,0.2,0.12,0.04),M.foam,hr,'Headrest_Back',V(0,0.66,-0.86),[0.1,0,0]);
  [-1,1].forEach(sd=>{ mesh(rbox(0.1,0.2,0.5,0.04),M.foam,hr,'Headrest_Side_'+(sd<0?'L':'R'),V(sd*0.31,0.64,-0.62)); mesh(rbox(0.05,0.2,0.75,0.02),M.foam,hr,'Side_Pad_'+(sd<0?'L':'R'),V(sd*0.36,0.36,-0.3)); });
  // engine cover / airbox behind driver
  mesh(rbox(0.7,0.42,1.4,0.18),M.paint,root,'Engine_Cover',V(0,0.62,-1.75)); mesh(rbox(0.26,0.36,0.32,0.08),M.carbon,root,'Airbox_Intake',V(0,0.95,-1.15));
  // sidepods
  [-1,1].forEach(sd=>{ mesh(rbox(0.38,0.42,1.6,0.12),M.paint,root,'Sidepod_'+(sd<0?'L':'R'),V(sd*0.62,0.25,-0.75)); mesh(rbox(0.04,0.3,1.0,0.01),M.accent,root,'Sidepod_Stripe_'+(sd<0?'L':'R'),V(sd*0.82,0.32,-0.55)); });
  // floor
  mesh(uvScale(new T.BoxGeometry(1.5,0.02,4.2),3),M.carbonMatte,root,'Floor',V(0,0.0,-0.3));
})();

/* ---------- seat & harness ---------- */
(function(){ const seat=new T.Group(); seat.name='Seat'; root.add(seat);
  // molded shell: lathe-ish bucket built from a profile swept around (half-pipe)
  const prof=[]; for(let i=0;i<=20;i++){ const t=i/20; prof.push(new T.Vector2(0.17+0.06*Math.sin(t*Math.PI),t*0.62)); }
  const back=new T.LatheGeometry(prof,28,Math.PI*0.5,Math.PI); back.rotateX(-1.05); back.translate(0,0.06,-0.72); back.computeVertexNormals(); uvScale(back,3);
  const mback=mesh(back,M.carbonMatte,seat,'Seat_Shell_Back'); mback.material=M.carbonMatte;
  mesh(rbox(0.36,0.05,0.62,0.02),M.carbonMatte,seat,'Seat_Base',V(0,0.06,-0.35),[0.12,0,0]);
  mesh(rbox(0.3,0.03,0.5,0.015),M.suede,seat,'Seat_Cushion',V(0,0.095,-0.34),[0.12,0,0]);
  mesh(rbox(0.3,0.5,0.03,0.015),M.suede,seat,'Seat_Back_Pad',V(0,0.36,-0.7),[-0.5,0,0]);
  // 6-point harness: shoulder straps over the back pad, lap belts, crotch straps -> central buckle
  const bk=V(0,0.2,-0.18);
  strap([[-0.12,0.66,-0.92],[-0.11,0.6,-0.72],[-0.08,0.45,-0.55],[-0.04,0.28,-0.3],[-0.02,0.22,-0.19]],0.05,seat,'Harness_Shoulder_L');
  strap([[0.12,0.66,-0.92],[0.11,0.6,-0.72],[0.08,0.45,-0.55],[0.04,0.28,-0.3],[0.02,0.22,-0.19]],0.05,seat,'Harness_Shoulder_R');
  strap([[-0.2,0.08,-0.42],[-0.17,0.16,-0.3],[-0.08,0.2,-0.2],[-0.02,0.2,-0.18]],0.05,seat,'Harness_Lap_L');
  strap([[0.2,0.08,-0.42],[0.17,0.16,-0.3],[0.08,0.2,-0.2],[0.02,0.2,-0.18]],0.05,seat,'Harness_Lap_R');
  strap([[0,0.08,-0.3],[0,0.14,-0.24],[0,0.18,-0.19]],0.045,seat,'Harness_Crotch');
  const b=mesh(new T.CylinderGeometry(0.045,0.045,0.018,32),M.alu,seat,'Harness_Buckle',bk,[Math.PI/2-0.3,0,0]);
  mesh(new T.CylinderGeometry(0.022,0.022,0.024,6),M.red,seat,'Buckle_Release',V(0,0.205,-0.172),[Math.PI/2-0.3,0,0]);
  // adjusters (aluminium slides on shoulder straps)
  [-1,1].forEach(sd=>mesh(rbox(0.06,0.012,0.03,0.004),M.alu,seat,'Harness_Adjuster',V(sd*0.075,0.42,-0.52),[0.9,0,0]));
})();

/* ---------- footwell & pedal box ---------- */
(function(){ const pb=new T.Group(); pb.name='Pedal_Box'; root.add(pb); pb.position.set(0,0.06,1.35);
  mesh(rbox(0.36,0.02,0.3,0.008),M.alu,pb,'Pedal_Floor',V(0,0,0));
  function pedal(x,name,mat,w){ const g=new T.Group(); g.name=name; g.position.set(x,0.02,-0.05); pb.add(g);
    mesh(new T.BoxGeometry(0.02,0.24,0.02),M.alu,g,name+'_Arm',V(0,0.12,0.02),[0.25,0,0]);
    const s=new T.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(w/2,0.09); s.lineTo(-w/2,0.09); s.lineTo(-w/2,0);
    for(let i=0;i<3;i++){ const h=new T.Path(); h.absarc(-w/3+i*w/3,0.045,0.012,0,Math.PI*2,true); s.holes.push(h); }
    const pg=new T.ExtrudeGeometry(s,{depth:0.008,bevelEnabled:true,bevelThickness:0.002,bevelSize:0.002,bevelSegments:1}); pg.translate(0,0,-0.004);
    mesh(pg,mat,g,name+'_Plate',V(0,0.18,-0.01),[0.25,0,0]);
    mesh(new T.CylinderGeometry(0.012,0.012,0.12,16),M.black,g,name+'_MasterCyl',V(0,0.1,0.11),[Math.PI/2,0,0]); return g; }
  pedal(-0.07,'Brake_Pedal',M.alu,0.1); pedal(0.08,'Throttle_Pedal',M.black,0.07);
  mesh(rbox(0.07,0.07,0.1,0.01),M.alu,pb,'Brake_Bias_Bar',V(-0.07,0.1,0.2));
})();

/* ---------- halo ---------- */
(function(){ const h=new T.Group(); h.name='Halo'; root.add(h);
  mesh(tube([[-0.38,0.58,-0.82],[-0.37,0.85,-0.6],[-0.31,0.96,-0.25],[-0.16,1.0,0.0],[0,1.01,0.06],[0.16,1.0,0.0],[0.31,0.96,-0.25],[0.37,0.85,-0.6],[0.38,0.58,-0.82]],0.034,96,14),M.carbon,h,'Halo_Hoop');
  mesh(tube([[0,1.01,0.06],[0,0.95,0.2],[0,0.8,0.38],[0,0.64,0.52]],0.038,40,14),M.carbon,h,'Halo_Pillar');
  [[-0.38,0.58,-0.82],[0.38,0.58,-0.82],[0,0.64,0.52]].forEach((p,i)=>mesh(new T.CylinderGeometry(0.055,0.07,0.04,20),M.titan,h,'Halo_Mount_'+i,V(...p)));
})();

/* ---------- mirrors ---------- */
[-1,1].forEach(sd=>{ const g=new T.Group(); g.name='Mirror_'+(sd<0?'L':'R'); g.position.set(sd*0.62,0.72,0.42); root.add(g);
  mesh(tube([[-sd*0.2,-0.1,0.02],[-sd*0.1,-0.03,0.01],[0,0,0]],0.012,12,8),M.carbon,g,'Mirror_Stalk');
  mesh(rbox(0.2,0.08,0.05,0.02),M.carbon,g,'Mirror_Housing',V(sd*0.02,0.02,0.01));
  mesh(new T.PlaneGeometry(0.18,0.062),M.mirror,g,'Mirror_Glass',V(sd*0.02,0.02,-0.016),[0,Math.PI,0]); });

/* ---------- front wheels, suspension, wing ---------- */
(function(){ const fs=new T.Group(); fs.name='Front_Suspension'; root.add(fs);
  [-1,1].forEach(sd=>{ const wx=sd*0.86, wz=2.15, wy=0.34; const w=new T.Group(); w.name='Front_Wheel_'+(sd<0?'L':'R'); w.position.set(wx,wy,wz); fs.add(w);
    const tyre=new T.LatheGeometry([[0.24,-0.17],[0.3,-0.17],[0.335,-0.15],[0.345,-0.1],[0.345,0.1],[0.335,0.15],[0.3,0.17],[0.24,0.17]].map(p=>new T.Vector2(p[0],p[1])),40); tyre.rotateZ(Math.PI/2);
    mesh(tyre,M.tyreWall,w,'Tyre'); const rim=new T.CylinderGeometry(0.24,0.24,0.3,32,1,true); rim.rotateZ(Math.PI/2); mesh(rim,M.rim,w,'Rim');
    const disc=new T.CylinderGeometry(0.235,0.235,0.02,32); disc.rotateZ(Math.PI/2); mesh(disc,M.rim,w,'Rim_Face',V(sd*0.12,0,0));
    mesh(new T.CylinderGeometry(0.05,0.05,0.04,6).rotateZ(Math.PI/2),M.yellow,w,'Wheel_Nut',V(sd*0.15,0,0));
    // wishbones (upper & lower, front & rear legs) + push rod + track rod
    const inX=sd*0.2, upr=[wx-sd*0.12,wy,wz];
    [[0.16,0.48],[0.05,0.3]].forEach(([dy,iy],k)=>{ [-0.18,0.16].forEach(dz=>mesh(tube([[inX,iy,wz+dz],[upr[0],wy+dy*(k?-1:1)*0.55,wz]],0.011,6,8),M.carbon,fs,'Wishbone')); });
    mesh(tube([[inX*0.8,0.52,wz-0.3],[upr[0],wy-0.1,wz]],0.009,6,8),M.titan,fs,'Push_Rod');
    mesh(tube([[inX,0.4,wz+0.12],[upr[0],wy,wz+0.12]],0.008,6,8),M.titan,fs,'Track_Rod');
    mesh(rbox(0.06,0.28,0.1,0.02),M.black,fs,'Upright',V(upr[0],wy,wz)); });
  // front wing with endplates
  const fw=new T.Group(); fw.name='Front_Wing'; root.add(fw);
  for(let i=0;i<3;i++) mesh(rbox(1.7,0.012,0.2-i*0.04,0.005),i?M.carbon:M.accent,fw,'Wing_Element_'+i,V(0,0.1+i*0.045,3.05-i*0.06),[-0.15-i*0.12,0,0]);
  [-1,1].forEach(sd=>mesh(rbox(0.012,0.22,0.36,0.004),M.carbon,fw,'Endplate',V(sd*0.85,0.15,3.0)));
  mesh(new T.BoxGeometry(0.02,0.14,0.2),M.carbon,fw,'Wing_Pylon',V(-0.08,0.2,2.95)); mesh(new T.BoxGeometry(0.02,0.14,0.2),M.carbon,fw,'Wing_Pylon',V(0.08,0.2,2.95));
})();

/* ---------- cables & fasteners ---------- */
(function(){ const cg=new T.Group(); cg.name='Cables'; root.add(cg);
  const cols=[0xd23a2a,0xf2b705,0x2a8ad2,0x111111];
  cols.forEach((c,i)=>mesh(tube([[-0.3+i*0.02,0.25,0.48],[-0.25+i*0.02,0.18,0.3],[-0.32+i*0.015,0.12,0.0],[-0.34,0.12,-0.3]],0.005,30,6),new T.MeshPhysicalMaterial({name:'CableSheath',color:c,roughness:0.5}),cg,'Cable_'+i));
  mesh(tube([[0.3,0.3,0.48],[0.33,0.2,0.2],[0.35,0.15,-0.2],[0.36,0.15,-0.6]],0.008,30,8),M.rubber,cg,'Loom_R');
  for(let i=0;i<4;i++) mesh(new T.CylinderGeometry(0.011,0.011,0.012,12),M.black,cg,'Cable_Clip',V(-0.33,0.13,-0.05-i*0.08),[0,0,Math.PI/2]);
  // bolt heads along the cockpit rim and dash (instanced)
  const bg=new T.CylinderGeometry(0.008,0.008,0.006,6), pts=[];
  for(let i=0;i<12;i++){ const z=-0.9+i*0.11; pts.push([-0.432,0.47+0.05*(z+1)/1.55,z,0,0,Math.PI/2],[0.432,0.47+0.05*(z+1)/1.55,z,0,0,Math.PI/2]); }
  for(let i=0;i<6;i++) pts.push([-0.3+i*0.12,0.57,0.47,Math.PI/2+0.18,0,0],[-0.3+i*0.12,0.24,0.53,Math.PI/2+0.18,0,0]);
  const inst=new T.InstancedMesh(bg,M.titan,pts.length); inst.name='Fasteners'; const o=new T.Object3D();
  pts.forEach((p,i)=>{ o.position.set(p[0],p[1],p[2]); o.rotation.set(p[3],p[4],p[5]); o.updateMatrix(); inst.setMatrixAt(i,o.matrix); }); inst.castShadow=true; root.add(inst);
  // dash switches
  for(let i=0;i<4;i++){ mesh(new T.CylinderGeometry(0.012,0.012,0.02,16),[M.red,M.yellow,M.black,M.black][i],root,'Dash_Switch_'+i,V(-0.22+i*0.06,0.47,0.475),[Math.PI/2+0.18,0,0]); }
})();

/* ---------- steering column, quick release, wheel ---------- */
const COL_BASE=V(0,0.43,0.5), WHEEL_POS=V(0,0.555,0.0);
const colDir=WHEEL_POS.clone().sub(COL_BASE).normalize();
(function(){ const len=COL_BASE.distanceTo(WHEEL_POS); const g=new T.CylinderGeometry(0.018,0.022,len,20); g.translate(0,len/2,0);
  const c=mesh(g,M.alu,root,'Steering_Column',COL_BASE); c.quaternion.setFromUnitVectors(V(0,1,0),colDir.clone().negate()); c.position.copy(WHEEL_POS); c.quaternion.setFromUnitVectors(V(0,1,0),colDir);
  c.position.copy(COL_BASE); })();
const wheelMount=new T.Group(); wheelMount.name='Wheel_Mount'; wheelMount.position.copy(WHEEL_POS); wheelMount.quaternion.setFromUnitVectors(V(0,0,-1),colDir); /* local -z faces the driver */ root.add(wheelMount);
// quick-release hub (stays fixed); the wheel spins about local z (axis pointing toward the driver = -z)
const qr=new T.CylinderGeometry(0.032,0.032,0.05,28); qr.rotateX(Math.PI/2); mesh(qr,M.alu,wheelMount,'Quick_Release_Hub',V(0,0,0.03));
const qrr=new T.TorusGeometry(0.034,0.006,10,28); mesh(qrr,M.yellow,wheelMount,'Quick_Release_Collar',V(0,0,0.012));
const wheel=new T.Group(); wheel.name='SteeringWheel'; wheelMount.add(wheel);
const btns=[]; const CLICK=new WeakMap(); // clickable parts -> action
let dispTex, dispCtx;
(function(){
  // body: carbon yoke with cut top
  const s=new T.Shape(), W=0.145, H=0.085;
  s.moveTo(-W+0.03,-H); s.lineTo(W-0.03,-H); s.quadraticCurveTo(W+0.01,-H,W+0.012,-H+0.04); s.lineTo(W+0.02,H-0.04); s.quadraticCurveTo(W+0.02,H,W-0.03,H);
  s.lineTo(0.07,H); s.quadraticCurveTo(0.06,H-0.012,0.04,H-0.012); s.lineTo(-0.04,H-0.012); s.quadraticCurveTo(-0.06,H-0.012,-0.07,H); s.lineTo(-W+0.03,H); s.quadraticCurveTo(-W-0.02,H,-W-0.02,H-0.04); s.lineTo(-W-0.012,-H+0.04); s.quadraticCurveTo(-W-0.01,-H,-W+0.03,-H);
  const bg=new T.ExtrudeGeometry(s,{depth:0.018,bevelEnabled:true,bevelThickness:0.005,bevelSize:0.005,bevelSegments:3,curveSegments:12}); bg.translate(0,0,-0.009); uvScale(bg,10);
  mesh(bg,M.carbon,wheel,'Wheel_Body');
  // ergonomic rubber grips (lathe profile)
  const gp=[]; for(let i=0;i<=16;i++){ const t=i/16; gp.push(new T.Vector2(0.018+0.006*Math.sin(t*Math.PI)+0.003*Math.sin(t*Math.PI*3),(t-0.5)*0.16)); }
  [-1,1].forEach(sd=>{ const g=new T.LatheGeometry(gp,24); const m=mesh(g,M.rubber,wheel,'Grip_'+(sd<0?'L':'R'),V(sd*0.155,-0.005,-0.006),[0,0,sd*0.12]); });
  // center display with canvas texture
  const dc=document.createElement('canvas'); dc.width=320; dc.height=180; dispCtx=dc.getContext('2d'); dispTex=new T.CanvasTexture(dc); dispTex.encoding=T.sRGBEncoding;
  mesh(rbox(0.11,0.066,0.008,0.003),M.black,wheel,'Display_Bezel',V(0,0.012,-0.012));
  const dm=new T.MeshBasicMaterial({name:'Display',map:dispTex,toneMapped:false}); const disp=new T.Mesh(new T.PlaneGeometry(0.096,0.054),dm); disp.name='Wheel_Display'; disp.position.set(0,0.012,-0.0165); disp.rotation.y=Math.PI; wheel.add(disp);
  // LED shift-light strip
  const leds=new T.Group(); leds.name='Shift_Lights'; wheel.add(leds);
  for(let i=0;i<15;i++){ const col=i<5?0x18ff4a:i<10?0xff1a1a:0x2a6bff; const m=new T.MeshStandardMaterial({name:'LED',color:0x111111,emissive:col,emissiveIntensity:0.05}); const l=new T.Mesh(new T.BoxGeometry(0.0055,0.004,0.004),m); l.position.set(-0.049+i*0.007,0.058,-0.012); l.name='LED_'+i; leds.add(l); }
  // buttons (cylinders with colored caps) and rotaries
  const BC=[['PIT',0xf2b705],['RADIO',0x2a8ad2],['DRS',0x18c060],['N',0xffffff],['ACK',0xc8202a],['BOX',0xff7a00],['+',0x555555],['-',0x555555]];
  const bpos=[[-0.088,0.04],[-0.088,0.012],[-0.088,-0.016],[0.088,0.04],[0.088,0.012],[0.088,-0.016],[-0.03,-0.035],[0.03,-0.035]];
  BC.forEach(([n,c],i)=>{ const g=new T.Group(); g.name='Button_'+n.replace(/[^A-Z]/g,'')+(n==='+'?'Plus':n==='-'?'Minus':''); g.position.set(bpos[i][0],bpos[i][1],-0.014); wheel.add(g);
    const b=mesh(new T.CylinderGeometry(0.0075,0.0075,0.006,20).rotateX(Math.PI/2),new T.MeshPhysicalMaterial({name:'ButtonCap',color:c,roughness:0.35,clearcoat:0.6}),g,'Cap'); mesh(new T.TorusGeometry(0.0085,0.0012,6,20),M.alu,g,'Ring');
    CLICK.set(g,{type:'button',name:n,obj:b,base:b.position.z}); btns.push(b); });
  const knurl=new T.CylinderGeometry(0.012,0.012,0.012,24); knurl.rotateX(Math.PI/2);
  [[-0.06,-0.05,'MODE'],[0,-0.062,'BAL'],[0.06,-0.05,'DIFF'],[-0.115,0.05,'ENG'],[0.115,0.05,'MAP']].forEach(([x,y,n])=>{ const g=new T.Group(); g.name='Rotary_'+n; g.position.set(x,y,-0.016); wheel.add(g);
    const k=mesh(knurl,M.alu,g,'Knob'); mesh(new T.BoxGeometry(0.002,0.009,0.002),M.yellow,g,'Pointer',V(0,0.005,-0.0065)); const rc={type:'rotary',name:n,obj:g,step:0}; CLICK.set(k,rc); CLICK.set(g.children[1],rc); btns.push(k,g.children[1]); });
  // paddles (behind wheel), clutch paddles below
  [-1,1].forEach(sd=>{ const piv=new T.Group(); piv.name='Paddle_'+(sd<0?'Downshift':'Upshift'); piv.position.set(sd*0.06,0.02,0.02); wheel.add(piv);
    const ps=new T.Shape(); ps.moveTo(0,-0.02); ps.lineTo(sd*0.1,-0.03); ps.quadraticCurveTo(sd*0.13,0.0,sd*0.1,0.035); ps.lineTo(0,0.03);
    const pg=new T.ExtrudeGeometry(ps,{depth:0.004,bevelEnabled:true,bevelThickness:0.001,bevelSize:0.001,bevelSegments:1}); uvScale(pg,10);
    const p=mesh(pg,M.carbon,piv,'Paddle'); CLICK.set(p,{type:'paddle',name:sd<0?'DOWN':'UP',obj:piv}); btns.push(p);
    const cg=new T.Group(); cg.name='Clutch_Paddle_'+(sd<0?'L':'R'); cg.position.set(sd*0.05,-0.045,0.024); wheel.add(cg);
    const c=mesh(rbox(0.08,0.02,0.004,0.0015),M.alu,cg,'Clutch',V(sd*0.04,0,0)); CLICK.set(c,{type:'paddle',name:'CLUTCH',obj:cg}); btns.push(c); });
  mesh(new T.CylinderGeometry(0.03,0.03,0.012,28).rotateX(Math.PI/2),M.black,wheel,'Wheel_Hub_Adapter',V(0,0,0.016));
})();

/* ---------- display + LEDs ---------- */
let gear=0, steerDeg=0, lastBtn='';
function drawDisplay(){ const g=dispCtx, w=320, h=180; g.fillStyle='#05070a'; g.fillRect(0,0,w,h);
  g.fillStyle='#1b2430'; g.fillRect(0,0,w,26); g.fillStyle='#8fd3ff'; g.font='bold 18px monospace'; g.textAlign='left'; g.fillText('LAP 0:00.000',8,19); g.textAlign='right'; g.fillText('P1',w-8,19);
  g.textAlign='center'; g.fillStyle='#fff'; g.font='bold 96px monospace'; g.fillText(gear===0?'N':String(gear),w/2,125);
  g.font='bold 22px monospace'; g.fillStyle='#ffcf6a'; g.textAlign='left'; g.fillText((steerDeg>=0?'+':'')+steerDeg.toFixed(0)+'°',10,90); g.fillText('0 km/h',10,125);
  g.textAlign='right'; g.fillStyle='#7cff9a'; g.fillText('BB 56%',w-10,90); g.fillText('TC 4',w-10,125);
  g.fillStyle='#ffcf6a'; g.font='bold 18px monospace'; g.textAlign='center'; g.fillText(lastBtn,w/2,170); dispTex.needsUpdate=true; }
const ledMeshes=[]; wheel.traverse(o=>{ if(/^LED_/.test(o.name)) ledMeshes.push(o); }); ledMeshes.sort((a,b)=>+a.name.slice(4)-+b.name.slice(4));
function drawLeds(){ const f=Math.abs(steerDeg)/270, n=Math.round(f*15); ledMeshes.forEach((l,i)=>{ l.material.emissiveIntensity=i<n?3:0.05; }); }
drawDisplay(); drawLeds();

/* ---------- interaction ---------- */
const LIM=270*Math.PI/180; let ang=0, angVel=0, drag=null; const ray=new T.Raycaster(), ndc=new T.Vector2();
const angEl=document.getElementById('ang'), toastEl=document.getElementById('toast'); let tt=0;
function toast(t){ toastEl.textContent=t; toastEl.style.opacity=1; clearTimeout(tt); tt=setTimeout(()=>toastEl.style.opacity=0,1200); }
function hit(e){ const r=renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(ndc,camera); const h=ray.intersectObjects([wheel],true); return h[0]||null; }
function isWheelPart(o){ while(o){ if(o===wheel) return true; o=o.parent; } return false; }
function wheelScreen(){ const p=new T.Vector3(); wheel.getWorldPosition(p); p.project(camera); const r=renderer.domElement.getBoundingClientRect(); return {x:(p.x+1)/2*r.width+r.left,y:(1-p.y)/2*r.height+r.top}; }
function viewSign(){ // rotation about the wheel's +z appears clockwise to a viewer looking along +z
  const ax=V(0,0,1).applyQuaternion(wheelMount.getWorldQuaternion(new T.Quaternion())), cd=camera.getWorldDirection(new T.Vector3()); return cd.dot(ax)>=0?1:-1; }
const anims=[];
function press(c){ ensureAudio(); click(c.type==='paddle'?1400:2200);
  if(c.type==='button'){ anims.push({o:c.obj,k:'z',from:c.base+0.0025,to:c.base,t:0,d:0.18}); lastBtn=c.name; }
  else if(c.type==='rotary'){ c.step=(c.step+1)%8; c.obj.rotation.z=-c.step*Math.PI/4; lastBtn=c.name+' '+(c.step+1); }
  else { anims.push({o:c.obj,k:'rx',from:-0.25,to:0,t:0,d:0.22}); if(c.name==='UP') gear=Math.min(8,gear+1); else if(c.name==='DOWN') gear=Math.max(0,gear-1); lastBtn=c.name==='CLUTCH'?'CLUTCH':'GEAR '+(gear||'N'); }
  toast(lastBtn); drawDisplay(); }
const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{ if(drag) return; const h=hit(e); if(!h||!isWheelPart(h.object)) return;
  let c=null; for(let o=h.object;o&&o!==wheel&&!c;o=o.parent) c=CLICK.get(o)||null; if(c){ press(c); e.stopImmediatePropagation(); controls.enabled=false; setTimeout(()=>controls.enabled=true,0); return; }
  e.stopImmediatePropagation(); controls.enabled=false; const s=wheelScreen(); drag={id:e.pointerId,last:Math.atan2(e.clientY-s.y,e.clientX-s.x),sign:viewSign()}; try{cv.setPointerCapture(e.pointerId);}catch(_){} },true);
cv.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==drag.id) return; e.stopImmediatePropagation(); const s=wheelScreen(); const a=Math.atan2(e.clientY-s.y,e.clientX-s.x); let d=a-drag.last; d=Math.atan2(Math.sin(d),Math.cos(d)); drag.last=a;
  const prev=ang; ang=Math.max(-LIM,Math.min(LIM,ang+d*drag.sign)); if((ang===LIM||ang===-LIM)&&prev!==ang) click(500); },true);
function endDrag(e){ if(!drag||(e&&e.pointerId!==undefined&&e.pointerId!==drag.id)) return; drag=null; controls.enabled=true; }
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>cv.addEventListener(ev,endDrag,true)); addEventListener('blur',()=>{ drag=null; controls.enabled=true; });
addEventListener('keydown',e=>{ if(e.key==='ArrowLeft') ang=Math.max(-LIM,ang-0.15); if(e.key==='ArrowRight') ang=Math.min(LIM,ang+0.15); });

/* ---------- tiny click audio ---------- */
let actx=null; function ensureAudio(){ try{ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume(); }catch(e){} }
function click(f){ if(!actx) return; const t=actx.currentTime, o=actx.createOscillator(), g=actx.createGain(); o.type='square'; o.frequency.value=f; g.gain.setValueAtTime(0.06,t); g.gain.exponentialRampToValueAtTime(0.0005,t+0.04); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+0.05); }

/* ---------- cameras ---------- */
const CAMS={ eye:{p:V(0,0.79,-0.52),t:V(0,0.52,0.6),fov:64}, tq:{p:V(1.55,1.35,1.45),t:V(0,0.45,-0.1),fov:45}, wheel:{p:V(0.07,0.64,-0.3),t:V(0,0.555,0.0),fov:42} };
let camAnim=null;
function setCam(k,instant){ const c=CAMS[k]; document.querySelectorAll('[data-cam]').forEach(b=>b.classList.toggle('on',b.dataset.cam===k));
  if(instant){ camera.position.copy(c.p); controls.target.copy(c.t); camera.fov=c.fov; camera.updateProjectionMatrix(); controls.update(); return; }
  camAnim={fp:camera.position.clone(),ft:controls.target.clone(),ff:camera.fov,c,t:0}; }
document.querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
setCam('eye',true);

/* ---------- GLB export ---------- */
function exportGLB(){ return new Promise((res,rej)=>{ try{ new T.GLTFExporter().parse(root,r=>res(r),{binary:true,onlyVisible:true,maxTextureSize:1024}); }catch(e){ rej(e); } }); }
document.getElementById('bGlb').addEventListener('click',async()=>{ toast('Exporting…'); try{ const ab=await exportGLB(); const blob=new Blob([ab],{type:'model/gltf-binary'}); const f=new File([blob],'cockpit.glb',{type:'model/gltf-binary'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:'cockpit.glb'}); return; }catch(e){} }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='cockpit.glb'; document.body.appendChild(a); a.click(); a.remove(); toast('cockpit.glb ('+Math.round(ab.byteLength/1024)+' KB)'); }catch(e){ console.warn(e); toast('Export failed'); } });

/* ---------- loop ---------- */
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
const clock=new T.Clock(); let lastDeg=null;
function frame(){ requestAnimationFrame(frame); const rdt=Math.min(0.5,clock.getDelta()), nsub=Math.max(1,Math.ceil(rdt/0.008)), dt=rdt/nsub;
  if(!drag){ // spring back to centre (slightly underdamped like a self-aligning rack)
    const k=60, c=12; for(let i=0;i<nsub;i++){ angVel+=(-k*ang-c*angVel)*dt; ang+=angVel*dt; } if(Math.abs(ang)<1e-4&&Math.abs(angVel)<1e-3){ ang=0; angVel=0; } } else angVel=0;
  wheel.rotation.z=ang; steerDeg=ang*180/Math.PI; /* + = clockwise from the driver seat (right turn) */ const dd=Math.round(steerDeg); if(dd!==lastDeg){ lastDeg=dd; angEl.textContent=(dd>0?'+':'')+dd+'°'; drawDisplay(); drawLeds(); }
  for(let i=anims.length-1;i>=0;i--){ const a=anims[i]; a.t+=rdt; const f=Math.min(1,a.t/a.d), v=a.from+(a.to-a.from)*f; if(a.k==='z') a.o.position.z=v; else a.o.rotation.x=v; if(f>=1) anims.splice(i,1); }
  if(camAnim){ camAnim.t=Math.min(1,camAnim.t+rdt/0.7); const e=camAnim.t<.5?2*camAnim.t*camAnim.t:1-Math.pow(-2*camAnim.t+2,2)/2; camera.position.lerpVectors(camAnim.fp,camAnim.c.p,e); controls.target.lerpVectors(camAnim.ft,camAnim.c.t,e); camera.fov=camAnim.ff+(camAnim.c.fov-camAnim.ff)*e; camera.updateProjectionMatrix(); if(camAnim.t>=1) camAnim=null; }
  if(!window.__noCtl) controls.update(); renderer.render(scene,camera); }
frame();
window.__ck={get ang(){return ang;}, wheel, wheelScreen, setCam, exportGLB, root, camera, get gear(){return gear;}, get lastBtn(){return lastBtn;}};
})();
