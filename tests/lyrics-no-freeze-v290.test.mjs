// v290 (owner: "tapping lyrics freezes the app / lyrics don't even open, especially with Cover colour palette; DON'T change how it works"):
// the palette maths moved to src/palcore.js (same code) and runs in a Web Worker (src/palworker.js); the lyrics screen draws first; the next song's colours are read ahead.
// Also the style texts (owner): Cover blur = blurred picture you set (a GIF = one still frame) else the original cover; Cover colour palette = no "5 main colours".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const P = readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const W = readFileSync(new URL('../src/palworker.js', import.meta.url), 'utf8');
test('v290: the palette block lives in palcore.js, unchanged functions, exported; main.js imports it', () => {
  assert.ok(P.includes('/* v223+: COVER COLOUR MIX') && P.includes('/* v223+ end */'));
  assert.match(P, /\/\* v223\+ end \*\/\nexport \{ tintPaletteAuto, tintPaletteFlat, tintPaletteGrad, mixToLab \};/);
  assert.ok(!M.includes('/* v223+: COVER COLOUR MIX'), 'not duplicated in main.js');
  assert.match(M, /import \{ tintPaletteAuto, tintPaletteFlat, tintPaletteGrad \} from '\.\/palcore\.js';/);
  const blk = P.slice(P.indexOf('/* v223+: COVER COLOUR MIX'), P.indexOf('/* v223+ end */'));
  const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteGrad };')();
  const d = new Uint8ClampedArray(4096 * 4); for (let i = 0; i < 4096; i++) d.set([i % 255, (i * 7) % 255, 100, 255], i * 4);
  assert.ok(F.tintPaletteAuto(d).length > 0, 'runs on its own (no DOM), as in the worker');
});
test('v290: the worker runs the same two functions and answers { id, pal, grad }', () => {
  assert.match(W, /import \{ tintPaletteAuto, tintPaletteGrad \} from '\.\/palcore\.js';/);
  assert.match(W, /if \(hi\) d\.hi = hi; if \(fw\) d\.fw = fw; pal = tintPaletteAuto\(d\);/);
  assert.match(W, /self\.postMessage\(\{ id, pal, grad, err \}\)/);
});
test('v290: palAsync falls back to the old main-thread call (no worker, worker error, an error answer, 45 s silence)', () => {
  assert.match(M, /new Worker\(new URL\('\.\/palworker\.js', import\.meta\.url\), \{ type: 'module' \}\)/);
  assert.match(M, /const palMain = async d => \{ await new Promise\(r => setTimeout\(r, 60\)\); let pal = null, grad = ''; try \{ pal = tintPaletteAuto\(d\); \}/);
  assert.match(M, /palW\.onerror = \(\) => \{ palWBad = true;/);
  assert.match(M, /if \(!m \|\| \(m\.err && !m\.pal\)\) palMain\(d\)\.then\(res\)/);
  assert.match(M, /palMain\(d\)\.then\(res\); \}, 45000\)/);
  assert.match(M, /w\.postMessage\(\{ id, px: d, hi: d\.hi \|\| null, fw: d\.fw \|\| null \}\)/, 'hi / fw sent apart (a typed array loses extra fields when copied)');
  assert.match(M, /if \(g && pl && c\.pal === pl && !c\.palGrad\) c\.palGrad = g;/, 'the gradient comes back ready too');
});
test('v290 / v293: the lyrics screen opens and draws before the background is read (unless it is ready: then painted at once); neighbours are read ahead', () => {
  assert.match(M, /if \(lyReady\) lyPaint\(el, lyReady\); else requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => \{ if \(my === lyrSeq\) lyApplyTint\(t\); \}\)\);/);
  assert.match(M, /on\('onTrackChanged', \(\) => \{ lyPrefetch\(\); \}\);/);
});
test('v290: style texts (owner)', () => {
  assert.ok(M.includes("palette: 'Cover colour palette: a colour gradient from the picture or GIF you set for the song or album, else its original cover, white lyrics'"));
  assert.ok(M.includes("blur: 'Cover blur: a blurred version of the picture you set for the song or album (a GIF shows one still frame), else its original embedded cover, white lyrics'"));
  assert.ok(!M.includes('5 main colours'));
});
