# Announcer robot (owner Oct 19 2026: "take my voice ... the robot uses my voice tuned up and broadcast sounding",
# "I don't want my normal voice - it has to sound better and professional").
# For every line in sounds/announcer/lines.json it makes TWO versions in sounds/voice/:
#   <game>-<name>-you.m4a  : the owner's voice (Chatterbox, MIT, learns a voice from one clip) - only when his clip is set
#   <game>-<name>-pro.m4a  : a free professional stock voice (Kokoro, Apache-2.0)
# then puts both through the broadcast finish (a touch deeper, radio presence, punch). Owner Oct 19: NO echo/reverb - "too much reverb".
# His clip is NEVER in this public repo: sounds/announcer/owner-voice.enc is encrypted, the key is the VOICE_KEY secret.
# Writes sounds/voice/voice.json (the Sound Lab's Announcer tab). Unchanged lines are not made again.
import json, os, sys, subprocess, hashlib, tempfile, re
LINES = 'sounds/announcer/lines.json'; OUT = 'sounds/voice'; os.makedirs(OUT, exist_ok=True)
PRO_VOICE = os.environ.get('PRO_VOICE', 'am_michael')
HYPE = 1.0    # owner 2:47 PM "more spark" -> 1.7 made a mad YELL at the end of lines (3:44 PM); 1.0 + the shouted reference voice    # Chatterbox emotion: 0.5 = calm reading, 1.0+ = a hyped arena announcer (owner: "no enthusiasm")
PRO_REF_TEXT = ('LADIES AND GENTLEMEN! Welcome to the ARENA! Are you READY?! HERE WE GO! OH what a play, UNBELIEVABLE! '
                'HE SHOOTS, HE SCORES! The crowd is going WILD tonight! THREE! TWO! ONE! GO GO GO!')   # Kokoro voices: am_michael, am_fenrir, am_onyx, bm_george ...
# the broadcast finish: a touch deeper (keeps speed), warm chest, radio presence, compressor punch - DRY, no echo (owner)
FINISH = ('aresample=24000,highpass=f=85,asetrate=24000*1.03,aresample=24000,atempo=1.04,'
          'equalizer=f=150:t=q:w=1:g=3,equalizer=f=3000:t=q:w=1.2:g=5,equalizer=f=7500:t=q:w=1:g=2,lowpass=f=11000,'
          'acompressor=threshold=-22dB:ratio=6:attack=4:release=90:makeup=7,'
          'loudnorm=I=-14:TP=-1.2:LRA=7')
lines = json.load(open(LINES))
# owner Oct 19: 🗑 on the Sound Lab = sounds/rejects/voice-<name>.txt -> a new take (Chatterbox reads it differently each time)
TAKES = 'sounds/announcer/takes.json'
takes = {}
try: takes = json.load(open(TAKES))
except Exception: pass
if os.path.isdir('sounds/rejects'):
    for f in os.listdir('sounds/rejects'):
        if f.startswith('voice-') and f.endswith('.txt'):
            n = f[6:-4]; takes[n] = takes.get(n, 0) + 1; os.remove(os.path.join('sounds/rejects', f)); print('RETAKE', n)
