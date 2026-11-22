"""v288b: Chromium check that the RED tab icon is always the page you are on (owner: "the red icons, when we are on a specific icon?").
Portrait + landscape, music off + on (landscape: after the water split / merge too), Settings icon on and off, a custom icon order:
tap every icon -> exactly ONE icon red (aria-current), it is the tapped one, the page shown is that page, the glass pill sits on it.
Open an album inside Albums -> Albums stays red; back -> Albums. Gear button -> Settings red (when the icon is in the bar).
Run: python3 tests/tab-lit-check.py"""
import http.server, threading, pathlib, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = pw_helper.out_dir() / 'tablit'; OUT.mkdir(parents=True, exist_ok=True)
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
    STATE = """(() => { const tabs = [...document.querySelectorAll('#tabs > .tab')], red = c => { const m = c.match(/\\d+/g).map(Number); return m[0] > 180 && m[1] < 110 && m[2] < 120; };
      const lit = tabs.filter(t => t.classList.contains('on')).map(t => t.dataset.tab), cur = tabs.filter(t => t.getAttribute('aria-current') === 'page').map(t => t.dataset.tab);
      const reds = tabs.filter(t => red(getComputedStyle(t.querySelector('span')).color)).map(t => t.dataset.tab);
      const lens = document.querySelector('#tabs .lens'), on = tabs.find(t => t.classList.contains('on'));
      let pill = null; if (lens && on) { const a = lens.getBoundingClientRect(), b = on.getBoundingClientRect(); pill = Math.round(Math.abs((a.left + a.width / 2) - (b.left + b.width / 2))); }
      const sub = document.querySelector('#sub'), subTop = sub && sub.children.length ? (sub.querySelector('.setpage-h') ? 'settings-page' : (sub.querySelector('[data-act=back]') ? 'sub' : 'sub?')) : 'none';
      const h = document.querySelector('#main h1.large'); return { lit, cur, reds, pill, subTop, main: h ? h.textContent.trim() : (document.querySelector('#main .greet, #main [class*=greet]') ? 'Home' : '?'), order: tabs.map(t => t.dataset.tab) }; })()"""
    START = "(()=>{__lf.go('albums'); __lf.push('album','a5'); setTimeout(()=>document.querySelector('#sub [data-act=\"shuffleall\"]').click(),50)})()"
    STOP = "(async()=>{await __lf.Native.pause(); __lf.Native.state.index=-1; __lf.renderMini()})()"
    def back_home(p):
        for _ in range(6):
            if p.evaluate("!!document.querySelector('#sub [data-act=back]')"): p.click('#sub [data-act=back]'); p.wait_for_timeout(250)
            else: break
    def verify(p, tag, k):
        s = p.evaluate(STATE)
        ok = s['lit'] == [k] and s['cur'] == [k] and s['reds'] == [k] and (s['pill'] is None or s['pill'] <= 2)
        if k == 'settings': ok = ok and s['subTop'] == 'settings-page'
        else: ok = ok and s['subTop'] == 'none'
        check(ok, f'{tag}: on {k} -> red {s["reds"]}, lit {s["lit"]}, current {s["cur"]}, pill off {s["pill"]} px, screen {s["subTop"]} / {s["main"]}')
        return s
    CASES = [('settings icon on', {'tabs': {'home': True, 'albums': True, 'library': True, 'search': True, 'settings': True}}),
             ('settings icon off', {}),
             ('custom order', {'tabs': {'home': True, 'albums': True, 'library': True, 'search': True, 'settings': True}, 'tabOrder': ['search', 'settings', 'home', 'library', 'albums']})]
    for vp, vn in [(PORT, 'portrait'), (LAND, 'landscape')]:
        for cn, st in CASES:
            for music in (False, True):
                ctx, p, e = page_with(vp, st)
                if music: p.evaluate(START); p.wait_for_selector('#mini .mini'); p.wait_for_timeout(300); back_home(p); p.wait_for_timeout(700)
                order = p.evaluate(STATE)['order']
                if cn == 'custom order': check(order == ['search', 'settings', 'home', 'library', 'albums'], f'{vn}: custom order shown {order}')
                tag = f'{vn}, {cn}, music {"on" if music else "off"}'
                for k in order + list(reversed(order)):
                    p.click(f'#tabs > .tab[data-tab="{k}"]'); p.wait_for_timeout(650); verify(p, tag, k)
                # inside a page: an album under Albums keeps Albums red; back = still Albums
                p.click('#tabs > .tab[data-tab="albums"]'); p.wait_for_timeout(500); p.evaluate("__lf.push('album','a5')"); p.wait_for_timeout(500)
                s = p.evaluate(STATE); check(s['reds'] == ['albums'] and s['subTop'] == 'sub', f'{tag}: album page inside Albums keeps Albums red {s["reds"]}')
                back_home(p); p.wait_for_timeout(500); verify(p, tag + ' (back)', 'albums')
                # gear button (Home): Settings red when the icon is in the bar, else nothing wrong lit
                p.click('#tabs > .tab[data-tab="home"]'); p.wait_for_timeout(500)
                g = p.locator('#main [data-act="settings"]:visible')
                if g.count():
                    g.first.click(); p.wait_for_timeout(650); s = p.evaluate(STATE)
                    if 'settings' in order: check(s['reds'] == ['settings'] and s['subTop'] == 'settings-page', f'{tag}: gear -> Settings page, Settings red {s["reds"]}')
                    else: check(s['subTop'] == 'sub' and len(s['reds']) <= 1, f'{tag}: gear (no Settings icon) -> Settings screen with back arrow, at most one icon red {s["reds"]}')
                    back_home(p); p.wait_for_timeout(300)
                if music and vn == 'landscape':   # stop and restart music while on Library: the water merge / split must not move the red icon
                    p.click('#tabs > .tab[data-tab="library"]'); p.wait_for_timeout(500)
                    p.evaluate(STOP); p.wait_for_timeout(250); s = p.evaluate(STATE); check(s['reds'] == ['library'], f'{tag}: mid water-merge Library stays red {s["reds"]}')
                    p.wait_for_timeout(700); verify(p, tag + ' (after merge)', 'library')
                    p.evaluate("(()=>{__lf.Native.state.index=0; __lf.renderMini()})()"); p.wait_for_timeout(250); s = p.evaluate(STATE); check(s['reds'] == ['library'], f'{tag}: mid water-split Library stays red {s["reds"]}')
                    p.wait_for_timeout(700); verify(p, tag + ' (after split)', 'library')
                if vn == 'landscape' and cn == 'settings icon on' and music: p.click('#tabs > .tab[data-tab="settings"]'); p.wait_for_timeout(700); p.screenshot(path=str(OUT / 'land_settings_music.png'))
                check(not e, f'{tag}: no page errors {e[:2]}')
                ctx.close()
    br.close()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
