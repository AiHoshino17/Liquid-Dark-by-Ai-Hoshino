// v277 (owner: "add an option to keep the home screen (pic / GIF / plain black) as the lyrics background, and a custom lyrics background (pic / GIF) for all songs; a Canvas shows its video instead")
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), C = fs.readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('v277: two new lyrics background styles in the picker', () => {
  assert.match(M, /home: 'Home screen background: [^']+', custom: 'Custom lyrics background: [^']+' \};/);
  assert.match(M, /const lyStyleKey = \(\) => set\.lyricStyle === 'cover' \? \(set\.lyricBlur === true \? 'blur' : set\.lyricBg \|\| 'palette'\) : 'classic';/);
  assert.match(M, /set\.lyricBg = \['home', 'custom'\]\.includes\(b\.dataset\.v\) \? b\.dataset\.v : '';/);
});
test('v277: a saved value is cleaned (only home / custom, only with the cover style, never together with blur / palette)', () => {
  assert.equal((M.match(/set\.lyricBg = set\.lyricStyle === 'cover' && !set\.lyricBlur && \['home', 'custom'\]\.includes\(set\.lyricBg\) \? set\.lyricBg : ''; if \(set\.lyricBg\) set\.lyricPal = false;/g) || []).length, 2, 'at start-up and on settings import');
  assert.match(M, /h\.dataset\.lybg = set\.lyricStyle === 'cover' && set\.lyricBlur !== true && set\.lyricBg \? set\.lyricBg : '';/);
});
test('v277: the custom picture is stored as the original file in its own database and restored at start', () => {
  assert.match(M, /indexedDB\.open\('lf-lyrbg', 1\)/); assert.match(M, /lbDbGet\(\)\.then\(b => \{ if \(b && !lbUrl\) \{ lbSet\(b\);/);
});
test('v277: a Canvas shows its video instead of the Home / Custom picture; the custom picture is used for EVERY song', () => {
  const f = M.slice(M.indexOf('function lyBgSrc(t)'), M.indexOf('function lyBgHtml(t)'));
  assert.match(f, /if \(S && S\.media && S\.src\) return \{ src: S\.src, vid: !!S\.vid, cv: true \};/);
  assert.match(f, /return set\.lyricBg === 'custom' && lbUrl \? \{ src: lbUrl, vid: false, cv: false \} : null;/);
});
test('v277: CSS: Home = the Home paint or black, Custom = black under the picture layer, readable white lyrics', () => {
  assert.match(C, /html\[data-bg="1"\]\[data-lybg="home"\] \.lyr\{background:var\(--bgpaint\)\}/);
  assert.match(C, /html\[data-lybg="home"\] \.lyr\{background:#000;/); assert.match(C, /html\[data-lybg="custom"\] \.lyr\{background:#000;/);
  assert.match(C, /\.lyr-bgl>img,\.lyr-bgl>video\{[^}]*object-fit:cover/);
});
// v278 (owner: "add a black text or white lyrics text option")
test('v278: lyrics text colour setting (auto / white / black), on every background style', () => {
  assert.match(M, /const LYINK = \{ auto: '[^']+', white: '[^']+', black: '[^']+' \};/);
  assert.match(M, /data-act="lyricink"/); assert.match(M, /case 'lyinkset': set\.lyricInk = \['white', 'black'\]\.includes\(b\.dataset\.v\) \? b\.dataset\.v : 'auto';/);
  assert.equal((M.match(/set\.lyricInk = \['white', 'black'\]\.includes\(set\.lyricInk\) \? set\.lyricInk : 'auto';/g) || []).length, 2, 'cleaned at start-up and on import');
  assert.match(M, /h\.dataset\.lyink = /);
  assert.match(C, /html\[data-lyink="white"\] \.lyr \.ln,[^{]*\{color:#fff!important\}/); assert.match(C, /html\[data-lyink="black"\] \.lyr \.ln,[^{]*\{color:#000!important\}/);
  assert.ok(C.indexOf('v278: Lyrics text colour') < C.indexOf('/* ===== v222 (third pass)'), 'above the landscape-only section');
});
