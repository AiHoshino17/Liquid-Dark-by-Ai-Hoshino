"""v308: Header cover chip, preview word fade-in, Refresh art + Rescan suck in EVERY picture. Run: python3 tests/scan-art-all-check.py"""
import http.server, threading, pathlib, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = pw_helper.out_dir() / 'scanart'; OUT.mkdir(parents=True, exist_ok=True)
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
    ctx = br.new_context(viewport=PORT, device_scale_factor=1); p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
    c2 = br.new_context(viewport=PORT, device_scale_factor=2); p = c2.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e))); p.goto(URL); p.wait_for_selector('.tabbar'); p.wait_for_timeout(600)
    for _ in range(3):
        b = p.locator('button:visible', has_text='OK')
        if b.count(): b.first.click(); p.wait_for_timeout(300)
        else: break
    D = '/home/claude/out/ly/'; import os; os.makedirs(D, exist_ok=True)
    T, W = '/tests/out/fit/tall.png', '/tests/out/fit/wide.png'
    nm = p.evaluate("__lf.demoNames()"); nm['artist'] = nm['artist'].replace('&amp;', '&')
    p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(400)
    p.evaluate(f"""(() => {{ const q = __lf.Native.state.queue; q.forEach(t => __lf.lyTest.songPic(t.id, '{T}')); __lf.picDemo('bg', '', '{W}');
      for (const a of ['Juno & the Reeds', 'Kira Vale', 'The Lantern Club', 'Mira Sol', 'Orin Hale']) __lf.picDemo('artist', a, a.length % 2 ? '{T}' : '{W}'); }})()""")
    p.wait_for_timeout(300)
    p.evaluate("__lf.push('artists')"); p.wait_for_timeout(900); p.screenshot(path=D + 'a1-artists.png')
    p.evaluate(f"__lf.push('artist', {nm['artist']!r})"); p.wait_for_timeout(900); p.screenshot(path=D + 'a2-artist.png')
    p.evaluate("document.querySelector('.tabbar [data-tab=library], .tabbar [data-v=library], [data-act=tab][data-tab=library]') ? document.querySelector('.tabbar [data-tab=library], .tabbar [data-v=library], [data-act=tab][data-tab=library]').click() : null"); p.wait_for_timeout(900); p.screenshot(path=D + 'a3-library.png')
    p.evaluate("__lf.openNP()"); p.wait_for_timeout(800)
    for st in ['classic', 'apple', 'palette', 'blur', 'pic', 'home']:
        p.evaluate(f"__lf.lyTest.style('{st}')"); p.wait_for_timeout(200)
        p.click('[data-act=lyrics]'); p.wait_for_timeout(1600); p.screenshot(path=D + f'l-{st}.png')
        p.evaluate("document.querySelector('#lyr [data-act=lyr-close]').click()"); p.wait_for_timeout(700)
    print(errs); br.close()
srv.shutdown()
