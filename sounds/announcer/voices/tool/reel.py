import sys,subprocess; sys.path.insert(0,'.'); from voicegen import say,lufs
voice,out=sys.argv[1],sys.argv[2]; sp=float(sys.argv[3]) if len(sys.argv)>3 else 1.05
L=["Hey there, welcome to Apex Arcade! Grab your coins, pick a game, and let's play!",
"And here comes the striker, one defender to beat... he shoots! Goal! What a finish!",
"Drivers, start your engines! Three... two... one... go, go, go!",
"Level up! You just earned five hundred coins and a brand new power-up. Amazing!",
"Quick tip: tap and hold to charge your jump, then let go to fly over the gap.",
"Victory! You beat the boss, and the whole crowd is cheering your name!",
"Oh no, game over! But hey, that was a great run. Ready to try again?"]
import os; PAD=os.environ.get("PAD","0.9")
fs=[]
for i,t in enumerate(L):
    f=f"/tmp/reel_{voice}_{i}.wav"; say(voice,t,f,sp); fs.append(f)
args=[];fl=""
for i,f in enumerate(fs): args+=["-i",f]; fl+=f"[{i}]apad=pad_dur={PAD}[p{i}];"
fl+="".join(f"[p{i}]" for i in range(len(fs)))+f"concat=n={len(fs)}:v=0:a=1[v]"
subprocess.run(["ffmpeg","-y",*args,"-filter_complex",fl,"-map","[v]","/tmp/reelv.wav"],check=True,capture_output=True)
d=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0","/tmp/reelv.wav"]))
# soft crowd/air bed ~ -32 LUFS under voice
subprocess.run(["ffmpeg","-y","-i","/tmp/reelv.wav","-f","lavfi","-i",f"anoisesrc=c=pink:r=44100:a=0.3:d={d}",
 "-filter_complex","[1]highpass=f=200,lowpass=f=1500,tremolo=f=0.25:d=0.4,volume=0.05,afade=t=in:d=1,afade=t=out:st=%f:d=1.5[n];[0][n]amix=inputs=2:duration=first:normalize=0[m]"%(d-1.5),
 "-map","[m]","/tmp/reelm.wav"],check=True,capture_output=True)
g=-16-lufs("/tmp/reelm.wav")
subprocess.run(["ffmpeg","-y","-i","/tmp/reelm.wav","-af",f"volume={g:.2f}dB,alimiter=limit=0.89:level=false","-b:a","160k",out],check=True,capture_output=True)
print(out,d,lufs(out))
