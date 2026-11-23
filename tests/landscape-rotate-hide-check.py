"""v291: Chromium check (owner: "when we flip to landscape it happens instantly, we can't see the animation" + "the landscape mini player should disappear after 8 s
without a touch"). 1. Portrait -> landscape with a song playing: the wide bar shows first, then the player splits out (joined frames), ends at the rest gap.
2. 8 s without a touch on the player: it merges back into the bar (music still playing, bar wide); a touch on it restarts the count; swipe up on the bar /
a new song / play-pause bring it back with the split; Never keeps it; portrait shows it at once.  Run: python3 tests/landscape-rotate-hide-check.py"""
import http.server, threading, pathlib, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = pw_helper.out_dir() / 'lrot'; OUT.mkdir(parents=True, exist_ok=True)
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
        ctx = br.new_context(viewport=vp, device_scale_factor=1, has_touch=False); ctx.add_init_script(f"try{{localStorage.setItem('lf.settings', JSON.stringify({json.dumps(settings)}))}}catch(e){{}}")
        p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e))); p.goto(URL); p.wait_for_selector('.tabbar'); p.wait_for_timeout(600)
        for _ in range(3):
            b = p.locator('button:visible', has_text='OK')
            if b.count(): b.first.click(); p.wait_for_timeout(300)
            else: break
        return ctx, p, errs
    ST = "(()=>{const b=document.querySelector('#tabs').getBoundingClientRect(),m=document.querySelector('#mini .mini:not(.away)'),r=m&&m.getBoundingClientRect();return {bw:b.width,bl:b.left,vw:innerWidth,mini:!!m,away:!!document.querySelector('#mini .mini.away'),leaving:!!document.querySelector('#mini .mini.leaving'),joined:!!(m&&m.style.clipPath),gap:r?b.left-r.right:null,lrot:document.getElementById('app').classList.contains('lrot'),playing:__lf.Native.state.playing,op:m?+getComputedStyle(m).opacity:0}})()"
    SAMPLE = "async n => { const o = []; for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); o.push(%s); } return o; }" % ST
    # 1. rotate into landscape with a song playing
    ctx, p, e = page_with(PORT, {}); p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(800)
    p.set_viewport_size(LAND); fr = p.evaluate(SAMPLE, 110)
    vis = [f for f in fr if f['op'] > .5]
    check(fr[0]['bw'] > LAND['width'] * .85 and (fr[0]['lrot'] or fr[0]['joined']), f"rotate: the first frame is the WIDE bar ({round(fr[0]['bw'])} px), the player not shown on its own")
    hold = [f for f in fr[:20] if f['bw'] > LAND['width'] * .45 and (f['joined'] or f['lrot'])]; check(len(hold) >= 12, f'rotate: the joined wide bar is held a moment so you see it ({len(hold)} frames)')
    check(sum(1 for f in fr if f['joined']) >= 15, 'rotate: the player splits out with the water neck (joined frames)')
    check(not fr[-1]['joined'] and not fr[-1]['lrot'] and fr[-1]['gap'] is not None and abs(fr[-1]['gap'] - 16) < 1.5, f"rotate: ends with the player on the left, gap 16 ({fr[-1]['gap']})")
    p.screenshot(path=str(OUT / 'after_rotate.png'))
    # 2. idle hide after 8 s
    p.wait_for_timeout(5000); p.mouse.click(200, 360)   # a tap ON the player (cover / title area -> opens Now Playing? use the empty middle)
    p.evaluate("document.querySelector('#np') && document.querySelector('#np').classList.remove('open')")
    p.wait_for_timeout(5000); s = p.evaluate(ST); check(s['mini'] and not s['away'], f'a touch on the player restarts the 8 s count (still there 10 s after rotating) {s}')
    p.wait_for_timeout(5200); s = p.evaluate(ST); check(s['away'] and not s['mini'] and s['playing'] and s['bw'] > LAND['width'] * .85, f'8 s without a touch: merged back into the bar, music still playing, bar wide {s}')
    # swipe up on the bar brings it back
    bb = p.evaluate("(()=>{const b=document.querySelector('#tabs').getBoundingClientRect();return [b.left+b.width*0.62,b.top+b.height/2]})()")
    p.mouse.move(bb[0], bb[1]); p.mouse.down(); p.mouse.move(bb[0], bb[1] - 20, steps=3); p.mouse.move(bb[0], bb[1] - 60, steps=5); p.mouse.up()
    fr = p.evaluate(SAMPLE, 70); check(any(f['joined'] for f in fr) and fr[-1]['mini'] and not fr[-1]['away'], 'swipe up on the bar: the player splits out again')
    lit = p.evaluate("[...document.querySelectorAll('#tabs > .tab.on')].map(t => t.dataset.tab)"); check(lit == ['home'], f'the swipe did not switch tabs (still {lit})')
    # a new song brings it back after hiding
    p.evaluate("__lf.miniHide()"); p.wait_for_timeout(1500); s = p.evaluate(ST); check(s['away'], 'hidden again')
    p.evaluate("__lf.Native.next()"); fr = p.evaluate(SAMPLE, 70); check(any(f['joined'] for f in fr) and fr[-1]['mini'], 'a new song: the player splits out again')
    p.evaluate("__lf.miniHide()"); p.wait_for_timeout(1500); p.evaluate("__lf.Native.pause()"); p.wait_for_timeout(1500); s = p.evaluate(ST); check(s['mini'] and not s['away'], 'pause: the player comes back')
    # portrait shows it at once
    p.evaluate("__lf.miniHide()"); p.wait_for_timeout(1500); p.set_viewport_size(PORT); p.wait_for_timeout(300); s = p.evaluate(ST); check(s['mini'] and not s['away'], f'portrait: the player is there at once {s}')
    p.wait_for_timeout(9000); s = p.evaluate(ST); check(s['mini'], 'portrait never hides it')
    p.evaluate("__lf.demoStop()"); p.wait_for_timeout(500); check(not p.evaluate("!!document.querySelector('#mini .mini')"), 'stop: the player goes')
    check(not e, f'no page errors {e[:2]}'); ctx.close()
    # 3. Never
    ctx, p, e = page_with(LAND, {'barSplit': {'style': 'cell', 'hide': 0}}); p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(10000); s = p.evaluate(ST)
    check(s['mini'] and not s['away'], 'Hide after: Never keeps the player'); ctx.close()
    # 4. Reduce Motion: rotate = no animation, hide still works (no merge animation)
    ctx, p, e = page_with(PORT, {'motion': True, 'barSplit': {'hide': 5}}); p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(500); p.set_viewport_size(LAND); fr = p.evaluate(SAMPLE, 10)
    check(not any(f['joined'] or f['lrot'] for f in fr), 'Reduce Motion: rotating shows the final layout, no animation')
    p.wait_for_timeout(5600); s = p.evaluate(ST); check(s['away'], 'Reduce Motion: it still hides after the time (no animation)')
    check(not e, f'no page errors {e[:2]}'); ctx.close()
    # 5. the setting
    ctx, p, e = page_with(PORT, {}); p.evaluate("__lf.push('animation')"); p.wait_for_selector('#bsplit [data-act="bshide"]')
    check(p.inner_text('#bsplit [data-act="bshide"].sel') == '8 s', 'Settings: Hide after = 8 s by default')
    p.click('#bsplit [data-act="bshide"][data-v="15"]'); p.wait_for_timeout(200)
    check(p.evaluate("JSON.parse(localStorage.getItem('lf.settings')).barSplit.hide") == 15, 'Settings: Hide after 15 s saves')
    # v292: custom time slider (3 s - 10 min) and Never
    def slide_to(sec):
        p.eval_on_selector('#bsplit input[data-bsh]', "(el, sec) => { el.value = __lf.hideSteps.indexOf(sec); el.dispatchEvent(new Event('input', {bubbles: true})); }", sec)
        p.wait_for_timeout(700)
    for sec, txt in [(95, '1 min 35 s'), (600, '10 min'), (3, '3 s'), (45, '45 s')]:
        slide_to(sec); got = p.evaluate("JSON.parse(localStorage.getItem('lf.settings')).barSplit.hide"); shown = p.inner_text('#bsplit [data-bsv="hide2"]')
        check(got == sec and shown == txt, f'Settings: custom time {txt} saves ({got}) and shows ({shown})')
    p.screenshot(path=str(OUT / 'settings.png'))
    p.click('#bsplit [data-act="bshide"][data-v="0"]'); p.wait_for_timeout(300)
    check(p.evaluate("JSON.parse(localStorage.getItem('lf.settings')).barSplit.hide") == 0 and not p.locator('#bsplit input[data-bsh]').count(), 'Settings: Never saves and hides the custom slider')
    ctx.close()
    # v292: a custom time is really used: 12 s -> still there at 10 s, gone by 13.5 s
    ctx, p, e = page_with(LAND, {'barSplit': {'style': 'cell', 'hide': 12}}); p.evaluate("__lf.demoPlay()"); p.wait_for_timeout(1500)
    p.wait_for_timeout(8700); s = p.evaluate(ST); check(s['mini'] and not s['away'], 'custom 12 s: still there after 10 s')
    p.wait_for_timeout(3800); s = p.evaluate(ST); check(s['away'], 'custom 12 s: merged back by 14 s')
    check(not e, f'no page errors {e[:2]}'); ctx.close()
    br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
