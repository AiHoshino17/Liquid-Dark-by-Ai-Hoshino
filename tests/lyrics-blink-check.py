"""v280: Chromium check that synced lyrics (line-by-line AND word-by-word "Apple style" fill) never BLINK on the real UI (browser demo).
The player is driven like a phone does it: a position report every ~0.3-1.2 s that is often a little BEHIND the true time (+-0.35 s jitter), and,
for a short moment every few seconds, a "not playing" state flicker (buffering / audio focus / notification refresh on Android).
Every frame for 12 s records the playing line, how many words are filled, and the opacity / colour of the playing line. A blink = the playing line
or the filled words step BACK while the song moves forward, or the playing line's opacity dips. Runs on white, black and auto lyrics colours.
Run: python3 tests/lyrics-blink-check.py"""
import http.server, threading, pathlib, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); import pw_helper
ROOT = pathlib.Path(__file__).resolve().parent.parent
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
# 8 lines, 1.5 s each, every word stamped (enhanced LRC = the word-by-word fill)
def lrc():
    out = []
    for i in range(10):
        t = 1 + i * 1.5; ws = ['Red', 'tail', 'lamps', 'along', 'the', 'avenue']
        st = lambda s: f'{int(s // 60):02d}:{s % 60:05.2f}'
        out.append(f'[{st(t)}]' + ''.join(f'<{st(t + k * .22)}>{w} ' for k, w in enumerate(ws)))
    return '\n'.join(out)
DRIVE = """async ({jitter, flicker, secs}) => {
  const N = __lf.Native, s = N.state; await N.pause(); const t0 = performance.now(), start = 1.0;
  s.pos = start; s.playing = true; let nextRep = 0, flickUntil = 0, nextFlick = 2500; const rec = [];
  while (performance.now() - t0 < secs * 1000) {
    await new Promise(r => requestAnimationFrame(r)); const el = performance.now() - t0, truth = start + el / 1000;
    if (el >= nextRep) { s.pos = Math.max(0, truth - (jitter ? Math.random() * .35 : 0)); nextRep = el + (jitter ? 300 + Math.random() * 900 : 100); }
    if (flicker && el >= nextFlick) { s.playing = false; flickUntil = el + 60; nextFlick = el + 2000 + Math.random() * 2500; }
    if (flicker && flickUntil && el >= flickUntil) { s.playing = true; s.pos = Math.max(0, truth - .2); flickUntil = 0; }
    const cur = document.querySelector('#lyrbody .ln.cur'), li = cur ? +cur.dataset.li : -1, wd = cur ? cur.querySelectorAll('.w.wd').length : 0;
    const wps = cur ? [...cur.querySelectorAll('.w')].map(n => +(n.style.getPropertyValue('--wp') || 0)) : [];
    rec.push([el, truth, li, wd, cur ? +getComputedStyle(cur).opacity : 0, wps.reduce((a, b) => a + b, 0)]);
  }
  return rec; }"""
