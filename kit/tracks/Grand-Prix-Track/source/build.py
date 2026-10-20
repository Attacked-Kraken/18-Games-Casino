"""Realistic Grand Prix Track builder (v2).
Uses track_core.py for the canonical layout/data (identical centerline, corners, grid, gates, event positions)
and generates smooth PBR geometry + baked vertex AO/soft shadows. Output: ../grand-prix-track.glb (meshopt-compressed
via gltfpack if available), ../track-data.json, ../minimap.png.
Run:  python textures.py   (once)   then   python build.py        needs numpy, scipy, Pillow; optional: npx gltfpack"""
import os, sys, io, json, math, subprocess, numpy as np
from scipy.spatial import ConvexHull
from scipy.ndimage import minimum_filter1d
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.dirname(HERE); TEXD=os.path.join(HERE,"tex")
sys.path.insert(0,HERE)
import track_core as core
from layout import curvature, smooth_closed
from glb import GLB, vnormals
UP=np.array([0,1.,0]); SUN=np.array([0.45,0.8,0.35]); SUN/=np.linalg.norm(SUN)
W=core.W; E=W/2

# ---------------- canonical data (unchanged layout) ----------------
_g,_S,I=core.build(4.0); DATA=core.track_data(I)
L,n,C4,T4,R4,bank4,ks4=I["L"],I["n"],I["C"],I["T"],I["R"],I["bank"],I["ks"]
BL=I["BL"]; PIT_IN0,PIT_IN1,PIT_OUT0,PIT_OUT1=I["pit"]; EV=I["EV"]
k4,_=curvature(I["P2"]); rad4=1/np.maximum(np.abs(smooth_closed(k4,max(3,int(100/4)|1))),1e-5)
rl_lat4=np.array(DATA["racingLine"]["lateral"]); v4=np.array(DATA["aiSpeed"]["speedMs"])
# ---------------- fine resolution (2 m) by periodic cubic upsampling ----------------
UPS=2
def up_pts(P):
    a=np.roll(P,1,0); b=P; c=np.roll(P,-1,0); d=np.roll(P,-2,0); mid=(-a+9*b+9*c-d)/16
    out=np.empty((len(P)*2,)+P.shape[1:]); out[0::2]=P; out[1::2]=mid; return out
def up_lin(x): out=np.empty(len(x)*2); out[0::2]=x; out[1::2]=(x+np.roll(x,-1))/2; return out
def up_mask(m): out=np.empty(len(m)*2,bool); out[0::2]=m; out[1::2]=m; return out
C=up_pts(C4); m=len(C); d=np.arange(m)*L/m
T=np.roll(C,-1,0)-np.roll(C,1,0); T/=np.linalg.norm(T,axis=1,keepdims=True)
R=np.cross(T,UP); R/=np.linalg.norm(R,axis=1,keepdims=True)
bank=up_lin(bank4); ks=up_lin(ks4); rad=up_lin(rad4); rl_lat=up_lin(rl_lat4); vsp=up_lin(v4)
inside=np.sign(ks)
corner_mask=up_mask(np.abs(ks4)>1/200)
gravel=[up_mask(I["gravel"][0]),up_mask(I["gravel"][1])]; runoff=[up_mask(I["runoff"][0]),up_mask(I["runoff"][1])]
xd=np.where(d>L/2,d-L,d)
pit_rng=(xd>=PIT_IN0-L)&(xd<=PIT_OUT1); pit_full=(xd>=PIT_IN1-L)&(xd<=PIT_OUT0)
pl_lat=np.interp(xd,[PIT_IN0-L,PIT_IN1-L,PIT_OUT0,PIT_OUT1],[E+1,27,27,E+1])
def wrapmask(lo,hi): x=d%L; return (x>=lo%L)&(x<hi%L) if lo%L<hi%L else (x>=lo%L)|(x<hi%L)
# inside-corner lateral limit, smoothed so offset curves never fold (fixes gaps/flicker on tight corners)
def limit_for(side):
    lim=np.where(inside==side,np.maximum(0.82*rad,E+2.5),1e4)
    lim=minimum_filter1d(lim,size=31,mode="wrap"); return smooth_closed(lim,15)
LIM={1:limit_for(1),-1:limit_for(-1)}
def edge_y(lat): return C[:,1]-np.clip(lat,-E,E)*np.tan(bank)
def pts(lat,dy=0.0):
    lat=np.asarray(lat,float)*np.ones(m); s=np.where(lat>=0,1,-1)
    lim=np.where(s>0,LIM[1],LIM[-1]); lat=np.where(np.abs(lat)>lim,s*lim,lat)
    p=C+R*lat[:,None]; p[:,1]=edge_y(lat)+dy; return p
def at(dist,lat=0.0):
    f=(dist%L)/L*m; i=int(f)%m; j=(i+1)%m; u=f-int(f); c=C[i]*(1-u)+C[j]*u; t=T[i]*(1-u)+T[j]*u; t=t*[1,0,1]; t/=np.linalg.norm(t); r=np.cross(t,UP)
    p=c+r*lat; return p,t,r,i

# ---------------- geometry helpers ----------------
def grid_strip(cols,uvs,mask=None,colors=None,closed=True):
    """cols: list of [m,3] arrays ordered left->right (for up-facing) ; uvs: list of [m,2]; mask: per segment i->i+1"""
    k=len(cols); mm=len(cols[0])
    if closed:
        cols=[np.vstack([c,c[:1]]) for c in cols]
        uvs=[np.vstack([u,[u[-1]+(u[-1]-u[-2])]]) for u in uvs]
        if colors is not None: colors=[np.vstack([c,c[:1]]) for c in colors]
        rows=mm+1; segs=np.arange(mm)
    else: rows=mm; segs=np.arange(mm-1)
    if mask is not None: segs=segs[mask[segs%mm]]
    V=np.vstack(cols); UV=np.vstack(uvs); COL=np.vstack(colors) if colors is not None else None
    tris=[]
    for c in range(k-1):
        a=c*rows+segs; b=(c+1)*rows+segs; a2=a+1; b2=b+1
        tris.append(np.stack([a,b,a2],1)); tris.append(np.stack([b,b2,a2],1))
    return V,UV,np.vstack(tris) if tris else np.zeros((0,3),int),COL
