// v208 eyes (owner: purple eyes missing from the cover palette): an animated picture whose iris is a small plum / mauve spot that stays in the same place over many frames gets that colour into the palette (tintPaletteAddEyes, called from tintPaletteAuto's animated path only).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteAddEyes, mixToLab, PALN };')();
const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
const pic = fn => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...fn(x, y), 255], (y * HI + x) * 4); return d; };
const BEIGE = [230, 215, 160], BG = [60, 66, 90], HAIR = [70, 45, 35], PLUM = [140, 88, 110], SKIN = [240, 200, 170];
// a face: beige top, blue-grey bottom, dark hair on the left, a 4x4 plum iris at (30,30) on the rest
const face = (iris = true) => pic((x, y) => { if (iris && x >= 28 && x < 32 && y >= 28 && y < 32) return PLUM; if (x < 14) return HAIR; if (y >= 70) return BG; return y < 40 ? BEIGE : SKIN; });
const animated = (frames) => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([frames[0]], [1]), hueFrames: frames, hueW: frames.map(() => 1) }; return d; };
const hasPlum = p => p.some(c => { const h = hueOf(c); return (h >= 300 || h <= 25) && Math.hypot(c.a, c.b) > .03 && c.L > .35 && c.L < .8; });
test('v208 eyes: the purple iris reaches the palette (animated path)', () => {
  assert.match(M, /tintPaletteAddEyes\(tintPaletteAddHues\(pal, d\.hi\.hueFrames, hiW\), d\.hi\.hueFrames, hiW\)/);
  const p = F.tintPaletteAuto(animated(Array.from({ length: 12 }, () => face())));
  assert.ok(hasPlum(p), 'plum iris in palette'); assert.ok(p.length <= F.PALN, 'max PALN');
  const eye = p.find(c => (hueOf(c) >= 300 || hueOf(c) <= 25) && Math.hypot(c.a, c.b) > .03 && c.L > .35 && c.L < .8);
  assert.ok(eye.x > .2 && eye.x < .4 && eye.y > .2 && eye.y < .4, 'placed where the iris is');
});
test('v208 eyes: a mauve spot that moves from frame to frame (not stable) is not an eye', () => {
  const frames = Array.from({ length: 12 }, (_, i) => pic((x, y) => (x >= 10 + i * 5 && x < 13 + i * 5 && y >= 50 && y < 53) ? PLUM : (y < 40 ? BEIGE : BG)));
  const pal = [{ L: .8, a: 0, b: .03, share: .6, x: .5, y: .2, rank: 1 }];   // only a beige in the palette
  F.tintPaletteAddEyes(pal, frames, HI);
  assert.equal(pal.length, 1, 'a spot that moves is not added');
});
test('v208 eyes: a plain picture gets no invented colour, and the palette never exceeds PALN', () => {
  const flat = pic(() => [200, 60, 60]); assert.equal(F.tintPaletteAuto(animated(Array.from({ length: 6 }, () => flat))).length, 1);
  assert.ok(F.tintPaletteAuto(animated(Array.from({ length: 12 }, () => face()))).length <= F.PALN);
});
