import sys, json, numpy as np
from PIL import Image
names=sys.argv[1:]
out={}
for n in names:
    im=Image.open(f'/home/claude/src_pics/{n}.png').convert('RGB')
    def rgba(s):
        a=np.asarray(im.resize((s,s),Image.LANCZOS)).astype(np.uint8)
        return np.dstack([a,np.full((s,s),255,np.uint8)]).reshape(-1).tolist()
    w0,h0=im.size; eh=None
    if w0>=260 and h0>=60:
        w=min(384,w0); h=max(1,round(h0*w/w0)); a=np.asarray(im.resize((w,h),Image.LANCZOS)).astype(np.uint8); eh={'w':w,'h':h,'d':np.dstack([a,np.full((h,w),255,np.uint8)]).reshape(-1).tolist()}
    out[n]={'p32':rgba(32),'p96':rgba(96),'p192':rgba(192),'eyeHi':eh}
json.dump(out,open('frames.json','w'))
