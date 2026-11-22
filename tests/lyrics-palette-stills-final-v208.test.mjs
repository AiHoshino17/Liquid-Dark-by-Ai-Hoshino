// v208 final (palette PART 7): a STILL picture (1 frame) now also gets the eye / dark hair / earring / iris steps, but ONLY into free slots: it never drops, re-ranks or recolours a colour the picture already has (an animated file still does, as before).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteAddExtras, tintPaletteAddIris, tintPaletteAddEyes, tintPaletteMergeKin, PALN, PALMAX };')();
const pic = (S, fn) => { const d = new Uint8ClampedArray(S * S * 4); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) d.set([...fn(x, y), 255], (y * S + x) * 4); return d; };
const BEIGE = [230, 215, 160], WALL = [60, 70, 100], HAIR = [38, 34, 36], EAR = [60, 80, 230];
const scene = () => pic(HI, (x, y) => { if (x >= 60 && x < 64 && y >= 60 && y < 64) return EAR; if (x < 20) return HAIR; return y < 50 ? BEIGE : WALL; });
const still = (fr, eye) => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [fr], w: [1], detail: detailFromFrames([fr], [1]) }; if (eye) d.hi.eyeFrames = [eye]; return d; };
test('v208 stills: wiring (the still path calls the eye / extras / iris steps; tintImagePx keeps a 192 px copy)', () => {
  assert.match(M, /tintPaletteAddExtras\(tintPaletteAddEyes\(d\.hi\.anim \? tintPaletteMergeKin\(hu\) : hu/); assert.match(M, /const hu = tintPaletteAddHues\(d\.hi\.detail \? tintPaletteAddAccents/);
  assert.match(M, /d\.hi\.eyeFrames = \[tintGrabHi\(im, 192\)\]/);
  assert.ok(M.includes('out.hi = { frames: [], w: [], detail: acc.done() }'));
});
test('v208 stills: a dark hair mass and a vivid earring of a single picture reach a free slot', () => {
  const p = F.tintPaletteAuto(still(scene()));
  assert.ok(p.length <= F.PALMAX);
  assert.ok(p.some(c => c.L < .3 && Math.hypot(c.a, c.b) < .08), 'dark hair colour');
  assert.ok(p.some(c => Math.hypot(c.a, c.b) > .15 && c.x > .55 && c.y > .55), 'earring colour where it sits');
});
test('v208 stills: a full palette is never changed by the extra steps (nothing dropped, no re-rank, no recolour)', () => {
  const full = Array.from({ length: F.PALMAX }, (_, i) => ({ L: .8 - i * .05, a: .02 * i, b: .05 - .01 * i, share: .5 / (i + 1), x: .5, y: .5, rank: i + 1 }));
  const before = JSON.stringify(full), fr = scene(); F.tintPaletteAddEyes(full, [fr]); F.tintPaletteAddExtras(full, [fr]); F.tintPaletteAddIris(full, [pic(192, (x, y) => x < 90 ? [90, 95, 40] : [252, 252, 252])], 192);
  assert.equal(JSON.stringify(full), before);
});
test('v208 stills: a plain one-colour still gets no invented colour', () => {
  const flat = pic(HI, () => [200, 60, 60]); assert.equal(F.tintPaletteAuto(still(flat, pic(192, () => [200, 60, 60]))).length, 1);
});

// false-eye guards found on 1000314750.gif (a blue bed stripe at the top edge, an orange-red skin shadow and a blush spot were all taken for eyes)
const p192 = (fn) => pic(192, fn);
test('v208 iris/eye guards: a blob in the outer 6 % of the picture, a reddish (orange) shadow, and a pink blush are not eyes', () => {
  const OLIVE = [90, 95, 40], WHITE = [252, 252, 252], SKIN = [240, 205, 170];
  const eye = (y0) => p192((x, y) => (x >= 90 && x < 96 && y >= y0 && y < y0 + 6) ? OLIVE : (x >= 96 && x < 104 && y >= y0 - 1 && y < y0 + 7) ? WHITE : SKIN);
  const base = () => [{ L: .8, a: .01, b: .05, share: .8, x: .5, y: .5, rank: 1 }];
  const mid = base(); F.tintPaletteAddIris(mid, [eye(90)], 192); assert.ok(mid.some(c => c.eye), 'an eye in the middle is found');
  const top = base(); F.tintPaletteAddIris(top, [eye(2)], 192); assert.equal(top.length, 1, 'the same blob at the top edge is not an eye');
  const shadow = base(); F.tintPaletteAddEyes(shadow, [pic(HI, (x, y) => (x >= 40 && x < 44 && y >= 40 && y < 44) ? [190, 120, 100] : [240, 205, 170])]); assert.equal(shadow.length, 1, 'an orange-red shadow is not a plum eye');
});

// owner: "the skin colour appears too many times, the bed and shirt blues are wrong": an animated picture reads its core colours from its real frames, and a small same-family shade is merged
test('v208 kin merge: a small saturated shade of a big colour of the same hue family is merged; blush, eyes and other hues stay; the first colour stays', () => {
  const pal = [{ L: .83, a: .02, b: .05, share: .4, x: .5, y: .5, rank: 1 }, { L: .74, a: .06, b: .1, share: .03, x: .4, y: .6, rank: 2 }, { L: .67, a: -.02, b: -.05, share: .11, x: .7, y: .3, rank: 3 }, { L: .83, a: .13, b: .03, share: .002, x: .5, y: .47, rank: 4 }, { L: .43, a: .01, b: .08, share: 0, x: .45, y: .39, eye: true, rank: 5 }];
  F.tintPaletteMergeKin(pal); assert.equal(pal.length, 4, 'the salmon shade is gone'); assert.ok(Math.abs(pal[0].share - .43) < 1e-9, 'its share went to the big colour'); assert.ok(pal.some(c => c.eye) && pal.some(c => c.b < 0) && pal.some(c => c.a > .1), 'eye, blue and blush are kept');
});
test('v208 animated core: the core colours of an animated picture come from its kept frames (the bed blue is a colour of its own)', () => {
  const SKIN = [249, 221, 201], BED = [130, 151, 173], SHIRT = [219, 245, 250];
  const scn = () => pic(HI, (x, y) => x < 30 ? BED : y > 60 ? SHIRT : SKIN); const fr = Array.from({ length: 6 }, scn);
  const d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([fr[0]], [1]), hueFrames: fr, hueW: fr.map(() => 1) };
  const p = F.tintPaletteAuto(d); assert.ok(p.some(c => c.b < -.02 && c.L < .75 && c.x < .4), 'bed blue'); assert.ok(p.some(c => c.L > .85 && c.y > .6), 'pale shirt'); assert.ok(p.length <= F.PALMAX);
});
