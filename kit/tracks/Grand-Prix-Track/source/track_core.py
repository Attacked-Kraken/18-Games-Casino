"""CANONICAL TRACK CORE (v1). Defines the layout-derived data (centerline, elevation, banking, corners, grid, pit, gates,
racing line, event positions) that build.py uses. Its own blocky geometry is legacy; build.py makes the realistic GLB.
Run:  python build.py   (needs numpy + Pillow).  1 unit = 1 metre, Y up, track lies in the XZ plane."""
import json, io, os, sys, math, numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from layout import centerline, curvature, smooth_closed
from glb import GLB
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.dirname(HERE)
TEX=os.environ.get("GROUND_TEX", os.path.join(OUT,"..","Ground-Textures","512"))
W=14.0                     # track width (m)
UP=np.array([0,1.,0])

def build(step=4.0, low=False):
    P2,L=centerline(step); n=len(P2); d=np.arange(n)*L/n
    k,_=curvature(P2); ks=smooth_closed(k,max(3,int(60/step)|1))
    # ---- elevation (keyframes as fraction of lap, metres) ----
    kf=np.array([(0,0),(.10,0),(.17,4),(.24,9),(.31,4),(.38,-1),(.45,6),(.51,13),(.57,11),(.63,5),(.69,0),(.74,-5),(.79,-6),(.85,-1),(.90,0),(1,0)])
    y=np.interp(d/L,kf[:,0],kf[:,1]); y=smooth_closed(smooth_closed(y,int(160/step)|1),int(160/step)|1)
    y=y-y[0]; P2=P2-P2[0]   # start/finish line at world origin (0,0,0)
    C=np.stack([P2[:,0],y,P2[:,1]],1)
    T=np.roll(C,-1,0)-np.roll(C,1,0); T/=np.linalg.norm(T,axis=1,keepdims=True)
    R=np.cross(T,UP); R/=np.linalg.norm(R,axis=1,keepdims=True)          # driver's right
    bank=np.clip(ks*120,-1,1)*math.radians(3.0)                          # up to 3 deg, inside low
    def edge_y(lat): return C[:,1]-np.clip(lat,-W/2,W/2)*np.tan(bank)
    rad=1/np.maximum(np.abs(smooth_closed(k,max(3,int(100/step)|1))),1e-5)
    inside=np.sign(ks)                                                   # +1: right side is inside
    def maxlat(side):  # clamp lateral offsets on the inside of tight corners so strips don't fold
        lim=np.where(inside==side,np.maximum(0.8*rad,W/2+2),1e9); return lim
    def pts(lat, dy=0.0):
        lat=np.asarray(lat,float)*np.ones(n); side=np.sign(lat); side[side==0]=1
        lat=np.where(np.abs(lat)>maxlat(side), side*maxlat(side), lat)
        p=C+R*lat[:,None]; p[:,1]=edge_y(lat)+dy; return p
    def wrapmask(lo,hi): x=d%L; return (x>=lo%L)&(x<hi%L) if lo%L<hi%L else (x>=lo%L)|(x<hi%L)
    # ---- segment classification ----
    corner_mask=np.abs(ks)>1/200
    def runs(mask):
        idx=np.where(mask)[0]; 
        if len(idx)==0: return []
        out=[]; s=idx[0]; p=idx[0]
        for i in idx[1:]:
            if i!=p+1: out.append((s,p)); s=i
            p=i
        out.append((s,p))
        if len(out)>1 and out[0][0]==0 and out[-1][1]==n-1: out[0]=(out[-1][0]-n,out[0][1]); out.pop()
        return out
    # corners: runs of |ks|>1/400 with same sign
    corners=[]
    for sgn in (1,-1):
        for a,b in runs((np.sign(ks)==sgn)&(np.abs(ks)>1/700)):
            ii=np.arange(a,b+1)%n; turn=abs(np.sum(ks[ii]))*step
            if turn<math.radians(15): continue
            ap=ii[np.argmax(np.abs(ks[ii]))]
            corners.append(dict(start=a%n,end=b%n,apex=int(ap),dir="right" if sgn>0 else "left",minRadius=float(1/abs(ks[ap])),angleDeg=float(math.degrees(turn))))
    corners.sort(key=lambda c:(c["apex"]-n//50)%n)
    gid=[0]*len(corners)
    for j in range(1,len(corners)):
        a,b=corners[j-1],corners[j]
        gid[j]=gid[j-1] if (a["dir"]!=b["dir"] and (b["apex"]-a["apex"])%n*step<130) else gid[j-1]+1
    for j,c in enumerate(corners):
        size=gid.count(gid[j]); tight=sum(1 for o,gg in zip(corners,gid) if gg==gid[j] and o["minRadius"]<80)
        if c["angleDeg"]>140 and c["minRadius"]<90: t="hairpin"
        elif size<=3 and tight==2 and c["minRadius"]<80: t="chicane"
        elif size<=3 and tight==2: t="kink"
        elif size>=2: t="esses"
        elif c["minRadius"]>110: t="fast sweeper"
        else: t="medium corner"
        c["type"]=t; c["group"]=gid[j]
    for j,c in enumerate(corners): c["name"]=f"T{j+1}"
    # outside surfaces: slow corners get asphalt run-off, medium/fast get gravel
    runoff=[np.zeros(n,bool),np.zeros(n,bool)]; gravel=[np.zeros(n,bool),np.zeros(n,bool)]  # [left,right]
    for c in corners:
        out_side=1 if c["dir"]=="left" else 0      # left turn -> outside is right
        seg=(np.arange(c["start"]-int(90/step),c["end"]+int(50/step)+1))%n
        (runoff if c["minRadius"]<70 else gravel)[out_side][seg]=True
    for s in (0,1): gravel[s]&=~runoff[s]
    # pit lane geometry along main straight (right side = infield)
    PIT_IN0,PIT_IN1,PIT_OUT0,PIT_OUT1=L-330,L-170,500,640
    xd=np.where(d>L/2,d-L,d)  # signed distance around the line
    pl_lat=np.interp(xd,[PIT_IN0-L,PIT_IN1-L,PIT_OUT0,PIT_OUT1],[W/2+1,27,27,W/2+1],left=np.nan,right=np.nan)
    pit_rng=~np.isnan(pl_lat)
    pit_full=(xd>=PIT_IN1-L)&(xd<=PIT_OUT0)
    for m in (runoff[1],gravel[1]): m[pit_rng]=False
    runoff[1][pit_rng]=True
    g=GLB()
    def tex(name,fn=None,img=None,png=False):
        if img is None: img=Image.open(os.path.join(TEX,fn+".png")).convert("RGB")
        if low: img=img.resize((256,256),Image.LANCZOS)
        b=io.BytesIO()
        if png: img.save(b,"PNG",optimize=True); return g.image(b.getvalue(),"image/png")
        img.save(b,"JPEG",quality=82); return g.image(b.getvalue(),"image/jpeg")
    # generated textures: tyre wall and catch fence (alpha)
    ty=Image.new("RGB",(128,128),(22,22,24)); dr=ImageDraw.Draw(ty)
    for i in range(0,128,32): dr.ellipse([i+2,6,i+30,58],outline=(45,45,48),width=4); dr.ellipse([i+2,70,i+30,122],outline=(45,45,48),width=4)
    dr.rectangle([0,60,128,68],fill=(200,200,200))
    fe=Image.new("RGBA",(128,128),(0,0,0,0)); dr=ImageDraw.Draw(fe)
    for i in range(-128,256,16): dr.line([(i,0),(i+128,128)],fill=(170,175,180,255),width=2); dr.line([(i+128,0),(i,128)],fill=(170,175,180,255),width=2)
    dr.rectangle([0,0,127,3],fill=(90,95,100,255))
    TX={k:tex(k,v) for k,v in dict(road="asphalt_plain",runoff="asphalt_worn",kerb="kerb_red_white",grass="grass_plain",terrain="grass_rough",gravel="gravel",concrete="concrete_plain",apron="concrete").items()}
    bn=Image.new("RGB",(512,128),(14,18,40)); dr=ImageDraw.Draw(bn)
    from PIL import ImageFont
    try: fnt=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",72)
    except Exception: fnt=ImageFont.truetype("/usr/share/fonts/truetype/sand-box/google/Sen/Sen-VariableFont_wght.ttf",72)
    dr.rectangle([0,0,511,10],fill=(255,200,40)); dr.rectangle([0,117,511,127],fill=(255,200,40))
    tw=dr.textlength("APEX ARCADE",font=fnt); dr.text(((512-tw)/2,22),"APEX ARCADE",font=fnt,fill=(255,255,255))
    TX["banner"]=tex("banner",img=bn)
    TX["tyre"]=tex("tyre",img=ty); TX["fence"]=tex("fence",img=fe,png=True)
    M=dict(road=dict(tex=TX["road"]),runoff=dict(tex=TX["runoff"]),kerb=dict(tex=TX["kerb"],rough=.7),grass=dict(tex=TX["grass"]),
           terrain=dict(tex=TX["terrain"],color=(.85,.9,.85,1)),gravel=dict(tex=TX["gravel"]),pit_lane=dict(tex=TX["road"],color=(.8,.8,.82,1)),
           concrete=dict(tex=TX["concrete"]),apron=dict(tex=TX["apron"]),paint_white=dict(color=(.95,.95,.95,1),rough=.6),
           guardrail=dict(color=(.72,.74,.78,1),metal=.6,rough=.4,double=True),tyre=dict(tex=TX["tyre"],double=True),
           fence=dict(tex=TX["fence"],alpha="MASK",double=True,metal=.5,rough=.5),post=dict(color=(.35,.36,.38,1),metal=.5,rough=.5),
           stand_frame=dict(color=(.55,.57,.6,1)),stand_seats=dict(color=(.16,.36,.72,1)),stand_roof=dict(color=(.9,.9,.92,1),double=True),
           board_a=dict(color=(.1,.55,.85,1),double=True),board_b=dict(color=(.95,.75,.1,1),double=True),board_c=dict(color=(.12,.12,.14,1),double=True),
           banner=dict(tex=TX["banner"],rough=.6),gantry=dict(color=(.15,.15,.17,1),metal=.4,rough=.5),light_off=dict(color=(.2,0,0,1),emissive=(.15,0,0)),
           garage=dict(color=(.82,.83,.86,1)),garage_door=dict(color=(.25,.27,.3,1)))
    for name,o in M.items(): g.material(name,color=o.get("color",(1,1,1,1)),tex=o.get("tex"),rough=o.get("rough",.9),metal=o.get("metal",0),double=o.get("double",False),alpha=o.get("alpha"),emissive=o.get("emissive"))
    STATS={}
    def strip(A,B,uA,uB,v,mask=None,closed=True):
        """rows of points A (left col) and B (right col); uv u per column, v per row; mask per segment i->i+1"""
        m=len(A); V=np.vstack([A,B]); UV=np.vstack([np.stack([np.full(m,uA) if np.isscalar(uA) else uA,v],1),np.stack([np.full(m,uB) if np.isscalar(uB) else uB,v],1)])
        segs=np.arange(m if closed else m-1)
        if mask is not None: segs=segs[mask[segs]]
        a=segs; c=(segs+1)%m; b=a+m; dd=c+m
        I=np.concatenate([np.stack([a,b,c],1),np.stack([b,dd,c],1)])
        # v discontinuity at wrap: duplicate last row to keep texture continuous
        if closed and (m-1) in segs:
            V=np.vstack([V,A[:1],B[:1]]); UV=np.vstack([UV,[[UV[0,0],v[-1]+(v[-1]-v[-2])],[UV[m,0],v[-1]+(v[-1]-v[-2])]]])
            last=np.where(segs==m-1)[0]; ia,ib=2*m,2*m+1
            I[last]=[m-1,2*m-1,ia]; I[len(segs)+last]=[2*m-1,ib,ia]
        return V,UV,I
    def compact(V,UV,I):
        used=np.unique(I); remap=-np.ones(len(V),int); remap[used]=np.arange(len(used))
        return V[used],(UV[used] if UV is not None else None),remap[I]
    def merge(parts):
        Vs,UVs,Is=[],[],[]; o=0
        for V,UV,I in parts:
            if len(I)==0: continue
            V,UV,I=compact(V,UV,I); Vs.append(V); UVs.append(UV); Is.append(I+o); o+=len(V)
        if not Vs: return np.zeros((0,3)),np.zeros((0,2)),np.zeros((0,3),int)
        return np.vstack(Vs),np.vstack(UVs),np.vstack(Is)
    def add(name,mat,parts,extras=None):
        V,UV,I=merge(parts); g.mesh(name,[(V,UV,I,mat,None)],extras); STATS[name]=len(I)
    vt=d/8.0
    # road
    add("road","road",[strip(pts(-W/2),pts(W/2),0,W/8,vt)],{"surface":"track","width":W})
    # kerbs (both sides in corners), slightly raised
    KW=1.5; parts=[]
    km=corner_mask.copy()
    for s in (-1,1):
        a=pts(s*W/2,.03); b=pts(s*(W/2+KW),.06)
        A,B=(a,b) if s>0 else (b,a)
        parts.append(strip(A,B,0,1,d/6.0,mask=km&~(pit_rng if s>0 else np.zeros(n,bool))))
    add("kerbs","kerb",parts,{"surface":"kerb"})
    # verge bands 0..18 m beyond edge (grass / gravel / run-off), outer grass 18..26 m sloping down
    def band(lat0,lat1,mask,dy0=0,dy1=0,side=1):
        a=pts(side*lat0,dy0); b=pts(side*lat1,dy1); A,B=(a,b) if side>0 else (b,a)
        return strip(A,B,(side*lat0)/8 if side>0 else (side*lat1)/8,(side*lat1)/8 if side>0 else (side*lat0)/8,vt,mask=mask)
    E=W/2
    gm=[~(runoff[0]|gravel[0]),~(runoff[1]|gravel[1])]
    add("grass","grass",[band(E,E+18,gm[0],-.02,-.08,-1),band(E,E+18,gm[1],-.02,-.08,1),
        band(E+18,E+26,np.ones(n,bool),-.08,-.6,-1),band(E+18,E+26,~pit_rng,-.08,-.6,1)],{"surface":"grass"})
    add("gravel_traps","gravel",[band(E,E+18,gravel[0],-.02,-.08,-1),band(E,E+18,gravel[1],-.02,-.08,1)],{"surface":"gravel"})
    add("runoff_asphalt","runoff",[band(E,E+18,runoff[0],-.01,-.05,-1),band(E,E+18,runoff[1]&~pit_rng,-.01,-.05,1),band(E,E+18,pit_rng,-.01,-.01,1)],{"surface":"runoff"})
    # pit lane path + apron
    pl_lat_f=np.nan_to_num(pl_lat,nan=W/2+1); pc=C+R*pl_lat_f[:,None]; pc[:,1]=C[:,1]+.02
    pl_mask=pit_rng&np.roll(pit_rng,-1)
    add("pit_lane","pit_lane",[strip(pc-R*6+[0,0,0],pc+R*6,0,12/8,vt,mask=pl_mask)],{"surface":"pit","speedLimitKmh":80})
    add("pit_apron","apron",[band(E+18,E+60,pit_full&np.roll(pit_full,-1),-.01,-.01,1)],{"surface":"pit"})
    # start line, grid boxes, pit boxes (white paint)
    def quad(cen,t,r,lt,lr,dy=.04):
        c=cen+UP*dy; return np.array([c-t*lt/2-r*lr/2,c-t*lt/2+r*lr/2,c+t*lt/2-r*lr/2,c+t*lt/2+r*lr/2]),np.array([[0,0],[1,0],[0,1],[1,1]]),np.array([[0,1,2],[1,3,2]])
    def at(dist,lat=0.0):
        f=(dist%L)/L*n; i=int(f)%n; j=(i+1)%n; u=f-int(f); c=C[i]*(1-u)+C[j]*u; t=T[i]*(1-u)+T[j]*u; t/=np.linalg.norm(t); r=np.cross(t,UP); r/=np.linalg.norm(r)
        p=c+r*lat; p[1]=c[1]-np.clip(lat,-W/2,W/2)*math.tan(bank[i]); return p,t,r
    p,t,r=at(0); add("start_finish_line","paint_white",[quad(p,t,r,1.0,W)],{"distance":0})
    grid=[]; gp=[]
    for s in range(20):
        dist=-12-8*s; lat=-3.2 if s%2==0 else 3.2; p,t,r=at(dist,lat)
        grid.append(dict(slot=s+1,position=[round(float(x),3) for x in p],heading=[round(float(x),4) for x in t],yawPlusZ=round(math.atan2(t[0],t[2]),4),distance=round(dist%L,2),lateral=lat))
        q=p+t*2.5; gp+= [quad(q,t,r,.25,3.0),quad(q-t*1.2-r*1.5,t,r,2.4,.2),quad(q-t*1.2+r*1.5,t,r,2.4,.2)]
    add("grid_boxes","paint_white",gp)
    pboxes=[]; pb=[]
    for s in range(12):
        dist=PIT_IN1-L+40+s*22; p,t,r=at(dist,0); p=C[int((dist%L)/L*n)%n]+r*36; p[1]+=0.05
        pboxes.append(dict(box=s+1,position=[round(float(x),3) for x in p],heading=[round(float(x),4) for x in t],yawPlusZ=round(math.atan2(t[0],t[2]),4)))
        pb+=[quad(p-r*0.0+t*0,t,r,.2,6,0)]; pb+=[quad(p+t*5,t,r,.2,6,0),quad(p-t*5,t,r,.2,6,0),quad(p+r*3,t,r,10,.2,0)]
    pb.append(strip(pc+R*5.8+[0,.03,0],pc+R*6.0+[0,.03,0],0,1,vt,mask=pl_mask)); pb.append(strip(pc-R*6+[0,.03,0],pc-R*5.8+[0,.03,0],0,1,vt,mask=pl_mask))
    add("pit_boxes","paint_white",pb)
    # boxes helper
    def box(c,t,r,lt,lr,h):
        t=np.array(t,float);t[1]=0;t/=np.linalg.norm(t); r=np.cross(t,UP); u=UP
        V=[];N=[];I=[]
        for ax,a1,a2,s1,s2,s3 in [(u,t,r,h,lt,lr),(-u,r,t,h,lr,lt),(t,r,u,lt,lr,h),(-t,u,r,lt,h,lr),(r,u,t,lr,h,lt),(-r,t,u,lr,lt,h)]:
            cc=c+u*h/2+ax*s1/2; o=len(V)
            for e1,e2 in[(-1,-1),(1,-1),(-1,1),(1,1)]: V.append(cc+a1*e1*s2/2+a2*e2*s3/2); N.append(ax)
            I+=[[o,o+1,o+2],[o+1,o+3,o+2]]
        return np.array(V),np.zeros((24,2)),np.array(I),np.array(N)
    def addbox(name,prims,extras=None):
        out=[]
        for mat,boxes in prims:
            Vs=[];Ns=[];Is=[];o=0
            for V,UV,I,Nn in boxes: Vs.append(V);Ns.append(Nn);Is.append(I+o);o+=len(V)
            if Vs: out.append((np.vstack(Vs),np.zeros((o,2)),np.vstack(Is),mat,np.vstack(Ns)))
        g.mesh(name,out,extras); STATS[name]=sum(len(x[2]) for x in out)
    # pit wall, garages
    pw=[]; pg=[];pdoor=[]
    for i in range(n):
        if pit_full[i] and pit_full[(i+1)%n]:
            a=pts(E+18.3)[i]; b=pts(E+18.3)[(i+1)%n]; pw.append(box((a+b)/2,b-a,None,np.linalg.norm(b-a)+.05,.5,1.0))
    span=np.arange(int((PIT_IN1-L+30)%L/L*n),n).tolist()+np.arange(0,int((PIT_OUT0-20)/L*n)).tolist()
    for j in range(0,len(span)-6,6):
        i0,i1=span[j],span[j+6]; a=C[i0]+R[i0]*48; b=C[i1]+R[i1]*48; a[1]=b[1]=min(C[i0,1],C[i1,1])
        pg.append(box((a+b)/2,b-a,None,np.linalg.norm(b-a)+.3,12,6.5))
        pdoor.append(box((a+b)/2-R[i0]*6.05,b-a,None,np.linalg.norm(b-a)*.8,.2,4.5))
    addbox("pit_wall",[("concrete",pw)]); addbox("pit_garages",[("garage",pg),("garage_door",pdoor)],{"note":"plain unbranded garages"})
    # barriers: guardrail (default), tyre walls on outside of gravel/run-off corners
    BL=E+26
    def vwall(lat,h,mask,side,dy=-.6,u_scale=4.0):
        a=pts(side*lat,dy); b=a+UP*h; return strip(a,b,0,1,d/u_scale,mask=mask) if False else _vw(a,h,mask,u_scale)
    def _vw(a,h,mask,us):
        m=len(a); b=a+UP*h; V=np.vstack([a,b]); UV=np.vstack([np.stack([d/us,np.zeros(m)],1),np.stack([d/us,np.ones(m)],1)])
        segs=np.arange(m); segs=segs[mask[segs]&mask[(segs+1)%m]]; c=(segs+1)%m
        I=np.concatenate([np.stack([segs,c,segs+m],1),np.stack([c,c+m,segs+m],1)]); return V,UV,I
    tyre=[gravel[0]|runoff[0],gravel[1]|runoff[1]]; tyre[1]&=~pit_rng
    rail=[~tyre[0],~tyre[1]&~pit_rng]
    gr=[];gt=[];posts=[]
    for si,s in enumerate((-1,1)):
        gr.append(_vw(pts(s*BL,-.6)+UP*.5,.35,rail[si],4)); gr.append(_vw(pts(s*(BL+.2),-.6)+UP*.5,.35,rail[si],4))
        gt.append(_vw(pts(s*BL,-.6),1.2,tyre[si],2.4)); gt.append(_vw(pts(s*(BL+.9),-.6),1.2,tyre[si],2.4))
        tp=pts(s*BL,-.6); tp2=pts(s*(BL+.9),-.6)
        topm=tyre[si]&np.roll(tyre[si],-1)
        gt.append(strip(tp+UP*1.2,tp2+UP*1.2,0,1,d/2.4,mask=topm) if s>0 else strip(tp2+UP*1.2,tp+UP*1.2,0,1,d/2.4,mask=topm))
        pp=pts(s*(BL+.25),-.6)
        for i in range(0,n,max(1,int(4/step))):
            if rail[si][i]: posts.append(box(pp[i],T[i],None,.12,.12,.95))
    add("guardrails","guardrail",gr,{"barrier":"guardrail","lateral":BL}); add("tyre_walls","tyre",gt,{"barrier":"tyres"})
    addbox("guardrail_posts",[("post",posts)])
    # catch fence behind barriers on outside of corners + main straight left (spectator side)
    straight_left=wrapmask(-200,700)
    fm=[(tyre[0]|straight_left),tyre[1]]
    fp=[]; fl=[]
    for si,s in enumerate((-1,1)):
        fl.append(_vw(pts(s*(BL+1.6),-.6),4.2,fm[si],4.0))
        pp=pts(s*(BL+1.6),-.6)
        for i in range(0,n,max(1,int(8/step))):
            if fm[si][i]: fp.append(box(pp[i],T[i],None,.15,.15,4.4))
    for V,UV,I in fl: UV[:,1]*=4.2/2  # 2 m fence tiles
    add("catch_fence","fence",fl,{"note":"alpha-masked mesh"}); addbox("catch_fence_posts",[("post",fp)])
    # grandstands: list of (distance, side, length)
    stands=[(120,-1,120),(300,-1,120),(480,-1,100)]
    for c in corners:
        if c["type"] in("hairpin","chicane","esses") and c["minRadius"]<50 and len(stands)<9:
            stands.append(((c["apex"])*L/n,1 if c["dir"]=="left" else -1,70))
    sf=[];ss=[];sr=[]; STANDS=[]
    for si_,(dist,side,length) in enumerate(stands):
        p,t,r=at(dist); r=np.cross(t*[1,0,1]/np.linalg.norm(t*[1,0,1]),UP)
        base=p+r*side*(BL+8); base[1]=min(C[:,1].min(),p[1])*0+p[1]-.6
        for tier in range(8):
            c=base+r*side*(tier*1.6+1.0); hgt=.8+tier*.9
            sf.append(box(c,t,None,length,1.6,hgt-0.35)); ss.append(box(c+UP*(hgt-.35),t,None,length*.98,1.2,.35))
            tf=t*[1,0,1]; tf=tf/np.linalg.norm(tf)
            if len(STANDS)<=si_: STANDS.append(dict(stand=si_+1,distance=round(float(dist%L),1),side="right" if side>0 else "left",length=length,facing=[round(float(x),4) for x in -side*r],tangent=[round(float(x),4) for x in tf],rows=[]))
            STANDS[si_]["rows"].append([round(float(x),3) for x in (c+UP*hgt-r*side*0.2)])
        back=base+r*side*(8*1.6+1.0); sf.append(box(back,t,None,length,.6,10))
        for e in(-1,1): sf.append(box(base+r*side*7+t*e*length/2,t,None,.4,.4,10.5))
        sr.append(box(base+r*side*7+UP*10.5,t,None,length+2,15,.25))
    addbox("grandstands",[("stand_frame",sf),("stand_seats",ss),("stand_roof",sr)],{"note":"plain stands, no logos"})
    # ---------------- event dressing (all off the racing surface) ----------------
    def P(dist,lat,dy=-.6): p,t,r=at(dist,0); q=p+r*lat; q[1]=p[1]+dy; tf=t*[1,0,1]; return q,tf/np.linalg.norm(tf),np.cross(tf/np.linalg.norm(tf),UP)
    def rnd(v): return [round(float(x),3) for x in v]
    EV=dict(marshalPosts=[],cameraTowers=[],floodlights=[],bigScreens=[],bridges=[])
    mh=[];mp=[]
    for j,dist in enumerate(np.arange(150,L-200,380)):
        side=-1 if j%2 else 1
        if wrapmask(PIT_IN0,PIT_OUT1)[int(dist/L*n)%n] and side>0: side=-1
        q,t,r=P(dist,side*(BL+3)); mh.append(box(q,t,None,2.2,2.2,2.6)); mp.append(box(q+r*side*0+UP*2.6,t,None,.12,.12,2.5))
        EV["marshalPosts"].append(dict(post=j+1,distance=round(float(dist),1),side="right" if side>0 else "left",flagPole=rnd(q+UP*5.1),facing=rnd(-side*r)))
    g.material("marshal_hut",color=(1,.5,.1,1)); addbox("marshal_posts",[("marshal_hut",mh),("post",mp)],{"note":"flag positions in track-data.json event.marshalPosts"})
    ct=[];cp=[];cc=[]
    sec_d=[0,L/3,2*L/3]
    for j,dist in enumerate(np.linspace(60,L-60,10)):
        side=1 if j%2 else -1
        if wrapmask(PIT_IN0,PIT_OUT1)[int(dist/L*n)%n]: side=-1
        q,t,r=P(dist,side*(BL+7)); ct.append(box(q,t,None,1.4,1.4,9)); cp.append(box(q+UP*9,t,None,3,3,.3)); cc.append(box(q+UP*9.6-r*side*.8,t,None,.9,.5,.6))
        EV["cameraTowers"].append(dict(tower=j+1,distance=round(float(dist),1),sector=int(dist//(L/3))+1,cameraPosition=rnd(q+UP*10.4),side="right" if side>0 else "left"))
    addbox("tv_camera_towers",[("stand_frame",ct),("post",cp),("gantry",cc)])
    g.material("lamp",color=(1,1,.92,1),emissive=(.05,.05,.04),rough=.3)
    fpole=[];fhead=[];flamp=[]
    for j,dist in enumerate(np.arange(0,L,260)):
        side=1 if j%2 else -1
        if wrapmask(PIT_IN0,PIT_OUT1)[int(dist/L*n)%n]: side=-1
        q,t,r=P(dist,side*(BL+5)); fpole.append(box(q,t,None,.5,.5,18)); fhead.append(box(q+UP*18-r*side*.3,t,None,4.2,.6,2.0)); flamp.append(box(q+UP*18.3-r*side*.65,t,None,3.8,.1,1.4))
        EV["floodlights"].append(dict(position=rnd(q+UP*18.5-r*side*1.0),target=rnd(at(dist,0)[0])))
    addbox("floodlights",[("post",fpole),("gantry",fhead),("lamp",flamp)],{"note":"lamp material 'lamp': raise emissive for night mode"})
    # big screens + hospitality + timing tower + podium near the main straight
    g.material("screen",color=(.05,.08,.16,1),emissive=(.02,.04,.12),rough=.2)
    g.material("glass",color=(.35,.55,.7,1),metal=.3,rough=.15)
    bsf=[];bss=[]
    for dist,side in ((600,-1),(2050,-1),(4400,1)):
        q,t,r=P(dist,side*(BL+20)); bsf.append(box(q,t,None,.8,.8,6)); bsf.append(box(q+UP*6,t,None,12.6,.6,7.2)); bss.append(box(q+UP*6.3-r*side*.35,t,None,12,.1,6.6))
        EV["bigScreens"].append(dict(center=rnd(q+UP*9.6-r*side*.42),facing=rnd(-side*r),width=12,height=6.6,tangent=rnd(t)))
    addbox("big_screens",[("gantry",bsf),("screen",bss)],{"note":"screen material 'screen': swap map for a live render target"})
    hb=[];hg=[]
    for dist in (640,700,760):
        q,t,r=P(dist,-(BL+16)); hb.append(box(q,t,None,50,16,4)); hg.append(box(q+UP*4,t,None,48,15,3.2)); hb.append(box(q+UP*7.2,t,None,52,17,.4))
    span2=[(dist) for dist in np.arange(PIT_IN1-L+40,PIT_OUT0-40,60)]
    for dist in span2:
        q,t,r=P(dist,48); hg.append(box(q+UP*6.5,t,None,58,10,3.0)); hb.append(box(q+UP*9.5,t,None,60,12,.4))
    addbox("hospitality",[("garage",hb),("glass",hg)],{"note":"paddock + hospitality suites, plain"})
    q,t,r=P(-40,74); tt_=[box(q,t,None,3.4,3.4,26)]; tp_=[box(q+UP*4-r*1.75,t,None,3,.1,21)]
    EV["timingTower"]=dict(panelCenter=rnd(q+UP*14.5-r*1.8),facing=rnd(-r),width=3,height=21,tangent=rnd(t))
    q2,t2,r2=P(70,70); pd=[box(q2-t2*3,t2,None,2.6,2.6,1.2),box(q2,t2,None,2.6,2.6,1.7),box(q2+t2*3,t2,None,2.6,2.6,.9),box(q2+r2*3,t2,None,14,4,.6)]
    EV["podium"]=dict(first=rnd(q2+UP*1.7),second=rnd(q2-t2*3+UP*1.2),third=rnd(q2+t2*3+UP*.9),facing=rnd(-r2))
    g.material("podium_white",color=(.96,.96,.96,1)); g.material("podium_gold",color=(.95,.75,.2,1),metal=.6,rough=.35)
    addbox("timing_tower",[("gantry",tt_),("screen",tp_)]); addbox("podium",[("podium_white",pd[:1]+pd[2:]),("podium_gold",pd[1:2])])
    # overhead banner bridges (high above the road; nothing on the racing surface)
    brp=[];brd=[];brb=[]
    for dist in (300,2000,4150):
        p,t,r=at(dist,0); tf=t*[1,0,1]; tf/=np.linalg.norm(tf); rr=np.cross(tf,UP); half=E+12
        for e in(-1,1): brp.append(box(p+rr*e*half+UP*-.6,tf,None,1.2,1.2,9.6))
        brd.append(box(p+UP*7.5,tf,None,2.2,2*half+1.2,1.6))
        for nn in (tf,-tf):
            ua=np.cross(-nn,UP); base=p+UP*7.3+nn*1.15; w2=2*half-2
            brb.append((np.array([base-ua*w2/2,base+ua*w2/2,base-ua*w2/2+UP*2.0,base+ua*w2/2+UP*2.0]),np.array([[0,1],[6,1],[0,0],[6,0]]),np.array([[0,1,2],[1,3,2]])))
        EV["bridges"].append(dict(distance=dist,clearanceMetres=7.3))
    addbox("banner_bridges",[("gantry",brp),("stand_frame",brd)]); add("banner_bridges_apex_arcade","banner",brb,{"text":"APEX ARCADE"})
    EV["grandstands"]=STANDS

    # plain boards on straights + braking marker boards before slow corners
    bd={"board_a":[],"board_b":[],"board_c":[]}; brake=[]; banners=[]
    def banner(base,nrm,wid=6.0,h=1.5):
        nrm=np.array(nrm,float); nrm[1]=0; nrm/=np.linalg.norm(nrm); out=[]
        for nn in (nrm,-nrm):
            ua=np.cross(-nn,UP); V=np.array([base-ua*wid/2,base+ua*wid/2,base-ua*wid/2+UP*h,base+ua*wid/2+UP*h])
            out.append((V,np.array([[0,1],[1,1],[0,0],[1,0]]),np.array([[0,1,2],[1,3,2]])))
        return out
    for i in range(0,n,int(60/step)):
        if not corner_mask[i] and not pit_rng[i]:
            for si,s in enumerate((-1,1)):
                if rail[si][i]:
                    p=pts(s*(BL+.6),-.6)[i]; banners.append(banner(p+UP*1.0,-s*R[i]))
    for c in corners:
        if c["minRadius"]<90:
            out_side=-1 if c["dir"]=="right" else 1
            for m in(100,200,300):
                i=int(c["start"]-m/step)%n; p=pts(out_side*(E+20))[i]
                bd["board_c"].append(box(p,T[i],None,.12,1.4,2.2))
                for k2 in range(m//100): bd["board_b"].append(box(p+UP*(.5+k2*.55)-R[i]*out_side*0.0+T[i]*.0,T[i],None,.14,1.2,.3))
                brake.append(dict(corner=c["name"],metresToGo=m,index=i))
    add("banners_apex_arcade","banner",[q for b in banners for q in b],{"text":"APEX ARCADE","note":"swap the banner texture to retheme"})
    addbox("boards",[(k3,v) for k3,v in bd.items()],{"note":"plain unbranded boards; braking markers show 1-3 stripes"})
    # start lights gantry
    p,t,r=at(0); gb=[]; ll=[]
    for s in(-1,1): gb.append(box(p+r*s*(E+3),t,None,.6,.6,8.5))
    gb.append(box(p+UP*7,t,None,1.0,W+6.6,1.2))
    for j in range(5): ll.append(box(p+UP*7.2-t*.55+r*(j-2)*1.4,t,None,.12,.9,.9))
    addbox("start_lights_gantry",[("gantry",gb)]); addbox("start_lights",[("light_off",ll)],{"note":"5 lamps; set material emissive red to light them"})
    # terrain grass heightfield (cell 12 m; 30 m low)
    cell=30 if low else 12; mn=P2.min(0)-260; mx=P2.max(0)+260
    gx=np.arange(mn[0],mx[0]+cell,cell); gz=np.arange(mn[1],mx[1]+cell,cell); X,Z=np.meshgrid(gx,gz); G=np.stack([X.ravel(),Z.ravel()],1)
    best=np.full(len(G),1e9); bh=np.zeros(len(G))
    for c0 in range(0,n,200):
        D=np.linalg.norm(G[:,None]-P2[None,c0:c0+200],axis=2); j=D.argmin(1); dm=D[np.arange(len(G)),j]; u=dm<best; best[u]=dm[u]; bh[u]=C[c0+j[u],1]
    far=np.mean(C[:,1]); wgt=np.clip((best-60)/200,0,1); wgt=wgt*wgt*(3-2*wgt)
    H=(bh-0.65)*(1-wgt)+(far-3+2*np.sin(G[:,0]/170)*np.cos(G[:,1]/130))*wgt
    V=np.stack([G[:,0],H,G[:,1]],1); nx=len(gx); nz=len(gz); ii=np.arange(nx*nz).reshape(nz,nx)
    a=ii[:-1,:-1].ravel(); b=ii[:-1,1:].ravel(); c=ii[1:,:-1].ravel(); dd=ii[1:,1:].ravel()
    # winding for +z rows: (a,c,b) faces up
    I=np.concatenate([np.stack([a,c,b],1),np.stack([b,c,dd],1)])
    g.mesh("terrain_grass",[(V,np.stack([G[:,0]/16,G[:,1]/16],1),I,"terrain",None)],{"surface":"grass"}); STATS["terrain_grass"]=len(I)
    return g,STATS,dict(L=L,n=n,d=d,C=C,T=T,R=R,bank=bank,ks=ks,corners=corners,grid=grid,pboxes=pboxes,pc=pc,pl_mask=pit_rng,brake=brake,step=step,EV=EV,P2=P2,
                       gravel=gravel,runoff=runoff,BL=BL,pit=(PIT_IN0,PIT_IN1,PIT_OUT0,PIT_OUT1))

def track_data(I):
    L,n,d,C,T,R,ks=I["L"],I["n"],I["d"],I["C"],I["T"],I["R"],I["ks"]; step=I["step"]
    # approximate racing line: hug inside at apex, smoothed
    kw=smooth_closed(I["ks"],int(140/step)|1); lat=(W/2-1.6)*np.tanh(kw*260); lat=smooth_closed(lat,int(60/step)|1)
    rl=C+R*lat[:,None]
    kr,_=curvature(rl[:,[0,2]]); kr=smooth_closed(kr,int(24/step)|1); seg=np.linalg.norm(np.roll(rl,-1,0)-rl,axis=1)
    vmax=np.minimum(np.sqrt(32.0/np.maximum(np.abs(kr),1e-6)),88.0); v=vmax.copy()
    for _ in range(3):
        for i in range(n):  # accel
            j=(i+1)%n; a=12.0*max(0.15,1-v[i]/95); v[j]=min(v[j],math.sqrt(v[i]**2+2*a*seg[i]))
        for i in range(n-1,-1,-1):  # braking
            j=(i+1)%n; v[i]=min(v[i],math.sqrt(v[j]**2+2*38.0*seg[i]))
    lap=float(np.sum(seg/v))
    # sectors: split near L/3 and 2L/3 at the straightest nearby point
    sec=[0]
    for f in(1/3,2/3):
        lo,hi=int((f-.04)*n),int((f+.04)*n); sec.append(int(lo+np.argmin(np.abs(ks[lo:hi]))))
    gates=[]
    for gi,i in enumerate(range(0,n,int(100/step))):
        gates.append(dict(id=gi,index=i,distance=round(float(d[i]),2),center=[round(float(x),3) for x in C[i]],direction=[round(float(x),4) for x in T[i]],
                          right=[round(float(x),4) for x in R[i]],halfWidth=I["BL"],sector=int(np.searchsorted(sec,i,side='right'))))
    pts=[dict(i=i,d=round(float(d[i]),2),x=round(float(C[i,0]),3),y=round(float(C[i,1]),3),z=round(float(C[i,2]),3),
              bankDeg=round(math.degrees(float(I["bank"][i])),2),curvature=round(float(ks[i]),5),width=W) for i in range(n)]
    for c in I["corners"]:
        for k2 in("start","end","apex"): c[k2+"Distance"]=round(float(d[c[k2]]),1)
        c["apexSpeedKmh"]=round(float(v[c["apex"]]*3.6))
        c["minRadius"]=round(c["minRadius"],1); c["angleDeg"]=round(c["angleDeg"],1)
    pm=I["pl_mask"]; idx=[i for i in list(range(n//2,n))+list(range(0,n//2)) if pm[i]]
    pit=[[round(float(x),3) for x in I["pc"][i]] for i in idx]
    surf=[]
    for i in range(n):
        surf.append([("gravel" if I["gravel"][0][i] else "runoff" if I["runoff"][0][i] else "grass"),("gravel" if I["gravel"][1][i] else "runoff" if I["runoff"][1][i] else "grass")])
    return dict(
        name="Apex Grand Prix Circuit (original procedural layout)",units="metres (1 unit = 1 m)",axes="Y up; track in XZ plane; right-handed (glTF/three.js)",
        lengthMetres=round(L,1),trackWidth=W,pointSpacing=round(L/n,4),pointCount=n,direction="clockwise when viewed from above (+Y), start line at x=0 heading +X",
        barrierLateral=I["BL"],edgeSurfaces="per point [left,right] surface just outside the track edge (0..18 m): grass|gravel|runoff",
        startLine=dict(index=0,distance=0,position=pts[0] and [pts[0]["x"],pts[0]["y"],pts[0]["z"]],direction=[round(float(x),4) for x in T[0]]),
        sectors=[dict(sector=s+1,startIndex=int(sec[s]),startDistance=round(float(d[sec[s]]),1)) for s in range(3)],
        corners=I["corners"],checkpoints=gates,grid=I["grid"],pitLane=dict(path=pit,width=12,speedLimitKmh=80,entryDistance=round(I["pit"][0],1),exitDistance=I["pit"][3],boxes=I["pboxes"]),
        brakingMarkers=I["brake"],
        racingLine=dict(note="approximate geometric line; lateral metres from centre (+ = driver's right)",lateral=[round(float(x),2) for x in lat],
                        points=[[round(float(a),2) for a in p] for p in rl]),
        aiSpeed=dict(note="target speeds along the racing line, metres/second; built with 32 m/s^2 lateral grip, 12 m/s^2 accel, 38 m/s^2 braking, 88 m/s top",
                     speedMs=[round(float(x),1) for x in v],estimatedLapSeconds=round(lap,1)),
        event=I['EV'],edgeSurface=surf,centerline=pts)

def minimap(I,data,path,size=1024):
    P=I["P2"]; mn=P.min(0); mx=P.max(0); sc=(size-120)/(mx-mn).max(); off=(size-(mx-mn)*sc)/2
    f=lambda p:tuple((np.array(p)-mn)*sc+off)
    im=Image.new("RGBA",(size,size),(0,0,0,0)); dr=ImageDraw.Draw(im)
    pts=[f(p) for p in P]+[f(P[0])]
    for w,col in((11,(20,24,32,255)),(6,(235,238,245,255))):
        for q in pts: dr.ellipse([q[0]-w,q[1]-w,q[0]+w,q[1]+w],fill=col)
    pit=[f((p[0],p[2])) for p in data["pitLane"]["path"]]; dr.line(pit,fill=(120,170,255,255),width=5)
    cols=[(255,90,90,255),(90,200,255,255),(255,210,70,255)]
    for s in data["sectors"]:
        i=s["startIndex"]; p=f(P[i]); dr.ellipse([p[0]-9,p[1]-9,p[0]+9,p[1]+9],fill=cols[s["sector"]-1])
    p=f(P[0]); dr.rectangle([p[0]-4,p[1]-16,p[0]+4,p[1]+16],fill=(30,30,30,255)); dr.rectangle([p[0]-2,p[1]-14,p[0]+2,p[1]+14],fill=(255,255,255,255))
    for c in data["corners"]:
        a=P[c["apex"]]; i=c["apex"]; r=I["R"][i]; s=-1 if c["dir"]=="right" else 1
        q=f((a[0]+r[0]*s*40,a[1]+r[2]*s*40)); dr.text((q[0]-8,q[1]-6),c["name"],fill=(255,255,255,255),stroke_width=2,stroke_fill=(0,0,0,255))
    im.save(path); return mn.tolist(),float(sc),off.tolist()

if __name__=="__main__":
    g,S,I=build(4.0)
    sz=g.save(os.path.join(OUT,"grand-prix-track.glb"))
    data=track_data(I)
    mm=minimap(I,data,os.path.join(OUT,"minimap.png"))
    data["minimap"]=dict(file="minimap.png",size=1024,worldMinXZ=mm[0],pixelsPerMetre=mm[1],offsetPx=mm[2],formula="px = (worldXZ - worldMinXZ) * pixelsPerMetre + offsetPx")
    data["meshes"]={k:dict(triangles=v) for k,v in S.items()}
    json.dump(data,open(os.path.join(OUT,"track-data.json"),"w"),separators=(",",":"),default=lambda o:o.item())
    SL={"-":0}; szl=0
    print("length",round(I["L"],1),"corners",len(I["corners"]),"tris",sum(S.values()),"low tris",sum(SL.values()),"glb MB",round(sz/1e6,2),"low MB",round(szl/1e6,2),"lap",data["aiSpeed"]["estimatedLapSeconds"])
    for c in I["corners"]: print(c["name"],c["type"],c["dir"],c["minRadius"],c["angleDeg"],c["apexDistance"],c["apexSpeedKmh"])
    print(S); print("draw calls",sum(len(m["primitives"]) for m in g.g["meshes"])); print("elev range",round(float(I["C"][:,1].min()),1),round(float(I["C"][:,1].max()),1))
