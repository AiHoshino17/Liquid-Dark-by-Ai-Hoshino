// v293 (owner: "switching song, the previous song's Cover colour palette / Cover blur background stays 0.4-0.8 s; make it almost none"):
// next / previous songs are read ahead (colours + GIF still), a ready song is painted in the same frame, the old colours never stay (black, then the
// song's main colour, then the full palette). The palette itself is unchanged (same functions, same result).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('v293 / v293c read ahead: the current song, the next two and the previous one (play order, Repeat All wraps), for every cover style', () => {
  assert.match(M, /function lyPrefetch\(\) \{[^\n]*\n  clearTimeout\(lyPreT2\); if \(set\.lyricStyle !== 'cover'\) return;\n  lyPreT2 = setTimeout\(\(\) => lyNear\(\)\.forEach\(\(n, k\) => setTimeout\(\(\) => lyPrepOne\(n\), k \* 300\)\), 250\);/);
  assert.match(M, /const out = \[q\[i\], at\(i \+ 1\), at\(i \+ 2\), q\[i - 1\]\];/);
  assert.match(M, /const at = k => q\[k\] \|\| \(st\.repeat === 'all' && q\.length \? q\[\(\(k % q\.length\) \+ q\.length\) % q\.length\] : null\);/);
  assert.match(M, /try \{ coverTint\(trackAlbum\(n\), n\)\.catch\(\(\) => \{\}\); \} catch \{\}\n  if \(set\.lyricBlur === true\) \{ const b = lyBlurSrc\(n\); if \(b\) \(b\.vid \? lyVidStillFromSrc : lyStillFromSrc\)\(b\.src\); \}/);
});
test('v293c a jump from Up Next is prepared: opening it prepares the first 6 songs listed after the near ones', () => {
  assert.match(M, /try \{ const st = Native\.state; lyPrefetchList\(\(st\.queue \|\| \[\]\)\.slice\(st\.index \+ 3\)\); \} catch \{\}/);
  assert.match(M, /list\.slice\(0, 6\)\.forEach\(\(n, k\) => setTimeout\(\(\) => lyPrepOne\(n\), k \* 400\)\)/);
});
test('v293c Canvas video: Cover blur still picked ahead (same 8 moments), Home / Song picture video loaded ahead and moved in', () => {
  assert.match(M, /for \(let i = 0; i < 8; i\+\+\) \{ const t = d \* \(i \+ \.5\) \/ 8;[^\n]*await new Promise\(r => requestAnimationFrame\(r\)\); const sc = window\.lyScore\(v\);   \/\* exactly as lyFreezeV[^\n]*if \(sc > bs\) \{ bs = sc; best = t; \} \}/);
  assert.match(M, /const st = lyStillMem\.get\(s\.src\);/, 'a video still is used like a GIF still');
  assert.match(M, /if \(b\.vid\) \{ lyVidPreload\(b\.src\); return; \}/);
  assert.match(M, /const pv = lyVidPre\.get\(L\.dataset\.src \|\| ''\); if \(!pv \|\| pv === nv \|\| pv\.readyState < 2\) return;/);
  assert.match(M, /el\.insertAdjacentHTML\('afterbegin', lyBgHtml\(t\)\); lyBgAdopt\(el\);/);
  assert.match(M, /lyBgAdopt\(el\);   \/\/ v293c: a Canvas loaded ahead is used as it is/);
  assert.match(M, /if \(lyVidPre\.size > 4\)/, 'at most a few videos kept');
});
test('v293 ready = same frame: lyricsLoad and lyApplyTint paint a known song at once', () => {
  assert.match(M, /function coverTintNow\(t\) \{ try \{ const S = tintSource\(trackAlbum\(t\), t\); return covTint\.get\(S\.key\) \|\| null; \}/);
  assert.match(M, /const now = coverTintNow\(t\); if \(now\) \{ lyPaint\(el, now\); return; \}/);
  assert.match(M, /const st = lyStillMem\.get\(s\.src\);/, "Cover blur: a GIF or Canvas still picked ahead is drawn at once");
  assert.match(M, /<img src="\$\{st\}" alt="" decoding="sync" data-fz="1">/);
});
test('v293 never the old song: black between songs (not the default red), then the main colour early, then the palette', () => {
  assert.match(M, /const lyBlank = el => \{ el\.style\.removeProperty\('--lyr-pal'\); for \(const n of \['--lyr-bg', '--lyr-bg2', '--lyr-bg3'\]\) el\.style\.setProperty\(n, '#000'\); for \(const n of \['--ap1', '--ap2', '--ap3', '--ap4'\]\) el\.style\.removeProperty\(n\); \};/);   // v294: + the Apple gradient colours
  assert.match(M, /if \(el\.dataset\.lyTid !== String\(t\.id\)\) lyBlank\(el\);/);
  assert.match(M, /function coverTint\(a, t, onEarly\)/);
  assert.match(M, /if \(p\) \{ pr\.early = p; for \(const f of pr\.ear \|\| \[\]\) \{ try \{ f\(p\); \} catch \{\} \} pr\.ear = null; \}/);
  assert.match(M, /try \{ const r = await palAsync\(d\); pl = r\.pal; g = r\.grad; \} catch \{\} \} done\(p \|\| fb, pl, g\);/, 'the palette is the same worker result as before');
});
test('v293 GIF still picked once per picture and remembered (shared by the read ahead and the blur layer)', () => {
  assert.match(M, /const lyStillMem = new Map\(\), lyStillRun = new Map\(\);/);
  assert.match(M, /if \(lyStillMem\.size > 40\) lyStillMem\.delete\(lyStillMem\.keys\(\)\.next\(\)\.value\);/, 'kept small');
  assert.match(M, /const m = await lyStillFromSrc\(par\.dataset\.src \|\| img\.currentSrc \|\| img\.src\);/);
});
test('v293b Song picture style: the neighbours\' pictures are loaded and decoded ahead (Home without a Canvas: nothing to prepare)', () => {
  assert.match(M, /if \(set\.lyricBg && set\.lyricBlur !== true\) \{ const b = lyBgSrc\(n\); if \(!b\) return;/);
  assert.match(M, /const im = new Image\(\); im\.decoding = 'async'; im\.src = b\.src; if \(im\.decode\) im\.decode\(\)\.catch\(\(\) => \{\}\);/);
  assert.match(M, /if \(lyPicMem\.size > 12\) lyPicMem\.delete/, 'kept small');
});
