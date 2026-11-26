// v317 (owner): embedded covers and every uploaded picture / GIF FIT (whole picture, dark fill around a wide / tall one), never cropped.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const rd = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const M = rd('src/main.js'), D = rd('src/data.js'), C = rd('src/styles/app.css');
test('no cover / picture background is sized "cover" any more', () => {
  assert.ok(!/'\) center\/cover/.test(M) && !/'\) center\/cover/.test(D));
  assert.equal((M.match(/'\) center\/contain no-repeat/g) || []).length, 5); assert.match(D, /center\/contain no-repeat, #111/);
  assert.match(C, /var\(--gpic\) center\/contain no-repeat,#111/);
});
test('img / video pictures fit: profile, playlist, scan chips, Canvas', () => {
  for (const r of [/\.profile \.avatar img,\.profile \.avatar video\{position:absolute;inset:0;[^}]*object-fit:contain/, /\.pl-mosaic\.pp-cover img\{[^}]*object-fit:contain/, /\.sc-chip\{[^}]*object-fit:contain/, /\.cvmedia\{[^}]*object-fit:contain/, /\.cover\.cvc\{background:#000\}/]) assert.match(C, r);
  assert.match(M, /\? Math\.max : Math\.min\)\(W \/ pw, H \/ ph\)/);   // v317h: fits everywhere except Immersive assert.match(M, /st\.clipPath = `inset\(/);
});
test('home screen widgets fit the cover too', () => {
  for (const f of ['native-android/res/layout/lf_grid.xml', 'native-android/res/layout/lf_nowplaying.xml']) { const x = rd(f); assert.ok(!x.includes('centerCrop') && x.includes('fitCenter'), f); }
});
test('data.js still parses (a // comment once swallowed the closing brace)', async () => { await import('../src/data.js'); });
test('v317b (owner: "artists still cropped, fix it everywhere"): no round picture (a circle cuts the corners); Immersive + lyrics picture background fit', () => {
  for (const r of [/\.mini \.cover\{width:48px;border-radius:10px\}/, /\.acard \.cover\{border-radius:16px\}/, /\.apic \.cover\{border-radius:24px;/, /\.profile \.avatar\{[^}]*border-radius:14px;/,
    /\.lyr-bgl>img,\.lyr-bgl>video\{[^}]*object-fit:contain/]) assert.match(C, r);
});
test('v317c (owner: "lyrics backgrounds never cropped"): Home picture behind the lyrics = whole picture; Cover blur detail layer fits', () => {
  assert.match(C, /--bgpaint-fit:linear-gradient\(var\(--bgdimc\),var\(--bgdimc\)\),var\(--bgimg\) center\/contain no-repeat,#000/);
  assert.match(C, /html\[data-bg="1"\]\[data-lybg="home"\] \.lyr\{background:var\(--bgpaint-fit\)\}/);
  assert.match(C, /html\[data-bg="1"\]\[data-lyrstyle="classic"\] \.lyr\{background:var\(--bgpaint-fit\)\}/);
  assert.match(C, /\.lyr-blur>\.lb-d\{left:0;top:0;width:100%;height:100%;object-fit:contain;/);
});
test('v317d: share cards fit the picture and draw no circles', () => {
  const S = rd('src/snapshot.js');
  assert.match(S, /const s = Math\.min\(size \/ iw, size \/ ih\)/); assert.ok(!/Math\.max\(size \/ iw, size \/ ih\)/.test(S));
  assert.match(S, /const NO_CIRCLES = true;/); assert.equal((S.match(/mode === 'round' && !NO_CIRCLES/g) || []).length, 2);
});
test('v317e: the browser demo shows Canvas in Now Playing (cvWeb), so the Canvas fit can be checked; the phone still uses Native.fileUrl', () => {
  assert.match(M, /const url = \(!Native\.isNative && cvWeb\.get\(p\)\) \|\| Native\.fileUrl\(p\);/);
});
test('v317f (owner: "Immersive is different"): Immersive no longer forces the Canvas to 100% x 100% (that stretched it); cvFit fits it whole', () => {
  assert.match(C, /html\[data-immersive="1"\] \.np \.art \.cvmedia\{background:#000\}/);
  assert.ok(!/html\[data-immersive="1"\] \.np \.art \.cvmedia\{[^}]*width:100%!important/.test(C));
});
test('v317h (owner): Immersive is the one place that zooms in (pictures, GIFs, covers, Canvas fill the area); everywhere else fits whole', () => {
  assert.match(C, /html\[data-immersive="1"\] \.np \.art \.cover\{[^}]*background-size:cover/);
  assert.ok(!C.includes('.cover:not(.cvc)::before'));
  assert.match(M, /k = \(document\.documentElement\.dataset\.immersive === '1' && v\.closest\('#np'\) \? Math\.max : Math\.min\)\(W \/ pw, H \/ ph\)/);
});
