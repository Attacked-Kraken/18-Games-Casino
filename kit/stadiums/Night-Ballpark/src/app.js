(function(){
'use strict';
const T=THREE, D2R=Math.PI/180;
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=0.95;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new T.Scene(); scene.background=new T.Color(0x060a16); scene.fog=new T.Fog(0x060a16,420,1300);
const pmrem=new T.PMREMGenerator(renderer); scene.environment=pmrem.fromScene(new T.RoomEnvironment(),0.04).texture;
const camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,0.3,2500);
const controls=new T.OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=0.08; controls.minDistance=3; controls.maxDistance=650; controls.maxPolarAngle=88*D2R;
const root=new T.Group(); root.name='ApexArcadePark'; scene.add(root);
// lighting: stadium lights simulated by a strong shadowed key from above plate side + fills
scene.add(new T.HemisphereLight(0xcfe0ff,0x1a2a12,0.35));
const key=new T.DirectionalLight(0xfff4e0,1.7); key.position.set(60,220,90); key.target.position.set(0,0,-55); scene.add(key.target);
key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.bias=-0.0006; key.shadow.normalBias=0.4;
Object.assign(key.shadow.camera,{left:-175,right:175,top:175,bottom:-175,near:50,far:500}); scene.add(key);
const fill=new T.DirectionalLight(0xdfe8ff,0.9); fill.position.set(-120,160,-200); scene.add(fill);
const fill2=new T.DirectionalLight(0xffffff,0.5); fill2.position.set(0,120,200); scene.add(fill2);

/* ---------- helpers ---------- */
function cvs(w,h,f){ const c=document.createElement('canvas'); c.width=w; c.height=h; f(c.getContext('2d'),w,h); return c; }
function tex(c,srgb,rep){ const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=8; if(srgb!==false) t.encoding=T.sRGBEncoding; return t; }
const std=(o)=>new T.MeshStandardMaterial(o);
const rnd=(()=>{ let s=1234567; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })();
const SPONSOR='APEX ARCADE', PARK='APEX ARCADE PARK';

/* ---------- field geometry (meters; home plate at origin, center field toward -Z) ---------- */
const fence=th=>100+22*Math.cos(2*th);           // 328 ft lines, 400 ft center
const C={x:0,z:-52};                               // bowl center
function distF(x,z){ const r=Math.hypot(x,z), th=Math.atan2(x,-z);
  if(Math.abs(th)<=Math.PI/4) return Math.max(0,r-fence(th));
  const s=Math.sign(th)||1, ex=s*0.7071, ez=-0.7071; let t=Math.max(0,Math.min(100,x*ex+z*ez)); return Math.hypot(x-ex*t,z-ez*t); }
function gapAt(x,z){ const th=Math.abs(Math.atan2(x,-z)); return th<=Math.PI/4+0.01?1.5:(th>2.6?18:15); }
const NR=360, R=new Float32Array(NR);
for(let i=0;i<NR;i++){ const p=i*D2R; let r=0; for(;r<200;r+=0.25){ const x=C.x+Math.sin(p)*r, z=C.z-Math.cos(p)*r; if(distF(x,z)>=gapAt(x,z)) break; } R[i]=r; }
for(let pass=0;pass<4;pass++){ const c=R.slice(); for(let i=0;i<NR;i++){ let s=0; for(let k=-3;k<=3;k++) s+=c[(i+k+NR)%NR]; R[i]=s/7; } }
const Rf=d=>{ d=((d%360)+360)%360; const i=Math.floor(d), f=d-i; return R[i%NR]*(1-f)+R[(i+1)%NR]*f; };
const Pt=(d,off)=>{ const r=Rf(d)+off, p=d*D2R; return [C.x+Math.sin(p)*r, C.z-Math.cos(p)*r]; };

/* ---------- ground texture (painted top-down in meters) ---------- */
const GX0=-170,GZ0=-300,GS=340,GPX=2048,s=GPX/GS;
const groundTex=tex(cvs(GPX,GPX,(g)=>{ g.setTransform(s,0,0,s,-GX0*s,-GZ0*s);
  g.fillStyle='#2e6a29'; g.fillRect(GX0,GZ0,GS,GS);
  // mowed checkerboard stripes (diagonal)
  g.save(); g.rotate(Math.PI/4); for(let i=-60;i<60;i++) for(let j=-60;j<60;j++){ if((i+j)&1) continue; g.fillStyle='rgba(190,255,150,0.04)'; g.fillRect(i*7,j*7,7,7);} g.restore();
  for(let i=0;i<90000;i++){ g.fillStyle=rnd()<.5?'rgba(0,0,0,.06)':'rgba(255,255,255,.04)'; g.fillRect(GX0+rnd()*GS,GZ0+rnd()*GS,0.35,0.35); }
  // warning track along wall & stands
  g.strokeStyle='#8b5b3d'; g.lineWidth=6; g.beginPath(); for(let d=0;d<=360;d+=1){ const p=Pt(d,-3); d?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]); } g.closePath(); g.stroke();
  g.fillStyle='#8b5b3d'; g.beginPath(); for(let d=0;d<=360;d+=1){ const p=Pt(d,0); d?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]); } for(let d=360;d>=0;d-=1){ const p=Pt(d,40); g.lineTo(p[0],p[1]); } g.fill('evenodd');
  g.fillStyle='#24262b'; g.beginPath(); g.rect(GX0,GZ0,GS,GS); for(let d=0;d<=360;d+=1){ const p=Pt(d,12); d?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]); } g.closePath(); g.fill('evenodd');
  const clay='#b06a3e';
  g.save(); g.beginPath(); g.moveTo(0,4); g.lineTo(-60,-60); g.lineTo(60,-60); g.closePath(); g.clip();
  g.fillStyle=clay; g.beginPath(); g.arc(0,-18.44,29,0,7); g.fill(); g.restore();
  // infield grass
  const cx=0,cz=-19.4,k=0.885; g.fillStyle='#2f6c2a'; g.beginPath(); [[0,0],[19.4,-19.4],[0,-38.8],[-19.4,-19.4]].forEach((p,i)=>{ const x=cx+(p[0]-cx)*k, z=cz+(p[1]-cz)*k; i?g.lineTo(x,z):g.moveTo(x,z); }); g.fill();
  g.save(); g.clip(); g.rotate(Math.PI/4); for(let i=-10;i<10;i++) for(let j=-10;j<10;j++){ if((i+j)&1) continue; g.fillStyle='rgba(190,255,150,0.04)'; g.fillRect(i*7,j*7,7,7);} g.restore();
  g.fillStyle=clay; g.beginPath(); g.arc(0,-0.3,4,0,7); g.fill(); g.beginPath(); g.arc(0,-18.44,2.74,0,7); g.fill();
  [[19.4,-19.4],[-19.4,-19.4]].forEach(p=>{ g.beginPath(); g.arc(p[0],p[1],2.2,0,7); g.fill(); });
  // bullpens in foul corners
  [-1,1].forEach(sd=>{ g.save(); g.translate(sd*0.7071*78+sd*0.7071*9, -0.7071*78+0.7071*9); g.rotate(sd*-Math.PI/4); g.fillStyle='#9a6140'; g.fillRect(-3.5,-11,7,22); g.restore(); });
  // chalk
  g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=0.16;
  [-1,1].forEach(sd=>{ g.beginPath(); g.moveTo(sd*0.3,-0.3); g.lineTo(sd*70.7,-70.7); g.stroke(); g.strokeRect(sd>0?0.33:-1.55,-1.2,1.22,1.83); });
  g.beginPath(); g.moveTo(-0.55,0.75); g.lineTo(-0.55,2.6); g.lineTo(0.55,2.6); g.lineTo(0.55,0.75); g.stroke();
  [-1,1].forEach(sd=>{ g.strokeRect(sd*21-3,-2,6,0.01); g.fillStyle='rgba(20,30,60,.85)'; g.beginPath(); g.arc(sd*13,5,1.5,0,7); g.fill(); g.strokeStyle='rgba(255,255,255,.9)'; g.stroke(); });
  // logo mowed behind home plate
  g.save(); g.translate(0,13); g.fillStyle='rgba(255,255,255,.13)'; g.font='bold 3.2px sans-serif'; g.textAlign='center'; g.fillText(SPONSOR,0,0); g.restore();
}));
const ground=new T.Mesh(new T.PlaneGeometry(GS,GS),std({name:'Field',map:groundTex,roughness:0.92}));
ground.rotation.x=-Math.PI/2; ground.position.set(GX0+GS/2,0,GZ0+GS/2); ground.receiveShadow=true; root.add(ground);