json.dump(takes, open(TAKES, 'w'), indent=1)
old = {}
try: old = {v['name']: v for v in json.load(open(os.path.join(OUT, 'voice.json')))['sounds']}
except Exception: pass
ref = None
if os.path.exists('sounds/announcer/owner-voice.enc') and os.environ.get('VOICE_KEY'):
    ref = os.path.join(tempfile.gettempdir(), 'owner-voice.wav')
    subprocess.run(['openssl', 'enc', '-d', '-aes-256-cbc', '-pbkdf2', '-in', 'sounds/announcer/owner-voice.enc', '-out', ref + '.m4a',
                    '-pass', 'env:VOICE_KEY'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', ref + '.m4a', '-ac', '1', '-ar', '24000', ref], check=True)
    print('owner voice: ready')
else:
    print('owner voice: not set yet (only the pro voice is made)')
kokoro = chatter = None
def spark(t):
    # announcers SHOUT the key word: end every line with '!' and make the first big word loud (GOAL, GO, WINNER...)
    return t.strip().replace('...', '... ')
def finish(raw, sr, dst):
    import soundfile as sf
    tmp = dst + '.raw.wav'; sf.write(tmp, raw, sr)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', FINISH, '-ar', '44100', '-c:a', 'aac', '-b:a', '128k', dst], check=True)
    os.remove(tmp)
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout or 0)
out, keep, made = [], {'voice.json'}, 0
for L in lines:
    base = (L['game'] + '-' + L['name']).lower()
    for who in (['you'] if ref else []) + ['pro']:
        name = base + '-' + who
        key = hashlib.sha1(json.dumps([L['text'], who, FINISH, HYPE, 'calm-end-3takes', takes.get(base + '-' + who, 0), PRO_VOICE if who == 'pro' else (os.path.getsize(ref) if ref else 0)]).encode()).hexdigest()[:12]
        dst = os.path.join(OUT, name + '.m4a'); keep.add(name + '.m4a')
        o = old.get(name)
        if o and o.get('key') == key and os.path.exists(dst): out.append(o); print('SAME', name); continue
        try:
            import numpy as np
            import torch; torch.manual_seed(1000 + 97 * takes.get(name, 0))
            if chatter is None:
                from chatterbox.tts import ChatterboxTTS; chatter = ChatterboxTTS.from_pretrained(device='cpu')
            if who == 'pro':
                # owner Oct 19 "the announcer has no enthusiasm": Kokoro reads flat, so it only gives the pro VOICE (a hype
                # paragraph, made once); Chatterbox then speaks every line in that voice with the emotion turned way up
                pro_ref = os.path.join(tempfile.gettempdir(), 'pro-voice.wav')
                if not os.path.exists(pro_ref):
                    if kokoro is None:
                        from kokoro import KPipeline; kokoro = KPipeline(lang_code='a' if PRO_VOICE[0] == 'a' else 'b')
                    import soundfile as sf
                    sf.write(pro_ref, np.concatenate([np.asarray(a) for _, _, a in kokoro(PRO_REF_TEXT, voice=PRO_VOICE, speed=1.05)]), 24000)
            # owner Oct 19 3:44 PM "it's like announcement then mad yell": make 3 takes and keep the one that ends clean -
            # close to the length the words need and NOT louder at the end than in the middle; then cut any tail
            words = len(re.findall(r"[A-Za-z']+", L['text'])); est = 0.34 * words + 0.5 + 0.45 * L['text'].count('...')
            best = None
            for k in range(3):
                w = chatter.generate(spark(L['text']), audio_prompt_path=pro_ref if who == 'pro' else ref, exaggeration=HYPE, cfg_weight=0.5, temperature=0.8)
                a = w.squeeze(0).numpy(); n = len(a)
                q = [float(np.sqrt(np.mean(a[int(n * i / 4):int(n * (i + 1) / 4)] ** 2)) + 1e-6) for i in range(4)]
                score = abs(n / chatter.sr - est) / est + (2.0 if q[3] > 1.25 * max(q[:3]) else 0) + (1.0 if n / chatter.sr > 1.6 * est else 0)
                if best is None or score < best[0]: best = (score, a)
            audio = best[1]; sr = chatter.sr
            cap = int(sr * max(1.2, 1.5 * est))
            if len(audio) > cap:                      # anything far past the words is the model babbling/yelling: fade it out
                audio = audio[:cap].copy(); f = int(sr * 0.15); audio[-f:] *= np.linspace(1, 0, f)
            secs = finish(audio, sr, dst)
        except Exception as e:
            print('FAILED', name, e); continue
        from datetime import datetime, timezone
        out.append({'name': name, 'title': L['text'] + ('  (your voice)' if who == 'you' else '  (pro voice)'), 'game': L['game'], 'tab': 'voice',
                    'file': name + '.m4a', 'dir': 'voice', 'secs': round(secs, 1), 'made': datetime.now(timezone.utc).isoformat(), 'key': key, 'who': who})
        made += 1; print('MADE', name, round(secs, 1), 's')
for f in os.listdir(OUT):
    if f not in keep: os.remove(os.path.join(OUT, f)); print('REMOVED', f)
json.dump({'sounds': out}, open(os.path.join(OUT, 'voice.json'), 'w'), indent=1)
print('ANNOUNCER ROBOT: %d new, %d lines' % (made, len(lines)))
