// v210: a real colour AREA the palette misses (a shirt) is added; every colour sits on a spot that really has it.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteAddCoverage, tintPaletteRelocate, tintPaletteReadPx, mixToLab, mixToRgb, PALMAX };')();
const pic = (S, fn) => { const d = new Uint8ClampedArray(S * S * 4); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) d.set([...fn(x, y), 255], (y * S + x) * 4); return d; };
const SKIN = [150, 112, 90], WALL = [20, 45, 75], HAIR = [100, 75, 50], SHIRT = [120, 150, 105];
const scene = shirt => pic(HI, (x, y) => { if (shirt && y >= 82 && (x < 20 || x >= 76)) return SHIRT; if (y < 20) return HAIR; if (y > 30 && x > 28 && x < 68) return SKIN; return WALL; });
const still = fr => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [fr], w: [1], detail: detailFromFrames([fr], [1]) }; return d; };
test('v210 coverage: wired after the clean-up, before the hair step, relocate last', () => {
  assert.match(M, /tintPaletteAddHair\(tintPaletteAddCoverage\(tintPaletteConsolidate\(p, d, hiW\), fr, fw\), fr, fw\)/);
});
test('v210 coverage: a shirt area the palette lacks gets its own colour at the bottom; a palette that already covers the picture gets nothing', () => {
  const p = F.tintPaletteAuto(still(scene(false))); assert.equal(p.filter(q => q.cover).length, 0);   // the palette made WITHOUT the shirt, then the picture WITH the shirt
  F.tintPaletteAddCoverage(p, [scene(true)], HI); const c = p.find(q => q.cover);
  assert.ok(c, 'shirt colour added'); assert.ok(c.y > .8, 'placed at the bottom'); const r = F.mixToRgb(c.L, c.a, c.b, 1, 0); assert.ok(Math.abs(r[0] - SHIRT[0]) < 8 && Math.abs(r[1] - SHIRT[1]) < 8 && Math.abs(r[2] - SHIRT[2]) < 8);
  assert.ok(p.length <= F.PALMAX);
  const q = F.tintPaletteAuto(still(scene(true))); const n = q.length; F.tintPaletteAddCoverage(q, [scene(true)], HI); assert.equal(q.length, n, 'already covered: nothing added');
});
test('v210 coverage: thin lines / noise are not an area, a full palette keeps its first, hair, eye and small vivid colours', () => {
  const lines = pic(HI, (x, y) => y % 6 === 0 ? [30, 30, 30] : SKIN); assert.equal(F.tintPaletteAuto(still(lines)).filter(q => q.cover).length, 0);
  const full = Array.from({ length: F.PALMAX }, (_, i) => ({ L: .5, a: .06 + .01 * i, b: .05, share: .02, x: .5, y: .5, rank: i + 1 })), a0 = JSON.stringify(full.map(c => c.a));
  F.tintPaletteAddCoverage(full, [scene(true)], HI); assert.equal(JSON.stringify(full.map(c => c.a)), a0);
});
test('v210 relocate: a colour whose place has none of it moves onto a real spot of it; a big area and hair stay', () => {
  const pal = [{ L: .5, a: .03, b: .04, share: .5, x: .5, y: .5, rank: 1 }, { ...(() => { const [L, a, b] = F.mixToLab(...WALL); return { L, a, b }; })(), share: .05, x: .5, y: .6, rank: 2 }];   // the wall colour is placed on the skin
  F.tintPaletteRelocate(pal, [scene(false)], HI); assert.ok(pal[1].x < .3 || pal[1].x > .7 || pal[1].y < .3, 'moved onto the wall'); assert.equal(pal[0].x, .5);
});
// v211: a small rosy accent (blush, lips) takes the TRUE colour of the pixels around it, not the 2.4 x boosted red.
test('v211 blush: a boosted rosy accent is brought back to the real, dusty rose of its cheek', () => {
  const CHEEK = [134, 86, 80], pic2 = pic(HI, (x, y) => (x >= 40 && x < 56 && y >= 40 && y < 56) ? CHEEK : SKIN);
  const [L, a, b] = F.mixToLab(...CHEEK), pal = [{ L: .6, a: .03, b: .04, share: .9, x: .3, y: .8, rank: 1 }, { L, a: a * 2.4, b: b * 2.4, share: .02, x: 48.5 / HI, y: 48.5 / HI, rank: 2 }];
  F.tintPaletteRelocate(pal, [pic2], HI); const r = F.mixToRgb(pal[1].L, pal[1].a, pal[1].b, 1, 0);
  assert.ok(pal[1].trueTone); assert.ok(r[0] - r[1] < 75 && r[1] > 70, 'pink / rose, not a saturated red: ' + r);
});
// v212: a picture that could only be read at 32 x 32 (no 96 px frames) gets the hair and shirt steps too.
test('v212 low quality: a plain 32 x 32 read still gets the hair colours and a missing shirt area', () => {
  const S = 32, lo = pic(S, (x, y) => { if (y >= 29 && x >= 28) return [120, 150, 105]; if (y < 7) return (x + y) % 5 < 3 ? [112, 85, 58] : [66, 52, 36]; if (y > 10 && x > 9 && x < 22) return SKIN; return WALL; });
  const p = F.tintPaletteAuto(lo); assert.ok(p.some(c => c.hair), 'hair'); const sh = p.find(c => c.cover); assert.ok(sh && sh.y > .8 && sh.x > .8, 'shirt at the bottom right');
  assert.equal(F.tintPaletteAuto(pic(S, () => [200, 60, 60])).length, 1, 'a flat low-quality picture stays one colour');
});
