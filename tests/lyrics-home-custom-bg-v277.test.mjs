// v277 (owner: "add an option to keep the home screen (pic / GIF / plain black) as the lyrics background, and a custom lyrics background (pic / GIF) for all songs; a Canvas shows its video instead")
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), C = fs.readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('v277: two new lyrics background styles in the picker', () => {
  assert.match(M, /pic: 'Song picture: [^']+', home: 'Home screen background: [^']+' \};/);   // v286: Song picture added assert.doesNotMatch(M, /Custom lyrics background/, 'v285: removed (owner)');
  assert.match(M, /const lyStyleKey = \(\) => set\.lyricStyle === 'cover' \? \(set\.lyricBlur === true \? 'blur' : set\.lyricBg \|\| \(set\.lyricApple === true \? 'apple' : 'palette'\)\) : 'classic';/);   // v294: + Apple gradient
  assert.match(M, /set\.lyricBg = \['home', 'pic'\]\.includes\(b\.dataset\.v\) \? b\.dataset\.v : '';/);
});
test('v277: a saved value is cleaned (only home / custom, only with the cover style, never together with blur / palette)', () => {
  assert.equal((M.match(/set\.lyricBg = set\.lyricStyle === 'cover' && !set\.lyricBlur && \['home', 'pic'\]\.includes\(set\.lyricBg\) \? set\.lyricBg : ''; if \(set\.lyricBg\) set\.lyricPal = false;/g) || []).length, 2, 'at start-up and on settings import');
  assert.match(M, /h\.dataset\.lybg = set\.lyricStyle === 'cover' && set\.lyricBlur !== true && set\.lyricBg \? set\.lyricBg : '';/);
});
test('v285: the Custom lyrics background is gone, its old saved picture is deleted once', () => {
  assert.doesNotMatch(M, /lbPick|lbDbGet|data-act="lbpick"|lybg="custom"/); assert.match(M, /indexedDB\.deleteDatabase\('lf-lyrbg'\)/); assert.doesNotMatch(C, /data-lybg="custom"/);
});
test('v277: a Canvas shows its video instead of the Home / Custom picture; the custom picture is used for EVERY song', () => {
  const f = M.slice(M.indexOf('function lyBgSrc(t)'), M.indexOf('function lyBgHtml(t)'));
  assert.match(f, /if \(S && S\.media && S\.src\) return \{ src: S\.src, vid: !!S\.vid, cv: true \};/);

});
test('v277: CSS: Home = the Home paint or black, Custom = black under the picture layer, readable white lyrics', () => {
  assert.match(C, /html\[data-bg="1"\]\[data-lybg="home"\] \.lyr\{background:var\(--bgpaint\)\}/);
  assert.match(C, /html\[data-lybg="home"\] \.lyr\{background:#000;/);
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
// v286 (owner): Song picture lyrics background + Apple Music style word fade-in (on / off), palette label without the developer note
test('v286: Song picture style uses the song / album picture or GIF (else the cover), a Canvas first', () => {
  const f = M.slice(M.indexOf('function lyBgSrc(t)'), M.indexOf('function lyBgHtml(t)'));
  assert.match(f, /if \(set\.lyricBg === 'pic'\) \{ try \{ const S = t && t\.id \? tintSource\(trackAlbum\(t\), t\) : null; if \(S && S\.src\) return \{ src: S\.src/);
  assert.match(C, /html\[data-lybg="pic"\] \.lyr\{background:#000;/);
  assert.doesNotMatch(M, /small yellow \/ blue kept/);
});
test('v286: word fade-in: a setting (default on, exported), per-word --wp from the no-step-back clock, a mask on any colour; off = plain lyrics', () => {
  assert.match(M, /lyWordFade: true,/); assert.match(M, /d\.k === 'lyWordFade'/); assert.match(M, /data-k="lyWordFade"/);
  assert.match(M, /h\.dataset\.lywf = set\.lyWordFade === false \? '0' : '1';/);
  assert.match(M, /lyWords\[k\]\.style\.setProperty\('--wp', q\)/);
  assert.match(C, /html\[data-lywf="1"\] \.lyr \.ln\.cur \.w\{opacity:1!important;transition:none;--wfe:calc\(\.6em \* var\(--ly-fade,1\) \* var\(--ly-fade,1\)\);-webkit-mask-image:linear-gradient\(90deg,#000 calc\(var\(--wp,0\) \* \(100% \+ var\(--wfe\)\) - var\(--wfe\)\)/)   // v312: edge = .6em x Fade speed;
  assert.match(C, /html\[data-lywf="0"\] \.lyr \.ln\.cur \.w\{opacity:1!important\}/);
});
