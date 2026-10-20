"""Centerline layout + analysis for the Apex Grand Prix circuit (original design)."""
import numpy as np
# control points (x, z) in metres, driving order. Start/finish straight runs +x along z=0.
CP = np.array([
 (-200,0),(200,0),(600,0),(900,0),(1010,10),(1060,70),(1030,135),(960,150),   # main straight, T1 hairpin
 (820,150),(700,190),(640,290),(680,420),(820,490),(1050,510),               # back toward sweepers
 (1300,515),(1450,520),(1500,540),(1550,500),(1600,520),(1700,590),          # back straight, chicane
 (1760,720),(1730,860),(1640,890),(1570,830),                                # sweeper + top hairpin
 (1470,760),(1380,820),(1290,760),(1200,820),(1100,770),                     # esses
 (950,820),(780,880),(500,880),(340,830),(280,700),(330,560),(280,420),      # long west run, downhill sweep
 (160,340),(40,250),(-120,200),(-260,150),(-350,70),(-310,10)])              # final sector to the line

SCALE=0.9
def catmull(P, n_per=60, alpha=0.5):
    N=len(P); out=[]
    for i in range(N):
        p0,p1,p2,p3=P[(i-1)%N],P[i],P[(i+1)%N],P[(i+2)%N]
        def tj(ti,a,b): return ti+np.linalg.norm(b-a)**alpha
        t0=0;t1=tj(t0,p0,p1);t2=tj(t1,p1,p2);t3=tj(t2,p2,p3)
        for t in np.linspace(t1,t2,n_per,endpoint=False):
            A1=(t1-t)/(t1-t0)*p0+(t-t0)/(t1-t0)*p1;A2=(t2-t)/(t2-t1)*p1+(t-t1)/(t2-t1)*p2;A3=(t3-t)/(t3-t2)*p2+(t-t2)/(t3-t2)*p3
            B1=(t2-t)/(t2-t0)*A1+(t-t0)/(t2-t0)*A2;B2=(t3-t)/(t3-t1)*A2+(t-t1)/(t3-t1)*A3
            out.append((t2-t)/(t2-t1)*B1+(t-t1)/(t2-t1)*B2)
    return np.array(out)

def resample(P, step):
    Q=np.vstack([P,P[:1]]); seg=np.linalg.norm(np.diff(Q,axis=0),axis=1); s=np.concatenate([[0],np.cumsum(seg)])
    L=s[-1]; n=int(round(L/step)); t=np.linspace(0,L,n,endpoint=False)
    return np.stack([np.interp(t,s,Q[:,0]),np.interp(t,s,Q[:,1])],1), L

def smooth_closed(a, w):
    if w<=1: return a
    k=np.hanning(w); k/=k.sum(); n=len(a)
    ext=np.concatenate([a[-w:],a,a[:w]]); r=np.convolve(ext,k,'same'); return r[w:w+n]

def centerline(step=4.0):
    P=catmull(CP.astype(float)*SCALE)
    P,L=resample(P,1.0)
    for _ in range(3):  # light smoothing to remove kinks
        P=np.stack([smooth_closed(P[:,0],25),smooth_closed(P[:,1],25)],1)
    P,L=resample(P,step)
    # rotate so index 0 is the start line at x=0 on the main straight
    i0=np.argmin(np.where(np.abs(P[:,1])<30,np.abs(P[:,0]-150),1e9)); P=np.roll(P,-i0,0)
    P,L=resample(P,step)
    return P,L

def curvature(P):
    n=len(P); d=np.roll(P,-1,0)-np.roll(P,1,0); h=np.arctan2(d[:,1],d[:,0])
    dh=np.angle(np.exp(1j*(np.roll(h,-1)-np.roll(h,1)))); ds=np.linalg.norm(np.roll(P,-1,0)-np.roll(P,1,0),axis=1)
    return dh/ds, h
