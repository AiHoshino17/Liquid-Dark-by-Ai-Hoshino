# v250: frames of an animated GIF for run_anim.mjs (item 12). usage: python3 prep_anim.py path/to/file.gif NAME  -> /home/claude/harness/anim_NAME.json
import sys, json, numpy as np
from PIL import Image, ImageSequence
src, name = sys.argv[1], sys.argv[2]
im = Image.open(src); fr = []; dur = []
for f in ImageSequence.Iterator(im):
    fr.append(f.convert('RGB').copy()); dur.append(f.info.get('duration', 100))
def eyehi(i, MW=384):   # v273: like tintGrabEye: true aspect, width up to 384 (no upscale); None for a source under 260 px wide
    w0, h0 = i.size
    if w0 < 260 or h0 < 60: return None
    w = min(MW, w0); h = max(1, round(h0 * w / w0)); a = np.asarray(i.resize((w, h), Image.LANCZOS)).astype(np.uint8)
    return {'w': w, 'h': h, 'd': np.dstack([a, np.full((h, w), 255, np.uint8)]).reshape(-1).tolist()}
def sq(i, s):
    i = i.resize((s, s), Image.LANCZOS)   # same as the app: the WHOLE frame is squeezed to s x s (tintGrab / tintGrabHi), no centre crop
    a = np.asarray(i).astype(np.uint8); return np.dstack([a, np.full((s, s), 255, np.uint8)]).reshape(-1).tolist()
n = len(fr); keep = sorted(set(round(k * (n - 1) / max(1, min(n, 24) - 1)) for k in range(min(n, 24))))
json.dump({'src': src, 'n': n, 'w': [max(d, 10) / 100 for d in dur], 'p32': [sq(f, 32) for f in fr], 'keep': keep,
           'p96': [sq(fr[k], 96) for k in keep], 'p192': [sq(fr[k], 192) for k in keep], 'kw': [max(dur[k], 10) / 100 for k in keep], 'eyeHi': [dict(eyehi(fr[k]), fi=j) for j, k in enumerate(keep) if j % 2 == 0 and eyehi(fr[k])]},
          open(f'/home/claude/harness/anim_{name}.json', 'w'))
print(n, 'frames, kept', len(keep))