def compact(V,UV,I,COL=None,N=None):
    used=np.unique(I); rm=-np.ones(len(V),int); rm[used]=np.arange(len(used))
    return V[used],(UV[used] if UV is not None else None),rm[I],(COL[used] if COL is not None else None),(N[used] if N is not None else None)
class Bucket:
    """collects geometry for one primitive (one material) -> merged, compacted, smooth or flat normals"""
    def __init__(s,mat): s.mat=mat; s.parts=[]
    def add(s,V,UV,I,COL=None,N=None):
        if len(I): s.parts.append(compact(np.asarray(V,float),None if UV is None else np.asarray(UV,float),np.asarray(I),COL,N))
    def build(s,ncol=None):
        if not s.parts: return None
        Vs,UVs,Is,Cs,Ns=[],[],[],[],[]; o=0
        for V,UV,Ii,COL,N in s.parts:
            if N is None: N=vnormals(V,Ii)
            Vs.append(V); UVs.append(UV if UV is not None else np.zeros((len(V),2))); Is.append(Ii+o); Ns.append(N)
            Cs.append(COL if COL is not None else np.ones((len(V),ncol or 3))); o+=len(V)
        COL=np.vstack([c if c.shape[1]==Cs[0].shape[1] else np.hstack([c,np.ones((len(c),1))]) for c in Cs]) if ncol else None
        return (np.vstack(Vs),np.vstack(UVs),np.vstack(Is),s.mat,np.vstack(Ns).astype(np.float32),COL)
def chbox(c,t,lt,lr,h,b=0.08,y0=0.0,uvs=4.0,color=None):
    """chamfered (bevelled) box, flat-shaded. c = base centre; t = length axis (horizontal)."""
    t=np.array(t,float); t[1]=0; t/=np.linalg.norm(t); r=np.cross(t,UP)
    b=min(b,lt/3,lr/3,h/3); hx,hz,hy=lt/2,lr/2,h/2; P=[]
    for sx in(-1,1):
        for sy in(-1,1):
            for sz in(-1,1):
                if b<=0: P.append((sx*hx,sy*hy,sz*hz)); continue
                P+=[(sx*(hx-b),sy*hy,sz*hz),(sx*hx,sy*(hy-b),sz*hz),(sx*hx,sy*hy,sz*(hz-b)),(sx*(hx-b),sy*(hy-b*0)*1,sz*(hz-b))]
    P=np.unique(np.round(np.array(P),6),axis=0); hull=ConvexHull(P)
    V=[];N=[];UV=[]
    for simp,eq in zip(hull.simplices,hull.equations):
        tri=P[simp]; nn=eq[:3]
        if np.dot(np.cross(tri[1]-tri[0],tri[2]-tri[0]),nn)<0: tri=tri[[0,2,1]]
        for p in tri:
            w=c+t*p[0]+r*p[2]+UP*(p[1]+hy+y0); V.append(w)
            ax=np.argmax(np.abs(nn)); UV.append((p[2]/uvs,(p[1]+hy)/uvs) if ax==0 else (p[0]/uvs,p[2]/uvs) if ax==1 else (p[0]/uvs,(p[1]+hy)/uvs))
        wn=t*nn[0]+UP*nn[1]+r*nn[2]; N+=[wn]*3
    V=np.array(V); N=np.array(N); I=np.arange(len(V)).reshape(-1,3)
    col=None
    if color is not None:
        ao=0.72+0.28*np.clip((V[:,1]-(c[1]+y0))/2.5,0,1); col=np.array(color)[None,:3]*ao[:,None]
    return V,np.array(UV),I,col,N
def cyl(base,h,r0,r1=None,seg=10,cap=True):
    r1=r0 if r1 is None else r1; a=np.linspace(0,2*np.pi,seg+1)
    ring0=np.stack([np.cos(a)*r0,np.zeros_like(a),np.sin(a)*r0],1)+base; ring1=np.stack([np.cos(a)*r1,np.full_like(a,h),np.sin(a)*r1],1)+base
    V=np.vstack([ring0,ring1]); k=seg+1; i=np.arange(seg)
    I=np.vstack([np.stack([i,i+1+k,i+1],1),np.stack([i,i+k,i+1+k],1)])
    N=np.vstack([np.stack([np.cos(a),np.full_like(a,(r0-r1)/h),np.sin(a)],1)]*2); N/=np.linalg.norm(N,axis=1,keepdims=True)
    UV=np.vstack([np.stack([a/np.pi,np.zeros_like(a)],1),np.stack([a/np.pi,np.full_like(a,h/2)],1)])
    if cap:
        o=len(V); V=np.vstack([V,ring1,base+[0,h,0]]); N=np.vstack([N,np.tile(UP,(k+1,1))]); UV=np.vstack([UV,np.zeros((k+1,2))])
        I=np.vstack([I,np.stack([np.full(seg,o+k),o+i+1,o+i],1)])
    return V,UV,I,None,N
def extrude(base,across,profile,mask,vscale=4.0,dist=None,closed=True,flat=False):
    """profile: list of (a,u): a = metres along 'across' [m,3], u = metres up. Columns follow profile order."""
    dist=d if dist is None else dist
    cols=[base+across*a+UP*u for a,u in profile]
    plen=np.concatenate([[0],np.cumsum([math.hypot(profile[i+1][0]-profile[i][0],profile[i+1][1]-profile[i][1]) for i in range(len(profile)-1)])])
    uvs=[np.stack([dist/vscale,np.full(len(dist),pl/vscale)],1) for pl in plen]
    if not flat: return grid_strip(cols,uvs,mask,closed=closed)
    out=[]
    for i in range(len(cols)-1): out.append(grid_strip(cols[i:i+2],uvs[i:i+2],mask,closed=closed))
    return out
def quad(p0,p1,p2,p3,uv=((0,0),(1,0),(0,1),(1,1))):
    """p0 bl, p1 br, p2 tl, p3 tr (CCW seen from the front)"""
    return np.array([p0,p1,p2,p3]),np.array(uv,float),np.array([[0,1,2],[1,3,2]])

# ---------------- baked lighting (vertex AO + soft sun shadows) ----------------
CASTERS=[]  # (centre_base[3], t[3], lt, lr, ylo, yhi)
def caster(c,t,lt,lr,ylo,yhi):
    t=np.array(t,float); t[1]=0; t/=np.linalg.norm(t); CASTERS.append((np.array(c,float),t,lt,lr,ylo,yhi))
