"""v290: Chromium check that tapping Lyrics never freezes the app with a heavy background (owner: "tapping lyrics freezes the app for a second,
lyrics don't even open, especially with Cover colour palette").  A 60-frame 400 px GIF is made here, set as the song's own picture; the CPU is slowed 4x (a mid phone).
For Cover colour palette, Cover blur and Song picture: the lyrics open at once, no frozen stretch over 400 ms, the background still arrives.
The palette from the Web Worker is IDENTICAL to the old main-thread one.  Run: python3 tests/lyrics-open-speed-check.py"""
import http.server, threading, pathlib, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = pw_helper.out_dir() / 'lyspeed'; OUT.mkdir(parents=True, exist_ok=True)
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
    from PIL import Image, ImageDraw
    import math
    IMGD = OUT / 'img'; IMGD.mkdir(parents=True, exist_ok=True); frames = []
    for i in range(60):
        im = Image.new('RGB', (400, 400), (20 + i, 12, 40)); d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 400, 70], fill=(230, 190, 20)); d.ellipse([110 + i % 9, 110, 290, 330], fill=(205, 150, 120))
        for ex in (160, 240): d.ellipse([ex - 14, 190, ex + 14, 208], fill=(245, 245, 245)); d.ellipse([ex - 6, 192, ex + 6, 206], fill=(40, 120, 170))
        d.ellipse([60, 300 + int(10 * math.sin(i / 5)), 120, 360], fill=(200, 20, 60)); frames.append(im)
    frames[0].save(IMGD / 'heavy.gif', save_all=True, append_images=frames[1:], duration=60, loop=0)
    U = '/' + str((IMGD / 'heavy.gif').relative_to(ROOT)).replace('\\\\', '/')
    br = pw.chromium.launch(executable_path=str(exe) if exe else None, args=['--no-sandbox'])
    def page(main_only=False, slow=4):
        ctx = br.new_context(viewport=PORT); p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
        p.goto(URL); p.wait_for_selector('.tabbar'); p.wait_for_timeout(700)
        b = p.locator('button:visible', has_text='OK')
        if b.count(): b.first.click(); p.wait_for_timeout(200)
        if slow > 1: ctx.new_cdp_session(p).send('Emulation.setCPUThrottlingRate', {'rate': slow})
        if main_only: p.evaluate("__lf.palMainOnly()")
        p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(400)
        return ctx, p, errs
    OPEN = """async (style) => { const T = __lf.lyTest, t = __lf.Native.current(); T.songPic(t.id, '%s'); T.style(style); __lf.openNP(); await new Promise(r => setTimeout(r, 500));
      const lt = []; const po = new PerformanceObserver(l => l.getEntries().forEach(e => lt.push(Math.round(e.duration)))); po.observe({ entryTypes: ['longtask'] });
      const t0 = performance.now(); document.querySelector('[data-act="lyrics"]').click(); let shown = 0, bg = 0;
      for (let i = 0; i < 3000; i++) { await new Promise(r => requestAnimationFrame(r)); const now = performance.now() - t0, el = document.getElementById('lyr');
        if (!shown && el && el.classList.contains('open') && el.querySelector('#lyrbody .ln')) shown = now;
        if (!bg && el && (style === 'palette' ? el.style.getPropertyValue('--lyr-pal') : style === 'blur' ? [...el.querySelectorAll('.lyr-blur img')].length === 2 && [...el.querySelectorAll('.lyr-blur img')].every(i => i.src.startsWith('data:')) : el.querySelector('.lyr-bgl'))) bg = now;
        if (shown && bg) break; if (now > 90000) break; }
      po.disconnect(); return { shown: Math.round(shown), bg: Math.round(bg), maxLong: Math.max(0, ...lt), pal: (document.getElementById('lyr') || { style: { getPropertyValue: () => '' } }).style.getPropertyValue('--lyr-pal') }; }""" % U
    for style in ['palette', 'blur', 'pic']:
        ctx, p, e = page(); r = p.evaluate(OPEN, style)
        check(0 < r['shown'] < 600, f'{style}: the lyrics open at once ({r["shown"]} ms, CPU 4x slower)')
        check(r['maxLong'] < 400, f'{style}: the app never freezes (longest frozen stretch {r["maxLong"]} ms; it was 16 s before v290)')
        check(r['bg'] > 0, f'{style}: the background still arrives ({r["bg"]} ms)' + (' - Cover blur: both layers show ONE still frame of the GIF (not playing)' if style == 'blur' else ''))
        check(not e, f'{style}: no page errors {e[:2]}')
        if style == 'palette': worker_pal = r['pal']
        ctx.close()
    ctx, p, e = page(main_only=True, slow=1); r = p.evaluate(OPEN, 'palette'); ctx.close()
    check(worker_pal and worker_pal == r['pal'], f'the Web Worker palette is identical to the old main-thread palette ({len(worker_pal)} chars)')
    br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
