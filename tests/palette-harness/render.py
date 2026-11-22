import sys, json, base64, io
from playwright.sync_api import sync_playwright
tag=sys.argv[1]
if len(sys.argv)>2 and sys.argv[2].startswith('anim:'):   # v250: python3 render.py TAG anim:NAME  (after run_anim.mjs; the picture = the middle frame of anim_NAME.json)
    an=sys.argv[2][5:]; res={an:json.load(open(f'/home/claude/harness/animpal_{an}.json'))}; A=json.load(open(f'/home/claude/harness/anim_{an}.json'))
    import numpy as _np; from PIL import Image as _I
    _I.fromarray(_np.array(A['p192'][len(A['p192'])//2],dtype=_np.uint8).reshape(192,192,4)[:,:,:3]).resize((760,760)).save(f'/home/claude/src_pics/{an}.png'); order=[an]; titles={an:an+' (animated)'}
else:
    res=json.load(open(f'pal_{tag}.json')); order=list(res.keys())
titles=globals().get('titles') or {**{k:k for k in res},'girl_blush':'girl blush (jpg)','ai_smile':'Ai smile','too_late':'Too Late','starboy':'Starboy'}
import math
def lab2hex(L,a,b):
    l=(L+.3963377774*a+.2158037573*b)**3; m=(L-.1055613458*a-.0638541728*b)**3; s=(L-.0894841775*a-1.291485548*b)**3
    c=[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s]
    f=lambda v: 12.92*v if v<=.0031308 else 1.055*v**(1/2.4)-.055
    return '#'+''.join('%02x'%round(255*f(max(0,min(1,v)))) for v in c)
def page(n):
    o=res[n]; b64=base64.b64encode(open(f'/home/claude/src_pics/{n}.png','rb').read()).decode()
    circles=''; sw=''
    for i,c in enumerate(o['pal']):
        x=min(max(c['x'],.0),1)*100; y=min(max(c['y'],0),1)*100
        circles+=f'<div class="ci" style="left:{x}%;top:{y}%">{i+1}</div>'
        if c.get('x2') is not None: circles+=f'<div class="ci" style="left:{min(max(c["x2"],0),1)*100}%;top:{min(max(c["y2"],0),1)*100}%">{i+1}</div>'   # v250: the 2nd eye of an eye colour is circled too
        sw+=f'<div class="sw"><div class="c" style="background:{lab2hex(c["L"],c["a"],c["b"])}"></div><div class="t">{i+1}&nbsp; {c["share"]*100:.2f}%</div></div>'
    lines=['Placeholder line above','The line that is playing','Next line fades a little','Then another softer line','A longer line that wraps onto','two rows of text here','More lines further down','Softer again lower down']
    ly=''.join(f'<div class="ln" style="opacity:{1 if i==1 else max(.35,.75-.08*i)}">{t}</div>' for i,t in enumerate(lines))
    return f'''<html><body style="margin:0;background:#0e0e10;font-family:DejaVu Sans,sans-serif;color:#fff;width:1183px">
<style>.ci{{position:absolute;width:62px;height:62px;margin:-31px 0 0 -31px;border:5px solid #e11;border-radius:50%;box-sizing:border-box;background:rgba(255,255,255,.05);box-shadow:0 0 0 2px #fff;color:#fff;font:bold 34px DejaVu Sans;text-align:center;line-height:52px;-webkit-text-stroke:2px #e11;paint-order:stroke fill}}
.sw{{display:inline-block;width:98px;margin-right:8px}} .c{{height:52px;border-radius:7px;border:1px solid #333}} .t{{font:bold 14px DejaVu Sans Mono;margin-top:6px;white-space:nowrap}}
.ln{{font:bold 21px DejaVu Sans;margin:0 0 24px 22px}}</style>
<div style="padding:24px 24px 0"><div style="font:bold 26px DejaVu Sans">{titles[n]} &nbsp;-&nbsp; still &nbsp;-&nbsp; {len(o['pal'])} colours</div><div style="font-size:15px;color:#bbb;margin-top:2px">red circle = where each colour was taken from (number = rank)</div></div>
<div style="display:flex;gap:24px;padding:0 24px;margin-top:6px"><div style="position:relative;width:760px;height:760px"><img src="data:image/png;base64,{b64}" style="width:760px;height:760px;display:block">{circles}</div>
<div style="width:352px;height:760px;position:relative;overflow:hidden;background-image:{o['css'].split('background-image:')[-1].rstrip(';') if 'background-image' in o['css'] else o['css']};"><div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.3);margin:36px 0 14px 22px"></div>{ly}</div></div>
<div style="padding:16px 24px 24px;white-space:nowrap">{sw}</div></body></html>'''
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1183,'height':1000})
    for n in order:
        pg.set_content(page(n)); pg.screenshot(path=f'/home/claude/harness/out_{tag}_{n}.png',full_page=True)
    b.close()
print('ok')
