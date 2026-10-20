"""Procedural PBR textures for the realistic Grand Prix track (all tileable). Output: source/tex/*.jpg|png"""
import numpy as np, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"tex"); os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(11)
def fbm(n,beta=2.0,lo=1,hi=None,seed=0,m=None):
    r=np.random.default_rng(seed); m=m or n
    fy=np.fft.fftfreq(n)[:,None]*n; fx=np.fft.fftfreq(m)[None,:]*m; f=np.sqrt(fx**2+fy**2); f[0,0]=1
    amp=f**(-beta/2); amp[f<lo]=0
    if hi: amp[f>hi]=0
    x=np.real(np.fft.ifft2(amp*np.exp(2j*np.pi*r.random((n,m)))))
    return (x-x.min())/(x.max()-x.min()+1e-9)
def normal_from_height(h,strength=4.0):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*strength; gy=(np.roll(h,-1,0)-np.roll(h,1,0))*strength
    n=np.stack([-gx,gy,np.ones_like(h)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return Image.fromarray(((n*.5+.5)*255).astype(np.uint8))
def rgb(a): return Image.fromarray(np.clip(a*255,0,255).astype(np.uint8))
def save(img,name,q=84):
    p=os.path.join(OUT,name)
    if name.endswith(".png"): img.save(p,optimize=True)
    else: img.convert("RGB").save(p,quality=q)
def stones(n,count,seed,period=True):
    """periodic voronoi: returns distance-to-centre (D1), cell id, edge (D2-D1)"""
    r=np.random.default_rng(seed); P=r.random((count,2))*n
    yy,xx=np.mgrid[0:n,0:n].astype(np.float32); D1=np.full((n,n),1e9,np.float32); D2=D1.copy(); ID=np.zeros((n,n),np.int32)
    for i,(px,py) in enumerate(P):
        dx=np.abs(xx-px); dx=np.minimum(dx,n-dx); dy=np.abs(yy-py); dy=np.minimum(dy,n-dy); d=np.sqrt(dx*dx+dy*dy)
        m=d<D1; D2=np.where(m,D1,np.minimum(D2,d)); ID=np.where(m,i,ID); D1=np.where(m,d,D1)
    return D1,ID,D2-D1
# ---- asphalt (tile 4 m, 1024) ----
N=1024
agg_f1,agg_id,agg_e=stones(N,5200,1)
cell_tone=np.random.default_rng(2).random(5200)[agg_id]
stone_h=np.clip(agg_e/3.0,0,1)**.6            # bumps for each aggregate stone
mott=fbm(N,2.6,1,40,3); fine=fbm(N,1.0,60,None,4)
alb=0.10+0.05*mott+0.07*(cell_tone*stone_h)+0.035*fine
bright=(np.random.default_rng(5).random(5200)[agg_id]>.93)*stone_h*.12
alb=alb+bright
A=np.stack([alb*1.0,alb*1.0,alb*1.04],-1); save(rgb(A),"asphalt_albedo.jpg")
h=stone_h*.8+fine*.2; save(normal_from_height(h,3.0),"asphalt_normal.jpg",78)
rough=0.82+0.12*fbm(N,2.0,2,80,6)-0.1*bright*5
orm=np.stack([0.85+0.15*stone_h,np.clip(rough,0,1),np.zeros_like(rough)],-1); save(rgb(orm).resize((512,512),Image.LANCZOS),"asphalt_orm.jpg")
# ---- concrete (tile 4 m, 512) ----
n=512; c=0.55+0.12*fbm(n,2.4,1,30,7)+0.05*fbm(n,1,40,None,8); pits=(fbm(n,0.5,100,None,9)>.8)*-.08
save(rgb(np.stack([c+pits]*3,-1)*[1,.99,.96]),"concrete_albedo.jpg"); save(normal_from_height(fbm(n,1.2,20,None,10),1.5),"concrete_normal.jpg")
# ---- kerb (u across 0..1 = 1.5 m, v along: 2 stripes per tile, tile 3 m) ----
n=512; v=np.arange(n)[:,None]/n; u=np.arange(n)[None,:]/n
red=(v%1.0)<.5
base=np.where(red[...,None],np.array([.62,.05,.05]),np.array([.86,.86,.84]))*np.ones((n,n,1))
dirt=fbm(n,2.2,1,40,12)[...,None]; tyre=np.exp(-((u-.15)/.12)**2)[...,None]*.35*fbm(n,1.5,4,None,13)[...,None]
base=base*(0.85+0.2*dirt)-tyre
save(rgb(base),"kerb_albedo.jpg")
# rumble: ridges across on the outer half (sawtooth along v)
saw=(v*24)%1.0; ridge=np.where(u>.45,np.clip(saw*1.4,0,1)*np.clip((u-.45)/.1,0,1),0)
save(normal_from_height(ridge*1.0+fbm(n,1,50,None,14)*.05,6),"kerb_normal.jpg",90)
# ---- mowed grass (tile 16 m with 2 stripes, 1024) ----
N=1024; v=np.arange(N)[:,None]/N; band=0.5+0.5*np.tanh(np.sin(2*np.pi*v)*6)
band=np.clip(band+0.5*(np.sin(np.pi*2*v)*0),0,1)
blades=fbm(N,1.0,80,None,15); clump=fbm(N,2.4,2,40,16)
g=np.stack([0.12+0.05*blades+0.04*clump,0.30+0.10*blades+0.08*clump,0.08+0.03*blades],-1)
stripe=1.0+0.065*(band*2-1)[...,None]
save(rgb(g*stripe),"grass_mowed_albedo.jpg")
save(normal_from_height(blades,2.5).resize((512,512),Image.LANCZOS),"grass_normal.jpg")
# rough grass for terrain (tile 16 m)
g2=np.stack([0.14+0.06*blades+0.06*clump,0.29+0.10*blades+0.08*clump,0.09+0.04*clump],-1); save(rgb(g2).resize((512,512),Image.LANCZOS),"grass_rough_albedo.jpg")
# ---- gravel (tile 2 m, 512) ----
n=512; f1,gid,ge=stones(n,1400,17); r=np.random.default_rng(18); tone=r.random(1400)[gid]; hue=r.random(1400)[gid]
dome=np.clip(ge/4.0,0,1)**.5
dome=np.clip(ge/6.0,0,1)**.8
lit=np.clip(0.9+1.2*((np.roll(dome,1,1)-np.roll(dome,-1,1))+(np.roll(dome,1,0)-np.roll(dome,-1,0))),0.7,1.15)
gr=np.stack([.55+.25*tone+.06*hue,.51+.22*tone,.43+.18*tone-.05*hue],-1)*(0.45+0.55*dome[...,None])*lit[...,None]
save(rgb(gr),"gravel_albedo.jpg"); save(normal_from_height(dome,5),"gravel_normal.jpg",90)
# ---- tyre stacks (tile 2.4 m wide x 1.2 m high: 4 tyres x 2 rows) ----
W,H=512,256; yy,xx=np.mgrid[0:H,0:W]/np.array([H,W])[:,None,None]
cx=(xx*4)%1-.5; cy=(yy*2)%1-.5; rr=np.sqrt(cx**2+(cy*1.0)**2)*2
side=np.clip(1-np.abs(rr-.75)/.25,0,1); hole=rr<.45
th=np.where(hole,0,side**.5)*(cy<.38)
tb=0.06+0.06*side+0.02*fbm(256,1,30,None,19,512)
belt=((yy%0.5)>.44)*(xx*0+1)   # light strap band between rows
col=np.stack([tb,tb,tb*1.05],-1); col=np.where(hole[...,None],0.015,col); col=np.where(belt[...,None]>0,np.array([.85,.85,.82]),col)
save(rgb(col),"tyre_albedo.jpg"); save(normal_from_height(th,8),"tyre_normal.jpg",90)
# ---- chain-link fence (alpha tested, tile 1 m, 256) ----
n=256; im=Image.new("RGBA",(n,n),(0,0,0,0)); d=ImageDraw.Draw(im); step=n/16
for i in range(-16,33):
    x=i*step; d.line([(x,0),(x+n,n)],fill=(185,190,195,255),width=2); d.line([(x+n,0),(x,n)],fill=(185,190,195,255),width=2)
save(im,"chainlink.png")
# ---- seats (tile: u 4 m along x one tread 0.9 m) ----
W,H=512,128; im=Image.new("RGB",(W,H),(110,112,118)); d=ImageDraw.Draw(im)
for i in range(16):
    x=i*W/16; d.rounded_rectangle([x+3,10,x+W/16-3,70],6,fill=(22,72,150)); d.rectangle([x+5,70,x+W/16-5,96],fill=(18,58,124))
save(im,"seats_albedo.jpg")
# ---- garage door (ribbed) ----
W,H=256,256; a=np.zeros((H,W)); a[:]=((np.arange(H)%16)<2)[:,None]*1.0
door=np.stack([.30+.1*(1-a)]*3,-1)*[1,1,1.05]; save(rgb(door),"door_albedo.jpg"); save(normal_from_height(np.convolve(a.ravel(),np.ones(3)/3,'same').reshape(H,W),4),"door_normal.jpg")
# ---- track marks: left half = rubber line (2 wheel tracks), right half = skid streaks. RGBA, alpha = darkness ----
W,H=512,1024; u=np.arange(W)[None,:]/W; v=np.arange(H)[:,None]/H
uu=u*2; streak=fbm(H,1.0,1,None,20,W)   # along-v noise
ul=np.clip(uu,0,1)
rub=(np.exp(-((ul-.3)/.09)**2)+np.exp(-((ul-.7)/.09)**2))*.85+np.exp(-((ul-.5)/.32)**2)*.35
rub=rub*(0.75+0.25*fbm(H,2,1,20,21,W))
sk=np.zeros((H,W)); r=np.random.default_rng(22)
lines=np.zeros(W)
for k in range(26): c=r.uniform(.05,.95); w=r.uniform(.006,.02); lines+=np.exp(-((np.arange(W)/W*2-1-c)/w)**2)*r.uniform(.5,1)
lines=np.clip(lines,0,1)[None,:]*(0.6+0.4*np.sin(v*np.pi*2*3+r.random()*6))
al=np.where(u<.5,rub,lines)*(0.85+0.15*streak)
al[:, :4]=0; al[:,W//2-4:W//2+4]=0; al[:,-4:]=0
img=np.dstack([np.full((H,W),.04),np.full((H,W),.04),np.full((H,W),.045),np.clip(al,0,1)])
Image.fromarray((img*255).astype(np.uint8),"RGBA").resize((256,512),Image.LANCZOS).save(os.path.join(OUT,"marks.png"),optimize=True)
# ---- banner ----
bn=Image.new("RGB",(1024,256),(12,16,38)); d=ImageDraw.Draw(bn); fnt=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",150)
d.rectangle([0,0,1023,18],fill=(255,200,40)); d.rectangle([0,237,1023,255],fill=(255,200,40))
tw=d.textlength("APEX ARCADE",font=fnt); d.text(((1024-tw)/2,38),"APEX ARCADE",font=fnt,fill=(255,255,255)); save(bn,"banner.jpg",88)
print(sorted(os.listdir(OUT)))
