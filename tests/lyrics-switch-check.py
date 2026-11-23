"""v293: Chromium check (owner: "switching song, the previous song's lyrics background (Cover colour palette / Cover blur) stays 0.4-0.8 s, make it almost none").
Three songs get their own picture (two GIFs and a PNG, made here). Lyrics open, Next / Previous: the new song's background must be there in the SAME frame
(read ahead), and never the old song's colours. A jump to a song that was not read ahead: the old colours go at once.  Run: python3 tests/lyrics-switch-check.py"""
import http.server, threading, pathlib, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = pw_helper.out_dir() / 'lyswitch'; OUT.mkdir(parents=True, exist_ok=True)
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
    IMGD = OUT / 'img'; IMGD.mkdir(parents=True, exist_ok=True)
    def gif(name, c1, c2, n=30):
        fr = []
        for i in range(n):
            im = Image.new('RGB', (360, 360), c1); d = ImageDraw.Draw(im); d.ellipse([60 + i, 60, 300, 300], fill=c2); d.rectangle([0, 0, 360, 50], fill=(240, 220, 30)); fr.append(im)
        fr[0].save(IMGD / name, save_all=True, append_images=fr[1:], duration=60, loop=0)
    gif('a.gif', (20, 30, 160), (230, 60, 140)); gif('b.gif', (10, 120, 60), (250, 160, 40)); gif('d.gif', (90, 10, 120), (40, 220, 90), 20)
    im = Image.new('RGB', (400, 400), (150, 20, 20)); ImageDraw.Draw(im).ellipse([80, 80, 320, 320], fill=(40, 200, 220)); im.save(IMGD / 'c.png')
    rel = lambda n: '/' + str((IMGD / n).relative_to(ROOT)).replace('\\\\', '/')
    br = pw.chromium.launch(executable_path=str(exe) if exe else None, args=['--no-sandbox'])
    SETUP = """async ([style, pics]) => { const T = __lf.lyTest; await __lf.Native.play(__lf.Native.state.queue.length ? __lf.Native.state.queue : [], 0).catch(() => {});
      const q = __lf.Native.state.queue; pics.forEach((u, i) => T.songPic(q[i].id, u)); T.style(style); __lf.openNP(); await new Promise(r => setTimeout(r, 300)); document.querySelector('[data-act="lyrics"]').click(); }"""
    KEY = """(style) => { const el = document.getElementById('lyr'); if (!el) return '';
      if (style === 'pic') { const im = el.querySelector('.lyr-bgl img'); return im ? im.getAttribute('src') + (im.complete && im.naturalWidth ? '|shown' : '|loading') : 'none'; }
      if (style === 'home') return 'home|' + getComputedStyle(el).backgroundImage.slice(0, 60) + '|' + !!el.querySelector('.lyr-bgl'); if (style === 'palette') return el.style.getPropertyValue('--lyr-pal') + '|' + el.style.getPropertyValue('--lyr-bg');
      const b = el.querySelector('.lyr-blur'); const im = b && b.querySelector('img'); return b ? (b.dataset.src + '|' + (im && (im.src.startsWith('data:') || !b.classList.contains('lb-anim') && !/[.]gif/i.test(im.src)) ? 'still' : im && getComputedStyle(im).opacity === '0' ? 'hidden' : 'anim')) + '|' + el.style.getPropertyValue('--lyr-bg') : ''; }"""
    WATCH = """async ([style, act, n]) => { const key = %s; const before = key(style); const tid = __lf.Native.current().id; %s; const out = [];
      for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); out.push({ k: key(style), id: __lf.Native.current().id }); } return { before, out, tid }; }"""
    for style in ['palette', 'blur', 'pic', 'home']:
        ctx = br.new_context(viewport=PORT); p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
        p.goto(URL); p.wait_for_selector('.tabbar'); p.wait_for_timeout(700)
        b = p.locator('button:visible', has_text='OK')
        if b.count(): b.first.click(); p.wait_for_timeout(200)
        p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(400)
        p.evaluate(SETUP, [style, [rel('a.gif'), rel('b.gif'), rel('c.png'), rel('a.gif')]]); p.wait_for_timeout(8000)   # read ahead happens while the song plays (a long GIF takes a few seconds to read)
        settled = {}
        for step, act in [('next', '__lf.Native.next()'), ('next', '__lf.Native.next()'), ('previous', '__lf.Native.state.pos = 0, __lf.Native.prev()')]:
            rd = p.evaluate("(()=>{const q=__lf.Native.state.queue,i=__lf.Native.state.index;return [q[i+1],q[i-1]].map(t=>t?__lf.lyTest.ready(t.id):null)})()")
            r = p.evaluate(WATCH % (KEY, act), [style, act, 40])
            print('   read ahead before', step, '(next, previous):', rd)
            ks = [f['k'] for f in r['out']]
            if style == 'home':
                check(len(set(ks + [r['before']])) == 1, f'home {step}: the Home background stays exactly the same (nothing to wait for)'); p.wait_for_timeout(3500); continue
            first_new = next((i for i, k in enumerate(ks) if k and k != r['before']), None)
            if style == 'pic': check(first_new is not None and ks[first_new].endswith('|shown'), f'pic {step}: the new song picture is already loaded when it appears (read ahead), frame {first_new}')
            ok_final = ks[-1] and ks[-1] != r['before'] and (style != 'blur' or '|still|' in ks[-1])
            check(first_new is not None and first_new <= 2 and ok_final, f'{style} {step}: the new song\'s background shows in frame {first_new} (0-2 = same moment), ends {"frozen still" if style == "blur" else "new palette"}')
            check(not any(k == r['before'] for k in ks[first_new or 0:]) if first_new is not None else False, f'{style} {step}: the previous song\'s background never comes back')
            if style == 'blur': check(not any('|anim|' in k for k in ks), f'blur {step}: the GIF never plays (drawn as its still frame)')
            p.wait_for_timeout(3500)
        if style == 'home': check(not errs, f'home: no page errors {errs[:2]}'); ctx.close(); continue
        # a song that was NOT read ahead (jump 3 ahead): the old colours go at once
        p.evaluate("(()=>{const T=__lf.lyTest,q=__lf.Native.state.queue; T.songPic(q[6].id, '%s');})()" % rel('d.gif'))
        r = p.evaluate(WATCH % (KEY, "__lf.Native.play(__lf.Native.state.queue, 6)"), [style, 'jump', 60])
        ks = [f['k'] for f in r['out']]
        check(ks[2] != r['before'] and all(k != r['before'] for k in ks[2:]), f'{style} jump: the previous song\'s colours are gone at once (frame 2) and never come back')
        if style == 'palette':
            r2 = p.evaluate("""async () => { const t0 = performance.now(); for (let i = 0; i < 600; i++) { await new Promise(r => requestAnimationFrame(r)); const el = document.getElementById('lyr'); const bg = el.style.getPropertyValue('--lyr-bg').trim(); if (bg && bg !== '#000') return { main: Math.round(performance.now() - t0), pal: !!el.style.getPropertyValue('--lyr-pal') }; } return { main: -1 }; }""")
            check(r2['main'] >= 0, f"palette jump: the new song's main colour arrives (+{r2['main']} ms after frame 60), the full palette right after")
        check(not errs, f'{style}: no page errors {errs[:2]}'); ctx.close()
    # v293c: Canvas videos (Cover blur still picked ahead; Home / Song picture video loaded ahead), a jump from Up Next, lyrics opened after a jump
    import subprocess, shutil
    ff = shutil.which('ffmpeg')
    if ff:
        for nm, col in [('v1.mp4', 'blue'), ('v2.mp4', 'orange'), ('v3.mp4', 'green')]:
            subprocess.run([ff, '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', f'color=c={col}:s=320x320:d=2,drawbox=x=40+t*60:y=100:w=120:h=120:color=pink@1:t=fill', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', str(IMGD / nm)], check=True)
    else: print('(no ffmpeg here: Canvas cases skipped)')
    def fresh(style, canv=None, pics=None):
        ctx = br.new_context(viewport=PORT); p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
        p.goto(URL); p.wait_for_selector('.tabbar'); p.wait_for_timeout(700)
        b = p.locator('button:visible', has_text='OK')
        if b.count(): b.first.click(); p.wait_for_timeout(200)
        p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(300)
        if canv: p.evaluate("(us)=>{const q=__lf.Native.state.queue; us.forEach((u,i)=>__lf.lyTest.canvas(q[i],u));}", canv)
        p.evaluate(SETUP, [style, pics or []]); return ctx, p, errs
    VK = """() => { const el = document.getElementById('lyr'); const b = el && el.querySelector('.lyr-blur'), g = el && el.querySelector('.lyr-bgl');
      const im = b && b.querySelector('img'), v = (b && b.querySelector('video')) || (g && g.querySelector('video'));
      return { tid: __lf.Native.current().id, still: !!(im && im.src.startsWith('data:')), bsrc: b ? b.dataset.src : '', vready: v ? v.readyState : -1, gsrc: g ? g.dataset.src : '' }; }"""
    VW = "async ([act, n]) => { const k = " + VK + "; const out = []; " + "%s" + "; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); out.push(k()); } return out; }"
    if ff:
        vids = [rel('v1.mp4'), rel('v2.mp4'), rel('v3.mp4'), rel('v1.mp4')]
        ctx, p, e = fresh('blur', vids); p.wait_for_timeout(9000)
        fr = p.evaluate(VW % "__lf.Native.next()", ['', 20]); 
        check(fr[0]['still'] and fr[0]['bsrc'] and all(f['still'] for f in fr), f"Canvas + Cover blur, Next: the new song's video is drawn as its picked still in frame 0 ({fr[0]['bsrc'][-30:]})")
        check(not e, f'Canvas blur: no page errors {e[:2]}'); ctx.close()
        for st in ['home', 'pic']:
            ctx, p, e = fresh(st, vids); p.wait_for_timeout(6000)
            fr = p.evaluate(VW % "__lf.Native.next()", ['', 10])
            check(fr[0]['gsrc'] and fr[0]['vready'] >= 2, f"Canvas + {st}, Next: the new song's Canvas video is already playing-ready in frame 0 (readyState {fr[0]['vready']})")
            check(not e, f'Canvas {st}: no page errors {e[:2]}'); ctx.close()
    # a jump from Up Next (4 songs ahead), with Cover colour palette
    pics = [rel('a.gif'), rel('b.gif'), rel('c.png'), rel('a.gif'), rel('d.gif')]   # the demo album has 5 songs: song 4 is not next / next+1 / previous
    ctx, p, e = fresh('palette', None, pics); p.wait_for_timeout(1500); p.evaluate("__lf.queueSheet()"); p.wait_for_timeout(12000)
    p.evaluate("(() => { const b = document.querySelector('[data-act=sheet-close]'); if (b) b.click(); })()")
    r = p.evaluate(WATCH % (KEY, "__lf.Native.play(__lf.Native.state.queue, 4)"), ['palette', '', 6]); ks = [f['k'] for f in r['out']]
    check(ks[0] != r['before'] and ks[0].split('|')[0], f"a jump from Up Next (4 songs ahead): its palette is there in frame 0")
    check(not e, f'Up Next jump: no page errors {e[:2]}'); ctx.close()
    # lyrics opened after a jump to a song that was not prepared: the current song is read right after it starts, so it is ready when the lyrics open
    ctx, p, e = fresh('palette', None, pics); p.wait_for_timeout(800)
    p.evaluate("(() => { const b = document.querySelector('#lyr [data-act=lyr-close]'); if (b) b.click(); document.getElementById('lyr').classList.remove('open'); })()")
    p.evaluate("__lf.Native.play(__lf.Native.state.queue, 4)"); p.wait_for_timeout(7000)
    r = p.evaluate("""async () => { document.querySelector('[data-act="lyrics"]').click(); await new Promise(r => requestAnimationFrame(r)); const el = document.getElementById('lyr'); return el.style.getPropertyValue('--lyr-pal'); }""")
    check(bool(r), 'lyrics opened a few seconds after a jump: the palette is there at once')
    check(not e, f'jump: no page errors {e[:2]}'); ctx.close()
    br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
