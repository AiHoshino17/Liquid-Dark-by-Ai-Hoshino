"""v275: Chromium check of the two lyrics backgrounds (Cover colour palette, Cover blur) on the REAL UI (browser demo), for every picture source:
album cover (the cover read from the music file), a custom picture / GIF / WebP for the album, a custom picture for the song, a Canvas video (webm) and a Canvas GIF.
For each source the style is switched palette -> blur -> palette -> classic -> blur -> palette and every state is checked:
  palette = --lyr-pal set (a gradient) and NO blur layer; blur = a .lyr-blur layer showing THAT source (img / video loaded) and no --lyr-pal; classic = neither.
Pictures: put them in tests/out/lyimgs/ (starboy.png, u1.gif ..., canvas.webm). Screenshots: tests/out/lybg/.  Run: python3 tests/lyrics-bg-sources.py"""
import http.server, threading, pathlib, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / 'tests' / 'out' / 'lyimgs'; OUT = pw_helper.out_dir() / 'lybg'; OUT.mkdir(parents=True, exist_ok=True)
MAP = {'/@capacitor/core': 'tests/stubs/capacitor-core.js', '/@capacitor/app': 'tests/stubs/capacitor-app.js'}
MIME = {'.gif': 'image/gif', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4'}

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        path = self.path.split('?')[0]; dest = self.headers.get('Sec-Fetch-Dest', '')
        if path == '/':
            html = (ROOT / 'index.html').read_text().replace('<script type="module"', '<script type="importmap">{"imports":{"@capacitor/core":"/@capacitor/core","@capacitor/app":"/@capacitor/app"}}</script><link rel="stylesheet" href="/src/styles/tokens.css"><link rel="stylesheet" href="/src/styles/app.css">\n<script type="module"')
            return self._send(200, 'text/html', html.encode())
        if path in MAP: return self._send(200, 'text/javascript', (ROOT / MAP[path]).read_bytes())
        f = ROOT / path.lstrip('/')
        if not f.is_file(): return self._send(404, 'text/plain', b'nf')
        if f.suffix == '.css': return self._send(200, 'text/css', f.read_bytes()) if dest == 'style' else self._send(200, 'text/javascript', b'export default 1;')
        if f.suffix == '.json': return self._send(200, 'text/javascript', b'export default ' + f.read_bytes())
        if f.suffix in MIME: return self._send(200, MIME[f.suffix], f.read_bytes())
        return self._send(200, 'text/javascript' if f.suffix == '.js' else 'application/octet-stream', f.read_bytes())
    def _send(self, code, ctype, body):
        self.send_response(code); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(body))); self.send_header('Accept-Ranges', 'none'); self.end_headers(); self.wfile.write(body)

srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); URL = f'http://127.0.0.1:{srv.server_address[1]}/'
threading.Thread(target=srv.serve_forever, daemon=True).start()
fails = []
def check(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)