/* ---------- field objects ---------- */
const white=std({name:'Base',color:0xf4f4f0,roughness:0.6});
const clayM=std({name:'Clay',color:0xa2633a,roughness:0.95});
const mound=new T.Mesh(new T.CylinderGeometry(1.2,2.74,0.25,40),clayM); mound.position.set(0,0.125,-18.44); mound.receiveShadow=true; root.add(mound);
const rubber=new T.Mesh(new T.BoxGeometry(0.61,0.04,0.15),white); rubber.position.set(0,0.26,-18.0); root.add(rubber);
[[19.4,-19.4],[0,-38.8],[-19.4,-19.4]].forEach(p=>{ const b=new T.Mesh(new T.BoxGeometry(0.38,0.08,0.38),white); b.position.set(p[0],0.04,p[1]); b.rotation.y=Math.PI/4; b.castShadow=true; root.add(b); });
const hp=new T.Shape(); hp.moveTo(-0.216,0); hp.lineTo(0.216,0); hp.lineTo(0.216,0.216); hp.lineTo(0,0.432); hp.lineTo(-0.216,0.216); hp.closePath();
const hpm=new T.Mesh(new T.ShapeGeometry(hp),white); hpm.rotation.x=-Math.PI/2; hpm.position.set(0,0.02,-0.43+0.43); hpm.rotation.z=Math.PI; hpm.position.z=-0.43; root.add(hpm);
[[0,-78],[-1,1]].length; [-1,1].forEach(sd=>{ const m=new T.Mesh(new T.CylinderGeometry(0.6,2.2,0.22,24),clayM); m.position.set(sd*0.7071*87-sd*0.7071*0, 0.11, -0.7071*69); m.position.set(sd*(0.7071*78+0.7071*9)+sd*0.7071*6*(-1)*0, 0.11,-0.7071*78+0.7071*9-4); root.add(m); });

/* ---------- outfield wall with padding + ads ---------- */
const wallTex=tex(cvs(1024,96,(g,w,h)=>{ g.fillStyle='#163a2a'; g.fillRect(0,0,w,h);
  g.fillStyle='#0f2a1e'; for(let x=0;x<w;x+=32) g.fillRect(x,0,2,h);
  g.fillStyle='#f2c230'; g.fillRect(0,0,w,5);
  g.fillStyle='#0d1b3a'; g.fillRect(560,14,440,72); g.strokeStyle='#ff8a1c'; g.lineWidth=4; g.strokeRect(562,16,436,68);
  g.font='900 46px Arial Black,Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#ff9a2a'; g.fillText(SPONSOR,780,52); }));
