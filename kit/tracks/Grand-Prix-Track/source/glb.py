"""Tiny dependency-free glTF 2.0 / GLB writer (numpy only)."""
import json, struct, numpy as np, base64
class GLB:
    def __init__(s):
        s.bin=bytearray(); s.g={"asset":{"version":"2.0","generator":"Apex Grand Prix Track builder"},
            "scene":0,"scenes":[{"name":"GrandPrixTrack","nodes":[]}],"nodes":[],"meshes":[],"accessors":[],
            "bufferViews":[],"materials":[],"textures":[],"images":[],"samplers":[{"magFilter":9729,"minFilter":9987,"wrapS":10497,"wrapT":10497}]}
        s.mat_ids={}
    def _view(s,data,target=None):
        while len(s.bin)%4: s.bin+=b'\0'
        v={"buffer":0,"byteOffset":len(s.bin),"byteLength":len(data)}
        if target: v["target"]=target
        s.bin+=data; s.g["bufferViews"].append(v); return len(s.g["bufferViews"])-1
    def _acc(s,arr,typ,comp,target,minmax=False,normalized=False):
        a={"bufferView":s._view(arr.tobytes(),target),"componentType":comp,"count":int(arr.shape[0]),"type":typ}
        if minmax: a["min"]=arr.min(0).tolist(); a["max"]=arr.max(0).tolist()
        if normalized: a["normalized"]=True
        s.g["accessors"].append(a); return len(s.g["accessors"])-1
    def image(s,data,mime):
        s.g["images"].append({"bufferView":s._view(data),"mimeType":mime}); s.g["textures"].append({"sampler":0,"source":len(s.g["images"])-1})
        return len(s.g["textures"])-1
    def material(s,name,color=(1,1,1,1),tex=None,rough=0.9,metal=0.0,double=False,alpha=None,emissive=None):
        m={"name":name,"pbrMetallicRoughness":{"baseColorFactor":list(color),"metallicFactor":metal,"roughnessFactor":rough}}
        if tex is not None: m["pbrMetallicRoughness"]["baseColorTexture"]={"index":tex}
        if double: m["doubleSided"]=True
        if alpha=="MASK": m["alphaMode"]="MASK"; m["alphaCutoff"]=0.5
        elif alpha: m["alphaMode"]=alpha
        if emissive: m["emissiveFactor"]=list(emissive)
        s.g["materials"].append(m); s.mat_ids[name]=len(s.g["materials"])-1; return s.mat_ids[name]
    def mesh(s,name,prims,extras=None):
        """prims: list of (V[N,3], UV[N,2] or None, I[M,3], material_name, N[N,3] or None)"""
        P=[]
        for V,UV,I,mat,Nr in prims:
            V=np.asarray(V,np.float32); I=np.asarray(I,np.uint32).reshape(-1)
            if len(I)==0: continue
            if Nr is None: Nr=vnormals(V,I.reshape(-1,3))
            at={"POSITION":s._acc(V,"VEC3",5126,34962,True),"NORMAL":s._acc(np.asarray(Nr,np.float32),"VEC3",5126,34962)}
            hasTex="baseColorTexture" in s.g["materials"][s.mat_ids[mat]]["pbrMetallicRoughness"]
            if UV is not None and hasTex: at["TEXCOORD_0"]=s._acc(np.asarray(UV,np.float32),"VEC2",5126,34962)
            if V.shape[0]<65536: ia=s._acc(I.astype(np.uint16),"SCALAR",5123,34963)
            else: ia=s._acc(I,"SCALAR",5125,34963)
            P.append({"attributes":at,"indices":ia,"material":s.mat_ids[mat]})
        if not P: return
        s.g["meshes"].append({"name":name,"primitives":P})
        node={"name":name,"mesh":len(s.g["meshes"])-1}
        if extras: node["extras"]=extras
        s.g["nodes"].append(node); s.g["scenes"][0]["nodes"].append(len(s.g["nodes"])-1)
    def save(s,path,gltf_path=None):
        while len(s.bin)%4: s.bin+=b'\0'
        g=dict(s.g); g["buffers"]=[{"byteLength":len(s.bin)}]
        js=json.dumps(g,separators=(',',':')).encode()
        while len(js)%4: js+=b' '
        out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(s.bin))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(s.bin),0x004E4942)+bytes(s.bin)
        open(path,'wb').write(out)
        if gltf_path:
            g2=dict(g); g2["buffers"]=[{"byteLength":len(s.bin),"uri":"data:application/octet-stream;base64,"+base64.b64encode(bytes(s.bin)).decode()}]
            open(gltf_path,'w').write(json.dumps(g2))
        return len(out)
def vnormals(V,F):
    n=np.zeros_like(V,dtype=np.float64); fn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]])
    for j in range(3): np.add.at(n,F[:,j],fn)
    l=np.linalg.norm(n,axis=1); z=l<1e-12; n[z]=[0,1,0]; l[z]=1; return (n/l[:,None]).astype(np.float32)
