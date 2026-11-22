"""v288 / v289: Chromium check of the LANDSCAPE water split / merge, every style of Settings > Animation > Landscape mini player.
Start music: player and bar start JOINED (one bar: a full water bridge), pull apart, the neck thins and snaps; at rest nothing is left over (gap 16 px).
Stop music: the player stays as a ghost, tips reach out, they join again, the ghost is removed, the bar is wide. Off / Reduce Motion / portrait: no water.
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
      const mr = m && m.getBoundingClientRect(); out.push({ bl: b.left, bw: b.width, ml: mr ? mr.left : null, mr: mr ? mr.right : null, joined: !!(m && m.style.clipPath), shape: !!(nk && nk.style.display !== 'none'),
        op: m ? +getComputedStyle(m.firstElementChild).opacity : null, leaving: !!document.querySelector('#mini .mini.leaving'), inl: document.querySelector('#tabs').style.width }); } return out; }"""
    for st in ['cell', 'stretch', 'drip', 'jelly']:
        ctx, p, e = page_with(LAND, {'barSplit': {'style': st}}); wide = p.evaluate("document.querySelector('#tabs').getBoundingClientRect().width")
        p.evaluate("__lf.demoPlay()"); fr = p.evaluate(SAMPLE, 90)
        if st != 'jelly':
            check(fr[0]['joined'] or fr[1]['joined'], f'{st} split: starts joined (one bar with a water bridge)')
            ji = [i for i, f in enumerate(fr) if f['joined']]; check(len(ji) >= 3 and max(ji) < 80, f'{st} split: joined for {len(ji)} frames, then the neck snaps')
            gaps = [f['bl'] - f['mr'] for f in fr if f['mr'] is not None]; check(max(gaps) > 20, f'{st} split: it stretches apart past the rest gap (max {round(max(gaps))} px)')
        else: check(not any(f['joined'] for f in fr), 'jelly: no water bridge')
        check(fr[-1]['inl'] == '' and not fr[-1]['shape'] and abs((fr[-1]['bl'] - fr[-1]['mr']) - 16) < 1.5, f"{st} split: at rest the bar is back on its CSS size, nothing drawn, gap {round(fr[-1]['bl'] - fr[-1]['mr'])} px")
        check(fr[0]['op'] < .5 and fr[-1]['op'] > .99, f"{st}: the player's content fades in")
        p.wait_for_timeout(600); p.evaluate("__lf.demoStop()"); fr = p.evaluate(SAMPLE, 80)
        check(fr[0]['leaving'], f'{st} merge: the player stays as a ghost while it merges')
        if st != 'jelly': check(any(f['joined'] for f in fr), f'{st} merge: they join again into one bar')
        p.wait_for_timeout(400); s2 = p.evaluate("({mini: !!document.querySelector('#mini .mini'), w: document.querySelector('#tabs').getBoundingClientRect().width, inl: document.querySelector('#tabs').style.width})")
        check(not s2['mini'] and abs(s2['w'] - wide) < 2 and s2['inl'] == '', f'{st} merge: ghost removed, bar wide again ({s2})')
        p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(300); p.evaluate("__lf.demoStop()"); p.wait_for_timeout(150); p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(1700)
        s3 = p.evaluate("({n: document.querySelectorAll('#mini .mini').length, leaving: !!document.querySelector('#mini .mini.leaving'), w: document.querySelector('#tabs').getBoundingClientRect().width, inl: document.querySelector('#tabs').style.width})")
        check(s3['n'] == 1 and not s3['leaving'] and s3['w'] < wide * .7 and s3['inl'] == '', f'{st}: play / stop / play quickly = one live player, bar short ({s3})')
        check(not e, f'{st}: no page errors {e[:2]}')
        ctx.close()
    for name, vp, stt in [('Off', LAND, {'barSplit': {'style': 'off'}}), ('Reduce Motion', LAND, {'motion': True}), ('portrait', PORT, {})]:
        ctx, p, e = page_with(vp, stt); p.evaluate("__lf.demoPlay()"); fr = p.evaluate(SAMPLE, 20)
        check(not any(f['joined'] or f['shape'] for f in fr), f'{name}: no water'); p.evaluate("__lf.demoStop()"); p.wait_for_timeout(50)
        check(not p.evaluate("!!document.querySelector('#mini .mini')"), f'{name}: the player goes at once'); ctx.close()
    # the setting in the real UI
    ctx, p, e = page_with(PORT, {}); p.evaluate("__lf.push('animation')"); p.wait_for_selector('#bsplit')
    p.click('#bsplit [data-act="bsplit"]'); p.wait_for_selector('[data-act="bsplitset"][data-v="stretch"]'); p.click('[data-act="bsplitset"][data-v="stretch"]'); p.wait_for_timeout(300)
    saved = p.evaluate("JSON.parse(localStorage.getItem('lf.settings')).barSplit"); txt = p.inner_text('#bsplit')
    check(saved['style'] == 'stretch' and 'Long stretch' in txt and 'Stretch' in txt and 'Speed' in txt, f'Settings: choosing Long stretch saves it and shows Speed + Stretch ({saved})')
    p.screenshot(path=str(OUT / 'settings.png'), full_page=False)
    p.eval_on_selector('#bsplit input[data-bsk="speed"]', "el => { el.value = 150; el.dispatchEvent(new Event('input', {bubbles: true})); }"); p.wait_for_timeout(700)
    check(p.evaluate("JSON.parse(localStorage.getItem('lf.settings')).barSplit.speed") == 150, 'Settings: the Speed slider saves')
    check(not e, f'settings: no page errors {e[:2]}'); ctx.close()
    br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
