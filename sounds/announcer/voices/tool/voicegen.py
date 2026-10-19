"""Game voice generator (Kokoro-82M, offline). Usage:
  python voicegen.py VOICE "Text to say!" out.mp3 [--speed 1.05] [--lang en-us|en-gb]
  As a library: from voicegen import say, polish
Needs: pip install kokoro-onnx soundfile; kokoro-v1.0.onnx + voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases), ffmpeg.
"""
import sys,os,subprocess,json,tempfile,argparse,re
import soundfile as sf, numpy as np
KDIR=os.environ.get("KOKORO_DIR","/workspace/kokoro"); _k=None
def _kok():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k=Kokoro(f"{KDIR}/kokoro-v1.0.onnx",f"{KDIR}/voices-v1.0.bin")
    return _k
def lufs(f):
    o=subprocess.run(["ffmpeg","-i",f,"-af","ebur128","-f","null","-"],capture_output=True,text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS",o)[-1])
def polish(wav_in,out,target=-16.0):
    """HPF, de-ess, gentle presence EQ, trim silence, then measured gain + limiter to hit target LUFS."""
    t=tempfile.mktemp(suffix=".wav")
    af=("silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
        "highpass=f=80,deesser=i=0.4,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3200:t=q:w=1.2:g=2,"
        "acompressor=threshold=-20dB:ratio=2.5:attack=5:release=80,apad=pad_dur=0.12")
    subprocess.run(["ffmpeg","-y","-i",wav_in,"-af",af,"-ar","44100","-ac","1",t],check=True,capture_output=True)
    for _ in range(2):  # gain toward target, limiter guards peaks; second pass corrects limiter loss
        g=target-lufs(t); t2=tempfile.mktemp(suffix=".wav")
        subprocess.run(["ffmpeg","-y","-i",t,"-af",f"volume={g:.2f}dB,alimiter=limit=0.89:level=false","-ar","44100",t2],check=True,capture_output=True); t=t2
    args=["-c:a","libvorbis","-q:a","5"] if out.endswith(".ogg") else (["-b:a","128k"] if out.endswith(".mp3") else [])
    subprocess.run(["ffmpeg","-y","-i",t,*args,out],check=True,capture_output=True)
    return out
def say(voice,text,out,speed=1.0,lang=None):
    lang=lang or ("en-gb" if voice.startswith("b") else "en-us")
    s,sr=_kok().create(text,voice=voice,speed=speed,lang=lang)
    w=tempfile.mktemp(suffix=".wav"); sf.write(w,s,sr); return polish(w,out)
if __name__=="__main__":
    a=argparse.ArgumentParser(); a.add_argument("voice"); a.add_argument("text"); a.add_argument("out")
    a.add_argument("--speed",type=float,default=1.0); a.add_argument("--lang"); p=a.parse_args()
    say(p.voice,p.text,p.out,p.speed,p.lang); print(p.out)