def shadow(Pts):
    dirs=[SUN]+[ (SUN+np.array(j))/np.linalg.norm(SUN+np.array(j)) for j in ((.04,0,0),(-.04,0,0),(0,0,.04),(0,0,-.04),(.03,.0,.03))]
    hit=np.zeros(len(Pts))
    for c,t,lt,lr,ylo,yhi in CASTERS:
        r=np.cross(t,UP); reach=max(lt,lr)/2+yhi*1.0+3
        sel=np.where((np.abs(Pts[:,0]-c[0])<reach)&(np.abs(Pts[:,2]-c[2])<reach)&(Pts[:,1]<c[1]+yhi))[0]
        if not len(sel): continue
        q=Pts[sel]-c; xt=q@t; xr=q@r; y=q[:,1]
        for s in dirs:
            st,sr_,sy=s@t,s@r,s[1]; tmin=np.zeros(len(sel)); tmax=np.full(len(sel),1e9)
            for x,sd,lo,hi in ((xt,st,-lt/2,lt/2),(xr,sr_,-lr/2,lr/2),(y,sy,ylo,yhi)):
                if abs(sd)<1e-9:
                    bad=(x<lo)|(x>hi); tmax[bad]=-1; continue
                a1=(lo-x)/sd; a2=(hi-x)/sd; tmin=np.maximum(tmin,np.minimum(a1,a2)); tmax=np.minimum(tmax,np.maximum(a1,a2))
            hit[sel]=np.maximum(hit[sel],0)+( (tmax>tmin)&(tmax>0) )/len(dirs)
    return 1-0.5*np.clip(hit,0,1)

g=GLB()
def T_(name,fn):
    p=os.path.join(TEXD,fn); data=open(p,"rb").read(); return g.image(data,"image/png" if fn.endswith(".png") else "image/jpeg")
TX={k:T_(k,f) for k,f in dict(asph="asphalt_albedo.jpg",asphN="asphalt_normal.jpg",asphO="asphalt_orm.jpg",kerb="kerb_albedo.jpg",kerbN="kerb_normal.jpg",
    grass="grass_mowed_albedo.jpg",grassN="grass_normal.jpg",terr="grass_rough_albedo.jpg",grav="gravel_albedo.jpg",gravN="gravel_normal.jpg",
    conc="concrete_albedo.jpg",concN="concrete_normal.jpg",tyre="tyre_albedo.jpg",tyreN="tyre_normal.jpg",fence="chainlink.png",seats="seats_albedo.jpg",
    door="door_albedo.jpg",doorN="door_normal.jpg",marks="marks.png",banner="banner.jpg").items()}
MAT=dict(
 asphalt=dict(color=(.82,.82,.84,1),tex=TX["asph"],normal=TX["asphN"],orm=TX["asphO"],rough=1.0,ns=.8),
 asphalt_runoff=dict(color=(1,1,1,1),tex=TX["asph"],normal=TX["asphN"],orm=TX["asphO"],rough=1.0,ns=.8),
 pit_lane=dict(color=(.92,.92,.93,1),tex=TX["asph"],normal=TX["asphN"],orm=TX["asphO"],rough=1.0,ns=.6),
 marks=dict(tex=TX["marks"],alpha="BLEND",rough=.7),
 paint_white=dict(color=(.9,.9,.88,1),rough=.55),
 kerb=dict(tex=TX["kerb"],normal=TX["kerbN"],rough=.55),
 grass=dict(tex=TX["grass"],normal=TX["grassN"],rough=.95,ns=.6),
 terrain=dict(tex=TX["terr"],normal=TX["grassN"],rough=.97,ns=.5),
 gravel=dict(tex=TX["grav"],normal=TX["gravN"],rough=.92,alpha="BLEND"),
 concrete=dict(tex=TX["conc"],normal=TX["concN"],rough=.9,ns=.6),
 steel_galvanised=dict(color=(.78,.8,.83,1),metal=.9,rough=.32),
 steel_dark=dict(color=(.2,.21,.23,1),metal=.7,rough=.42),
 tyre=dict(tex=TX["tyre"],normal=TX["tyreN"],rough=.85),
 fence=dict(tex=TX["fence"],alpha="MASK",double=True,metal=.8,rough=.4),
 seats=dict(tex=TX["seats"],rough=.55),
 roof=dict(color=(.92,.93,.95,1),metal=.5,rough=.3,double=True),
 building=dict(color=(1,1,1,1),metal=.15,rough=.45),
 glass=dict(color=(.16,.24,.3,1),metal=1.0,rough=.05),
 door=dict(tex=TX["door"],normal=TX["doorN"],metal=.5,rough=.4),
 painted=dict(color=(1,1,1,1),rough=.55),
 screen=dict(color=(.03,.05,.09,1),emissive=(.01,.02,.05),rough=.15,metal=.2),
 lamp=dict(color=(1,1,.95,1),emissive=(.05,.05,.045),rough=.3),
 light_off=dict(color=(.08,.08,.09,1),rough=.4),
 banner=dict(tex=TX["banner"],rough=.6,double=True))
for k,o in MAT.items():
    g.material(k,color=o.get("color",(1,1,1,1)),tex=o.get("tex"),rough=o.get("rough",.9),metal=o.get("metal",0),double=o.get("double",False),
               alpha=o.get("alpha"),emissive=o.get("emissive"),normal=o.get("normal"),normal_scale=o.get("ns",1.0),orm=o.get("orm"))
NODES={}; STATS={}
def node(name,buckets,extras=None,ncol=None):
    prims=[b.build(ncol) for b in buckets]; prims=[p for p in prims if p is not None]
    if not prims: return
    g.mesh(name,prims,extras); STATS[name]=dict(triangles=int(sum(len(p[2]) for p in prims)),drawCalls=len(prims))

