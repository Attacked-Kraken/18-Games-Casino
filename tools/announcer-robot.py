# Announcer robot (owner Oct 19 2026: "take my voice ... the robot uses my voice tuned up and broadcast sounding",
# "I don't want my normal voice - it has to sound better and professional").
# For every line in sounds/announcer/lines.json it makes TWO versions in sounds/voice/:
#   <game>-<name>-you.m4a  : the owner's voice (Chatterbox, MIT, learns a voice from one clip) - only when his clip is set
#   <game>-<name>-pro.m4a  : a free professional stock voice (Kokoro, Apache-2.0)
# then puts both through the broadcast finish (deeper + fuller, radio presence, punch, arena PA echo).
# His clip is NEVER in this public repo: sounds/announcer/owner-voice.enc is encrypted, the key is the VOICE_KEY secret.
# Writes sounds/voice/voice.json (the Sound Lab's Announcer tab). Unchanged lines are not made again.
import json, os, sys, subprocess, hashlib, tempfile
LINES = 'sounds/announcer/lines.json'; OUT = 'sounds/voice'; os.makedirs(OUT, exist_ok=True)
PRO_VOICE = os.environ.get('PRO_VOICE', 'am_michael')   # Kokoro voices: am_michael, am_fenrir, am_onyx, bm_george ...
# the broadcast finish: a touch deeper (keeps speed), warm chest, radio presence, compressor punch, arena PA slap-back
FINISH = ('aresample=24000,highpass=f=85,asetrate=24000*0.94,aresample=24000,atempo=1.0638,'
          'equalizer=f=150:t=q:w=1:g=3,equalizer=f=3000:t=q:w=1.2:g=5,equalizer=f=7500:t=q:w=1:g=2,lowpass=f=11000,'
          'acompressor=threshold=-22dB:ratio=6:attack=4:release=90:makeup=7,'
          'aecho=0.85:0.55:70|140|260:0.22|0.14|0.08,loudnorm=I=-14:TP=-1.2:LRA=7')
lines = json.load(open(LINES))
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
        key = hashlib.sha1(json.dumps([L['text'], who, FINISH, PRO_VOICE if who == 'pro' else (os.path.getsize(ref) if ref else 0)]).encode()).hexdigest()[:12]
        dst = os.path.join(OUT, name + '.m4a'); keep.add(name + '.m4a')
        o = old.get(name)
        if o and o.get('key') == key and os.path.exists(dst): out.append(o); print('SAME', name); continue
        try:
            import numpy as np
            if who == 'pro':
                if kokoro is None:
                    from kokoro import KPipeline; kokoro = KPipeline(lang_code='a' if PRO_VOICE[0] == 'a' else 'b')
                audio = np.concatenate([np.asarray(a) for _, _, a in kokoro(L['text'], voice=PRO_VOICE, speed=0.95)]); sr = 24000
            else:
                if chatter is None:
                    from chatterbox.tts import ChatterboxTTS; chatter = ChatterboxTTS.from_pretrained(device='cpu')
                w = chatter.generate(L['text'], audio_prompt_path=ref, exaggeration=0.75, cfg_weight=0.35)
                audio = w.squeeze(0).numpy(); sr = chatter.sr
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
