// v238: the Cover colour palette (tintPaletteFromPixels / tintPaletteGrad) used to read ONLY a 32x32 pixel grab. A faint accent (a blush, an iris) that tintdetail.js's detail pass (v225/v231) already finds in the 96x96 read never reached the palette, because nothing fed detailFromFrames' output into it. tintPaletteFromDetail (and tintPaletteAuto, which coverTint() now calls instead of tintPaletteFromPixels directly) close that gap.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteFromPixels, tintPaletteFromDetail, tintPaletteAuto, tintPaletteGrad, mixToLab };')();
const hi = fn => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...fn(x, y), 255], (y * HI + x) * 4); return d; };

test('v238: coverTint now calls tintPaletteAuto, not tintPaletteFromPixels directly', () => {
  assert.match(M, /pal = tintPaletteAuto\(d\)/); assert.match(M, /const r = await palAsync\(d\); pl = r\.pal;/);   // v290: through palAsync (Web Worker), same function
});

test('v238: a faint, small blush (same picture as tintdetail.js\'s own v225 test: 0.17% of the picture, 16 pixels) is kept as its own swatch via the 96x96 detail grid, where the old 32x32-grab palette lost it', () => {
  const SKIN = [235, 192, 172], HAIR = [226, 170, 96], PINK = [244, 176, 186];
  const face = hi((x, y) => (x >= 40 && x < 44 && y >= 41 && y < 45) ? PINK : (x - 48) ** 2 + (y - 48) ** 2 < 34 * 34 ? SKIN : HAIR);
  const lo32 = (() => { const o = new Uint8ClampedArray(4096), st = HI / 32; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const s = [0, 0, 0]; for (let j = 0; j < st; j++) for (let i = 0; i < st; i++) { const q = ((y * st + j) * HI + x * st + i) * 4; s[0] += face[q]; s[1] += face[q + 1]; s[2] += face[q + 2]; } o.set([s[0] / (st * st), s[1] / (st * st), s[2] / (st * st), 255], (y * 32 + x) * 4); } return o; })();   // what tintGrab's 32x32 canvas actually sees: a block average, same as the old pipeline fed the palette
  const detail = detailFromFrames([face], [1]);
  const palOld = F.tintPaletteFromPixels(lo32);   // the ORIGINAL, still-live path: a 32x32 grab, no detail grid
  const palNew = F.tintPaletteFromDetail(detail);
  const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
  const hasPink = pal => pal.some(c => { const h = hueOf(c); return (h < 25 || h > 345) && Math.hypot(c.a, c.b) > .01; });
  assert.ok(!hasPink(palOld), 'sanity check: the 32x32 grab really does lose this blush (it is only ~4 pixels after the block-average)');
  assert.ok(hasPink(palNew), 'the 96x96 detail grid keeps the blush as its own distinct, pink (not skin-hued) swatch');
});

test('v238: tintPaletteAuto prefers a kept 96x96 frame over the 32x32 fallback when one is available', () => {
  const skin = hi(() => [225, 180, 150]);
  const d32 = new Uint8ClampedArray(32 * 32 * 4); for (let i = 0; i < d32.length; i += 4) d32.set([10, 10, 200, 255], i);   // a deliberately different (blue) 32x32 buffer
  d32.hi = { frames: [skin], w: [1] };
  const pal = F.tintPaletteAuto(d32, HI);
  const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
  assert.ok(!pal.some(c => hueOf(c) > 200 && hueOf(c) < 260), 'does not fall back to the blue 32x32 buffer when a 96x96 frame is present');
});

test('v238: tintPaletteAuto falls back to the 32x32 grab when there is no d.hi at all (unchanged old behaviour)', () => {
  const d32 = new Uint8ClampedArray(32 * 32 * 4); for (let i = 0; i < d32.length; i += 4) d32.set([220, 30, 40, 255], i);
  const noExt = p => p.map(({ gx, gy, sx, sy, sides, solid, ...c }) => c);   // v270: tintPaletteExtent only ADDS place / spread fields; the colours must stay the same
  assert.deepEqual(noExt(F.tintPaletteAuto(d32)), F.tintPaletteFromPixels(d32));
});

test('v238: tintPaletteFromDetail on an empty/absent detail grid returns []', () => {
  assert.deepEqual(F.tintPaletteFromDetail(null), []);
  assert.deepEqual(F.tintPaletteFromDetail(detailFromFrames([new Uint8ClampedArray(HI * HI * 4)], [1])), []);
});