# =============== STRUCTURES FIRST (they define shadow casters) ===============
steel=Bucket("steel_dark"); galv=Bucket("steel_galvanised"); bld=Bucket("building"); glass=Bucket("glass"); door=Bucket("door")
painted=Bucket("painted"); screen=Bucket("screen"); lamp=Bucket("lamp"); lightoff=Bucket("light_off"); banner=Bucket("banner")
sconc=Bucket("concrete"); seats=Bucket("seats"); roof=Bucket("roof")
WHITE=(.9,.91,.93)
# --- grandstands: tiered seating, curved cantilever roofs, round columns ---
TIERS=12; TREAD=.9; RISE=.5; BASEH=1.0
STANDS=[]
for st in EV["grandstands"]:
    dist=st["distance"]; side=1 if st["side"]=="right" else -1; length=st["length"]
    p,t,r,_=at(dist); out=r*side; base=p+out*(BL+8); base[1]=p[1]-.6
    half=length/2; ends=[base-t*half,base+t*half]
    # stepped profile (a = metres away from the track, u = height)
    prof=[(0,0),(0,BASEH)]
    for k in range(TIERS): prof+=[((k+1)*TREAD,BASEH+k*RISE),((k+1)*TREAD,BASEH+(k+1)*RISE)]
    prof+=[(TIERS*TREAD+.6,BASEH+TIERS*RISE),(TIERS*TREAD+.6,0)]
    D=TIERS*TREAD+.6
    for i in range(len(prof)-1):
        (a0,u0),(a1,u1)=prof[i],prof[i+1]
        P0=[e+out*a0+UP*u0 for e in ends]; P1=[e+out*a1+UP*u1 for e in ends]
        V,UV,Ii=quad(P0[0],P0[1],P1[0],P1[1],((0,u0/4),(length/4,u0/4),(0,u1/4+abs(a1-a0)/4),(length/4,u1/4+abs(a1-a0)/4)))
        nrm=np.cross(V[1]-V[0],V[2]-V[0])
        if (side>0)!=(np.dot(np.cross(t,out),UP)>0): Ii=Ii[:,[0,2,1]]
        ao=np.array([.8 if u0<.1 else 1,.8 if u0<.1 else 1,1,1])
        sconc.add(V,UV,Ii,COL=np.tile(ao[:,None],(1,3)))
    # side caps per tier column
    for e,sg in ((ends[0],-1),(ends[1],1)):
        for k in range(TIERS+1):
            a0=k*TREAD if k<TIERS else TIERS*TREAD; a1=(k+1)*TREAD if k<TIERS else D; top=BASEH+k*RISE if k<TIERS else BASEH+TIERS*RISE
            V,UV,Ii=quad(e+out*a0,e+out*a1,e+out*a0+UP*top,e+out*a1+UP*top,((0,0),(abs(a1-a0)/4,0),(0,top/4),(abs(a1-a0)/4,top/4)))
            if np.dot(np.cross(V[1]-V[0],V[2]-V[0]),t*sg)<0: Ii=Ii[:,[0,2,1]]
            sconc.add(V,UV,Ii)
    # seats on each tread
    rows=[]
    for k in range(TIERS):
        a0=k*TREAD+.08; a1=(k+1)*TREAD-.05; hgt=BASEH+k*RISE+.02
        V,UV,Ii=quad(ends[0]+out*a0+UP*hgt,ends[1]+out*a0+UP*hgt,ends[0]+out*a1+UP*hgt,ends[1]+out*a1+UP*hgt,((0,1),(length/4,1),(0,0),(length/4,0)))
        if np.cross(V[1]-V[0],V[2]-V[0])[1]<0: Ii=Ii[:,[0,2,1]]
        seats.add(V,UV,Ii)
        rows.append([round(float(x),3) for x in base+out*(k*TREAD+.5)+UP*(hgt)])
    # curved cantilever roof (shell with thickness) + columns
    S=np.linspace(0,1,14); a_r=D+.3-(D+2.3)*S; u_r=BASEH+TIERS*RISE+4.2-1.0*S+0.9*np.sin(np.pi*S)
    for thick,flip in ((0,False),(-.25,True)):
        cols=[]
        for a,u in zip(a_r,u_r):
            cols.append(np.array([ends[0]-t*1+out*a+UP*(u+thick),ends[1]+t*1+out*a+UP*(u+thick)]))
        Vr=np.vstack(cols); kk=len(S); Ii=[]
        for i in range(kk-1): Ii+=[[2*i,2*i+1,2*i+2],[2*i+1,2*i+3,2*i+2]]
        Ii=np.array(Ii)
        nrm=np.cross(Vr[1]-Vr[0],Vr[2]-Vr[0])
        if (nrm[1]<0)!=flip: Ii=Ii[:,[0,2,1]]
        roof.add(Vr,np.zeros((len(Vr),2)),Ii)
    caster(base+out*(D/2-1)+UP*0,t,length+2,D+2.3,BASEH+TIERS*RISE+3.0,BASEH+TIERS*RISE+4.6)
    caster(base+out*(D/2),t,length,D*.9,0,BASEH+TIERS*RISE*.6)
    for x in np.arange(-half,half+.1,length/max(2,round(length/14))):
        cb=base+t*x+out*(D+.25); steel.add(*cyl(cb,BASEH+TIERS*RISE+4.4,.28,.22,12))
    STANDS.append(dict(st,rows=rows,tiers=TIERS))
# --- pit building: garages (doors at each pit box), glass upper floor, roof slab ---
seg_d=np.arange(PIT_IN1-L+30,PIT_OUT0-20,36.0)
for dd in seg_d:
    p,t,r,_=at(dd+18); c=p+r*48; c[1]=p[1]-.6+.0
    bld.add(*chbox(c,t,36.2,12,5.2,.12,color=WHITE))
    glass.add(*chbox(c+r*.4,t,35.6,10.6,3.4,.05,y0=5.2))
    for x in np.arange(-18,18.1,6): bld.add(*chbox(c-r*5.25+t*x,t,.35,.35,3.4,.05,y0=5.2,color=WHITE))   # mullions
    bld.add(*chbox(c-r*.5,t,36.4,14,.5,.12,y0=8.6,color=WHITE))
    caster(c,t,36,12,0,8.6); caster(c-r*.5,t,36.4,14,8.6,9.1)
for b in DATA["pitLane"]["boxes"]:
    p=np.array(b["position"]); h=np.array(b["heading"]); h[1]=0; h/=np.linalg.norm(h); r=np.cross(h,UP)
    q=p+r*(42-36-0.02); q[1]=p[1]-.6+0.6
    V,UV,Ii=quad(q-h*4+UP*0,q+h*4,q-h*4+UP*4.2,q+h*4+UP*4.2,((0,0),(2,0),(0,1),(2,1)))
    if np.dot(np.cross(V[1]-V[0],V[2]-V[0]),-r)<0: Ii=Ii[:,[0,2,1]]
    door.add(V,UV,Ii)