const wallM=std({name:'OutfieldWallPadding',map:wallTex,roughness:0.85});
function stripGeo(pts,y0,y1,period){ // pts [[x,z]...] vertical strip
  const pos=[],uv=[],idx=[]; let L=0;
  pts.forEach((p,i)=>{ if(i) L+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]); pos.push(p[0],y0,p[1],p[0],y1,p[1]); uv.push(L/period,0,L/period,1); if(i){ const a=(i-1)*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); } });
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(pos,3)); geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); geo.setIndex(idx); geo.computeVertexNormals(); return geo; }
const fencePts=[]; for(let a=-45;a<=45;a+=0.5){ const th=a*D2R, r=fence(th); fencePts.push([r*Math.sin(th),-r*Math.cos(th)]); }
const wall=new T.Mesh(stripGeo(fencePts,0,3.2,22),wallM); wall.material.side=T.DoubleSide; wall.castShadow=wall.receiveShadow=true; wall.name='OutfieldWall'; root.add(wall);
const yellowM=std({name:'FoulPoleYellow',color:0xffd21a,roughness:0.4,metalness:0.3,emissive:0x332800});
[-1,1].forEach(sd=>{ const p=new T.Mesh(new T.CylinderGeometry(0.22,0.28,28,12),yellowM); p.position.set(sd*70.7,14,-70.7); p.castShadow=true; root.add(p);
  const sc=new T.Mesh(new T.BoxGeometry(0.05,16,1.4),yellowM); sc.position.set(sd*70.7+sd*-0.5,18,-70.7+0.0); sc.rotation.y=sd*Math.PI/4; sc.position.x-=sd*0.5; sc.position.z-=0.5; root.add(sc); });
// distance markers
[[0,'400'],[-22,'375'],[22,'375'],[-45,'328'],[45,'328']].forEach(([a,t])=>{ const th=a*D2R*0.97, r=fence(a*D2R)-0.05;
  const c=cvs(128,64,(g)=>{ g.font='900 54px Arial'; g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,64,34); });
  const m=new T.Mesh(new T.PlaneGeometry(3,1.5),new T.MeshBasicMaterial({map:tex(c),transparent:true,toneMapped:false})); m.position.set(r*Math.sin(th),2.0,-r*Math.cos(th)); m.lookAt(0,2,0); m.translateZ(0.06); root.add(m); });

/* ---------- seating bowl ---------- */
const concreteM=std({name:'Concrete',color:0x9a9ca2,roughness:0.9,vertexColors:true});
const SEAT=[new T.Color(0x1d3f8a),new T.Color(0x1a3880)], AISLE=new T.Color(0x8a8c92), RISER=new T.Color(0x6d7078);
const fanSlots=[];
function tier(a0,a1,off,h0,rows,depth,rise,aisleEvery){
  const pos=[],col=[]; const step=2;
  const push=(x,y,z,c)=>{ pos.push(x,y,z); col.push(c.r,c.g,c.b); };
  const quad=(p,c)=>{ [0,1,2,0,2,3].forEach(i=>push(p[i][0],p[i][1],p[i][2],c)); };
  let seg=0;
  for(let d=a0; d<a1-1e-6; d+=step, seg++){
    const e=Math.min(a1,d+step), aisle=(seg%aisleEvery)===0;
    // front wall
    { const A=Pt(d,off),B=Pt(e,off); quad([[A[0],0,A[1]],[B[0],0,B[1]],[B[0],h0,B[1]],[A[0],h0,A[1]]],RISER); }
    for(let k=0;k<rows;k++){
      const ri=off+k*depth, ro=ri+depth, y=h0+k*rise, yn=y+rise;
      const A=Pt(d,ri),B=Pt(e,ri),Ao=Pt(d,ro),Bo=Pt(e,ro);
      quad([[A[0],y,A[1]],[B[0],y,B[1]],[Bo[0],y,Bo[1]],[Ao[0],y,Ao[1]]], aisle?AISLE:SEAT[k&1]);
      if(k<rows-1) quad([[Ao[0],y,Ao[1]],[Bo[0],y,Bo[1]],[Bo[0],yn,Bo[1]],[Ao[0],yn,Ao[1]]], RISER);
      if(!aisle){ const len=Math.hypot(B[0]-A[0],B[1]-A[1]), n=Math.max(1,Math.floor(len/0.52));
        for(let q=0;q<n;q++){ const f=(q+0.5)/n, dd=d+(e-d)*f, P=Pt(dd,ri+depth*0.55); fanSlots.push([P[0],y,P[1],dd]); } }
    }
    const top=h0+(rows-1)*rise, A=Pt(d,off+rows*depth),B=Pt(e,off+rows*depth);
    quad([[A[0],top,A[1]],[B[0],top,B[1]],[B[0],top+2.6,B[1]],[A[0],top+2.6,A[1]]],RISER);
    quad([[A[0],0,A[1]],[B[0],0,B[1]],[B[0],top,B[1]],[A[0],top,A[1]]],RISER);
  }
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(pos,3)); geo.setAttribute('color',new T.Float32BufferAttribute(col,3)); geo.computeVertexNormals();
  const m=new T.Mesh(geo,concreteM); m.material.side=T.DoubleSide; m.castShadow=true; m.receiveShadow=true; root.add(m); return m;
}
const L={off:0,h0:1.1,rows:26,depth:0.85,rise:0.38}; const lowTop=L.off+L.rows*L.depth, lowY=L.h0+L.rows*L.rise;
tier(58,302,L.off,L.h0,L.rows,L.depth,L.rise,9).name='LowerDeck';
tier(14,58,0,1.1,18,0.85,0.38,9).name='BleachersLeft';
tier(302,346,0,1.1,18,0.85,0.38,9).name='BleachersRight';
const U={off:25,h0:18.2,rows:28,depth:0.82,rise:0.56}; const upTop=U.off+U.rows*U.depth, upY=U.h0+U.rows*U.rise;
tier(62,298,U.off,U.h0,U.rows,U.depth,U.rise,10).name='UpperDeck';

