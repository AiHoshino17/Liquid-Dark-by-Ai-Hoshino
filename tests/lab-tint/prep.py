# makes the f_*.raw 96x96 RGBA frames the lab scripts read (run inside tests/lab-tint): python3 prep.py ; node lab.mjs ../.. new ; node sweep.mjs
from PIL import Image, ImageSequence
import glob, os
W = '../../'
def sq(im): return im.convert('RGBA').resize((96, 96), Image.LANCZOS)
srcs = {os.path.basename(f).split('.')[0]: Image.open(f) for f in sorted(glob.glob(W + 'tests/fixtures/demo-pics/*.jpg') + [W + 'tests/fixtures/demo-pics/banner.png'])}
s = Image.open(W + 'docs/screenshots/colour-mix-detail-v225.png').convert('RGB')
srcs['bedgirl_crop'] = s.crop((0, 22, 585, 352)); srcs['pair_crop'] = s.crop((0, 382, 587, 712))   # crops of the owner's two pictures from the v225 screenshot
for k, im in srcs.items():
    im.convert('RGB').save(f'src_{k}.png'); open(f'f_{k}.raw', 'wb').write(sq(im).tobytes())
g = Image.open(W + 'tests/fixtures/demo-pics/ai.gif'); open('f_aigif.raw', 'wb').write(b''.join(sq(f.copy()).tobytes() for f in ImageSequence.Iterator(g)))