# --- hospitality (2 floors, glass) behind the main straight ---
for dd in (640,700,760):
    p,t,r,_=at(dd); c=p-r*(BL+16); c[1]=p[1]-.6
    bld.add(*chbox(c,t,50,16,4,.15,color=WHITE)); glass.add(*chbox(c,t,48.6,15,3.4,.05,y0=4)); bld.add(*chbox(c,t,52,17.5,.45,.15,y0=7.4,color=WHITE))
    caster(c,t,52,17,0,7.9)
# --- timing tower ---
p,t,r,_=at(-40); q=p+r*74; q[1]=p[1]-.6
bld.add(*chbox(q,t,3.4,3.4,26,.15,color=(.2,.22,.25))); caster(q,t,3.4,3.4,0,26)
pc_=np.array(EV["timingTower"]["panelCenter"]); f=np.array(EV["timingTower"]["facing"]); ta=np.cross(UP,f)
pp=pc_-f*(-0.08)  # 8 cm behind the event panel
V,UV,Ii=quad(pp-ta*1.5-UP*10.5,pp+ta*1.5-UP*10.5,pp-ta*1.5+UP*10.5,pp+ta*1.5+UP*10.5)
if np.dot(np.cross(V[1]-V[0],V[2]-V[0]),f)<0: Ii=Ii[:,[0,2,1]]
screen.add(V,None,Ii)
# --- podium ---
p,t,r,_=at(70); q=p+r*70; q[1]=p[1]-.6
for off,hh,col in ((-3,1.2,(.92,.92,.92)),(0,1.7,(.93,.74,.25)),(3,.9,(.92,.92,.92))): painted.add(*chbox(q+t*off,t,2.6,2.6,hh,.06,color=col))
painted.add(*chbox(q+r*3,t,14,4,.6,.08,color=(.85,.85,.86))); caster(q,t,9,3,0,1.7)
# --- marshal posts ---
for mp in EV["marshalPosts"]:
    fp=np.array(mp["flagPole"]); f=np.array(mp["facing"]); t=np.cross(f,UP); q=fp-UP*5.1
    painted.add(*chbox(q,t,2.2,2.2,2.6,.1,color=(1,.48,.08))); painted.add(*chbox(q+f*1.11,t,1.8,.04,.7,.02,y0=1.4,color=(.05,.06,.08)))
    steel.add(*cyl(q+UP*2.6,2.5,.05,.04,8)); caster(q,t,2.2,2.2,0,2.6)
# --- TV camera towers (scaffold) ---
for ct in EV["cameraTowers"]:
    q=np.array(ct["cameraPosition"])-UP*10.4; p,t,r,_=at(ct["distance"])
    for sx in(-1,1):
        for sz in(-1,1): steel.add(*cyl(q+t*.6*sx+r*.6*sz,9,.07,.07,6,False))
    for hh in (3,6): steel.add(*chbox(q,t,1.4,1.4,.1,.03,y0=hh))
    steel.add(*chbox(q,t,3,3,.25,.05,y0=9)); steel.add(*chbox(q,t,.9,.6,.6,.08,y0=9.3)); caster(q,t,3,3,9,9.3)
# --- floodlights ---
for j,dist in enumerate(np.arange(0,L,260)):
    side=1 if j%2 else -1
    if wrapmask(PIT_IN0,PIT_OUT1)[int(dist/L*m)%m]: side=-1
    p,t,r,i=at(dist); q=p+r*side*(BL+5); q[1]=C[i,1]-.6
    steel.add(*cyl(q,18,.35,.2,10)); steel.add(*chbox(q+UP*0-r*side*.3,t,4.2,.6,2.0,.08,y0=18))
    for x in np.linspace(-1.5,1.5,4):
        for yy in (18.35,19.05):
            lamp.add(*chbox(q-r*side*.66+t*x,t,.8,.12,.55,.03,y0=yy))
    caster(q,t,.6,.6,0,18)
# --- big screens ---
for s in EV["bigScreens"]:
    c=np.array(s["center"]); f=np.array(s["facing"]); t=np.array(s["tangent"]); t[1]=0; t/=np.linalg.norm(t)
    q=c+f*.42-UP*9.6
    for x in(-4,4): steel.add(*cyl(q+t*x,6,.3,.25,10))
    steel.add(*chbox(q,t,12.6,.6,7.2,.1,y0=6)); caster(q,t,12.6,.6,6,13.2)
    pp=c+f*.1
    V,UV,Ii=quad(pp-t*6-UP*3.3,pp+t*6-UP*3.3,pp-t*6+UP*3.3,pp+t*6+UP*3.3)
    if np.dot(np.cross(V[1]-V[0],V[2]-V[0]),f)<0: Ii=Ii[:,[0,2,1]]
    screen.add(V,None,Ii)
# --- overhead banner bridges (7.3 m clearance) + start gantry ---
for br in EV["bridges"]:
    p,t,r,_=at(br["distance"]); half=E+12
    for e in(-1,1): steel.add(*chbox(p+r*e*half-UP*.6,t,1.2,1.2,9.6,.1))
    steel.add(*chbox(p,r,2*half+1.2,2.2,1.6,.12,y0=7.5)); caster(p,r,2*half+1.2,2.2,7.5,9.1)
    for nn in (t,-t):
        ua=np.cross(-nn,UP); b0=p+UP*7.3+nn*1.12; w2=2*half-2
        V,UV,Ii=quad(b0-ua*w2/2,b0+ua*w2/2,b0-ua*w2/2+UP*2.0,b0+ua*w2/2+UP*2.0,((0,1),(6,1),(0,0),(6,0)))
        banner.add(V,UV,Ii)
p,t,r,_=at(0)
for s_ in(-1,1): steel.add(*chbox(p+r*s_*(E+3),t,.6,.6,8.5,.08))
steel.add(*chbox(p+UP*0,t,1.0,W+6.6,1.2,.1,y0=7)); caster(p,r,W+6.6,1.0,7,8.2)
for j in range(5): lightoff.add(*chbox(p-t*.55+r*(j-2)*1.4,t,.25,1.0,1.0,.05,y0=7.2))

