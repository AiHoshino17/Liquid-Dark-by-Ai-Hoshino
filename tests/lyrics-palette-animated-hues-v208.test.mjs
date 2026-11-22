// v208 palette-hues (Fix A + B): an animated GIF / WebP (hi.frames = [] + detail grid) now also carries up to 24 sampled 96x96 frames (hi.hueFrames) so the hue pass (tintPaletteAddHues) finds a small colour (brown hair) the detail grid alone missed. Fixes C-F are still TODO (see palette_fix_plan.txt).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteAddHues, tintPaletteFreeSlot, tintPaletteIsBlush, tintPaletteGrad, mixToLab, PALN };')();
const hi = fn => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...fn(x, y), 255], (y * HI + x) * 4); return d; };
const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
const frame = hi((x, y) => x > 60 && x < 72 && y > 20 && y < 34 ? [120, 76, 50] : y < 48 ? [230, 215, 160] : [60, 66, 90]);   // beige top, blue-grey bottom, a small brown patch
const anim = hueFrames => { const d = new Uint8ClampedArray(4096), fr = [frame, frame]; d.hi = { frames: [], w: [], detail: detailFromFrames(fr, [1, 1]) }; if (hueFrames) { d.hi.hueFrames = hueFrames; d.hi.hueW = hueFrames.map(() => 1); } return d; };
const hasBrown = p => p.some(c => { const h = hueOf(c); return h > 25 && h < 55 && c.L > .45 && c.L < .65 && Math.hypot(c.a, c.b) > .06; });
test('v208: decode keeps a small sample of frames for the hue pass, and Auto uses it on the animated (detail) path', () => {
  assert.match(M, /out\.hi\.hueFrames = hf; out\.hi\.hueW = hw/); assert.match(M, /tintPaletteAddHues\(pal, d\.hi\.hueFrames, hiW\)/);
});
test('v208: animated input with hueFrames gets the brown; never more than PALN colours; no hueFrames = old behaviour', () => {
  const p = F.tintPaletteAuto(anim([frame, frame, frame]));
  assert.ok(hasBrown(p), 'brown found'); assert.ok(p.length <= F.PALN);
  assert.ok(F.tintPaletteAuto(anim(null)).length <= F.PALN);
});
test('v208: a plain one-colour animated picture gets no invented colours', () => {
  const flat = hi(() => [200, 60, 60]), d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([flat], [1]), hueFrames: [flat, flat], hueW: [1, 1] };
  assert.equal(F.tintPaletteAuto(d).length, 1);
});

// ---- PART 2 (Fix D + Fix C) ----
const dist2 = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6);
const near = (pal, rgb, tol = .05) => { const [L, a, b] = F.mixToLab(...rgb); return pal.some(c => dist2(c, { L, a, b }) < tol); };
const BG = [60, 66, 90], BEIGE = [230, 215, 160], BEIGE2 = [214, 198, 150], BROWN = [120, 76, 50], BLUSH2 = [244, 150, 170], IRIS2 = [120, 70, 170];
const scene = hi((x, y) => { if (x >= 30 && x < 33 && y >= 40 && y < 43) return IRIS2; if (x >= 40 && x < 46 && y >= 52 && y < 57) return BLUSH2; if (x > 66 && x < 78 && y > 10 && y < 24) return BROWN; if (y >= 70) return BG; return y < 36 ? BEIGE : x < 48 ? BEIGE2 : BEIGE; });
const animScene = (...fr) => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([scene], [1]), hueFrames: fr, hueW: fr.map(() => 1) }; return d; };
test('v208 part 2: blush + iris + brown hair + background are ALL in one animated palette (max PALN), a beige look-alike merged', () => {
  const p = F.tintPaletteAuto(animScene(scene, scene, scene));
  assert.ok(p.length <= F.PALN, 'max PALN');
  assert.ok(near(p, BG, .08), 'background kept'); assert.ok(near(p, BROWN, .08), 'brown hair kept'); assert.ok(near(p, BEIGE, .08), 'main beige kept');
  assert.ok(p.some(c => { const h = hueOf(c); return h > 255 && h < 320 && Math.hypot(c.a, c.b) > .08; }), 'iris (purple) found');
  assert.ok(p.some(c => { const h = hueOf(c); return (h < 30 || h > 340) && Math.hypot(c.a, c.b) > .06 && c.L > .6; }), 'blush (pink) kept');
  assert.ok(p.filter(c => { const h = hueOf(c); return h > 40 && h < 110 && c.L > .6; }).length <= 2, 'beige look-alikes merged');
});
test('v208 part 2: a near-grey background is NOT dropped just for being near-grey (Fix D)', () => {
  const a = F.tintPaletteAuto(animScene(scene, scene)); assert.ok(near(a, BG, .08));
});
test('v208 part 2: a true look-alike is merged into the bigger colour, rank 1 is never dropped, a different detail is never dropped', () => {
  const pal = [{ L: .8, a: .02, b: .05, share: .6, rank: 1 }, { L: .7, a: .022, b: .052, share: .1, rank: 2 }, { L: .5, a: .1, b: .02, share: .01, rank: 3 }, { L: .4, a: -.02, b: -.03, share: .2, rank: 4 }, { L: .25, a: .05, b: -.12, share: .09, rank: 5 }];
  assert.ok(F.tintPaletteFreeSlot(pal)); assert.equal(pal.length, 4); assert.ok(Math.abs(pal[0].share - .7) < 1e-9, 'share merged into the bigger colour'); assert.ok(pal.some(c => c.a === .1), 'pink detail kept'); assert.ok(pal.some(c => c.a === -.02), 'background kept');
  assert.equal(F.tintPaletteFreeSlot(pal), false, 'no look-alike left: nothing dropped');
  assert.equal(F.tintPaletteFreeSlot([{ L: .8, a: .02, b: .05, share: .1 }, { L: .8, a: .02, b: .05, share: .5 }].slice(0, 1)), false, 'rank 1 alone is never dropped');
});
test('v208 part 2 (Fix C): candidates rank by difference from the palette: a tiny purple iris beats another big beige bin', () => {
  const big = hi(() => BEIGE), eye = hi((x, y) => x < 3 && y < 3 ? IRIS2 : y > 40 ? [214, 190, 140] : BEIGE);
  const d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([big], [1]), hueFrames: [eye, eye], hueW: [1, 1] };
  assert.ok(F.tintPaletteAuto(d).some(c => { const h = hueOf(c); return h > 255 && h < 320; }));
});
test('v208 part 2: plain one-colour picture, still no invented colour; main.js keeps the grepped decode string', () => {
  const flat = hi(() => [90, 140, 200]), d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([flat], [1]), hueFrames: [flat], hueW: [1] };
  assert.equal(F.tintPaletteAuto(d).length, 1); assert.ok(M.includes('out.hi = { frames: [], w: [], detail: acc.done() }'));
});