pics = sorted(p.name for p in IMG.glob('u*.*'))
CASES = [('album cover (from the file)', 'albumCover', 'starboy.png')] + [(f'custom album picture {p}', 'albumPic', p) for p in pics] + [('custom song picture u4.webp', 'songPic', 'u4.webp'), ('Canvas video (webm)', 'canvas', 'canvas.webm'), ('Canvas GIF', 'canvas', 'u3.gif')]
import os
if os.environ.get('ONLY'): CASES = [c for c in CASES if os.environ['ONLY'] in c[2]]   # e.g. ONLY=starboy: just that picture
exe = pw_helper.chromium_exe()
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=str(exe) if exe else None, args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    page = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1).new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(URL); page.wait_for_selector('#main .tabbar, #tabs'); ev = page.evaluate
    ev("__lf.go('albums'); __lf.push('album','a5')"); page.wait_for_selector('[data-act="shuffleall"]'); page.click('#sub [data-act="shuffleall"]'); page.wait_for_timeout(300)
    ev("__lf.openNP()"); page.wait_for_selector('#np [data-act="lyrics"]'); page.click('#np [data-act="lyrics"]'); page.wait_for_selector('#lyr.open')
    for name, kind, file in CASES:
        u = '/tests/out/lyimgs/' + file
        ev("(()=>{const T=__lf.lyTest,t=__lf.Native.current();T.albumCover('');T.albumPic(t.albumId,'');T.songPic(t.id,'');T.canvas(t,'')})()")
        if kind == 'albumCover': ev(f"__lf.lyTest.albumCover('{u}')")
        elif kind == 'albumPic': ev(f"__lf.lyTest.albumPic(__lf.Native.current().albumId,'{u}')")
        elif kind == 'songPic': ev(f"__lf.lyTest.songPic(__lf.Native.current().id,'{u}')")
        else: ev(f"__lf.lyTest.canvas(__lf.Native.current(),'{u}')")
        src = ev("__lf.lyTest.source().src"); check(src == u, f'{name}: both styles read this source ({src})')
        for st in ['palette', 'blur', 'palette', 'classic', 'blur', 'palette']:
            ev(f"__lf.lyTest.style('{st}')"); page.wait_for_timeout(250)
            try: page.wait_for_function("()=>{const s=getComputedStyle(document.querySelector('#lyr')).getPropertyValue('--lyr-pal');return document.documentElement.dataset.lypal!=='1'||s.trim().length>0}", timeout=30000)
            except Exception: pass
            if st == 'blur':
                try: page.wait_for_function("()=>{const b=document.querySelector('#lyr .lyr-blur');if(!b)return false;const m=b.querySelector('img,video');return m&&((m.naturalWidth||0)>0||(m.readyState||0)>=2)}", timeout=20000)
                except Exception: pass
            s = ev("""(()=>{const l=document.querySelector('#lyr'),b=l.querySelector('.lyr-blur'),m=b&&b.querySelector('img,video');
              return {pal:(l.style.getPropertyValue('--lyr-pal')||'').length, blur:!!b, bsrc:b?b.dataset.src:null, loaded:!!m&&((m.naturalWidth||0)>0||(m.readyState||0)>=2), tag:m?m.tagName:null,
                      lypal:document.documentElement.dataset.lypal, lyblur:document.documentElement.dataset.lyblur, bgimg:getComputedStyle(l).backgroundImage.length}})()""")
            if st == 'palette': check(s['pal'] > 50 and not s['blur'] and s['lypal'] == '1' and s['lyblur'] == '0', f'{name}: palette ON, no blur layer ({s})')
            elif st == 'blur': check(s['blur'] and s['bsrc'] == u and s['loaded'] and s['pal'] == 0 and s['lyblur'] == '1', f'{name}: blur shows THIS picture, no palette ({s})')
            else: check(not s['blur'] and s['pal'] == 0 and s['lypal'] == '0' and s['lyblur'] == '0', f'{name}: classic, neither ({s})')
        if os.environ.get('SHOWPAL'): ev("__lf.lyTest.style('palette')"); page.wait_for_timeout(1500); print('PAL', ev('__lf.lyTest.pal()'))
        for st in ['palette', 'blur']:
            ev(f"__lf.lyTest.style('{st}')"); page.wait_for_timeout(2500 if st == 'blur' else 600)
            for _ in range(3):   # a popup (welcome / update notice) can cover the screen: close it first
                b = page.locator('button:visible', has_text='OK')
                if b.count(): b.first.click(); page.wait_for_timeout(400)
                else: break
            page.locator('#lyr').screenshot(path=str(OUT / f"{file.split('.')[0]}_{kind}_{st}.png"))
    # v277: Home screen background / Custom lyrics background (+ a Canvas shows instead)
    if not os.environ.get('ONLY'):
        st = lambda: ev("""(()=>{const l=document.querySelector('#lyr'),g=l.querySelector('.lyr-bgl'),m=g&&g.querySelector('img,video'),cs=getComputedStyle(l);
          return {lybg:document.documentElement.dataset.lybg, pal:(l.style.getPropertyValue('--lyr-pal')||'').length, blur:!!l.querySelector('.lyr-blur'), layer:g?g.dataset.src:null, cv:!!g&&g.classList.contains('lb-cv'), tag:m?m.tagName:null, loaded:!!m&&((m.naturalWidth||0)>0||(m.readyState||0)>=2), bg:cs.backgroundImage.slice(0,300), bgc:cs.backgroundColor}})()""")
        reset = "(()=>{const T=__lf.lyTest,t=__lf.Native.current();T.albumCover('');T.albumPic(t.albumId,'/tests/out/lyimgs/u3.gif');T.songPic(t.id,'');T.canvas(t,'')})()"
        ev(reset); ev("__lf.lyTest.homeBg('')");
        def go(v, wait=900):
            ev(f"__lf.lyTest.style('{v}')"); page.wait_for_timeout(wait)
            for _ in range(3):
                b = page.locator('button:visible', has_text='OK')
                if b.count(): b.first.click(); page.wait_for_timeout(300)
                else: break
            return st()
        s1 = go('home'); check(s1['lybg'] == 'home' and not s1['layer'] and not s1['blur'] and s1['pal'] == 0 and s1['bg'] == 'none' and s1['bgc'] == 'rgb(0, 0, 0)', f'Home style, no Home picture: plain black ({s1})')
        page.locator('#lyr').screenshot(path=str(OUT / 'home_black.png'))
        ev("__lf.lyTest.homeBg('/tests/out/lyimgs/u5.webp')"); s2 = go('home', 1500); check(s2['lybg'] == 'home' and 'u5.webp' in s2['bg'] and not s2['layer'], f'Home style: the Home picture / GIF ({s2})')
        page.locator('#lyr').screenshot(path=str(OUT / 'home_pic.png'))
        ev("__lf.lyTest.canvas(__lf.Native.current(),'/tests/out/lyimgs/canvas.webm')"); s4 = go('home', 2000); check(s4['layer'] == '/tests/out/lyimgs/canvas.webm' and s4['cv'] and s4['tag'] == 'VIDEO' and s4['loaded'], f'Home style + Canvas: the Canvas video shows ({s4})')
        page.locator('#lyr').screenshot(path=str(OUT / 'home_canvas.png'))
        s5 = go('palette', 300); s5 = go('home', 2000); check(s5['layer'] == '/tests/out/lyimgs/canvas.webm' and s5['cv'] and s5['loaded'], f'Home style + Canvas: the Canvas video shows ({s5})')
        # v286: Song picture style: the album's GIF, then the song's own picture over it, then the Canvas over both, then back
        ev("__lf.lyTest.canvas(__lf.Native.current(),'')"); sp1 = go('pic', 1500); check(sp1['lybg'] == 'pic' and sp1['layer'] == '/tests/out/lyimgs/u3.gif' and sp1['loaded'] and not sp1['cv'], f'Song picture style: the album GIF you set ({sp1})')
        page.locator('#lyr').screenshot(path=str(OUT / 'pic_album.png'))
        ev("__lf.lyTest.songPic(__lf.Native.current().id,'/tests/out/lyimgs/u5.webp')"); sp2 = go('palette', 300); sp2 = go('pic', 1500); check(sp2['layer'] == '/tests/out/lyimgs/u5.webp' and sp2['loaded'], f'Song picture style: the song picture wins over the album one ({sp2})')
        page.locator('#lyr').screenshot(path=str(OUT / 'pic_song.png'))
        ev("__lf.lyTest.canvas(__lf.Native.current(),'/tests/out/lyimgs/canvas.webm')"); sp3 = go('palette', 300); sp3 = go('pic', 2000); check(sp3['layer'] == '/tests/out/lyimgs/canvas.webm' and sp3['tag'] == 'VIDEO', f'Song picture style + Canvas: the Canvas shows ({sp3})')
        ev("__lf.lyTest.songPic(__lf.Native.current().id,'')")
        ev("__lf.lyTest.canvas(__lf.Native.current(),'')"); s6 = go('home'); check(not s6['layer'] and 'u5.webp' in s6['bg'], f'Canvas off: back to the Home picture ({s6})')
        for v, ok in [('palette', lambda x: x['pal'] > 50 and not x['layer'] and x['lybg'] == ''), ('blur', lambda x: x['blur'] and not x['layer']), ('home', lambda x: not x['blur'] and not x['layer'] and 'u5.webp' in x['bg']), ('classic', lambda x: not x['layer'] and not x['blur'] and x['lybg'] == '')]:
            x = go(v, 1500); check(ok(x), f'switch to {v} ({x})')
        # v278: lyrics text colour on any style
        col = lambda: ev("(()=>{const l=document.querySelector('#lyr .lyr-t b');return {ink:document.documentElement.dataset.lyink,c:getComputedStyle(l).color}})()")
        ev("(()=>{const q=__lf.Native.state.queue,i=q.findIndex(t=>t.id==='t10');if(i>=0)__lf.Native.play(q,i,true)})()"); page.wait_for_selector('#lyrbody .ln', timeout=15000)   # a demo song WITH lyrics
        for sty in ['home', 'palette', 'classic']:
            for ink, want in [('white', 'rgb(255, 255, 255)'), ('black', 'rgb(0, 0, 0)')]:
                go(sty, 1200); ev(f"__lf.lyTest.ink('{ink}')"); page.wait_for_timeout(200); x = col(); check(x['ink'] == ink and x['c'] == want, f'{sty} + {ink} text ({x})')
                page.locator('#lyr').screenshot(path=str(OUT / f'ink_{sty}_{ink}.png'))
        ev("__lf.lyTest.ink('auto')"); go('classic'); x = col(); check(x['ink'] == 'auto' and x['c'] != 'rgb(0, 0, 0)', f'auto: style colour back ({x})')
        ev("__lf.lyTest.homeBg('')")
    check(not errs, f'no page errors ({errs[:3]})')
    br.close()
print('FAILED:', len(fails)) if fails else print('ALL PASS'); sys.exit(1 if fails else 0)
