"""v288: Chromium check of the LANDSCAPE water split / merge (owner picked option 1 "Water split").
Start music: the bar slides right, the mini player is only shown where the bar has left it, a water neck joins them, thins and snaps (then gone at rest).
Stop music: the mini player stays as a ghost while the bar flows back, the neck forms again, the ghost is removed, the bar is wide again. Reduce Motion: no neck, instant.
Frames: tests/out/lsplit/.  Run: python3 tests/landscape-split-check.py"""
import http.server, threading, pathlib, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = pw_helper.out_dir() / 'lsplit'; OUT.mkdir(parents=True, exist_ok=True)
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
    SAMPLE = """async (n) => { const out = []; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r));
      const b = document.querySelector('#tabs').getBoundingClientRect(), m = document.querySelector('#mini .mini'), nk = document.querySelector('.lneck');
      const mr = m && m.getBoundingClientRect(); out.push({ bl: b.left, bw: b.width, mr: mr ? mr.right : null, clip: m ? m.style.clipPath : '', op: m ? getComputedStyle(m.firstElementChild).opacity : null,
        neck: !!(nk && nk.style.display !== 'none' && nk.querySelector('.lneck-f').getAttribute('d')), joined: !!(nk && nk.style.display !== 'none' && /A.*A/.test(nk.querySelector('.lneck-f').getAttribute('d') || '') && !/Z.*Z/.test(nk.querySelector('.lneck-f').getAttribute('d') || '')), leaving: !!document.querySelector('#mini .mini.leaving') }); } return out; }"""
    START = "(()=>{const q=__lf.Native.state.queue.length?__lf.Native.state.queue:null; __lf.go('albums'); __lf.push('album','a5'); setTimeout(()=>document.querySelector('#sub [data-act=\"shuffleall\"]').click(),50)})()"
    STOP = "(async()=>{await __lf.Native.pause(); __lf.Native.state.index=-1; __lf.renderMini()})()"
    for slow in (False, True):
        ctx, p, e = page_with(LAND, {}); wide = p.evaluate("document.querySelector('#tabs').getBoundingClientRect().width")
        if slow: p.evaluate("document.documentElement.style.setProperty('--dur-k','4')")
        p.evaluate(START); p.wait_for_selector('#mini .mini')
        if slow:
            for i in range(14): p.screenshot(path=str(OUT / f'split_{i:02d}.png'), clip={'x': 0, 'y': 290, 'width': 600, 'height': 100}); p.wait_for_timeout(60)
        else:
            fr = p.evaluate(SAMPLE, 50)
            check(any(f['clip'] for f in fr[:6]), 'split: at the start the mini player is hidden under the bar (clipped)')
            check(any(f['joined'] for f in fr), 'split: a water neck joins the mini player and the bar on the way')
            ji = max(i for i, f in enumerate(fr) if f['joined']); check(not fr[-1]['neck'] and not fr[-1]['clip'], f'split: at rest the neck has snapped and gone, nothing clipped (last joined frame {ji})')
            check(fr[0]['op'] is not None and float(fr[0]['op']) < .5 and float(fr[-1]['op']) > .99, f"split: the player's cover / title fade in late ({fr[0]['op']} -> {fr[-1]['op']})")
            check(fr[-1]['bw'] < wide * .7, f"split: the bar ends short on the right ({round(fr[-1]['bw'])} of {round(wide)})")
        p.wait_for_timeout(2600 if slow else 900)
        p.evaluate(STOP)
        if slow:
            for i in range(14): p.screenshot(path=str(OUT / f'merge_{i:02d}.png'), clip={'x': 0, 'y': 290, 'width': 600, 'height': 100}); p.wait_for_timeout(60)
        else:
            fr = p.evaluate(SAMPLE, 50)
            check(fr[0]['leaving'], 'merge: the mini player stays as a ghost while the bar flows back')
            check(any(f['joined'] for f in fr), 'merge: the neck forms again and they merge')
            p.wait_for_timeout(500)
            st = p.evaluate("({mini: !!document.querySelector('#mini .mini'), w: document.querySelector('#tabs').getBoundingClientRect().width, neck: (document.querySelector('.lneck')||{style:{display:'none'}}).style.display})")
            check(not st['mini'] and st['w'] > wide - 2 and st['neck'] == 'none', f'merge: ghost removed, bar wide again, no neck ({st})')
            # restart while the ghost is still there: the new mini player replaces it
            p.evaluate(START); p.wait_for_selector('#mini .mini'); p.evaluate(STOP); p.wait_for_timeout(120); p.evaluate("__lf.Native.state.index=0; __lf.renderMini()"); p.wait_for_timeout(1200)
            st = p.evaluate("({n: document.querySelectorAll('#mini .mini').length, leaving: !!document.querySelector('#mini .mini.leaving'), w: document.querySelector('#tabs').getBoundingClientRect().width})")
            check(st['n'] == 1 and not st['leaving'] and st['w'] < wide * .7, f'music back during the merge: one live player, bar short ({st})')
        check(not e, f'no page errors {e}')
        ctx.close()
    # Reduce Motion: instant, no neck, no ghost
    ctx, p, e = page_with(LAND, {'motion': True}); p.evaluate(START); p.wait_for_selector('#mini .mini'); fr = p.evaluate(SAMPLE, 20)
    check(not any(f['neck'] or f['clip'] for f in fr), 'Reduce Motion: no neck, no clipping')
    p.evaluate(STOP); check(not p.evaluate("!!document.querySelector('#mini .mini')"), 'Reduce Motion: the player goes at once')
    ctx.close()
    # portrait untouched
    ctx, p, e = page_with(PORT, {}); p.evaluate(START); p.wait_for_selector('#mini .mini'); fr = p.evaluate(SAMPLE, 20)
    check(not any(f['neck'] or f['clip'] for f in fr), 'portrait: no water split'); p.evaluate(STOP); check(not p.evaluate("!!document.querySelector('#mini .mini')"), 'portrait: the player goes at once as before')
    ctx.close(); br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
