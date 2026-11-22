"""v279: Chromium check of LANDSCAPE (phone sideways, 844 x 390) on the real UI (browser demo), against portrait (390 x 844):
1. Glass bar size: the bar follows the Settings slider in landscape (height AND width), and stays on screen.
2. Liquid animation settings (wobble, stretch, pill size, magnification, bounce) reach the glass bar in landscape: a real press / drag / release
   on the bar is sampled frame by frame; with the strong settings the pill moves / grows / wobbles clearly more than with the default,
   and the landscape effect is in the same range as portrait.
3. Settings pages (Settings, Animation, Lyrics animation, Background picture, Home screen, sheets) have nothing sticking out of the screen.
Screenshots: tests/out/landscape/.  Run: python3 tests/landscape-check.py"""
import http.server, threading, pathlib, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = pw_helper.out_dir() / 'landscape'; OUT.mkdir(parents=True, exist_ok=True)
MAP = {'/@capacitor/core': 'tests/stubs/capacitor-core.js', '/@capacitor/app': 'tests/stubs/capacitor-app.js'}
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
        return self._send(200, 'text/javascript' if f.suffix == '.js' else 'application/octet-stream', f.read_bytes())
    def _send(self, code, ctype, body):
        self.send_response(code); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); URL = f'http://127.0.0.1:{srv.server_address[1]}/'