exe = pw_helper.chromium_exe()
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=str(exe) if exe else None, args=['--no-sandbox'])
    p = br.new_context(viewport={'width': 390, 'height': 844}).new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
    p.goto(URL); p.wait_for_selector('.tabbar'); p.wait_for_timeout(500)
    for _ in range(3):
        b = p.locator('button:visible', has_text='OK')
        if b.count(): b.first.click(); p.wait_for_timeout(300)
    p.evaluate("__lf.go('albums'); __lf.push('album','a5')"); p.wait_for_selector('#sub [data-act="shuffleall"]'); p.click('#sub [data-act="shuffleall"]'); p.wait_for_timeout(300)
    p.evaluate(f"(()=>{{const t=__lf.Native.current();t.lyric={json.dumps(lrc())};}})()")
    p.evaluate("__lf.openNP()"); p.wait_for_selector('#np [data-act="lyrics"]'); p.click('#np [data-act="lyrics"]'); p.wait_for_selector('#lyrbody .ln .w')
    for style, ink, jitter, flicker in [('palette', 'auto', False, False), ('palette', 'white', True, False), ('palette', 'white', True, True), ('home', 'black', True, True), ('classic', 'auto', True, True)]:
        p.evaluate(f"__lf.lyTest.style('{style}'); __lf.lyTest.ink('{ink}')"); p.wait_for_timeout(500)
        rec = p.evaluate(DRIVE, {'jitter': jitter, 'flicker': flicker, 'secs': 12})
        back_line = sum(1 for a, b in zip(rec, rec[1:]) if b[2] < a[2] and b[2] >= 0)
        back_word = sum(1 for a, b in zip(rec, rec[1:]) if b[2] == a[2] and b[3] < a[3])
        steady = [r for r in rec[60:] if r[2] >= 0]; opac = [r[4] for r in steady]
        dips = sum(1 for a, b in zip(steady, steady[1:]) if a[2] == b[2] and b[4] < a[4] - .05)
        fade_back = sum(1 for a, b in zip(rec, rec[1:]) if b[2] == a[2] and b[5] < a[5] - 1e-6)
        tag = f'{style} / {ink} text / jitter={jitter} / not-playing flicker={flicker}'
        check(back_line == 0, f'{tag}: the playing line never steps back ({back_line})')
        check(back_word == 0, f'{tag}: filled words never un-fill ({back_word})')
        check(dips == 0, f'{tag}: the playing line never dims ({dips} dips)')
        check(fade_back == 0 and max(r[5] for r in rec) > 1, f'{tag}: word fade-in only moves forward = no blink ({fade_back} steps back)')
        lines = sorted(set(r[2] for r in rec)); check(len(lines) >= 6, f'{tag}: lyrics keep moving ({lines})')
    # a real seek is NOT held back: small and big backward seeks move the lyrics at once; a real pause freezes them
    curli = lambda: p.evaluate("(()=>{const c=document.querySelector('#lyrbody .ln.cur');return c?+c.dataset.li:-1})()")
    p.evaluate("(async()=>{const N=__lf.Native;N.state.playing=true;N.state.pos=8.6})()"); p.wait_for_timeout(400); a = curli()
    p.evaluate("__lf.Native.seek(8.0)"); p.wait_for_timeout(300); b = curli()
    check(a == 5 and b == 4, f'a small seek back (0.6 s, into the previous line) moves the lyrics back at once ({a} -> {b})')
    p.evaluate("__lf.Native.seek(1.2)"); p.wait_for_timeout(300); c = curli(); check(c == 0, f'a big seek back jumps to the right line ({c})')
    p.evaluate("(async()=>{await __lf.Native.pause();__lf.Native.state.pos=4.3})()"); p.wait_for_timeout(500); d1 = curli(); p.wait_for_timeout(1500); d2 = curli()
    check(d1 == d2, f'a real pause freezes the lyrics ({d1} / {d2})')
    OUT = pw_helper.out_dir() / 'blink'; OUT.mkdir(parents=True, exist_ok=True)
    for style, ink in [('classic', 'auto'), ('palette', 'white'), ('palette', 'black'), ('home', 'white'), ('home', 'black')]:
        p.evaluate(f"__lf.lyTest.style('{style}'); __lf.lyTest.ink('{ink}')"); p.evaluate("__lf.Native.seek(5.95)"); p.wait_for_timeout(900)
        p.evaluate("(async()=>{await __lf.Native.pause();__lf.Native.state.pos=6.05})()"); p.wait_for_timeout(500)
        x = p.evaluate("(()=>{const c=document.querySelector('#lyrbody .ln.cur');const w=[...c.querySelectorAll('.w')];return {li:+c.dataset.li,wp:w.map(n=>+(n.style.getPropertyValue('--wp')||0)),col:getComputedStyle(c).color}})()")
        check(x['li'] == 3 and x['wp'][0] == 1 and x['wp'][1] == 1 and 0 < x['wp'][2] < 1 and all(v == 0 for v in x['wp'][3:]), f'word fade-in mid-line with {style} / {ink} text: sung words lit, the word being sung part-lit, the rest dim ({x})')
        for _ in range(3):
            bb = p.locator('button:visible', has_text='OK')
            if bb.count(): bb.first.click(); p.wait_for_timeout(300)
            else: break
        p.locator('#lyr').screenshot(path=str(OUT / f'fill_{style}_{ink}.png'))
    mk = lambda: p.evaluate("(()=>{const w=document.querySelector('#lyrbody .ln.cur .w');return w?getComputedStyle(w).webkitMaskImage||getComputedStyle(w).maskImage:null})()")
    p.evaluate("__lf.lyTest.style('palette'); __lf.lyTest.ink('white')"); p.evaluate("__lf.Native.seek(5.95)"); p.wait_for_timeout(600)
    check('gradient' in (mk() or ''), f'word fade-in ON: the playing words are masked ({str(mk())[:60]})')
    p.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('lf.settings')||'{}');})()")
    p.evaluate("document.documentElement.dataset.lywf='0'"); p.wait_for_timeout(200)
    off = p.evaluate("(()=>{const w=[...document.querySelectorAll('#lyrbody .ln.cur .w')];return w.map(n=>[+getComputedStyle(n).opacity,(getComputedStyle(n).webkitMaskImage||'none')])})()")
    check(all(o == 1 and m == 'none' for o, m in off), f'word fade-in OFF: plain lyrics, every word fully lit, no mask ({off[:2]})')
    p.evaluate("document.documentElement.dataset.lywf='1'")
    check(not errs, f'no page errors ({errs[:3]})'); br.close()
print('FAILED:', len(fails)) if fails else print('ALL PASS'); sys.exit(1 if fails else 0)