// ---- PART 3 (blush protected, hair pick, glow size) ----
test('v208 part 3: a small pink blush is a must-keep colour: FreeSlot never drops it, even next to a similar bigger colour', () => {
  const blush = { L: .68, a: .16, b: .03, share: .007 };
  assert.ok(F.tintPaletteIsBlush(blush)); assert.ok(!F.tintPaletteIsBlush({ L: .68, a: .16, b: .03, share: .2 }), 'a big pink area is not a blush'); assert.ok(!F.tintPaletteIsBlush({ L: .5, a: -.05, b: .05, share: .007 }));
  const pal = [{ L: .8, a: .02, b: .05, share: .6 }, { ...blush }, { L: .66, a: .15, b: .03, share: .2 }];
  F.tintPaletteFreeSlot(pal, true); assert.ok(pal.some(c => c.share === .007), 'blush kept');
});
test('v208 part 3 (Fix F): with ONE free slot a real brown hair shade wins over a 0.03 % bright speck (earring)', () => {
  const sc = hi((x, y) => (x >= 20 && x < 22 && y >= 50 && y < 52) ? [90, 110, 250] : (x > 60 && x < 78 && y > 10 && y < 26) ? BROWN : (x >= 40 && x < 46 && y >= 52 && y < 57) ? BLUSH2 : y >= 70 ? BG : [230, 215, 160]);
  const d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([sc], [1]), hueFrames: [sc, sc], hueW: [1, 1] };
  const p = F.tintPaletteAuto(d); assert.ok(p.length <= F.PALN); assert.ok(near(p, BROWN, .09), 'brown hair kept'); assert.ok(near(p, BG, .08), 'background kept'); assert.ok(p.some(c => F.tintPaletteIsBlush(c)), 'blush kept');
});
test('v208 part 3: the glow of a small colour grows with its share, a blush gets a clearly visible glow', () => {
  const base = [{ L: .7, a: .02, b: .05, share: .8, x: .5, y: .5 }, { L: .5, a: -.03, b: .03, share: .1, x: .2, y: .5 }, { L: .5, a: .06, b: .0, share: .08, x: .8, y: .5 }];   // v244: was L .4 (a dark neutral, now its own dark glow) and then L .5 with chroma .02 (a light grey, now an accent drawn first); a plain mid colour keeps the test about the small colours' sizes
  const g = (share, a, b) => F.tintPaletteGrad([...base, { L: .6, a, b, share, x: .8, y: .9 }]), speck = g(.0003, .02, -.14), hair = g(.015, .08, .07), blushG = g(.007, .15, .03);
  const w = s => Number(/radial-gradient\((\d+)% /.exec(s)[1]); assert.ok(w(hair) > w(speck)); assert.ok(w(blushG) > w(speck) && w(blushG) <= 48, 'blush glow is a bit bigger than a speck glow but stays SMALL (owner: blush and purple are small colours)');
});