# =============== BARRIERS ===============
tyreB=Bucket("tyre"); concB=Bucket("concrete"); fenceB=Bucket("fence")
tyre_m=[gravel[0]|runoff[0],(gravel[1]|runoff[1])&~pit_rng]
straight_left=wrapmask(-200,700)
rail_m=[~tyre_m[0]&~straight_left,~tyre_m[1]&~pit_rng]
wall_m=[straight_left&~tyre_m[0],np.zeros(m,bool)]
def side_dir(s): return R*s
for si,s in enumerate((-1,1)):
    out=R*s; base=pts(s*BL,-.6)
    # W-beam guardrail (profile faces the track), posts every 4 m
    hs=np.linspace(.45,.85,9); prof=[(-.045*abs(math.sin(math.pi*(h-.45)/.2)),h) for h in hs]
    prof=prof+[(.04,.85),(.04,.45)]
    if s>0: prof=prof[::-1]
    V,UV,Ii,_=extrude(base[::2],out[::2],prof,rail_m[si][::2],dist=d[::2]); galv.add(V,UV,Ii)
    for i in range(0,m,2):
        if rail_m[si][i]: galv.add(*chbox(base[i]+out[i]*.14,T[i],.12,.16,.9,0))
    # tyre stacks: front textured, top, back
    prof=[(0,0),(0,1.2),(.9,1.2),(.9,0)]
    if s>0: prof=prof[::-1]
    for V,UV,Ii,_ in extrude(base,out,prof,tyre_m[si],vscale=2.4,flat=True):
        UV[:,1]=np.clip(UV[:,1]*2.4/1.2,0,1) ; tyreB.add(V,UV,Ii)
    # concrete wall with bevelled top along the main straight (spectator side)
    prof=[(0,0),(0,.95),(.08,1.1),(.42,1.1),(.5,.95),(.5,0)]
    if s>0: prof=prof[::-1]
    if wall_m[si].any():
        V,UV,Ii,_=extrude(base,out,prof,wall_m[si]); concB.add(V,UV,Ii)
    # catch fence: alpha-tested mesh panel + round posts + top/bottom tubes
    fm=tyre_m[si]|(straight_left if s<0 else np.zeros(m,bool))
    fb=pts(s*(BL+1.6),-.6)
    V,UV,Ii,_=grid_strip([fb+UP*.15,fb+UP*4.2],[np.stack([d/1.0,np.full(m,0.15)],1),np.stack([d/1.0,np.full(m,4.2)],1)],fm); fenceB.add(V,UV,Ii)
    for hh in (.15,4.2):
        circ=[(math.cos(a)*.04,hh+math.sin(a)*.04) for a in np.linspace(0,2*np.pi,5)]
        V,UV,Ii,_=extrude(fb[::2],out[::2],circ,fm[::2],dist=d[::2]); galv.add(V,UV,Ii)
    for i in range(0,m,2):
        if fm[i] and fm[(i+1)%m]: galv.add(*cyl(fb[i],4.4,.06,.05,8,True))
# pit wall (concrete, bevelled) along the pit straight
pwb=pts(E+18.05,-.01)
prof=[(0,0),(0,.95),(.08,1.05),(.42,1.05),(.5,.95),(.5,0)][::-1]
V,UV,Ii,_=extrude(pwb,R,prof,pit_full); concB.add(V,UV,Ii)
# trackside APEX ARCADE banners on posts + braking marker boards
for i in range(0,m,int(60/2)):
    if corner_mask[i] or pit_rng[i]: continue
    for si,s in enumerate((-1,1)):
        if not (rail_m[si][i] or wall_m[si][i]): continue
        p=pts(s*(BL+.7),-.6)[i]; nn=-R[i]*s; ua=np.cross(-nn,UP); b0=p+UP*1.15
        V,UV,Ii=quad(b0-ua*3,b0+ua*3,b0-ua*3+UP*1.4,b0+ua*3+UP*1.4,((0,1),(1,1),(0,0),(1,0))); banner.add(V,UV,Ii)
        V,UV,Ii=quad(b0+ua*3+nn*-.02,b0-ua*3+nn*-.02,b0+ua*3+UP*1.4+nn*-.02,b0-ua*3+UP*1.4+nn*-.02,((0,1),(1,1),(0,0),(1,0))); banner.add(V,UV,Ii)
        for x in (-2.6,2.6): steel.add(*cyl(p+ua*x,2.6,.05,.05,6,False))
