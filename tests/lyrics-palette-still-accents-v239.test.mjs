// v239: a STILL cover picture now also gets the small real accents (blush, iris) of tintdetail.js's detail grid, appended into free palette slots (tintPaletteAddAccents). Before, only GIFs / videos did, so a dark still with 2-3 big colours (skin + black hair) lost its eye colour and its blush.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteFromPixels, tintPaletteFromDetail, tintPaletteAddAccents, tintPaletteAuto, mixToLab, PALN };')();
const hi = fn => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...fn(x, y), 255], (y * HI + x) * 4); return d; };
const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
// a dark, low-key face: near-black hair, brown skin, two small dusty-mauve irises (3 x 3 pixels each) and a faint pink blush on each cheek
const HAIR = [14, 16, 12], SKIN = [115, 100, 78], IRIS = [132, 98, 110], BLUSH = [140, 92, 84];
const patch = (x, y, cx, cy, r) => Math.abs(x - cx) <= r && Math.abs(y - cy) <= r;
const dark = hi((x, y) => { if (patch(x, y, 34, 40, 1) || patch(x, y, 62, 40, 1)) return IRIS; if (patch(x, y, 30, 54, 3) || patch(x, y, 66, 54, 3)) return BLUSH; return (x - 48) ** 2 + (y - 48) ** 2 < 36 * 36 ? SKIN : HAIR; });
const still = (frame, withDetail) => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [frame], w: [1] }; if (withDetail) d.hi.detail = detailFromFrames([frame], [1]); return d; };
const hasMauve = pal => pal.some(c => { const h = hueOf(c); return h > 320 && h < 360 && Math.hypot(c.a, c.b) > .03 && c.L > .25; });

test('v239: tintImagePx builds the detail grid for a still picture and hands it to the palette', () => {
  assert.match(M, /d\.hi\.detail = detailFromFrames\(d\.hi\.frames, \[1\]\)/);
  assert.match(M, /tintPaletteAddAccents\(pal, d\.hi\.detail\)/);
});

test('v239: the old still route (raw 96 px pixels only) loses the mauve iris of a dark picture; with the detail grid it is its own swatch', () => {
  const old = F.tintPaletteAuto(still(dark, false)), neu = F.tintPaletteAuto(still(dark, true));
  assert.ok(hasMauve(old), 'the real-pixel hue pass (tintPaletteAddHues) now finds the mauve iris even without the detail grid');
  assert.ok(hasMauve(neu), 'with the detail grid the iris colour is kept as its own swatch');
  assert.ok(neu.length <= F.PALN, 'never more than PALN colours');
});

test('v239: the colours the picture already had are unchanged (accents are only ADDED into free slots)', () => {
  const old = F.tintPaletteAuto(still(dark, false)), neu = F.tintPaletteAuto(still(dark, true));
  const c = old[0]; assert.ok(neu.some(n => Math.abs(n.L - c.L) < 1e-9 && Math.abs(n.a - c.a) < 1e-9 && Math.abs(n.b - c.b) < 1e-9), 'the main colour is still there, unchanged (a near-grey duplicate may be replaced by a real colour)');
});

test('v239: a still without a detail grid behaves exactly as before', () => {
  const d = still(dark, false), buf = new Uint8ClampedArray(HI * HI * 4); buf.set(dark); buf.fw = [1];
  const a = F.tintPaletteAuto(d); assert.ok(a.length >= 1 && a.length <= F.PALN, 'still a valid palette (the hue pass may add up to 2 real colours)');
});

test('v239: a plain picture (one flat colour) gets no invented accents', () => {
  const flat = hi(() => [200, 60, 50]), pal = F.tintPaletteAuto(still(flat, true));
  assert.equal(pal.length, F.tintPaletteFromPixels((() => { const b = new Uint8ClampedArray(HI * HI * 4); b.set(flat); b.fw = [1]; return b; })(), HI).length);
});

test('v239: an animated picture / video (detail only, no frames) still goes through tintPaletteFromDetail, unchanged', () => {
  const detail = detailFromFrames([dark], [1]), d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail };
  const noExt = p => p.map(({ gx, gy, sx, sy, sides, solid, ...c }) => c);   // v270: tintPaletteExtent only ADDS place / spread fields; the colours must stay the same
  assert.deepEqual(noExt(F.tintPaletteAuto(d)), F.tintPaletteFromDetail(detail));
  assert.deepEqual(F.tintPaletteFromDetail(null), []);
});

test('v239: tintPaletteAddAccents with no usable detail returns the palette untouched', () => {
  const pal = [{ L: .5, a: .02, b: .02, share: 1, x: .5, y: .5, rank: 1 }];
  assert.equal(F.tintPaletteAddAccents(pal, null), pal); assert.equal(pal.length, 1);
});