/* bands (fascias, ribbons, glass, facade) */
function band(a0,a1,off,y0,y1,mat,period,name){ const pts=[]; for(let d=a0;d<=a1+1e-6;d+=1) pts.push(Pt(d,off)); const m=new T.Mesh(stripGeo(pts,y0,y1,period),mat); m.name=name||''; root.add(m); return m; }
function slab(a0,a1,o0,o1,y,th,mat,name){ const pos=[],idx=[]; let n=0; for(let d=a0;d<=a1+1e-6;d+=1.5){ const A=Pt(d,o0),B=Pt(d,o1); pos.push(A[0],y,A[1],B[0],y,B[1],A[0],y-th,A[1],B[0],y-th,B[1]); if(n){ const a=(n-1)*4,b=n*4; idx.push(a,b,a+1,b,b+1,a+1, a+2,a+3,b+2,b+2,a+3,b+3, a,a+2,b,b,a+2,b+2, a+1,b+1,a+3,b+1,b+3,a+3);} n++; }
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(pos,3)); geo.setIndex(idx); geo.computeVertexNormals(); const m=new T.Mesh(geo,mat); m.name=name||''; m.castShadow=m.receiveShadow=true; root.add(m); return m; }
function ribbonTex(bg,fg,accent){ return tex(cvs(1024,64,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,bg[0]); gr.addColorStop(1,bg[1]); g.fillStyle=gr; g.fillRect(0,0,w,h);
  g.font='900 40px Arial Black,Arial'; g.textBaseline='middle'; g.fillStyle=fg; g.fillText(PARK,30,34); g.fillStyle=accent; g.fillText('★',470,34); g.fillStyle=fg; g.fillText(SPONSOR,540,34); g.fillStyle=accent; g.fillText('★',960,34);
  g.fillStyle='rgba(0,0,0,.25)'; for(let x=0;x<w;x+=3) g.fillRect(x,0,1,h); for(let y=0;y<h;y+=3) g.fillRect(0,y,w,1); })); }
const ribbonA=ribbonTex(['#0a1440','#060c28'],'#ff9a2a','#ffe14a'), ribbonB=ribbonTex(['#ff7a12','#d84d00'],'#ffffff','#0b1640');
const ribM=(t)=>new T.MeshStandardMaterial({name:'RibbonBoard',map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:1.1,roughness:0.5,side:T.DoubleSide});
const padM=std({name:'BackstopPadding',color:0x14244e,roughness:0.8,side:T.DoubleSide});
band(58,150,-0.02,0,L.h0,padM,10,'FrontPad'); band(210,302,-0.02,0,L.h0,padM,10,'FrontPad');
band(150,210,-0.03,0,L.h0,ribM(ribbonB),26,'HomePlateLED');
band(14,346,-0.06,L.h0,L.h0+0.05,std({color:0x222,metalness:1,roughness:0.4}),10);
// railings (glass + metal top rail)
const railM=std({name:'Railing',color:0xb8bcc4,metalness:1,roughness:0.3,side:T.DoubleSide});
const glassM=new T.MeshPhysicalMaterial({name:'Glass',color:0x9fc4e6,metalness:0,roughness:0.05,transmission:0,transparent:true,opacity:0.28,side:T.DoubleSide,depthWrite:false});
band(58,302,-0.02,L.h0,L.h0+1.0,glassM,10,'LowerGlassRail'); band(58,302,-0.03,L.h0+1.0,L.h0+1.08,railM,10);
band(62,298,U.off-0.05,U.h0,U.h0+1.0,glassM,10,'UpperGlassRail'); band(62,298,U.off-0.06,U.h0+1.0,U.h0+1.08,railM,10);
// club level: fascia ribbon, suites glass, slabs
band(58,302,lowTop+0.2,lowY,lowY+1.6,ribM(ribbonA),28,'ClubRibbon');
const suiteTex=tex(cvs(256,64,(g,w,h)=>{ g.fillStyle='#ffd9a0'; g.fillRect(0,0,w,h); for(let i=0;i<8;i++){ g.fillStyle='rgba(60,40,20,'+(0.3+rnd()*.4)+')'; g.fillRect(i*32+2,6,28,h-12);} g.fillStyle='#222'; for(let x=0;x<w;x+=32) g.fillRect(x,0,3,h); }));
band(62,298,lowTop+1.2,lowY+1.6,U.h0-1.2,new T.MeshStandardMaterial({name:'SuiteWindows',map:suiteTex,emissiveMap:suiteTex,emissive:0xffffff,emissiveIntensity:0.55,roughness:0.15,metalness:0.4,side:T.DoubleSide}),8,'Suites');
const facadeM=std({name:'ConcreteFascia',color:0x7e8189,roughness:0.85,side:T.DoubleSide});
slab(58,302,lowTop,lowTop+6,lowY+1.6,0.6,facadeM,'ClubDeck'); slab(62,298,lowTop+1.2,U.off+2,U.h0,1.2,facadeM,'UpperDeckSlab');
band(62,298,U.off-0.1,U.h0-1.4,U.h0,ribM(ribbonA),28,'UpperRibbon');
// roof canopy
const roofM=std({name:'Roof',color:0x5c6068,metalness:0.6,roughness:0.5,side:T.DoubleSide});
slab(60,300,U.off+8,upTop+5,upY+9,1.0,roofM,'RoofCanopy');
band(60,300,U.off+7.9,upY+7.4,upY+9,ribM(ribbonB),30,'RoofFascia');
for(let d=66;d<=294;d+=12){ const P=Pt(d,upTop+1); const c=new T.Mesh(new T.CylinderGeometry(0.35,0.35,9.5,8),railM); c.position.set(P[0],upY+4.2,P[1]); root.add(c); }
// outer facade with concourse arches + park name
const archTex=tex(cvs(256,256,(g,w,h)=>{ g.fillStyle='#8c7a68'; g.fillRect(0,0,w,h); for(let y=0;y<h;y+=8) for(let x=(y/8&1)*8;x<w;x+=16){ g.fillStyle='rgba(0,0,0,'+(0.05+rnd()*0.08)+')'; g.fillRect(x,y,15,7);} 
  for(let r=0;r<2;r++){ const y0=r*128+20; g.fillStyle='#ffcb7a'; g.beginPath(); g.moveTo(48,y0+100); g.lineTo(48,y0+40); g.arc(128,y0+40,80,Math.PI,0); g.lineTo(208,y0+100); g.fill(); g.fillStyle='rgba(80,40,10,.35)'; g.fillRect(48,y0+80,160,20);} }));
