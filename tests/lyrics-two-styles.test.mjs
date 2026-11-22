// Background style has exactly three choices: classic (black, red lyrics), palette (Cover colour palette) and blur (Cover blur: the picture itself, blurred). The old Album cover colour and Cover colour mix are gone.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), CSS = fs.readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('LYSTYLE has exactly classic, palette, blur, home and custom (v277: + Home screen / Custom lyrics background)', () => {
  const m = M.match(/const LYSTYLE = \{([^\n]*)\};/); assert.ok(m);
  assert.deepEqual([...m[1].matchAll(/(\w+): '/g)].map(x => x[1]), ['classic', 'palette', 'blur', 'home', 'custom']);
  assert.match(M, /const lyStyleKey = \(\) => set\.lyricStyle === 'cover' \? \(set\.lyricBlur === true \? 'blur' : set\.lyricBg \|\| 'palette'\) : 'classic';/);
});
test('Cover blur is wired: the picture itself is blurred behind the lyrics (still, GIF, Canvas video)', () => {
  assert.match(M, /h\.dataset\.lyblur = set\.lyricStyle === 'cover' && set\.lyricBlur === true/);
  assert.match(M, /set\.lyricBlur = b\.dataset\.v === 'blur'/);
  assert.match(M, /function lyBlurHtml\(t\)/); assert.match(M, /s\.vid \? vid\(''\)/); assert.match(M, /<img\$\{c\} src="\$\{e\}"/);
  assert.match(M, /el\.innerHTML = `\$\{lyBlurHtml\(t\)\}\$\{lyBgHtml\(t\)\}<div class="lyr-top">/, 'the layer is part of every lyrics render');
  assert.match(CSS, /html\[data-lyblur="1"\] \.lyr\{/); assert.match(CSS, /\.lyr-blur>img,\.lyr-blur>video\{[^}]*object-fit:fill;filter:blur\(/);
  assert.match(fs.readFileSync(new URL('../src/settingsio.js', import.meta.url), 'utf8'), /lyricBlur: 'Lyrics: Cover blur'/);
});
test('the removed styles and the Lyrics colour picker stay gone', () => {
  assert.doesNotMatch(M, /data-lymix|--lyr-mix|tintMesh|mixGrad|lycItem|tm-lycol|lycolSheet|lf\.lycol/); assert.doesNotMatch(CSS, /data-lymix|--lyr-mix/);
});
test('saved settings: blur stays blur, plain cover / the old mix become the palette, classic stays classic', () => {
  const line = "delete set.lyricMix; set.lyricBlur = set.lyricStyle === 'cover' && set.lyricBlur === true; set.lyricPal = set.lyricStyle === 'cover' && !set.lyricBlur;";
  assert.equal(M.split(line).length - 1, 2, 'load + import');
  const clean = s => { const set = { ...s }; delete set.lyricMix; set.lyricBlur = set.lyricStyle === 'cover' && set.lyricBlur === true; set.lyricPal = set.lyricStyle === 'cover' && !set.lyricBlur; return set; };
  assert.deepEqual([clean({ lyricStyle: 'cover', lyricBlur: true }).lyricBlur, clean({ lyricStyle: 'cover', lyricBlur: true }).lyricPal], [true, false]);
  assert.deepEqual([clean({ lyricStyle: 'cover', lyricMix: true }).lyricBlur, clean({ lyricStyle: 'cover', lyricMix: true }).lyricPal], [false, true]);
  assert.deepEqual([clean({ lyricStyle: 'classic', lyricBlur: true }).lyricBlur, clean({ lyricStyle: 'classic' }).lyricPal], [false, false]);
});
test('the palette still has what it needs', () => {
  assert.match(CSS, /html\[data-lypal="1"\] \.lyr\{[^}]*var\(--lyr-pal/); assert.match(CSS, /html\[data-lyrstyle="cover"\] \.lyr \.ln\{color:#fff\}/);
  const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */')); const F = new Function(blk + ';return { tintPaletteFromPixels, tintPaletteGrad };')();
  const d = new Uint8ClampedArray(4096); for (let i = 0; i < 1024; i++) d.set([208, 12, 58, 255], i * 4);
  assert.ok(F.tintPaletteGrad(F.tintPaletteFromPixels(d)).includes('radial-gradient'));
});

test('Cover blur is heavy (gradient look): blur 40px or more, oversized picture, bottom veil', () => {
  const m = CSS.match(/\.lyr-blur>img,\.lyr-blur>video\{([^}]*)\}/); assert.ok(m);
  assert.ok(+m[1].match(/filter:blur\((\d+)px\)/)[1] >= 40);
  assert.match(m[1], /width:124%/);
  assert.match(CSS, /\.lyr-blur::after\{[^}]*rgba\(0,0,0,\.22\) 100%/);
});

test('Cover blur keeps fine detail: a lighter-blurred copy (.lb-d) sits on top of the heavy blur, for pictures, GIFs and Canvas video', () => {
  const m = CSS.match(/\.lyr-blur>\.lb-d\{([^}]*)\}/); assert.ok(m, 'the detail layer rule exists');
  const px = +m[1].match(/filter:blur\((\d+)px\)/)[1]; assert.ok(px >= 4 && px <= 20, 'light blur, 4 to 20px (small details such as the Starboy label need a sharper copy)');
  assert.match(CSS, /html\[data-lyblur="1"\] \.lyr \.ln\{text-shadow:/, 'lyric lines keep a soft shadow over the lighter veil');
  const o = +m[1].match(/opacity:([\d.]+)/)[1]; assert.ok(o > 0.3 && o < 1, 'translucent, so the heavy blur still shows');
  assert.match(m[1], /left:0;top:0;width:100%;height:100%/, 'the detail layer is NOT oversized, so small things in the corners stay on screen');
  assert.ok(CSS.indexOf('.lyr-blur>.lb-d{') > CSS.indexOf('.lyr-blur>img,.lyr-blur>video{'), 'the detail rule comes after the base rule so it wins');
  assert.match(M, /vid\(' class="lb-d"'\)/); assert.match(M, /img\(' class="lb-d"'\)/);
});