for bm in DATA["brakingMarkers"]:
    c=[c for c in DATA["corners"] if c["name"]==bm["corner"]][0]; i=bm["index"]*UPS
    out_side=-1 if c["dir"]=="right" else 1; p=pts(out_side*(E+20))[i]; nn=-R[i]*out_side
    painted.add(*chbox(p,T[i],.12,1.4,2.3,.03,color=(.08,.08,.09)))
    for k2 in range(bm["metresToGo"]//100): painted.add(*chbox(p+UP*0,T[i],.16,1.2,.28,.02,y0=.55+k2*.55,color=(.95,.95,.95)))
    steel.add(*cyl(p-T[i]*0,.5,.04,.04,6,False))

# =============== GROUND SURFACES ===============
def surf(lats,dys,mask,uscale,vscale,bake_=True,alpha=None):
    cols=[pts(l,dy) for l,dy in zip(lats,dys)]
    uvs=[np.stack([np.full(m,l/uscale),d/vscale],1) for l in lats]
    colors=None
    if bake_:
        colors=[]
        for ci,c in enumerate(cols):
            sh=np.ones(m); sel=mask|np.roll(mask,1)
            if sel.any(): sh[sel]=shadow(c[sel])
            a=np.ones(m) if alpha is None else alpha[ci]
            colors.append(np.stack([sh,sh,sh,a],1) if alpha is not None else np.stack([sh,sh,sh],1))
    if lats[0]>lats[-1]: cols=cols[::-1]; uvs=uvs[::-1]; colors=colors[::-1] if colors else None
    return grid_strip(cols,uvs,mask,colors)
roadB=Bucket("asphalt"); runB=Bucket("asphalt_runoff"); pitB=Bucket("pit_lane"); paintB=Bucket("paint_white"); marksB=Bucket("marks")
kerbB=Bucket("kerb"); grassB=Bucket("grass"); gravB=Bucket("gravel"); apronB=Bucket("concrete"); terrB=Bucket("terrain")
ALL=np.ones(m,bool)
lats=np.linspace(-E,E,9); V,UV,Ii,COL=surf(lats,[0]*9,ALL,4,4); roadB.add(V,UV,Ii,COL)
# white edge lines
for s in (-1,1):
    V,UV,Ii,_=surf([s*(E-.42),s*(E-.27)],[.012,.012],ALL,1,1,False); paintB.add(V,UV,Ii)
# kerbs: rounded profile, rumble in normal map, uv along kerb arc length (no stretching)
KP=[(0,.004),(.12,.02),(.45,.05),(.9,.068),(1.25,.06),(1.45,.01),(1.55,-.03)]
for s in (-1,1):
    km=corner_mask&~(pit_rng if s>0 else np.zeros(m,bool))
    ramp=smooth_closed(km.astype(float),9)           # taper the height at kerb ends
    cols=[];uvs=[]
    mid=pts(s*(E+.7)); seg=np.linalg.norm(np.roll(mid,-1,0)-mid,axis=1); arc=np.concatenate([[0],np.cumsum(seg)[:-1]])
    for a,h in KP:
        c=pts(s*(E-.05+a),0); c[:,1]+=h*np.clip(ramp*1.5,0,1)+(.0 if h>0 else 0); cols.append(c); uvs.append(np.stack([np.full(m,a/1.55),arc/3.0],1))
    if s<0: cols=cols[::-1]; uvs=uvs[::-1]
    V,UV,Ii,_=grid_strip(cols,uvs,km); kerbB.add(V,UV,Ii)
# runoff asphalt, grass verge (mowed), gravel overlay with soft edges
for si,s in enumerate((-1,1)):
    ro=runoff[si]&~(pit_rng if s>0 else np.zeros(m,bool))
    V,UV,Ii,COL=surf([s*(E-.1),s*(E+6),s*(E+12),s*(E+18)],[-.012,-.03,-.04,-.05],ro,4,4); runB.add(V,UV,Ii,COL)
    gl=[E-.15,E+1.5,E+6,E+12,E+18,E+22,E+25.2,E+26.2]; gd=[-.035,-.04,-.06,-.08,-.1,-.3,-.55,-.6]
    gm=ALL if s<0 else ~pit_full
    V,UV,Ii,COL=surf([s*x for x in gl],gd,gm,16,16)
    if COL is not None:   # AO darkening at the barrier foot
        nr=len(COL)//len(gl); ao=np.ones(len(gl)); ao[-2]=.82; ao[-1]=.7
        if s<0: ao=ao[::-1]
        COL=COL*np.repeat(ao,nr)[:,None]
    grassB.add(V,UV,Ii,COL)
    gw=smooth_closed(gravel[si].astype(float),21)
    gmask=gw>.02
    glats=[E+.6,E+1.6,E+16.5,E+18.6]; gdy=[-.025,-.025,-.07,-.085]
    alphas=[gw*0,gw,gw,gw*0]
    V,UV,Ii,COL=surf([s*x for x in glats],gdy,gmask,2,2,True,alphas); gravB.add(V,UV,Ii,COL)
# pit lane, apron, paint (start line, grid boxes, pit boxes, pit lane lines)
pc=C+R*pl_lat[:,None]; pc[:,1]=C[:,1]+.02
pl_m=pit_rng&np.roll(pit_rng,-1)
cols=[pc+R*x for x in (-6,-2,2,6)]; uvs=[np.stack([np.full(m,(x+6)/4),d/4],1) for x in (-6,-2,2,6)]
V,UV,Ii,_=grid_strip(cols,uvs,pl_m); pitB.add(V,UV,Ii)
for x0,x1 in ((-6,-5.85),(5.85,6)):
    V,UV,Ii,_=grid_strip([pc+R*x0+UP*.012,pc+R*x1+UP*.012],[np.zeros((m,2))]*2,pl_m); paintB.add(V,UV,Ii)
V,UV,Ii,COL=surf([E+18,E+30,E+45,E+60],[-.01]*4,pit_full&np.roll(pit_full,-1),4,4); apronB.add(V,UV,Ii,COL)
def flatq(cen,t,r,lt,lr,dy=.012):
    c=cen+UP*dy; return quad(c-t*lt/2-r*lr/2,c-t*lt/2+r*lr/2,c+t*lt/2-r*lr/2,c+t*lt/2+r*lr/2)
def fixup(V,UV,Ii):
    if np.cross(V[1]-V[0],V[2]-V[0])[1]<0: Ii=Ii[:,[0,2,1]]
    return V,UV,Ii
p,t,r,_=at(0); paintB.add(*fixup(*flatq(p,t,r,1.0,W)))
for gslot in DATA["grid"]:
    p=np.array(gslot["position"]); t=np.array(gslot["heading"]); t[1]=0; t/=np.linalg.norm(t); r=np.cross(t,UP); q=p+t*2.5
    for args in ((q,t,r,.25,3.0),(q-t*1.2-r*1.5,t,r,2.4,.2),(q-t*1.2+r*1.5,t,r,2.4,.2)): paintB.add(*fixup(*flatq(*args)))
for b in DATA["pitLane"]["boxes"]:
    p=np.array(b["position"]); t=np.array(b["heading"]); t[1]=0; t/=np.linalg.norm(t); r=np.cross(t,UP)
    for args in ((p+t*5,t,r,.2,6,0.0),(p-t*5,t,r,.2,6,0.0),(p+r*3,t,r,10,.2,0.0)): paintB.add(*fixup(*flatq(*args)))
# rubbered-in racing line + skid marks (vertex alpha) - one blended overlay
la=np.clip(0.5+2.5*np.abs(smooth_closed(ks,31))*20,0.45,0.95)
def ribbon(lat_c,half,mask,alpha,u0,u1,dy=.009,vscale=12.0):
    cols=[pts(lat_c-half,dy),pts(lat_c,dy),pts(lat_c+half,dy)]
    uvs=[np.stack([np.full(m,u),d/vscale],1) for u in (u0,(u0+u1)/2,u1)]
    colors=[np.stack([np.ones(m)]*3+[alpha],1)]*3
    return grid_strip(cols,uvs,mask,colors)
V,UV,Ii,COL=ribbon(rl_lat,1.8,ALL,la*0.9,0.0,0.5); marksB.add(V,UV,Ii,COL)
dv=np.roll(vsp,-1)-vsp
for c in DATA["corners"]:
    if c["apexSpeedKmh"]>215: continue
    ap=c["apex"]*UPS; j=ap
    while vsp[(j-1)%m]>vsp[j%m]+1e-3 and ap-j<400: j-=1          # braking zone start
    seg=np.arange(j,ap+1)%m; ex=np.arange(ap,ap+int(55/2))%m
    for zone,strength,lat_off in ((seg,1.0,0.0),(ex,.7,0.4)):
        msk=np.zeros(m,bool); msk[zone]=True
        env=np.zeros(m); xx=np.linspace(0,1,len(zone)); env[zone]=np.sin(np.pi*xx)**.6*strength
        V,UV,Ii,COL=ribbon(rl_lat+lat_off*np.sign(ks),1.3,msk,env,0.5,1.0,.010,9.0); marksB.add(V,UV,Ii,COL)
# terrain (grass) heightfield with baked shadows
P2=C[:,[0,2]]; cell=10; mn=P2.min(0)-260; mx=P2.max(0)+260
gx=np.arange(mn[0],mx[0]+cell,cell); gz=np.arange(mn[1],mx[1]+cell,cell); X,Z=np.meshgrid(gx,gz); G=np.stack([X.ravel(),Z.ravel()],1)
best=np.full(len(G),1e9); bh=np.zeros(len(G))
for c0 in range(0,m,300):
    Dd=np.linalg.norm(G[:,None]-P2[None,c0:c0+300],axis=2); j=Dd.argmin(1); dm=Dd[np.arange(len(G)),j]; u=dm<best; best[u]=dm[u]; bh[u]=C[c0+j[u],1]
far=np.mean(C[:,1]); wgt=np.clip((best-60)/200,0,1); wgt=wgt*wgt*(3-2*wgt)
H=(bh-0.66)*(1-wgt)+(far-3+2*np.sin(G[:,0]/170)*np.cos(G[:,1]/130))*wgt
TV=np.stack([G[:,0],H,G[:,1]],1); nx=len(gx); nz=len(gz); ii=np.arange(nx*nz).reshape(nz,nx)
a=ii[:-1,:-1].ravel(); b=ii[:-1,1:].ravel(); c=ii[1:,:-1].ravel(); dd=ii[1:,1:].ravel()
TI=np.concatenate([np.stack([a,c,b],1),np.stack([b,c,dd],1)])
sh=shadow(TV); terrB.add(TV,np.stack([G[:,0]/16,G[:,1]/16],1),TI,np.stack([sh,sh,sh],1))

# =============== NODES (merged by material; names kept for Muse) ===============
node("road",[roadB],{"surface":"track","width":W},ncol=3)
node("pit_lane",[pitB],{"surface":"pit","speedLimitKmh":80})
node("runoff_asphalt",[runB],{"surface":"runoff"},ncol=3)
node("track_marks",[marksB],{"note":"rubbered-in racing line + braking/exit skid marks; vertex alpha; draw after road"},ncol=4)
node("road_paint",[paintB],{"note":"white edge lines, start/finish line, grid boxes, pit boxes, pit lane lines"})
node("kerbs",[kerbB],{"surface":"kerb"})
node("grass",[grassB],{"surface":"grass","note":"mowed stripes; baked AO + soft shadows in vertex colours"},ncol=3)
node("gravel_traps",[gravB],{"surface":"gravel","note":"blended edges via vertex alpha"},ncol=4)
node("pit_apron",[apronB],{"surface":"pit"},ncol=3)
node("terrain_grass",[terrB],{"surface":"grass"},ncol=3)
node("concrete_walls",[concB],{"barrier":"concrete","note":"pit wall + main straight wall"})
node("guardrails",[galv],{"barrier":"guardrail","note":"W-beam rails, posts, catch-fence posts and tubes"})
node("tyre_walls",[tyreB],{"barrier":"tyres"})
node("catch_fence",[fenceB],{"note":"alpha-tested chain-link"})
node("grandstands",[sconc,seats,roof],{"note":"tiered seating, curved cantilever roofs","standsInEventData":len(STANDS)},ncol=3)
node("pit_garages_and_buildings",[bld,glass,door,painted],{"note":"pit garages + glass upper floor, hospitality, timing tower, podium, marshal huts, braking boards"},ncol=3)
node("steel_structures",[steel],{"note":"gantry, bridges, camera towers, floodlight poles/heads, screen frames, stand columns, poles"})
node("floodlight_lamps",[lamp],{"note":"material 'lamp': raise emissive for night"})
node("screens",[screen],{"note":"base panels; grand-prix-event.js draws live canvas screens 8-10 cm in front"})
node("start_lights",[lightoff],{"note":"5 lamp housings; lenses are drawn by grand-prix-event.js"})
node("banners_apex_arcade",[banner],{"text":"APEX ARCADE","note":"trackside + overhead bridges"})
raw="/tmp/_raw_gp.glb"; size_raw=g.save(raw)
# meshopt compression (no quantisation, keeps names/extras). Falls back to the raw GLB.
dst=os.path.join(OUT,"grand-prix-track.glb")
try:
    subprocess.run(["npx","--yes","gltfpack","-i",raw,"-o",dst,"-cc","-noq","-kn","-km","-ke"],check=True,cwd=os.environ.get("GLTFPACK_DIR","/tmp/gv"),capture_output=True)
    compressed=True
except Exception as e:
    print("gltfpack not available, writing uncompressed GLB:",e); os.replace(raw,dst); compressed=False
# =============== track-data.json (same layout data; updated stand rows + render info) ===============
DATA["event"]["grandstands"]=STANDS
DATA["meshes"]=STATS
DATA["render"]=dict(sunDirection=[round(float(x),4) for x in SUN],note="baked vertex shadows use this sun direction; put the real-time DirectionalLight along it",
                    compression="EXT_meshopt_compression (needs MeshoptDecoder)" if compressed else "none",bakedLighting="vertex colours (COLOR_0) on ground meshes, buildings and stands")
mm=core.minimap(I,DATA,os.path.join(OUT,"minimap.png"))
DATA["minimap"]=dict(file="minimap.png",size=1024,worldMinXZ=mm[0],pixelsPerMetre=mm[1],offsetPx=mm[2],formula="px = (worldXZ - worldMinXZ) * pixelsPerMetre + offsetPx")
json.dump(DATA,open(os.path.join(OUT,"track-data.json"),"w"),separators=(",",":"),default=lambda o:o.item())
tot=sum(v["triangles"] for v in STATS.values()); dc=sum(v["drawCalls"] for v in STATS.values())
print("raw MB",round(size_raw/1e6,2),"final MB",round(os.path.getsize(dst)/1e6,2),"tris",tot,"draw calls",dc,"compressed",compressed)
for k,v in STATS.items(): print(" ",k,v)
