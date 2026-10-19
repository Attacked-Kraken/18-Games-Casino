import sys,subprocess; sys.path.insert(0,'.'); from voicegen import say
V={"af_heart":("Hype announcer, bright","Ladies and gentlemen, are you ready? It's time for the big final!",1.08),
"af_bella":("Young energetic","Whoa, you leveled up! New skin unlocked, let's keep going!",1.1),
"af_nicole":("Soft, calm guide","Take a deep breath. Tap and hold to charge your jump, then let go.",0.95),
"af_sarah":("Friendly coach","Nice work! Keep your eyes up, and pass to the open player.",1.02),
"bf_emma":("Warm UK narrator","Long ago, beyond the silver mountains, a small kingdom waited for a hero.",0.98),
"bf_isabella":("Bright UK presenter","Welcome back to the arena! Tonight's contenders are ready to go.",1.05),
"am_michael":("Warm US narrator","Every great journey starts with one step. Yours starts right now.",1.0),
"am_fenrir":("Gruff tough guy","Listen up, rookie. Nobody gets through this gate without a fight.",0.95),
"am_puck":("Young energetic","Let's go, let's go! Three in a row, you are on fire!",1.1),
"am_onyx":("Deep arena MC","In the blue corner, the undefeated champion of the night!",0.95),
"am_eric":("Calm coach","Good. Now slow it down, read the defense, and make the smart play.",1.0),
"bm_george":("UK sports caller","And he shoots! What a strike! Absolutely magnificent!",1.08),
"bm_fable":("Young UK hero","Right then, follow me. The treasure is just past the old bridge!",1.05)}
A="Hi, I'm one of your game voices. Welcome to the arcade, let's have some fun!"
for v,(st,line,sp) in V.items():
    say(v,A,f"/tmp/a_{v}.wav",1.0); say(v,line,f"/tmp/r_{v}.wav",sp)
    subprocess.run(["ffmpeg","-y","-i",f"/tmp/a_{v}.wav","-f","lavfi","-t","0.6","-i","anullsrc=r=44100:cl=mono","-i",f"/tmp/r_{v}.wav","-filter_complex","[0][1][2]concat=n=3:v=0:a=1","-b:a","128k",f"/workspace/voices/auditions/{v}.mp3"],check=True,capture_output=True)
    print(v,flush=True)
