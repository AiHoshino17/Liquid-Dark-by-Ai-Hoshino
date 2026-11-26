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
    p.goto(URL); p.wait_for_selector('.tabbar'); p.wait_for_timeout(600)
    for _ in range(3):
        b = p.locator('button:visible', has_text='OK')
        if b.count(): b.first.click(); p.wait_for_timeout(300)
        else: break
    WATCH = """(()=>{ window.__fl = new Set(); window.__flN = 0; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('sc-chip')) { __fl.add(n.getAttribute('src')); __flN++; } }))).observe(document.body, { childList: true, subtree: true }); })()"""
    p.evaluate(WATCH)
    WAIT = lambda js, ms=60000: [p.wait_for_timeout(200) for _ in range(ms // 200) if not p.evaluate(js)]
    PICS = """(()=>{ const T = __lf.lyTest, q = __lf.Native.state.queue.length ? __lf.Native.state.queue : null; const mk = i => { const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'); x.fillStyle = `hsl(${i * 37} 80% 50%)`; x.fillRect(0, 0, 48, 48); return c.toDataURL(); };
      const ids = __lf.trackIds(); ids.slice(0, 24).forEach((id, i) => T.songPic(id, mk(i))); return ids.length; })()"""
    # 1. Header cover chip: Original can be chosen
    p.evaluate("__lf.push('settings')"); p.wait_for_timeout(400)
    p.evaluate("document.querySelector('[data-act=lyheadart][data-v=original]').scrollIntoView({block:'center'})"); p.wait_for_timeout(200)
    p.click('[data-act=lyheadart][data-v=original]'); p.wait_for_timeout(300)
    on = p.evaluate("[document.querySelector('[data-act=lyheadart][data-v=original]').classList.contains('sel'), JSON.parse(localStorage.getItem('lf.settings')||'{}').lyHeadArt]")
    p.screenshot(path=str(OUT / '1-header-cover-original.png'))
    check(on[0] and on[1] == 'original', f'Original cover chip selects and saves: {on}')
    p.click('[data-act=lyheadart][data-v=custom]'); p.wait_for_timeout(300)
    check(p.evaluate("document.querySelector('[data-act=lyheadart][data-v=custom]').classList.contains('sel')"), 'Your picture chip selects back')
    # 2. Lyrics animation preview: word fade-in sweeps
    p.click('[data-act=lyranimopen]'); p.wait_for_timeout(2100)
    wp = p.evaluate("[...document.querySelectorAll('.lyprevbody .ln.cur .w')].map(w => +getComputedStyle(w).getPropertyValue('--wp') || 0)")
    p.wait_for_timeout(500); wp2 = p.evaluate("[...document.querySelectorAll('.lyprevbody .ln.cur .w')].map(w => +getComputedStyle(w).getPropertyValue('--wp') || 0)")
    p.screenshot(path=str(OUT / '2-preview-word-fade.png'), clip={'x': 0, 'y': 0, 'width': 390, 'height': 360})
    mask = p.evaluate("getComputedStyle(document.querySelector('.lyprevbody .ln.cur .w')).webkitMaskImage || getComputedStyle(document.querySelector('.lyprevbody .ln.cur .w')).maskImage")
    check(len(wp) >= 3 and 'gradient' in mask and sum(wp2) > sum(wp) and 0 < sum(wp2) < len(wp2) + 0.01, f'preview words sweep left to right: {wp} -> {wp2}')
    # 3. Refresh art: every different picture flies in
    p.evaluate(PICS); exp = p.evaluate("new Set(__lf.refreshItems().map(x=>x.u)).size")
    p.evaluate("window.__fl.clear(); __flN=0; document.querySelector('[data-act=back]').click()"); p.wait_for_timeout(300)
    p.evaluate("void __lf.artDemo()"); p.wait_for_timeout(1300);   # the demo has no saved pictures to reload, so the fly-in runs on the pictures set above
    p.screenshot(path=str(OUT / "3-refresh-art.png"))
    WAIT("document.querySelector('#scanv') ? !document.querySelector('#scanv').classList.contains('on') || document.querySelector('#scanv').classList.contains('done') : true"); p.wait_for_timeout(300)
    got = p.evaluate("__fl.size"); print('  after refresh, items now', p.evaluate("__lf.refreshItems().length"))
    check(exp > 0 and got >= exp, f'Refresh art: {got} of {exp} different pictures flew in')
    # 4. Rescan: every song cover flies in
    p.evaluate(PICS); exp2 = p.evaluate("__lf.libCovers().length"); p.wait_for_timeout(3500); p.evaluate("window.__fl.clear()")
    p.evaluate("void __lf.scanDemo()"); p.wait_for_timeout(1300);   # the demo cannot scan files
    p.screenshot(path=str(OUT / "4-rescan.png"))
    WAIT("!!document.querySelector('#scanv.done')")
    got2 = p.evaluate("__fl.size"); alls = p.evaluate("new Set(__lf.libCovers())")
    check(exp2 > 0 and got2 >= exp2, f'Rescan: {got2} of {exp2} song covers flew in')
    # 5. v309: the two "shown while rescanning" choices
    p.evaluate("document.querySelector('[data-act=artshow][data-v=custom]').scrollIntoView({block:'center'})"); p.wait_for_timeout(200)
    p.click('[data-act=artshow][data-v=custom]'); p.click('[data-act=scanshow][data-v=original]'); p.wait_for_timeout(300)
    st = p.evaluate("(()=>{ const s = JSON.parse(localStorage.getItem('lf.settings')||'{}'); return [s.artShow, s.scanShow, document.querySelector('[data-act=artshow][data-v=custom]').classList.contains('sel'), document.querySelector('[data-act=scanshow][data-v=original]').classList.contains('sel'), document.querySelector('[data-act=refresh-art] b').textContent] })()")
    p.wait_for_timeout(2200); p.evaluate("document.querySelector('[data-act=rescan]').scrollIntoView({block:'start'}); scrollBy(0, -60)"); p.wait_for_timeout(300)
    p.screenshot(path=str(OUT / '5-rescan-choices.png'))
    check(st == ['custom', 'original', True, True, 'Rescan art'], f'choices select + save, button renamed: {st}')
    n = p.evaluate("[__lf.refreshItems('custom').length, __lf.refreshItems('original').length, __lf.refreshItems('all').length, __lf.libCovers('custom').length, __lf.libCovers('original').length]")
    check(n[0] == 20 and n[1] == 0 and n[2] == 20 and n[3] == 20 and n[4] == 0, f'yours only / original only filter (demo has no file covers): {n}')
    # 6. v310 + v313: 1,000 different pictures (10,000 took 160 s at v311 and passed; at the 1.6 s flight it is ~4.5 min, too long for a routine check): every one flies in
    p.evaluate("window.__fl.clear()")
    t0 = p.evaluate("""(async () => { const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d'), us = []; for (let i = 0; i < 1000; i++) { x.fillStyle = `rgb(${i % 256},${(i >> 8) % 256},${(i * 7) % 256})`; x.fillRect(0, 0, 8, 8); us.push(c.toDataURL()); }
      window.__t10 = performance.now(); __lf.flyDemo(us).then(() => { window.__t10 = performance.now() - __t10; window.__done10 = 1; }); return new Set(us).size; })()""")
    p.wait_for_timeout(8000); p.screenshot(path=str(OUT / '6-ten-thousand.png'))
    WAIT("!!window.__done10", 300000)
    got10, ms10 = p.evaluate("[__fl.size, Math.round(__t10)]")
    check(got10 >= t0, f'1,000: {got10} of {t0} different pictures flew in, {ms10 / 1000:.1f} s')
    # 7. v310: library scan with 10,000 song / album covers: every one flies in before the card says done
    p.wait_for_timeout(2500); p.evaluate("window.__fl.clear()")
    p.evaluate("""(() => { const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d'), us = []; for (let i = 0; i < 1000; i++) { x.fillStyle = `rgb(${(i * 3) % 256},${(i >> 7) % 256},${(i * 11) % 256})`; x.fillRect(0, 0, 8, 8); us.push(c.toDataURL()); } window.__t11 = performance.now(); __lf.scanDemo(us); })()""")
    p.wait_for_timeout(1000); WAIT("!!document.querySelector('#scanv.done')", 300000)
    got11, ms11 = p.evaluate("[__fl.size, Math.round(performance.now() - __t11)]")
    check(got11 >= 1000, f'library scan 1,000: {got11} of 1000 covers flew in before "done", {ms11 / 1000:.1f} s')
    # 8. v315: 20 songs sharing ONE picture: 20 fly-ins in both cards
    p.wait_for_timeout(2500)
    p.evaluate("(() => { const c = document.createElement('canvas'); c.width = c.height = 8; c.getContext('2d').fillRect(0, 0, 8, 8); const u = c.toDataURL(); __lf.trackIds().forEach(id => __lf.lyTest.songPic(id, u)); })()")
    nA, nL = p.evaluate("[__lf.refreshItems('all').filter(x => x.n === 'Song pictures').length, __lf.libCovers('all').length]")
    p.evaluate("window.__flN = 0; void __lf.artDemo()"); WAIT("!!document.querySelector('#scanv.done')", 120000); a8 = p.evaluate("__flN")
    WAIT("!document.querySelector('#scanv.on')", 10000); p.evaluate("window.__flN = 0; void __lf.scanDemo(__lf.libCovers('all'))"); p.wait_for_timeout(800)   # step 5 left the choice on Original only (the demo has no file covers)
    WAIT("!!document.querySelector('#scanv.done')", 120000); l8 = p.evaluate("__flN")
    check(nA == 20 and a8 >= 20 and nL >= 20 and l8 >= nL, f'same picture on 20 songs: Rescan art flew {a8} (songs {nA}), library scan flew {l8} of {nL}')
    check(not errs, f'no page errors {errs[:2]}')
    br.close()
srv.shutdown()
print('ALL PASS' if not fails else f'{len(fails)} FAIL'); sys.exit(1 if fails else 0)