threading.Thread(target=srv.serve_forever, daemon=True).start()
fails = []
def check(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
PORT, LAND = {'width': 390, 'height': 844}, {'width': 844, 'height': 390}
STRONG = {'pillWobbleV': 600, 'pillWobbleH': 600, 'pillStretch': 600, 'pillSize': 450, 'magnify': 600, 'bounce': 600, 'speed': 100}
SAMPLE = """async () => { const bar = document.querySelector('#tabs .tabbar, .tabbar:not(.demobar)'), lens = bar.querySelector('.lens'), out = [];
  for (let i = 0; i < 70; i++) { await new Promise(r => requestAnimationFrame(r)); const b = bar.getBoundingClientRect(), l = lens.getBoundingClientRect(); out.push([l.left - b.left, l.width, l.height, b.height]); } return out; }"""
exe = pw_helper.chromium_exe()
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=str(exe) if exe else None, args=['--no-sandbox'])
    def page_with(vp, settings):
        ctx = br.new_context(viewport=vp, device_scale_factor=1); ctx.add_init_script(f"try{{localStorage.setItem('lf.settings', JSON.stringify({json.dumps(settings)}))}}catch(e){{}}")
        p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e))); p.goto(URL); p.wait_for_selector('.tabbar'); p.wait_for_timeout(600)
        for _ in range(3):
            b = p.locator('button:visible', has_text='OK')
            if b.count(): b.first.click(); p.wait_for_timeout(300)
            else: break
        return ctx, p, errs
    def bar_box(p): return p.evaluate("(()=>{const b=document.querySelector('.tabbar:not(.demobar)').getBoundingClientRect();return {w:b.width,h:b.height,l:b.left,r:b.right,t:b.top,bt:b.bottom,vw:innerWidth,vh:innerHeight}})()")
    # 1. bar size
    for vp, name in [(PORT, 'portrait'), (LAND, 'landscape')]:
        hs = []
        for pct in [40, 100, 160, 220]:
            ctx, p, e = page_with(vp, {'tabPct': pct}); b = bar_box(p); hs.append((pct, round(b['h']), round(b['w'])))
            check(b['l'] >= 0 and b['r'] <= b['vw'] + .5 and b['bt'] <= b['vh'] + .5 and b['t'] > b['vh'] * .4, f'{name} bar {pct}% on screen ({b})')
            if name == 'landscape' and pct in (40, 220): p.screenshot(path=str(OUT / f'bar_{pct}.png'))
            ctx.close()
        check(all(hs[i][1] < hs[i + 1][1] for i in range(3)), f'{name}: bar HEIGHT follows Glass bar size {hs}')
        if name == 'landscape': check(all(h[2] >= LAND['width'] - 2 * 24 - 2 for h in hs), f'landscape, nothing playing: the bar spans the whole width at every size {hs}')
    # 1b. v281: music playing in landscape = the bar takes the right half, the mini player the left half, same line
    ctx, p, e = page_with(LAND, {}); wide = bar_box(p)
    p.evaluate("__lf.go('albums'); __lf.push('album','a5')"); p.wait_for_selector('#sub [data-act="shuffleall"]'); p.click('#sub [data-act="shuffleall"]'); p.wait_for_timeout(300)
    p.evaluate("(()=>{while(document.querySelector('#sub [data-act=back]')){document.querySelector('#sub [data-act=back]').click();break}})()"); p.wait_for_selector('#mini .mini'); p.wait_for_timeout(900)
    nb = bar_box(p); mb = p.evaluate("(()=>{const r=document.querySelector('#mini .mini').getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom}})()")
    check(wide['w'] > 780 and nb['w'] < wide['w'] * .6 and nb['l'] > LAND['width'] / 2 - 10, f'music playing: the bar shrinks to the right half ({round(wide["w"])} -> {round(nb["w"])} px, left {round(nb["l"])})')
    check(mb['r'] <= nb['l'] + 1 and mb['l'] >= 0 and abs((mb['t'] + mb['b']) / 2 - (nb['t'] + nb['bt']) / 2) < 3, f'the mini player sits on the left, on the same line, not under the bar ({mb})')
    pill = p.evaluate("(()=>{const b=document.querySelector('.tabbar:not(.demobar)'),l=b.querySelector('.lens').getBoundingClientRect(),o=b.querySelector('.tab.on').getBoundingClientRect();return {lens:(l.left+l.right)/2,tab:(o.left+o.right)/2,w:l.width}})()")
    check(abs(pill['lens'] - pill['tab']) < 6, f'after the bar shrinks, the glass pill sits on the selected tab ({pill})')
    p.screenshot(path=str(OUT / 'bar_with_music.png')); ctx.close()
    ctx, p, e = page_with(LAND, {}); p.screenshot(path=str(OUT / 'bar_no_music.png')); ctx.close()
    # 2. animation settings reach the bar
    res = {}
    for vp, name in [(PORT, 'portrait'), (LAND, 'landscape')]:
        for an, anim in [('default', {}), ('strong', STRONG)]:
            ctx, p, e = page_with(vp, {'anim': anim}); bx = bar_box(p)
            tabs = p.evaluate("[...document.querySelectorAll('.tabbar:not(.demobar) .tab')].map(t=>{const r=t.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})")
            (x0, y0), (x1, _) = tabs[0], tabs[min(3, len(tabs) - 1)]
            p.mouse.move(x0, y0); p.mouse.down(); p.wait_for_timeout(250)
            press = p.evaluate(SAMPLE)
            for k in range(1, 9): p.mouse.move(x0 + (x1 - x0) * k / 8, y0); p.wait_for_timeout(16)
            drag = p.evaluate(SAMPLE); p.mouse.up(); rel = p.evaluate(SAMPLE)
            H = bx['h']; grow = max(s[2] for s in press) / H; stretch = max(s[1] for s in drag) / max(1, min(s[1] for s in press)); ws = [s[1] for s in rel]; wob = (max(ws) - min(ws)) / H
            res[(name, an)] = (round(grow, 2), round(stretch, 2), round(wob, 2)); ctx.close()
            check(not e, f'{name} {an}: no page errors ({e[:2]})')
    print('pill: (press height / bar, drag stretch, release wobble / bar)', res)
    for name in ['portrait', 'landscape']:
        d, s = res[(name, 'default')], res[(name, 'strong')]
        check(s[0] > d[0] * 1.08, f'{name}: "Pill size when pressed" grows the pill ({d[0]} -> {s[0]})')
        check(s[1] > d[1] * 1.05 or s[2] > d[2] * 1.3, f'{name}: wobble / stretch settings change the pill motion (stretch {d[1]} -> {s[1]}, wobble {d[2]} -> {s[2]})')
    L, P = res[('landscape', 'strong')], res[('portrait', 'strong')]
    check(L[0] >= P[0] * .75, f'landscape strong pill grows like portrait ({L[0]} vs {P[0]})')
    # 3. settings pages: nothing sticks out
    ctx, p, errs = page_with(LAND, {})
    OVER = """(()=>{const W=innerWidth,bad=[];for(const el of document.querySelectorAll('#sub *, #sheet *')){const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;if(el.closest('.hscroll,.animdock .demostage,.lens,.lens-mag'))continue;if(r.right>W+1||r.left<-1)bad.push((el.className||el.tagName)+'@'+Math.round(r.left)+'..'+Math.round(r.right))}return bad.slice(0,6)})()"""
    pages = [('settings', "__lf.push('settings')"), ('animation', "__lf.push('animation')"), ('background', "__lf.push('bgset')"), ('home', "__lf.push('homeset')")]
    for nm, js in pages:
        p.evaluate("(()=>{while(document.querySelector('#sub [data-act=\"back\"]')){document.querySelector('#sub [data-act=\"back\"]').click();break}})()"); p.wait_for_timeout(200)
        p.evaluate(js); p.wait_for_timeout(700); bad = p.evaluate(OVER); check(not bad, f'landscape {nm} page: nothing off screen {bad}')
        p.screenshot(path=str(OUT / f'{nm}.png'))
        if nm == 'settings':
            for i, frac in enumerate([.33, .66, 1.0]):
                p.evaluate("(f)=>{let s=document.querySelector('[data-act=lyricstyle]');while(s&&!(s.scrollHeight>s.clientHeight+4&&/(auto|scroll)/.test(getComputedStyle(s).overflowY)))s=s.parentElement;s=s||document.scrollingElement;s.scrollTop=(s.scrollHeight-s.clientHeight)*f}", frac); p.wait_for_timeout(350)
                bad = p.evaluate(OVER); check(not bad, f'landscape settings scrolled {int(frac*100)}%: nothing off screen {bad}'); p.screenshot(path=str(OUT / f'settings_{i+2}.png'))
            for act in ['lyricstyle', 'lyricink']:
                p.evaluate(f"document.querySelector('[data-act=\"{act}\"]').scrollIntoView()"); p.click(f'[data-act="{act}"]'); p.wait_for_selector('#sheet .sheetbox'); p.wait_for_timeout(400)
                bad = p.evaluate(OVER); check(not bad, f'landscape sheet {act}: nothing off screen {bad}'); p.screenshot(path=str(OUT / f'sheet_{act}.png'))
                p.evaluate("document.querySelector('#sheet [data-act=\"sheet-close\"]').click()"); p.wait_for_timeout(400)
    # 4. Now Playing + lyrics (every background style) in landscape
    p.evaluate("(()=>{while(document.querySelector('#sub [data-act=\\'back\\']'))break})()")
    p.evaluate("__lf.go('albums'); __lf.push('album','a5')"); p.wait_for_selector('#sub [data-act="shuffleall"]'); p.click('#sub [data-act="shuffleall"]'); p.wait_for_timeout(300)
    p.evaluate("(()=>{const q=__lf.Native.state.queue,i=q.findIndex(t=>t.id==='t10');if(i>=0)__lf.Native.play(q,i,true)})()"); p.evaluate("__lf.openNP()"); p.wait_for_timeout(700)
    NPOVER = """(()=>{const W=innerWidth,H=innerHeight,bad=[];for(const el of document.querySelectorAll('#np *, #lyr.open *')){const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||el.closest('.lens,.lens-mag,.lyr-blur,.lyr-bgl,.lyr-body'))continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;let a=el.parentElement,clip=false;while(a&&a!==document.body){const c=getComputedStyle(a);if(/hidden|clip/.test(c.overflowX+c.overflowY)){const q=a.getBoundingClientRect();if(q.left>=-1&&q.right<=W+1&&q.bottom<=H+1){clip=true;break}}a=a.parentElement}if(clip)continue;if(r.right>W+1||r.left<-1||r.bottom>H+1)bad.push((el.className&&el.className.baseVal===undefined?el.className:el.tagName)+'@'+Math.round(r.left)+','+Math.round(r.top)+'..'+Math.round(r.right)+','+Math.round(r.bottom))}return bad.slice(0,6)})()"""
    check(not p.evaluate(NPOVER), f'landscape Now Playing: nothing off screen {p.evaluate(NPOVER)}'); p.screenshot(path=str(OUT / 'nowplaying.png'))
    p.click('#np [data-act="lyrics"]'); p.wait_for_selector('#lyr.open .ln'); p.evaluate("__lf.lyTest.lyrPic('/tests/fixtures/demo-pics/c62.jpg')")
    for st in ['classic', 'palette', 'blur', 'home', 'custom']:
        p.evaluate(f"__lf.lyTest.style('{st}')"); p.wait_for_timeout(900)
        check(not p.evaluate(NPOVER), f'landscape lyrics {st}: nothing off screen {p.evaluate(NPOVER)}'); p.screenshot(path=str(OUT / f'lyrics_{st}.png'))
    check(not errs, f'no page errors ({errs[:3]})'); ctx.close(); br.close()
print('FAILED:', len(fails)) if fails else print('ALL PASS'); sys.exit(1 if fails else 0)