const archE=tex(cvs(256,256,(g,w,h)=>{ g.fillStyle='#000'; g.fillRect(0,0,w,h); for(let r=0;r<2;r++){ const y0=r*128+20; g.fillStyle='#b07a30'; g.beginPath(); g.moveTo(48,y0+100); g.lineTo(48,y0+40); g.arc(128,y0+40,80,Math.PI,0); g.lineTo(208,y0+100); g.fill(); } }));
const archM=new T.MeshStandardMaterial({name:'FacadeArches',map:archTex,emissiveMap:archE,emissive:0xffffff,emissiveIntensity:0.9,roughness:0.9,side:T.DoubleSide});
archTex.repeat.set(1,4); archE.repeat.set(1,4);
band(60,300,upTop+0.5,0,upY+3,archM,8,'FacadeConcourseArches');
const nameTex=tex(cvs(2048,128,(g,w,h)=>{ g.fillStyle='#0b1235'; g.fillRect(0,0,w,h); g.font='900 92px Arial Black,Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#ff9a2a'; g.fillText(PARK+'   ★   '+PARK,w/2,68); }));
band(150,210,upTop+0.6,upY+3,upY+7.4,new T.MeshStandardMaterial({name:'ParkName',map:nameTex,emissiveMap:nameTex,emissive:0xffffff,emissiveIntensity:1,side:T.DoubleSide}),200,'ParkNameSign');
band(14,58,15.3,0,9.5,archM,8); band(302,346,15.3,0,9.5,archM,8);
band(14,58,15.2,8.1,9.6,ribM(ribbonA),28,'BleacherRibbon'); band(302,346,15.2,8.1,9.6,ribM(ribbonA),28,'BleacherRibbon');
// backstop net
const netTex=tex(cvs(64,64,(g)=>{ g.strokeStyle='rgba(30,30,30,.9)'; g.lineWidth=2; for(let i=0;i<=64;i+=16){ g.beginPath(); g.moveTo(i,0); g.lineTo(i,64); g.stroke(); g.beginPath(); g.moveTo(0,i); g.lineTo(64,i); g.stroke(); } }));
band(140,220,-0.4,L.h0,11,new T.MeshBasicMaterial({name:'BackstopNet',map:netTex,transparent:true,opacity:0.35,side:T.DoubleSide,depthWrite:false}),0.25,'BackstopNet');

/* ---------- dugouts ---------- */
const dugM=std({name:'Dugout',color:0x1a2236,roughness:0.8}), dugRoof=std({name:'DugoutRoof',color:0x14244e,roughness:0.6});
[-1,1].forEach(sd=>{ const g=new T.Group(); g.name=sd>0?'Dugout_1B':'Dugout_3B'; const d=sd>0?122:238; const P=Pt(d,-1.2), Q=Pt(d,0); g.position.set(P[0],0,P[1]); g.lookAt(C.x,0,C.z);
  const back=new T.Mesh(new T.BoxGeometry(22,2.4,0.4),dugM); back.position.set(0,0.2,-1.2); g.add(back);
  const roof=new T.Mesh(new T.BoxGeometry(22.4,0.35,2.8),dugRoof); roof.position.set(0,1.45,0.1); roof.castShadow=true; g.add(roof);
  const pit=new T.Mesh(new T.BoxGeometry(22,0.05,2.4),std({color:0x0a0c12})); pit.position.set(0,0.02,0); g.add(pit);
  const bench=new T.Mesh(new T.BoxGeometry(20,0.45,0.5),railM); bench.position.set(0,-0.1,-0.8); g.add(bench);
  const rail=new T.Mesh(new T.BoxGeometry(22,0.06,0.06),railM); rail.position.set(0,1.0,1.4); g.add(rail);
  for(let i=0;i<8;i++){ const pl=person(0xf2f2f2,0xf2f2f2,0x14244e); pl.position.set(-8+i*2.2,-0.45,-0.6); g.add(pl); }
  root.add(g); });

/* ---------- players ---------- */
function person(shirt,pants,cap){ const g=new T.Group(); const sk=std({color:0xc58c62,roughness:0.7});
  const sh=std({name:'Uniform',color:shirt,roughness:0.75}), pa=std({name:'Pants',color:pants,roughness:0.75}), cp=std({name:'Cap',color:cap,roughness:0.6});
  [-0.11,0.11].forEach(x=>{ const l=new T.Mesh(new T.CylinderGeometry(0.075,0.06,0.9,8),pa); l.position.set(x,0.45,0); l.castShadow=true; g.add(l); const sock=new T.Mesh(new T.CylinderGeometry(0.062,0.06,0.3,8),cp); sock.position.set(x,0.17,0); g.add(sock); const sh2=new T.Mesh(new T.BoxGeometry(0.11,0.07,0.26),std({color:0x111111})); sh2.position.set(x,0.035,0.05); g.add(sh2); });
  const t=new T.Mesh(new T.CylinderGeometry(0.2,0.16,0.62,10),sh); t.position.y=1.21; t.castShadow=true; g.add(t);
  [-0.25,0.25].forEach(x=>{ const a=new T.Mesh(new T.CylinderGeometry(0.05,0.045,0.6,6),sh); a.position.set(x,1.18,0); a.rotation.z=x>0?0.15:-0.15; a.castShadow=true; g.add(a); });
  const h=new T.Mesh(new T.SphereGeometry(0.12,12,10),sk); h.position.y=1.66; g.add(h);
  const c=new T.Mesh(new T.SphereGeometry(0.125,12,8,0,Math.PI*2,0,Math.PI/2),cp); c.position.y=1.68; g.add(c); const b=new T.Mesh(new T.BoxGeometry(0.2,0.02,0.14),cp); b.position.set(0,1.69,0.15); g.add(b);
  return g; }
