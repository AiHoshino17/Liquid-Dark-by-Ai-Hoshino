# v254: red-circle picture for an ANIMATED file where every colour is circled on the FRAME IT WAS TAKEN FROM (c.fi), not on one middle frame.
# usage (after prep_anim.py + run_anim.mjs):  python3 render_multi.py NAME [title]   -> /home/claude/harness/out_NAME.png
import sys, json, base64, io, math
from PIL import Image, ImageSequence
from playwright.sync_api import sync_playwright
name = sys.argv[1]; title = sys.argv[2] if len(sys.argv) > 2 else name
A = json.load(open(f'/home/claude/harness/anim_{name}.json')); P = json.load(open(f'/home/claude/harness/animpal_{name}.json'))
im = Image.open(A['src']); frames = [f.convert('RGB').copy() for f in ImageSequence.Iterator(im)]
keep = A['keep']
def lab2hex(L, a, b):
    l = (L + .3963377774*a + .2158037573*b)**3; m = (L - .1055613458*a - .0638541728*b)**3; s = (L - .0894841775*a - 1.291485548*b)**3
    c = [4.0767416621*l - 3.3077115913*m + .2309699292*s, -1.2684380046*l + 2.6097574011*m - .3413193965*s, -.0041960863*l - .7034186147*m + 1.707614701*s]
    f = lambda v: 12.92*v if v <= .0031308 else 1.055*v**(1/2.4) - .055
    return '#' + ''.join('%02x' % round(255*f(max(0, min(1, v)))) for v in c)
pal = P['pal']; used = {}
for i, c in enumerate(pal):
    fi = c.get('fi') if c.get('fi') is not None else len(keep)//2
    used.setdefault(fi, []).append(i)
order = sorted(used, key=lambda k: (-len(used[k]), k))
PW = 480; w0, h0 = frames[0].size; PH = round(PW*h0/w0)
def b64(img):
    bio = io.BytesIO(); img.save(bio, 'JPEG', quality=88); return base64.b64encode(bio.getvalue()).decode()
panels = ''
for fi in order:
    fr = frames[keep[fi]].resize((PW, PH), Image.LANCZOS); ci = ''
    for i in used[fi]:
        c = pal[i]
        for (x, y) in [(c['x'], c['y'])] + ([(c['x2'], c['y2'])] if c.get('x2') is not None else []):
            ci += f'<div class="ci" style="left:{min(max(x,0),1)*100}%;top:{min(max(y,0),1)*100}%">{i+1}</div>'
    nums = ', '.join(str(i+1) for i in used[fi])
    panels += f'<div class="pn"><div style="position:relative;width:{PW}px;height:{PH}px"><img src="data:image/jpeg;base64,{b64(fr)}" style="width:{PW}px;height:{PH}px;display:block">{ci}</div><div class="cap">frame {keep[fi]+1} of {A["n"]}: colour {nums}</div></div>'
sw = ''.join(f'<div class="sw"><div class="c" style="background:{lab2hex(c["L"],c["a"],c["b"])}"></div><div class="t">{i+1}&nbsp;{c["share"]*100:.1f}%</div><div class="t2">{lab2hex(c["L"],c["a"],c["b"])}{" eye" if "eye" in c["flags"] else ""}</div></div>' for i, c in enumerate(pal))
lines = ['Placeholder line above', 'The line that is playing', 'Next line fades a little', 'Then another softer line', 'A longer line that wraps onto', 'two rows of text here', 'More lines further down', 'Softer again lower down']
ly = ''.join(f'<div class="ln" style="opacity:{1 if i==1 else max(.35,.75-.08*i)}">{t}</div>' for i, t in enumerate(lines))
css = P['css']; bg = css.split('background-image:')[-1].rstrip(';') if 'background-image' in css else css
rows = math.ceil(len(order)/2); GH = rows*(PH+34)-10
html = f'''<html><body style="margin:0;background:#0e0e10;font-family:DejaVu Sans,sans-serif;color:#fff;width:1360px">
<style>.ci{{position:absolute;width:52px;height:52px;margin:-26px 0 0 -26px;border:5px solid #e11;border-radius:50%;box-sizing:border-box;background:rgba(255,255,255,.05);box-shadow:0 0 0 2px #fff;color:#fff;font:bold 28px DejaVu Sans;text-align:center;line-height:42px;-webkit-text-stroke:2px #e11;paint-order:stroke fill}}
.pn{{width:{PW}px}} .cap{{font:14px DejaVu Sans Mono;color:#ccc;margin:6px 0 14px}}
.sw{{display:inline-block;width:118px;margin-right:6px;vertical-align:top}} .c{{height:52px;border-radius:7px;border:1px solid #444}} .t{{font:bold 15px DejaVu Sans Mono;margin-top:6px;white-space:nowrap}} .t2{{font:12px DejaVu Sans Mono;color:#aaa}}
.ln{{font:bold 21px DejaVu Sans;margin:0 0 24px 22px}}</style>
<div style="padding:22px 24px 0"><div style="font:bold 26px DejaVu Sans">{title} &nbsp;-&nbsp; {len(pal)} colours, read from all {A["n"]} frames</div><div style="font-size:15px;color:#bbb;margin-top:3px">red circle = where each colour was taken from, drawn on the frame it came from (number = rank, biggest first)</div></div>
<div style="display:flex;gap:22px;padding:0 24px;margin-top:12px"><div style="display:grid;grid-template-columns:{PW}px {PW}px;gap:0 22px;align-content:start;width:{PW*2+22}px">{panels}</div>
<div style="width:{300}px;height:{GH}px;position:relative;overflow:hidden;background-image:{bg};border-radius:10px"><div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.3);margin:30px 0 14px 22px"></div>{ly}</div></div>
<div style="padding:8px 24px 24px">{sw}</div></body></html>'''
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1360, 'height': 800}); pg.set_content(html); pg.screenshot(path=f'/home/claude/harness/out_{name}.png', full_page=True); b.close()
print('ok', len(order), 'frames used:', [keep[f]+1 for f in order])
