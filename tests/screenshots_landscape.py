"""Landscape screenshots with the dummy demo library (Oshi no Ko themed names + sample pictures, see rec_common.py).
Run from the project root: python3 tests/screenshots_landscape.py [WIDTHxHEIGHT] [outdir]
Default: 844x390 (a phone held sideways), written to tests/out/land/. Needs: pip install playwright pillow + a Chromium."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from rec_common import *


# Fake listening history so the Stats screens have real content (the browser demo has no playback database).
SEED_JS = r"""async () => {
  const d = await import('/src/data.js'); const { Native } = await import('/src/native.js');
  let x = 7; const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647;
  const al = Object.fromEntries(d.albums.map(a => [a.id, a])); const segs = []; const DAY = 864e5, now = Date.now(); let n = 0;
  const day0 = new Date(); day0.setHours(0, 0, 0, 0);
  for (let k = 0; k < 400; k++) {
    const plays = k < 30 ? 2 + Math.floor(rnd() * 8) : (rnd() < .5 ? Math.floor(rnd() * 5) : 0);
    for (let j = 0; j < plays; j++) {
      const t = d.tracks[Math.floor(Math.pow(rnd(), 1.6) * d.tracks.length)], a = al[t.albumId] || {};
      const s = day0.getTime() - k * DAY + (8 + Math.floor(rnd() * 15)) * 36e5 + Math.floor(rnd() * 36e5);
      if (s > now - 6e4) continue;
      segs.push({ i: t.id, t: t.title, a: a.artist || 'Ai Hoshino', al: a.title || 'Album', s, d: (120 + Math.floor(rnd() * 150)) * 1000, f: 1, q: 1, sid: 'x' + (n++), pid: 'p' + n });
    }
  }
  Native.getListens = async ({ from = 0, to = 4e15 } = {}) => ({ segs: segs.filter(g => g.s + g.d >= from && g.s < to) });
  const { dayNum } = await import('/src/listenstats.js');
  Native.getListenDays = async () => ({ days: [...new Set(segs.map(g => dayNum(g.s)))] });
  Native.getListenSeen = async () => ({ seen: [] });
  return segs.length;
}"""

W, H = (int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '844x390').split('x'))
OUTD = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'tests' / 'out' / 'land'
OUTD.mkdir(parents=True, exist_ok=True)
fails = []
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=str(exe) if exe else None, args=['--no-sandbox'])
    ctx = br.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#tabs'); pg.wait_for_timeout(900)
    pg.evaluate(THEME_JS); pg.wait_for_timeout(200)
    demo_pics.seed(pg, URL)
    pg.evaluate(THEME_JS); pg.wait_for_timeout(200)
    pg.evaluate("__lf.go('home')"); pg.wait_for_timeout(700)
    q = pg.evaluate; print('seeded segments:', q(SEED_JS))
    def shot(n, w=900):
        pg.wait_for_timeout(w); q("document.activeElement && document.activeElement.blur && document.activeElement.blur()")
        pg.screenshot(path=str(OUTD / (n + '.png'))); print('wrote', n)
    def scene(n, f):
        try: R(pg); f()
        except Exception as e: print('FAIL', n, str(e)[:200]); fails.append(n)
    def scroll(sel, y):
        q("(([s,y])=>{const e=document.querySelector(s); if(e) e.scrollTop=y;})", [sel, y]); pg.wait_for_timeout(500)
    scene('01-home', lambda: shot('01-home', 1200))
    scene('02-albums', lambda: (q("__lf.go('albums')"), shot('02-albums', 1000)))
    scene('03-album-detail', lambda: (q("__lf.go('albums'); __lf.push('album','a1')"), shot('03-album-detail', 1200)))
    scene('04-library', lambda: (q("__lf.go('library')"), shot('04-library', 1000)))
    scene('05-search', lambda: (q("__lf.go('search')"), pg.wait_for_timeout(400), q("__lf.setQuery('star')"), shot('05-search', 900)))
    scene('06-artists', lambda: (q("__lf.push('artists')"), shot('06-artists', 1000)))
    scene('07-artist-detail', lambda: (q("__lf.push('artist','Ai Hoshino')"), shot('07-artist-detail', 1200)))
    scene('08-genres', lambda: (q("__lf.push('genres')"), shot('08-genres', 1000)))
    scene('09-genre-detail', lambda: (q("__lf.push('genre', __lf.Native ? 'Pop' : 'Pop')"), shot('09-genre-detail', 1000)))
    scene('10-playlists', lambda: (q("__lf.push('playlists')"), shot('10-playlists', 1000)))
    scene('11-playlist-detail', lambda: (q("__lf.push('playlist','p1')"), shot('11-playlist-detail', 1000)))
    scene('12-favorites', lambda: (q("__lf.push('favorites')"), shot('12-favorites', 800)))
    scene('14-settings', lambda: (q("__lf.push('settings')"), shot('14-settings', 1000)))
    scene('15-settings-scrolled', lambda: (q("__lf.push('settings')"), pg.wait_for_timeout(800), scroll('#sub .screen', 900), shot('15-settings-scrolled', 600)))
    scene('16-lstats', lambda: (q("__lf.push('lstats')"), shot('16-lstats', 1400)))
    for per in ['daily', 'weekly', 'monthly', 'yearly', 'overall']:
        def st(per=per):
            q("__lf.go('home')"); pg.wait_for_timeout(300); q("__lf.push('lstats')"); pg.wait_for_timeout(600)
            q("(p=>document.querySelector('[data-act=ls-period][data-v='+p+']').click())", per); pg.wait_for_timeout(1500)
            shot('30-stats-' + per, 400)
            sc = q("(()=>{const e=document.querySelector('#sub .screen');return e?e.scrollHeight-e.clientHeight:0})()")
            for i, y in enumerate(range(int(q("document.querySelector('#sub .screen').clientHeight*0.8")), int(sc) + 1, int(q("document.querySelector('#sub .screen').clientHeight*0.8")))[:6]):
                scroll('#sub .screen', y); shot('30-stats-%s-s%d' % (per, i + 1), 200)
        scene('30-stats-' + per, st)
    scene('31-stats-all-songs', lambda: (q("__lf.push('lstats')"), pg.wait_for_timeout(500), q("document.querySelector('[data-act=ls-all][data-k=songs]')&&document.querySelector('[data-act=ls-all][data-k=songs]').click()"), shot('31-stats-all-songs', 1200)))
    scene('32-stats-song-detail', lambda: (q("__lf.go('home')"), q("__lf.push('lstats')"), q("__lf.push('ldetail','song:t1')"), shot('32-stats-song-detail', 1800)))
    scene('32b-stats-artist-detail', lambda: (q("__lf.go('home')"), q("__lf.push('lstats')"), q("__lf.push('ldetail','artist:Ai Hoshino')"), shot('32b-stats-artist-detail', 1800)))
    scene('33-stats-clear-sheet', lambda: (q("__lf.go('home')"), q("__lf.push('lstats')"), pg.wait_for_timeout(900), q("document.querySelector('[data-act=ls-clear-menu]').click()"), shot('33-stats-clear-sheet', 900)))
    scene('34-stats-range-sheet', lambda: (q("__lf.go('home')"), q("__lf.push('lstats')"), pg.wait_for_timeout(900), q("document.querySelector('.lsnav b')&&document.querySelector('.lsnav b').click()"), shot('34-stats-range-sheet', 900)))
    scene('35-stats-snapshot', lambda: (q("__lf.go('home')"), q("__lf.push('lstats')"), pg.wait_for_timeout(1200), q("document.querySelector('[data-act=ls-snap]').click()"), shot('35-stats-snapshot', 2500)))
    for k in ['homeset', 'bgset', 'animation', 'lysize', 'lyranim', 'songs', 'folder']:
        scene('40-' + k, lambda k=k: (q("__lf.go('home')"), q("__lf.push('settings')"), pg.wait_for_timeout(300), q("__lf.push('%s'%s)" % (k, ",''" if k == 'folder' else '')), shot('40-' + k, 1200)))
    scene('40-homeset-scrolled', lambda: (q("__lf.go('home')"), q("__lf.push('settings')"), q("__lf.push('homeset')"), pg.wait_for_timeout(600), scroll('#sub .screen', 500), shot('40-homeset-scrolled', 500)))
    scene('40-animation-scrolled', lambda: (q("__lf.go('home')"), q("__lf.push('settings')"), q("__lf.push('animation')"), pg.wait_for_timeout(600), scroll('#sub .screen', 500), shot('40-animation-scrolled', 500)))
    for act in ['gest-pick', 'timestyle', 'lyricstyle', 'plimport', 'plexport', 'lsimport', 'lsexport', 'setexport', 'stats-clear', 'tg-name']:
        scene('41-sheet-' + act, lambda act=act: (q("__lf.go('home')"), q("__lf.push('settings')"), pg.wait_for_timeout(500), q("(a=>{const b=document.querySelector('#sub [data-act=\\''+a+'\\']'); if(b) b.click();})", act), shot('41-sheet-' + act, 1000)))
    def np():
        play_album(pg, 'a1'); q("__lf.openNP()"); shot('17-now-playing', 1500)
    scene('17-now-playing', np)
    def lyr():
        play_album(pg, 'a1'); q("__lf.openNP()"); pg.wait_for_timeout(800)
        q("document.querySelector('#np [data-act=lyrics]').click()"); shot('18-lyrics', 1500)
    scene('18-lyrics', lyr)
    def mini():
        play_album(pg, 'a1'); q("__lf.go('home')"); shot('19-home-mini', 1200)
    scene('19-home-mini', mini)
    def queue():
        play_album(pg, 'a1'); q("__lf.openNP()"); pg.wait_for_timeout(800)
        q("document.querySelector('#np [data-act=queue]').click()"); shot('20-queue-sheet', 1000)
    scene('20-queue-sheet', queue)
    def sleep():
        play_album(pg, 'a1'); q("__lf.openNP()"); pg.wait_for_timeout(800)
        q("document.querySelector('#np [data-act=sleep]').click()"); shot('21-sleep-sheet', 1000)
    scene('21-sleep-sheet', sleep)
    scene('22-bg-allow-card', lambda: (q("__lf.bgAllowDemo && __lf.bgAllowDemo()"), shot('22-bg-allow-card', 1200)))
    scene('23-notif-card', lambda: (q("__lf.notifSheet && __lf.notifSheet()"), shot('23-notif-card', 1200)))
    scene('24-update-card', lambda: (q("__lf.updSheet && __lf.updSheet()"), shot('24-update-card', 1200)))
    print('page errors:', errors[:5]); print('FAILS:', fails)
    br.close()