const HOME=[0xf3f3ef,0xf3f3ef,0x14244e], AWAY=[0x8e939b,0x8e939b,0xc0461a];
[['Pitcher',0,-18.44],['FirstBase',21,-24],['SecondBase',9,-36],['Shortstop',-9,-36],['ThirdBase',-21,-24],['LeftField',-52,-82],['CenterField',0,-98],['RightField',52,-82]].forEach(([n,x,z])=>{ const p=person(...HOME); p.name=n; p.position.set(x,n==='Pitcher'?0.25:0,z); p.lookAt(0,p.position.y,0); root.add(p); });
const catcher=person(...HOME); catcher.name='Catcher'; catcher.position.set(0,-0.45,1.3); catcher.lookAt(0,-0.45,-20); root.add(catcher);
const ump=person(0x1a1a1a,0x5a5a5e,0x111111); ump.name='Umpire'; ump.position.set(0,0,2.3); ump.lookAt(0,0,-20); root.add(ump);
const batter=person(...AWAY); batter.name='Batter'; batter.position.set(-0.95,0,-0.3); batter.lookAt(1,0,-0.3); root.add(batter);
const bat=new T.Mesh(new T.CylinderGeometry(0.035,0.017,0.86,8),std({name:'Bat',color:0xc89a5a,roughness:0.5})); bat.position.set(-0.2,1.75,-0.25); bat.rotation.z=-0.5; batter.add(bat); bat.position.set(0.15,1.55,-0.2); bat.rotation.set(0.9,0,0.2);
const runner=person(...AWAY); runner.name='Runner'; runner.position.set(17,0,-21); runner.lookAt(0,0,-38.8); root.add(runner);

/* ---------- crowd (instanced) ---------- */
const PAL=[0xff7a12,0xff7a12,0xff7a12,0x14244e,0x14244e,0x14244e,0xffffff,0xffffff,0xd8d8d8,0x222222,0x2b6cd6,0xc0392b,0x2e8b57,0xf1c40f,0x8e44ad,0x7f8c8d,0xe67e22,0x3d3d3d,0x9b2335,0x4aa3df];
const SKIN=[0xf1c8a8,0xe0ac80,0xc58c62,0x9a6440,0x6b4428,0x4a2e1c];
const fans=fanSlots.filter(()=>rnd()<0.94);
const bodyG=new T.BoxGeometry(0.44,0.62,0.3); bodyG.translate(0,0.62,0);
const headG=new T.IcosahedronGeometry(0.12,1); headG.translate(0,1.07,0);
const uTime={value:0}, uWave={value:-99};
function crowdMat(name){ const m=std({name,roughness:0.9,color:0xb8b8b8}); m.onBeforeCompile=sh=>{ sh.uniforms.uTime=uTime; sh.uniforms.uWave=uWave;
  sh.vertexShader='uniform float uTime; uniform float uWave;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vec3 ip=instanceMatrix[3].xyz; float ph=atan(ip.x, -(ip.z+52.0));
  float bob=0.035*sin(uTime*3.1+ip.x*1.7+ip.z*2.3)+0.025*max(0.0,sin(uTime*1.3+ip.x*0.37));
  float dw=mod(ph-uWave+3.14159,6.28318)-3.14159; float wave=0.55*exp(-dw*dw*60.0);
  transformed.y+=bob+wave*(transformed.y>0.9?1.0:0.85);`); }; m.customProgramCacheKey=()=>'crowd'; return m; }
const bodies=new T.InstancedMesh(bodyG,crowdMat('CrowdShirts'),fans.length), heads=new T.InstancedMesh(headG,crowdMat('CrowdHeads'),fans.length);
bodies.name='CrowdBodies'; heads.name='CrowdHeads';
const mtx=new T.Matrix4(), q=new T.Quaternion(), Y=new T.Vector3(0,1,0), sc=new T.Vector3(), pv=new T.Vector3(), col=new T.Color();
fans.forEach((f,i)=>{ const yaw=Math.atan2(C.x-f[0],C.z-f[2])+(rnd()-.5)*0.4; q.setFromAxisAngle(Y,yaw); const k=0.9+rnd()*0.22; sc.set(k,k*(rnd()<0.2?1.12:1),k);
  pv.set(f[0]+(rnd()-.5)*0.08,f[1],f[2]); mtx.compose(pv,q,sc); bodies.setMatrixAt(i,mtx); heads.setMatrixAt(i,mtx);
  bodies.setColorAt(i,col.setHex(PAL[(rnd()*PAL.length)|0])); heads.setColorAt(i,col.setHex(SKIN[(rnd()*SKIN.length)|0])); });
root.add(bodies); root.add(heads);
document.getElementById('ang').textContent='Night game · '+fans.length.toLocaleString()+' fans';

/* ---------- light towers & roof light banks ---------- */
const bulbTex=tex(cvs(256,128,(g,w,h)=>{ g.fillStyle='#333'; g.fillRect(0,0,w,h); for(let y=0;y<4;y++) for(let x=0;x<8;x++){ const cx=16+x*32, cy=16+y*32, gr=g.createRadialGradient(cx,cy,1,cx,cy,14); gr.addColorStop(0,'#fff'); gr.addColorStop(.6,'#fff6dc'); gr.addColorStop(1,'#665'); g.fillStyle=gr; g.beginPath(); g.arc(cx,cy,13,0,7); g.fill(); } }));
const bulbM=new T.MeshStandardMaterial({name:'LightBank',map:bulbTex,emissiveMap:bulbTex,emissive:0xffffff,emissiveIntensity:2.2,toneMapped:false});
const glowTex=tex(cvs(128,128,(g)=>{ const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,250,230,1)'); gr.addColorStop(.25,'rgba(255,240,200,.45)'); gr.addColorStop(1,'rgba(255,240,200,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128); }));
const glows=[];
function lightBank(x,y,z,w){ const g=new T.Group(); g.position.set(x,y,z); const p=new T.Mesh(new T.BoxGeometry(w,w*0.5,0.6),[railM,railM,railM,railM,bulbM,railM]); g.add(p); g.lookAt(C.x,0,C.z); root.add(g);
  const sp=new T.Sprite(new T.SpriteMaterial({map:glowTex,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false})); sp.scale.set(w*3.2,w*3.2,1); sp.position.set(x,y,z); scene.add(sp); glows.push(sp); }
const towerM=std({name:'TowerSteel',color:0x707680,metalness:0.8,roughness:0.45});
[22,46,314,338].forEach(d=>{ const P=Pt(d,22); const h=58; const t=new T.Mesh(new T.CylinderGeometry(0.7,1.4,h,10),towerM); t.position.set(P[0],h/2,P[1]); t.castShadow=true; root.add(t); lightBank(P[0],h+2,P[1],12); });
[75,100,128,232,260,285].forEach(d=>{ const P=Pt(d,U.off+9); lightBank(P[0],upY+11.5,P[1],10); });

/* ---------- scoreboard + video board ---------- */
const vbC=document.createElement('canvas'); vbC.width=1024; vbC.height=512; const vbT=tex(vbC);
const msgs=[['NOW BATTING','#27  R. CALLOWAY','.312  AVG  ·  18 HR  ·  64 RBI'],['MAKE SOME NOISE!','APEX ARCADE PARK','PLAY MORE · CHEER LOUDER'],['APEX ARCADE','PITCH SPEED','97 MPH'],['WELCOME FANS','ATTENDANCE','41,350']];
let msgI=0;
function drawVB(){ const g=vbC.getContext('2d'), w=1024,h=512, m=msgs[msgI%msgs.length]; const gr=g.createLinearGradient(0,0,w,h); gr.addColorStop(0,'#0a1340'); gr.addColorStop(1,'#ff6a00'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,0,w,70); g.font='900 46px Arial Black,Arial'; g.textAlign='center'; g.fillStyle='#ffb347'; g.fillText(SPONSOR,w/2,52);
  g.fillStyle='#fff'; g.font='900 60px Arial Black,Arial'; g.fillText(m[0],w/2,170); g.font='900 92px Arial Black,Arial'; g.fillStyle='#ffe25a'; g.fillText(m[1],w/2,290); g.font='700 48px Arial'; g.fillStyle='#fff'; g.fillText(m[2],w/2,380);
  g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,430,w,82); g.font='800 40px Arial'; g.fillStyle='#fff'; g.fillText('VISITORS 2   ·   HOME 3   ·   BOT 7   ·   2 OUT   ·   B 2  S 1',w/2,486);
  g.fillStyle='rgba(0,0,0,.18)'; for(let y=0;y<h;y+=4) g.fillRect(0,y,w,1.5); vbT.needsUpdate=true; }
drawVB();
const lsT=tex(cvs(1024,192,(g,w,h)=>{ g.fillStyle='#07090f'; g.fillRect(0,0,w,h); g.font='800 30px Arial'; g.textBaseline='middle';
  const cols=['1','2','3','4','5','6','7','8','9','R','H','E'], v=[['0','1','0','0','1','0','0','',' ','2','6','1'],['1','0','0','2','0','0','0','',' ','3','8','0']];
  g.fillStyle='#ffb347'; cols.forEach((c,i)=>{ g.textAlign='center'; g.fillText(c,330+i*56,30); }); g.textAlign='left'; g.fillStyle='#fff'; g.fillText('VISITORS',30,90); g.fillText('HOME',30,150);
  v.forEach((r,j)=>r.forEach((c,i)=>{ g.textAlign='center'; g.fillStyle=i>8?'#ffe25a':'#f0f0f0'; g.fillText(c,330+i*56,90+j*60); })); }));
const sb=new T.Group(); sb.name='Scoreboard'; const SP=Pt(0,14); sb.position.set(SP[0],0,SP[1]); sb.lookAt(C.x,0,C.z);
const frameM=std({name:'BoardFrame',color:0x1a1d24,metalness:0.6,roughness:0.5});
const box=(w,h,d,m,x,y,z)=>{ const b=new T.Mesh(new T.BoxGeometry(w,h,d),m); b.position.set(x,y,z); b.castShadow=true; sb.add(b); return b; };
box(38,30,2,frameM,0,24,-1.2); [-14,0,14].forEach(x=>box(1.5,10,1.5,frameM,x,4.5,-1.2));
const scr=(w,h,t,y,name)=>{ const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({name,map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:1.25,roughness:0.3,toneMapped:false})); m.position.set(0,y,-0.15); sb.add(m); return m; };
scr(35,17.5,vbT,28.5,'VideoBoard'); scr(35,6.5,lsT,15.6,'LineScore');
const topSign=tex(cvs(1024,128,(g,w,h)=>{ g.fillStyle='#ff7a12'; g.fillRect(0,0,w,h); g.font='900 84px Arial Black,Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#fff'; g.fillText(PARK,w/2,68); }));
scr(34,4.2,topSign,41.8,'ParkNameTop');
root.add(sb);
// flags on scoreboard
const flags=[]; const FLC=[0xff7a12,0x14244e,0xffffff,0x14244e,0xff7a12];
FLC.forEach((c,i)=>{ const x=-16+i*8; const pole=new T.Mesh(new T.CylinderGeometry(0.12,0.12,9,6),railM); pole.position.set(x,43.5,-1.2); sb.add(pole);
  const fg=new T.PlaneGeometry(4,2.4,10,4); fg.translate(2,0,0); const f=new T.Mesh(fg,std({name:'Flag',color:c,roughness:0.8,side:T.DoubleSide})); f.position.set(x,46.6,-1.2); f.userData.base=fg.attributes.position.array.slice(); sb.add(f); flags.push(f); });

/* ---------- stars ---------- */
{ const p=[]; for(let i=0;i<1500;i++){ const th=rnd()*Math.PI*2, ph=rnd()*1.2; p.push(Math.cos(th)*Math.sin(ph)*1800, Math.cos(ph)*1800, Math.sin(th)*Math.sin(ph)*1800-52); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(p,3)); scene.add(new T.Points(g,new T.PointsMaterial({color:0xaab4d0,size:2,sizeAttenuation:false,fog:false}))); }

root.traverse(o=>{ if(o.material) [].concat(o.material).forEach(m=>{ if(m.envMapIntensity!==undefined) m.envMapIntensity=0.3; }); });
/* ---------- cameras ---------- */
const CAMS={home:[[0,4.2,13.5],[0,1.5,-40]],upper:[(p=>[p[0],U.h0+22*U.rise+2.4,p[1]])(Pt(232,U.off+22*U.depth)),[10,0,-40]],bleach:[(p=>[p[0],1.1+11*0.38+2.2,p[1]])(Pt(34,11*0.85)),[0,1,-10]],aerial:[[150,230,150],[0,0,-55]],field:[[-14,1.7,-30],[0,1.2,0]]};
let tw=null; function setCam(k,instant){ const c=CAMS[k]; if(!c) return; document.querySelectorAll('[data-cam]').forEach(b=>b.classList.toggle('on',b.dataset.cam===k));
  const to=[new T.Vector3(...c[0]),new T.Vector3(...c[1])]; if(instant){ camera.position.copy(to[0]); controls.target.copy(to[1]); controls.update(); return; }
  tw={t:0,fp:camera.position.clone(),ft:controls.target.clone(),to}; }
document.querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
setCam('home',true);
function toast(t){ const e=document.getElementById('toast'); e.textContent=t; e.style.opacity=1; clearTimeout(toast.h); toast.h=setTimeout(()=>e.style.opacity=0,1800); }
let waveT=-1; document.getElementById('bWave').addEventListener('click',()=>{ waveT=0; toast('The wave!'); });

/* ---------- GLB export (crowd baked to lightweight quads) ---------- */
function crowdLite(){ const pos=[],colA=[],idx=[]; const c1=new T.Color(),c2=new T.Color(); let n=0;
  for(let i=0;i<fans.length;i+=4){ bodies.getMatrixAt(i,mtx); const e=mtx.elements, x=e[12],y=e[13],z=e[14], dx=e[0]*0.24, dz=e[2]*0.24;
    bodies.getColorAt(i,c1); heads.getColorAt(i,c2);
    pos.push(x-dx,y+0.3,z-dz, x+dx,y+0.3,z+dz, x+dx*0.6,y+1.2,z+dz*0.6, x-dx*0.6,y+1.2,z-dz*0.6);
    colA.push(c1.r,c1.g,c1.b,c1.r,c1.g,c1.b,c2.r,c2.g,c2.b,c2.r,c2.g,c2.b); const a=n*4; idx.push(a,a+1,a+2,a,a+2,a+3); n++; }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('color',new T.Float32BufferAttribute(colA,3)); g.setIndex(idx); g.computeVertexNormals();
  const m=new T.Mesh(g,std({name:'CrowdLite',vertexColors:true,roughness:0.9,side:T.DoubleSide})); m.name='Crowd'; return m; }
function exportGLB(){ return new Promise((res,rej)=>{ const lite=crowdLite(); bodies.visible=heads.visible=false; root.add(lite);
  const done=()=>{ root.remove(lite); bodies.visible=heads.visible=true; };
  try{ new T.GLTFExporter().parse(root,r=>{ done(); res(r); },{binary:true,onlyVisible:true,maxTextureSize:512}); }catch(e){ done(); rej(e); } }); }
document.getElementById('bGlb').addEventListener('click',async()=>{ toast('Exporting…'); try{ const ab=await exportGLB(); const blob=new Blob([ab],{type:'model/gltf-binary'}); const f=new File([blob],'stadium.glb',{type:'model/gltf-binary'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:'stadium.glb'}); return; }catch(e){} }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='stadium.glb'; document.body.appendChild(a); a.click(); a.remove(); toast('stadium.glb ('+Math.round(ab.byteLength/1024)+' KB)'); }catch(e){ console.warn(e); toast('Export failed'); } });

/* ---------- loop ---------- */
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
const clock=new T.Clock(); let vbAcc=0;
function frame(){ const dt=Math.min(clock.getDelta(),0.05); uTime.value+=dt;
  if(waveT>=0){ waveT+=dt; uWave.value=Math.PI*0.35+waveT*1.1; if(waveT>5.2){ waveT=-1; uWave.value=-99; } }
  if(tw){ tw.t=Math.min(1,tw.t+dt/1.2); const e=tw.t<.5?2*tw.t*tw.t:1-Math.pow(-2*tw.t+2,2)/2; camera.position.lerpVectors(tw.fp,tw.to[0],e); controls.target.lerpVectors(tw.ft,tw.to[1],e); if(tw.t>=1) tw=null; }
  vbAcc+=dt; if(vbAcc>4){ vbAcc=0; msgI++; drawVB(); }
  flags.forEach((f,j)=>{ const a=f.geometry.attributes.position, b=f.userData.base; for(let i=0;i<a.count;i++){ const x=b[i*3]; a.array[i*3+2]=Math.sin(x*1.6-uTime.value*5+j)*0.25*x/4; } a.needsUpdate=true; });
  controls.update(); renderer.render(scene,camera); requestAnimationFrame(frame); }
frame();
window.__bp={setCam,exportGLB,root,camera,fans:fans.length,set wave(v){waveT=0;}};
})();
